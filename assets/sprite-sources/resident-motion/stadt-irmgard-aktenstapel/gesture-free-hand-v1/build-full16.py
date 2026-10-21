"""Full 16-frame Irmgard free-hand gesture from the reviewed own four-key mesh."""
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import label

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
PILOT_DRIVER = HERE / 'build-pilot.py'
PILOT = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-gesture-pilot-v1'
BODY = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-walk-source-v1/walk-source.json'
SOURCE = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-walk-source-v1/working/down-neutral.png'
OUT = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-gesture-full16-v1'
PILOT_SHA = 'a430b82bd4080b0789cbc474c5bb9ab7df9ac7026a20e8276b186ff3100d6678'
DRIVER_SHA = '975c956ae2a3301ea7a622a3a5bd06667a40c60ed14d5d551c1b8a4184fcefed'
BODY_SHA = '98e7f1a541ca231dab39bd64f11273e5736124954a4c921ea94f613103029e7b'
SOURCE_SHA = 'f4aebee3b8c84bc70671e13c0d7f188807ae97a06ce07f8c1fafcffd0d7dd5cc'
ANCHORS = {0: 0.0, 3: .35, 8: 1.0, 15: 0.0}
COLORS = {'light': '#eee8db', 'dark': '#25272b'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def ref(path):
    return {'file': Path(path).relative_to(ROOT).as_posix(), 'sha256': sha(path)}


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def smooth(t):
    return t*t*(3-2*t)


def amount(index):
    if index <= 3:
        return .35*smooth(index/3)
    if index <= 8:
        return .35 + .65*smooth((index-3)/5)
    if index == 9:
        return 1.0  # one-frame emphasis dwell before recovery
    return 1-smooth((index-9)/6)


def check_mesh(source, target, triangles, value):
    points = source + (target-source)*value
    edges_a = points[triangles[:, 1]]-points[triangles[:, 0]]
    edges_b = points[triangles[:, 2]]-points[triangles[:, 0]]
    signed = edges_a[:, 0]*edges_b[:, 1]-edges_a[:, 1]*edges_b[:, 0]
    base_a = source[triangles[:, 1]]-source[triangles[:, 0]]
    base_b = source[triangles[:, 2]]-source[triangles[:, 0]]
    base = base_a[:, 0]*base_b[:, 1]-base_a[:, 1]*base_b[:, 0]
    if np.any(np.abs(signed) < 1e-5) or np.any(np.sign(signed) != np.sign(base)):
        raise ValueError('Free-hand mesh triangle flipped or collapsed')
    return float(np.min(np.abs(signed)))


def board(frames, path, columns, color, scale=1):
    w, h = frames[0].size
    canvas = Image.new('RGBA', (columns*w, ((len(frames)+columns-1)//columns)*h), color)
    for index, frame in enumerate(frames):
        canvas.alpha_composite(frame, ((index % columns)*w, (index//columns)*h))
    if scale != 1:
        canvas = canvas.resize((canvas.width*scale, canvas.height*scale), Image.Resampling.NEAREST)
    canvas.convert('RGB').save(path)


def rms(left, right):
    a = np.asarray(left, dtype=np.float32)
    b = np.asarray(right, dtype=np.float32)
    return float(np.sqrt(np.mean((a-b)**2)))


def build():
    if (sha(PILOT_DRIVER) != DRIVER_SHA or sha(PILOT/'pilot-source.json') != PILOT_SHA or
            sha(BODY) != BODY_SHA or sha(SOURCE) != SOURCE_SHA):
        raise ValueError('Reviewed own gesture or body source changed')
    pilot_receipt = json.loads((PILOT/'pilot-source.json').read_text(encoding='utf8'))
    for key, digest in pilot_receipt['inputs'].items():
        if sha(ROOT/key) != digest:
            raise ValueError('Reviewed pilot input changed: '+key)
    body = json.loads(BODY.read_text(encoding='utf8'))
    author = load('irmgard_reviewed_own_free_hand', PILOT_DRIVER)
    builder = load('irmgard_existing_resident_exporter', ROOT/'tools/build-resident-motion.py')
    neutral = Image.open(SOURCE).convert('RGBA')
    source, target, triangles = author.mesh()
    before = {key: digest for key, digest in pilot_receipt['inputs'].items()}
    before.update({ref(PILOT/'pilot-source.json')['file']: PILOT_SHA})
    before.update({ref(PILOT/f'working-{key:02}.png')['file']: sha(PILOT/f'working-{key:02}.png')
                   for key in range(4)})
    OUT.mkdir(parents=True, exist_ok=True)
    frames, measures = [], []
    original = np.asarray(neutral)
    for index in range(16):
        value = amount(index)
        minimum_area = check_mesh(source, target, triangles, value)
        frame = author.render(neutral, source, target, triangles, value)
        pixels = np.asarray(frame)
        if not (np.array_equal(pixels[:250], original[:250]) and
                np.array_equal(pixels[390:], original[390:]) and
                np.array_equal(pixels[:, 210:], original[:, 210:])):
            raise ValueError('Protected head, collar, file/grip, hem or boots changed')
        groups, _ = label(pixels[:, :, 3] >= 128)
        sizes = np.bincount(groups.ravel())[1:]
        fraction = float(sizes.max()/sizes.sum()) if len(sizes) else 0.0
        if fraction < .995:
            raise ValueError('Free-hand sleeve or hand detached')
        path = OUT/f'working-{index:02}.png'
        frame.save(path)
        if index in ANCHORS:
            old = PILOT/f'working-{(0, 1, 2, 3)[(0, 3, 8, 15).index(index)]:02}.png'
            if path.read_bytes() != old.read_bytes():
                raise ValueError('Reviewed pilot key PNG bytes changed: '+str(index))
        frames.append(frame)
        measures.append({'index': index, 'timeMs': index*80, 'amount': value,
                         'source': ref(path), 'minimumTriangleDoubleArea': minimum_area,
                         'opaqueBodyFraction': fraction, 'protectedExact': True})
    if frames[0].tobytes() != frames[15].tobytes():
        raise ValueError('Gesture loop endpoints changed')
    unique = len({frame.tobytes() for frame in frames})
    # The anticipation and recovery both pass through the same .259259 mesh
    # position (frames 2 and 13); this third duplicate is intentional.
    if unique != 13:
        raise ValueError('Gesture inbetween coverage changed')
    adjacent = [rms(frames[index], frames[(index+1)%16]) for index in range(16)]
    if any(adjacent[index] <= 0 for index in range(15) if index != 8):
        raise ValueError('Gesture inbetween vanished outside peak dwell')
    if max(adjacent) > 1.5*max(rms(frames[0], frames[3]), rms(frames[3], frames[8]),
                               rms(frames[8], frames[15])):
        raise ValueError('Single gesture step exceeds reviewed key transition')
    variants = {}
    for name, physical in body['variants'].items():
        w, h = physical['frame_size']
        spec = {'cell': [w, h], 'figureHeight': physical['figureHeight'],
                'pivot': physical['pivot'], 'working': {'figureHeight': 400, 'baseline': 472}}
        cells = [builder.street.export_cell(frame, spec) for frame in frames]
        files, gutters = [], []
        for index, cell in enumerate(cells):
            path = OUT/f'{name}-{index:02}.png'
            cell.save(path)
            if Image.open(path).convert('RGBA').tobytes() != cell.tobytes():
                raise ValueError('Direct encoded cell lost exact RGBA')
            if index in ANCHORS:
                old_index = (0, 1, 2, 3)[(0, 3, 8, 15).index(index)]
                old = PILOT/f'{name}-{old_index:02}.png'
                if path.read_bytes() != old.read_bytes():
                    raise ValueError('Reviewed native key PNG bytes changed')
            box = cell.getchannel('A').getbbox()
            gutters.append(min(box[0], box[1], w-box[2], h-box[3]))
            files.append(ref(path))
        if min(gutters) < 2:
            raise ValueError('Gesture native cell lost alpha gutter')
        variants[name] = {'cell': [w, h], 'figureHeight': physical['figureHeight'],
                          'pivot': physical['pivot'], 'files': files,
                          'minimumGutter': min(gutters), 'decodedExact': True}
        for theme, color in COLORS.items():
            board(cells, OUT/f'{name}-{theme}.png', 8, color,
                  3 if name == 'desktop' else 4)
    for theme, color in COLORS.items():
        board(frames, OUT/f'working-{theme}.png', 8, color)
    if any(sha(ROOT/key) != digest for key, digest in before.items()):
        raise ValueError('Own pilot or body input changed during full gesture export')
    result = {'schemaVersion': 1, 'id': 'stadt-irmgard-aktenstapel',
              'status': 'held 16-frame own free-hand gesture source; independent review pending',
              'frameMs': 80, 'durationMs': 1280, 'anchors': ANCHORS,
              'action': pilot_receipt['action'], 'source': ref(SOURCE),
              'bodyReceipt': ref(BODY), 'pilotReceipt': ref(PILOT/'pilot-source.json'),
              'inputs': before, 'mesh': pilot_receipt['mesh'], 'protected': pilot_receipt['protected'],
              'frames': measures, 'variants': variants,
              'uniqueWorkingFrames': unique, 'adjacentRms': adjacent,
              'maximumAdjacentRms': max(adjacent), 'loopRms': adjacent[-1],
              'reviewedKeysByteExact': True, 'encodedCellsVerified': 32,
              'limitations': ['No runtime, GPU, world timing or full 16-frame gesture lip transport review.']}
    result['driverSha256'] = sha(Path(__file__))
    receipt = OUT/'full16-source.json'
    receipt.write_text(json.dumps(result, indent=2, allow_nan=False)+'\n', encoding='utf8')
    print(json.dumps({'receipt': ref(receipt), 'frames': 16, 'encodedCells': 32,
                      'uniqueWorkingFrames': unique, 'maximumAdjacentRms': max(adjacent)}))


if __name__ == '__main__':
    build()
