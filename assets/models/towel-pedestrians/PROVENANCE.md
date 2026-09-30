# Towel pedestrian human walk candidates

Status: **candidate-unapproved, preview only**. [`towel-3d-preview.html`](../../../towel-3d-preview.html) loads two GLBs with front, side, and back inspection. `walk-preview.webp` shows the same walk. The root game and `world3d.js` still use the accepted sprites.

The human body is MakeHuman's CC0 basemesh with its older male and female shape targets, corresponding older skin textures, skeleton, and vertex weights. Exact source files, hashes, and licenses are recorded in [`../../sprite-sources/reference/makehuman-walk/PROVENANCE.md`](../../sprite-sources/reference/makehuman-walk/PROVENANCE.md). The body is one continuous weighted mesh with a sculpted human face, hands, and limbs. The fabric and accessories are original Blender modeling based on the accepted pre-rig sprite sheets. The man keeps a straw hat, sunglasses, moustache, blue polo, tan shorts, white calf socks, brown strapped sandals, and blue/yellow towel. The woman keeps a travel cap, glasses, grey hair, coral polo, tan shorts, white calf socks, navy strapped sandals, and red/white towel.

`tools/build-towel-3d-preview.py` creates editable `.blend` files and self-contained GLBs in Blender 4.1.1. It uses the verified neutral guide's 32 walk poses plus the closure pose, with one uniform scale per character. A single 18-bone skin deforms the body and holds the accessories. The GLB has one `Walk` clip; its first and last frames match. The feet use rigid sandal soles with the guide's grounded step cycle. This is a walking preview, not a runtime replacement or a running/collision study.

The shared guide includes filtered CMU 69/01 arm motion and timing. Its acknowledgment and **non-resale** condition are recorded in the neutral guide and CMU reference provenance:

> The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217.

## Rebuild and check

```powershell
& 'C:/Program Files/Blender Foundation/Blender 4.1/blender.exe' -b --factory-startup --python-exit-code 1 --python tools/build-towel-3d-preview.py -- man
& 'C:/Program Files/Blender Foundation/Blender 4.1/blender.exe' -b --factory-startup --python-exit-code 1 --python tools/build-towel-3d-preview.py -- woman
node --test tests/towel-3d-preview.test.mjs
```

The browser preview was visually checked in muted, headless Chromium from the front and side at desktop and 390 px phone width. Both GLBs loaded; the phone had no horizontal overflow or console errors. The test checks for an embedded skin texture, one 18-joint skin, the recognizable props, and a closed 33-key walk. These checks do **not** establish visual acceptance.

| Asset | SHA-256 |
| --- | --- |
| Accepted male source key sheet | `4f5784eadabba9adf572ce2e27559fb5db3bfd8b6545624c94376fb9b8ca1cbe` |
| Accepted female source key sheet | `bb407dcff74386fa3d5874a8ae331d997b981f01db499fb00b6358a9dd5b09f3` |
| Neutral `pose-audit.json` | `677c11dc394ee8f5719b2c39dbe4576774daa4e1ce7351dc582a4e653e794564` |
| `man.glb` | `5326bbb4bd82acb4533a4abb8206a551448c81f1eac0ecc7d7d446054bf39689` |
| `woman.glb` | `61d14c87a41721bf6219d263ac37ec203b423071bcc581b5a96f810b3933a12c` |
| `walk-preview.webp` | `7d7dd86e48978040d5b06bf1a5bdd86ea501363b3d38fe9a2e6f10bb8b568170` |

## Reversible caricature presentation

`towel-caricature.js` now supplies the default appearance in the same preview. It is a **candidate-unapproved presentation study**, not a rebuilt or newly accepted GLB. The existing male/female identities, hats, clothes, towel colors, rig, clips and all source-file hashes above remain unchanged. The `Original 3D` control, or `?style=original`, restores the baseline geometry/materials/lighting without restarting the walk; `Caricature` switches back.

The treatment widens and vertically compresses each figure, scales its head by 1.30 and its hands by 1.10, broadens the chest, and enlarges the existing moustache, eyewear and towel geometry about each prop's own center. Sandal sole geometry and foot-joint transforms are not individually altered. The common body transform still changes the preview's overall proportions; this is not a new numerical contact or physical-gait certification.

The presentation uses four-step toon lighting, muted garment colors, a six-tone 512-pixel skin derivative generated in memory from each embedded source texture, and thin back-facing contour shells sharing the existing skeleton. These textures are not new externally generated artwork and add no downloads. The original materials and geometries are retained for comparison; only owned derived resources are disposed. No source mesh, Blender file, gait clip, accepted bitmap or game-loader decision is replaced.

`node --test tests/towel-caricature.test.mjs` covers fixed profiles, paused-frame scale stability, sampled-scale restoration, prop emphasis, skin-palette bounds and resource ownership using CPU fixtures. Those tests were run on a byte-identical local copy during this edit. They do not render Three.js or establish visual acceptance. Desktop/mobile WebGL screenshots, shader/asset loading, all-view silhouette and clipping review, contact quality, and performance checks remain required before promotion into the game. The earlier browser verification recorded above applies to the original GLBs, not this new presentation.
