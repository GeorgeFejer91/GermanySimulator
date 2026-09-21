# Registered sprite generation protocol

This is the required production path for every moving bitmap character. It exists to prevent identity drift, clipped anatomy, cross-cell fragments, foot sliding, and the frame-to-frame shaking caused by independently centered renders.

## Authorities and outputs

- Authored key-pose sheets live once under `assets/sprite-sources/`. They are production sources, not runtime alternatives.
- The corresponding derived atlases at root `assets/` are the only files loaded by the game.
- `tools/build-sprite-transitions.py` is the single transition builder. It requires Python with Pillow plus local FFmpeg; neither is a runtime dependency.
- `tools/register-sprite-grid.py` is the generic contact-sheet registration step for new generated characters. It crops each proposed pose, applies one shared scale per row, centers the row on the cell axis, and fixes every foot baseline before the transition build.
- `game.js` owns the semantic frame index and a staging canvas exposes the derived atlas to Three.js. Do not add renderer-specific frame offsets or a second runtime sheet.

Current authorities:

| Character | Key sheet | Key grid | Runtime grid | Rows |
| --- | --- | ---: | ---: | ---: |
| Angela Merkel | `assets/sprite-sources/merkel-sprite-keys.png` | 6 × 5 at 256 px | 24 × 5 at 128 px | front, left, right, back, front walk |
| Friedrich Merz | `assets/sprite-sources/border-pourer-sprite-keys.png` | 8 × 6 at 256 px | 32 × 6 at 128 px | front carry, right walk, side pour, left walk, back carry, front pour |
| Bayern walker | `assets/sprite-sources/bayern-walker-sprite-keys.png` | 8 × 4 at 256 px | 32 × 4 at 128 px | front, right, back, left |
| Alice Weidel satire | `assets/sprite-sources/alice-weidel-sprite-keys.png` | 8 × 2 at 256 px | 32 × 2 at 128 px | front/down, back/up |

The 256 px source cells retain facial and costume detail. The 128 px runtime cells stay near one source pixel per displayed pixel while keeping all derived sheets within a 4096 px texture width for mobile/WebGL compatibility. Runtime PNGs retain full RGBA; premultiplied-alpha downscaling and zeroed fully transparent RGB prevent dark or colored fringes. The staging canvas and Three.js texture both use smooth linear sampling.

## Fixed anatomical grid

Every authored pose owns exactly one transparent 256 × 256 cell.

- Registration origin: `(128, 128)`.
- Head center: `x = 128`, tolerance ±2 px.
- Torso/body midpoint: `y = 128`, tolerance ±3 px.
- Foot baseline: choose one baseline per row and keep planted feet within ±2 px of it.
- Scale: choose one head height and body height per row; do not resize individual gait phases to fit.
- Safety margin: at least 8 transparent source pixels around hair, shoes, carried props, and action effects. The builder rejects less than 4 px.
- Cell ownership is hard: no hair, head fragment, shoe, bucket, water, or shadow may cross a cell edge.
- Align the anatomy, not the alpha bounding box. Buckets, swinging arms, and water are allowed to change the silhouette without moving the head/torso origin.

The character may bob by one or two pixels as a deliberate gait accent only when the head and torso return symmetrically on the opposite step. Do not use global frame translation to imitate a step.

## Walking key poses

A new side-view walk should author eight keys in this cyclic order:

1. left contact: left heel forward, right toe behind;
2. left down: weight over the left foot;
3. left passing: right leg bends and crosses the planted left leg;
4. left up: right knee leads before extension;
5. right contact: mirror of pose 1;
6. right down: weight over the right foot;
7. right passing: left leg bends and crosses the planted right leg;
8. right up: left knee leads before the loop seam.

Front/back rows use the same phases with depth overlap: the passing foot crosses the body centerline and changes occlusion order. Arms counter-swing against the leading leg. Carried props remain attached to the same hand and may lag slightly, but the skull and torso origin remain fixed.

Six keys are the minimum for a legacy character only when they still contain both contact poses and both leg-crossing passing poses. Idle or blink frames do not replace a gait phase.

## Image-generation prompt contract

Use the existing registered key sheet as the visual reference and request one character only. A suitable prompt is:

