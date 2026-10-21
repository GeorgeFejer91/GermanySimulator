"""Compile speech registration for all16 accepted Renate free-hand poses.

Verify actual working and direct paint99/66 pixels, rather than presuming a
mesh's head is stationary. No runtime manifest or other family is modified.
"""
from pathlib import Path
import hashlib
import importlib.util
import json

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
BODY = ROOT / 'output/ambient-city-animation/renate-termin-gesture-full16-v1'
REVIEW = ROOT / 'output/ambient-city-animation/renate-termin-source-review-v1/gesture-full16-review/receipt.json'
OUT = ROOT / 'output/ambient-city-animation/renate-termin-moving-mouths-v1/gesture'
IDENTITY = {'sourceSize': [512, 512], 'nodes_y': [0, 511], 'dx': [0, 0], 'dy': [0, 0]}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    inputs = {}

    def check(path, expected=None):
        digest = sha(path)
        if expected is not None and digest != expected:
            raise ValueError('Changed own inspected source: ' + str(path))
        inputs[path.relative_to(ROOT).as_posix()] = digest

    check(BODY / 'gesture-source.json', '51be06cd62b986e7063f2ee58b74076f1ff5df94d1e13c7abcb66fbdc0e19c03')
    check(HERE / 'profiles.json', '05310853e71aa8b5ebda87598c67af370824184a107acb9c19f8acd2f5122370')
    check(HERE / 'compiled.json', '3e69e32180b6ec78eb3f2757ce981baa4b478586c29e8cf3b7c569ab4eb1671f')
    check(REVIEW)
    for rel, digest in json.loads(REVIEW.read_text())['candidatePins'].items():
        check(ROOT / rel, digest)
    for path in [Path(__file__), HERE / 'transport-fields-v1.py', ROOT / 'tools/build-street-mouths.py',
                 ROOT / 'tools/build-street-character-sprites.py']:
        check(path)
    body = json.loads((BODY / 'gesture-source.json').read_text())
    profiles = json.loads((HERE / 'profiles.json').read_text())
    compiled = json.loads((HERE / 'compiled.json').read_text())
    entry = profiles['registrations']['down']
    check(ROOT / entry['input']['file'], entry['input']['sha256'])
    neutral = Image.open(ROOT / entry['input']['file']).convert('RGBA')
    transport = load('renate_gesture_lip_transport', HERE / 'transport-fields-v1.py')
    mouths = load('renate_gesture_cpu_mouths', ROOT / 'tools/build-street-mouths.py')
    street = load('renate_gesture_export', ROOT / 'tools/build-street-character-sprites.py')
    reg, moved, proof = transport.transport(entry, compiled['registrations']['down'], IDENTITY)
    if max(point[1] for contour in moved['contoursPx'].values() for point in contour) >= 250:
        raise ValueError('Mouth leaves the head protected by actual gesture')
    OUT.mkdir(parents=True, exist_ok=True)
    checks, registrations = [], []
    for index in range(16):
        record = body['fields'][index]
        if record['index'] != index or record['timeMs'] != index * 80:
            raise ValueError('Gesture sequence order changed')
        path = BODY / record['working']
        check(path, body['files'][path.name])
        frame = Image.open(path).convert('RGBA')
        if not np.array_equal(np.asarray(frame)[:250], np.asarray(neutral)[:250]):
            raise ValueError('Gesture head paint moved: ' + str(index))
        row = {'index': index, 'timeMs': index * 80, 'workingHeadExact': True, 'sizes': {}}
        for name, cell, pivot, figure in [('working', [512, 512], [256, 472], 400),
                ('desktop', [96, 120], [48, 112.5], 99), ('mobile', [64, 80], [32, 75], 66)]:
            spec = {'cell': cell, 'pivot': pivot, 'figureHeight': figure,
                    'working': {'figureHeight': 400, 'baseline': 472}}
            if name == 'working':
                image, source_path = frame, path
            else:
                source_path = BODY / body['variants'][name]['files'][index]
                check(source_path, body['files'][source_path.name])
                image = Image.open(source_path).convert('RGBA')
                if image.tobytes() != street.export_cell(frame, spec).tobytes():
                    raise ValueError('Encoded direct paint differs: ' + name)
                cutoff = int(pivot[1] + (245 - 472) * figure / 400)
                if not np.array_equal(np.asarray(image)[:cutoff], np.asarray(street.export_cell(neutral, spec))[:cutoff]):
                    raise ValueError('Encoded gesture head changed: ' + name)
            scale = figure / 400
            origin = np.asarray(pivot) - np.asarray([256, 472]) * scale
            direct = {**moved, 'input': {'file': source_path.relative_to(ROOT).as_posix(),
                      'sha256': sha(source_path), 'dimensions': cell}, 'cell': cell,
                      'centerPx': (np.asarray(moved['centerPx']) * scale + origin).tolist(),
                      'axesPx': (np.asarray(moved['axesPx']) * scale).tolist(),
                      'contoursPx': {k: (np.asarray(v) * scale + origin).tolist() for k, v in moved['contoursPx'].items()}}
            closed, opened = mouths.preview(direct, reg, 0), mouths.preview(direct, reg, 1)
            if closed.tobytes() != image.tobytes() or opened.getchannel('A').tobytes() != image.getchannel('A').tobytes():
                raise ValueError('Closed RGBA or open alpha changed')
            changed = int(np.count_nonzero(np.any(np.asarray(opened)[:, :, :3] != np.asarray(image)[:, :, :3], axis=2)))
            if changed == 0:
                raise ValueError('Own gesture mouth opening vanished')
            row['sizes'][name] = {'closedExactRgba': True, 'openAlphaExact': True, 'changedRgbPixels': changed}
            opened.save(OUT / f'{name}-open-{index:02}.png')
        checks.append(row)
        registrations.append(reg)
    for rel, digest in inputs.items():
        if sha(ROOT / rel) != digest:
            raise ValueError('Input changed during compile: ' + rel)
    result = {'id': 'stadt-renate-termin', 'status': 'SOURCE/CPU gesture mouths only; GPU/native not run',
              'cell': [128, 160], 'frameCount': 16, 'frameMs': 80, 'inputFiles': inputs,
              'upperField': IDENTITY, 'transportProof': proof, 'registrations': registrations,
              'checks': checks, 'limitations': ['Scalar CPU preview only', 'No actual media or GPU/readability approval']}
    path = OUT / 'gesture-mouths.json'
    path.write_text(json.dumps(result, indent=2) + '\n', encoding='utf8')
    print(json.dumps({'receiptSha256': sha(path), 'frames': 16, 'sourceAndDirectChecks': 48,
                      'minimumChangedRgbPixels': min(s['changedRgbPixels'] for c in checks for s in c['sizes'].values())}))


if __name__ == '__main__':
    main()
