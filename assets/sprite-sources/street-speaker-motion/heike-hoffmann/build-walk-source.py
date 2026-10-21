"""Bake held Heike walk/bridge/turn paint through the existing family rig.

Logical geometry stays128x160 so the published standing identity is unchanged.
Both physical variants sample working512 paint directly; neither resizes an atlas.
"""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json

from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
FOLDER = Path(__file__).resolve().parent
ID = 'quiz-heike-hoffmann'
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()


def capture_upper_warps(builder, person, direction, render, expected_frames, expected_runs=1):
    """Record the actual original-upper warp controls used by this local render."""
    view = person['views'][direction]
    if not view.get('originalUpper') or not view.get('upper_motion'):
        raise ValueError('Own mouth-field capture requires the original-upper branch')
    calls_per_frame = 3 if view.get('rest_centres') or view.get('leg_sources') else 4
    original_motion = builder.motion
    runs = []

    def scalar(value):
        return value.item() if hasattr(value, 'item') else value

    def traced_motion(candidate, candidate_direction, *args, **kwargs):
        if candidate is not person or candidate_direction != direction:
            raise ValueError('Mouth-field capture crossed its own source/direction')
        original_warp = builder.paint.warp_layer
        calls = []

        def traced_warp(layer, nodes_y, dx, dy):
            warped = original_warp(layer, nodes_y, dx, dy)
            field = {'nodeCount': len(nodes_y)}
            if len(nodes_y) == 4:
                field.update(sourceRgbaSha256=hashlib.sha256(layer.tobytes()).hexdigest(),
                    sourceSize=list(layer.size), nodes_y=[scalar(v) for v in nodes_y],
                    dx=[scalar(v) for v in dx], dy=[scalar(v) for v in dy])
            calls.append(field)
            return warped

        builder.paint.warp_layer = traced_warp
        try:
            frames, records = original_motion(candidate, candidate_direction, *args, **kwargs)
        finally:
            builder.paint.warp_layer = original_warp
        count = len(frames)
        if not count or len(records) != count or len(calls) != calls_per_frame * count:
            raise ValueError('Own mouth-field capture warp count changed')
        upper = calls[-count:]
        if any(field['nodeCount'] != 4 or field.get('sourceSize') != [512, 512]
               for field in upper):
            raise ValueError('Own mouth-field capture lost the final original-upper warps')
        if len({field['sourceRgbaSha256'] for field in upper}) != 1:
            raise ValueError('Own original-upper source changed within a render')
        runs.append([{key: value for key, value in field.items() if key != 'nodeCount'}
                     for field in upper])
        return frames, records

    builder.motion = traced_motion
    try:
        rendered = render()
    finally:
        builder.motion = original_motion
    frames = rendered[0] if isinstance(rendered, tuple) else rendered
    frame_count = len(frames) if isinstance(frames, list) else 1
    fields = [field for run in runs for field in run]
    if len(runs) != expected_runs or frame_count != expected_frames or len(fields) != expected_frames:
        raise ValueError('Own mouth-field capture frame correspondence changed')
    if len({field['sourceRgbaSha256'] for field in fields}) != 1:
        raise ValueError('Own original-upper source changed between render calls')
    return rendered, fields


