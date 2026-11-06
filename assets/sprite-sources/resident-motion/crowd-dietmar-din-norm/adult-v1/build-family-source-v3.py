"""Dietmar-only v3 source successor; execution requires a separate lease.

Uses existing 21x20 cast capability layout and shared connected samplers.
Anatomy, protected RIGHT folding ruler and LEFT leather briefcase, gait fields and quiet landmarks are Dietmar's.
The approved v3 DOWN wrapper carries the complete original LEFT handle with
its hand/case layer. No held v2 source pixels/metadata are read as generation
inputs; all views/quiet/turns are freshly generated from owning source paint.
No runtime selection or publication is performed by this source recipe.
"""
from pathlib import Path
import hashlib,importlib.util,json,math
import numpy as np
from PIL import Image
from scipy.ndimage import label
ROOT=Path(__file__).resolve().parents[5];HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/street-redesign/dietmar-din-norm-end-to-end/full-working-v3'
ID='crowd-dietmar-din-norm';ORDER=('down','right','up','left')
TURN=('down','front-right','right','rear-right','up','rear-left','left','front-left')
ACTION_NAMES=('idle','look','success','failure')
QUIET_SETTINGS=json.loads((HERE/'new-motion-capability-plan.json').read_text())['states']
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
pilot=load('dietmar-din-norm_own_v3_full_source_fields',HERE/'pilot-motion-v3.py')
def layout():
    movement={(r,c) for r in range(4) for c in range(16)}|{(r,c) for r in range(4,8) for c in range(5)}|{(8,c) for c in range(8)}
    gestures={(r,c) for r in range(16,20) for c in range(16)}
    available=((r,c) for r in range(20) for c in range(21) if (r,c) not in movement|gestures)
    return movement,gestures,[next(available) for _ in range(256)]
