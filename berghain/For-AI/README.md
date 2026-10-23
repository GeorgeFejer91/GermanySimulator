# Berghain reconstruction: goal and work state

Created 2026-10-23 at George's request. Owner: Codex integrator in the current chat. The active app goal is the Berghain exterior/interior reconstruction; this page is its durable task state. Do not resume unrelated paused game-completion work.

## Requested outcome

Create a full, realistic, three-dimensional architectural asset of Berghain, inside and outside, using public architectural plans, photographs, existing models and the known Minecraft reconstruction where available. Maintain a catalogue of online resources and a hidden page for viewing the exterior and going inside.

The working target is the contemporary building, with reference dates retained so historical layouts are not silently mixed. This is a builder assumption, not a surveyed as-built claim. Include the main club, Panorama Bar, Säule, foyer/coat check, stairs, bars, public service spaces, Halle, Lab.oratory and garden in coverage tracking; undocumented spaces remain explicit gaps.

## Current work

- [x] Register the active goal and create this scoped workspace.
- [x] Search the public web and GitHub for pre-existing models and references.
- [x] Create the reviewed online resource catalogue, including source access and reuse status (59 entries).
- [x] Inspect primary architectural images and establish a provisional façade and room-volume study; retain dimensional gaps.
- [x] Build the hidden architectural viewer with outside/inside navigation and explicit reconstruction status.
- [ ] Create and refine the full model; document dimensions, source links and uncertain geometry by space.
- [x] Export and validate a portable GLB with sensible materials, real units and model hierarchy.
- [x] Check the provisional viewer's exterior framing, sampled interior paths, bounds, camera clearance and idle/browser costs; obtain independent physics and camera/scale reviews. Targeted unrun checks and physical-device qualification remain in VALIDATION.md.
- [ ] Complete remaining evidence gaps before calling the asset fully realistic or complete.

## Acceptance

The catalogue must distinguish verified resources from search leads, downloadable geometry from videos, historical drawings from current layouts, and publicly viewable media from reusable assets. Each modelled zone needs a traceable source or an explicit inferred label. A façade fragment or a visual prototype does not complete the full-asset goal.

The hidden viewer must use the existing project dependency, show the exterior, support entering and leaving the model and visiting interior spaces, work with keyboard and touch, preserve visible focus, and carry `noindex` metadata. It must not appear in ordinary game navigation. Run browser checks silently and distinguish emulation from physical-device results.

Keep shipped resources under the root [assets](../../assets/) authority and use the shared [asset rules](../../For-AI/ASSET-POLICY.md). No game mission, entry URL or main-game layout changes are requested. Research/prototype acceptance does not establish the full goal's completion.

## Viewer implementation plan

Integrator-owned implementation; reuse this page as the plan and state owner. The user's creation requests authorize execution. The first candidate is an explicitly provisional architectural study, not the final surveyed asset.

Allowed edits: this `berghain/` scope, new `assets/models/berghain/` model data/geometry/exports, scoped tests under `tests/`, the existing static builder's Berghain copy boundary, the root subject-index link, and the existing Pretext provenance's consumer list. Preserve main game/controller, existing assets, and unrelated staged work.

1. Finish the source catalogue. Inspect primary images, retain dates/access/licensing limits and evidence gaps. No third-party image becomes a shipped texture by default.
2. Add a focused failing test for full-body movement against the same walls/floors used by the model, and a packaging test preventing reference downloads from entering the static build.
3. Build an original metre-based model under the existing asset authority: articulated concrete façade/windows, structural halls, foyer, principal floors, stairs and garden. Store per-space confidence and sources. Reuse local Three.js r186; keep the current game unchanged.
4. Implement `model.html`, `viewer.css`, `viewer.mjs`, and bounded navigation with a working exterior orbit, interior entry, room selection, touch/keyboard controls, exit/reset, readable load/WebGL failure and noindex metadata. Reuse locked local Pretext 0.0.9 and its bundled font; measure actual touched labels and retain readable reflow.
5. Export a portable GLB from this model, validate bounds/materials and retain provenance. Include only the viewer runtime in static packaging; authoring documents/downloads stay out.
6. Run deterministic movement/packaging tests and silent headless Chromium desktop/Android-emulation checks with rendered screenshots, keyboard/touch, blur/background, resize, 320 px, 200% text, and context-failure coverage. Freeze file hashes for independent Physics and Camera/scale reviews; repair findings and rerun affected checks.

Review focus: thin-wall tunnelling and stair clearance; room cameras inside solid geometry; loss of key/pointer state on blur or UI changes; readable controls in a short/narrow viewport; accidental publication of third-party reference copies. Crowd, vehicles, sprites and main-game mission gates are out of scope because this page contains no game actors or missions. Physical Android qualification remains separate.

### Exterior calibration implementation

Use the official front width and the two main LoD2 volume depths/heights to fit
the editable study. Keep its existing interior floor heights provisional and
keep body/eye dimensions unchanged. Apply one authored coordinate transform to
parts, floors, solids and viewpoints; retain polygon footprints for sheared
walls/floors. Include the two actual western annex meshes as closed, unmodelled
volumes, without guessing their use. Remove the unsupported roof-plant box.
Camera reset must frame actual updated exterior bounds. Re-export the combined
asset, rerun real stair/entry routes and rendered desktop/mobile checks, then
obtain both independent reviewers on the same frozen candidate. Main-game code
and unrelated work remain out of scope.

