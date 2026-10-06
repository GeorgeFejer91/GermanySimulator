"""Build source-preserving Bürgeramt walk, work and turn atlases.

The ImageGen sheets are source art. This offline builder registers every view
with one figure scale, deforms intact pixels in linear light, and writes only
static WebP atlases for the browser.
"""

from __future__ import annotations

import hashlib
import argparse
import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy.ndimage import label

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/sprite-sources/buergeramt"
OUTPUT = ROOT / "assets/buergeramt/characters"
QA = ROOT / "output/amt-character-motion"
sys.path.insert(0, str(ROOT / ".agents/skills/animate-2d-characters/scripts"))
import painted_walk as walk  # noqa: E402

# Use painted_walk's linear-light conversion with OpenCV's bilinear sampler.
# Splitting the side-view garment from its 1px-connected shoe detached paint.
_linear = walk.linear(np.arange(256, dtype=np.float32) / 255)


def _premul(im: Image.Image) -> np.ndarray:
    rgba = np.asarray(im.convert("RGBA"))
    alpha = rgba[:, :, 3].astype(np.float32) / 255
    out = np.empty(rgba.shape, dtype=np.float32)
    out[:, :, :3] = _linear[rgba[:, :, :3]] * alpha[:, :, None]
    out[:, :, 3] = alpha
    return out


def _sample(p: np.ndarray, x: np.ndarray, y: np.ndarray) -> np.ndarray:
    return cv2.remap(p, x.astype(np.float32), y.astype(np.float32),
                     cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)


digest = walk.digest

CELL = (320, 416)
BASELINE = 400
WORKING_BASELINE = 480
ROWS = ("down", "right", "up", "left", "work", "gesture")
NAMES = ("aktenkurier", "archivbotin", "formularsammler")
def chroma_figure(panel: Image.Image) -> Image.Image:
    """Remove only exterior connected magenta from a source view."""
    rgb = np.array(panel.convert("RGB"))
    r, g, b = [rgb[:, :, n].astype(np.int16) for n in range(3)]
    candidate = (r > 100) & (b > 65) & (g < r * .42) & (g < b * .56)
    regions, count = label(candidate)
    edge = np.unique(np.concatenate((regions[0], regions[-1],
                                     regions[:, 0], regions[:, -1])))
    exterior = np.isin(regions, edge[edge > 0])
    foreground = (~exterior).astype(np.uint8)
    n, connected, stats, _ = cv2.connectedComponentsWithStats(foreground, connectivity=8)
    if n < 2:
        raise ValueError("No figure isolated from chroma")
    main = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    foreground = (connected == main).astype(np.uint8)
    alpha = cv2.GaussianBlur(cv2.erode(foreground, np.ones((2, 2), np.uint8)),
                             (0, 0), .65)
    alpha = np.clip(alpha * 255, 0, 255).astype(np.uint8)
    # One final edge-local magenta despill. Fully transparent RGB is cleared.
    bg = np.median(np.concatenate((rgb[:12].reshape(-1, 3),
                                   rgb[-12:].reshape(-1, 3))), axis=0)
    opacity = np.maximum(alpha.astype(np.float32) / 255, .01)
    corrected = (rgb.astype(np.float32) -
                 (1 - opacity[:, :, None]) * bg) / opacity[:, :, None]
    corrected = np.uint8(np.clip(corrected, 0, 255))
    corrected[alpha == 0] = 0
    return Image.fromarray(np.dstack((corrected, alpha)), "RGBA")


def alpha_figure(panel: Image.Image) -> Image.Image:
    rgba = np.array(panel.convert("RGBA"))
    mask = (rgba[:, :, 3] >= 12).astype(np.uint8)
    n, regions, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if n < 2:
        raise ValueError("Action source has no connected figure")
    main = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    rgba[regions != main] = 0
    rgba[rgba[:, :, 3] < 12] = 0
    return Image.fromarray(rgba, "RGBA")


def source_poses(name: str) -> dict[str, Image.Image]:
    sheet = Image.open(SOURCE / f"{name}-source.png")
    action = Image.open(SOURCE / f"{name}-action.png")
    if sheet.size != (1536, 1024) or action.size != (1536, 1024):
        raise ValueError(f"{name}: expected 1536x1024 source sheets")
    poses = {}
    for col, direction in enumerate(("down", "right", "up", "left")):
        print(f"{name}: extracting {direction}", flush=True)
        poses[direction] = chroma_figure(sheet.crop((col * 384, 0, (col + 1) * 384, 1024)))
    poses.update({direction: alpha_figure(action.crop((col * 768, 0, (col + 1) * 768, 1024)))
                  for col, direction in enumerate(("work", "gesture"))})
    return poses


