# Asset and efficiency policy

## Decision

Use one asset authority at root `assets/`, with fidelity selected by the client. Desktop may use high-resolution period artwork where it is visibly valuable; mobile must prefer minimal vector or otherwise lightweight variants.

## Desktop and mobile

- Desktop billboard direction: high-resolution, Weimar-era-inspired commercial artwork with deterministic game-rendered copy. Avoid real propaganda, extremist symbols, political insignia, and text baked unreliably into generated images.
- Mobile billboard direction: the existing minimalist fax-machine vector style or an equally small deterministic alternative.
- The shipped desktop fax-ad pool is the two user-supplied, game-readable motifs under `assets/billboards/fax/`; the eagle-insignia variants from the source pack are intentionally not shipped. Three.js maps them onto 3D billboard meshes, while viewports below 700 px keep a generated lightweight fax texture and do not request the WebPs.
- Share gameplay data, placement, copy, and interaction logic. Only the visual representation should vary by capability or viewport.
- Load a desktop-only raster only when the desktop representation is actually selected. Do not make mobile download an unused high-resolution alternative.
- Prefer WebP/AVIF for large raster delivery when browser support and visual QA are adequate; retain SVG for simple line art and signs.
- The title screen uses the single transparent vectorized illustration at `assets/fax-wurst.svg`; animate that shipped SVG with CSS and do not add the generated raster as a second runtime variant.
- The Wurstsammlerpass and its transient collection card use the nine locally bundled Creative Commons WebPs under `assets/wurst/` (about 0.31 MB total). Both desktop and mobile use the same compact files; the world pickups remain procedural, and `assets/wurst/LICENSES.md` is the attribution, modification, and checksum authority.
- The user-supplied wrong-answer sting is an in-game-only asset. Preserve its provenance notice and checksum in `assets/voices/LICENSES.md`; do not claim a broader license or treat it as a general-purpose project asset.
- The user-linked humor-form fax recording is an in-game-only local MP3 at `assets/fax-machine-paper-feed.mp3`. Preserve its source and checksum in `CREDITS.md`, do not claim a license that the source does not provide, and keep the synthesized Web Audio fax feed as the missing-file fallback.
- The user-supplied opening music is one in-game-only local MP3 at `assets/intro-song.mp3`, trimmed by exactly 24 seconds at the start. It plays once before the shared background playlist. The sung pool under `assets/audio/music/sung/` follows one song after every three synthesized 8-bit arrangements. The user-supplied `assets/audio/music/wurst.mp3` interrupts that playlist once when the fifth of nine unique sausages is collected, while still obeying the music toggle and audio-text ducking. Preserve source and shipped checksums in `CREDITS.md` and `assets/audio/music/PROVENANCE.md`; do not claim external redistribution rights that have not been established.
- Keep emotional pedestrian recordings to a small local MP3 subset with exact-text bark mappings, durable source and checksum records in `assets/voices/LICENSES.md`, and browser-speech fallback. Do not fetch the full dataset or depend on a remote audio host at runtime.
- Keep Merkel's user-supplied Neuland excerpt under `assets/voices/merkel/`, mapped only to its exact displayed quotation and documented in `CREDITS.md` plus `assets/voices/LICENSES.md`. It follows the same foreground normalization and proximity-broker rules as her existing “Wir schaffen das” excerpt; do not imply external redistribution rights.
- Keep the 13 generated §-power readings and 11 rotating-rule readings under `assets/voices/laws/`, indexed directly to their fixed decks. §-power audio must use the exact displayed quotation; rotating-rule audio must read the complete displayed body while its shorthand identifier remains visual. Both retain German browser-speech fallback and record their CC0 references, local XTTS-v2 generation method, durations, and checksums in `assets/voices/LICENSES.md`. The cloning model is an offline production tool, never a runtime dependency or shipped model.
- Keep the user-supplied Bayern and Alice recordings as local foreground MP3s under `assets/voices/bayern/` and `assets/voices/alice-weidel/`, with exact-text runtime mappings and checksums in `assets/voices/LICENSES.md`. Alice's source recordings are user-supplied satirical material, not verified quotations or factual claims. Merkel, Merz, Bayern, and Alice retain registered 256 px key-pose sheets under `assets/sprite-sources/` with 6×5, 8×6, 8×4, and 8×2 grids. `tools/build-sprite-transitions.py` derives the only runtime atlases at 24×5, 32×6, 32×4, and 32×2 by adding three motion-compensated in-betweens between every key pair and the loop seam, then downscaling each runtime cell to 128 px in premultiplied-alpha space. Runtime atlases remain full RGBA with zero RGB behind fully transparent pixels; never palette-reduce their antialiased edges. Every source cell follows the same anatomical grid: head center x=128, body midpoint y=128, row-consistent scale, transparent edge clearance, and no cross-cell pixels. Merz's irrecoverably clipped front-pouring row uses an identity-preserving repair render. At load time one shared staging canvas supplies the Three.js sprite texture with smooth sampling; do not dilate authored alpha or carry compensating per-frame offsets for an incorrectly registered source. Follow `SPRITE-GENERATION-PROTOCOL.md` for gait keys, build commands, and visual acceptance.
- Perimeter trains use two Kenney Train Kit end-car GLBs under `assets/models/kenney-trains/` plus the 1.56 MB Open L-Gauge n-Wagen coach under `assets/models/open-l-gauge-nwagen/`. The n-Wagen derivative is CC BY-NC-SA 4.0 and may remain only while the game is noncommercial; preserve its adjacent full attribution, modification, license, and checksum record. The assets remain fictional `AMT-BAHN` rolling stock: do not add Deutsche Bahn or Märklin logos, trademarked textures, or a cloned real announcer voice. The five user-supplied station-hall MP3s under `assets/audio/trains/` are approved only as in-game ambient audio; preserve `PROVENANCE.md`, make no Deutsche-Bahn-authenticity or redistribution claim, and do not display an invented transcript. Missing GLBs keep the procedural train fallback.

