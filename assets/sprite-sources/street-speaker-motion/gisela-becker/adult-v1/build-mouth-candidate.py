"""Bind Gisela's own lip paint to her adult 21x18 delivery.

This authoring tool uses measured source lips and the existing source-field
motion equations. It never changes the runtime mouth renderer or other actors.
"""
from pathlib import Path
import hashlib
import json
import math

from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
ID='quiz-gisela-becker'
DEST=ROOT/'assets/characters/street-speakers'/ID/'delivery-adult-v1'
QA=ROOT/'output/street-redesign/gisela-end-to-end/mouth-adult-candidate'
QA.mkdir(parents=True,exist_ok=True)
sha=lambda path:hashlib.sha256(Path(path).read_bytes()).hexdigest()
read=lambda path:json.loads(Path(path).read_text(encoding='utf8'))
front=read(HERE/'mouth/front-source-fit.json')
profiles=read(HERE/'mouth/profiles-source-fits.json')['views']
source_receipt=read(HERE/'registered/source-receipt.json')['viewRecords']
layout=read(HERE/'assembly-receipt.json')['layout']

for named,entry in [('front',front['registration']),
                    ('right',profiles['right']['registration']),
                    ('left',profiles['left']['registration'])]:
    source=ROOT/entry['input']['file']
    if sha(source)!=entry['input']['sha256']:
        raise ValueError('Changed Gisela original mouth source: '+named)

def native(x,y,axes,profile):
    """Transport a working-space source mouth through existing native export."""
    scale=136/400
    cx=64+(x-256)*scale
    cy=150+(y-472)*scale
    ax=[v*scale for v in axes]
    first=math.hypot(ax[0],ax[1]);second=math.hypot(ax[2],ax[3])
    return {'rect':[cx/128,1-cy/160,first/128,second/160],
            'axes':ax,'profile':profile}

def original_working_center(name):
    entry=front['registration'] if name=='down' else profiles[name]['registration']
    binding=source_receipt[name]
    scale=binding['sourceToWorkingScale']
    px,py=entry['centerPx'];sx,sy=binding['sourcePivot']
    return [256+(px-sx)*scale,472+(py-sy)*scale]

templates={}
front_reg=front['registration'];front_profile=front['compiled']['profile']
fx,fy=original_working_center('down')
templates['down']=(fx,fy,[v*source_receipt['down']['sourceToWorkingScale'] for v in front_reg['axesPx']],front_profile)
# The walking side sources are her own generated complete-contact paint. Their
# visibly painted lip creases were measured in the exact registered 512px poses;
# the opening shapes come from her own original right/left profile annotations.
templates['right']=(266,137,[v*source_receipt['right']['sourceToWorkingScale'] for v in profiles['right']['registration']['axesPx']],profiles['right']['compiled']['profile'])
templates['left']=(220,139,[v*source_receipt['left']['sourceToWorkingScale'] for v in profiles['left']['registration']['axesPx']],profiles['left']['compiled']['profile'])

def moving(name,phase,strength):
    x,y,axes,profile=templates[name]
    if name=='down':
        actual=strength*.75
        bob=-3.4*math.cos(2*phase)*actual
        hip=3*math.sin(phase)*actual
        # PCHIP upper field rises from x=0 at y=0 toward the waist.
        x+=hip*.42
    else:
        actual=strength
        bob=-1.4*(math.cos(2*phase)+1)/2*actual
        sway=.8*math.sin(2*phase)*actual
        x-=.25*sway
    return native(x,y+bob,axes,profile)

cols,rows=21,18
frames=[None]*(cols*rows)
for name in ('down','right','left'):
    walk=layout['walks'][name]
    for col in range(16):
        frames[walk['row']*cols+col]=moving(name,col*math.tau/16,1)
    bridge=layout['bridges'][name]
    calls=([(0.75,15/16*math.tau),(0.4,15/16*math.tau),(0,0),(0.4,0),(0.75,0)]
           if name=='down' else [(1,0),(1,math.acos(.5)),(1,math.pi/2),(1,math.acos(.4)),(1,math.acos(.75))])
    for col,(strength,phase) in enumerate(calls):
        frames[bridge['row']*cols+col]=moving(name,phase,strength)
    for phase in range(16):
        for entry,strength in zip(layout['settles'][name][str(phase)]['frames'][:4],(.8,.6,.4,.2)):
            frames[entry['row']*cols+entry['col']]=moving(name,phase*math.tau/16,strength)

