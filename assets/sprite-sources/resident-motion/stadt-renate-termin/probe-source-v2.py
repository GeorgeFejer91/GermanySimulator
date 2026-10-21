"""Renate side successor: warp original visible limbs, own hidden far paint only.

Keeps the eight registered neutral source cells byte-for-byte unchanged. No
atlas, motion admission, or production asset is written by this source pilot.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import math
import sys

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
OUT = ROOT / 'output/ambient-city-animation/renate-termin-source-gate-v1/original-contour-v2'
sys.path.insert(0, str(ROOT / '.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint

module_spec = importlib.util.spec_from_file_location('street', ROOT/'tools/build-street-character-sprites.py')
street = importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(street)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rgba_sha(image):
    return hashlib.sha256(image.convert('RGBA').tobytes()).hexdigest()


def checked_image(path, expected):
    if sha(ROOT/path) != expected:
        raise ValueError(f'Bound source changed: {path}')
    return Image.open(ROOT/path).convert('RGBA')


def register(image, bounds, pivot, scale):
    return street.register_source(image, {'component_bounds': bounds, 'source_pivot': pivot}, scale, 472)[0]


def export(image, cell, pivot, paint_figure):
    return street.export_cell(image, {'working': {'figureHeight': 400, 'baseline': 472},
        'cell': cell, 'pivot': pivot, 'figureHeight': paint_figure})


def own_layers(original, donor, seam_points, direction, lower_begin):
    """Assign each original visible pixel exactly once, backfilling only concealed far side."""
    yy, xx = np.mgrid[:512, :512]
    seam = np.interp(np.arange(512), [p[1] for p in seam_points], [p[0] for p in seam_points])
    far_side = xx < seam[:, None] if direction == 'right' else xx > seam[:, None]
    oa = np.asarray(original).copy()
    da = np.asarray(donor).copy()
    visible = oa[:, :, 3] > 0
    active = yy >= lower_begin
    far_visible = active & far_side & visible
    near_visible = active & ~far_side & visible

    far = np.zeros_like(oa)
    near = np.zeros_like(oa)
    far[far_visible] = oa[far_visible]
    near[near_visible] = oa[near_visible]

    # Hidden donor is constrained to the original body's row envelope and
    # only to the far limb's occluded side of the seam. Its exterior contour
    # cannot become an independently stamped, triangular painted thigh.
    support = np.zeros((512, 512), dtype=bool)
    for y in range(lower_begin, 480):
        xs = np.flatnonzero(oa[y, :, 3] >= 20)
        if len(xs):
            support[y, max(0, int(xs.min())-3):min(512, int(xs.max())+4)] = True
    hidden = active & ~far_side & support & (da[:, :, 3] > 0)
    far[hidden] = da[hidden]
    # The visible source assignment wins where the donor happens to touch a
    # seam antialias pixel; only original paint is ever exterior.
    far[far_visible] = oa[far_visible]
    near[near_visible] = oa[near_visible]
    return Image.fromarray(far), Image.fromarray(near), {
        'originalFarVisiblePixels': int(far_visible.sum()),
        'originalNearVisiblePixels': int(near_visible.sum()),
        'ownHiddenFarPixels': int(hidden.sum()),
        'originalVisibleOverlap': int((far_visible & near_visible).sum()),
        'farVisibleOriginalRgbaExact': bool(np.array_equal(far[far_visible], oa[far_visible])),
        'nearVisibleOriginalRgbaExact': bool(np.array_equal(near[near_visible], oa[near_visible]))
    }


def pose(original, far, near, fit, phase_index):
    phase = math.tau * phase_index / fit['phaseCount']
    nodes = fit['nodesWorkingY']
    parts = []
    for i, layer in enumerate((far, near)):
        p = phase + i * math.pi
        travel = fit['stepWorkingPx'] * math.sin(p)
        lift = fit['liftWorkingPx'] * max(0, math.cos(p))
        dx = [0,0,0,travel*.25,travel*.65,travel,travel]
        dy = [0,0,0,-lift*.1,-lift*.4,-lift,-lift]
        parts.append(paint.warp_layer(layer, nodes, dx, dy))
    result = Image.new('RGBA', (512,512))
    result.alpha_composite(parts[0])
    result.alpha_composite(parts[1])
    pixels = np.asarray(result).copy()
    source = np.asarray(original)
    end_upper = fit['heldUpperFullThroughWorkingY']
    pixels[:end_upper+1] = source[:end_upper+1]
    # Root gap closure uses only the original source pixels absent from the
    # moving source layers. It never adds exterior alpha or a copied boot.
    end_fill = fit['connectedOriginalGapFillEndsWorkingY']
    local = pixels[end_upper+1:end_fill]
    reference = source[end_upper+1:end_fill]
    missing = (reference[:, :, 3] >= 128) & (local[:, :, 3] < 128)
    local[missing] = reference[missing]
    pixels[end_upper+1:end_fill] = local
    pixels[pixels[:, :, 3] == 0] = 0
    return Image.fromarray(pixels), int(missing.sum())


def board(images, theme, crop=None):
    bg = (244,239,226,255) if theme == 'light' else (27,31,37,255)
    if crop:
        images = [im.crop(crop).resize(((crop[2]-crop[0])*2,(crop[3]-crop[1])*2), Image.Resampling.NEAREST) for im in images]
    w, h = images[0].size
    strip = Image.new('RGBA', (w*len(images),h), bg)
    for i, im in enumerate(images): strip.alpha_composite(im,(w*i,0))
    return strip


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    cfg_path = HERE/'source-fit-v2.json'
    cfg = json.loads(cfg_path.read_text(encoding='utf8'))
    base_path = ROOT/cfg['baseFit']['path']
    if sha(base_path) != cfg['baseFit']['sha256']:
        raise ValueError('Base fit changed')
    base = json.loads(base_path.read_text(encoding='utf8'))
    card = checked_image(base['cardinals']['source'], base['cardinals']['sha256'])
    companion = checked_image(base['companion']['source'], base['companion']['sha256'])
    if sha(ROOT/base['standing']['path']) != base['standing']['sha256']:
        raise ValueError('Own standing changed')
    for direction, view in base['cardinals']['views'].items():
        scale = 400/(view['bounds'][3]-view['bounds'][1])
        neutral = register(card, view['bounds'], view['pivot'], scale)
        if rgba_sha(neutral) != cfg['neutralRgbaSha256'][direction]:
            raise ValueError(f'Neutral cardinal changed: {direction}')
    for turn in base['companion']['turns']:
        neutral = register(companion, turn['bounds'], turn['pivot'], 400/(turn['bounds'][3]-turn['bounds'][1]))
        if rgba_sha(neutral) != cfg['neutralRgbaSha256'][turn['heading']]:
            raise ValueError(f'Neutral turn changed: {turn["heading"]}')

    results = {}
    for direction in ('right','left'):
        view = base['cardinals']['views'][direction]
        scale = 400/(view['bounds'][3]-view['bounds'][1])
        original = register(card, view['bounds'], view['pivot'], scale)
        side = cfg['sideFit'][direction]
        leg = base['companion']['legs'][side['farHiddenLegComponentIndex']]
        x0, y0, x1, y1 = leg['bounds']
        source_pivot_x = (x0+x1)/2 - (leg['targetCenterX']-256)/scale
        donor = register(companion, leg['bounds'], [source_pivot_x,962], scale)
        far, near, ownership = own_layers(original,donor,side['seamWorkingXY'],direction,
            cfg['sideFit']['sourceLowerBeginWorkingY'])
        far.save(OUT/f'{direction}-far-source-layer.png')
        near.save(OUT/f'{direction}-near-source-layer.png')
        frames=[]; gap_pixels=[]
        for index in cfg['sideFit']['phaseIndices']:
            frame, missing = pose(original,far,near,cfg['sideFit'],index)
            frame.save(OUT/f'{direction}-phase-{index:02}.png')
            frames.append(frame); gap_pixels.append(missing)
        results[direction]={'layerOwnership':ownership,'originalGapFillPixelsByPhase':gap_pixels}
        for theme in ('light','dark'):
            board([original,*frames],theme).save(OUT/f'{direction}-source-and-phases-{theme}.png')
            board([original,*frames],theme,(140,330,380,490)).save(OUT/f'{direction}-boot-hip-crops-{theme}.png')
            for cell,pivot,paint_figure in [
                (cfg['output']['desktopCell'],cfg['output']['desktopPivot'],cfg['output']['desktopPaintFigure']),
                (cfg['output']['mobileCell'],cfg['output']['mobilePivot'],cfg['output']['mobilePaintFigure'])]:
                strip = board([export(im,cell,pivot,paint_figure) for im in [original,*frames]],theme)
                # board accepts native cell sizes as well as working frames.
                strip.save(OUT/f'{direction}-{cell[0]}x{cell[1]}-{theme}.png')
    # Published standing contract versus calibrated own source paint.
    v=base['cardinals']['views']['down']
    down=register(card,v['bounds'],v['pivot'],400/(v['bounds'][3]-v['bounds'][1]))
    export(down,cfg['output']['standingCell'],cfg['output']['standingPivot'],cfg['output']['standingPaintFigure']).save(OUT/'down-calibrated-128x160.png')
    receipt={'schemaVersion':1,'status':'candidate-unapproved','scope':'original-visible side four-anchor successor only',
        'fit':{'path':str(cfg_path.relative_to(ROOT)).replace('\\','/'),'sha256':sha(cfg_path)},
        'baseFit':cfg['baseFit'], 'driver':{'path':str(Path(__file__).relative_to(ROOT)).replace('\\','/'),'sha256':sha(Path(__file__))},
        'sources':{'cardinal':{'path':base['cardinals']['source'],'sha256':base['cardinals']['sha256']},
            'companion':{'path':base['companion']['source'],'sha256':base['companion']['sha256']},
            'standing':{'path':base['standing']['path'],'sha256':base['standing']['sha256']}},
        'helpers':{'street':sha(ROOT/'tools/build-street-character-sprites.py'),
            'paintedWalk':sha(ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py')},
        'neutralRgbaSha256':cfg['neutralRgbaSha256'],'sideFindings':results,
        'outputs':{p.name:sha(p) for p in sorted(OUT.glob('*.png'))}}
    (OUT/'pilot-source.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'receipt':str(OUT/'pilot-source.json'),'sha256':sha(OUT/'pilot-source.json'), 'pngCount':len(receipt['outputs'])}))


if __name__=='__main__': main()
