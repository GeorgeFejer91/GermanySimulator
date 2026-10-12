# Asset and efficiency policy

## Decision

The office turning update adds no art, engine or independent frame loop. Its
existing owner presents active office frames at display cadence; city/title
deadlines, 20 Hz floor transport, bounded 60 Hz action-cloud generation, the
two-job asset queue and 1.6 MP drawing-buffer cap remain unchanged. Input and
view selection follow `BUERGERAMT.md`'s turning contract. A single extra walking
sheet may be retained across the whole office, requested only by an actual view
change: at most 34,078,720 decoded RGBA bytes on desktop, or 17,039,360 on compact
screens (the existing dense mobile sheets cost 8,519,680). GPU copies are additional.
No adjacent directions are prefetched. The renderer releases the spare on distant
retirement, close, replay and pagehide, and keeps atlas fallback on failure.
Both available dense walk families select their existing mobile export on a compact
client even at high DPR. Same-role material-map swaps retain their compiled program.
Frame distributions collected while other game tests share this host are diagnostic;
they cannot establish a causal speedup or physical Android performance.

The Bürgeramt potato mirror uses five shared geometries (186,540 attribute/index
bytes), six materials and 19 meshes / 8,932 triangles. Its 768 × 768 generated
potato-skin WebP is 178,578 bytes and serves both albedo and bump from one texture
(2.25 MiB base decoded RGBA, about 3 MiB with mipmaps). The shared office admission
queue loads it with required office art; it is not a root/title fetch. A failed
image leaves the same shaped, indented tuber and natural brown material.

The user's complete-room/persistent-self request replaces the old surrogate hall
with one live planar camera/target, driven by the existing render owner. The
existing room, effects and actor passes render from that camera; only the private
potato double composites after target depth. It never appears in the real room.
The secondary view uses existing painted actors for packed-cloud representations
and temporarily faces native paint to its camera; main packed rendering is
unchanged. This adds neither a second Gaussian batch nor competing GPU updates.
The target is lazy until visible glass, bounded to a 1024px long edge desktop or
640px on compact/coarse-pointer mobile, without supersampling. Half-float RGBA
plus depth costs at most 12 bytes/pixel (about 7.5 MiB at 1024×640, about 2.2 MiB at
296×640); the main drawing-buffer cap remains 1.6 MP. Capture is at most 60 Hz on
the existing render calls, with no separate RAF, worker or timer. Exact glass
frustum clipping prevents offscreen capture. Close, hidden-page reset and BFCache
retire its target; page retirement disposes all owned geometry/materials/skin.
Accepted displacement drives planted joints and the visible glass frames the
double without a distance cutoff. The selected player's 137,900-byte mirror MP3
loads only on E through the existing exact voice lookup. No extra model downloads,
speech engine, asset pipeline or voice registry ship.

The title's city loading set is captured once from its starting position and
camera. Camera easing during loading or after readiness must not expand that
set before Start; newly visible sources retain their existing geometry fallback.
Start releases normal distance/visibility admission through the same two-job
queue. `tests/asset-streaming.test.mjs` covers both pending and settled title
states, subsequent installation, and unchanged required-source readiness.

Use one asset authority at root `assets/`, with fidelity selected by the client. Desktop may use high-resolution period artwork where it is visibly valuable; mobile must prefer minimal vector or otherwise lightweight variants.

The Bürgeramt interior uses code-native geometry and signs through the existing Three.js renderer. Its near characters use original caricatured painted source strips under `assets/sprite-sources/buergeramt/`; `tools/build-amt-sprites.py` produces separate 64-frame, 24-fps desktop/mobile WebP atlases under `assets/buergeramt/characters/`. No Bürgeramt GLB is a runtime input. Generated source provenance and atlas hashes live beside the sources. The rejected towel-tourist preview GLBs remain preview-only and are not runtime inputs. The phone companion shares the root static site and adds no game media. The locally pinned QR generator under `assets/vendor/qrcode/` and VDO.Ninja SDK under `assets/vendor/vdoninja/1.5.5/` are runtime code with licenses beside them. ChatDev's clone, session reports, source recordings, Voice Cloner profiles, and trial renders stay outside `assets/` and the deployable game; only reviewed, licensed, normalized exact-text speech clips may enter the existing voice catalog and `assets/voices/`.

The eight moving office regulars have original four-view painted source sheets and four action poses each: work, gesture, look, and flinch. `tools/amt-character-motion.py` registers these under the same source directory and emits one 8-column, 8-row desktop WebP per character plus a half-resolution mobile WebP. The runtime loads only the selected variant on office entry. Continuous whole-silhouette warping keeps side-view shoes attached to their trousers; the segmented leg method exposed a detached foot on this source and was rejected. A separate 8-column, 6-row desk-performance atlas reuses Frau Knick's approved source strip and adds a small lower-lip cycle. Exact encoded frame hashes and contact sheets are local review evidence under `output/amt-character-motion/` and `output/buergeramt-sprite-qa/`. Neither Python nor a new animation dependency ships to the browser.

The same source sheets yield four-pose 640 × 832 action detail cells plus four directional eight-frame close walk sheets per moving regular, 384 × 832 detail poses for waiting patrons, and a compact shared detail sheet with six clerk poses and eight high-resolution lip frames. Moving detail is requested only on approach, one walk direction at a time, and released after the actor leaves; the compact desktop/mobile atlas remains the distance and load-failure fallback. Close walk sheets use a 4 × 2 grid so their maximum texture dimension is 2560 px. This preserves close brushwork without eight full high-resolution 64-frame atlases. The office-only shader gently varies per-character saturation and lightness without modifying the painted files; its renderer follows the shared one-pixel-per-CSS-pixel and 1.6 MP drawing-buffer budget in the browser playability gate below.

The Aktenkurier's omen approach and blackout alone may replace his sprite with the offline-authored
Gaussian volume in `assets/buergeramt/omen/`. The deterministic builder and source
hashes are documented beside the asset: 38,938 splats / 1,246,016 bytes, using the
accepted gesture and rear paintings. This is a bounded sculpture for small turns,
not a full human reconstruction. One local Spark 2.3.1 module (2,816,188 bytes,
MIT, including embedded WASM) shares Three.js r186 and is requested only for an
active office visit through the existing two-job admission queue. Splats install
in 2,048-record yielding chunks; no shared decode-worker pool is used. Packed
record data is 623,008 bytes. The procedural tunnel adds 3,072 records / 49,152
packed bytes without another download, bringing the shared renderer to 42,010
splats before mouth articulation. Allocation padding, GPU accumulator buffers, sorting and renderer
overhead are additional and must be measured in browser evidence.
The official recorded line adds 96 procedural mouth kernels / 1,536 packed bytes in the same body mesh (39,034 body and 42,106 body+tunnel records). A 2,131-byte JavaScript cue track contains 24 estimated viseme intervals and 238 energy samples; it is imported only with the existing office/omen module. Two small Vec2 uniforms are updated in the existing frame pass from native media time; there is no additional RAF, polling loop, renderer, audio decode or runtime recognizer. The portable Rhubarb authoring tool and temporary WAV remain outside shipped assets. The original body and approved MP3 bytes are unchanged. Silent real-playback browser comparison at 1280×800 measured baseline and articulated p50 14 ms / p95 21 ms game-sync dispatch, with Android portrait/landscape emulation also 14/21 ms; these short held-pose samples are not full mission or physical-device performance evidence. Mouth failure, pause, replay and end checks belong to `BUERGERAMT.md`.
The omen and bounded nearby painted action clouds share the effect owner.
Omen-only generation/sorting runs at most 30 Hz; active action clouds use at
most 60 Hz from the existing render pass and stop on hidden/inactive play. Teardown waits
for any owned sort before disposing buffers and its worker. A missing, cancelled
or late preparation preserves the sprite; ordinary city startup imports none of
the Spark runtime or Gaussian data. The omen asset has one shared desktop/mobile variant pending
evidence that another is needed. Runtime behavior belongs in `BUERGERAMT.md`. The 2026-10-09 staging adds no asset or renderer: one environment parent and a shared material darkening uniform isolate the courier, and the existing shared owner suppresses ordinary action clouds for the complete cinematic. A bounded office-only path search runs at the trigger and after a blocked return, with exact swept clearance and player yielding; normal rendering keeps its existing cadence and teardown.

