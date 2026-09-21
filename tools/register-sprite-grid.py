#!/usr/bin/env python3
"""Reflow an ImageGen contact sheet onto the canonical sprite-key grid."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--input-cols", type=int, required=True)
    parser.add_argument("--input-rows", type=int, required=True)
    parser.add_argument("--output-cols", type=int, required=True)
    parser.add_argument("--cell", type=int, default=256)
    parser.add_argument("--margin", type=int, default=12)
    parser.add_argument("--alpha-threshold", type=int, default=128)
    parser.add_argument("--halo", type=int, default=4)
    return parser.parse_args()


def foreground_crop(tile: Image.Image, threshold: int, halo: int) -> Image.Image:
    mask = tile.getchannel("A").point(lambda value: 255 if value >= threshold else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise ValueError("generated sprite cell is empty")
    left, top, right, bottom = bbox
    left, top = max(0, left - halo), max(0, top - halo)
    right, bottom = min(tile.width, right + halo), min(tile.height, bottom + halo)
    return tile.crop((left, top, right, bottom))


def resize_premultiplied(frame: Image.Image, size: tuple[int, int]) -> Image.Image:
    registered = frame.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")
    alpha = registered.getchannel("A").point(lambda value: 0 if value <= 3 else value)
    registered.putalpha(alpha)
    registered.paste((0, 0, 0, 0), mask=alpha.point(lambda value: 255 if value == 0 else 0))
    return registered


def main() -> None:
    args = parse_args()
    if min(args.input_cols, args.input_rows, args.output_cols, args.cell) < 1:
        raise ValueError("grid dimensions must be positive")
    count = args.input_cols * args.input_rows
    if count % args.output_cols:
        raise ValueError("input cell count must divide evenly into output columns")
    if args.margin < 4 or args.margin * 2 >= args.cell:
        raise ValueError("margin must leave a usable cell with at least four transparent pixels")

    source = Image.open(args.input).convert("RGBA")
    crops: list[Image.Image] = []
    for index in range(count):
        col, row = index % args.input_cols, index // args.input_cols
        left = round(col * source.width / args.input_cols)
        right = round((col + 1) * source.width / args.input_cols)
        top = round(row * source.height / args.input_rows)
        bottom = round((row + 1) * source.height / args.input_rows)
        crops.append(foreground_crop(source.crop((left, top, right, bottom)), args.alpha_threshold, args.halo))

    output_rows = count // args.output_cols
    sheet = Image.new("RGBA", (args.output_cols * args.cell, output_rows * args.cell))
    usable = args.cell - args.margin * 2
    for row in range(output_rows):
        row_crops = crops[row * args.output_cols : (row + 1) * args.output_cols]
        scale = min(usable / max(frame.width for frame in row_crops), usable / max(frame.height for frame in row_crops))
        for col, frame in enumerate(row_crops):
            size = (max(1, round(frame.width * scale)), max(1, round(frame.height * scale)))
            registered = resize_premultiplied(frame, size)
            x = col * args.cell + (args.cell - registered.width) // 2
            y = row * args.cell + args.cell - args.margin - registered.height
            sheet.alpha_composite(registered, (x, y))

    for row in range(output_rows):
        for col in range(args.output_cols):
            cell = sheet.crop((col * args.cell, row * args.cell, (col + 1) * args.cell, (row + 1) * args.cell))
            bbox = cell.getchannel("A").getbbox()
            if bbox is None or min(bbox[0], bbox[1], args.cell - bbox[2], args.cell - bbox[3]) < 4:
                raise ValueError(f"registered cell {row},{col} violates the safety margin: {bbox}")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(args.output, optimize=True)
    print(f"{args.input} -> {args.output}: {args.input_cols}x{args.input_rows} contact sheet reflowed to {args.output_cols}x{output_rows}")


if __name__ == "__main__":
    main()
