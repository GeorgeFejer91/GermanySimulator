# Original mission Weißwurst

`sausage.glb` is original Germany Simulator geometry built by
[`tools/build-mission-sausage.py`](../../../tools/build-mission-sausage.py).
Every vertex and material is project-authored. No downloaded geometry, image,
reference photograph or texture pack is embedded. Existing project licensing
governs this original; this notice grants no rights to unrelated assets.

- SHA-256: `eb747231f5719e04b223b85320dbdc4bdd58019dd4d6d3ff77aee7654353f3b6`.
- Cost: 98,536 bytes, 5,376 triangles, 2,720 vertices, one material, no image textures.
- Bounds: X ±0.1747344, Y ±0.17, Z ±0.875; centered, Y-up, +Z pointing end.
- Shape: full casing, rounded shoulders, small tied ends and a gentle bend.
- Runtime: pale glossy physical material, sparse herb flecks, larger dark-outlined
  black/red/gold “Wegweiser” printed on the skin, and a glowing red pointing end.
  One shared desktop/mobile source and instance, admitted through the existing
  two-job startup queue and retained with the city renderer. The pale procedural
  fallback preserves shape and wayfinding. No additional renderer or timer.

This replaces the former Saucisse derivative by __Maros__. That retired model's
CC BY-NC 4.0 terms apply to its historical versions, not this independently
authored replacement. The original source and attribution remain in Git history.

Rebuild without third-party authoring dependencies:
`python tools/build-mission-sausage.py`.
