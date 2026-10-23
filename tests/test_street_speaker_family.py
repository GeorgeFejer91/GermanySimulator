"""Behavioral coverage for family neutral/bridge ownership and geometry."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
WRAPPER = ROOT / 'tools/build-street-speaker-family.py'


def load(path, name):
    definition = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(definition)
    definition.loader.exec_module(module)
    return module


class SpeakerFamilyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        folder = Path(self.temp.name)
        self.image = Image.new('RGBA', (512, 512))
        draw = ImageDraw.Draw(self.image)
        draw.rectangle((220, 120, 290, 390), fill='#a07143')
        draw.rectangle((225, 380, 245, 465), fill='#70452d')
        draw.rectangle((265, 380, 285, 465), fill='#70452d')
        draw.rectangle((215, 450, 250, 472), fill='#44261b')
        draw.rectangle((260, 450, 295, 472), fill='#44261b')
        source = folder / 'source.png'
        self.image.save(source)
        view = {'component_bounds': [210, 110, 301, 474], 'source_pivot': [256, 472],
                'landmarks': {'waist': 300, 'hip': 350, 'hem': [390, 390],
                    'knee': [420, 420], 'sock': [447, 447], 'ankle': [450, 450],
                    'mid': 256, 'centres': [235, 275], 'split_path_xy': [[256, 350], [256, 473]],
                    'auto_hand_mask': False, 'step_width': 12, 'root_overlap': 2,
                    'depth_amplitude': 9, 'depth_knee_follow': .75},
                'foreground': 1, 'protected_polygons': [],
                'originalUpper': {'component_bounds': [210, 110, 301, 474],
                    'source_pivot': [256, 472], 'cutSourceY': 390, 'protected_polygons': []},
                'plantedTransition': 'fade-to-source'}
        self.person = {'source': str(source), 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                       'scale': 1, 'figureWorldHeight': 1.6, 'views': {'down': view}}
        self.spec = {'working': {'figureHeight': 400, 'baseline': 472}, 'cell': [128, 160],
                     'pivot': [64, 148], 'figureHeight': 136, 'characters': {'fixture': self.person}}
        self.spec_path = folder / 'motion-spec.json'
        self.spec_path.write_text(json.dumps(self.spec))
        self.family = load(WRAPPER, 'speaker_family') if WRAPPER.exists() else None
        if self.family:
            self.builder, _ = self.family.configure(self.spec_path)
        else:
            self.builder = load(ROOT / 'tools/build-resident-motion.py', 'legacy_family')

    def test_depth_neutral_returns_intact_source_with_both_feet_planted(self):
        neutral = self.builder.neutral(self.person, 'down')
        self.assertEqual(neutral.tobytes(), self.image.tobytes(),
                         'Nominal neutral must release forward/back gait depth, not hold pi/2')

    def test_depth_bridge_has_exact_neutral_and_nonzero_exit_entry_motion(self):
        frames = self.builder.bridge_frames(self.person, 'down')
        self.assertEqual(len(frames), 5)
        self.assertEqual(frames[2].tobytes(), self.image.tobytes(),
                         'Both stop and turn must share the exact planted source')
        self.assertNotEqual(frames[0].tobytes(), frames[2].tobytes())
        self.assertNotEqual(frames[4].tobytes(), frames[2].tobytes())

    def test_upright_billboard_floor_keeps_loaded_shoes_above_ground(self):
        original_view = copy.deepcopy(self.person['views']['down'])
        for direction in ['down', 'up']:
            view = copy.deepcopy(original_view)
            view.pop('originalUpper')
            view['plantedFloor'] = True
            self.person['views'] = {direction: view}
            frames, records = self.builder.motion(self.person, direction)
            self.assertLessEqual(max(limb['dy'][-1] for record in records
                                     for limb in record['limb_displacement']), 1e-9,
                'An upright billboard cannot put a loaded shoe below its world-ground pivot')
            for frame in frames:
                self.assertLessEqual(frame.getbbox()[3], 473,
                    'The complete source shoe must stay above the floor; no crop or per-cell fitting')
            self.assertEqual(self.builder.neutral(self.person, direction).tobytes(), self.image.tobytes())

    def test_billboard_floor_is_opt_in_and_rejects_profile_registration(self):
        view = copy.deepcopy(self.person['views']['down'])
        view['plantedFloor'] = True
        self.person['views'] = {'right': view}
        self.spec_path.write_text(json.dumps(self.spec))
        with self.assertRaisesRegex(ValueError, 'vertical'):
            self.family.configure(self.spec_path)


    def test_world_height_derives_billboard_from_authored_figure_fraction(self):
        self.assertIsNotNone(self.family, 'Family geometry normalization is missing')
        geometry = self.family.world_geometry(self.spec, self.person)
        self.assertEqual(geometry['figureHeight'], 136)
        self.assertEqual(geometry['figureWorldHeight'], 1.6)
        self.assertAlmostEqual(geometry['billboardWorldHeight'], 32 / 17, places=12)
        with self.assertRaisesRegex(ValueError, 'world height'):
            self.family.world_geometry(self.spec, {**self.person, 'figureWorldHeight': 0})

    def test_export_receipts_use_git_stable_lf_bytes(self):
        output = Path(self.temp.name) / 'nested' / 'manifest.json'
        self.builder.json_write(output, {'sourceHash': 'abc', 'source': 'Söder'})
        encoded = output.read_bytes()
        self.assertNotIn(b'\r', encoded,
                         'Windows newline translation invalidates saved source/export bindings after Git normalization')
        self.assertEqual(encoded, (json.dumps({'sourceHash': 'abc', 'source': 'Söder'}, indent=2) + '\n').encode('utf8'))

    def test_standing_fallback_uses_exact_encoded_neutral_not_another_view(self):
        self.builder.DEST = Path(self.temp.name) / 'export'
        directory = self.builder.DEST / 'fixture'
        directory.mkdir(parents=True)
        atlas = Image.new('RGBA', (256,160), '#a04020')
        selected = self.image.resize((128,160), Image.Resampling.NEAREST)
        atlas.paste(selected, (128,0))
        atlas.save(directory/'test.webp', lossless=True, exact=True)
        manifest = {'frame_size':[128,160], 'interactions':{'neutral':{'row':0,'col':1}},
                    'variants':{'desktop':{'image':'test.webp'}}}
        receipt = self.family.write_standing(self.builder, manifest, 'fixture')
        output = directory/receipt['image']
        self.assertEqual(Image.open(output).convert('RGBA').tobytes(), selected.tobytes())
        self.assertEqual(receipt['sha256'], hashlib.sha256(output.read_bytes()).hexdigest())
        self.assertEqual(receipt['image_size'], [128,160])

    def test_bindings_preserve_core_builder_and_reject_changed_config(self):
        self.assertIsNotNone(self.family, 'Family source binding is missing')
        binding = self.builder.source_bindings(self.person)
        self.assertEqual(binding['builderSha256'], hashlib.sha256(
            (ROOT / 'tools/build-resident-motion.py').read_bytes()).hexdigest())
        self.assertEqual(binding['familyBuilder']['sha256'], hashlib.sha256(WRAPPER.read_bytes()).hexdigest())
        self.spec_path.write_text(self.spec_path.read_text() + ' ')
        with self.assertRaisesRegex(ValueError, 'configuration changed'):
            self.builder.source_bindings(self.person)

    def test_unknown_planted_recipe_fails_before_export(self):
        self.assertIsNotNone(self.family, 'Family transition configuration is missing')
        self.spec['characters']['fixture']['views']['down']['plantedTransition'] = 'misspelled'
        self.spec_path.write_text(json.dumps(self.spec))
        with self.assertRaisesRegex(ValueError, 'planted transition'):
            self.family.configure(self.spec_path)


    def test_metadata_normalization_replaces_resident_scale_and_check_rejects_stale_scale(self):
        manifest = {'figureWorldHeight': 2.0, 'billboardWorldHeight': 2.5,
                    'interactions': {'states': {'look': {}}}, 'limitations': []}
        self.family.apply_family_metadata(manifest, self.spec, self.person)
        self.assertEqual(manifest['figureWorldHeight'], 1.6)
        self.assertAlmostEqual(manifest['billboardWorldHeight'], 32 / 17, places=12)
        self.assertEqual(set(manifest['interactions']['states']), {'look'})
        self.family.check_geometry(manifest, self.spec, self.person)
        manifest['figureWorldHeight'] = 2.0
        with self.assertRaisesRegex(ValueError, 'geometry mismatch'):
            self.family.check_geometry(manifest, self.spec, self.person)

    def test_unconfigured_side_preserves_original_bridge_recipe(self):
        person = copy.deepcopy(self.person)
        person['views']['right'] = copy.deepcopy(person['views']['down'])
        del person['views']['right']['plantedTransition']
        legacy = load(ROOT / 'tools/build-resident-motion.py', 'original_side')
        self.assertEqual(self.builder.neutral(person, 'right').tobytes(),
                         legacy.neutral(person, 'right').tobytes())

    def test_contact_stop_retains_recentered_feet_instead_of_returning_to_split_source(self):
        view = copy.deepcopy(self.person['views']['down'])
        view.pop('originalUpper')
        view['plantedTransition'] = 'recenter-contact'
        view['landmarks']['foot_centres'] = [235, 275]
        self.person['views'] = {'right': view}
        self.spec['characters']['fixture'] = self.person
        self.spec_path.write_text(json.dumps(self.spec))
        builder, _ = self.family.configure(self.spec_path)
        neutral = builder.neutral(self.person, 'right')
        source_feet = self.image.crop((0, 450, 512, 480)).getbbox()
        planted_feet = neutral.crop((0, 450, 512, 480)).getbbox()
        self.assertLess(planted_feet[2]-planted_feet[0], source_feet[2]-source_feet[0]-20)
        self.assertEqual(planted_feet[3], source_feet[3], 'Rest shoes must remain on their ground line')
        self.assertEqual(neutral.crop((0,0,512,300)).tobytes(), self.image.crop((0,0,512,300)).tobytes())
        bridges = builder.bridge_frames(self.person, 'right')
        self.assertEqual(bridges[2].tobytes(), neutral.tobytes())
        self.assertNotEqual(bridges[0].tobytes(), neutral.tobytes())
        self.assertNotEqual(bridges[4].tobytes(), neutral.tobytes())

    def test_native_layout_keeps_walk_rows_and_all_64_phase_stops_without_overlapping_slots(self):
        layout = self.family.native_layout()
        self.assertEqual((layout['cols'],layout['rows']), (21,17))
        occupied = set()
        def claim(row,col):
            self.assertNotIn((row,col),occupied)
            self.assertTrue(0<=row<17 and 0<=col<21)
            occupied.add((row,col))
        for direction in ['down','right','up','left']:
            walk=layout['walks'][direction]
            for col in range(16):claim(walk['row'],col)
            bridge=layout['bridges'][direction]
            for col in bridge['stop_cols']+bridge['start_cols']:claim(bridge['row'],col)
            phases=layout['settles'][direction]
            self.assertEqual(set(phases),set(map(str,range(16))))
            for frames in [p['frames'] for p in phases.values()]:
                self.assertEqual(len(frames),5)
                for cell in frames[:-1]:claim(cell['row'],cell['col'])
                self.assertEqual(frames[-1],dict(row=bridge['row'],col=bridge['stop_cols'][-1],ms=70))
        for col in range(8):claim(layout['turns']['rows'][0],col)
        self.assertEqual(len(occupied),348)

    def test_phase_stop_retains_its_own_gait_sample_and_converges_to_shared_neutral(self):
        first=self.family.settle_frames(self.builder,self.person,'down',5)
        opposite=self.family.settle_frames(self.builder,self.person,'down',13)
        self.assertEqual(len(first),5)
        self.assertNotEqual(first[0].tobytes(),opposite[0].tobytes())
        neutral=self.builder.neutral(self.person,'down').tobytes()
        self.assertEqual(first[-1].tobytes(),neutral)
        self.assertEqual(opposite[-1].tobytes(),neutral)


if __name__ == '__main__':
    unittest.main()
