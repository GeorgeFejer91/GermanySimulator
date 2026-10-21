# Police painted family

The user's October 2026 request explicitly changes the former articulated-3D
police exception. These sprites retain the compact painted city family. The
procedural 3D officer remains the missing/late/failed-art fallback; simulation,
collision bodies and arrest ownership belong to the existing city controller.

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

All paintings are original built-in ImageGen outputs under
`assets/sprite-sources/police/`. The existing neighbor directions sheet supplied
the compact body/head/painting reference. Official photos informed the brief;
their pixels are not copied into the game. The generated directional masters
provide front, right and actual rear views for each tier/gender. Left is the
declared horizontal mirror of right; the carried prop's anatomical hand therefore
changes in that view. These are fictional officers, not likenesses of the people
in the reference photographs.

Prompts requested a transparent four-tier, three-view sheet for each gender,
with a fixed sole line, large expressive head, short substantial limbs, complete
boots and separate navy patrol/protective/riot/heavy equipment. The action brief
requested neutral, half-raised warning, fully raised warning and offered-ticket
keys for all eight variants. A targeted second action-generation call repaired
overlapping rows/boots. The final `interaction-keys.png` supplied genuine entry
and return keys with closed mouths; the earlier `actions.png` is authoring
provenance and is never requested by runtime. Source SHA-256 values are in the
generated manifest.

## Build and runtime contract

Run `python tools/build-police-sprites.py` from the repository root. The builder
reuses the project's `painted_walk.py` intact-limb deformation and its connected
component/fold checks. It measures source-only row registrations once, strips
detached adjacent-row contamination and preserves one shared figure transform
through each cycle. Eight genuinely distinct continuous-rig walk samples are
baked for each of four directions. Warning and ticket clips have three authored
poses each, with deliberately repeated hold samples; an eight-cell row does not
mean eight distinct action drawings. Idle rows contain four neutral directions.

All atlases use an eight-column/seven-row layout, shared sole pivot and transparent
cell gutters. Desktop cells are 160×192 (1280×1344, 6,881,280 base RGBA bytes);
mobile cells are 120×144 (960×1008, 3,870,720 base RGBA bytes). Lossless WebP keeps
actual alpha. The builder clears hidden RGB and reopens encoded bytes to test
every cell's two-pixel gutter. Image copies and GPU copies are additional.

`createPoliceSprites(T,{queueAsset,camera,mobile})` exposes `attach(actor,host,
{tier,variant})`, `update(actor,{distance,dt,talking,gesture,tier,facing,camera,
reducedMotion})`, `detach(actor)`, `inspect()` and `dispose()`. Distance is accepted
game displacement since the prior update. No extra RAF, timer or animation loop
is created. The existing simulation/renderer drives it.

One texture is shared per tier/gender and selected client resolution. Only an
attached officer requests its selected variant, through the existing distance/
visibility queue. There is no eager family fetch or authoring-sheet fetch. The
last consumer aborts pending work and disposes its texture. Actor geometry and
material are private; UV selection cannot change another officer's frame. A tier
change keeps decoded old paint until the replacement arrives; failure retains
old paint or the 3D fallback. Central disposal aborts pending tiers as well.

The billboard cancels the host heading and uses the camera's complete orientation;
its pivot offset rotates with the quad. Collision height/route logic is unchanged.
The side gait's planted stride has 96 working pixels per cycle. At 1.56 world
units per 422 working pixels and 0.02 world units per game unit, the initial
cycle distance is 17.744075829383885 game units. This is a source-rig calibration;
actual oblique browser foot slip still needs the integrated rendered review.

The exact desktop patrol-male right-view sole proxy at frames 3/4/5 is
`(x midpoint,y) = (73.5,146),(70,146),(66,146)`. The fitted 30 exported
pixels/cycle agrees with the source-rig distance; the maximum residual about a
shared contact is 0.25 pixels, approximately 1% of this sole's width. This is a
single-side encoded-pixel check, not full-cast or oblique-camera calibration.

## Evidence and acceptance boundary

The builder writes SHA-bound transfer/decode costs to
`assets/characters/police/manifest.json`. Local review artifacts are under ignored
`output/police-art/`: per-variant all-encoded light composites, ordered GIFs,
joint records and the combined dark contact sheet. These are the actual decoded
shipping WebP pixels, rather than source-only previews.

`node --test tests/police-sprites.test.mjs` checks tier selection, collision-travel
clock, view selection, action ownership, shared admission, pending cancellation,
all asset digests and byte/dimension bounds. These checks do not certify anatomy
or screen performance. The integrator owns the running-game desktop/Android
emulation checks and the required independent Physics and Camera/Scale reviews.
Physical Android, perceived voice quality and fully phoneme-aligned speaking
mouths are not established by this art candidate. Original closed face paint is
preserved during action keys. There is no audio or voice ownership in this module.

Final offline review inspected all eight complete desktop light composites and
all eight mobile dark composites (all 56 cells each), including real rear views,
opposite contacts, both side walks,
gesture entry/return and heavy shield clearance. Repairs removed an adjacent
row's cap contaminant, corrected uneven action-row extraction so entire boots
survive, normalized each actor's whole action row once, expanded the common
canvas for shield gutters, and protected the shield's complete source outline
from trouser deformation. All desktop/mobile cells pass the encoded two-pixel
gutter and connected substantial-paint checks. Ordered GIFs are supplied for
integrated playback review; static-board inspection alone does not approve
normal-speed rendered motion, turning or stop/start contact.

The final atlas set totals 3,217,028 desktop bytes or 2,123,188 mobile bytes.
These are alternative complete-library totals. A single selected tier/gender
costs approximately 0.38–0.42 MB desktop or 0.25–0.28 MB mobile; final exact
per-file costs and digests are in the manifest. Runtime adds no fetch before
an attached police actor passes the shared queue's admission checks.
