# Asset and efficiency policy

## Decision

Use one asset authority at root `assets/`, with fidelity selected by the client. Desktop may use high-resolution period artwork where it is visibly valuable; mobile must prefer minimal vector or otherwise lightweight variants.

The Bürgeramt interior uses code-native geometry, signs, visitors, and counters through the existing Three.js renderer. Its phone companion shares the root static site and adds no game media. The locally pinned QR generator under `assets/vendor/qrcode/` and VDO.Ninja SDK under `assets/vendor/vdoninja/1.5.5/` are runtime code with licenses beside them. ChatDev's clone, session reports, source recordings, Voice Cloner profiles, and trial renders stay outside `assets/` and the deployable game; only reviewed, licensed, normalized exact-text speech clips may enter the existing voice catalog and `assets/voices/`.

## Desktop and mobile

- Desktop billboard direction: high-resolution, Weimar-era-inspired commercial artwork with deterministic game-rendered copy. For commercial fax artwork, avoid real propaganda, extremist symbols, political insignia, and text baked unreliably into generated images. The user-requested dated historical flag on the Kiesinger monument and CDU landmark banners are separate, code-drawn environment details under the contracts below.
- Mobile billboard direction: the existing minimalist fax-machine vector style or an equally small deterministic alternative.
- The shipped desktop fax-ad pool is the two user-supplied, game-readable motifs under `assets/billboards/fax/`; the eagle-insignia variants from the source pack are intentionally not shipped. Three.js maps them onto 3D billboard meshes, while viewports below 700 px keep a generated lightweight fax texture and do not request the WebPs.
- Every building in the canonical `game.js` inventory receives its own generated-art placard from `assets/building-placards/`, including the power plants, Bundestag, and paired sandal/sock shops. The 29 shared WebPs total about 0.81 MB. `world3d.js` crops one building-specific prop into a restrained enamel office plaque and draws only the exact building name in local Grenze lettering with measured fit. Wall-mounted signs stay above their entrances, at most 2.65 world units wide and no more than 52% of a facade; mobile uses a smaller 512 × 128 canvas. Existing satirical sign copy remains in game data. Missing art or font keeps a legible drawn plaque. `assets/building-placards/PROVENANCE.md` records the generation and font sources.
- Share gameplay data, placement, copy, and interaction logic. Only the visual representation should vary by capability or viewport.
- Load a desktop-only raster only when the desktop representation is actually selected. Do not make mobile download an unused high-resolution alternative.
- Prefer WebP/AVIF for large raster delivery when browser support and visual QA are adequate; retain SVG for simple line art and signs.
- The title screen uses the single transparent vectorized illustration at `assets/fax-wurst.svg`; animate that shipped SVG with CSS and do not add the generated raster as a second runtime variant.
- The title screen's `assets/german-unity.svg` is an original black-red-gold game-engine spoof mark with its developer statement baked into the vector. It is a small, standalone SVG beside Start, not an imported Unity logo or a new runtime dependency.
- The Wurstsammlerpass and its transient collection card use the nine locally bundled Creative Commons WebPs under `assets/wurst/` (about 0.31 MB total). Both desktop and mobile use the same compact files; the world pickups remain procedural, and `assets/wurst/LICENSES.md` is the attribution, modification, and checksum authority.
- Roaming quizzes use nine project-authored 512 × 512 WebP dossier portraits under `assets/quiz-characters/` (about 0.23 MB total). They share one raw psychological-expressionist RPG treatment with mature asymmetrical faces, restrained eyes, straighter noses, visibly worked pigment, and a quiet scenery-free gray-beige dossier field. Every complete head retains generous top clearance. Desktop and mobile share the same files; the desktop modal places the dossier to the left, mobile stacks it above the question, and a missing image keeps a code-native § placeholder. `For-AI/QUIZ-CHARACTER-DICTIONARY.js` binds each identity to its image and categories, while `assets/quiz-characters/PROVENANCE.md` records generation, conversion, sizes, and checksums.
- The user-supplied wrong-answer sting is an in-game-only asset. Preserve its provenance notice and checksum in `assets/voices/LICENSES.md`; do not claim a broader license or treat it as a general-purpose project asset.
- The user-linked humor-form fax recording is an in-game-only local MP3 at `assets/fax-machine-paper-feed.mp3`. Preserve its source and checksum in `CREDITS.md`, do not claim a license that the source does not provide, and keep the synthesized Web Audio fax feed as the missing-file fallback.
- The user-supplied opening music is one in-game-only local MP3 at `assets/intro-song.mp3`, trimmed by exactly 24 seconds at the start. It plays once before the shared background playlist. The sung pool under `assets/audio/music/sung/` follows one song after every three synthesized 8-bit arrangements. The user-supplied `assets/audio/music/wurst.mp3` interrupts that playlist once when the fifth of nine unique sausages is collected, while still obeying the music toggle and audio-text ducking. Preserve source and shipped checksums in `CREDITS.md` and `assets/audio/music/PROVENANCE.md`; do not claim external redistribution rights that have not been established.
- Keep emotional pedestrian recordings to a small local MP3 subset with exact-text bark mappings, durable source and checksum records in `assets/voices/LICENSES.md`, and browser-speech fallback. Do not fetch the full dataset or depend on a remote audio host at runtime.
- Keep Merkel's user-supplied Neuland excerpt under `assets/voices/merkel/`, mapped only to its exact displayed quotation and documented in `CREDITS.md` plus `assets/voices/LICENSES.md`. It follows the same foreground normalization and proximity-broker rules as her existing “Wir schaffen das” excerpt; do not imply external redistribution rights.
- Keep the 13 generated §-power readings and 11 rotating-rule readings under `assets/voices/laws/`, indexed directly to their fixed decks. §-power audio must use the exact displayed quotation; rotating-rule audio must read the complete displayed body while its shorthand identifier remains visual. Both retain German browser-speech fallback and record their CC0 references, local XTTS-v2 generation method, durations, and checksums in `assets/voices/LICENSES.md`. The cloning model is an offline production tool, never a runtime dependency or shipped model.
- Keep the user-supplied Bayern and Alice recordings as local foreground MP3s under `assets/voices/bayern/` and `assets/voices/alice-weidel/`, with exact-text runtime mappings and checksums in `assets/voices/LICENSES.md`. Alice's source recordings are user-supplied satirical material, not verified quotations or factual claims. The root game currently loads the last accepted complete-character atlases directly from `assets/sprite-archive/pre-rig-20260921/assets/`; Merkel retains that archive's native 24-column clock and the other characters retain 32 columns. The experimental identity-matched part sheets under `assets/sprite-sources/rigs/`, biomechanical builder, audit, verification ledger, and active root atlas outputs remain available to the authoring pipeline but are not game runtime inputs until explicitly accepted. The isolated Merkel candidate under `assets/sprite-sources/candidates/merkel-21/` is also preview-only: its 20-frame playback plus exact closure audit must retain `candidate-unapproved` status, use the archived sprite for immutable identity pixels, and never become a game loader input without explicit visual acceptance. The narrower Merkel left-walk pilot under `assets/sprite-sources/candidates/merkel-cmu-left/` is likewise preview-only and `candidate-unapproved`; it may use the pinned CMU subject 69/01 capture under `assets/sprite-sources/reference/cmu-walk-69-01/` only as an offline bone-direction authority, with the CMU acknowledgment and non-resale condition preserved beside the BVH. It must remain one-direction-only until explicit visual acceptance. `sprite-preview.html` can switch among both candidates, the experimental outputs, and the exact stable game atlases without changing the game loader. The shared Three.js staging canvas remains the only game rendering path; no skeleton, BVH parser, Pillow, SciPy, or authoring dependency ships to the browser. Follow `SPRITE-GENERATION-PROTOCOL.md` for the experimental gait, grid, direction, build, overlay, and signed acceptance contracts.
- The shared sprite rig preserves compact caricature anatomy: torso and limb plates receive the same bounded fullness correction, articulated limb lengths remain deliberately compact, directional source parts are normalized to one character-consistent scale, and every chin anchor must meet the shoulder line within eight 512-grid pixels. Merkel additionally keeps one deterministic, all-frame identity calibration measured against her archived original: broad head and jacket plates, full arms and trouser mass, compact legs, and direction-specific ground registration. Do not restore the long-necked, narrow-body composition or tune isolated runtime frames around it.
- The two accepted ordinary towel pedestrians use the same Three.js texture path and distance-driven gait clock as featured sprites. The root game currently uses their accepted 32×3 pre-rig complete-character atlases; the preview offers both those exact stable atlases and the experimental biomechanical outputs. Their grumpy towel-tourist identities and signature towel props remain rigid source layers. Direction is selected from actual movement; only the registered horizontal side row mirrors for left travel. Built-in ImageGen output becomes part-sheet authority only after full-resolution identity, anatomy, alpha, prop, and all-direction review. `tools/verify-sprite-animation.py` proves double support, stance/swing ownership, toe clearance, passing crossover, forward depth, bounded limb projection, registration, alpha safety, distinct frames, and cyclic continuity, then renders every final experimental cell with its joint graph for human review. Pre-rig originals remain under `assets/sprite-archive/pre-rig-20260921/` and are the current loader fallback; the superseded whole-pose hold outputs remain under `assets/sprite-archive/pre-identity-lock-20260922/` and are not loaded.
- The two towel pedestrians have **preview-only, unapproved** textured human GLBs in `assets/models/towel-pedestrians/`, shown by `towel-3d-preview.html`. The CC0 MakeHuman body uses older male/female shape targets, matching skin textures, and one 18-bone skin per figure. The models share the neutral guide's fixed 32-pose walk clock and keep separate clothes, socks, strapped sandals, and colored towel rolls. Their editable Blender files, builder, checks, source hashes, and CMU-derived motion restriction are recorded in the adjacent `PROVENANCE.md`. The preview's reversible `towel-caricature.js` presentation uses compact/wider body proportions, larger heads/hands, emphasized existing props, painted skin colors, stepped shading and skinned contour shells; its Original 3D control restores the original materials and geometry at the same walk phase. It does not overwrite the GLBs, change their keyframes, or add art downloads. Restore sampled bone scales before every mixer update and reapply afterward, including paused frames, to prevent cumulative deformation. The root game keeps loading the accepted bitmap atlases; these GLBs and the caricature presentation are not game loader inputs before explicit visual acceptance and gameplay/performance review.
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

