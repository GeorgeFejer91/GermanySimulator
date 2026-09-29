# Anatomical source for the preview-only 3D walk

MakeHuman community data at commit `a8bc2d54ff0ac92e78ff71431b1023eda42bf482`:

- Repository: https://github.com/makehumancommunity/makehuman/tree/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data
- `3dobjs/base.obj` → local `base.obj`, SHA-256 `8e761e6624b8f54536409135d1636da63b32486a90d4897f84e121d144f6fb4c`.
- `rigs/default.mhskel` → local `default.mhskel`, SHA-256 `99f179bce0aa850b45d4191a1d0d234c5851f881c057439470ded3bddf729a24`.
- `rigs/default_weights.mhw` → local `default_weights.mhw`, SHA-256 `0f3641d651ae3d00ad6b4ccee43142edb109d3bd909d27d9e4139ef1beed8625`.
- `targets/macrodetails/caucasian-male-old.target` → local `targets/caucasian-male-old.target`, SHA-256 `b0d2b1d58cba0358af59833740e70229265f7da1c20a11240f4123b7192cfd6d`.
- `targets/macrodetails/caucasian-female-old.target` → local `targets/caucasian-female-old.target`, SHA-256 `6560982486c4b1a7a0b1d82b0ad3f09770c16b4f87c8f949537dc9cfc941a0b0`.

The older skin textures and their `.mhmat` metadata were extracted from the official [MakeHuman system assets CC0 pack](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html) on 2026-09-29. The pack is not checked into this repository; only the two used textures and metadata are. The pack labels both skins CC0, and the material headers state the same.

| Local skin file | SHA-256 |
| --- | --- |
| `skins/old_caucasian_male.mhmat` | `001eccec34180d4eb7369933360116a7ea1022c72674c1b012b988af65002600` |
| `skins/old_caucasian_female.mhmat` | `a88440d9f1225d3b4c963259e6f434eb3be7d3a2932e46ea88cfc675ed20c387` |
| `skins/old_lightskinned_male_diffuse.png` | `dfb2310ed3e0ad024ea7a3ad321215e2e9e2994cca64043d9f3d07c6543ec847` |
| `skins/old_lightskinned_female_diffuse.png` | `00c45246c145562b917371e92de44a1fe394bc5f4bd91418addf24b6adff5e9d` |

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
