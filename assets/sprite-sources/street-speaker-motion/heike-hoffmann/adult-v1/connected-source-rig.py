"""Heike's source-owned connected profile cloth rig at one physical scale."""
from __future__ import annotations

import hashlib
import importlib.util
import io
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label
from scipy.spatial import cKDTree

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[4]
GEOMETRY = OUT / 'geometry.json'
EXTRACTION = OUT
EXTRACTION_RECEIPT = OUT / 'extraction-receipt.json'
SPEC = OUT / 'side-spec.json'
SOURCE = ROOT / 'assets/sprite-sources/berlin-street-20261022/quiz-heike-hoffmann-expressionist-side-contacts-v1.png'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    obj = importlib.util.module_from_spec(spec)
    sys.modules[name] = obj
    spec.loader.exec_module(obj)
    return obj


assert sha(GEOMETRY) == 'e962edf7dbb2a32fff14a198989242065d76f6e6a0c064f77d88d205f4cefdc3'
assert sha(EXTRACTION_RECEIPT) == 'f9aeb048538c655d9f0eaeddb0673a2ae3c50474aa689de711c4d38248951ce1'
geometry = json.loads(GEOMETRY.read_text(encoding='utf-8'))
extraction = json.loads(EXTRACTION_RECEIPT.read_text(encoding='utf-8'))
spec = json.loads(SPEC.read_text(encoding='utf-8'))
assert sha(SOURCE) == geometry['inputs']['contactSourceSHA256'] == extraction['sourceSha256']
street = module('heike_connected_street', ROOT / 'tools/build-street-character-sprites.py')
rig = module('heike_connected_rig', ROOT / 'tools/build-rigged-sprite-atlas.py')
ik = module('heike_connected_ik', ROOT / '.agents/skills/animate-2d-characters/scripts/rig_math.py')
view = spec['characters']['quiz-heike-hoffmann']['views']['right']
scale = geometry['conventions']['sourceToWorking']
assert scale == 400 / 975
raw = Image.open(SOURCE).convert('RGBA')
_, origin_array = street.register_source(raw, view, scale, 472)
origin = tuple(float(x) for x in origin_array)


def source_layer(name):
    path = EXTRACTION / f'{name}-source.png'
    assert sha(path) == extraction['outputs'][path.name], name
    image = Image.open(path).convert('RGBA')
    assert image.size == raw.size
    return image


upper_source = source_layer('upper')
shoe_sources = {owner: source_layer(owner + '-shoe') for owner in ('far', 'near')}
cloth_sources = {}
source_coverage = {}
knee_support = {}
source_rgba = np.asarray(raw)
for owner in ('far', 'near'):
    thigh = np.asarray(source_layer(owner + '-thigh'))
    calf = np.asarray(source_layer(owner + '-calf'))
    thigh_on = thigh[:, :, 3] > 0
    calf_on = calf[:, :, 3] > 0
    overlap = thigh_on & calf_on
    assert np.array_equal(thigh[overlap], calf[overlap]), owner
    union = thigh_on | calf_on
    combined = np.zeros_like(thigh)
    combined[union] = source_rgba[union]
    assert np.array_equal(combined[thigh_on], thigh[thigh_on])
    assert np.array_equal(combined[calf_on], calf[calf_on])
    assert not np.any(union & (np.asarray(shoe_sources[owner])[:, :, 3] > 0))
    cloth_sources[owner] = Image.fromarray(combined)
    knee_x = int(geometry['sourceBinding']['originalKneesXY'][owner][0])
    row_x = np.flatnonzero(combined[755, :, 3] >= 20)
    assert len(row_x) > 0
    left, right_exclusive = int(row_x.min()), int(row_x.max()) + 1
    radius = max(abs(left - knee_x), abs(right_exclusive - knee_x))
    knee_support[owner] = {'rowSourceY': 755, 'annotatedKneeX': knee_x,
                           'alpha20EdgesXYExclusive': [left, right_exclusive],
                           'alpha20RowPixels': int(len(row_x)), 'measuredRadius': radius,
                           'bandSourceY': [755 - radius, 755 + radius]}
    source_coverage[owner] = {'thighAlphaPositive': int(thigh_on.sum()), 'calfAlphaPositive': int(calf_on.sum()),
                              'sameRGBADuplicateOverlap': int(overlap.sum()), 'unionAlphaPositive': int(union.sum()),
                              'unionAlpha20': int(np.count_nonzero(combined[:, :, 3] >= 20))}

