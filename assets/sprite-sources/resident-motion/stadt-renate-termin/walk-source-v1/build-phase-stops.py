"""Renate 4x16x4 phase-owned source stop cells from frozen own walk fields."""
from __future__ import annotations

import hashlib
import importlib.util
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import label

ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/ambient-city-animation/renate-termin-walk-source-v1'
WALK=OUT/'walk-source.json'
STOP_METHOD=ROOT/'assets/sprite-sources/street-speaker-motion/gisela-becker/build-phase-stops.py'
ORDER=('down','right','up','left')
STRENGTHS=(.8,.6,.4,.2)
THEMES={'light':'#eee8db','dark':'#25272b'}

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module

fields=load('renate_frozen_walk_fields',HERE/'source_fields.py')
street=load('renate_stop_export',ROOT/'tools/build-street-character-sprites.py')

def stop_fields(source,target,swing,stage):
    """Land the swing shoe, then lift/relocate the named support shoe.

    The generic Gisela method is a provenance reference only: its first
    stage snapped Renate's separated swinging shoe the whole way home.
    This family-local sequence allocates two stages to each own complete
    boot. Root stays connected through the same source warp nodes.
    """
    plans=(((.45,7.0),(0.0,0.0)),((1.0,0.0),(0.0,0.0)),
           ((1.0,0.0),(.5,7.0)),((1.0,0.0),(1.0,0.0)))
    out=[]
    for side in range(2):
        progress,lift=plans[stage][0 if side==swing else 1]
        src=source[side];dst=target[side];nodes=src['nodes_y']
        if nodes!=dst['nodes_y']:raise ValueError('Renate stop source/neutral knots differ')
        weight=[max(0.0,min(1.0,(y-nodes[2])/(nodes[-2]-nodes[2]))) for y in nodes]
        dx=[a+(b-a)*progress for a,b in zip(src['dx'],dst['dx'])]
        dy=[a+(b-a)*progress-lift*w for a,b,w in zip(src['dy'],dst['dy'],weight)]
        out.append({'nodes_y':nodes,'dx':dx,'dy':dy,
            'progressToNeutral':progress,'unweightedShoeLiftWorkingPx':lift})
    return out

