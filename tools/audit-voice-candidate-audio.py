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


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--game-root", required=True, type=Path)
    parser.add_argument("--ffmpeg", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
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
    fields = list(rows[0])
    with (output / "VOICE-CANDIDATE-TECHNICAL-AUDIT.csv").open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    counts = {flag: sum(flag in row["technicalReviewFlags"].split(";") for row in rows)
              for flag in ("duration_mismatch", "near_full_scale_peak", "true_peak_above_delivery_limit", "low_average_level",
                           "loudness_outside_review_band",
                           "long_leading_silence", "long_trailing_silence", "long_internal_silence")}
    report = {"schemaVersion": 1, "status": "technical_triage_only; listening_pending",
              "manifestSha256": digest(manifest_path), "ffmpeg": str(ffmpeg),
              "ffmpegVersion": run([str(ffmpeg), "-version"]).splitlines()[0],
              "silenceThreshold": "-50 dBFS for at least 0.25 seconds",
              "loudnessReviewBand": "-20 to -16 LUFS around the foreground target of -18 LUFS",
              "clipCount": len(rows), "flagCounts": counts,
              "clipsWithAnyFlag": sum(bool(row["technicalReviewFlags"]) for row in rows),
              "csvSha256": digest(output / "VOICE-CANDIDATE-TECHNICAL-AUDIT.csv"),
              "note": "Level and silence flags are listening priorities, not rejection or approval. Check voice identity, exact words, valence/arousal, joins, artifacts, and rights separately."}
    (output / "VOICE-CANDIDATE-TECHNICAL-AUDIT.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: report[key] for key in ("clipCount", "clipsWithAnyFlag", "flagCounts")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
