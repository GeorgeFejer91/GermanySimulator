"""Independently retranscribe nonliteral candidate MP3s with German-pinned Whisper.

This is a resumable diagnostic. It preserves the original candidate manifest and
does not approve any line for normal gameplay.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import re
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


def word_score(expected: str, decoded: str) -> int:
    """Score words with limited German number and compound orthography tolerance."""
    number_words = {
        "null": "0", "eins": "1", "zwei": "2", "drei": "3", "vier": "4",
        "fünf": "5", "sechs": "6", "sieben": "7", "acht": "8", "neun": "9",
        "zehn": "10", "elf": "11", "zwölf": "12", "dreizehn": "13",
        "vierzehn": "14", "fünfzehn": "15", "sechzehn": "16",
        "siebzehn": "17", "achtzehn": "18", "neunzehn": "19",
        "zwanzig": "20", "dreißig": "30", "vierzig": "40",
        "fünfzig": "50", "sechzig": "60", "siebzig": "70",
        "achtzig": "80", "neunzig": "90",
    }

    def tokens(value: str, join_hyphens: bool) -> list[str]:
        if join_hyphens:
            value = re.sub(r"(?<=\w)[-‐‑–](?=\w)", "", value)
        return [number_words.get(word, word) for word in re.findall(r"\w+", value.casefold())]

    def distance(reference: list[str], heard: list[str]) -> int:
        # A written German compound can be separated by ASR, or vice versa.
        # Only exact concatenation gets a zero-cost transition.
        costs = [[math.inf] * (len(heard) + 1) for _ in range(len(reference) + 1)]
        costs[0][0] = 0
        for i in range(len(reference) + 1):
            for j in range(len(heard) + 1):
                current = costs[i][j]
                if i < len(reference):
                    costs[i + 1][j] = min(costs[i + 1][j], current + 1)
                if j < len(heard):
                    costs[i][j + 1] = min(costs[i][j + 1], current + 1)
                if i < len(reference) and j < len(heard):
                    costs[i + 1][j + 1] = min(
                        costs[i + 1][j + 1], current + (reference[i] != heard[j]))
                if i < len(reference) and j + 1 < len(heard) and reference[i] == heard[j] + heard[j + 1]:
                    costs[i + 1][j + 2] = min(costs[i + 1][j + 2], current)
                if i + 1 < len(reference) and j < len(heard) and reference[i] + reference[i + 1] == heard[j]:
                    costs[i + 2][j + 1] = min(costs[i + 2][j + 1], current)
        return int(costs[-1][-1])

    variants = []
    for join in (False, True):
        reference, heard = tokens(expected, join), tokens(decoded, join)
        if not reference:
            raise ValueError("Candidate script contains no words")
        variants.append(max(0, 1 - distance(reference, heard) / len(reference)))
    return math.floor(100 * max(variants) + 0.5)


def save(output_dir: Path, records: list[dict], metadata: dict) -> None:
    records.sort(key=lambda row: row["clipId"])
    report = dict(metadata, clips=records, completedCount=len(records),
                  diagnosticExactCount=sum(row["germanPinnedWordPercent"] == 100 for row in records))
    json_path = output_dir / "VOICE-CANDIDATE-GERMAN-ASR-REVIEW.json"
    temporary = json_path.with_name(json_path.name + ".part")
    temporary.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(json_path)
    csv_path = output_dir / "VOICE-CANDIDATE-GERMAN-ASR-REVIEW.csv"
    temporary = csv_path.with_name(csv_path.name + ".part")
    with temporary.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(records[0]) if records else [], lineterminator="\n")
        if records:
            writer.writeheader()
            writer.writerows(records)
    temporary.replace(csv_path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--game-root", required=True, type=Path)
    parser.add_argument("--asr", required=True, type=Path)
    parser.add_argument("--ffmpeg", required=True, type=Path)
    parser.add_argument("--model", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--max-clips", type=int, default=0,
                        help="Maximum new ASR results this run; zero means all")
    args = parser.parse_args()
    root = args.game_root.resolve(strict=True)
    asr = args.asr.resolve(strict=True)
    ffmpeg = args.ffmpeg.resolve(strict=True)
    model = args.model.resolve(strict=True)
    model_weights = model / "whisper-large-v3-turbo-q4_0.gguf"
    model_hash = digest(model_weights)
    model_config_hash = digest(model / "config.json")
    model_tokenizer_hash = digest(model / "tokenizer.json")
    asr_hash = digest(asr)
    output = args.output_dir.resolve(strict=True)
    manifest_path = root / "assets/voices/candidate-dialogue/manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    candidates = [clip for clip in manifest["clips"] if clip["asrWordExact"] is False]
    if len(manifest["clips"]) != manifest["lineCount"] or len({clip["clipId"] for clip in manifest["clips"]}) != manifest["lineCount"]:
        raise RuntimeError("Candidate manifest count or IDs are inconsistent")
    metadata = {"schemaVersion": 1, "status": "diagnostic_only; human_listening_pending",
                "note": "German-pinned retranscription of existing encoded MP3s; score equates limited written German number words with digits and exact split/joined compounds. Original manifest ASR and file hashes stay unchanged.",
                "manifestSha256": digest(manifest_path), "asrLanguageHint": "de",
                "wordScorerVersion": "de-written-number-compound-v2",
                "asrBinarySha256": asr_hash, "whisperModel": "whisper-large-v3-turbo-q4_0.gguf",
                "whisperModelSha256": model_hash,
                "whisperConfigSha256": model_config_hash,
                "whisperTokenizerSha256": model_tokenizer_hash,
                "candidateCount": len(candidates)}
    previous_path = output / "VOICE-CANDIDATE-GERMAN-ASR-REVIEW.json"
    old = json.loads(previous_path.read_text(encoding="utf-8")) if previous_path.is_file() else {}
    old_by_id = {row["clipId"]: row for row in old.get("clips", [])}
    if len(old_by_id) != len(old.get("clips", [])):
        raise RuntimeError("Duplicate clip IDs in saved diagnostic")
    rows = []
    made = 0
    for index, clip in enumerate(candidates, 1):
        audio = (root / clip["path"]).resolve(strict=True)
        if not audio.is_relative_to(root) or digest(audio) != clip["sha256"]:
            raise RuntimeError(f"Candidate MP3 path/hash mismatch: {clip['clipId']}")
        music_copy = output / "GermanySimulator generated voice auditions 2026-10-08" / clip["path"]
        if not music_copy.is_file() or digest(music_copy) != clip["sha256"]:
            raise RuntimeError(f"Music listening copy missing or changed: {clip['clipId']}")
        old_row = old_by_id.get(clip["clipId"])
        if (old.get("asrBinarySha256") == asr_hash and
                old.get("whisperModelSha256") == model_hash and old_row and
                old.get("whisperConfigSha256", model_config_hash) == model_config_hash and
                old.get("whisperTokenizerSha256", model_tokenizer_hash) == model_tokenizer_hash and
                old_row.get("audioSha256") == clip["sha256"] and
                old_row.get("script") == clip["text"] and
                old_row.get("voiceId") == clip["voiceId"] and
                old_row.get("profileId") == clip["profileId"]):
            old_row["germanPinnedWordPercent"] = word_score(
                clip["text"], old_row["germanPinnedTranscript"])
            rows.append(old_row)
            continue
        if args.max_clips and made >= args.max_clips:
            continue
        with tempfile.TemporaryDirectory(prefix="gs-candidate-asr-") as temp:
            wav = Path(temp) / "clip.wav"
            subprocess.run([str(ffmpeg), "-v", "error", "-nostdin", "-y", "-i",
                            str(audio), "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le",
                            str(wav)], check=True, capture_output=True, timeout=120)
            started = time.monotonic()
            result = subprocess.run([str(asr), str(model), str(wav), "de"], check=True,
                                    capture_output=True, text=True, encoding="utf-8", timeout=180)
            elapsed = round(time.monotonic() - started, 2)
        transcript = json.loads(result.stdout)["transcript"]
        percent = word_score(clip["text"], transcript)
        rows.append({"clipId": clip["clipId"], "voiceId": clip["voiceId"],
                     "profileId": clip["profileId"], "script": clip["text"],
                     "originalAsrTranscript": clip["asr"],
                     "germanPinnedTranscript": transcript,
                     "germanPinnedWordPercent": percent,
                     "audioPath": clip["path"], "audioSha256": clip["sha256"],
                     "asrSeconds": elapsed, "reviewStatus": "human_listening_pending"})
        made += 1
        save(output, rows, metadata)
        print(json.dumps({"index": index, "clipId": clip["clipId"],
                          "wordPercent": percent,
                          "completed": len(rows)}, ensure_ascii=False), flush=True)
    save(output, rows, metadata)
    print(json.dumps({"completed": len(rows), "candidateCount": len(candidates),
                      "exact": sum(row["germanPinnedWordPercent"] == 100 for row in rows)},
                     ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
