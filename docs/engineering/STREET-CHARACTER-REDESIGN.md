# Street character redesign — sequential character releases

The active user goal covers all outdoor 2D street characters and police: mature,
weathered, painterly **Disco Elysium meets Berlin** faces and connected adult
limbs, with actual Söder and Herr/Frau Sandale stature as references. Söder is
the corrected name. The child keeps his deliberate age and smaller scale.
[The shared style contract](../../For-AI/CITY-CHARACTER-STYLE.md) owns art direction.

On 23 October the user explicitly changed completion to parallel end-to-end
character owners and **sequential live releases**. Each owner finishes design,
animation, integration and in-game stress testing for one character. The lead
runs independent Physics and Camera review, publishes each accepted character,
verifies the deployment and gives the freed worker another character. Earlier
whole-cast publication holds are superseded; existing unfinished goals remain
active. Keep shared source integration and pushes under one owner.

The release checkout is
`C:/Users/cogpsy-vrlab/.codex/worktrees/street-character-live-release/GermanySimulator`,
starting at public `f167a1130b3731ccb0caffb5210287a90e11c2f1`. Other incomplete
cast work stays in its separate checkouts. Copy only an accepted character's
registry entry and required assets/dependencies; do not replace the whole
registry with an author's broader local candidate.

## First live character: Irmgard Aktenordner

Published at `7e6b069e3e7351c710f565556648c9a23cff014d`; Pages run
`39941113272` succeeded. Nine deployed files matched accepted bytes, public root
and `3d.html` started, and actual public standing/body/mouth admission loaded
without page or HTTP errors. Root inspected the live pavement frame. Receipts
are in `output/irmgard-release/live/`; this is staged approach/startup evidence.

Actor/voice identity: `crowd-irmgard-aktenordner`. The selected native family
has four 16-frame walks, eight genuine painted turn anchors, all 64 phase stops,
its own standing fallback and source-bound speech mouths. It originally had no
separate greeting/work/review action states. Preserve her copper curls, mature
face, mustard/navy/olive clothes and anatomical-right burgundy binder.

Only this entry changes among the 43 installed registry records. Game logic,
routes, collision, recordings, named references, police and other characters
retain their public values. New adult fallback geometry shares her stature and
feet, including delayed/failed asset admission. Her nominal upright figure is
2.33 world units; matched-camera review measures 101 painted screen pixels,
beside Sandales102/103 and Söder124. Stride18.64 is the proportional rescaling
of the exact native16.8 fit at2.1; physical contact still receives world review.

Current checks: family source/export check; 14 family and three mouth-fitting
Python checks; 2,427 Node checks; fresh silent desktop and Android portrait/
landscape production walks, native recorded speech and mouth closure pass.
Initial whole-suite run exposed one Sandale test fixture missing the new
registry dependency; the fixture now explicitly keeps ordinary named atlases
outside adult fallback fitting. The full successor passes without skips.

Independent Physics and Camera reviews pass their affected scopes. Fresh
four-direction production-route tests reach all16 phases, show start/turn/stop/
neutral, and find zero illegal frames, stationary gait cycling or pause drift.
A player obstruction holds166/180 frames with zero walking in place. Delayed
standing admission and injected404 failure both pass desktop/portrait/landscape:
feet and2.33 stature stay fixed, one request is admitted, and repeated failure
does not replace geometry or retry. Root inspected the actual native and world
captures. This single-character candidate is accepted for sequential publication;
the integrator verifies the actual pushed revision and deployment separately.
Evidence is in this checkout's ignored `output/irmgard-release/`.
Camera's matched-ground stature and reversed depth placements pass in the tested
contexts; foreground architecture prevents a complete doorway clearance claim.
Physical Android, natural E traversal, exhaustive whole-world route/material
matrices and perceptual listening are NOT RUN. Existing route/collision and
building systems were not changed; the scoped acceptance does not certify those
broader systems or any unfinished character. Deployment receipts retain the
actual published revision and live root/compatibility checks.

## Second live character: Hannelore Sparkasse

