"""Measure Irmgard's own visible near-boot stance on accepted encoded side cells.

The pixel slope proposes a cycle distance. It does not certify runtime floor
contact, and the far boot is not identity-safe through the five-point window.
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
DEFAULT_WALKS = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-walk-source-v1'
DEFAULT_OUT = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-contact-v1'
FIT = HERE / 'source-fit-v1.json'
BUILDER = ROOT / 'tools/build-resident-motion.py'
METHOD = ROOT / '.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py'
MANIFEST = ROOT / 'assets/characters/street/manifest.json'
OLD_MANIFEST = ROOT / 'output/ambient-city-animation/irmgard-aktenstapel-phase-stop-pilot-v1/historical-manifest-cf7.json'
EXPECTED_WALKS = '98e7f1a541ca231dab39bd64f11273e5736124954a4c921ea94f613103029e7b'
OLD_MANIFEST_SHA = 'cf7c7511e77fcb923eabce6486d363b1588b4a8849e029807f4d15cef57810da'
CURRENT_MANIFEST_SHA = '3f2a4d6d1818d7b6e33870f21dcc7627547d3df5075338d90ce44821b6ab7b1d'
VARIANTS = {'desktop': {'size': [96, 120], 'figure': 102, 'pivot': [48, 112.5]},
            'mobile': {'size': [64, 80], 'figure': 68, 'pivot': [32, 75]}}
WINDOWS = {'right': {'row': 1, 'nearSide': 0, 'atlasPhases': [4, 6, 8, 10, 12],
                     'unwrappedPhases': [4, 6, 8, 10, 12]},
           'left': {'row': 3, 'nearSide': 1, 'atlasPhases': [12, 14, 0, 2, 4],
                    'unwrappedPhases': [12, 14, 16, 18, 20]}}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def verify_inputs(receipt, receipt_path):
    if sha(receipt_path) != EXPECTED_WALKS or receipt['id'] != 'stadt-irmgard-aktenstapel':
        raise ValueError('Reviewed Irmgard 92-cell source receipt changed')
    if (receipt['selectedCells'] != 92 or receipt['cell'] != [128, 160] or
            receipt['pivot'] != [64, 150] or receipt['figureHeight'] != 136 or
            receipt['figureWorldHeight'] != 1.6):
        raise ValueError('Irmgard body/world registration changed')
    old_pins = receipt['inputHashes']
    manifest_key = MANIFEST.relative_to(ROOT).as_posix()
    if (old_pins[manifest_key] != OLD_MANIFEST_SHA or sha(OLD_MANIFEST) != OLD_MANIFEST_SHA or
            sha(MANIFEST) != CURRENT_MANIFEST_SHA):
        raise ValueError('Irmgard accepted historical/current manifest identity changed')
    old = json.loads(OLD_MANIFEST.read_text(encoding='utf8'))
    current = json.loads(MANIFEST.read_text(encoding='utf8'))
    if (old.keys() != current.keys() or old['schemaVersion'] != current['schemaVersion'] or
            old['characters'].keys() != current['characters'].keys()):
        raise ValueError('Street manifest schema/cast changed')
    changed = {key for key in old['characters'] if old['characters'][key] != current['characters'][key]}
    if changed != {'stadt-karl-heinz-post'} or old['characters']['stadt-irmgard-aktenstapel'] != \
            current['characters']['stadt-irmgard-aktenstapel']:
        raise ValueError('Change is not isolated to Karl; Irmgard standing must remain exact')
    pins = {receipt_path.relative_to(ROOT).as_posix(): EXPECTED_WALKS,
            MANIFEST.relative_to(ROOT).as_posix(): CURRENT_MANIFEST_SHA,
            OLD_MANIFEST.relative_to(ROOT).as_posix(): OLD_MANIFEST_SHA,
            Path(__file__).relative_to(ROOT).as_posix(): sha(Path(__file__)),
            METHOD.relative_to(ROOT).as_posix(): sha(METHOD)}
    for key, digest in old_pins.items():
        if key == manifest_key:
            continue
        if sha(ROOT / key) != digest:
            raise ValueError('Accepted Irmgard source input changed: ' + key)
        pins[key] = digest
    if sha(BUILDER) != receipt['sourceBindings']['builderSha256'] or sha(FIT) != receipt['sourceFitSha256']:
        raise ValueError('Accepted Irmgard builder or fit changed')
    return pins, {'historicalSha256': OLD_MANIFEST_SHA, 'currentSha256': CURRENT_MANIFEST_SHA,
                  'onlyChangedCharacterRecord': 'stadt-karl-heinz-post', 'ownRecordDeepEqual': True}


def near_leg(builder, view, side):
    limb = view['leg_sources'][side]
    path = ROOT / limb['source']
    if sha(path) != limb['sourceSha256']:
        raise ValueError('Own Irmgard complete boot source changed')
    layer, _ = builder.street.register_source(Image.open(path).convert('RGBA'),
                                               limb, limb['scale'], 472)
    placed = Image.new('RGBA', (512, 512))
    placed.alpha_composite(layer, (limb.get('offset_x', 0), 0))
    x = 256 + (limb['sole_point_xy'][0] - limb['source_pivot'][0]) * limb['scale'] + limb.get('offset_x', 0)
    y = 472 + (limb['sole_point_xy'][1] - limb['source_pivot'][1]) * limb['scale']
    alpha = np.asarray(placed)[:, :, 3]
    # Mark an inset outsole pixel; the literal extremal sole is too thin to
    # retain a stable decoded row across the 96/64 samplers.
    inset_y = y - 5
    candidates = [(xx, yy) for yy in range(round(inset_y)-3, round(inset_y)+4)
                  for xx in range(round(x)-7, round(x)+8) if alpha[yy, xx] >= 200]
    if not candidates:
        raise ValueError('Irmgard own source sole point has no painted support')
    sx, sy = min(candidates, key=lambda p: (p[0]-x)**2 + (p[1]-inset_y)**2)
    return placed, (sx, sy), [x, y], limb


def mark_pixel(cell, isolated, px, row_y):
    foreground = np.asarray(isolated)[:, :, 3]
    actual = np.asarray(cell)[:, :, 3]
    options = [x for x in range(max(0, round(px)-2), min(cell.width, round(px)+3))
               if foreground[row_y, x] >= 128 and actual[row_y, x] >= 200]
    if not options:
        raise ValueError('Near sole not identity-safe and opaque in encoded cell')
    x = min(options, key=lambda value: abs(value-px))
    return x, int(actual[row_y, x]), int(foreground[row_y, x])


def measure(walks_path, output):
    walks_path, output = walks_path.resolve(), output.resolve()
    receipt_path = walks_path / 'walk-source.json'
    receipt = json.loads(receipt_path.read_text(encoding='utf8'))
    pins, rebind = verify_inputs(receipt, receipt_path)
    fit = json.loads(FIT.read_text(encoding='utf8'))
    builder = load(BUILDER, 'irmgard_contact_builder')
    method = load(METHOD, 'existing_walk_speed_fit')
    output.mkdir(parents=True, exist_ok=True)
    assessments, annotations = [], {}
    for direction, window in WINDOWS.items():
        view = fit['person']['views'][direction]
        if view['foreground'] != window['nearSide']:
            raise ValueError('Irmgard near painted boot ownership changed')
        leg, (sx, sy), expected_source, limb = near_leg(builder, view, window['nearSide'])
        crop = leg.crop((sx-42, sy-30, sx+43, sy+18))
        board = Image.new('RGBA', crop.size, '#eee8db')
        board.alpha_composite(crop)
        ImageDraw.Draw(board).ellipse((39, 27, 45, 33), fill='#ff3050')
        board.resize((crop.width*5, crop.height*5), Image.Resampling.NEAREST).convert('RGB').save(
            output / f'{direction}-own-near-source-sole.png')
        for name, expected_variant in VARIANTS.items():
            variant = receipt['variants'][name]
            w, h = expected_variant['size']
            figure, px, py = expected_variant['figure'], *expected_variant['pivot']
            atlas_path = walks_path / variant['file']
            if (sha(atlas_path) != variant['sha256'] or variant['frame_size'] != [w, h] or
                    variant['figureHeight'] != figure or variant['pivot'] != [px, py]):
                raise ValueError('Irmgard accepted physical encoded gait changed')
            pins[atlas_path.relative_to(ROOT).as_posix()] = variant['sha256']
            atlas = Image.open(atlas_path).convert('RGBA')
            scale = figure / 400
            row_y = round(py + (sy - 472) * scale)
            isolated = builder.street.export_cell(leg, {
                'cell': [w, h], 'figureHeight': figure, 'pivot': [px, py],
                'working': {'figureHeight': 400, 'baseline': 472}})
            sole_span = np.flatnonzero(np.asarray(isolated)[row_y, :, 3] >= 128)
            if len(sole_span) < 8:
                raise ValueError('Own isolated boot span cannot be resolved')
            samples, marked = [], []
            for phase, unwrapped in zip(window['atlasPhases'], window['unwrappedPhases']):
                field = receipt['limbFields'][direction][phase]['limb_displacement'][window['nearSide']]
                dx, dy = field['dx'][-1], field['dy'][-1]
                if abs(dy) > 1e-6:
                    raise ValueError('Near boot selected outside own planted field interval')
                predicted_x = px + (sx + dx - 256) * scale
                cell = atlas.crop((phase*w, window['row']*h, (phase+1)*w, (window['row']+1)*h))
                warped_near = builder.paint.warp_layer(leg, field['nodes_y'], field['dx'], field['dy'])
                encoded_near = builder.street.export_cell(warped_near, {
                    'cell': [w, h], 'figureHeight': figure, 'pivot': [px, py],
                    'working': {'figureHeight': 400, 'baseline': 472}})
                x, alpha, near_alpha = mark_pixel(cell, encoded_near, predicted_x, row_y)
                if abs(x - predicted_x) > 1.5:
                    raise ValueError('Observed encoded boot mark departed own field')
                samples.append({'frame': unwrapped, 'sourceCellFrame': phase,
                                'along_pixels': x if direction == 'right' else -x,
                                'pointPx': [x, row_y], 'alpha': alpha,
                                'isolatedNearBootAlpha': near_alpha,
                                'predictedFromOwnSourcePx': predicted_x,
                                'sourceWorkingPoint': [sx, sy]})
                marked_cell = Image.new('RGBA', cell.size, '#eee8db')
                marked_cell.alpha_composite(cell)
                draw = ImageDraw.Draw(marked_cell)
                draw.ellipse((x-1, row_y-1, x+1, row_y+1), fill='#ff3050')
                draw.text((2, 2), f'{phase}:{x},{row_y}', fill='#222222')
                marked.append(marked_cell)
            contact_board = Image.new('RGBA', (w*5, h), '#eee8db')
            for index, cell in enumerate(marked):
                contact_board.alpha_composite(cell, (index*w, 0))
            contact_board.resize((contact_board.width*4, contact_board.height*4),
                                 Image.Resampling.NEAREST).convert('RGB').save(
                output / f'{direction}-{name}-marked-near-sole.png')
            game_units_per_pixel = 1.6 / (figure * .02)
            along = [sample['along_pixels'] for sample in samples]
            span_phase = (window['unwrappedPhases'][-1]-window['unwrappedPhases'][0])/16
            endpoint = (along[0]-along[-1]) * game_units_per_pixel / span_phase
            if endpoint <= 0:
                raise ValueError('Own visible near boot did not move backward during stance')
            assessments.append({'character': 'stadt-irmgard-aktenstapel', 'view': direction,
                'variant': name, 'atlas_file': Path(os.path.relpath(atlas_path, output)).as_posix(),
                'atlas_sha256': sha(atlas_path), 'frames_per_cycle': 16,
                'game_units_per_pixel': game_units_per_pixel, 'current_cycle_distance': endpoint,
                'currentDistanceMeaning': 'own measured endpoint reference, not runtime stride',
                'shoe_length_pixels': int(sole_span.max()-sole_span.min()+1),
                'shoeLengthMethod': 'own isolated registered near boot at decoded planted row',
                'contacts': [{'foot': f'near-side{window["nearSide"]}', 'samples': samples}]})
            annotations[f'{direction}-{name}'] = {
                'sourceSolePoint': limb['sole_point_xy'], 'sourceWorkingPoint': [sx, sy],
                'expectedWorkingPoint': expected_source, 'encodedRow': row_y,
                'atlasPhases': window['atlasPhases'], 'unwrappedPhases': window['unwrappedPhases'],
                'markedEncodedX': [sample['pointPx'][0] for sample in samples],
                'nearBootLengthPx': int(sole_span.max()-sole_span.min()+1),
                'endpointReferenceCycleDistance': endpoint, 'physicalPivot': [px, py]}
    measurements = {'status': 'Irmgard own encoded near-boot stance measurement; runtime floor pending',
        'method': 'Five visible near-boot samples per side view and physical variant, two-frame cadence; own isolated boot/source point, actual accepted limb field, decoded alpha and existing slope/slip fit.',
        'sourceReceiptSha256': EXPECTED_WALKS, 'sourceFitSha256': sha(FIT),
        'worldUnitsPerGameUnit': .02, 'markerUncertaintyPixels': .5,
        'authoringDriverSha256': sha(Path(__file__)), 'fitMethodSha256': sha(METHOD),
        'manifestRebind': rebind, 'inputHashes': pins,
        'annotations': annotations, 'assessments': assessments}
    mpath = output / 'walk-contact-measurements.json'
    mpath.write_text(json.dumps(measurements, indent=2) + '\n', encoding='utf8')
    result = method.assess_file(mpath)
    fitted = []
    for entry, observed in zip(result['assessments'], assessments):
        entry['variant'] = observed['variant']
        entry['measuredFoot'] = observed['contacts'][0]['foot']
        entry['markerHalfPixelWorstCaseCycleUnits'] = 2.4 * observed['game_units_per_pixel']
        fitted.append(entry['fitted_cycle_distance'])
    result['proposal'] = {
        'status': 'source-and-encoded candidate only; not a production Irmgard stride',
        'cycleDistanceGameUnits': sum(fitted)/len(fitted),
        'measuredFitRangeGameUnits': [min(fitted), max(fitted)],
        'contactScope': 'Foreground boot only; far boot overlaps or disappears behind skirt/near boot.',
        'worldUnitsPerGameUnit': .02, 'runtimeFloorContact': 'not tested'}
    (output/'walk-speed-fit.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf8')
    if any(sha(ROOT/key) != digest for key, digest in pins.items()):
        raise ValueError('Irmgard source or encoded gait input changed during measurement')
    print(json.dumps({'status': measurements['status'],
        'fits': [[e['view'], e['variant'], e['fitted_cycle_distance']] for e in result['assessments']],
        'mean': result['proposal']['cycleDistanceGameUnits']}), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--walk-source', type=Path, default=DEFAULT_WALKS)
    parser.add_argument('--outdir', type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    measure(args.walk_source, args.outdir)
