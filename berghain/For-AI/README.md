# Berghain reconstruction: goal and work state

## Accepted Panorama acoustic-panel forms — 26 October 2026

I11 and I19/15/16 show square, broad and elongated acoustic bodies with differing
depths. The repeated form now uses those families at sixteen retained provisional
horizontal anchors. Lower faces remain fixed for equipment clearance; thicker
bodies extend upward. Dimensions, per-anchor assignment and current inventory
remain estimates; this is not a recovered complete rig layout.

All 280 integrated Node checks and nine root browser cases pass, with independent
Physics/Camera review and six matched cost spot checks. Room/floor/private
boundaries, equipment and runtime lights remain exact. Ten inherited fixture/
cloud contacts remain unresolved fitting details, not validated supports.
Physical Android is untested.
Actual ceiling radiance is regenerated; a larger encoding range prevents clipping
without changing authored light output. Full goal remains ACTIVE. Publication is
verified separately by output/berghain-panorama-panel-forms-release.json.

## Accepted Panorama acoustic-ceiling wash — 26 October 2026

The newly inspected I11 installer photograph shows coloured ceiling wash behind
Panorama acoustic elements; I19/15/16 show their pale daylight finish. One
original 512×512 fixed red radiance map now follows the existing registered
ceiling and panels. All geometry, collision, routes, instance colours, existing
images and runtime lights are preserved. Top/edge faces sample black; failed
texture loading retains nonluminous plaster. The wash persists in neutral/day
views too: it is a fixed authored state, not an automatic lighting program.

The combined 275 Node checks, nine route/comparison browser cases, independent
Physics/Camera review and six matched cost spot checks pass within scope. Final
LF packaging also passes 26 affected checks and three fresh ceiling comparisons. Physical Android remains
untested. Exact cove construction, photometry, current inventory and full panel
arrangement remain unverified. Beam shadows, moving occlusion and indirect room
spill are not included. Full reconstruction remains ACTIVE. Publication is
verified separately by output/berghain-panorama-ceiling-wash-release.json.

## Accepted low foyer platform study — 26 October 2026

Karhard G08/G20/G25 show freestanding low boxes near the main staircase,
with dark sides, contrasting fine patterned tops and small fasteners. Three
forms are fitted to the retained stair bay. The earlier phrase “padded blocks”
overstated material evidence: upholstery is not established. These are separate
from the 2015 BauBuche event benches. Exact placement, dimensions, material,
inventory and current retention remain unverified. Full reconstruction stays
ACTIVE. All 271 Node checks and nine root browser cases pass within scope,
with independent Physics/Camera reviews and six matched cost contexts.
Publication is verified separately in output/berghain-foyer-platforms-release.json.
No new texture image, lighting fixture or private-room arrangement is added.


## Accepted main-bar wall wash — 26 October 2026

Karhard G12/G14 show light spreading from the base of the pilasters and fading
up the historic facade. The existing six fixtures now use wider, fully soft
cones; the five tall-wall fixtures use lower peak intensity. The fixture below
the Eisbar slab retains its bounded aim, range and intensity. No room layout,
geometry, materials, cue positions, shadow maps or runtime light count changes.
This is a fitted appearance study, not measured contemporary photometry.
The full reconstruction goal stays ACTIVE. Source limits remain in SOURCES.md
and the existing Karhard mapping. Validation is recorded separately in
output/berghain-bar-wash-*. All 268 Node checks, nine root browser cases,
independent Physics/Camera reviews and eighteen matched cost contexts pass
within scope. Physical Android remains NOT RUN. Public verification is
recorded separately in output/berghain-bar-wash-release.json.


## Accepted main-bar ribbed luminous blocks — 26 October 2026

The photographed two rows now retain separate amber apertures around the
rounded return. Original procedural maps add fine ribs and edge detail using
authored per-block UVs in the live model and standard GLB. The four shared
512px maps total 101,120 bytes; the model loses 5,504 triangles. Existing
counter/stool geometry, physical routes, room layout and lights are unchanged.
This is an estimated backlit-surface study: block inventory, exact dimensions,
glass transmission, surrounding spill and current photometry remain open.

The full reconstruction goal stays ACTIVE. Current/private plans, lift
registration, inventories and complete photographic detail remain unresolved.
I13/E05 now record the unsuccessful After Hours playback checks; no footage
or new current-room coordinates are claimed. Source notes and validation live
in SOURCES.md, INTERIOR.md and VALIDATION.md. Local acceptance/publication
receipts use output/berghain-bar-glass-*. All 267 Node checks and ten desktop/mobile-emulated browser cases pass. Eighteen matched performance contexts and independent Physics/Camera reviews pass within scope. Physical Android remains NOT RUN. Deployment verification is recorded separately in output/berghain-bar-glass-release.json.


## Accepted fixed Säule column wash — 26 October 2026

A15/I24 show continuous concealed light above and below dark column bands.
The eight registered pier bodies now carry an original fixed radiance bake
from rectangular emitters aligned with their existing recessed lenses. Existing
room cues remain live. No additional runtime lights, timers, triangles or solid
objects are introduced. One 1024 × 4096 RGB atlas adds 4,528,960 image bytes;
the portable GLB uses standard emissive texture/UV and emissive-strength fields.
This texture stores precomputed reflected light, not luminous concrete.

Intensity, colour and material response are visual estimates. The bake includes
rough view-normal specular response; it cannot respond to moving occluders,
changing fixture colour or fixture switching. Surrounding static cast shadows, nearby furniture, ceiling/floor spill and
indirect bounce are not baked. Source photographs do not establish
current lighting operation. An atlas-load failure retains the previous
nonluminous material fallback. These are explicit fidelity limits.

`node tools/test-browser.mjs quick --suite berghain/build-belt-lighting.mjs --root .`
rebuilds the atlas in an isolated silent browser through the existing harness;
then run `node berghain/export-model.mjs`. The generator excludes the previous
bake and records source hashes, face registration and output clipping in
`textures/saule-belt-bake-manifest.json`. Pinned Three area-light helpers are
used only for authoring; the visitor runtime does not import them.

The full reconstruction goal remains ACTIVE. Exact private plans, lift
registration, current room/equipment inventories, selected-date artwork and
complete photographic detail remain unverified. This correction is not a
verified digital twin. V6 passes 263 Node checks. Thirteen V5 browser cases transfer through an exact
executable-text/binary bridge after line-ending normalization; the V6 baker
regenerates the exact image and GLB. A fresh independent V6 camera walkthrough,
18 matched cost contexts and both independent reviews pass within scope.
Release cleanup removes two trailing blank lines and refreshes the bake input
hashes through actual regeneration. The atlas and GLB remain exact; eight
focused material/export/fallback checks pass on the cleaned release.
Physical Android remains NOT RUN. Frozen acceptance and deployment are separate:
output/berghain-saule-belt-candidate-v6.json and
output/berghain-saule-belt-release.json.


## Accepted main-bar plaster and Säule concrete — 26 October 2026

I23 main-bar photographs support mostly continuous pale plaster with localized
scars and streaking; A15/I24 support rougher eroded cast concrete in Säule.
Two original 512-pixel PBR families distinguish these finishes. Tile scale,
patch position and relief are estimates, not a registered scan. No photo pixels
are copied. The new concrete finish and neutral tint apply only to interior
Säule batches; Halle and Lab retain their previous maps and palette.

The shared live-model normal maps now follow the tangent-free GLB loader's
negative-Y convention, including clearcoat. This fixes a demonstrated shading
disagreement without changing geometry. All 17,256 parts, 6,169 solids, floors,
viewpoints and light definitions remain exact. Eight export groups have changed
UV scale; all positions, normals, instance colors and indices remain exact.
The export retains 837,388 triangles and 226 groups, with 31 embedded textures.
The viewer loads 32 textures including the shared reflection map.

V1 was rejected for dense plaster mottling. V2 exposed an unintended Halle
material change, which V3 removes. V4 corrects only a test's omitted existing
structure/labWall expectation; its runtime/export/browser suite is byte-identical
to V3. V4 passes all 259 Node tests. Fifteen frozen V3 browser cases cover broad
source/native comparisons and actual loaded/fallback round trips across desktop
and Android portrait/landscape emulation, including desktop context recovery.
Matched costs and independent Physics/Camera reviews pass. Physical Android
NOT RUN. Rejected evidence is preserved; no failed candidate is accepted.

Frozen acceptance: output/berghain-mineral-surfaces-candidate-v4.json.
Deployment is verified separately in output/berghain-mineral-surfaces-release.json.
The full goal remains ACTIVE: source-specific Säule belt wash, private plans,
lift registration, selected-date artwork and broader photographic fidelity
remain open. This is a source-informed improvement, not a verified digital twin.

## Accepted upper-lounge form correction — 25 October 2026

Karhard's expanded Panorama image 19 supports faceted dark/plum seats, a partial
offset back attached to the long chaise, recessed supports and dark overhead
forms. Original geometry now represents these features. The chaise follows the
glazed wall; the rear chair fits a connected window-side route. Ceiling forms
meet the slab and retain at least 2.12 m actual headroom. Their technical purpose
and designer are unverified. Image 08 shows an earlier furniture configuration.

Dimensions, arrangement, ceiling count and current retention remain estimates.
No photographic pixels or printed glass artwork are reproduced. The upper
sanitary partition, other rooms and public/private connections are retained.
All 17,230 non-lounge parts and 6,153 non-lounge solids are exact, as are floors,
viewpoints and retained lighting parameters. The new polygon footprints survive
both registration passes. Night cues reach the occupied floor/seating.

V1 was rejected for a chaise/glass intrusion; V2 for a chair overlap and a
blocked rear area. V3 fits whole assemblies and validates the complete route
through the window-side seating and back. Both rejected versions remain local
evidence. V3 passed 258 Node tests; V4 corrects only the descriptive back height from
1.05 m to the actual 1.06 m. Its GLB differs by one JSON byte; geometry, materials
and textures are exact. Fourteen fresh metadata-affected tests pass. Seven
frozen V3 browser cases, matched three-sample
cost checks per desktop/Android-emulated profile and both independent reviews
pass within scope. Physical Android was NOT RUN.

The GLB has 837,388 triangles, 226 groups and 25 embedded textures: 44 fewer triangles,
one additional group and 6,424 fewer bytes than the published baseline. No new
runtime lights, timers or texture requests. Frozen evidence:
output/berghain-lounge-form-candidate-v4.json. Publication verification is
recorded separately in output/berghain-lounge-form-release.json.

The full goal remains ACTIVE. Exact private-room plans, lift registration,
current inventories, selected-date artwork and full photographic detail remain
open. The older AU table records baseline findings; accepted corrections above
supersede its old missing-stair/smoking/toilet/PA descriptions. Its unresolved
measurement/currentness limits still apply. The current source maps account
for the Karhard images; mapping alone does not establish complete reproduction.

## Accepted ordinary Panorama WC correction — 25 October 2026

The earlier single transverse bank is replaced by separate front/rear right
groups and an illustrative left group. Dated visitor accounts describe two
right groups of three in 2022 and three rear stalls past a column in 2026.
Two left cells, metric spacing and the straight bank remain estimates; this
does not establish the present total inventory or a surveyed floorplan.

The rear lining is lowered to a solid 1m parapet, revealing existing facade
glazing without opening a route beyond the supported floor. Its top masks
the lowest .15m of the existing sill; bay registration remains estimated.
Pans meet the floor; flush plates and rear casings meet calibrated back panels.
I21 supplies sanitary form vocabulary, with gallery floor/date unresolved.

All 17,155 non-WC parts and all retained floor, viewpoint and non-WC collision
data remain exact. The public entrance, upper urinals, lounge/slab, main Klo,
ground toilets, smoking connection and backstage boundaries are retained. The
third WC practical moves into the clear aisle; all three beam paths now reach
the floor. Light power, count and shadow budget are retained. Current single-use
assignments and queue policies are unverified.

All 252 distinct Node checks (229 unchanged plus 23 fresh affected checks), five
browser route/fallback/source-native cases, matched
three-sample cost checks on each desktop/Android-emulated profile and both
independent specialist reviews pass within scope. The export adds 2,604
triangles and 121,164 bytes, with the same 225 groups and 25 embedded textures; no new
lights, timers or texture requests. Physical Android NOT RUN. Frozen evidence:
output/berghain-panorama-wc-candidate-v2.json and its exact V1/V2 bridge. The
preserved V1 lighting failure is repaired; Halle's historical 20k allowance now
excludes WC instances and their old basis, with a separate 5k WC limit. Publication verification is
tracked separately in output/berghain-panorama-wc-release.json.

The full reconstruction goal remains ACTIVE. Private plans, current inventories,
selected-date artwork and comprehensive photographic fidelity remain unresolved.

## Accepted Panorama PA correction — 25 October 2026

This acceptance supersedes the pending draft entries below. The V3 product
replaces two hidden tower proxies with four articulated line-array studies
and six suspended double18 cabinet studies. All retained room connections,
lighting, public routes and main-floor PA remain unchanged.

The 2017 installer interview, manufacturer envelopes and later community
reports support different parts of this reconstruction. Current counts,
revisions, anchors, splay and support design remain inferred. Low-mid and DJ
monitor placement remain unresolved; no acoustic or structural capacity claim.

All 250 Node checks pass on the byte-identical V2 product/test sources; V3's
seven actual-input, fallback and source/native browser checks pass. Eighteen
matched cost contexts and both independent Physics/Camera reviews pass within
their recorded scope. Desktop frame-p95 medians are 20.7→20.9 ms; both Android
emulation profiles remain 7.1 ms. Normal load grows 11,178 bytes; the GLB adds
4,254,896 bytes and remains demand-loaded. Night views resolve silhouettes;
inspection lighting is needed for grille and mounting detail.

Frozen evidence: output/berghain-panorama-pa-candidate-v3.json and its V2/V3
bridge. Release assembly only prepends this status to four owning documents;
product, export and test bytes remain frozen. Deployment verification is a
separate gate recorded in output/berghain-panorama-pa-release.json. Physical
Android NOT RUN. The full goal remains ACTIVE: precise private-room plans,
current inventories and complete photographic fidelity remain unresolved.


## Panorama PA browser-route correction — V3

V3 retains every V2 product, native-asset and Node-test byte. Its browser route
steps0.5m farther from the close hang before looking up: the old test eye needed
1.156radians, just beyond the unchanged1.15radian look limit. Six V2 route cases
failed that helper assertion; the source/native render case passed. Those
results remain preserved. The product camera limit is unchanged.

All250 V2 Node checks pass and both specialists' V2 physical/native checks pass
within scope; exact hash bridging is required for V3. Fresh actual-input routes,
matched cost and final reviewer decisions remain pending. Current candidate:
output/berghain-panorama-pa-runtime-v3, freeze manifest candidate-v3.json.
Last verified public release remains6dd1f8c; full goal ACTIVE.


## Panorama PA geometry repair — V2

V1 remains preserved and rejected: its fully extruded perforations added nearly
100,000 triangles. V2 keeps real pierced grille sheets and recessed cabinet
backing, using two-sided sheet materials only for the two new PA grille batches.
This removes unseen3mm hole-edge quads without a new texture/rendering pipeline.
The final draft export is65,914,188bytes and834,828 triangles: +4,254,896bytes
and36,084 triangles against6dd1f8c, with225 groups and25 embedded textures.

The existing Halle guard still has its original limits; actual Panorama PA
instances now have a separate40,000-triangle/twelve-group cap. The solid-height
check now measures the standard torus envelope correctly. Three focused repair
checks pass. Full regression, actual source/native/day/night/fallback input,
matched browser cost and both independent specialist gates remain pending.

Frozen V2: output/berghain-panorama-pa-candidate-v2.json; runtime:
output/berghain-panorama-pa-runtime-v2. V1's249-test run had247 passes and two
failures; neither V1 nor V2 is accepted for publication yet. Preserve all V1
negative evidence, the last verified release and primary staged index. Goal ACTIVE.


## Panorama PA — active draft

The current accepted release is 6dd1f8c (suspended main subwoofers), verified
live on both entry pages and three desktop/Android-emulated profiles. AU18 is
now the active correction: four four-module Studt line-array form studies and
six provisional overhead double18-inch sub cabinets replace two hidden tall
boxes. Independent preaudits found the old proxies behind the DJ-end lining;
the new anchors fit the dance-room volume without moving architecture.

The 2017 installer interview supplies the dated inventory, manufacturer sheets
supply selected product envelopes, and 2025/2026 community reports support
later overhead/down-firing subs. These are separate evidence layers. Current
counts/revisions, exact anchors, splay, fasteners and rig capacity are unverified.
Low-mid placement and exact DJ-monitor models remain unresolved; no historical
floor sub wall or new unsupported private/public connection is added.

Candidate: output/berghain-panorama-pa-runtime, based on the accepted commit.
Source audit and independent preaudits: output/berghain-panorama-pa-*. Three
focused Node checks pass after repairing degenerate grille triangles and
choosing a baseline-clear crossing route. The draft lower sub rails were also
corrected to contact all six cabinets. Full regression, source/native pixels,
desktop/Android input, matched cost and frozen-candidate specialist reviews
remain pending. Do not publish or call this draft accepted. Physical Android
NOT RUN; full goal ACTIVE. Preserve prior immutable releases and staged index.


### Published suspended main subwoofers

Commit `6dd1f8cf03cf117a6e0bc64050f09f7592b6ecb1`; Pages run 40227040778 succeeded. All93 checked
public files match, six entry URLs respond, and three live browser profiles
pass. Receipt: output/berghain-suspended-subs-release.json. Primary staged index unchanged.

S13/V19's reported overhead relocation is implemented, clearing the former
floor wall. Six complete F124 cabinet/collider assemblies retain manufacturer
dimensions. Hanging height, anchor, downward orientation and support details
remain provisional. Other PA, rooms, lighting and circulation are unchanged.
No structural capacity or acoustic simulation is claimed.

244 Node checks, seven local browser cases, eighteen matched cost contexts
and independent Physics/Camera reviews pass within their recorded scope.
Physical Android NOT RUN. Full goal ACTIVE. The separate Panorama PA remains
a supported dated-installation discrepancy (S12/AU18); current backstage plans,
measured room registration and comprehensive photographic fidelity remain
unresolved. Preserve the immutable suspended-array review snapshot and prior
upper-sanitary release evidence.


## Suspended main subwoofer array — candidate

S13 and V19 report that the left floor-mounted F124 wall moved overhead in
December 2023. The correction keeps the six complete cabinet assemblies and
manufacturer envelopes, rotating them into a provisional downward-facing grid
centred at (-5.1,13.0,-0.6). Its underside is12.472, or7.022m above the floor.
The former floor footprint is now available for walking and sightlines.
All other PA units, rooms, stairs, lights and public/private connections stay
as before. Thin rear rails, four suspension lines and roof contact plates are
original visual support studies; they are not an engineered rigging design.

Suspension is reported; exact height, horizontal position, orientation,
attachments and current inventory remain unverified. A dated January2024
discussion corroborates the reopened floor/darkroom connection and is added
to S13 without creating a duplicate source ID. Acoustic claims are excluded.

The draft export adds168 triangles and17,992bytes:798,744 triangles,
61,659,292bytes,215 material/mesh groups and25 embedded textures. No new
requests, light sources, shadow maps, timers or renderer path are introduced.
Focused geometry/circulation checks pass; full regression, actual desktop/
Android-emulated input, source/native renders, matched cost and both required
independent reviews are pending. Physical Android NOT RUN; full goal ACTIVE.
Evidence uses output/berghain-suspended-subs-*; preserve the published
18c90dad upper sanitary release and all its review evidence.


### Published upper sanitary room and Panorama overlook

Commit `18c90dadf1ee7753ffff6bf219cfd2e23965e5d8`; Pages run 40224162126 succeeded. All93 checked
public files match, six entry URLs respond, and three live browser profiles
pass. Receipt: output/berghain-upper-sanitary-release.json. Primary staged index unchanged.

The separate provisional upper urinal room, glazed lounge relationship, intact
chaise refit and compact guarded DJ sightline are implemented. Six original
recessed bowls/rails follow a dated trial count and MSS24 form study; dimensions,
current inventory, finishes and the separate front-stair correspondence remain
unverified. The restored floor retains its original PBR maps. Neutral sanitary
practicals and adjacent Panorama washes reuse three lights/two shadows.

242 Node checks, seven local browser cases, eighteen matched cost contexts and
independent Physics/Camera reviews pass within their recorded scope. Physical
Android NOT RUN. Full goal ACTIVE. Next supported correction: main subwoofer
wall suspension, documented by S13; exact backstage plans and measured room
registration remain unresolved. Preserve this release and the immutable V1–V4
review evidence; V1 was rejected for its lost upper-floor surface treatment; V3 was rejected
for recesses open from below. V4 retains a solid slab underside.


### Recess underside repair — V4

The integrator found that V3's full-depth holes plus one-sided bowl surfaces
exposed the upper room from below. V4 limits recess construction to the upper
0.19m and retains a solid0.21m slab underside. Top footprint, floor support,
fixtures, furniture, collision, routes and lights are unchanged. Six upward
negative probes now require the original11.75 underside; the source/native
browser probes also include an upward ray. V1/V2/V3 evidence is preserved.
Fresh V4 validation and both reviews are required before release.


