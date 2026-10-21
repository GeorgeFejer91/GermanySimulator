# Heike Hoffmann registered neutral source mouth pilot

Candidate source only. No runtime mouth definition, action-pose registration, atlas, or motion acceptance is supplied here.

## Exact source and method

| File | SHA-256 |
| --- | --- |
| `registered-cardinals-v3-candidate.png` | `bfe0660b663a96ac545dfa3da55e37851b16a64a95cb60d9eff66855915badfc` |
| `registered-quarters-v3-candidate.png` | `d15436d552353fa0c91f8c16e95f790785e90645067e3d50c3a21bfe4585605f` |
| `source-registration-v3.json` | `2077f71af5ae6ce6ac11c0e895c1a202dc31bd761d8a9039448df76f4e605d79` |
| Original `assets/sprite-sources/street-quiz/heike-hoffmann-keys.png` | `fae6498e2a8b81b149f514c9c815ea586e64424b2f41ac22c40cbb52cab39605` |
| Own original cardinal input subset `mouth-source-v1/own-original-mouth-inputs-v1.json` | `69cb36d3d1f37a2bdcc2cdbd17e5fe4ac6edbbae55e0a3d11076bb0258b17afe` |
| Historical global fit origin `assets/sprite-sources/street-mouths/registration.json` (provenance only) | `482488f8160f5092050a78ffaf5663282cf5f43f1a5d50742235baabb5d3b84d` |
| Existing connected-lip helper `tools/build-street-mouths.py` | `da45773cfd1195df275186aba6efe8332c4ba704187710e3a26f5874997d88a8` |
| This `fit-source-mouths.py` | `459e63dc1d576f3a4610684a84da005bc851d64ca874b196b1faf5196a3423d9` |
| `source-mouth-profiles-v1.json` | `e9c6494a177788b6edbf00547cdd0a9e78afecf9a21eff85b4dad16f88db4fb7` |

The two registered sheets are 2048 × 512 RGBA. The original four cardinals occupy 512-pixel columns down/right/up/left; quarters occupy front-right/rear-right/rear-left/front-left. The profile JSON records whole-sheet pixel coordinates, exact image hashes and dimensions, 512 × 512 cell crops/origins, local tangent and normal axes, joined five-knot contours, source cavity and allowed opening boundaries, width response, tooth exposure, and compiled profile values. The three original own cardinal crease fits are packaged in the Heike-only input subset and mapped through the v3 `scale` and `workingOrigin`; the two quarter fits are measured on their actual registered 512-pixel paintings. The fitter no longer reads the historical global registration. No other character's anatomy is used.

Packaging comparison: ignored `output/ambient-city-animation/heike-source-mouths-v1/packaging-comparison-v1.json` records exact equality against the prior candidate (`6e886eae…faa7`) for each visible view's input identity, crop, center, axes, contours, width, teeth, compiled rect/profile, CPU checks, and all three null decisions. Only input provenance changed. The same source-cue and runtime limits below remain open.

## Actual source observations

| View | Native 512-pixel observation and fit | Source pilot verdict |
| --- | --- | --- |
| down | Continuous closed, slightly downturned crease; no painted cavity or teeth. The red upper ridge remains skin/lip paint. | PASS candidate |
| front-right | Own asymmetric closed line, more exposed screen-right lip; distinct 50-pixel corner span, not a reused front line. | PASS candidate |
| right | Small profile crease attached into the face silhouette; restrained opening avoids the nose and transparent edge. | PASS candidate |
| rear-right | Painted rear-quarter head shows no visible lips. | PASS explicit null |
| up | Painted rear head shows no visible lips. | PASS explicit null |
| rear-left | Painted rear-quarter head shows no visible lips. | PASS explicit null |
| left | Own 21-pixel closed profile crease, preserved downturn and face edge. | PASS candidate |
| front-left | Own closed quarter crease slopes toward screen-right; no cavity/teeth. | PASS candidate |

Reviewed `output/ambient-city-animation/heike-source-mouths-v1/<view>-grid10x.png`, `<view>-light.png`, `<view>-dark.png`, and `<view>-all-cues-{light,dark}.png` for all five visible views at enlarged native detail. CPU inactive and owned-closed samples are exact source pixels because each painting is already closed, and each open sample shows a single connected dark aperture with original corners, cheek/jaw support and no visible nose/eye displacement in these crops. Alpha is pixel-identical to the original 512-pixel cell for every cue. The JSON records per-view changed RGB counts; inactive and owned-closed are zero, while open/rounded/bite approximations change visible pixels. Rounded and bite-contact samples use simplified target contours; the helper fixes horizontal width to one and lacks the runtime bite/contact cue. Thus these two images show candidate anatomy only, not the runtime viseme result. Teeth remain zero rather than manufacturing a tooth bar.

## Remaining gates

- **NOT RUN:** Transport center and both axes through Heike's actual moving source fields; fit distinct action/gesture sources that show other lip paint, register every encoded atlas cell, and inspect forward/return intervals plus loop seams. These five neutral source profiles alone cannot establish moving-mouth attachment.
- **NOT RUN:** Actual GPU connected-lip rendering, rounded width response, bite-contact behavior, positive outside-lip transport through all cues, native recorded-media playhead, pause/end/cancel/replay/fallback, distant game-size readability, desktop/mobile visual rendering, physical device checks, and full browser playability.
- **NOT RUN:** Root integrator's world/physics and camera/scale specialist review. This subtask does not alter world movement, rendering or deployed assets.
- **FAIL:** None in this bounded neutral-source CPU pilot. Candidate approval remains limited to the inspected source pixels; the listed gates remain open.

No runtime registration was changed, and this worker did not commit or push.
