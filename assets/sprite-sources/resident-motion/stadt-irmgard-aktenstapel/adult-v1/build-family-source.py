"""Build Irmgard's complete actor-owned 21x18 capability from adult paint.

Raw cardinal and quarter views are distinct whole paintings; all deformation
retains the original owned silhouette. No runtime selection or acceptance.
"""
from pathlib import Path
import hashlib,importlib.util,json,math,sys
import numpy as np
from PIL import Image
from scipy.ndimage import label
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/aktenstapel-end-to-end/full-working'
ID='stadt-irmgard-aktenstapel'
ORDER=('down','right','up','left')
TURN=('down','front-right','right','rear-right','up','rear-left','left','front-left')
def load(path):
 s=importlib.util.spec_from_file_location('aktenstapel_adult_source_field',path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
pilot=load(HERE/'pilot-motion.py')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def layout():
 movement={(r,c) for r in range(4) for c in range(16)}|{(r,c) for r in range(4,8) for c in range(5)}|{(8,c) for c in range(8)}
 gesture={(13,c) for c in range(16)}
 available=((r,c) for r in range(18) for c in range(21) if (r,c) not in movement|gesture)
 stops=[next(available) for _ in range(256)]
 return movement,gesture,stops
def gesture(source,amount):
 if amount==0:return source.copy()
 yy,xx=np.mgrid[:512,:512];sx=xx.astype(float);sy=yy.astype(float)
 for _ in range(12):
  # Own empty anatomical RIGHT forearm/hand, screen-left. Its connected elbow
  # remains at the coat cuff; the hand rises in a restrained impatient shrug.
  # The LEFT file and grip, head and planted feet remain exact source paint.
  weight=pilot.smooth((sx-161)/10)*pilot.smooth((207-sx)/13)*pilot.smooth((sy-270)/35)*pilot.smooth((351-sy)/12)
  sx=xx+3*amount*weight;sy=yy+10*amount*weight
 return pilot.paint.unpack(pilot.paint.sample(pilot.paint.premul(source),sx,sy))
def run():
 OUT.mkdir(parents=True,exist_ok=True);folder=OUT/'cells';folder.mkdir(exist_ok=True)
 slots={};stored={};checks={}
 inputs={p.relative_to(ROOT).as_posix():sha(p) for p in [Path(__file__),HERE/'pilot-motion.py',HERE/'registration.json',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py']}
 inputs.update(json.loads((HERE/'registration.json').read_text())['inputPins'])
 for heading in ORDER:
  p=HERE/'registered'/f'{heading}.png';inputs[p.relative_to(ROOT).as_posix()]=sha(p)
 movement,gestures,stops=layout()
 def add(row,col,key,image,heading,kind,phase=None,strength=None,mouth_dy=0):
  assert (row,col) not in slots
  path=folder/f'{key}.png'
  if key not in stored:
   image.save(path);stored[key]={'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path)}
   rgba=np.array(image);groups,_=label(rgba[:,:,3]>=21);sizes=np.bincount(groups.ravel())[1:]
   box=image.getchannel('A').getbbox();assert box and min(box)>0 and box[2]<512 and box[3]<512
   assert not np.any(rgba[rgba[:,:,3]==0,:3])
   checks[key]={'bounds':list(box),'substantiveComponents':[int(z) for z in sizes if z>=15]}
  slots[row,col]={'row':row,'col':col,'heading':heading,'kind':kind,'source':stored[key],
    'mouthDx':0,'mouthDy':mouth_dy,**({'entryPhase':phase,'strength':strength} if phase is not None else {})}
 for i,heading in enumerate(ORDER):
  neutral=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
  for phase in range(16):
   rad=math.tau*phase/16;key=f'walk-{heading}-{phase:02}'
   image,_=pilot.render(heading,rad,1)
   mouth=lambda s:-3.4*math.cos(2*rad)*s if heading in ('down','up') else 0
   add(i,phase,key,image,heading,'walk',mouth_dy=mouth(1))
   for stage in range(4):
    strength=1-stage/4;row,col=stops[(i*16+phase)*4+stage]
    stop=image if stage==0 else pilot.render(heading,rad,strength)[0]
    add(row,col,key if stage==0 else f'stop-{heading}-{phase:02}-{stage}',stop,heading,'stop',phase,strength,mouth(strength))
  for col,strength in enumerate((.5,.25,0,.5,1)):
   image=neutral if strength==0 else pilot.render(heading,0,strength)[0]
   add(i+4,col,f'bridge-{heading}-{col}',image,heading,'bridge',mouth_dy=-3.4*strength if heading in ('down','up') else 0)
  print('built cardinal '+heading,flush=True)
 # Every quarter is an own whole-body painting, never mirrored source.
 missing=[]
 for col,heading in enumerate(TURN):
  path=HERE/'registered'/f'{heading}.png'
  if not path.exists():missing.append(heading);continue
  inputs[path.relative_to(ROOT).as_posix()]=sha(path)
  add(8,col,f'neutral-{heading}',Image.open(path).convert('RGBA'),heading,'turn')
 source=Image.open(HERE/'registered/down.png').convert('RGBA')
 values=[0,.05,.11,.18,.34,.53,.72,.90,1,1,1,.84,.66,.44,.20,0]
 for col,amount in enumerate(values):add(13,col,f'gesture-{col:02}',gesture(source,amount),'down','gesture')
 index={'identity':ID,'grid':[21,18],'status':'PRIVATE SOURCE; native/runtime pending',
  'missingQuarterPaint':missing,'selectedCells':len(slots),'sourceFiles':len(stored),'inputPins':inputs,
  'cells':[slots[k] for k in sorted(slots)],'pixelChecks':checks}
 (OUT/'body-index.json').write_text(json.dumps(index,indent=2)+'\n')
 print(json.dumps({'selectedCells':len(slots),'sourceFiles':len(stored),'missingQuarters':missing,
  'multipleComponents':sum(len(v['substantiveComponents'])>1 for v in checks.values()),'sha256':sha(OUT/'body-index.json')}))
if __name__=='__main__':run()
