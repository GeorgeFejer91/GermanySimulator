# GermanySimulator / Satire kit

Status: **45 GLBs exported and viewer-rendered; 43 IDs have opt-in world uses. Full gameplay acceptance remains pending.**

## Delivered scope

17 station models: departure board, clock, platform sign, shelter, ticket machine,
validator, station bench, station bin, luggage lockers, underpass entrance,
regional station building, catenary mast, barrier, pretzel kiosk, information
column, platform-edge strip and platform lamp.

16 civic models: judgmental fax, Pfand machine, bottle crate, Kehrwoche set,
recycling judges, garden wheelbarrow, three garden gnomes, garden shed, forms
pedestal, socks-and-sandals monument, city bench, reserved lounger, currywurst
kiosk and passive-aggressive bin.

12 clutter models: noticeboard, utility box, queue barrier, suitcase, bottle
cluster, snack litter, planter, traffic cone, bollard, fence, stamp and forms.
The authoritative IDs and family assignments are in `models.js`.

## Authoring and provenance

These are code-authored low-poly meshes, not generated-image cutouts or Blender
files. `geometry.js` contains reusable primitive, transform, physical-lettering
and caricature helpers. `models.js` defines the 45 recipes. The shared builder
and GLB encoder are imported from `../prop-details/models.js`; fax, crate,
wheelbarrow and recycling candidates explicitly reuse those earlier studies.
The four earlier study exports remain byte-identical. No accepted original GLB,
bitmap character, voice file, trademark logo or font file was overwritten.

Materials are a small muted palette with flat geometric normals, bevelled edges,
exaggerated hardware, eyes/brows, large props and short physical lettering.
The lettering uses original code-defined 3-by-5 glyphs rather than an imported
font. The large asset sheet images from the conversation are direction references,
not textures inside these meshes. No external photos or models are embedded.

Station context was checked against the existing project's public references:

- https://www.bahnhof.de/hubertushoehe/zukunftsbahnhof
- https://www.bahnhof.de/mettenheim/zukunftsbahnhof

These references informed generic station vocabulary, not a measured reconstruction
of either station. No third-party photograph was downloaded or relicensed by this
change. Reuse of their photos would require separate licence review. The pack
includes the repository's established blue/cream/red rail vocabulary without DB
logos or changes to AMT-Bahn rolling stock.

The initial candidate pass used the repository's static-first fallback. The
2026-09-30 integration pass read the available Ponytail skill and kept the
existing generator, GLB encoder and static loader without a new dependency.

## Runtime and geometry contract

Metres; Y-up; +Z-front; ground-centred origins; finite float32 positions and unit
normals. Each model uses one material-batched mesh with no texture, external
buffer URI, skin, animation or decoder dependency. These are static props.
The underpass is an entrance/stair asset, not a newly playable underground route.
Sculpted gnomes are static ornaments, not new rigged characters.

Measured exports: **45 GLBs, 66,190 triangles, 4,933,208 bytes total**. Each model
is below 5,000 triangles and 400,000 bytes. `manifest.json`, produced by the
exporter, records exact per-model dimensions, material primitives and SHA-256.
This is not a measured FPS or mobile-memory budget.

## Inspection, use and export

Open `satire-kit-preview.html` through the existing local HTTP server. It offers
all 45 models, orbit/zoom, front/side/back views and individual GLB export. It
uses the same Three.js 0.186.0 CDN version as the current game. This editor-only
inspection page is not a second game. It contains no audio or autoplay.

Add `?satireKit=1` to the root game URL (or `&satireKit=1` after another query).
The 13 exact old model paths listed in `loader.js` are substituted at their
existing placements, with the existing uniform-fit and simulation-owned collision
rules. The red reserved-lounger identity is intentionally not replaced by the
blue candidate. Remove the query option to return to the original model loading.
The earlier `?propDetails=1` four-model mode remains available when satireKit is
off. Default play downloads neither new kit module.