The isolated `assets/sprite-sources/candidates/merkel-3d/` lane is an offline
Blender/skinned-mesh motion study, not an accepted game sprite. It is explicitly
grey/proportion-only and `candidate-unapproved`. Keep its pinned CC0 MakeHuman
inputs, existing CMU acknowledgment, editable `.blend`, evaluated bone/shoe
evidence and artifact hashes together. The preview's `source=3d` option fetches
ordinary PNG atlases (32 playback poses, four views); it never downloads the
authoring mesh, rig, `.blend` or BVH. The root game's stable archive is unchanged.
See `SPRITE-GENERATION-PROTOCOL.md` for the separate 3D lane's motion/visual gates.

The adjacent `merkel-painted-left/` candidate binds one built-in ImageGen
paint-over to that unchanged 3D rig and bakes a 32-frame left-only PNG loop.
Keep the raw painting, exact prompt, guide and editable packed blend. Fixed UVs
and native depth own consistency; do not independently regenerate frames. This
view-specific, unapproved appearance pilot is selectable at `?source=painted`
and must not enter the game without visual acceptance. Its verifier requires
the same bone coordinates and alpha silhouettes as the grey source cycle.
That silhouette rule is historical to this rejected-head pilot, not a constraint
on the new neutral-guide approach below.

