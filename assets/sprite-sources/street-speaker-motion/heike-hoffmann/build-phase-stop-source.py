"""Reuse the existing planted-stop field method with Heike's own source rig."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import math

from PIL import Image

ROOT=Path(__file__).resolve().parents[4]
FOLDER=Path(__file__).resolve().parent
OUT=ROOT/'output/ambient-city-animation/heike-phase-stop-source-v1'
WALKS=ROOT/'output/ambient-city-animation/heike-walk-source-v1'
ID='quiz-heike-hoffmann'
STRENGTHS=[.8,.6,.4,.2]
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()


def load(name,path):
    definition=importlib.util.spec_from_file_location(name,path)
    module=importlib.util.module_from_spec(definition);definition.loader.exec_module(module)
    return module


def build():
    OUT.mkdir(parents=True,exist_ok=True)
    family=load('family',ROOT/'tools/build-street-speaker-family.py')
    builder,cfg=family.configure(FOLDER/'motion-spec.json')
    person=cfg['characters'][ID];bindings=builder.source_bindings(person)
    capture_upper_warps=load('heike_walk_upper_capture',FOLDER/'build-walk-source.py').capture_upper_warps
    # Code-only reuse: this pure field interpolation reads no Gisela source,
    # fit, body or mouth. All nodes/displacements below come from Heike.
    method_path=FOLDER.parent/'gisela-becker/build-phase-stops.py'
    method_hash=sha(method_path);stop_fields=load('existing_stop_fields',method_path).stop_fields
    walk_path=WALKS/'walk-source.json';walk_hash=sha(walk_path)
    source=json.loads(walk_path.read_text())
    if source['sourceBindings']!=bindings:raise ValueError('Heike source rig changed since walk bake')
    variants={name:dict(cell=record['frame_size'],figureHeight=record['figureHeight'],pivot=record['pivot'])
              for name,record in source['variants'].items()}
    originals={}
    sheets={name:Image.new('RGBA',(spec['cell'][0]*16,spec['cell'][1]*16)) for name,spec in variants.items()}
    for name,record in source['variants'].items():
        path=WALKS/record['file']
        if sha(path)!=record['sha256']:raise ValueError('Changed encoded Heike walks')
        originals[name]=Image.open(path).convert('RGBA')
    records=[]
    for row,direction in enumerate(builder.DIRECTIONS):
        (neutral,neutral_fields),neutral_upper=capture_upper_warps(builder,person,direction,
            lambda:builder.motion(person,direction,count=4,strength=0,phases=[0]),1)
        if neutral_upper[0]!=source['neutrals'][direction]['actualUpperWarp']:
            raise ValueError('Changed own neutral upper warp: '+direction)
        for name,spec in variants.items():
            w,h=spec['cell'];export=builder.street.export_cell(neutral[0],{**spec,'working':cfg['working']})
            if export.tobytes()!=originals[name].crop((2*w,(row+4)*h,3*w,(row+5)*h)).tobytes():
                raise ValueError('Changed encoded Heike neutral: '+direction+'/'+name)
        target=neutral_fields[0]['limb_displacement']
        directions=[]
        for phase,entry in enumerate(source['fields'][direction]):
            directions.append(dict(direction=direction,phase=phase,
                swing=0 if math.cos(phase*math.tau/16)>=0 else 1,
                source=entry['limb_displacement'],target=target,frames=[]))
        for stage,strength in enumerate(STRENGTHS):
            fields=[stop_fields(record['source'],target,record['swing'],stage) for record in directions]
            calls=0
            def limb_pose(side,nodes,dx,dy):
                nonlocal calls
                phase=calls//2;calls+=1
                if nodes!=directions[phase]['source'][side]['nodes_y']:raise ValueError('Changed own limb nodes')
                return fields[phase][side]['dx'],fields[phase][side]['dy']
            try:
                (frames,trace),upper=capture_upper_warps(builder,person,direction,
                    lambda:builder.motion(person,direction,strength=strength,limb_pose=limb_pose),16)
            except ValueError as error:
                if hasattr(error,'frame'):error.frame.save(OUT/(direction+'-stage'+str(stage)+'-FAIL.png'))
                (OUT/'failure.json').write_text(json.dumps(dict(direction=direction,stage=stage,
                    error=str(error),phase=getattr(error,'phase',None),sourceBindings=bindings),indent=2)+'\n')
                raise
            if calls!=32:raise ValueError('Actual stop exporter did not visit every owned phase')
            for phase,frame in enumerate(frames):
                slot=(row*16+phase)*4+stage
                for name,spec in variants.items():
                    w,h=spec['cell'];cell=builder.street.export_cell(frame,{**spec,'working':cfg['working']})
                    sheets[name].paste(cell,((slot%16)*w,(slot//16)*h))
                directions[phase]['frames'].append(dict(stage=stage,upperStrength=strength,
                    limbs=trace[phase]['limb_displacement'],actualUpperWarp=upper[phase]))
            print('Owned stops '+direction+'/stage'+str(stage),flush=True)
        records.extend(directions)
    outputs={}
    for name,sheet in sheets.items():
        path=OUT/('stops-'+name+'.webp');sheet.save(path,lossless=True,exact=True,method=4)
        if Image.open(path).convert('RGBA').tobytes()!=sheet.tobytes():raise ValueError('Encoded stop pixels changed')
        outputs[name]=dict(file=path.name,sha256=sha(path),image_size=list(sheet.size),**variants[name])
    if bindings!=builder.source_bindings(person) or sha(walk_path)!=walk_hash or sha(method_path)!=method_hash:
        raise ValueError('Bound authored input changed during stop bake')
    receipt=dict(status='held own-source stops; encoded/contact/native review pending',
        sourceBindings=bindings,driverSha256=sha(Path(__file__)),walkReceiptSha256=walk_hash,
        method=dict(file=method_path.relative_to(ROOT).as_posix(),sha256=method_hash,
                    scope='pure existing stop_fields function only; no other-character paint or fits'),
        variants=outputs,records=records,stopCount=256,
        limitations=['Loaded/swing field holds require actual encoded sole and native runtime checks.'])
    (OUT/'stop-source.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps({'status':receipt['status'],'stops':256,'variants':outputs}),flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--walk-source',type=Path,default=WALKS)
    parser.add_argument('--outdir',type=Path,default=OUT)
    args=parser.parse_args();WALKS=args.walk_source.resolve();OUT=args.outdir.resolve()
    build()
