"""Regression for the source-sheet row boundary cutting through her scarf."""
import importlib.util
import unittest
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('neighbors', ROOT / 'tools/build-neighbor-sprites.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class CrownTests(unittest.TestCase):
    def test_complete_rounded_crown_in_every_direction(self):
        _, poses = builder.source_views('schwabingen', 2)
        for index, pose in enumerate(poses):
            with self.subTest(view=index):
                alpha = np.array(pose)[:, :, 3]
                top = np.where(alpha.max(axis=1) > 128)[0][0]
                self.assertGreater(top, 0, 'keep a transparent gutter')
                self.assertLess(np.count_nonzero(alpha[top] > 128), 25,
                                'a wide flat first row means the crown was cut at the sheet boundary')


if __name__ == '__main__':
    unittest.main()
