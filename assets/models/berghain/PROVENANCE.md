# Berghain architectural study

Study geometry authored for this project on 2026-10-23–24, calibrated
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

## Source-derived interior furniture

`interior-fixtures.mjs` replaces the former foyer/Panorama furniture boxes with
35 original assemblies observed in architect photographs I08/I09/A13 and the
lighting installer's historical record I11. Includes concrete channel-section
seats and cushions, an illuminated L-shaped counter, round metal stools with
splayed legs/foot rings, bottle rack, DJ table/decks/mixer, low banquettes,
ribbed foyer pendants, three-way Panorama shades and acoustic enclosures with
actual openings cut through extruded metal grille plates.

Forms are reference-based; dimensions, counts, placement and continued presence
are inferred. The bar top is 1.13 m above the provisional room floor, stool tops
.77 m, foyer seat cushions .48 m. Furniture is assembled in metres after exterior
calibration to preserve these human-scale dimensions. The root GLB extras retain
per-assembly source IDs, anchors, dimensions and uncertainty. Collision follows
visible boxes/rails or declared conservative multi-part furniture bounds.

All geometry and flat/PBR material colours are authored here, with no embedded
reference photographs, Tillmans image, gallery artwork, manufacturer CAD or
brand-label texture. This does not establish the current sound system, named
artworks, missing upper lounge or measured room layout. The named artworks and
unmodelled rooms remain required in `berghain/For-AI/INTERIOR.md`.

## Main-hall sound-equipment candidate

Original speaker geometry uses the product envelopes in manufacturer drawings
S07–S10. Cabinet walls, flares, phase plugs, ports and handling/connector details
are reconstructed here; internal acoustic geometry is approximate. Component
dimensions survive as metre-based metadata in GLB root extras. No manufacturer
CAD, PDF image, product photograph, logo or audio recording is embedded.

The 44-component arrangement follows community report S05, repeated by blog S06;
those are one component-information chain. Later S11 supports the bass counts
but contains conflicting identifiers and a changed overhead-activation claim.
Four triple-F218/twin-Evo stacks, two satellites and a six-F124 wall replace the
former flat-horn black boxes. Placement, colour, mounting detail and continued
presence are inferred. The two old suspended DS210/DS15 assemblies and actual
Panorama Studt rig remain required work. This is no acoustical simulation or
verified current installation inventory.

## Original material maps

`berghain/build-materials.py` generates six tileable families (mineral, stone,
metal, aggregate, fabric, leather), each with a 512×512 base-colour, roughness and normal PNG.
They use seeded noise with no photographic pixel input. `textures/manifest.json`
records parameters, image sizes/hashes and the unmeasured microrelief estimates.
Regenerate with `python berghain/build-materials.py`, then the normal GLB export.

The viewer retains instanced geometry and projects UVs in model metres with
2 m architecture / 8cm fabric / 4cm leather repeats. The portable asset bakes equivalent UVs and embeds/reuses the same
18 PNGs. Base colour uses sRGB; roughness/normal use linear data. Roughness is
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


## Exterior site and envelope additions

`landscape.mjs` and `exterior-details.mjs` add original instanced geometry before
the existing calibration. Broad entrance paving/queue, planted screening and
mesh service-edge observations follow P07–P10; SITE01/SITE02 establish dated
garden use and described bamboo/mounds. Exact garden/site layout, plant species,
rear decorative bays, membrane seams and sparse runoff marks remain inferred.
They are not surveyed or photo-textured assets. Model/GLB extras retain sources
and uncertainty. Low opaque planting and physical furniture share calibrated
collision bounds; high leaf crowns are nonblocking above body height.
The smoking bridge is explicitly omitted pending its attachment and endpoint.

## Panorama figure study

`climber-geometry.mjs` reconstructs a first figure study of Anna Uddenberg's
*CLIMBER (Angel Kiss)* (2020), credited to the artist. ART02's inspected gallery
photograph informs raised hips, folded/hanging legs, quilted clothing, olive/blue
panels, bindings, zipper teeth, metal eyelets and blonde hair. ART03/ART13 place
it on the Panorama counter. This is original reconstruction geometry, not a
scan, copied mesh, artist texture or exact replica. Hidden surfaces, garment
cut, hardware positions and bar location are inferred. The gallery's
160×130×110 cm retains its unknown axis/support scope; the modelled figure is
approximately 1.62 m high, 1.58 m long and 1.00 m deep. The studio barrel, table
and stool are excluded. Artworks and photography remain credited to their creators.

`artworks.mjs` anchors the figure to the existing inferred Panorama counter.
Eleven collision bounds follow the visible segments and attached details.
The hanging boot rests on the floor; sampled visible vertices do not enter
the counter solids. Indexed meshes retain smooth normals. The new fabric
family contains three original seeded 512px maps from the existing material
generator: twill colour, normal and roughness at an estimated 8cm tile scale.
Source and native GLB share this PBR path. No reference photograph is embedded.

This is an initial pose/material study. Figure anatomy, garment fit, hands,
hair and fine photographic fidelity remain refinement work; current installed
placement and continued presence are unverified. It does not complete the
realistic artwork or the full architectural goal.

## Upper Panorama lounge and Felsenland

`upper-lounge.mjs` adds the previously missing second lounge level documented
by the architect (A13). Newly inspected primary gallery views I19 show its access
stair, steel balustrades, glazed enclosure, radiators, low ceiling and angular
upholstered seating. I16/I17/I20 identify Hermann August Weizenegger's 2010
*Felsenland*. The original reconstructed furniture has raised plinths, padded
edges, angled chaises and dark/plum leather; no photograph or designer mesh is
embedded. Five assemblies and their dimensions/arrangement are estimates from
one complete furniture view, not fabrication drawings or a contemporary survey.

