"""Bounded Heike source-mouth pilot; never writes runtime definitions."""

from pathlib import Path
import copy
import hashlib
import importlib.util
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[5]
SOURCES = ROOT / "assets/sprite-sources/street-speaker-motion/heike-hoffmann"
OUTPUT = ROOT / "output/ambient-city-animation/heike-source-mouths-v1"
OUTPUT.mkdir(parents=True, exist_ok=True)
FONT = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 12)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


CARDINALS = SOURCES / "registered-cardinals-v3-candidate.png"
QUARTERS = SOURCES / "registered-quarters-v3-candidate.png"
EXPECTED = {
    CARDINALS: "bfe0660b663a96ac545dfa3da55e37851b16a64a95cb60d9eff66855915badfc",
    QUARTERS: "d15436d552353fa0c91f8c16e95f790785e90645067e3d50c3a21bfe4585605f",
}
for path, expected in EXPECTED.items():
    assert sha(path) == expected, path

VIEWS = {
    "down": (CARDINALS, 0, (230, 290, 209, 235)),
    "front-right": (QUARTERS, 0, (245, 310, 213, 240)),
    "right": (CARDINALS, 1, (294, 338, 207, 236)),
    "left": (CARDINALS, 3, (171, 215, 207, 238)),
    "front-left": (QUARTERS, 3, (175, 224, 214, 242)),
}

ORIGINAL = ROOT / "assets/sprite-sources/street-quiz/heike-hoffmann-keys.png"
SOURCE_REGISTRATION = SOURCES / "source-registration-v3.json"
OWN_INPUTS = SOURCES / "mouth-source-v1/own-original-mouth-inputs-v1.json"
HELPER = ROOT / "tools/build-street-mouths.py"
assert sha(ORIGINAL) == "fae6498e2a8b81b149f514c9c815ea586e64424b2f41ac22c40cbb52cab39605"
assert sha(SOURCE_REGISTRATION) == "2077f71af5ae6ce6ac11c0e895c1a202dc31bd761d8a9039448df76f4e605d79"
assert sha(OWN_INPUTS) == "69cb36d3d1f37a2bdcc2cdbd17e5fe4ac6edbbae55e0a3d11076bb0258b17afe"


def own_cardinal(name, sheet, view):
    """Map existing own-source crease fit through the exact held registration."""
    source = copy.deepcopy(sheet["registrations"][name])
    mapping = view["views"][name]
    assert source["input"] == sheet["originalSource"]
    assert mapping["source"] == sheet["originalSource"]["file"]
    assert mapping["sourceSha256"] == sheet["originalSource"]["sha256"]
    x0, y0, x1, y1 = mapping["component_bounds"]
    assert 0 <= x0 < x1 <= sheet["originalSource"]["dimensions"][0]
    assert 0 <= y0 < y1 <= sheet["originalSource"]["dimensions"][1]
    assert all(x0 <= x <= x1 and y0 <= y <= y1 for points in source["contoursPx"].values() for x, y in points)
    assert len(mapping["workingOrigin"]) == 2 and mapping["scale"] > 0
    scale = mapping["scale"]
    origin = np.array(mapping["workingOrigin"])
    col = {"down": 0, "right": 1, "left": 3}[name]

    def point(p):
        return (np.array(p) * scale + origin + [col * 512, 0]).round(6).tolist()

    source["input"] = {
        "file": str(CARDINALS.relative_to(ROOT)).replace("\\", "/"),
        "sha256": sha(CARDINALS),
        "dimensions": [2048, 512],
    }
    source["centerPx"] = point(source["centerPx"])
    source["axesPx"] = (np.array(source["axesPx"]) * scale).round(6).tolist()
    source["contoursPx"] = {key: [point(p) for p in points] for key, points in source["contoursPx"].items()}
    source["cell"] = [512, 512]
    source["cellOriginPx"] = [col * 512, 0]
    source["width"] = {"down": [.035, .18], "right": [.015, .10], "left": [.015, .10]}[name]
    source["fitEvidence"] = {
        "status": "own cardinal source pixel fit transported to exact registered v3 source; CPU review candidate",
        "originalOwnCardinalInput": str(OWN_INPUTS.relative_to(ROOT)).replace("\\", "/"),
        "originalOwnCardinalInputSha256": sha(OWN_INPUTS),
        "historicalGlobalRegistration": sheet["historicalGlobalRegistration"],
        "observation": "Painted closed crease; no cavity or teeth. Upper red ridge is lip paint, not oral opening.",
    }
    return source


