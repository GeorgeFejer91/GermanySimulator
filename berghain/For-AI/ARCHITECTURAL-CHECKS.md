# Architectural consistency and proportion checks

The CPU tool [check-architecture.mjs](../check-architecture.mjs) measures the current model and compares scoped quantities with the existing [source catalogue](SOURCES.md). It does not establish a dimensioned interior blueprint or replace rendered, physical, accessibility or contemporary-inventory review. Keep task ownership and acceptance in [README.md](README.md); this page owns checker semantics only.

```powershell
node berghain/check-architecture.mjs
node berghain/check-architecture.mjs --out output/berghain-architecture-report.json
node --test tests/berghain-architecture.test.mjs
```

The default CLI writes JSON to stdout. `--out` writes only the requested file; its parent directory must already exist. Imports perform no writes. There is no ignored-output/freeze/index dependency, new package or GPU/service. Exported functions are `polygonArea`, `unionArea`, `localBasis`, `firstOverhead`, `compareQuantity`, `measureArchitecture`, `architectureReport` and `runArchitectureCLI`; `sources` contains dated provenance. The tool measures production geometry and disposes its temporary model.

## Separate meanings of success

`geometryChecks` contains source-import/representation checks. A non-consistent or unavailable geometry check makes the CLI exit nonzero. Exit zero means those limited checks are consistent and the report was produced; it is **not an overall authenticity PASS**. Reports deliberately have no `overallPass` field.

- `footprint`: sum of the four official ground polygons versus ALKIS3,432.10m². The tolerance is half its published0.01m² rounding unit, not cadastral positional accuracy.
- `frontage`: mapped façade-edge distance versus the official derived37.949743m frontage. The numerical bound comes from two endpoints rounded to six-decimal metre coordinates.
- `roof`: an actual Halle mesh hit versus the corresponding official roof altitude, allowing one Float32ULP at that height. This verifies representation of the exterior surface, not internal ceiling height.

`comparisons` keeps each source's ID/date, value/unit, quantity definition, scope, datum, uncertainty and actual model counterpart. Status meanings:

| Status | Meaning |
|---|---|
| `unknown` | A finite quantity or required scope/unit/datum/definition field is missing. A model estimate does not fill the missing evidence. |
| `not-comparable` | Units, scope, datum or quantity definition differ. Equal numbers cannot override the mismatch. Diagnostic ratios/differences for the same unit are descriptive only. |
| `nominal-match` | Matching semantics and nominal numbers agree at arithmetic roundoff precision. No source accuracy or as-built tolerance is inferred. |
| `difference-unquantified` | Comparable nominal values differ, but the source supplies no numerical uncertainty. The difference remains visible. |
| `documented-count-match` / `documented-count-difference` | Explicit source counts agree/differ. Matching counts do not register their positions or proportions. |

Only floating-point arithmetic roundoff is allowed for nominal equality. No percentage tolerance is used to force agreement with architectural prose. Changes in unknown or incompatible comparisons do not disappear behind a green test run. Catalogue/source updates must preserve historical dates and exact quantity meanings.

## Current source relationships and limits

G07/G09 are official ALKIS/LoD2 exterior data, acquired23October2026. LoD2 creation date2026-03-02 and footprint-date attribute2023-03-11 are distinct. The3,432.102366m² polygon sum agrees with the rounded cadastral figure. The source-ground altitude offset is35.288m; the vertical datum has not been independently established. Generalised exterior surfaces supply no interior wall thickness, floors, windows or equipment. The main roof surface20.374m differs by1mm from its20.373m`measuredHeight` attribute; preserve both values rather than changing floors.

A05/A06 describe Halle's2022intervention: two storeys, three openings, two cast-concrete flights and an interior height up to21m. Current actual void-floor-to-exterior-roof span is22.753m. That+1.753m remains an **unresolved floor-datum/inner-soffit discrepancy**, not a forced21m match. A registered section must distinguish finished floor, interior ceiling and external roof before changing geometry.

