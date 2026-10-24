# Berghain viewer validation

## First-person, archival audit and Astra Halle increment — 2026-10-24

Current increment: **PROGRESS; local technical acceptance PASS**. Candidate
output/berghain-first-person-candidate.json freezes 121 unique inputs, SHA256
f4a48df1f5fac8d3f6ffc15069b608179cf473720808f1d47e64c273a087493b.
The final Node run passes 137/137 tests in
output/berghain-first-person-final-node.log. The sequential 44-case browser
acceptance aggregate is output/berghain-first-person-accepted-browser/report.json; it records 44 unique passing case/profile combinations through the explicit
browser-test-only bridge below. Incomplete runs are not counted as acceptance.

George replaced the avatar with first-person walking: eye height 1.68 m,
60 degree lens, direct look and 1.6 m/s travel, with the existing 1.8 m physical
body and 0.28 m radius. The walkthrough neither imports nor creates the avatar.
Natural entry/exit and room geometry remain physical requirements. Original
finite heel/sole synthesis follows accepted displacement every 0.66 m; concrete,
metal, tile and grit use authored room convolution. These are approximations,
not recordings, measured room responses or a reproduction of the sound system.
One lazy AudioContext, at most four voices and one tail timer are owned by the
viewer; blocked movement, teleport, blur, hidden state, modal, exterior, mute
and disposal have explicit silence/reset behavior. No extra frame loop.

AUTHENTICITY-AUDIT.md records 25 findings against the earlier 687b408 runtime.
SOURCES.md contains 145 unique records, including dated firsthand Säule evidence,
organiser testimony, Andersson's 2022 article/method, Tony Andrews's 2011
transcript, the 2017 Studt/installer interview and the creator's 2013 film archive.
Full film footage has not been frame-indexed; no new interviews were conducted.
Related source chains are identified. Neither audit nor count certifies fidelity.
Fresh observation captured 20 views across ten selector rooms; selected actual
frames in every room category were inspected. The initial Panorama quarter-turn
avatar assertion failed; retain output/berghain-authenticity-public-tour/report.json.
The observation continuation's PASS establishes capture only.

Astra's provisional post-2022 Halle study adds three real slab voids, two concrete
flights, guarded connected galleries, a west under-stair WC, corbelled frame and
rectangular hoppers. The 4.25 m upper datum, plan, counts beyond documented
elements and detailed dimensions are inferred. The escape opening aligned with
the eastern stair remains unregistered and unmodelled. Every shell wall and the
club boundary remain. Selector-start local circuits do not establish natural
exterior/club access. PROVENANCE.md owns the geometry interpretation.

The integrator independently recomputed the preserved baseline fingerprint:
10,419 retained parts, actual geometry/matrices/colours, other-room inventory,
solids/floors/views and materials match. Evidence:
output/berghain-halle-retained-independent.json. The 141-file accepted baseline
and original primary index remain preserved. The portable GLB is 50,894,016 bytes,
671,592 triangles, 171 material groups and 25 embedded maps (5,501,462 bytes).
SHA256 69d6b296cb703eaacf5bcdce50d7cf53349b33cce405cfc3d2d1b28de7a918c3.
Deltas are +1,387,560 bytes, +13,368 triangles and +9 groups. Runtime maps stay 26.

check-architecture.mjs measures actual geometry with three representation checks
and 16 typed source comparisons; its seven tests include deliberately changed
geometry and mismatched definitions/datums/scopes. Matching official footprint,
frontage and roof values establish same-source import consistency. Halle's
22.753 m floor-to-exterior-roof proxy versus reported up-to-21 m inner height
remains an unresolved datum/soffit discrepancy, not an accepted dimensional match.
A06 project areas are not whole-hull supports. Interior floor levels, the Halle
legacy mapping's roughly 2.09 axis-scale ratio and stair dimensions remain
unverified. No dimensioned interior blueprint was acquired. See the owning
ARCHITECTURAL-CHECKS.md and output/berghain-first-person-architecture.json.

Retained failures and repairs before combined acceptance:

- Initial duplicate guard faces exceeded the triangle budget; indexed DoubleSide
  ribbons preserve real holes. The first 51,177,216-byte export exceeded the
  1.5 MB increment budget; 42 rather than 54 ribbons per panel brought it within.
- Physics found a 2.412 mm landing/bridge support seam skipped by a coarser route
  sample. Actual slab/support/guard laps repair it; 80 traversals across two
  stairs, five lanes, four step sizes and both directions, plus 30 mesh seam
  rays, now pass. Preserve rejected freezes and partial matrices.
- The superseded third-person camera cropped the visitor at guards and WC.
  Its partial browser passes are not first-person acceptance.
- Native PCM initially read zero because the safety harness muted offline
  rendering. Offline contexts cannot emit hardware audio; a tested exemption
  restores analysis while every real-time destination remains muted. Three
  corrected native PCM cases pass in berghain-first-person-pcm-accepted.
- Independent audio review found low-frame-rate idle suspension, long-stall
  recovery, delayed resume, Säule room selection and optional panner issues.
  Repairs have eight causal audio tests. The three-profile held-input/650 ms
  stall pilot passes; the final matrix repeats it at the chosen walking pace.
- Initial baseline cost completed 8/9; desktop first-start navigation hit the
  existing 30 s deadline. An unchanged repeat passed 9/9. Both remain recorded
  in berghain-halle-cost-baseline{,-repeat}/report.json. No timeout was widened;
  this does not qualify first-ever startup.

The browser acceptance aggregate explicitly uses 20 unaffected original passes,
21 unaffected remainder passes and three fresh confirmed-contact input/audio
passes. The only source changes between these captures were two browser tests:
Lab's third-person offset became the exact first-person eye/FOV/no-avatar check;
the input/audio approach now confirms real closed-door contact before the same
<1 mm movement and no-extra-step negatives. All production and Node-test bytes
were unchanged across the bridge; the final 137-test Node run was repeated fresh.
Three raw Lab failures remain in berghain-first-person-final-browser/report.json;
one raw desktop timed-approach failure remains in the remainder report. Actual
normal and deliberate 6x CPU diagnostic captures show 11.04 mm / 0.48 m of legal
remaining approach after the old timed setup; after confirmed contact, both
additional holds produced zero movement and zero extra cues. Corrected input
cases pass on all three profiles. No timeout or physical tolerance was widened.

Independent Physics and Camera reviews accept the final 121-input freeze within
the viewer's technical scope; Astra's independent audio source/CPU review is
also bound to it. Reports: output/berghain-first-person-{physics,camera,audio}-review.md.
Actual local source/native, first-person route/opaque-depth and responsive UI
frames were inspected. None establishes a measured contemporary floor plan.

Cost: nine preserved baseline and nine current cold-context samples pass on the
local Intel Iris Xe with three samples per screen profile. Before/current
median ready times are 1663/1790 ms desktop, 1595/1731 portrait and 1597/1723
landscape. Observed p95 frame intervals are 14.2/14.1, 14/7.1 and 14/7.1 ms.
The same starting target and three-second input are used; the user-directed
first-person camera and 1.6 m/s travel intentionally differ from the old
third-person 3 m/s view. This is not a same-view performance improvement claim.
Transfer grows by 15,683 bytes and one request (69 to 70); eager/playable startup
code adds 5,337 gzip bytes, below 20 KiB. No GLB loads during normal startup,
no idle RAF is added, texture maps stay 26 and the drawing buffer stays below
1.6 million pixels. Audio buffers/native convolution memory are not fully
represented by the JS heap metric. Cost summary:
output/berghain-halle-cost-summary.json; code budget:
output/berghain-first-person-js-budget.json.

Publication is isolated from the pre-existing primary index. The final deployed
commit, Pages result, exact public file/URL checks and actual public control runs
are recorded in output/berghain-first-person-release.json after verification.
Physical Android/device GPU and perceptual listening NOT RUN. Full contemporary
interior fidelity remains incomplete; earlier releases below retain their own
historical scope.

## Entrance/topology evidence increment — 2026-10-24

Scope is three owning documents: SOURCES.md, README.md and this validation
record. No world, asset, controls, HTML or dependency changes. Catalogue139
unique IDs; continuous Markdown tables verified, including repair of the
pre-existing blank before I24. Six engineer photographs and seven historical
model/exhibition images were actually inspected, with URLs/bytes/SHA256 in
ignored research metadata. Raw institutional pages and OSM/ALKIS responses
are retained for research, not copied into shipped media.

Both independent source audits reproduce the entrance-node projection near
x−6.65m. The camera addendum identifies P07/I15's broad portal beside the narrow
opening apparently matched by OSM. Thus neither exact relocation nor current
centering is verified; no geometry move was accepted. Sources/detail disposition
are in SOURCES.md. Reports are output/berghain-entrance-source-physics.md,
output/berghain-entrance-source-camera.md and its -addendum.md. These are source
reviews, not new rendered, physical-device or measured-building evidence.

Preserved baseline: output/berghain-entrance-baseline/manifest.json,141 files
from accepted687b408. All109 accepted runtime/asset/test inputs must remain
hash-identical for this documentation publication. The existing18 public
browser passes remain evidence for that unchanged runtime, not an execution
of new Halle/entrance geometry. Additional world acceptance reviews and GPU
batches are omitted because this increment has no world changes. Full model
remains ACTIVE; physical Android/GPU and listening remain NOT RUN.

## Säule concrete installations and human framing — 2026-10-24

A15's eight project images and I24's three installer photographs were inspected
and catalogued with URL/bytes/SHA256. The original assembly adds six massive
metric piers/caps, two corbels, four padded concrete seats and complete belt
channel geometry. Dimensions, counts, inherited wide grid and6.25m floor
underside are estimates. The full wash, concrete pitting/joints, complete bar,
separate entry and contemporary room plan remain unfinished. Manufacturer
L01–08 references do not identify these custom belt luminaires.

Preserved baseline: output/berghain-saule-baseline/manifest.json, accepted
e3ad14bc7fbdd884f6c7248e7395a424812db6a8,106 inputs plus32 ancillary files.
Isolation confirms10,404 retained parts' actual shape buffers, matrices, tones
and materials, and all3,509 old solids unchanged. Six old red strips are
removed;142 new parts have142 paired solids. The three remaining outer red
strips preserve their prior instance tones. No texture family or light added.

Current GLB:49,506,456bytes,658,224triangles,162groups,25embedded maps totaling
5,501,462bytes, same world bounds. SHA256
8bf8dbbda534c80aa78b0265892024ee11ffd335fd66d3c1602c71f11fe3845a.
Delta:+202,156bytes/+1,848triangles/+6groups. Runtime maps remain26.

Retained diagnostics and repairs:

- output/berghain-saule-red.log: three intended missing-assembly failures.
  The initial physical geometry/route checks then passed3/3.
- output/berghain-saule-tone-red.log: removing central red strips changed the
  three retained strips' batch-derived color. Explicit prior tones repair the
  regression; isolation then passes all10,404 retained parts.
- First source/native renders passed but looked brown. Cool concrete tint
  corrects the reused warm aged map; the neutral render passes meanRGB0.40864
  with zero large-difference pixels. Generic wear is still not site-specific.
- First whole browser matrix output/berghain-saule-final-browser completed
  15/16. Landscape camera pilot read stale exterior start(0,0,29) after room
  selection. The trace proves it; waiting for the selected position's actual
  rendered publication repairs the pilot without changing timeouts/tolerances.
- Repaired pilot matrix output/berghain-saule-accepted-browser passed16/16 on
  109 current inputs, but independent Camera review inspected turn2 and found
  real head/feet cropping on all profiles. Scalar avatar-visible/distance
  checks were insufficient. This is failed visual acceptance, despite its
  automated PASS. The pre-camera freeze and frames remain preserved.
