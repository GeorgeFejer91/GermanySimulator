"""Pure resolver tests; deliberately do not import the producer module."""
import ast
import copy
import json
from pathlib import Path
import re
import unittest

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
UNKNOWN = "unknown; selected profile does not record reference license"


def resolver(source_name, cast, binding, voice, profile, reference_hash):
    source = ROOT / "tools" / source_name if source_name == "build-knick-voice.py" else HERE / "fixtures" / source_name
    tree = ast.parse(source.read_text(encoding="utf-8-sig"))
    function = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == "reference_license")
    namespace = {"ROOT": Path("source-fixture"), "read": lambda path: cast, "BINDING": binding,
                 "VOICE": voice, "PROFILE": profile, "REFERENCE_HASH": reference_hash, "re": re}
    exec(compile(ast.Module(body=[function], type_ignores=[]), source_name, "exec"), namespace)
    return namespace["reference_license"]


class ReferenceLicenseTests(unittest.TestCase):
    def setUp(self):
        self.voice = "stadt-ursula-neumann"
        current = json.loads((ROOT / "For-AI/VOICE-CAST.json").read_text(encoding="utf-8"))
        self.cast = {"characters": [copy.deepcopy(next(owner for owner in current["characters"]
                                                     if owner["voiceId"] == self.voice))],
                     "productionVoices": {self.voice: copy.deepcopy(current["productionVoices"][self.voice])},
                     "roleProfiles": []}
        self.binding = copy.deepcopy(self.cast["productionVoices"][self.voice])
        self.profile = self.binding["profileId"]
        self.normalized = self.binding["referenceSha256"]
        self.record = {"id": self.profile, "original_sha256": self.binding["originalSha256"],
                       "reference_sha256": self.normalized}

    def resolve(self, record=None):
        return resolver("build-knick-voice.py", self.cast, self.binding, self.voice,
                        self.profile, self.normalized)(self.record if record is None else record)

    def test_current_city_cc0_for_native_and_manifest_callers(self):
        self.assertEqual(self.resolve(), "CC0-1.0")
        self.assertEqual(self.resolve({}), "CC0-1.0")
        self.record.pop("id")
        self.assertEqual(self.resolve(), "CC0-1.0")

    def test_all_current_city_cc0_owners_resolve_their_selected_reference(self):
        current = json.loads((ROOT / "For-AI/VOICE-CAST.json").read_text(encoding="utf-8"))
        owners = [owner for owner in current["characters"]
                  if owner.get("voiceId", "").startswith("stadt-")
                  and owner.get("reference", {}).get("releaseLicense") == "CC0-1.0"]
        self.assertGreater(len(owners), 1)
        for owner in owners:
            with self.subTest(voice=owner["voiceId"]):
                voice = owner["voiceId"]
                binding = current["productionVoices"][voice]
                record = {"id": binding["profileId"], "original_sha256": binding["originalSha256"],
                          "reference_sha256": binding["referenceSha256"]}
                actual = resolver("build-knick-voice.py", current, binding, voice,
                                  binding["profileId"], binding["referenceSha256"])
                self.assertEqual(actual(record), "CC0-1.0")
                self.assertEqual(actual({}), "CC0-1.0")

    def test_unrelated_ambiguous_or_wrong_owner_cannot_lend_cc0(self):
        original = copy.deepcopy(self.cast)
        for mutation in ("other-voice", "duplicate", "wrong-actor", "wrong-profile", "missing-owner"):
            with self.subTest(mutation=mutation):
                self.cast = copy.deepcopy(original)
                owner = self.cast["characters"][0]
                if mutation == "other-voice":
                    owner["voiceId"] = "stadt-someone-else"
                elif mutation == "duplicate":
                    self.cast["characters"].append(copy.deepcopy(owner))
                elif mutation == "wrong-actor":
                    owner["gameCharacterId"] = "city-someone-else"
                elif mutation == "wrong-profile":
                    owner["secretTunnel"]["profileId"] = "unrelated-profile"
                else:
                    self.cast["characters"] = []
                self.binding["referenceLicense"] = "CC0-1.0"
                self.assertEqual(self.resolve(), UNKNOWN)

    def test_every_selected_profile_and_reference_identity_must_match(self):
        for location, field, value in (
                ("selected", "profileId", "other"), ("binding", "profileId", "other"),
                ("selected", "originalSha256", "a" * 64), ("binding", "originalSha256", "a" * 64),
                ("selected", "referenceSha256", "b" * 64), ("binding", "referenceSha256", "b" * 64),
                ("reference", "workingReferenceSha256", "c" * 64),
                ("binding", "originalSha256", ""), ("binding", "referenceSha256", "not-a-hash")):
            with self.subTest(location=location, field=field):
                self.setUp()
                target = {"selected": self.cast["productionVoices"][self.voice], "binding": self.binding,
                          "reference": self.cast["characters"][0]["reference"]}[location]
                target[field] = value
                self.assertEqual(self.resolve({}), UNKNOWN)
        self.setUp()
        self.normalized = "d" * 64
        self.assertEqual(self.resolve({}), UNKNOWN)

    def test_supplied_native_record_must_have_both_correct_hashes_and_own_id(self):
        for field, value in (("id", "someone-else"), ("original_sha256", "a" * 64),
                             ("reference_sha256", "b" * 64), ("original_sha256", None),
                             ("reference_sha256", None)):
            with self.subTest(field=field, value=value):
                record = copy.deepcopy(self.record)
                if value is None:
                    record.pop(field)
                else:
                    record[field] = value
                self.assertEqual(self.resolve(record), UNKNOWN)

    def test_city_license_must_be_explicit_cc0_even_with_loose_legacy_fallbacks(self):
        for declaration in (None, "", "unknown", "free", "public domain", "CC-BY-4.0"):
            with self.subTest(declaration=declaration):
                self.cast["characters"][0]["reference"]["releaseLicense"] = declaration
                self.binding["referenceLicense"] = "CC0-1.0"
                self.record["license"] = "CC0-1.0"
                self.assertEqual(self.resolve(), UNKNOWN)

    def test_conflicting_binding_or_profile_declarations_remain_unknown(self):
        for location, field in (("binding", "referenceLicense"), ("selected", "referenceLicense"),
                                ("record", "reference_license"), ("record", "license")):
            for declaration in ("CC-BY-4.0", "free", "unknown"):
                with self.subTest(location=location, field=field, declaration=declaration):
                    self.setUp()
                    target = {"binding": self.binding, "selected": self.cast["productionVoices"][self.voice],
                              "record": self.record}[location]
                    target[field] = declaration
                    self.assertEqual(self.resolve(), UNKNOWN)
        self.setUp()
        self.record["reference_license"] = "CC0-1.0"
        self.assertEqual(self.resolve(), "CC0-1.0")

    def test_noncity_results_equal_the_frozen_legacy_function(self):
        for scenario in ("role", "role-profile-mismatch", "role-hash-mismatch", "binding", "profile", "license", "knick", "unknown"):
            with self.subTest(scenario=scenario):
                voice = "amt-brunhilde-knick" if scenario == "knick" else "another-voice"
                binding = {"originalSha256": "a" * 64}
                cast = {"roleProfiles": []}
                record = {}
                if scenario.startswith("role"):
                    cast["roleProfiles"] = [{"voiceId": voice, "secretTunnelProfileId": "selected",
                                             "reference": {"workingReferenceSha256": "a" * 64, "license": "CC-BY-4.0"}}]
                    if scenario == "role-profile-mismatch":
                        cast["roleProfiles"][0]["secretTunnelProfileId"] = "other"
                    elif scenario == "role-hash-mismatch":
                        cast["roleProfiles"][0]["reference"]["workingReferenceSha256"] = "b" * 64
                elif scenario == "binding":
                    binding["referenceLicense"] = "binding-licence"
                elif scenario == "profile":
                    record["reference_license"] = "profile-licence"
                elif scenario == "license":
                    record["license"] = "legacy-licence"
                arguments = (cast, binding, voice, "selected", "b" * 64)
                actual = resolver("build-knick-voice.py", *arguments)(record)
                expected = resolver("before-reference-license.py", *arguments)(record)
                self.assertEqual(actual, expected)
                if scenario == "role":
                    self.assertEqual(actual, "CC-BY-4.0")

    def test_lookup_does_not_mutate_cast_binding_or_profile_receipts(self):
        before = copy.deepcopy((self.cast, self.binding, self.record))
        self.assertEqual(self.resolve(), "CC0-1.0")
        self.assertEqual((self.cast, self.binding, self.record), before)


if __name__ == "__main__":
    unittest.main()
