"""Capture Karl's actual head warp controls; require exact existing body replay.

No renderer, atlas, source-fit or canonical manifest is changed. This captures
the existing deformation calls rather than estimating mouth motion from feet.
"""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
BODY = ROOT / 'output/ambient-city-animation/karl-post-walk-source-v1'
DEFAULT_OUT = ROOT / 'output/ambient-city-animation/karl-post-mouth-fields-v1'
DRIVER = HERE.parent / 'build-walk-source-v1.py'
EXPECTED_BODY = '4eebaefae5f8b81d1854298bfcaf4559dd041ba740c4034b70baebd96a643eac'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def ref(path):
    return {'file': Path(path).relative_to(ROOT).as_posix(), 'sha256': sha(path)}


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def build(out):
    if sha(BODY / 'walk-source.json') != EXPECTED_BODY:
        raise ValueError('Reviewed Karl body receipt changed')
    receipt = json.loads((BODY / 'walk-source.json').read_text())
    if sha(DRIVER) != receipt['driverSha256']:
        raise ValueError('Body source driver changed')
    source = load('karl_body_field_capture', DRIVER)
    cfg, fit = source.validate_config()
    builder = source.load_builder()
    person = fit['person'].copy()
    person['turn_sources'] = cfg['turn_sources']
    if builder.source_bindings(person) != receipt['sourceBindings']:
        raise ValueError('Body source bindings changed')
    profiles_path = HERE / 'source-mouth-profiles-v1.json'
    profiles = json.loads(profiles_path.read_text())
    out.mkdir(parents=True, exist_ok=True)
    atlases = {}
    inputs = [BODY / 'walk-source.json', DRIVER, profiles_path,
              HERE / 'registered-neutrals-v1.png']
    for name, variant in receipt['variants'].items():
        path = BODY / variant['file']
        if sha(path) != variant['sha256']:
            raise ValueError('Reviewed body atlas changed: ' + name)
        inputs.append(path)
        atlases[name] = Image.open(path).convert('RGBA')
    before = {str(path): sha(path) for path in inputs}
    upper_hashes = {}
    verified = set()

    def verify(frame, row, col, working_name):
        path = BODY / 'working' / working_name
        with Image.open(path) as image:
            if image.convert('RGBA').tobytes() != frame.tobytes():
                raise ValueError('Working replay differs: ' + working_name)
        for name, variant in receipt['variants'].items():
            w, h = variant['frame_size']
            spec = {'cell': [w, h], 'figureHeight': variant['figureHeight'],
                    'pivot': variant['pivot'],
                    'working': {'figureHeight': 400, 'baseline': 472}}
            actual = atlases[name].crop((col*w, row*h, (col+1)*w, (row+1)*h))
            if actual.tobytes() != builder.street.export_cell(frame, spec).tobytes():
                raise ValueError(f'Encoded replay differs: {name}/{row}/{col}')
        verified.add((row, col))

    original_motion = builder.motion
    captured_runs = []

    def traced_motion(p, direction, *args, **kwargs):
        calls = []
        original_warp = builder.paint.warp_layer

        def warp(layer, ys, dx, dy):
            calls.append({'sourceRgbaSha256': hashlib.sha256(layer.tobytes()).hexdigest(),
                          'sourceSize': list(layer.size), 'nodes_y': list(ys),
                          'dx': list(dx), 'dy': list(dy), 'source': layer.copy()})
            return original_warp(layer, ys, dx, dy)

        builder.paint.warp_layer = warp
        try:
            frames, records = original_motion(p, direction, *args, **kwargs)
        finally:
            builder.paint.warp_layer = original_warp
        if len(calls) != len(frames)*3:
            raise ValueError('Expected two leg fields and one actual upper field per frame')
        if p['views'][direction].get('originalUpper'):
            fields = calls[-len(frames):]
            mode = 'actual-original-upper-warp'
        else:
            fields = calls[2::3]
            mode = 'actual-animate-upper-warp'
        hashes = {field['sourceRgbaSha256'] for field in fields}
        if len(hashes) != 1:
            raise ValueError('Upper paint changes within the same motion')
        digest = next(iter(hashes))
        if direction in upper_hashes and upper_hashes[direction] != digest:
            raise ValueError('Upper paint changes across walk/bridge/neutral')
        upper_hashes[direction] = digest
        path = out / f'upper-source-{direction}.png'
        fields[0]['source'].save(path)
        # Mouth fitting used neutral full figures. The captured masked upper
        # must contain exactly that own source paint around the fitted lips.
        if direction != 'up':
            entry = profiles['registrations'][direction]
            center = np.asarray(entry['centerPx']) - entry['cellOriginPx']
            x, y = center
            box = (int(x)-35, int(y)-25, int(x)+36, int(y)+26)
            with Image.open(BODY / 'working' / f'{direction}-neutral.png') as image:
                if fields[0]['source'].crop(box).tobytes() != image.convert('RGBA').crop(box).tobytes():
                    raise ValueError('Captured upper differs from inspected own neutral lips: ' + direction)
        result = []
        identity = kwargs.get('strength', 1) == 0
        for index, (record, field) in enumerate(zip(records, fields)):
            del field['source']
            field['sourceFile'] = ref(path)
            result.append({'index': index, 'bodyRecord': source.native(record),
                           'mode': 'identity-source-copy' if identity else mode,
                           'actualUpperWarp': source.native(field)})
        captured_runs.append(result)
        return frames, records

    builder.motion = traced_motion
    proof = {'schemaVersion': 1, 'id': 'stadt-karl-heinz-post',
             'status': 'candidate exact field correspondence; no mouth or contact admission',
             'bodyReceipt': ref(BODY / 'walk-source.json'),
             'sourceBindings': receipt['sourceBindings'],
             'workingToLogical': {'scale': 136/400, 'workingPivot': [256, 472],
                                  'logicalPivot': [64, 150], 'cell': [128, 160]},
             'walks': {}, 'bridges': {}, 'neutrals': {}}
    for row, direction in enumerate(source.ORDER):
        captured_runs.clear()
        frames, _ = builder.motion(person, direction, count=16)
        fields = captured_runs.pop()
        for col, frame in enumerate(frames):
            verify(frame, row, col, f'{direction}-walk-{col:02}.png')
        proof['walks'][direction] = {'row': row, 'records': fields}
        captured_runs.clear()
        frames = builder.bridge_frames(person, direction)
        fields = [run[0] for run in captured_runs]
        if len(fields) != 5:
            raise ValueError('Bridge capture order changed')
        for col, frame in enumerate(frames):
            verify(frame, row+4, col, f'{direction}-bridge-{col}.png')
            fields[col]['index'] = col
        proof['bridges'][direction] = {'row': row+4, 'records': fields}
        captured_runs.clear()
        frame = builder.neutral(person, direction)
        record = captured_runs.pop()[0]
        col = source.ORDER.index(direction)*2
        verify(frame, 8, col, f'turn-{col}.png')
        proof['neutrals'][direction] = {'row': 8, 'col': col, 'record': record}
        print('Exact Karl fields/replay: ' + direction, flush=True)
    for col in (1, 3, 5, 7):
        entry = cfg['turn_sources'][col]
        frame, _ = builder.street.register_source(Image.open(ROOT/entry['source']).convert('RGBA'),
                                                   entry, entry['scale'], 472)
        verify(frame, 8, col, f'turn-{col}.png')
    if len(verified) != 92 or any(sha(Path(path)) != digest for path, digest in before.items()):
        raise ValueError('Incomplete replay or changed source inputs')
    proof['verifiedSelectedCells'] = len(verified)
    proof['upperSourceRgbaSha256'] = upper_hashes
    proof['inputs'] = [ref(path) for path in inputs]
    proof['driver'] = ref(Path(__file__))
    proof['limitations'] = ['Actual field capture only; no lip transport, shader, media or floor approval.']
    target = out / 'walk-fields.json'
    target.write_text(json.dumps(proof, indent=2, allow_nan=False)+'\n', encoding='utf8')
    print(json.dumps({'status': 'exact-replay-pass', 'cells': 92, 'receipt': ref(target)}), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--outdir', type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    build(args.outdir.resolve())