def own_quarter(name, col, points, upper, lower, center, axes):
    """Actual registered quarter-cell native pixels, not an interpolated cardinal."""
    origin = np.array([col * 512, 0])

    def global_points(local):
        return (np.array(local, float) + origin).round(6).tolist()

    contour = {
        "crease": global_points(points),
        "source_upper": global_points(points),
        "source_lower": global_points(points),
        "open_upper": global_points(upper),
        "open_lower": global_points(lower),
    }
    return {
        "input": {"file": str(QUARTERS.relative_to(ROOT)).replace("\\", "/"), "sha256": sha(QUARTERS), "dimensions": [2048, 512]},
        "centerPx": (np.array(center) + origin).tolist(),
        "axesPx": axes,
        "coordinateSystem": "registered sheet pixels; +X right, +Y down; tangent and normal extents",
        "contoursPx": contour,
        "width": [.025, .15],
        "teeth": 0,
        "cell": [512, 512],
        "cellOriginPx": [col * 512, 0],
        "fitEvidence": {
            "status": "actual own 512 px quarter-source fit candidate; CPU review pending",
            "observation": "Visible closed lip crease, attached corners, no pre-open cavity and no teeth.",
        },
    }


def profiles():
    view = json.loads(SOURCE_REGISTRATION.read_text())
    sheet = json.loads(OWN_INPUTS.read_text())
    assert sheet["schemaVersion"] == 1 and set(sheet["registrations"]) == {"down", "right", "left"}
    assert sheet["originalSource"] == {"file": str(ORIGINAL.relative_to(ROOT)).replace("\\", "/"),
                                       "sha256": sha(ORIGINAL), "dimensions": [1448, 1086]}
    assert sheet["historicalGlobalRegistration"] == {
        "file": "assets/sprite-sources/street-mouths/registration.json",
        "sha256": "482488f8160f5092050a78ffaf5663282cf5f43f1a5d50742235baabb5d3b84d",
    }
    fitted = {name: own_cardinal(name, sheet, view) for name in ("down", "right", "left")}
    fitted["front-right"] = own_quarter(
        "front-right", 0,
        [(250, 222), (262.5, 222.3), (275, 223), (287.5, 223), (300, 223)],
        [(250, 222), (262.5, 221.4), (275, 220.6), (287.5, 221.2), (300, 223)],
        [(250, 222), (262.5, 226.5), (275, 228.2), (287.5, 227.5), (300, 223)],
        [275, 223], [50, 1, -0.28, 14],
    )
    fitted["front-left"] = own_quarter(
        "front-left", 3,
        [(183, 220.5), (191.25, 221.5), (199.5, 222.5), (207.75, 223.4), (216, 224)],
        [(183, 220.5), (191.25, 220.3), (199.5, 220.1), (207.75, 221.8), (216, 224)],
        [(183, 220.5), (191.25, 225), (199.5, 227.1), (207.75, 227), (216, 224)],
        [199.5, 222.5], [33, 3.5, -0.98, 9.24],
    )
    return {name: fitted.get(name) for name in ("down", "front-right", "right", "rear-right", "up", "rear-left", "left", "front-left")}


