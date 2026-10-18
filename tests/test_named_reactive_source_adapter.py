"""Public-source contracts; Python stdlib + Node only, no model/private dependencies.

The actual maintained producer functions are AST-extracted without importing its
native authoring entry point. Audio/model boundaries are never exercised here.
"""
import ast
from collections import Counter
import copy
from contextlib import redirect_stdout
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from types import ModuleType, SimpleNamespace
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
PRODUCER = ROOT / "tools/build-knick-voice.py"
SCOPE = "named-crowd-reactive-v1"
FAMILY = "GermanySimulator crowd dialogue review 2026-10-15"
OWNERS = (
    "crowd-baerbel-brezel", "crowd-brigitte-bueroklammer", "crowd-elfriede-eingabe",
    "crowd-guenther-gartenzaun", "crowd-hildegard-brotzeit", "crowd-irmgard-aktenordner",
    "crowd-klaus-dieter-knoedel", "crowd-manfred-mittagsruhe", "crowd-ruediger-rasenkante",
)
FIELDS = {"clipId", "voiceId", "actorId", "region", "slot", "sourceLocator", "text", "english",
          "profileId", "referenceSha256", "referenceOriginalSha256", "renderer", "modelRevision", "processing", "cause"}
SOURCE_FILES = ("game.js", "For-AI/VOICE-CAST.json", "For-AI/AUDIO-TEXT-LIBRARY.js")
FUNCTIONS = {"read", "sha", "write", "source_hashes", "configure_request", "manifest_name", "manifest",
             "sandale_dialogue_sources", "validate_sandale_request", "validate_crowd_request",
             "named_reactive_dialogue_sources", "validate_named_reactive_request", "jobs", "execute",
             "process", "follow_unchanged_source"}
OLD_FUNCTIONS = {"read", "sha", "write", "source_hashes", "configure_request", "sandale_dialogue_sources",
                 "validate_sandale_request", "validate_crowd_request", "jobs", "execute"}


def frozen_js(value):
    if isinstance(value, dict):
        return "Object.freeze({" + ",".join(json.dumps(key) + ":" + frozen_js(item) for key, item in value.items()) + "})"
    if isinstance(value, list):
        return "Object.freeze([" + ",".join(frozen_js(item) for item in value) + "])"
    return json.dumps(value, ensure_ascii=False)


