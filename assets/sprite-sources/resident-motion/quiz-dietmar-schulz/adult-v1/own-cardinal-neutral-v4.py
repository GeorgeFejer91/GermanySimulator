"""Partition Dietmar's original front and rear art at the visible leg split."""

import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label


ROOT = Path.cwd()
BASE = ROOT / 'output/dietmar-schulz-height'
SOURCE = ROOT / 'assets/sprite-sources/resident-motion/quiz-dietmar-schulz/adult-v1'
OUT = BASE / 'own-cardinal-neutral-v4'
FIXED_THROUGH = 343
SPLIT = 256
RIGID_FROM = 420
TIERS = {'desktop': (96,120), 'mobile': (64,80)}


def load_export():
    spec = importlib.util.spec_from_file_location('canonical_export', ROOT/'tools/build-street-character-sprites.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def partition(source, heading):
    with (source/'registration-v1.json').open(encoding='utf-8-sig') as file:
        registration = json.load(file)
    controls = registration['directions'][heading]
    with Image.open(source/registration['source']) as sheet:
        x0,y0,x1,y1 = controls['rawSemanticCell']
        assert x1-x0 == 384 and y1-y0 == 512
        cell = sheet.convert('RGBA').crop((x0,y0,x1,y1))
        original = np.asarray(cell.convert('RGBa').transform(
            (512,512), Image.Transform.AFFINE, controls['affineOutputToSource'],
            Image.Resampling.BICUBIC).convert('RGBA')).copy()
    with Image.open(source/'registered-v1'/f'{heading}.png') as saved:
        assert np.array_equal(original, np.asarray(saved.convert('RGBA'))), ('Original raw replay', heading)
    yy, xx = np.mgrid[:512,:512]
    positive = original[..., 3] > 0
    left = (yy > FIXED_THROUGH) & (xx < SPLIT) & positive
    right = (yy > FIXED_THROUGH) & (xx >= SPLIT) & positive
    fixed = ~(left | right)
    parts = {}
    for name, mask in [('fixed', fixed), ('left', left), ('right', right)]:
        parts[name] = np.zeros_like(original)
        parts[name][mask] = original[mask]
    assert np.array_equal(sum(parts.values(), np.zeros_like(original, dtype=np.uint16)), original)
    seam = original[FIXED_THROUGH+1:, SPLIT-1:SPLIT+2, 3]
    assert int(seam.max()) < 20, ('Midline crosses supported leg paint', heading,
                                  np.argwhere(seam >= 20)[:10].tolist())
    assert all(label(parts[name][...,3] >= 21)[1] == 1 for name in ('left','right')), heading
    sole_rows = {}
    for name, x_slice in [('left', slice(None, SPLIT)), ('right', slice(SPLIT, None))]:
        actual = parts[name][RIGID_FROM:, x_slice]
        expected = original[RIGID_FROM:, x_slice].copy()
        expected[expected[...,3] == 0] = 0
        assert np.array_equal(actual, expected), ('Original lower sole paint changed', heading, name)
        low = actual[...,3] >= 200
        assert low.sum() > 900, ('Complete own cuff and shoe required', heading, name)
        rows = {f'A{level}': int(np.where(actual[...,3] >= level)[0].max()) + RIGID_FROM
                for level in (1, 21, 200)}
        assert 464 <= rows['A200'] < 472, ('Original strong sole misses the registered last-eight-row band',
                                            heading, name, rows)
        sole_rows[name] = rows
    layers = [Image.fromarray(parts[name]) for name in ('left', 'right', 'fixed')]
    previous_order = Image.alpha_composite(Image.alpha_composite(layers[0], layers[1]), layers[2])
    previous_mismatch = np.any(np.asarray(previous_order) != original, axis=2)
    assert not np.any(previous_mismatch & positive), ('Prior order changed positive paint', heading)
    assert np.array_equal(np.asarray(previous_order)[...,3], original[...,3])
    # The fixed layer owns original A0 metadata. Make it the transparent base.
    neutral = Image.alpha_composite(Image.alpha_composite(layers[2], layers[0]), layers[1])
    assert np.array_equal(np.asarray(neutral), original), ('Literal original RGBA', heading)
    return original, parts, neutral, int(seam.max()), sole_rows, int(previous_mismatch.sum())


def native(image, tier, export):
    width, height = TIERS[tier]
    scale = width/128
    return export.export_cell(image, {'cell': [width,height], 'figureHeight': 136*scale,
        'pivot': [64*scale,150*scale], 'working': {'figureHeight': 400, 'baseline': 472}})


def board(path, frames, labels, background, zoom):
    width = max(im.width for im in frames)*zoom+8
    height = max(im.height for im in frames)*zoom
    page = Image.new('RGB', (width*len(frames), height+24), background)
    draw = ImageDraw.Draw(page)
    for index, (im, name) in enumerate(zip(frames, labels)):
        tile = Image.new('RGBA', im.size, background)
        tile.alpha_composite(im)
        page.paste(tile.convert('RGB').resize((im.width*zoom, im.height*zoom), Image.Resampling.NEAREST),
                   (index*width, 24))
        draw.text((index*width+4, 5), name, fill='white' if background == '#25272b' else '#25272b')
    page.save(path, compress_level=1)


def main():
    OUT.mkdir(exist_ok=False)
    export = load_export()
    records = {}
    report = {'status': 'RUNNING', 'headings': records, 'motionSourceFrames': 0}
    try:
        for heading in ('down','up'):
            original, parts, neutral, max_seam, sole_rows, hidden_order_delta = partition(SOURCE, heading)
            neutral.save(OUT/f'{heading}-neutral.png', compress_level=1)
            for name, arr in parts.items():
                Image.fromarray(arr).save(OUT/f'{heading}-{name}.png', compress_level=1)
            own = [neutral, *(Image.fromarray(parts[name]) for name in ('fixed','left','right'))]
            for theme, background in [('dark','#25272b'), ('light','#eee8db')]:
                board(OUT/f'{heading}-own-material-{theme}.png',
                      [im.crop((170,270,343,479)) for im in own],
                      ['Original lower', 'Fixed coat and contact', 'Screen left', 'Screen right'], background, 1)
            native_rows = {}
            for tier in TIERS:
                result = native(neutral, tier, export)
                assert np.array_equal(np.asarray(result), np.asarray(native(Image.fromarray(original), tier, export)))
                path = OUT/f'{heading}-{tier}.webp'
                result.save(path, format='WEBP', lossless=True, quality=100, method=6, exact=True)
                with Image.open(path) as decoded:
                    assert np.array_equal(np.asarray(decoded.convert('RGBA')), np.asarray(result))
                native_rows[tier] = path.relative_to(ROOT).as_posix()
            records[heading] = {'literalRawAndRegisteredOwnRGBA': True,
                                'neutralLiteralRGBA': True, 'previousOrderA0MetadataDifferences': hidden_order_delta,
                                'stationaryThrough': FIXED_THROUGH,
                                'maximumMidlineAlphaBelowFixed': max_seam,
                                'partPositivePixels': {name: int((arr[...,3] > 0).sum()) for name,arr in parts.items()},
                                'rigidWholeCuffAndBootFrom': RIGID_FROM,
                                'actualOriginalSoleRows': sole_rows, 'native': native_rows}
        for old_path in sorted((BASE / 'own-cardinal-neutral-v3').glob('down-*')):
            assert (OUT/old_path.name).read_bytes() == old_path.read_bytes(), old_path.name
        report['firstPassedDownBytesUnchanged'] = True
        report['status'] = 'TWO_OWN_NEUTRALS_AND_FOUR_NATIVE_ART_REVIEW_PENDING'
    except Exception as error:
        report.update(status='FIRST_RED_HELD', error=repr(error))
        raise
    finally:
        with (OUT/'report.json').open('x', encoding='utf-8') as file:
            json.dump(report, file, indent=2)
            file.write('\n')


if __name__ == '__main__':
    main()
