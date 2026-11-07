"""Actor-local fractional material proposal. No image I/O or execution on import."""
import csv
import json
import numpy as np
from PIL import Image
from scipy.interpolate import PchipInterpolator
import painted_walk as paint


def explicit_premul(source):
    a = source.astype(np.float64) / 255
    rgb = a[..., :3]
    linear = np.where(rgb <= .04045, rgb / 12.92, ((rgb + .055) / 1.055) ** 2.4)
    return np.concatenate((linear * a[..., 3, None], a[..., 3, None]), axis=2)


def explicit_four_taps(source_premul, sx, sy):
    """Independent analytical four taps, not paint.sample or map_coordinates."""
    sx, sy = np.broadcast_arrays(np.asarray(sx, dtype=float), np.asarray(sy, dtype=float))
    ix, iy = np.floor(sx).astype(int), np.floor(sy).astype(int)
    u, v = sx - ix, sy - iy
    xs = [ix, ix + 1, ix, ix + 1]
    ys = [iy, iy, iy + 1, iy + 1]
    weights = [(1 - u) * (1 - v), u * (1 - v), (1 - u) * v, u * v]
    result = np.zeros((*sx.shape, 4), dtype=np.float64)
    all_inside = np.ones(sx.shape, bool)
    all_rigid = np.ones(sx.shape, bool)
    for x, y, w in zip(xs, ys, weights):
        inside = (x >= 0) & (x < 512) & (y >= 0) & (y < 512)
        all_inside &= (w == 0) | inside
        all_rigid &= (w == 0) | (inside & (y >= 424))
        values = source_premul[np.clip(y, 0, 511), np.clip(x, 0, 511)]
        result += values * (w * inside)[..., None]
    # Existing scipy mode='constant' yields cval for any coordinate outside
    # the image, rather than a grid-constant partial edge. Match that mode.
    in_coordinate = (sx >= 0) & (sx <= 511) & (sy >= 0) & (sy <= 511)
    result[~in_coordinate] = 0
    return result, {'x': xs, 'y': ys, 'w': weights,
                    'allInside': all_inside & in_coordinate,
                    'allRigid': all_rigid & in_coordinate}


def explicit_quantize(premul):
    alpha = np.clip(premul[..., 3], 0, 1)
    linear = np.divide(premul[..., :3], alpha[..., None],
                       out=np.zeros_like(premul[..., :3]), where=alpha[..., None] > 1e-8)
    encoded = np.where(linear <= .0031308, 12.92 * linear,
                       1.055 * np.maximum(linear, 0) ** (1 / 2.4) - .055)
    rgba = np.rint(np.concatenate((np.clip(encoded, 0, 1), alpha[..., None]), axis=-1) * 255).astype('uint8')
    rgba[rgba[..., 3] == 0] = 0
    return rgba


def actual_inverse(field):
    xf = PchipInterpolator(field['nodes_y'], field['dx'])
    yf = PchipInterpolator(field['nodes_y'], field['dy'])
    target_y, target_x = np.mgrid[:512, :512]
    sy = target_y.astype(float)
    for _ in range(10):
        sy = target_y - yf(np.clip(sy, 0, 511))
    sx = target_x - xf(np.clip(sy, 0, 511))
    residual = np.max(np.abs(sy + yf(np.clip(sy, 0, 511)) - target_y))
    assert residual < 1e-7
    return sx, sy, float(residual)


def save_rows(path, rows, empty_fields):
    with path.open('w', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]) if rows else empty_fields)
        writer.writeheader()
        writer.writerows(rows)


