"""Fit Renate's actual source-identified near-sole travel at both native sizes.

The source-mask witness follows the exact own profile field and final native
export, without altering body paint. Runtime contact/cadence remains separate.
"""
from pathlib import Path
import hashlib,importlib.util,json,math
from unittest.mock import patch
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/renate-end-to-end';OUT=WORK/'sole-cadence'
MARKS={'right':{'point':[272,468],'row':1,'travel':1},'left':{'point':[240,468],'row':3,'travel':-1}}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,p):
 s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def run():
 OUT.mkdir(parents=True,exist_ok=True);index_path=WORK/'full-working/body-index.json';index=json.loads(index_path.read_text())
 street=load('renate_sole_export',ROOT/'tools/build-street-character-sprites.py')
 method=load('renate_sole_fit',ROOT/'.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py')
 pilot=load('renate_sole_source',HERE/'pilot-motion.py');cases=[];observations=[];pins={}
 for heading,mark in MARKS.items():
  original=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA');sx,sy=mark['point'];assert original.getpixel((sx,sy))[3]>=200
  marker=Image.new('RGBA',(512,512));ImageDraw.Draw(marker).rectangle((sx-4,sy-3,sx+4,sy+3),fill=(255,255,255,255))
  for name,w,h in [('desktop',96,120),('mobile',64,80)]:
   selected=ROOT/'assets/characters/residents/stadt-renate-termin/delivery-v2'/f'source-{name}.webp'
   atlas=Image.open(selected).convert('RGBA') if selected.exists() else None
   if atlas is not None:pins[selected.relative_to(ROOT).as_posix()]=sha(selected)
   q=w/128;scale=2.33/(136*q*.02);samples=[];board=Image.new('RGB',(w*5,h),'#eee8db')
   export={'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}}
   for col,phase in enumerate([4,6,8,10,12]):
    cell=next(c for c in index['cells'] if (c['row'],c['col'])==(mark['row'],phase));p=ROOT/cell['source']['file'];assert sha(p)==cell['source']['sha256']
    body=street.export_cell(Image.open(p).convert('RGBA'),export)
    if atlas is not None:assert atlas.crop((phase*w,mark['row']*h,(phase+1)*w,(mark['row']+1)*h)).tobytes()==body.tobytes()
    with patch.object(pilot.Image,'open',return_value=marker):witness,_=pilot.render(heading,math.tau*phase/16)
    native=street.export_cell(witness,export);a=np.array(native)[:,:,3].astype(float);a[a<21]=0;yy,xx=np.indices(a.shape);assert a.sum()>0,(heading,name,phase,np.array(native)[:,:,3].max())
    x=float((xx*a).sum()/a.sum());y=float((yy*a).sum()/a.sum());rgba=body.getpixel((round(x),round(y)));assert rgba[3]>=128,(heading,name,phase,x,y,rgba)
    samples.append({'frame':phase,'along_pixels':mark['travel']*x,'pointPx':[x,y],'bodyAlphaAtRoundedWitness':rgba[3],'sourcePoint':[sx,sy]})
    flat=Image.alpha_composite(Image.new('RGBA',body.size,'#eee8db'),body).convert('RGB');d=ImageDraw.Draw(flat);d.ellipse((x-1,y-1,x+1,y+1),fill='#ff3050');d.text((2,2),f'{phase}:{x:.2f}',fill='#111');board.paste(flat,(col*w,0))
   board.resize((board.width*4,board.height*4),Image.Resampling.NEAREST).save(OUT/f'{heading}-{name}-marked.png')
   data={'character':'stadt-renate-termin','view':heading,'variant':name,'frames_per_cycle':16,'game_units_per_pixel':scale,'current_cycle_distance':9.5,'shoe_length_pixels':18*w/96,'contacts':[{'foot':heading+' actual near sole paint witness','samples':samples}]}
   result=method.assess(data);result['variant']=name;cases.append(result);observations.append(data)
 mean=sum(c['fitted_cycle_distance'] for c in cases)/len(cases)
 report={'status':'SOURCE/NATIVE calibration; actual world floor/cadence pending','selectedAtlasPins':pins,'exactSelectedCellsChecked':20 if len(pins)==2 else 0,'bodyIndexSha256':sha(index_path),'pilotSha256':sha(HERE/'pilot-motion.py'),'fittedCycle':mean,'fitRange':[min(c['fitted_cycle_distance'] for c in cases),max(c['fitted_cycle_distance'] for c in cases)],'assessments':cases,'observations':observations,'limits':['Source-mask witness identifies opaque near sole in each actual original, transported by exact own field and native exporter.','A local painted foot deforms spatially; one surface witness does not establish every sole pixel stationary.','Real floor and accepted production root cadence need separate game evidence.']}
 (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['fittedCycle','fitRange','exactSelectedCellsChecked']}))
if __name__=='__main__':run()
