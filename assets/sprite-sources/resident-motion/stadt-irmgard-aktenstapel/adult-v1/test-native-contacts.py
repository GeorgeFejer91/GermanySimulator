"""Regression for real upright-billboard pavement clipping at vertical contacts."""
from pathlib import Path
import json,unittest
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[5]
class AktenstapelVerticalContacts(unittest.TestCase):
    def test_selected_front_rear_contacts_stay_above_ground(self):
        person=json.loads((ROOT/'assets/characters/street/manifest.json').read_text())['characters']['stadt-irmgard-aktenstapel']
        for variant,entry in person['variants'].items():
            with Image.open(ROOT/entry['file'].removeprefix('./')) as opened:
                atlas=opened.convert('RGBA')
            w,h=atlas.width//person['grid'][0],atlas.height//person['grid'][1]
            pivot=person['pivot'][1]*h/person['cell'][1]
            for direction in ('down','up'):
                row=person['atlasMotion']['walks'][direction]['row']
                for phase in (4,12):
                    with self.subTest(variant=variant,direction=direction,phase=phase):
                        alpha=np.asarray(atlas.crop((phase*w,row*h,(phase+1)*w,(row+1)*h)))[:,:,3]
                        yy,xx=np.nonzero(alpha>=21)
                        self.assertGreater(len(yy),0)
                        # A half physical pixel permits raster fringe at the
                        # pivot; whole shoe rows below an upright root fail.
                        below=(alpha>=21)&(np.arange(h)[:,None]+.5>pivot+.5)
                        self.assertEqual(int(below.sum()),0,
                            f'{variant}/{direction}/{phase}: alpha21 bottom={int(yy.max()+1)}, pivot={pivot}, below-ground shoe pixels={int(below.sum())}')

if __name__=='__main__':unittest.main()
