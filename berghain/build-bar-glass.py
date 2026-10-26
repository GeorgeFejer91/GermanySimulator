"""Original procedural ribbed-glass material; no photograph pixels or scan input.

Karhard gallery12/14 establish rectangular amber apertures, fine horizontal
ribbing and dark joints. All optical parameters and dimensions are estimates.
"""
from pathlib import Path
import hashlib,json
import numpy as np
from PIL import Image

root=Path(__file__).resolve().parent.parent
out=root/'assets/models/berghain/textures';n=512
v,u=np.mgrid[0:n,0:n]/(n-1)
x=(u-.5)*.214;y=(v-.5)*.16
radius=.009
qx=np.abs(x)-(.107-radius);qy=np.abs(y)-(.08-radius)
d=radius-(np.hypot(np.maximum(qx,0),np.maximum(qy,0))+np.minimum(np.maximum(qx,qy),0))
edge=np.clip(d/.005,0,1)
rib=.5+.5*np.sin(2*np.pi*(v*13+.07*np.sin(u*np.pi*3)))
rim=np.exp(-((d-.006)/.0017)**2)
height=edge*(.0006*rim+.0004*(rib-.5)*np.clip((d-.008)/.008,0,1))
dy,dx=np.gradient(height,.16/(n-1),.214/(n-1))
normal=np.stack([-dx,dy,np.ones_like(dx)],axis=-1)
normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
glow=(.26+.72*edge)*(.85+.15*rib)*(1-.04*rim)
tone=.58+.35*edge+.07*rib
colour=np.clip(tone[...,None]*np.array([208,176,115]),0,255)
rough=np.clip(.19+.12*(1-edge)+.045*(1-rib),0,1)
arrays={'baseColor':colour,'normal':(normal+1)*127.5,'roughness':np.repeat((rough*255)[...,None],3,axis=2),'emission':np.repeat((glow*255)[...,None],3,axis=2)}
files=[]
for name,a in arrays.items():
 p=out/('bar-glass-'+name+'.png');Image.fromarray(np.rint(a).astype(np.uint8),'RGB').save(p,optimize=True)
 files.append({'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(out/'bar-glass-manifest.json').write_text(json.dumps({'generator':'berghain/build-bar-glass.py','generatorSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'sources':['I23 gallery12','I23 gallery14'],'scope':'Original illustrative glass-block maps; no sampled photo data, measured photometry or surveyed block dimensions','dimensions':[512,512],'files':files},indent=2)+'\n')
print(json.dumps({'files':len(files),'bytes':sum(f['bytes'] for f in files)}))
