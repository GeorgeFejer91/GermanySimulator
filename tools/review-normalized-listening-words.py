"""German-pinned Whisper check of private normalized candidate listening MP3s.

Diagnostic only: a transcript score never approves a take or changes game audio.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import importlib.util
import json
import subprocess
import tempfile
import time
from pathlib import Path


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def load_word_score():
    source = Path(__file__).with_name("review-candidate-asr.py")
    spec = importlib.util.spec_from_file_location("candidate_asr_for_normalized_audio", source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.word_score


def save(path: Path, metadata: dict, rows: list[dict]) -> None:
    result = dict(metadata, clips=sorted(rows, key=lambda row: row["clipId"]),
                  completedCount=len(rows),
                  diagnosticExactCount=sum(row["normalizedWordPercent"] == 100 for row in rows))
    temporary = path.with_name(path.name + ".part")
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)
    csv_path = path.with_suffix(".csv")
    temporary = csv_path.with_name(csv_path.name + ".part")
    with temporary.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]) if rows else [], lineterminator="\n")
        if rows:
            writer.writeheader()
            writer.writerows(sorted(rows, key=lambda row: row["clipId"]))
    temporary.replace(csv_path)


def compare_originals(root: Path, normalized: Path, clips: list[dict],
                      reviewed: list[dict], asr: Path, ffmpeg: Path,
                      model: Path, word_score, metadata: dict) -> None:
    reviewed_by_id = {row["clipId"]: row for row in reviewed}
    targets = [clip for clip in clips if clip["asrWordExact"] and
               reviewed_by_id[clip["clipId"]]["normalizedWordPercent"] < 100]
    path = normalized / "original-comparison.json"
    previous = json.loads(path.read_text(encoding="utf-8")) if path.is_file() else {}
    prior = {row["clipId"]: row for row in previous.get("clips", [])}
    if len(prior) != len(previous.get("clips", [])):
        raise RuntimeError("Duplicate clip ID in original comparison")
    rows = []

    def persist() -> None:
        result = {key: metadata[key] for key in
                  ("sourceManifestSha256", "normalizedManifestSha256", "asrBinarySha256",
                   "whisperModelSha256", "whisperConfigSha256", "whisperTokenizerSha256",
                   "wordScorerVersion")}
        result.update({"schemaVersion": 1, "status": "diagnostic_only; listening_pending",
                       "reason": "Original manifest marked these words literal, but the normalized MP3's German-pinned score is below 100%.",
                       "targetCount": len(targets), "completedCount": len(rows),
                       "clips": sorted(rows, key=lambda row: row["clipId"])})
        temporary = path.with_name(path.name + ".part")
        temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        temporary.replace(path)

    for clip in targets:
        scored = reviewed_by_id[clip["clipId"]]
        source = (root / clip["path"]).resolve(strict=True)
        if not source.is_relative_to(root) or digest(source) != clip["sha256"]:
            raise RuntimeError(f"Original candidate changed: {clip['clipId']}")
        old = prior.get(clip["clipId"])
        if (old and all(previous.get(key) == metadata[key] for key in
                        ("asrBinarySha256", "whisperModelSha256", "whisperConfigSha256",
                         "whisperTokenizerSha256")) and
                old["sourceSha256"] == clip["sha256"] and
                old["normalizedSha256"] == scored["outputSha256"] and
                old["script"] == clip["text"]):
            old["originalGermanPinnedPercent"] = word_score(
                clip["text"], old["originalGermanPinnedTranscript"])
            old["normalizedGermanPinnedTranscript"] = scored["normalizedTranscript"]
            old["normalizedGermanPinnedPercent"] = scored["normalizedWordPercent"]
            rows.append(old)
            continue
        with tempfile.TemporaryDirectory(prefix="gs-original-compare-") as temp:
            wav = Path(temp) / "clip.wav"
            subprocess.run([str(ffmpeg), "-v", "error", "-nostdin", "-y", "-i",
                            str(source), "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le",
                            str(wav)], check=True, capture_output=True, timeout=120)
            result = subprocess.run([str(asr), str(model), str(wav), "de"],
                                    check=True, capture_output=True, text=True,
                                    encoding="utf-8", timeout=180)
        transcript = json.loads(result.stdout)["transcript"]
        rows.append({"clipId": clip["clipId"], "voiceId": clip["voiceId"],
                     "script": clip["text"], "sourceSha256": clip["sha256"],
                     "normalizedSha256": scored["outputSha256"],
                     "originalGermanPinnedTranscript": transcript,
                     "originalGermanPinnedPercent": word_score(clip["text"], transcript),
                     "normalizedGermanPinnedTranscript": scored["normalizedTranscript"],
                     "normalizedGermanPinnedPercent": scored["normalizedWordPercent"],
                     "humanListening": "pending"})
        persist()
        print(json.dumps({"comparison": clip["clipId"],
                          "originalPercent": rows[-1]["originalGermanPinnedPercent"],
                          "normalizedPercent": rows[-1]["normalizedGermanPinnedPercent"],
                          "completed": len(rows)}, ensure_ascii=False), flush=True)
    persist()
    print(json.dumps({"comparisonCompleted": len(rows), "targetCount": len(targets)},
                     ensure_ascii=False), flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--game-root", required=True, type=Path)
    parser.add_argument("--normalized-dir", required=True, type=Path)
    parser.add_argument("--asr", required=True, type=Path)
    parser.add_argument("--ffmpeg", required=True, type=Path)
    parser.add_argument("--model", required=True, type=Path)
    parser.add_argument("--max-clips", type=int, default=0)
    parser.add_argument("--compare-original-for-regressions", action="store_true")
    args = parser.parse_args()
    root = args.game_root.resolve(strict=True)
    normalized = args.normalized_dir.resolve(strict=True)
    asr, ffmpeg, model = (path.resolve(strict=True) for path in
                          (args.asr, args.ffmpeg, args.model))
    word_score = load_word_score()
    source_manifest_path = root / "assets/voices/candidate-dialogue/manifest.json"
    source_manifest = json.loads(source_manifest_path.read_text(encoding="utf-8"))
    copies_path = normalized / "manifest.json"
    copies_manifest = json.loads(copies_path.read_text(encoding="utf-8"))
    clips = source_manifest["clips"]
    copies = {row["clipId"]: row for row in copies_manifest["copies"]}
    if (copies_manifest["sourceManifestSha256"] != digest(source_manifest_path) or
            len(clips) != source_manifest["lineCount"] or
            len(copies) != len(clips) or len(copies_manifest["copies"]) != len(clips)):
        raise RuntimeError("Normalized copy set does not match the current candidate manifest")
    asr_hash = digest(asr)
    model_hash = digest(model / "whisper-large-v3-turbo-q4_0.gguf")
    config_hash = digest(model / "config.json")
    tokenizer_hash = digest(model / "tokenizer.json")
    metadata = {"schemaVersion": 1,
                "status": "diagnostic_only; human_listening_and_rights_review_pending",
                "note": "German-only Whisper may misread Denglisch. The normalized MP3s are private audition copies, not game assets.",
                "candidateCount": len(clips), "sourceManifestSha256": digest(source_manifest_path),
                "normalizedManifestSha256": digest(copies_path),
                "asrLanguageHint": "de", "asrBinarySha256": asr_hash,
                "whisperModelSha256": model_hash,
                "whisperConfigSha256": config_hash,
                "whisperTokenizerSha256": tokenizer_hash,
                "wordScorerVersion": "de-written-number-clock-compound-v3"}
    report_path = normalized / "word-review.json"
    previous = json.loads(report_path.read_text(encoding="utf-8")) if report_path.is_file() else {}
    prior = {row["clipId"]: row for row in previous.get("clips", [])}
    if len(prior) != len(previous.get("clips", [])):
        raise RuntimeError("Duplicate clip IDs in saved word review")
    rows = []
    made = 0
    for index, clip in enumerate(clips, 1):
        copy = copies[clip["clipId"]]
        if (copy["sourceSha256"] != clip["sha256"] or
                copy["profileId"] != clip["profileId"] or
                copy["voiceId"] != clip["voiceId"] or
                copy["script"] != clip["text"]):
            raise RuntimeError(f"Normalized speaker/source binding mismatch: {clip['clipId']}")
        audio = (normalized / copy["copyFile"]).resolve(strict=True)
        if not audio.is_relative_to(normalized) or digest(audio) != copy["outputSha256"]:
            raise RuntimeError(f"Normalized MP3 path/hash mismatch: {clip['clipId']}")
        old = prior.get(clip["clipId"])
        if (old and previous.get("asrBinarySha256") == asr_hash and
                previous.get("whisperModelSha256") == model_hash and
                previous.get("whisperConfigSha256") == config_hash and
                previous.get("whisperTokenizerSha256") == tokenizer_hash and
                old.get("outputSha256") == copy["outputSha256"] and
                old.get("script") == clip["text"] and
                old.get("profileId") == clip["profileId"]):
            old["normalizedWordPercent"] = word_score(clip["text"], old["normalizedTranscript"])
            rows.append(old)
            continue
        if args.max_clips and made >= args.max_clips:
            continue
        with tempfile.TemporaryDirectory(prefix="gs-normalized-asr-") as temp:
            wav = Path(temp) / "clip.wav"
            subprocess.run([str(ffmpeg), "-v", "error", "-nostdin", "-y", "-i",
                            str(audio), "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le",
                            str(wav)], check=True, capture_output=True, timeout=120)
            started = time.monotonic()
            result = subprocess.run([str(asr), str(model), str(wav), "de"],
                                    check=True, capture_output=True, text=True,
                                    encoding="utf-8", timeout=180)
            elapsed = round(time.monotonic() - started, 2)
        transcript = json.loads(result.stdout)["transcript"]
        percent = word_score(clip["text"], transcript)
        rows.append({"clipId": clip["clipId"], "voiceId": clip["voiceId"],
                     "profileId": clip["profileId"], "script": clip["text"],
                     "originalManifestTranscript": clip["asr"],
                     "normalizedTranscript": transcript,
                     "normalizedWordPercent": percent,
                     "sourceSha256": clip["sha256"],
                     "outputSha256": copy["outputSha256"],
                     "audioFile": copy["copyFile"], "asrSeconds": elapsed,
                     "humanListening": "pending"})
        made += 1
        save(report_path, metadata, rows)
        print(json.dumps({"index": index, "clipId": clip["clipId"],
                          "wordPercent": percent, "completed": len(rows)},
                         ensure_ascii=False), flush=True)
    save(report_path, metadata, rows)
    print(json.dumps({"completed": len(rows), "candidateCount": len(clips),
                      "diagnosticExact": sum(row["normalizedWordPercent"] == 100 for row in rows)},
                     ensure_ascii=False), flush=True)
    if args.compare_original_for_regressions:
        if len(rows) != len(clips):
            raise RuntimeError("Complete normalized word review before comparing originals")
        compare_originals(root, normalized, clips, rows, asr, ffmpeg,
                          model, word_score, metadata)


if __name__ == "__main__":
    main()