def source_coverage(source, field, candidate, full_expected, actual_taps, rigid_mask, foot, out):
    dx, dy = field['footDxDy']
    ys, xs = np.where((source[..., 3] > 0) & (np.arange(512)[:, None] >= 424))
    assert len(xs) > 0
    rows = []
    lost = []
    boundary = []
    boundary_mismatches = []
    weight_error_max = 0.0
    actual_weight_sum_min = float('inf')
    actual_weight_sum_max = 0.0
    quantized_zero_contributions = 0
    wrong_target_missing = 0
    for x, y in zip(xs.tolist(), ys.tolist()):
        qx, qy = x + dx, y + dy
        x0, y0 = int(np.floor(qx)), int(np.floor(qy))
        u, v = qx - x0, qy - y0
        targets = [(x0, y0, (1-u)*(1-v)), (x0+1, y0, u*(1-v)),
                   (x0, y0+1, (1-u)*v), (x0+1, y0+1, u*v)]
        total = sum(w for _, _, w in targets)
        weight_error_max = max(weight_error_max, abs(total - 1))
        assert abs(total - 1) <= 16 * np.finfo(float).eps
        represented = 0.0
        for tx, ty, forward_w in targets:
            if forward_w == 0:
                continue
            assert 0 <= tx < 512 and 0 <= ty < 512, ('Actual positive foot paint clipped', foot, x, y)
            actual_w = sum(float(w[ty, tx]) for xx, yy, w in zip(actual_taps['x'], actual_taps['y'], actual_taps['w'])
                           if xx[ty, tx] == x and yy[ty, tx] == y)
            represented += actual_w
            row = {'foot': foot, 'sourceX': x, 'sourceY': y, 'sourceA': int(source[y,x,3]),
                   'targetX': tx, 'targetY': ty, 'forwardTentWeight': forward_w,
                   'actualInverseTapWeight': actual_w, 'allTapsRigid': bool(rigid_mask[ty,tx]),
                   'expectedWholeLayerA': int(full_expected[ty,tx,3]),
                   'candidateWholeLayerA': int(candidate[ty,tx,3]),
                   'expectedWholeRGBA': ','.join(map(str,full_expected[ty,tx].tolist())),
                   'candidateWholeRGBA': ','.join(map(str,candidate[ty,tx].tolist()))}
            rows.append(row)
            if actual_w > 0 and full_expected[ty,tx,3] == 0:
                quantized_zero_contributions += 1
            if actual_w > 0 and not rigid_mask[ty,tx]:
                boundary.append(row)
                if full_expected[ty,tx,3] >= 20 and not np.array_equal(full_expected[ty,tx],candidate[ty,tx]):
                    boundary_mismatches.append(row)
            if actual_w > 0 and full_expected[ty,tx,3] > 0 and candidate[ty,tx,3] == 0:
                lost.append(row)
            if y >= 426 and ty < 424:
                wrong_target_missing += 1
        assert represented > 0, ('Positive source sample has no inverse-filter representation', foot, x, y)
        actual_weight_sum_min = min(actual_weight_sum_min, represented)
        actual_weight_sum_max = max(actual_weight_sum_max, represented)
    save_rows(out / (foot + '-all-positive-source424plus-contributions.csv'), rows, ['foot'])
    save_rows(out / (foot + '-mixed-boundary-contributions.csv'), boundary, ['foot'])
    save_rows(out / (foot + '-unrepresented-quantizable-contributions.csv'), lost, ['foot'])
    save_rows(out / (foot + '-boundary-numeric-discrepancies.csv'), boundary_mismatches, ['foot'])
    summary = {'positiveSourcePixels': len(xs), 'allForwardTentContributions': len(rows),
               'mixedBoundaryContributions': len(boundary), 'unrepresentedQuantizableContributions': len(lost),
               'boundarySupportedNumericDiscrepancyContributions':len(boundary_mismatches),
               'maximumForwardWeightSumError': weight_error_max,
               'actualInverseWeightSumRange': [actual_weight_sum_min,actual_weight_sum_max],
               'positiveContributionsQuantizedToZero': quantized_zero_contributions,
               'wrongFixedTarget424CoverageNegativeMissingContributions': wrong_target_missing}
    (out / (foot + '-coverage-summary.json')).write_text(json.dumps(summary, indent=2) + '\n')
    assert not lost, ('HOLD: actual positive quantizable paint lost at boundary or elsewhere', foot, len(lost))
    assert not boundary_mismatches, ('HOLD: supported boundary material/rounding discrepancy',foot,len(boundary_mismatches))
    return summary


