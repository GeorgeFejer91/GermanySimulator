# Neighbor conversation repair

Base: published `1c6be7e`; reuse the clean attached neighbors-checklist worktree
on `codex/neighbors-face-start-repair`. Integrator owns all writes/publication.
The dirty primary checkout remains outside the change.

Repair the user's reported notebook head/collar displacement, make all four
mouths more visible on the actual speech clock, remove the empty automatic
dialogue surface, allow any adult to be approached first, and keep Heiko writing
through the exchange leading to Hartmut's “Papa, nicht mitschreiben”.

Owners: existing `game.js` selection/dialogue/tour state, `neighbor-story.js`
gesture intent, `neighbor-sprites.js` pose/lips, `tools/build-neighbor-notebook.py`
and Heiko's two atlases/manifest. Preserve fixed voices/recordings, collision,
camera, world scale and the original 256 atlas cells. No new dependencies.

Use source-bound intact notebook figures rather than mismatched head/torso/leg
splices. Verify source identity, neck joins, feet, alpha, encoded mobile/desktop
frames and actual rendered transitions. Fit mouths to those selected figures.

Tests: fresh first-adult halo/waypoint/input selection and dwell-owner change;
Heiko greeting before movement; writer body independent of Hartmut's lip owner;
closed/pause/cancel/salient energy-driven mouths; actual subtitle visibility and
empty-panel absence. Run the exact affected CI groups locally before publication.
Freeze the candidate for the required independent Physics and Camera reviews;
use silent desktop/mobile browser checks and verify live Pages after deployment.

## Implementation and causal checks

- First approach → nearest unmet adult → shared halo/waypoint/visitor owner;
  an actor change resets automatic-arrival dwell before a tour can start.
- Heiko interaction → owned greeting before walking → first stop skips that
  exact authored line; existing tickets and final-stop receipts remain authoritative.
- Heiko supervision → explicit writer intent → Hartmut listener-writing intent
  follows Hartmut's native media clock, while Heiko has zero lip opening/no
  borrowed cue. The closing line keeps the already held notepad until stowing.
- Automatic dialogue → actionless frame hidden by CSS → existing native-clock
  subtitles remain visible. A desktop counterfactual reconstructs the old
  39×32 CSS-pixel box with the attached image's exact cream/border colors.
- Clean source bounds → whole-figure height/head-centroid registration →
  connected notebook collar/body/feet, with original rest and all 256 prior
  desktop/mobile cells preserved. The six other atlas files are byte-identical.

Private evidence is under ignored `output/neighbors-repair/`. Initial behavioral
regressions were red before fixes. Candidate 1 passed 81 game tests, 208 voice
tests, the voice curator/coverage checks, eight-export alpha/gutter verification,
and 12/12 staged production browser cases across desktop and Android portrait/
landscape emulation. Native receipts cover Heiko's 17.21-second lead-in and
Hartmut's full 26.75-second line, including native pause. Physical Android,
perceptual listening and natural full-tour traversal were not run.

Physics accepted candidate 1's scoped movement/ownership behavior. Camera
accepted the connected notebook frames and native writing/empty-frame evidence,
but rejected the newly salient profile/chore mouth openings: their old loose
registrations painted onto cheeks. Independently marked encoded lip corners
now constrain those profiles, with a red/green regression. A successor render
also compares upper-face pixels to prove lip opening does not displace the head.
Final successor acceptance and publication receipts are recorded below when run.

## Final candidate 3

Both independent specialists accepted the same 15-pin final candidate with no
remaining scoped findings. The corrected controlled fixture projects an upper
face rectangle in native source pixels; its rejected screen-pixel crop had
included lip deformation at larger render scales. The production renderer was
unchanged by that diagnostic correction. Fresh evidence: 82/82 affected game
tests, 36/36 shared welcome/input/subtitle/level-page regressions, 208/208 voice
tests, 114/114 spoken sources resolved, eight exact-export checks, and 160
actor/pose comparisons across four rendered profiles, including pause/release
and disposal. The 12 native-clock browser cases carry unchanged action/story/
HUD behavior; final mouth placement uses the refreshed renderer evidence.

An initial standard cold-root benchmark stopped on its third desktop input
sample (2 accepted responses, no console errors); retain that failed report.
The unmodified standard benchmark is rerun sequentially, with the same three
seeded cold contexts per viewport and unchanged budgets. The published base's
six comparable samples passed; deferred notebook assets do not load at root.

The final standard rerun passed all six cold-root samples without changing the
harness or budgets: under 18 MB transferred, bounded title cadence/drawing
buffer, no forbidden boot assets or console errors, and at least eight actual
input responses per sample. Median transfer is 16,048,082 desktop and 15,661,664
mobile bytes. Timing varies substantially across both base/current runs;
these checks establish the named guards, not a universal speed improvement.
Implementation and scoped reviews are complete. Publication uses the normal
`origin/main` Pages workflow; task-local deployment and exact live-file receipts
belong in `output/neighbors-repair/live-verification.json` and
`output/neighbors-repair/release-summary.json`.
