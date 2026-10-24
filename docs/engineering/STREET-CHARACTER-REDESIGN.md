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

The current sole-integrator release checkout is
`C:/Users/cogpsy-vrlab/.codex/worktrees/street-current-live-release/GermanySimulator`.
Its published history includes Irmgard, Hannelore, police, Gisela, Heike and
Karl-Heinz, while preserving the other goal's Berghain viewer. The older
`street-character-live-release` checkout is a historical police/Heike source
bench and must not publish over the current lane. Other incomplete cast work
stays in its separate checkouts. Copy only an accepted character's
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
`street-current-live-release/GermanySimulator`. Earlier release lanes retain
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

Heike publication verified: accepted/pushed `c6ef9419ab234794cb1968babf2a2d2631b16d1a`, deployed in `9c842707e588e5e218109a0f63eb51c73a472b1f`, Pages39977033051 success. All14 deployed files match immutable deployment bytes and the exact accepted Heike record; actualroot, query/hash-preserving3d.html compatibility and public Heike standing/movement admission pass with0page/HTTP failures. Root views her public pavement capture; staged approach does not establish natural E traversal. Evidence: `output/heike-release/live/`.

Karl publication verified: accepted/pushed `10a319e22c0b5e9c12847654dee76c83c4c82b92`, deployed in `ab34df43c9cd4c82136915a790b88ef2350d53fc`, Pages39981190171 success. All14 deployed files match immutable deployment bytes and the exact accepted Karl record; actualroot, query/hash-preserving3d.html compatibility and public Karl standing/movement admission pass with0page/HTTP failures. Root views her public pavement capture; staged approach does not establish natural E traversal. Evidence: `output/karl-release/live/`.

## Sabine Krüger: complete mature painted street family

Only `quiz-sabine-krueger` changes from reviewed public7517a173. All42 other
registry records, police and game simulation retain that public base. The
49 incoming performance/office-preview/Geheim files are preserved; root runtime
edits only advance the three character cache imports. Her asymmetrical brown
bob, glasses, mustard vest, cream blouse, charcoal knee skirt, worn brown shoes
and anatomical-left burgundy book now form one connected mature adult at2.33.

Eight genuine painted headings supply364 selected cells, four16-phase walks,
all64 phase stops and seven original actions in21×18. Own near-sole fit11.5358
selects11.54 units/cycle; native rounding and hidden opposite-sole limitations
remain documented. All277 supported mouths change native RGB at both client
sizes with exact alpha and closed source; true rear/unsupported far lips stay
explicitly unarticulated. Existing voice, recordings and measured cues remain
exact. Movement uses16,220,160/7,208,960 decoded bytes, reactions1,474,560/655,360;
the existing selective admission/disposal owners remain unchanged.

The worker reproduced312 source/output files and a fresh five-file compile
byte-exactly, checked all728 native floor cases, components/gutters, three-profile
recorded media, legal walking/stops, all seven terminating actions, delayed/404
fallback and retirement. Its original action timeout from a private0.05dt
fixture is retained; the exact production0.12 cap/substeps successor completed.
The first wrong front-right paint remains held beside its corrective raw source
and exact original requests. Root narrows own source/provenance union rather
than copying an old full registry. The new own test was normalized CRLF→LF to
match Git after a real staged-byte mismatch; production paint remained exact.

All187 integrated Node checks pass, including incoming performance/Geheim and
packaging checks; own3 raw provenance records/two requests pass. Initial obsolete
motion-family expectation failures are preserved. Current65pins stay exact
through both independent reviewers. Physics passes actual legal RIGHT/DOWN
travel43.561/41.554 units,16phases, zero illegal/stationary gait and90tick
fixed-root neutral holds; observed11.7 cycle is within one simulation tick of
11.54. Depth-floor probes remove at most one raster boundary row, with intact
shoes and the portrait neutral control more affected than moving contacts.
Camera passes desktop/portrait common-ground adult scale beside Sandales/Söder,
loaded cars/doorway, two-way opaque depth and prepaint404. Its own actual10pose
whole-body turn spans240RAF/4.522s, median16.4ms with capture overhead; book,
head, shoulders, pelvis and boots remain attached. Root views the actual turn,
native and pavement/reference captures and accepts these affected scopes.