def settings(action):
    # New supported quiet vectors from own capability plan; attachment landmarks fit own paint.
    return {'neck_y':140,'hip_y':238,**QUIET_SETTINGS[action]}
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
def source_inputs():
    paths=[Path(__file__),HERE/'pilot-motion.py',HERE/'pilot-motion-v2.py',HERE/'pilot-motion-v3.py',HERE/'profile-motion-v2.py',
        HERE/'prepare-profile-layers-v2.py',HERE/'profile-leg-repair-v2/controls-proposed-v1.json',
        HERE/'profile-leg-repair-v2/profile-layer-registration.json',HERE/'registration.json',
        HERE/'new-motion-capability-plan.json',ROOT/'tools/build-street-character-sprites.py',
        ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py']
    paths+=sorted((HERE/'profile-leg-repair-v2').glob('*.png'))
    paths+=[HERE/'registered'/f'{heading}.png' for heading in TURN]
    return {path.relative_to(ROOT).as_posix():sha(path) for path in paths}
def finalize():
    assert not (OUT/'body-index.json').exists(),'Preserve an existing finalized index'
    slots={};checks={};inputs=None
    for section in (*ORDER,'extras'):
        data=json.loads((OUT/f'section-{section}.json').read_text())
        assert data['identity']==ID and data['section']==section
        if inputs is None:inputs=data['inputPins']
        assert data['inputPins']==inputs,'Every source section must use identical actual generation inputs'
        for cell in data['cells']:
            slot=(cell['row'],cell['col']);assert slot not in slots
            assert sha(ROOT/cell['source']['file'])==cell['source']['sha256']
            slots[slot]=cell
        for key,value in data['pixelChecks'].items():
            assert key not in checks;checks[key]=value
    movement,gestures,stops=layout()
    assert set(slots)==movement|gestures|set(stops) and len(slots)==412
    assert all(sha(ROOT/rel)==digest for rel,digest in inputs.items())
    categories={kind:sum(cell['kind']==kind for cell in slots.values()) for kind in ('walk','bridge','turn','action','stop')}
    assert categories=={'walk':64,'bridge':20,'turn':8,'action':64,'stop':256}
    index={'identity':ID,'grid':[21,20],'status':'STAGED OWN SOURCE V3; native/formal/runtime acceptance pending',
        'missingQuarterPaint':[],'selectedCells':len(slots),'sourceFiles':len(checks),'inputPins':inputs,
        'actionLandmarks':{'neck_y':140,'hip_y':238},'categoryCounts':categories,
        'newQuietCapability':'Prior production standingOnly true; four own newly authored idle/look/success/failure vectors, not an inherited admitted action family',
        'profileAuthority':'Own approved separate complete layers; original near paint + genuine far paint, RIGHTfarcase/LEFTnearcase order; held xblend is never called for profiles',
        'sourceSuccessor':'v3 producer; approved original LEFT DOWN handle rigid ownership. Old v2 outputs remain held and are comparison-only, never generation inputs.',
        'cells':[slots[key] for key in sorted(slots)],'pixelChecks':checks}
    (OUT/'body-index.json').write_text(json.dumps(index,indent=2)+'\n')
    print(json.dumps({'selectedCells':len(slots),'sourceFiles':len(checks),'categoryCounts':categories,
        'multipleComponents':sum(len(value['substantiveComponents'])>1 for value in checks.values()),'sha256':sha(OUT/'body-index.json')}))
def main(section):
    OUT.mkdir(parents=True,exist_ok=True);folder=OUT/'cells';folder.mkdir(exist_ok=True)
    if section=='finalize':return finalize()
    receipt=OUT/f'section-{section}.json';assert not receipt.exists(),'Preserve every actual source section attempt'
    slots={};stored={};checks={};movement,gestures,stops=layout();inputs=source_inputs()
    def add(row,col,key,image,heading,kind,phase=None,strength=None,mouth_dy=0,action=None,action_frame=None):
        assert (row,col) not in slots
        path=folder/f'{key}.png'
        if key not in stored:
            assert not path.exists(),'Preserve partial prior source; use a fresh attempt after a RED'
            image.save(path);stored[key]={'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path)}
            rgba=np.array(image);groups,_=label(rgba[:,:,3]>=21);sizes=np.bincount(groups.ravel())[1:]
            box=image.getchannel('A').getbbox();assert box and min(box)>0 and box[2]<512 and box[3]<512
            assert not np.any(rgba[rgba[:,:,3]==0,:3]),'Hidden RGB in generated transparent pixels'
            checks[key]={'bounds':list(box),'substantiveComponents':[int(value) for value in sizes if value>=15]}
            if len(checks[key]['substantiveComponents'])!=1:
                failure={'key':key,'source':stored[key],'pixelCheck':checks[key],'gate':'Unchanged4-connected alpha>=21, substantive15pixel component rule; no threshold waiver'}
                (OUT/'component-red.json').write_text(json.dumps(failure,indent=2)+'\n')
                raise AssertionError(('Detached substantive source paint; preserve RED',failure))
        slots[row,col]={'row':row,'col':col,'heading':heading,'kind':kind,'source':stored[key],'mouthDx':0,'mouthDy':mouth_dy,
            **({'action':action,'actionFrame':action_frame} if action else {}),**({'entryPhase':phase,'strength':strength} if phase is not None else {})}
    if section in ORDER:
        index=ORDER.index(section);heading=section;neutral=pilot.neutral(heading)
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
        neutral.close();assert len(slots)==85 and len(stored)==69
    else:
        assert section=='extras'
        for col,heading in enumerate(TURN):
            image=pilot.neutral(heading);add(8,col,f'neutral-{heading}',image,heading,'turn');image.close()
        with Image.open(HERE/'registered/down.png') as raw:source=raw.convert('RGBA')
        street=load('dietmar_own_new_quiet_actions',ROOT/'tools/build-street-character-sprites.py')
        for offset,action in enumerate(ACTION_NAMES):
            for col,image in enumerate(street.planted_action(source,action,16,settings(action))):
                add(16+offset,col,f'action-{action}-{col:02}',image,'down','action',action=action,action_frame=col);image.close()
        source.close();assert len(slots)==72 and len(stored)==72
    assert all(sha(ROOT/rel)==digest for rel,digest in inputs.items())
    data={'identity':ID,'section':section,'status':'STAGED OWN SOURCE SECTION; not family/world admission','inputPins':inputs,
        'cells':[slots[key] for key in sorted(slots)],'pixelChecks':checks}
    receipt.write_text(json.dumps(data,indent=2)+'\n')
    print(json.dumps({'section':section,'selectedCells':len(slots),'sourceFiles':len(stored),'sha256':sha(receipt)}))
if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--section',required=True,choices=[*ORDER,'extras','finalize']);main(p.parse_args().section)
