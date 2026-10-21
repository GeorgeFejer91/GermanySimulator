"""Bind Renate's inspected lips to actual per-cell painted upper fields.

The required body receipt hash pins one coherent walking/bridge/turn source.
Optional phase stops are admitted only as source candidates, never runtime.
"""
import argparse
from copy import deepcopy
import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
ORDER = ('down', 'right', 'up', 'left')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def build(body_path, body_sha, output, stop_path=None, stop_sha=None):
    inputs = {}

    def check(path, expected=None):
        path = path.resolve()
        if not path.is_relative_to(ROOT):
            raise ValueError('Source must remain inside this worktree')
        digest = sha(path)
        if expected is not None and digest != expected:
            raise ValueError('Changed own source: ' + str(path))
        inputs[path.relative_to(ROOT).as_posix()] = digest
        return path

    check(body_path, body_sha)
    for path, digest in [(HERE / 'profiles.json', '05310853e71aa8b5ebda87598c67af370824184a107acb9c19f8acd2f5122370'),
                         (HERE / 'compiled.json', '3e69e32180b6ec78eb3f2757ce981baa4b478586c29e8cf3b7c569ab4eb1671f')]:
        check(path, digest)
    for path in [Path(__file__), HERE / 'transport-fields-v1.py', ROOT / 'tools/build-street-mouths.py',
                 ROOT / 'tools/build-street-character-sprites.py']:
        check(path)
    body = json.loads(body_path.read_text(encoding='utf8'))
    if body['identity'] != 'stadt-renate-termin' or body['sourceCells'] != 92:
        raise ValueError('Wrong body source identity/coverage')
    for rel, digest in body['inputHashes'].items():
        check(ROOT / rel, digest)
    profiles = json.loads((HERE / 'profiles.json').read_text(encoding='utf8'))
    compiled = json.loads((HERE / 'compiled.json').read_text(encoding='utf8'))
    check(HERE / 'input-pins.json', '6ebd4700fbb35010a373d9d11fa6ce10790be181c7ec7235b90d2fb43e3fb9aa')
    for row in json.loads((HERE / 'input-pins.json').read_text())['rows']:
        check(ROOT / row['file'], row['sha256'])
    transport = load('renate_lip_actual_field', HERE / 'transport-fields-v1.py')
    helper = load('renate_lip_cpu', ROOT / 'tools/build-street-mouths.py')
    street = load('renate_lip_direct_export', ROOT / 'tools/build-street-character-sprites.py')
    fields = load('renate_body_field_crosscheck', HERE.parent / 'walk-source-v1/source_fields.py')
    output.mkdir(parents=True, exist_ok=True)
    folder = body_path.parent
    proof, checks, selected = {}, {}, {}

    def add(key, name, path, digest, field_record, physical_paths=None, physical_pins=None):
        check(path, digest)
        frame = Image.open(path).convert('RGBA')
        if frame.size != (512, 512):
            raise ValueError('Wrong working source dimensions')
        field = field_record['upper']
        transported = transport.mapper(field)
        points = np.column_stack([np.linspace(120, 390, 257), np.linspace(120, 260, 257)])
        disagreement = float(np.max(np.abs(transported(points) - fields.transport_upper_points(name, field_record, points))))
        if disagreement > 1e-10:
            raise ValueError('Lip transport differs from actual body field API')
        entry = profiles['registrations'][name]
        if entry is None:
            selected[key] = None
            checks[key] = {'explicitRearNull': True, 'bodyMapperDifference': disagreement}
            return None
        reg, moved, evidence = transport.transport(entry, compiled['registrations'][name], field)
        neutral = Image.open(ROOT / entry['input']['file']).convert('RGBA')
        expected_upper = fields.paint.warp_layer(neutral, field['nodes_y'], field['dx'], field['dy'])
        yy, xx = np.mgrid[:512, :512]
        inverse = np.linalg.inv(np.asarray(moved['axesPx']).reshape(2, 2).T)
        local = (np.stack([xx, yy], axis=-1) - moved['centerPx']) @ inverse.T
        support = (abs(local[:, :, 0]) < 2) & (local[:, :, 1] >= -1.6) & (local[:, :, 1] <= 3)
        if not np.array_equal(np.asarray(frame)[support], np.asarray(expected_upper)[support]):
            raise ValueError('Actual painted mouth support does not match recorded upper warp: ' + key)
        evidence['actualSourceSupportPixelsExact'] = int(np.count_nonzero(support))
        moved['input'] = {'file': path.relative_to(ROOT).as_posix(), 'sha256': sha(path), 'dimensions': [512, 512]}
        row = {'bodyMapperDifference': disagreement, 'sizes': {}}
        for variant, cell, pivot, paint_height in [('working', [512, 512], [256, 472], 400),
                ('desktop', [96, 120], [48, 112.5], 99), ('mobile', [64, 80], [32, 75], 66)]:
            if variant == 'working':
                image, direct = frame, moved
            else:
                spec = {'cell': cell, 'pivot': pivot, 'figureHeight': paint_height,
                        'working': {'figureHeight': 400, 'baseline': 472}}
                image = street.export_cell(frame, spec)
                if physical_paths is not None:
                    physical = physical_paths[variant]
                    expected_sha = physical_pins[variant] if physical_pins else body['physicalHashes'][physical.relative_to(folder).as_posix()]
                    check(physical, expected_sha)
                    if image.tobytes() != Image.open(physical).convert('RGBA').tobytes():
                        raise ValueError('Mouth source differs from exact physical body')
                    direct_path = physical
                else:
                    direct_path = output / f'{key}-{variant}-source.png'
                    image.save(direct_path)
                scale = paint_height / 400
                origin = np.asarray(pivot) - np.asarray([256, 472]) * scale
                direct = {**moved, 'input': {'file': direct_path.relative_to(ROOT).as_posix(),
                          'sha256': sha(direct_path), 'dimensions': cell}, 'cell': cell,
                          'centerPx': (np.asarray(moved['centerPx']) * scale + origin).tolist(),
                          'axesPx': (np.asarray(moved['axesPx']) * scale).tolist(),
                          'contoursPx': {k: (np.asarray(v) * scale + origin).tolist() for k, v in moved['contoursPx'].items()}}
            closed, opened = helper.preview(direct, reg, 0), helper.preview(direct, reg, 1)
            if closed.tobytes() != image.tobytes() or opened.getchannel('A').tobytes() != image.getchannel('A').tobytes():
                raise ValueError('Moving mouth closed RGBA/open alpha changed: ' + key)
            changed = int(np.count_nonzero(np.any(np.asarray(opened)[:, :, :3] != np.asarray(image)[:, :, :3], axis=2)))
            if changed == 0:
                raise ValueError('Moving mouth opening disappeared: ' + key)
            row['sizes'][variant] = {'closedExactRgba': True, 'openAlphaExact': True, 'changedRgbPixels': changed}
            opened.save(output / f'{key}-{variant}-open.png')
        selected[key], proof[key], checks[key] = reg, evidence, row
        return reg

    walks, bridges = {}, {}
    for direction in ORDER:
        for section, length, field_key, destination in [('walk', 16, 'walkFields', walks), ('bridge', 5, 'bridgeFields', bridges)]:
            records = body['directions'][direction][field_key]
            if len(records) != length:
                raise ValueError('Missing full source fields')
            destination[direction] = []
            for index, record in enumerate(records):
                filename = f'{direction}-{section}-{index:02}.png' if section == 'walk' else f'{direction}-bridge-{index}.png'
                rel = 'working/' + filename
                paths = {v: folder / f'physical/{direction}-{section}-{index:02}-{v}.png' for v in ('desktop', 'mobile')}
                destination[direction].append(add(f'{direction}-{section}-{index:02}', direction, folder / rel,
                     body['workingHashes'][rel], record, paths))
    turns = []
    for index, record in enumerate(body['turns']):
        paths = {v: folder / f'physical/turn-{index}-{v}.png' for v in ('desktop', 'mobile')}
        turns.append(add(f'turn-{index}', record['heading'], folder / record['file'], record['sha256'], record, paths))
    if len(turns) != 8 or len(selected) != 92 or sum(x is not None for x in selected.values()) != 68:
        raise ValueError('Wrong walk/bridge/turn lip coverage')
    # The separately checked actual gesture source has an unchanged own head.
    gesture_path = ROOT / 'output/ambient-city-animation/renate-termin-moving-mouths-v1/gesture/gesture-mouths.json'
    check(gesture_path, 'a1c215bc934e05c676fdb8f641de30b65a9f3070b0f7b590abf99661c3ffde2e')
    gesture = json.loads(gesture_path.read_text(encoding='utf8'))
    for rel, digest in gesture['inputFiles'].items():
        check(ROOT / rel, digest)
    if len(gesture['registrations']) != 16 or any(r != turns[0] for r in gesture['registrations']):
        raise ValueError('Gesture registration is not the same own neutral head')
    stops = []
    if stop_path is not None:
        if stop_sha is None:
            raise ValueError('A stop receipt requires its exact SHA')
        check(stop_path, stop_sha)
        stop = json.loads(stop_path.read_text(encoding='utf8'))
        for rel, digest in stop['inputHashes'].items():
            check(ROOT / rel, digest)
        if stop['walkReceiptSha256'] != body_sha or len(stop['records']) != 64:
            raise ValueError('Stops do not bind this exact own walking source')
        for index, record in enumerate(stop['records']):
            direction, phase = ORDER[index // 16], index % 16
            if record['direction'] != direction or record['phase'] != phase or len(record['frames']) != 4:
                raise ValueError('Stop phase/direction ordering changed')
            for stage, frame in enumerate(record['frames']):
                paths = {v: stop_path.parent / frame['physical'][v]['file'] for v in ('desktop', 'mobile')}
                pins = {v: frame['physical'][v]['sha256'] for v in ('desktop', 'mobile')}
                stops.append(add(f'{direction}-stop-{phase:02}-{stage}', direction,
                    stop_path.parent / frame['file'], frame['sha256'], frame, paths, pins))
        if len(stops) != 256:
            raise ValueError('Missing own phase stops')
    all_regs = [*sum(walks.values(), []), *sum(bridges.values(), []), *turns, *stops, *gesture['registrations']]
    expected = (364, 276, 88) if stops else (108, 84, 24)
    actual = (len(all_regs), sum(r is not None for r in all_regs), sum(r is None for r in all_regs))
    if actual != expected:
        raise ValueError('Wrong total lip coverage: ' + str(actual))
    for rel, digest in inputs.items():
        if sha(ROOT / rel) != digest:
            raise ValueError('Source changed during mouth transport: ' + rel)
    result = {'schemaVersion': 1, 'id': 'stadt-renate-termin', 'cell': [128, 160],
              'status': 'SOURCE/CPU actual-field mouth candidate; no shader/media/runtime approval',
              'selection': dict(zip(['selectedCells', 'visible', 'null'], actual)),
              'standing': deepcopy(compiled['registrations']['standing']),
              'walks': walks, 'bridges': bridges, 'turns': turns, 'stops': stops,
              'gesture': gesture['registrations'], 'inputFiles': inputs,
              'driverSha256': sha(Path(__file__)), 'transportProof': proof, 'checks': checks}
    # Original standing is a direct128x160 fit, not scaled registered paint.
    result['standing'] = {k: result['standing'][k] for k in ('rect', 'axes', 'profile')}
    path = output / 'mouth-moving-v1.json'
    path.write_text(json.dumps(result, indent=2, allow_nan=False) + '\n', encoding='utf8')
    print(json.dumps({'receiptSha256': sha(path), 'selection': result['selection'],
                      'maximumAffineResidualWorkingPx': max(p['maximumAffineResidualWorkingPx'] for p in proof.values())}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--body', type=Path, required=True)
    parser.add_argument('--body-sha', required=True)
    parser.add_argument('--stops', type=Path)
    parser.add_argument('--stops-sha')
    parser.add_argument('--outdir', type=Path, required=True)
    args = parser.parse_args()
    build(args.body.resolve(), args.body_sha, args.outdir.resolve(),
          args.stops.resolve() if args.stops else None, args.stops_sha)
