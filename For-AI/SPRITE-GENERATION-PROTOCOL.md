# Registered sprite generation protocol

This is the required production path for every moving bitmap character. It exists to prevent identity drift, clipped anatomy, cross-cell fragments, foot sliding, and the frame-to-frame shaking caused by independently centered renders.

## Authorities and outputs

- Authored key-pose sheets live once under `assets/sprite-sources/`. They are production sources, not runtime alternatives.
- The corresponding derived atlases at root `assets/` are the only files loaded by the game.
- `tools/build-sprite-transitions.py` is the single transition builder. It requires Python with Pillow plus local FFmpeg; neither is a runtime dependency.
- `tools/register-sprite-grid.py` is the generic contact-sheet registration step for new generated characters. It can isolate complete connected figures, reject cross-cell fragments, normalize raw proposal scale to a bounded ±3% range, center every cell, and establish one foot baseline before the transition build. This normalization is an ingestion repair only; an approved key sheet must never be rescaled frame by frame at runtime.
- `tools/verify-sprite-animation.py` plus `assets/sprite-sources/verification.json` is the critical commit gate. The manifest binds full-resolution visual approval to exact source/runtime SHA-256 hashes, so changing even one pixel invalidates the approval.
- `.githooks/pre-commit` runs the critical gate and sprite integration tests whenever a sprite, sprite tool, or sprite protocol is staged. This checkout uses `.githooks` through the repository-local `core.hooksPath` setting.
- `game.js` owns the semantic frame index and a staging canvas exposes the derived atlas to Three.js. Do not add renderer-specific frame offsets or a second runtime sheet.

Current authorities:

| Character | Key sheet | Key grid | Runtime grid | Rows |
| --- | --- | ---: | ---: | ---: |
| Angela Merkel | `assets/sprite-sources/merkel-sprite-keys.png` | 6 × 5 at 256 px | 24 × 5 at 128 px | front, left, right, back, front walk |
| Friedrich Merz | `assets/sprite-sources/border-pourer-sprite-keys.png` | 8 × 6 at 256 px | 32 × 6 at 128 px | front carry, right walk, side pour, left walk, back carry, front pour |
| Bayern walker | `assets/sprite-sources/bayern-walker-sprite-keys.png` | 8 × 4 at 256 px | 32 × 4 at 128 px | front, right, back, left |
| Alice Weidel satire | `assets/sprite-sources/alice-weidel-sprite-keys.png` | 8 × 2 at 256 px | 32 × 2 at 128 px | front/down, back/up |
| Ordinary crowd (8 types) | `assets/sprite-sources/crowd-*-keys.png` | 8 × 3 at 256 px | 32 × 3 at 128 px | side, front/down, back/up |

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

## Preferred layered limb rig

New characters should use a layered 2D cutout rig when the source art can be separated cleanly. Full-frame morphing remains a compatibility path for established painted sprites and complex effects, but it may only interpolate between approved anatomical keys; it must not be trusted to invent a hidden knee, foot, hand, or prop during an occlusion.

The canonical hierarchy and normalized anchors are:

| Part | Parent | Pivot/anchor | Rule |
| --- | --- | --- | --- |
| root | world | ground contact at `(0.50, 0.94)` | Translation authority; no visual wobble |
| pelvis | root | hip midpoint at `(0.50, 0.58)` | Skeleton root; produces the down/up weight arc |
| torso | pelvis | lower sternum at `(0.50, 0.48)` | Counter-rotates against the pelvis |
| head | torso | neck at `(0.50, 0.29)` | Remains level-ish; never independently recenters |
| upper arm L/R | torso | shoulder at `(0.36/0.64, 0.40)` | Swings opposite its same-side leg |
| forearm L/R | upper arm | elbow | Joint length is fixed; elbow does not invert |
| hand/prop L/R | forearm | wrist/grip | A prop remains bound to one grip for the full loop |
| thigh L/R | pelvis | hip at `(0.43/0.57, 0.58)` | Opposed sinusoidal swing; both sides never lead together |
| calf L/R | thigh | knee | Flexes during recovery, straightens into contact |
| foot L/R | calf | ankle/ball | Stance foot is pinned to the ground until toe-off |

Store pivots in normalized cell coordinates so a direction-specific rig can be reapplied at any source resolution. Each limb layer needs 6–10 px of hidden overlap under its parent to prevent holes during rotation. Front/back rigs must key layer order at the passing pose: the advancing leg and opposite arm move in front while the recovering pair moves behind. Use rotation keys for joints; reserve scale for a deliberate squash effect, never gait correction.

For a 32-sample loop, use `phase = 2π × frame / 32`. The two thighs are half a cycle apart; arms oppose the legs; pelvis vertical motion has two shallow peaks per loop. These curves are guides, not a substitute for contacts. During stance, solve the pelvis/root translation from the planted foot so the foot remains stationary in world space. The minimum keyed sequence remains contact → down → passing/crossing → up for the left side and then the right side.

`tools/mirror-lower-limbs.py` is the first repository implementation of this isolation strategy. It repaired the DIN inspector's back walk by retaining the exact head, torso, arms and hand-bound measuring prop while constructing the opposite gait half only from the registered lower-limb region. It is a narrow repair tool, not permission to mirror a complete character and accidentally swap a prop between hands.

