"""Resample the approved Renate free-hand source mesh over one planted action."""
import hashlib
import importlib.util
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import label

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
OUT = ROOT/'output/ambient-city-animation/renate-termin-gesture-full16-v1'
REVIEW = ROOT/'output/ambient-city-animation/renate-termin-source-review-v1/gesture-pilot-review/receipt.json'
PILOT_RECEIPT = ROOT/'output/ambient-city-animation/renate-termin-gesture-pilot-v1/receipt.json'
PILOT_SHA = '48751953662323bb219cf690cb57e79775b9f3e28ba0ca25a010a58a2ac582c7'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    if sha(PILOT_RECEIPT)!=PILOT_SHA or not REVIEW.is_file():
        raise ValueError('Reviewed pilot receipt is missing or changed')
    review=json.loads(REVIEW.read_text(encoding='utf8'))
    if review.get('verdict')!='PASS bounded four source keys' or review.get('receiptSha256')!=PILOT_SHA:
        raise ValueError('Expected own bounded pilot source review')
    reviewed=review['candidatePins']
    for file,expected in reviewed.items():
        path=(ROOT/file).resolve()
        if not path.is_relative_to(ROOT) or sha(path)!=expected:
            raise ValueError('Reviewed gesture input changed: '+file)
    pilot=load('renate_gesture_pilot',HERE/'build-pilot.py')
    if sha(pilot.SOURCE)!=pilot.SOURCE_SHA:
        raise ValueError('Own neutral source changed')
    old=json.loads(PILOT_RECEIPT.read_text(encoding='utf8'))
    if sha(HERE/'build-pilot.py')!=old['driverSha256']:
        raise ValueError('Approved mesh driver changed')
    neutral=Image.open(pilot.SOURCE).convert('RGBA')
    source,target,triangles=pilot.mesh()
    original=np.asarray(neutral)
    def minor(pixels):
        groups,_=label(pixels[:,:,3]>=128)
        sizes=np.bincount(groups.ravel());sizes[0]=0
        return (groups>0)&(groups!=sizes.argmax())
    original_minor=minor(original)
    street=load('renate_gesture_export',ROOT/'tools/build-street-character-sprites.py')
    OUT.mkdir(parents=True,exist_ok=True)
    files,frames,fields={},[],[]

    def save(image,name):
        path=OUT/name
        image.save(path)
        if Image.open(path).convert('RGBA').tobytes()!=image.convert('RGBA').tobytes():
            raise ValueError('PNG round trip changed source pixels')
        files[name]=sha(path)

    for index in range(16):
        progress=index/7 if index<=7 else (15-index)/8
        amount=0 if index in (0,15) else math.sin(math.pi*.5*progress)**2
        frame=pilot.render(neutral,source,target,triangles,amount)
        pixels=np.asarray(frame)
        if not (np.array_equal(pixels[:250],original[:250]) and
                np.array_equal(pixels[390:],original[390:]) and
                np.array_equal(pixels[:,:330],original[:,:330]) and
                np.array_equal(minor(pixels),original_minor)):
            raise ValueError('Head, support, ticket ownership or source topology changed')
        if np.any(pixels[pixels[:,:,3]==0]):
            raise ValueError('Hidden RGB at alpha0')
        save(frame,f'working-{index:02}.png')
        frames.append(frame)
        fields.append({'index':index,'timeMs':index*80,'durationMs':80,'amount':amount,
            'working':f'working-{index:02}.png','headMouthField':'identity: all source pixels y<250 exact',
            'headBootsTicketExact':True,'sourceMinorAlphaMaskExact':True})
    if frames[0].tobytes()!=neutral.tobytes() or frames[-1].tobytes()!=neutral.tobytes() or frames[7].tobytes()!=Image.open(PILOT_RECEIPT.parent/'working-02.png').convert('RGBA').tobytes():
        raise ValueError('Entry, approved peak or final recovery changed')
    if len({frame.tobytes() for frame in frames})!=15:
        raise ValueError('Expected fifteen distinct samples plus exact neutral recovery')
    variants={}
    for name,cell,pivot,figure in [('desktop',[96,120],[48,112.5],99),('mobile',[64,80],[32,75],66)]:
        images=[street.export_cell(frame,{'working':{'figureHeight':400,'baseline':472},
            'cell':cell,'pivot':pivot,'figureHeight':figure}) for frame in frames]
        gutters=[]
        for index,image in enumerate(images):
            box=image.getbbox()
            gutters.append(min(box[0],box[1],cell[0]-box[2],cell[1]-box[3]))
            if gutters[-1]<2:
                raise ValueError('Gesture gutter lost')
            save(image,f'{name}-{index:02}.png')
        if images[0].tobytes()!=images[-1].tobytes():
            raise ValueError('Physical entry and recovery differ')
        variants[name]={'cell':cell,'pivot':pivot,'paintFigureHeight':figure,'minimumGutter':min(gutters),
            'files':[f'{name}-{index:02}.png' for index in range(16)]}
    for theme,color in [('light','#f4efe2'),('dark','#1b1f25')]:
        board=Image.new('RGBA',(512*4,512*4),color)
        arm=Image.new('RGBA',(260*4,300*4),color)
        for index,image in enumerate(frames):
            board.alpha_composite(image,(index%4*512,index//4*512))
            arm.alpha_composite(image.crop((300,245,430,395)).resize((260,300),Image.Resampling.NEAREST),(index%4*260,index//4*300))
        save(board,f'working-{theme}.png');save(arm,f'free-left-arm-{theme}.png')
        for name,v in variants.items():
            w,h=v['cell'];board=Image.new('RGBA',(w*8,h*2),color)
            for index,file in enumerate(v['files']):board.alpha_composite(Image.open(OUT/file).convert('RGBA'),(index%8*w,index//8*h))
            save(board,f'{name}-{theme}.png')
    if sha(pilot.SOURCE)!=pilot.SOURCE_SHA or sha(PILOT_RECEIPT)!=PILOT_SHA:
        raise ValueError('Reviewed inputs changed during sampling')
    if any(sha(ROOT/file)!=expected for file,expected in reviewed.items()):
        raise ValueError('Reviewed source pins changed during sampling')
    result={'schemaVersion':1,'id':'stadt-renate-termin','status':'full16 source candidate, independent review pending',
        'source':{'file':pilot.SOURCE.relative_to(ROOT).as_posix(),'sha256':pilot.SOURCE_SHA},
        'pilotReceiptSha256':PILOT_SHA,'pilotReview':{'file':REVIEW.relative_to(ROOT).as_posix(),'sha256':sha(REVIEW)},
        'driverSha256':sha(Path(__file__)),'pilotDriverSha256':sha(HERE/'build-pilot.py'),
        'frameCount':16,'distinctVisualSamples':15,'frameMs':80,'durationMs':1280,
        'sourceMethod':'continuous own source mesh; smooth rise7 intervals and recovery8 intervals, no counter-motion claim',
        'logical':{'cell':[128,160],'pivot':[64,150],'figureHeight':136,'figureWorldHeight':1.6},
        'fields':fields,'variants':variants,'files':files,
        'limits':['No encoded runtime atlas or actual renderer proof','Mouth head pixels are fixed but no moving-fragment/runtime speech assembly tested']}
    (OUT/'gesture-source.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'receiptSha256':sha(OUT/'gesture-source.json'),'files':len(files),'frameCount':16,'distinctVisualSamples':15,'durationMs':1280}))


if __name__=='__main__':main()
