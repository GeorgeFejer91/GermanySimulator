"""Private policeContact2 adapter. ROOT executes finite sealed grants only."""
import argparse
from contextlib import contextmanager
import importlib.util
import json
import math
import os
from pathlib import Path
import re
import subprocess
import time

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("police_contact_shared", ROOT / "tools/build-knick-voice.py")
shared = importlib.util.module_from_spec(spec)
spec.loader.exec_module(shared)
VOICE = "polizei-heinrich-wachtmeister"
SCOPE = "police-contact-two-v1"
ADAPTER_SHA256 = shared.sha(Path(__file__))
PINNED_BINDING = {
    "profileId": "24b741bbe55d4f3a843aa481c3459a96",
    "referenceSha256": "abd1b50a64b82e4ec6ff903c4d286094fb9cbca2f756a1b35e45f6b455729ee7",
    "originalSha256": "718d21fd8dc250521a21882f86795cf8652845df7c128e655c0e2e771ac3207e",
    "renderer": "ResembleAI/Chatterbox Multilingual V2 0.1.7",
    "modelRevision": "5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18",
    "processing": None,
    "fallback": "captions",
}
RECIPE = {
    "status": "ROOT_SEALED_FINITE_POLICE_CONTACT2", "executor": "ROOT_ONLY",
    "maximumNativeCalls": 4, "maximumCallsPerClip": 2, "maximumAsrReadings": 8,
    "automaticRetries": 0, "rendererDevice": "cuda", "rendererPrecision": "fp16",
    "referenceConditioningPrecision": "float32", "rendererCpuThreads": 2,
    "observeEos": True, "asrDevice": "cpu", "asrComputeType": "int8",
    "asrThreads": 1, "asrLanguage": "de", "asrScriptPrompt": None,
    "asrBeamSizes": [1, 5], "publicationAuthorized": False,
}


def current_request():
    return json.loads(subprocess.check_output(
        ["node", str(ROOT / "tools/police-contact-voice-source.mjs")],
        cwd=ROOT, encoding="utf-8", timeout=30))


def validate_request(request, current):
    assert request == current, "Police contact source/profile/captions changed"
    assert request["family"] == "police-contact" and request["sourceScope"] == SCOPE
    assert request["status"] == "SOURCE_ONLY_NOT_A_GENERATION_GRANT"
    assert [row["clipId"] for row in request["jobs"]] == ["police-contact-warning", "police-contact-fine"]
    for row in request["jobs"]:
        assert row["voiceId"] == VOICE
        for key, value in PINNED_BINDING.items():
            if key != "fallback":
                assert row["referenceOriginalSha256" if key == "originalSha256" else key] == value
    binding = shared.read(ROOT / "For-AI/VOICE-CAST.json")["productionVoices"][VOICE]
    assert all(binding.get(key) == value for key, value in PINNED_BINDING.items())
    return binding


def validate_authority(authority, request, request_hash):
    assert all(type(authority.get(key)) is type(value) and authority[key] == value for key, value in RECIPE.items()), "Not the finite ROOT policeContact2 recipe"
    assert authority.get("grantId") and authority.get("authorityTemplateOnly") is False
    expected = {"requestSha256": request_hash, "adapterSha256": ADAPTER_SHA256,
                "sharedHelperSha256": shared.AUTHORING_HELPER_SHA256,
                "voiceId": VOICE, "sourceScope": SCOPE, "sourcePins": request["sourceSha256"],
                "profileId": PINNED_BINDING["profileId"],
                "referenceSha256": PINNED_BINDING["referenceSha256"],
                "referenceOriginalSha256": PINNED_BINDING["originalSha256"],
                "modelRevision": PINNED_BINDING["modelRevision"], "processing": None,
                "publicAssetFamily": request["publicAssetFamily"],
                "privateReviewFamily": request["privateReviewFamily"]}
    assert all(authority.get(key) == value for key, value in expected.items()), "Police contact authority pins changed"


