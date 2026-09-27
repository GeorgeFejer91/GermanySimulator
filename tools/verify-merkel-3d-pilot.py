#!/usr/bin/env python3
"""Check actual Blender bone/shoe output and pixels, without importing its builder.

These are mechanical gates, not a claim that the motion or likeness is approved.
"""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PILOT = ROOT / "assets/sprite-sources/candidates/merkel-3d"


def require(condition, message):
    if not condition:
        raise ValueError(message)


def main():
    manifest = json.loads((PILOT / "manifest.json").read_text())
    audit = json.loads((PILOT / "pose-audit.json").read_text())
    require(manifest["status"] == "candidate-unapproved", "pilot cannot self-approve")
    count, size = manifest["playbackFrames"], manifest["cellSize"]
    require(count == 32 and manifest["inspectionPoints"] == 33, "wrong cycle contract")
    for name, expected in manifest["artifacts"].items():
        require(hashlib.sha256((PILOT / name).read_bytes()).hexdigest() == expected, f"artifact hash: {name}")
    for name, expected in manifest["sourceHashes"].items():
        file = ROOT / "assets/sprite-sources/reference/makehuman-walk" / name
        require(hashlib.sha256(file.read_bytes()).hexdigest() == expected, f"source hash: {name}")
    bvh = ROOT / "assets/sprite-sources/reference/cmu-walk-69-01/69_01.bvh"
    require(hashlib.sha256(bvh.read_bytes()).hexdigest() == manifest["bvhSha256"], "BVH changed")
    frames = audit["frames"]
    require(len(frames) == count+1, "missing pose/closure")
    rest_lengths = {name:np.linalg.norm(np.diff(points,axis=0)) for name,points in audit["bones"].items()}
    length_error = 0.
    connection_error = 0.
    contact_error = 0.
    slip = 0.
    floor_penetration = 0.
    max_knee = 0.
    for i,frame in enumerate(frames):
        bones = {name:np.array(points) for name,points in frame["bones"].items()}
        for name,points in bones.items():
            length_error = max(length_error,abs(np.linalg.norm(np.diff(points,axis=0))-rest_lengths[name]))
        require(bones["foot.L"][0,0]>bones["foot.R"][0,0], "feet cross lateral lanes")
        for side in "LR":
            for a,b in (("thigh","shin"),("shin","foot"),("foot","toe"),("arm","forearm"),("forearm","hand")):
                connection_error = max(connection_error,np.linalg.norm(bones[a+"."+side][1]-bones[b+"."+side][0]))
            upper = bones["thigh."+side][1]-bones["thigh."+side][0]
            lower = bones["shin."+side][1]-bones["shin."+side][0]
            bend = np.degrees(np.arccos(np.clip(np.dot(upper,lower)/(np.linalg.norm(upper)*np.linalg.norm(lower)),-1,1)))
            max_knee = max(max_knee,float(bend))
            require(0<=bend<95, "folded knee")
            # Knee bends towards travel, not backwards through the leg.
            hip,ankle = bones["thigh."+side][0],bones["foot."+side][0]
            axis = ankle-hip
            knee = bones["thigh."+side][1]
            on_axis = hip+axis*np.dot(knee-hip,axis)/np.dot(axis,axis)
            require(knee[1] <= on_axis[1]+1e-5, "inverted knee")
            foot = frame["feet"][side]
            floor_penetration = max(floor_penetration,-foot["minimumZ"])
            if foot["stance"]:
                contact_error = max(contact_error,abs(foot["contact"][2]))
                if i and i<count:
                    previous = frames[i-1]["feet"][side]
                    if previous["stance"] and foot["phase"]>previous["phase"] and (foot["pitch"]<0)==(previous["pitch"]<0):
                        delta = np.array(foot["contact"])-np.array(previous["contact"])
                        delta[1] -= audit["strideDistance"]/count
                        slip = max(slip,float(np.linalg.norm(delta)))
    require(length_error<1e-5, "bone stretching")
    require(connection_error<1e-5, "disconnected joint")
    require(contact_error<1e-5 and floor_penetration<1e-5, "shoe/floor contact fails")
    require(slip<1e-5, "planted shoe slides in world space")
    points = np.array([[frame["bones"][name] for name in audit["bones"]] for frame in frames])
    require(np.max(np.abs(points[0]-points[-1]))<1e-6, "3D loop does not close")
    speeds = np.linalg.norm(np.diff(points,axis=0),axis=-1)
    seam_speed = float(speeds[-1].max())
    max_speed = float(speeds.max())
    require(seam_speed<=max_speed and seam_speed<.16, "loop seam snaps")
    # Check seam acceleration against the interior, not just identical endpoints.
    cyclic = points[:-1]
    accelerations = np.linalg.norm(np.roll(cyclic,-1,axis=0)-2*cyclic+np.roll(cyclic,1,axis=0),axis=-1)
    require(float(accelerations[0].max())<.065, "velocity discontinuity at loop seam")
    head_points = np.array([f["bones"]["head"][0] for f in frames])
    require(float(np.ptp(head_points,axis=0).max())<.04, "head wobble exceeds motion budget")

    pixel_seams = {}
    for row,view in enumerate(manifest["directions"]):
        with Image.open(PILOT/"merkel-sprite.png") as image:
            require(image.mode=="RGBA" and image.size==(count*size,4*size), "wrong atlas geometry")
            tiles = [np.array(image.crop((i*size,row*size,(i+1)*size,(row+1)*size))) for i in range(count)]
        require(len({tile.tobytes() for tile in tiles})==count, f"duplicate hold in {view}")
        for i,tile in enumerate(tiles):
            alpha=tile[:,:,3]
            require(np.count_nonzero(alpha)>300, "empty sprite")
            require(not np.any(tile[alpha==0,:3]), "dirty transparent RGB")
            require(not np.any(alpha[[0,1,-2,-1]]) and not np.any(alpha[:,[0,1,-2,-1]]), "sprite clipped")
            # Projected actual ankle must coincide with visible rendered shoe.
            for side in "LR":
                x,y=audit["views"][view][i]["bones"]["foot."+side][0]
                x,y=round(x),round(y)
                require(np.any(alpha[max(0,y-4):y+5,max(0,x-4):x+5]>32), "rendered foot misses rig")
        with Image.open(PILOT/"merkel-audit.png") as image:
            require(image.size==((count+1)*size,4*size), "wrong closure sheet")
            first=np.array(image.crop((0,row*size,size,(row+1)*size)))
            last=np.array(image.crop((count*size,row*size,(count+1)*size,(row+1)*size)))
            pixel_seams[view]=int(np.max(np.abs(first.astype(int)-last.astype(int))))
            require(pixel_seams[view]==0, f"independently rendered closure differs: {view}")
        with Image.open(PILOT/"merkel-bones.png") as image:
            require(image.size==(count*size,4*size), "wrong bone overlay geometry")
    # A preview must never redirect the actual game's sprite authority.
    for name in ("game.js","world3d.js"):
        text=(ROOT/name).read_text(encoding="utf-8")
        require("candidates/merkel-3d" not in text, f"pilot leaked into {name}")
    report={"status":"mechanical-checks-pass; visual approval still required",
            "frames":count,"views":manifest["directions"],"maximumBoneLengthError":float(length_error),
            "maximumJointGap":float(connection_error),"maximumFloorPenetration":float(floor_penetration),
            "maximumStanceContactError":float(contact_error),"maximumWorldFootSlipPerFrame":float(slip),
            "maximumKneeFlexDegrees":max_knee,"maximumJointStep":max_speed,"seamJointStep":seam_speed,
            "seamJointAcceleration":float(accelerations[0].max()),"maximumHeadExcursion":float(np.ptp(head_points,axis=0).max()),
            "closurePixelMaxDifference":pixel_seams,"modelUnitsPerLeg":audit["legLength"]}
    (PILOT/"verification.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8",newline="\n")
    print(json.dumps(report,indent=2))


if __name__ == "__main__":
    main()
