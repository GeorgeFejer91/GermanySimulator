"""Measure own named planted feet in actual direct cells, optionally encoded.

Foot samples stay tied to the same source support; hidden named feet are omitted.
"""
from pathlib import Path
import argparse,hashlib,importlib.util,json,sys
import numpy as np
from PIL import Image
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def load(name,p):
    s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def marker(full,role,x,y):
    a,b=np.array(full),np.array(role);options=[]
    for py in range(max(0,round(y)-4),min(full.height,round(y)+5)):
        for px in range(max(0,round(x)-1),min(full.width,round(x)+2)):
            delta=int(np.max(np.abs(a[py,px].astype(int)-b[py,px].astype(int))))
            if abs(px-x)<=.51 and b[py,px,3]>=160 and a[py,px,3]>=160 and delta<=8:
                options.append(((px-x)**2+(py-y)**2,-py,px,py,delta))
    if not options:return None
    _,_,px,py,delta=min(options)
    return {'pixel':[px,py],'rgba':a[py,px].tolist(),'projectedFixedSourceWitness':[x,y],
        'quantizationXErrorPx':px-x,'namedRoleVisibleRgbaMaxDifference':delta}

def run(out,encoded):
    out=out.resolve();assert out.is_relative_to(ROOT/'output');out.mkdir(parents=True,exist_ok=False)
    folder=ROOT/'output/ambient-city-animation/hannelore-sparkasse-side-loop-v1/candidate-v1'
    path=folder/'source-loop.json';assert sha(path)=='78daa5d6819241673b387bf8e8cb423d21506d7ae7868d880750d1880c976df4'
    raw=json.loads(path.read_text());pins={path.relative_to(ROOT).as_posix():sha(path)}
    for rel,digest in raw['inputPins'].items():assert sha(ROOT/rel)==digest;pins[rel]=digest
    method=ROOT/'.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py'
    exporter=ROOT/'tools/build-street-character-sprites.py';assess=load('hannelore_stride_method',method);street=load('hannelore_stride_export',exporter)
    for p in (Path(__file__),method,exporter):pins[p.relative_to(ROOT).as_posix()]=sha(p)
    evidence=[];omissions=[];inputs=[];fits=[]
    proposed=48*137/400/136*1.6*50
    for h in ('right','left'):
        sign=1 if h=='right' else -1
        for variant,width in [('desktop',96),('mobile',64)]:
            q=width/128;scale=137*q/400;origin=np.array([64*q,150*q])-np.array([256,472])*scale
            game_per_pixel=1.6/136/q*50;cells=[]
            atlas=None
            if encoded is not None:
                ep=encoded/f'source-{variant}.webp';atlas=Image.open(ep).convert('RGBA');assert atlas.size==(16*width,32*int(width*1.25));pins[ep.relative_to(ROOT).as_posix()]=sha(ep)
            for phase in range(16):
                p=folder/f'direct-{width}/{h}-{phase:02}.png';assert sha(p)==raw['files'][p.relative_to(folder).as_posix()];pins[p.relative_to(ROOT).as_posix()]=sha(p)
                image=Image.open(p).convert('RGBA')
                if atlas is not None:
                    row=1 if h=='right' else 3;actual=atlas.crop((phase*width,row*image.height,(phase+1)*width,(row+1)*image.height));assert actual.tobytes()==image.tobytes()
                cells.append(image)
            strip=Image.new('RGBA',(16*width,int(width*1.25)))
            for phase,im in enumerate(cells):strip.paste(im,(phase*width,0))
            strip_path=out/f'{h}-{variant}.png';strip.save(strip_path);contacts=[]
            for limb,limb_index,phases in [('near',0,range(0,9)),('far',1,range(8,17))]:
                samples=[]
                for unwrapped in phases:
                    phase=unwrapped%16;field=raw['sides'][h][phase]['limbs'][limb_index]
                    assert abs(field['rotationDegrees'])<1e-9 and abs(field['dy'][-1])<1e-9
                    w=field['fixedSoleWitnesses']['support'];x,y=np.array(w['transportedPoint'])*scale+origin
                    rp=folder/f'isolated/{h}-{phase:02}-{limb}.png';assert sha(rp)==raw['files'][rp.relative_to(folder).as_posix()];pins[rp.relative_to(ROOT).as_posix()]=sha(rp)
                    own=street.export_cell(Image.open(rp).convert('RGBA'),{'cell':[width,int(width*1.25)],'pivot':[64*q,150*q],
                        'figureHeight':137*q,'working':{'figureHeight':400,'baseline':472}})
                    found=marker(cells[phase],own,x,y)
                    if found is None:
                        omissions.append({'heading':h,'variant':variant,'limb':limb,'phase':phase,'unwrapped':unwrapped,'reason':'Same fixed source-X named-foot marker occluded or fails alpha/material qualification'});continue
                    samples.append({'frame':unwrapped,'along_pixels':sign*found['pixel'][0]})
                    evidence.append({'heading':h,'variant':variant,'limb':limb,'phase':phase,'unwrapped':unwrapped,
                        'fixedSourceSolePoint':w['sourcePoint'],'fullDirectSha256':sha(folder/f'direct-{width}/{h}-{phase:02}.png'),**found})
                assert len(samples)>=3,(h,variant,limb,len(samples));contacts.append({'foot':limb,'samples':samples})
            row={'character':'stadt-hannelore-sparkasse','view':h+'-'+variant,'atlas_file':strip_path.name,'atlas_sha256':sha(strip_path),
                'frames_per_cycle':16,'game_units_per_pixel':game_per_pixel,'current_cycle_distance':proposed,
                'shoe_length_pixels':91*scale,'contacts':contacts}
            fit=assess.assess(row);numerator=denominator=0
            for contact in contacts:
                phases=[p['frame'] for p in contact['samples']];mean=sum(phases)/len(phases)
                numerator+=sum(abs(v-mean) for v in phases);denominator+=sum((v-mean)**2 for v in phases)
            fit['worstCaseHalfPixelCycleDistanceUncertaintyGameUnits']=.5*numerator/denominator*16*game_per_pixel
            fit['oneFrameHoldDisplacementAtProposedGameUnits']=proposed/16;inputs.append(row);fits.append(fit)
    for rel,digest in pins.items():assert sha(ROOT/rel)==digest,rel
    result={'status':'DIRECT_SOURCE_NAMED_PLANTING_MEASUREMENT' if encoded is None else 'EXACT_ENCODED_SOURCE_ATLAS_NAMED_PLANTING_MEASUREMENT',
        'identity':'stadt-hannelore-sparkasse','continuousFieldCandidateCycleDistance':proposed,'assessments':fits,'measurements':inputs,
        'witnesses':evidence,'omittedOccludedSoles':omissions,'inputPins':pins,
        'qualification':'Marker X remains within.51 exported px of fixed original support. Same named-role alpha>=160/materialRGBAwithin8 required; up to4px vertical search only identifies that original rigid shoe surface, never another foot. Pixel-centre fit uncertainty reported.',
        'limits':['No world/native planting proof','Packed source equality, actualUV selection/cadence and camera/device remain separate']}
    (out/'assessment.json').write_text(json.dumps(result,indent=2,allow_nan=False)+'\n')
    print(json.dumps({'receipt':sha(out/'assessment.json'),'candidate':proposed,'fits':[(r['view'],r['fitted_cycle_distance'],r['worstCaseHalfPixelCycleDistanceUncertaintyGameUnits']) for r in fits],'omitted':len(omissions),'markers':len(evidence)}))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--outdir',type=Path,required=True);p.add_argument('--encoded-dir',type=Path);a=p.parse_args();run(a.outdir,a.encoded_dir.resolve() if a.encoded_dir else None)
