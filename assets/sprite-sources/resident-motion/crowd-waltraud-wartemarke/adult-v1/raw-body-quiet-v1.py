"""Portable Waltraud quiet source renderer with her admitted own action transport."""
import hashlib
import io
import json
import math
import struct

import numpy as np
from PIL import Image
from scipy.interpolate import PchipInterpolator
from scipy.ndimage import binary_fill_holes, label, map_coordinates

from painted_walk import premul, sample, unpack, warp_layer


def write(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n')


def rgba(path):
    with Image.open(path) as image:
        return np.asarray(image.convert('RGBA')).copy()


def native(image, settings):
    scale = settings['figure'] / 400
    px, py = settings['pivot']
    return image.convert('RGBa').transform(tuple(settings['cell']), Image.Transform.AFFINE,
        (1 / scale, 0, 256 - px / scale, 0, 1 / scale, 472 - py / scale),
        Image.Resampling.BICUBIC).convert('RGBA')


def smoothstep(t):
    return t * t * (3 - 2 * t)


def envelope(action, phase):
    if action == 'idle':
        if phase in (0, 8, 16):
            return 0
        return math.sin(phase * math.tau / 16)
    if phase <= 8:
        return smoothstep(phase / 8)
    return 1 - smoothstep((phase - 8) / 7)


def field(action, phase, spec):
    amount = envelope(action, phase)
    head = [amount * v for v in spec['headDxDy']]
    upper = [amount * v for v in spec['forebodyDxDy']]
    values = [[head[i], head[i], upper[i], upper[i], 0, 0] for i in range(2)]
    curves = [PchipInterpolator(controls['nodesY'], v) for v in values]
    rows = np.linspace(0, 511, 4097)
    jac = float((1 + curves[1].derivative()(rows)).min())
    assert jac > .5, ('Orientation-preserving own field', action, phase, jac)
    for curve, i in zip(curves, range(2)):
        for lo, hi, delta in ((0, 145, head[i]), (170, 353, upper[i]), (414, 511, 0)):
            np.testing.assert_array_equal(curve(np.arange(lo, hi + 1)), delta)
    return {'nodesY': controls['nodesY'], 'dx': values[0], 'dy': values[1],
            'headDxDy': head, 'forebodyDxDy': upper, 'envelope': amount, 'minimumVerticalJacobian': jac}


def check_translation(source, candidate, rows, offset):
    lo, hi = rows
    assert all(d == round(d) for d in offset)
    dx, dy = (int(round(d)) for d in offset)
    top, bottom = max(lo, -dy), min(hi + 1, 512 - dy)
    left, right = max(0, -dx), min(512, 512 - dx)
    yy, xx = np.where(source[lo:hi + 1, :, 3] > 0)
    assert np.all((xx >= left) & (xx < right) & (yy + lo >= top) & (yy + lo < bottom))
    old = source[top:bottom, left:right]
    new = candidate[top + dy:bottom + dy, left + dx:right + dx]
    np.testing.assert_array_equal(new, old)
    return int((old[..., 3] > 0).sum())


def check_named(source, candidate, region, offset):
    x0, y0, x1, y1 = region
    dx, dy = (int(round(d)) for d in offset)
    old = source[y0:y1, x0:x1]
    actual = candidate[y0 + dy:y1 + dy, x0 + dx:x1 + dx]
    assert np.count_nonzero(old[..., 3]) > 0
    np.testing.assert_array_equal(actual, old)
    return int(np.count_nonzero(old[..., 3]))


def checked_hole_transport(baseline, support, offset, action, phase, moved):
    # Original holes and their one-pixel rings belong to the proven rigid forebody band.
    original = binary_fill_holes(baseline) & ~baseline
    target = binary_fill_holes(support) & ~support
    yy, xx = np.where(original)
    assert len(yy) > 0 and yy.min() > 170 and yy.max() < 353
    assert all(delta == round(delta) for delta in offset)
    dx, dy = (int(round(delta)) for delta in offset)
    ty, tx = yy + dy, xx + dx
    assert np.all((tx > 0) & (tx < 511) & (ty > 0) & (ty < 511))
    expected = np.zeros_like(original)
    expected[ty, tx] = True
    unexpected, missing = target & ~expected, expected & ~target
    if np.any(unexpected | missing):
        moved.save(OUT / f'unaccepted-{action}-{phase:02d}-source.png')
        write(OUT / f'unaccepted-{action}-{phase:02d}-hole-mask.json',
              {'unexpectedYX': np.argwhere(unexpected).tolist(), 'missingYX': np.argwhere(missing).tolist()})
        raise AssertionError(('Complete original hole transport', action, phase, int(unexpected.sum()), int(missing.sum())))
    checks = {'sourceOriginalHolePixels': int(original.sum()), 'movedEnclosedHolePixels': int(target.sum()),
              'sourceComponents': int(label(original)[1]), 'movedComponents': int(label(target)[1]),
              'sourceBandIntegerDisplacement': [dx, dy], 'completeTransportedMaskExact': True,
              'historicalFixedScreenNewHolePixels': int((target & ~original).sum())}
    if action == 'idle' and phase == 4:
        assert checks['historicalFixedScreenNewHolePixels'] == 6
        # A real new one-pixel deletion in supported paint must remain detectable.
        interior = (support[1:-1, 1:-1] & support[:-2, 1:-1] & support[2:, 1:-1] &
                    support[1:-1, :-2] & support[1:-1, 2:])
        iy, ix = np.argwhere(interior)[0] + 1
        tampered = support.copy()
        tampered[iy, ix] = False
        artificial = binary_fill_holes(tampered) & ~tampered
        assert artificial[iy, ix] and not expected[iy, ix] and not np.array_equal(artificial, expected)
        checks['genuineNewHoleNegativeControlRejectedAtYX'] = [int(iy), int(ix)]
    return checks


def fractional_pose_checks(source, neutral, result, values, action, phase, moved, run_negatives):
    # Independently bind source-owned plateaus to target sample coordinates.
    # These reference offsets do not use the whole-image nonlinear inverse.
    yy, xx = np.mgrid[:512, :512]
    sy, sx = yy.astype(float), xx.astype(float)
    owned = {}
    for name, (lo, hi), offset in (
            ('head', (0, 145), values['headDxDy']),
            ('coatArmsAndFolder', (170, 353), values['forebodyDxDy']),
            ('lowerCuffsAndShoes', (414, 511), (0, 0))):
        dx, dy = offset
        local_x, local_y = xx - dx, yy - dy
        domain = (np.floor(local_y) >= lo) & (np.ceil(local_y) <= hi) & (local_x >= 0) & (local_x <= 511)
        assert not any(np.any(domain & old) for old in owned.values())
        assert np.any(domain)
        owned[name] = domain
        sy[domain], sx[domain] = local_y[domain], local_x[domain]
    union = np.logical_or.reduce(list(owned.values()))
    source_pm = premul(source)
    reference_pm = sample(source_pm, sx, sy)
    reference = np.asarray(unpack(reference_pm))
    unequal = union & np.any(result != reference, axis=2)
    if np.any(unequal):
        path = OUT / f'unaccepted-{action}-{phase:02d}-source.png'
        moved.save(path)
        detail = [{'targetYX': [int(y), int(x)], 'sourceYX': [float(sy[y, x]), float(sx[y, x])],
                   'actualRGBA': result[y, x].tolist(), 'analyticRGBA': reference[y, x].tolist()}
                  for y, x in np.argwhere(unequal)]
        write(OUT / f'unaccepted-{action}-{phase:02d}-rigid-material.json', detail)
        raise AssertionError(('Literal analytic rigid material', action, phase, len(detail)))

    support = result[..., 3] >= 20
    baseline = neutral[..., 3] >= 20
    original = binary_fill_holes(baseline) & ~baseline
    actual = binary_fill_holes(support) & ~support
    orig_y, _ = np.where(original)
    assert len(orig_y) > 0 and orig_y.min() > 170 and orig_y.max() < 353
    # Compare the real analytic alpha to a coverage-only reference that sets the
    # two original openings to exactly the existing A20 floor. This reference
    # never supplies output paint. A missing pixel needs actual source-aperture
    # influence sufficient to cross the existing support boundary.
    original_alpha = source_pm[..., 3].copy()
    assert np.all(original_alpha[original] == 0)
    floor_filled_alpha = original_alpha.copy()
    floor_filled_alpha[original] = 20 / 255
    fill = map_coordinates(floor_filled_alpha, [sy, sx], order=1, mode='constant', cval=0, prefilter=False)
    fill_supported = np.rint(fill * 255) >= 20
    real_supported = reference[..., 3] >= 20
    expected = owned['coatArmsAndFolder'] & ~real_supported & fill_supported
    extra, missing = actual & ~expected, expected & ~actual
    if np.any(extra | missing):
        moved.save(OUT / f'unaccepted-{action}-{phase:02d}-source.png')
        write(OUT / f'unaccepted-{action}-{phase:02d}-fractional-hole-mask.json', {
            'unexpectedYX': np.argwhere(extra).tolist(), 'missingYX': np.argwhere(missing).tolist(),
            'originalHoleYX': np.argwhere(original).tolist(), 'analyticalExpectedHoleYX': np.argwhere(expected).tolist(),
            'actualHoleYX': np.argwhere(actual).tolist(), 'field': values})
        raise AssertionError(('Analytic coverage of original forebody openings', action, phase,
                              int(extra.sum()), int(missing.sum())))
    holes = {'mode': 'fractional source-aperture coverage', 'sourceOriginalHolePixels': int(original.sum()),
             'movedEnclosedHolePixels': int(actual.sum()), 'sourceComponents': int(label(original)[1]),
             'movedComponents': int(label(actual)[1]), 'completeAnalyticApertureMaskExact': True,
             'supportedFillUsesOnlyOriginalOpeningsAtAlpha20': True}

    rigid_support = {name: int((domain & real_supported).sum()) for name, domain in owned.items()}
    assert all(count > 0 for count in rigid_support.values())
    named = {}
    for name, witness in controls['witnesses'].items():
        x0, y0, x1, y1 = witness['bounds']
        band = {'head': 'head', 'upper': 'coatArmsAndFolder', 'feet': 'lowerCuffsAndShoes'}[witness['part']]
        domain = owned[band] & (np.floor(sx) >= x0) & (np.ceil(sx) < x1) & (np.floor(sy) >= y0) & (np.ceil(sy) < y1)
        count = int((domain & real_supported).sum())
        assert count > 0, ('Missing sampled own material witness', name)
        named[name] = count
    if run_negatives:
        wrong = np.asarray(unpack(sample(source_pm, sx + .5, sy)))
        mismatch = int((union & real_supported & np.any(wrong != result, axis=2)).sum())
        assert mismatch > 0, 'Wrong half-pixel reference must fail on actual supported paint'
        interior = (support[1:-1, 1:-1] & support[:-2, 1:-1] & support[2:, 1:-1] &
                    support[1:-1, :-2] & support[1:-1, 2:])
        iy, ix = np.argwhere(interior)[0] + 1
        tampered = support.copy()
        tampered[iy, ix] = False
        deliberate = binary_fill_holes(tampered) & ~tampered
        assert deliberate[iy, ix] and not expected[iy, ix] and not np.array_equal(deliberate, expected)
        holes['genuineNewHoleNegativeControlRejectedAtYX'] = [int(iy), int(ix)]
        holes['wrongHalfPixelReferenceChangedSupportedSamples'] = mismatch
    return holes, rigid_support, named


def checked_pose(action, phase, spec, source, neutral, run_negatives):
    values = field(action, phase, spec)
    moved = warp_layer(source, values['nodesY'], values['dx'], values['dy'])
    result = np.asarray(moved).copy()
    source_alpha = neutral[..., 3]
    support = result[..., 3] >= 20
    baseline = source_alpha >= 20
    integer_plateaus = all(d == round(d) for d in values['headDxDy'] + values['forebodyDxDy'])
    labels, _ = label(support)
    assert len([count for count in np.bincount(labels.ravel())[1:] if count >= 15]) == 1
    a1 = result[..., 3] > 0
    assert np.any(a1) and not np.any(a1[[0, -1]]) and not np.any(a1[:, [0, -1]])
    assert int(np.where(support)[0].max()) == 471
    assert np.array_equal(result[414:], neutral[414:])

    if values['envelope'] == 0:
        assert np.array_equal(result[..., 3], source_alpha)
        assert np.array_equal(result[source_alpha > 0], neutral[source_alpha > 0])
        empty = source_alpha == 0
        restored = int((empty & np.any(result != neutral, axis=2)).sum())
        result[empty] = neutral[empty]
        assert np.array_equal(result, neutral)
    else:
        restored = 0
    if integer_plateaus:
        holes = checked_hole_transport(baseline, support, values['forebodyDxDy'], action, phase, moved)
        exact_rows = {
            'head': check_translation(neutral, result, (0, 145), values['headDxDy']),
            'coatArmsAndFolder': check_translation(neutral, result, (170, 353), values['forebodyDxDy']),
            'lowerCuffsAndShoes': check_translation(neutral, result, (414, 511), (0, 0))
        }
        named = {}
        for name, witness in controls['witnesses'].items():
            part = witness['part']
            offset = {'head': values['headDxDy'], 'upper': values['forebodyDxDy'], 'feet': (0, 0)}[part]
            named[name] = check_named(neutral, result, witness['bounds'], offset)
        material_mode = 'literal integral RGBA transport'
    else:
        holes, exact_rows, named = fractional_pose_checks(
            source, neutral, result, values, action, phase, moved, run_negatives)
        material_mode = 'literal same-sampler analytic fractional RGBA in whole source-owned stencils'
    return Image.fromarray(result), {'action': action, 'phase': phase, 'field': values,
        'rigidMaterialMode': material_mode, 'rigidPaintWitnesses': exact_rows, 'namedPaintWitnesses': named,
        'stationaryWholeFootRGBAExact': True, 'newEnclosedHoles': 0, 'originalHoleTransport': holes,
        'neutralAlphaZeroRgbMetadataOnly': restored, 'sourceSoleRowAlpha20': 471}


def export_cell(image, settings, neutral_native):
    cell = native(image, settings)
    data = np.asarray(cell)
    scale = settings['figure'] / 400
    feet_row = math.ceil(settings['pivot'][1] + (424 - 472) * scale)
    assert np.array_equal(data[feet_row:], neutral_native[feet_row:])
    alpha = data[..., 3] > 0
    assert np.any(alpha) and not np.any(alpha[[0, -1]]) and not np.any(alpha[:, [0, -1]])
    return cell, feet_row


def packed_field(values):
    names = ('nodesY', 'dx', 'dy', 'headDxDy', 'forebodyDxDy')
    groups = [values[name] for name in names]
    assert [len(group) for group in groups] == [6, 6, 6, 2, 2]
    flat = [float(value) for group in groups for value in group]
    flat.extend((float(values['envelope']), float(values['minimumVerticalJacobian'])))
    assert len(flat) == 24 and all(np.isfinite(flat))
    return struct.pack('<24d', *flat)


def png_bytes(image):
    stream = io.BytesIO()
    image.save(stream, format='PNG')
    return stream.getvalue()


def run(source_path, out, pure_controls, action, phases):
    global controls, OUT
    controls, OUT = pure_controls, out
    assert controls['actor'] == 'crowd-waltraud-wartemarke'
    assert controls['sourcePivot'] == [256, 472] and controls['sourceFigurePixels'] == 400
    assert controls['sourceClockForPrep'] == 15.145
    assert controls['nodesY'] == [0, 145, 170, 353, 414, 511]
    assert action in ('idle', 'look', 'success', 'failure') and tuple(phases) == tuple(range(16))
    neutral = rgba(source_path)
    assert neutral.shape == (512, 512, 4)
    assert not np.any((neutral[..., 3] > 0) & (neutral[..., 3] < 20))
    source = Image.fromarray(neutral)
    native_neutral = {tier: np.asarray(native(source, settings)) for tier, settings in controls['native'].items()}
    spec = controls['actions'][action]
    results = {}
    for phase in range(17 if action == 'idle' else 16):
        image, row = checked_pose(action, phase, spec, source, neutral, phase == 1)
        assert bool(np.array_equal(np.asarray(image), neutral)) == (row['field']['envelope'] == 0)
        native_bytes = {
            tier: png_bytes(export_cell(image, settings, native_neutral[tier])[0])
            for tier, settings in controls['native'].items()
        }
        packed = packed_field(row['field'])
        if phase == 16:
            first = results['action-idle-00']
            assert png_bytes(image) == first['source'].read_bytes()
            assert native_bytes == first['nativeBytes']
            assert packed == packed_field(first['sourceField'])
            continue
        role = f'action-{action}-{phase:02d}'
        case = out / role
        case.mkdir()
        path = case / 'source.png'
        image.save(path)
        assert np.array_equal(rgba(path), np.asarray(image))
        if phase == 1:
            assert row['originalHoleTransport']['wrongHalfPixelReferenceChangedSupportedSamples'] > 0
        results[role] = {'source': path, 'nativeBytes': native_bytes, 'sourceField': row['field'],
                         'fieldBytes': len(packed), 'fieldSHA256': hashlib.sha256(packed).hexdigest()}
        print(json.dumps({'closedQuietSourceRole': role}), flush=True)
    assert len(results) == 16
    return results
