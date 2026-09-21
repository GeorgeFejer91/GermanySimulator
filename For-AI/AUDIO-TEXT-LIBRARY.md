# Audio-text and English subtitle authority

[`AUDIO-TEXT-LIBRARY.js`](./AUDIO-TEXT-LIBRARY.js) is the single runtime and durable source for English subtitles. It contains:

- exact English renderings for every authored browser-speech pool;
- English renderings for every recorded character clip;
- English question text for all 73 civic, fictional-driving, and original grammar prompts, plus the factual context attached to each quiz category;
- exact source transcripts and time-segmented English cues for the five long station-hall recordings;
- explicit exclusions for background music and non-verbal sound effects.

The root page loads the library before `game.js`. `game.js` combines its English pools with the existing source-language arrays and starts or clears subtitles only from the shared stimulus broker. Recorded subtitles begin in the same task as `AudioBufferSourceNode.start()`, long cues continuously select against the Web Audio clock instead of accumulating timer drift, synthetic subtitles begin from `SpeechSynthesisUtterance.onstart`, and both clear when that broker item ends or is cancelled. The toggle is independent of music and voice, defaults off, and persists locally in the browser.

Enabling subtitles queues the authored German subtitle-approval notice through that same broker when voice is enabled. Its low, measured browser-voice treatment is intentionally robotic and bureaucratic; its English rendering is stored in `lines` with every other synthesized source line.

## Train transcription record

The five files under `assets/audio/trains/` were transcribed locally on 2026-09-21 with OpenAI Whisper `small`, German language mode, and CPU inference. A second Whisper translation pass supplied draft English segmentation. Source text and English were then manually corrected against the supplied filenames and audible context. The checked cue timings live beside each train entry in the JavaScript library.

## Maintenance rule

When a spoken line or recording changes, update the source text and English text in the library in the same change. Long recordings need short timestamped cues; short lines may use one exact event-length subtitle. Do not add entries for songs, soundtrack cues, sirens, horns, thunder/crush sounds, UI tones, or fax-machine effects.
