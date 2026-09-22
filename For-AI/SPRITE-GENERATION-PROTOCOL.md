# Biomechanical Sprite Animation Protocol

This is the production contract for every atlas-backed moving character in
Germany Simulator. All six characters use one deterministic articulated gait,
one fixed registration grid, and one signed verification gate. The browser
still receives ordinary PNG atlases; the rig, ImageGen sources, SciPy, and
Pillow remain offline production tools.

The previous whole-pose hold lane (`authored-key-hold-v1`) is superseded by
`biomechanical-rig-v3`. Its assets remain recoverable under
`assets/sprite-archive/pre-identity-lock-20260922/`. The original generated
pose sheets remain under `assets/sprite-archive/pre-rig-20260921/` as immutable
identity references, not as a second runtime tree.

## Authorities

- `assets/sprite-sources/rigs/registry.json` defines the 512/256/128 grid,
  rows, directions, props, and shared gait contract.
- `assets/sprite-sources/rigs/*/parts.png` are the accepted identity-matched
  layered source sheets.
- `tools/build-rigged-sprite-atlas.py` is the sole production builder.
- `assets/sprite-sources/*-keys.png` contain the eight reviewed biomechanical
  phases emitted by that builder.
- `assets/sprite-sources/rigs/pose-audit.json` records every root, hip, knee,
  ankle, stance/swing state, travel sign, and phase for every final cell.
- `tools/verify-sprite-animation.py` is the hard release gate and contact-sheet
  renderer.
- `assets/sprite-sources/verification.json` is the signed hash ledger.
- `assets/*.png` is the only runtime atlas authority.

## Fixed grid and phase clock

Every character is authored on a 512 × 512 working cell, reviewed through
eight 256 × 256 key cells, and shipped as 32 direct 128 × 128 RGBA cells per
row. The cell midpoint, pelvis root, ground line, render scale, head plate, and
torso plate are fixed. Directional source parts are normalized once per
character before frame evaluation so head, torso, and bone scale do not jump
between front, back, and side rows. Never crop, normalize, or recenter
individual frames.

The eight anchors are:

```text
0  contact A      4  loading A      8  passing A      12 push-off A
16 contact B      20 loading B      24 passing B      28 push-off B
```

Each four-cell interval is evaluated by bounded cyclic Catmull-Rom sampling of
anatomical coefficients. Whole character pixels are never blended. Frames
0/4/8/12/16/20/24/28 reproduce the eight source keys one-to-one; the other 24
cells are independent rig evaluations with the same identity layers.

## Shared biomechanical mechanism

The gait vector stores pelvis height and, for each leg, forward displacement,
toe lift, and discrete stance ownership.

1. Contact begins in double support with the new stance foot ahead of the
   pelvis and the previous foot behind it.
2. Loading lowers the pelvis slightly while the stance foot stays on the
   ground.
3. Passing places the swing ankle at the body midpoint with maximum toe
   clearance; this is the visible leg-crossing phase.
4. Push-off places the stance foot behind the pelvis while the swing foot moves
   ahead.
5. At the opposite contact, stance ownership swaps and the cycle repeats.
6. Arms counter-swing unless a prop contract fixes them to a carried object.

Side views use fixed-length two-bone IK. Front/back views solve the same gait
in a vertical/depth plane and project it orthographically. Depth is compressed
to keep limbs readable, and the projected knee must retain at least six
runtime pixels above/below its neighboring joints. That screen-space safeguard
does not stretch the spatial bone; it prevents a valid bone aimed at the camera
from disappearing in a small sprite.

The stance foot has zero lift and its forward coefficient moves monotonically
backward relative to the pelvis. The swing foot moves monotonically forward
and reaches positive toe clearance. Reversing the frame clock to change travel
direction is forbidden because it creates moonwalking.

## Direction contract

- `front-*`: faces the viewer and moves down-screen.
- `back-*`: faces away and moves up-screen.
- `right-*`: faces and moves right.
- `left-*`: faces and moves left.
- `{ "mirror": "right-walk" }`: exposes the exact horizontal mirror for left
  travel when a character has only one side rig.

Front, back, and side use separately generated identity-matched parts. Never
blend a front bitmap into a back bitmap. Mirroring is allowed only where the
registry explicitly declares it.

## Runtime phase rule

Runtime animation advances from actual ground distance, not elapsed time.
`advanceSpriteGait` maps accumulated movement distance onto the 32-cell clock.
A blocked or paused character therefore stops its feet. Faster characters,
including Alice at 1.5× standard speed, complete the same physical stride in
less time without changing gait anatomy.

## Identity and composition rules

