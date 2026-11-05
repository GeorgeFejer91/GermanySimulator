"""Actual own shoe RGB witnesses and floor, against source-ground invariants."""
from pathlib import Path
import importlib.util,json,math,hashlib,sys
import numpy as np
from PIL import Image
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
spec=importlib.util.spec_from_file_location('guenther_contact_source',HERE/'pilot-motion.py')
pilot=importlib.util.module_from_spec(spec);spec.loader.exec_module(pilot)
OUT=ROOT/'output/street-redesign/guenther-end-to-end/contact-pilot'
def main():
 OUT.mkdir(parents=True,exist_ok=True);report={'status':'RUNNING','floor':[],'soles':[]}
 def save(): (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
 save()
 for heading in ('down','up'):
  for phase in (4,12):
   image,_=pilot.render(heading,math.tau*phase/16)
   yy,xx=np.nonzero(np.array(image)[:,:,3]>=21)
   floor=int(yy.max()+1);report['floor'].append({'heading':heading,'phase':phase,'bottom':floor})
   save()
   assert floor<=472,(heading,phase,floor)
 for heading,foot,(x,y),travel in [('right','near',(235,461),1),('right','far',(295,448),1),('left','near',(293,461),-1),('left','far',(218,436),-1)]:
  source=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA');rgba=np.array(source)
  assert rgba[y-2:y+3,x-2:x+3,3].min()>=200,(heading,'source sole patch not opaque')
  patch=np.zeros_like(rgba);patch[y-2:y+3,x-2:x+3]=rgba[y-2:y+3,x-2:x+3]
  coverage=np.zeros((512,512),float);coverage[y-2:y+3,x-2:x+3]=1
  observed=[]
  phases=(4,6,8,10,12) if foot=='near' else (12,14,16,18,20)
  for phase in phases:
   sx,sy,_=pilot.side_map(heading,math.tau*phase/16)
   witness=np.array(pilot.paint.unpack(pilot.paint.sample(pilot.paint.premul(Image.fromarray(patch)),sx,sy)))
   image=np.array(pilot.render(heading,math.tau*phase/16)[0])
   # Full sampling-footprint membership is independent of this painting's
   # actual250–253alpha. Requiring254paintalpha wrongly rejected own paint.
   support=pilot.map_coordinates(coverage,[sy,sx],order=1,mode='constant')
   mask=support>=1-1e-8
   assert mask.any(),(heading,phase,'No fully owned source sampling footprint')
   assert np.max(abs(witness[mask,:3].astype(int)-image[mask,:3].astype(int)))<=1,'Sole RGB witness does not correspond to full paint'
   weight=witness[:,:,3].astype(float);centroid=float((weight*pilot.XX).sum()/weight.sum());observed.append(centroid)
  along=[travel*q for q in observed]
  steps=[a-b for a,b in zip(along,along[1:])]
  record={'heading':heading,'foot':foot,'phases':list(phases),'ownSourcePoint':[x,y],'ownSourceRGBA':rgba[y,x].tolist(),'sourceSha256':hashlib.sha256((HERE/'registered'/f'{heading}.png').read_bytes()).hexdigest(),'centroidX':observed,'alongTravel':along,'stanceSteps':steps}
  report['soles'].append(record)
  save()
  assert all(a>b for a,b in zip(along,along[1:])),record
  # Half-cycle stance must be uniform for EACH foot. Checking only 4/8/12
  # also accepted the old far=-near curve, whose intermediate steps slipped.
  assert max(abs(step-5.75) for step in steps)<.01,record
 report['status']='PASS';save();print(json.dumps(report))
if __name__=='__main__':
 if '--negative-floor' in sys.argv:pilot.planted_floor=lambda side,nodes,dx,dy:(dx,dy)
 if '--negative-side' in sys.argv:
  actual=pilot.side_map
  def reversed_side(*args,**kwargs):
   sx,sy,record=actual(*args,**kwargs)
   return 2*pilot.XX-sx,sy,record
  pilot.side_map=reversed_side
 main()
