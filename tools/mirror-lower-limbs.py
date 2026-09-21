#!/usr/bin/env python3
"""Build an opposite walk half by mirroring only the registered lower limbs."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--cols", type=int, default=8)
    parser.add_argument("--rows", type=int, required=True)
    parser.add_argument("--row", type=int, required=True)
    parser.add_argument("--cell", type=int, default=256)
    parser.add_argument("--cut-y", type=int, required=True)
    parser.add_argument("--left", type=int, required=True)
    parser.add_argument("--right", type=int, required=True)
    parser.add_argument("--row-offset-y", type=int, default=0)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.cols % 2 or not 0 <= args.row < args.rows:
        raise ValueError("limb mirroring requires an even column count and a valid row")
    if not (0 <= args.left < args.right <= args.cell and 0 <= args.cut_y < args.cell):
        raise ValueError("the lower-limb isolation rectangle must fit inside one cell")
    sheet = Image.open(args.input).convert("RGBA")
    expected = (args.cols * args.cell, args.rows * args.cell)
    if sheet.size != expected:
        raise ValueError(f"expected {expected}, got {sheet.size}")

    half = args.cols // 2
    row_top = args.row * args.cell
    for phase in range(half):
        source_left = phase * args.cell
        source = sheet.crop((source_left, row_top, source_left + args.cell, row_top + args.cell))
        opposite = source.copy()
        limb_box = (args.left, args.cut_y, args.right, args.cell)
        limbs = source.crop(limb_box).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        opposite.paste((0, 0, 0, 0), limb_box)
        opposite.alpha_composite(limbs, (args.left, args.cut_y))
        target_left = (phase + half) * args.cell
        sheet.paste(
            (0, 0, 0, 0),
            (target_left, row_top, target_left + args.cell, row_top + args.cell),
        )
        sheet.alpha_composite(opposite, (target_left, row_top))

    if args.row_offset_y:
        registered_row = sheet.crop((0, row_top, args.cols * args.cell, row_top + args.cell))
        sheet.paste((0, 0, 0, 0), (0, row_top, args.cols * args.cell, row_top + args.cell))
        sheet.alpha_composite(registered_row, (0, row_top + args.row_offset_y))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(args.output, optimize=True)
    print(
        f"{args.input} -> {args.output}: row {args.row} opposite half uses isolated lower-limb mirroring "
        f"inside x={args.left}:{args.right}, y={args.cut_y}:{args.cell}"
    )


if __name__ == "__main__":
    main()
