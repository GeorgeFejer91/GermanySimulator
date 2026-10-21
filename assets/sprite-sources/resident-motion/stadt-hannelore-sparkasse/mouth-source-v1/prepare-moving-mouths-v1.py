"""Source-only lips on independently reviewed front/rear walks and gesture.

Partial preparation, never a complete family/admission or media approval.
"""
from copy import deepcopy
from pathlib import Path
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


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(out):
    out.mkdir(parents=True, exist_ok=False)
    pins, outputs, selected, checks = {}, {}, {}, {}

    def pin(path, expected=None):
        path = path.resolve()
        if not path.is_relative_to(ROOT):
            raise ValueError('Source outside own worktree')
        digest = sha(path)
        if expected is not None and digest != expected:
            raise ValueError('Changed input: ' + str(path))
        pins[path.relative_to(ROOT).as_posix()] = digest
        return path

    def save(im, name):
        im.save(out/name)
        outputs[name] = sha(out/name)

    def read_packet(folder, name, expected):
        path = pin(folder/name, expected)
        data = json.loads(path.read_text())
        for name, digest in data['inputPins'].items():
            pin(ROOT/name, digest)
        for name, digest in data['files'].items():
            pin(folder/name, digest)
        return data

    pin(HERE/'profiles.json', 'ab34ec2b80c97020d1498ffea1edbfce08bc227dcfa46d0f319525f2875e2109')
    pin(HERE/'compiled.json', 'cf1b509af687861d1e31eb34f20305e398e2e40ba90126f75beebc828f332570')
    pin(HERE/'input-pins.json', 'e9630e821b6dd61977ce07565166b4853b88cd45cd669b320efe588d7a4bd84b')
    for row in json.loads((HERE/'input-pins.json').read_text())['rows']:
        pin(ROOT/row['file'], row['sha256'])
    for path in [Path(__file__), HERE/'transport-fields-v1.py', ROOT/'tools/build-street-mouths.py',
                 ROOT/'tools/build-street-character-sprites.py', HERE.parent/'front-rear-loop-v1/source_fields.py']:
        pin(path)
    packet = ROOT/'output/ambient-city-animation'
    body_folder = packet/'hannelore-sparkasse-front-rear-loop-v1/candidate-v3'
    gesture_folder = packet/'hannelore-sparkasse-gesture-full16-v1/candidate-v1'
    pin(body_folder/'review/final-receipt.json', '3f03fd88fdc8d3384506468b6280e5768b5fbcb8551a98e4d06311b35a187de6')
    pin(gesture_folder/'review/final-receipt.json', '8ecab64fee40fb5d247819d9a12e95b8160d58667c0659fb52bcc83a879d95e9')
    body = read_packet(body_folder, 'receipt.json', '8fe215a3c509ecf787a52b80e9bcf4ee622b4579b69c53711ced16ca515292e4')
    gesture = read_packet(gesture_folder, 'gesture-source.json', '9caa9d6214c259f071642c588d633023ab22b996986d2ddc8f28a7bc23a0b54d')
    profiles = json.loads((HERE/'profiles.json').read_text())['registrations']
    compiled = json.loads((HERE/'compiled.json').read_text())['registrations']
    transport = load('hannelore_actual_lip_transport', HERE/'transport-fields-v1.py')
    helper = load('hannelore_mouth_cpu', ROOT/'tools/build-street-mouths.py')
    street = load('hannelore_mouth_export', ROOT/'tools/build-street-character-sprites.py')
    fields = load('hannelore_mouth_body', HERE.parent/'front-rear-loop-v1/source_fields.py')
    actor = fields.FrontRearFields()
    font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 14)
    tiles = {}

    def add(key, heading, path, field, direct_paths):
        frame = Image.open(path).convert('RGBA')
        if profiles[heading] is None:
            assert heading == 'up'
            selected[key] = None
            checks[key] = {'explicitRearNull': True}
            return
        field = {**field, 'sourceSize': [512, 512]}
        reg, moved, proof = transport.transport(profiles[heading], compiled[heading], field)
        moved['input'] = {'file': path.relative_to(ROOT).as_posix(), 'sha256': sha(path), 'dimensions': [512,512]}
        # The displayed head must be the exact upper warp used for lip transport.
        original = Image.open(ROOT/profiles[heading]['input']['file']).convert('RGBA')
        warped = actor.paint.warp_layer(original, field['nodes_y'], field['dx'], field['dy'])
        yy, xx = np.mgrid[:512,:512]
        axes = np.asarray(moved['axesPx']).reshape(2,2).T
        local = (np.stack([xx,yy],axis=-1)-moved['centerPx'])@np.linalg.inv(axes).T
        support = (abs(local[:,:,0])<2)&(local[:,:,1]>=-1.6)&(local[:,:,1]<=3)
        assert np.array_equal(np.asarray(frame)[support], np.asarray(warped)[support]), key
        proof['actualSourceSupportPixelsExact'] = int(support.sum())
        row = {'transport': proof, 'field': field, 'sizes': {}}
        for width in (512,96,64):
            if width == 512:
                image, entry = frame, moved
            else:
                q = width/128
                image = street.export_cell(frame, {'cell':[width,int(width*1.25)], 'pivot':[64*q,150*q],
                    'figureHeight':137*q,'working':{'figureHeight':400,'baseline':472}})
                actual_path = direct_paths[width]
                assert image.tobytes() == Image.open(actual_path).convert('RGBA').tobytes(), key
                scale = 137*q/400
                origin = np.asarray([64*q,150*q])-np.asarray([256,472])*scale
                entry = {**moved,'input':{'file':actual_path.relative_to(ROOT).as_posix(),'sha256':sha(actual_path),
                    'dimensions':list(image.size)},'cell':list(image.size),
                    'centerPx':(np.asarray(moved['centerPx'])*scale+origin).tolist(),
                    'axesPx':(np.asarray(moved['axesPx'])*scale).tolist(),
                    'contoursPx':{k:(np.asarray(v)*scale+origin).tolist() for k,v in moved['contoursPx'].items()}}
            closed, opened = helper.preview(entry,reg,0), helper.preview(entry,reg,1)
            assert closed.tobytes() == image.tobytes(), key
            assert opened.getchannel('A').tobytes() == image.getchannel('A').tobytes(), key
            changed = int(np.count_nonzero(np.any(np.asarray(opened)[:,:,:3] != np.asarray(image)[:,:,:3],axis=2)))
            assert changed > 0, key
            save(opened, f'{key}-{width}-open.png')
            row['sizes'][str(width)] = {'closedExactRgba':True,'openAlphaExact':True,'changedRgbPixels':changed}
            tiles.setdefault(width,[]).append((key, image, opened, entry['centerPx']))
        selected[key], checks[key] = reg, row

    for direction in ('down','up'):
        for index, record in enumerate(body['views'][direction]['frames']):
            # Independently compare anchors to the producing API, not another fitted rectangle.
            points = [[230,200],[280,220],[300,240]]
            field = {**record['fields'][2], 'sourceSize':[512,512]}
            actual = [actor.transport(record,2,p) for p in points]
            assert np.max(np.abs(transport.mapper(field)(points)-actual)) < 1e-10
            add(f'{direction}-walk-{index:02}', direction, body_folder/f'{direction}/phase{index:02}.png', field,
                {w:body_folder/f'direct-{w}/{direction}-{index:02}.png' for w in (96,64)})
    for record in gesture['fields']:
        i = record['index']
        add(f'gesture-{i:02}', 'down', gesture_folder/record['working'], record['mouthField'],
            {w:gesture_folder/f'direct-{w}-{i:02}.png' for w in (96,64)})
    for width, rows in tiles.items():
        for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
            for page in range(0,len(rows),8):
                board = Image.new('RGB',(1000,8*110),bg)
                draw = ImageDraw.Draw(board)
                for i,(key,source,opened,center) in enumerate(rows[page:page+8]):
                    cx,cy = map(int,center)
                    rx,ry = ((45,20) if width==512 else (14,7))
                    box = (cx-rx,cy-ry,cx+rx,cy+ry)
                    draw.text((5,i*110+5),key,font=font,fill='#eee' if theme=='dark' else '#111')
                    for j,im in enumerate((source,opened)):
                        crop = Image.alpha_composite(Image.new('RGBA',im.size,bg),im).crop(box)
                        zoom = 2 if width==512 else 5
                        crop = crop.resize((crop.width*zoom,crop.height*zoom),Image.Resampling.NEAREST)
                        board.paste(crop,(200+j*350,i*110+10))
                save(board,f'face-{width}-{theme}-{page//8}.png')
    assert len(selected)==48 and sum(r is not None for r in selected.values())==32
    for name,digest in pins.items():
        assert sha(ROOT/name)==digest,name
    standing = {k:deepcopy(compiled['standing'][k]) for k in ('rect','axes','profile')}
    result = {'status':'PARTIAL_SOURCE_CPU_PENDING_VISUAL_REVIEW_NOT_ADMITTED','identity':'stadt-hannelore-sparkasse',
        'selection':{'slots':48,'visible':32,'rearNull':16},'paintScaleCanonical':137,'standing':standing,
        'registrations':selected,'checks':checks,'inputPins':pins,'files':outputs,
        'limits':['Only front/rear walks and own gesture','Scalar0/1 only, no round/bite/shader/media',
                  'No side/stop/turn/final family or runtime admission']}
    (out/'partial-mouths.json').write_text(json.dumps(result,indent=2,allow_nan=False)+'\n')
    print(json.dumps({'slots':48,'visible':32,'files':len(outputs),'receipt':sha(out/'partial-mouths.json')}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--outdir',type=Path,required=True)
    out = parser.parse_args().outdir.resolve()
    if not out.is_relative_to(ROOT/'output'):
        raise ValueError('Source evidence stays ignored')
    run(out)