This hierarchy follows the same production logic documented by [Godot's cutout-animation guide](https://docs.godotengine.org/en/stable/tutorials/animation/cutout_animation.html)—hip root, parent-relative rotations, explicit pivots, depth ordering and selective cel animation—and [Adobe's Bone tool guide](https://helpx.adobe.com/animate/desktop/animation/bone-tool-animation.html)—parent/child armatures, fixed bone length, constrained joints and interpolated poses. The hybrid is intentional: use a rig for coherent joints, and redraw/selectively replace hands, feet, faces or props when a flat rotation would look mechanical.

## Image-generation prompt contract

Use the existing registered key sheet as the visual reference and request one character only. A suitable prompt is:

> Preserve this exact character identity, face, clothing, proportions, rendering style, camera direction, and carried props. Produce discrete transparent 256×256 key-pose cells on a fixed anatomical registration: head center x=128, body midpoint y=128, common foot baseline and scale. For each walking direction include left contact, down, passing with the free leg visibly crossing the planted leg, up, right contact, down, opposite passing, and up. Keep one complete body per cell with at least 8 px transparent clearance. No cropped hair, duplicate heads, detached limbs, cross-cell pixels, text, background, grid lines, or camera movement.

Generation is only a source proposal. Inspect every cell at full resolution; reject repetitive strides, identity drift, clipping, extra anatomy, and frames that merely translate the whole character. Merz's repaired front-pouring row is the precedent: generated pixels were accepted only for an irrecoverable source row, while repetitive replacement walks were rejected.

Professional walk-cycle blocking starts from two sets of contact, down, passing and up poses. The [Animworks production guide](https://anim.works/walk-cycle/) uses a 24-frame neutral baseline, calls out planted-foot sliding, missing down poses, twinned limbs and jagged arcs, and recommends driving the motion from the hips. The game samples 32 runtime frames per new crowd direction—well above the requested 21-frame floor—because eight authored phases each own three in-betweens.

Motion compensation is smoothing, not anatomy. Research on [depth-aware frame interpolation](https://arxiv.org/abs/1904.00830) explicitly treats occlusion as a separate problem, and character-motion research identifies foot penetration and extreme body lean as visible physical-constraint failures ([Rempe et al.](https://arxiv.org/abs/2007.11678)). Therefore, no amount of optical flow can rescue missing contacts, wrong limb order, a changing silhouette identity, or a sliding planted foot; those defects require corrected keys or isolated-limb rigging.

## Build

The builder inserts three bidirectional motion-compensated in-betweens between every adjacent key pair, including the last-to-first seam. Authored keys remain exact interval boundaries before runtime downscaling.

```powershell
python tools/build-sprite-transitions.py assets/sprite-sources/merkel-sprite-keys.png assets/merkel-sprite.png --cols 6 --rows 5 --inbetweens 3 --audit-dir .sprite-audit/merkel
python tools/build-sprite-transitions.py assets/sprite-sources/border-pourer-sprite-keys.png assets/border-pourer-sprite.png --cols 8 --rows 6 --inbetweens 3 --audit-dir .sprite-audit/merz
python tools/build-sprite-transitions.py assets/sprite-sources/bayern-walker-sprite-keys.png assets/bayern-walker-sprite.png --cols 8 --rows 4 --inbetweens 3 --audit-dir .sprite-audit/bayern
python tools/build-sprite-transitions.py assets/sprite-sources/alice-weidel-sprite-keys.png assets/alice-weidel-sprite.png --cols 8 --rows 2 --inbetweens 3 --audit-dir .sprite-audit/alice
$names = 'bio-vegan','towel-man','towel-woman','waste-marshal','quiet-hours','cargo-parent','din-inspector','potato'
foreach ($name in $names) { python tools/build-sprite-transitions.py "assets/sprite-sources/crowd-$name-keys.png" "assets/crowd-$name.png" --cols 8 --rows 3 --inbetweens 3 --audit-dir ".sprite-audit/$name" }
```

When the column count grows by the transition factor, multiply the runtime frame clock by the same factor. This keeps physical walking speed and stride duration unchanged instead of playing the expanded atlas four times slower.

## Visual acceptance

The build's audit directory contains a full contact sheet, rapid GIF cycle, and color-coded onion overlay for every row. Review all three, then verify the game in desktop and mobile browser sizes.

Run `python tools/verify-sprite-animation.py --report output/sprite-quality-report.json` before staging a sprite. The gate verifies every current character together. It rejects unsigned or checksum-stale visual approval, fewer than 21 walk frames, changed/missing authored keys, clipped cells, detached fragments, duplicate poses, excessive body scale/area drift, off-center walk rows, weak lower-limb articulation, missing opposite-leg phases, large inter-frame jumps and a bad loop seam. `tests/sprite-pipeline.test.mjs` invokes the same gate, and the pre-commit hook runs it when relevant files are staged.

The automated score is necessary but cannot prove that an elbow bends the correct way or that a prop stayed in the same hand. Before updating a checksum in `verification.json`, a reviewer must inspect the 256 px key sheet, every generated row contact sheet, the rapid loop and onion overlay at full resolution. The reviewer signs all eight manifest checklist fields only after defects have been corrected and rebuilt.

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
3. Run `tools/register-sprite-grid.py --component-grid --normalize-scale` when the proposal is a regular contact sheet, then inspect and save one registered 256 px key sheet under `assets/sprite-sources/`.
4. Run the transition builder with three in-betweens and inspect all audit artifacts.
5. Add one runtime atlas entry, row mapping, and frame clock; do not add per-frame offsets.
6. Visually review the full-resolution audit, then add exact source/runtime hashes and the completed checklist sign-off to `assets/sprite-sources/verification.json`.
7. Run the critical gate and extend `tests/sprite-pipeline.test.mjs` with the source/runtime dimensions.
8. Browser-test desktop and mobile movement, the loop seam, interaction radius, and proximity-audio release/re-entry behavior.
9. Record generation/edit provenance and the final runtime checksum in `CREDITS.md`.
