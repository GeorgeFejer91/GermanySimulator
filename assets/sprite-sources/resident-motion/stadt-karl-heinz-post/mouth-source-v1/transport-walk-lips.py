"""Transport Karl's inspected lips through captured, exact-replayed walk fields.

The shader stores tangent XY followed by normal XY. A dense support-grid check
bounds the affine frame approximation for the front's nonuniform head sway.
This is source correspondence evidence, not shader or runtime acceptance.
"""
from pathlib import Path
import argparse
import copy
import hashlib
import json

import numpy as np
from scipy.interpolate import PchipInterpolator

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
FIELDS = ROOT / 'output/ambient-city-animation/karl-post-mouth-fields-v1/walk-fields.json'
OUT = ROOT / 'output/ambient-city-animation/karl-post-moving-mouths-v1/walk-mouths.json'
ORDER = ('down', 'right', 'up', 'left')
TURNS = ('down', 'front-right', 'right', 'rear-right', 'up', 'rear-left', 'left', 'front-left')
SCALE = 136 / 400
MAX_RESIDUAL_WORKING_PX = .1


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def logical(points):
    return (np.asarray(points) - [256, 472])*SCALE + [64, 150]


def mapper(record, expected_source):
    field = record['actualUpperWarp']
    source = ROOT / field['sourceFile']['file']
    if sha(source) != field['sourceFile']['sha256'] or field['sourceRgbaSha256'] != expected_source:
        raise ValueError('Captured upper source changed')
    ys, dx, dy = (np.asarray(field[key], float) for key in ('nodes_y', 'dx', 'dy'))
    if (field['sourceSize'] != [512, 512] or len(ys) not in (2, 3, 4)
            or len(dx) != len(ys) or len(dy) != len(ys)
            or not np.all(np.isfinite([*ys, *dx, *dy]))
            or not np.all(np.diff(ys) > 0) or ys[0] != 0 or ys[-1] != 511):
        raise ValueError('Invalid captured upper controls')
    if record['mode'] == 'identity-source-copy':
        return lambda points: np.asarray(points, float)
    if record['mode'] not in ('actual-animate-upper-warp', 'actual-original-upper-warp'):
        raise ValueError('Unknown captured source correspondence')
    x_field, y_field = PchipInterpolator(ys, dx), PchipInterpolator(ys, dy)

    def mapped(points):
        points = np.asarray(points, float)
        return points + np.stack([x_field(points[:, 1]), y_field(points[:, 1])], axis=1)
    return mapped


def transport(entry, source_cell, mapped):
    center = np.asarray(entry['centerPx']) - entry['cellOriginPx']
    # Source recipe and GLSL mat2 both use column vectors, tangent then normal.
    axes = np.asarray(entry['axesPx'], float).reshape(2, 2).T
    anchors = np.vstack([center, center+axes[:, 0], center+axes[:, 1]])
    moved = mapped(anchors)
    moved_axes = (moved[1:] - moved[0]).T
    if np.linalg.det(moved_axes) <= 0:
        raise ValueError('Folded lip frame')
    xx, yy = np.meshgrid(np.linspace(-2, 2, 33), np.linspace(-1.6, 3, 33))
    local = np.column_stack([xx.ravel(), yy.ravel()])
    support = center + local @ axes.T
    actual = mapped(support)
    approximation = moved[0] + local @ moved_axes.T
    residual = float(np.max(np.linalg.norm(actual-approximation, axis=1)))
    if residual > MAX_RESIDUAL_WORKING_PX:
        raise ValueError(f'Head field needs richer correspondence; residual {residual}')
    destination = logical(moved[0])
    tangent, normal = (moved_axes*SCALE).T
    result = {'rect': [float(destination[0]/128), float(1-destination[1]/160),
                       float(np.linalg.norm(tangent)/128), float(np.linalg.norm(normal)/160)],
              'axes': [float(tangent[0]), float(tangent[1]), float(normal[0]), float(normal[1])],
              'profile': copy.deepcopy(source_cell['profile'])}
    # Independently reconstruct the shader's column frame from serialized XY
    # pairs. This rejects the row/column transpose on tilted painted mouths.
    serialized = np.asarray(result['axes']).reshape(2, 2).T
    if not np.allclose(serialized, moved_axes*SCALE, rtol=0, atol=1e-12):
        raise ValueError('Serialized shader axes changed the transported frame')
    curves = np.concatenate([np.asarray(points)-entry['cellOriginPx']
                             for points in entry['contoursPx'].values()])
    proof = {'sourceAnchors': anchors.tolist(), 'movedAnchors': moved.tolist(),
             'logicalAnchors': logical(moved).tolist(),
             'movedContours': mapped(curves).tolist(),
             'shaderSupportGrid': [33, 33], 'maximumAffineResidualWorkingPx': residual}
    return result, proof


