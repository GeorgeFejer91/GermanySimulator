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


    def test_world_height_derives_billboard_from_authored_figure_fraction(self):
        self.assertIsNotNone(self.family, 'Family geometry normalization is missing')
        geometry = self.family.world_geometry(self.spec, self.person)
        self.assertEqual(geometry['figureHeight'], 136)
        self.assertEqual(geometry['figureWorldHeight'], 1.6)
        self.assertAlmostEqual(geometry['billboardWorldHeight'], 32 / 17, places=12)
        with self.assertRaisesRegex(ValueError, 'world height'):
            self.family.world_geometry(self.spec, {**self.person, 'figureWorldHeight': 0})

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


if __name__ == '__main__':
    unittest.main()