def fractional_layer(source, field, foot, out):
    dx, dy = field['footDxDy']
    assert dx != round(dx) or dy != round(dy)
    source_im = Image.fromarray(source)
    shared = np.asarray(paint.warp_layer(source_im, field['nodes_y'], field['dx'], field['dy'])).copy()
    result = shared.copy()
    yy, xx = np.mgrid[:512, :512]
    sx, sy, inverse_residual = actual_inverse(field)
    pm = explicit_premul(source)
    all_expected_pm, all_taps = explicit_four_taps(pm, sx, sy)
    actual_shared_pm = paint.sample(paint.premul(source_im),sx,sy)
    float_difference = float(np.max(np.abs(actual_shared_pm-all_expected_pm)))
    # An operation-rounding bound for two independent float64 summation paths,
    # never an RGB/art tolerance. Quantized supportedRGBA remains literal.
    float_bound = 32*np.finfo(float).eps
    assert float_difference <= float_bound, ('Independent premul sample mismatch',foot,float_difference,float_bound)
    all_expected = explicit_quantize(all_expected_pm)
    analytical_sx, analytical_sy = xx - dx, yy - dy
    rigid_pm, rigid_taps = explicit_four_taps(pm, analytical_sx, analytical_sy)
    expected = explicit_quantize(rigid_pm)
    rigid = rigid_taps['allRigid']
    assert np.max(np.abs(sx[rigid] - analytical_sx[rigid])) < 1e-7
    assert np.max(np.abs(sy[rigid] - analytical_sy[rigid])) < 1e-7
    identity = np.broadcast_to((np.arange(512) <= 363)[:, None], (512,512))
    assert not np.any(identity & rigid)
    assert np.all(sx[identity] == xx[identity]) and np.all(sy[identity] == yy[identity])
    result[identity] = source[identity]
    fringe = rigid & (expected[...,3] >= 1) & (expected[...,3] < 20)
    assert np.all(shared[fringe] == 0), 'Unexpected shared nonzero at proposed fractional fringe exception'
    mismatch = rigid & ~fringe & np.any(shared != expected, axis=2)
    mismatches = [{'foot':foot, 'targetX':int(x), 'targetY':int(y), 'expectedRGBA':expected[y,x].tolist(),
                   'sharedRGBA':shared[y,x].tolist(), 'sourceXY':[float(analytical_sx[y,x]),float(analytical_sy[y,x])]} for y,x in np.argwhere(mismatch)]
    (out / (foot + '-first-numeric-discrepancies.json')).write_text(json.dumps(mismatches,indent=2)+'\n')
    half_certificates, half_negatives = classify_supported_exact_half_mismatches(
        source, field, OWN_FIXED, OWN_MASTER, shared, expected, actual_shared_pm, rigid_pm, sx, sy, mismatches, foot, out)
    result[fringe] = expected[fringe]
    v1_prefix = result.copy()
    boundary, boundary_info = mixed_boundary_class(source,field,OWN_FIXED,shared,all_expected,all_taps,sx,sy,rigid,identity)
    result[boundary] = all_expected[boundary]
    boundary_labels, boundary_components = mixed_boundary_components(source,boundary,all_taps,sx,sy,shared,all_expected,boundary_info['localJacobian'])
    validate_mixed_output(result,v1_prefix,boundary,all_expected)
    (out / (foot + '-mixed-boundary-components.json')).write_text(json.dumps(boundary_components,indent=2)+'\n')
    assert not np.any((result[...,3] == 0) & np.any(result[...,:3] != 0,axis=2) & rigid)
    Image.fromarray(shared).save(out / (foot + '-fractional-shared.png'))
    Image.fromarray(result).save(out / (foot + '-fractional-candidate.png'))
    changed = np.any(result != shared, axis=2)
    assert not np.any(changed & ~(identity | fringe | boundary))
    assert np.array_equal(result[identity], source[identity])
    exceptions = []
    for y,x in np.argwhere(changed):
        local_identity = bool(identity[y,x])
        samples = []
        if local_identity:
            samples = [{'xy':[int(x),int(y)],'weight':1.0,'rgba':source[y,x].tolist()}]
        else:
            selected_taps = all_taps if boundary[y,x] else rigid_taps
            for tx,ty,w in zip(selected_taps['x'],selected_taps['y'],selected_taps['w']):
                if w[y,x] > 0:
                    samples.append({'xy':[int(tx[y,x]),int(ty[y,x])], 'weight':float(w[y,x]),
                                    'rgba':source[ty[y,x],tx[y,x]].tolist()})
        exceptions.append({'foot':foot,'domain':'identity' if local_identity else ('fractional-mixed-boundary-fringe' if boundary[y,x] else 'fractional-rigid-fringe'),
                           'targetXY':[int(x),int(y)],'sourceXY':[float(sx[y,x]),float(sy[y,x])],
                           'samples':samples,'sharedRGBA':shared[y,x].tolist(),'candidateRGBA':result[y,x].tolist()})
    (out / (foot + '-every-local-exception.json')).write_text(json.dumps(exceptions,indent=2)+'\n')
    # Mixed423/424 and every positive source424+ contribution are audited;
    # no boundary exception, loss suppression or domain expansion is allowed.
    coverage = source_coverage(source,field,result,all_expected,all_taps,rigid,foot,out)
    boundary_negatives = mixed_positive_negative_controls(source,field,OWN_FIXED,shared,v1_prefix,result,boundary,all_expected,all_taps,sx,sy,rigid,identity)
    relevant = rigid & (rigid_pm[...,3] > 0)
    nearest_x = np.clip(np.rint(analytical_sx).astype(int),0,511)
    nearest_y = np.clip(np.rint(analytical_sy).astype(int),0,511)
    nearest = pm[nearest_y,nearest_x]
    wrong_gamma_pm = source.astype(float) / 255
    wrong_gamma_pm[...,:3] *= wrong_gamma_pm[...,3,None]
    wrong_gamma, _ = explicit_four_taps(wrong_gamma_pm,analytical_sx,analytical_sy)
    shifted, _ = explicit_four_taps(pm,analytical_sx+.5,analytical_sy)
    straight_source = source.astype(float)/255
    rgb = straight_source[...,:3]
    straight_source[...,:3] = np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4)
    unpremul,_ = explicit_four_taps(straight_source,analytical_sx,analytical_sy)
    negatives = {'nearestMismatchSamples':int(np.any(np.abs(nearest-rigid_pm)>32*np.finfo(float).eps,axis=2)[relevant].sum()),
                 'wrongSRGBAverageMismatchSamples':int(np.any(np.abs(wrong_gamma-rigid_pm)>32*np.finfo(float).eps,axis=2)[relevant].sum()),
                 'missingPremultiplyMismatchSamples':int(np.any(np.abs(unpremul-rigid_pm)>32*np.finfo(float).eps,axis=2)[relevant].sum()),
                 'halfPixelOffsetMismatchSamples':int(np.any(np.abs(shifted-rigid_pm)>32*np.finfo(float).eps,axis=2)[relevant].sum()),
                 'oldAlpha20CleanupLostQuantizablePixels':int(fringe.sum())}
    assert all(n > 0 for n in negatives.values()), ('Actual-data negative control vacuous',foot,negatives)
    return Image.fromarray(result), {'field':field,'inverseResidual':inverse_residual,
           'maximumIndependentPremulFloatDifference':float_difference,'floatOperationRoundingBound':float_bound,
           'fractionalRigidFringeExceptions':int(fringe.sum()), 'identityReplacements':int((changed&identity).sum()),
           'mixedBoundaryFringeExceptions':int(boundary.sum()),'mixedBoundaryComponents':boundary_components,
           'newBoundaryNegativeControls':boundary_negatives,'v1PrefixOutsideNewClassRGBAExact':True,
           'legacyLiteralQuantizedAgreement':not bool(mismatches),
           'supportedAlphaExactHalfCertificates':half_certificates,
           'newHalfCertificateNegativeControls':half_negatives,
           'actualNonzeroA0FractionalOutput':int(((result[...,3]==0)&np.any(result[...,:3]!=0,axis=2)&rigid).sum()),
           'coverage':coverage,'negativeControls':negatives,'outsideProvenDomainsUnchanged':True,
           'noThresholdOrSharedCodeChange':True}


