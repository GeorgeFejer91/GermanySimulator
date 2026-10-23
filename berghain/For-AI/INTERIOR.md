# Berghain interior: objects, art and equipment

Checked 2026-10-23. This inventory extends [SOURCES.md](SOURCES.md) and the
reconstruction acceptance in the [owning guide](https://github.com/GeorgeFejer91/GermanySimulator/blob/main/berghain/For-AI/README.md). The user explicitly asked
for the missing interior design, artworks/mannequin sculptures and sound system.
Those are required parts of the full asset, not optional decoration.

The furniture and speaker updates remain provisional. **None of the named artworks
below has been recreated in the model yet.** Research, an object identification
or a manufacturer's CAD download does not establish a finished interior.

## Dates and identity

The working target is contemporary Berghain, with dated historic references.
Use an object's own date and installation history. Do not assemble the 2009
drawings, 2013 film, 2015 book, 2020 exhibition and post-2023 sound system as if
they were one surveyed moment.

The Swedish artist the user described is **Anna Uddenberg**. Primary gallery
record ART02 identifies **CLIMBER (Angel Kiss), 2020**. The curator interview
ART03 confirms a figure placed on the bar; the eyewitness record ART13 names
the work in Panorama Bar. The gallery photograph has been inspected, but it is
studio documentation, not a measured in-situ view. Later continued installation
is reported elsewhere; a fresh operator inventory or equivalent current
placement evidence remains desirable.

The sound-system name is **Funktion-One**. S01 documents a new main-hall system
in 2023 while withholding its exact configuration. S02 identifies **Studt-Akustik**
for Panorama Bar's PA renewal. Keep PA stacks, subwoofers and DJ monitors as
separate objects and avoid conflating the two rooms.

## Artwork reconstruction inventory

All rows are **unmodelled**. Position confidence refers to a room or area, not
an exact model coordinate. Source IDs resolve in SOURCES.md.

| Object | Area / date evidence | Geometry and material evidence | Next modelling requirement |
| --- | --- | --- | --- |
| Anna Uddenberg, *CLIMBER (Angel Kiss)* | Panorama counter, 2020 exhibition; ART01–03/13 | Gallery dimensions **160×130×110 cm** as published. Bent figure, blonde synthetic hair, mixed clothing, shoes and furniture support visible in ART02 photo. | Confirm axis order/support inclusion, bar-relative orientation and contact points. Gallery barrel/table/stool setup must not be assumed to exist in the club. Obtain additional views before claiming a faithful figure. |
| Norbert Bisky, *Vertigo* | Entrance/foyer, permanent since May 2017; ART05 | Actual complete installation image/layout not yet obtained. | Establish canvas arrangement, extent and placement. A different Bisky canvas reproduced in an article is not a texture substitute. |
| Piotr Nathan, *Rituale des Verschwindens* | Historic foyer mural; removed April 2017; ART06, A01, I08 | Historic architect photo shows a large panelled wall work. | Keep as a historical reference. Do not install it as the contemporary foyer artwork. |
| Joseph Marr, *Together* | Klo Bar, permanent 2013; ART04 | **9 m** figurative frieze, cola-coloured translucent sugar preserved with polyurethane; gallery detail inspected. | Build the actual Klo Bar/enclosure first; establish figure sequence and full display form from complete views. A detail image does not establish the installation footprint. |
| Zuzanna Czebatul, *Andrea* | Permanent 2023; ART07/08. Interview places it on the main floor. | Raised muscular arm holding a hammer; green bronze surface visible in the artist's handling photo. | Confirm wall, mounting height, orientation and edition dimensions. Printed *Billie/Chris* or other *Andrea* editions are not interchangeable survey data. |
| Julian Göthe, permanent sculpture | Stair/entrance relationship described by exhibition visitors; permanence confirmed ART03/09/11 | Complete measured form/image still missing. Gallery documents preparatory sketches. | Find sketches or a complete in-situ view; verify title and dimensions. It is not named *The Fat Shadow* on available evidence. That title belongs to a separate exhibition. |
| Wolfgang Tillmans, photographic works | Panorama, historically documented ART09/10/12 | Historical architect bar photo A13 establishes large wall presentation. | Identify the selected-date works, number, print size and positions. Reports of later rotation are a lead, not a verified current hanging list. |
| Marc Brandenburg, glass installation | Panorama/glass area; permanent artist listed ART03/09; historical operator mention ART12 | Glass work is documented; exact panel reproduction/dimensions not acquired. | Locate complete permitted views and locate the glass partition relative to stairs and lounge. |
| Isa Genzken, mirror intervention | Panorama during Studio Berlin; ART13 | Eyewitness account of taped mirror. | Verify exact work identity, dimensions and present-day retention. Do not treat exhibition participation as permanent status. |
| Cyprien Gaillard, toilet-cubicle engraving | In-situ intervention described by curator, 2020; ART03 | Engraving into an existing cubicle surface; no complete panel image inspected. | Establish present survival, actual cubicle face and scale. Model bathrooms/circulation before artwork placement. |
| Christine Sun Kim, floor intervention; Michael Sailstorfer, salt teeth | Studio Berlin exhibition; ART03/13 | Temporary floor/stair interventions described in exhibition records. | Retain as a historical exhibition layer unless continuing installation is verified; not part of the contemporary base by default. |

Artwork imagery, photography and downloadable geometry have separate reuse
status. No artwork image or third-party mesh has been embedded in the live model.
Keep source names and unresolved fidelity in documentation rather than presenting
a generic surrogate as an exact recreation.

## Sound-system references

| Area | Established evidence | What remains unknown |
| --- | --- | --- |
| Berghain main hall | Funktion-One manufacturer statements in S01: original 2005 Dance Stacks replaced in 2023. | The component candidate below replaces generic boxes. Installed revisions, current configuration, rigging and exact room coordinates remain unverified. |
| Panorama Bar | Supplier S02 identifies Studt-Akustik PA. S01 distinguishes Funktion-One DJ monitors from the room PA. | Studt component identifiers, dimensions, hanging hardware, array count and placement; current DJ-monitor configuration. |
| DS210 component reference | S04's actual manufacturer STEP dummy, DXF elevation and 2022 dimensioned sheet. **1.273 m wide × 0.631 m high × 0.741 m deep**, measured from the sheet, not guessed from a photo. | CAD not yet tessellated/rendered; this component reference does not prove a current Berghain installation. Manufacturer document and live webpage bandwidth values differ, irrelevant to the model's external dimensions but not silently reconciled. |

### Reported main-hall component candidate

S05 is the original community description behind S06's component list. Its
thread title does not establish official status. The candidate models its
reported four triple-F218 stacks with twin EL/EH/EL tops, two EH satellites and
six F124 cabinets, **44 components** in total. S11's 2025 discussion is
consistent about bass counts but includes conflicting model shorthand and
claims the retained overhead DS210/DS15 are inactive. Those two suspended legacy
assemblies remain unmodelled; no acoustic behaviour is simulated.

| Component | Inspected manufacturer drawing: width × height × depth | Geometry status |
| --- | --- | --- |
| Evo 6EH | S07: .661 × .656 × .565 m; rear width .260 m | Tapered open cabinet, separate HF/mid-range flares and projecting phase plug; internal contours inferred. |
| Evo 6EL | S08: .661 × .484 × .565 m; rear width .260 m | Tapered cabinet, recessed flare and open port plate; internal geometry inferred. |
| F218 MkII | S09: 1.326 × .496 × .723 m | Hollow rectangular enclosure, twin flares, divider and perforated throat strips. |
| F124 | S10: .702 × .992 × 1.056 m | Portrait-oriented open cabinet, deep flare, actual port openings and lower division. |

Original parametric geometry is in `speaker-geometries.mjs`; `sound-system.mjs`
assembles it in metres after calibration and replaces the generic main-hall
stack/horn parts and collision together. Same instanced renderer and native GLB.
Manufacturer envelopes are verified; installed component revisions, finish,
guards, bracket details, inferred anchors/aiming and contemporary survival are
not. The bass wall's position between the left towers follows dated narrative
topology, not a measured plan. Full realistic-system acceptance remains open.

All four downloaded technical PDFs remain in ignored research storage. Their
URLs, dates and SHA-256 are in SOURCES.md. No manufacturer CAD, drawing image,
photograph, logo or label texture is embedded in the shipped candidate.

S04 acquisition, source links and SHA-256:

| Local research file | Official download | Bytes / SHA-256 |
| --- | --- | --- |
| `DS210-A-Dummy.STEP` | [STEP](https://funktion-one.cdn.prismic.io/funktion-one/dff7b58e-39ed-4794-add6-766fa50dd64e_DS210-A-Dummy.STEP) | 884,278 / `ecdb612805c5f4dd2f438a64b560e8bcc5bfccaf10bd04019887279e8bccfff4` |
| `DS210-webdxf.dxf` | [DXF](https://funktion-one.cdn.prismic.io/funktion-one/a41b0ccf-b4c5-416d-9eb9-cd97eebf4192_DS210-webdxf.dxf) | 1,004,400 / `78a99f8fe02b3cffd691966b43f66fb2c0ae931edf8a0b14429f0141df1d2f6b` |
| `Funktion-One_DS210_Spec_Sheet.pdf` | [Specification drawing](https://funktion-one.cdn.prismic.io/funktion-one/f823e17f-d8b1-41dd-a0e8-8eddf051d445_Funktion-One_DS210_Spec_Sheet.pdf) | 854,472 / `825d6278cd71f5c8decf9206e597422d1084f877a482cab5a24edce9b3989fa3` |

Files are in ignored `berghain/references/downloads/`. All three returned HTTP200;
STEP/DXF headers inspected. The single-page PDF was text-extracted, rendered and
visually inspected because its dimension labels extract as corrupted glyphs.
No new CAD software installed; no redistribution licence established.

## Architectural fixtures and missing spaces

| Area | Required distinguishing content | Sources / current state |
| --- | --- | --- |
| Foyer | Ticket/cloakroom relationship, steel gallery, industrial services, distinctive channel-section concrete sofas, pendant fixtures, current artwork | I08/09 show actual structure/furniture. Accepted furniture candidate adds channel seats and ribbed shades; the old mural photo is historical. |
| Main hall / main bar | Actual structural void and steel stairs, DJ surround, horn-loaded speaker geometry, overhead services/lighting, bar furniture and suspended sofas | I12 now provides all three historic cartoons; I15 adds wall openings/stair/window relationships. Present study does not reproduce these fully. |
| Panorama | Counter wrapping and stools, illuminated lower bar, pendants, bottle shelving, DJ railing/desk, blinds, acoustic ceiling, Uddenberg and wall/glass art | A13 gallery inspected; I11/14 installation history. Accepted furniture candidate adds bar/stools, shelving, DJ forms and suspended fittings; artwork and complete ceiling/services remain missing. |
| Lounge / upper level | Extra lounge level, cabins, glazed/stair relationship, circulation to toilets and smoking extension; Weizenegger's *Felsenland* | A13 and I12; primary museum I16 names the 2010 coloured-leather seating landscape, indexed interview I17 places it in Panorama. Current study omits this furniture, extra level and cabins. Preserve measured façade mass while verifying floor elevations. |
| Klo Bar / toilets | Actual connecting corridor, bar enclosure, toilet compartments/services and Marr display | I12 and ART04. Entire space still missing; placing its sculpture in the existing main hall would be incorrect. |
| Lab.oratory | Cellar/service character, actual circulation, partitions and installations | A12. Current accessible extent and relation to the rest of the asset unmodelled. |
| Smoking extension | Panelled/glazed exterior, stair and two-floor connection | A01, P10, I15. Shape visible, section/placement dimensions unresolved. Exterior phase deferred in favour of the user's interior priority. |
| Accessible circulation | Ground entry, toilets and elevator connecting all floors | A14 confirms requirements. Shaft position/size and connecting routes remain unknown. |

I12's three acquired cartoons are 459×250 pixels each and undimensioned. They
support a historical connectivity study; exact positions/elevations cannot be
read as a modern plan. The room floor heights in `layout.mjs` remain provisional.

## Next implementation and acceptance

### Furniture implementation candidate, 2026-10-23

The local candidate replaces the generic foyer/Panorama furniture with 35
source-derived assemblies. It is not yet the canonical deployment. Forms follow
the inspected I08/I09/A13 photos; I11 corroborates acoustic/light installation.
The manufacturer case I05's BauBuche event benches are a separate commission,
not evidence that these concrete sofas are timber or that all seating is alike.

| Candidate feature | Evidence and implementation | Remaining uncertainty |
| --- | --- | --- |
| Foyer channel seats | I09: concrete slab, full-height ends/back channel, dark seat/back cushions. Model seat top .48m; overall3.2×1.35×1.02m. | Dimensions/count/placement inferred; photograph is historical. |
| Panorama counter | A13: dark wrapping worktop, framed luminous lower panels and metal foot rail. Model top1.13m, long run8.9m, return3.8m. | Shape observed, lengths/corner and location inferred; current counter configuration needs a fresh record. |
| Metal stools | A13: round seats, four splayed legs, circular foot ring, floor feet. Model top .77m. | Twelve modeled seats are a reconstruction choice, not a documented count. |
| Backbar and DJ forms | A13: open metal bottle rack, multiple shelves, equipment table/decks/mixer and slender overhead supports. | Bottle labels, electronics model, exact suspension and furniture positions not verified. |
| Suspended fittings | I08 ribbed foyer shades; A13 three-way shades and perforated rectangular enclosures; I11 acoustic/RGB project. | Nine enclosures/three branch pendants are inferred placement/count, unrelated to the reported50 control circuits. No moving lighting programme implemented. |
| Low banquettes | A13 dark upholstered seating form. | These do not recreate Weizenegger's separate *Felsenland* coloured-leather seating (I16/I17) or the missing upper lounge. |

`assets/models/berghain/interior-fixtures.mjs` owns assembly metadata; the same
geometry/materials are exported in the portable GLB. Original reference images
remain research-only. Named artworks, verified current Funktion-One/Studt configuration,
toilets/Klo Bar, extra lounge, Lab and verified inter-room relationships remain
outstanding. A furniture pass does not satisfy full realistic-interior acceptance.

Integrator-owned writes remain in the existing Berghain asset/viewer/tools/tests
and these owning notes. Preserve the main game, official exterior reference,
input/camera contracts and all unrelated staged work. No new engine or service.

1. Replace generic seating with channel-section geometry; build documented bar,
   stool, DJ and fixture forms. Establish clear paths and realistic human scale.
2. Resolve main-hall/Panorama structural relationships and add missing room
   connections, Klo Bar/toilets, extra lounge and Lab with per-space uncertainty.
3. Reconstruct the sourced art and the selected-date audio installation using
   adequate views/dimensions; retain unresolved objects explicitly in this ledger.
4. Export the same portable GLB and verify geometry/materials in both editable
   and native GLB views. Inspect the defining room compositions, not only load
   success. Required independent Physics and Camera/scale reviews apply to each
   frozen world-affecting candidate, with desktop and Android-emulated walking.

The earlier research-only checkpoint changed no runtime. The furniture candidate
does change world geometry and collision and has both independent reviewers and
current rendered regression evidence recorded in VALIDATION.md. Full realistic
interior acceptance remains outstanding.
