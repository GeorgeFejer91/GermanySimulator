"""Full Karl phase-owned stop source bake after independently reviewed pilot.

The 256 cells are Karl's own source rig and actual captured upper fields.
Nothing in this file edits production assets, runtime, or another cast member.
"""
from pathlib import Path
import argparse
import hashlib
import json
import math

import numpy as np
from PIL import Image
from scipy.ndimage import label

ROOT=Path(__file__).resolve().parents[4]
HERE=Path(__file__).resolve().parent
PILOT_DIR=ROOT/'output/ambient-city-animation/karl-post-phase-stops-v1/pilot'
PILOT_DRIVER=HERE/'build-phase-stop-source-v1.py'
PILOT_SHA='3d4951b5561dd775b94224822fdaa7f2c4ea381ff4489905d938258541e08b2e'
REVIEW=ROOT/'output/ambient-city-animation/karl-post-phase-stops-v1/independent-source-review/REVIEW.md'
REVIEW_SHA='57e3a510b90ffceb13a91b7db912f1f1aaa43152c7e7439bbcd51a4ccc00e92b'
OUTPUT=ROOT/'output/ambient-city-animation/karl-post-phase-stop-source-v1'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load_pilot():
    if sha(PILOT_DIR/'pilot-source.json')!=PILOT_SHA or sha(REVIEW)!=REVIEW_SHA:
        raise ValueError('Reviewed Karl 32-cell stop pilot or independent gate changed')
    if sha(PILOT_DRIVER)!='b31afabc025ba7b8ef2c4a0fbc1b6774f5d85929f7823cb14a679fca1f7b9d12':
        raise ValueError('Karl pilot driver changed after review')
    driver_spec=__import__('importlib.util',fromlist=['spec_from_file_location'])
    spec=driver_spec.spec_from_file_location('karl_reviewed_stop_pilot',PILOT_DRIVER)
    module=driver_spec.module_from_spec(spec)
    spec.loader.exec_module(module)
    document=json.loads((PILOT_DIR/'pilot-source.json').read_text(encoding='utf8'))
    if document['selectedCells']!=32:
        raise ValueError('Karl reviewed pilot selection changed')
    return module,document,{entry['slot']:entry for entry in document['records']}


def verify_pilot(record,frame,cells):
    path=PILOT_DIR/record['working']['file']
    if sha(path)!=record['working']['sha256'] or Image.open(path).convert('RGBA').tobytes()!=frame.tobytes():
        raise ValueError('Full Karl stop differs from independently reviewed native pilot')
    for name,cell in cells.items():
        entry=record['encoded'][name]
        path=PILOT_DIR/entry['file']
        if sha(path)!=entry['sha256'] or Image.open(path).convert('RGBA').tobytes()!=cell.tobytes():
            raise ValueError('Full Karl stop differs from independently reviewed encoded pilot: '+name)


