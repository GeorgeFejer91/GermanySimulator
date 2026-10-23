"""Observe actual inverse sampling fields for every own walk phase and gesture."""
from pathlib import Path
import hashlib,importlib.util,json,math
from unittest.mock import patch
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/renate-end-to-end/source-field-audit'
def load(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def run():
 family=load('renate_field_qa',HERE/'build-family-source.py');pilot=family.pilot
 original=pilot.paint.sample;records=[];active={}
 def observed(p,x,y):
  xy,xx=np.gradient(x);yy,yx=np.gradient(y);det=xx*yy-xy*yx
  assert np.isfinite(det).all() and det.min()>0,(active,float(det.min()))
  records.append({**active,'minInverseJacobian':float(det.min()),'maxInverseJacobian':float(det.max())})
  return original(p,x,y)
 with patch.object(pilot.paint,'sample',side_effect=observed):
  for heading in ['down','right','up','left']:
   for phase in range(16):active={'heading':heading,'phase':phase,'kind':'walk'};pilot.render(heading,math.tau*phase/16)
  source=Image.open(HERE/'registered/down.png').convert('RGBA')
  for phase,amount in enumerate([0,.05,.11,.18,.34,.53,.72,.90,1,1,1,.84,.66,.44,.20,0]):
   active={'heading':'down','phase':phase,'kind':'free-left-hand'};family.gesture(source,amount)
 OUT.mkdir(exist_ok=True);data={'status':'Fresh actual sampling-field checks; no independent visual/game verdict','pilotSha256':hashlib.sha256((HERE/'pilot-motion.py').read_bytes()).hexdigest(),'walkPhases':64,'gesturePhases':16,'actualSourceSampleCalls':len(records),'minObservedInverseJacobian':min(r['minInverseJacobian'] for r in records),'records':records}
 (OUT/'report.json').write_text(json.dumps(data,indent=2)+'\n');print(json.dumps({k:v for k,v in data.items() if k!='records'}))
if __name__=='__main__':run()
