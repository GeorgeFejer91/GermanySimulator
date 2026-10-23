"""Bake all 64 phase-specific Heike settles with four original-paint stages."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
DIRECTIONS=("down","right","up","left")
STRENGTHS=(.8,.6,.4,.2)

def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path)
    value=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()

body=module("heike_adult_body_for_stops",HERE/"build-adult-body.py")

def build(outdir,walkdir):
    outdir.mkdir(parents=True,exist_ok=True)
    walkreceipt=json.loads((walkdir/"walk-turn-receipt.json").read_text(encoding="utf8"))
    if walkreceipt["sourceSha256"]!=sha(body.rig.SOURCE) or walkreceipt["geometrySha256"]!=sha(HERE/"geometry.json"):
        raise ValueError("Stops no longer match own adult body inputs")
    frames={};records=[]
    for direction_index,direction in enumerate(DIRECTIONS):
        if direction=="left":body.bind_left()
        for phase in range(16):
            for stage,strength in enumerate(STRENGTHS):
                if direction in ("down","up"):
                    frame=body.builder.family_settle_frame(body.person,direction,strength,phase*math.tau/16)
                else:
                    pose=body.pose_at(phase,strength,"left-" if direction=="left" else "")
                    frame,audit=body.profile_frame(pose,direction)
                slot=(direction_index*16+phase)*4+stage
                frames[slot]=frame
                records.append({"direction":direction,"phase":phase,"stage":stage,
                                "strength":strength,"source":"own mature cardinal family" if direction in ("down","up") else "own contact cloth+Oxford"})
        print("settled",direction,flush=True)
    if len(frames)!=256:raise ValueError("Missing own phase stop")
    variants={}
    for name,cell,figure,pivot in (("desktop",[96,120],102,[48,112.5]),
                                    ("mobile",[64,80],68,[32,75])):
        w,h=cell
        spec={"cell":cell,"figureHeight":figure,"pivot":pivot,
              "working":{"figureHeight":400,"baseline":472}}
        atlas=Image.new("RGBA",(w*16,h*16))
        min_gutter=999
        for slot,frame in frames.items():
            native=body.street.export_cell(frame,spec)
            alpha=np.asarray(native)[:,:,3]
            yy,xx=np.nonzero(alpha>=21)
            if len(xx)==0:raise ValueError(f"Empty stop {slot}")
            bounds=[int(xx.min()),int(yy.min()),int(xx.max())+1,int(yy.max())+1]
            gutter=min(bounds[0],bounds[1],w-bounds[2],h-bounds[3])
            if gutter<2:raise ValueError(f"Clipped native stop {slot}: {bounds}")
            min_gutter=min(min_gutter,gutter)
            atlas.paste(native,((slot%16)*w,(slot//16)*h))
        path=outdir/("stops-"+name+".webp")
        atlas.save(path,lossless=True,exact=True,method=4)
        with Image.open(path) as decoded:
            if decoded.convert("RGBA").tobytes()!=atlas.tobytes():
                raise ValueError("Lossless stop pixels changed on decode")
        variants[name]={"file":path.name,"sha256":sha(path),"cell":cell,
                        "imageSize":list(atlas.size),"decodedBytes":atlas.width*atlas.height*4,
                        "minimumGutter":min_gutter}
        for direction_index,direction in enumerate(DIRECTIONS):
            poses=[]
            for phase in (0,4,8,12):
                for stage in range(4):
                    slot=(direction_index*16+phase)*4+stage
                    x,y=(slot%16)*w,(slot//16)*h
                    poses.append(atlas.crop((x,y,x+w,y+h)))
            for theme,color in (("light","#eee8db"),("dark","#25272b")):
                body.street.opaque_board(poses,8,color,4).save(outdir/f"{direction}-{name}-{theme}.png")
    receipt={"status":"adult 64-phase original-paint stops; native and runtime acceptance pending",
             "actorId":body.ID,"walkReceiptSha256":sha(walkdir/"walk-turn-receipt.json"),
             "driverSha256":sha(Path(__file__)),"phaseCount":64,"stagesPerPhase":4,
             "selectedCells":256,"strengths":STRENGTHS,"records":records,"variants":variants,
             "limits":["A final fifth planted neutral follows every four-frame settle in the runtime sequence.",
                       "Side source-rest and upright cardinal turn source need a separate continuity review."]}
    (outdir/"stops-receipt.json").write_text(json.dumps(receipt,indent=2)+"\n",encoding="utf8")
    print(json.dumps({"status":receipt["status"],"variants":variants}),flush=True)

if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--walkdir",type=Path,default=ROOT/"output/street-redesign/heike-end-to-end/adult-body-candidate")
    parser.add_argument("--outdir",type=Path,default=ROOT/"output/street-redesign/heike-end-to-end/adult-stop-candidate")
    args=parser.parse_args()
    build(args.outdir.resolve(),args.walkdir.resolve())
