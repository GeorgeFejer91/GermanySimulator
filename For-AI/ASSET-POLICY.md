# Asset and efficiency policy

## Decision

Use one asset authority at root `assets/`, with fidelity selected by the client. Desktop may use high-resolution period artwork where it is visibly valuable; mobile must prefer minimal vector or otherwise lightweight variants.

## Desktop and mobile

- Desktop billboard direction: high-resolution, Weimar-era-inspired commercial artwork with deterministic game-rendered copy. Avoid real propaganda, extremist symbols, political insignia, and text baked unreliably into generated images.
- Mobile billboard direction: the existing minimalist fax-machine vector style or an equally small deterministic alternative.
- The shipped desktop fax-ad pool is the two user-supplied, game-readable motifs under `assets/billboards/fax/`; the eagle-insignia variants from the source pack are intentionally not shipped. Both Canvas and Three.js use the same motif assignment, while viewports below 700 px keep `assets/fax-billboard.svg` and do not request the WebPs.
- Share gameplay data, placement, copy, and interaction logic. Only the visual representation should vary by capability or viewport.
- Load a desktop-only raster only when the desktop representation is actually selected. Do not make mobile download an unused high-resolution alternative.
- Prefer WebP/AVIF for large raster delivery when browser support and visual QA are adequate; retain SVG for simple line art and signs.
- The title screen uses the single transparent vectorized illustration at `assets/fax-wurst.svg`; animate that shipped SVG with CSS and do not add the generated raster as a second runtime variant.
- The user-supplied wrong-answer sting is an in-game-only asset. Preserve its provenance notice and checksum in `assets/voices/LICENSES.md`; do not claim a broader license or treat it as a general-purpose project asset.

## YAGNI rules

Backend, infrastructure, and asset-pipeline choices are deliberately conservative:

1. Use `$ponytail` for these decisions when the skill is installed.
2. If `$ponytail` is unavailable, disclose that and apply this checklist directly; do not invent the skill’s content.
3. Keep the game static-first. Do not add a database, API, asset server, CMS, CDN dependency, bundler, runtime model service, or telemetry backend without a concrete accepted requirement.
4. Reuse an existing asset or renderer before creating a new abstraction.
5. Do not add an asset variant until a real desktop/mobile visual or performance distinction requires it.
6. Avoid duplicate runtime trees and duplicate source artwork. One source placement, one loader decision, one fallback.
7. Measure network size, decode cost, memory, and frame impact before building optimization infrastructure.
8. Prefer a small manifest or direct mapping over a generalized asset registry until at least two independent asset families need the same abstraction.
9. Root HTML entry points append one release token to CSS and JavaScript URLs. Bump that token whenever a user-visible Pages release changes those files so GitHub Pages' ten-minute asset cache cannot mix old runtime code with new HTML.

## Acceptance

An asset change is complete only when the correct variant loads on desktop and mobile, missing files fail gracefully, the browser console stays clean, and gameplay/interactions remain unchanged unless the task explicitly changes them.

## Local 3D buildings

- Root `assets/models/` is the only authority for shipped model files.
- The selected Kenney City Kit Commercial meshes are local CC0 GLB files; retain their local license and source record.
- `world3d.js` may recolor model materials at runtime to the restrained concrete-gray bureaucracy palette. Do not restore the pack's bright commercial colors by default.
- GLB loading is an enhancement. A missing model keeps its procedural building, and failure of the WebGL renderer returns to the canvas world without changing gameplay state.
- Keep the selected model set bounded and measure total transfer size before adding another pack.
- The power-plant landmark uses five local CC0 GLBs under `assets/models/power-plants/` (about 0.5 MB total): three selected Kenney Industrial meshes plus a nuclear transformer and warning sign from 3DAssets.dev. Preserve `LICENSES.md`, its AI-generation disclosure, source URLs, and checksums when replacing these files.
