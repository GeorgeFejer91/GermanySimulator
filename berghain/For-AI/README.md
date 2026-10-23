# Berghain reconstruction: goal and work state

Created 2026-10-23 at George's request. Owner: Codex integrator in the current chat. The active app goal is the Berghain exterior/interior reconstruction; this page is its durable task state. Do not resume unrelated paused game-completion work.

## Requested outcome

Create a full, realistic, three-dimensional architectural asset of Berghain, inside and outside, using public architectural plans, photographs, existing models and the known Minecraft reconstruction where available. Maintain a catalogue of online resources and a hidden page for viewing the exterior and going inside.

The working target is the contemporary building, with reference dates retained so historical layouts are not silently mixed. This is a builder assumption, not a surveyed as-built claim. Include the main club, Panorama Bar, Säule, foyer/coat check, stairs, bars, public service spaces, Halle, Lab.oratory and garden in coverage tracking; undocumented spaces remain explicit gaps.

## Current work

- [x] Register the active goal and create this scoped workspace.
- [x] Search the public web and GitHub for pre-existing models and references.
- [x] Create the reviewed online resource catalogue, including source access and reuse status (81 entries).
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

### Geheim playable walkthrough — validated for publication

Current 22-file frozen candidate passed both required independent reviewers,
24 focused Node checks and four final browser cases. Accepted moving frames,
entrance/exit, touch, lifecycle and complete-body camera evidence are recorded
in [VALIDATION.md](VALIDATION.md). Publish only this scoped candidate through
the existing isolated index, then verify `/geheim/` publicly. The main working
checkout's unrelated staged files must remain untouched.

The user requests a published `/geheim/` page with a controllable human avatar
and the interaction of entering the building. Implement as an optional third-
person mode of the existing viewer/model, with an unlisted generated alias;
retain the architectural viewer URL. This is a continuous architectural walk,
not a new mission controller or a second copy of the game runtime. Use the
existing navigation, local Three.js, shared hinged entrance factory and measured
Pretext labels. No new library, service or change to the city mission chain.

Allowed integrator writes: this scope; a procedural avatar under the existing
Berghain asset authority; focused Node/browser checks; the existing static
builder's alias/copy boundary; a unique share preview under assets/social and
its direct-URL catalogue entry. Preserve all unrelated staged work and use the
existing isolated publication procedure. New avatar and door geometry are not
part of the building GLB export.

Start outside with human scale and third-person camera. WASD/arrows and touch
move the body through the existing collision owner. E/button at the actual
entrance opens the hinged door and walks through it; far/duplicate actions do
nothing. Exit uses the same doorway. Input interruption cancels held movement
and pending automatic crossing. Camera collision uses the rendered opaque model;
gait follows accepted displacement and stops when blocked. Rendering remains
demand driven, with disposal and graphics recovery. This continuous walk does
not switch indoor levels or invoke the city's cinematic vortex protocol.

Acceptance: source-driven door collision/crossing/guard and avatar bounds checks;
actual approach/E/inside/exit in silent desktop and Android emulation; touch,
blur/modal/context recovery, readable 320 px/200% controls and idle cessation;
generated alias/import links/share image packaging; independent Physics and
Camera/scale reviews on the same frozen candidate; push and verify the live URL.
The wider realistic interior/art reconstruction goal remains unfinished.

### Interior design, art and sound research

The user inspected the preview and prioritised the missing interior design,
including Anna Uddenberg's mannequin sculpture and the sound system. Use
[INTERIOR.md](INTERIOR.md) as the object/room inventory and implementation order;
the full architectural outcome and missing rooms remain required. This research
update owns these notes, the source catalogue and its public static copy boundary
plus the focused packaging test. No viewer/model/navigation/material changes.

New evidence: the three actual 2009 Chrisse Kunst cartoons were acquired and
inspected; they are small, stylised historical topology references. Primary
gallery documentation identifies Uddenberg's *CLIMBER (Angel Kiss)* (2020), with
published dimensions and an inspected studio photograph. Curator/artist records
add Bisky, Marr, Göthe, Czebatul, Brandenburg and Tillmans; separate temporary
exhibition work and removed historic work. The old Piotr Nathan mural was removed
in April 2017 and is not the contemporary foyer target. Main-hall Funktion-One
changed in 2023; Panorama PA is documented by Studt-Akustik. Actual DS210 STEP/DXF
and dimensioned PDF were acquired as research, not as an established current rig.

Next modelling work starts with the main hall/foyer and Panorama's distinctive
furniture, bar and DJ forms, then missing room connections and the sourced art.
Bridge research is retained but exterior-only refinement is deferred to this
interior priority. No named artwork is implemented yet; the user correctly
identified the current interior's generic appearance. Neither this inventory
nor the earlier material-map checkpoint satisfies the realistic interior goal.

### Original material maps

Scope: original tileable mineral/stone/metal/aggregate base-colour, normal and
packed roughness maps under `assets/models/berghain/`, offline generator here,
material/UV helpers, existing model/exporter/viewer and scoped validation. Retain
instanced geometry, physical dimensions, collision, hierarchy and navigation.
Use metre-based projected UVs in the viewer and equivalent baked UVs in GLB;
embed and deduplicate PNGs for portable standard glTF materials. No new runtime
dependency, photo/artwork texture or change to the main game. Map parameters
remain appearance estimates, not scanned/measured materials. The embedded-image/
UV contract and 17 prior tests pass; current desktop/Android emulation, actual
texture-failure movement, graphics recovery/idle and paired native GLB appearance
checks pass. All 12 shared textures dispose once. Both independent reviews pass
on `output/berghain-material-candidate.json` (36 files). Faint tiling on the
long blank hall wall and unique dirt/damage remain fidelity work.

