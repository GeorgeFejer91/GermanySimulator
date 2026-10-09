"""Make private, level-matched listening copies of candidate dialogue MP3s.

Original game assets and their manifest are read-only. These copies are for
auditioning, not approval or normal game playback.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import re
import subprocess
import tempfile
from pathlib import Path

TARGET_LUFS = -18.0
TARGET_TRUE_PEAK = -1.5
LUFS_TOLERANCE = 0.3
DURATION_TOLERANCE = 0.1


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def command(args: list[str]) -> str:
    result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8",
                            errors="replace", timeout=180)
    if result.returncode:
        raise RuntimeError(f"FFmpeg failed: {result.stderr[-800:]}")
    return result.stdout + result.stderr


def probe(ffprobe: Path, audio: Path) -> dict:
    output = command([str(ffprobe), "-v", "error", "-select_streams", "a:0",
                      "-show_entries", "stream=channels,channel_layout,sample_rate,bit_rate:format=duration",
                      "-of", "json", str(audio)])
    data = json.loads(output)
    if not data.get("streams"):
        raise RuntimeError(f"No audio stream: {audio}")
    stream = data["streams"][0]
    return {"duration": float(data["format"]["duration"]),
            "channels": int(stream["channels"]),
            "layout": stream.get("channel_layout", ""),
            "sampleRate": int(stream["sample_rate"]),
            "bitRate": int(stream.get("bit_rate") or 128000)}


def loudness(ffmpeg: Path, audio: Path) -> dict:
    log = command([str(ffmpeg), "-hide_banner", "-nostdin", "-nostats", "-i", str(audio),
                   "-af", "loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json",
                   "-f", "null", "-"])
    match = re.search(r'\{\s*"input_i".*?\}', log, flags=re.S)
    if not match:
        raise RuntimeError(f"No loudness measurement: {audio}")
    return json.loads(match.group(0))


def normalize(ffmpeg: Path, ffprobe: Path, source: Path, destination: Path) -> dict:
    before = probe(ffprobe, source)
    measured = loudness(ffmpeg, source)
    post_gain = 0.0
    limiter = 10 ** ((TARGET_TRUE_PEAK - 0.4) / 20)
    attempts = 0
    method = "two_pass_linear_loudnorm"
    with tempfile.TemporaryDirectory(prefix="gs-level-match-", dir=destination.parent) as temp:
        candidate = Path(temp) / "candidate.mp3"
        passed = False
        for _ in range(6):
            attempts += 1
            encode_lufs = TARGET_LUFS + 0.25
            encode_peak = TARGET_TRUE_PEAK - 0.2
            filter_text = (
                f"loudnorm=I={encode_lufs}:TP={encode_peak}:LRA=11:"
                f"measured_I={measured['input_i']}:measured_TP={measured['input_tp']}:"
                f"measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}:"
                f"offset={measured['target_offset']}:linear=true:print_format=summary,"
                f"volume={post_gain:.3f}dB,"
                f"alimiter=limit={limiter:.6f}:attack=5:release=50:level=false"
            )
            command([str(ffmpeg), "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
                     "-i", str(source), "-map_metadata", "-1", "-af", filter_text,
                     "-ar", str(before["sampleRate"]), "-ac", str(before["channels"]),
                     "-b:a", str(before["bitRate"]), str(candidate)])
            after_loudness = loudness(ffmpeg, candidate)
            output_lufs = float(after_loudness["input_i"])
            output_peak = float(after_loudness["input_tp"])
            if (math.isfinite(output_lufs) and math.isfinite(output_peak) and
                    abs(output_lufs - TARGET_LUFS) <= LUFS_TOLERANCE and
                    output_peak <= TARGET_TRUE_PEAK):
                passed = True
                break
            post_gain += TARGET_LUFS - output_lufs
        if not passed:
            # A large crest factor can make linear gain saturate at the true-peak
            # ceiling. Try progressively stronger compression, recording the
            # exact fallback chain for perceptual comparison with the original.
            for threshold, ratio in ((0.18, 4), (0.12, 4), (0.08, 6)):
                post_gain = 0.0
                for _ in range(6):
                    attempts += 1
                    filter_text = (
                        f"acompressor=threshold={threshold}:ratio={ratio}:"
                        "attack=5:release=100:makeup=1,"
                        "loudnorm=I=-18:TP=-1.7:LRA=11:linear=false,"
                        f"volume={post_gain:.3f}dB,"
                        f"alimiter=limit={limiter:.6f}:attack=5:release=50:level=false"
                    )
                    command([str(ffmpeg), "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
                             "-i", str(source), "-map_metadata", "-1", "-af", filter_text,
                             "-ar", str(before["sampleRate"]), "-ac", str(before["channels"]),
                             "-b:a", str(before["bitRate"]), str(candidate)])
                    after_loudness = loudness(ffmpeg, candidate)
                    output_lufs = float(after_loudness["input_i"])
                    output_peak = float(after_loudness["input_tp"])
                    if (math.isfinite(output_lufs) and math.isfinite(output_peak) and
                            abs(output_lufs - TARGET_LUFS) <= LUFS_TOLERANCE and
                            output_peak <= TARGET_TRUE_PEAK):
                        passed = True
                        method = f"dynamic_loudnorm_compressor_{threshold}_{ratio}"
                        break
                    post_gain += TARGET_LUFS - output_lufs
                if passed:
                    break
        if not passed:
            raise RuntimeError(f"Could not meet delivery levels in {attempts} attempts: {source}")
        after = probe(ffprobe, candidate)
        if (after["channels"] != before["channels"] or
                after["sampleRate"] != before["sampleRate"] or
                (before["layout"] and after["layout"] != before["layout"]) or
                abs(after["duration"] - before["duration"]) > DURATION_TOLERANCE):
            raise RuntimeError(f"Normalization changed channel format or duration: {source}")
        if destination.exists():
            raise RuntimeError(f"Refusing to overwrite existing listening copy: {destination}")
        os.replace(candidate, destination)
    return {"inputLufs": float(measured["input_i"]),
            "inputTruePeakDbtp": float(measured["input_tp"]),
            "outputLufs": output_lufs, "outputTruePeakDbtp": output_peak,
            "inputDurationSeconds": round(before["duration"], 3),
            "outputDurationSeconds": round(after["duration"], 3),
            "attempts": attempts, "processingMethod": method,
            "processingFilter": filter_text, "outputSha256": digest(destination)}


def save(path: Path, metadata: dict, rows: list[dict]) -> None:
    result = dict(metadata, copies=sorted(rows, key=lambda row: row["clipId"]),
                  completedCount=len(rows))
    temporary = path.with_name(path.name + ".part")
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--game-root", required=True, type=Path)
    parser.add_argument("--ffmpeg", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--max-clips", type=int, default=0)
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    root = args.game_root.resolve(strict=True)
    ffmpeg = args.ffmpeg.resolve(strict=True)
    ffprobe = ffmpeg.with_name("ffprobe.exe" if ffmpeg.suffix.lower() == ".exe" else "ffprobe")
    ffprobe.resolve(strict=True)
    output = args.output_dir.resolve()
    if output.is_relative_to(root):
        raise RuntimeError("Listening copies must be outside the game checkout")
    if args.verify_only and args.max_clips:
        raise RuntimeError("--verify-only checks the complete set; omit --max-clips")
    output.mkdir(parents=True, exist_ok=True)
    manifest_path = root / "assets/voices/candidate-dialogue/manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    clips = manifest["clips"]
    if len(clips) != manifest["lineCount"] or len({clip["clipId"] for clip in clips}) != len(clips):
        raise RuntimeError("Candidate manifest count or IDs are inconsistent")
    output_manifest = output / "manifest.json"
    previous = json.loads(output_manifest.read_text(encoding="utf-8")) if output_manifest.is_file() else {}
    previous_rows = {row["clipId"]: row for row in previous.get("copies", [])}
    if len(previous_rows) != len(previous.get("copies", [])):
        raise RuntimeError("Duplicate clip ID in existing listening manifest")
    metadata = {"schemaVersion": 1, "status": "private_normalized_listening_copies; no audible or rights approval",
                "note": "Original game MP3s and candidate manifest are unchanged. The re-encoded copies need word retranscription and human listening before any catalogue use.",
                "sourceManifestSha256": digest(manifest_path), "targetLufs": TARGET_LUFS,
                "targetTruePeakDbtp": TARGET_TRUE_PEAK, "candidateCount": len(clips),
                "ffmpegVersion": command([str(ffmpeg), "-version"]).splitlines()[0]}
    rows = []
    made = 0
    for index, clip in enumerate(clips, 1):
        if not re.fullmatch(r"[a-z0-9-]+", clip["clipId"]):
            raise RuntimeError(f"Unsafe clip ID: {clip['clipId']}")
        source = (root / clip["path"]).resolve(strict=True)
        if not source.is_relative_to(root) or digest(source) != clip["sha256"]:
            raise RuntimeError(f"Source file/hash mismatch: {clip['clipId']}")
        destination = output / f"{clip['clipId']}.mp3"
        old = previous_rows.get(clip["clipId"])
        if (old and old["sourceSha256"] == clip["sha256"] and
                old["voiceId"] == clip["voiceId"] and
                old["profileId"] == clip["profileId"] and
                old["script"] == clip["text"] and destination.is_file() and
                digest(destination) == old["outputSha256"]):
            if args.verify_only:
                measured = loudness(ffmpeg, destination)
                delivered = probe(ffprobe, destination)
                if (abs(float(measured["input_i"]) - TARGET_LUFS) > LUFS_TOLERANCE or
                        float(measured["input_tp"]) > TARGET_TRUE_PEAK or
                        abs(delivered["duration"] - old["inputDurationSeconds"]) > DURATION_TOLERANCE or
                        abs(float(measured["input_i"]) - old["outputLufs"]) > 0.1 or
                        abs(float(measured["input_tp"]) - old["outputTruePeakDbtp"]) > 0.1):
                    raise RuntimeError(f"Listening copy fails encoded output check: {clip['clipId']}")
            elif "processingMethod" not in old:
                old["processingMethod"] = "two_pass_linear_loudnorm"
                old["processingFilter"] = "initial batch did not save the exact filter text"
            rows.append(old)
            continue
        if args.verify_only:
            raise RuntimeError(f"Missing or stale listening copy: {clip['clipId']}")
        if destination.exists():
            raise RuntimeError(f"Unrecognized existing listening copy: {destination}")
        if args.max_clips and made >= args.max_clips:
            continue
        levels = normalize(ffmpeg, ffprobe, source, destination)
        row = {"clipId": clip["clipId"], "voiceId": clip["voiceId"],
               "profileId": clip["profileId"], "script": clip["text"],
               "sourcePath": clip["path"], "sourceSha256": clip["sha256"],
               "copyFile": destination.name, **levels,
               "wordReview": "pending_on_normalized_copy", "humanListening": "pending"}
        rows.append(row)
        made += 1
        save(output_manifest, metadata, rows)
        print(json.dumps({"index": index, "clipId": clip["clipId"],
                          "outputLufs": levels["outputLufs"],
                          "outputTruePeakDbtp": levels["outputTruePeakDbtp"],
                          "completed": len(rows)}, ensure_ascii=False), flush=True)
    if not args.verify_only:
        save(output_manifest, metadata, rows)
    print(json.dumps({"verified" if args.verify_only else "completed": len(rows),
                      "candidateCount": len(clips)},
                     ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
