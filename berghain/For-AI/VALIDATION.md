# Berghain viewer validation

2026-10-23; integrator-owned local candidate. This record covers the provisional architectural viewer and GLB, not measured fidelity, the main game or physical-device qualification.

## Confirmed public deployment

### Source-derived furniture — published snapshot, canonical update pending

Runtime commit **`ecfe6aa442fd99072b47c052e272f232b73c60fb`** was pushed with
main parent `bb00899bbdf9b9d14e36ba7f30503ed1aba85a0d` preserved. Only 14
scoped files changed; the working checkout's unrelated index was untouched.
Immutable public preview:
https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/ecfe6aa442fd99072b47c052e272f232b73c60fb/geheim/index.html
(`Open the page` prompt on a fresh provider visit).
`output/berghain-fixture-immutable-verification.json` passes **38/38** published
files against Git objects, including the new fixture module and native GLB.
`output/berghain-fixture-immutable-browser/report.json` passes **6/6** remote
desktop/Android-portrait cases: real exterior entry/exploration/exit/refresh,
furniture approach/collision, native GLB rendering and human-at-bar framing.
The furniture/native room selectors are explicitly diagnostic; the separate
entrance flow uses actual input from outside. The permanent Geheim page is
already verified for its earlier avatar release below. At this checkpoint the
new furniture's Pages update is pending behind an existing workflow; canonical
verification of these newer bytes remains outstanding.

2026-10-23: the 26-file SHA-256 freeze in
`output/berghain-fixture-candidate.json` replaces generic foyer/Panorama boxes
with 35 original furniture and lighting assemblies. Per-assembly source IDs,
dimensions and uncertainty survive in the GLB extras. Historical photographic
forms do not establish measured dimensions, exact placement or currentness.
Named artwork, the actual current PA and missing rooms remain unfinished.

Portable GLB: **10,461,748 bytes, 79,088 triangles, 51 mesh/material groups,
12 embedded original maps**, SHA-256
`9132e820a2ac0b72b510e369f9975a04600b587380f0ba185e3ef532ec08b45f`.
The official exterior reference and model bounds are unchanged. Furniture uses
shared instanced boxes, cylinders, rings and a genuinely perforated grille;
no additional texture, decoder, dependency, renderer or animation loop.
The larger GLB is fetched only for explicit export/native-asset inspection;
normal startup continues to construct the shared procedural model.

- Focused Node checks: **30/30 PASS** across fixtures, model, materials, survey,
  walkthrough and level-page packaging tests. Checks include real grille-hole
  ray traversal, visible-part collision bounds, bar/aisle legality and suspended
  fixture headroom against every vertex of the actual animated avatar.
- `output/berghain-fixture-clearance-browser/report.json`: **6/6 PASS** in silent
  desktop and Android portrait/landscape emulation. Actual keyboard/touch
  approaches show channel seats and stop at visible bar furniture. Separate
  diagnostic room selection and native-GLB rendering establish fixture parity;
  those shortcuts do not stand for natural entry.
- `output/berghain-fixture-clearance-walkthrough/report.json`: **4/4 PASS** on
  the same runtime hashes. Actual outside approach, continuous hinged-door
  entry/exploration/exit, moving gait, refresh, touch, cancellation, narrow/200%
  text, idle and graphics recovery remain covered.
- `output/berghain-fixture-text-layout/report.json`: **1/1 PASS**, including
  eight viewport/text-size combinations with the longer source-ID footer.

Both independent read-only reviewers confirmed **26/26 frozen hashes** and
fresh **23/23 scoped Node checks**, separately from supplied browser evidence.
Physics **P1/P2/P4/P5/X1 PASS**: 39 direct solid/render bounds agree, 14 assembly
proxies contain their parts, 92 shallow overlaps recover, and a separate sweep
of all three stairs found no pendant overlap at 900 legal avatar positions.
Camera/scale **C1–C5/X1 PASS**: current source/native/third-person images retain
coherent room depth and visible stool, bar, seat, fixture and human scale.

