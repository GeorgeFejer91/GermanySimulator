"""Seed the historical callback-omission failure without editing shared code."""
from pathlib import Path
import importlib.util,json,math
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/hartmut-keller-end-to-end/floor-regression'
def module(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def run():
 OUT.mkdir(parents=True,exist_ok=True);pilot=module('hartmut_floor_regression',HERE/'pilot-motion.py')
 actual=pilot.paint.animate;cases=[]
 def omitted(*args,**kwargs):
  kwargs.pop('limb_pose',None);return actual(*args,**kwargs)
 try:
  for seeded in [True,False]:
   pilot.paint.animate=omitted if seeded else actual
   for heading in ['down','up']:
    for phase in [4,12]:
     im,_=pilot.render(heading,phase/16*math.tau);bottom=int(np.nonzero(np.array(im)[:,:,3]>=21)[0].max())
     im.save(OUT/f'{"seeded-omission" if seeded else "current"}-{heading}-{phase}.png')
     cases.append({'mode':'seeded callback omission' if seeded else 'current own callback','heading':heading,'phase':phase,'bottomAlpha21':bottom,'pivot':472,'passes':bottom<=472})
 finally:pilot.paint.animate=actual
 assert not all(c['passes'] for c in cases if c['mode']=='seeded callback omission'),'Regression did not detect the seeded real omission'
 assert all(c['passes'] for c in cases if c['mode']=='current own callback')
 report={'method':'Only own wrapper callback is omitted in memory to seed the regression; shared/source files remain untouched. These are diagnostic frames, never selected.','cases':cases}
 (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(cases))
if __name__=='__main__':run()
