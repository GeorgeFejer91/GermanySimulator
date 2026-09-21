#!/usr/bin/env python3
"""Combine one registered side-walk row with registered down/up rows."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("side", type=Path, help="8x1 registered side-view key sheet")
    parser.add_argument("vertical", type=Path, help="8x2 registered down/up key sheet")
    parser.add_argument("output", type=Path, help="8x3 registered directional key sheet")
    parser.add_argument("--cols", type=int, default=8)
    parser.add_argument("--cell", type=int, default=256)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    side = Image.open(args.side).convert("RGBA")
    vertical = Image.open(args.vertical).convert("RGBA")
    expected_side = (args.cols * args.cell, args.cell)
    expected_vertical = (args.cols * args.cell, args.cell * 2)
    if side.size == (args.cols * args.cell, args.cell * 3):
        side = side.crop((0, 0, args.cols * args.cell, args.cell))
    if side.size != expected_side:
        raise ValueError(f"expected side sheet {expected_side}, got {side.size}")
    if vertical.size != expected_vertical:
        raise ValueError(f"expected vertical sheet {expected_vertical}, got {vertical.size}")
    output = Image.new("RGBA", (args.cols * args.cell, args.cell * 3))
    output.alpha_composite(side, (0, 0))
    output.alpha_composite(vertical, (0, args.cell))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    output.save(args.output, optimize=True)
    print(f"{args.side} + {args.vertical} -> {args.output}: {args.cols}x3 directional key grid")


if __name__ == "__main__":
    main()
