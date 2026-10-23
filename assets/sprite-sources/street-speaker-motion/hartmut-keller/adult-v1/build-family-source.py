"""Build Hartmut's complete actor-owned 21x19 capability from adult paint.

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
OUT=ROOT/'output/street-redesign/hartmut-keller-end-to-end/full-working'
ID='quiz-hartmut-keller'
ORDER=('down','right','up','left')
TURN=('down','front-right','right','rear-right','up','rear-left','left','front-left')
def load(path):
 s=importlib.util.spec_from_file_location('hartmut_adult_source_field',path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
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
  # Hartmut's RIGHT radio/hand/forearm and LEFT flashlight/notepad grip use
  # their own connected paint. Eyes, closed lips and feet stay outside.
  radio_body=pilot.smooth((sx-169)/12)*pilot.smooth((235-sx)/14)*pilot.smooth((sy-146)/8)*pilot.smooth((246-sy)/20)
  antenna=pilot.smooth((sx-190)/4)*pilot.smooth((212-sx)/5)*pilot.smooth((sy-124)/5)*pilot.smooth((181-sy)/12)
  radio=np.maximum(radio_body,antenna)
  notes=pilot.smooth((sx-255)/12)*pilot.smooth((331-sx)/12)*pilot.smooth((sy-173)/12)*pilot.smooth((244-sy)/15)
  sx=xx+amount*(1.5*radio-.5*notes);sy=yy+amount*(4*radio+2*notes)
 return pilot.paint.unpack(pilot.paint.sample(pilot.paint.premul(source),sx,sy))

def run():
 OUT.mkdir(parents=True,exist_ok=True);folder=OUT/'cells';folder.mkdir(exist_ok=True)
 slots={};stored={};checks={}
 inputs={p.relative_to(ROOT).as_posix():sha(p) for p in [Path(__file__),HERE/'pilot-motion.py',HERE/'registration.json',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py']}
 registration=json.loads((HERE/'registration.json').read_text())
 inputs[(HERE/'prepare-neutrals.py').relative_to(ROOT).as_posix()]=sha(HERE/'prepare-neutrals.py')
 for name,digest in registration['sourceHashes'].items():
  raw=ROOT/'assets/sprite-sources/berlin-street-20261022'/name;assert sha(raw)==digest
  inputs[raw.relative_to(ROOT).as_posix()]=digest
 for view in registration['views'].values():
  path=ROOT/view['registered'];assert sha(path)==view['registeredSha256']
  inputs[path.relative_to(ROOT).as_posix()]=sha(path)
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
 # Quarter paint is optional at this diagnostic stage. Do not substitute a
 # cardinal, mirrored painting or someone else's quarter when absent.
 missing=[]
 for col,heading in enumerate(TURN):
  path=HERE/'registered'/f'{heading}.png'
  if not path.exists():missing.append(heading);continue
  inputs[path.relative_to(ROOT).as_posix()]=sha(path)
  add(8,col,f'neutral-{heading}',Image.open(path).convert('RGBA'),heading,'turn')
 source=Image.open(HERE/'registered/down.png').convert('RGBA')
 values=[0,.05,.11,.18,.34,.53,.72,.90,1,1,1,.84,.66,.44,.20,0]
 for col,amount in enumerate(values):add(13,col,f'gesture-{col:02}',gesture(source,amount),'down','gesture')
 # Existing state schema addresses contiguous columns; these exact source
 # duplicates retain legacy hold durations without adding gear motion.
 for col in range(16):add(18,col,'neutral-down',source,'down','hold')
 index={'identity':ID,'grid':[21,19],'status':'PRIVATE SOURCE; native/runtime pending',
  'missingQuarterPaint':missing,'selectedCells':len(slots),'sourceFiles':len(stored),'inputPins':inputs,
  'cells':[slots[k] for k in sorted(slots)],'pixelChecks':checks}
 for rel,digest in inputs.items():assert sha(ROOT/rel)==digest,rel
 (OUT/'body-index.json').write_text(json.dumps(index,indent=2)+'\n')
 print(json.dumps({'selectedCells':len(slots),'sourceFiles':len(stored),'missingQuarters':missing,
  'multipleComponents':sum(len(v['substantiveComponents'])>1 for v in checks.values()),'sha256':sha(OUT/'body-index.json')}))
if __name__=='__main__':run()
