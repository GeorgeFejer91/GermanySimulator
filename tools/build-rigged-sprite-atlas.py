#!/usr/bin/env python3
"""Bake registered 2D cutout rigs into biomechanical sprite atlases.

The runtime remains a plain PNG atlas consumer. The production-only builder
extracts the fixed 3-view/14-part source layout and evaluates one shared gait
coefficient lane for every character. Two-bone leg IK preserves bone lengths;
stance and swing are discrete, feet follow bounded anatomical arcs, and heads
and torsos remain rigid identity layers.
"""

from __future__ import annotations

import argparse
import hashlib
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
KEY_PHASE_STATES = {
    0: "contact-a",
    4: "loading-a",
    8: "passing-a",
    12: "push-off-a",
    16: "contact-b",
    20: "loading-b",
    24: "passing-b",
    28: "push-off-b",
}

# Eight normalized anatomical anchors sampled at the named phases above.
# "forward" is positive in the actor's travel direction. During stance it
# travels monotonically backward relative to the pelvis; during swing it moves
# forward while lift provides toe clearance. The opposite leg is a half-cycle
# shift of the same coefficients, so all six characters share one mechanism.
GAIT_ANCHORS = {
    "left_forward": (0.50, 0.27, 0.00, -0.31, -0.50, -0.30, 0.00, 0.37),
    "left_lift": (0.00, 0.00, 0.00, 0.00, 0.00, 0.58, 1.00, 0.42),
    "right_forward": (-0.50, -0.30, 0.00, 0.37, 0.50, 0.27, 0.00, -0.31),
    "right_lift": (0.00, 0.58, 1.00, 0.42, 0.00, 0.00, 0.00, 0.00),
    "pelvis_y": (0.00, 4.00, 0.00, -2.50, 0.00, 4.00, 0.00, -2.50),
}

TORSO_WIDTH_SCALE = 1.12
LIMB_WIDTH_SCALE = 1.08
LIMB_LENGTH_SCALE = 0.92
HEAD_TORSO_OVERLAP = 0.22
DIRECTIONAL_SCALE_PARTS = (
    "head", "torso", "left_thigh", "left_calf", "right_thigh", "right_calf"
)

# Merkel's accepted pre-rig sheet uses a deliberately broad, compact caricature.
# Preserve that identity after the shared biomechanical normalization instead of
# letting the generic human proportions turn her into a narrow, long-legged
# cutout. These scales were measured against the archived 256 px key cells.
MERKEL_VIEW_SCALES = {
    "side": {"head": (1.55, 1.45), "torso": (1.12, 1.15)},
    "front": {"head": (1.97, 1.21), "torso": (1.70, 1.15)},
    "back": {"head": (1.45, 1.45), "torso": (1.25, 1.15)},
}
MERKEL_ARM_SCALE = (1.16, 1.05)
MERKEL_LEG_SCALE = (1.35, 0.80)
MERKEL_FOOT_SCALE = (1.12, 0.94)
MERKEL_VIEW_HEAD_TORSO_OVERLAP = {"side": 0.23, "front": 0.23, "back": 0.23}
MERKEL_VIEW_GROUND_OFFSET = {"side": 22.0, "front": 2.0, "back": 14.0}
MERKEL_ARM_SWING_SCALE = 0.84


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
    parser.add_argument(
        "--pose-audit",
        type=Path,
        default=ROOT / "assets/sprite-sources/rigs/pose-audit.json",
    )
    return parser.parse_args()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def bounded_cyclic_catmull(values: tuple[float, ...], frame_index: int) -> float:
    """Sample the cyclic eight-anchor lane without between-anchor overshoot."""
    position = (frame_index % 32) / 4.0
    index = int(math.floor(position))
    amount = position - index
    count = len(values)
    p0 = values[(index - 1) % count]
    p1 = values[index % count]
    p2 = values[(index + 1) % count]
    p3 = values[(index + 2) % count]
    amount2 = amount * amount
    amount3 = amount2 * amount
    result = 0.5 * (
        2.0 * p1
        + (-p0 + p2) * amount
        + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * amount2
        + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * amount3
    )
    return min(max(result, min(p1, p2)), max(p1, p2))


