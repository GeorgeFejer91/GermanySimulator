# Berghain architectural study

The initial frontage candidate was held after Physics review found pre-existing
decorative rustication strips spanning the open entrance. This repaired candidate
trims those strips at the existing jamb aperture, including above head height.
The original rejected root/freeze is preserved. Ground support, jambs, door and
interior routes remain unchanged; fresh body/mesh and rendered checks are required.


## Entrance elevation — 25 October 2026

P02 (Jane Mejdahl, 10 June 2007, CC BY-SA 2.0) and P16 (Darkroomduck,
31 December 2017, CC BY-SA 4.0; later rotation/tonality correction by Rio65trio)
support twelve openings, larger end fields, nine attic grilles and seventeen
upper vents. See SOURCES.md for original pages. Counts are observed; normalized
spacing, widths, heights and construction remain estimates. Research photographs
are not embedded in the model. The six shuttered windows are a Panorama
registration lead only; shutters/floor relocation are not added in this change.

Current portable asset: 765,428 triangles, 203 mesh/material groups, 59,176,088
bytes and 25 embedded original maps. No new texture family or light is added.

The first counter-wall candidate was held after independent Physics review found
an older generic intermediate beam intersecting all Panorama stair lanes, with
only1.303 m headroom at the settled counterexample. This repaired candidate
retires that single unregistered beam-grid placeholder (authored x=-1,y12.95,z-6).
G21/G23 show a clear rising stair, but do not establish exact structural dimensions.
Other beams, columns, floors, stair geometry and routes are retained. No beam cut
or new structural member is invented. Initial rejected evidence is preserved at
output/berghain-counterwall-physics-review-rejected-beam.md; repaired acceptance
requires new source/native, five-lane body/headroom and actual camera checks.


### Panorama counter backdrop — 25 October 2026

I19 views06/15/16 support the opaque counter-end wall and high segmented band.
The separate interior lining, closed shallow recess and seven perforated panels
are original geometry. Their dimensions and exact placement are estimated.
The exterior is unchanged; no private through-route or present artwork is inferred.
The portable asset now contains 764,144 triangles, 203 mesh/material groups and
59,050,184 bytes, retaining the same 25 original embedded maps. Existing physical
fixture dimensions and material tones are preserved. See INTERIOR/VALIDATION.


### Panorama frontage and public connections — 25 October 2026

U02, A13/I19 views 06/07/15/16 and V05 support an entrance-facing Panorama wing,
with the long bar across the window wall and the DJ at the opposite end. The
room, acoustic ceiling, radiators, furniture, CLIMBER, ordinary WC and upper
lounge now move together, preserving the physical size of each fixture.
The ordinary WC stays below the lounge, distinct from the ground cloakroom WC,
main Klo and the unregistered historical wardrobe/FLINTA trial room.

The main stair has matching visible rails, body barriers and landings, with an
approach around retained columns. A guarded passage at the hall edge reaches
an upper smoking doorway through both facade layers. The existing main-floor
tower entry and two enclosed flights remain. The upper lounge shifts 0.4 m and
the nearby lower seat 1.4 m to clear the retained column and stair approach.
Room dimensions, floor heights, passage footprint and door positions remain
estimates. No backstage room or private access route is inferred.

Localized night cues follow the moved rooms, WC approach and passage within
the existing three scene spots and two shadow maps. The main-bar end uplight
now reaches plaster below the Eisbar slab that intercepted its previous aim.
The illumination is an appearance study, not a surveyed contemporary show.

The floor/window section still conflicts with I19's low-sill tall windows.
The repeated facade tiers are also estimated; this change does not establish
a measured floor datum or bay-specific window pattern. Backstage and FLINTA
locations, present inventory, artwork fidelity and other open audit findings
remain unresolved. The full architectural goal stays ACTIVE.




The portable model is 56,993,976 bytes, 746,948 triangles and 202 mesh/material
groups, reusing 25 original embedded maps. Dynamic lighting remains viewer-owned.
No source photograph or printed artwork pixels are embedded.

## Karhard architecture and source limits

