# Asset and efficiency policy

## Decision

Use one asset authority at root `assets/`, with fidelity selected by the client. Desktop may use high-resolution period artwork where it is visibly valuable; mobile must prefer minimal vector or otherwise lightweight variants.

The Bürgeramt interior uses code-native geometry and signs through the existing Three.js renderer. Its near characters use original caricatured painted source strips under `assets/sprite-sources/buergeramt/`; `tools/build-amt-sprites.py` produces separate 64-frame, 24-fps desktop/mobile WebP atlases under `assets/buergeramt/characters/`. No Bürgeramt GLB is a runtime input. Generated source provenance and atlas hashes live beside the sources. The rejected towel-tourist preview GLBs remain preview-only and are not runtime inputs. The phone companion shares the root static site and adds no game media. The locally pinned QR generator under `assets/vendor/qrcode/` and VDO.Ninja SDK under `assets/vendor/vdoninja/1.5.5/` are runtime code with licenses beside them. ChatDev's clone, session reports, source recordings, Voice Cloner profiles, and trial renders stay outside `assets/` and the deployable game; only reviewed, licensed, normalized exact-text speech clips may enter the existing voice catalog and `assets/voices/`.

The eight moving office regulars have original four-view painted source sheets and four action poses each: work, gesture, look, and flinch. `tools/amt-character-motion.py` registers these under the same source directory and emits one 8-column, 8-row desktop WebP per character plus a half-resolution mobile WebP. The runtime loads only the selected variant on office entry. Continuous whole-silhouette warping keeps side-view shoes attached to their trousers; the segmented leg method exposed a detached foot on this source and was rejected. A separate 8-column, 6-row desk-performance atlas reuses Frau Knick's approved source strip and adds a small lower-lip cycle. Exact encoded frame hashes and contact sheets are local review evidence under `output/amt-character-motion/` and `output/buergeramt-sprite-qa/`. Neither Python nor a new animation dependency ships to the browser.

The same source sheets yield four-pose 640 × 832 action detail cells plus four directional eight-frame close walk sheets per moving regular, 384 × 832 detail poses for waiting patrons, and a compact shared detail sheet with six clerk poses and eight high-resolution lip frames. Moving detail is requested only on approach, one walk direction at a time, and released after the actor leaves; the compact desktop/mobile atlas remains the distance and load-failure fallback. Close walk sheets use a 4 × 2 grid so their maximum texture dimension is 2560 px. This preserves close brushwork without eight full high-resolution 64-frame atlases. The office-only shader gently varies per-character saturation and lightness without modifying the painted files; its renderer follows the shared one-pixel-per-CSS-pixel and 1.6 MP drawing-buffer budget in the browser playability gate below.

The office's original painted prop strip adds a file cabinet, paper tower,
distorted clock, and noticeboard. Its source and provenance are with the cast;
the game loads its compressed atlas only when the office is entered, alongside
the selected character textures, so city startup does not fetch office art.

The same office entry lazily loads one code-authored detail group for archive
cabinets, lever-arch files, counter supplies, fax/copier corner, trolley,
fluorescent louvres, radiators, and secondary paperwork signs. Its static
geometry is batched by shape/material. The group uses the existing room's
patina and leaves the large QR and red call display unobstructed. Eight added
floor footprints enter player collision only after successful attachment;
the original simpler desk supplies remain the load-failure fallback. This
module adds no GLB, external texture, voice, network endpoint, or second scene.

New office and later place assets should harmonize with the painted cast:
exaggerated civic proportions, stale green-gray walls, stained linoleum,
crooked paper stacks, amber fluorescent light, expressive silhouettes, and
visible wear. Create original artwork and preserve readable signs, paths,
interaction targets, and the root game's existing place identities. Iterate
one area at a time with before/after desktop and mobile screenshots plus
runtime cost; do not reskin the entire city from an unreviewed style sheet.

## Desktop and mobile

