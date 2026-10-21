"""Bounded Karl source-paint gait diagnostic; writes review PNGs only.

No atlas, manifest, stride calibration or runtime update. Uses existing source-only
registration/warp primitives with a frozen family-local fitting snapshot.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
FIT = HERE / 'source-fit-v1.json'
BUILDER = ROOT / 'tools/build-resident-motion.py'
HELPER = ROOT / '.agents/skills/animate-2d-characters/scripts/painted_walk.py'
OUT = ROOT / 'output/ambient-city-animation/karl-post-motion-v1'
PHASES = [0, 1, 2, 3]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def board(frames: list[tuple[str, Image.Image]], background: str) -> Image.Image:
    result = Image.new('RGB', (512 * len(frames), 540), background)
    draw = ImageDraw.Draw(result)
    ink = '#202024' if background == '#eee8db' else '#f4f2e9'
    for i, (name, image) in enumerate(frames):
        result.paste(image, (i * 512, 28), image)
        draw.text((i * 512 + 12, 8), name, fill=ink)
        draw.line((i * 512 + 20, 500, (i + 1) * 512 - 20, 500), fill='#e24956', width=1)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--outdir', type=Path, default=OUT)
    args = parser.parse_args()
    out = args.outdir.resolve()
    if out != OUT.resolve() and OUT.resolve() not in out.parents:
        raise ValueError('Diagnostic output must stay under ' + str(OUT))
    doc = json.loads(FIT.read_text(encoding='utf8'))
    if doc['worldContract'] != {'standingFigureWorldHeight': 1.6, 'standingPivot': [64, 150], 'standingFigureHeight': 136, 'distancePerCycle': 'unmeasured'}:
        raise ValueError('Standing scale contract changed')
    if doc['working'] != {'canvas': [512, 512], 'baselineY': 472, 'figureHeight': 400}:
        raise ValueError('Working registration changed')
    person = doc['person']
    bound = {person['source']: person['sourceSha256']}
    for direction in ['right', 'left']:
        view = person['views'][direction]
        for limb in view['leg_sources']:
            bound[limb['source']] = limb['sourceSha256']
    for relative, expected in bound.items():
        if digest(ROOT / relative) != expected:
            raise ValueError('Source pixels changed: ' + relative)
    before = {path: digest(ROOT / path) for path in bound}
    spec = importlib.util.spec_from_file_location('karl_resident_builder', BUILDER)
    builder = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(builder)
    out.mkdir(parents=True, exist_ok=True)
    findings = {}
    for direction in ['right', 'left']:
        view = person['views'][direction]
        source, lm, _ = builder.registered(person, direction)
        if source.size != (512, 512):
            raise ValueError('Registered source is not working512')
        source.save(out / f'{direction}-registered.png')
        registration = source.copy()
        draw = ImageDraw.Draw(registration)
        for key, color in [('waist', '#36bade'), ('hip', '#fac33b'), ('hem', '#fa793b'), ('knee', '#e74d9b'), ('ankle', '#8df02f')]:
            y = lm[key][0] if isinstance(lm[key], list) else lm[key]
            draw.line((120, round(y), 400, round(y)), fill=color, width=2)
        draw.line([tuple(x) for x in lm['split_path_xy']], fill='#39f5e3', width=2)
        registration.save(out / f'{direction}-registration-lines.png')
        layers = []
        for side, limb in enumerate(view['leg_sources']):
            raw = Image.open(ROOT / limb['source']).convert('RGBA')
            layer, _ = builder.street.register_source(raw, limb, limb['scale'], builder.BASELINE)
            placed = Image.new('RGBA', (512, 512))
            placed.alpha_composite(layer, (limb.get('offset_x', 0), 0))
            placed.save(out / f'{direction}-leg-{side}.png')
            layers.append(placed)
        try:
            frames, records = builder.motion(person, direction, count=4)
        except ValueError as exc:
            if hasattr(exc, 'frame'):
                exc.frame.save(out / f'{direction}-first-failure.png')
            (out / 'failure.json').write_text(json.dumps({'direction': direction, 'error': str(exc), 'phase': getattr(exc, 'phase', None)}, indent=2) + '\n')
            raise
        if len(frames) != 4 or len({frame.tobytes() for frame in frames}) != 4:
            raise ValueError('Missing or duplicate diagnostic gait phases')
        stats = []
        for i, frame in enumerate(frames):
            frame.save(out / f'{direction}-phase-{i}.png')
            alpha = np.asarray(frame)[:, :, 3]
            groups, count = label(alpha >= 128)
            sizes = np.bincount(groups.ravel())[1:]
            major = int(sum(x >= 100 for x in sizes))
            stats.append({'phase': i, 'sha256': digest(out / f'{direction}-phase-{i}.png'), 'majorAlphaComponents': major, 'bounds': frame.getbbox()})
            if major != 1:
                raise ValueError(f'{direction} phase {i} has {major} substantial components')
        panels = [('registered', source), ('near leg', layers[0]), ('far leg', layers[1])] + [(f'phase {i}', frame) for i, frame in enumerate(frames)]
        for name, color in [('light', '#eee8db'), ('dark', '#25272b')]:
            board(panels, color).save(out / f'{direction}-layers-and-gait-{name}.png')
            lower = [(label, image.crop((110, 325, 410, 495)).resize((600, 340), Image.Resampling.NEAREST)) for label, image in panels]
            zoom = Image.new('RGB', (600 * len(lower), 368), color)
            ink = '#202024' if name == 'light' else '#f4f2e9'
            for i, (label_text, image) in enumerate(lower):
                zoom.paste(image, (600 * i, 28), image)
                ImageDraw.Draw(zoom).text((600 * i + 12, 8), label_text, fill=ink)
            zoom.save(out / f'{direction}-lower-detail-{name}.png')
        findings[direction] = {'registrationBounds': source.getbbox(), 'layersBounds': [layer.getbbox() for layer in layers], 'phaseStats': stats, 'fieldsRecorded': len(records)}
    after = {path: digest(ROOT / path) for path in bound}
    if after != before:
        raise ValueError('Source changed during diagnostic')
    receipt = {'status': 'source-diagnostic-only', 'sourceFiles': before, 'sourceFitSha256': digest(FIT), 'builderSha256': digest(BUILDER), 'deformationSha256': digest(HELPER), 'worldContract': doc['worldContract'], 'working': doc['working'], 'findings': findings, 'limits': ['No full atlas or runtime test', 'No calibrated stride distance', 'Paint continuity requires visual review at working512 and encoded size']}
    (out / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({'status': receipt['status'], 'views': list(findings), 'sourceFitSha256': receipt['sourceFitSha256'], 'outdir': str(out)}))


if __name__ == '__main__':
    main()
