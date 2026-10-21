# Hannelore neutral mouth sources v1

SOURCE-only candidate, pending independent lip review. This packet fits seven actual visible neutral mouths and the separate published standing image. `up` is explicitly null because the actual rear head shows no lips. Accepted neutral registration/body scale is unchanged; separate complete side-leg registration remains HOLD. Nothing here approves walking, gestures, changing-pose mouth transport, runtime admission or audio.

`input-pins.json` binds12 actual images: the eight accepted512×512 neutral PNGs, own original128×160 standing, and three upstream painted masters. The preparation helper checks every byte hash and dimension before and after and stops on changed input. It uses no global manifest or shared dirty motion-spec dependency. `profiles.json` also identifies the actual upstream master/hash for each fit and the own accepted neutral receipt as calibration provenance.

The original standing is separately traced on `assets/characters/street/stadt-hannelore-sparkasse-standing.webp`, SHA256 `10f00a68ec8e46e62be8beeb3dcc0e4818e3a8ae657844f48b04992d0b83272e`; its coordinates are not scaled from the neutral painting. The neutral mouths refer to the exact images in the sibling `neutral-source-v1/` folder.

## Actual source observations and fitting

All eight fitted images show a closed red/dark lip crease, with no exposed teeth or confirmed pre-open cavity. Each crease/corner trace and tangent/normal frame was authored from that input's enlarged actual pixels. Source upper/lower contours equal that painting's own closed crease. Proposed opening limits are restrained local upper/lower displacement inside its visible lip/jaw region; they do not claim a painted source cavity or newly visible far-side anatomy. Teeth and horizontal width style are0. Upper guards protect actual nose/upper-face rows.

The two rear-quarter torsos do **not** imply hidden lips: their heads expose a short near-side lip. Both receive their own short profile fit. The visible outer silhouette ends the source lip at one end; the far corner remains hidden and is not fabricated. Source closure stays identical, opening remains inside original alpha, and no face-silhouette expansion is made. Initial proposed heading-based suppression was corrected before final fitting; only genuinely hidden `up` remains null.

| Input | Native crease endpoints | Max upper/lower local displacement | Protected rows y< |
|---|---|---:|---:|
| down512 | [246.5,216.5] → [284.5,216.7] | .75/3.2px |207|
| front-right512 | [281.5,216.5] → [305,215.4] | .7/2.9px |204|
| right512 | [298.5,212.6] → [316,210.2] | .55/2.4px |201|
| rear-right512 | [305.5,213.6] → [316.7,209.5] | .35/1.8px |201|
| rear-left512 | [188.4,209.5] → [198,214.2] | .3/1.55px |201|
| left512 | [190,208.7] → [212,212.3] | .55/2.3px |200|
| front-left512 | [211,213.1] → [242.2,215.3] | .8/3.15px |203|
| own standing128×160 | [61.5,62.4] → [69.6,62.5] | .2/.75px |59|

Each five-point crease retains its own asymmetry/downturn; full coordinates, physical axes and source bindings are in `profiles.json`. `compiled.json` contains normalized CELL bottom-left UV rects, physical CELL-pixel axes and shared connected-lip profiles. These are static authoring outputs, not runtime external definitions.

## Reproduce and inspect

From the repository root in the existing Python/Pillow/NumPy/SciPy environment:

```powershell
python assets/sprite-sources/resident-motion/stadt-hannelore-sparkasse/mouth-source-v1/fit-neutral-mouths.py
& C:/Users/cogpsy-vrlab/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe output/ambient-city-animation/hannelore-sparkasse-neutral-mouths-v1/validate-profiles.mjs
```

The helper reuses existing `tools/build-street-mouths.py` compilation/CPU preview and `tools/build-street-character-sprites.py` premultiplied source export without editing either. Renate's local helper supplied mechanics only; none of Renate's lip coordinates, profiles, source images or paint calibration is reused. `inspect-inputs.py` and ignored pixel-crop scripts are the initial own pixel-inspection aids; the fitting helper uses the frozen `input-pins.json` rather than repinning.

Review output: `output/ambient-city-animation/hannelore-sparkasse-neutral-mouths-v1/`.

- `*-face-{clean,grid}.png`, `*-lip-{clean,grid}.png`: enlarged actual input pixels used for the traces. Rear images remain available so visibility can be judged directly.
- `<heading>-{light,dark}.png`: actual source, annotated own contours, owned zero, max scalar-open CPU panels. The legend identifies the source boundary as a closed crease, not a source cavity.
- `native-crops/all-mouth-crops-{light,dark}.png`: all seven neutral fits plus separate standing, source/zero/max comparison. Individual full native RGBA source/closed/open PNGs are retained.
- `direct-paint137-96x120/` and `direct-paint137-64x80/`: all seven direct source/closed/open cells and enlarged face-crop comparisons on both backgrounds, including grouped `all-mouth-crops-{light,dark}.png`.
- `checks.json`, `direct-size-registrations.json`, `schema-validation.json`, `pins-before.json`, `pins-after.json`, `packet-index.json`: bounded numerical evidence and hashes.

Direct exports use Hannelore's independently accepted paint137 calibration, hence102.75 at96×120 and68.5 at64×80. The unchanged logical136/world1.6/128×160 pivot[64,150] contract is distinct. Full source-to-cell transformation transports both fitted axes and contours through this exact uniform export, not a guessed new mouth center. It is **not** transport through a walking, turn or gesture deformation.

## Bounded evidence and limits

All12 input images remain exact before/after. All8 native and14 direct-size owned-zero images equal their source RGBA exactly. All22 max-open images retain source alpha exactly; all declared native and transformed direct upper-face guards remain unchanged. The actual shared JS `validateStreetMouthRegistration` validates22 non-null profiles, including the shared connected-lip validator; `up` remains null.

Author inspected all8 native source/zero/max comparisons and all14 direct-size comparisons on light/dark backgrounds. Native creases and proposed openings stay connected to their own visible corners without a detached cavity or invented tooth bar. This is the author's source-fit observation, not independent art/GPU acceptance.

Direct96×120 max openings change8–44pixels;64×80 changes3–17pixels. The short rear-left mouth changes only3pixels at64×80, and both rear-quarter openings are difficult to distinguish at native compact size. The source aperture was not enlarged to force visibility. Game-camera speech readability, shader parity and eventual delivery quality remain unproved.

NOT RUN: round/spread/bite cue components (only scalar0/1 offline previews), final lossy atlas, real shader/GPU, media ownership/timing, current standing runtime, walking/stop/turn/gesture mouth transport, physical device or listening. No generation, body repaint, canonical/runtime/audio/shared registration/Git changes were made. Next gate is independent source lip/guard review on these exact inputs; moving-pose work waits for accepted own body sources and their real deformation fields.