The subsequent Karhard/cutaway increment adds three original modules:
`architectural-circulation.mjs` (folded main stair, Eisbar and smoking/escape
tower), `main-hall-details.mjs` (architectural fixtures and maintenance access)
and `ground-sanitary.mjs` (cloakroom-adjacent ground WC). The full reference
mapping is `berghain/For-AI/KARHARD-MAPPING.md`, with 61 image identities and
hashes in its companion JSON. No photograph pixels are used in these meshes.
Photographed forms and cutaway floor/adjacency claims are separated from
estimated dimensions, placement and currentness in exported metadata.

Smoking registration follow-up: the long axis now projects outward in the
entrance-side region, following G30/31 and P08–10. The old rear-quarter placement
was an unsupported reading of a background annex. Opaque entrance-facing
cladding and the glazed reverse follow the same rising stair envelope. The
selected bay, size, heights and current retention remain estimates.

Smoking main-floor access and lower escape are modelled provisionally; its
upper attachment to Panorama is unresolved and closed. Backstage, lift and
FLINTA locations are unassigned. The ground WC's three cubicles are illustrative,
not a recovered fixture count. Visible maintenance stairs do not create a public
backstage route. Viewer-only `architectural-lighting.mjs` adds steady practical
cues for the reconstructed routes while retaining the three-light reuse limit.

The inferred wardrobe-to-foyer doorway clips the existing glass run while preserving both leaves and its header. The non-public maintenance stair does not establish a backstage location.

## Entrance forecourt and admission room

The 24 October 2026 entrance increment uses ENT01's three user-supplied
photographs and Google-discovered ENT02/ENT05 exterior references. Original
instanced geometry depicts close tubular switchbacks, portable stickered
barriers, cobbles, a green post, side chain, narrow recessed door, wall lamps,
layered paint and the photographed upright ring/brace structure. Paint marks
are original gestures; no reference photographs, identifiable visitors or
copied readable tags are embedded. The ring's artist/title is not asserted.
ENT02 is dated 2017; the user photographs' capture dates remain unknown.

ENT03/ENT04 firsthand accounts support a small room left of the entrance,
inspection before payment, and a plastic-strip return toward the cloakroom.
They do not establish a measured plan. Room footprint, ceiling height, two
inspection counters, cashier orientation, fittings, materials, light output
and current arrangement are authored estimates. The 1.35 × 2.45 m doorway
is a human-scale reconstruction choice, not a surveyed dimension. The ring
assembly uses an explicitly conservative full footprint for body collision.

`admission.mjs` owns the source distinctions, calibrated route and primitives.
The study adds 2,000 instances / 28 batches / 31,056 triangles, reusing existing
surface maps. Its transparent curtain is visibly parted and body-clear.
Viewer lighting is an authored steady appearance study; adaptive room cues
and the interactive door are runtime behavior, not baked into the GLB.

Study geometry authored for this project on 2026-10-23–24, calibrated
to Berlin's official exterior geometry and combined with its roof/annex meshes.
`layout.mjs` is the authoritative metre-based architectural study; `model.mjs`
assembles its reusable geometry and materials. Regenerate the portable export:

```powershell
node berghain/export-model.mjs
```

## Separate Panorama sanitary area and night lighting

The 24 October 2026 increment adds an original sanitary enclosure beneath the
existing upper lounge. A13/I21 establish separate Panorama facilities; V05's
2025 firsthand account supports the lounge-above-toilets relationship. Its
13.25 m floor, footprint, three cubicles, trough and opening are estimated,
using the existing sanitary geometry/material vocabulary. I21 mixes several
refurbishment dates and does not assign each photographed fitting to a floor.
Main-floor Klo remains separate. All 46 added parts use a fixed tone; retained
geometry and instance colors remain unchanged. No reference pixels are shipped.

`berghain/night-lighting.mjs` supplies viewer-only steady night cues from I23/I24
and L01's broad lighting vocabulary. Positions, intensities and colors are
authored appearance parameters. It removes indoor sun/daylight, keeps local
colored illumination and shadowed practical light, and retains daylight for
exterior inspection. The portable GLB retains geometry, uncertainty metadata
and its existing bar lights; it does not embed the viewer's adaptive cue rig.
No current club-lighting program, photometry or IVL rig layout is asserted.