def configure(request, binding):
    shared.VOICE, shared.BINDING = VOICE, binding
    shared.PROFILE = binding["profileId"]
    shared.REFERENCE_HASH, shared.REVISION = binding["referenceSha256"], binding["modelRevision"]
    shared.PROCESSING, shared.CUSTOM_PLAN = None, request
    shared.PUBLIC_ASSET_FAMILY = request["publicAssetFamily"]
    shared.PRIVATE_REVIEW_FAMILY = request["privateReviewFamily"]
    shared.SOURCE_FILES = tuple(request["sourceSha256"])


def private_path(music_root, request):
    result = music_root / request["privateReviewFamily"] / VOICE
    assert result.resolve().is_relative_to(music_root.resolve())
    assert not result.resolve().is_relative_to(ROOT)
    assert result.absolute() == result.resolve(), "Private review path cannot contain aliases"
    return result


def frozen_request(request, request_hash, authority_hash):
    return {"requestedLineCount": 2, "sourceScope": SCOPE, "jobs": request["jobs"],
            "sourceSha256": request["sourceSha256"], "authoredPlanSourceSha256": request["sourceSha256"],
            "authoredPlanSha256": request_hash, "authoringHelperSha256": shared.AUTHORING_HELPER_SHA256,
            "adapterSha256": ADAPTER_SHA256, "authoritySha256": authority_hash, "approvedExistingReuse": []}


@contextmanager
def phase_lock(private):
    path = private / "police-contact-phase.lock"
    private.mkdir(parents=True, exist_ok=True)
    with path.open("x", encoding="utf-8") as output:
        output.write(str(os.getpid()))
    try:
        yield
    finally:
        path.unlink()


class CallLedger:
    """Charge before native invocation, retaining interrupted calls in the budget."""
    def __init__(self, path, authority_hash, maximum, per_clip):
        self.path, self.authority_hash = path, authority_hash
        self.maximum, self.per_clip = maximum, per_clip
        self.document = shared.read(path) if path.exists() else {"authoritySha256": authority_hash, "calls": []}
        assert self.document["authoritySha256"] == authority_hash
        assert len(self.document["calls"]) <= maximum

    def charge(self, clip_id, **details):
        calls = self.document["calls"]
        assert len(calls) < self.maximum, "Finite total native call budget exhausted"
        assert sum(row["clipId"] == clip_id for row in calls) < self.per_clip, "Finite per-clip call budget exhausted"
        row = {"call": len(calls) + 1, "clipId": clip_id, "status": "started", "startedUnix": time.time(), **details}
        calls.append(row)
        shared.write(self.path, self.document)
        return row

    def finish(self, row, status):
        row.update(status=status, finishedUnix=time.time())
        shared.write(self.path, self.document)


def render(args, request, private, authority_hash):
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    ledger = CallLedger(private / "native-call-ledger.json", authority_hash, 4, 2)
    native_generate = ChatterboxMultilingualTTS.generate
    jobs = {row["text"]: row for row in request["jobs"]}

    def charged_generate(model, text, *arguments, **keywords):
        assert text in jobs, "Native renderer input must be one complete exact source line"
        clip_id = jobs[text]["clipId"]
        prior = [row for row in ledger.document["calls"] if row["clipId"] == clip_id]
        assert not prior or args.retake_failed and all(row["status"] == "returned" for row in prior), "Interrupted native calls remain held; no implicit retry"
        row = ledger.charge(clip_id, text=text)
        try:
            audio = native_generate(model, text, *arguments, **keywords)
        except BaseException:
            ledger.finish(row, "failed")
            raise
        ledger.finish(row, "returned")
        return audio

    ChatterboxMultilingualTTS.generate = charged_generate
    try:
        shared.render(args, request["jobs"], private)
    finally:
        ChatterboxMultilingualTTS.generate = native_generate


