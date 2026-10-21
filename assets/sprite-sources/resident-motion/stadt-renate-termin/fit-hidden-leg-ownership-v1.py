"""Static source-space ownership matte for Renate's measured own far legs.

Applies an anatomical outer trouser contour to raw companion pixels before
the unchanged uniform registration. The complete boot remains latent; this
does not author gait, masks in world space, or runtime cells.
"""
from pathlib import Path
import hashlib
import importlib.util
import json

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
OUT = ROOT / 'output/ambient-city-animation/renate-termin-leg-ownership-v1'
spec = importlib.util.spec_from_file_location('bootfit', HERE / 'fit-hidden-boots-v1.py')
bootfit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bootfit)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pinned_json(entry):
    path = ROOT / entry['path']
    if sha(path) != entry['sha256']:
        raise ValueError(f'Input pin changed: {path}')
    return json.loads(path.read_text(encoding='utf8'))


def bounds_for_side(measured, side):
    fit = pinned_json(measured['measuredBootFit'])
    return fit['sides'][side]['rawOwnFarComponentBoundsXYXY'], fit


def source_space_mask(raw_shape, component, measurement, trace, margin_work, feather_work, full_at_work):
    """Build within raw source coordinates, then carry with the same limb map."""
    scale = measurement['effectiveSourceScale']
    px, py = measurement['sourcePivotXY']
    ox, oy = 256 - px * scale, 472 - py * scale
    left, top, right, bottom = component
    x0, y0, x1, y1 = left - 2, top - 2, right + 2, bottom + 2
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(float)
    trace_work = np.asarray(trace['originalOuterContourWorkingY_X'], dtype=float)
    raw_trace_y = (trace_work[:, 0] - oy) / scale
    raw_trace_x = (trace_work[:, 1] - ox) / scale
    contour_x = np.interp(yy, raw_trace_y, raw_trace_x)
    margin_raw = margin_work / scale
    feather_raw = feather_work / scale
    if trace['outerSide'] == 'left':
        signed = xx - contour_x - margin_raw
    else:
        signed = contour_x - margin_raw - xx
    coverage = np.clip(signed / feather_raw, 0.0, 1.0)
    # By the distal cuff, the original silhouette has re-entered the donor
    # outline. Retain the entire boot/heel/toe/sole at mask 1 in source space.
    coverage[oy + yy * scale >= full_at_work] = 1.0
    raw_mask = np.full(raw_shape[:2], 255, dtype=np.uint8)
    raw_mask[y0:y1, x0:x1] = np.rint(coverage * 255).astype(np.uint8)
    return raw_mask, (ox, oy), list(zip(raw_trace_x.tolist(), raw_trace_y.tolist()))


