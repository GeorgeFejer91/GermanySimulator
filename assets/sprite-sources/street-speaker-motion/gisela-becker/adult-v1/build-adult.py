"""Build Gisela's own connected adult 21x18 source atlas and seven states."""
from pathlib import Path
from copy import deepcopy
import hashlib
import importlib.util
import json
import math
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
OUT = ROOT/'assets/characters/street-speakers/quiz-gisela-becker/delivery-adult-v1'
QA = ROOT/'output/street-redesign/gisela-end-to-end/adult-build-qa'
OUT.mkdir(parents=True,exist_ok=True)
QA.mkdir(parents=True,exist_ok=True)
sys.path.insert(0, str(ROOT/'.agents/skills/animate-2d-characters/scripts'))

def module(name, path):
    spec=importlib.util.spec_from_file_location(name, ROOT/path)
    value=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value

resident=module('resident', 'tools/build-resident-motion.py')
street=resident.street
paint=resident.paint
spec={'working':{'figureHeight':400,'baseline':472},'cell':[128,160],
      'pivot':[64,150],'figureHeight':136}
directions=('down','right','up','left')
source=Image.new('RGBA',(2048,512))
for i,direction in enumerate(directions):
    source_file=HERE/'registered'/f'{direction}.png'
    if direction=='right':source_file=HERE/'registered/right-contact.png'
    if direction=='left':source_file=HERE/'registered/left-contact.png'
    source.alpha_composite(Image.open(source_file).convert('RGBA'),(i*512,0))
source_file=HERE/'registered/registered-cardinals-and-contact.png'
source.save(source_file)
source_rel=source_file.relative_to(ROOT).as_posix()
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
front=json.loads((HERE/'registered/front-back-receipt.json').read_text())
right=json.loads((HERE/'registered/right-receipt.json').read_text())
left=json.loads((HERE/'registered/left-receipt.json').read_text())
views={direction:deepcopy(front['results'][direction]['view']) for direction in ('down','up')}
views['right']=deepcopy(right['view'])
views['left']=deepcopy(left['view'])
person={'actorId':'gisela-becker','source':source_rel,'sourceSha256':sha(source_file),
        'scale':1,'views':views}

def planted_floor(side,nodes,dx,dy):
    descent=max(0,dy[-1])
    hip,ankle=nodes[2],nodes[-2]
    return dx,[value-descent*max(0,min(1,(y-hip)/(ankle-hip))) for y,value in zip(nodes,dy)]

def limb_pose(direction):return planted_floor if direction in ('down','up') else None

def sample(direction, strength=1, phases=None):
    return resident.motion(person,direction,count=16 if phases is None else max(4,len(phases)),
                           strength=strength,phases=phases,limb_pose=limb_pose(direction))[0]

def bridge(direction):
    if direction in ('right','left'):
        return resident.bridge_frames(person,direction)
    return [sample(direction,strength,[phase])[0] for strength,phase in
            [(0.75,15/16*math.tau),(0.4,15/16*math.tau),(0,0),(0.4,0),(0.75,0)]]

cols,rows=21,18
frames=[None]*(cols*rows)
walks={};bridges={};neutrals={}
for i,direction in enumerate(directions):
    walks[direction]={'row':i,'frames':16,'frame_ms':60,'loop':True}
    for col,frame in enumerate(sample(direction)):
        frames[i*cols+col]=frame
    bridges[direction]={'row':4+i,'stop_cols':[0,1,2],
                        'start_cols':[3,4],'frame_ms':70}
    for col,frame in enumerate(bridge(direction)):
        frames[(4+i)*cols+col]=frame
    neutrals[direction]=frames[(4+i)*cols+2]

# Own full-body turned source slots. Side cardinal anchors are the same actual
# contact-neutral frame used at the end of their bridge, without sprite jumps.
anchors={'down':0,'right':2,'up':4,'left':6}
turn_order=['down','down-right','right','up-right','up','up-left','left','down-left']
for i,name in enumerate(turn_order):
    if name in anchors:frame=neutrals[name]
    else:frame=Image.open(HERE/'turns'/f'{name}.png').convert('RGBA')
    frames[8*cols+i]=frame
turns={'pose_count':8,'rows':[8],'anchors':anchors,'frame_ms':85}
turn_cells=[{'row':8,'col':i} for i in range(8)]
transitions={a+'-to-'+b:{'frames':paint.plan_transition(a,b,walks,bridges,turn_cells,anchors,turn_ms=85)}
             for a in directions for b in directions if a!=b}

