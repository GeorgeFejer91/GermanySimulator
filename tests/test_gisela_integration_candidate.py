"""Protect the shared ground registration and source-owned paper/lip pixels."""
from pathlib import Path
import importlib.util
import json
import tempfile
import unittest

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/sprite-sources/street-speaker-motion/gisela-becker'


class GiselaIntegrationCandidate(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location('gisela_candidate', SOURCE / 'build-integration-candidate.py')
        cls.builder = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.builder)
        cls.folder = tempfile.TemporaryDirectory(prefix='gisela-candidate-', dir=ROOT / 'output/ambient-city-animation')
        cls.output = Path(cls.folder.name)
        cls.result = cls.builder.build_candidate(cls.output)

    @classmethod
    def tearDownClass(cls):
        cls.folder.cleanup()

    def test_only_owned_movement_and_gesture_cells_share_the_published_ground_pivot(self):
        person = self.result['person']
        self.assertEqual(person['cell'], [128, 160])
        self.assertEqual(person['pivot'], [64, 150])
        self.assertEqual(person['figureWorldHeight'], 1.6)
        self.assertEqual(person['grid'], [21, 18])
        self.assertEqual(set(person['atlasMotion']['settles']), {'down','right','up','left'})
        selected = {(r, c) for r in range(4) for c in range(16)}
        selected |= {(r, c) for r in range(4, 8) for c in range(5)}
        selected |= {(8, c) for c in range(8)}
        self.assertEqual(len(selected), 92)
        stop_slots={}
        for direction_index,direction in enumerate(['down','right','up','left']):
            phases=person['atlasMotion']['settles'][direction]
            self.assertEqual(set(phases),{str(i) for i in range(16)})
            for phase in range(16):
                sequence=phases[str(phase)]['frames']
                self.assertEqual(sequence[-1],dict(row=direction_index+4,col=2,ms=70))
                self.assertEqual(len(sequence),5)
                for stage,position in enumerate(sequence[:-1]):
                    key=position['row'],position['col']
                    self.assertNotIn(key,stop_slots)
                    self.assertNotIn(key,selected)
                    self.assertFalse(key[0]==13 and key[1]<16)
                    stop_slots[key]=(direction_index*16+phase)*4+stage
        self.assertEqual(len(stop_slots),256)
        for name, factor in [('desktop', 1), ('mobile', .5)]:
            w, h, shift = int(128*factor), int(160*factor), int(2*factor)
            atlas = Image.open(self.output / f'source-{name}.webp').convert('RGBA')
            original = Image.open(ROOT / f'assets/characters/street-speakers/quiz-gisela-becker/character-{name}.webp').convert('RGBA')
            gesture = Image.open(SOURCE / f'greet-gesture-v2/approved/greet16-{name}.webp').convert('RGBA')
            stops = Image.open(SOURCE / f'phase-stops-v1/approved/stops-{name}.webp').convert('RGBA')
            for row in range(18):
                for col in range(21):
                    expected = Image.new('RGBA', (w, h))
                    if (row,col) in stop_slots:
                        slot=stop_slots[row,col];x,y=(slot%16)*w,(slot//16)*h
                        cell=stops.crop((x,y,x+w,y+h))
                    elif (row, col) in selected or row == 13 and col<16:
                        source = gesture if row == 13 else original
                        source_row = 0 if row == 13 else row
                        cell = source.crop((col*w, source_row*h, (col+1)*w, (source_row+1)*h))
                    else:cell=None
                    if cell is not None:
                        self.assertIsNone(cell.getchannel('A').crop((0,h-shift,w,h)).getbbox(), (name,row,col,'clipped source'))
                        expected.alpha_composite(cell, (0, shift))
                    actual = atlas.crop((col*w,row*h,(col+1)*w,(row+1)*h))
                    self.assertEqual(actual.tobytes(), expected.tobytes(), (name,row,col))
            neutral = atlas.crop((2*w,4*h,3*w,5*h))
            for col in [0, 15]:
                self.assertEqual(atlas.crop((col*w,13*h,(col+1)*w,14*h)).tobytes(), neutral.tobytes(), (name,'gesture must enter/leave neutral'))

    def test_published_standing_and_own_pose_lips_survive_the_same_translation(self):
        payload = self.result['mouth']
        old = json.loads((ROOT / 'assets/characters/street/quiz-gisela-becker/mouths-candidate.json').read_text())
        standing = json.loads((ROOT / 'assets/characters/street/quiz-gisela-becker/mouths-standing-v1.json').read_text())
        gesture = json.loads((SOURCE / 'greet-gesture-v2/approved/mouth-fragment.json').read_text())['variants']
        self.assertEqual(payload['standing'], standing['standing'])
        self.assertEqual(payload['sources']['standing'], standing['sources']['standing'])
        self.assertEqual(len(payload['frames']), 378)
        self.assertEqual(sum(x is not None for x in payload['frames']), 276)
        expected={}
        for row in range(9):
            for col in range(16 if row<4 else 5 if row<8 else 8):expected[row*21+col]=old['frames'][row*16+col]
        for col in range(16):expected[13*21+col]=gesture['desktop']['frames'][col]
        for direction_index,direction in enumerate(['down','right','up','left']):
            for phase,sequence in self.result['person']['atlasMotion']['settles'][direction].items():
                source=old['frames'][direction_index*16+int(phase)]
                target=old['frames'][(direction_index+4)*16+2]
                for stage,position in enumerate(sequence['frames'][:-1]):
                    from copy import deepcopy
                    frame=deepcopy(source)
                    if frame is not None:frame['rect'][:2]=[b+(a-b)*[.8,.6,.4,.2][stage] for a,b in zip(source['rect'][:2],target['rect'][:2])]
                    expected[position['row']*21+position['col']]=frame
        for slot, actual in enumerate(payload['frames']):
            source = expected.get(slot)
            if source is None:
                self.assertIsNone(actual, slot)
                continue
            self.assertEqual(actual['profile'], source['profile'], slot)
            self.assertEqual(actual['axes'], source['axes'], slot)
            self.assertEqual(actual['rect'][0], source['rect'][0], slot)
            self.assertAlmostEqual(actual['rect'][1]+2/160, source['rect'][1], places=14, msg=str(slot))
            self.assertEqual(actual['rect'][2:], source['rect'][2:], slot)
        for desktop, mobile in zip(gesture['desktop']['frames'], gesture['mobile']['frames']):
            self.assertEqual(desktop['rect'], mobile['rect'])
            self.assertEqual(desktop['profile'], mobile['profile'])
            self.assertEqual(desktop['axes'], [2*v for v in mobile['axes']])

    def test_phase_stop_recipe_holds_the_loaded_sole_until_the_other_foot_lands(self):
        spec = importlib.util.spec_from_file_location('gisela_stops', SOURCE / 'build-phase-stops.py')
        stops = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(stops)
        for swing in [0, 1]:
            source = [dict(dx=[0,1,2,3,4,5,5],dy=[-1,-1,-1,-2,-3,-4,-4]),
                      dict(dx=[0,-1,-2,-3,-4,-5,-5],dy=[-1,-1,-1,0,0,0,0])]
            for limb in source:limb['nodes_y']=[0,250,300,335,380,430,511]
            target = [dict(dx=[0]*7,dy=[0]*7) for _ in range(2)]
            fields = [stops.stop_fields(source,target,swing,stage) for stage in range(4)]
            loaded = 1-swing
            for stage in [0,1]:
                for axis in ['dx','dy']:
                    self.assertEqual(fields[stage][loaded][axis][-2:],source[loaded][axis][-2:])
            self.assertEqual(fields[0][swing]['dx'][-1],0)
            self.assertLess(fields[0][swing]['dy'][-1], min(source[swing]['dy'][-1],0))
            self.assertEqual(fields[1][swing]['dy'][-1],0)
            for stage in [2,3]:
                self.assertEqual(fields[stage][swing]['dx'][-2:],[0,0])
                self.assertEqual(fields[stage][swing]['dy'][-2:],[0,0])
                self.assertLess(fields[stage][loaded]['dy'][-1],min(source[loaded]['dy'][-1],0))
            self.assertEqual(fields[2][loaded]['dx'][-1],source[loaded]['dx'][-1])
            self.assertEqual(fields[3][loaded]['dx'][-1],0)


if __name__ == '__main__':
    unittest.main()
