"""Irmgard's own four-key free-hand acknowledgement, source-only pilot."""
from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import label
from scipy.spatial import Delaunay

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
BODY = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-walk-source-v1/walk-source.json'
SOURCE = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-walk-source-v1/working/down-neutral.png'
OUT = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-gesture-pilot-v1'
EXPECTED_BODY = '98e7f1a541ca231dab39bd64f11273e5736124954a4c921ea94f613103029e7b'
EXPECTED_SOURCE = 'f4aebee3b8c84bc70671e13c0d7f188807ae97a06ce07f8c1fafcffd0d7dd5cc'
sys.path.insert(0, str(ROOT / '.agents/skills/animate-2d-characters/scripts'))
import morph_frames
import painted_walk


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def mesh():
    """Move only her painted viewer-left free sleeve/cuff/hand; file side stays fixed."""
    xs = (0, 100, 125, 140, 165, 190, 210, 220, 256, 350, 511)
    ys = (0, 200, 250, 270, 290, 310, 330, 355, 375, 390, 400, 511)
    shifts = {
        (140, 290): (-2, -2), (165, 290): (-2, -2), (190, 290): (-1, -1),
        (140, 310): (-5, -5), (165, 310): (-5, -5), (190, 310): (-2, -2),
        (140, 330): (-10, -10), (165, 330): (-10, -10), (190, 330): (-4, -4),
        (140, 355): (-12, -12), (165, 355): (-12, -12), (190, 355): (-4, -5),
        (140, 375): (-4, -4), (165, 375): (-4, -4), (190, 375): (-2, -2),
    }
    points = []
    for y in ys:
        for x in xs:
            dx, dy = shifts.get((x, y), (0, 0))
            points.append(((x, y), (x + dx, y + dy)))
    array = np.asarray(points, dtype=float)
    triangles = Delaunay(array.mean(axis=1)).simplices
    morph_frames.validate_mesh(array[:, 0], array[:, 1], triangles)
    return array[:, 0], array[:, 1], triangles


def render(neutral, source, target, triangles, amount):
    if amount == 0:
        return neutral.copy()
    coordinates, _ = morph_frames.coordinate_maps(source, target, triangles, amount, neutral.size)
    frame = painted_walk.unpack(morph_frames.sample(morph_frames.premultiplied(neutral), coordinates))
    pixels = np.asarray(frame).copy()
    original = np.asarray(neutral)
    pixels[:250] = original[:250]      # Face, hair, mouth, head and cape collar.
    pixels[390:] = original[390:]      # Skirt hem, legs, planted boots.
    pixels[:, 210:] = original[:, 210:]  # Opposite coat, anatomical-left file and grip.
    return Image.fromarray(pixels)