def gait_coefficients(frame_index: int, idle: bool) -> dict[str, object]:
    if idle:
        return {
            "pelvisY": 0.0,
            "left": {"forward": 0.0, "lift": 0.0, "stance": True},
            "right": {"forward": 0.0, "lift": 0.0, "stance": True},
        }
    half = frame_index % 32
    return {
        "pelvisY": bounded_cyclic_catmull(GAIT_ANCHORS["pelvis_y"], frame_index),
        "left": {
            "forward": bounded_cyclic_catmull(GAIT_ANCHORS["left_forward"], frame_index),
            "lift": bounded_cyclic_catmull(GAIT_ANCHORS["left_lift"], frame_index),
            "stance": half < 16,
        },
        "right": {
            "forward": bounded_cyclic_catmull(GAIT_ANCHORS["right_forward"], frame_index),
            "lift": bounded_cyclic_catmull(GAIT_ANCHORS["right_lift"], frame_index),
            "stance": half >= 16,
        },
    }


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


def extract_parts(
    path: Path,
    drop_indexes: set[int],
    part_indexes: list[int] | None = None,
) -> list[dict[str, Image.Image]]:
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
        if part_indexes is not None:
            if len(part_indexes) != len(PART_NAMES) or max(part_indexes) >= len(runs):
                raise ValueError(
                    f"{path.relative_to(ROOT)} view {row}: explicit part index map "
                    f"{part_indexes} cannot address {len(runs)} horizontal parts"
                )
            # Explicit maps may intentionally reuse an identity-matched source
            # piece when ImageGen omitted its paired limb (the towel woman's
            # second forearm) and may omit an accidental duplicate shoe.
            runs = [runs[index] for index in part_indexes]
        else:
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
    parts = clean_part_sockets(parts)
    head, torso = parts["head"], parts["torso"]
    leg_height = max(
        parts["left_thigh"].height + parts["left_calf"].height + parts["left_foot"].height * 0.72,
        parts["right_thigh"].height + parts["right_calf"].height + parts["right_foot"].height * 0.72,
    )
    natural_height = head.height * 0.88 + torso.height * 0.82 + leg_height * 0.84
    scale = min(1.0, 444.0 / natural_height)
    limb_names = {
        name
        for name in PART_NAMES
        if any(token in name for token in ("arm", "forearm", "thigh", "calf"))
    }
    scaled = {}
    for name, image in parts.items():
        width_scale = TORSO_WIDTH_SCALE if name == "torso" else LIMB_WIDTH_SCALE if name in limb_names else 1.0
        height_scale = LIMB_LENGTH_SCALE if name in limb_names else 1.0
        scaled[name] = premultiplied_resize(
            image,
            (
                max(1, round(image.width * scale * width_scale)),
                max(1, round(image.height * scale * height_scale)),
            ),
        )
    return scaled


def calibrate_identity_parts(
    parts: dict[str, Image.Image], sprite_id: str, view: str
) -> dict[str, Image.Image]:
    if sprite_id != "merkel":
        return parts
    calibrated = dict(parts)
    view_scales = MERKEL_VIEW_SCALES[view]
    for name, scale in view_scales.items():
        image = calibrated[name]
        calibrated[name] = premultiplied_resize(
            image,
            (max(1, round(image.width * scale[0])), max(1, round(image.height * scale[1]))),
        )
    for names, scale in (
        ((name for name in PART_NAMES if "arm" in name or "forearm" in name), MERKEL_ARM_SCALE),
        ((name for name in PART_NAMES if "thigh" in name or "calf" in name), MERKEL_LEG_SCALE),
        ((name for name in PART_NAMES if "foot" in name), MERKEL_FOOT_SCALE),
    ):
        for name in names:
            image = calibrated[name]
            calibrated[name] = premultiplied_resize(
                image,
                (max(1, round(image.width * scale[0])), max(1, round(image.height * scale[1]))),
            )
    return calibrated


