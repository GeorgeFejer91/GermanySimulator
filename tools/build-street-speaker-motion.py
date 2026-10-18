"""Source-bound street-speaker pilot; never automatically approves artwork.

Hartmut has sixteen-sample walks, eight genuine body-turn views and connected
reaction candidates. --inventory preserves complete semantic source groups for
twelve families. Authored vertical contacts remain a separate diagnostic trial
until their final motion and grounding have been reviewed.
"""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import math
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/street-speaker-motion'
DEST = ROOT / 'assets/characters/street-speakers'
SPEC = ROOT / 'assets/sprite-sources/street-quiz/speaker-motion-spec.json'
loader = importlib.util.spec_from_file_location('street_paint_source', ROOT / 'tools/build-street-character-sprites.py')
source_tools = importlib.util.module_from_spec(loader)
loader.loader.exec_module(source_tools)
paint = source_tools.paint
DIRS = ('down', 'right', 'up', 'left')
ACTIONS = ('greet', 'wait', 'work', 'review', 'success', 'failure', 'look', 'speaking')
SAMPLES = 16
CELL = (100, 160)
PIVOT = (50, 146)


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inventory():
    """Connected groups are measured before semantic ordering, never equal slices."""
    files = sorted((ROOT / 'assets/sprite-sources/street-quiz').glob('*-keys.png'))
    files = [p for p in files if p.stem != 'brigitte-neumann-keys']
    files += [ROOT / 'assets/sprite-sources/street-quiz/brigitte-neumann-keys-v2.png']
    files += sorted((ROOT / 'assets/sprite-sources/street-advisers').glob('*keys-candidate.png'))
    records = []
    for path in files:
        ident = path.name.split('-keys')[0]
        adviser = path.parent.name == 'street-advisers'
        source = Image.open(path).convert('RGBA')
        groups = source_tools.source_components(source)
        if len(groups) != 12:
            raise ValueError(f'{ident}: expected 12 complete source groups, found {len(groups)}')
        groups.sort(key=lambda b: b[1])
        groups = sum((sorted(groups[i:i+4], key=lambda b: b[0]) for i in range(0, 12, 4)), [])
        directory = OUT / 'sources' / ident
        directory.mkdir(parents=True, exist_ok=True)
        poses = {}
        for name, bounds in zip(DIRS + ACTIONS, groups):
            crop = source.crop((max(0,bounds[0]-2), max(0,bounds[1]-2), min(source.width,bounds[2]+2), min(source.height,bounds[3]+2)))
            crop.save(directory / (name + '-native.png'))
            for background, suffix in [('#eee8db', 'light'), ('#292b2e', 'dark')]:
                base = Image.new('RGB', crop.size, background)
                base.paste(crop, (0, 0), crop)
                base.save(directory / (name + '-' + suffix + '.png'))
            poses[name] = {'bounds': bounds, 'native': str((directory / (name+'-native.png')).relative_to(ROOT)).replace('\\','/')}
        records.append({'id': ident, 'voiceId': ('crowd-' if adviser else 'quiz-') + ident,
                        'actorId': ('street-' if adviser else '') + ident,
                        'source': str(path.relative_to(ROOT)).replace('\\','/'), 'sourceSha256': sha(path),
                        'size': list(source.size), 'poses': poses,
                        'status': 'HOLD: cardinal/action keys only; hidden limb paint, contacts and turn/action bridges unproved'})
    write_json(OUT / 'source-inventory.json', {'characters': records, 'sourceCount': len(records),
        'semanticPoseCount': len(records)*12, 'sourcePixelsChanged': False,
        'method': '12 complete alpha components ordered by source semantic row, then x; exact crops retained'})
    return records


