"""Register own hidden far paint without shifting the painted trouser hem.

Visible original far paint is retained exactly. The matching own foreground
paint supplies only the missing underlay. Its trouser hem stays at its source
height, while the shoe compresses toward the original far sole eight pixels up.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[4]
FOLDER=Path(__file__).resolve().parent
OUT=FOLDER/'original-profile-layers-v4'
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()


def build():
    OUT.mkdir(exist_ok=True)
    method_path=ROOT/'.agents/skills/animate-2d-characters/scripts/painted_walk.py'
    sys.path.insert(0,str(method_path.parent))
    definition=importlib.util.spec_from_file_location('existing_painted_walk',method_path)
    paint=importlib.util.module_from_spec(definition);definition.loader.exec_module(paint)
    source=FOLDER/'registered-cardinals-v3-candidate.png'
    if sha(source)!='bfe0660b663a96ac545dfa3da55e37851b16a64a95cb60d9eff66855915badfc':
        raise ValueError('Changed original cardinal source')
    extraction_path=FOLDER/'original-profile-legs-v1/extraction.json'
    extraction=json.loads(extraction_path.read_text())
    sheet=Image.open(source).convert('RGBA');views={}
    for direction,x,shift in [('right',512,65),('left',1536,-65)]:
        near_entry=extraction['views'][direction]['layer'];near_path=ROOT/near_entry['file']
        if sha(near_path)!=near_entry['sha256']:raise ValueError('Changed own near-leg source')
        original=sheet.crop((x,0,x+512,512));expected=np.asarray(original)
        near=Image.open(near_path).convert('RGBA');near_alpha=np.asarray(near)[:,:,3]
        nodes=[0,380,434,472,511];dx=[shift]*5;dy=[0,0,0,-8,-8]
        hidden=np.asarray(paint.warp_layer(near,nodes,dx,dy)).copy();hidden[:380]=0
        # Preserve the original far outer contour; it also excludes translated
        # key-tip fragments. The inner edge remains a complete painted limb.
        for y in range(380,512):
            xs=np.flatnonzero(expected[y,:,3]>0)
            if not len(xs):hidden[y]=0;continue
            if direction=='left':hidden[y,:xs[0]]=0
            else:hidden[y,xs[-1]+1:]=0
        known=expected.copy();known[near_alpha>0]=0;known[:380]=0
        visible=known[:,:,3]>0;hidden[visible]=known[visible]
        if not np.array_equal(hidden[visible],known[visible]):raise ValueError('Visible far paint changed')
        far=Image.fromarray(hidden);combined=far.copy();combined.alpha_composite(near)
        actual=np.asarray(combined);delta=actual[414:].astype(int)-expected[414:].astype(int)
        if not np.array_equal(actual[414:,:,3]>0,expected[414:,:,3]>0):
            raise ValueError('Neutral lower alpha support changed')
        path=OUT/(direction+'-far-original-with-hidden-underpaint.png');far.save(path)
        views[direction]=dict(near=near_entry,far=dict(file=path.relative_to(ROOT).as_posix(),sha256=sha(path)),
            hiddenUnderpaintField=dict(nodes_y=nodes,dx=dx,dy=dy),visibleFarOriginalPaintExact=True,
            neutralBelowRow414AlphaSupportExact=True,
            neutralBelowRow414MaxRGBDifference=int(np.abs(delta[:,:,:3]).max()),
            neutralBelowRow414MaxAlphaDifference=int(np.abs(delta[:,:,3]).max()))
    receipt=dict(status='sampled side seam method passed; complete encoded gait and runtime acceptance pending',
        original=dict(file=source.relative_to(ROOT).as_posix(),sha256=sha(source)),
        extractionReceiptSha256=sha(extraction_path),driverSha256=sha(Path(__file__)),
        method=dict(file=method_path.relative_to(ROOT).as_posix(),sha256=sha(method_path)),views=views,
        limitations=['Only original visible paint is exact; occluded anatomy uses the own registered near-leg paint.',
            'Translucent layer overlap retains small measured neutral differences.',
            'All gait phases, stops, mouths, encoded and runtime checks remain required.'])
    (OUT/'source-layers.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps(receipt),flush=True)


if __name__=='__main__':build()