### Upper sanitary review repair — V2

V1 was rejected because the new recessed slab shape lost the retained mineral
surface configuration. V2 restores its original base, normal and roughness
maps in both source and portable asset. A regression checks both independently
of source/native pixel equality. Geometry, fixtures, floor support, routes and
light cues are unchanged from V1. The rejected snapshot and reviews remain
preserved. Fresh V2 browser/cost checks and both specialist approvals are pending.


### Upper sanitary room and Panorama overlook — candidate

Working from published01321839, `upper-sanitary.mjs` fits a separate upper
urinal room beside the lounge and a guarded viewing aperture above Panorama's
DJ. V08's later clarification, V07/V19 and I19 images08–14 support the relative
association. The long narrow footprint, current count, finishes and front-stair
correspondence remain unverified. The six illustrative stations use an original
MSS24-form study, not copied product artwork or a claimed installation survey.

The existing stair remains the inferred public approach. One intact chaise
moves into the north lounge strip; the room meets the existing glazed rear
plane, and its aisle does not depend on the unusable gap behind the sofa.
Recessed bowls have real slab openings and complete fixture barriers. The
overlook preserves its guard and unsupported cross-gap boundary. Room practicals
and adjacent dance-floor washes reuse three lights and two shadow maps.

Candidate: output/berghain-upper-sanitary-runtime. Preimplementation audits:
output/berghain-upper-sanitary-{camera,physics}-audit.md. Fresh frozen-candidate
browser, cost and independent reviews are required before publication. Full
goal ACTIVE; physical Android NOT RUN. The separately documented suspended
main subwoofer discrepancy is the next outstanding supported correction.


### Published main DJ bay correction

Commit `01321839e10bcdbfbcb4f25be15ad00c8970e13d`; Pages run 40217653915 succeeded. All 92 checked
public files match the commit, six entry URLs respond, and three live browser
profiles pass. Receipt: output/berghain-dj-bay-release.json. Primary staged index unchanged.

Karhard G19/G24 now inform the lower recessed curtain opening, thin supported
counter, retained open guard and red curtain accent. All public floors, toilets,
smoking connections and Eisbar lanes remain intact. Dimensions, equipment and
current lighting programs remain inferred. V11's reported private WC association
is recorded without an invented cubicle or hidden corridor.

237 Node checks, seven local browser cases, eighteen matched cost contexts and
independent Physics/Camera reviews pass within their recorded scope. Physical
Android NOT RUN. Full goal ACTIVE; exact current backstage/FLINTA plans and
unmeasured dimensions remain unresolved.

Next source reconciliation: the complete V08 May 2026 reply chain includes a
later acceptance of the former overflow-cloakroom identification, omitted by
the earlier collapsed-page extraction. Reconcile that with I19 image12's
glazed garment-counter space, the upper stair and overlook before placing the
upper urinal room. A separate dated 2023/2024/2025 evidence chain contradicts
the floor-mounted main F124 wall: it was reported suspended in December 2023.
These are next-candidate findings, not part of the DJ-bay acceptance. Details,
URLs, access limits and the current mapped upper-room snapshot are in
`output/berghain-after-dj-bay-toilet-evidence.md` and
`output/berghain-upper-sanitary-existing-layout.json`. No next runtime candidate
has been started; preserve 01321839 and its immutable review snapshot.


## DJ bay independent-review repair — v2

V1 was rejected: the thicker wall embedded two satellite cabinets and the
counter/support assembly crossed retained guard rods. Both complete satellite
assemblies, their brackets, collision and equipment metadata now follow the
wall by 0.33 m. The complete counter, legs, stretchers and equipment move
0.18 m behind the unchanged guard; the counter light target follows the mixer.
No other PA component, public floor, guard or route changes. A new regression
checks complete cabinet envelopes and the furniture-to-guard separation.

27 focused checks and 237 full Node checks pass. V2 requires fresh affected
browser/source-native/fallback and cost evidence plus both independent reviews.
The rejected 239-file V1 and its findings remain preserved. Physical Android
NOT RUN; exact private-room plans and current inventories remain unresolved.


## Main DJ bay: visible opening, counter and curtain lighting

Karhard G19/G24 show a recessed red curtain, a neighbouring white door, a
maintenance hatch above the opening and a thin counter behind an open guard.
`main-dj-bay.mjs` replaces the oversized flat opening and opaque desk block.
The opening head is now 8.00 m against the adjacent door head of 7.65 m;
the 0.53 m wall/return depth fits inside the retained hull and clears the
existing Eisbar landing. All metric values remain inferred photographic fits.
The earlier 1.43 m prototype depth blocked that landing and was rejected.

The deck top meets the retained guard feet at 5.75 m. The thin counter top is
6.70 m, below the ordinary 7.13 m eye; four legs support it on the deck. Generic
small deck/mixer forms are original equipment studies, not a current inventory.
The wall-mounted maintenance assembly, circular features and hatches move
together by 0.33 m. The external hull, public floors, guard, other PA, glass screen,
stairs, toilets and all other fixture/route assemblies remain unchanged.
Two red curtain washes and one subdued counter pool reuse the three scene lights
and two shadow maps when approaching the booth. G24 supports the red accent;
outputs, fixture count and current night programming are not measured.

V11 (June 2024 visitor) associates a compact private space and toilet with the
main DJ curtain. V12 (October 2026 interview) independently describes a booth
toilet without specifying which booth. The model records these different claims
without inventing a cubicle coordinate, hidden corridor or public backstage path.

237 Node checks pass. Required browser evidence covers source/native pixels and
actual recess rays, day/night views, real keyboard/touch approaches and texture
fallback. Matched cost compares the same DJ approach and two-second strafe.
Independent Physics and Camera reviews must accept the same frozen candidate
before publication. Receipts: output/berghain-dj-bay-*. Physical Android NOT RUN.

Export: 61,133,368 bytes, 791,124 triangles, 212 groups, 25 textures; SHA-256
09c97ce03af699e3b7d965efff73902138223e57693c47e499d77c1184225c75.
Full goal ACTIVE. Exact backstage/FLINTA coordinates, hidden floor plans and
current equipment inventories remain unresolved; this is not a surveyed twin.


### Published Säule ceiling correction

Commit `9e7adfaea0417445e02f042d6d5cb110cde3a062`; Pages run 40214500691 succeeded. All 91 checked
public files match the commit, six entry URLs respond, and three live browser
profiles pass. Receipt: output/berghain-saule-ceiling-release.json. Primary staged index unchanged.

Chamfered concrete members, six capped circular recesses and exposed service/fixture
studies now follow A15/I24's visible forms. The occupied slab, all public floors,
earlier collision envelopes, piers, toilets, stairs and night-light cues are preserved.
Dimensions, recess depth and equipment counts remain fitted estimates.

231 Node checks, seven local browser cases, eighteen matched cost contexts and
independent Physics/Camera reviews pass within their recorded scope. Physical
Android NOT RUN. The full goal remains ACTIVE: exact ceiling registration,
current inventories, separate admission and private/backstage/FLINTA locations
still require stronger evidence.


## Säule ceiling: source-informed concrete and services

A15's photographs and I24 show chamfered concrete members, circular underside
cavities and a higher central service space with exposed pipes and suspended
fixtures. The new original geometry fits those forms to the existing four pier
pairs. Six circular recesses have actual sidewalls and are capped by the intact
upper slab. Their 0.85 m diameter, 0.35 m depth and all bay dimensions are fitted
estimates; the images do not establish through-floor openings or original function.

Only the central portions of two unsupported generic beams are replaced; their
side-room portions and outer end faces retain their affine geometry. The fit
adds four chamfered members, side soffits, three service bays and six small
fixture studies. All public floors, previous collision envelopes, piers, rooms,
stairs, guards, glass, viewpoints and night-light cues remain unchanged. The
lowest new haunch is 4.20 m above the fitted datum; no upper walking surface is
added. Three reusable spotlights and two shadow maps remain the lighting budget.

231 Node checks pass, including real recess/cap rays, exact preservation, body
headroom, clear light rays and the existing toilet/balcony circuits. The browser
matrix covers source/native pixel and geometry comparisons, day/night views and
real desktop/Android-emulated aisle travel with upward/downward looking in both
loaded and texture-fallback states. Matched before/after cost uses the same Säule
arrival and two-second real strafe. Detailed receipts and independent Physics
and Camera reviews are retained under output/berghain-saule-ceiling-*.
Physical Android NOT RUN. Publication is gated by those scoped results.

Export: 61,116,208 bytes, 790,956 triangles, 212 groups, 25 textures; SHA-256
a3d35161e3382615d0a8113491eb5cb190e0a7dec4237e6aac0f965ece3abd59.
Full goal ACTIVE: exact ceiling grid/depth, current service/fixture inventory,
separate Säule admission, complete Lab plan and exact private/backstage and
upper/garden FLINTA locations remain unresolved. V16's wooden arch forms describe
picnic tables, not an unmodelled architectural arcade.


### Published ground-interior correction

Commit `8633deea6a264d1a18a5fd9fbf319d61d1aab66b`; Pages run 40211190774 succeeded. All 90 checked
public files match the commit, six entry URLs respond, and three live browser
profiles pass. Receipt: output/berghain-saule-layout-release.json. Primary staged index unchanged.

Eight paired piers, a side WC/balcony band with two stairs, an opposite bar and
a closed event-dependent Lab connection now follow the documented relationships.
Local bar, WC and balcony light cues share the existing three-light budget.
All coordinates, dimensions and current inventories remain provisional. No
exact FLINTA cubicle or private backstage room is claimed as verified.

227 Node checks plus eight affected lighting checks, 15 selected local browser cases,
18 matched cost contexts and both
independent reviews pass within their recorded scope. Physical Android NOT RUN.
Full goal ACTIVE: separate exterior admission, complete plans, detailed ceiling
and picnic-table forms, exact backstage and upper/garden FLINTA remain unresolved.
V16's wooden arch forms refer to picnic tables, not separate architectural arcades;
the next source comparison is recorded in output/berghain-saule-followup-evidence.md.


## Säule ground arrangement — published and verified

V01/V15–V18 constrain the relative arrangement: eight piers in pairs, an end
stage, a side WC/balcony band with two stairs, an opposite bar and conditional
Lab connection behind it. A15/I24 inform concrete, belts, padded seats, ribbed
counter, round stools, refrigerators and upper framed glazing. Dimensions,
three neutral cubicles, seven stools and coordinates remain fitted estimates.
FLINTA evidence stays at the Säule-zone level without an invented stall label.

Lab's prior inferred footprint moves behind the bar, with closed event
boundaries and separate selector access. Its relocated sanitary pit cuts both
overlapping slabs. The 2.70 m balcony has 2.05 m minimum beam clearance.
Halle's upper structure remains unchanged; its ground circuit avoids Lab.

The first independent review rejected Lab fixture/frame intersections and
source/export glass differences. The complete 525-part bar assembly now moves
3.5 m clear of the beams; service runs and lintels are lowered locally. New
ground glazing uses the same transparent depth-write policy in source and GLB,
and its upper edges clear the retained beams. Fixture sizes remain unchanged.

All 227 Node checks, eight affected lighting checks and the architecture CLI pass. Fifteen selected local
browser cases pass: two source/native comparisons, ground/Lab/fallback routes
on desktop and both Android emulations, downward views of both balcony stairs
on all three profiles, and the affected desktop Halle circuit. Natural public
admission is tested separately from Lab's explicit room-selector start.
Six V2 natural/local routes and V3 fallback remain bound by exact preservation
checks and fresh V4 source/native and stair views. V3 repaired four collision
strips; V4 changes only two stair light cues to keep lower treads readable.
Independent Physics and Camera reviews accept this frozen v4 candidate within
their recorded scope. The rejected v1/v2/v3 evidence remains preserved.
The overlapping original landscape attempt and interrupted parity run are
excluded; isolated landscape confirmation and final parity supply that evidence.

Eighteen matched cost contexts pass the comparison gate. Median p95 frame
intervals are 20.9 to 21.0 / 14.0 to 20.8 / 20.9 to 20.9 ms for desktop, portrait and landscape.
Normal transfer changes by +26,211 bytes; the optional GLB changes by
+1,056,644 bytes. Three reusable lights, two shadow maps, idle rendering stop and
lazy GLB loading remain. These are local emulation results, not qualification
of a physical Android device or an unchanged-speed claim.

Published and verified; see the release receipt above.
Physical Android NOT RUN; full goal ACTIVE.

Current export: 60,777,456 bytes, 787,960 triangles, 207 groups, 25 textures;
SHA-256 219a026b66849c2fc61b63ed5c37c0f97dcd5b017da8d90d71a932750d9442ed.
Three reusable cue lights and two shadow maps remain; local bar, WC and balcony
cues are authored night interpretations, not measurements of an actual rig.
External Säule admission, complete Lab plan, picnic-table forms, ceiling/service
details, private backstage and exact upper/garden FLINTA registration remain open.

Base cab382c382ab49a86f692160cd593ed15bc5d7ea. Root is sole writer/publisher.
Candidate output/berghain-saule-layout-runtime; evidence output/berghain-saule-layout-*.
Validated runtime promoted to the primary checkout; unrelated staged index unchanged.

### Published compact foyer-chair correction

Commit `11a817477b060d9f6d2208ffb27b355335a3642e`; Pages run 40201191430 succeeded. All 89 checked
public files match the commit, six entry URLs respond, and three live browser
profiles pass. Receipt: output/berghain-foyer-seating-release.json. Primary staged index unchanged.

Karhard G02/G03 support compact armchairs with one recessed seat/back pad,
replacing the unsupported long-sofa forms. Two existing anchors remain
provisional: the photographs do not register the entire aisle or establish
current inventory. The other 16,294 parts retain exact transforms and colours;
public floors, other colliders, navigation and club lighting code are unchanged.

All 218 Node tests, six input/fallback/look cases, two source/native comparisons
with four day/night views and independent Physics/Camera reviews pass. Nine
matched samples per version pass the declared comparison gate: median p95
34.8 to 34.8 / 27.8 to 27.8 / 27.9 to 34.7 ms. The landscape slowdown remains
explicit. Ordinary transfer grows 2,080 bytes; GLB shrinks 3,836 bytes.
Physical Android NOT RUN. Full goal ACTIVE: aisle registration, remaining
photographic details, current inventory, exact private/backstage, FLINTA and
lift locations remain unresolved.


## Compact foyer chairs — accepted for publication

I09 is the same original image as Karhard G02. Its compact chair shell and
G03's opposing chair aisle do not support the former two 3.2 m sofa forms.
The candidate fits the two existing fixtures as individual concrete armchairs,
1.15 x 1.10 x 1.02 m with a 0.48 m seat, thick high arms/back, one recessed
seat pad and one small back pad. These dimensions remain human-scale estimates.
The shell now rests on the 0.05 m ground floor; its linked solids follow it.

G08/G20/G25 associate a compact chair with the main-stair/table bay, but do not
locate G03's complete aisle, endpoint or contemporary inventory. The two old
anchors are retained as provisional placement, not newly verified coordinates.
No corridor, backstage route, wall or additional seat count is invented.
Source pixels and staged animals are not reproduced. F06 remains incomplete.

All 218 Node tests pass, including three new chair-form/contact/circulation
regressions. Actual source-model comparison preserves 16,294 unrelated parts'
matrices and colours, all floors, other colliders, public routes, art and PA,
viewer/navigation and night-lighting code. The export has 772,712 triangles,
204 groups and 25 textures; 59,720,812 bytes, SHA-256
`508631b96e79264baed855a46779cee65e2e6a335f3e6ba7ac2f0f7352c83578`.
Six real-input contact/circulation/look/fallback cases and one source/native
scenario (two material comparisons and four day/night views) pass. Independent
Physics and Camera reviews accept the scoped frozen candidate. Nine matched
cost contexts per version pass the declared comparison gate. Median p95 frame
intervals are 34.8 to 34.8 / 27.8 to 27.8 / 27.9 to 34.7 ms for desktop,
portrait and landscape emulation. The landscape slowdown is recorded; this
does not establish unchanged speed or low-end device performance. Normal
transfer grows 2,080 bytes; the optional GLB shrinks 3,836 bytes and 48 triangles.
Three active lights, two shadow maps, idle render stop and lazy GLB loading remain.
Physical Android NOT RUN. This is not a full interior-accuracy completion.

Evidence: `output/berghain-foyer-seating-{candidate.json,node.txt,preservation.json}`.
Base: `7725a77eaafb7e2bd86ba817412d6b1bcc12b6f5`. Root owns integration.


### Published roof and industrial bridge correction

Commit `7725a77eaafb7e2bd86ba817412d6b1bcc12b6f5`; Pages run 40195100756 succeeded. All 89 checked
public files match the commit, six entry URLs respond, and three live browser
profiles pass. Receipt: output/berghain-roof-frame-release.json. Primary staged index unchanged.

The unsupported upper beam grid is removed; eight side piers meet the retained
roof. A separate stationary industrial bridge follows Karhard G17/G19/G21/G22.
Its dimensions, machinery details and present retention remain estimates.
All 16,246 other parts retain their actual geometry and colours. Public floors,
pier footprints, other colliders, navigation and lighting code are preserved.

All 215 Node tests, six input/fallback cases, three source/GLB comparisons with
six day/night views and independent Physics/Camera reviews pass. Nine matched
cost samples per version retain median p95 frame times of 27.9 to 27.8 / 13.9 to 13.9
/ 14.0 to 14.0 ms. Normal transfer increases 5,632 bytes; GLB increases 83,600 bytes.
Three lights, two shadows, idle rendering stop and lazy GLB loading remain.
Physical Android and listening are NOT RUN. Full goal ACTIVE: detailed
roof/clerestory construction, contemporary inventory, art fidelity and exact
private/backstage, upper FLINTA and lift locations remain unresolved.
Next bounded source audit: `output/berghain-after-roof-frame-next-audit.md`
records the compact foyer seating comparison; establish a visible mismatch
and safe placement before changing existing long benches or circulation.


### Roof and industrial bridge — accepted for publication

Base e2178e6; candidate `output/berghain-roof-frame-runtime`. Karhard
G17/G19/G21/G22 distinguish the broad opaque main roof, high side bays and
red-brown industrial bridge above the independent aluminium light rig. Eight
unsupported generic upper-grid boxes are removed. Eight side piers now meet
the retained official roof at 20.374 m, preserving their 5.45 m bottoms and
0.8 m square footprints. A stationary bridge is fitted to inboard bracketed
runways; its rail wheels, trolley, housing and open hook are an estimated
interpretation of the archive form, not surveyed machinery or current inventory.
The separate Eisbar hoist remains. No private room or public service route is
inferred. Roof and dance-floor datums stay fixed; the source's 18 m turbine
volume contains two floors and is not a new dance-floor-to-roof measurement.

The prototype's rail/pier intersections and 0.374 m pier-top gaps were detected
and repaired before freezing. All 215 Berghain tests pass, including five roof/contact regressions. Two
historical pre-addition fixtures now exclude the new later roof fit. The earlier
prototype and fixture failures remain in the local evidence.
Preservation checks keep 16,246 other source parts and their actual matrices and
colours exact, all floors, all other solids, eight pier X/Z footprints and bottom
heights, viewpoints, fixtures and navigation/viewer/night-lighting code.
Minimum conservative clearance beneath new hardware is 6.95 m.

Export: 59,724,648 bytes, 772,760 triangles, 204 mesh groups, 25 embedded maps;
SHA-256 7391b470b2b4a17e0c2f59921fb22792777ebcfbd35224d950b5a5930e36e1c9.
Six real-input desktop/mobile-emulation/fallback cases, including views toward the
industrial bridge, and three source/GLB
material comparisons with six day/night views pass. Independent Physics and
Camera reviews pass the scoped candidate. Nine matched cost samples per version
retain median p95 frame times of 27.9 to 27.8 / 13.9 to 13.9 / 14.0 to 14.0 ms
(desktop/portrait/landscape). Normal transfer grows 5,632 bytes; the optional
GLB grows 83,600 bytes and 1,008 triangles. Idle rendering stops; the GLB stays
lazy-loaded, with three active lights and two shadows. These local runs do not
establish low-end or physical-device performance. Evidence uses
`output/berghain-roof-frame-*`. Physical Android and listening are NOT RUN.
The full goal remains ACTIVE: detailed roof/clerestory construction, art
fidelity, contemporary inventory and concealed backstage/FLINTA/lift locations
remain unresolved. This candidate is not published.


### Published connected overhead rig

Commit `e2178e6627b8697860de711397556eb6e7c619f9`; Pages run 40191171429 succeeded. All 89 checked
public files match the commit, six entry URLs respond, and three live browser
profiles pass. Receipt: output/berghain-overhead-rig-release.json. Primary staged index unchanged.

The lattice side runs now connect the transverse rig, following Karhard G17/G22.
All 15,838 non-rig parts retain their actual geometry and colours. Floors,
collision, navigation and lighting code are preserved. The fitted rig remains
dimension-estimated; exact anchors, current inventory and load capacity are
unverified. The broader interior remains a reconstruction in progress.

