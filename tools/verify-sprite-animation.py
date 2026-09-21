#!/usr/bin/env python3
"""Hard quality gate for every signed-off moving character atlas.

The gate combines deterministic image checks with a SHA-256-bound visual
review ledger. Any source or runtime pixel change invalidates the visual
approval and must be reviewed again before it can pass.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops
from scipy import ndimage


ROOT = Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "manifest",
        type=Path,
        nargs="?",
        default=ROOT / "assets/sprite-sources/verification.json",
    )
    parser.add_argument("--report", type=Path)
    return parser.parse_args()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def clean_resize(frame: Image.Image, size: int) -> Image.Image:
    frame = frame.convert("RGBA")
    source_alpha = frame.getchannel("A").point(lambda value: 0 if value <= 3 else value)
    frame.putalpha(source_alpha)
    frame.paste((0, 0, 0, 0), mask=source_alpha.point(lambda value: 255 if value == 0 else 0))
    resized = frame.convert("RGBa").resize((size, size), Image.Resampling.LANCZOS).convert("RGBA")
    alpha = resized.getchannel("A").point(lambda value: 0 if value <= 3 else value)
    resized.putalpha(alpha)
    resized.paste((0, 0, 0, 0), mask=alpha.point(lambda value: 255 if value == 0 else 0))
    return resized


def difference_ratio(left: np.ndarray, right: np.ndarray) -> float:
    union = left | right
    return float(np.count_nonzero(left ^ right) / max(1, np.count_nonzero(union)))


def alpha_contract(image: Image.Image, path: Path, require_rgba: bool = True) -> None:
    if require_rgba and image.mode != "RGBA":
        raise ValueError(f"{path}: expected full RGBA, got {image.mode}")
    image = image.convert("RGBA")
    red, green, blue, alpha = image.split()
    color = ImageChops.lighter(red, ImageChops.lighter(green, blue))
    transparent = alpha.point(lambda value: 255 if value == 0 else 0)
    if ImageChops.multiply(color, transparent).getbbox() is not None:
        raise ValueError(f"{path}: fully transparent pixels contain hidden RGB")
    if alpha.point(lambda value: 255 if 0 < value < 255 else 0).getbbox() is None:
        raise ValueError(f"{path}: antialiased alpha edge is missing")


def crop_cells(image: Image.Image, cols: int, rows: int, cell: int) -> list[list[Image.Image]]:
    expected = (cols * cell, rows * cell)
    if image.size != expected:
        raise ValueError(f"expected {expected}, got {image.size}")
    return [
        [
            image.crop((col * cell, row * cell, (col + 1) * cell, (row + 1) * cell))
            for col in range(cols)
        ]
        for row in range(rows)
    ]


def row_metrics(frames: list[Image.Image], key_stride: int) -> dict[str, float]:
    masks = [np.asarray(frame.getchannel("A")) > 10 for frame in frames]
    boxes = []
    component_shares = []
    for mask in masks:
        ys, xs = np.nonzero(mask)
        if not len(xs):
            raise ValueError("empty frame")
        boxes.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
        labels, count = ndimage.label(mask)
        areas = np.bincount(labels.ravel())[1 : count + 1]
        component_shares.append(float(areas.max() / mask.sum()))

    keys = masks[::key_stride]
    key_boxes = boxes[::key_stride]
    key_changes = [difference_ratio(keys[index], keys[(index + 1) % len(keys)]) for index in range(len(keys))]
    runtime_changes = [
        difference_ratio(masks[index], masks[(index + 1) % len(masks)]) for index in range(len(masks))
    ]
    centers_x = [(left + right) / 2 for left, _, right, _ in key_boxes]
    centers_y = [(top + bottom) / 2 for _, top, _, bottom in key_boxes]
    heights = [bottom - top for _, top, _, bottom in key_boxes]
    areas = [int(mask.sum()) for mask in keys]

    lower_masks = []
    for mask in keys:
        ys, _ = np.nonzero(mask)
        cutoff = int(ys.min() + 0.55 * (ys.max() - ys.min() + 1))
        lower = mask.copy()
        lower[:cutoff] = False
        lower_masks.append(lower)
    lower_changes = [
        difference_ratio(lower_masks[index], lower_masks[(index + 1) % len(lower_masks)])
        for index in range(len(lower_masks))
    ]
    half = len(lower_masks) // 2
    opposite_changes = [
        difference_ratio(lower_masks[index], lower_masks[(index + half) % len(lower_masks)])
        for index in range(half)
    ]
    internal_runtime_max = max(runtime_changes[:-1])
    return {
        "centerXDrift": max(centers_x) - min(centers_x),
        "centerYDrift": max(centers_y) - min(centers_y),
        "heightRatio": max(heights) / min(heights),
        "areaRatio": max(areas) / min(areas),
        "minKeyChange": min(key_changes),
        "maxKeyChange": max(key_changes),
        "maxRuntimeChange": internal_runtime_max,
        "seamChange": runtime_changes[-1],
        "minComponentShare": min(component_shares),
        "maxLowerLimbChange": max(lower_changes),
        "maxOppositeLimbChange": max(opposite_changes),
    }


def check_entry(entry: dict) -> dict:
    source_path = ROOT / entry["source"]
    runtime_path = ROOT / entry["runtime"]
    for path in (source_path, runtime_path):
        if not path.is_file():
            raise ValueError(f"missing {path.relative_to(ROOT)}")
    if entry.get("visualStatus") != "pass" or not entry.get("reviewedOn") or not entry.get("reviewer"):
        raise ValueError(f"{entry['id']}: visual anatomy review is not signed off")
    for field, path in (("sourceSha256", source_path), ("runtimeSha256", runtime_path)):
        actual = sha256(path)
        if actual != entry.get(field):
            raise ValueError(
                f"{entry['id']}: {path.name} changed after visual review; expected {entry.get(field)}, got {actual}"
            )

    key_cols = int(entry["keyCols"])
    rows = int(entry["rows"])
    inbetweens = int(entry.get("inbetweens", 3))
    key_stride = inbetweens + 1
    runtime_cols = key_cols * key_stride
    walk_rows = {int(value) for value in entry["walkRows"]}
    if any(row < 0 or row >= rows for row in walk_rows):
        raise ValueError(f"{entry['id']}: walkRows contains an invalid row")
    if runtime_cols < 21 and walk_rows:
        raise ValueError(f"{entry['id']}: walking rows need at least 21 runtime frames")

    source = Image.open(source_path)
    runtime = Image.open(runtime_path)
    alpha_contract(source, source_path, require_rgba=False)
    alpha_contract(runtime, runtime_path)
    source = source.convert("RGBA")
    source_rows = crop_cells(source, key_cols, rows, 256)
    runtime_rows = crop_cells(runtime, runtime_cols, rows, 128)

    metrics = []
    for row, (source_frames, runtime_frames) in enumerate(zip(source_rows, runtime_rows, strict=True)):
        for col, frame in enumerate(source_frames):
            bbox = frame.getchannel("A").getbbox()
            if bbox is None or min(bbox[0], bbox[1], 256 - bbox[2], 256 - bbox[3]) < 4:
                raise ValueError(f"{entry['id']}: source row {row}, key {col} violates the 4px safety margin")
            expected = clean_resize(frame, 128)
            if ImageChops.difference(expected, runtime_frames[col * key_stride]).getbbox() is not None:
                raise ValueError(f"{entry['id']}: runtime row {row}, frame {col * key_stride} does not preserve its key")
        for col, frame in enumerate(runtime_frames):
            bbox = frame.getchannel("A").getbbox()
            if bbox is None or min(bbox[0], bbox[1], 128 - bbox[2], 128 - bbox[3]) < 1:
                raise ValueError(f"{entry['id']}: runtime row {row}, frame {col} touches its cell edge")

        values = row_metrics(runtime_frames, key_stride)
        values["row"] = row
        is_walk = row in walk_rows
        limits = {
            "centerXDrift": 8.0 if is_walk else 20.0,
            "centerYDrift": 6.0 if is_walk else 10.0,
            "heightRatio": 1.12 if is_walk else 1.15,
            "areaRatio": 1.45 if is_walk else 1.75,
            "minKeyChange": 0.015,
            "maxKeyChange": 0.55,
            "maxRuntimeChange": 0.35,
        }
        for metric, limit in limits.items():
            value = values[metric]
            if metric == "minKeyChange":
                if value < limit:
                    raise ValueError(f"{entry['id']}: row {row} repeats a key pose ({value:.3f} < {limit})")
            elif value > limit:
                raise ValueError(f"{entry['id']}: row {row} {metric} {value:.3f} exceeds {limit}")
        if values["minComponentShare"] < 0.90:
            raise ValueError(f"{entry['id']}: row {row} contains a detached fragment or limb")
        if values["seamChange"] > values["maxRuntimeChange"] * 1.35 + 0.01:
            raise ValueError(f"{entry['id']}: row {row} loop seam jumps more than its internal transitions")
        if is_walk and values["maxLowerLimbChange"] < 0.12:
            raise ValueError(f"{entry['id']}: row {row} lacks a readable lower-limb gait change")
        if is_walk and values["maxOppositeLimbChange"] < 0.10:
            raise ValueError(f"{entry['id']}: row {row} lacks distinct opposite-leg phases")
        metrics.append(values)

    return {"id": entry["id"], "runtime": entry["runtime"], "rows": metrics}


def main() -> None:
    args = parse_args()
    manifest_path = args.manifest if args.manifest.is_absolute() else ROOT / args.manifest
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    required_checks = {
        "completeBody",
        "identityConsistency",
        "headTorsoRegistration",
        "alternatingLegs",
        "passingPoseOverlap",
        "footContact",
        "loopSeam",
        "clearTransparency",
    }
    if set(manifest.get("visualChecklist", [])) != required_checks:
        raise ValueError("visual verification manifest does not declare the complete anatomy checklist")
    results = [check_entry(entry) for entry in manifest["sprites"]]
    if args.report:
        report_path = args.report if args.report.is_absolute() else ROOT / args.report
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps({"status": "pass", "sprites": results}, indent=2) + "\n", encoding="utf-8")
    for result in results:
        worst_x = max(row["centerXDrift"] for row in result["rows"])
        worst_y = max(row["centerYDrift"] for row in result["rows"])
        print(f"PASS {result['id']}: signed visual review + anatomy/loop gate; center drift x={worst_x:.1f}px y={worst_y:.1f}px")


if __name__ == "__main__":
    main()
