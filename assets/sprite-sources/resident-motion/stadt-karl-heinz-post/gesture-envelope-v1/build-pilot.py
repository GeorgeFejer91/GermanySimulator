"""Four-frame Karl own-neutral envelope emphasis, source-only candidate."""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import label
from scipy.spatial import Delaunay

ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
SOURCE=ROOT/'output/ambient-city-animation/karl-post-walk-source-v1/working/turn-0.png'
BODY=ROOT/'output/ambient-city-animation/karl-post-walk-source-v1/walk-source.json'
OUT=ROOT/'output/ambient-city-animation/karl-post-envelope-gesture-v1/pilot'
EXPECTED_SOURCE='366797a6a139b1202602e30408a9d0e4458a796593119049ec3d3ea37e290d2f'
EXPECTED_BODY='4eebaefae5f8b81d1854298bfcaf4559dd041ba740c4034b70baebd96a643eac'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import morph_frames
import painted_walk


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def mesh():
    """Move Karl's painted viewer-right paper/grip as a small connected region."""
    fixed={(0,0),(511,0),(511,511),(0,511)}
    fixed.update((x,y) for y in (65,165,260) for x in (80,160,256,320,385,430))
    fixed.update((x,y) for y in (270,400) for x in (0,100,200,280,300,315,340,385,410,511))
    fixed.update((x,y) for y in (300,340,380) for x in (100,200,280,300,410,450))
    # The source envelope lies at x320-350/y310-370, attached to the hand
    # around x350-385/y340-375. Interior controls move uniformly, while the
    # connected sleeve gradually returns to the fixed shoulder/coat border.
    moving={(x,y):(-6,-9) for y in (315,340,365) for x in (330,355,380)}
    moving.update({(330,290):(-2,-3),(355,290):(-3,-4),(380,290):(-2,-3),
                   (330,385):(-4,-5),(355,385):(-4,-5),(380,385):(-4,-5)})
    points=[(point,point) for point in sorted(fixed)]
    points.extend((point,(point[0]+shift[0],point[1]+shift[1]))
                  for point,shift in sorted(moving.items()))
    array=np.asarray(points,dtype=float)
    triangles=Delaunay(array.mean(axis=1)).simplices
    morph_frames.validate_mesh(array[:,0],array[:,1],triangles)
    return array[:,0],array[:,1],triangles


def render(neutral,source,target,triangles,amount):
    if amount==0:
        return neutral.copy()
    coordinates,_=morph_frames.coordinate_maps(source,target,triangles,amount,neutral.size)
    frame=painted_walk.unpack(morph_frames.sample(morph_frames.premultiplied(neutral),coordinates))
    pixels=np.asarray(frame).copy()
    original=np.asarray(neutral)
    # Exact source ownership for face/lips, planted lower garment/shoes and
    # the opposite coat/arm. The mesh has fixed anchor rows at both cuts.
    pixels[:270]=original[:270]
    pixels[400:]=original[400:]
    pixels[:400,:280]=original[:400,:280]
    return Image.fromarray(pixels)


