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

## Accepted second character: Hannelore Sparkasse

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

The separate complete police candidate is held for an observed pursuit cadence
failure:6.875 full gait cycles/second on a clear actual production path. Root is
testing a broader own-source leg field and calibrated distance clock before
repeating the affected review. Its pending assets are not included here.

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
`output/hannelore-release/review-physics/successor/report.md`. Deployment
verification must use the actual committed revision before claiming live.