Reports, frozen pins and commit/deployment receipts live in
`output/sabine-release/`. Acceptance authorizes immediate sequential publication;
actual deployed files/root/compatibility/own paint are checked separately.
Forced placements and emulation do not establish natural mission/E traversal,
physical Android or perceptual listening. The remaining outdoor cast continues.

## Irmgard Aktenstapel: mature painted street family

Only `stadt-irmgard-aktenstapel` changes from reviewed public1f7ece91. All42
other registry records, police, game simulation and concurrent performance,
Geheim and Pages packaging work remain preserved. Her silver curls, glasses,
moss raincoat, lilac blouse, charcoal skirt, brown boots and anatomical-left
grey files form one connected elderly adult at2.33 world units.

Eight genuine painted headings supply364 selected cells in21x18, four16-phase
walks, phase stops and the seven existing actions. Her own RGB sole-patch fit
7.5443057 selects7.544 units/cycle. All276 supported mouths change native RGB
with exact alpha/closed source; rear unsupported lips remain unarticulated.
Existing recordings/cues/voice remain exact. Movement uses16,220,160/7,208,960
decoded bytes, reactions1,474,560/655,360 under existing selective owners.

The author reproduced21 outputs/person from an empty own-input mirror and
completed native/source audits, three-profile recorded media, legal walking,
actions/resume, fallbacks and retirement. Earlier partial mirrors and fixture
failures remain retained. Root preserves60 exact worker files and the one
person through a narrow provenance union. All191 focused Node checks pass,
including concurrent performance/Geheim/packaging; three original raw paints,
three receipts/eight portable references and eight native contact subcases pass.

Both independent reviewers bind all78 unchanged pins. Physics passes fresh
legal desktop RIGHT/portrait LEFT23.5667-unit walks, all16 phases, zero illegal
or stationary gait,90tick fixed-root holds, seven terminating actions and
reaction disposal. Observed7.4667-unit wraps differ by less than one simulation
sample from7.544. Natural horizontal and explicitly staged vertical floor
probes affect at most one boundary raster row with intact boot contours;
portrait neutral controls are equally or more affected. This is bounded fringe
acceptance. Camera passes common-ground adult scale beside Sandales/Soder,
loaded car/door, two-way opaque depth and one-request prepaint404. Its actual
10-pose whole-body turn spans240RAF/4.6368s, median16.5ms with capture overhead;
head, cape, left file grip, skirt and boots rotate together. Root inspected the
actual turn, native, desktop/portrait references and depth frames.

Frozen evidence and commit/deployment receipts are in
`output/aktenstapel-release/`. Actual deployed assets/root/compatibility/paint
are verified separately. Forced placements and emulation do not establish
natural mission/E traversal, physical Android or perceptual listening. The
remaining outdoor cast continues.

Sabine publication verified: accepted/pushed `1f7ece91dcdd78b6fcef7e17c2131d7eca98a532`, deployed in `1f7ece91dcdd78b6fcef7e17c2131d7eca98a532`, Pages39988968544 success. All14 deployed files match immutable deployment bytes and the exact accepted Sabine record; actualroot, query/hash-preserving3d.html compatibility and public Sabine standing/movement admission pass with0page/HTTP failures. Root views her public pavement capture; staged approach does not establish natural E traversal. Evidence: `output/sabine-release/live/`.

## Renate Termin: mature painted street family

Only `stadt-renate-termin` changes from accepted public782108f8. All42other
registry records, police, simulation and concurrent performance/Berghain work
remain exact. Spiky red hair, plum vest, cream turtleneck, full teal trousers,
burgundy shoes and anatomical-right yellow ticket retain her own sturdy adult
identity at2.33world units; empty LEFT remains her gesture hand.

Eight genuine painted headings provide364selected cells in21x18, four16phase
walks, all64phase stops, eight turn anchors and seven existing actions. Own
source sole fit9.1665856247565 drives cadence. All276visible mouth poses retain
closed pixels/alpha exactly at both native densities; rear lips remain null.
Existing three recordings, captions, cues, routes and collision stay unchanged.
Movement uses16,220,160/7,208,960 decoded bytes, reactions1,474,560/655,360.

