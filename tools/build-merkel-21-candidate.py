#!/usr/bin/env python3
"""Build the preview-only 21-point Merkel gait candidate.

ImageGen supplies eight sparse directional keys.  This builder registers those
keys once, freezes a direction-specific head/torso identity plate, interpolates
only the remaining motion layer, and emits 20 playable cells plus an exact
closing audit cell.  It never writes the game runtime atlas.
"""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/sprite-sources/candidates/merkel-21"
RAW = OUT / "raw"
WORKING_CELL = 512
REVIEW_CELL = 256
RUNTIME_CELL = 128
PLAYBACK_FRAMES = 20
INSPECTION_FRAMES = 21
GROUND_Y = 474
KEY_INDICES = (0, 2, 5, 7, 10, 12, 15, 17)
KEY_NAMES = (
    "contact-a", "loading-a", "passing-a", "push-off-a",
    "contact-b", "loading-b", "passing-b", "push-off-b",
)
DIRECTIONS = ("left", "right", "back", "front")
RAW_SHEETS = {direction: RAW / f"{direction}-keys-generated.png" for direction in DIRECTIONS}
IDENTITY_SOURCE = ROOT / "assets/sprite-archive/pre-rig-20260921/assets/sprite-sources/merkel-sprite-keys.png"
IDENTITY_ROWS = {"left": 1, "right": 2, "back": 3, "front": 4}
ROW_NAMES = ("front-idle", "left-walk", "right-walk", "back-walk", "front-walk")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def clean_rgba(image: Image.Image) -> Image.Image:
    array = np.array(image.convert("RGBA"), dtype=np.uint8)
    array[array[:, :, 3] < 4] = 0
    return Image.fromarray(array, "RGBA")


def premultiplied_resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return clean_rgba(image.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA"))


def visible_bbox(image: Image.Image, threshold: int = 96) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha >= threshold)
    if not len(xs):
        raise ValueError("generated key cell is empty")
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def crop_generated_grid(image: Image.Image) -> list[Image.Image]:
    if image.width < 8 or image.height < 4:
        raise ValueError("generated key sheet is too small")
    cells: list[Image.Image] = []
    for row in range(2):
        for column in range(4):
            box = (
                round(column * image.width / 4),
                round(row * image.height / 2),
                round((column + 1) * image.width / 4),
                round((row + 1) * image.height / 2),
            )
            cells.append(clean_rgba(image.crop(box)))
    return cells


def crop_identity_reference(direction: str) -> Image.Image:
    source = Image.open(IDENTITY_SOURCE).convert("RGBA")
    row = IDENTITY_ROWS[direction]
    cell_width = source.width // 6
    cell_height = source.height // 5
    return clean_rgba(source.crop((0, row * cell_height, cell_width, (row + 1) * cell_height)))


def blue_pixels(image: Image.Image) -> np.ndarray:
    rgba = np.asarray(image.convert("RGBA"))
    red, green, blue, alpha = np.moveaxis(rgba, 2, 0)
    return (alpha >= 64) & (blue >= 70) & (blue > red * 1.18) & (blue > green * 1.08)


def register_keys(cells: list[Image.Image]) -> list[Image.Image]:
    bboxes = [visible_bbox(cell) for cell in cells]
    median_height = float(np.median([box[3] - box[1] for box in bboxes]))
    scale = 416.0 / median_height
    registered: list[Image.Image] = []
    for cell in cells:
        scaled = premultiplied_resize(cell, (round(cell.width * scale), round(cell.height * scale)))
        left, top, right, bottom = visible_bbox(scaled)
        blue = blue_pixels(scaled)
        band_top = top + round((bottom - top) * 0.36)
        band_bottom = top + round((bottom - top) * 0.68)
        ys, xs = np.where(blue & (np.indices(blue.shape)[0] >= band_top) & (np.indices(blue.shape)[0] <= band_bottom))
        anchor_x = float(np.median(xs)) if len(xs) else (left + right) / 2
        canvas = Image.new("RGBA", (WORKING_CELL, WORKING_CELL))
        canvas.alpha_composite(scaled, (round(WORKING_CELL / 2 - anchor_x), GROUND_Y - bottom))
        registered.append(clean_rgba(canvas))
    return registered


