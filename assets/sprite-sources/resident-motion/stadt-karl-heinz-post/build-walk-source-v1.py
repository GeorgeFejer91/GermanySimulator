"""Export Karl's own walk, bridge and quarter-turn source candidate.

The standing registration is logical 128x160, figure 136, pivot (64,150).
Each physical variant directly samples working512 paint with uniform scale.
No runtime manifest, stride distance, stop or mouth is emitted here.
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
CONFIG = HERE / 'walk-source-config-v1.json'
DEFAULT_OUT = ROOT / 'output/ambient-city-animation/karl-post-walk-source-v1'
BUILDER = ROOT / 'tools/build-resident-motion.py'
SOURCE_ID = 'stadt-karl-heinz-post'
ACTOR_ID = 'city-karl-heinz-post'
ORDER = ('down', 'right', 'up', 'left')
THEMES = {'light': '#eee8db', 'dark': '#25272b'}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def native(value):
    if hasattr(value, 'item'):
        return value.item()
    if isinstance(value, dict):
        return {key: native(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [native(item) for item in value]
    return value


def rms(a: Image.Image, b: Image.Image) -> float:
    left = np.asarray(a).astype(np.float32)
    right = np.asarray(b).astype(np.float32)
    union = (left[:, :, 3] > 20) | (right[:, :, 3] > 20)
    return float(np.sqrt(np.mean((left[union] - right[union]) ** 2)))


def validate_config():
    cfg = json.loads(CONFIG.read_text(encoding='utf8'))
    if cfg['schemaVersion'] != 1 or cfg['status'] != 'candidate-unapproved':
        raise ValueError('Unexpected Karl source config version/status')
    if cfg['sourceFit']['path'] != 'assets/sprite-sources/resident-motion/stadt-karl-heinz-post/source-fit-v3.json':
        raise ValueError('Karl V3 source fit path changed')
    fit_path = ROOT / cfg['sourceFit']['path']
    if sha(fit_path) != cfg['sourceFit']['sha256']:
        raise ValueError('Accepted Karl V3 source fit changed')
    if sha(ROOT / cfg['turnSourcesFrom']['path']) != cfg['turnSourcesFrom']['sha256AtSnapshot']:
        raise ValueError('Historical own quarter-turn source registration changed')
    fit = json.loads(fit_path.read_text(encoding='utf8'))
    contract = {'standingFigureWorldHeight': 1.6, 'standingPivot': [64, 150],
                'standingFigureHeight': 136, 'distancePerCycle': 'unmeasured'}
    if fit['worldContract'] != contract or fit['working'] != {'canvas': [512, 512], 'baselineY': 472, 'figureHeight': 400}:
        raise ValueError('Karl standing/working registration changed')
    if fit['person']['actorId'] != ACTOR_ID or set(fit['person']['views']) != set(ORDER):
        raise ValueError('Karl own four-view source changed')
    if cfg['layout'] != {'grid': [16, 9], 'walkRows': list(ORDER),
                          'bridgeRows': list(ORDER), 'turnRow': 8}:
        raise ValueError('Walk/bridge/turn cell order changed')
    expected_variants = {'desktop': {'cell': [96, 120], 'figureHeight': 102, 'pivot': [48, 112.5]},
                         'mobile': {'cell': [64, 80], 'figureHeight': 68, 'pivot': [32, 75]}}
    if cfg['variants'] != expected_variants:
        raise ValueError('Physical variant scale/pivot changed')
    turns = cfg['turn_sources']
    own_sheet = 'assets/sprite-sources/resident-motion/stadt-karl-heinz-post/turns-and-leg-components-candidate.png'
    own_sha = fit['person']['views']['right']['leg_sources'][0]['sourceSha256']
    if len(turns) != 8 or [entry.get('neutral') for entry in turns[::2]] != list(ORDER):
        raise ValueError('Own eight-heading turn order changed')
    for entry in turns[1::2]:
        if (entry.get('source'), entry.get('sourceSha256')) != (own_sheet, own_sha):
            raise ValueError('Foreign or changed quarter-turn paint')
        if not entry.get('component_bounds') or not entry.get('source_pivot') or not entry.get('scale'):
            raise ValueError('Incomplete own quarter-turn registration')
    if sha(ROOT / own_sheet) != own_sha:
        raise ValueError('Karl own quarter/leg sheet changed')
    return cfg, fit


def load_builder():
    spec = importlib.util.spec_from_file_location('karl_walk_builder', BUILDER)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def board(street, frames, path: Path, columns: int, theme: str, enlarged: int = 1):
    street.opaque_board(frames, columns, THEMES[theme], enlarged).save(path)


def component_count(frame: Image.Image) -> int:
    groups, _ = label(np.asarray(frame)[:, :, 3] >= 128)
    return sum(size >= 100 for size in np.bincount(groups.ravel())[1:])


def build(outdir: Path):
    cfg, fit = validate_config()
    config_hash, fit_hash, driver_hash = sha(CONFIG), sha(ROOT / cfg['sourceFit']['path']), sha(Path(__file__))
    builder = load_builder()
    person = fit['person'].copy()
    person['turn_sources'] = cfg['turn_sources']
    bindings = builder.source_bindings(person)
    outdir = outdir.resolve()
    working_dir = outdir / 'working'
    working_dir.mkdir(parents=True, exist_ok=True)
    cells, walks, bridges, neutrals, fields = {}, {}, {}, {}, {}
    working_hashes = {}
    for row, direction in enumerate(ORDER):
        registered, _, _ = builder.registered(person, direction)
        registered_path = working_dir / f'{direction}-registered.png'
        registered.save(registered_path)
        sequence, records = builder.motion(person, direction, count=16)
        if len(sequence) != 16 or len(records) != 16 or len({frame.tobytes() for frame in sequence}) != 16:
            raise ValueError('Incomplete/distinct own 16-phase walk: ' + direction)
        fields[direction] = native(records)
        walks[direction] = {'row': row, 'frames': 16, 'frame_ms': 60, 'loop': True,
                            'registeredSha256': sha(registered_path),
                            'registeredBounds': registered.getbbox(),
                            'sourceBounds': [frame.getbbox() for frame in sequence],
                            'adjacentRms': [rms(sequence[i], sequence[(i+1) % 16]) for i in range(16)],
                            'sourceBaselineY': 472}
        working_hashes[direction + '-walk'] = []
        for col, frame in enumerate(sequence):
            cells[row, col] = frame
            path = working_dir / f'{direction}-walk-{col:02}.png'
            frame.save(path)
            working_hashes[direction + '-walk'].append(sha(path))
        neutral = builder.neutral(person, direction)
        neutral_path = working_dir / f'{direction}-neutral.png'
        neutral.save(neutral_path)
        bridge = builder.bridge_frames(person, direction)
        if len(bridge) != 5 or bridge[2].tobytes() != neutral.tobytes():
            raise ValueError('Karl bridge/neutral anchor mismatch: ' + direction)
        working_hashes[direction + '-bridge'] = []
        for col, frame in enumerate(bridge):
            cells[row + 4, col] = frame
            path = working_dir / f'{direction}-bridge-{col}.png'
            frame.save(path)
            working_hashes[direction + '-bridge'].append(sha(path))
        bridges[direction] = {'row': row + 4, 'stop_cols': [0, 1, 2],
                              'start_cols': [3, 4], 'frame_ms': 70,
                              'sourceBounds': [frame.getbbox() for frame in bridge]}
        neutrals[direction] = {'sourceSha256': sha(neutral_path)}
        for theme in THEMES:
            board(builder.street, sequence, outdir / f'{direction}-working-{theme}.png', 8, theme)
            board(builder.street, bridge, outdir / f'{direction}-bridge-working-{theme}.png', 5, theme)
        print('Karl source walk/bridge: ' + direction, flush=True)
    turns = []
    for col, entry in enumerate(cfg['turn_sources']):
        if 'neutral' in entry:
            direction = entry['neutral']
            frame = Image.open(working_dir / f'{direction}-neutral.png').convert('RGBA')
            neutrals[direction].update(row=8, col=col)
        else:
            path = ROOT / entry['source']
            if sha(path) != entry['sourceSha256']:
                raise ValueError('Changed own quarter turn')
            frame, _ = builder.street.register_source(Image.open(path).convert('RGBA'),
                                                       entry, entry['scale'], 472)
        if frame.size != (512, 512) or component_count(frame) != 1:
            raise ValueError('Invalid own quarter-turn source: ' + str(col))
        cells[8, col] = frame
        path = working_dir / f'turn-{col}.png'
        frame.save(path)
        turns.append({'col': col, 'sourceSha256': sha(path), 'sourceBounds': frame.getbbox(),
                      'heading': entry.get('neutral', ('front-right', 'rear-right', 'rear-left', 'front-left')[(col-1)//2])})
    if len(cells) != 92 or any('row' not in record for record in neutrals.values()):
        raise ValueError('Missing Karl walk, bridge or turn cells')
    for theme in THEMES:
        board(builder.street, [cells[8, col] for col in range(8)],
              outdir / f'turns-working-{theme}.png', 4, theme)
    variants = {}
    for name, physical in cfg['variants'].items():
        w, h = physical['cell']
        spec = {'cell': [w, h], 'figureHeight': physical['figureHeight'],
                'pivot': physical['pivot'],
                'working': {'figureHeight': 400, 'baseline': 472}}
        if physical['figureHeight'] / 400 != (102 / 400 if name == 'desktop' else 68 / 400):
            raise ValueError('Nonuniform/changed source-to-cell figure scale')
        atlas = Image.new('RGBA', (w * 16, h * 9))
        exported, bounds, gutters = {}, {}, []
        for position, frame in cells.items():
            if frame.size != (512, 512) or component_count(frame) != 1:
                raise ValueError('Invalid own 512 source cell: ' + str(position))
            cell = builder.street.export_cell(frame, spec)
            box = cell.getchannel('A').getbbox()
            if cell.size != (w, h) or box is None:
                raise ValueError('Missing exported own paint: ' + str(position))
            gutter = min(box[0], box[1], w - box[2], h - box[3])
            if gutter < 2:
                raise ValueError('Insufficient transparent cell gutter: ' + str(position))
            exported[position], bounds[position] = cell, box
            gutters.append(gutter)
            atlas.paste(cell, (position[1] * w, position[0] * h))
        path = outdir / f'walk-source-{name}.webp'
        atlas.save(path, lossless=True, exact=True, method=4)
        decoded = Image.open(path).convert('RGBA')
        if decoded.tobytes() != atlas.tobytes():
            raise ValueError('Lossless encoded Karl source pixels changed')
        for row in range(9):
            for col in range(16):
                tile = decoded.crop((col*w, row*h, (col+1)*w, (row+1)*h))
                if (row, col) in exported:
                    if tile.tobytes() != exported[row, col].tobytes():
                        raise ValueError('Decoded Karl cell/atlas mismatch')
                elif tile.getchannel('A').getbbox() is not None:
                    raise ValueError('Paint in an unused Karl cell')
        for row, direction in enumerate(ORDER):
            for theme in THEMES:
                board(builder.street, [exported[row, col] for col in range(16)],
                      outdir / f'{direction}-{name}-{theme}.png', 8, theme,
                      3 if name == 'desktop' else 4)
                board(builder.street, [exported[row+4, col] for col in range(5)],
                      outdir / f'{direction}-bridge-{name}-{theme}.png', 5, theme,
                      3 if name == 'desktop' else 4)
        for theme in THEMES:
            board(builder.street, [exported[8, col] for col in range(8)],
                  outdir / f'turns-{name}-{theme}.png', 4, theme,
                  3 if name == 'desktop' else 4)
        variants[name] = {'file': path.name, 'sha256': sha(path), 'frame_size': [w, h],
                          'figureHeight': physical['figureHeight'], 'pivot': physical['pivot'],
                          'image_size': list(atlas.size), 'minimumGutter': min(gutters),
                          'decodedBytes': atlas.width * atlas.height * 4,
                          'directWorkingSampling': True,
                          'boundsByCell': {f'{row},{col}': box for (row, col), box in bounds.items()}}
    if config_hash != sha(CONFIG) or fit_hash != sha(ROOT / cfg['sourceFit']['path']) or driver_hash != sha(Path(__file__)):
        raise ValueError('Karl source recipe changed during bake')
    if bindings != builder.source_bindings(person):
        raise ValueError('Karl bound source paint changed during bake')
    result = {'status': 'held full Karl source candidate; independent encoded/source review pending',
              'id': SOURCE_ID, 'cell': [128, 160], 'pivot': [64, 150],
              'figureHeight': 136, 'figureWorldHeight': 1.6,
              'grid': [16, 9], 'selectedCells': 92, 'walks': walks, 'bridges': bridges,
              'neutrals': neutrals, 'turns': {'row': 8, 'count': 8, 'sources': turns},
              'sourceBindings': bindings, 'configSha256': config_hash,
              'sourceFitSha256': fit_hash, 'driverSha256': driver_hash,
              'limbFields': fields, 'workingHashes': working_hashes,
              'variants': variants,
              'limitations': ['Cycle distance and planted foot/world-contact still uncalibrated.',
                              'Stops, gesture, mouths, shader and runtime acceptance are separate.']}
    receipt = outdir / 'walk-source.json'
    receipt.write_text(json.dumps(result, indent=2) + '\n', encoding='utf8')
    print(json.dumps({'status': result['status'], 'selectedCells': 92,
                      'desktop': variants['desktop']['sha256'],
                      'mobile': variants['mobile']['sha256']}), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--outdir', type=Path, default=DEFAULT_OUT)
    parser.add_argument('--check-inputs', action='store_true', help='Pin and validate configuration without rendering')
    args = parser.parse_args()
    if args.check_inputs:
        cfg, fit = validate_config()
        builder = load_builder()
        person = fit['person'].copy()
        person['turn_sources'] = cfg['turn_sources']
        print(json.dumps({'status': 'input-pins-pass', 'bindings': builder.source_bindings(person)}))
    else:
        build(args.outdir)
