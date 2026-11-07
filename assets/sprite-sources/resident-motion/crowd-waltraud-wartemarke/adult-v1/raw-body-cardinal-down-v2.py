"""Portable own Down cardinal rendering with the admitted exact operation order."""
import hashlib
import importlib.util
import json
import struct

import numpy as np
from PIL import Image
from scipy.interpolate import PchipInterpolator
from scipy.ndimage import binary_fill_holes, label

FEET = ("screen-left", "screen-right")


def field(foot, dy):
    nodes = SPEC['clothNodesY'][foot]
    assert nodes == sorted(set(nodes)) and STATIONARY in nodes and PLATEAU in nodes
    t = np.clip((np.asarray(nodes) - STATIONARY) / (PLATEAU - STATIONARY), 0, 1)
    dys = (dy * t * t * (3 - 2 * t)).tolist()
    curve = PchipInterpolator(nodes, dys)
    dense = np.linspace(0, 511, 4097)
    min_jacobian = float(np.min(1 + curve.derivative()(dense)))
    assert min_jacobian > .5
    assert np.all(curve(np.linspace(0, STATIONARY, 1025)) == 0)
    assert np.allclose(curve(np.linspace(PLATEAU, 511, 1025)), dy, rtol=0, atol=1e-10)
    target = np.arange(512, dtype=float)
    inverse = target.copy()
    for _ in range(10):
        inverse = target - curve(np.clip(inverse, 0, 511))
    residual = float(np.max(np.abs(inverse + curve(np.clip(inverse, 0, 511)) - target)))
    assert residual < 1e-7
    return {'nodes_y': nodes, 'dx': [0] * len(nodes), 'dy': dys, 'footDxDy': [0, dy],
            'minimumVerticalJacobian': min_jacobian, 'inverseResidualMaximum': residual,
            'stationaryThroughY': STATIONARY, 'wholeFootRigidFromY': PLATEAU}


def phase_displacement(key, foot):
    # Own Down: left arc starts at phase5/8; right starts half a cycle later.
    shift = .5 if foot == 'screen-right' else 0
    local = ((key % 16) / 16 + shift - .625) % 1
    if local >= .5:
        return 0
    knots = ((0, 0), (.125, -4), (.375, -5), (.5, 0))
    for (start, a), (end, b) in zip(knots, knots[1:]):
        if local <= end:
            u = (local - start) / (end - start)
            return a + (b - a) * u * u * (3 - 2 * u)
    raise AssertionError('Phase arc out of bounds')


def packed_field(values):
    arrays = [values[k] for k in ('nodes_y', 'dx', 'dy', 'footDxDy')]
    assert [len(a) for a in arrays] == [6, 6, 6, 2]
    flat = [float(v) for a in arrays for v in a]
    assert all(np.isfinite(flat))
    return struct.pack('<20d', *flat)


def compose(*layers):
    image = Image.new('RGBA', (512, 512))
    for layer in layers:
        image = Image.alpha_composite(image, Image.fromarray(layer))
    return image


def sole_row(alpha):
    return int(np.where(alpha >= 20)[0].max())