def paint_socket_core(image: Image.Image, top: bool, bottom: bool) -> Image.Image:
    """Hide authoring sockets while retaining the painted silhouette edge."""
    pixels = np.asarray(image.convert("RGBA")).copy()
    height, width = pixels.shape[:2]
    middle = pixels[round(height * 0.30) : max(round(height * 0.70), 1)]
    opaque = middle[middle[:, :, 3] >= 128]
    if not len(opaque):
        return image
    color = np.median(opaque[:, :3], axis=0)
    y_grid, x_grid = np.ogrid[:height, :width]
    central = (x_grid >= width * 0.18) & (x_grid <= width * 0.82)
    band = np.zeros((height, width), dtype=bool)
    if top:
        band |= y_grid <= height * 0.22
    if bottom:
        band |= y_grid >= height * 0.78
    difference = np.linalg.norm(pixels[:, :, :3].astype(np.float32) - color, axis=2)
    replace = band & central & (pixels[:, :, 3] >= 96) & (difference >= 34.0)
    pixels[replace, :3] = color.astype(np.uint8)
    return clean_rgba(Image.fromarray(pixels, mode="RGBA"))


def clean_part_sockets(parts: dict[str, Image.Image]) -> dict[str, Image.Image]:
    cleaned = dict(parts)
    for side in ("left", "right"):
        cleaned[f"{side}_upper_arm"] = paint_socket_core(
            cleaned[f"{side}_upper_arm"], top=True, bottom=True
        )
        cleaned[f"{side}_forearm"] = paint_socket_core(
            cleaned[f"{side}_forearm"], top=True, bottom=False
        )
        cleaned[f"{side}_thigh"] = paint_socket_core(
            cleaned[f"{side}_thigh"], top=True, bottom=True
        )
        cleaned[f"{side}_calf"] = paint_socket_core(
            cleaned[f"{side}_calf"], top=True, bottom=True
        )
        cleaned[f"{side}_foot"] = paint_socket_core(
            cleaned[f"{side}_foot"], top=True, bottom=False
        )
    return cleaned


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


def solve_projected_three_bone(
    hip: tuple[float, float],
    ankle_lateral: float,
    ankle_vertical: float,
    ankle_depth: float,
    upper_length: float,
    lower_length: float,
    projection_sign: float,
    bend_sign: float,
) -> LimbResult:
    """Solve front/back gait in depth, then project it into the sprite plane."""
    dx = ankle_lateral - hip[0]
    dy = ankle_vertical - hip[1]
    dz = ankle_depth
    distance = max(1e-6, math.sqrt(dx * dx + dy * dy + dz * dz))
    maximum = upper_length + lower_length - 0.5
    minimum = abs(upper_length - lower_length) + 0.5
    clamped = min(maximum, max(minimum, distance))
    ux, uy, uz = dx / distance, dy / distance, dz / distance
    ankle3 = (hip[0] + ux * clamped, hip[1] + uy * clamped, uz * clamped)
    along = (upper_length**2 - lower_length**2 + clamped**2) / (2 * clamped)
    height = math.sqrt(max(0.0, upper_length**2 - along**2))
    # A lateral-axis cross product keeps the knee bend in the travel/vertical
    # plane. It prevents the extreme sideways bow seen in a flat 2D IK solve.
    py, pz = uz, -uy
    perpendicular_length = max(1e-6, math.hypot(py, pz))
    py, pz = py / perpendicular_length, pz / perpendicular_length
    knee3 = (
        hip[0] + ux * along,
        hip[1] + uy * along + py * height * bend_sign,
        uz * along + pz * height * bend_sign,
    )
    # Orthographic depth is intentionally compressed. A literal 1:1 collapse
    # can make a shin aimed toward the camera project to only one or two final
    # pixels even though the 3D bone is valid; 0.30 keeps readable anatomy
    # while preserving which contact foot is nearer in front/back views.
    depth_projection = 0.30
    ankle = (ankle3[0], ankle3[1] + projection_sign * ankle3[2] * depth_projection)
    projected_knee_y = knee3[1] + projection_sign * knee3[2] * depth_projection
    # A readable sprite knee must remain between hip and ankle even at maximum
    # foreshortening. This is a screen-space visibility constraint, not a bone
    # stretch: the spatial IK remains fixed-length and only its 2D projection
    # is prevented from collapsing below six runtime pixels.
    projected_knee_y = max(hip[1] + 24.0, min(projected_knee_y, ankle[1] - 24.0))
    knee = (knee3[0], projected_knee_y)
    return LimbResult(
        knee,
        ankle,
        math.atan2(knee[0] - hip[0], knee[1] - hip[1]),
        math.atan2(ankle[0] - knee[0], ankle[1] - knee[1]),
    )


