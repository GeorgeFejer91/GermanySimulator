"""Before expansion: own RGB-bearing sole sign and vertical floor regression."""
from pathlib import Path
import hashlib,importlib.util,json,math
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/hartmut-keller-end-to-end/source-contact-audit'
def module(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def run():
 OUT.mkdir(parents=True,exist_ok=True);p=module('hartmut_contact_field',HERE/'pilot-motion.py');street=module('hartmut_contact_export',ROOT/'tools/build-street-character-sprites.py');cases=[]
 for heading,point,sign in [('right',(235,467),1),('left',(276,467),-1)]:
  source=Image.open(HERE/'registered'/f'{heading}.png');original=source.getpixel(point);assert original[3]>=200
  for phase in [4,8,12]:
   im,record=p.render(heading,phase/16*math.tau);target=(round(point[0]+sign*10*(2-4*phase/16)),point[1]);got=im.getpixel(target)
   assert max(abs(got[k]-original[k]) for k in range(4))<=1
   cases.append({'heading':heading,'phase':phase,'sourcePoint':point,'targetPoint':target,'sourceRGBA':original,'targetRGBA':got,'ownRGBTransportExact':got==original})
 for heading in ['down','up']:
  for phase in [4,12]:
   im,record=p.render(heading,phase/16*math.tau);a=np.array(im);ys=np.nonzero(a[:,:,3]>=21)[0];assert ys.max()<=472
   native=[]
   for name,w,h in [('desktop',96,120),('mobile',64,80)]:
    q=w/128;frame=street.export_cell(im,{'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}});alpha=np.array(frame)[:,:,3];bottom=int(np.nonzero(alpha>=21)[0].max());assert bottom<=150*q+.5
    frame.save(OUT/f'{heading}-{phase}-{name}.png');native.append({'variant':name,'bottomAlpha21':bottom,'pivot':150*q})
   cases.append({'heading':heading,'phase':phase,'workingBottomAlpha21':int(ys.max()),'pivot':472,'native':native})
 pins={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in [Path(__file__),HERE/'pilot-motion.py',HERE/'registration.json']}
 (OUT/'report.json').write_text(json.dumps({'status':'Own source/native contact evidence; no runtime foot-slide claim','inputPins':pins,'cases':cases},indent=2)+'\n');print('Own two-profile RGB sole sign and four vertical contact phases PASS at source and both native sizes.')
if __name__=='__main__':run()
