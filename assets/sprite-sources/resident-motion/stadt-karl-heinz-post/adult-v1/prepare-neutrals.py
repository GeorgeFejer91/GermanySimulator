"""Register Karl-Heinz's immutable adult cardinal and diagonal paint at one scale.

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
SOURCE = ROOT / "assets/sprite-sources/berlin-street-20261022"
ID = "stadt-karl-heinz-post"
CARDINAL = SOURCE / f"{ID}-expressionist-directions-v1.png"
DIAGONAL = SOURCE / f"{ID}-expressionist-diagonals-v1.png"
EXPECTED = {
    CARDINAL.name: '54c17ac7904811c1affbb79bd6c7a87382720251a7e56a7e148436d77bac30fa',
    DIAGONAL.name: 'fd195ef3e1219c853818bbcd7a7daff195d7a0dc2acf464592ec732e9f66ea33',
}
ORDER = ("down", "front-right", "right", "rear-right", "up", "rear-left", "left", "front-left")
SOURCE_ORDER = {
    "down": (CARDINAL, 0), "right": (CARDINAL, 1),
    "up": (CARDINAL, 2), "left": (CARDINAL, 3),
    "front-right": (DIAGONAL, 0), "rear-right": (DIAGONAL, 1),
    "rear-left": (DIAGONAL, 2), "front-left": (DIAGONAL, 3),
}
FRONT_HEIGHT = 768
SCALE = 400 / FRONT_HEIGHT


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
    street = module("karl-heinz_street_register", ROOT / "tools/build-street-character-sprites.py")
    sources = {}
    for path in (CARDINAL, DIAGONAL):
        assert sha(path) == EXPECTED[path.name], path
        raw = Image.open(path).convert("RGBA")
        boxes = sorted(street.source_components(raw), key=lambda box: box[0])
        assert len(boxes) == 4, (path, boxes)
        sources[path] = (raw, boxes)
    out = HERE / "registered"
    out.mkdir(exist_ok=True)
    receipt = {"status": "ADULT_SOURCE_REGISTRATION_PROVISIONAL", "identity": ID,
               "sourceHashes": EXPECTED, "frontAlpha20Height": FRONT_HEIGHT,
               "oneFamilyScale": SCALE, "working": {"cell": [512, 512], "centerX": 256,
               "baselineY": 472}, "views": {}}
    board = Image.new("RGB", (512 * 4, 512 * 2), "#eee8db")
    for index, heading in enumerate(ORDER):
        path, source_index = SOURCE_ORDER[heading]
        raw, boxes = sources[path]
        bounds = boxes[source_index]
        pivot, shoes = shoe_support(raw, bounds)
        view = {"component_bounds": bounds, "source_pivot": pivot}
        isolated = isolate_source_component(raw, bounds)
        registered, origin = street.register_source(isolated, view, SCALE, 472)
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
    board_path = ROOT / "output/street-redesign/karl-heinz-end-to-end/registered-adult-light.png"
    board_path.parent.mkdir(parents=True, exist_ok=True)
    board.save(board_path)
    print(json.dumps({"views": len(receipt["views"]), "registrationSha256": sha(report),
                      "bounds": {k: v["workingBoundsAlpha20"] for k, v in receipt["views"].items()}}))


if __name__ == "__main__":
    run()
