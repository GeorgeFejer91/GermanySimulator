# Police painted family

The selected candidate replaces the former compact officers with mature,
weathered adult paintings under the shared
[city character direction](../../For-AI/CITY-CHARACTER-STYLE.md). Both genders
retain patrol, protective, riot and heavy equipment, existing pursuit and
planted warning/ticket actions. The connected procedural officer remains the
late, missing or failed-art fallback. Simulation, collision and arrest ownership
stay in the existing city controller.

## Reference research and original paint

Researched 2026-10-21 using primary Berlin police sources:

- [Berlin Schutzpolizei](https://110prozent.berlin.de/berufsfelder/schutzpolizei/)
  describes uniformed foot/bicycle/car patrol and shows ordinary uniform and
  helmet-equipped officers. Its [patrol photograph](https://110prozent.berlin.de/wp-content/uploads/2026/Drei-Polizeibeamte-der-Schutzpolizei-der-Polizei-Berlin.jpg)
  and [helmet photograph](https://110prozent.berlin.de/wp-content/uploads/2023/07/GALERIE-0847_Polizei_DOJO-scaled.jpg)
  support the navy palette, caps, radios and protective equipment direction.
- [Berlin police equipment/logistics](https://www.berlin.de/polizei/dienststellen/direktion-zentraler-service/technik-und-logistik/)
  owns equipment and clothing procurement and illustrates police protective kit.
- [Berlin tactical identification instruction, 2018](https://www.berlin.de/polizei/_assets/verschiedenes/ga_dire_takt_kennz.pdf)
  explicitly distinguishes operational clothing, body protection and tactical
  vests, with blue backing/white identification and helmet identification.
  This dated document supports visual vocabulary, rather than establishing the
  current exact issue specification of every garment.

The four game equipment tiers are an authored caricature, not a claim that German
law assigns uniforms or arrest powers to stars. One/two stars use navy patrol
clothing and a ticket notebook; three adds vest/radio; four adds raised-visored
helmet, padding and lowered baton; five adds lowered visor, more protection and
a shield. Both male and female officers use every tier. No firing mechanic or
new weapon model is introduced.

The adult source masters and action paintings are immutable built-in ImageGen
outputs in `assets/sprite-sources/berlin-street-20261022/`. Their exact prompts,
reference roles, raw hashes and source-review receipts are in that folder's
`provenance.json`. `assets/sprite-sources/police/adult-motion.json` selects each
officer's own front, rear, left and right source registrations and four action
keys. No selected adult direction is mirrored. Anatomical equipment ownership
is preserved, including the heavy shield and lowered baton. Earlier compact
source sheets remain historical authoring material and are not runtime requests.

## Build and runtime contract

Run the existing builder's adult mode:

```text
python -B tools/build-police-sprites.py --adult --spec assets/sprite-sources/police/adult-motion.json --output assets/characters/police
python -B tools/build-police-sprites.py --adult --spec assets/sprite-sources/police/adult-motion.json --output assets/characters/police --check
```

It reuses the current source-bound street-family movement implementation and
native packing. All eight variants retain four eight-frame walks, four idle
directions, a warning row and a ticket row on the existing eight-column/seven-row
layout. Action holds deliberately repeat their four painted source keys; eight
cells do not mean eight independent action drawings. Closed face paint remains
intact; this module owns no new voice or mouth system.

The common working figure is400 pixels with sole472 in a614.4-pixel frame.
Desktop cells remain160×192 (1280×1344,6,881,280 base RGBA bytes); mobile cells
remain120×144 (960×1008,3,870,720 base RGBA bytes). Native desktop figure height
is125 pixels, pivot[80,147.5]. Lossless WebP clears hidden RGB and retains at
least two transparent gutter pixels. All896 decoded cells pass connected
substantial-paint and hidden-RGB checks; all32 directional strips have eight
distinct cells. Exact digests, dimensions and source/builder/configuration
bindings are in `assets/characters/police/manifest.json`.

World figure height is2.33, calibrated against the published adult Irmgard and
the actual Sandales; Söder remains taller. The distance clock is65.24 game units
per cycle, equivalent to224 working pixels at400pixels/2.33world units and
0.02world units/game unit. This is source calibration; actual game sole/cadence
review is a separate gate. The upright billboard cancels host rotation and
uses camera yaw, keeping nominal sole at the host ground and crown2.33 above it.
The articulated fallback uses the same crown/sole span without scaling the host
or the subsequently admitted painting.

The existing shared distance/visibility queue admits only the attached officer's
selected tier, gender and client resolution. One texture is shared by its live
consumers; the last release aborts/disposes it. Tier changes keep decoded old
paint until replacement arrives. Failed replacement keeps old paint or the
procedural fallback. No eager family/source downloads, new RAF, timer, loader or
cache are introduced. `game.js`, pursuit, collision radii and vehicle routes are
unchanged.

The complete alternative desktop library is2,486,636 encoded bytes; mobile is
1,628,912 bytes. A selected desktop variant costs294,840–330,348 bytes and a
mobile variant195,180–209,414 bytes. These are alternatives, not simultaneous
whole-library downloads. Decoded image/GPU copies add to the base RGBA costs.

## Evidence and acceptance boundary

The current integrated candidate starts at the live Hannelore release
`b5744458`; all43 published street entries, including Irmgard and Hannelore,
remain byte-exact. All68 frozen source/runtime/test pins are recorded at
`output/police-release/frozen-candidate.json`. Native896-cell review, all8
source/export bindings,6 adult-builder Python checks,2,435 isolated regression
checks and92 checks on the integrated public successor pass.

An independent actual pursuit review held the original18.64-unit shuffle after
observing6.875 full cycles/second. The successor uses own step56 paint and the
matching65.24-unit distance clock; a guard ties each view's source sole travel
to the clock, so slowing the clock alone cannot pass. One riot-female profile
needed a new immutable clear-leg painting because its original baton obscured
thigh paint. Its exact request/reference hashes are archived with the raw source;
no invented leg pixels or hidden procedural joint bridge are selected.

Fresh independent production pursuit checks reach all8 phases for both genders
at wanted2/5 speeds129/165:1.99–2.56 cycles/second. Explicit pause holds root and
distance exactly. An attempted four-officer ring did not create a stationary
blocked witness; its fixture RED is retained, and no new blocked-browser claim
is made. The unchanged zero-displacement clock has focused regression coverage.
Historical three-profile late/failed/tier/lifetime probes and same-ground adult
reference/depth checks retain their original scope. Fresh independent moving-edge Camera review passes desktop/portrait/landscape:
all8phases/all8families,192actor-phase observations,0page/HTTP failures and
all68pins stable. Clear visible boots/knees/equipment remain connected; a
fixture bag hides some male boot pixels, which were excluded from clear-edge
evidence. Root inspected the actual native GPU board and accepts the affected
visual/cadence scopes. Actual push/Pages/deployed-byte receipts remain separate
from this local acceptance and are recorded in the street redesign task document.

Silent tests can establish state/timing, not perceived sound. Android browser
profiles are emulation; physical Android and perceptual listening remain
uncovered. No whole-world collision, natural mission-chain, vehicle-driving,
door-clearance or building-material acceptance is inferred from this art change.
