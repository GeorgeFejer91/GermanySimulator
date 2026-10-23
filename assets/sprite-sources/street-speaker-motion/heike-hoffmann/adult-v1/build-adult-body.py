"""Build Heike's adult four-direction source-paint walk and planted turn cells.

The own profile cloth and whole Oxfords are sampled from their original source
pixels through the measured connected field. Front/rear use the project's
existing planted-walk builder. No runtime file is modified by this stage.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import io
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
BERLIN = ROOT / "assets/sprite-sources/berlin-street-20261022"
ID = "quiz-heike-hoffmann"
DIRECTIONS = ("down", "right", "up", "left")
SHA_CONTACT = "9427d72732bee2d87b0d8fffc6255145e76603f177e7d997e04a398f92cfd229"


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


rig = module("heike_adult_connected_source", HERE / "connected-source-rig.py")
support_math = module("heike_adult_shoe_support", HERE / "shoe-support.py")
family = module("heike_adult_family", ROOT / "tools/build-street-speaker-family.py")
builder, front_spec = family.configure(HERE / "front-rear-spec.json")
person = front_spec["characters"][ID]
street = rig.street
geometry = rig.geometry
scale = rig.scale
assert sha(rig.SOURCE) == SHA_CONTACT
assert scale == 400 / 975

MID = 450.
STEP_WORKING = 50.
LIFT_SOURCE = 20.
SOLE_BOTTOM_SOURCE = 992.
RESERVE_SOURCE = geometry["conventions"]["reachReserveSource"]
HEEL_UP_DEG = geometry["poses"]["opposite"]["legs"]["near"]["desiredSoleAxisDeg"]
SOURCE_AXIS = {owner: geometry["poses"]["neutral"]["legs"][owner]["sourceSoleAxisDeg"]
               for owner in ("far", "near")}
PIVOT = geometry["sourceBinding"]["estimatedAnklePivotsXY"]
assert abs(HEEL_UP_DEG - SOURCE_AXIS["far"]) < 1e-10


def smooth(value):
    t = max(0., min(1., value))
    return t * t * (3 - 2 * t)


def pitch_at(phase):
    p = phase % 1
    if p < .5:
        return HEEL_UP_DEG * smooth((p - .25) / .25)
    return HEEL_UP_DEG * (1 - smooth((p - .5) / .25))


def pose_at(index, strength, shoe_prefix=""):
    """One physical trajectory; strength only closes authored stride to rest."""
    if not 0 <= strength <= 1:
        raise ValueError("Strength outside source-bound stride")
    phase = index / 16
    state = rig.ik.walk_phase(phase)
    legs = {}
    for owner, side, rest_sign in (("near", "left", 1), ("far", "right", -1)):
        p = (phase + (0 if owner == "near" else .5)) % 1
        step = state[side]
        # The eight-working-pixel foot separation is the measured private rest
        # target. At strength1 this is exactly the frozen accepted right cycle.
        centre = MID + (strength * STEP_WORKING * step["forward"] +
                        (1 - strength) * rest_sign * 8) / scale
        sole = SOLE_BOTTOM_SOURCE - strength * LIFT_SOURCE * step["lift"]
        desired_pitch = strength * pitch_at(p)
        rotation = SOURCE_AXIS[owner] - desired_pitch
        support = support_math.rotated_support(HERE / (shoe_prefix + owner + "-shoe-source.png"),
                                               PIVOT[owner], rotation)
        ankle = [centre - support["horizontalBBoxCentreOffsetFromPivot"],
                 sole - support["bottomOffsetFromPivot"]]
        length = geometry["sourceBinding"]["legs"][owner]["totalSource"]
        dx = ankle[0] - MID
        if abs(dx) >= length - RESERVE_SOURCE:
            raise ValueError(f"{owner} ankle exceeds original source-bone reach")
        minimum_root = ankle[1] - math.sqrt((length - RESERVE_SOURCE)**2 - dx**2)
        legs[owner] = {"phaseOffset": p, "phaseState": step,
                       "authoredShoeCentreCheckpointX": centre,
                       "authoredTargetSoleBottomY": sole,
                       "authoredDesiredPitchDeg": desired_pitch,
                       "imageRotationDeg": rotation,
                       "shoeSupport": support,
                       "targetAnklePivotXY": ankle,
                       "minimumHipYWithTwoWorkingPixelReserve": minimum_root}
    root_y = max(leg["minimumHipYWithTwoWorkingPixelReserve"] for leg in legs.values())
    hip = [MID, root_y]
    for owner, leg in legs.items():
        source = geometry["sourceBinding"]["legs"][owner]
        result = rig.ik.solve_two_bone(hip, leg["targetAnklePivotXY"],
                                       source["upperSource"], source["lowerSource"], -1)
        if result["reach_error"] > 1e-7:
            raise ValueError(f"{owner} two-bone source length changed")
        leg["reconstructedTargetKneeXY"] = result["knee"]
    return {"index": index, "phase": phase, "strength": strength,
            "hipRootXY": hip, "legs": legs}


def bind_left():
    """Replace only source RGBA layers with Heike's own opposite profile."""
    canonical = Image.new("RGBA", Image.open(rig.SOURCE).size)
    raw = Image.open(rig.SOURCE).convert("RGBA")
    crop = raw.crop((817, 0, 1381, 1024)).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    canonical.paste(crop, (178, 0))
    parts = {name: Image.open(HERE / ("left-" + name + "-source.png")).convert("RGBA")
             for name in ("upper", "far-cloth", "near-cloth", "far-shoe", "near-shoe")}
    rgba = np.asarray(canonical)
    recomposed = np.zeros_like(rgba)
    total = 0
    for part in parts.values():
        pixels = np.asarray(part)
        occupied = pixels[:, :, 3] > 0
        if np.any(recomposed[:, :, 3][occupied]):
            raise ValueError("Left source part duplicated painted pixels")
        recomposed[occupied] = pixels[occupied]
        total += int(occupied.sum())
    original = rgba[:, :, 3] > 0
    if total != int(original.sum()) or not np.array_equal(recomposed[original], rgba[original]):
        raise ValueError("Left source-pixel ownership lost original paint")
    rig.upper = street.register_source(parts["upper"], rig.view, scale, 472)[0]
    for owner in ("far", "near"):
        rig.cloth_sources[owner] = parts[owner + "-cloth"]
        rig.shoe_sources[owner] = parts[owner + "-shoe"]
        rig.cloth[owner] = street.register_source(parts[owner + "-cloth"], rig.view, scale, 472)[0]
        rig.shoes[owner] = street.register_source(parts[owner + "-shoe"], rig.view, scale, 472)[0]
        row = np.flatnonzero(np.asarray(parts[owner + "-cloth"])[755, :, 3] >= 20)
        knee_x = int(geometry["sourceBinding"]["originalKneesXY"][owner][0])
        radius = max(abs(int(row.min()) - knee_x), abs(int(row.max()) + 1 - knee_x))
        rig.knee_support[owner] = {"rowSourceY": 755, "annotatedKneeX": knee_x,
                                   "alpha20EdgesXYExclusive": [int(row.min()), int(row.max()) + 1],
                                   "alpha20RowPixels": int(len(row)), "measuredRadius": radius,
                                   "bandSourceY": [755 - radius, 755 + radius]}
    return {"sourceAlphaPositive": int(original.sum()),
            "partAlphaPositive": total,
            "kneeWidths": rig.knee_support}