def fractional_material(source, values, foot, case, original, foreign):
    # Independent true-inverse oracle and the narrow owned rigid-coverage rule.
    from painted_walk import premul, sample, unpack, warp_layer
    sx, sy, residual = transport.actual_inverse(values)
    yy, xx = np.mgrid[:512, :512]
    dy = values['footDxDy'][1]
    assert values['footDxDy'][0] == 0 and dy != round(dy)
    assert np.array_equal(sx, xx)
    assert np.array_equal(sy[:STATIONARY + 1], yy[:STATIONARY + 1])
    source_image = Image.fromarray(source)
    source_pm = transport.explicit_premul(source)
    expected_pm, taps = transport.explicit_four_taps(source_pm, sx, sy)
    shared_pm = sample(premul(source_image), sx, sy)
    difference = float(np.max(np.abs(expected_pm - shared_pm)))
    assert difference <= 32 * np.finfo(float).eps, ('Independent premultiplied sample mismatch', foot, difference)
    expected = transport.explicit_quantize(expected_pm)
    candidate = np.asarray(warp_layer(source_image, values['nodes_y'], values['dx'], values['dy'])).copy()
    assert np.array_equal(candidate, np.asarray(unpack(shared_pm)))
    Image.fromarray(candidate).save(case / (foot + '-shared-fractional.png'))
    assert np.array_equal(candidate[:STATIONARY + 1], source[:STATIONARY + 1])
    rigid = taps['allRigid']
    assert np.array_equal(sy[rigid], yy[rigid] - dy), 'Exact rigid inverse'
    owns_rigid_material = np.zeros_like(rigid)
    crosses_plateau = np.zeros_like(rigid)
    exclusively_owned = np.ones_like(rigid)
    positive_count = np.zeros(rigid.shape, dtype=np.uint8)
    painted_count = np.zeros_like(positive_count)
    for tx, ty, weight in zip(taps['x'], taps['y'], taps['w']):
        inside = (tx >= 0) & (tx < 512) & (ty >= 0) & (ty < 512)
        ix, iy = np.clip(tx, 0, 511), np.clip(ty, 0, 511)
        rgba = source[iy, ix]
        visible_source = rgba[..., 3] > 0
        positive = weight > 0
        positive_count += positive
        painted_count += positive & visible_source
        same_original = np.all(rgba == original[iy, ix], axis=2)
        valid_paint = visible_source | np.all(rgba == 0, axis=2)
        exclusively_owned &= ~positive | (inside & same_original & valid_paint & ~foreign[iy, ix])
        owns_rigid_material |= (weight > 0) & inside & (ty >= PLATEAU) & visible_source
        crosses_plateau |= (weight > 0) & inside & (ty < PLATEAU)
    mixed = owns_rigid_material & crosses_plateau
    relevant = rigid | mixed
    mismatch = relevant & np.any(candidate != expected, axis=2)
    mismatches = []
    for y, x in np.argwhere(mismatch):
        contributors = []
        for tx, ty, weight in zip(taps['x'], taps['y'], taps['w']):
            if weight[y, x] > 0:
                ox, oy = int(tx[y, x]), int(ty[y, x])
                assert 0 <= ox < 512 and 0 <= oy < 512
                contributors.append({'xy': [ox, oy], 'weight': float(weight[y, x]), 'rgba': source[oy, ox].tolist()})
        mismatches.append({'targetXY': [int(x), int(y)], 'inverseXY': [float(sx[y, x]), float(sy[y, x])],
                           'rigid': bool(rigid[y, x]), 'actualRGBA': candidate[y, x].tolist(),
                           'expectedRGBA': expected[y, x].tolist(), 'contributors': contributors})
    (case / (foot + '-literal-discrepancies.json')).write_text(json.dumps(mismatches, indent=2) + '\n')
    jacobian = 1 + PchipInterpolator(values['nodes_y'], values['dy']).derivative()(np.clip(sy, 0, 511))
    low_coverage = (expected[..., 3] >= 1) & (expected[..., 3] < 20)
    shared_zero = np.all(candidate == 0, axis=2)
    eligible = (rigid & ~mixed & owns_rigid_material & exclusively_owned & (positive_count == 2) &
                (painted_count == 1) & (jacobian == 1) & low_coverage & shared_zero)
    assert not np.any(mismatch & ~eligible), ('Unexplained literal whole-foot RGBA mismatch', foot, int((mismatch & ~eligible).sum()))
    shared = candidate.copy()
    candidate[eligible] = expected[eligible]
    assert np.array_equal(np.any(candidate != shared, axis=2), eligible)
    assert np.array_equal(candidate[shared[..., 3] >= 20], shared[shared[..., 3] >= 20])
    assert np.array_equal(candidate[relevant], expected[relevant])
    Image.fromarray(candidate).save(case / (foot + '-owned-rigid-fractional.png'))
    coverage = transport.source_coverage(source, values, candidate, expected, taps, rigid, foot, case)
    interior = rigid & (expected[..., 3] >= 20)
    shifted_pm, _ = transport.explicit_four_taps(source_pm, sx, sy + .5)
    negative_count = int((interior & np.any(transport.explicit_quantize(shifted_pm) != expected, axis=2)).sum())
    assert negative_count > 0, ('Half-pixel inverse control is vacuous', foot)
    return candidate, {'field': values, 'independentPremulDifference': difference, 'inverseResidual': residual,
                       'rigidAndMixedLiteralRGBAExact': True, 'mixedSourceFootTargets': int(mixed.sum()),
                       'positiveSourceCoverage': coverage, 'wrongHalfPixelChangedSupportedSamples': negative_count,
                       'fractionalPixelReplacements': int(eligible.sum()), 'supportedAndMixedRGBAUnchanged': True}


def checked_body(layers, neutral, parts, original_sole):
    left, right = (layers[foot] for foot in FEET)
    assert not np.any((left[..., 3] > 0) & (right[..., 3] > 0))
    image = compose(left, right, parts['contact'], parts['forebody'])
    body = np.asarray(image)
    assert np.array_equal(body[:STATIONARY + 1], neutral[:STATIONARY + 1])
    for foot in FEET:
        layer = layers[foot]
        y, x = np.where(layer[..., 3] > 0)
        assert np.array_equal(body[y, x], layer[y, x]), ('Actual lower paint visibility', foot)
        support = (neutral[STATIONARY, :, 3] >= 20) & (layer[STATIONARY + 1, :, 3] >= 20)
        assert np.any(support), ('Contact join detached', foot)
    assert sole_row(body[..., 3]) == original_sole
    positive = body[..., 3] > 0
    assert not np.any(positive[[0, -1]]) and not np.any(positive[:, [0, -1]])
    supported = body[..., 3] >= 20
    original_supported = neutral[..., 3] >= 20
    assert label(supported)[1] == 1
    assert not np.any((binary_fill_holes(supported) & ~supported) & ~(binary_fill_holes(original_supported) & ~original_supported))
    return image


