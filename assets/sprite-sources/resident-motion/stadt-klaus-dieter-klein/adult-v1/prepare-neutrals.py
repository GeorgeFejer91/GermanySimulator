"""Register Klaus-Dieter's immutable adult cardinal and diagonal paint at one scale.

This is an actor-specific source stage. It does not select an atlas or claim gait.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt, find_objects, label

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
ID = "stadt-klaus-dieter-klein"
CARDINAL = HERE / 'raw/cardinals.png'
DIAGONAL = HERE / 'raw/quarters.png'
EXPECTED = {
    CARDINAL.name: 'b10c3808755aea5833a02ee745f365ff486b5829ce8747556ccd86ebf316b0af',
    DIAGONAL.name: 'd2568fa613df59cd204e7e2174fc5002951dc1cb2c2b1296f2e88172ef507122',
}
ORDER = ("down", "front-right", "right", "rear-right", "up", "rear-left", "left", "front-left")
SOURCE_ORDER = {
    "down": (CARDINAL, 0), "right": (CARDINAL, 1),
    "up": (CARDINAL, 2), "left": (CARDINAL, 3),
    "front-right": (DIAGONAL, 0), "rear-right": (DIAGONAL, 1),
    "rear-left": (DIAGONAL, 2), "front-left": (DIAGONAL, 3),
}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def isolate_source_component(source: Image.Image, bounds: list[int]) -> Image.Image:
    """Keep one actual source figure and its own two-pixel low-alpha fringe."""
    pixels = np.asarray(source.convert('RGBA')).copy()
    components, _ = label(pixels[:, :, 3] >= 20)
    matches = [index for index, region in enumerate(find_objects(components), 1)
               if region is not None and [region[1].start, region[0].start,
                                          region[1].stop, region[0].stop] == bounds]
    if len(matches) != 1:
        raise ValueError('Selected source component bounds no longer match')
    distance, nearest = distance_transform_edt(components == 0, return_indices=True)
    owned = ((components == matches[0]) |
             ((pixels[:, :, 3] < 20) & (distance <= 2) &
              (components[tuple(nearest)] == matches[0])))
    pixels[~owned] = 0
    return Image.fromarray(pixels)


def shoe_support(source: Image.Image, bounds: list[int]):
    alpha = np.asarray(source.getchannel("A"))
    l, t, r, b = bounds
    start = max(t, b - 90)
    region = alpha[start:b, l:r] >= 20
    markers, _ = label(region)
    shoes = []
    for i, sl in enumerate(find_objects(markers), 1):
        if sl is None:
            continue
        yy, xx = sl
        pixels = int(np.count_nonzero(markers[sl] == i))
        # A true oblique view places the farther planted sole higher in image
        # space. Keep both actual foot supports from the bottom90px region;
        # selecting only the lowest shoe shifts the whole torso sideways.
        if pixels >= 100:
            shoes.append({"x": l + (xx.start + xx.stop) / 2,
                          "bounds": [l + xx.start, start + yy.start, l + xx.stop, start + yy.stop],
                          "pixels": pixels})
    shoes.sort(key=lambda s: s["x"])
    if len(shoes) >= 2:
        selected = sorted(shoes, key=lambda s: s["pixels"], reverse=True)[:2]
        pivot_x = sum(s["x"] for s in selected) / 2
    elif shoes:
        pivot_x = shoes[0]["x"]
    else:
        raise ValueError("No source shoe support")
    return [pivot_x, b], shoes


def run():
    street = module("klaus-heinz_street_register", ROOT / "tools/build-street-character-sprites.py")
    sources = {}
    for path in (CARDINAL, DIAGONAL):
        assert sha(path) == EXPECTED[path.name], path
        raw = Image.open(path).convert("RGBA")
        boxes = sorted(street.source_components(raw), key=lambda box: box[0])
        assert len(boxes) == 4, (path, boxes)
        sources[path] = (raw, boxes)
    out = HERE / "registered"
    out.mkdir(exist_ok=True)
    # One source-density normalization per complete generated sheet. Never
    # independently fit its views. The neutral front owns adult figure height.
    sheet_heights = {path: boxes[0][3]-boxes[0][1] for path, (_, boxes) in sources.items()}
    receipt = {"status": "ADULT_SOURCE_REGISTRATION_PROVISIONAL", "identity": ID,
               "sourceHashes": EXPECTED, "sourceDensityHeights": {p.name:h for p,h in sheet_heights.items()},
               "oneScalePerRawSheet": {p.name:400/h for p,h in sheet_heights.items()}, "working": {"cell": [512, 512], "centerX": 256,
               "baselineY": 472}, "views": {}}
    board = Image.new("RGB", (512 * 4, 512 * 2), "#eee8db")
    for index, heading in enumerate(ORDER):
        path, source_index = SOURCE_ORDER[heading]
        raw, boxes = sources[path]
        bounds = boxes[source_index]
        pivot, shoes = shoe_support(raw, bounds)
        view = {"component_bounds": bounds, "source_pivot": pivot}
        isolated = isolate_source_component(raw, bounds)
        registered, origin = street.register_source(isolated, view, 400/sheet_heights[path], 472)
        rgba = np.asarray(registered).copy()
        rgba[rgba[:, :, 3] < 20] = 0
        registered = Image.fromarray(rgba)
        dest = out / f"{heading}.png"
        registered.save(dest)
        alpha = rgba[:, :, 3]
        yy, xx = np.nonzero(alpha >= 20)
        native_bounds = [int(xx.min()), int(yy.min()), int(xx.max()+1), int(yy.max()+1)]
        assert native_bounds[0] > 0 and native_bounds[1] > 0 and native_bounds[2] < 512 and native_bounds[3] < 512
        receipt["views"][heading] = {"source": str(path.relative_to(ROOT)).replace('\\', '/'),
            "sourceBoundsAlpha20": bounds, "sourcePivot": pivot, "sourceShoeSupport": shoes,
            "workingOrigin": origin.tolist(), "workingBoundsAlpha20": native_bounds,
            "registered": str(dest.relative_to(ROOT)).replace('\\', '/'), "registeredSha256": sha(dest)}
        flat = Image.alpha_composite(Image.new("RGBA", registered.size, "#eee8db"), registered).convert("RGB")
        x, y = (index % 4) * 512, (index // 4) * 512
        board.paste(flat, (x, y))
        ImageDraw.Draw(board).text((x + 10, y + 10), heading, fill="#111111")
    report = HERE / "registration.json"
    report.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    board_path = ROOT / "output/street-redesign/klaus-klein-end-to-end/registered-adult-light.png"
    board_path.parent.mkdir(parents=True, exist_ok=True)
    board.save(board_path)
    print(json.dumps({"views": len(receipt["views"]), "registrationSha256": sha(report),
                      "bounds": {k: v["workingBoundsAlpha20"] for k, v in receipt["views"].items()}}))


if __name__ == "__main__":
    run()
