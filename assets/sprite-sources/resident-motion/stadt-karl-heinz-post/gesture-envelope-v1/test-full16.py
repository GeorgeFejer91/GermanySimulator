"""Timing and reviewed-anchor contracts for Karl's 16-frame own gesture."""
import importlib.util
import unittest
from pathlib import Path

HERE=Path(__file__).resolve().parent


class FullEnvelopeTiming(unittest.TestCase):
    def test_reviewed_pilot_anchors_and_hold_survive_full_timing(self):
        spec=importlib.util.spec_from_file_location('karl_envelope_full',HERE/'build-full16.py')
        module=importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        timeline=module.timeline()
        self.assertEqual(len(timeline),16)
        self.assertEqual([timeline[i] for i in (0,3,8,15)],[0,.18,1,0])
        self.assertEqual(timeline[8:11],[1,1,1])
        self.assertTrue(all(0<=value<=1 for value in timeline))


if __name__=='__main__':
    unittest.main()
