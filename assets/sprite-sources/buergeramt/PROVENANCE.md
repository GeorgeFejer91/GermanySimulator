# Bürgeramt caricature cast

Four transparent RGBA source strips were generated with OpenAI's built-in
ImageGen on 2026-10-06 for Germany Simulator. The art direction was an
original, over-the-top Berlin bureaucracy caricature: stained oil/gouache
texture, heavy expressions, absurd document props, and a grimy civic palette.
No real person's photograph, external character painting, or named artist's
artwork was supplied as a source. Source prompts specified the same cast
identity across each strip's four proposals.

`office-props-source.png` was generated in the same session, using the
clerk source only as a palette and brushwork reference. It contains four
original isolated props: a file cabinet, stamped paper stack, distorted
clock, and overloaded noticeboard. The unmodified source is retained here;
`assets/buergeramt/office-props.webp` is its WebP transcode for four
in-scene billboards. Text is rendered separately in the game.

| Source | Subject | Runtime use |
| --- | --- | --- |
| `clerk-source.png` | Severe older clerk, heavy stamp and spectacles | Frau Knick at Schalter 3; duplicated distant desk staff |
| `renter-source.png` | Anxious tenant with oversized dossier | Waiting-room visitor |
| `parent-source.png` | Tired parent clutching forms and bag | Waiting-room visitor |
| `pensioner-source.png` | Suspicious pensioner with cap, cane and papers | Waiting-room visitor |

The exact source and output hashes are in
`assets/buergeramt/characters/build-report.json`. Each source is an unchanged
1536 × 1024 generated strip. The first figure is the identity-locked idle
source. The other painted figures are candidate action keys; they have not
been promoted to a motion sequence. `tools/build-amt-sprites.py` removes
disconnected strip fragments, scales the selected pose once into a transparent
cell, and evaluates continuous slow sway/breath motion across 64 frames. It
exports the desktop and mobile WebP atlases with clear cell gutters.

Pillow, NumPy, and OpenCV are authoring dependencies only; the static game
loads only the resulting WebPs. The source images and script are sufficient
to rebuild the exact cast without the external ChatDev checkout. See
`For-AI/SPRITE-GENERATION-PROTOCOL.md` for visual acceptance rules.

## Moving office regulars

OpenAI ImageGen generated six additional original 1536 × 1024 sheets on
2026-10-06. The accepted clerk and renter sources were supplied as brushwork,
proportion, and palette references. No external game sprite, photograph, or
named artist painting was used. Each `*-source.png` carries one identity in
front, right, back, and left views against temporary magenta; each
`*-action.png` carries two full-body paperwork poses with generated alpha.

| Source pair | Identity and action |
| --- | --- |
| `aktenkurier-*` | Gaunt file courier in a long charcoal coat, carrying a document stack and red stamp. |
| `archivbotin-*` | Compact older archive keeper with dark bob, red glasses, ledger, and keys. |
| `formularsammler-*` | Stooped applicant in a worn teal suit, russet scarf, and accordion form. |

`tools/amt-character-motion.py` removes only exterior magenta, retains the
source alpha, registers the six poses per identity at one scale, and creates
connected, subtle walk frames by warping the whole painted silhouette. The
segmented-leg attempt detached a side-view shoe and was discarded. Registered
transparent poses remain in the three named subdirectories. Derived 8 × 6
desktop/mobile WebPs are the only new runtime media. Exact source, atlas, and
encoded-cell hashes are in the local
`output/amt-character-motion/interaction-build-report.json`; contact sheets
there are review aids. The source sheets and builder, without the ChatDev
checkout, are sufficient to regenerate the shipped assets.

## Crowded office and event poses (2026-10-07)

OpenAI's built-in ImageGen generated five further original front/right/back/
left source strips and matching four-pose action strips. The existing three
walkers received two-pose reaction strips for looking up and recoiling. These
sources use the earlier office cast as a palette/proportion reference. No
photograph, named artist's painting, or existing game sprite was supplied.
They remain editable sources in this directory; the derived atlases in
`assets/buergeramt/characters/` are the only runtime media.

| Source family | Character and held prop |
| --- | --- |
| `nummernfluesterer-*` | Bleached-haired Berlin night regular with ticket and clear folder. |
| `nachtschichtmelderin-*` | Teal-haired shift worker with dead phone and documents. |
| `pfandarchitektin-*` | Mustard-coated applicant with binders and receipt tail. |
| `kopiependler-*` | Bicycle courier in a burgundy vest with helmet and copies. |
| `warteschlangenpoetin-*` | Copper-braided applicant in a blue blazer with numbered paper. |

`*-source.png` is a four-view turnaround, `*-action.png` supplies work,
gesture, look, and flinch for the five new people; `*-reaction.png` supplies
look and flinch for the prior three. The eight registered transparent poses
for each actor live in its named subdirectory. The builder emits 8 × 8
atlases at 320 × 416 desktop and 160 × 208 mobile per cell, with encoded
gutter and frame signatures in its local report. The existing `clerk-source.png`
also supplies Frau Knick's six-row desk-performance atlas. Its mouth motion
is derived from source pixels and speech timing, not a separate generated face.

These assets follow the event-to-motion beat contract in
`.agents/skills/animate-2d-characters/references/narrative-action-rigging.md`.
It describes movement, action ownership, dialogue, lighting, sound, and
return-to-route; the assets themselves carry no gameplay state.