The new floor is at 16.35m, 3.10m above the existing provisional Panorama floor,
with an estimated 19.00m ceiling. Its footprint and relationship to the current
building coordinate frame remain inferred. It has a continuous fourth stair,
physical floor/treads/rail collision and a room viewpoint through the same viewer.
The former generic bench nearest the approach is shortened to keep the route
clear. Hanging acoustic enclosures are kept in the lower Panorama room, outside
the mezzanine. A chair is positioned clear of the existing inferred column grid.

The glass frame is modelled; Marc Brandenburg's documented printed artwork is
not reproduced. Old rectangular platforms and a horse seen in dated/outtake
photographs are excluded. I18's historical corridor-lighting image informs the
research; no changing lighting programme is claimed. The three new original
512px leather maps use seeded grain at an estimated 4cm repeat with 0.07mm
microrelief. Seam/tailoring detail, artwork imagery, exact circulation and
present-day retention remain fidelity work. This is an additional reconstructive
study, not completion of the full realistic building.

## Panorama ceiling and exposed services

Original geometry reconstructs forms visible in the architect's I19 gallery
views15/16: pale staggered acoustic clouds, transverse beams, cast radiators,
parallel conduit and tube diffusers. The estimated ceiling soffit is17.95m above
site datum,4.70m above the provisional13.25m Panorama floor. Sixteen panels and
three24-rib radiators are authoring choices; no dimensioned ceiling/reflected
plan or contemporary fixture inventory is claimed. Existing DJ/light/acoustic
suspensions now terminate at this ceiling. The acoustic clouds are separated
from its beams; visible radiator ribs, headers, feet, supply pipes and protruding valves have
paired body solids, as do the low vertical conduits and their clamps.

This adds no image inputs or texture families: the same18 original shared maps
and existing instanced renderer/native GLB pipeline are used. Later ART04 wide
installation photos identify switchgear views01/03/04/05 as Klo Bar, correcting
the initial older-Panorama-counter interpretation. The2010 Panorama redesign
does not establish that this separate bar was removed. Current retention,
ceiling heights, service routes and exact counts/placement remain unresolved.

## Klo Bar and sanitary architecture

Original geometry based on ART04/ART14/I19 and architect's I21 toilet gallery:
red enclosure, retained switchgear/mesh/staff gate, segmented glass display
cases, splayed stools and glass-block back wall. Cases await the actual Together
figure sequence; no substitute is presented as the completed sculpture. The
artist documents9m of cola-flavoured sugar preserved with polyurethane,2013.
No photograph, artist-owned scan, artwork image or CAD is embedded. The Together
anatomical base described below is a modified, explicitly licensed CC0 mesh.

Four steel WC cubicles with two open doors, hollow steel pans, flush plates,
paper holders, protected tube lights and a double-sided trough/core reconstruct
observed sanitary forms. Stainless taps, exposed traps and caged lights/hand
dryers use existing batching and the same18 original maps. I21 mixes2009/2013/
2015 projects; individual floor/date assignment is unresolved. Floor6.65m,
ceiling9.80m, western placement, room connections, counts, dimensions and
currentness are estimated. This is a reconstructive study, not a measured
current floor plan. Complete artwork, etched imagery and exact
contemporary layout remain required by the full-building objective.

## Together: partial relief study and optical material

ART04/ART14–16 identify Joseph Marr's2013 work in the Klo Bar:9m of cola sugar,
preserved with polyurethane. The four authored display paths total9m, but their
allocation, nine depicted figures, complete order, hidden surfaces, case sizes
and optical values are inferred. This is a partial visual study, not the artist's
scan or a verified complete composition. Full narrative, satyr/animal masks,
original ornamental arrangement and contemporary installation verification remain.

Continuous anatomical surfaces derive from MakeHuman core CC0 data, pinned at
a8bc2d54ff0ac92e78ff71431b1023eda42bf482. Individual base/morph/skeleton/weight
hashes and source URLs are in anatomy-provenance.json; the full asset licence is
licenses/MakeHuman-CC0.txt. No MakeHuman application source is imported. Original
offline posing, torso closure/relief adaptation and assembly create the study;
this generic anatomical basis does not establish the actual subjects' likenesses.
The earlier separated-primitive prototype was rejected and is not the asset here.

Original poured-base contours, ivy and a cast pipe/valve fragment supplement
the reclining forms. ART15 documents ivy and historical Baroque ornament;
ART04 view22 shows the industrial cast detail. Placement and detail are authored
estimates. The rear case follows installation08/09; all pieces remain within the
glass and protected bar envelope, with no new visitor collision behavior.

Sugar uses shared original colour/roughness/normal maps and a separate UV1/G
volume atlas. The atlas approximates vertical thickness of the two posed bases;
small decorative elements use20mm. It is not exact oblique ray thickness or
measured material. KHR_materials_transmission/volume/ior/clearcoat and UV1 are
retained in the GLB, including clearcoat normal detail. The viewer supplies an
original512×256 reflection-panel environment; other GLB viewers supply their own
lighting. This is not a site HDR capture. The portable asset embeds22 maps; the
reflection environment is a viewer lighting aid. Case glazing is a separate clear
material rather than the upper lounge's heavily tinted enclosure material.

Regenerate using the existing asset pipeline (Python authoring needs NumPy/Pillow):

```powershell
python berghain/build-together.py --download --asset
python berghain/build-materials.py
node berghain/build-together-volume.mjs
node berghain/export-model.mjs
```