- output/berghain-saule-camera-red.log independently projects the actual human
  corners and reproduces the crop. The camera repair keeps a visitor-side
  bounded orbit near the actual opaque pier bodies, retains all nine original
  clearance rays, fits the animated human with a60–100degree lens and gradual
  return to60, and exposes projected bounds through existing diagnostics.
  Focused CPU checks include every interpolating frame at16yaws,3aspects and
  two positions (including almost touching the pier), bounded angular change
  and clear-view lens restoration. Rendered review and the final matrix were
  still required; acceptance was not inferred from these diagnostics alone.

Final109-input freeze: output/berghain-saule-candidate.json, SHA256
ec7b9b1ec0fac956aec49b0b917a3db625f47096008d044a558205f23fd070f3.
Current Node113/113 PASS includes four route-packaging checks. The terminal
output/berghain-saule-camera-final-browser/report.json passes22/22 on all109
current hashes: source/native structures(3), natural Säule/Lab/reverse exit(3),
near-pier whole-human turns(3), Lab natural route(3), main-bar loaded camera(3),
fallback(3), restored desktop(1) and main-bar natural route(3). Source/native
meanRGB0.40864, zero large-difference pixels,26 source textures disposed once.
All three near-pier turn2 frames now contain the complete avatar, with projected
vertical bounds approximately−0.417..+0.372 and4.2m camera distance at all eight
final sampled yaws. These bounded views do not prove every possible camera start.

Both independent scoped world reports explicitly PASS this freeze. Physics
checks142 parts/4,200 actual transformed vertices inside their linked solids,
48/48 upper/lower belt aperture rays,75/75 newly invalid shallow starts recovered
legally, grounded supports and fitted joins. Five straight lower-floor lanes
traverse; x6 is close with0.027m margin beyond the0.28m visitor radius, while
x2–5 retain at least0.889m. Existing concrete cores inside new piers and one
stage/platform join are the only retained/new solid intersections. Camera
review distinguishes fresh source/hash checks from supplied actual frames,
and retains the earlier real crop as failed acceptance. Physical Android/device
GPU and perceptual listening remain NOT RUN.

Comparable cost covers three cold contexts per viewport per side, nine final
before and nine after, on local Chromium151.0.7922.34/Intel Iris Xe D3D11, no
throttling. Baseline106 and current109 source hashes bind to their respective
reports. The room shortcut plus real-input approach reaches the same lower-floor
target within0.23m, followed by3s forward; inspected start frames show the human
and changed installations. This is separate from natural-entry evidence.
Normal load adds7,081 encoded bytes(7,380,742→7,387,823),68→69 requests; runtime
maps stay26, no startup GLB, zero idle frames, buffers<=1.6MP. Desktop draw calls
261→272, portrait251→262, landscape278→290; triangle medians rise by2,616/3,660/
3,696 respectively. This modest cost buys the missing physical structures.

Active RAF-interval p50 medians remain13.9/13.8/13.9ms desktop/portrait/landscape.
p95 medians before/after are20.7/20.8,14.0/14.1 and14.1/20.7ms. Landscape's
6.6ms tail increase is retained: ranges14.0–20.8 before and14.1–20.8 after.
These samples do not establish unchanged performance or displayed-frame/GPU time.
Input-response medians are21.6/18.6,27.2/28.5,24.4/25.3ms; ready medians1904/1886,
1728/1810,1878/1783ms. Desktop ready ranges1822–7557/1803–12161ms. Observed
JS heap medians47.0→37.6,87.7→70.4,88.8→73.9MB are noisy retained-page samples,
not total process/GPU memory or evidence of a memory optimization. Distributions:
output/berghain-saule-cost-summary.json. Physical-device30fps target NOT RUN.

The initial quick command used the runner's
desktop-only default: three PASS contexts are preserved separately in
output/berghain-saule-cost-before-desktop-pilot. Its first ready time was27.136s.
The explicit three-profile baseline then completed8/9: first desktop navigation
exceeded the existing30s limit. Failure frame/trace and zero page errors are
retained in output/berghain-saule-cost-before-first-matrix. No timeout was widened.
The unchanged baseline repeat and separate current batch each pass9/9.
These samples do not qualify first-ever startup or explain away that timeout.
The full reconstruction goal remains ACTIVE.

Publication687b408cca2aa8a7e36c9bcd276f1e18af20f971 is a normal fast-forward
on e3ad14b,18 scoped paths; primary index remains untouched. Pages40082417656
completed SUCCESS for that exact head. Canonical verification passes72/72 exact
public files against Git objects and six successful root/3d/Geheim/model URLs.
Actual public output/berghain-saule-canonical-browser/report.json passes18/18
on109 published input hashes: source/native Säule, natural Säule/Lab/main-bar
routes/reverse exit, near-pier full-human turns and loaded main-bar camera,
each on desktop and Android portrait/landscape emulation. Six required public
frames plus an additional bar landscape frame were actually inspected. Their
hashes are retained in output/berghain-saule-public-visual-review.json. Final
receipt output/berghain-saule-release.json passes the release finalizer, preserving
all138 baseline files and the frozen current runtime. No physical-device or
perceptual-listening claim; full architectural/artwork fidelity remains ACTIVE.

## Aged bar plaster and portable practical lighting — 2026-10-24

I23 views12/13/16 show mottled cream plaster and localized warm upward wash
at the bar pilasters. The dedicated plaster assignment reuses the project's
original aged PBR maps on172 existing parts. Six inferred warm spotlights and
18 small housing/lens/bracket parts add actual localized light, retained in
the portable GLB through KHR_lights_punctual. Linear RGB, candela, range,
inner/outer cone and world beam direction round-trip. Fixture type/count,
positions, output and current operation remain estimates; generic repeating
mottling does not reproduce unique site damage. No photo pixels are shipped.

The first visual comparison failed the existing mean-RGB tolerance at1.658.
Isolation showed the large mismatch remained with normal-map strength zero,
but neutral base color or hidden reliefs removed it. The source's ordinary
matrix normal transform chose a different projection plane from the native
inverse-transpose calculation at2,990/3,960 relief vertices. Correcting the
shared surface projection removes that curved-surface mismatch without
changing the standard GLB UV algorithm or texture images. The original
tolerance remains. Representative Together, lounge and climber views pass.
One diagnostic page navigation hit its30s limit; the timeout was not widened.
Subsequent diagnostic and accepted runs pass. First-ever driver shader-cache
compilation performance remains unqualified.

Independent Physics review found the first housings unsupported: four35mm
above the worktop and two without a worktop below. Six actual0.50×0.05×0.12m
brackets now connect housings to pilasters, with paired solids. Every bracket
top meets housing bottom at y7.625; lens bottoms meet housing tops at7.705.
Each bracket enters the stem by about0.107×0.050×0.126m. A new real-mesh mount
check observed RED and now passes. Its initial contact-ray origin was inside
the support; moving it above the contact fixes that probe without changing
distance/role gates. The first support ended at the pier face; the final one
extends into it. These are intentional structural joints, not floating lamps.

Source isolation preserves all10,392 original part shape buffers, matrices
and instance tones, all3,491 original solids and10,220 material assignments.
Only172 plaster assignments change;18 practical parts are new. Material
regrouping preserves old tone batches so unrelated pale surfaces are not
arbitrarily recolored. The surface-normal correction also improves projected
maps on other nonuniform curved fittings. Geometry/collision/camera/input are
otherwise unchanged. No new texture family, dependency, shadow map, render
loop or pass; the six spots add actual light evaluation in the existing pass.

GLB49,304,300B /656,376tri /156 mesh-material groups /25 embedded maps;
SHA2566468b692b39d7d814bad8608c9850050e18633327e651c72a035eb66238d812f.
Delta from8ce9014: +25,632B /216tri /3groups, with the same26 runtime maps
and5,501,462 embedded texture bytes. Bounds and original asset scale remain.

Final106-input freeze: output/berghain-barfinish-candidate.json, SHA256
6965cf57176a40cbbc36219bd71bcee3be8dc2c60234c9b834dc05d9917642fa.
Current Node109/109 PASS includes four route-packaging checks. The monolithic
output/berghain-barfinish-accepted-browser/report.json passes22/22 on all106
current hashes: wall/roof/finish source-native views on three profiles(9),
natural exterior entry/stair/full bar/reverse exit(3), loaded camera(3),
fallback(3), desktop restoration(1) and three representative curved-fitting
regressions. Earlier unmounted22/22 is historical, not final acceptance.
Finish RGB differences are0.867/0.953/0.947, large-pixel fractions<=0.000117;
26/26 source textures dispose once. Actual light-off frames remove the warm
pools; controlled views do not establish natural entry evidence.

Both final independent Physics and Camera/scale reports pass scoped P1/P2/P4/P5,
C1–C5 and X1 on this freeze. Physics freshly bounds all18 new parts/432 actual
vertices in their solids, checks the six support joints, traverses seven
guest/service lanes both ways and finds zero newly blocked centers among1,122
locally legal samples. Six invalid fixture-contact starts recover legally.
Reviewer-fresh checks and author-supplied browser evidence are distinguished
in output/berghain-barfinish-{physics,camera}-review-final.md. The inherited
one-person service pinch and deep unreachable invalid starts remain limits.

Cost compares preserved106 inputs plus32 ancillary dependencies against the
final freeze: three cold browser contexts per viewport per side, nine before
and nine after. A room shortcut plus real input reaches the bar-aisle target
x13.72,z6.8 within0.23m, then walks north for3s with the lit plaster visible.
Actual start ranges are recorded; this setup is not natural-entry proof.
Normal load adds2,135 encodedB(7,378,607→7,380,742), with68 requests,26 maps,
no startup GLB request, zero idle frames and drawing buffers<=1.6MP.
Local Intel Iris Xe p95 frame medians before/after: desktop20.7/20.9ms
(ranges15.5–20.9/20.7–20.9), portrait14.0/14.0ms, landscape14.0/14.0ms.
Input medians are15.1/14.4,20.7/21.3,22.0/18.9ms; ready medians1504/1649,
1458/1577,1404/1586ms. Desktop ready ranges1396–3738/1578–4413ms.
These local samples establish neither a speedup nor a physical-device or
first-driver-cache guarantee. Distributions: output/berghain-barfinish-cost-summary.json.
Physical Android/device GPU and perceptual listening remain NOT RUN.

The six bright, regular teardrop pools still differ from the photographed
warm falloff. Exact wear, photometry, room topology, wall ratios and complete
building/artwork fidelity remain open. Publication/actual public checks belong
to output/berghain-barfinish-release.json. Full reconstruction stays ACTIVE.

## Bar roof and lower relief composition — 2026-10-24

Primary architect gallery I23 views 11/12 show concrete cross-beams and inset
blue gridded panels; views 12/13/16 place the lower circular reliefs fully
above the service worktop. The former flat ceiling becomes four inferred
coffers, seven concrete beams, a backing slab, 102 notched blue pane pieces
and 50 steel lattice pieces. Four bays, nominal 6×4 cells per bay, material,
dimensions and present-day condition remain estimates. Opaque emissive blue
is an appearance study; neither glass optics nor operating lights is verified.

The nominal 11 m beam underside is at y17.65 above the inferred y6.65 floor.
Actual pane undersides are y18.09, giving 0.44 m of recess. All 160 roof parts
have linked solids and 3,840 bounded box vertices. Pane/lattice AABBs clear
every retained column; concrete backing/beam-column joins are deliberate.
The first construction failed the existing column-intersection test; clipping
nonstructural rectangles around those columns corrected it without moving
the structure. All 15 original columns, floors/stairs, bar furniture, PA,
partial artworks, production camera and input remain unchanged.

