"""Deterministic, source-registered Aktenkurier Gaussian sculpture (offline only)."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "assets/buergeramt/omen"
SOURCE = ROOT / "assets/sprite-sources/buergeramt/aktenkurier"
DETAIL = ROOT / "assets/buergeramt/characters/aktenkurier-detail.webp"
HEIGHT = 1.96
WIDTH = HEIGHT * 320 / 416
PIXEL = HEIGHT / 832
DTYPE = np.dtype([("position", "<f4", (3,)), ("scale", "<f4", (3,)),
                  ("rgba", "u1", (4,)), ("rotation_wxyz", "u1", (4,))])


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sculpture(image):
    """Two painted curved surfaces close a volume; landmarks are in gesture.png."""
    alpha = image[:, :, 3]
    yy, xx = np.mgrid[:832, :640]
    # frame(resolution=2) in amt-character-motion.py uses a 910px intermediate,
    # positioned at (-135, -53). This inverse is only for anatomical landmarks;
    # final XY/color registration always uses the exact accepted detail pixels.
    x = (xx + 135.5) * 512 / 910 - .5
    y = (yy + 53.5) * 512 / 910 - .5
    radial = np.zeros(alpha.shape)
    width = np.zeros(alpha.shape)
    for row in range(832):
        indices = np.flatnonzero(alpha[row] >= 32)
        runs = np.split(indices, np.flatnonzero(np.diff(indices) > 1) + 1)
        for run in runs:
            if not len(run):
                continue
            mid = (run[0] + run[-1]) / 2
            radius = (len(run) + 1) / 2
            radial[row, run] = np.sqrt(np.maximum(0, 1 - ((run - mid) / radius) ** 2))
            width[row, run] = len(run) * PIXEL
    front = .006 + np.minimum(.10, width * .38) * radial

    def ellipse(cx, cy, rx, ry, depth, offset=0):
        radius = 1 - ((x - cx) / rx) ** 2 - ((y - cy) / ry) ** 2
        return np.where(radius > 0, offset + depth * np.sqrt(np.maximum(0, radius)), 0)

    def limb(ax, ay, bx, by, radius, depth, offset):
        t = np.clip(((x - ax) * (bx - ax) + (y - ay) * (by - ay)) /
                    ((bx - ax) ** 2 + (by - ay) ** 2), 0, 1)
        d = ((x - ax - t * (bx - ax)) ** 2 + (y - ay - t * (by - ay)) ** 2) / radius ** 2
        return np.where(d < 1, offset + depth * np.sqrt(np.maximum(0, 1 - d)), 0)

    # ponytail: authored relief and back shell qualify only the brief +/-25deg
    # turn; use a real multi-view capture if full orbit/animation becomes needed.
    for component in (
        ellipse(270, 88, 30, 38, .135),              # skull/hair
        ellipse(270, 117, 15, 22, .09),              # neck
        ellipse(267, 230, 57, 160, .16),             # long coat and torso
        ellipse(236, 418, 19, 55, .085),
        ellipse(286, 419, 18, 55, .085),             # two distinct legs
        ellipse(221, 466, 27, 14, .115),
        ellipse(297, 466, 28, 14, .115),             # shoes
        limb(232, 131, 188, 151, 18, .065, .045),
        limb(188, 151, 247, 145, 13, .065, .12),     # crossing sleeve/hand
        limb(311, 161, 323, 210, 16, .07, .07),
        limb(323, 210, 280, 208, 15, .065, .16),     # file-supporting arm
    ):
        front = np.maximum(front, component)
    front += ellipse(269, 98, 7, 13, .043)           # nose projects from face
    files = (x > 261) & (x < 314) & (y > 155) & (y < 244)
    front = np.where(files, np.maximum(front, .205 + .012 * (x - 261) / 53), front)
    back = -.009 - np.minimum(.145, width * .40) * radial
    return front, back, x, y


def build():
    source_image = Image.open(SOURCE / "gesture.png").convert("RGBA")
    assert source_image.size == (512, 512)
    image = np.asarray(Image.open(DETAIL).convert("RGBA").crop((640, 0, 1280, 832)))
    rear = np.asarray(Image.open(SOURCE / "up.png").convert("RGBA"))
    front_z, back_z, working_x, working_y = sculpture(image)
    yy, xx = np.mgrid[:832, :640]
    visible = image[:, :, 3] >= 32
    # Per-pixel face paint and 2px upper-body sampling preserve the close gesture.
    # Lower coat/legs and hidden rear retain coarser coverage within 40k records.
    face = (working_x >= 244) & (working_x <= 300) & (working_y >= 61) & (working_y <= 127)
    detailed = working_y < 350
    front_mask = visible & np.where(face, True, np.where(detailed,
                                  (xx % 2 == 0) & (yy % 2 == 0),
                                  (xx % 3 == 1) & (yy % 3 == 1)))
    rear_mask = visible & (xx % 5 == 2) & (yy % 5 == 2)
    records = []
    for front, mask in ((True, front_mask), (False, rear_mask)):
        py, px = np.nonzero(mask)
        n = len(px)
        r = np.zeros(n, dtype=DTYPE)
        r["position"][:, 0] = ((px + .5) / 640 - .5) * WIDTH
        r["position"][:, 1] = (1 - (py + .5) / 832) * HEIGHT
        r["position"][:, 2] = (front_z if front else back_z)[py, px]
        spacing = np.where(face[py, px], 1, np.where(detailed[py, px], 2, 3)) if front else np.full(n, 5)
        sigma = np.where(face[py, px], .62, .61) if front else .70
        r["scale"][:, :2] = (spacing * sigma * PIXEL)[:, None]
        # Thick front kernels project into XY blur during a turn, especially eyes.
        r["scale"][:, 2] = np.where(face[py, px], .0009, .002) if front else .0065
        # Identity rotation keeps the collapsed XY Gaussian footprint unchanged.
        r["rotation_wxyz"] = [255, 128, 128, 128]
        r["rgba"] = image[py, px]
        if not front:
            # Map each row of the accepted rear painting to the gesture's row.
            # This authors hidden coat/hair color, not new raster artwork.
            for row in np.unique(py):
                target = np.flatnonzero(py == row)
                ry = int(np.clip(round(working_y[row, 0]), 0, 511))
                source_run = np.flatnonzero(rear[ry, :, 3] >= 128)
                target_run = np.flatnonzero(visible[row])
                if len(source_run) and len(target_run) > 1:
                    u = (px[target] - target_run[0]) / (target_run[-1] - target_run[0])
                    sx = np.clip(np.rint(source_run[0] + u * (source_run[-1] - source_run[0])).astype(int), 0, 511)
                    colors = rear[ry, sx, :3]
                    good = rear[ry, sx, 3] >= 128
                    r["rgba"][target[good], :3] = colors[good]
            r["rgba"][:, :3] = np.rint(r["rgba"][:, :3] * .84).astype(np.uint8)
        records.append(r)
    data = np.concatenate(records)
    validate(data, image, len(records[0]))
    inputs = [SOURCE / "gesture.png", SOURCE / "up.png", DETAIL]
    meta = {
        "format": "splat: 32-byte little-endian XYZ/scale float32, RGBA uint8, WXYZ uint8",
        "method": "authored approximate Gaussian volume; not ML or multi-view reconstruction",
        "file": "aktenkurier.splat", "splats": len(data), "frontSplats": len(records[0]),
        "rearSplats": len(records[1]), "bytes": data.nbytes,
        "sha256": hashlib.sha256(data.tobytes()).hexdigest(),
        "sources": {str(p.relative_to(ROOT)).replace('\\', '/'): sha(p) for p in inputs},
        "detailCell": [640, 0, 1280, 832], "frame": [640, 832],
        "width": WIDTH, "height": HEIGHT, "planeCenter": [0, HEIGHT / 2, 0],
        "mapping": "X=((pixelX+0.5)/640-0.5)*width; Y=(1-(pixelY+0.5)/832)*height",
        "frontAxis": "+Z", "rearMarker": "position.z < 0; hide at collapse, fade with depth expansion",
        "centerBounds": [data["position"].min(axis=0).tolist(), data["position"].max(axis=0).tolist()],
        "maxSigma": data["scale"].max(axis=0).tolist(),
        "suggestedYawDegrees": [-25, 25], "sourceAlphaThreshold": 32,
        "samplingPixels": {"face": 1, "upperBody": 2, "lowerBody": 3, "rear": 5},
        "validation": "finite positive scales; count/byte bounds; exact source-pixel XY/RGBA; front/rear sign; deterministic bytes",
        "limitations": "Rear paint is row-registered approximation; no full orbit, articulated limbs, learned reconstruction or browser-performance claim.",
    }
    return data, meta, image


def validate(data, image, front_count):
    assert DTYPE.itemsize == 32 and 15000 <= len(data) <= 40000
    assert data.nbytes <= 1_300_000
    assert np.isfinite(data["position"]).all() and np.isfinite(data["scale"]).all()
    assert (data["scale"] > 0).all()
    assert (data["position"][:front_count, 2] > 0).all()
    assert (data["position"][front_count:, 2] < 0).all()
    front = data[:front_count]
    px = (front["position"][:, 0] / WIDTH + .5) * 640 - .5
    py = (1 - front["position"][:, 1] / HEIGHT) * 832 - .5
    assert np.abs(px - np.rint(px)).max() < .0001
    assert np.abs(py - np.rint(py)).max() < .0001
    assert np.array_equal(front["rgba"], image[np.rint(py).astype(int), np.rint(px).astype(int)])
    assert np.ptp(data["position"][:, 2]) > .3


def previews(data, image):
    """CPU orthographic Gaussian projection for QA; not a browser benchmark."""
    dest = ROOT / "output/omen-splat/asset"
    dest.mkdir(parents=True, exist_ok=True)
    images = []
    for angle, collapse in ((0, True), (-22, False), (0, False), (22, False)):
        view = data[data["position"][:, 2] > 0] if collapse else data
        xyz = view["position"].copy()
        if collapse:
            xyz[:, 2] = 0
        theta = math.radians(angle)
        c, s = math.cos(theta), math.sin(theta)
        x = xyz[:, 0] * c + xyz[:, 2] * s
        z = xyz[:, 2] * c - xyz[:, 0] * s
        px = (x / WIDTH + .5) * 640 - .5
        py = (1 - xyz[:, 1] / HEIGHT) * 832 - .5
        canvas = np.full((832, 640, 3), [32, 35, 32], dtype=np.float32)
        sx = np.sqrt((view["scale"][:, 0] * c) ** 2 + (view["scale"][:, 2] * s) ** 2) / PIXEL
        sy = view["scale"][:, 1] / PIXEL
        for i in np.argsort(z, kind="stable"):
            x0, x1 = max(0, int(px[i] - 3 * sx[i])), min(640, int(px[i] + 3 * sx[i]) + 1)
            y0, y1 = max(0, int(py[i] - 3 * sy[i])), min(832, int(py[i] + 3 * sy[i]) + 1)
            yy, xx = np.mgrid[y0:y1, x0:x1]
            a = np.exp(-.5 * (((xx - px[i]) / sx[i]) ** 2 + ((yy - py[i]) / sy[i]) ** 2))
            a = (a * view["rgba"][i, 3] / 255)[:, :, None]
            patch = canvas[y0:y1, x0:x1]
            patch[:] = patch * (1 - a) + view["rgba"][i, :3] * a
        im = Image.fromarray(np.uint8(np.clip(canvas, 0, 255)))
        ImageDraw.Draw(im).text((16, 12), "collapsed" if collapse else f"yaw {angle:+d} degrees", fill="white")
        im.save(dest / ("collapsed.png" if collapse else f"yaw-{angle:+d}.png"))
        images.append(im.resize((320, 416)))
    sheet = Image.new("RGB", (1280, 416))
    for i, im in enumerate(images):
        sheet.paste(im, (320 * i, 0))
    sheet.save(dest / "contact.png")
    print(f"CPU preview: {dest}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Rebuild in memory and verify shipped bytes/manifest")
    parser.add_argument("--preview", action="store_true", help="Write CPU Gaussian QA projections under ignored output/")
    args = parser.parse_args()
    data, manifest, source = build()
    payload = data.tobytes()
    metadata = json.dumps(manifest, indent=2) + "\n"
    if args.check:
        assert (DEST / "aktenkurier.splat").read_bytes() == payload, "Splat asset drift"
        assert (DEST / "manifest.json").read_text(encoding="utf-8") == metadata, "Manifest drift"
    else:
        DEST.mkdir(parents=True, exist_ok=True)
        (DEST / "aktenkurier.splat").write_bytes(payload)
        (DEST / "manifest.json").write_text(metadata, encoding="utf-8")
    if args.preview:
        previews(data, source)
    print(f"{'Verified' if args.check else 'Built'} {len(data)} splats / {len(payload)} bytes / {manifest['sha256']}")
