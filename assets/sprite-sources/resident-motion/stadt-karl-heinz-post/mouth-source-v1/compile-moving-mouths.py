"""Assemble Karl's own source lips across the exact walk, stops and gesture.

Uses captured head fields and unchanged gesture head paint. This emits authoring
metadata only; actual shader/media/runtime acceptance remains a separate gate.
"""
from pathlib import Path
import argparse
import copy
import hashlib
import importlib.util
import json

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
FIELDS = ROOT/'output/ambient-city-animation/karl-post-mouth-fields-v1/walk-fields.json'
WALK = ROOT/'output/ambient-city-animation/karl-post-moving-mouths-v1/walk-mouths.json'
BODY = ROOT/'output/ambient-city-animation/karl-post-walk-source-v1'
STOP = ROOT/'output/ambient-city-animation/karl-post-phase-stop-source-v1'
GESTURE = ROOT/'output/ambient-city-animation/karl-post-envelope-gesture-v1/full16'
OUT = ROOT/'output/ambient-city-animation/karl-post-moving-mouths-v1/full'
ORDER = ('down', 'right', 'up', 'left')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load(name, path):
    definition = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(definition)
    definition.loader.exec_module(module)
    return module


def build(out):
    transport = load('karl_actual_lip_transport', HERE/'transport-walk-lips.py')
    paths = [FIELDS, WALK, BODY/'walk-source.json', STOP/'stop-source.json',
             GESTURE/'gesture-source.json', HERE/'source-mouth-profiles-v1.json',
             HERE/'transport-walk-lips.py', Path(__file__)]
    inputs = {}

    def check(path, expected=None):
        path = Path(path)
        digest = sha(path)
        if expected is not None and digest != expected:
            raise ValueError('Changed source input: '+str(path))
        inputs[path.relative_to(ROOT).as_posix()] = digest

    for path in paths:
        check(path)
    fields, walk, body, stops, gesture, profiles = [json.loads(path.read_text(encoding='utf8'))
                                                   for path in paths[:6]]
    for document in (fields, walk):
        for item in document['inputs']:
            check(ROOT/item['file'], item['sha256'])
    check(ROOT/fields['driver']['file'], fields['driver']['sha256'])
    check(HERE/'transport-walk-lips.py', walk['driverSha256'])
    for name, digest in profiles['inputHashes'].items():
        check(ROOT/name, digest)
    for document in (stops, gesture):
        for name, digest in document['inputs'].items():
            check(ROOT/name, digest)
    if (body['id'] != 'stadt-karl-heinz-post' or body['cell'] != [128,160]
            or body['pivot'] != [64,150] or body['figureWorldHeight'] != 1.6
            or body['selectedCells'] != 92 or fields['verifiedSelectedCells'] != 92
            or walk['visible'] != 68 or walk['null'] != 24):
        raise ValueError('Wrong Karl walk registration or mouth coverage')
    if (stops['sourceBindings'] != body['sourceBindings'] or stops['stopCount'] != 256
            or stops['walkReceiptSha256'] != sha(BODY/'walk-source.json')
            or len(stops['records']) != 64 or stops['pilotOverlapsExact'] != 32):
        raise ValueError('Stops do not belong to reviewed Karl gait')
    check(HERE.parent/'build-phase-stop-full-v1.py', stops['driverSha256'])
    check(HERE.parent/'gesture-envelope-v1/build-full16.py', gesture['driverSha256'])
    for folder, document in ((BODY, body), (STOP, stops), (GESTURE, gesture)):
        for variant in document['variants'].values():
            check(folder/variant['file'], variant['sha256'])
    moves = {name:[walk['selected'][f'{row},{col}'] for col in range(16)]
             for row,name in enumerate(ORDER)}
    bridges = {name:[walk['selected'][f'{row+4},{col}'] for col in range(5)]
               for row,name in enumerate(ORDER)}
    turns = [walk['selected'][f'8,{col}'] for col in range(8)]
    compiled_stops, proof = [], {}
    for index, record in enumerate(stops['records']):
        name, phase = ORDER[index//16], index%16
        if record['direction'] != name or record['phase'] != phase or len(record['frames']) != 4:
            raise ValueError('Stop source phase order changed')
        baseline = fields['walks'][name]['records'][0]['actualUpperWarp']
        for stage, frame in enumerate(record['frames']):
            if frame['stage'] != stage or frame['slot'] != index*4+stage:
                raise ValueError('Stop source stage order changed')
            check(STOP/frame['working']['file'], frame['working']['sha256'])
            actual = frame['actualUpperWarp']
            if any(actual[key] != baseline[key] for key in ('sourceRgbaSha256','sourceSize','nodes_y')):
                raise ValueError('Stop head uses different own paint or field branch')
            # Attach the already captured identical upper-source PNG to the
            # actual stop controls, retaining their original dx/dy unchanged.
            field = copy.deepcopy(actual)
            field['sourceFile'] = baseline['sourceFile']
            mode = 'actual-original-upper-warp' if name in ('right','left') else 'actual-animate-upper-warp'
            mapped = transport.mapper({'mode':mode,'actualUpperWarp':field},
                                      fields['upperSourceRgbaSha256'][name])
            if name == 'up':
                compiled_stops.append(None)
            else:
                result, evidence = transport.transport(profiles['registrations'][name],
                                                        profiles['compiledSourceCells'][name], mapped)
                compiled_stops.append(result)
                proof[str(frame['slot'])] = evidence
    if (gesture['id'] != body['id'] or gesture['frameCount'] != 16 or gesture['frameMs'] != 80
            or len(gesture['frames']) != 16 or gesture['source']['sha256'] != body['turns']['sources'][0]['sourceSha256']):
        raise ValueError('Gesture does not use Karl own measured front head')
    source = ROOT/gesture['source']['file']
    check(source, gesture['source']['sha256'])
    original = np.asarray(Image.open(source).convert('RGBA'))
    working = []
    for index, record in enumerate(gesture['frames']):
        if record['frame'] != index or record['durationMs'] != 80:
            raise ValueError('Gesture frame order/timing changed')
        path = GESTURE/record['file']
        check(path, record['sha256'])
        frame = Image.open(path).convert('RGBA')
        pixels = np.asarray(frame)
        if frame.size != (512,512) or not np.array_equal(pixels[:270], original[:270]) or not np.array_equal(pixels[400:], original[400:]):
            raise ValueError('Gesture changed mouth/head or planted feet')
        working.append(frame)
    street = load('karl_gesture_source_sampler', ROOT/'tools/build-street-character-sprites.py')
    for name, variant in gesture['variants'].items():
        w,h = variant['cell']
        atlas = Image.open(GESTURE/variant['file']).convert('RGBA')
        if atlas.size != (w*16,h):
            raise ValueError('Gesture atlas geometry changed')
        spec = {'cell':[w,h],'figureHeight':variant['figureHeight'],'pivot':variant['pivot'],
                'working':{'figureHeight':400,'baseline':472}}
        for index, frame in enumerate(working):
            if atlas.crop((index*w,0,(index+1)*w,h)).tobytes() != street.export_cell(frame,spec).tobytes():
                raise ValueError('Encoded gesture head differs from inspected source')
    gestures = [copy.deepcopy(turns[0]) for _ in range(16)]
    selected = [*sum(moves.values(),[]),*sum(bridges.values(),[]),*turns,*compiled_stops,*gestures]
    if len(selected) != 364 or sum(cell is None for cell in selected) != 88:
        raise ValueError('Incomplete full selected mouth coverage')
    if any(sha(ROOT/name) != digest for name,digest in inputs.items()):
        raise ValueError('Source input changed during lip compilation')
    result = {'schemaVersion':1,'id':body['id'],'cell':[128,160],
              'status':'held own-source full moving lip correspondence; GPU/native unrun',
              'walks':moves,'bridges':bridges,'turns':turns,'stops':compiled_stops,'gesture':gestures,
              'standing':profiles['compiledStanding'],'selection':{'selectedCells':364,'visible':276,'null':88},
              'inputFiles':inputs,'driverSha256':sha(Path(__file__)),
              'limitations':['No GPU shader, native media, runtime gesture or floor acceptance.']}
    out.mkdir(parents=True,exist_ok=True)
    target = out/'mouth-moving-v1.json'
    target.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf8')
    (out/'stop-transport-proof.json').write_text(json.dumps(proof,indent=2,allow_nan=False)+'\n',encoding='utf8')
    print(json.dumps({'fragmentSha256':sha(target),'visible':276,'null':88,
                      'maximumStopResidualWorkingPx':max(p['maximumAffineResidualWorkingPx'] for p in proof.values())}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--outdir',type=Path,default=OUT)
    args = parser.parse_args()
    build(args.outdir.resolve())
