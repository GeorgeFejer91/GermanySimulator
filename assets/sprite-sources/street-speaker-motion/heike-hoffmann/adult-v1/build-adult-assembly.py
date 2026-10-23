"""Assemble Heike's adult native cells in her existing 21x18 slot contract.

This first writes a candidate. Runtime selection is a separate reviewed step.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from copy import deepcopy
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
ID = "quiz-heike-hoffmann"
COLS, ROWS = 21, 18
DIRECTIONS = ("down", "right", "up", "left")


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text(encoding="utf8"))


def write(path, data):
    Path(path).write_text(json.dumps(data, indent=2) + "\n", encoding="utf8")


def slots():
    reserved = {(row, col) for row in range(4) for col in range(16)}
    reserved |= {(row, col) for row in range(4, 8) for col in range(5)}
    reserved |= {(8, col) for col in range(8)}
    reserved |= {(13, col) for col in range(16)}
    available = ((row, col) for row in range(ROWS) for col in range(COLS)
                 if (row, col) not in reserved)
    stops = [next(available) for _ in range(256)]
    return reserved, stops


def crop(atlas, col, row, size):
    w, h = size
    return atlas.crop((col*w, row*h, (col+1)*w, (row+1)*h))


def build(output, walk, stop, action):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    walk, stop, action = map(Path, (walk, stop, action))
    receipts = [read(walk/"walk-turn-receipt.json"), read(stop/"stops-receipt.json"),
                read(action/"action-receipt.json")]
    wrec, srec, arec = receipts
    if srec["walkReceiptSha256"] != sha(walk/"walk-turn-receipt.json"):
        raise ValueError("Heike adult stops belong to another walk source")
    if wrec["sourceSha256"] != "9427d72732bee2d87b0d8fffc6255145e76603f177e7d997e04a398f92cfd229":
        raise ValueError("Heike complete-leg contact source changed")
    if arec["sourceSha256"] != "682e78a98dec314584811756a97c7862ef96b1e020fc08935c2ce7457c50c8d9":
        raise ValueError("Heike adult standing source changed")
    if srec["selectedCells"] != 256 or arec["distinctWorking"] < 14:
        raise ValueError("Heike adult stop/action coverage changed")
    baseline = HERE/"person-baseline.json"
    if sha(baseline) != "5779236c20e8dc33ec9b80e84433c8f7cc3e3767f79195f270e52cec131c10de":
        raise ValueError("Heike immutable person baseline changed")
    old = read(baseline)
    if old["id"] != ID:
        raise ValueError("Heike baseline identity changed")
    if old["grid"] != [21,18] or old["cell"] != [128,160] or old["pivot"] != [64,150]:
        raise ValueError("Heike's existing logical slot contract changed")
    reserved, stop_slots = slots()
    variants = {}
    for name, native in (("desktop", [96,120]), ("mobile", [64,80])):
        width, height = native
        sources = [Image.open(path).convert("RGBA") for path in (
            walk/f"walk-turn-{name}.webp", stop/f"stops-{name}.webp",
            action/f"action-{name}.webp")]
        movement, stops, gesture = sources
        assert movement.size == (width*16,height*9)
        assert stops.size == (width*16,height*16)
        assert gesture.size == (width*16,height)
        atlas = Image.new("RGBA", (width*COLS,height*ROWS))
        cells = {}
        for row,col in sorted(reserved):
            cells[row,col] = crop(gesture if row==13 else movement, col, 0 if row==13 else row, native)
        for index, position in enumerate(stop_slots):
            cells[position] = crop(stops, index%16, index//16, native)
        gutters = []
        for (row,col), picture in cells.items():
            box = picture.getchannel("A").getbbox()
            if box is None:
                raise ValueError(f"Empty Heike adult cell {row},{col}")
            gutters.append(min(box[0],box[1],width-box[2],height-box[3]))
            atlas.paste(picture,(col*width,row*height))
        if min(gutters)<2:
            raise ValueError("Heike adult atlas has inadequate transparent gutters")
        path = output/f"source-{name}.webp"
        atlas.save(path,lossless=True,exact=True,method=4)
        with Image.open(path) as encoded:
            if encoded.convert("RGBA").tobytes()!=atlas.tobytes():
                raise ValueError("Heike adult atlas changed on WebP decode")
        variants[name] = {"file":path.name,"sha256":sha(path),"width":atlas.width,
                          "height":atlas.height,"decodedBytes":atlas.width*atlas.height*4,
                          "minimumNativeGutter":min(gutters)}
    # Standing fallback is the same mature adult front source as the action
    # endpoints, exported at the game's original logical 128x160 size.
    import importlib.util, sys
    module = importlib.util.spec_from_file_location("heike_adult_action", HERE/"build-adult-action.py")
    action_builder = importlib.util.module_from_spec(module)
    sys.modules[module.name] = action_builder
    module.loader.exec_module(action_builder)
    standing = action_builder.frames()[0][0]
    logical = {"cell":[128,160],"figureHeight":136,"pivot":[64,150],
               "working":{"figureHeight":400,"baseline":472}}
    picture = action_builder.street.export_cell(standing,logical)
    standing_path = output/"standing.webp"
    picture.save(standing_path,lossless=True,exact=True,method=4)
    with Image.open(standing_path) as encoded:
        if encoded.convert("RGBA").tobytes()!=picture.tobytes():
            raise ValueError("Heike standing changed on decode")
    person = deepcopy(old)
    person["figureWorldHeight"] = 2.33
    person["strideDistance"] = 29.125  # measured 100 working-pixel planted travel / 400*2.33/.02
    person["standing"] = {"file":"./assets/characters/street/quiz-heike-hoffmann-standing.webp",
                          "sha256":sha(standing_path),"width":128,"height":160}
    base = "./assets/characters/street-speakers/quiz-heike-hoffmann/delivery-v1/"
    person["variants"] = {name:{"file":base+entry["file"],
                                  "sha256":entry["sha256"],"width":entry["width"],"height":entry["height"]}
                          for name,entry in variants.items()}
    # Existing seven reaction names, turn plans, and 64 settle paths are
    # retained. Only settle cell positions are rebound to the new exact pack.
    for direction_index,direction in enumerate(DIRECTIONS):
        for phase in range(16):
            selected = stop_slots[(direction_index*16+phase)*4:(direction_index*16+phase+1)*4]
            frames = [{"row":row,"col":col,"ms":70} for row,col in selected]
            frames.append({"row":direction_index+4,"col":2,"ms":70})
            person["atlasMotion"]["settles"][direction][str(phase)] = {"frames":frames}
    # The baseline's old mouth and delivery hashes are superseded by the
    # actor-specific mouth fitter and existing delivery packer during install.
    person.pop("mouthPaint",None)
    person.pop("motionDelivery",None)
    write(output/"person-before-mouth.json",person)
    receipt = {"status":"adult exact native atlas candidate; mouths/runtime pending",
               "actorId":ID,"sourceInputs":{
                   str(walk/"walk-turn-receipt.json"):sha(walk/"walk-turn-receipt.json"),
                   str(stop/"stops-receipt.json"):sha(stop/"stops-receipt.json"),
                   str(action/"action-receipt.json"):sha(action/"action-receipt.json")},
               "bodyCells":92,"stopCells":256,"actionCells":16,"logicalCells":378,
               "standing":{"sha256":sha(standing_path),"size":[128,160]},"variants":variants,
               "stopSlots":stop_slots,"strideDistance":29.125,
               "strideDerivation":"100 working-pixel planted travel / 400 * 2.33 world height / .02 world per game unit"}
    write(output/"assembly-receipt.json",receipt)
    return receipt


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,default=ROOT/"output/street-redesign/heike-end-to-end/adult-assembly-candidate")
    parser.add_argument("--walk",type=Path,default=ROOT/"output/street-redesign/heike-end-to-end/adult-body-candidate")
    parser.add_argument("--stop",type=Path,default=ROOT/"output/street-redesign/heike-end-to-end/adult-stop-candidate")
    parser.add_argument("--action",type=Path,default=ROOT/"output/street-redesign/heike-end-to-end/adult-action-candidate")
    args=parser.parse_args()
    print(json.dumps(build(args.output,args.walk,args.stop,args.action)["variants"],indent=2))
