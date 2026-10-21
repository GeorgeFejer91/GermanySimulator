"""Eight own side-key stop paths, using accepted golden source poses.

Land the current swing shoe, then settle the other shoe. No runtime admission.
"""
from pathlib import Path
from copy import deepcopy
import argparse
import hashlib
import importlib.util
import json
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(name,path):
    spec = importlib.util.spec_from_file_location(name,path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(out):
    out.mkdir(parents=True,exist_ok=False)
    producer = load('hannelore_side_stop_source', HERE.parent/'side-loop-v1/source_fields.py')
    actor = producer.SideFields()
    exporter = load('hannelore_side_stop_export', ROOT/'tools/build-street-character-sprites.py')
    packet = ROOT/'output/ambient-city-animation/hannelore-sparkasse-side-loop-v1'
    freeze = packet/'final-receipt.json'
    assert sha(freeze) == '01154ae95690951f2fb0ad35adb26c018b13cd65348a0dbf48dff939a167c864'
    pins = {freeze.relative_to(ROOT).as_posix():sha(freeze)}
    for path in [Path(__file__),HERE.parent/'side-loop-v1/source_fields.py',HERE.parent/'side-loop-v1/recipe.json',
                 ROOT/'tools/build-street-character-sprites.py',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py']:
        pins[path.relative_to(ROOT).as_posix()] = sha(path)
    for direction in actor.recipe['sides'].values():
        for source in direction['sources'].values():
            assert sha(ROOT/source['file']) == source['sha256']
            pins[source['file']] = source['sha256']
    files, paths = {}, []
    font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14)

    def save(im,name):
        im.save(out/name)
        files[name] = sha(out/name)

    def direct(im,width):
        q = width/128
        return exporter.export_cell(im,{'cell':[width,int(width*1.25)],'pivot':[64*q,150*q],
            'figureHeight':137*q,'working':{'figureHeight':400,'baseline':472}})

    for direction in ('right','left'):
        for phase in (0,4,8,12):
            walk, full, _, _ = actor.render(direction,phase)
            neutral, _, _, _ = actor.render(direction,0,strength=0)
            initial = actor.controls(direction,phase)
            rest = actor.controls(direction,0,strength=0)
            lift = [part['liftWorking'] for part in initial]
            swing = int(np.argmax(lift)) if max(lift)>1e-8 else int(np.argmax([abs(p['dx'][-1]) for p in initial]))
            frames, stages = [walk], []
            for stage,plan in enumerate([((.45,7),(0,0)),((1,0),(0,0)),((1,0),(.5,7)),((1,0),(1,0))]):
                controls = deepcopy(initial)
                for side,part in enumerate(controls):
                    progress,extra_lift = plan[0 if side==swing else 1]
                    source, target = initial[side],rest[side]
                    part['dx'] = [float(a+(b-a)*progress) for a,b in zip(source['dx'],target['dx'])]
                    nodes = part['nodesY']
                    weights = [max(0,min(1,(y-nodes[1])/(nodes[-2]-nodes[1]))) for y in nodes]
                    part['dy'] = [float(a+(b-a)*progress-extra_lift*w) for a,b,w in zip(source['dy'],target['dy'],weights)]
                    part['rotationDegrees'] = float(source['rotationDegrees']*(1-progress))
                    part['travelWorking'] = float(source['travelWorking']*(1-progress))
                    part['baseX'] = float(source['baseX']*(1-progress))
                    part['liftWorking'] = float(source['liftWorking']*(1-progress)+extra_lift)
                    part['rootRaiseWorking'] = float(-part['dy'][0])
                    part['sourceStrength'] = part.pop('strength')
                    part['stopProgress'] = progress
                    part['extraStopLiftWorking'] = extra_lift
                original_controls = actor.controls
                actor.controls = lambda *args,**kwargs:deepcopy(controls)
                try:
                    im,records,layers,caps = actor.render(direction,phase)
                finally:
                    actor.controls = original_controls
                a = np.asarray(im)
                assert np.where(a[:,:,3]>=20)[0].max()+1 == 472
                assert all(p['rootCapNotCoveredByUpperAlpha200']==0 for p in records)
                assert not np.any(a[a[:,:,3]==0,:3])
                # At least one unchanged flat support shoe throughout settling.
                assert any(abs(p['dy'][-1])<1e-10 and abs(p['rotationDegrees'])<1e-10 for p in records)
                name = f'{direction}-{phase:02}-stage{stage}'
                save(im,name+'.png')
                for width in (96,64):
                    save(direct(im,width),f'{name}-{width}.png')
                frames.append(im)
                stages.append({'stage':stage,'fields':records})
            frames.append(neutral)
            assert np.array_equal(np.asarray(frames[-2]),np.asarray(neutral)), 'Terminal side stop must be exact own revised neutral'
            for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
                board = Image.new('RGB',(6*280,470),bg)
                draw = ImageDraw.Draw(board)
                for i,im in enumerate(frames):
                    flat = Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB')
                    draw.text((i*280+4,4),f'{direction} p{phase} '+['walk','stop0','stop1','stop2','stop3','neutral'][i],
                        font=font,fill='#eee' if theme=='dark' else '#111')
                    board.paste(flat.resize((256,256)),(i*280+4,30))
                    board.paste(flat.crop((135,330,380,480)),(i*280+4,310))
                save(board,f'{direction}-{phase:02}-{theme}.png')
            paths.append({'direction':direction,'phase':phase,'initialSwing':swing,'stages':stages})
    for path,digest in pins.items():
        assert sha(ROOT/path)==digest,path
    result = {'status':'EIGHT_SIDE_KEY_STOP_SOURCE_PATHS_PENDING_REVIEW','inputPins':pins,'files':files,
        'paths':paths,'stageMsProposed':60,'limits':['Only0/4/8/12 entry phases','Fullside independent review pending',
        'No final encoding, native timing/planting, mouth/media or runtime approval']}
    (out/'receipt.json').write_text(json.dumps(result,indent=2,allow_nan=False)+'\n')
    print(json.dumps({'receipt':sha(out/'receipt.json'),'files':len(files),'paths':len(paths)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--outdir',type=Path,required=True)
    out = parser.parse_args().outdir.resolve()
    if not out.is_relative_to(ROOT/'output'):
        raise ValueError('Evidence stays ignored')
    run(out)
