"""Both own side views must counter actual ground travel during stance."""
import importlib.util
import math
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT/'assets/sprite-sources/resident-motion/stadt-hannelore-sparkasse/adult-v1/side-source-fields.py'
definition = importlib.util.spec_from_file_location('hannelore_side_direction', SOURCE)
side = importlib.util.module_from_spec(definition)
definition.loader.exec_module(side)

class HanneloreGaitDirectionTests(unittest.TestCase):
    def test_planted_near_and_far_shoes_counter_each_heading(self):
        for heading, travel in [('right', 1), ('left', -1)]:
            rig = side.SideSource(heading)
            for name, first, last in [('near', math.pi/2, 3*math.pi/2),
                                      ('far', 3*math.pi/2, 5*math.pi/2)]:
                with self.subTest(heading=heading, shoe=name):
                    _, before = rig.render(first)
                    _, after = rig.render(last)
                    x0, y0 = before[name+'DxDy']
                    x1, y1 = after[name+'DxDy']
                    self.assertAlmostEqual(y0, 0)
                    self.assertAlmostEqual(y1, 0)
                    self.assertLess((x1-x0)*travel, 0,
                                    'a planted shoe must travel opposite the actor root')

    def test_zero_strength_retains_each_own_neutral_source(self):
        for heading in ['right', 'left']:
            rig = side.SideSource(heading)
            frame, _ = rig.render(.7, strength=0)
            self.assertEqual(frame.tobytes(), rig.source.tobytes())

if __name__ == '__main__':
    unittest.main()
