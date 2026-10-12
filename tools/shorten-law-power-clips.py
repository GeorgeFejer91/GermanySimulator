"""Rebuild short §-power MP3s from the verified full readings at 3242218.

Authoring only: no synthesis or playback. Git retains each complete reading.
"""
from hashlib import sha256
import json
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE_COMMIT = "3242218"
# End points from local Whisper-small word timing and FFmpeg silence scans.
ENDS = (6.75, 4.18, 9.95, 5.78, 3.42, 7.27, 5.08, 4.72, 4.96, 6.15, 5.93, 5.32, 3.84)
license_text = subprocess.check_output(
    ["git", "show", f"{SOURCE_COMMIT}:assets/voices/LICENSES.md"], cwd=ROOT
).decode("utf-8")

def measure(path):
    output = subprocess.run([
        "ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af",
        "loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json", "-f", "null", "NUL",
    ], capture_output=True, text=True, check=True).stderr
    receipt = re.search(r'\{\s*"input_i".*?\}', output, re.S)
    assert receipt, f"No loudness measurement: {path}"
    return json.loads(receipt.group())

for number, end in enumerate(ENDS, 1):
    name = f"thorsten-negative-law-{number:02}.mp3"
    relative = f"assets/voices/laws/{name}"
    receipt = re.search(rf"\| `laws/{name}` \| [^|]+ \| `([0-9A-F]{{64}})` \|", license_text)
    assert receipt, f"Missing original provenance: {name}"
    original = subprocess.check_output(["git", "show", f"{SOURCE_COMMIT}:{relative}"], cwd=ROOT)
    assert sha256(original).hexdigest().upper() == receipt.group(1), f"Source changed: {name}"
    with tempfile.TemporaryDirectory(prefix="gs-law-") as temporary:
        source = Path(temporary) / "full.mp3"
        cut = Path(temporary) / "cut.mp3"
        rendered = Path(temporary) / "short.mp3"
        source.write_bytes(original)
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
            "-t", str(end), "-af", f"afade=t=out:st={end-.1:.2f}:d=0.1",
            "-ac", "1", "-ar", "22050", "-b:a", "64k", str(cut),
        ], check=True)
        levels = measure(cut)
        extra_gain = 0.0
        for _ in range(6):
            filter_chain = (
                f"loudnorm=I=-17.75:TP=-1.7:LRA=11:"
                f"measured_I={levels['input_i']}:measured_TP={levels['input_tp']}:"
                f"measured_LRA={levels['input_lra']}:measured_thresh={levels['input_thresh']}:"
                f"offset={levels['target_offset']}:linear=true,"
                f"volume={extra_gain:.3f}dB,alimiter=limit=0.851138:attack=5:release=50:level=false"
            )
            subprocess.run([
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(cut),
                "-map_metadata", "-1", "-af", filter_chain,
                "-ac", "1", "-ar", "22050", "-b:a", "64k", str(rendered),
            ], check=True)
            checked = measure(rendered)
            actual_i, actual_tp = float(checked["input_i"]), float(checked["input_tp"])
            if abs(actual_i + 18) <= .3 and actual_tp <= -1.5:
                break
            extra_gain += -18 - actual_i
        else:
            raise AssertionError(f"Level check failed: {name}: {actual_i} LUFS, {actual_tp} dBTP")
        target = ROOT / relative
        target.write_bytes(rendered.read_bytes())
        duration = subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=nokey=1:noprint_wrappers=1", str(target),
        ], text=True).strip()
        print(f"{number:02}: {duration}s {actual_i:.2f} LUFS {actual_tp:.2f} dBTP {sha256(target.read_bytes()).hexdigest()}")
