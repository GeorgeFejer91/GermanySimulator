import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRODUCER = ROOT / 'tools' / 'build-knick-voice.py'
spec = importlib.util.spec_from_file_location('crowd_producer_candidate', PRODUCER)
producer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(producer)
request = json.loads((ROOT / 'tests' / 'fixtures' / 'crowd-dialogue-source-rows.json').read_text(encoding='utf-8'))

class CrowdProducerContract(unittest.TestCase):
    def test_manifest_routes_keep_crowd_distinct_from_existing_families(self):
        original_voice, original_plan = producer.VOICE, producer.CUSTOM_PLAN
        try:
            producer.VOICE = 'crowd-baerbel-brezel'
            producer.CUSTOM_PLAN = None
            self.assertEqual(producer.manifest_name(), 'manifest.json')
            self.assertEqual(producer.manifest_name(True), 'ambient-manifest.json')
            for family, suffix in (('crowd-dialogue', '-crowd-manifest.json'),
                                   ('office-monologue', '-portrait-manifest.json'),
                                   ('office-mirror', '-mirror-manifest.json')):
                producer.CUSTOM_PLAN = {'family': family}
                self.assertEqual(producer.manifest_name(), producer.VOICE + suffix)
        finally:
            producer.VOICE, producer.CUSTOM_PLAN = original_voice, original_plan

    def test_exact_actor_profile_source_and_subtitle_rows_pass(self):
        authored = [dict(row) for row in request['jobs']]
        selected = producer.validate_crowd_request(request['jobs'], authored, 'crowd-baerbel-brezel')
        self.assertEqual(len(selected), 4)
        self.assertTrue(all(row['voiceId'] == 'crowd-baerbel-brezel' for row in selected))

    def test_actor_profile_source_and_english_drift_fail(self):
        authored = [dict(row) for row in request['jobs']]
        for field in ('actorId', 'profileId', 'sourceLocator', 'english'):
            with self.subTest(field=field):
                changed = [dict(row) for row in request['jobs']]
                changed[0][field] += '-drift'
                with self.assertRaises(AssertionError):
                    producer.validate_crowd_request(changed, authored, 'crowd-baerbel-brezel')

    def make_manifest(self, accepted=False):
        requested = [dict(row) for row in request['jobs'] if row['voiceId'] == 'crowd-baerbel-brezel']
        rows = [dict(row, **({'reason': 'held privately'} if not accepted else {})) for row in requested]
        return requested, {
            'voiceId': 'crowd-baerbel-brezel',
            'profileId': requested[0]['profileId'],
            'requestedLineCount': 4,
            'generatedLineCount': 4 if accepted else 0,
            'lineCount': 4 if accepted else 0,
            'clips': rows if accepted else [],
            'heldPrivate': [] if accepted else rows,
        }

    def test_manifest_accepts_four_exact_held_slots_and_four_exact_acceptances(self):
        for accepted in (False, True):
            with self.subTest(accepted=accepted):
                requested, document = self.make_manifest(accepted)
                producer.validate_crowd_manifest(document, requested, 'crowd-baerbel-brezel')

    def test_manifest_rejects_duplicate_or_wrongly_owned_held_slots(self):
        requested, document = self.make_manifest()
        first = document['heldPrivate'][0]
        document['heldPrivate'] = [dict(first) for _ in range(4)]
        with self.assertRaises(AssertionError):
            producer.validate_crowd_manifest(document, requested, 'crowd-baerbel-brezel')

        requested, document = self.make_manifest()
        document['heldPrivate'][0]['slot'] = 1
        with self.assertRaises(AssertionError):
            producer.validate_crowd_manifest(document, requested, 'crowd-baerbel-brezel')

    def test_manifest_rejects_foreign_accepted_profile_or_source_identity(self):
        requested, document = self.make_manifest(accepted=True)
        document['clips'][0]['profileId'] = 'foreign-profile'
        with self.assertRaises(AssertionError):
            producer.validate_crowd_manifest(document, requested, 'crowd-baerbel-brezel')

    def test_check_manifest_uses_complete_identity_validation_for_held_rows(self):
        requested, document = self.make_manifest()
        original_read, original_voice, original_plan = producer.read, producer.VOICE, producer.CUSTOM_PLAN
        try:
            producer.read = lambda _path: document
            producer.VOICE = 'crowd-baerbel-brezel'
            producer.CUSTOM_PLAN = {'family': 'crowd-dialogue'}
            producer.check_manifest(requested)
            document['heldPrivate'][0]['actorId'] = 'foreign-actor'
            with self.assertRaises(AssertionError):
                producer.check_manifest(requested)
        finally:
            producer.read, producer.VOICE, producer.CUSTOM_PLAN = original_read, original_voice, original_plan

        requested, document = self.make_manifest(accepted=True)
        document['clips'][0]['sourceLocator'] = 'other-actor-source'
        with self.assertRaises(AssertionError):
            producer.validate_crowd_manifest(document, requested, 'crowd-baerbel-brezel')

if __name__ == '__main__':
    unittest.main()