The author reproduces all nine selected outputs/person from own source and
checks every364encoded frame at both densities, three-profile media/body,
legal routes, action resume, failures and disposal. Earlier off-sidewalk action
fixtures triggered an intended police modal; their failures are retained beside
the corrected legal-observer passes. Root binds44exact worker files/person,
17evidence reports,10unchanged rebuild dependencies, three original imagegen
outputs/three receipts/nine portable references and the exact quarter request.
All200focused integrated Node checks pass. Two native tests cover eight contact
cases and16protected gesture phases. Actual packaging retains all nine runtime
files byte-exact and omits three offline paints without altering originals.

Both independent reviewers preserve all61pins. Physics independently re-renders
six source phases/twelve native cells byte-exactly and checks all728native cells.
Actual own sole patches oppose motion. Fresh desktop RIGHT/portrait LEFT each
travel23.5667legal units,16phases, zero stationary gait/90tick pause drift;
observed9.1unit wraps differ by less than one sample from9.1666. Seven desktop
actions finish/resume/release their actual owner and reaction packet. Blocked
movement holds44samples with zero illegal/stationary gait. Natural horizontal
and explicitly staged vertical floor probes affect at most one boundary raster
row, with complete visible boots; this is bounded fringe acceptance.

Camera passes desktop/portrait common-ground scale beside Sandales/Soder,
loaded car/door, two-way opaque depth and one-request standing404 fallback.
The actual10pose whole-body turn spans240RAF/4.8732s, median16.5ms including PNG
capture; head, vest, hips, knees, boots and RIGHT ticket stay coherent. Root
inspects current turn, native contacts, clear desktop/portrait references and
depth frames and accepts these affected scopes. A brief final Physics crop
overlap ended before turn timing; timings are diagnostic, not performance
certification. Staged scenes do not establish natural startup/E/input traversal,
physical Android or perceptual listening.

Frozen reports and commit/deployment receipts: `output/renate-release/`.
Acceptance authorizes immediate sequential publication. Public assets/entries/
actual own paint are verified after successful deployment. Remaining outdoor
characters continue under the shared style goal.

Irmgard Aktenstapel publication verified: accepted/pushed `782108f8249eb1c9893acb2648807a1ec31aea54`, deployed in `83cac59dc3c5fb550db47ce38a42b14c785ed639`, Pages39993645344 success. All14 deployed files match immutable deployment bytes and the exact accepted Irmgard Aktenstapel record; actualroot, query/hash-preserving3d.html compatibility and public Irmgard Aktenstapel standing/movement admission pass with0page/HTTP failures. Root views her public pavement capture; staged approach does not establish natural E traversal. Evidence: `output/aktenstapel-release/live/`.

Renate Termin publication verified: accepted/pushed `211282f4be89c5efde9943ea951545dd2d7ce73a`, deployed in `c6041f61a9986558de6c20ee38c37add80663280`, Pages40002583147 success. All14 deployed files match immutable deployment bytes and the exact accepted Renate Termin record; actualroot, query/hash-preserving3d.html compatibility and public Renate Termin standing/movement admission pass with0page/HTTP failures. Root views her public pavement capture; staged approach does not establish natural E traversal. Evidence: `output/renate-release/live/`.

## Adult Hartmut Keller: mature painted street family

Only `quiz-hartmut-keller` changes from public211282f4. He retains his older
lined face, receding grey-dark hair, glasses, olive quilted vest, beige shirt,
brown trousers/boots, RIGHT radio and LEFT flashlight/notepad. Connected adult
stature uses nominal2.33world height and own source-fitted9.68stride. All42other
registry records, police, simulation and existing performance work remain exact.

Eight genuinely painted whole-body directions supply380selected cells: four
16phase walks, all64phase stops, eight turn anchors, seven original actions and
16exact own neutral duplicates preserving long quiet holds. All293supported lips
retain closed pixels/alpha at both native densities; rear lips remain null.
Hartmut has no admitted own recording: real Synth/caption fallback was tested,
and native articulation evidence is not relabelled recorded speech coverage.

Root binds57exact worker files/person, three original tool outputs, five
references and10receipt/baseline records. Original raw-only21output/fullperson
replay and final encoded380×2 audits pass. A validation-only portability repair
removes ignored expectations; its exact validator passes in a fresh root with
those paths absent, without claiming another raw replay. All204focused Node
checks and actual9file packaging pass; three offline originals remain Git-only.