## YAGNI rules

Backend, infrastructure, and asset-pipeline choices are deliberately conservative:

1. Use `$ponytail` for these decisions when the skill is installed.
2. If `$ponytail` is unavailable, disclose that and apply this checklist directly; do not invent the skill’s content.
3. Keep the game static-first. Do not add a database, API, asset server, CMS, CDN dependency, bundler, runtime model service, or telemetry backend without a concrete accepted requirement.
4. Reuse an existing asset or renderer before creating a new abstraction.
5. Do not add an asset variant until a real desktop/mobile visual or performance distinction requires it.
6. Avoid duplicate runtime trees and duplicate source artwork. One source placement, one loader decision, one fallback.
7. Measure network size, decode cost, memory, and frame impact before building optimization infrastructure.
8. Prefer a small manifest or direct mapping over a generalized asset registry until at least two independent asset families need the same abstraction.
9. Root HTML entry points append one release token to CSS and JavaScript URLs. Bump that token whenever a user-visible Pages release changes those files so GitHub Pages' ten-minute asset cache cannot mix old runtime code with new HTML.

## Acceptance

An asset change is complete only when the correct variant loads on desktop and mobile, missing files fail gracefully, the browser console stays clean, and gameplay/interactions remain unchanged unless the task explicitly changes them.

## Local 3D buildings

- Root `assets/models/` is the only authority for shipped model files.
- The root game has one required WebGL presentation path. Do not preload or restore the retired SVG/Canvas world-art set. Registered moving-character PNG atlases remain the deliberate bitmap exception; DOM UI art and billboard textures are not alternate world renderers.
- Trees are canonical world data in `game.js`, not renderer-local decoration. Apply the rail-gutter city offset exactly once, keep each trunk center at least 48 world units outside every road rectangle, expose the same placement to `world3d.js` and `3d.html`, and keep trees solid to ground movement.
- The selected Kenney City Kit Commercial meshes are local CC0 GLB files; retain their local license and source record.
- The southeast Berlin parcel uses the original texture-free `assets/models/bundestag/bundestag.glb` landmark. Keep its ground-centered pivot, restrained stone/glass materials, local provenance and checksum record, and the procedural-building fallback.
- `world3d.js` may recolor model materials at runtime to the restrained concrete-gray bureaucracy palette. Do not restore the pack's bright commercial colors by default.
- GLBs are the preferred world representation. A missing individual model keeps its procedural 3D stand-in, while failure of the required WebGL renderer shows a blocking retry notice instead of reviving the retired Canvas world.
- Keep the selected model set bounded and measure total transfer size before adding another pack.
- The power-plant landmark uses five local CC0 GLBs under `assets/models/power-plants/` (about 0.5 MB total): three selected Kenney Industrial meshes plus a nuclear transformer and warning sign from 3DAssets.dev. Preserve `LICENSES.md`, its AI-generation disclosure, source URLs, and checksums when replacing these files.

## Local 3D perimeter trains