def render():
    module = importlib.util.spec_from_file_location("street_mouth_helper", HELPER)
    helper = importlib.util.module_from_spec(module)
    module.loader.exec_module(helper)
    own_inputs = json.loads(OWN_INPUTS.read_text())
    result = profiles()
    compiled = {}
    checks = {}
    for name, entry in result.items():
        if entry is None:
            compiled[name] = None
            continue
        reg = helper.compile_registration(entry)
        compiled[name] = {key: reg[key] for key in ("rect", "axes", "profile")}
        source = Image.open(ROOT / entry["input"]["file"]).convert("RGBA")
        col = entry["cellOriginPx"][0] // 512
        cell = source.crop((col * 512, 0, (col + 1) * 512, 512))
        local = copy.deepcopy(entry)
        local["centerPx"] = (np.array(entry["centerPx"]) - entry["cellOriginPx"]).tolist()
        local["contoursPx"] = {key: (np.array(points) - entry["cellOriginPx"]).tolist() for key, points in entry["contoursPx"].items()}
        local["previewCropPx"] = [col * 512, 0, (col + 1) * 512, 512]
        cue_images = {
            "inactive": cell,
            "owned-closed": helper.preview(local, reg, 0),
            "open": helper.preview(local, reg, 1),
        }
        rounded = copy.deepcopy(reg)
        rp = rounded["profile"]
        rp["open_upper"] = [c - d for c, d in zip(rp["crease"], [0, .07, .25, .07, 0])]
        rp["open_lower"] = [c + d for c, d in zip(rp["crease"], [0, .07, .27, .07, 0])]
        cue_images["rounded-approx"] = helper.preview(local, rounded, 1)
        bite = copy.deepcopy(reg)
        bp = bite["profile"]
        bp["open_upper"] = [c - d for c, d in zip(bp["crease"], [0, .06, .11, .06, 0])]
        bp["open_lower"] = [c + d for c, d in zip(bp["crease"], [0, .025, .045, .025, 0])]
        cue_images["bite-contact-approx"] = helper.preview(local, bite, 1)
        original_rgba = np.asarray(cell)
        checks[name] = {}
        for cue, im in cue_images.items():
            im.save(OUTPUT / f"{name}-{cue}-cell.png")
            rendered = np.asarray(im)
            alpha_equal = bool(np.array_equal(rendered[:, :, 3], original_rgba[:, :, 3]))
            difference = int(np.count_nonzero(np.any(rendered[:, :, :3] != original_rgba[:, :, :3], axis=2)))
            assert alpha_equal, (name, cue)
            if cue == "inactive":
                assert difference == 0, (name, cue)
            if cue not in ("inactive", "owned-closed"):
                assert difference > 0, (name, cue)
            checks[name][cue] = {"sourceAlphaExact": alpha_equal, "changedRgbPixels": difference}
        cx, cy = local["centerPx"]
        box = (max(0, int(cx) - 35), max(0, int(cy) - 20), min(512, int(cx) + 36), min(512, int(cy) + 22))
        for theme, background in (("light", "#eee8db"), ("dark", "#25272b")):
            zoom = 6
            tile_width, tile_height = (box[2] - box[0]) * zoom, (box[3] - box[1]) * zoom
            board = Image.new("RGB", (tile_width * len(cue_images), tile_height + 26), background)
            draw = ImageDraw.Draw(board)
            for index, (cue, im) in enumerate(cue_images.items()):
                crop = im.crop(box).resize((tile_width, tile_height), Image.Resampling.NEAREST)
                x = index * tile_width
                board.paste(crop, (x, 26), crop)
                draw.text((x + 3, 5), cue, font=FONT, fill="#eee8db" if theme == "dark" else "#222")
            board.save(OUTPUT / f"{name}-all-cues-{theme}.png")
        helper.review_board("heike-hoffmann", name, entry, reg, OUTPUT)
    record = {
        "schemaVersion": 1,
        "status": "source-cue pilot only; no runtime/full-motion approval",
        "inputHashes": {str(path.relative_to(ROOT)).replace("\\", "/"): sha(path) for path in (CARDINALS, QUARTERS, ORIGINAL, SOURCE_REGISTRATION, OWN_INPUTS, HELPER)},
        "historicalGlobalRegistration": own_inputs["historicalGlobalRegistration"],
        "sourceSheetOrder": {"cardinals": ["down", "right", "up", "left"], "quarters": ["front-right", "rear-right", "rear-left", "front-left"]},
        "nullReasons": {name: "Actual rear or rear-quarter source: no visible mouth" for name in ("rear-right", "up", "rear-left")},
        "registrations": result,
        "compiledSourceCells": compiled,
        "cpuChecks": checks,
        "limits": ["Inactive is exact source crop; active cues are offline CPU approximations, not GPU or moving-field validation.", "Profiles specify own bounded spread/round width response, but the current CPU helper fixes widthFactor=1; rounded and bite-contact images show target-contour approximations only and do not prove runtime rounded or biting behavior. No teeth are painted or invented.", "Action keys, body transport, encoded atlases, native playback, mobile/device rendered checks, runtime installation and audio sync remain outside this task."],
    }
    (SOURCES / "mouth-source-v1/source-mouth-profiles-v1.json").write_text(json.dumps(record, indent=2) + "\n")



def grid():
    for name, (path, col, (x0, x1, y0, y1)) in VIEWS.items():
        source = Image.open(path).convert("RGBA")
        im = source.crop((col * 512 + x0, y0, col * 512 + x1, y1))
        im = im.resize(((x1 - x0) * 10, (y1 - y0) * 10), Image.Resampling.NEAREST)
        draw = ImageDraw.Draw(im)
        for y in range(y0, y1 + 1, 5):
            draw.line((0, (y - y0) * 10, im.width, (y - y0) * 10), fill=(0, 255, 255, 120))
            draw.text((1, (y - y0) * 10 + 1), str(y), font=FONT, fill="white", stroke_width=1, stroke_fill="black")
        for x in range(x0, x1 + 1, 5):
            draw.line(((x - x0) * 10, 0, (x - x0) * 10, im.height), fill=(0, 255, 255, 120))
            draw.text(((x - x0) * 10 + 1, 1), str(x), font=FONT, fill="white", stroke_width=1, stroke_fill="black")
        im.save(OUTPUT / f"{name}-grid10x.png")


if __name__ == "__main__":
    grid()
    render()
