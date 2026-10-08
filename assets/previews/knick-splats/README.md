# Frau Knick: complete Gaussian splat performance

Open spark-preview.html?scene=knick&renderer=spark for a looping ten-second
performance: ready, raise the stamp, take aim, stamp the document, hold contact,
fold arms in refusal, and return to ready. It autoplays unless reduced motion
is requested; &autoplay=0 opens it paused. Pause, loop, quarter/half/normal/fast
speed, the scrubber and four anchor buttons expose every part of the sequence.
The existing fax comparison remains available in the same preview.

This is an animation experiment, not an accepted replacement for gameplay
character motion. The complete cycle demonstrates both what transporting paint
with Gaussian splats can do and where sparse 2D anchors remain insufficient.

## Source and correspondence

tools/build-knick-splat-preview.py crops four existing 384x832 cells, without
changing their pixels, from the clerk detail atlas: columns 0, 2, 3 and 1.
These are ready, raised stamp, stamp contact and refusal. All are lossless WebP.
The source hash, crop bounds, 28 named anatomical landmarks, local head/stamp
regions and format are recorded in manifest.json. No new artwork was used.

At a three-pixel stride, the paintings supply 15,412 / 16,314 / 14,792 / 14,801
visible samples. Each directed transition transports source paint forward and
target paint backward. A landmark thin-plate spline guides the body; local
similarity transforms protect head and stamp regions from global spline shear.
Below-knee samples stay planted. A smooth opacity handoff changes the visible
painting around the middle of each transition.

The browser uses one fixed allocation of 32,768 sample slots across four
transition blocks. Both Spark and native Three.js particles fetch positions and
sRGB/alpha from the same GPU textures and share the same phase function.
spark-preview-cycle.mjs owns the action clock. Switching segments changes
uniforms rather than rebuilding geometry or compiling another shader.

The 2,621,440-byte binary has four segment blocks. Each block has 16,384 source
slots followed by 16,384 target slots. Every 20-byte record contains four
little-endian Float32 positions (start XY, end XY), then four RGBA bytes.
Unused slots have zero alpha. Endpoint positions and paint are byte-consistent
between adjacent segments, including the loop seam.

## Limits and resource ownership

This does not infer a skeleton, depth, occluded limbs or missing views.
Paper exists only in the contact painting and must appear/disappear through
the opacity handoff. Crossing arms and the stamp can soften or lose clear
silhouette during a transition. The full cycle is a preview of the method;
it is not evidence that four painted anchors produce production-ready anatomy.
Source anchors remain visible below the result for comparison.

Character data is fetched only by this opt-in preview. GPU mapping is
256x512x16 = 2,097,152 bytes; paint is 256x512x4 = 524,288 bytes.
The CPU texture backing arrays total the same 2,621,440 bytes, plus 393,216
bytes of sample indices. Each source thumbnail decodes to 1,277,952 bytes.
Spark's packed splats, worker, sorting and render targets add their own bounded
allocations; these are not included in the texture totals.

Rendering uses at most one pixel per CSS pixel and 1.6 MP, capped at 60 requests
per second while playing. Paused rendering settles on demand. Hidden pages
stop rendering and advancing the clock, then resume without catching up.
Teardown releases textures, geometries, Spark and the resize observer.
There is no voice, gameplay event, route, collision or canonical atlas change.

The original painted art and provenance remain under
assets/sprite-sources/buergeramt/.

## Validation for the full-cycle preview (2026-10-08)

The focused correspondence/timing suite passed 5/5; the existing Pages test
command passed all 20 tests. Four lossless crops match the source pixels.
Twenty-four isolated Chrome runs covered both renderers, both scenes, desktop
and Android emulation. The 26 UI/lifecycle checks included 320 CSS px, 200% text,
text spacing, long labels, reduced motion, renderer failure and context loss.
Character runs had frame p95 near 21 ms on the host's Intel Iris Xe; CPU render
submission p95 was 0.3–0.4 ms for points and about 0.6 ms for Spark. This is not
GPU duration or evidence from a physical Android device. Cold local delivery
with Spark was about 7.44 MB including libraries and all four thumbnails;
the local server did not compress its files.

An independent silent browser trace observed the whole sequence and loop
wrap, exact single-cycle stop at 10 seconds, replay, quarter speed, settled
paused rendering and hidden-page suspension without catch-up. Independent
motion and image review retained the hand/face/prop blending limitations above.
Production anatomy and canonical game integration remain unaccepted.

A final cold-start refinement delays autoplay until the first rendered frame
has completed. The targeted independent recheck observed a 340 ms preparation
render, followed by 0.458 seconds of playback over roughly 0.463 seconds.
Reduced motion remained paused. Full-cycle/performance evidence above predates
only this initialization change; the final targeted check had no browser errors.
