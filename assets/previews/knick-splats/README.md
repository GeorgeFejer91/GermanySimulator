# Frau Knick anchor-transition experiment

`spark-preview.html?scene=knick&renderer=spark` compares two existing painted
clerk poses using procedural Gaussian splats. This is an inspectable animation
experiment, not an accepted replacement for any game character or atlas.

`tools/build-knick-splat-preview.py` crops the idle and raised-stamp cells from
the existing detail atlas without changing their pixels, saves lossless WebP
anchors, and creates 31,726 source/target samples at a three-pixel stride.
The source hash, exact crops, authored anatomical correspondences, binary
record format and limitations are recorded in `manifest.json`.

A thin-plate spline fitted to 28 manually paired points transports the source
and target paint into intermediate positions. The browser interpolates those
positions and the two clouds' opacity on the GPU. Both renderer choices use the
same samples, trajectories and phase. The 7-second cycle holds A, moves to B,
holds B, and returns to A. The alternative dissolve adds spatial scatter.

This supplies no skeleton, depth reconstruction, new view or hidden pixels.
The midpoint can soften the face, blend the stamp contours and distort the
crossing arm; it is not accepted as connected anatomical action. Original
anchors are displayed below the rendered result for comparison. No voice,
route, physics or game animation changes are included.

The data is fetched only by the character preview. Binary payload is 1,142,136
bytes; its Float32 CPU data has the same size. GPU correspondence is 256×124×16
= 507,904 bytes, in addition to packed splats and renderer buffers. Each source
thumbnail decodes to 384×832×4 = 1,277,952 bytes. Rendering is capped at one
pixel/CSS pixel and 1.6 MP; playback is on demand, stops when hidden and releases
resources on teardown. The initial view is paused, including reduced motion.

The original painted art and its provenance remain under
`assets/sprite-sources/buergeramt/`; no artwork service or new art was used here.