# Exact accepted actor-owned integer branch; not an expected-image seed.
def translated_domain(source, dx, dy, source_y0):
    """Forward-map the entire SOURCE y>=source_y0 rectangle and its RGBA."""
    h, w = source.shape[:2]
    sy0, sy1 = max(source_y0, -dy), min(h, h - dy)
    sx0, sx1 = max(0, -dx), min(w, w - dx)
    assert sy1 > sy0 and sx1 > sx0
    target = np.zeros_like(source)
    mask = np.zeros((h, w), bool)
    target[sy0 + dy:sy1 + dy, sx0 + dx:sx1 + dx] = source[sy0:sy1, sx0:sx1]
    mask[sy0 + dy:sy1 + dy, sx0 + dx:sx1 + dx] = True
    yy, xx = np.where((source[..., 3] > 0) & (np.arange(h)[:, None] >= source_y0))
    assert len(yy) > 0
    assert np.all((xx + dx >= 0) & (xx + dx < w) & (yy + dy >= 0) & (yy + dy < h)), 'Rigid wholefoot paint cannot clip'
    return target, mask, [sx0, sy0, sx1, sy1], [sx0 + dx, sy0 + dy, sx1 + dx, sy1 + dy]


def integer_layer(source, field, foot, key, audit_rows):
    xf = PchipInterpolator(field['nodes_y'], field['dx'])
    yf = PchipInterpolator(field['nodes_y'], field['dy'])
    root = field['stationaryThroughY']
    plateau = field['wholeFootRigidFromY']
    dx, dy = [int(v) for v in field['footDxDy']]
    assert all(a == b for a, b in zip(field['footDxDy'], [dx, dy]))
    yy = np.arange(512)
    assert np.all(xf(yy[:root + 1]) == 0) and np.all(yf(yy[:root + 1]) == 0)
    shared = np.asarray(paint.warp_layer(Image.fromarray(source), field['nodes_y'], field['dx'], field['dy'])).copy()
    result = shared.copy()
    # The identity source domain maps to itself. This preserves exact accepted
    # source RGBA where the field is proven identically zero, without changing
    # ownership or adding a stationary trouser mask.
    identity = np.broadcast_to((yy <= root)[:, None], (512, 512))
    result[identity] = source[identity]
    rigid, mapped, source_rect, target_rect = translated_domain(source, dx, dy, plateau)
    # Crucially this target domain is FORWARD-MAPPED from source424+ by dy;
    # a lifted foot starts at419, not a fixed target424 cutoff.
    assert not np.any(identity & mapped)
    result[mapped] = rigid[mapped]
    assert np.array_equal(result[identity], source[identity])
    assert np.array_equal(result[target_rect[1]:target_rect[3], target_rect[0]:target_rect[2]],
                          source[source_rect[1]:source_rect[3], source_rect[0]:source_rect[2]])
    changed = np.any(result != shared, axis=2)
    assert not np.any(changed & ~(identity | mapped))
    replace_identity = changed & identity
    replace_rigid = changed & mapped
    for y, x in np.argwhere(changed):
        domain = 'identity' if identity[y, x] else 'source-rigid424+'
        sx, sy = (int(x), int(y)) if domain == 'identity' else (int(x - dx), int(y - dy))
        old = shared[y, x].tolist()
        new = result[y, x].tolist()
        audit_rows.append({'key': key, 'foot': foot, 'domain': domain, 'targetX': int(x), 'targetY': int(y),
            'sourceX': sx, 'sourceY': sy, 'sourceRGBA': ','.join(map(str, source[sy, sx].tolist())),
            'sharedRGBA': ','.join(map(str, old)), 'exactRGBA': ','.join(map(str, new)),
            'changedByteCount': sum(a != b for a, b in zip(old, new))})
    points = {}
    for name, (sx, sy) in CONTROLS[foot + 'Witnesses'].items():
        assert sy >= plateau
        patch = source[sy - 2:sy + 3, sx - 2:sx + 3]
        assert patch.shape == (5, 5, 4) and int((patch[..., 3] >= 20).sum()) > 0, (foot, name, 'No actual source support')
        points[name] = {'sourceXY': [sx, sy], 'targetXY': [sx + dx, sy + dy],
            'sourceRGBA': source[sy, sx].tolist(), 'patchAlpha20': int((patch[..., 3] >= 20).sum()),
            'patchAlpha200': int((patch[..., 3] >= 200).sum()),
            'wholeTargetPatchRGBAExact': np.array_equal(result[sy + dy - 2:sy + dy + 3, sx + dx - 2:sx + dx + 3], patch)}
        assert points[name]['wholeTargetPatchRGBAExact']
    delta = np.abs(result.astype(np.int16) - shared.astype(np.int16))
    return Image.fromarray(result), {'field': field, 'sourceRigidDomain': source_rect, 'mappedTargetRigidDomain': target_rect,
        'identityReplacedPixels': int(replace_identity.sum()), 'rigidReplacedPixels': int(replace_rigid.sum()),
        'replacedChannelBytes': int((result != shared).sum()),
        'replacedSourceAlpha1To19': sum(1 for r in audit_rows if r['key'] == key and r['foot'] == foot and 0 < int(r['sourceRGBA'].split(',')[3]) < 20),
        'maximumReplacedRGBA': delta[changed].max(axis=0).astype(int).tolist() if np.any(changed) else [0, 0, 0, 0],
        'allIdentityRGBAExact': True, 'allMappedRigidRGBAExact': True,
        'wholeRigidSourcePositivePixels': int(((source[..., 3] > 0) & (yy[:, None] >= plateau)).sum()),
        'witnesses': points}



