# Gisela paper-raise greeting: seven-sample source pilot

Status: candidate, awaiting integrator source review. This does not replace v1 walking, turns, standing, mouths, or any runtime manifest. No full sixteen-frame action is baked.

The original twelve-key sheet actually raises the paper in Gisela's anatomical right hand; the book stays in her left hand. The pilot preserves that action instead of inventing an empty waving hand. `source-registration.json` binds the unchanged original raw PNG, measured component boxes, common source scale, planted baseline, final cell and pivot. Down is key 0; greet is key 4. No mirroring, borrowed family paint, or image generation is used.

Reproduce from the repository root:

```powershell
python assets/sprite-sources/street-speaker-motion/gisela-becker/greet-gesture-v2/build-pilot.py
python output/ambient-city-animation/gisela-greet-v2/verify_pilot.py
```

The durable first command imports the existing family wrapper, resident helpers and actual `morph_frames` implementation. It emits only this source folder's layers/controls and ignored evidence. Its seven ordered samples are `[0, .30, .65, 1, .65, .30, 0]`: four distinct source poses plus an exact return arc. The second command is independent, ignored review evidence; it does not rerun the driver.

The stationary lower body and book/left hand retain their original source pixels. Head and sleeve use separate actual helper meshes with strict continuous fold validation. The paper/right grip/cuff group retains one original image with rigid translation `[-38*t, -82*t]`, scale 1, rotation 0. Its maximum pose connects that rigid grip to the authored raised sleeve and head; it is intentionally not a full-body dissolve into the original greet key. The neutral's upper sleeve is hidden by its paper, so the complete *own raised sleeve* is registered backward through the same helper's actual second coordinate map at phase zero; original visible neutral sleeve paint is retained. Revealed torso backing uses only Gisela's own greet coat, registered by the existing paint helper, with an opaque compatible coat overlap at its boundary. Explicit source masks exclude paper from head paint and book from moving face/neck paint.

`controls.json` stores the exact nodes, triangles, source and target correspondences, native face/mouth endpoint inputs, source masks, backing warp, rigid prop rule and dependency hashes. Ignored `actual-field-capture.json` records the exact head arrays passed to the actual morph helper for every sample, plus rigid prop inverse translations. Future mouth transport must evaluate both endpoint maps and their full two-dimensional Jacobians from this actual helper; this pilot has not compiled or approved moving mouths. Every exact input PNG, controls file and capture is additionally bound by the handback's `pilot-bindings.json`.

The first review found a short apparent black collar line near working x221/y300. Pixel inspection proved it was a transparent one-pixel backing gap: both native sources contain opaque coat there. Source-head removal and shifted revealed-coat exclusion had left no paint under the moving lapel. The bounded repair gives the original stationary coat an explicit underlap only within the measured collar polygon and only where backing alpha was zero. The prior rejected pilot is preserved; the exact motion meshes and transformations are unchanged. The repaired intermediate light/dark boards show the stray line removed. Root review remains required. Source observations show one face, paper, book and attached grip/sleeve, without the earlier ghost sleeve or paper-edge needle. These observations are not final source, animation, GPU or runtime acceptance. Normal/slow GIFs are generated but live playback was not observed.

Rejected attempts are retained only in ignored output with their descriptions. No body atlas, v1 wrapper/spec/capture, production standing mouth definition, shared helper, global registry or runtime is changed by this pilot.
