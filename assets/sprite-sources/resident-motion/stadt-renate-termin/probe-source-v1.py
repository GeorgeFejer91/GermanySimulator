"""Bounded, source-only Renate registration and four side gait anchors.

Only her own painted components are sampled. This is deliberately not an atlas
builder or a stride/contact calibration. The registered cardinals stay unchanged.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import math
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
OUT = ROOT / 'output/ambient-city-animation/renate-termin-source-gate-v1'
sys.path.insert(0, str(ROOT / '.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint

spec = importlib.util.spec_from_file_location('street', ROOT / 'tools/build-street-character-sprites.py')
street = importlib.util.module_from_spec(spec)
spec.loader.exec_module(street)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_bound(path, sha):
    actual = digest(ROOT / path)
    if actual != sha:
        raise ValueError(f'Changed source: {path}: {actual}')
    return Image.open(ROOT / path).convert('RGBA')


def register(source, bounds, pivot, scale):
    return street.register_source(source, {'component_bounds': bounds, 'source_pivot': pivot}, scale, 472)[0]


def board(images, theme, columns, scale=1):
    rows = math.ceil(len(images) / columns)
    bg = (244, 239, 226, 255) if theme == 'light' else (27, 31, 37, 255)
    canvas = Image.new('RGBA', (columns * 512, rows * 512), bg)
    for i, im in enumerate(images):
        canvas.alpha_composite(im, ((i % columns) * 512, (i // columns) * 512))
    if scale != 1:
        canvas = canvas.resize((canvas.width * scale, canvas.height * scale), Image.Resampling.NEAREST)
    return canvas


def export(image, cell, pivot, figure):
    return street.export_cell(image, {'working': {'figureHeight': 400, 'baseline': 472},
        'cell': cell, 'pivot': pivot, 'figureHeight': figure})


def side_upper(original, direction, scale, source_pivot, cut_source_y, hand_end_source_y, feather):
    origin_x = 256 - source_pivot[0] * scale
    origin_y = 472 - source_pivot[1] * scale
    cut_y = round(origin_y + cut_source_y * scale)
    mask = Image.new('L', (512, 512))
    draw = ImageDraw.Draw(mask)
    draw.rectangle((0, 0, 511, cut_y-feather), fill=255)
    for y in range(cut_y-feather+1, cut_y+1):
        draw.line((0, y, 511, y), fill=round(255*(cut_y-y)/feather))
    if direction == 'right':
        polygon = [(220, 450), (350, 450), (352, hand_end_source_y), (218, hand_end_source_y)]
        base_x = 543
    else:
        polygon = [(275, 450), (361, 450), (361, hand_end_source_y), (275, hand_end_source_y)]
        base_x = 1629
    draw.polygon([((base_x + x)*scale + origin_x, y*scale + origin_y) for x, y in polygon], fill=255)
    pixels = np.asarray(original).copy()
    pixels[:, :, 3] = np.minimum(pixels[:, :, 3], np.asarray(mask))
    pixels[pixels[:, :, 3] == 0] = 0
    return Image.fromarray(pixels), mask


def side_pose(components, upper, original, phase_index, step, lift, envelope_end):
    phase = math.tau * phase_index / 16
    frame = Image.new('RGBA', (512, 512))
    # Input list is [far, near], so the original nearer trouser/boot occludes
    # hidden underpaint; both are own complete painted components.
    for i, layer in enumerate(components):
        side_phase = phase + i * math.pi
        travel = step * math.sin(side_phase)
        raise_px = lift * max(0, math.cos(side_phase))
        nodes = [0, 315, 344, 388, 425, 460, 511]
        dx = [0, 0, 0, travel * .32, travel * .65, travel, travel]
        dy = [0, 0, 0, -raise_px * .1, -raise_px * .3, -raise_px, -raise_px]
        frame.alpha_composite(paint.warp_layer(layer, nodes, dx, dy))
    # A complete donor thigh must stay beneath the original silhouette where
    # its top is occluded. Expand the permitted contour toward the moving
    # shin, then release it before the boot; this removes no visible original.
    pixels = np.asarray(frame).copy()
    original_a = np.asarray(original)[:, :, 3]
    for y in range(385, envelope_end):
        xs = np.flatnonzero(original_a[y] >= 20)
        if not len(xs): continue
        # Lateral freedom follows the measured 15 px pilot foot travel; the
        # source component's much wider concealed thigh is not an exposed hip.
        allowance = round(min(15, max(0, y-385)*.35))
        left = max(0, int(xs.min())-allowance)
        right = min(511, int(xs.max())+allowance)
        pixels[y, :left] = 0
        pixels[y, right+1:] = 0
    pixels[:385] = 0
    frame = Image.fromarray(pixels)
    # The cardinal owns visible hip paint. Its opaque source pixels fill only
    # the narrow area absent from both registered complete donor thighs. By
    # y420 the donor covers the entire original silhouette, so no stationary
    # original shin or boot is extended into the animated lower body.
    underlay = np.zeros_like(pixels)
    underlay[380:420] = np.asarray(original)[380:420]
    restored = Image.fromarray(underlay)
    restored.alpha_composite(frame)
    frame = restored
    frame.alpha_composite(upper)
    return frame


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    config_path = HERE / 'source-fit-v1.json'
    cfg = json.loads(config_path.read_text(encoding='utf8'))
    for key in ('cardinals', 'companion'):
        cfg[key]['image'] = load_bound(cfg[key]['source'], cfg[key]['sha256'])
    standing = ROOT / cfg['standing']['path']
    if digest(standing) != cfg['standing']['sha256']:
        raise ValueError('Standing changed')
    with Image.open(standing) as standing_image:
        if standing_image.size != tuple(cfg['standing']['cell']):
            raise ValueError('Standing cell changed')
    if (cfg['standing']['id'], cfg['standing']['aliases'], cfg['standing']['pivot'],
        cfg['standing']['figureHeight'], cfg['standing']['figureWorldHeight']) != (
        'stadt-renate-termin', ['stadt-renate-termin', 'city-renate-termin'], [64,150], 136, 1.6):
        raise ValueError('Own standing contract changed')
    cardinals = {}
    for direction, view in cfg['cardinals']['views'].items():
        bounds, pivot = view['bounds'], view['pivot']
        cardinals[direction] = register(cfg['cardinals']['image'], bounds, pivot, 400/(bounds[3]-bounds[1]))
        cardinals[direction].save(OUT / f'{direction}-registered.png')
    turns = {}
    for turn in cfg['companion']['turns']:
        bounds, pivot = turn['bounds'], turn['pivot']
        turns[turn['heading']] = register(cfg['companion']['image'], bounds, pivot, 400/(bounds[3]-bounds[1]))
        turns[turn['heading']].save(OUT / f'{turn["heading"]}-registered.png')
    all8 = [cardinals['down'], turns['front-right'], cardinals['right'], turns['rear-right'],
        cardinals['up'], turns['rear-left'], cardinals['left'], turns['front-left']]
    for theme in ('light', 'dark'):
        board(all8, theme, 4).save(OUT / f'eight-headings-{theme}.png')
        for cell, pivot, figure in [([96,120],[48,112.5],102),([64,80],[32,75],68)]:
            bg = (244,239,226,255) if theme == 'light' else (27,31,37,255)
            compact = [export(im, cell, pivot, figure) for im in all8]
            strip = Image.new('RGBA', (cell[0]*4, cell[1]*2), bg)
            for j, im in enumerate(compact):
                strip.alpha_composite(im, (j%4*cell[0], j//4*cell[1]))
            strip.save(OUT / f'eight-headings-{cell[0]}x{cell[1]}-{theme}.png')
    export(cardinals['down'], [128,160], [64,150], 136).save(OUT/'down-direct-standing-contract.png')

    side_results = {}
    for direction in ('right', 'left'):
        v = cfg['cardinals']['views'][direction]
        scale = 400/(v['bounds'][3]-v['bounds'][1])
        upper, upper_mask = side_upper(cardinals[direction], direction, scale, v['pivot'],
            cfg['pilot']['sideUpperCutSourceY'], cfg['pilot']['sideProtectedHandEndSourceY'],
            cfg['pilot']['sideUpperFeatherWorkingPx'])
        upper.save(OUT / f'{direction}-upper-ownership.png')
        leg_specs = [leg for leg in cfg['companion']['legs'] if leg['facing'] == direction]
        components = []
        for role in ('far', 'near'):
            leg = next(x for x in leg_specs if x['role'] == role)
            x0, y0, x1, y1 = leg['bounds']
            source_center = (x0 + x1)/2
            source_pivot_x = source_center - (leg['targetCenterX']-256)/scale
            image = register(cfg['companion']['image'], leg['bounds'], [source_pivot_x, 962], scale)
            image.save(OUT / f'{direction}-{role}-registered.png')
            components.append(image)
        frames = [side_pose(components, upper, cardinals[direction], i,
            cfg['pilot']['sideStepWorkingPx'], cfg['pilot']['sideLiftWorkingPx'],
            cfg['pilot']['sideLowerEnvelopeEndWorkingY']) for i in cfg['pilot']['phases']]
        for index, frame in zip(cfg['pilot']['phases'], frames):
            frame.save(OUT / f'{direction}-phase-{index:02}.png')
        side_results[direction] = frames
        for theme in ('light', 'dark'):
            board([cardinals[direction], *frames], theme, 5).save(OUT / f'{direction}-source-and-phases-{theme}.png')
            # Actual native source crop (not a bounding-box claim) around boot joins and ticket/grip.
            crop = [im.crop((145, 310, 375, 490)).resize((460, 360), Image.Resampling.NEAREST)
                for im in [cardinals[direction], *frames]]
            strip = Image.new('RGBA', (460*5, 360), (244,239,226,255) if theme=='light' else (27,31,37,255))
            for j, im in enumerate(crop): strip.alpha_composite(im, (j*460, 0))
            strip.save(OUT / f'{direction}-boot-prop-crops-{theme}.png')
        for variant in cfg['pilot']['directExports']:
            cell, pivot, figure = variant['cell'], variant['pivot'], variant['figureHeight']
            for theme in ('light', 'dark'):
                bg = (244,239,226,255) if theme == 'light' else (27,31,37,255)
                actual = [export(im, cell, pivot, figure) for im in [cardinals[direction], *frames]]
                strip = Image.new('RGBA', (cell[0]*len(actual), cell[1]), bg)
                for j, im in enumerate(actual): strip.alpha_composite(im, (cell[0]*j, 0))
                strip.save(OUT / f'{direction}-{cell[0]}x{cell[1]}-{theme}.png')
    # Registered work is evidence, never authority for an admitted sprite family.
    receipt = {'schemaVersion': 1, 'status': 'candidate-unapproved', 'scope': 'registered 4 cardinals, 4 turns, 8 side phase anchors only',
        'sourceFit': {'path': str(config_path.relative_to(ROOT)).replace('\\','/'), 'sha256': digest(config_path)},
        'driver': {'path': str(Path(__file__).relative_to(ROOT)).replace('\\','/'), 'sha256': digest(Path(__file__))},
        'helper': {'street': digest(ROOT/'tools/build-street-character-sprites.py'),
            'paintedWalk': digest(ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py')},
        'source': {k: {'path': cfg[k]['source'], 'sha256': cfg[k]['sha256']} for k in ('cardinals','companion')},
        'standing': cfg['standing'], 'working': cfg['working'], 'pilot': cfg['pilot'],
        'output': {p.name: digest(p) for p in sorted(OUT.glob('*.png'))}}
    (OUT/'pilot-source.json').write_text(json.dumps(receipt, indent=2)+'\n', encoding='utf8')
    print(json.dumps({'receipt': str(OUT/'pilot-source.json'), 'sha256': digest(OUT/'pilot-source.json'), 'pngCount':len(receipt['output'])}))


if __name__ == '__main__': main()
