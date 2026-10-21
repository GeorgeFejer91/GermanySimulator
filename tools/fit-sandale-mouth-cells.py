"""Fit inspected own lip seeds to final Sandale cells; never activate runtime art."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import map_coordinates
from scipy.optimize import least_squares

ROOT = Path(__file__).resolve().parents[1]


def load_compiler():
    spec = importlib.util.spec_from_file_location('street_lips', ROOT / 'tools/build-street-mouths.py')
    compiler = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = compiler
    spec.loader.exec_module(compiler)
    return compiler


def align_paint(reference, target, center):
    cx, cy = center
    yy, xx = np.mgrid[int(cy)-11:int(cy)+5, int(cx)-9:int(cx)+10]
    points = np.stack([xx.ravel(), yy.ravel()], axis=1)
    relative = points - center
    values = reference[yy.ravel(), xx.ravel(), :3].astype(float)

    def residual(parameters):
        matrix = np.array([[parameters[0], parameters[1]], [parameters[3], parameters[4]]])
        xy = relative @ matrix.T + center + parameters[[2, 5]]
        sample = np.stack([map_coordinates(target[:, :, channel], [xy[:, 1], xy[:, 0]],
                           order=1, mode='nearest') for channel in range(3)], axis=1)
        return (sample - values).ravel()

    initial = min((float(np.mean(residual(np.array([1, 0, dx, 0, 1, dy])) ** 2)), dx, dy)
                  for dx in range(-6, 7) for dy in range(-6, 7))
    fit = least_squares(residual, [1, 0, initial[1], 0, 1, initial[2]],
                        bounds=([.8, -.16, -6, -.16, .8, -6], [1.2, .16, 6, .16, 1.2, 6]),
                        loss='soft_l1', f_scale=8, max_nfev=80)
    p = fit.x
    matrix = np.array([[p[0], p[1]], [p[3], p[4]]])
    return matrix, center + p[[2, 5]], {
        'rgbRMSE': float(np.mean(residual(p) ** 2) ** .5),
        'determinant': float(np.linalg.det(matrix)), 'solverConverged': bool(fit.success),
        'evaluations': int(fit.nfev), 'forwardMatrix': matrix.tolist(), 'translation': p[[2, 5]].tolist()}


def fit_cells(ident):
    compiler = load_compiler()
    seed_path = ROOT / f'assets/sprite-sources/sandale-mouths/{ident}-native-pilot-v1.registration.json'
    seeds = json.loads(seed_path.read_text())['registrations']
    for seed in seeds.values():
        compiler.compile_registration(seed)
    source = ROOT / seeds['down']['input']['file']
    atlas = Image.open(source).convert('RGBA')
    pixels = np.array(atlas, dtype=float)
    folder = ROOT / f'output/ambient-city-animation/sandale-mouth-inventory/{ident}/cell-fit-candidates'
    folder.mkdir(parents=True, exist_ok=True)
    entries, diagnostics = [], []
    cells = [(row, col, name) for row, name in [(0, 'down'), (1, 'right'), (3, 'left')] for col in range(8)]
    cells += [(row, col, name) for row, name in [(6, 'down'), (7, 'right'), (9, 'left')] for col in range(5)]
    board = Image.new('RGB', (1536, 500), '#e9e4d8')
    draw = ImageDraw.Draw(board)
    for index, (row, col, name) in enumerate(cells):
        seed = seeds[name]
        seed_origin = np.array(seed['cellOriginPx'])
        center = np.array(seed['centerPx']) - seed_origin
        sx, sy = seed_origin.astype(int)
        reference = pixels[sy:sy+208, sx:sx+192]
        target = pixels[row*208:(row+1)*208, col*192:(col+1)*192]
        matrix, fitted_center, evidence = align_paint(reference, target, center)
        origin = np.array([col*192, row*208])
        contours = {key: ((np.array(points)-seed['centerPx']) @ matrix.T + fitted_center + origin).tolist()
                    for key, points in seed['contoursPx'].items()}
        entry = {**seed, 'cellOriginPx': origin.tolist(), 'centerPx': (fitted_center+origin).tolist(),
                 'axesPx': (matrix @ np.array(seed['axesPx']).reshape(2, 2).T).T.ravel().tolist(),
                 'contoursPx': contours, 'nativeSource': {'pose': name, 'referenceCell': [int(sy//208), int(sx//192)]},
                 'status': 'UNREVIEWED final-pixel candidate; not original authored-field replay'}
        compiled = compiler.compile_registration(entry)
        local = {**entry, 'centerPx': fitted_center.tolist(),
                 'contoursPx': {key: (np.array(points)-origin).tolist() for key, points in contours.items()},
                 'previewCropPx': [col*192, row*208, (col+1)*192, (row+1)*208]}
        closed = np.array(compiler.preview(local, compiled, 0))
        opened = compiler.preview(local, compiled, 1)
        assert np.array_equal(closed, target.astype('uint8')), 'Zero mouth changed native paint'
        assert np.array_equal(np.array(opened)[:, :, 3], target[:, :, 3]), 'Mouth changed native alpha'
        box = (int(fitted_center[0])-11, int(fitted_center[1])-7,
               int(fitted_center[0])+13, int(fitted_center[1])+11)
        x, y = (index % 8)*192, (index//8)*100
        for side, image in enumerate([Image.fromarray(closed), opened]):
            tile = image.crop(box).resize((96, 72), Image.Resampling.NEAREST)
            board.paste(tile, (x+side*96, y+23), tile)
        draw.text((x+2, y+4), f'{row}:{col} {name} rgb{evidence["rgbRMSE"]:.1f}', fill='black')
        entries.append(entry)
        diagnostics.append({'row': row, 'col': col, 'pose': name, **evidence})
    board.save(folder / 'all-cells-source-open.png')
    record = {'id': ident, 'seedSha256': hashlib.sha256(seed_path.read_bytes()).hexdigest(),
              'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
              'scope': '39 visible gait/bridge candidate cells; manual review required. Rear and other cells not fitted. No runtime edits.',
              'frames': entries, 'diagnostics': diagnostics}
    (folder / 'registrations.json').write_text(json.dumps(record, indent=2)+'\n')
    print(json.dumps({'id': ident, 'cells': len(entries), 'maxRGBRMSE': max(d['rgbRMSE'] for d in diagnostics),
                      'notConverged': sum(not d['solverConverged'] for d in diagnostics), 'review': str(folder)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--character', required=True, choices=['towelMan', 'towelWoman'])
    fit_cells(parser.parse_args().character)
