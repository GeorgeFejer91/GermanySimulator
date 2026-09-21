# Sprite generation and cutout-rig protocol

This is the production contract for every atlas-backed moving character in
Germany Simulator. The runtime remains deliberately simple: it samples a PNG
atlas. Rigging, inverse kinematics, joint stitching, and quality checks happen
offline and add no browser dependency.

## Authorities

- `assets/sprite-sources/rigs/registry.json` defines the six rigs, row meanings,
  source paths, prop behavior, and the universal frame contract.
- `assets/sprite-sources/rigs/<id>/parts.png` is the high-resolution source art:
  side, front, and back cutout pieces with alpha.
- `tools/build-rigged-sprite-atlas.py` is the canonical renderer. It emits both
  the 8-key review atlas and all 32 direct runtime poses for each row.
- `assets/sprite-sources/*-keys.png` are reviewable 256 px key atlases sampled at
  phases 0, 4, 8, 12, 16, 20, 24, and 28. They are derived, not hand-morphed.
- `assets/*.png` is the only runtime asset authority: 32 columns at 128 px.
- `assets/sprite-sources/rigs/pose-audit.json` records the exact root, hip,
  knee, ankle, stance/swing, facing, and travel sign used for every final atlas
  cell. Its source/runtime hashes make the record one-to-one rather than an
  illustrative guide.
- `tools/verify-sprite-animation.py` plus
  `assets/sprite-sources/verification.json` is the release gate. The ledger
  binds the parts sheet, key atlas, and runtime atlas to exact SHA-256 hashes.
- `assets/sprite-archive/pre-rig-20260921/` retains the replaced pre-rig assets
  and their checksum manifest. Do not use that tree at runtime.

## Current grid

| Character | Rows | Row contract |
| --- | ---: | --- |
| Merkel | 5 | front idle, left, right, back/up, front/down |
| Merz border pourer | 6 | front carry, right, right pour, left, back carry, front pour |
| Bayern/Söder kebab walker | 4 | front/down, right, back/up, left |
| Alice Weidel satire | 2 | front/down, back/up |
| Towel man | 3 | side/right, front/down, back/up |
| Towel woman | 3 | side/right, front/down, back/up |

Every key cell is 256×256. Every runtime cell is 128×128. Every runtime row
has 32 frames; no moving row may fall below 21. Left-only rows are rendered by
mirroring a registered right-facing side rig, never by mixing inconsistent
source poses.

## Source-art contract

Image generation is allowed only for source proposals. The accepted built-in
ImageGen prompts and character-specific clauses are recorded in
`assets/sprite-sources/rigs/PROVENANCE.md`. A proposed sheet must have genuine
alpha and exactly three unlabelled horizontal views: side facing right, front,
and back. Each view must offer the following isolated pieces in order:

1. head with neck overlap;
2. torso plus pelvis;
3. left upper arm;
4. left forearm plus hand;
5. right upper arm;
6. right forearm plus hand;
7. left thigh;
8. left calf;
9. left foot;
10. right thigh;
11. right calf;
12. right foot;
13. prop A;
14. prop B.

Use neutral limbs, consistent scale and lighting, rounded hidden material at
every joint, and generous transparent separation. Reject backgrounds, halos,
shadows, assembled figures, text, grid lines, duplicates, missing anatomy,
cropping, identity drift, costume drift, incorrect props, and decorative
fragments. A transparent-looking colored wash is still a rejection.

Generated art is not accepted merely because it parses. Inspect face,
silhouette, clothing, props, all three views, alpha edges, and each piece at
full resolution. The rejected Merz/towel pilot is the precedent: structurally
valid but semantically wrong is still wrong.

## Rig and gait mechanics

The builder extracts fourteen horizontal part groups from each view and uses a
single 512 px working grid. Heads and torsos are rigid and registered to one
midpoint; they never cross-fade or morph. Arms and legs rotate about actual
piece pivots. Bone lengths are intentionally shorter than painted parts so
rounded overlap remains hidden throughout the arc.

Legs use an analytic two-bone IK solve. At contact, the leading foot is planted;
during that half-cycle it travels opposite the character's screen-space motion
as the torso passes over it. The other foot is airborne and advances in the
same direction as the character. Reversing those signs is a moonwalk and must
fail the gate. Right-facing side rows use positive x, mirrored left rows use
negative x, front/down rows use positive y depth, and back/up rows use negative
y depth. Front/back swing feet cross the body midpoint at passing while the
stance foot remains on its anatomical side. Arms counter-swing against the legs
unless a prop contract fixes them into a carry, flag, towel, diamond, or pour
pose.

The rig root, torso x position, and ground registration are fixed for the full
row. Never center or rescale a frame from its changing silhouette: a lifted
foot, wide flag, or bucket would move the whole character and create vibration.
The loaded down pose lowers the pelvis, passing returns it to neutral, and the
up pose raises it while the output registration remains unchanged.

