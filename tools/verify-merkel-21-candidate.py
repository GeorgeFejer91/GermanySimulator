#!/usr/bin/env python3
"""Fail-closed checks for the preview-only Merkel 21-point candidate."""

from __future__ import annotations

import hashlib
import json
import math
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "assets/sprite-sources/candidates/merkel-21"
CELL = 128
PLAYBACK = 20
INSPECTION = 21
KEYS = (0, 2, 5, 7, 10, 12, 15, 17)
DIRECTIONS = ("left", "right", "back", "front")
IDENTITY_SOURCE = ROOT / "assets/sprite-archive/pre-rig-20260921/assets/sprite-sources/merkel-sprite-keys.png"
IDENTITY_ROWS = {"left": 1, "right": 2, "back": 3, "front": 4}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def cell(sheet: Image.Image, column: int, row: int) -> Image.Image:
    return sheet.crop((column * CELL, row * CELL, (column + 1) * CELL, (row + 1) * CELL)).convert("RGBA")


def assert_clean_alpha(image: Image.Image, label: str) -> None:
    rgba = np.asarray(image.convert("RGBA"))
    hidden = rgba[:, :, 3] == 0
    if np.any(rgba[:, :, :3][hidden]):
        raise ValueError(f"{label}: transparent pixels contain RGB")


def visible_bbox(image: Image.Image, threshold: int = 48) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha >= threshold)
    if not len(xs):
        raise ValueError("empty candidate frame")
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def largest_component_ratio(image: Image.Image) -> float:
    opaque = np.asarray(image.getchannel("A")) >= 48
    seen = np.zeros_like(opaque, dtype=bool)
    sizes: list[int] = []
    height, width = opaque.shape
    for start_y, start_x in zip(*np.where(opaque & ~seen)):
        if seen[start_y, start_x]:
            continue
        queue = deque([(int(start_x), int(start_y))])
        seen[start_y, start_x] = True
        size = 0
        while queue:
            x, y = queue.popleft()
            size += 1
            for next_x, next_y in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= next_x < width and 0 <= next_y < height and opaque[next_y, next_x] and not seen[next_y, next_x]:
                    seen[next_y, next_x] = True
                    queue.append((next_x, next_y))
        sizes.append(size)
    return max(sizes, default=0) / max(1, int(opaque.sum()))


