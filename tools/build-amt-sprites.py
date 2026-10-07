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


def source_pose(image: Image.Image, column: int = 0,
                cell: tuple[int, int] = CELL, figure: tuple[int, int] = FIGURE) -> np.ndarray:
    if image.size != (1536, 1024):
        raise ValueError(f"Expected 1536x1024, found {image.size}")
    # Generated pose strips sometimes leave a sliver of the next character in
    # this column. Keep the connected painted figure before scaling the cell.
    raw = np.array(image.crop((column * 384, 0, (column + 1) * 384, 1024)))
    count, regions, statistics, _ = cv2.connectedComponentsWithStats(
        (raw[:, :, 3] >= 12).astype(np.uint8), connectivity=8)
    component = 1 + int(np.argmax(statistics[1:, cv2.CC_STAT_AREA]))
    raw[regions != component] = 0
    crop = Image.fromarray(raw, "RGBA").resize(figure, Image.Resampling.LANCZOS)
    sheet = Image.new("RGBA", cell, (0, 0, 0, 0))
    sheet.paste(crop, ((cell[0] - figure[0]) // 2, (cell[1] - figure[1]) // 2))
    pixels = np.array(sheet)
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


def clerk_mouth(pose: np.ndarray, opening: float, resolution: int = 1) -> np.ndarray:
    """Articulate only Frau Knick's painted lower lip while her voice owns the line."""
    if opening <= 0:
        return pose
    result = pose.copy()
    # Coordinates are in the registered 192x416 first clerk pose; the stamp,
    # face silhouette and source paint outside this mouth patch stay intact.
    x0, x1, y0, y1 = [value * resolution for value in (106, 139, 72, 94)]
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    px, py = xx / resolution, yy / resolution
    influence = np.exp(-((px - 121) / 13) ** 2) * np.exp(-((py - 82) / 6) ** 2)
    shift = np.maximum(0, py - 79) / 12 * 2.8 * opening * influence * resolution
    patch = pose[y0:y1, x0:x1].astype(np.float32) / 255
    patch[:, :, :3] *= patch[:, :, 3:4]
    sampled = cv2.remap(patch, xx - x0, yy - y0 - shift, cv2.INTER_LINEAR,
                        borderMode=cv2.BORDER_CONSTANT)
    alpha = sampled[:, :, 3:4]
    rgb = np.divide(sampled[:, :, :3], alpha,
                    out=np.zeros_like(sampled[:, :, :3]), where=alpha > .002)
    result[y0:y1, x0:x1] = np.uint8(np.clip(np.concatenate((rgb, alpha), axis=2) * 255, 0, 255))
    # Reveal the existing dark lip pigment as an opening, with a soft, tapered
    # edge so the change reads at the first-person counter distance.
    aperture = np.clip(1 - ((px - 121) / 10) ** 2 - ((py - (81.5 + opening)) / (1.1 + 1.25 * opening)) ** 2, 0, 1)
    weight = aperture[:, :, None] * (.9 * opening)
    result[y0:y1, x0:x1, :3] = np.uint8(result[y0:y1, x0:x1, :3] * (1 - weight) +
                                            np.array([72, 29, 26]) * weight)
    result[result[:, :, 3] < 8] = 0
    return result


def build_clerk_performance() -> None:
    source = SOURCE / "clerk-source.png"
    image = Image.open(source).convert("RGBA")
    poses = [source_pose(image, column) for column in range(4)]
    row_names = ("idle", "review", "raise", "stamp", "deny", "talk")
    source_columns = (0, 3, 1, 2, 3, 0)
    report = {"source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
              "rows": row_names, "frames_per_row": 8}
    for cell, suffix in ((CELL, ""), ((128, 288), "-mobile")):
        sheet = Image.new("RGBA", (cell[0] * 8, cell[1] * len(row_names)))
        for row, column in enumerate(source_columns):
            breath = idle_frames(poses[column], "clerk")
            for col in range(8):
                frame = breath[col * 8]
                if row == 5:
                    frame = clerk_mouth(frame, (0, .35, .9, .55, .12, 1, .5, .15)[col])
                part = Image.fromarray(frame, "RGBA")
                if cell != CELL:
                    part = part.resize(cell, Image.Resampling.LANCZOS)
                sheet.alpha_composite(part, (col * cell[0], row * cell[1]))
        path = OUTPUT / f"clerk-performance{suffix}.webp"
        sheet.save(path, "WEBP", quality=88 if not suffix else 82, method=4)
        report[suffix or "desktop"] = {"sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                                         "bytes": path.stat().st_size}
        review = Image.new("RGB", sheet.size, "#b8b3a4")
        encoded = Image.open(path).convert("RGBA")
        review.paste(encoded, mask=encoded.getchannel("A"))
        review.resize((sheet.width // 2, sheet.height // 2), Image.Resampling.LANCZOS).save(
            QA / f"clerk-performance{suffix}-contact.png")
    detail_poses = [source_pose(image, column, (384, 832), (288, 768)) for column in range(4)]
    detail = Image.new("RGBA", (384 * 8, 832 * 2))
    for row, column in enumerate(source_columns):
        detail.alpha_composite(Image.fromarray(detail_poses[column], "RGBA"), (row * 384, 0))
    for col, opening in enumerate((0, .35, .9, .55, .12, 1, .5, .15)):
        part = clerk_mouth(detail_poses[0], opening, 2)
        detail.alpha_composite(Image.fromarray(part, "RGBA"), (col * 384, 832))
    detail_path = OUTPUT / "clerk-performance-detail.webp"
    detail.save(detail_path, "WEBP", quality=94, method=5)
    encoded_detail = Image.open(detail_path).convert("RGBA")
    for index in range(14):
        row, col = (0, index) if index < 6 else (1, index - 6)
        box = encoded_detail.crop((col * 384, row * 832, (col + 1) * 384, (row + 1) * 832)).getbbox()
        if not box or min(box[0], box[1], 384 - box[2], 832 - box[3]) < 8:
            raise ValueError(f"Clerk detail pose {index} lost its alpha gutter: {box}")
    report["detail"] = {"sha256": hashlib.sha256(detail_path.read_bytes()).hexdigest(),
                        "bytes": detail_path.stat().st_size}
    (QA / "clerk-performance-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--name", choices=NAMES)
    parser.add_argument("--clerk-performance", action="store_true")
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)
    if args.clerk_performance:
        build_clerk_performance()
        return
    report_path = OUTPUT / "build-report.json"
    report = json.loads(report_path.read_text(encoding="utf-8")) if report_path.exists() else {}
    for name in (args.name,) if args.name else NAMES:
        source = SOURCE / f"{name}-source.png"
        source_image = Image.open(source).convert("RGBA")
        frames = idle_frames(source_pose(source_image), name)
        detail_path = OUTPUT / f"{name}-detail.webp" if name != "clerk" else None
        if detail_path:
            Image.fromarray(source_pose(source_image, cell=(384, 832), figure=(288, 768)), "RGBA").save(
                detail_path, "WEBP", quality=94, method=5)
            box = Image.open(detail_path).convert("RGBA").getbbox()
            if not box or min(box[0], box[1], 384 - box[2], 832 - box[3]) < 8:
                raise ValueError(f"{name}: detail pose lost its alpha gutter: {box}")
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
            **({"detail_sha256": hashlib.sha256(detail_path.read_bytes()).hexdigest(),
                "detail_bytes": detail_path.stat().st_size} if detail_path else {}),
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