def part_pivot(image: Image.Image) -> tuple[float, float]:
    return image.width / 2, max(3.0, image.height * 0.10)


def opaque_top_anchor(image: Image.Image, target_ratio: float = 0.45) -> tuple[float, float]:
    mask = np.asarray(image.getchannel("A")) >= 64
    ys, xs = np.nonzero(mask)
    if not len(xs):
        return part_pivot(image)
    cutoff = ys.min() + max(3, round(image.height * 0.28))
    selected = np.flatnonzero(ys <= cutoff)
    target_x = image.width * target_ratio
    best = min(selected, key=lambda index: abs(float(xs[index]) - target_x) + (ys[index] - ys.min()) * 0.20)
    return float(xs[best]), float(ys[best])


def foot_joint_anchor(image: Image.Image, target_ratio: float = 0.50) -> tuple[float, float]:
    """Return the ankle socket, including tall boot/sock source pieces.

    Several accepted part sheets paint the shoe together with a long sock or
    boot shaft. Treating the top of that combined piece as the ankle doubles
    the apparent shin length and leaves the shoe hanging below the body. Tall
    pieces overlap upward around the ankle instead; compact shoes retain their
    authored top-edge socket.
    """
    if image.height > image.width * 1.35:
        return image.width * target_ratio, image.height * 0.70
    return opaque_top_anchor(image, target_ratio)


def part_length(image: Image.Image) -> float:
    # ImageGen parts include rounded overlap material at both ends. The bone is
    # deliberately shorter than the painted part so elbows, knees and ankles
    # remain covered throughout the rotation arc instead of opening alpha gaps.
    return image.height * 0.84


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
    knee_lateral_scale: float = 1.0,
    foot_anchor_ratio: float = 0.45,
    solved: LimbResult | None = None,
) -> LimbResult:
    thigh = parts[f"{side}_thigh"]
    calf = parts[f"{side}_calf"]
    foot = parts[f"{side}_foot"]
    result = solved or solve_two_bone(hip, ankle, part_length(thigh), part_length(calf), bend_sign)
    if knee_lateral_scale < 1.0:
        along = part_length(thigh) / (part_length(thigh) + part_length(calf))
        line_x = hip[0] + (result.ankle[0] - hip[0]) * along
        vertical_clearance = min(20.0, max(10.0, part_length(calf) * 0.28))
        knee = (
            line_x + (result.knee[0] - line_x) * knee_lateral_scale,
            max(hip[1] + 8.0, min(result.knee[1], result.ankle[1] - vertical_clearance)),
        )
        result = LimbResult(
            knee,
            result.ankle,
            math.atan2(knee[0] - hip[0], knee[1] - hip[1]),
            math.atan2(result.ankle[0] - knee[0], result.ankle[1] - knee[1]),
        )
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
    composite_at(canvas, foot, result.ankle, foot_joint_anchor(foot, foot_anchor_ratio))
    # The generated source pieces include small exposed registration sockets.
    # Cover only the joint core after compositing; the painted limb edges and
    # outlines remain intact while cutout seams cannot flash between frames.
    joint_cap(canvas, hip, joint_color(thigh), 12)
    joint_cap(canvas, result.knee, joint_color(calf), 11)
    joint_cap(canvas, result.ankle, joint_color(foot), 8)
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
    joint_cap(canvas, shoulder, joint_color(upper), 11)
    joint_cap(canvas, elbow, joint_color(forearm), 10)
    return hand