Only `stadt-hannelore-sparkasse` changes from public `7e6b069`; the other42
registry entries, including live Irmgard, retain their exact published values.
Game simulation, routes, collisions, recordings and other selected assets remain
unchanged. Runtime module changes refresh cache versions only.

Her own adult source retains auburn bun, red glasses, burgundy jacket, navy skirt,
cream stockings, black loafers and one anatomical-left tan handbag. The existing
16×32 logical family keeps470 selected cells: four16-phase walks, all64 owned
phase-stop sequences, eight turns, courtesy reaction and source-bound moving
mouths. Five adult headings have native-visible lips; rear/rear-left/rear-right
remain explicitly null instead of painting an enlarged cavity. Nominal figure
height is2.33 and measured mild-shuffle stride5.825game units.

New `delivery-v2` keeps existing lazy movement/reaction admission. Source desktop/
mobile and mouth assets are SHA-bound; decoded movement is14,848,000/9,502,720
bytes and reaction1,024,000/655,360bytes. Source masters are authoring authority,
not eager runtime downloads. The actor-local `adult-v1/README.md` records a clean
rebuild, with an immutable own pre-admission record and component isolation that
does not depend on the pending police builder. Recompilation reproduces selected
standing, both body atlases and mouth packet byte-for-byte.

Worker evidence includes exact native boards,113 motion/renderer and12Python
delivery checks, actual desktop/Android portrait/landscape selector and native
speech-mouth probes, left/right production routes, all16phases and planted stops,
166 player-obstructed holds without walk-in-place, own fixed-root greeting, and
one deliberate movement404 retaining standing without automatic retry. Root
merged the single actor entry and immutable source closure, verified selective
delivery and inspected actual native body captures. A full integrated regression
found three cache-version expectations requiring the new URL; all69 affected
renderer tests pass after updating those assertions. The final full successor
passes all2,427 checks. Independent Physics found a real LEFT planted-shoe sign
defect; the source field now reverses LEFT x displacement, and two meaningful
Python regressions cover both planted-leg directions and exact neutral. All91
focused Node checks pass. The corrected candidate passed fresh production LEFT
travel and pause: all16 phases,19.613game units, zero illegal/stationary gait,
and near-shoe cancellation residual0.0137native pixels. The original RED review
is preserved beside the successor PASS. Independent Camera confirms matched
ground adult stature beside both Sandales and Söder, clear car/door context,
and two-sprite opaque depth ordering on desktop and portrait. Both reviewers
matched all53 pinned files before and after; root accepts these affected scopes.

Frozen integration source/test/asset hashes are in
`output/hannelore-release/frozen-candidate.json` (53 files); this checkout's
`output/hannelore-release/` owns final acceptance/publication evidence. Original
diagonal generation output path was recovered from the author's own session and
its immutable SHA verified, resolving the earlier provenance caveat. Broader
route/material matrices, natural E traversal, physical Android and listening
remain uncovered; none is inferred from staged headless tests.

The original narrow police gait was held after6.875 cycles/second. Its accepted wider successor is now live; see the police release below.

## Parallel character owners

- Heike Hoffmann: `street-heike-complete` managed checkout; all own directions,
  turns, key gesture, moving mouths, stops and full selected capability.
- Gisela Becker: `street-gisela-complete`; own skirt/shoe gait, paper/book hands,
  actions, moving mouths and normal delivery.
- Karl-Heinz Post: `street-karl-heinz-complete`; newly assigned after Hannelore's
  implementation handoff, with own envelopes, adult directions, existing full
  actions/stops/turns, speech and bounded delivery. All364 native cells,276
  source-bound lip cells and reproducible candidate are complete; game stress
  is queued behind Gisela. Hannelore is accepted for sequential publication.

The lead serializes browser/GPU work and source-generation jobs. Workers keep
independent CPU authoring productive while waiting and never push. Completed
workers receive the next uncompleted character immediately. The remaining cast
and old local source studies are not implicitly approved by this first release.

