"""Register transparent Frau Knick bridge paintings for the splat preview.

The source strips are independent paintings, not animation frames. Keep a
single uniform scale for all figures in a strip, and position by a shared
body/ground pivot so changing arm bounds cannot make the character pulse.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "assets/sprite-sources/buergeramt/knick-bridges"
DEST = ROOT / "assets/previews/knick-splats"
CANVAS = (1024, 832)
TARGET_BODY_X = 520.0  # Anchor skirt centre 200 + (1024 - 384) / 2.
TARGET_GROUND_Y = 798.0

# Source sheet intervals are deliberately disjoint; they separate the
# generator's independently painted figures while preserving all props.
# Each scale is the source head-to-shoe span registered to the corresponding
# original anchor span. The raised stamp is deliberately excluded from the
# hairline measurement. Source ground and hips are measured per strip; moving
# arm silhouettes never set an individual frame's scale.
STRIPS = {
    "raise": {
        # The source's overhead stamp extends farther than the anchor;
        # this shared scale keeps its knob wholly inside the 832px height.
        "scale": 0.976,
        "ground_y": 851,
        "figures": [
            ((380, 80, 775, 870), 588),
            ((1030, 25, 1405, 870), 1212),
        ],
    },
    "stamp": {
        "scale": 0.89,
        "ground_y": 962,
        "figures": [
            # New separate reach painting replaces the first strip figure.
            ((240, 35, 1242, 1220), 541, "reach", 0.685, 1208),
            ((570, 98, 960, 982), 762),
            ((1082, 102, 1455, 982), 1259),
        ],
    },
    "fold": {
        "scale": 1.07,
        "ground_y": 730,
        "figures": [
            ((390, 5, 720, 742), 548),
            ((845, 5, 1382, 742), 1003),
            ((1428, 5, 1712, 742), 1560),
        ],
    },
    "return": {
        "scale": 0.79,
        "ground_y": 987,
        "figures": [
            ((315, 5, 718, 1003), 513),
            ((775, 5, 1180, 1003), 983),
        ],
    },
}

LANDMARK_KEYS = (
    "eye_right", "eye_left", "nose", "chin", "shoulder_right",
    "elbow_right", "grip_right", "stamp_knob", "stamp_base",
    "shoulder_left", "elbow_left", "hand_left", "hip_center",
    "skirt_hem_center", "foot_screen_left", "foot_screen_right",
)

# Hand-annotated centers read from native-size, gridded composites of the
# encoded WebPs. They are useful source/target hints for a guarded transition;
# they are not a skeleton fit and do not authorize warping through occlusions.
LANDMARKS_TARGET = {
    "bridge-raise-1": [(532,148),(576,148),(565,165),(558,208),(427,263),(370,286),(434,219),(450,175),(443,266),(617,269),(673,356),(630,401),(520,423),(518,621),(476,777),(596,759)],
    "bridge-raise-2": [(551,150),(595,148),(580,168),(566,214),(438,238),(389,171),(463,62),(510,29),(433,109),(626,263),(676,352),(626,398),(520,423),(518,620),(478,777),(595,759)],
    "bridge-stamp-1": [(558,137),(599,150),(582,163),(571,208),(386,221),(350,162),(398,70),(446,37),(388,127),(619,246),(743,333),(836,349),(520,401),(520,601),(472,783),(619,763)],
    "bridge-stamp-2": [(543,165),(588,176),(566,184),(548,219),(442,227),(385,302),(517,294),(523,242),(517,337),(628,250),(676,356),(626,386),(520,399),(520,597),(477,784),(616,764)],
    "bridge-stamp-3": [(541,170),(584,181),(563,192),(548,225),(441,232),(389,317),(520,344),(528,300),(516,387),(625,270),(667,377),(608,398),(520,400),(520,600),(475,784),(616,764)],
    "bridge-fold-1": [(544,119),(594,128),(572,147),(557,186),(433,251),(394,341),(505,307),(516,266),(505,355),(627,256),(675,378),(628,392),(520,405),(520,606),(473,781),(613,765)],
    "bridge-fold-2": [(543,120),(588,124),(571,143),(552,185),(433,253),(393,348),(505,331),(515,277),(504,373),(623,252),(713,371),(783,383),(520,405),(520,607),(472,782),(614,765)],
    "bridge-fold-3": [(525,116),(576,128),(554,144),(542,180),(426,251),(487,355),(605,292),(601,238),(610,338),(626,252),(619,376),(493,416),(520,425),(520,606),(475,781),(614,765)],
    "bridge-return-1": [(533,120),(578,124),(559,139),(550,180),(426,251),(396,344),(523,305),(528,255),(521,348),(614,254),(640,385),(522,408),(520,410),(520,603),(475,781),(614,765)],
    "bridge-return-2": [(531,118),(579,124),(558,140),(548,181),(420,254),(396,349),(500,337),(503,287),(499,387),(607,250),(632,404),(636,502),(520,407),(520,604),(475,781),(614,765)],
}

PAPER_TIPS_TARGET = {
    "bridge-stamp-1": (989, 356),
    "bridge-stamp-2": (640, 384),
    "bridge-stamp-3": (617, 411),
    "bridge-fold-1": (645, 403),
    "bridge-fold-2": (908, 398),
}


def bbox(array: np.ndarray, threshold: int = 8) -> tuple[int, int, int, int]:
    ys, xs = np.nonzero(array[:, :, 3] > threshold)
    if not len(xs):
        raise ValueError("No painted pixels")
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)



def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def transform_premultiplied(source: Image.Image, crop: tuple[int, int, int, int], scale: float,
                            translation: tuple[float, float]) -> Image.Image:
    """Resample once in premultiplied float RGBA and clear hidden RGB."""
    left, top, right, bottom = crop
    src = np.asarray(source.crop(crop).convert("RGBA"), dtype=np.float32) / 255.0
    alpha = src[:, :, 3]
    channels = [src[:, :, c] * alpha for c in range(3)] + [alpha]
    tx, ty = translation
    coeff = (1.0 / scale, 0.0, -(tx / scale + left),
             0.0, 1.0 / scale, -(ty / scale + top))
    warped = np.stack([
        np.asarray(Image.fromarray(ch, mode="F").transform(
            CANVAS, Image.Transform.AFFINE, coeff, resample=Image.Resampling.BICUBIC,
            fillcolor=0.0), dtype=np.float32)
        for ch in channels
    ], axis=2)
    a = np.clip(warped[:, :, 3], 0.0, 1.0)
    rgb = np.minimum(np.maximum(warped[:, :, :3], 0.0), a[:, :, None])
    visible = a >= (1.0 / 255.0)
    out = np.zeros((*a.shape, 4), dtype=np.uint8)
    out[:, :, :3][visible] = np.rint(rgb[visible] / a[visible, None] * 255).astype(np.uint8)
    out[:, :, 3] = np.rint(a * 255).astype(np.uint8)
    out[:, :, :3][out[:, :, 3] == 0] = 0
    return Image.fromarray(out, "RGBA")


def build() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    records = []
    for name, entry in STRIPS.items():
        for i, figure in enumerate(entry["figures"], 1):
            crop, source_body_x = figure[:2]
            source_name = figure[2] if len(figure) > 2 else name
            scale = figure[3] if len(figure) > 3 else entry["scale"]
            ground_y = figure[4] if len(figure) > 4 else entry["ground_y"]
            source_path = SOURCES / f"{source_name}.png"
            source = Image.open(source_path).convert("RGBA")
            source_hash = sha256(source_path)
            tx = TARGET_BODY_X - scale * source_body_x
            ty = TARGET_GROUND_Y - scale * ground_y
            result = transform_premultiplied(source, crop, scale, (tx, ty))
            output = DEST / f"bridge-{name}-{i}.webp"
            # libwebp normally discards hidden RGB, then reconstructs arbitrary
            # colour on decode. exact=True preserves our zeroed transparent RGB.
            result.save(output, format="WEBP", lossless=True, method=6, exact=True)
            encoded = Image.open(output).convert("RGBA")
            rect = bbox(np.asarray(encoded))
            gutter = [rect[0], rect[1], CANVAS[0]-rect[2], CANVAS[1]-rect[3]]
            if min(gutter) < 4:
                raise ValueError(f"{output.name} clips or lacks gutter: {gutter}")
            bridge_id = f"bridge-{name}-{i}"
            def mapping(point: tuple[int, int]) -> dict:
                x, y = point
                sx, sy = (x - tx) / scale, (y - ty) / scale
                if not (crop[0] <= sx < crop[2] and crop[1] <= sy < crop[3]):
                    raise ValueError(f"{bridge_id} landmark {point} outside source crop")
                return {
                    "source_xy": [round(sx, 2), round(sy, 2)],
                    "target_xy": [x, y],
                }
            landmarks = {
                key: mapping(point)
                for key, point in zip(LANDMARK_KEYS, LANDMARKS_TARGET[bridge_id])
            }
            if bridge_id in PAPER_TIPS_TARGET:
                landmarks["paper_tip"] = mapping(PAPER_TIPS_TARGET[bridge_id])
            records.append({
                "id": bridge_id,
                "file": str(output.relative_to(ROOT)).replace("\\", "/"),
                "sha256": sha256(output),
                "source_file": str(source_path.relative_to(ROOT)).replace("\\", "/"),
                "source_sha256": source_hash,
                "source_crop_xyxy": list(crop),
                "uniform_scale": scale,
                "translation_xy": [round(tx, 4), round(ty, 4)],
                "source_body_ground_pivot_xy": [source_body_x, ground_y],
                "target_body_ground_pivot_xy": [TARGET_BODY_X, TARGET_GROUND_Y],
                "encoded_alpha_bbox_xyxy": list(rect),
                "transparent_gutter_ltrb": gutter,
                "landmarks": landmarks,
            })
            print(output.name, "bbox", rect, "gutter", gutter)
    manifest = {
        "canvas_xy": list(CANVAS),
        "anchor_canvas_xy": [384, 832],
        "anchor_x_shift": (CANVAS[0]-384)//2,
        "registration": "One uniform scale per generated strip; per-painting horizontal body alignment; common y=798 shoe baseline.",
        "landmark_note": "Approximate anatomical/prop centers manually read from native encoded light-background grids; source_xy is exact inverse of recorded affine registration. Anatomical right is screen-left. Do not infer flat morph permission from these points.",
        "bridges": records,
    }
    (DEST / "bridge-registration.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
    write_evidence(records)


def write_evidence(records: list[dict]) -> None:
    outdir = ROOT / "output/spark-preview/bridges"
    outdir.mkdir(parents=True, exist_ok=True)
    for tone, background, ink in (("light", "#e1ded6", "#111111"),
                                  ("dark", "#252b32", "#eeeeee")):
        sheet = Image.new("RGB", (2560, 912), background)
        draw = ImageDraw.Draw(sheet)
        for j, record in enumerate(records):
            image = Image.open(ROOT / record["file"]).convert("RGBA")
            image = image.resize((512, 416), Image.Resampling.LANCZOS)
            x, y = (j % 5) * 512, (j // 5) * 456
            sheet.paste(image, (x, y + 25), image)
            draw.text((x + 8, y + 5), record["id"], fill=ink)
        sheet.save(outdir / f"bridges-{tone}.jpg", quality=95)
    for record in records:
        image = Image.open(ROOT / record["file"]).convert("RGBA")
        board = Image.new("RGB", CANVAS, "#e1ded6")
        board.paste(image, (0, 0), image)
        draw = ImageDraw.Draw(board)
        for x in range(0, CANVAS[0], 100):
            draw.line((x, 0, x, CANVAS[1]), fill="#aaa89f", width=1)
            draw.text((x+2, 2), str(x), fill="#343434")
        for y in range(0, CANVAS[1], 100):
            draw.line((0, y, CANVAS[0], y), fill="#aaa89f", width=1)
            draw.text((2, y+2), str(y), fill="#343434")
        board.save(outdir / f"{record['id']}-grid.jpg", quality=93)


def verify() -> None:
    manifest = json.loads((DEST / "bridge-registration.json").read_text(encoding="utf-8"))
    assert manifest["canvas_xy"] == list(CANVAS)
    assert len(manifest["bridges"]) == 10
    misses = []
    for record in manifest["bridges"]:
        path = ROOT / record["file"]
        source = ROOT / record["source_file"]
        assert sha256(path) == record["sha256"], record["id"]
        assert sha256(source) == record["source_sha256"], record["id"]
        encoded = np.asarray(Image.open(path).convert("RGBA"))
        assert (encoded.shape[1], encoded.shape[0]) == CANVAS
        assert not encoded[:, :, :3][encoded[:, :, 3] == 0].any(), record["id"]
        assert list(bbox(encoded)) == record["encoded_alpha_bbox_xyxy"]
        assert min(record["transparent_gutter_ltrb"]) >= 4
        for key, points in record["landmarks"].items():
            sx, sy = points["source_xy"]
            tx, ty = points["target_xy"]
            scale = record["uniform_scale"]
            offset_x, offset_y = record["translation_xy"]
            assert abs(sx * scale + offset_x - tx) < 0.02
            assert abs(sy * scale + offset_y - ty) < 0.02
            neighborhood = encoded[max(0, ty - 12):ty + 13,
                                   max(0, tx - 12):tx + 13, 3]
            if not np.any(neighborhood > 16):
                misses.append((record["id"], key, (tx, ty)))
    print("verified", len(manifest["bridges"]), "encoded bridges; landmark misses", misses)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    if args.verify:
        verify()
    else:
        build()
        verify()


if __name__ == "__main__":
    main()
