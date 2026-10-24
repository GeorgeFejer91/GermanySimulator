"""Prove the effective own-source floor guard detects its removal."""
from pathlib import Path
import importlib.util,json,math
import numpy as np
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/ursula-neumann-end-to-end/floor-sensitivity'

def run():
 spec=importlib.util.spec_from_file_location('ursula_floor_sensitivity',HERE/'pilot-motion.py')
 pilot=importlib.util.module_from_spec(spec);spec.loader.exec_module(pilot)
 OUT.mkdir(parents=True,exist_ok=True);callback=pilot.planted_floor;cases=[]
 for heading in ('down','up'):
  for phase in (4,12):
   pilot.planted_floor=None
   try:unguarded,_=pilot.render(heading,math.tau*phase/16)
   finally:pilot.planted_floor=callback
   guarded,_=pilot.render(heading,math.tau*phase/16)
   bottom=lambda image:int(np.nonzero(np.array(image)[:,:,3]>=21)[0].max())
   red,green=bottom(unguarded),bottom(guarded)
   assert red>472 and green<=472,(heading,phase,red,green)
   unguarded.save(OUT/f'{heading}-{phase}-without-callback.png')
   guarded.save(OUT/f'{heading}-{phase}-with-callback.png')
   cases.append({'heading':heading,'phase':phase,'guardRemovedBottom':red,'effectiveCallbackBottom':green})
 report={'status':'PASS sensitivity mutation detects floor regression','cases':cases,
         'scope':'Explicit callback-removal mutation, not a historical original-production failure.'}
 (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
if __name__=='__main__':run()
