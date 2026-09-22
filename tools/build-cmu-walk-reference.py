#!/usr/bin/env python3
"""Extract one loopable 21-point side-walk skeleton from a pinned CMU BVH.

The first BVH frame is a converter-inserted T-pose, so it is never sampled.
The captured cycle is fitted as a periodic low-harmonic curve before twenty
motion samples and an exact closing copy are emitted.  This tool is
reference-only and never writes a game asset.
"""

from __future__ import annotations

import hashlib
import json
import math
import re
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets/sprite-sources/reference/cmu-walk-69-01"
SOURCE = SOURCE_DIR / "69_01.bvh"
OUTPUT = SOURCE_DIR / "walk-cycle-21.json"
EVIDENCE = SOURCE_DIR / "walk-cycle-21.png"
EXPECTED_SHA256 = "064de16c17a154c88b73eadecD4614e59d04ef3f8460d58785e20ceb9f4b807b".lower()
PLAYBACK_FRAMES = 20
FOURIER_HARMONICS = 3

JOINTS = (
    "Hips",
    "Neck1",
    "Head",
    "LeftArm",
    "LeftForeArm",
    "LeftHand",
    "RightArm",
    "RightForeArm",
    "RightHand",
    "LeftUpLeg",
    "LeftLeg",
    "LeftFoot",
    "LeftToeBase",
    "RightUpLeg",
    "RightLeg",
    "RightFoot",
    "RightToeBase",
)

BONES = (
    ("Hips", "Neck1", "center"),
    ("Neck1", "Head", "center"),
    ("Neck1", "LeftArm", "left"),
    ("LeftArm", "LeftForeArm", "left"),
    ("LeftForeArm", "LeftHand", "left"),
    ("Neck1", "RightArm", "right"),
    ("RightArm", "RightForeArm", "right"),
    ("RightForeArm", "RightHand", "right"),
    ("Hips", "LeftUpLeg", "left"),
    ("LeftUpLeg", "LeftLeg", "left"),
    ("LeftLeg", "LeftFoot", "left"),
    ("LeftFoot", "LeftToeBase", "left"),
    ("Hips", "RightUpLeg", "right"),
    ("RightUpLeg", "RightLeg", "right"),
    ("RightLeg", "RightFoot", "right"),
    ("RightFoot", "RightToeBase", "right"),
)

BILATERAL_PAIRS = (
    ("LeftArm", "RightArm"),
    ("LeftForeArm", "RightForeArm"),
    ("LeftHand", "RightHand"),
    ("LeftUpLeg", "RightUpLeg"),
    ("LeftLeg", "RightLeg"),
    ("LeftFoot", "RightFoot"),
    ("LeftToeBase", "RightToeBase"),
)


@dataclass
class Node:
    name: str
    parent: str | None
    offset: np.ndarray = field(default_factory=lambda: np.zeros(3, dtype=np.float64))
    channels: tuple[str, ...] = ()
    channel_start: int = 0


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_bvh(path: Path) -> tuple[list[Node], np.ndarray, float]:
    text = path.read_text(encoding="utf-8", errors="strict")
    hierarchy, motion = text.split("MOTION", 1)
    nodes: list[Node] = []
    by_name: dict[str, Node] = {}
    stack: list[Node | None] = []
    pending: Node | None = None
    channel_count = 0
    for raw_line in hierarchy.splitlines():
        line = raw_line.strip()
        if not line or line == "HIERARCHY":
            continue
        if line.startswith(("ROOT ", "JOINT ")):
            name = line.split(maxsplit=1)[1]
            parent = next((item.name for item in reversed(stack) if item is not None), None)
            pending = Node(name=name, parent=parent)
            nodes.append(pending)
            by_name[name] = pending
        elif line == "End Site":
            pending = None
        elif line == "{":
            stack.append(pending)
            pending = None
        elif line == "}":
            stack.pop()
        elif line.startswith("OFFSET "):
            node = stack[-1]
            if node is not None:
                node.offset = np.array([float(value) for value in line.split()[1:4]])
        elif line.startswith("CHANNELS "):
            node = stack[-1]
            if node is None:
                raise ValueError("BVH end site unexpectedly owns channels")
            fields = line.split()
            count = int(fields[1])
            node.channels = tuple(fields[2 : 2 + count])
            node.channel_start = channel_count
            channel_count += count

    missing = sorted(set(JOINTS) - by_name.keys())
    if missing:
        raise ValueError(f"BVH is missing required joints: {missing}")
    frame_match = re.search(r"Frames:\s*(\d+)", motion)
    time_match = re.search(r"Frame Time:\s*([0-9.]+)", motion)
    if not frame_match or not time_match:
        raise ValueError("BVH motion header is incomplete")
    frame_count = int(frame_match.group(1))
    frame_time = float(time_match.group(1))
    values_text = motion[time_match.end() :]
    values = np.fromstring(values_text, sep=" ", dtype=np.float64)
    if values.size != frame_count * channel_count:
        raise ValueError(
            f"BVH has {values.size} motion values; expected {frame_count * channel_count}"
        )
    return nodes, values.reshape((frame_count, channel_count)), frame_time


