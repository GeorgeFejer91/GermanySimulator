# Fictional miniature neighbors

`directions.png` contains Heiko Maaslos, Inga Maaslos and Frau Schwabingen. Rows identify characters; columns are front, right profile and rear. `theodore-directions.png` adds their visibly younger, eight-year-old son in the same three views. The left profile mirrors the right. Only original fictional artwork ships here.

Style contract: compact proportions matching the existing miniature cast, restrained detail, brown zip sweater, teal corporate blazer, and a practical checked apron/headscarf. Heiko and Frau Schwabingen remain arrogant and unsmiling. Inga has a coherent, mildly superior face with naturally aligned eyes, rounded cheeks and one clean closed mouth.

Build with `python tools/build-neighbor-sprites.py` (Pillow and NumPy); optional character names rebuild only those families. The existing source-pixel rig uses one figure scale per family, a shared 128 x 192 cell and (64,180) sole pivot. Theodore's runtime world height is 68% of the adults, with a matching shorter travel distance per cycle.

Schwabingen's complete crown begins above the nominal third-row boundary in
`directions.png`. Her extraction includes 18 additional source pixels above
that boundary while retaining the existing body scale and sole pivot. Rebuild
both WebP variants and her standing PNG together. `tests/test_schwabingen_crown.py`
guards the rounded source contour; inspect the exact encoded cells too.

Each atlas packs 256 cells into a 16 x 16 grid: four 32-sample walks, eight idle, sixteen speech, eight listen, sixteen greeting, eight inspection, twenty-four emphasis/point, twenty-four calling, and twenty-four work frames. Semantic clips span physical atlas rows; use the manifest offsets, not the old one-row-per-action convention. Desktop is 2048 x 3072 (24 MiB decoded RGBA), mobile is 1024 x 1536 (6 MiB). The existing approach queue admits one selected variant per actor; the child is admitted when summoned. High-DPR mobile currently selects desktop paint.

Complete shoe layers retain their original paint, linear planted stance and lifted recovery. Distance-driven playback preserves the 16-sample rig's travel calibration while supplying 32 distinct samples. Walks take priority over dialogue body poses, with no advancing walk clock while waiting. Arm gestures have anticipation, a held beat, and recovery; small source-derived garment patches cover the area previously hidden by the hanging arm. No whole-body crossfade creates the in-betweens.

`chore-poses.png` supplies a lateral sponge-polishing pose for Heiko, an inspection/presentation pose for Inga, and a two-handed broom for Schwabingen. The connected hand and prop pixels move together. Ordinary hedge trimming retains the existing articulated character and shears instead of showing the wrong painted chore. Theodore's work row is a small fidget. Gesture names describe story intent: the compact front emphasis pose is not an extended index-finger point for every resident.

Schwabingen's broom row is selected only for authored sweeping. Ordinary
washing shows the registered presenting hand with a cloth. Her bird cleanup
uses that same hand and a procedural mop fitted to the actual grounded patch;
the simulation owns her approach, arrival and cleaning time.

Speech has source-bound front mouth profiles and sixteen baked mouth shapes. The material can retain connected lip movement during front walking and front emphasis gestures. Rear/profile views, adult chore poses, and the calling hand's face occlusion retain their source mouth instead of moving an unregistered lip patch. This is a deliberate fallback, not full directional lip-sync coverage.

Both encodes are lossless WebP with transparent RGB cleared, at least one transparent pixel around every cell, no mipmaps, and linear filtering. `python tools/verify-neighbor-sprites.py` checks the exact decoded exports, distinct walk phases, gutters and calibrated sole tracks. `tools/playtest-neighbor-animation.mjs` renders the production material and UV selection in an isolated Chromium fixture; it does not replace natural neighborhood-route acceptance. Ordered exact cells, light/dark boards, motion strips, hashes and diagnostic reports are generated under ignored `output/neighbors/`.

Built-in image generation produced the original direction paint and the two new source sheets. `source-provenance.json` records source hashes, generation output names and summarized authoring briefs. Source PNGs are authoring material; only the atlases and manifest are loaded by the game. The preserved compact gait remains a restrained shuffle, and direction changes select a different view without a separate painted turn clip.
