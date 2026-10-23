"""Compile Klaus's own manually fitted closed lips from actual adult paint.

The historical public actor had no mouth registration. No other actor's lip
profile is an anatomical authority. Own fits supply every visible contour.
"""
from pathlib import Path
import hashlib,importlib.util,json
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/klaus-klein-end-to-end/adult-mouth-fit'
FITS=HERE/'lip-fits.json'
HEADINGS=('down','front-right','right','rear-right','up','rear-left','left','front-left')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,p):
 s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def native(center,axes,profile,size):
 return {'rect':[center[0]/size[0],1-center[1]/size[1],float(np.linalg.norm(axes[:2]))/size[0],float(np.linalg.norm(axes[2:]))/size[1]],'axes':list(axes),'profile':profile}
def run():
 OUT.mkdir(parents=True,exist_ok=True)
 mouth=load('klaus_adult_lips',ROOT/'tools/build-street-mouths.py');street=load('klaus_adult_export',ROOT/'tools/build-street-character-sprites.py')
 fits=json.loads(FITS.read_text());TRACED=fits['views'];registrations={};checks={};pins={FITS.relative_to(ROOT).as_posix():sha(FITS)}
 assert set(TRACED)==set(HEADINGS), 'Fit every actual view or explicitly mark mouth absent'
 for i,name in enumerate(HEADINGS):
  if name not in TRACED:continue
  if TRACED[name] is None:registrations[name]=None;continue
  path=HERE/'registered'/f'{name}.png';pins[path.relative_to(ROOT).as_posix()]=sha(path)
  image=Image.open(path).convert('RGBA');own=TRACED[name];center,axes=own['centerPx'],own['axesPx'];profile=own['profile'];mouth.validate(profile)
  reg=native(center,axes,profile,[512,512]);registrations[name]=reg
  entry={'input':{'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'dimensions':[512,512]},'centerPx':center,'axesPx':axes}
  closed=mouth.preview(entry,reg,0);opened=mouth.preview(entry,reg,1)
  assert closed.tobytes()==image.tobytes();assert closed.getchannel('A').tobytes()==opened.getchannel('A').tobytes()
  checks[name]={'closedExact':True,'openAlphaExact':True,'changedRgbPixels':int(np.count_nonzero(np.any(np.array(opened)[:,:,:3]!=np.array(image)[:,:,:3],axis=2)))}
  cx,cy=center;box=(int(cx-25),int(cy-18),int(cx+26),int(cy+25))
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   board=Image.new('RGB',(816,374),bg)
   for col,im in enumerate((image,opened)):
    crop=im.crop(box);flat=Image.alpha_composite(Image.new('RGBA',crop.size,bg),crop).convert('RGB')
    board.paste(flat.resize((408,344),Image.Resampling.NEAREST),(col*408,30))
   ImageDraw.Draw(board).text((5,5),f'{name} own adult source closed | max open',fill='#111' if theme=='light' else '#eee')
   board.save(OUT/f'{name}-{theme}.png')
 front=Image.open(HERE/'registered/down.png').convert('RGBA')
 standing=street.export_cell(front,{'cell':[128,160],'pivot':[64,150],'figureHeight':136,'working':{'figureHeight':400,'baseline':472}});standing.save(OUT/'standing-candidate.png')
 s=136/400;center=np.array([64,150])+(np.array(TRACED['down']['centerPx'])-[256,472])*s
 registrations['standing']=native(center.tolist(),(np.array(TRACED['down']['axesPx'])*s).tolist(),registrations['down']['profile'],[128,160])
 data={'identity':'stadt-klaus-dieter-klein','status':'SOURCE FIT only; quarter/native/rendered review pending','pins':pins,'manualClosedLipFits':TRACED,'registrations':registrations,'checks':checks}
 (OUT/'fit.json').write_text(json.dumps(data,indent=2)+'\n');print(json.dumps(checks))
if __name__=='__main__':run()
