# Frau Knick: fourteen-key tactical splat study

Open spark-preview.html?scene=knick&renderer=spark for the ten-second loop.
Four original anchors now have ten authored bridge drawings: two for raising,
three for approaching contact, three for releasing the paper and folding arms,
and two for returning. The counter gives the document a pickup/putdown place.
Reduced motion starts paused; &autoplay=0 also opens paused. Every key has a
seek button; loop, speed and timeline controls are shared by both renderers.

## Where splat interpolation is allowed

The short same-side stamp approach (keys 6–7, 3.4–3.8 seconds) transports paint.
All other intervals select intact drawings with a hard opacity handoff: no
cross-body position warp, transparent double forearms, or stretching a stamp
between incompatible proportions. The optional approach dissolve also respects
these guards. It does not bypass protection for crossed arms or prop transfers.

spark-preview-cycle.mjs owns key order, action timing and paper ownership.
The builder records a per-interval policy in manifest.json. Candidate motions
are further rejected when the measured stamp-axis ratio falls outside
0.85–1.15. This conservative check supplements authored topology decisions;
it is not automatic anatomical validation. Only the allowed approach uses a
landmark spline, local head/stamp similarity transforms and planted lower legs.

This remains a preview, not accepted production animation. Protected changes
are deliberately stepped. Face, shoe, stamp and body proportions still vary
between independently painted keys, and the allowed splat approach softens
detail. No depth, hidden limbs or skeleton is inferred.

## Source, registration and rebuild

Original anchor-0 through anchor-3 are unchanged lossless 384x832 crops of
the clerk detail atlas, columns 0, 2, 3 and 1. Four registered-anchor thumbnails
only add transparent horizontal padding; original pixels are unchanged.

The built-in OpenAI image generator authored the ten bridges. Transparent
source paintings, exact prompts and hashes are in
../../sprite-sources/buergeramt/knick-bridges/. The first stamping-strip cell
was replaced by a separate reach painting so paper does not appear at the waist.

Run python tools/prepare-knick-bridges.py from the repository, then
python tools/build-knick-splat-preview.py. Dependencies are Pillow, NumPy and
the existing Node runtime. No SciPy, training, paid API or runtime model is used.
Registration records source crops, a uniform scale per strip, shared ground
alignment and landmark coordinates in bridge-registration.json. Encoded bridge
WebPs use premultiplied RGBA sampling, transparent gutters and zero hidden RGB.
Run the preparation script with --verify to check the existing exports.

All fourteen registered canvases are 1024x832, centered at x512 for rendering.
The wider transparent canvas preserves the extended arm and document without
shrinking the character to fit a moving silhouette. Source/hash relationships,
sample counts, named landmarks and transition policies are in manifest.json.

## Runtime ownership and costs

The preview alone fetches correspondence.bin. It has fourteen transition blocks,
each with 19,968 source and 19,968 target slots. Each 20-byte record is four
little-endian Float32 positions (start XY, end XY) followed by RGBA bytes.
Guarded records have identical start/end coordinates. Adjacent segments and
the loop seam retain identical paint and endpoint positions.

The fixed 39,936-slot GPU geometry is never rebuilt on a transition. Mapping
and paint textures are 256x2184: 8,945,664 + 2,236,416 = 11,182,080 bytes.
CPU texture backing arrays have the same total plus 479,232 bytes of indices;
download/decode staging temporarily adds another binary buffer.
A registered thumbnail decodes to 3,407,872 bytes. Fourteen lazy thumbnails
are bounded at 47,710,208 bytes if all are decoded. Authoring PNGs never load
in the preview. Spark's packed data, sorting worker and render targets add
their own allocations beyond these texture figures.

The earlier four-anchor binary was 2,621,440 bytes; fourteen complete keys
increase opt-in data by 8,560,640 bytes. This is not a proposed gameplay asset
budget. Both renderers share the same data and guarded clock. Rendering is
bounded at one pixel per CSS pixel / 1.6 MP / 60 requests per second, settles
when paused, and suspends while hidden without catch-up. Teardown releases
the textures, geometry, counter props, Spark and observer. Canonical game
loaders, atlases, collisions, routes and voice events do not change.

## Verification of cycle3 (2026-10-08)

The focused integrity/timing suite passes 8/8: source hashes, fourteen keys,
exact endpoints/loop seam, protected position invariance, lower-leg planting,
paper ownership and library isolation.

Independent motion review freshly observed every key and beat, full wrap,
one-shot stop at ten seconds, replay, quarter speed, paused/hidden suspension,
constant resource counts, and no browser errors. Its rendered 0/10/0 loop
screenshots are byte-identical. All 420,763 visible guarded samples have zero
transport; the only interpolated pair retains 2,996 planted lower-leg samples.
These checks establish preview behavior, not production anatomical quality.
Desktop and Android emulation are separate from physical Android testing.

The full Pages command passes 23/23. Twenty-four cold-context Chrome runs
covered both scenes/renderers on desktop and Android emulation; all 26
layout/lifecycle checks passed (320 px, 200% text, spacing, long labels,
reduced motion, blocked Spark, context loss and idle/hidden rendering).
Character frame p95 was 20.9–21.0 ms on Intel Iris Xe; CPU submission p95
was 0.4–0.9 ms. Some independent review contexts ran concurrently; these
figures are observed host timings, not isolated GPU benchmarks or phone results.
Local uncompressed delivery including Spark and lazy-loaded thumbnails was
19.18 MB desktop and 16.14 MB portrait, versus about 7.44 MB for the old cycle.

Independent visual review passed all fourteen keys, the three approach
intermediates, front framing, both renderers, phone emulation and enlarged text.
Oblique views reveal the flat character's depth/foot-contact limits. The final
visibility-only correction hides a foreground box that covered a shoe at −45°;
the broad run above preceded that change. Both independent targeted rechecks
passed the final visibility correction, the paper handoffs and exact loop seam.
Physical Android and production character integration remain untested/unaccepted.
