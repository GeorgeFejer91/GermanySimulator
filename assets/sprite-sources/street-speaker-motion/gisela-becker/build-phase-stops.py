"""Bake own painted stop poses through the existing complete-limb exporter.

The loaded ankle keeps its source displacement until the other foot lands.
Only the airborne foot changes horizontal placement. No runtime rig is added.
"""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import math

from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
FOLDER = Path(__file__).resolve().parent
ID = 'quiz-gisela-becker'
STRENGTHS = [.8,.6,.4,.2]


def stop_fields(source, target, swing, stage):
    fields = []
    for side in range(2):
        blend = (stage+1)/5
        field = {axis:[a+(b-a)*blend for a,b in zip(source[side][axis],target[side][axis])]
                 for axis in ['dx','dy']}
        sx,sy = source[side]['dx'][-1],source[side]['dy'][-1]
        tx,ty = target[side]['dx'][-1],target[side]['dy'][-1]
        if side == swing:
            foot = (tx,min(sy,ty)-9) if stage == 0 else (tx,ty)
        else:
            foot = (sx,sy) if stage < 2 else (sx if stage == 2 else tx,min(sy,ty)-9)
        # Carry the ankle correction through the covered calf/knee. Moving
        # only the terminal nodes would crush the short painted shin.
        nodes=source[side]['nodes_y']
        weights=[max(0,min(1,(y-nodes[1])/(nodes[-2]-nodes[1]))) for y in nodes]
        for axis,value in zip(['dx','dy'],foot):
            correction=value-field[axis][-1]
            field[axis]=[v+correction*w for v,w in zip(field[axis],weights)]
            if axis=='dy':
                waist=field[axis][1]
                for i in range(2,5):field[axis][i]=waist+(value-waist)*weights[i]
            field[axis][-2:]=[value]*2
        fields.append(field)
    return fields


def build(output):
    output.mkdir(parents=True,exist_ok=True)
    spec = importlib.util.spec_from_file_location('family',ROOT/'tools/build-street-speaker-family.py')
    family = importlib.util.module_from_spec(spec);spec.loader.exec_module(family)
    builder,cfg = family.configure(FOLDER/'motion-spec.json')
    person = cfg['characters'][ID]
    bindings=builder.source_bindings(person)
    driver_sha=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    originals = {name:Image.open(ROOT/f'assets/characters/street-speakers/{ID}/character-{name}.webp').convert('RGBA')
                 for name in ['desktop','mobile']}
    sheets = {name:Image.new('RGBA',(w*16,h*16)) for name,(w,h) in [('desktop',(128,160)),('mobile',(64,80))]}
    records = []
    for row,direction in enumerate(builder.DIRECTIONS):
        # Default authoring must still reproduce all accepted gait cells.
        walks,walk_records = builder.motion(person,direction)
        neutral,neutral_records = builder.motion(person,direction,count=4,strength=0,phases=[0])
        for name,compact in [('desktop',False),('mobile',True)]:
            cell=builder.street.export_cell(neutral[0],cfg,compact=compact);w,h=cell.size
            assert cell.tobytes()==originals[name].crop((2*w,(row+4)*h,3*w,(row+5)*h)).tobytes(),(name,direction,'neutral changed')
        for phase,walk in enumerate(walks):
            for name,compact in [('desktop',False),('mobile',True)]:
                cell = builder.street.export_cell(walk,cfg,compact=compact);w,h=cell.size
                assert cell.tobytes() == originals[name].crop((phase*w,row*h,(phase+1)*w,(row+1)*h)).tobytes(),(name,direction,phase,'default gait changed')
        direction_records=[]
        target=neutral_records[0]['limb_displacement']
        for phase in range(16):
            direction_records.append(dict(direction=direction,phase=phase,swing=0 if math.cos(phase*math.tau/16)>=0 else 1,
                                          source=walk_records[phase]['limb_displacement'],target=target,frames=[]))
        for stage,strength in enumerate(STRENGTHS):
            fields=[stop_fields(r['source'],target,r['swing'],stage) for r in direction_records]
            calls=0
            def limb_pose(side,nodes,dx,dy):
                nonlocal calls
                phase=calls//2;calls+=1
                assert nodes == direction_records[phase]['source'][side]['nodes_y']
                return fields[phase][side]['dx'],fields[phase][side]['dy']
            frames,trace=builder.motion(person,direction,strength=strength,limb_pose=limb_pose)
            assert calls==32
            for phase,frame in enumerate(frames):
                slot = (row*16+phase)*4+stage
                for name,compact in [('desktop',False),('mobile',True)]:
                    cell = builder.street.export_cell(frame,cfg,compact=compact);w,h=cell.size
                    sheets[name].alpha_composite(cell,((slot%16)*w,(slot//16)*h))
                direction_records[phase]['frames'].append(dict(stage=stage,upperStrength=strength,limbs=trace[phase]['limb_displacement']))
            print(f'{direction}/stage{stage}',flush=True)
        records.extend(direction_records)
    hashes = {}
    for name,sheet in sheets.items():
        path=output/f'stops-{name}.webp';sheet.save(path,format='WEBP',lossless=True,method=4,exact=True)
        assert Image.open(path).convert('RGBA').tobytes()==sheet.tobytes()
        hashes[path.name]=hashlib.sha256(path.read_bytes()).hexdigest()
    assert bindings==builder.source_bindings(person)
    assert driver_sha==hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'Authoring recipe changed during bake'
    (output/'stop-fields.json').write_text(json.dumps(dict(status='source candidate; visual acceptance pending',
        sourceBindings=bindings,driverSha256=driver_sha,defaultPixelChecks=dict(walkCells=128,neutralCells=8),
        records=records,outputs=hashes),indent=2)+'\n')
    return hashes


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--outdir',type=Path,default=ROOT/'output/ambient-city-animation/gisela-phase-stops-v1')
    print(json.dumps(build(parser.parse_args().outdir)))