`assets/sprite-sources/reference/neutral-walk/` is the shared character-independent
motion authority. It keeps uncaricatured source joint landmarks, grey mannequin
geometry and no avatar art. Reuse its gait across characters, but retarget to
each character's fixed proportions and contacts; never force their heads or
clothing into the guide's outline. Preserve the editable blend, source/license
pointers, projected joint/sole evidence and artifact hashes. Its verifier also
checks native landmark proportions. The only new character art is one unapproved
Merkel key in `merkel-neutral-appearance/`, with raw ImageGen output, prompt,
unmodified original crop and provenance. `?source=neutral` labels that comparison
as stills beside the animated neutral guide. It must not suggest a finished
Merkel animation or redirect either game loader. Other characters are not yet
retargeted; running and prop actions require their own checks.

Preview-only text fitting uses locally vendored Pretext 0.0.9 (MIT) and Roboto
Condensed (OFL), with adjacent provenance; these are not game dependencies.

An asset change is complete only when the correct variant loads on desktop and mobile, missing files fail gracefully, the browser console stays clean, and gameplay/interactions remain unchanged unless the task explicitly changes them.

## Local 3D buildings

- Root `assets/models/` is the only authority for shipped model files.
- The root game has one required WebGL presentation path. Do not preload or restore the retired SVG/Canvas world-art set. Registered moving-character PNG atlases remain the deliberate bitmap exception; DOM UI art and billboard textures are not alternate world renderers.
- Trees are canonical world data in `game.js`, not renderer-local decoration. Apply the rail-gutter city offset exactly once, keep each trunk center at least 48 world units outside every road rectangle, expose the same placement to `world3d.js` and `3d.html`, and keep trees solid to ground movement.
- Ordinary civic buildings and small shops use the four original Blender-authored building families in `assets/models/city-kit/`. The same kit owns the original Pfand machines/bottles, coffee and fax kiosks, gnomes, trees, sheds, lamps, and street furniture. `manifest.json` records bounds, geometry counts, sizes, and hashes; `city-kit.blend` and `tools/build-city-assets.py` are offline authoring sources. The earlier Kenney Commercial files are retained with their CC0 provenance but are no longer requested by the renderer.
- Eleven additional texture-free Blender models under `assets/models/german-props/` add two towel-reserved loungers, two gnome variants, neighboring sandal/sock storefronts, a Germany-side Krügers Kugellager takeaway shop with an original bearing emblem, a returnable-bottle crate, wheelbarrow, recycling containers, and a picnic table. Their adjacent `PROVENANCE.md`, manifest, editable `.blend`, and Blender builder own source and size records. `game.js` owns shop footprints and prop collision positions; the renderer loads the shared GLBs on desktop and mobile with existing procedural stand-ins for missing files. The online CC0 building alternatives considered for this set are linked in that provenance record; none were imported.
- The southeast Berlin parcel uses the original Blender-authored `assets/models/bundestag/bundestag.glb` landmark: layered sandstone masonry, six-column west portico, four towers, and a ribbed glass dome with interior cone/ramps. Fit it uniformly onto the existing parcel's stone apron so its proportions survive; retain its +Z entrance, ground-centered pivot, adjacent editable source, reference provenance, checksum, and procedural-building fallback. Its texture-free GLB has a 2.5 MB / 70,000-triangle budget and uses decoder-free `KHR_mesh_quantization`.
- City models share source load promises and mesh geometry. Preserve their restrained authored stone/brick/metal colors. Clone building materials per instance for camera occlusion, multiplying authored opacity by the fade instead of turning glass opaque. Small props fit uniformly; ordinary building families adapt to the established solid parcels. Desktop and mobile use the same bounded GLBs and never request `.blend` files or previews.
- Roads, crossings, pavements, kerbs, drain grilles, and garden railings remain code-native geometry derived from existing world data. Two small deterministic canvas textures supply asphalt and paving; repeated kerbs/markings/drains/railings use instancing. Leave openings at crossings and garden entrances. Lamp placement derives from already-offset roads. Added street furniture belongs to `game.js` props and uses its existing collision rule; keep doors and narrow legal routes clear.
- The Kiesinger monument uses the photo-referenced Blender-authored `assets/models/kiesinger/kiesinger-statue.glb` figure (under 4 MB and 85,000 triangles, four marble materials, no textures) on its existing procedural pedestal. The editable `.blend`, deterministic Blender script, fitted portrait landmarks, source-photo provenance, and model-bound checks accompany the asset. Preserve the photo-derived stone vertex colors during GLB optimization; they carry facial detail, socket shading and subtle marble veining without image textures. Facial positions are fitted offline from archival photographs using MediaPipe's Apache-2.0 canonical facial connectivity; retain its adjacent license and the CC BY-SA 4.0 sculpture attribution. Keep the source figure’s six-unit height, shoe-level pivot, Y-up/+Z-front contract, and procedural figure fallback. At runtime, uniformly scale the complete statue-and-pedestal assembly to the Reichstag’s rendered height, including its dome; retain the ground apron’s established collision footprint and scale the nearby camera framing with the monument. Desktop and mobile share the GLB; the authoring `.blend`, photographs, and landmark-detection tools are never loaded by the game.
- `world3d.js` may recolor model materials at runtime to the restrained concrete-gray bureaucracy palette. Do not restore the pack's bright commercial colors by default.
- GLBs are the preferred world representation. A missing individual model keeps its procedural 3D stand-in, while failure of the required WebGL renderer shows a blocking retry notice instead of reviving the retired Canvas world.
- Keep the selected model set bounded and measure total transfer size before adding another pack.
- The power-plant landmark uses five local CC0 GLBs under `assets/models/power-plants/` (about 0.5 MB total): three selected Kenney Industrial meshes plus a nuclear transformer and warning sign from 3DAssets.dev. Preserve `LICENSES.md`, its AI-generation disclosure, source URLs, and checksums when replacing these files.

