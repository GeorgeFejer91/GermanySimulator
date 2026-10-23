"""Fit Aktenordner's inspected lip anchors to her unchanged delivery cells.

This writes review candidates only. Paint alignment transports each anchor's
own contours; it neither identifies anatomy nor approves the resulting fits.
"""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ID = 'crowd-irmgard-aktenordner'
SOURCE = ROOT / 'assets/sprite-sources/street-mouths' / ID
OUT = ROOT / 'output/ambient-city-animation/irmgard-mouths'


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def classify_pose(templates, target, bounds=(20, 16, 76, 60), radius=2):
    height, width = target.shape[:2]
    if (len(bounds) != 4 or any(type(v) is not int for v in bounds)
            or not radius <= bounds[0] < bounds[2] <= width-radius
            or not radius <= bounds[1] < bounds[3] <= height-radius):
        raise ValueError('Invalid inspected face classification crop')
    x0, y0, x1, y1 = bounds
    scores = []
    for name, reference in templates.items():
        if reference.shape != target.shape:
            raise ValueError('Mouth source template dimensions differ from target')
        best = min(float(np.mean((reference[y0:y1, x0:x1, :3]
                       - target[y0+dy:y1+dy, x0+dx:x1+dx, :3]) ** 2))
                   for dy in range(-radius, radius+1) for dx in range(-radius, radius+1))
        scores.append((best, name))
    if not scores:
        raise ValueError('Missing mouth source templates')
    scores.sort()
    return scores[0][1], scores[0][0] ** .5, scores[1][0] ** .5 if len(scores)>1 else float('inf')


