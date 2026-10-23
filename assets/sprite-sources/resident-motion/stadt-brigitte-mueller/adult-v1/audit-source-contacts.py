"""Bounded own-pixel stance/floor pilot before family expansion."""
from pathlib import Path
import hashlib,importlib.util,json,math
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/brigitte-mueller-end-to-end/contact-pilot'
def load(name,p):
 s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def run():
 OUT.mkdir(parents=True,exist_ok=True);pilot=load('brigitte_contacts',HERE/'pilot-motion.py');street=load('brigitte_contact_export',ROOT/'tools/build-street-character-sprites.py');report={'status':'SOURCE PILOT only; no runtime gait claim','sources':{},'sideSoles':{},'verticalFloor':{}}
 for heading in ['right','left']:
  source=HERE/'registered'/f'{heading}.png';raw=np.array(Image.open(source).convert('RGBA'));x,y=(260,468);color=raw[y,x].copy();assert color[3]>=21
  samples=[]
  for phase in (4,8,12):
   image,field=pilot.render(heading,math.tau*phase/16);image.save(OUT/f'{heading}-{phase:02}.png');a=np.array(image)
   ys,xs=np.nonzero(np.all(a==color,axis=2)&(np.indices(a.shape[:2])[0]>=460))
   assert len(xs)>0,(heading,phase,'own sole color missing',color.tolist())
   nearest=min(zip(xs,ys),key=lambda q:abs(q[0]-x)+abs(q[1]-y));samples.append({'phase':phase,'point':list(map(int,nearest))})
  xs=[v['point'][0] for v in samples];assert (xs[0]>xs[1]>xs[2]) if heading=='right' else (xs[0]<xs[1]<xs[2]),(heading,xs)
  assert all(7<=abs(xs[i+1]-xs[i])<=13 for i in (0,1)),(heading,xs)
  report['sources'][heading]={'sha256':sha(source),'solePoint':[x,y],'soleRGBA':color.tolist()};report['sideSoles'][heading]=samples
 for heading in ('down','up'):
  samples=[]
  for phase in (4,12):
   image,_=pilot.render(heading,math.tau*phase/16);image.save(OUT/f'{heading}-{phase:02}.png');item={'phase':phase,'native':{}}
   a=np.array(image);yy=np.nonzero(a[:,:,3]>=21)[0];assert int(yy.max())<=472,(heading,phase,int(yy.max()))
   for name,w,h in [('desktop',96,120),('mobile',64,80)]:
    q=w/128;im=street.export_cell(image,{'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}});im.save(OUT/f'{heading}-{phase:02}-{name}.png');bottom=int(np.nonzero(np.array(im)[:,:,3]>=21)[0].max());assert bottom<=150*q+.5,(heading,phase,name,bottom)
    item['native'][name]={'lastOpaqueRow':bottom,'pivotY':150*q}
   samples.append(item)
  report['verticalFloor'][heading]=samples
 for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
  board=Image.new('RGB',(512*3,512*4),bg);draw=ImageDraw.Draw(board)
  for row,heading in enumerate(('down','right','up','left')):
   phases=(4,8,12) if heading in ('right','left') else (4,12)
   for col,phase in enumerate(phases):
    im=Image.open(OUT/f'{heading}-{phase:02}.png').convert('RGBA');flat=Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB');board.paste(flat,(col*512,row*512));draw.text((col*512+5,row*512+5),f'{heading} phase{phase}',fill='#111' if theme=='light' else '#eee')
  board.save(OUT/f'contacts-{theme}.png')
 report['status']='SOURCE_CONTACT_PILOT_PASS';(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
if __name__=='__main__':run()
