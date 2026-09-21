#!/usr/bin/env python3
"""Bake registered 2D cutout rigs into stable key and runtime sprite atlases.

The runtime remains a plain PNG atlas consumer. This production-only builder
extracts the fixed 3-view/14-part source layout, solves two-bone leg IK, rotates
rigid limb cutouts around registered pivots, and renders a seamless 32-frame
walk cycle. Heads and torsos never morph; feet use explicit stance/swing arcs.
"""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


ROOT = Path(__file__).resolve().parents[1]
PART_NAMES = (
    "head",
    "torso",
    "left_upper_arm",
    "left_forearm",
    "right_upper_arm",
    "right_forearm",
    "left_thigh",
    "left_calf",
    "left_foot",
    "right_thigh",
    "right_calf",
    "right_foot",
    "prop_a",
    "prop_b",
)
VIEW_INDEX = {"side": 0, "front": 1, "back": 2}


@dataclass(frozen=True)
class LimbResult:
    knee: tuple[float, float]
    ankle: tuple[float, float]
    upper_angle: float
    lower_angle: float


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "registry",
        type=Path,
        nargs="?",
        default=ROOT / "assets/sprite-sources/rigs/registry.json",
    )
    parser.add_argument("--only", action="append", default=[])
    parser.add_argument("--preview-dir", type=Path)
    return parser.parse_args()


