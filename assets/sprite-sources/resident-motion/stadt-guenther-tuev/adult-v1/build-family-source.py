"""Build Guenther's complete actor-owned 21x20 capability from adult paint.

Raw cardinal and quarter views are distinct whole paintings; all deformation
retains the original owned silhouette. No runtime selection or acceptance.
"""
from pathlib import Path
import argparse,copy,hashlib,importlib.util,json,math,shutil,sys
import numpy as np
from PIL import Image
from scipy.ndimage import label
ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/guenther-end-to-end/full-working'
ID='stadt-guenther-tuev'
ORDER=('down','right','up','left')
TURN=('down','front-right','right','rear-right','up','rear-left','left','front-left')
def load(path):
 s=importlib.util.spec_from_file_location('guenther_adult_source_field',path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
pilot=load(HERE/'pilot-motion.py')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def layout():
 movement={(r,c) for r in range(4) for c in range(16)}|{(r,c) for r in range(4,8) for c in range(5)}|{(8,c) for c in range(8)}
 gesture={(r,c) for r in range(16,20) for c in range(16)}
 available=((r,c) for r in range(20) for c in range(21) if (r,c) not in movement|gesture)
 stops=[next(available) for _ in range(256)]
 return movement,gesture,stops
ACTION_NAMES=('idle','look','success','failure')
ACTION_SETTINGS={'neck_y':165,'hip_y':302}
def settings(action):
 return {**ACTION_SETTINGS,'sway_pixels':1.2 if action=='idle' else 2 if action=='success' else 4,
  'nod_pixels':1 if action=='idle' else -3 if action=='success' else 4,'lift_pixels':10 if action=='success' else 0}

def action_displacement(points,action,index):
 # Exact source sampling field of existing planted_action, evaluated at points.
 points=np.asarray(points,float);y=points[...,1];v=settings(action);neck,hip=v['neck_y'],v['hip_y']
 torso=np.clip((hip-y)/(hip-neck),0,1);torso=torso*torso*(3-2*torso);head=np.clip((neck-y)/32,0,1)
 phase=index/16 if action=='idle' else index/15
 if action=='idle':wave=math.sin(math.tau*phase)
 else:wave=math.sin(math.pi/2*min(1,phase/.32))**2*math.sin(math.pi/2*min(1,(1-phase)/.32))**2
 dx=torso*wave*v['sway_pixels'];dy=head*wave*v['nod_pixels']
 if action=='success':
  flight=np.clip((phase-.18)/.62,0,1);dy=dy-v['lift_pixels']*math.sin(math.pi*flight)**2
  if phase<.18:dy=dy+torso*3*math.sin(math.pi*phase/.18)
 if index==0 or action!='idle' and index==15:dx=dx*0;dy=dy*0
 return np.stack([dx,dy],-1)

def forward_action(points,action,index):
 source=np.asarray(points,float);destination=source.copy()
 for _ in range(16):destination=source+action_displacement(destination,action,index)
 return destination

def run():
 OUT.mkdir(parents=True,exist_ok=True);folder=OUT/'cells';folder.mkdir(exist_ok=True)
 slots={};stored={};checks={}
 inputs={p.relative_to(ROOT).as_posix():sha(p) for p in [Path(__file__),HERE/'pilot-motion.py',HERE/'registration.json',ROOT/'tools/build-street-character-sprites.py',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py']}
 movement,gestures,stops=layout()
 def add(row,col,key,image,heading,kind,phase=None,strength=None,mouth_dy=0,action=None,action_frame=None):
  assert (row,col) not in slots
  path=folder/f'{key}.png'
  if key not in stored:
   image.save(path);stored[key]={'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path)}
   rgba=np.array(image);groups,_=label(rgba[:,:,3]>=21);sizes=np.bincount(groups.ravel())[1:]
   box=image.getchannel('A').getbbox();assert box and min(box)>0 and box[2]<512 and box[3]<512
   assert not np.any(rgba[rgba[:,:,3]==0,:3])
   checks[key]={'bounds':list(box),'substantiveComponents':[int(z) for z in sizes if z>=15]}
  slots[row,col]={'row':row,'col':col,'heading':heading,'kind':kind,'source':stored[key],
    'mouthDx':0,'mouthDy':mouth_dy,**({'action':action,'actionFrame':action_frame} if action else {}),**({'entryPhase':phase,'strength':strength} if phase is not None else {})}
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
 street=load(ROOT/'tools/build-street-character-sprites.py')
 for offset,action in enumerate(ACTION_NAMES):
  for col,image in enumerate(street.planted_action(source,action,16,settings(action))):
   add(16+offset,col,f'action-{action}-{col:02}',image,'down','action',action=action,action_frame=col)
 index={'identity':ID,'grid':[21,20],'status':'PRIVATE SOURCE; native/runtime pending',
  'missingQuarterPaint':missing,'selectedCells':len(slots),'sourceFiles':len(stored),'inputPins':inputs,
  'cells':[slots[k] for k in sorted(slots)],'pixelChecks':checks}
 (OUT/'body-index.json').write_text(json.dumps(index,indent=2)+'\n')
 print(json.dumps({'selectedCells':len(slots),'sourceFiles':len(stored),'missingQuarters':missing,
  'multipleComponents':sum(len(v['substantiveComponents'])>1 for v in checks.values()),'sha256':sha(OUT/'body-index.json')}))
def repair_profile_far():
 # Reuse this same actor renderer; default run() remains the canonical raw build.
 preserved=ROOT/'output/street-redesign/guenther-end-to-end/v1-preserved-packet'
 old_path=preserved/'body-index.json';current=OUT/'body-index.json'
 assert sha(current)==sha(old_path),'Only repair the exact preserved v1 family'
 old=json.loads(old_path.read_text());index=copy.deepcopy(old)
 assert old['identity']==ID and len(old['cells'])==412 and old['sourceFiles']==348
 def affected(cell):
  if cell['heading'] not in ('right','left'):return False
  phase=cell['col'] if cell['kind']=='walk' else cell.get('entryPhase')
  return cell['kind'] in ('walk','stop') and phase not in (0,4,8,12)
 changed=[cell for cell in index['cells'] if affected(cell)]
 unchanged=[cell for cell in index['cells'] if not affected(cell)]
 unique={cell['source']['file']:cell for cell in changed}
 assert len(changed)==120 and len(unique)==96 and len(unchanged)==292
 archive=preserved/'affected-working';assert not archive.exists(),'Preserve prior repair attempt'
 report_path=ROOT/'output/street-redesign/guenther-end-to-end/v2-targeted-source/report.json'
 assert not report_path.parent.exists(),'Preserve prior target report'
 report_path.parent.mkdir();archive.mkdir()
 before={cell['source']['file']:cell['source']['sha256'] for cell in old['cells']}
 assert len(before)==348
 for file,digest in before.items():assert sha(ROOT/file)==digest,('stale old source',file)
 for file in unique:
  source=ROOT/file;assert source.resolve().is_relative_to((OUT/'cells').resolve())
  destination=archive/file;destination.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,destination)
 report={'status':'RUNNING','scope':'Only own independent far-halfcycle field;120selected/96unique profile walk+stop,292unchanged','oldBodyIndexSha256':sha(old_path),'changedSource':{},'sourceCount':348}
 def save():report_path.write_text(json.dumps(report,indent=2)+'\n')
 save();new_hashes={}
 for file,cell in unique.items():
  phase=cell['col'] if cell['kind']=='walk' else cell['entryPhase'];strength=cell.get('strength',1)
  image,_=pilot.render(cell['heading'],math.tau*phase/16,strength)
  rgba=np.array(image);groups,_=label(rgba[:,:,3]>=21);sizes=np.bincount(groups.ravel())[1:]
  substantial=[int(value) for value in sizes if value>=15];assert len(substantial)==1,(file,substantial)
  box=image.getchannel('A').getbbox();assert box and min(box)>0 and box[2]<512 and box[3]<512
  assert not np.any(rgba[rgba[:,:,3]==0,:3])
  path=ROOT/file;image.save(path);digest=sha(path);assert digest!=before[file],('expected affected source did not change',file)
  new_hashes[file]=digest;index['pixelChecks'][path.stem]={'bounds':list(box),'substantiveComponents':substantial}
  report['changedSource'][file]={'old':before[file],'new':digest};save()
 for cell in index['cells']:
  file=cell['source']['file']
  if file in new_hashes:cell['source']['sha256']=new_hashes[file]
 for cell in unchanged:assert sha(ROOT/cell['source']['file'])==cell['source']['sha256'],('unaffected source changed',cell)
 old_by_slot={(cell['row'],cell['col']):cell for cell in old['cells']}
 for cell in index['cells']:
  if not affected(cell):assert cell==old_by_slot[cell['row'],cell['col']]
 permitted={Path(__file__).relative_to(ROOT).as_posix(),(HERE/'pilot-motion.py').relative_to(ROOT).as_posix()}
 for file,digest in index['inputPins'].items():
  if file in permitted:index['inputPins'][file]=sha(ROOT/file)
  else:assert sha(ROOT/file)==digest,('unrelated generation dependency changed',file)
 current.write_text(json.dumps(index,indent=2)+'\n')
 report.update(status='PASS targeted new source only;native/encoded/formal/raw-clean/runtime pending',changedSelected=120,changedUnique=96,unaffectedSelectedExact=292,unaffectedUniqueExact=len(before)-len(unique),newBodyIndexSha256=sha(current),newSourceMapSha256=sha(HERE/'pilot-motion.py'))
 save();print(json.dumps({key:report[key] for key in ('status','changedSelected','changedUnique','unaffectedSelectedExact','newBodyIndexSha256')}))

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--repair-profile-far',action='store_true');args=parser.parse_args()
 repair_profile_far() if args.repair_profile_far else run()
