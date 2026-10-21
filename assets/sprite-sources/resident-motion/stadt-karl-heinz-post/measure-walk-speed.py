"""Measure Karl's own visible side-stance sole points on decoded walk cells.

Reuses the existing assess_walk_speed.py slope/slip fit. The five point marks
per side view identify one near boot through its painted source and actual
deformation field. They are source/encoded evidence, not a floor-contact test.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
METHOD = ROOT / '.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py'
BUILDER = ROOT / 'tools/build-resident-motion.py'
FIT = HERE / 'source-fit-v3.json'
EXPECTED_SOURCE_RECEIPT = '4eebaefae5f8b81d1854298bfcaf4559dd041ba740c4034b70baebd96a643eac'
PIVOTS = {'desktop': (48, 112.5, 102, 96, 120, 111),
          'mobile': (32, 75, 68, 64, 80, 74)}
# Hand-reviewed own isolated-boot sole pixels at working y466. The physical
# points were then marked on the actual lossless decoded cells, inset ~1 px
# from the outer edge to keep foot identity through an overlapping stance.
MARKS = {
    'right': {'row': 1, 'side': 0, 'sourcePoint': [210, 466], 'frames': [4, 6, 8, 10, 12],
              'desktopX': [44, 42, 36, 31, 28], 'mobileX': [30, 28, 24, 20, 19]},
    'left': {'row': 3, 'side': 0, 'sourcePoint': [283, 466], 'frames': [4, 6, 8, 10, 12],
             'desktopX': [47, 49, 55, 61, 63], 'mobileX': [31, 33, 37, 40, 42]},
}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def original_leg(builder, view, side: int) -> Image.Image:
    limb = view['leg_sources'][side]
    path = ROOT / limb['source']
    if sha(path) != limb['sourceSha256']:
        raise ValueError('Karl complete painted leg source changed')
    layer, _ = builder.street.register_source(Image.open(path).convert('RGBA'),
                                               limb, limb['scale'], 472)
    placed = Image.new('RGBA', (512, 512))
    placed.alpha_composite(layer, (limb.get('offset_x', 0), 0))
    return placed


def measure(walks: Path, output: Path):
    walks = walks.resolve()
    output = output.resolve()
    receipt_path = walks / 'walk-source.json'
    if sha(receipt_path) != EXPECTED_SOURCE_RECEIPT:
        raise ValueError('Frozen Karl source receipt changed')
    receipt = json.loads(receipt_path.read_text(encoding='utf8'))
    if receipt['id'] != 'stadt-karl-heinz-post' or receipt['selectedCells'] != 92:
        raise ValueError('Not Karl full source delivery')
    if receipt['figureWorldHeight'] != 1.6 or receipt['figureHeight'] != 136 or receipt['pivot'] != [64, 150]:
        raise ValueError('Karl standing geometry changed')
    if sha(FIT) != receipt['sourceFitSha256'] or sha(BUILDER) != receipt['sourceBindings']['builderSha256']:
        raise ValueError('Karl source fit/builder changed')
    fit = json.loads(FIT.read_text(encoding='utf8'))
    builder = load(BUILDER, 'karl_contact_builder')
    method = load(METHOD, 'existing_walk_speed_fit')
    output.mkdir(parents=True, exist_ok=True)
    assessments, annotated = [], {}
    for direction, mark in MARKS.items():
        view = fit['person']['views'][direction]
        if view['foreground'] != mark['side']:
            raise ValueError('Chosen near boot is no longer the foreground limb')
        leg = original_leg(builder, view, mark['side'])
        sx, sy = mark['sourcePoint']
        if leg.getpixel((sx, sy))[3] < 200:
            raise ValueError('Annotated Karl source sole is not painted')
        source_crop = leg.crop((sx-42, sy-30, sx+43, sy+18))
        source_board = Image.new('RGBA', source_crop.size, '#eee8db')
        source_board.alpha_composite(source_crop)
        ImageDraw.Draw(source_board).ellipse((39, 27, 45, 33), fill='#ff3050')
        source_board.resize((source_crop.width*5, source_crop.height*5),
                            Image.Resampling.NEAREST).convert('RGB').save(
                                output / f'{direction}-near-source-sole.png')
        for name, (px, py, figure, w, h, row_y) in PIVOTS.items():
            variant = receipt['variants'][name]
            atlas_path = walks / variant['file']
            if sha(atlas_path) != variant['sha256'] or variant['frame_size'] != [w, h]:
                raise ValueError('Changed Karl encoded ' + name + ' gait')
            if variant['figureHeight'] != figure or variant['pivot'] != [px, py]:
                raise ValueError('Karl physical registration changed')
            atlas = Image.open(atlas_path).convert('RGBA')
            scale = figure / 400
            predicted_y = py + (sy - 472) * scale
            if abs(row_y - predicted_y) > .51:
                raise ValueError('Annotated sole row no longer samples the source sole')
            isolated = builder.street.export_cell(leg, {
                'cell': [w, h], 'figureHeight': figure, 'pivot': [px, py],
                'working': {'figureHeight': 400, 'baseline': 472}})
            isolated_x = np.flatnonzero(np.asarray(isolated)[row_y, :, 3] >= 128)
            if len(isolated_x) < 8:
                raise ValueError('Own isolated sole span cannot be measured')
            shoe_length = int(isolated_x.max() - isolated_x.min() + 1)
            samples, marked = [], []
            for frame, x in zip(mark['frames'], mark[name+'X']):
                col = frame % 16
                field = receipt['limbFields'][direction][col]['limb_displacement'][mark['side']]
                dx, dy = field['dx'][-1], field['dy'][-1]
                if abs(dy) > 1e-6:
                    raise ValueError('Annotated near sole is not in its source planted interval')
                predicted_x = px + (sx + dx - 256) * scale
                if abs(x - predicted_x) > .8:
                    raise ValueError('Selected decoded sole point crossed source-foot field')
                cell = atlas.crop((col*w, mark['row']*h, (col+1)*w, (mark['row']+1)*h))
                alpha = cell.getpixel((x, row_y))[3]
                if alpha < 200:
                    raise ValueError('Annotated encoded sole point is not visibly opaque')
                samples.append({'frame': frame, 'sourceCellFrame': col,
                                'along_pixels': x if direction == 'right' else -x,
                                'pointPx': [x, row_y], 'alpha': alpha,
                                'predictedFromOwnSourcePx': predicted_x,
                                'sourceWorkingPoint': [sx, sy]})
                background = Image.new('RGBA', cell.size, '#eee8db')
                background.alpha_composite(cell)
                draw = ImageDraw.Draw(background)
                draw.ellipse((x-1, row_y-1, x+1, row_y+1), fill='#ff3050')
                draw.text((2, 2), f'{frame}:{x},{row_y}', fill='#222222')
                marked.append(background)
            board = Image.new('RGBA', (w*5, h), '#eee8db')
            for index, image in enumerate(marked):
                board.alpha_composite(image, (index*w, 0))
            board.resize((board.width*4, board.height*4), Image.Resampling.NEAREST).convert('RGB').save(
                output / f'{direction}-{name}-marked-near-sole.png')
            game_units_per_pixel = 1.6 / (figure * .02)
            observed_x = [sample['along_pixels'] for sample in samples]
            span_phase = (mark['frames'][-1] - mark['frames'][0]) / 16
            endpoint_reference = (observed_x[0] - observed_x[-1]) * game_units_per_pixel / span_phase
            if endpoint_reference <= 0:
                raise ValueError('Karl visible near sole did not move backward')
            assessments.append({
                'character': 'stadt-karl-heinz-post', 'view': direction, 'variant': name,
                'atlas_file': Path(os.path.relpath(atlas_path, output)).as_posix(),
                'atlas_sha256': sha(atlas_path), 'frames_per_cycle': 16,
                'game_units_per_pixel': game_units_per_pixel,
                'current_cycle_distance': endpoint_reference,
                'currentDistanceMeaning': 'own measured endpoint reference, not a current runtime setting',
                'shoe_length_pixels': shoe_length,
                'shoeLengthMethod': 'own isolated registered complete-leg sole at decoded planted row',
                'contacts': [{'foot': 'near-side' + str(mark['side']), 'samples': samples}],
            })
            annotated[direction + '-' + name] = {'sourcePoint': [sx, sy],
                'encodedRow': row_y, 'shoeLengthPixels': shoe_length,
                'endpointReferenceCycleDistance': endpoint_reference,
                'physicalPivot': [px, py]}
    measurements = {'status': 'Karl own encoded near-sole diagnostic; floor contact pending',
        'method': 'Five manually marked visible pixels on one known near sole per side view, two-frame cadence. Source-point identity checked against actual limb field and decoded alpha>=200. Existing assess_walk_speed slope/slip fit.',
        'sourceReceiptSha256': sha(receipt_path), 'sourceFitSha256': sha(FIT),
        'worldUnitsPerGameUnit': .02, 'markerUncertaintyPixels': .5,
        'authoringDriverSha256': sha(Path(__file__)), 'fitMethodSha256': sha(METHOD),
        'annotations': annotated, 'assessments': assessments}
    measurements_path = output / 'walk-contact-measurements.json'
    measurements_path.write_text(json.dumps(measurements, indent=2) + '\n', encoding='utf8')
    results = method.assess_file(measurements_path)
    fitted = []
    for result, entry in zip(results['assessments'], assessments):
        result['variant'] = entry['variant']
        result['measuredFoot'] = entry['contacts'][0]['foot']
        # Worst-case independent ±0.5-pixel marker errors at five evenly
        # spaced samples: sum(abs(centered phase))*0.5/sum(centered phase²).
        result['markerHalfPixelWorstCaseCycleUnits'] = 2.4 * entry['game_units_per_pixel']
        fitted.append(result['fitted_cycle_distance'])
    results['proposal'] = {
        'status': 'source-and-encoded-candidate-only; no current production Karl cycle distance',
        'cycleDistanceGameUnits': sum(fitted) / len(fitted),
        'measuredFitRangeGameUnits': [min(fitted), max(fitted)],
        'contactScope': 'One visible foreground boot in each side view; opposite boot is not identity-safe through a full five-point stance interval.',
        'worldUnitsPerGameUnit': .02,
        'floorContact': 'not tested in runtime'}
    (output / 'walk-speed-fit.json').write_text(json.dumps(results, indent=2) + '\n', encoding='utf8')
    support = {'sourceBaselineY': 472, 'byDirection': {}}
    for direction in ('down', 'right', 'up', 'left'):
        row = ('down', 'right', 'up', 'left').index(direction)
        working_bottom = [box[3] for box in receipt['walks'][direction]['sourceBounds']]
        entry = {'workingBottom': working_bottom,
                 'workingRelativeToBaseline': [y-472 for y in working_bottom],
                 'encoded': {}}
        for name, (_, py, _, _, _, _) in PIVOTS.items():
            bounds = receipt['variants'][name]['boundsByCell']
            bottoms = [bounds[f'{row},{col}'][3] for col in range(16)]
            entry['encoded'][name] = {'bottom': bottoms,
                'relativeToPhysicalPivot': [y-py for y in bottoms]}
        support['byDirection'][direction] = entry
    (output / 'source-support.json').write_text(json.dumps(support, indent=2) + '\n', encoding='utf8')
    print(json.dumps({'status': measurements['status'],
                      'fittedCycleDistanceByVariantView': [
                          [entry['view'], entry['fitted_cycle_distance']]
                          for entry in results['assessments']],
                      'fourMeasurementMean': results['character_means']['stadt-karl-heinz-post']}), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--walk-source', type=Path,
                        default=ROOT / 'output/ambient-city-animation/karl-post-walk-source-v1')
    parser.add_argument('--outdir', type=Path,
                        default=ROOT / 'output/ambient-city-animation/karl-post-contact-v1')
    args = parser.parse_args()
    measure(args.walk_source, args.outdir)
