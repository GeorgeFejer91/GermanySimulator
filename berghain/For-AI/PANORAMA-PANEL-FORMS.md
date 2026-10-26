# Panorama acoustic-panel form correction plan

**Goal:** Replace the repeated near-rectangular panel silhouette with the square, wide and elongated forms/depths visible in I11 and I19, retaining provisional horizontal anchors and all room/circulation/equipment registration.

**Architecture:** Keep `addPanoramaCeiling(layout,{box})` and the existing sixteen named box parts. Use an explicit authored profile assignment, with estimated dimensions and lower datums retained. Rebuild the existing original ceiling radiance from the resulting actual geometry, then export through the same standard GLB path. No new lights, framework, texture family or runtime loop.

**Spec:** The user's full architecture/club-night goal and `output/berghain-panorama-panel-followup-2026-10-26.md`. This is a form-vocabulary correction at provisional anchors, not recovered panel-by-panel placement. I11's cropped inventory and 50 control circuits are not whole-room panel/lamp counts.

## Constraints and review focus

- Keep sixteen panel centers in X/Z, all floor/room/viewpoint/private-boundary definitions and equipment exact; alter only panel footprint/depth and center Y as needed to retain each lower datum.
- Preserve pale material, instance colours and all runtime light counts. Inspect full transformed panel bodies against beams, ceiling, neighbouring panels and retained equipment, not only their centers.
- Preserve standing routes and overhead clearance in actual source/GLB geometry. Thin equipment support rods and pre-existing overlaps must be distinguished from new body intersections.
- Re-run actual radiance builders after source changes; record real input hashes. The Säule image should remain byte-identical. Only the ceiling image should change.
- Source/native appearance, missing texture/context recovery, desktop/Android-emulated walks, bounded costs and both independent read-only specialist reviews are required before publication. Physical Android remains untested.

## Work

- [x] Add focused form/clearance/native checks in `tests/berghain-panorama-panel-forms.test.mjs`; confirm the current uniform form fails the observed-variety check.
- [x] In `assets/models/berghain/panorama-services.mjs`, fit explicit square/wide/elongated profiles at the existing provisional anchors. Document the form evidence and estimated assignment in `panoramaServices`; preserve every part count/name/material and panel lower datum. Resolve any new full-body beam/equipment overlap before baking.
- [x] Extend the existing ceiling browser suite with source/native front, oblique and upward views and actual-input loops; retain the existing fallback/context behavior. Inspect the rendered forms against the two daylight references and the night source, without copying photographic pixels.
- [x] Actually regenerate `panorama-ceiling-bake.png`, both input manifests and `berghain-study.glb`; compare unrelated parts/solids/colours/native streams/images to baseline `5711e11`.
- [ ] Run the integrated Berghain checks, freeze exact files, obtain independent Physics/Camera reviews, run sequential cost contexts, review the complete selected diff and publish under the standing policy. Verify exact public files, entry URLs and live desktop/mobile-emulated walks.

## Execution decisions

Root implements inline; only the two project-required read-only specialists are delegated. The repository's task routing and standing publication policy override the generic skill's additional approval prompts and per-task commits. The primary checkout is unborn and contains unrelated staged work, so commits use only the selected candidate paths via the existing bare publisher/private index. All text edits preserve LF. The previous goal turn was progress: its correction is deployed and verified.

The explicit profile assignment is an authored fit using observed form families. If its complete bodies or visible composition cannot be fitted responsibly, retain the corresponding original anchor/form and record that limit; do not describe guessed exact placement as recovered architecture.


## Geometry ledger

Initial focused RED: one pass and two expected failures (uniform forms and absent evidence metadata). Initial implementation: 11/11 focused checks pass, but the complete rendered-body AABB screen rejects 22 new intersections with junctions, enclosure rims and a structural beam. That rejected receipt remains output/berghain-panorama-panel-forms-bodies-v1.json.

Ruling: preserve each original lower face rather than its upper face. No photograph established the old top datum; extending thicker bodies upward preserves hardware clearance and the accepted standing envelope. Cost if wrong: panel vertical registration remains estimated and must be revisited with a locatable measured source. One wide panel beside a junction becomes an elongated panel at the same anchor. The revised complete-body screen has zero new intersections; existing thin service/hanger intersections decrease from twelve to ten. Those retained contacts are not silently called resolved. Minimum lower-face clearance is 4.25 m; all 16,842 unrelated parts, 6,159 unrelated solids, floors, viewpoints, fixtures and 16,858 instance colours remain exact.

The initial probe assumed every source part stored a matrix; rods instead derive theirs during instancing. The probe was repaired to inspect actual instance matrices/geometry bounds. This was a probe error, not a model defect; the body results above use actual rendered instances.


## Bake and portable-model ledger

The first geometry-dependent ceiling bake clipped 2,126 pixels and was rejected;
no rejected image was written. Encoding range increases from 2 to 4, leaving the
authored area-light output at 55 and runtime reconstruction consistent. The
replacement bake passes with zero clipped pixels. The actual Säule bake was
rerun and remains pixel-exact. Native vertex RED with the old export (4/5 pass)
becomes GREEN after regeneration; focused checks pass 21/21. Initial controlled
front, oblique and upward night comparisons pass 3/3 and were inspected. Final
night comparison uses a wider oblique look so several form families are visible;
full frozen acceptance is recorded below. No exact photo registration is claimed.


## Integrated acceptance

The frozen 280-file candidate passes 280 Node checks, nine source/native and
actual-input browser cases, both independent read-only reviews and six matched
cost contexts. The integrator reviews the entire selected diff before publishing.
The final publication checkbox remains open until the exact public deployment
receipt and both entry-page walkthroughs pass. See the current README/VALIDATION
and output/berghain-panorama-panel-forms-release.json for that separate outcome.