def build(anchors_path=None, manifest_path=None, outdir=None):
    anchors_path = Path(anchors_path) if anchors_path is not None else SOURCE/'anchors-v1.json'
    manifest_path = Path(manifest_path) if manifest_path is not None else ROOT/'assets/characters/street/manifest.json'
    outdir = Path(outdir) if outdir is not None else OUT
    compiler = load('mouth_compiler', 'tools/build-street-mouths.py')
    fitter = load('mouth_aligner', 'tools/fit-sandale-mouth-cells.py')
    person = json.loads(manifest_path.read_text())['characters'][ID]
    seeds = json.loads(anchors_path.read_text())
    path = ROOT / person['variants']['desktop']['file'].removeprefix('./')
    assert digest(path) == seeds['sourceSha256'] == person['variants']['desktop']['sha256']
    image = Image.open(path).convert('RGBA')
    w, h = seeds['cell']
    cols, rows = person['grid']
    assert image.size == (w * cols, h * rows)
    pixels = np.asarray(image, dtype=float)

    def cell(row, col):
        return pixels[row*h:(row+1)*h, col*w:(col+1)*w]

    templates = {name: cell(*anchor['slot']) for name, anchor in seeds['views'].items()}

    entries, diagnostics, previews, frames = [], [], [], []
    source_info = dict(file=path.relative_to(ROOT).as_posix(), sha256=digest(path), dimensions=list(image.size))
    for slot in range(cols * rows):
        row, col = divmod(slot, cols)
        target = cell(row, col)
        if not np.any(target[:, :, 3]):
            frames.append(None)
            diagnostics.append(dict(slot=slot, view='unused', registration=None))
            continue
        name, rmse, runner_up = classify_pose(templates, target, seeds.get('classificationCropPx', [20,16,76,60]))
        seed = seeds['views'][name]
        diagnostic = dict(slot=slot, row=row, col=col, view=name, headRgbRMSE=rmse, nextViewRMSE=runner_up)
        if seed.get('mouth') is None:
            frames.append(None)
            diagnostic['registration'] = None
        else:
            mouth = seed['mouth']
            center = np.array(mouth['centerPx'])
            matrix, fitted_center, fit = fitter.align_paint(templates[name], target, center)
            offset = np.array([col*w, row*h])
            axes = (matrix @ np.array(mouth['axesPx']).reshape(2, 2).T).T.reshape(-1).tolist()
            contours = {key: ((np.array(points)-center) @ matrix.T + fitted_center + offset).tolist()
                        for key, points in mouth['contoursPx'].items()}
            entry = dict(input=source_info, cell=[w,h], cellOriginPx=offset.tolist(),
                         centerPx=(fitted_center+offset).tolist(), axesPx=axes, contoursPx=contours,
                         width=mouth['width'], teeth=mouth['teeth'], nativeSource=name)
            registration = compiler.compile_registration(entry)
            # Runtime registrations use canonical128x160 axes; UV fractions stay
            # cell-local. Each selected delivery scales axes to its decoded size.
            frames.append(dict(rect=registration['rect'], axes=[value*person['cell'][0]/w for value in axes], profile=registration['profile']))
            diagnostic.update(registrationIndex=len(entries), fit=fit)
            entries.append(entry)
            local = {**entry, 'cellOriginPx':[0,0], 'previewCropPx':[col*w,row*h,(col+1)*w,(row+1)*h],
                     'centerPx':fitted_center.tolist(), 'contoursPx':{key:(np.array(points)-offset).tolist() for key,points in contours.items()}}
            previews.append((slot, name, Image.fromarray(target.astype('uint8')), compiler.preview(local, registration, 0), compiler.preview(local, registration, 1)))
        diagnostics.append(diagnostic)

    outdir.mkdir(parents=True, exist_ok=True)
    review = dict(status='candidate; root source review and native GPU/media proof pending',
                  source=source_info, cell=[w,h], grid=person['grid'], canonicalCell=person['cell'],
                  anchorsSha256=digest(anchors_path), frames=entries, coverage=diagnostics)
    (outdir/'registrations-v1.json').write_text(json.dumps(review,indent=2)+'\n',newline='\n')
    # Standing paint has its own source-bound fit; it is not the atlas cell.
    standing_seed=seeds['standing']
    standing=compiler.compile_registration(standing_seed)
    payload=dict(schemaVersion=1,id=ID,cell=person['cell'],grid=person['grid'],
                 sources=dict(standing=person['standing']['sha256'],desktop=person['variants']['desktop']['sha256'],mobile=person['variants']['mobile']['sha256']),
                 standing={key:standing[key] for key in ['rect','axes','profile']},frames=frames)
    (outdir/'mouths-v1.json').write_text(json.dumps(payload,separators=(',',':'))+'\n',newline='\n')
    for start in range(0,len(previews),12):
        group=previews[start:start+12]
        for theme,color,ink in [('light','#eee8db','#222222'),('dark','#25272b','#eee8db')]:
            board=Image.new('RGB',(12*108,3*154),color);draw=ImageDraw.Draw(board)
            for i,(slot,name,original,closed,opened) in enumerate(group):
                for state,pic in enumerate([original,closed,opened]):
                    crop=pic.crop(seeds.get('previewCropPx', [20,24,76,57])).resize((104,62),Image.Resampling.NEAREST)
                    board.paste(crop,(i*108,state*154+22),crop)
                    draw.text((i*108+2,state*154+2),f'{slot} {name}',fill=ink)
                    body=pic.resize((48,60),Image.Resampling.NEAREST)
                    board.paste(body,(i*108+28,state*154+88),body)
            board.save(outdir/f'fits-{start:03}-{theme}.png')
    summary=dict(visible=len(entries),null=len(frames)-len(entries),slots=len(frames),
                 views={name:sum(d['view']==name for d in diagnostics)for name in [*templates,'unused']},
                 maxHeadRMSE=max(d.get('headRgbRMSE',0)for d in diagnostics),
                 maxLipRMSE=max(d.get('fit',{}).get('rgbRMSE',0)for d in diagnostics),
                 fitBoundSlots=[d['slot'] for d in diagnostics if d.get('fit') and (d['fit']['determinant']<.75 or d['fit']['determinant']>1.35)])
    (outdir/'summary-v1.json').write_text(json.dumps(summary,indent=2)+'\n',newline='\n')
    print(json.dumps(summary))


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--anchors',type=Path)
    parser.add_argument('--manifest',type=Path)
    parser.add_argument('--outdir',type=Path)
    args=parser.parse_args()
    build(args.anchors,args.manifest,args.outdir)
