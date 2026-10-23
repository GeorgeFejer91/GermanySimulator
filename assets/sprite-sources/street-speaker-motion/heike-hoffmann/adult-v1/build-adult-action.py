"""Sample Heike's modest key emphasis from one mature front source.

The body, cards, head and shoes stay tied to the same original painting. The
old 16-key timing is preserved, including exact neutral endpoints.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.spatial import Delaunay

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
sys.path.insert(0, str(ROOT / ".agents/skills/animate-2d-characters/scripts"))
import morph_frames
import painted_walk

module = importlib.util.spec_from_file_location("heike_street", ROOT / "tools/build-street-character-sprites.py")
street = importlib.util.module_from_spec(module)
sys.modules[module.name] = street
module.loader.exec_module(street)
SOURCE = ROOT / "assets/sprite-sources/berlin-street-20261022/quiz-heike-hoffmann-expressionist-standing-v1.png"
SOURCE_SHA = "682e78a98dec314584811756a97c7862ef96b1e020fc08935c2ce7457c50c8d9"


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def frames():
    if sha(SOURCE) != SOURCE_SHA:
        raise ValueError("Heike standing source changed")
    source, _ = street.register_source(
        Image.open(SOURCE).convert("RGBA"),
        {"component_bounds": [246, 38, 799, 1493], "source_pivot": [522.5, 1493]},
        400 / 1455, 472)
    rgba = np.asarray(source)
    premul = morph_frames.premultiplied(source)
    xs = [0, 100, 120, 140, 160, 185, 205, 230, 260, 300, 511]
    ys = [0, 120, 160, 185, 220, 255, 285, 315, 345, 380, 430, 511]
    points = np.array([(x, y) for y in ys for x in xs], dtype=float)
    def wx(x):
        return float(np.interp(x, [0, 120, 160, 185, 205, 230, 260, 511],
                               [0, 0, .72, 1, 1, .45, 0, 0]))
    def wy(y):
        return float(np.interp(y, [0, 160, 185, 220, 255, 285, 315, 345, 380, 511],
                               [0, 0, .12, .35, .58, .84, 1, .90, 0, 0]))
    weight = np.array([wx(x) * wy(y) for x, y in points])
    target = points + np.column_stack((-12 * weight, -8 * weight))
    triangles = Delaunay(points).simplices
    morph_frames.validate_mesh(points, target, triangles)
    result = []
    amplitudes = []
    for index in range(16):
        if index <= 7:
            u = index / 7
            amplitude = u * u * (3 - 2 * u)
        elif index == 8:
            amplitude = 1.
        else:
            u = (15 - index) / 7
            amplitude = .94 * u * u * (3 - 2 * u)
        amplitudes.append(amplitude)
        mapping, _ = morph_frames.coordinate_maps(points, target, triangles, amplitude, source.size)
        frame = painted_walk.unpack(morph_frames.sample(premul, mapping))
        pixels = np.asarray(frame)
        for region in ((slice(0, 160), slice(None)),
                       (slice(380, None), slice(None)),
                       (slice(None), slice(260, None))):
            if not np.array_equal(pixels[region], rgba[region]):
                raise ValueError("Heike action changed protected head, cards or shoes")
        if index in (0, 15) and frame.tobytes() != source.tobytes():
            raise ValueError("Heike key action has a visible loop seam")
        result.append(frame)
    if len({frame.tobytes() for frame in result}) < 14:
        raise ValueError("Heike action lost selected temporal articulation")
    return result, amplitudes


def build(output):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    working, amplitudes = frames()
    variants = {}
    for variant, cell, figure, pivot in (("desktop", [96, 120], 102, [48, 112.5]),
                                         ("mobile", [64, 80], 68, [32, 75])):
        spec = {"cell": cell, "figureHeight": figure, "pivot": pivot,
                "working": {"figureHeight": 400, "baseline": 472}}
        native = [street.export_cell(frame, spec) for frame in working]
        atlas = Image.new("RGBA", (cell[0] * 16, cell[1]))
        for index, picture in enumerate(native):
            a = np.asarray(picture)[:, :, 3]
            if max(a[0].max(), a[-1].max(), a[:, 0].max(), a[:, -1].max()):
                raise ValueError(f"Heike {variant} action touches cell border at {index}")
            atlas.paste(picture, (cell[0] * index, 0))
        path = output / f"action-{variant}.webp"
        atlas.save(path, lossless=True, exact=True, method=4)
        with Image.open(path) as encoded:
            if encoded.convert("RGBA").tobytes() != atlas.tobytes():
                raise ValueError("Heike action WebP decoded unlike native")
        for theme, color in (("light", "#eee8db"), ("dark", "#25272b")):
            street.opaque_board(native, 8, color, 4).save(output / f"action-{variant}-{theme}.png")
        variants[variant] = {"path": path.name, "sha256": sha(path),
                             "decodedBytes": atlas.width * atlas.height * 4}
    receipt = {"status": "own-source modest key field; runtime pending",
               "sourceSha256": sha(SOURCE), "sourceLandmarksWorking":
               {"shoulder": [190,185], "elbow": [156,255], "wrist": [185,300],
                "grip": [195,319], "keyTip": [202,348]},
               "peakDisplacementWorking": [-12,-8], "amplitudes": amplitudes,
               "distinctWorking": len({f.tobytes() for f in working}), "variants": variants}
    (output / "action-receipt.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf8")
    return receipt


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "output/street-redesign/heike-end-to-end/adult-action-candidate")
    print(json.dumps(build(parser.parse_args().output)["variants"], indent=2))