def board(images,path,columns,theme):
    w,h=images[0].size
    out=Image.new('RGBA',(columns*w,h*((len(images)+columns-1)//columns)),THEMES[theme])
    for i,image in enumerate(images):out.alpha_composite(image,((i%columns)*w,(i//columns)*h))
    out.convert('RGB').save(path)

def valid(image):
    rgba=np.asarray(image)
    groups,_=label(rgba[:,:,3]>=128)
    return (sum(n>=100 for n in np.bincount(groups.ravel())[1:])==1 and
            bool(np.all(rgba[rgba[:,:,3]==0,:3]==0)))

def main():
    walk=json.loads(WALK.read_text(encoding='utf8'))
    if walk['status']!='held Renate full 4x16 source walk and bridge; independent review pending':
        raise ValueError('Renate fullwalk frozen source status changed')
    for key,digest in walk['inputHashes'].items():
        if sha(ROOT/key)!=digest:raise ValueError('Renate source walk input changed: '+key)
    for key,digest in walk['workingHashes'].items():
        if sha(OUT/key)!=digest:raise ValueError('Renate working walk source changed: '+key)
    for key,digest in walk['physicalHashes'].items():
        if sha(OUT/key)!=digest:raise ValueError('Renate direct physical source changed: '+key)
    input_hashes={p.relative_to(ROOT).as_posix():sha(p) for p in
        [WALK,HERE/'source_fields.py',HERE/'build-walk-source.py',STOP_METHOD,Path(__file__),
         ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py',
         ROOT/'tools/build-street-character-sprites.py']}
    actor=fields.RenateFields()
    work=OUT/'stops-working';work.mkdir(exist_ok=True)
    physical=OUT/'stops-physical';physical.mkdir(exist_ok=True)
    records=[];files={};physical_files={}
    for direction in ORDER:
        walk_fields=walk['directions'][direction]['walkFields']
        for phase in range(16):
            source=walk_fields[phase]
            roles=('far','near') if direction in ('right','left') else (0,1)
            limb_sources=[source['limbs'][role] for role in roles]
            targets=[{'nodes_y':part['nodes_y'],'dx':[0.0]*len(part['dx']),'dy':[0.0]*len(part['dy'])}
                     for part in limb_sources]
            swing=0 if math.cos(math.tau*phase/16)>=0 else 1
            row={'direction':direction,'phase':phase,'swingRole':roles[swing],
                 'sourceWalkFile':f'working/{direction}-walk-{phase:02}.png',
                 'sourceWalkSha256':walk['workingHashes'][f'working/{direction}-walk-{phase:02}.png'],
                 'frames':[]}
            images=[]
            for stage,strength in enumerate(STRENGTHS):
                paired=stop_fields(limb_sources,targets,swing,stage)
                override={role:paired[i] for i,role in enumerate(roles)}
                frame,field=actor.frame(direction,phase,strength,limb_override=override)
                if not valid(frame):raise ValueError(f'Detached own stop {direction}/{phase}/{stage}')
                file=f'{direction}-phase-{phase:02}-stage-{stage}.png'
                path=work/file;frame.save(path);images.append(frame)
                rel=path.relative_to(OUT).as_posix();files[rel]=sha(path)
                sizes={}
                for variant,cell,paint,pivot in [('desktop',[96,120],99,[48,112.5]),('mobile',[64,80],66,[32,75])]:
                    export=street.export_cell(frame,{'working':{'figureHeight':400,'baseline':472},
                        'cell':cell,'figureHeight':paint,'pivot':pivot})
                    pname=f'{direction}-phase-{phase:02}-stage-{stage}-{variant}.png'
                    ppath=physical/pname;export.save(ppath)
                    physical_files[ppath.relative_to(OUT).as_posix()]=sha(ppath)
                    sizes[variant]={'file':ppath.relative_to(OUT).as_posix(),'sha256':sha(ppath),
                        'alphaBounds':export.getchannel('A').getbbox()}
                row['frames'].append({'stage':stage,'strength':strength,'file':rel,'sha256':sha(path),
                    'upper':field['upper'],'limbs':field['limbs'],'physical':sizes,
                    'bbox':frame.getbbox()})
            neutral=actor.sources[direction]
            for theme in THEMES:
                board([Image.open(OUT/row['sourceWalkFile']).convert('RGBA'),*images,neutral],
                    OUT/f'stop-{direction}-phase-{phase:02}-{theme}.png',6,theme)
            records.append(row)
        print('Renate source stops '+direction+' 16 phases x 4 stages',flush=True)
    for key,digest in input_hashes.items():
        if sha(ROOT/key)!=digest:raise ValueError('Renate stop input changed during build: '+key)
    if sha(WALK)!=input_hashes[WALK.relative_to(ROOT).as_posix()]:raise ValueError('Renate fullwalk receipt changed')
    receipt={'status':'held Renate 256 own-source phase stops; independent review pending',
        'walkReceiptSha256':sha(WALK),'inputHashes':input_hashes,
        'directions':list(ORDER),'phaseCount':16,'stagesPerPhase':4,'stopCount':len(records)*4,
        'stageStrengths':list(STRENGTHS),'sourceOrder':['walk','stop0','stop1','stop2','stop3','exactNeutral'],
        'records':records,'workingHashes':files,'physicalHashes':physical_files,
        'limitations':['Source-phase fields and exact neutral are held, not world contact or speed approval',
            'Staged/native temporal landing, sprite shader and runtime not observed']}
    path=OUT/'stop-source.json';path.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'stopReceiptSha256':sha(path),'sourceStops':len(files),'physicalStops':len(physical_files)}),flush=True)

if __name__=='__main__':main()
