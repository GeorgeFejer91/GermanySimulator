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

## First candidate: Irmgard Aktenordner

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

## Parallel character owners

- Heike Hoffmann: `street-heike-complete` managed checkout; all own directions,
  turns, key gesture, moving mouths, stops and full selected capability.
- Gisela Becker: `street-gisela-complete`; own skirt/shoe gait, paper/book hands,
  actions, moving mouths and normal delivery.
- Hannelore Sparkasse: `street-hannelore-complete`; own bag and adult views,
  existing actions/stops/turns, speech and bounded delivery.

The lead serializes browser/GPU work and source-generation jobs. Workers keep
independent CPU authoring productive while waiting and never push. Completed
workers receive the next uncompleted character immediately. The remaining cast
and old local source studies are not implicitly approved by this first release.
