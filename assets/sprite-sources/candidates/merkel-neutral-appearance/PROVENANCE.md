# Merkel appearance key from a neutral motion guide

One left-facing **unapproved still**, generated with built-in ImageGen on
2026-09-27. It is neither pixel-identical to the original nor a temporally
verified animation. Stable in-game sprites and previous candidates are intact.

Reference order and the complete generation prompt are retained in `PROMPT.md`:

1. `original-left.png`: unmodified 256-square cell cropped at
   `[256,256,512,512]` from the archived original Merkel key sheet.
2. `../../reference/neutral-walk/pose-left.png`: the shared neutral rig's first
   left-facing contact pose, used for gesture only.

`appearance-key.png` is the unmodified 1254 × 1254 RGBA ImageGen output,
originally saved as `exec-890f6ae1-1c01-4d58-bc4b-f7d4037e6e1b.png`.
`manifest.json` binds the crop, full original sheet, neutral pose, prompt and
generated image by SHA-256. The neutral pipeline never loads this character art.

The original sprite outranks the guide for head shape, head-to-body ratio,
compact/full build, neck connection, costume and drawing style. The mannequin
provides contact phase and opposing limb gestures, not a silhouette mask or
texture-projection surface. This supersedes that constraint of the older
`merkel-painted-left` experiment, which remains selectable for comparison.

Review alongside the original in `sprite-preview.html?source=neutral`. Playback
controls animate the separate grey guide only. Approval of this single key
does not approve an entire walk: a future character-specific fixed appearance
binding must still pass all-frame likeness, motion, foot contact, occlusion and
loop-consistency review before anything can enter the game.
