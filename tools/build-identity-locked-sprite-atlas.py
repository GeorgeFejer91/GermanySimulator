#!/usr/bin/env python3
"""Build runtime atlases without inventing or morphing character pixels.

The original, visually approved image-generated key cells are the identity
authority. Every 128 px runtime cell is an exact premultiplied downscale of one
whole 256 px authored cell. The 32-frame runtime clock holds those authored
poses for balanced intervals; it never cross-fades, optical-flows, re-centres,
or rebuilds a character from different artwork.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "registry",
        type=Path,
        nargs="?",
        default=ROOT / "assets/sprite-sources/rigs/registry.json",
    )
    parser.add_argument("--only", action="append", default=[])
    parser.add_argument("--preview-dir", type=Path)
    parser.add_argument(
        "--identity-audit",
        type=Path,
        default=ROOT / "assets/sprite-sources/identity-audit.json",
    )
    parser.add_argument(
        "--restore-originals-from",
        type=Path,
        help="One-time migration: restore the authored key atlases from an archive root.",
    )
    parser.add_argument(
        "--archive-current-to",
        type=Path,
        help="One-time migration: copy the current key/runtime atlases and ledgers here first.",
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


def premultiplied_resize(image: Image.Image, size: int) -> Image.Image:
    image = clean_rgba(image)
    resized = image.convert("RGBa").resize((size, size), Image.Resampling.LANCZOS).convert("RGBA")
    return clean_rgba(resized)


def source_key_for_runtime(frame: int, key_count: int, runtime_frames: int) -> int:
    """Balanced whole-key holds: 8 keys become 4 frames each; 6 become 5/6."""
    return min(key_count - 1, frame * key_count // runtime_frames)


def archive_current(entries: list[dict], destination: Path) -> None:
    destination = repo_path(destination)
    if destination.exists() and any(destination.rglob("*")):
        raise ValueError(f"archive destination is not empty: {destination}")
    tracked = {
        *(ROOT / entry[field] for entry in entries for field in ("source", "runtime")),
        ROOT / "assets/sprite-sources/verification.json",
        ROOT / "assets/sprite-sources/rigs/pose-audit.json",
        ROOT / "assets/sprite-sources/rigs/registry.json",
    }
    copied = []
    for source in sorted(tracked):
        if not source.is_file():
            continue
        relative = source.relative_to(ROOT)
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        copied.append((relative.as_posix(), sha256(source)))
    manifest = [
        "# Pre-identity-lock sprite archive — 2026-09-22",
        "",
        "Recovery copy of the cutout-rig key/runtime atlases and their signed ledgers",
        "immediately before the original image-generated identities became authoritative again.",
        "",
        "```text",
        *(f"{digest}  {path}" for path, digest in copied),
        "```",
        "",
    ]
    (destination / "MANIFEST.md").write_text("\n".join(manifest), encoding="utf-8")
    print(f"ARCHIVED {len(copied)} files -> {destination.relative_to(ROOT)}")


def restore_originals(entries: list[dict], archive_root: Path) -> None:
    archive_root = repo_path(archive_root)
    for entry in entries:
        relative = Path(entry["source"])
        archived = archive_root / relative
        active = ROOT / relative
        if not archived.is_file():
            raise ValueError(f"missing archived authored source: {archived}")
        active.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(archived, active)
        print(f"RESTORED {entry['id']} identity source <- {archived.relative_to(ROOT)}")


def crop_source_rows(source: Image.Image, key_cols: int, rows: int, cell: int) -> list[list[Image.Image]]:
    expected = (key_cols * cell, rows * cell)
    if source.size != expected:
        raise ValueError(f"authored source expected {expected}, got {source.size}")
    return [
        [
            source.crop((col * cell, row * cell, (col + 1) * cell, (row + 1) * cell)).convert("RGBA")
            for col in range(key_cols)
        ]
        for row in range(rows)
    ]


def make_preview(sprite_id: str, runtime_rows: list[list[Image.Image]], output_dir: Path) -> None:
    cell = 80
    sheet = Image.new("RGBA", (32 * cell, len(runtime_rows) * (cell + 18)), (28, 30, 34, 255))
    draw = ImageDraw.Draw(sheet)
    for row, frames in enumerate(runtime_rows):
        y = row * (cell + 18)
        for col, frame in enumerate(frames):
            sheet.alpha_composite(frame.resize((cell, cell), Image.Resampling.LANCZOS), (col * cell, y))
            if col % 4 == 0:
                draw.line((col * cell, y, col * cell, y + cell), fill=(80, 230, 255, 255), width=1)
        draw.text((4, y + cell + 2), f"row {row} · every cell names its authored source key", fill="white")
    output_dir.mkdir(parents=True, exist_ok=True)
    sheet.convert("RGB").save(output_dir / f"{sprite_id}-identity-grid.jpg", quality=88)


def build_entry(entry: dict, contract: dict, preview_dir: Path | None) -> dict:
    source_path = ROOT / entry["source"]
    runtime_path = ROOT / entry["runtime"]
    source_cell = int(contract["sourceCell"])
    runtime_cell = int(contract["runtimeCell"])
    runtime_frames = int(contract["runtimeFrames"])
    key_cols = int(entry["keyCols"])
    rows = len(entry["rows"])
    source = Image.open(source_path)
    source_rows = crop_source_rows(source, key_cols, rows, source_cell)
    runtime_rows: list[list[Image.Image]] = []
    audit_rows = []
    for row_index, keys in enumerate(source_rows):
        downscaled = [premultiplied_resize(key, runtime_cell) for key in keys]
        frames = []
        mapping = []
        for frame_index in range(runtime_frames):
            source_key = source_key_for_runtime(frame_index, key_cols, runtime_frames)
            frame = downscaled[source_key].copy()
            frames.append(frame)
            mapping.append(
                {
                    "frame": frame_index,
                    "sourceKey": source_key,
                    "sourcePixelSha256": pixel_sha256(keys[source_key]),
                    "runtimePixelSha256": pixel_sha256(frame),
                }
            )
        runtime_rows.append(frames)
        audit_rows.append({"rowName": entry["rows"][row_index], "frames": mapping})
    atlas = Image.new("RGBA", (runtime_frames * runtime_cell, rows * runtime_cell))
    for row_index, frames in enumerate(runtime_rows):
        for col_index, frame in enumerate(frames):
            atlas.alpha_composite(frame, (col_index * runtime_cell, row_index * runtime_cell))
    runtime_path.parent.mkdir(parents=True, exist_ok=True)
    clean_rgba(atlas).save(runtime_path, optimize=True)
    if preview_dir:
        make_preview(entry["id"], runtime_rows, preview_dir)
    print(
        f"BUILT {entry['id']}: {key_cols} immutable authored poses -> "
        f"{runtime_frames} identity-locked runtime cells"
    )
    return {
        "id": entry["id"],
        "source": entry["source"],
        "runtime": entry["runtime"],
        "sourceSha256": sha256(source_path),
        "runtimeSha256": sha256(runtime_path),
        "rows": audit_rows,
    }


def main() -> None:
    args = parse_args()
    registry_path = repo_path(args.registry)
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    selected = set(args.only)
    entries = [entry for entry in registry["sprites"] if not selected or entry["id"] in selected]
    missing = selected - {entry["id"] for entry in entries}
    if missing:
        raise ValueError(f"unknown sprite ids: {', '.join(sorted(missing))}")
    if args.archive_current_to:
        archive_current(registry["sprites"], args.archive_current_to)
    if args.restore_originals_from:
        restore_originals(registry["sprites"], args.restore_originals_from)
    preview_dir = repo_path(args.preview_dir) if args.preview_dir else None
    audit_path = repo_path(args.identity_audit)
    previous = {}
    if selected and audit_path.is_file():
        previous = {
            entry["id"]: entry
            for entry in json.loads(audit_path.read_text(encoding="utf-8")).get("sprites", [])
        }
    for entry in entries:
        previous[entry["id"]] = build_entry(entry, registry["frameContract"], preview_dir)
    ordered = [previous[entry["id"]] for entry in registry["sprites"] if entry["id"] in previous]
    if not selected and len(ordered) != len(registry["sprites"]):
        raise ValueError("full identity audit is incomplete")
    audit = {
        "version": 2,
        "renderMode": registry["frameContract"]["renderMode"],
        "sourceCell": registry["frameContract"]["sourceCell"],
        "runtimeCell": registry["frameContract"]["runtimeCell"],
        "runtimeFrames": registry["frameContract"]["runtimeFrames"],
        "sprites": ordered,
    }
    audit_path.parent.mkdir(parents=True, exist_ok=True)
    audit_path.write_text(json.dumps(audit, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"WROTE identity audit -> {audit_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