def mask_from_array(array: np.ndarray) -> Image.Image:
    return Image.fromarray(np.where(array, 255, 0).astype(np.uint8), "L")


def build_identity_plate(keys: list[Image.Image], canonical: Image.Image) -> tuple[Image.Image, Image.Image, Image.Image, int, int]:
    canonical_array = np.asarray(canonical)
    alpha = canonical_array[:, :, 3]
    blue = blue_pixels(canonical)
    ys, xs = np.where(blue)
    if not len(xs):
        raise ValueError("cannot locate the generated jacket")
    blue_left, blue_right = int(xs.min()), int(xs.max() + 1)
    blue_top, blue_bottom = int(ys.min()), int(ys.max() + 1)
    torso_center = int(np.median(xs))
    jacket_width = blue_right - blue_left

    yy, xx = np.indices((WORKING_CELL, WORKING_CELL))
    # Keep the complete head-to-shoulder join from the archive.  The generous
    # lower bound also removes generated collar/upper-arm pixels that can peek
    # out beside the hair when a proposal's shoulder is a few pixels taller.
    head_region = yy <= blue_top + 42
    half_top = jacket_width * 0.29
    half_bottom = jacket_width * 0.24
    progress = np.clip((yy - blue_top) / max(1, blue_bottom - blue_top), 0, 1)
    half_width = half_top + (half_bottom - half_top) * progress
    torso_region = (yy >= blue_top - 2) & (yy <= blue_bottom) & (np.abs(xx - torso_center) <= half_width)
    canonical_opaque = alpha >= 4
    invariant_array = canonical_opaque & (head_region | torso_region)

    union_opaque = np.zeros((WORKING_CELL, WORKING_CELL), dtype=bool)
    for key in keys:
        union_opaque |= np.asarray(key.getchannel("A")) >= 4
    clear_array = union_opaque & (head_region | torso_region)
    clear_mask = mask_from_array(clear_array)
    invariant_mask = mask_from_array(invariant_array)
    plate = Image.new("RGBA", canonical.size)
    plate.paste(canonical, (0, 0), invariant_mask)
    return clean_rgba(plate), clear_mask, invariant_mask, blue_top, blue_bottom


def subtract_mask(image: Image.Image, mask: Image.Image) -> Image.Image:
    array = np.array(image, dtype=np.uint8)
    array[np.asarray(mask) >= 128] = 0
    return Image.fromarray(array, "RGBA")


def premultiplied_blend(first: Image.Image, second: Image.Image, amount: float) -> Image.Image:
    a = np.asarray(first.convert("RGBA"), dtype=np.float32) / 255.0
    b = np.asarray(second.convert("RGBA"), dtype=np.float32) / 255.0
    a_rgb = a[:, :, :3] * a[:, :, 3:4]
    b_rgb = b[:, :, :3] * b[:, :, 3:4]
    alpha = a[:, :, 3:4] * (1.0 - amount) + b[:, :, 3:4] * amount
    premul = a_rgb * (1.0 - amount) + b_rgb * amount
    rgb = np.divide(premul, alpha, out=np.zeros_like(premul), where=alpha > 1e-6)
    output = np.concatenate((rgb, alpha), axis=2)
    return clean_rgba(Image.fromarray(np.clip(output * 255 + 0.5, 0, 255).astype(np.uint8), "RGBA"))


