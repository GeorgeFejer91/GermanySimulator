"""Own stop-source prop boundary: navy cloth remains garment, purse remains rigid."""
from pathlib import Path
import argparse
import hashlib
import json
import math
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.interpolate import PchipInterpolator

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'front-rear-loop-v1'))
from source_fields import FrontRearFields, load


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def run(out):
    review = ROOT/'output/ambient-city-animation/hannelore-sparkasse-front-rear-loop-v1/candidate-v3/review/final-receipt.json'
    assert sha(review) == '3f03fd88fdc8d3384506468b6280e5768b5fbcb8551a98e4d06311b35a187de6'
    actor = FrontRearFields()
    paint = actor.paint
    exporter = load('hannelore_stop_export', ROOT/'tools/build-street-character-sprites.py')
    out.mkdir(parents=True,exist_ok=False)
    files = {}
    records = []
    font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14)
    stop_masks = dict(actor.masks)
    # Traced on the actual own bag/cloth boundary. Navy source x317,y390..393
    # belongs to garment; a wide prop polygon previously omitted its owner.
    down_polygon = [(324,370),(333,362),(351,361),(367,370),(371,385),(372,404),
                    (366,414),(355,418),(330,419),(320,413),(317,406),(317,402),
                    (318,398),(319,394),(320,390),(321,386),(322,382),(323,378)]
    down_mask = Image.new('L',(512,512))
    ImageDraw.Draw(down_mask).polygon(down_polygon,fill=255)
    assert all(down_mask.getpixel((317,y)) == 0 for y in range(390,394))
    assert down_mask.getpixel((322,390)) == 255
    stop_masks['down'] = down_mask

    pins = {review.relative_to(ROOT).as_posix():sha(review)}
    for path in [Path(__file__),HERE.parent/'front-rear-loop-v1/source_fields.py',HERE.parent/'front-rear-loop-v1/recipe.json',
                 ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py',ROOT/'tools/build-street-character-sprites.py']:
        pins[path.relative_to(ROOT).as_posix()] = sha(path)
    for view in actor.recipe['views'].values():
        pins[view['source']] = view['sha256']

    def save(im,name):
        im.save(out/name)
        files[name] = sha(out/name)

    def export(im,width):
        q = width/128
        return exporter.export_cell(im,{'working':{'figureHeight':400,'baseline':472},'cell':[width,int(width*1.25)],
                                       'pivot':[64*q,150*q],'figureHeight':137*q})

    save(down_mask,'down-stop-prop-mask.png')
    for direction, view in actor.recipe['views'].items():
        for phase in (0,4,8,12):
            walk, source = actor.pose(direction,math.tau*phase/16)
            parts = source['fields'][:2]
            swing = int(np.argmin([p['dy'][-1] for p in parts]))
            frames = [walk]
            row = {'direction':direction,'phase':phase,'swingScreenSide':swing,'stages':[]}
            for stage, strength in enumerate((.8,.6,.4,.2)):
                # Each own complete shoe has two settling stages. The other
                # retains its rigid support point; root does not translate.
                plan = [((.45,7),(0,0)),((1,0),(0,0)),((1,0),(.5,7)),((1,0),(1,0))][stage]
                overrides = []
                for side, part in enumerate(parts):
                    progress,lift = plan[0 if side == swing else 1]
                    nodes = part['nodes_y']
                    weights = [max(0,min(1,(y-nodes[2])/(nodes[-2]-nodes[2]))) for y in nodes]
                    dx = [x*(1-progress) for x in part['dx']]
                    dy = [y*(1-progress)-lift*w for y,w in zip(part['dy'],weights)]
                    overrides.append((dx,dy))
                def limb(side,nodes,dx,dy):
                    assert nodes == parts[side]['nodes_y']
                    return overrides[side]
                calls = []
                original = paint.warp_layer
                def traced(layer,nodes,dx,dy):
                    calls.append({'nodes_y':list(nodes),'dx':list(map(float,dx)),'dy':list(map(float,dy)),
                                  'minJacobianY':float(np.min(1+PchipInterpolator(nodes,dy).derivative()(np.arange(512))))})
                    return original(layer,nodes,dx,dy)
                paint.warp_layer = traced
                try:
                    result,_ = paint.animate(actor.sources[direction],view['landmarks'],travel=view['travel'],count=16,
                              foreground=view['foreground'],strength=strength,phases=[math.tau*phase/16],
                              rigid_mask=stop_masks[direction],limb_pose=limb)
                finally:
                    paint.warp_layer = original
                im = result[0]
                a = np.array(im)
                assert np.where(a[:,:,3]>=20)[0].max()+1 == 472
                assert not np.any(a[a[:,:,3]==0,:3])
                assert min(abs(part['dy'][-1]) for part in calls[:2]) < 1e-10
                if direction == 'down' and phase == 12 and stage == 1:
                    assert np.all(a[393:397,314,3] >= 20), 'Original omitted-owner slit remains'
                save(im,f'{direction}-{phase:02}-stage{stage}.png')
                for width in (96,64):
                    save(export(im,width),f'{direction}-{phase:02}-stage{stage}-{width}.png')
                frames.append(im)
                row['stages'].append({'stage':stage,'upperStrength':strength,'fields':calls})
            frames.append(actor.sources[direction])
            for bg,theme in [('#eee8db','light'),('#25272b','dark')]:
                board = Image.new('RGB',(6*275,470),bg)
                draw = ImageDraw.Draw(board)
                for i,im in enumerate(frames):
                    flat = Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB')
                    draw.text((i*275+4,4),f'{direction} p{phase} '+['walk','stop0','stop1','stop2','stop3','neutral'][i],font=font,
                              fill='#111' if theme=='light' else '#eee')
                    board.paste(flat.resize((256,256)),(i*275+4,30))
                    board.paste(flat.crop((135,330,380,480)),(i*275+4,310))
                save(board,f'{direction}-{phase:02}-{theme}.png')
            records.append(row)
    for path,expected in pins.items():
        assert sha(ROOT/path) == expected,path
    receipt = {'status':'EIGHT_SOURCE_STOP_PATHS_PENDING_VISUAL_REVIEW','inputPins':pins,'files':files,'paths':records,
               'stageMsProposed':60,'limits':['Only four entry phases per view','No final atlas, physical contact or mouth/runtime approval']}
    (out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps({'receipt':sha(out/'receipt.json'),'files':len(files),'paths':len(records)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--outdir',type=Path,required=True)
    args = parser.parse_args()
    out = args.outdir.resolve()
    if not out.is_relative_to(ROOT/'output'):
        raise ValueError('Diagnostics stay ignored')
    run(out)
