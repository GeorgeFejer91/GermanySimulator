"""Fit Klaus's source-identified visible near soles on exact native cells.

The source field identifies one unoccluded near-boot sole in each side view.
Pixel marks retain explicit half-pixel uncertainty. This is encoded calibration,
not proof of actual city floor contact, opposite-foot identity or natural gait.
"""
from pathlib import Path
import hashlib,importlib.util,json,math
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/klaus-klein-end-to-end';OUT=WORK/'sole-cadence'
MARKS={'right':{'point':[232,464],'row':1,'travel':1},'left':{'point':[296,459],'row':3,'travel':-1}}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,p):
 s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def run():
 OUT.mkdir(parents=True,exist_ok=True);index_path=WORK/'full-working/body-index.json';index=json.loads(index_path.read_text())
 street=load('klaus_sole_export',ROOT/'tools/build-street-character-sprites.py');method=load('klaus_sole_fit',ROOT/'.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py')
 cases=[];observations=[];encoded_pins={}
 for heading,mark in MARKS.items():
  original=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA');sx,sy=mark['point'];assert original.getpixel((sx,sy))[3]>=200
  for name,w,h in [('desktop',96,120),('mobile',64,80)]:
   selected=ROOT/'assets/characters/residents/stadt-klaus-dieter-klein/delivery-v2'/f'source-{name}.webp'
   atlas=Image.open(selected).convert('RGBA') if selected.exists() else None
   if atlas is not None:encoded_pins[selected.relative_to(ROOT).as_posix()]=sha(selected)
   s=136*w/128/400;q=w/128;scale=2.33/(136*q*.02);samples=[];board=Image.new('RGB',(w*5,h),'#eee8db')
   for col,phase in enumerate([4,6,8,10,12]):
    cell=next(c for c in index['cells'] if (c['row'],c['col'])==(mark['row'],phase));p=ROOT/cell['source']['file'];assert sha(p)==cell['source']['sha256']
    image=street.export_cell(Image.open(p).convert('RGBA'),{'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}})
    if atlas is not None:
     decoded=atlas.crop((phase*w,mark['row']*h,(phase+1)*w,(mark['row']+1)*h))
     assert decoded.tobytes()==image.tobytes(), 'Selected encoded sole cell changed'
     image=decoded
    # On these own near-sole points, the spatial blend is effectively1 and
    # stance y remains the own marker's source row. The displacement is
    # linear10→−10 pixels through this source-supported contact interval.
    dx=mark['travel']*10*(2-4*phase/16)
    predicted_x=64*q+(sx+dx-256)*s;predicted_y=150*q+(sy-472)*s
    x,y=round(predicted_x),round(predicted_y);rgba=image.getpixel((x,y));assert rgba[3]>=128,(heading,name,phase,x,y,rgba)
    samples.append({'frame':phase,'along_pixels':mark['travel']*x,'pointPx':[x,y],'alpha':rgba[3],'sourcePoint':[sx,sy],'sourceRGBA':list(original.getpixel((sx,sy))),'fieldPredictedPx':[predicted_x,predicted_y]})
    flat=Image.alpha_composite(Image.new('RGBA',image.size,'#eee8db'),image).convert('RGB');d=ImageDraw.Draw(flat);d.ellipse((x-1,y-1,x+1,y+1),fill='#ff3050');d.text((2,2),f'{phase}:{x},{y}',fill='#111');board.paste(flat,(col*w,0))
   board.resize((board.width*4,board.height*4),Image.Resampling.NEAREST).save(OUT/f'{heading}-{name}-marked.png')
   data={'character':'stadt-klaus-dieter-klein','view':heading,'variant':name,'atlas_sha256':sha(selected) if atlas is not None else None,'frames_per_cycle':16,'game_units_per_pixel':scale,'current_cycle_distance':11.65,'shoe_length_pixels':18*w/96,'contacts':[{'foot':heading+' own near boot','samples':samples}]}
   result=method.assess(data);result['variant']=name;result['markerHalfPixelWorstCaseCycleUnits']=2.4*scale;cases.append(result);observations.append(data)
 mean=sum(c['fitted_cycle_distance'] for c in cases)/len(cases)
 report={'status':'SOURCE CALIBRATION; actual floor/cadence evidence remains separate','selectedAtlasPins':encoded_pins,'exactSelectedCellsChecked':20 if len(encoded_pins)==2 else 0,'bodyIndexSha256':sha(index_path),'worldUnitsPerGameUnit':.02,'sourceAnalyticCycle':11.65,'fittedCycle':mean,'fitRange':[min(c['fitted_cycle_distance'] for c in cases),max(c['fitted_cycle_distance'] for c in cases)],'assessments':cases,'observations':observations,'limits':['Only known near boot per side; opposite foot is not separately marked through overlap.','Marks rounded to one physical pixel; source field prediction does not remove sampling uncertainty.','Existing assess_walk_speed.py slope/slip fit; actual accepted-root speed/cadence and floor contact require separate game evidence.']}
 (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['fittedCycle','fitRange','sourceAnalyticCycle']}))
if __name__=='__main__':run()
