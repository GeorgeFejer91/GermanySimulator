# Identity-Locked Sprite Animation Protocol

This is the production contract for every atlas-backed moving character in
Germany Simulator. The original image-generated pose cells are the visual
authority. Runtime animation may schedule, mirror, and uniformly scale whole
approved cells; it may not redraw the face, rebuild the body from alternate
parts, morph between full figures, or recenter individual frames.

The system adopts the useful parts of the owner-authored Einhornsammler
continuity method: fixed frame boxes, a fixed ground offset, immutable visual
endpoints, readable whole-body phases, and contact-sheet review of the exact
runtime output. Germany Simulator adds a per-cell source hash so one-to-one
identity is mechanically provable.

## Authorities

- `assets/sprite-sources/rigs/registry.json` defines source/runtime paths, row
  meanings, direction exposure, key counts, and the fixed 256/128/32 grid.
- `assets/sprite-sources/*-keys.png` are the original authored key atlases.
  These are inputs, not derivative review images.
- `tools/build-identity-locked-sprite-atlas.py` is the canonical builder.
- `assets/sprite-sources/identity-audit.json` maps every final runtime cell to
  one source key and records both source and runtime pixel hashes.
- `assets/sprite-sources/verification.json` is the signed release ledger.
- `tools/verify-sprite-animation.py` is the hard automated release gate.
- `tools/build-rigged-sprite-atlas.py` and the part sheets under
  `assets/sprite-sources/rigs/*/parts.png` are retained only as experimental,
  recoverable material. They are not production authorities.
- `assets/sprite-archive/pre-rig-20260921/` preserves the earlier generated
  source/runtime set. `assets/sprite-archive/pre-identity-lock-20260922/`
  preserves the replaced cutout-rig production assets and ledgers.

There is one runtime tree: `assets/*.png`. Archives are never loaded by the
game and must not become a second deployable runtime.

## Frame contract

Every runtime atlas uses:

- 128 × 128 transparent RGBA cells;
- 32 cells per row, exceeding the 21-cell runtime minimum;
- a fixed cell midpoint and ground baseline;
- no per-frame crop, normalization, registration, or silhouette recentering;
- balanced holds of complete authored keys across the 32-cell clock;
- premultiplied-alpha downscaling from the 256 × 256 source cell;
- runtime row selection that follows the registered direction contract.

Eight-key characters hold each authored pose for four runtime cells. Merkel's
original six-key sequence is distributed across 32 cells in balanced five- or
six-cell holds. These are deliberate animation exposures, not invented visual
in-betweens. The game may advance the 32-cell clock at different rates, while
the character pixels remain exactly those of an authored source pose.

This is the same practical choice used by many conventional eight-frame walk
cycles: stability and clear contact/passing phases take priority over a larger
number of synthetic but anatomically unreliable pictures.

## Matrix-interpolated limb authoring lane

The Affect Tracker pattern is approved for future limb-rig authoring, with one
important distinction: interpolate a compact anatomical parameter vector, not
finished sprite pixels. Its transition matrix and its face interpolation are
separate ideas. The matrix selects an ordered route through known states; the
renderer evaluates coefficients between those states.

For a walking character, use one cyclic phase lane per view direction. A
preferred eight-anchor lane is:

```text
left contact -> left down -> left passing -> left up ->
right contact -> right down -> right passing -> right up -> repeat
```

Each anchor stores the same named coefficient vector: root and pelvis position,
pelvis/torso/head rotation, both shoulder/elbow/wrist chains, both
hip/knee/ankle chains, hand/prop anchors, planted-foot identity, and limb depth
order. Generate the 32 delivered cells by sampling between adjacent anchors
with eased shortest-angle interpolation. An authored anchor must be reproduced
exactly at its phase; interpolation may never average two whole RGBA figures.

The following constraints are mandatory:

1. A planted foot is a positional constraint. Solve root/pelvis compensation so
   that foot remains fixed until toe-off; do not merely interpolate its screen
   coordinates and create foot sliding.
2. Joint angles may interpolate continuously, but planted-foot identity and
   front/back limb ordering are discrete events. Swap depth only at the declared
   crossing phase so a leg cannot dissolve through the other leg.
3. Front, back, left, and right remain separate directional lanes. Never blend
   a front bitmap into a back bitmap. Diagonal support, if added later, must be
   a reviewed rig-space projection with its own anchors.
4. The cell midpoint, ground line, head box, render scale, and transparent
   background remain constant for all samples.