Vertical rows additionally keep each knee below its own hip and materially
above its own ankle, keep left/right ankles on their anatomical sides, and
bound knee bow from the hip-to-ankle centerline. Lift height is limited by the
shorter calf source, so a compact rig cannot fold its ankle sideways into the
knee. If a right-facing runtime row is mirrored for left travel, the gate must
verify and render that exact mirrored final result as a separate movement arc.

The 32-frame cycle is:

| Phase | Frames | Required read |
| --- | --- | --- |
| contact | 0, 16 | opposite feet at the stride extremes |
| down | 4, 20 | loaded stance leg, lowered pelvis |
| passing | 8, 24 | legs overlap/cross under the torso |
| up | 12, 28 | swing foot clears and pelvis rises |

Frames 0 and 16 must be opposite contacts, not duplicates. Frame 31 must flow
into frame 0 without a seam jump. The builder renders every frame from the rig;
it does not optical-flow or dissolve between complete character images.

Generated joint openings are handled in two layers. Registered under-paint
bridges and caps cover shoulders, elbows, hips, knees, ankles, neck, and prop
grips. A final deterministic stitch may connect only a nearby small component;
anything more than 64 working pixels from the registered body is rejected as
missing or misplaced anatomy. This stitch is not permission to accept a bad
parts sheet.

## Build

From the repository root:

```powershell
python tools/build-rigged-sprite-atlas.py --preview-dir assets/sprite-sources/rigs/previews
python tools/verify-sprite-animation.py --report .codex/sprite-rig-report.json --overlay-dir .codex/sprite-direction-overlays
node --test tests/sprite-pipeline.test.mjs
```

Use `--only <id>` while iterating. A complete release bake must run without
`--only`, followed by verification of every character. The builder uses Pillow,
NumPy, and SciPy only in production; these are not browser dependencies.

## Critical verification gate

Do not update the signed hashes until all deterministic and visual checks pass.
The gate rejects:

- missing or changed parts/key/runtime files;
- stale or incomplete visual sign-off;
- non-RGBA runtime output, hidden RGB under alpha zero, or missing antialiasing;
- fewer than 21 walking frames;
- a derived key that does not match its exact runtime boundary;
- empty, clipped, off-center, or scale-inconsistent cells;
- detached limbs, props, or fragments;
- repeated key poses or excessive adjacent-frame jumps;
- weak lower-limb change or indistinct opposite-leg phases;
- a loop seam larger than ordinary internal transitions.
- a stance foot that travels with the movement direction or a swing foot that
  travels against it;
- a side/front/back row whose signed movement axis disagrees with its row name;
- any final-atlas hip, knee, or ankle that misses its audited rendered pixels;
- an incomplete/stale pose audit or fewer than 32 one-to-one frame records.
- a vertical knee/ankle order inversion, collapsed knee pair, excessive knee
  bow, or left/right ankle inversion;
- an unverified mirrored-left runtime arc when no separate left row exists.

The reviewer must then inspect, at full resolution:

1. the three-view parts sheet;
2. all eight key phases for every row;
3. the generated final-atlas overlay containing all 32 frames, with cyan/pink
   limb chains, green planted ankles, yellow swing ankles, and the white travel
   arrow, plus a rapid 32-frame loop;
4. head and torso registration with no vibration;
5. alternating contact, down, passing/crossing, and up poses;
6. planted stance feet and lifted swing feet;
7. elbow, knee, ankle, neck, and prop-grip continuity;
8. stable image size, baseline, clear background, face, clothing, and props;
9. desktop and mobile browser playtests at real runtime scale.

Only after those checks may the reviewer write the new `rigSha256`,
`sourceSha256`, and `runtimeSha256` values and set `visualStatus` to `pass`.
Any later pixel or source change invalidates the approval.

## Adding a character

1. Produce and visually approve a three-view fourteen-part source sheet.
2. Store it once at `assets/sprite-sources/rigs/<id>/parts.png` and record its
   generation/edit provenance.
3. Add one registry entry with row meanings and the smallest existing prop mode
   that fits. Extend the renderer only when a genuinely new pose contract is
   required.
4. Bake the character with `--only <id>` and inspect the preview.
5. Fix source art, anchors, or the rig; never hand-paint around a failed gate in
   the runtime atlas.
6. Run the complete bake and complete verification gate.
7. Update runtime atlas dimensions/cache versions and their tests if the row
   contract changed.
8. Sign exact hashes only after visual review.
9. Archive replaced production assets with a checksum manifest before copying
   new files over live paths.

Keep one runtime tree. Do not introduce a second deployable sprite copy,
runtime skeleton library, Blender runtime, SVG DOM animation, or per-character
loader. Blender/COA, OpenToonz, or Godot may be used as optional authoring tools
later, but must export into this same 32-frame PNG contract.
