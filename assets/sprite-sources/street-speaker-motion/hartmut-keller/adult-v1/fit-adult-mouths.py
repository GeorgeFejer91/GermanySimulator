"""Fit adult Hartmut Keller's own painted closed lip lines, source by source."""
from pathlib import Path
import hashlib, importlib.util, json
import numpy as np
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/hartmut-keller-end-to-end/adult-mouth-fit'
TRACED={
 'down':([246,128.5],[12,-.4,0,3.6]),
 'front-right':([255,121.5],[8,-1.5,0,3.4]),
 'right':([269,126],[5,0,0,3]),
 'rear-right':([273.5,122],[5.5,0,0,3]),
 'up':None,'rear-left':None,
 'left':([231,124.5],[4.3,1,0,2.8]),
 'front-left':([225,121.3],[8,1,0,3.2])}
CREASE={
 'down':[0,.04,-.05,-.02,0],
 'front-right':[0,-.03,-.08,-.02,0],
 'right':[0,.04,0,-.02,0],
 'rear-right':[0,.02,-.04,0,0],
 'left':[0,-.02,-.06,.02,0],
 'front-left':[0,-.02,-.04,.02,0]}
NO_MOUTH={'up':'True rear: no facial lip paint.',
 'rear-left':'Only a tiny far-side face contour is visible beside the alpha edge; no safe native lip surface. Retain source paint.'}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,p):
 s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def native(center,axes,profile,size):
 return {'rect':[center[0]/size[0],1-center[1]/size[1],float(np.linalg.norm(axes[:2]))/size[0],float(np.linalg.norm(axes[2:]))/size[1]],'axes':list(axes),'profile':profile}
def run():
 OUT.mkdir(parents=True,exist_ok=True)
 mouth=load('hartmut_own_lips',ROOT/'tools/build-street-mouths.py');street=load('hartmut_own_export',ROOT/'tools/build-street-character-sprites.py')
 registrations={};checks={};pins={p.relative_to(ROOT).as_posix():sha(p) for p in [Path(__file__),HERE/'registration.json',ROOT/'tools/build-street-mouths.py',ROOT/'tools/build-street-character-sprites.py']}
 for name,traced in TRACED.items():
  if traced is None:registrations[name]=None;continue
  path=HERE/'registered'/f'{name}.png';pins[path.relative_to(ROOT).as_posix()]=sha(path)
  image=Image.open(path).convert('RGBA');center,axes=traced;c=CREASE[name]
  # These profiles are fitted to Hartmut's distinct, closed source lip lines.
  # No source cavity/teeth are invented and no other actor's profile is read.
  profile={'crease':c,'source_upper':c,'source_lower':c,
   'open_upper':[c[0],c[1]-.22,c[2]-.3,c[3]-.22,c[4]],
   'open_lower':[c[0],c[1]+.34,c[2]+.48,c[3]+.34,c[4]],
   'corners':[-.8,.8],'width':[.02,.12],'teeth':0}
  mouth.validate(profile);reg=native(center,axes,profile,[512,512]);registrations[name]=reg
  entry={'input':{'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'dimensions':[512,512]},'centerPx':center,'axesPx':axes}
  closed=mouth.preview(entry,reg,0);opened=mouth.preview(entry,reg,1)
  assert closed.tobytes()==image.tobytes();assert opened.getchannel('A').tobytes()==image.getchannel('A').tobytes()
  checks[name]={'closedExact':True,'openAlphaExact':True,'changedRgbPixels':int(np.count_nonzero(np.any(np.array(opened)[:,:,:3]!=np.array(image)[:,:,:3],axis=2)))}
  cx,cy=center;box=(int(cx-22),int(cy-16),int(cx+23),int(cy+22))
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   board=Image.new('RGB',(720,338),bg)
   for col,im in enumerate((image,opened)):
    crop=im.crop(box);flat=Image.alpha_composite(Image.new('RGBA',crop.size,bg),crop).convert('RGB')
    board.paste(flat.resize((360,304),Image.Resampling.NEAREST),(col*360,30))
   ImageDraw.Draw(board).text((5,5),f'{name}: own source closed | owned open',fill='#111' if theme=='light' else '#eee')
   board.save(OUT/f'{name}-{theme}.png')
 front=Image.open(HERE/'registered/down.png').convert('RGBA')
 standing=street.export_cell(front,{'cell':[128,160],'pivot':[64,150],'figureHeight':136,'working':{'figureHeight':400,'baseline':472}});standing.save(OUT/'standing-candidate.png')
 s=136/400;center=np.array([64,150])+(np.array(TRACED['down'][0])-[256,472])*s
 registrations['standing']=native(center.tolist(),(np.array(TRACED['down'][1])*s).tolist(),registrations['down']['profile'],[128,160])
 data={'identity':'quiz-hartmut-keller','status':'Own closed-lip source fit; native/GPU/runtime pending','pins':pins,'manualClosedLipFits':TRACED,'deliberateNoMouth':NO_MOUTH,'registrations':registrations,'checks':checks}
 (OUT/'fit.json').write_text(json.dumps(data,indent=2)+'\n');print(json.dumps(checks))
if __name__=='__main__':run()
