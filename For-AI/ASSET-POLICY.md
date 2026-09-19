# Asset and efficiency policy

## Decision

Use one asset authority at root `assets/`, with fidelity selected by the client. Desktop may use high-resolution period artwork where it is visibly valuable; mobile must prefer minimal vector or otherwise lightweight variants.

## Desktop and mobile

- Desktop billboard direction: high-resolution, Weimar-era-inspired commercial artwork with deterministic game-rendered copy. Avoid real propaganda, extremist symbols, political insignia, and text baked unreliably into generated images.
- Mobile billboard direction: the existing minimalist fax-machine vector style or an equally small deterministic alternative.
- Share gameplay data, placement, copy, and interaction logic. Only the visual representation should vary by capability or viewport.
- Load a desktop-only raster only when the desktop representation is actually selected. Do not make mobile download an unused high-resolution alternative.
- Prefer WebP/AVIF for large raster delivery when browser support and visual QA are adequate; retain SVG for simple line art and signs.

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

## Acceptance

An asset change is complete only when the correct variant loads on desktop and mobile, missing files fail gracefully, the browser console stays clean, and gameplay/interactions remain unchanged unless the task explicitly changes them.
