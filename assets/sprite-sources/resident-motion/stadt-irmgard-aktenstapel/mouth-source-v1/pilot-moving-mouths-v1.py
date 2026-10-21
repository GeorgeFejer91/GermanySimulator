"""Capture 24 selected Irmgard cells and transport her own neutral lip fits.

Uses the accepted resident exporter and its actual painted upper warp. This is
source evidence only; no atlas, shared renderer, runtime, or standing edit.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.interpolate import PchipInterpolator

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
BODY = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-walk-source-v1'
OUT = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-moving-mouth-pilot-v1'
DRIVER = HERE.parent / 'build-walk-source-v1.py'
PROFILES = HERE / 'source-mouth-profiles-v1.json'
HELPER = ROOT / 'tools/build-street-mouths.py'
ORDER = ('down', 'right', 'up', 'left')
TURNS = ('down', 'front-right', 'right', 'rear-right', 'up', 'rear-left', 'left', 'front-left')
PHASES = (0, 4, 8, 12)
SCALE = 136 / 400
MAX_RESIDUAL = .1
BODY_SHA = '98e7f1a541ca231dab39bd64f11273e5736124954a4c921ea94f613103029e7b'
PROFILES_SHA = 'e4d941443f3148ae7c7d16dab5c78e340724453083a43820c8522a3a1528d990'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def reference(path):
    return {'file': Path(path).relative_to(ROOT).as_posix(), 'sha256': sha(path)}


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def logical(points):
    return (np.asarray(points, float) - [256, 472]) * SCALE + [64, 150]


def mapper(field):
    ys, dx, dy = (np.asarray(field[key], float) for key in ('nodes_y', 'dx', 'dy'))
    if (field['sourceSize'] != [512, 512] or len(ys) not in (2, 3, 4)
            or len(dx) != len(ys) or len(dy) != len(ys)
            or ys[0] != 0 or ys[-1] != 511 or not np.all(np.diff(ys) > 0)
            or not np.all(np.isfinite([*ys, *dx, *dy]))):
        raise ValueError('Invalid actual upper field')
    fx, fy = PchipInterpolator(ys, dx), PchipInterpolator(ys, dy)

    def mapped(points):
        points = np.asarray(points, float)
        return points + np.stack([fx(points[:, 1]), fy(points[:, 1])], axis=1)

    return mapped


def transport(entry, compiled, field):
    mapped = mapper(field)
    center = np.asarray(entry['centerPx']) - entry['cellOriginPx']
    # The existing GLSL mat2 consumes tangent XY, then normal XY as columns.
    axes = np.asarray(entry['axesPx'], float).reshape(2, 2).T
    anchors = np.vstack([center, center + axes[:, 0], center + axes[:, 1]])
    moved = mapped(anchors)
    moved_axes = (moved[1:] - moved[0]).T
    if np.linalg.det(moved_axes) <= 0:
        raise ValueError('Folded own lip frame')
    xx, yy = np.meshgrid(np.linspace(-2, 2, 33), np.linspace(-1.6, 3, 33))
    local = np.column_stack([xx.ravel(), yy.ravel()])
    support = center + local @ axes.T
    residual = float(np.max(np.linalg.norm(mapped(support) - (moved[0] + local @ moved_axes.T), axis=1)))
    if residual > MAX_RESIDUAL:
        raise ValueError(f'Lip support not affine enough: {residual}')
    destination = logical(moved[0])
    tangent, normal = (moved_axes * SCALE).T
    serialized = np.asarray([tangent[0], tangent[1], normal[0], normal[1]]).reshape(2, 2).T
    if not np.allclose(serialized, moved_axes * SCALE, rtol=0, atol=1e-12):
        raise ValueError('Shader tangent/normal axis order changed')
    result = {'rect': [float(destination[0] / 128), float(1 - destination[1] / 160),
                       float(np.linalg.norm(tangent) / 128), float(np.linalg.norm(normal) / 160)],
              'axes': [float(tangent[0]), float(tangent[1]), float(normal[0]), float(normal[1])],
              'profile': compiled['profile']}
    contours = {key: (np.asarray(points, float) - entry['cellOriginPx']) for key, points in entry['contoursPx'].items()}
    moved_entry = {'centerPx': moved[0].tolist(), 'axesPx': moved_axes.T.reshape(-1).tolist(),
                   'contoursPx': {key: mapped(points).tolist() for key, points in contours.items()},
                   'cell': [512, 512], 'cellOriginPx': [0, 0], 'width': entry['width'], 'teeth': entry['teeth']}
    proof = {'sourceAnchors': anchors.tolist(), 'movedAnchors': moved.tolist(),
             'logicalAnchors': logical(moved).tolist(), 'shaderSupportGrid': [33, 33],
             'maximumAffineResidualWorkingPx': residual}
    return result, moved_entry, proof


def main():
    if sha(BODY / 'walk-source.json') != BODY_SHA or sha(PROFILES) != PROFILES_SHA:
        raise ValueError('Accepted body or reviewed mouth profile changed')
    body = json.loads((BODY / 'walk-source.json').read_text())
    profiles = json.loads(PROFILES.read_text())
    if sha(DRIVER) != body['driverSha256']:
        raise ValueError('Accepted own body driver changed')
    for rel, digest in {**body['inputHashes'], **profiles['inputHashes']}.items():
        if sha(ROOT / rel) != digest:
            raise ValueError('Pinned source changed: ' + rel)
    source = load('irmgard_body_capture', DRIVER)
    cfg, fit = source.validate_config()
    builder = source.load_builder()
    person = fit['person'].copy()
    if builder.source_bindings(person) != body['sourceBindings']:
        raise ValueError('Own source bindings changed')
    helper = load('irmgard_existing_lip_cpu', HELPER)
    atlas = {}
    for name, variant in body['variants'].items():
        path = BODY / variant['file']
        if sha(path) != variant['sha256']:
            raise ValueError('Accepted decoded atlas changed: ' + name)
        atlas[name] = Image.open(path).convert('RGBA')
    OUT.mkdir(parents=True, exist_ok=True)
    fields, selected, proofs, previews, source_checks = {}, {}, {}, {}, {}
    upper_hashes, upper_files = {}, {}

    def verify(frame, row, col, path):
        actual = Image.open(path).convert('RGBA')
        if frame.size != (512, 512) or frame.tobytes() != actual.tobytes():
            raise ValueError('Accepted working source replay differs: ' + str(path))
        for name, variant in body['variants'].items():
            w, h = variant['frame_size']
            spec = {'cell': [w, h], 'figureHeight': variant['figureHeight'],
                    'pivot': variant['pivot'], 'working': {'figureHeight': 400, 'baseline': 472}}
            encoded = builder.street.export_cell(frame, spec)
            packed = atlas[name].crop((col*w, row*h, (col+1)*w, (row+1)*h))
            if encoded.tobytes() != packed.tobytes():
                raise ValueError(f'Accepted decoded {name} source cell differs: {row},{col}')
        source_checks[f'{row},{col}'] = {'workingExactRgba': True,
                                        'decodedDesktopExactRgba': True,
                                        'decodedMobileExactRgba': True,
                                        'working': reference(path)}

    def capture(direction, run):
        calls = []
        original = builder.paint.warp_layer

        def traced(layer, ys, dx, dy):
            calls.append({'source': layer.copy(), 'sourceRgbaSha256': hashlib.sha256(layer.tobytes()).hexdigest(),
                          'sourceSize': list(layer.size), 'nodes_y': list(ys),
                          'dx': list(dx), 'dy': list(dy)})
            return original(layer, ys, dx, dy)

        builder.paint.warp_layer = traced
        try:
            frames = run()
        finally:
            builder.paint.warp_layer = original
        if len(calls) != len(frames)*3:
            raise ValueError('Actual builder upper field count changed: ' + direction)
        own = calls[-len(frames):] if person['views'][direction].get('originalUpper') else calls[2::3]
        hashes = {field['sourceRgbaSha256'] for field in own}
        if len(hashes) != 1 or (direction in upper_hashes and upper_hashes[direction] not in hashes):
            raise ValueError('Upper paint changed within own heading')
        upper_hashes[direction] = next(iter(hashes))
        if direction not in upper_files:
            path = OUT / f'actual-upper-{direction}.png'
            own[0]['source'].save(path)
            upper_files[direction] = reference(path)
            entry = profiles['registrations'][direction]
            if entry is not None:
                cx, cy = np.asarray(entry['centerPx']) - entry['cellOriginPx']
                box = (int(cx)-35, int(cy)-25, int(cx)+36, int(cy)+26)
                neutral = Image.open(BODY / 'working' / f'turn-{TURNS.index(direction)}.png').convert('RGBA')
                if own[0]['source'].crop(box).tobytes() != neutral.crop(box).tobytes():
                    raise ValueError('Actual upper lip paint differs from inspected own neutral: ' + direction)
        result = []
        for field in own:
            field.pop('source')
            field['sourceFile'] = upper_files[direction]
            result.append(source.native(field))
        return frames, result

    def add(row, col, name, frame_path, field=None):
        key = f'{row},{col}'
        frame = Image.open(frame_path).convert('RGBA')
        if profiles['registrations'][name] is None:
            if field is not None:
                mapper(field)
            selected[key] = None
            fields[key] = {'name': name, 'working': reference(frame_path), 'upper': field}
            return
        if field is None:
            # Static own quarter-turn source is copied directly by the exporter.
            field = {'sourceSize': [512, 512], 'nodes_y': [0, 511], 'dx': [0, 0], 'dy': [0, 0],
                     'sourceRgbaSha256': hashlib.sha256(frame.tobytes()).hexdigest(),
                     'sourceFile': reference(frame_path),
                     'mode': 'static-own-turn-identity'}
        elif field['sourceRgbaSha256'] != upper_hashes[name] or sha(ROOT / field['sourceFile']['file']) != field['sourceFile']['sha256']:
            raise ValueError('Captured upper source hash changed: ' + name)
        upper_image = Image.open(ROOT / field['sourceFile']['file']).convert('RGBA')
        if hashlib.sha256(upper_image.tobytes()).hexdigest() != field['sourceRgbaSha256']:
            raise ValueError('Decoded own upper source does not match captured RGBA: ' + key)
        reg, moved, proof = transport(profiles['registrations'][name], profiles['compiledSourceCells'][name], field)
        moved['input'] = {'file': frame_path.relative_to(ROOT).as_posix(), 'sha256': sha(frame_path),
                          'dimensions': [512, 512]}
        closed = helper.preview(moved, reg, 0)
        opened = helper.preview(moved, reg, 1)
        if closed.tobytes() != frame.tobytes() or opened.getchannel('A').tobytes() != frame.getchannel('A').tobytes():
            raise ValueError('Closed paint or open alpha changed: ' + key)
        a, b = np.asarray(frame), np.asarray(opened)
        changed = int(np.count_nonzero(np.any(a[:, :, :3] != b[:, :, :3], axis=2)))
        if changed == 0:
            raise ValueError('Own CPU open cue vanished: ' + key)
        selected[key], proofs[key] = reg, proof
        fields[key] = {'name': name, 'working': reference(frame_path), 'upper': field}
        previews[key] = {'closedExactRgba': True, 'openAlphaExact': True, 'openChangedRgbPixels': changed}
        opened.save(OUT / f'open-{row}-{col}.png')

    for row, direction in enumerate(ORDER):
        phases = [index*math.tau/16 for index in PHASES]
        frames, upper = capture(direction, lambda d=direction,p=phases: builder.motion(person,d,count=16,phases=p)[0])
        for index, frame, field in zip(PHASES, frames, upper):
            path = BODY / 'working' / f'{direction}-walk-{index:02}.png'
            verify(frame, row, index, path)
            add(row, index, direction, path, field)
        neutral, upper = capture(direction, lambda d=direction: [builder.neutral(person,d)])
        col = TURNS.index(direction)
        path = BODY / 'working' / f'turn-{col}.png'
        verify(neutral[0], 8, col, path)
        add(8, col, direction, path, upper[0])
    for col, name in enumerate(TURNS):
        if name in ORDER:
            continue
        path = BODY / 'working' / f'turn-{col}.png'
        frame = Image.open(path).convert('RGBA')
        verify(frame, 8, col, path)
        add(8, col, name, path)
    if len(selected) != 24 or sum(value is not None for value in selected.values()) != 17:
        raise ValueError('Incomplete 16-phase/8-turn pilot coverage')
    inputs = [BODY / 'walk-source.json', DRIVER, PROFILES, HELPER,
              HERE / 'registered-neutrals-v1.png',
              *(BODY / variant['file'] for variant in body['variants'].values())]
    result = {'schemaVersion': 1, 'id': body['id'],
              'status': 'held 24-cell own moving-mouth source pilot; no atlas/GPU/runtime admission',
              'cell': [128, 160], 'working': [512, 512], 'selected': selected,
              'visible': 17, 'null': 7, 'fields': fields, 'sourceChecks': source_checks,
              'transportProof': proofs,
              'cpuChecks': previews, 'upperSourceRgbaSha256': upper_hashes,
              'maximumAffineResidualWorkingPx': max(p['maximumAffineResidualWorkingPx'] for p in proofs.values()),
              'maximumAllowedAffineResidualWorkingPx': MAX_RESIDUAL,
              'inputs': [reference(path) for path in inputs],
              'driverSha256': sha(Path(__file__)),
              'limits': ['Only 4 walk phases per direction and 8 turns; bridges and other 48 walk phases not fitted.',
                         'No full 92-cell mouth map, stop/gesture, GPU, voice or world admission.']}
    path = OUT / 'pilot-moving-mouths.json'
    path.write_text(json.dumps(result, indent=2, allow_nan=False)+'\n', encoding='utf8')
    print(json.dumps({'receipt': reference(path), 'selected': len(selected),
                      'visible': result['visible'], 'null': result['null'],
                      'maximumAffineResidualWorkingPx': result['maximumAffineResidualWorkingPx']}))


if __name__ == '__main__':
    main()
