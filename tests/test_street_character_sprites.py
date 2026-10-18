import importlib.util
from pathlib import Path
import json
import unittest

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
module_spec = importlib.util.spec_from_file_location('street_builder', ROOT / 'tools/build-street-character-sprites.py')
builder = importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(builder)


class StreetCharacterSpriteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.spec = json.loads(builder.SPEC.read_text(encoding='utf8'))
        cls.person = cls.spec['characters']['hartmut-keller']
        cls.source = Image.open(ROOT / cls.person['source']).convert('RGBA')
        cls.scale = cls.spec['working']['figureHeight']/cls.person['sourceFigureHeight']
        cls.neutral, cls.origin = builder.register_source(cls.source, cls.person['views']['down'], cls.scale, 480)

    def test_complete_components_match_the_uneven_source_poses(self):
        self.assertEqual(sorted(builder.source_components(self.source)), sorted(view['component_bounds'] for view in self.person['views'].values()))
        widths = [view['component_bounds'][2]-view['component_bounds'][0] for view in self.person['views'].values()]
        self.assertGreater(max(widths)-min(widths), 50)

    def test_every_one_shot_starts_and_lands_on_exact_neutral_paint(self):
        for name in ['greet', 'work', 'review', 'success', 'failure', 'look']:
            with self.subTest(name=name):
                frames = builder.planted_action(self.neutral, name, 16, self.person['actions'][name])
                self.assertEqual(frames[0].tobytes(), self.neutral.tobytes())
                self.assertEqual(frames[-1].tobytes(), self.neutral.tobytes())
                self.assertNotEqual(frames[7].tobytes(), self.neutral.tobytes())

    def test_planted_gestures_do_not_move_or_replace_the_shoes(self):
        for name in ['greet', 'wait', 'work', 'review', 'failure', 'look']:
            frames = builder.planted_action(self.neutral, name, 16, self.person['actions'][name])
            for frame in frames:
                self.assertEqual(frame.crop((0, 400, 512, 512)).tobytes(), self.neutral.crop((0, 400, 512, 512)).tobytes(), name)

    def test_success_lifts_both_complete_shoes_and_returns_to_the_shared_baseline(self):
        frames = builder.planted_action(self.neutral, 'success', 16, self.person['actions']['success'])
        sole = self.neutral.getbbox()[3]
        self.assertLess(frames[7].getbbox()[3], sole-12)
        self.assertEqual(frames[-1].getbbox()[3], sole)
        for frame in frames:
            self.assertLessEqual(frame.getbbox()[3], sole)

    def test_export_geometry_keeps_uniform_family_scale_and_candidate_memory_bound(self):
        for compact in [False, True]:
            frame = builder.export_cell(self.neutral, self.spec, compact)
            self.assertEqual(frame.size, (64, 80) if compact else (128, 160))
            builder.verify_cell(frame, 'neutral', 0)
            size = (frame.width*16, frame.height*11)
            self.assertLessEqual(max(size), 2048)
            self.assertLessEqual(size[0]*size[1]*4, 16*1024*1024)
        self.assertEqual(self.person['mouth']['registration']['sourceOpeningPixels'], 6)
        self.assertIn(('talk', 7, 1), builder.planned_clips(self.person))

    def test_candidate_speech_preserves_inactive_paint_alpha_and_protected_face(self):
        profile = self.person['mouth']['candidateProfile']
        original = np.asarray(self.neutral)
        self.assertEqual(builder.speech_candidate(self.neutral, profile, 0).tobytes(), self.neutral.tobytes())
        for shape in ['open', 'round', 'spread']:
            with self.subTest(shape=shape):
                moved = np.asarray(builder.speech_candidate(self.neutral, profile, 1, shape))
                self.assertTrue(np.array_equal(moved[:, :, 3], original[:, :, 3]))
                self.assertTrue(np.array_equal(moved[:210], original[:210]))
                self.assertTrue(np.array_equal(moved[246:], original[246:]))
                self.assertFalse(np.array_equal(moved[220:245, 242:298], original[220:245, 242:298]))

    def test_approved_pilot_talk_has_exact_closed_source_and_distinct_monotonic_amplitudes(self):
        profile = self.person['mouth']['registration']
        frames = [builder.speech_candidate(self.neutral, profile, level/6) for level in range(7)]
        self.assertEqual(frames[0].tobytes(), self.neutral.tobytes())
        for compact in [False, True]:
            cells = [builder.export_cell(frame, self.spec, compact) for frame in frames]
            self.assertEqual(len({cell.tobytes() for cell in cells}), 7)
            self.assertEqual(cells[0].tobytes(), builder.export_cell(self.neutral, self.spec, compact).tobytes())
        self.assertEqual(profile['status'], 'main-source-limit-approved-for-pilot-final-encode')

    def test_common_startup_standing_is_the_exact_neutral_paint(self):
        manifest = json.loads((builder.DEST / 'candidate-manifest.json').read_text(encoding='utf8'))
        standing = manifest['characters']['quiz-hartmut-keller']['standing']
        path = ROOT / standing['file'][2:]
        self.assertEqual(builder.paint.digest(path), standing['sha256'])
        with Image.open(path) as image:
            self.assertEqual(image.size, (128, 160))
            self.assertEqual(image.convert('RGBA').tobytes(), builder.export_cell(self.neutral, self.spec).tobytes())
        self.assertEqual(standing['sourceClip'], 'idle')
        self.assertEqual(standing['sourceFrame'], 0)


if __name__ == '__main__':
    unittest.main()
