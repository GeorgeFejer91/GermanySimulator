# Recorded office mouth cues

`mouth-cues.js` is derived animation data for the 41 approved `amt-` recordings
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
gamma-adjusted unsigned byte. The compact module is 79,891 UTF-8 bytes with LF line endings. The
runtime interpolates this envelope and centres smooth mouth-shape changes on
their measured boundaries, with at most 40 ms anticipation/release. Native
media `currentTime` owns playback, pause, seeking and rate changes. This
resolution does not establish 10 ms German phoneme accuracy or hardware
acoustic latency. Phonetic shapes remain estimates.

The optional independent ASR check used the already installed OpenAI Whisper
20250625 with its cached `base` model, German, word timestamps, deterministic
temperature zero, CPU and no expected-text prompt. All 41 clips were decoded;
normalized transcript similarity averaged 97.94%, with a minimum of 90.48%.
These diagnostics stay under ignored `output/mouth-sync/analysis/`. Approved
catalogue word timestamps remain the word-receipt authority; ASR mistakes do
not rewrite dialogue, voices or audio. Browser-generated and optional preview
lines without an approved recording retain explicitly estimated articulation.

```powershell
python tools/build-buergeramt-speech-cues.py --rhubarb <rhubarb.exe> --ffmpeg <ffmpeg.exe> --whisper-model base
python tools/build-buergeramt-speech-cues.py --rhubarb <rhubarb.exe> --ffmpeg <ffmpeg.exe> --check
```

The shared builder/data replaces the separate omen-only mouth pipeline.
`tests/buergeramt-speech-cues.test.mjs` checks every approved hash, acoustic
silence, contiguous intervals and centred timing. The silent recorded-mouth
browser fixture checks actual media receipts and cleanup for every clip.
