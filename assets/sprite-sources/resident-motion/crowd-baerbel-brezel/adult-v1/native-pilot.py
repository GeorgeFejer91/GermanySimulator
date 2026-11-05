"""Small exact production-export pilot; no full family or registry write."""
from pathlib import Path
import hashlib,importlib.util,json,math
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/baerbel-brezel-end-to-end'
OUT=WORK/'native-pilot-v1'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def run():
 assert not OUT.exists(),'Preserve actual first pilot output'
 OUT.mkdir(parents=True)
 street=load('baerbel_native_export',ROOT/'tools/build-street-character-sprites.py')
 mouth=load('baerbel_native_lip_cpu',ROOT/'tools/build-street-mouths.py')
 fits=json.loads((WORK/'adult-mouth-fit-v2/fit.json').read_text())
 assert all(fits['registrations'][h] is None for h in ['rear-right','up','rear-left'])
 pins={}
 def pin(p):pins[p.relative_to(ROOT).as_posix()]=sha(p)
 for p in [Path(__file__),WORK/'adult-mouth-fit-v2/fit.json',HERE/'lip-fits.json',ROOT/'tools/build-street-character-sprites.py',ROOT/'tools/build-street-mouths.py']:pin(p)
 report={'actor':'crowd-baerbel-brezel','status':'SMALL_NATIVE_PILOT_ONLY; full encoded phase replay and shader/game pending','sourceExtremes':16,'supportedMouthPairs':5,'rearThreeNull':True,'inputPins':pins,'variants':{},'selectedFullFamilyCellsChecked':0}
 for variant,w,h in [('desktop',96,120),('mobile',64,80)]:
  folder=OUT/variant;folder.mkdir();q=w/128;scale=136*q/400;pivot=np.array([64*q,150*q])
  spec={'cell':[w,h],'pivot':pivot.tolist(),'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}}
  cells=[];mouth_cells=[];meta={'cell':[w,h],'pivot':pivot.tolist(),'productionExporter':'tools/build-street-character-sprites.py:export_cell','body':[],'mouths':[]}
  for heading in ['down','right','up','left']:
   neutral_path=HERE/'registered'/f'{heading}.png';pin(neutral_path)
   with Image.open(neutral_path) as opened:neutral=street.export_cell(opened.convert('RGBA'),spec)
   neutral_bottom=neutral.getchannel('A').getbbox()[3]
   for phase in [0,4,8,12]:
    source=WORK/'pilot-motion'/f'{heading}-{phase:02}.png';pin(source)
    with Image.open(source) as opened:im=street.export_cell(opened.convert('RGBA'),spec)
    file=folder/f'{heading}-{phase:02}.png';im.save(file)
    box=im.getchannel('A').getbbox();gutter=min(box[0],box[1],w-box[2],h-box[3]);assert gutter>=2
    assert box[3]<=neutral_bottom,(heading,phase,box,neutral_bottom)
    cells.append(im)
    meta['body'].append({'heading':heading,'phase':phase,'file':file.relative_to(ROOT).as_posix(),'sha256':sha(file),'alphaBounds':list(box),'minimumGutter':gutter,'bottomVsOwnNeutral':box[3]-neutral_bottom,'nativeSoleAnchor':float(pivot[1])})
  body=Image.new('RGBA',(w*4,h*4))
  for i,im in enumerate(cells):body.paste(im,((i%4)*w,(i//4)*h))
  body_path=folder/'body-extremes.webp';body.save(body_path,lossless=True,exact=True,method=4)
  with Image.open(body_path) as decoded:assert decoded.convert('RGBA').tobytes()==body.tobytes()
  meta['bodyEncoded']={'file':body_path.relative_to(ROOT).as_posix(),'sha256':sha(body_path),'decodedExact':True}
  for heading in ['down','front-right','right','left','front-left']:
   source=HERE/'registered'/f'{heading}.png';pin(source)
   with Image.open(source) as opened:im=street.export_cell(opened.convert('RGBA'),spec)
   file=folder/f'{heading}-closed.png';im.save(file)
   fit=fits['manualClosedLipFits'][heading];center=pivot+(np.array(fit['centerPx'])-[256,472])*scale;axes=np.array(fit['axesPx'])*scale
   reg={'rect':[center[0]/w,1-center[1]/h,float(np.linalg.norm(axes[:2]))/w,float(np.linalg.norm(axes[2:]))/h],'axes':axes.tolist(),'profile':fit['profile']}
   entry={'input':{'file':file.relative_to(ROOT).as_posix()},'centerPx':center.tolist(),'axesPx':axes.tolist()}
   closed=mouth.preview(entry,reg,0);opened=mouth.preview(entry,reg,1)
   assert closed.tobytes()==im.tobytes();assert opened.getchannel('A').tobytes()==im.getchannel('A').tobytes()
   opened_path=folder/f'{heading}-open.png';opened.save(opened_path)
   closed_rgb=np.array(im)[:,:,:3].astype(int);open_rgb=np.array(opened)[:,:,:3].astype(int);delta=open_rgb-closed_rgb
   changed=np.any(delta!=0,axis=2);count=int(np.count_nonzero(changed));assert count>0,(variant,heading,'No visible RGB delta',center.tolist(),axes.tolist())
   ys,xs=np.nonzero(changed);mouth_cells.extend([closed,opened])
   meta['mouths'].append({'heading':heading,'centerPx':center.tolist(),'axesPx':axes.tolist(),'closedRgbExact':True,'openAlphaExact':True,'changedRgbPixels':count,'changedRgbBounds':[int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1],'maximumAbsoluteRgbDelta':int(np.abs(delta).max()),'sumAbsoluteRgbDelta':int(np.abs(delta).sum()),'changedPixelDeltas':[{'xy':[int(x),int(y)],'closedRgb':closed_rgb[y,x].tolist(),'openRgb':open_rgb[y,x].tolist(),'deltaRgb':delta[y,x].tolist()} for y,x in zip(ys,xs)],'closed':{'file':file.relative_to(ROOT).as_posix(),'sha256':sha(file)},'open':{'file':opened_path.relative_to(ROOT).as_posix(),'sha256':sha(opened_path)}})
  mouths=Image.new('RGBA',(2*w,5*h))
  for i,im in enumerate(mouth_cells):mouths.paste(im,((i%2)*w,(i//2)*h))
  mouth_path=folder/'mouth-endpoints.webp';mouths.save(mouth_path,lossless=True,exact=True,method=4)
  with Image.open(mouth_path) as decoded:assert decoded.convert('RGBA').tobytes()==mouths.tobytes()
  meta['mouthEncoded']={'file':mouth_path.relative_to(ROOT).as_posix(),'sha256':sha(mouth_path),'decodedExact':True}
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   for name,sheet in [('body',body),('mouth',mouths)]:
    flat=Image.alpha_composite(Image.new('RGBA',sheet.size,bg),sheet).convert('RGB')
    # Integer nearest display enlargement preserves each actual exported pixel.
    display=flat.resize((flat.width*2,flat.height*2),Image.Resampling.NEAREST)
    display.save(OUT/f'{variant}-{name}-{theme}.png')
   heads=Image.new('RGB',(2*240,5*144),bg)
   for i,im in enumerate(mouth_cells):
    fit=meta['mouths'][i//2];cx,cy=fit['centerPx'];box=(int(cx)-10,int(cy)-7,int(cx)+10,int(cy)+5)
    cut=Image.alpha_composite(Image.new('RGBA',(20,12),bg),im.crop(box)).convert('RGB')
    heads.paste(cut.resize((240,144),Image.Resampling.NEAREST),((i%2)*240,(i//2)*144))
   heads.save(OUT/f'{variant}-lip-pixels-{theme}.png')
  report['variants'][variant]=meta
 for rel,digest in pins.items():assert sha(ROOT/rel)==digest
 (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'variants':{n:{'body':len(v['body']),'mouthPairs':len(v['mouths']),'minimumGutter':min(c['minimumGutter'] for c in v['body']),'decodedExact':v['bodyEncoded']['decodedExact'] and v['mouthEncoded']['decodedExact']} for n,v in report['variants'].items()},'fullFamilyChecked':0}))
if __name__=='__main__':run()