A01's18m refers to the original turbine-space volume containing two club levels. It does not establish18m clearance above today's raised dance floor. The current sample is13.724m from the model dance-floor datum6.65m to the official external roof. This is not an error solely because it differs from18m. Neither the model's20.324m lower-floor-to-roof envelope nor its current dance clearance is automatically the historical internal volume.

A07's8January2021architect interview reports the former-exterior-facade bar room as11mhigh. The model's actual lowest beam clearance is nominally11m, while recessed panels can produce11.44m rays. This supports a nominal room-height relationship; the6.65mabsolute floor, footprint, cardinal registration, bay dimensions and current arrangement remain inferred.

A06's approximate785m² usable/1,180m²gross refurbishment areas cannot be equated to the whole official Halle hull or a single floor. Current ground support is1,400.305m²; upper flat support union1,073.622m²; combined2,473.927m². These are geometric support areas, not a formal net/gross schedule. A01's7,300m² project size likewise has no complete matched model inventory. The checker deliberately leaves these scope/definition differences unresolved. Do not scale the hull or invent room boundaries to fit the totals.

A20's nominal38×38m2011project description is retained from the existing catalogue; the paragraph itself was not re-acquired in the24October2026text pass. Official Halle centre dimensions are37.919×39.590m. This is a phase/scope/nominal-dimension comparison, not a measured interior constraint. The published ARCH+page ranges also conflict with A01's bibliography; neither index is an obtained plan.

Absolute inner datums4.25mHalle,6.65mmain floor,13.25mPanorama,16.35mlounge and−1.15mLab sanitary level remain estimates. They must not become blueprint “truth” merely because regression tests preserve them. A02's1:100title block, Osio's cutaway, historical cartoons and A09's site-map scale do not provide a registered dimensioned interior plan. A07 confirms original plans exist but does not publish them. Unrelated Canadian iGUIDE or Wuppertal student-project plans are not Berlin evidence.

## Geometry measurement and reusable tests

The local calibration basis is measured in world metres. At Halle's centre, X/Z scales are approximately0.861804/1.799530, aspect stretch2.08810 and axis angle89.299°. Thus a pre-calibration authoring square is not a physical square. Main-club scales are approximately0.862275/0.840007. Existing main/Panorama runs become9.322650m/11.341175m while their6.6mrises remain unchanged. The checker reports actual ramp axes and floor datums without inventing source dimensions or certifying stair codes.

`unionArea` integrates the piecewise-linear union between all polygon vertices and edge intersections. It accepts simple polygons, including concave ones, as separate filled regions; explicit holes are represented by surrounding support polygons, not by filling their outer ring. It avoids counting landing overlaps twice. The current upper sum exceeds its union by.144m². Internal geometric epsilons address arithmetic degeneracy only.

`firstOverhead` uses actual instance/mesh geometry from1mmabove a supplied finished-floor point and returns null when no surface is hit. Ray points are selected diagnostic samples, not exhaustive cylinder headroom proofs. Floor heights are read from current production supports. The bar beam measurement reads actual part geometry; metadata alone does not determine the result.

Halle's void count is computed from connected missing-support samples over the existing authoring envelope at.4×.3spacing. Flights come from actual ramp-floor records and storeys from flat support datums. This detects the current three broad openings but does not prove arbitrarily narrow topology. Keep [the Halle tests](../../tests/berghain-halle.test.mjs), including physical seams, actual mesh rays, five lateral lanes and .02/.035/.04/.24m movement steps. Future layout changes need a review of sample coverage.

[Checker tests](../../tests/berghain-architecture.test.mjs) cover known overlapping/duplicate/concave/holed areas, a synthetic shear, transformed instance clearance, missing ceiling, unit/datum/scope/definition mismatches despite equal numbers, altered actual dimensions, current source comparisons and CLI output. These validate the measuring/comparison machinery. They do not validate the missing real blueprint.

Further registered plans/sections should add source-specific constraints with their own scope and uncertainty. Do not turn an unresolved finding into a guessed threshold, hardcode a changed fixture to match the model, or describe a source-derived exterior plus inferred rooms as a verified digital twin.
