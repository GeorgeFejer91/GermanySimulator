"""Release Karl's stationary side-hip paint from the moving-limb owner.

Only alpha changes inside two side-hip wedges. The original cardinal source and
its RGB remain unchanged; original full-body registration reads that source.
"""
from __future__ import annotations

import hashlib
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, label

ROOT = Path(__file__).resolve().parents[4]
SOURCE = ROOT / 'assets/sprite-sources/street-residents/stadt-karl-heinz-post-directions-candidate.png'
EXPECTED = 'f729563bbc2a88d37befa59d500092fc11d204258a524acbdcdc7df190d88ec5'
DEST = Path(__file__).with_name('original-upper-ownership-v2.png')
# Hand/jacket/paper are original upper; stationary navy outside the moving
# thigh belongs to the newly painted lower legs. Coordinates are source pixels.
WEDGES = ((743, 830, 465, 535), (1920, 1997, 465, 535))


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    if sha(SOURCE) != EXPECTED:
        raise ValueError('Karl original cardinal paint changed')
    original = np.asarray(Image.open(SOURCE).convert('RGBA'))
    rgba = original.copy()
    for x0, x1, y0, y1 in WEDGES:
        part = rgba[y0:y1, x0:x1]
        rgb = part[:, :, :3].astype(np.int16)
        r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
        warm = (r > g * 1.16) & (r > b * 1.35) & (r > 55)
        paper = (r > 105) & (g > 100) & (b > 90) & ((r - b) < 55)
        components, count = label(warm | paper)
        sizes = np.bincount(components.ravel(), minlength=count+1)
        owned = (components > 0) & (sizes[components] >= 25)
        owned = binary_dilation(owned, iterations=2)
        part[:, :, 3] = np.where(owned, part[:, :, 3], 0)
        part[part[:, :, 3] == 0] = 0
    keep = rgba[:, :, 3] > 0
    if not np.array_equal(original[:, :, :3][keep], rgba[:, :, :3][keep]):
        raise ValueError('Owned Karl paint RGB changed')
    if np.any(rgba[:, :, 3] > original[:, :, 3]):
        raise ValueError('Alpha grew beyond original')
    diff = original[:, :, 3] != rgba[:, :, 3]
    yy, xx = np.indices(diff.shape)
    permitted = np.zeros(diff.shape, dtype=bool)
    for x0, x1, y0, y1 in WEDGES:
        permitted |= (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1)
    if np.any(diff & ~permitted):
        raise ValueError('Alpha changed outside Karl side-hip wedges')
    Image.fromarray(rgba).save(DEST)
    print(f'{DEST} {sha(DEST)} removedAlphaPixels={int(diff.sum())}')


if __name__ == '__main__':
    main()
