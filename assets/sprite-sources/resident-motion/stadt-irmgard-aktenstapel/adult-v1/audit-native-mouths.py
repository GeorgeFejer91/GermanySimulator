"""Check the own moving lips on each actual native body cell, both variants."""
from pathlib import Path
import hashlib,importlib.util,json
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
WORK=ROOT/'output/street-redesign/aktenstapel-end-to-end';OUT=WORK/'native-mouth-review'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,p):
 s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def run():
 OUT.mkdir(parents=True,exist_ok=True);body_path=WORK/'full-working/body-index.json';mouth_path=WORK/'family-mouths/mouths-working.json'
 body=json.loads(body_path.read_text());mouths=json.loads(mouth_path.read_text())
 street=load('aktenstapel_native_mouth_export',ROOT/'tools/build-street-character-sprites.py');mouth=load('aktenstapel_native_mouth_cpu',ROOT/'tools/build-street-mouths.py')
 report={'status':'Native CPU own-mouth checks; shader/media pending','bodyIndexSha256':sha(body_path),'mouthPacketSha256':sha(mouth_path),'variants':{}}
 for name,w,h in [('desktop',96,120),('mobile',64,80)]:
  q=w/128;checks=[];samples=[]
  for cell in body['cells']:
   slot=cell['row']*21+cell['col'];reg=mouths['frames'][slot]
   if reg is None:continue
   source=ROOT/cell['source']['file'];assert sha(source)==cell['source']['sha256']
   im=street.export_cell(Image.open(source).convert('RGBA'),{'cell':[w,h],'pivot':[64*q,150*q],'figureHeight':136*q,'working':{'figureHeight':400,'baseline':472}})
   path=OUT/'current-native.png';im.save(path)
   center=[reg['rect'][0]*128*q,(1-reg['rect'][1])*160*q];axes=(np.array(reg['axes'])*q).tolist()
   entry={'input':{'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'dimensions':[w,h]},'centerPx':center,'axesPx':axes}
   closed=mouth.preview(entry,reg,0);opened=mouth.preview(entry,reg,1)
   assert closed.tobytes()==im.tobytes();assert opened.getchannel('A').tobytes()==im.getchannel('A').tobytes()
   count=int(np.count_nonzero(np.any(np.array(opened)[:,:,:3]!=np.array(im)[:,:,:3],axis=2)))
   checks.append({'slot':slot,'heading':cell['heading'],'kind':cell['kind'],'changedRgbPixels':count})
   if (cell['row'] in (0,1,3,13) and cell['col'] in (0,4,8,12)) or cell['row']==8:
    samples.append((slot,cell,im.copy(),opened.copy(),center))
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
  report['variants'][name]={'checkedCells':len(checks),'zeroChangedCells':sum(x['changedRgbPixels']==0 for x in checks),'checks':checks}
 (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:{f:v[f] for f in ['checkedCells','zeroChangedCells']} for k,v in report['variants'].items()}))
 assert all(v['zeroChangedCells']==0 for v in report['variants'].values()),'Visible own mouth must change native pixels at both target sizes'
if __name__=='__main__':run()