The smoking tower is now modelled by the Karhard increment above. Its upper
interior attachment and backstage placement remain unresolved in
`interiorTopology`.

## Halle: provisional post-2022 structure

Architect A05 documents three floor voids, two single-flight cast-in-place
concrete stairs and a WC under the western stair. Structural engineer A06 and
the inspected architect/engineer photographs support massive rectangular
piers, haunches, concrete stair bodies, framed mesh guards and rectangular
tapered hoppers. Several photographs belong to the same sequence; these are
not independent measured surveys.

Original `halle.mjs` replaces the old long steel flight and open gallery with
three actual bounded slab openings, connected perimeter/bridge supports, two
concrete flights, landing guards and an inferred west under-stair WC. Lower
floor remains0.05m; the upper4.25m datum is a photographic proportion estimate,
not a recovered section. Flights rise4.2m over7.2m, with24 nominal risers and
2.4m clear width after the existing nonuniform site calibration. The16-position
pier grid, eight tall northern piers, three hoppers, all exact coordinates,
service runs, wall patches and WC dimensions/fittings remain authoring
hypotheses. They must not be described as a measured contemporary inventory.

Mesh guard panels have real open ribbon geometry and separate conservative
body collision. Concrete stair treads, closed risers, nosings and waists are
visible geometry; existing ramp support supplies continuous walking. Retained
parts keep their original matrices, instance colours, materials and collision.
Existing original material maps are reused; no reference-photo pixels, new
map family, light, renderer or dependency is added.

A05 describes a facade escape opening aligned with the eastern stair; it does
not explicitly register an east-facade position. That opening is deliberately
unmodelled and identified as missing in metadata. Every shell wall, the
official hull and the sealed north club boundary are preserved. The Halle
selector and its local walking circuit do not establish a natural entrance
from the exterior or nightclub. The WC is a provisional enclosure, not an
accessibility certification. Exact floor/plan registration, exit, full surface
wear, lighting and current condition remain open.

Each orthogonal stair landing physically laps3cm into its affine bridge slab;
the rendered/collision/support boundaries match. This closes an uncovered
millimetre wedge found by independent full-body testing at small walking steps.
The walkthrough now uses the user's requested first-person camera at1.68m eye
height, fixed60degree vertical lens and direct yaw/pitch. It constructs no
visible player mesh. The existing1.8m physical body, navigation and entrance
controller remain. Earlier third-person fitting is superseded; its failed
landing/head-occlusion evidence remains recorded. No architectural geometry is
faded to expose the visitor. Original synthesized footsteps use authored room
reverberation, not recorded or measured club acoustics.

## Säule concrete installations

A15's hero and three main gallery photographs show large concrete piers,
flared upper forms, local corbels, continuous dark metal belts and padded
concrete seating. Four further outtakes document construction, glass and steel
frame fabrication. I24's installer photographs corroborate the belts and their
upper/lower wash, plus bar/partition details not yet reconstructed here.

Original geometry in saule.mjs adds six1.6×2.1m lower pier bodies, flared caps
meeting the existing6.25m floor underside, two projecting corbels, four padded
concrete seats and four-sided channel housings with recessed upper/lower
lenses. Their grid anchors, dimensions and counts are authoring estimates;
the preserved room heights and wide grid are not surveyed or established by
these photographs. Existing upper structure remains unchanged. Six short red
placeholder strips are removed; three outer-row strips remain unresolved.

Concrete, metal and upholstery reuse this project's original maps and pad
geometry; there are no new texture pixels or copied photo content. The
concrete's cool base tint compensates the warm aged map. This is generic wear,
not reproduction of the photographed site-specific pits, joints and stains.
The belt channels have actual webs, back plates, fascias and mounted lenses,
but their full cast wash and changing programme remain unimplemented.
No new light, shadow map, renderer or runtime is added. The exact footprint,
separate entry, full bar/services, photometry and contemporary condition remain
open reconstruction work. Manufacturer CAD research L01–08 is unplaced and
unshipped; it does not identify these custom Säule luminaires.

