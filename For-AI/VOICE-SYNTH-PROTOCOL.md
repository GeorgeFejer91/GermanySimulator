# Voice simulation protocol

Production-time protocol for creating German voice clips by local XTTS-v2 voice
cloning conditioned on the shipped reference recordings. Everything here runs
offline on this machine; the model is a production tool, never a runtime
dependency or shipped asset (see `ASSET-POLICY.md`).

## Trust boundary

- References must be one of: the CC0 Thorsten-Voice recordings under
  `assets/voices/`, or a user-owned local recording. Do not clone a recognizable
  real public personality or a recorded announcer voice.
- Synthesized clips are derivatives. Add provenance, generated-on date, model,
  reference files, duration, and SHA-256 to `assets/voices/LICENSES.md` when a
  derived clip is shipped.

## Environment

- Python: `C:\Users\Georgeous\anaconda\python.exe` (base env, Coqui TTS 0.25.3,
  torch CPU 2.1.1). No GPU is used.
- FFmpeg must be on `PATH` (the tool calls it for MP3 encoding).
- Model: `tts_models/multilingual/multi-dataset/xtts_v2`. First run downloads
  it to `%LOCALAPPDATA%\tts` (~1.9 GB, one-time, needs internet). Afterwards
  every synthesis is fully offline.

## Reference bank (shipped)

| Delivery | File (in `assets/voices/`) |
| --- | --- |
| angry / §-power laws | `thorsten-angry-nicht-weg.mp3`, `thorsten-angry-duemmer.mp3`, `thorsten-angry-klappt-nicht.mp3` |
| disgusted (Germanness loss) | `thorsten-disgusted-nichts-geschafft.mp3` |
| amused | `thorsten-amused-nachschub.mp3` |
| sleepy (ambient pedestrian) | `thorsten-sleepy-nichts-geschafft.mp3` |
| Bayern character | `bayern/*.mp3` (user-owned recording excerpts) |

The generated law clips conditioned only on the three angry files plus the
disgusted file. For an official, slow narrative monologue use the closest
speaking-style reference above; XTTS keeps the reference's timing and delivery.

## App workflow (one clip)

Tools/`tools/voice-cloner/voice_cloner.pyw` (desktop shortcut "Voice Clone Lab"):

1. Wählen: pick the reference recording (`assets/voices/...`).
2. Paste the complete spoken text exactly as it will be displayed; no stage
   directions, no abbreviations, no artificial tokens such as `QuerO` or
   `Bln/DE` (unstable speech input).
3. Optional: set the output folder (default: beside the reference).
4. Erzeuge MP3. Output: `Mono 22.05 kHz, 64 kbit/s`,
   `assets/voices/_refname_-YYYYMMDD-HHMMSS.mp3` in the chosen folder.

## Batch workflow (efficient)

For several clips at once, drive the same `TTS.api` in one Python process so
the ~1.9 GB model loads once instead of per clip:

```powershell
$code = @'
import os
os.environ["COQUI_TOS_AGREED"] = "1"   # pre-accept CPML; required for headless runs
import TTS.api, time, os  # noqa: E402
tts = TTS.api.TTS("tts_models/multilingual/multi-dataset/xtts_v2").to("cpu")
jobs = [  # (reference, output_stem, text)
    (r"assets\voices\thorsten-angry-nicht-weg.mp3", "my-law", "Deine exakte Sprechzeile."),
]
for ref, stem, text in jobs:
    wav = f"tmp_{stem}.wav"
    tts.tts_to_file(text=text, speaker_wav=[ref], language="de", file_path=wav)
    os.system(f'ffmpeg -y -loglevel error -i "{wav}" -ac 1 -ar 22050 -b:a 64k "{stem}.mp3"')
    os.remove(wav)
'@
$code | & "C:\Users\Georgeous\anaconda\python.exe" -
```

Guidelines:
- Load the model once per process, never per line.
- Long monologues: `split_sentences` (default) handles natural breaks; for very
  long scripts (> ~3 sentences per paragraph of a multi-minute monologue) run
  paragraph by paragraph and concatenate the WAVs, so a mid-text error does not
  restart the whole clip.
- Keep every input string to the exact displayed sentence(s). The same string
  is the browser-speech fallback, so display and audio must match.

## Validation (do before shipping)

1. `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 <clip>` to check duration is sane.
2. Transcribe locally (Whisper `small`, German, word timestamps) and confirm the
   clip contains every intended sentence ending and no invented leading or
   trailing speech (post-sentence model leakage).
3. Encode as mono 22.05 kHz / 64 kbit/s, then run
   `tools/normalize-audio.ps1 -Apply`. Every foreground voice must land within
   `±0.3 LU` of `−18 LUFS` and remain at or below `−1.5 dBTP`; the command
   preserves sample rate, channel layout, approximate bitrate, and duration.
   Run `tools/normalize-audio.ps1` without `-Apply` as the final check.
4. Record the normalized result in `assets/voices/LICENSES.md` and map the clip in the
   corresponding `game.js` deck with the identical displayed string as the
   missing-file fallback.