def profile_frame(pose, facing):
    solved = rig.solve_pose(pose)
    canvas = Image.new("RGBA", (512, 512))
    audits = {}
    for owner in ("far", "near"):
        source_audit = rig.audit_full_source(owner, solved[owner])
        if any(source_audit["nonPositiveCountBySample"].values()) or source_audit["sourceAlphaPositiveOutsideNativeCell"]:
            raise ValueError(f"{facing}/{owner} source fold or native clipping at phase {pose['index']}")
        cloth, check = rig.sample_cloth(owner, solved[owner])
        if cloth is None or check["outsideMappedSourceAlpha20Pixels"]:
            raise ValueError(f"{facing}/{owner} original cloth inverse failed at phase {pose['index']}")
        canvas.alpha_composite(cloth)
        rig.place_rotated(canvas, rig.shoes[owner], solved[owner]["source"]["ankle"],
                          solved[owner]["target"], solved[owner]["shoeAngle"])
        audits[owner] = {"sourceMinJacobian": min(source_audit["minDeterminantBySample"].values()),
                         "clothAlpha20": check["outputAlpha20Pixels"]}
    canvas.alpha_composite(rig.translate_whole(rig.upper, (pose["hipRootXY"][1] - 545) * scale))
    if facing == "left":
        canvas = canvas.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return canvas, audits


