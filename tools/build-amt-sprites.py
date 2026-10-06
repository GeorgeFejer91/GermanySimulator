"""Bake 64 connected Bürgeramt idle frames at 24 fps from one painted pose.

Other source poses remain candidate action keys. Whole-pose transitions require
separate visual approval; this loop never crossfades or switches anatomy.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/sprite-sources/buergeramt"
OUTPUT = ROOT / "assets/buergeramt/characters"
QA = ROOT / "output/buergeramt-sprite-qa"
NAMES = ("clerk", "renter", "parent", "pensioner")
GRID, COUNT, FPS = 8, 64, 24
CELL, FIGURE = (192, 416), (144, 384)


def source_pose(image: Image.Image) -> np.ndarray:
    if image.size != (1536, 1024):
        raise ValueError(f"Expected 1536x1024, found {image.size}")
    # Generated pose strips sometimes leave a sliver of the next character in
    # this column. Keep the connected painted figure before scaling the cell.
    raw = np.array(image.crop((0, 0, 384, 1024)))
    count, regions, statistics, _ = cv2.connectedComponentsWithStats(
        (raw[:, :, 3] >= 12).astype(np.uint8), connectivity=8)
    figure = 1 + int(np.argmax(statistics[1:, cv2.CC_STAT_AREA]))
    raw[regions != figure] = 0
    crop = Image.fromarray(raw, "RGBA").resize(FIGURE, Image.Resampling.LANCZOS)
    cell = Image.new("RGBA", CELL, (0, 0, 0, 0))
    cell.paste(crop, (24, 16))
    pixels = np.array(cell)
    pixels[pixels[:, :, 3] < 12] = 0
    return pixels


def idle_frames(pose: np.ndarray, character: str) -> list[np.ndarray]:
    h, w = pose.shape[:2]
    x, y = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    height_weight = np.clip((h - 16 - y) / 384, 0, 1) ** 1.35
    chest_weight = np.exp(-((y - 185) / 82) ** 2)
    head_weight = np.exp(-((y - 74) / 57) ** 2)
    base = pose.astype(np.float32) / 255
    base[:, :, :3] *= base[:, :, 3:4]
    amplitude = {"clerk": 3.3, "renter": 4.5, "parent": 3.8, "pensioner": 2.7}[character]
    frames = []
    for index in range(COUNT):
        phase = 2 * math.pi * index / COUNT
        sway = amplitude * math.sin(phase)
        breath = 0.012 * math.sin(phase * 2 + 0.7)
        nod = 1.7 * math.sin(phase + 0.8)
        map_x = 96 + (x - 96) / (1 + breath * chest_weight) - sway * height_weight
        map_y = y - nod * head_weight - 1.3 * math.sin(phase * 2) * chest_weight
        warped = cv2.remap(base, map_x.astype(np.float32), map_y.astype(np.float32),
                           cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        alpha = warped[:, :, 3:4]
        rgb = np.divide(warped[:, :, :3], alpha,
                        out=np.zeros_like(warped[:, :, :3]), where=alpha > .002)
        frame = np.uint8(np.clip(np.concatenate((rgb, alpha), axis=2) * 255, 0, 255))
        frame[frame[:, :, 3] < 8] = 0
        frames.append(frame)
    return frames


def atlas(frames: list[np.ndarray], cell: tuple[int, int]) -> Image.Image:
    image = Image.new("RGBA", (cell[0] * GRID, cell[1] * GRID), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        part = Image.fromarray(frame, "RGBA")
        if part.size != cell:
            part = part.resize(cell, Image.Resampling.LANCZOS)
        image.paste(part, ((index % GRID) * cell[0], (index // GRID) * cell[1]))
    return image


def inspect_margins(frames: list[np.ndarray]) -> tuple[int, int]:
    min_x, min_y = 999, 999
    for frame in frames:
        yy, xx = np.where(frame[:, :, 3] >= 16)
        if not len(xx):
            raise ValueError("Empty sprite frame")
        min_x = min(min_x, int(xx.min()), CELL[0] - 1 - int(xx.max()))
        min_y = min(min_y, int(yy.min()), CELL[1] - 1 - int(yy.max()))
    if min_x < 12 or min_y < 8:
        raise ValueError(f"Insufficient atlas gutter: x={min_x}, y={min_y}")
    return min_x, min_y


def inspect_encoded(path: Path, cell: tuple[int, int]) -> tuple[int, int, int]:
    pixels = np.array(Image.open(path).convert("RGBA"))
    min_x, min_y, signatures = 999, 999, set()
    for index in range(COUNT):
        x0, y0 = index % GRID * cell[0], index // GRID * cell[1]
        frame = pixels[y0:y0 + cell[1], x0:x0 + cell[0]]
        yy, xx = np.where(frame[:, :, 3] >= 16)
        if not len(xx):
            raise ValueError(f"Encoded cell {index} is empty: {path}")
        min_x = min(min_x, int(xx.min()), cell[0] - 1 - int(xx.max()))
        min_y = min(min_y, int(yy.min()), cell[1] - 1 - int(yy.max()))
        signatures.add(hashlib.sha256(frame.tobytes()).digest())
    required = (12, 8) if cell == CELL else (8, 5)
    if min_x < required[0] or min_y < required[1] or len(signatures) != COUNT:
        raise ValueError(f"Encoded atlas failed gutter/uniqueness: {path}, "
                         f"margin={(min_x, min_y)}, distinct={len(signatures)}")
    return min_x, min_y, len(signatures)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--name", choices=NAMES)
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)
    report_path = OUTPUT / "build-report.json"
    report = json.loads(report_path.read_text(encoding="utf-8")) if report_path.exists() else {}
    for name in (args.name,) if args.name else NAMES:
        source = SOURCE / f"{name}-source.png"
        frames = idle_frames(source_pose(Image.open(source).convert("RGBA")), name)
        margin_x, margin_y = inspect_margins(frames)
        encoded = {}
        for size, suffix in ((CELL, ""), ((128, 288), "-mobile")):
            output = OUTPUT / f"{name}{suffix}.webp"
            atlas(frames, size).save(output, "WEBP", quality=86 if not suffix else 78, method=4)
            encoded[suffix or "desktop"] = inspect_encoded(output, size)
        preview = [Image.fromarray(frame, "RGBA").resize((128, 288), Image.Resampling.LANCZOS)
                   for frame in frames]
        background = Image.new("RGB", (128, 288), (185, 179, 163))
        opaque = []
        for frame in preview:
            composite = background.copy()
            composite.paste(frame, (0, 0), frame)
            opaque.append(composite)
        opaque[0].save(QA / f"{name}-motion.gif", save_all=True,
                       append_images=opaque[1:], duration=round(1000 / FPS), loop=0)
        report[name] = {
            "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "desktop_sha256": hashlib.sha256((OUTPUT / f"{name}.webp").read_bytes()).hexdigest(),
            "mobile_sha256": hashlib.sha256((OUTPUT / f"{name}-mobile.webp").read_bytes()).hexdigest(),
            "frame_count": len(frames), "fps": FPS, "cell": CELL,
            "minimum_alpha_margin": [margin_x, margin_y],
            "encoded_desktop_margin_and_distinct": encoded["desktop"],
            "encoded_mobile_margin_and_distinct": encoded["-mobile"],
            "desktop_bytes": (OUTPUT / f"{name}.webp").stat().st_size,
            "mobile_bytes": (OUTPUT / f"{name}-mobile.webp").stat().st_size,
        }
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