5. Every generated sample must retain identity-matched layered artwork from the
   same character. A rig assembled from another generation or a reconstructed
   face is not an in-between.
6. At every anchor phase, the rendered rig must pass a one-to-one overlay
   comparison against its approved authored pose. Between anchors, the gate
   must check joint limits, bone lengths, planted-foot drift, silhouette scale,
   alpha cleanliness, and forward travel direction.

This is analogous to the Affect Tracker's 21 x 21 coefficient cache: states may
be pre-sampled for deterministic runtime playback, while the compact rig
parameters remain the authoring authority. It is not analogous to crossfading
four photographs. Whole-image blending creates double legs and ghosted faces
and is forbidden for production walking cycles.

Existing shipped characters remain on the whole-pose identity-locked lane
until an identity-matched layered rig and its anchor overlay evidence exist.
The rejected cutout-rig archive is not automatically eligible merely because
this authoring lane exists.

## Direction contract

Row names are semantic runtime authority:

- `front-*` faces the viewer and is used while moving down-screen;
- `back-*` faces away and is used while moving up-screen;
- `right-*` moves right;
- `left-*` moves left;
- a registered `{ "mirror": "right-walk" }` exposes the exact mirrored
  right-facing source for left travel when no authored left row exists.

Do not reverse the cell order to change direction. Direction comes from the
authored row or a whole-cell horizontal mirror. Reversing a gait phase makes a
planted foot appear to slide backwards.

## Identity and registration invariants

For every authored key and every delivered runtime frame:

1. The complete head, torso, hands, props, legs, and feet stay inside the cell.
2. Transparent pixels contain no hidden RGB and visible edges remain
   antialiased.
3. The top/head line, ground contact, silhouette scale, and horizontal root
   stay within the signed thresholds.
4. Walking rows contain visibly different lower-limb and opposite-leg phases.
5. Every final runtime frame names exactly one source key.
6. Re-downscaling that source key must produce pixel-identical final output.
7. The audit's source and runtime pixel hashes must match.
8. Every source key must appear in the 32-frame runtime sequence.

Because the complete approved pose is copied as a unit, a runtime frame cannot
gain a second head, lose the top of Merz's head, detach a limb, or change a
face without also changing a signed source/hash and failing the gate.

## Build and review

From the repository root:

```powershell
python tools/build-identity-locked-sprite-atlas.py --preview-dir output/sprite-identity-review
python tools/verify-sprite-animation.py --report output/sprite-identity-report.json --overlay-dir output/sprite-final-contact-sheets
node --test tests/sprite-pipeline.test.mjs
```

The builder does not sign its own output. After a build, a reviewer must inspect
all generated contact sheets at full resolution and confirm, row by row:

1. left/right/up/down facing matches the row name;
2. the same person, clothing, carried objects, proportions, and rendering style
   persist through the cycle;
3. head and feet remain registered to their fixed grid references;
4. the legs visibly alternate and pass/cross as intended;
5. there is no cropped anatomy, duplicate anatomy, double exposure, or alpha
   debris;
6. the last exposure returns cleanly to the first;
7. mirrored left exposure, where declared, is the exact whole-cell mirror.

Only then update the hashes, date, reviewer, and `visualStatus: "pass"` in
`assets/sprite-sources/verification.json`. Any subsequent pixel or mapping
change invalidates that approval automatically.

## One-time migration and recovery

The 2026-09-22 migration was performed with:

```powershell
python tools/build-identity-locked-sprite-atlas.py `
  --archive-current-to assets/sprite-archive/pre-identity-lock-20260922 `
  --restore-originals-from assets/sprite-archive/pre-rig-20260921
```

Do not repeat the migration against a non-empty archive. For normal rebuilds,
omit both migration flags.

## Adding a character

1. Produce one transparent authored key atlas on the 256 px fixed grid.
2. Include at least six readable poses per row; eight is preferred.
3. Supply front and back rows for vertical movement and authored side rows or a
   declared whole-cell mirror for horizontal movement.
4. Register the source/runtime paths, rows, walk rows, key count, and direction
   contract once in `registry.json`.
5. Build the atlas and identity audit.
6. Run the hard gate and inspect every final contact sheet.
7. Sign exact hashes only after visual approval.
8. Update the runtime cache key and tests when dimensions or assets change.

Do not use ImageGen to create unsupervised in-between frames. If genuinely new
poses are required, author them as new source keys, review them as the same
character, and then rebuild the identity-locked runtime.