def registered_turns():
    cardinal = Image.open(BERLIN / "quiz-heike-hoffmann-expressionist-directions-v1.png").convert("RGBA")
    quarter = Image.open(BERLIN / "quiz-heike-hoffmann-expressionist-turns-v1.png").convert("RGBA")
    if sha(BERLIN / "quiz-heike-hoffmann-expressionist-directions-v1.png") != "db53351aac7348f14088f4a8d21988c96bc607868103b3bfac10bd38e7077524":
        raise ValueError("Heike cardinal source changed")
    if sha(BERLIN / "quiz-heike-hoffmann-expressionist-turns-v1.png") != "ebf19dd753db5b45ebc6c2fa5ebcb05b9c2008b452ca9bc00a20db5c1f5120b9":
        raise ValueError("Heike turn source changed")
    cards = [([134,19,453,867],[290.25,867]),([586,16,825,866],[705.5,866]),
             ([941,16,1269,863],[1111,863]),([1399,19,1628,866],[1513.5,866])]
    turns = [([55,25,404,963],[230,963]),([458,22,756,960],[607,960]),
             ([789,24,1105,962],[947,962]),([1151,27,1507,963],[1330,963])]
    result = []
    for image, items, physical in ((cardinal, cards, 848), (quarter, turns, 938)):
        for box, pivot in items:
            frame, _ = street.register_source(image,
                {"component_bounds": box, "source_pivot": pivot}, 400 / physical, 472)
            result.append(frame)
    return [result[index] for index in (0,4,1,5,2,6,3,7)]


def export(output, working, records):
    output.mkdir(parents=True, exist_ok=True)
    variants = {}
    for name, cell, figure, pivot in (("desktop", [96,120],102,[48,112.5]),
                                      ("mobile", [64,80],68,[32,75])):
        spec = {"cell": cell, "figureHeight": figure, "pivot": pivot,
                "working": {"figureHeight":400,"baseline":472}}
        w,h = cell
        atlas = Image.new("RGBA", (w*16,h*9))
        native = {}
        for (row,col),frame in working.items():
            picture = street.export_cell(frame,spec)
            border = np.asarray(picture)[:, :, 3]
            if max(border[0].max(),border[-1].max(),border[:,0].max(),border[:,-1].max()):
                raise ValueError(f"{name} row{row} col{col} touches native cell border")
            atlas.paste(picture,(w*col,h*row))
            native[(row,col)] = picture
        path = output / ("walk-turn-" + name + ".webp")
        atlas.save(path,lossless=True,exact=True,method=4)
        with Image.open(path) as encoded:
            if encoded.convert("RGBA").tobytes()!=atlas.tobytes():
                raise ValueError("Lossless walk/turn source changed on decode")
        for direction in DIRECTIONS:
            row = DIRECTIONS.index(direction)
            frames = [native[row,col] for col in range(16)]
            for theme,color in (("light","#eee8db"),("dark","#25272b")):
                street.opaque_board(frames,8,color,4).save(output / f"{direction}-{name}-{theme}.png")
        variants[name] = {"file":path.name,"sha256":sha(path),"cell":cell,
                          "imageSize":list(atlas.size),"decodedBytes":atlas.width*atlas.height*4}
    receipt = {"status":"adult source-pixel movement candidate; native and runtime review pending",
               "actorId":ID,"figureWorldHeight":2.33,
               "working":{"figureHeight":400,"baseline":472},
               "logical":{"cell":[128,160],"figureHeight":136,"pivot":[64,150]},
               "sourceSha256":sha(rig.SOURCE),
               "geometrySha256":sha(HERE / "geometry.json"),
               "extractionReceiptSha256":sha(HERE / "extraction-receipt.json"),
               "variants":variants,"records":records}
    (output / "walk-turn-receipt.json").write_text(json.dumps(receipt,indent=2)+"\n",encoding="utf8")
    return receipt


