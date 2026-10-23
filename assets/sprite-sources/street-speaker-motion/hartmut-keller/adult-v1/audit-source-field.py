"""Check own actual forward side field for local folds at painted pixels."""
from pathlib import Path
import importlib.util,math,json,hashlib
import numpy as np
from PIL import Image
r=Path(__file__).resolve().parents[5];h=Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('hartmut_field',h/'pilot-motion.py');p=importlib.util.module_from_spec(s);s.loader.exec_module(p)
y,x=np.mgrid[:512,:512].astype(float);cases=[]
for heading in ['right','left']:
 alpha=np.array(Image.open(h/'registered'/f'{heading}.png'))[:,:,3]>=20
 for phase in range(16):
  dx,dy=p.side_displacement(heading,phase/16*math.tau,1,x,y);tx=x+dx;ty=y+dy
  xy,xx=np.gradient(tx);yy,yx=np.gradient(ty);det=xx*yy-xy*yx
  cases.append({'heading':heading,'phase':phase,'minimumOpaqueForwardJacobian':float(det[alpha].min()),'maximumOpaqueForwardJacobian':float(det[alpha].max())})
assert min(c['minimumOpaqueForwardJacobian'] for c in cases)>0
out=r/'output/street-redesign/hartmut-keller-end-to-end/side-field-jacobian.json';out.parent.mkdir(parents=True,exist_ok=True)
report={'sourceSha256':hashlib.sha256((h/'pilot-motion.py').read_bytes()).hexdigest(),'status':'Own actual field fold diagnostic, not anatomical or runtime approval','cases':cases,'minimum':min(c['minimumOpaqueForwardJacobian'] for c in cases)}
out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'cases':len(cases),'minimum':report['minimum']}))
