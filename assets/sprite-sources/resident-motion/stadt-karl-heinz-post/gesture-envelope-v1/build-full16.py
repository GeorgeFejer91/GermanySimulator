"""Karl own-envelope full16 candidate from the independently reviewed mesh."""
from pathlib import Path
import hashlib
import importlib.util
import json

import numpy as np
from PIL import Image
from scipy.ndimage import label

ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
PILOT_DRIVER=HERE/'build-pilot.py'
PILOT_DIR=ROOT/'output/ambient-city-animation/karl-post-envelope-gesture-v1/pilot'
REVIEW=PILOT_DIR/'independent-source-review/REPORT.md'
OUT=ROOT/'output/ambient-city-animation/karl-post-envelope-gesture-v1/full16'
PILOT_SHA='7b8848ed505e886f5cd8bb1e63d5eccc537963ad79de9ff3cf790828af869253'
REVIEW_SHA='0b5d7ea2315b668cb5d53479c18d233fb9a0e9eb90972a27bb865913ad81c9a2'
FRAME_MS=80


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def timeline():
    # Four reviewed stills remain exact at indices 0/3/8/15. The three
    # top poses form a 240 ms held emphasis in the 1.28 s action.
    return [0,.05,.11,.18,.34,.53,.72,.90,1,1,1,.84,.66,.44,.20,0]


def load_pilot():
    if (sha(PILOT_DIR/'pilot-source.json')!=PILOT_SHA or sha(REVIEW)!=REVIEW_SHA or
            sha(PILOT_DRIVER)!='96b5613590b1c4796349a32a7303fae16dd48c6b42ec10a47d4120a361982ee2'):
        raise ValueError('Independently reviewed Karl envelope pilot changed')
    spec=importlib.util.spec_from_file_location('reviewed_karl_envelope',PILOT_DRIVER)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module,json.loads((PILOT_DIR/'pilot-source.json').read_text(encoding='utf8'))


