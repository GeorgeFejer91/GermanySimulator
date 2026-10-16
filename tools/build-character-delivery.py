"""Repack accepted atlases without changing a single decoded RGBA pixel.

Run with the existing Pillow environment; --check verifies shipped derivatives.
PNG masters, frame layouts, timings and authoring records remain authoritative.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
KINDS = [('characters', name) for name in ('merkel', 'bayern', 'alice', 'borderPourer')]
KINDS += [('tourists', name) for name in ('towelMan', 'towelWoman')]


def run(check=False):
    before = after = 0
    for family, name in KINDS:
        path = ROOT / 'assets' / family / name / 'manifest.json'
        manifest = json.loads(path.read_text(encoding='utf-8'))
        source = path.parent / manifest['image']
        target = path.parent / 'character-atlas.webp'
        original = Image.open(source).convert('RGBA')
        if not check:
            original.save(target, 'WEBP', lossless=True, exact=True, method=6)
        decoded = Image.open(target).convert('RGBA')
        assert original.size == decoded.size
        assert original.tobytes() == decoded.tobytes(), name + ' RGBA pixels changed'
        record = {
            'image': target.name,
            'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
            'bytes': target.stat().st_size,
            'rgba_sha256': hashlib.sha256(decoded.tobytes()).hexdigest(),
            'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        }
        assert record['source_sha256'] == manifest['sha256'], name + ' master changed'
        assert record['bytes'] < source.stat().st_size, name + ' repack is larger'
        if check:
            assert manifest.get('delivery') == record, name + ' delivery record is stale'
        else:
            manifest['delivery'] = record
        if family == 'tourists':
            # Same grid and exact walking/turning pixels; reaction rows arrive on request.
            movement = Image.new('RGBA', original.size)
            movement.paste(original.crop((0, 0, original.width, 10 * manifest['frame_size'][1])), (0, 0))
            movement_target = path.parent / 'movement-atlas.webp'
            if not check:
                movement.save(movement_target, 'WEBP', lossless=True, exact=True, method=6)
            decoded_movement = Image.open(movement_target).convert('RGBA')
            assert decoded_movement.size == movement.size
            assert decoded_movement.tobytes() == movement.tobytes(), name + ' movement pixels changed'
            movement_record = {
                'image': movement_target.name,
                'sha256': hashlib.sha256(movement_target.read_bytes()).hexdigest(),
                'bytes': movement_target.stat().st_size,
                'rgba_sha256': hashlib.sha256(decoded_movement.tobytes()).hexdigest(),
                'source_sha256': manifest['sha256'],
            }
            assert movement_record['bytes'] < record['bytes']
            if check:
                assert manifest.get('movement_delivery') == movement_record, name + ' movement delivery record is stale'
            else:
                manifest['movement_delivery'] = movement_record
        if not check:
            path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        before += source.stat().st_size
        after += target.stat().st_size
        print(f'PASS {name}: {source.stat().st_size} -> {target.stat().st_size} bytes; exact RGBA')
    assert after <= 10_100_000, 'accepted character delivery exceeds 10.1 MB'
    print(f'TOTAL {before} -> {after} bytes ({100 * (1 - after / before):.1f}% smaller)')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    run(parser.parse_args().check)