def export_cell(frame, mobile=False):
    width, height = tuple(n//2 for n in CELL) if mobile else CELL
    scale = (136 / 416) * (.5 if mobile else 1)
    px, py = tuple(n//2 for n in PIVOT) if mobile else PIVOT
    yy, xx = np.mgrid[:height, :width]
    return paint.unpack(paint.sample(paint.premul(frame), (xx-px)/scale+256, (yy-py)/scale+480))


def layered_profile(source, direction, count=16, strength=1, phases=None, amplitude=52):
    """Own complete painted far limb fixes the hidden heel; original near paint stays.

    A fitted source mask follows the original shoe contour rather than slicing
    it at a screen column. No generated tube, mirrored limb or alpha crossfade.
    """
    right=direction=='right'
    polygons={
        'right':[(183,380),(268,380),(253,422),(257,432),(266,438),(272,448),(274,463),(271,470),(258,475),(185,477),(167,468),(168,449),(173,431)],
        'left':[(250,383),(332,382),(338,432),(343,448),(344,468),(334,475),(266,478),(245,473),(241,463),(243,451),(250,439),(260,432),(251,418)]}
    mask=Image.new('L',(512,512))
    ImageDraw.Draw(mask).polygon(polygons[direction],fill=255)
    near=np.asarray(source).copy()
    near[:,:,3]=np.minimum(near[:,:,3],np.asarray(mask))
    near[near[:,:,3]==0]=0
    near=Image.fromarray(near)
    raw=Image.open(ROOT/f'assets/sprite-sources/street-speaker-motion/hartmut-keller/{direction}-far-leg-v1.png').convert('RGBA')
    pixels=np.asarray(raw).copy()
    pixels[pixels[:,:,3]<20]=0
    raw=Image.fromarray(pixels)
    bbox=raw.getbbox()
    crop=raw.crop(bbox)
    ratio=88/crop.width
    yy,xx=np.mgrid[:512,:512]
    # Original far sole and full shoe width; hidden root extends beneath vest.
    x=248 if right else 174
    y=471-crop.height*ratio
    far=paint.unpack(paint.sample(paint.premul(crop),(xx-x)/ratio,(yy-y)/ratio))
    if strength != 0:
        far = repair_far_shoe(far, direction)
    upper=np.asarray(source).copy()
    upper[397:]=0
    upper=Image.fromarray(upper)
    parts=[near,far]
    anchors=[224,292] if right else [291,218]
    frames=[]
    for phase in phases if phases is not None else np.arange(count)*math.tau/count:
        canvas=Image.new('RGBA',(512,512))
        bob=-3.4*math.cos(2*phase)*strength
        weight=3*math.sin(phase)*strength
        limbs=[]
        for side in range(2):
            t=phase+side*math.pi
            contact_phase=(t/math.tau-.25)%1
            if contact_phase<=.5:
                excursion=1-4*contact_phase
                lift=0
            else:
                swing=(contact_phase-.5)*2
                excursion=-1-2*swing+12*swing*swing-8*swing*swing*swing
                lift=18*math.sin(math.pi*swing)*strength
            shift=((256-anchors[side])+amplitude*excursion*(1 if right else -1))*strength
            # Whole shoe translates rigidly below its own ankle; thigh roots
            # remain beneath the shared garment and fixed foreground side.
            limbs.append(paint.warp_layer(parts[side],[0,350,380,410,438,511],
                [0,weight,weight+shift*.15,shift*.6,shift,shift], [bob,bob,bob-lift*.12,bob*.4-lift*.6,-lift,-lift]))
        canvas.alpha_composite(limbs[1])
        canvas.alpha_composite(limbs[0])
        canvas.alpha_composite(paint.warp_layer(upper,[0,250,350,397,511],
            [-weight*.2,-weight*.2,weight*.6,weight,weight],[bob]*5))
        frames.append(canvas)
    return frames


def repair_far_shoe(original, direction):
    """Replace only painted shoe below measured original cuff; retain upper leg."""
    filename = 'right-far-leg-shoe-candidate-v3.png' if direction == 'right' else 'left-far-leg-shoe-candidate-v2.png'
    raw = np.array(Image.open(ROOT/'assets/sprite-sources/street-speaker-motion/hartmut-keller'/filename).convert('RGBA'))
    raw[raw[:,:,3] < 20] = 0
    im = Image.fromarray(raw); im = im.crop(im.getbbox())
    ratio = 88 / im.width
    yy, xx = np.mgrid[:512,:512]
    x = 248 if direction == 'right' else 174
    candidate = paint.unpack(paint.sample(paint.premul(im), (xx-x)/ratio, (yy-(471-im.height*ratio))/ratio))
    # The seam follows the existing cloth cuff, entirely below the rigid thigh.
    points = ([(248,438),(254,442),(264,445),(276,445),(290,442),(304,438),(336,438)]
              if direction == 'right' else
              [(174,438),(193,438),(208,438),(224,443),(243,445),(257,441),(262,436)])
    boundary = np.interp(xx, [p[0] for p in points], [p[1] for p in points])
    mask = np.clip(yy-boundary, 0, 1)
    a, b = paint.premul(original), paint.premul(candidate)
    result = paint.unpack(a*(1-mask[:,:,None]) + b*mask[:,:,None])
    assert np.array_equal(np.array(result)[:436], np.array(original)[:436])
    return result


def prove_frame(frame, name):
    a = np.asarray(frame)[:, :, 3]
    if not np.any(a) or np.any(a[:2]) or np.any(a[-2:]) or np.any(a[:, :2]) or np.any(a[:, -2:]):
        raise ValueError(f'{name}: empty frame or missing two-pixel transparent gutter')
    if np.any(np.asarray(frame)[a == 0]):
        raise ValueError(f'{name}: RGB under zero alpha')


def build(spec):
    ident = spec['id']
    voice = spec['voiceId']
    original = json.loads((ROOT / spec['registeredSourceSpec']).read_text(encoding='utf-8'))['characters'][ident]
    source_path = ROOT / original['source']
    if sha(source_path) != original['sourceSha256']:
        raise ValueError('Source changed; measured registration must be reviewed again')
    source = Image.open(source_path).convert('RGBA')
    scale = 416 / original['sourceFigureHeight']
    sources, coords = {}, {}
    directory = OUT / ident
    directory.mkdir(parents=True, exist_ok=True)
    for name, view in original['views'].items():
        sources[name], origin = source_tools.register_source(source, view, scale, 480)
        sources[name].save(directory / (name+'-source.png'))
        if name in DIRS:
            coords[name] = source_tools.registered_landmarks(view, scale, origin)
            coords[name]['step_width'] = spec['stepWidth']
    raw_sources=dict(sources)
    for name in ('right','left'):
        sources[name]=layered_profile(raw_sources[name],name,count=1,strength=0,phases=[0])[0]
        sources[name].save(directory/(name+'-repaired-neutral.png'))
    def animate(name, strength=1, phases=None):
        if name in ('right','left'):
            return layered_profile(raw_sources[name],name,strength=strength,phases=phases), []
        return authored_vertical(sources[name],name,strength=strength/spec['strength'],phases=phases), []
    rows, walks, bridges, motion = [], {}, {}, {}
    for name in DIRS:
        frames, records = animate(name,strength=spec['strength'])
        rows.append(frames)
        walks[name] = {'row': len(rows)-1, 'frames': SAMPLES, 'count': SAMPLES, 'frame_ms': 60, 'loop': True}
        motion[name] = records
        source_tools.opaque_board([sources[name]] + [frames[i] for i in (0,4,8,12)], 5, '#eee8db').save(directory / (name+'-native-extremes.png'))
    for name in DIRS:
        # Entry follows sample15; exact source neutral is the last stop frame.
        stop = []
        for phase, factor in [(15.25/16,.75), (15.5/16,.5), (15.75/16,.25)]:
            stop += animate(name,strength=spec['strength']*factor, phases=[phase*math.tau])[0]
        stop.append(sources[name])
        start = []
        for factor in (.25,.5,.75,1):
            start += animate(name,strength=spec['strength']*factor, phases=[0])[0]
        rows.append(stop+start)
        bridges[name] = {'row':len(rows)-1, 'stop_cols':[0,1,2,3], 'start_cols':[4,5,6,7], 'frame_ms':45}
    turn_row = len(rows)
    turn_source=Image.open(ROOT/'assets/sprite-sources/street-speaker-motion/hartmut-keller/quarter-turns-v1.png').convert('RGBA')
    turns_by_name={}
    for name,bounds,pivot in [
        ('front-right',[189,42,529,600],[359,604]),('rear-right',[740,44,1059,604],[899,604]),
        ('rear-left',[191,650,518,1207],[354,1207]),('front-left',[737,647,1066,1205],[901,1207])]:
        turns_by_name[name]=source_tools.register_source(turn_source,{'component_bounds':bounds,'source_pivot':pivot},416/558,480)[0]
        turns_by_name[name].save(directory/(name+'-turn-source.png'))
    rows.append([sources['down'],turns_by_name['front-right'],sources['right'],turns_by_name['rear-right'],
                 sources['up'],turns_by_name['rear-left'],sources['left'],turns_by_name['front-left']])
    actions_row = len(rows)
    rows.append(speaking_trial(dense=True))
    greet_row = len(rows)
    rows.append(gesture_trial(dense=True))
    success_row=len(rows)
    rows.append(speaking_trial(dense=True,action='success',bases=rows[greet_row]))
    wait_row=len(rows)
    rows.append([paint.warp_layer(sources['down'],[0,260,395,511],[.8*t,.8*t,0,0],[-2*t,-t,0,0])
        if t>1e-8 else sources['down'].copy() for t in [.5-.5*math.cos(math.tau*i/15) for i in range(16)]])
    look_row=len(rows);rows.append(head_reaction('look'))
    failure_row=len(rows);rows.append(head_reaction('failure'))
    work_row=len(rows);rows.append(notebook_trial(dense=True))
    turns = [{'row':turn_row,'col':i} for i in range(8)]
    anchors = {name:i*2 for i,name in enumerate(DIRS)}
    transitions = {}
    for source_dir in DIRS:
        for target in DIRS:
            if source_dir != target:
                transitions[source_dir+'-to-'+target] = {'from':source_dir, 'to':target,
                    'frames':paint.plan_transition(source_dir,target,walks,bridges,turns,anchors),
                    'status':'real painted cardinal/quarter turns; awaiting exact ordered review'}
    person = {'id':ident,'actorId':ident,'voiceId':voice,'aliases':[ident,voice],
        'frame_size':list(CELL),'pivot':list(PIVOT),'cols':16,'rows':len(rows),'grid':[16,len(rows)],
        'figureHeight':136,'figureWorldHeight':1.6,
        'neutralBounds':{name:list(export_cell(sources[name]).getbbox()) for name in DIRS},
        'neutral':{'row':turn_row,'col':0},'walks':walks,'bridges':bridges,
        'turns':{'rows':[turn_row], 'pose_count':8,'frame_ms':85,'anchors':anchors,'clockwise':True},
        'transitions':transitions,
        'interactions':{'states':{name:{'row':actions_row,'col':i,'durations_ms':[350],
                        'status':'source anchor only; connected entry/return NOT BUILT'} for i,name in enumerate(ACTIONS)}},
        'source':original['source'],'sourceSha256':original['sourceSha256'],
        'additionalSources':{name:sha(ROOT/'assets/sprite-sources/street-speaker-motion/hartmut-keller'/name)
            for name in ['right-far-leg-v1.png','left-far-leg-v1.png','quarter-turns-v1.png','right-arm-backing-v1.png','left-arm-backing-v1.png','vertical-leg-layers-v2.png','vertical-contact-fit.json','right-far-leg-shoe-candidate-v3.png','left-far-leg-shoe-candidate-v2.png']},
        'motionSpec':str(SPEC.relative_to(ROOT)).replace('\\','/'),
        'variants':{},'visual_acceptance':{'status':'hold','findings':spec['findings']},
        'cycle_distance':32,'gaitCalibration':{'status':'Source-only calibration at1.6world; current canonical runtime calibration pending',
            'profileWorkingAmplitude':52,'strength':spec['strength'],'gameUnitsPerPixel':1.6/136/.02},
        'loadPolicy':'Opt-in candidate only. Select one client variant; never prefetch whole cast. Existing admission/cache/teardown owners required.'}
    person['interactions']['neutral']={'row':turn_row,'col':0}
    person['interactions']['states']['greet']={'row':greet_row,'col':0,'durations_ms':[60]*16,
        'loop':False,'status':'candidate source-bound radio raise and recovery; exact neutral endpoints',
        'next':'neutral'}
    person['interactions']['states']['speaking']={'row':actions_row,'col':0,'durations_ms':[65]*8,
        'loop':True,'status':'candidate local mouth correspondence from actual speaking source; exact neutral endpoints','next':'neutral'}
    person['interactions']['states']['success']={'row':success_row,'col':0,'durations_ms':[60]*16,
        'loop':False,'status':'candidate radio raise plus source smile; exact neutral endpoints','next':'neutral'}
    for name,row,ms in [('wait',wait_row,100),('look',look_row,60),('failure',failure_row,70),('work',work_row,60),('review',work_row,90)]:
        person['interactions']['states'][name]={'row':row,'col':0,'durations_ms':[ms]*16,
            'loop':name=='wait','next':'neutral','status':'candidate; exact neutral entry/recovery',
            'sourceMotion':'Shared source reading gesture, slower inspection timing' if name=='review' else
                'Original neutral painted torso breath' if name=='wait' else 'Measured semantic source correspondence'}
    (DEST / voice).mkdir(parents=True, exist_ok=True)
    for mobile in (False,True):
        kind='mobile' if mobile else 'desktop'
        cell=tuple(n//2 for n in CELL) if mobile else CELL
        encoded=Image.new('RGBA',(cell[0]*16,cell[1]*len(rows)))
        for row, frames in enumerate(rows):
            for col, frame in enumerate(frames):
                im=export_cell(frame,mobile)
                prove_frame(im,f'{kind}/{row}/{col}')
                encoded.alpha_composite(im,(col*cell[0],row*cell[1]))
        atlas_path=DEST / voice / (kind+'.webp')
        encoded.save(atlas_path,'WEBP',lossless=True,method=6,exact=True)
        decoded=Image.open(atlas_path).convert('RGBA')
        if decoded.tobytes()!=encoded.tobytes():
            raise ValueError('Lossless export changed decoded pixels')
        if max(decoded.size)>4096 or decoded.width*decoded.height*4>16*1024*1024:
            raise ValueError('Candidate exceeds per-texture size or decoded budget')
        person['variants'][kind]={'file':'./'+str(atlas_path.relative_to(ROOT)).replace('\\','/'),
            'image':atlas_path.name,
            'width':decoded.width,'height':decoded.height,'bytes':atlas_path.stat().st_size,
            'decodedBytes':decoded.width*decoded.height*4,'sha256':sha(atlas_path),
            'frame_size':list(cell),'pivot':[n//2 for n in PIVOT] if mobile else list(PIVOT)}
        qa=directory/kind
        qa.mkdir(parents=True,exist_ok=True)
        row_names=list(DIRS)+[name+'-bridge' for name in DIRS]+['turn-cardinals','speaking','greet','success','wait','look','failure','work-review']
        records=[]
        for row,(name,original_frames) in enumerate(zip(row_names,rows)):
            frames=[]
            for col in range(len(original_frames)):
                im=decoded.crop((col*cell[0],row*cell[1],(col+1)*cell[0],(row+1)*cell[1]))
                prove_frame(im,f'decoded/{kind}/{row}/{col}')
                fp=qa/(name+f'-{col:02}.png')
                im.save(fp)
                records.append({'id':f'{name}-{col:02}','row':row,'col':col,'sha256':sha(fp),
                                'file':str(fp.relative_to(ROOT)).replace('\\','/')})
                frames.append(im)
            for bg,suffix in [('#eee8db','light'),('#292b2e','dark')]:
                source_tools.opaque_board(frames,8,bg).save(qa/(name+'-native-'+suffix+'.png'))
                source_tools.opaque_board(frames,8,bg,3).save(qa/(name+'-enlarged-'+suffix+'.png'))
            if name in DIRS:
                if len({f.tobytes() for f in frames})!=SAMPLES:
                    raise ValueError('Walk must contain16 distinct decoded samples')
                sequence=[source_tools.opaque_board([f],1,'#eee8db',2) for f in frames]
                sequence[0].save(qa/(name+'-ordered.gif'),save_all=True,append_images=sequence[1:],duration=60,loop=0,disposal=2)
            if name.endswith('-bridge'):
                direction=name[:-7]
                neutral=export_cell(sources[direction],mobile)
                if frames[3].tobytes()!=neutral.tobytes():raise ValueError('Stop is not exact neutral')
                walking=export_cell(rows[DIRS.index(direction)][0],mobile)
                if frames[7].tobytes()!=walking.tobytes():raise ValueError('Start does not join phase zero')
            if name in ('greet','success','wait','look','failure','work-review'):
                neutral=export_cell(sources['down'],mobile).tobytes()
                if frames[0].tobytes()!=neutral or frames[-1].tobytes()!=neutral:
                    raise ValueError('Greet must enter and recover to exact planted down neutral')
            if name=='speaking':
                neutral=export_cell(sources['down'],mobile).tobytes()
                if frames[0].tobytes()!=neutral or frames[-1].tobytes()!=neutral:
                    raise ValueError('Speaking must enter and recover to exact planted down neutral')
        write_json(qa/'exact-frame-evidence.json',{'export':person['variants'][kind],'frames':records,
            'distinctWalkSamples':16,'endpointChecks':'PASS: four exact stop neutral and start phase-zero joins',
            'status':'mechanical only; anatomical/turn/action acceptance HOLD'})
    calibrate_profiles(person)
    calibrate_vertical(person)
    review_transitions(person)
    write_json(directory/'motion-landmarks.json',{'source':original['source'],'sourceSha256':original['sourceSha256'],'landmarks':coords,'motion':motion})
    write_json(DEST/voice/'manifest.json',person)
    write_json(DEST/'manifest.json',{'schemaVersion':1,'status':'candidate-held; opt-in only','characters':{voice:person}})
    return person


def calibrate_profiles(person):
    """Mark exact encoded bottom soles where the other foot is above them.

    These windows were visually checked for foot identity. Unwrapped far-foot
    phases14..18 cover the loop seam. This establishes profile contact only;
    the perspective camera and vertical ground projection remain runtime gates.
    """
    import assess_walk_speed
    measurements=[]
    for kind,variant in person['variants'].items():
        atlas=Image.open(ROOT/variant['file'].removeprefix('./')).convert('RGBA')
        width,height=variant['frame_size']
        for direction in ('right','left'):
            contacts=[];marked=[]
            for foot,phases in [('near',range(4,13)),('far',range(14,19))]:
                samples=[]
                for phase in phases:
                    col=phase%16;row=person['walks'][direction]['row']
                    cell=atlas.crop((col*width,row*height,(col+1)*width,(row+1)*height))
                    alpha=np.asarray(cell)[:,:,3]
                    y=int(np.where(alpha>=128)[0].max())
                    xs=np.where(alpha[y]>=128)[0]
                    x=float((xs.min()+xs.max())/2)
                    samples.append({'frame':phase,'along_pixels':x*(1 if direction=='right' else -1),
                        'cell_x':x,'cell_y':y,'soleSpan':[int(xs.min()),int(xs.max())]})
                    im=source_tools.opaque_board([cell],1,'#eee8db',4)
                    ImageDraw.Draw(im).ellipse((x*4-3,y*4-3,x*4+3,y*4+3),fill='#e00040')
                    marked.append(im.convert('RGBA'))
                contacts.append({'foot':foot,'samples':samples})
            contact={'character':person['id'],'view':direction+'-'+kind,'atlas_file':str((ROOT/variant['file'].removeprefix('./')).resolve()),
                'atlas_sha256':variant['sha256'],'frames_per_cycle':16,
                'game_units_per_pixel':person['figureWorldHeight']/(136*(.5 if kind=='mobile' else 1))/.02,
                'current_cycle_distance':person['cycle_distance'],'shoe_length_pixels':35*(.5 if kind=='mobile' else 1),
                'contacts':contacts,'method':'Exact alpha>=128 sole centre in inspected contact windows; shoe length35px is full near shoe extent, not bottom sole span.'}
            measurements.append(contact)
            source_tools.opaque_board(marked,7,'#eee8db').save(OUT/person['id']/kind/(direction+'-contact-marks.png'))
    records=OUT/person['id']/'contact-measurements.json'
    write_json(records,{'assessments':measurements})
    report=assess_walk_speed.assess_file(records)
    write_json(OUT/person['id']/'contact-assessment.json',report)
    person['gaitCalibration'].update({'status':'Profile contact measured on exact desktop/mobile bytes; down/up projection and runtime grounding NOT VERIFIED',
        'profileFittedDistance':report['character_means'][person['id']],
        'measurementFile':str(records.relative_to(ROOT)).replace('\\','/')})
    return report


def review_transitions(person):
    turns=[{'row':person['turns']['rows'][0],'col':i} for i in range(8)]
    for kind,variant in person['variants'].items():
        atlas=Image.open(ROOT/variant['file'].removeprefix('./')).convert('RGBA')
        width,height=variant['frame_size'];folder=OUT/person['id']/kind
        sequences={}
        for name,transition in person['transitions'].items():
            sequence=paint.plan_transition(transition['from'],transition['to'],person['walks'],person['bridges'],
                turns,person['turns']['anchors'],with_context=True)
            sequences[name]=sequence
            for tag,indices in [('ordered',transition['frames']),('context',sequence)]:
                frames=[atlas.crop((f['col']*width,f['row']*height,(f['col']+1)*width,(f['row']+1)*height)) for f in indices]
                for bg,suffix in [('#eee8db','light'),('#292b2e','dark')]:
                    source_tools.opaque_board(frames,8,bg).save(folder/(name+'-'+tag+'-'+suffix+'.png'))
        write_json(folder/'ordered-transition-evidence.json',{'atlas':variant,'sequences':sequences,
            'method':'Exact decoded source walk16, stop, actual bodyturns, start and destination walk16; no synthetic tween/crossfade.'})


def calibrate_vertical(person):
    import assess_walk_speed
    tilt=math.atan2(10.5,16.7);depth=11.5*math.sin(tilt)+14*math.cos(tilt)
    projection=11.5/depth;measurements=[]
    reference={'cameraHeight':11.5,'cameraBehind':14,'lookHeight':1,'lookAhead':2.7,
        'actorPosition':'sameground plane and sameZ as player','groundYProjectionPerBillboardPixel':projection,
        'runtimeFile':'world3d.js','runtimeSha256':sha(ROOT/'world3d.js'),
        'limitation':'Analytical reference camera only. Projection changes with actor/camera position; no live foot locking claim.'}
    for kind,v in person['variants'].items():
        atlas=Image.open(ROOT/v['file'].removeprefix('./')).convert('RGBA');w,h=v['frame_size']
        for direction in ('down','up'):
            contacts=[]
            for side,phases in [(0,range(4,13)),(1,range(14,19))]:
                samples=[];x0,x1=(0,w//2-1) if side==0 else (w//2+1,w)
                for phase in phases:
                    col=phase%16;row=person['walks'][direction]['row']
                    cell=atlas.crop((col*w,row*h,(col+1)*w,(row+1)*h));a=np.array(cell)[:,:,3]
                    y=int(np.where(a[:,x0:x1]>=128)[0].max())
                    samples.append({'frame':phase,'along_pixels':y*(1 if direction=='down' else -1),'soleY':y,'footXWindow':[x0,x1]})
                contacts.append({'foot':'viewer-left' if side==0 else 'viewer-right','samples':samples})
            measurements.append({'character':person['id'],'view':direction+'-'+kind,
                'atlas_file':str((ROOT/v['file'].removeprefix('./')).resolve()),'atlas_sha256':v['sha256'],
                'frames_per_cycle':16,'game_units_per_pixel':person['figureWorldHeight']/(136*(.5 if kind=='mobile' else 1))/.02/projection,
                'current_cycle_distance':person['cycle_distance'],'shoe_length_pixels':15*(.5 if kind=='mobile' else 1),
                'contacts':contacts,'referenceCamera':reference})
    path=OUT/person['id']/'vertical-contact-measurements.json';write_json(path,{'assessments':measurements})
    report=assess_walk_speed.assess_file(path);write_json(OUT/person['id']/'vertical-contact-assessment.json',report)
    person['gaitCalibration'].update({'verticalReferenceCamera':reference,
        'verticalReferenceFittedDistance':report['character_means'][person['id']],
        'verticalMeasurementFile':str(path.relative_to(ROOT)).replace('\\','/'),
        'status':'Exact encoded profiles and vertical reference-camera contact measured; live perspective grounding NOT VERIFIED'})
    return report


def bake_profile_shoes():
    """Bounded repair: replace profile gait cells in frozen atlas, copy all else."""
    frozen = OUT/'frozen-9b4a-8174'
    person = json.loads((frozen/'manifest.json').read_text())
    spec = json.loads(SPEC.read_text())
    directory = OUT/person['id']
    generated = {}
    for direction in ('right','left'):
        source = Image.open(directory/(direction+'-source.png')).convert('RGBA')
        generated[direction] = layered_profile(source,direction,strength=spec['strength'])
        stops = [layered_profile(source,direction,strength=spec['strength']*factor,phases=[phase/16*math.tau])[0]
                 for phase,factor in [(15.25,.75),(15.5,.5),(15.75,.25)]]
        starts = [layered_profile(source,direction,strength=spec['strength']*factor,phases=[0])[0]
                  for factor in (.25,.5,.75,1)]
        generated[direction+'-bridge'] = dict(zip([0,1,2,4,5,6,7],stops+starts))
    differences = {}
    for kind,variant in person['variants'].items():
        mobile = kind == 'mobile'; w,h = variant['frame_size']
        before = Image.open(frozen/(kind+'.webp')).convert('RGBA'); after = before.copy()
        for direction in ('right','left'):
            for name,row in [(direction,person['walks'][direction]['row']),
                             (direction+'-bridge',person['bridges'][direction]['row'])]:
                frames = generated[name]
                pairs = frames.items() if isinstance(frames,dict) else enumerate(frames)
                for col,frame in pairs:
                    cell = export_cell(frame,mobile);prove_frame(cell,f'{kind}/{name}/{col}')
                    after.paste(cell,(col*w,row*h))
        changed = []
        for row in range(person['rows']):
            cells = []
            for col in range(16):
                box=(col*w,row*h,(col+1)*w,(row+1)*h)
                delta=np.any(np.array(before.crop(box))!=np.array(after.crop(box)),axis=2)
                if delta.any():
                    assert row in (1,3,5,7) and not (row in (5,7) and col==3)
                    ys,xs=np.where(delta)
                    cells.append({'col':col,'changedPixels':int(delta.sum()),'bounds':[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]})
            if cells:changed.append({'row':row,'cells':cells})
        path=DEST/person['voiceId']/(kind+'.webp');after.save(path,'WEBP',lossless=True,method=6,exact=True)
        decoded=Image.open(path).convert('RGBA');assert decoded.tobytes()==after.tobytes()
        variant.update({'sha256':sha(path),'bytes':path.stat().st_size})
        differences[kind]={'frozenSha256':sha(frozen/(kind+'.webp')),'newSha256':sha(path),'changedRows':changed,
            'unchanged':'down/up walks and bridges, all neutral/turn cells, all actions; profile bridge neutral col3 unchanged'}
        qa=directory/kind
        evidence=json.loads((qa/'exact-frame-evidence.json').read_text())
        evidence['export']=variant
        for record in evidence['frames']:
            row,col=record['row'],record['col'];frame=decoded.crop((col*w,row*h,(col+1)*w,(row+1)*h))
            fp=ROOT/record['file'];frame.save(fp);record['sha256']=sha(fp)
        write_json(qa/'exact-frame-evidence.json',evidence)
        for direction in ('right','left'):
            for name,row,count in [(direction,person['walks'][direction]['row'],16),
                                    (direction+'-bridge',person['bridges'][direction]['row'],8)]:
                frames=[decoded.crop((i*w,row*h,(i+1)*w,(row+1)*h)) for i in range(count)]
                for bg,suffix in [('#eee8db','light'),('#292b2e','dark')]:
                    source_tools.opaque_board(frames,8,bg).save(qa/(name+'-native-'+suffix+'.png'))
                    source_tools.opaque_board(frames,8,bg,3).save(qa/(name+'-enlarged-'+suffix+'.png'))
                if count==16:
                    assert len({f.tobytes() for f in frames})==16
                    seq=[source_tools.opaque_board([f],1,'#eee8db',2) for f in frames]
                    for suffix,ms in [('ordered',60),('slow',180)]:
                        seq[0].save(qa/(name+'-'+suffix+'.gif'),save_all=True,append_images=seq[1:],duration=ms,loop=0,disposal=2)
                    source_tools.opaque_board([frames[i] for i in (13,14,15,0,1,2)],6,'#eee8db').save(qa/(name+'-seam-native.png'))
    person['figureWorldHeight']=1.6;person['cycle_distance']=32
    person['gaitCalibration']={'status':'Exact source profile measurement at1.6world; new canonical camera/runtime not exercised',
        'figureWorldHeight':1.6,'gameUnitsPerPixel':1.6/136/.02,'profileWorkingAmplitude':52,'strength':spec['strength'],
        'verticalStatus':'Previous camera projection/calibration is historical and not valid for the new canonical runtime. Up/down pixels unchanged; fresh runtime measurement required.'}
    report=calibrate_profiles(person)
    person['cycle_distance']=round(report['character_means'][person['id']],3)
    calibrate_profiles(person)
    person['gaitCalibration']['status']='Exact encoded profile stance remeasured at1.6world; cycle_distance is source-only candidate, not new canonical runtime approval'
    for filename in ('right-far-leg-shoe-candidate-v3.png','left-far-leg-shoe-candidate-v2.png'):
        person['additionalSources'][filename]=sha(ROOT/'assets/sprite-sources/street-speaker-motion/hartmut-keller'/filename)
    person['visual_acceptance']={'status':'hold','findings':[
        'Narrow far-shoe material repair only. Original upper legs, trajectories and pivots retained; neutral and turns unchanged.',
        'Profile shoe candidates use each own original reference; full heel, rounded toe and dark sole. Exact encoded native review pending.',
        'Vertical knee articulation remains subtle at native size; unchanged by this repair.',
        'Normal/slow temporal loop and current canonical runtime grounding/speed gates remain incomplete.',
        'Figure world height is1.6. Profile cycle is remeasured from source soles; up/down and camera calibration require new canonical runtime.',
        'Other eleven families remain source inventory only; no automatic adoption.' ]}
    review_transitions(person)
    write_json(directory/'shoe-only-pixel-comparison.json',differences)
    write_json(DEST/person['voiceId']/'manifest.json',person)
    write_json(DEST/'manifest.json',{'schemaVersion':1,'status':'candidate-held; opt-in only','characters':{person['voiceId']:person}})
    return person


def check():
    manifest=json.loads((DEST/'manifest.json').read_text(encoding='utf-8'))
    for person in manifest['characters'].values():
        for kind,record in person['variants'].items():
            path=ROOT/record['file'].removeprefix('./')
            im=Image.open(path).convert('RGBA')
            assert sha(path)==record['sha256'] and list(im.size)==[record['width'],record['height']]
            width,height=record['frame_size']
            for name,walk in person['walks'].items():
                frames=[im.crop((i*width,walk['row']*height,(i+1)*width,(walk['row']+1)*height)) for i in range(walk['frames'])]
                assert len({f.tobytes() for f in frames})==16
                for i,f in enumerate(frames):prove_frame(f,f'{kind}/{name}/{i}')
            for transition in person['transitions'].values():
                assert transition['from']!=transition['to'] and len(transition['frames'])>=9
                for f in transition['frames']:assert 0<=f['row']<person['rows'] and 0<=f['col']<person['cols'] and f['ms']>0
    print(json.dumps({'status':'PASS mechanical candidate checks','visualAcceptance':'HOLD','actors':len(manifest['characters'])}))


def gesture_trial(dense=False):
    """A bounded actual-source correspondence trial, never a blanket morph pass."""
    from scipy.spatial import Delaunay
    from morph_frames import morph
    pairs=[
        ((0,0),(0,0)),((511,0),(511,0)),((511,511),(511,511)),((0,511),(0,511)),
        ((80,160),(80,160)),((80,290),(80,290)),((80,390),(80,390)),
        ((420,160),(420,160)),((420,290),(420,290)),((420,390),(420,390)),
        ((256,35),(256,35)),((256,500),(256,500)),
        ((257,65),(257,76)),((157,105),(153,115)),((345,106),(349,110)),
        ((153,169),(151,180)),((348,169),(351,179)),
        ((166,211),(164,216)),((331,210),(335,218)),
        ((193,248),(194,259)),((253,269),(257,281)),((310,246),(313,261)),
        ((214,175),(217,184)),((296,176),(299,186)),((260,208),(264,220)),((260,240),(261,250)),
        ((151,237),(153,185)),((161,278),(163,226)),((172,300),(174,248)),
        ((150,303),(152,251)),((192,326),(194,274)),((184,307),(186,255)),
        ((146,339),(148,287)),((176,349),(178,297)),((129,339),(127,326)),
        ((138,304),(134,288)),((183,279),(187,287)),((189,353),(181,337)),((151,365),(151,348)),
        ((170,390),(165,392)),((224,398),(224,398)),((256,382),(256,382)),
        ((300,298),(303,305)),((340,306),(347,310)),((335,345),(339,350)),
        ((310,371),(315,378)),((378,345),(386,346)),((361,292),(366,293)),
        ((300,399),(300,399)),((350,393),(350,393)),
        ((156,475),(156,475)),((256,430),(256,430)),((355,475),(355,475))]
    points=np.asarray(pairs,dtype=float)
    keep=list(range(12))+[i for i in range(26,39) if i!=36]
    points=points[keep]
    triangles=Delaunay(points.mean(axis=1)).simplices
    a=Image.open(OUT/'down-source.png').convert('RGBA')
    b=Image.open(OUT/'greet-source.png').convert('RGBA')
    polygons=[[(147,234),(169,234),(181,282),(201,293),(210,334),(199,369),(157,371),(125,353),(125,308),(148,281)],
              [(154,185),(164,185),(176,224),(191,234),(201,250),(200,282),(185,310),(186,331),(174,347),(150,353),(127,339),(123,314),(132,286),(148,272),(149,235)]]
    layers=[];masks=[]
    for im,polygon in zip([a,b],polygons):
        mask=Image.new('L',(512,512));ImageDraw.Draw(mask).polygon(polygon,fill=255)
        layer=np.asarray(im).copy();layer[:,:,3]=np.minimum(layer[:,:,3],np.asarray(mask));layer[layer[:,:,3]==0]=0
        layers.append(Image.fromarray(layer));masks.append(mask)
    handmask=Image.new('L',(512,512))
    ImageDraw.Draw(handmask).polygon([(150,234),(161,234),(168,277),(179,279),(190,286),(197,305),
        (197,330),(189,346),(177,354),(167,344),(151,340),(145,330),(144,312),(149,296),(155,282)],fill=255)
    hand=np.asarray(a).copy();hand[:,:,3]=np.minimum(hand[:,:,3],np.asarray(handmask));hand[hand[:,:,3]==0]=0
    hand=Image.fromarray(hand)
    for i in range(2):
        handcut=Image.new('L',(512,512));handcut.paste(handmask,(i*2,-i*52))
        layer=np.asarray(layers[i]).copy();layer[np.asarray(handcut)>0]=0;layers[i]=Image.fromarray(layer)
    backing=Image.open(ROOT/'assets/sprite-sources/street-speaker-motion/hartmut-keller/right-arm-backing-v1.png').convert('RGBA')
    pixels=np.asarray(backing).copy();pixels[pixels[:,:,3]<20]=0;backing=Image.fromarray(pixels)
    bb=backing.getbbox();scale=416/(bb[3]-bb[1])
    plate,_=source_tools.register_source(backing,{'component_bounds':list(bb),'source_pivot':[(bb[0]+bb[2])/2,bb[3]]},scale,480)
    base=np.asarray(a).copy();replacement=np.asarray(plate).copy()
    replacement[:280]=0
    base[np.asarray(masks[0])>0]=replacement[np.asarray(masks[0])>0]
    base=Image.fromarray(base)
    folder=OUT/'greet-layered-v2';folder.mkdir(parents=True,exist_ok=True)
    base.save(folder/'backing.png');layers[0].save(folder/'neutral-arm.png');layers[1].save(folder/'raised-arm.png')
    write_json(folder/'controls.json',{'source':str(OUT/'down-source.png'),'target':str(OUT/'greet-source.png'),
        'points_source':points[:,0].tolist(),'points_target':points[:,1].tolist(),'triangles':triangles.tolist()})
    frames=[]
    times=[.5-.5*math.cos(math.tau*i/15) for i in range(16)] if dense else [0,.25,.5,.75,1]
    for t in times:
        arm=morph(layers[0],layers[1],points[:,0],points[:,1],triangles,t)
        f=base.copy();f.alpha_composite(arm)
        yy,xx=np.mgrid[:512,:512]
        f.alpha_composite(paint.unpack(paint.sample(paint.premul(hand),xx-t*2,yy+t*52)))
        if t<1e-8:f=a.copy()
        f.save(folder/(str(t)+'.png'));frames.append(f)
    source_tools.opaque_board(frames,5,'#eee8db').save(folder/'trial.png')
    return frames


def speaking_trial(dense=False,action='speaking',bases=None):
    """Interpolate painted mouth landmarks, leaving the rest of the face fixed."""
    from scipy.spatial import Delaunay
    from morph_frames import morph
    a=Image.open(OUT/'hartmut-keller/down-source.png').convert('RGBA')
    raw=Image.open(OUT/'hartmut-keller'/(action+'-source.png')).convert('RGBA')
    b=Image.new('RGBA',(512,512));b.alpha_composite(raw,(-12,0) if action=='success' else (4,-10))
    ring=[(0,0),(511,0),(511,511),(0,511),(220,200),(270,200),(320,200),
          (320,230),(320,270),(270,270),(220,270),(220,230)]
    source=np.array(ring+[(243,231),(268,224),(293,228),(268,235),(268,229)],dtype=float)
    target=np.array(ring+([(239,231),(269,225),(295,219),(270,234),(269,229)] if action=='success' else
                         [(245,234),(271,225),(291,227),(275,241),(270,233)]),dtype=float)
    triangles=Delaunay((source+target)/2).simplices
    write_json(OUT/(action+'-mouth-correspondence.json'),{'source':'output/street-speaker-motion/hartmut-keller/down-source.png',
        'sourceSha256':sha(OUT/'hartmut-keller/down-source.png'),
        'target':'output/street-speaker-motion/hartmut-keller/'+action+'-source.png',
        'targetSha256':sha(OUT/'hartmut-keller'/(action+'-source.png')),
        'targetTranslation':[-12,0] if action=='success' else [4,-10],
        'sourcePoints':source.tolist(),'targetPoints':target.tolist(),'triangles':triangles.tolist(),
        'scope':'Only feathered mouth region, ellipse centre268,231 radius39,23; original face outside remains unchanged.'})
    yy,xx=np.mgrid[:512,:512]
    radius=np.sqrt(((xx-268)/39)**2+((yy-231)/23)**2)
    weight=np.clip((1-radius)*4,0,1)[:,:,None]
    frames=[]
    times=([.5-.5*math.cos(math.tau*i/15) for i in range(16)] if action=='success' else
           [0,.25,.6,1,.7,.4,.1,0]) if dense else [0,.25,.5,.75,1,.75,.5,.25,0]
    for i,t in enumerate(times):
        changed=morph(a,b,source,target,triangles,t)
        base=bases[i] if bases else a
        frame=paint.unpack(paint.premul(base)*(1-weight)+paint.premul(changed)*weight)
        if t<1e-8:frame=base.copy()
        frames.append(frame)
    for mobile in (False,True):
        cells=[export_cell(f,mobile) for f in frames]
        source_tools.opaque_board(cells,8 if dense else 9,'#eee8db',4).save(OUT/(action+'-trial-'+('mobile' if mobile else 'desktop')+'.png'))
    return frames


def reading_head(a,b,t,base,kind='work'):
    from scipy.spatial import Delaunay
    from morph_frames import morph
    polygons=[[(128,50),(370,50),(370,220),(331,220),(320,241),(294,264),(271,273),(250,275),(220,263),(198,241),(185,235),(128,235)],
              [(128,50),(370,50),(370,240),(333,240),(323,259),(298,279),(274,288),(248,286),(220,276),(199,250),(185,244),(128,244)]]
    if kind=='failure':polygons[1]=[(128,50),(370,50),(370,251),(333,251),(321,279),(298,295),(272,307),(247,305),(217,291),(198,262),(185,254),(128,254)]
    if kind=='look':
        rot=np.array([[math.cos(-.105),-math.sin(-.105)],[math.sin(-.105),math.cos(-.105)]])
        polygons[1]=[tuple(p) for p in (np.array(polygons[0])-[270,230])@rot.T+[276,237]]
    layers=[];masks=[]
    for im,poly in zip([a,b],polygons):
        mask=Image.new('L',(512,512));ImageDraw.Draw(mask).polygon(poly,fill=255)
        layer=np.array(im);layer[:,:,3]=np.minimum(layer[:,:,3],np.array(mask));layer[layer[:,:,3]==0]=0
        layers.append(Image.fromarray(layer));masks.append(mask)
    pairs=[((0,0),(0,0)),((511,0),(511,0)),((511,511),(511,511)),((0,511),(0,511)),
        ((120,50),(120,50)),((380,50),(380,50)),((380,310),(380,310)),((120,310),(120,310)),
        ((256,65),(257,78)),((175,103),(179,113)),((324,98),(328,108)),((147,164),(151,175)),((349,161),(351,177)),
        ((174,199),(179,213)),((328,197),(329,219)),((206,242),(208,260)),((268,264),(268,280)),((313,244),(316,260)),
        ((211,171),(212,199)),((242,177),(246,210)),((268,175),(273,208)),((298,172),(301,208)),((320,165),(325,195)),
        ((270,205),(273,231)),((243,230),(244,255)),((270,230),(272,258)),((297,229),(300,253)),
        ((254,289),(254,295)),((302,281),(302,287)),
        ((263,168),(268,203)),((262,195),(268,225)),((215,196),(220,224)),
        ((274,171),(281,203)),((317,189),(319,219)),((278,193),(283,225)),
        ((218,159),(219,186)),((249,153),(252,190)),((263,165),(264,199)),
        ((278,159),(279,193)),((302,152),(306,185)),((317,159),(319,188))]
    points=np.array(pairs,float)
    if kind=='failure':
        for i in range(8,len(points)):
            x,y=points[i,1];points[i,1]=[x-(4 if y>180 else 0),y+(4 if y<130 else 10 if y<190 else 22 if y<245 else 17)]
    if kind=='look':
        points[8:,1]=(points[8:,0]-[270,230])@rot.T+[276,237]
    tri=Delaunay(points.mean(axis=1)).simplices
    if t>.98:
        write_json(OUT/(kind+'-head-correspondence.json'),{'sourcePoints':points[:,0].tolist(),
            'targetPoints':points[:,1].tolist(),'triangles':tri.tolist(),'headMasks':polygons,
            'source':'output/street-speaker-motion/hartmut-keller/down-source.png',
            'target':'output/street-speaker-motion/hartmut-keller/'+kind+'-source.png',
            'status':'Candidate only; native intermediate hair/glasses softness remains a visual gate'})
    head=morph(layers[0],layers[1],points[:,0],points[:,1],tri,t)
    body=np.array(base);body[np.array(masks[0])>0]=0;frame=Image.fromarray(body);frame.alpha_composite(head)
    return frame


def notebook_trial(dense=False):
    from scipy.spatial import Delaunay
    from morph_frames import morph
    a=Image.open(OUT/'hartmut-keller/down-source.png').convert('RGBA')
    b=Image.open(OUT/'hartmut-keller/work-source.png').convert('RGBA')
    polygons=[[(327,260),(346,266),(369,291),(386,321),(391,347),(382,371),(359,386),(330,388),(306,377),(298,353),(291,334),(300,311),(309,294),(325,290)],
              [(332,259),(353,267),(374,287),(386,322),(391,348),(375,371),(350,383),(326,382),(308,370),(299,348),(271,341),(282,298),(291,280),(323,279)]]
    masks=[];layers=[]
    for im,poly in zip([a,b],polygons):
        mask=Image.new('L',(512,512));ImageDraw.Draw(mask).polygon(poly,fill=255)
        layer=np.array(im);layer[:,:,3]=np.minimum(layer[:,:,3],np.array(mask));layer[layer[:,:,3]==0]=0
        layers.append(Image.fromarray(layer));masks.append(mask)
    pairs=[((0,0),(0,0)),((511,0),(511,0)),((511,511),(511,511)),((0,511),(0,511)),
        ((240,250),(240,250)),((420,250),(420,250)),((420,410),(420,410)),((240,410),(240,410)),
        ((333,266),(337,266)),((370,298),(374,300)),((385,333),(385,333)),((370,370),(369,369)),
        ((340,379),(340,373)),((308,363),(311,359)),
        ((314,297),(291,281)),((359,307),(369,282)),((348,331),(351,337)),((306,320),(272,339)),
        ((314,333),(328,326)),((331,344),(343,339)),((321,355),(326,350)),((338,366),(339,363))]
    hand_poly=np.array([(303,316),(320,318),(333,334),(350,338),(360,350),(357,369),(341,380),(324,377),(305,359),(295,341)],dtype=float)
    handmask=Image.new('L',(512,512));ImageDraw.Draw(handmask).polygon([tuple(p) for p in hand_poly],fill=255)
    hand=np.array(a);hand[:,:,3]=np.minimum(hand[:,:,3],np.array(handmask));hand[hand[:,:,3]==0]=0;hand=Image.fromarray(hand)
    def hand_points(t):
        angle=.33*t;rot=np.array([[math.cos(angle),-math.sin(angle)],[math.sin(angle),math.cos(angle)]])
        return (hand_poly-[313,333])@rot.T+[313+15*t,333-7*t]
    for i in range(2):
        cut=Image.new('L',(512,512));ImageDraw.Draw(cut).polygon([tuple(p) for p in hand_points(i)],fill=255)
        layer=np.array(layers[i]);layer[np.array(cut)>0]=0;layers[i]=Image.fromarray(layer)
    points=np.array(pairs,dtype=float);triangles=Delaunay(points.mean(axis=1)).simplices
    backing=Image.open(ROOT/'assets/sprite-sources/street-speaker-motion/hartmut-keller/left-arm-backing-v1.png').convert('RGBA')
    px=np.array(backing);px[px[:,:,3]<20]=0;backing=Image.fromarray(px);bb=backing.getbbox()
    plate,_=source_tools.register_source(backing,{'component_bounds':list(bb),'source_pivot':[(bb[0]+bb[2])/2,bb[3]]},416/(bb[3]-bb[1]),480)
    base=np.array(a);replacement=np.array(plate);base[np.array(masks[0])>0]=replacement[np.array(masks[0])>0];base=Image.fromarray(base)
    frames=[]
    times=[.5-.5*math.cos(math.tau*i/15) for i in range(16)] if dense else [0,.25,.5,.75,1]
    for t in times:
        arm=morph(layers[0],layers[1],points[:,0],points[:,1],triangles,t)
        f=base.copy();f.alpha_composite(arm)
        yy,xx=np.mgrid[:512,:512];angle=.33*t;px=xx-(313+15*t);py=yy-(333-7*t)
        f.alpha_composite(paint.unpack(paint.sample(paint.premul(hand),math.cos(angle)*px+math.sin(angle)*py+313,-math.sin(angle)*px+math.cos(angle)*py+333)))
        f=reading_head(a,b,t,f)
        if t<1e-8:f=a.copy()
        frames.append(f)
    source_tools.opaque_board([export_cell(f) for f in frames],5,'#eee8db',4).save(OUT/'notebook-trial.png')
    write_json(OUT/'notebook-trial-controls.json',{'pairs':pairs,'triangles':triangles.tolist(),'status':'unapproved fitted whole-arm trial'})
    return frames


def head_reaction(kind):
    a=Image.open(OUT/'hartmut-keller/down-source.png').convert('RGBA')
    b=Image.open(OUT/'hartmut-keller'/(kind+'-source.png')).convert('RGBA')
    frames=[]
    for i in range(16):
        t=.5-.5*math.cos(math.tau*i/15)
        frame=reading_head(a,b,t,a,kind) if t>1e-8 else a.copy()
        frames.append(frame)
    source_tools.opaque_board([export_cell(f) for f in frames],8,'#eee8db',3).save(OUT/(kind+'-dense-trial.png'))
    return frames


def vertical_contacts_trial():
    """Source-pose fitting only; never substitutes a contact pair for a gait."""
    source=Image.open(ROOT/'assets/sprite-sources/street-speaker-motion/hartmut-keller/vertical-leg-layers-v2.png').convert('RGBA')
    data=np.array(source);data[data[:,:,3]<20]=0;source=Image.fromarray(data)
    yy,xx=np.mgrid[:512,:512];frames=[];records=[]
    for direction,boxes,splits,tops in [
        ('down',[[191,149,567,569],[689,150,1064,568]],[355,896],[149,150]),
        ('up',[[181,701,564,1132],[691,701,1071,1143]],[362,885],[701,701])]:
        original=Image.open(OUT/'hartmut-keller'/(direction+'-source.png')).convert('RGBA')
        upper=np.array(original);upper[407:]=0;upper=Image.fromarray(upper)
        frames.append(original)
        for contact,(box,split,top) in enumerate(zip(boxes,splits,tops)):
            canvas=Image.new('RGBA',(512,512));parts=[]
            for side in range(2):
                region=[box[0] if side==0 else split,top,split if side==0 else box[2],box[3]]
                leg=source.crop(region);a=np.array(leg)[:,:,3];coords=np.argwhere(a>=20);bottom=int(coords[:,0].max())
                shoe=np.argwhere((a>=20)&(np.arange(a.shape[0])[:,None]>=bottom-30))
                centre=(float(shoe[:,1].min())+float(shoe[:,1].max()))/2
                target_y=451 if side==contact else 505;target_x=[204,310][side]
                scale=.48;ox=target_x-centre*scale;oy=target_y-bottom*scale
                fitted=paint.unpack(paint.sample(paint.premul(leg),(xx-ox)/scale,(yy-oy)/scale))
                # The complete source thigh root is retained in the raw layer;
                # only its visible region below the original shared hip is used.
                visible=np.array(fitted);visible[:388]=0;fitted=Image.fromarray(visible)
                parts.append(fitted);records.append({'view':direction,'contact':contact,'side':side,
                    'sourceRegion':region,'uniformScale':scale,'offset':[ox,oy],'soleTarget':[target_x,target_y],
                    'completeRegisteredBounds':fitted.getbbox()})
            canvas.alpha_composite(parts[0]);canvas.alpha_composite(parts[1]);canvas.alpha_composite(upper)
            canvas.save(OUT/(direction+'-new-contact-'+str(contact)+'.png'));frames.append(canvas)
    # This preview uses four extra pixels of top padding allocation for the
    # genuine lower contact. Production pivot remains unchanged until review.
    for mobile in (False,True):
        output=[]
        for f in frames:
            shifted=Image.new('RGBA',(512,512));shifted.alpha_composite(f,(0,-12))
            output.append(export_cell(shifted,mobile))
        source_tools.opaque_board(output,3,'#eee8db',3).save(OUT/('vertical-contact-fit-'+('mobile' if mobile else 'desktop')+'.png'))
    write_json(OUT/'vertical-contact-fit.json',{'source':'assets/sprite-sources/street-speaker-motion/hartmut-keller/vertical-leg-layers-v2.png',
        'sourceSha256':sha(ROOT/'assets/sprite-sources/street-speaker-motion/hartmut-keller/vertical-leg-layers-v2.png'),
        'records':records,'status':'Contact fitting trial only. No continuous gait or anatomical acceptance yet.'})
    return frames


VERTICAL_PARTS={}
def authored_vertical(source,direction,strength=.8,phases=None):
    """Measured complete contact-paint interpolation through original neutral.

    This is an output-only trial until source continuity and foot registration
    pass. Shoe vertices come from each complete painted shoe, not tube limbs.
    """
    from morph_frames import morph
    if direction not in VERTICAL_PARTS:
        fit=json.loads((ROOT/'assets/sprite-sources/street-speaker-motion/hartmut-keller/vertical-contact-fit.json').read_text());sheet=Image.open(ROOT/fit['source']).convert('RGBA')
        yy,xx=np.mgrid[:512,:512];parts=[{},{}]
        for side in range(2):
            pixels=np.array(source);pixels[:388]=0
            if side==0:pixels[:,256:]=0
            else:pixels[:,:256]=0
            parts[side]['neutral']=Image.fromarray(pixels)
        for rec in fit['records']:
            if rec['view']!=direction:continue
            leg=sheet.crop(rec['sourceRegion']);ox,oy=rec['offset'];scale=rec['uniformScale']
            fitted=paint.unpack(paint.sample(paint.premul(leg),(xx-ox)/scale,(yy-oy)/scale))
            pixels=np.array(fitted);pixels[:388]=0
            parts[rec['side']]['far' if rec['soleTarget'][1]<478 else 'near']=Image.fromarray(pixels)
        control=[]
        for side,poses in enumerate(parts):
            table={}
            for name,im in poses.items():
                a=np.array(im)[:,:,3];bottom=float(np.where(a>=128)[0].max())
                knee={'far':397,'neutral':424,'near':436}[name]
                ankle={'far':407 if direction=='down' else 410,'neutral':434,'near':453}[name]
                coords=np.argwhere((a>=20)&(np.arange(512)[:,None]>=ankle))
                xmin,xmax=float(coords[:,1].min()),float(coords[:,1].max());cx=(xmin+xmax)/2
                hip=[209,303][side]
                ys=[0,388]
                for lo,hi in zip([388,knee,ankle,bottom-10,bottom],[knee,ankle,bottom-10,bottom,511]):
                    ys.extend([(lo+hi)/2,hi])
                points=[]
                for y in ys:
                    edge=np.where(a[min(511,round(y))]>=128)[0]
                    lo,hi=(float(edge.min())-.5,float(edge.max())+.5) if len(edge)>1 else (xmin,xmax)
                    points.extend((x,y) for x in [0,lo,(lo+hi)/2,hi,511])
                table[name]=np.array(points,dtype=float)
            control.append(table)
        VERTICAL_PARTS[direction]=(parts,control)
    parts,control=VERTICAL_PARTS[direction]
    upper=np.array(source);upper[413:]=0;upper=Image.fromarray(upper);frames=[]
    for phase in phases if phases is not None else np.arange(16)*math.tau/16:
        if strength==0:frames.append(source.copy());continue
        limbs=[]
        for side in range(2):
            t=phase+side*math.pi;q=(t/math.tau-.25)%1
            if q<=.5:excursion=1-4*q;lift=0
            else:
                swing=(q-.5)*2;excursion=-1-2*swing+12*swing*swing-8*swing*swing*swing;lift=6*math.sin(math.pi*swing)*strength
            excursion*=1 if direction=='down' else -1
            pose='near' if excursion>=0 else 'far';weight=min(1,abs(excursion)*strength)
            a,b=control[side]['neutral'],control[side][pose]
            intervals=len(a)//5-1
            tri=np.array([[r*5+c,(r+1)*5+c,(r+1)*5+c+1] for r in range(intervals) for c in range(4)]+
                [[r*5+c,(r+1)*5+c+1,r*5+c+1] for r in range(intervals) for c in range(4)])
            im=morph(parts[side]['neutral'],parts[side][pose],a,b,tri,weight)
            pixels=np.array(im);pixels[:407]=0;im=Image.fromarray(pixels)
            if lift:im=paint.warp_layer(im,[0,511],[0,0],[-lift,-lift])
            limbs.append(im)
        frame=Image.new('RGBA',(512,512));frame.alpha_composite(limbs[0]);frame.alpha_composite(limbs[1])
        bob=-3.4*math.cos(phase*2)*strength
        frame.alpha_composite(paint.warp_layer(upper,[0,511],[0,0],[bob,bob]));frames.append(frame)
    return frames


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inventory',action='store_true')
    parser.add_argument('--check',action='store_true')
    parser.add_argument('--profile-shoe-repair',action='store_true')
    parser.add_argument('--gesture-trial',action='store_true')
    parser.add_argument('--speaking-trial',action='store_true')
    parser.add_argument('--notebook-trial',action='store_true')
    parser.add_argument('--vertical-contacts-trial',action='store_true')
    args=parser.parse_args()
    if args.check:check()
    elif args.profile_shoe_repair:print(json.dumps(bake_profile_shoes()['variants']))
    elif args.gesture_trial:gesture_trial()
    elif args.speaking_trial:speaking_trial()
    elif args.notebook_trial:notebook_trial()
    elif args.vertical_contacts_trial:vertical_contacts_trial()
    elif args.inventory:print(json.dumps({'inventoried':len(inventory())}))
    else:print(json.dumps(build(json.loads(SPEC.read_text(encoding='utf-8')))['variants']))
