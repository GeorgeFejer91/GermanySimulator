"""Fit the exact own-source RGB sole witnesses in native exported cells."""
from pathlib import Path
import hashlib,importlib.util,json,math,sys
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/guenther-end-to-end';OUT=WORK/'sole-cadence'
MARKS={'right':{'row':1,'travel':1,'feet':{'near':([235,461],84),'far':([295,448],48)}},'left':{'row':3,'travel':-1,'feet':{'near':([293,461],89),'far':([218,436],56)}}}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
def main(pilot_only=False):
 OUT.mkdir(parents=True,exist_ok=True)
 pilot=load('guenther_own_sole_field',HERE/'pilot-motion.py')
 street=load('guenther_own_sole_export',ROOT/'tools/build-street-character-sprites.py')
 method=load('guenther_own_sole_assessment',ROOT/'.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py')
 index_path=WORK/'full-working/body-index.json';index=None if pilot_only else json.loads(index_path.read_text());cases=[];observations=[];encoded_pins={};encoded_unique=set();encoded_comparisons=0
 for heading,mark in MARKS.items():
  original=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA');rgba=np.array(original)
  for name,width,height in [('desktop',96,120),('mobile',64,80)]:
   selected=ROOT/'assets/characters/residents/stadt-guenther-tuev/delivery-v2'/f'source-{name}.webp'
   atlas=Image.open(selected).convert('RGBA') if not pilot_only and selected.exists() else None
   if atlas is not None:encoded_pins[selected.relative_to(ROOT).as_posix()]=sha(selected)
   q=width/128;geometry={'cell':[width,height],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}}
   for foot,([x,y],shoe_length) in mark['feet'].items():
    patch=np.zeros_like(rgba);patch[y-2:y+3,x-2:x+3]=rgba[y-2:y+3,x-2:x+3];assert patch[y-2:y+3,x-2:x+3,3].min()>=200
    samples=[];board=Image.new('RGB',(width*5,height),'#eee8db')
    phases=(4,6,8,10,12) if foot=='near' else (12,14,16,18,20)
    for offset,phase in enumerate(phases):
     col=phase%16
     if pilot_only:source=pilot.render(heading,math.tau*col/16)[0]
     else:
      cell=next(c for c in index['cells'] if (c['row'],c['col'])==(mark['row'],col));path=ROOT/cell['source']['file'];assert sha(path)==cell['source']['sha256'];source=Image.open(path).convert('RGBA')
     image=street.export_cell(source,geometry)
     if atlas is not None:
      decoded=atlas.crop((col*width,mark['row']*height,(col+1)*width,(mark['row']+1)*height))
      assert decoded.tobytes()==image.tobytes(),'Selected encoded sole cell differs from source export'
      image=decoded;encoded_comparisons+=1;encoded_unique.add((name,mark['row'],col))
     sx,sy,_=pilot.side_map(heading,math.tau*col/16)
     witness=pilot.paint.unpack(pilot.paint.sample(pilot.paint.premul(Image.fromarray(patch)),sx,sy))
     mask=np.array(street.export_cell(witness,geometry))[:,:,3].astype(float);assert mask.sum()>0,'Native export lost own sole witness'
     yy,xx=np.mgrid[:height,:width];cx=float((xx*mask).sum()/mask.sum());cy=float((yy*mask).sum()/mask.sum())
     samples.append({'frame':phase,'along_pixels':mark['travel']*cx,'pointPx':[cx,cy],'sourcePoint':[x,y],'sourceRGBA':rgba[y,x].tolist(),'witnessAlphaMass':float(mask.sum())})
     flat=Image.alpha_composite(Image.new('RGBA',image.size,'#eee8db'),image).convert('RGB');draw=ImageDraw.Draw(flat);draw.ellipse((cx-1,cy-1,cx+1,cy+1),fill='#ff3050' if foot=='near' else '#00b9c5');draw.text((1,1),str(phase),fill='#111');board.paste(flat,(offset*width,0))
    board.resize((board.width*4,board.height*4),Image.Resampling.NEAREST).save(OUT/f'{heading}-{foot}-{name}-witness.png')
    data={'character':'stadt-guenther-tuev','view':heading,'variant':name,'atlas_sha256':sha(selected) if atlas is not None else None,'frames_per_cycle':16,'game_units_per_pixel':2.33/(136*q*.02),'current_cycle_distance':json.loads((HERE/'pre-admission-family.json').read_text())['cycle_distance'],'shoe_length_pixels':shoe_length*136*q/400,'contacts':[{'foot':heading+' actual own '+foot+' sole','samples':samples}]}
    result=method.assess(data);result.update(variant=name,foot=foot,shoeWidthSourcePixels=shoe_length)
    for mode in ('current_slip','fitted_slip'):
     result[mode]['rms_native_pixels']=result[mode]['rms_game_units']/data['game_units_per_pixel'];result[mode]['max_native_pixels']=result[mode]['max_game_units']/data['game_units_per_pixel']
    cases.append(result);observations.append(data)
 cycle=sum(c['fitted_cycle_distance'] for c in cases)/len(cases)
 configured=None;private=WORK/'private-manifest.json'
 if encoded_pins and private.exists():
  configured=json.loads(private.read_text())['characters']['stadt-guenther-tuev']['strideDistance']
  assert abs(configured-cycle)<1e-9,('Selected own stride does not match both-foot fit',configured,cycle)
 report={'status':'Own actual near+far source-RGBA native calibration; actual root/ground review separate','pilotOnly':pilot_only,'bothFeetEachSideObserved':True,'selectedAtlasPins':encoded_pins,'selectedEncodedCellsChecked':len(encoded_unique),'selectedEncodedContactComparisons':encoded_comparisons,'bodyIndexSha256':None if pilot_only else sha(index_path),'fittedCycle':cycle,'fitRange':[min(c['fitted_cycle_distance'] for c in cases),max(c['fitted_cycle_distance'] for c in cases)],'assessments':cases,'observations':observations,'limits':['Both near and visible far own source patches tracked over5samples per stance/profile/variant','Far shoe48/56px width is visible annotated source extent, excluding occluded heel; mobile5x5source witness is narrower than1nativepixel','Fractional native residual is measured in own shoe pixels; no universal.01nativepixel threshold','Source RGBA/full-footprint/sign/field-linearity and8old extrema exactness are separately bound by both-feet-v2-pilot','Final city root/cadence/floor remain rendered production evidence']}
 report['configuredStrideDistance']=configured
 (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['fittedCycle','fitRange','selectedEncodedCellsChecked','selectedEncodedContactComparisons']}))
if __name__=='__main__':main('--pilot' in sys.argv)