"""Functions appended to a versioned v1 copy; never edits the v1/shared sampler."""


def mixed_boundary_class(source,field,fixed,shared,expected,taps,sx,sy,rigid,identity,blocked_domain=None):
    plateau=field['wholeFootRigidFromY'];assert plateau==424
    lower=np.zeros((512,512),bool);upper=lower.copy();own_upper=lower.copy();nonfixed=np.ones((512,512),bool)
    for x,y,w in zip(taps['x'],taps['y'],taps['w']):
        positive=w>0;inside=(x>=0)&(x<512)&(y>=0)&(y<512)
        xx,yy=np.clip(x,0,511),np.clip(y,0,511)
        lower|=positive&(y<plateau);upper|=positive&(y>=plateau)
        own_upper|=positive&inside&(y>=plateau)&(source[yy,xx,3]>0)
        allowed=inside&(fixed[yy,xx,3]==0)
        if blocked_domain is not None:allowed&=blocked_domain[yy,xx]
        nonfixed&=(~positive)|allowed
    yf=PchipInterpolator(field['nodes_y'],field['dy'])
    local_jac=1+yf.derivative()(np.clip(sy,0,511))
    structural=taps['allInside']&lower&upper&own_upper&nonfixed&(local_jac>.5)&~rigid&~identity
    supported=structural&(expected[...,3]>=20)
    assert np.array_equal(shared[supported],expected[supported]),'Supported mixed-boundary literalRGBA discrepancy'
    low=structural&(expected[...,3]>=1)&(expected[...,3]<20)
    assert np.all(shared[low]==0),'Mixed-boundary low coverage must have original sharedRGBA0'
    return low,{'structuralMask':structural,'localJacobian':local_jac,'nonfixedMask':nonfixed}


def mixed_boundary_components(source,mask,taps,sx,sy,shared,expected,local_jac):
    from scipy.ndimage import label
    labels,count=label(mask,np.ones((3,3),dtype=int));components=[]
    for index in range(1,count+1):
        yy,xx=np.where(labels==index);pixels=[]
        for y,x in zip(yy.tolist(),xx.tolist()):
            source_taps=[]
            for tx,ty,w in zip(taps['x'],taps['y'],taps['w']):
                if w[y,x]>0:
                    source_taps.append({'sourceXY':[int(tx[y,x]),int(ty[y,x])],'weight':float(w[y,x]),
                                        'sourceRGBA':source[ty[y,x],tx[y,x]].tolist(),
                                        'material':'own painted contributor' if source[ty[y,x],tx[y,x],3]>0 else 'transparent zero material'})
            pixels.append({'targetXY':[x,y],'actualNonlinearSourceXY':[float(sx[y,x]),float(sy[y,x])],
                           'localJacobian':float(local_jac[y,x]),'sourceTaps':source_taps,
                           'sharedRGBA':shared[y,x].tolist(),'expectedRGBA':expected[y,x].tolist()})
        components.append({'id':index,'targetBounds':[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)],
                           'pixelCount':len(pixels),'pixels':pixels})
    return labels,components


