from pathlib import Path
import importlib.util
import unittest,hashlib,tempfile
import copy
from types import SimpleNamespace
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('police_builder',ROOT/'tools/build-police-sprites.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)

class AdultPoliceBuilderTests(unittest.TestCase):
    def test_fixed_police_packing_cannot_silently_change_world_or_cell_geometry(self):
        configuration={'working':{'figureHeight':400,'baseline':472},'cell':[160,192],
                       'figureHeight':125,'pivot':[80,147.5],
                       'characters':{'patrol-male':{'figureWorldHeight':2.33,'cycle_distance':65.24,
                           'views':{name:{'landmarks':{'step_width':56}} for name in ['down','right','up','left']}}}}
        builder.validate_adult_geometry(configuration)
        for field,value in [('cell',[128,160]),('pivot',[80,148]),('figureHeight',124)]:
            changed=copy.deepcopy(configuration);changed[field]=value
            with self.assertRaisesRegex(ValueError,'geometry'):
                builder.validate_adult_geometry(changed)
        for field,value in [('figureWorldHeight',1.56),('cycle_distance',18.64)]:
            changed=copy.deepcopy(configuration);changed['characters']['patrol-male'][field]=value
            with self.assertRaisesRegex(ValueError,'geometry'):
                builder.validate_adult_geometry(changed)

    def test_distance_clock_matches_authored_sole_travel_at_pursuit_speed(self):
        import json
        configuration=json.loads((ROOT/'assets/sprite-sources/police/adult-motion.json').read_text())
        for person in configuration['characters'].values():
            self.assertLessEqual(165/person['cycle_distance'],2.6,
                                 'Maximum pursuit must not alias a tiny shuffle into seven cycles per second')
            for view in person['views'].values():
                source_cycle=4*view['landmarks']['step_width']*person['figureWorldHeight']/400/.02
                self.assertAlmostEqual(person['cycle_distance'],source_cycle,places=9,
                                       msg='Clock must agree with painted sole travel, not just slow the animation')
        changed=copy.deepcopy(configuration)
        next(iter(changed['characters'].values()))['views']['right']['landmarks']['step_width']=16
        with self.assertRaisesRegex(ValueError,'cycle'):
            builder.validate_adult_geometry(changed)

    def test_overlapping_rectangles_do_not_import_another_figures_arm(self):
        source=Image.new('RGBA',(128,128));draw=ImageDraw.Draw(source)
        draw.rectangle((10,10,30,100),fill='#bd401f')
        draw.rectangle((20,90,80,110),fill='#bd401f')
        draw.rectangle((60,10,90,80),fill='#1548d1')
        source.putpixel((9,50),(189,64,31,8))
        isolated=builder.isolate_source_component(source,[10,10,81,111])
        self.assertEqual(isolated.getpixel((15,50)),source.getpixel((15,50)))
        self.assertEqual(isolated.getpixel((75,100)),source.getpixel((75,100)))
        self.assertEqual(isolated.getpixel((9,50)),source.getpixel((9,50)),
                         'Keep the selected outline antialiasing')
        self.assertEqual(isolated.getpixel((65,50))[3],0,
                         'A neighbor inside the bounding rectangle is not owned source paint')

    def test_component_registration_rejects_a_stale_or_ambiguous_bound(self):
        source=Image.new('RGBA',(64,64));ImageDraw.Draw(source).rectangle((10,10,30,50),fill='red')
        with self.assertRaisesRegex(ValueError,'component'):
            builder.isolate_source_component(source,[9,10,31,51])

    def test_all_four_actual_views_are_used_including_unmirrored_left(self):
        colors=dict(down='red',right='green',up='blue',left='yellow')
        calls=[]
        class Family:
            def motion(self,person,direction,count):
                calls.append(direction)
                return [Image.new('RGBA',(16,16),colors[direction])for _ in range(count)],[]
            def neutral(self,person,direction):
                return Image.new('RGBA',(16,16),colors[direction])
        actions=[Image.new('RGBA',(16,16),color)for color in ['black','gray','white','purple']]
        rows,_=builder.adult_rows(Family(),{},actions)
        self.assertEqual(calls,['down','right','up','left'])
        self.assertEqual([len(row)for row in rows],[8]*7)
        self.assertEqual(rows[3][0].getpixel((0,0)),(255,255,0,255))
        self.assertEqual(rows[4][3].getpixel((0,0)),(255,255,0,255))
        self.assertEqual(rows[5][2].tobytes(),actions[2].tobytes())
        self.assertEqual(rows[6][2].tobytes(),actions[3].tobytes())
        self.assertEqual(rows[5][-1].tobytes(),actions[0].tobytes())

    def test_changed_action_paint_is_rejected_before_registration(self):
        with tempfile.TemporaryDirectory() as temp:
            source=Path(temp)/'action.png';Image.new('RGBA',(16,16),'red').save(source)
            entry={'source':str(source),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
                   'scale':1,'source_pivot':[8,16],'component_bounds':[0,0,16,16]}
            family=SimpleNamespace(street=SimpleNamespace(register_source=lambda image,*args:(image,None)),BASELINE=472)
            self.assertEqual(len(builder.adult_action_keys(family,{'actions':[entry]*4})),4)
            Image.new('RGBA',(16,16),'blue').save(source)
            with self.assertRaisesRegex(ValueError,'action source'):
                builder.adult_action_keys(family,{'actions':[entry]*4})

if __name__=='__main__':unittest.main()
