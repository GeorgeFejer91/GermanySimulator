"""Recompute physical cycle from actual raw-rebuilt complete source foot paint.

No cached pilot/native frames, expected person, validation baseline, or selected
assets enter this measurement. Body-visible occlusion is not inferred here.
"""
from pathlib import Path
import hashlib,importlib.util,json,math
import numpy as np
from PIL import Image
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4]
OUT=ROOT/'output/street-redesign/hildegard-brotzeit-end-to-end/layered-v2/source01/source-cycle'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run():
 spec=importlib.util.spec_from_file_location('hildegard_raw_source_cycle',HERE/'profile-motion-v2.py');pilot=importlib.util.module_from_spec(spec);spec.loader.exec_module(pilot)
 original=np.asarray(Image.open(HERE/'registered/down.png').convert('RGBA'));yy,xx=np.where(original[:,:,3]>=20)
 height=int(yy.max()+1-yy.min());assert height==400 and int(yy.max()+1)==472
 assert 'const S=.02,H=.038' in (ROOT/'world3d.js').read_text()
 points={'right':{'near':(212,460),'far':(244,467)},'left':{'near':(307,460),'far':(271,467)}}
 stances=[]
 for heading,feet in points.items():
  sources=pilot.sources(heading)
  for foot,(x,y) in feet.items():
   rgba=np.asarray(sources[foot]);patch=np.zeros_like(rgba);patch[y-2:y+3,x-2:x+3]=rgba[y-2:y+3,x-2:x+3]
   assert patch[y-2:y+3,x-2:x+3,3].min()>=200
   samples=[];phases=[4,6,8,10,12] if foot=='near' else [12,14,16,18,20]
   for frame in phases:
    image,field=pilot.transport(Image.fromarray(patch),heading,math.tau*frame/16,1,foot)
    a=np.asarray(image)[:,:,3].astype(float);assert a.sum()>0
    cx=float((a*pilot.XX).sum()/a.sum());samples.append(cx*(1 if heading=='right' else -1))
   p=np.array(phases)/16;values=np.array(samples)
   slope=float(np.dot(p-p.mean(),values-values.mean())/np.dot(p-p.mean(),p-p.mean()))
   residual=float(abs(values-(values.mean()+slope*(p-p.mean()))).max())
   assert abs(slope+40)<1e-9 and residual<1e-9
   stances.append({'heading':heading,'foot':foot,'sourcePoint':[x,y],'phases':phases,'actualRgbaAlongSourcePixels':samples,'slope':slope,'maximumResidual':residual,'sourceHeight2_33Cycle':-slope*2.33/height/.02})
 cycle=sum(s['sourceHeight2_33Cycle'] for s in stances)/len(stances)
 assert abs(cycle-11.65)<1e-9
 OUT.mkdir(parents=True,exist_ok=True)
 report={'status':'REBUILT_REAL_SOURCE_PHYSICAL_CYCLE','fittedCycle':cycle,'familySourceHeight':height,'authoredHeight':2.33,'mapWorldUnitsPerGameUnit':.02,'stances':stances,
  'qualification':'Actual complete source foot layer transport only; hidden patches are not promoted to body-visible native/world evidence. Native quantization and independent actual body exposure are separate checks.',
  'pins':{p.relative_to(ROOT).as_posix():sha(p) for p in [Path(__file__),HERE/'profile-motion-v2.py',HERE/'registered/down.png',ROOT/'world3d.js',*[HERE/'profile-leg-repair-v2'/f'{h}-{f}-leg.png' for h in ['right','left'] for f in ['near','far']]]}}
 (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'fittedCycle':cycle,'actualSourceStances':len(stances)}))
if __name__=='__main__':run()