### Photographic façade refinement

2024 photographs P07–P10 and 2019 detail P03 show separated window tiers,
recessed masonry panels, steel frames, sills, and two attic vent rows. Replace
the continuous glazed-band approximation with that observed structure. Retain
the provisional eleven-bay count where perspective/occlusion prevents a firm
per-elevation count; estimated opening dimensions are not surveyed. Correct
outward offsets on the west elevation. Keep the surveyed mass frame, interior
levels and entrance clear width unchanged. Adjust basic material tones from
observations; no photograph, graffiti or artwork is embedded. Re-export and
review rendered elevations, collision bounds and existing walking paths.

## Handoff

The active app goal remains unfinished. Research and a calibrated, photo-informed model/viewer are implemented; they do not meet the full realistic-asset target yet. See [SOURCES.md](SOURCES.md) for the 59-entry catalogue and [VALIDATION.md](VALIDATION.md) for checks, independent reviews and outstanding coverage.

Open `/berghain/model.html` through the project's HTTP server. The current local preview is `http://127.0.0.1:49683/berghain/model.html` while that server remains running. The page is direct-link only, with `noindex, nofollow`, and has no ordinary game-navigation entry. It is not access-controlled.

The study includes the exterior shell, foyer, main floor, Panorama Bar, Säule, Halle and garden. Exterior orbit, walking with keyboard/touch, room selection, three traversable stairs, graphics recovery and GLB download are implemented. Asset authority: `assets/models/berghain/layout.mjs`; renderer assembly: `model.mjs`. Regenerate with `node berghain/export-model.mjs`. The current GLB is 3,406,612 bytes / 40,112 triangles, with 39 material/mesh groups. It combines original study geometry with Berlin open-data roofs and annexes. No downloaded image or artwork is embedded.

Research found an unfinished OpenSCAD/front-façade STL repository, a paid printable STL listing, the original Minecraft creator's withdrawn walkthrough, architects' photographs and eyewitness diagrams. No complete, verified, freely reusable interior/exterior asset has been confirmed. The 2004 application image is only a cover/title-block photograph. The inspected Transformers catalogue (PDF page 70) has an exterior axonometric and site map, without dimensioned interior plans. The official Berlin textured exterior-mesh portal reported maintenance; no tile was acquired.

Official cadastral and LoD2 exterior geometry was acquired from the separate, working Berlin GDI service (G07–G09). Building ID `DEBE02YY200004SX` matches the address in both sources. `assets/models/berghain/survey-data.mjs` preserves four connected volumes, source hashes and a reversible local EPSG:25833 coordinate frame. `berghain-exterior-lod2.glb` is a 26,796-byte, 88-triangle external reference hull; its front edge is 37.949743 m, primary roofs 20.374 / 22.803 m above its ground datum. This is generalised official geometry, not a fresh site survey.

The walking viewer is now calibrated through `calibration.mjs`: the front/join/rear cross-sections fit the two primary volumes; official roof faces, the taller Halle's exposed front wall, and both western annex meshes are included. The annexes remain closed unmodelled volumes; their internal use is not inferred. The unsupported rooftop box is removed. Interior floors remain provisional, and visitor radius 0.28 m / eye height 1.68 m are unchanged. Mapped polygon floors/solids follow the same geometry, solid heights derive from their actual rendered matrices, and discrete tread undersides supplement the smooth stair support. One inferred western Halle column/beam line was moved clear of the full provisional stair lane. It is not a verified structural grid. Camera reset uses actual shell/annex bounds.

Reproduce extraction after downloading the source files listed in `survey-data.mjs`: run `python berghain/import-berlin-lod2.py`, then `node berghain/export-model.mjs --survey`. The standalone official reference remains separate from the combined walking study export. The shared exporter handles ordinary and instanced meshes. Current combined study SHA-256: `75bfc25d0e952bc999d1c71baca9560faac60ccc5e767d2b24a3d759bd5a927b`.

The façade now has separate glazing tiers, steel frames, masonry bands, physical inset panels, sills and attic vents informed by P03/P07–P10. Panels use an estimated 7 cm authoring depth (about 5.9–6.0 cm after calibration), with closed solid rims. All three elevations still repeat estimated bays. Basic PBR colours have no surface/weathering texture maps. A12/A13 and I11 add primary Lab.oratory and Panorama references, including the missing extra lounge level and historical lighting/acoustic treatments.

Next work: verify per-elevation openings and roof/rear detail, model the smoking bridge, corroborate circulation/elevations; document and model Lab.oratory, the second Panorama lounge level, bathrooms, services and connecting spaces; add observed surface/weathering and installation detail. The retained 44 m authoring coordinates are transformed at asset construction and are no longer the shipped exterior width; do not treat those old coordinates or inferred partitions/repeated façades as measured facts. Primary exterior data does not establish room dimensions or which annex contains a particular interior use.

Repository: `C:/Users/cogpsy-vrlab/Documents/GitHub/GermanySimulator`. The local `codex/neighborhood-walk-talk` branch has no initial commit/remote and substantial pre-existing staged work. For the user's explicit live-preview request, publish only the Berghain scope and builder allowlist against verified `GeorgeFejer91/GermanySimulator` remote `main` using an isolated bare repository/index under ignored `output/`. Preserve the original index and game work. Intended unlisted URL: `https://germanysimulator.de/berghain/model.html`; record confirmed deployment in VALIDATION.md. The shared root handoff remains authoritative for unrelated game work.