def validate_registered_frame(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("rendered an empty rig frame")
    margin = min(bbox[0], bbox[1], 512 - bbox[2], 512 - bbox[3])
    if margin < 4:
        raise ValueError(f"registered rig frame violates the 4px safety margin ({margin}px; bbox={bbox})")
    # The rig already owns a fixed root and ground line. Recentring from the
    # changing silhouette makes a lifted foot or wide prop shake the whole body.
    return clean_rgba(image)


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


def movement_contract(view: str, mirrored: bool, idle: bool) -> tuple[str, int]:
    if idle:
        return "none", 0
    if view == "side":
        return "x", -1 if mirrored else 1
    return "y", 1 if view == "front" else -1


def point_record(point: tuple[float, float], mirrored: bool) -> list[float]:
    x, y = point
    if mirrored:
        x = 512.0 - x
    return [round(x, 3), round(y, 3)]


def render_frame(
    parts: dict[str, Image.Image],
    sprite_id: str,
    row_name: str,
    prop_mode: str,
    frame_index: int,
) -> tuple[Image.Image, dict]:
    view, mirrored, pouring, idle = row_contract(row_name)
    gait = 0.0 if idle else 1.0
    coefficients = gait_coefficients(frame_index, idle)
    # Positive Y is down-screen: loading response lowers the pelvis and
    # terminal stance raises it. The total runtime excursion stays below 2 px.
    bob = float(coefficients["pelvisY"])
    torso = parts["torso"]
    head = parts["head"]
    foot_height = max(parts["left_foot"].height, parts["right_foot"].height)
    identity_ground_offset = (
        MERKEL_VIEW_GROUND_OFFSET[view] if sprite_id == "merkel" else 0.0
    )
    ankle_ground = 448 + identity_ground_offset - foot_height * 0.70
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
    stride = 96.0 * gait
    # Pair a useful spatial step with a compressed orthographic projection.
    # Near/far ordering remains clear, but a bone aimed toward the camera can
    # never disappear into a one-pixel foreshortened segment.
    depth_stride = 30.0 * gait
    vertical_lift = min(
        18.0,
        min(part_length(parts["left_calf"]), part_length(parts["right_calf"])) * 0.48,
    )
    lift = (22.0 if side_view else vertical_lift) * gait
    ankles: dict[str, tuple[float, float]] = {}
    solved_legs: dict[str, LimbResult | None] = {}
    limb_phases: dict[str, dict[str, float | bool]] = {}
    for side in ("left", "right"):
        leg = coefficients[side]
        forward = float(leg["forward"])
        lift_amount = float(leg["lift"])
        stance = bool(leg["stance"])
        if side_view:
            target_x = hips[side][0] + stride * forward
            target_y = ankle_ground - lift * lift_amount
            solved_legs[side] = None
        else:
            side_sign = -1.0 if side == "left" else 1.0
            # Contact feet begin on their anatomical side. The airborne foot
            # crosses the midpoint at passing, matching the authored front/back
            # end states instead of sliding both feet sideways together.
            target_x = center_x + side_sign * (10.0 - 12.0 * lift_amount)
            direction_sign = 1.0 if view == "front" else -1.0
            ankle_vertical = ankle_ground - lift * lift_amount
            ankle_depth = depth_stride * 2.0 * forward
            solved_legs[side] = solve_projected_three_bone(
                hips[side],
                target_x,
                ankle_vertical,
                ankle_depth,
                part_length(parts[f"{side}_thigh"]),
                part_length(parts[f"{side}_calf"]),
                direction_sign,
                -1.0,
            )
            target_y = solved_legs[side].ankle[1]
        ankles[side] = (target_x, target_y)
        limb_phases[side] = {
            "stance": stance,
            "swing": not stance,
            "forward": round(forward, 4),
            "lift": round(lift * lift_amount, 3),
        }

    # The visually nearer/lower foot is composited last. This makes front/back
    # depth agree with the final pixels instead of switching on an unrelated
    # sine sign.
    leg_order = tuple(sorted(("left", "right"), key=lambda side: ankles[side][1]))
    joint_bridge(canvas, hips["left"], hips["right"], joint_color(torso), 22)
    joint_cap(canvas, (center_x, hip_y), joint_color(torso), 15)
    first = leg_order[0]
    first_bend = -1.0 if side_view else (1.0 if first == "left" else -1.0)
    leg_results: dict[str, LimbResult] = {}
    leg_results[first] = draw_leg(
        canvas,
        parts,
        first,
        hips[first],
        ankles[first],
        first_bend,
        1.0,
        0.50 if side_view else 0.45,
        solved_legs[first],
    )

    # Both legs belong behind the pelvis/torso plate. Drawing the near thigh
    # after the torso made its generated registration end look like a loose
    # disc over shorts and jackets, especially on the towel walkers. Depth is
    # still preserved by drawing the nearer/lower leg second.
    second = leg_order[1]
    second_bend = -1.0 if side_view else (1.0 if second == "left" else -1.0)
    leg_results[second] = draw_leg(
        canvas,
        parts,
        second,
        hips[second],
        ankles[second],
        second_bend,
        1.0,
        0.50 if side_view else 0.45,
        solved_legs[second],
    )

    identity_arm_swing_scale = MERKEL_ARM_SWING_SCALE if sprite_id == "merkel" else 1.0
    arm_swing = (
        0.68
        * identity_arm_swing_scale
        * float(coefficients["left"]["forward"])
        * gait
    )
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
    head_torso_overlap = (
        MERKEL_VIEW_HEAD_TORSO_OVERLAP[view]
        if sprite_id == "merkel"
        else HEAD_TORSO_OVERLAP
    )
    head_bottom = torso_top + torso.height * head_torso_overlap
    joint_bridge(
        canvas,
        (center_x, head_bottom - 12),
        (center_x, torso_top + 18),
        joint_color(head),
        16,
    )
    joint_cap(canvas, (center_x, head_bottom), joint_color(head), 14)
    canvas.alpha_composite(head, (round(center_x - head.width / 2), round(head_bottom - head.height)))

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
            target = (
                hands["right"][0],
                min(508 - prop.height * 0.88, hands["right"][1] + prop.height * 0.28),
            )
            joint_bridge(canvas, hands["right"], target, joint_color(prop), 12)
            composite_at(canvas, prop, target, (prop.width / 2, prop.height * 0.12))

    canvas = stitch_nearby_components(canvas)
    canvas = validate_registered_frame(canvas)
    if mirrored:
        canvas = canvas.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    movement_axis, movement_sign = movement_contract(view, mirrored, idle)
    audit = {
        "frame": frame_index,
        "phaseState": KEY_PHASE_STATES.get(frame_index, "transition"),
        "phase": round(frame_index / 32.0, 5),
        "view": view,
        "mirrored": mirrored,
        "movementAxis": movement_axis,
        "movementSign": movement_sign,
        "root": point_record((center_x, hip_y), mirrored),
        "headBottom": point_record((center_x, head_bottom), mirrored),
        "shoulders": {
            side: point_record(shoulders[side], mirrored)
            for side in ("left", "right")
        },
        "limbs": {
            side: {
                "stance": limb_phases[side]["stance"],
                "swing": limb_phases[side]["swing"],
                "forward": limb_phases[side]["forward"],
                "lift": limb_phases[side]["lift"],
                "hip": point_record(hips[side], mirrored),
                "knee": point_record(leg_results[side].knee, mirrored),
                "ankle": point_record(leg_results[side].ankle, mirrored),
            }
            for side in ("left", "right")
        },
    }
    return canvas, audit


def make_preview(runtime_rows: list[list[Image.Image]], output: Path) -> None:
    samples = (0, 4, 8, 12, 16, 20, 24, 28)
    preview = Image.new("RGBA", (len(samples) * 128, len(runtime_rows) * 128), (48, 48, 48, 255))
    for row, frames in enumerate(runtime_rows):
        for col, index in enumerate(samples):
            preview.alpha_composite(frames[index], (col * 128, row * 128))
    output.parent.mkdir(parents=True, exist_ok=True)
    preview.convert("RGB").save(output, quality=92)


def build_entry(entry: dict, preview_dir: Path | None) -> dict:
    part_path = ROOT / entry["parts"]
    views = [
        scale_parts(parts)
        for parts in extract_parts(
            part_path,
            {int(value) for value in entry.get("dropPartIndexes", [])},
            [int(value) for value in entry["partIndexes"]] if "partIndexes" in entry else None,
        )
    ]
    for name in DIRECTIONAL_SCALE_PARTS:
        target_height = round(float(np.median([parts[name].height for parts in views])))
        for parts in views:
            image = parts[name]
            ratio = target_height / image.height
            parts[name] = premultiplied_resize(
                image,
                (max(1, round(image.width * ratio)), target_height),
            )
    for view, index in VIEW_INDEX.items():
        views[index] = calibrate_identity_parts(views[index], entry["id"], view)
    source_rows: list[list[Image.Image]] = []
    runtime_rows: list[list[Image.Image]] = []
    audit_rows: list[dict] = []
    for row_name in entry["rows"]:
        view, _, _, _ = row_contract(row_name)
        parts = views[VIEW_INDEX[view]]
        rendered = []
        for index in range(32):
            try:
                rendered.append(
                    render_frame(parts, entry["id"], row_name, entry["propMode"], index)
                )
            except ValueError as error:
                raise ValueError(f"{entry['id']} {row_name} frame {index}: {error}") from error
        high_frames = [item[0] for item in rendered]
        audit_rows.append({"rowName": row_name, "frames": [item[1] for item in rendered]})
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
    return {
        "id": entry["id"],
        "parts": entry["parts"],
        "source": entry["source"],
        "runtime": entry["runtime"],
        "partsSha256": sha256(part_path),
        "sourceSha256": sha256(source_path),
        "runtimeSha256": sha256(runtime_path),
        "rows": audit_rows,
    }


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
    audit_path = args.pose_audit if args.pose_audit.is_absolute() else ROOT / args.pose_audit
    previous = {}
    if selected and audit_path.is_file():
        previous = {
            entry["id"]: entry
            for entry in json.loads(audit_path.read_text(encoding="utf-8")).get("sprites", [])
        }
    for entry in entries:
        previous[entry["id"]] = build_entry(entry, preview_dir)
    ordered = [previous[entry["id"]] for entry in registry["sprites"] if entry["id"] in previous]
    if not selected and len(ordered) != len(registry["sprites"]):
        raise ValueError("full pose audit is incomplete")
    contract = registry["frameContract"]
    audit = {
        "version": 2,
        "registryVersion": registry["version"],
        "workingCell": 512,
        "runtimeCell": 128,
        "renderMode": contract["renderMode"],
        "gaitModel": contract["gaitModel"],
        "interpolation": contract["interpolation"],
        "keyPhaseStates": {str(key): value for key, value in KEY_PHASE_STATES.items()},
        "sprites": ordered,
    }
    audit_path.parent.mkdir(parents=True, exist_ok=True)
    audit_path.write_text(json.dumps(audit, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"WROTE pose audit -> {audit_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
