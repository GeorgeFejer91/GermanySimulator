"""Directly sample the accepted rigid-hand gesture as one sixteen-cell action."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.interpolate import PchipInterpolator, CubicHermiteSpline
from scipy.ndimage import label

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load(name,path):
    spec = importlib.util.spec_from_file_location(name,path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(out):
    pilot = ROOT/'output/ambient-city-animation/hannelore-sparkasse-gesture-rigid-hand-v1/candidate-v1'
    review = pilot/'review/final-receipt.json'
    assert sha(review) == '84aeba6300f194d57899a8eeb3e34e5aa2b079f0e666eb1e62ad70dd5188c82d'
    base = load('hannelore_accepted_rigid_hand',HERE/'build-pilot.py')
    assert sha(base.SOURCE) == base.SOURCE_SHA
    sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
    morph = load('hannelore_gesture_dense_morph',ROOT/'.agents/skills/animate-2d-characters/scripts/morph_frames.py')
    paint = load('hannelore_gesture_dense_paint',ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py')
    street = load('hannelore_gesture_dense_export',ROOT/'tools/build-street-character-sprites.py')
    source,target,triangles = base.mesh()
    morph.validate_mesh(source,target,triangles)
    source_image = Image.open(base.SOURCE).convert('RGBA')
    original = np.array(source_image)
    yy,xx = np.mgrid[:512,:512]
    protected = (yy<247)|(yy>=382)|(xx>=198)|(xx<126)
    knots = [0,4,8,15]
    values = [0,.35,1,0]
    slopes = PchipInterpolator(knots,values).derivative()(knots)
    slopes[0] = slopes[-1] = 0
    curve = CubicHermiteSpline(knots,values,slopes)
    dense = curve(np.linspace(0,15,4097))
    assert dense.min() >= -1e-12 and dense.max() <= 1+1e-12
    assert np.max(np.abs(curve.derivative()([0,8,15]))) < 1e-12
    out.mkdir(parents=True,exist_ok=False)
    inputs = {base.SOURCE.relative_to(ROOT).as_posix():base.SOURCE_SHA}
    for path in [HERE/'build-pilot.py',Path(__file__),review,
                 ROOT/'.agents/skills/animate-2d-characters/scripts/morph_frames.py',
                 ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py',ROOT/'tools/build-street-character-sprites.py']:
        inputs[path.relative_to(ROOT).as_posix()] = sha(path)
    files = {}
    frames = []
    records = []
    def save(im,name):
        im.save(out/name)
        files[name] = sha(out/name)
    def export(im,width):
        q = width/128
        return street.export_cell(im,{'working':{'figureHeight':400,'baseline':472},
                                  'cell':[width,int(width*1.25)],'pivot':[64*q,150*q],'figureHeight':137*q})
    for i in range(16):
        amount = float(curve(i))
        if i in (0,15):
            im = source_image.copy()
        else:
            coordinates,_ = morph.coordinate_maps(source,target,triangles,amount,source_image.size)
            a = np.array(paint.unpack(morph.sample(morph.premultiplied(source_image),coordinates)))
            a[protected] = original[protected]
            im = Image.fromarray(a)
        a = np.array(im)
        assert np.array_equal(a[protected],original[protected])
        assert not np.any(a[a[:,:,3]==0,:3])
        groups,_ = label(a[:,:,3]>=128)
        assert sum(n>=100 for n in np.bincount(groups.ravel())[1:]) == 1
        save(im,f'working-{i:02}.png')
        for width in (96,64):
            cell = export(im,width)
            c = np.array(cell)
            assert not np.any(np.concatenate([c[0,:,3],c[-1,:,3],c[:,0,3],c[:,-1,3]]))
            save(cell,f'direct-{width}-{i:02}.png')
        if i in knots:
            old = knots.index(i)
            assert sha(out/f'working-{i:02}.png') == sha(pilot/f'working-{old:02}.png')
            for width in (96,64):
                assert sha(out/f'direct-{width}-{i:02}.png') == sha(pilot/f'direct-{width}-{old:02}.png')
        frames.append(im)
        records.append({'index':i,'timeMs':i*80,'amount':amount,'working':f'working-{i:02}.png',
                        'headProtectedRowsExclusive':247,'mouthField':{'nodes_y':[0,511],'dx':[0,0],'dy':[0,0],
                        'sourceSize':[512,512],'scope':'identity on protected mouth/head region only'}})
    assert frames[0].tobytes() == frames[-1].tobytes() == source_image.tobytes()
    font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14)
    for bg,theme in [('#eee8db','light'),('#25272b','dark')]:
        for group in range(4):
            board = Image.new('RGB',(4*280,570),bg)
            draw = ImageDraw.Draw(board)
            for col in range(4):
                i = group*4+col
                flat = Image.alpha_composite(Image.new('RGBA',(512,512),bg),frames[i]).convert('RGB')
                draw.text((col*280+4,4),f'{i:02} {i*80}ms',font=font,fill='#111' if theme=='light' else '#eee')
                board.paste(flat.resize((256,256)),(col*280+4,30))
                board.paste(flat.crop((125,245,215,385)).resize((180,280),Image.Resampling.NEAREST),(col*280+4,288))
            save(board,f'native-{theme}-{group}.png')
        for width in (96,64):
            board = Image.new('RGB',(8*220,2*420),bg)
            draw = ImageDraw.Draw(board)
            for i,im in enumerate(frames):
                cell = export(im,width)
                flat = Image.alpha_composite(Image.new('RGBA',cell.size,bg),cell).convert('RGB')
                x,y = i%8*220,i//8*420
                draw.text((x+4,y+4),f'{width} {i:02} {i*80}ms',font=font,fill='#111' if theme=='light' else '#eee')
                board.paste(flat,(x+4,y+30))
                board.paste(flat.resize((width*2,int(width*1.25)*2),Image.Resampling.NEAREST),(x+4,y+160))
            save(board,f'direct-{width}-{theme}.png')
        seq = [Image.alpha_composite(Image.new('RGBA',(512,512),bg),im).convert('RGB') for im in frames]
        path = out/f'one-shot-{theme}.gif'
        seq[0].save(path,save_all=True,append_images=seq[1:],duration=80,loop=0)
        files[path.name] = sha(path)
    for path,expected in inputs.items():
        assert sha(ROOT/path) == expected,path
    distinct = len({im.tobytes() for im in frames})
    assert distinct == 15
    receipt = {'status':'SOURCE_SIXTEEN_CELL_GESTURE_PENDING_INDEPENDENT_REVIEW','identity':'stadt-hannelore-sparkasse',
               'inputPins':inputs,'files':files,'frameCount':16,'distinctRGBA':distinct,'frameMs':80,'durationMs':1280,
               'loop':False,'endpointNote':'first/last are the same exact neutral;15distinct poses in16authored cells',
               'mesh':{'source':source.tolist(),'target':target.tolist(),'triangles':triangles.tolist()},'fields':records,
               'amountCurve':{'knots':knots,'values':values,'slopes':slopes.tolist()},
               'limits':['GIF repeats for inspection only; runtime action is one-shot','No mouth/atlas/runtime approval']}
    (out/'gesture-source.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps({'receipt':sha(out/'gesture-source.json'),'files':len(files),'distinct':distinct,'durationMs':1280}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--outdir',type=Path,required=True)
    args = parser.parse_args()
    out = args.outdir.resolve()
    if not out.is_relative_to(ROOT/'output'):
        raise ValueError('Diagnostics stay ignored')
    run(out)
