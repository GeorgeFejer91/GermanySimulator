"""Fit Heike's visible adult lips to each delivered native body cell.

Source anchors were inspected on the actual front, profile and quarter
paintings. Head-patch registration transports those anchors through each
selected source-pixel walk, stop and action cell; rear views remain null.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
ID="quiz-heike-hoffmann"
DIRS=("down","right","up","left")
VISIBLE=("down","right","left","front-right","front-left","standing")
WORKING_ANCHORS={"down":(258,128),"right":(284,126),"left":(230,126),
                 "front-right":(258,127),"front-left":(237,129),"standing":(254,125)}
TANGENTS={"down":(6.6,0.0),"right":(3.6,.20),"left":(3.6,-.20),
          "front-right":(5.0,.15),"front-left":(5.0,-.15),"standing":(6.4,0.0)}
PROFILE={"crease":[0,-.04,-.06,-.02,0],
         "open_upper":[0,-.12,-.16,-.10,0],
         "open_lower":[0,.15,.20,.16,0],
         "source_upper":[0,-.04,-.06,-.02,0],
         "source_lower":[0,-.04,-.06,-.02,0],
         "corners":[-.5,.5],"width":[0,0],"teeth":0}


def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def read(path):return json.loads(Path(path).read_text(encoding="utf8"))
def write(path,obj):Path(path).write_bytes((json.dumps(obj,separators=(",",":"))+"\n").encode("utf8"))


def logical(point):
    return (64+(point[0]-256)*136/400,150+(point[1]-472)*136/400)


def registration(kind,dx=0,dy=0):
    x,y=logical(WORKING_ANCHORS[kind]);x+=dx;y+=dy
    tx,ty=TANGENTS[kind]
    return {"rect":[x/128,1-y/160,math.hypot(tx,ty)/128,3.4/160],
            "axes":[tx,ty,0,3.4],"profile":PROFILE}


def extract(atlas,row,col,w=96,h=120):
    return atlas.crop((col*w,row*h,(col+1)*w,(row+1)*h))


def patch_shift(reference,target,anchor):
    """Find only head translation; no automatic anatomical detection."""
    x,y=anchor
    x,y=int(round(x*.75)),int(round(y*.75))
    ref=np.asarray(reference.convert("RGBA"))
    dst=np.asarray(target.convert("RGBA"))
    # Lip-centred face patch includes source-specific cheek/nose/eyeglasses.
    radius_x,radius_y=8,8
    template=ref[y-radius_y:y+radius_y+1,x-radius_x:x+radius_x+1]
    sweep=6
    search=dst[y-radius_y-sweep:y+radius_y+sweep+1,
               x-radius_x-sweep:x+radius_x+sweep+1]
    if template.shape!=(17,17,4) or search.shape!=(29,29,4):
        raise ValueError("Heike lip patch is outside native cell")
    # Premultiplied RGB plus alpha, so transparent padding contributes no
    # hidden RGB to the score. This does not relocate the inspected lip cue.
    def signal(a):
        alpha=a[:,:,3:4].astype(np.float32)/255
        return np.concatenate((a[:,:,:3].astype(np.float32)*alpha,a[:,:,3:4].astype(np.float32)),axis=2)
    score=cv2.matchTemplate(signal(search),signal(template),cv2.TM_SQDIFF_NORMED)
    minimum,_,location,_=cv2.minMaxLoc(score)
    shift=(location[0]-sweep,location[1]-sweep)
    if minimum>.28 or max(abs(shift[0]),abs(shift[1]))>=sweep:
        raise ValueError(f"Heike {reference.size} lip-bearing head registration uncertain: score={minimum:.4f}, shift={shift}")
    return shift,float(minimum)


def build(output,assembly):
    output=Path(output);assembly=Path(assembly);output.mkdir(parents=True,exist_ok=True)
    person=read(assembly/"person-before-mouth.json")
    receipt=read(assembly/"assembly-receipt.json")
    native_path=assembly/"source-desktop.webp"
    atlas=Image.open(native_path).convert("RGBA")
    assert atlas.size==(21*96,18*120)
    # The adult front, right, left and quarter source lip centres were viewed
    # at native and 5x source detail before fixing the measurements above.
    ref_slots={"down":(0,0),"right":(1,0),"left":(3,0),
               "front-right":(8,1),"front-left":(8,7),"standing":(13,0)}
    references={name:extract(atlas,*pos) for name,pos in ref_slots.items()}
    refs={name:registration(name) for name in VISIBLE}
    frames=[None]*(21*18)
    scores=[]
    def set_cell(row,col,kind):
        if kind is None:return
        target=extract(atlas,row,col)
        base=refs[kind]
        anchor=(base["rect"][0]*128,(1-base["rect"][1])*160)
        shift,score=patch_shift(references[kind],target,anchor)
        result=registration(kind,shift[0]*4/3,shift[1]*4/3)
        frames[row*21+col]=result
        scores.append({"row":row,"col":col,"view":kind,"nativeShift":shift,"score":score})
    for direction_index,direction in enumerate(DIRS):
        for col in range(16):set_cell(direction_index,col,None if direction=="up" else direction)
        for col in range(5):set_cell(direction_index+4,col,None if direction=="up" else direction)
    views=("down","front-right","right",None,None,None,"left","front-left")
    for col,kind in enumerate(views):set_cell(8,col,kind)
    for col in range(16):set_cell(13,col,"standing")
    slots=receipt["stopSlots"]
    assert len(slots)==256
    for index,(row,col) in enumerate(slots):
        direction=DIRS[index//64]
        set_cell(row,col,None if direction=="up" else direction)
    if sum(entry is not None for entry in frames)!=276:
        raise ValueError("Heike visible mouth count differs from existing selected contract")
    standing=registration("standing")
    result={"schemaVersion":1,"id":ID,"cell":[128,160],"grid":[21,18],
            "sources":{"standing":receipt["standing"]["sha256"],
                       "desktop":receipt["variants"]["desktop"]["sha256"],
                       "mobile":receipt["variants"]["mobile"]["sha256"]},
            "standing":standing,"frames":frames}
    validator_spec=importlib.util.spec_from_file_location("heike_mouth_validator",ROOT/"tools/build-street-mouths.py")
    validator=importlib.util.module_from_spec(validator_spec)
    sys.modules[validator_spec.name]=validator
    validator_spec.loader.exec_module(validator)
    validator.validate(PROFILE)
    for entry in frames:
        if entry is not None:validator.validate(entry["profile"])
    write(output/"mouths-v1.json",result)
    diagnostic={"status":"own painted adult lips; CPU fit complete, shader/runtime review pending",
                "actorId":ID,"sourceSha256":sha(native_path),
                "sourceLipAnchorsWorking":WORKING_ANCHORS,"visibleFrames":276,"nullFrames":102,
                "maxTemplateScore":max(item["score"] for item in scores),"fits":scores,
                "mouthFileSha256":sha(output/"mouths-v1.json")}
    write(output/"mouth-fit-receipt.json",diagnostic)
    # Preview open mouth on actual source body cells, with the project's own
    # CPU replica of the shader and no new painting.
    for kind,(row,col) in ref_slots.items():
        cell=extract(atlas,row,col)
        file=output/f"preview-{kind}-source.png";cell.save(file)
        fit=frames[row*21+col]
        assert fit is not None
        cx,cy=fit["rect"][0]*128,(1-fit["rect"][1])*160
        entry={"input":{"file":file.relative_to(ROOT).as_posix()},
               "centerPx":[cx*.75,cy*.75],
               "axesPx":[value*.75 for value in fit["axes"]]}
        opened=validator.preview(entry,fit,1)
        opened.save(output/f"preview-{kind}-open.png")
        for theme,color in (("light","#eee8db"),("dark","#25272b")):
            validator_module=importlib.util.spec_from_file_location("heike_street",ROOT/"tools/build-street-character-sprites.py")
            street=importlib.util.module_from_spec(validator_module);sys.modules[validator_module.name]=street
            validator_module.loader.exec_module(street)
            street.opaque_board([cell,opened],2,color,5).save(output/f"preview-{kind}-{theme}.png")
    return diagnostic


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,default=ROOT/"output/street-redesign/heike-end-to-end/adult-mouth-candidate")
    parser.add_argument("--assembly",type=Path,default=ROOT/"output/street-redesign/heike-end-to-end/adult-assembly-candidate")
    args=parser.parse_args()
    result=build(args.output,args.assembly)
    print(json.dumps({key:result[key] for key in ("visibleFrames","nullFrames","maxTemplateScore","mouthFileSha256")},indent=2))
