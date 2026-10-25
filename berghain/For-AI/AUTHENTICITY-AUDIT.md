# Berghain interior authenticity audit

## Foyer gallery frame — source-informed correction

Karhard G04/07/20/25 support rectangular gallery piers, local beam haunches,
transverse slab ribs and a tall radiator mounted on a pier. A controlled render
of e153041 showed a flat unsupported gallery edge and a freestanding radiator.
The local correction fits three piers, six haunches, a continuous edge beam
and seventeen ribs beneath the existing gallery. The radiator moves against
the middle pier. The tapered corbel primitive and existing concrete material
are reused; every new part has a linked solid. Haunch solids conservatively
contain the overhead wedges.

These counts, sections and coordinates are estimates, not a recovered grid.
The authoring slab edge remains z9.4, underside5.05 and floor5.45; beam bottom
is4.4, pier bases0.05 and haunch minimum3.8. Pier centers are x−2.4,4.5,16.55
at z9.05; radiator center z9.72. Existing Säule capitals, stairs, gallery
walk surface, official exterior and private-room boundaries are unchanged.
The source photos support forms and relationships, not structural adequacy.


## AU12 joint section correction — 25 October 2026

The new candidate resolves the demonstrable four-versus-six Panorama window
coverage error and the floor/window conflict. It registers adjacent ordinary WC,
upper lounge, Klo, Eisbar and smoking stairs in one internally coherent estimated
section. Full-height Klo fittings are retained rather than compressed to hide the
overlap. The smoking flights are concentrated toward the projecting end, matching
the qualitative relationship in G30/31. See INTERIOR.md for the implementation
and SOURCES.md for assumptions.

AU12 remains partly open: no dimensioned interior plan establishes the chosen
floor heights, exact room footprints, upper lounge construction or contemporary
backstage/FLINTA layout. Independent collision/render acceptance is separate from
photographic fidelity. Historic notes below describe the earlier candidates.


The initial frontage candidate was held after Physics review found pre-existing
decorative rustication strips spanning the open entrance. This repaired candidate
trims those strips at the existing jamb aperture, including above head height.
The original rejected root/freeze is preserved. Ground support, jambs, door and
interior routes remain unchanged; fresh body/mesh and rendered checks are required.


## AU12 entrance-bay correction — 25 October 2026

P02/P16 isolate a count/pattern error: eleven uniform modeled bays versus twelve
photographed openings with wider end fields. The candidate corrects the entrance
elevation and its two attic vent rows. It does not close AU12: floor heights,
Panorama's six-window footprint, upper lounge/WC section and smoking attachment
still need common registration. Backstage placement remains unverified.

Audited 24 October 2026 at George's request. The model is a recognisable architectural study, with substantial invented layout and simplified objects. **It does not yet pass as a faithful contemporary interior reconstruction.** Rendering, collision and export acceptance establish that the authored model works; they do not establish that it matches the club.

This audit compares the accepted runtime `687b408cca2aa8a7e36c9bcd276f1e18af20f971`, unchanged by the research publication `a1f75fd142ee115dfb4255abcf55d5da0f95c213`. The 109-input freeze is `output/berghain-saule-candidate.json`; 141 preserved baseline files are in `output/berghain-entrance-baseline/`. A subsequent Halle correction is being modelled by GPT-6 Astra. Its proposed dimensions are not accepted as measured facts or counted as completed fixes here.

[README.md](README.md) is the sole task and implementation owner. [SOURCES.md](SOURCES.md) contains the dated resource catalogue; [INTERIOR.md](INTERIOR.md) retains object-specific evidence and limitations. This document owns the audit findings, not a second work plan.

## Evidence and review boundaries

25 October counter-wall follow-up isolates a further visible discrepancy in
AU12: generic facade openings behind Panorama's counter contradicted the opaque
backdrop in I19 views06/15/16. A separate internal lining, closed recess and high
service band address that feature. Their exact dimensions, construction and
present-day artwork are unverified; this does not close the floor/window section
or establish backstage placement. Validation is scoped in VALIDATION.md.


Latest 25 October Panorama registration supersedes earlier closed-upper-door and
rear-facing room statements below. AU10/AU12 now have a connected entrance-side
Panorama, ordinary WC beneath the lounge, relocated bar/DJ and guarded public
upper smoking link. AU08/AU24 lighting follows those spaces. Exact floor/window
section, dimensions, private spaces and contemporary inventory remain unresolved;
these are bounded model corrections, not a verified floor plan. The dated audit
table is retained for provenance; current acceptance is in VALIDATION.md.

