"""Actual own near-sole paint/mask transport, independent of nearDx metadata.

The marked patches lie on the source's visible bottom shoe, clear of the
overlapping far shoe: right's screen-left boot and left's screen-right boot.
Positive travel must reduce the marked foot's travel-axis coordinate in stance.
"""
from pathlib import Path
import importlib.util,json,math,hashlib
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/aktenstapel-end-to-end/own-sole-direction'
PATCH={'right':[(222,461),(237,461),(239,466),(222,466)],
       'left':[(279,461),(291,461),(293,466),(279,466)]}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def load(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def center(image):
 a=np.array(image)[:,:,3].astype(float);yy,xx=np.mgrid[:a.shape[0],:a.shape[1]]
 return [float((xx*a).sum()/a.sum()),float((yy*a).sum()/a.sum())]

def main():
 OUT.mkdir(parents=True,exist_ok=True)
 actor=load('aktenstapel_own_sole_field',HERE/'pilot-motion.py')
 street=load('aktenstapel_own_sole_export',ROOT/'tools/build-street-character-sprites.py')
 results=[]
 for heading,polygon in PATCH.items():
  source_path=HERE/'registered'/f'{heading}.png';source=Image.open(source_path).convert('RGBA')
  mask=Image.new('L',(512,512));ImageDraw.Draw(mask).polygon(polygon,fill=255)
  rgba=np.array(source);selected=(np.array(mask)>0)&(rgba[:,:,3]>=200)
  assert selected.sum()>40,(heading,'source sole annotation misses opaque boot')
  # Only actual source sole paint travels. Empty stencil pixels stay absent.
  patch=rgba.copy();patch[~selected]=0;patch=Image.fromarray(patch)
  patch.save(OUT/f'{heading}-source-sole-patch.png')
  observations=[];boards={w:Image.new('RGB',(w*5,h),'#eee8db') for w,h in [(96,120),(64,80)]}
  for col,phase in enumerate((4,6,8,10,12)):
   sx,sy,_=actor.side_field(heading,phase/16*math.tau)
   transported=actor.paint.unpack(actor.paint.sample(actor.paint.premul(patch),sx,sy))
   image,_=actor.render(heading,phase/16*math.tau)
   # The actual transported RGB belongs to the matching whole source frame.
   alpha=np.array(transported)[:,:,3];interior=alpha>=250
   assert np.allclose(np.array(transported)[interior,:3],np.array(image)[interior,:3],atol=1)
   obs={'phase':phase,'sourceCenter':center(transported),'native':{}}
   for w,h in [(96,120),(64,80)]:
    q=w/128;spec={'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}}
    native=street.export_cell(image,spec);marked=street.export_cell(transported,spec)
    point=center(marked);obs['native'][str(w)]=point
    flat=Image.alpha_composite(Image.new('RGBA',(w,h),'#eee8db'),native).convert('RGB')
    d=ImageDraw.Draw(flat);x,y=point;d.ellipse((x-1,y-1,x+1,y+1),fill='#ff3050')
    d.text((2,2),str(phase),fill='#111');boards[w].paste(flat,(col*w,0))
   observations.append(obs)
  travel=1 if heading=='right' else -1
  for key in ['sourceCenter','96','64']:
   xs=[(v['sourceCenter'] if key=='sourceCenter' else v['native'][key])[0]*travel for v in observations]
   assert all(a>b for a,b in zip(xs,xs[1:])),(heading,key,xs,'wrong own planted sole direction')
  for w,board in boards.items():board.resize((board.width*4,board.height*4),Image.Resampling.NEAREST).save(OUT/f'{heading}-{w}-source-identified.png')
  results.append({'heading':heading,'sourceSha256':sha(source_path),'ownSolePolygon':polygon,
   'selectedOpaqueSourcePixels':int(selected.sum()),'observations':observations,'pass':True})
 (OUT/'receipt.json').write_bytes((json.dumps(results,indent=2)+'\n').encode())
 print(json.dumps([{'heading':r['heading'],'pass':r['pass'],'sourceSoleX':[round(v['sourceCenter'][0],3) for v in r['observations']]} for r in results]))

if __name__=='__main__':main()