The active app goal remains unfinished. Research and a calibrated, photo-informed model/viewer are implemented; they do not meet the full realistic-asset target yet. See [SOURCES.md](SOURCES.md) for the 81-entry catalogue, [INTERIOR.md](INTERIOR.md) for the artwork/equipment and room inventory, and [VALIDATION.md](VALIDATION.md) for checks, independent reviews and outstanding coverage.

Open `/berghain/model.html` through the project's HTTP server. The current local preview is `http://127.0.0.1:49683/berghain/model.html` while that server remains running. The page is direct-link only, with `noindex, nofollow`, and has no ordinary game-navigation entry. It is not access-controlled.

The study includes the exterior shell, foyer, main floor, Panorama Bar, Säule, Halle and garden. Exterior orbit, walking with keyboard/touch, room selection, three traversable stairs, graphics recovery and GLB download are implemented. Asset authority: `assets/models/berghain/layout.mjs`; renderer assembly: `model.mjs`. Regenerate with `node berghain/export-model.mjs`. The current GLB is 6,713,940 bytes / 40,112 triangles, with 39 material/mesh groups and 12 embedded original PBR texture maps. It combines original study geometry with Berlin open-data roofs and annexes. No downloaded image or artwork is embedded.

Research found an unfinished OpenSCAD/front-façade STL repository, a paid printable STL listing, the original Minecraft creator's withdrawn walkthrough, architects' photographs and eyewitness diagrams. No complete, verified, freely reusable interior/exterior asset has been confirmed. The 2004 application image is only a cover/title-block photograph. The inspected Transformers catalogue (PDF page 70) has an exterior axonometric and site map, without dimensioned interior plans. The official Berlin textured exterior-mesh portal reported maintenance; no tile was acquired.

Official cadastral and LoD2 exterior geometry was acquired from the separate, working Berlin GDI service (G07–G09). Building ID `DEBE02YY200004SX` matches the address in both sources. `assets/models/berghain/survey-data.mjs` preserves four connected volumes, source hashes and a reversible local EPSG:25833 coordinate frame. `berghain-exterior-lod2.glb` is a 26,796-byte, 88-triangle external reference hull; its front edge is 37.949743 m, primary roofs 20.374 / 22.803 m above its ground datum. This is generalised official geometry, not a fresh site survey.

The walking viewer is now calibrated through `calibration.mjs`: the front/join/rear cross-sections fit the two primary volumes; official roof faces, the taller Halle's exposed front wall, and both western annex meshes are included. The annexes remain closed unmodelled volumes; their internal use is not inferred. The unsupported rooftop box is removed. Interior floors remain provisional, and visitor radius 0.28 m / eye height 1.68 m are unchanged. Mapped polygon floors/solids follow the same geometry, solid heights derive from their actual rendered matrices, and discrete tread undersides supplement the smooth stair support. One inferred western Halle column/beam line was moved clear of the full provisional stair lane. It is not a verified structural grid. Camera reset uses actual shell/annex bounds.

Reproduce extraction after downloading the source files listed in `survey-data.mjs`: run `python berghain/import-berlin-lod2.py`, then `node berghain/export-model.mjs --survey`. The standalone official reference remains separate from the combined walking study export. The shared exporter handles ordinary and instanced meshes. Current combined study SHA-256: `1fbb211bc0f63c54334b27bbe29b813e2b648146c699d4d4d434f1e4e734674f`.

The façade now has separate glazing tiers, steel frames, masonry bands, physical inset panels, sills and attic vents informed by P03/P07–P10. Panels use an estimated 7 cm authoring depth (about 5.9–6.0 cm after calibration), with closed solid rims. All three elevations still repeat estimated bays. Original tileable colour/normal/roughness maps add approximate grain; unique site weathering and decay are not established. Regenerate them with `python berghain/build-materials.py`. Roofs retain their simpler material. A12/A13 and I11 add primary Lab.oratory and Panorama references, including the missing extra lounge level and historical lighting/acoustic treatments.

Next work: prioritise the missing interior design using INTERIOR.md, including distinctive furniture, art, room connections and sound-system geometry; model Lab.oratory, the extra Panorama lounge level, bathrooms and services. Verify circulation/elevations rather than adding unlocated objects. Per-elevation openings, roof/rear detail, smoking bridge and observed weathering remain on the full-goal checklist. The retained 44 m authoring coordinates are transformed at asset construction and are no longer the shipped exterior width; do not treat those old coordinates or inferred partitions/repeated façades as measured facts. Primary exterior data does not establish room dimensions or which annex contains a particular interior use.

Repository: `C:/Users/cogpsy-vrlab/Documents/GitHub/GermanySimulator`. The local `codex/neighborhood-walk-talk` branch has no initial commit/remote and substantial pre-existing staged work. Publish only the Berghain scope and builder allowlist against verified `GeorgeFejer91/GermanySimulator` remote `main` using an isolated bare repository/index under ignored `output/`; fetch/push by explicit repository URL because this bare repository also has no named origin. Preserve the original index and game work (2,285 staged entries at this checkpoint). Runtime commit `9c842707e588e5e218109a0f63eb51c73a472b1f` is confirmed deployed: **https://germanysimulator.de/berghain/model.html**. Pages workflow `39977033051` succeeded; 31 published-file comparisons and two live browser tours passed, with desktop/Android emulation distinguished in VALIDATION.md. The expanded research inventory is a subsequent documentation-only publication. The shared root handoff remains authoritative for unrelated game work.
