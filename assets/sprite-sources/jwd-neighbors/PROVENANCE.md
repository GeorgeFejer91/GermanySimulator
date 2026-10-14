# JWD neighbor authoring candidates

OpenAI's built-in ImageGen produced these fictional four-view, closed-rest
source sheets on 2026-10-13 for Frau Fink, Prof. Heiko Maaslos and his wife
Inga Maaslos. The costume and prop briefs come from the existing game and the
user's character instructions. Private reference photos and original voice
audio are not included here. No likeness approval is recorded for these new
painted designs.

Each v2 PNG is 1536 × 1024 with front, right, rear and left views. Inga retains
her briefcase in her anatomical left hand; Fink's broom stays in her anatomical
right hand; Heiko has empty hands. Matte repairs were performed with ImageGen
and inspected on light/dark composites. The rejected v1 working inputs are
retained locally rather than shipped as alternate game assets.

| Source | SHA-256 |
| --- | --- |
| `inga-maaslos-source-v2.png` | `0da6e5529ef32019d1435fff579fae2cc0025a24e7c8bd8b944cd0376cf0bc26` |
| `heiko-maaslos-source-v2.png` | `87e8d5f27d63daab2c54e07a5ebfe1381bf8d679e5f6caf747b27929ac6102b2` |
| `fink-source-v2.png` | `9aa831293f8833605274dea8afb842c32718f08af82949a7f49e6d78b3d9ccfb` |

The v2 generation receipts are respectively
`exec-2eb5a0e7-bb8f-43d2-9e6c-5fdb35eeb511`,
`exec-d36c3402-b6e9-409e-8a95-7c6f6c653d61` and
`exec-9a06132c-d8f2-4f10-9cbe-06987ce0a935` in this task's local generated-image
archive. Their v1 input hashes are respectively `16e51c6facf1a48b7e1754b51c5114a7da6d8f0f5ca229331b0d1559fcc53182`,
`8acb59e434dd5a6732fb0c6fcd4e9e1624152f0c209f19afa35de1495dff8818`
and `320016304481111e524b4a0009668fd80513efa0ef50c87bb14198df42074a7e`.

`source-registration.json` records measured whole-figure crops, one scale and
ground pivot per family, protected paint, nine individual mouth profiles and
three explicit rear nulls. Coordinates are raw-sheet pixels with Y down;
mouth rectangles contain centre and extents, and both basis vectors already
include those extents. Do not rescale each view by its prop bounding box or
crop the figures at nominal 384-pixel column boundaries.
Run `node tools/check-jwd-source-registration.mjs` from the project root for
hashes, dimensions, crops, shared pivots, profile structure and basis checks.

These are authoring inputs, never runtime loader inputs or accepted animation
exports. Fink's four views and Inga's two profiles require actual contact,
passing and hidden-leg/occlusion keys before the current walking helper can
be used. Numeric mouth validation does not approve source design, encoded
movement, changing-pose speech, recordings, listening or devices. The owning
[production protocol](../../../For-AI/SPRITE-GENERATION-PROTOCOL.md#jwd-mission-neighbour-2d-production-2026-10-13)
defines those remaining checks and the existing mission/audio integration.
