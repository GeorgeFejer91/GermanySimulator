"""Exercise quiz preparation and native dispatch without importing audio models."""
import contextlib
import copy
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("quiz_voice_builder", Path(__file__).with_name("build-knick-voice.py"))
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def source_request(region="germany", approach=0):
    return json.loads(subprocess.check_output([
        "node", "tools/build-quiz-voice-requests.mjs", "--voice-id", "quiz-gisela-becker",
        "--region", region, "--question-id", "24", "--approach-index", str(approach)
    ], cwd=builder.ROOT, encoding="utf-8", timeout=30))


class QuizPromptBuilder(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.canonical = source_request()

    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="germany-quiz-builder-")
        self.addCleanup(self.temporary.cleanup)
        self.directory = Path(self.temporary.name)
        self.request = self.directory / "source.json"
        builder.write(self.request, self.canonical)
        flags = {name: False for name in (
            "ambient", "retake_failed", "follow_source", "follow", "reconcile_source",
            "sentence_rescue", "eos_after_alignment", "benchmark_hooks", "benchmark_asr",
            "manifest", "check", "render", "process", "observe_eos")}
        self.args = SimpleNamespace(**flags, plan=True, voice_id="quiz-gisela-becker",
                                    request_file=self.request, music_root=self.directory / "music", limit=None)
        self.addCleanup(lambda: builder.configure_request(SimpleNamespace(
            voice_id="amt-brunhilde-knick", request_file=None, ambient=False)))

    def freeze(self):
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            builder.execute(self.args)
        return Path(json.loads(output.getvalue())["privateRoot"]) / "requests.json"

    def test_missing_only_queue_keeps_existing_question_and_source_identity(self):
        builder.configure_request(self.args)
        self.assertEqual(builder.jobs(), self.canonical["jobs"])
        self.assertEqual([row["segment"] for row in builder.jobs()], ["approach", "context"])
        self.assertEqual(builder.REUSE_EVIDENCE, [self.canonical["segments"][2]])
        self.assertEqual(builder.CUSTOM_PLAN["family"], "quiz-dialogue")
        self.assertEqual(builder.CUSTOM_PLAN["authoringHelperSha256"], builder.sha(Path(builder.__file__)))
        self.assertEqual(builder.CUSTOM_PLAN["sourceSha256"], builder.source_hashes())
        self.assertTrue(all(name not in sys.modules for name in ("torch", "torchaudio", "faster_whisper", "numpy")))

    def test_frozen_private_prompt_is_complete_and_repeated_plans_preserve_bytes(self):
        frozen = self.freeze()
        self.assertFalse(frozen.resolve().is_relative_to(builder.ROOT.resolve()))
        plan = builder.read(frozen)
        self.assertEqual(plan["jobs"], self.canonical["jobs"])
        self.assertEqual(plan["approvedExistingReuse"], [self.canonical["segments"][2]])
        self.assertEqual(plan["sourceScope"], "street-quiz-prompts-v1")
        self.assertEqual(plan["quizSelection"], self.canonical["selection"])
        self.assertEqual(plan["authoringHelperSha256"], builder.sha(Path(builder.__file__)))
        self.assertEqual(plan["authoredPlanSha256"], builder.sha(self.request))
        self.assertEqual(plan["authoredPlanSourceSha256"], self.canonical["sourceSha256"])
        before = frozen.read_bytes(), frozen.stat().st_mtime_ns
        self.assertEqual(self.freeze(), frozen)
        self.assertEqual((frozen.read_bytes(), frozen.stat().st_mtime_ns), before)
        frozen.write_text('{"jobs": []}', encoding="utf-8")
        with self.assertRaises(AssertionError):
            self.freeze()
        self.assertEqual(frozen.read_text(encoding="utf-8"), '{"jobs": []}')

    def test_berlin_and_approach_variants_have_distinct_private_freezes(self):
        first = self.freeze()
        for region, approach in (("berlin", 0), ("germany", 1)):
            request = source_request(region, approach)
            builder.write(self.request, request)
            other = self.freeze()
            self.assertNotEqual(first, other)
            self.assertEqual(builder.read(other)["jobs"], request["jobs"])
        self.assertEqual(builder.read(first)["jobs"], self.canonical["jobs"])

    def test_changed_or_foreign_sources_fail_before_any_private_output(self):
        mutations = [
            lambda r: r["jobs"].append(r["segments"][2]),
            lambda r: r["jobs"].pop(),
            lambda r: r["jobs"].append(r["jobs"][0]),
            lambda r: r["jobs"][0].update(text="Andere Worte."),
            lambda r: r["jobs"][0].update(english="Different subtitle."),
            lambda r: r["jobs"][0].update(profileId="wrong-profile"),
            lambda r: r["jobs"][0].update(actorId="another-actor"),
            lambda r: r["segments"].reverse(),
            lambda r: r["sourceSha256"].update({"game.js": "0" * 64}),
            lambda r: r["segments"][2]["existingDefault"].update(sha256="0" * 64),
            lambda r: r["selection"].update(approachIndex=False),
            lambda r: r.update(family="quiz-dialogue"),
        ]
        for mutate in mutations:
            with self.subTest(mutation=mutations.index(mutate)):
                wrong = copy.deepcopy(self.canonical)
                mutate(wrong)
                builder.write(self.request, wrong)
                with self.assertRaises((AssertionError, subprocess.CalledProcessError)):
                    self.freeze()
                self.assertFalse(self.args.music_root.exists())
        self.args.voice_id = "quiz-heike-hoffmann"
        builder.write(self.request, self.canonical)
        with self.assertRaises(AssertionError):
            self.freeze()

    def test_unsafe_modes_and_limits_are_rejected_without_loading_models(self):
        for flag in ("manifest", "check", "retake_failed", "follow_source", "follow",
                     "reconcile_source", "sentence_rescue", "eos_after_alignment",
                     "benchmark_hooks", "benchmark_asr", "ambient"):
            with self.subTest(flag=flag):
                setattr(self.args, flag, True)
                try:
                    with self.assertRaises(AssertionError):
                        builder.configure_request(self.args)
                finally:
                    setattr(self.args, flag, False)
        for limit in (0, -1, 3, True):
            self.args.limit = limit
            with self.assertRaises(AssertionError):
                builder.configure_request(self.args)
        self.args.limit = 1
        builder.configure_request(self.args)
        self.args.limit = None
        self.args.render = True
        with self.assertRaises(AssertionError):
            builder.configure_request(self.args)
        self.args.observe_eos = True
        builder.configure_request(self.args)
        self.assertTrue(all(name not in sys.modules for name in ("torch", "faster_whisper")))

    def test_native_dispatch_retains_private_processing_and_frozen_helper(self):
        frozen = self.freeze()
        self.args.plan = False
        self.args.process = True
        with patch.object(builder, "process") as processing:
            builder.execute(self.args)
            call = processing.call_args
            self.assertEqual(call.args[1], self.canonical["jobs"])
            self.assertEqual(call.args[3], self.canonical["jobs"])
            self.assertIs(call.kwargs["publish_manifest"], False)
        self.args.process = False
        self.args.render = self.args.observe_eos = True
        self.args.limit = 1
        with patch.object(builder, "render") as rendering:
            builder.execute(self.args)
            self.assertEqual(rendering.call_args.args[1], self.canonical["jobs"][:1])
        changed = builder.read(frozen)
        changed["authoringHelperSha256"] = "0" * 64
        builder.write(frozen, changed)
        with patch.object(builder, "render") as rendering:
            with self.assertRaises(AssertionError):
                builder.execute(self.args)
            rendering.assert_not_called()
        with self.assertRaises(AssertionError):
            builder.manifest_name()
        with self.assertRaises(AssertionError):
            builder.process(self.args, [], frozen.parent, publish_manifest=True)

    def test_actual_cli_freezes_current_source_without_changing_public_assets(self):
        before = {str(path): builder.sha(path) for path in (builder.ROOT / "assets/voices/quiz-segments").iterdir() if path.is_file()}
        command = [sys.executable, str(Path(builder.__file__)), "--music-root", str(self.args.music_root),
                   "--voice-id", self.args.voice_id, "--request-file", str(self.request), "--plan"]
        result = subprocess.run(command, capture_output=True, text=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stderr)
        frozen = Path(json.loads(result.stdout)["privateRoot"]) / "requests.json"
        self.assertEqual(builder.read(frozen)["requestedLineCount"], 2)
        rejected = subprocess.run([*command[:-1], "--manifest"], capture_output=True, text=True, timeout=30)
        self.assertNotEqual(rejected.returncode, 0)
        self.assertIn("private", rejected.stderr.lower())
        all_voices = command.copy()
        all_voices[all_voices.index("--voice-id") + 1] = "all"
        rejected = subprocess.run(all_voices, capture_output=True, text=True, timeout=30)
        self.assertNotEqual(rejected.returncode, 0)
        self.assertIn("one selected", rejected.stderr.lower())
        after = {str(path): builder.sha(path) for path in (builder.ROOT / "assets/voices/quiz-segments").iterdir() if path.is_file()}
        self.assertEqual(after, before)


if __name__ == "__main__":
    unittest.main()