Both independent reviewers preserve all75current pins. Physics checks760native
cells,12exact rerenders and own RGB sole direction; desktop/portrait each travel
28.6167legal units through all16phases,90tick planted stops, all seven desktop
actions/reaction retirement/route resume and44blocker holds. Actual contact
probes retain complete boots with at most one raster-row fringe. Camera checks
all eight actual turn anchors on desktop/portrait, three-layout scale beside
Sandales/Söder/car/door, both opaque depth orders and standing fallback/hold.
The hold oracle uses Hartmut's measured135/136painted raster height; its first
copied-oracle RED is preserved. Root views current turn, reference, depth and
contact frames and accepts these affected scopes.

Observer-fixture REDs remain beside corrected all-eligible-instance passes.
Scripted placements/vertical UV probes do not establish natural startup/E
traversal. Capture timings are diagnostic; physical Android, perceptual listening
and city-wide performance are not newly certified. Evidence/receipts remain in
`output/hartmut-release/`. Publish immediately and verify after deployment;
the remaining outdoor cast continues under the shared style goal.

## Brigitte Mueller: mature painted street family

Only `stadt-brigitte-mueller` changes from public7c0d8842. Her lined face,
grey-streak brown bob, glasses, olive scarf, brick jacket, knee skirt, stockings
and flat strap shoes remain distinct. LEFT owns the cream envelope; RIGHT stays
empty. Adult nominal height2.33 and own source-fitted11.83stride read beside
Sandales/Söder; all42other registry records, police and simulation stay exact.

Eight genuine whole-body paintings supply412selected cells, four16phase walks,
64phase stops, eight turn anchors and four distinct original quiet performances
with original1280/960/960/960durations and idle/wait alias. All324supported mouth
cells at each native size retain exact closed pixels/alpha and visible RGB
articulation; rear lips remain null. Both original German recordings and cues,
caption/voice ownership, routes and selective reaction lifecycle are preserved.

Author22-output raw-only replay, three-profile media/body/fallback/lifecycle and
formal412×2encoded-frame audits pass. Root verifies original53files/79pins,
2104evidence hashes, four preserved references, seven generation helpers and
four original tool outputs. A minimal integrator overlay supplies a tracked
own motion spec and validation-only22hash/person baseline, preserving identical
generator arguments and all22outputs. The exact repaired validator passes with
old ignored expectations/current full registry absent; no second raw replay is
claimed. A scoped Git attribute preserves the exact hash-bound mouth JSON;
all73previous hashes remain unchanged in the final74pin candidate. All63candidate
files are byte-exact. Actual packaging retains all9runtime files and omits all
four offline originals without altering them. All209focused Node checks pass.

Independent Physics checks824native cells, own RGB sole direction, all16gait
phases on three layouts, planted stops, all four actions/reaction retirement/
resume and54blocker holds. Staged vertical contacts retain complete shoes with
at most one raster-row fringe. Camera checks three-layout population/car/door
scale, both opaque depth orders, exact own136pixel fallback/hold and all eight
actual turn anchors on desktop/portrait. Both final reviews preserve74pins;
the earlier73native report is explicitly rebound through the attribute-only
delta. Root views turn, scale and contact captures and accepts affected scopes.

Prior URL/window/observer/staging-count fixture REDs and earlier missing-audit
packet remain preserved. Camera resource wording records additional authorized
Klaus CPU work alongside Ursula; the1.07GiB source/1147MiB camera low-memory
wave does not certify broad concurrency. Scripted placement/UV probes and
capture timings do not prove natural startup/E traversal, physical Android,
perceptual listening or city-wide performance. Evidence: `output/brigitte-release/`.
Publish immediately, verify the deployment and continue the remaining cast.

Hartmut Keller publication verified: accepted/pushed `efb302fccf0a816d23f10f86c02500fb736c9b2a`, deployed in `7c0d8842ff86ce0833e538e48a174dcd974c7fd4`, Pages40012564433 success. All14 deployed files match immutable deployment bytes and the exact accepted Hartmut Keller record; actualroot, query/hash-preserving3d.html compatibility and public Hartmut Keller standing/movement admission pass with0page/HTTP failures. Root views his public pavement capture; staged approach does not establish natural E traversal. Evidence: `output/hartmut-release/live/`.

## Klaus-Dieter Klein: adult painted street family

