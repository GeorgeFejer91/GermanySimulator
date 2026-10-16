"""Sandale source contracts with temporary public fixtures and synthetic processing."""
import ast
import copy
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile
from types import SimpleNamespace
import unittest


HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PRODUCER = ROOT / "tools/build-knick-voice.py"
FIXTURE = HERE / "fixtures/sandale-voice-source.json"


class SandaleSourceAdapter(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.directory = Path(self.temporary.name)
        self.root = self.directory / "game"
        (self.root / "For-AI").mkdir(parents=True)
        self.fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        self.cast = {
            "roleProfiles": [
                {"gameRole": binding["actorId"], "voiceId": binding["voiceId"],
                 "secretTunnelProfileId": binding["profileId"],
                 "dialogueSources": ["game.js crowdArchetypes[" + binding["archetypeId"] + "].barks[region]"],
                 "reference": {"workingReferenceSha256": binding["originalSha256"],
                               "license": binding["referenceLicense"]}}
                for binding in self.fixture["bindings"]
            ],
            "productionVoices": {
                binding["voiceId"]: {key: binding[key] for key in
                                    ("profileId", "referenceSha256", "originalSha256", "renderer",
                                     "modelRevision", "fallback", "processing")}
                for binding in self.fixture["bindings"]
            },
        }
        self.cast["productionVoices"]["crowd-baerbel-brezel"] = {
            **self.cast["productionVoices"][self.fixture["bindings"][0]["voiceId"]],
            "profileId": "c" * 32,
        }
        self.archetypes = []
        pools = {}
        for binding in self.fixture["bindings"]:
            rows = [row for row in self.fixture["slots"] if row["voiceId"] == binding["voiceId"]]
            self.archetypes.append({"id": binding["archetypeId"], "voiceId": binding["voiceId"],
                                    "barks": {region: [row["text"] for row in rows if row["region"] == region]
                                              for region in ("berlin", "germany")}})
            pools[binding["englishPool"]] = [row["english"] for row in rows if row["region"] == "germany"]
        self.write_cast()
        self.write_game()
        (self.root / "For-AI/AUDIO-TEXT-LIBRARY.js").write_text("window.GermanySimulatorAudioText=" + json.dumps({"pools": pools}) + ";\n", encoding="utf-8")
        source = PRODUCER.read_text(encoding="utf-8")
        tree = ast.parse(source)
        functions = {"read", "sha", "write", "source_hashes", "configure_request", "sandale_dialogue_sources",
                     "validate_sandale_request", "validate_crowd_request", "jobs", "execute"}
        nodes = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name in functions
                 or isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id in {"SANDALE_SOURCE_SCOPE", "SANDALE_OWNERS"} for target in node.targets)]
        self.namespace = {"ROOT": self.root, "Path": Path, "json": json, "re": re, "subprocess": subprocess,
                          "hashlib": hashlib, "os": SimpleNamespace(name="source-test"), "REUSE_EVIDENCE": [],
                          "AUTHORING_HELPER_SHA256": hashlib.sha256(PRODUCER.read_bytes()).hexdigest()}
        exec(compile(ast.Module(body=nodes, type_ignores=[]), str(PRODUCER), "exec"), self.namespace)
        self.voice = "tourist-guenther-liegestuhl"
        self.authored = self.namespace["sandale_dialogue_sources"]()
        self.assertEqual(self.authored, self.fixture["slots"])
        self.request = {"family": "crowd-dialogue", "sourceScope": "sandale-roles-v1",
                        "authoringHelperSha256": self.namespace["AUTHORING_HELPER_SHA256"],
                        "publicAssetFamily": "assets/voices/candidate-dialogue",
                        "privateReviewFamily": "GermanySimulator crowd dialogue review 2026-10-15",
                        "sourceSha256": {name: self.namespace["sha"](self.root / name) for name in ("game.js", "For-AI/VOICE-CAST.json", "For-AI/AUDIO-TEXT-LIBRARY.js")},
                        "jobs": self.authored}
        self.request_path = self.directory / "authored.json"
        self.save_request()

    def write_game(self):
        (self.root / "game.js").write_text("const crowdArchetypes=Object.freeze(" + json.dumps(self.archetypes) + ");\nconst crowdCharacterBarks=Object.freeze({});\n", encoding="utf-8")

    def write_cast(self):
        (self.root / "For-AI/VOICE-CAST.json").write_text(json.dumps(self.cast), encoding="utf-8")

    def save_request(self):
        self.request_path.write_text(json.dumps(self.request), encoding="utf-8")

    def args(self, **updates):
        options = dict(voice_id=self.voice, request_file=self.request_path, ambient=False, manifest=False, check=False,
                       retake_failed=False, follow_source=False, reconcile_source=False, sentence_rescue=False,
                       eos_after_alignment=False, benchmark_hooks=False, benchmark_asr=False, render=False,
                       process=False, plan=False, music_root=self.directory / "music", limit=None)
        options.update(updates)
        return SimpleNamespace(**options)

    def test_exact_two_roles_eight_slots_and_four_per_voice(self):
        self.assertEqual(len(self.authored), 8)
        self.assertEqual({row["actorId"] for row in self.authored}, {"herr-sandale", "frau-sandale"})
        self.assertEqual(self.authored[3]["text"], "Bitte Abstand halten: Das Handtuch befindet sich im Vorverfahren.")
        self.assertEqual(self.authored[3]["sourceLocator"], "game.js crowdArchetypes[id=towel-man].barks.germany[1]")
        for voice in (self.voice, "touristin-walburga-handtuch"):
            self.namespace["configure_request"](self.args(voice_id=voice))
            selected = self.namespace["jobs"]()
            self.assertEqual(len(selected), 4)
            self.assertEqual({row["voiceId"] for row in selected}, {voice})

    def test_rejects_changed_text_binding_owner_and_missing_or_duplicate_slots(self):
        for field, value in (("text", "changed"), ("english", "changed"), ("actorId", self.voice),
                             ("profileId", "wrong-profile"), ("referenceSha256", "wrong-reference"),
                             ("sourceLocator", "game.js crowdCharacterBarks[borrowed].germany[0]")):
            with self.subTest(field=field):
                requested = copy.deepcopy(self.authored)
                requested[0][field] = value
                with self.assertRaises(AssertionError):
                    self.namespace["validate_sandale_request"](requested, self.authored, self.voice)
        for requested in (self.authored[:-1], self.authored + [self.authored[0]], [self.authored[0]] * 8):
            with self.assertRaises(AssertionError):
                self.namespace["validate_sandale_request"](requested, self.authored, self.voice)

    def test_rejects_borrowed_live_role_or_archetype_voice(self):
        owner = next(row for row in self.cast["roleProfiles"] if row.get("gameRole") == "herr-sandale")
        owner["voiceId"] = "crowd-guenther-gartenzaun"
        self.write_cast()
        with self.assertRaises(AssertionError):
            self.namespace["sandale_dialogue_sources"]()
        owner["voiceId"] = self.voice
        self.write_cast()
        self.archetypes[0]["voiceId"] = "crowd-guenther-gartenzaun"
        self.write_game()
        with self.assertRaises(AssertionError):
            self.namespace["sandale_dialogue_sources"]()

    def test_sandale_does_not_enter_unscoped_named_crowd_or_old_full36(self):
        self.request.pop("sourceScope")
        self.save_request()
        with self.assertRaises(AssertionError):
            self.namespace["configure_request"](self.args())
        with self.assertRaises(AssertionError):
            self.namespace["validate_crowd_request"](self.authored, self.authored, self.voice)
        self.namespace["configure_request"](self.args(voice_id="crowd-baerbel-brezel"))
        self.assertEqual(self.namespace["VOICE"], "crowd-baerbel-brezel")

    def test_scope_helper_and_direct_public_or_retake_modes_fail_closed(self):
        for field, value in (("sourceScope", "first9"), ("authoringHelperSha256", "0" * 64)):
            original = self.request[field]
            self.request[field] = value
            self.save_request()
            with self.assertRaises(AssertionError):
                self.namespace["configure_request"](self.args())
            self.request[field] = original
        self.save_request()
        for mode in ("manifest", "check", "retake_failed", "follow_source", "reconcile_source", "sentence_rescue", "eos_after_alignment", "benchmark_hooks"):
            with self.subTest(mode=mode), self.assertRaises(AssertionError):
                self.namespace["configure_request"](self.args(**{mode: True}))
        with self.assertRaises(AssertionError):
            self.namespace["configure_request"](self.args(voice_id="crowd-baerbel-brezel"))

    def test_freeze_scope_is_immutable_and_processing_stays_private(self):
        self.namespace["execute"](self.args(plan=True))
        private = self.directory / "music/GermanySimulator crowd dialogue review 2026-10-15" / self.voice
        request_path = private / "requests.json"
        frozen = json.loads(request_path.read_text(encoding="utf-8"))
        self.assertEqual(frozen["sourceScope"], "sandale-roles-v1")
        self.assertEqual(len(frozen["jobs"]), 4)
        preserved = (json.dumps(frozen, sort_keys=True, indent=4) + "\n").encode("utf-8")
        request_path.write_bytes(preserved)
        self.namespace["execute"](self.args(plan=True))
        self.assertEqual(request_path.read_bytes(), preserved)
        observed = []
        self.namespace["process"] = lambda *args, **kwargs: observed.append(kwargs["publish_manifest"])
        self.namespace["execute"](self.args(process=True))
        self.assertEqual(observed, [False])
        for change in (lambda row: row.pop("sourceScope"), lambda row: row.update(authoredPlanSha256="0" * 64)):
            invalid = copy.deepcopy(frozen)
            change(invalid)
            request_path.write_text(json.dumps(invalid), encoding="utf-8")
            with self.assertRaises(AssertionError):
                self.namespace["execute"](self.args(process=True))
            with self.assertRaises(AssertionError):
                self.namespace["execute"](self.args(plan=True))
        self.assertEqual(observed, [False])


if __name__ == "__main__":
    unittest.main()
