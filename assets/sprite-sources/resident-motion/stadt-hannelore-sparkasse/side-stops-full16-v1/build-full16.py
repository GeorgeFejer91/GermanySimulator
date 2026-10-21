"""Render all own side phase-entry stops from the source-only family API.

Evidence only. Existing key poses must be exact; art and native gates separate.
"""
from pathlib import Path
import argparse,hashlib,importlib.util,json,sys
import numpy as np
from PIL import Image,ImageDraw,ImageFont
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def load(name,p):
    s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def run(out):
    assert out.is_relative_to(ROOT/'output')
    out.mkdir(parents=True,exist_ok=False)
    api=HERE.parent/'walk-source-v3/source_fields.py'
    key=ROOT/'output/ambient-city-animation/hannelore-sparkasse-side-stop-eight-v1/candidate-v4'
    assert sha(key/'final-receipt.json')=='0248a503c41492704f4761d3bc71cd5988c441892fa9788a18b681f16cce82bc'
    frozen=json.loads((key/'final-receipt.json').read_text())
    pins={**frozen['inputPins']}
    for name,digest in frozen['files'].items():
        path=key/name;assert sha(path)==digest
        pins[path.relative_to(ROOT).as_posix()]=digest
    for path in (Path(__file__),api,key/'final-receipt.json'):
        pins[path.relative_to(ROOT).as_posix()]=sha(path)
    actor=load('hannelore_all_side_stops',api).HanneloreFields()
    exporter=load('hannelore_all_side_export',ROOT/'tools/build-street-character-sprites.py')
    files={};paths=[];font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14)
    def save(im,name):
        im.save(out/name);files[name]=sha(out/name)
    for h in ('right','left'):
        neutral=actor.neutral(h)
        for phase in range(16):
            walk,_=actor.walk(h,phase);frames=[walk];stages=[]
            for stage in range(8):
                image,record=actor.stop(h,phase,stage)
                name=f'{h}-{phase:02}-stage{stage}'
                a=np.array(image);assert np.where(a[:,:,3]>=20)[0].max()+1==472
                assert all(p['rootCapNotCoveredByUpperAlpha200']==0 for p in record['limbs'])
                assert not np.any(a[a[:,:,3]==0,:3])
                save(image,name+'.png')
                for w in (96,64):
                    q=w/128
                    direct=exporter.export_cell(image,{'cell':[w,int(w*1.25)],'pivot':[64*q,150*q],
                        'figureHeight':137*q,'working':{'figureHeight':400,'baseline':472}})
                    save(direct,f'{name}-{w}.png')
                if phase in (0,4,8,12):
                    for suffix in ('.png','-96.png','-64.png'):
                        assert sha(out/(name+suffix))==sha(key/(name+suffix)),name+suffix
                frames.append(image);stages.append({'stage':stage,**record})
            assert image.tobytes()==neutral.tobytes()
            frames.append(neutral)
            for theme,bg,fg in [('light','#eee8db','#111'),('dark','#25272b','#eee')]:
                board=Image.new('RGB',(1400,940),bg);draw=ImageDraw.Draw(board)
                for i,im in enumerate(frames):
                    c,r=i%5,i//5;flat=Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB')
                    label='walk' if i==0 else ('neutral' if i==9 else f'stop{i-1}')
                    draw.text((c*280+4,r*470+4),f'{h} p{phase} '+label,font=font,fill=fg)
                    board.paste(flat.resize((256,256)),(c*280+4,r*470+30))
                    board.paste(flat.crop((135,330,380,480)),(c*280+4,r*470+310))
                save(board,f'{h}-{phase:02}-{theme}.png')
            paths.append({'direction':h,'phase':phase,'stages':stages})
            print(h+' p'+str(phase)+' built',flush=True)
    for name,digest in pins.items():assert sha(ROOT/name)==digest,name
    result={'status':'ALL_SIDE_SOURCE_PENDING_ART_REVIEW_NOT_ADMITTED','inputPins':pins,'files':files,
            'paths':paths,'working':256,'direct':512,'goldenWorkingExact':64,'goldenDirectExact':128,
            'limits':['Key candidate independent review may still HOLD','No encoded/native stride/cadence/mouth/media/world approval']}
    (out/'source.json').write_text(json.dumps(result,indent=2,allow_nan=False)+'\n')
    print(json.dumps({'receipt':sha(out/'source.json'),'files':len(files),'paths':len(paths)}))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--outdir',type=Path,required=True)
    run(p.parse_args().outdir.resolve())