def rotation(axis: str, degrees: float) -> np.ndarray:
    angle = math.radians(degrees)
    cosine, sine = math.cos(angle), math.sin(angle)
    if axis == "X":
        return np.array(((1, 0, 0), (0, cosine, -sine), (0, sine, cosine)))
    if axis == "Y":
        return np.array(((cosine, 0, sine), (0, 1, 0), (-sine, 0, cosine)))
    if axis == "Z":
        return np.array(((cosine, -sine, 0), (sine, cosine, 0), (0, 0, 1)))
    raise ValueError(f"unknown rotation axis {axis}")


def forward_kinematics(nodes: list[Node], frames: np.ndarray) -> dict[str, np.ndarray]:
    positions = {name: np.zeros((len(frames), 3), dtype=np.float64) for name in JOINTS}
    for frame_index, values in enumerate(frames):
        world_positions: dict[str, np.ndarray] = {}
        world_rotations: dict[str, np.ndarray] = {}
        for node in nodes:
            translation = node.offset.copy()
            local_rotation = np.identity(3)
            for offset, channel in enumerate(node.channels):
                value = values[node.channel_start + offset]
                if channel.endswith("position"):
                    translation["XYZ".index(channel[0])] += value
                elif channel.endswith("rotation"):
                    local_rotation = local_rotation @ rotation(channel[0], value)
            if node.parent is None:
                world_positions[node.name] = translation
                world_rotations[node.name] = local_rotation
            else:
                parent_rotation = world_rotations[node.parent]
                world_positions[node.name] = world_positions[node.parent] + parent_rotation @ translation
                world_rotations[node.name] = parent_rotation @ local_rotation
            if node.name in positions:
                positions[node.name][frame_index] = world_positions[node.name]
    return positions


def separated_peaks(values: np.ndarray, minimum_distance: int = 70) -> list[int]:
    candidates = [
        index
        for index in range(1, len(values) - 1)
        if values[index] >= values[index - 1] and values[index] > values[index + 1]
    ]
    selected: list[int] = []
    for candidate in candidates:
        if not selected or candidate - selected[-1] >= minimum_distance:
            selected.append(candidate)
        elif values[candidate] > values[selected[-1]]:
            selected[-1] = candidate
    return selected


def choose_cycle(positions: dict[str, np.ndarray]) -> tuple[int, int, np.ndarray, np.ndarray]:
    # Frame zero is a converter-inserted T-pose, not captured motion.
    first_motion = 1
    roots = positions["Hips"][first_motion:]
    horizontal_travel = roots[-1, (0, 2)] - roots[0, (0, 2)]
    length = float(np.linalg.norm(horizontal_travel))
    if length < 1e-6:
        raise ValueError("walk capture has no horizontal root travel")
    forward = np.array((horizontal_travel[0] / length, 0.0, horizontal_travel[1] / length))
    lateral = np.array((-forward[2], 0.0, forward[0]))
    left = positions["LeftFoot"][first_motion:] - roots
    right = positions["RightFoot"][first_motion:] - roots
    separation = (left - right) @ forward
    peaks = separated_peaks(separation)
    if len(peaks) < 2:
        raise ValueError(f"could not find two left-foot contact peaks in {len(separation)} frames")
    pairs = [(a, b) for a, b in zip(peaks, peaks[1:]) if 75 <= b - a <= 170]
    if not pairs:
        raise ValueError(f"no plausible gait period found in peaks {peaks}")
    center = len(separation) / 2
    start_local, end_local = min(pairs, key=lambda pair: abs((pair[0] + pair[1]) / 2 - center))
    return start_local + first_motion, end_local + first_motion, forward, lateral


