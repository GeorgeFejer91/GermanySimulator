"""Register Hildegard's immutable adult cardinal and diagonal paint at one scale.

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
ID = "crowd-hildegard-brotzeit"
CARDINAL = HERE / 'raw-cardinals-v3.png'
DIAGONAL = HERE / 'raw-quarters-v3.png'
EXPECTED = {
    CARDINAL.name: 'd2cfe4230be3d95b3923a8f420ce746ed028858f28ed0334c4eaef63c6a835c9',
    DIAGONAL.name: '6e2660c95f48de74aa79027922f044a6ce18775a92f08cf2eb7dfdad4dbb6863',
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
    street = module("hildegard_brotzeit_street_register", ROOT / "tools/build-street-character-sprites.py")
    sources = {}
    for path in (CARDINAL, DIAGONAL):
        assert sha(path) == EXPECTED[path.name], path
        raw = Image.open(path).convert("RGBA")
        boxes = sorted(street.source_components(raw), key=lambda box: (box[1] // (raw.height // 2), box[0]))
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
    boards = {theme: Image.new("RGB", (512 * 4, 512 * 2), bg)
              for theme,bg in [('light','#eee8db'),('dark','#25272b')]}
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
        x, y = (index % 4) * 512, (index // 4) * 512
        for theme,bg in [('light','#eee8db'),('dark','#25272b')]:
            flat = Image.alpha_composite(Image.new("RGBA", registered.size, bg), registered).convert("RGB")
            boards[theme].paste(flat, (x, y))
            ImageDraw.Draw(boards[theme]).text((x + 10, y + 10), heading, fill='#111111' if theme=='light' else '#eeeeee')
    report = HERE / "registration.json"
    report.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    board_path = ROOT / "output/street-redesign/hildegard-brotzeit-end-to-end"
    board_path.mkdir(parents=True, exist_ok=True)
    for theme,board in boards.items():
        board.save(board_path / f'registered-adult-{theme}.png')
    comparison=Image.new('RGB',(2048,512),'#eee8db')
    for index,(name,path) in enumerate([('Hildegard own front',HERE/'registered/down.png'),
        ('Söder proportion reference',HERE/'reference-soeder-neutral.png'),
        ('Herr Sandale proportion reference',HERE/'reference-herr-sandale-neutral.png'),
        ('Frau Sandale proportion reference',HERE/'reference-frau-sandale-neutral.png')]):
        image=Image.open(path).convert('RGBA')
        if index:
            image=image.crop(image.getchannel('A').getbbox());scale=400/image.height
            image=image.resize((round(image.width*scale),400),Image.Resampling.NEAREST)
            cell=Image.new('RGBA',(512,512));cell.alpha_composite(image,(256-image.width//2,72));image=cell
        comparison.paste(Image.alpha_composite(Image.new('RGBA',(512,512),'#eee8db'),image).convert('RGB'),(index*512,0))
        ImageDraw.Draw(comparison).text((index*512+8,12),name,fill='#111')
    comparison.save(board_path/'registered-equal-height-reference-comparison.png')
    print(json.dumps({"views": len(receipt["views"]), "registrationSha256": sha(report),
                      "bounds": {k: v["workingBoundsAlpha20"] for k, v in receipt["views"].items()}}))


if __name__ == "__main__":
    run()

