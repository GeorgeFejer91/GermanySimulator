# Recorded office mouth cues

`mouth-cues.js` is derived animation data for the eligible `amt-` recordings
in `For-AI/AUDIO-TEXT-LIBRARY.js`, including the official Aktenkurier omen.
Every entry retains the exact source text, recording path and SHA-256. Audio,
voice profiles and painted images are unchanged.

`tools/build-buergeramt-speech-cues.py` decodes the final encoded MP3 to mono
16 kHz with FFmpeg. Portable [Rhubarb Lip Sync 1.14.0](https://github.com/DanielSWolf/rhubarb-lip-sync/tree/v1.14.0)
uses its language-independent phonetic recognizer with GHX shapes. Its
[MIT-licensed](https://github.com/DanielSWolf/rhubarb-lip-sync/blob/v1.14.0/LICENSE.md)
Windows ZIP is 87,374,842 bytes, SHA-256
`62fa416a8d5e382a3828ee4bef358ce520d0b4cabdeaea75a7ac266d098d1fe3`.
No executable, model, WAV or analysis log ships.

The sound envelope samples RMS every 10 ms, normalizes to the clip's 90th
percentile, suppresses levels below 4.5% of that reference and stores a
gamma-adjusted unsigned byte. The generated module uses LF line endings. The
runtime interpolates this envelope and centres smooth mouth-shape changes on
their measured boundaries, with at most 40 ms anticipation/release. Native
media `currentTime` owns playback, pause, seeking and rate changes. This
resolution does not establish 10 ms German phoneme accuracy or hardware
acoustic latency. Phonetic shapes remain estimates.

The optional independent ASR check used the already installed OpenAI Whisper
20250625 with its cached `base` model, German, word timestamps, deterministic
temperature zero, CPU and no expected-text prompt. The original 41-clip pack was decoded;
normalized transcript similarity averaged 97.94%, with a minimum of 90.48%.
These diagnostics stay under ignored `output/mouth-sync/analysis/`. Approved
catalogue word timestamps remain the word-receipt authority; ASR mistakes do
not rewrite dialogue, voices or audio. Browser-generated and optional preview
lines without an approved recording retain explicitly estimated articulation.

```powershell
python tools/build-buergeramt-speech-cues.py --rhubarb <rhubarb.exe> --ffmpeg <ffmpeg.exe> --reuse-unchanged
python tools/build-buergeramt-speech-cues.py --rhubarb <rhubarb.exe> --ffmpeg <ffmpeg.exe> --reuse-unchanged --check
```

Unchanged analysis is reused only with matching ownership, encoded hash and
complete cues/envelope. Omit `--reuse-unchanged` to rebuild it; the independent
Whisper diagnostic remains optional via `--whisper-model base`.

The shared builder/data replaces the separate omen-only mouth pipeline.
`tests/buergeramt-speech-cues.test.mjs` checks every approved hash, acoustic
silence, contiguous intervals and centred timing. The silent recorded-mouth
browser fixture checks actual media receipts and cleanup for every clip.

On 2026-10-11 the pack retained 36 unchanged accepted tracks, removed the five
retired fever recordings, and added acoustic analysis of 17 independently
word-checked selected-profile Knick MP3s. The added analysis used the same
FFmpeg/Rhubarb pipeline; no additional Whisper pass, synthesis, listening or
artwork edit occurred. Exact source and encoded hashes remain mandatory.

The final fixed-voice pack contains 180 tracks (395,693 UTF-8 bytes with LF
line endings): 36 unchanged tracks and 144 eligible selected-profile Knick
recordings. Superseded first-pass tracks are replaced only after audio hash
changes; street rules are outside this office pack. Every current
catalogue path/hash is checked. Acoustic bin counts recover the integer 16 kHz
sample count before division by 160, avoiding an extra bin from floating-point
rounding while retaining a genuinely partial last bin. The full reuse check
passes without another phonetic analysis or ASR model load.