Lower medallion bottoms now sit at y7.94, 0.35 m above the y7.59 service
worktop; panel rims clear it by 0.1525 m. The lower window sill rises with
that composition while real 0.27 m reveals remain. These are relative
photo-informed corrections; precise bay/window/relief ratios remain open.

GLB: 49,278,668 bytes, 656,160 triangles, 153 mesh-material groups and 25
embedded maps; SHA256 3383284a3d1a96cd84c780e065f7c5add071b1a699702a27b6bda72e6a04ca15.
Delta from f1195e8: +174,320 bytes, +1,908 triangles and +2 groups. Existing
26 runtime maps and 5,501,462 embedded texture bytes are reused. No new
runtime, texture, dependency, camera, production control, light or render pass.

Final 106-input freeze: output/berghain-barroof-candidate.json, SHA256
abfd98409d76ade28b71503fdcf1c5f5f59a456d0576927e8a1210f25009b2f8.
Current Node 106/106 pass, including four route-packaging checks. Focused
geometry checks have observed RED before the repair and PASS afterward.

Browser coverage uses an explicit 3+13 bridge. The initial geometry freeze's
output/berghain-barroof-final-browser/report.json is terminal 16/16 PASS,
including natural exterior entry, stair, full bar aisle, reverse and exit on
all three profiles. Visual review found most original roof panes too dark.
Only two roof materials' RGB/emissive factors then changed. The strict
output/berghain-barroof-color-bridge.json proves the GLB BIN exact, source
outside the material map exact and 103 other inputs exact; only 12 numeric
GLB material components differ. The three unchanged natural routes are retained.
Current output/berghain-barroof-color-browser/report.json passes 13/13 on all
106 final hashes: wall source/native 3, roof source/native 3, loaded screen
turns 3, fallback 3 and desktop graphics restoration 1. This is 16-case
coverage, not a monolithic final-hash 16-case rerun. Roof RGB mean differences
are 0.935/0.676/0.709, with 26/26 source textures disposed. Controlled upward
views establish construction and parity, not ordinary walking route evidence.

Independent final Physics and Camera/scale reviews pass scoped P1/P2/P4/P5,
C1–C5 and X1 against the same final freeze, with supplied browser evidence
distinguished from fresh source/mesh/contact/photo/frame inspection. Physics
finds 61/61 legal wall approaches stop legally and four near-contact starts
recover within 0.013 m. The inherited narrow one-person service pinch and
unreachable deep multiply occupied invalid starts remain limitations.
Reports: output/berghain-barroof-{physics,camera}-review-final.md.

Cost preserves the accepted 106 inputs plus 32 ancillary dependencies and
compares three cold contexts per viewport per side, nine before and nine
after, with the same foyer-facing view and real backward input. Normal load
adds 3,132 encoded bytes (7,375,475 → 7,378,607), with 68 requests, 26 maps,
no startup GLB download, zero idle frames and <=1.6 MP drawing buffers.
Local Intel Iris Xe p95 frame-time medians before/after are desktop
14.1/20.2 ms (ranges 14.1–20.9/14.1–20.6), portrait 14.0/14.0 ms and landscape
20.8/20.8 ms. Desktop p50 is 13.8/13.9 ms. Input medians are 15.0/18.9,
22.1/20.9 and 22.1/18.4 ms; ready medians 1986/1434, 1429/1498 and 1533/1403 ms.
The higher sampled desktop tail is retained as a cost; these samples establish
neither a speedup nor a physical-device guarantee. Detailed distributions:
output/berghain-barroof-cost-summary.json. Physical Android/device GPU and
perceptual listening remain NOT RUN.

Heavy weathering, uneven blue/practical illumination, precise wall ratios,
room topology and complete artwork/building fidelity remain open. Publication
and actual canonical interaction/byte checks belong to the scoped
output/berghain-barroof-release.json receipt. Full reconstruction stays ACTIVE.

## Historic interior bar facade — 2026-10-24

Primary architect interview A07 describes an approximately 11 m-high bar room
containing a former exterior facade. I23 views 12/16 show recessed dark windows,
two circular relief rows, stepped pilasters and cornice. The new independent
inner assembly has five inferred bays, ten actual profiled medallions and deep
window reveals. The 11 m clear height uses an inferred 6.65 m floor datum; bay
counts, positions, profiles, floor relationship and currentness are estimates.
The calibrated outer hull, all 15 columns, original floors/stairs, 44 PA
components and two partial artwork studies remain. This is scoped progress.

The first rendered study exposed an old inferred beam crossing the upper
reliefs. The accepted correction clips only its bar-room span, retaining two
outer segments and every column. The source/native relief sightline is 4.36 m;
all five windows have real 0.27 m recess depth. Cabinet/worktop rear notches
clear the new pilasters, with three sink recesses aligned to window bays.
Ceiling underside and screen head meet at y17.65; retained columns deliberately
join the ceiling. The photographic blue gridded roof/skylight and heavily
weathered finish are not reproduced by this flat ceiling and cleaner wall.

GLB: 49,104,348 bytes, 654,252 triangles, 151 mesh-material groups, 25 embedded
maps; SHA256 fd81c7078f9667c36b70d9467acd633114ec34512b305140fabac516f469ffc6.
Delta from f18cd2c: +597,664 bytes, +10,436 triangles and +2 groups. The same
26 runtime maps and 5,501,462 embedded texture bytes are reused. No new runtime
module, texture, dependency, lighting pass, production input or camera change.

Final 106-input freeze: output/berghain-barwall-candidate.json, SHA256
b77612dc44df5168a19eff8090ca2a05fee1523f0208a0b596823a26e6859e69.
Current Node 100/100 plus route-packaging 4/4 pass. The fresh monolithic
output/berghain-barwall-accepted-browser/report.json passes 13/13 on all current
hashes: source/native 3, natural exterior entry/stair/full aisle/reverse exit 3,
loaded screen yaw 3, fallback 3 and desktop graphics restoration 1. Controlled
source/native mean RGB differences are 0.76/0.83/0.81, with 26/26 maps disposed.
Room shortcuts and controlled cameras do not establish natural route evidence.

The retained earlier final-browser report is FAIL 9/10: landscape touch
overshot the original stair waypoint. An instrumented unchanged-pilot rerun
reproduced the overshoot: threshold z11.058 at 12837.7 ms, real pointer release
109 ms later at z10.746, then no further movement. The shared test pilot now
uses at most eight short real touch/keyboard correction pulses after release;
the same 0.23 m accuracy and legal-body gates remain. Production controls are
unchanged. An extra release-latency injection case passes: a test-driver-only
120 ms delay causes a 0.981 m overshoot, two real back-button pulses recover
to 0.148 m error, and the full yaw sweep passes. No teleport or selector is used.
Failure/diagnosis/injection evidence is preserved under output/berghain-barwall-*.

Independent Physics probes bound all 284 facade parts and 10,536 actual vertices,
including 3,960 medallion vertices; no facade vertex penetrates retained columns.
All 80 sampled wall crossings are blocked at legal stops. All 4,400 service
fixture vertices clear pilasters. Guest and service routes traverse. The service
pinch is about 0.795 m wide, with a sampled 0.20 m legal-center interval for the
0.56 m visitor. This is one-person access. Local facade recovery passes 54/54;
18 deep multiply occupied wall/cabinet starts in the full model remain invalid,
1.08–1.25 m from legal centers. They are unreachable by legal walking and are
not spawns. Preserve this bounded recovery limitation. Scoped independent
review reports are output/berghain-barwall-{physics,camera}-review-final.md.

Cost compares the preserved accepted 104 inputs plus 32 HTTP dependencies:
three cold contexts per profile per side, nine before (desktop 3 plus mobile 6)
and nine after. The normal page adds 6,467 encoded bytes, with 68 requests,
26 maps, no startup GLB request, zero idle frames and drawing buffers <=1.6 MP.
Local median p95 before/after: desktop 14.3/14.1 ms, portrait 14.0/14.0 ms,
landscape 20.8/20.8 ms. Input medians are 13.2/13.9, 18.6/24.9 and 17.9/27.8 ms;
ready medians 1530/1442, 1428/1422 and 1485/1419 ms. These local samples establish
no speedup or physical-device guarantee. Distributions and raw report paths are
in output/berghain-barwall-cost-summary.json. Physical Android/device GPU and
perceptual listening remain NOT RUN. Publication and exact public verification
belong to output/berghain-barwall-release.json. Full reconstruction stays ACTIVE.

## Main long bar and glazed hall boundary — 2026-10-24

I23 adds17 directly inspected primary architect lightbox views (00–16), with
eleven selected research URLs/hashes archived locally. Views11–14 document the
long bar and curved return; view16 establishes the glass screen toward the hall.
Counter1.12m, stool seats0.76m, screen10.7m,14m length,18 stools and placement
remain estimated. Existing calibrated structure, floors, stairs,44 PA components
and two partial artwork studies remain. Complete room/artwork fidelity is open.

Portable GLB48,506,684B /643,816tri /149 mesh-material groups /25 embedded maps;
SHA256 ba3e941fd5e2372e39ed7b6347a354dcbbfb149f79fb33a517f843f01feb3f84.
The original bar/screen geometry reuses26 runtime maps; no new texture, engine,
dependency or lighting pass. Cabinet/worktop segments retain all15 piers.

Final104-file freeze: output/berghain-mainbar-candidate.json, SHA256
2f6d287764e57d84b30a5847905cbf6cd08283fd149f0d0564c3a9643e10e1b8.
All99 Node checks pass, including four route-packaging checks. Independent
Physics and Camera reviews pass scoped P1/P2/P4/P5/C1–C5/X1 against this freeze.
Physics independently checks52 linked screen solids/2,444 actual vertices,
73 blocked screen-crossing samples, five17.5m aisle lanes in both directions,
24 rounded-return solids with zero sampled leaks,18 stool envelopes, corner
recovery, and zero41,443-vertex penetration into retained columns. The narrowest
sampled legal-center aisle interval is0.80m: one-person access, not crowd capacity.

The original near-screen camera failed an actual desktop turn: a steel transom
contracted the camera to about0.16m and hid the avatar. A1.35rad lift passed its
visibility flag but failed visual review as an overhead head close-up. The final
camera uses screen-side azimuth steering at ordinary walking elevation, bounded
to3rad/s and followed by the same nine actual opaque frame/wall/door rays. Finite
settling ends demand rendering. CPU checks cover64 yaws at two legal positions,
full-body bounds for three aspects, angular rate, settling and another-floor
negative. Existing garden, guards and entrance checks pass.

output/berghain-mainbar-final-browser/report.json passes13/13: same-light
source/native3, actual exterior entry/main stairs/full aisle/reverse exit3,
loaded near-screen turns3, fallback3 and desktop context restore1. Source/native
mean RGB differences are0.54/0.59/0.58 with large-pixel fraction0; actual screen
ray distances match. No forced placement or room selector proves the natural
route. These are silent Chromium desktop and Android-emulated profiles.

Final acceptance uses an explicit9+4 bridge. Camera review found that the
centered fallback notice covered the human. The preserved landscape RED fails
the new banner bound. Only viewer.css and its pilot assertion then changed;
102 other inputs stay exact. The repaired top-edge notice retains the full
message and pointer passthrough, with actual locked Pretext0.0.9 fit and a bound
above the central body. output/berghain-mainbar-banner-final/report.json passes
the affected fallback3+restore1 on all104 current hashes. Nine unchanged loaded/
source-native/natural cases bridge the earlier report. This is13-case coverage,
not a monolithic current-hash13-case rerun. Both reviewers inspect actual frames.

