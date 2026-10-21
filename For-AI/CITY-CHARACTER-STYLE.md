# Open-city character style and proportions

The user's 2026-10-14 painted-character direction applies to roaming quiz
speakers, named passersby, the crowd, street-rule
advisers, the Sandales and the JWD neighbors. Use the same short, large-headed
painted miniature family as Heiko Maaslos, Inga Maaslos, Merkel, Söder and Merz.
Distinct faces, outfits, moods and props identify people within that family.

The player remains an articulated 3D model. The user's later police paint request
uses this miniature family; [the asset policy](./ASSET-POLICY.md#street-character-movement)
owns the current rendering, loading and movement exceptions.

## Reference authority

Compare actual source and encoded pixels before commissioning a new family:

- `assets/sprite-sources/neighbors/directions.png`: Heiko, Inga and Schwabingen
  in front, right and rear views; retain Inga's current coherent face.
- `assets/sprite-sources/neighbors/theodore-directions.png`: child Hartmut
  Maaslos's own family, with the existing child scale and stable actor identity.
- `assets/characters/merkel/`, `assets/characters/bayern/` and
  `assets/characters/borderPourer/`: their manifests locate the accepted city
  atlases, cells and pivots. Use neutral direction cells for proportion checks.
- `assets/sprite-sources/crowd-towel-man-keys.png` and
  `assets/sprite-sources/crowd-towel-woman-keys.png`: Sandale identity, clothes,
  short limbs, substantial footwear and towel ownership.
- `assets/quiz-characters/<id>.webp`: quiz face, hair, expression, outfit and
  prop identity. These waist-up expressionist dossier portraits do **not**
  authorize realistic full-body proportions or a different city painting style.

## Shared appearance

Keep an oversized expressive head, short neck, compact torso, short substantial
arms and legs, readable hands and broad complete shoes. The neutral adult
silhouette is approximately two to two-and-a-half head heights, judged against
the actual references; hair, hats and individual caricature affect that ratio.
Do not lengthen the shins or shrink the head to fit a realistic adult skeleton.
Use coherent softly painted volume, restrained warm shading, clear dark contour
and readable clothing shapes matching the established city miniatures. Preserve
the character's own age and demeanor; a large head does not make every adult
look like a child or give everyone the same face.

Keep these proportions through front/profile/rear views, walking contacts,
turns, gestures, speech and answer reactions. Use one figure scale and ground
pivot per family. Preserve authored airborne displacement. Do not independently
fit each cell, stretch a whole sheet, enlarge a detached head patch, or shorten
only the rendered vertical axis. Revise connected source artwork first.

For intermediate turns, compare the character's own cardinal references at a
shared sole-to-crown height. Keep crown-to-chin height, neck, torso and leg
lengths coherent through the turn; the head must not become smaller as the body
rotates. The approximate population range above does not waive a visible change
within one character. Register physical left/right parts against each view:
front and rear screen sides exchange their anatomical ownership. Preserve that
mapping for trousers, shoes, hands and held objects instead of mirroring paint.

At matched camera distance and a shared ground line, ordinary adults must read
as one population alongside the five named references. Preserve deliberate
height differences, including child Hartmut Maaslos's existing scale (stable
actor `jwd-theodore`, voice ID `jwd-theodore-maaslos`). Hartmut Keller
(`quiz-hartmut-keller`) is a separate adult character. The renderer's
world height, collision body, ground pivot and camera projection remain separate
contracts: a shorter painted body must not silently change legal routes or
collision clearance. Record any actual world-scale change and run its reviews.

## Source and final-export gate

Before expanding a family, show its neutral front/profile/rear and action
extremes beside the established references at equal figure height. Record head,
torso, hip, knee and sole bounds to diagnose mismatches; measurements support
visual judgment. Reject tall realistic figures, small heads, thin elongated
legs, tiny shoes, changed identity and a painting style that looks imported
from another game. The initial realistic street-quiz source experiments were
rejected under this direction and are not runtime artwork.

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
