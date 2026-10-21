"""Mark visible exported sole edges and fit Heike's distance per gait cycle.

The chosen desktop rows isolate the near sole and the outer visible far sole.
Review the generated marks before accepting the fit. This cannot establish
perspective-correct ground contact or perceived sliding in the running game.
"""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os

import numpy as np
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[4]
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()


def measure(walks,output):
    output.mkdir(parents=True,exist_ok=True)
    receipt_path=walks/'walk-source.json';receipt=json.loads(receipt_path.read_text())
    variant=receipt['variants']['desktop'];atlas_path=walks/variant['file']
    if sha(atlas_path)!=variant['sha256']:raise ValueError('Changed exported Heike gait')
    if variant['frame_size']!=[96,120] or variant['figureHeight']!=102:
        raise ValueError('Reinspect sole rows after changing physical export geometry')
    atlas=Image.open(atlas_path).convert('RGBA');assessments=[]
    method_path=ROOT/'.agents/skills/animate-2d-characters/scripts/assess_walk_speed.py'
    definition=importlib.util.spec_from_file_location('existing_speed_fit',method_path)
    method=importlib.util.module_from_spec(definition);definition.loader.exec_module(method)
    for direction,row,near_side in [('right',1,0),('left',3,1)]:
        contacts=[];marked=[];near_sole_spans=[]
        for side in [0,1]:
            near=side==near_side
            # One outer source sole remains visibly identifiable throughout
            # each selected planted interval. Unwrap a crossing interval.
            samples=[];start=4 if side==0 else 12;y=111 if near else 109
            for frame in range(start,start+9,2):
                col=frame%16
                cell=atlas.crop((col*96,row*120,(col+1)*96,(row+1)*120))
                xs=np.flatnonzero(np.asarray(cell)[y,:,3]>=128)
                if not len(xs):raise ValueError('Missing fitted sole row')
                if near:near_sole_spans.append(int(xs.max()-xs.min()+1))
                # Near shoe is the outer back side; far shoe the outer front.
                edge_min=(direction=='right' and near) or (direction=='left' and not near)
                x=int(xs.min() if edge_min else xs.max())
                samples.append(dict(frame=frame,sourceCellFrame=col,
                    along_pixels=x if direction=='right' else -x,pointPx=[x,y]))
                board=Image.new('RGBA',cell.size,'#eee8db');board.alpha_composite(cell)
                draw=ImageDraw.Draw(board);draw.ellipse((x-1,y-1,x+1,y+1),fill='#ff3050')
                draw.text((2,2),str(side)+':'+str(frame),fill='#222222');marked.append(board)
            contacts.append(dict(foot='side'+str(side),samples=samples))
        entry=dict(character='quiz-heike-hoffmann',view=direction,
            atlas_file=Path(os.path.relpath(atlas_path,output)).as_posix(),atlas_sha256=sha(atlas_path),
            frames_per_cycle=16,game_units_per_pixel=1.6/(102*.02),
            current_cycle_distance=9.6,shoe_length_pixels=max(near_sole_spans),
            shoeLengthMethod='measured near sole-band span at row111; review marked pixels',contacts=contacts)
        assessments.append(entry)
        board=Image.new('RGBA',(96*5,120*2),'#eee8db')
        for i,cell in enumerate(marked):board.alpha_composite(cell,((i%5)*96,(i//5)*120))
        board.resize((board.width*3,board.height*3),Image.Resampling.NEAREST).convert('RGB').save(output/(direction+'-marked-contact-edges.png'))
    data=dict(status='exported sole-marker diagnostic; visual marker and native sliding acceptance pending',
        method='Alpha128 outer edge on manually chosen visible sole rows; two feet, five samples each. Half-pixel edge uncertainty.',
        worldUnitsPerGameUnit=.02,markerUncertaintyPixels=.5,sourceReceiptSha256=sha(receipt_path),
        authoringDriverSha256=sha(Path(__file__)),fitMethodSha256=sha(method_path),assessments=assessments)
    path=output/'walk-contact-measurements.json';path.write_text(json.dumps(data,indent=2)+'\n')
    result=method.assess_file(path)
    (output/'walk-speed-fit.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result),flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--walk-source',type=Path,required=True)
    parser.add_argument('--outdir',type=Path,required=True)
    args=parser.parse_args();measure(args.walk_source.resolve(),args.outdir.resolve())
