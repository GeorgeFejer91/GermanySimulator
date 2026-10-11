# Original mission Weißwurst

`sausage.glb` is original Germany Simulator geometry built by
[`tools/build-mission-sausage.py`](../../../tools/build-mission-sausage.py).
Every vertex and material is project-authored. No downloaded geometry, image,
reference photograph or texture pack is embedded. Existing project licensing
governs this original; this notice grants no rights to unrelated assets.

- SHA-256: `b9b375ec7d42dc5b7b1e6b568b137c0ccd415cce6fe4a1aa6f7def334b4cf5e0`.
- Cost: 89,740 bytes, 4,928 triangles, 2,466 vertices, one material, no image textures.
- Bounds: X/Y ±0.18, Z ±0.875; centered, Y-up, +Z pointing end.
- Shape: plump tapered meat, rounded shoulders, pinched necks and twisted,
  six-fold casing fans at both ends; only a gentle bend.
- Runtime: pale glossy physical material, sparse herb flecks, larger dark-outlined
  black/red/gold “Wegweiser” printed on the skin, and a glowing red pointing end.
  A longer 1.6/1.6/0.84 presentation turns around source Z −0.42, near the
  non-glowing end. The procedural stand-in shares its casing profile and pivot.
  One shared desktop/mobile source and instance, admitted through the existing
  two-job startup queue and retained with the city renderer. The pale procedural
  fallback preserves shape and wayfinding. No additional renderer or timer.

This replaces the former Saucisse derivative by __Maros__. That retired model's
CC BY-NC 4.0 terms apply to its historical versions, not this independently
authored replacement. The original source and attribution remain in Git history.

Rebuild without third-party authoring dependencies:
`python tools/build-mission-sausage.py`.
