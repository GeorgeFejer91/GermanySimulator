# Aktenkurier omen audio provenance

These two encounter-only loops were composed and synthesized for Germany Simulator. They use original SuperCollider code in [`render.scd`](render.scd), core oscillators and filters, and no imported recording, sample bank, third-party plugin, model, or service. The repository owner controls redistribution of these project-authored recordings and source; this notice does not assert a separate license for unrelated game assets. SuperCollider and FFmpeg are production tools, not shipped runtime dependencies.

| Shipped file | Role | Format | Duration | Size | SHA-256 |
| --- | --- | --- | ---: | ---: | --- |
| `bed.ogg` | Low, slowly beating A pedal with a quiet flattened second and narrow airy partials | Ogg Vorbis, 48 kHz stereo | 16.000 s | 74,681 B | `38fefe527023df07ba57e080fe6f9c05bbfae0869b71cac8e5a66194ed6eb6ef` |
| `tension.ogg` | Thin inharmonic metallic and airy upper layer | Ogg Vorbis, 48 kHz stereo | 16.000 s | 137,463 B | `c785087e06cebca4a4937f72ec265cc51a9abab91ebe4be341e2c8c0f0a22ca1` |

Combined shipped audio: 212,144 B. The oscillator frequencies and modulations have integer cycles over 16 seconds, so a loop can hold while approach time varies. No fixed riser is baked into either file. The game owns approach intensity, arrival peak, speech ducking, and abrupt reset.

## Rebuild

Production used the portable SuperCollider 3.14.1 `sclang.exe` and `scsynth.exe` at `C:\Users\cogpsy-vrlab\AppData\Local\Programs\SuperCollider-3.14.1\SuperCollider\`. The official archive SHA-256 supplied to this task was `a5f95416307d35c039ca53a9f9c6151c26585064d3229521093a60dddb9458cd`; the archive itself is not a game asset. FFmpeg was 8.0.1 (`full_build-www.gyan.dev`). Run the following from the repository root; `SC_SYNTH_PATH` points NRT rendering at `scsynth.exe`. This never boots an audio device.

```powershell
$env:SC_SYNTH_PATH='C:\Users\cogpsy-vrlab\AppData\Local\Programs\SuperCollider-3.14.1\SuperCollider\scsynth.exe'
& 'C:\Users\cogpsy-vrlab\AppData\Local\Programs\SuperCollider-3.14.1\SuperCollider\sclang.exe' 'assets/audio/buergeramt-omen/render.scd'
ffmpeg -y -i output/omen-audio/bed-warm.wav -af 'atrim=start_sample=768000:end_sample=1536000,asetpts=PTS-STARTPTS' -c:a pcm_f32le output/omen-audio/bed.wav
ffmpeg -y -i output/omen-audio/tension-warm.wav -af 'atrim=start_sample=768000:end_sample=1536000,asetpts=PTS-STARTPTS' -c:a pcm_f32le output/omen-audio/tension.wav
ffmpeg -y -i output/omen-audio/bed.wav -c:a libvorbis -q:a 3 assets/audio/buergeramt-omen/bed.ogg
ffmpeg -y -i output/omen-audio/tension.wav -c:a libvorbis -q:a 3 assets/audio/buergeramt-omen/tension.ogg
& 'C:\Users\cogpsy-vrlab\AppData\Local\Programs\SuperCollider-3.14.1\SuperCollider\sclang.exe' 'assets/audio/buergeramt-omen/preview.scd'
```

The 32-second NRT renders include a 16-second warm-up. The exact 768,000-frame second pass is cropped to each shipped loop. [`preview.scd`](preview.scd) produces the finite 13.1-second `output/omen-audio/omen-choreography-preview.wav`: approach rise, 7.2-second arrival peak, a reduced bed during the space for the existing line, a 30 ms cutoff, and ordinary fluorescent hum after the reset. It synthesizes no dialogue. WAV renders, analysis and the preview stay in ignored `output/omen-audio/`.

## Measured checks and limits

FFprobe identifies both files as Vorbis, 48 kHz, stereo and 16.000 seconds. FFmpeg decoded each to exactly 768,000 frames. FFmpeg `loudnorm` measured `bed.ogg` at −22.45 LUFS integrated and −12.20 dBTP; `tension.ogg` at −21.57 LUFS and −12.04 dBTP. The unattenuated sum measured −18.98 LUFS and −8.32 dBTP. Decoded sample-join jumps were −66.98 dBFS for the bed and −57.69 dBFS for tension; each is smaller than the corresponding ordinary adjacent-sample steps. The preview rose from −49.06 dBFS RMS during its first two seconds to −25.17 around arrival, then fell to −35.24 during the line space and −41.68 after reset. Exact PCM and checksum checks are recorded in ignored `output/omen-audio/analysis.json`.

These are file and signal measurements. They do not establish perceived quality, dialogue intelligibility, browser/device playback, or acoustic timing. A browser game should fetch/decode after its normal audio gesture, use its existing bus and mute controls, and keep the oscillator fallback if loading fails. A late decode must not revive an already completed or cancelled omen.
