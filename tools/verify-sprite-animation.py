#!/usr/bin/env python3
"""Release gate for identity-locked authored sprite animation.

Every final runtime cell must be a byte-identical pixel result of downscaling
the single authored key named by the audit. This makes identity continuity a
provable invariant and prevents morphing, cutout reconstruction, recentering,
or unreviewed in-between anatomy from entering the game.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
EXPECTED_CHECKLIST = {
    "completeBody",
    "identityConsistency",
    "authoredFrameIdentity",
    "fixedCellGrid",
    "fixedGroundAnchor",
    "alternatingLegs",
    "passingPoseOverlap",
    "footContact",
    "loopSeam",
    "clearTransparency",
    "silhouetteScale",
    "directionalRowContract",
    "finalFrameContactSheet",
    "mirroredLeftArc",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "manifest",
        type=Path,
        nargs="?",
        default=ROOT / "assets/sprite-sources/verification.json",
    )
    parser.add_argument("--report", type=Path)
    parser.add_argument("--overlay-dir", type=Path)
    return parser.parse_args()


def repo_path(path: Path) -> Path:
    return path if path.is_absolute() else ROOT / path


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def pixel_sha256(image: Image.Image) -> str:
    return hashlib.sha256(image.convert("RGBA").tobytes()).hexdigest()


def clean_rgba(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    alpha = image.getchannel("A").point(lambda value: 0 if value <= 3 else value)
    image.putalpha(alpha)
    image.paste((0, 0, 0, 0), mask=alpha.point(lambda value: 255 if value == 0 else 0))
    return image


def clean_resize(frame: Image.Image, size: int) -> Image.Image:
    frame = clean_rgba(frame)
    resized = frame.convert("RGBa").resize((size, size), Image.Resampling.LANCZOS).convert("RGBA")
    return clean_rgba(resized)


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


def difference_ratio(left: np.ndarray, right: np.ndarray) -> float:
    union = left | right
    return float(np.count_nonzero(left ^ right) / max(1, np.count_nonzero(union)))


def key_metrics(frames: list[Image.Image]) -> dict[str, float]:
    masks = [np.asarray(frame.getchannel("A")) > 10 for frame in frames]
    boxes = []
    for mask in masks:
        ys, xs = np.nonzero(mask)
        if not len(xs):
            raise ValueError("empty authored key")
        boxes.append((int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)))
    centers_x = [(left + right) / 2 for left, _, right, _ in boxes]
    tops = [top for _, top, _, _ in boxes]
    grounds = [bottom for _, _, _, bottom in boxes]
    heights = [bottom - top for _, top, _, bottom in boxes]
    areas = [int(mask.sum()) for mask in masks]
    lower_masks = []
    for mask in masks:
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
    return {
        "centerXDrift": max(centers_x) - min(centers_x),
        "topDrift": float(max(tops) - min(tops)),
        "groundDrift": float(max(grounds) - min(grounds)),
        "heightRatio": max(heights) / min(heights),
        "areaRatio": max(areas) / min(areas),
        "maxLowerLimbChange": max(lower_changes),
        "maxOppositeLimbChange": max(opposite_changes),
    }


def validate_direction_contract(entry: dict, row_names: list[str]) -> dict:
    directions = entry.get("directions", {})
    if not directions:
        raise ValueError(f"{entry['id']}: missing direction contract")
    validated = {}
    for direction, reference in directions.items():
        mirrored = isinstance(reference, dict)
        row_name = reference.get("mirror") if mirrored else reference
        if row_name not in row_names:
            raise ValueError(f"{entry['id']}: {direction} references missing row {row_name}")
        if direction == "left" and mirrored and not row_name.startswith("right-"):
            raise ValueError(f"{entry['id']}: mirrored left arc must originate from a right-facing authored row")
        validated[direction] = {"rowName": row_name, "mirrored": mirrored}
    return validated


def draw_contact_sheet(
    sprite_id: str,
    row_names: list[str],
    runtime_rows: list[list[Image.Image]],
    audit_rows: list[dict],
    output_dir: Path,
) -> None:
    cell = 64
    label_height = 22
    sheet = Image.new("RGBA", (32 * cell, len(runtime_rows) * (cell + label_height)), (31, 33, 37, 255))
    draw = ImageDraw.Draw(sheet)
    for row_index, (frames, audit_row) in enumerate(zip(runtime_rows, audit_rows, strict=True)):
        y = row_index * (cell + label_height)
        for col_index, (frame, mapping) in enumerate(zip(frames, audit_row["frames"], strict=True)):
            shown = frame.resize((cell, cell), Image.Resampling.NEAREST)
            sheet.alpha_composite(shown, (col_index * cell, y))
            if col_index == 0 or mapping["sourceKey"] != audit_row["frames"][col_index - 1]["sourceKey"]:
                draw.line((col_index * cell, y, col_index * cell, y + cell), fill=(60, 230, 255, 255), width=2)
            draw.text((col_index * cell + 2, y + 2), str(mapping["sourceKey"]), fill=(255, 255, 255, 255))
        draw.text((4, y + cell + 3), row_names[row_index], fill=(255, 255, 255, 255))
    output_dir.mkdir(parents=True, exist_ok=True)
    sheet.save(output_dir / f"{sprite_id}-all-final-frames.png", optimize=True)


def check_entry(
    entry: dict,
    registry_entry: dict,
    audit_entry: dict,
    contract: dict,
    overlay_dir: Path | None,
) -> dict:
    source_path = ROOT / entry["source"]
    runtime_path = ROOT / entry["runtime"]
    for path in (source_path, runtime_path):
        if not path.is_file():
            raise ValueError(f"missing {path.relative_to(ROOT)}")
    if entry.get("visualStatus") != "pass" or not entry.get("reviewedOn") or not entry.get("reviewer"):
        raise ValueError(f"{entry['id']}: identity contact-sheet review is not signed off")
    if entry.get("renderMode") != "authored-key-hold-v1":
        raise ValueError(f"{entry['id']}: expected authored-key-hold-v1")
    for field, path in (("sourceSha256", source_path), ("runtimeSha256", runtime_path)):
        actual = sha256(path)
        if actual != entry.get(field):
            raise ValueError(
                f"{entry['id']}: {path.name} changed after visual review; expected {entry.get(field)}, got {actual}"
            )
    if entry["source"] != registry_entry["source"] or entry["runtime"] != registry_entry["runtime"]:
        raise ValueError(f"{entry['id']}: verification paths diverge from the runtime registry")

    key_cols = int(entry["keyCols"])
    row_names = registry_entry["rows"]
    rows = len(row_names)
    runtime_frames = int(contract["runtimeFrames"])
    if runtime_frames < 21 and registry_entry["walkRows"]:
        raise ValueError(f"{entry['id']}: walking rows need at least 21 runtime frames")
    source = Image.open(source_path)
    runtime = Image.open(runtime_path)
    alpha_contract(source, source_path, require_rgba=False)
    alpha_contract(runtime, runtime_path)
    source = source.convert("RGBA")
    runtime = runtime.convert("RGBA")
    source_rows = crop_cells(source, key_cols, rows, int(contract["sourceCell"]))
    runtime_rows = crop_cells(runtime, runtime_frames, rows, int(contract["runtimeCell"]))
    if [row["rowName"] for row in audit_entry["rows"]] != row_names:
        raise ValueError(f"{entry['id']}: identity audit rows diverge from the runtime registry")

    metrics = []
    for row_index, (keys, frames, audit_row) in enumerate(
        zip(source_rows, runtime_rows, audit_entry["rows"], strict=True)
    ):
        for key_index, key in enumerate(keys):
            bbox = key.getchannel("A").point(lambda value: 255 if value > 8 else 0).getbbox()
            if bbox is None or min(bbox[0], bbox[1], 256 - bbox[2], 256 - bbox[3]) < 4:
                raise ValueError(f"{entry['id']}: source row {row_index}, key {key_index} violates the 4px safety margin")
        seen_keys = set()
        for frame_index, (frame, mapping) in enumerate(zip(frames, audit_row["frames"], strict=True)):
            if mapping["frame"] != frame_index:
                raise ValueError(f"{entry['id']}: row {row_index} audit frame order is not one-to-one")
            source_key = int(mapping["sourceKey"])
            if not 0 <= source_key < key_cols:
                raise ValueError(f"{entry['id']}: row {row_index}, frame {frame_index} names an invalid source key")
            expected_key = min(key_cols - 1, frame_index * key_cols // runtime_frames)
            if source_key != expected_key:
                raise ValueError(f"{entry['id']}: row {row_index}, frame {frame_index} breaks balanced key timing")
            if pixel_sha256(keys[source_key]) != mapping["sourcePixelSha256"]:
                raise ValueError(f"{entry['id']}: row {row_index}, frame {frame_index} source identity hash failed")
            expected = clean_resize(keys[source_key], int(contract["runtimeCell"]))
            if ImageChops.difference(expected, frame).getbbox() is not None:
                raise ValueError(
                    f"{entry['id']}: runtime row {row_index}, frame {frame_index} is not its exact authored source pose"
                )
            if pixel_sha256(frame) != mapping["runtimePixelSha256"]:
                raise ValueError(f"{entry['id']}: row {row_index}, frame {frame_index} runtime identity hash failed")
            bbox = frame.getchannel("A").getbbox()
            if bbox is None or min(bbox[0], bbox[1], 128 - bbox[2], 128 - bbox[3]) < 1:
                raise ValueError(f"{entry['id']}: runtime row {row_index}, frame {frame_index} touches its cell edge")
            seen_keys.add(source_key)
        if len(seen_keys) != key_cols:
            raise ValueError(f"{entry['id']}: row {row_index} does not expose every authored key")

        values = key_metrics(keys)
        values["row"] = row_index
        values["rowName"] = row_names[row_index]
        is_walk = row_index in registry_entry["walkRows"]
        if values["centerXDrift"] > (12.5 if is_walk else 45.0):
            raise ValueError(f"{entry['id']}: row {row_index} horizontal anchor drifts")
        if values["topDrift"] > (17.0 if is_walk else 22.0):
            raise ValueError(f"{entry['id']}: row {row_index} head/top registration drifts")
        if values["groundDrift"] > (4.0 if is_walk else 22.0):
            raise ValueError(f"{entry['id']}: row {row_index} ground anchor drifts")
        if values["heightRatio"] > (1.09 if is_walk else 1.13):
            raise ValueError(f"{entry['id']}: row {row_index} scale changes between authored poses")
        if is_walk and values["maxLowerLimbChange"] < 0.12:
            raise ValueError(f"{entry['id']}: row {row_index} lacks a readable lower-limb gait change")
        if is_walk and values["maxOppositeLimbChange"] < 0.14:
            raise ValueError(f"{entry['id']}: row {row_index} lacks distinct opposite-leg phases")
        metrics.append(values)

    directions = validate_direction_contract(registry_entry, row_names)
    if overlay_dir:
        draw_contact_sheet(entry["id"], row_names, runtime_rows, audit_entry["rows"], overlay_dir)
    return {
        "id": entry["id"],
        "runtime": entry["runtime"],
        "rows": metrics,
        "directions": directions,
        "exactRuntimeFrames": rows * runtime_frames,
    }


def main() -> None:
    args = parse_args()
    manifest = json.loads(repo_path(args.manifest).read_text(encoding="utf-8"))
    if set(manifest.get("visualChecklist", [])) != EXPECTED_CHECKLIST:
        raise ValueError("visual verification manifest does not declare the complete identity checklist")
    audit_path = ROOT / manifest["identityAudit"]
    if not audit_path.is_file() or sha256(audit_path) != manifest.get("identityAuditSha256"):
        raise ValueError("identity audit changed after final frame-by-frame visual review")
    audit = json.loads(audit_path.read_text(encoding="utf-8"))
    registry = json.loads((ROOT / "assets/sprite-sources/rigs/registry.json").read_text(encoding="utf-8"))
    if audit.get("renderMode") != registry["frameContract"]["renderMode"]:
        raise ValueError("identity audit render mode diverges from the registry")
    audit_by_id = {entry["id"]: entry for entry in audit["sprites"]}
    registry_by_id = {entry["id"]: entry for entry in registry["sprites"]}
    overlay_dir = repo_path(args.overlay_dir) if args.overlay_dir else None
    results = [
        check_entry(
            entry,
            registry_by_id[entry["id"]],
            audit_by_id[entry["id"]],
            registry["frameContract"],
            overlay_dir,
        )
        for entry in manifest["sprites"]
    ]
    if args.report:
        report_path = repo_path(args.report)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps({"status": "pass", "sprites": results}, indent=2) + "\n", encoding="utf-8")
    for result in results:
        worst_x = max(row["centerXDrift"] for row in result["rows"])
        worst_ground = max(row["groundDrift"] for row in result["rows"])
        print(
            f"PASS {result['id']}: {result['exactRuntimeFrames']} final cells are exact authored poses; "
            f"center drift x={worst_x:.1f}px, ground drift={worst_ground:.1f}px"
        )


if __name__ == "__main__":
    main()