def periodic_fit(values: np.ndarray, output_count: int, harmonics: int) -> np.ndarray:
    """Fit/evaluate a cyclic Fourier curve, guaranteeing a smooth loop seam."""
    phases = np.arange(len(values), dtype=np.float64) / len(values)
    output_phases = np.arange(output_count, dtype=np.float64) / output_count

    def design(at: np.ndarray) -> np.ndarray:
        columns = [np.ones(len(at), dtype=np.float64)]
        for harmonic in range(1, harmonics + 1):
            angle = math.tau * harmonic * at
            columns.extend((np.cos(angle), np.sin(angle)))
        return np.column_stack(columns)

    coefficients, *_ = np.linalg.lstsq(design(phases), values, rcond=None)
    return design(output_phases) @ coefficients


def sample_cycle(
    positions: dict[str, np.ndarray], start: int, end: int, forward: np.ndarray, lateral: np.ndarray
) -> list[dict]:
    # Exclude the second same-foot contact from the fit; phase zero already
    # represents it. Periodic basis functions make both position and velocity
    # meet at the seam instead of snapping between two naturally unequal steps.
    cycle_slice = slice(start, end)
    all_ankle_heights = np.minimum(
        positions["LeftFoot"][cycle_slice, 1], positions["RightFoot"][cycle_slice, 1]
    )
    ground = float(np.percentile(all_ankle_heights, 5))
    stature = float(
        np.median(
            positions["Head"][cycle_slice, 1]
            - np.minimum(
                positions["LeftFoot"][cycle_slice, 1],
                positions["RightFoot"][cycle_slice, 1],
            )
        )
    )
    if stature <= 0:
        raise ValueError("invalid captured stature")
    roots = positions["Hips"][cycle_slice]
    projected: dict[str, dict[str, np.ndarray]] = {}
    for name in JOINTS:
        relative = positions[name][cycle_slice] - roots
        projected[name] = {
            "x": periodic_fit(relative @ forward / stature, PLAYBACK_FRAMES, FOURIER_HARMONICS),
            "y": periodic_fit(relative[:, 1] / stature, PLAYBACK_FRAMES, FOURIER_HARMONICS),
            "depth": periodic_fit(relative @ lateral / stature, PLAYBACK_FRAMES, FOURIER_HARMONICS),
        }

    # One captured side can differ subtly from the other. Average equivalent
    # limb paths half a cycle apart, then derive the opposite limb by a clean
    # half-cycle shift. This retains the captured gait while removing the
    # left/right mismatch that reads as wobble in a 128 px sprite.
    half = PLAYBACK_FRAMES // 2
    for left_name, right_name in BILATERAL_PAIRS:
        for coordinate in ("x", "y"):
            left = projected[left_name][coordinate]
            right_as_left = np.roll(projected[right_name][coordinate], -half)
            canonical = (left + right_as_left) / 2.0
            projected[left_name][coordinate] = canonical
            projected[right_name][coordinate] = np.roll(canonical, half)

    pelvis_height = periodic_fit((roots[:, 1] - ground) / stature, PLAYBACK_FRAMES, 2)
    samples: list[dict] = []
    for point in range(PLAYBACK_FRAMES):
        source_frame = start + (end - start) * point / PLAYBACK_FRAMES
        joints = {
            name: {
                coordinate: round(float(projected[name][coordinate][point]), 7)
                for coordinate in ("x", "y", "depth")
            }
            for name in JOINTS
        }
        gait_state = {
            0: "left-forward-contact",
            5: "right-passing-left",
            10: "right-forward-contact",
            15: "left-passing-right",
        }.get(point, "transition")
        samples.append(
            {
                "point": point,
                "phase": round(point / PLAYBACK_FRAMES, 5),
                "sourceFrame": round(source_frame, 4),
                "gaitState": gait_state,
                "pelvisHeight": round(float(pelvis_height[point]), 7),
                "joints": joints,
            }
        )
    closure = json.loads(json.dumps(samples[0]))
    closure.update({"point": PLAYBACK_FRAMES, "phase": 1.0, "sourceFrame": samples[0]["sourceFrame"]})
    samples.append(closure)
    return samples