Acceptance on23October: corrected body desktop7ad747cc/mobileaf7114db,
mouth5465325d and delivery72ecc344 are frozen. Camera review is
`output/hannelore-release/review-camera/REVIEW.md`; Physics successor is
`output/hannelore-release/review-physics/successor/report.md`. Published at `b5744458817a39ddbd2a6c731eb3041daddfccf0`; Pages run
`39955027314` succeeded. All14 actual deployed files match the commit. Fresh
public root, query/hash-preserving compatibility entry and actual Hannelore
standing/movement admission pass with zero page/HTTP failures. Root viewed her
full adult walking figure on the public pavement. The first smoke hit one503
on an existing currywurst image; its evidence is retained, and a complete repeat
passed. This is staged public approach, not natural E traversal. The remaining
cast stays unfinished under the same goal.

## Integrated mature police family — wider cadence successor

The next candidate is integrated atop live Hannelore b5744458; all43 street
records, game simulation and the street renderer remain exact. Both genders
retain all4 equipment tiers,4 authored eight-frame directions, planted idle,
warning and ticket actions, and equipment ownership. Mature own paint and the
connected fallback occupy2.33world units with fixed ground; no pursuit speed,
collision, vehicle or arrest logic changes. The native896-cell audit passes;
desktop/mobile libraries total2,486,636/1,628,912encoded bytes, each selected
texture stays below16MiB decoded. Existing bounded admission/lifetime is reused.

Original narrow gait is held in historical evidence after6.875Hz actual pursuit.
New own step56/cycle65.24 matches224working pixels of full-cycle sole travel.
A fresh riot-female clear-leg profile resolves an occluded thigh at wide stride;
its original raw PNG, exact prompt and references remain immutable.6Python,
2,435isolated Node and92integrated Node checks pass. Frozen68pins preserve both
live characters. Independent fresh Physics129/165speed×male/female reachesall8
frames at1.99–2.56cycles/s and holds root/distance on pause. The attempted blocker
ring produced no stopped witness, so its fixture RED is preserved without a
new blocked-browser claim. Camera moving-edge delta PASS: all8families/all8phases across desktop,
portrait and landscape,192actor-phase observations,0page/HTTP failures and
all68pins unchanged. Clear moving body/equipment edges were independently
inspected; some male boot pixels hidden by a fixture bag were excluded. Root
viewed the actual native GPU board and accepts these affected visual/cadence
scopes for sequential publication. Broad new wall/door/car matrices, natural
offense traversal, physical device and listening remain unclaimed.
Owning source/build/cost/evidence details are in [POLICE-ART.md](./POLICE-ART.md).


## Third live street family: Gisela Becker

The accepted single-character successor to police09636713 changes only
`quiz-gisela-becker`; the other42 registry records, all8 police families and
game simulation remain exact. The active acceptance/publication lane is
`street-gisela-live-release/GermanySimulator`. Earlier release lanes retain
their source/RED evidence and do not override this newer public tree.

Gisela keeps sandy bob, glasses, pearls/floral scarf, beige coat and wine
sweater, dark skirt and strap shoes, anatomical-right paper and left book.
The own2.33-world-unit family preserves364 selected cells, four16-phase walks,
all64 phase-specific stops, eight connected body turns, seven original action
names and278 native-visible source-bound mouths. Stride is18.64 game units.
Existing lazy movement/reaction delivery stays below16MiB decoded per texture
(desktop movement16,220,160bytes; mobile7,208,960). Source atlases are authoring
authority, not eager runtime downloads. Own immutable baseline, raw generation
requests/outputs and exact clean rebuild commands are in `adult-v1/README.md`.

All101 focused Node checks and3 source/delivery Python checks pass; the full
integrated Node run passes2,434/2,435; its sole failure detects Git normalizing
the new SHA-bound mouth delivery path. An own-path `-text` rule fixes packaging
without changing selected bytes; both exact-byte/binding successor checks pass.
The original RED run remains retained. The author completed
all seven actual interaction sequences including terminal resource release,
three emulated profiles, changing-pose recorded-mouth checks and selected
movement404 fallback. Fresh independent Physics observes legal LEFT/UP travel,
fixed-root phase stops, and actual quarter/bridge turns at247RAF samples with
16.7ms median/33.4ms maximum on this current runtime. Both decoded364-cell
variants are connected with grounded soles; the actual depth-plane probe
removes at most one boundary screen row rather than burying contact shoes.

