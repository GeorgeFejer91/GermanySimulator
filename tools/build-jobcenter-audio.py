"""Offline Jobcenter voice render and final-MP3-derived flame envelopes.

Usage: py -3 tools/build-jobcenter-audio.py SOURCE.mp3 ANNOTATION.speech.json
No playback, network, or third-party Python dependency is used.
"""

import argparse
from array import array
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import tempfile


ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "assets" / "audio" / "jobcenter"
HZ = 40


def run(*args, binary=False):
    result = subprocess.run(args, capture_output=True, check=True)
    return result.stdout if binary else result.stderr.decode("utf-8", "replace")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def measure(path):
    report = run(
        "ffmpeg", "-hide_banner", "-nostats", "-i", str(path),
        "-af", "loudnorm=I=-18:TP=-2:LRA=11:print_format=json",
        "-f", "null", "NUL",
    )
    match = re.search(r'\{\s*"input_i".*?\}', report, re.S)
    if not match:
        raise RuntimeError("FFmpeg returned no loudness report")
    return json.loads(match.group())


def probe(path):
    data = json.loads(subprocess.run(
        ("ffprobe", "-v", "error", "-show_entries",
         "format=duration,size:stream=sample_rate,channels,codec_name", "-of", "json", str(path)),
        capture_output=True, check=True, text=True,
    ).stdout)
    return data["format"], data["streams"][0]


def envelope(path, duration, sample_rate):
    raw = run("ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path),
              "-f", "f32le", "-ac", "1", "-ar", str(sample_rate), "pipe:1", binary=True)
    samples = array("f")
    samples.frombytes(raw)
    if sys.byteorder != "little":
        samples.byteswap()
    count = max(1, math.ceil(duration * HZ))
    frame = sample_rate / HZ
    rms = []
    for i in range(count):
        a = round(i * frame)
        b = min(len(samples), round((i + 1) * frame))
        part = samples[a:b]
        rms.append(math.sqrt(sum(x * x for x in part) / len(part)) if part else 0)
    speech = sorted(rms)[round(0.95 * (len(rms) - 1))] or 1
    energy = [min(255, round(255 * (v / speech) ** 0.7)) for v in rms]
    # Fast rise / four-frame release: a flame can lean into syllable attacks.
    attack = []
    previous = 0
    hold = 0.0
    for current in energy:
        impulse = max(0.0, current - previous) * 2.5
        hold = max(impulse, hold * 0.72)
        attack.append(min(255, round(hold)))
        previous = current
    return energy, attack, len(samples) / sample_rate


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("annotation", type=Path)
    args = parser.parse_args()
    source = args.source.resolve()
    annotation = args.annotation.resolve()
    note = json.loads(annotation.read_text(encoding="utf-8-sig"))
    if note["audio_file"] != source.name or not note.get("text"):
        raise ValueError("Source and annotation identity/text do not match")
    DEST.mkdir(parents=True, exist_ok=True)
    final = DEST / "overlord.mp3"
    metadata = DEST / "overlord.json"
    with tempfile.TemporaryDirectory(prefix="jobcenter-audio-") as temp:
        effected = Path(temp) / "effected.wav"
        # Dry shifted speech stays dominant. Dark octave undertone and a short
        # reflection are low in level; compression controls emphatic phrases.
        filtergraph = (
            "aformat=channel_layouts=mono,highpass=f=70,"
            "rubberband=pitch=0.793700526:formant=shifted:transients=crisp,"
            "asplit=2[dry][sub];"
            "[sub]rubberband=pitch=0.5:formant=shifted,lowpass=f=190,volume=-19dB[low];"
            "[dry][low]amix=inputs=2:weights=1 1:normalize=0,"
            "acompressor=threshold=0.065:ratio=2.2:attack=12:release=130,"
            "aecho=0.8:0.88:74|143:0.055|0.032,"
            "afade=t=in:st=0:d=0.02[out]"
        )
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
            "-filter_complex", filtergraph, "-map", "[out]", "-ar", "24000",
            "-ac", "1", "-c:a", "pcm_f32le", str(effected))
        stats = measure(effected)
        norm = (
            "loudnorm=I=-17.85:TP=-2.4:LRA=11:"
            f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
            f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:"
            f"offset={stats['target_offset']}:linear=true,volume=0.4dB,"
            "alimiter=limit=0.735:attack=5:release=60:level=false"
        )
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(effected),
            "-af", norm, "-ar", "24000", "-ac", "1", "-c:a", "libmp3lame",
            "-b:a", "64k", "-map_metadata", "-1", str(final))
    fmt, stream = probe(final)
    loud = measure(final)
    if abs(float(loud["input_i"]) + 18) > 0.35 or float(loud["input_tp"]) > -2:
        raise RuntimeError(f"Final encoded levels out of tolerance: {loud}")
    rate = int(stream["sample_rate"])
    duration = float(fmt["duration"])
    energy, attack, decoded_duration = envelope(final, duration, rate)
    data = {
        "schemaVersion": 1,
        "text": note["text"],
        "duration": duration,
        "sampleHz": HZ,
        "energy": energy,
        "attack": attack,
        "envelopeEncoding": "0..255; mono RMS per 25 ms / 95th-percentile RMS ^ 0.7; attack is positive energy change with four-frame decay",
        "source": {
            "audioSha256": sha(source), "annotationSha256": sha(annotation),
            "clipId": note["clip_id"], "nativeProfileId": note["voice_id"],
            "profileReferenceSha256": note["reference_sha256"],
            "renderer": note["engine"], "model": note["model"],
            "revision": note["inference_revision"], "attributionUrl": note["source"],
        },
        "processing": "rubberband -4 semitones, octave undertone -19 dB / 190 Hz lowpass, 74/143 ms restrained echo, 2.2:1 compression, EBU R128 normalization",
        "audioSha256": sha(final),
        "integratedLufs": float(loud["input_i"]),
        "truePeakDbtp": float(loud["input_tp"]),
    }
    metadata.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps({"mp3Bytes": int(fmt["size"]), "duration": duration,
                      "decodedDuration": decoded_duration, "sampleRate": rate,
                      "channels": stream["channels"], "energySamples": len(energy),
                      "lufs": loud["input_i"], "dbtp": loud["input_tp"],
                      "sourceSha256": sha(source), "finalSha256": sha(final)}, indent=2))


if __name__ == "__main__":
    main()