def scale_field(base_field, strength):
    scaled = dict(base_field)
    for group in ('dx', 'dy', 'footDxDy'):
        scaled[group] = [value * strength for value in base_field[group]]
    assert all(value == 0 for value in scaled['dx'])
    assert scaled['dy'][0] == scaled['dy'][1] == 0
    assert scaled['dy'][-2] == scaled['dy'][-1] == scaled['footDxDy'][1]
    curve = PchipInterpolator(scaled['nodes_y'], scaled['dy'])
    scaled['minimumVerticalJacobian'] = float(np.min(1 + curve.derivative()(np.linspace(0, 511, 4097))))
    assert scaled['minimumVerticalJacobian'] > .5
    _, _, scaled['inverseResidualMaximum'] = transport.actual_inverse(scaled)
    return scaled


def render_strength(entry_phase, strength, fields, parts, neutral, case):
    layers = {}
    records = {}
    for foot in FEET:
        values = fields[foot]
        dy = values['footDxDy'][1]
        if dy == 0:
            layers[foot] = parts[foot]
            records[foot] = {'field': values, 'wholePlantedLowerRGBAExact': True}
        elif dy == round(dy):
            moved, records[foot] = transport.integer_layer(parts[foot], values, foot, entry_phase, [])
            layers[foot] = np.asarray(moved)
        else:
            case.mkdir(parents=True, exist_ok=True)
            others = [parts[name] for name in (*FEET, 'contact', 'forebody') if name != foot]
            foreign = np.any(np.stack(others) != 0, axis=(0, 3))
            layers[foot], records[foot] = fractional_material(parts[foot], values, foot, case, neutral, foreign)
    image = checked_body(layers, neutral, parts, SPEC['sourcePivot'][1] - 1)
    if strength == 0:
        assert np.array_equal(np.asarray(image), neutral)
    return image, records


def run(source, out, controls, phases):
    """Regenerate first Down source poses entirely from fresh raw own parts."""
    global SPEC, STATIONARY, PLATEAU, transport
    SPEC = controls['fields']['down']
    STATIONARY = SPEC['stationaryThroughY']
    PLATEAU = SPEC['wholeFootRigidFromY']
    assert SPEC['sourcePivot'] == [256, 472] and SPEC['sourceFigure'] == 400
    assert tuple(phases) in (tuple(range(8)), tuple(range(8, 16)))
    path = source / 'mixed-material-helper-v3-exact-half.py'
    module_spec = importlib.util.spec_from_file_location('waltraud_portable_owned_material', path)
    transport = importlib.util.module_from_spec(module_spec)
    module_spec.loader.exec_module(transport)
    transport.CONTROLS = {foot + 'Witnesses': SPEC['witnesses'][foot] for foot in FEET}
    root = source / 'raw-family-neutral-parts-v2'
    source_names = {'screen-left': 'screen-left-lower', 'screen-right': 'screen-right-lower',
                    'contact': 'unresolved-stationary-contact', 'forebody': 'forebody', 'neutral': 'neutral'}
    parts = {}
    for role, name in source_names.items():
        with Image.open(root / ('down-' + name + '.png')) as opened:
            parts[role] = np.asarray(opened.convert('RGBA')).copy()
    neutral = parts['neutral']
    assert np.array_equal(np.asarray(compose(*(parts[k] for k in (*FEET, 'contact', 'forebody')))), neutral)
    assert sole_row(neutral[..., 3]) == 471 and all(sole_row(parts[f][..., 3]) == 471 for f in FEET)
    base_fields = {key: {foot: field(foot, phase_displacement(key, foot)) for foot in FEET} for key in range(17)}
    for foot in FEET:
        assert packed_field(base_fields[0][foot]) == packed_field(base_fields[16][foot])
    for pose in SPEC['phases']:
        for foot in FEET:
            assert packed_field(base_fields[pose['key']][foot]) == packed_field(field(foot, pose['dy'][foot]))
    results = {}
    for key in phases:
        for stage, strength in enumerate((1, .75, .5, .25)):
            role = f'walk-down-{key:02d}' if stage == 0 else f'stop-down-{key:02d}-{stage}'
            fields = {foot: scale_field(base_fields[key][foot], strength) for foot in FEET}
            case = out / role
            case.mkdir()
            output, checks = render_strength(key, strength, fields, parts, neutral, case)
            path = case / 'source.png'
            output.save(path)
            packed = b''.join(packed_field(fields[foot]) for foot in FEET)
            assert len(packed) == 320
            results[role] = {'source': path, 'fieldPairSHA256': hashlib.sha256(packed).hexdigest(),
                             'fieldPairBytes': len(packed), 'sourceFields': fields}
            print(json.dumps({'closedSourceRole': role}), flush=True)
    assert len(results) == 32
    return results