Cost: preserved accepted101-file/32-ancillary baseline; three cold contexts per
profile per side,9/9 before and9/9 after. GLB adds1,833,560B /29,320tri. The normal
page adds10,266 encodedB and one request (67→68), with26 maps, no GLB startup
download,0 idle frames and≤1.6MP drawing buffers. The later hidden-status CSS
repair adds54 uncompressed bytes; geometry/camera and other102 inputs remain
exact. Local median p95 before→after: desktop14.1→14.2ms, portrait14.0→14.0ms,
landscape14.0→20.8ms. Ready medians1408→1582,1390→1419,1354→1416ms respectively.
These samples show a short-wide-view tail cost, not a speedup or device guarantee.
Physical Android, low-end device GPU qualification and perceptual listening
remain NOT RUN. Detailed distributions: output/berghain-mainbar-cost-summary.json.

Acceptance/review/publication receipts live under output/berghain-mainbar-*.
The primary staged index stays untouched. The full reconstruction goal is ACTIVE.

## Original balustrade increment — 2026-10-24

The101-file candidate adds six photo-informed original stair/gallery guards
from I08/I09/I15. Handrail1.08m,45mm posts,22mm pickets and spacing are estimates.
The source and native GLB contain actual separate bars/open gaps, not a flat
opaque panel. GLB46,673,124B /614,496tri /143groups /25 embedded maps;
SHA2567d52346664f97ee93bba670e9f32ee8ccff04f55c082c61f6f33bc4bf0fbdebc.
Delta from Lab:+669,972B and6,540tri, with the same26 shared runtime maps.

Fresh full Node96/96 PASS and packaging4/4 PASS. Detailed Physics probes find
618 paired visible uprights/solids, effective full-body separation along all
six guards, legal bidirectional stair lanes and unchanged sampled undercroft
access. Reachable rail-end recovery passes. Eleven invalid starts deep in
far retained-barrier joints remain unrecovered; they cannot arise by legal
walking/spawn. These probes do not establish surveyed installation accuracy.

The original near-rail camera failure is preserved in
output/berghain-balustrade-near-camera-first/report.json:0/3 PASS. The camera
now lifts smoothly near low guards, using six run segments and interpolated
local height; nine opaque sightline rays remain enforced. CPU tests cover
four close legal positions, yaw continuity, full-body framing at three aspects,
a distant negative and the same XZ below an overhead gallery. Away-facing
views are intentionally elevated while near the rail; distant views recover.

The first combined browser run was15/17 PASS, with two real fallback-touch
failures. A fresh witness proves the fallback status caught a touch drag with
touch-action:auto and the browser navigated to about:blank. CSS pointer-events:
none passes this noninteractive status through to the existing canvas; the
same witness then targets #model/touch-action:none, stays on the page and
passes natural entry/contact/yaw. Failure and repair traces remain in
output/berghain-fallback-touch-red and ...green. No timeout or product guard
was relaxed. The public playtest no longer requires ignored output files.

The next17-case run passed16 cases; only graphics restoration failed a bitwise
position assertion by1.03e-8m. That test sampled while input was still held.
The corrected restore branch samples after the real release reaches the render
loop and requires preservation within1micrometre. Its focused rerun passes;
held/released/restored positions are exactly equal in the final artifact.
The original16/17 report is retained. output/berghain-balustrade-browser-coverage.json
explicitly bridges its16 passing cases with this one current-hash rerun; it
does not claim a fresh monolithic17/17 batch. Only that test file changed;
all100 other captured hashes match the final101 freeze. Both independent
Physics P1/P2/P4/P5/X1 and Camera C1–C5/X1 reviewers accept this scoped evidence.
Their fresh evidence is CPU/source/hash; browser evidence is supplied by the
integrator. The owning release receipt records exact Git/public bytes and
actual canonical route checks after deployment.

Cost evidence retains nine cold-context samples/side (three per viewport),
plus a12-case back-to-back old/new check prompted by slower tail frames.
The actual98-file accepted baseline is preserved with hashes. All starts use
the same foyer-facing camera and real backward aisle input. Runtime encoded
transfer7354948→7358688B (+3740B),66→67 requests;26 textures, zero GLB startup
requests, zero idle frames and the1.6MP drawing-buffer cap remain unchanged.
The optional GLB adds669972B; measured rendered triangles add12744 desktop/
portrait or18948 landscape, while draw calls decrease by1/2 respectively.

Nine-sample before→final median frame p95: desktop14.1→20.5ms, portrait13.9→14.0ms,
landscape14.0→20.8ms. Back-to-back three samples/side reproduce landscape
14.0→20.8ms; desktop is14.1→14.1ms. In that paired check landscape median
frame p50 stays13.8ms and input latency19.1→18.9ms; desktop p50 varies7.2→13.7ms
and input12.6→13.4ms. Do not claim no render cost or a speed improvement.
The thinner bars increase geometry, and wide-view tail timing is worse in
some runs. Raw ranges, readiness/heap variation and GPU/browser identity are
retained in output/berghain-balustrade-cost-summary.json and
...paired-cost-summary.json. This is local Intel Iris Xe/Chromium evidence,
not physical Android or low-end GPU qualification. No extra texture, shader,
dependency or render pass was introduced.
All automated browser work is silent/headless. Android is Chromium emulation;
physical Android/device GPU and perceptual listening remain NOT RUN. Full
building, artwork likeness, hidden rooms, finishes and current layout remain
required backlog; this increment does not complete the full reconstruction.

## Andrea reference views and rejected local feasibility study — 2026-10-24

ART23's remaining three gallery images were inspected: two painting views and
the bronze displayed on a crate. ART25's labelled1600×2296 reverse three-quarter
photograph supplies the standing shoulder cut, outer arm, fingers around the
rectangular shaft and projecting handle below the fist. Neither source locates
the club mounting. The catalogue still contains118 unique records.

An ignored offline R01 CC0 anatomical study was rendered silently with the
existing browser harness. output/andrea-form-review-eighth/report.json records
one successful desktop diagnostic case and four frames; this only proves the
study renders. Reference comparison FAILS: generic shoulder cap/arm proportions,
insufficient cast anatomy and grip likeness, hammer form and conspicuous UV seams.
No source photo pixels or third-party sculpture geometry were embedded.

This study is NOT ACCEPTED, not exported into the portable asset and not loaded
by the viewer. All98 accepted Lab source/test/authoring/asset files are unchanged.
Physics/Camera runtime reviews are omitted because no world candidate is being
accepted or published. Revise three-dimensional form against both primary views
before surface refinement and any placement; normal source/native, human-route
and independent reviews remain required for a future integrated candidate.

## Lab public acceptance and next research evidence — 2026-10-24

Previous goal turn: PROGRESS. Runtime ad12fc4 is deployed by successful Pages
run40046556651. Both output/berghain-lab-immutable-verification.json and
...canonical-verification.json pass68/68 exact public Git-file comparisons;
the canonical report also checks six root/3d/Geheim/model responses. Both public
browser reports pass9/9, including actual entry/Lab sanitary descent/return/
exit/refresh, source/native views, artwork and existing Klo routes. Their98
source hashes bind to actual published Git objects through the byte audit.
The primary index remains704aa6efaa460b62afae0eb826c95ec075c54aff3b91b61dd4a5f6f00ecb2105.

The following source-catalogue increment changes only five owning Markdown
documents. M07's official JSON/poster and M08's visible creator page were
inspected; no world mesh was acquired. ART20–25 resolve useful first-work
references and preserve conflicting dates/axis order. Full source cards are in
SOURCES.md; the installed work remains unmodelled. New source IDs are checked
for uniqueness and table continuity before publication.

Physics/Camera reviews and new gameplay tests are omitted for this research-only
increment because geometry, assets, runtime, controls and rendering are unchanged.
Retain the exact accepted98-file world freeze and its91 Node/35 browser evidence
below. This is research progress toward the full asset, not full reconstruction
acceptance. Physical Android/device-GPU and perceptual listening remain NOT RUN.

## Lab.oratory partial reconstruction — 2026-10-24

A12/I22's ten inspected architect photographs supply the industrial forms;
A15 documents connected/separable steel-glass partitions. The western footprint,
floor.05m, soffit4.15m, beam underside3.60m, gate location/state and1.20m local
sanitary drop are inferred. No dimensioned interior plan was recovered. The
first lofty5.95m ceiling was rejected against the photographs despite passing
technical checks. Bar/cell fittings were rearranged after a transformed-vertex
check found3,536 intersections with retained columns. The final check finds0.

The final98-file freeze is output/berghain-lab-candidate.json. GLB SHA256
4608f39d17e04761b59f7edb45de0000de03e7a261a6873b753a1e576e727137,
46,003,152B /607,956tri /143 groups /25 embedded images. Eight original shared
surface families, thickness and environment total26 runtime textures. All23
old image hashes remain unchanged; the new aged family adds677,174 encoded
bytes and3MiB decoded RGBA (4MiB with mipmaps), excluding driver overhead.

- 91/91 Node PASS, including the shared queue's checks; 6/6 route-packaging PASS.
- Final silent integrated browser report
  output/berghain-lab-admission-integrated-browser/report.json:35/35 PASS with
  all98 captured hashes equal to the freeze. Desktop and Android portrait/
  landscape emulation use actual keyboard/mouse or CDP touch. Natural exterior
  approach/E-or-tap entry → Säule → Lab/bar → sanitary descent/return → exterior
  exit/refresh passes without room selection or forced placement. Prior Klo,
  Together, upper lounge and doorway paths remain covered.
- Source/native portal rays clear the aperture both ways; Lab/Säule roof and
  raised gate underside distances agree within2mm. Same-light material parity
  mean RGB difference.544/255, large-delta pixel fraction.0001399; all26 source
  textures dispose exactly once. The actual source/native frames were inspected.
- Admission/resume passes all 3 profiles: 26 real image jobs, peak 2 active, 0 starts
  while the deterministic hidden getter is true, and0 remaining active/pending.
  This is a simulated visibility contract check, not physical background-device
  evidence. All-image failure retains visible basic-material fallback/movement;
  interrupted entry, graphics loss/restore, idle cessation and320px/200% text pass.

Independent Physics P1/P2/P4/P5 and Camera C1–C5/X1 pass the exact98 freeze and
terminal35-case report. Review found and repaired six missing screen-post
colliders and proud casting clearance.63,192 low screen vertices are covered by
same-fixture solids; the previous reachable arm-through-post witness is blocked.
Tested portal lanes and sanitary stair center/±.66 author lanes work both ways.
25/30 invalid nearby post samples recover within.87m; five starts deep inside
the multiply occupied screen/guard remain invalid on zero motion, with no legal
route or spawn there. The gate's authored8cm recess is an inferred fine-fit
detail, not a blocked passage. Pendant bottom≈2.215m above the Lab floor clears
the1.80m avatar; gate underside2.65m and beam underside3.60m remain legible.

Comparable cost reports are output/berghain-lab-cost-before/report.json and
...cost-after/report.json,9/9 PASS each: three fresh contexts per viewport,
Chromium151.0.7922.34, Intel Iris Xe / ANGLE Direct3D11, no CPU/network throttle.
The accepted pre-Lab baseline changes only the Säule shortcut camera to the
new Lab position/yaw; old geometry/materials/renderer/navigation stay intact.
This compares the same controlled view/backward input, not a natural baseline
Lab route. Starts match exactly and paired ends differ by at most3.37cm.

| Profile | Ready median/range ms, before → after | Frame p95 median/range ms, before → after | First changed-state latency median/range ms, before → after |
| --- | --- | --- | --- |
| Desktop |1374/1339–3256 →1496/1398–3338|14.1/14.0–14.1 →14.1/14.1–20.7|18.9/15.7–19.1 →17.9/17.6–18.9|
| Android portrait emulation |1354/1341–1441 →1446/1346–1507|13.9/13.9–13.9 →14.0/14.0–14.0|20.8/18.1–21.9 →18.0/17.9–22.0|
| Android landscape emulation |1370/1332–1379 →1337/1325–1361|13.9/13.9–13.9 →14.0/13.9–14.0|18.2/16.2–23.3 →20.0/19.3–23.8|