# Preserve old 21x18 delivery and seven state names. Gesture uses her painted
# right paper arm; quiet states remain a measured neutral hold.
for i in range(16):
    frames[13*cols+i]=Image.open(HERE/'action'/f'{i:02}.png').convert('RGBA')
states={name:{'row':13,'col':0,'durations_ms':[80]*16,'loop':False,'next':'neutral'}
        for name in ('greet','work','review')}
states.update({name:{'row':8,'col':0,'durations_ms':[ms],'loop':False,'next':'neutral'}
               for name,ms in [('look',80),('wait',600),('success',300),('failure',300)]})
selected={(row,col) for row in range(4) for col in range(16)}
selected|={(row,col) for row in range(4,8) for col in range(5)}
selected|={(8,col) for col in range(8)}
reserved=selected|{(13,col) for col in range(16)}
free=iter((row,col) for row in range(rows) for col in range(cols) if (row,col) not in reserved)
stops=[next(free) for _ in range(256)]
settles={}
for direction_index,direction in enumerate(directions):
    settles[direction]={}
    for phase in range(16):
        slots=stops[(direction_index*16+phase)*4:(direction_index*16+phase+1)*4]
        sequence=[]
        for (row,col),strength in zip(slots,(.8,.6,.4,.2)):
            frame=sample(direction,strength,[phase*math.tau/16])[0]
            frames[row*cols+col]=frame
            sequence.append({'row':row,'col':col,'ms':60})
        sequence.append({'row':4+direction_index,'col':2,'ms':70})
        settles[direction][str(phase)]={'frames':sequence}

frames=[f if f is not None else Image.new('RGBA',(512,512)) for f in frames]
layout={'cols':cols,'rows':rows,'walks':walks,'bridges':bridges,
        'turns':turns,'transitions':transitions,'settles':settles,
        'interactions':{'neutral':{'row':4,'col':2},'states':states}}
variants={}
for name,cell in [('desktop',[96,120]),('mobile',[64,80])]:
    export_spec={**spec,'cell':cell,'pivot':[v*cell[0]/128 for v in spec['pivot']],
                 'figureHeight':spec['figureHeight']*cell[0]/128}
    cells=[street.export_cell(frame,export_spec) for frame in frames]
    atlas=Image.new('RGBA',(cols*cell[0],rows*cell[1]))
    for index,frame in enumerate(cells):
        atlas.paste(frame,((index%cols)*cell[0],(index//cols)*cell[1]))
    file=OUT/f'source-{name}.webp'
    file.write_bytes(street.encoded(atlas,'WEBP',lossless=True,method=4,exact=True))
    with Image.open(file) as decoded:
        assert decoded.convert('RGBA').tobytes()==atlas.tobytes()
    variants[name]={'file':file.relative_to(ROOT).as_posix(),'sha256':sha(file),
                    'width':atlas.width,'height':atlas.height,'bytes':file.stat().st_size}
    if name=='desktop':
        for direction_index,direction in enumerate(directions):
            clips=[cells[direction_index*cols+i] for i in range(16)]
            for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
                street.opaque_board(clips,8,bg,2).save(QA/f'{direction}-{theme}-2x.png')
        street.opaque_board(cells[8*cols:8*cols+8],8,'#eee8db',2).save(QA/'turns-light-2x.png')
        for direction_index,direction in enumerate(directions):
            poses=[cells[p['row']*cols+p['col']] for phase in range(16)
                   for p in settles[direction][str(phase)]['frames']]
            street.opaque_board(poses,5,'#eee8db').save(QA/f'{direction}-all-stops-light.png')

standing=street.export_cell(neutrals['down'],spec)
standing_file=OUT/'standing.webp'
standing_file.write_bytes(street.encoded(standing,'WEBP',lossless=True,method=4,exact=True))
receipt={'status':'Gisela adult source body; mouth and browser require separate verification','sourceSha256':person['sourceSha256'],
         'source':source_rel,'views':views,'layout':layout,'variants':variants,
         'standingSha256':sha(standing_file),'standingBounds':standing.getchannel('A').getbbox()}
(HERE/'assembly-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
print(json.dumps({'variants':variants,'standingBounds':receipt['standingBounds']}))