25 October registration correction supersedes the rear-quarter assignment below.
G30/31 show the tower's long axis projecting out from the wall; P08–10 favor the
entrance-side region. The background annex does not identify the Halle join.
The revised tower is rotated and moved to an estimated front-side bay, with
opaque entrance-facing cladding and a glazed reverse. Its previous rear door
is closed again. Exact elevations, dimensions and upper connection stay open.
Panorama's window orientation must be reconciled jointly with its stair/WC
wing; no corridor across the main hall is justified by this correction.

V07 establishes a December 2023 upper-urinal trial, predating the July 2024
architect entry. It does not establish present inventory. V08's room testimony
is disputed; do not identify ground WC or ordinary Panorama stalls as that room.
AU26 backstage still lacks location evidence. AU09 now places Eisbar on a
separate guarded mezzanine using I03/I04, G27–29 and U01/U02. Its 9.95 m datum,
footprint, end bay and narrow access routes remain inferred; only the elevated
relationship is supported. Upper stair destination stays unconnected. Functional
acceptance is separately recorded in VALIDATION.md; exact section is unresolved.


25 October Karhard/cutaway candidate supersedes the earlier AU08 omission
rationale below. The complete gallery30–34 shows a tall glazed stair enclosure,
open lower escape flights and upper platforms; it is not merely a low bridge.
`architectural-circulation.mjs` models that form at an explicitly inferred
east-side bay near the main/Halle join. Main-floor access and ground escape are
connected; the upper Panorama attachment remains closed and unresolved. AU04
now has opposed main stair flights, turn landing, opaque guards and an open
foyer void. AU09 has a tiled Eisbar, narrow stairs and hoist. U02 additionally
supports a distinct cloakroom-adjacent ground WC, implemented provisionally in
`ground-sanitary.mjs`. These pass the bounded implementation gates in VALIDATION.md,
not newly surveyed geometry. [KARHARD-MAPPING.md](KARHARD-MAPPING.md) maps all
61 inspected project images and distinguishes historical features, implemented
forms and unresolved registration. AU26 backstage and the FLINTA/lift locations
remain unregistered; the maintenance ladder is not a backstage-room substitute.

24 October follow-up: the current candidate addresses AU10 with a separate
Panorama sanitary enclosure below the existing upper lounge and AU24 with
localized club-night lighting. The exact footprint, fixture attribution and
lighting parameters remain authored estimates. V05 corroborates the vertical
room relationship, not dimensions. The latest accepted base before this work
is first-person/Halle release `3f54d69b35f0c65fbb9b172cc85b1c26dc5bdf49`.
The original table below is retained as the dated audit, not a claim that all
its findings remain untouched or are now resolved. Current acceptance belongs
to README.md and VALIDATION.md.

Earlier AU08 registration hypothesis (superseded by full-gallery inspection): inspected I15/P10 place the smoking projection on
the east/front side, approximately spanning the plinth belt to the lower tall
window tier. G09's western annexes cannot be relabelled as this room. The model's
west Panorama floor at 13.25 m does not directly register with that projection;
its hidden attachment/depth and upper-return stair require further evidence.
No unsupported external volume or public connecting door has been inserted.
V05's author-acknowledged orientation correction places Panorama windows toward
the southwest, conflicting with the model's northwest window wall (AU12).
The comment and corrected article are one testimony chain, not a geodetic survey.
I01's indexed account describes an enclosed Panorama-to-foyer/Säule shortcut.
The low external box may be only one segment of that route: its photographed
height does not rule out an internal upper connection. A continuous stair/door/
window sequence is still needed before revising the connected room geometry.

Additional finding **AU26 — backstage/service rooms unmodelled**: V06's 2010
primary Höppner interview establishes dressing, cooling and storage spaces.
It gives no plan, position, access path or current inventory. The existing DJ
desks are not substitutes for those rooms; no public backstage shortcut should
be fabricated. V05 also reports a separate stair to FLINTA toilets, whose
position and contemporary access remain unregistered. These are open scope,
not corrected inaccuracies.