Desktop frame p50 increases7.2→13.8ms; emulated profiles remain7.0ms. Normal
transfer6,653,014→7,354,948B, requests61→66. The GLB is not requested. Idle
adds0frames; buffers stay≤1.6MP. End-view draw calls220/218/220→264/256/270;
triangles401,016/400,812/401,016→653,248/638,676/673,876. JS heap medians
43.90/63.57/82.54→51.58/83.63/67.36MB vary with GC; these samples do not
establish a memory reduction or device frame-rate qualification. Complete
per-run heap ranges, long tasks, bytes and GPU strings remain in the reports.

This accepts an initial partial Lab study. Exact contemporary plan/elevation,
outside entrance, hidden spaces, current equipment inventory, fine historic
cast ornament, weathering and full photographic fidelity remain open. Physical
Android/device-GPU targets and perceptual listening are NOT RUN. The complete
realistic Berghain asset goal remains ACTIVE. Publication receipts and actual
public-byte/browser verification belong in output/berghain-lab-release.json.

## Exterior landscape and building refinement — 2026-10-23

The exterior request was split among three scoped workers for landscaping,
envelope details and reference research, with one integrator. Original geometry
adds differentiated entrance cobbles/concrete paths, queue rails and bollards,
drainage, a gated/fenced garden, planting beds, fourteen trees with undergrowth,
bamboo, grassy mounds, seats, standing tables, a sheltered service counter and
service cabinets. The Halle gains separate side/rear masonry bays, closed
service doors and vents; the main building gains entrance reveals, drainage,
coping, sparse mineral runoff and inferred roof membrane seams. P07–P10 support
broad site forms; SITE01/SITE02 support seasonal garden use and described
planting. Positions, species, furniture arrangements and unsurveyed details are
explicitly inferred. The smoking bridge remains an unresolved modelling gap.

The initial exterior-only freeze on `83cac59` had 47 files. The final
combined freeze is `output/berghain-exterior-combined-candidate.json` with
52 source, test and asset hashes on `ed0e0c25`. After the PA update landed on main, its published model/components were
combined with this exterior delta. The final freeze is rooted at
`output/berghain-exterior-combined-release` on public `ed0e0c25`.
All original main-game changes and the accepted PA remain present.
The combined release GLB is **18,588,552 bytes / 149,276 triangles / 85 groups**,
SHA-256 `eed42cad4213d733ff2b66593a072b17db4a3cb56241a2c2736c5b22d80d7913`.
Compared with the public base: +19,020 triangles and +1,945,468 export bytes.
All twelve existing 512px original maps are unchanged (12 MiB base decoded RGBA,
16 MiB with mipmaps; GPU/driver overhead additional). No new image, dependency,
timer or animation loop. Viewing imports procedural modules; the GLB remains an
explicit download/diagnostic request. The existing owner disposes geometry and
materials; native diagnostic scenes explicitly dispose their resources.

Local final evidence:

- **42/42 combined Node checks PASS**, including whole-body entry/stair/garden routes,
  visible collision bounds, official exterior proportions, portable materials,
  hidden-page packaging and two regressions from independent review.
- `output/berghain-exterior-publish-browser/report.json`: **8/8 PASS**, silent
  Chromium desktop and Android portrait/landscape emulation, real mouse/keyboard
  or CDP touch orbit/garden movement, front/rear/site views, native GLB views,
  and diagnostic actual-camera/actor shrub-edge rendering. Each profile runs
  315 actual RAF turn frames at .02 rad/step, retaining the visible avatar and
  limiting camera movement to <.35m per sampled turn. Diagnostic placement is
  separate from natural entrance evidence.
- `output/berghain-exterior-publish-entry-browser/report.json`: **4/4 PASS**,
  actual outside approach/E/entry/exit, touch, gait, interruption, graphics
  recovery, idle cessation and narrow/enlarged text.
- `output/berghain-exterior-combined-material-browser/report.json`: **4/4 PASS**, paired
  source/GLB material rendering and usable texture-failure movement on all three
  profiles. Geometry/camera-only final repairs preserve these material paths.

Initial independent review correctly failed walk-through opaque shrubs and a
subsequent discrete camera-elevation pop. Matching low-planting collision and a
continuous proximity-based camera rise repaired them, with red-to-green tests.
The camera keeps its actual opaque-mesh envelope check, now one nine-ray scan;
it does not ignore plant geometry. High crowns remain nonblocking above people.
Initial FAIL evidence stays in the two independent review reports under
`output/berghain-exterior-{physics,camera}-review.md`.

Both independent specialists also reviewed the combined 52-file freeze.
Physics freshly confirmed all hashes and 37 scoped tests, retaining its
independent body/solid audit. The unchanged exterior camera keeps its
315 production-camera turn samples: maximum step **.01840m**, zero
hidden-avatar samples; two fine-step walking approaches stayed continuous.
Final rendered turns match these values on all three emulated profiles. No
required Physics or Camera repair remains for this bounded exterior candidate.

Source/fixture mismatches during isolated-test setup are preserved under the
earlier release-before/entry reports. Correct-root suites and the immutable
fax SVG dependency repaired the harness, without weakening assertions.
Physical Android/GPU qualification, exhaustive paths and surveyed photographic
fidelity remain NOT RUN/unresolved. Main-game missions/traffic/sprites and their
root performance benchmark are out of scope; no root game runtime changes.
Earlier pre-PA source-view diagnostics observed 101 → 132 overview draw calls and
158,164 → 193,984 rendered triangles (including shadow passes), with no idle
RAF activity or eager GLB. Host readiness timings are diagnostics, not a device
performance or optimisation claim. The full reconstruction goal stays open.


2026-10-23; integrator-owned local candidate. This record covers the provisional architectural viewer and GLB, not measured fidelity, the main game or physical-device qualification.


2026-10-23; integrator-owned local candidate. This record covers the provisional architectural viewer and GLB, not measured fidelity, the main game or physical-device qualification.


2026-10-23; integrator-owned local candidate. This record covers the provisional architectural viewer and GLB, not measured fidelity, the main game or physical-device qualification.


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
  candidate in silent Chromium 151 desktop and Android portrait/landscape
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

Executed on the isolated served source, silently in headless Chromium 151:

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

### Public speaker preview verification

Pushed `ed0e0c251ccc1869ce981d3ba3cf704b8f013b94` with 17 scoped changed paths, preserving parent `211282f`
and the unrelated staged primary checkout. Immutable public files pass 39/39 exact
SHA-256 comparisons in `output/berghain-speaker-immutable-verification.json`.
`output/berghain-speaker-immutable-browser/report.json` passes 6/6 on the actual
public URL: natural entrance/exit/refresh, source/native speakers and controlled
human near equipment, desktop and Android portrait emulation. Expected hashes
are read from the published Git objects. Silent Chromium; no physical device.
Permanent Geheim equipment deployment remains pending Pages run 40000026294;
the previously verified canonical avatar/door remains available. Do not label
immutable preview evidence as canonical Pages evidence.

### Exterior publication checkpoint

Pushed c6041f61a9986558de6c20ee38c37add80663280 to main, parent824681c. All52 frozen files were independently compared with raw commit bytes before push, using a dedicated bare index and no Git text filters. Final publication-byte suites: output/berghain-exterior-publish-browser/report.json 8/8 PASS and output/berghain-exterior-publish-entry-browser/report.json 4/4 PASS; both reviewers rehashed52 and confirmed the LF-only source bridge. Public immutable browser report output/berghain-exterior-immutable-browser/report.json PASS6/6: actual desktop/Android-portrait site orbit/garden movement, portable GLB and natural avatar entrance/exit. The versioned public preview is usable. Canonical HTTP report output/berghain-exterior-canonical-http.json has200 for root/3d/Geheim/model, but old model bytes; Pages 40002583147 is pending behind40001005783. Canonical new-byte and browser verification remains outstanding until that external deployment completes. No physical-device claim.

## Panorama figure increment — accepted geometry, fidelity remains open

2026-10-23. Freeze output/berghain-artwork-candidate.json: 62 files, based on
published exterior/speakers c6041f6. Portable GLB SHA256 9970accf87430557bf37f41674c97c9315f3d8e4f2482bcd00aa7e1ed07c8da7:
22,371,528 bytes, 229,356 triangles, 94 mesh/material groups, 15 shared embedded maps.
The new original figure adds 80,080 triangles and uses 9 indexed material groups.
No downloaded artwork image, artist mesh or studio furniture is embedded.

Fresh nine-suite Node checks pass 47/47. Corrected source/native figure views and
avatar pass 7/7 in output/berghain-artwork-release-framing-browser/report.json on
desktop, Android portrait and landscape emulation. Regression passes 10/10 in
output/berghain-artwork-release-regression/report.json: natural entry/exit all
three layouts; idle/context restore; texture fallback desktop/portrait; Panorama
footer 320px/200%; source/native materials with exactly 15 texture disposals;
furniture/native regressions desktop/portrait. Report hashes match the freeze.
The earlier landscape test aimed from a stale room position and is superseded;
the corrected test waits for the actual mapped Panorama spawn before aiming.

Independent Physics P1/P2/P4/P5/X1 PASS: fresh 47/47 tests and 62/62 hashes;
80,080 transformed triangles vs four counter solids inset 2mm have 0 penetrations.
Worktop support and hanging boot floor gaps are 3mm. Six outer bar lanes have
unchanged legality with/without the artwork; 2/2 eligible shallow overlaps recover.
Independent Camera/scale C1–C5/X1 PASS for this initial increment: inspected the
ART02 photograph and current source/native/visitor frames, including repaired
landscape framing. Figure bounds 1.581×1.615×0.999m read plausibly beside the
1.80m human and 1.13m counter. No required camera or Physics fix remains.

Cost evidence: output/berghain-artwork-cost-{before,after}/report.json and
output/berghain-artwork-cost-comparison.json. Each has 3 cold runs per layout,
same local scene/input, Chromium 151, DPR 2, no throttling; baseline is the complete
published exterior release. Transfer 4,195,332→5,208,268 bytes; export remains
unrequested in ordinary viewing. Median ready ms desktop 793→932, portrait 675→908,
landscape 662→915 (ranges before 726–1589/640–742/656–749; after 919–1568/882–1031/
863–1024). Median product-RAF p95 stays about 14ms, no continuing idle frames.
Input is one real keyboard/touch sample per run; medians vary 11.4→10.7,23.8→17.5,
24.9→14.5ms, with a 95.2ms baseline outlier. These short shared-host samples do
not establish a causal speedup or physical Android/low-end GPU qualification.

Fidelity remains unfinished: anatomy, hair, garment cut, hardware and weathering
are stylised. Published 160×130×110cm axes/support inclusion, installed pose,
bar location and current presence remain inferred. Eight tiny triangles have
minor face/vertex-normal opposition, total <0.00036m², without visible blocker.
Physical Android, crowd/vehicle/sprite/fade and acoustics are NOT RUN/out of scope.
This accepts a visible geometry increment, not a faithful finished artwork or
the full realistic interior/exterior goal. Remaining rooms and art remain open.

### Public Panorama figure checkpoint

Published runtime/documentation commit e75b829a34e9d27187fcad0a831c5a8b3c34f196,
parent c6041f61a9986558de6c20ee38c37add80663280, with 25 scoped changed paths.
Public immutable verification passes 46/46 exact SHA256 comparisons, zero
line-ending-normalized substitutions, in
output/berghain-artwork-immutable-verification.json. Actual public desktop and
Android portrait-emulated natural entrance/exit/refresh, source/native sculpture
and human-at-artwork cases pass 6/6 in
output/berghain-artwork-immutable-browser/report.json. Expected bytes come from
published Git objects. Tests were silent and headless; no physical-device claim.