Paired action packs under `assets/buergeramt/animation/` select one desktop or
mobile variant on approach; never fetch the full cast or both variants. Each
24-byte record stores two XY centers and two RGBA paint samples. The decoder
bounds records to 20,000 slots, 32 segment rows and the declared decoded size.
Three lookup textures cost 24 bytes per slot/segment in addition to CPU
records, Spark buffers, sorting and renderer overhead. Two desktop or one
mobile actor may reside, with the dialogue owner prioritized. Authoring images
and SciPy/Pillow tools stay outside runtime requests. Track compressed and
decoded costs in generated manifests; compare actual frame and input latency
against the same scene without the action renderer. Missing or late data keeps
the original sprite. `BUERGERAMT.md` owns timing, residency and state handoff.

The 2026-10-10 extension covers all fourteen office figures with twelve action
packs: the two extra clerks reuse Knick's pack, while renter, parent and
pensioner add four 384×832 native keys each. Their desktop compressed/decoded
records are respectively 200,673/387,072, 215,412/423,936 and 241,998/460,800 bytes;
mobile records are 78,363/165,888, 84,172/165,888 and 93,723/184,320 bytes.
Each decoded patron key costs 1,277,952 RGBA bytes; no more than three keys
(3,833,856 bytes before GPU copies) reside per admitted actor. Four-key transfer
totals are 1,083,160, 1,047,092 and 1,162,580 bytes, but the initial job requests
only the current pair, then a queued neighbor. These additions keep the shared
two-job queue, two-desktop/one-mobile actor caps and existing render cadence.
Do not request new authoring sheets or private voice references from the game.
Camera-negative candidates do not consume preparation; a fully off-camera
paused actor can retire for the visible speaker without a visible pose jump.
Registered original/generated source hashes and crop/scale provenance remain
beside the three source packs. Browser delivery hints add no speech download;
alternate Voice Cloner references remain private; UUID metadata identifies
the unlistened candidates.

The full-cast release compared three cold office runs per viewport against
`2b36be9`, using Chrome 154/Intel Iris Xe, local uncompressed HTTP, seed 424242,
DPR 2 requested and no CPU throttling. The naturally selected Konrad dialogue
was sampled for three seconds. Median active p95 frame time was 21.0 → 20.9 ms
on desktop and mobile emulation (after ranges 20.9–20.9 ms); frame cadence
stayed approximately 60 Hz. Median input p95 was 18.6 → 15.8 ms desktop
(after range 13.1–17.1) and 67.7 → 19.3 ms emulation (12.9–20.4). These short
lab samples do not establish a causal speedup or physical-device performance.
Desktop geometry count stayed 168, textures 43–44 and draw calls 117; mobile
stayed 161/41/88. Selected-action transfer was 3,980,014 → 3,284,494 bytes
desktop and 1,818,102 → 1,936,660 mobile, including other prepared office packs.
Cold office startup median/range was 28,531,765 / 25,299,076–30,137,390 bytes
desktop and 16,927,169 / 16,927,164–16,927,171 mobile. This direct-office
scenario loads office assets and is separate from the root title's 18 MB gate.
After ready/settled medians were 871/1,188 ms desktop and 832/1,205 ms mobile;
async readiness ranged widely, so do not claim a loading speedup. Both six-run
benchmark reports passed applicable input/error/drawing-buffer guards under
`output/amt-gaussian-arcs/full-cast-benchmark-{before,after}/`; Android is
emulated, GPU timing and physical-device p95 remain NOT RUN.
The separate six-run root benchmark also passed its 18 MB startup, deferred
resource, title cadence, input and drawing-buffer gates: desktop startup
15,696,445–16,448,172 bytes, mobile 15,027,020–16,098,517; title cadence
12 calls per measured three-second window. Evidence: `full-cast-root-benchmark/`.

The E-triggered fever pass uses one existing full-screen shader pass with twelve
analytic motifs and the existing Gaussian action owner. Four painted plane
corner projections protect the selected character; no new image/3D asset,
render loop, worker, synthesis dependency or splat pack is introduced. Structure
materials return to their original opacity/transparency/depth settings on
release. Native anchor painting receives the same shared isolation uniform;
existing 2/1 actor caps, admission queue and 1.6 MP buffer cap remain in force.
The user-approved alternate voice family adds 40 MP3s / 4,107,104 bytes under
`assets/voices/amt-fever/`, fetched only for an exact speaker/text cue in normal
gameplay. No clip is preloaded at office or city startup.
Its manifest/catalog carry actual hashes, alternate profiles, CC0 reference and
MIT model provenance, final-encoding levels/ASR and pending human listening.
The two semantic failures remain outside the shipped family. The original
approved Horst omen recording is unchanged. `VOICE-SYNTH-PROTOCOL.md` records
the explicit use approval separately from the unverified listening fields.

Peak-effect measurements used three cold runs per viewport against `e4ffe34`,
Chrome 154 / Intel Iris Xe, local uncompressed HTTP, seed 424242, requested DPR 2,
no CPU throttling. A silent held TTS start receipt kept Konrad's same dialogue
active; every after sample ended at fever strength 1. Median active p95 stayed
21.0 → 21.0 ms desktop and Android emulation (after range 20.9–21.0 ms).
Input p95 medians were 17.4 → 20.4 ms desktop and 17.4 → 21.0 ms emulation,
with an emulated 80.3 ms outlier; these short samples do not establish field
responsiveness or a speedup. Geometry/texture counts were 169/43–44 desktop
and 162/41 mobile after. The final overlay pass reports one draw call because
Three.js resets its per-render counters; it is not the complete office draw cost.
Reports: `output/amt-fever-interactions/peak-{before,after}/`. Initial samples
whose effect had finished are preliminary and excluded from peak evidence.
The six-run root benchmark passed the 18 MB/title-cadence/input/buffer gates.
The later `b3aafb3` upstream integration preserves the fever shader/window and
adds official omen-only lip-sync, outside these Konrad samples. Source-delta
peer addenda and fresh native-media/3d checks bind that integration separately.
The subsequent approved-default root smoke benchmark passed both viewports:
16,813,631 bytes desktop and 16,465,819 bytes emulation, with 13/12 title sync
calls in about three seconds and no page errors. Desktop input p95 had a
142.5 ms outlier, while emulation was 16.4 ms; these single runs do not establish
stable input latency. This is a two-run smoke check, not a new peak baseline.
Physical Android, GPU timers and perceptual listening remain NOT RUN.

The automatic in-scene interaction change retains those same rendering and
asset paths. It adds no assets or frame loop: the existing office update owns
speech/fade continuations, and the existing Pretext fitter measures caption
clearance below the visible audio/subtitle controls. Caption overflow uses the
same bounded DOM region. The earlier peak and root measurements above describe
their recorded candidates, not a new benchmark of this controller/UI change.

The 2026-10-10 foreground repair adds no art, splat pack, worker or render loop.
Native patches inherit their source layer/depth policy; one isolated speaker
owns the shared cloud's foreground policy. Bodies remain opaque during depth
morphs, and close restores original material layers synchronously.
Three cold contexts per viewport used Chrome 154 / Intel Iris Xe, local HTTP,
seed 91, requested DPR 2 and no CPU throttling. Ordinary-office median active
p95 was 20.9 ms desktop and 21.0 ms Android emulation (ranges 20.9–21.0/21.0);
geometry/texture counts were 168/42 and 145/32. Input p95 medians were 20.1 and
60.9 ms, with emulated range 20.4–71.5 ms, so no stable-latency improvement is
claimed. The controlled base `dbc37af0` office samples had 20.9 ms medians;
the final probe additionally waits for asset settlement before active sampling.
These condition differences and short samples do not establish a speedup.
The six root samples pass input/error, 18 MB transfer, deferred-resource,
4 Hz title and 1.6 MP buffer gates: maximum startup 16,470,981 bytes and
12–13 title calls per measured three-second window. Root active p95 medians
were 31.7/21.8 ms. All final samples accepted nine input events with no page
errors. Initial probes failed their input guard; those reports are retained.
Final probes explicitly wait for controller admission, settled office assets
and released welcome before active sampling.
Reports and exact metrics: ignored `output/character-morph/bench-summary.json`,
`bench-office-{controlled-before,settled-final}/` and `bench-root-admitted-final/`.
The separate three held omen samples measured 20.9–21.1 ms sync intervals.
Physical Android, GPU timing and perceptual listening remain NOT RUN.

