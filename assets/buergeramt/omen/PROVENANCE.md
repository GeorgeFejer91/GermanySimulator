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
approximation, and the figure has no articulation or relighting model.

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