The permanent domain currently returns the accepted exterior/speakers GLB
eed42cad4213d733ff2b66593a072b17db4a3cb56241a2c2736c5b22d80d7913.
Pages artwork run 40007555342 is in progress; canonical artwork byte/browser
verification remains outstanding. Versioned public preview:
https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/e75b829a34e9d27187fcad0a831c5a8b3c34f196/geheim/index.html .
The original primary index SHA256 remains
704aa6efaa460b62afae0eb826c95ec075c54aff3b91b61dd4a5f6f00ecb2105.
This local handoff records publication evidence without creating another
documentation-only push that would supersede the running deployment.

## Upper Panorama lounge — revised integrated candidate

2026-10-23. Base e75b829a34e9d27187fcad0a831c5a8b3c34f196;
output/berghain-lounge-candidate.json freezes 68 source/test/asset files.
GLB 68607e6777b375e67031d59708147fc49e5d9f63a84266bd465c741c7a5dd6c1:
23,389,640B / 235,320 triangles / 98 mesh/material groups / 18 shared PBR maps,
4,219,348 embedded image bytes. Whole exterior bounds remain unchanged.
The increment adds an estimated upper floor 16.35m, ceiling 19m, fourth stair
with 3.1m rise and Felsenland forms from primary photos I19. No photo is shipped.

Fresh scoped Node checks pass 53/53. Initial integrated browser 7/7 and first
frozen release 22/22 are pre-review-repair evidence. Physics identified missing
radiator collision and bench intrusion; Camera identified stale room labels on
natural ascent. Repairs add 50 exact radiator solids, a full-width lower landing,
bench 2 width 1.6m, and room/accuracy/selector synchronization without teleporting.
The final matching browser batch is output/berghain-lounge-final-browser/report.json.
The matching revised candidate passes 22/22 in that report. Both independent
reviewers accept the scoped geometry/camera increment. A later UI-only enlarged
text-spacing check found header labels overflowing; a text-sized minimum width
lets the header reflow. The final current-hash rerun is
output/berghain-lounge-publish-browser/report.json, complete PASS 22/22 with all 68
matching source hashes. Both reviewers reconfirm only viewer.css changed from
their accepted physical candidate. The dedicated spacing report
output/berghain-lounge-final-text-spacing-browser/report.json passes 1/1, covering
eight viewport/font combinations. Its failed diagnostic predecessors remain
pre-fix evidence, not acceptance.

Fresh revised Physics probes: 68/68 hashes; 53/53 tests; seven stair lanes at
author x offsets −.65/−.60/−.55/0/+.55/+.60/+.65 reach both floors continuously.
All 50 radiator box bounds match render parts to ≤6.2e−7m; approach stops and
invalid-center recovery stay legal. Foot/shoe geometry can clip the discrete
visual treads by up to 0.039m because walking follows the continuous ramp support;
this remains an animation/contact fidelity limitation, not measured stair contact.

Supplied source/native/visitor frames distinguish the earlier rectangular
platforms from the later dark/plum Felsenland commission. Its five seating units,
arrangement, footprint, absolute heights, unseen surfaces and present retention
remain estimates. Printed Brandenburg glass artwork and fine upholstery seams
are absent. Physical Android/low-end GPU, acoustics and main-game crowd/vehicle
cases are not established by this viewer evidence. Full realistic reconstruction
is still incomplete.

### Prior artwork canonical deployment confirmed

Pages 40007555342 on e75b829 succeeded. The permanent domain matches 46/46
exact published Git-object file hashes and all six custom/GitHub entry URLs
in output/berghain-artwork-canonical-verification.json. The isolated e75 test
code passes 6/6 actual canonical desktop/Android-portrait source/native sculpture,
controlled human and natural entrance/exit/refresh cases in
output/berghain-artwork-canonical-browser/report.json. This supersedes the
earlier pending deployment notes; no physical-device evidence is implied.

### Lounge cost and causality evidence

Comparable cost reports: output/berghain-lounge-cost-before/report.json and
output/berghain-lounge-cost-final-after/report.json; comparison in
output/berghain-lounge-cost-comparison.json. Both pass 9/9: three cold contexts
per desktop/Android-emulated portrait/landscape, Chromium 151, DPR 2, local HTTP,
no throttling and identical Panorama viewpoint/movement. Baseline is the isolated
complete e75 published source, not a partial asset folder.

Ordinary viewer transfer 5,208,267→5,683,609B (+475,342B), with no GLB requested
until explicit download/inspection. Median ready ms desktop 839→915 (ranges
828–1717→873–1411), portrait 840→860 (820–922→850–982), landscape 880→876
(837–940→810–916). Median product-RAF p95 stays ≈14ms. All 18 runs stop issuing
frames when idle. One real-input sample per run yields median 12→12.2,15.6→19.6,
19.4→16.1ms; small shared-host samples do not establish a causal speedup or
physical Android/low-end GPU qualification. Additional decoded leather maps
are shared; source/native lifecycle checks require exactly 18 texture disposals.

Causal map: real keyboard/touch motion → moveVisitor ramp support → actual
visitor floor 16.35m → syncLoungeRoom updates selector/location/source confidence
→ scheduled Pretext remeasurement. Programmatic selector synchronization does
not dispatch the room-selection event or teleport the visitor. Matching real
input routes prove ascent, room entry, label update, descent and lower-label
restoration in all three layouts; initial Panorama selection is a diagnostic
shortcut, and natural building entry is independently checked. No story/mission
state changes. The full architectural and artwork fidelity goal remains open.

Publication-byte audit: all 68 frozen files are compared to the prepared Git tree
in output/berghain-lounge-publication-byte-audit.json. 66 match exactly; only
PROVENANCE.md line endings and the unchanged shared level-transitions.js trailing
blank differ, with normalized text identical. No model/render/navigation semantic
change is bridged by that exception. The coherent commit is based on a2b23ae,
preserving the unrelated street-character publications and the original primary
index. Publication includes only 29 scoped paths, original meshes/maps, tests and
owning notes; research downloads/output are excluded.

### Upper lounge publication — immutable public acceptance

Commit a9fff2952ebb6ecb6106cb2f1f7a82668137cfcd is pushed by normal fast-forward
on parent a2b23ae96db0a2b5ee71be4928480577935efeb8. Publication audit now names
that final commit/tree: 66/68 frozen source bytes exact, with only the two
previously documented normalized-text differences. Primary staged index remains
704aa6efaa460b62afae0eb826c95ec075c54aff3b91b61dd4a5f6f00ecb2105.

All 50 actual versioned public asset/viewer files exactly match published Git
objects in output/berghain-lounge-immutable-verification.json. Actual public
headless desktop and Android portrait emulation pass 6/6 in
output/berghain-lounge-immutable-browser/report.json: natural door approach,
entry/exit/refresh, original source/native lounge, and real controlled-human
walking along the connected upper stair route with correct room labels.
Suite output/berghain-lounge-published-suite.mjs binds source hashes to the
published commit. Tests are silent and sequential; no physical-device or
perceived-audio claim. Source/native desktop image inspected after publication.

Versioned preview:
https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/a9fff2952ebb6ecb6106cb2f1f7a82668137cfcd/geheim/index.html

Pages run 40015938981 is pending behind 40015364952, whose current step is
Check neighbor voice authoring and staged assets. Do not cancel unrelated
publication. The permanent URL already has a controlled visitor/natural entry,
but the new upper lounge is not canonical until its 68607e GLB, upper-lounge
module and six real public cases are verified on germanysimulator.de. Canonical
check is the next publication step. Full realistic asset remains incomplete.

## Panorama ceiling and services — revised integrated candidate

Base a9fff2952ebb6ecb6106cb2f1f7a82668137cfcd. Primary staged index is preserved
704aa6efaa460b62afae0eb826c95ec075c54aff3b91b61dd4a5f6f00ecb2105. This goal
turn is PROGRESS: new source-derived ceiling/services geometry, export and
independent repair evidence. Full-building completion remains unproven.

I19 actual architect gallery views 15/16 inform pale staggered acoustic clouds,
transverse beams, cast radiators and visible conduit/tube fittings. Earlier
switchgear bar/cabins01/03/04/05 are not inserted into the contemporary base;
A13 documents a 2010 counter redesign, so the gallery is not one dated survey.
No photograph or external mesh is embedded. Counts, positions, floor 13.25 m and
soffit 17.95 m (4.70m clear) remain authoring estimates. No acoustic simulation.

The 72-file freeze is output/berghain-services-candidate.json. Final source and
native GLB geometry: 23,659,832 B, 238,560 triangles, 99 mesh/material groups, 18 shared
original maps (4,219,348 embedded PNG bytes), unchanged calibrated exterior bounds.
GLB SHA-256 88e63d565d8ddc93a8d404f532ca74f5a5bff45d0ce2defd40ea8e28f0d32fa8.
Six fixtures are added, bringing the source/native inventory to 42. The stale
sound-playtest count 35 predated the lounge addition; it now checks exact 42,
while equipment remains exact 44 and artworks 1. No assertion is disabled.

Observed RED tests covered missing architecture, cloud/beam intersections and
actual low-metal body penetration. Revised focused Node suite passes 61/61.
Sixteen clouds now avoid all three beams; fresh independent minimum AABB gap
.237m, lowest cloud17.50m and top .15m below ceiling underside. A 1.80 m person on
13.25m floor has 2.45 m cloud head clearance. Lowest intentionally uncollided new
fitting is diffuser end cap 15.31 m: .26m above standing head 15.05 m.

Physics review found missing thin-conduit collision and a .045m full-body
penetration at radiator valves. Repairs give each radiator 32 linked solids
(24 ribs, 2 headers, 2 feet, 2 supply pipes, 2 valves) and each of two tube fixtures 2 rod +
6 clamp solids. All 112 solids enclose all 3,832 transformed box/cylinder vertices;
max outside 0. Fresh rejected overlap centers and zero-input recovery are legal.
The body-clear window aisle remains connected, with minimum legal-center span
.86 author m (approximately 1.30 m physical clearance including body diameter).
All four actual production stairs ascend/descend legally in fresh CPU probes.

Browser evidence is sequential, headless and muted before navigation:
- output/berghain-services-pilot-browser:1/2; the initial route hit an existing
  column, retained as failed diagnostic. Routing around the column/DJ table
  passes1/1 in output/berghain-services-route-browser. Those are pre-final.
- output/berghain-services-final-browser/report.json:28/28 on the saved
  pre-collision freeze. It covers source/native services/lounge, all3layouts,
  natural entrance, stairs, lifecycle, texture failure,18shared-map disposal,
  furniture/artwork/speakers. It cannot clear the later contact repairs.
- output/berghain-services-repaired-browser/report.json:15/15 with exact72
  accepted collision-candidate hashes, covering all3layouts at the new service
  geometry/window aisle, upper route, entry/exit and existing furniture/art avatar.
- Camera review found the initial native radiator image was aimed at the wall.
  The sole subsequent change is test framing: use the clear approach1.15m away
  and pitch−.75. Production bytes, geometry and collision are unchanged.
  output/berghain-services-native-detail-browser/report.json passes3/3 with
  all72current hashes and genuinely visible native radiator detail.
- output/berghain-services-overlook-browser/report.json passes3/3 on the same
  current72hashes: real upper-rail approach and downward look, full human,
  editable/native lower-room ceiling relation in desktop/portrait/landscape.

