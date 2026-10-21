"""Bind own lips to every actual body source slot; source/CPU evidence only.

The existing shader remains authoritative for rounding/bite and media ownership.
"""
from pathlib import Path
from copy import deepcopy
import argparse,hashlib,importlib.util,json,sys
import numpy as np
from PIL import Image,ImageDraw,ImageFont
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def load(name,p):
    s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def run(index_path,index_sha,out):
    index_path=index_path.resolve();out=out.resolve()
    assert index_path.is_relative_to(ROOT) and out.is_relative_to(ROOT/'output')
    assert sha(index_path)==index_sha
    index=json.loads(index_path.read_text());assert index['identity']=='stadt-hannelore-sparkasse' and index['grid']==[16,32]
    assert len(index['cells'])==470
    out.mkdir(parents=True,exist_ok=False);(out/'direct').mkdir();(out/'opened').mkdir();(out/'pages').mkdir()
    pins=dict(index['inputPins']);pins[index_path.relative_to(ROOT).as_posix()]=index_sha
    for path in (Path(__file__),HERE/'profiles.json',HERE/'compiled.json',HERE/'transport-fields-v1.py',
                 ROOT/'tools/build-street-mouths.py',ROOT/'tools/build-street-character-sprites.py',
                 ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py'):
        pins[path.relative_to(ROOT).as_posix()]=sha(path)
    assert sha(HERE/'profiles.json')=='ab34ec2b80c97020d1498ffea1edbfce08bc227dcfa46d0f319525f2875e2109'
    assert sha(HERE/'compiled.json')=='cf1b509af687861d1e31eb34f20305e398e2e40ba90126f75beebc828f332570'
    profiles=json.loads((HERE/'profiles.json').read_text())['registrations'];compiled=json.loads((HERE/'compiled.json').read_text())['registrations']
    for row in json.loads((HERE/'input-pins.json').read_text())['rows']:
        path=ROOT/row['file'];assert sha(path)==row['sha256'];pins[row['file']]=row['sha256']
    lip=load('hannelore_family_lip_transport',HERE/'transport-fields-v1.py')
    mouth=load('hannelore_family_cpu_lips',ROOT/'tools/build-street-mouths.py')
    street=load('hannelore_family_direct',ROOT/'tools/build-street-character-sprites.py')
    paint=load('hannelore_family_head_field',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py')
    files={};frames=[None]*512;records=[];tiles={512:[],96:[],64:[]};seen=set();yy,xx=np.mgrid[:512,:512]
    def save(im,name):
        path=out/name;im.save(path);files[name]=sha(path)
    for cell in index['cells']:
        row,col=cell['row'],cell['col'];slot=row*16+col;assert 0<=row<32 and 0<=col<16 and slot not in seen;seen.add(slot)
        key=f'{row:02}-{col:02}';heading=cell['heading'];path=ROOT/cell['source']['file']
        assert sha(path)==cell['source']['sha256'];pins[cell['source']['file']]=cell['source']['sha256']
        frame=Image.open(path).convert('RGBA');assert frame.size==(512,512)
        field=cell['upper'];assert field['sourceSize']==[512,512]
        if profiles[heading] is None:
            assert heading=='up';records.append({'slot':slot,'heading':heading,'explicitRearNull':True});continue
        reg,moved,proof=lip.transport(profiles[heading],compiled[heading],field)
        moved['input']={'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'dimensions':[512,512]}
        original=Image.open(ROOT/profiles[heading]['input']['file']).convert('RGBA')
        warped=paint.warp_layer(original,field['nodes_y'],field['dx'],field['dy'])
        axes=np.asarray(moved['axesPx']).reshape(2,2).T
        local=(np.stack([xx,yy],axis=-1)-moved['centerPx'])@np.linalg.inv(axes).T
        support=(abs(local[:,:,0])<2)&(local[:,:,1]>=-1.6)&(local[:,:,1]<=3)
        assert np.array_equal(np.asarray(frame)[support],np.asarray(warped)[support]),key
        proof['actualSourceSupportPixelsExact']=int(support.sum());checks={}
        for width in (512,96,64):
            if width==512:image,entry=frame,moved
            else:
                q=width/128;scale=137*q/400;origin=np.array([64*q,150*q])-np.array([256,472])*scale
                image=street.export_cell(frame,{'cell':[width,int(width*1.25)],'pivot':[64*q,150*q],
                    'figureHeight':137*q,'working':{'figureHeight':400,'baseline':472}})
                name=f'direct/{key}-{width}.png';save(image,name)
                entry={**moved,'input':{'file':(out/name).relative_to(ROOT).as_posix(),'sha256':sha(out/name),'dimensions':list(image.size)},
                    'cell':list(image.size),'centerPx':(np.array(moved['centerPx'])*scale+origin).tolist(),
                    'axesPx':(np.array(moved['axesPx'])*scale).tolist(),
                    'contoursPx':{k:(np.array(v)*scale+origin).tolist() for k,v in moved['contoursPx'].items()}}
            closed,opened=mouth.preview(entry,reg,0),mouth.preview(entry,reg,1)
            assert closed.tobytes()==image.tobytes(),key
            assert opened.getchannel('A').tobytes()==image.getchannel('A').tobytes(),key
            changed=int(np.count_nonzero(np.any(np.asarray(opened)[:,:,:3]!=np.asarray(image)[:,:,:3],axis=2)))
            assert changed>0,key
            name=f'opened/{key}-{width}.png';save(opened,name)
            checks[str(width)]={'closedExactRgba':True,'openAlphaExact':True,'changedRgbPixels':changed}
            # Keep only small local crops in RAM; full pixels remain hash-bound.
            cx,cy=map(int,entry['centerPx']);rx,ry=(45,20) if width==512 else (14,7)
            box=(cx-rx,cy-ry,cx+rx,cy+ry)
            tiles[width].append((key,cell['kind'],image.crop(box),opened.crop(box)))
        frames[slot]=reg;records.append({'slot':slot,'heading':heading,'transport':proof,'field':field,'sizes':checks})
        if len(records)%32==0:print(str(len(records))+' slots checked',flush=True)
    font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14)
    for width,rows in tiles.items():
        for theme,bg,fg in [('light','#eee8db','#111'),('dark','#25272b','#eee')]:
            for start in range(0,len(rows),12):
                board=Image.new('RGB',(800,12*105),bg);d=ImageDraw.Draw(board)
                for row,(key,kind,a,b) in enumerate(rows[start:start+12]):
                    d.text((4,row*105+5),key+' '+kind,font=font,fill=fg)
                    for col,pic in enumerate((a,b)):
                        flat=Image.alpha_composite(Image.new('RGBA',pic.size,bg),pic).convert('RGB');z=2 if width==512 else 5
                        board.paste(flat.resize((pic.width*z,pic.height*z),Image.Resampling.NEAREST),(225+col*280,row*105+12))
                save(board,f'pages/face-{width}-{theme}-{start//12:02}.png')
    for name,digest in pins.items():assert sha(ROOT/name)==digest,name
    visible=sum(x is not None for x in frames)
    assert sum(not x.get('explicitRearNull',False) for x in records)==visible
    result={'status':'FULL_BODY_SOURCE_CPU_MOUTHS_PENDING_INDEPENDENT_ART_NOT_ADMITTED','identity':index['identity'],
        'grid':[16,32],'selectedCells':470,'visible':visible,'occupiedRearNull':470-visible,'unusedNull':42,
        'standing':{k:deepcopy(compiled['standing'][k]) for k in ('rect','axes','profile')},
        'frames':frames,'records':records,'inputPins':pins,'files':files,
        'limits':['Scalar0/1 CPU only; round/bite/spread/shader/media remain unproved',
                  'No encoded atlas, native cadence/stride or independent world approval']}
    (out/'family-mouths.json').write_text(json.dumps(result,indent=2,allow_nan=False)+'\n')
    print(json.dumps({'slots':470,'visible':visible,'files':len(files),'receipt':sha(out/'family-mouths.json')}))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--body-index',type=Path,required=True);p.add_argument('--body-index-sha',required=True);p.add_argument('--outdir',type=Path,required=True)
    a=p.parse_args();run(a.body_index,a.body_index_sha,a.outdir)
