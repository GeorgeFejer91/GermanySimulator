"""Inspect every directly evaluated Hannelore front/rear phase before admission."""
from pathlib import Path
import argparse
import hashlib
import json
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from source_fields import FrontRearFields, ROOT, HERE, load


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def run(out):
    out.mkdir(parents=True, exist_ok=False)
    fields = FrontRearFields()
    recipe = fields.recipe
    pilot = ROOT / 'output/ambient-city-animation/hannelore-sparkasse-front-rear-extremes-v1/candidate-v3'
    expected_review = '037db4007da9bfc3fbb842f75745e6dbbb007eace914d85170de5ae475ca1af3'
    assert sha(pilot / 'review/final-receipt.json') == expected_review
    review = json.loads((pilot / 'review/final-receipt.json').read_text())
    assert review['verdict'] == 'PASS_EIGHT_FRONT_REAR_SOURCE_KEYS_ONLY'
    pins = dict(recipe['inputPins'])
    for view in recipe['views'].values():
        pins[view['source']] = view['sha256']
    for path in [HERE/'recipe.json', HERE/'source_fields.py', Path(__file__),
                 pilot/'review/final-receipt.json', pilot/'source-witnesses.json']:
        pins[path.relative_to(ROOT).as_posix()] = sha(path)
    for path, expected in pins.items():
        assert sha(ROOT/path) == expected, path
    exporter = load('hannelore_loop_export', ROOT/'tools/build-street-character-sprites.py')
    font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 14)
    files = {}
    rows = {}

    def save(im, name):
        path = out/name
        path.parent.mkdir(parents=True, exist_ok=True)
        im.save(path)
        files[name] = sha(path)

    def flatten(im, bg):
        return Image.alpha_composite(Image.new('RGBA', im.size, bg), im).convert('RGB')

    def export(im, width):
        q = width/128
        return exporter.export_cell(im, {'working': recipe['working'], 'cell': [width, int(width*1.25)],
                                        'pivot': [64*q, 150*q], 'figureHeight': recipe['paintHeight']*q})

    witnesses = json.loads((pilot/'source-witnesses.json').read_text())['views']
    for direction in recipe['views']:
        frames = []
        records = []
        for phase in range(16):
            im, record = fields.pose(direction, math.tau*phase/16)
            save(im, f'{direction}/phase{phase:02}.png')
            frames.append(im)
            a = np.array(im)
            ys, xs = np.where(a[:, :, 3] >= 20)
            assert ys.max() < 472
            assert not np.any(a[a[:, :, 3] == 0, :3])
            assert not np.any(np.concatenate([a[0,:,3], a[-1,:,3], a[:,0,3], a[:,-1,3]]))
            record['alpha20BottomExclusive'] = int(ys.max()+1)
            record['fixedSoles'] = []
            for side, witness in enumerate(witnesses[direction]):
                point = fields.transport(record, side, witness['sourceSolePoint'])
                x, y = np.rint(point).astype(int)
                assert a[y, x, 3] >= 20, (direction, phase, side, point)
                record['fixedSoles'].append({'source': witness['sourceSolePoint'], 'working': point,
                                              'nearestAlpha': int(a[y,x,3])})
            if phase in (0,4,8,12):
                assert sha(out/f'{direction}/phase{phase:02}.png') == sha(pilot/f'{direction}-phase{phase}.png')
            for width in (96,64):
                cell = export(im, width)
                save(cell, f'direct-{width}/{direction}-{phase:02}.png')
                c = np.array(cell)
                assert not np.any(c[c[:,:,3] == 0,:3])
                assert not np.any(np.concatenate([c[0,:,3],c[-1,:,3],c[:,0,3],c[:,-1,3]]))
                if phase in (0,4,8,12):
                    assert sha(out/f'direct-{width}/{direction}-{phase:02}.png') == sha(pilot/f'direct-{width}/{direction}-phase{phase}.png')
            records.append(record)
        # Direct evaluation at a wrapped phase must close exactly; no duplicate endpoint is shipped.
        wrapped, _ = fields.pose(direction, 0)
        assert np.array_equal(np.array(frames[0]), np.array(wrapped))
        for phase, strength in [(0,0),(math.pi/4,0),(math.pi,.5),(math.pi/2,.25)]:
            im, record = fields.pose(direction, phase, strength)
            if strength == 0:
                assert np.array_equal(np.array(im), np.array(fields.sources[direction]))
                assert all(all(v == 0 for v in f['dx']+f['dy']) for f in record['fields'])
        for bg, theme in [('#eee8db','light'),('#25272b','dark')]:
            for group in range(4):
                board = Image.new('RGB', (4*275, 470), bg)
                draw = ImageDraw.Draw(board)
                for i in range(4):
                    phase = group*4+i
                    draw.text((i*275+4,4), f'{direction} phase {phase:02}', font=font,
                              fill='#111' if theme == 'light' else '#eee')
                    image = flatten(frames[phase], bg)
                    board.paste(image.resize((256,256)), (i*275+4,28))
                    board.paste(image.crop((135,330,380,480)), (i*275+4,310))
                save(board, f'{direction}-native-{theme}-{group}.png')
            for width in (96,64):
                board = Image.new('RGB', (8*220, 2*420), bg)
                draw = ImageDraw.Draw(board)
                for phase, im in enumerate(frames):
                    x, y = (phase%8)*220, (phase//8)*420
                    cell = flatten(export(im,width), bg)
                    draw.text((x+4,y+4), f'{direction} {width} {phase:02}', font=font,
                              fill='#111' if theme == 'light' else '#eee')
                    board.paste(cell, (x+4,y+30))
                    board.paste(cell.resize((width*2,int(width*1.25)*2), Image.Resampling.NEAREST), (x+4,y+160))
                save(board, f'{direction}-direct-{width}-{theme}.png')
            for step, label in [(1,'16'),(4,'4')]:
                seq = [flatten(im,bg) for im in frames[::step]]
                path = out/f'{direction}-cycle-{label}-{theme}.gif'
                seq[0].save(path, save_all=True, append_images=seq[1:],
                            duration=recipe['proposedCycleMs']//len(seq), loop=0)
                files[path.name] = sha(path)
        rows[direction] = {'frames': records, 'distinctRGBA': len({hashlib.sha256(np.array(im).tobytes()).hexdigest() for im in frames}),
                           'goldenKeysAndDirectsExact': 12, 'cycleMs': recipe['proposedCycleMs'],
                           'floorGapByPhaseWorking': [472-r['alpha20BottomExclusive'] for r in records]}
    for path, expected in pins.items():
        assert sha(ROOT/path) == expected, path
    receipt = {'status': 'SOURCE CANDIDATE, continuous floor and visual gates pending',
               'inputPins': pins, 'inputPinsBeforeAfterExact': True, 'files': files, 'views': rows}
    (out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps({'receiptSha256': sha(out/'receipt.json'), 'files': len(files),
                      'floorGaps': {d:r['floorGapByPhaseWorking'] for d,r in rows.items()}}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--outdir', type=Path, required=True)
    args = parser.parse_args()
    out = args.outdir.resolve()
    if not out.is_relative_to(ROOT/'output'):
        raise ValueError('Candidate diagnostics stay ignored')
    run(out)
