"""Render exact current dialogue with cached, fixed production voices.

Uses existing local authoring environments; never downloads a model, creates a
profile, edits dialogue, or grants listening approval. Failed takes stay private.
Run --plan first, --render in the Chatterbox environment, then --process in the
faster-whisper environment. Knick is the default; --request-file supports the
curated street-wisdom family. --check verifies the resulting shipped manifest.
"""
import argparse
import gc
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import time

VOICE = "amt-brunhilde-knick"
ROOT = Path(__file__).resolve().parents[1]


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


BINDING = read(ROOT / "For-AI/VOICE-CAST.json")["productionVoices"][VOICE]
PROFILE, REFERENCE_HASH, REVISION, PROCESSING = (BINDING[key] for key in ("profileId", "referenceSha256", "modelRevision", "processing"))
assert BINDING["renderer"] == "ResembleAI/Chatterbox Multilingual V2 0.1.7"
assert REVISION == "5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18", "Only the verified cached engine revision is supported"
REUSE_EVIDENCE = []
SOURCE_FILES = ("buergeramt-story.js", "buergeramt.js")
PUBLIC_ASSET_FAMILY = "assets/voices/knick"
PRIVATE_REVIEW_FAMILY = "GermanySimulator Knick consistency review 2026-10-11"
CUSTOM_PLAN = None
RENDER_CACHE = None
ASR_CACHE = None
ASR_NORMALIZATION = "case/punctuation, German numeric and A38 spoken equivalents, guarded full-hour and date-ordinal equivalents, section sign/Paragraf orthography, German compound spacing"


