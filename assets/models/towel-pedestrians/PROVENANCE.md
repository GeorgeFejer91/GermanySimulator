# Towel pedestrian 3D walk candidates

Status: **candidate-unapproved, preview only**. `towel-3d-preview.html` loads the two GLBs and offers front, side, and back inspection. `walk-preview.webp` is a compact animated look at the same models. Neither file is referenced by the root game or `world3d.js`.

The appearance is original Blender primitive modeling based on the two accepted pre-rig key sheets. The man keeps a straw hat, sunglasses, moustache, blue polo, tan shorts, white calf socks, brown strapped sandals, and a blue/yellow rolled towel. The woman keeps a patterned cap, glasses, coral polo, tan shorts, white socks, navy strapped sandals, and a red/white rolled towel. Faces and clothing are deliberately simplified miniature interpretations; they are not scans or texture projections of the sprite pixels.

`tools/build-towel-3d-preview.py` builds one editable `.blend` and one uncompressed, texture-free GLB per character with Blender 4.1.1. It maps the verified 18-bone neutral guide's 32 walk poses plus closure through one fixed uniform scale per figure. Similarity scaling preserves the guide's fixed segment lengths and planted foot trajectory; each model's geometry and held towel are character-specific. The towel arm is separately posed to stay near the prop. Blender 4.1 emits separate object actions, which the builder joins into one `Walk` clip and shifts to time zero. Feet roll as rigid sandal units, without articulated toes. This walk study does not establish running or in-game collision behavior.

The shared guide incorporates filtered CMU 69/01 arm motion and timing, with its acknowledgment and **non-resale** condition recorded in `assets/sprite-sources/reference/neutral-walk/PROVENANCE.md` and `assets/sprite-sources/reference/cmu-walk-69-01/PROVENANCE.md`:

> The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217.

## Rebuild and check

```powershell
& 'C:/Program Files/Blender Foundation/Blender 4.1/blender.exe' -b --factory-startup --python-exit-code 1 --python tools/build-towel-3d-preview.py -- man
& 'C:/Program Files/Blender Foundation/Blender 4.1/blender.exe' -b --factory-startup --python-exit-code 1 --python tools/build-towel-3d-preview.py -- woman
node --test tests/towel-3d-preview.test.mjs
```

The preview was visually checked in a muted, headless Chromium session at desktop, 390 px phone, 320 px reflow, and 200% zoom. All referenced assets loaded, no console errors appeared, and the page had no horizontal overflow. The test verifies both GLBs have one complete 33-key closed animation and the expected costume/prop nodes. Mechanical and browser checks do **not** signify visual acceptance of these character interpretations.

| Asset | SHA-256 |
| --- | --- |
| Accepted male source key sheet | `4f5784eadabba9adf572ce2e27559fb5db3bfd8b6545624c94376fb9b8ca1cbe` |
| Accepted female source key sheet | `bb407dcff74386fa3d5874a8ae331d997b981f01db499fb00b6358a9dd5b09f3` |
| Neutral `pose-audit.json` | `677c11dc394ee8f5719b2c39dbe4576774daa4e1ce7351dc582a4e653e794564` |
| `man.glb` | `6e61e192de06137211fa6291dfc5bde45b57001a9b2a7bf6451fb2a282d4e091` |
| `woman.glb` | `acd135d79c6db576a9446f92e35c6d3d0968ddb49df5c3d494ca93811c1b5935` |
| `walk-preview.webp` | `ea84b7bb55fdfd1c4b883ef24ce89f41c25e5fc7c807bd177aa21081e65dcc6a` |
