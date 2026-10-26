# Garderobe and admission correction — 26 October 2026

User request: incorporate the cloakroom and ticket entrance properly. Continue
the published c2a7a48 model in isolation; preserve the primary index and unrelated work.

## Evidence and design

ENT03 (updated August 2026) and ENT04 (April 2025) describe security/bag check,
cashier/wristband, then cloakroom. ENT04 describes the plastic strip curtain,
seating along the wall and metal cloakroom tokens. ENT06 (January 2024 Reddit
firsthand accounts) independently places couches across from the Garderobe.
U02 supports the ground-level cloakroom and nearby quiet toilet wing.
Karhard's 2016 enlargement date supplies no measured footprint. A January 2023
Reddit discussion calls its temporary cashier diversion temporary; it does not
justify moving the model's current admission room.

The existing detailed security/cashier/curtain route is retained. The cloakroom
counter is a floating 1.63 m-high block (bottom .53 m, floor .05 m); its 21
purported hangers are disconnected rods. Replace these with a grounded counter
within the retained footprint, supported rack and recognisable hangers behind
it. Add two conservative dark couches against the existing opposite partition.
Retain the east-end public toilet corridor and the foyer doorway. These are
functional estimated fittings, not a measured reconstruction of the 2016 work.
No payment simulation, prices, extra lights, room enlargement or new dependency.

## Acceptance and ledger

- [x] Source audit and rendered baseline; actual entrance route passes desktop.
- [x] Repair counter support, storage and seating; record dimensional uncertainty.
- [x] CPU floor/body/collision/route checks, actual input walkthrough and rendered
      source/native comparison in night lighting and texture fallback.
- [x] Regenerate existing bakes/GLB, verify unchanged bake pixels and unrelated parts.
- [x] Freeze candidate; independent Physics and Camera reviews on that candidate.
- [x] Matched cost check and scoped tests.
- [ ] Publish and verify public URLs and bytes.

Review scope: P1–P4, C1–C5 and X1 for fixed fittings, eye-level visibility,
scale and route recovery. Crowd, gait, vehicle lifecycle and building fading are
unchanged and out of scope. Physical Android is unrun; emulation is labelled.
The broader exact-interior goal remains blocked on other missing evidence.


## Accepted scoped result

286 Node checks pass. The counter regression fails on the floating baseline and
passes on this candidate. Nine rendered/browser cases pass: night source/native
counter and seating, real queue/security/cashier/curtain/service/WC/foyer route,
return, texture fallback and daylight restoration, on desktop and Android
portrait/landscape emulation. Separate Physics and Camera reviews pass; their
reports bind the exact frozen candidate. Physical Android remains untested.

The source/body audit preserves 16,764 unrelated parts, transforms and colours,
all floors/viewpoints, admission and unrelated colliders. 22 legacy parts are
replaced by 161 fittings; no external body intersections. Model count increases
by 1,668 triangles to 811,556, with unchanged 227 batches, six model lights and
38 runtime textures. Actual bake builders preserve both lighting images. GLB:
69,364,704 bytes, SHA256 af1d2045d679416194853dba12017fee7aaed0a55b239735cd40f4f2b86f41b5.

Six sequential cost contexts compare the same service aisle approach and real
movement, with bounded frame/input and submitted-geometry checks. These are
spot checks rather than stable latency estimates. No measured geometry,
current cloakroom inventory, payment operation or full-club fidelity is claimed.
Publication completion is recorded by the separate live-verification receipt.
The initial submitted-triangle estimate failed portrait: 8,856 extra versus
7,764 allowed. Complete before/after draw traces account for the difference:
the timber batch grows from 91 to 92 instances and is admitted in four passes
instead of two. Its 91 retained boxes add 2,184 triangles beyond the net new
geometry. The corrected conservative bound includes those retained submissions;
frame-time and input limits remain unchanged. The failed estimate and exact
trace explanation are preserved in output/berghain-wardrobe-entry-cost-initial-budget-failure.json
and output/berghain-wardrobe-entry-cost-draw-explanation.json. No product edit
or new timing samples were needed. Diagnostic timing is not acceptance evidence.
