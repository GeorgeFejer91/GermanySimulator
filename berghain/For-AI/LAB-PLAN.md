# Lab.oratory reconstruction increment

**Goal:** Add the photographed Lab.oratory rooms and industrial fittings to the
existing Berghain asset and controllable walkthrough, with metre units and an
explicit distinction between observed forms and inferred arrangement.

**Architecture:** Reuse layout parts/floors/solids, fixture helpers, shared PBR
maps, the current visitor/camera and GLB exporter. No engine, dependency, second
runtime or photographic textures. This implements the existing full-building
goal and the Lab gap in INTERIOR.md; it is not a claim to recover a floor plan.

## Evidence and builder decisions

- A12 expanded project gallery has ten actual Lab photographs, now inspected as
  `lab-expanded-00`–`09.jpg`; URLs/bytes/hashes are in ignored reference metadata.
  The site's header1/12 refers to a shared slideshow, not twelve Lab photographs.
- Observed: low concrete beams/services, pipe/gauge bar and hanging insulators,
  steel barred cells with suspended slings, industrial bunks, brick passages,
  ornate green cast-iron sanitary enclosure, adjacent stair down to a tiled area,
  historic rusticated inner wall/windows and a blue-lit window bench.
- The architect documents a former slag/coal cellar beneath Berghain, not an
  absolute underground elevation. A15 documents Säule's separable/connected
  steel-glass partitions. No exact Lab footprint, floor heights, complete plan,
  counts, connection coordinates or contemporary arrangement is established.
- Builder choice: place the study in the currently empty western lower floor,
  author x[-21.5,-4],z[-21.5,9.4], floor.05, ceiling4.15, beam underside3.60.
  The first5.95m soffit was visibly too lofty against photos02/04/07 and was
  rejected for photographic fidelity despite passing the first browser matrix.
  Place the raised gate mechanism wholly on the taller Säule side of the seam.
  Keep the existing upper
  Klo/main floors and main entrance. A raised steel-glass opening from Säule is
  an inferred connection, not a surveyed doorway.
- Reconstruct the photographed small sanitary descent as an estimated1.20m
  local drop, seven treads and a landing. Cut its actual opening through both
  overlapping ground slabs by four ordinary floor strips; reuse current ramp
  support/collision, with no new navigation algorithm. Do not invent a complete
  subterranean storey from the word cellar.
- Fixtures use real-sized authoring estimates within the calibrated hull. Closed
  cages/bunks remain protected; the low brick opening is not a standing doorway.
  Preserve all existing materials/artworks/speakers and disclose incomplete
  weathering, unobserved room extents and installation currentness.

## Implementation and acceptance

- [x] Inspect all ten primary photographs, retain research-only provenance and
  preserve the accepted current runtime as the comparative baseline.
- [x] Add failing geometry/route/export tests for a sourced Lab inventory,
  full-body entrance/aisle routes, actual sanitary descent/return, safe invalid
  starts, source/native matching geometry and unchanged prior room access.
- [x] Implement `lab-oratory.mjs` rooms/fixtures/custom geometry using existing
  helpers; integrate layout/model/export/material hooks. Add Lab room selection
  and footprint-based labels using existing Pretext/layout measurements.
- [x] Re-export GLB; run focused Node tests and inspect actual source/native
  room/detail views. Fix visible form and contact failures, not just counts.
- [x] Run silent headless desktop and Android portrait/landscape natural entry,
  continuous Säule/Lab/bar/sanitary/return and prior Klo/lounge checks. Check
  320px/200% text, idle/disposal/fallback and comparable case-facing cold costs.
  Baseline camera-only accommodation, if needed, must be explicit and retain
  the old geometry/materials/renderer; do not call it a natural baseline route.
- [x] Freeze one integrated candidate. Obtain independent read-only Physics
  and Camera/scale reviews, repair required findings, and rebind final hashes.
- [x] Review scoped publication against current remote main, preserve the
  original primary index, publish and verify actual public bytes and movement.
  Record remaining full-building/photographic-fidelity gaps; keep the goal active.

Public acceptance receipt: ad12fc4 is deployed on the permanent Geheim URL;
68/68 exact public files and9/9 canonical browser cases pass. See the owning
README/VALIDATION and output/berghain-lab-release.json. This closes the initial
Lab increment, while the complete realistic building goal remains active.

Integrator owns `assets/models/berghain/`, scoped `berghain/` viewer/authoring,
its For-AI notes and `tests/berghain-*.test.mjs`. No root game behavior or unrelated
staged files are assigned. Existing publication uses the isolated bare index.
