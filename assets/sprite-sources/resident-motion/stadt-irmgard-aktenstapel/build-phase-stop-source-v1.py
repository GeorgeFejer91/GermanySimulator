"""Full 256-cell Irmgard own-source phase stops after reviewed 32-cell pilot.

Only Gisela's pure stop_fields method is reused. Paint, anatomy, registered
walk inputs and all physical cells are Irmgard's own accepted source.
"""
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
PILOT_DRIVER = HERE / 'build-phase-stop-pilot-v1.py'
PILOT_DIR = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-phase-stop-pilot-v1'
PILOT_SHA = '08a97b0333ec1b064d1b94540f0838bd0c33a79522c60afb92e8b111beb5007b'
PILOT_DRIVER_SHA = 'e73f679dd8e0d6d9f51ed3093a7b175424a970e6fc807286eaf10c2d9ca2d052'
REVIEW = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-pilot-independent-review/REPORT.md'
REVIEW_SHA = 'f60465fe4e5250633b78d1af4133fc3f03d1dbcf6ffe39e263ac19dab6e819d4'
OUTPUT = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-phase-stop-source-v1'
TEMPORAL_PHASES = (0, 4, 8, 12)


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def reviewed_pilot():
    if (sha(PILOT_DIR / 'pilot-source.json') != PILOT_SHA or
            sha(PILOT_DRIVER) != PILOT_DRIVER_SHA or sha(REVIEW) != REVIEW_SHA):
        raise ValueError('Reviewed Irmgard stop pilot or independent gate changed')
    driver = load(PILOT_DRIVER, 'reviewed_irmgard_stop_pilot')
    document = json.loads((PILOT_DIR/'pilot-source.json').read_text(encoding='utf8'))
    if document['selectedCells'] != 32:
        raise ValueError('Irmgard reviewed pilot selection changed')
    return driver, document, {entry['slot']: entry for entry in document['records']}


def compare_pilot(record, frame, cells):
    old = PILOT_DIR / record['working']['file']
    if sha(old) != record['working']['sha256'] or Image.open(old).convert('RGBA').tobytes() != frame.tobytes():
        raise ValueError('Full Irmgard working stop differs from reviewed pilot')
    for name, cell in cells.items():
        entry = record['encoded'][name]
        old = PILOT_DIR / entry['file']
        if sha(old) != entry['sha256'] or Image.open(old).convert('RGBA').tobytes() != cell.tobytes():
            raise ValueError('Full Irmgard physical stop differs from reviewed pilot: ' + name)


def terminal(field, side):
    return field[side]['dx'][-1], field[side]['dy'][-1]


def distance(left, right):
    return math.hypot(right[0]-left[0], right[1]-left[1])


