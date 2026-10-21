"""Pack referenced native street cells losslessly; full source atlases remain authority.

python tools/build-street-motion-delivery.py --manifest <canonical street manifest> \
    --character <key or id> --outdir assets/characters/<family>/<character>/delivery [--columns 16] [--check]
"""
import argparse
import hashlib
import io
import json
import math
import os
from pathlib import Path
import re
import struct
import tempfile

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DIRECTIONS = ('down', 'right', 'up', 'left')
SOURCE_PATH = re.compile(r'^\./assets/characters/(?:street|street-speakers|residents)/[a-zA-Z0-9_/-]+\.webp$')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def definition_fingerprint(person):
    def typed(value):
        if value is None:
            return ['null']
        if isinstance(value, bool):
            return ['boolean', value]
        if isinstance(value, (int, float)):
            if not math.isfinite(value):
                raise ValueError('Invalid delivery definition number')
            return ['number', struct.pack('>d', value).hex()]
        if isinstance(value, list):
            return ['array', [typed(v) for v in value]]
        if isinstance(value, dict):
            return ['object', [[k, typed(value[k])] for k in sorted(value)]]
        return ['string', value]
    source = {k: v for k, v in person.items() if k != 'motionDelivery'}
    return digest(json.dumps(typed(source), ensure_ascii=False, separators=(',', ':')).encode('utf-8'))


def integer(value, low, high, label):
    if type(value) is not int or not low <= value <= high:
        raise ValueError(f'Invalid {label}: {value!r}')
    return value


def mapping(value, label):
    if not isinstance(value, dict) or not value:
        raise ValueError(f'Invalid {label}')
    return value


def pair(value, label):
    if not isinstance(value, list) or len(value) != 2:
        raise ValueError(f'Invalid {label}')
    return [integer(n, 1, 4096, label) for n in value]


