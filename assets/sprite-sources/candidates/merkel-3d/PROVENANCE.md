# Merkel four-view 3D walking study

Status: **candidate-unapproved**, preview only. Grey/clay proportions and motion,
not finished Merkel artwork. The actual game continues to use the stable archive.

## Authority and limitations

- One anatomical MakeHuman-derived skinned mesh/armature, with original clothing
  and shoes; [pinned source, hashes and CC0 dedication](../../reference/makehuman-walk/PROVENANCE.md).
- CMU subject 69/01 supplies the cycle duration and three-dimensional left-arm
  and forearm directions, filtered into periodic three-harmonic curves. Its
  right arm is unusually still in this interval, so the filtered left-arm gesture
  is mirrored at a half-cycle offset. The shoulder's outward direction is
  constrained to clear the wider jacket. This is **not full-body mocap retargeting**.
- Legs use fixed-length two-bone 3D IK with forward knee poles, separate lateral
  foot lanes, 62% stance, heel strike, flat support, forefoot roll and a periodic
  swing trajectory. The pelvis has bounded smooth sway/bob. Feet own heel, ankle
  and toe coordinates; the loafer mesh rolls as one rigid shoe, without toe flex.
- There is no 2D quadrant blending, frame-local recentering, cutout depth sort,
  per-frame generated artwork or changing camera/lighting. Four orthographic
  cameras render the same posed mesh, giving genuine depth/occlusion.

The data used in this project was obtained from mocap.cs.cmu.edu. The database
was created with funding from NSF EIA-0196217. See the existing
[CMU provenance and data terms](../../reference/cmu-walk-69-01/PROVENANCE.md).
Do not resell the source capture itself.

## Rebuild and review

```powershell
python tools/build-merkel-3d-pilot.py
python tools/verify-merkel-3d-pilot.py
node --test tests/merkel-3d-pilot.test.mjs tests/sprite-preview.test.mjs
```

Authoring: Blender 5.2.1 LTS / EEVEE, Python with NumPy and Pillow. The builder
accepts `--blender <path>`, `--draft` (four inspection phases) and `--pack-only`.
Draft output is not publishable; always run a full bake and verification afterward.
The editable `merkel-walk.blend` contains the weighted geometry and loop keys.

Each view renders 32 unique phases at 512 px, then is downsampled with
premultiplied alpha into 128 px atlas cells. The separately rendered closure
is inspection point 33 and never adds a playback hold. Recommended preview speed
is 26 fps (~1.23 s/cycle). Row order: left, right, back/up, front/down.

`pose-audit.json` exports the evaluated 3D bones and shoe soles plus their camera
projections, not just intended 2D targets. `verification.json` checks fixed bone
lengths, joint connection, knee direction, stance contact/slip, no floor penetration,
cyclic motion bounds, native alpha/margins and exact pixel closure. The manifest
binds source and output hashes. Passing mechanical checks cannot certify natural
motion or likeness. Review the loop in the browser; user approval is still needed.

The new preview is `sprite-preview.html?source=3d`; Focus view exposes the
red-left/blue-right bone/heel/toe overlay and the 33-point closure sheet. Both
legacy versions and earlier candidates remain selectable. No runtime dependency
on Blender, OBJ, BVH, MakeHuman or a browser 3D engine is added to this page.
