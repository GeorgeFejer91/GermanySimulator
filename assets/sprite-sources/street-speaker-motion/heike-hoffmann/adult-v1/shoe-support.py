"""Source-only Heike three-key geometry from corrected v2 shoe ownership."""

import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
AUDIT = ROOT / "heike-cuff-source-audit"
RECEIPT = AUDIT / "receipt.json"
EXTRACT = ROOT / "heike-source-corrected-three-poses" / "extraction-v2"
EXTRACT_RECEIPT = EXTRACT / "receipt.json"
CONTACT = REPO / "assets/sprite-sources/berlin-street-20261022/quiz-heike-hoffmann-expressionist-side-contacts-v1.png"
SCALE = 400 / 975
RESERVE_SOURCE = 2 / SCALE
HIP = (450.0, 545.0)
KNEES = {"far": (339.0, 755.0), "near": (540.0, 755.0)}
PIVOTS = {"far": (252.0, 895.0)}
CHECKPOINTS = {
    "neutral": {"far": 444.0, "near": 513.0},
    "passing": {"far": 446.0, "near": 522.0},
    "opposite": {"far": 571.875, "near": 328.125},
}


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def interpolate(points, x):
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        if x0 <= x <= x1:
            return y0 + (x - x0) * (y1 - y0) / (x1 - x0)
    raise ValueError(f"x={x} outside traced cuff polyline")


