from pathlib import Path
import importlib.util,math,json,hashlib
import numpy as np
from PIL import Image
r=Path.cwd();h=r/'assets/sprite-sources/street-speaker-motion/sabine-krueger/adult-v1';s=importlib.util.spec_from_file_location('sabine_field',h/'pilot-motion.py');p=importlib.util.module_from_spec(s);s.loader.exec_module(p);y,x=np.mgrid[:512,:512].astype(float);cases=[];old=[]
for heading in ['right','left']:
 alpha=np.array(Image.open(h/'registered'/f'{heading}.png'))[:,:,3]>=20
 rows,seams=p.SIDE_SEAMS[heading];seam=np.interp(y,rows,seams)
 for phase in range(16):
  t=phase/16;phi=t*math.tau
  if .25<=t<=.75:stride=2-4*t
  else:
   swing=((t-.75)%1)*2;stride=-1-2*swing+12*swing*swing-8*swing*swing*swing
  sign=1 if heading=='right' else -1
  dx=sign*10*p.planted_stride(t);fdx=sign*10*p.planted_stride(t+.5);ndy=-4*max(0,math.cos(phi));fdy=-4*max(0,-math.cos(phi))
  for kind,width,axis,start,length in [('current',60,seam,350,95),('held narrow',20,260 if heading=='right' else 266,320,125)]:
   side=p.smooth((x-axis+width/2)/width);near=1-side if heading=='right' else side;lower=p.smooth((y-start)/length);tx=x+lower*(near*dx+(1-near)*fdx);ty=y+lower*(near*ndy+(1-near)*fdy);xy,xx=np.gradient(tx);yy,yx=np.gradient(ty);det=xx*yy-xy*yx
   item={'heading':heading,'phase':phase,'minimumOpaqueForwardJacobian':float(det[alpha].min()),'maximumOpaqueForwardJacobian':float(det[alpha].max())};(cases if kind=='current' else old).append(item)
assert min(c['minimumOpaqueForwardJacobian'] for c in cases)>0
out=r/'output/street-redesign/sabine-end-to-end/side-field-jacobian.json';out.write_text(json.dumps({'sourceSha256':hashlib.sha256((h/'pilot-motion.py').read_bytes()).hexdigest(),'status':'CPU source-map diagnostic, not native or runtime artistic approval','currentCases':cases,'heldNarrowCases':old,'minimumCurrent':min(c['minimumOpaqueForwardJacobian'] for c in cases),'minimumHeld':min(c['minimumOpaqueForwardJacobian'] for c in old)},indent=2)+'\n');print(out.read_text()[-150:])