The Kiesinger monument carries two `CDU / AB 1948` banners flanking one dated 1933–1945 historical Reich flag. The flag accompanies the existing factual NSDAP history plaque; the period flag was co-official from March 1933 and sole national flag from September 1935. Keep this user-requested historical display confined to the monument. All three banners fit below the sculpture so the complete monument still matches the Reichstag height. Shared canvas textures and small folded planes require no downloaded logo art or new model assets.

## Local 3D perimeter trains

- `game.js` owns the two rounded-loop paths around the 10,960 × 5,360 world, the 560-unit city-to-rail gutter, twelve train centers, 84 articulated car transforms, per-train speed and acceleration, unexplained pauses, contact stops and reversals, same-lane spacing, player obstruction, and announcement timing. Each seven-car array belongs to one logical train. `world3d.js` only renders that state and must not run a second train simulation in the canonical game.
- The WebGL renderer loads each rolling-stock source once and clones them into the twelve articulated consists, using one Kenney front, five full-length Open L-Gauge n-Wagen middle coaches, one Kenney rear, and short procedural flexible gangways. Each car follows its shared semantic transform independently through curves. Keep geometry, the n-Wagen's tiny embedded palette, and all runtime assets local; there is no runtime asset host.
- Missing-model paths use full-length procedural 3D red-and-white cars. Both GLB and procedural representations must preserve two continuous tracks around the full perimeter, broad rounded corners, coupled cars, oriented solid coach bodies, and the hard no-overlap/no-passing rule. A collision clamps both consists at the minimum gap, exposes a brief visual bump, stops both, and reverses their motion after a fixed pause without flipping or splitting their physical car order.
- Four photo-referenced, code-native station platforms share the existing world renderer and crowd sprites. DB InfraGO's [Hubertushöhe platform photographs](https://www.bahnhof.de/hubertushoehe/zukunftsbahnhof), [Mettenheim signage photographs](https://www.bahnhof.de/mettenheim/zukunftsbahnhof), and [Eisleben platform photograph](https://halle-eichenberg.deutschebahn.com/das-projekt/errichtung-von-elektronischen-stellwerken/tangierende-projekte/komplexumbau-bahnhof-eisleben.html) informed the shelter, tactile edge, clock, blue signs, and departure boards. The photos are references only; no photograph, logo, or externally hosted station asset loads at runtime.
- Four general train recordings become eligible on or within 85 world units of a station platform. Inside the platform they use `NEARBY` broker priority; just outside they are ambient. The Buxtehude recording is reserved for the player's presence on a rail loop or a new player-caused train stop, which remains a critical request. Every admitted recording remains a fixed-level foreground `audio-text` event with the existing cooldown and ducking. Train recordings never open the dialogue textbox, still follow the voice toggle, and do not synthesize or display transcripts. EBO obstruction hints remain exact visible-and-spoken gameplay warnings through the same broker.

