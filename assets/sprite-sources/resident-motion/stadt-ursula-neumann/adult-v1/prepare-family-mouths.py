"""Transport Ursula's own lip fit with the exact displayed adult source phase."""
from pathlib import Path
import hashlib,json,math,importlib.util
import numpy as np
from scipy.interpolate import PchipInterpolator
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/ursula-neumann-end-to-end/family-mouths'
FIT=ROOT/'output/street-redesign/ursula-neumann-end-to-end/adult-mouth-fit/fit.json'
BODY=ROOT/'output/street-redesign/ursula-neumann-end-to-end/full-working/body-index.json'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def run():
 fit=json.loads(FIT.read_text());body=json.loads(BODY.read_text());assert fit['identity']==body['identity']=='stadt-ursula-neumann'
 spec=importlib.util.spec_from_file_location('ursula_own_body_fields',HERE/'build-family-source.py');family=importlib.util.module_from_spec(spec);spec.loader.exec_module(family)
 frames=[None]*420;unknown=set()
 for cell in body['cells']:
  heading=cell['heading']
  if heading not in fit['registrations']:unknown.add(heading);continue
  base=fit['registrations'][heading]
  if base is None:continue
  source_center=np.array([base['rect'][0]*512,(1-base['rect'][1])*512])
  working_axes=np.array(base['axes'],float)
  # painted_walk's upper body uses an actual PCHIP waist field. Carry its
  # head shift and both lip axes, rather than using only the whole-body bob.
  if heading in ('down','up') and cell['kind'] in ('walk','stop'):
   phase=cell.get('entryPhase',cell['col']);strength=cell.get('strength',1)
   hip_shift=3*math.sin(math.tau*phase/16)*strength
   field=PchipInterpolator([0,family.pilot.LANDMARKS[heading]['waist'],511],[0,hip_shift,hip_shift])
   ysrc=float(source_center[1]);source_center[0]+=float(field(ysrc))
   shear=float(field.derivative()(ysrc));working_axes[0]+=shear*working_axes[1];working_axes[2]+=shear*working_axes[3]
  if cell['kind']=='action':
   original=source_center.copy();action=cell['action'];index=cell['actionFrame'];eps=.01
   source_center=family.forward_action(original,action,index)
   basis=np.stack([(family.forward_action(original+np.eye(2)[i]*eps,action,index)-family.forward_action(original-np.eye(2)[i]*eps,action,index))/(2*eps) for i in range(2)],axis=1)
   assert np.linalg.det(basis)>0.5
   working_axes[:2]=basis@working_axes[:2];working_axes[2:]=basis@working_axes[2:]
  source_center+=np.array([cell['mouthDx'],cell['mouthDy']])
  s=136/400;center=np.array([64,150])+(source_center-[256,472])*s;axes=working_axes*s
  frames[cell['row']*21+cell['col']]={'rect':[float(center[0]/128),float(1-center[1]/160),float(np.linalg.norm(axes[:2])/128),float(np.linalg.norm(axes[2:])/160)],'axes':axes.tolist(),'profile':base['profile']}
 pins={p.relative_to(ROOT).as_posix():sha(p) for p in [FIT,BODY,Path(__file__),HERE/'pilot-motion.py',HERE/'build-family-source.py',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py']}
 data={'identity':body['identity'],'grid':[21,20],'selectedCells':len(body['cells']),'frames':frames,'standing':fit['registrations']['standing'],'visible':sum(x is not None for x in frames),'missingFits':sorted(unknown),'inputPins':pins}
 OUT.mkdir(parents=True,exist_ok=True);(OUT/'mouths-working.json').write_text(json.dumps(data,indent=2)+'\n')
 print(json.dumps({'visible':data['visible'],'missingFits':data['missingFits']}))
if __name__=='__main__':run()
