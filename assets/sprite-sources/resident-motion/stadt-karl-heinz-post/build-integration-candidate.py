"""Assemble Karl's own paint and transported mouths in an ignored candidate.

This writes no runtime manifest. Logical standing geometry remains128x160;
desktop96x120 and mobile64x80 cells retain their directly sampled source pixels.
"""
from pathlib import Path
import argparse
from copy import deepcopy
import hashlib
import importlib.util
import json

from PIL import Image

ROOT=Path(__file__).resolve().parents[4]
FOLDER=Path(__file__).resolve().parent
ID='stadt-karl-heinz-post'
COLS,ROWS=21,18
DIRECTIONS=['down','right','up','left']
WALK_SHA='4eebaefae5f8b81d1854298bfcaf4559dd041ba740c4034b70baebd96a643eac'
STOP_SHA='0bca9aa3cb1deb4cf5f9c22ceaac3ab815b982268060d832f0a0eaba63d32077'
GESTURE_SHA='bbc03a2580f7827f260aaa7ef261d5e60973740fa6bc0d6ab20ebdb0375ae421'
MOUTH_SHA='773ba5337036caad5d9a59a510655eb12ce603b66e24a30d7603dd7930bc6fc6'
STANDING_SHA='6c5a8a033a432a9cbac17df85bb2322a4b88a7edc54c870d818433a925900877'
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):return json.loads(path.read_text(encoding='utf8'))


def write(path,data):path.write_text(json.dumps(data,separators=(',',':'))+'\n',encoding='utf8',newline='\n')


def layout():
    selected={(row,col) for row in range(4) for col in range(16)}
    selected|={(row,col) for row in range(4,8) for col in range(5)}
    selected|={(8,col) for col in range(8)}
    gesture={(13,col) for col in range(16)}
    reserved=selected|gesture
    available=((row,col) for row in range(ROWS) for col in range(COLS) if (row,col) not in reserved)
    stops=[next(available) for _ in range(256)]
    padding={(row,col) for row in range(ROWS) for col in range(COLS)}-reserved-set(stops)
    if (len(selected),len(gesture),len(stops),len(padding))!=(92,16,256,14):
        raise ValueError('Changed compact delivery layout')
    return selected,gesture,stops,padding


def check(path,expected,inputs):
    digest=sha(path)
    if digest!=expected:raise ValueError('Changed exact candidate source: '+str(path))
    inputs[path.relative_to(ROOT).as_posix() if path.is_relative_to(ROOT) else str(path)]=digest