upper, _ = street.register_source(upper_source, view, scale, 472)
cloth = {owner: street.register_source(cloth_sources[owner], view, scale, 472)[0] for owner in ('far', 'near')}
shoes = {owner: street.register_source(shoe_sources[owner], view, scale, 472)[0] for owner in ('far', 'near')}


def work(point):
    return (point[0] * scale + origin[0], point[1] * scale + origin[1])


def angle(a, b):
    return math.atan2(b[0] - a[0], b[1] - a[1])


def smoothstep(value):
    t = np.clip(value, 0., 1.)
    return t * t * (3. - 2. * t)


def smoothstep_prime(value, width):
    t = np.clip(value, 0., 1.)
    return np.where((value > 0.) & (value < 1.), 6. * t * (1. - t) / width, 0.)


def solve_pose(pose):
    root = work(pose['hipRootXY'])
    solved = {}
    for owner in ('far', 'near'):
        src = geometry['sourceBinding']
        source = {'hip': work(src['estimatedHipXY']), 'knee': work(src['originalKneesXY'][owner]),
                  'ankle': work(src['estimatedAnklePivotsXY'][owner])}
        upper_length = math.dist(source['hip'], source['knee'])
        lower_length = math.dist(source['knee'], source['ankle'])
        assert abs(upper_length - src['legs'][owner]['upperSource'] * scale) < 1e-9
        assert abs(lower_length - src['legs'][owner]['lowerSource'] * scale) < 1e-9
        recovered = ik.solve_two_bone(source['hip'], source['ankle'], upper_length, lower_length, -1)
        knee_error = math.dist(recovered['knee'], source['knee'])
        assert knee_error < 1e-6
        leg = pose['legs'][owner]
        target = work(leg['targetAnklePivotXY'])
        solution = ik.solve_two_bone(root, target, upper_length, lower_length, -1)
        assert solution['reach_error'] < 1e-7
        assert math.dist(solution['knee'], work(leg['reconstructedTargetKneeXY'])) < 1e-6
        solved[owner] = {'source': source, 'root': root, 'target': target, 'solution': solution,
                         'owner': owner,
                         'sourceKneeError': knee_error, 'lengths': [upper_length, lower_length],
                         'thighAngle': angle(root, solution['knee']) - angle(source['hip'], source['knee']),
                         'calfAngle': angle(solution['knee'], target) - angle(source['knee'], source['ankle']),
                         'shoeAngle': math.radians(leg['imageRotationDeg'])}
    return solved


def field(px, py, row, jacobian=False):
    hx, hy = row['source']['hip']
    tx, ty = row['root']
    skx, sky = row['source']['knee']
    tkx, tky = row['solution']['knee']
    theta, phi = row['thighAngle'], row['calfAngle']
    c1, s1, c2, s2 = math.cos(theta), math.sin(theta), math.cos(phi), math.sin(phi)
    hip_start, hip_end = work((450, 545))[1], work((450, 675))[1]
    calf_source_band = knee_support[row['owner']]['bandSourceY']
    calf_start, calf_end = work((450, calf_source_band[0]))[1], work((450, calf_source_band[1]))[1]
    av = (py - hip_start) / (hip_end - hip_start)
    bv = (py - calf_start) / (calf_end - calf_start)
    a, b = smoothstep(av), smoothstep(bv)
    tr_x, tr_y = px + tx - hx, py + ty - hy
    tt_x, tt_y = tx + c1 * (px - hx) + s1 * (py - hy), ty - s1 * (px - hx) + c1 * (py - hy)
    tc_x, tc_y = tkx + c2 * (px - skx) + s2 * (py - sky), tky - s2 * (px - skx) + c2 * (py - sky)
    u_x, u_y = (1 - a) * tr_x + a * tt_x, (1 - a) * tr_y + a * tt_y
    q_x, q_y = (1 - b) * u_x + b * tc_x, (1 - b) * u_y + b * tc_y
    if not jacobian:
        return q_x, q_y
    ap = smoothstep_prime(av, hip_end - hip_start)
    bp = smoothstep_prime(bv, calf_end - calf_start)
    ux_x, uy_x = (1 - a) + a * c1, -a * s1
    ux_y = a * s1 + ap * (tt_x - tr_x)
    uy_y = (1 - a) + a * c1 + ap * (tt_y - tr_y)
    jxx = (1 - b) * ux_x + b * c2
    jyx = (1 - b) * uy_x - b * s2
    jxy = (1 - b) * ux_y + b * s2 + bp * (tc_x - u_x)
    jyy = (1 - b) * uy_y + b * c2 + bp * (tc_y - u_y)
    return q_x, q_y, jxx, jxy, jyx, jyy