- Desktop billboard direction: high-resolution, Weimar-era-inspired commercial artwork with deterministic game-rendered copy. For commercial fax artwork, avoid real propaganda, extremist symbols, political insignia, and text baked unreliably into generated images. The user-requested dated historical flag on the Kiesinger monument and CDU landmark banners are separate, code-drawn environment details under the contracts below.
- Mobile billboard direction: the existing minimalist fax-machine vector style or an equally small deterministic alternative.
- The shipped desktop fax-ad pool is the two user-supplied, game-readable motifs under `assets/billboards/fax/`; the eagle-insignia variants from the source pack are intentionally not shipped. Three.js maps them onto 3D billboard meshes, while viewports below 700 px keep a generated lightweight fax texture and do not request the WebPs.
- Every building in the canonical `game.js` inventory receives its own generated-art placard from `assets/building-placards/`, including the power plants, Bundestag, paired sandal/sock shops, and Krügers Kugellager. The 30 shared WebPs total about 0.84 MB. `world3d.js` crops one building-specific prop into a restrained enamel office plaque and draws only the exact building name in local Grenze lettering with measured fit. Wall-mounted signs stay above their entrances, at most 2.65 world units wide and no more than 52% of a facade; mobile uses a smaller 512 × 128 canvas. Existing satirical sign copy remains in game data. Missing art or font keeps a legible drawn plaque. `assets/building-placards/PROVENANCE.md` records the generation and font sources.
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
- Keep the user-supplied Bayern and Alice recordings as local foreground MP3s under `assets/voices/bayern/` and `assets/voices/alice-weidel/`, with exact-text runtime mappings and checksums in `assets/voices/LICENSES.md`. Alice's source recordings are user-supplied satirical material, not verified quotations or factual claims. The root game loads the accepted painted Merkel, Bayern, Alice, and Merz manifests under `assets/characters/`, each with four distinct eight-phase walks, planted whole-body corners, and a shared ground pivot. Merz also retains gait-synchronized pouring actions. The archived pre-rig atlases are missing-file fallbacks. The experimental identity-matched part sheets under `assets/sprite-sources/rigs/`, biomechanical builder, audit, verification ledger, and active root atlas outputs remain available to the authoring pipeline but are not game runtime inputs until explicitly accepted. The isolated Merkel candidate under `assets/sprite-sources/candidates/merkel-21/` is also preview-only: its 20-frame playback plus exact closure audit must retain `candidate-unapproved` status, use the archived sprite for immutable identity pixels, and never become a game loader input without explicit visual acceptance. The narrower Merkel left-walk pilot under `assets/sprite-sources/candidates/merkel-cmu-left/` is likewise preview-only and `candidate-unapproved`; it may use the pinned CMU subject 69/01 capture under `assets/sprite-sources/reference/cmu-walk-69-01/` only as an offline bone-direction authority, with the CMU acknowledgment and non-resale condition preserved beside the BVH. It must remain one-direction-only until explicit visual acceptance. `sprite-preview.html` can switch among both candidates, the experimental outputs, and the exact stable game atlases without changing the game loader. The shared Three.js staging canvas remains the only game rendering path; no skeleton, BVH parser, Pillow, SciPy, or authoring dependency ships to the browser. Follow `SPRITE-GENERATION-PROTOCOL.md` for the experimental gait, grid, direction, build, overlay, and signed acceptance contracts.
- The shared sprite rig preserves compact caricature anatomy: torso and limb plates receive the same bounded fullness correction, articulated limb lengths remain deliberately compact, directional source parts are normalized to one character-consistent scale, and every chin anchor must meet the shoulder line within eight 512-grid pixels. Merkel additionally keeps one deterministic, all-frame identity calibration measured against her archived original: broad head and jacket plates, full arms and trouser mass, compact legs, and direction-specific ground registration. Do not restore the long-necked, narrow-body composition or tune isolated runtime frames around it.
- The two accepted towel pedestrians load their painted four-direction walks, whole-body corner transitions, and reviewed reaction/look cells from `assets/tourists/{towelMan,towelWoman}/`. `tourist-animation.js` advances walks by ground distance and holds position through timed turns; `character-interactions.js` plays planted reactions. Each manifest binds the shared pivot, grid, PNG hash, and direct static image file. The pre-rig atlases remain missing-file fallbacks. The preview-only biomechanical and GLB studies are not game inputs.
- The two towel pedestrians have **preview-only, unapproved** textured human GLBs in `assets/models/towel-pedestrians/`, shown by `towel-3d-preview.html`. The CC0 MakeHuman body uses older male/female shape targets, matching skin textures, and one 18-bone skin per figure. The models share the neutral guide's fixed 32-pose walk clock and keep separate clothes, socks, strapped sandals, and colored towel rolls. Their editable Blender files, builder, checks, source hashes, and CMU-derived motion restriction are recorded in the adjacent `PROVENANCE.md`. The preview's reversible `towel-caricature.js` presentation uses compact/wider body proportions, larger heads/hands, emphasized existing props, painted skin colors, stepped shading and skinned contour shells; its Original 3D control restores the original materials and geometry at the same walk phase. It does not overwrite the GLBs, change their keyframes, or add art downloads. Restore sampled bone scales before every mixer update and reapply afterward, including paused frames, to prevent cumulative deformation. The root game keeps loading the accepted bitmap atlases; these GLBs and the caricature presentation are not game loader inputs before explicit visual acceptance and gameplay/performance review.
- Perimeter trains use two Kenney Train Kit end-car GLBs under `assets/models/kenney-trains/` plus the 1.56 MB Open L-Gauge n-Wagen coach under `assets/models/open-l-gauge-nwagen/`. The n-Wagen derivative is CC BY-NC-SA 4.0 and may remain only while the game is noncommercial; preserve its adjacent full attribution, modification, license, and checksum record. The assets remain fictional `AMT-BAHN` rolling stock: do not add Deutsche Bahn or Märklin logos, trademarked textures, or a cloned real announcer voice. The five user-supplied station-hall MP3s under `assets/audio/trains/` are approved only as in-game ambient audio; preserve `PROVENANCE.md`, make no Deutsche-Bahn-authenticity or redistribution claim, and do not display an invented transcript. Missing GLBs keep the procedural train fallback.

