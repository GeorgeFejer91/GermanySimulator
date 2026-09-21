#!/usr/bin/env python3
"""Build a registered runtime sprite atlas from an authored key-pose atlas.

The input and output use fixed square cells.  The builder inserts three
motion-compensated frames between every pair of key poses, including the loop
seam, while preserving cell coordinates.  FFmpeg supplies deterministic
bidirectional motion interpolation; Pillow assembles and validates the atlas.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="registered key-pose PNG")
    parser.add_argument("output", type=Path, help="expanded runtime PNG")
    parser.add_argument("--cols", type=int, required=True)
    parser.add_argument("--rows", type=int, required=True)
    parser.add_argument("--cell", type=int, default=256)
    parser.add_argument("--runtime-cell", type=int, default=128)
    parser.add_argument("--inbetweens", type=int, default=3)
    parser.add_argument("--audit-dir", type=Path)
    return parser.parse_args()


def alpha_bbox(frame: Image.Image) -> tuple[int, int, int, int] | None:
    return frame.getchannel("A").getbbox()


def clean_transparent_pixels(frame: Image.Image, threshold: int = 3) -> Image.Image:
    """Keep antialiased edges while making fully transparent RGB deterministic."""
    cleaned = frame.convert("RGBA")
    alpha = cleaned.getchannel("A").point(lambda value: 0 if value <= threshold else value)
    cleaned.putalpha(alpha)
    empty = alpha.point(lambda value: 255 if value == 0 else 0)
    cleaned.paste((0, 0, 0, 0), mask=empty)
    return cleaned


def resize_premultiplied(frame: Image.Image, size: tuple[int, int]) -> Image.Image:
    # Resize premultiplied color so transparent neighboring pixels cannot bleed
    # dark or colored halos into the visible sprite edge.
    return clean_transparent_pixels(frame.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA"))


def validate_key_frames(frames: list[list[Image.Image]], cell: int) -> None:
    for row_index, row in enumerate(frames):
        centers: list[float] = []
        for col_index, frame in enumerate(row):
            bbox = alpha_bbox(frame)
            if bbox is None:
                raise ValueError(f"empty sprite cell at row {row_index}, col {col_index}")
            left, top, right, bottom = bbox
            if min(left, top, cell - right, cell - bottom) < 4:
                raise ValueError(
                    f"sprite touches the cell safety margin at row {row_index}, col {col_index}: {bbox}"
                )
            centers.append((left + right) / 2)
        # Broad props such as buckets and water can move, but a whole-body row
        # must never wander far enough to create visible playback shake.
        if max(centers) - min(centers) > cell * 0.28:
            raise ValueError(
                f"row {row_index} drifts {max(centers) - min(centers):.1f}px; register key poses first"
            )


def load_frames(sheet: Image.Image, cols: int, rows: int, cell: int) -> list[list[Image.Image]]:
    expected = (cols * cell, rows * cell)
    if sheet.size != expected:
        raise ValueError(f"expected {expected[0]}x{expected[1]}, got {sheet.width}x{sheet.height}")
    return [
        [
            clean_transparent_pixels(
                sheet.crop((col * cell, row * cell, (col + 1) * cell, (row + 1) * cell))
            )
            for col in range(cols)
        ]
        for row in range(rows)
    ]


def run_ffmpeg(sequence_dir: Path, output_dir: Path, cols: int, factor: int) -> list[Image.Image]:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg is required for motion-compensated sprite interpolation")
    output_dir.mkdir(parents=True)
    target_count = cols * factor
    command = [
        ffmpeg,
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-framerate",
        "10",
        "-i",
        str(sequence_dir / "%03d.png"),
        "-vf",
        (
            f"minterpolate=fps={10 * factor}:mi_mode=mci:mc_mode=aobmc:"
            "me_mode=bidir:me=epzs:vsbmc=1,format=rgba"
        ),
        "-frames:v",
        str(target_count),
        str(output_dir / "%03d.png"),
    ]
    subprocess.run(command, check=True)
    paths = sorted(output_dir.glob("*.png"))
    if len(paths) != target_count:
        raise RuntimeError(f"ffmpeg created {len(paths)} frames; expected {target_count}")
    return [clean_transparent_pixels(Image.open(path).convert("RGBA")) for path in paths]


def build_row(key_frames: list[Image.Image], inbetweens: int, temp_root: Path, row_index: int) -> list[Image.Image]:
    factor = inbetweens + 1
    sequence_dir = temp_root / f"row-{row_index:02d}-keys"
    output_dir = temp_root / f"row-{row_index:02d}-motion"
    sequence_dir.mkdir(parents=True)
    # Two copies of the first pose give the interpolator enough look-ahead to
    # synthesize the complete last-to-first seam before the exact frame cap.
    for index, frame in enumerate([*key_frames, key_frames[0], key_frames[0]]):
        frame.save(sequence_dir / f"{index + 1:03d}.png")
    frames = run_ffmpeg(sequence_dir, output_dir, len(key_frames), factor)

    # Restore the authored key exactly at each interval boundary. This prevents
    # interpolation from softening identity-defining faces and costumes.
    for index, key in enumerate(key_frames):
        frames[index * factor] = key.copy()
    return frames


def assemble(rows: list[list[Image.Image]], cell: int) -> Image.Image:
    atlas = Image.new("RGBA", (len(rows[0]) * cell, len(rows) * cell))
    for row_index, row in enumerate(rows):
        for col_index, frame in enumerate(row):
            atlas.alpha_composite(frame, (col_index * cell, row_index * cell))
    return atlas


def make_overlay(row: list[Image.Image], cell: int) -> Image.Image:
    overlay = Image.new("RGBA", (cell, cell), (24, 27, 32, 255))
    colors = [(255, 76, 92), (52, 210, 255), (255, 210, 70), (97, 224, 137)]
    for index, frame in enumerate(row):
        alpha = frame.getchannel("A")
        edge = ImageChops.difference(alpha, alpha.filter(ImageFilter.MinFilter(3)))
        color = Image.new("RGBA", frame.size, (*colors[index % len(colors)], 0))
        color.putalpha(edge.point(lambda value: 210 if value else 0))
        overlay.alpha_composite(color)
    draw = ImageDraw.Draw(overlay)
    draw.line((cell // 2, 0, cell // 2, cell), fill=(255, 255, 255, 96), width=1)
    draw.line((0, cell // 2, cell, cell // 2), fill=(255, 255, 255, 48), width=1)
    return overlay


def write_audits(rows: list[list[Image.Image]], audit_dir: Path, stem: str, cell: int) -> None:
    audit_dir.mkdir(parents=True, exist_ok=True)
    strip = Image.new("RGBA", (cell, len(rows) * cell))
    for row_index, row in enumerate(rows):
        strip.alpha_composite(make_overlay(row, cell), (0, row_index * cell))
    strip.save(audit_dir / f"{stem}-onion.png", optimize=True)

    for row_index, row in enumerate(rows):
        columns = min(6, len(row))
        contact_rows = (len(row) + columns - 1) // columns
        contact = Image.new("RGBA", (columns * cell, contact_rows * cell), (24, 27, 32, 255))
        for frame_index, frame in enumerate(row):
            contact.alpha_composite(frame, ((frame_index % columns) * cell, (frame_index // columns) * cell))
        contact.save(audit_dir / f"{stem}-row-{row_index}-frames.png", optimize=True)
        row[0].save(
            audit_dir / f"{stem}-row-{row_index}-cycle.gif",
            save_all=True,
            append_images=row[1:],
            duration=45,
            loop=0,
            disposal=2,
            transparency=0,
        )


def main() -> None:
    args = parse_args()
    if args.cols < 2 or args.rows < 1 or args.inbetweens < 1 or args.cell < 1 or args.runtime_cell < 1:
        raise ValueError("atlas needs positive dimensions, two columns, one row, and one in-between")
    sheet = Image.open(args.input).convert("RGBA")
    key_rows = load_frames(sheet, args.cols, args.rows, args.cell)
    validate_key_frames(key_rows, args.cell)
    with tempfile.TemporaryDirectory(prefix="germany-sprite-") as temp:
        root = Path(temp)
        runtime_rows = [build_row(row, args.inbetweens, root, index) for index, row in enumerate(key_rows)]
    if args.runtime_cell != args.cell:
        runtime_rows = [
            [resize_premultiplied(frame, (args.runtime_cell, args.runtime_cell)) for frame in row]
            for row in runtime_rows
        ]
    atlas = assemble(runtime_rows, args.runtime_cell)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    # Preserve full RGBA edges. Palette quantization collapses the antialiased
    # alpha ramp and creates visible dark fringes once a cell is enlarged.
    atlas.save(args.output, optimize=True)
    if args.audit_dir:
        write_audits(runtime_rows, args.audit_dir, args.output.stem, args.runtime_cell)
    print(
        f"{args.input} -> {args.output}: {args.cols}x{args.rows} keys, "
        f"{len(runtime_rows[0])}x{args.rows} runtime frames, {args.inbetweens} in-betweens/interval"
    )


if __name__ == "__main__":
    main()