The 2026-10-11 Aktenkurier intensity adjustment multiplies the existing upper-body
relief by up to 3.4 and its width by at most 1.12, with bounded broad cloth
displacement and directional shading in the same Dyno modifier. Mouth articulation
runs before that shared deformation. One float fits relief to the view's horizontal
field; it adds no samples, asset bytes, renderer, clock or admission work. The
flattened geometry and floor baseline remain registered. Independent Camera and
Physics reviews bind the integrated candidate to `output/omen-intense/candidate-v4.json`;
fresh source/CPU checks preserve the upstream mobile background-slot retirement.
Native MP3 mouth captures pass on desktop, portrait, landscape and reduced motion
for V2; the identical shader/camera paths retain those source hashes through V4.
A first V4 portrait probe passes framing and pause/exit assertions but its
approximately 1004 ms dispatch interval leaves consonant capture timing unproved.
The final V4 portrait probe waits for two completed owner updates and a rendered
dispatch at each paused native cue. All phonetic captures and assertions pass;
72 dispatch intervals have p50/p95 15.2/23.4 ms. The earlier V2 p95 samples were
21.5–22.5 ms. These variable host conditions do not establish a performance
improvement. V3 full-body ending and splat-failure captures
pass opaque flattening, staged painted turn, restoration and cleanup. Exact GPU
shader readback checks 38,938 body points across 20 reveal/pulse states; all centers
are finite, with unchanged Y/sole baseline and exact flattened centers. This is
bounded deformation evidence, not GPU timing or a natural mission traversal.
The V4 six-context root check passes unchanged 18 MB, deferred-resource, actual
4 Hz title, 1.6 MP, error and brief-input guards, with nine inputs accepted in
every run and maximum startup 16,761,047 bytes. The diagnostic probe explicitly
waits for five title dispatches with four 200–350 ms intervals before warm sampling;
the added settle delays are reported (1.06–1.28 s), not subtracted from readiness.
Desktop asset readiness ranges 6.79–33.13 s; portrait emulation 2.56–2.98 s.
Desktop active p95 median is 41.8 ms (39.9–1290.1), input p95 median 50.4 ms
(48.8–1582.7); portrait medians are 33.3 ms (28.0–36.3) and 39.0 ms (34.6–49.4).
The outliers and preserved early-input failures preclude a stable-latency claim.
This probe changes only ignored test admission/warm-up, retaining the original
400/45 ms key windows and ceilings. It omits root screenshots; the separate V3
direct `3d.html` smoke supplies shared-city render evidence. Reports:
`output/omen-intense/root-settled-final/`,
`root-short-final/`, `native-final-fit-2/`, `native-integrated/`,
`native-rendered-integrated/`, `ending-fit/` and
`deformation-v2.json`. The current Pages test selection passes 230/230 and the
Pillow delivery check preserves all six city atlases' exact RGBA pixels.
Final V5 integration preserves upstream `839c43a`'s Merz dialogue/catalog/assets;
five V4 frozen runtime/test hashes remain exact, and the root HTML differs only
by its two upstream dialogue cache tokens. The root selection passes again
(43/43), plus 19/19 Merz/official-omen/lipsync/splat checks; the unchanged office
selection retains its V4 result. `candidate-v5.json` and `root-v5.txt`/`audio-v5.txt`
record this source continuity without relabeling the rendered V2/V3/V4 evidence.
Physical Android, GPU timing and perceptual listening remain NOT RUN.

The subsequent room-depth follow-up renders every Bürgeramt person in a final
actor pass after the room and visual effects. It reuses the room depth buffer,
existing renderer, source paint and shared Spark owner. No asset, dependency,
framebuffer, worker or frame clock is added. Keep depth testing enabled for
paint and splats and preserve camera-depth sorting between people. City
rendering and its resource ownership are unchanged.

Three cold office runs per viewport compare this pass with `1e0a657`, using
Chrome 154 / Intel Iris Xe D3D11, local uncompressed HTTP, seed 91, requested
DPR 2 and no CPU throttling. The source override includes both Gaussian imports;
the shipped assets are identical. Median active sync-interval p95 is 21.5 →
21.5 ms desktop and 21.1 → 21.5 ms Android portrait emulation (after ranges
21.5–21.6 / 21.4–21.7). All nine inputs were accepted per run, with no page
errors. Input p95 medians are 18.6 → 14.7 ms desktop and 26.5 → 17.5 ms
emulation, with after ranges 13.5–20.1 / 14.1–20.6. Geometry/texture counts
remain 168/42 and 145/32. Cold office transfer medians are 30.26 / 17.05 MB;
the office scenario is separate from the root title's 18 MB guard.
These short samples establish no causal speedup or physical-device result.
`renderer.info` reports only the final pass, so before/after draw calls are
not whole-scene comparisons. Evidence is under ignored
`output/office-top-layer/bench-{before-clear,after-clear}/` and `bench-summary.json`.

The separate six-run root report passes input/error, 18 MB startup, deferred
resource, title cadence and 1.6 MP buffer guards. Startup transfer ranges are
13,878,060–16,404,876 bytes desktop and 14,929,503–16,490,324 emulation. Its
active timing is variable: frame p95 medians 48.2 / 36.8 ms, with ranges
46.1–235.0 / 31.7–463.4. Another Chrome visual test was observed at completion;
these root timings are diagnostic, not a controlled performance comparison.
The earlier overlapping/low-memory baseline and candidate failures, including
missing p95 and pose-response timeouts, remain under `bench-*/`; they are not
acceptance evidence. The corrected probe waits for controller admission and
the existing asset queue, emulates focus only in its isolated headless document,
and rejects missing p95 while preserving the eight-response input gate.
Shipping Node selections and exact city delivery checks pass; rendered
functional coverage is recorded in `BUERGERAMT.md`. Physical Android and GPU
timing remain NOT RUN.

The later `839c43a` city-dialogue integration adds Merz recordings/catalog
entries and game/audio cache tags. The three office renderer files and office
paint assets remain byte-identical to the measured candidate at `72c15c6`;
office comparison and rendered evidence carry under the source review addenda.
At that integration, the release checks passed 230 tests. A fresh single cold root
cache/guard smoke per viewport also passes, with 16,838,504 / 16,490,745 startup
bytes and nine accepted inputs each. Evidence is under `bench-root-integration/`.
Those two runs check integration and release guards; they are not a repeated
performance comparison and retain the same timing/device limitations.

The final room-depth candidate, including the owner-lifetime body-depth sorter,
is compared against `bc647de` with three cold office runs per viewport. The
baseline/candidate executed probe hashes are identical (`23a5c265…`); Chrome,
hardware GPU, seed, DPR, network and CPU settings match the earlier comparison.
Median active sync-interval p95 is 21.7 → 21.4 ms desktop and 21.3 → 21.4 ms
portrait emulation (candidate ranges 21.4–21.8 / 21.2–21.6). Input p95 medians
are 21.3 → 21.0 / 19.6 → 20.1 ms, with candidate ranges 15.4–21.2 /
17.5–75.2. Each run accepts nine inputs with no page errors; geometry/texture
counts stay 168/42 and 145/32. Candidate cold office transfer medians are
30,264,344 / 17,054,104 bytes. No shipped asset changes relative to that base.
These short shared-desktop samples establish no causal speedup or GPU-time claim.
Evidence is under `bench-{before-relief-stable-v2,after-relief-final}/` and
`bench-summary-final.json` in `output/office-top-layer/`.

