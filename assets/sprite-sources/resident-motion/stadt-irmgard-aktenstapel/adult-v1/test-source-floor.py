"""Regression: own opaque vertical soles may not descend below fixed ground."""
from pathlib import Path
import importlib.util,json,math
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/aktenstapel-end-to-end/source-floor'

def main():
 spec=importlib.util.spec_from_file_location('aktenstapel_floor_motion',HERE/'pilot-motion.py')
 actor=importlib.util.module_from_spec(spec);spec.loader.exec_module(actor)
 export_spec=importlib.util.spec_from_file_location('aktenstapel_floor_export',ROOT/'tools/build-street-character-sprites.py')
 export=importlib.util.module_from_spec(export_spec);export_spec.loader.exec_module(export)
 OUT.mkdir(parents=True,exist_ok=True);results=[]
 for direction in ('down','up'):
  for phase in (4,12):
   frame,record=actor.render(direction,phase/16*math.tau)
   path=OUT/f'{direction}-{phase:02}.png';frame.save(path)
   alpha=np.array(frame)[:,:,3];yy,xx=np.nonzero(alpha>=128)
   bottom=int(yy.max()+1)
   contact=[float(v['dy'][-1]) for v in record['limb_displacement']]
   native=[]
   for w,h in [(96,120),(64,80)]:
    q=w/128
    image=export.export_cell(frame,{'cell':[w,h],'pivot':[64*q,150*q],
      'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}})
    opaque=np.array(image)[:,:,3]>=128
    native_bottom=int(np.nonzero(opaque)[0].max()+1)
    image.save(OUT/f'{direction}-{phase:02}-{w}.png')
    native.append({'width':w,'opaqueBottom':native_bottom,'pivotY':150*q,
      'pass':native_bottom<=math.ceil(150*q)})
   results.append({'direction':direction,'phase':phase,'opaqueBottom':bottom,
    'soleDisplacementY':contact,'pass':bottom<=472 and max(contact)<=1e-9})
   results[-1]['native']=native
   results[-1]['pass']=results[-1]['pass'] and all(n['pass'] for n in native)
 (OUT/'receipt.json').write_bytes((json.dumps(results,indent=2)+'\n').encode())
 print(json.dumps(results))
 assert all(r['pass'] for r in results),'Opaque source sole descends below fixed472 ground'

if __name__=='__main__':main()
