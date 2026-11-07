"""Waltraud mouth registrations from own rebuilt pose sources and traced physical controls."""
import numpy as np
from PIL import Image
from scipy.interpolate import PchipInterpolator
from scipy.ndimage import map_coordinates

from painted_walk import premul, sample, unpack


def source_fit(ref, image, fit):
    start, end = np.asarray(fit['cornersPx'], dtype=float)
    tangent = end - start
    center = (start + end) / 2
    unit = np.array([-tangent[1], tangent[0]]) / np.linalg.norm(tangent)
    normal = unit * fit['normalLengthPx']
    crease = start + np.linspace(0, 1, 5)[:, None] * tangent + np.asarray(fit['creaseNormalOffsetsPx'])[:, None] * unit
    contours = {'crease': crease, 'source_upper': crease.copy(), 'source_lower': crease.copy(),
                'open_upper': crease + np.asarray(fit['openingUpperOffsetsPx'])[:, None] * unit,
                'open_lower': crease + np.asarray(fit['openingLowerOffsetsPx'])[:, None] * unit}
    entry = {'input': {'file': ref['path'], 'sha256': ref['sha256'], 'dimensions': list(image.size)},
             'centerPx': center.tolist(), 'axesPx': [*tangent.tolist(), *normal.tolist()],
             'contoursPx': {name: values.tolist() for name, values in contours.items()}, 'width': [0, 0], 'teeth': 0}
    assert np.linalg.det(np.column_stack([tangent, normal])) > 0
    return entry


def source_to_pose(rest, record):
    center = np.asarray(rest['centerPx'], dtype=float)
    axes = np.asarray(rest['axesPx'], dtype=float).reshape(2, 2).T
    contours = {key: np.asarray(value, dtype=float) for key, value in rest['contoursPx'].items()}
    if record is None:
        return center, axes, contours, np.eye(2), None
    field = record
    fx = PchipInterpolator(field['nodesY'], field['dx'])
    fy = PchipInterpolator(field['nodesY'], field['dy'])
    def forward(points):
        return points + np.stack([fx(points[..., 1]), fy(points[..., 1])], axis=-1)

    jacobian = np.array([[1, float(fx.derivative()(center[1]))], [0, 1 + float(fy.derivative()(center[1]))]])
    assert np.linalg.det(jacobian) > 0
    epsilon = .001
    d = np.eye(2) * epsilon
    numeric = np.column_stack([(forward(center + v) - forward(center - v)) / (2 * epsilon) for v in d])
    assert np.max(np.abs(numeric - jacobian)) < 1e-8
    # Existing own quiet field rigid head includes all actual oral sampling guards.
    assert np.array_equal(jacobian, np.eye(2))
    assert max((center + axes @ np.array([x, y]))[1] for x in (-.5, .5) for y in (-1.6, 3)) < 145
    return forward(center), jacobian @ axes, {key: forward(points) for key, points in contours.items()}, jacobian, field


def profile_bound(center, axes, profile, tier):
    (width, height), figure, pivot = NATIVE[tier]
    scale = figure / 400
    translated = (center - [256, 472]) * scale + pivot
    changed_axes = axes * scale
    return {'rect': [float(translated[0] / width), float(1 - translated[1] / height),
                     float(np.linalg.norm(changed_axes[:, 0]) / width), float(np.linalg.norm(changed_axes[:, 1]) / height)],
            'axes': changed_axes.T.reshape(4).tolist(), 'profile': profile}


def source_support(pixels, center, axes, profile, compiler):
    x = np.linspace(*profile['corners'], 1001)
    curves = {k: compiler.curve(x, profile[k], profile['corners']) for k in compiler.NAMES}
    alpha = pixels[..., 3].astype(float)
    def supported(u, v):
        xy = np.stack(np.broadcast_arrays(u, v), axis=-1) @ axes.T + center
        return map_coordinates(alpha, [xy[..., 1], xy[..., 0]], order=1, mode='constant', cval=0, prefilter=False)
    mins = {name: float(supported(x, y).min()) for name, y in curves.items()}
    assert min(mins.values()) >= 200, ('Actual posed contour unsupported', mins)
    y = curves['open_upper'] + np.linspace(0, 1, 65)[:, None] * (curves['open_lower'] - curves['open_upper'])
    oral_min = float(supported(x, y).min())
    assert oral_min >= 200, ('Actual posed oral interior unsupported', oral_min)
    return mins, oral_min


