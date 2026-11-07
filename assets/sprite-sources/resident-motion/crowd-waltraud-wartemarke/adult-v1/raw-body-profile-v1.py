"""Portable Waltraud profile source rendering from her raw-derived own parts."""
import hashlib
import importlib.util
import json
import struct

import numpy as np
from PIL import Image
from scipy.interpolate import PchipInterpolator
from scipy.ndimage import binary_fill_holes, label

FEET = ('near', 'far')
STRENGTHS = (1, .75, .5, .25)


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def write(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n')


def rgba(path):
    with Image.open(path) as image:
        return np.asarray(image.convert('RGBA')).copy()


def compose(far, near, fixed):
    return Image.alpha_composite(Image.alpha_composite(far, near), fixed)


def packed(field):
    groups = [field[name] for name in ('nodes_y', 'dx', 'dy', 'footDxDy')]
    assert [len(group) for group in groups] == [7, 7, 7, 2]
    values = [float(v) for group in groups for v in group]
    assert all(np.isfinite(values))
    return struct.pack('<23d', *values)


def scale_field(field, strength):
    assert field['stationaryThroughY'] == 363 and field['wholeFootRigidFromY'] == 424
    result = dict(field)
    for name in ('dx', 'dy', 'footDxDy'):
        result[name] = [value * strength for value in field[name]]
    for values, delta in zip((result['dx'], result['dy']), result['footDxDy']):
        assert values[:3] == [0, 0, 0] and values[-2:] == [delta, delta]
    jacobian = 1 + PchipInterpolator(result['nodes_y'], result['dy']).derivative()(np.linspace(0, 511, 4097))
    result['minimumVerticalJacobian'] = float(jacobian.min())
    assert result['minimumVerticalJacobian'] > .5
    _, _, result['inverseResidualMaximum'] = material.actual_inverse(result)
    return result


def field_pair_sha(fields):
    return hashlib.sha256(b''.join(packed(fields[foot]) for foot in FEET)).hexdigest()


def render_pose(key, fields, parts, neutral, baseline_holes, out):
    assert min(field['footDxDy'][1] for field in fields.values()) <= 0
    assert any(field['footDxDy'][1] == 0 for field in fields.values())
    moved, checks, integer_audit = {}, {}, []
    for foot in FEET:
        field = fields[foot]
        dx, dy = field['footDxDy']
        if dx == round(dx) and dy == round(dy):
            moved[foot], checks[foot] = material.integer_layer(parts[foot], field, foot, key, integer_audit)
        else:
            moved[foot], checks[foot] = material.fractional_layer(parts[foot], field, foot, out)
    write(out / 'integer-replacements.json', integer_audit)
    image = compose(moved['far'], moved['near'], Image.fromarray(parts['fixed']))
    pixels = np.asarray(image)
    assert np.array_equal(pixels[:364], neutral[:364]), 'Entire upper and contact support remain literal RGBA'
    support = pixels[..., 3] >= 20
    assert not np.any((binary_fill_holes(support) & ~support) & ~baseline_holes), 'New enclosed source hole'
    labels, _ = label(support)
    components = [int(n) for n in np.bincount(labels.ravel())[1:] if n >= 15]
    assert len(components) == 1, ('Source component split', components)
    assert not np.any(support[[0, -1], :]) and not np.any(support[:, [0, -1]])
    return image


def run(source, out, controls, phases, heading):
    """Emit 4 walk and 12 reduced source PNGs from an explicit own field and real profile parts."""
    global material
    assert heading in ('right', 'left')
    assert tuple(phases) in tuple(tuple(range(start, start + 4)) for start in range(0, 16, 4))
    assert controls['sourcePivot'] == [256, 472] and controls['sourceFigurePixels'] == 400
    assert controls['zeroDisplacementThroughY'] == 363 and controls['rigidWholeCuffBootFromY'] == 424
    field_filename = {'right': 'right-full16-field-v1.py', 'left': 'left-full16-field-v2.py'}[heading]
    own_field = load('waltraud_raw_own_profile_field', source / field_filename)
    material = load('waltraud_raw_own_profile_material', source / 'mixed-material-helper-v3-exact-half.py')
    material.CONTROLS = controls
    parts_dir = source / 'raw-family-neutral-parts-v2'
    parts = {
        role: rgba(parts_dir / (heading + '-' + name + '.png'))
        for role, name in {'far': 'far-occluded-domain', 'near': 'lower-original',
                           'fixed': 'fixed-original', 'neutral': 'neutral'}.items()
    }
    material.OWN_FIXED = parts['fixed']
    material.OWN_MASTER = rgba(source / 'registered' / (heading + '.png'))
    master = compose(Image.new('RGBA', (512, 512)), Image.fromarray(parts['near']), Image.fromarray(parts['fixed']))
    assert np.array_equal(np.asarray(master), material.OWN_MASTER)
    neutral = parts['neutral']
    recomposed = compose(*(Image.fromarray(parts[role]) for role in ('far', 'near', 'fixed')))
    assert np.array_equal(np.asarray(recomposed), neutral)
    baseline = neutral[..., 3] >= 20
    baseline_holes = binary_fill_holes(baseline) & ~baseline
    results = {}
    for key in phases:
        original_fields = {foot: own_field.make_field(controls, key, foot) for foot in FEET}
        for stage, strength in enumerate(STRENGTHS):
            stem = str(key).zfill(2)
            role = f'walk-{heading}-{stem}' if stage == 0 else f'stop-{heading}-{stem}-{stage}'
            fields = original_fields if strength == 1 else {
                foot: scale_field(original_fields[foot], strength) for foot in FEET
            }
            case = out / role
            case.mkdir()
            image = render_pose(key, fields, parts, neutral, baseline_holes, case)
            path = case / 'source.png'
            image.save(path)
            assert np.array_equal(rgba(path), np.asarray(image))
            physical = b''.join(packed(fields[foot]) for foot in FEET)
            assert len(physical) == 368
            results[role] = {'source': path, 'fieldPairSHA256': field_pair_sha(fields),
                             'fieldPairBytes': len(physical), 'sourceFields': fields}
            print(json.dumps({'closedSourceRole': role}), flush=True)
    assert len(results) == 16
    return results
