"""Bounded Karl own-source stop pilot; no runtime atlas or admission."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import label

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
WALKS = ROOT / 'output/ambient-city-animation/karl-post-walk-source-v1'
CAPTURE = ROOT / 'output/ambient-city-animation/karl-post-mouth-fields-v1/walk-fields.json'
OUT = ROOT / 'output/ambient-city-animation/karl-post-phase-stops-v1/pilot'
SOURCE_DRIVER = HERE / 'build-walk-source-v1.py'
STOP_METHOD = ROOT / 'assets/sprite-sources/street-speaker-motion/gisela-becker/build-phase-stops.py'
EXPECTED_WALK = '4eebaefae5f8b81d1854298bfcaf4559dd041ba740c4034b70baebd96a643eac'
PILOT_PHASES = (0, 4, 8, 12)
PILOT_STAGES = (0, 3)
STRENGTHS = (.8, .6, .4, .2)
COLORS = {'light': '#eee8db', 'dark': '#25272b'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def native(value):
    if hasattr(value, 'item'):
        return value.item()
    if isinstance(value, dict):
        return {key: native(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [native(item) for item in value]
    return value


def upper_calls(calls, frame_count, has_original_upper):
    if frame_count < 1 or len(calls) != 3 * frame_count:
        raise ValueError('Karl actual warp call count changed')
    return calls[-frame_count:] if has_original_upper else calls[2::3]


def slot(row, phase, stage):
    if not (0 <= row < 4 and 0 <= phase < 16 and 0 <= stage < 4):
        raise ValueError('Karl stop slot outside 4x16x4')
    return (row*16+phase)*4+stage


def capture(builder, person, direction, render):
    """Record real warp calls on this builder instance, restoring on errors."""
    original = builder.paint.warp_layer
    calls = []

    def traced(layer, nodes_y, dx, dy):
        calls.append({'sourceRgbaSha256': hashlib.sha256(layer.tobytes()).hexdigest(),
                      'sourceSize': list(layer.size), 'nodes_y': native(nodes_y),
                      'dx': native(dx), 'dy': native(dy)})
        return original(layer, nodes_y, dx, dy)

    builder.paint.warp_layer = traced
    try:
        frames, records = render()
    finally:
        builder.paint.warp_layer = original
    if len(frames) != len(records):
        raise ValueError('Karl stop frame/record count changed')
    upper = upper_calls(calls, len(frames), bool(person['views'][direction].get('originalUpper')))
    if any(field['sourceSize'] != [512, 512] for field in upper):
        raise ValueError('Karl upper source size changed')
    return frames, native(records), upper


def inputs():
    paths = [WALKS / 'walk-source.json', CAPTURE, SOURCE_DRIVER, STOP_METHOD,
             HERE / 'source-fit-v3.json', HERE / 'walk-source-config-v1.json',
             ROOT / 'tools/build-resident-motion.py',
             ROOT / '.agents/skills/animate-2d-characters/scripts/painted_walk.py']
    if sha(paths[0]) != EXPECTED_WALK:
        raise ValueError('Reviewed Karl 92-cell walk receipt changed')
    return {path.relative_to(ROOT).as_posix(): sha(path) for path in paths}


def source_points(builder, person, direction):
    """Both sole witnesses use painted own legs or registered own cardinals."""
    view = person['views'][direction]
    if view.get('leg_sources'):
        points = []
        for side, limb in enumerate(view['leg_sources']):
            image, _ = builder.street.register_source(
                Image.open(ROOT / limb['source']).convert('RGBA'), limb, limb['scale'], 472)
            offset = limb.get('offset_x', 0)
            expected = [256+(limb['sole_point_xy'][0]-limb['source_pivot'][0])*limb['scale']+offset,
                        472+(limb['sole_point_xy'][1]-limb['source_pivot'][1])*limb['scale']]
            opaque = np.asarray(image.getchannel('A')) >= 200
            yy, xx = np.where(opaque &
                (np.abs(np.arange(512)[:, None]-expected[1]) <= 5) &
                (np.abs(np.arange(512)[None, :]+offset-expected[0]) <= 10))
            if not len(xx):
                raise ValueError('Own source sole witness disappeared: '+direction+'/'+str(side))
            selected = int(np.argmin((xx+offset-expected[0])**2+(yy-expected[1])**2))
            points.append({'side': side, 'working': [int(xx[selected]+offset), int(yy[selected])],
                           'ownSourceSolePoint': limb['sole_point_xy'],
                           'ownLegSourceSha256': limb['sourceSha256']})
        return points
    registered, landmarks, _ = builder.registered(person, direction)
    alpha = np.asarray(registered.getchannel('A'))
    positions = ((208, 469), (304, 469)) if direction == 'down' else ((208, 470), (304, 470))
    if any(alpha[y, x] < 200 for x, y in positions):
        raise ValueError('Own original-cardinal sole witness disappeared')
    if not (positions[0][0] < landmarks['mid'] < positions[1][0]):
        raise ValueError('Own original-cardinal sole ownership changed')
    return [{'side': side, 'working': [x, y], 'registeredSourceSha256': sha(ROOT/view['source'])}
            for side, (x, y) in enumerate(positions)]


def witness(frame, field, point):
    side = point['side']
    x, y = point['working']
    nodes = field[side]['nodes_y']
    if y < nodes[-2]:
        raise ValueError('Karl marked sole above ankle warp node')
    px, py = x+field[side]['dx'][-1], y+field[side]['dy'][-1]
    xi, yi = round(px), round(py)
    if not (3 <= xi < 509 and 3 <= yi < 509):
        raise ValueError('Karl sole witness left working source')
    support = int(np.asarray(frame)[yi-3:yi+4,xi-3:xi+4,3].max())
    if support < 160:
        raise ValueError('Karl source sole witness lost painted support')
    return {'side': side, 'sourceWorking': [x, y], 'transportedWorking': [px, py],
            'localMaximumAlpha': support,
            'terminalDxDy': [field[side]['dx'][-1], field[side]['dy'][-1]]}


def board(frames, path, columns, color, scale=1):
    width, height = frames[0].size
    rows = (len(frames)+columns-1)//columns
    result = Image.new('RGBA', (width*columns,height*rows), color)
    for index, frame in enumerate(frames):
        result.alpha_composite(frame, ((index%columns)*width,(index//columns)*height))
    if scale != 1:
        result = result.resize((result.width*scale,result.height*scale), Image.Resampling.NEAREST)
    result.convert('RGB').save(path)


def run(output):
    before = inputs()
    walks = json.loads((WALKS/'walk-source.json').read_text(encoding='utf8'))
    captured = json.loads(CAPTURE.read_text(encoding='utf8'))
    if captured['bodyReceipt']['sha256'] != EXPECTED_WALK or captured['verifiedSelectedCells'] != 92:
        raise ValueError('Karl exact own walk-field capture changed')
    source = load('karl_stop_walk_source', SOURCE_DRIVER)
    cfg, fit = source.validate_config()
    builder = source.load_builder()
    person = fit['person'].copy()
    person['turn_sources'] = cfg['turn_sources']
    if (builder.source_bindings(person) != walks['sourceBindings'] or
            sha(SOURCE_DRIVER) != walks['driverSha256'] or
            sha(HERE/'source-fit-v3.json') != walks['sourceFitSha256']):
        raise ValueError('Karl source bindings or reviewed body recipe changed')
    for entry in walks['sourceBindings']['sources']:
        path = ROOT/entry['path']
        if sha(path) != entry['sha256']:
            raise ValueError('Karl own source pixel input changed: '+entry['path'])
        before[entry['path']] = entry['sha256']
    stop_fields = load('held_pure_stop_fields', STOP_METHOD).stop_fields
    output.mkdir(parents=True, exist_ok=True)
    working = output/'working'
    working.mkdir(exist_ok=True)
    variants = {}
    for name, variant in walks['variants'].items():
        path = WALKS/variant['file']
        if sha(path) != variant['sha256']:
            raise ValueError('Karl encoded body variant changed: '+name)
        before[path.relative_to(ROOT).as_posix()] = sha(path)
        variants[name] = variant
    records, sole_sources, neutral_checks = [], {}, {}
    for row, direction in enumerate(source.ORDER):
        view = person['views'][direction]
        sole_sources[direction] = source_points(builder,person,direction)
        if view.get('originalUpper'):
            neutral_render = lambda: builder.motion(person,direction,count=4,
                                                     phases=[math.pi/2],step_width=0)
        else:
            neutral_render = lambda: builder.motion(person,direction,count=4,
                                                     strength=0,phases=[0])
        neutral, neutral_trace, neutral_upper = capture(builder,person,direction,neutral_render)
        if len(neutral) != 1 or neutral_trace[0] != captured['neutrals'][direction]['record']['bodyRecord']:
            raise ValueError('Karl neutral limb field changed: '+direction)
        own_neutral_upper = captured['neutrals'][direction]['record']['actualUpperWarp']
        if neutral_upper[0] != {key:own_neutral_upper[key] for key in neutral_upper[0]}:
            raise ValueError('Karl neutral actual upper field changed: '+direction)
        neutral_path = WALKS/'working'/f'{direction}-neutral.png'
        if Image.open(neutral_path).convert('RGBA').tobytes() != neutral[0].tobytes():
            raise ValueError('Karl neutral pixels changed: '+direction)
        target = neutral_trace[0]['limb_displacement']
        neutral_checks[direction] = {'workingSha256':sha(neutral_path),
                                     'actualUpperWarp':neutral_upper[0]}
        source_records = [walks['limbFields'][direction][phase] for phase in PILOT_PHASES]
        if any(source_records[index] != captured['walks'][direction]['records'][phase]['bodyRecord']
               for index,phase in enumerate(PILOT_PHASES)):
            raise ValueError('Karl frozen limb fields and captured head fields diverged')
        upper_source = captured['walks'][direction]['records'][0]['actualUpperWarp']['sourceRgbaSha256']
        phase_values = [phase*math.tau/16 for phase in PILOT_PHASES]
        for stage in PILOT_STAGES:
            expected = []
            for phase,record in zip(PILOT_PHASES,source_records):
                swing = 0 if math.cos(phase*math.tau/16)>=0 else 1
                expected.append(stop_fields(record['limb_displacement'],target,swing,stage))
            calls = 0

            def limb_pose(side,nodes,dx,dy):
                nonlocal calls
                index = calls//2
                calls += 1
                if index >= len(PILOT_PHASES) or side != (calls-1)%2:
                    raise ValueError('Karl stop limb call order changed')
                if nodes != source_records[index]['limb_displacement'][side]['nodes_y']:
                    raise ValueError('Karl own limb node layout changed')
                return expected[index][side]['dx'],expected[index][side]['dy']

            try:
                frames,trace,upper = capture(builder,person,direction,
                    lambda:builder.motion(person,direction,count=4,strength=STRENGTHS[stage],
                                          phases=phase_values,limb_pose=limb_pose))
            except ValueError as error:
                if hasattr(error,'frame'):
                    error.frame.save(output/f'{direction}-stage{stage}-FAIL.png')
                raise
            if calls != 8 or len(frames) != 4:
                raise ValueError('Karl stop pilot missed owned source limbs')
            if any(field['sourceRgbaSha256'] != upper_source for field in upper):
                raise ValueError('Karl stop upper changed source paint')
            for index,phase in enumerate(PILOT_PHASES):
                traced_limbs = trace[index]['limb_displacement']
                reference_limbs = [dict(nodes_y=source_records[index]['limb_displacement'][side]['nodes_y'],
                    dx=expected[index][side]['dx'],dy=expected[index][side]['dy']) for side in range(2)]
                if traced_limbs != reference_limbs:
                    raise ValueError('Karl stop field differs from actual rendered field')
                frame = frames[index]
                if frame.size != (512,512):
                    raise ValueError('Karl working source size changed')
                components,_ = label(np.asarray(frame)[:,:,3]>=128)
                if sum(size>=100 for size in np.bincount(components.ravel())[1:]) != 1:
                    raise ValueError('Detached Karl stop source component')
                path = working/f'{direction}-phase{phase:02}-stage{stage}.png'
                frame.save(path)
                foot = [witness(frame,traced_limbs,point) for point in sole_sources[direction]]
                swing = 0 if math.cos(phase*math.tau/16)>=0 else 1
                loaded = 1-swing
                if stage==0 and any(abs(expected[index][loaded][axis][-1]-
                                        source_records[index]['limb_displacement'][loaded][axis][-1])>1e-8
                                    for axis in ('dx','dy')):
                    raise ValueError('Loaded Karl source ankle moved in stop stage0')
                exported={}
                for name,variant in variants.items():
                    spec={'cell':variant['frame_size'],'figureHeight':variant['figureHeight'],
                          'pivot':variant['pivot'],'working':{'figureHeight':400,'baseline':472}}
                    cell=builder.street.export_cell(frame,spec)
                    box=cell.getchannel('A').getbbox()
                    w,h=cell.size
                    gutter=min(box[0],box[1],w-box[2],h-box[3])
                    if gutter<2:
                        raise ValueError('Karl stop encoded cell lost transparent gutter')
                    cell_path=output/f'{direction}-phase{phase:02}-stage{stage}-{name}.png'
                    cell.save(cell_path)
                    exported[name]={'file':cell_path.relative_to(output).as_posix(),
                                    'sha256':sha(cell_path),'bounds':box,'gutter':gutter}
                records.append({'direction':direction,'phase':phase,'stage':stage,
                    'slot':slot(row,phase,stage),'upperStrength':STRENGTHS[stage],
                    'swingSide':swing,'loadedSide':loaded,
                    'working':{'file':path.relative_to(output).as_posix(),
                               'sha256':sha(path),'bounds':frame.getbbox()},
                    'encoded':exported,'ownSoleWitnesses':foot,
                    'limbs':traced_limbs,'actualUpperWarp':upper[index]})
            for color in COLORS:
                board(frames,output/f'{direction}-stage{stage}-working-{color}.png',4,COLORS[color])
                for name in variants:
                    cells=[Image.open(output/f'{direction}-phase{phase:02}-stage{stage}-{name}.png').convert('RGBA')
                           for phase in PILOT_PHASES]
                    board(cells,output/f'{direction}-stage{stage}-{name}-{color}.png',4,
                          COLORS[color],3 if name=='desktop' else 4)
        print('Karl stop pilot '+direction+' stage0/3',flush=True)
    if len(records)!=32:
        raise ValueError('Karl stop pilot selection incomplete')
    if any(sha(ROOT/key)!=digest for key,digest in before.items()):
        raise ValueError('Karl source or encoded body input changed during pilot')
    result={'schemaVersion':1,'id':'stadt-karl-heinz-post',
        'status':'held bounded source pilot; independent source review pending',
        'scope':'stage0/3 x phase0/4/8/12 x 4 directions; 32 cells only',
        'walkReceiptSha256':EXPECTED_WALK,
        'captureReceipt':{'file':CAPTURE.relative_to(ROOT).as_posix(),'sha256':sha(CAPTURE)},
        'method':{'file':STOP_METHOD.relative_to(ROOT).as_posix(),'sha256':sha(STOP_METHOD),
                  'scope':'pure stop_fields only; no other cast paint or fit'},
        'sourceBindings':walks['sourceBindings'],'inputs':before,
        'ownSourceSoles':sole_sources,'neutralChecks':neutral_checks,
        'records':records,'selectedCells':len(records),
        'limitations':['No full256 stop atlas or native stop controller has run.',
                       'Sole witnesses track own painted source and field support, not world contact.',
                       'Candidate stride27.53 and stop runtime admission remain held.']}
    result['driverSha256']=sha(Path(__file__))
    receipt=output/'pilot-source.json'
    receipt.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf8')
    print(json.dumps({'status':result['status'],'selectedCells':len(records),
                      'receiptSha256':sha(receipt)}),flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--outdir',type=Path,default=OUT)
    args=parser.parse_args()
    run(args.outdir.resolve())