def register_family(poses: dict[str, Image.Image]) -> dict[str, Image.Image]:
    bounds = {key: pose.getbbox() for key, pose in poses.items()}
    if any(box is None for box in bounds.values()):
        raise ValueError("Empty pose")
    height = max(box[3] - box[1] for box in bounds.values())
    factor = 432 / height
    registered = {}
    for key, pose in poses.items():
        box = bounds[key]
        scaled = pose.resize((round(pose.width * factor), round(pose.height * factor)),
                             Image.Resampling.LANCZOS)
        x = round(256 - (box[0] + box[2]) * factor / 2)
        y = round(WORKING_BASELINE - box[3] * factor)
        canvas = Image.new("RGBA", (512, 512))
        canvas.alpha_composite(scaled, (x, y))
        if canvas.getbbox() is None or canvas.getbbox()[0] <= 0 or canvas.getbbox()[2] >= 512:
            raise ValueError(f"{key}: registered figure clipped")
        registered[key] = canvas
    return registered


def frame(working: Image.Image) -> Image.Image:
    scale = 384 / 432
    im = working.resize((round(512 * scale), round(512 * scale)),
                        Image.Resampling.LANCZOS)
    cell = Image.new("RGBA", CELL)
    cell.alpha_composite(im, (round(CELL[0] / 2 - 256 * scale),
                              round(BASELINE - WORKING_BASELINE * scale)))
    box = cell.getbbox()
    if not box or box[0] < 4 or box[1] < 4 or box[2] > CELL[0] - 4 or box[3] > CELL[1] - 4:
        raise ValueError(f"Frame edge clipped: {box}")
    return cell


def idle(source: Image.Image, index: int) -> Image.Image:
    """Small planted breath without inventing new paint."""
    rgba = np.array(source)
    y, x = np.mgrid[:512, :512].astype(np.float32)
    phase = 2 * math.pi * index / 8
    upper = np.clip((410 - y) / 350, 0, 1)
    mx = (x - 1.15 * math.sin(phase) * upper).astype(np.float32)
    my = (y - 1.1 * math.sin(phase + .5) * upper).astype(np.float32)
    out = cv2.remap(rgba, mx, my, cv2.INTER_LINEAR,
                    borderMode=cv2.BORDER_CONSTANT)
    out[out[:, :, 3] < 8] = 0
    return Image.fromarray(out, "RGBA")


def connected(image: Image.Image) -> bool:
    mask = (np.asarray(image)[:, :, 3] >= 128).astype(np.uint8)
    _, _, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    return sum(int(row[cv2.CC_STAT_AREA]) >= 100 for row in stats[1:]) == 1


def continuous_walk(source: Image.Image, phase: float, travel: tuple[int, int],
                    strength: float = 1) -> Image.Image:
    """Warp the whole painted silhouette with a continuous leg field.

    A side-view shoe in these paintings touches its trouser by a 1px edge.
    Separating garment/legs in painted_walk disconnects it. A smooth field
    keeps the original paint and topology while the feet alternate subtly.
    """
    y, x = np.mgrid[:512, :512].astype(np.float32)
    middle = sum(source.getbbox()[::2]) / 2
    side = np.tanh((x - middle) / 16)
    leg = np.clip((y - 260) / 185, 0, 1)
    leg = leg * leg * (3 - 2 * leg)
    torso = np.clip((390 - y) / 350, 0, 1)
    stride = math.sin(phase)
    lift = math.cos(phase)
    paint = _premul(source)
    for amount in (strength, strength * .7, strength * .4, strength * .2, 0):
        sway = 1.5 * stride * torso * amount
        dx = sway + leg * side * (16 if travel[0] else 10) * stride * amount
        dy = -1.6 * math.cos(2 * phase) * torso * amount + leg * (side * 6 * stride - 3.5 * lift) * amount
        rendered = walk.unpack(_sample(paint, x - dx, y - dy))
        if connected(rendered):
            return rendered
    raise ValueError("Source silhouette remains detached without motion")