def apply_mask(image, mask, component):
    array = np.asarray(image).copy()
    left, top, right, bottom = component
    x0, y0, x1, y1 = left - 2, top - 2, right + 2, bottom + 2
    alpha = array[y0:y1, x0:x1, 3].astype(float)
    array[y0:y1, x0:x1, 3] = np.rint(alpha * (mask[y0:y1, x0:x1] / 255.0)).astype(np.uint8)
    roi = array[y0:y1, x0:x1]
    roi[roi[:, :, 3] == 0, :3] = 0
    return Image.fromarray(array, 'RGBA')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    recipe_path = HERE / 'source-ownership-fit-v1.json'
    recipe = json.loads(recipe_path.read_text(encoding='utf8'))
    measured = pinned_json(recipe['measuredBootReceipt'])
    boot = pinned_json(recipe['measuredBootFit'])
    if sha(ROOT / recipe['independentBootReview']['path']) != recipe['independentBootReview']['sha256']:
        raise ValueError('Independent measured-boot review changed')
    card = bootfit.bound_image(boot['sources']['cardinals'])
    own = bootfit.bound_image(boot['sources']['ownCompleteLegs'])
    base = pinned_json(boot['baseFit'])
    result = {}
    for direction in ('right', 'left'):
        component, _ = bounds_for_side(recipe, direction)
        old = measured['measurement'][direction]
        trace = recipe['sides'][direction]
        mask, origin, raw_trace = source_space_mask(
            own.size[::-1] + (4,), component, old, trace,
            recipe['method']['insideMarginWorkingPixels'],
            recipe['method']['featherWorkingPixels'],
            recipe['method']['completeBootMaskOneFromWorkingY'])
        own_arr = np.asarray(own)
        red = (own_arr[:, :, 0].astype(int) > 1.22 * own_arr[:, :, 1]) & (
            own_arr[:, :, 0].astype(int) > 1.1 * own_arr[:, :, 2]) & (
            own_arr[:, :, 0] > 35) & (own_arr[:, :, 3] > 150)
        x0, y0, x1, y1 = component
        red_roi = red[y0:y1, x0:x1]
        mask_roi = mask[y0:y1, x0:x1]
        red_modified = int(np.count_nonzero(red_roi & (mask_roi < 255)))
        if red_modified:
            raise ValueError(f'{direction}: ownership matte touches {red_modified} own burgundy boot pixels')
        masked_raw = apply_mask(own, mask, component)
        scale = old['effectiveSourceScale']
        pivot = old['sourcePivotXY']
        registered = bootfit.register(masked_raw, component, pivot, scale)
        original_view = base['cardinals']['views'][direction]
        original = bootfit.register(card, original_view['bounds'], original_view['pivot'],
            400 / (original_view['bounds'][3] - original_view['bounds'][1]))
        composite, exterior, exact = bootfit.occluded_composite(original, registered)
        prior = bootfit.bound_image({'path':f'output/ambient-city-animation/renate-termin-boot-fit-v1/{direction}-uniform-own-far.png',
            'sha256':measured['output'][f'{direction}-uniform-own-far.png']})
        pa, na = np.asarray(prior), np.asarray(registered)
        boot_equal_from430 = bool(np.array_equal(pa[430:], na[430:]))
        if not boot_equal_from430 or not exact:
            raise ValueError(f'{direction}: boot region or original visible paint changed')
        bbox = component
        Image.fromarray(mask, 'L').crop((bbox[0]-2,bbox[1]-2,bbox[2]+2,bbox[3]+2)).save(OUT/f'{direction}-raw-source-ownership-mask.png')
        masked_raw.crop((bbox[0]-2,bbox[1]-2,bbox[2]+2,bbox[3]+2)).save(OUT/f'{direction}-masked-own-raw-component.png')
        registered.save(OUT/f'{direction}-masked-own-far-registered.png')
        composite.save(OUT/f'{direction}-original-visible-composite.png')
        for theme in ('light', 'dark'):
            bootfit.panel([original, prior, registered, composite],theme).save(OUT/f'{direction}-comparison-{theme}.png')
            bootfit.panel([original, prior, registered, composite],theme,(145,335,365,480),3).save(OUT/f'{direction}-hip-cuff-boot-{theme}.png')
            for cell,pivot_export,paint_height in [([128,160],[64,150],132),([96,120],[48,112.5],99),([64,80],[32,75],66)]:
                pair=[bootfit.export(im,cell,pivot_export,paint_height) for im in (original,composite)]
                if theme == 'light':
                    pair[0].save(OUT/f'{direction}-{cell[0]}x{cell[1]}-original-alpha.png')
                    pair[1].save(OUT/f'{direction}-{cell[0]}x{cell[1]}-composite-alpha.png')
                bootfit.panel(pair,theme).save(OUT/f'{direction}-{cell[0]}x{cell[1]}-{theme}.png')
        result[direction] = {'sourceOriginWorkingXY': origin,
            'sourceSpaceContourRawXY': raw_trace, 'redBootSourcePixelsModified':red_modified,
            'registeredBootRows430DownExact':boot_equal_from430,
            'originalVisibleRgbaExact':exact, 'donorOpaqueExteriorPixels':exterior,
            'measuredDonorOpaqueExteriorPixels':old['donorOpaqueExteriorPixels']}
    receipt={'schemaVersion':1,'status':'candidate-static-source-space-ownership-only',
        'recipe':{'path':str(recipe_path.relative_to(ROOT)).replace('\\','/'),'sha256':sha(recipe_path)},
        'driver':{'path':str(Path(__file__).relative_to(ROOT)).replace('\\','/'),'sha256':sha(Path(__file__))},
        'measuredBootReceipt':recipe['measuredBootReceipt'],'measuredBootFit':recipe['measuredBootFit'],
        'independentBootReview':recipe['independentBootReview'],'sourcePins':boot['sources'],
        'helper':{'street':sha(ROOT/'tools/build-street-character-sprites.py')},
        'measurement':result,
        'output':{p.name:sha(p) for p in sorted(OUT.glob('*.png'))}}
    (OUT/'ownership-source.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'receiptSha256':sha(OUT/'ownership-source.json'),'measurements':result,
        'pngCount':len(receipt['output'])}))


if __name__ == '__main__':
    main()