Only `stadt-klaus-dieter-klein` changes from published a9fff295. His worn face,
navy jacket, mustard polo, denim and tan shoes remain recognizable; LEFT owns
the blank cream form and RIGHT stays empty. Eight genuinely painted directions
use adult connected proportions, nominal height2.33 and own source-fitted11.65
stride. All42other registry records, police and simulation remain exact.

The412selected cells retain all348 accepted movement-source and packed-movement
bytes, while restoring64 original quiet performances with actual adult neck/hip
fits. Idle1280ms and look/success/failure960ms, original sway/nod/lift fields and
idle-to-wait alias remain. All325supported mouth slots per density preserve
closed pixels/alpha and native articulation. Three original recordings/cues and
existing voice, route and selective-loading owners remain unchanged.

Author raw-only21-output/full-person replay,824 formal frame checks and all
three production layouts pass. Root verifies63 scoped files,379 evidence hashes,
three original tool outputs and unchanged source/voice/reference dependencies.
Three attributes/test files use an explicit CRLF-to-LF overlay with identical
logic; original packet/freeze retained,78of81 final pins unchanged. All70 staged
candidate files match their intended bytes. Actual packaging retains9runtime
files, omits3offline originals and preserves original bytes.203focused tests pass.

Independent Physics checks824 native cells, own RGBA sole correspondence,
three-layout16phase legal gait/cadence, zero-drift stops, original quiet actions,
44obstruction holds and18staged vertical contact/neutral frames. A depth-plane
fringe is at most one raster row and bounded by own neutral. Camera checks
adult population/car/door scale, both opaque depth orders, own136pixel raster
fallback and all8actual turn anchors on desktop/portrait. Root inspects these
actual renders. Final81 pins remain stable in both scoped PASS reviews.

Root supplements the author's standing-fallback evidence with three-layout
movement-delay, actual distance-retirement/zero texture references/new-owner
reentry and one desktop movement404/no-retry/visible-standing check. All pass;
all browsers, servers and child processes are closed. Scripted placements,
staged UV probes, headless emulation and muted state checks do not establish
natural E traversal, physical Android, perceptual listening or general FPS.
Old semantic364, incomplete-audit, lip/reporting and fixture REDs remain saved.
Evidence: `output/klaus-release/`. Publish immediately and continue the cast.

Brigitte Müller publication verified: accepted `a2b23ae96db0a2b5ee71be4928480577935efeb8`, deployed in `defd99867ef373831ff3b320a711a013a9e7e4ef` by successful Pages run40024573758. All14 public files match the immutable deployment and exact accepted character record. The root URL, query/hash-preserving `3d.html` compatibility entry and public standing/movement admission pass in portrait emulation with no page or HTTP failures. Root personally viewed her public pavement capture. Post-deployment desktop and physical Android remain unrun; the staged approach does not establish natural E traversal. Evidence: `output/brigitte-release/live/`.

Klaus-Dieter Klein publication verified: accepted `71290b1536e8eb60a410b1ba62915ad30402f131`, deployed in `defd99867ef373831ff3b320a711a013a9e7e4ef` by successful Pages run40024573758. All14 public files match the immutable deployment and exact accepted character record. The root URL, query/hash-preserving `3d.html` compatibility entry and public standing/movement admission pass in portrait emulation with no page or HTTP failures. Root personally viewed his public pavement capture. Post-deployment desktop and physical Android remain unrun; the staged approach does not establish natural E traversal. Evidence: `output/klaus-release/live/`.

## Wolfgang Schulz: adult painted street family

Wolfgang now uses mature connected proportions, angular worn features, olive
knitwear, brown trousers and whole black shoes. His burgundy briefcase remains
in his RIGHT hand and his LEFT stays empty. Eight genuine painted directions
share height2.33 and his own source-fitted11.941927192781767 stride. All42other
registry records, police, route/collision logic and original voice takes remain
unchanged. The412selected cells preserve walking, bridges, turns, stops and the
four original quiet performances;324 supported mouth slots per density use his
actual lips and retain the three rear views without visible mouths.

