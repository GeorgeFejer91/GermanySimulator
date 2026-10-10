"""Offline visemes and 50 Hz energy from the approved omen MP3; no runtime model."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
import tempfile
import wave
from array import array

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "assets/voices/horst-stempelmann/omen-candidate-02.mp3"
DEST = ROOT / "assets/buergeramt/omen/mouth-cues.js"
SHA = "da75a78e3d721f478f44e02327961f3d2933595dcc1bbdc8c73510af0ccf5df4"

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--rhubarb", required=True, type=Path)
parser.add_argument("--ffmpeg", required=True, type=Path)
parser.add_argument("--check", action="store_true")
args = parser.parse_args()
assert hashlib.sha256(AUDIO.read_bytes()).hexdigest() == SHA, "Rebind changed audio explicitly"
version = subprocess.check_output([str(args.rhubarb), "--version"], text=True).strip()
assert "1.14.0" in version
with tempfile.TemporaryDirectory(prefix="gs-omen-lipsync-") as temporary:
    wav = Path(temporary) / "track.wav"
    cues = Path(temporary) / "cues.json"
    subprocess.run([str(args.ffmpeg), "-v", "error", "-y", "-i", str(AUDIO), "-ac", "1", "-ar", "16000", str(wav)], check=True)
    subprocess.run([str(args.rhubarb), "-q", "-r", "phonetic", "--threads", "2", "--extendedShapes", "GHX", "-f", "json", "-o", str(cues), str(wav)], check=True)
    raw = json.loads(cues.read_text())
    with wave.open(str(wav)) as stream:
        samples = array("h", stream.readframes(stream.getnframes()))
    energy = [math.sqrt(sum((s / 32768) ** 2 for s in samples[i:i+320]) / max(1, len(samples[i:i+320]))) for i in range(0, len(samples), 320)]
    peak = sorted(energy)[int(len(energy) * .90)]
    envelope = [round(min(1, max(0, (rms / peak - .055) / .945)) ** .65, 3) for rms in energy]
    track = {"clipId": "aktenkurier-omen-candidate-02", "recording": "./assets/voices/horst-stempelmann/omen-candidate-02.mp3", "audioSha256": SHA,
             "duration": raw["metadata"]["duration"], "analyzer": "Rhubarb Lip Sync 1.14.0; language-independent phonetic recognizer; estimated visemes",
             "analyzerUrl": "https://github.com/DanielSWolf/rhubarb-lip-sync/tree/v1.14.0", "analyzerLicense": "MIT",
             "sampleHz": 50, "energy": envelope, "cues": [[c["start"], c["end"], c["value"]] for c in raw["mouthCues"]]}
    assert track["cues"][0][0] == 0 and track["cues"][-1][2] == "X"
    assert all(a[1] == b[0] for a, b in zip(track["cues"], track["cues"][1:]))
    rendered = "// Generated offline by tools/build-omen-lipsync.py; bound to the approved MP3.\nexport const omenMouthTrack = Object.freeze(" + json.dumps(track, ensure_ascii=False, separators=(",", ":")) + ");\n"
    if args.check:
        assert DEST.read_text(encoding="utf-8") == rendered, "Mouth track is stale"
    else:
        DEST.write_text(rendered, encoding="utf-8")
    print(f"{'Verified' if args.check else 'Built'} {len(track['cues'])} viseme intervals / {len(envelope)} energy samples / {len(rendered.encode())} bytes")
