"""Compile Irmgard's own 92+256+16 source mouth registrations.

The accepted walk/bridge/turn source already carries captured upper fields.
The held stop receipt carries each actual upper field. Gesture reuses only the
front neutral registration after exact source and encoded head checks.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import importlib.util
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
WALK_MOUTHS = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-moving-mouths-v1/full-moving-mouths.json'
WALK_REVIEW = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-moving-mouths-v1/independent-source-review/REPORT.md'
BODY = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-walk-source-v1'
STOP = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-phase-stop-source-v1'
GESTURE = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-gesture-full16-v1'
PROFILES = HERE / 'source-mouth-profiles-v1.json'
TRANSPORT = HERE / 'full-moving-mouths-v1.py'
HELPER = ROOT / 'tools/build-street-mouths.py'
EXPORTER = ROOT / 'tools/build-street-character-sprites.py'
OUT = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-moving-mouths-v1/full'
ORDER = ('down','right','up','left')
WALK_SHA = 'f89d56c738b9d476609e0c7847e9293fc8e56350db2d92dfb45da6271967403b'
REVIEW_SHA = '9c4219718c43e924b25a4c83e5f80934474b772b560f6a7df17d4983753a61cf'
BODY_SHA = '98e7f1a541ca231dab39bd64f11273e5736124954a4c921ea94f613103029e7b'
STOP_SHA = 'ffc725405705ce0645b725dcc942c7446ce4998b2007adf319ae4d9f7eafe595'
GESTURE_SHA = 'f512b9dd6526ae5cce5b7b0d601c6d150b59f9121a726b6c4c94598c5c88e4f2'
PROFILES_SHA = 'e4d941443f3148ae7c7d16dab5c78e340724453083a43820c8522a3a1528d990'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def build(output):
    inputs={}

    def check(path, expected=None):
        path=Path(path)
        digest=sha(path)
        if expected is not None and digest!=expected:
            raise ValueError('Changed Irmgard source input: '+str(path))
        inputs[path.relative_to(ROOT).as_posix()]=digest

    for path,digest in ((WALK_MOUTHS,WALK_SHA),(WALK_REVIEW,REVIEW_SHA),
                        (BODY/'walk-source.json',BODY_SHA),(STOP/'stop-source.json',STOP_SHA),
                        (GESTURE/'full16-source.json',GESTURE_SHA),(PROFILES,PROFILES_SHA)):
        check(path,digest)
    for path in (TRANSPORT,HELPER,EXPORTER,Path(__file__)):
        check(path)
    walk,body,stops,gesture,profiles=(json.loads(path.read_text(encoding='utf8')) for path in
                                  (WALK_MOUTHS,BODY/'walk-source.json',STOP/'stop-source.json',
                                   GESTURE/'full16-source.json',PROFILES))
    for item in walk['inputs']:
        check(ROOT/item['file'],item['sha256'])
    check(TRANSPORT,walk['driverSha256'])
    for rel,digest in profiles['inputHashes'].items():
        check(ROOT/rel,digest)
    for document in (stops,gesture):
        for rel,digest in document['inputs'].items():
            check(ROOT/rel,digest)
    if (body['id']!='stadt-irmgard-aktenstapel' or body['selectedCells']!=92 or
            body['cell']!=[128,160] or body['pivot']!=[64,150] or
            body['figureHeight']!=136 or body['figureWorldHeight']!=1.6 or
            walk['id']!=body['id'] or walk['visible']!=68 or walk['null']!=24 or
            walk['cell']!=[128,160] or len(walk['selected'])!=92):
        raise ValueError('Irmgard reviewed 92-cell mouth/body registration changed')
    if (stops['id']!=body['id'] or stops['walkReceiptSha256']!=BODY_SHA or
            stops['sourceBindings']!=body['sourceBindings'] or stops['stopCount']!=256 or
            stops['pilotOverlapsExact']!=32 or len(stops['records'])!=64):
        raise ValueError('Irmgard 256 stops do not bind accepted own gait')
    check(HERE.parent/'build-phase-stop-source-v1.py',stops['driverSha256'])
    if (gesture['id']!=body['id'] or gesture['frameMs']!=80 or len(gesture['frames'])!=16 or
            gesture['source']['sha256']!=body['neutrals']['down']['sourceSha256'] or
            gesture['protected']['headAndCapeCollar']!='y<250 exact'):
        raise ValueError('Irmgard gesture does not preserve accepted own front head')
    check(HERE.parent/'gesture-free-hand-v1/build-full16.py',gesture['driverSha256'])
    for folder,document in ((BODY,body),(STOP,stops)):
        for variant in document['variants'].values():
            check(folder/variant['file'],variant['sha256'])
    transport=load('irmgard_accepted_actual_upper_transport',TRANSPORT)
    helper=load('irmgard_existing_cpu_mouth_preview',HELPER)
    street=load('irmgard_existing_source_exporter',EXPORTER)
    walks={name:[walk['selected'][f'{row},{col}'] for col in range(16)]
           for row,name in enumerate(ORDER)}
    bridges={name:[walk['selected'][f'{row+4},{col}'] for col in range(5)]
             for row,name in enumerate(ORDER)}
    turns=[walk['selected'][f'8,{col}'] for col in range(8)]
    if (sum(cell is not None for cells in walks.values() for cell in cells)!=48 or
            sum(cell is not None for cells in bridges.values() for cell in cells)!=15 or
            sum(cell is not None for cell in turns)!=5):
        raise ValueError('Irmgard reviewed walk/bridge/turn mouth selection changed')
    stop_atlases={name:Image.open(STOP/variant['file']).convert('RGBA')
                  for name,variant in stops['variants'].items()}
    compiled_stops,proof,cpu=[], {}, {}
    for index,record in enumerate(stops['records']):
        name,phase=ORDER[index//16],index%16
        if record['direction']!=name or record['phase']!=phase or len(record['frames'])!=4:
            raise ValueError('Irmgard stop direction/phase order changed')
        baseline=walk['fields'][f'{index//16},0']['upper']
        if baseline is None or baseline['sourceRgbaSha256']!=walk['upperSourceRgbaSha256'][name]:
            raise ValueError('Missing reviewed own upper source for stops')
        upper_file=baseline['sourceFile']
        check(ROOT/upper_file['file'],upper_file['sha256'])
        image=Image.open(ROOT/upper_file['file']).convert('RGBA')
        if hashlib.sha256(image.tobytes()).hexdigest()!=baseline['sourceRgbaSha256']:
            raise ValueError('Decoded Irmgard upper source RGBA changed')
        for stage,frame in enumerate(record['frames']):
            slot=index*4+stage
            if frame['stage']!=stage or frame['slot']!=slot:
                raise ValueError('Irmgard stop stage/slot order changed')
            working=STOP/frame['working']['file']
            check(working,frame['working']['sha256'])
            source_frame=Image.open(working).convert('RGBA')
            if source_frame.size!=(512,512):
                raise ValueError('Irmgard stop working cell is not 512')
            for variant_name,variant in stops['variants'].items():
                w,h=variant['cell']
                spec={'cell':[w,h],'figureHeight':variant['figureHeight'],
                    'pivot':variant['pivot'],'working':{'figureHeight':400,'baseline':472}}
                exported=street.export_cell(source_frame,spec)
                decoded=stop_atlases[variant_name].crop(((slot%16)*w,(slot//16)*h,
                                                          (slot%16+1)*w,(slot//16+1)*h))
                if exported.tobytes()!=decoded.tobytes():
                    raise ValueError('Irmgard direct stop export differs from packed cell: '+str(slot))
            actual=frame['actualUpperWarp']
            if any(actual[key]!=baseline[key] for key in ('sourceRgbaSha256','sourceSize','nodes_y')):
                raise ValueError('Irmgard stop upper paint or field branch changed')
            field=copy.deepcopy(actual)
            field['sourceFile']=upper_file
            transport.mapper(field)  # Also validates explicit rear/null fields.
            if name=='up':
                compiled_stops.append(None)
                continue
            result,moved,evidence=transport.transport(profiles['registrations'][name],
                                                       profiles['compiledSourceCells'][name],field)
            moved['input']={'file':working.relative_to(ROOT).as_posix(),
                            'sha256':sha(working),'dimensions':[512,512]}
            closed=helper.preview(moved,result,0)
            opened=helper.preview(moved,result,1)
            if (closed.tobytes()!=source_frame.tobytes() or
                    opened.getchannel('A').tobytes()!=source_frame.getchannel('A').tobytes()):
                raise ValueError('Irmgard stop CPU closed/source or open alpha changed: '+str(slot))
            a,b=np.asarray(source_frame),np.asarray(opened)
            changed=int(np.count_nonzero(np.any(a[:,:,:3]!=b[:,:,:3],axis=2)))
            if changed==0:
                raise ValueError('Irmgard stop open cue vanished: '+str(slot))
            compiled_stops.append(result)
            proof[str(slot)]=evidence
            cpu[str(slot)]={'closedExactRgba':True,'openAlphaExact':True,
                            'openChangedRgbPixels':changed}
        print('Irmgard lip stop '+name+'/'+str(phase),flush=True)
    if len(compiled_stops)!=256 or len(proof)!=192:
        raise ValueError('Irmgard stop mouth coverage incomplete')
    neutral_path=ROOT/gesture['source']['file']
    check(neutral_path,gesture['source']['sha256'])
    turn_path=ROOT/walk['fields']['8,0']['working']['file']
    check(turn_path,walk['fields']['8,0']['working']['sha256'])
    if walk['fields']['8,0']['working']['sha256']!=gesture['source']['sha256']:
        raise ValueError('Gesture neutral is not the reviewed front turn source')
    front=profiles['registrations']['down']
    front_points=[front['centerPx'],*[point for contour in front['contoursPx'].values()
                                      for point in contour]]
    if min(point[1] for point in front_points)<0 or max(point[1] for point in front_points)>=250:
        raise ValueError('Front mouth contour leaves protected gesture head region')
    neutral=np.asarray(Image.open(neutral_path).convert('RGBA'))
    if neutral.shape!=(512,512,4):
        raise ValueError('Irmgard front neutral working dimensions changed')
    head_checks=[]
    source_cells={}
    for name,variant in gesture['variants'].items():
        w,h=variant['cell']
        spec={'cell':[w,h],'figureHeight':variant['figureHeight'],
              'pivot':variant['pivot'],'working':{'figureHeight':400,'baseline':472}}
        source_cells[name]=street.export_cell(Image.fromarray(neutral),spec)
        body_variant=body['variants'][name]
        atlas=Image.open(BODY/body_variant['file']).convert('RGBA')
        body_turn=atlas.crop((0,8*h,w,9*h))
        if body_turn.tobytes()!=source_cells[name].tobytes():
            raise ValueError('Gesture neutral differs from accepted encoded front turn: '+name)
        if len(variant['files'])!=16:
            raise ValueError('Irmgard gesture physical frame count changed')
    for index,record in enumerate(gesture['frames']):
        if (record['index']!=index or record['timeMs']!=index*80 or
                record['source']['file']!=f'output/ambient-city-animation/irmgard-aktenstapel-gesture-full16-v1/working-{index:02}.png'):
            raise ValueError('Irmgard gesture source timing/order changed')
        path=ROOT/record['source']['file']
        check(path,record['source']['sha256'])
        pixels=np.asarray(Image.open(path).convert('RGBA'))
        if pixels.shape!=(512,512,4) or not np.array_equal(pixels[:250],neutral[:250]):
            raise ValueError('Irmgard gesture head/mouth support changed in working source')
        check_row={'index':index,'timeMs':index*80,'workingHeadRowsExact':True,'encodedHeadRowsExact':{}}
        for name,variant in gesture['variants'].items():
            entry=variant['files'][index]
            encoded_path=ROOT/entry['file']
            check(encoded_path,entry['sha256'])
            w,h=variant['cell']
            spec={'cell':[w,h],'figureHeight':variant['figureHeight'],
                  'pivot':variant['pivot'],'working':{'figureHeight':400,'baseline':472}}
            encoded=Image.open(encoded_path).convert('RGBA')
            exported=street.export_cell(Image.fromarray(pixels),spec)
            if encoded.size!=(w,h) or encoded.tobytes()!=exported.tobytes():
                raise ValueError('Irmgard gesture encoded frame differs from own source: '+name)
            # Keep the row cutoff below every mouth support pixel and away
            # from the protected y=250 mesh boundary's resampling footprint.
            head_limit=math.floor(variant['pivot'][1]+(250-472)*variant['figureHeight']/400-2)
            if not np.array_equal(np.asarray(encoded)[:head_limit],
                                  np.asarray(source_cells[name])[:head_limit]):
                raise ValueError('Irmgard gesture encoded head/mouth pixels changed: '+name)
            check_row['encodedHeadRowsExact'][name]=head_limit
        head_checks.append(check_row)
    gestures=[copy.deepcopy(turns[0]) for _ in range(16)]
    if (turns[0] is None or
            turns[0]['profile']!=profiles['compiledSourceCells']['down']['profile'] or
            any(item!=turns[0] for item in gestures)):
        raise ValueError('Gesture mouth profile changed from own front source')
    standing_path=ROOT/'assets/characters/street/stadt-irmgard-aktenstapel-standing.webp'
    check(standing_path,profiles['inputHashes'][standing_path.relative_to(ROOT).as_posix()])
    if Image.open(standing_path).size!=(128,160):
        raise ValueError('Own standing mouth source size changed')
    selected=[*sum(walks.values(),[]),*sum(bridges.values(),[]),*turns,*compiled_stops,*gestures]
    if len(selected)!=364 or sum(cell is None for cell in selected)!=88:
        raise ValueError('Incomplete Irmgard full selected mouth coverage')
    if any(sha(ROOT/rel)!=digest for rel,digest in inputs.items()):
        raise ValueError('Irmgard source input changed during full lip compilation')
    result={'schemaVersion':1,'id':body['id'],'cell':[128,160],
        'status':'held full own-source moving-mouth correspondence; GPU/native unrun',
        'selection':{'selectedCells':364,'visible':276,'null':88},
        'standing':profiles['compiledStanding'],'walks':walks,'bridges':bridges,
        'turns':turns,'stops':compiled_stops,'gesture':gestures,
        'inputFiles':inputs,'driverSha256':sha(Path(__file__)),
        'limitations':['Source/CPU registration only; GPU shader, natural media and runtime are untested.',
                  'Rear-facing walk, bridge, turn and stop slots are explicit null.']}
    output.mkdir(parents=True,exist_ok=True)
    fragment=output/'mouth-moving-v1.json'
    fragment.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf8')
    diagnostic={'schemaVersion':1,'id':body['id'],'selectedCells':364,
        'reviewedWalkCells':92,'stopCells':256,'gestureCells':16,
        'stopDenseSupportProof':proof,'stopCpuCueChecks':cpu,
        'gestureHeadSourceAndEncodedProof':head_checks,
        'gestureBaseline':{'workingSha256':gesture['source']['sha256'],
                           'sameAsReviewedFrontTurn':True,
                           'acceptedEncodedFrontTurnExact':list(gesture['variants']),
                           'mouthContourMaximumSourceY':max(point[1] for point in front_points)},
        'maximumStopAffineResidualWorkingPx':max(item['maximumAffineResidualWorkingPx'] for item in proof.values()),
        'minimumStopOpenChangedRgbPixels':min(item['openChangedRgbPixels'] for item in cpu.values()),
        'maximumStopOpenChangedRgbPixels':max(item['openChangedRgbPixels'] for item in cpu.values()),
        'inputFiles':inputs,'fragmentSha256':sha(fragment)}
    proof_path=output/'full-transport-proof.json'
    proof_path.write_text(json.dumps(diagnostic,indent=2,allow_nan=False)+'\n',encoding='utf8')
    print(json.dumps({'fragmentSha256':sha(fragment),'proofSha256':sha(proof_path),
        'selected':364,'visible':276,'null':88,
        'maximumStopResidualWorkingPx':diagnostic['maximumStopAffineResidualWorkingPx']}),flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--outdir',type=Path,default=OUT)
    args=parser.parse_args()
    build(args.outdir.resolve())
