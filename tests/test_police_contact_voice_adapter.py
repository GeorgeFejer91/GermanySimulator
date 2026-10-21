"""Source/receipt fixtures only. These tests do not synthesize or qualify audio."""
import copy
import importlib.util
from pathlib import Path
import re
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("police_contact_adapter", ROOT / "tools/build-police-contact-voices.py")
adapter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(adapter)


class PoliceContactAdapterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.request = adapter.current_request()

    def test_exact_source_and_selected_profile_required(self):
        binding = adapter.validate_request(self.request, self.request)
        self.assertEqual(binding["profileId"], adapter.PINNED_BINDING["profileId"])
        for key in ("text", "english", "profileId", "referenceSha256"):
            changed = copy.deepcopy(self.request)
            changed["jobs"][0][key] += "changed"
            with self.assertRaises(AssertionError):
                adapter.validate_request(changed, self.request)

    def test_same_bad_binding_cannot_evade_current_source_comparison(self):
        changed = copy.deepcopy(self.request)
        changed["jobs"][0]["referenceOriginalSha256"] = "0" * 64
        with self.assertRaises(AssertionError):
            adapter.validate_request(changed, changed)

    def authority(self):
        return {**copy.deepcopy(adapter.RECIPE), "grantId": "fixture-not-a-grant", "authorityTemplateOnly": False,
                "requestSha256": "a" * 64, "adapterSha256": adapter.ADAPTER_SHA256,
                "sharedHelperSha256": adapter.shared.AUTHORING_HELPER_SHA256, "voiceId": adapter.VOICE,
                "sourceScope": adapter.SCOPE, "sourcePins": self.request["sourceSha256"],
                "profileId": adapter.PINNED_BINDING["profileId"], "referenceSha256": adapter.PINNED_BINDING["referenceSha256"],
                "referenceOriginalSha256": adapter.PINNED_BINDING["originalSha256"],
                "modelRevision": adapter.PINNED_BINDING["modelRevision"], "processing": None,
                "publicAssetFamily": self.request["publicAssetFamily"], "privateReviewFamily": self.request["privateReviewFamily"],
                "profileMetadataSha256": "b" * 64, "asrModelSha256": "c" * 64}

    def test_only_separate_finite_root_authority_is_accepted(self):
        authority = self.authority()
        adapter.validate_authority(authority, self.request, "a" * 64)
        for key, value in (("status", "ROOT_SEALED_FINITE_POLICE12"), ("executor", "WORKER"),
                           ("maximumNativeCalls", 5), ("maximumCallsPerClip", 3), ("maximumAsrReadings", 9),
                           ("authorityTemplateOnly", True), ("observeEos", False), ("asrScriptPrompt", "script"),
                           ("adapterSha256", "0" * 64), ("sharedHelperSha256", "0" * 64)):
            changed = {**authority, key: value}
            with self.subTest(key=key), self.assertRaises(AssertionError):
                adapter.validate_authority(changed, self.request, "a" * 64)

    def test_interrupted_calls_consume_per_clip_and_global_budget_across_resume(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "calls.json"
            ledger = adapter.CallLedger(path, "grant", 4, 2)
            ledger.charge("warning")
            resumed = adapter.CallLedger(path, "grant", 4, 2)
            resumed.finish(resumed.charge("warning"), "failed")
            with self.assertRaisesRegex(AssertionError, "per-clip"):
                resumed.charge("warning")
            resumed.charge("fine")
            resumed.charge("fine")
            with self.assertRaisesRegex(AssertionError, "total"):
                resumed.charge("other")
            with self.assertRaises(AssertionError):
                adapter.CallLedger(path, "new-grant", 4, 2)

    def test_phase_lock_never_silently_reclaims_an_existing_owner(self):
        with tempfile.TemporaryDirectory() as folder:
            private = Path(folder)
            with adapter.phase_lock(private):
                with self.assertRaises(FileExistsError):
                    with adapter.phase_lock(private):
                        self.fail("second phase acquired lock")
            self.assertFalse((private / "police-contact-phase.lock").exists())

    def test_frozen_request_pins_both_helpers_and_separate_authority(self):
        frozen = adapter.frozen_request(self.request, "a" * 64, "d" * 64)
        self.assertEqual(frozen["adapterSha256"], adapter.ADAPTER_SHA256)
        self.assertEqual(frozen["authoringHelperSha256"], adapter.shared.AUTHORING_HELPER_SHA256)
        self.assertEqual(frozen["authoritySha256"], "d" * 64)
        self.assertEqual(frozen["requestedLineCount"], 2)
        self.assertEqual(frozen["approvedExistingReuse"], [])

    def test_missing_receipts_become_explicit_caption_fallback_not_approved_audio(self):
        with tempfile.TemporaryDirectory() as folder:
            private = Path(folder).resolve()
            adapter.shared.write(private / "requests.json", adapter.frozen_request(self.request, "a" * 64, "d" * 64))
            proposal = adapter.private_proposal(self.request, private, self.authority())
            self.assertEqual(proposal["status"], "PRIVATE_INTEGRITY_PROPOSAL_NOT_ADMISSION")
            self.assertEqual(proposal["clips"], [])
            self.assertEqual(len(proposal["heldPrivate"]), 2)
            self.assertEqual(proposal["listening"], "NOT RUN")
            self.assertIn("final encoded mouth measurement", proposal["outstandingGates"])

    def test_eos_trace_mutation_or_synthetic_summary_is_rejected(self):
        job = self.request["jobs"][0]
        step = {"step": 1, "completeBefore": False, "completeAfter": True, "modelEosLogit": 1.,
                "nativeEosLogit": 1., "nativeEosSuppressed": False, "analyzerForcedEos": False,
                "modelEosRestored": False}
        trace = {key: job[key] for key in ("clipId", "text", "profileId", "referenceSha256", "modelRevision")}
        trace["steps"] = [step]
        decode = {"eosReached": True, "eosSuppressionObservedSteps": 0, "modelEosRestoredSteps": 0,
                  "alignmentFirstCompletedStep": 1, "eosKind": "model-sampled"}
        adapter.validate_trace(job, decode, trace)
        for key, value in (("modelEosRestored", True), ("nativeEosLogit", float("nan")),
                           ("nativeEosSuppressed", True), ("step", 2)):
            changed = copy.deepcopy(trace)
            changed["steps"][0][key] = value
            with self.subTest(key=key), self.assertRaises(AssertionError):
                adapter.validate_trace(job, decode, changed)
        with self.assertRaises(AssertionError):
            adapter.validate_trace(job, {**decode, "eosSuppressionObservedSteps": 1}, trace)

    def receipt_fixture(self, private):
        job, authority = self.request["jobs"][0], self.authority()
        adapter.shared.write(private / "requests.json", adapter.frozen_request(self.request, "a" * 64, "d" * 64))
        raw_dir, encoded_dir = private / "raw", private / "encoded"
        raw_dir.mkdir()
        encoded_dir.mkdir()
        raw_wav, mp3 = raw_dir / (job["clipId"] + ".wav"), encoded_dir / (job["clipId"] + ".mp3")
        raw_wav.write_bytes(b"fixture bytes, not native audio")
        mp3.write_bytes(b"fixture bytes, not encoded audio")
        trace = {key: job[key] for key in ("clipId", "text", "profileId", "referenceSha256", "modelRevision")}
        trace["steps"] = [{"step": 1, "completeBefore": False, "completeAfter": True,
                           "modelEosLogit": 1., "nativeEosLogit": 1., "nativeEosSuppressed": False,
                           "analyzerForcedEos": False, "modelEosRestored": False}]
        trace_path = raw_dir / (job["clipId"] + "-eos-trace.json")
        adapter.shared.write(trace_path, trace)
        raw = {**job, "requestSha256": adapter.shared.sha(private / "requests.json"),
               "authoringHelperSha256": adapter.shared.AUTHORING_HELPER_SHA256,
               "profileJsonSha256": authority["profileMetadataSha256"], "seed": 71000,
               "synthesisAttempt": 1, "rendererInputText": job["text"], "rawSha256": adapter.shared.sha(raw_wav),
               "decode": {"eosReached": True, "eosTraceSha256": adapter.shared.sha(trace_path),
                          "eosSuppressionObservedSteps": 0, "modelEosRestoredSteps": 0,
                          "alignmentFirstCompletedStep": 1, "eosKind": "model-sampled"},
               "synthesis": {"device": "cuda", "precision": "fp16", "t3WeightPrecision": "float16",
                             "conditioningPrecision": "float32", "autocastPrecision": "float16",
                             "referenceConditioningVerifiedFloat32": True, "conditioningCached": True,
                             "referenceReconditionedForProfile": job["profileId"], "cpuThreads": 2,
                             "inferenceMode": True, "exaggeration": .5, "temperature": .65,
                             "repetitionPenalty": 3., "cfgWeight": .6, "languageId": "de"}}
        adapter.shared.write(raw_wav.with_suffix(".json"), raw)
        encoded = {**raw, "sha256": adapter.shared.sha(mp3), "bytes": mp3.stat().st_size,
                   "asr": job["text"], "asrReadings": [{"beamSize": 1, "transcript": job["text"]}],
                   "asrLiteralWordExact": True, "asrWordExact": True, "asrBeamSize": 1,
                   "asrModelSha256": authority["asrModelSha256"], "asrDevice": "cpu", "asrComputeType": "int8",
                   "asrCpuThreads": 1, "asrLanguageId": "de", "asrScriptPrompt": None,
                   "sampleRateHz": 48000, "channels": 1, "bitrateBitsPerSecond": 128000,
                   "durationSeconds": 100., "integratedLufs": -18., "truePeakDbtp": -2.,
                   "wordCues": [{"word": match[0], "charIndex": match.start(), "at": index, "end": index + .5}
                                for index, match in enumerate(re.finditer(r"\w+", job["text"]))]}
        adapter.shared.write(mp3.with_suffix(".json"), encoded)
        adapter.shared.write(private / "native-call-ledger.json", {"authoritySha256": "d" * 64,
                            "calls": [{"clipId": job["clipId"], "text": job["text"], "status": "returned"}]})
        adapter.shared.write(private / "asr-call-ledger.json", {"authoritySha256": "d" * 64,
                            "calls": [{"clipId": job["clipId"], "encodedSha256": encoded["sha256"], "beamSize": 1,
                                       "transcript": job["text"], "asrModelSha256": authority["asrModelSha256"],
                                       "scriptPrompt": None, "status": "returned"}]})
        return encoded, mp3

    def test_receipt_lineage_checks_bytes_but_never_claims_audio_or_admission(self):
        with tempfile.TemporaryDirectory() as folder:
            private = Path(folder).resolve()
            _, mp3 = self.receipt_fixture(private)
            proposal = adapter.private_proposal(self.request, private, self.authority())
            self.assertEqual(len(proposal["clips"]), 1)
            self.assertEqual(proposal["status"], "PRIVATE_INTEGRITY_PROPOSAL_NOT_ADMISSION")
            mp3.write_bytes(b"tampered fixture")
            with self.assertRaises(AssertionError):
                adapter.private_proposal(self.request, private, self.authority())

    def test_normalized_only_asr_pass_stays_caption_fallback(self):
        with tempfile.TemporaryDirectory() as folder:
            private = Path(folder).resolve()
            encoded, mp3 = self.receipt_fixture(private)
            encoded["asrLiteralWordExact"] = False
            adapter.shared.write(mp3.with_suffix(".json"), encoded)
            proposal = adapter.private_proposal(self.request, private, self.authority())
            self.assertEqual(proposal["clips"], [])
            self.assertIn("literal words", proposal["heldPrivate"][0]["reason"])

    def test_wrong_prompt_or_missing_final_word_cue_fails_receipt_verification(self):
        for mutate in (lambda row: row.update(asrScriptPrompt="fixture prompt"), lambda row: row["wordCues"].pop()):
            with tempfile.TemporaryDirectory() as folder:
                private = Path(folder).resolve()
                encoded, mp3 = self.receipt_fixture(private)
                mutate(encoded)
                adapter.shared.write(mp3.with_suffix(".json"), encoded)
                with self.assertRaises(AssertionError):
                    adapter.private_proposal(self.request, private, self.authority())


if __name__ == "__main__":
    unittest.main()