The comparison uses architect and structural-engineer accounts; their actual project photographs; artist, furniture-maker and lighting-installer records; technical product drawings; published curator/manufacturer interviews; dated firsthand visits; and historical diagrams. Source counts are discovery records, not independent confirmations. A13/I19 and A12/I22 repeat the same architect galleries. Several Halle architect/engineer pictures are the same photographic sequence. S06 repeats S05's community speaker list. Interviews with the same exhibition organisers form a related testimony chain.

Two independent read-only reviews identify 12 architectural and 11 object/material findings:

- `output/berghain-authenticity-architecture-audit.md`: floors, structure, circulation and dated room relationships.
- `output/berghain-authenticity-objects-audit.md`: art, furniture, sound equipment, photographed surfaces and lighting.
- `output/berghain-astra-halle-design.md`: Astra's additional image inspection and coordinate analysis; a modelling proposal, not final world acceptance.

A fresh, silent, headless desktop survey of the actual public page captured two directions in each of ten selector rooms. Selected frames across all room categories and supplied accepted detail renders were inspected. Evidence: `output/berghain-authenticity-public-observations/report.json`. It is a visual comparison through room shortcuts, not proof of continuous real-world circulation. No fresh physical-device or perceptual-listening test was performed.

The original survey asserted avatar visibility and failed at Panorama's quarter-turn: camera distance approximately 0.3994 m, avatar hidden. That failure remains in `output/berghain-authenticity-public-tour/report.json`. The subsequent observation-only capture completed; its capture PASS does not clear the visibility finding or certify historical authenticity.

**Supported identity** means a source establishes the room/object or broad form. **Contradicted** means a specific authored feature differs from the dated evidence. **Missing** means documented content has no corresponding model. **Inferred** means dimensions, placement, arrangement or present survival are unverified. Confidence applies to the stated source claim, not to the entire model or its 2026 currentness.

## Architectural space and circulation