def verify() -> None:
    manifest_path = BASE / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest["status"] != "candidate-unapproved":
        raise ValueError("candidate may not self-approve")
    if manifest["playbackFrames"] != PLAYBACK or manifest["inspectionFrames"] != INSPECTION:
        raise ValueError("candidate frame contract changed")
    if tuple(manifest["keyIndices"]) != KEYS:
        raise ValueError("candidate key schedule changed")
    if manifest.get("identityAuthority") != IDENTITY_SOURCE.relative_to(ROOT).as_posix():
        raise ValueError("archived Merkel sheet is no longer the identity authority")
    if manifest.get("identityHash") != sha256(IDENTITY_SOURCE):
        raise ValueError("archived Merkel identity authority changed")
    if manifest["directionsMeta"]["left"]["raw"] == manifest["directionsMeta"]["right"]["raw"]:
        raise ValueError("left and right must retain separate generated sources")
    for direction, row in IDENTITY_ROWS.items():
        meta = manifest["directionsMeta"][direction]
        if meta.get("identityReference") != manifest["identityAuthority"] or meta.get("identityReferenceRow") != row:
            raise ValueError(f"{direction}: archived identity reference changed")

    for name, expected in manifest["artifacts"].items():
        path = BASE / name
        if not path.exists() or sha256(path) != expected:
            raise ValueError(f"artifact hash mismatch: {name}")
    for name, expected in manifest["rawHashes"].items():
        path = BASE / "raw" / name
        if not path.exists() or sha256(path) != expected:
            raise ValueError(f"generated source hash mismatch: {name}")

    runtime = Image.open(BASE / "merkel-sprite.png").convert("RGBA")
    audit = Image.open(BASE / "merkel-audit-21.png").convert("RGBA")
    masks = Image.open(BASE / "invariant-masks.png").convert("L")
    if runtime.size != (PLAYBACK * CELL, 5 * CELL):
        raise ValueError(f"runtime size is {runtime.size}, expected {(PLAYBACK * CELL, 5 * CELL)}")
    if audit.size != (INSPECTION * CELL, 4 * CELL):
        raise ValueError(f"audit size is {audit.size}, expected {(INSPECTION * CELL, 4 * CELL)}")
    if runtime.width > 4096:
        raise ValueError("candidate exceeds the mobile-safe texture width")
    assert_clean_alpha(runtime, "runtime")
    assert_clean_alpha(audit, "audit")

    for direction_index, direction in enumerate(DIRECTIONS):
        runtime_row = direction_index + 1
        frames = [cell(runtime, index, runtime_row) for index in range(PLAYBACK)]
        hashes = {hashlib.sha256(frame.tobytes()).hexdigest() for frame in frames}
        if len(hashes) != PLAYBACK:
            raise ValueError(f"{direction}: playback frames are not all distinct")
        if cell(audit, 0, direction_index).tobytes() != cell(audit, PLAYBACK, direction_index).tobytes():
            raise ValueError(f"{direction}: inspection closure is not exact")

        mask = np.asarray(masks.crop((direction_index * CELL, 0, (direction_index + 1) * CELL, CELL))) >= 128
        reference = np.asarray(frames[0])
        for index, frame in enumerate(frames[1:], start=1):
            candidate = np.asarray(frame)
            if not np.array_equal(reference[mask], candidate[mask]):
                raise ValueError(f"{direction} frame {index}: immutable plate changed")

        bottoms = []
        for index, frame in enumerate(frames):
            left, top, right, bottom = visible_bbox(frame)
            bottoms.append(bottom)
            if left <= 0 or top <= 0 or right >= CELL or bottom >= CELL:
                raise ValueError(f"{direction} frame {index}: sprite touches the cell margin")
            if largest_component_ratio(frame) < 0.965:
                raise ValueError(f"{direction} frame {index}: detached visible component")
        if max(bottoms) - min(bottoms) > 1:
            raise ValueError(f"{direction}: ground line varies by {max(bottoms) - min(bottoms)} pixels")

    pose = json.loads((BASE / "pose-audit.json").read_text(encoding="utf-8"))
    if pose["playbackFrames"] != PLAYBACK or pose["inspectionFrames"] != INSPECTION:
        raise ValueError("pose audit frame contract changed")
    for row in pose["rows"]:
        if len(row["frames"]) != INSPECTION:
            raise ValueError(f"{row['direction']}: incomplete pose audit")
        if [frame["frame"] for frame in row["frames"]] != list(range(INSPECTION)):
            raise ValueError(f"{row['direction']}: pose audit order changed")
        if not row["frames"][5]["crossing"] or not row["frames"][15]["crossing"]:
            raise ValueError(f"{row['direction']}: passing crossovers are missing")
        for frame in row["frames"][:PLAYBACK]:
            left, right = frame["legs"]["left"], frame["legs"]["right"]
            if abs(left["forward"] + right["forward"]) > 0.01:
                raise ValueError(f"{row['direction']} frame {frame['frame']}: legs lost opposite phase")
            for leg in (left, right):
                hip, knee, ankle = leg["hip"], leg["knee"], leg["ankle"]
                upper = math.dist(hip, knee)
                lower = math.dist(knee, ankle)
                if abs(upper - 74.0) > 0.02 or abs(lower - 76.0) > 0.02:
                    raise ValueError(f"{row['direction']} frame {frame['frame']}: bone length drift")

    game = (ROOT / "game.js").read_text(encoding="utf-8")
    if "assets/sprite-archive/pre-rig-20260921/assets/" not in game or "candidates/merkel-21" in game:
        raise ValueError("the root game must continue using the stable archive")
    print("PASS merkel-21: 20 unique playback frames, exact closure, stable identity plates, fixed ground")


if __name__ == "__main__":
    verify()
