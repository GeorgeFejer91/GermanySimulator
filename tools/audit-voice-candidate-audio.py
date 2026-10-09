"""Check the encoded 223-clip preview catalogue for measurable audio defects.

This is a technical triage report. It cannot approve words, emotion, speaker
identity, naturalness, model rights, or inclusion in normal gameplay.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import re
import subprocess
from pathlib import Path


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def run(command: list[str]) -> str:
    result = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if result.returncode:
        raise RuntimeError(f"Command failed for {command[-1]}: {result.stderr[-500:]}")
    return result.stdout + result.stderr


def preserve_review_decisions(review: list[dict], old_rows: list[dict]) -> None:
    decision_fields = ("heardWords", "speakerIdentityFits", "demeanorFits",
                       "intonationFits", "artifactsAbsent", "sourceRightsCleared",
                       "approveForGame", "reviewNotes")
    old_by_id = {item["clipId"]: item for item in old_rows}
    if len(old_by_id) != len(old_rows):
        raise RuntimeError("Duplicate clip IDs in existing human-review queue")
    for item in review:
        old = old_by_id.get(item["clipId"])
        if old and all(old.get(key) == item[key] for key in
                       ("mp3Sha256", "voiceId", "profileId", "script")):
            for key in decision_fields:
                item[key] = old.get(key, "")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--game-root", required=True, type=Path)
    parser.add_argument("--ffmpeg", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--normalized-dir", type=Path,
                        help="Optional complete private normalized listening set with encoded word review")
    args = parser.parse_args()
    root = args.game_root.resolve(strict=True)
    ffmpeg = args.ffmpeg.resolve(strict=True)
    ffprobe = ffmpeg.with_name("ffprobe.exe" if ffmpeg.suffix.lower() == ".exe" else "ffprobe")
    ffprobe.resolve(strict=True)
    manifest_path = root / "assets/voices/candidate-dialogue/manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    clips = manifest["clips"]
    if len(clips) != manifest["lineCount"] or len({clip["clipId"] for clip in clips}) != len(clips):
        raise RuntimeError("Candidate manifest count or clip IDs are inconsistent")
    cast_path = root / "For-AI/VOICE-CAST.json"
    cast = json.loads(cast_path.read_text(encoding="utf-8"))
    speakers = {entry["voiceId"]: entry for entry in cast["characters"] + cast["roleProfiles"]}
    if len(speakers) != len(cast["characters"]) + len(cast["roleProfiles"]):
        raise RuntimeError("Duplicate cast voice ID")
    rows = []
    for clip in clips:
        audio = (root / clip["path"]).resolve(strict=True)
        if not audio.is_relative_to(root) or digest(audio) != clip["sha256"]:
            raise RuntimeError(f"Candidate path/hash mismatch: {clip['clipId']}")
        probe = json.loads(run([str(ffprobe), "-v", "error", "-show_entries", "format=duration",
                                "-of", "json", str(audio)]))
        duration = float(probe["format"]["duration"])
        log = run([str(ffmpeg), "-hide_banner", "-nostdin", "-i", str(audio),
                   "-af", "silencedetect=noise=-50dB:d=0.25,volumedetect", "-f", "null", "-"])
        loud_log = run([str(ffmpeg), "-hide_banner", "-nostdin", "-i", str(audio),
                        "-af", "loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"])
        loud_match = re.search(r'\{\s*"input_i".*?\}', loud_log, flags=re.S)
        if not loud_match:
            raise RuntimeError(f"Missing loudness analysis: {clip['clipId']}")
        loud = json.loads(loud_match.group(0))
        integrated = float(loud["input_i"])
        true_peak = float(loud["input_tp"])
        integrated = round(integrated, 2) if math.isfinite(integrated) else None
        true_peak = round(true_peak, 2) if math.isfinite(true_peak) else None
        mean = re.search(r"mean_volume:\s*([-\d.]+) dB", log)
        peak = re.search(r"max_volume:\s*([-\d.]+) dB", log)
        if not mean or not peak:
            raise RuntimeError(f"Missing level analysis: {clip['clipId']}")
        silences = [(float(start), float(end)) for start, end in re.findall(
            r"silence_start:\s*([\d.]+).*?silence_end:\s*([\d.]+)", log, flags=re.S)]
        leading = silences[0][1] if silences and silences[0][0] <= 0.03 else 0.0
        trailing = duration - silences[-1][0] if silences and abs(silences[-1][1] - duration) <= 0.15 else 0.0
        interior = max((end - start for start, end in silences
                        if start > 0.03 and end < duration - 0.15), default=0.0)
        mean_db, peak_db = float(mean.group(1)), float(peak.group(1))
        flags = []
        if abs(duration - clip["durationSeconds"]) > 0.20:
            flags.append("duration_mismatch")
        if peak_db >= -0.1:
            flags.append("near_full_scale_peak")
        if true_peak is None or true_peak > -1.5:
            flags.append("true_peak_above_delivery_limit")
        if mean_db <= -32:
            flags.append("low_average_level")
        if integrated is None or abs(integrated + 18) > 2.0:
            flags.append("loudness_outside_review_band")
        if leading > 1.0:
            flags.append("long_leading_silence")
        if trailing > 1.5:
            flags.append("long_trailing_silence")
        if interior > 3.0:
            flags.append("long_internal_silence")
        rows.append({"clipId": clip["clipId"], "voiceId": clip["voiceId"],
                     "path": clip["path"], "sha256": clip["sha256"],
                     "manifestDurationSeconds": clip["durationSeconds"],
                     "encodedDurationSeconds": round(duration, 3),
                     "meanDbfs": mean_db, "samplePeakDbfs": peak_db,
                     "integratedLufs": integrated, "truePeakDbtp": true_peak,
                     "leadingSilenceSeconds": round(leading, 3),
                     "trailingSilenceSeconds": round(trailing, 3),
                     "longestInteriorSilenceSeconds": round(interior, 3),
                     "technicalReviewFlags": ";".join(flags)})
    output = args.output_dir.resolve()
    output.mkdir(parents=True, exist_ok=True)
    diagnostic_path = output / "VOICE-CANDIDATE-GERMAN-ASR-REVIEW.json"
    diagnostic = json.loads(diagnostic_path.read_text(encoding="utf-8")) if diagnostic_path.is_file() else {}
    if diagnostic and diagnostic["manifestSha256"] != digest(manifest_path):
        raise RuntimeError("German ASR diagnostic refers to a different candidate manifest")
    diagnostic_by_id = {item["clipId"]: item for item in diagnostic.get("clips", [])}
    if len(diagnostic_by_id) != len(diagnostic.get("clips", [])):
        raise RuntimeError("Duplicate clip IDs in German ASR diagnostic")
    normalized_dir = args.normalized_dir.resolve(strict=True) if args.normalized_dir else None
    normalized_manifest_path = normalized_dir / "manifest.json" if normalized_dir else None
    normalized_words_path = normalized_dir / "word-review.json" if normalized_dir else None
    comparison_path = normalized_dir / "original-comparison.json" if normalized_dir else None
    normalized_copies = {}
    normalized_words = {}
    comparisons = {}
    if normalized_dir:
        if not normalized_dir.is_relative_to(output):
            raise RuntimeError("Normalized listening set must be inside the Music output root")
        normalized_manifest = json.loads(normalized_manifest_path.read_text(encoding="utf-8"))
        normalized_report = json.loads(normalized_words_path.read_text(encoding="utf-8"))
        if (normalized_manifest["sourceManifestSha256"] != digest(manifest_path) or
                normalized_report["normalizedManifestSha256"] != digest(normalized_manifest_path) or
                normalized_manifest["completedCount"] != len(clips) or
                normalized_report["completedCount"] != len(clips)):
            raise RuntimeError("Normalized listening set or word review is incomplete or stale")
        normalized_copies = {item["clipId"]: item for item in normalized_manifest["copies"]}
        normalized_words = {item["clipId"]: item for item in normalized_report["clips"]}
        if len(normalized_copies) != len(clips) or len(normalized_words) != len(clips):
            raise RuntimeError("Duplicate or missing normalized listening clip IDs")
        if comparison_path.is_file():
            comparison = json.loads(comparison_path.read_text(encoding="utf-8"))
            if (comparison["sourceManifestSha256"] != digest(manifest_path) or
                    comparison["normalizedManifestSha256"] != digest(normalized_manifest_path) or
                    comparison["completedCount"] != comparison["targetCount"]):
                raise RuntimeError("Original/normalized ASR comparison is incomplete or stale")
            comparisons = {item["clipId"]: item for item in comparison["clips"]}
            if len(comparisons) != comparison["completedCount"]:
                raise RuntimeError("Duplicate clip ID in original/normalized ASR comparison")
    fields = list(rows[0])
    with (output / "VOICE-CANDIDATE-TECHNICAL-AUDIT.csv").open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    review = []
    for clip, measured in zip(clips, rows, strict=True):
        speaker = speakers.get(clip["voiceId"])
        if speaker is None:
            raise RuntimeError(f"Candidate has no cast profile: {clip['voiceId']}")
        profile_id = speaker.get("secretTunnel", {}).get("profileId") or speaker.get("secretTunnelProfileId")
        if clip["profileId"] != profile_id:
            raise RuntimeError(f"Candidate profile UUID differs from cast: {clip['clipId']}")
        source = speaker["reference"]
        if clip["referenceSha256"] != source["workingReferenceSha256"]:
            raise RuntimeError(f"Candidate reference hash differs from cast: {clip['clipId']}")
        music_copy = output / "GermanySimulator generated voice auditions 2026-10-08" / clip["path"]
        music_path = ""
        if music_copy.is_file():
            if digest(music_copy) != clip["sha256"]:
                raise RuntimeError(f"Music review copy hash differs from manifest: {clip['clipId']}")
            music_path = str(music_copy.relative_to(output)).replace("\\", "/")
        if not isinstance(clip["asrWordExact"], bool):
            raise RuntimeError(f"Candidate ASR status is not boolean: {clip['clipId']}")
        asr = diagnostic_by_id.get(clip["clipId"])
        if asr and (asr["audioSha256"] != clip["sha256"] or
                    asr["profileId"] != clip["profileId"] or asr["script"] != clip["text"]):
            raise RuntimeError(f"German ASR diagnostic differs from candidate: {clip['clipId']}")
        normalized_copy = normalized_copies.get(clip["clipId"])
        normalized_word = normalized_words.get(clip["clipId"])
        comparison = comparisons.get(clip["clipId"])
        if normalized_dir and (not normalized_copy or not normalized_word):
            raise RuntimeError(f"Normalized review record is missing: {clip['clipId']}")
        normalized_path = ""
        if normalized_copy:
            candidate_copy = (normalized_dir / normalized_copy["copyFile"]).resolve(strict=True)
            if (not candidate_copy.is_relative_to(normalized_dir) or
                    normalized_copy["sourceSha256"] != clip["sha256"] or
                    normalized_copy["profileId"] != clip["profileId"] or
                    normalized_copy["script"] != clip["text"] or
                    digest(candidate_copy) != normalized_copy["outputSha256"] or
                    normalized_word["outputSha256"] != normalized_copy["outputSha256"] or
                    normalized_word["script"] != clip["text"]):
                raise RuntimeError(f"Normalized review copy or ASR differs from candidate: {clip['clipId']}")
            normalized_path = str(candidate_copy.relative_to(output)).replace("\\", "/")
        if comparison and (comparison["sourceSha256"] != clip["sha256"] or
                           comparison["normalizedSha256"] != normalized_copy["outputSha256"] or
                           comparison["script"] != clip["text"]):
            raise RuntimeError(f"Original/normalized comparison differs from candidate: {clip['clipId']}")
        asr_regression = bool(comparison and comparison["originalGermanPinnedPercent"] == 100 and
                              normalized_word["normalizedWordPercent"] < 100)
        if asr_regression:
            priority = "00_compare_original_normalized"
        elif normalized_word and normalized_word["normalizedWordPercent"] < 100:
            priority = "01_encoded_word_check"
        elif normalized_word and (not clip["asrWordExact"] and
                                  (not asr or asr["germanPinnedWordPercent"] < 100)):
            priority = "02_original_word_check"
        elif normalized_copy and normalized_copy.get("processingMethod", "").startswith("dynamic_"):
            priority = "03_compressed_delivery_listen"
        elif normalized_word:
            priority = "04_full_listening"
        elif not clip["asrWordExact"] and (not asr or asr["germanPinnedWordPercent"] < 100):
            priority = "01_word_check"
        elif not clip["asrWordExact"]:
            priority = "02_orthography_listen"
        elif measured["technicalReviewFlags"]:
            priority = "03_delivery_levels"
        else:
            priority = "04_full_listening"
        review.append({"priority": priority, "clipId": clip["clipId"],
                       "speakerName": speaker["fullName"], "voiceId": clip["voiceId"],
                       "profileId": profile_id, "gender": speaker["gender"],
                       "demeanor": speaker["generalDemeanor"],
                       "targetValence": speaker["targetValence"],
                       "targetArousal": speaker["targetArousal"],
                       "sourceEmotion": source["emotionLabel"],
                       "script": clip["text"], "asrTranscript": clip["asr"],
                       "asrWordExact": clip["asrWordExact"],
                       "germanPinnedTranscript": asr["germanPinnedTranscript"] if asr else "",
                       "germanPinnedWordPercent": asr["germanPinnedWordPercent"] if asr else "",
                       "normalizedTranscript": normalized_word["normalizedTranscript"] if normalized_word else "",
                       "normalizedWordPercent": normalized_word["normalizedWordPercent"] if normalized_word else "",
                       "originalPinnedTranscriptForComparison": comparison["originalGermanPinnedTranscript"] if comparison else "",
                       "originalPinnedWordPercentForComparison": comparison["originalGermanPinnedPercent"] if comparison else "",
                       "asrRegressionAfterNormalization": asr_regression,
                       "normalizedReviewFile": normalized_path,
                       "normalizedSha256": normalized_copy["outputSha256"] if normalized_copy else "",
                       "normalizedLufs": normalized_copy["outputLufs"] if normalized_copy else "",
                       "normalizedTruePeakDbtp": normalized_copy["outputTruePeakDbtp"] if normalized_copy else "",
                       "normalizedProcessingMethod": normalized_copy.get("processingMethod", "") if normalized_copy else "",
                       "technicalReviewFlags": measured["technicalReviewFlags"],
                       "integratedLufs": measured["integratedLufs"],
                       "truePeakDbtp": measured["truePeakDbtp"],
                       "gameFile": clip["path"], "musicReviewFile": music_path,
                       "mp3Sha256": clip["sha256"],
                       "heardWords": "", "speakerIdentityFits": "",
                       "demeanorFits": "", "intonationFits": "",
                       "artifactsAbsent": "", "sourceRightsCleared": "",
                       "approveForGame": "", "reviewNotes": ""})
    review_path = output / "VOICE-CANDIDATE-REVIEW-QUEUE.csv"
    if review_path.is_file():
        with review_path.open(encoding="utf-8", newline="") as stream:
            old_rows = list(csv.DictReader(stream))
        preserve_review_decisions(review, old_rows)
    review.sort(key=lambda item: (item["priority"],
                                  item["normalizedWordPercent"] if item["normalizedWordPercent"] != "" else
                                  (item["germanPinnedWordPercent"] if item["germanPinnedWordPercent"] != "" else 101),
                                  item["voiceId"], item["clipId"]))
    with review_path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(review[0]), lineterminator="\n")
        writer.writeheader()
        writer.writerows(review)
    counts = {flag: sum(flag in row["technicalReviewFlags"].split(";") for row in rows)
              for flag in ("duration_mismatch", "near_full_scale_peak", "true_peak_above_delivery_limit", "low_average_level",
                           "loudness_outside_review_band",
                           "long_leading_silence", "long_trailing_silence", "long_internal_silence")}
    report = {"schemaVersion": 2, "status": "technical_triage_only; listening_pending",
              "manifestSha256": digest(manifest_path), "castSha256": digest(cast_path),
              "ffmpeg": str(ffmpeg),
              "ffmpegVersion": run([str(ffmpeg), "-version"]).splitlines()[0],
              "silenceThreshold": "-50 dBFS for at least 0.25 seconds",
              "loudnessReviewBand": "-20 to -16 LUFS around the foreground target of -18 LUFS",
              "clipCount": len(rows), "speakerCount": len({row["voiceId"] for row in rows}),
              "nonliteralAsrCount": sum(not clip["asrWordExact"] for clip in clips),
              "germanPinnedDiagnosticCount": len(diagnostic_by_id),
              "germanPinnedExactCount": sum(item["germanPinnedWordPercent"] == 100
                                             for item in diagnostic_by_id.values()),
              "germanPinnedDiagnosticSha256": digest(diagnostic_path) if diagnostic else None,
              "normalizedReviewCopyCount": len(normalized_copies),
              "normalizedWordDiagnosticExactCount": sum(item["normalizedWordPercent"] == 100
                                                         for item in normalized_words.values()),
              "normalizedManifestSha256": digest(normalized_manifest_path) if normalized_dir else None,
              "normalizedWordReviewSha256": digest(normalized_words_path) if normalized_dir else None,
              "originalNormalizedComparisonCount": len(comparisons),
              "asrRegressionAfterNormalizationCount": sum(row["asrRegressionAfterNormalization"]
                                                           for row in review),
              "originalNormalizedComparisonSha256": digest(comparison_path) if comparisons else None,
              "verifiedMusicReviewCopies": sum(bool(row["musicReviewFile"]) for row in review),
              "flagCounts": counts,
              "clipsWithAnyFlag": sum(bool(row["technicalReviewFlags"]) for row in rows),
              "csvSha256": digest(output / "VOICE-CANDIDATE-TECHNICAL-AUDIT.csv"),
              "reviewQueueSha256": digest(review_path),
              "note": "Level and silence flags are listening priorities, not rejection or approval. Check voice identity, exact words, valence/arousal, joins, artifacts, and rights separately."}
    (output / "VOICE-CANDIDATE-TECHNICAL-AUDIT.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: report[key] for key in ("clipCount", "clipsWithAnyFlag", "flagCounts")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
