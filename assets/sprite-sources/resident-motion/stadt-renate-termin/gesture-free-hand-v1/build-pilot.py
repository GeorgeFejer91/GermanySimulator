"""Renate's own connected free-left-hand acknowledgement: four source keys only."""
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import label
from scipy.spatial import Delaunay

ROOT = Path(__file__).resolve().parents[5]
SOURCE = ROOT / 'output/ambient-city-animation/renate-termin-source-gate-v1/down-registered.png'
SOURCE_SHA = 'd536bf5b124d8154e0a1db25b34a644ec4f11f8c9adbc63f8d67a490271d8926'
OUT = ROOT / 'output/ambient-city-animation/renate-termin-gesture-pilot-v1'
sys.path.insert(0, str(ROOT / '.agents/skills/animate-2d-characters/scripts'))
import morph_frames
import painted_walk as paint


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def mesh():
    xs = [0,256,300,315,330,350,370,390,410,511]
    ys = [0,240,250,270,290,310,335,355,377,390,400,511]
    shifts = {
        (350,270):(1,-1),(370,270):(1,-1),
        (350,290):(2,-2),(370,290):(2,-2),
        (350,310):(5,-5),(370,310):(5,-5),(390,310):(1,-1),
        (350,335):(10,-10),(370,335):(10,-10),(390,335):(2,-2),
        (350,355):(12,-12),(370,355):(12,-12),(390,355):(2,-2),
        (350,377):(4,-4),(370,377):(4,-4)
    }
    source = np.array([(x,y) for y in ys for x in xs],float)
    target = np.array([(x+shifts.get((x,y),(0,0))[0],y+shifts.get((x,y),(0,0))[1])
        for y in ys for x in xs],float)
    triangles = Delaunay((source+target)/2).simplices
    morph_frames.validate_mesh(source,target,triangles)
    return source,target,triangles


def render(neutral,source,target,triangles,amount):
    if amount==0:
        return neutral.copy()
    coordinates,_ = morph_frames.coordinate_maps(source,target,triangles,amount,neutral.size)
    pixels = np.asarray(paint.unpack(morph_frames.sample(morph_frames.premultiplied(neutral),coordinates))).copy()
    original = np.asarray(neutral)
    pixels[:250] = original[:250]
    pixels[390:] = original[390:]
    pixels[:,:330] = original[:,:330]
    return Image.fromarray(pixels)


def main():
    if sha(SOURCE)!=SOURCE_SHA:
        raise ValueError('Own neutral source changed')
    neutral = Image.open(SOURCE).convert('RGBA')
    if neutral.size!=(512,512):
        raise ValueError('Expected registered own neutral')
    module_spec = importlib.util.spec_from_file_location('street',ROOT/'tools/build-street-character-sprites.py')
    street = importlib.util.module_from_spec(module_spec)
    module_spec.loader.exec_module(street)
    OUT.mkdir(parents=True,exist_ok=True)
    source,target,triangles = mesh()
    amounts = [0,.35,1,0]
    original = np.asarray(neutral)
    original_groups,_ = label(original[:,:,3]>=128)
    original_sizes = np.bincount(original_groups.ravel())
    original_sizes[0] = 0
    original_minor = (original_groups>0) & (original_groups!=original_sizes.argmax())
    frames,observations,files = [],[],{}

    def save(image,name):
        image.save(OUT/name)
        files[name]=sha(OUT/name)

    for index,amount in enumerate(amounts):
        frame = render(neutral,source,target,triangles,amount)
        pixels = np.asarray(frame)
        if not (np.array_equal(pixels[:250],original[:250]) and
                np.array_equal(pixels[390:],original[390:]) and
                np.array_equal(pixels[:,:330],original[:,:330])):
            raise ValueError('Owned head, boots or RIGHT ticket/grip changed')
        groups,_ = label(pixels[:,:,3]>=128)
        sizes = np.bincount(groups.ravel())
        sizes[0] = 0
        minor = (groups>0) & (groups!=sizes.argmax())
        if not np.array_equal(minor,original_minor):
            raise ValueError('Detached free-hand/sleeve paint')
        if np.any(pixels[pixels[:,:,3]==0]):
            raise ValueError('Hidden RGB at alpha0')
        save(frame,f'working-{index:02}.png')
        frames.append(frame)
        observations.append({'amount':amount,'role':['entry','anticipation','peak','recovery'][index],
            'headExact':True,'bootsExact':True,'rightTicketGripExact':True,
            'originalMinorAlphaPixelsUnchanged':int(np.count_nonzero(original_minor))})
    if frames[0].tobytes()!=frames[-1].tobytes() or len({f.tobytes() for f in frames})!=3:
        raise ValueError('Gesture endpoints or distinct keys changed')
    for label_name,cell,pivot,figure in [('working',[512,512],[256,472],400),
            ('desktop',[96,120],[48,112.5],99),('mobile',[64,80],[32,75],66)]:
        cells = frames if label_name=='working' else [street.export_cell(frame,{
            'working':{'figureHeight':400,'baseline':472},'cell':cell,'pivot':pivot,'figureHeight':figure}) for frame in frames]
        if label_name!='working':
            for index,image in enumerate(cells):
                box=image.getbbox()
                if not box or min(box[0],box[1],cell[0]-box[2],cell[1]-box[3])<2:
                    raise ValueError('Direct gesture export clipped')
                save(image,f'{label_name}-{index:02}.png')
        for theme,color in [('light','#f4efe2'),('dark','#1b1f25')]:
            board=Image.new('RGBA',(cell[0]*4,cell[1]),color)
            for index,image in enumerate(cells):
                board.alpha_composite(image,(index*cell[0],0))
            save(board,f'{label_name}-{theme}.png')
    for theme,color in [('light','#f4efe2'),('dark','#1b1f25')]:
        board=Image.new('RGBA',(260*4,300),color)
        for index,image in enumerate(frames):
            board.alpha_composite(image.crop((300,245,430,395)).resize((260,300),Image.Resampling.NEAREST),(index*260,0))
        save(board,f'free-left-arm-{theme}.png')
    if sha(SOURCE)!=SOURCE_SHA:
        raise ValueError('Own neutral source changed during pilot')
    receipt={'status':'unapproved source-only four-key gesture candidate','id':'stadt-renate-termin',
        'action':'small anatomical LEFT free-hand acknowledgement, RIGHT ticket/grip fixed',
        'source':{'file':SOURCE.relative_to(ROOT).as_posix(),'sha256':SOURCE_SHA},
        'driverSha256':sha(Path(__file__)),'helperSha256':{name:sha(ROOT/'.agents/skills/animate-2d-characters/scripts'/name)
            for name in ['morph_frames.py','painted_walk.py']},'exportHelperSha256':sha(ROOT/'tools/build-street-character-sprites.py'),
        'mesh':{'source':source.tolist(),'target':target.tolist(),'triangles':triangles.tolist()},
        'paintFigure':{'working':400,'desktop':99,'mobile':66},'logicalFigureHeight':136,
        'observations':observations,'files':files,
        'limits':['Four source keys only; no full16 timing or fluent movement claim','No gesture mouth transport, encoded atlas, GPU, game trigger or world test']}
    (OUT/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'receiptSha256':sha(OUT/'receipt.json'),'images':len(files),'guardChecks':observations}))


if __name__=='__main__':
    main()
