#!/usr/bin/env python3
"""Independently compare the painted bake with its 3D authority and final pixels."""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "assets/sprite-sources/candidates/merkel-painted-left"
BASE = ROOT / "assets/sprite-sources/candidates/merkel-3d"


def require(ok, message):
    if not ok: raise ValueError(message)


def main():
    manifest = json.loads((DEST/"manifest.json").read_text())
    require(manifest["status"] == "candidate-unapproved", "visual approval cannot be inferred")
    require(manifest["directions"] == ["left"], "pilot scope changed")
    require(manifest["playbackFrames"] == 32 and manifest["inspectionPoints"] == 33, "incomplete cycle")
    for prefix, table in ((DEST, manifest["artifacts"]), (ROOT, manifest["sourceHashes"])):
        for name, expected in table.items():
            require(hashlib.sha256((prefix/name).read_bytes()).hexdigest() == expected, f"hash mismatch: {name}")
    original = json.loads((BASE/"pose-audit.json").read_text())
    binding = json.loads((DEST/"binding-audit.json").read_text())
    require(len(binding["frames"]) == 33, "missing independently evaluated poses")
    require(len(binding["bindings"]) == 9, "missing mesh texture binding")
    maximum = 0.
    for index, frame in enumerate(binding["frames"]):
        require(set(frame["bones"]) == set(original["frames"][index]["bones"]), "bone set changed")
        for name, coordinates in frame["bones"].items():
            maximum = max(maximum, float(np.max(np.abs(np.array(coordinates)-original["frames"][index]["bones"][name]))))
    require(maximum < 1e-5, "paint stage altered bone motion")
    with Image.open(DEST/"merkel-sprite.png") as image:
        require(image.mode == "RGBA" and image.size == (4096, 128), "wrong output geometry")
        painted = np.array(image)
    with Image.open(BASE/"merkel-sprite.png") as image:
        grey = np.array(image.crop((0, 0, 4096, 128)))
    # Materials may change color, never the 3D silhouette/occlusion or placement.
    alpha_error = int(np.abs(painted[:, :, 3].astype(int)-grey[:, :, 3].astype(int)).max())
    require(alpha_error <= 1, "paint stage altered silhouette or registration")
    tiles = [painted[:, i*128:(i+1)*128] for i in range(32)]
    require(len({tile.tobytes() for tile in tiles}) == 32, "pose holds instead of full walk")
    for i, tile in enumerate(tiles):
        alpha = tile[:, :, 3]
        require(not np.any(tile[alpha == 0, :3]), "dirty transparency")
        require(not np.any(alpha[[0, 1, -2, -1]]) and not np.any(alpha[:, [0, 1, -2, -1]]), "clipped sprite")
        for side in "LR":
            x, y = (round(v) for v in original["views"]["left"][i]["bones"]["foot."+side][0])
            require(np.any(alpha[max(0,y-4):y+5, max(0,x-4):x+5] > 32), "shoe does not cover ankle")
    with Image.open(DEST/"merkel-audit.png") as image:
        require(image.size == (4224, 128), "missing closure sheet")
        pixels = np.array(image)
        require(np.array_equal(pixels[:, :4096], painted), "audit differs from playback")
        require(np.array_equal(pixels[:, :128], pixels[:, -128:]), "loop closure is not pixel exact")
    with Image.open(DEST/"merkel-bones.png") as image:
        require(image.size == (4096, 128), "missing overlay")
    with Image.open(DEST/"paint-over.png") as image:
        require(image.mode == "RGBA" and image.getchannel("A").getextrema() == (0, 255), "source lacks true transparency")
    for name in ("game.js", "world3d.js"):
        require("merkel-painted-left" not in (ROOT/name).read_text(encoding="utf-8"), "painted pilot leaked into game")
    report = {"status": "mechanical-checks-pass; not visual approval", "frames": 32, "views": ["left"],
        "maximumBoneDifferenceFrom3D": maximum, "maximumAlphaDifferenceFrom3D": alpha_error,
        "closurePixelMaxDifference": 0, "staticTextureBindings": len(binding["bindings"]),
        "appearance": "single ImageGen painting; fixed UVs; 3D depth resolves occlusion"}
    (DEST/"verification.json").write_text(json.dumps(report, indent=2)+"\n", encoding="utf-8", newline="\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__": main()