def clean_rgba(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    alpha = image.getchannel("A").point(lambda value: 0 if value <= 3 else value)
    image.putalpha(alpha)
    image.paste((0, 0, 0, 0), mask=alpha.point(lambda value: 255 if value == 0 else 0))
    return image


def premultiplied_resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    image = clean_rgba(image)
    resized = image.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")
    return clean_rgba(resized)


def extract_parts(path: Path, drop_indexes: set[int]) -> list[dict[str, Image.Image]]:
    source = clean_rgba(Image.open(path))
    alpha = np.asarray(source.getchannel("A"))
    views: list[dict[str, Image.Image]] = []
    for row in range(3):
        top = round(row * source.height / 3)
        bottom = round((row + 1) * source.height / 3)
        row_alpha = alpha[top:bottom]
        column_mask = (row_alpha >= 32).any(axis=0)
        labels, _ = ndimage.label(column_mask)
        runs = [
            item[0]
            for item in ndimage.find_objects(labels)
            if item and item[0].stop - item[0].start >= 3
        ]
        merged_runs = []
        for run in runs:
            if merged_runs and run.start - merged_runs[-1].stop <= 12:
                merged_runs[-1] = slice(merged_runs[-1].start, run.stop)
            else:
                merged_runs.append(run)
        runs = merged_runs
        runs = [run for index, run in enumerate(runs) if index not in drop_indexes]
        if len(runs) != len(PART_NAMES):
            raise ValueError(
                f"{path.relative_to(ROOT)} view {row}: found {len(runs)} horizontal parts; "
                f"expected {len(PART_NAMES)} after drops {sorted(drop_indexes)}"
            )
        parts: dict[str, Image.Image] = {}
        for name, run in zip(PART_NAMES, runs, strict=True):
            left, right = max(0, run.start - 5), min(source.width, run.stop + 5)
            fragment = source.crop((left, top, right, bottom))
            bbox = fragment.getchannel("A").point(lambda value: 255 if value >= 8 else 0).getbbox()
            if bbox is None:
                raise ValueError(f"{path.relative_to(ROOT)} view {row} part {name} is empty")
            parts[name] = clean_rgba(fragment.crop(bbox))
        views.append(parts)
    return views


def scale_parts(parts: dict[str, Image.Image]) -> dict[str, Image.Image]:
    head, torso = parts["head"], parts["torso"]
    leg_height = max(
        parts["left_thigh"].height + parts["left_calf"].height + parts["left_foot"].height * 0.72,
        parts["right_thigh"].height + parts["right_calf"].height + parts["right_foot"].height * 0.72,
    )
    natural_height = head.height * 0.88 + torso.height * 0.82 + leg_height * 0.84
    scale = min(1.0, 438.0 / natural_height)
    return {
        name: premultiplied_resize(
            image,
            (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
        )
        for name, image in parts.items()
    }


def rotate_about_pivot(
    image: Image.Image,
    pivot: tuple[float, float],
    angle: float,
) -> tuple[Image.Image, tuple[float, float]]:
    px, py = pivot
    radius = math.ceil(
        max(
            math.hypot(x - px, y - py)
            for x, y in ((0, 0), (image.width, 0), (0, image.height), image.size)
        )
    ) + 3
    side = radius * 2 + 1
    padded = Image.new("RGBA", (side, side))
    padded.alpha_composite(image, (round(radius - px), round(radius - py)))
    # Pillow's positive image rotation maps a downward source limb toward +X,
    # matching the screen-space bone convention used by atan2(dx, dy).
    rotated = padded.rotate(math.degrees(angle), resample=Image.Resampling.BICUBIC, expand=False)
    return clean_rgba(rotated), (float(radius), float(radius))


def composite_at(
    canvas: Image.Image,
    image: Image.Image,
    target: tuple[float, float],
    pivot: tuple[float, float] | None = None,
    angle: float = 0.0,
) -> None:
    if pivot is None:
        pivot = (image.width / 2, image.height / 2)
    if abs(angle) > 1e-6:
        image, pivot = rotate_about_pivot(image, pivot, angle)
    canvas.alpha_composite(image, (round(target[0] - pivot[0]), round(target[1] - pivot[1])))


def solve_two_bone(
    hip: tuple[float, float],
    ankle: tuple[float, float],
    upper_length: float,
    lower_length: float,
    bend_sign: float,
) -> LimbResult:
    dx, dy = ankle[0] - hip[0], ankle[1] - hip[1]
    distance = max(1e-6, math.hypot(dx, dy))
    maximum = upper_length + lower_length - 0.5
    minimum = abs(upper_length - lower_length) + 0.5
    clamped = min(maximum, max(minimum, distance))
    ux, uy = dx / distance, dy / distance
    ankle = (hip[0] + ux * clamped, hip[1] + uy * clamped)
    along = (upper_length**2 - lower_length**2 + clamped**2) / (2 * clamped)
    height = math.sqrt(max(0.0, upper_length**2 - along**2))
    base_x, base_y = hip[0] + ux * along, hip[1] + uy * along
    knee = (base_x - uy * height * bend_sign, base_y + ux * height * bend_sign)
    upper_angle = math.atan2(knee[0] - hip[0], knee[1] - hip[1])
    lower_angle = math.atan2(ankle[0] - knee[0], ankle[1] - knee[1])
    return LimbResult(knee, ankle, upper_angle, lower_angle)


def part_pivot(image: Image.Image) -> tuple[float, float]:
    return image.width / 2, max(3.0, image.height * 0.10)


def opaque_top_anchor(image: Image.Image) -> tuple[float, float]:
    mask = np.asarray(image.getchannel("A")) >= 64
    ys, xs = np.nonzero(mask)
    if not len(xs):
        return part_pivot(image)
    cutoff = ys.min() + max(3, round(image.height * 0.28))
    selected = np.flatnonzero(ys <= cutoff)
    target_x = image.width * 0.45
    best = min(selected, key=lambda index: abs(float(xs[index]) - target_x) + (ys[index] - ys.min()) * 0.20)
    return float(xs[best]), float(ys[best])


def part_length(image: Image.Image) -> float:
    # ImageGen parts include rounded overlap material at both ends. The bone is
    # deliberately shorter than the painted part so elbows, knees and ankles
    # remain covered throughout the rotation arc instead of opening alpha gaps.
    return image.height * 0.58


def joint_color(image: Image.Image) -> tuple[int, int, int, int]:
    pixels = np.asarray(image.convert("RGBA"))
    opaque = pixels[pixels[:, :, 3] >= 128]
    if not len(opaque):
        return (32, 38, 52, 255)
    rgb = np.median(opaque[:, :3], axis=0).astype(np.uint8)
    return int(rgb[0]), int(rgb[1]), int(rgb[2]), 255


def joint_cap(
    canvas: Image.Image,
    point: tuple[float, float],
    color: tuple[int, int, int, int],
    radius: float = 9.0,
) -> None:
    x, y = point
    ImageDraw.Draw(canvas).ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)


def joint_bridge(
    canvas: Image.Image,
    start: tuple[float, float],
    end: tuple[float, float],
    color: tuple[int, int, int, int],
    width: int = 14,
) -> None:
    ImageDraw.Draw(canvas).line((start, end), fill=color, width=width)


def draw_leg(
    canvas: Image.Image,
    parts: dict[str, Image.Image],
    side: str,
    hip: tuple[float, float],
    ankle: tuple[float, float],
    bend_sign: float,
) -> LimbResult:
    thigh = parts[f"{side}_thigh"]
    calf = parts[f"{side}_calf"]
    foot = parts[f"{side}_foot"]
    result = solve_two_bone(hip, ankle, part_length(thigh), part_length(calf), bend_sign)
    joint_bridge(canvas, hip, result.knee, joint_color(thigh))
    joint_bridge(canvas, result.knee, result.ankle, joint_color(calf))
    joint_bridge(
        canvas,
        result.ankle,
        (result.ankle[0], result.ankle[1] + max(10.0, foot.height * 0.24)),
        joint_color(foot),
        14,
    )
    joint_cap(canvas, hip, joint_color(thigh), 17)
    joint_cap(canvas, result.knee, joint_color(calf), 14)
    joint_cap(canvas, result.ankle, joint_color(foot), 12)
    composite_at(canvas, thigh, hip, part_pivot(thigh), result.upper_angle)
    composite_at(canvas, calf, result.knee, part_pivot(calf), result.lower_angle)
    composite_at(canvas, foot, result.ankle, opaque_top_anchor(foot))
    return result


def draw_arm(
    canvas: Image.Image,
    parts: dict[str, Image.Image],
    side: str,
    shoulder: tuple[float, float],
    upper_angle: float,
    elbow_angle: float,
) -> tuple[float, float]:
    upper = parts[f"{side}_upper_arm"]
    forearm = parts[f"{side}_forearm"]
    elbow = (
        shoulder[0] + math.sin(upper_angle) * part_length(upper),
        shoulder[1] + math.cos(upper_angle) * part_length(upper),
    )
    hand = (
        elbow[0] + math.sin(upper_angle + elbow_angle) * part_length(forearm),
        elbow[1] + math.cos(upper_angle + elbow_angle) * part_length(forearm),
    )
    joint_bridge(canvas, shoulder, elbow, joint_color(upper), 12)
    joint_bridge(canvas, elbow, hand, joint_color(forearm), 12)
    joint_cap(canvas, shoulder, joint_color(upper), 13)
    joint_cap(canvas, elbow, joint_color(forearm), 12)
    composite_at(canvas, upper, shoulder, part_pivot(upper), upper_angle)
    lower_angle = upper_angle + elbow_angle
    composite_at(canvas, forearm, elbow, part_pivot(forearm), lower_angle)
    return hand


def normalize_frame(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("rendered an empty rig frame")
    width, height = bbox[2] - bbox[0], bbox[3] - bbox[1]
    if width > 492 or height > 492:
        scale = min(492 / width, 492 / height)
        crop = image.crop(bbox)
        crop = premultiplied_resize(crop, (round(width * scale), round(height * scale)))
        image = Image.new("RGBA", image.size)
        image.alpha_composite(crop, ((512 - crop.width) // 2, 500 - crop.height))
        bbox = image.getchannel("A").getbbox()
    shift_x = round(256 - (bbox[0] + bbox[2]) / 2)
    shift_y = round(500 - bbox[3])
    shifted = Image.new("RGBA", image.size)
    shifted.alpha_composite(image, (shift_x, shift_y))
    return clean_rgba(shifted)


def stitch_nearby_components(image: Image.Image, max_gap: float = 64.0) -> Image.Image:
    """Close only small generated joint openings; reject genuinely detached art."""
    rgba = np.asarray(image.convert("RGBA")).copy()
    mask = rgba[:, :, 3] >= 16
    labels, count = ndimage.label(mask)
    if count <= 1:
        return image
    areas = np.bincount(labels.ravel())
    tiny = [index for index in range(1, count + 1) if areas[index] < 12]
    for index in tiny:
        rgba[labels == index] = 0
    image = Image.fromarray(rgba, mode="RGBA")
    while True:
        mask = np.asarray(image.getchannel("A")) >= 16
        labels, count = ndimage.label(mask)
        if count <= 1:
            return clean_rgba(image)
        areas = np.bincount(labels.ravel())
        main_id = int(np.argmax(areas[1:]) + 1)
        main = labels == main_id
        distance, nearest = ndimage.distance_transform_edt(~main, return_indices=True)
        candidates = []
        for component_id in range(1, count + 1):
            if component_id == main_id:
                continue
            ys, xs = np.nonzero(labels == component_id)
            at = int(np.argmin(distance[ys, xs]))
            candidates.append((float(distance[ys[at], xs[at]]), component_id, int(xs[at]), int(ys[at])))
        gap, component_id, source_x, source_y = min(candidates)
        if gap > max_gap:
            raise ValueError(f"rendered component is {gap:.1f}px from the registered body; maximum is {max_gap}px")
        target_y = int(nearest[0, source_y, source_x])
        target_x = int(nearest[1, source_y, source_x])
        component_pixels = np.asarray(image)[labels == component_id]
        opaque = component_pixels[component_pixels[:, 3] >= 64]
        color_values = np.median(opaque[:, :3], axis=0).astype(np.uint8) if len(opaque) else np.array([32, 38, 52])
        color = (int(color_values[0]), int(color_values[1]), int(color_values[2]), 255)
        width = max(8, min(14, round(gap * 0.34)))
        joint_bridge(image, (source_x, source_y), (target_x, target_y), color, width)
        joint_cap(image, (source_x, source_y), color, width / 2)
        joint_cap(image, (target_x, target_y), color, width / 2)


def row_contract(row_name: str) -> tuple[str, bool, bool, bool]:
    mirrored = row_name.startswith("left-")
    pouring = row_name.endswith("pour")
    idle = row_name.endswith("idle")
    if row_name.startswith(("left-", "right-")):
        view = "side"
    elif row_name.startswith("back-"):
        view = "back"
    else:
        view = "front"
    return view, mirrored, pouring, idle


def render_frame(
    raw_parts: dict[str, Image.Image],
    row_name: str,
    prop_mode: str,
    frame_index: int,
) -> Image.Image:
    parts = scale_parts(raw_parts)
    view, mirrored, pouring, idle = row_contract(row_name)
    phase = frame_index / 32 * math.tau
    gait = 0.0 if idle else 1.0
    bob = -5.5 * abs(math.sin(phase)) * gait
    torso = parts["torso"]
    head = parts["head"]
    foot_height = max(parts["left_foot"].height, parts["right_foot"].height)
    ankle_ground = 474 - foot_height * 0.70
    average_reach = (
        part_length(parts["left_thigh"])
        + part_length(parts["left_calf"])
        + part_length(parts["right_thigh"])
        + part_length(parts["right_calf"])
    ) / 2
    hip_y = ankle_ground - average_reach * 0.83 + bob
    torso_top = hip_y - torso.height * 0.80
    center_x = 256.0
    side_view = view == "side"
    shoulder_spread = torso.width * (0.15 if side_view else 0.36)
    hip_spread = torso.width * (0.045 if side_view else 0.18)
    shoulders = {
        "left": (center_x - shoulder_spread, torso_top + torso.height * 0.23),
        "right": (center_x + shoulder_spread, torso_top + torso.height * 0.23),
    }
    hips = {
        "left": (center_x - hip_spread, hip_y),
        "right": (center_x + hip_spread, hip_y),
    }
    canvas = Image.new("RGBA", (512, 512))
    stride = (32.0 if side_view else 12.0) * gait
    lift = (22.0 if side_view else 18.0) * gait
    ankles: dict[str, tuple[float, float]] = {}
    for side, offset in (("left", 0.0), ("right", math.pi)):
        leg_phase = phase + offset
        if side_view:
            target_x = hips[side][0] + stride * math.cos(leg_phase)
        else:
            base = -9.0 if side == "left" else 9.0
            crossing = 11.0 * math.cos(leg_phase)
            target_x = center_x + base + crossing
        ankles[side] = (target_x, ankle_ground - lift * max(0.0, math.sin(leg_phase)))

    leg_order = ("left", "right") if math.sin(phase) >= 0 else ("right", "left")
    joint_bridge(canvas, hips["left"], hips["right"], joint_color(torso), 22)
    joint_cap(canvas, (center_x, hip_y), joint_color(torso), 15)
    first = leg_order[0]
    first_bend = -1.0 if side_view else (1.0 if first == "left" else -1.0)
    draw_leg(canvas, parts, first, hips[first], ankles[first], first_bend)

    arm_swing = 0.34 * math.cos(phase) * gait
    holding = prop_mode in {"held-center", "flags", "towel"} or pouring
    if holding:
        arm_angles = {"left": 0.20, "right": -0.20}
        elbow_angles = {"left": -0.34, "right": 0.34}
    else:
        arm_angles = {"left": -arm_swing, "right": arm_swing}
        elbow_angles = {"left": 0.13, "right": -0.13}
    far_arm = "left"
    near_arm = "right"
    far_hand = draw_arm(
        canvas,
        parts,
        far_arm,
        shoulders[far_arm],
        arm_angles[far_arm],
        elbow_angles[far_arm],
    )

    canvas.alpha_composite(torso, (round(center_x - torso.width / 2), round(torso_top)))
    head_bottom = torso_top + torso.height * 0.09
    joint_bridge(
        canvas,
        (center_x, head_bottom - 12),
        (center_x, torso_top + 18),
        joint_color(head),
        16,
    )
    joint_cap(canvas, (center_x, head_bottom), joint_color(head), 14)
    canvas.alpha_composite(head, (round(center_x - head.width / 2), round(head_bottom - head.height)))

    second = leg_order[1]
    second_bend = -1.0 if side_view else (1.0 if second == "left" else -1.0)
    draw_leg(canvas, parts, second, hips[second], ankles[second], second_bend)
    near_hand = draw_arm(
        canvas,
        parts,
        near_arm,
        shoulders[near_arm],
        arm_angles[near_arm],
        elbow_angles[near_arm],
    )
    hands = {far_arm: far_hand, near_arm: near_hand}

    if prop_mode == "flags":
        for side, prop_name, lean in (("left", "prop_a", -0.08), ("right", "prop_b", 0.08)):
            prop = parts[prop_name]
            composite_at(canvas, prop, hands[side], (prop.width * 0.54, prop.height * 0.78), lean)
    elif prop_mode == "held-center":
        prop_a, prop_b = parts["prop_a"], parts["prop_b"]
        composite_at(canvas, prop_a, (center_x + 24, torso_top + torso.height * 0.56), (prop_a.width / 2, prop_a.height * 0.64))
        composite_at(canvas, prop_b, (center_x - 18, torso_top + torso.height * 0.58), (prop_b.width / 2, prop_b.height * 0.60))
    elif prop_mode == "towel":
        towel = parts["prop_a"]
        composite_at(canvas, towel, (center_x + torso.width * 0.15, torso_top + torso.height * 0.58), (towel.width / 2, towel.height / 2), 0.10)
    elif prop_mode == "merkel-diamond" and idle:
        diamond = parts["prop_b"]
        composite_at(
            canvas,
            diamond,
            (center_x, torso_top + torso.height * 0.57),
            (diamond.width / 2, diamond.height / 2),
        )
    elif prop_mode == "bucket":
        prop = parts["prop_b" if pouring else "prop_a"]
        if pouring:
            target = (center_x + (torso.width * 0.48 if side_view else 22), torso_top + torso.height * 0.63)
            joint_bridge(canvas, hands["left"], target, joint_color(prop), 12)
            joint_bridge(canvas, hands["right"], target, joint_color(prop), 12)
            composite_at(canvas, prop, target, (prop.width * 0.34, prop.height * 0.42), -0.62)
        else:
            target = (hands["right"][0], min(454, hands["right"][1] + prop.height * 0.28))
            joint_bridge(canvas, hands["right"], target, joint_color(prop), 12)
            composite_at(canvas, prop, target, (prop.width / 2, prop.height * 0.12))

    canvas = stitch_nearby_components(canvas)
    canvas = normalize_frame(canvas)
    if mirrored:
        canvas = canvas.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return canvas


def make_preview(runtime_rows: list[list[Image.Image]], output: Path) -> None:
    samples = (0, 4, 8, 12, 16, 20, 24, 28)
    preview = Image.new("RGBA", (len(samples) * 128, len(runtime_rows) * 128), (48, 48, 48, 255))
    for row, frames in enumerate(runtime_rows):
        for col, index in enumerate(samples):
            preview.alpha_composite(frames[index], (col * 128, row * 128))
    output.parent.mkdir(parents=True, exist_ok=True)
    preview.convert("RGB").save(output, quality=92)


def build_entry(entry: dict, preview_dir: Path | None) -> None:
    part_path = ROOT / entry["parts"]
    views = extract_parts(part_path, {int(value) for value in entry.get("dropPartIndexes", [])})
    source_rows: list[list[Image.Image]] = []
    runtime_rows: list[list[Image.Image]] = []
    for row_name in entry["rows"]:
        view, _, _, _ = row_contract(row_name)
        parts = views[VIEW_INDEX[view]]
        high_frames = [render_frame(parts, row_name, entry["propMode"], index) for index in range(32)]
        key_frames = [premultiplied_resize(high_frames[index], (256, 256)) for index in range(0, 32, 4)]
        runtime_frames = []
        for index, frame in enumerate(high_frames):
            if index % 4 == 0:
                frame = key_frames[index // 4]
            runtime_frames.append(premultiplied_resize(frame, (128, 128)))
        source_rows.append(key_frames)
        runtime_rows.append(runtime_frames)

    source_atlas = Image.new("RGBA", (8 * 256, len(source_rows) * 256))
    runtime_atlas = Image.new("RGBA", (32 * 128, len(runtime_rows) * 128))
    for row, frames in enumerate(source_rows):
        for col, frame in enumerate(frames):
            source_atlas.alpha_composite(frame, (col * 256, row * 256))
    for row, frames in enumerate(runtime_rows):
        for col, frame in enumerate(frames):
            runtime_atlas.alpha_composite(frame, (col * 128, row * 128))
    source_path, runtime_path = ROOT / entry["source"], ROOT / entry["runtime"]
    source_path.parent.mkdir(parents=True, exist_ok=True)
    runtime_path.parent.mkdir(parents=True, exist_ok=True)
    clean_rgba(source_atlas).save(source_path, optimize=True)
    clean_rgba(runtime_atlas).save(runtime_path, optimize=True)
    if preview_dir:
        make_preview(runtime_rows, preview_dir / f"{entry['id']}.jpg")
    print(
        f"BUILT {entry['id']}: {len(source_rows)} rows, 8 key frames, "
        f"32 direct rig frames -> {runtime_path.relative_to(ROOT)}"
    )


def main() -> None:
    args = parse_args()
    registry_path = args.registry if args.registry.is_absolute() else ROOT / args.registry
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    selected = set(args.only)
    entries = [entry for entry in registry["sprites"] if not selected or entry["id"] in selected]
    missing = selected - {entry["id"] for entry in entries}
    if missing:
        raise ValueError(f"unknown sprite ids: {', '.join(sorted(missing))}")
    preview_dir = args.preview_dir
    if preview_dir and not preview_dir.is_absolute():
        preview_dir = ROOT / preview_dir
    for entry in entries:
        build_entry(entry, preview_dir)


if __name__ == "__main__":
    main()