- The Brandmauer and Alice dumpster share the three locally bundled CC0 Kenney masks in `assets/fire/`. Two flame masks drive small batched Three.js point layers at both sites; one smoke mask serves the dumpster. Missing masks keep the existing procedural flames. Mobile uses fewer points, and no runtime particle package or remote asset service is added. Source hashes and licenses are in `assets/fire/LICENSES.md`.

## Browser playability gate

Browser playability is a release requirement for every new asset, loader,
render effect, background task and game-development skill/workflow change.
The integrator owns the budget and evidence; asset/renderer/audio owners supply
measurements before integration. Prefer smaller existing assets and native
browser capabilities. A more detailed asset is accepted only when its visible
benefit justifies its transfer, decoded memory and frame cost on the supported
browser profiles. Do not add a new pipeline, service or benchmark dependency.

### Asset and loader contract

- Keep authoring PNGs, Blender/BVH files, base64 transfer parts, source sheets,
  audit records and preview candidates out of runtime requests. Shipped runtime
  variants stay under the single `assets/` authority.
- Use compressed delivery and preserve licenses, source hashes, alpha, pivots,
  frame layout and timing. The six accepted city atlases now have lossless WebP
  `delivery` records in their existing manifests. Original PNGs remain the exact
  fallback and authoring authority. `tools/build-character-delivery.py --check`
  verifies every decoded RGBA byte, dimension, source/delivery hash and byte
  budget; regeneration uses that same tool without `--check`. This is packaging,
  not permission to regenerate character poses.