def build(fields_path, out):
    fields = json.loads(fields_path.read_text())
    profiles_path = HERE / 'source-mouth-profiles-v1.json'
    profiles = json.loads(profiles_path.read_text())
    if fields['id'] != 'stadt-karl-heinz-post' or fields['verifiedSelectedCells'] != 92:
        raise ValueError('Wrong or incomplete body correspondence')
    for item in fields['inputs']:
        if sha(ROOT/item['file']) != item['sha256']:
            raise ValueError('Body capture input changed: ' + item['file'])
    if sha(ROOT/fields['driver']['file']) != fields['driver']['sha256']:
        raise ValueError('Body capture recipe changed')
    for name, digest in profiles['inputHashes'].items():
        if sha(ROOT/name) != digest:
            raise ValueError('Inspected mouth input changed: ' + name)
    cells, proofs = {}, {}

    def add(row, col, name, record=None):
        key = f'{row},{col}'
        if profiles['registrations'][name] is None:
            if record:
                mapper(record, fields['upperSourceRgbaSha256'][name])
            cells[key] = None
            return
        mapped = mapper(record, fields['upperSourceRgbaSha256'][name]) if record else lambda p: np.asarray(p, float)
        cells[key], proofs[key] = transport(profiles['registrations'][name], profiles['compiledSourceCells'][name], mapped)

    for row, name in enumerate(ORDER):
        walk, bridge = fields['walks'][name], fields['bridges'][name]
        if walk['row'] != row or len(walk['records']) != 16 or bridge['row'] != row+4 or len(bridge['records']) != 5:
            raise ValueError('Captured walk/bridge order changed')
        for col, record in enumerate(walk['records']):
            if record['index'] != col:
                raise ValueError('Walk phase changed')
            add(row, col, name, record)
        for col, record in enumerate(bridge['records']):
            if record['index'] != col:
                raise ValueError('Bridge phase changed')
            add(row+4, col, name, record)
    for col, name in enumerate(TURNS):
        neutral = fields['neutrals'].get(name)
        add(8, col, name, neutral['record'] if neutral else None)
        if neutral and cells[f'8,{col}'] != cells[f'{ORDER.index(name)+4},2']:
            raise ValueError('Neutral/bridge mouth anchor mismatch')
    if len(cells) != 92 or sum(value is None for value in cells.values()) != 24:
        raise ValueError('Incomplete selected mouth coverage')
    result = {'schemaVersion': 1, 'id': fields['id'],
              'status': 'held source-field transport only; GPU and runtime unrun',
              'cell': [128, 160], 'grid': [16, 9], 'selected': cells,
              'visible': 68, 'null': 24, 'transportProof': proofs,
              'maximumAffineResidualWorkingPx': max(p['maximumAffineResidualWorkingPx'] for p in proofs.values()),
              'maximumAllowedAffineResidualWorkingPx': MAX_RESIDUAL_WORKING_PX,
              'inputs': [{'file': path.relative_to(ROOT).as_posix(), 'sha256': sha(path)}
                         for path in (fields_path, profiles_path)],
              'driverSha256': sha(Path(__file__)),
              'limitations': ['No stop/gesture coverage; no GPU, native media, rendered or floor acceptance.']}
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2, allow_nan=False)+'\n', encoding='utf8')
    print(json.dumps({'status': result['status'], 'visible': 68, 'null': 24,
                      'maximumAffineResidualWorkingPx': result['maximumAffineResidualWorkingPx'],
                      'sha256': sha(out)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fields', type=Path, default=FIELDS)
    parser.add_argument('--out', type=Path, default=OUT)
    args = parser.parse_args()
    build(args.fields.resolve(), args.out.resolve())