def build(name: str) -> dict:
    print(f"{name}: registering", flush=True)
    registered = register_family(source_poses(name))
    source_dir = SOURCE / name
    source_dir.mkdir(exist_ok=True)
    for kind, image in registered.items():
        image.save(source_dir / f"{kind}.png")
    atlas = Image.new("RGBA", (CELL[0] * 8, CELL[1] * len(ROWS)))
    row_images: dict[str, list[Image.Image]] = {}
    directions = ("down", "right", "up", "left")
    travel = ((0, 1), (1, 0), (0, -1), (-1, 0))
    for direction, vector in zip(directions, travel):
        print(f"{name}: walking {direction}", flush=True)
        pose = registered[direction]
        steps = [continuous_walk(pose, i * math.tau / 8, vector) for i in range(8)]
        row_images[direction] = [frame(im) for im in steps]
    for state in ("work", "gesture"):
        row_images[state] = [frame(idle(registered[state], i)) for i in range(8)]
    for row, state in enumerate(ROWS):
        for col, image in enumerate(row_images[state]):
            atlas.alpha_composite(image, (col * CELL[0], row * CELL[1]))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)
    output = OUTPUT / f"{name}-motion.webp"
    atlas.save(output, "WEBP", quality=88, method=4)
    mobile = OUTPUT / f"{name}-motion-mobile.webp"
    atlas.resize((CELL[0] * 4, CELL[1] * len(ROWS) // 2),
                 Image.Resampling.LANCZOS).save(mobile, "WEBP", quality=85, method=4)
    # The exact encoded cells are the review authority, including mobile.
    encoded = Image.open(output).convert("RGBA")
    digest_pixels = []
    for row in range(len(ROWS)):
        for col in range(8):
            cell = encoded.crop((col * CELL[0], row * CELL[1],
                                 (col + 1) * CELL[0], (row + 1) * CELL[1]))
            if not cell.getbbox():
                raise ValueError(f"Empty encoded cell {name} {row}:{col}")
            digest_pixels.append(hashlib.sha256(cell.tobytes()).hexdigest())
    contact = Image.new("RGB", (CELL[0] * 8, CELL[1] * len(ROWS)), "#b8b3a4")
    contact.paste(encoded, mask=encoded.getchannel("A"))
    contact.resize((CELL[0] * 4, CELL[1] * len(ROWS) // 2),
                   Image.Resampling.LANCZOS).save(QA / f"{name}-contact.png")
    mobile_encoded = Image.open(mobile).convert("RGBA")
    mobile_hashes = []
    for row in range(len(ROWS)):
        for col in range(8):
            cell = mobile_encoded.crop((col * CELL[0] // 2, row * CELL[1] // 2,
                                        (col + 1) * CELL[0] // 2, (row + 1) * CELL[1] // 2))
            if not cell.getbbox():
                raise ValueError(f"Empty mobile cell {name} {row}:{col}")
            mobile_hashes.append(hashlib.sha256(cell.tobytes()).hexdigest())
    mobile_contact = Image.new("RGB", mobile_encoded.size, "#b8b3a4")
    mobile_contact.paste(mobile_encoded, mask=mobile_encoded.getchannel("A"))
    mobile_contact.save(QA / f"{name}-mobile-contact.png")
    return {
        "source_sha256": digest(SOURCE / f"{name}-source.png"),
        "action_sha256": digest(SOURCE / f"{name}-action.png"),
        "atlas_sha256": digest(output),
        "cell": list(CELL), "rows": list(ROWS), "frames_per_row": 8,
        "desktop_bytes": output.stat().st_size,
        "mobile_sha256": digest(mobile), "mobile_bytes": mobile.stat().st_size,
        "encoded_pixel_sha256": digest_pixels,
        "mobile_encoded_pixel_sha256": mobile_hashes,
        "review": "pending exact-image visual analysis",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--name", choices=NAMES)
    args = parser.parse_args()
    selected = (args.name,) if args.name else NAMES
    QA.mkdir(parents=True, exist_ok=True)
    report_path = QA / "interaction-build-report.json"
    report = json.loads(report_path.read_text(encoding="utf-8")) if report_path.exists() else {}
    report.update({name: build(name) for name in selected})
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({name: {"bytes": info["desktop_bytes"],
                             "sha256": info["atlas_sha256"]}
                      for name, info in report.items()}, indent=2))


if __name__ == "__main__":
    main()