- `game.js` owns the two rounded-loop paths around the 10,960 × 5,360 world, the 560-unit city-to-rail gutter, twelve train centers, 84 articulated car transforms, per-train speed and acceleration, unexplained pauses, contact stops and reversals, same-lane spacing, player obstruction, and announcement timing. Each seven-car array belongs to one logical train. `world3d.js` only renders that state and must not run a second train simulation in the canonical game.
- The WebGL renderer loads each rolling-stock source once and clones them into the twelve articulated consists, using one Kenney front, five full-length Open L-Gauge n-Wagen middle coaches, one Kenney rear, and short procedural flexible gangways. Each car follows its shared semantic transform independently through curves. Keep geometry, the n-Wagen's tiny embedded palette, and all runtime assets local; there is no runtime asset host.
- Missing-model paths use full-length procedural 3D red-and-white cars. Both GLB and procedural representations must preserve two continuous tracks around the full perimeter, broad rounded corners, coupled cars, oriented solid coach bodies, and the hard no-overlap/no-passing rule. A collision clamps both consists at the minimum gap, exposes a brief visual bump, stops both, and reverses their motion after a fixed pause without flipping or splitting their physical car order.
- The five local train-announcement recordings rotate only while the player is near either loop. They are ambient broker requests until admitted, then fixed-level foreground `audio-text` events: one recording plays to completion, later dialogue waits, and background music plus the shared sound-effect bus duck for intelligibility. Distance controls eligibility only. A new player-caused train stop always reserves the Buxtehude file as a critical request. Train recordings never open the dialogue textbox and still follow the voice toggle. Do not synthesize, infer, or display transcripts for these recordings. EBO obstruction hints remain exact visible-and-spoken gameplay warnings through the same serialized audio-text path.

## Local 3D civilian traffic

- Berlin traffic clones the 44 KB local `assets/models/traffic/classic-vw-beetle.glb`, derived from the CC BY-SA 4.0 Sutherland Volkswagen STL on Wikimedia Commons, and surrounds that historic body scan with small game-authored wheels, hubs, glazing, bumpers, and lamps. Preserve the adjacent `LICENSES.md` attribution, modification notes, source hash, and runtime hash; the converted GLB remains CC BY-SA 4.0.
- `game.js` owns lane population, region identity, movement, obstruction, queueing, collision, and horn timing. `world3d.js` loads the Type 1 source once and clones it for Berlin cars; Trabants remain lightweight code-native geometry.
- Missing-model paths retain procedural 3D car silhouettes. Keep all traffic assets local, avoid manufacturer logos and textures, and do not add a vehicle-physics package or remote runtime asset host for this bounded system.

## Procedural Wirtschaftswunder vortex

- The construction-site vortex beside the western Schrebergarten is code-native Three.js geometry and shader work. It uses no bitmap, model, post-processing, or remote runtime asset: layered polar spiral materials, a dark funnel, construction barriers, and deterministic canvas-text signs provide the complete presentation.
- `game.js` owns the site coordinates, collision radius, traffic diversion, spiral/sink progress, disappearance, and far-lane respawn. `world3d.js` projects that state, applies bounded car pitch/roll/scale, and uses small view-relative offsets between spiral layers for the depth/parallax illusion.
- Keep the bold sign text exactly `WIRTSCHAFTSWUNDER!`. Preserve the short, cyclical traffic behavior rather than adding a physics engine, particle package, duplicate car pool, or authored vortex asset.

## Audio normalization and focus

- `tools/normalize-audio.ps1` is the only audio-level maintenance command. It checks by default and rewrites only with `-Apply`, using local FFmpeg. Preserve channel layout, sample rate, approximate bitrate, and duration.
- Foreground voices and train announcements target `−18 LUFS` with maximum `−1.5 dBTP`; intro and sung music target `−20 LUFS` with maximum `−1.5 dBTP`; fax and police effects target `−20 LUFS` with maximum `−2 dBTP`. Checks allow at most `±0.3 LU` integrated-loudness drift.
- Keep the broker, foreground gain bus, and one background scheduler inside `game.js`. Do not add a compressor library, runtime loudness analyzer, persisted exposure quotas, or a second music player/scheduler.

## Local 3D police response

- Escalating enforcement uses two local CC0 GLBs under `assets/models/police-response/`: Quaternius's low-poly police car and kazuma's low-poly helicopter, together about 0.24 MB after lossless glTF Transform deduplication/pruning. Preserve the adjacent `LICENSES.md` source, license, modification, and checksum record.
- The car is presented as a fictional German-style silver/blue `POLIZEI` vehicle without manufacturer branding or a real police insignia. Its source body had no UVs or textures, so `tools/police_car_texture.py` creates one xatlas UV set and embeds the ImageGen-derived `police-car-livery.png`; the GLB owns that texture at runtime and no floating full-length stripe geometry is added. The helicopter is recolored black and receives procedural rotor and searchlight geometry.
- `game.js` owns wanted thresholds, response counts, pursuit, impacts, searchlight pressure, and reinforcement timing. `world3d.js` only renders those semantic response objects and loads each source GLB once for cloning.
- Missing-model paths retain procedural 3D car and helicopter stand-ins. Do not add a remote runtime asset host or a vehicle-physics dependency for this bounded chase system.
- Chase audio stays under `assets/audio/police/`: one CC BY 4.0 Essen police Martinshorn recording supplies the distance-scaled loop and one CC0 German police-car pass-by supplies a cooldown-bound close approach accent. Preserve the adjacent `LICENSES.md` attribution, conversion notes, durations, sizes, and checksums. Both files preload only after the Start gesture, never use a remote runtime host, and fall back to the existing synthesized siren when unavailable.