class NamedReactiveSourceAdapter(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.directory = Path(self.temporary.name)
        self.root = self.directory / "game"
        (self.root / "For-AI").mkdir(parents=True)
        self.voice = OWNERS[0]
        self.cast = {"roleProfiles": [], "productionVoices": {}}
        self.barks, self.legacy_barks, self.legacy_english = {}, {}, {}
        for number, actor in enumerate(OWNERS, 1):
            self.add_binding(actor, actor, number, [
                f"game.js actor-owned crowdCharacterBarks[{actor}][region]",
                f"game.js actor-owned crowdReactiveBarks[{actor}][region][cause]; grass4/road4/jaywalker6 per region",
            ])
            self.barks[actor] = {}
            self.legacy_barks[actor], self.legacy_english[actor] = {}, {}
            for region in ("berlin", "germany"):
                self.barks[actor][region] = {
                    cause: [{"id": f"{actor}-reactive-{region}-{cause}-{slot + 1:02}",
                             "text": f"Bitte {cause} beachten, {number} {region} Variante {slot + 1}.",
                             "english": f"Please heed {cause}, {number} {region} variant {slot + 1}."}
                            for slot in range(count)]
                    for cause, count in (("grass", 4), ("road", 4), ("jaywalker", 6))
                }
                self.legacy_barks[actor][region] = [f"Alte Begrüßung {number} {region} {slot}." for slot in (1, 2)]
                self.legacy_english[actor][region] = [f"Old greeting {number} {region} {slot}." for slot in (1, 2)]
        # An explicit safe ID intentionally unrelated to its current array position.
        self.barks[self.voice]["berlin"]["grass"][0]["id"] = "stable-pretzel-walkway-a"
        self.archetypes, self.towel_pools = [], {}
        for number, (actor, archetype, voice, pool) in enumerate((
            ("herr-sandale", "towel-man", "tourist-guenther-liegestuhl", "towelMan"),
            ("frau-sandale", "towel-woman", "touristin-walburga-handtuch", "towelWoman"),
        ), 20):
            self.add_binding(actor, voice, number, [f"game.js crowdArchetypes[{archetype}].barks[region]"])
            self.archetypes.append({"id": archetype, "voiceId": voice,
                                    "barks": {region: [f"Handtuch {number} {region} eins.", f"Handtuch {number} {region} zwei."]
                                              for region in ("berlin", "germany")}})
            self.towel_pools[pool] = [f"Towel {number} one.", f"Towel {number} two."]
        self.write_public()
        self.tree = ast.parse(PRODUCER.read_text(encoding="utf-8"))
        self.namespace = self.extract_functions(FUNCTIONS, {"SANDALE_SOURCE_SCOPE", "SANDALE_OWNERS", "NAMED_REACTIVE_OWNERS"})
        self.authored = self.namespace["named_reactive_dialogue_sources"]()
        self.request = {"family": "crowd-dialogue", "sourceScope": SCOPE,
                        "authoringHelperSha256": self.namespace["AUTHORING_HELPER_SHA256"],
                        "publicAssetFamily": "assets/voices/candidate-dialogue", "privateReviewFamily": FAMILY,
                        "sourceSha256": self.pins(), "jobs": copy.deepcopy(self.authored)}
        self.request_path = self.directory / "authored.json"
        self.save_request()

    def add_binding(self, actor, voice, number, index):
        binding = {"profileId": f"{number:032x}", "referenceSha256": f"{number + 100:064x}",
                   "originalSha256": f"{number + 200:064x}",
                   "renderer": "ResembleAI/Chatterbox Multilingual V2 0.1.7",
                   "modelRevision": "5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18", "processing": None, "fallback": "captions"}
        self.cast["productionVoices"][voice] = binding
        self.cast["roleProfiles"].append({"gameRole": actor, "voiceId": voice,
                                          "secretTunnelProfileId": binding["profileId"], "dialogueSources": index,
                                          "reference": {"workingReferenceSha256": binding["originalSha256"], "license": "CC0-1.0"}})

    def put(self, path, text):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8", newline="\n")

    def write_public(self, freeze_nested=True):
        reactive = frozen_js(self.barks) if freeze_nested else "Object.freeze(" + json.dumps(self.barks) + ")"
        self.put(self.root / "game.js", "const crowdArchetypes=Object.freeze(" + json.dumps(self.archetypes) + ");\n"
                 + "const crowdCharacterBarks=Object.freeze(" + json.dumps(self.legacy_barks) + ");\n"
                 + "const crowdArchetypeById={};\nconst crowdReactiveBarks=" + reactive + ";\n\nconst germannessVoice={};\n")
        self.put(self.root / "For-AI/VOICE-CAST.json", json.dumps(self.cast))
        self.put(self.root / "For-AI/VOICE-DIALOGUE-INVENTORY.json", json.dumps({"pools": {"crowdReactiveBarks": self.barks}}))
        self.put(self.root / "For-AI/AUDIO-TEXT-LIBRARY.js", "window.GermanySimulatorAudioText="
                 + json.dumps({"pools": {"crowdPersonalized": self.legacy_english, **self.towel_pools}}) + ";\n")

    def extract_functions(self, functions, constants):
        constants = constants | {"QUIZ_SOURCE_STATUS", "QUIZ_SOURCE_SCOPE"}
        nodes = [node for node in self.tree.body
                 if isinstance(node, ast.FunctionDef) and node.name in functions
                 or isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id in constants for target in node.targets)]
        self.assertEqual({node.name for node in nodes if isinstance(node, ast.FunctionDef)}, functions)
        namespace = {"ROOT": self.root, "Path": Path, "json": json, "re": re, "subprocess": subprocess,
                     "hashlib": hashlib, "os": SimpleNamespace(name="source-test"), "REUSE_EVIDENCE": [],
                     "AUTHORING_HELPER_SHA256": hashlib.sha256(PRODUCER.read_bytes()).hexdigest()}
        exec(compile(ast.Module(body=nodes, type_ignores=[]), str(PRODUCER), "exec"), namespace)
        return namespace

    def pins(self):
        return {name: hashlib.sha256((self.root / name).read_bytes()).hexdigest() for name in SOURCE_FILES}

    def save_request(self):
        self.put(self.request_path, json.dumps(self.request))

    def args(self, **updates):
        options = dict(voice_id=self.voice, request_file=self.request_path, ambient=False, manifest=False, check=False,
                       retake_failed=False, follow=False, follow_source=False, reconcile_source=False, sentence_rescue=False,
                       eos_after_alignment=False, benchmark_hooks=False, benchmark_asr=False, render=False,
                       process=False, plan=False, music_root=self.directory / "music", limit=None)
        options.update(updates)
        return SimpleNamespace(**options)

    def execute(self, namespace=None, **options):
        with redirect_stdout(io.StringIO()):
            (namespace or self.namespace)["execute"](self.args(**options))

    def private(self):
        return self.directory / "music" / FAMILY / SCOPE / self.voice

    def validate(self, rows):
        return self.namespace["validate_named_reactive_request"](rows, self.authored, self.voice)

    def test_exact_252_owned_rows_and_cause_counts(self):
        self.assertEqual(len(self.authored), 252)
        self.assertEqual(len({row["clipId"] for row in self.authored}), 252)
        self.assertEqual(set(self.namespace["NAMED_REACTIVE_OWNERS"]), set(OWNERS))
        self.assertEqual(self.authored[0]["clipId"], "stable-pretzel-walkway-a")
        for actor in OWNERS:
            selected = self.namespace["validate_named_reactive_request"](self.authored, self.authored, actor)
            self.assertEqual(len(selected), 28)
            self.assertTrue(all(set(row) == FIELDS and row["actorId"] == row["voiceId"] == actor for row in selected))
            self.assertEqual(Counter((row["region"], row["cause"]) for row in selected),
                             Counter({(region, cause): count for region in ("berlin", "germany")
                                      for cause, count in (("grass", 4), ("road", 4), ("jaywalker", 6))}))
            for row in selected:
                original = self.barks[actor][row["region"]][row["cause"]][row["slot"]]
                self.assertEqual((row["clipId"], row["text"], row["english"]), tuple(original[key] for key in ("id", "text", "english")))
                self.assertEqual(row["sourceLocator"], f"game.js crowdReactiveBarks[{actor}].{row['region']}.{row['cause']}[{row['slot']}]")

    def test_authored_order_is_deliberate_and_runtime_ids_survive_source_reordering(self):
        ordered = list(reversed(self.authored))
        self.assertEqual(self.validate(ordered), [row for row in ordered if row["voiceId"] == self.voice])
        rows = self.barks[self.voice]["berlin"]["grass"]
        rows[0], rows[1] = rows[1], rows[0]
        self.write_public()
        moved = self.namespace["named_reactive_dialogue_sources"]()
        stable = next(row for row in moved if row["clipId"] == "stable-pretzel-walkway-a")
        self.assertEqual(stable["slot"], 1)
        self.assertTrue(stable["sourceLocator"].endswith(".grass[1]"))
        with self.assertRaises(AssertionError):
            self.namespace["validate_named_reactive_request"](self.authored, moved, self.voice)

    def test_every_request_identity_field_and_complete_shape_is_checked(self):
        replacements = {"clipId": "foreign-id", "voiceId": OWNERS[1], "actorId": "towel-man", "region": "other",
                        "slot": 3, "sourceLocator": "game.js wrong[0]", "text": "Changed source.", "english": "Changed caption.",
                        "profileId": "f" * 32, "referenceSha256": "f" * 64, "referenceOriginalSha256": "e" * 64,
                        "renderer": "other", "modelRevision": "other", "processing": "borrowed undertone", "cause": "road"}
        self.assertEqual(set(replacements), FIELDS)
        for field, value in replacements.items():
            with self.subTest(field=field):
                rows = copy.deepcopy(self.authored)
                rows[0][field] = value
                with self.assertRaises(AssertionError):
                    self.validate(rows)
        for label, change in (
            ("missing", lambda rows: rows.pop()), ("duplicate", lambda rows: rows.__setitem__(-1, rows[0])),
            ("extra", lambda rows: rows.append(rows[0])), ("missing-cause", lambda rows: rows[0].pop("cause")),
            ("extra-key", lambda rows: rows[0].update(sourceId=rows[0]["clipId"])),
            ("boolean-slot", lambda rows: rows[0].update(slot=False)),
        ):
            with self.subTest(shape=label):
                rows = copy.deepcopy(self.authored)
                change(rows)
                with self.assertRaises(AssertionError):
                    self.validate(rows)

    def test_runtime_keys_counts_ids_and_nonblank_values_are_checked(self):
        original = copy.deepcopy(self.barks)
        for label, change in (
            ("foreign-owner", lambda data: data.__setitem__("crowd-dietmar-din-norm", data.pop(self.voice))),
            ("missing-region", lambda data: data[self.voice].pop("germany")),
            ("foreign-cause", lambda data: data[self.voice]["berlin"].__setitem__("other", [])),
            ("short-cause", lambda data: data[self.voice]["berlin"]["jaywalker"].pop()),
            ("extra-row-key", lambda data: data[self.voice]["berlin"]["grass"][0].update(cause="grass")),
            ("missing-english", lambda data: data[self.voice]["berlin"]["grass"][0].pop("english")),
            ("blank-text", lambda data: data[self.voice]["berlin"]["grass"][0].update(text="  ")),
            ("nonstring-text", lambda data: data[self.voice]["berlin"]["grass"][0].update(text=42)),
            ("blank-english", lambda data: data[self.voice]["berlin"]["grass"][0].update(english="\n")),
            ("nonstring-english", lambda data: data[self.voice]["berlin"]["grass"][0].update(english=None)),
            ("duplicate-id", lambda data: data[OWNERS[1]]["germany"]["road"][3].update(id="stable-pretzel-walkway-a")),
        ):
            with self.subTest(shape=label):
                self.barks = copy.deepcopy(original)
                change(self.barks)
                self.write_public()
                with self.assertRaises(AssertionError):
                    self.namespace["named_reactive_dialogue_sources"]()
        for value in ("", "../outside", "upper-Case", "slash/name", "white space", None):
            with self.subTest(unsafe_id=value):
                self.barks = copy.deepcopy(original)
                self.barks[self.voice]["berlin"]["grass"][0]["id"] = value
                self.write_public()
                with self.assertRaises(AssertionError):
                    self.namespace["named_reactive_dialogue_sources"]()

    def test_runtime_must_be_immutable_and_match_public_inventory(self):
        self.write_public(freeze_nested=False)
        with self.assertRaises(subprocess.CalledProcessError):
            self.namespace["named_reactive_dialogue_sources"]()
        self.write_public()
        inventory = {"pools": {"crowdReactiveBarks": copy.deepcopy(self.barks)}}
        inventory["pools"]["crowdReactiveBarks"][self.voice]["berlin"]["grass"][0]["english"] = "Stale caption."
        self.put(self.root / "For-AI/VOICE-DIALOGUE-INVENTORY.json", json.dumps(inventory))
        with self.assertRaises(AssertionError):
            self.namespace["named_reactive_dialogue_sources"]()

    def test_live_cast_ownership_recipe_reference_and_index_are_checked(self):
        original = copy.deepcopy(self.cast)
        changes = (
            ("borrowed-voice", lambda cast: cast["roleProfiles"][0].update(voiceId=OWNERS[1])),
            ("borrowed-profile", lambda cast: cast["roleProfiles"][0].update(secretTunnelProfileId="f" * 32)),
            ("duplicate-role", lambda cast: cast["roleProfiles"].append(copy.deepcopy(cast["roleProfiles"][0]))),
            ("missing-role", lambda cast: cast["roleProfiles"].pop(0)),
            ("wrong-reference", lambda cast: cast["roleProfiles"][0]["reference"].update(workingReferenceSha256="f" * 64)),
            ("wrong-license", lambda cast: cast["roleProfiles"][0]["reference"].update(license="unknown")),
            ("missing-index", lambda cast: cast["roleProfiles"][0]["dialogueSources"].pop()),
            ("duplicate-index", lambda cast: cast["roleProfiles"][0]["dialogueSources"].append(cast["roleProfiles"][0]["dialogueSources"][-1])),
            ("malformed-profile", lambda cast: cast["productionVoices"][self.voice].update(profileId="invalid")),
            ("malformed-reference", lambda cast: cast["productionVoices"][self.voice].update(referenceSha256="invalid")),
            ("wrong-renderer", lambda cast: cast["productionVoices"][self.voice].update(renderer="other")),
            ("wrong-revision", lambda cast: cast["productionVoices"][self.voice].update(modelRevision="other")),
            ("wet-processing", lambda cast: cast["productionVoices"][self.voice].update(processing="filter")),
            ("wrong-fallback", lambda cast: cast["productionVoices"][self.voice].update(fallback="random voice")),
            ("shared-profile", lambda cast: cast["productionVoices"][OWNERS[1]].update(profileId=cast["productionVoices"][self.voice]["profileId"])),
        )
        for label, change in changes:
            with self.subTest(binding=label):
                self.cast = copy.deepcopy(original)
                change(self.cast)
                self.write_public()
                with self.assertRaises(AssertionError):
                    self.namespace["named_reactive_dialogue_sources"]()

    def test_scope_helper_source_pins_and_forbidden_modes_are_checked(self):
        for flag in ("manifest", "check", "retake_failed", "follow", "follow_source", "reconcile_source",
                     "sentence_rescue", "eos_after_alignment", "benchmark_hooks", "benchmark_asr", "ambient"):
            with self.subTest(flag=flag), self.assertRaises(AssertionError):
                self.namespace["configure_request"](self.args(**{flag: True}))
        for limit in (0, -1, 29, True):
            with self.subTest(limit=limit), self.assertRaises(AssertionError):
                self.namespace["configure_request"](self.args(limit=limit))
        for field, value in (("sourceScope", "unknown"), ("authoringHelperSha256", "0" * 64),
                             ("publicAssetFamily", "assets/voices/other"), ("privateReviewFamily", "another family")):
            original = self.request[field]
            self.request[field] = value
            self.save_request()
            with self.subTest(field=field), self.assertRaises(AssertionError):
                self.namespace["configure_request"](self.args())
            self.request[field] = original
        self.request["sourceSha256"]["game.js"] = "0" * 64
        self.save_request()
        with self.assertRaises(AssertionError):
            self.namespace["configure_request"](self.args())
        self.request["sourceSha256"] = {**self.pins(), "For-AI/VOICE-DIALOGUE-INVENTORY.json": "0" * 64}
        self.save_request()
        with self.assertRaises(AssertionError):
            self.namespace["configure_request"](self.args())
        self.request["sourceSha256"] = self.pins()
        self.save_request()
        with self.assertRaises(AssertionError):
            self.namespace["configure_request"](self.args(voice_id="tourist-guenther-liegestuhl"))

    def test_complete_freeze_preserves_order_bytes_and_old_private_leaf(self):
        self.request["jobs"] = list(reversed(self.authored))
        self.save_request()
        old = self.directory / "music" / FAMILY / self.voice / "requests.json"
        self.put(old, "old full36 freeze must stay byte-for-byte\n")
        old_bytes = old.read_bytes()
        old_evidence = [old.parent / folder / "old-clip.json" for folder in ("raw", "encoded")]
        for path in old_evidence:
            self.put(path, "old evidence remains in its original leaf\n")
        old_evidence_bytes = [path.read_bytes() for path in old_evidence]
        self.execute(plan=True, limit=3)
        path = self.private() / "requests.json"
        frozen = json.loads(path.read_text(encoding="utf-8"))
        selected = [row for row in self.request["jobs"] if row["voiceId"] == self.voice]
        self.assertEqual(frozen["requestedLineCount"], 28)
        self.assertEqual(frozen["jobs"], selected)
        self.assertEqual(frozen["sourceScope"], SCOPE)
        self.assertEqual(frozen["authoringHelperSha256"], hashlib.sha256(PRODUCER.read_bytes()).hexdigest())
        self.put(path, json.dumps(frozen, indent=3) + "\n\n")
        equal_bytes = path.read_bytes()
        self.execute(plan=True)
        self.assertEqual(path.read_bytes(), equal_bytes)
        self.assertEqual(old.read_bytes(), old_bytes)
        self.assertEqual([item.read_bytes() for item in old_evidence], old_evidence_bytes)
        calls = []
        self.namespace["render"] = lambda args, queue, private: calls.append((queue, private))
        self.execute(render=True, limit=3)
        self.assertEqual(calls, [(selected[:3], self.private().resolve())])
        self.request["jobs"] = list(self.authored)
        self.save_request()
        with self.assertRaises(AssertionError):
            self.execute(plan=True)
        self.assertEqual(path.read_bytes(), equal_bytes)

    def test_scope_frozen_helper_authored_bytes_source_and_accounting_drift_fail(self):
        self.execute(plan=True)
        path = self.private() / "requests.json"
        frozen = json.loads(path.read_text(encoding="utf-8"))
        for field, value in (("sourceScope", "sandale-roles-v1"), ("authoringHelperSha256", "0" * 64),
                             ("authoredPlanSha256", "0" * 64), ("authoredPlanSourceSha256", {}),
                             ("requestedLineCount", 4)):
            changed = {**frozen, field: value}
            self.put(path, json.dumps(changed))
            with self.subTest(field=field), self.assertRaises(AssertionError):
                self.execute(process=True)
        self.put(path, json.dumps(frozen))
        self.put(self.request_path, json.dumps(self.request, indent=2))
        with self.assertRaises(AssertionError):
            self.execute(process=True)
        self.save_request()
        self.barks[self.voice]["berlin"]["grass"][0]["text"] += " Geändert."
        self.write_public()
        with self.assertRaises(AssertionError):
            self.execute(process=True)
        # Even a refreshed source hash cannot adopt changed tuples into a freeze.
        self.request["sourceSha256"] = self.pins()
        self.save_request()
        with self.assertRaises(AssertionError):
            self.execute(process=True)

    def test_execute_process_is_private_and_keeps_complete_accounting(self):
        self.execute(plan=True)
        calls = []
        def private_process(args, queue, private, all_jobs=None, publish_manifest=True):
            calls.append((queue, private, all_jobs, publish_manifest))
        self.namespace["process"] = private_process
        self.execute(process=True, limit=3)
        selected = [row for row in self.authored if row["voiceId"] == self.voice]
        self.assertEqual(calls, [(selected[:3], self.private().resolve(), selected, False)])
        self.assertTrue(all("cause" in row for row in calls[0][0]))
        self.assertFalse((self.root / "assets").exists())

    def test_actual_process_rejects_publication_before_native_imports_and_keeps_missing_raw_private(self):
        self.execute(plan=True)
        args = self.args(process=True)
        selected = [row for row in self.authored if row["voiceId"] == self.voice]
        with self.assertRaises(AssertionError):
            self.namespace["process"](args, selected, self.private())
        with self.assertRaises(AssertionError):
            self.namespace["manifest_name"]()
        with self.assertRaises(AssertionError):
            self.namespace["manifest"](selected, self.private())
        # Exercise the real no-raw processing path without loading a native model.
        # These empty modules are explicit dependency boundaries, not fake audio.
        numpy, whisper = ModuleType("numpy"), ModuleType("faster_whisper")
        def forbidden_model(*arguments, **keywords):
            self.fail("Portable source tests must never instantiate a model")
        whisper.WhisperModel = forbidden_model
        args.asr_model, args.asr_device, args.asr_threads = self.directory / "unused-asr", "cpu", 1
        self.namespace["ASR_CACHE"] = {"key": (str(args.asr_model.resolve()), "cpu", "int8", 1),
                                       "model": object(), "sha256": "0" * 64}
        with patch.dict(sys.modules, {"numpy": numpy, "faster_whisper": whisper}):
            self.namespace["process"](args, selected, self.private(), selected, publish_manifest=False)
        self.assertFalse((self.private() / "encoded").exists())
        self.assertFalse((self.root / "assets").exists())

    def legacy_jobs(self):
        rows = []
        for actor in OWNERS:
            binding = self.cast["productionVoices"][actor]
            for region in ("berlin", "germany"):
                for slot in (0, 1):
                    rows.append({"clipId": f"{actor}-{region}-{slot + 1:02}", "voiceId": actor, "actorId": actor,
                                 "region": region, "slot": slot, "sourceLocator": f"game.js crowdCharacterBarks[{actor}].{region}[{slot}]",
                                 "text": self.legacy_barks[actor][region][slot], "english": self.legacy_english[actor][region][slot],
                                 "profileId": binding["profileId"], "referenceSha256": binding["referenceSha256"],
                                 "referenceOriginalSha256": binding["originalSha256"], "renderer": binding["renderer"],
                                 "modelRevision": binding["modelRevision"], "processing": None})
        return rows

    def test_old_full36_and_sandale_scopes_keep_four_rows_paths_and_publication_behavior(self):
        self.request.pop("sourceScope")
        self.request["jobs"] = self.legacy_jobs()
        self.save_request()
        self.execute(plan=True)
        old_path = self.directory / "music" / FAMILY / self.voice / "requests.json"
        old = json.loads(old_path.read_text(encoding="utf-8"))
        self.assertEqual(len(self.request["jobs"]), 36)
        self.assertEqual(len(old["jobs"]), 4)
        self.assertTrue(all(set(row) == FIELDS - {"cause"} for row in old["jobs"]))
        self.assertNotIn("sourceScope", old)
        self.assertNotIn("authoringHelperSha256", old)
        calls = []
        self.namespace["process"] = lambda args, queue, private, all_jobs=None, publish_manifest=True: calls.append((private, publish_manifest))
        self.execute(process=True)
        self.assertEqual(calls, [(old_path.parent.resolve(), True)])
        self.assertFalse(self.private().exists())
        self.request["sourceScope"] = "sandale-roles-v1"
        self.request["jobs"] = self.namespace["sandale_dialogue_sources"]()
        self.save_request()
        self.voice = "tourist-guenther-liegestuhl"
        self.execute(plan=True)
        sandale = self.directory / "music" / FAMILY / self.voice / "requests.json"
        self.assertEqual(len(self.request["jobs"]), 8)
        self.assertEqual(json.loads(sandale.read_text(encoding="utf-8"))["requestedLineCount"], 4)
        self.execute(process=True)
        self.assertEqual(calls[-1], (sandale.parent.resolve(), False))
        self.assertFalse(self.private().exists())

    def test_original_sandale_ast_dependency_subset_needs_no_new_global(self):
        # Match the maintained six-test Sandale fixture's original extraction.
        old = self.extract_functions(OLD_FUNCTIONS, {"SANDALE_SOURCE_SCOPE", "SANDALE_OWNERS"})
        self.assertNotIn("NAMED_REACTIVE_OWNERS", old)
        self.request["sourceScope"] = "sandale-roles-v1"
        self.request["jobs"] = old["sandale_dialogue_sources"]()
        self.save_request()
        self.voice = "tourist-guenther-liegestuhl"
        self.execute(namespace=old, plan=True)
        calls = []
        old["process"] = lambda args, queue, private, all_jobs=None, publish_manifest=True: calls.append((len(queue), publish_manifest))
        self.execute(namespace=old, process=True)
        self.assertEqual(calls, [(4, False)])
        self.voice = OWNERS[0]
        self.request.pop("sourceScope")
        self.request["jobs"] = self.legacy_jobs()
        self.save_request()
        self.execute(namespace=old, plan=True)
        self.execute(namespace=old, process=True)
        self.assertEqual(calls[-1], (4, True))

    def test_no_scope_can_adopt_another_scopes_row_count(self):
        for scope, voice in ((None, self.voice), ("sandale-roles-v1", "tourist-guenther-liegestuhl")):
            if scope is None:
                self.request.pop("sourceScope", None)
            else:
                self.request["sourceScope"] = scope
            self.save_request()
            self.namespace["configure_request"](self.args(voice_id=voice))
            with self.subTest(legacy_scope=scope), self.assertRaises(AssertionError):
                self.namespace["jobs"]()
        self.request["sourceScope"] = SCOPE
        for rows in (self.legacy_jobs(), self.namespace["sandale_dialogue_sources"]()):
            self.request["jobs"] = rows
            self.save_request()
            self.namespace["configure_request"](self.args())
            with self.subTest(wrong_count=len(rows)), self.assertRaises(AssertionError):
                self.namespace["jobs"]()


if __name__ == "__main__":
    unittest.main()
