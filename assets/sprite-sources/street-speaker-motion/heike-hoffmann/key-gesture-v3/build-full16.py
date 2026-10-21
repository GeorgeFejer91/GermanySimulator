"""Sample the reviewed own-key pilot field densely; never modify the game."""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys

import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[5]
FOLDER=Path(__file__).resolve().parent
OUT=ROOT/'output/ambient-city-animation/heike-key-gesture-full16-v1'
sys.path.insert(0,str(ROOT/'.agents/skills/animate-2d-characters/scripts'))
import morph_frames
import painted_walk
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()


def build():
    OUT.mkdir(parents=True,exist_ok=True)
    definition=importlib.util.spec_from_file_location('street',ROOT/'tools/build-street-character-sprites.py')
    street=importlib.util.module_from_spec(definition);definition.loader.exec_module(street)
    controls_path=FOLDER/'controls.json';controls_hash=sha(controls_path)
    controls=json.loads(controls_path.read_text());path=ROOT/controls['source']['file']
    if sha(path)!=controls['source']['sha256']:raise ValueError('Own source changed')
    neutral=Image.open(path).convert('RGBA').crop(controls['source']['crop'])
    original=np.asarray(neutral);paint=morph_frames.premultiplied(neutral)
    source=np.array(controls['pointsSource']);target=np.array(controls['pointsTarget']);tri=np.array(controls['triangles'])
    morph_frames.validate_mesh(source,target,tri)
    frames=[];records=[];cache={0:neutral}
    for index in range(16):
        phase=index/15
        if phase<.44:time=phase/.44
        elif phase>.55:time=(1-phase)/.45
        else:time=1
        time=time*time*(3-2*time)
        if time not in cache:
            mapping,_=morph_frames.coordinate_maps(source,target,tri,time,neutral.size)
            cache[time]=painted_walk.unpack(morph_frames.sample(paint,mapping))
        frame=cache[time];pixels=np.asarray(frame)
        for name,region in [('head/mouth',(slice(0,270),slice(None))),
                            ('feet',(slice(400,None),slice(None))),
                            ('cards',(slice(280,390),slice(300,400))),
                            ('coat buttons',(slice(300,380),slice(232,250)))]:
            if not np.array_equal(pixels[region],original[region]):raise ValueError('Fixed '+name+' changed')
        frame.save(OUT/('working-'+str(index).zfill(2)+'.png'))
        frames.append(frame);records.append(dict(index=index,ms=80,fieldTime=time,headMouthExact=True,feetExact=True,cardsExact=True,buttonsExact=True))
        print('Dense own key gesture '+str(index),flush=True)
    variants={}
    for name,w,h,figure,pivot in [('desktop',96,120,102,[48,112.5]),('mobile',64,80,68,[32,75])]:
        spec=dict(cell=[w,h],figureHeight=figure,pivot=pivot,working=dict(figureHeight=400,baseline=472))
        exact=[street.export_cell(frame,spec) for frame in frames]
        atlas=Image.new('RGBA',(w*16,h))
        for i,frame in enumerate(exact):atlas.paste(frame,(w*i,0))
        output=OUT/('key16-'+name+'.webp');atlas.save(output,lossless=True,exact=True,method=4)
        if Image.open(output).convert('RGBA').tobytes()!=atlas.tobytes():raise ValueError('Encoded paint differs')
        variants[name]=dict(file=output.name,sha256=sha(output),cell=[w,h],image_size=list(atlas.size),directWorkingSampling=True)
        for theme,color in [('light','#eee8db'),('dark','#25272b')]:
            board=Image.new('RGBA',(4*w,4*h),color)
            for i,frame in enumerate(exact):board.alpha_composite(frame,((i%4)*w,(i//4)*h))
            zoom=3 if name=='desktop' else 4
            board.resize((board.width*zoom,board.height*zoom),Image.Resampling.NEAREST).convert('RGB').save(OUT/(name+'-'+theme+'.png'))
        display=[street.opaque_board([frame],1,'#eee8db',3 if name=='desktop' else 4) for frame in exact]
        display[0].save(OUT/(name+'.gif'),save_all=True,append_images=display[1:],duration=80,loop=0,disposal=2)
    if sha(controls_path)!=controls_hash:raise ValueError('Pilot controls changed during sampling')
    receipt=dict(status='held dense source candidate; encoded/ordered/runtime acceptance pending',
        driverSha256=sha(Path(__file__)),controlsSha256=controls_hash,controlsSource=controls['source'],
        samples=records,distinctWorkingFrames=len({frame.tobytes() for frame in frames}),
        endExact=frames[0].tobytes()==frames[-1].tobytes(),variants=variants,
        limitations=['Small elbow/key emphasis, not an overhead wave.','No runtime/media/GPU acceptance from this authoring recipe.'])
    (OUT/'key16.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps({'status':receipt['status'],'distinct':receipt['distinctWorkingFrames'],'variants':variants}),flush=True)


if __name__=='__main__':build()
