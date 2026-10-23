"""Manual own-adult closed-lip registrations and CPU open previews.

Positions/axes are traced from the newly registered adult heads. The older
Hannelore profile supplies only her own normalized opening contour style.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import numpy as np
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/hannelore-end-to-end/adult-mouth-fit'
OLD=ROOT/'assets/characters/residents/stadt-hannelore-sparkasse/delivery-v1/mouths-v1.json'
HEADINGS=('down','front-right','right','rear-right','up','rear-left','left','front-left')
# Native 512px working coordinates: own adult closed-lip crease, x/y,
# full tangent vector, short normal vector. A hidden rear-left lip is null.
TRACED={
 'down':([267,141],[13,0,0,2.2]),
 'front-right':([269,142],[12,-.8,0,2.1]),
 'right':([286,139],[6,-.4,0,1.7]),
 'rear-right':None,
 'up':None,
 'rear-left':None,
 'left':([225,142],[7,.4,0,1.7]),
 'front-left':([238,143],[11,.7,0,2.1]),
}
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def load(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def native_reg(center,axes,profile,size):
 tangent=np.array(axes[:2]);normal=np.array(axes[2:]);return {
  'rect':[center[0]/size[0],1-center[1]/size[1],float(np.linalg.norm(tangent))/size[0],float(np.linalg.norm(normal))/size[1]],
  'axes':axes,'profile':profile}
def main():
 OUT.mkdir(parents=True,exist_ok=True)
 mouth=load('hannelore_adult_mouth_helper',ROOT/'tools/build-street-mouths.py')
 street=load('hannelore_adult_export_helper',ROOT/'tools/build-street-character-sprites.py')
 old=json.loads(OLD.read_text())
 registrations={};checks={};pins={OLD.relative_to(ROOT).as_posix():sha(OLD)}
 for i,name in enumerate(HEADINGS):
  if TRACED[name] is None:
   registrations[name]=None;continue
  path=HERE/'registered'/f'{name}.png';pins[path.relative_to(ROOT).as_posix()]=sha(path)
  image=Image.open(path).convert('RGBA');center,axes=TRACED[name]
  profile=old['frames'][8*16+i]['profile']
  mouth.validate(profile)
  reg=native_reg(center,axes,profile,[512,512]);registrations[name]=reg
  entry={'input':{'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'dimensions':[512,512]},
         'centerPx':center,'axesPx':axes}
  closed=mouth.preview(entry,reg,0);opened=mouth.preview(entry,reg,1)
  a=np.asarray(image);b=np.asarray(opened)
  assert closed.tobytes()==image.tobytes()
  assert np.array_equal(a[:,:,3],b[:,:,3])
  changed=int(np.count_nonzero(np.any(a[:,:,:3]!=b[:,:,:3],axis=2)))
  assert changed>0,(name,'no opening paint')
  checks[name]={'closedExact':True,'openAlphaExact':True,'changedRgbPixels':changed,'sourceSha256':sha(path)}
  opened.save(OUT/(name+'-open-working.png'))
  cx,cy=center;box=(int(cx-25),int(cy-18),int(cx+26),int(cy+25))
  for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
   board=Image.new('RGB',((box[2]-box[0])*8*2, (box[3]-box[1])*8+30),bg)
   for col,im in enumerate((image,opened)):
    crop=im.crop(box);flat=Image.alpha_composite(Image.new('RGBA',crop.size,bg),crop)
    board.paste(flat.resize((crop.width*8,crop.height*8),Image.Resampling.NEAREST),(col*crop.width*8,30))
   ImageDraw.Draw(board).text((5,5),name+' source | max open | traced own adult lips',fill='#eee' if theme=='dark' else '#111')
   board.save(OUT/(name+'-'+theme+'.png'))
 # A new encoded standing will be made from exactly this down source and scale.
 front=Image.open(HERE/'registered/down.png').convert('RGBA')
 spec={'cell':[128,160],'pivot':[64,150],'figureHeight':136,'working':{'figureHeight':400,'baseline':472}}
 standing=street.export_cell(front,spec)
 standing.save(OUT/'standing-candidate.png')
 s=136/400;center=np.array(TRACED['down'][0])*s+np.array([64,150])-np.array([256,472])*s
 axes=(np.array(TRACED['down'][1])*s).tolist()
 stand=native_reg(center.tolist(),axes,registrations['down']['profile'],[128,160])
 registrations['standing']=stand
 data={'identity':'stadt-hannelore-sparkasse','status':'SOURCE-only own-adult mouth candidate, native timing pending',
       'pins':pins,'manualClosedLipFits':TRACED,'oldOwnProfileShapeOnly':sha(OLD),'registrations':registrations,
       'checks':checks,'explicitNull':['up','rear-left','rear-right'],
       'nullReason':{'up':'rear hair/no face','rear-left':'rear hair and cheek; no painted lip',
                     'rear-right':'near-side lip is subpixel at actual 80x100 native export; no shader-visible opening without painting cheek'},
       'standingCandidateSha256':sha(OUT/'standing-candidate.png')}
 (OUT/'fit.json').write_text(json.dumps(data,indent=2)+'\n')
 print(json.dumps({'visibleWorking':len(checks),'nullWorking':data['explicitNull'],'fitSha256':sha(OUT/'fit.json')}))
if __name__=='__main__':main()