YY, XX = np.mgrid[:512, :512]


def sample_cloth(owner, row):
    layer = cloth[owner]
    alpha = np.asarray(layer)[:, :, 3] >= 20
    _, _, jxx, jxy, jyx, jyy = field(XX, YY, row, jacobian=True)
    determinant = jxx * jyy - jxy * jyx
    min_det = float(np.min(determinant[alpha]))
    report = {'sourceAlpha20Pixels': int(alpha.sum()), 'minRegisteredSourcePaintJacobian': min_det,
              'bandsSourceY': {'hip': [545, 675], 'calf': knee_support[owner]['bandSourceY']}}
    if min_det <= 0:
        return None, report
    # Initialize the exact same Newton inverse from forward-mapped ORIGINAL
    # source paint. The earlier whole-canvas hip-translation seed fell onto
    # another inverse branch outside the cloth. This changes sampling only;
    # F, the weights, joints, and pixels are unchanged.
    px = XX.astype(float) - (row['root'][0] - row['source']['hip'][0])
    py = YY.astype(float) - (row['root'][1] - row['source']['hip'][1])
    seed_y, seed_x = np.nonzero(np.asarray(layer)[:, :, 3] > 0)
    mapped_x, mapped_y = field(seed_x.astype(float), seed_y.astype(float), row)
    good = np.isfinite(mapped_x) & np.isfinite(mapped_y)
    tree = cKDTree(np.stack((mapped_x[good], mapped_y[good]), axis=1))
    qmask = ((XX >= math.floor(float(mapped_x[good].min())) - 2) &
             (XX <= math.ceil(float(mapped_x[good].max())) + 2) &
             (YY >= math.floor(float(mapped_y[good].min())) - 2) &
             (YY <= math.ceil(float(mapped_y[good].max())) + 2))
    qy, qx = np.nonzero(qmask)
    _, index = tree.query(np.stack((qx, qy), axis=1), k=1)
    sx = seed_x[good][index].astype(float)
    sy = seed_y[good][index].astype(float)
    for _ in range(24):
        qx_now, qy_now, ax, bx, cx, dx = field(sx, sy, row, jacobian=True)
        det = ax * dx - bx * cx
        safe = np.where(np.abs(det) < 1e-8, np.nan, det)
        ex, ey = qx_now - qx, qy_now - qy
        step_x = (dx * ex - bx * ey) / safe
        step_y = (-cx * ex + ax * ey) / safe
        old_residual = ex * ex + ey * ey
        amount = np.ones_like(sx)
        accepted = np.zeros_like(sx, dtype=bool)
        next_x, next_y = sx.copy(), sy.copy()
        # Damped Newton keeps a source-seeded inverse on its own local branch;
        # it changes no deformation weights or pixel geometry.
        for _backtrack in range(12):
            candidate_x = sx - amount * step_x
            candidate_y = sy - amount * step_y
            cq_x, cq_y = field(candidate_x, candidate_y, row)
            candidate_residual = (cq_x - qx) ** 2 + (cq_y - qy) ** 2
            choose = ~accepted & np.isfinite(candidate_residual) & (candidate_residual < old_residual)
            next_x[choose], next_y[choose] = candidate_x[choose], candidate_y[choose]
            accepted |= choose
            amount *= .5
        sx, sy = next_x, next_y
    px[qmask], py[qmask] = sx, sy
    sampled = street.paint.unpack(street.paint.sample(street.paint.premul(layer), px, py))
    rgba = np.asarray(sampled).copy()
    rgba[~qmask] = 0
    sampled = Image.fromarray(rgba)
    out_alpha = np.asarray(sampled)[:, :, 3] >= 20
    qx, qy = field(px, py, row)
    residual = np.hypot(qx - XX, qy - YY)
    report['maxPreclipInverseResidualOutputAlpha20'] = float(np.nanmax(residual[out_alpha])) if out_alpha.any() else None
    report['nonfiniteInverseOutputAlpha20'] = int(np.count_nonzero(~np.isfinite(px[out_alpha]) | ~np.isfinite(py[out_alpha])))
    report['preclipOutputAlpha20Pixels'] = int(out_alpha.sum())
    if out_alpha.any():
        report['inverseResidualPercentilesOutputAlpha20'] = [float(v) for v in np.percentile(residual[out_alpha], [50, 90, 99, 100])]
        worst = np.unravel_index(np.nanargmax(np.where(out_alpha, residual, -1)), residual.shape)
        report['worstInverseAtTargetXY'] = [int(worst[1]), int(worst[0])]
        report['worstInverseSourceXY'] = [float(px[worst]), float(py[worst])]
    report['inverseSeed'] = 'nearest forward-mapped original alpha-positive source pixel, then fixed 24-step damped analytic Newton'
    # A bilinear source sample can return edge alpha outside the exact image of
    # F. Such output pixels have no valid inverse and must remain transparent,
    # rather than borrowing nearby cloth across the source contour.
    outside = out_alpha & (~np.isfinite(residual) | (residual > .01))
    report['outsideMappedSourceAlpha20Pixels'] = int(outside.sum())
    if outside.any():
        ybad, xbad = np.nonzero(outside)
        report['outsideMappedSourceBoundsXYXY'] = [int(xbad.min()), int(ybad.min()), int(xbad.max()) + 1, int(ybad.max()) + 1]
    rgba = np.asarray(sampled).copy()
    rgba[~np.isfinite(residual) | (residual > .01)] = 0
    sampled = Image.fromarray(rgba)
    valid_alpha = np.asarray(sampled)[:, :, 3] >= 20
    report['outputAlpha20Pixels'] = int(valid_alpha.sum())
    report['maxInverseResidualOutputAlpha20'] = float(np.nanmax(residual[valid_alpha])) if valid_alpha.any() else None
    if report['outsideMappedSourceAlpha20Pixels'] or report['nonfiniteInverseOutputAlpha20'] or (report['maxInverseResidualOutputAlpha20'] is not None and report['maxInverseResidualOutputAlpha20'] > .01):
        return None, report
    return sampled, report