def process(args, request, private, authority_hash):
    from faster_whisper import WhisperModel
    ledger = CallLedger(private / "asr-call-ledger.json", authority_hash, 8, 4)
    native_transcribe = WhisperModel.transcribe
    active = {}

    def charged_transcribe(model, audio, *arguments, **keywords):
        assert not arguments and keywords == {"language": "de", "beam_size": keywords.get("beam_size"), "word_timestamps": True}
        assert keywords["beam_size"] in (1, 5)
        mp3 = private / "encoded" / (active["clipId"] + ".mp3")
        encoded_hash = shared.sha(mp3)
        prior = [row for row in ledger.document["calls"] if row["clipId"] == active["clipId"] and row["encodedSha256"] == encoded_hash]
        assert all(row["status"] == "returned" for row in prior), "Interrupted ASR remains held; no implicit retry"
        assert keywords["beam_size"] not in [row["beamSize"] for row in prior], "No repeated ASR beam for the same encoding"
        row = ledger.charge(active["clipId"], beamSize=keywords["beam_size"], encodedSha256=encoded_hash,
                            asrModelSha256=shared.sha(args.asr_model / "model.bin"), scriptPrompt=None)
        try:
            segments, info = native_transcribe(model, audio, **keywords)
            segments = list(segments)
        except BaseException:
            ledger.finish(row, "failed")
            raise
        row["transcript"] = " ".join(segment.text.strip() for segment in segments)
        ledger.finish(row, "returned")
        return iter(segments), info

    WhisperModel.transcribe = charged_transcribe
    try:
        for job in request["jobs"]:
            active.update(job)
            shared.process(args, [job], private, request["jobs"], publish_manifest=False)
    finally:
        WhisperModel.transcribe = native_transcribe


def file_proof(private, relative):
    path = private / relative
    assert path.is_file() and path.absolute() == path.resolve() and path.resolve().is_relative_to(private.resolve()), "Missing or aliased private proof"
    return path


def validate_trace(job, decode, trace):
    assert all(trace.get(key) == job[key] for key in ("clipId", "text", "profileId", "referenceSha256", "modelRevision"))
    steps = trace["steps"]
    assert steps and all(row["step"] == index + 1 for index, row in enumerate(steps))
    assert all(type(row[key]) is bool for row in steps for key in ("completeBefore", "completeAfter", "nativeEosSuppressed", "analyzerForcedEos", "modelEosRestored"))
    assert all(row["modelEosRestored"] is False and math.isfinite(row["modelEosLogit"]) and math.isfinite(row["nativeEosLogit"]) for row in steps)
    assert all(row["nativeEosSuppressed"] == (row["nativeEosLogit"] == -(2 ** 15)) and row["analyzerForcedEos"] == (row["nativeEosLogit"] == 2 ** 15) for row in steps)
    assert all(steps[index]["completeBefore"] == steps[index - 1]["completeAfter"] for index in range(1, len(steps)))
    assert decode["eosSuppressionObservedSteps"] == sum(row["nativeEosSuppressed"] for row in steps)
    assert decode["modelEosRestoredSteps"] == 0
    assert decode["alignmentFirstCompletedStep"] == next((row["step"] for row in steps if row["completeAfter"]), None)
    expected_kind = "analyzer-forced" if decode["eosReached"] and steps[-1]["analyzerForcedEos"] else "model-sampled" if decode["eosReached"] else "budget-exhausted"
    assert decode["eosKind"] == expected_kind