def validate_mixed_output(candidate,prefix,eligible,expected):
    assert not np.any(np.any(candidate!=prefix,axis=2)&~eligible),'Candidate changed outside actual eligible boundary domain'
    assert np.array_equal(candidate[eligible],expected[eligible]),'Candidate dropped or changed true owned boundary coverage'


def mixed_positive_negative_controls(source,field,fixed,shared,prefix,candidate,mask,expected,taps,sx,sy,rigid,identity):
    if not np.any(mask):return {'scope':'Not applicable: no new mixed-boundary pixels; no vacuous assertion'}
    rows=np.argwhere(mask);y,x=map(int,rows[0]);pm=explicit_premul(source)
    def reject(call):
        try:call()
        except AssertionError:return True
        raise AssertionError('Actual-data boundary negative was not rejected')
    bad=candidate.copy();bad[y,x]=0
    deleted_candidate=reject(lambda:validate_mixed_output(bad,prefix,mask,expected))
    contributors=[(int(tx[y,x]),int(ty[y,x]))for tx,ty,w in zip(taps['x'],taps['y'],taps['w'])
                  if w[y,x]>0 and ty[y,x]>=424 and source[ty[y,x],tx[y,x],3]>0]
    assert contributors
    damaged=source.copy()
    for cx,cy in contributors:damaged[cy,cx]=0
    damaged_pm,_=explicit_four_taps(explicit_premul(damaged),np.array([[sx[y,x]]]),np.array([[sy[y,x]]]))
    damaged_rgba=explicit_quantize(damaged_pm)[0,0]
    bad=candidate.copy();bad[y,x]=damaged_rgba
    deleted_source=reject(lambda:validate_mixed_output(bad,prefix,mask,expected))
    shifted_pm,_=explicit_four_taps(pm,np.array([[sx[y,x]+.5]]),np.array([[sy[y,x]]]))
    shifted_rgba=explicit_quantize(shifted_pm)[0,0];bad=candidate.copy();bad[y,x]=shifted_rgba
    shifted=reject(lambda:validate_mixed_output(bad,prefix,mask,expected))
    xf=PchipInterpolator(field['nodes_y'],field['dx']);yf=PchipInterpolator(field['nodes_y'],field['dy'])
    wrong_sx=x-field['footDxDy'][0];wrong_sy=y-field['footDxDy'][1]
    residual=max(abs(wrong_sx+xf(wrong_sy)-x),abs(wrong_sy+yf(wrong_sy)-y))
    def validate_inverse():assert residual<1e-7,'Actual rigid-for-nonlinear inverse error'
    wrong_inverse=reject(validate_inverse)
    allowed=np.ones((512,512),bool)
    for cx,cy in contributors:allowed[cy,cx]=False
    wrong_owner,_=mixed_boundary_class(source,field,fixed,shared,expected,taps,sx,sy,rigid,identity,allowed)
    wrong_ownership=reject(lambda:validate_mixed_output(candidate,prefix,wrong_owner,expected))
    return {'actualComponentTarget':[x,y],'candidateRGBADeletionDetected':deleted_candidate,
            'actualContributorLossDetected':deleted_source,'deletedContributorSourceXY':contributors,
            'sourceLossPipelineRGBA':damaged_rgba.tolist(),'referenceRGBA':expected[y,x].tolist(),
            'halfPixelPipelineRGBA':shifted_rgba.tolist(),'halfPixelMaterialErrorDetected':shifted,
            'incorrectRigidInverseDetected':wrong_inverse,'incorrectRigidInverseForwardResidual':float(residual),
            'incorrectContributorOwnershipDetected':wrong_ownership,
            'counterfactualsOnlyInRAM':True,'notHashOrLegacyRejectionOnly':True}


"""Guard-only additions appended to an exact copy of Waltraud material helper v2.
No raster assignment, source modification, numeric tolerance, or quantizer change.
"""
from fractions import Fraction
import itertools
import math