def build(output):
    if sha(SOURCE)!=EXPECTED_SOURCE or sha(BODY)!=EXPECTED_BODY:
        raise ValueError('Accepted Karl own front neutral or body receipt changed')
    receipt=json.loads(BODY.read_text(encoding='utf8'))
    if receipt['neutrals']['down']['sourceSha256']!=EXPECTED_SOURCE:
        raise ValueError('Karl front turn/neutral source correspondence changed')
    builder_path=ROOT/'tools/build-resident-motion.py'
    definition=importlib.util.spec_from_file_location('karl_gesture_builder',builder_path)
    builder=importlib.util.module_from_spec(definition)
    definition.loader.exec_module(builder)
    paths=[SOURCE,BODY,builder_path,ROOT/'.agents/skills/animate-2d-characters/scripts/morph_frames.py',
           ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py',Path(__file__)]
    before={path.relative_to(ROOT).as_posix():sha(path) for path in paths}
    neutral=Image.open(SOURCE).convert('RGBA')
    source,target,triangles=mesh()
    amounts=(0,.18,1,0)
    output.mkdir(parents=True,exist_ok=True)
    frames=[]
    checks=[]
    for index,amount in enumerate(amounts):
        frame=render(neutral,source,target,triangles,amount)
        pixels=np.asarray(frame)
        original=np.asarray(neutral)
        if not (np.array_equal(pixels[:270],original[:270]) and
                np.array_equal(pixels[400:],original[400:]) and
                np.array_equal(pixels[:400,:280],original[:400,:280])):
            raise ValueError('Karl own face, feet or opposite arm changed')
        labels,_=label(pixels[:,:,3]>=128)
        sizes=np.bincount(labels.ravel())[1:]
        if not len(sizes) or sizes.max()/sizes.sum()<.995:
            raise ValueError('Detached Karl source gesture paint')
        path=output/f'working-{index:02}.png'
        frame.save(path)
        frames.append(frame)
        checks.append({'index':index,'amount':amount,'file':path.name,'sha256':sha(path),
                       'opaqueBodyFraction':float(sizes.max()/sizes.sum()),
                       'headMouthExact':True,'feetExact':True,'oppositeArmExact':True})
    if frames[0].tobytes()!=frames[-1].tobytes() or len({f.tobytes() for f in frames})!=3:
        raise ValueError('Karl four-pose anticipation/recovery changed')
    variants={}
    for name,physical in receipt['variants'].items():
        w,h=physical['frame_size']
        spec={'cell':[w,h],'figureHeight':physical['figureHeight'],
              'pivot':physical['pivot'],'working':{'figureHeight':400,'baseline':472}}
        cells=[builder.street.export_cell(frame,spec) for frame in frames]
        if cells[0].tobytes()!=cells[-1].tobytes():
            raise ValueError('Karl encoded gesture endpoints differ')
        gutters=[]
        for cell in cells:
            box=cell.getchannel('A').getbbox()
            gutters.append(min(box[0],box[1],w-box[2],h-box[3]))
        if min(gutters)<2:
            raise ValueError('Karl gesture encoded gutter collapsed')
        atlas=Image.new('RGBA',(w*4,h))
        for index,cell in enumerate(cells):
            atlas.paste(cell,(w*index,0))
        path=output/f'gesture-pilot-{name}.webp'
        atlas.save(path,lossless=True,exact=True,method=4)
        if Image.open(path).convert('RGBA').tobytes()!=atlas.tobytes():
            raise ValueError('Karl gesture encoded bytes differ')
        for theme,color in (('light','#eee8db'),('dark','#25272b')):
            board=Image.new('RGBA',atlas.size,color)
            board.alpha_composite(atlas)
            enlarged=3 if name=='desktop' else 4
            board.resize((board.width*enlarged,board.height*enlarged),Image.Resampling.NEAREST).convert('RGB').save(
                output/f'{name}-{theme}.png')
        variants[name]={'file':path.name,'sha256':sha(path),'cell':[w,h],
                        'figureHeight':physical['figureHeight'],'pivot':physical['pivot'],
                        'minimumGutter':min(gutters),'losslessDecodedExact':True}
    for theme,color in (('light','#eee8db'),('dark','#25272b')):
        board=Image.new('RGBA',(512*4,512),color)
        for index,frame in enumerate(frames):
            board.alpha_composite(frame,(index*512,0))
        board.convert('RGB').save(output/f'working-{theme}.png')
    if any(sha(ROOT/key)!=digest for key,digest in before.items()):
        raise ValueError('Karl gesture source/method inputs changed during pilot')
    result={'schemaVersion':1,'id':'stadt-karl-heinz-post',
            'status':'held own-envelope four-phase source pilot; independent visual review pending',
            'action':'modest anatomical-left envelope/forearm emphasis with anticipation and return',
            'source':{'file':SOURCE.relative_to(ROOT).as_posix(),'sha256':EXPECTED_SOURCE},
            'bodyReceiptSha256':EXPECTED_BODY,'inputs':before,
            'mesh':{'pointsSource':source.tolist(),'pointsTarget':target.tolist(),
                    'triangles':triangles.tolist(),'fieldOwnerSha256':sha(paths[3]),
                    'samplerSha256':sha(paths[4])},
            'protected':{'headAndMouthRows':'y<270 exact','lowerBodyAndFeetRows':'y>=400 exact',
                         'oppositeArmAndCoat':'x<280/y<400 exact'},
            'times':list(amounts),'frames':checks,'variants':variants,
            'limitations':['Only 4 source pilot frames; no full16 gesture, runtime timing or shader.',
                           'No hidden arm/body paint invented; all pixels come from Karl own neutral.',
                           'Perceived envelope rigidity and animation require independent native review.']}
    result['driverSha256']=sha(Path(__file__))
    target_path=output/'pilot-source.json'
    target_path.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf8')
    print(json.dumps({'status':result['status'],'frames':4,'receiptSha256':sha(target_path)}),flush=True)


if __name__=='__main__':
    build(OUT)