All 210 Node tests, four input/fallback cases, three source/GLB comparisons with
six day/night views, independent Physics/Camera reviews and nine matched cost
samples per version pass their scoped gates. Median p95 frame times remain
20.9/7.1/7.2 ms; normal transfer grows 1,575 bytes. Desktop startup median rises
2.133 to 3.228 seconds in the small sample. Physical Android and listening are
NOT RUN. Full goal ACTIVE; F10 roof/clerestory registration and exact private,
FLINTA and lift locations remain unresolved. The next source/section handoff is
output/berghain-after-overhead-rig-next-audit.md, with actual model measurements
and a plan/section diagram in output/berghain-roof-section-audit.json and .png.


### Connected overhead rig — accepted for publication

The candidate based on d72ea78 corrects the disconnected transverse rig using
the longitudinal lattice runs visible in Karhard G17/G22. It retains the six
hangers, twelve projector assemblies and fitted roof. Exact dimensions, bay
counts, anchors, current inventory and structural load capacity are unverified.

All 210 Berghain tests, four real-input desktop/mobile-emulation/fallback cases,
three source/GLB material comparisons with six day/night views, and independent
Physics/Camera reviews pass their scoped gates. All 15,838 non-rig parts retain
their actual matrices and colours; floors, collision, viewpoints and navigation
and lighting code are unchanged. Minimum conservative floor clearance is 6.027 m.

Nine matched cost samples per version retain median p95 frame times of
20.9/7.1/7.2 ms. Normal transfer rises 1,575 bytes; the optional GLB grows
234,368 bytes to 59,641,048 bytes and adds 2,784 triangles. Three lights, two
shadow maps, idle rendering stop and lazy GLB loading remain. Desktop readiness
median rose from 2.133 to 3.228 seconds in this small sample; loading speed is
not claimed unchanged. Physical Android and perceptual listening are NOT RUN.

Evidence: `output/berghain-overhead-rig-*`, frozen 228-file candidate 3d787063.
The original disconnected-rig regression and two corrected external probe
errors remain preserved. No production repair was needed after the freeze.
Publication and canonical verification are pending. Full goal ACTIVE: F10's
roof/clerestory section and concealed backstage/FLINTA locations remain unresolved.

### Published joint hall registration

Commit `d72ea782584e9207c99307747a9e85709ed7d3b0`; Pages run 40188502082 succeeded. All 89 checked
public files match the commit, six entry URLs respond, and three live browser
profiles pass. Receipt: output/berghain-joint-hall-release.json. Primary staged index unchanged.

The hall, glazed bar, main WC/Klo, booth and main switchback now share the
source-informed arrangement with Panorama. The fitted front wing reaches the
smoking stair. Complete Eisbar and PA assemblies clear the retained full-size
piers; the foyer wash reaches the ground below the slab. Admission, quiet ground
WC, Lab, Saeule and Halle are preserved. Exact dimensions and concealed room
connections remain unverified.

All 209 Node checks, ten keyboard/touch/fallback route cases, one six-view
source/native case, two actual walking descent-view cases and independent
Physics/Camera reviews pass. Nine matched cost samples per version preserve
median p95 frame time (desktop 20.9 ms; mobile emulation 7.1/7.2 ms). Draw calls
increase with the opened hall, and ordinary transfer rises 19,625 bytes. Three
lights, two shadow maps, stopped idle rendering and lazy GLB loading remain.
Physical Android and listening quality are NOT RUN.

Full goal ACTIVE. Remaining work is source-supported photographic detail and
uncertain roof/hidden structure; exact backstage/FLINTA locations require better
evidence. The 61-image Karhard map records coverage, not complete fidelity.
Next bounded source audit: main-hall roof/clerestory relation F10 and the missing
longitudinal lattice runs visible in G17/G22 (F11). See
output/berghain-after-joint-hall-next-audit.md for the source observations and
registered baseline; no roof change is yet implemented or accepted.


### Joint hall registration — accepted for publication

The candidate `output/berghain-joint-hall-runtime`, based on published 285186b,
registers the main hall, glazed bar, Klo/main WC and main switchback with the
existing Panorama stair. Karhard G19/21/23/24 and hero guide the open central
hall, boundary frames, glass-to-DJ-wall corner and offset booth with a closed red
recess. U02 guides the front public wing/smoking adjacency. These are relative
source relations; coordinates, dimensions, frame counts and hidden structure
remain estimates. Admission, Lab, quiet ground WC, Saeule, Panorama and Halle
retain their accepted layouts. No new private destination is inferred.

The complete lower Eisbar flight, landing guard/opening, side-frame pier row
and nearby wall speaker now fit together. Both stair widths, full-size piers
and the visitor body are retained. The foyer wash sits below the slab and reaches
the ground. Three active lights and two shadow maps remain the night budget.

The 228-file frozen candidate 7345b8f4 passes all 209 Berghain Node checks,
ten real-input desktop/mobile-emulation/fallback route cases, one six-view
source/native comparison and two walking descent-view cases. Both independent
Physics and Camera reviews pass their scoped gates. Nine matched cost samples
per version retain median p95 frame times of 20.9/7.1/7.2 ms; draw calls rise
with the opened hall and transferred bytes rise by 19,625. Idle rendering stops;
normal viewing does not fetch the 59,406,680-byte portable GLB.

Rejected c2d31c63 and 65dbf5ff candidates and their failures remain preserved.
The final review discloses an unchanged sub-millimetre Panorama floor seam and
687 retained steel/rubber instances with different in-range seeded shades;
neither is claimed byte-identical or geometrically perfect. Physical Android
and perceptual audio listening are NOT RUN. Source/native agreement does not
establish photographic authenticity. Publication and canonical URL checks are
the next step; evidence is under `output/berghain-joint-hall-*`.

Full goal ACTIVE. Remaining uncertainty includes roof-grid orientation, hidden
structural continuity, unsurveyed dimensions, current backstage/FLINTA locations
and complete photographic/artwork fidelity. README remains the task owner.


### Published main switchback correction

Commit `285186b01a3e50151427576b625361ad534c7538`; Pages run 40179272291 succeeded. All 88 checked
public files match the commit, six entry URLs respond, and three live browser
profiles pass. Receipt: output/berghain-hall-registration-release.json. Primary staged index unchanged.

The upper main flight rises toward the dance floor through a short arrival;
the long return bridge is removed. Both flights, turn, guards and stringer
collision are integrated. The upper approach activates the existing stair
lighting before descent. Fifty-seven Node checks, ten final local browser cases,
nine matched cost samples per version and independent Physics/Camera reviews
pass. Dimensions remain estimates; physical Android is NOT RUN.

The first public mobile runs read the previous room position before its next
render. The final harness waits for the selected room's actual rendered position;
logs reproduce the stale read and all three final profiles pass. Production was
unchanged. See output/berghain-hall-registration-public-harness-note.md.

Full goal ACTIVE. Next: solve AU27's hall/Panorama/Klo orientation and booth-wall
registration with the ground-room, Eisbar and smoking interfaces in one section.
Backstage/FLINTA locations and full photographic fidelity remain unresolved.

The next analytical ground-floor study is output/berghain-next-ground-fit.json
and .png, based on this commit. Turning only Säule places four of six projected
pier centers inside the retained Lab footprint. Turning Lab too overlaps the
quiet ground WC by 23.914 m² and admission by 24.471 m². These are model-plan
intersections, not measured room areas or a runtime correction. They do not prove
that ground rooms must rotate. The next option keeps Lab, admission, ground WC
and Säule anchors in place while fitting the upper hall and its foyer frame.
See output/berghain-next-joint-plan.json and .png and the independent reports
output/berghain-next-retained-ground-physics.md and -camera.md. Those studies
identify capital/slab edges, old foyer ribs/supports, the raised Lab gate/slab,
main/Halle boundary and the detached smoking approach as unresolved interfaces.
No new arrangement is implemented or accepted. Do not apply a bulk transform.


### Main switchback acceptance

The source-informed main stair now rises toward the dance-floor edge through
a short arrival. Its two flights, shared turn, guards, fitted stringer collision
and wardrobe approach pass 57 affected Node checks and six final browser cases:
natural admission/ascent/descent/WC/exit on desktop and both Android-emulated
orientations, two source/export day/night view cases and a landscape texture
fallback route. Four further normal-walk approach cases verify that the descent
is visible before entry, including missing textures. Physical Android is NOT RUN.

The original stringer-underlap rejection and later dark-approach rejection are
preserved. The final approach repair changes only the upper-floor cue boundary;
the same three lights and two shadow maps remain. A matched baseline view and
nine cold contexts per version support the bounded appearance/cost comparison.
Idle rendering stops and ordinary viewing does not request the portable GLB.
The sampled desktop p95 frame interval rose from 14.2 to 20.8 ms, within the
33.3 ms limit; mobile-emulated samples remain about 7.1 ms. This is a bounded
pass rather than an unchanged-speed claim. Draw calls are unchanged; ordinary
transfer rises by 678 bytes. Median observed input latency stays below 27 ms.

The exported model has 767,564 triangles, 204 mesh groups and 25 maps, with
59,247,956 bytes. Independent Physics and Camera reports bind the same 226-file
freeze and this documentation-only bridge. The reports and release receipt use
output/berghain-hall-registration-* and output/berghain-main-switchback-*.
Local acceptance does not itself establish publication.

The stair rise is photo-supported; exact dimensions and the ground approach
are estimates. AU27's broader hall/Panorama/Klo orientation and booth-wall
registration remain open. Fit their complete section and the ground/smoking
interfaces before changing that frame. Full goal ACTIVE; current backstage,
FLINTA locations and full photographic fidelity remain unresolved.


### Main switchback correction and coupled hall audit

Isolated candidate: output/berghain-hall-registration-runtime, based on published
ca53e930c4a2de3eec60d9a0e5a1e5bbf1ed8d3a. Karhard G20/21/23/25 contradict the
old upper main-flight rise away from the dance floor. Both flights, the turning
landing, upper opening, guards and route cues are rebuilt together. The upper
flight now arrives at the dance-floor edge through a short landing; the long
return bridge is removed. Dimensions and the ground approach remain estimated.
Fresh source/export, body, natural keyboard/touch and independent reviews pass
as recorded above. The larger orientation change is NOT implemented.

AU27 remains open: Panorama was quarter-turned toward the entrance facade while
the hall/bar/void/Klo cluster kept its earlier frame. Independent read-only
audits confirm the near-perpendicular stair axes. Camera/photo analysis also
identifies the booth's unsupported central placement. A shared hall orientation is the preferred estimated study,
but literal rotation crosses the retained main/Halle boundary and moving Säule
would overlap retained ground rooms. Fit the complete ground/main section, bar and Klo boundaries,
smoking interfaces and booth wall before applying that rotation. Do not rotate
Panorama twice or treat the unscaled lighting sketch as a surveyed plan.

Evidence: output/berghain-hall-registration-{camera,physics}-audit.md and
output/berghain-hall-registration-comparison.png (analytical, not a runtime
candidate). Full goal ACTIVE; current backstage/FLINTA positions and complete
photographic fidelity remain unresolved. README remains the sole task owner.


### Published spatial club-lighting correction

Commit `ca53e930c4a2de3eec60d9a0e5a1e5bbf1ed8d3a`; Pages run 40173760340 succeeded. All 88 checked
public files match the commit, six entry URLs respond, and three live browser
profiles pass. Receipt: output/berghain-spatial-light-release.json. Primary staged index unchanged.

Main-floor lighting now washes two opposing architectural surfaces and the
dance floor, following L09's spatial principle. Colors, positions and output
remain estimates. Seventeen Node checks, seven local browser cases, nine matched
cost samples per version and independent Physics/Camera reviews pass. Geometry,
navigation and the portable GLB remain unchanged; physical Android is NOT RUN.

Full goal ACTIVE. Next: register L09's unscaled DJ/FOH/stair/void sketch against
Karhard and the current room topology before relocating any architecture.
Current backstage/FLINTA positions, the compact-chair aisle and full photographic
fidelity remain unresolved. Source follow-up: output/berghain-spatial-light-source-followup.md.
The prior After Hours check remains unavailable/challenged; no footage viewed.


### Spatial club-lighting acceptance

The frozen candidate passes 17 affected Node checks and seven browser cases:
open-floor access and four eye directions on desktop and both Android-emulated
orientations, landscape texture failure, and natural admission/main-stair/bar/
exit routes on all three profiles. Toilets, smoking stairs and foyer retain
their circulation lighting; daylight restoration passes. An additional matched
desktop baseline supplies before/after views. Physical Android is NOT RUN.

Nine cold contexts before and nine after use continuous two-second rightward
input at the same main-floor arrival. The scoped cost comparison passes; idle
rendering stops, no GLB is requested during normal viewing, and no extra light,
texture, timer or render loop is introduced. Earlier timed-turn samples are
retained but excluded from frame-cadence acceptance because their injected input
gaps dominate frame spacing. Two initial view harness errors (hidden room
selector and early daylight assertion) and a route into a retained speaker
cabinet are also preserved; the corrected route passes without runtime repair.

The only production change is the main-floor three-cue definition. All geometry,
materials, navigation and portable GLB bytes are unchanged. Three scene cues
and two 512px shadow maps are reused alongside the six retained bar uplights.
Independent reviewers check the same 226-file freeze and this Markdown-only
acceptance bridge. Their final reports and publication receipt are in output
under the berghain-spatial-light prefix; local checks alone do not prove release.

L09 supports the spatial lighting principle, not exact coordinates, colors,
output or a current show. The three sources clear existing fixture geometry;
the first two center rays reach opposed architectural surfaces, while the third
reaches the real floor. The third cue retains its prior non-shadowing budget.
Full goal ACTIVE: current backstage/FLINTA locations, L09 schematic registration,
the F06 compact-chair aisle and full photographic fidelity remain unresolved.
Source follow-up: output/berghain-spatial-light-source-followup.md.


## Spatial club-lighting correction

L09, a 2024 design-research chapter by Natalie Heckl, supports multidirectional
light across the floor and side-wall planes. The main-floor cue now uses two
opposing architectural washes plus a separate floor pool, replacing its
DJ-wall accent. Three reused lights and two 512px shadow maps remain the budget.
Geometry, materials, ambient circulation fill, room routing and the GLB are
unchanged. Coordinates, palette and output remain authored estimates.

Matched views, actual-surface rays, keyboard/touch routes and rendering costs
pass as recorded above; independent review reports bind the same candidate. The
unscaled source sketch requires further registration before moving rooms or
the booth. Backstage/FLINTA positions, the compact-chair aisle and complete
photographic fidelity remain unresolved. This remains the single task owner.

The prior E05 availability check remains in
output/berghain-after-hours-followup-20261025.md: no film footage was viewed.


### Main-bar return acceptance

The three added stools pass 36 fresh affected Node checks and seven browser
cases: natural admission, main stairs, the curved aisle in both directions,
the straight guest aisle and exit on desktop and both Android-emulated touch
orientations; two source/GLB and day/night view cases; a missing-texture
stationary turn; and a downward fallback view added after Camera review found
that the original landscape crops did not show the complete stools.
Downward mesh rays confirm all three seat surfaces.
Independent Physics and Camera reviews accept the frozen 226-file candidate,
base 957443bc9de81cab1399dd18eca0a0025f37701b. Physical Android is NOT RUN.

Three cold contexts per viewport before and after meet the scoped rendering
and input limits. Draw calls stay unchanged; ordinary viewing adds 548 bytes
and does not request the GLB. Idle rendering remains stopped. The portable
model is 59,284,836 bytes, 767,936 triangles and 204 mesh groups with 25 embedded
maps. The change adds 30 parts and 2,736 triangles, with no new light, timer,
texture or material. Existing geometry and material definitions are retained.
The existing instance-tone sequencing changes shades on 792 retained parts;
the reviewed renders show no blocking appearance defect. This is not a claim
that every retained instance has an identical color value.

Receipts: output/berghain-bar-return-candidate.json, -node.tap,
-browser-acceptance.json, -cost-comparison.json, -physics-review.md and
-camera-review.md. The incomplete initial cost-before report is retained:
its probe crossed an existing column. The corrected cost-before-recheck and
cost-after batches use the same validated route and each pass nine cases.
No runtime repair was needed for that harness error. This documentation bridge
updates only the acceptance record and task handoff, leaving geometry frozen.

G12 supports the curved seating arrangement; G14 shows an empty counter.
Three seats and their spacing are a fitted estimate, not a current inventory.
The compact-chair aisle, current backstage/FLINTA positions and complete
photographic fidelity remain unresolved. README.md remains the single owner;
output/berghain-bar-return-release.json records publication verification.


## Main-bar return seating — current correction

Karhard G12 shows stools continuing around the curved counter end. The
existing straight row has been extended by three instances of the same
concave seat, splayed legs and ring rest. G14 shows the bar without stools,
so this is an estimated furnished arrangement, not a current inventory.
The candidate retains the room, counter, column and screen geometry. Fresh
body-route, source/GLB, day/night and desktop/mobile-emulated checks and both
independent reviews are recorded above. README remains task owner.
Backstage/FLINTA placement and the compact-chair aisle remain unresolved.


### Foyer frame acceptance

The foyer gallery correction passed 195 fresh Node checks and eight browser
cases: the folded main stair in desktop keyboard and both Android-emulated
touch orientations; the ground WC crossing; two fallback/material-control
cases; and two source/portable/day/night render cases. Source and exported
materials agree under the same camera. The independent Physics and Camera
reviewers accepted the frozen226-file candidate, base e153041.

Three cold contexts per viewport before and after the change meet the scoped
rendering/input limits; idle rendering remains stopped and ordinary viewing
does not request the GLB. Physical Android remains NOT RUN. The exported model
has204 mesh groups and765200 triangles; the local frame adds27 parts,324
triangles and one batch. It adds no texture, light or timer.

Receipts: output/berghain-foyer-frame-candidate.json, -node.tap,
-browser-acceptance.json, -cost-comparison.json, -physics-review.md and
-camera-review.md. The documentation bridge changes only this acceptance
record and the task-owner handoff; geometry remains frozen. The initial browser
report retains four failed harness attempts: a camera intersected the existing
table and the playable common-room label expectation was wrong. Four corrected
checks pass in -browser-recheck/report.json alongside the initial four route
passes. No runtime change was needed or failed evidence discarded.

This closes the local missing gallery-frame/radiator relationship in F03.
Exact frame registration, full current room/artwork inventory and private or
FLINTA placement remain unverified; no measured interior plan was supplied.
README.md remains the single task owner. Publication verification is recorded
in output/berghain-foyer-frame-release.json when deployment completes.


## Foyer gallery frame — source-informed correction

Karhard G04/07/20/25 support rectangular gallery piers, local beam haunches,
transverse slab ribs and a tall radiator mounted on a pier. A controlled render
of e153041 showed a flat unsupported gallery edge and a freestanding radiator.
The local correction fits three piers, six haunches, a continuous edge beam
and seventeen ribs beneath the existing gallery. The radiator moves against
the middle pier. The tapered corbel primitive and existing concrete material
are reused; every new part has a linked solid. Haunch solids conservatively
contain the overhead wedges.

These counts, sections and coordinates are estimates, not a recovered grid.
The authoring slab edge remains z9.4, underside5.05 and floor5.45; beam bottom
is4.4, pier bases0.05 and haunch minimum3.8. Pier centers are x−2.4,4.5,16.55
at z9.05; radiator center z9.72. Existing Säule capitals, stairs, gallery
walk surface, official exterior and private-room boundaries are unchanged.
The source photos support forms and relationships, not structural adequacy.


### Radiator, window and connected-section correction — current candidate

The previous joint section placed 0.8025 m rigid radiators partly over the
glazing. I19 gallery04/expanded16 show their tops at or below the sill. The
current working fit lowers the connected main/Klo, Panorama and upper-lounge
floors by 0.20 m to 5.45, 9.05 and 12.15 m, respectively; the south tall-row
sill moves from 9.70 to 9.90 m. Its head remains 13.65 m. The actual exterior
opening, masonry below it, sill and inner frame change together. No cover
panel conceals glazing and no radiator is compressed. Ceiling-mounted Panorama
bodies remain at their previous elevation beneath the 13.95 m fitted ceiling.

This balances photographed relations rather than recovering unique datums:
the floor-to-sill distance is 0.85 m; the radiator top clears it by 0.0475 m;
the 3.75 m opening remains elongated, and the 1.15 m upper inter-row gap is
30.7% of its height. Common Klo headroom remains 3.15 m with full-height
switchgear. Main and escape half-landings are 2.75 m; the smoking landings
are 5.45, 7.25 and 9.05 m. The lower slab underside is 5.29 m and enclosure
fascia underside 5.30 m, above the provisional lower aperture head 5.25 m.
These are model quantities and photo-informed estimates, not surveyed facts.
The Eisbar/service landings follow at 8.75/12.05 m; the closed upper endpoint
does not assert a permanent private or Panorama connection.