| Finding | Source-to-model comparison | Evidence and confidence | Required authenticity correction |
| --- | --- | --- | --- |
| AU01 · Halle · contradicted/missing | Baseline has one very long steel stair and a largely open central gallery. It lacks the documented second concrete stair and three distinct floor voids. | **High** for the 2022 counts/forms: [A05 architect](https://www.karhard.de/projects/halle-am-berghain), A06 engineer and inspected photographs. No registered plan or floor datum. | Replace the coherent slab/stair/guard arrangement, rather than changing the stair material alone. Astra is implementing an explicitly provisional hypothesis; final geometry/route/visual acceptance remains pending. |
| AU02 · Halle structure · contradicted/inferred | Thin repeated posts, sparse beams, smooth blank walls and round tapered hoppers differ from photographed massive rectangular piers, corbels, low supporting frames, patched bays and rectangular funnels. The old stair maps to about 26.093 m after calibration. | **High** for visible shape differences; **low** for exact grid and hopper count. A05/A06 actual images; `layout.mjs` and `calibration.mjs`. Photo-derived floor estimate is not a survey. | Restore the structural silhouette and respect final metre dimensions after nonuniform calibration. Preserve the official hull; do not shrink the whole hall to match a refurbishment-area figure. |
| AU03 · Halle exit/WC · missing | No WC under the western stair or documented escape-opening relationship. | **High** for A05's relationship. The German text says a facade opening aligned with the **eastern stair**; it does not separately identify an east-facade location. | Add a provisional under-stair enclosure only with clear body/headroom geometry. Retain the exit as an unresolved gap until registered; do not invent a wall cut or claim accessible compliance. |
| AU04 · Main stair · contradicted shape, uncertain registration | Current main stair is one straight 37-tread flight. I23 views07/08 visibly show opposed steel flights and an intermediate turn/landing. | **High** for the photographed switchback, **medium** for identifying it with the model's main stair; images are undated and unscaled. A07 supports one large primary stair, not its detailed plan. | Register the pictured stair and its floors before replacing the full route. A matching approximate riser count in I01 does not validate a straight flight. |
| AU05 · Säule · historical discrepancy/missing | Six repeated massive piers and no dedicated side mezzanine with stair access at both ends. | **V01**, firsthand opening visit, 24 March 2017, describes at least **eight piers total, arranged in pairs**, benches and a side mezzanine. **High** for what was reported then; later arrangement unknown. A15's completed project is dated 2018. | Reconcile the opening account with later pictures before changing counts or floor levels. Do not turn eight piers into eight pairs or treat 2017 as a current measured plan. |
| AU06 · Säule/Lab entries and partitions · incomplete/inferred | One main playable entrance and a convenient inferred internal connection substitute for distinct admissions and movable separations. | A15 documents a separate Säule entry and steel/glass connections; A12 documents the former cellar; V01 records the opening route. **High** for separate/conditional connections, **low** for exact coordinates/current operation. | Recover doorway, cash-desk and partition relationships. Do not expose every Lab connection as an always-open public club route. |
| AU07 · Accessible circulation · missing | Stair-only model has no lift connecting the floors. | **A14 operator accessibility page** explicitly confirms a lift between floors with staff assistance and barrier-free WCs. **High** for provision; shaft location and dimensions unknown. | Find the shaft/landing registration before inserting a lift. A usable model stair does not satisfy the documented accessible circulation. |
| AU08 · Smoking extension · missing | No complete panelled/glazed bridge, two-level smoking connection or enclosed alternative stair route. | A01, I15/P10 photos and I03/I04 dated descriptions. **High** for the photographed exterior extension, **medium/low** for internal routes/current access. | Reconstruct the envelope and establish its internal landings without inventing a measured section. |
| AU09 · Eisbar, secluded seating and cabins · missing | Large open generic circulation does not reproduce the described interstitial rooms, Eisbar mezzanine and secluded seating routes. | I03/I04 firsthand historical account, I01 sketches; V03 also discusses this spatial vocabulary but is partly derivative. **Medium**, with mixed dates. | Map the dated room graph and identify surviving spaces before filling arbitrary gaps with generic rooms. |
| AU10 · Panorama lounge/toilets · incomplete/inferred | Upper lounge exists, but cabins and verified upper-level sanitary connections are absent. The model's lower Klo Bar toilets are not evidence of Panorama toilets. | **A13** describes the 2009 lounge and expanded toilets; I19 photographs and I03/I04 historical accounts. **High** for that intervention, **low** for current footprint/counts. | Recover the upper sanitary passage and distinguish refurbishment years/floors. Preserve the supported lounge identity while correcting its arrangement. |
| AU11 · Garden and foyer routes · missing/inferred | Garden has an external perimeter gateway but no verified building-to-garden door. Foyer lacks a recovered small ticket/cash-desk sequence and narrow Säule passage. | I03/I04 historical eastern garden access and ticket sequence; V01 corner passage/cash desk; I08/I09 photos. **Medium** historical topology, **low** contemporary coordinates. | Register the actual openings and partitions. G10's OSM node conflicts with the photo-identified adjacent bay and cannot settle the main portal centre. |
| AU12 · Levels, grid and cardinal placement · inferred | Current floor datums, 15 main posts, Lab footprint, upper lounge, long-bar wall and room axes are not a recovered measured plan. | A01 original turbine volume, A07 approximately 11 m bar room/former exterior facade, A12 cellar, G07–G09 external hull. **High** that these do not supply a shared interior section. | Keep the external survey authority separate from interior estimates. Osio's cutaway has no north/site registration. Do not rotate the main bar or Lab solely from a secondary cardinal description. |

The model directionally represents the former turbine main room, former control-room Panorama and added upper lounge. These are useful identity matches. They do not validate the exact heights, stair shape, separation walls or current room graph. The solid north club wall currently seals Halle from the nightclub; room selection is the available Halle start, so a new local Halle walking loop must not be described as a natural club-to-Halle route.

## Art, furniture and installed equipment

| Finding | Source-to-model comparison | Evidence and confidence | Required authenticity correction |
| --- | --- | --- | --- |
| AU13 · Permanent collection · missing | Live `addArtworks` installs only CLIMBER and partial Together. Bisky's *Vertigo*, Göthe's sculpture and Czebatul's *Andrea I* are absent. | ART03/05/17–21/25 establish identities/commission histories. **High** identity; installed views, positions and contemporary inventory incomplete. | Acquire complete in-situ references and reconstruct each work separately. The ignored Andrea anatomical prototype is not an accepted asset. A 30 m wall extent for *Vertigo* is not each canvas's size. |
| AU14 · CLIMBER · supported identity, incomplete likeness | Correct Anna Uddenberg work/bar association, but simplified folded anatomy, garments, zippers, hands, shoes and synthetic hair remain visibly stylised. Counter contact/rotation is inferred. | ART02 gallery image/dimensions; ART03/V02 organiser testimony and ART13 dated visit. **High** object identity, **low** exact installed axes/contact/currentness. | Use multiple object and in-situ views. The studio barrel/table/stool presentation must not be copied into the club without evidence. |
| AU15 · Together · partial | Correct Klo Bar identity and switchgear/display vocabulary; generic reclining figures do not recover the full scanned male sequence, three-stage narrative, satyr/vine/claw/ram ornament or cola-sugar optics. | **Artist ART04**, in-situ photographs and ART14–16. **High** identity/material/story; exact figure boundaries, dimensions and case sequence unresolved. | Reconstruct the complete composition and characteristic ornament from views; refine dark amber transmission/roughness. Generic CC0 anatomy is an authoring base, not Marr likeness. |
| AU16 · Panorama glass and wall works · missing/inferred | The glass frame lacks Brandenburg's printed imagery; Tillmans hanging is absent. Upper lounge seating has the broad Felsenland idea but simplified profiles and speculative layout. | **A13** explicitly connects 2009 lounge to Brandenburg glass and 2010 relaunch to Tillmans/Weizenegger; I16/I19/I20 support Felsenland. **High** identities, **low** current selected images/layout. | Restore the distinctive glass/seating relationship with correctly sourced artwork and silhouettes; verify the selected-date hanging. Do not use random Tillmans-like images. |
| AU17 · Temporal art layers · prevent false additions | Removed Nathan mural and temporary Studio Berlin interventions would make a contemporary base inaccurate. Gaillard's engraving is currently absent. | ART06 dated 2017 Nathan removal. V02 describes *Land of Cocaine* as **intended permanent** in 2020; ART03 provides related curator testimony. **High** then-intended status, present survival unknown. | Keep removed/temporary layers dated. Correct the earlier overly broad treatment of Gaillard as merely temporary, while leaving current panel identity/placement unverified. |
| AU18 · Panorama PA · placeholder contradicted by dated installation account | Two generic `Panorama speaker` boxes do not depict the documented Studt installation. Funktion-One main-hall equipment must not be copied wholesale upstairs. | **S02 manufacturer**, **S12 direct 2017 manufacturer/installer interview**: four-point arrays, six double18-inch subs and two4×10-inch low-mid units. S01 distinguishes Funktion-One DJ monitors from Panorama PA. **High** dated identity/configuration, current geometry unverified. | Obtain cabinet/rig references and model the separate PA/monitor systems. Keep the 2017 configuration date visible; do not claim verified 2026 placement or acoustic response. |
| AU19 · Main-hall PA · supported cabinet dimensions, uncertain venue configuration | 44 dimensioned component studies form a plausible reported rig; counts, angles and coordinates come from community evidence. | S07–11 manufacturer drawings support products. S05 is a community report; S06 cites it. S01's 2023 manufacturer statements withhold exact system design. **High** product-envelope evidence, **low/medium** installed configuration. | Verify the selected-date rig using installation evidence. Repeated reports do not independently confirm the count. CAD/product dimensions alone do not make a venue inventory or sound simulation. |

## Surface, lighting and room character

| Finding | Source-to-model comparison | Evidence and correction boundary |
| --- | --- | --- |
| AU20 · Main hall and foyer | Fresh public views show broad, evenly coloured blank wall planes, thin repeated posts, a schematic DJ platform and repeated fixtures. Their density and service detail remain far below the archive photographs. | I08–I10/I15/I23 and P04–P06 establish specific industrial vocabulary, with mixed dates. Prioritise the correct structural/room relationships, then authored local wear, service runs and characteristic furniture. More repeated generic props would not establish authenticity. |
| AU21 · Main long bar | Counter/rounded return, stools, hall-facing glass and ornate inner facade are recognisable studies. Five identical facade bays, two regular relief rows, four roof coffers, blue panes and six regular light pools are estimates. | A07 interview and I23 views11–16 support height relationship, former exterior wall and visible forms. Refine moulding profiles, localized plaster loss, irregular repairs and light placement from registered views. Blue appearance does not establish glass type or a specific hidden light source. |
| AU22 · Säule | Massive piers/flared caps/belts/seats are closer in type, but deep concrete erosion, discontinuous patching, full concealed up/down wash, bar and services remain incomplete. | A15/I24 support forms and custom lighting; their pictures are not independent surveys. Current generic maps and emissive slots do not reproduce the photographed spatial wash. Photometry, counts and operation remain unverified. |
| AU23 · Lab and toilets | Pipe/gauge counter, insulator lamps, cells, slings, cubicles and trough vocabulary is represented. Fresh Lab reads as a clean wide bay; photographs show compressed stained spaces, varied alcoves, rusty/rusticated walls and irregular services. WC surfaces/counts are overly regular. | A12/I22 are one mixed-date architect gallery. I21 combines 2009/2013/2015 sanitary projects. Recover room-wide proportions and floor attribution before adding repeated cells/fixtures; build site-specific weathering from observations, not copied photographic pixels. |
| AU24 · Light and lived spatial contrast | Broad warm fill and repeated coloured strips flatten the contrast between the industrial dance floor, bar, lounge, cellar and passages. Material maps alone cannot recover that character. | Dated photos, V01 opening observations and V02 organiser interview describe localized/coloured light and varying room conditions. Establish fixtures, occlusion, window contribution and selected-date lighting states; do not infer live event programming from a single still. V04's general sound testimony does not establish acoustic quality here. |

Additional technical observation AU25: the Panorama quarter-turn hides the avatar through close-camera fallback. Preserve its failed trace and repair it under a separate scoped camera candidate if it affects the revised routes. It is not evidence about the historical architecture and is not cleared by this source audit.

Subsequent user steering replaces the visible avatar and third-person camera
with first-person walking. The old visibility failure remains historical
evidence; acceptance now needs eye-height/body-clear views and direct look,
including stairs and the WC. The architectural checker additionally reports
the2.088× Halle calibration aspect distortion, unresolved22.753m rendered
floor-to-external-roof span versus up-to21m interior account, and incompatible
project-area definitions. These findings prevent false blueprint claims;
they are not resolved merely because circulation or rendering works.

## Date control and testimony quality

| Evidence layer | What may be used | What must stay separate |
| --- | --- | --- |
| 2004 opening / 2008–2010 photos and descriptions | Early industrial shell, original stair/room descriptions, historical bars, 2009 lounge and 2010 seating/lighting interventions. | Earlier equipment, removed artwork and undeveloped northern hall are not the contemporary base. |
| 2013–2015 | Together, sanitary refurbishment phases, Kultur:Stadt model and *After Hours* film archive. | The film's staged animals/exhibition arrangement are not permanent inventory. Full footage has not yet been frame-indexed in this audit. |
| 2017–2019 | Säule opening and later project, Vertigo/Nathan replacement history, Studt installation interview, Göthe commission history. | Opening-night counts and 2018 completion dates need reconciliation; no automatic contemporary count. |
| 2020 Studio Berlin | Object identities and installation testimony; explicit permanent intentions where stated. | Exhibited work is not automatically permanent; organiser accounts are related sources. Mirror interventions during an exhibition do not refute descriptions of an ordinary mirror-free club without date control. |
| 2022–2023 | Halle structural intervention, Andrea commission and changed main-hall sound system. | Do not retain pre-refurbishment topology or retired Dance Stack inventory simply because older photos are clearer. |
| 2026 target | Operator accessibility provision, current public source availability and the model's declared working target. | There is no verified complete 2026 room/equipment/art inventory or measured interior survey. |

V03 is a useful longitudinal interpretation, but its author explicitly reports no field-note archive; it is not a new set of measured interviews. Written firsthand visits and published transcripts are retained with dates. No interviews were conducted, private records requested or institutions contacted. Archived book/catalogue page leads are specific, but full original drawings remain unobtained. Neither a Minecraft interpretation nor a film concept replaces those missing measurements.

## Consequence for reconstruction

The highest-value corrections are coherent space and structure, then characteristic installations, then local surface/lighting fidelity. Astra's current Halle work addresses AU01–03 in a provisional study; none is marked repaired until the integrated source/native model, body routes, rendered comparison and independent Physics/Camera reviews pass. The main stair, lift, smoking connection, Säule mezzanine, full collection and distinct Panorama PA remain substantial separate gaps.

Every accepted correction must record separately: supported identity/form, dimensions/axes, placement/room registration, material/lighting behaviour, source date and present survival. Unknown fields remain explicit. Preserve the single shipped asset authority, source-image rights and existing playable entry/exit. The overall Berghain goal remains ACTIVE.