The review caught a foyer shade intersecting the avatar in one stair lane.
Moving it clear and adding a 297-position actual-avatar regression repaired
that contact. Panorama lenses were raised to **2.211 m** above the room floor,
leaving **0.411 m** above the fixed 1.80 m avatar. The counter top is 1.13 m,
stool top .77 m and channel-seat cushion .48 m; these are inferred model sizes.
There are no remaining required fixes for this bounded candidate. Crowd P3 is
out of scope. Physical Android, device GPU performance, exhaustive viewpoints
and contemporary photographic accuracy remain **NOT RUN**. Publication and
canonical URL verification are separate from these local acceptance results.

The subsequent I16/I17 catalogue additions only clarify *Felsenland*'s identity,
leather material and historical location; they change no runtime or assets.
No world reviewers or new browser batch are needed for that documentation.

### Geheim avatar walkthrough — release candidate

Runtime commit **`7517a173b798613319673b3113bea6d8d1c7be27`** was pushed to main,
with parent `b31b4cb6b738a58ea46768be7ee122bded1aaa4b` retained. The working
checkout's pre-existing index was not used. Immutable public snapshot:
https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/7517a173b798613319673b3113bea6d8d1c7be27/geheim/index.html
(fresh browser: provider's Open the page prompt).
`output/berghain-geheim-immutable-verification.json`: **37/37** published bytes
match Git objects, including viewer, avatar, door module, GLB and1200×630 PNG.
`output/berghain-geheim-immutable-open/report.json`: **2/2 PASS**, actual remote
desktop and Android-portrait-emulated entry, exploration, exit and refresh.
This verifies that snapshot. Canonical **https://germanysimulator.de/geheim/**
is now live: combined main `daef7f9cc62db4420215e33651dd6a88808ce32a` retains
this runtime; Pages run **39988132964 succeeded**. Earlier39985584152 was
cancelled/superseded. `output/berghain-geheim-live-verification.json` passes
37/37 published files, 33 ordinary routes, share image/metadata and six canonical,
bare-path, custom root/3d and GitHub-short endpoint checks. Actual canonical
desktop/Android-portrait entry/exploration/exit/refresh passes **2/2** in
`output/berghain-geheim-canonical-browser/report.json`. Expected hashes came
from the published Git objects; the local furniture candidate is newer.

2026-10-23: `/geheim/` is generated from the existing viewer with optional
third-person mode. Same model, navigation, renderer and assets; no new mission,
scene handoff or duplicated runtime. Original anonymous procedural human and
shared hinged door are viewer objects, excluded from the building GLB. Its
6,713,940-byte SHA256 `1fbb211bc0f63c54334b27bbe29b813e2b648146c699d4d4d434f1e4e734674f`
remains unchanged. Interior art/equipment research remains a modelling backlog.

- `node --test tests/berghain-walkthrough.test.mjs tests/berghain-model.test.mjs
  tests/berghain-survey.test.mjs tests/berghain-materials.test.mjs
  tests/level-pages.test.mjs`: **24/24 PASS**. Covers continuous legal entrance
  traversal both ways, far/duplicate guards, closed-door delayed movement,
  cancellation, grounded adult bounds, complete gait-phase radial/height bounds,
  closed-door-seam camera clearance, existing stairs, export and static packaging.
- `output/berghain-geheim-release-browser/report.json`: **4/4 PASS**, final human/camera
  candidate in silent Chromium151 desktop and Android portrait/landscape
  emulation. Real keyboard or CDP touch approaches the entrance from outside,
  enters with E/button, walks inside, exits through the same door, refreshes
  outdoors; crossing positions are sampled continuously. Desktop also covers
  duplicate E, blur/modal cancellation, 320 px/200% text measurement and no
  movement-pad overlap, idle frame quiescence and context loss/restoration.
  Three screenshots and accepted positions per approach record actual moving
  gait. Camera target .95 m and walk-only FOV60 retain the full human at the
  contracted entrance camera; complete-body projection checks cover all three
  aspects. Original exterior/orbit restores FOV45.
- `output/berghain-geheim-original-viewer/report.json`: **2/2 PASS**, original
  architectural viewer desktop/Android-portrait tour and native GLB parsing.
- `output/berghain-geheim-acceptance/report.json`: **5/5 PASS** on the preceding
  human candidate, including rendering the original 1200 × 630 share preview.
  The final gait/head repair is covered by the later four-case suite above.
- Independent Physics review caught the initial shoes/hands exceeding the .28 m
  collision radius. Repair constrains the complete animated mesh; the new test
  sweeps 144 gait phases. Integrator screenshot review also caught a centre-ray
  camera passing between closed leaves; nine offset rays now protect the view.

Causal contract: canvas E (nonrepeat) or entrance-button click → proximity and
not-travelling guards in `walk.interact` → open actual shared door and set one
travel target → existing swept full-body `moveVisitor` per frame → continuous
threshold crossing → close only if the new solid state leaves a legal body.
There is no reward/mission event. Far/absent E leaves state unchanged; duplicate
E cannot reset travel; blur/modal/hidden/context loss cancels pending travel and
held input. A blocked step cancels travel instead of scheduling an endless walk.
Final-state screenshots are supplemented by sampled intermediate positions and
the CPU legal-body checks. Shortcut room selection is not entry-flow evidence.

Responsiveness/ownership: optional module is loaded only for Geheim/play mode;
one 1.80 m human, six shared procedural materials, no downloaded texture and no
new scheduler. Gait advances from actual displacement. Camera uses actual opaque
meshes and preserves authored glass/materials. Existing single demand-driven RAF
and capped pixel count remain authoritative; idle viewer schedules no continual
animation. Pagehide owns door/avatar geometry/material disposal and input cleanup.
No device-speed or GPU-memory improvement is claimed.

Both required independent reviewers accepted the same 22-file SHA256 snapshot
at `output/berghain-geheim-candidate.json`. Physics: scoped P1/P2/P4/P5/X1 PASS,
including independent 360-phase every-vertex radius .27514561 m, height1.80 m,
the repaired real plinth case and 25 legal entrance starts; supplied moving
frames/positions bind to the current hashes. Camera: scoped C1–C5/X1 PASS,
independent 1,523-vertex projection at the contracted 1.909 m entrance camera;
all vertices remain framed. Both verified 22/22 hashes and distinguished fresh
CPU checks from supplied browser rendering. Crowd P3 is out of scope; physical
Android, full adversarial camera sweep, assistive-technology evaluation and
social-platform cache rendering remain **NOT RUN**. Context recovery passed
with no page errors; driver/WebGL disposal warnings were recorded in the forced
loss scenario. Public deployment remains a separate release check.

Runtime/material commit `9c842707e588e5e218109a0f63eb51c73a472b1f` deployed
successfully through Pages workflow `39977033051` on 2026-10-23. Canonical viewer:
**https://germanysimulator.de/berghain/model.html**.

- `output/berghain-live-verification.json`: **31/31 published files match the
  exact commit**, plus HTTP200 for custom-domain root/3d.html and both GitHub
  short endpoints redirecting correctly. Expected bytes came from published
  Git objects, not the evolving working tree.
- `output/berghain-live-browser/report.json`: **2/2 PASS**, actual deployed
  desktop and Android-portrait-emulated tours, keyboard/touch, room navigation
  and real native GLB parsing (6,713,940 bytes), no recorded page errors.
- Earlier immutable raw.githack previews remain valid snapshots. Opening the
  preview in the app was queued; no foreground opening is claimed.

Research catalogue/inventory edits below are a subsequent documentation update.
They do not change this verified runtime or imply that the missing art/interior
objects have been modelled. Physical Android remains NOT RUN.

## Interior inventory and catalogue expansion

Research-only update: 81 unique source IDs, actual low-resolution historic floor
cartoons and primary gallery/artist/manufacturer records. `INTERIOR.md` separates
artwork identity, dates, area, dimensions, acquisition and remaining modelling.
DS210 STEP/DXF downloads have matching file headers; its one-page PDF was rendered
and visually inspected because dimension labels extract incorrectly. This proves
reference acquisition, not current venue equipment or artwork geometry.

The static builder now includes the public inventory linked from the catalogue.
The focused packaging check first failed on that missing public file; the copy
boundary was extended without including research downloads or authoring guides.
`node --test tests/berghain-model.test.mjs tests/level-pages.test.mjs`: **15/15 PASS**.
No renderer, geometry, camera, movement or materials changed. Independent world
reviewers and new walking browser batches are outside this documentation scope;
the previous material candidate remains the current runtime evidence.

## Original material maps — current

Frozen candidate: `output/berghain-material-candidate.json`, **36/36 hashes**
confirmed by both required read-only reviewers. GLB **6,713,940 bytes /
40,112 triangles / 39 meshes / 12 embedded PNGs**, SHA-256
`1fbb211bc0f63c54334b27bbe29b813e2b648146c699d4d4d434f1e4e734674f`.
Geometry bounds, layout, calibration, navigation and camera hashes are unchanged.

- **18/18 PASS**: material embedding/UV contract plus prior model/survey/packaging
  checks. The portable asset embeds/deduplicates all 12 images and uses standard
  base-colour, packed metallic/roughness and normal textures with VEC2 UVs.
- `output/berghain-materials-revised/report.json`: **7/7 PASS**, desktop/Android
  portrait/landscape tours and all-texture-download failure with actual walking;
  desktop graphics loss/restore and stopped idle rendering. No shader error.
- `output/berghain-material-parity/report.json`: **1/1 PASS** isolated close-up
  editable/native-GLB rendering with the same lights/camera. Mean 8-bit RGB
  difference 0.8558, >32-level differences in 0.0314% of pixels, 556 sampled
  colours. This verifies visible material transfer, not photographic accuracy.
  All 12 shared source textures emit disposal once. Runtime hashes match freeze.
- Physics **PASS**, fresh 1,492 solid/render bounds and six legal viewpoints,
  entry/window-bay sweeps and eight focused movement checks. Vertex code changes
  UVs only. Prior actual stair routes apply to identical movement and geometry;
  no redundant new stair browser batch was run for this material-only patch.
- Camera/material **PASS** scoped: full framing, clear views, readable injected
  failure banner and near-identical source/export close-ups. Faint vertical
  tiling remains on the long blank hall wall. Physical Android and site-accurate
  material/decay fidelity remain **NOT RUN / NOT ESTABLISHED**.

The initial maps (`output/berghain-materials-first/`, 7/7 technical PASS) visibly
repeated on broad surfaces. Lower macro contrast and excluding undocumented
roof materials corrected the strong pattern; revised screenshots were inspected.
Four 512² families use 2 m projected repeats. PNG payload totals 2,754,956 bytes;
estimated uncompressed RGBA8 storage with complete mip chains is 16 MiB for
12 maps, excluding geometry, shadow buffers and driver costs. This is a storage
estimate, not a GPU residency measurement. Production geometry stays instanced.

## Photo-informed façade with inset panels — historical

Frozen candidate: `output/berghain-facade-inset.json`, 16/16 hashes confirmed by
both independent reviewers. Main GLB **3,406,612 bytes / 40,112 triangles /
39 mesh-material groups**, SHA-256
`75bfc25d0e952bc999d1c71baca9560faac60ccc5e767d2b24a3d759bd5a927b`.
Physical inset panels replace the earlier outlines; tiers, spandrels, mullions,
sills and attic vents follow dated photo observations. Openings and bay counts
remain estimates, materials plain PBR colours, interior provisional.

- Deterministic scoped model/survey/packaging checks: **17/17 PASS**.
- `output/berghain-facade-inset-viewer/report.json`: **4/4 PASS** — tours with
  keyboard/touch, real GLBLoader, desktop and Android portrait/landscape emulation;
  desktop graphics context loss/restore and stopped idle rendering.
- `output/berghain-facade-inset-walking/report.json`: **2/2 PASS** — actual
  keyboard ascent/descent of all three stairs, desktop and Android portrait.
  All 14 runtime hashes in both reports match the freeze/current files.
- Independent Physics **PASS** scoped: 1,492 linked solids, exact vertical
  render/collider bounds, façade XZ discrepancy ≤0.000246 m; all 99 panels and
  396 rims solid-linked. Entrance centre interval about [-1.05,1.05] m at z22;
  legal crossing and blocked jamb/window sweeps behave correctly. Six viewpoints
  legal; nine sampled stair routes pass up/down.
- Independent Camera/scale **PASS** scoped: full building framing and six eye
  viewpoints clear; shell enclosed by camera bounds with 0.1 m margin. Insets
  measure about 5.9–6.0 cm after calibration. Overview screenshots cannot resolve
  that depth closely; source/mesh measurement establishes the recess, not
  close-up photogrammetric fidelity.

The original façade batch at `output/berghain-facade-walking/` passed desktop
but failed Android pilot alignment before Panorama ascent. An unchanged-runtime
instrumented retry passed. `output/berghain-facade-pilot-delay/` deliberately
holds key releases for 600 ms and reproduces fixed-duration correction pulses
oscillating around their target. This shows pilot timing sensitivity; the exact
cause of the original failure was not recorded and is not asserted proven.
Final actual-keyboard routes pass on the current inset candidate without
changing production movement or loosening assertions. Preserve the failed reports.

Physical Android and close-up recess appearance remain **NOT RUN**. Existing
320 px/200% text and engine-failure evidence below belongs to the unchanged UI
source and was not repeated for this geometry-only patch. Full weathering,
per-elevation truth and missing interiors remain unfinished. Catalogue: 59 entries.

## Calibrated walking candidate — historical

The walking viewer now uses the official main-volume cross-sections and roof
levels, actual roof faces, taller Halle front-wall strip and both western annex
meshes. Interior floors and detail remain approximate. The following current
candidate supersedes the initial study and acquisition-only records below.

Freeze: `output/berghain-calibrated-revised.json`, **16/16 current hashes**
confirmed by both independent reviewers. Combined GLB: **1,716,212 bytes,
19,988 triangles, 39 meshes/materials**; SHA-256
`eafd843f4dbb4d96256bbb7952833c83d9c9749c9503ca8d1ce13d523cc3e16a`.
Units remain metres, visitor radius 0.28 m and eye height 1.68 m.

`node --test tests/berghain-model.test.mjs tests/berghain-survey.test.mjs tests/level-pages.test.mjs`:
**17 PASS**. Tests now cover sheared polygon collision, unchanged maximum step
height, exact collider/render vertical bounds, four reproduced tread-underside
body contacts, full actual stair routes, true updated camera bounds and official
exterior dimensions, in addition to the existing routing/packaging checks.

Current silent headless browser evidence, with matching runtime hashes:

| Report | Result and scope |
| --- | --- |
| `output/berghain-calibrated-revised-walking/report.json` | **2/2 PASS**, desktop and Android portrait emulation. Real keyboard ascent/descent of all three stairs reaches correct landing heights. |
| `output/berghain-calibrated-revised-viewer/report.json` | **10/10 PASS**, desktop/Android portrait/landscape tours, touch, GLB loading, modal cancellation, eight viewport/text-size combinations per profile, load failure and graphics loss/restore/idle rendering. |

Earlier calibration failures remain in their original reports. The desktop
doorway-approach failure at `output/berghain-calibrated-stairs/` recorded a
protocol key-release overshoot to z=22.13 rather than the intended z≈21.03;
the pilot now corrects both axes via bounded actual keyboard presses before
each leg and preserves its landing-height assertions.

Independent **Physics P1/P2/P4 and scoped X1 PASS**: all 494 render-linked
solid Y bounds match actual baked matrices exactly; 2,198 tread underside
contact samples yield no legal full-cylinder penetration; 297/297 applicable
column/rail/annex overlap samples recover; all 27 stair routes across nine
lateral positions per flight reach both landings. Six viewpoints are legal.
Ramp perimeter support accounts for slope across body radius while retaining
the 0.36 m per-move candidate step limit. Per-tread underside proxies supplement
the smooth walking surface; supported feet use that surface rather than being
blocked by each tread edge.

Independent **Camera C1–C5 and scoped X1 PASS**: all 1,473 box matrices have
positive determinant; eye-ray probes find no lateral mesh within 0.28 m, nearest
0.552 m at Panorama. Actual shell extrema fit the camera helper with 0.1 m
margin. Supplied current desktop/portrait images show unclipped building/annex
framing, clean roofs, and a closed Halle roof step. The widest floor-versus-box
XZ approximation is 0.076 m on the forecourt and at most 0.009 m elsewhere.

Review findings were repaired: derive collider heights from exact render parts;
clear the provisional Halle stair lane by moving an inferred column/beam line;
block whole-body tread underside contacts; include actual cornice/pipe bounds;
and remove roof shadow banding. The shadow diagnosis retains its isolated
evidence in `output/berghain-shadow-{offset,disabled,bias}/`: normal bias alone
did not remove bands, disabling directional shadows did, and bias=-0.001 with
normalBias=0.04 removes them while retaining cast shadows. Current production
screenshots confirm the fix. The column grid remains unverified.

Both reviewers were read-only and launched no competing browser. **Physical
Android, targeted moving-glass sightlines and a rendered human comparison remain
NOT RUN.** Main-game missions, crowds, vehicles and sprite/fade gates are outside
this viewer. Full photographic/material fidelity and undocumented interiors
are unfinished; the full reconstruction goal is active.

## Initial candidate and asset — historical

Frozen runtime, geometry, GLB, test and builder hashes: `output/berghain-candidate-accepted.json` (local evidence). GLB SHA-256: `bc75ea98dd88a9af0fba260e14580c5a79276bb484819586410793ddb8f75b42`. Size 1,704,276 bytes; 19,980 triangles; 30 mesh/material groups; metres; original geometry with no external textures or decoders. A real browser GLTFLoader parsed the downloadable file and compared mesh count, size and bounds to its manifest.

## Deterministic checks

`node --test tests/berghain-model.test.mjs tests/level-pages.test.mjs`: **13 PASS**. Checks cover full-body wall clearance under delayed motion, floor edges, all six authored viewpoints, ramp undersides/slabs, all three real stair connections up/down, overlap recovery, queue rails, camera framing, hidden-page routing and the builder's exclusion of research/private authoring files. Existing level-route tests also pass. No main-game runtime was changed.

## Browser evidence

Headless Chromium with isolated muted audio. Desktop and Android profiles are emulated; **physical Android NOT RUN**. Batches ran sequentially. No listening claims apply to this silent viewer.

`output/berghain-final/report.json` records 11 PASS / 1 FAIL on the unchanged runtime/geometry candidate. Successful cases cover tours in desktop/Android portrait/landscape, touch hold, actual walking and room changes, modal input clearing, GLB load, eight viewport/text-size combinations per profile (including 320 px and 200% text), load failure, WebGL loss/restore and idle RAF cessation. The failed case was the desktop stair pilot; its original failure remains preserved.

The original pilot waited only for an axis threshold, allowing protocol key-up latency to carry it outside a stair's approach. A diagnostic that injected 600 ms delay into one actual key release reproduced the Panorama height failure at x=-6.8539, y=6.65 beside the ramp (`output/berghain-pilot-delay/`). The same injected delay passes with bounded keyboard corrections and an explicit ±0.18 m final-x assertion (`output/berghain-pilot-corrected/`); the pilot corrects x=-7.0618 to -4.9165 before climbing. No visitor state is injected and the original landing-height assertions remain unchanged. The historical intermittent failure lacked coordinates, so its exact cause cannot be claimed as proven.

Final affected-route rerun: `output/berghain-walking-accepted/report.json`: **2/2 PASS**, desktop and Android portrait emulation, without injected latency. Both routes climb and descend main (0.05↔6.65 m), Panorama (6.65↔13.25 m) and Halle (0.05↔7.05 m). Runtime hashes match the accepted freeze. The test records crossed/aligned approach coordinates and both landing positions in `routes.json`, including before a failed height assertion. Earlier tour/layout/load/lifecycle passes remain applicable to the unchanged production source; the affected rerun replaces the earlier failed stair result, rather than rewriting its report.

## Independent reviews

Two read-only reviewers examined the same frozen production source, supplied rendered evidence and fresh CPU probes. Neither launched a competing browser batch or changed files.

| Scope | Finding and evidence |
| --- | --- |
| Physics P1 | Tested walls, queue rails and invalid overlap recovery pass fresh CPU probes; six viewpoint bodies and eye points are clear. 147 single-wall, 196 L-wall and 231 parallel-wall overlap probes recovered. Full rendered collision sweep remains NOT RUN. |
| Physics P2 | All three actual stairs reach both landings in fresh CPU checks. Panorama climbs across the tested full-body lane x=-6.2 to -3.8. Earlier stair/floor/landing defects were fixed, rather than bypassed through room selection. |
| Physics P4 | Manual corner recovery passes a bounded CPU L-corner probe. No avatar gait exists in this viewer. Rendered corner sequence NOT RUN. |
| Camera C1–C2 | Six clear viewpoints pass source/CPU checks and supplied room-image inspection. Targeted moving glass sightline sweep NOT RUN. |
| Camera C3 | Previous portrait crop fixed. Fresh Three.js projection at 390×577: fit radius 160.162 m, shell x=-0.900 to +0.841 NDC; supplied portrait image contains the shell. |
| Camera C4–C5 | Representative room depth and source scale relationships pass. Eye/body 1.68/1.8 m, entrance 3.2×3.4 m, stair risers approximately 0.178/0.183/0.179 m. These are model relationships, not surveyed measurements. Rendered human comparison NOT RUN. |
| Browser X1 | **PASS for the sampled affected desktop and Android-emulation stair routes** on accepted hashes; read-only Physics re-review confirmed both traces and matching runtime hashes. Initial desktop FAIL retained and corrected-pilot delayed-input regression separately passes. Android evidence is emulation only. |

The Physics reviewer also checked the test correction: bounded real keyboard input, preserved height assertions, no state mutation. Both reviewers subsequently confirmed all 11 accepted hashes and the final walking report's eight runtime hashes; both returned scoped viewer X1 PASS. All production files and GLB matched the reviewed freeze; only the test hash changed. Crowd/vehicles/sprites/main-game missions and their broader gates are outside this model viewer's scope.

## Outstanding

Full measured fidelity, missing rooms/circulation, surface detail, physical Android qualification and the targeted NOT RUN review rows remain outstanding. No full-digital-twin or whole-game acceptance is claimed. At this historical initial stage, publication was blocked by the unborn local branch and absent Git remote. Later isolated bare-repository publication resolved that checkout limitation while preserving unrelated staged work.

## Official exterior acquisition and export

The next goal turn acquired the matching ALKIS feature and CityGML LoD2 building
`DEBE02YY200004SX` from Berlin's working official download service. This is a
**separate exterior calibration asset**; it is not the study viewer's geometry
and its isolated render does not establish interior navigation.

- Source/raw-download hashes and reversible local coordinate frame are embedded
  in `assets/models/berghain/survey-data.mjs`; authoring importer validates the
  source building address/ID, cadastral front-edge endpoints and feed licence.
- `node --test tests/berghain-survey.test.mjs tests/berghain-model.test.mjs tests/level-pages.test.mjs`:
  **14 PASS**. New checks invert the local frame to original EPSG:25833/altitude
  bounds, preserve the 3,432.10 m² footprint, require annexes and height bounds,
  and check finite positions/unit normals.
- `node berghain/export-model.mjs --survey`: **26,796 bytes, 88 triangles,
  16 meshes/materials**; SHA-256
  `58d3169171da590c83d666b079f769ae28c6128f856b31b31c93c4e7c10d6b17`.
  The shared serializer handles ordinary and instanced meshes. Re-exporting
  the original study produces its unchanged `bc75ea98…` hash.
- `output/berghain-official-verified/report.json`: **1/1 PASS**, muted headless
  desktop Chromium. Actual GLTFLoader parsing matches source-model and manifest
  bounds/mesh count; front/rear rendered images show the four connected volumes.
  Its source hashes include official data/model/GLB/manifest. Test-only isolated
  scene preparation is explicitly recorded; it does not claim a user input path.
- Independent Physics review tied all **162 generated polygon vertices** to
  raw CityGML across four parts/37 polygons, maximum error **4.82×10⁻⁷ m**;
  raw ground areas total **3,432.1028 m²**. Front edge **37.949743 m**, raw
  bounds E394318.997–394393.933, N5819009.577–5819098.896, altitude35.288–58.091.
  It confirmed raw hashes, GLB metadata/bounds and unchanged study export.
- Freeze: `output/berghain-official-accepted.json` (8 files). Both independent
  reviewers confirmed all current frozen hashes and returned **PASS within the
  isolated exterior calibration-reference scope**. Camera's fresh projection
  kept front/rear hulls within the supplied desktop frame; maximum absolute
  NDC component was 0.759. It independently confirmed ground area and source
  dimensions. Neither reviewer ran a browser or changed source.

At this acquisition-only checkpoint the study still used its older 44 m width;
the calibrated candidate above supersedes that geometry. The extraction alone
did not establish walking, collider, physical Android, measured-interior or
texture fidelity. The official data is generalised LoD2, not a new building
survey; source part footprint date is 2023-03-11.

## Reported main-hall speaker equipment — accepted scoped candidate

2026-10-23. Frozen contract: `output/berghain-speaker-candidate.json`,33 files,
base `83cac59dc3c5fb550db47ce38a42b14c785ed639`. Concurrent exterior/landscape
changes were preserved in the primary checkout. The original speaker candidate
was recovered in `output/berghain-speaker-release`, where all33 SHA-256 hashes
match, including GLB `0fdcdeb142fffdfa1d6e1c226e7cacd1a64db51b3d4b42b00cbc0c7981a98583`.
No primary index/reset/revert operation was used. The unchanged shared door
module's extra trailing blank line is excluded from publication.

Editable/native asset:44 components,66 mesh/material groups,130,256 triangles,
16,643,096 bytes,12 existing embedded original maps; exterior bounds unchanged.
Twelve F218 MkII, sixteen Evo6EL, ten Evo6EH and six F124 replace generic boxes.
The four component envelopes match inspected manufacturer drawings S07–S10;
reported arrangement is S05, repeated in S06, with qualified later S11 evidence.
Internal horn contours, finish, supports, anchors and currentness remain inferred.

Executed on the isolated served source, silently in headless Chromium151:

| Evidence | Result and scope |
| --- | --- |
| Six Node suites: model, fixtures, materials, survey, walkthrough, sound-system |32/32 PASS. Full-body collision/aisle, exact component envelopes, finite normals, hollow apertures, transformed visible/collision agreement, stairs, packaging and export. |
| `output/berghain-speaker-release-browser/report.json` |7/7 PASS: source/native GLB and avatar near equipment on desktop, Android portrait/landscape emulation;320px/200% text and Pretext labels. All reported source hashes match the frozen release. |
| `output/berghain-speaker-isolated-entry-browser/report.json` |4/4 PASS: natural keyboard/touch approach, proximity action, hinged door entry/exit, cancelled crossing, layout and lifecycle. Suite and served root both isolated. |
| `output/berghain-speaker-isolated-stairs-browser/report.json` |2/2 PASS: all three stairs up/down, desktop and Android portrait emulation. Hashes match isolated disk;14 unchanged texture/survey dependencies extend the33-file contract. |
| `output/berghain-speaker-isolated-furniture-browser/report.json` |4/4 PASS: defining furniture compositions/native GLB and avatar at bar on desktop/Android portrait. Covers the shared native-asset helper extraction. |

Independent read-only Physics reviewer: P1/P2/P4/P5/X1 PASS for this viewer.
Fresh29/29 scoped tests;44 components/58 equipment solids;176 visible component
surfaces fit transformed collision envelopes. No opposing same-assembly cabinet
surface vertices penetrate the adjacent trapezoid. Bottom cabinets sit at6.65m;
tilted towers sit2.68mm above their supports.70/70 shallow overlap starts recover
legally; seven10m western-aisle lanes each have101/101 legal samples. Supplied
matching rendered evidence shows body separation. P3 crowd/vehicles out of scope.

Independent read-only Camera/scale reviewer: C1–C5/X1 PASS as adapted to the
three-dimensional architectural viewer. Fresh32/32 tests; ray probes enter real
horns .19–.69m; source/native depth persists, full1.80m avatar remains visible,
and manufacturer cabinet size relates plausibly to it. Both reviewers confirm
all33 hashes and all17 supplied browser cases. No required fix remains.

Evidence limits: room selection is a diagnostic shortcut in speaker/furniture
views; natural entrance and stairs are proved separately. Native GLB uses its
explicit inspection renderer/lighting, so image brightness is not exact parity.
No acoustic simulation/listening, physical Android/device-GPU test, city
crowd/vehicle/sprite/fade test, or accurate current installation claim. Earlier
moving-primary queue failure and diagonally sliding pilot are not acceptance
evidence; the frozen release passes the original queue guard and head-on block.
Retained overhead DS assemblies, Panorama Studt rig, named artworks and missing
rooms remain unfinished. This accepts an equipment increment, not the full goal.