def build(output):
    pilot, reviewed, by_slot = reviewed_pilot()
    before = pilot.inputs()
    for path in (PILOT_DIR/'pilot-source.json', PILOT_DRIVER, REVIEW, Path(__file__)):
        before[path.relative_to(ROOT).as_posix()] = sha(path)
    walks_path = pilot.WALKS/'walk-source.json'
    walks = json.loads(walks_path.read_text(encoding='utf8'))
    manifest_rebind = pilot.rebind_unrelated_manifest(walks, before)
    if (walks['id'] != 'stadt-irmgard-aktenstapel' or walks['selectedCells'] != 92 or
            walks['cell'] != [128,160] or walks['pivot'] != [64,150] or
            walks['figureHeight'] != 136 or walks['figureWorldHeight'] != 1.6):
        raise ValueError('Irmgard reviewed walk body registration changed')
    source = pilot.load('irmgard_full_stop_walk_source', pilot.SOURCE_DRIVER)
    fit = json.loads((HERE/'source-fit-v1.json').read_text(encoding='utf8'))
    builder = source.load_builder()
    person = fit['person'].copy()
    if (builder.source_bindings(person) != walks['sourceBindings'] or
            sha(pilot.SOURCE_DRIVER) != walks['driverSha256'] or
            sha(HERE/'source-fit-v1.json') != walks['sourceFitSha256'] or
            sha(HERE/'walk-source-config-v1.json') != walks['configSha256']):
        raise ValueError('Irmgard source bindings or reviewed body recipe changed')
    for entry in walks['sourceBindings']['sources']:
        path = ROOT/entry['path']
        if sha(path) != entry['sha256']:
            raise ValueError('Irmgard own source paint changed: '+entry['path'])
        before[entry['path']] = entry['sha256']
    variants = {}
    for name, variant in walks['variants'].items():
        path = pilot.WALKS/variant['file']
        if sha(path) != variant['sha256']:
            raise ValueError('Irmgard accepted encoded gait atlas changed: '+name)
        before[path.relative_to(ROOT).as_posix()] = variant['sha256']
        w,h = variant['frame_size']
        variants[name] = {'source': variant, 'sheet': Image.new('RGBA',(w*16,h*16)),
                          'cells': {}, 'minimumGutter': min(w,h)}
    stop_fields = pilot.load('irmgard_pure_stop_fields', pilot.STOP_METHOD).stop_fields
    output.mkdir(parents=True, exist_ok=True)
    working = output/'working'
    working.mkdir(exist_ok=True)
    records, checked_pilot = [], set()
    stage_native, stage_cells = {}, {name:{} for name in variants}
    neutral_frames, targets = {}, {}
    stage3_rms = []
    for row, direction in enumerate(source.ORDER):
        sole_points = pilot.source_points(builder, person, direction)
        neutral, neutral_trace, neutral_upper = pilot.capture(builder, person, direction,
            lambda: builder.motion(person,direction,count=4,strength=0,phases=[0]))
        neutral_path = pilot.WALKS/'working'/f'{direction}-neutral.png'
        if (len(neutral) != 1 or sha(neutral_path) != walks['neutrals'][direction]['sourceSha256'] or
                Image.open(neutral_path).convert('RGBA').tobytes() != neutral[0].tobytes()):
            raise ValueError('Irmgard reviewed neutral source changed: '+direction)
        before[neutral_path.relative_to(ROOT).as_posix()] = sha(neutral_path)
        neutral_frames[direction] = neutral[0]
        target = neutral_trace[0]['limb_displacement']
        targets[direction] = target
        upper_source = neutral_upper[0]['sourceRgbaSha256']
        own_records = []
        for phase, entry in enumerate(walks['limbFields'][direction]):
            swing = 0 if math.cos(phase*math.tau/16) >= 0 else 1
            own_records.append({'direction':direction,'phase':phase,'swingSide':swing,
                'loadedSide':1-swing,'source':entry['limb_displacement'],'target':target,'frames':[]})
        if len(own_records) != 16:
            raise ValueError('Irmgard walk phase count changed')
        for stage, strength in enumerate(pilot.STRENGTHS):
            fields = [stop_fields(record['source'],target,record['swingSide'],stage)
                      for record in own_records]
            calls = 0

            def limb_pose(side,nodes,dx,dy):
                nonlocal calls
                phase = calls//2
                calls += 1
                if (phase >= 16 or side != (calls-1)%2 or
                        nodes != own_records[phase]['source'][side]['nodes_y']):
                    raise ValueError('Irmgard stop limb call order or source nodes changed')
                return fields[phase][side]['dx'],fields[phase][side]['dy']

            try:
                frames, trace, upper = pilot.capture(builder,person,direction,
                    lambda: builder.motion(person,direction,count=16,strength=strength,limb_pose=limb_pose))
            except ValueError as error:
                if hasattr(error,'frame'):
                    error.frame.save(output/f'{direction}-stage{stage}-FAIL.png')
                raise
            if len(frames)!=16 or calls!=32 or any(field['sourceRgbaSha256']!=upper_source for field in upper):
                raise ValueError('Irmgard actual upper/source warp count changed')
            native_frames, encoded_frames = [], {name:[] for name in variants}
            for phase,frame in enumerate(frames):
                actual = trace[phase]['limb_displacement']
                expected = [{'nodes_y':own_records[phase]['source'][side]['nodes_y'],
                             'dx':fields[phase][side]['dx'],'dy':fields[phase][side]['dy']}
                            for side in range(2)]
                if actual != expected:
                    raise ValueError('Irmgard rendered stop field differs from prescribed limb field')
                groups,_ = label(np.asarray(frame)[:,:,3]>=128)
                if sum(size>=100 for size in np.bincount(groups.ravel())[1:]) != 1:
                    raise ValueError('Detached Irmgard full stop source component')
                if stage==0:
                    loaded = own_records[phase]['loadedSide']
                    if any(abs(actual[loaded][axis][-1]-own_records[phase]['source'][loaded][axis][-1])>1e-8
                           for axis in ('dx','dy')):
                        raise ValueError('Irmgard stage0 loaded ankle changed from walk source')
                slot = pilot.slot(row,phase,stage)
                path = working/f'{direction}-phase{phase:02}-stage{stage}.png'
                frame.save(path)
                if Image.open(path).convert('RGBA').tobytes()!=frame.tobytes():
                    raise ValueError('Irmgard working stop PNG failed lossless round-trip')
                soles = [pilot.witness(frame,actual,point) for point in sole_points]
                cells, outputs = {}, {}
                for name,variant in variants.items():
                    physical = variant['source']
                    w,h = physical['frame_size']
                    spec = {'cell':[w,h],'figureHeight':physical['figureHeight'],
                        'pivot':physical['pivot'],'working':{'figureHeight':400,'baseline':472}}
                    cell = builder.street.export_cell(frame,spec)
                    box = cell.getchannel('A').getbbox()
                    gutter = min(box[0],box[1],w-box[2],h-box[3])
                    if gutter<2:
                        raise ValueError('Irmgard full stop encoded gutter collapsed')
                    variant['minimumGutter'] = min(variant['minimumGutter'],gutter)
                    variant['sheet'].paste(cell,((slot%16)*w,(slot//16)*h))
                    variant['cells'][slot] = cell
                    cells[name] = cell
                    encoded_frames[name].append(cell)
                    outputs[name] = {'bounds':box,'gutter':gutter}
                if slot in by_slot:
                    compare_pilot(by_slot[slot],frame,cells)
                    checked_pilot.add(slot)
                own_records[phase]['frames'].append({'stage':stage,'slot':slot,
                    'upperStrength':strength,'working':{'file':path.relative_to(output).as_posix(),
                                                        'sha256':sha(path),'bounds':frame.getbbox()},
                    'encoded':outputs,'ownSoleWitnesses':soles,
                    'limbs':actual,'actualUpperWarp':upper[phase]})
                if stage==3:
                    stage3_rms.append(source.rms(frame,neutral[0]))
                native_frames.append(frame)
            stage_native[direction,stage] = native_frames
            for name in variants:
                stage_cells[name][direction,stage] = encoded_frames[name]
            print('Irmgard full stop '+direction+'/stage'+str(stage),flush=True)
        records.extend(own_records)
    if len(records)!=64 or sum(len(record['frames']) for record in records)!=256 or len(checked_pilot)!=32:
        raise ValueError('Irmgard full256 or reviewed pilot overlap incomplete')
    outputs={}
    for name,variant in variants.items():
        sheet=variant['sheet']
        path=output/f'stops-{name}.webp'
        sheet.save(path,format='WEBP',lossless=True,exact=True,method=4)
        decoded=Image.open(path).convert('RGBA')
        if decoded.tobytes()!=sheet.tobytes():
            raise ValueError('Irmgard lossless stop atlas changed RGBA bytes')
        w,h=variant['source']['frame_size']
        for slot in range(256):
            cell=decoded.crop(((slot%16)*w,(slot//16)*h,(slot%16+1)*w,(slot//16+1)*h))
            if cell.tobytes()!=variant['cells'][slot].tobytes():
                raise ValueError('Irmgard decoded stop slot differs: '+str(slot))
        outputs[name]={'file':path.name,'sha256':sha(path),'image_size':list(sheet.size),
            'cell':[w,h],'figureHeight':variant['source']['figureHeight'],
            'pivot':variant['source']['pivot'],'minimumGutter':variant['minimumGutter'],
            'decodedExactCells':256}
    for direction in source.ORDER:
        for stage in range(4):
            for theme,color in pilot.COLORS.items():
                pilot.board(stage_native[direction,stage],
                    output/f'{direction}-stage{stage}-working-{theme}.png',8,color)
                for name in variants:
                    scale=3 if name=='desktop' else 4
                    pilot.board(stage_cells[name][direction,stage],
                        output/f'{direction}-stage{stage}-{name}-{theme}.png',8,color,scale)
        temporal=[]
        temporal_encoded={name:[] for name in variants}
        for phase in TEMPORAL_PHASES:
            walk_path=pilot.WALKS/'working'/f'{direction}-walk-{phase:02}.png'
            if sha(walk_path)!=walks['workingHashes'][direction+'-walk'][phase]:
                raise ValueError('Irmgard temporal walk source changed')
            before[walk_path.relative_to(ROOT).as_posix()]=sha(walk_path)
            source_frame=Image.open(walk_path).convert('RGBA')
            sequence=[source_frame,stage_native[direction,2][phase],
                      stage_native[direction,3][phase],neutral_frames[direction]]
            temporal.extend(sequence)
            for name,variant in variants.items():
                physical=variant['source']
                w,h=physical['frame_size']
                spec={'cell':[w,h],'figureHeight':physical['figureHeight'],
                      'pivot':physical['pivot'],'working':{'figureHeight':400,'baseline':472}}
                temporal_encoded[name].extend(builder.street.export_cell(frame,spec) for frame in sequence)
        for theme,color in pilot.COLORS.items():
            pilot.board(temporal,output/f'{direction}-temporal-working-{theme}.png',4,color)
            for name in variants:
                scale=3 if name=='desktop' else 4
                pilot.board(temporal_encoded[name],
                    output/f'{direction}-temporal-{name}-{theme}.png',4,color,scale)
    transitions=[]
    for record in records:
        direction,phase=record['direction'],record['phase']
        f2,f3=record['frames'][2],record['frames'][3]
        t=targets[direction]
        for side in range(2):
            transitions.append({'direction':direction,'phase':phase,'side':side,
                'loadedAtStop':side==record['loadedSide'],
                'stage2To3DistanceWorking':distance(terminal(f2['limbs'],side),terminal(f3['limbs'],side)),
                'stage2To3DxWorking':terminal(f3['limbs'],side)[0]-terminal(f2['limbs'],side)[0],
                'stage2To3DyWorking':terminal(f3['limbs'],side)[1]-terminal(f2['limbs'],side)[1],
                'stage3ToNeutralDistanceWorking':distance(terminal(f3['limbs'],side),terminal(t,side))})
    if any(sha(ROOT/key)!=digest for key,digest in before.items()):
        raise ValueError('Irmgard source/pilot input changed during full256 bake')
    result={'schemaVersion':1,'id':'stadt-irmgard-aktenstapel',
        'status':'held full own-source phase stops; independent native/encoded review pending',
        'walkReceiptSha256':pilot.EXPECTED_WALK,'pilotReceiptSha256':PILOT_SHA,
        'independentPilotReviewSha256':REVIEW_SHA,
        'method':{'file':pilot.STOP_METHOD.relative_to(ROOT).as_posix(),
                  'sha256':sha(pilot.STOP_METHOD),'scope':'pure existing stop_fields only'},
        'standingManifestRebind':manifest_rebind,'sourceBindings':walks['sourceBindings'],
        'inputs':before,'variants':outputs,'records':records,'stopCount':256,
        'pilotOverlapsExact':len(checked_pilot),
        'temporalBoards':{'phaseOrder':list(TEMPORAL_PHASES),
                          'perPhaseOrder':['accepted walk source','stop stage2','stop stage3','neutral'],
                          'directions':list(source.ORDER),'sizes':['working','desktop','mobile'],
                          'themes':list(pilot.COLORS)},
        'stage3ToNeutralRms':{'min':min(stage3_rms),'max':max(stage3_rms),
                             'mean':sum(stage3_rms)/len(stage3_rms)},
        'soleTransitionWitnesses':transitions,
        'maximumSoleTransitionWorking':{
            'stage2To3Distance':max(item['stage2To3DistanceWorking'] for item in transitions),
            'stage2To3LoadedDistance':max(item['stage2To3DistanceWorking'] for item in transitions
                                         if item['loadedAtStop']),
            'stage2To3AbsDx':max(abs(item['stage2To3DxWorking']) for item in transitions),
            'stage2To3AbsDy':max(abs(item['stage2To3DyWorking']) for item in transitions),
            'stage3ToNeutralDistance':max(item['stage3ToNeutralDistanceWorking'] for item in transitions)},
        'limitations':['CPU source and decoded atlas only; no actual runtime stop, shader or world floor contact.',
                       'Both own sole fields are tracked, but far boot may be hidden by skirt/foreground boot.',
                       'Measured source stride proposal is separate and not admitted by this bake.']}
    result['driverSha256']=sha(Path(__file__))
    receipt=output/'stop-source.json'
    receipt.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf8')
    print(json.dumps({'status':result['status'],'stopCount':256,
        'pilotOverlapsExact':len(checked_pilot),
        'desktop':outputs['desktop']['sha256'],'mobile':outputs['mobile']['sha256'],
        'receiptSha256':sha(receipt)}),flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--outdir',type=Path,default=OUTPUT)
    args=parser.parse_args()
    build(args.outdir.resolve())
