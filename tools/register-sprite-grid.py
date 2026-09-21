#!/usr/bin/env python3
"""Reflow an ImageGen contact sheet onto the canonical sprite-key grid."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
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
    parser.add_argument(
        "--flip-cells",
        default="",
        help="comma-separated zero-based input cells to mirror horizontally before registration",
    )
    parser.add_argument(
        "--flip-output-cells",
        default="",
        help="comma-separated zero-based selected/output cells to mirror horizontally",
    )
    parser.add_argument(
        "--select-cells",
        default="",
        help="comma-separated zero-based input cells to keep, in output order; defaults to every cell",
    )
    parser.add_argument(
        "--component-grid",
        action="store_true",
        help="extract the largest connected figures instead of hard-cutting nominal cell bounds",
    )
    parser.add_argument(
        "--normalize-scale",
        action="store_true",
        help="limit generated figure-height drift within each output row before registration",
    )
    parser.add_argument(
        "--max-height-drift",
        type=float,
        default=0.03,
        help="maximum proportional height variation retained with --normalize-scale (default: 0.03)",
    )
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


def connected_figure_crops(
    source: Image.Image, cols: int, rows: int, threshold: int, halo: int
) -> list[Image.Image]:
    try:
        from scipy import ndimage
    except ImportError as error:
        raise RuntimeError("--component-grid requires scipy for contact-sheet segmentation") from error
    mask = np.asarray(source.getchannel("A")) >= threshold
    labels, count = ndimage.label(mask)
    areas = np.bincount(labels.ravel())
    expected = cols * rows
    component_ids = sorted(range(1, count + 1), key=lambda item: int(areas[item]), reverse=True)[:expected]
    if len(component_ids) != expected or min(int(areas[item]) for item in component_ids) < 500:
        raise ValueError(f"component grid found {len(component_ids)} complete figures; expected {expected}")
    objects = ndimage.find_objects(labels)
    entries = []
    for component_id in component_ids:
        y_slice, x_slice = objects[component_id - 1]
        entries.append(((y_slice.start + y_slice.stop) / 2, (x_slice.start + x_slice.stop) / 2, component_id))
    entries.sort(key=lambda item: item[0])
    ordered = []
    for row in range(rows):
        ordered.extend(sorted(entries[row * cols : (row + 1) * cols], key=lambda item: item[1]))
    crops = []
    for _, _, component_id in ordered:
        selection = ndimage.binary_dilation(labels == component_id, iterations=max(1, halo))
        ys, xs = np.nonzero(selection)
        left, top, right, bottom = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        crop = source.crop((left, top, right, bottom))
        alpha = np.asarray(crop.getchannel("A")).copy()
        alpha[~selection[top:bottom, left:right]] = 0
        crop.putalpha(Image.fromarray(alpha, mode="L"))
        crops.append(crop)
    return crops


def main() -> None:
    args = parse_args()
    if min(args.input_cols, args.input_rows, args.output_cols, args.cell) < 1:
        raise ValueError("grid dimensions must be positive")
    source_count = args.input_cols * args.input_rows
    selected = [int(value) for value in args.select_cells.split(",") if value.strip()] or list(range(source_count))
    if any(index < 0 or index >= source_count for index in selected):
        raise ValueError(f"selected cell indexes must be between 0 and {source_count - 1}")
    count = len(selected)
    if count % args.output_cols:
        raise ValueError("input cell count must divide evenly into output columns")
    if args.margin < 4 or args.margin * 2 >= args.cell:
        raise ValueError("margin must leave a usable cell with at least four transparent pixels")
    if not 0 <= args.max_height_drift <= 0.15:
        raise ValueError("--max-height-drift must be between 0 and 0.15")

    source = Image.open(args.input).convert("RGBA")
    flip_cells = {int(value) for value in args.flip_cells.split(",") if value.strip()}
    flip_output_cells = {int(value) for value in args.flip_output_cells.split(",") if value.strip()}
    if any(index < 0 or index >= source_count for index in flip_cells):
        raise ValueError(f"flip cell indexes must be between 0 and {source_count - 1}")
    if any(index < 0 or index >= count for index in flip_output_cells):
        raise ValueError(f"flip output cell indexes must be between 0 and {count - 1}")
    source_crops: list[Image.Image] = []
    if args.component_grid:
        source_crops = connected_figure_crops(
            source, args.input_cols, args.input_rows, args.alpha_threshold, args.halo
        )
    else:
        for index in range(source_count):
            col, row = index % args.input_cols, index // args.input_cols
            left = round(col * source.width / args.input_cols)
            right = round((col + 1) * source.width / args.input_cols)
            top = round(row * source.height / args.input_rows)
            bottom = round((row + 1) * source.height / args.input_rows)
            source_crops.append(
                foreground_crop(source.crop((left, top, right, bottom)), args.alpha_threshold, args.halo)
            )
    crops = [
        source_crops[index].transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        if index in flip_cells or output_index in flip_output_cells
        else source_crops[index]
        for output_index, index in enumerate(selected)
    ]

    output_rows = count // args.output_cols
    sheet = Image.new("RGBA", (args.output_cols * args.cell, output_rows * args.cell))
    usable = args.cell - args.margin * 2
    for row in range(output_rows):
        row_crops = crops[row * args.output_cols : (row + 1) * args.output_cols]
        row_scale = min(usable / max(frame.width for frame in row_crops), usable / max(frame.height for frame in row_crops))
        median_height = float(np.median([frame.height for frame in row_crops]))
        normalized_base_height = usable / (1 + args.max_height_drift)
        for col, frame in enumerate(row_crops):
            if args.normalize_scale:
                ratio = frame.height / median_height
                ratio = min(1 + args.max_height_drift, max(1 - args.max_height_drift, ratio))
                target_height = normalized_base_height * ratio
                scale = target_height / frame.height
                if frame.width * scale > usable:
                    scale = usable / frame.width
            else:
                scale = row_scale
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