def distance(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def knee_from_lengths(hip, ankle, upper, lower, sign):
    dx, dy = ankle[0] - hip[0], ankle[1] - hip[1]
    d = math.hypot(dx, dy)
    along = (upper * upper - lower * lower + d * d) / (2 * d)
    height_sq = upper * upper - along * along
    if height_sq < -1e-8:
        raise ValueError("leg outside two-bone reach")
    height = math.sqrt(max(0.0, height_sq))
    # Positive cross((ankle-hip),(knee-hip)) is sign +1 in image coordinates.
    return (hip[0] + along * dx / d - sign * height * dy / d,
            hip[1] + along * dy / d + sign * height * dx / d)


def rotated_support(path, pivot, angle_deg):
    # Each occupied alpha>=20 source pixel is a unit square, not a point sample.
    # Rotate all four square corners analytically; no rasterization/resampling.
    alpha = np.asarray(Image.open(path).convert("RGBA"))[:, :, 3]
    ys, xs = np.nonzero(alpha >= 20)
    if xs.size == 0:
        raise ValueError(f"empty Oxford mask: {path}")
    angle = math.radians(angle_deg)
    c, s = math.cos(angle), math.sin(angle)
    corners_x = xs[:, None].astype(float) + np.array([0, 1, 0, 1], dtype=float)
    corners_y = ys[:, None].astype(float) + np.array([0, 0, 1, 1], dtype=float)
    dx, dy = corners_x - pivot[0], corners_y - pivot[1]
    rotated_x = pivot[0] + c * dx + s * dy
    rotated_y = pivot[1] - s * dx + c * dy
    left, right = float(rotated_x.min()), float(rotated_x.max())
    top, bottom = float(rotated_y.min()), float(rotated_y.max())
    return {
        "alpha20PixelCount": int(xs.size),
        "rotatedSupportBBoxXYXY": [left, top, right, bottom],
        "horizontalBBoxCentreOffsetFromPivot": (left + right) / 2 - pivot[0],
        "bottomOffsetFromPivot": bottom - pivot[1],
    }


def main():
    receipt = json.loads(RECEIPT.read_text(encoding="utf-8"))
    assert sha256(CONTACT) == receipt["sourceHashes"]["contact"], CONTACT
    extraction = json.loads(EXTRACT_RECEIPT.read_text(encoding="utf-8"))
    assert extraction["sourceSha256"] == sha256(CONTACT)
    assert extraction["inputs"]["output/street-redesign/heike-cuff-source-audit/receipt.json"] == sha256(RECEIPT)
    mask_paths = {owner: EXTRACT / f"{owner}-shoe-source.png"
                  for owner in ("far", "near")}
    for owner, path in mask_paths.items():
        assert sha256(path) == extraction["outputs"][path.name], path
    top_far = interpolate(receipt["shoeTopSourceXYPolyline"]["far"], 252)
    top_near = interpolate(receipt["shoeTopSourceXYPolyline"]["near"], 586)
    cuff_delta = top_near - top_far
    PIVOTS["near"] = (586.0, 895.0 + cuff_delta)
    source_legs = {}
    for owner in ("far", "near"):
        knee, ankle = KNEES[owner], PIVOTS[owner]
        upper, lower = distance(HIP, knee), distance(knee, ankle)
        ax, ay = ankle[0] - HIP[0], ankle[1] - HIP[1]
        kx, ky = knee[0] - HIP[0], knee[1] - HIP[1]
        cross = ax * ky - ay * kx
        sign = 1 if cross > 0 else -1
        reconstructed = knee_from_lengths(HIP, ankle, upper, lower, sign)
        source_legs[owner] = {
            "sourceKnee": knee, "sourceAnklePivotEstimated": ankle,
            "upperSource": upper, "lowerSource": lower,
            "totalSource": upper + lower, "totalWorking": (upper + lower) * SCALE,
            "sourceBendCross": cross, "bendSign": sign,
            "reconstructedSourceKnee": reconstructed,
            "sourceKneeReconstructionError": distance(reconstructed, knee),
        }
        assert distance(reconstructed, knee) < 1e-9

    source_axes = {owner: receipt["soleAlpha128BottomEndpoints"][owner]["slopeDegScreenYDown"]
                   for owner in ("far", "near")}
    poses = {}
    for name, checkpoints in CHECKPOINTS.items():
        pose_legs = {}
        for owner in ("far", "near"):
            desired_axis = (source_axes["near"] if owner == "far" else source_axes["far"]) if name == "opposite" else 0.0
            rotation = source_axes[owner] - desired_axis
            support = rotated_support(mask_paths[owner], PIVOTS[owner], rotation)
            sole_bottom = 972.0 if name == "passing" and owner == "near" else 992.0
            ankle_x = checkpoints[owner] - support["horizontalBBoxCentreOffsetFromPivot"]
            ankle_y = sole_bottom - support["bottomOffsetFromPivot"]
            total_reserved = source_legs[owner]["totalSource"] - RESERVE_SOURCE
            dx = ankle_x - HIP[0]
            if abs(dx) > total_reserved:
                raise ValueError(f"horizontal reach impossible: {name}/{owner}")
            min_hip_y = ankle_y - math.sqrt(total_reserved * total_reserved - dx * dx)
            pose_legs[owner] = {
                "sourceSoleAxisDeg": source_axes[owner],
                "desiredSoleAxisDeg": desired_axis,
                "imageRotationDeg": rotation,
                "shoeSupport": support,
                "authoredShoeCentreCheckpointX": checkpoints[owner],
                "targetSoleBottomY": sole_bottom,
                "targetAnklePivotXY": [ankle_x, ankle_y],
                "minimumHipYWithTwoWorkingPixelReserve": min_hip_y,
            }
        root_y = max(v["minimumHipYWithTwoWorkingPixelReserve"] for v in pose_legs.values())
        hip = (HIP[0], root_y)
        for owner, leg in pose_legs.items():
            ankle = leg["targetAnklePivotXY"]
            src = source_legs[owner]
            reach = distance(hip, ankle)
            folded_min = abs(src["upperSource"] - src["lowerSource"])
            assert folded_min <= reach <= src["totalSource"] - RESERVE_SOURCE + 1e-8
            leg["hipToAnkleSource"] = reach
            leg["remainingReachSource"] = src["totalSource"] - reach
            leg["remainingReachWorking"] = (src["totalSource"] - reach) * SCALE
            leg["reconstructedTargetKneeXY"] = knee_from_lengths(
                hip, ankle, src["upperSource"], src["lowerSource"], src["bendSign"])
        poses[name] = {"hipRootXY": hip, "rootYOffsetFromSource": root_y - HIP[1],
                       "rootYOffsetWorking": (root_y - HIP[1]) * SCALE,
                       "limitingLeg": max(pose_legs, key=lambda o: pose_legs[o]["minimumHipYWithTwoWorkingPixelReserve"]),
                       "legs": pose_legs}

    result = {
        "status": "source-only estimated binding with v2 corrected Oxford ownership; no pose render or motion approval",
        "inputs": {"auditReceipt": str(RECEIPT.relative_to(ROOT)).replace("\\", "/"),
                   "auditReceiptSHA256": sha256(RECEIPT),
                   "extractionV2Receipt": str(EXTRACT_RECEIPT.relative_to(ROOT)).replace("\\", "/"),
                   "extractionV2ReceiptSHA256": sha256(EXTRACT_RECEIPT),
                   "contactSource": str(CONTACT.relative_to(REPO)).replace("\\", "/"),
                   "contactSourceSHA256": sha256(CONTACT),
                   "shoeMaskPaths": {o: str(p.relative_to(ROOT)).replace("\\", "/") for o, p in mask_paths.items()},
                   "shoeMaskSHA256": {o: sha256(p) for o, p in mask_paths.items()}},
        "conventions": {
            "coordinates": "source pixels, x right/y down; one common source family scale 400/975 to working",
            "shoePixelSupport": "union of unit squares [x,x+1]×[y,y+1] for source mask alpha>=20; rotate all four corners continuously, no resampling",
            "rotationMatrixImageXY": "[[cos(a), sin(a)], [-sin(a), cos(a)]]",
            "rotationRuleDegrees": "source sole axis minus desired sole axis",
            "rootChoice": "minimum image-y hip (highest physical hip) on hip-above-ankle branch meeting both full bone lengths minus exactly two working pixels reach reserve",
            "sourceToWorking": SCALE, "reachReserveWorking": 2,
            "reachReserveSource": RESERVE_SOURCE,
            "shoeCentreCheckpoints": "authored intended x values, not measured source-centre observations",
            "contactLimit": "endpoint sole-axis alignment and alpha20 support bottom at floor do not prove simultaneous heel/forefoot contact on a curved sole",
        },
        "sourceBinding": {"estimatedHipXY": HIP, "originalKneesXY": KNEES,
                          "sourceCuffTopInterpolatedY": {"farAt252": top_far, "nearAt586": top_near},
                          "equalAboveCuffOffsetNearMinusFarY": cuff_delta,
                          "estimatedAnklePivotsXY": PIVOTS,
                          "ankleCaveat": "far pivot retained as previous authored estimate; near y is equal offset above visible cuff, not an observed bone or reach fit",
                          "legs": source_legs},
        "poses": poses,
    }
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
