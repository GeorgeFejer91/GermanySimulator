"""Own side-source leg transport with intact rigid Oxford paint.

The two visible limbs are partitioned at measured side-paint occlusion seams.
The source skirt, upper body, hands and bag remain one original layer. This is
an actor source rig, not a runtime renderer or a replacement paint generator.
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[5]
sys.path.insert(0, str(ROOT / ".agents/skills/animate-2d-characters/scripts"))
import painted_walk as paint

HERE = Path(__file__).resolve().parent
SIZE = 512
YY, XX = np.mgrid[:SIZE, :SIZE]
AXIS = {
    # x of visible leg boundary at hem/calf/cuff and shoe occlusion contours.
    "right": {"rows": [374, 401, 438, 445, 455, 471],
              "seamX": [258, 259, 260, 265, 282, 290], "nearIsLeft": True,
              "bagKeep": (282, 386)},
    "left": {"rows": [374, 401, 438, 445, 455, 471],
             "seamX": [257, 256, 255, 260, 245, 229], "nearIsLeft": False,
             "bagKeep": None},
}
SHOE_START = 438
LEG_START = 374
AMPLITUDE = 10.0
SWING_LIFT = 4.0


def mask_rgba(image: Image.Image, own: np.ndarray) -> Image.Image:
    arr = np.asarray(image.convert("RGBA")).copy()
    arr[~own] = 0
    return Image.fromarray(arr)


class SideSource:
    def __init__(self, heading: str):
        if heading not in AXIS:
            raise ValueError(heading)
        self.heading = heading
        self.source = Image.open(HERE / "registered" / f"{heading}.png").convert("RGBA")
        config = AXIS[heading]
        seam = np.interp(np.arange(SIZE), config["rows"], config["seamX"])
        lower = YY >= LEG_START
        if config["bagKeep"]:
            x, y = config["bagKeep"]
            lower &= ~((XX >= x) & (YY < y))
        near = lower & ((XX < seam[:, None]) if config["nearIsLeft"] else (XX >= seam[:, None]))
        far = lower & ~near
        upper = ~lower
        # The source near limb occludes the far calf/heel. Copy only *her own*
        # fully opaque covered pixels into the far layer; in neutral these are
        # hidden exactly by the unchanged near layer. Motion can then uncover
        # connected far-side paint rather than a transparent wedge.
        alpha = np.asarray(self.source.getchannel("A"))
        if heading == "right":
            interior = (XX >= np.where(YY < SHOE_START, 240, 244)) & (XX <= 290)
        else:
            interior = (XX <= np.where(YY < SHOE_START, 273, 277)) & (XX >= 226)
        backing = near & interior & (alpha == 255)
        far_with_backing = far | backing
        self.layers = {
            "upper": mask_rgba(self.source, upper),
            "calf-whole": mask_rgba(self.source, lower & (YY < SHOE_START)),
            "lower-whole": mask_rgba(self.source, lower),
            "near-calf": mask_rgba(self.source, near & (YY < SHOE_START)),
            "far-calf": mask_rgba(self.source, far_with_backing & (YY < SHOE_START)),
            "near-shoe": mask_rgba(self.source, near & (YY >= SHOE_START)),
            "far-shoe": mask_rgba(self.source, far_with_backing & (YY >= SHOE_START)),
        }
        neutral = Image.new("RGBA", (SIZE, SIZE))
        # Masks partition source support; original pixels must reconstruct exactly.
        for key in ("far-calf", "far-shoe", "near-calf", "near-shoe", "upper"):
            neutral.alpha_composite(self.layers[key])
        if neutral.tobytes() != self.source.tobytes():
            raise ValueError("Source partition altered neutral pixels")

    @staticmethod
    def translate(image: Image.Image, dx: float, dy: float) -> Image.Image:
        return paint.unpack(paint.sample(paint.premul(image), XX - dx, YY - dy))

    @staticmethod
    def calf(image: Image.Image, dx: float, dy: float) -> Image.Image:
        # Hip and hem are planted in original skirt paint; cuff reaches full
        # ankle displacement before the separate rigid shoe starts.
        return paint.warp_layer(image, [0, 374, 394, 414, 438, 511],
                                [0, 0, .18*dx, .55*dx, dx, dx],
                                [0, 0, .18*dy, .55*dy, dy, dy])

    def continuous_calf(self, near_dx: float, far_dx: float,
                        near_dy: float, far_dy: float) -> Image.Image:
        # Both overlapping shins are one source cloth field. The side source
        # hides part of the far shin, so cutting at the contour creates a real
        # empty wedge on opposite swings. A monotone, continuous x transport
        # carries every original calf pixel, with the hem anchored.
        config = AXIS[self.heading]
        seam = np.interp(np.arange(SIZE), config["rows"], config["seamX"])
        sx = XX.astype(np.float32).copy()
        sy = YY.astype(np.float32).copy()
        for _ in range(8):
            seam_y = np.interp(np.clip(sy, 0, SIZE-1), np.arange(SIZE), seam)
            u = np.clip((sx - seam_y + 30.0) / 60.0, 0, 1)
            u = u*u*(3-2*u)
            near_weight = 1-u if config["nearIsLeft"] else u
            vertical = np.clip((sy-LEG_START)/(SHOE_START-LEG_START), 0, 1)
            vertical = vertical*vertical*(3-2*vertical)
            dx = vertical*(near_weight*near_dx+(1-near_weight)*far_dx)
            dy = vertical*(near_weight*near_dy+(1-near_weight)*far_dy)
            sx = XX - dx
            sy = YY - dy
        return paint.unpack(paint.sample(paint.premul(self.layers["lower-whole"]), sx, sy))

    def render(self, phase: float, strength: float = 1.0):
        if not 0 <= strength <= 1:
            raise ValueError("strength")
        if strength == 0:
            return self.source.copy(), {"sourceExactNeutral": True}
        progress = math.sin(phase)
        near_dx = AMPLITUDE * progress * strength * (1 if self.heading == "right" else -1)
        far_dx = -near_dx
        near_dy = -SWING_LIFT * max(0, math.cos(phase)) * strength
        far_dy = -SWING_LIFT * max(0, -math.cos(phase)) * strength
        moves = {"near": (near_dx, near_dy), "far": (far_dx, far_dy)}
        out = Image.new("RGBA", (SIZE, SIZE))
        out.alpha_composite(self.continuous_calf(near_dx, far_dx, near_dy, far_dy))
        out.alpha_composite(self.layers["upper"])
        return out, {"phase": phase, "nearDxDy": [near_dx, near_dy],
                     "farDxDy": [far_dx, far_dy], "sourceExactNeutral": False}