The earlier Säule release used a bounded third-person orbit and animated-human
frustum fitting. George subsequently requested first person only. The current
candidate uses the eye-height camera described above; those historical avatar
checks do not establish its first-person acceptance. Opaque piers and their
body collision remain unchanged.

## Bar plaster and practical wall wash

I23 views12/13/16 show mottled cream plaster and localized warm upward wash
along the bar pilasters. Dedicated plaster reuses this project's original
seeded aged color/roughness/normal maps at their existing metre scale. This is
an approximate worn finish, not a photographic site scan or unique damage map.
No source-photo pixels or new texture family are embedded.

Six small uplight housings/lenses, attached steel wall brackets and warm spot
lights are original inferred geometry/lighting. Positions, count, fixture design, color, candela, cone and
range are appearance parameters; the photographs establish neither exact
equipment nor current operation. Lights cast no new shadow maps. The portable
GLB preserves them through KHR_lights_punctual with linear RGB, candela, range,
cone angles and world direction. Complete photometric or shadow fidelity is
not established. All original geometry/solids and instance tones are retained.

The source surface projection now transforms normals by inverse transpose,
matching the exporter's metre-UV calculation on unevenly scaled curved shapes.
This corrects a source/export texture-plane mismatch exposed by relief wear;
the native texture images and UV algorithm are unchanged.

## Bar roof construction and lower relief relationship

I23 views11/12 show concrete cross-beams enclosing inset blue gridded panels.
The old flat ceiling is replaced with original geometry: four inferred roof
bays, concrete framing/backing and a six-by-four pane lattice per bay. Lowest
roof-beam underside retains the nominal11m height; panes sit0.44m higher.
Counts, dimensions, blue palette and present-day state are estimates. Opaque
blue appearance materials represent the photographed color without claiming
verified skylight glazing or an operating lighting installation. There are no
new textures, lights, render passes, dependencies or source-image pixels.

Blue panes and lattice fit around retained column profiles rather than running
through concrete. The concrete roof framing/backing deliberately meets those
columns. I23 views12/13/16 show lower circular reliefs fully above the rear
worktop. Their inferred center moves from1.02m to1.90m above the study floor,
and the lower window sill from1.85m to2.80m, preserving actual deep reveals.
These repair relative composition; they do not establish a surveyed elevation.
Upper-row ratios, exact bay rhythm, heavy plaster weathering and illumination
remain open fidelity work.

## Historic interior bar facade and room ceiling

Primary architect interview A07 describes an approximately11m-high bar room
with a former exterior facade now inside the building. It gives no floor datum
or measured section. I23 views12/16 show recessed windows, circular reliefs,
tall pilasters and stepped trim. Original geometry extends main-bar.mjs with
five inferred bays, ten profiled medallions, framed window recesses and ceiling.
Nominal11m clear height uses the still-inferred6.65m floor datum. Bay dimensions,
counts, ornament profile, absolute placement and contemporary condition remain
estimates. The measured exterior hull and all15 columns remain unchanged.

Service cabinetry/worktop is notched around the actual new pilaster bases;
sinks move to the inferred window bays. The earlier generic longitudinal beam
blocked the upper relief row, contrary to these photographs. Its bar-room span
is removed while both outside sections remain. This corrects inferred geometry;
it does not assert a new measured structural plan. Existing concrete supports
meet the added room ceiling as deliberate structural joints. No photograph
pixels, new textures, runtime dependency or render pass are introduced.

## Main long bar and hall-facing glass screen

Original geometry in main-bar.mjs uses architect I23 lightbox views11–14/16:
rounded dark counter, two ribbed luminous bands, concave metal stools and tall
steel/glass screen. Seventeen primary views were inspected; eleven selected
research originals retain their watermarks and acquisition hashes outside
shipped assets. No photograph pixels are embedded. The photographed glazing
separates the bar from the main hall; it is not an exterior-window reference.