def build(output):
    output.mkdir(parents=True,exist_ok=True)
    frames = {}
    records = {"walks":{},"bridges":{},"turns":{}}
    for direction,row in (("down",0),("up",2)):
        sequence,trace = builder.motion(person,direction)
        if len(sequence)!=16 or len({frame.tobytes() for frame in sequence})<12:
            raise ValueError(f"{direction} own planted walk did not animate 16 source phases")
        records["walks"][direction] = {"method":"existing build-street-speaker-family planted paint",
                                       "distinctWorking":len({frame.tobytes() for frame in sequence})}
        for col,frame in enumerate(sequence):frames[row,col]=frame
        bridge = builder.bridge_frames(person,direction)
        if len(bridge)!=5:raise ValueError("Incomplete planted bridge")
        for col,frame in enumerate(bridge):frames[row+4,col]=frame
        records["bridges"][direction] = {"method":"existing family strength-to-source bridge"}
    for direction,row in (("right",1),("left",3)):
        if direction=="left":
            records["leftSourceOwnership"] = bind_left()
            shoe_prefix = "left-"
        else:shoe_prefix = ""
        cycle = []
        for phase in range(16):
            pose = pose_at(phase,1,shoe_prefix)
            frame,audits = profile_frame(pose,direction)
            cycle.append(frame)
            frames[row,phase] = frame
        records["walks"][direction] = {"method":"measured source-cloth and whole-Oxford profile rig",
                                        "distinctWorking":len({frame.tobytes() for frame in cycle}),
                                        "sourceKneeSupport":rig.knee_support}
        for col,(phase,strength) in enumerate(((15,.75),(15,.4),(0,0),(0,.4),(0,.75))):
            pose = pose_at(phase,strength,shoe_prefix)
            frames[row+4,col],_ = profile_frame(pose,direction)
        records["bridges"][direction] = {"method":"same original source-cloth field with stride closing to planted feet",
                                          "phaseStrengths":[[15,.75],[15,.4],[0,0],[0,.4],[0,.75]],
                                          "neutralCaveat":"own-contact rest is knee-flexed; cardinal turn anchor remains separate"}
    for col,frame in enumerate(registered_turns()):frames[8,col]=frame
    records["turns"] = {"count":8,"order":["down","front-right","right","rear-right","up","rear-left","left","front-left"],
                        "method":"one common adult physical scale per source family, planted painted source views"}
    if len(frames)!=92:raise ValueError(f"Expected 92 selected walk/bridge/turn cells, got {len(frames)}")
    receipt=export(output,frames,records)
    print(json.dumps({"status":receipt["status"],"variants":receipt["variants"]}),flush=True)


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--outdir",type=Path,default=ROOT/"output/street-redesign/heike-end-to-end/adult-body-candidate")
    args=parser.parse_args()
    build(args.outdir.resolve())
