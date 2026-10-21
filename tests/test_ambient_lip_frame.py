"""Painted lip directions must survive serialization to GLSL mat2 columns."""
import importlib.util
import json
from pathlib import Path
import unittest

import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT/path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


HEIKE = 'assets/sprite-sources/street-speaker-motion/heike-hoffmann'
heike = load('heike_lip_frame', HEIKE+'/mouth-moving-v1/compile-moving-mouths.py')


class LipFrameTests(unittest.TestCase):
    def assert_shader_directions(self, result, source_axes, matrix):
        # Runtime amtMouthPaintFrame uses mat2(axes.xy,axes.zw), so its first
        # pair is the painted tangent, its second the normal (+Y down).
        tangent = np.asarray(source_axes[:2])
        normal = np.asarray(source_axes[2:])
        np.testing.assert_allclose(result['axes'][:2], matrix@tangent*.34, rtol=0, atol=1e-10)
        np.testing.assert_allclose(result['axes'][2:], matrix@normal*.34, rtol=0, atol=1e-10)

    def test_heike_own_tilted_lips_keep_their_direction_at_neutral(self):
        data = json.loads((ROOT/HEIKE/'mouth-source-v1/source-mouth-profiles-v1.json').read_text())
        for name, entry in data['registrations'].items():
            if entry is None:
                continue
            with self.subTest(heading=name):
                result = heike.compile_cell(entry, data['compiledSourceCells'][name], lambda p: np.asarray(p))
                self.assert_shader_directions(result, entry['axesPx'], np.eye(2))

    def test_heike_sheared_head_preserves_both_painted_basis_vectors(self):
        data = json.loads((ROOT/HEIKE/'mouth-source-v1/source-mouth-profiles-v1.json').read_text())
        entry = data['registrations']['down']
        matrix = np.array([[1, .2], [0, 1]])
        result = heike.compile_cell(entry, data['compiledSourceCells']['down'], lambda p: np.asarray(p)@matrix.T+[2, -3])
        self.assert_shader_directions(result, entry['axesPx'], matrix)

if __name__ == '__main__':
    unittest.main()
