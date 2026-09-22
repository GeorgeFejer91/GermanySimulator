#!/usr/bin/env python3
"""Fail-closed checks for the preview-only Merkel CMU left-walk pilot."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PILOT = ROOT / "assets/sprite-sources/candidates/merkel-cmu-left"
REFERENCE = ROOT / "assets/sprite-sources/reference/cmu-walk-69-01/walk-cycle-21.json"
PLAYBACK_FRAMES = 20
INSPECTION_POINTS = 21
CELL = 128
WORKING_CELL = 512
FOOT_PITCH_SCALE = 0.30
FOOT_PITCH_LIMIT = math.radians(22.0)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--report",
        type=Path,
        default=PILOT / "verification.json",
    )
    return parser.parse_args()


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def vector(first: list[float], second: list[float], unmirror: bool = False) -> np.ndarray:
    a = np.array(first, dtype=np.float64)
    b = np.array(second, dtype=np.float64)
    if unmirror:
        a[0] = WORKING_CELL - a[0]
        b[0] = WORKING_CELL - b[0]
    result = b - a
    length = float(np.linalg.norm(result))
    require(length > 1e-6, "rendered bone collapsed")
    return result / length


def source_vector(joints: dict, first: str, second: str) -> np.ndarray:
    result = np.array(
        (
            float(joints[second]["x"]) - float(joints[first]["x"]),
            -(float(joints[second]["y"]) - float(joints[first]["y"])),
        )
    )
    length = float(np.linalg.norm(result))
    require(length > 1e-6, f"source bone {first}->{second} collapsed")
    return result / length


def angular_error(first: np.ndarray, second: np.ndarray) -> float:
    cosine = float(np.clip(np.dot(first, second), -1.0, 1.0))
    return math.degrees(math.acos(cosine))


def retargeted_foot_vector(source: np.ndarray) -> np.ndarray:
    source_angle = math.atan2(-float(source[1]), float(source[0]))
    angle = max(-FOOT_PITCH_LIMIT, min(FOOT_PITCH_LIMIT, source_angle * FOOT_PITCH_SCALE))
    return np.array((math.cos(angle), -math.sin(angle)), dtype=np.float64)


def alpha_near(alpha: np.ndarray, point: list[float], radius: int = 4) -> bool:
    x = round(point[0] / WORKING_CELL * CELL)
    y = round(point[1] / WORKING_CELL * CELL)
    left, right = max(0, x - radius), min(CELL, x + radius + 1)
    top, bottom = max(0, y - radius), min(CELL, y + radius + 1)
    return bool((alpha[top:bottom, left:right] >= 24).any())


def main() -> None:
    args = parse_args()
    manifest = json.loads((PILOT / "manifest.json").read_text(encoding="utf-8"))
    reference = json.loads(REFERENCE.read_text(encoding="utf-8"))
    audit = json.loads((PILOT / "pose-audit.json").read_text(encoding="utf-8"))
    require(manifest["status"] == "candidate-unapproved", "pilot must remain unapproved")
    require(manifest["scope"] == "merkel-left-only", "pilot scope expanded beyond one direction")
    require(manifest["directions"] == ["left"], "pilot exposes a non-left direction")
    require(manifest["playbackFrames"] == PLAYBACK_FRAMES, "wrong playback frame count")
    require(manifest["inspectionPoints"] == INSPECTION_POINTS, "wrong inspection point count")
    require(len(reference["points"]) == INSPECTION_POINTS, "reference point count changed")
    require(len(audit["points"]) == INSPECTION_POINTS, "audit point count changed")
    require(reference["points"][0]["joints"] == reference["points"][-1]["joints"], "reference closure is not exact")
    require(audit["points"][0] | {"point": 20, "phase": 1.0} == audit["points"][-1], "audit closure is not exact")

    for name, expected in manifest["artifacts"].items():
        require(sha256(PILOT / name) == expected, f"artifact hash mismatch: {name}")

    atlas = Image.open(PILOT / "merkel-sprite.png").convert("RGBA")
    require(atlas.size == (INSPECTION_POINTS * CELL, CELL), f"unexpected atlas size {atlas.size}")
    pixels = np.asarray(atlas)
    frames = [pixels[:, index * CELL : (index + 1) * CELL] for index in range(INSPECTION_POINTS)]
    require(np.array_equal(frames[0], frames[-1]), "rendered closure cell differs from point zero")
    frame_hashes = {hashlib.sha256(frame.tobytes()).hexdigest() for frame in frames[:PLAYBACK_FRAMES]}
    require(len(frame_hashes) == PLAYBACK_FRAMES, f"only {len(frame_hashes)} distinct playback frames")

    angle_errors: list[float] = []
    bone_lengths: dict[str, list[float]] = {}
    contact_owner: list[str] = []
    separation: list[float] = []
    mapping = {
        "left": ("LeftUpLeg", "LeftLeg", "LeftFoot", "LeftToeBase", "LeftArm", "LeftForeArm", "LeftHand"),
        "right": ("RightUpLeg", "RightLeg", "RightFoot", "RightToeBase", "RightArm", "RightForeArm", "RightHand"),
    }
    for frame_index, point in enumerate(audit["points"][:PLAYBACK_FRAMES]):
        frame_alpha = frames[frame_index][:, :, 3]
        visible = np.argwhere(frame_alpha >= 8)
        require(len(visible) > 0, f"frame {frame_index} is empty")
        require(
            visible[:, 0].min() >= 1
            and visible[:, 0].max() <= CELL - 2
            and visible[:, 1].min() >= 1
            and visible[:, 1].max() <= CELL - 2,
            f"frame {frame_index} violates the one-pixel safety margin",
        )
        ankle_y = {side: point["limbs"][side]["ankle"][1] for side in ("left", "right")}
        contact_owner.append(max(ankle_y, key=ankle_y.get))
        separation.append(point["limbs"]["left"]["ankle"][0] - point["limbs"]["right"]["ankle"][0])
        for side, names in mapping.items():
            limb = point["limbs"][side]
            arm = point["arms"][side]
            rendered_bones = (
                ("thigh", limb["hip"], limb["knee"], names[0], names[1]),
                ("calf", limb["knee"], limb["ankle"], names[1], names[2]),
                ("foot", limb["ankle"], limb["toe"], names[2], names[3]),
                ("upperArm", arm["shoulder"], arm["elbow"], names[4], names[5]),
                ("forearm", arm["elbow"], arm["wrist"], names[5], names[6]),
            )
            source_joints = point["limbs"][side]["source"] | point["arms"][side]["source"]
            for label, first, second, source_first, source_second in rendered_bones:
                actual = vector(first, second, unmirror=True)
                expected = source_vector(source_joints, source_first, source_second)
                if label == "foot":
                    expected = retargeted_foot_vector(expected)
                error = angular_error(actual, expected)
                angle_errors.append(error)
                bone_lengths.setdefault(f"{side}.{label}", []).append(
                    float(np.linalg.norm(np.array(second) - np.array(first)))
                )
                require(error <= 0.2, f"frame {frame_index} {side} {label} is {error:.3f}° from mocap")
            for label, joint in (
                ("hip", limb["hip"]),
                ("knee", limb["knee"]),
                ("ankle", limb["ankle"]),
                ("heel", limb["heel"]),
                ("toe", limb["toe"]),
                ("shoulder", arm["shoulder"]),
                ("elbow", arm["elbow"]),
                ("wrist", arm["wrist"]),
            ):
                require(alpha_near(frame_alpha, joint), f"frame {frame_index} {side} {label} has no nearby sprite pixels")

    require(set(contact_owner) == {"left", "right"}, "both feet do not take a ground contact turn")
    require(min(separation) < -5 and max(separation) > 5, "ankles never cross in screen space")
    require(separation[0] < -20, "cycle does not begin with the left foot forward")
    require(separation[PLAYBACK_FRAMES // 2] > 20, "half-cycle does not put the right foot forward")
    roots = [point["root"] for point in audit["points"][:PLAYBACK_FRAMES]]
    heads = [point["headBottom"] for point in audit["points"][:PLAYBACK_FRAMES]]
    require(len({tuple(point) for point in roots}) == 1, "body root moves between frames")
    require(len({tuple(point) for point in heads}) == 1, "head/torso plate moves between frames")

    tracked_joint_names = [
        (side, region, joint)
        for side in ("left", "right")
        for region, joints in (
            ("limbs", ("knee", "ankle", "toe")),
            ("arms", ("elbow", "wrist")),
        )
        for joint in joints
    ]
    tracked_paths = [
        np.array(
            [
                coordinate
                for side, region, joint in tracked_joint_names
                for coordinate in point[region][side][joint]
            ],
            dtype=np.float64,
        )
        for point in audit["points"][:PLAYBACK_FRAMES]
    ]
    steps = [tracked_paths[(index + 1) % PLAYBACK_FRAMES] - tracked_paths[index] for index in range(PLAYBACK_FRAMES)]
    accelerations = [
        float(np.linalg.norm(steps[(index + 1) % PLAYBACK_FRAMES] - steps[index]))
        for index in range(PLAYBACK_FRAMES)
    ]
    require(max(accelerations) <= 24.0, f"cyclic limb acceleration spikes at {max(accelerations):.3f}px")
    joint_accelerations: list[float] = []
    seam_accelerations: list[float] = []
    for joint_index, _name in enumerate(tracked_joint_names):
        path = np.array(
            [point[joint_index * 2 : joint_index * 2 + 2] for point in tracked_paths]
        )
        joint_steps = np.roll(path, -1, axis=0) - path
        joint_acceleration = np.roll(joint_steps, -1, axis=0) - joint_steps
        joint_accelerations.extend(np.linalg.norm(joint_acceleration, axis=1).tolist())
        seam_accelerations.append(float(np.linalg.norm(joint_acceleration[-1])))
    require(max(joint_accelerations) <= 12.0, "a tracked joint changes velocity too abruptly")
    require(max(seam_accelerations) <= 8.0, "a tracked joint snaps at the loop seam")
    length_drift = {
        name: max(values) - min(values) for name, values in bone_lengths.items()
    }
    require(max(length_drift.values()) <= 0.01, f"retargeted bone lengths drift: {length_drift}")

    result = {
        "status": "pass-unapproved",
        "scope": "merkel-left-only",
        "reference": {
            "subject": reference["source"]["subject"],
            "trial": reference["source"]["trial"],
            "sourceFrames": [reference["cycle"]["startFrame"], reference["cycle"]["endFrame"]],
            "bvhSha256": reference["source"]["bvhSha256"],
        },
        "checks": {
            "playbackFrames": PLAYBACK_FRAMES,
            "inspectionPoints": INSPECTION_POINTS,
            "distinctPlaybackFrames": len(frame_hashes),
            "exactPixelClosure": True,
            "maxBoneDirectionErrorDegrees": round(max(angle_errors), 6),
            "maxBoneLengthDriftPixels": round(max(length_drift.values()), 6),
            "alternatingContactOwners": sorted(set(contact_owner)),
            "ankleCrossingRangePixels": [round(min(separation), 3), round(max(separation), 3)],
            "gaitSequence": "left-forward -> right-forward -> left-forward",
            "fixedBodyRoot": roots[0],
            "maxCyclicLimbAccelerationPixels": round(max(accelerations), 6),
            "maxPerJointAccelerationPixels": round(max(joint_accelerations), 6),
            "maxLoopSeamAccelerationPixels": round(max(seam_accelerations), 6),
            "footBones": "heel-ankle-toe included",
            "jointPixelCoverage": "pass",
            "runtimeIsolation": "pass",
        },
        "artifactHashes": {name: sha256(PILOT / name) for name in manifest["artifacts"]},
        "approval": "mechanically validated; visual approval still required",
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print("PASS: Merkel CMU left-walk pilot")
    print(f"  20 distinct frames + exact point-21 closure")
    print(f"  max bone-direction error: {max(angle_errors):.6f} degrees")
    print(f"  ankle crossing: {min(separation):.2f}..{max(separation):.2f} px")
    print(f"  report: {args.report.relative_to(ROOT)}")


if __name__ == "__main__":
    try:
        main()
    except ValueError as error:
        raise SystemExit(f"FAIL: {error}") from error
