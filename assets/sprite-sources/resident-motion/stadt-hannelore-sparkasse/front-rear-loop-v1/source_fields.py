"""Hannelore's source-painted front/rear field, including stop strength.

Controls describe paint interpolation, not concealed anatomical joints.
No runtime or other character's source is modified.
"""
from pathlib import Path
import importlib.util
import json
import math
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy.interpolate import PchipInterpolator, CubicHermiteSpline

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FrontRearFields:
    def __init__(self):
        sys.path.insert(0, str(ROOT / '.agents/skills/animate-2d-characters/scripts'))
        self.paint = load('hannelore_loop_paint', ROOT / '.agents/skills/animate-2d-characters/scripts/painted_walk.py')
        self.recipe = json.loads((HERE / 'recipe.json').read_text())
        self.sources = {}
        self.masks = {}
        self.swing_curves = {}
        for direction, view in self.recipe['views'].items():
            values = self.recipe['swingSchedule'][direction]['dy']
            slopes = PchipInterpolator([0,2,6,8], values).derivative()([0,2,6,8])
            slopes[0] = slopes[-1] = 0
            self.swing_curves[direction] = CubicHermiteSpline([0,2,6,8], values, slopes)
            self.sources[direction] = Image.open(ROOT / view['source']).convert('RGBA')
            mask = Image.new('L', (512, 512))
            ImageDraw.Draw(mask).polygon([tuple(p) for p in view['propPolygon']], fill=255)
            self.masks[direction] = mask

    def pose(self, direction, phase, strength=1):
        """Evaluate continuous radians directly from original source pixels."""
        if not math.isfinite(phase) or not math.isfinite(strength) or not 0 <= strength <= 1:
            raise ValueError('Expected finite phase and strength in [0, 1]')
        view = self.recipe['views'][direction]
        calls = []
        original = self.paint.warp_layer

        def traced(layer, nodes, dx, dy):
            calls.append({'nodes_y': list(nodes), 'dx': [float(x) for x in dx],
                          'dy': [float(x) for x in dy],
                          'minJacobianY': float(np.min(1 + PchipInterpolator(nodes, dy).derivative()(np.arange(512))))})
            return original(layer, nodes, dx, dy)

        def limb(side, nodes, dx, dy):
            bob = -3.4 * math.cos(2 * phase) * strength
            # One complete shoe is planted during the other's eight-phase swing.
            # The four reviewed key poses are unchanged; the previous independent
            # sine-depth/lift curves raised both shoes in unreviewed inbetweens.
            schedule = self.recipe['swingSchedule'][direction]
            local = (phase * 16 / math.tau - schedule['startPhase'][side]) % 16
            foot_dy = (float(self.swing_curves[direction](local))
                       if local < 8 else 0.0) * strength
            root_dy = bob + foot_dy * .22
            blend = (nodes[4] - nodes[3]) / (nodes[5] - nodes[3])
            calf_dy = root_dy + (foot_dy - root_dy) * blend
            return dx, [bob, bob, bob, root_dy, calf_dy, foot_dy, foot_dy]

        self.paint.warp_layer = traced
        try:
            frames, records = self.paint.animate(
                self.sources[direction], view['landmarks'], travel=view['travel'],
                count=16, foreground=view['foreground'], strength=strength,
                phases=[phase], rigid_mask=self.masks[direction], limb_pose=limb)
        finally:
            self.paint.warp_layer = original
        assert len(calls) == 3
        return frames[0], {'phaseRadians': phase, 'strength': strength,
                           'fields': calls, 'helperRecord': records[0]}

    @staticmethod
    def transport(record, field_index, point):
        """Carry a source point through its actual baked forward field."""
        field = record['fields'][field_index]
        x, y = point
        return [float(x + PchipInterpolator(field['nodes_y'], field['dx'])(y)),
                float(y + PchipInterpolator(field['nodes_y'], field['dy'])(y))]
