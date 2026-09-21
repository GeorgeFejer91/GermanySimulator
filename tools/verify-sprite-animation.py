#!/usr/bin/env python3
"""Hard quality gate for every signed-off moving character atlas.

The gate combines deterministic image checks with a SHA-256-bound visual
review ledger. Any source or runtime pixel change invalidates the visual
approval and must be reviewed again before it can pass.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw
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
    parser.add_argument("--overlay-dir", type=Path)
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


def expected_direction(row_name: str) -> tuple[str, int, str]:
    if row_name.startswith("left-"):
        return "x", -1, "side"
    if row_name.startswith("right-"):
        return "x", 1, "side"
    if row_name.startswith("back-"):
        return "y", -1, "back"
    if row_name.startswith("front-"):
        return "y", 1, "front"
    raise ValueError(f"unknown directional row contract: {row_name}")


def alpha_anchor_distance(mask: np.ndarray, point: list[float]) -> float:
    distance = ndimage.distance_transform_edt(~mask)
    x = min(mask.shape[1] - 1, max(0, round(point[0] / 4)))
    y = min(mask.shape[0] - 1, max(0, round(point[1] / 4)))
    return float(distance[y, x])


def draw_pose_overlay(
    sprite_id: str,
    runtime_rows: list[list[Image.Image]],
    audit_rows: list[dict],
    output_dir: Path,
) -> None:
    tile = 128
    sheet = Image.new("RGB", (tile * 8, tile * 4 * len(runtime_rows)), (45, 45, 45))
    for row_index, (frames, audit_row) in enumerate(zip(runtime_rows, audit_rows, strict=True)):
        for frame_index, (frame, pose) in enumerate(zip(frames, audit_row["frames"], strict=True)):
            tile_image = Image.new("RGBA", (tile, tile), (45, 45, 45, 255))
            tile_image.alpha_composite(frame)
            draw = ImageDraw.Draw(tile_image)
            for side, color in (("left", (54, 210, 255, 255)), ("right", (255, 80, 196, 255))):
                limb = pose["limbs"][side]
                points = [tuple(value / 4 for value in limb[name]) for name in ("hip", "knee", "ankle")]
                draw.line(points, fill=color, width=2)
                ax, ay = points[-1]
                ankle_color = (255, 203, 70, 255) if limb["swing"] else (65, 235, 120, 255)
                draw.ellipse((ax - 3, ay - 3, ax + 3, ay + 3), fill=ankle_color)
            axis, sign = pose["movementAxis"], pose["movementSign"]
            if axis != "none":
                start = (14, 12)
                end = (29, 12) if axis == "x" and sign > 0 else (1, 12) if axis == "x" else (14, 27) if sign > 0 else (14, 1)
                draw.line((start, end), fill=(255, 255, 255, 255), width=2)
            draw.text((3, 3), str(frame_index), fill=(255, 255, 255, 255))
            col, band = frame_index % 8, frame_index // 8
            sheet.paste(tile_image.convert("RGB"), (col * tile, (row_index * 4 + band) * tile))
    output_dir.mkdir(parents=True, exist_ok=True)
    sheet.save(output_dir / f"{sprite_id}-all-frames.png", optimize=True)


def verify_directional_pose(
    entry: dict,
    audit_entry: dict,
    row_names: list[str],
    runtime_rows: list[list[Image.Image]],
    walk_rows: set[int],
    overlay_dir: Path | None,
) -> list[dict]:
    if audit_entry.get("source") != entry["source"] or audit_entry.get("runtime") != entry["runtime"]:
        raise ValueError(f"{entry['id']}: pose audit points at the wrong source/runtime")
    if audit_entry.get("sourceSha256") != entry["sourceSha256"] or audit_entry.get("runtimeSha256") != entry["runtimeSha256"]:
        raise ValueError(f"{entry['id']}: pose audit is stale for the signed final atlas")
    audit_rows = audit_entry.get("rows", [])
    if len(audit_rows) != len(runtime_rows) or len(row_names) != len(runtime_rows):
        raise ValueError(f"{entry['id']}: pose audit row count does not match the final atlas")

    expected_states = {
        0: "contact-a", 4: "down-a", 8: "passing-a", 12: "up-a",
        16: "contact-b", 20: "down-b", 24: "passing-b", 28: "up-b",
    }
    results = []
    overlay_runtime_rows = list(runtime_rows)
    overlay_audit_rows = list(audit_rows)
    for row_index, (row_name, frames, audit_row) in enumerate(zip(row_names, runtime_rows, audit_rows, strict=True)):
        if audit_row.get("rowName") != row_name or len(audit_row.get("frames", [])) != 32:
            raise ValueError(f"{entry['id']}: row {row_index} lacks a one-to-one 32-frame pose audit")
        poses = audit_row["frames"]
        masks = [np.asarray(frame.getchannel("A")) > 10 for frame in frames]
        worst_anchor = 0.0
        for frame_index, (pose, mask) in enumerate(zip(poses, masks, strict=True)):
            if pose.get("frame") != frame_index:
                raise ValueError(f"{entry['id']}: row {row_index} pose frame order is not one-to-one")
            expected_state = expected_states.get(frame_index, "transition")
            if pose.get("phaseState") != expected_state:
                raise ValueError(f"{entry['id']}: row {row_index}, frame {frame_index} is labeled {pose.get('phaseState')}, expected {expected_state}")
            for side in ("left", "right"):
                for anchor in ("hip", "knee", "ankle"):
                    distance = alpha_anchor_distance(mask, pose["limbs"][side][anchor])
                    worst_anchor = max(worst_anchor, distance)
                    if distance > 3.0:
                        raise ValueError(
                            f"{entry['id']}: row {row_index}, frame {frame_index} {side} {anchor} "
                            f"misses the final sprite by {distance:.1f}px"
                        )
        if row_index not in walk_rows:
            results.append({"row": row_index, "rowName": row_name, "worstAnchorMiss": worst_anchor})
            continue

        axis, sign, view = expected_direction(row_name)
        coord = 0 if axis == "x" else 1
        for pose in poses:
            if pose.get("movementAxis") != axis or pose.get("movementSign") != sign or pose.get("view") != view:
                raise ValueError(f"{entry['id']}: row {row_index} direction metadata disagrees with {row_name}")

        def ankle(frame: int, side: str) -> float:
            return float(poses[frame]["limbs"][side]["ankle"][coord])

        contact_a = (ankle(0, "left") - ankle(0, "right")) * sign
        contact_b = (ankle(16, "right") - ankle(16, "left")) * sign
        if min(contact_a, contact_b) < 12.0:
            raise ValueError(f"{entry['id']}: row {row_index} opposite contacts do not lead in {row_name}")
        stance_left = (ankle(16, "left") - ankle(0, "left")) * sign
        stance_right = (ankle(31, "right") - ankle(16, "right")) * sign
        swing_right = (ankle(15, "right") - ankle(1, "right")) * sign
        swing_left = (ankle(31, "left") - ankle(17, "left")) * sign
        if max(stance_left, stance_right) > -10.0:
            raise ValueError(f"{entry['id']}: row {row_index} stance foot travels with the body (moonwalk regression)")
        if min(swing_left, swing_right) < 10.0:
            raise ValueError(f"{entry['id']}: row {row_index} swing foot does not advance with {row_name}")
        if not poses[8]["limbs"]["right"]["swing"] or not poses[24]["limbs"]["left"]["swing"]:
            raise ValueError(f"{entry['id']}: row {row_index} passing phases lift the wrong limb")
        if poses[8]["limbs"]["left"]["swing"] or poses[24]["limbs"]["right"]["swing"]:
            raise ValueError(f"{entry['id']}: row {row_index} stance limb is lifted at passing")
        if view in {"front", "back"}:
            for frame_index, pose in enumerate(poses):
                left = pose["limbs"]["left"]
                right = pose["limbs"]["right"]
                if left["ankle"][0] >= right["ankle"][0] - 2.0:
                    raise ValueError(f"{entry['id']}: row {row_index}, frame {frame_index} vertical ankles invert sides")
                if right["knee"][0] - left["knee"][0] < 8.0:
                    raise ValueError(f"{entry['id']}: row {row_index}, frame {frame_index} vertical knees collapse together")
                for side, limb in (("left", left), ("right", right)):
                    hip, knee, ankle_point = limb["hip"], limb["knee"], limb["ankle"]
                    if not hip[1] + 6.0 < knee[1] < ankle_point[1] - 4.0:
                        raise ValueError(
                            f"{entry['id']}: row {row_index}, frame {frame_index} {side} joint order is disfigured"
                        )
                    center_line = (hip[0] + ankle_point[0]) / 2.0
                    if abs(knee[0] - center_line) > 22.0:
                        raise ValueError(
                            f"{entry['id']}: row {row_index}, frame {frame_index} {side} knee bows outside the vertical arc"
                        )
        results.append({
            "row": row_index,
            "rowName": row_name,
            "worstAnchorMiss": worst_anchor,
            "contactLeadMin": min(contact_a, contact_b),
            "stanceTravelMax": max(stance_left, stance_right),
            "swingTravelMin": min(swing_left, swing_right),
        })

    # Some atlases ship one right-facing row and the runtime mirrors it for
    # left travel. Verify and render that exact final transformation too.
    for row_index, (row_name, frames, audit_row) in enumerate(zip(row_names, runtime_rows, audit_rows, strict=True)):
        if row_index not in walk_rows or not row_name.startswith("right-"):
            continue
        left_name = "left-" + row_name.removeprefix("right-")
        if left_name in row_names:
            continue
        mirrored_frames = [frame.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for frame in frames]
        mirrored_row = copy.deepcopy(audit_row)
        mirrored_row["rowName"] = left_name
        for pose in mirrored_row["frames"]:
            pose["mirrored"] = not pose["mirrored"]
            pose["movementSign"] = -1
            pose["root"][0] = 512.0 - pose["root"][0]
            for limb in pose["limbs"].values():
                for anchor in ("hip", "knee", "ankle"):
                    limb[anchor][0] = 512.0 - limb[anchor][0]
        masks = [np.asarray(frame.getchannel("A")) > 10 for frame in mirrored_frames]
        worst_anchor = 0.0
        for frame_index, (pose, mask) in enumerate(zip(mirrored_row["frames"], masks, strict=True)):
            for side in ("left", "right"):
                for anchor in ("hip", "knee", "ankle"):
                    distance = alpha_anchor_distance(mask, pose["limbs"][side][anchor])
                    worst_anchor = max(worst_anchor, distance)
                    if distance > 3.0:
                        raise ValueError(
                            f"{entry['id']}: mirrored {left_name} frame {frame_index} {side} {anchor} "
                            f"misses the final sprite by {distance:.1f}px"
                        )

        def mirrored_ankle(frame: int, side: str) -> float:
            return float(mirrored_row["frames"][frame]["limbs"][side]["ankle"][0])

        contact_a = (mirrored_ankle(0, "left") - mirrored_ankle(0, "right")) * -1
        contact_b = (mirrored_ankle(16, "right") - mirrored_ankle(16, "left")) * -1
        stance_left = (mirrored_ankle(16, "left") - mirrored_ankle(0, "left")) * -1
        stance_right = (mirrored_ankle(31, "right") - mirrored_ankle(16, "right")) * -1
        swing_right = (mirrored_ankle(15, "right") - mirrored_ankle(1, "right")) * -1
        swing_left = (mirrored_ankle(31, "left") - mirrored_ankle(17, "left")) * -1
        if min(contact_a, contact_b) < 12.0 or max(stance_left, stance_right) > -10.0 or min(swing_left, swing_right) < 10.0:
            raise ValueError(f"{entry['id']}: mirrored {left_name} reverses a gait direction")
        results.append({
            "row": f"mirror:{row_index}",
            "rowName": left_name,
            "mirroredFrom": row_name,
            "worstAnchorMiss": worst_anchor,
            "contactLeadMin": min(contact_a, contact_b),
            "stanceTravelMax": max(stance_left, stance_right),
            "swingTravelMin": min(swing_left, swing_right),
        })
        overlay_runtime_rows.append(mirrored_frames)
        overlay_audit_rows.append(mirrored_row)
    if overlay_dir:
        draw_pose_overlay(entry["id"], overlay_runtime_rows, overlay_audit_rows, overlay_dir)
    return results


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


def check_entry(
    entry: dict,
    audit_entry: dict,
    row_names: list[str],
    overlay_dir: Path | None,
) -> dict:
    rig_path = ROOT / entry["rig"]
    source_path = ROOT / entry["source"]
    runtime_path = ROOT / entry["runtime"]
    for path in (rig_path, source_path, runtime_path):
        if not path.is_file():
            raise ValueError(f"missing {path.relative_to(ROOT)}")
    if entry.get("visualStatus") != "pass" or not entry.get("reviewedOn") or not entry.get("reviewer"):
        raise ValueError(f"{entry['id']}: visual anatomy review is not signed off")
    if entry.get("renderMode") != "directional-depth-rig-v2":
        raise ValueError(f"{entry['id']}: expected the signed directional-depth rig renderer")
    for field, path in (
        ("rigSha256", rig_path),
        ("sourceSha256", source_path),
        ("runtimeSha256", runtime_path),
    ):
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
            "minKeyChange": 0.015 if is_walk else 0.0,
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

    directions = verify_directional_pose(entry, audit_entry, row_names, runtime_rows, walk_rows, overlay_dir)
    return {"id": entry["id"], "runtime": entry["runtime"], "rows": metrics, "directions": directions}


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
        "rigSourceIntegrity",
        "jointContinuity",
        "stanceFootPinning",
        "silhouetteScale",
        "directionalPhaseMapping",
        "finalFrameOverlay",
        "verticalJointOrder",
        "mirroredLeftArc",
    }
    if set(manifest.get("visualChecklist", [])) != required_checks:
        raise ValueError("visual verification manifest does not declare the complete anatomy checklist")
    pose_audit_path = ROOT / manifest["poseAudit"]
    if not pose_audit_path.is_file() or sha256(pose_audit_path) != manifest.get("poseAuditSha256"):
        raise ValueError("pose audit changed after the final frame-by-frame visual review")
    pose_audit = json.loads(pose_audit_path.read_text(encoding="utf-8"))
    audit_by_id = {entry["id"]: entry for entry in pose_audit.get("sprites", [])}
    registry = json.loads((ROOT / "assets/sprite-sources/rigs/registry.json").read_text(encoding="utf-8"))
    registry_by_id = {entry["id"]: entry for entry in registry["sprites"]}
    overlay_dir = args.overlay_dir
    if overlay_dir and not overlay_dir.is_absolute():
        overlay_dir = ROOT / overlay_dir
    results = [
        check_entry(entry, audit_by_id[entry["id"]], registry_by_id[entry["id"]]["rows"], overlay_dir)
        for entry in manifest["sprites"]
    ]
    if args.report:
        report_path = args.report if args.report.is_absolute() else ROOT / args.report
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps({"status": "pass", "sprites": results}, indent=2) + "\n", encoding="utf-8")
    for result in results:
        worst_x = max(row["centerXDrift"] for row in result["rows"])
        worst_y = max(row["centerYDrift"] for row in result["rows"])
        worst_anchor = max(row["worstAnchorMiss"] for row in result["directions"])
        print(
            f"PASS {result['id']}: signed final-frame direction + anatomy/loop gate; "
            f"center drift x={worst_x:.1f}px y={worst_y:.1f}px, anchor miss={worst_anchor:.1f}px"
        )


if __name__ == "__main__":
    main()