This working section is an evidence-constrained estimate. README.md owns the
current task and publication state; VALIDATION.md owns the fresh test evidence.
Earlier candidate notes below retain their historical datums. The old joint
section was rejected after its radiator/glazing overlap was found; the first
sill candidate was rejected for a stale smoking-doorway lining. Both are
preserved in output. Current source: output/berghain-joint-sill-repaired-runtime,
225-file freeze SHA256
493f2977d80975688251f4b0e2b75a6f3348bd1ca459c5dbd8e530b1561690c0.
Full photographic fidelity, exact current toilet/backstage inventories and
physical Android qualification remain unresolved.


### Current acceptance and remaining work

The repaired section has passed a fresh 191-test Node run, 21 browser
scenario/profile cases and nine cold-context cost samples against the unchanged
nine-sample published baseline. Keyboard and emulated touch routes cover
main/Panorama stairs, ordinary WC, upper lounge, smoking access, Klo and Eisbar.
Independent Physics and Camera reports must accept this exact freeze and the
documentation evidence bridge before publication. Their final verdicts and the
deployment status belong to output/berghain-joint-sill-release.json. Local test
success alone is not evidence of publication.

The goal remains ACTIVE. Exact surveyed datums and footprints, full artwork and
photographic fidelity, the printed-glass lounge's exterior registration, and
contemporary private/backstage/FLINTA placement remain open. No new permanent
private-room position is claimed. Physical Android is NOT RUN. The official hull
and all Halle geometry remain unchanged. Historical publication records follow.

### Published entrance elevation and doorway correction

Commit `4652f776372e4a4c823f4cf4ab726c33922272a3`; Pages run 40158331947 succeeded. All 87 checked
public files match the commit, six URLs respond and three live browser cases
pass on desktop and Android portrait/landscape emulation across both viewers.
Receipt: output/berghain-frontage-repaired-release.json. Initial frontage rejection is preserved;
the repaired candidate's 184 Node checks, 17 browser cases, repeated costs and
both independent reviews own acceptance. The primary staged index is unchanged.

The frontage now has twelve nonuniform openings, nine lower attic grilles and
seventeen upper vents. Decorative joints stop at the working entrance aperture.
This corrects observable features without asserting recovered floor heights.
The full goal remains ACTIVE: register Panorama's six-window footprint and its
floor section jointly with ordinary WC, upper lounge and smoking access. The
six left shuttered bays are a promising correspondence. The read-only diagnostic
output/berghain-panorama-frontage-coverage.json finds only four of those six
within the current Panorama slab's world-x bounds. This is not an accepted new
footprint or floor datum; output/berghain-frontage-section-next.md records the
joint section/plan follow-up. Exact heights and backstage/FLINTA placement
remain unverified. Older decorative shadow-patch
registration and photographic fidelity also remain open. Physical Android is
NOT RUN. This local publication handoff changes no reviewed runtime or index.


The initial frontage candidate was held after Physics review found pre-existing
decorative rustication strips spanning the open entrance. This repaired candidate
trims those strips at the existing jamb aperture, including above head height.
The original rejected root/freeze is preserved. Ground support, jambs, door and
interior routes remain unchanged; fresh body/mesh and rendered checks are required.


## Entrance elevation registration — 25 October 2026

Current isolated candidate: output/berghain-frontage-repaired-runtime, based on published
d05f9bae5a7935a7b1bd0d4655026c95e98bb506. P02 and P16 show twelve openings,
wider masonry fields near both ends, nine lower attic grilles and seventeen
upper vents. These replace the eleven evenly spaced entrance-elevation bays.
The opening widths/positions remain perspective-photo estimates. The ground
entrance, interior datums and routes are retained. The frozen candidate passes 184 Node checks, seventeen browser cases,
nine-before/nine-after cost samples and both independent world reviews.
VALIDATION.md records limitations; publication status belongs to
output/berghain-frontage-repaired-release.json.

Six shuttered tall openings in the historical exterior photographs correspond
plausibly to I19's six-window Panorama sequence. This is a registration lead,
not a resolved floor section. Do not infer metric floor heights from the
existing model tiers, move the lounge/WC independently, or add backstage doors.
The full reconstruction goal remains ACTIVE. Physical Android is untested.

The first counter-wall candidate was held after independent Physics review found
an older generic intermediate beam intersecting all Panorama stair lanes, with
only1.303 m headroom at the settled counterexample. This repaired candidate
retires that single unregistered beam-grid placeholder (authored x=-1,y12.95,z-6).
G21/G23 show a clear rising stair, but do not establish exact structural dimensions.
Other beams, columns, floors, stair geometry and routes are retained. No beam cut
or new structural member is invented. Initial rejected evidence is preserved at
output/berghain-counterwall-physics-review-rejected-beam.md; repaired acceptance
requires new source/native, five-lane body/headroom and actual camera checks.


Created 2026-10-23 at George's request. Owner: Codex integrator in the current chat. The active app goal is the Berghain exterior/interior reconstruction; this page is its durable task state. Do not resume unrelated paused game-completion work.

## Requested outcome

Create a full, realistic, three-dimensional architectural asset of Berghain, inside and outside, using public architectural plans, photographs, existing models and the known Minecraft reconstruction where available. Maintain a catalogue of online resources and a hidden page for viewing the exterior and going inside.

The working target is the contemporary building, with reference dates retained so historical layouts are not silently mixed. This is a builder assumption, not a surveyed as-built claim. Include the main club, Panorama Bar, Säule, foyer/coat check, stairs, bars, public service spaces, Halle, Lab.oratory and garden in coverage tracking; undocumented spaces remain explicit gaps.

## Current work

### Panorama counter backdrop — 25 October 2026

I19 views06/15/16 consistently show an opaque pale wall behind the counter,
perpendicular to the glazed side. The registered model instead exposed generic
facade openings there. The bounded candidate adds an interior lining, a shallow
closed service recess and the photographed high segmented service/acoustic band.
The exterior, floor datum, bar, bottle rack and public routes stay registered
as before. No backstage connection or current artwork inventory is inferred.

The wall thickness, extent, recess and panel count/dimensions are estimates.
The installed artwork differs between the undated photographs and is not
reproduced by this correction. Source observations belong to INTERIOR.md;
candidate and acceptance evidence belong to VALIDATION.md. Full goal ACTIVE.
Remaining architectural work includes the common facade/window section,
backstage and FLINTA placement, present inventory and photographic fidelity.


This bounded correction passes 181 Node checks, eleven final browser cases and
nine-before/nine-after cost samples with both independent world reviews. The
counter backdrop renders in the source and portable GLB; the public routes,
exterior and existing fixture scale are preserved. One unsupported generic beam
that crossed the Panorama stair is retired, with fresh body and eye clearance checks. VALIDATION.md records the
desktop timing increase and physical-device limitation. Publication/live status
belongs to output/berghain-counterwall-repaired-release.json; full goal stays ACTIVE.

Published counter backdrop and stair-headroom correction `d05f9bae5a7935a7b1bd0d4655026c95e98bb506`;
Pages run 40154989892 succeeded. All 87 checked public files match the
commit, six entry URLs respond, and three live browser cases pass on desktop
and Android portrait/landscape emulation across both viewers. Receipt:
output/berghain-counterwall-repaired-release.json. The original beam-clashing candidate remains
rejected and preserved. The accepted model has a clear main-to-Panorama stair,
an opaque counter backdrop and a closed service recess; no private route is inferred.

The full goal remains ACTIVE. Next architectural registration work must reconcile
the common facade/window bay, floor section and remaining generic structure;
do not derive surveyed floor heights from the model's estimated facade tiers.
Exact backstage/FLINTA placement and current inventory/artwork remain unresolved.
The next read-only bay diagnostic is output/berghain-panorama-bay-followup.json;
its source limits and unsuccessful archive follow-up are recorded in
output/berghain-panorama-section-followup.md. It does not select a floor datum.
This local publication handoff does not alter the reviewed runtime or Git index.

### Panorama frontage and public connections — 25 October 2026

U02, A13/I19 views 06/07/15/16 and V05 support an entrance-facing Panorama wing,
with the long bar across the window wall and the DJ at the opposite end. The
room, acoustic ceiling, radiators, furniture, CLIMBER, ordinary WC and upper
lounge now move together, preserving the physical size of each fixture.
The ordinary WC stays below the lounge, distinct from the ground cloakroom WC,
main Klo and the unregistered historical wardrobe/FLINTA trial room.

The main stair has matching visible rails, body barriers and landings, with an
approach around retained columns. A guarded passage at the hall edge reaches
an upper smoking doorway through both facade layers. The existing main-floor
tower entry and two enclosed flights remain. The upper lounge shifts 0.4 m and
the nearby lower seat 1.4 m to clear the retained column and stair approach.
Room dimensions, floor heights, passage footprint and door positions remain
estimates. No backstage room or private access route is inferred.

Localized night cues follow the moved rooms, WC approach and passage within
the existing three scene spots and two shadow maps. The main-bar end uplight
now reaches plaster below the Eisbar slab that intercepted its previous aim.
The illumination is an appearance study, not a surveyed contemporary show.

The floor/window section still conflicts with I19's low-sill tall windows.
The repeated facade tiers are also estimated; this change does not establish
a measured floor datum or bay-specific window pattern. Backstage and FLINTA
locations, present inventory, artwork fidelity and other open audit findings
remain unresolved. The full architectural goal stays ACTIVE.

The bounded increment passes 177 Node tests and 17 final browser cases, plus
nine baseline/nine candidate cost samples. Both independent world reviewers
accept the scoped geometry and rendering. The browser matrix uses desktop and
Android portrait/landscape emulation; physical Android is NOT RUN. See
VALIDATION.md for source binding and measured limits. Publication and deployed
byte/control verification are recorded in output/berghain-panorama-release.json.

Next: resolve the common facade/window bay and interior floor section before
changing either estimated datum. Exact backstage and FLINTA placement still
need a located primary source. No full-reconstruction completion is claimed.

Published Panorama registration `88df5637aed81e26dfe912784987ad61d67f727f`; Pages run 40151974691
succeeded. All 87 checked public files match the commit and six entry URLs
respond. Three fresh live browser cases pass on desktop and Android portrait/
landscape emulation, exercising both viewers, room arrivals and real movement.
Receipt: output/berghain-panorama-release.json. The full architectural goal stays
ACTIVE: the common facade/window section, exact floor dimensions, backstage,
FLINTA placement, current inventory and remaining visual fidelity stay open.
Next visible correction: I19 views06/15/16 show an opaque wall behind the
Panorama counter, while the registered render exposes generic facade openings.
Read output/berghain-panorama-section-followup.md and the source inventory in
output/berghain-panorama-counter-wall-audit.json. Keep the exterior hull, room
routes and uncertain floor datum separate from this possible interior lining.
This local publication receipt does not alter the reviewed runtime or index.

### Eisbar mezzanine correction — 25 October 2026

I03/I04 describe a mezzanine containing the ice-cream bar; these are one dated
eyewitness evidence chain, not two independent surveys. Karhard G27–29 show a
guarded opening, tiled L counter, narrow onward ascent, relief/window backdrop
and overhead crane. U01/U02 corroborate an elevated bar-end relationship.
The former main-floor counter is replaced by a guarded intermediate platform,
lower approach and separately bounded upper continuation. Counter, service
furniture, crane, room arrival and local night cues move together.

The intermediate datum 9.95 m, platform footprint, selected end bay, aisle and
stair coordinates remain authoring estimates. This corrects the supported level
relationship; it does not recover a measured section or present-day inventory.
No Panorama doorway or backstage connection is inferred from the upper landing.
Panorama/frontage registration, exact upper WC/FLINTA room and backstage remain
unresolved. The full architectural goal stays ACTIVE.

The repaired candidate passes 31 focused Node checks, nine final browser cases
(source/native, real routes and fallback controls across desktop and both Android
emulations), nine-before/nine-after cost samples, and independent Physics/Camera
review. VALIDATION.md records the rejected glass-screen/light-placement version
and the final repair. The upper stair is a narrow estimated service stair;
its destination remains unresolved. Physical Android has not been tested.
Publication/live status is recorded in output/berghain-eisbar-release.json.

Next: reconcile Panorama frontage/window bays, stair mouth, upper toilets and
lounge as a connected group. Read output/berghain-upper-registration-followup.md;
do not rotate the existing rectangles without checking those connections.
Backstage research in output/berghain-backstage-followup-20261025.md distinguishes
unbuilt Kubus proposals and temporary concert dressing areas from permanent
spaces. No current backstage location was recovered; that placement stays open.

Published Eisbar correction `a315b8489ee931fca814df9db8bb9abb1a79c8bb`; Pages run 40146269790
succeeded. All 86 checked public files match the commit, six entry URLs respond,
and three fresh live browser cases pass on desktop and both Android emulations.
Both public viewers arrive on the 9.95 m authored mezzanine and accept real input.
Receipt: output/berghain-eisbar-release.json. This local publication handoff does
not change the reviewed runtime. The complete architectural goal remains ACTIVE.

The next Panorama registration pass also needs its floor/window section checked:
output/berghain-panorama-section-audit.json records the current 1.55 m upper-window
sill above the Panorama floor, unlike the low-sill relationship in I19 views15/16.
See output/berghain-panorama-section-followup.md for the coupled source owners.
The facade tiers are estimates too; this finding does not select a new floor height.

### Smoking stair registration follow-up — 25 October 2026

The current candidate corrects the smoking tower's long axis from parallel to
outward-projecting and moves it from the rear quarter to an estimated front-side
bay. G30/31 and P08–10 support that direction and region, not exact coordinates.
The entrance-facing side is opaque; the reverse is glazed. The old rear opening
is restored; the new lower entry, floors, guards, collision, viewpoint and
lighting move together. Upper Panorama attachment remains unresolved.

V07/A22 now distinguish the historical upper urinal trial from later architect
work; V08's room location is disputed. These are separate from ground cloakroom
WC, Säule facilities and ordinary Panorama toilets. No exact current urinal
room or backstage geometry is asserted. The former main-floor Eisbar datum is superseded by the mezzanine correction
above; its exact elevation and Panorama/frontage registration remain inferred.

Candidate: output/berghain-smoking-runtime, frozen in
output/berghain-smoking-candidate.json. Scoped Physics/Camera reviews pass,
along with real desktop/mobile-emulated routes, native render/parity, fallback
and nine-before/nine-after cost checks. VALIDATION.md retains the two rejected
cladding iterations and final repair. Published as c5bd07329a8d6e94fd70474c8bb7f134fdd14dc0. Pages run 40143577166
succeeded; 86 public file hashes and three live desktop/mobile-emulated cases
passed. output/berghain-smoking-release.json retains the release receipt.
The full architectural goal remains ACTIVE.


### Karhard architecture and supplied cutaways — 25 October 2026

All 61 images on the exact architect project page have been inspected and mapped
to 34 feature families in [KARHARD-MAPPING.md](KARHARD-MAPPING.md); the companion
JSON retains image URLs/hashes. U01/U02 record George's two unscaled cutaways.
The original geometry now includes opposed main stair flights/open gallery,
the tiled Eisbar and narrow stairs/hoist, a glazed smoking/escape stair with
sparse horizontal guards, and separate ground cloakroom toilets. The existing
main-floor Klo and upper Panorama toilets remain distinct. Drum lights, duct
ribs, radiators, open trusses, paired DJ-wall recesses, screened booth and
visible maintenance access follow the photographed feature families.

The public wardrobe/foyer doorway is an explicitly inferred connection in an
existing provisional partition. Backstage boundaries, the upper smoking-to-
Panorama attachment, lift, FLINTA location and full room registration remain
unresolved. No private room or public backstage shortcut has been invented.
The ground WC's three stalls are illustrative. Historical artwork/rig images
do not establish contemporary inventory; the removed Nathan mural stays absent.

This bounded implementation passes source/native geometry and rendering,
continuous desktop and Android-emulated routes, room controls/fallback and
independent Physics/Camera review. [VALIDATION.md](VALIDATION.md) owns exact
evidence. Steady local stair/WC cues retain the accepted warm orientation fill.
The full reconstruction goal remains open: a working source-informed model
does not resolve the documented architectural registration gaps. The earlier
low-smoking-bridge hypothesis below is superseded by gallery 30–34.

Published architectural revision `121459a79787858dca6e31bed3d046b4be2cb056`,
followed by packaging repair `929f6d8249d4a8b074285b1d151ae31b75625d98`.
Pages run 40140639388 succeeded. All 86 checked public files match committed
bytes, six entry URLs respond, and three live desktop/Android-emulated cases
exercise both `/geheim/` and `/berghain/model.html`. The repair includes the
lighting module and evidence documents in the explicit build list, with a
dependency-closure regression and three generated-site browser cases.
Receipt: `output/karhard-release.json`. This is a local post-publication handoff;
the reviewed candidate and public runtime remain unchanged. The app goal stays
ACTIVE because the documented architectural registration gaps remain open.

### Warm interior orientation light — 25 October 2026

Following George's request, a warm reflected fill now makes room boundaries,
columns and circulation easier to see while retaining colored techno spots,
localized pools and darker corners. It reuses the existing hemisphere light
and lowers interior fog density; no lamp, shadow map, mesh, texture or UI is added.
Outdoor/admission cues and exterior daylight remain as previously accepted.

Five focused Node checks, three desktop/Android-emulated room tours and a fresh
desktop admission-to-wardrobe return pass. Physics acceptance bridges over
identical geometry/navigation; Camera review inspects the new rendered views.
This is authored orientation lighting, not measured venue photometry or formal
accessibility certification. Physical Android remains untested. Published `408bc44`; exact public files and four live desktop/Android-emulated
route/native checks passed. Receipt: `output/berghain-warm-light-release.json`.

### Entrance and admission reconstruction — accepted 25 October 2026

The requested outdoor waiting area and indoor admission/ticketing space are
implemented as a bounded source-informed study. ENT01–ENT05 record the three
supplied photos, Google-discovered exterior images and firsthand accounts.
The new sequence is queue → narrow entrance → left inspection room → cashier
→ parted curtain → foyer/wardrobe. Exact interior dimensions, arrangement and
current finishes remain estimates; no surveyed ticket-room plan was found.

- [x] Inspect and catalogue references with dates and uncertainty.
- [x] Build the queue, cobbles, rails, green post/chain, paint, lamps, rings,
  inspection counters, cashier hatch and connected curtain return.
- [x] Export; pass 148 Node checks and 12 accepted desktop/Android-emulated
  cases, including real routes, source/native parity and texture fallback.
- [x] Repair the independent door-opening collision finding, recheck both
  Physics and Camera, and compare nine before/nine after cost samples plus
  one focused six-before/six-after repeat for variable desktop/landscape timing.

Local acceptance and exact evidence bridges are in [VALIDATION.md](VALIDATION.md).
The validated runtime is isolated in `output/berghain-admission-candidate-runtime`;
concurrent architectural corrections stay preserved in the shared checkout.
The primary index remains untouched. The established isolated publisher owns
the scoped release; `output/berghain-admission-release.json` records the final
commit, deployment and public checks. Full Berghain reconstruction remains open.

Published `40c5035` and verified at https://germanysimulator.de/geheim/.
The public receipt confirms 77 exact files, six entry URLs and four
live desktop/Android-emulated route/native-model cases. Full receipt:
`output/berghain-admission-release.json`. The subsequent architectural work
is now exported, validated and published in the Karhard release above.

Current goal, 24 October 2026: isolate and correct internal architectural and
interior-design inaccuracies, especially toilets, smoking and backstage areas,
and render representative club-night lighting. This README remains the sole
task/plan owner. The active app goal is scoped to that request; full contemporary
accuracy cannot be asserted without resolving the evidence gaps below.

The current candidate adds a distinct Panorama sanitary enclosure below the
upper lounge, retaining main-floor Klo. A13/I21 establish separate sanitary
interventions; V05 corroborates the lounge-above-toilets relationship. The
footprint, heights, fixtures and opening are still estimated. The viewer now
uses low ambient light, localized colored dance-floor cues, practical lighting
and two bounded shadow maps indoors; exterior inspection retains daylight.
These steady cues are an appearance study, not a reproduction of a current
lighting program or the documented IVL fixture inventory.

Smoking registration is unresolved: I15/P10 show the east/front projection
approximately between the plinth belt and the lower tall-window tier, whereas
the current Panorama floor is at 13.25 m on the west side. The official western
annexes are not this projection. Its hidden attachment/depth and upper-return
route remain unknown. Do not solve this by labelling a western annex smoking
or extending an upper slab across the dance hall. V06 confirms backstage
dressing/cooling/storage rooms existed in 2010 but does not locate them.
No invented backstage room or public shortcut is part of this candidate.

- [x] Recheck architect, installer and firsthand evidence; isolate supported
  room relationships from uncertain placement. Source records V05/V06 added.
- [x] Implement separate upper toilets and a club-night lighting candidate.
- [x] Export and verify source/native geometry, continuous sanitary and lounge
  routes, desktop/Android-emulated visibility, entry/exit and bounded cost.
- [x] Freeze the integrated candidate; complete independent Physics and
  Camera/scale reviews and repair findings.
- [x] Publish and verify the accepted night/sanitary increment.
- [ ] Resolve smoking extension attachment and floor registration; reconstruct
  supported circulation. Locate backstage and remaining sanitary/service areas
  before claiming all internal inaccuracies corrected.

