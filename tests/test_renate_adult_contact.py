"""Actual selected native grounding regressions for Renate's adult family."""
from pathlib import Path
import importlib.util,json,unittest
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
HERE=ROOT/'assets/sprite-sources/resident-motion/stadt-renate-termin/adult-v1'
class RenateAdultContacts(unittest.TestCase):
 def test_actual_vertical_contact_shoes_do_not_descend_below_root(self):
  p=json.loads((ROOT/'assets/characters/street/manifest.json').read_text())['characters']['stadt-renate-termin']
  for name,w,h in [('desktop',96,120),('mobile',64,80)]:
   atlas=Image.open(ROOT/p['variants'][name]['file'].removeprefix('./')).convert('RGBA');pivot=150*w/128
   for row in [0,2]:
    for phase in [4,12]:
     with self.subTest(variant=name,row=row,phase=phase):
      alpha=np.array(atlas.crop((phase*w,row*h,(phase+1)*w,(row+1)*h)))[:,:,3]
      yy,xx=np.nonzero(alpha>=21);self.assertGreater(len(xx),100)
      self.assertLessEqual(int(yy.max()),pivot)
 def test_free_left_hand_gesture_retains_ticket_face_and_shoes(self):
  spec=importlib.util.spec_from_file_location('renate_protected_action',HERE/'build-family-source.py');family=importlib.util.module_from_spec(spec);spec.loader.exec_module(family)
  neutral_image=Image.open(HERE/'registered/down.png').convert('RGBA');neutral=np.array(neutral_image)
  for phase,amount in enumerate([0,.05,.11,.18,.34,.53,.72,.90,1,1,1,.84,.66,.44,.20,0]):
   source=np.array(family.gesture(neutral_image,amount))
   for name,box in [('ticket',(168,270,214,330)),('face',(200,60,305,170)),('shoes',(160,425,350,480))]:
    x0,y0,x1,y1=box
    with self.subTest(phase=phase,protected=name):self.assertTrue(np.array_equal(source[y0:y1,x0:x1],neutral[y0:y1,x0:x1]))
if __name__=='__main__':unittest.main()
