"""Assemble one ignored Renate candidate from exact own source receipts.

This does not admit assets, change a manifest or approve a stride. Detailed
source diagnostics stay in source receipts instead of runtime walk metadata.
"""
import argparse
from copy import deepcopy
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
ID = 'stadt-renate-termin'
ORDER = ('down', 'right', 'up', 'left')
COLS, ROWS = 21, 18
sys.path.insert(0, str(ROOT / '.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, separators=(',', ':'), allow_nan=False) + '\n', encoding='utf8')


def layout():
    movement = {(r, c) for r in range(4) for c in range(16)}
    movement |= {(r, c) for r in range(4, 8) for c in range(5)}
    movement |= {(8, c) for c in range(8)}
    gesture = {(13, c) for c in range(16)}
    available = ((r, c) for r in range(ROWS) for c in range(COLS) if (r, c) not in movement | gesture)
    stops = [next(available) for _ in range(256)]
    if len(movement) != 92 or len(set(stops)) != 256:
        raise ValueError('Changed source-cell layout')
    return movement, gesture, stops


def build(args):
    output = args.outdir.resolve()
    if not output.is_relative_to(ROOT / 'output'):
        raise ValueError('Candidate must stay in ignored output until acceptance')
    if not math.isfinite(args.stride_distance) or args.stride_distance <= 0:
        raise ValueError('Expected measured candidate game-unit stride')
    inputs = {}

    def check(path, digest=None):
        path = path.resolve()
        if not path.is_relative_to(ROOT):
            raise ValueError('Own source must stay in this worktree')
        actual = sha(path)
        if digest is not None and actual != digest:
            raise ValueError('Source changed: ' + str(path))
        inputs[path.relative_to(ROOT).as_posix()] = actual
        return path

    for path, digest in [(args.body, args.body_sha), (args.stops, args.stops_sha), (args.mouths, args.mouths_sha)]:
        check(path, digest)
    body, stops, mouths = (json.loads(p.read_text(encoding='utf8')) for p in (args.body, args.stops, args.mouths))
    gesture_path = ROOT / 'output/ambient-city-animation/renate-termin-gesture-full16-v1/gesture-source.json'
    check(gesture_path, '51be06cd62b986e7063f2ee58b74076f1ff5df94d1e13c7abcb66fbdc0e19c03')
    gesture = json.loads(gesture_path.read_text(encoding='utf8'))
    for document, key in [(body, 'inputHashes'), (stops, 'inputHashes'), (mouths, 'inputFiles')]:
        for rel, digest in document[key].items():
            check(ROOT / rel, digest)
    if (body['identity'] != ID or body['sourceCells'] != 92 or stops['walkReceiptSha256'] != args.body_sha
            or len(stops['records']) != 64 or mouths['id'] != ID
            or mouths['selection'] != {'selectedCells': 364, 'visible': 276, 'null': 88}):
        raise ValueError('Wrong own family source coverage')
    canonical = ROOT / 'assets/characters/street/manifest.json'
    published = json.loads(canonical.read_text(encoding='utf8'))['characters'][ID]
    if (published['cell'] != [128, 160] or published['pivot'] != [64, 150]
            or published['figureHeight'] != 136 or published['figureWorldHeight'] != 1.6
            or published['standing']['sha256'] != '555be43f14ae488422032e1b6b68dc429c6d6052607991daf5e7834d04c2b1da'):
        raise ValueError('Original standing identity or world geometry changed')
    check(ROOT / published['standing']['file'].removeprefix('./'), published['standing']['sha256'])
    check(canonical)
    exporter_path = ROOT / 'tools/build-street-character-sprites.py'
    check(exporter_path)
    spec = importlib.util.spec_from_file_location('renate_candidate_export', exporter_path)
    street = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(street)
    check(ROOT / '.agents/skills/animate-2d-characters/scripts/painted_walk.py')
    check(Path(__file__))
    movement, gestures, stop_slots = layout()
    # One binding per selected slot also drives the final lip table.
    cells = {}
    for r, direction in enumerate(ORDER):
        for kind, count, row in [('walk', 16, r), ('bridge', 5, r + 4)]:
            for col in range(count):
                name = f'{direction}-walk-{col:02}.png' if kind == 'walk' else f'{direction}-bridge-{col}.png'
                path = args.body.parent / 'working' / name
                check(path, body['workingHashes']['working/' + name])
                cells[row, col] = (path, mouths['walks' if kind == 'walk' else 'bridges'][direction][col])
    for col, record in enumerate(body['turns']):
        path = args.body.parent / record['file']
        check(path, record['sha256'])
        cells[8, col] = (path, mouths['turns'][col])
    for col in range(16):
        path = gesture_path.parent / gesture['fields'][col]['working']
        check(path, gesture['files'][path.name])
        cells[13, col] = (path, mouths['gesture'][col])
    for index, record in enumerate(stops['records']):
        if record['direction'] != ORDER[index // 16] or record['phase'] != index % 16 or len(record['frames']) != 4:
            raise ValueError('Stop direction/phase ownership changed')
        for stage, frame in enumerate(record['frames']):
            path = args.stops.parent / frame['file']
            check(path, frame['sha256'])
            slot = index * 4 + stage
            cells[stop_slots[slot]] = (path, mouths['stops'][slot])
    if len(cells) != 364:
        raise ValueError('Incomplete selected source coverage')
    output.mkdir(parents=True, exist_ok=True)
    base = './assets/characters/residents/' + ID + '/delivery-v1/'
    variants, export_checks = {}, {}
    for variant, cell, pivot, height in [('desktop', [96, 120], [48, 112.5], 99), ('mobile', [64, 80], [32, 75], 66)]:
        w, h = cell
        atlas = Image.new('RGBA', (COLS * w, ROWS * h))
        exports, gutters = {}, []
        for (row, col), (path, _) in cells.items():
            image = street.export_cell(Image.open(path).convert('RGBA'), {
                'working': {'figureHeight': 400, 'baseline': 472}, 'cell': cell, 'pivot': pivot, 'figureHeight': height})
            bbox = image.getchannel('A').getbbox()
            if bbox is None:
                raise ValueError('Empty source body')
            gutters.append(min(bbox[0], bbox[1], w - bbox[2], h - bbox[3]))
            atlas.paste(image, (col * w, row * h))
            exports[row, col] = image
        if min(gutters) < 2:
            raise ValueError('Transparent gutter is too narrow')
        path = output / ('source-' + variant + '.webp')
        atlas.save(path, lossless=True, exact=True, method=4)
        decoded = Image.open(path).convert('RGBA')
        if atlas.tobytes() != decoded.tobytes():
            raise ValueError('Source atlas lossless encode changed pixels')
        for (row, col), image in exports.items():
            if decoded.crop((col * w, row * h, (col + 1) * w, (row + 1) * h)).tobytes() != image.tobytes():
                raise ValueError('Source-cell placement changed')
        variants[variant] = {'file': base + path.name, 'sha256': sha(path), 'width': atlas.width, 'height': atlas.height}
        export_checks[variant] = {'exactSelectedCells': len(exports), 'minimumGutter': min(gutters), 'paintFigureHeight': height}
    lip_frames = [None] * (COLS * ROWS)
    for (row, col), (_, registration) in cells.items():
        lip_frames[row * COLS + col] = registration
    if sum(r is not None for r in lip_frames) != 276 or sum(r is None for r in lip_frames) != 102:
        raise ValueError('Wrong visible/null mouth table')
    lip = {'schemaVersion': 1, 'id': ID, 'cell': [128, 160], 'grid': [COLS, ROWS],
           'sources': {'standing': published['standing']['sha256'], **{name: v['sha256'] for name, v in variants.items()}},
           'standing': mouths['standing'], 'frames': lip_frames}
    write(output / 'mouths-v1.json', lip)
    walks = {d: {'row': i, 'frames': 16, 'frame_ms': 60, 'loop': True} for i, d in enumerate(ORDER)}
    bridges = {d: {'row': i + 4, 'stop_cols': [0, 1, 2], 'start_cols': [3, 4], 'frame_ms': 70} for i, d in enumerate(ORDER)}
    turns = [{'row': 8, 'col': i} for i in range(8)]
    anchors = {d: i * 2 for i, d in enumerate(ORDER)}
    transitions = {a + '-to-' + b: {'frames': paint.plan_transition(a, b, walks, bridges, turns, anchors, turn_ms=85)}
                   for a in ORDER for b in ORDER if a != b}
    settles = {}
    for i, direction in enumerate(ORDER):
        settles[direction] = {}
        for phase in range(16):
            slots = stop_slots[(i * 16 + phase) * 4:(i * 16 + phase + 1) * 4]
            seq = [{'row': r, 'col': c, 'ms': 70} for r, c in slots]
            seq.append({'row': i + 4, 'col': 2, 'ms': 70})
            settles[direction][str(phase)] = {'frames': seq}
    states = {name: {'row': 13, 'col': 0, 'durations_ms': [80] * 16, 'loop': False, 'next': 'neutral'}
              for name in ('greet', 'work', 'review')}
    states.update({name: {'row': 4, 'col': 2, 'durations_ms': [ms], 'loop': False, 'next': 'neutral'}
                   for name, ms in [('look', 80), ('wait', 600), ('success', 300), ('failure', 300)]})
    person = {k: deepcopy(published[k]) for k in ('id', 'aliases', 'cell', 'pivot', 'figureHeight', 'figureWorldHeight', 'standing')}
    person.update(standingOnly=False, grid=[COLS, ROWS], strideDistance=args.stride_distance, variants=variants,
                  clips={d: {'offset': i * COLS, 'count': 16, 'seconds': .96} for i, d in enumerate(ORDER)},
                  atlasMotion={'schemaVersion': 1, 'walks': walks, 'bridges': bridges, 'transitions': transitions,
                               'neutral': {'row': 4, 'col': 2}, 'settles': settles,
                               'interactions': {'neutral': {'row': 4, 'col': 2}, 'states': states}},
                  mouthPaint={'file': base + 'mouths-v1.json', 'sha256': sha(output / 'mouths-v1.json')})
    person['clips']['idle'] = {'offset': 4 * COLS + 2, 'count': 1, 'seconds': 1}
    write(output / 'person.json', person)
    if any(sha(ROOT / rel) != digest for rel, digest in inputs.items()):
        raise ValueError('Source changed during assembly')
    receipt = {'status': 'ignored source candidate; packed/native/world acceptance pending', 'id': ID,
               'inputFiles': inputs, 'strideDistance': args.stride_distance, 'strideStatus': 'candidate, not world-approved',
               'selectedCells': 364, 'logicalCells': 378, 'visibleMouths': 276, 'nullMouths': 102,
               'exportChecks': export_checks,
               'outputs': {name: sha(output / name) for name in ('source-desktop.webp', 'source-mobile.webp', 'mouths-v1.json', 'person.json')}}
    write(output / 'compile-receipt.json', receipt)
    print(json.dumps({k: receipt[k] for k in ('status', 'selectedCells', 'visibleMouths', 'exportChecks')}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('body', 'stops', 'mouths', 'outdir'):
        parser.add_argument('--' + name, type=Path, required=True)
    for name in ('body-sha', 'stops-sha', 'mouths-sha'):
        parser.add_argument('--' + name, required=True)
    parser.add_argument('--stride-distance', type=float, required=True)
    build(parser.parse_args())