def collect_slots(person):
    cols, rows = pair(person.get('grid'), 'logical grid')
    integer(cols, 1, 64, 'logical columns')
    integer(rows, 1, 64, 'logical rows')
    motion = mapping(person.get('atlasMotion'), 'atlasMotion')
    allowed = {'schemaVersion', 'walks', 'bridges', 'transitions', 'neutral', 'settles', 'interactions', 'turns'}
    if motion.get('schemaVersion') != 1 or set(motion) - allowed:
        raise ValueError('Unsupported atlasMotion schema or reference owner')
    movement, reactions = set(), set()

    def cell(p, target):
        p = mapping(p, 'cell reference')
        row = integer(p.get('row'), 0, rows - 1, 'cell row')
        col = integer(p.get('col'), 0, cols - 1, 'cell column')
        target.add(row * cols + col)

    def duration(ms):
        if type(ms) not in (int, float) or not math.isfinite(ms) or not 0 < ms <= 1000:
            raise ValueError('Invalid frame duration')

    def frames(sequence, target):
        if not isinstance(sequence, list) or not 1 <= len(sequence) <= 64:
            raise ValueError('Invalid source frame sequence')
        for p in sequence:
            cell(p, target)
            duration(p.get('ms'))

    walks = mapping(motion.get('walks'), 'walks')
    bridges = mapping(motion.get('bridges'), 'bridges')
    if set(walks) != set(DIRECTIONS) or set(bridges) != set(DIRECTIONS):
        raise ValueError('Missing or unsupported movement direction')
    for direction in DIRECTIONS:
        walk, bridge = mapping(walks[direction], 'walk'), mapping(bridges[direction], 'bridge')
        count = integer(walk.get('frames'), 1, cols, 'walk frame count')
        if 'count' in walk and walk['count'] != count:
            raise ValueError('Walk count mismatch')
        duration(walk.get('frame_ms'))
        for col in range(count):
            cell({'row': walk.get('row'), 'col': col}, movement)
        duration(bridge.get('frame_ms'))
        for name in ('stop_cols', 'start_cols'):
            if not isinstance(bridge.get(name), list) or not 1 <= len(bridge[name]) <= cols:
                raise ValueError('Invalid bridge columns')
            for col in bridge[name]:
                cell({'row': bridge.get('row'), 'col': col}, movement)
    cell(motion.get('neutral'), movement)
    for transition in mapping(motion.get('transitions'), 'transitions').values():
        frames(mapping(transition, 'transition').get('frames'), movement)
    for direction, phases in motion.get('settles', {}).items():
        if direction not in walks:
            raise ValueError('Invalid settle direction')
        for phase, settle in mapping(phases, 'settle phases').items():
            if not re.fullmatch(r'0|[1-9][0-9]*', phase) or int(phase) >= walks[direction]['frames']:
                raise ValueError('Invalid settle phase')
            frames(mapping(settle, 'settle').get('frames'), movement)
    if 'turns' in motion:
        turns = mapping(motion['turns'], 'turns')
        turn_rows = turns.get('rows')
        if not isinstance(turn_rows, list) or not turn_rows or len(turn_rows) > rows:
            raise ValueError('Invalid turn rows')
        for row in turn_rows:
            integer(row, 0, rows - 1, 'turn row')
        count = integer(turns.get('pose_count'), 1, len(turn_rows) * cols, 'turn pose count')
        for i in range(count):
            cell({'row': turn_rows[i // cols], 'col': i % cols}, movement)
    interactions = mapping(motion.get('interactions'), 'interactions')
    cell(interactions.get('neutral'), movement)
    states = mapping(interactions.get('states'), 'interaction states')
    if len(states) > 32:
        raise ValueError('Too many interaction states')
    for state in states.values():
        state = mapping(state, 'interaction state')
        durations = state.get('durations_ms')
        if not isinstance(durations, list) or not 1 <= len(durations) <= cols:
            raise ValueError('Invalid interaction durations')
        start = integer(state.get('col'), 0, cols - 1, 'state column')
        for i, ms in enumerate(durations):
            duration(ms)
            cell({'row': state.get('row'), 'col': start + i}, reactions)
    for clips, target in [(person.get('clips', {}), movement), (person.get('speech', {}).get('clips', {}), reactions)]:
        for clip in clips.values():
            clip = mapping(clip, 'clip')
            offset = integer(clip.get('offset'), 0, cols * rows - 1, 'clip offset')
            count = integer(clip.get('count'), 1, cols * rows - offset, 'clip count')
            target.update(range(offset, offset + count))
    return {'movement': sorted(movement), 'reactions': sorted(reactions)}


def source_path(root, value):
    if not isinstance(value, str) or not SOURCE_PATH.fullmatch(value) or '..' in value:
        raise ValueError('Invalid canonical source path')
    path = (root / value[2:]).resolve()
    if not path.is_relative_to(root / 'assets/characters'):
        raise ValueError('Escaping canonical source path')
    return path


def run(manifest, character, outdir, check=False, root=ROOT, columns=16):
    columns = integer(columns, 1, 64, 'pack columns')
    root = Path(root).resolve()
    raw = Path(manifest).read_bytes()
    if len(raw) > 262144:
        raise ValueError('Canonical street manifest exceeds 256 KiB')
    data = json.loads(raw)
    people = mapping(data.get('characters'), 'characters')
    if data.get('schemaVersion') != 1 or len(people) > 64:
        raise ValueError('Invalid canonical street manifest')
    matches = [p for key, p in people.items() if character in (key, p.get('id'), p.get('actorId'), *p.get('aliases', []))]
    if len(matches) != 1:
        raise ValueError('Character must resolve to exactly one canonical record')
    person = matches[0]
    logical_cell, grid = pair(person.get('cell'), 'logical cell'), pair(person.get('grid'), 'logical grid')
    slots = collect_slots(person)
    variants = mapping(person.get('variants'), 'source variants')
    paths = {name: source_path(root, variants.get(name, {}).get('file')) for name in ('desktop', 'mobile')}
    outdir = Path(outdir).resolve()
    if paths['desktop'].parent != paths['mobile'].parent or outdir != paths['desktop'].parent / 'delivery':
        raise ValueError('Invalid output directory: use the source character directory/delivery')
    if not outdir.is_relative_to(root / 'assets/characters'):
        raise ValueError('Invalid output directory outside canonical assets')
    record = {'schemaVersion': 1, 'id': person['id'], 'logical': {'cell': logical_cell, 'grid': grid},
              'definitionHashFormat': 'typed-json-f64-v1', 'definitionSha256': definition_fingerprint(person),
              'sources': {}, 'packs': {}}
    for kind, used in slots.items():
        packed_rows = math.ceil(len(used) / columns)
        record['packs'][kind] = {'grid': [columns, packed_rows], 'slots': used + [None] * (packed_rows * columns - len(used)), 'variants': {}}
    exports = {}
    for name, path in paths.items():
        source_bytes = path.read_bytes()
        atlas = variants[name]
        if not isinstance(atlas.get('sha256'), str) or not re.fullmatch('[a-fA-F0-9]{64}', atlas['sha256']) or digest(source_bytes) != atlas['sha256'].lower():
            raise ValueError(f'{name} source hash mismatch')
        width, height = integer(atlas.get('width'), 1, 4096, 'source width'), integer(atlas.get('height'), 1, 4096, 'source height')
        if width % grid[0] or height % grid[1]:
            raise ValueError('Source dimensions do not divide logical grid')
        cell = [width // grid[0], height // grid[1]]
        if cell[0] * logical_cell[1] != cell[1] * logical_cell[0]:
            raise ValueError('Source dimensions change logical cell aspect')
        with Image.open(path) as opened:
            if opened.size != (width, height):
                raise ValueError('Source dimensions mismatch')
            source = opened.convert('RGBA')
        record['sources'][name] = {'file': atlas['file'], 'sha256': digest(source_bytes), 'width': width, 'height': height,
                                   'cell': cell, 'rgba_sha256': digest(source.tobytes()), 'decodedBytes': width * height * 4}
        for kind, pack in record['packs'].items():
            packed_size = (columns * cell[0], pack['grid'][1] * cell[1])
            if max(packed_size) > 4096:
                raise ValueError('Packed delivery exceeds 4096 texture extent')
            packed = Image.new('RGBA', packed_size)
            for physical, logical in enumerate(pack['slots']):
                if logical is None:
                    continue
                x, y = logical % grid[0] * cell[0], logical // grid[0] * cell[1]
                packed.paste(source.crop((x, y, x + cell[0], y + cell[1])),
                             (physical % columns * cell[0], physical // columns * cell[1]))
            buffer = io.BytesIO()
            packed.save(buffer, 'WEBP', lossless=True, exact=True, method=6)
            encoded = buffer.getvalue()
            with Image.open(io.BytesIO(encoded)) as decoded:
                if decoded.size != packed.size or decoded.convert('RGBA').tobytes() != packed.tobytes():
                    raise ValueError('Lossless WebP roundtrip changed source pixels')
            filename = f'{kind}-{name}.webp'
            exports[filename] = encoded
            pack['variants'][name] = {'file': './' + (outdir / filename).relative_to(root).as_posix(),
                                      'width': packed.width, 'height': packed.height, 'bytes': len(encoded),
                                      'sha256': digest(encoded), 'rgba_sha256': digest(packed.tobytes()),
                                      'decodedBytes': packed.width * packed.height * 4}
    receipt = (json.dumps(record, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    if check:
        for filename, encoded in exports.items():
            if not (outdir / filename).is_file() or (outdir / filename).read_bytes() != encoded:
                raise ValueError(f'Stale delivery bytes: {filename}')
        if not (outdir / 'motion-delivery.json').is_file() or (outdir / 'motion-delivery.json').read_bytes() != receipt:
            raise ValueError('Stale motion delivery receipt')
    else:
        outdir.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix='.delivery-', dir=outdir) as staging:
            for filename, encoded in {**exports, 'motion-delivery.json': receipt}.items():
                staged = Path(staging) / filename
                staged.write_bytes(encoded)
                os.replace(staged, outdir / filename)
    return record


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', required=True, type=Path)
    parser.add_argument('--character', required=True)
    parser.add_argument('--outdir', required=True, type=Path)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--columns', type=int, default=16)
    args = parser.parse_args()
    result = run(args.manifest, args.character, args.outdir, args.check, columns=args.columns)
    print(json.dumps({'id': result['id'], 'packs': {k: {'grid': p['grid'], 'used': sum(s is not None for s in p['slots']),
          'decodedBytes': {v: a['decodedBytes'] for v, a in p['variants'].items()}} for k, p in result['packs'].items()},
          'check': args.check}))
