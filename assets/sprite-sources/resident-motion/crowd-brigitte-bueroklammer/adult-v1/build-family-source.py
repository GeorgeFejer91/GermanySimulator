"""Prepared Brigitte-only source recipe; execution requires a separate lease.

Uses existing 21x20 cast capability layout and shared connected samplers.
Anatomy, protected LEFT pouch, gait fields and quiet landmarks are Brigitte's.
No runtime selection or publication is performed by this source recipe.
"""
from pathlib import Path
import hashlib,importlib.util,json,math
import numpy as np
from PIL import Image
from scipy.ndimage import label
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/bueroklammer-end-to-end/full-working'
ID='crowd-brigitte-bueroklammer';ORDER=('down','right','up','left')
TURN=('down','front-right','right','rear-right','up','rear-left','left','front-left')
ACTION_NAMES=('idle','look','success','failure')
QUIET_SETTINGS=json.loads((HERE/'pre-admission-family.json').read_text())['quietSettings']
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
pilot=load('bueroklammer_own_full_source_fields',HERE/'pilot-motion.py')
def layout():
    movement={(r,c) for r in range(4) for c in range(16)}|{(r,c) for r in range(4,8) for c in range(5)}|{(8,c) for c in range(8)}
    gestures={(r,c) for r in range(16,20) for c in range(16)}
    available=((r,c) for r in range(20) for c in range(21) if (r,c) not in movement|gestures)
    return movement,gestures,[next(available) for _ in range(256)]
def settings(action):
    # Original source vectors preserved; only attachment landmarks fit new paint.
    return {'neck_y':183,'hip_y':319,**QUIET_SETTINGS[action]}
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
def main():
    OUT.mkdir(parents=True,exist_ok=True);folder=OUT/'cells';folder.mkdir(exist_ok=True)
    slots={};stored={};checks={};movement,gestures,stops=layout()
    inputs={path.relative_to(ROOT).as_posix():sha(path) for path in [Path(__file__),HERE/'pilot-motion.py',HERE/'registration.json',HERE/'pre-admission-family.json',ROOT/'tools/build-street-character-sprites.py',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py']}
    for heading in TURN:
        path=HERE/'registered'/f'{heading}.png';assert path.is_file(),'Every original quarter painting is required';inputs[path.relative_to(ROOT).as_posix()]=sha(path)
    def add(row,col,key,image,heading,kind,phase=None,strength=None,mouth_dy=0,action=None,action_frame=None):
        assert (row,col) not in slots
        path=folder/f'{key}.png'
        if key not in stored:
            image.save(path);stored[key]={'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path)}
            rgba=np.array(image);groups,_=label(rgba[:,:,3]>=21);sizes=np.bincount(groups.ravel())[1:]
            box=image.getchannel('A').getbbox();assert box and min(box)>0 and box[2]<512 and box[3]<512
            assert not np.any(rgba[rgba[:,:,3]==0,:3]),'Hidden RGB in generated transparent pixels'
            checks[key]={'bounds':list(box),'substantiveComponents':[int(value) for value in sizes if value>=15]}
        slots[row,col]={'row':row,'col':col,'heading':heading,'kind':kind,'source':stored[key],'mouthDx':0,'mouthDy':mouth_dy,
            **({'action':action,'actionFrame':action_frame} if action else {}),**({'entryPhase':phase,'strength':strength} if phase is not None else {})}
    for index,heading in enumerate(ORDER):
        with Image.open(HERE/'registered'/f'{heading}.png') as raw:neutral=raw.convert('RGBA')
        for phase in range(16):
            radians=math.tau*phase/16;key=f'walk-{heading}-{phase:02}';image,_=pilot.render(heading,radians,1)
            def mouth(strength):return -3.4*math.cos(2*radians)*strength if heading in ('down','up') else 0
            add(index,phase,key,image,heading,'walk',mouth_dy=mouth(1))
            for stage in range(4):
                strength=1-stage/4;row,col=stops[(index*16+phase)*4+stage]
                stop=image if stage==0 else pilot.render(heading,radians,strength)[0]
                add(row,col,key if stage==0 else f'stop-{heading}-{phase:02}-{stage}',stop,heading,'stop',phase,strength,mouth(strength))
                if stage:stop.close()
            image.close()
        for col,strength in enumerate((.5,.25,0,.5,1)):
            image=neutral if strength==0 else pilot.render(heading,0,strength)[0]
            add(index+4,col,f'bridge-{heading}-{col}',image,heading,'bridge',mouth_dy=-3.4*strength if heading in ('down','up') else 0)
            if strength:image.close()
        neutral.close();print('built cardinal '+heading,flush=True)
    for col,heading in enumerate(TURN):
        with Image.open(HERE/'registered'/f'{heading}.png') as raw:image=raw.convert('RGBA')
        add(8,col,f'neutral-{heading}',image,heading,'turn');image.close()
    with Image.open(HERE/'registered/down.png') as raw:source=raw.convert('RGBA')
    street=load('bueroklammer_existing_planted_actions',ROOT/'tools/build-street-character-sprites.py')
    for offset,action in enumerate(ACTION_NAMES):
        for col,image in enumerate(street.planted_action(source,action,16,settings(action))):
            add(16+offset,col,f'action-{action}-{col:02}',image,'down','action',action=action,action_frame=col);image.close()
    source.close();assert len(slots)==412
    index={'identity':ID,'grid':[21,20],'status':'PRIVATE SOURCE; native/runtime pending','missingQuarterPaint':[],'selectedCells':len(slots),'sourceFiles':len(stored),'inputPins':inputs,'actionLandmarks':{'neck_y':183,'hip_y':319},'cells':[slots[key] for key in sorted(slots)],'pixelChecks':checks}
    (OUT/'body-index.json').write_text(json.dumps(index,indent=2)+'\n')
    print(json.dumps({'selectedCells':len(slots),'sourceFiles':len(stored),'multipleComponents':sum(len(value['substantiveComponents'])>1 for value in checks.values()),'sha256':sha(OUT/'body-index.json')}))
if __name__=='__main__':main()
