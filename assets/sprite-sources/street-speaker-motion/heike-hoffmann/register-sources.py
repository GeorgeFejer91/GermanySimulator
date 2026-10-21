"""Register held Heike turn sources with the existing painted-source sampler."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[4]
FOLDER = Path(__file__).resolve().parent
OUT = ROOT / 'output/ambient-city-animation/heike-source-gate'
KEYS = 'assets/sprite-sources/street-quiz/heike-hoffmann-keys.png'
QUARTERS = FOLDER.relative_to(ROOT).as_posix()+'/quarter-turns-v1-candidate.png'
REAR = FOLDER.relative_to(ROOT).as_posix()+'/rear-right-v2-candidate.png'
PROPORTIONS = FOLDER.relative_to(ROOT).as_posix()+'/quarter-proportions-v3-candidate.png'
INPUTS = {
    KEYS: 'fae6498e2a8b81b149f514c9c815ea586e64424b2f41ac22c40cbb52cab39605',
    QUARTERS: 'fc33143701ef4cbb0c5d7d74ec1ee815c65e1a2aa348c1616ace92060c93d86a',
    REAR: 'e9b0001c4bbfcb1ee16036349593e5724b97ec360df938515524c02c59aaa23d',
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(revision='v1'):
    quarter = QUARTERS if revision == 'v1' else PROPORTIONS
    inputs = INPUTS if revision == 'v1' else {KEYS:INPUTS[KEYS],
        PROPORTIONS:'21abb0c1f48c4bdd27af6c2ce4224af1eae49d780d2a5be593284b430734e606'}
    for name, expected in inputs.items():
        if sha(ROOT/name) != expected:
            raise ValueError('Changed Heike source: '+name)
    spec = importlib.util.spec_from_file_location('street_source', ROOT/'tools/build-street-character-sprites.py')
    street = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(street)
    images = {name:Image.open(ROOT/name).convert('RGBA') for name in inputs}
    boxes = {}
    for name, image in images.items():
        groups = street.source_components(image)
        groups.sort(key=lambda b:b[1])
        boxes[name] = sum((sorted(groups[i:i+4],key=lambda b:b[0]) for i in range(0,len(groups),4)),[])
    if len(boxes[KEYS]) != 12 or len(boxes[quarter]) != 4 or revision == 'v1' and len(boxes[REAR]) != 1:
        raise ValueError('Changed semantic source grouping')
    # One scale per source sheet, held across all its views and later frames.
    scales = {name:400/(values[0][3]-values[0][1]) for name,values in boxes.items()}
    rear_source, rear_index = (REAR,0) if revision == 'v1' else (quarter,1)
    selections = [('down',KEYS,0),('front-right',quarter,0),('right',KEYS,1),
                  ('rear-right',rear_source,rear_index),('up',KEYS,2),('rear-left',quarter,2),
                  ('left',KEYS,3),('front-left',quarter,3)]
    output = OUT/revision
    output.mkdir(parents=True,exist_ok=True)
    records, registered = {}, {}
    for name, source, index in selections:
        bounds = boxes[source][index]
        x0,y0,x1,y1 = bounds
        # Initial registration guide only: inspect the anatomical ankle/pelvis axis.
        band_y = round(y1-(y1-y0)*.12)
        ys,xs = np.where(np.asarray(images[source].getchannel('A'))[band_y:y1,x0:x1]>=20)
        pivot = [x0+(int(xs.min())+int(xs.max())+1)/2,y1]
        view = dict(component_bounds=bounds,source_pivot=pivot)
        frame, origin = street.register_source(images[source],view,scales[source],472)
        registered[name] = frame
        records[name] = dict(source=source,sourceSha256=inputs[source],**view,
            scale=scales[source],workingOrigin=origin.tolist(),workingAlphaBounds=frame.getchannel('A').getbbox(),
            mouthVisible=name in ['down','front-right','right','left','front-left'],
            status='candidate; initial foot-band pivot and source proportions require direct inspection')
        for theme,color in [('light','#eee8db'),('dark','#25272b')]:
            board=Image.new('RGBA',(512,512),color);board.alpha_composite(frame)
            draw=ImageDraw.Draw(board);draw.line((0,472,511,472),fill='#e00070',width=1)
            draw.line((256,68,256,492),fill='#00a8c0',width=1)
            board.convert('RGB').save(output/f'registered-{name}-{theme}.png')
    for names, filename in [(['down','right','up','left'],f'registered-cardinals-{revision}-candidate.png'),
                            (['front-right','rear-right','rear-left','front-left'],f'registered-quarters-{revision}-candidate.png')]:
        sheet=Image.new('RGBA',(2048,512))
        for i,name in enumerate(names):sheet.paste(registered[name],(i*512,0))
        sheet.save(FOLDER/filename)
    receipt=dict(status='held source registration; no motion or runtime adoption',inputs=inputs,
        helperSha256=sha(Path(__file__)),sourceSamplerSha256=sha(ROOT/'tools/build-street-character-sprites.py'),
        working=dict(canvas=[512,512],figureHeight=400,baseline=472),views=records)
    (FOLDER/f'source-registration-{revision}.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':receipt['status'],'views':len(records),'outputs':str(output)}))


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--revision',choices=['v1','v3'],default='v1')
    build(parser.parse_args().revision)
