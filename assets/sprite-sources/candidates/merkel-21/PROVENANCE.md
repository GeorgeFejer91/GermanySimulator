# Merkel 21-point candidate provenance

Status: preview-only, unapproved candidate.

Generated on 2026-09-22 with the built-in OpenAI ImageGen tool. The accepted
archived Merkel key sheet was the identity and proportion authority; the
existing Merkel part sheet was a texture and outline reference. The generated
PNG sheets are proposals consumed only by the offline candidate builder.

## Prompt contract

Each direction requested one transparent 4 × 2 sheet in this exact phase
order: contact A, loading A, passing A, push-off A, contact B, loading B,
passing B, push-off B.

The prompts required the same compact, slightly chubby Merkel caricature,
fixed head/shoulder/pelvis/ground registration, direct head-to-shoulder
connection, short anatomically plausible legs, planted-foot support, visible
passing crossover, restrained arm counter-swing, and unchanged face, hair,
jacket, palette, outline, lighting, scale, and crop. They explicitly excluded
long necks, narrow torsos, elongated legs, thin arms, detached joints, motion
blur, quiver, duplicate limbs, backgrounds, labels, text, and watermarks.

- `raw/left-keys-generated.png` uses the archived left-facing row and is not a
  mirror of the right sheet.
- `raw/right-keys-generated.png` uses the archived right-facing row.
- `raw/front-keys-generated.png` uses the archived front/down walking row and
  declares the near/far crossing requirement.
- `raw/back-keys-generated.png` uses the archived back/up walking row and
  declares the near/far crossing requirement.

Exact raw and derived SHA-256 values are regenerated into `manifest.json`.
`tools/build-merkel-21-candidate.py` takes the immutable direction-specific
head and central-torso plate directly from the archived accepted sheet,
removes the corresponding generated pixels, interpolates only the remaining
local motion layer, and emits ordinary PNG evidence.
`tools/verify-merkel-21-candidate.py` is the fail-closed candidate gate.
Neither file has authority to update the game loader.