def board(frames,path,columns,color,scale=1):
    w,h=frames[0].size
    sheet=Image.new('RGBA',(w*columns,h*((len(frames)+columns-1)//columns)),color)
    for index,frame in enumerate(frames):
        sheet.alpha_composite(frame,((index%columns)*w,(index//columns)*h))
    if scale!=1:
        sheet=sheet.resize((sheet.width*scale,sheet.height*scale),Image.Resampling.NEAREST)
    sheet.convert('RGB').save(path)


def build(out):
    pilot,approved=load_pilot()
    if sha(pilot.SOURCE)!=pilot.EXPECTED_SOURCE or sha(pilot.BODY)!=pilot.EXPECTED_BODY:
        raise ValueError('Karl own front neutral/body changed')
    source,target,triangles=pilot.mesh()
    control=approved['mesh']
    if (source.tolist()!=control['pointsSource'] or target.tolist()!=control['pointsTarget'] or
            triangles.tolist()!=control['triangles']):
        raise ValueError('Karl independently reviewed envelope mesh changed')
    neutral=Image.open(pilot.SOURCE).convert('RGBA')
    paths=[pilot.SOURCE,pilot.BODY,PILOT_DRIVER,PILOT_DIR/'pilot-source.json',REVIEW,
           ROOT/'tools/build-resident-motion.py',
           ROOT/'.agents/skills/animate-2d-characters/scripts/morph_frames.py',
           ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py',Path(__file__)]
    before={path.relative_to(ROOT).as_posix():sha(path) for path in paths}
    out.mkdir(parents=True,exist_ok=True)
    values=timeline()
    if len(values)!=16 or [values[i] for i in (0,3,8,15)]!=[0,.18,1,0]:
        raise ValueError('Karl reviewed envelope anchors changed')
    anchor={0:0,3:1,8:2,15:3}
    frames=[]
    checks=[]
    original=np.asarray(neutral)
    for index,amount in enumerate(values):
        frame=pilot.render(neutral,source,target,triangles,amount)
        pixels=np.asarray(frame)
        if not (np.array_equal(pixels[:270],original[:270]) and
                np.array_equal(pixels[400:],original[400:]) and
                np.array_equal(pixels[:400,:280],original[:400,:280])):
            raise ValueError('Karl source head, mouth, feet or opposite coat moved')
        if index in anchor:
            review_frame=Image.open(PILOT_DIR/f'working-{anchor[index]:02}.png').convert('RGBA')
            if sha(PILOT_DIR/f'working-{anchor[index]:02}.png')!=approved['frames'][anchor[index]]['sha256'] or frame.tobytes()!=review_frame.tobytes():
                raise ValueError('Karl reviewed four-frame gesture anchor changed')
        groups,_=label(pixels[:,:,3]>=128)
        counts=np.bincount(groups.ravel())[1:]
        if not len(counts) or counts.max()/counts.sum()<.995:
            raise ValueError('Detached own envelope or cuff paint')
        changed=np.any(pixels!=original,axis=2)
        if changed.any():
            yy,xx=np.where(changed)
            bounds=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]
        else:
            bounds=None
        path=out/f'working-{index:02}.png'
        frame.save(path)
        frames.append(frame)
        checks.append({'frame':index,'amount':amount,'durationMs':FRAME_MS,'file':path.name,
                       'sha256':sha(path),'changedBounds':bounds,
                       'opaqueBodyFraction':float(counts.max()/counts.sum()),
                       'headMouthExact':True,'feetExact':True,'oppositeArmExact':True})
    if frames[0].tobytes()!=frames[-1].tobytes() or len({f.tobytes() for f in frames})<10:
        raise ValueError('Karl full gesture lacks distinct motion or exact recovery')
    builder_path=ROOT/'tools/build-resident-motion.py'
    builder_spec=importlib.util.spec_from_file_location('karl_full_gesture_builder',builder_path)
    builder=importlib.util.module_from_spec(builder_spec)
    builder_spec.loader.exec_module(builder)
    variants={}
    body=json.loads(pilot.BODY.read_text(encoding='utf8'))
    for name,physical in body['variants'].items():
        w,h=physical['frame_size']
        spec={'cell':[w,h],'figureHeight':physical['figureHeight'],
              'pivot':physical['pivot'],'working':{'figureHeight':400,'baseline':472}}
        cells=[builder.street.export_cell(frame,spec) for frame in frames]
        pilot_atlas=Image.open(PILOT_DIR/approved['variants'][name]['file']).convert('RGBA')
        if sha(PILOT_DIR/approved['variants'][name]['file'])!=approved['variants'][name]['sha256']:
            raise ValueError('Karl reviewed encoded gesture pilot changed')
        for index,pilot_index in anchor.items():
            if cells[index].tobytes()!=pilot_atlas.crop((pilot_index*w,0,(pilot_index+1)*w,h)).tobytes():
                raise ValueError('Karl encoded gesture anchor changed: '+name)
        gutters=[]
        sheet=Image.new('RGBA',(w*16,h))
        for index,cell in enumerate(cells):
            bounds=cell.getchannel('A').getbbox()
            gutters.append(min(bounds[0],bounds[1],w-bounds[2],h-bounds[3]))
            sheet.paste(cell,(index*w,0))
        if min(gutters)<2 or cells[0].tobytes()!=cells[-1].tobytes():
            raise ValueError('Karl gesture gutter or encoded endpoint changed')
        path=out/f'gesture-{name}.webp'
        sheet.save(path,lossless=True,exact=True,method=4)
        decoded=Image.open(path).convert('RGBA')
        if decoded.tobytes()!=sheet.tobytes():
            raise ValueError('Karl encoded gesture atlas changed RGBA')
        for index,cell in enumerate(cells):
            if decoded.crop((index*w,0,(index+1)*w,h)).tobytes()!=cell.tobytes():
                raise ValueError('Karl decoded gesture cell changed')
        for theme,color in (('light','#eee8db'),('dark','#25272b')):
            board(cells,out/f'{name}-{theme}.png',8,color,3 if name=='desktop' else 4)
        displayed=[]
        for cell in cells:
            sample=Image.new('RGBA',(w,h),'#eee8db')
            sample.alpha_composite(cell)
            displayed.append(sample.resize((w*3,h*3),Image.Resampling.NEAREST).convert('RGB'))
        displayed[0].save(out/f'{name}-80ms.gif',save_all=True,append_images=displayed[1:],
                          duration=FRAME_MS,loop=0,disposal=2)
        variants[name]={'file':path.name,'sha256':sha(path),'cell':[w,h],
                        'figureHeight':physical['figureHeight'],'pivot':physical['pivot'],
                        'minimumGutter':min(gutters),'decodedExactCells':16}
    for theme,color in (('light','#eee8db'),('dark','#25272b')):
        board(frames,out/f'working-{theme}.png',4,color)
    if any(sha(ROOT/key)!=digest for key,digest in before.items()):
        raise ValueError('Karl reviewed gesture inputs changed during full16 bake')
    result={'schemaVersion':1,'id':'stadt-karl-heinz-post',
        'status':'held full16 own-envelope source gesture; temporal/native review pending',
        'action':'anatomical-left envelope emphasis; fixed head, mouth, feet and opposite arm',
        'pilotReceiptSha256':PILOT_SHA,'independentPilotReviewSha256':REVIEW_SHA,
        'source':{'file':pilot.SOURCE.relative_to(ROOT).as_posix(),'sha256':pilot.EXPECTED_SOURCE},
        'inputs':before,'frameMs':FRAME_MS,'frameCount':16,'timeline':values,
        'actualMesh':control,'protected':approved['protected'],
        'reviewedAnchorIndices':anchor,'frames':checks,'variants':variants,
        'limitations':['No native runtime gesture or mouth shader has run.',
                       'Temporal smoothness and perceived motion require independent review.',
                       'No source-paint or other family anatomy added.']}
    result['driverSha256']=sha(Path(__file__))
    receipt=out/'gesture-source.json'
    receipt.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf8')
    print(json.dumps({'status':result['status'],'frames':16,'pilotAnchorsExact':4,
                      'desktop':variants['desktop']['sha256'],
                      'mobile':variants['mobile']['sha256'],
                      'receiptSha256':sha(receipt)}),flush=True)


if __name__=='__main__':
    build(OUT)