def build(out):
    pilot,reviewed,by_slot=load_pilot()
    before=pilot.inputs()
    for path in (PILOT_DIR/'pilot-source.json',PILOT_DRIVER,REVIEW,Path(__file__)):
        before[path.relative_to(ROOT).as_posix()]=sha(path)
    walk_path=pilot.WALKS/'walk-source.json'
    walks=json.loads(walk_path.read_text(encoding='utf8'))
    captured=json.loads(pilot.CAPTURE.read_text(encoding='utf8'))
    if captured['bodyReceipt']['sha256']!=pilot.EXPECTED_WALK or captured['verifiedSelectedCells']!=92:
        raise ValueError('Karl exact walk/upper field capture changed')
    source=pilot.load('karl_full_stop_walk_source',pilot.SOURCE_DRIVER)
    cfg,fit=source.validate_config()
    builder=source.load_builder()
    person=fit['person'].copy()
    person['turn_sources']=cfg['turn_sources']
    if builder.source_bindings(person)!=walks['sourceBindings']:
        raise ValueError('Karl own source bindings changed')
    for entry in walks['sourceBindings']['sources']:
        path=ROOT/entry['path']
        if sha(path)!=entry['sha256']:
            raise ValueError('Karl original own paint changed: '+entry['path'])
        before[entry['path']]=entry['sha256']
    variants={}
    for name,variant in walks['variants'].items():
        path=pilot.WALKS/variant['file']
        if sha(path)!=variant['sha256']:
            raise ValueError('Karl own encoded body atlas changed: '+name)
        before[path.relative_to(ROOT).as_posix()]=variant['sha256']
        w,h=variant['frame_size']
        variants[name]={'source':variant,'sheet':Image.new('RGBA',(w*16,h*16)),
                        'cells':{},'minimumGutter':min(w,h)}
    stop_fields=pilot.load('reviewed_pure_stop_fields',pilot.STOP_METHOD).stop_fields
    out.mkdir(parents=True,exist_ok=True)
    working=out/'working'
    working.mkdir(exist_ok=True)
    records=[]
    stage_native={}
    stage_cells={name:{} for name in variants}
    stage3_rms=[]
    checked_pilot=set()
    for row,direction in enumerate(source.ORDER):
        view=person['views'][direction]
        sole_points=pilot.source_points(builder,person,direction)
        if view.get('originalUpper'):
            neutral_render=lambda:builder.motion(person,direction,count=4,phases=[math.pi/2],step_width=0)
        else:
            neutral_render=lambda:builder.motion(person,direction,count=4,strength=0,phases=[0])
        neutral,neutral_trace,neutral_upper=pilot.capture(builder,person,direction,neutral_render)
        captured_neutral=captured['neutrals'][direction]['record']
        if len(neutral)!=1 or neutral_trace[0]!=captured_neutral['bodyRecord']:
            raise ValueError('Karl neutral limb source changed')
        if neutral_upper[0]!={key:captured_neutral['actualUpperWarp'][key] for key in neutral_upper[0]}:
            raise ValueError('Karl neutral upper source changed')
        neutral_path=pilot.WALKS/'working'/f'{direction}-neutral.png'
        if Image.open(neutral_path).convert('RGBA').tobytes()!=neutral[0].tobytes():
            raise ValueError('Karl neutral image changed')
        target=neutral_trace[0]['limb_displacement']
        source_records=walks['limbFields'][direction]
        if len(source_records)!=16 or any(source_records[phase]!=
                captured['walks'][direction]['records'][phase]['bodyRecord'] for phase in range(16)):
            raise ValueError('Karl captured source walk field mismatch')
        upper_sha=captured['walks'][direction]['records'][0]['actualUpperWarp']['sourceRgbaSha256']
        own_records=[]
        for phase,entry in enumerate(source_records):
            swing=0 if math.cos(phase*math.tau/16)>=0 else 1
            own_records.append({'direction':direction,'phase':phase,'swing':swing,
                'source':entry['limb_displacement'],'target':target,'frames':[]})
        for stage,strength in enumerate(pilot.STRENGTHS):
            fields=[stop_fields(record['source'],target,record['swing'],stage)
                    for record in own_records]
            calls=0

            def limb_pose(side,nodes,dx,dy):
                nonlocal calls
                phase=calls//2
                calls+=1
                if phase>=16 or side!=(calls-1)%2 or nodes!=own_records[phase]['source'][side]['nodes_y']:
                    raise ValueError('Karl full stop source limb order/nodes changed')
                return fields[phase][side]['dx'],fields[phase][side]['dy']

            try:
                frames,trace,upper=pilot.capture(builder,person,direction,
                    lambda:builder.motion(person,direction,count=16,strength=strength,limb_pose=limb_pose))
            except ValueError as error:
                if hasattr(error,'frame'):
                    error.frame.save(out/f'{direction}-stage{stage}-phase{error.phase}-FAIL.png')
                raise
            if len(frames)!=16 or calls!=32 or any(field['sourceRgbaSha256']!=upper_sha for field in upper):
                raise ValueError('Karl full stop actual source/upper call count changed')
            native_frames=[]
            encoded_frames={name:[] for name in variants}
            for phase,frame in enumerate(frames):
                actual=trace[phase]['limb_displacement']
                if actual!=[{'nodes_y':own_records[phase]['source'][side]['nodes_y'],
                             'dx':fields[phase][side]['dx'],'dy':fields[phase][side]['dy']}
                            for side in range(2)]:
                    raise ValueError('Karl stop rendered limb field mismatch')
                components,_=label(np.asarray(frame)[:,:,3]>=128)
                if sum(size>=100 for size in np.bincount(components.ravel())[1:])!=1:
                    raise ValueError('Detached Karl full stop source region')
                soles=[pilot.witness(frame,actual,point) for point in sole_points]
                loaded=1-own_records[phase]['swing']
                if stage==0 and any(abs(actual[loaded][axis][-1]-own_records[phase]['source'][loaded][axis][-1])>1e-8
                                    for axis in ('dx','dy')):
                    raise ValueError('Karl loaded source ankle moved at stop stage0')
                slot=pilot.slot(row,phase,stage)
                path=working/f'{direction}-phase{phase:02}-stage{stage}.png'
                frame.save(path)
                cells={}
                outputs={}
                for name,variant in variants.items():
                    physical=variant['source']
                    w,h=physical['frame_size']
                    spec={'cell':[w,h],'figureHeight':physical['figureHeight'],
                          'pivot':physical['pivot'],'working':{'figureHeight':400,'baseline':472}}
                    cell=builder.street.export_cell(frame,spec)
                    bounds=cell.getchannel('A').getbbox()
                    gutter=min(bounds[0],bounds[1],w-bounds[2],h-bounds[3])
                    if gutter<2:
                        raise ValueError('Karl full stop cell transparent gutter collapsed')
                    variant['minimumGutter']=min(variant['minimumGutter'],gutter)
                    variant['sheet'].paste(cell,((slot%16)*w,(slot//16)*h))
                    variant['cells'][slot]=cell
                    cells[name]=cell
                    encoded_frames[name].append(cell)
                    outputs[name]={'bounds':bounds,'gutter':gutter}
                if slot in by_slot:
                    verify_pilot(by_slot[slot],frame,cells)
                    checked_pilot.add(slot)
                own_records[phase]['frames'].append({'stage':stage,'slot':slot,
                    'upperStrength':strength,'working':{'file':path.relative_to(out).as_posix(),
                                                        'sha256':sha(path),'bounds':frame.getbbox()},
                    'encoded':outputs,'ownSoleWitnesses':soles,
                    'limbs':actual,'actualUpperWarp':upper[phase]})
                if stage==3:
                    stage3_rms.append(source.rms(frame,neutral[0]))
                native_frames.append(frame)
            stage_native[direction,stage]=native_frames
            for name in variants:
                stage_cells[name][direction,stage]=encoded_frames[name]
            print('Karl full stop '+direction+'/stage'+str(stage),flush=True)
        records.extend(own_records)
    if len(records)!=64 or sum(len(record['frames']) for record in records)!=256 or len(checked_pilot)!=32:
        raise ValueError('Karl 256 stop cells or frozen pilot overlap missing')
    outputs={}
    for name,variant in variants.items():
        sheet=variant['sheet']
        path=out/f'stops-{name}.webp'
        sheet.save(path,lossless=True,exact=True,method=4)
        decoded=Image.open(path).convert('RGBA')
        if decoded.tobytes()!=sheet.tobytes():
            raise ValueError('Karl encoded stop atlas changed RGBA bytes')
        w,h=variant['source']['frame_size']
        for slot in range(256):
            cell=decoded.crop(((slot%16)*w,(slot//16)*h,(slot%16+1)*w,(slot//16+1)*h))
            if cell.tobytes()!=variant['cells'][slot].tobytes():
                raise ValueError('Karl decoded stop slot changed: '+str(slot))
        outputs[name]={'file':path.name,'sha256':sha(path),'image_size':list(sheet.size),
                       'cell':[w,h],'figureHeight':variant['source']['figureHeight'],
                       'pivot':variant['source']['pivot'],'minimumGutter':variant['minimumGutter'],
                       'decodedExactCells':256}
    for direction in source.ORDER:
        for stage in range(4):
            for theme,color in pilot.COLORS.items():
                pilot.board(stage_native[direction,stage],out/f'{direction}-stage{stage}-working-{theme}.png',8,color)
                for name in variants:
                    scale=3 if name=='desktop' else 4
                    pilot.board(stage_cells[name][direction,stage],
                        out/f'{direction}-stage{stage}-{name}-{theme}.png',8,color,scale)
    if any(sha(ROOT/key)!=digest for key,digest in before.items()):
        raise ValueError('Karl body/pilot source input changed during full stop bake')
    result={'schemaVersion':1,'id':'stadt-karl-heinz-post',
            'status':'held full own-source phase stops; independent encoded/native review pending',
            'walkReceiptSha256':pilot.EXPECTED_WALK,'pilotReceiptSha256':PILOT_SHA,
            'independentPilotReviewSha256':REVIEW_SHA,
            'method':{'file':pilot.STOP_METHOD.relative_to(ROOT).as_posix(),
                      'sha256':sha(pilot.STOP_METHOD),'scope':'pure existing stop_fields only'},
            'sourceBindings':walks['sourceBindings'],'inputs':before,'variants':outputs,
            'records':records,'stopCount':256,'pilotOverlapsExact':len(checked_pilot),
            'stage3ToNeutralRms':{'min':min(stage3_rms),'max':max(stage3_rms),
                                  'mean':sum(stage3_rms)/len(stage3_rms)},
            'limitations':['CPU source/decoded atlas only; no native runtime stop timing, floor or shader.',
                           'Candidate stride27.53 remains held; mouth transport separate.']}
    result['driverSha256']=sha(Path(__file__))
    receipt=out/'stop-source.json'
    receipt.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf8')
    print(json.dumps({'status':result['status'],'stopCount':256,
                      'pilotOverlapsExact':len(checked_pilot),'desktop':outputs['desktop']['sha256'],
                      'mobile':outputs['mobile']['sha256'],'receiptSha256':sha(receipt)}),flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--outdir',type=Path,default=OUTPUT)
    args=parser.parse_args()
    build(args.outdir.resolve())