# Four actual authored quarter faces: positions are traced from their own
# registered source closeups, not inferred by mirroring the cardinal views.
quarter={
 'down-right':(256,132,[7.4,.45,0,2.9],front_profile),
 'up-right':(264,139,[6.6,.25,0,2.7],profiles['right']['compiled']['profile']),
 'up-left':(230,132,[6.6,.25,0,2.7],profiles['left']['compiled']['profile']),
 'down-left':(239,132,[7.4,.45,0,2.9],front_profile),
}
turn_names=['down','down-right','right','up-right','up','up-left','left','down-left']
for col,name in enumerate(turn_names):
    if name=='up':continue
    if name in templates:
        x,y,axes,profile=templates[name]
        frames[8*cols+col]=native(x,y,axes,profile)
    else:frames[8*cols+col]=native(*quarter[name])

# Her modest paper-emphasis action deforms the torso and cheek by a bounded
# upper field; the lip centre follows that source paint continuously.
for col in range(16):
    phase=col/15
    attack=min(1,phase/.28);release=min(1,(1-phase)/.3)
    wave=math.sin(math.pi/2*attack)**2*math.sin(math.pi/2*release)**2
    frames[13*cols+col]=native(fx+1.3*wave,fy+.68*wave,templates['down'][2],front_profile)

desktop=DEST/'source-desktop.webp';mobile=DEST/'source-mobile.webp';standing=DEST/'standing.webp'
for path in (desktop,mobile,standing):
    if not path.exists():raise ValueError('Build the adult Gisela body before its mouth')
with Image.open(desktop) as image:
    atlas=image.convert('RGBA')
if atlas.size!=(2016,2160):raise ValueError('Changed adult Gisela atlas grid')

def centre(reg):return [reg['rect'][0]*128,(1-reg['rect'][1])*160]
for slot,entry in enumerate(frames):
    row,col=divmod(slot,cols)
    box=atlas.crop((col*96,row*120,(col+1)*96,(row+1)*120))
    if entry is None:continue
    x,y=centre(entry)
    if not(0<=x<128 and 0<=y<160) or box.getpixel((round(x*.75),round(y*.75)))[3]<21:
        raise ValueError(f'Mouth centroid off own visible source at {row}:{col}: {(x,y)}')

standing_mouth=frames[8*cols]
definition={'schemaVersion':1,'id':ID,'cell':[128,160],'grid':[cols,rows],
            'sources':{'standing':sha(standing),'desktop':sha(desktop),'mobile':sha(mobile)},
            'standing':standing_mouth,'frames':frames}
target=DEST/'mouths-v1.json'
target.write_text(json.dumps(definition,separators=(',',':'))+'\n',encoding='utf8')
if target.stat().st_size>262144:raise ValueError('Mouth definition exceeds byte cap')

def board(indices,name):
    result=Image.new('RGB',(96*len(indices),120),'#eee8db')
    for index,slot in enumerate(indices):
        row,col=divmod(slot,cols)
        frame=atlas.crop((col*96,row*120,(col+1)*96,(row+1)*120))
        result.paste(frame,(96*index,0),frame)
        entry=frames[slot]
        if entry:
            cx,cy=centre(entry)
            ImageDraw.Draw(result).ellipse((96*index+cx*.75-1,cy*.75-1,96*index+cx*.75+1,cy*.75+1),outline='#ee1133',width=1)
    result.resize((result.width*3,result.height*3),Image.Resampling.NEAREST).save(QA/name)

board([8*cols+i for i in range(8)],'turn-mouth-centres-light-3x.png')
board([0,4,8,12,21,25,29,33,63,67,71,75,13*cols,13*cols+8],
      'movement-action-mouth-centres-light-3x.png')
receipt={'status':'source mouth registration candidate; GPU cue/closure pending',
         'inputSha256':{'front':sha(HERE/'mouth/front-source-fit.json'),
                        'profiles':sha(HERE/'mouth/profiles-source-fits.json'),
                        'layout':sha(HERE/'assembly-receipt.json')},
         'bodySha256':definition['sources'],'mouthSha256':sha(target),
         'mouthBytes':target.stat().st_size,'visibleSlots':sum(e is not None for e in frames),
         'nullSlots':sum(e is None for e in frames),'sideWorkingCentres':{'right':[266,137],'left':[220,139]},
         'quarterWorkingCentres':{k:list(v[:2]) for k,v in quarter.items()}}
(QA/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:receipt[k] for k in ('mouthSha256','mouthBytes','visibleSlots','nullSlots')}))
