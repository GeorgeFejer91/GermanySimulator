#!/usr/bin/env python3
"""Release gate for the shared biomechanical sprite gait.

The gate validates the final PNG cells, the signed rig audit, and the runtime
direction contract together. It checks mechanics rather than trusting a pretty
source sheet: stance feet travel backward relative to the pelvis, swing feet
clear the ground and cross at passing, all 32 cells are real poses, and the
cyclic seam stays bounded.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "assets/sprite-sources/rigs/registry.json"
EXPECTED_CHECKLIST = {
    "completeBody", "identityConsistency", "rigidHeadTorso", "fixedCellGrid",
    "fixedRoot", "fixedGroundContact", "eightPhaseGait", "alternatingStanceSwing",
    "stanceFootConstraint", "toeClearance", "passingPoseLegCrossing",
    "forwardDirectionNoMoonwalk", "boundedLoopSeam", "clearTransparency",
    "silhouetteScale", "directionalRowContract", "thirtyTwoDirectFrames",
    "finalFrameContactSheet", "mirroredLeftArc", "headShoulderConnection",
    "directionalProportionConsistency", "identityReferenceSilhouette",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "manifest", type=Path, nargs="?",
        default=ROOT / "assets/sprite-sources/verification.json",
    )
    parser.add_argument("--report", type=Path)
    parser.add_argument("--overlay-dir", type=Path)
    parser.add_argument(
        "--allow-unsigned", action="store_true",
        help="run the full authoring gate before the final hashes are signed",
    )
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
    resized = clean_rgba(frame).convert("RGBa").resize(
        (size, size), Image.Resampling.LANCZOS
    ).convert("RGBA")
    return clean_rgba(resized)


def alpha_contract(image: Image.Image, path: Path, require_rgba: bool = True) -> None:
    if require_rgba and image.mode != "RGBA":
        raise ValueError(f"{path}: expected full RGBA, got {image.mode}")
    red, green, blue, alpha = image.convert("RGBA").split()
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
        [image.crop((col * cell, row * cell, (col + 1) * cell, (row + 1) * cell)) for col in range(cols)]
        for row in range(rows)
    ]


def distance(left: list[float], right: list[float]) -> float:
    return math.hypot(left[0] - right[0], left[1] - right[1])


def point_has_alpha(frame: Image.Image, point: list[float], radius: int = 5) -> bool:
    x, y = (int(round(value / 4.0)) for value in point)
    alpha = np.asarray(frame.getchannel("A"))
    top, bottom = max(0, y - radius), min(alpha.shape[0], y + radius + 1)
    left, right = max(0, x - radius), min(alpha.shape[1], x + radius + 1)
    return bool(np.any(alpha[top:bottom, left:right] >= 24))


def stable_upper_metrics(frames: list[Image.Image], audit_frames: list[dict]) -> dict[str, float]:
    centers, tops, grounds, heights = [], [], [], []
    for frame, audit in zip(frames, audit_frames, strict=True):
        mask = np.asarray(frame.getchannel("A")) >= 16
        ys, xs = np.nonzero(mask)
        if not len(xs):
            raise ValueError("empty final frame")
        top, bottom = int(ys.min()), int(ys.max() + 1)
        tops.append(top)
        grounds.append(bottom)
        heights.append(bottom - top)
        root_y = int(round(audit["root"][1] / 4.0))
        upper = mask.copy()
        upper[max(0, root_y):] = False
        _, ux = np.nonzero(upper)
        centers.append(float(np.mean(ux)) if len(ux) else float(np.mean(xs)))
    return {
        "upperCenterDrift": max(centers) - min(centers),
        "topDrift": float(max(tops) - min(tops)),
        "groundDrift": float(max(grounds) - min(grounds)),
        "heightRatio": max(heights) / min(heights),
    }


def validate_direction_contract(entry: dict) -> dict:
    rows = entry["rows"]
    directions = entry.get("directions", {})
    if not directions:
        raise ValueError(f"{entry['id']}: missing direction contract")
    result = {}
    for direction, reference in directions.items():
        mirrored = isinstance(reference, dict)
        row_name = reference.get("mirror") if mirrored else reference
        if row_name not in rows:
            raise ValueError(f"{entry['id']}: {direction} references missing row {row_name}")
        if direction == "left" and mirrored and not row_name.startswith("right-"):
            raise ValueError(f"{entry['id']}: mirrored left arc must originate from a right-facing row")
        result[direction] = {"rowName": row_name, "mirrored": mirrored}
    return result


def assert_monotone(values: list[float], increasing: bool, label: str) -> None:
    for first, second in zip(values, values[1:]):
        if increasing and second + 0.002 < first:
            raise ValueError(f"{label}: swing foot reverses before contact")
        if not increasing and second - 0.002 > first:
            raise ValueError(f"{label}: stance foot slides forward (moonwalk)")


def loop_seam_ratio(frames: list[dict]) -> float:
    def frame_delta(first: dict, second: dict) -> float:
        values = [distance(first["root"], second["root"])]
        for side in ("left", "right"):
            values.extend(
                distance(first["limbs"][side][name], second["limbs"][side][name])
                for name in ("hip", "knee", "ankle")
            )
        return max(values)
    internal = [frame_delta(frames[index], frames[index + 1]) for index in range(31)]
    return frame_delta(frames[-1], frames[0]) / max(1.0, max(internal))


def validate_biomechanics(sprite_id: str, row_name: str, frames: list[dict]) -> dict[str, float]:
    if len(frames) != 32 or [frame["frame"] for frame in frames] != list(range(32)):
        raise ValueError(f"{sprite_id} {row_name}: pose audit is not one-to-one with all 32 final cells")
    expected_states = {
        0: "contact-a", 4: "loading-a", 8: "passing-a", 12: "push-off-a",
        16: "contact-b", 20: "loading-b", 24: "passing-b", 28: "push-off-b",
    }
    for index, state in expected_states.items():
        if frames[index]["phaseState"] != state:
            raise ValueError(f"{sprite_id} {row_name}: frame {index} is not {state}")
    head_shoulder_gaps = [
        abs(
            frame["headBottom"][1]
            - sum(point[1] for point in frame["shoulders"].values()) / 2
        )
        for frame in frames
    ]
    if max(head_shoulder_gaps) > 8.0:
        raise ValueError(f"{sprite_id} {row_name}: head floats above the shoulder line")
    idle = row_name.endswith("idle")
    if idle:
        if any(frame["movementAxis"] != "none" or frame["movementSign"] != 0 for frame in frames):
            raise ValueError(f"{sprite_id} {row_name}: idle row declares movement")
        return {
            "seamRatio": 0.0,
            "maxBoneProjectionRatio": 1.0,
            "maxHeadShoulderGap": max(head_shoulder_gaps),
        }

    if any(frame["movementAxis"] == "none" or frame["movementSign"] not in (-1, 1) for frame in frames):
        raise ValueError(f"{sprite_id} {row_name}: walking direction is incomplete")
    axis, sign = frames[0]["movementAxis"], frames[0]["movementSign"]
    if any(frame["movementAxis"] != axis or frame["movementSign"] != sign for frame in frames):
        raise ValueError(f"{sprite_id} {row_name}: movement direction changes inside one gait cycle")

    for index, frame in enumerate(frames):
        expected_left = index < 16
        if frame["limbs"]["left"]["stance"] != expected_left:
            raise ValueError(f"{sprite_id} {row_name}: left stance ownership is wrong at frame {index}")
        if frame["limbs"]["right"]["stance"] == expected_left:
            raise ValueError(f"{sprite_id} {row_name}: right stance ownership is wrong at frame {index}")
        stance_side = "left" if expected_left else "right"
        if abs(frame["limbs"][stance_side]["lift"]) > 0.05:
            raise ValueError(f"{sprite_id} {row_name}: stance foot lifts at frame {index}")
    for contact in (0, 16):
        if any(abs(frames[contact]["limbs"][side]["lift"]) > 0.05 for side in ("left", "right")):
            raise ValueError(f"{sprite_id} {row_name}: contact frame {contact} lacks double support")
    passing_clearance = min(frames[8]["limbs"]["right"]["lift"], frames[24]["limbs"]["left"]["lift"])
    if passing_clearance < 12.0:
        raise ValueError(f"{sprite_id} {row_name}: passing foot lacks toe clearance")

    assert_monotone([frames[i]["limbs"]["left"]["forward"] for i in range(16)], False, f"{sprite_id} {row_name}")
    assert_monotone([frames[i]["limbs"]["right"]["forward"] for i in range(16)], True, f"{sprite_id} {row_name}")
    assert_monotone([frames[i]["limbs"]["right"]["forward"] for i in range(16, 32)], False, f"{sprite_id} {row_name}")
    assert_monotone([frames[i]["limbs"]["left"]["forward"] for i in range(16, 32)], True, f"{sprite_id} {row_name}")

    if axis == "x":
        contact = frames[0]["limbs"]["left"]
        push_off = frames[12]["limbs"]["left"]
        if (contact["ankle"][0] - contact["hip"][0]) * sign < 25:
            raise ValueError(f"{sprite_id} {row_name}: contact foot points backward relative to travel")
        if (push_off["ankle"][0] - push_off["hip"][0]) * sign > -15:
            raise ValueError(f"{sprite_id} {row_name}: stance foot does not pass behind the pelvis")
        ankles = frames[0]["limbs"]
        if abs(ankles["left"]["ankle"][0] - ankles["right"]["ankle"][0]) < 65:
            raise ValueError(f"{sprite_id} {row_name}: side-view contact stride is unreadable")
    else:
        limbs_a, limbs_b = frames[0]["limbs"], frames[16]["limbs"]
        depth_a = (limbs_a["left"]["ankle"][1] - limbs_a["right"]["ankle"][1]) * sign
        depth_b = (limbs_b["right"]["ankle"][1] - limbs_b["left"]["ankle"][1]) * sign
        if min(depth_a, depth_b) < 18:
            raise ValueError(f"{sprite_id} {row_name}: front/back depth contradicts travel direction")
        if abs(frames[8]["limbs"]["right"]["ankle"][0] - 256) > 9:
            raise ValueError(f"{sprite_id} {row_name}: right leg misses the first passing crossover")
        if abs(frames[24]["limbs"]["left"]["ankle"][0] - 256) > 9:
            raise ValueError(f"{sprite_id} {row_name}: left leg misses the second passing crossover")

    projection_ratios = []
    for side in ("left", "right"):
        upper = [distance(frame["limbs"][side]["hip"], frame["limbs"][side]["knee"]) for frame in frames]
        lower = [distance(frame["limbs"][side]["knee"], frame["limbs"][side]["ankle"]) for frame in frames]
        if min(upper + lower) < 12:
            raise ValueError(f"{sprite_id} {row_name}: projected limb collapses anatomically")
        projection_ratios.extend((max(upper) / min(upper), max(lower) / min(lower)))
    if axis == "x" and max(projection_ratios) > 1.035:
        raise ValueError(f"{sprite_id} {row_name}: side-view bone length changes")
    if axis == "y" and max(projection_ratios) > 5.0:
        raise ValueError(f"{sprite_id} {row_name}: front/back foreshortening is discontinuous")
    seam_ratio = loop_seam_ratio(frames)
    if seam_ratio > 1.65:
        raise ValueError(f"{sprite_id} {row_name}: cyclic loop seam jumps ({seam_ratio:.2f}x)")
    return {
        "seamRatio": seam_ratio,
        "maxBoneProjectionRatio": max(projection_ratios),
        "maxHeadShoulderGap": max(head_shoulder_gaps),
    }


def draw_contact_sheet(
    sprite_id: str, row_names: list[str], runtime_rows: list[list[Image.Image]],
    audit_rows: list[dict], output_dir: Path,
) -> None:
    cell, label_height = 64, 22
    sheet = Image.new("RGBA", (32 * cell, len(runtime_rows) * (cell + label_height)), (35, 36, 38, 255))
    draw = ImageDraw.Draw(sheet)
    for row_index, (frames, audit_row) in enumerate(zip(runtime_rows, audit_rows, strict=True)):
        y = row_index * (cell + label_height)
        for col_index, (frame, pose) in enumerate(zip(frames, audit_row["frames"], strict=True)):
            x = col_index * cell
            sheet.alpha_composite(frame.resize((cell, cell), Image.Resampling.LANCZOS), (x, y))
            for side, color in (("left", (50, 220, 255, 235)), ("right", (255, 168, 54, 235))):
                limb = pose["limbs"][side]
                points = [(x + point[0] / 8, y + point[1] / 8) for point in (limb["hip"], limb["knee"], limb["ankle"])]
                draw.line(points, fill=color, width=1)
                for px, py in points:
                    draw.ellipse((px - 1.5, py - 1.5, px + 1.5, py + 1.5), fill=color)
            rx, ry = x + pose["root"][0] / 8, y + pose["root"][1] / 8
            draw.ellipse((rx - 2, ry - 2, rx + 2, ry + 2), outline=(110, 255, 120, 255), width=1)
            shoulder_points = [
                (x + pose["shoulders"][side][0] / 8, y + pose["shoulders"][side][1] / 8)
                for side in ("left", "right")
            ]
            draw.line(shoulder_points, fill=(255, 100, 220, 220), width=1)
            hx, hy = x + pose["headBottom"][0] / 8, y + pose["headBottom"][1] / 8
            draw.ellipse((hx - 1.5, hy - 1.5, hx + 1.5, hy + 1.5), fill=(255, 100, 220, 235))
            if col_index % 4 == 0:
                draw.line((x, y, x, y + cell), fill=(235, 235, 235, 180), width=1)
                draw.text((x + 2, y + 2), pose["phaseState"].split("-")[0][0].upper(), fill="white")
        draw.text((4, y + cell + 3), row_names[row_index], fill="white")
    output_dir.mkdir(parents=True, exist_ok=True)
    sheet.save(output_dir / f"{sprite_id}-all-final-frames.png", optimize=True)


def check_entry(
    registry_entry: dict, audit_entry: dict, manifest_entry: dict | None,
    contract: dict, signed: bool, overlay_dir: Path | None,
) -> dict:
    sprite_id = registry_entry["id"]
    paths = {name: ROOT / registry_entry[name] for name in ("parts", "source", "runtime", "identityReference")}
    for path in paths.values():
        if not path.is_file():
            raise ValueError(f"{sprite_id}: missing {path.relative_to(ROOT)}")
    if signed:
        if manifest_entry is None or manifest_entry.get("visualStatus") != "pass":
            raise ValueError(f"{sprite_id}: final frame-by-frame visual review is not signed off")
        if not manifest_entry.get("reviewedOn") or not manifest_entry.get("reviewer"):
            raise ValueError(f"{sprite_id}: reviewer and review date are required")
        for name, field in (
            ("parts", "partsSha256"), ("source", "sourceSha256"),
            ("runtime", "runtimeSha256"), ("identityReference", "identityReferenceSha256"),
        ):
            if manifest_entry.get(field) != sha256(paths[name]):
                raise ValueError(f"{sprite_id}: {name} changed after visual review")

    if audit_entry.get("partsSha256") != sha256(paths["parts"]):
        raise ValueError(f"{sprite_id}: parts do not match the pose audit")
    if audit_entry.get("sourceSha256") != sha256(paths["source"]):
        raise ValueError(f"{sprite_id}: key atlas does not match the pose audit")
    if audit_entry.get("runtimeSha256") != sha256(paths["runtime"]):
        raise ValueError(f"{sprite_id}: runtime atlas does not match the pose audit")

    rows = len(registry_entry["rows"])
    source, runtime = Image.open(paths["source"]), Image.open(paths["runtime"])
    alpha_contract(source, paths["source"], require_rgba=False)
    alpha_contract(runtime, paths["runtime"])
    source_rows = crop_cells(source.convert("RGBA"), 8, rows, int(contract["sourceCell"]))
    runtime_rows = crop_cells(runtime.convert("RGBA"), 32, rows, int(contract["runtimeCell"]))
    audit_rows = audit_entry["rows"]
    if [row["rowName"] for row in audit_rows] != registry_entry["rows"]:
        raise ValueError(f"{sprite_id}: audit rows diverge from the runtime registry")

    row_results = []
    for row_index, (keys, frames, audit_row) in enumerate(zip(source_rows, runtime_rows, audit_rows, strict=True)):
        row_name = registry_entry["rows"][row_index]
        for key_index, key in enumerate(keys):
            if ImageChops.difference(clean_resize(key, 128), frames[key_index * 4]).getbbox() is not None:
                raise ValueError(f"{sprite_id} {row_name}: key {key_index} is not one-to-one with final frame {key_index * 4}")
        for frame_index, (frame, pose) in enumerate(zip(frames, audit_row["frames"], strict=True)):
            bbox = frame.getchannel("A").getbbox()
            if bbox is None or min(bbox[0], bbox[1], 128 - bbox[2], 128 - bbox[3]) < 1:
                raise ValueError(f"{sprite_id} {row_name}: frame {frame_index} touches its cell edge")
            for side in ("left", "right"):
                for anchor in ("hip", "knee", "ankle"):
                    if not point_has_alpha(frame, pose["limbs"][side][anchor]):
                        raise ValueError(f"{sprite_id} {row_name}: {side} {anchor} leaves the painted limb at frame {frame_index}")
        unique = len({pixel_sha256(frame) for frame in frames})
        is_walk = row_index in registry_entry["walkRows"]
        if is_walk and unique < 28:
            raise ValueError(f"{sprite_id} {row_name}: only {unique} distinct final poses; expected at least 28")
        # Key cells intentionally use the signed 256px source as their final
        # downscale authority; transition cells are reduced directly from the
        # 512px bake. A static row may therefore have two antialiasing hashes
        # while retaining one identical pose.
        if not is_walk and unique > 2:
            raise ValueError(f"{sprite_id} {row_name}: idle identity plate changes between frames")
        stability = stable_upper_metrics(frames, audit_row["frames"])
        if stability["upperCenterDrift"] > 9.0:
            raise ValueError(f"{sprite_id} {row_name}: upper body jitters horizontally")
        if stability["topDrift"] > 3.0:
            raise ValueError(f"{sprite_id} {row_name}: head/top anchor jitters")
        if stability["heightRatio"] > 1.18:
            raise ValueError(f"{sprite_id} {row_name}: silhouette scale is inconsistent")
        mechanics = validate_biomechanics(sprite_id, row_name, audit_row["frames"])
        row_results.append({"row": row_index, "rowName": row_name, "uniqueFrames": unique, **stability, **mechanics})

    if overlay_dir:
        draw_contact_sheet(sprite_id, registry_entry["rows"], runtime_rows, audit_rows, overlay_dir)
    return {
        "id": sprite_id, "runtime": registry_entry["runtime"],
        "exactRuntimeFrames": rows * 32,
        "directions": validate_direction_contract(registry_entry), "rows": row_results,
    }


def main() -> None:
    args = parse_args()
    registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    contract = registry["frameContract"]
    if registry.get("version") != 3 or contract.get("renderMode") != "biomechanical-rig-v3":
        raise ValueError("registry is not the biomechanical v3 contract")
    if contract.get("runtimeFrames") != 32 or contract.get("keyFrames") != 8:
        raise ValueError("the release contract requires 8 reviewed phases and 32 final cells")
    if contract.get("gaitModel") != "eight-phase-double-support-v1":
        raise ValueError("unknown gait model")

    manifest = None
    if not args.allow_unsigned:
        manifest = json.loads(repo_path(args.manifest).read_text(encoding="utf-8"))
        if set(manifest.get("visualChecklist", [])) != EXPECTED_CHECKLIST:
            raise ValueError("visual verification manifest does not declare the complete biomechanical checklist")
        if manifest.get("renderMode") != contract["renderMode"]:
            raise ValueError("visual verification manifest uses another render mode")
        if manifest.get("registrySha256") != sha256(REGISTRY_PATH):
            raise ValueError("sprite registry changed after final frame-by-frame visual review")
        builder_path = ROOT / "tools/build-rigged-sprite-atlas.py"
        if manifest.get("builderSha256") != sha256(builder_path):
            raise ValueError("sprite builder changed after final frame-by-frame visual review")
        audit_path = ROOT / manifest["poseAudit"]
        if sha256(audit_path) != manifest.get("poseAuditSha256"):
            raise ValueError("pose audit changed after final frame-by-frame visual review")
    else:
        audit_path = ROOT / "assets/sprite-sources/rigs/pose-audit.json"

    audit = json.loads(audit_path.read_text(encoding="utf-8"))
    for field in ("renderMode", "gaitModel", "interpolation"):
        if audit.get(field) != contract.get(field):
            raise ValueError(f"pose audit {field} diverges from the registry")
    if audit.get("version") != 2 or audit.get("registryVersion") != registry["version"]:
        raise ValueError("pose audit schema is stale")
    audit_by_id = {entry["id"]: entry for entry in audit["sprites"]}
    manifest_by_id = {entry["id"]: entry for entry in manifest["sprites"]} if manifest else {}
    expected_ids = [entry["id"] for entry in registry["sprites"]]
    if list(audit_by_id) != expected_ids:
        raise ValueError("pose audit does not contain every sprite in registry order")
    if manifest and list(manifest_by_id) != expected_ids:
        raise ValueError("visual review does not contain every sprite in registry order")

    overlay_dir = repo_path(args.overlay_dir) if args.overlay_dir else None
    results = [
        check_entry(
            entry, audit_by_id[entry["id"]], manifest_by_id.get(entry["id"]),
            contract, manifest is not None, overlay_dir,
        )
        for entry in registry["sprites"]
    ]
    report = {
        "status": "pass", "renderMode": contract["renderMode"],
        "gaitModel": contract["gaitModel"], "signed": manifest is not None,
        "sprites": results,
    }
    if args.report:
        report_path = repo_path(args.report)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    for result in results:
        minimum = min(row["uniqueFrames"] for row in result["rows"] if not row["rowName"].endswith("idle"))
        print(f"PASS {result['id']}: {result['exactRuntimeFrames']} final cells; minimum {minimum} distinct poses per walk arc")


if __name__ == "__main__":
    main()
