"""Register Irmgard's own immutable source sheets; no runtime selection.

The separately generated sheets have different source pixel densities. One
fixed density conversion applies to every painting in a sheet, followed by the
same400px working figure convention. No cell or limb is independently fitted.
"""
from pathlib import Path
import hashlib, importlib.util, json, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt, find_objects, label

ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/aktenstapel-end-to-end'
ORDER=('down','front-right','right','rear-right','up','rear-left','left','front-left')
FILES={
 'cardinal':('stadt-irmgard-aktenstapel-expressionist-directions-v1.png','82f2b786fe164a4440a23bd4c85296c7e2b80fc2c9d32754a1eebdc58faae408',865),
 'quarter':('stadt-irmgard-aktenstapel-expressionist-diagonals-v1.png','0a2bce66e0fbe003a1f20b36f9e41b85618709eb9366f8f0500bc5cf367ca61d',790),
 'rear':('stadt-irmgard-aktenstapel-expressionist-rear-v2.png','e5e7f9deeaa16ca741eb7e627544553899c90a9acebb91bbc4a50c14765d8450',1454),
}
SOURCE={'down':('cardinal',0),'right':('cardinal',1),'left':('cardinal',3),
 'up':('rear',0),'front-right':('quarter',0),'rear-right':('quarter',1),
 'rear-left':('quarter',2),'front-left':('quarter',3)}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def load(path):
 s=importlib.util.spec_from_file_location('aktenstapel_source_export',path)
 m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def isolate(source,bounds):
 rgba=np.array(source);labels,_=label(rgba[:,:,3]>=20)
 matches=[i for i,r in enumerate(find_objects(labels),1) if r and
  [r[1].start,r[0].start,r[1].stop,r[0].stop]==bounds]
 assert len(matches)==1,(bounds,matches)
 distance,nearest=distance_transform_edt(labels==0,return_indices=True)
 owner=matches[0]
 keep=(labels==owner)|((rgba[:,:,3]<20)&(distance<=2)&(labels[tuple(nearest)]==owner))
 rgba[~keep]=0
 return Image.fromarray(rgba)

def shoes(source,bounds,density):
 l,t,r,b=bounds
 start=b-round(80*density/865)
 labels,_=label(np.array(source.getchannel('A'))[start:b,l:r]>=20)
 supports=[]
 for i,region in enumerate(find_objects(labels),1):
  if region is None:continue
  pixels=np.count_nonzero(labels[region]==i)
  if pixels<60*density*density/865**2:continue
  y,x=region
  supports.append({'bounds':[l+x.start,start+y.start,l+x.stop,start+y.stop],
   'pixels':int(pixels),'centerX':l+(x.start+x.stop)/2})
 assert supports,bounds
 selected=sorted(supports,key=lambda z:z['pixels'],reverse=True)[:2]
 return [sum(z['centerX'] for z in selected)/len(selected),b],supports

def main():
 street=load(ROOT/'tools/build-street-character-sprites.py')
 raw={}
 for key,(name,digest,density) in FILES.items():
  path=HERE/'raw'/name;assert sha(path)==digest,path
  image=Image.open(path).convert('RGBA')
  boxes=sorted(street.source_components(image),key=lambda b:b[0])
  assert len(boxes)==(1 if key=='rear' else 4),(key,boxes)
  raw[key]=(path,image,boxes,density)
 dest=HERE/'registered';dest.mkdir(exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
 report={'identity':'stadt-irmgard-aktenstapel','working':{'cell':[512,512],'figureHeight':400,'baseline':472},
  'densityPolicy':'one fixed original-source density per sheet; cardinal865/quarter790/rear1454, no per-cell fitting',
  'views':{},'inputPins':{}}
 boards={theme:Image.new('RGB',(2048,1024),bg) for theme,bg in [('light','#eee8db'),('dark','#25272b')]}
 for index,heading in enumerate(ORDER):
  key,which=SOURCE[heading];path,image,boxes,density=raw[key];bounds=boxes[which]
  clean=isolate(image,bounds);pivot,supports=shoes(clean,bounds,density)
  registered,origin=street.register_source(clean,{'component_bounds':bounds,'source_pivot':pivot},400/density,472)
  rgba=np.array(registered);rgba[rgba[:,:,3]<20]=0;registered=Image.fromarray(rgba)
  target=dest/f'{heading}.png';registered.save(target)
  report['inputPins'][path.relative_to(ROOT).as_posix()]=sha(path)
  report['views'][heading]={'source':path.relative_to(ROOT).as_posix(),'sourceSha256':sha(path),
   'sourceBoundsAlpha20':bounds,'sourceDensityHeight':density,'sourcePivot':pivot,'sourceShoeSupport':supports,
   'sourceScale':400/density,'workingOrigin':origin.tolist(),
   'workingBoundsAlpha20':list(registered.getchannel('A').getbbox()),
   'registered':target.relative_to(ROOT).as_posix(),'registeredSha256':sha(target)}
  for theme,board in boards.items():
   bg='#eee8db' if theme=='light' else '#25272b'
   flat=Image.alpha_composite(Image.new('RGBA',(512,512),bg),registered).convert('RGB')
   x,y=index%4*512,index//4*512;board.paste(flat,(x,y))
   ImageDraw.Draw(board).text((x+8,y+8),heading,fill='#111' if theme=='light' else '#eee')
 for theme,board in boards.items():board.save(OUT/f'registered-adult-{theme}.png')
 (HERE/'registration.json').write_bytes((json.dumps(report,indent=2)+'\n').encode())
 print(json.dumps({k:v['workingBoundsAlpha20'] for k,v in report['views'].items()}))

if __name__=='__main__':main()
