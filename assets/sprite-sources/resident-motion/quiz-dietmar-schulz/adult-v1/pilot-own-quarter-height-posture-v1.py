"""Check a sole-fixed upper posture correction for the four tall quarter turns."""

import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.interpolate import PchipInterpolator
from scipy.ndimage import label
from scipy.optimize import brentq


ROOT = Path.cwd()
BASE = ROOT/'output/dietmar-schulz-height'
ASSET = ROOT/'assets/sprite-sources/resident-motion/quiz-dietmar-schulz/adult-v1'
OUT = BASE/'quarter-height-posture-pilot-v1'
UPPER_LAST = 110
FIXED_FROM = 150
QUARTERS = {'down-right':12,'up-right':8,'up-left':8,'down-left':12}


def load(name,path):
    spec = importlib.util.spec_from_file_location(name,path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def bounds(alpha):
    y,x = np.where(alpha >= 21)
    assert y.size
    return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]


def source_proposal(source,offset,paint,oracle):
    source_pixels = np.asarray(source)
    nodes = [0,UPPER_LAST,FIXED_FROM,511]
    shifts = [offset,offset,0,0]
    dy = PchipInterpolator(nodes,shifts)
    extrema = np.r_[nodes,dy.derivative(2).roots(extrapolate=False)]
    extrema = extrema[np.isfinite(extrema) & (extrema >= 0) & (extrema <= 511)]
    min_jac = float(np.min(1+dy.derivative()(extrema)))
    assert min_jac > .5
    rows = np.arange(512,dtype=float)
    inner = (rows > UPPER_LAST+offset) & (rows < FIXED_FROM)
    exact = rows.copy()
    exact[rows <= UPPER_LAST+offset] -= offset
    for index in np.flatnonzero(inner):
        exact[index] = brentq(lambda v:v+dy(v)-index,index-offset,index,xtol=1e-12)
    fixed_point = rows.copy()
    for _ in range(48):
        fixed_point = rows-dy(fixed_point.clip(0,511))
    assert float(np.max(np.abs(exact-fixed_point))) < 1e-10
    residual = float(np.max(np.abs(exact+dy(exact.clip(0,511))-rows)))
    assert residual < 1e-10
    yy,xx = np.mgrid[:512,:512]
    sy = np.broadcast_to(exact[:,None],yy.shape)
    shared = paint.sample(paint.premul(source),xx,sy)
    independent,taps = oracle.explicit_four_taps(oracle.explicit_premul(source_pixels),xx,sy)
    assert float(np.max(np.abs(shared-independent))) <= 32*np.finfo(float).eps
    expected = oracle.explicit_quantize(independent)
    proposed = np.asarray(paint.unpack(shared)).copy()
    positive = expected[...,3] >= 20
    assert np.array_equal(proposed[positive],expected[positive])
    fringe = (expected[...,3] > 0) & ~positive
    source_support = np.zeros(fringe.shape,dtype=bool)
    for sx,sy,weight in zip(taps['x'],taps['y'],taps['w']):
        source_support |= taps['allInside'] & (weight > 0) & (source_pixels[sy.clip(0,511),sx.clip(0,511),3] > 0)
    assert np.all(source_support[fringe])
    proposed[fringe] = expected[fringe]
    proposed[FIXED_FROM:] = source_pixels[FIXED_FROM:]
    assert np.array_equal(proposed[:FIXED_FROM],expected[:FIXED_FROM])
    rigid = proposed[offset:UPPER_LAST+offset+1]
    own = source_pixels[:UPPER_LAST+1]
    visible = own[...,3] > 0
    assert np.array_equal(rigid[visible],own[visible]) and np.array_equal(rigid[...,3],own[...,3])
    assert np.array_equal(proposed[FIXED_FROM:],source_pixels[FIXED_FROM:])
    assert label(proposed[...,3] >= 21)[1] <= label(source_pixels[...,3] >= 21)[1]
    return Image.fromarray(proposed),{'nodes_y':nodes,'dy':shifts,'minimumJacobian':min_jac,'inverseResidual':residual,
                                      'ownFringeSamples':int(fringe.sum()),'lowerPaintRGBAExactFromY':FIXED_FROM}


def main():
    source_helper = load('own_native_shape',BASE/'own-cardinal-neutral-v4.py')
    export = source_helper.load_export()
    oracle = load('own_independent_oracle',ROOT/'output/waltraud-height/mixed-material-helper-v3-exact-half.py')
    registration = json.loads((ASSET/'registration-v1.json').read_text())['directions']
    OUT.mkdir(exist_ok=False)
    result = {'status':'RUNNING','views':{},'current':None,'sourceFamilyScaleUnchanged':True}
    try:
        for heading,shift in QUARTERS.items():
            result['current'] = heading
            record = registration[heading]
            path = ASSET/record['file']
            assert sha(path) == record['sha256']
            with Image.open(path) as image:
                original = image.convert('RGBA')
            proposed,proof = source_proposal(original,shift,export.paint,oracle)
            original_alpha = np.asarray(original)[...,3]
            proposed_alpha = np.asarray(proposed)[...,3]
            old_bounds,new_bounds = bounds(original_alpha),bounds(proposed_alpha)
            assert new_bounds[1]-old_bounds[1] == shift and new_bounds[3] == old_bounds[3]
            path = OUT/f'{heading}-posture-source.png'
            proposed.save(path,compress_level=1)
            row = {'offset':shift,'proof':proof,'sourceBefore':old_bounds,'sourceAfter':new_bounds,
                   'candidate':{'path':path.relative_to(ROOT).as_posix(),'sha256':sha(path)},'native':{}}
            result['views'][heading] = row
            for tier in source_helper.TIERS:
                old_cell = source_helper.native(original,tier,export)
                new_cell = source_helper.native(proposed,tier,export)
                old_alpha,new_alpha = [np.asarray(cell)[...,3] for cell in (old_cell,new_cell)]
                before,after = bounds(old_alpha),bounds(new_alpha)
                assert before[3] == after[3] and after[1] > before[1]
                assert not any(np.any(edge) for edge in (new_alpha[0],new_alpha[-1],new_alpha[:,0],new_alpha[:,-1]))
                assert label(new_alpha >= 21)[1] <= label(old_alpha >= 21)[1]
                row['native'][tier] = {'before':before,'after':after}
                source_helper.board(OUT/f'{heading}-{tier}.png',[old_cell,new_cell],['Current quarter','Sole-fixed trial'],'#25272b',2)
            source_helper.board(OUT/f'{heading}-source.png',[original,proposed],['Current quarter','Sole-fixed trial'],'#eee8db',1)
        result.update(status='PRIVATE_QUARTER_HEIGHT_POSTURE_PILOT_TECHNICAL_PASS_ART_PENDING',current=None,
                      runtimeSelected=False)
    except Exception as error:
        result.update(status='FIRST_RED_HELD',error=repr(error))
        raise
    finally:
        with (OUT/'report.json').open('x',encoding='utf-8') as file:
            json.dump(result,file,indent=2,allow_nan=False)
            file.write('\n')


if __name__ == '__main__':
    main()