def supported_alpha_exact_half_certificate(source, field, fixed, master, tx, ty,
                                           source_x, source_y, shared_rgba, oracle_rgba,
                                           shared_premul, oracle_premul):
    assert source.shape == fixed.shape == master.shape == (512, 512, 4)
    assert 0 <= tx < 512 and 0 <= ty < 512
    assert all(np.isfinite(v) for v in [source_x, source_y, *shared_premul, *oracle_premul])
    dx, dy = field['footDxDy']
    assert field['wholeFootRigidFromY'] == 424
    assert source_x == tx - dx and source_y == ty - dy, 'Actual inverse must equal rigid field inverse'
    xf = PchipInterpolator(field['nodes_y'], field['dx'])
    yf = PchipInterpolator(field['nodes_y'], field['dy'])
    assert float(xf(source_y)) == dx and float(yf(source_y)) == dy
    assert float(xf.derivative()(source_y)) == 0
    assert float(yf.derivative()(source_y)) == 0
    assert source_x + dx == tx and source_y + dy == ty
    assert 1 + float(yf.derivative()(source_y)) == 1
    assert shared_rgba[3] >= 20 and oracle_rgba[3] >= 20
    assert np.array_equal(shared_rgba[:3], oracle_rgba[:3]), 'RGB disagreement is never certified'
    assert int(np.rint(float(shared_premul[3]) * 255)) == int(shared_rgba[3])
    assert int(np.rint(float(oracle_premul[3]) * 255)) == int(oracle_rgba[3])
    x0, y0 = math.floor(source_x), math.floor(source_y)
    u = Fraction.from_float(float(source_x)) - x0
    v = Fraction.from_float(float(source_y)) - y0
    exact_weights = [(1-u)*(1-v), u*(1-v), (1-u)*v, u*v]
    uf, vf = float(u), float(v)
    float_weights = [(1-uf)*(1-vf), uf*(1-vf), (1-uf)*vf, uf*vf]
    points = [(x0, y0), (x0+1, y0), (x0, y0+1), (x0+1, y0+1)]
    assert sum(exact_weights) == 1
    taps = []
    alpha_terms = []
    byte_alpha = Fraction()
    for (x, y), w, wf in zip(points, exact_weights, float_weights):
        assert w > 0 and float(w) == wf, 'All four actual weights must be positive and exactly represented'
        assert 0 <= x < 512 and 424 <= y < 512
        rgba = source[y, x]
        assert rgba[3] > 0, 'Every formal tap must carry actual own positive source paint'
        assert not np.any(fixed[y, x]), 'No fixed foreground material may enter this certificate'
        assert np.array_equal(rgba, master[y, x]), 'Own source must literally equal original master paint'
        a = int(rgba[3])
        byte_alpha += a * w
        alpha_terms.append((a / 255) * wf)
        taps.append({'xy': [x, y], 'sourceRGBA': rgba.tolist(), 'weightExact': str(w),
                     'weightF64Hex': wf.hex(), 'fixedRGBA': fixed[y, x].tolist(),
                     'originalMasterRGBAExact': True})
    half = Fraction(math.floor(byte_alpha), 1) + Fraction(1, 2)
    assert byte_alpha == half, 'Only a mathematically exact source8bit alpha half is admitted'
    nearest_even = round(byte_alpha)
    assert int(shared_rgba[3]) == nearest_even, 'Canonical output must equal exact nearest-even'
    opposite_half_neighbor = math.ceil(byte_alpha) if nearest_even == math.floor(byte_alpha) else math.floor(byte_alpha)
    assert int(oracle_rgba[3]) == opposite_half_neighbor, 'Only the other exact half neighbor may disagree'
    association_values = set()
    for order in itertools.permutations(range(4)):
        value = 0.0
        for index in order:
            value += alpha_terms[index]
        association_values.add(value)
    # Literal membership in the same four F64 terms' association results, not an epsilon.
    assert float(shared_premul[3]) in association_values
    assert float(oracle_premul[3]) in association_values
    return {'targetXY': [tx, ty], 'sourceXY': [source_x, source_y],
            'allFourTaps': taps, 'exactSourceByteAlpha': str(byte_alpha),
            'exactNearestEven': nearest_even, 'sharedRGBA': shared_rgba.tolist(),
            'floatingOracleRGBA': oracle_rgba.tolist(),
            'sharedAlphaTimes255Hex': float(shared_premul[3] * 255).hex(),
            'oracleAlphaTimes255Hex': float(oracle_premul[3] * 255).hex(),
            'literalAssociationValuesHex': sorted(value.hex() for value in association_values),
            'localJacobian': 1, 'legacyLiteralSharedOraclePredicate': False,
            'rasterChangedByCertificate': False, 'noToleranceOrRoundModeChange': True}