Local technical acceptance: 141/141 Node tests, 18/18 silent desktop/Android-
emulated browser cases, independent Physics/Camera rechecks and 9+9 cost
samples pass. See VALIDATION.md for receipts and limits. The tested 129-input
freeze is output/berghain-night-tested-candidate.json; later publication docs
are tracked through an explicit documentation-only bridge. No full-fidelity
or physical-device qualification is implied.

Further registration evidence: V05's author acknowledged a commenter correction
to Panorama's southwest-facing windows, conflicting with the current northwest
window wall. This is one testimony chain, not measured orientation. I01's
indexed circulation account describes an enclosed Panorama-to-foyer/Säule
shortcut; the low outside smoking box need not contain its entire stair.
Do not interpret the external height mismatch as proof that no upper link exists.
The next bounded investigation is I13/E05 After Hours footage and the primary
architect gallery for a continuous window/door/landing sequence before moving
connected floors. Details: output/berghain-smoking-registration-followup.md.
The catalogue now has 147 sources and the dated audit plus AU26 has 26 findings.

Implementation paths: assets/models/berghain/interior-topology.mjs and its
layout/fixture integration; berghain/night-lighting.mjs and viewer integration;
scoped Node/browser tests. No main-game runtime change. Candidate research:
output/berghain-interior-topology-notes.md. Pre-edit source/index hashes:
output/berghain-night-baseline.json. Latest accepted base is the release below.

Published night/sanitary increment: **73f741cdc8e37ab40a6ab3c9916de805cf9223fc** at
https://germanysimulator.de/geheim/. Pages 40133238964 succeeded;
all 76 public files match committed bytes, six entry URLs respond and 6/6
actual public desktop/Android-emulated room-tour and sanitary-route cases pass.
Receipt: output/berghain-night-release.json. This paragraph and the validation
handoff are local post-publication task-state notes; no additional runtime change.

The app goal remains ACTIVE. Full layout fidelity is not achieved. Subsequent
read-only access checking found I13/E05's film unavailable both at its player
and inside the creator page; no video frames were acquired or inspected.
Retain output/berghain-after-hours-reference/ and berghain-after-hours-embedded/.
Their capture PASS records the access diagnostic, not successful footage access.
Latest user priority: map all architectural and visual features on
https://www.karhard.de/projects/berghain against the model, including the full
project gallery, dated outtakes and usable drawings. Record each feature's
source, model counterpart, discrepancy and correction or explicit uncertainty.
Use registered stair/door/window sequences to revise the connected room graph.
Backstage still needs locatable evidence.

## Previous accepted first-person/Halle baseline

Published first-person/Halle increment:
**3f54d69b35f0c65fbb9b172cc85b1c26dc5bdf49** at
https://germanysimulator.de/geheim/. Pages **40100987700** succeeded. All 74
checked public files match committed bytes, six entry URLs respond, and **19/19
actual public browser cases pass**. Desktop and Android-emulated entry/exit,
main-bar stairs, Säule, desktop Lab, local Halle circuit, source/native views,
footsteps, blocked-door silence, mute/reset and stall recovery are covered.
Actual public frames were inspected. Final receipt:
output/berghain-first-person-release.json. The final 121-input freeze,
137 fresh Node checks, 44 local browser case/profile combinations (explicit
20+21+3 test-only bridge), independent Physics/Camera/audio acceptance and
9+9 cost samples are retained. All 141 baseline files and the original primary
index remain preserved. This paragraph and the matching validation handoff are
local post-publication task-state notes; no additional runtime change.

Full reconstruction remains incomplete. AUTHENTICITY-AUDIT.md owns 25 findings;
SOURCES.md contains 145 resource records. Next work must reconcile registered
Halle floor/soffit/entry evidence, Säule's dated pier/mezzanine/entry accounts,
and missing/partial artwork and PA inventory before claiming contemporary
fidelity. No dimensioned interior blueprint has been acquired. Physical
Android/device GPU and perceptual listening remain NOT RUN. Keep Astra for
subsequent complex Berghain modelling.

Earlier documentation-only publication: the139-record research update is published in a1f75fd142ee115dfb4255abcf55d5da0f95c213.
Pages40086607090 succeeded.72 exact public files and six entry URLs pass;
all109 runtime/asset/test inputs and the141-file baseline remained unchanged in that earlier documentation-only publication.
Receipt: output/berghain-topology-research-release.json. No new world or device
claim; the accepted runtime at that stage was687b408. The newer first-person/Halle release above supersedes it.

Current audit scope: room-by-room source/visual comparison and the coherent
Halle correction below. Physics owns room/floor/circulation evidence; Camera
owns photographed fixture/art/material comparison. Integrator owns archival/
firsthand synthesis, audit documentation, all GPU batches and publication.
George explicitly requested GPT-6 Astra for complex Berghain modelling on
24 October2026; preserve that preference for subsequent complex modelling tasks.
The active modelling worker is /root/berghain_astra_modelling using gpt-6-astra.
George also requested keeping the current chat on Astra; do not select another
model or silently downgrade complex reconstruction work.

Latest steering replaces the visible avatar/third-person camera with first-person
walking only, plus emulated footsteps with room reverb. Preserve the physical
1.8m visitor body and navigation, natural entry/exit and Astra's repaired Halle
geometry. Integrator owns viewer/walkthrough/camera, a scoped procedural footstep
module, sound control and affected tests/browser cases. Steps follow accepted
displacement, never held keys or blocked motion; user gesture unlocks Web Audio.
Room reverberation is an authored approximation, not measured acoustic data.
Normal first-person travel and the entrance crossing use1.6m/s with the same
collision/body rules;0.66m per footfall gives about145steps/minute at full pace.
Blur/hidden/modal/exterior/context-loss/exit clear input and sound ownership.
Old avatar-frustum acceptance is superseded by eye-height, headroom, collision,
look/route and audio-lifecycle checks. Retain rejected third-person evidence.
The superseded third-person GPU batches were stopped and their failures retained.
The combined first-person candidate has 121 frozen inputs, 137 passing Node
checks and 44 accepted browser case/profile combinations. The explicit 20+21+3
bridge changes only browser oracles and retains all four raw failures. Its 44-case sequential desktop/Android-emulated acceptance aggregate is
output/berghain-first-person-accepted-browser/report.json. Independent Physics,
Camera and audio reviews accept that same candidate within their technical
scopes. Nine baseline and nine current cost samples pass. The final deployed
commit and public verification belong in output/berghain-first-person-release.json;
this increment does not establish full architectural fidelity.

Footstep beat `berghain-walk-step`: accepted movement in the existing render
controller accumulates0.66m of3D travel, then schedules one finite original
sole/heel buffer on Web Audio time. A held key with no displacement and room
selection teleport cannot emit a step. Concrete, metal, tile and grit synthesis
reuse one lazy AudioContext, bounded four-source polyphony and one tail-suspend
timer. Position-based authored room profiles select stereo convolution; the
Halle and WC differ, outdoors has no wet tail. Footsteps: on/off is the local
user control. Native source end disconnects nodes; modal/blur/hidden/exterior/
context loss reset voices and reverberation; page disposal closes the context.
No recording, copied sound, audio service or extra frame loop is introduced.
Tests are silent; PCM/state checks cannot establish perceived sound quality.

Architectural reality checks requested by George are now in
check-architecture.mjs and For-AI/ARCHITECTURAL-CHECKS.md. They measure actual
geometry against dated source quantities and retain unknown/different-scope
results. The official hull import matches; Halle's22.753m floor-to-exterior-roof
proxy versus reported up-to21m remains unresolved. A06 project areas are not
the same domain as whole-hull floor supports. No dimensioned interior blueprint
has been acquired, and no invented percentage tolerance certifies the model.

Previous goal turn: **PROGRESS**. Säule/camera release
687b408cca2aa8a7e36c9bcd276f1e18af20f971 is deployed at
https://germanysimulator.de/geheim/. Pages40082417656 succeeded;72 public files
match Git bytes, six entry URLs respond and18/18 actual public desktop and
Android-emulated cases pass. Source/native structures, natural exterior entry,
Säule/Lab/main-bar routes, reverse exit and whole-avatar near-pier framing were
checked. Actual public frames were inspected. Final109-input freeze,113 Node
checks,22 local browser cases, both independent reviews and9+9 cost samples
remain bound in output/berghain-saule-release.json. All138 baseline files and
the original primary index are preserved. Full reconstruction stays ACTIVE;
exact topology, contemporary inventory, complete concrete wear/light wash and
artwork fidelity remain open. Physical Android/GPU and listening NOT RUN.

Previous goal turn: **PROGRESS**. Aged-plaster/practical-light release
e3ad14bc7fbdd884f6c7248e7395a424812db6a8 is deployed at
https://germanysimulator.de/geheim/. Pages40076278682 succeeded; 71 public
files match Git bytes, six entry URLs respond and 15/15 actual public desktop
and Android-emulated cases pass. These include source/native finish and light
parity, natural exterior entry/stairs/full bar aisle/reverse exit, and loaded
human camera visibility on all three layouts. The final 106-input freeze and
accepted 138-file baseline remain preserved; the primary index is untouched.
Final receipt: output/berghain-barfinish-release.json. Full reconstruction
stays ACTIVE. Physical Android/GPU qualification and listening remain NOT RUN;
the light pools and procedural wear still need photographic refinement.

Previous goal turn: **PROGRESS**. Roof/lower-relief release
8ce9014b0391e37a0df2094e2e91f026dfb583e6 is deployed at
https://germanysimulator.de/geheim/. Pages40071899249 succeeded; 71 public
files match Git bytes, six entry URLs respond and 12/12 actual public desktop
and Android-emulated cases pass, including natural entry/stairs/full bar aisle/
reverse exit on all three layouts. The 106-input freeze and accepted baseline
remain preserved; the primary index is untouched. Final receipt:
output/berghain-barroof-release.json. Full reconstruction stays ACTIVE.

Previous goal turn: **PROGRESS**. Historic-wall release
f1195e8700d91afab333eebbf6a9fc30744c267c is deployed at the permanent Geheim URL.
Pages40068029116 succeeded; 71 public files match Git bytes, six entry URLs
respond and 9/9 actual public desktop/Android-emulated cases pass. The 106-input
freeze and original primary index remain preserved. Receipt:
output/berghain-barwall-release.json. Full reconstruction stays ACTIVE.

## Published increment: authenticity audit and Astra Halle reconstruction

User steering24 October2026: audit the interior against as many archival and
verbal materials as possible, then maximize authenticity; use Astra for complex
modelling. AUTHENTICITY-AUDIT.md owns evidence findings, not task state. Both
independent source audits are output/berghain-authenticity-{architecture,objects}-audit.md.
Astra's reviewed proposal is output/berghain-astra-halle-design.md.

Accepted provisional implementation choices: Halle-only upper datum4.25m
(photographic proportion estimate, not measured), three distinct slab voids,
two single-flight concrete stairs with guarded landings, west under-stair WC,
corbelled frame, original rectangular hoppers and bounded mesh guards/services/
wall patches. Inherited7.05m floor and26.093m mapped steel flight are unverified.
A05 fixes an escape opening aligned with the eastern stair, **not an explicitly
east-facade position**. Do not cut or place that unresolved exit. Keep every
shell wall and official hull, the north club wall and all non-Halle rooms.
Room-selector starts establish local Halle circulation only, not natural entry.

Astra worker may edit only new assets/models/berghain/halle.mjs; final scoped
assembly in layout.mjs; targeted shape/metadata registration in model.mjs;
new tests/berghain-halle.test.mjs and berghain/halle-playtest.mjs; obsolete Halle
route expectations in tests/berghain-model.test.mjs and berghain/playtest.mjs;
Halle parity diagnostics in native-asset-playtest.mjs. No camera/navigation/UI/
other-room/dependency/root-game changes. Integrator owns GLB/manifest export,
all owning docs/provenance, browser/cost runs, freeze and publication. Preserve
all109 accepted inputs in the141-file baseline; pin retained instance tones
before changed batches can recolour other rooms. Worker does not commit/push.

Acceptance exposed a2.412mm support seam at the two affine bridge/orthogonal
landing joins; Astra owns rendered/support repair and multi-lane/step-size
regressions in the existing scope. The first integrated freeze is retained as
output/berghain-halle-rejected-candidate.json. Source/native6cases and the
desktop real-input circuit passed before the batch was stopped for repair;
those partial passes do not clear the independent physical failure.

Camera's independent actual-mesh sweep found whole-human cropping beside a
Halle guard/pier and the enclosed WC during the superseded third-person work.
George then explicitly replaced that perspective with first-person walking.
The current camera sits at the physical body's 1.68 m eye height with a 60 degree
lens and direct yaw/pitch. No player avatar is constructed or attached. The
1.8 m body, stair/guard collision, headroom and natural entry remain acceptance
requirements. Old third-person failures are retained; they do not approve the
new perspective. No geometry fading or collision bypass was introduced.

Fresh public desktop observational tour captured20 views across10 selector
rooms. An initial avatar-visible assertion failed at Panorama's quarter-turn;
keep output/berghain-authenticity-public-tour/report.json as failed evidence.
Observation-only continuation output/berghain-authenticity-public-observations/
report.json records the0.3994m camera contraction and hidden avatar. Its capture
PASS does not clear that camera issue or prove historical fidelity/natural routes.
Selected actual frames were inspected. That observation used the earlier public
runtime; the first-person candidate needs its own rendered acceptance.

- [x] Preserve/revalidate published research and accepted runtime; source audit
  by both independent reviewers and fresh rendered room comparison.
- [x] Complete dated archival/verbal evidence audit and prioritised room findings;
 25 findings in AUTHENTICITY-AUDIT.md, catalogue145. The full model remains incomplete.
- [x] Astra implements/tests the coherent Halle proposal, including physical
  landing seams and reduced mesh duplication within the asset budget.
- [x] Verify 10,419 retained parts and non-Halle isolation, export the portable
  asset and freeze the integrated 121-input first-person/audio/checker candidate.
- [x] Finish silent source/native/local body routes on desktop and Android
  emulation, retained entrance/Lab/main-bar regressions and the cost comparison.
- [x] Independent Physics and Camera/scale acceptance on identical candidate;
  repair and repeat affected checks. Preserve failed source/visual evidence.
- [x] Review coherent diff, publish accepted work and verify actual public bytes/
  controls. Full reconstruction remains ACTIVE; physical-device/listening gaps
  and all unsupported dimensions/currentness remain explicit.

## Published increment: entrance alignment and architectural topology evidence

Scope: catalogue, source audit and this owner only. No HTML, runtime, collision,
controls, portable model, asset pipeline or dependency change. Baseline687b408
is preserved in output/berghain-entrance-baseline/manifest.json:109 frozen
inputs plus32 ancillary files. The original primary index hash is unchanged.

G10's entrance=main node7553884077 belongs to building way25649554 and approach
footway1482428682. Matching the same official ALKIS ring in EPSG25833/4326 gives
a maximum affine residual below0.001m and projects the point to site
x−6.65445,z22.14898, compared with the model's x0,z22.28 door. Physics independently
computed x−6.6571,z22.1451. Camera's local-tangent calculation agreed. These
checks establish the mapping, not doorway-centre accuracy. Node history has
nearly identical2020/2026 positions and supplies no site survey.

Camera's follow-up matched P07's broad recessed twin-leaf portal and adjacent
narrow bay to I15's broad grey opening and green-poster opening. The mapped
fraction appears nearer the narrow adjacent opening. P08 cannot establish a
metric position. **Do not rebase the playable entrance on this OSM point.** The
current centre is also provisional. Resolve a registered photograph/drawing
before moving shell opening, animated door, interaction/spawn/queue and route
together. Source reports: output/berghain-entrance-source-physics.md,
output/berghain-entrance-source-camera.md and its -addendum.md. No new rendered
or device claim is made by those read-only audits.

SOURCES.md owns the139-record catalogue and dated evidence disposition.
New primary heritage/library/history/ARCH+/AdK records identify specific archive
routes without claiming original plans were acquired. ARCH+ contents146–151
conflict with the architect bibliography126–131. The Topolovac caption's2009
date conflicts with its visible2017/18 plaque. Models remain unmeasured; the
exhibition invitation requesting drawings is not evidence of delivered files.
Osio's cutaway has no north/site registration and cannot settle cardinal
main-bar or Lab placement. Research-only downloads/hashes remain ignored.

- [x] Revalidate the accepted publication and preserve its complete141-file
  baseline before any possible runtime edit.
- [x] Independently georeference the community entrance and check photo identity.
- [x] Record the unresolved adjacent-opening conflict; leave geometry provisional.
- [x] Catalogue verified new sources and explicit date/page/topology limits.
- [x] Verify the narrow documentation diff, publish and check exact public bytes.

Next model increment: **Halle structural topology**, still under this same owner.
A05 describes two straight cast-concrete stairs and three floor openings.
Six newly inspected A06 engineer photographs show massive/corbelled concrete,
mesh guards, stair nosings, cable trays/linear luminaires, patched walls and
retained hoppers. Current study has one western steel stair and a large central
void. Reconcile these forms and their room registration before replacing floors.
Preserve main club/Lab/Säule/art/sound assets and accepted109-file baseline;
new geometry requires fresh source/native checks, natural body/camera routes,
silent desktop/Android-emulated rendering, comparable cost evidence and both
independent world reviews. No dimensioned Halle plan/floor datum has been found.
Physical Android/GPU and listening remain NOT RUN; full goal stays ACTIVE.

## Previous increment (published): Säule concrete installations and belt housings

Published and verified:109-file freeze SHA256
ec7b9b1ec0fac956aec49b0b917a3db625f47096008d044a558205f23fd070f3,
output/berghain-saule-candidate.json. Current Node113/113 and terminal
output/berghain-saule-camera-final-browser22/22 PASS. Both independent
Physics and Camera reports explicitly pass this same freeze after inspecting
the repaired complete-human frames. Isolated baseline repeat and current cost
each pass9/9 after a retained baseline first-navigation failure. VALIDATION.md
records the landscape p95 median increase14.1→20.7ms and all ranges,7,081 added
normal-load bytes, unchanged26 maps/zero idle work and uncertified first startup.
The isolated acceptance gate passes113 Node,22 browser, both reviews and cost
hash bindings. All18 scoped paths were reviewed and pushed normally in
687b408cca2aa8a7e36c9bcd276f1e18af20f971, preserving the primary index.
Pages40082417656 succeeded for that exact head. All72 public files match Git
bytes and all six entry URLs respond. Actual public matrix is terminal18/18
PASS in output/berghain-saule-canonical-browser/report.json; its109 captured
hashes bind to published Git bytes. Six required public frames plus an additional
main-bar landscape frame were inspected; output/berghain-saule-public-visual-review.json
records their hashes. Release finalizer PASS; output/berghain-saule-release.json.
No browser/GPU batch remains running. Keep full reconstruction ACTIVE.
Preserve all failed and pre-camera evidence.

After public acceptance, prioritize the uncertain building/room topology before
adding more isolated detail. Research lead and four primary page snapshots:
output/berghain-topology-research-lead.md and
output/berghain-topology-primary-snapshots/metadata.json. Official heritage
record09085197 points to Stadttechnik(2006),pp302–306/396; full text/plans were
not obtained. Reconcile the current inferred western Lab and side-wall bar
with primary original-building evidence and the rotated survey frame. Secondary
layout descriptions are hypotheses to verify, not instructions to rotate rooms
or replace the official exterior. This initial lead is now promoted into the
139-entry catalogue above, with its unresolved limits retained. No institution
contacted or book purchased.

Continue from the verified e3ad14b release. A15's eight actual project images
(hero, three gallery views and four outtakes) and I24's three installer images
show massive rectangular concrete piers, flared upper transitions, projecting
corbels, padded concrete seats and continuous dark metal lighting belts. The
current 0.62m-wide columns with short red strips omit these defining forms.
Photo geometry supports the forms, not a recovered plan or precise dimensions.

Author an original post-calibration assembly through the existing fixture API.
Retain the current six central grid anchors as provisional placement; make
1.6×2.1m piers, flared caps meeting the retained floor underside, four attached
seats and two outward corbels. These are authoring estimates. Replace the six
central red strips with four-sided metal belt channels and recessed upper/lower
lenses. Preserve the three outer strips pending stronger perimeter evidence.
The belt's full photographic wash, unique cast-concrete damage, exact grid,
separate entry and complete bar/services still require later reconstruction.
This increment establishes physical structure and light-fixture geometry; it
does not claim calibrated or complete lighting.

Writable runtime scope: new assets/models/berghain/saule.mjs; layout.mjs,
interior-fixtures.mjs, model.mjs and surface-materials.mjs integration; GLB and
manifest regeneration. Reuse existing concrete/metal/leather map families and
lounge-pad geometry. Dedicated materials isolate old instance tones. No new
runtime, renderer, texture family, dependency, loop, lighting pass or UI.
Tests and existing native/material/natural-route browser pilots may extend
for the changed geometry; owning research/provenance/validation notes follow.
Keep the primary index untouched and use the established separate publisher.

- [x] Revalidate the accepted release and preserve its 106 inputs plus32
  ancillary dependencies in output/berghain-saule-baseline before edits.