The old28, repaired15 and final detail/overlook evidence are not one undated
current-hash run. The sole test-framing bridge is preserved against
output/berghain-services-collision-candidate.json; independent Physics explicitly
rebinds it and passes P1/P2/P4/P5/scopedX1. Camera final visual verdict was pending
at that checkpoint; final acceptance below supersedes it. Physical Android/device GPU and listening NOT RUN. General
photographic fidelity, real ceiling elevations, contemporary fixture inventory,
full art/remaining-room geometry and measured circulation remain incomplete.

### Final services acceptance and measured cost

Both required independent reviewers accept the final 72-file candidate.
Physics P1/P2/P4/P5/scoped X1 PASS: fresh 61 Node tests, repaired low-metal
contacts and continuous aisle/four-stair probes. Camera C1–C5/scoped X1 PASS:
fresh 20 Node tests, actual matrices/bounds, inspected source photographs and
all supplied final source/native/radiator/overlook frames in three layouts.
Current detail/overlook reports match all 72 hashes; the 15-case report is
bridged solely across its later test-camera framing change. Earlier blank
radiator frames are explicitly invalid for native-detail visual acceptance.
No physical Android, device-GPU or perceptual listening evidence is implied.

Comparable local reports output/berghain-services-cost-before/report.json and
output/berghain-services-cost-after/report.json each pass 9/9: three cold
contexts per desktop/Android-emulated portrait/landscape, same view/input,
Chromium 151, DPR 2, local HTTP with no throttling, shared host. The baseline is
an isolated complete a9fff29 runtime (91 files), reusing the prior pinned
baseline plus exact published lounge blobs. Comparison data is in
output/berghain-services-cost-comparison.json.

Ordinary viewer transfer 5,683,608 to 5,686,614 bytes (+3,006); no GLB is fetched
by ordinary viewing. The optional export grows by 270,192 bytes. Median ready
milliseconds: desktop 872 to 1044 (ranges845–1492/896–1401); portrait885 to895
(873–904/852–1087); landscape840 to922 (840–844/872–997). Product RAF p95 stays
about 14 ms; all 18 runs stop continuing frames while idle. Median single-input
sample per run: desktop11.9 to12.9ms, portrait17.8 to18.4ms, landscape20.2 to15.1ms.
Overlapping shared-host timings and three samples do not prove a causal speedup
or physical low-end-GPU qualification. Draw calls increase by 2 per viewport
(including shadow passes); source asset groups increase 98 to 99. Texture count
and embedded bytes remain 18 / 4,219,348. No added renderer, dependency or loop.

Causal scope: source-derived solid ceiling/panels/low metal → existing layout
solids → moveVisitor full-body exclusion/recovery → existing displacement-driven
avatar/camera. Renderer and collision use the same part matrices; GLB exports
the same visible geometry. The physics repair changes only solids, so the
exported GLB stays byte-identical. No story/mission/audio dependency changes.

### Services publication — immutable public acceptance

Commit851567d3e92efe1c7b50106d352adb73f66f3101 is pushed by normal fast-forward
on a9fff2952ebb6ecb6106cb2f1f7a82668137cfcd; its16 changed paths contain only
this scoped source/GLB/tests and owning notes. Primary original index is intact.
output/berghain-services-publication-byte-audit.json compares all72 frozen files:
70exact; PROVENANCE.md line endings and unchanged level-transitions.js trailing
blank are normalized-text equivalent. No runtime semantic change is bridged.

All51 actual versioned public asset/viewer/catalogue files exactly match the
published Git objects in output/berghain-services-immutable-verification.json.
Actual public desktop and Android portrait emulation pass6/6 in
output/berghain-services-immutable-browser/report.json: natural human approach,
door entry/exit/refresh; original source/native ceiling; real keyboard/touch
route around column/DJ table, radiator contact and genuinely visible native
radiator detail. Source hashes bind to actual published Git blobs. Silent,
headless, sequential; no physical-device or perceived-audio evidence.

Latest verified versioned preview:
https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/851567d3e92efe1c7b50106d352adb73f66f3101/geheim/index.html

Pages40020726888 is pending behind40015364952. GitHub's existing concurrency
policy automatically canceled/superseded the pending a9 lounge run40015938981
when this descendant was pushed; this chat did not cancel an unrelated run.
The new commit preserves the lounge. Do not call its new ceiling/lower services
canonical until the permanent domain has GLB88e63d, panorama-services.mjs,
51 matching files, six root/3d/Geheim/model entry checks and actual public browser
cases. Previous e75-artwork canonical verification remains the accepted baseline.
The next safe publication action is to poll that exact live Pages handle and
verify the current deployment once terminal. No notes-only push is required.

Next modelling work remains the actual Klo Bar/toilets and Joseph Marr Together
placement/full sequence, Lab, complete artwork fidelity, contemporary equipment
and measured inter-room relationships. Begin with the existing primary artist
ART04 and architect toilet-refurbishment references, retaining evidence gaps.
No complete-asset or fully-realistic claim is established by this increment.

### Permanent Geheim request — fresh live acceptance

The permanent domain still serves accepted commit
e75b829a34e9d27187fcad0a831c5a8b3c34f196 while services Pages40020726888 is in
progress. Fresh output/berghain-geheim-current-canonical-verification.json passes
46/46 exact published files and six root/3d/Geheim/model entry responses.
output/berghain-geheim-canonical-live-browser/report.json passes2/2 real public
desktop and Android portrait-emulated flows: a visible controllable human starts
outside, keyboard/touch walks to the door, E/tap crosses continuously, movement
works inside, exit crosses the same doorway and refresh returns outdoors. Source
hashes bind to actual e75 Git blobs, not the newer local study. Tests were silent,
headless and sequential. Physical Android qualification remains NOT RUN.

This fulfills the requested live Geheim page and playable entrance at
https://germanysimulator.de/geheim/ . Latest lounge/services remain verified on
the851 versioned preview until canonical deployment passes its byte/flow checks.
No new world sources were changed for this acceptance, so it reuses the existing
independent physics/camera acceptance; no new world-review claim is made.

Subsequent local research-note correction: expanded primary ART04 photographs
identify I19's switchgear bar as Klo Bar, not an established older Panorama bar.
I21 and ART14 plus inspected image subsets are recorded in SOURCES/INTERIOR.
The851 production freeze and GLB are unchanged; their earlier switchgear-history
metadata needs correction at the next coherent asset regeneration. Notes-only
publication must not supersede the in-progress Pages deployment. Full model goal
remains active with Klo Bar/WC geometry, artwork fidelity and other rooms missing.

## Klo Bar and sanitary architecture — final accepted increment

Current75-file candidate: output/berghain-klo-candidate.json, base851567d3.
GLB SHA256 cf26925ecb4a8a3d76ef88b2032dc5fabaf568bfa5a9c221ff9034645d15a0d4,
25,072,100B /257,772tri/108material-mesh groups/18original512px maps,
4,219,348embedded image bytes,67fixtures and44main PA components. Building
bounds unchanged. Sources ART04/ART14/I19/I21; catalogue102unique IDs. Klo Bar
identity is corrected using the artist's wide in-situ photographs. Reference
downloads remain research-only and excluded from the build.

Original geometry adds the red switchgear-framed bar/cases/gate/back/stools,
four steel cubicles/two open doors, hollow pans, flush plates/paper holders,
protected tube lights and lit upper mesh transoms, double-sided trough/taps/
traps, caged lights/dryers and floor grates. Room arrangement, floor assignment,
6.65m floor/9.8m ceiling, counts/dimensions and contemporary retention are
estimated. I21 mixes2009/2013/2015 projects. Together figures remain absent.

Fresh full focused Node matrix69/69 PASS. Test-first evidence caught missing
rooms and the deeper wash-core recovery case. That repair replaces its redundant
piece barriers with one existing conservative assembly box; movement code and
visible mesh are unchanged. Exact invalid core center now recovers0.9885m;
independent25/25 invalid grid starts recover legally. All3,088 core vertices
fit its collider to4.2e-7m float32 tolerance. Body-clear corridor/open cubicle/
return, blocked closed doors, actual furniture contacts and all four stair
routes remain legal.

Independent Physics P1/P2/P4/P5/scopedX1 PASS,75/75 hashes; latest focused26/26
tests plus prior full69/69. Independent Camera C1–C5/scopedX1 PASS,75/75 hashes,
fresh20/20 scoped checks, actual matrix bounds and supplied final frames.
Bar9.9725×3.055×3.4225m; stool.525×.7485×.525m; wash core2.8×2.9075×1.415m.
Room clear3.15m versus1.80m avatar; lowest transom rail9.2525m leaves.8025m above
standing head. These dimensions are authoring estimates, not source measurements.

Current visual/default-view/text evidence:
output/berghain-klo-transom-browser/report.json PASS4/4: actual source/native bar
and oblique wash-core/cubicle views on desktop and Android portrait/landscape
emulation, plus320px/740px and200% label states. All53captured runtime hashes
match the75freeze. Source/native visibility, open mesh and hollow pan geometry
are inspected. The earlier head-on blank-core default view is rejected; the
final oblique view shows core and cubicles together (narrow portrait shows the
first two stalls; desktop/landscape all four).

Route evidence output/berghain-klo-repaired-browser/report.json PASS7/7 covers
real mouse/keyboard or touch route from main-floor shortcut, under the high
Panorama stair, through Klo Bar, around the return into the toilet corridor,
inside an open cubicle and back; natural labels follow calibrated footprints.
The exact accepted collision freeze is output/berghain-klo-recovery-candidate.json.
Its5subsequent changes add only overhead mesh/default selector framing, export/
manifest and test assertions. Current4/4 covers those visual changes; the old
route is bridge evidence, not current-hash route evidence. Broader existing-flow
output/berghain-klo-regression-browser/report.json PASS18/18 predates the local
core collision repair and transoms; it covers unchanged entrance/lifecycle,
upper lounge/stair, Panorama ceiling, speakers and furniture. Both reviewers
explicitly bound that bridge. No old report is represented as a fresh full hash.

Comparable cost reports output/berghain-klo-cost-before/report.json and after
each PASS9/9: three cold contexts per desktop/portrait/landscape, complete pinned
851runtime, same local HTTP/Chromium151/DPR2 and Panorama camera/input path,
no throttling, shared host. Comparison output/berghain-klo-cost-comparison.json.
Normal transfer5,686,613→5,699,948B (+13,335); no ordinary GLB request. Optional
GLB grows1,412,268B. Ready medians/ranges ms: desktop1113(874–1489)→1076(926–1465),
portrait849(845–907)→892(864–916), landscape852(820–854)→906(858–912). Product RAF
p95 stays13.9–14.1ms. Single-input medians12.3→11.9/17.9→16.5/17.1→18.3ms;
three samples/shared-host variation do not establish a causal speedup. Draw calls
rise14–15 including shadow passes; groups99→108. All18idle probes add0frames.
This path measures global room-geometry cost; it does not qualify every Klo view
or physical mobile GPUs. No new maps, renderer, library, cache or continuing loop.

Causal scope: observed architectural forms → common rendered layout/fixture
solids → existing moveVisitor full-body movement/recovery → displacement-driven
human/camera and footprint-based room label. Room selectors are explicitly
shortcuts; exterior doorway is separately exercised. No story/audio/mission gate
changes. Tests are silent/headless/sequential. Physical Android/GPU/listening
NOT RUN. Full photographic realism, Together/all artwork, exact contemporary
room connections, Lab/service/cabin spaces and measured interior geometry remain
required. Both reviewers accept this bounded increment; full goal remains active.

### Klo publication — immutable public acceptance

Commitc8babb806a484932f441ad3bb94f5de47145f551 pushed by normal fast-forward on
defd99867ef373831ff3b320a711a013a9e7e4ef. Its22paths contain only this scoped
asset/runtime/tests and owning notes. It preserves concurrent street animation
and CI-timeout work. Primary original index SHA256 remains704aa6ef…b2105.
Publication tree7498f60198a702f5fb0203b81aa0509862ebdbc4 matches73/75 frozen
bytes exactly; PROVENANCE line endings and untouched level-transitions trailing
blank are normalized-text equivalent. No runtime semantic change is bridged.