def draw_evidence(samples: list[dict], output: Path) -> None:
    columns, panel_w, panel_h = 7, 170, 230
    rows = math.ceil(len(samples) / columns)
    image = Image.new("RGB", (columns * panel_w, rows * panel_h), "#dedbd2")
    draw = ImageDraw.Draw(image)
    colors = {"left": "#0098ad", "right": "#df6d23", "center": "#30363d"}
    for index, sample in enumerate(samples):
        column, row = index % columns, index // columns
        ox, oy = column * panel_w, row * panel_h
        draw.rectangle((ox, oy, ox + panel_w - 1, oy + panel_h - 1), outline="#8a867d")
        joints = sample["joints"]
        scale = 130

        def point(name: str) -> tuple[float, float]:
            joint = joints[name]
            return ox + panel_w / 2 + joint["x"] * scale, oy + 108 - joint["y"] * scale

        draw.line((ox + 10, oy + 198, ox + panel_w - 10, oy + 198), fill="#757168", width=1)
        for first, second, side in BONES:
            draw.line((*point(first), *point(second)), fill=colors[side], width=4)
        for name in JOINTS:
            x, y = point(name)
            draw.ellipse((x - 3, y - 3, x + 3, y + 3), fill="#f8f4e9", outline="#23211d")
        draw.text((ox + 7, oy + 7), f"{index:02d}  BVH {sample['sourceFrame']:.1f}", fill="#23211d")
        if index == PLAYBACK_FRAMES:
            draw.text((ox + 7, oy + 24), "EXACT LOOP", fill="#762f29")
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, optimize=True)


def main() -> None:
    actual_hash = sha256(SOURCE)
    if actual_hash != EXPECTED_SHA256:
        raise SystemExit(f"unexpected CMU BVH hash: {actual_hash}")
    nodes, motion, frame_time = parse_bvh(SOURCE)
    positions = forward_kinematics(nodes, motion)
    start, end, forward, lateral = choose_cycle(positions)
    samples = sample_cycle(positions, start, end, forward, lateral)
    payload = {
        "schemaVersion": 2,
        "kind": "minimal-side-walk-pose-map",
        "status": "external-reference",
        "source": {
            "database": "Carnegie Mellon University Graphics Lab Motion Capture Database",
            "subject": 69,
            "trial": 1,
            "description": "walk forward",
            "captureFrames": int(len(motion)),
            "captureFps": round(1.0 / frame_time, 5),
            "insertedTPoseFrameExcluded": 0,
            "bvhSha256": actual_hash,
            "pinnedConversionCommit": "09a07f54f3bbb58797325f009282d0b2048a2871",
            "urls": {
                "officialDatabase": "https://mocap.cs.cmu.edu/",
                "officialTrial": "https://mocap.cs.cmu.edu/search.php?subjectnumber=69",
                "conversion": "https://github.com/una-dinosauria/cmu-mocap",
            },
        },
        "cycle": {
            "startFrame": start,
            "endFrame": end,
            "sourceFrameSpan": end - start,
            "playbackFrames": PLAYBACK_FRAMES,
            "inspectionPoints": PLAYBACK_FRAMES + 1,
            "closure": "point-20-is-exact-copy-of-point-0",
            "sequence": "left-forward -> right-forward -> left-forward",
            "smoothing": f"periodic Fourier fit, {FOURIER_HARMONICS} harmonics",
            "bilateralNormalization": "paired limbs averaged at half-cycle offset",
        },
        "projection": {
            "x": "captured root travel direction",
            "y": "world up",
            "depth": "orthogonal horizontal axis",
            "origin": "pelvis",
            "scale": "median captured head-to-lowest-ankle stature",
        },
        "hardGateJoints": list(JOINTS),
        "excludedFromHardGate": ["fingers"],
        "footGatePolicy": "ankle-to-toe axes are low-pass fitted before validation",
        "bones": [list(item) for item in BONES],
        "points": samples,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    draw_evidence(samples, EVIDENCE)
    print(f"CMU walk cycle: source frames {start}..{end} ({end - start} at {1 / frame_time:.1f} fps)")
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")
    print(f"Wrote {EVIDENCE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