def build(walk_folder,stop_folder,gesture_folder,mouth_path,output,cycle_distance):
    definition=importlib.util.spec_from_file_location('karl_source',FOLDER/'build-walk-source-v1.py')
    source=importlib.util.module_from_spec(definition);definition.loader.exec_module(source)
    cfg,fit=source.validate_config()
    builder=source.load_builder()
    source_person=fit['person'].copy();source_person['turn_sources']=cfg['turn_sources']
    bindings=builder.source_bindings(source_person)
    walk_path=walk_folder/'walk-source.json';stop_path=stop_folder/'stop-source.json';gesture_path=gesture_folder/'gesture-source.json'
    inputs={}
    for path,expected in [(walk_path,WALK_SHA),(stop_path,STOP_SHA),(gesture_path,GESTURE_SHA),(mouth_path,MOUTH_SHA)]:
        check(path,expected,inputs)
    walks,stops,gesture,moving=map(read,[walk_path,stop_path,gesture_path,mouth_path])
    if walks['sourceBindings']!=bindings or stops['sourceBindings']!=bindings or sha(walk_path)!=WALK_SHA:
        raise ValueError('Body sources changed after full export')
    if stops['walkReceiptSha256']!=sha(walk_path):raise ValueError('Stops use different gait')
    if (walks['id']!=ID or stops['id']!=ID or gesture['id']!=ID or walks['selectedCells']!=92
            or stops['stopCount']!=256 or gesture['frameCount']!=16 or gesture['frameMs']!=80):
        raise ValueError('Changed reviewed source coverage')
    if (moving['id']!=ID or moving['cell']!=[128,160] or
            moving['selection']!={'selectedCells':364,'visible':276,'null':88}):
        raise ValueError('Wrong own moving mouths')
    if cycle_distance!=27.53:raise ValueError('Expected candidate measured Karl gait distance 27.53')
    for name,digest in moving['inputFiles'].items():check(ROOT/name,digest,inputs)
    check(FOLDER/'mouth-source-v1/compile-moving-mouths.py',moving['driverSha256'],inputs)
    published=read(ROOT/'assets/characters/street/manifest.json')['characters'][ID]
    if published['cell']!=[128,160] or published['pivot']!=[64,150] or published['figureHeight']!=136 or published['figureWorldHeight']!=1.6:
        raise ValueError('Published own standing geometry changed')
    standing_path=ROOT/published['standing']['file'].removeprefix('./')
    profile_path=FOLDER/'mouth-source-v1/source-mouth-profiles-v1.json'
    profiles=read(profile_path)
    check(profile_path,moving['inputFiles'][profile_path.relative_to(ROOT).as_posix()],inputs)
    if (published['standing']['sha256']!=STANDING_SHA or sha(standing_path)!=STANDING_SHA or
            profiles['inputHashes'][standing_path.relative_to(ROOT).as_posix()]!=STANDING_SHA):
        raise ValueError('Own standing identity changed')
    if moving['standing']!=profiles['compiledStanding']:
        raise ValueError('Moving source replaced the own published standing mouth fit')
    selected,gesture_slots,stop_slots,padding=layout();reserved=selected|gesture_slots
    output.mkdir(parents=True,exist_ok=True)
    for path in [standing_path,FOLDER/'walk-source-config-v1.json',FOLDER/'source-fit-v3.json',
                 FOLDER/'build-walk-source-v1.py',ROOT/'assets/characters/street/manifest.json']:
        inputs[path.relative_to(ROOT).as_posix()]=sha(path)
    variants={};base='./assets/characters/residents/'+ID+'/delivery-v1/'
    for name,cell in [('desktop',[96,120]),('mobile',[64,80])]:
        w,h=cell;source_sheets=[]
        for folder,receipt in [(walk_folder,walks),(stop_folder,stops),(gesture_folder,gesture)]:
            entry=receipt['variants'][name];path=folder/entry['file']
            if sha(path)!=entry['sha256']:raise ValueError('Changed exact source paint: '+str(path))
            image=Image.open(path).convert('RGBA');source_sheets.append(image)
            inputs[path.relative_to(ROOT).as_posix() if path.is_relative_to(ROOT) else str(path)]=sha(path)
        body,stop_sheet,gesture_sheet=source_sheets
        if body.size!=(16*w,9*h) or stop_sheet.size!=(16*w,16*h) or gesture_sheet.size!=(16*w,h):
            raise ValueError('Changed native source atlas shape')
        atlas=Image.new('RGBA',(COLS*w,ROWS*h));cells={}
        for row,col in sorted(reserved):
            source,source_row=(gesture_sheet,0) if row==13 else (body,row)
            cells[row,col]=source.crop((col*w,source_row*h,(col+1)*w,(source_row+1)*h))
        for slot,position in enumerate(stop_slots):
            x,y=(slot%16)*w,(slot//16)*h
            cells[position]=stop_sheet.crop((x,y,x+w,y+h))
        gutters=[]
        for (row,col),image in cells.items():
            box=image.getchannel('A').getbbox()
            if box is None:raise ValueError('Empty selected body cell')
            gutters.append(min(box[0],box[1],w-box[2],h-box[3]))
            atlas.paste(image,(col*w,row*h))
        if min(gutters)<2:raise ValueError('Insufficient transparent native gutter')
        path=output/('source-'+name+'.webp');atlas.save(path,lossless=True,exact=True,method=4)
        if Image.open(path).convert('RGBA').tobytes()!=atlas.tobytes():raise ValueError('Lossless placement changed source pixels')
        decoded=Image.open(path).convert('RGBA')
        for (row,col),original in cells.items():
            if decoded.crop((col*w,row*h,(col+1)*w,(row+1)*h)).tobytes()!=original.tobytes():
                raise ValueError('Selected encoded cell differs from exact source')
        for row,col in padding:
            if decoded.crop((col*w,row*h,(col+1)*w,(row+1)*h)).getchannel('A').getbbox() is not None:
                raise ValueError('Paint in compact atlas padding')
        variants[name]=dict(file=base+path.name,sha256=sha(path),width=atlas.width,height=atlas.height)
    frames=[None]*(COLS*ROWS)
    for direction_index,direction in enumerate(DIRECTIONS):
        if len(moving['walks'][direction])!=16 or len(moving['bridges'][direction])!=5:raise ValueError('Missing own moving-mouth rows')
        for col,fit in enumerate(moving['walks'][direction]):frames[direction_index*COLS+col]=fit
        for col,fit in enumerate(moving['bridges'][direction]):frames[(direction_index+4)*COLS+col]=fit
    for field,length,row in [('turns',8,8),('gesture',16,13)]:
        if len(moving[field])!=length:raise ValueError('Missing own '+field+' mouth fits')
        for col,fit in enumerate(moving[field]):frames[row*COLS+col]=fit
    if len(moving['stops'])!=256:raise ValueError('Missing own phase stop mouths')
    for position,fit in zip(stop_slots,moving['stops']):frames[position[0]*COLS+position[1]]=fit
    if (sum(fit is not None for fit in frames)!=276 or
            any(frames[row*COLS+col] is not None for row,col in padding)):
        raise ValueError('Unexpected visible mouth coverage or padding paint')
    mouth=dict(schemaVersion=1,id=ID,cell=[128,160],grid=[COLS,ROWS],
        sources=dict(standing=published['standing']['sha256'],**{name:entry['sha256'] for name,entry in variants.items()}),
        standing=profiles['compiledStanding'],frames=frames)
    write(output/'mouths-v1.json',mouth)
    bridges={direction:{k:deepcopy(v) for k,v in walks['bridges'][direction].items() if k!='records'} for direction in DIRECTIONS}
    turns=[dict(row=8,col=col) for col in range(8)];anchors={direction:i*2 for i,direction in enumerate(DIRECTIONS)}
    transitions={a+'-to-'+b:dict(frames=builder.paint.plan_transition(a,b,walks['walks'],bridges,turns,anchors,turn_ms=85))
                 for a in DIRECTIONS for b in DIRECTIONS if a!=b}
    settles={}
    for i,direction in enumerate(DIRECTIONS):
        settles[direction]={}
        for phase in range(16):
            sequence=[dict(row=row,col=col,ms=70) for row,col in stop_slots[(i*16+phase)*4:(i*16+phase+1)*4]]
            sequence.append(dict(row=i+4,col=2,ms=70));settles[direction][str(phase)]=dict(frames=sequence)
    states={name:dict(row=13,col=0,durations_ms=[80]*16,loop=False,next='neutral') for name in ['greet','work','review']}
    states.update({name:dict(row=4,col=2,durations_ms=[ms],loop=False,next='neutral')
                   for name,ms in [('look',80),('wait',600),('success',300),('failure',300)]})
    person={key:deepcopy(published[key]) for key in ['id','aliases','cell','pivot','figureHeight','figureWorldHeight','standing']}
    person.update(standingOnly=False,grid=[COLS,ROWS],strideDistance=cycle_distance,variants=variants,
        clips={direction:dict(offset=i*COLS,count=16,seconds=.96) for i,direction in enumerate(DIRECTIONS)},
        atlasMotion=dict(schemaVersion=1,walks=walks['walks'],bridges=bridges,transitions=transitions,
            neutral=dict(row=4,col=2),settles=settles,interactions=dict(neutral=dict(row=4,col=2),states=states)),
        mouthPaint=dict(file=base+'mouths-v1.json',sha256=sha(output/'mouths-v1.json')))
    person['clips']['idle']=dict(offset=4*COLS+2,count=1,seconds=1);write(output/'person.json',person)
    if bindings!=builder.source_bindings(source_person):raise ValueError('Body sources changed during assembly')
    for name,digest in inputs.items():
        if sha(ROOT/name)!=digest:raise ValueError('Candidate input changed during assembly: '+name)
    receipt=dict(status='ignored integration candidate; packed/native/independent acceptance pending',
        inputs=inputs,sourceBindings=bindings,standingBinding={'file':published['standing']['file'],'sha256':STANDING_SHA},
        strideStatus='candidate 27.53; NOT ADMITTED by runtime/world-contact gate',driverSha256=sha(Path(__file__)),
        selectedMovementCells=92,selectedStopCells=256,selectedGestureCells=16,logicalCells=378,
        visibleMouths=276,nullMouths=102,translationPixels=dict(desktop=[0,0],mobile=[0,0]),
        outputs={name:sha(output/name) for name in ['source-desktop.webp','source-mobile.webp','mouths-v1.json','person.json']})
    write(output/'compile-receipt.json',receipt)
    print(json.dumps({'status':receipt['status'],'selectedCells':364,'visibleMouths':276,
                      'nullMouths':102,'outputs':receipt['outputs']}),flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    for option in ['walk-source','stop-source','gesture-source','mouth-fragment','outdir']:
        parser.add_argument('--'+option,type=Path,required=True)
    parser.add_argument('--cycle-distance',type=float,required=True)
    args=parser.parse_args()
    build(args.walk_source.resolve(),args.stop_source.resolve(),args.gesture_source.resolve(),
          args.mouth_fragment.resolve(),args.outdir.resolve(),args.cycle_distance)
