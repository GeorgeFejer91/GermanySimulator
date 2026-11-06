"""Ute owned21x20 family, built in bounded sections through existing samplers.

Original8 genuine views and approved own separate profile legs; no runtime write.
"""
from pathlib import Path
import argparse,hashlib,importlib.util,json,math
import numpy as np
from PIL import Image
from scipy.ndimage import label
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/ute-ruhe-end-to-end/full-working-v1'
ID='stadt-ute-ruhe';ORDER=('down','right','up','left')
TURN=('down','front-right','right','rear-right','up','rear-left','left','front-left')
ACTION_NAMES=('idle','look','success','failure')
PLAN=json.loads((HERE/'new-motion-capability-plan.json').read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
pilot=load('ute_full_own_fields_v2',HERE/'pilot-motion-v2.py')
def layout():
 movement={(r,c) for r in range(4) for c in range(16)}|{(r,c) for r in range(4,8) for c in range(5)}|{(8,c) for c in range(8)}
 gestures={(r,c) for r in range(16,20) for c in range(16)}
 available=((r,c) for r in range(20) for c in range(21) if (r,c) not in movement|gestures)
 return movement,gestures,[next(available) for _ in range(256)]
def settings(action):return {**PLAN['actionLandmarks'],**PLAN['states'][action]}
def action_displacement(points,action,index):
 points=np.asarray(points,float);y=points[...,1];values=settings(action);neck,hip=values['neck_y'],values['hip_y']
 torso=np.clip((hip-y)/(hip-neck),0,1);torso=torso*torso*(3-2*torso);head=np.clip((neck-y)/32,0,1)
 phase=index/16 if action=='idle' else index/15
 wave=math.sin(math.tau*phase) if action=='idle' else math.sin(math.pi/2*min(1,phase/.32))**2*math.sin(math.pi/2*min(1,(1-phase)/.32))**2
 dx=torso*wave*values['sway_pixels'];dy=head*wave*values['nod_pixels']
 if action=='success':
  flight=np.clip((phase-.18)/.62,0,1);dy=dy-values['lift_pixels']*math.sin(math.pi*flight)**2
  if phase<.18:dy=dy+torso*3*math.sin(math.pi*phase/.18)
 if index==0 or action!='idle' and index==15:dx=dx*0;dy=dy*0
 return np.stack([dx,dy],-1)
def forward_action(points,action,index):
 source=np.asarray(points,float);destination=source.copy()
 for _ in range(16):destination=source+action_displacement(destination,action,index)
 return destination
def input_pins():
 paths=[Path(__file__),HERE/'pilot-motion.py',HERE/'pilot-motion-v2.py',HERE/'profile-motion-v2.py',HERE/'prepare-profile-layers-v2.py',HERE/'profile-leg-controls-v2.json',HERE/'anatomy-controls-v1.json',HERE/'registration.json',HERE/'new-motion-capability-plan.json',HERE/'profile-leg-repair-v2/profile-layer-registration.json',ROOT/'tools/build-street-character-sprites.py',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py']
 paths+=sorted((HERE/'profile-leg-repair-v2').glob('*.png'))+sorted((HERE/'registered').glob('*.png'))
 return {p.relative_to(ROOT).as_posix():sha(p) for p in paths}
def build(section):
 OUT.mkdir(parents=True,exist_ok=True);folder=OUT/'cells';folder.mkdir(exist_ok=True)
 dest=OUT/f'section-{section}.json';assert not dest.exists(),'Preserve every source section attempt'
 slots={};stored={};checks={};inputs=input_pins();movement,gestures,stops=layout()
 def add(row,col,key,image,heading,kind,phase=None,strength=None,mouth_dy=0,action=None,action_frame=None):
  assert (row,col) not in slots
  path=folder/f'{key}.png'
  if key not in stored:
   assert not path.exists(),'Preserve source cell '+key
   image.save(path);stored[key]={'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path)}
   a=np.asarray(image);groups,_=label(a[:,:,3]>=21);sizes=np.bincount(groups.ravel())[1:]
   box=image.getchannel('A').getbbox();assert box and min(box)>0 and box[2]<512 and box[3]<512
   assert not np.any(a[a[:,:,3]==0,:3]),'Hidden RGB in transparent source'
   checks[key]={'bounds':list(box),'substantiveComponents':[int(z) for z in sizes if z>=15]}
  slots[row,col]={'row':row,'col':col,'heading':heading,'kind':kind,'source':stored[key],'mouthDx':0,'mouthDy':mouth_dy,**({'action':action,'actionFrame':action_frame} if action else {}),**({'entryPhase':phase,'strength':strength} if phase is not None else {})}
 if section in ORDER:
  i=ORDER.index(section);heading=section;neutral=pilot.neutral(heading)
  for phase in range(16):
   radians=math.tau*phase/16;key=f'walk-{heading}-{phase:02}';image,_=pilot.render(heading,radians,1)
   def mouth(strength):return -3.4*math.cos(2*radians)*strength if heading in ('down','up') else 0
   add(i,phase,key,image,heading,'walk',mouth_dy=mouth(1))
   for stage in range(4):
    strength=1-stage/4;row,col=stops[(i*16+phase)*4+stage];stop=image if stage==0 else pilot.render(heading,radians,strength)[0]
    add(row,col,key if stage==0 else f'stop-{heading}-{phase:02}-{stage}',stop,heading,'stop',phase,strength,mouth(strength))
    if stage:stop.close()
   image.close()
  for col,strength in enumerate((.5,.25,0,.5,1)):
   image=neutral if strength==0 else pilot.render(heading,0,strength)[0]
   add(i+4,col,f'bridge-{heading}-{col}',image,heading,'bridge',mouth_dy=-3.4*strength if heading in ('down','up') else 0)
   if strength:image.close()
  neutral.close();assert len(slots)==85
 else:
  assert section=='turn-actions'
  for col,heading in enumerate(TURN):
   image=pilot.neutral(heading);add(8,col,f'neutral-{heading}',image,heading,'turn');image.close()
  source=Image.open(HERE/'registered/down.png').convert('RGBA');street=load('ute_shared_planted_actions',ROOT/'tools/build-street-character-sprites.py')
  for offset,action in enumerate(ACTION_NAMES):
   for col,image in enumerate(street.planted_action(source,action,16,settings(action))):
    add(16+offset,col,f'action-{action}-{col:02}',image,'down','action',action=action,action_frame=col);image.close()
  source.close();assert len(slots)==72
 assert input_pins()==inputs,'Source changed during bounded section'
 data={'identity':ID,'section':section,'grid':[21,20],'selectedCells':len(slots),'sourceFiles':len(stored),'inputPins':inputs,'cells':[slots[k] for k in sorted(slots)],'pixelChecks':checks}
 dest.write_text(json.dumps(data,indent=2)+'\n');print(json.dumps({'section':section,'selectedCells':len(slots),'sourceFiles':len(stored),'sha256':sha(dest)}))
def merge():
 dest=OUT/'body-index.json';assert not dest.exists(),'Preserve full index'
 inputs=input_pins();slots={};checks={}
 for section in (*ORDER,'turn-actions'):
  p=OUT/f'section-{section}.json';d=json.loads(p.read_text());assert d['identity']==ID and d['inputPins']==inputs
  for cell in d['cells']:
   key=(cell['row'],cell['col']);assert key not in slots;assert sha(ROOT/cell['source']['file'])==cell['source']['sha256'];slots[key]=cell
  checks.update(d['pixelChecks'])
 movement,gestures,stops=layout();assert set(slots)==movement|gestures|set(stops) and len(slots)==412 and len(checks)==348
 data={'identity':ID,'grid':[21,20],'status':'PRIVATE SOURCE; native/runtime pending','missingQuarterPaint':[],'selectedCells':412,'sourceFiles':348,'inputPins':inputs,'actionLandmarks':PLAN['actionLandmarks'],'cells':[slots[k] for k in sorted(slots)],'pixelChecks':checks}
 dest.write_text(json.dumps(data,indent=2)+'\n');print(json.dumps({'selectedCells':412,'sourceFiles':348,'sha256':sha(dest)}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--section',required=True,choices=[*ORDER,'turn-actions','merge']);a=p.parse_args()
 merge() if a.section=='merge' else build(a.section)