def processing_hash(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest() if value is not None else None


def manifest_name(ambient=False):
    return VOICE + "-manifest.json" if CUSTOM_PLAN else ("ambient-manifest.json" if ambient else "manifest.json")


def source_hashes():
    return {name: sha(ROOT / name) for name in SOURCE_FILES}


def configure_request(args):
    global VOICE, BINDING, PROFILE, REFERENCE_HASH, REVISION, PROCESSING
    global SOURCE_FILES, PUBLIC_ASSET_FAMILY, PRIVATE_REVIEW_FAMILY, CUSTOM_PLAN
    SOURCE_FILES = ("buergeramt-story.js", "buergeramt.js")
    PUBLIC_ASSET_FAMILY = "assets/voices/knick"
    PRIVATE_REVIEW_FAMILY = "GermanySimulator Knick consistency review 2026-10-11"
    CUSTOM_PLAN = None
    VOICE = args.voice_id
    assert re.fullmatch(r"[a-z0-9-]+", VOICE), "Selected voice identifiers must be safe path components"
    BINDING = read(ROOT / "For-AI/VOICE-CAST.json")["productionVoices"][VOICE]
    PROFILE, REFERENCE_HASH, REVISION = (BINDING[key] for key in ("profileId", "referenceSha256", "modelRevision"))
    PROCESSING = BINDING.get("processing")
    assert PROCESSING is None or isinstance(PROCESSING, str) and PROCESSING, "Dry processing must be absent/null; declared recipes must be nonempty"
    assert BINDING["renderer"] == "ResembleAI/Chatterbox Multilingual V2 0.1.7"
    assert REVISION == "5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18"
    if args.request_file:
        plan = read(args.request_file)
        assert not args.ambient, "Custom families own their authored queues"
        assert plan["family"] == "street-wisdom"
        assert plan["publicAssetFamily"] == "assets/voices/street-wisdom"
        assert plan["privateReviewFamily"] == "GermanySimulator street wisdom review 2026-10-11"
        PUBLIC_ASSET_FAMILY, PRIVATE_REVIEW_FAMILY = plan["publicAssetFamily"], plan["privateReviewFamily"]
        for name in plan["sourceSha256"]:
            target = ROOT / name
            assert target.resolve().is_relative_to(ROOT.resolve()) and target.is_file(), "Source must be an existing repository file"
        assert set(plan["sourceSha256"]) in ({"For-AI/AUDIO-TEXT-LIBRARY.js"}, {"For-AI/AUDIO-TEXT-LIBRARY.js", "street-wisdom.js"})
        SOURCE_FILES = ("For-AI/AUDIO-TEXT-LIBRARY.js", "street-wisdom.js")
        assert (ROOT / "street-wisdom.js").is_file()
        CUSTOM_PLAN = plan
    else:
        assert VOICE == "amt-brunhilde-knick", "Other selected characters need a frozen request file"


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def assert_binding(take):
    assert take["voiceId"] == VOICE and take["profileId"] == PROFILE
    assert take["referenceSha256"] == REFERENCE_HASH and take["referenceOriginalSha256"] == BINDING["originalSha256"]
    assert take["renderer"] == BINDING["renderer"] and take["modelRevision"] == REVISION


def generation_complete(take):
    # Newly authored families need actual native decoder evidence. Historical
    # approved fever reuse is verified separately in jobs(), never inferred here.
    decode = take.get("decode")
    return isinstance(decode, dict) and decode.get("eosReached") is True


def reference_license(profile_record):
    for role in read(ROOT / "For-AI/VOICE-CAST.json")["roleProfiles"]:
        reference = role.get("reference", {})
        if (role.get("voiceId") == VOICE and role.get("secretTunnelProfileId") == PROFILE
                and reference.get("workingReferenceSha256") == BINDING["originalSha256"]
                and reference.get("license")):
            return reference["license"]
    return (BINDING.get("referenceLicense") or profile_record.get("reference_license") or profile_record.get("license")
            or ("CC0-1.0 (EmoDB original, transformed reference)" if VOICE == "amt-brunhilde-knick"
                else "unknown; selected profile does not record reference license"))


def jobs(ambient=False, music_root=None):
    if CUSTOM_PLAN:
        REUSE_EVIDENCE.clear()
        js = 'global.window={};require("./For-AI/AUDIO-TEXT-LIBRARY.js");require("./street-wisdom.js");console.log(JSON.stringify({rules:window.GermanySimulatorAudioText.rules,english:window.GermanySimulatorAudioText.ruleEnglish,definitions:window.StreetWisdom.definitions}));'
        catalog = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT, encoding="utf-8"))
        selected = [dict(job) for job in CUSTOM_PLAN["jobs"] if job["voiceId"] == VOICE]
        assert selected and len({job["clipId"] for job in selected}) == len(selected)
        definition = next(row for row in catalog["definitions"] if row["voiceId"] == VOICE)
        assert {job["ruleIndex"] for job in selected} == set(definition["ruleIndices"]), "Exact actor rule deck changed"
        for job in selected:
            assert re.fullmatch(r"[a-z0-9-]+", job["clipId"]), "Clip identifiers must be safe asset filenames"
            assert job["profileId"] == PROFILE and job["voiceId"] == VOICE
            index = job["ruleIndex"]
            assert isinstance(index, int) and 0 <= index < 11
            assert job["actorId"] == definition["id"] and job["clipId"] == definition["id"] + f"-rule-{index + 1:02}", "Actor/voice/clip ownership differs from actual deck"
            assert job["text"] == catalog["rules"][index][1] and job["english"] == catalog["english"][index], "Actual authored rule changed"
            assert job["sourceLocator"] == f"For-AI/AUDIO-TEXT-LIBRARY.js rules[{index}][1]"
        return selected
    js = 'global.window={}; require("./buergeramt-story.js"); console.log(JSON.stringify(window.BuergeramtStory));'
    story = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT, encoding="utf-8"))
    assert story["clerkIdentity"]["voiceId"] == VOICE and "KNICK" in story["registration"]["speaker"]
    music_root = music_root or Path(os.environ["USERPROFILE"]) / "Music/German emotional voice databases"
    native = music_root / "Secret Tunnel shared voice data/profiles" / PROFILE
    native_record = read(native / "profile.json")
    assert sha(native / "original.wav") == native_record["original_sha256"] == BINDING["originalSha256"]
    assert sha(native / "reference.wav") == native_record["reference_sha256"] == REFERENCE_HASH
    available = {}
    REUSE_EVIDENCE.clear()
    for clip in read(ROOT / "assets/voices/amt-fever/manifest.json")["clips"]:
        approved = clip.get("approval", {}).get("status") == "user-approved"
        matches = (clip["voiceId"] == VOICE and clip["profileId"] == PROFILE and not clip.get("retiredReason")
                   and clip.get("renderer") == BINDING["renderer"] and clip.get("modelRevision") == REVISION
                   and clip.get("referenceSha256") == REFERENCE_HASH and clip.get("processing") == PROCESSING
                   and clip.get("referenceOriginalSha256", BINDING["originalSha256"]) == BINDING["originalSha256"])
        if matches and approved and clip.get("asrWordExact") is True and abs(clip["integratedLufs"] + 18) <= .3 and clip["truePeakDbtp"] <= -1.5:
            assert sha(ROOT / clip["path"]) == clip["sha256"], "Approved fever audio changed"
            available[clip["text"]] = clip
    result = []

    def add(key, text, source):
        if text in available:
            clip = available[text]
            if not any(row["sourceClipId"] == clip["clipId"] for row in REUSE_EVIDENCE):
                REUSE_EVIDENCE.append({"legacyApprovedReuse": True, "sourceManifest": "assets/voices/amt-fever/manifest.json",
                    "sourceClipId": clip["clipId"], "sourceSha256": clip["sha256"], "text": text, "voiceId": VOICE,
                    "profileId": PROFILE, "referenceSha256": REFERENCE_HASH, "renderer": BINDING["renderer"],
                    "modelRevision": REVISION, "processing": PROCESSING, "approval": clip["approval"],
                    "currentNativeProfileEvidence": {"originalSha256": BINDING["originalSha256"], "referenceSha256": REFERENCE_HASH,
                        "profileJsonSha256": sha(native / "profile.json"), "historicalClipOriginalHashRecorded": "referenceOriginalSha256" in clip,
                        "basis": "Current native original/reference files and profile.json verified against selected binding; historical normalized-reference receipt remains distinct"}})
        if text not in available and not any(job["text"] == text for job in result):
            result.append({"clipId": "knick-" + key, "actorId": "clerk", "voiceId": VOICE,
                           "profileId": PROFILE, "text": text, "sourceLocator": source})

    runtime = (ROOT / "buergeramt.js").read_text(encoding="utf-8")
    if ambient:
        lines = json.loads(re.search(r"const ambientLines=(\[\[.*?\]\]);", runtime)[1])
        for index, actor in ((1, "clerk-1"), (2, "clerk-2"), (4, "clerk-4")):
            add("ambient-" + actor, lines[index][1], f"buergeramt.js ambientLines[{index}]")
        assert len(result) == 3
        return result

    for i, text in enumerate(story["outburst"]["lines"]):
        add(f"outburst-{i + 1}", text, f"buergeramt-story.js outburst.lines[{i}]")
    for i, node in enumerate(story["clerk"]):
        add(f"counter-{i + 1}", node["line"], f"buergeramt-story.js clerk[{i}].line")
        for c, choice in enumerate(node["choices"]):
            add(f"counter-{i + 1}-reply-{c + 1}", choice["reply"], f"buergeramt-story.js clerk[{i}].choices[{c}].reply")
    for i, text in enumerate(story["phoneWarnings"]):
        add(f"phone-warning-{i + 1}", text, f"buergeramt-story.js phoneWarnings[{i}]")
    # Extract only static text actually assigned to Knick. Dynamic names/tickets
    # retain the production fallback; no generic number or name is substituted.
    pattern = r'content\((?:story\.clerkIdentity\.speaker|"FRAU KNICK · SCHALTER "\+assignedCounter),\s*("(?:[^"\\]|\\.)*")\s*,'
    for i, match in enumerate(re.finditer(pattern, runtime)):
        add(f"status-{i + 1}", json.loads(match[1]), f"buergeramt.js:{runtime[:match.start()].count(chr(10)) + 1}")
    for key, node in story["registration"]["nodes"].items():
        add(f"registration-{key.lower()}", node["line"], f"buergeramt-story.js registration.nodes.{key}.line")
        for i, choice in enumerate(node["choices"]):
            add(f"registration-{key.lower()}-reply-{i + 1}", choice["reply"], f"buergeramt-story.js registration.nodes.{key}.choices[{i}].reply")
    return result


