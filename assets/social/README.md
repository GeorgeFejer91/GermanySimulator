# Level share illustrations

These PNGs are social-preview assets, not gameplay textures. Each is 1200 × 630; the generated static level pages reference them with absolute production URLs.

`buergeramt.png` was generated with the built-in image-generation tool on 2026-10-14 for this project: a municipal waiting room, oversized paperwork, ticket 38 and a clerk stamping a bratwurst. The selected output was resized/cropped to the standard sharing dimensions with Sharp.

The other previews are original deterministic cartoon illustrations authored in `tools/build-level-previews.mjs`, with each destination's own title, satirical sign, palette and numbered form. The neighbors illustration uses a watchful house with forbidden lawn; Jobcenter uses a fire in place of the responsible official. No external images are used. Run the tool with the existing authoring Sharp dependency; an optional first argument supplies the original Bürgeramt artwork for export. Generation is offline only; committed PNGs are deployed directly.

`tools/build-level-pages.mjs` derives destinations from the canonical `game.js` building catalogue. A missing preview fails the build. `tests/level-pages.test.mjs` checks PNG headers and dimensions. Maintain the routes and production evidence in `For-AI/LEVEL-URLS.md`.