The initial new baseline mobile input timeout and a subsequent recursive
test-wrapper error are retained separately, rather than treated as candidate
performance. The corrected fixture requires one continuous second of controller
admission before measuring; the two-second per-key response bound and
eight-response minimum are preserved. The final six-run root report also
passes download, title-cadence, input, error and drawing-buffer guards. Startup
transfer ranges are 16,130,518–16,816,721 bytes desktop and
14,255,824–16,480,251 emulation. Root sync p95 is variable: median 78.4 / 48.1 ms,
ranges 64.8–93.9 / 47.5–97.7. These are diagnostic root timings, not a controlled
city-performance comparison. Evidence is under `bench-root-relief-final/`;
release checks pass 232 tests (231 shipping-workflow tests and the additional
Merz voice regression), including the new near/far/tunnel ordering case.
Physical Android, displayed-frame/GPU timing and perceptual listening
remain NOT RUN.

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
- The user-approved Aktenkurier omen adds one local 77,612-byte MP3 under `assets/voices/horst-stempelmann/`. It loads only when that exact speaker/text cue starts; mono 24 kHz decoded float audio is approximately 0.44 MiB. Native `timeupdate` advances eight stored word cues during playback, with no idle polling. The existing visit/cue owner pauses hidden playback and releases source/listeners/watchdogs on cancellation or failure. Voice-off requests no clip. Reference audio, models and the other two private auditions remain outside shipped assets; provenance and the scoped human approval are in `assets/voices/LICENSES.md` and `VOICE-SYNTH-PROTOCOL.md`.
- Keep Merkel's user-supplied Neuland excerpt under `assets/voices/merkel/`, mapped only to its exact displayed quotation and documented in `CREDITS.md` plus `assets/voices/LICENSES.md`. It follows the same foreground normalization and proximity-broker rules as her existing “Wir schaffen das” excerpt; do not imply external redistribution rights.
- Keep the 13 generated §-power readings under `assets/voices/laws/`, indexed directly to their fixed deck with exact displayed quotations and documented German browser fallback. Their CC0 references, local XTTS-v2 generation method, durations and checksums remain in `assets/voices/LICENSES.md`. The eleven former anonymous rotating-rule recordings are archived; the dedicated nearby advisers own the stable rule IDs, exact body/subtitle and fixed-profile recording or caption fallback described below. Cloning models remain offline authoring tools.
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

The omen turn adds one approach-only Aktenkurier texture, selected as desktop
or low-DPR mobile, never both. The 1440 × 1872 desktop sheet transfers 480,988
bytes and decodes to 10,782,720 RGBA bytes; the 720 × 936 mobile sheet transfers
147,658 bytes and decodes to 2,695,680 bytes. Neither has mipmaps. The existing
two-job admission queue owns loading; existing simulation/render dispatch owns
playback and UV changes. No idle consumer or additional timer is introduced.
The actor releases the texture at encounter completion, replay, or office close;
late loads cannot install into a disposed texture. Source PNGs and the manifest
are authoring material and are never requested at runtime. The manifest and
`tools/build-aktenkurier-turn.py --check` own hashes, dimensions and exact bytes.

Turn acceptance covers every encoded desktop/mobile cell, seven silent browser
cases (including reduced motion and missing art), and independent movement and
rendered depth reviews. Three cold office runs per viewport compare `0447bea`
with the animation candidate on Chrome 148 / Intel Iris Xe, local HTTP, DPR 2,
and headless focus emulation. All runs accept nine inputs without page errors.
Median active sync-interval p95 is 21.2 → 27.0 ms desktop and 24.2 → 21.1 ms
portrait emulation; desktop ranges overlap (21.2–26.9 / 21.7–27.5 ms). Shared
desktop scheduling and differing asset completion limit this comparison; it
establishes no causal speedup or physical-device result. Evidence is under
`output/aktenkurier-turn/focus-{baseline,candidate}/`. Earlier incomplete and
background-throttled samples are retained separately and are not acceptance
evidence. Physical Android and GPU/displayed-frame timing remain NOT RUN.

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

The first city Bürgeramt entry uses `buergeramt-entry.js` and the existing WebGL
renderer. One on-demand GPU color/depth capture has a longest edge of at most
960 px on desktop or 640 px on compact screens (at most 7.04 MiB for its two
four-byte surfaces). One instanced Gaussian draw samples about 18,000 city pixels
on desktop or 7,000 on compact screens; grid rounding is bounded below 18,500
instances on supported portrait/landscape profiles. A second draw dissolves
the frozen image and marks the door's vortex. This is a depth-assisted visible
surface effect, not a reconstructed splat asset. No CPU pixel readback, extra
renderer, Spark import, downloaded art, worker or independent animation loop
is needed. Capture occurs at committed entry; drawing lasts at most 3.4 seconds
of active frame time. Reduced motion allocates only the color surface and uses
one draw for a 0.24-second fade. Hidden pages stop its clock; completion/pagehide
release both textures, materials and geometry. Module/render failure keeps
direct entry. The existing office readiness gate runs before the transition.

The mission-fax HUD transition uses native Canvas 2D Gaussian alpha kernels as a
CSS mask over the actual DOM paper. One reusable 192 × 256 mask and 32 × 32 kernel
occupy about 0.192 MiB of raw RGBA surfaces; 432 splats are composited at no more
than 30 Hz for each 1.08-second feed. Only the current encoded mask is retained.
No additional asset transfer, WebGL context, Spark module or idle effect loop is
allowed. HUD lifecycle cancellation owns the RAF, short fallback timer and fax
sound sources; pagehide releases the two canvases. Keep Pretext measurement out
of these animation frames. This screen-space HUD work changes no world geometry,
collision, movement, camera or sprite scale, so its scope omits the two world
object reviewers; rendered HUD and independent timing/lifecycle review apply.

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

The office checkerboard uses the existing floor mesh and lit material. Its
painted grout replaces the former individual grout boxes. `buergeramt-floor.js`
adds no image, video, runtime package or extra WebGL context. When visible
inside-room progression begins it allocates two 256 × 320 desktop or
128 × 160 compact-screen pigment targets. RGBA32F requires renderable float and
linear float sampling; unsupported devices use bounded procedural flow and
foot ripples without feedback targets. RGBA32F uses sixteen bytes per texel for mixed RGB and portrait paint
coverage:
the pair totals 2,621,440 bytes
(2.5 MiB) on desktop or 655,360 bytes (0.625 MiB) on compact screens, without
depth/stencil or mipmaps. Half-float was rejected after actual GPU tests showed
white disappearing during repeated tiny transport steps.

Transport runs through the existing render owner at at most 20 Hz of scaled
scene time, at most two tiny
offscreen passes per frame, with bounded elapsed time and no hidden catch-up.
Three smaller eddy scales fold the persistent field; screen-filtered concentration
contours supply finer nested black-and-white layers without larger textures or
additional passes. The float-free fallback uses bounded successive shears and
the same contour reconstruction, with a still version for reduced motion.
There is no idle timer, download, CPU pixel readback or per-frame shader compile.
The visible floor retains ordinary depth and the room's existing fade hooks.
Analytic ceiling-strip highlights need no reflective scene capture. Close,
replay, reduced motion, context loss and pagehide release the owned targets,
pass material and geometry; a failed render keeps a static spatial melting
approximation, preserving the shared goop/speed mapping. Ripple uniforms are
bounded to eight desktop or four compact-screen events; the existing controller
supplies accepted-walk distance and reposition generations, with no polling or
extra animation loop.
The portrait adds one cached 24-triangle curved drip sheet and two composed material
hooks, sharing the existing portrait texture; no extra feedback pass or target.
Its viscous channels advect native paint and rounded bulges on the shared scene
clock, with one constant-cost analytic channel lookup per sample.
Its static 26-vertex bend settles onto the real wall, without per-frame vertex
updates or a new collider. Ground source position matches the bent sheet.
Actual color deposition begins only when a visible paint thread reaches the
floor. The floor keeps its 20 Hz scaled-time ceiling and two-pass frame limit.
GPU readback exists only in the test server's injected measurement seam.
Lamp exhaustion reuses the five ceiling-strip meshes with independent cached
materials and shared floor-reflection strengths. One cached two-triangle black
illumination pass dims the complete room after actor composition; it adds no
render target, light, shadow, texture, download, timer or animation loop. Wear
samples the existing visible residence clock; flicker samples its integrated
scene clock. Hidden/closed work stops and replay restores all five. Reduced
motion retains wear without flicker. Resource ownership stays with the cached
office renderer; its compositor restores `autoClear` even after a render error.

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

- Show the dedicated `preload` screen before the main menu. Its existing
  readiness gate counts prepared starting-neighborhood jobs and decoded menu
  images; the flag-colored progress is monotonic and reaches 100 only at
  readiness. Keep `#app` hidden/inert until then, including keyboard Start.
  The direct office route counts its required office jobs instead. Missing
  individual assets settle to existing fallbacks; fatal engine failures expose
  a reload action. The pinned Three.js r186 engine/GLTF dependencies are shipped
  locally under `assets/vendor/three/0.186.0/`; external decorative fonts must
  not block startup. Distant/optional assets remain approach-only.