def spoken_words(text):
    units = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"]
    small = units + ["zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"]
    tens = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"]
    numbers = {str(n): small[n] if n < 20 else (("ein" if n % 10 == 1 else units[n % 10]) + "und" if n % 10 else "") + tens[n // 10] for n in range(100)}
    ordinals = ["", "ersten", "zweiten", "dritten", "vierten", "fünften", "sechsten", "siebten", "achten"]
    text = text.casefold().replace("§", " paragraph ")
    text = re.sub(r"\bam\s+([1-9]|[12]\d|3[01])\.(?=\s|$)",
                  lambda match: "am " + (ordinals[int(match[1])] if int(match[1]) < len(ordinals)
                                           else numbers[match[1]] + ("ten" if int(match[1]) < 20 else "sten")), text)
    text = re.sub(r"\b([01]?\d|2[0-3]):00(?=\s*uhr\b)", r"\1", text)
    text = re.sub(r"\bparagraf\b", "paragraph", text)
    text = re.sub(r"\ba\s*38\b", "a achtunddreißig", text)
    return [numbers.get(word, word).casefold() for word in re.findall(r"\w+", text)]


def same_spoken_words(expected, heard):
    # German ASR may split or join compounds; actual changed letters still fail.
    return "".join(spoken_words(expected)) == "".join(spoken_words(heard))


def reconcile_request(private, frozen, queue, source_hashes):
    identity = lambda rows: [{key: value for key, value in job.items() if key != "sourceLocator"} for job in rows]
    assert identity(frozen["jobs"]) == identity(queue), "Authored dialogue or ownership changed; a fresh request is required"
    original_hash = sha(private / "requests.json")
    history = private / ("requests-before-source-reconcile-" + original_hash[:12] + ".json")
    assert not history.exists() or sha(history) == original_hash
    shutil.copyfile(private / "requests.json", history)
    replacement = {"requestedLineCount": len(queue), "sourceSha256": source_hashes, "jobs": queue, "approvedExistingReuse": REUSE_EVIDENCE,
          "reconciliation": {"previousRequestSha256": original_hash, "basis": "entire authored clip/text/profile/voice/actor set unchanged; source locators may move"}}
    for field in ("authoredPlanSha256", "authoredPlanSourceSha256"):
        if field in frozen:
            replacement[field] = frozen[field]
    write(private / "requests.json", replacement)
    print(f"Reconciled {len(queue)} unchanged authored jobs; preserved {history.name}", flush=True)


def follow_unchanged_source(args, queue, private):
    if not args.follow_source:
        return
    frozen = read(private / "requests.json")
    hashes = source_hashes()
    if frozen["sourceSha256"] != hashes:
        current = jobs(args.ambient, args.music_root)
        reconcile_request(private, frozen, current, hashes)
        locators = {job["clipId"]: job["sourceLocator"] for job in current}
        for job in queue:
            job["sourceLocator"] = locators[job["clipId"]]
    selected = read(ROOT / "For-AI/VOICE-CAST.json")["productionVoices"][VOICE]
    for field in ("profileId", "originalSha256", "referenceSha256", "renderer", "modelRevision", "processing"):
        assert selected.get(field) == BINDING.get(field), f"Selected voice {field} changed; stop synthesis"


def render(args, queue, private):
    global RENDER_CACHE
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    import torch
    import torchaudio
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    from chatterbox.models.t3.inference.alignment_stream_analyzer import LLAMA_ALIGNED_HEADS
    assert importlib.metadata.version("chatterbox-tts") == "0.1.7"
    assert torch.cuda.is_available(), "Existing CUDA authoring runtime is unavailable"
    torch.set_num_threads(2)
    assert args.model_dir.name == REVISION, "Use the fixed cached revision"
    profile = args.music_root / "Secret Tunnel shared voice data/profiles" / PROFILE
    reference = profile / "reference.wav"
    profile_record = read(profile / "profile.json")
    assert sha(reference) == REFERENCE_HASH == profile_record["reference_sha256"]
    assert sha(profile / "original.wav") == profile_record["original_sha256"] == BINDING["originalSha256"]
    cache_key = (str(args.model_dir.resolve()), args.precision)
    model_reused = RENDER_CACHE is not None
    if RENDER_CACHE is None:
        model = ChatterboxMultilingualTTS.from_local(args.model_dir, "cuda")
        RENDER_CACHE = {"key": cache_key, "model": model, "nativeInference": model.t3.inference}
    else:
        assert RENDER_CACHE["key"] == cache_key, "Cached engine/revision/precision changed"
        model = RENDER_CACHE["model"]
        # Restore the native method before installing this profile's wrapper;
        # never nest wrappers with an earlier profile's decode budget/state.
        model.t3.inference = RENDER_CACHE["nativeInference"]
    with torch.inference_mode():
        model.prepare_conditionals(str(reference), exaggeration=.5)
    assert model.conds.t3.speaker_emb.dtype == torch.float32 and model.conds.t3.emotion_adv.dtype == torch.float32, "Reference conditioning must remain float32"
    if args.precision == "fp16":
        model.t3.half()
        torch.cuda.empty_cache()
    # The pinned T3 API exposes max_new_tokens, although generate() hardcodes
    # 1000. Bound runaway short-line decodes, preserving every other argument.
    # Budget exhaustion is a rejected take, never evidence of a complete line.
    original_inference = model.t3.inference
    decode = {}
    attention_modules = [model.t3.tfmr.layers[layer].self_attn for layer, _ in LLAMA_ALIGNED_HEADS]
    cleanup_enabled = True

    def release_new_hooks(baselines):
        removed = 0
        for module, baseline in zip(attention_modules, baselines):
            for key in set(module._forward_hooks) - baseline:
                del module._forward_hooks[key]
                getattr(module, "_forward_hooks_with_kwargs", {}).pop(key, None)
                getattr(module, "_forward_hooks_always_called", {}).pop(key, None)
                removed += 1
        return removed

    def bounded_inference(*arguments, **keywords):
        keywords["max_new_tokens"] = decode["maxSpeechTokens"]
        baselines = [set(module._forward_hooks) for module in attention_modules]
        decode["attentionHooksBefore"] = sum(map(len, baselines))
        inference_start = time.monotonic()
        try:
            tokens = original_inference(*arguments, **keywords)
            decode["generatedSpeechTokens"] = tokens.shape[-1]
            decode["eosReached"] = int(tokens[0, -1].item()) == model.t3.hp.stop_speech_token
            return tokens
        finally:
            decode["t3InferenceSeconds"] = round(time.monotonic() - inference_start, 2)
            decode["temporaryAnalyzerHooksRemoved"] = release_new_hooks(baselines) if cleanup_enabled else 0
            decode["attentionHooksAfter"] = sum(len(module._forward_hooks) for module in attention_modules)

    model.t3.inference = bounded_inference
    print("Cached fixed Chatterbox model ready", flush=True)
    if args.benchmark_hooks:
        import numpy as np
        import random
        job = next(row for row in queue if row["clipId"] == "knick-registration-identity-reply-1")
        baselines = [set(module._forward_hooks) for module in attention_modules]
        comparisons = []
        for enabled in (False, True):
            cleanup_enabled = enabled
            torch.manual_seed(71019)
            np.random.seed(71019)
            random.seed(71019)
            decode.clear()
            decode["maxSpeechTokens"] = min(1000, max(250, 160 + 12 * len(re.findall(r"\w+", job["text"]))))
            start = time.monotonic()
            with torch.inference_mode(), torch.autocast("cuda", dtype=torch.float16, enabled=args.precision == "fp16"):
                audio = model.generate(job["text"], language_id="de", exaggeration=.5, temperature=.65, repetition_penalty=3., cfg_weight=.6)
            digest = hashlib.sha256(audio.numpy().tobytes()).hexdigest()
            row = {"cleanup": enabled, "rawArraySha256": digest, "seconds": round(time.monotonic() - start, 2), **decode}
            row["betweenCallsHooksRemoved"] = release_new_hooks(baselines)
            comparisons.append(row)
            print(json.dumps({"stage": "hook benchmark", **row}), flush=True)
            del audio
            gc.collect()
            torch.cuda.empty_cache()
        cleanup_enabled = True
        write(private / "hook-cleanup-benchmark.json", {"clipId": job["clipId"], "text": job["text"],
              "profileId": PROFILE, "referenceSha256": REFERENCE_HASH, "modelRevision": REVISION,
              "renderer": BINDING["renderer"], "processing": PROCESSING, "seed": 71019,
              "numpyAndPythonSeeds": 71019, "precision": args.precision, "languageId": "de",
              "exaggeration": .5, "temperature": .65, "repetitionPenalty": 3., "cfgWeight": .6,
              "savedAudioTakes": 0, "rawArrayBitIdentical": comparisons[0]["rawArraySha256"] == comparisons[1]["rawArraySha256"], "readings": comparisons})
        assert comparisons[0]["rawArraySha256"] == comparisons[1]["rawArraySha256"], "Inspect any deterministic cleanup discrepancy before production"
    attempts_path = private / "retake-attempts.json"
    retakes = read(attempts_path).get("attempts", []) if attempts_path.exists() else []
    for index, job in enumerate(queue):
        follow_unchanged_source(args, queue, private)
        receipt = private / "raw" / (job["clipId"] + ".json")
        wav = receipt.with_suffix(".wav")
        attempt = 1
        if not receipt.exists() and any(row["clipId"] == job["clipId"] for row in retakes):
            print(json.dumps({"stage": "retake capped after failed final attempt", "clipId": job["clipId"]}), flush=True)
            continue
        if receipt.exists():
            previous = read(receipt)
            assert previous["text"] == job["text"]
            assert_binding(previous)
            assert sha(wav) == previous["rawSha256"]
            if not args.retake_failed:
                continue
            encoded_receipt = private / "encoded" / receipt.name
            checked = read(encoded_receipt) if encoded_receipt.exists() else None
            if checked is None and previous.get("decode", {}).get("eosReached") is True:
                # Known missing/failed EOS is already a technical rejection;
                # other first takes need the independent ASR/level audit first.
                continue
            if checked and same_spoken_words(job["text"], checked["asr"]) and abs(checked["integratedLufs"] + 18) <= .3 and checked["truePeakDbtp"] <= -1.5 and checked.get("decode", {}).get("eosReached") is True:
                continue
            attempt = previous.get("synthesisAttempt", 1)
            if attempt >= 2 or any(row["clipId"] == job["clipId"] for row in retakes):
                print(json.dumps({"stage": "retake capped", "clipId": job["clipId"], "attempts": attempt}), flush=True)
                continue
            archive = private / "rejected" / job["clipId"] / ("attempt-" + str(attempt))
            archive.mkdir(parents=True, exist_ok=True)
            for folder, paths in (("raw", (receipt, wav)), ("encoded", (encoded_receipt, encoded_receipt.with_suffix(".mp3"), encoded_receipt.with_name(job["clipId"] + "-processed.wav")))):
                for path in paths:
                    if folder == "encoded" and not path.exists():
                        continue
                    assert path.resolve().is_relative_to(private.resolve()) and path.is_file()
                    destination = archive / (folder + "-" + path.name)
                    assert not destination.exists(), "Failed take archives are immutable"
                    shutil.move(str(path), str(destination))
            attempt += 1
            retakes.append({"clipId": job["clipId"], "attempt": attempt, "previousRawSha256": previous["rawSha256"],
                            "reason": "One final exact-text take after explicit EOS or independent ASR/level gate failure; previous artifacts archived intact"})
            write(attempts_path, {"attempts": retakes})
        elif args.retake_failed:
            # A crashed final attempt remains a fallback, without an implicit retry.
            continue
        renderer_input = re.sub(r"\bA38\b", "A achtunddreißig", job["text"]) if args.retake_failed else job["text"]
        assert same_spoken_words(job["text"], renderer_input), "Renderer phonetics must preserve every authored spoken word"
        decode.clear()
        decode["maxSpeechTokens"] = min(1000, max(250, 160 + 12 * len(re.findall(r"\w+", renderer_input))))
        seed = 71000 + index + (attempt - 1) * 100000
        torch.manual_seed(seed)
        start = time.monotonic()
        print(json.dumps({"stage": "render", "n": index + 1, "total": len(queue), "clipId": job["clipId"]}), flush=True)
        with torch.inference_mode(), torch.autocast("cuda", dtype=torch.float16, enabled=args.precision == "fp16"):
            audio = model.generate(renderer_input, language_id="de", exaggeration=.5, temperature=.65, repetition_penalty=3., cfg_weight=.6)
        assert torch.isfinite(audio).all(), "Non-finite synthesis output remains private"
        wav.parent.mkdir(parents=True, exist_ok=True)
        torchaudio.save(str(wav), audio.cpu(), model.sr)
        write(receipt, {**job, "seed": seed, "synthesisAttempt": attempt, "referenceSha256": REFERENCE_HASH,
                        "rendererInputText": renderer_input, "decode": dict(decode),
                        "rendererInputBasis": "German letter-number spoken equivalent" if renderer_input != job["text"] else "exact authored source",
                        "requestSha256": sha(private / "requests.json"),
                        "referenceOriginalSha256": profile_record["original_sha256"],
                        "profileJsonSha256": sha(profile / "profile.json"), "rawSha256": sha(wav),
                        "renderer": "ResembleAI/Chatterbox Multilingual V2 0.1.7", "modelRevision": REVISION,
                        "modelLicense": "MIT", "referenceLicense": reference_license(profile_record),
                        "durationSeconds": audio.shape[-1] / model.sr, "renderSeconds": round(time.monotonic() - start, 2),
                        "synthesis": {"temperature": .65, "repetitionPenalty": 3., "cfgWeight": .6, "languageId": "de", "device": "cuda", "precision": args.precision,
                                      "t3WeightPrecision": "float16" if args.precision == "fp16" else "float32", "conditioningPrecision": "float32",
                                      "autocastPrecision": "float16" if args.precision == "fp16" else None, "conditioningCached": True,
                                      "referenceReconditionedForProfile": PROFILE, "referenceConditioningVerifiedFloat32": True,
                                      "modelSessionReused": model_reused, "cpuThreads": 2, "inferenceMode": True},
                        "listening": "pending", "status": "private candidate"})
        print(json.dumps({"stage": "saved", "n": index + 1, "total": len(queue), "seconds": round(time.monotonic() - start, 2)}), flush=True)
        del audio
        gc.collect()
        torch.cuda.empty_cache()


def process(args, queue, private, all_jobs=None):
    global ASR_CACHE
    import numpy as np
    from faster_whisper import WhisperModel
    cache_key = (str(args.asr_model.resolve()), args.asr_device, "int8", args.asr_threads)
    if ASR_CACHE is None:
        model = WhisperModel(str(args.asr_model), device=args.asr_device, compute_type="int8", cpu_threads=args.asr_threads)
        assert model.model.device == args.asr_device, "Independent ASR device changed"
        ASR_CACHE = {"key": cache_key, "model": model, "sha256": sha(args.asr_model / "model.bin"),
                     "device": model.model.device, "effectiveComputeType": model.model.compute_type}
    else:
        assert ASR_CACHE["key"] == cache_key, "Independent ASR model/settings changed"
        model = ASR_CACHE["model"]
    asr_model_hash = ASR_CACHE["sha256"]

    def ff(*arguments):
        return subprocess.run([str(args.ffmpeg), "-hide_banner", "-nostats", *map(str, arguments)], capture_output=True, check=True)

    def measure(path):
        result = ff("-i", path, "-af", "loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json", "-f", "null", "NUL")
        return json.loads(re.search(r'\{\s*"input_i".*?\}', result.stderr.decode("utf-8"), re.S)[0])

    for index, job in enumerate(queue):
        follow_unchanged_source(args, queue, private)
        receipt = private / "encoded" / (job["clipId"] + ".json")
        if receipt.exists():
            assert read(receipt)["text"] == job["text"]
            continue
        raw = private / "raw" / (job["clipId"] + ".wav")
        if args.follow:
            deadline = time.monotonic() + 1200
            while not raw.with_suffix(".json").exists() and time.monotonic() < deadline:
                time.sleep(1)
            if not raw.with_suffix(".json").exists():
                break
        if not raw.with_suffix(".json").exists():
            continue
        take = read(raw.with_suffix(".json"))
        assert take["text"] == job["text"] and sha(raw) == take["rawSha256"]
        assert_binding(take)
        if not generation_complete(take):
            print(json.dumps({"stage": "held before ASR", "n": index + 1, "total": len(queue), "clipId": job["clipId"],
                              "reason": "missing or failed explicit native EOS evidence; selected production fallback"}), flush=True)
            continue
        receipt.parent.mkdir(parents=True, exist_ok=True)
        prepared, mp3 = receipt.with_name(job["clipId"] + "-processed.wav"), receipt.with_suffix(".mp3")
        if PROCESSING is None:
            ff("-y", "-i", raw, "-ar", 48000, prepared)
        else:
            ff("-y", "-i", raw, "-filter_complex", PROCESSING, "-map", "[a]", "-ar", 48000, prepared)
        target = -18.
        for iteration in range(7):
            filt = f"loudnorm=I={target}:TP=-1.8:LRA=11:linear=false"
            ff("-y", "-i", prepared, "-af", filt, "-ar", 48000, "-ac", 1, "-codec:a", "libmp3lame", "-b:a", "128k", mp3)
            checked = measure(mp3)
            delta = -18 - float(checked["input_i"])
            if abs(delta) <= .3 and float(checked["input_tp"]) <= -1.5:
                break
            target += delta
        if abs(delta) > .3 or float(checked["input_tp"]) > -1.5:
            original = measure(prepared)
            gain = 10 ** ((-18 - float(original["input_i"])) / 20)
            for iteration in range(12):
                filt = f"volume={gain},alimiter=limit=0.78:attack=1:release=80:level=false:latency=true"
                ff("-y", "-i", prepared, "-af", filt, "-ar", 48000, "-ac", 1, "-codec:a", "libmp3lame", "-b:a", "128k", mp3)
                checked = measure(mp3)
                delta = -18 - float(checked["input_i"])
                if abs(delta) <= .2 and float(checked["input_tp"]) <= -1.5:
                    break
                gain *= 10 ** (delta / 20)
        technical = abs(delta) <= .3 and float(checked["input_tp"]) <= -1.5 and take.get("decode", {}).get("eosReached") is True
        pcm = ff("-loglevel", "error", "-i", mp3, "-f", "f32le", "-ac", 1, "-ar", 16000, "pipe:1").stdout
        readings = []
        for beam in (1, 5):
            asr_started = time.monotonic()
            segments, _ = model.transcribe(np.frombuffer(pcm, dtype=np.float32).copy(), language="de", beam_size=beam, word_timestamps=True)
            segments = list(segments)
            transcript = " ".join(segment.text.strip() for segment in segments)
            readings.append({"beamSize": beam, "transcript": transcript, "transcribeSeconds": round(time.monotonic() - asr_started, 2)})
            if same_spoken_words(job["text"], transcript):
                break
        encoded = json.loads(subprocess.check_output([str(args.ffmpeg.with_name("ffprobe.exe")), "-v", "error", "-show_format", "-show_streams", "-of", "json", str(mp3)], encoding="utf-8"))
        assert encoded["streams"][0]["sample_rate"] == "48000" and encoded["streams"][0]["channels"] == 1
        exact = same_spoken_words(job["text"], transcript)
        expected = list(re.finditer(r"\w+", job["text"]))
        heard = [(token, word.start, word.end) for segment in segments for word in segment.words for token in re.findall(r"\w+", word.word)]
        cues = [{"at": round(at, 3), "charIndex": word.start(), "word": word[0], "end": round(end, 3)} for word, (_, at, end) in zip(expected, heard)] if exact and len(expected) == len(heard) else []
        take.update({"processing": PROCESSING, "processingSha256": processing_hash(PROCESSING), "normalization": {"targetLufs": -18, "targetTruePeakDbtp": -1.5, "filter": filt, "iterations": iteration + 1},
                     "integratedLufs": float(checked["input_i"]), "truePeakDbtp": float(checked["input_tp"]),
                     "asr": transcript, "asrWordExact": exact, "asrLiteralWordExact": spoken_words(job["text"]) == spoken_words(transcript),
                     "asrNormalization": ASR_NORMALIZATION,
                     "asrModel": f"independent faster-whisper, cached local model, {ASR_CACHE['device']} int8 (effective {ASR_CACHE['effectiveComputeType']}), no script prompt", "asrCpuThreads": args.asr_threads,
                     "asrDevice": ASR_CACHE["device"], "asrEffectiveComputeType": ASR_CACHE["effectiveComputeType"],
                     "asrLanguageId": "de", "asrComputeType": "int8", "asrScriptPrompt": None,
                     "asrBeamSize": beam, "asrReadings": readings,
                     "asrModelSha256": asr_model_hash,
                     "asrModelDirectoryName": args.asr_model.name, "wordCues": cues, "sha256": sha(mp3),
                     "durationSeconds": float(encoded["format"]["duration"]), "bytes": mp3.stat().st_size,
                     "sampleRateHz": 48000, "channels": 1, "bitrateBitsPerSecond": 128000,
                     "file": PUBLIC_ASSET_FAMILY + "/" + mp3.name, "status": "eligible exact-text recording; human listening pending" if exact and technical else "held private; selected production fallback"})
        write(receipt, take)
        print(json.dumps({"stage": "processed", "n": index + 1, "total": len(queue), "clipId": job["clipId"], "exact": exact, "technical": technical, "asr": transcript}, ensure_ascii=False), flush=True)
    manifest(all_jobs if all_jobs is not None else read(private / "requests.json")["jobs"], private, args.ambient)


def benchmark_asr(args, private):
    """Compare small CPU thread counts on one unchanged, eligible encoded clip."""
    import numpy as np
    from faster_whisper import WhisperModel

    def memory_status():
        if os.name != "nt":
            return None
        import ctypes
        from ctypes import wintypes

        class MemoryStatus(ctypes.Structure):
            _fields_ = [("length", wintypes.DWORD), ("loadPercent", wintypes.DWORD)] + [(field, ctypes.c_ulonglong) for field in ("totalPhysical", "availablePhysical", "totalPageFile", "availablePageFile", "totalVirtual", "availableVirtual", "availableExtendedVirtual")]

        state = MemoryStatus()
        state.length = ctypes.sizeof(state)
        assert ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(state)), "Unable to observe host memory headroom"
        return {"availableRamBytes": state.availablePhysical, "totalRamBytes": state.totalPhysical, "memoryLoadPercent": state.loadPercent}
    candidates = [(path, read(path)) for path in (private / "encoded").glob("*.json")]
    candidates += [(path, read(path)) for path in (private / "rejected").glob("*/attempt-*/encoded-*.json")]
    receipt, take = max(((path, row) for path, row in candidates if row["asrWordExact"]), key=lambda pair: pair[1]["durationSeconds"])
    mp3 = receipt.with_suffix(".mp3")
    assert sha(mp3) == take["sha256"]
    pcm = subprocess.check_output([str(args.ffmpeg), "-loglevel", "error", "-i", str(mp3), "-f", "f32le", "-ac", "1", "-ar", "16000", "pipe:1"])
    samples = np.frombuffer(pcm, dtype=np.float32).copy()
    rows = []
    for threads in (1, 4):
        before_load = memory_status()
        start = time.monotonic()
        model = WhisperModel(str(args.asr_model), device="cpu", compute_type="int8", cpu_threads=threads)
        load_seconds = time.monotonic() - start
        after_load = memory_status()
        start = time.monotonic()
        segments, _ = model.transcribe(samples, language="de", beam_size=1, word_timestamps=True)
        transcript = " ".join(segment.text.strip() for segment in segments)
        row = {"cpuThreads": threads, "beamSize": 1, "loadSeconds": round(load_seconds, 2),
               "transcribeSeconds": round(time.monotonic() - start, 2), "transcript": transcript,
               "spokenWordExact": same_spoken_words(take["text"], transcript),
               "memoryBeforeLoad": before_load, "memoryAfterLoad": after_load, "memoryAfterTranscription": memory_status()}
        rows.append(row)
        print(json.dumps({"stage": "ASR benchmark", **row}, ensure_ascii=False), flush=True)
        del model
        gc.collect()
    write(private / "asr-thread-benchmark.json", {"clipId": take["clipId"], "sha256": sha(mp3),
          "selection": "Immutable previously ASR-exact encoded clip, including rejected archive if needed; performance benchmark grants no production eligibility",
          "durationSeconds": take["durationSeconds"], "modelDirectoryName": args.asr_model.name,
          "modelSha256": sha(args.asr_model / "model.bin"),
          "computeType": "int8", "language": "de", "scriptPrompt": None, "readings": rows})


def manifest(queue, private, ambient=False):
    filename = manifest_name(ambient)
    public_path = ROOT / PUBLIC_ASSET_FAMILY / filename
    existing = {row["clipId"]: row for row in read(public_path)["clips"]} if public_path.exists() else {}
    identity_keys = ("clipId", "voiceId", "profileId", "text", "referenceSha256", "referenceOriginalSha256", "renderer", "modelRevision", "processing")
    family_reference_license = reference_license({}) if CUSTOM_PLAN else None
    clips, held = [], []
    for job in queue:
        receipt = private / "encoded" / (job["clipId"] + ".json")
        if not receipt.exists():
            raw_receipt = private / "raw" / (job["clipId"] + ".json")
            waiting = raw_receipt.exists()
            if waiting and not generation_complete(read(raw_receipt)):
                held.append({**job, "reason": "held private; selected production fallback", "failedGates": ["missing or failed explicit native EOS evidence"],
                             "candidateRawSha256": read(raw_receipt)["rawSha256"]})
            else:
                held.append({**job, "reason": ("awaiting independent final audit" if waiting else "not rendered") + "; selected production fallback"})
            continue
        take = read(receipt)
        assert take["text"] == job["text"] and take["clipId"] == job["clipId"]
        assert_binding(take)
        assert take["processing"] == PROCESSING and take["modelRevision"] == REVISION
        if CUSTOM_PLAN:
            # Cached street takes predate the matched cast license annotation.
            # Rebuilding their manifest must retain this verified provenance.
            take["referenceLicense"] = family_reference_license
        take["asrLiteralWordExact"] = spoken_words(take["text"]) == spoken_words(take["asr"])
        take["asrWordExact"] = same_spoken_words(take["text"], take["asr"])
        take["asrNormalization"] = ASR_NORMALIZATION
        take["processingSha256"] = processing_hash(take["processing"])
        if take["asrWordExact"] and abs(take["integratedLufs"] + 18) <= .3 and take["truePeakDbtp"] <= -1.5 and generation_complete(take):
            prior = existing.get(take["clipId"], {})
            if prior and all(prior.get(key) == take.get(key) for key in identity_keys):
                if "english" in prior:
                    take["english"] = prior["english"]
                if "approval" in prior:
                    # Authored-text translation and voice use authorization can
                    # survive a retake; human listening is tied to encoded bytes.
                    take["approval"] = {key: prior["approval"][key] for key in ("status", "date", "instruction", "scope") if key in prior["approval"]}
                    for key in ("listeningConfirmed", "listeningVerified"):
                        if key in prior["approval"] or prior.get("sha256") != take["sha256"]:
                            take["approval"][key] = prior["approval"].get(key, False) if prior.get("sha256") == take["sha256"] else False
                if prior.get("sha256") == take["sha256"]:
                    if "listening" in prior:
                        take["listening"] = prior["listening"]
                    for key in ("listeningConfirmed", "listeningVerified"):
                        if key in prior:
                            take[key] = prior[key]
                else:
                    take["listening"] = "pending"
                    for key in ("listeningConfirmed", "listeningVerified"):
                        if key in prior:
                            take[key] = False
            destination = ROOT / take["file"]
            assert take["file"] == PUBLIC_ASSET_FAMILY + "/" + job["clipId"] + ".mp3", "Unexpected public asset path"
            destination.parent.mkdir(parents=True, exist_ok=True)
            assert sha(receipt.with_suffix(".mp3")) == take["sha256"], "Private encoded bytes changed before public promotion"
            shutil.copyfile(receipt.with_suffix(".mp3"), destination)
            take["status"] = "eligible exact-text recording; human listening pending"
            assert sha(ROOT / take["file"]) == take["sha256"]
            clips.append(take)
        else:
            failures = []
            if not take["asrWordExact"]:
                failures.append("independent spoken-word equivalence")
            if abs(take["integratedLufs"] + 18) > .3 or take["truePeakDbtp"] > -1.5:
                failures.append("encoded loudness/true peak")
            if take.get("decode", {}).get("eosReached") is not True:
                failures.append("missing explicit native EOS evidence" if "eosReached" not in take.get("decode", {}) else "token budget exhausted without EOS")
            held.append({**job, "reason": "held private; selected production fallback", "failedGates": failures,
                         "candidateSha256": take["sha256"], "asr": take["asr"]})
    write(public_path, {"schemaVersion": 1, "voiceId": VOICE, "profileId": PROFILE, "fallback": BINDING.get("fallback", "browser"),
          "status": "same-profile technical and independent ASR audit; perceptual listening not independently verified",
          "generatedLineCount": sum((private / "raw" / (job["clipId"] + ".json")).exists() for job in queue),
          "requestedLineCount": len(queue), "lineCount": len(clips), "clips": clips, "heldPrivate": held,
          "approvedExistingReuse": read(private / "requests.json").get("approvedExistingReuse", [])})


def check_manifest(queue, ambient=False):
    assert same_spoken_words("A38, § 17: an meinem Schalter Lärm.", "A achtunddreißig, Paragraph siebzehn: an meinem Schalterlärm.")
    assert not same_spoken_words("einem Grashalm", "einen Grashalm")
    assert not same_spoken_words("Formular A38", "Formular 88")
    assert not same_spoken_words("Ihren Wohnsitz", "Ihrem Wohnsitz")
    document = read(ROOT / PUBLIC_ASSET_FAMILY / manifest_name(ambient))
    current = {job["clipId"]: job for job in queue}
    for clip in document["clips"]:
        assert clip["text"] == current[clip["clipId"]]["text"]
        assert_binding(clip)
        assert clip["modelRevision"] == REVISION and clip["processing"] == PROCESSING
        assert clip["processingSha256"] == processing_hash(PROCESSING)
        assert clip["referenceOriginalSha256"] == BINDING["originalSha256"]
        assert same_spoken_words(clip["text"], clip["asr"]) and clip["asrWordExact"]
        assert generation_complete(clip), "Missing or failed explicit native EOS evidence remains private"
        assert abs(clip["integratedLufs"] + 18) <= .3 and clip["truePeakDbtp"] <= -1.5
        assert sha(ROOT / clip["file"]) == clip["sha256"]
        assert clip["file"] == PUBLIC_ASSET_FAMILY + "/" + clip["clipId"] + ".mp3"
    print(f'Verified {len(document["clips"])} fixed-profile encoded clips; {len(document["heldPrivate"])} selected production fallbacks')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--music-root", type=Path, required=True)
    parser.add_argument("--voice-id", default="amt-brunhilde-knick", help="Selected production voice, or all for one cached-model family batch; other characters require --request-file")
    parser.add_argument("--request-file", type=Path, help="Frozen street-wisdom family plan; shared synthesis and audit pipeline")
    parser.add_argument("--model-dir", type=Path)
    parser.add_argument("--asr-model", type=Path)
    parser.add_argument("--ffmpeg", type=Path)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--ambient", action="store_true", help="Use the separate three-line clerk ambient supplement without changing the main request")
    parser.add_argument("--precision", choices=("fp32", "fp16"), default="fp32", help="fp16 stores the T3 language model in half precision and enables CUDA autocast; reference conditioning remains float32")
    parser.add_argument("--follow", action="store_true", help="Keep the CPU ASR model loaded and await each completed raw receipt, up to 20 minutes per line")
    parser.add_argument("--follow-source", action="store_true", help="Preserve source snapshots and reconcile unrelated edits only when every frozen authored voice request is unchanged")
    parser.add_argument("--asr-threads", type=int, choices=(1, 2, 4), default=1)
    parser.add_argument("--asr-device", choices=("cpu", "cuda"), default="cpu", help="Native cached-model device; CUDA requires existing compatible libraries in this process")
    parser.add_argument("--retake-failed", action="store_true", help="With --render, archive failed audited takes and make at most one final attempt per line")
    parser.add_argument("--benchmark-hooks", action="store_true", help="With --render, verify native versus cleaned-up repeated-line arrays without saving extra audio takes")
    mode = parser.add_mutually_exclusive_group(required=True)
    for name in ("plan", "reconcile-source", "render", "process", "benchmark-asr", "manifest", "check"):
        mode.add_argument("--" + name, action="store_true")
    args = parser.parse_args()
    if args.voice_id == "all":
        assert args.request_file and not args.ambient, "All-voice batches require a frozen custom family plan"
        for voice in dict.fromkeys(job["voiceId"] for job in read(args.request_file)["jobs"]):
            args.voice_id = voice
            execute(args)
    else:
        execute(args)


def execute(args):
    configure_request(args)
    assert not args.retake_failed or args.render, "Retake selection applies only to rendering"
    assert not args.benchmark_hooks or args.render, "Hook comparison applies only to rendering"
    if os.name == "nt" and (args.render or args.process or args.benchmark_asr):
        import ctypes
        from ctypes import wintypes
        kernel = ctypes.windll.kernel32
        kernel.GetCurrentProcess.restype = wintypes.HANDLE
        kernel.SetPriorityClass.argtypes = (wintypes.HANDLE, wintypes.DWORD)
        assert kernel.SetPriorityClass(kernel.GetCurrentProcess(), 0x20), "Unable to set normal authoring process priority"
    queue = jobs(args.ambient, args.music_root)
    private = args.music_root / PRIVATE_REVIEW_FAMILY
    if CUSTOM_PLAN:
        private = private / VOICE
    assert private.resolve().is_relative_to(args.music_root.resolve())
    if args.ambient:
        private = private / "ambient"
    private = private.resolve()
    assert not private.is_relative_to(ROOT.resolve()), "Private authoring files must stay outside the game checkout"
    if args.check:
        check_manifest(queue, args.ambient)
        return
    hashes = source_hashes()
    if args.plan:
        if CUSTOM_PLAN and not args.follow_source:
            assert all(hashes[name] == value for name, value in CUSTOM_PLAN["sourceSha256"].items()), "Supplied authored plan source changed; refresh the plan before freezing"
        frozen_plan = {"requestedLineCount": len(queue), "sourceSha256": hashes, "jobs": queue, "approvedExistingReuse": REUSE_EVIDENCE}
        if CUSTOM_PLAN:
            frozen_plan.update({"authoredPlanSha256": sha(args.request_file), "authoredPlanSourceSha256": CUSTOM_PLAN["sourceSha256"]})
        write(private / "requests.json", frozen_plan)
        print(json.dumps({"requestedLineCount": len(queue), "registrationLineCount": sum("registration-" in job["clipId"] for job in queue), "privateRoot": str(private)}, ensure_ascii=False))
        return
    frozen = read(private / "requests.json")
    if args.reconcile_source or (args.follow_source and (frozen["sourceSha256"] != hashes or frozen["jobs"] != queue)):
        reconcile_request(private, frozen, queue, hashes)
        frozen = read(private / "requests.json")
        if args.reconcile_source:
            return
    assert frozen["sourceSha256"] == hashes, "Source changed; reconcile the frozen request before resuming"
    assert frozen["jobs"] == queue, "Exact dialogue/profile requests changed; reconcile before resuming"
    if args.manifest:
        manifest(queue, private, args.ambient)
    elif args.render:
        render(args, queue[:args.limit] if args.limit else queue, private)
    elif args.benchmark_asr:
        benchmark_asr(args, private)
    else:
        process(args, queue[:args.limit] if args.limit else queue, private, queue)


if __name__ == "__main__":
    main()
