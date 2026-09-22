# Rig source provenance

The six `*/parts.png` files were generated with OpenAI's built-in ImageGen on
2026-09-21. Each generation used the character's archived/registered key sheet
as an identity and style reference. No external model or downloaded artwork is
embedded. Generated sheets are production source material, not runtime files.

The common prompt contract requested a high-resolution transparent PNG with
three rows (`SIDE RIGHT-FACING`, `FRONT`, `BACK`) and fourteen isolated pieces
per row in this order: head, torso/pelvis, left upper arm, left forearm/hand,
right upper arm, right forearm/hand, left thigh, left calf, left foot, right
thigh, right calf, right foot, prop A, prop B. It required neutral limbs,
consistent scale, rounded joint overlap, generous transparent gaps, the
existing painterly outline style, genuine alpha, and no assembled figures,
labels, grid, background, shadows, duplicates, crop, or watermark.

Identity/prop clauses used for each accepted source:

- `merkel`: exact Merkel face/hair, blue blazer and dark trousers; black handbag
  and diamond-hand accessory were requested. The renderer ignores the proposed
  handbag and uses only the diamond gesture for the established idle pose.
- `merz`: exact Merz face, glasses, receding hair and navy suit; black bucket
  and watering can; explicit exclusion of towel and tourist hat.
- `bayern`: the established suited Bayern/Söder-style kebab walker identity;
  food and napkin props.
- `alice`: angry Alice Weidel caricature, blue suit, clenched hands and two
  isolated German flags.
- `towel-man`: established moustached tourist, blue polo, tan shorts, white
  socks, sandals, rolled blue/yellow towel and hat.
- `towel-woman`: established grumpy tourist, coral top, beige shorts,
  socks-and-sandals, rolled red/white towel and visor/hair accessory. A targeted
  edit removed the rejected red/brown background wash without changing parts.
  The accepted sheet omitted the second forearm and contained one accidental
  duplicate shoe. Its registry `partIndexes` therefore reuses the woman's own
  identity-matched painted forearm for the paired arm and omits only that
  duplicate shoe; no part from another character is introduced.

The first Merz-like pilot with inherited towel/hat props was rejected and is
not in the repository. `tools/build-rigged-sprite-atlas.py` deterministically
extracts and renders only the accepted sheets recorded here.

## Biomechanical gait proposal

On 2026-09-22, OpenAI's built-in ImageGen produced the educational reference
at `assets/sprite-sources/reference/biomechanical-gait-proposal.png` (SHA-256
`a6cc1b28257b34753e489ec07acb04e401ef33d64ce0c5cad6a00c5c68d40497`).
It was generated from text only; none of its depicted people or pixels are used
in a runtime character.

Prompt/mode: create a high-resolution scientific educational sprite-animation
reference on a transparent background, arranged as a clean eight-phase gait
grid for side, front, and back views; show contact, loading, passing, and
push-off for both alternating legs; make stance lock, swing toe clearance,
pelvis bob, leg crossover, and opposite arm swing visually explicit; use a
neutral generic adult mannequin, consistent proportions/scale/root/ground
line, no character identity, no props, no text, no crop, and no duplicate or
missing anatomy. Mode was new image generation with no referenced image.

The proposal guided terminology and visual review only. Production motion is
the deterministic `eight-phase-double-support-v1` coefficient model in
`tools/build-rigged-sprite-atlas.py`, with one signed joint audit per final
cell. The proposal is not an anatomical or pixel authority and cannot bypass
the numerical and frame-overlay verification gate.
