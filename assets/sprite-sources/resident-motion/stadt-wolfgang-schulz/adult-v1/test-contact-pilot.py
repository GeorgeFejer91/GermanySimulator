"""Actual own shoe RGB witnesses and floor, against source-ground invariants."""
from pathlib import Path
import importlib.util,json,math,hashlib,sys
import numpy as np
from PIL import Image
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
spec=importlib.util.spec_from_file_location('wolfgang_contact_source',HERE/'pilot-motion.py')
pilot=importlib.util.module_from_spec(spec);spec.loader.exec_module(pilot)
OUT=ROOT/'output/street-redesign/wolfgang-end-to-end/contact-pilot'
def main():
 OUT.mkdir(parents=True,exist_ok=True);report={'floor':[],'soles':[]}
 for heading in ('down','up'):
  for phase in (4,12):
   image,_=pilot.render(heading,math.tau*phase/16)
   yy,xx=np.nonzero(np.array(image)[:,:,3]>=21)
   floor=int(yy.max()+1);report['floor'].append({'heading':heading,'phase':phase,'bottom':floor})
   assert floor<=472,(heading,phase,floor)
 for heading,(x,y),travel in [('right',(244,464),1),('left',(278,465),-1)]:
  source=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA');rgba=np.array(source)
  assert rgba[y-2:y+3,x-2:x+3,3].min()>=200,(heading,'source sole patch not opaque')
  patch=np.zeros_like(rgba);patch[y-2:y+3,x-2:x+3]=rgba[y-2:y+3,x-2:x+3]
  observed=[]
  for phase in (4,8,12):
   sx,sy,_=pilot.side_map(heading,math.tau*phase/16)
   witness=np.array(pilot.paint.unpack(pilot.paint.sample(pilot.paint.premul(Image.fromarray(patch)),sx,sy)))
   image=np.array(pilot.render(heading,math.tau*phase/16)[0]);mask=witness[:,:,3]>=200
   assert mask.any()
   assert np.max(abs(witness[mask,:3].astype(int)-image[mask,:3].astype(int)))<=1,'Sole RGB witness does not correspond to full paint'
   weight=witness[:,:,3].astype(float);centroid=float((weight*pilot.XX).sum()/weight.sum());observed.append(centroid)
  along=[travel*q for q in observed]
  record={'heading':heading,'ownSourcePoint':[x,y],'ownSourceRGBA':rgba[y,x].tolist(),'sourceSha256':hashlib.sha256((HERE/'registered'/f'{heading}.png').read_bytes()).hexdigest(),'centroidX':observed,'alongTravel':along}
  report['soles'].append(record)
  assert all(a>b for a,b in zip(along,along[1:])),record
 (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
if __name__=='__main__':
 if '--negative-floor' in sys.argv:pilot.planted_floor=lambda side,nodes,dx,dy:(dx,dy)
 if '--negative-side' in sys.argv:
  actual=pilot.side_map
  def reversed_side(*args,**kwargs):
   sx,sy,record=actual(*args,**kwargs)
   return 2*pilot.XX-sx,sy,record
  pilot.side_map=reversed_side
 main()