def masked_region(image: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    result = Image.new("RGBA", image.size)
    result.paste(image.crop(box), (box[0], box[1]))
    return clean_rgba(result)


def alpha_centroid(image: Image.Image) -> tuple[float, float] | None:
    alpha = np.asarray(image.getchannel("A"), dtype=np.float64)
    total = float(alpha.sum())
    if total <= 0:
        return None
    yy, xx = np.indices(alpha.shape)
    return float((xx * alpha).sum() / total), float((yy * alpha).sum() / total)


def translate(image: Image.Image, dx: float, dy: float) -> Image.Image:
    return clean_rgba(image.transform(
        image.size,
        Image.Transform.AFFINE,
        (1, 0, -dx, 0, 1, -dy),
        resample=Image.Resampling.BICUBIC,
    ))


def lock_visible_bottom(image: Image.Image, target: int, threshold: int) -> Image.Image:
    alpha = np.asarray(image.getchannel("A"))
    ys, _ = np.where(alpha >= threshold)
    if not len(ys):
        return image
    bottom = int(ys.max() + 1)
    return translate(image, 0, target - bottom) if bottom != target else image


def aligned_motion_blend(first: Image.Image, second: Image.Image, amount: float, hip_y: int, reverse_depth: bool) -> Image.Image:
    boxes = [
        (0, 0, WORKING_CELL // 2, hip_y),
        (WORKING_CELL // 2, 0, WORKING_CELL, hip_y),
        (0, hip_y, WORKING_CELL // 2, WORKING_CELL),
        (WORKING_CELL // 2, hip_y, WORKING_CELL, WORKING_CELL),
    ]
    regions: list[Image.Image] = []
    for box in boxes:
        source = masked_region(first, box)
        target = masked_region(second, box)
        source_center, target_center = alpha_centroid(source), alpha_centroid(target)
        if source_center and target_center:
            dx = target_center[0] - source_center[0]
            dy = target_center[1] - source_center[1]
            source = translate(source, dx * amount, dy * amount)
            target = translate(target, -dx * (1.0 - amount), -dy * (1.0 - amount))
        regions.append(premultiplied_blend(source, target, amount))
    result = Image.new("RGBA", first.size)
    leg_order = (3, 2) if reverse_depth else (2, 3)
    for index in (*leg_order, 0, 1):
        result.alpha_composite(regions[index])
    return clean_rgba(result)


def accepted_keys(keys: list[Image.Image], plate: Image.Image, clear_mask: Image.Image) -> tuple[list[Image.Image], list[Image.Image]]:
    motion = [subtract_mask(key, clear_mask) for key in keys]
    accepted = []
    for layer in motion:
        frame = layer.copy()
        frame.alpha_composite(plate)
        accepted.append(clean_rgba(frame))
    return motion, accepted


def interpolate_motion(motion: list[Image.Image], plate: Image.Image, hip_y: int) -> list[Image.Image]:
    key_by_frame = dict(zip(KEY_INDICES, range(8), strict=True))
    frames: list[Image.Image] = []
    cyclic_points = list(KEY_INDICES) + [PLAYBACK_FRAMES]
    for frame_index in range(PLAYBACK_FRAMES):
        if frame_index in key_by_frame:
            layer = motion[key_by_frame[frame_index]].copy()
        else:
            previous_position = max(point for point in cyclic_points if point < frame_index)
            next_position = min(point for point in cyclic_points if point > frame_index)
            previous_key = key_by_frame[previous_position]
            next_key = 0 if next_position == PLAYBACK_FRAMES else key_by_frame[next_position]
            amount = (frame_index - previous_position) / (next_position - previous_position)
            amount = amount * amount * (3.0 - 2.0 * amount)
            layer = aligned_motion_blend(
                motion[previous_key], motion[next_key], amount, hip_y,
                reverse_depth=5 <= frame_index < 15,
            )
        layer = lock_visible_bottom(layer, GROUND_Y, 32)
        layer.alpha_composite(plate)
        frames.append(clean_rgba(layer))
    return frames


def gait_record(direction: str, frame_index: int) -> dict[str, object]:
    phase = frame_index / PLAYBACK_FRAMES
    angle = phase * math.tau
    side = direction in {"left", "right"}
    travel_sign = -1 if direction in {"left", "back"} else 1
    legs: dict[str, dict[str, object]] = {}
    for name, offset in (("left", 0.0), ("right", math.pi)):
        leg_angle = angle + offset
        forward = math.cos(leg_angle) * 42.0 * travel_sign
        lift = max(0.0, math.sin(leg_angle)) * 34.0
        hip_x = 256 + ((-18 if name == "left" else 18) if not side else 0)
        hip_y = 332
        ankle_x = hip_x + (forward if side else forward * 0.34)
        ankle_y = 466 - lift
        dx, dy = ankle_x - hip_x, ankle_y - hip_y
        distance = max(1e-6, math.hypot(dx, dy))
        upper, lower = 74.0, 76.0
        along = (upper * upper - lower * lower + distance * distance) / (2 * distance)
        height = math.sqrt(max(0.0, upper * upper - along * along))
        base_x, base_y = hip_x + dx * along / distance, hip_y + dy * along / distance
        bend = travel_sign if side else (-1 if name == "left" else 1)
        knee_x = base_x + (-dy / distance) * height * bend
        knee_y = base_y + (dx / distance) * height * bend
        legs[name] = {
            "forward": round(forward, 3),
            "lift": round(lift, 3),
            "hip": [round(hip_x, 3), hip_y],
            "knee": [round(knee_x, 3), round(knee_y, 3)],
            "ankle": [round(ankle_x, 3), round(ankle_y, 3)],
            "stance": lift == 0.0,
        }
    key_name = KEY_NAMES[KEY_INDICES.index(frame_index)] if frame_index in KEY_INDICES else None
    return {
        "frame": frame_index,
        "phase": round(phase, 4),
        "key": key_name,
        "root": [256, 332],
        "ground": 474,
        "pelvisBob": round(-2.0 * math.cos(angle * 2), 3),
        "legs": legs,
        "depthOrder": ["left", "right"] if frame_index < 5 or 15 <= frame_index else ["right", "left"],
        "crossing": frame_index in {5, 15},
    }


def paste_row(sheet: Image.Image, frames: list[Image.Image], row: int, cell_size: int) -> None:
    for column, frame in enumerate(frames):
        sheet.alpha_composite(premultiplied_resize(frame, (cell_size, cell_size)), (column * cell_size, row * cell_size))


def paste_runtime_row(sheet: Image.Image, frames: list[Image.Image], row: int) -> None:
    for column, frame in enumerate(frames):
        sheet.alpha_composite(frame, (column * RUNTIME_CELL, row * RUNTIME_CELL))


def difference_frame(previous: Image.Image, current: Image.Image) -> Image.Image:
    diff = ImageChops.difference(previous, current).convert("RGBA")
    array = np.array(diff)
    intensity = np.max(array[:, :, :3], axis=2)
    output = np.zeros_like(array)
    output[:, :, 0] = intensity
    output[:, :, 1] = intensity // 3
    output[:, :, 3] = np.where(intensity > 3, 220, 0)
    return Image.fromarray(output, "RGBA")


def onion_frame(previous: Image.Image, current: Image.Image) -> Image.Image:
    first = np.asarray(previous.convert("RGBA"), dtype=np.uint8)
    second = np.asarray(current.convert("RGBA"), dtype=np.uint8)
    output = np.zeros_like(first)
    output[:, :, 0] = first[:, :, 3]
    output[:, :, 1] = second[:, :, 3]
    output[:, :, 2] = second[:, :, 3]
    output[:, :, 3] = np.maximum(first[:, :, 3], second[:, :, 3])
    return Image.fromarray(output, "RGBA")


def skeleton_frame(frame: Image.Image, record: dict[str, object]) -> Image.Image:
    result = frame.copy()
    draw = ImageDraw.Draw(result)
    scale = RUNTIME_CELL / WORKING_CELL
    colors = {"left": (0, 220, 255, 230), "right": (255, 151, 45, 230)}
    for name, leg in record["legs"].items():
        points = [tuple(value * scale for value in leg[joint]) for joint in ("hip", "knee", "ankle")]
        draw.line(points, fill=colors[name], width=2, joint="curve")
        for point in points:
            draw.ellipse((point[0] - 2, point[1] - 2, point[0] + 2, point[1] + 2), fill=colors[name])
    root = tuple(value * scale for value in record["root"])
    draw.ellipse((root[0] - 2, root[1] - 2, root[0] + 2, root[1] + 2), fill=(70, 255, 120, 240))
    return result


def build() -> None:
    missing = [str(path) for path in RAW_SHEETS.values() if not path.exists()]
    if missing:
        raise FileNotFoundError("missing generated key sheets: " + ", ".join(missing))
    OUT.mkdir(parents=True, exist_ok=True)
    directions: dict[str, dict[str, object]] = {}
    runtime_frames: dict[str, list[Image.Image]] = {}
    runtime_cells: dict[str, list[Image.Image]] = {}
    accepted_by_direction: dict[str, list[Image.Image]] = {}
    invariant_masks: dict[str, Image.Image] = {}
    pose_rows = []

    for direction in DIRECTIONS:
        cells = crop_generated_grid(Image.open(RAW_SHEETS[direction]))
        registered = register_keys(cells)
        identity_reference = register_keys([crop_identity_reference(direction)] * 8)[0]
        plate, clear_mask, invariant_mask, shoulder_y, hip_y = build_identity_plate(registered, identity_reference)
        motion, accepted = accepted_keys(registered, plate, clear_mask)
        frames = interpolate_motion(motion, plate, hip_y)
        accepted_by_direction[direction] = accepted
        runtime_frames[direction] = frames
        runtime_mask = invariant_mask.resize((RUNTIME_CELL, RUNTIME_CELL), Image.Resampling.LANCZOS).filter(ImageFilter.MinFilter(3))
        invariant_masks[direction] = runtime_mask
        mask_array = np.asarray(runtime_mask) >= 128
        cells = [
            lock_visible_bottom(premultiplied_resize(frame, (RUNTIME_CELL, RUNTIME_CELL)), 119, 48)
            for frame in frames
        ]
        reference = np.asarray(cells[0]).copy()
        locked_cells = []
        for candidate in cells:
            candidate_array = np.asarray(candidate).copy()
            candidate_array[mask_array] = reference[mask_array]
            locked_cells.append(clean_rgba(Image.fromarray(candidate_array, "RGBA")))
        runtime_cells[direction] = locked_cells
        records = [gait_record(direction, index) for index in range(INSPECTION_FRAMES)]
        records[-1] = {**records[0], "frame": PLAYBACK_FRAMES, "phase": 1.0, "closureOf": 0}
        pose_rows.append({"direction": direction, "shoulderY": shoulder_y, "hipY": hip_y, "frames": records})
        directions[direction] = {
            "raw": RAW_SHEETS[direction].relative_to(ROOT).as_posix(),
            "identityReference": IDENTITY_SOURCE.relative_to(ROOT).as_posix(),
            "identityReferenceRow": IDENTITY_ROWS[direction],
            "row": DIRECTIONS.index(direction) + 1,
            "keys": list(KEY_INDICES),
            "keyNames": list(KEY_NAMES),
            "separateIdentityReference": True,
        }

    keys_sheet = Image.new("RGBA", (8 * REVIEW_CELL, 4 * REVIEW_CELL))
    for row, direction in enumerate(DIRECTIONS):
        paste_row(keys_sheet, accepted_by_direction[direction], row, REVIEW_CELL)
    keys_path = OUT / "merkel-keys.png"
    clean_rgba(keys_sheet).save(keys_path, optimize=True)

    runtime_sheet = Image.new("RGBA", (PLAYBACK_FRAMES * RUNTIME_CELL, 5 * RUNTIME_CELL))
    original = Image.open(IDENTITY_SOURCE).convert("RGBA")
    idle = original.crop((0, 0, 256, 256))
    paste_row(runtime_sheet, [idle] * PLAYBACK_FRAMES, 0, RUNTIME_CELL)
    for row, direction in enumerate(DIRECTIONS, start=1):
        paste_runtime_row(runtime_sheet, runtime_cells[direction], row)
    runtime_path = OUT / "merkel-sprite.png"
    clean_rgba(runtime_sheet).save(runtime_path, optimize=True)

    audit_sheet = Image.new("RGBA", (INSPECTION_FRAMES * RUNTIME_CELL, 4 * RUNTIME_CELL))
    difference_sheet = Image.new("RGBA", (PLAYBACK_FRAMES * RUNTIME_CELL, 4 * RUNTIME_CELL))
    onion_sheet = Image.new("RGBA", difference_sheet.size)
    skeleton_sheet = Image.new("RGBA", difference_sheet.size)
    mask_sheet = Image.new("L", (4 * RUNTIME_CELL, RUNTIME_CELL))
    for row, direction in enumerate(DIRECTIONS):
        downsized = runtime_cells[direction]
        paste_runtime_row(audit_sheet, downsized + [downsized[0]], row)
        for index, current in enumerate(downsized):
            previous = downsized[(index - 1) % PLAYBACK_FRAMES]
            difference_sheet.alpha_composite(difference_frame(previous, current), (index * RUNTIME_CELL, row * RUNTIME_CELL))
            onion_sheet.alpha_composite(onion_frame(previous, current), (index * RUNTIME_CELL, row * RUNTIME_CELL))
            skeleton_sheet.alpha_composite(skeleton_frame(current, gait_record(direction, index)), (index * RUNTIME_CELL, row * RUNTIME_CELL))
        mask_sheet.paste(invariant_masks[direction], (row * RUNTIME_CELL, 0))

    audit_path = OUT / "merkel-audit-21.png"
    difference_path = OUT / "merkel-difference.png"
    onion_path = OUT / "merkel-onion.png"
    skeleton_path = OUT / "merkel-skeleton.png"
    mask_path = OUT / "invariant-masks.png"
    clean_rgba(audit_sheet).save(audit_path, optimize=True)
    clean_rgba(difference_sheet).save(difference_path, optimize=True)
    clean_rgba(onion_sheet).save(onion_path, optimize=True)
    clean_rgba(skeleton_sheet).save(skeleton_path, optimize=True)
    mask_sheet.save(mask_path, optimize=True)

    pose_path = OUT / "pose-audit.json"
    pose_payload = {
        "version": 1,
        "renderMode": "masked-key-local-layer-v1",
        "playbackFrames": PLAYBACK_FRAMES,
        "inspectionFrames": INSPECTION_FRAMES,
        "keyIndices": list(KEY_INDICES),
        "rows": pose_rows,
    }
    pose_path.write_text(json.dumps(pose_payload, indent=2) + "\n", encoding="utf-8")

    artifacts = [keys_path, runtime_path, audit_path, difference_path, onion_path, skeleton_path, mask_path, pose_path]
    manifest = {
        "version": 1,
        "id": "merkel-21",
        "status": "candidate-unapproved",
        "renderMode": "masked-key-local-layer-v1",
        "workingCell": WORKING_CELL,
        "reviewCell": REVIEW_CELL,
        "runtimeCell": RUNTIME_CELL,
        "playbackFrames": PLAYBACK_FRAMES,
        "inspectionFrames": INSPECTION_FRAMES,
        "keyIndices": list(KEY_INDICES),
        "rows": list(ROW_NAMES),
        "directions": {"left": "left-walk", "right": "right-walk", "up": "back-walk", "down": "front-walk"},
        "invariants": ["head", "hair", "face", "neck-to-shoulder", "central-jacket", "root", "ground", "scale"],
        "identityAuthority": IDENTITY_SOURCE.relative_to(ROOT).as_posix(),
        "allowedChanges": ["arms", "hands", "thighs", "calves", "shoes", "bounded-joint-seams"],
        "interpolation": "registered-local-motion-layer-premultiplied-smoothstep",
        "closurePolicy": "frame-20-is-exact-frame-0-audit-only",
        "identityHash": sha256(IDENTITY_SOURCE),
        "directionsMeta": directions,
        "artifacts": {path.name: sha256(path) for path in artifacts},
        "rawHashes": {path.name: sha256(path) for path in RAW_SHEETS.values()},
    }
    manifest_path = OUT / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Built {runtime_path.relative_to(ROOT)} ({runtime_sheet.width}x{runtime_sheet.height})")
    print(f"Built {audit_path.relative_to(ROOT)} with {INSPECTION_FRAMES} inspection points")


if __name__ == "__main__":
    build()