def place_rotated(canvas, layer, source_joint, target_joint, rotation):
    bounds = layer.getbbox()
    if bounds is None:
        return
    crop = layer.crop(bounds)
    joint = (source_joint[0] - bounds[0], source_joint[1] - bounds[1])
    if abs(rotation) > 1e-8:
        crop, joint = rig.rotate_about_pivot(crop, joint, rotation)
    canvas.alpha_composite(crop, (round(target_joint[0] - joint[0]), round(target_joint[1] - joint[1])))


def translate_whole(layer, dy):
    return street.paint.unpack(street.paint.sample(street.paint.premul(layer), XX, YY - dy))


def on(image, color):
    bg = Image.new('RGBA', image.size, color + (255,))
    bg.alpha_composite(image)
    return bg.convert('RGB')


def metrics(image):
    rgba = np.asarray(image.convert('RGBA'))
    alpha = rgba[:, :, 3]
    yy, xx = np.nonzero(alpha >= 21)
    bounds = [int(xx.min()), int(yy.min()), int(xx.max()) + 1, int(yy.max()) + 1]
    _, components = label(alpha >= 128, structure=np.ones((3, 3), dtype=np.uint8))
    return {'alpha21Bounds': bounds, 'guttersLTRB': [bounds[0], image.width - bounds[2], bounds[1], image.height - bounds[3]],
            'alpha128Components': components, 'hiddenRgbAtAlpha0': int(np.count_nonzero((alpha == 0) & np.any(rgba[:, :, :3] != 0, axis=2))),
            'borderAlphaMax': int(max(alpha[0].max(), alpha[-1].max(), alpha[:, 0].max(), alpha[:, -1].max()))}


