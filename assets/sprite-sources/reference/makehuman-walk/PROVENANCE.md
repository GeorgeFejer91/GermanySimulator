# Anatomical source for the preview-only 3D walk

MakeHuman community data at commit `a8bc2d54ff0ac92e78ff71431b1023eda42bf482`:

- Repository: https://github.com/makehumancommunity/makehuman/tree/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data
- `3dobjs/base.obj` → local `base.obj`, SHA-256 `8e761e6624b8f54536409135d1636da63b32486a90d4897f84e121d144f6fb4c`.
- `rigs/default.mhskel` → local `default.mhskel`, SHA-256 `99f179bce0aa850b45d4191a1d0d234c5851f881c057439470ded3bddf729a24`.
- `rigs/default_weights.mhw` → local `default_weights.mhw`, SHA-256 `0f3641d651ae3d00ad6b4ccee43142edb109d3bd909d27d9e4139ef1beed8625`.

The individual mesh, skeleton and weights declare **CC0**. Authors in their
headers include Data Collection AB, Joel Palmius and Jonas Hauquier (2020–2021).
The full dedication is retained in `LICENSE-CC0.txt`. This imports data, not
MakeHuman application code. Acquired/verified 2026-09-27.

`tools/build-merkel-3d-pilot.py` keeps the source body topology for face/neck and
hands, fits mesh and joints together once, collapses the source weights onto
an 18-bone armature, and adds original closed jacket, trouser, sleeve, hair and
shoe geometry. The rest fitting is deliberately a broad, compact caricature
study, not a finished Merkel likeness. These files are offline authoring inputs;
the game and sprite preview do not fetch them.

The separate CMU capture and its license/acknowledgment remain in
[`../cmu-walk-69-01/PROVENANCE.md`](../cmu-walk-69-01/PROVENANCE.md).