1. Head and torso are rigid plates from the same accepted part sheet in every
   frame. They may follow the bounded pelvis bob but may not morph.
2. The chin/head-bottom anchor meets the shoulder line within eight working-grid
   pixels in every frame. The shared fullness and compact-limb correction is
   part of the established caricature silhouette; do not reintroduce a tall
   neck or narrow, elongated body.
3. Limbs rotate from stable shoulder/hip sockets. Both legs render behind the
   torso/pelvis so registration sockets cannot cover clothing.
4. Rounded joint bridges and caps cover authoring sockets; exposed orange or
   silver registration marks are a failure.
5. Props use declared anchors. Flags, towels, food, bucket, watering can, and
   Merkel's diamond pose must not pull the root or head registration.
6. Every body part, hat, head, prop, foot, and antialiased edge stays inside
   the transparent cell safety margin. Transparent pixels contain zero RGB.
7. Source art from one character may never be reused to reconstruct another.
8. A shared gait normalization may use a deterministic character-wide identity
   calibration when the archived reference has deliberately non-generic
   caricature proportions. Measure it against corresponding directional cells,
   apply it to every frame in that view, and verify crown, shoulder, jacket,
   hip, and shoe bounds in the desktop and mobile preview. Per-frame fixes are
   still forbidden. Merkel's accepted front/side/back outer silhouettes match
   the archived reference within two pixels per axis at the reviewed anchors.

## Automated release gate

Run from the repository root:

```powershell
python tools/build-rigged-sprite-atlas.py --preview-dir output/sprite-biomechanical-preview
python tools/verify-sprite-animation.py --allow-unsigned `
  --report output/sprite-biomechanical-report.json `
  --overlay-dir output/sprite-biomechanical-overlays
```

The unsigned pass must succeed before review. It verifies:

- exact 8-key to 32-cell correspondence at the named anchors;
- 32 distinct final poses in every current walk row (hard minimum 28);
- fixed cell/root/head registration and complete transparent margins;
- chin-to-shoulder connection and direction-consistent compact proportions;
- discrete alternating stance ownership and double-support contacts;
- zero stance lift and positive passing toe clearance;
- monotonic stance/swing travel, correct forward direction, and no moonwalk;
- side stride separation and front/back near/far depth ordering;
- both passing-leg crossovers;
- bounded bone projection, joint-to-pixel coverage, and loop seam;
- every registered row/direction, including mirrored-left exposure.

The overlay contact sheets draw cyan/orange hip-knee-ankle graphs and a green
root directly over all final cells. A reviewer must inspect every row at full
resolution and reject cropped heads, disconnected limbs, joint flashes,
identity changes, backward steps, foot sliding, depth inversions, or uncanny
front/back collapse. The reviewer then updates all hashes/date/status in
`verification.json`; the ordinary signed command must pass afterward:

```powershell
python tools/verify-sprite-animation.py `
  --report output/sprite-biomechanical-report-signed.json `
  --overlay-dir output/sprite-biomechanical-overlays
node --test tests/sprite-pipeline.test.mjs
```

Any later part, key, runtime, identity reference, registry, or audit change
invalidates the signed gate.

## Adding a character

1. Create one identity reference sheet with front, back, and side views.
2. Use built-in ImageGen to create a transparent three-row, fourteen-part
   sheet in the exact order documented in `rigs/PROVENANCE.md`.
3. Inspect alpha, identity, clothing, props, anatomy, and all pieces before
   registration. Record prompt, date, tool, reference, and checksum.
4. Register parts/source/runtime/identity paths, semantic rows, prop mode,
   walk rows, and direction exposure once in `registry.json`.
5. Build all 32 samples. Never author runtime-only exceptions by hand.
6. Run the unsigned gate and inspect every overlay.
7. Correct the rig or source sheet until every mechanical and visual check
   passes; never lower a threshold merely to admit a visible defect.
8. Sign exact hashes, run the signed gate and full tests, then bump the runtime
   asset cache token.

The retained ImageGen gait proposal at
`assets/sprite-sources/reference/biomechanical-gait-proposal.png` is an
educational visual reference only. The coefficient model, rig audit, and final
overlay inspection are production authority.

## Browser preview sandbox

`sprite-preview.html` is the standalone browser inspection surface for the
production walking atlases. It reads this registry directly, shows every
authored direction for all six characters on transparent checkerboards, and
keeps every view on the same 32-frame clock. Pause, single-frame stepping,
scrubbing, and speed selection support visual review on desktop and mobile.
It does not load `game.js`, `world3d.js`, audio, or the game world, and it does
not copy or redefine any sprite asset or direction mapping.