def exact_collar(current, origin, center, axes, profile, field, own_premul):
    corners = profile['corners']
    q = np.array([[x, y] for x in corners for y in (-1.6, 3)])
    box = q @ axes.T + center
    x0, y0 = np.floor(box.min(axis=0)).astype(int)
    x1, y1 = np.ceil(box.max(axis=0)).astype(int)
    assert x0 >= 0 and y0 >= 0 and x1 < 512 and y1 < 512
    yy, xx = np.mgrid[y0:y1 + 1, x0:x1 + 1]
    local = (np.stack([xx, yy], axis=-1) - center) @ np.linalg.inv(axes).T
    active = (local[..., 0] >= corners[0]) & (local[..., 0] <= corners[1]) & (local[..., 1] >= -1.6) & (local[..., 1] <= 3)
    y, x = yy[active], xx[active]
    assert x.size > 0
    if field is None:
        reference = origin[y, x]
    else:
        xf = PchipInterpolator(field['nodesY'], field['dx'])
        yf = PchipInterpolator(field['nodesY'], field['dy'])
        sy = y.astype(float)
        for _ in range(10):
            sy = y - yf(np.clip(sy, 0, 511))
        sx = x - xf(np.clip(sy, 0, 511))
        assert np.max(np.abs(sy + yf(sy) - y)) < 1e-8
        assert np.max(np.abs(sy - (y - field['headDxDy'][1]))) < 1e-8
        assert np.max(np.abs(sx - (x - field['headDxDy'][0]))) < 1e-8
        reference = np.asarray(unpack(sample(own_premul, sx[None, :], sy[None, :])))[0]
    assert np.array_equal(current[y, x], reference), 'Actual owning frame oral collar disagrees with source and field'
    return int(x.size)


def run(raw, routing, source_roles, rests, controls, compiler, head_fields, group):
    global NATIVE
    NATIVE = {name: (tuple(spec['cell']), spec['figure'], tuple(spec['pivot']))
              for name, spec in routing['native'].items()}
    assert controls['actor'] == routing['actor'] == 'crowd-waltraud-wartemarke'
    assert controls['sourceFigurePixels'] == routing['sourceFigure'] == 400
    assert controls['pivot'] == routing['sourcePivot'] == [256, 472]
    assert set(controls['fits']) == set(rests) == set(routing['turns'])
    assert {view for view, fit in controls['fits'].items() if fit is None} == {'up','rear-right','rear-left'}
    assert group in ('down','right','left','turn-actions')

    originals, entries, profiles = {}, {}, {}
    for view, fit in controls['fits'].items():
        if fit is None:
            assert compiler.compile_registration(None) is None
            continue
        ref = rests[view]
        with Image.open(raw / ref['path']) as opened:
            image = opened.convert('RGBA')
        assert image.size == (512, 512)
        entry = source_fit(ref, image, fit)
        originals[view] = image
        entries[view] = entry
        profiles[view] = compiler.compile_registration(entry)['profile']
    assert len(profiles) == 5
    source_pm = premul(originals['down'])
    rows = []
    for cell in routing['cells']:
        view, kind, role = cell['view'], cell['kind'], cell['role']
        if cell['mouth'] is None:
            continue
        if group == 'turn-actions':
            if kind not in ('turn','action'):
                continue
        elif kind not in ('walk','stop','bridge') or view != group:
            continue
        rest = entries[view]
        center, axes, contours, jacobian, field = source_to_pose(rest, head_fields.get(role))
        assert (field is not None) == (kind == 'action')
        ref = source_roles[role]
        with Image.open(raw / ref['path']) as opened:
            pixels = np.asarray(opened.convert('RGBA')).copy()
        assert pixels.shape == (512, 512, 4)
        entry = {**rest, 'input': {'file': ref['path'], 'sha256': ref['sha256'], 'dimensions': [512, 512]},
                 'centerPx': center.tolist(), 'axesPx': axes.T.reshape(4).tolist(),
                 'contoursPx': {key: value.tolist() for key, value in contours.items()}}
        registration = compiler.compile_registration(entry)
        profile = registration['profile']
        assert profile == profiles[view], 'Own normalized lip shape changed'
        contours_min, oral_min = source_support(pixels, center, axes, profile, compiler)
        collar_count = exact_collar(pixels, np.asarray(originals[view]), center, axes, profile, field, source_pm)
        rows.append({'slot': cell['slot'], 'view': view, 'kind': kind, 'role': role,
            'centerPx': center.tolist(), 'axisVectorsPx': axes.T.tolist(),
            'headJacobian': jacobian.tolist(), 'bothAxesTransported': True,
            'actualOwningCollarRGBAExact': collar_count, 'contourOriginalAlphaMin': contours_min,
            'fullOralOriginalAlphaMin': oral_min,
            'logicalRegistration': profile_bound(center, axes, profile, 'standing'),
            'native': {tier: profile_bound(center, axes, profile, tier) for tier in ('desktop','mobile')}})
    assert len(rows) == (69 if group == 'turn-actions' else 85)
    return rows