Existing station rectangles get a bounded rear furniture layout: two shelters,
a departure board, platform sign, clock and ticket machine, with cached geometry
shared across stations. The original platform foundation/edge geometry is
reproduced; the original central station-name navigation signs stay visible.
Original station groups remain visible until every candidate model loads; any
load failure keeps the originals. Station placement tests use synthetic rectangle
fixtures, not a live read of the simulation's current station data.

Not every one of the 45 models is scattered throughout the map. The regional
building, underpass, kiosks and extra clutter are complete model candidates in
the catalogue, but new collision-bearing placements require a separate validated
simulation-owned placement pass. No new interactive verbs are claimed.

To produce physical GLB files on the PC, run from the repository root:

```sh
node tools/export-satire-kit.mjs
node --test tests/prop-details.test.mjs tests/satire-kit.test.mjs
```

The exporter only writes this pack's named GLBs and manifest; it never overwrites
an accepted GLB in another directory. The viewer and optional game loader build
identical GLB bytes in memory, so they work without this command. V5 received the
UTF-8 source, loader, viewer, tests and documentation, not binary GLB uploads.
The conversation's downloadable archive includes all 45 prebuilt GLBs.

## Verification and remaining gates

66 CPU tests passed on source copies matched to the v5 write-result hashes:
45 per-model checks, ID/catalogue safety, original-byte preservation, cached
parsing, failure/retry behavior, exact replacement scoping, colour-identity
preservation, bounded station placement and the prior 14 prop-study tests.
The new JavaScript modules pass Node syntax checks. All 45 GLBs opened in the
independent trimesh reader; actual triangle renders of all 45 were inspected.
Those images are software renders, not in-game WebGL screenshots.

Full browser QA is **not passed**. The execution companion reported that
`repo_validate` was unavailable. The isolated Chromium test was blocked from
opening the local HTTP page (`ERR_BLOCKED_BY_ADMINISTRATOR`), and the existing
Three.js CDN files could not be fetched from this environment. Consequently
actual GLTFLoader rendering, orbit/export UI, context recovery, desktop/mobile
playability, frame time and live station clearance remain unverified. Do not
promote the kit to default or represent software renders as game screenshots.

No repository-wide test run, Git commit, push, deployment or remote publication
was performed by this asset pass.

## 2026-09-30 live integration review

All 45 standalone GLBs were exported and their manifest byte counts and SHA-256 digests were checked against the files. A muted, headless Microsoft Edge run parsed and rendered every ID in front, back, side and three-quarter views. Contact sheets and individual browser screenshots are in `output/playwright/`. This is browser-rendered evidence; only representative world areas received screenshot review.

The opt-in world has 70 simulation-owned kit prop records (including 24 station fixtures), plus the existing model-path swaps. The following table distinguishes actual placement from export and viewer rendering. “Existing footprint” means the replacement keeps its prior simulation-owned collision; “solid” means a new simulation prop participates in `staticBlocked`; “decorative” means it intentionally does not. Station fixture collision activates only after the complete station assembly loads.

