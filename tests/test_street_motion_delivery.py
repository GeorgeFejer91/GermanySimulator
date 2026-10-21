"""Exact-pixel derivative delivery; no game/runtime or source-atlas mutation."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('motion_delivery', ROOT / 'tools/build-street-motion-delivery.py')
delivery = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(delivery)


class MotionDeliveryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.family = self.root / 'assets/characters/street-speakers/example'
        self.family.mkdir(parents=True)
        self.out = self.family / 'delivery'
        self.manifest = self.root / 'manifest.json'
        variants = {}
        for name, size in [('desktop', (4, 6)), ('mobile', (2, 3))]:
            image = Image.new('RGBA', (size[0] * 4, size[1] * 6))
            # Different pixel patterns, including RGB under fully transparent alpha.
            image.putdata([((x * 19) % 256, (y * 37) % 256, (x + y * 7) % 256,
                            [0, 71, 255][(x + y) % 3])
                           for y in range(image.height) for x in range(image.width)])
            path = self.family / (name + '.webp')
            image.save(path, 'WEBP', lossless=True, exact=True, method=6)
            variants[name] = {'file': './' + path.relative_to(self.root).as_posix(),
                              'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                              'width': image.width, 'height': image.height}
        walks = {d: {'row': i, 'frames': 2, 'frame_ms': 60}
                 for i, d in enumerate(('down', 'right', 'up', 'left'))}
        self.person = {'id': 'example', 'cell': [4, 6], 'grid': [4, 6], 'variants': variants,
                       'clips': {d: {'offset': i * 4, 'count': 2} for i, d in enumerate(walks)},
                       'atlasMotion': {'schemaVersion': 1, 'walks': walks,
                           'bridges': {d: {'row': 4, 'stop_cols': [0, 1], 'start_cols': [2],
                                          'frame_ms': 45} for d in walks},
                           'transitions': {'down-to-right': {'frames': [{'row': 4, 'col': 2, 'ms': 45}]}},
                           'settles': {'down': {'1': {'frames': [{'row': 4, 'col': 3, 'ms': 40},
                                                                          {'row': 4, 'col': 1, 'ms': 40}]}}},
                           'neutral': {'row': 4, 'col': 1},
                           'interactions': {'neutral': {'row': 4, 'col': 1}, 'states': {
                               'review': {'row': 5, 'col': 0, 'durations_ms': [80, 90, 100]},
                               'work': {'row': 5, 'col': 0, 'durations_ms': [80, 90, 100]}}}}}
        self.person['clips']['idle'] = {'offset': 17, 'count': 1}
        self.write_manifest()

    def write_manifest(self):
        self.manifest.write_text(json.dumps({'schemaVersion': 1, 'characters': {'voice-example': self.person}}))

    def run_build(self, check=False):
        return delivery.run(self.manifest, 'voice-example', self.out, check=check, root=self.root)

    def test_exact_cells_invertible_mapping_aliases_and_null_padding(self):
        source_bytes = {v: (self.root / a['file'][2:]).read_bytes() for v, a in self.person['variants'].items()}
        record = self.run_build()
        expected = {'movement': [0, 1, 4, 5, 8, 9, 12, 13, 16, 17, 18, 19], 'reactions': [20, 21, 22]}
        for kind, slots in expected.items():
            pack = record['packs'][kind]
            self.assertEqual(pack['grid'], [16, 1])
            self.assertEqual(pack['slots'], slots + [None] * (16 - len(slots)))
            self.assertEqual(len(set(s for s in pack['slots'] if s is not None)), len(slots))
            for variant, atlas in pack['variants'].items():
                cell = record['sources'][variant]['cell']
                source = Image.open(self.root / self.person['variants'][variant]['file'][2:]).convert('RGBA')
                packed = Image.open(self.root / atlas['file'][2:]).convert('RGBA')
                self.assertEqual(atlas['decodedBytes'], packed.width * packed.height * 4)
                self.assertEqual(hashlib.sha256(packed.tobytes()).hexdigest(), atlas['rgba_sha256'])
                for physical, logical in enumerate(pack['slots']):
                    crop = packed.crop((physical * cell[0], 0, (physical + 1) * cell[0], cell[1]))
                    if logical is None:
                        self.assertEqual(crop.tobytes(), bytes(cell[0] * cell[1] * 4))
                    else:
                        x, y = logical % 4 * cell[0], logical // 4 * cell[1]
                        self.assertEqual(crop.tobytes(), source.crop((x, y, x + cell[0], y + cell[1])).tobytes())
        for variant, raw in source_bytes.items():
            self.assertEqual((self.root / self.person['variants'][variant]['file'][2:]).read_bytes(), raw)
        self.assertEqual(self.run_build(check=True), record)
        self.assertEqual(json.loads((self.out / 'motion-delivery.json').read_text()), record)

    def test_check_reproduces_bytes_and_detects_tampered_derivative_and_receipt(self):
        self.run_build()
        atlas = self.out / 'movement-desktop.webp'
        atlas.write_bytes(atlas.read_bytes() + b'tamper')
        with self.assertRaisesRegex(ValueError, 'delivery bytes'):
            self.run_build(check=True)
        self.run_build()
        receipt = self.out / 'motion-delivery.json'
        data = json.loads(receipt.read_text())
        data['packs']['movement']['slots'][0] = 3
        receipt.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, 'receipt'):
            self.run_build(check=True)

    def test_check_rejects_changed_authority_even_with_existing_good_delivery(self):
        self.run_build()
        source = self.root / self.person['variants']['desktop']['file'][2:]
        source.write_bytes(source.read_bytes() + b'changed-source')
        with self.assertRaisesRegex(ValueError, 'source hash'):
            self.run_build(check=True)

    def test_full_definition_pin_rejects_non_pixel_changes_and_excludes_only_capability(self):
        record = self.run_build()
        changes = [('mouthPaint', {'standing': None}), ('strideDistance', 21),
                   ('pivot', [1, 2]), ('id', 'changed-identity')]
        for key, value in changes:
            with self.subTest(key=key):
                original = copy.deepcopy(self.person)
                self.person[key] = value
                self.write_manifest()
                with self.assertRaisesRegex(ValueError, 'receipt'):
                    self.run_build(check=True)
                self.person = original
        self.person['motionDelivery'] = {'file': './assets/characters/street-speakers/example/delivery/motion-delivery.json', 'sha256': 'a' * 64}
        self.write_manifest()
        self.assertEqual(self.run_build(check=True), record)

    def test_dense_pack_crosses_row_boundary_without_changing_source_cells(self):
        for direction in ('down', 'right', 'up', 'left'):
            self.person['atlasMotion']['walks'][direction]['frames'] = 4
            self.person['clips'][direction]['count'] = 4
        self.write_manifest()
        record = self.run_build()
        pack = record['packs']['movement']
        self.assertEqual(pack['grid'], [16, 2])
        self.assertEqual(pack['slots'], list(range(20)) + [None] * 12)
        source = Image.open(self.family / 'desktop.webp').convert('RGBA')
        packed = Image.open(self.out / 'movement-desktop.webp').convert('RGBA')
        self.assertEqual(packed.crop((0, 6, 16, 12)).tobytes(), source.crop((0, 24, 16, 30)).tobytes())
        self.assertEqual(packed.crop((16, 6, 64, 12)).tobytes(), bytes(48 * 6 * 4))

    def test_explicit_21_column_pack_keeps_every_cell_across_the_new_row_boundary(self):
        for direction in ('down', 'right', 'up', 'left'):
            self.person['atlasMotion']['walks'][direction]['frames'] = 4
            self.person['clips'][direction]['count'] = 4
        self.person['atlasMotion']['turns'] = {'rows': [5], 'pose_count': 4}
        self.write_manifest()
        record = delivery.run(self.manifest, 'voice-example', self.out, root=self.root, columns=21)
        pack = record['packs']['movement']
        self.assertEqual(pack['grid'], [21, 2])
        self.assertEqual(pack['slots'], list(range(24)) + [None] * 18)
        for variant, atlas in pack['variants'].items():
            w, h = record['sources'][variant]['cell']
            source = Image.open(self.root / self.person['variants'][variant]['file'][2:]).convert('RGBA')
            packed = Image.open(self.root / atlas['file'][2:]).convert('RGBA')
            self.assertEqual(packed.size, (21 * w, 2 * h))
            for physical, logical in enumerate(pack['slots']):
                x, y = (physical % 21) * w, (physical // 21) * h
                actual = packed.crop((x, y, x+w, y+h)).tobytes()
                if logical is None:
                    self.assertEqual(actual, bytes(w*h*4))
                else:
                    sx, sy = (logical % 4) * w, (logical // 4) * h
                    self.assertEqual(actual, source.crop((sx, sy, sx+w, sy+h)).tobytes())
        self.assertEqual(delivery.run(self.manifest, 'voice-example', self.out, check=True,
                                     root=self.root, columns=21), record)
        with self.assertRaisesRegex(ValueError, 'delivery bytes|receipt'):
            self.run_build(check=True)

    def test_invalid_pack_columns_do_not_create_delivery(self):
        for columns in [True, 0, -1, 65, 2.5, '21']:
            with self.subTest(columns=columns), self.assertRaisesRegex(ValueError, 'pack columns'):
                delivery.run(self.manifest, 'voice-example', self.out, root=self.root, columns=columns)
            self.assertFalse(self.out.exists())

    def test_requested_layout_cannot_exceed_texture_extent(self):
        path = self.family / 'desktop.webp'
        image = Image.new('RGBA', (1024, 2304), (40, 60, 80, 255))
        image.save(path, 'WEBP', lossless=True, exact=True, method=4)
        self.person['variants']['desktop'].update(width=1024, height=2304,
            sha256=hashlib.sha256(path.read_bytes()).hexdigest())
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, '4096 texture extent'):
            delivery.run(self.manifest, 'voice-example', self.out, root=self.root, columns=21)
        self.assertFalse(self.out.exists())

    def test_rejects_stale_source_hash_and_wrong_dimensions_without_outputs(self):
        for key, value, message in [('sha256', '0' * 64, 'source hash'), ('width', 15, 'dimensions')]:
            with self.subTest(key=key):
                original = copy.deepcopy(self.person)
                self.person['variants']['desktop'][key] = value
                self.write_manifest()
                with self.assertRaisesRegex(ValueError, message):
                    self.run_build()
                self.assertFalse(self.out.exists())
                self.person = original

    def test_rejects_bad_references_in_every_reference_family(self):
        mutators = [
            lambda p: p['atlasMotion']['walks']['down'].update(frames=5),
            lambda p: p['atlasMotion']['bridges']['down'].update(stop_cols=[-1]),
            lambda p: p['atlasMotion']['transitions']['down-to-right']['frames'][0].update(row=6),
            lambda p: p['atlasMotion']['neutral'].update(col=True),
            lambda p: p['atlasMotion']['settles']['down']['1']['frames'][0].update(col=4),
            lambda p: p['atlasMotion']['interactions']['states']['work'].update(col=3),
            lambda p: p['clips']['idle'].update(offset=24),
            lambda p: p['atlasMotion']['interactions']['states']['work'].update(durations_ms=[]),
            lambda p: p['atlasMotion'].update(unknownCellOwner={'row': 5, 'col': 3}),
        ]
        for mutate in mutators:
            with self.subTest(mutate=mutate):
                original = copy.deepcopy(self.person)
                mutate(self.person)
                self.write_manifest()
                with self.assertRaises(ValueError):
                    self.run_build()
                self.assertFalse(self.out.exists())
                self.person = original

    def test_additional_turn_and_speech_references_are_not_silently_dropped(self):
        self.person['atlasMotion']['turns'] = {'rows': [4], 'pose_count': 4}
        self.person['speech'] = {'clips': {'talk': {'offset': 23, 'count': 1}}}
        self.write_manifest()
        record = self.run_build()
        self.assertIn(23, record['packs']['reactions']['slots'])
        self.assertEqual(record['packs']['movement']['slots'][:12], [0, 1, 4, 5, 8, 9, 12, 13, 16, 17, 18, 19])

    def test_rejects_external_traversal_output_and_source_paths(self):
        for out in [self.root / 'output', self.root / 'assets/characters/residents/other/delivery', self.family]:
            with self.subTest(out=out), self.assertRaisesRegex(ValueError, 'output directory'):
                delivery.run(self.manifest, 'voice-example', out, root=self.root)
        for path in ['https://example.invalid/desktop.webp', './assets/characters/street-speakers/example/../desktop.webp']:
            with self.subTest(path=path):
                self.person['variants']['desktop']['file'] = path
                self.write_manifest()
                with self.assertRaisesRegex(ValueError, 'source path'):
                    self.run_build()


if __name__ == '__main__':
    unittest.main()