## Local 3D civilian traffic

- All cars use the three original Blender-authored, texture-free GLBs in `assets/models/vehicles/`: classic Beetle, Trabant 601 and German police estate. Keep the adjacent editable `vehicles.blend`, source/rebuild provenance and checksum manifest. The complete fleet is about 1.2 MB; each asset stays below 600 KB / 32,000 triangles and uses decoder-free quantization. Earlier traffic and police-car sources retain their license records but are no longer requested.
- Every GLB owns its body, fitted glazing, wheels, trim and lamps. Hide the whole procedural stand-in when it loads; never leave box windows, extra wheels, grilles or a second roof light outside that fallback. The police estate has one transverse low-profile blue lightbar with independent `BeaconLeft` and `BeaconRight` materials, silver/blue/yellow body markings, and original `POLIZEI` lettering.
- The police vinyl continues across the bonnet, both flanks and rear, with segmented reflective edges, large `POLIZEI` labels, `NOTRUF 110`, department-08 star badges and a roof identifier. These are fitted Blender surfaces, not runtime billboards. All three cars include front/rear German-format plates with EU/D bands and game-authored registrations; use the existing OFL Roboto Condensed for the converted lettering. No official crest or seal is copied.
- Four named empty wheel pivots retain `wheel`/`radius` extras, and two front steering parents retain `steer` extras. Keep their hierarchy through optimization. `world3d.js` rolls wheels around local X from actual displacement and turns front wheels around Y; pauses/queues stop rolling, reversing reverses it, and respawn jumps do not advance it. Brake and beacon materials are cloned per car, while all mesh geometry is shared. Recolor only `BodyPaint`; preserve glass, rubber, chrome and police livery.
- `game.js` still owns lane population, regional car identity, movement, obstruction, queueing, collisions, horn timing and pursuit. Keep the existing scale envelopes, accessible routes and full procedural model-failure fallbacks. Desktop and mobile share the bounded GLBs; neither downloads Blender sources, review images, a vehicle-physics package or a remote asset service.

