"""A planted walking shoe must remain above its fixed upright sprite ground."""
import json,unittest
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]

class HeikeContactGroundTests(unittest.TestCase):
    def test_front_and_back_contacts_preserve_the_fixed_ground_pivot(self):
        person=json.loads((ROOT/'assets/characters/street/manifest.json').read_text())['characters']['quiz-heike-hoffmann']
        for client,variant in person['variants'].items():
            image=Image.open(ROOT/variant['file'].removeprefix('./')).convert('RGBA')
            width,height=image.width//person['grid'][0],image.height//person['grid'][1]
            pivot=person['pivot'][1]*height/person['cell'][1]
            # Half-pixel contact and the selected native resize contour, not
            # several rows of opaque shoe below the upright world-ground line.
            allowance=1.5 if client=='desktop' else 1.0
            for direction,row in [('down',0),('up',2)]:
                for phase in [4,12]:
                    with self.subTest(client=client,direction=direction,phase=phase):
                        alpha=np.asarray(image.crop((phase*width,row*height,(phase+1)*width,(row+1)*height)))[:,:,3]
                        bottom=int(np.nonzero(alpha>=21)[0].max())+1
                        self.assertLessEqual(bottom-pivot,allowance,
                            'Source contact descends beneath the fixed ground; pavement clips the shoe')

if __name__=='__main__':unittest.main()
