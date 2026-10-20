# Gisela's phase-specific stopping paint

The two approved strips contain four dedicated poses for each of sixteen gait
entries in down/right/up/left order, arranged16x16. `../build-phase-stops.py`
uses the existing registered paint, complete limbs, deformation and exporter.
It preserves the loaded ankle while the swinging foot moves and lands, then
lifts/recenters the previous loaded foot. The next cell is the existing facing
neutral. Head/paper/book motion eases at.8/.6/.4/.2 of the matching gait entry;
the mouth's own axes/profile stay fixed and its center follows that same field.

Root inspected all256 encoded poses at both sizes beside their entry and neutral.
The frozen repeat reproduces both strip hashes, all128 desktop/mobile gait cells
and eight neutral cells exactly. `approved/stop-fields.json` records the actual
source bindings, measured nodes and per-pose fields. The original terminal-only
shin correction failed the deformation's compression guard; the accepted recipe
spreads vertical movement from the measured waist through the covered leg.
No guard was weakened. The published standing paint is unchanged.

These are accepted authoring inputs. Main Gisela is integrated in the isolated
review branch; final independent successor reviews and acceptance remain open. Exact source inspection
does not certify native foot contacts, scale, audio alignment or device performance.
Review evidence lives in ignored `output/ambient-city-animation/gisela-phase-stops-v1`
and `gisela-integration-v3`. The combined candidate has348 movement cells and17
reaction cells:28,835,840+2,621,440 base RGBA bytes desktop,7,208,960+655,360 mobile.
These costs precede GPU copies and require browser residency/playability review.