def build(output):
    if sha(BODY) != EXPECTED_BODY or sha(SOURCE) != EXPECTED_SOURCE:
        raise ValueError('Accepted Irmgard down source or 92-cell body receipt changed')
    receipt = json.loads(BODY.read_text(encoding='utf8'))
    if (receipt['neutrals']['down']['sourceSha256'] != EXPECTED_SOURCE or
            receipt['cell'] != [128, 160] or receipt['pivot'] != [64, 150] or
            receipt['figureHeight'] != 136 or receipt['figureWorldHeight'] != 1.6):
        raise ValueError('Irmgard accepted neutral registration changed')
    builder_path = ROOT / 'tools/build-resident-motion.py'
    spec = importlib.util.spec_from_file_location('irmgard_gesture_builder', builder_path)
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    paths = [SOURCE, BODY, builder_path,
             ROOT / '.agents/skills/animate-2d-characters/scripts/morph_frames.py',
             ROOT / '.agents/skills/animate-2d-characters/scripts/painted_walk.py',
             Path(__file__)]
    before = {path.relative_to(ROOT).as_posix(): sha(path) for path in paths}
    neutral = Image.open(SOURCE).convert('RGBA')
    if neutral.size != (512, 512):
        raise ValueError('Irmgard own neutral source is not 512 square')
    source, target, triangles = mesh()
    amounts = (0, .35, 1, 0)
    times_ms = (0, 80, 160, 240)
    output.mkdir(parents=True, exist_ok=True)
    frames, checks = [], []
    original = np.asarray(neutral)
    for index, amount in enumerate(amounts):
        frame = render(neutral, source, target, triangles, amount)
        pixels = np.asarray(frame)
        if not (np.array_equal(pixels[:250], original[:250]) and
                np.array_equal(pixels[390:], original[390:]) and
                np.array_equal(pixels[:, 210:], original[:, 210:])):
            raise ValueError('Irmgard protected head, feet or file side changed')
        groups, _ = label(pixels[:, :, 3] >= 128)
        sizes = np.bincount(groups.ravel())[1:]
        if not len(sizes) or sizes.max() / sizes.sum() < .995:
            raise ValueError('Detached Irmgard free hand or sleeve paint')
        path = output / f'working-{index:02}.png'
        frame.save(path)
        frames.append(frame)
        checks.append({'key': ('start', 'anticipation', 'peak', 'recovery')[index],
                       'index': index, 'timeMs': times_ms[index], 'amount': amount,
                       'file': path.name, 'sha256': sha(path),
                       'opaqueBodyFraction': float(sizes.max() / sizes.sum()),
                       'headExact': True, 'feetExact': True, 'fileAndGripExact': True})
    if frames[0].tobytes() != frames[-1].tobytes() or len({f.tobytes() for f in frames}) != 3:
        raise ValueError('Irmgard source anticipation/recovery sequence changed')
    variants = {}
    for name, physical in receipt['variants'].items():
        w, h = physical['frame_size']
        spec = {'cell': [w, h], 'figureHeight': physical['figureHeight'],
                'pivot': physical['pivot'], 'working': {'figureHeight': 400, 'baseline': 472}}
        cells = [builder.street.export_cell(frame, spec) for frame in frames]
        if cells[0].tobytes() != cells[-1].tobytes():
            raise ValueError('Irmgard physical gesture endpoints differ')
        gutters = []
        for index, cell in enumerate(cells):
            box = cell.getchannel('A').getbbox()
            gutters.append(min(box[0], box[1], w - box[2], h - box[3]))
            cell_path = output / f'{name}-{index:02}.png'
            cell.save(cell_path)
            if Image.open(cell_path).convert('RGBA').tobytes() != cell.tobytes():
                raise ValueError('Irmgard encoded PNG failed lossless round-trip')
        if min(gutters) < 2:
            raise ValueError('Irmgard encoded gesture lost transparent gutter')
        variants[name] = {'cell': [w, h], 'figureHeight': physical['figureHeight'],
                          'pivot': physical['pivot'], 'minimumGutter': min(gutters),
                          'files': [f'{name}-{index:02}.png' for index in range(4)],
                          'sha256': [sha(output / f'{name}-{index:02}.png') for index in range(4)],
                          'losslessDecodedExact': True}
        for theme, color in (('light', '#eee8db'), ('dark', '#25272b')):
            board = Image.new('RGBA', (w * 4, h), color)
            for index, cell in enumerate(cells):
                board.alpha_composite(cell, (index * w, 0))
            scale = 3 if name == 'desktop' else 4
            board.resize((board.width * scale, board.height * scale), Image.Resampling.NEAREST).convert('RGB').save(
                output / f'{name}-{theme}.png')
    for theme, color in (('light', '#eee8db'), ('dark', '#25272b')):
        board = Image.new('RGBA', (512 * 4, 512), color)
        for index, frame in enumerate(frames):
            board.alpha_composite(frame, (index * 512, 0))
        board.convert('RGB').save(output / f'working-{theme}.png')
    if any(sha(ROOT / key) != digest for key, digest in before.items()):
        raise ValueError('Irmgard gesture inputs changed during pilot')
    result = {'schemaVersion': 1, 'id': 'stadt-irmgard-aktenstapel',
              'status': 'held own-source four-key gesture pilot; independent source review pending',
              'action': 'subtle anatomical-right free-hand acknowledgement; file grip remains exact',
              'source': {'file': SOURCE.relative_to(ROOT).as_posix(), 'sha256': EXPECTED_SOURCE},
              'bodyReceiptSha256': EXPECTED_BODY, 'inputs': before,
              'mesh': {'pointsSource': source.tolist(), 'pointsTarget': target.tolist(),
                       'triangles': triangles.tolist(), 'fieldOwnerSha256': sha(paths[3]),
                       'samplerSha256': sha(paths[4])},
              'protected': {'headAndCapeCollar': 'y<250 exact', 'skirtHemAndFeet': 'y>=390 exact',
                            'anatomicalLeftFileAndGrip': 'x>=210 exact'},
              'keyTimesMs': list(times_ms), 'durationMsPerKey': 80,
              'frames': checks, 'variants': variants,
              'limitations': ['Only four source keys; no full16 gesture, runtime timing or GPU test.',
                              'No borrowed paint or invented hidden arm pixels.',
                              'Perceived gesture and sleeve/cape join require independent native review.']}
    result['driverSha256'] = sha(Path(__file__))
    target_path = output / 'pilot-source.json'
    target_path.write_text(json.dumps(result, indent=2, allow_nan=False) + '\n', encoding='utf8')
    print(json.dumps({'status': result['status'], 'frames': 4,
                      'receiptSha256': sha(target_path)}), flush=True)


if __name__ == '__main__':
    build(OUT)
