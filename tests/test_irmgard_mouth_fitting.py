"""Source-view classification must use the inspected crop of the selected family."""
import importlib.util
from pathlib import Path
import unittest
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('irmgard_mouths', ROOT/'tools/build-irmgard-mouths.py')
mouths = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mouths)

class MouthSourceClassificationTests(unittest.TestCase):
    def test_own_face_crop_distinguishes_views_outside_legacy_head_region(self):
        front=np.zeros((160,128,4),dtype=float)
        rear=front.copy()
        front[12:26,85:102,:3]=[185,105,62]
        rear[12:26,85:102,:3]=[65,37,24]
        target=rear.copy()
        target[12:26,85:102,:3]=0
        target[13:27,86:103,:3]=[65,37,24]
        name,error,runner=mouths.classify_pose({'front':front,'rear':rear},target,[82,9,105,30])
        self.assertEqual(name,'rear','A wrong front template projects lips onto a rear/hidden mouth')
        self.assertEqual(error,0)
        self.assertGreater(runner,error)

    def test_unsafe_crop_is_rejected_before_shifted_sampling(self):
        target=np.zeros((160,128,4),dtype=float)
        with self.assertRaisesRegex(ValueError,'crop'):
            mouths.classify_pose({'front':target},target,[0,0,128,160])

    def test_mismatched_source_dimensions_do_not_classify(self):
        target=np.zeros((160,128,4),dtype=float)
        with self.assertRaisesRegex(ValueError,'dimensions'):
            mouths.classify_pose({'front':target[:120,:96]},target,[25,20,80,65])

if __name__=='__main__':
    unittest.main()
