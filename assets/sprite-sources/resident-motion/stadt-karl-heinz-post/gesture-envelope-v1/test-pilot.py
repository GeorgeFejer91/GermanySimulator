"""Geometry checks for Karl's own modest envelope gesture pilot."""
import importlib.util
import unittest
from pathlib import Path

import numpy as np

SCRIPT = Path(__file__).resolve().parent/'build-pilot.py'


class EnvelopePilot(unittest.TestCase):
    def test_own_envelope_moves_while_protected_head_and_feet_anchors_hold(self):
        spec = importlib.util.spec_from_file_location('karl_envelope_pilot', SCRIPT)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        source,target,triangles = module.mesh()
        self.assertEqual(source.shape,target.shape)
        self.assertGreater(len(triangles),10)
        motion = target-source
        self.assertTrue(np.allclose(motion[source[:,1]<=270],0))
        self.assertTrue(np.allclose(motion[source[:,1]>=400],0))
        paper = (source[:,0]>=320)&(source[:,0]<=385)&(source[:,1]>=310)&(source[:,1]<=375)
        self.assertGreater(int(paper.sum()),3)
        self.assertLess(float(motion[paper,1].min()),-5)
        self.assertGreaterEqual(float(motion[paper,1].min()),-12)


if __name__=='__main__':
    unittest.main()