- Once the player starts the first city level, prepare the required Bürgeramt
  room/atlas/prop assets quietly through that same queue, behind ordinary city
  loads and foreground speech. Preserve the two-job limit, hidden-tab pause,
  cached one-time preparation and office entry readiness/fallback gate. Close
  character details, speech and cinematics retain their existing demand triggers.
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

Run the dependency-free Node command in the existing [Pages workflow](../.github/workflows/pages.yml),
then the Pillow delivery check above. Keep that release step as the executable
source of truth for the current regression selection. These gates protect
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

Title cadence uses the browser's measured sample duration, not the requested
host wait. Allow only a phase-boundary call and the existing 0.5 ms deadline
tolerance at 250 ms intervals. Preserve elapsed time in the report so delayed
receipts cannot masquerade as excess rendering; a genuine 17-call three-second
sample still fails. `tests/browser-benchmark.test.mjs` covers this distinction.

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

### Maintaining browser playability

Apply this procedure to the behavior a change can affect. Keep numeric budgets
in the contracts above and dated results in `docs/` or ignored `output/`.
Documentation-only changes need link and policy-consistency checks; runtime,
asset and UI changes need their applicable executable and browser checks.

1. **Define the affected path before editing.** Name the scene, user action,
   readiness/fallback state and supported browser profile. Consider transfer,
   decode/install work, resident resources, frame work, DOM/text fitting and
   input together. Use the existing harness and the matching `SKILLS.md` route.
   Profile a reproduced cost and fix its owner; preserve accepted appearance,
   gameplay, accessibility and audio timing while reducing unnecessary work.
2. **Keep comparisons controlled.** Bind the baseline and candidate to their
   source, tests and relevant asset revisions. Use isolated checkouts when assets
   or unoverridden dependencies differ; a source override alone is not a complete
   historical build. Hold scene, viewport/DPR, GPU,
   cache, throttling, seeds and instrumentation constant; run performance
   samples sequentially so competing benchmarks do not consume the same GPU.
   Use the repeated-run median/range above. Changed conditions, intervening
   features or one favorable sample do not establish a causal speedup.
3. **Check the measurement itself.** Use the browser clock for the actual
   observation window. State whether a result measures sync-start intervals,
   application response, displayed frames or GPU time. Preserve failed samples,
   errors and incomplete reports. Fix a faulty probe separately from a runtime
   optimization; missing timing or device evidence stays uncertified. Keep the
   existing ceilings and phase tolerance unless a documented product decision
   with comparable evidence justifies changing them.
4. **Exercise real controls and changing layouts.** Exercise keyboard input and
   visible pointer/touch controls on desktop and Android portrait/landscape. Include
   both sides of affected width breakpoints, coarse-pointer layouts, enlarged
   text and long localized labels. Check loading/disabled/failure states,
   interaction hints, dialogue open/close, subtitle clearance and focus.
   Follow the text-fitting contract in `SKILLS.md`; measurements run when copy,
   fonts or bounds change, with readable reflow/fallback, rather than per frame.
