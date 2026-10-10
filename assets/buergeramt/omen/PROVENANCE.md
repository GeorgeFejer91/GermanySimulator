# Aktenkurier blackout Gaussian sculpture

`aktenkurier.splat` is an offline-authored approximate volume of the accepted
Aktenkurier gesture. It uses existing project artwork; no new image generation,
external service, learned reconstruction, model download or license is added.
The original artwork provenance remains under `assets/sprite-sources/buergeramt/`.

`tools/build-omen-splat.py` owns the deterministic construction. The accepted
gesture cell `(640, 0, 1280, 832)` in
`assets/buergeramt/characters/aktenkurier-detail.webp` supplies front colors and
pixel positions. The registered 512 × 512 `gesture.png` supplies anatomical
landmarks. `up.png` supplies row-registered paint for the rear shell. Original
rasters are never modified. Source and delivery SHA-256 hashes, counts, bounds
and the coordinate contract are recorded in `manifest.json`.

The Gaussian centers sculpt the skull, nose, neck, long coat, two bent arms,
file stack, separate legs and shoes. The rear shell gives the figure finite
thickness. This is a bounded painted sculpture for a brief ±25° turn, not a
measured human model or full-orbit reconstruction. Rear registration is an
approximation. The local speech rig below adds lip/jaw articulation; the figure
has no general skeletal or relighting model.

## Runtime contract

- Standard 32-byte `.splat` records: little-endian XYZ float32, scale float32,
  RGBA bytes, quaternion WXYZ bytes. The identity quaternion is `[255,128,128,128]`.
- 38,938 records, 1,246,016 bytes: 33,950 front and 4,988 rear. No runtime raster
  is added. A 16-byte packed representation would contain 623,008 bytes of
  record data; GPU texture allocation, sorting and renderer overhead are extra.
- Local +Z faces the viewer. Local Y is already measured from the actor floor,
  so place the splat at the actor root, without adding the sprite center offset.
  The full 640 × 832 frame maps to width `1.5076923076923079`, height `1.96`,
  centered at `(0, .98, 0)`. Preserve its transparent feet margin.
- Each front sample has exactly the accepted detail pixel's RGB/alpha and
  `X=((pixelX+.5)/640-.5)*width`, `Y=(1-(pixelY+.5)/832)*height`.
  Gaussian filtering approximates the raster between those samples; this is
  spatial registration, not a claim of pixel-identical rendered output.
- Face/hair use one sample per detail pixel; the upper body, hands, file stack
  and coat through working-source Y=350 use a 2px grid. Lower coat/legs use a
  3px grid and the rear uses 5px. Front XY sigma is .62 times face spacing and
  .61 times other spacing. Front depth sigma is .0009 for the face and .002
  elsewhere to keep thickness from blurring paint when viewed at an angle.
- Front centers have Z > 0; rear centers have Z < 0. Hide the rear when depth
  collapses and fade it in with expansion. Multiply center Z by the expansion
  amount. All rotations are identity to preserve the collapsed XY footprint.
- Load only on office/omen approach, keep the accepted sprite as the loading
  and failure fallback, and let the integrator own cache/teardown and browser
  responsiveness checks. Asset size alone does not establish playability.

## Reproduce and inspect

```powershell
python tools/build-omen-splat.py
python tools/build-omen-splat.py --check --preview
```

The check rebuilds in memory and verifies shipped bytes and manifest, finite
positive scales, count/byte bounds, exact front sample XY/RGBA, depth span and
front/rear signs. These checks passed on Python with Pillow 12.2.0 / NumPy 2.4.2.
Two consecutive builds matched the delivery hash in the manifest.

The optional CPU Gaussian projections live in ignored `output/omen-splat/asset/`:
collapsed, expanded front, −22° and +22°, plus a contact sheet. They were visually
inspected for face/prop/feet alignment and turn parallax. These orthographic
projections are asset QA, not Spark/WebGL screenshots or desktop/mobile frame
time evidence. Actual scene lighting, compositing, transition and fallback
acceptance belong to the integrated browser review.

The denser revision follows inspection of the integrator's first browser image
`output/omen-splat/review/desktop-morph-15.png` against the accepted sprite at
`output/omen-splat/before/desktop-peak.png`: the initial 22,951-record asset
softened face and paperwork detail. The revised CPU projections preserve clearer
eyes, hair, fingers and paper edges; browser confirmation remains required.

## Recorded Gaussian mouth rig

The immutable official second voice recording is
`assets/voices/horst-stempelmann/omen-candidate-02.mp3`, SHA-256
`da75a78e3d721f478f44e02327961f3d2933595dcc1bbdc8c73510af0ccf5df4`,
4.760 seconds. Its approval/provenance remains in `assets/voices/LICENSES.md`.
No audio or source raster was changed for articulation.

`tools/build-omen-lipsync.py` uses portable
[Rhubarb Lip Sync 1.14.0](https://github.com/DanielSWolf/rhubarb-lip-sync/tree/v1.14.0)
with its language-independent phonetic recognizer and FFmpeg mono 16 kHz decode.
Its software is [MIT licensed](https://github.com/DanielSWolf/rhubarb-lip-sync/blob/v1.14.0/LICENSE.md);
no executable, recognizer data or temporary WAV ships. The Windows release ZIP
was 87,374,842 bytes, SHA-256
`62fa416a8d5e382a3828ee4bef358ce520d0b4cabdeaea75a7ac266d098d1fe3`.
The compact derived `mouth-cues.js` is project-owned estimated animation data:
24 intervals / 238 RMS-envelope samples at 50 Hz / 2,131 UTF-8 bytes.
Phonetic output approximates articulation; it is not exact German alignment.

```powershell
python tools/build-omen-lipsync.py --rhubarb <portable-rhubarb.exe> --ffmpeg <ffmpeg.exe>
python tools/build-omen-lipsync.py --rhubarb <portable-rhubarb.exe> --ffmpeg <ffmpeg.exe> --check
```

The runtime uses native media `currentTime` in the existing frame pass, with
55 ms shape blending. The registered lip centre is detail pixel `(346.5,134)`
(local X=.0636, Y=1.64315). The original front lip crease reaches Z=.156;
96 small procedural Gaussian kernels form a curved opening at Z=.174 minus
12×X-offset², with zero alpha at rest. Front lip/lower-jaw splats deform within
a bounded local mask; eyes, scalp, coat, props and floor pivot stay authored.
Kernels share the body mesh, depth sorting, admission and teardown. They add
1,536 packed bytes, with allocation/sorting overhead additional.

The exact recording path and SHA guard the rig. Other phases, voice-off,
browser-speech fallback, failed audio and ended playback are neutral. Pause
holds the media pose and existing life clock; reduced motion retains the
articulation. `tests/aktenkurier-lipsync.test.mjs` covers clip ownership, cues,
shapes, closure and fallback; the official-voice tests cover native clock and
pause/end ownership. `tools/playtest-aktenkurier-lipsync.mjs` silently plays the
real native recording without seeking, samples closed/consonant/vowel/bite/
rounded states and checks pause/end/replay/exit in desktop and Android-emulated
portrait/landscape, reduced motion and forced audio/splat failure. Rendered
identity/anatomy judgments remain separate from numeric cue checks.
