"""Build Renate's held own-source 4x16 walk, bridges and painted turns."""
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import label

ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/ambient-city-animation/renate-termin-walk-source-v1'
ORDER=('down','right','up','left')
COLORS={'light':'#eee8db','dark':'#25272b'}

def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

fields=load('renate_walk_fields',HERE/'source_fields.py')
street=load('renate_street_export',ROOT/'tools/build-street-character-sprites.py')

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def board(images,path,columns,theme,scale=1):
    w,h=images[0].size
    result=Image.new('RGBA',(w*columns,h*((len(images)+columns-1)//columns)),COLORS[theme])
    for i,image in enumerate(images):result.alpha_composite(image,((i%columns)*w,(i//columns)*h))
    if scale!=1:result=result.resize((result.width*scale,result.height*scale),Image.Resampling.NEAREST)
    result.convert('RGB').save(path)

def connected(image):
    a=np.asarray(image)
    groups,_=label(a[:,:,3]>=128)
    large=sum(n>=100 for n in np.bincount(groups.ravel())[1:])
    return large==1 and bool(np.all(a[a[:,:,3]==0,:3]==0))

def export(image,cell,paint_height,pivot):
    return street.export_cell(image,{'working':{'figureHeight':400,'baseline':472},
        'cell':cell,'pivot':pivot,'figureHeight':paint_height})

def run():
    OUT.mkdir(parents=True,exist_ok=True)
    work=OUT/'working'; work.mkdir(exist_ok=True)
    physical=OUT/'physical';physical.mkdir(exist_ok=True)
    engine=fields.RenateFields()
    inputs={}
    for path in [HERE/'source_fields.py',Path(__file__),fields.FAMILY/'side-gait-fit-v4.json',
                 fields.FAMILY/'probe-side-gait-v4.py',fields.FAMILY/'source-fit-v1.json',
                 fields.FAMILY/'front-rear-fit-v1.json',fields.FAMILY/'probe-front-rear-v1.py',
                 ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py',
                 ROOT/'tools/build-street-character-sprites.py',
                 ROOT/'output/ambient-city-animation/renate-termin-side-gait-v4/pilot-source.json',
                 ROOT/'output/ambient-city-animation/renate-termin-source-review-v1/side-gait-v4-review/REPORT.md',
                 ROOT/'output/ambient-city-animation/renate-termin-front-rear-gate-v1/receipt.json']:
        inputs[path.relative_to(ROOT).as_posix()]=sha(path)
    old=json.loads((ROOT/'output/ambient-city-animation/renate-termin-side-gait-v4/pilot-source.json').read_text(encoding='utf8'))
    if old['status']!='candidate-four-side-extremes-only':raise ValueError('Side authority changed')
    sequence={};meta={};working_hashes={};physical_hashes={}
    for direction in ORDER:
        frames=[];records=[]
        for phase in range(16):
            frame,record=engine.frame(direction,phase)
            if not connected(frame):raise ValueError(f'Detached or hidden-RGB source {direction}/{phase}')
            path=work/f'{direction}-walk-{phase:02}.png';frame.save(path)
            frames.append(frame);records.append(record)
            working_hashes[path.relative_to(OUT).as_posix()]=sha(path)
            if direction in ('right','left') and phase in (4,12):
                prior=ROOT/f'output/ambient-city-animation/renate-termin-side-gait-v4/{direction}-phase-{phase:02}.png'
                if frame.tobytes()!=Image.open(prior).convert('RGBA').tobytes():
                    raise ValueError('Approved side anchor changed')
        if len({frame.tobytes() for frame in frames})!=16:raise ValueError('Repeated walk pose')
        # Bridge is walk15 -> attenuated walk15 -> exact registered neutral ->
        # attenuated walk0 -> exact walk0. No neutral art is rebuilt here.
        before,br=engine.frame(direction,15,.5),engine.frame(direction,0,.5)
        bridge=[frames[15],before[0],engine.sources[direction],br[0],frames[0]]
        bridge_records=[records[15],before[1],{'upper':fields.identity_upper(),'neutralExact':True},br[1],records[0]]
        for i,(frame,record) in enumerate(zip(bridge,bridge_records)):
            if not connected(frame):raise ValueError(f'Detached bridge {direction}/{i}')
            path=work/f'{direction}-bridge-{i}.png';frame.save(path)
            working_hashes[path.relative_to(OUT).as_posix()]=sha(path)
        for theme in COLORS:
            board(frames,OUT/f'{direction}-working-{theme}.png',8,theme)
            board(bridge,OUT/f'{direction}-bridge-working-{theme}.png',5,theme)
        sequence[direction]={'walk':frames,'bridge':bridge}
        meta[direction]={'walkFields':records,'bridgeFields':bridge_records,
            'walkSha256':[working_hashes[f'working/{direction}-walk-{p:02}.png'] for p in range(16)],
            'bridgeSha256':[working_hashes[f'working/{direction}-bridge-{p}.png'] for p in range(5)],
            'sourceNeutralRgbaSha256':hashlib.sha256(engine.sources[direction].tobytes()).hexdigest()}
        print(f'Renate source {direction} 16 walk + 5 bridge',flush=True)
    turns=[]
    for direction in ('down','front-right','right','rear-right','up','rear-left','left','front-left'):
        if direction in engine.sources:frame=engine.sources[direction]
        else:
            path=ROOT/f'output/ambient-city-animation/renate-termin-source-gate-v1/{direction}-registered.png'
            frame=Image.open(path).convert('RGBA')
            early=json.loads((ROOT/'output/ambient-city-animation/renate-termin-source-gate-v1/pilot-source.json').read_text(encoding='utf8'))
            if sha(path)!=early['output'][f'{direction}-registered.png']:raise ValueError('Own quarter source changed')
            inputs[path.relative_to(ROOT).as_posix()]=sha(path)
        if not connected(frame):raise ValueError('Invalid registered turn '+direction)
        path=work/f'turn-{len(turns)}-{direction}.png';frame.save(path)
        working_hashes[path.relative_to(OUT).as_posix()]=sha(path)
        turns.append({'heading':direction,'file':path.relative_to(OUT).as_posix(),'sha256':sha(path),'upper':fields.identity_upper()})
    for variant,cell,paint,pivot in [('desktop',[96,120],99,[48,112.5]),('mobile',[64,80],66,[32,75])]:
        for direction in ORDER:
            for section in ('walk','bridge'):
                exports=[]
                for col,frame in enumerate(sequence[direction][section]):
                    cell_image=export(frame,cell,paint,pivot)
                    if cell_image.getchannel('A').getbbox() is None:raise ValueError('Empty physical source')
                    name=f'{direction}-{section}-{col:02}-{variant}.png'
                    path=physical/name;cell_image.save(path)
                    physical_hashes[path.relative_to(OUT).as_posix()]=sha(path)
                    exports.append(cell_image)
                for theme in COLORS:
                    board(exports,OUT/f'{direction}-{section}-{variant}-{theme}.png',8 if section=='walk' else 5,theme,3 if variant=='desktop' else 4)
        turn_exports=[export(Image.open(OUT/item['file']).convert('RGBA'),cell,paint,pivot) for item in turns]
        for i,im in enumerate(turn_exports):
            path=physical/f'turn-{i}-{variant}.png';im.save(path)
            physical_hashes[path.relative_to(OUT).as_posix()]=sha(path)
        for theme in COLORS:board(turn_exports,OUT/f'turns-{variant}-{theme}.png',4,theme,3 if variant=='desktop' else 4)
    for theme in COLORS:board([Image.open(OUT/item['file']).convert('RGBA') for item in turns],OUT/f'turns-working-{theme}.png',4,theme)
    if any(sha(ROOT/path)!=digest for path,digest in inputs.items()):raise ValueError('Renate pinned source changed during run')
    receipt={'status':'held Renate full 4x16 source walk and bridge; independent review pending',
        'identity':'stadt-renate-termin','actor':'city-renate-termin',
        'geometry':{'working':[512,512],'sourceFigureHeight':400,'sourceBaselineY':472,
            'standingCell':[128,160],'standingPivot':[64,150],'logicalFigureHeight':136,'figureWorldHeight':1.6,
            'directPhysical':[{'name':'desktop','cell':[96,120],'paintFigureHeight':99,'nominalPhysicalFigureHeight':102,'pivot':[48,112.5]},
                              {'name':'mobile','cell':[64,80],'paintFigureHeight':66,'nominalPhysicalFigureHeight':68,'pivot':[32,75]}]},
        'upperFieldSchema':{'nodes_y':'actual PCHIP source Y knots','dx':'forward source-X offset per knot',
                            'dy':'forward source-Y offset per knot','sourceSize':[512,512]},
        'directions':meta,'turns':turns,'inputHashes':inputs,
        'workingHashes':working_hashes,'physicalHashes':physical_hashes,
        'sourceCells':92,'limitations':['No atlas/runtime admission','Full16/bridge source visuals require independent review',
            'Physical stride, floor, mouth, device are unaccepted']}
    out=OUT/'walk-source.json';out.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'receiptSha256':sha(out),'working':len(working_hashes),'physical':len(physical_hashes)}),flush=True)

if __name__=='__main__':run()