> Preserve this exact character identity, face, clothing, proportions, rendering style, camera direction, and carried props. Produce discrete transparent 256×256 key-pose cells on a fixed anatomical registration: head center x=128, body midpoint y=128, common foot baseline and scale. For each walking direction include left contact, down, passing with the free leg visibly crossing the planted leg, up, right contact, down, opposite passing, and up. Keep one complete body per cell with at least 8 px transparent clearance. No cropped hair, duplicate heads, detached limbs, cross-cell pixels, text, background, grid lines, or camera movement.

Generation is only a source proposal. Inspect every cell at full resolution; reject repetitive strides, identity drift, clipping, extra anatomy, and frames that merely translate the whole character. Merz's repaired front-pouring row is the precedent: generated pixels were accepted only for an irrecoverable source row, while repetitive replacement walks were rejected.

## Build

The builder inserts three bidirectional motion-compensated in-betweens between every adjacent key pair, including the last-to-first seam. Authored keys remain exact interval boundaries before runtime downscaling.

```powershell
python tools/build-sprite-transitions.py assets/sprite-sources/merkel-sprite-keys.png assets/merkel-sprite.png --cols 6 --rows 5 --inbetweens 3 --audit-dir .sprite-audit/merkel
python tools/build-sprite-transitions.py assets/sprite-sources/border-pourer-sprite-keys.png assets/border-pourer-sprite.png --cols 8 --rows 6 --inbetweens 3 --audit-dir .sprite-audit/merz
python tools/build-sprite-transitions.py assets/sprite-sources/bayern-walker-sprite-keys.png assets/bayern-walker-sprite.png --cols 8 --rows 4 --inbetweens 3 --audit-dir .sprite-audit/bayern
python tools/build-sprite-transitions.py assets/sprite-sources/alice-weidel-sprite-keys.png assets/alice-weidel-sprite.png --cols 8 --rows 2 --inbetweens 3 --audit-dir .sprite-audit/alice
```

When the column count grows by the transition factor, multiply the runtime frame clock by the same factor. This keeps physical walking speed and stride duration unchanged instead of playing the expanded atlas four times slower.

## Visual acceptance

The build's audit directory contains a full contact sheet, rapid GIF cycle, and color-coded onion overlay for every row. Review all three, then verify the game in desktop and mobile browser sizes.

Run `python tools/verify-sprite-atlas.py <runtime.png> --cols <runtime-cols> --rows <rows>` for each built atlas. The verifier rejects a non-RGBA delivery, dirty RGB behind zero alpha, missing antialiased edges, empty or edge-touching cells, and excessive row center drift. `tests/sprite-pipeline.test.mjs` runs this check for every current character.

- A rapid cycle must read as contact → compression → leg crossing → extension → opposite contact, with no held or reversed transition.
- In the onion overlay, head and torso contours form one narrow registered band while legs and arms fan through their intended motion.
- The loop seam must be as smooth as every internal transition.
- Hair, faces, and costume edges must not pulse in scale or jump sideways.
- Merz must retain complete scalp clearance and must never show a detached head below the character.
- Fully transparent pixels must have zero RGB, partially transparent edges must remain antialiased, and runtime rendering must not dilate or replace authored alpha.
- Compare display scale by visible body height rather than raw cell size. Every registered character uses the same foot anchor and a per-atlas draw scale that keeps body height consistent without per-frame offsets.
- The browser console and asset network log must be clean; Three.js must show the derived sheet on desktop and mobile.

Run `node --test tests/sprite-pipeline.test.mjs tests/denglisch-dialogue-sprites.test.mjs` after any source, atlas, grid, frame-rate, or loader change.

## Adding a character

1. Define row semantics and the runtime movement state before generating art.
2. Generate or draw the required contact/down/passing/up key poses.
3. Run `tools/register-sprite-grid.py` when the proposal is a regular contact sheet, then inspect and save one registered 256 px key sheet under `assets/sprite-sources/`.
4. Run the transition builder with three in-betweens and inspect all audit artifacts.
5. Add one runtime atlas entry, row mapping, and frame clock; do not add per-frame offsets.
6. Extend `tests/sprite-pipeline.test.mjs` with the source/runtime dimensions.
7. Browser-test desktop and mobile movement, the loop seam, interaction radius, and proximity-audio release/re-entry behavior.
8. Record generation/edit provenance and the final runtime checksum in `CREDITS.md`.