- Share one decoded image and one texture/material per character kind. Avoid
  copying an accepted full atlas into an additional canvas. Compressed file size
  does not prove low resident memory: report width × height × four bytes, mipmaps,
  decoded copies, draw-buffer size and cache ownership separately.
- Prepare required office art on approach, close detail on approach, music on trusted input and
  speech/effects when requested. Never preload both desktop/mobile alternatives,
  all songs/voices, or an opt-in candidate pack. Keep existing load-failure
  fallbacks and readable interaction targets.
- For newly introduced textures, aim for at most 2048 px per dimension and
  16 MiB decoded RGBA per texture. The already accepted larger atlases are an
  explicit legacy exception, not a template for new assets; split or reduce a
  new export only after actual display-size and rendered review.

### Frame, background work and lifetime contract

- The default world drawing buffer is at most one pixel per CSS pixel and
  1.6 million total pixels, in both city and office. Default multisampling is
  off. HUD/text geometry and camera aspect remain at CSS dimensions. Verify
  small signs, sprite edges, desktop/mobile resize and fallback rendering.
- Limit active simulation/render dispatch to 60 Hz; retain elapsed-time,
  bounded substeps and authored gait/dialogue clocks. Render the title-screen
  world at at most 4 Hz without advancing gameplay. Hidden pages do no world
  simulation/render work and release held input; resume without catch-up.
- No timer, polling loop, animation, audio source or connection without a
  concrete active consumer, bounded frequency and teardown owner. Pause or
  stop work when hidden/inactive, with explicit exceptions for a live phone
  session or an already committed dialogue/audio receipt. Do not silently
  break their timing contract to meet a benchmark.
- Keep decoded recorded-speech cache storage at most 16 MiB, evicting least
  recently used completed buffers; pending loads are shared and active sources
  retain their buffer until completion. Eviction must permit later replay.
  New caches/queues need a measured bound and cleanup rule.

### Responsiveness and selective preparation protocol

Input responsiveness across modest browser hardware is a standing product goal.
Each runtime/asset change must keep these requirements in its implementation and
review brief; size alone cannot establish smooth play.

