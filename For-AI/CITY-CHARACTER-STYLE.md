# Open-city character style and proportions

The user's **2026-10-22 direction supersedes the 2026-10-14 short-body,
large-head direction**. The active goal covers **all relevant 2D sprites walking
on the street**, including police, crowd pedestrians, roaming quiz speakers,
named passersby, street-rule advisers and outdoor JWD neighbors. Use **Söder,
Herr Sandale and Frau Sandale** as the actual height and limb-proportion
references. The user explicitly corrected the politician's name to Söder.

The requested visual direction is **Disco Elysium meets Berlin**, or Grand Theft
Amt as if made by the creators of Disco Elysium: mature, weathered, painterly
adult cartoon characters. Preserve distinct identities, outfits, moods and
props. This is an active redesign goal, not a claim that existing sprites have
already been replaced or visually accepted.

The user's follow-up explicitly pushes **the rest of the characters further
toward Disco Elysium too**. This applies to residents, quiz speakers, advisers,
outdoor neighbors, politicians and the Sandales as well as every police tier.
The existing rounded, smoothly shaded source studies establish proportions
only; they do not set the final finish. Redraw faces and garment planes with
angular, expressive shapes, tired asymmetrical features, broad dry-brush marks
and muted petrol, dirty ochre, wine and cool gray-green shadows. A fine speckle
filter over the old toy-like volumes does not satisfy this direction. Keep
each actor recognizable and preserve age, equipment and owned props.

The player remains an articulated 3D model. Interior-only cast is outside this
street redesign. Police keep the existing male/female equipment tiers and
action ownership described in [the asset policy](./ASSET-POLICY.md#street-character-movement).
The active implementation and acceptance checklist is
[the street redesign record](../docs/engineering/STREET-CHARACTER-REDESIGN.md).

## Reference authority

Compare actual source and encoded pixels before commissioning a new family:

- The selected manifests and `character-atlas.png` masters in
  `assets/characters/bayern/`, `assets/tourists/towelMan/` and
  `assets/tourists/towelWoman/` own Söder and the Sandales' actual city
  identity, neutral prop hands and movement. Compare their selected neutral
  cells before authoring. The current offline rig key sheets differ from these
  accepted masters: Söder has one wrapped food item in his right hand, and both
  Sandales hold their roll in their right hand. Do not promote an experimental
  sheet's extra food or opposite-hand prop into the redesign.
- `assets/sprite-sources/neighbors/directions.png`: Heiko, Inga and Schwabingen
  identity in front, right and rear views; retain Inga's coherent face. These
  existing exports do not override the new shared proportion direction.
- `assets/sprite-sources/neighbors/theodore-directions.png`: child Hartmut
  Maaslos's own family, with the existing child scale and stable actor identity.
- `assets/characters/merkel/` and
  `assets/characters/borderPourer/`: their manifests locate the accepted city
  atlases, cells and pivots. Use neutral direction cells for proportion checks.
- `assets/quiz-characters/<id>.webp`: quiz face, hair, expression, outfit and
  prop identity, with useful mature expressionist face cues. These waist-up
  portraits cannot establish full-body height or limb lengths.

## Shared appearance

Match adult stature and connected head, torso, arm, thigh and shin proportions
to the actual Söder and Sandale references. Compare both equal-height anatomy
and actual runtime height at the same camera distance; enlarging a short figure
does not fix its limb proportions. Establish measurements from the reference
pixels before choosing ratios. The old two-to-two-and-a-half-head target is
retired.

Give adults grown-up, somewhat worn features: individual facial structure,
age lines, tired eyes, asymmetry, lived-in clothing and believable hands and
shoes. Use expressive painted texture, broken brushwork and subdued Berlin
street colors, with silhouettes and faces readable at gameplay size. Police
belong to this same mature painted population, with readable uniforms and
equipment. Keep 2D animation and satirical character; avoid baby-faced,
toy-like, glossy or uniformly cute treatment. These are implementation cues
for the requested direction, not a license to erase individual identity.

Keep these proportions through front/profile/rear views, walking contacts,
turns, gestures, speech and answer reactions. Use one figure scale and ground
pivot per family. Preserve authored airborne displacement. Do not independently
fit each cell, stretch a whole sheet, enlarge a detached head patch, or shorten
only the rendered vertical axis. Revise connected source artwork first.

Keep registered adult fallback and loaded paint on the same ground pivot and
nominal figure height. Upright street and police billboards follow camera yaw;
camera pitch must not shorten the body on admission. Fit only actor-owned visual
geometry and reuse the existing caches and lease owners. Shared Sandale atlases,
the articulated player, deliberate child scale, movement and collision remain
separate owners. Temporary neutral silhouettes are not finished identity art.

For intermediate turns, compare the character's own cardinal references at a
shared sole-to-crown height. Keep crown-to-chin height, neck, torso and leg
lengths coherent through the turn; the head must not become smaller as the body
rotates. The approximate population range above does not waive a visible change
within one character. Register physical left/right parts against each view:
front and rear screen sides exchange their anatomical ownership. Preserve that
mapping for trousers, shoes, hands and held objects instead of mirroring paint.

At matched camera distance and a shared ground line, ordinary adults must read
as one population alongside Söder and the Sandales. Preserve deliberate
height differences, including child Hartmut Maaslos's existing scale (stable
actor `jwd-theodore`, voice ID `jwd-theodore-maaslos`). Hartmut Keller
(`quiz-hartmut-keller`) is a separate adult character. The renderer's
world height, collision body, ground pivot and camera projection remain separate
contracts: a shorter painted body must not silently change legal routes or
collision clearance. Record any actual world-scale change and run its reviews.

## Source and final-export gate

Before expanding a family, show its neutral front/profile/rear and action
extremes beside Söder and the Sandales at equal figure height, then at actual
runtime scale on one ground line. Record head, shoulder, hip, elbow, knee and
sole bounds to diagnose mismatches; measurements support visual judgment.
Reject residual squat/chibi proportions, anatomy inconsistent with the
references, disconnected or rubbery limbs, tiny shoes, changed identity and
faces that lose their mature worn character. Previously rejected source
experiments remain unapproved; reassess actual pixels against this new direction
rather than silently promoting old candidates.

Follow [the sprite protocol](./SPRITE-GENERATION-PROTOCOL.md) and
`animate-2d-characters` for connected motion, source-bound mouths, all encoded
frames, light/dark composites and ordered playback. Inspect actual open-city
desktop and mobile-emulation renders beside existing actors, including depth,
feet, approach, waiting, answer reactions and return to walking. Source sheets
and numeric checks alone do not approve runtime style. Keep unproved anatomy,
motion, voice listening and physical-device coverage explicitly outstanding.

Use the existing [asset policy](./ASSET-POLICY.md#browser-playability-gate),
admission queue and teardown owner. Distinct art does not authorize eager
downloads of the full cast, extra animation clocks or a second runtime tree.