def audit_full_source(owner, row):
    original = np.asarray(cloth_sources[owner])[:, :, 3]
    y, x = np.nonzero(original > 0)
    strong = original[y, x] >= 20
    result = {'sourceAlphaPositivePixels': int(len(x)), 'sourceAlpha20Pixels': int(strong.sum()),
              'minDeterminantBySample': {}, 'nonPositiveCountBySample': {}, 'worstSourcePointXYBySample': {}}
    centre_x = x.astype(float) * scale + origin[0]
    centre_y = y.astype(float) * scale + origin[1]
    forward_x, forward_y = field(centre_x, centre_y, row)
    native_x = (forward_x - 256) * (spec['figureHeight'] / spec['working']['figureHeight']) + spec['pivot'][0]
    native_y = (forward_y - spec['working']['baseline']) * (spec['figureHeight'] / spec['working']['figureHeight']) + spec['pivot'][1]
    result['forwardWorkingBoundsXYXY'] = [float(forward_x.min()), float(forward_y.min()), float(forward_x.max()), float(forward_y.max())]
    result['forwardNativeBoundsXYXY'] = [float(native_x.min()), float(native_y.min()), float(native_x.max()), float(native_y.max())]
    result['sourceAlphaPositiveOutsideWorkingCanvas'] = int(np.count_nonzero((forward_x < 0) | (forward_x >= 512) | (forward_y < 0) | (forward_y >= 512)))
    result['sourceAlphaPositiveOutsideNativeCell'] = int(np.count_nonzero((native_x < 0) | (native_x >= 128) | (native_y < 0) | (native_y >= 160)))
    # Distinct original cloth pixel centres must not collapse to one coordinate.
    # This is a source-support check, independent of output-raster residuals.
    mapped = np.stack((forward_x, forward_y), axis=1)
    neighbour_distance, _ = cKDTree(mapped).query(mapped, k=2)
    result['nearestDistinctForwardSourcePointWorking'] = float(neighbour_distance[:, 1].min())
    # Exercise the analytic inverse at EVERY original painted source centre,
    # including faint fringe. A quarter-working-pixel displaced start tests
    # local recovery instead of trivially starting at the known exact point.
    inverse_x, inverse_y = centre_x + .25, centre_y - .25
    for _ in range(12):
        fx, fy, ax, bx, cx, dx = field(inverse_x, inverse_y, row, jacobian=True)
        error_x, error_y = fx - forward_x, fy - forward_y
        determinant = ax * dx - bx * cx
        inverse_x -= (dx * error_x - bx * error_y) / determinant
        inverse_y -= (-cx * error_x + ax * error_y) / determinant
    recovery = np.hypot(inverse_x - centre_x, inverse_y - centre_y)
    result['maxOriginalPaintForwardInverseRecoveryWorking'] = float(np.nanmax(recovery))
    result['originalPaintForwardInverseOverPoint01Working'] = int(np.count_nonzero(~np.isfinite(recovery) | (recovery > .01)))
    # Pixel centres plus four support corners: original-resolution fringe and
    # corners, not the lower-resolution registered layer, decide the fold gate.
    for label, ox, oy in (('centre', 0., 0.), ('upperLeft', -.5, -.5),
                          ('upperRight', .5, -.5), ('lowerLeft', -.5, .5), ('lowerRight', .5, .5)):
        wx = (x.astype(float) + ox) * scale + origin[0]
        wy = (y.astype(float) + oy) * scale + origin[1]
        _, _, a, b, c, d = field(wx, wy, row, jacobian=True)
        det = a * d - b * c
        idx = int(np.argmin(det))
        result['minDeterminantBySample'][label] = float(det[idx])
        result['nonPositiveCountBySample'][label] = int(np.count_nonzero(det <= 0))
        result['worstSourcePointXYBySample'][label] = [float(x[idx] + ox), float(y[idx] + oy)]
        if label == 'centre':
            result['minAlpha20CentreDeterminant'] = float(np.min(det[strong]))
            result['nonPositiveAlpha20CentreCount'] = int(np.count_nonzero(det[strong] <= 0))
            fringe = ~strong
            result['minFaintFringeCentreDeterminant'] = float(np.min(det[fringe])) if fringe.any() else None
            result['nonPositiveFaintFringeCentreCount'] = int(np.count_nonzero(det[fringe] <= 0))
    return result
