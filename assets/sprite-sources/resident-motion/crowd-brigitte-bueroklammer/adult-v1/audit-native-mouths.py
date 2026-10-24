"""Check the own moving lips on each actual native body cell, both variants."""
from pathlib import Path
import hashlib,importlib.util,json
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/bueroklammer-end-to-end';OUT=WORK/'native-mouth-review'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,p):
 s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def run():
 OUT.mkdir(parents=True,exist_ok=True);body_path=WORK/'full-working/body-index.json';mouth_path=WORK/'family-mouths/mouths-working.json'
 body=json.loads(body_path.read_text());mouths=json.loads(mouth_path.read_text())
 street=load('bueroklammer_native_mouth_export',ROOT/'tools/build-street-character-sprites.py');mouth=load('bueroklammer_native_mouth_cpu',ROOT/'tools/build-street-mouths.py')
 report={'status':'Native CPU own-mouth checks; shader/media pending','bodyIndexSha256':sha(body_path),'mouthPacketSha256':sha(mouth_path),'variants':{}}
 for name,w,h in [('desktop',96,120),('mobile',64,80)]:
  q=w/128;checks=[];samples=[]
  encoded_path=ROOT/'assets/characters/street-speakers/crowd-brigitte-bueroklammer/delivery-v2'/f'source-{name}.webp'
  with Image.open(encoded_path) as raw:encoded=raw.convert('RGBA')
  for cell in body['cells']:
   slot=cell['row']*21+cell['col'];reg=mouths['frames'][slot]
   if reg is None:continue
   source=ROOT/cell['source']['file'];assert sha(source)==cell['source']['sha256']
   with Image.open(source) as raw:working=raw.convert('RGBA')
   im=street.export_cell(working,{'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}})
   row,col=cell['row'],cell['col'];selected=encoded.crop((col*w,row*h,(col+1)*w,(row+1)*h));assert im.tobytes()==selected.tobytes();selected.close()
   path=OUT/'current-native.png';im.save(path)
   center=[reg['rect'][0]*128*q,(1-reg['rect'][1])*160*q];axes=(np.array(reg['axes'])*q).tolist()
   native_rgba=np.asarray(im);working_rgba=np.asarray(working);corners=[]
   for side in (-.5,.5):
    point=np.array(center)+side*np.array(axes[:2]);source_point=np.array([256,472])+(point/q-[64,150])/(136/400)
    nx,ny=np.rint(point).astype(int);sx,sy=np.rint(source_point).astype(int)
    native_value=native_rgba[ny,nx].tolist() if 0<=nx<w and 0<=ny<h else [0,0,0,0]
    source_value=working_rgba[sy,sx].tolist() if 0<=sx<512 and 0<=sy<512 else [0,0,0,0]
    corners.append({'side':side,'sourcePoint':source_point.tolist(),'sourceRgba':source_value,'nativePoint':point.tolist(),'nativeRgba':native_value})
   entry={'input':{'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'dimensions':[w,h]},'centerPx':center,'axesPx':axes}
   closed=mouth.preview(entry,reg,0);opened=mouth.preview(entry,reg,1)
   assert closed.tobytes()==im.tobytes();assert opened.getchannel('A').tobytes()==im.getchannel('A').tobytes()
   count=int(np.count_nonzero(np.any(np.array(opened)[:,:,:3]!=np.array(im)[:,:,:3],axis=2)))
   checks.append({'slot':slot,'heading':cell['heading'],'kind':cell['kind'],'changedRgbPixels':count,'corners':corners,'cornersAttached':all(c['sourceRgba'][3]>=230 and c['nativeRgba'][3]>0 for c in corners)})
   if (cell['row'] in (0,1,3,16,17,18,19) and cell['col'] in (0,4,8,12)) or cell['row']==8:
    samples.append((slot,cell,im.copy(),opened.copy(),center))
   working.close();im.close();closed.close();opened.close()
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   board=Image.new('RGB',(640,len(samples)*150),bg)
   for i,(slot,cell,closed,opened,center) in enumerate(samples):
    cx,cy=center;box=(int(cx-6),int(cy-5),int(cx+7),int(cy+7))
    for j,img in enumerate((closed,opened)):
     crop=img.crop(box);flat=Image.alpha_composite(Image.new('RGBA',crop.size,bg),crop).convert('RGB')
     board.paste(flat.resize((130,120),Image.Resampling.NEAREST),(j*140,i*150+25))
     native=Image.alpha_composite(Image.new('RGBA',img.size,bg),img).convert('RGB');board.paste(native,(310+j*150,i*150+25))
    ImageDraw.Draw(board).text((4,i*150+3),f'{slot} {cell["heading"]} {cell["kind"]} closed | open',fill='#111' if theme=='light' else '#eee')
   board.save(OUT/f'{name}-{theme}.png')
  report['variants'][name]={'checkedCells':len(checks),'encodedAtlasSha256':sha(encoded_path),'zeroChangedCells':sum(x['changedRgbPixels']==0 for x in checks),'detachedCornerCells':sum(not x['cornersAttached'] for x in checks),'checks':checks}
  encoded.close()
 failures={name:[c for c in variant['checks'] if c['changedRgbPixels']==0 or not c['cornersAttached']]
           for name,variant in report['variants'].items() if variant['zeroChangedCells'] or variant['detachedCornerCells']}
 report['status']='RED: supported native mouth lacks RGB witness or attached source/native corners' if failures else 'PASS native CPU own-mouth checks; shader/media pending'
 report['cornerMethod']='Actual pose RGBA nearest-pixel source alpha>=230 uses the already reviewed source endpoint criterion. Native corner must touch existing paint (alpha>0); its actual RGBA is disclosed rather than inventing a universal native alpha threshold. Closed RGB and open alpha remain byte exact.'
 report['failures']=failures
 (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:{f:v[f] for f in ['checkedCells','zeroChangedCells']} for k,v in report['variants'].items()}))
 assert not failures,json.dumps(failures)
if __name__=='__main__':run()
