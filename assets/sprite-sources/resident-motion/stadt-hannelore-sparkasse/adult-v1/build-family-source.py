"""Build Hannelore's adult source family in the existing 16x32 logical layout.

This produces private working-source cells and a body index. It does not select
the atlas, change the runtime, or claim native game acceptance.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
OUT = ROOT / "output/street-redesign/hannelore-end-to-end/full-working"
sys.path.insert(0, str(ROOT / ".agents/skills/animate-2d-characters/scripts"))
import painted_walk as paint


def load(path: Path):
    spec = importlib.util.spec_from_file_location("hannelore_adult_source", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


pilot = load(HERE / "pilot-motion.py")
side = load(HERE / "side-source-fields.py")
ORDER = ("down", "right", "up", "left")
TURN = ("down", "front-right", "right", "rear-right", "up", "rear-left", "left", "front-left")


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def qa(image: Image.Image):
    alpha = np.asarray(image.getchannel("A"))
    groups, count = label(alpha >= 21)
    sizes = np.bincount(groups.ravel())[1:]
    substantive = [int(v) for v in sizes if v >= 15]
    bounds = image.getchannel("A").getbbox()
    assert bounds and bounds[0] > 0 and bounds[1] > 0 and bounds[2] < 512 and bounds[3] < 512
    rgba = np.asarray(image)
    assert not np.any(rgba[rgba[:, :, 3] == 0, :3])
    return {"bounds": list(bounds), "substantiveComponents": substantive}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    files = OUT / "cells"
    files.mkdir(exist_ok=True)
    pins = {}
    for path in [Path(__file__), HERE / "pilot-motion.py", HERE / "side-source-fields.py",
                 HERE / "registration.json", ROOT / ".agents/skills/animate-2d-characters/scripts/painted_walk.py"]:
        pins[path.relative_to(ROOT).as_posix()] = sha(path)
    slots = {}
    stored = {}
    observations = {}

    def add(row, col, key, image, heading, kind, phase=None, strength=None, mouth_dx=0, mouth_dy=0):
        assert (row, col) not in slots
        path = files / (key + ".png")
        if key not in stored:
            image.save(path)
            stored[key] = {"file": path.relative_to(ROOT).as_posix(), "sha256": sha(path)}
            observations[key] = qa(image)
        slots[row, col] = {"row": row, "col": col, "kind": kind, "heading": heading,
                           "source": stored[key], "mouthDx": mouth_dx, "mouthDy": mouth_dy,
                           **({"entryPhase": phase, "strength": strength} if kind == "stop" else {})}

    registered = {name: Image.open(HERE / "registered" / f"{name}.png").convert("RGBA") for name in TURN}
    for name in TURN:
        path = HERE / "registered" / f"{name}.png"
        pins[path.relative_to(ROOT).as_posix()] = sha(path)
    walkers = {}
    all_stops = {}
    for i, heading in enumerate(ORDER):
        source = registered[heading]
        if heading in ("right", "left"):
            actor = side.SideSource(heading)
            render = lambda p, s: actor.render(p, s)[0]
            bob = lambda p, s: 0.0
        else:
            render = lambda p, s: paint.animate(source, pilot.LANDMARKS[heading],
                travel=pilot.TRAVEL[heading], count=16, foreground=pilot.FOREGROUND[heading],
                strength=s, phases=[p])[0][0]
            bob = lambda p, s: -3.4 * math.cos(2*p) * s
        walks = []
        for phase in range(16):
            radians = math.tau * phase / 16
            image = render(radians, 1.0)
            key = f"walk-{heading}-{phase:02}"
            add(i, phase, key, image, heading, "walk", mouth_dy=bob(radians, 1.0))
            walks.append((key, image))
        walkers[heading] = walks
        count = 4 if heading in ("down", "up") else 7
        stop_rows = {"down": [9, 10, 11, 12], "up": [13, 14, 15, 17],
                     "right": list(range(18, 25)), "left": list(range(25, 32))}[heading]
        places = [(row, col) for row in stop_rows for col in range(16)]
        stops = []
        for phase in range(16):
            radians = math.tau * phase / 16
            phases = []
            for stage in range(count):
                strength = 1 - stage/count
                key = walks[phase][0] if stage == 0 else f"stop-{heading}-{phase:02}-{stage}"
                image = walks[phase][1] if stage == 0 else render(radians, strength)
                row, col = places[phase*count+stage]
                add(row, col, key, image, heading, "stop", phase=phase, strength=strength,
                    mouth_dy=bob(radians, strength))
                phases.append((key, image, strength))
            stops.append(phases)
        all_stops[heading] = stops
    for col, name in enumerate(TURN):
        add(8, col, f"neutral-{name}", registered[name], name, "turn")
    for i, heading in enumerate(ORDER):
        neutral = registered[heading]
        row = i + 4
        add(row, 2, f"neutral-{heading}", neutral, heading, "bridge-neutral")
        first = all_stops[heading][0]
        for j, (key, image, strength) in enumerate(reversed(first)):
            add(row, j + 3, key, image, heading, "bridge-start", mouth_dy=
                -3.4*strength if heading in ("down", "up") else 0)
        add(row, 3 + len(first), walkers[heading][0][0], walkers[heading][0][1],
            heading, "bridge-start", mouth_dy=-3.4 if heading in ("down", "up") else 0)
    # Source-supported courtesy nod/review action keeps planted feet and the
    # LEFT bag/grip untouched. The original hidden upper arm is not invented.
    source = registered["down"]
    gesture = load(ROOT / "tools/build-street-character-sprites.py")
    action = {"neck_y": 168, "hip_y": 274, "sway_pixels": 2, "nod_pixels": 7}
    for col, image in enumerate(gesture.planted_action(source, "greet", 16, action)):
        t = col / 15
        attack = min(1, t/.32)
        release = min(1, (1-t)/.32)
        wave = math.sin(math.pi/2*attack)**2 * math.sin(math.pi/2*release)**2
        head = (168-141)/32
        head = head*head*(3-2*head)
        add(16, col, f"gesture-{col:02}", image, "down", "gesture",
            mouth_dx=2*wave, mouth_dy=7*head*wave)
    assert len(slots) == 470, len(slots)
    cells = [slots[key] for key in sorted(slots)]
    index = {"identity": "stadt-hannelore-sparkasse", "grid": [16, 32],
             "status": "PRIVATE ADULT SOURCE FAMILY; native and mouth not yet accepted",
             "sourceFiles": len(stored), "cells": cells, "inputPins": pins,
             "pixelChecks": observations}
    (OUT / "body-index.json").write_text(json.dumps(index, indent=2) + "\n")
    print(json.dumps({"slots": len(slots), "sourceFiles": len(stored),
                      "multipleSubstantiveComponents": sum(len(v["substantiveComponents"]) > 1 for v in observations.values()),
                      "indexSha256": sha(OUT / "body-index.json")}))


if __name__ == "__main__":
    main()
