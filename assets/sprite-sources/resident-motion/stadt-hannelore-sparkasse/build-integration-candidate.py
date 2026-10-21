"""Assemble one ignored Hannelore candidate using actual own source bindings.

Reuse existing exporters, manifest schema and selective delivery. No admission.
"""
from pathlib import Path
from copy import deepcopy
import argparse,hashlib,importlib.util,json,math,sys
from PIL import Image
ROOT=Path(__file__).resolve().parents[4]
HERE=Path(__file__).resolve().parent
ID='stadt-hannelore-sparkasse'
ORDER=('down','right','up','left')
COLS,ROWS=16,32
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write(path,value):path.write_text(json.dumps(value,separators=(',',':'),allow_nan=False)+'\n')
def load(name,p):
    s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def stop_slots(direction,phase):
    rows={'down':[9,10,11,12],'up':[13,14,15,17],'right':list(range(18,25)),'left':list(range(25,32))}[direction]
    count=4 if direction in ('down','up') else 7
    available=[(r,c) for r in rows for c in range(16)]
    return available[phase*count:(phase+1)*count]

def build(a):
    out=a.outdir.resolve();assert out.is_relative_to(ROOT/'output')
    assert math.isfinite(a.stride_distance) and a.stride_distance>0
    inputs={}
    def pin(p,expected=None):
        p=p.resolve();assert p.is_relative_to(ROOT)
        value=sha(p)
        if expected is not None:assert value==expected,str(p)
        inputs[p.relative_to(ROOT).as_posix()]=value
        return p
    pin(a.body_index,a.body_index_sha);pin(a.mouths,a.mouths_sha)
    body=json.loads(a.body_index.read_text());mouths=json.loads(a.mouths.read_text())
    assert body['identity']==mouths['identity']==ID and body['grid']==mouths['grid']==[16,32]
    assert len(body['cells'])==mouths['selectedCells']==470 and len(mouths['frames'])==512
    for document in (body,mouths):
        for rel,digest in document['inputPins'].items():pin(ROOT/rel,digest)
    manifest=pin(ROOT/'assets/characters/street/manifest.json')
    published=json.loads(manifest.read_text())['characters'][ID]
    assert published['standing']['sha256']=='10f00a68ec8e46e62be8beeb3dcc0e4818e3a8ae657844f48b04992d0b83272e'
    assert (published['cell'],published['pivot'],published['figureHeight'],published['figureWorldHeight'])==([128,160],[64,150],136,1.6)
    pin(ROOT/published['standing']['file'].removeprefix('./'),published['standing']['sha256'])
    pin(Path(__file__));exporter=pin(ROOT/'tools/build-street-character-sprites.py')
    street=load('hannelore_candidate_export',exporter)
    paint=street.paint
    sources={}
    for cell in body['cells']:
        slot=(cell['row'],cell['col']);assert slot not in sources
        pin(ROOT/cell['source']['file'],cell['source']['sha256']);sources[slot]=cell
    required={(r,c) for r in range(4) for c in range(16)}|{(8,c) for c in range(8)}|{(16,c) for c in range(16)}
    for i,d in enumerate(ORDER):
        required|={(i+4,c) for c in range(2,8 if d in ('down','up') else 11)}
        for phase in range(16):
            for slot in stop_slots(d,phase):
                required.add(slot)
                cell=sources[slot];assert cell['heading']==d and cell['entryPhase']==phase
    assert set(sources)==required and len(required)==470
    out.mkdir(parents=True,exist_ok=False)
    base='./assets/characters/residents/'+ID+'/delivery-v1/'
    variants={};checks={}
    for name,w in [('desktop',a.desktop_width),('mobile',64)]:
        h=int(w*1.25);q=w/128;atlas=Image.new('RGBA',(COLS*w,ROWS*h));exports={};gutters=[]
        for (row,col),cell in sources.items():
            im=street.export_cell(Image.open(ROOT/cell['source']['file']).convert('RGBA'),
                {'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':137*q,'working':{'figureHeight':400,'baseline':472}})
            bbox=im.getchannel('A').getbbox();assert bbox
            gutters.append(min(bbox[0],bbox[1],w-bbox[2],h-bbox[3]));atlas.paste(im,(col*w,row*h));exports[row,col]=im
        assert min(gutters)>=2
        path=out/f'source-{name}.webp';atlas.save(path,lossless=True,exact=True,method=4)
        decoded=Image.open(path).convert('RGBA');assert decoded.tobytes()==atlas.tobytes()
        for (row,col),im in exports.items():assert decoded.crop((col*w,row*h,(col+1)*w,(row+1)*h)).tobytes()==im.tobytes()
        variants[name]={'file':base+path.name,'sha256':sha(path),'width':atlas.width,'height':atlas.height}
        checks[name]={'selectedCellsExact':470,'minimumGutter':min(gutters),'paintFigureHeight':137*q,'transferBytes':path.stat().st_size}
    frames=mouths['frames']
    assert all(frames[r*16+c] is None for r in range(32) for c in range(16) if (r,c) not in sources)
    lip={'schemaVersion':1,'id':ID,'cell':[128,160],'grid':[16,32],
        'sources':{'standing':published['standing']['sha256'],**{n:v['sha256'] for n,v in variants.items()}},
        'standing':mouths['standing'],'frames':frames}
    write(out/'mouths-v1.json',lip)
    walks={d:{'row':i,'frames':16,'frame_ms':64,'loop':True} for i,d in enumerate(ORDER)}
    bridges={}
    for i,d in enumerate(ORDER):
        last=6 if d in ('down','up') else 9
        bridges[d]={'row':i+4,'stop_cols':list(range(last,2,-1))+[2],
            'start_cols':list(range(3,last+2)),'frame_ms':60}
    turns=[{'row':8,'col':i} for i in range(8)];anchors={d:i*2 for i,d in enumerate(ORDER)}
    transitions={a+'-to-'+b:{'frames':paint.plan_transition(a,b,walks,bridges,turns,anchors,turn_ms=85)} for a in ORDER for b in ORDER if a!=b}
    settles={}
    for i,d in enumerate(ORDER):
        settles[d]={}
        for phase in range(16):
            seq=[{'row':r,'col':c,'ms':60} for r,c in stop_slots(d,phase)]
            seq.append({'row':i+4,'col':2,'ms':60});settles[d][str(phase)]={'frames':seq}
    states={name:{'row':16,'col':0,'durations_ms':[80]*16,'loop':False,'next':'neutral'} for name in ('greet','work','review')}
    states.update({name:{'row':4,'col':2,'durations_ms':[ms],'loop':False,'next':'neutral'} for name,ms in [('look',80),('wait',600),('success',300),('failure',300)]})
    person={k:deepcopy(published[k]) for k in ('id','aliases','cell','pivot','figureHeight','figureWorldHeight','standing')}
    person.update(standingOnly=False,grid=[16,32],strideDistance=a.stride_distance,variants=variants,
        clips={d:{'offset':i*16,'count':16,'seconds':1.024} for i,d in enumerate(ORDER)},
        atlasMotion={'schemaVersion':1,'walks':walks,'bridges':bridges,'transitions':transitions,'settles':settles,
            'neutral':{'row':4,'col':2},'interactions':{'neutral':{'row':4,'col':2},'states':states}},
        mouthPaint={'file':base+'mouths-v1.json','sha256':sha(out/'mouths-v1.json')})
    person['clips']['idle']={'offset':4*16+2,'count':1,'seconds':1}
    write(out/'person.json',person)
    for rel,digest in inputs.items():assert sha(ROOT/rel)==digest,rel
    receipt={'status':'IGNORED_FULL_SOURCE_CANDIDATE_PACKED_NATIVE_WORLD_PENDING','id':ID,'inputFiles':inputs,
        'selectedCells':470,'logicalCells':512,'visibleMouths':mouths['visible'],'nullMouths':512-mouths['visible'],
        'strideDistance':a.stride_distance,'strideStatus':'candidate, exact encoded assessment required',
        'timings':'64ms walk/60ms stop+start/85ms turn/80ms gesture candidate; native not approved',
        'exportChecks':checks,'outputs':{name:sha(out/name) for name in ('source-desktop.webp','source-mobile.webp','mouths-v1.json','person.json')}}
    write(out/'compile-receipt.json',receipt)
    print(json.dumps({k:receipt[k] for k in ('status','selectedCells','visibleMouths','exportChecks')}))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('body-index','mouths','outdir'):p.add_argument('--'+name,type=Path,required=True)
    for name in ('body-index-sha','mouths-sha'):p.add_argument('--'+name,required=True)
    p.add_argument('--desktop-width',type=int,choices=(80,96),default=80)
    p.add_argument('--stride-distance',type=float,required=True);build(p.parse_args())
