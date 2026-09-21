#!/usr/bin/env python3
"""Verify the shared runtime quality contract for one registered sprite atlas."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("atlas", type=Path)
    parser.add_argument("--cols", type=int, required=True)
    parser.add_argument("--rows", type=int, required=True)
    parser.add_argument("--cell", type=int, default=128)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    image = Image.open(args.atlas)
    expected = (args.cols * args.cell, args.rows * args.cell)
    if image.mode != "RGBA" or image.size != expected:
        raise ValueError(f"{args.atlas}: expected full RGBA {expected}, got {image.mode} {image.size}")

    red, green, blue, alpha = image.split()
    color = ImageChops.lighter(red, ImageChops.lighter(green, blue))
    transparent = alpha.point(lambda value: 255 if value == 0 else 0)
    if ImageChops.multiply(color, transparent).getbbox() is not None:
        raise ValueError(f"{args.atlas}: fully transparent pixels contain hidden RGB")
    if alpha.point(lambda value: 255 if 0 < value < 255 else 0).getbbox() is None:
        raise ValueError(f"{args.atlas}: antialiased alpha edge is missing")

    max_x_drift = max_y_drift = 0.0
    for row in range(args.rows):
        centers_x: list[float] = []
        centers_y: list[float] = []
        for col in range(args.cols):
            frame_alpha = alpha.crop(
                (col * args.cell, row * args.cell, (col + 1) * args.cell, (row + 1) * args.cell)
            )
            bbox = frame_alpha.getbbox()
            if bbox is None:
                raise ValueError(f"{args.atlas}: empty frame at row {row}, col {col}")
            left, top, right, bottom = bbox
            if min(left, top, args.cell - right, args.cell - bottom) < 1:
                raise ValueError(f"{args.atlas}: frame {row},{col} touches its cell edge: {bbox}")
            centers_x.append((left + right) / 2)
            centers_y.append((top + bottom) / 2)
        row_x_drift = max(centers_x) - min(centers_x)
        row_y_drift = max(centers_y) - min(centers_y)
        max_x_drift = max(max_x_drift, row_x_drift)
        max_y_drift = max(max_y_drift, row_y_drift)
        if row_x_drift > args.cell * 0.32 or row_y_drift > args.cell * 0.16:
            raise ValueError(
                f"{args.atlas}: row {row} is not registered (x drift {row_x_drift:.1f}, y drift {row_y_drift:.1f})"
            )

    print(
        f"PASS {args.atlas}: RGBA {image.width}x{image.height}, clean transparency, "
        f"max center drift x={max_x_drift:.1f}px y={max_y_drift:.1f}px"
    )


if __name__ == "__main__":
    main()
