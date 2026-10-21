"""Four own-paint front/rear gait extremes; no atlas or runtime admission."""
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
OUT = ROOT / 'output/ambient-city-animation/renate-termin-front-rear-gate-v1'
CONFIG = HERE / 'front-rear-fit-v1.json'
sys.path.insert(0, str(ROOT / '.agents/skills/animate-2d-characters/scripts'))
import painted_walk as paint

spec = importlib.util.spec_from_file_location('street', ROOT / 'tools/build-street-character-sprites.py')
street = importlib.util.module_from_spec(spec)
spec.loader.exec_module(street)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    cfg = json.loads(CONFIG.read_text(encoding='utf8'))
    if cfg['status'] != 'source-only-unapproved':
        raise ValueError('Expected source pilot status')
    if sha(ROOT / cfg['standing']['file']) != cfg['standing']['sha256']:
        raise ValueError('Standing changed')
    OUT.mkdir(parents=True, exist_ok=True)
    files, observations = {}, {}

    def save(image, name):
        image.save(OUT / name)
        files[name] = sha(OUT / name)

    for direction, view in cfg['views'].items():
        path = ROOT / view['file']
        if sha(path) != view['sha256']:
            raise ValueError('Neutral source changed: ' + direction)
        source = Image.open(path).convert('RGBA')
        if source.size != (512,512):
            raise ValueError('Expected registered neutral canvas')
        mask = Image.new('L', source.size)
        for polygon in view['protectedPolygons']:
            ImageDraw.Draw(mask).polygon([tuple(point) for point in polygon], fill=255)
        save(mask, direction + '-rigid-hand-mask.png')
        phases = [math.tau * i / cfg['phaseCount'] for i in cfg['phaseIndices']]
        frames, records = paint.animate(source, view['landmarks'], travel=view['travel'],
            count=cfg['phaseCount'], foreground=view['foreground'], phases=phases, rigid_mask=mask)
        observations[direction] = {'motionRecords': records, 'frames': []}
        for phase, frame in zip(cfg['phaseIndices'], frames):
            save(frame, f'{direction}-phase-{phase:02d}.png')
            alpha = np.asarray(frame)[:,:,3]
            angle = math.tau * phase / cfg['phaseCount']
            shift, bob = 3*math.sin(angle), -3.4*math.cos(2*angle)
            expected = np.asarray(paint.warp_layer(source,[0,view['landmarks']['waist'],511],
                [0,shift,shift],[bob,bob,bob]))
            upper = (np.indices(alpha.shape)[0] < 388) & (expected[:,:,3] == 255)
            changed = int(np.count_nonzero(np.any(np.asarray(frame)[upper] != expected[upper],axis=1)))
            if changed:
                raise ValueError('Opaque upper/hand/ticket paint changed: ' + str(changed))
            observations[direction]['frames'].append({'phase': phase, 'bbox': frame.getbbox(),
                'opaqueBottom': int(np.where(alpha>=128)[0].max()),
                'ownedOpaqueUpperChangedPixels': changed,
                'hiddenRgbClean': bool(np.all(np.asarray(frame)[alpha==0]==0))})
        images = [source, *frames]
        for label, cell, pivot, figure in [('512',[512,512],[256,472],400),
                ('128x160',[128,160],[64,150],132),
                ('96x120',[96,120],[48,112.5],99),
                ('64x80',[64,80],[32,75],66)]:
            exports = images if label=='512' else [street.export_cell(image, {
                'working':cfg['working'],'cell':cell,'pivot':pivot,'figureHeight':figure}) for image in images]
            for theme, background in [('light','#f4efe2'),('dark','#1b1f25')]:
                board = Image.new('RGBA',(cell[0]*5,cell[1]),background)
                for i,image in enumerate(exports):
                    board.alpha_composite(image,(cell[0]*i,0))
                save(board, f'{direction}-{label}-{theme}.png')
        for theme, background in [('light','#f4efe2'),('dark','#1b1f25')]:
            board = Image.new('RGBA',(460*5,360),background)
            for i,image in enumerate(images):
                board.alpha_composite(image.crop((140,315,370,495)).resize((460,360),Image.Resampling.NEAREST),(460*i,0))
            save(board,f'{direction}-boot-prop-{theme}.png')
    receipt = {'status':'unapproved source-only front/rear four-extreme pilot',
        'fit':{'file':str(CONFIG.relative_to(ROOT)).replace('\\','/'),'sha256':sha(CONFIG)},
        'driverSha256':sha(Path(__file__)), 'helperSha256':sha(ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py'),
        'exportHelperSha256':sha(ROOT/'tools/build-street-character-sprites.py'),
        'standing':cfg['standing'],'inputViews':cfg['views'],'files':files,'observations':observations,
        'limits':['No full loop, stops, stride, encoded atlas or runtime proof','Source alpha connectivity cannot establish anatomy or contact']}
    (OUT/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'receiptSha256':sha(OUT/'receipt.json'),'files':len(files),'observations':{d:v['frames'] for d,v in observations.items()}}))


if __name__ == '__main__':
    main()
