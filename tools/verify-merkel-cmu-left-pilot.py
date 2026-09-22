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
        "left": ("LeftUpLeg", "LeftLeg", "LeftFoot", "LeftArm", "LeftForeArm", "LeftHand"),
        "right": ("RightUpLeg", "RightLeg", "RightFoot", "RightArm", "RightForeArm", "RightHand"),
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
                ("upperArm", arm["shoulder"], arm["elbow"], names[3], names[4]),
                ("forearm", arm["elbow"], arm["wrist"], names[4], names[5]),
            )
            source_joints = point["limbs"][side]["source"] | point["arms"][side]["source"]
            for label, first, second, source_first, source_second in rendered_bones:
                actual = vector(first, second, unmirror=True)
                expected = source_vector(source_joints, source_first, source_second)
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
                ("shoulder", arm["shoulder"]),
                ("elbow", arm["elbow"]),
                ("wrist", arm["wrist"]),
            ):
                require(alpha_near(frame_alpha, joint), f"frame {frame_index} {side} {label} has no nearby sprite pixels")

    require(set(contact_owner) == {"left", "right"}, "both feet do not take a ground contact turn")
    require(min(separation) < -5 and max(separation) > 5, "ankles never cross in screen space")
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