- [x] Download and inspect all eight A15 project images; preserve actual gallery
  order, outtake distinction, URLs and SHA256 in karhard-saule-metadata.json.
- [x] Observe failing physical-form/contact/collision tests, then implement the
  photo-derived piers, caps, corbels, seats and actual wraparound belt housings.
- [x] Inspect source/native geometry/material views and actual human routes on
  desktop and Android portrait/landscape emulation; compare cost with baseline.
- [x] Freeze one integrated candidate and obtain both mandatory independent
  Physics and Camera/scale reviews; repair findings and rerun affected checks.
- [x] Publish accepted work and verify public bytes and interaction. Keep the
  full goal ACTIVE and explicitly retain all unverified architectural gaps.

Independent Camera review found a real crop in near-pier turn2 on all layouts
despite16/16 automated scalar checks. Keep the pre-camera freeze and those
reports as failed acceptance evidence. Extend writable scope to camera.mjs,
walkthrough.mjs and viewer.mjs solely to keep the complete human framed beside
the new opaque installations. Add independent actual-avatar frustum RED checks,
retain nine-ray collision safety, preserve the ordinary60-degree lens, and
verify real rendered frames and bounded camera settling. Do not accept the
geometry while this visual failure remains. Separately, the first landscape
pilot read stale exterior coordinates after room selection; its trace proves
the cause and the selected-position publication wait repairs that test race.

## Previous increment (published): aged bar plaster and warm pilaster wash

I23 views12/13/16 show mottled, worn cream plaster and localized warm upward
wash at the pilasters. The current clean pale material and uniform lighting
miss that composition. Reuse the original aged PBR family on a dedicated bar
plaster material; add six inferred warm practical uplights and small housings
above the rear worktop. Fixture count/type, candela, color, beam shape, precise
wear and present-day operation remain authoring estimates, not measured facts.

Physics review found the initial housings floating: four35mm above the worktop
and two without any worktop below. Six short actual steel brackets now connect
each housing underside to its pilaster, with paired solids. A new real-mesh
contact ray and support/pilaster overlap check covers every mount. The first
bracket ended at the pilaster face; extend its inner end into the pier so its
physical connection is unambiguous. Beam positions/settings remain unchanged.

Keep the same geometry factory, native Three.js lights, existing surface loader
and GLB exporter. Export the practical spots through KHR_lights_punctual so the
portable asset retains the same lighting. No new texture, dependency, runtime,
render loop, shadow map or UI. Preserve the calibrated hull, all existing
geometry/solids, navigation, camera and controls. Preserve existing instance
tones outside the wall when splitting its material batch; material regrouping
must not arbitrarily recolor unrelated pale surfaces.

Writable scope: main-bar.mjs, model.mjs, surface-materials.mjs, exporter and
GLB/manifest; existing bar-wall/material tests and browser pilots; owning
Berghain research/provenance/interior/validation notes. The current README owns
the plan. Mandatory independent Physics and Camera/scale review uses the same
frozen integrated candidate; silent headless GPU batches remain sequential.

- [x] Revalidate the prior release and preserve its 106 inputs plus32 ancillary
  dependencies in output/berghain-barfinish-baseline before production edits.
- [x] Observe RED for actual aged plaster assignment, aimed practical lights
  and portable light color/intensity/range/cone/transform preservation.
- [x] Implement the finish and practicals; export and inspect source/native
  matched views and lit/unlit wall contrast against I23 photographs.
- [x] Verify unchanged geometry/solids and unrelated instance tones, walk routes,
  loaded/fallback/restore behavior and comparable nine-context-per-side cost.
- [x] Freeze one candidate, obtain both independent scoped reviews and repair
  findings. Final106-input SHA256
  6965cf57176a40cbbc36219bd71bcee3be8dc2c60234c9b834dc05d9917642fa;
  Node109/109 and monolithic current-hash browser22/22 PASS. Both scoped world
  reviews pass after supporting all six lights. Cost covers nine cold contexts
  per side at the actual bar aisle; VALIDATION.md records metrics and limits.
- [x] Publish and verify public bytes and actual natural entry/exit. Full
  reconstruction remains ACTIVE; lighting falloff and unique site wear remain
  more regular than the photographs and need further fidelity work.

Research gathered during the bar-finish deployment is now incorporated as
I24 and L01–08 in SOURCES.md, bringing the local catalogue to128 records.
Primary manuals, manufacturer CAD inventories and inspected Säule installer
photos remain under references/downloads/; no third-party media ships as
assets. The manufacturer reports eight IVL
Dice and four IVL Photon across Berghain/Panorama; room split and placement are
unverified. Säule photographs show column-belt lights and bar/partition details
that warrant comparison with the current assembly. Keep the current owning
plan here; incorporate the evidence and rights limits before the next change.

Rendered diagnosis found a pre-existing surface-normal projection error under
nonuniform scale: 2,990/3,960 relief vertices select different UV planes from
the exporter's inverse-transpose normal. Disabling normal-map strength leaves
the color mismatch; neutralizing base color or hiding reliefs removes it.
Correct the shared Berghain surface shader to use inverse-transpose normals,
retaining the existing parity tolerance. This also corrects projected maps on
other unevenly scaled curved fittings; inspect representative artwork/furniture
source/native views. Existing geometry, materials outside the plaster, instance
tones and exported metre-UV algorithm remain preserved.

## Previous increment: bar roof and relief/worktop relationship

I23 photos 11/12 show concrete cross-beams surrounding inset blue gridded roof
panels above the bar/guest aisle. At least three panels are visible, but the
full count, optical material, dimensions and present-day illumination are not
established. Recreate the visible construction with four inferred roof bays,
real beam depth, inset opaque blue appearance panels and a steel lattice. Keep
the architect-reported nominal 11 m height at the lowest roof-beam underside;
the backing and panels sit above it. Do not describe the blue finish as a
verified current skylight or operating lighting system.

I23 photos 12/13/16 place the lower reliefs fully above the service worktop.
The prior 1.02 m center partly buries them behind it. Raise that row and its
panel rims, move the lower window sill above the relief panel, and retain
actual deep reveals. These are photo-informed relative corrections; neither
the 6.65 m floor datum nor wall/window/bay dimensions becomes surveyed. The
upper row and full room proportions still need stronger metrical evidence.

Use main-bar.mjs, its existing materials/box fixture interface and native GLB
export. Preserve outer hull, all columns/floors/stairs, counter/stools/service
notches, PA, partial artwork, camera and production controls. No new texture,
dependency, renderer, lighting pass or runtime. Allowed writes: main-bar.mjs,
GLB/manifest, focused roof/wall tests and browser pilot, Berghain owning notes.
Reuse the current plan owner and existing browser/performance harness.

- [x] Preserve accepted 106 inputs and 32 ancillary dependencies before edits.
- [x] Observe failing real roof-depth and relief/worktop separation checks.
- [x] Replace the flat ceiling with photo-informed roof construction and
  correct the lower wall composition; inspect matched source/native frames.
- [x] Check actual meshes/clearances, natural entry/aisle/return, camera turns,
  fallback/restoration and before/after cost on the supported emulated layouts.
- [x] Freeze the combined candidate, obtain both independent read-only world
  reviews and repair findings. Final 106-input SHA256
  abfd98409d76ade28b71503fdcf1c5f5f59a456d0576927e8a1210f25009b2f8;
  Node106/106 and explicit three retained natural routes plus13 final-material
  visual/lifecycle cases pass, with exact geometry/BIN equivalence. Cost compares
  nine cold contexts per side. VALIDATION.md records the desktop tail cost,
  evidence bridge and scope limits. Both independent scoped reviews pass.
- [x] Publish and verify exact public bytes and actual canonical interaction;
  keep the full reconstruction goal ACTIVE.

Previous goal turn: **PROGRESS**. Main-bar release
f18cd2cbedfe85c20231356934404b1e95031c79 is deployed at the permanent Geheim URL.
Pages40063573644 succeeded;71 public files match Git bytes, all six entry URLs
respond, and9/9 actual public desktop/Android-emulated cases pass. The104-input
freeze and original primary index remain preserved. Receipt:
output/berghain-mainbar-release.json. Full reconstruction stays ACTIVE.

## Previous increment: historic interior bar façade

Re-reading primary architect A07 confirms an approximately11m-high bar room
containing a former exterior façade that is now inside. I23 views12/16 show
deep window reveals, two rows of circular reliefs, tall stepped pilasters and
an upper cornice. Existing generic outer-wall windows do not reproduce this.
Author an independent interior assembly from original geometry, preserving
the measured exterior hull. The bar-side absolute location, bay dimensions,
counts and currentness remain inferred;11m is an architect-reported room height,
not a survey. Do not change outer elevations from an interior photograph.

Extend main-bar.mjs and its existing geometry factory/fixture API: five inferred
bays behind the service counter, recessed dark windows, two circular relief
rows, pilaster bases/caps and stepped horizontal trim. Add the room's ceiling
at11m clear height; retain its actual supports and the open guest aisle.
Reuse existing materials/maps/instancing/export and the accepted camera/input.
No new runtime, dependency, UI or photographic texture. Preserve accepted104
inputs plus32 ancillary dependencies in output/berghain-barwall-baseline.

Allowed writes: main-bar.mjs, GLB/manifest, scoped wall Node/browser tests and
owning Berghain source/interior/provenance/validation notes. Model metadata
already exports mainBar; only change another hook if required by actual evidence.
The shared lounge-playtest travel pilot also needs bounded real-input corrections:
a traced landscape stair run crossed its target before touch release arrived.
Keep the existing .23m accuracy requirement and production controls unchanged.

- [x] Verify the previous release, primary index, source images and architect text.
- [x] Preserve the accepted baseline before touching production geometry.
- [x] Observe meaningful failures for missing relief/recess geometry and11m room.
- [x] Build and inspect the complete wall composition against both primary views;
  verify real depth, existing counter/structure clearances and traversable routes.
- [x] Export native geometry, inspect source/native/human frames across desktop
  and Android emulation, and compare actual loaded/idle/transfer cost.
- [x] Freeze one integrated candidate, obtain both independent world reviews
  and repair findings. Final 106-input freeze SHA256
  b77612dc44df5168a19eff8090ca2a05fee1523f0208a0b596823a26e6859e69;
  Node 100 plus packaging 4, fresh browser 13/13 and extra corrective-input
  branch 1/1 pass. Both scoped independent reviews pass. Cost: nine cold
  contexts per side, same requests/maps and broadly stable local p95 tails.
- [x] Publish and verify canonical bytes plus real public interaction. The
  owning output/berghain-barwall-release.json receipt records actual results.

At that release, medallion/recess geometry and scale were scoped progress.
The weathered facade finish and photographed blue gridded roof remained absent;
the current increment addresses the roof and lower relief relationship.
The comparatively clean wall does not complete room fidelity. The service path is a tight one-person
pinch; deep unreachable wall/cabinet starts exceed bounded collision recovery.

Previous goal turn: **PROGRESS**. The balustrade release dd20eb55cf52baedd389deaca5501c60edc749e4
is deployed at https://germanysimulator.de/geheim/. Pages40058076329 succeeded;
70 public files match exact Git bytes and 9/9 actual canonical desktop/Android
portrait/landscape cases pass. All 101 accepted inputs and the primary index
remain preserved. Receipt: output/berghain-balustrade-release.json. Full goal ACTIVE.

## Previous increment: long main bar and glazed room boundary

I23 adds 17 directly inspected architect lightbox views (00–16). Views11–14
show the long counter, curved return, two luminous ribbed bands, dark middle
panel and metal stools. View16 shows its glass screen toward the hall; it is
not evidence of an outside window. Other views expose ducts, standing tables
and a switchback stair whose exact location/floor remains unresolved. Do not
replace a stair based only on an unlocated photograph.

Design: replace the generic two-metre-high main-bar boxes with an original
1.12m counter, rounded return, ribbed luminous bands, service worktop and metal
stools. Add the photographed tall steel/glass separation toward the main hall,
with open ends and a body-clear guest aisle. Retain the calibrated hull, floors,
column grid, original stairs, PA and artworks. Room footprint, counts, height,
photo dates/currentness and relation to existing columns remain estimates.
Fit actual cabinet/worktop notches around retained piers rather than hiding
intersections or moving the structure to make a test pass.

Allowed writes: new main-bar.mjs within the root Berghain asset authority;
layout/fixture/model hooks, GLB/manifest, focused Node/browser checks and owning
research/validation notes. A reproduced near-screen hidden-avatar failure also
requires scoped walkthrough camera steering and passing existing frame dt from
the viewer. Reuse existing Three.js, box/rod/ring batches, PBR maps and navigation.
No new runtime, dependency, lighting pass or texture family.

- [x] Inspect the actual primary gallery and archive selected URLs/hashes.
- [x] Preserve the accepted 101-file baseline plus 32 ancillary dependencies.
- [x] Observe failing human-height, glass separation and continuous-aisle checks.
- [x] Build the complete bar assembly and glazed boundary; inspect actual mesh
  bounds, retained-structure intersections and human clearances.
- [x] Export the same native GLB, inspect same-light/source/native composition,
  walk from the actual entrance to the bar and return on all three viewports,
  and verify fallback/graphics recovery with comparable cost.
- [x] Freeze the integrated candidate for both independent read-only Physics
  and Camera/scale reviewers and repair findings. Final104-file freeze SHA256
  2f6d287764e57d84b30a5847905cbf6cd08283fd149f0d0564c3a9643e10e1b8;
  99 Node checks and13-case browser coverage pass. VALIDATION.md records the
  explicit9+4 evidence bridge after the fallback-banner repair and measured cost.

Publication and exact public-byte/route verification belong to the same scoped
release; consult output/berghain-mainbar-release.json for the actual commit,
Pages result and canonical browser receipt. Full realistic goal stays ACTIVE.

Andrea v2/v3 diagnostics remain unaccepted and outside shipped assets. The
custom loft is pipe-like; the heavier CC0 anatomical target improves mass but
does not reproduce the shoulder cut, exact arm/grip or cast detail. Evidence:
output/berghain-andrea-additional-study-evidence.json. Keep Andrea on the full
artwork backlog; neither successful render establishes artwork fidelity.

Previous goal turn: **PROGRESS**. Lab release
ad12fc4f15f8b14e41c55977b56c2df6b6100fd4 is deployed at
https://germanysimulator.de/geheim/. Pages40046556651 succeeded; all68 published
files match Git bytes, all six root/3d/Geheim/model routes respond, and9/9 actual
canonical desktop/Android-portrait-emulated browser cases pass. Full realistic
reconstruction remains ACTIVE. The original primary index is unchanged.

The current research pass adds eight resources (M07–08, ART20–25). Official
VRChat metadata confirms a public Berghain-inspired world, but its poster and
login-gated page do not establish a reusable architectural asset. The UE5
creator's22-image film gallery is now directly inspected; its LED-volume
adaptation cannot supply measured building dimensions. Fresh public GitHub
searches found no source for those two projects. SOURCES.md records the limits.

Andrea research now distinguishes the installed Andrea I commission from later
versions and supplies first-work scale references. Next aligned asset work is
an original form study using ART07/08/20/23/25, with published axis ambiguity,
unverified cast/mounting and hidden attachment kept explicit in INTERIOR.md.
Do not substitute a later edition or a generic arm and claim faithful acceptance.
No world, renderer, controls or model assets changed during this research pass.

Local Andrea feasibility study remains **UNACCEPTED / NOT SHIPPED**. The ignored
output/study-andrea-form.py uses verified R01 CC0 anatomy with original poses;
output/andrea-form-review-eighth records four silent desktop diagnostic views.
Rendering succeeds, but its generic shoulder cap, muscle/hand relationships,
hammer form and UV seams fail reference fidelity. Do not promote this study or
mistake the one-case render result for artwork acceptance. All98 accepted Lab
world/test/asset files remain unchanged. No new in-world placement was made.

Further direct ART23/25 image inspection supplies a reverse three-quarter view
and a fair display on a crate. The shoulder cut is visible as a standing base;
neither fair photograph proves the club's wall, orientation or attachment.
Revise the actual three-dimensional shoulder/elbow/wrist relationship against
both views before more surface work. Use the existing metre-scale assembly,
material/export pipeline, then source/native and human-route checks plus both
independent world reviews before any runtime acceptance. Full goal stays ACTIVE.

The [Lab.oratory increment](LAB-PLAN.md) now includes photographed industrial
forms from all ten architect gallery views (A12/I22): pipe/gauge bar, T stools,
insulator pendants, barred sling cells, bunks, brick passage, ornate green
sanitary screen, historic window forms and bench. An inferred raised gate from
Säule permits continuous avatar entry; a real seven-tread stair/opening reaches
a lower tiled landing and returns. A15 supplies connection context, not its
coordinates. Floor.05m, soffit4.15m, beam underside3.60m and sanitary drop1.20m
are authoring estimates. Complete plan, outside Lab entrance, hidden rooms,
equipment inventory, fine finishes and current installation remain unresolved.

The published98-file Lab freeze passes91 Node checks,6 route-packaging checks and35 silent
browser cases across desktop and Android portrait/landscape emulation. Both
independent world reviews accept this partial increment. Source/native portal
rays, close views, material parity, real entry/bar/stair/exit routes, image
admission/failure, graphics recovery and text layout pass. Existing rooms,
artworks and PA remain present. The shared image loader now uses the existing
two-job asset queue, pauses optional starts while hidden and skips retired work.
VALIDATION.md records measured before/after costs and the remaining limitations.

Lab baseline portable GLB:46,003,152B /607,956 triangles /143 groups /25 embedded maps;
SHA2564608f39d17e04761b59f7edb45de0000de03e7a261a6873b753a1e576e727137.
There are83 fixture assemblies,44 PA components and2 partial artwork studies.
Three original aged maps reuse the existing material pipeline; all23 previous
images retain their hashes. Normal page transfer adds701,934B, without loading
the GLB. The accepted pre-Lab runtime is preserved in output/berghain-lab-baseline.
The source catalogue now has118 unique records. Public route remains
https://germanysimulator.de/geheim/; the current publication/verification receipt
belongs in output/berghain-lab-release.json. Full realistic reconstruction stays
ACTIVE; physical Android and perceptual listening remain NOT RUN.

Pre-Lab canonical checkpoint: https://germanysimulator.de/geheim/ serves the partial
Together runtime80c6660. Pages40037731294 completed SUCCESS; canonical asset
verification passes63/63 exact Git-object files plus six root/3d/Geheim/model
responses. Fresh canonical browser acceptance passes9/9 actual public desktop
and Android portrait-emulation cases, with all91 source hashes bound to Git:
output/berghain-marr-canonical-browser/report.json. Natural avatar approach,
E/tap doorway entry/exit/refresh, source/native artwork and continuous bar/WC/
open-cubicle/return movement pass. Physical Android and listening remain NOT RUN.
This supersedes earlier pending deployment statements below.

Catalogue update now contains108 unique records: ART17–19 add Bisky's own
30m/multiple-canvas account, institutional placement opposite the cloakroom and
a primary gallery date for Göthe's permanent commission. These are new research
constraints, not new artwork geometry. Documentation-only follow-ups preserve
all91 runtime/test/authoring bytes; distinguish their deployment from the already
verified80c6660 model. Full artwork and realistic building reconstruction remain
ACTIVE, including the explicit fidelity gaps below.

Partial Together release80c66603bcb3a401968e11a351e553230bbf12b0 is pushed.
It adds the scoped relief/material/export increment described below in41paths.
Versioned preview:
https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/80c66603bcb3a401968e11a351e553230bbf12b0/geheim/index.html .
output/berghain-marr-immutable-verification.json passes63/63 exact public files;
output/berghain-marr-immutable-browser/report.json passes9/9 actual public
desktop/Android portrait artwork, native optics, Klo/WC/continuous human route
and natural E/tap doorway entry/exit/refresh cases. All91 reported source hashes
bind to the actual published Git objects. Pages run40037731294 owns deployment;
permanent-domain acceptance now matches this release's actual assets and controls.
Final deployment observations belong in output/berghain-marr-release.json and
the canonical verification/browser reports. Do not re-push runtime or restart
CI because an observation times out. The full building/artwork goal stays ACTIVE.

Research-only publication eb00e1ea9d532afe30daa10c4ef016dad021b073 updates
only README/INTERIOR/SOURCES/VALIDATION on top of c8. It includes105 unique
source records and the rejected-study/canonical-acceptance notes below; it
ships no experimental runtime, anatomy or research download. Pages run
40032215770 completed SUCCESS. Canonical verification at
output/berghain-research-canonical-verification.json confirms52/52 exact public
files against eb00e1e and six root/3d/Geheim/model entry responses. The105-record
catalogue is deployed on the permanent domain.
Fresh output/berghain-geheim-final-entry-verification/report.json passes2/2
actual canonical desktop/Android portrait natural human approach, entry,
exit and refresh. No new world review is needed for this documentation-only
commit; c8 remains the accepted world/runtime baseline.

