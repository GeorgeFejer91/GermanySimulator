"""An occluder reveals rigid paint; it must not pull paint off the object."""
import importlib.util
from pathlib import Path
import unittest

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('rigid_prop_builder', ROOT/'scripts/build_paired_gaussian.py')
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


def painting(points):
    points = np.asarray(points, dtype=float)
    return points, np.tile(np.array([[180,120,30,255]], dtype='u1'), (len(points),1))


def prop_state(pivot, top, bottom):
    x,y = pivot
    return {'landmarks':{'top':top,'bottom':bottom},
            'regions':[{'part':'ruler','polygon':[[x-15,y-15],[x+15,y-15],[x+15,y+15],[x-15,y+15]],
                        'pivot_xy':pivot,'orientation_landmarks':['top','bottom']}]}


class RigidRevealTests(unittest.TestCase):
    def match(self, source, target, first, last):
        block = BUILDER.match(painting(source), painting(target), first, last, 2, 64, 64)
        a,b,c0,c1,ranges = block
        self.assertEqual({tuple(x) for x,c in zip(a,c0) if c[3]}, {tuple(x) for x in source})
        self.assertEqual({tuple(x) for x,c in zip(b,c1) if c[3]}, {tuple(x) for x in target})
        return block

    def test_stationary_ruler_reveal_keeps_hidden_samples_at_their_physical_location(self):
        state = prop_state([20,20],[20,5],[20,35])
        for source,target in [([[20,10]],[[20,10],[20,20]]),
                              ([[20,10],[20,20]],[[20,10]])]:
            with self.subTest(source=source):
                a,b,c0,c1,_ = self.match(source,target,state,state)
                synthetic = (c0[:,3]==0)|(c1[:,3]==0)
                self.assertEqual(int(synthetic.sum()),1)
                np.testing.assert_allclose(a[synthetic],b[synthetic],rtol=0,atol=1e-10)
                np.testing.assert_allclose(a[synthetic],[[20,20]],rtol=0,atol=1e-10)

    def test_reveal_and_occlusion_follow_translated_quarter_turn_not_visible_edge(self):
        first = prop_state([20,20],[10,20],[30,20])
        last = prop_state([30,20],[30,10],[30,30])
        for source,target,start,end in [([[10,20]],[[30,10],[30,20]],first,last),
                                        ([[30,10],[30,20]],[[10,20]],last,first)]:
            with self.subTest(source=source):
                a,b,c0,c1,_ = self.match(source,target,start,end)
                synthetic = (c0[:,3]==0)|(c1[:,3]==0)
                self.assertEqual(int(synthetic.sum()),1)
                expected_a,expected_b = ([[20,20]],[[30,20]]) if start is first else ([[30,20]],[[20,20]])
                np.testing.assert_allclose(a[synthetic],expected_a,rtol=0,atol=1e-10)
                np.testing.assert_allclose(b[synthetic],expected_b,rtol=0,atol=1e-10)

    def test_wholly_hidden_rigid_part_keeps_its_rotation_with_or_without_attachment(self):
        first = prop_state([20,20],[10,20],[30,20])
        last = prop_state([30,20],[30,10],[30,30])
        for attachments in ({},{'ruler':'top'}):
            for reverse in (False,True):
                with self.subTest(attachments=attachments,reverse=reverse):
                    source,target = painting([[55,55]]),painting([[30,10],[30,20],[55,55]])
                    start,end = first,last
                    if reverse:
                        source,target,start,end = target,source,last,first
                    a,b,c0,c1,ranges = BUILDER.match(source,target,start,end,2,64,64,attachments)
                    rows = list(range(*ranges['ruler']))
                    self.assertEqual(len(rows),2)
                    expected = {(10.,20.):(30.,10.),(20.,20.):(30.,20.)}
                    if reverse:
                        expected = {v:k for k,v in expected.items()}
                    for index in rows:
                        self.assertIn(tuple(a[index]),expected)
                        np.testing.assert_allclose(b[index],expected[tuple(a[index])],rtol=0,atol=1e-10)
                        self.assertEqual(int(c1[index,3] if reverse else c0[index,3]),0)


if __name__=='__main__':
    unittest.main()