output/berghain-klo-immutable-verification.json passes52/52 actual public asset/
viewer/catalogue files against Git-object bytes. Actual published desktop and
Android portrait emulation pass6/6 in output/berghain-klo-immutable-browser/report.json:
natural human exterior approach/door entry/exit/refresh; source/native Klo Bar
and oblique sanitary architecture; real continuous main-floor/bar/toilet/open-
cubicle/return route, natural labels, visible human and actual native hollow pan.
All75 reported source hashes bind to actual published Git objects. Final public
frames were inspected. Silent/headless/sequential; physical Android/GPU and
perceptual listening remain NOT RUN.

Latest verified versioned preview:
https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/c8babb806a484932f441ad3bb94f5de47145f551/geheim/index.html

Previous851release now has permanent-domain acceptance:51/51 exact files plus
six entry URL checks in output/berghain-services-canonical-deployed-verification.json;
six actual public desktop/portrait entrance, ceiling and radiator cases pass in
output/berghain-services-canonical-deployed-browser/report.json. Pages40020726888
completed SUCCESS. The new Klo Pages handle40027742985 is confirmed in progress.
Do not call Klo/WC canonical until its52files/GLBcf26925e and actual public cases
match on the permanent domain. Never restart because an observation expires.
No notes-only push is needed while the scoped deployment is running.

Next fidelity task: Together's actual figure sequence and case returns. New
artist installation views07–11 and work12 were inspected after publication.
They show tightly overlapping reclined/embracing human forms, heads and hands
in the translucent amber surface, and glazed
cases turning around the counter with an inner rear display. Existing cases
remain approximate; these views require refinement before placing the frieze.
No full sequence/order/individual dimensions is yet verified. Keep the broader
building/artwork goal active; initial room architecture is not completion.

### Klo permanent-domain acceptance and rejected Together study — 24 October 2026

Pages40027742985 completed SUCCESS. The canonical permanent page now has fresh
acceptance for c8babb806a484932f441ad3bb94f5de47145f551:
output/berghain-klo-canonical-verification.json passes52/52 exact Git-object
asset/viewer/catalogue bytes and six root/3d/Geheim/model HTTP responses.
output/berghain-klo-canonical-browser/report.json passes6/6 actual public desktop
and Android portrait emulation cases: natural human exterior approach, doorway
entry/exit/refresh, source/native Klo/WC views, and continuous main-floor/bar/
toilet/open-cubicle/return movement. The c8-only suite imports the preserved
baseline independently of the unpublished artwork changes. No physical-device
or perceptual-listening claim. This supersedes the pending c8 deployment above.

ART15 corrects the earlier clothing interpretation: the subjects are nude adult
men, interwoven with scanned Baroque architectural ornament. ART16 describes the
scan/cast process but offers paper prints, not a downloadable sculpture model.
All24 ART04 views remain research-only, with no photographic textures shipped.

The unpublished procedural Together study passes17/17 scoped structural tests
and1/1 in output/berghain-marr-first-browser/report.json. Visual inspection of
all three source/native frames REJECTS its fidelity: mechanical separated body
parts, rigid slab-like base and opaque brown appearance. These results approve
neither anatomy nor artwork resemblance; no release candidate is frozen and no
new specialist acceptance or publication is claimed.

A generic CC0 MakeHuman anatomical study is now downloaded with explicit
per-file licence/header and SHA256 evidence under R01. No application source
was imported. output/marr-anatomy-study.py performs original offline weighted
posing from those data. Two torso studies have10438vertices/20832triangles each;
their1/1 silent headless inspection is output/marr-anatomy-inspection/report.json.
Both actual frames were inspected: continuity/hands improve on primitive parts,
but cut boundaries, reference pose/face framing, fusion with the cast, ornament,
bubbles and transmitted backlight remain unresolved. This is authoring evidence
only, not a shipping asset, complete sculpture or public-runtime change.


### Partial Together relief and portable amber acceptance — 24 October 2026

This supersedes the rejected primitive prototype above, not the remaining full
artwork/building goal. Final output/berghain-marr-candidate.json freezes91files;
owning notes and CREDITS are maintained separately. Original offline posing of
explicitly CC0 MakeHuman core data produces two closed/wound anatomical relief
bases,10440vertices/20876triangles each. Pinned inputs and full asset licence
ship in anatomy-provenance.json and licenses/MakeHuman-CC0.txt. No MakeHuman
application code, artist scans, photo pixels or raw authoring input is shipped.
Four sections contain nine authored generic figures (2+4+2+1); exact real count,
complete narrative order, likeness and dimensions remain unverified.

GLB35,996,040B /467,408triangles /113mesh-material groups /22embedded maps,
SHA256d5e2a864733c82a707da41c43e8eba91acf7515f5fa84166f6598a0208e59c5b.
Bounds remain unchanged;67fixtures,44main PA components,2artworks. All18prior
PBR maps retain their hashes. Original amber maps add microbubbles/coat normals;
a1024x1024 UV1/G thickness atlas estimates the authored relief's vertical
envelope. Standard KHR transmission/volume/ior/clearcoat preserve optical
fields in the GLB. Reflection-panel PNG is an original viewer environment aid,
not embedded HDR evidence or a measured lighting survey. Rebuilding the anatomy
module reproduces its hash. Full artist composition, masks/animal ornament,
complex pose fusion and darker cola mottling remain visibly incomplete.

All74 scoped Node tests pass in output/berghain-marr-node-final.txt. Initial
close-view source/native parity FAILED (mean RGB3.9367/255): the exporter
incorrectly forced double-sided rendering for transparent glass. A red
regression test demonstrated it; exporter now preserves the actual source side.
The same unchanged1-RGB-level/1.5%-large-delta tolerances pass: meanRGB.36818,
pixels differing>32 levels.0835%, all23textures disposed exactly once.

Exact final output/berghain-marr-half-integrated-browser/report.json passes
20/20,91/91 source hashes matching the final freeze: source/native art/cases,
controlled close detail, strict material parity, Klo/sanitary views, continuous
human main-floor/bar/WC/open-cubicle/return route,320px/200% labels, natural
Geheim exterior approach and E/tap entry/exit/refresh, and Panorama lounge.
Desktop/Android portrait/landscape emulation, silent/headless/sequential.
Controlled native detail uses its own renderer; actual viewer close frames
separately verify the product transmission setting. Physical Android/device
GPU and perceptual listening NOT RUN.

Both independent reviewers rehash all91files and accept final scoped technical
checks: Physics P1/P2/P4/P5/X1 and Camera C1–C5/X1 PASS. Actual149,612 transformed
relief vertices have zero glass/bar-boundary violations and introduce no art
colliders. Lids clear by at least.0619m; the nested rear base expands the existing
bar assembly edge by.0075m. All25 deep rear-base invalid starts recover to a
canStand position. Same-floor routes and visible human remain valid. Figure
world heights are.221m above the case beds,.95–1.19m above the6.65m floor,
compared with the1.80m avatar; proportions/placement remain provisional.

Cost was measured on the identical case-facing approach, three cold contexts
per viewport, Chromium151.0.7922.34/Intel Iris Xe D3D11, no CPU throttling. Before9/9:
output/berghain-marr-cost-before/report.json. Initial full-transmission after9/9:
output/berghain-marr-cost-after/report.json. These functional passes did NOT
accept the desktop frame-p95 regression14.1→48.4ms. A diagnostic isolated the
transmission background pass. Product viewer now uses Three.js
transmissionResolutionScale=.5: quarter-area background capture, unchanged main
buffer/geometry/specular and normal shading. Actual final9/9:
output/berghain-marr-cost-half-final/report.json,91/91 frozen source hashes.
Final three-sample median p95 is20.9ms desktop,20.8ms portrait/landscape; baseline
14.1/13.9/13.9ms. Desktop final range20.9–21.0ms. This retains roughly6.8–6.9ms
overhead and is not a60fps or physical-device qualification.

Cold-ready medians desktop952→1373ms (final1368–3225), portrait940→1387
(1326–1527), landscape895→1347(1302–1350). Input-latency medians16→22.7ms,
19.9→23.0ms,16.6→26.1ms respectively. Normal transfer5,699,947→6,653,006B,
53→61requests,18→23textures; optional GLB adds10,923,940B and is not fetched by
the ordinary viewer. Desktop draw calls228→340,triangles429,588→811,768;
portrait223→329/426,948→759,520;landscape231→345/434,712→822,004.
Idle adds zero frames across all before/initial/final samples and main buffer
stays under1.6MP. Observed JS heaps are variable, about35–61MB baseline and
38–81MB final; these do not measure total process or GPU memory. Publication
must preserve these limits and bind final assets/controls to actual public bytes.
The full photographic reconstruction goal remains ACTIVE.

### Partial Together publication binding

Runtime/asset commit80c66603bcb3a401968e11a351e553230bbf12b0 is a normal
fast-forward on eb00e1ea9d532afe30daa10c4ef016dad021b073. Tree
e519bdd88af62ddd86bbd5cdb5725b72003d6e2f contains41scoped paths, including only
the new Marr paragraph in remote CREDITS. Original primary index SHA256 remains
704aa6efaa460b62afae0eb826c95ec075c54aff3b91b61dd4a5f6f00ecb2105.
All89/91 frozen files are byte-exact in the publication; PROVENANCE line endings
and untouched level-transitions trailing blank are normalized-text bridges.

output/berghain-marr-immutable-verification.json passes63/63 exact published
files against Git objects. Actual versioned public browser report
output/berghain-marr-immutable-browser/report.json passes9/9 on desktop and
Android portrait emulation: source/native Together/bar/toilets, unchanged strict
material parity, continuous main-floor/WC/open-cubicle/return human movement and
natural outside approach, E/tap entry/exit and refresh. All91 recorded source
hashes bind to actual published Git bytes; actual public frames were inspected.
Permanent-domain deployment is tracked by Pages40037731294; do not equate the
versioned preview with completed canonical deployment. Final canonical evidence
belongs in output/berghain-marr-canonical-verification.json,
output/berghain-marr-canonical-browser/report.json and the release record.
This follow-up only corrects inventory/handoff notes; runtime/art bytes remain
identical and the full photographic goal remains ACTIVE.

### Partial Together permanent-domain acceptance

Pages40037731294 completed SUCCESS for80c66603bcb3a401968e11a351e553230bbf12b0.
output/berghain-marr-canonical-verification.json passes63/63 exact published
asset/viewer/catalogue files against actual Git bytes, including the35,996,040B
GLBd5e2a864…, plus six successful root/3d/Geheim/model URL responses.
output/berghain-marr-canonical-browser/report.json passes9/9 fresh actual public
desktop/Android portrait-emulation cases: source/native Together and Klo/WC,
strict material parity, continuous human main-floor/bar/WC/open-cubicle/return
movement, and natural exterior approach/E-or-tap entry/exit/refresh. All91
source hashes bind to the actual published Git objects. Actual canonical
frames were inspected. Silent/headless/sequential; no physical-device or
perceptual-listening claim. This supersedes the pending canonical gate above.

Three further primary references (ART17–19) expand the catalogue105→108 and
improve Bisky/Göthe constraints without adding speculative artwork. The browser
version in the cost record is corrected to the reports'151.0.7922.34; the earlier
154 label was a documentation error, not a different cost run. These notes and
catalogue updates change no frozen runtime/art/test byte. A later notes-only
deployment does not invalidate the verified80c6660 model; its changed Markdown
must be distinguished from already-deployed model assets. Full fidelity remains
unaccepted and the broader reconstruction goal remains ACTIVE.
