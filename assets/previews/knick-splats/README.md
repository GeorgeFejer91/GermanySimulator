# Frau Knick: fourteen-key tactical splat study

Open spark-preview.html?scene=knick&renderer=spark&v=cycle4 for the
6.25-second loop. Four original anchors and ten authored bridge paintings cover
raising, paper pickup, stamping, releasing the document, folding and returning.
Reduced motion and &autoplay=0 start paused. Every key has a seek button;
loop, speed and timeline controls are shared by both renderers.

## Continuous movement and protected handoffs

spark-preview-cycle.mjs owns key order, timing and paper ownership. Every
interval has a linear advancing phase, with no scheduled intermediate holds
or repeated easing to zero. Compatible pairs 0, 1, 2, 5, 6, 7 and 13 transport
paint. Pairs 3, 4 and 8 through 12 use 100 ms intact-pose intervals for changing
occlusion, gripping and paper ownership. Optional dissolve respects these guards.

The builder maps compatible body paint with weighted local similarity using
registered landmarks and extra head/collar guides. This replaces the global
thin-plate spline and hard head boundary that tore the neck during the lift.
Skirt/lower-leg transport fades to zero below the hip. Narrow stamp ownership
follows a rotating, monotone cubic center path without scaling the prop.
Head-center curve metadata is diagnostic; body paint uses the connected map.
Opaque source/target selection at the midpoint avoids translucent duplicate
heads, arms and props. Both renderers use the same positions, paint and clock.

This remains a preview, not accepted production animation. Independently
painted keys differ in face, shoe, stamp and body proportions. Midpoint paint
changes and protected cuts remain visible; it is not a reconstructed skeleton
or complete hidden-limb rig. Gaussian rendering does not create missing anatomy.
Original pixels are unchanged.

## Source, registration and rebuild

Original anchor-0 through anchor-3 are unchanged lossless 384x832 crops of
the clerk detail atlas, columns 0, 2, 3 and 1. Four registered-anchor thumbnails
only add transparent horizontal padding.

The built-in OpenAI image generator authored the ten bridges. Transparent
source paintings, exact prompts and hashes live in
../../sprite-sources/buergeramt/knick-bridges/. A separate reach painting replaced
the first stamping-strip cell so paper does not appear at the waist.

Run python tools/prepare-knick-bridges.py, then
python tools/build-knick-splat-preview.py from the repository. Pillow, NumPy
and existing Node suffice. No training, SciPy or runtime model is used.
Preparation --verify checks the exports. Registration records source crops,
uniform strip scaling, common ground alignment and landmark coordinates.
Bridge WebPs use premultiplied sampling, transparent gutters and zero hidden RGB.
All fourteen registered canvases are 1024x832, centered at x512; the wider canvas
preserves an extended arm/document without shrinking the whole character.

## Runtime ownership and costs

The preview fetches correspondence.bin and parts.bin only for the character
scene. Fourteen blocks contain 19,968 source and 19,968 target slots each.
Each 20-byte correspondence record is start/end Float32 XY plus RGBA8.
Guarded records have identical start/end coordinates. Adjacent segments and
the loop seam retain identical endpoint paint and positions.

The fixed 39,936-slot geometry never rebuilds at a key. Mapping/paint textures
occupy 8,945,664 + 2,236,416 = 11,182,080 bytes. The R8 ownership texture adds
559,104 bytes, bringing character texture backing to 11,741,184 bytes plus
479,232 bytes of indices. Download/decode staging temporarily adds another
correspondence buffer. Spark packed data, sorting and render targets are extra.
A registered thumbnail decodes to 3,407,872 bytes; fourteen lazy thumbnails
are bounded at 47,710,208 bytes. Authoring PNGs never load in the preview.
This opt-in experiment is not a gameplay asset budget.

Rendering is bounded at one pixel per CSS pixel, 1.6 MP and 60 requests per
second. It settles when paused, suspends while hidden without catch-up, and
releases textures, geometry, counter props, Spark and observer on teardown.
Canonical game loaders, atlases, collisions, routes and voice events are unchanged.

## Verification of cycle4 (2026-10-08)

The focused integrity/timing suite passes 10/10; the full Pages command passes
29/29 after integrating concurrent main changes. Checks cover source hashes, bounded data, fourteen keys, exact binary
endpoints/loop seam, protected position invariance, lower-leg planting, paper
ownership, no scheduled holds, short guarded intervals and curve bounds.
These checks establish data/timing behavior, not rendered anatomical quality.

Both independent reviewers pass the explicit no-intermediate-pause preview
goal on the frozen final runtime/assets. Fresh normal-speed Spark and Three.js
particle recordings visit all fourteen pairs and wrap; the neck remains
connected and protected crossings show intact single poses. Pause/idle,
quarter speed, one-shot stop at 6.25 seconds, replay, hidden freeze/resume,
reduced-motion startup and fixed resource counts pass. No browser errors occur.
Rendered endpoint seams differ only by minor GPU quantization (no RGB channel
more than 8/255 in the motion review).

Independent visual checks also cover Android emulation, representative ±45°
views and 320 CSS px/200% text with Pretext. All 32 asset hash references match.
Warm desktop observations were frame/CPU p95 21.0/1.1 ms for Spark and
20.9/0.5 ms for particles; geometry/texture counts stayed 7/12 and 5/3.
These are concurrent-review host observations, not isolated GPU or phone
benchmarks. Physical Android remains NOT RUN.

The first lift's opaque midpoint paint change is visibly stepped, as are brief
protected cuts. Neither reviewer accepts this as organic production animation.
Earlier cycle4 trials failed for neck tears and ghosted forearms and were not
published. Fresh evidence is under ignored output/spark-preview/flow-motion-final/
and flow-visual-final/. Production integration remains unaccepted.