5. **Test lifetime and recovery where affected.** Cover rapid approach,
   asset failure, repeated warmed scene entry/exit and background/resume. Confirm
   bounded queues/caches, shared resources, late-completion cleanup, released
   held input and no hidden-tab catch-up. Preserve the explicit committed
   audio/phone exceptions above. Use the [silent session policy](./AGENT-START.md#silent-background-browser-tests).
6. **Make regressions prove the intended behavior.** Use production rules and
   actual authored geometry where applicable. Assert the fixture's preconditions:
   a visible element must have positive area before its clearance can pass,
   and a traversal must actually enter the tested surface. Include successful
   and rejected/recovery paths. Inspect rendered captures for readability and
   occlusion; fitting rectangles alone do not prove a cue can be seen.
   Record scene relocation, removed actors, signal
   resets or debug hooks; scripted coverage does not prove natural progression.
   Leave the smallest useful deterministic regression in the existing tests and
   add fast release-relevant checks to the existing Pages step.
7. **Accept the final integrated candidate.** Freeze the affected source/test/
   asset hashes and bind captures and reports to that freeze. Distinguish fresh
   reviewer checks from supplied evidence, and emulation from physical devices.
   Follow the world-review gates when applicable. If integration or concurrent
   work changes the candidate, refresh the freeze and rerun affected checks;
   retain old evidence under its original revision. Required failures and
   uncovered checks remain outstanding. Follow `AGENT-START.md` for publication
   and verify the deployed root and `3d.html` after a deployment change.

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

### Simulation work reuse (2026-10-12)

The city retains exact collision and train rules while avoiding repeated work.
Authored prop footprints are prepared once. Fixed props, norm objects and trees
use one 256-simulation-unit grid, padded by each footprint plus 145 units and
contact epsilon. Queries with larger bodies retain the exhaustive scan; moving
people, cars and trains always use live positions and exact narrow-phase checks.
Station activation stays a live query condition. Static positions/dimensions are
immutable during play; any future relocation must invalidate/rebuild the grid.
The cache belongs to the city page, has no timer, and rebuilds for replacement
scenery arrays or changed record count. Traffic gap scans avoid temporary
per-obstacle objects. Train-to-obstacle projections are shared once per rail loop
within each substep, then discarded so the next substep sees moving obstacles.
No asset, dependency, renderer, quality reduction or extra simulation clock is
introduced. The existing physics, vehicle/lifecycle, traffic and train checks
now run in the Pages release gate.

Five alternating warmed Node pairs each execute 11,900 identical static-contact
queries on the seeded authored city (133 NPCs, 77 props and 28 trees). Every pair
returns the same 4,340 blocked-query checksum; the median paired time ratio is
3.92 times faster for this CPU function workload. This is a VM/function benchmark,
not a rendered FPS or input-latency measurement. The exhaustive-contact oracle
and 1,200 seeded bucket-edge/recovery cases accompany the production regressions.

Three cold Chromium 154.0.8037.99 / Intel Iris Xe contexts per viewport use
local uncompressed HTTP, DPR 2, seed 4781 and no CPU throttle against e0e6668.
All twelve before/after contexts record nine input-response samples without page errors
and pass unchanged title, startup/deferred-resource and draw-buffer guards.
Active sync-interval p95 medians are 277.1 → 605.1 ms desktop (ranges 149.8–541.5
and 172.6–834.2) and 187.1 → 104.5 ms portrait emulation (85.0–545.8 and
84.7–105.3). Input p95 medians are 724.9 → 546.0 and 178.1 → 129.9 ms.
The shared Windows host and concurrent validation make these timings highly
variable; desktop gets worse in these samples. They establish no stable frame
rate or causal whole-game speedup. Candidate startup transfers are 14.36–16.73 MB.
The earlier diagnostic/first-pass profiles and all final samples remain retained
under output/smoothness; no guard was relaxed. The 307 release tests, voice curation
and six exact-RGBA asset-delivery checks pass. Physical Android, displayed-frame
GPU timing and the natural mission chain remain NOT RUN.

A final sequential hardware guard pair, after this chat's long CPU checks finish,
records active p50/p95 of 129.6/183.0 → 61.6/98.7 ms desktop and
107.2/192.5 → 47.0/103.6 ms portrait emulation. Input p95 is
214.9 → 137.4 ms and 1297.8 → 134.6 ms. All four contexts pass unchanged
guards with nine response samples and no page errors. These single samples
supplement the variable repeated comparison, not a stable-FPS certification.
Both independent reviewers pass scoped source/CPU preservation and supplied
browser sanity. The matching 32-check object fixture passes desktop and Android
portrait/landscape emulation, including loaded/fallback and root/direct views.
It uses diagnostic placements and title-paused simulation near 2 Hz; full timed
world lifecycle/recovery sequences remain unrun. Exact reports and original
profiles are retained under output/smoothness in the performance worktree.

## Local 3D buildings

The Bürgeramt entrance radiance is original runtime geometry: one retained door
plane, one 5 × 5 ray/halo shader plane, and one short-range shadow-free point
light. It follows both the authored municipal GLB glass entrance and procedural
door dimensions, uses normal depth testing, and is excluded from obstruction
tests as decoration. It adds no downloads, textures, postprocessing, timer or
asset queue jobs. The existing render dispatch advances a bounded visible-city
clock; hidden/off-camera doors stop work and lighting, pause freezes animation,
and reduced motion is steady gold. Resources live with the existing city scene.

The mission Weißwurst uses one original, texture-free GLB under
`assets/models/mission-sausage/`, built by the existing standard-library Python
builder with adjacent provenance. It adds 89,740 transferred bytes, 4,928 triangles
and one material; it replaces the former licensed grilled model and its three maps. The starting
neighborhood queue prepares it before Start through the existing two-job
admission owner. A pale, plump procedural sausage retains the same compass behavior
on failure. The existing render dispatch updates its bearing without a new
timer, collision object, service or asset variant. The shared
source/instance lives with the city renderer; office/hidden states consume no
pointer updates. Pale glossy casing, sparse shader herb flecks, rounded meat,
pinched necks and six-fold twisted wrapper fans give the model a juicy Weißwurst
appearance with only a gentle bend. The fallback shares this casing profile.
It is a fixed screen-space HUD object rendered after the city with the same
WebGL renderer and a small orthographic view. Its body scales 1.6 across and
0.84 along the source, making it moderately longer while remaining plump.
The body is offset by 0.3528 along Z so rotation pivots at source Z −0.42,
about 26% from the non-glowing end; its centre genuinely orbits that fixed anchor.
A 64 px radial sprite (16 KiB decoded RGBA) and cloned tip
materials provide the red glow; the mustard cone is removed. The HUD reserves
256 px on desktop or up to 192 px on compact layouts for the full pivot sweep.
A 1024 × 256 canvas
(1 MiB decoded RGBA, one shared texture) prints black-red-gold UnifrakturCook
“Wegweiser” directly onto the skin in the existing material shader. A wider print
area, 176 px authoring type and dark outline improve the displayed lettering's size and contrast.
The pinned Pretext measures its exact loaded canvas font before painting;
local PlacardGrenze remains the named font fallback. No text overlay floats
above the sausage.
The current city camera projects its mission bearing into screen XY. Layout
updates through resize/DOM observers and the existing coalesced HUD refresh;
its unchanged model job uses the player's location for admission. No collision,
extra WebGL canvas, asset variant or new animation loop is added. The measured DOM reservation hides with its pointer during title, dialogue,
file and office states; it has no visible text.
The existing coalesced HUD measurement marks a no-fit below 160 CSS px of free
height between header and lower controls. The HUD mesh then hides while the
mission remains in Akte, and returns after resize without another loop.
The Weißwurst comparison used three cold contexts per viewport against `0447bea`,
including the old model bytes and HUD source in the baseline. Chrome 154 / Intel
Iris Xe hardware, local uncompressed HTTP, DPR 2 and seed 4781 were shared, with
no CPU throttle. Active dispatch p95 medians were 68.1 → 53.4 ms desktop
(ranges 47.6–84.3 / 37.0–53.5) and 37.8 → 50.0 ms portrait emulation
(28.6–41.4 / 37.1–52.0). Both six-run guard checks passed with nine accepted
inputs and no page errors. Timings, loading and movement endpoints varied;
these samples do not establish a causal speedup. Reports remain under
`output/wegweiser/weisswurst-{before,after}/`.

After integrating `008b017`, all six final hardware runs passed the existing
startup/deferred-resource/title/input/buffer guards: 13.39–16.32 MB desktop and
15.28–16.08 MB emulation, nine accepted inputs each, and no page errors. Active
p95 medians were 38.7 / 43.2 ms (ranges 37.8–44.9 / 41.1–52.6); input p95
medians were 595.7 / 68.4 ms, with a 1564.7 ms mobile outlier. The attempted
`008b017` baseline stopped on seven accepted inputs, so it cannot support a
new comparison. That failed report is preserved beside the final candidate
report in `weisswurst-integrated-{before,after}/`. No guard was relaxed.
The source-identical rendered matrix covers twelve desktop/Android-emulated
layouts, loaded/fallback bearings, real movement and enlarged-text Akte/restore.
One initial narrow resize timed out despite matching captured bounds; a single
instrumented rerun passed without a source or timeout change. Consolidated
evidence and that limitation are in `weisswurst-integrated-verified/report.json`.
Physical Android, GPU timing and the full natural mission chain remain NOT RUN.

The folded-casing and tail-pivot revision is bound to GLB `b9b375ec…` and
renderer `d115cf3e…` at base `933e069`. Twelve source-identical Chromium cases
pass movement, mission bearing, complete bounds and HUD clearance, including
loaded/fallback cardinal bearings, portrait/landscape, both compact breakpoints,
320 px enlarged text with Akte/restore, zoom, reduced motion and `3d.html`.
Independent Physics and Camera reviews pass the affected scope. The matrix is
consolidated from separate runs; its initial startup and wall-time failures are
retained. Modal/resize checks now arm before the native event and require the
condition within three browser frames, recording wall time with a 30 s stall
watchdog. This is a functional frame contract, not a wall-time latency bound;
three-second movement and startup deadlines remain unchanged. Evidence is in
`output/wegweiser/casing-validated/` and its referenced source reports/freezes.

The repeated hardware comparison against `933e069` uses Chrome 154 / Intel
Iris Xe, cold local HTTP, DPR 2, seed 4781 and no CPU throttle. Six completed
candidate contexts pass the unchanged startup/deferred/title/input/buffer guards
with nine inputs and no page errors each; the last portrait context runs separately
with read-only visibility/focus/fullscreen diagnostics. Earlier readiness timeout
and five-input failure reports remain included. Active sync p95 medians are
260.6 → 1031.2 ms desktop and 185.1 → 1041.1 ms emulation; candidate ranges are
476.3–1046.6 / 361.4–1049.9 ms. Input p95 medians are 180.5 → 1023.3 /
189.1 → 2664.4 ms. These poor, variable timings on a shared Windows host do not
certify stable responsiveness or a causal change. A fresh diagnostic baseline
and candidate portrait accepted nine inputs, but neither overrides the retained
failures or establishes a speedup. Candidate boot transfers range 14.74–16.32 MB
desktop and 14.01–15.79 MB emulation. Exact results and instrumentation are in
`casing-performance-{before,completed}/` and `casing-performance-summary.jsonl`.
Physical Android, displayed-frame/GPU timing and a natural mission traversal
remain NOT RUN.

Publication integration at `db6c73c` retains origin `b5d2c3a`'s office-mouth
changes. The full renderer hash is now `cc9ca8e9…`; its complete mission-pointer
block is byte-identical to the reviewed candidate, with the same GLB and HUD.
The final frozen candidate passes 280 release tests, voice-library curation,
six exact-RGBA delivery checks, fresh root/`3d.html` movement and clearance,
and one cold hardware guard context per desktop/Android-emulated viewport.
Each guard accepts nine inputs with no page errors. Independent Physics and
Camera reviews pass the final affected scope. These two single guard contexts
supplement the repeated comparison above; they do not certify stable timing or
physical-device performance. The final browser stages were resumed after a
runner dependency-path error before any page opened; production source remained
unchanged. Local evidence is in `output/wegweiser/casing-final-*` and
`casing-candidate-final-merged.json`.

- Root `assets/models/` is the only authority for shipped model files.
- The root game has one required WebGL presentation path. Do not preload or restore the retired SVG/Canvas world-art set. Registered moving-character PNG atlases remain the deliberate bitmap exception; DOM UI art and billboard textures are not alternate world renderers.
- Trees are canonical world data in `game.js`, not renderer-local decoration. Apply the rail-gutter city offset exactly once, keep each trunk center at least 48 world units outside every road rectangle, expose the same placement to `world3d.js` and `3d.html`, and keep trees solid to ground movement.
- Ordinary civic buildings and small shops use the four original Blender-authored building families in `assets/models/city-kit/`. The same kit owns the original Pfand machines/bottles, coffee and fax kiosks, gnomes, trees, sheds, lamps, and street furniture. `manifest.json` records bounds, geometry counts, sizes, and hashes; `city-kit.blend` and `tools/build-city-assets.py` are offline authoring sources. The earlier Kenney Commercial files are retained with their CC0 provenance but are no longer requested by the renderer.
- Eleven additional texture-free Blender models under `assets/models/german-props/` add two towel-reserved loungers, two gnome variants, neighboring sandal/sock storefronts, a Germany-side Krügers Kugellager takeaway shop with an original bearing emblem, a returnable-bottle crate, wheelbarrow, recycling containers, and a picnic table. Their adjacent `PROVENANCE.md`, manifest, editable `.blend`, and Blender builder own source and size records. `game.js` owns shop footprints and prop collision positions; the renderer loads the shared GLBs on desktop and mobile with existing procedural stand-ins for missing files. The online CC0 building alternatives considered for this set are linked in that provenance record; none were imported.
- The southeast Berlin parcel uses the original Blender-authored `assets/models/bundestag/bundestag.glb` landmark: layered sandstone masonry, six-column west portico, four towers, and a ribbed glass dome with interior cone/ramps. Fit it uniformly onto its major parcel's stone apron so its proportions survive; retain its +Z entrance, ground-centered pivot, adjacent editable source, reference provenance, checksum, and procedural-building fallback. The enlarged canonical parcel is `x:7680, y:3320, w:1200, h:876`, with entrance approach `8280,4226`; both root and direct diagnostic use this shared layout. Its fitted model is approximately `24 × 8.22 × 17.52` rendered world units, about 2.09 times the former uniform scale, and exceeds the approximately 7.95-unit ordinary Rathaus height. This is a compressed city/caricature reference, not literal architectural metres. Review actual displayed people/car/door/building ratios, full collision clearance, entrance access, nearby furniture and the relocated monument against [`OBJECT-CONSISTENCY.md`](./OBJECT-CONSISTENCY.md); a bigger parcel alone does not establish a larger rendered landmark. Its texture-free GLB has a 2.5 MB / 70,000-triangle budget and uses decoder-free `KHR_mesh_quantization`.
- City models share source load promises and mesh geometry. Preserve their restrained authored stone/brick/metal colors. Clone building materials per instance for camera occlusion, multiplying authored opacity by an elapsed-time smooth fade and restoring authored opacity/transparency/depth-write state. Only actual visible opaque mesh obstruction from camera to player body triggers fading; contact/proximity, a footprint alone, clear gaps, roofs below all player-body sightlines and native transparent glass do not. Loaded models and procedural fallbacks obey the same rule and remain collision-solid. Character atlas alpha/depth must preserve correct front/behind building order. Small props fit uniformly; ordinary building families adapt to the established solid parcels. Desktop and mobile use the same bounded GLBs and never request `.blend` files or previews. Require the independent Physics and Camera/scale reviewers and rendered evidence in [`OBJECT-CONSISTENCY.md`](./OBJECT-CONSISTENCY.md) for world-affecting changes.
- Roads, crossings, pavements, kerbs, drain grilles, and garden railings remain code-native geometry derived from existing world data. Two small deterministic canvas textures supply asphalt and paving; repeated kerbs/markings/drains/railings use instancing. Leave openings at crossings and garden entrances. Lamp placement derives from already-offset roads. Added street furniture belongs to `game.js` props and uses its existing collision rule; keep doors and narrow legal routes clear.
- The Kiesinger monument uses the photo-referenced Blender-authored `assets/models/kiesinger/kiesinger-statue.glb` figure (under 4 MB and 85,000 triangles, four marble materials, no textures) on its existing procedural pedestal. The editable `.blend`, deterministic Blender script, fitted portrait landmarks, source-photo provenance, and model-bound checks accompany the asset. Preserve the photo-derived stone vertex colors during GLB optimization; they carry facial detail, socket shading and subtle marble veining without image textures. Facial positions are fitted offline as one shared neutral shape with separate archival-photo cameras and bounded expression adjustments, using MediaPipe's Apache-2.0 canonical facial connectivity. Keep the withheld-view diagnostic and its limitations in the adjacent provenance; fitted-photo agreement does not establish measured 3D accuracy. Retain the MediaPipe license and the CC BY-SA 4.0 sculpture attribution. Keep the source figure’s six-unit height, shoe-level pivot, Y-up/+Z-front contract, and procedural figure fallback. At runtime, uniformly scale the complete statue-and-pedestal assembly to the Reichstag’s rendered height, including its dome; retain the ground apron’s established collision footprint and scale the nearby camera framing with the monument. Desktop and mobile share the GLB; the authoring `.blend`, photographs, and landmark-detection tools are never loaded by the game.
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

Paired character actions retain native painted keys. Their existing builder
exports lossless runtime WebPs under `assets/buergeramt/animation/`, separate
from authoring paths. Decode the initial adjacent pair sequentially inside the
admitted actor job, without nested queue admission; the third neighboring key
uses the same two-job queue, with one pending image per actor and
no new hidden-page work. Evict before decoding a fourth key: at most three
bitmaps and three corresponding GPU textures are resident per actor. A clerk
key is 1024×832 (3.41 MB RGBA), a regular key 640×832 (2.13 MB); those costs
exclude driver allocations. Do not eagerly upload the sixteen-key clerk set.
Paint planes preserve the registered canvas aspect, floor, tint and alpha.
One 32×32 plane per actor maps two neighboring native textures into the shared
pose with 2–32 common landmarks, without rebuilding CPU geometry or adding a
clock. Full-opacity premultiplied paint blending and bounded pair-specific UV
deformation preserve detail through each interval. Gaussian splats add localized
moving fringes, with protected face/ground edges; they no longer replace the
whole body at every midpoint. Stable full-resolution keys have no added pauses.
The shared batch sorts between the at-most-two admitted paint planes; remove
its local transparent sorter on retirement. Full raster keys need no Spark
sort while held. Native transition/depth and comparable frame/input checks
remain required before publishing this fidelity change.

The `workflow=arcs` route uses the paired action packs described above. The
original `spark-preview.html` routes remain silent, opt-in rendering experiments
with separate fax and Frau Knick anchor scenes. It compares the same procedural samples/motion in
native Three.js points and locally pinned Spark 2.3.1, loaded only on selection.
The document preview animates only the transparent red `ABGELEHNT` lettering
and stamp border. Paper and printed fields use one fixed 288×384 native canvas
texture (442,368 RGBA bytes) and an opaque depth-tested plane; neither enters
the particle samples. The preview uses 2,193 nonzero ink-alpha samples instead
of the previous 6,912 whole-sheet samples in the shared motion,
and both renderer choices preserve that mask. The texture and plane dispose
with the existing preview owner. This adds no download, dependency or clock. Fresh desktop/Android-emulated
Spark/points captures cover the start, full dissolve and return at ±45°. Timed
playback traces wrap the seven-second loop and hold exact time while paused;
the paper transform and texture version stay constant. Text fit was checked at
320 px, landscape and 200% text size. Physical Android was not tested. Evidence
is under `output/spark-preview/stamp-only*`; the canonical game/cast are unchanged.
The character data lives in `assets/previews/knick-splats/`: four unchanged
original anchors plus ten generated bridge paintings with recorded prompts,
source hashes and common-canvas registration. The 6.25-second loop includes
paper pickup/putdown at a side counter, stamping, folding arms and returning.
Seven compatible intervals transport Gaussian paint with a continuous clock;
no intermediate key has a scheduled hold or repeated ease to zero. Weighted
local similarity with head/collar guides replaces the global spline that tore
neck and shoulder paint. A narrow stamp mask follows a rigid curved path.
Crossings and grip/paper handoffs use 100 ms intact-pose intervals. The character
has no whole-body scatter/dissolve mode; the fax retains its toner-cloud effect. Opaque paint selection avoids translucent
second arms but painted-detail/proportion changes and short cuts remain visible.
The fourteen-key binary is 11.18 MB plus a 0.56 MB ownership mask, all opt-in.
This is not accepted gameplay animation. Reduced motion starts paused;
fixed allocations and hidden-page suspension preserve game resource ownership.
Format, resource sizes, validation and remaining limits live beside the data.
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

## Shared speech mouth layer (2026-10-11)

The optional Bürgeramt Bundespräsident portrait ships one 600 × 800 WebP
(63,000 transferred bytes, 1,920,000 decoded RGBA bytes, no mipmaps). The office's
existing admission queue loads it on approach; one retained office texture is
reused on replay and return. A readable named plate remains on image failure.
The gilded frame uses bounded procedural geometry and a shared material; its
complete wall projection is included in the office collision solids. Speech
uses four request-only MP3s, 353,840 bytes and 21.88 seconds total, with the
existing single-media cancellation and caption fallback. No idle work, model
download, second asset pipeline or new scheduler is added. Exact text/profile,
encoded hashes, native EOS, ASR and levels are in the existing player-replies
portrait supplement. `tools/playtest-president-portrait.mjs` and
`tests/buergeramt-president-portrait.test.mjs` cover its rendered interaction,
fallback and lifecycle; physical-device and listening evidence remain separate.

`buergeramt-lips.js` owns one cue track and one lazy 425-kernel instanced native-paint patch for the currently speaking atlas actor. It borrows the actor texture and shares its registration, breathing, tint, fog and depth policy; cancellation, exit and pagehide release ownership. Whole-body Gaussian paint consumes the same continuous cue shape in its existing shader and suppresses the atlas patch. `buergeramt-mouth-paint.js` separates painted lips and lower jaw around a visible, bounded oral cavity, retaining original closed paint at rest. All 15 office actor instances share this rig and retain their body bounds and floor pivots.

Recorded speech lazily loads `assets/buergeramt/speech/mouth-cues.js` when the office requests a clip or its existing Gaussian owner. All eligible office recordings, including the omen, have exact path/hash bindings, phonetic intervals and 100 Hz compact acoustic envelopes. The shared builder replaces the former omen-only data/pipeline. It uses local FFmpeg/Rhubarb and reuses analysis only when the exact recording hash, source and complete cue data match; optional installed Whisper diagnostics remain offline. The module is cached once, with decoded envelopes in a weak cache; existing cue cancellation/watchdogs own async preparation and disposal. Audio playhead sampling replaces both text-length timing and the additional 35 ms visual filter. Browser speech and optional unanalyzed preview recordings retain estimated articulation. See `assets/buergeramt/speech/PROVENANCE.md` for reproduction and precision limits.

The mouth patch copies its actor's layer mask on every update so both use the final office actor pass with the existing opaque room depth. A hidden atlas replacement cannot keep a visible patch. Disposal and office exit release the patch and restore ordinary actor ownership. Final integration evidence and measured limits are in `BUERGERAMT.md`.

Merkel’s nine exact-text recordings now use the user-selected GS Merkel profile, including the behind-player response. `assets/voices/merkel/manifest.json` owns hashes, transcripts and normalization. Clips load on speech demand through the bounded cache with browser fallback. The former two runtime excerpts are retired.

## Dedicated street-rule advisers (2026-10-11)

`street-wisdom.js` supplies three small code-native Three.js figures to the existing root renderer and pedestrian simulation: Waltraud's folder, Horst's clipboard/keys and Dietmar's ruler/briefcase distinguish their fixed rule-speaking identities. They use ordinary opaque depth-tested materials, ground-pivot gait groups and unique owned geometry. The three models total 80 meshes, 1,866 triangles and 96,252 geometry-buffer bytes; ten palette materials are shared. No textures, model downloads, dependency, extra animation clock or service is added. Geometry retires with its NPC; shared materials remain owned by the module. The optional street-character study cannot replace these dedicated appearances.

The existing displacement clock drives gait and accepted displacement drives heading. Simulation owns solid placement, avoidance, arrest and encounter eligibility. Voice MP3s load only when an eligible nearby speaker starts; the existing bounded speech cache/broker owns decoding, subtitles and cancellation. Private references, authoring WAVs, rejected takes and inference models remain outside `assets/`. Eleven redundant anonymous rule files are archived rather than shipped beside their replacements. Independent physics/camera review and comparable muted desktop/Android-emulation rendering/performance evidence are required on the final integrated candidate; CPU geometry measurements alone do not establish rendered acceptance.

The 2026-10-11 city candidate (`game.js` `c13857c8`, renderer `5bfe85e0`) passes independent Physics and Camera review. Muted hardware Chromium checks pass 85/85 across 1280 × 800 desktop, 390 × 844 portrait and 844 × 390 landscape Android emulation; 39 additional city canvas checks provide unobscured scale frames and explicitly exclude HTML overlays. Reviewers inspected scale, depth, feet, props and actual timed movement. Fresh Physics recalculation of 15 supplied browser trajectories covers 2,037 adviser samples, with moving heading error zero and phase error below 9e-16. Evidence is in `output/street-wisdom/final-render-2/`, `final-city-canvas/` and the independent review receipts. Forced fixtures and frozen natural spawn frames do not establish a full natural mission, listening, physical Android or stable performance; the cold comparison is a separate gate.

The final generic-crowd identity correction (`game.js` `aa3ed9f8`) keeps the nine unreserved names paired with their existing male/female towel sprites. Independent Physics replay verifies identical placement and non-identity state for all 136 actors, including the three advisers; reversing only that identity fragment reproduces the entire preceding game hash. Geometry, movement, escort and renderer blocks are unchanged, carrying their accepted evidence forward. The 110 crowd instances have unique IDs and rotate all nine matching profiles without borrowing adviser identities. See `output/physics-street-wisdom-crowd-parity.json`.

The final pedestrian audio guard (`game.js` `363a6baf`) passes a direct pool
recording only to its actual voice owner. Independent Physics reverses that
single guard to the exact accepted `aa3ed9f8` source; walking, escort, placement
and renderer hashes remain identical. This carries the geometry/movement gates
forward without a duplicate simulation. The final selected street audio run
passed 87/87 silent cases, including all 110 generic identity/voice/mesh pairs,
the six decoded MP3 hashes and starts, five held captions, and leave/arrest
cancellation. The ordinary pedestrian guard passed two targeted browser cases:
the actual named actor retained her profile and caption, with no foreign MP3
request, decode or start. All owned test browser processes closed cleanly.
The separate cold-run gate below is complete.

The final cold comparison ran three desktop and three Android-portrait
contexts per side, sequentially after generation, ASR and the other owned
test browsers closed. Baseline source is `59a6b6fa`; candidate game/renderer
hashes are `363a6baf`/`5bfe85e0`. Both sides share the final asset/catalog tree;
this compares the overridden runtime sources, not a full historical asset
checkout. Chrome 154.0.8037.99 reports Intel Iris Xe / D3D11, DPR 2, seeds
4781–4783, local uncompressed cold HTTP and no CPU/network throttling.

Both sides pass: nine accepted movement inputs per context, zero page errors,
no authoring/deferred-intro requests at startup, twelve title calls per measured
three-second window (one baseline portrait window has thirteen within its
measured allowance), and buffers of 1280 × 800 / 390 × 844. Maximum startup is
17,070,931 bytes baseline and 16,222,209 candidate, below the 18 MB budget.

| Metric, median (range) | Desktop baseline → candidate | Portrait emulation baseline → candidate |
| --- | --- | --- |
| Renderer ready, ms | 2716.8 (2368.1–2798.2) → 3078.9 (2744.1–5211.2) | 2335.0 (1818.9–10118.3) → 2981.5 (2405.2–4311.9) |
| Accepted assets settled, ms | 6737.3 (6497.8–10795.9) → 7582.3 (6772.0–12117.4) | 4967.6 (3899.7–12703.4) → 5250.0 (5050.5–6876.3) |
| Active sync-interval p95, ms | 132.0 (65.8–156.6) → 217.1 (169.6–260.1) | 102.2 (101.8–117.8) → 119.7 (115.1–145.0) |
| Accepted input p95, ms | 208.6 (174.3–379.8) → 620.3 (467.6–1175.4) | 136.9 (79.1–140.8) → 189.2 (139.4–336.8) |
| Sampled draw calls | 670 (657–716) → 763 (751–768) | 229 (216–250) → 292 (255–300) |
| Sampled triangles | 663456 (607228–695004) → 695708 (686498–749120) | 327315 (250273–349733) → 461443 (387947–467585) |

This feature adds visible render work; it is not a performance improvement.
The host was busy and samples are variable. Seeds do not fix frame scheduling,
travel endpoints or asynchronous asset completion, so transfer/triangle
differences do not isolate the adviser cost. The functional budgets pass;
stable timing, GPU timing, field data and the physical-device 33.3 ms target
remain NOT RUN. Receipts are in `output/street-wisdom/performance-base/` and
`performance-final/`; all owned browsers closed cleanly.