## Procedural Wirtschaftswunder vortex

- The construction-site vortex beside the western Schrebergarten is code-native Three.js geometry and shader work. It uses no bitmap, model, post-processing, or remote runtime asset: subdivided polar spiral surfaces provide continuous displacement ripples, while a dark funnel, pooled procedural lightning lines, construction barriers, and deterministic canvas-text signs complete the presentation.
- `game.js` owns the site coordinates, collision radius, traffic diversion, spiral/sink/crush progress, one serial impact event per swallowed car, disappearance, far-lane respawn, and the deterministic Web Audio thunder-crunch routed through the shared sound-effect bus. `world3d.js` projects that state, applies bounded car pitch/roll/nonuniform crush scale, shifts spiral layers for the depth/parallax illusion, and turns each serial impact into a short shader shockwave, point flash, and lightning burst.
- Keep the bold sign text exactly `WIRTSCHAFTSWUNDER!`. Preserve the short, cyclical traffic behavior rather than adding a physics engine, particle package, duplicate car pool, or authored vortex asset.

## Procedural Görlitzer Park miniature

- `goerlitzer-park.js` supplies one fixed, already-offset landmark footprint, placard position, source-grounded copy, and four trees to both root entry points. The existing `game.js` static collision path blocks the complete compound for every ground actor. `world3d.js` renders the miniature park and exaggerated military perimeter from code-native geometry, with batched fence details and deterministic canvas-text signs; no new model, raster artwork, or runtime service is required. Keep the exterior path and cost placard accessible and use the existing dialogue for full-size text on phones.
- Park signs and dialogue stay in-world: use `GÖRLITZER PARK` and straight-faced security language, with no miniature, fiction, satire, or reality-check disclaimers. Follow `GAMEPLAY.md`'s mandatory in-world copy rule. Preserve the costs' stated periods and net/gross/budget distinctions, with sources in `CREDITS.md` and exact matching English subtitles in `AUDIO-TEXT-LIBRARY.js`.

- Only two CDU banners remain, each 0.65 × 1 world unit, flanking a 3.8 × 0.79 yellow/red price tag tilted diagonally low on the south fence. All three sit below the razor wire, leaving the park interior visible. The park-name sign mounts above the rear fence. The south-side cost placard uses five large, high-contrast lines on a 5.6 × 2.42 panel: park name, three distinctly labeled cost/budget figures, and a satirical `KOSTEN & KLÜNGEL?` prompt to read the detailed records. Near it, the camera eases into a restrained lift and keeps more of the placard in frame, with limited sideways shift on portrait screens. The price tag displays only `≈ 1.800.000 €` and the current CDU logo from the local `assets/logos/cdu-2023.svg`. Preserve its amount-only copy; funding context and report date belong to the existing cost placard dialogue and credits. The canvas texture updates once the SVG loads and keeps drawn CDU lettering if it fails. `goerlitzer-park.js` owns this copy. Do not substitute the annual operation/security budget, add overlapping costs, or imply payment from party funds.

## Audio normalization and focus

- `tools/normalize-audio.ps1` is the only audio-level maintenance command. It checks by default and rewrites only with `-Apply`, using local FFmpeg. Preserve channel layout, sample rate, approximate bitrate, and duration.
- Foreground voices and train announcements target `−18 LUFS` with maximum `−1.5 dBTP`; intro and sung music target `−20 LUFS` with maximum `−1.5 dBTP`; fax and police effects target `−20 LUFS` with maximum `−2 dBTP`. Checks allow at most `±0.3 LU` integrated-loudness drift.
- Keep the broker, foreground gain bus, native Web Audio master compressor, and one background scheduler inside `game.js`. Do not add a compressor library, runtime loudness analyzer, persisted exposure quotas, or a second music player/scheduler.