Independent Camera checks common-ground adult limbs/stature beside both
Sandales and Söder, loaded car/clear door context, and reversed opaque
two-sprite ordering on desktop and Android portrait emulation. Its final report
also records the generic pre-paint fallback check. Both reviewers bind the same
91-file candidate before/after. Root inspects their actual rendered evidence;
only the shared provenance description is corrected after that freeze, without
changing any record, paint, runtime or test byte. The immutable final commit
owns publication bytes. Runtime edits only refresh cache tokens.

Physics/Camera reports are `output/gisela-release/review-{physics,camera}/`;
source/test/asset hashes and final commit/deployed-byte receipts remain under
`output/gisela-release/`. Actual-rate evidence resolves the author's slow
headless capture limitation for this bounded current-public scene. Exhaustive
world matrices, natural E traversal, physical Android and perceived audio remain
unclaimed. Existing collisions, routes, vehicles, missions and recordings are
unchanged. Gisela is accepted for immediate sequential publication; push and
Pages/public startup/admission verification are recorded separately.

The mature8-family police release is live at
`096367133c43e67200005c09fb5366d617068864` (Pages39961642504): all23 deployed
files exact, root/compatibility and actual male/female patrol paint admission
pass with0page/HTTP failures. Its original narrow-gait RED remains preserved.

Active next owners: Heike's source-ground successor has an8-contact regression
GREEN after a real multi-row sole-clipping RED; Karl-Heinz has the same own
source repair and fresh in-game validation. Sabine Krüger and Renate Termin
are progressing in separate one-character checkouts. Only root integrates and
publishes, one accepted family at a time; no other local cast is approved by
this release. Completed owners hand off frozen work and a new owner starts
the next uncompleted character immediately.

Gisela publication verified: `57c1751f490943d8c3b2e118e08b5ec847121093`, Pages39969614861 success. All14 deployed files match immutable commit bytes; actual root, query/hash-preserving3d.html compatibility and public Gisela standing/movement admission pass with0page/HTTP failures. Root inspects the public pavement capture; staged public approach does not claim natural E traversal. Evidence: `output/gisela-release/live/`.


## Heike Hoffmann: corrected adult complete family

Only `quiz-heike-hoffmann` changes from public Gisela57c1751f. Other42 records,
all police, game simulation, collision, recordings and loading architecture
remain exact. Cache-token refresh is the only runtime-module change. Own mature
grey bob/glasses, burgundy cardigan, anatomical-right keys and left cards remain
recognizable. Her2.33-world-unit connected adult source retains364 selected
cells, four16-phase walks, eight turns,64 phase-specific stops, all seven
original action names and276 source-bound visible mouths. Measured stride29.125
is retained. Movement16,220,160/7,208,960decoded bytes and reactions1,474,560/
655,360stay within existing budgets.

Independent review of the initial76-pin candidate found a real source defect:
vertical contact shoes descended3–4native rows below the fixed sprite ground
and were visibly buried by the sidewalk. Original RED report, delivery and
freeze remain under the old source-repair lane's `before-floor-fix` and
`review-physics`. The correction enables the existing actor-local plantedFloor
callback in the own front/rear source specifications; it does not move the
runtime pivot or edit shared helpers. A failing8-contact regression turns GREEN
after rebuilding body, stops, actions, assembly, fitted mouths and selective
delivery from tracked own sources. Selected SHA values and exact clean commands
are in the actor's `adult-v1/README.md`.

Latest public integration is frozen78 paths atop57c1751f; both independent
specialists return to these exact bytes for their affected source/ground,
adult-scale/depth and actual-turn checks. Root inspects native/rendered evidence
and accepts only those scoped rows. All103 focused integration checks and the
source-contact regression pass; Git also preserves the exact SHA-bound mouth
bytes. The author supplied three emulated profiles, actual recorded-mouth
ownership/closure, all seven action witnesses, movement/standing404 behavior,
resource retirement/reentry, and a43-sample1.057second actual turn trace. Fresh
review evidence and limits are in `output/heike-release/review-{physics,camera}`.

