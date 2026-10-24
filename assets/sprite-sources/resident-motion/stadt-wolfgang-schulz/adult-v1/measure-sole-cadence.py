"""Fit the exact own-source RGB sole witnesses in native exported cells."""
from pathlib import Path
import hashlib,importlib.util,json,math
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/wolfgang-end-to-end';OUT=WORK/'sole-cadence'
MARKS={'right':{'point':[244,464],'row':1,'travel':1},'left':{'point':[278,465],'row':3,'travel':-1}}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
def main():
 OUT.mkdir(parents=True,exist_ok=True)
 pilot=load('wolfgang_own_sole_field',HERE/'pilot-motion.py')
 street=load('wolfgang_own_sole_export',ROOT/'tools/build-street-character-sprites.py')
 method=load('wolfgang_own_sole_assessment',ROOT/'.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py')
 index_path=WORK/'full-working/body-index.json';index=json.loads(index_path.read_text());cases=[];observations=[];encoded_pins={}
 for heading,mark in MARKS.items():
  original=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA');rgba=np.array(original);x,y=mark['point']
  patch=np.zeros_like(rgba);patch[y-2:y+3,x-2:x+3]=rgba[y-2:y+3,x-2:x+3]
  assert patch[y-2:y+3,x-2:x+3,3].min()>=200
  for name,width,height in [('desktop',96,120),('mobile',64,80)]:
   selected=ROOT/'assets/characters/residents/stadt-wolfgang-schulz/delivery-v2'/f'source-{name}.webp'
   atlas=Image.open(selected).convert('RGBA') if selected.exists() else None
   if atlas is not None:encoded_pins[selected.relative_to(ROOT).as_posix()]=sha(selected)
   q=width/128;geometry={'cell':[width,height],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}}
   samples=[];board=Image.new('RGB',(width*5,height),'#eee8db')
   for offset,phase in enumerate((4,6,8,10,12)):
    cell=next(c for c in index['cells'] if (c['row'],c['col'])==(mark['row'],phase));path=ROOT/cell['source']['file'];assert sha(path)==cell['source']['sha256']
    image=street.export_cell(Image.open(path).convert('RGBA'),geometry)
    if atlas is not None:
     decoded=atlas.crop((phase*width,mark['row']*height,(phase+1)*width,(mark['row']+1)*height))
     assert decoded.tobytes()==image.tobytes(),'Selected encoded sole cell differs from source export'
     image=decoded
    sx,sy,_=pilot.side_map(heading,math.tau*phase/16)
    witness=pilot.paint.unpack(pilot.paint.sample(pilot.paint.premul(Image.fromarray(patch)),sx,sy))
    mask=np.array(street.export_cell(witness,geometry))[:,:,3].astype(float)
    assert mask.sum()>0,'Native export lost own sole witness'
    yy,xx=np.mgrid[:height,:width];cx=float((xx*mask).sum()/mask.sum());cy=float((yy*mask).sum()/mask.sum())
    samples.append({'frame':phase,'along_pixels':mark['travel']*cx,'pointPx':[cx,cy],'sourcePoint':[x,y],'sourceRGBA':rgba[y,x].tolist(),'witnessAlphaMass':float(mask.sum())})
    flat=Image.alpha_composite(Image.new('RGBA',image.size,'#eee8db'),image).convert('RGB');draw=ImageDraw.Draw(flat);draw.ellipse((cx-1,cy-1,cx+1,cy+1),fill='#ff3050');draw.text((1,1),str(phase),fill='#111');board.paste(flat,(offset*width,0))
   board.resize((board.width*4,board.height*4),Image.Resampling.NEAREST).save(OUT/f'{heading}-{name}-witness.png')
   data={'character':'stadt-wolfgang-schulz','view':heading,'variant':name,'atlas_sha256':sha(selected) if atlas is not None else None,'frames_per_cycle':16,'game_units_per_pixel':2.33/(136*q*.02),'current_cycle_distance':json.loads((HERE/'pre-admission-family.json').read_text())['cycle_distance'],'shoe_length_pixels':70*136*q/400,'contacts':[{'foot':heading+' actual own near sole','samples':samples}]}
   result=method.assess(data);result['variant']=name;cases.append(result);observations.append(data)
 cycle=sum(c['fitted_cycle_distance'] for c in cases)/len(cases)
 report={'status':'Own source-RGB witness native calibration; actual root/ground review separate','selectedAtlasPins':encoded_pins,'selectedEncodedCellsChecked':20 if len(encoded_pins)==2 else 0,'bodyIndexSha256':sha(index_path),'fittedCycle':cycle,'fitRange':[min(c['fitted_cycle_distance'] for c in cases),max(c['fitted_cycle_distance'] for c in cases)],'assessments':cases,'observations':observations,'limits':['One unoccluded own near sole per side, not hidden opposite-foot tracking','Fractional native alpha witness centroid; source-RGB transport is checked separately by test-contact-pilot.py','Final city root/cadence/floor remain rendered production evidence']}
 (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['fittedCycle','fitRange','selectedEncodedCellsChecked']}))
if __name__=='__main__':main()
