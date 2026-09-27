# Merkel: 3D-guided ImageGen paint pilot

Preview only. **Candidate unapproved**, left-facing only. The stable game sprites
and every earlier candidate remain unchanged. This is a painted-motion test,
not an identical likeness or a claim that the user has accepted the animation.

## Sources and method

- Built-in OpenAI ImageGen produced `paint-over.png` on 2026-09-27.
  The unmodified RGBA output was `exec-7bddc67f-1063-4dda-8b0d-4984c0825a55.png`.
  The complete prompt and reference ordering are in `PROMPT.md`.
- `pose-guide.png` is the first left-facing render of the existing grey 3D
  study. The archived `merkel-sprite-keys.png` was the appearance reference.
  The generated painting is 1254 × 1254, despite requesting a 512-square guide.
- `tools/build-merkel-painted-pilot.py` opens the unchanged `merkel-3d` blend,
  registers the painting once, assigns fixed per-vertex camera-projected UVs,
  and renders all 32 poses plus closure. A fixed profile-landmark correction
  aligns the generated nose with the guide. No frame is individually recentered,
  regenerated, crossfaded or optically interpolated.
- Both feet and actual 3D limb depth come from the same skinned model. Far limbs
  reuse the corresponding visible left-limb texture in rest space; they retain
  their own animated bones. Hidden/unsuitable texels use part base colors.
  Emissive painted materials avoid illuminating the baked highlights twice.
- `merkel-painted.blend` is editable and contains the packed original painting.
  `binding-audit.json` records the fixed UV hashes and independently evaluated
  bone coordinates. `manifest.json` binds sources and outputs by SHA-256.
- The base mesh's CC0 MakeHuman attribution and CMU motion acknowledgment,
  including the non-resale restriction on the source data, remain in
  `../merkel-3d/PROVENANCE.md` and the referenced source directories. This is
  the same analytic leg IK / filtered CMU arm-swing motion, not a new capture.

## Scope and remaining limits

The material is deliberately view-specific. The 3D silhouette still controls
the result, so painting cannot repair inaccurate face/hand/clothing geometry.
The hidden-side base-color fills and trouser/jacket intersections can still be
seen in enlarged frames. Likeness and anatomical *appearance* need human review;
exact loop closure and constant bone lengths alone do not prove naturalness.
Do not mirror this into other views or replace game sprites without approval.

## Rebuild and check

```powershell
python tools/build-merkel-painted-pilot.py
python tools/verify-merkel-3d-pilot.py
python tools/verify-merkel-painted-pilot.py
node --test tests/merkel-painted-pilot.test.mjs tests/sprite-preview.test.mjs
```

Uses the installed Blender 5.2, Python, NumPy and Pillow. No ImageGen call or API
key is needed to rebuild from the saved painting. Draft renders stay in ignored
`output/merkel-painted-left/`; only a complete bake writes the published atlas.
The browser loads PNGs, not Blender, bone data or authoring dependencies.

Review: `sprite-preview.html?source=painted`, then Focus view → Bone overlay or
Loop closure. `contact-sheet.png` contains every playback frame.
