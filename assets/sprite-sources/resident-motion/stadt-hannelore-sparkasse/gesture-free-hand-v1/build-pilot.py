"""Four source keys for Hannelore's small empty-RIGHT-hand acknowledgement."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import label
from scipy.spatial import Delaunay

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
SOURCE = ROOT/'assets/sprite-sources/resident-motion/stadt-hannelore-sparkasse/neutral-source-v1/down-registered.png'
SOURCE_SHA = '5d4da0a8257c9d7a6ee693421550c8f05a2147053de49d2b52c8b0cb3c32a505'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def mesh():
    # Own source hand is x150..191,y333..373. Shoulder/torso controls are
    # local paint constraints; no hidden anatomical elbow is measured here.
    xs = [0,126,145,155,175,191,198,220,256,511]
    ys = [0,247,260,280,300,320,335,353,373,382,390,511]
    shifts = {
        (175,280):(-1,-1),(191,280):(-1,-1),
        (155,300):(-2,-2),(175,300):(-3,-3),(191,300):(-2,-2),
        (155,320):(-5,-5),(175,320):(-7,-7),(191,320):(-3,-3),
        (155,335):(-8,-9),(175,335):(-10,-12),(191,335):(-3,-4),
        (155,353):(-8,-10),(175,353):(-10,-12),(191,353):(-3,-4),
        (155,373):(-3,-3),(175,373):(-4,-4),(191,373):(-1,-1),
    }
    source = np.array([(x,y) for y in ys for x in xs], dtype=float)
    target = np.array([(x+shifts.get((x,y),(0,0))[0],y+shifts.get((x,y),(0,0))[1])
                       for y in ys for x in xs], dtype=float)
    return source, target, Delaunay((source+target)/2).simplices


def run(out):
    assert sha(SOURCE) == SOURCE_SHA
    out.mkdir(parents=True, exist_ok=False)
    sys.path.insert(0, str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
    morph = load('hannelore_gesture_morph', ROOT/'.agents/skills/animate-2d-characters/scripts/morph_frames.py')
    paint = load('hannelore_gesture_paint', ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py')
    street = load('hannelore_gesture_export', ROOT/'tools/build-street-character-sprites.py')
    neutral = Image.open(SOURCE).convert('RGBA')
    source, target, triangles = mesh()
    morph.validate_mesh(source, target, triangles)
    original = np.array(neutral)
    yy, xx = np.mgrid[:512,:512]
    protected = (yy < 247) | (yy >= 382) | (xx >= 198) | (xx < 126)
    frames = []
    records = []
    files = {}

    def save(im, name):
        im.save(out/name)
        files[name] = sha(out/name)

    for index, amount in enumerate([0,.35,1,0]):
        if amount == 0:
            im = neutral.copy()
        else:
            coordinates, _ = morph.coordinate_maps(source,target,triangles,amount,neutral.size)
            a = np.array(paint.unpack(morph.sample(morph.premultiplied(neutral),coordinates)))
            a[protected] = original[protected]
            im = Image.fromarray(a)
        a = np.array(im)
        assert np.array_equal(a[protected], original[protected])
        assert not np.any(a[a[:,:,3] == 0,:3])
        groups, _ = label(a[:,:,3] >= 128)
        assert sum(n >= 100 for n in np.bincount(groups.ravel())[1:]) == 1
        save(im, f'working-{index:02}.png')
        frames.append(im)
        records.append({'index':index,'amount':amount,'headFeetPurseGripExact':True,
                        'changedPixels':int(np.count_nonzero(np.any(a!=original,axis=2)))})
    assert frames[0].tobytes() == frames[-1].tobytes()
    for width in (96,64):
        q = width/128
        for index, im in enumerate(frames):
            cell = street.export_cell(im, {'working':{'figureHeight':400,'baseline':472},
                    'cell':[width,int(width*1.25)],'pivot':[64*q,150*q],'figureHeight':137*q})
            save(cell, f'direct-{width}-{index:02}.png')
    font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14)
    for bg, theme in [('#eee8db','light'),('#25272b','dark')]:
        board = Image.new('RGB',(4*280,570),bg)
        draw = ImageDraw.Draw(board)
        for i, im in enumerate(frames):
            draw.text((i*280+4,4), ['entry','anticipation','peak','return'][i],font=font,
                      fill='#111' if theme=='light' else '#eee')
            flat = Image.alpha_composite(Image.new('RGBA',im.size,bg),im).convert('RGB')
            board.paste(flat.resize((256,256)),(i*280+4,30))
            board.paste(flat.crop((125,245,215,385)).resize((180,280),Image.Resampling.NEAREST),(i*280+4,288))
        save(board, f'source-keys-{theme}.png')
        for width in (96,64):
            board = Image.new('RGB',(4*220,420),bg)
            draw = ImageDraw.Draw(board)
            for i in range(4):
                cell = Image.open(out/f'direct-{width}-{i:02}.png').convert('RGBA')
                flat = Image.alpha_composite(Image.new('RGBA',cell.size,bg),cell).convert('RGB')
                draw.text((i*220+4,4), str(width)+' '+str(i),font=font,fill='#111' if theme=='light' else '#eee')
                board.paste(flat,(i*220+4,30))
                board.paste(flat.resize((width*2,int(width*1.25)*2),Image.Resampling.NEAREST),(i*220+4,165))
            save(board, f'direct-{width}-{theme}.png')
    pins = {SOURCE.relative_to(ROOT).as_posix():SOURCE_SHA}
    for path in [Path(__file__),ROOT/'.agents/skills/animate-2d-characters/scripts/morph_frames.py',
                 ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py',ROOT/'tools/build-street-character-sprites.py']:
        pins[path.relative_to(ROOT).as_posix()] = sha(path)
    assert sha(SOURCE) == SOURCE_SHA
    receipt = {'status':'FOUR_SOURCE_KEYS_PENDING_VISUAL_REVIEW','inputPins':pins,'files':files,
               'identity':'stadt-hannelore-sparkasse','propHand':'anatomicalLEFT fixed; anatomicalRIGHT empty',
               'working':{'figureHeight':400,'baseline':472},'paintHeight':137,
               'mesh':{'source':source.tolist(),'target':target.tolist(),'triangles':triangles.tolist()},'records':records,
               'limits':['No full sequence, mouths, atlas or runtime approval','Small acknowledgement, not a pointing or open-palm gesture']}
    (out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps({'receiptSha256':sha(out/'receipt.json'),'files':len(files),'records':records}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--outdir',type=Path,required=True)
    args = parser.parse_args()
    out = args.outdir.resolve()
    if not out.is_relative_to(ROOT/'output'):
        raise ValueError('Diagnostics stay ignored')
    run(out)