def build(output):
    output = Path(output).resolve()
    output.mkdir(parents=True,exist_ok=True)
    working = output/'working'
    working.mkdir(exist_ok=True)
    definition = importlib.util.spec_from_file_location('family',ROOT/'tools/build-street-speaker-family.py')
    family = importlib.util.module_from_spec(definition)
    definition.loader.exec_module(family)
    builder,cfg = family.configure(FOLDER/'motion-spec.json')
    person = cfg['characters'][ID]
    bindings = builder.source_bindings(person)
    driver_hash = sha(Path(__file__))
    frames,records,neutral = {},{},{}
    walks,bridges,neutrals = {},{},{}
    for row,direction in enumerate(builder.DIRECTIONS):
        (sequence,fields),upper = capture_upper_warps(builder,person,direction,
            lambda: builder.motion(person,direction),16)
        if len(sequence)!=16 or len({f.tobytes() for f in sequence})<12:
            raise ValueError('Insufficient distinct own gait samples: '+direction)
        walks[direction]=dict(row=row,frames=16,frame_ms=60,loop=True)
        for record,field in zip(fields,upper):record['actualUpperWarp']=field
        records[direction]=fields
        for col,frame in enumerate(sequence):
            frames[row,col]=frame
            frame.save(working/(direction+'-walk-'+str(col).zfill(2)+'.png'))
        neutral[direction],neutral_upper = capture_upper_warps(builder,person,direction,
            lambda: builder.neutral(person,direction),1)
        neutrals[direction]=dict(actualUpperWarp=neutral_upper[0])
        neutral[direction].save(working/(direction+'-neutral.png'))
        bridge,bridge_upper = capture_upper_warps(builder,person,direction,
            lambda: builder.bridge_frames(person,direction),5,expected_runs=5)
        if (bridge[2].tobytes()!=neutral[direction].tobytes()
                or bridge_upper[2]!=neutral_upper[0]):
            raise ValueError('Own bridge/neutral pixel or upper-field mismatch')
        for col,frame in enumerate(bridge):
            frames[row+4,col]=frame
            frame.save(working/(direction+'-bridge-'+str(col)+'.png'))
        bridges[direction]=dict(row=row+4,stop_cols=[0,1,2],start_cols=[3,4],frame_ms=70,
            records=[dict(col=col,actualUpperWarp=field) for col,field in enumerate(bridge_upper)])
        print('Walk source complete: '+direction,flush=True)
    for col,entry in enumerate(person['turn_sources']):
        if 'neutral' in entry:
            frame=neutral[entry['neutral']]
            neutrals[entry['neutral']].update(row=8,col=col)
        else:
            path=ROOT/entry['source']
            if sha(path)!=entry['sourceSha256']:raise ValueError('Changed own turn source')
            frame,_=builder.street.register_source(Image.open(path).convert('RGBA'),entry,entry['scale'],472)
        frames[8,col]=frame
        frame.save(working/('turn-'+str(col)+'.png'))
    if any('row' not in record for record in neutrals.values()):
        raise ValueError('Own neutral lacks a turn anchor')
    variants={}
    for name,cell,figure,pivot in [('desktop',[96,120],102,[48,112.5]),('mobile',[64,80],68,[32,75])]:
        spec=dict(cell=cell,figureHeight=figure,pivot=pivot,working=cfg['working'])
        w,h=cell
        atlas=Image.new('RGBA',(w*16,h*9))
        exported={}
        for position,frame in frames.items():
            exported[position]=builder.street.export_cell(frame,spec)
            atlas.paste(exported[position],(position[1]*w,position[0]*h))
        path=output/('walk-source-'+name+'.webp')
        atlas.save(path,lossless=True,exact=True,method=4)
        if Image.open(path).convert('RGBA').tobytes()!=atlas.tobytes():raise ValueError('Lossless pixels changed')
        gutters=[]
        for frame in exported.values():
            box=frame.getchannel('A').getbbox()
            gutters.append(min(box[0],box[1],w-box[2],h-box[3]))
        if min(gutters)<2:raise ValueError('Insufficient native transparent gutter')
        for row,direction in enumerate(builder.DIRECTIONS):
            exact=[exported[row,col] for col in range(16)]
            for theme,color in [('light','#eee8db'),('dark','#25272b')]:
                builder.street.opaque_board(exact,8,color,3 if name=='desktop' else 4).save(output/(direction+'-'+name+'-'+theme+'.png'))
            clip=[builder.street.opaque_board([f],1,'#eee8db',3 if name=='desktop' else 4) for f in exact]
            clip[0].save(output/(direction+'-'+name+'.gif'),save_all=True,append_images=clip[1:],duration=60,loop=0,disposal=2)
        turns=[exported[8,col] for col in range(8)]
        for theme,color in [('light','#eee8db'),('dark','#25272b')]:
            builder.street.opaque_board(turns,4,color,3 if name=='desktop' else 4).save(output/('turns-'+name+'-'+theme+'.png'))
        variants[name]=dict(file=path.name,sha256=sha(path),frame_size=cell,figureHeight=figure,
                            pivot=pivot,image_size=list(atlas.size),minimumGutter=min(gutters),
                            decodedBytes=atlas.width*atlas.height*4,directWorkingSampling=True)
    if bindings!=builder.source_bindings(person) or driver_hash!=sha(Path(__file__)):
        raise ValueError('Authored inputs changed during bake')
    result=dict(status='held full source candidate; encoded/ordered/native acceptance pending',
                id=ID,cell=cfg['cell'],pivot=cfg['pivot'],figureHeight=cfg['figureHeight'],figureWorldHeight=1.6,
                grid=[16,9],walks=walks,bridges=bridges,neutrals=neutrals,turns=dict(row=8,count=8),
                sourceBindings=bindings,driverSha256=driver_hash,fields=records,variants=variants,
                selectedCells=len(frames),limitations=['Cycle distance not yet calibrated on exact exported feet.',
                    'Dedicated phase stops, key gesture, moving mouths and runtime acceptance are separate pending stages.'])
    (output/'walk-source.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'status':result['status'],'selectedCells':len(frames),'variants':variants}),flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--outdir',type=Path,default=ROOT/'output/ambient-city-animation/heike-walk-source-v1')
    build(parser.parse_args().outdir)
