"""Non-vacuous own gait floor/sign regressions before expanding source."""
from pathlib import Path
import importlib.util,math,unittest
from unittest.mock import patch
import numpy as np
from PIL import Image,ImageDraw
HERE=Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('renate_pilot',HERE/'pilot-motion.py');pilot=importlib.util.module_from_spec(s);s.loader.exec_module(pilot)
class SourceContract(unittest.TestCase):
 def test_contact_callback_retains_lift_and_removes_descent(self):
  nodes=[0,275,312,331,372,439,472]
  for side in [0,1]:
   dx=[0]*7;dy=[-3,-3,-3,0,3,7,7]
   _,out=pilot.planted_floor(side,nodes,dx,dy)
   self.assertEqual(out[-1],0);self.assertEqual(out[2],-3)
   lift=[-3,-3,-3,-5,-7,-9,-9]
   self.assertEqual(pilot.planted_floor(side,nodes,dx,lift)[1],lift)
 def test_side_plant_reverses_heading(self):
  for heading,sign in [('right',1),('left',-1)]:
   _,a=pilot.render(heading,math.pi/2);_,b=pilot.render(heading,3*math.pi/2)
   self.assertLess((b['nearDxDy'][0]-a['nearDxDy'][0])*sign,0)
   self.assertAlmostEqual(a['nearDxDy'][1],0);self.assertAlmostEqual(b['nearDxDy'][1],0)
 def test_actual_own_near_sole_paint_opposes_root(self):
  # Actual opaque lower/near shoe marks in Renate's own registered paint.
  # Karl's screen-side ownership cannot stand in for these source pixels.
  for heading,point,travel in [('right',(272,468),1),('left',(240,468),-1)]:
   with self.subTest(heading=heading):
    original=Image.open(HERE/'registered'/f'{heading}.png').convert('RGBA')
    self.assertGreaterEqual(original.getpixel(point)[3],200)
    mask=Image.new('RGBA',(512,512));x,y=point;ImageDraw.Draw(mask).rectangle((x-2,y-1,x+2,y+1),fill=(255,255,255,255))
    positions=[]
    with patch.object(pilot.Image,'open',return_value=mask):
     for phase in [math.pi/2,3*math.pi/2]:
      frame,_=pilot.render(heading,phase);yy,xx=np.nonzero(np.array(frame)[:,:,3]>=21);positions.append(float(np.mean(xx)))
    self.assertLess((positions[1]-positions[0])*travel,0,(heading,positions))
if __name__=='__main__':unittest.main()