Root verifies the52-file packet, two original tool images, source/dependency
closure, actual sparse packaging of9runtime files and194focused tests. A single
runtime attributes file uses an explicit CRLF-to-LF overlay; artwork and recipe
logic are exact. The full source/native and clean-rebuild evidence is retained.
Independent Physics verifies824native cells, own RGBA sole correspondence and
three complete actual route cycles, all16phases, planted stops, quiet4 completion,
reaction release/resume and88player-obstruction holds without overlap. Floor
fringes remain within one row and the actor's own neutral. Independent Camera
reviews mature population/car/door scale, actual source requests, alpha-aware
near/far person and opaque wall order, turns and standing handover. Fresh
desktop/portrait evidence and sealed author landscape evidence are attributed
separately; root personally inspects actual integrated images.

The full299-frame Physics runs remain RED: later contact with an unchanged
full-size traffic proxy occurs after the required clear three-cycle witness.
The rendered vortex car's transformed body was not logged, so visible-body
penetration is unproved. The older author's frame257 exact blocker remains
unresolved. These are disclosed shared-world/historical qualifications, not an
all-world collision PASS or an inferred actor-art regression. Earlier fixture
and resource failures remain saved. Camera's old combined turn fixture RED is
retained beside the final scoped result. Silent headless emulation and scripted
placements do not establish physical Android, natural mission traversal,
perceptual audio quality or general FPS. Evidence: output/wolfgang-release/.

Wolfgang Schulz publication verified: accepted, pushed and deployed as
`78e86bc1c878fe95c757906f1a84dc58c2ed1309`; Pages run 40044277061 succeeded.
All 14 deployed files match the immutable deployment and accepted actor record.
Actual root startup, query/hash-preserving `3d.html` compatibility, and public
standing/movement admission pass with zero page or HTTP failures. Root personally
viewed the public pavement capture. This silent portrait emulation and staged
approach do not establish physical Android, postdeployment desktop or natural
E traversal. Evidence: `output/wolfgang-release/live/`.

## Ursula Neumann: adult painted street family

Ursula now has mature connected proportions, a worn angular face, short blonde
hair, teal quilted jacket, cream blouse, plum trousers and whole burgundy shoes.
Her rolled newspaper remains in her RIGHT hand and her LEFT stays empty. Eight
genuine headings share height 2.33 and her own source-fitted stride 11.8313.
The other 42 registry records, all police, simulation/routes and original voice
takes are preserved. The 412 selected cells retain walking, bridges, turns,
stops and four separate quiet states; look/failure retain their shared original
sway formula. There are 324 supported mouth slots per density and three rear
headings without visible mouths.

Root verifies 53 sealed files, two original tool images, 1,937 author evidence
hashes, source/dependency compatibility, clean reconstruction of 22 outputs,
actual sparse packaging of nine runtime files and 198 focused tests. The two
shared source differences are cache queries only. All 71 integrated candidate
pins remain exact while preserving the separate published Berghain descendant.
Independent Physics samples 32 final native cells and own source-RGBA contacts,
then freshly verifies actual desktop UP10 movement: all 16 phases, three complete
11.833333 stride intervals, legal body bounds, planted stops, four quiet states,
release/resume and 55 player obstruction holds without overlap. Supplied author
portrait/landscape movement, 824 body cells, 648 mouth cells and 116 actually
inspected boards are identified separately.

Independent Camera freshly checks desktop and portrait source identity, actual
LINEAR alpha-aware person ordering with over 99.7 percent correct-exclusive and
zero wrong-exclusive pixels, opaque wall occlusion, loaded car/door/Bundestag
relationships and standing/fallback handover. At common desktop ground Ursula
is 82 pixels high, Herr Sandale 82, Frau Sandale 81 and the existing larger
Söder caricature 100. Loaded standing crown differs from the nominal fallback
by one native pixel, with zero foot error. Root personally views and binds 16
source/native, desktop movement and desktop/portrait camera images.

The bounded one-row ground fringe is retained quantitatively: neutral camera
fringe is 8 desktop and 23 portrait pixels; Physics contact paint remains within
its own neutral. Existing white Wurst seals and the first portrait fax overlay
are separate world/HUD content. Shared unchanged fade behavior uses supplied
accepted evidence. Initial memory refusal remains NOT RUN rather than gameplay
failure; the fresh desktop retry passed. Silent emulation and scripted placement
do not establish physical Android, perceptual listening, natural mission
traversal, general FPS or all-world collision/HUD certification. Evidence:
`output/ursula-release/`.