Accepted partial increment: Together's reclining relief figures and original amber
material. Integrator owns together-geometry.mjs/together.mjs under the existing
asset authority, bar rear-case refinement, artwork/material/model/export hooks,
scoped tests/playtest and owning notes. Reuse the existing Three.js/GLB pipeline
and original procedural maps; no source pixels or third-party sculpture mesh.
Anatomical authoring inputs may use the explicitly verified CC0 MakeHuman core
assets in R01; these are generic anatomy, not Marr's unavailable sculpture scans.
ART04 all24images now inspected; nine metres and2013 are documented, but figure
count, exact complete order, missing surfaces and case dimensions remain
unverified. Anatomical faces/hands/nude bodies/fused base must follow
observed relationships; a walking-avatar substitute does not satisfy fidelity.
Keep any provisional reconstruction label until visual review establishes its
actual fidelity. Preserve accepted c8runtime in output/berghain-marr-baseline.
Use built-in physical transmission for amber and retain it in portable glTF;
measure its render/load cost before acceptance. All anatomy must stay inside
the display glass and existing body barrier. Validate source/native close views,
bar/WC/entrance routes and both required world reviews on one frozen candidate.
The full building/artwork goal remains active.

Current technical candidate is output/berghain-marr-candidate.json (91 frozen
runtime/test/authoring/asset files; owning acceptance notes are separate).
Continuous CC0-derived anatomical relief replaces the rejected primitive bodies;
original poured contour/ivy/pipe fragment, clear display glazing and a rear case
are included. A separate UV1/G thickness atlas, original bubble/coat normal maps
and viewer reflection panels improve the amber response. The GLB preserves those
standard physical-material fields and every embedded material map. Full artwork
fidelity remains unproven: generic faces, pale/smooth high-lit views, the complete
complex pose/narrative/likeness and satyr/animal ornament still differ from ART04.
Both independent reviewers accept scoped technical C/P/X1 checks on the final
91-file freeze; they do not certify full artwork realism. Exact final integrated
browser report output/berghain-marr-half-integrated-browser/report.json passes
20/20 across desktop and Android portrait/landscape emulation; all91 source
hashes match the freeze. All74 focused Node tests pass after the exporter fix. Matching source/native art
parity is mean RGB.36818/255, large-delta pixels.0835%, textures23/23 disposed.
The initial parity failure exposed exporter-forced double-sided glass; preserving
the authored side fixes it without changing the1-RGB-level comparison tolerance.
Matching before/after cost suites pass9/9 each. Full-resolution transmission
initially regressed desktop frame-p95 from14.1 to48.4ms; this candidate uses
Three.js transmissionResolutionScale=.5, reducing it to20.9ms median in three
case-facing samples. Main-view resolution and geometry remain unchanged.
Portrait/landscape emulation medians are20.8ms, versus13.9ms baseline. Cold-ready
medians increase by421–452ms; normal transfer adds953,059B and the optional GLB
adds10,923,940B. Draw calls and geometry cost remain higher; this is not physical
Android or60fps qualification. See VALIDATION.md for evidence and limits.
The frozen GLB is35,996,040B,467,408 triangles,113mesh/material groups,22embedded
material maps, SHA256d5e2a864733c82a707da41c43e8eba91acf7515f5fa84166f6598a0208e59c5b.
Existing camera and visitor movement algorithms remain unchanged; the viewer's
transmission setting is the only renderer quality adjustment.
Publish this accepted partial increment by scoped fast-forward after tree review;
record public-byte/actual public-route verification separately. The broader
artwork and full-building goal remains active.

Prior accepted architectural publication: Klo Bar/sanitary commit
c8babb806a484932f441ad3bb94f5de47145f551 pushed by normal fast-forward on
defd99867ef373831ff3b320a711a013a9e7e4ef, preserving all concurrent street/CI
work. Versioned preview:
https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/c8babb806a484932f441ad3bb94f5de47145f551/geheim/index.html .
52/52 public asset/viewer/catalogue files exactly match actual Git bytes in
output/berghain-klo-immutable-verification.json. Actual published public walkthrough passes6/6 in
output/berghain-klo-immutable-browser/report.json: exterior entry/exit, source/
native bar and toilets, continuous human open-cubicle/return route; all75source
hashes bind to actual published Git objects. Final public frames inspected.
Pages40027742985 completed SUCCESS. The permanent
https://germanysimulator.de/geheim/ now serves the accepted c8 release:
output/berghain-klo-canonical-verification.json confirms52/52 exact Git bytes
and six successful entry responses. Actual public desktop and Android portrait
emulation pass6/6 in output/berghain-klo-canonical-browser/report.json:
controllable human exterior approach, E/tap doorway entry/exit, refresh,
source/native bar and toilets, and continuous open-cubicle/return movement.
Its isolated c8 suite imports output/berghain-marr-baseline so unpublished
artwork experiments cannot alter the expected public baseline. Primary staged
index remains untouched. Physical Android and perceptual listening NOT RUN.

Unpublished Together prototype was visually REJECTED despite17/17 scoped
structural tests and1/1 source/native browser case: separated primitive anatomy,
rigid rectangular base and opaque brown response do not match the photographs.
Do not publish it or treat test PASS as fidelity acceptance. The CC0 anatomical
authoring study in output/marr-anatomy-study.py produces continuous skin and
hands from pinned MakeHuman data. Its1/1 neutral/transmission inspection is
authoring-only: torso cuts, pose relationships, closed cast transitions,
Baroque ornament, bubbles and backlit amber remain unresolved. At that rejected-study checkpoint no anatomical
asset or application code entered the accepted runtime. The later partial
anatomical increment described above supersedes the study; it imports no
MakeHuman application code. Download
hashes/licences are in the ignored references/downloads/makehuman directory.


Klo Bar and sanitary architecture now exist in the integrator-owned candidate.
Original forms follow ART04/ART14/I19/I21: red enclosure, switchgear mesh/staff
gate, segmented glazed cases, ten splayed stools, bar back, four steel cubicles
(two open), hollow pans, protected vertical lights, upper lit mesh transoms,
a double-sided trough/core with taps/drainage, hand dryers and floor grates.
The c8 checkpoint had no Together figures. The later partial increment adds
generic anatomy; its full figure sequence and artwork likeness remain unfinished. Absolute western first-floor arrangement,6.65m floor/9.80m ceiling,
connections/counts/dimensions and currentness are explicitly estimated. Toilet
photographs span2009/2013/2015 and individual floor assignment remains unknown.

Final75-file freeze: output/berghain-klo-candidate.json. Export
SHA256 cf26925ecb4a8a3d76ef88b2032dc5fabaf568bfa5a9c221ff9034645d15a0d4,
25,072,100B /257,772tri/108material-mesh groups/18original embedded maps.
Fresh69focused Node tests pass. The independent Physics reviewer accepts the
final rebind, including local recovery from a deeply invalid wash-core start.
Current final source/native/default views and320px/200% labels pass4/4 in
output/berghain-klo-transom-browser/report.json (all53captured runtime hashes
match). The earlier repaired7/7 covers the same full-body bar/WC/cubicle/return
route; only overhead mesh and default selector framing changed afterward.
Existing-flow18/18 covers entrance/lifecycle, upper lounge/stair, Panorama,
speakers and foyer furniture, bridged across only the new local wash-core
collider and subsequent overhead/view additions. Both independent reviewers accept the final freeze: Physics P1/P2/P4/P5/scopedX1
PASS; Camera C1–C5/scopedX1 PASS. Comparable cost runs pass9/9 before and9/9 after.
Normal transfer grows13,335B; idle work stops in all18runs and product frame p95
stays about14ms on the identical Panorama path. Retain exact earlier snapshots
instead of calling old hashes current. Scoped publication is recorded above.
No renderer, dependency, texture family or input loop was added.

Previous published Berghain release851567d3e92efe1c7b50106d352adb73f66f3101
contains the upper lounge/ceiling/services and has51/51 exact immutable files
and6/6 actual public browser cases. Versioned preview:
https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/851567d3e92efe1c7b50106d352adb73f66f3101/geheim/index.html .
The permanent https://germanysimulator.de/geheim/ previously served that851release:
51/51 exact public files and all six entry responses pass in
output/berghain-services-canonical-deployed-verification.json; actual public
source/native ceiling/radiator and human door entry/exit/refresh pass6/6 in
output/berghain-services-canonical-deployed-browser/report.json, desktop and
Android portrait emulation. Pages40020726888 completed SUCCESS. The newer Klo
release and its canonical acceptance supersede that baseline, as recorded above.
Concurrent street work and CI-timeout changes were preserved in c8's parent.
Primary original staged-index SHA256 remains
704aa6efaa460b62afae0eb826c95ec075c54aff3b91b61dd4a5f6f00ecb2105.

The catalogue now has105unique source records. Corrected primary identification:
I19's switchgear counter is Klo Bar, shown with Together in ART04, rather than
an established earlier Panorama counter. Candidate source/GLB metadata carries
the correction. Research-only copies remain ignored and excluded from shipping.
Full realistic reconstruction remains ACTIVE: Together/all other artwork,
Lab.oratory, service/elevator/cabin spaces, complete room connections, measured
interior geometry and contemporary fixture/currentness verification remain.

## Prior integrated checkpoints

Accepted integrated increment: the missing upper Panorama lounge, informed by the
architect's expanded gallery inspected in the browser and saved research-only.
I18 documents corridor lighting; I19 shows the stair, overlook, glazed enclosure
and angular Felsenland seating; I20 confirms the designer's 2010 Berghain work.
Allowed writes: upper-lounge.mjs, existing layout/model/fixture assembly, both
room selectors, scoped lounge tests/playtest, exported GLB/manifest and these
owning notes. Preserve exterior, speaker and artwork releases, original index,
root game and existing navigation/camera behavior. No new renderer/dependency.
Floor 16.35m, rise 3.10m and ceiling 19.00m are authoring estimates, not measurements.
Validate full-body route from Panorama, fourth stair both ways, underside and
rail clearance, seating/room source-native rendering and UI on desktop/Android
portrait/landscape; freeze one candidate for both independent world reviewers.
Printed Brandenburg imagery, Felsenland's unobserved surfaces and contemporary
retention remain unresolved. Full building goal stays open.

Previous publication checkpoint, 2026-10-23: original Panorama figure increment published as
`e75b829a34e9d27187fcad0a831c5a8b3c34f196`, preserving exterior/speakers parent
`c6041f61a9986558de6c20ee38c37add80663280`. The versioned live walkthrough is
https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/e75b829a34e9d27187fcad0a831c5a8b3c34f196/geheim/index.html .
All 46 public files exactly match Git objects; six actual public desktop/Android
portrait-emulated entrance, source/native artwork and avatar cases pass. Evidence:
`output/berghain-artwork-immutable-verification.json` and
`output/berghain-artwork-immutable-browser/report.json`. The permanent Geheim
page has the controllable avatar and natural door entry. At that checkpoint it served the
accepted c604 exterior/speakers; artwork Pages run 40007555342 was in progress.
The canonical verification above supersedes that pending status.
Do not claim the latest figure is on the permanent domain until its manifest
SHA256 `9970accf87430557bf37f41674c97c9315f3d8e4f2482bcd00aa7e1ed07c8da7`
and public interactions are verified there. Primary index remains untouched.
The sculpture is an initial stylised study; full fidelity and remaining rooms
are still required. The following exterior work paragraph is retained history.

2026-10-23 exterior priority: George requests substantially more work on the
outer building and parallel completion of its landscaping. Three scoped workers
own landscape geometry, envelope details and source research. Codex owns hookup,
portable export, sequential silent browser checks, independent Physics and
Camera/scale acceptance, and scoped publication. Keep the surveyed exterior
envelope, existing rooms, visitor dimensions and entrance route. Site planting,
surface courses and furniture placement remain explicitly inferred. Plan:
integrate both geometry modules; inspect front/rear/garden and real entry on
desktop/Android emulation; verify collision/export/resource bounds; freeze and
review one candidate; publish only the reviewed exterior delta while preserving
other chats' unpublished sound/interior work. Full architectural completion
remains open.

- [x] Register the active goal and create this scoped workspace.
- [x] Search the public web and GitHub for pre-existing models and references.
- [x] Create the reviewed online resource catalogue, including source access and reuse status.
- [x] Inspect primary architectural images and establish a provisional façade and room-volume study; retain dimensional gaps.
- [x] Build the hidden architectural viewer with outside/inside navigation and explicit reconstruction status.
- [ ] Create and refine the full model; document dimensions, source links and uncertain geometry by space.
- [x] Export and validate a portable GLB with sensible materials, real units and model hierarchy.
- [x] Check the provisional viewer's exterior framing, sampled interior paths, bounds, camera clearance and idle/browser costs; obtain independent physics and camera/scale reviews. Targeted unrun checks and physical-device qualification remain in VALIDATION.md.
- [ ] Complete remaining evidence gaps before calling the asset fully realistic or complete.

## Acceptance

The catalogue must distinguish verified resources from search leads, downloadable geometry from videos, historical drawings from current layouts, and publicly viewable media from reusable assets. Each modelled zone needs a traceable source or an explicit inferred label. A façade fragment or a visual prototype does not complete the full-asset goal.

The hidden viewer must use the existing project dependency, show the exterior, support entering and leaving the model and visiting interior spaces, work with keyboard and touch, preserve visible focus, and carry `noindex` metadata. It must not appear in ordinary game navigation. Run browser checks silently and distinguish emulation from physical-device results.

Keep shipped resources under the root [assets](../../assets/) authority and use the shared [asset rules](../../For-AI/ASSET-POLICY.md). No game mission, entry URL or main-game layout changes are requested. Research/prototype acceptance does not establish the full goal's completion.

## Viewer implementation plan

Integrator-owned implementation; reuse this page as the plan and state owner. The user's creation requests authorize execution. The first candidate is an explicitly provisional architectural study, not the final surveyed asset.

Allowed edits: this `berghain/` scope, new `assets/models/berghain/` model data/geometry/exports, scoped tests under `tests/`, the existing static builder's Berghain copy boundary, the root subject-index link, and the existing Pretext provenance's consumer list. Preserve main game/controller, existing assets, and unrelated staged work.

1. Finish the source catalogue. Inspect primary images, retain dates/access/licensing limits and evidence gaps. No third-party image becomes a shipped texture by default.
2. Add a focused failing test for full-body movement against the same walls/floors used by the model, and a packaging test preventing reference downloads from entering the static build.
3. Build an original metre-based model under the existing asset authority: articulated concrete façade/windows, structural halls, foyer, principal floors, stairs and garden. Store per-space confidence and sources. Reuse local Three.js r186; keep the current game unchanged.
4. Implement `model.html`, `viewer.css`, `viewer.mjs`, and bounded navigation with a working exterior orbit, interior entry, room selection, touch/keyboard controls, exit/reset, readable load/WebGL failure and noindex metadata. Reuse locked local Pretext 0.0.9 and its bundled font; measure actual touched labels and retain readable reflow.
5. Export a portable GLB from this model, validate bounds/materials and retain provenance. Include only the viewer runtime in static packaging; authoring documents/downloads stay out.
6. Run deterministic movement/packaging tests and silent headless Chromium desktop/Android-emulation checks with rendered screenshots, keyboard/touch, blur/background, resize, 320 px, 200% text, and context-failure coverage. Freeze file hashes for independent Physics and Camera/scale reviews; repair findings and rerun affected checks.

Review focus: thin-wall tunnelling and stair clearance; room cameras inside solid geometry; loss of key/pointer state on blur or UI changes; readable controls in a short/narrow viewport; accidental publication of third-party reference copies. Crowd, vehicles, sprites and main-game mission gates are out of scope because this page contains no game actors or missions. Physical Android qualification remains separate.

### Exterior calibration implementation

Use the official front width and the two main LoD2 volume depths/heights to fit
the editable study. Keep its existing interior floor heights provisional and
keep body/eye dimensions unchanged. Apply one authored coordinate transform to
parts, floors, solids and viewpoints; retain polygon footprints for sheared
walls/floors. Include the two actual western annex meshes as closed, unmodelled
volumes, without guessing their use. Remove the unsupported roof-plant box.
Camera reset must frame actual updated exterior bounds. Re-export the combined
asset, rerun real stair/entry routes and rendered desktop/mobile checks, then
obtain both independent reviewers on the same frozen candidate. Main-game code
and unrelated work remain out of scope.

### Photographic façade refinement

2024 photographs P07–P10 and 2019 detail P03 show separated window tiers,
recessed masonry panels, steel frames, sills, and two attic vent rows. Replace
the continuous glazed-band approximation with that observed structure. Retain
the provisional eleven-bay count where perspective/occlusion prevents a firm
per-elevation count; estimated opening dimensions are not surveyed. Correct
outward offsets on the west elevation. Keep the surveyed mass frame, interior
levels and entrance clear width unchanged. Adjust basic material tones from
observations; no photograph, graffiti or artwork is embedded. Re-export and
review rendered elevations, collision bounds and existing walking paths.

## Handoff

### Exterior landscape candidate

The current exterior pass adds the planted industrial site, articulated garden,
forecourt and queue, and richer Halle/entrance/roof-edge details. Low planting
collision and a continuous camera rise preserve walking and readable turns.
The isolated public-base candidate and the primary concurrent interior/sound
candidate remain separate; see VALIDATION.md for exact export bytes and tests.
Full architectural fidelity, the bridge and missing interiors remain open.


### Geheim playable walkthrough — published and verified live

Current 22-file frozen candidate passed both required independent reviewers,
24 focused Node checks and four final browser cases. Accepted moving frames,
entrance/exit, touch, lifecycle and complete-body camera evidence are recorded
in [VALIDATION.md](VALIDATION.md). Publish only this scoped candidate through
the existing isolated index. Runtime was pushed as
`7517a173b798613319673b3113bea6d8d1c7be27`, preserving main parent `b31b4cb`.
Immutable public preview has 37/37 published-file hash matches and 2/2 real
desktop/Android-portrait entrance flows at
`https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/7517a173b798613319673b3113bea6d8d1c7be27/geheim/index.html`.
Its provider asks Open the page on a fresh visit. Canonical
**https://germanysimulator.de/geheim/** is now verified live through successful
combined Pages run `39988132964` on main `daef7f9`, retaining the Geheim commit.
`output/berghain-geheim-live-verification.json`: 37/37 published files match,
all 33 ordinary routes and both custom/GitHub root/3d endpoints pass. Canonical
desktop/Android-portrait real entry/exit/refresh passes 2/2 in
`output/berghain-geheim-canonical-browser/report.json`, bound to published Git
objects, not the evolving local furniture candidate. Earlier run 39985584152 was
cancelled/superseded; prior run 39983168968 hit a Pages API 500 after its checks.
The main working checkout's unrelated staged files remain untouched.

The user requests a published `/geheim/` page with a controllable human avatar
and the interaction of entering the building. Implement as an optional third-
person mode of the existing viewer/model, with an unlisted generated alias;
retain the architectural viewer URL. This is a continuous architectural walk,
not a new mission controller or a second copy of the game runtime. Use the
existing navigation, local Three.js, shared hinged entrance factory and measured
Pretext labels. No new library, service or change to the city mission chain.

Allowed integrator writes: this scope; a procedural avatar under the existing
Berghain asset authority; focused Node/browser checks; the existing static
builder's alias/copy boundary; a unique share preview under assets/social and
its direct-URL catalogue entry. Preserve all unrelated staged work and use the
existing isolated publication procedure. New avatar and door geometry are not
part of the building GLB export.

Start outside with human scale and third-person camera. WASD/arrows and touch
move the body through the existing collision owner. E/button at the actual
entrance opens the hinged door and walks through it; far/duplicate actions do
nothing. Exit uses the same doorway. Input interruption cancels held movement
and pending automatic crossing. Camera collision uses the rendered opaque model;
gait follows accepted displacement and stops when blocked. Rendering remains
demand driven, with disposal and graphics recovery. This continuous walk does
not switch indoor levels or invoke the city's cinematic vortex protocol.

Acceptance: source-driven door collision/crossing/guard and avatar bounds checks;
actual approach/E/inside/exit in silent desktop and Android emulation; touch,
blur/modal/context recovery, readable 320 px/200% controls and idle cessation;
generated alias/import links/share image packaging; independent Physics and
Camera/scale reviews on the same frozen candidate; push and verify the live URL.
The wider realistic interior/art reconstruction goal remains unfinished.

### Interior design, art and sound research

#### Main-hall sound equipment implementation

Next integrated candidate replaces the four generic speaker blocks with original
metre-based F218 MkII, Evo 6EL/EH and F124 component geometry. The official
manufacturer drawings establish component envelopes; a 2023 community account
reports four triple-F218/twin-Evo towers, two satellite EH units and a six-F124
bass wall. The September blog explicitly derives its component list from that
same account, so it is not independent confirmation. The later 2025 discussion
is consistent on bass counts but disagrees on some identifiers and whether the
retained overhead DS assemblies operate. Keep configuration/currentness and all
room-relative placement provisional. No acoustic simulation or listening claim.

Integrator scope: new `speaker-geometries.mjs` and `sound-system.mjs` in the
existing Berghain asset directory; layout/model/export and manifest; focused
speaker tests/browser evidence and owning research/validation notes. Keep the
same renderer, PBR maps, navigation, exterior calibration, avatar and doorway.
Do not copy manufacturer meshes, PDF artwork or photographs into shipped media.

