"""Assemble reviewed Gisela paint into an ignored integration candidate.

No runtime manifest or source image is modified. Whole-cell integer placement
shares the published standing pivot; the corresponding UV displacement keeps
the existing physical mouth axes and source-owned profiles intact.
"""
from pathlib import Path
import argparse
from copy import deepcopy
import hashlib
import json

from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
ID = 'quiz-gisela-becker'
FAMILY = 'assets/characters/street-speakers/' + ID
APPROVED = 'assets/sprite-sources/street-speaker-motion/gisela-becker/greet-gesture-v2/approved'
STOPS = 'assets/sprite-sources/street-speaker-motion/gisela-becker/phase-stops-v1/approved'
COLS, ROWS = 21, 18
INPUTS = {
    FAMILY+'/character-desktop.webp': 'cf62820e6a5cc5b38bc594b86c36f7db545d22560ca12f339f5ea4e950a75b2a',
    FAMILY+'/character-mobile.webp': '18d18a9396bc918395801e1dfc3e57c0a7b4818c522ea0ff67aa9ef4d0f832c0',
    'assets/characters/street/'+ID+'/mouths-candidate.json': '19bae7efc318599f4992a6c350fe51353102818f3e7f18375ecd88b94fb91cd1',
    'assets/characters/street/'+ID+'/mouths-standing-v1.json': '0fa80e41eb1b7292653835caf1b8e33fbd02b36fec97942b3977669fdca9dc89',
    APPROVED+'/greet16-desktop.webp': '606021b98e87f4475c16b7b06760a3e8ef9d3488da501b16407ecc99277bdf0a',
    APPROVED+'/greet16-mobile.webp': '14fa93ef7a3865a3e7e80c460de2719792f4e54ae7a4e2936d92348e65f6da1b',
    APPROVED+'/mouth-fragment.json': 'e0b0c4f7b0a025a9a509ce2df0b6f6e17b5713658f0db596c7bfec7bf8c83b59',
    STOPS+'/stops-desktop.webp': 'bac965d537cdeb0e91270d3f536dcc81a41c458f68bea297b2a449290ac345a8',
    STOPS+'/stops-mobile.webp': 'edecf64124f4ef8fe08d027cf2f98942759b25802e934315fc48767bbff57040',
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads((ROOT/path).read_text(encoding='utf8'))


def write(path, value):
    path.write_text(json.dumps(value, separators=(',', ':'))+'\n', encoding='utf8', newline='\n')


def translated_mouth(registration):
    if registration is None:
        return None
    result = deepcopy(registration)
    result['rect'][1] -= 2/160
    return result


def build_candidate(output):
    output = Path(output)
    for file, expected in INPUTS.items():
        if digest(ROOT/file) != expected:
            raise ValueError('Changed reviewed input: '+file)
    metadata = read(FAMILY+'/manifest.json')
    if (metadata['frame_size'] != [128,160] or metadata['pivot'] != [64,148]
            or metadata['cols'] != 16 or metadata['rows'] != 13
            or metadata['figureHeight'] != 136 or metadata['figureWorldHeight'] != 1.6
            or metadata['cycle_distance'] != 9.5):
        raise ValueError('Changed source family geometry or cycle')
    published = read('assets/characters/street/manifest.json')['characters'][ID]
    if published['cell'] != [128,160] or published['pivot'] != [64,150] or published['figureWorldHeight'] != 1.6:
        raise ValueError('Changed published Gisela geometry')
    old_mouth = read('assets/characters/street/'+ID+'/mouths-candidate.json')
    standing = read('assets/characters/street/'+ID+'/mouths-standing-v1.json')
    gesture = read(APPROVED+'/mouth-fragment.json')['variants']
    if standing['sources']['standing'] != published['standing']['sha256'] or digest(ROOT/published['standing']['file'].removeprefix('./')) != published['standing']['sha256']:
        raise ValueError('Standing paint identity changed')
    for a, b in zip(gesture['desktop']['frames'], gesture['mobile']['frames']):
        if a['rect'] != b['rect'] or a['profile'] != b['profile'] or a['axes'] != [2*v for v in b['axes']]:
            raise ValueError('Gesture variants disagree in physical registration')
    selected = {(row,col) for row in range(4) for col in range(16)}
    selected |= {(row,col) for row in range(4,8) for col in range(5)}
    selected |= {(8,col) for col in range(8)}
    reserved = selected | {(13,col) for col in range(16)}
    free = iter((row,col) for row in range(ROWS) for col in range(COLS) if (row,col) not in reserved)
    stops = [next(free) for _ in range(256)]
    output.mkdir(parents=True, exist_ok=True)
    variants = {}
    base = './'+FAMILY+'/delivery-v2/'
    for name, factor in [('desktop',1),('mobile',.5)]:
        w, h, shift = int(128*factor), int(160*factor), int(2*factor)
        original = Image.open(ROOT/(FAMILY+f'/character-{name}.webp')).convert('RGBA')
        strip = Image.open(ROOT/(APPROVED+f'/greet16-{name}.webp')).convert('RGBA')
        stop_strip = Image.open(ROOT/(STOPS+f'/stops-{name}.webp')).convert('RGBA')
        if original.size != (w*16,h*13) or strip.size != (w*16,h) or stop_strip.size != (w*16,h*16):
            raise ValueError('Changed input atlas dimensions')
        atlas = Image.new('RGBA',(w*COLS,h*ROWS))
        cells = {}
        for row,col in sorted(reserved):
            source, source_row = (strip,0) if row == 13 else (original,row)
            cells[row,col] = source.crop((col*w,source_row*h,(col+1)*w,(source_row+1)*h))
        for slot,position in enumerate(stops):
            x,y=(slot%16)*w,(slot//16)*h
            cells[position]=stop_strip.crop((x,y,x+w,y+h))
        for (row,col),cell in cells.items():
            if cell.getchannel('A').crop((0,h-shift,w,h)).getbbox() is not None:
                raise ValueError(f'Clipped source alpha: {name}/{row}:{col}')
            atlas.alpha_composite(cell,(col*w,row*h+shift))
        path = output/f'source-{name}.webp'
        atlas.save(path,format='WEBP',lossless=True,method=4,exact=True)
        with Image.open(path) as decoded:
            if decoded.convert('RGBA').tobytes() != atlas.tobytes():
                raise ValueError('Lossless source export changed pixels')
        variants[name] = dict(file=base+path.name,sha256=digest(path),width=atlas.width,height=atlas.height)
    frames = [None]*(COLS*ROWS)
    for row,col in selected:frames[row*COLS+col]=translated_mouth(old_mouth['frames'][row*16+col])
    for col,frame in enumerate(gesture['desktop']['frames']):frames[13*COLS+col]=translated_mouth(frame)
    settles = {}
    for direction_index,direction in enumerate(['down','right','up','left']):
        settles[direction]={}
        for phase in range(16):
            sequence=[]
            source=old_mouth['frames'][direction_index*16+phase]
            target=old_mouth['frames'][(direction_index+4)*16+2]
            for stage,strength in enumerate([.8,.6,.4,.2]):
                row,col=stops[(direction_index*16+phase)*4+stage]
                sequence.append(dict(row=row,col=col,ms=70))
                if source is not None:
                    if target is None or source['axes']!=target['axes'] or source['profile']!=target['profile'] or source['rect'][2:]!=target['rect'][2:]:
                        raise ValueError('Stop lips require the same own head paint and axes')
                    fit=deepcopy(source)
                    fit['rect'][:2]=[b+(a-b)*strength for a,b in zip(source['rect'][:2],target['rect'][:2])]
                    frames[row*COLS+col]=translated_mouth(fit)
            sequence.append(dict(row=direction_index+4,col=2,ms=70))
            settles[direction][str(phase)]=dict(frames=sequence)
    mouth = dict(schemaVersion=1,id=ID,cell=[128,160],grid=[COLS,ROWS],
                 sources=dict(standing=published['standing']['sha256'],**{name:v['sha256'] for name,v in variants.items()}),
                 standing=standing['standing'],frames=frames)
    if sum(frame is not None for frame in frames) != 276:
        raise ValueError('Unexpected visible mouth coverage')
    write(output/'mouths-v2.json',mouth)
    states = {name:dict(row=13,col=0,durations_ms=[80]*16,loop=False,next='neutral') for name in ['greet','work','review']}
    states.update({name:dict(row=4,col=2,durations_ms=[ms],loop=False,next='neutral') for name,ms in [('look',80),('wait',600),('success',300),('failure',300)]})
    person = {key:deepcopy(published[key]) for key in ['id','aliases','cell','pivot','figureHeight','figureWorldHeight','standing']}
    person.update(standingOnly=False,grid=[COLS,ROWS],strideDistance=9.5,variants=variants,
                  clips={name:dict(offset=row*COLS,count=16,seconds=.96) for row,name in enumerate(['down','right','up','left'])},
                  atlasMotion=dict(schemaVersion=1,walks=metadata['walks'],bridges=metadata['bridges'],
                      transitions={name:dict(frames=value['frames']) for name,value in metadata['transitions'].items()},
                      neutral=dict(row=4,col=2),settles=settles,interactions=dict(neutral=dict(row=4,col=2),states=states)),
                  mouthPaint=dict(file=base+'mouths-v2.json',sha256=digest(output/'mouths-v2.json')))
    person['clips']['idle'] = dict(offset=4*COLS+2,count=1,seconds=1)
    write(output/'person.json',person)
    receipt = dict(status='source-only candidate; encoded/ordered/native/review acceptance pending',inputs=INPUTS,
                   metadataSha256=digest(ROOT/(FAMILY+'/manifest.json')),helperSha256=digest(Path(__file__)),
                   selectedMovementCells=92,selectedStopCells=256,selectedGestureCells=16,logicalCells=COLS*ROWS,visibleMouths=276,nullMouths=102,
                   translationPixels=dict(desktop=[0,2],mobile=[0,1]),
                   outputs={name:digest(output/name) for name in ['source-desktop.webp','source-mobile.webp','mouths-v2.json','person.json']})
    write(output/'compile-receipt.json',receipt)
    return dict(person=person,mouth=mouth,receipt=receipt)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--outdir',type=Path,default=ROOT/'output/ambient-city-animation/gisela-integration-v3')
    args = parser.parse_args()
    print(json.dumps(build_candidate(args.outdir)['receipt']))