The1.12m counter,0.76m seats,10.7m screen,14m length,18 stools and overall
placement are estimated. Existing calibrated floors, stairs and columns remain
unchanged; segmented cabinetry fits the retained piers. Glass panels, furniture
and curved return have paired body solids. Countertop fitting identity and
contemporary installation dates are unverified. Service details are inferred;
exact ornate wall, equipment, materials and measured room topology remain open.
The same assemblies and mainBar uncertainty metadata are exported in the GLB.

## Lab.oratory: lower-floor rooms and photographed industrial fittings

A12/I22 document studio karhard's2005 conversion and ten expanded project
photographs by Stefan Wolf Lucks, inspected24 October2026. Original geometry
reconstructs a pipe/gauge counter, T stools, insulator pendants, barred sling
cells, industrial bunks, brick alcove/low opening, cast-iron sanitary screen,
window bench and the photographed small sanitary descent. A15 documents
Säule's separable/connected steel-glass elements; the chosen opening position
and raised state are inferred. No source image pixels or decorative graphics
are embedded. All new meshes and surface maps are authored for this project.

The western lower-floor fit, floor.05m, soffit4.15m, beam underside3.60m,
1.20m sanitary drop, footprint,
counts, dimensions and arrangement are authoring estimates within the calibrated
hull. A former slag/coal cellar below Berghain does not establish an entire
underground storey. The photographed stair's relative drop is reconstructed
with a real opening through both overlapping slabs, seven treads and a landing;
actual absolute elevations and complete room connections remain unverified.
The lower soffit follows the photographed compressed industrial interior; its
height is an estimate, not a measured dimension. The raised gate and upper
mechanism sit wholly on the taller Säule side of the inferred connection.
The external Lab entrance, hidden rooms, full sanitary inventory and current
installation are not established. This is a partial architecture study.

Fittings are arranged around the retained structural columns. Hollow pipe ends,
gauge graduations, sagging sling surfaces, interleaved chain links, brick bond,
cast rosettes/leaves and an open stair guard are actual geometry. The casting
ornament and finish simplify the photographs and are not a recovered original
casting pattern. The low brick opening is not a standing-height door.
Each sanitary-screen post has a linked solid; panel clearance includes the
shallow cast ornament without blocking the open L-shaped bay.

One original seeded aged-plaster/oxidation map family adds broad stains and
surface relief without photographic input; its2.4m tile and1.4mm relief are
estimated. All23 previously accepted image files retain their hashes. There
are26 shared runtime maps including thickness/environment,25 embedded material
maps in the portable GLB. Standard source/native lighting and rendering remain
authoritative; no new renderer, physics engine or runtime dependency is added.
The standalone viewer now reuses the game's existing two-job asset admission
queue for all surface images. Hidden pages defer optional starts until visible;
queued work for a disposed model is skipped and late maps are disposed.

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


### Eisbar mezzanine correction — 25 October 2026

I03/I04 describe a mezzanine containing the ice-cream bar; these are one dated
eyewitness evidence chain, not two independent surveys. Karhard G27–29 show a
guarded opening, tiled L counter, narrow onward ascent, relief/window backdrop
and overhead crane. U01/U02 corroborate an elevated bar-end relationship.
The former main-floor counter is replaced by a guarded intermediate platform,
lower approach and separately bounded upper continuation. Counter, service
furniture, crane, room arrival and local night cues move together.

The intermediate datum 9.95 m, platform footprint, selected end bay, aisle and
stair coordinates remain authoring estimates. This corrects the supported level
relationship; it does not recover a measured section or present-day inventory.
No Panorama doorway or backstage connection is inferred from the upper landing.
Panorama/frontage registration, exact upper WC/FLINTA room and backstage remain
unresolved. The full architectural goal stays ACTIVE.

The portable asset is 56,590,328 bytes / 742,928 triangles / 202 mesh-material
groups, reusing the existing 25 original maps. Geometry and metadata match the
procedural model; dynamic local lighting remains viewer-owned. No source-photo
pixels, new dependency or texture family are added.
