import math
from pathlib import Path
import sys
import unittest

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'.agents/skills/animate-2d-characters/scripts'))
import painted_walk


class PaintedGroundingTests(unittest.TestCase):
    def source(self):
        image=Image.new('RGBA',(512,512))
        draw=ImageDraw.Draw(image)
        draw.rectangle((160,180,350,335),fill=(70,90,60,255))
        draw.rectangle((180,320,220,450),fill=(70,70,70,255))
        draw.rectangle((290,320,330,450),fill=(70,70,70,255))
        draw.rectangle((175,430,230,470),fill=(230,20,40,255))
        draw.rectangle((285,430,340,470),fill=(20,40,230,255))
        return image

    def landmarks(self):
        return {'waist':250,'hip':300,'hem':[335,335],'knee':[380,380],
                'ankle':[430,430],'mid':256,'centres':[200,310],
                'auto_hand_mask':False,'step_width':16}

    def marker_y(self, image):
        pixels=np.asarray(image)
        mask=(pixels[:,:,0]>180)&(pixels[:,:,1]<60)&(pixels[:,:,2]<80)&(pixels[:,:,3]>200)
        rows=np.where(mask)[0]
        self.assertGreater(len(rows),500,'the intact painted sole must remain visible')
        return float(rows.mean())

    def test_projected_stance_keeps_an_actual_painted_sole_at_one_ground_point(self):
        projection=10.5/math.hypot(10.5,16.7)
        cycle=25.6
        amplitude=cycle*.02*projection/(4*.004)
        landmarks=self.landmarks()|{'stride_curve':'planted','depth_amplitude':amplitude}
        phases=[4,6,8,10,12]
        frames,_=painted_walk.animate(self.source(),landmarks,(0,1),count=16,
            foreground=0,phases=[p/16*math.tau for p in phases])
        soles=[self.marker_y(frame) for frame in frames]
        ground=[cycle*(phase-phases[0])/16+(sole-soles[0])*.004/.02/projection for phase,sole in zip(phases,soles)]
        self.assertLess(max(abs(value) for value in ground),.25,'pixel rounding only; no stance glide at the reference projection')

    def test_explicit_legacy_options_keep_default_pixels(self):
        phases=[0,math.pi/2,math.pi,3*math.pi/2]
        original,_=painted_walk.animate(self.source(),self.landmarks(),(0,1),phases=phases)
        explicit,_=painted_walk.animate(self.source(),self.landmarks()|{'stride_curve':'sin','depth_amplitude':9},(0,1),phases=phases)
        self.assertEqual([frame.tobytes() for frame in original],[frame.tobytes() for frame in explicit])

    def test_invalid_projection_controls_are_rejected(self):
        for field,value in [('depth_amplitude',-1),('depth_amplitude',65),('depth_amplitude',float('nan')),('stride_curve','unknown'),('depth_knee_follow',2),('depth_knee_follow',float('nan'))]:
            with self.subTest(field=field,value=value),self.assertRaises(ValueError):
                painted_walk.animate(self.source(),self.landmarks()|{field:value},(0,1),count=4)


if __name__=='__main__':
    unittest.main()
