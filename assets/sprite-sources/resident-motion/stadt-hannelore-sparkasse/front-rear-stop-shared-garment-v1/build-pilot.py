"""Stop source union: settle torso/skirt/purse together over unchanged leg fields."""
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
                # One connected SOURCE union before sampling/cutoff. The skirt,
                # adjacent navy and complete purse settle with the actual upper
                # field; both independently settling legs retain their fields.
                # This avoids splitting adjacent painted pixels across two maps.
                sample_original = paint.sample
                sample_calls = []
                source_premul = paint.premul(actor.sources[direction])
                def joined_sample(layer, sx, sy):
                    sample_calls.append(layer)
                    if direction == 'down' and len(sample_calls) == 3:
                        return np.zeros_like(layer)
                    if direction == 'down' and len(sample_calls) == 4:
                        for owned in (layer, sample_calls[2]):
                            assert np.all(np.all(owned == 0, axis=2) |
                                          np.all(owned == source_premul, axis=2))
                        layer = np.maximum(layer, sample_calls[2])
                    return sample_original(layer, sx, sy)
                paint.sample = joined_sample
                paint.warp_layer = traced
                try:
                    result,_ = paint.animate(actor.sources[direction],view['landmarks'],travel=view['travel'],count=16,
                              foreground=view['foreground'],strength=strength,phases=[math.tau*phase/16],
                              rigid_mask=actor.masks[direction],limb_pose=limb)
                finally:
                    paint.warp_layer = original
                    paint.sample = sample_original
                assert len(sample_calls) == 4
                im = result[0]
                a = np.array(im)
                assert np.where(a[:,:,3]>=20)[0].max()+1 == 472
                assert not np.any(a[a[:,:,3]==0,:3])
                assert min(abs(part['dy'][-1]) for part in calls[:2]) < 1e-10
                save(im,f'{direction}-{phase:02}-stage{stage}.png')
                for width in (96,64):
                    save(export(im,width),f'{direction}-{phase:02}-stage{stage}-{width}.png')
                frames.append(im)
                row['stages'].append({'stage':stage,'upperStrength':strength,'fields':calls, 'garmentUsesUpperSourceUnion':direction == 'down'})
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