| Asset | GLB | Four browser views | World use | Collision | Remaining defect / limit |
| --- | --- | --- | --- | --- | --- |
| departure-board | Yes | Yes | Four station assemblies | Solid | None seen in viewer |
| station-clock | Yes | Yes | Four station assemblies | Solid | None seen in viewer |
| platform-sign | Yes | Yes | Four station assemblies | Solid | None seen in viewer |
| platform-shelter | Yes | Yes | Four station assemblies | Solid | None seen in viewer |
| ticket-machine | Yes | Yes | Four station assemblies | Solid | None seen in viewer |
| ticket-validator | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| station-bench | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| station-bin | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| luggage-lockers | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| underpass-entrance | Yes | Yes | None | None | Excluded: no connected route |
| regional-station | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| catenary-mast | Yes | Yes | None | None | Excluded: full train-body clearance not proven |
| platform-barrier | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| pretzel-kiosk | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| info-column | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| platform-edge | Yes | Yes | Opt-in map prop | Decorative | None seen in viewer |
| platform-lamp | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| judgmental-fax | Yes | Yes | Existing model-path swap | Existing footprint | None seen in viewer |
| pfand-machine | Yes | Yes | Existing model-path swap | Existing footprint | None seen in viewer |
| beer-crate | Yes | Yes | Existing model-path swap | Existing footprint | None seen in viewer |
| kehrwoche-set | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| recycling-judges | Yes | Yes | Existing model-path swap | Existing footprint | None seen in viewer |
| garden-wheelbarrow | Yes | Yes | Existing model-path swap | Existing footprint | None seen in viewer |
| garden-gnome | Yes | Yes | Existing model-path swap | Existing footprint | None seen in viewer |
| watering-gnome | Yes | Yes | Existing model-path swap | Existing footprint | None seen in viewer |
| ordnung-gnome | Yes | Yes | Existing model-path swap | Existing footprint | None seen in viewer |
| garden-shed | Yes | Yes | Existing model-path swap | Existing footprint | None seen in viewer |
| forms-pedestal | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| socks-sandals | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| city-bench | Yes | Yes | Existing model-path swap | Existing footprint | None seen in viewer |
| reserved-lounger | Yes | Yes | Existing model-path swap | Existing footprint | Blue replacement only; red original preserved |
| currywurst-kiosk | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| passive-bin | Yes | Yes | Existing model-path swap | Existing footprint | None seen in viewer |
| notice-board | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| utility-box | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| queue-barrier | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| suitcase | Yes | Yes | Opt-in map prop | Decorative | None seen in viewer |
| bottle-cluster | Yes | Yes | Opt-in map prop | Decorative | None seen in viewer |
| snack-litter | Yes | Yes | Opt-in map prop | Decorative | None seen in viewer |
| planter | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| traffic-cone | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| bollard | Yes | Yes | Existing model-path swap | Existing footprint | None seen in viewer |
| garden-fence | Yes | Yes | Opt-in map prop | Solid | None seen in viewer |
| rubber-stamp | Yes | Yes | Opt-in map prop | Decorative | None seen in viewer |
| form-stack | Yes | Yes | Opt-in map prop | Decorative | None seen in viewer |

Browser checks: title screens and game entry in normal, `?propDetails=1`, `?satireKit=1` and combined modes loaded without page errors. Real desktop keyboard and emulated mobile touch moved the player about 104–109 world units; interaction input was delivered. Eight populated-area/station screenshots are in `output/playwright/world-*.png`; `world-clean-*.png` are the same live WebGL scene with HUD elements hidden for asset inspection. A later fault-injection run crashed headless Edge before a usable result, so optional module import and failed asset network paths remain browser-unverified; the existing CPU test covers candidate parse retry. Full route and train-clearance acceptance remains open.

Performance sample: headless Edge on Windows, 1280×800, default on-screen world after game entry, 120 animation frames: flag-off 642 draw calls, 682,572 visible triangles, 939 geometries, 35 textures; flag-on 737 calls, 740,198 triangles, 1,072 geometries, 35 textures. Frame callback means were 17.72 ms in both runs, which is refresh pacing rather than a GPU benchmark. At 390×844, flag-on had 316 calls, 520,288 triangles, 532 geometries and 18 textures. The deterministic Node encoder generated 45 GLBs (4,933,236 bytes) in 144 ms on this host; the browser builds these bytes in memory and fetches only three kit modules. `output/playwright/measure.json` preserves resource-transfer observations, which include unrelated game assets and cache effects.

Validation blocker: 65/66 focused CPU tests pass; the repository suite reports 108/116. The pre-existing fax study output computes SHA-256 `471ed731764adc95f3e893e0a5afa1a8f1d86014b5ad51d0005f254d88052d2c` while the unchanged preservation test expects `96840b52bc06b5cc2ca5e7e25036cf3b2c3dc5d8e303d445f2174daa41434dc1`. It failed at baseline before this pass. The other seven full-suite failures involve subtitle, sprite-candidate/pipeline and train contracts outside this pack. No hash or budget was changed to conceal the mismatch. Publication remains on hold until the study source/output provenance is reconciled and remaining live gates pass.
