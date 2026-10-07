# Street-character asset pack

Status: **candidate-unapproved**. Version: `street-characters-1`.

Eight original code-authored low-poly street caricatures, requested for Germany Simulator. `models.js` and `rig.js` are the editable asset authority; `runtime.js` presents that same geometry in the existing Three.js game. No accepted sprite, towel GLB, featured character, voice, collision or mission is replaced in normal play.

## Cast and measured export budgets

| ID | Asset identity | Silhouette and props | Triangles | GLB bytes |
| --- | --- | --- | ---: | ---: |
| `kehrwoche` | Frau Besenrein | Silver bun, spectacles, checked apron, broom, weekday card | 4,054 | 421,636 |
| `ordnungsamt` | Herr Dienstweg | Service cap, narrow coat, A38 clipboard, pencil | 3,450 | 360,608 |
| `pfand` | Petra Mehrweg | Knit cap, patched jacket, bottle-filled shopping tote | 4,026 | 419,624 |
| `wanderer` | Uwe Allwetter | Backpack, rolled mat, hiking poles, shorts and thick socks | 3,522 | 366,056 |
| `garten` | Gisela Paragraf | Wide sunhat, apron, watering can and hedge ruler | 3,670 | 382,352 |
| `pendler` | Rolf Anschluss | Long coat, scarf, wristwatch, briefcase and folded umbrella | 3,630 | 378,760 |
| `radweg` | Alex Klingel | Vented helmet, reflective vest, bell and measuring ruler | 3,218 | 336,896 |
| `warteschlange` | Erika Reihenfolge | Reading glasses, binder and long numbered ticket | 4,110 | 431,636 |

The eight exported GLBs total **3,097,568 bytes**. These measurements are from a sandbox export, not a PC/browser performance measurement. Each character has one indexed vertex-coloured mesh primitive, one material, sixteen bones, and four animation clips. Asset identities are catalog metadata: the existing simulation still owns displayed speaker names, dialogue and behavior. Review persona-to-model mapping before acceptance.

## Source and asset contract

The geometry is original programmatic work. It reuses the existing repository's `KitMesh` helpers in `../satire-kit/geometry.js`, backed by `MeshBuilder` in `../prop-details/models.js`. No character mesh, image, texture, font, voice, motion capture, commercial logo or remote asset service was imported. Existing helper attribution remains with those sources. No new third-party dependency or license claim is introduced. The current integration applied Ponytail: it reuses the existing geometry helpers, adds no runtime dependency, and keeps generated GLBs out of the shipped asset tree because the adapter does not load them.

Units are metres, Y-up, front +Z. The origin is the ground midpoint between the feet, not the bounding-box midpoint of a carried prop. Authored heights are approximately 1.83–2.14 m, with a uniform runtime scale of 0.82. Keep this scale consistent with the gait distance. Do not recenter individual limbs or props during export.

The rig is a deliberately **rigid-skinned articulated caricature**, not a smooth anatomical human. Each vertex has one full-weight bone influence. Shoulder/elbow/knee shapes conceal rigid joints. Props remain assigned to their hand bones. The exporter emits standard skin joints, weights and inverse bind matrices; no decoder extension, texture or DCC file is needed at runtime.

The four in-place clips are `Idle` (3 s), `Walk` (1.2 s), `Talk` (2 s), and `Gesture` (2.4 s). Walk uses two-link leg IK, alternating stance/swing and a 0.68 m authored cycle distance. The runtime advances walk phase from measured displacement, ignores teleport-sized jumps, blends back to idle at stops, and updates heading from movement. Each exported clip has 32 intervals plus an exact closure sample. This is not a mocap-retargeting or lip-sync claim.

`Talk` and the per-character `Gesture` are authored and exposed through `setMotion`, but they are **not yet connected to the game's live speaker events**. Do not invent a second dialogue system or trigger speech for every nearby mesh. See the handoff checklist before wiring these events.

## Integration and local use

Normal play makes no request for this pack. In the existing HTTP-served root game, add `?streetCharacters=1`. To inspect one archetype across eligible pedestrians, use `?streetCharacters=1&streetCharacter=kehrwoche`, substituting any catalog ID above.

The opt-in adapter changes only eligible ordinary NPC presentation. It retains original NPC state and interactions, protects all `special` characters, leaves player and police renderers alone, and keeps the original art on module/model failure. Nearby construction is bounded to two actors per sync; distant actors retain original artwork until approached. Templates share geometry and material, actors own their skeletons, and retired actors release their skeleton resources. Inspect counts with `window.Germany3D.inspectAssets().streetCharacters`.

From the repository root, using Node 22 or a compatible runtime:

```sh
node --test tests/street-characters.test.mjs
node tools/export-street-characters.mjs
```

The exporter writes only this pack's eight `.glb` files and `manifest.json`, with readback SHA-256 verification. Edit source, then re-export; do not hand-edit generated GLBs. Runtime geometry does not depend on those generated files being present.

## Verification evidence and limits

In the local integration worktree, `node --test` passed 228/228 tests, including 25/25 street-character checks. The exporter regenerated all eight GLBs deterministically (3,097,568 bytes total); the official Khronos glTF Validator reported zero errors and zero warnings for each. The pinned Three.js GLTFLoader imported all eight with one skinned primitive and the four named clips. A headless, `--mute-audio` Chrome pass loaded the default city, the opt-in street view, mobile city, secret Bürgeramt route, and `3d.html` without page errors or failed requests. The opt-in view reported live actors and shared templates; normal play did not instantiate this pack.

The generated GLBs and manifest were validation products only and are not checked in. The game uses the single editable geometry source through `runtime.js`. This is still **candidate-unapproved**: full per-character front/side/back visual review, long-session movement, route clearance, fallbacks, performance, and user acceptance remain open. `Talk`/`Gesture` are not connected to live dialogue. Keep the query gate until those checks and approval pass; see [`For-AI/STREET-CHARACTERS-CHECKLIST.md`](../../../For-AI/STREET-CHARACTERS-CHECKLIST.md).