def exact_half_point_pipeline(source, source_x, source_y):
    """One-point counterfactual with the actual sampler on its exact local stencil."""
    x0, y0 = math.floor(source_x) - 1, math.floor(source_y) - 1
    assert 0 <= x0 and x0+4 <= 512 and 0 <= y0 and y0+4 <= 512
    patch = source[y0:y0+4, x0:x0+4]
    px = np.array([[source_x-x0]], dtype=float)
    py = np.array([[source_y-y0]], dtype=float)
    shared_pm = paint.sample(paint.premul(Image.fromarray(patch)), px, py)
    # The exact same four-tap implementation requires source coordinates512;
    # here only its explicit arithmetic is evaluated on the actual4x4 patch.
    u, v = float(px[0, 0] % 1), float(py[0, 0] % 1)
    ix, iy = math.floor(px[0, 0]), math.floor(py[0, 0])
    pm = explicit_premul(patch)
    oracle_pm = np.zeros((1, 1, 4), dtype=float)
    for x, y, w in [(ix, iy, (1-u)*(1-v)), (ix+1, iy, u*(1-v)),
                    (ix, iy+1, (1-u)*v), (ix+1, iy+1, u*v)]:
        oracle_pm[0, 0] += pm[y, x] * w
    return (np.asarray(paint.unpack(shared_pm))[0, 0], explicit_quantize(oracle_pm)[0, 0],
            shared_pm[0, 0], oracle_pm[0, 0])


def exact_half_positive_pipeline_negatives(source, field, fixed, master, tx, ty,
                                          source_x, source_y, shared, oracle, shared_pm, oracle_pm):
    def reject(label, input_source, input_x, input_y, values):
        try:
            supported_alpha_exact_half_certificate(input_source, field, fixed, master,
                tx, ty, input_x, input_y, *values)
        except AssertionError as error:
            return {'name': label, 'rejectedByNewCertificate': True, 'reason': str(error),
                    'actualSharedRGBA': values[0].tolist(), 'actualOracleRGBA': values[1].tolist()}
        raise AssertionError(('Actual positive-pipeline negative was admitted', label))
    rows = []
    canonical = int(shared[3])
    alternatives = [int(oracle[3])]
    alternatives.extend(value for value in (canonical-1, canonical+1, canonical-2, canonical+2)
                        if 20 <= value <= 255 and value != canonical and value not in alternatives)
    for bad_alpha in alternatives[:3]:
        assert 20 <= bad_alpha <= 255 and bad_alpha != canonical
        bad = shared.copy()
        bad[3] = bad_alpha
        rows.append(reject('canonical-alpha-tamper-' + str(bad_alpha), source, source_x, source_y,
                           (bad, oracle, shared_pm, oracle_pm)))
    damaged = source.copy()
    removed_x, removed_y = math.floor(source_x), math.floor(source_y)
    assert damaged[removed_y, removed_x, 3] > 0
    damaged[removed_y, removed_x] = 0
    damaged_values = exact_half_point_pipeline(damaged, source_x, source_y)
    assert not np.array_equal(damaged_values[0], shared), 'Contributor-loss counterfactual must change actual sampled material'
    removed = reject('actual-source-contributor-removed', damaged, source_x, source_y, damaged_values)
    removed['removedActualSourceXY'] = [removed_x, removed_y]
    rows.append(removed)
    shifted_values = exact_half_point_pipeline(source, source_x+.5, source_y)
    assert not np.array_equal(shifted_values[0], shared), 'Wrong-inverse control must change actual sampled material'
    rows.append(reject('wrong-inverse-half-pixel', source, source_x+.5, source_y, shifted_values))
    bad_rgb = shared.copy()
    bad_rgb[0] ^= 1
    rows.append(reject('actual-canonical-RGB-tamper', source, source_x, source_y,
                       (bad_rgb, oracle, shared_pm, oracle_pm)))
    return {'actualPositivePipelineCounterfactuals': rows,
            'noHashOnlyOrLegacyPredicateRejection': True, 'RAMOnlyNoRasterChange': True}


def classify_supported_exact_half_mismatches(source, field, fixed, master, shared, oracle,
                                            shared_pm, oracle_pm, sx, sy, mismatches, foot, out):
    certificates, rejected, negatives = [], [], []
    for row in mismatches:
        tx, ty = row['targetX'], row['targetY']
        values = (shared[ty, tx], oracle[ty, tx], shared_pm[ty, tx], oracle_pm[ty, tx])
        try:
            certificate = supported_alpha_exact_half_certificate(source, field, fixed, master,
                tx, ty, float(sx[ty, tx]), float(sy[ty, tx]), *values)
        except AssertionError as error:
            rejected.append({'originalMismatch': row, 'reason': str(error)})
            continue
        certificates.append(certificate)
        negatives.append(exact_half_positive_pipeline_negatives(source, field, fixed, master,
            tx, ty, float(sx[ty, tx]), float(sy[ty, tx]), *values))
    (out / (foot + '-supported-alpha-exact-half-certificates.json')).write_text(json.dumps({
        'legacyLiteralPredicate': not bool(mismatches), 'certificates': certificates,
        'unclassifiedFatal': rejected, 'positivePipelineNegatives': negatives,
        'noRasterReplacement': True}, indent=2) + '\n')
    assert not rejected, ('HOLD: uncertified literal supported-material disagreement', foot, rejected)
    return certificates, negatives
