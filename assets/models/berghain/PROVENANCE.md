# Berghain architectural study

Procedural study geometry authored for this project on 2026-10-23, calibrated
to Berlin's official exterior geometry and combined with its roof/annex meshes.
`layout.mjs` is the authoritative metre-based architectural study; `model.mjs`
assembles its reusable geometry and materials. Regenerate the portable export:

```powershell
node berghain/export-model.mjs
```

`berghain-study.glb` contains the same model with PBR materials and vertex tones,
embedded original textures, and no external files or decoders. `manifest.json` records
its size, hash and bounds. Berlin open-data roof and annex geometry is embedded
under the licence recorded below; no third-party photo or artwork is embedded.

Sources, their dates and known gaps: [research catalogue](../../../berghain/For-AI/SOURCES.md).
Principal visual references: studio karhard's building/Halle project pages,
Moisés Osio's explicitly approximate spatial diagrams and dated Wikimedia
exterior photographs. Observational references were not traced into photo textures.

This is a **provisional reconstruction**, not a surveyed or photorealistically
complete model. Main exterior mass dimensions follow the official cadastral/LoD2
data; storey elevations, column grid, windows, partitions, furniture and equipment
positions remain approximate. An 18 m turbine-hall
volume and the separate Halle's documented 21 m height are contextual anchors,
not proof of the rest of the geometry. The floor/room layout deliberately remains
editable pending measured evidence. Repeated façades on less-documented sides,
garden equipment and ancillary geometry are inferred.

Modelled for exploration: exterior, foyer/cloak counter, main hall/bar,
Panorama room/lounge, Säule, northern Halle and garden. Missing/unverified:
Lab.oratory, bathrooms, services, accurate floor interfaces, several corridors,
fine roof detail, surface weathering and present-day lighting/audio installation.
Room selection changes viewpoint directly; it does not prove a surveyed route
between all rooms. The viewer is unlisted and does not change the main game.

## Photographic façade refinement

The current façade uses observations from Ben Kaden's 2019 detail (P03) and
Gunnar Klack's 8 August 2024 entrance/corner views (P07–P10). Separate glazing
tiers, spandrels, physically inset panels, projecting sills, steel frames,
pilasters and two attic vent rows replace the continuous-glazing approximation.
Opening heights, widths and the repeated bay counts remain photo estimates;
the same pattern on all three façades is not a verified per-elevation survey.
Ground windows have separate masonry/glass solids. Exterior west-side offsets
now point outward. Interior floor elevations and entrance width are retained.
Panel insets use an estimated 7 cm depth and four solid masonry rims; this is
not a measurement extracted from the photographs.

These references inform original geometry and material appearance estimates.
No photograph, graffiti or artwork is embedded. The smoking-room bridge and
fine roof/rear details remain missing. The source catalogue records individual
image licences and research-only copies separately from shipped assets.

## Original material maps

`berghain/build-materials.py` generates four tileable families (mineral, stone,
metal, aggregate), each with a 512×512 base-colour, roughness and normal PNG.
They use seeded noise with no photographic pixel input. `textures/manifest.json`
records parameters, image sizes/hashes and the unmeasured microrelief estimates.
Regenerate with `python berghain/build-materials.py`, then the normal GLB export.

The viewer retains instanced geometry and projects UVs in model metres with
2 m repeats. The portable asset bakes equivalent UVs and embeds/reuses the same
12 PNGs. Base colour uses sRGB; roughness/normal use linear data. Roughness is
packed into G, with B=255 preserving the material's metallic factor in glTF.
Surface images add grain and modest variation; they are not scans or verified
stain/damage maps of the building. Less-documented roofs keep their flat PBR
appearance. Beams, hoppers, glazing, furniture and undocumented installations
retain their current simpler materials and remain fidelity work.

## Official exterior calibration reference

`survey-data.mjs`, `survey-model.mjs` and `berghain-exterior-lod2.glb` preserve
the generalised exterior reference. The walking study now consumes its dimensions
through `calibration.mjs` and reuses its main roof and western annex surfaces.
The data comes from Berlin's official ALKIS WFS and LoD2 tile
[`LoD2_394_5819.zip`](https://gdi.berlin.de/data/a_lod2/atom/LoD2_394_5819.zip),
building `DEBE02YY200004SX`, Rüdersdorfer Straße 70. Provider: Senatsverwaltung
für Stadtentwicklung, Bauen und Wohnen Berlin. The official [download feed](https://gdi.berlin.de/data/a_lod2/atom/)
specifies [Datenlizenz Deutschland – Zero – 2.0](https://www.govdata.de/dl-de/zero-2-0).

Downloaded 2026-10-23; model creation date 2026-03-02, part footprint-date
attribute 2023-03-11. Source URLs, query, SHA-256 digests, original coordinate
origin/axes and limitations are embedded in `survey-data.mjs`. EPSG:25833
horizontal coordinates are rotated/translated into metres; source altitude
35.288 m is subtracted, with the front edge at local z=22 m. No uniform-scale
guess is applied. The vertical datum has not independently been established.

Rebuild with `python berghain/import-berlin-lod2.py` and
`node berghain/export-model.mjs --survey`. `survey-manifest.json` records the
portable file hash/bounds. Four connected part groups preserve roof, wall,
ground and closure surface semantics. The exporter triangulates polygons
and retains their orientation. Flat material colours are illustrative.

This generalised hull has **no interiors, window openings, wall thickness,
equipment or texture**. The cadastral capture is described as digitised from
maps; do not call it a new measured site survey. It constrains the reconstruction's
outer size and massing but does not verify the study's internal floors or rooms.

## Calibration of the walkable study

The editable layout retains its original authoring coordinates; `calibration.mjs`
maps the front, shared-volume boundary and rear to their official cross-sections.
Its frontage is 37.949743 m. Southern and northern roof surfaces are the source
meshes at 20.374 and 22.803 m above the source ground datum. The unsupported
roof-plant box is removed. Two actual western annex groups are closed unmodelled
volumes; no interior use is guessed from cadastral massing.

Floor/solid polygons and camera viewpoints follow the same horizontal mapping.
Boxes bake the mapped axes into instance matrices (minor bilinear cross-terms
are approximated per part); beam endpoints follow the mapping. Wall thickness
and façade detail remain authored approximations. Upper structural members fit
the new roofs, while existing internal floor levels stay provisional. Eye/body
dimensions are not scaled. Source roof/annex surfaces themselves are retained
without that approximation. Actual finer façade, roof, circulation and room
measurements remain required for full accuracy.
