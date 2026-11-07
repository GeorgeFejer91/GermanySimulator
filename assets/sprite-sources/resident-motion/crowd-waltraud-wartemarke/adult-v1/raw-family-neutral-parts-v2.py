"""Rebuild Waltraud's exact own parts using only raw-rebuilt inputs and controls."""
import hashlib
from pathlib import Path

import numpy as np
from PIL import Image


def rgba(path):
    with Image.open(path) as image:
        return np.asarray(image.convert('RGBA')).copy()


def compose(*layers):
    result = Image.new('RGBA', (512, 512))
    for layer in layers:
        result = Image.alpha_composite(result, Image.fromarray(layer))
    return result


def cardinal_parts(original, config, heading):
    spec = config['views'][heading]
    xx, yy = np.meshgrid(np.arange(512) + .5, np.arange(512) + .5)
    positive = original[..., 3] > 0
    rim = np.asarray(spec['rimProposal'], dtype=np.float64)
    seam = np.asarray(spec['lowerSeamProposal'], dtype=np.float64)
    rim_y = np.interp(xx[0], rim[:, 0], rim[:, 1])
    seam_x = np.interp(yy[:, 0], seam[:, 0], seam[:, 1])
    forebody = positive & (yy <= rim_y[None, :])
    contact = positive & ~forebody & (yy <= config['stationaryContactThroughRow'] + .5)
    remaining = positive & ~forebody & ~contact
    left = remaining & (xx < seam_x[:, None])
    right = remaining & ~left
    masks = {'forebody': forebody, 'unresolved-stationary-contact': contact,
             'screen-left-lower': left, 'screen-right-lower': right}
    assert np.array_equal(np.stack(list(masks.values())).sum(axis=0), positive.astype(np.int64))
    parts = {}
    for name, mask in masks.items():
        part = np.zeros_like(original)
        part[mask] = original[mask]
        if name == 'forebody':
            part[~positive] = original[~positive]
        parts[name] = part
    assert np.array_equal(np.stack(list(parts.values())).astype(np.uint16).sum(axis=0), original.astype(np.uint16))
    order = ('screen-left-lower', 'screen-right-lower', 'unresolved-stationary-contact', 'forebody')
    neutral = np.asarray(compose(*(parts[k] for k in order))).copy()
    assert np.array_equal(neutral, original)
    supported = (yy >= 424) & positive
    assert np.array_equal((parts['screen-left-lower'] + parts['screen-right-lower'])[supported], original[supported])
    for name, (x0, y0, x1, y1) in spec['observedRegions'].items():
        zone = np.zeros_like(positive)
        zone[y0:y1, x0:x1] = True
        observed = zone & positive
        assert np.any(observed)
        if 'WholeFoot' in name:
            assert not np.any(observed & ~(left if 'Left' in name else right))
        else:
            assert not np.any(observed & ~(forebody | contact))
    return {**parts, 'neutral': neutral}


def profile_parts(original, raw_far, config, heading):
    xx, yy = np.arange(512), np.arange(512)[:, None]
    positive = original[..., 3] > 0
    curve_points = config['hemCurves'][heading]
    curve = np.interp(xx, [p[0] for p in curve_points], [p[1] for p in curve_points])
    lower_columns = np.any(positive[355:439], axis=0)
    exterior = positive & (yy >= 338) & (yy <= 353) & ~lower_columns[None, :]
    fixed_mask = (positive & (yy <= curve[None, :])) | exterior
    lower_mask = positive & ~fixed_mask
    fixed = np.zeros_like(original)
    near = np.zeros_like(original)
    fixed[fixed_mask], near[lower_mask] = original[fixed_mask], original[lower_mask]
    assert np.array_equal(np.asarray(compose(near, fixed)), original)
    raw_part = np.zeros_like(raw_far)
    x0, x1 = config['rawHalfDomains'][heading]
    raw_part[:, x0:x1] = raw_far[:, x0:x1]
    scale = config['uniformFarScale']
    tx, ty = config['translations'][heading]
    far = Image.fromarray(raw_part).convert('RGBa').transform((512, 512), Image.Transform.AFFINE,
        (1 / scale, 0, -tx / scale, 0, 1 / scale, -ty / scale), Image.Resampling.BICUBIC).convert('RGBA')
    far = np.asarray(far).copy()
    far[~((yy > curve[None, :]) | fixed_mask)] = 0
    neutral = np.asarray(Image.alpha_composite(Image.alpha_composite(
        Image.fromarray(far), Image.fromarray(near)), Image.fromarray(fixed))).copy()
    return {'fixed-original': fixed, 'lower-original': near, 'far-occluded-domain': far, 'neutral': neutral}


def run(source, out, controls):
    source, out = Path(source), Path(out)
    assert not out.exists()
    out.mkdir(parents=True)
    path = source / 'raw-far-legs-v1.png'
    assert hashlib.sha256(path.read_bytes()).hexdigest() == controls['profile']['farRawSha256']
    far = rgba(path)
    files = {}
    for heading in ('down', 'right', 'up', 'left'):
        original = rgba(source / 'registered' / (heading + '.png'))
        assert original.shape == (512, 512, 4)
        parts = (cardinal_parts(original, controls['cardinal'], heading) if heading in ('down', 'up')
                 else profile_parts(original, far, controls['profile'], heading))
        for name, pixels in parts.items():
            target = out / (heading + '-' + name + '.png')
            Image.fromarray(pixels).save(target)
            files[target.name] = target
    assert len(files) == 18
    return files