## Local 3D police response

- Escalating enforcement uses the original police estate from the fleet above and kazuma's local CC0 helicopter under `assets/models/police-response/`. Preserve the helicopter's adjacent `LICENSES.md` source and checksum record; the retired Quaternius car and its texture retain historical attribution there.
- The police estate uses authored silver/blue/yellow surfaces and `POLIZEI` lettering without manufacturer branding or a real police insignia. The old UV-livery tool and PNG are no longer runtime inputs. The helicopter remains black with its existing procedural rotor and searchlight geometry.
- `game.js` owns wanted thresholds, response counts, pursuit, impacts, searchlight pressure, and reinforcement timing. `world3d.js` only renders those semantic response objects and loads each source GLB once for cloning.
- Missing-model paths retain procedural 3D car and helicopter stand-ins. Do not add a remote runtime asset host or a vehicle-physics dependency for this bounded chase system.
- Chase audio stays under `assets/audio/police/`: one CC BY 4.0 Essen police Martinshorn recording supplies the distance-scaled loop and one CC0 German police-car pass-by supplies a cooldown-bound close approach accent. Preserve the adjacent `LICENSES.md` attribution, conversion notes, durations, sizes, and checksums. Both files preload only after the Start gesture, never use a remote runtime host, and fall back to the existing synthesized siren when unavailable.

## Opt-in prop-detail studies

Four candidate-unapproved static prop studies are owned by
`assets/models/prop-details/models.js`: fax kiosk, bottle crate, wheelbarrow and
recycling containers. Their optional `?propDetails=1` loader produces GLB bytes
from that one source and parses them with the existing GLTFLoader. Normal play
must not request the new modules or replace the original GLBs. Preserve exact
path scoping, existing URL caching/cloning, uniform fit, labels, simulation-owned
placement/collisions and both original-GLB and procedural failure fallbacks.
This small experimental generator is not permission to replace the accepted
Blender/GLB pipeline or add another game renderer.

`tools/export-prop-details.mjs` can export the same four models and checksum
manifest into their own directory; it must never overwrite accepted source
assets. The studies use no imported mesh, image, font, framework or service.
Ponytail was unavailable for this edit; the existing static-first YAGNI fallback
was used. Provenance, measured budgets and CPU-versus-browser verification
limits live beside the source in `PROVENANCE.md`. Keep this mode opt-in until
real desktop/mobile WebGL, fallback, interaction and performance checks establish
acceptance. No change to the towel-character or featured-sprite acceptance rules.

## Full satire-kit candidate pack

`assets/models/satire-kit/` owns 45 code-authored candidate models (17 station,
16 civic, 12 clutter), reusing the existing prop-details builder and GLB encoder.
`satire-kit-preview.html` is a silent asset-inspection tool, not another game.
`tools/export-satire-kit.mjs` exports only this pack's GLBs and manifest. New
runtime geometry is produced from the same source; no new external art, font,
renderer dependency, character rig or audio is introduced.

Keep the pack behind `?satireKit=1`. Exact-path replacement maps 13 existing
assets; original loading and procedural fallbacks remain intact. Preserve the
red towel identity. New placement and station-fixture coordinates live in
`game.js` props, with the rail-gutter offset applied once. Station fixtures
become solid only after their replacement assembly loads, so failed assemblies
keep the original platform without invisible obstacles. Small papers, bottles,
litter and the platform-edge strip are decorative. The replacement assembly
hides the original central station signs along with the old furniture.

All 45 GLBs are exported and have four-view browser screenshots; 43 IDs have
opt-in world uses. The underpass has no connected route and the catenary mast
still needs full-train clearance. Browser entry and movement checks ran on
desktop and narrow mobile, but full clearance and failure-injection gates remain
open. The focused suite is 65/66 because the existing fax study hash does not
match its preservation test. Exact results and asset-by-asset status are in
`assets/models/satire-kit/PROVENANCE.md`. Do not default-enable or publish as a
fully accepted pack on this evidence. Accepted source GLBs and sprites remain
unchanged.