This is sequential single-family acceptance; publication and actual deployed
root/compatibility/admission verification remain separate receipts. Broader
unchanged world matrices, natural E traversal, physical Android and perceived
audio are not inferred from staged silent headless fixtures. Karl-Heinz,
Sabine, Renate and all other unfinished outdoor characters remain under the
same redesign goal with independent one-character implementation owners.


## Karl-Heinz Post: complete adult painted family

Only `stadt-karl-heinz-post` changes from public9c8427. The other42 registry
records, including Heike/Gisela/Hannelore/Irmgard, all8police families and game
simulation remain exact. Both separately published Berghain viewer updates are
preserved. Root runtime edits only refresh cache tokens. His own navy cap,
moustache, worn ochre jacket, navy trousers/rounded boots and anatomical-left
white envelopes remain recognizable. Connected adult stature is2.33world units.

The21×18 family retains364 selected cells: four16-phase walks,64phase-specific
stops, eight whole-body turn anchors, seven original action names and276 fitted
native-visible mouths. Existing rear/unsupported views stay explicitly null.
The measured two-heading/two-density sole fit11.8784 selects11.88game units per
cycle. Native pixel quantization range and hidden-sole limits are documented in
the own `adult-v1/README.md`; no perfect full-sole traction claim is made.

The initial vertical contact source was held after real native/scene shoe
burial. An effective own planted-floor limb callback repairs100vertical cells
per atlas without moving the runtime pivot, cropping shoes or editing shared
helpers. Standing,194nonvertical cells and both reaction packs remain exact
versus that held version. Original RED/failure/candidate evidence is retained
in the worker's `held-vertical-floor-v1`. The eight encoded contact regressions
pass, and the current selective delivery check is exact. Movement/reaction
textures use the existing bounded lifetime; decoded movement16,220,160/
7,208,960bytes and reactions1,474,560/655,360 remain below16MiB each.

The author completed source/selected/mouth/delivery clean byte reproduction,
all seven action completion/return paths, real three-profile recorded-mouth
ownership and failure/retirement tests. Corrected three-profile actual material
contact pairs preserve rounded boots; those18vertical/neutral comparisons are
explicit UV staging, not a natural vertical route. Its initial impossible
movement-filename wait on a revoked blobURL is preserved as a fixture failure;
the final exact-network-hash/native-dimension successor passes.

All126 integrated Node checks pass, including the incoming viewer/packaging
checks, as do the own contact regression and delivery check. Independent Physics
on frozen59paths verifies source-owned sole signs, real RIGHT/LEFT legal routes,
all16phases, zero stationary gait and exact fixed-root pause; actual measured
cycle11.9167 is within one simulation tick of11.88. Ground probes remove at most
one boundary raster row. Independent Camera passes actual common-ground adult
proportions beside Söder/Sandales/car/door, reversed opaque depth and generic
pre-paint404. Fresh own240RAF turn capture (20.8msmedian with PNGoverhead) keeps
head/torso/pelvis/boots/envelopes coherent. Root views the exact actual captures
and accepts these affected scopes; both reviewers match all59pins before/after.

Root narrowly merges one registry object and source closure. New legacy
provenance records retain their original fields and receive canonical sha256
alongside sourceSha256 where needed, without changing raw paint or prior public
metadata. Exact source commands, immutable original person and source-generation
requests/receipts are tracked; ignored output is evidence only.

Reports and final commit/deployment receipts: `output/karl-release/`.
This character is accepted for immediate sequential publication. Push/actual
deployed root, compatibility entry and own paint admission remain separately
verified; if CI coalesces another goal's later commit, bind the exact deployment
revision and confirm it retains this accepted person. Natural E traversal,
physical Android, perceptual listening and exhaustive unchanged world matrices
remain unclaimed. Remaining outdoor cast continues under the same goal.