For skill selection, prefer the available [Three.js performance skill](https://github.com/cesartevisual/threejs-skills/tree/main/skills/threejs-performance)
for frame time, draw workload and resource lifetime, and the available
[web-performance source](https://github.com/addyosmani/web-quality-skills/tree/main/skills/performance)
for critical loading and DOM responsiveness. Their GitHub instructions were
checked on 2026-10-08. The complementary
[asset-loading skill](https://github.com/cesartevisual/threejs-skills/tree/main/skills/threejs-assets)
covers loader state, decoded memory and shared ownership; inspect its pinned
sources before adding it. Use existing installed skills and project harnesses;
these references do not require another engine, browser stack, telemetry,
worker pool or installation. A skill's availability is not performance evidence.

- Preload the starting neighborhood before enabling Start, including decoded
  character images and installed models. Keyboard shortcuts obey the same
  readiness gate. Show bounded, readable loading feedback; missing individual
  assets settle to the existing fallback instead of blocking forever.
- Select assets from actual player/actor position and active scene. The current
  city lead is 1500 simulation units plus complete model radius, supplemented by
  conservative current-camera visibility, scanned at most
  4 Hz. Prepare office assets before entry; close detail remains approach-only.
  Distant landmarks, absent response units and unused voice libraries must not
  load at startup. Use shared source promises and retain accepted geometry,
  alpha, pivots, material state and collision authority during replacement.
- Admit at most two asset download/decode/install jobs in total through the
  existing native Promise queue. Count character atlases, renderer images,
  models and requested recorded-audio decoding together. Start no new optional
  jobs while hidden or for an inactive scene. Already committed foreground
  audio/phone receipts retain their explicit timing exception. Do not add
  workers, timers or parallel preloading merely to improve a loading score.
- Use one simulation/render owner. A 60 Hz limit must preserve deadline phase
  on 60/75/90/120/144 Hz displays and tolerate callback jitter. Keep actual
  elapsed time, bounded substeps and no hidden-tab catch-up. Early distance
  checks may reject collision candidates only conservatively; retain exact
  narrow-phase checks, swept movement and overlap recovery.
- Write HUD and interaction text only when displayed values change. Keep text
  measurement out of per-frame work; use the existing coalesced Pretext pass
  on changed copy/fonts/bounds. Preserve focus, touch targets and readable
  loading/failure states. Stop title/city scans while the office owns play.
- Hidden tabs stop background music timers, scheduled oscillators, volume ramps
  and chase loops. Check late decode completions and visible resume; preserve
  the music choice and committed foreground event receipts.
- Profile the actual bottleneck before reducing art or simulation quality. Query
  the renderer so hardware GPU and software-rendered runs are distinguished.
  Compare repeated cold readiness, warm frame p50/p95, long tasks, actual input
  to first changed/rendered state, concurrent jobs, stable-DOM mutations and
  repeated scene entry/exit. Include selective loading, asset failure, rapid
  approach and background/resume; keep CPU throttling and Android emulation
  explicitly separate from physical-device evidence.

### Executable release checks

Run `node --test tests/browser-performance.test.mjs
tests/runtime-smoothness.test.mjs tests/browser-responsiveness.test.mjs
tests/asset-streaming.test.mjs tests/tourist-animation.test.mjs
tests/intro-music.test.mjs`, then the Pillow delivery check above. The Pages
workflow runs these dependency-free Node gates before deployment. They protect
the 10.1 MB aggregate city-atlas delivery budget, delivery hashes/dimensions,
PNG fallback, no duplicate full atlas canvas, draw-buffer bound, audio eviction,
hidden/title work and elapsed simulation time. They are not device performance
or visual evidence.

For runtime/asset releases, run `tools/benchmark-browser.mjs` with existing
`PLAYWRIGHT_MODULE` and `CHROMIUM_PATH`. `BENCH_CHECK=1` enables the 18 MB cold
local-transfer ceiling, no deferred/authoring boot downloads, at most 4 Hz title
rendering, 1.6 MP drawing buffer, console and input gates. Use `BENCH_GPU=hardware` for the available hardware renderer and `BENCH_PROFILE=1`
for CPU samples; `BENCH_OFFICE=1` measures the office separately. Default runs three
cold navigations each on Chromium desktop (1280 × 800) and Android portrait
emulation (390 × 844), DPR 2; `BENCH_THROTTLE=1` adds 4× CPU and 1.6 Mb/s network
emulation. Keep logs/screenshots under ignored `output/`. These ceilings describe
this game and are regression guards, not desired long-term minimums: reduce them
with proven improvements, and never raise them merely to pass a check.

Record source revision, scenario, browser/GPU, viewport/DPR, cache/network/CPU,
ready/settled time, bytes/requests, largest resources, long tasks, frame-time
p50/p95, draw calls/triangles and texture/geometry counts. Report median/range of
three comparable runs; separate startup, title idle, gameplay and office entry.
Repeat near/distant actor approaches, load failure, background/resume and office
entry/exit for touched loaders/caches. Rendering/input checks include desktop
and Android portrait/landscape; physical Android remains a separate gate when
available. An optimization cannot be accepted solely on transfer savings if
it stalls input, breaks missions, loses an actor or raises warm frame/memory cost.

On a named physical reference device, aim for p95 active frame time ≤ 33.3 ms
(30 fps) and no continuing cache/resource growth after repeated warmed visits.
Until physical measurements exist, mark that target NOT RUN. Software GPU
results and emulation are diagnostics, not a claim that low-end hardware passes.
Do not add telemetry or collect player data merely to enforce this protocol.
World-affecting changes still require the independent Physics and Camera gates
in `OBJECT-CONSISTENCY.md`; silent audio state checks do not establish sound quality.

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

## Measured performance and export preservation

For a cost regression or optimization, use the matching profiling route in `SKILLS.md`. Record build, scene/state, device/browser, viewport/DPR, loaded/fallback variants, warm/cold conditions and comparable repeated runs. Distinguish initial playable time, long tasks, frame-time distributions/stalls, draw/triangle counts and resource growth across repeated entry/exit. Report measurement variation and CPU/GPU uncertainty; renderer counters and source estimates are partial evidence. Preserve accepted budgets and appearance rather than inventing universal limits or using one Lighthouse score as proof.

For risky GLB re-export/optimization, compare bytes alongside names/hierarchy, world bounds/pivots/scale, materials/textures, animation clips/skins, extensions and loader support. Format validation complements semantic, missing-file/fallback and rendered checks. Compression requiring Draco, Meshopt or KTX2 needs verified decoder integration before shipment. Reuse existing asset tools and accepted source rights; do not copy the unverified-license pascal bundle.

For rendered comparisons, freeze representative game/HUD states and camera, then calibrate repeated unchanged captures before setting tolerances. Verify a known meaningful visual mutation fails. Separate normal/reduced-motion and loaded/fallback states; screenshots cannot alone establish timing, physical-device performance or correct animation.

## Local 3D buildings

- Root `assets/models/` is the only authority for shipped model files.
- The root game has one required WebGL presentation path. Do not preload or restore the retired SVG/Canvas world-art set. Registered moving-character PNG atlases remain the deliberate bitmap exception; DOM UI art and billboard textures are not alternate world renderers.
- Trees are canonical world data in `game.js`, not renderer-local decoration. Apply the rail-gutter city offset exactly once, keep each trunk center at least 48 world units outside every road rectangle, expose the same placement to `world3d.js` and `3d.html`, and keep trees solid to ground movement.
- Ordinary civic buildings and small shops use the four original Blender-authored building families in `assets/models/city-kit/`. The same kit owns the original Pfand machines/bottles, coffee and fax kiosks, gnomes, trees, sheds, lamps, and street furniture. `manifest.json` records bounds, geometry counts, sizes, and hashes; `city-kit.blend` and `tools/build-city-assets.py` are offline authoring sources. The earlier Kenney Commercial files are retained with their CC0 provenance but are no longer requested by the renderer.
- Eleven additional texture-free Blender models under `assets/models/german-props/` add two towel-reserved loungers, two gnome variants, neighboring sandal/sock storefronts, a Germany-side Krügers Kugellager takeaway shop with an original bearing emblem, a returnable-bottle crate, wheelbarrow, recycling containers, and a picnic table. Their adjacent `PROVENANCE.md`, manifest, editable `.blend`, and Blender builder own source and size records. `game.js` owns shop footprints and prop collision positions; the renderer loads the shared GLBs on desktop and mobile with existing procedural stand-ins for missing files. The online CC0 building alternatives considered for this set are linked in that provenance record; none were imported.
- The southeast Berlin parcel uses the original Blender-authored `assets/models/bundestag/bundestag.glb` landmark: layered sandstone masonry, six-column west portico, four towers, and a ribbed glass dome with interior cone/ramps. Fit it uniformly onto its major parcel's stone apron so its proportions survive; retain its +Z entrance, ground-centered pivot, adjacent editable source, reference provenance, checksum, and procedural-building fallback. The enlarged canonical parcel is `x:7680, y:3320, w:1200, h:876`, with entrance approach `8280,4226`; both root and direct diagnostic use this shared layout. Its fitted model is approximately `24 × 8.22 × 17.52` rendered world units, about 2.09 times the former uniform scale, and exceeds the approximately 7.95-unit ordinary Rathaus height. This is a compressed city/caricature reference, not literal architectural metres. Review actual displayed people/car/door/building ratios, full collision clearance, entrance access, nearby furniture and the relocated monument against [`OBJECT-CONSISTENCY.md`](./OBJECT-CONSISTENCY.md); a bigger parcel alone does not establish a larger rendered landmark. Its texture-free GLB has a 2.5 MB / 70,000-triangle budget and uses decoder-free `KHR_mesh_quantization`.
- City models share source load promises and mesh geometry. Preserve their restrained authored stone/brick/metal colors. Clone building materials per instance for camera occlusion, multiplying authored opacity by an elapsed-time smooth fade and restoring authored opacity/transparency/depth-write state. Only actual visible opaque mesh obstruction from camera to player body triggers fading; contact/proximity, a footprint alone, clear gaps, roofs below all player-body sightlines and native transparent glass do not. Loaded models and procedural fallbacks obey the same rule and remain collision-solid. Character atlas alpha/depth must preserve correct front/behind building order. Small props fit uniformly; ordinary building families adapt to the established solid parcels. Desktop and mobile use the same bounded GLBs and never request `.blend` files or previews. Require the independent Physics and Camera/scale reviewers and rendered evidence in [`OBJECT-CONSISTENCY.md`](./OBJECT-CONSISTENCY.md) for world-affecting changes.
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
- `game.js` still owns lane population, regional car identity, movement, obstruction, queueing, collisions, horn timing and pursuit. The canonical uniform car render scale is 1.4 for loaded and fallback models, including live traffic and vortex deformation; wheel rolling uses the displayed tyre radius. Complete physical bodies use half-length 94, half-width 51 and wheelbase 105 simulation units, covering loaded police body pitch on the .3-world-unit/105-simulation-unit side ramps; angular sweeps and camera bounds reserve 107 simulation units. The four audited city-kit families keep at least 1.70 world units of authored entrance height for the 1.50-unit default player; do not infer door clearance for unaudited models or taller caricatures. Keep accessible routes and full procedural model-failure fallbacks. Live car spawn/wrap/removal requires a complete-body off-map and off-camera endpoint; cars drive along shared bounded road approaches, including smooth west/east station ramps shared by walking feet and car axles, and retiring police remain solid until departure. Initial city population may be preplaced; vortex swallow is the only on-map disappearance. Desktop and mobile share the bounded GLBs; neither downloads Blender sources, review images, a vehicle-physics package or a remote asset service.

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
- Chase audio stays under `assets/audio/police/`: one CC BY 4.0 Essen police Martinshorn recording supplies the distance-scaled loop and one CC0 German police-car pass-by supplies a cooldown-bound close approach accent. Preserve the adjacent `LICENSES.md` attribution, conversion notes, durations, sizes, and checksums. Both files load only when a chase or pass-by requires them, never use a remote runtime host, and fall back to the existing synthesized siren when unavailable.

## Opt-in prop-detail studies

`spark-preview.html` is a silent, opt-in rendering experiment with separate fax
and Frau Knick anchor scenes. It compares the same procedural samples/motion in
native Three.js points and locally pinned Spark 2.3.1, loaded only on selection.
The character data lives in `assets/previews/knick-splats/`; its two lossless
anchors derive from the existing clerk detail atlas. Its manually guided morph
has known face/arm interpolation artifacts and is not an accepted character
animation. The page starts paused, uses bounded rendering and hidden-page
suspension, and preserves ordinary game loaders, assets and event ownership.
This preview does not revise the code-native Wirtschaftswunder policy.

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

## Opt-in 3D street-character candidates

`assets/models/street-characters/` owns eight code-authored caricatures and one direct Three.js adapter. The pack reuses the existing geometry helpers and stays behind `?streetCharacters=1`; default play does not request its modules or replace accepted sprites. The existing simulation still owns placement, collisions, dialogue, and voice. `tools/export-street-characters.mjs` can regenerate GLBs for validation, but the browser adapter uses the source geometry directly, so generated GLBs are not shipped as duplicate runtime assets. The pack remains `candidate-unapproved` pending the visual and gameplay gates in [`STREET-CHARACTERS-CHECKLIST.md`](./STREET-CHARACTERS-CHECKLIST.md).
