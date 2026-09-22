#!/usr/bin/env python3
"""Build one preview-only Merkel left walk retargeted from CMU mocap.

Only the side view is rendered. Head, torso, and their root stay pixel-stable;
periodically smoothed captured shoulder/elbow/wrist, hip/knee/ankle, and
ankle/toe directions drive the limbs. The root game atlas is never written.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/sprite-sources/candidates/merkel-cmu-left"
REFERENCE = ROOT / "assets/sprite-sources/reference/cmu-walk-69-01/walk-cycle-21.json"
REGISTRY = ROOT / "assets/sprite-sources/rigs/registry.json"
RIG_TOOL = ROOT / "tools/build-rigged-sprite-atlas.py"
PLAYBACK_FRAMES = 20
INSPECTION_POINTS = 21
WORKING_CELL = 512
RUNTIME_CELL = 128
ANKLE_GROUND = 428.0
FOOT_PITCH_SCALE = 0.30
FOOT_PITCH_LIMIT = math.radians(22.0)


def load_rig_module():
    spec = importlib.util.spec_from_file_location("germanysim_rig_builder", RIG_TOOL)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load rig builder")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_vector(joints: dict, first: str, second: str) -> tuple[float, float]:
    dx = float(joints[second]["x"]) - float(joints[first]["x"])
    # Reference Y is world-up; sprite Y is screen-down.
    dy = -(float(joints[second]["y"]) - float(joints[first]["y"]))
    length = math.hypot(dx, dy)
    if length < 1e-6:
        raise ValueError(f"collapsed projected bone {first}->{second}")
    return dx / length, dy / length


def direction_angle(vector: tuple[float, float]) -> float:
    return math.atan2(vector[0], vector[1])


def retarget_foot_axis(source: tuple[float, float]) -> tuple[tuple[float, float], float]:
    # A literal mocap foot pitch can turn the caricature's large painted shoe
    # almost vertical. Preserve the captured pitch phase, but compress it into
    # the readable range of this authored cutout part.
    source_angle = math.atan2(-source[1], source[0])
    angle = max(-FOOT_PITCH_LIMIT, min(FOOT_PITCH_LIMIT, source_angle * FOOT_PITCH_SCALE))
    return (math.cos(angle), -math.sin(angle)), angle


def retarget_limb(
    rig,
    joints: dict,
    source_names: tuple[str, str, str],
    root: tuple[float, float],
    upper_length: float,
    lower_length: float,
) -> object:
    upper = source_vector(joints, source_names[0], source_names[1])
    lower = source_vector(joints, source_names[1], source_names[2])
    knee = (root[0] + upper[0] * upper_length, root[1] + upper[1] * upper_length)
    ankle = (knee[0] + lower[0] * lower_length, knee[1] + lower[1] * lower_length)
    return rig.LimbResult(knee, ankle, direction_angle(upper), direction_angle(lower))


def draw_pilot_leg(
    rig,
    canvas: Image.Image,
    parts: dict[str, Image.Image],
    side: str,
    hip: tuple[float, float],
    result,
    foot_angle: float,
):
    """Draw a pilot-only rotated foot without changing the signed shared builder."""
    thigh = parts[f"{side}_thigh"]
    calf = parts[f"{side}_calf"]
    foot = parts[f"{side}_foot"]
    rig.joint_bridge(canvas, hip, result.knee, rig.joint_color(thigh))
    rig.joint_bridge(canvas, result.knee, result.ankle, rig.joint_color(calf))
    rig.joint_bridge(
        canvas,
        result.ankle,
        (result.ankle[0], result.ankle[1] + max(10.0, foot.height * 0.24)),
        rig.joint_color(foot),
        14,
    )
    rig.joint_cap(canvas, hip, rig.joint_color(thigh), 17)
    rig.joint_cap(canvas, result.knee, rig.joint_color(calf), 14)
    rig.joint_cap(canvas, result.ankle, rig.joint_color(foot), 12)
    rig.composite_at(canvas, thigh, hip, rig.part_pivot(thigh), result.upper_angle)
    rig.composite_at(canvas, calf, result.knee, rig.part_pivot(calf), result.lower_angle)
    rig.composite_at(
        canvas,
        foot,
        result.ankle,
        rig.foot_joint_anchor(foot, 0.50),
        foot_angle,
    )
    rig.joint_cap(canvas, hip, rig.joint_color(thigh), 12)
    rig.joint_cap(canvas, result.knee, rig.joint_color(calf), 11)
    rig.joint_cap(canvas, result.ankle, rig.joint_color(foot), 8)
    return result


def translate_result(rig, result, dy: float):
    return rig.LimbResult(
        (result.knee[0], result.knee[1] + dy),
        (result.ankle[0], result.ankle[1] + dy),
        result.upper_angle,
        result.lower_angle,
    )


def mirror_point(point: tuple[float, float]) -> list[float]:
    return [round(WORKING_CELL - point[0], 3), round(point[1], 3)]


def load_merkel_parts(rig) -> dict[str, Image.Image]:
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    entry = next(sprite for sprite in registry["sprites"] if sprite["id"] == "merkel")
    views = [
        rig.scale_parts(parts)
        for parts in rig.extract_parts(ROOT / entry["parts"], set(), None)
    ]
    for name in rig.DIRECTIONAL_SCALE_PARTS:
        target_height = round(float(np.median([parts[name].height for parts in views])))
        for parts in views:
            image = parts[name]
            ratio = target_height / image.height
            parts[name] = rig.premultiplied_resize(
                image, (max(1, round(image.width * ratio)), target_height)
            )
    return rig.calibrate_identity_parts(views[rig.VIEW_INDEX["side"]], "merkel", "side")


def render_frame(rig, parts: dict[str, Image.Image], sample: dict) -> tuple[Image.Image, dict]:
    joints = sample["joints"]
    torso, head = parts["torso"], parts["head"]
    center_x = WORKING_CELL / 2
    hip_spread = torso.width * 0.045
    provisional_hips = {
        "left": (center_x - hip_spread, 0.0),
        "right": (center_x + hip_spread, 0.0),
    }
    source_leg_names = {
        "left": ("LeftUpLeg", "LeftLeg", "LeftFoot", "LeftToeBase"),
        "right": ("RightUpLeg", "RightLeg", "RightFoot", "RightToeBase"),
    }
    leg_results = {}
    for side in ("left", "right"):
        leg_results[side] = retarget_limb(
            rig,
            joints,
            source_leg_names[side][:3],
            provisional_hips[side],
            rig.part_length(parts[f"{side}_thigh"]),
            rig.part_length(parts[f"{side}_calf"]),
        )
    # The body root is deliberately fixed. At 128 px, even a physiologically
    # valid pelvis bob reads as whole-character vibration; limb motion already
    # communicates the walk and the game moves the complete sprite in world
    # space. This value is derived once from the authored leg reach, never from
    # a changing silhouette or whichever foot happens to be lower.
    average_reach = sum(
        rig.part_length(parts[f"{side}_{segment}"])
        for side in ("left", "right")
        for segment in ("thigh", "calf")
    ) / 2.0
    root_y = round(ANKLE_GROUND - average_reach * 0.83)
    hips = {side: (point[0], root_y) for side, point in provisional_hips.items()}
    leg_results = {side: translate_result(rig, result, root_y) for side, result in leg_results.items()}

    torso_top = root_y - torso.height * 0.80
    shoulder_spread = torso.width * 0.15
    shoulders = {
        "left": (center_x - shoulder_spread, torso_top + torso.height * 0.23),
        "right": (center_x + shoulder_spread, torso_top + torso.height * 0.23),
    }
    arm_names = {
        "left": ("LeftArm", "LeftForeArm", "LeftHand"),
        "right": ("RightArm", "RightForeArm", "RightHand"),
    }
    arm_angles = {}
    for side in ("left", "right"):
        upper = source_vector(joints, arm_names[side][0], arm_names[side][1])
        lower = source_vector(joints, arm_names[side][1], arm_names[side][2])
        upper_angle = direction_angle(upper)
        arm_angles[side] = (upper_angle, direction_angle(lower) - upper_angle)

    canvas = Image.new("RGBA", (WORKING_CELL, WORKING_CELL))
    # Use captured lateral depth only to decide occlusion; the side-plane bone
    # angles remain the visible motion authority.
    leg_order = sorted(
        ("left", "right"),
        key=lambda side: float(joints[f"{side.title()}Foot"]["depth"]),
    )
    drawn_legs = {}
    feet = {}
    for side in leg_order:
        source_foot_axis = source_vector(
            joints, source_leg_names[side][2], source_leg_names[side][3]
        )
        foot_axis, foot_angle = retarget_foot_axis(source_foot_axis)
        drawn_legs[side] = draw_pilot_leg(
            rig,
            canvas,
            parts,
            side,
            hips[side],
            leg_results[side],
            foot_angle,
        )
        ankle = drawn_legs[side].ankle
        foot_length = parts[f"{side}_foot"].width
        feet[side] = {
            "heel": (
                ankle[0] - foot_axis[0] * foot_length * 0.12,
                ankle[1] - foot_axis[1] * foot_length * 0.12,
            ),
            "toe": (
                ankle[0] + foot_axis[0] * foot_length * 0.42,
                ankle[1] + foot_axis[1] * foot_length * 0.42,
            ),
            "angle": foot_angle,
            "sourceAngle": math.atan2(-source_foot_axis[1], source_foot_axis[0]),
        }

    arm_order = sorted(
        ("left", "right"),
        key=lambda side: float(joints[f"{side.title()}Hand"]["depth"]),
    )
    far_arm, near_arm = arm_order
    far_hand = rig.draw_arm(
        canvas, parts, far_arm, shoulders[far_arm], *arm_angles[far_arm]
    )

    canvas.alpha_composite(torso, (round(center_x - torso.width / 2), round(torso_top)))
    head_bottom = torso_top + torso.height * rig.MERKEL_VIEW_HEAD_TORSO_OVERLAP["side"]
    rig.joint_bridge(
        canvas,
        (center_x, head_bottom - 12),
        (center_x, torso_top + 18),
        rig.joint_color(head),
        16,
    )
    rig.joint_cap(canvas, (center_x, head_bottom), rig.joint_color(head), 14)
    canvas.alpha_composite(
        head, (round(center_x - head.width / 2), round(head_bottom - head.height))
    )
    near_hand = rig.draw_arm(
        canvas, parts, near_arm, shoulders[near_arm], *arm_angles[near_arm]
    )
    hands = {far_arm: far_hand, near_arm: near_hand}

    canvas = rig.stitch_nearby_components(canvas)
    canvas = rig.validate_registered_frame(canvas)
    canvas = canvas.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

    audit = {
        "point": sample["point"],
        "phase": sample["phase"],
        "sourceFrame": sample["sourceFrame"],
        "direction": "left",
        "root": mirror_point((center_x, root_y)),
        "headBottom": mirror_point((center_x, head_bottom)),
        "shoulders": {side: mirror_point(shoulders[side]) for side in ("left", "right")},
        "hands": {side: mirror_point(hands[side]) for side in ("left", "right")},
        "limbs": {
            side: {
                "hip": mirror_point(hips[side]),
                "knee": mirror_point(drawn_legs[side].knee),
                "ankle": mirror_point(drawn_legs[side].ankle),
                "heel": mirror_point(feet[side]["heel"]),
                "toe": mirror_point(feet[side]["toe"]),
                "footAngle": round(feet[side]["angle"], 6),
                "sourceFootAngle": round(feet[side]["sourceAngle"], 6),
                "source": {
                    name: joints[name] for name in source_leg_names[side]
                },
            }
            for side in ("left", "right")
        },
        "arms": {
            side: {
                "shoulder": mirror_point(shoulders[side]),
                "elbow": mirror_point(
                    (
                        shoulders[side][0]
                        + math.sin(arm_angles[side][0])
                        * rig.part_length(parts[f"{side}_upper_arm"]),
                        shoulders[side][1]
                        + math.cos(arm_angles[side][0])
                        * rig.part_length(parts[f"{side}_upper_arm"]),
                    )
                ),
                "wrist": mirror_point(hands[side]),
                "source": {name: joints[name] for name in arm_names[side]},
            }
            for side in ("left", "right")
        },
    }
    return canvas, audit


def draw_bones(image: Image.Image, audit: dict, reference_only: bool = False) -> Image.Image:
    if reference_only:
        result = Image.new("RGBA", image.size, (232, 229, 220, 255))
    else:
        result = image.copy()
    draw = ImageDraw.Draw(result)
    colors = {"left": (0, 210, 232, 255), "right": (255, 130, 45, 255)}
    for side in ("left", "right"):
        limb = audit["limbs"][side]
        arm = audit["arms"][side]
        color = colors[side]
        draw.line((*limb["hip"], *limb["knee"], *limb["ankle"]), fill=color, width=7)
        draw.line((*limb["heel"], *limb["ankle"], *limb["toe"]), fill=color, width=7)
        draw.line((*arm["shoulder"], *arm["elbow"], *arm["wrist"]), fill=color, width=7)
        for point in (
            limb["hip"], limb["knee"], limb["ankle"], limb["heel"], limb["toe"],
            arm["shoulder"], arm["elbow"], arm["wrist"],
        ):
            x, y = point
            draw.ellipse((x - 6, y - 6, x + 6, y + 6), fill=(247, 243, 232, 255), outline=color, width=3)
    root_x, root_y = audit["root"]
    draw.ellipse((root_x - 7, root_y - 7, root_x + 7, root_y + 7), fill=(75, 215, 110, 255))
    return result


def atlas(frames: list[Image.Image], size: int) -> Image.Image:
    result = Image.new("RGBA", (len(frames) * size, size))
    for index, frame in enumerate(frames):
        reduced = rig.premultiplied_resize(frame, (size, size)) if frame.size != (size, size) else frame
        result.alpha_composite(reduced, (index * size, 0))
    return result


def contact_sheet(frames: list[Image.Image], audits: list[dict], output: Path) -> None:
    columns, cell = 7, 256
    rows = math.ceil(len(frames) / columns)
    sheet = Image.new("RGB", (columns * cell, rows * cell), "#b8b6b0")
    draw = ImageDraw.Draw(sheet)
    for index, (frame, audit) in enumerate(zip(frames, audits, strict=True)):
        x, y = (index % columns) * cell, (index // columns) * cell
        preview = rig.premultiplied_resize(draw_bones(frame, audit), (cell, cell))
        background = Image.new("RGB", (cell, cell), "#c9c7c1")
        checker = ImageDraw.Draw(background)
        for tile_y in range(0, cell, 16):
            for tile_x in range(0, cell, 16):
                if (tile_x // 16 + tile_y // 16) % 2:
                    checker.rectangle((tile_x, tile_y, tile_x + 15, tile_y + 15), fill="#b8b6b0")
        background.paste(preview, (0, 0), preview)
        sheet.paste(background, (x, y))
        draw.rectangle((x, y, x + cell - 1, y + cell - 1), outline="#5f5b53")
        draw.rectangle((x + 5, y + 5, x + 128, y + 25), fill="#e9e3d5")
        draw.text((x + 10, y + 9), f"POINT {index:02d} · BVH {audit['sourceFrame']:.1f}", fill="#1d1c19")
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, quality=94)


def main() -> None:
    global rig
    rig = load_rig_module()
    reference = json.loads(REFERENCE.read_text(encoding="utf-8"))
    points = reference["points"]
    if len(points) != INSPECTION_POINTS or points[-1]["joints"] != points[0]["joints"]:
        raise SystemExit("CMU reference does not satisfy the 20+exact-closure contract")
    parts = load_merkel_parts(rig)
    frames: list[Image.Image] = []
    audits: list[dict] = []
    for point in points[:PLAYBACK_FRAMES]:
        frame, audit = render_frame(rig, parts, point)
        frames.append(frame)
        audits.append(audit)
    frames.append(frames[0].copy())
    closure_audit = json.loads(json.dumps(audits[0]))
    closure_audit.update({"point": PLAYBACK_FRAMES, "phase": 1.0})
    audits.append(closure_audit)

    OUT.mkdir(parents=True, exist_ok=True)
    normal_path = OUT / "merkel-sprite.png"
    bones_path = OUT / "merkel-left-bones.png"
    reference_path = OUT / "merkel-left-reference.png"
    audit_path = OUT / "merkel-left-audit.png"
    evidence_path = OUT / "merkel-left-evidence.jpg"
    pose_path = OUT / "pose-audit.json"
    atlas(frames, RUNTIME_CELL).save(normal_path, optimize=True)
    atlas([draw_bones(frame, audit) for frame, audit in zip(frames, audits, strict=True)], RUNTIME_CELL).save(
        bones_path, optimize=True
    )
    atlas([draw_bones(frame, audit, True) for frame, audit in zip(frames, audits, strict=True)], RUNTIME_CELL).save(
        reference_path, optimize=True
    )
    # The normal audit includes point 21 so exact loop equality can be checked
    # without tinting or otherwise changing the pixels under inspection.
    atlas(frames, RUNTIME_CELL).save(audit_path, optimize=True)
    pose_path.write_text(
        json.dumps(
            {
                "schemaVersion": 2,
                "reference": str(REFERENCE.relative_to(ROOT)).replace("\\", "/"),
                "retargeting": "periodic-captured-bone-directions-to-fixed-root-and-fixed-bone-lengths",
                "direction": "left",
                "points": audits,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    contact_sheet(frames, audits, evidence_path)
    artifacts = [normal_path, bones_path, reference_path, audit_path, evidence_path, pose_path]
    manifest = {
        "schemaVersion": 2,
        "status": "candidate-unapproved",
        "scope": "merkel-left-only",
        "movementAuthority": str(REFERENCE.relative_to(ROOT)).replace("\\", "/"),
        "playbackFrames": PLAYBACK_FRAMES,
        "inspectionPoints": INSPECTION_POINTS,
        "directions": ["left"],
        "runtimeIsolation": "preview-only; root game atlas unchanged",
        "artifacts": {path.name: sha256(path) for path in artifacts},
    }
    manifest_path = OUT / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {normal_path.relative_to(ROOT)} ({PLAYBACK_FRAMES}+closure)")
    print(f"Wrote {evidence_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