1. Add a failing requirement for a sourced component inventory and removal of
   the generic main-hall stack/horn boxes.
2. Build hollow cabinet/horn forms, phase plugs, ports and handling details from
   the inspected drawings, with exact outer widths/heights/depths and inferred
   internal contours. Share geometries/materials in existing instanced batches.
3. Assemble the reported 44 components at inferred room anchors, facing the
   dance floor; derive solid footprints/heights from the same transforms.
4. Export the integrated GLB; check actual geometry bounds, full-body approaches,
   aisle/stair routes and disposal. Render source/native/third-person views on
   desktop and Android emulation; keep natural entry evidence separate.
5. Freeze the integrated candidate for both independent world reviewers, fix
   findings, publish only the scoped diff and verify public bytes and routes.

#### Active interior furniture checkpoint

Accepted for scoped publication on 2026-10-23: 26 frozen hashes, 30 Node checks,
6 furniture browser cases, 4 natural entry/lifecycle cases and one text-layout
case pass; both independent reviewers return scoped PASS with no required fix.
The native export contains the same 35 assemblies. Evidence and remaining
device/fidelity limits are in [VALIDATION.md](VALIDATION.md). Published runtime
commit `ecfe6aa442fd99072b47c052e272f232b73c60fb` preserves main parent
`bb00899`; only 14 scoped files changed through the isolated index. Immutable
public verification passes 38/38 files and 6/6 desktop/Android-portrait browser
cases, covering natural entry, fixture approaches, native GLB and avatar at bar.
Canonical Pages update is queued behind the existing main deployment. Follow
the newest workflow containing this commit, verify canonical bytes and repeat
the actual desktop/touch routes before claiming this furniture live there.
The permanent Geheim avatar page itself is already live as recorded above.

Replace generic foyer concrete blocks with the channel-section seats visible
in I09, and Panorama's generic counter/DJ box with A13's framed illuminated bar,
metal stools, bottle rack, hanging fixtures and acoustic fittings. Retain the
observed forms; dimensions, present survival and exact room placement remain
inferred because these are historical photographs, not measured plans. Do not
embed the photographs or substitute generic wall art for named artwork. Keep
the known artist/equipment backlog and missing rooms in INTERIOR.md.

Author within the existing layout/model/exporter and asset scope, using shared
instanced box/cylinder/ring primitives and the existing metre-based export.
Place human-scale furniture after exterior calibration so site scaling cannot
distort stool/seat dimensions. Replace the former parts and collision together;
derive proxies from visible assemblies and preserve entrance/stair/room routes.
No new runtime, image texture, dependency, animation loop or main-game change.

Acceptance: legal full-body approach to furniture and existing routes; reference
ledger and inferred dimensions; native GLB parity/materials; defining room
screenshots on desktop/mobile; bounded geometry/resources and idle lifecycle;
both independent world reviewers on one frozen candidate. Publication follows
the already-pushed Geheim candidate; live verification must use published Git
objects rather than this evolving local model. Keep the full goal active.

The user inspected the preview and prioritised the missing interior design,
including Anna Uddenberg's mannequin sculpture and the sound system. Use
[INTERIOR.md](INTERIOR.md) as the object/room inventory and implementation order;
the full architectural outcome and missing rooms remain required. This research
update owns these notes, the source catalogue and its public static copy boundary
plus the focused packaging test. No viewer/model/navigation/material changes.

New evidence: the three actual 2009 Chrisse Kunst cartoons were acquired and
inspected; they are small, stylised historical topology references. Primary
gallery documentation identifies Uddenberg's *CLIMBER (Angel Kiss)* (2020), with
published dimensions and an inspected studio photograph. Curator/artist records
add Bisky, Marr, Göthe, Czebatul, Brandenburg and Tillmans; separate temporary
exhibition work and removed historic work. The old Piotr Nathan mural was removed
in April 2017 and is not the contemporary foyer target. Main-hall Funktion-One
changed in 2023; Panorama PA is documented by Studt-Akustik. Actual DS210 STEP/DXF
and dimensioned PDF were acquired as research, not as an established current rig.

Next modelling work starts with the main hall/foyer and Panorama's distinctive
furniture, bar and DJ forms, then missing room connections and the sourced art.
Bridge research is retained but exterior-only refinement is deferred to this
interior priority. No named artwork is implemented yet; the user correctly
identified the current interior's generic appearance. Neither this inventory
nor the earlier material-map checkpoint satisfies the realistic interior goal.

### Original material maps

Scope: original tileable mineral/stone/metal/aggregate base-colour, normal and
packed roughness maps under `assets/models/berghain/`, offline generator here,
material/UV helpers, existing model/exporter/viewer and scoped validation. Retain
instanced geometry, physical dimensions, collision, hierarchy and navigation.
Use metre-based projected UVs in the viewer and equivalent baked UVs in GLB;
embed and deduplicate PNGs for portable standard glTF materials. No new runtime
dependency, photo/artwork texture or change to the main game. Map parameters
remain appearance estimates, not scanned/measured materials. The embedded-image/
UV contract and 17 prior tests pass; current desktop/Android emulation, actual
texture-failure movement, graphics recovery/idle and paired native GLB appearance
checks pass. All 12 shared textures dispose once. Both independent reviews pass
on `output/berghain-material-candidate.json` (36 files). Faint tiling on the
long blank hall wall and unique dirt/damage remain fidelity work.

The active app goal remains unfinished. Research and a calibrated, photo-informed model/viewer are implemented; they do not meet the full realistic-asset target yet. See [SOURCES.md](SOURCES.md) for the 81-entry catalogue, [INTERIOR.md](INTERIOR.md) for the artwork/equipment and room inventory, and [VALIDATION.md](VALIDATION.md) for checks, independent reviews and outstanding coverage.

Open `/berghain/model.html` through the project's HTTP server. The current local preview is `http://127.0.0.1:49683/berghain/model.html` while that server remains running. The page is direct-link only, with `noindex, nofollow`, and has no ordinary game-navigation entry. It is not access-controlled.

The study includes the exterior shell, foyer, main floor, Panorama Bar, Säule, Halle and garden. Exterior orbit, walking with keyboard/touch, room selection, three traversable stairs, graphics recovery and GLB download are implemented. Asset authority: `assets/models/berghain/layout.mjs`; renderer assembly: `model.mjs`. Regenerate with `node berghain/export-model.mjs`. The current GLB is 23,389,640 bytes / 235,320 triangles, with 98 material/mesh groups and 18 embedded original PBR texture maps. It combines original study geometry with Berlin open-data roofs and annexes. No downloaded image or artwork is embedded.

Research found an unfinished OpenSCAD/front-façade STL repository, a paid printable STL listing, the original Minecraft creator's withdrawn walkthrough, architects' photographs and eyewitness diagrams. No complete, verified, freely reusable interior/exterior asset has been confirmed. The 2004 application image is only a cover/title-block photograph. The inspected Transformers catalogue (PDF page 70) has an exterior axonometric and site map, without dimensioned interior plans. The official Berlin textured exterior-mesh portal reported maintenance; no tile was acquired.

Official cadastral and LoD2 exterior geometry was acquired from the separate, working Berlin GDI service (G07–G09). Building ID `DEBE02YY200004SX` matches the address in both sources. `assets/models/berghain/survey-data.mjs` preserves four connected volumes, source hashes and a reversible local EPSG:25833 coordinate frame. `berghain-exterior-lod2.glb` is a 26,796-byte, 88-triangle external reference hull; its front edge is 37.949743 m, primary roofs 20.374 / 22.803 m above its ground datum. This is generalised official geometry, not a fresh site survey.

The walking viewer is now calibrated through `calibration.mjs`: the front/join/rear cross-sections fit the two primary volumes; official roof faces, the taller Halle's exposed front wall, and both western annex meshes are included. The annexes remain closed unmodelled volumes; their internal use is not inferred. The unsupported rooftop box is removed. Interior floors remain provisional, and visitor radius 0.28 m / eye height 1.68 m are unchanged. Mapped polygon floors/solids follow the same geometry, solid heights derive from their actual rendered matrices, and discrete tread undersides supplement the smooth stair support. One inferred western Halle column/beam line was moved clear of the full provisional stair lane. It is not a verified structural grid. Camera reset uses actual shell/annex bounds.

Reproduce extraction after downloading the source files listed in `survey-data.mjs`: run `python berghain/import-berlin-lod2.py`, then `node berghain/export-model.mjs --survey`. The standalone official reference remains separate from the combined walking study export. The shared exporter handles ordinary and instanced meshes. Current combined study SHA-256: `68607e6777b375e67031d59708147fc49e5d9f63a84266bd465c741c7a5dd6c1`.

The façade now has separate glazing tiers, steel frames, masonry bands, physical inset panels, sills and attic vents informed by P03/P07–P10. Panels use an estimated 7 cm authoring depth (about 5.9–6.0 cm after calibration), with closed solid rims. All three elevations still repeat estimated bays. Original tileable colour/normal/roughness maps add approximate grain; unique site weathering and decay are not established. Regenerate them with `python berghain/build-materials.py`. Roofs retain their simpler material. A12/A13 and I11 add primary Lab.oratory and Panorama references. I19 now supplies inspected upper-lounge, stair and Felsenland photographs; its initial geometry is implemented with estimated placement/elevations.

Next work: prioritise the missing interior design using INTERIOR.md, including distinctive furniture, art, room connections and sound-system geometry; model Lab.oratory, bathrooms and services; refine the added upper Panorama lounge and verify its floor elevation/circulation. Verify circulation/elevations rather than adding unlocated objects. Per-elevation openings, roof/rear detail, smoking bridge and observed weathering remain on the full-goal checklist. The retained 44 m authoring coordinates are transformed at asset construction and are no longer the shipped exterior width; do not treat those old coordinates or inferred partitions/repeated façades as measured facts. Primary exterior data does not establish room dimensions or which annex contains a particular interior use.

Repository: `C:/Users/cogpsy-vrlab/Documents/GitHub/GermanySimulator`. The local `codex/neighborhood-walk-talk` branch has no initial commit/remote and substantial pre-existing staged work. Publish only the Berghain scope and builder allowlist against verified `GeorgeFejer91/GermanySimulator` remote `main` using an isolated bare repository/index under ignored `output/`; fetch/push by explicit repository URL because this bare repository also has no named origin. Preserve the original index and game work (2,285 staged entries at this checkpoint). Runtime commit `9c842707e588e5e218109a0f63eb51c73a472b1f` is confirmed deployed: **https://germanysimulator.de/berghain/model.html**. Pages workflow `39977033051` succeeded; 31 published-file comparisons and two live browser tours passed, with desktop/Android emulation distinguished in VALIDATION.md. The expanded research inventory is a subsequent documentation-only publication. The shared root handoff remains authoritative for unrelated game work.

### Speaker update published — versioned preview verified

Runtime commit `ed0e0c251ccc1869ce981d3ba3cf704b8f013b94`, parent `211282f`, is pushed to main.
Public preview: **https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/ed0e0c251ccc1869ce981d3ba3cf704b8f013b94/geheim/index.html**. A fresh visit may show the provider's
Open the page button. `output/berghain-speaker-immutable-verification.json`
confirms all 39 published files exactly match Git objects. The actual public
desktop/Android-portrait entry/exit, speaker/native GLB and avatar cases pass 6/6
in `output/berghain-speaker-immutable-browser/report.json`.

The permanent **https://germanysimulator.de/geheim/** already has the verified
controllable avatar and natural entrance interaction. Its equipment update is
queued in Pages run 40000026294 behind run 39993645344; do not claim the new
speaker model is canonical until file and browser checks confirm deployment.
The published speaker catalogue has 90 entries. Concurrent exterior work in the
primary checkout is separate and preserved. The primary index remains SHA256
`704aa6efaa460b62afae0eb826c95ec075c54aff3b91b61dd4a5f6f00ecb2105`.
The full realistic reconstruction remains active; art/room gaps are in INTERIOR.md.

### Canonical furniture checkpoint after speaker publication

Pages run 39993645344 on 83cac59 finished successfully. The permanent Geheim URL
matches all 37 published furniture files and all six custom/GitHub entry URLs
in output/berghain-furniture-current-canonical-verification.json. Actual desktop
and Android portrait-emulated entrance, indoor control, exit and refresh pass 2/2
in output/berghain-furniture-current-canonical-entry-browser/report.json.

Speaker runtime ed0e0c251ccc1869ce981d3ba3cf704b8f013b94 and notes
824681ca1cf39358512203b78ef077a38bc364c1 are pushed. The immutable speaker
preview has 39/39 exact files and 6/6 public browser cases. Run 40000026294 was
superseded by notes run 40001005783, which inherits the same runtime. Check the
latest descendant deployment before calling the 44-component model canonical.
Private bare refs/codex/berghain-speaker-release retains the runtime commit.
Primary source includes concurrent exterior edits; do not replace it with the
isolated speaker release. The primary staged index remains unchanged. The full
reconstruction goal stays active, with named artworks/remaining rooms unfinished.
### Exterior pass pushed — versioned preview verified

Exterior commit c6041f61a9986558de6c20ee38c37add80663280 was pushed to main, preserving parent 824681c and the published PA from ed0e0c25. All 52 frozen source/test/asset bytes exactly matched Git objects before push. Three production workers plus independent Physics/Camera reviews completed this pass; full reconstruction remains open. Public versioned preview: https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/c6041f61a9986558de6c20ee38c37add80663280/berghain/model.html (provider may ask Open the page). Actual public desktop/Android-portrait exterior/garden, native GLB and natural door flows pass 6/6 in output/berghain-exterior-immutable-browser/report.json.

Canonical deployment is pending Pages run 40002583147 behind existing run 40001005783, last observed running its browser check. Root, 3d.html, Geheim and model routes return HTTP200, but canonical manifest remains the earlier furniture SHA9132e820...; do not label the new exterior live on the permanent domain yet. Next action: after deployment, verify both short root/3d URLs and the new exterior module/GLB hashes, then real canonical entrance/exterior flow. Current release source is output/berghain-exterior-combined-release; freeze output/berghain-exterior-combined-candidate.json, publication state output/berghain-exterior-publish-state.json. Original primary index remains untouched; concurrent primary game work is preserved.

### Panorama artwork candidate — original figure geometry

The next interior increment is an original reconstruction study of Anna
Uddenberg's CLIMBER (Angel Kiss), using inspected gallery ART02 and curator/
visitor placement ART03/ART13. It retains a bent figure, hanging/folded legs,
garment panels, quilt seams, eyelets, zippers, shoe treads and blonde hair.
Gallery dimensions retain unknown axes/support inclusion. Hidden surfaces,
fine garment/anatomical form, placement and currentness remain inferred.
Do not call the artwork or full realistic asset complete.

Scope: climber-geometry.mjs/artworks.mjs, existing layout/model assembly, three
original fabric maps through the existing material generator/PBR loader/export,
native asset helper, scoped Node/browser checks and these owning notes.
The combined model preserves the published exterior c6041f6 and speakers.
No studio barrel/table/stool or photograph is embedded. No new engine, service,
UI page or render loop. Tests retain explicit 15-map sharing/disposal checks.

Acceptance: inspect the source photograph against the model; verify real scale,
counter clearance and walkable outer aisle; compare source/native GLB and the
visitor on desktop/Android portrait/landscape; validate failure/idle lifecycle
and labelled text; freeze all sources and get both independent world reviewers.
Full remaining-room, installation and photographic-fidelity work stays open.

### Panorama figure — accepted initial geometry increment

CLIMBER (Angel Kiss), Anna Uddenberg, 2020, now has an original reconstructed
figure on the inferred Panorama counter. Sources ART02/03/13 and PROVENANCE.md
retain the distinction between observed pose/clothes and inferred hidden form,
hardware, placement/currentness and the published dimensions' unknown axes.
The studio barrel/table/stool and all photograph pixels are excluded.

climber-geometry.mjs/artworks.mjs share the existing model, instancing, PBR and
GLB exporter. Source/native and visitor views pass 7/7; natural-entry/material/
lifecycle/fallback/text/furniture regression 10/10; Node 47/47. Both independent
world reviewers accept the initial increment. VALIDATION.md records the 62-file
freeze, measured costs and limitations. No physical Android qualification.

This study is visibly stylised: anatomy, hair, garment fit, hardware and material
weathering require further work before faithful artwork acceptance. Other named
artworks, Klo Bar/toilets, extra lounge, Lab and verified room connections remain
required. The full realistic reconstruction goal stays active.

### Upper Panorama lounge — accepted provisional reconstruction

The additional lounge level, fourth stair, rails, glazed frame and original
Felsenland seating are implemented from newly inspected primary gallery views.
Final model 23,389,640B / 235,320 triangles / 98 groups / 18 original shared maps;
GLB 68607e6777b375e67031d59708147fc49e5d9f63a84266bd465c741c7a5dd6c1.
The 68-file freeze passes 53 Node checks, 22 complete browser cases and the
additional enlarged-spacing layout case. Both independent world reviewers pass
the revised candidate. Actual ascent/descent changes the room label correctly.
VALIDATION.md records repaired radiators/landing/bench, timing costs, photo
comparisons and remaining ≤3.9cm visual shoe/tread overlap. Dimensions, exact
furniture arrangement, printed glass art and currentness remain unresolved.
No physical Android/device-GPU qualification. Full reconstruction stays active.

### Completed implementation checkpoint — Panorama ceiling and exposed services

Previous goal turn classification: PROGRESS. It pushed a9fff29, verified 50/50
versioned public bytes and 6/6 actual public browser cases; this is stronger
publication evidence, while the full asset and canonical deployment remain open.

Integrator-owned next increment: architect I19 views15/16 show staggered pale
acoustic clouds, a fitted beam ceiling, cast radiators and exposed conduit.
Photos01/03/04/05 document the earlier switchgear counter/cabins; the architect
records a 2010 counter redesign. Those historic photographs do not prove that
both counters coexist today. Keep that historical equipment out of the
contemporary base until placement/survival is established.

Allowed writes: new panorama-services.mjs, layout.mjs, interior-fixtures.mjs,
model.mjs, current GLB/manifest, native-asset-playtest.mjs, scoped services tests/
playtest and Berghain owning notes. No HTML/CSS/input/camera/runtime-tree changes.
Reuse existing assembly helpers, metre units, instancing and original shared18
maps; no engine, dependency or texture family. The existing bar/stair/artwork/
upper lounge and primary index remain preserved. Initial ceiling soffit17.95m
(floor13.25m, clear4.70m), panel/radiator sizes/counts and exact positions are
inferred human-scale choices, not architectural measurements.

Sequence: observed failing tests; add actual ceiling/cloud/radiator/conduit
geometry and paired solids; shorten hangers to the ceiling; export matching
portable asset; inspect source/native and natural avatar routes across desktop/
Android emulation; compare isolated a9 baseline cost; freeze all relevant files;
obtain required independent Physics and Camera reviews; repair, verify and
publish only that coherent scoped increment. Physical Android remains unrun.
Full interior/room/artwork fidelity is still required.

### Panorama ceiling and services — accepted initial increment

The missing fitted Panorama ceiling, staggered acoustic clouds, cast radiators,
exposed conduit and tube diffusers now follow inspected architect gallery
views 15/16 (I19). The ceiling soffit 17.95 m, floor 13.25 m, counts and positions are
estimated. Earlier switchgear counter/cabins are historical references; they
are not inserted beside the later redesigned counter without survival evidence.

Portable GLB 23,659,832 bytes / 238,560 triangles / 99 mesh-material groups / 18
original shared maps; SHA-256 88e63d565d8ddc93a8d404f532ca74f5a5bff45d0ce2defd40ea8e28f0d32fa8.
There are 42 fixture assemblies, preserving the 44-component PA and initial artwork.
The 72-file freeze passes 61 Node checks; the repaired browser matrix passes 15/15,
with corrected native radiator detail 3/3 and upper-overlook 3/3 on current hashes.
Earlier complete 28/28 evidence is pre-collision-repair, explicitly bridged only
for unchanged renderer/lifecycle. Both independent world reviewers pass the
final candidate. VALIDATION.md records found/fixed low-metal penetration, native
camera framing and real aisle/stair access. Normal page transfer adds 3,006 bytes;
measured product frame cadence remains about 14 ms in local samples.

Publish this coherent scoped source and verify actual public bytes/interactions.
The primary staged index remains untouched. Physical Android is unrun. Fine
materials/weathering, exact contemporary room/art/equipment inventory, surveyed
interior dimensions, Klo Bar/toilets, Lab and full photographic fidelity remain
required; the full realistic reconstruction goal stays active.


Historical rejected-study checkpoint: all24ART04 images had been inspected but
the early separated-primitive prototype failed visual fidelity review and was
excluded. The later80c6660 partial anatomical release supersedes that prototype;
it does not establish full likeness/composition/ornament. The accepted c8 snapshot
remains useful for cost comparisons. Keep the full reconstruction goal active,
including complete artwork, Lab/service/cabin spaces, verified contemporary
room connections, measured interior geometry and fine exterior/material fidelity.
The original staged index remains preserved.