def private_proposal(request, private, authority):
    """Integrity summaries only; ROOT separately verifies retirement, selection and mouth measurements."""
    frozen_path = file_proof(private, "requests.json")
    frozen_hash = shared.sha(frozen_path)
    frozen = shared.read(frozen_path)
    assert frozen["jobs"] == request["jobs"] and frozen["sourceSha256"] == request["sourceSha256"]
    assert frozen["adapterSha256"] == ADAPTER_SHA256 and frozen["authoringHelperSha256"] == shared.AUTHORING_HELPER_SHA256
    native_path, asr_path = private / "native-call-ledger.json", private / "asr-call-ledger.json"
    native = shared.read(file_proof(private, native_path.name))["calls"] if native_path.exists() else []
    readings = shared.read(file_proof(private, asr_path.name))["calls"] if asr_path.exists() else []
    assert len(native) <= 4 and len(readings) <= 8
    for path in (native_path, asr_path):
        if path.exists():
            assert shared.read(path)["authoritySha256"] == frozen["authoritySha256"]
    assert all(row["clipId"] in {job["clipId"] for job in request["jobs"]} for row in native + readings)
    clips, held, proofs = [], [], {}
    for job in request["jobs"]:
        clip_id = job["clipId"]
        calls = [row for row in native if row["clipId"] == clip_id]
        assert len(calls) <= 2
        raw_relative = "raw/" + clip_id + ".json"
        if not (private / raw_relative).exists():
            held.append({**job, "reason": "missing native receipt; captions"})
            continue
        raw_path = file_proof(private, raw_relative)
        raw = shared.read(raw_path)
        assert all(raw.get(key) == value for key, value in job.items())
        assert raw["requestSha256"] == frozen_hash and raw["authoringHelperSha256"] == shared.AUTHORING_HELPER_SHA256
        assert raw["profileJsonSha256"] == authority["profileMetadataSha256"]
        assert raw["synthesisAttempt"] == len(calls) and calls[-1]["status"] == "returned"
        assert calls[-1]["text"] == job["text"] == raw["rendererInputText"]
        assert raw["seed"] == 71000 + job["slot"] + (len(calls) - 1) * 100000
        synth = raw["synthesis"]
        expected_synth = {"device": "cuda", "precision": "fp16", "t3WeightPrecision": "float16",
                          "conditioningPrecision": "float32", "autocastPrecision": "float16",
                          "referenceConditioningVerifiedFloat32": True, "conditioningCached": True,
                          "referenceReconditionedForProfile": PINNED_BINDING["profileId"],
                          "cpuThreads": 2, "inferenceMode": True, "exaggeration": .5,
                          "temperature": .65, "repetitionPenalty": 3., "cfgWeight": .6, "languageId": "de"}
        assert all(synth.get(key) == value for key, value in expected_synth.items())
        assert raw["rawSha256"] == shared.sha(file_proof(private, "raw/" + clip_id + ".wav"))
        trace_path = file_proof(private, "raw/" + clip_id + "-eos-trace.json")
        assert raw["decode"]["eosTraceSha256"] == shared.sha(trace_path)
        trace = shared.read(trace_path)
        validate_trace(job, raw["decode"], trace)
        encoded_relative = "encoded/" + clip_id + ".json"
        if not shared.generation_complete(raw) or not (private / encoded_relative).exists():
            held.append({**job, "reason": "native EOS or encoding not established; captions"})
            continue
        encoded_path = file_proof(private, encoded_relative)
        encoded = shared.read(encoded_path)
        assert all(encoded.get(key) == value for key, value in raw.items() if key not in ("status", "durationSeconds"))
        mp3 = file_proof(private, "encoded/" + clip_id + ".mp3")
        assert encoded["sha256"] == shared.sha(mp3) and encoded["bytes"] == mp3.stat().st_size
        current_readings = [row for row in readings if row["clipId"] == clip_id and row["encodedSha256"] == encoded["sha256"]]
        assert [row["beamSize"] for row in current_readings] == [row["beamSize"] for row in encoded["asrReadings"]]
        assert all(row["status"] == "returned" and row["asrModelSha256"] == authority["asrModelSha256"] and row["scriptPrompt"] is None for row in current_readings)
        assert [row["transcript"] for row in current_readings] == [row["transcript"] for row in encoded["asrReadings"]]
        assert [row["beamSize"] for row in current_readings] in ([1], [1, 5])
        assert encoded["asr"] == current_readings[-1]["transcript"] and encoded["asrBeamSize"] == current_readings[-1]["beamSize"]
        assert encoded["asrModelSha256"] == authority["asrModelSha256"]
        assert encoded["asrDevice"] == "cpu" and encoded["asrComputeType"] == "int8" and encoded["asrCpuThreads"] == 1
        assert encoded["asrLanguageId"] == "de" and encoded["asrScriptPrompt"] is None
        assert encoded["sampleRateHz"] == 48000 and encoded["channels"] == 1 and encoded["bitrateBitsPerSecond"] == 128000
        assert math.isfinite(encoded["durationSeconds"]) and encoded["durationSeconds"] > 0
        exact = (encoded.get("asrLiteralWordExact") is True and encoded.get("asrWordExact") is True
                 and shared.spoken_words(job["text"]) == shared.spoken_words(encoded["asr"]))
        technical = (math.isfinite(encoded["integratedLufs"]) and abs(encoded["integratedLufs"] + 18) <= .3
                     and math.isfinite(encoded["truePeakDbtp"]) and encoded["truePeakDbtp"] <= -1.5)
        if not exact or not technical:
            held.append({**job, "reason": "final literal words or levels failed; captions", "candidateSha256": encoded["sha256"]})
            continue
        words, cues = list(re.finditer(r"\w+", job["text"])), encoded["wordCues"]
        assert len(cues) == len(words) and all(cue["word"] == word[0] and cue["charIndex"] == word.start() for cue, word in zip(cues, words))
        assert all(math.isfinite(cue["at"]) and math.isfinite(cue["end"]) and 0 <= cue["at"] <= cue["end"] <= encoded["durationSeconds"] for cue in cues)
        assert all(cues[index]["at"] >= cues[index - 1]["at"] for index in range(1, len(cues)))
        clips.append(encoded)
        proofs[clip_id] = {"rawReceiptSha256": shared.sha(raw_path), "encodedReceiptSha256": shared.sha(encoded_path),
                           "rawSha256": raw["rawSha256"], "encodedSha256": encoded["sha256"],
                           "eosTraceSha256": shared.sha(trace_path)}
    return {"schemaVersion": 1, "sourceScope": SCOPE,
            "status": "PRIVATE_INTEGRITY_PROPOSAL_NOT_ADMISSION", "requestedLineCount": 2,
            "clips": clips, "heldPrivate": held, "proofs": proofs,
            "frozenRequestSha256": frozen_hash, "sharedHelperSha256": shared.AUTHORING_HELPER_SHA256,
            "adapterSha256": ADAPTER_SHA256,
            "nativeLedgerSha256": shared.sha(native_path) if native_path.exists() else None,
            "asrLedgerSha256": shared.sha(asr_path) if asr_path.exists() else None,
            "outstandingGates": ["ROOT retired phase proofs", "independent clip/hash use selection",
                                 "final encoded mouth measurement", "curator admission"], "listening": "NOT RUN"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("request-file", "authority", "music-root", "model-dir", "asr-model", "ffmpeg"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--retake-failed", action="store_true")
    mode = parser.add_mutually_exclusive_group(required=True)
    for name in ("plan", "render", "process", "proposal"):
        mode.add_argument("--" + name, action="store_true")
    args = parser.parse_args()
    assert not args.retake_failed or args.render, "Only an explicit render can request the bounded second take"
    request, authority = shared.read(args.request_file), shared.read(args.authority)
    binding = validate_request(request, current_request())
    request_hash, authority_hash = shared.sha(args.request_file), shared.sha(args.authority)
    validate_authority(authority, request, request_hash)
    assert Path(authority["musicRoot"]).resolve() == args.music_root.resolve()
    assert args.model_dir.name == binding["modelRevision"] and args.model_dir.is_dir()
    assert shared.sha(args.asr_model / "model.bin") == authority["asrModelSha256"]
    assert args.ffmpeg.is_file() and args.ffmpeg.with_name("ffprobe.exe").is_file()
    profile = args.music_root / "Secret Tunnel shared voice data/profiles" / binding["profileId"]
    assert shared.sha(profile / "profile.json") == authority["profileMetadataSha256"]
    assert shared.sha(profile / "reference.wav") == binding["referenceSha256"]
    assert shared.sha(profile / "original.wav") == binding["originalSha256"]
    configure(request, binding)
    private = private_path(args.music_root, request)
    frozen = frozen_request(request, request_hash, authority_hash)
    args.voice_id, args.device, args.precision = VOICE, "cuda", "fp16"
    args.cpu_threads, args.asr_threads, args.asr_device = 2, 1, "cpu"
    args.observe_eos = True
    args.eos_after_alignment = args.benchmark_hooks = args.follow_source = args.follow = False
    with phase_lock(private):
        plan_path = private / "requests.json"
        if args.plan:
            if plan_path.exists():
                assert shared.read(plan_path) == frozen, "Frozen request cannot be replaced"
            else:
                shared.write(plan_path, frozen)
            print(json.dumps({"requestedLineCount": 2, "privateRoot": str(private), "frozenRequestSha256": shared.sha(plan_path)}))
            return
        assert shared.read(plan_path) == frozen, "Immutable private request/source/helper pins changed"
        if args.render:
            render(args, request, private, authority_hash)
        elif args.process:
            process(args, request, private, authority_hash)
        else:
            print(json.dumps(private_proposal(request, private, authority), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
