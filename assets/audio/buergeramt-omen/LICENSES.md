# Aktenkurier omen audio provenance

These two encounter-only loops were composed and synthesized for Germany Simulator. They use original SuperCollider code in [`render.scd`](render.scd), core oscillators and filters, and no imported recording, sample bank, third-party plugin, model, or service. The repository owner controls redistribution of these project-authored recordings and source; this notice does not assert a separate license for unrelated game assets. SuperCollider and FFmpeg are production tools, not shipped runtime dependencies.

| Shipped file | Role | Format | Duration | Size | SHA-256 |
| --- | --- | --- | ---: | ---: | --- |
| `bed.ogg` | Beating bass, FM growl, crushed saw brass and unresolved flattened-second/tritone pressure | Ogg Vorbis, 48 kHz stereo | 16.000 s | 101,889 B | `3c6278bbc2fdabe643fb1fd31a2d750177da4393846edf7488a6550180e237b6` |
| `tension.ogg` | Saturated inharmonic partials and ring-modulated bowed-metal/machinery bands | Ogg Vorbis, 48 kHz stereo | 16.000 s | 178,628 B | `339b662268595ab146efa979848caa764ae8ab2ac84cae837282ea14f5bcc55c` |

Combined shipped audio: 280,517 B; decoded float32 stereo costs 12,288,000 bytes for both 16-second layers. The oscillator frequencies have integer cycles over 16 seconds, so a loop can hold while approach time varies. No fixed pulse, riser, attack or resolving chord is baked into either file. The controller's shared `omen.life` signal owns depth, pressure, accelerating pulses, speech contour and abrupt reset; Web Audio and Gaussian animation both project it. The 2026-10-08 revision deliberately increases timbral aggression through distortion and metallic density while retaining sample headroom.

## Rebuild

Production used the portable SuperCollider 3.14.1 `sclang.exe` and `scsynth.exe` at `C:\Users\cogpsy-vrlab\AppData\Local\Programs\SuperCollider-3.14.1\SuperCollider\`. The official archive SHA-256 supplied to this task was `a5f95416307d35c039ca53a9f9c6151c26585064d3229521093a60dddb9458cd`; the archive itself is not a game asset. FFmpeg was 8.0.1 (`full_build-www.gyan.dev`). Run the following from the repository root; `SC_SYNTH_PATH` points NRT rendering at `scsynth.exe`. This never boots an audio device.

```powershell
$env:SC_SYNTH_PATH='C:\Users\cogpsy-vrlab\AppData\Local\Programs\SuperCollider-3.14.1\SuperCollider\scsynth.exe'
New-Item -ItemType Directory -Force output/omen-audio | Out-Null
& 'C:\Users\cogpsy-vrlab\AppData\Local\Programs\SuperCollider-3.14.1\SuperCollider\sclang.exe' 'assets/audio/buergeramt-omen/render.scd'
ffmpeg -y -i output/omen-audio/bed-warm.wav -af 'atrim=start_sample=768000:end_sample=1536000,asetpts=PTS-STARTPTS' -c:a pcm_f32le output/omen-audio/bed.wav
ffmpeg -y -i output/omen-audio/tension-warm.wav -af 'atrim=start_sample=768000:end_sample=1536000,asetpts=PTS-STARTPTS' -c:a pcm_f32le output/omen-audio/tension.wav
ffmpeg -y -i output/omen-audio/bed.wav -c:a libvorbis -q:a 3 assets/audio/buergeramt-omen/bed.ogg
ffmpeg -y -i output/omen-audio/tension.wav -c:a libvorbis -q:a 3 assets/audio/buergeramt-omen/tension.ogg
& 'C:\Users\cogpsy-vrlab\AppData\Local\Programs\SuperCollider-3.14.1\SuperCollider\sclang.exe' 'assets/audio/buergeramt-omen/preview.scd'
```

The 32-second NRT renders include a 16-second warm-up. The exact 768,000-frame second pass is cropped to each shipped loop. [`preview.scd`](preview.scd) produces an illustrative finite 13.1-second mix from those WAVs, with speech space and a cutoff. It synthesizes no dialogue and does not reproduce the controller's adaptive pulse or actual speech receipts; the integrated game is the timing authority. WAV renders, analysis and the preview stay in ignored `output/omen-audio/`.

## Measured checks and limits

FFmpeg identifies both revised files as Vorbis, 48 kHz stereo and 16.000 seconds. Its `loudnorm` input analysis measured `bed.ogg` at −22.30 LUFS integrated and −13.31 dBTP; `tension.ogg` at −19.99 LUFS and −12.62 dBTP. These measurements describe the revised source layers before the runtime bus, pulse, filter and voice ducking; they do not imply an acoustic synchronization or perceived-quality result.

These are file and signal measurements. They do not establish perceived quality, dialogue intelligibility, browser/device playback, or acoustic timing. A browser game should fetch/decode after its normal audio gesture, use its existing bus and mute controls, and keep the oscillator fallback if loading fails. A late decode must not revive an already completed or cancelled omen.
