# Biomechanical Sprite Animation Protocol

## Paired Gaussian action paint

Use the animation skill's [paired Gaussian starter](../.agents/skills/animate-2d-characters/references/paired-gaussian-actions.md)
for registered main/end poses and continuous transition arcs. The office's
source specifications live under `assets/sprite-sources/buergeramt/gaussian-arcs/`;
`tools/build-amt-gaussian-animation.py` emits its runtime action records.
Preserve the original direction, family scale, floor and prop hand. Add painted
bridge keys for crossings, changing grip or occlusion before packing. Track
paper/phone/helmet separately from legs and torso; a rotating prop needs its
own pivot path to avoid midpoint collapse. Transition keys never introduce
holds or independent clocks. Review the encoded cloud at endpoints, between
every pair, in reverse, across the loop seam and at normal speed, including
desktop/mobile sampling and light/dark backgrounds. Check source identity,
gaze, attached limbs, one owned prop, texture continuity and scene depth.
Manifests, source hashes and exact endpoint tests establish reproducibility;
they cannot waive an orphaned paint strip, doubled hand or anatomical defect.

## Bürgeramt character loops

The Aktenkurier's omen exit has a separate nine-view planted turn: existing
registered front/profile/rear keys plus six ImageGen perspective bridges in
`assets/sprite-sources/buergeramt/aktenkurier-turn/`. Rebuild only this clip with
`python tools/build-aktenkurier-turn.py` (`--check` verifies stored bytes).
It packs a 3 × 3 WebP with 480 × 624 desktop/high-DPR cells or 240 × 312
low-DPR mobile cells. The 1.8-second simulation clock samples all nine views;
the billboard remains camera-facing without the former rotation pulses.
Keep the shared family scale, floor pivot, left-arm files and right-hand stamp.
These are distinct painted views, not interpolated anatomy or a new walk rig.
The renderer prepares one selected variant only on omen approach, retains the
existing directional fallback on failure, and disposes it on release/replay/close.
Review every exact encoded cell and both action-to-turn and turn-to-walk handoffs.

The first-person office keeps its original stationary cast and does not change
the city walk pipeline below. Four caricatured painted source strips live in
`assets/sprite-sources/buergeramt/*-source.png`; the builder is
`tools/build-amt-sprites.py`. The game loads its derived WebP atlases from
`assets/buergeramt/characters/`, with the mobile suffix selected on narrow
screens. The other painted poses in each strip are **candidate action keys**,
not approved connected transitions. Keep them out of the idle clock until their
hands, faces, props, scale, and loop seams pass ordered visual review.

- Bake 64 individually evaluated idle frames at 24 fps into an 8 × 8 grid,
  one 192 × 416 cell per desktop frame (128 × 288 mobile). This is a 2.67 s
  cycle, not a four-key loop held by a fast renderer. Keep one pose identity,
  shared scale, baseline, and continuous periodic motion through frame 63 → 0.
- The painted figure occupies at most 144 × 384 within its desktop cell.
  Keep at least 12 fully transparent pixels horizontally and 8 vertically
  **after warping and final encoding**; the builder currently provides at
  least 21 and 16 respectively before export. Remove disconnected fragments
  from neighboring generated-strip columns before scaling. Clear RGB where
  alpha is zero and filter premultiplied color to avoid edge halos.
- For more expressive movement, first approve action keys at the same
  registration, then create enough connected inbetweens for a fluent loop.
  Do not treat a crossfade, a held pose, or an optical-flow midpoint snap as a
  finished transition. A larger frame count is useful only if adjacent
  rendered frames are actually continuous and the anatomy stays connected.
- Run `python tools/build-amt-sprites.py`; inspect every character's ordered
  `output/buergeramt-sprite-qa/*-motion.gif`, contact frames, and exact WebP
  atlas at desktop and mobile sizes. Review the loop at 24 fps, its seam,
  the billboards in the first-person level, alpha edges on light/dark
  backgrounds, and browser frame progression. A byte/count/gutter pass is
  mechanical evidence, not visual approval.

The Aktenkurier, Archivbotin, Formularsammler, Nummernflüsterer,
Nachtschicht-Melderin, Pfandarchitektin, Kopiependler, and
Warteschlangenpoetin use a second office-only lane: four registered directions
plus work, gesture, look, and flinch poses built by
`tools/amt-character-motion.py`. Cells are 320 × 416 desktop and 160 × 208
mobile. Aktenkurier and Archivbotin use 16 phases per direction plus eight
frames for each work/gesture/look/flinch state: 96 cells packed in a 12 × 8
grid, with state offsets 0/16/32/48/64/72/80/88. The other six retain eight
phases per state in an 8 × 8 grid. A route stop performs paperwork and gaze actions
before the next direction begins; queue calls may request a look/flinch
sequence. Gait phase advances with traveled distance. The
source paintings touch some side-view shoes to their trousers by only one
pixel; separating garment and legs in `painted_walk` detached a shoe. For
these particular paintings, warp the intact silhouette with a continuous
field and reject any frame with a second substantial alpha component. Verify
all 96 (pilot) or 64 (other cast) exact encoded cells per size on light and dark backgrounds, source
registration, prop ownership, ground line, temporal closure, and actual
first-person playback before accepting a regenerated atlas. Contact sheets
and hashes in `output/amt-character-motion/` support that visual review.

Frau Knick has a separate 8 × 6 desk-performance atlas derived from her
existing painted action strip: idle, review, raise, stamp, deny, and talk.
The talk row articulates the lower lip subtly while her line is active; the
desk state controls its start/end and falls back to a readable timed cycle
when browser speech is unavailable. Build with
`python tools/build-amt-sprites.py --clerk-performance` and review both encoded
sizes, including a magnified mouth crop and the full counter-distance view.

For close first-person encounters, derive detail poses directly from the original source sheets, not by enlarging encoded atlas cells. Keep the shared ground pivot, figure scale, and prop ownership. `tools/amt-character-motion.py` emits four 640 × 832 action cells and four directional 4 × 2 walk sheets per moving character; `tools/build-amt-sprites.py` emits 384 × 832 waiting poses and a six-pose/eight-mouth-frame clerk sheet. The renderer requests moving detail only near the player, holds at most one close walk direction per actor, and releases detail after departure. Compact atlases remain the fallback. Inspect encoded alpha gutters, source/detail identity, frame continuity, and near/far registration in desktop and mobile gameplay before accepting a bake.

The two dense walkers instead use 4 × 4 close-walk sheets: 640 × 832 desktop
cells and 320 × 416 low-DPR mobile cells. Mobile screens at DPR≥1.5 use the
full-detail sheet instead of enlarging the smaller one. Their largest texture is the 3840 × 3328
compact desktop atlas; all variants remain below 4096 pixels per side. The
simulation exposes normalized phase while retaining its existing distance
clock and action boundaries. The renderer uses that phase at both resolutions,
including fallback, so doubling samples does not double gait or route speed.
This change densifies walking only. Existing close action art remains one static
pose per state, while compact action rows have eight samples; an advancing action
counter does not establish visible movement in that static close-up variant.

This pilot also repaired inherited profile-shoe inflation/pinching by bounding
the **whole cycle in all four directions** to strength .2.
The resulting movement is a subtle painted shuffle, not a new articulated gait
or a claim of measured foot planting. Original source sheets remain intact;
the pilots consume original-size `*-source-clean.png` RGBA masters. Measured
source-space regions clear trapped red-magenta in hair and hand/coat/key gaps,
with narrow edge cleanup and explicit protection for books, glasses and stamp.
Reproduce these masters with `python tools/amt-character-motion.py --prepare-sources --name <pilot>`,
then bake with `--name <pilot>`. The recipe binds the original source hashes;
surviving painted pixels remain identical and alpha re-import is idempotent.
Close-image pinhole repair is restricted below 72% canvas height to avoid those
prop gaps. Each mobile cell is filtered separately, then alpha below 8/255 is
cleared to keep ringing out of the transparent gutter.

Run `python tools/verify-amt-dense-walk.py` after baking the pilots. It checks
distinct frames, texture bounds, gutters and visible-pixel neighbor/seam changes
for 8 versus 16 samples of the same repaired field. It emits exact PNG cells and
source/native/enlarged light/dark/ordered evidence under
`output/amt-smoothing/review-final/`; it deliberately does not assign visual
approval. Use the skill's hash-bound final-frame gate for the actual review.
`tools/playtest-buergeramt-world.mjs` exercises all 16 indices and wraparound on
desktop/mobile before its existing narrative/doorway/restart checks.

The corresponding flat work→gesture morph was rejected: valid triangles still
smeared face/collar pixels and ghosted the crossing arm. That candidate remains
outside runtime assets. The reusable method selection, sequence wrapper and
failure lessons live in the skill's `references/dense-sampling.md` and
`references/morphing.md`.

For a narrated movement, apply the skill's
`references/narrative-action-rigging.md` beat card before commissioning keys.
It binds route, ordered verbs, speech, light, sound, color valence, event
priority, and recovery. A scene must release its actor and resume the route;
replay and level close clear scene-owned resources. This keeps action-specific
asset generation scoped to the motions the story actually needs.

This office-specific lane uses the project's
`$animate-2d-characters` skill for movement review. The general city
biomechanical candidate and acceptance gates continue below.

## JWD mission-neighbour 2D production (2026-10-13)

This is the authoring contract for the three existing residents in **Nachbarn
kennen lernen**: Frau Fink, Professor Dr. Dr. Heiko Maaslos and Botschafterin
Dr. Inga Maaslos. Heiko and Inga are a married couple; each keeps an independent
actor, work station, speech owner and introduction receipt. Preserve stable ids
`jwd-swabian`, `jwd-parent` and `jwd-watcher`, the existing garden/collision data,
E/touch dialogue flow and three-neighbour mission count. These are resident
performances, not a following-party feature. The present Kranz names are
migration points in visible copy and labels; existing technical house/lot keys
may remain stable.

There is currently **no approved painted source family or 2D animation export**
for any of these three. The repaired four-view closed-rest production inputs are
`assets/sprite-sources/jwd-neighbors/inga-maaslos-source-v2.png`,
`heiko-maaslos-source-v2.png` and `fink-source-v2.png`: each is a 1536×1024
transparent sheet, with front/right/rear/left figures. Their source inspection
and light/dark composites are in ignored `output/jwd-neighbors/source-qa/`;
the v1 variants are rejected working inputs. These v2 sheets establish concrete
candidate anatomy and props, not approved walks, action extremes, quarter
bridges or turns. Figures are not confined to nominal 384-pixel columns:
measure separated silhouettes and whole-figure crops, especially Heiko's front
arm and Fink's broom. A column crop must not cut off source paint.

The [candidate registration](../assets/sprite-sources/jwd-neighbors/source-registration.json)
stores nine distinct painted-mouth profiles, three rear nulls, protected paint,
whole-figure crops and shared family pivots. Run
`node tools/check-jwd-source-registration.mjs` for its hash, structure and basis
checks. This authoring table must be rebound to the exact eventual exports;
its numeric PASS does not approve source design or motion.

The inspected game baseline, `world3d.js jwdCharacter`, supplies procedural costumes,
heads and work tools. Only Heiko's `parent` role has a static named `Mouth` mesh;
Fink and Inga have no explicit mouth geometry. Existing costume/mission facts
are source references, not acceptance of new painted faces. Source approval,
encoded-motion review, fixed recordings and listening remain outstanding until
their actual evidence exists. The installed native voice service reports runtime
and ASR ready; that readiness is not game-side mouth integration, a generated
take, verified alignment or listening acceptance.

Read the skill's [speech-ready authoring guide](../.agents/skills/animate-2d-characters/references/speech-ready-character-authoring.md)
and [narrative action rigging](../.agents/skills/animate-2d-characters/references/narrative-action-rigging.md)
before commissioning keys. [GAMEPLAY.md](./GAMEPLAY.md#jwd-home-and-neighbors)
owns the mission and satire; [JWD speech production](./VOICE-SYNTH-PROTOCOL.md#jwd-neighbor-speech-production-2026-10-13)
owns profile selection and exact recorded text. Keep one existing visual gate
at source and final export; this section adds no parallel approval ledger.

### Character-specific source locks

Approve all three at a shared game figure scale before expanding a family.
Use the root's painted caricature treatment, visible brushwork and restrained
municipal colour; give each face its own proportions, asymmetry, crease,
attached corners, jaw support and oral limits. Preserve one ground pivot and
figure scale through every view, prop grip and work/action key. A common render
method does not authorize cloning another character's anatomy or a generic
smile/slit. Inspect source eyes, nose, lips, hands, garment joins and shoes at
native close-up resolution and the intended game projection.

| Resident / source key | Identity and costume to retain | Own performance and prop contract |
| --- | --- | --- |
| Frau Fink / `jwd-swabian` | Swabian Kehrwoche enthusiast; v2 headscarf/knot, apron/pocket, practical plum dress and round face with her own downturned closed crease. Source approval remains pending. | Wash her VW-style SUV; change to hedge trimming; settle with her own broom and a practical, concise admonishing gesture. V2 holds the broom in her anatomical **right** hand; preserve that grip through all views. Work sponge/shears and carried broom have explicit handoff/contact keys. Lawn, sweeping, hedge and letter beats point to existing objects or use a free hand; they do not require a new resident or floating document. |
| Professor Dr. Dr. Heiko Maaslos / `jwd-parent` | V2 has shaggy sandy blond hair, light reddish blond stubble, a brown ribbed high zip-neck sweater and a thin closed lip within the stubble. Compare privately with the user's reference; the private photo is not shipped. Preserve the removed spectacles/bow tie/waistcoat decision. | Wash/polish the BMW-style car; release the sponge; a formal restrained open palm, a controlled explanatory finger and a small self-justifying head change serve his own lines. Keep the zipper/ribbed collar and protected stubble outside the lip support. V2 has **empty hands**; do not reintroduce the old unused monograph prop from a generic carry-name list. |
| Botschafterin Dr. Inga Maaslos / `jwd-watcher` | Diplomat, Heiko's wife and Theodor's mother; v2 bun, suit/blouse/lapels, pearls, pin and angular oval face with restrained asymmetric lips. Her individual source lock is still subject to approval. A saved voice profile is not accepted portrait evidence. | Wash the Tesla-style car; release the sponge; restore the briefcase and a precise free-hand enumerating gesture. V2 holds the briefcase in her anatomical **left** hand; retain actual near/far occlusion, including its hidden right-profile view. Electric-car, garden-rule, blind and schedule beats use restrained gaze/hand changes while maintaining complete suit, elbow and grip joins. |

The couple's source sheets must retain their distinct identities while reading
as residents of the same scene. Theodor remains the already-mentioned
eight-year-old child in dialogue, with six languages and Latin/milestone
pressure; this brief does not introduce a fourth animated child. Keep the
satire on status anxiety, unsolicited lectures and selective rule enforcement.
Heiko's formal concern/backhanded assistance and Inga's diplomatic literalness
need their own gestures and mouth correspondence. No diagnosis or exaggerated
facial defect supplies the joke.

### Existing paths, clocks and receipts

`jwd-gardens.js` owns world positions, paved approaches, car/hedge rectangles
and work targets. Coordinates below already include the existing 560-unit rail
gutter. Do not reposition a work station to accommodate an illustration.

| Resident | Wash station `(x,y)` / target | Existing additional route |
| --- | --- | --- |
| Fink | `(780,4670)` / `jwd-vw` at `(705,4680)` | Trim at `(876,4700)` toward `jwd-fink-hedge`; wash→trim passes `(780,4700)`, then the trim point. Return passes `(780,4700)`, then wash station. |
| Heiko | `(1400,4690)` / `jwd-bmw` at `(1315,4680)` | No authored trimming routine. Gate approach and return use his station column. |
| Inga | `(1567,4660)` / `jwd-tesla` at `(1482,4680)` | No authored trimming routine. Gate approach and return use her station column. |

The shared cross path is `y=4540`; gate is `(1090,4550)` and gate-aside
`(1175,4540)`. `jwdCrossRoute` first reaches the actor's cross-path column;
for Fink on the hedge side it first returns to her station's X before crossing.
The approach then takes `(gate.x,crossY)` and the gate. Return uses
`jwdCrossRoute`, `(station.x,crossY)` and the station. Preserve those exact
helpers and body clearance, rather than drawing an apparent approach in place.

`walkJwdRoute` moves at 62 game units/second with radius 13, removes waypoints
within two units, waits at obstruction and uses the existing detour/retry
logic. The 0.75-second progress check requires six units of progress; waiting
retries every 0.5 seconds. A blocked or waiting actor has stationary feet.
Current primitive gait is distance-owned in `syncChar`; a painted walk's
manifest must likewise consume actual displacement and a contact-calibrated
cycle distance, preserving route speed. Start with 16 genuine visual samples
per walk cycle; approve opposite contacts/passing and the loop seam before
expansion. More repeated holds do not count as more distinct samples.

Work reads `n.activityPhase` only in the nearby running simulation. The current
stroke is `sin(activityPhase*3.2)`, a roughly 1.96-second cycle. Fink changes
between washing and trimming after 24 simulation seconds, following her
authored path; Heiko and Inga wash their separate cars. Preserve pause and
phase ownership. Soap/drips stop with work, and tool/hand contact follows the
rendered car surface rather than its larger collision rectangle.

Manual E/touch interaction chooses a non-burglar neighbour within 92 units.
An automatic visitor is the first unmet resident, otherwise the existing
complaint-index selection. Home return rearms one finite visit; the visitor
approaches while home distance is below 420 and speaks only within 90 units
of the player with home distance above 75. Completing the finite dialogue
clears the visit and sets the existing 38 simulation-second garden cooldown.
Leaving beyond 650 cancels the approach/returns its owner; beyond 1000 nearby
work stops updating. Keep the existing rearm, collision and cancellation rules.

Both the premature and ordinary `talkJwdNeighbor` branches retain the concrete
resident, assign the selected stable game `voiceId` to `openDialogue`, and
establish that resident's finite interaction owner before requesting speech.
The premature greeting releases back to the prior work/idle state and creates
no `jwd.met` receipt or repeat-topic increment. Ordinary dialogue preserves the
existing final-acknowledgement callback: it adds `n.id` to `jwd.met`, clears
the pending visit and sets the existing 38-second cooldown on the departure/
visitor branch. Audio completion only unlocks the current line;
neither its start/end nor a body cue creates an introduction receipt.
`nextDialogue` may stop an active line before advancing. Preserve the three
receipts and subsequent Anmeldung II progression; home narration, allocation,
arrest and the burglar retain their separate owners.

### Source/state and view plan

Build the readable verbs before filling a sheet. This table is a production
plan derived from existing state, not a new gameplay state-machine framework.
The renderer consumes the current route/activity/dialogue owner and its phase.

Add one finite resident interaction phase in `game.js`, retained on the
current resident/dialogue owner (for example `n.jwdInteraction`): held work →
release → settle → ready/speak → recover. Advance its authored body progress
through the existing `update(dt)` lane, including the modal reaction branch
before the city-simulation return. Only the owned resident advances there;
ordinary routes/work stay paused under the existing modal, hidden-page and
HUD-pause rules. Capture the held work/source phase on entry, and gate audio
submission until release/settle reaches the approved planted speech anchor or
the declared missing-art fallback. Consecutive lines/replay retain that ready
body owner, while lips sample only the current actual media attempt. At normal
dialogue close, commit the existing mission receipt/cooldown on acknowledgement
and retain a return intent; activate the existing return route only after
recovery reaches its planted anchor. Cancellation/replacement releases the
old oral attempt and recovers its own resident; stale callbacks cannot start
another resident's audio or route. Use the same frame update and existing
attempt guards, with no new RAF, independent timer, media clock or dialogue
framework. This phase and audio gate are required additions, not current runtime
behavior.

| Verb / source family | Trigger and phase authority | Required source/action proof |
| --- | --- | --- |
| Planted ready, look and blocked wait | Arrival, existing route wait or idle; existing facing | Separate own front/right/rear/left anchors and needed quarter bridges; stable soles, subdued breathing, a clear no-mouth rear. Wait does not advance gait. |
| Walk / stop→turn→start | Actual route displacement and facing; existing turn/arrival | Four directional contact/passing/opposite-contact sources and genuine inbetweens; plant before the whole-body turn. Register visible front/side mouths even if current foreground speech is planted. Preserve source prop hand through outward and return arcs. |
| Car wash/polish | `jwdActivity='wash'`, target/facing, `activityPhase` | Four stroke extremes with wrist/elbow/shoulder correspondence in each needed view; sponge fixed to the real car side, complete forearms and hands. Pair compatible source keys continuously and approve the return-to-first seam. Broom/briefcase is owned stowed paint or an owned part, not a second unconnected prop. |
| Hedge trim / tool handoff — Fink only | Existing 24-second activity switch, route arrival and work phase | Wash-release, travel with safe tools, shears grip/open/close and connected return keys. Blade motion follows the existing stroke; preserve both hands, headscarf, apron and hedge contact. The broom→sponge→shears handoff needs real source bridges when occlusion changes. |
| Work hold→release→face player→settle | Finite resident interaction phase, captured held work source and approved planted speech anchor | Select a safe held source, release tool contact and restore the carried prop before the planted line. Current `syncJwdCharacter` can keep the sponge/arms frozen at a work station even when `jwdWorking=false`; this is a known transition gap to repair, not approved speech posing. Use the finite resident phase above; held `activityPhase` is an entry source sample, not the clock that advances release while the city is modal. |
| Hear / own speaking pose / topic gesture | Actual current line, speech owner, bounded cue progress | Own crease and mouth limits in the planted front/profile and approved quarter poses; modest resident-specific gaze/gesture extremes. Deform each paired source's lips before body transport. A breathing/gesture loop may continue while lips hold on a media pause, respecting the established body owner. |
| Release→recover→return to work | Current dialogue close/cancel and finite resident recovery phase; retain the existing return intent and activate its route after the planted anchor | Stop oral ownership and restore inactive paint, lower the free hand, retain carried prop, plant/turn/walk and restore tool contact at the original station. Inspect the return arc, not merely the forward speaking transition. |

Use approved source keys or a source-pixel rig for bounded paint transport;
the [paired Gaussian action method](../.agents/skills/animate-2d-characters/references/paired-gaussian-actions.md)
can serve compatible work/gesture intervals. It supplies interpolation, not
missing hands, jaw shapes or hidden views. Crossing sponge/broom/briefcase,
changing sleeve occlusion or a newly exposed cheek can require approved bridge
art before more deformation. Keep opacity and source correspondence stable;
whole-body crossfades that double hands/face corners or smear the collar fail.

For every displayed source/cell, record actual crop/dimensions/hash, pivot,
view, semantic lip centre and full tangent/normal. Front and profiles use their
own painted anatomy. Rear views have an explicit null mouth. Front quarter
views need their own approved visible contours; rear quarters or props that
hide the lips remain null, rather than projecting a frontal aperture onto them.
Partial visibility uses a transported mouth/occluder mask or existing owned
part depth so neither oral fill nor skin transport covers the prop. If the
remaining region cannot articulate safely, suppress it for that pose.

Fit true joined corners, a plausible closed crease, the complete source cavity
including teeth/high upper opening/dark corner wings, upper/lower aperture,
width, rounding, lower-lip contact and tooth exposure. A five-knot curve is a
compact example, not a prescribed universal face. Recenter/enlarge a local
registration if real paint exceeds allowed controls; never truncate a cavity
to make validation pass. Heiko's stubble, Fink's scarf/nose and Inga's pearls,
lapel and eyes have explicit protected paint. Do not manufacture tooth bars
where source design provides none.

An owned closed cue removes a deliberate pre-open cavity; inactive speech
returns the exact approved source. Transport both mouth axes through the
source field's Jacobian, including shear and pixel aspect, then inherit actor
transforms and the actual loaded variant. Source endpoints articulate with the
same normalized cue **before** paired body transport/mixing. The skin remap
has a positive Jacobian and returns to identity with zero displacement and
identity derivative at protected/support guards. Width/contact displacement
uses the same guard. This prevents the observed hard-cutoff sampling jump and
bright central stretch. Use the existing connected surface math; check actual
pixels as well as finite/monotone controls.

### Exact dialogue and audio interaction

The source inventory is **37 unique German/Denglisch lines with 37 paired
English translations, 39 actor/line bindings**. The one premature greeting
is spoken by each addressed resident in that resident's own voice. Do not
deduplicate its ownership to one shared narrator.

| Actor | Introduction | Repeat pool, in existing cyclic order | Line bindings including preliminary |
| --- | --- | --- | ---: |
| Fink / `jwd-swabian` | `swabian`: 2 lines | `lawn`, `sweeping`, `hedge`, `letter`: 2 each | 11 |
| Heiko / `jwd-parent` | `parent`: 3 lines | `paint`, `concern`, `polish`, `parking`, `latin`, `smalltalk`: 2 each | 16 |
| Inga / `jwd-watcher` | `watcher`: 3 lines | `electric`, `gardenRules`, `blinds`, `schedule`: 2 each | 12 |

`game.js jwdCopy` remains the exact narrative authority. Freeze the Maaslos
names and couple identity in German/English source, mission text, house/car
labels and cast before generating takes. Preserve the rest of the authored
lines, negations, Theodor's age/languages, humour and corresponding translation.
Home narration, laminated car notice, generic villa remarks and Ede's dialogue
are adjacent content, not extra allocations to these three actor voices.
`VOICE-CAST.json productionVoices` owns the stable game voice-id mapping;
actor ids, native UUIDs and clip ids are distinct fields.

Inga's selected live `GS Inga Maaslos` UUID and both confirmed reference hashes
are pinned in the [voice protocol](./VOICE-SYNTH-PROTOCOL.md#jwd-neighbor-speech-production-2026-10-13).
Reuse it; keep original/reference audio private. Heiko and Fink selections
remain unresolved until the audio owner binds explicit profiles in the same
cast authority. No similar-sounding profile, default family voice or saved
profile name alone substitutes for those choices. This authoring contract
does not claim completed recordings, human listening or accepted new art.

The minimal runtime addition retains the concrete resident and fixed voice-id
on the existing `activeStimulus` generation plus `dialogueVoiceToken`.
This is a required broker/bridge addition, not current actor ownership. Both
`talkJwdNeighbor` branches bind actor and fixed voice before the request; the
renderer reads the actual active attempt/playhead rather than inferring speech
from the dialogue label or selected resident. Resolve
exact `(voiceId,source)` recordings, use that actual native buffer/media
playhead for clip-bound mouth cues and retain the resident through start,
pause/resume, end, error/fallback, replay and cancellation. In the current city
broker, recorded `item.subtitleElapsed` already derives from
`audioContext.currentTime - startTime`; a composite take preserves each segment
offset and gap. Use the actual playback clock, not subtitle pagination or an
audio-level oscillator, for lip sampling. No runtime recognizer, new model,
audio player, RAF or recurring mouth timer is needed.

Pause holds the sampled mouth cue; actual end/cancel restores inactive source
paint. Body/work pause follows the existing mission/dialogue owner. Old receipts
from a stopped line cannot release or move the next resident. Keep cleanup in
central cancellation as well as completion: `stopSpeech` clears the active
stimulus without invoking its old caller's `done`. Captions/source paint remain
usable on missing profile/audio/registration or late variant preparation.
An explicitly tested bounded estimated rig may serve authored fallback, with
its coverage labelled estimated; loudness or recognizer/grapheme estimates do
not establish verified phoneme alignment. Fixed-voice missing media follows the
selected caption fallback instead of changing to an unrelated voice.

Dialogue holds only one foreground resident. Decode the current line and,
if needed, one selected next line; release caches on scene departure/disposal.
Measure actual full-text PCM cost (`sampleRate × channels × 4 × seconds`) and
compressed transfer. Preserve natural endings of long lines; do not truncate
or accelerate a take to meet an animation or loading budget. Exact script,
native EOS, encoded ASR/levels, reference/renderer identity and explicit
listening status use the established voice production checks.

### Initial delivery and device budget

These are **proposed JWD ceilings**, not measured results or approved asset
dimensions. Preflight source detail against actual projected CSS size × DPR at
near/ordinary/far view, using the skill's
[resolution assessment](../.agents/skills/animate-2d-characters/references/resolution-and-upscaling.md).
Lock source masters at a sufficient original resolution before baking; a
512 × 768 master is a starting layout only when native face/prop detail meets
that measured demand. Protect alpha, zero hidden RGB and leave a transparent
cell gutter after encoding. No independent generative upscaling per frame.

| Variant / lifetime | Proposed layout ceiling | Maximum base RGBA8 cost |
| --- | --- | ---: |
| Desktop compact, one per family | 128 × 192 cells, at most 144 cells in 16 × 9 grid; 2048 × 1728 texture | 13.5 MiB/family; 40.5 MiB for all three |
| Mobile compact, selected instead of desktop | 96 × 144 cells, same index/phase, 1536 × 1296 texture | 7.594 MiB/family; 22.781 MiB for all three |
| Desktop close walk, one foreground actor/direction | Two 8-sample pages at 384 × 576, each 4 × 2 / 1536 × 1152 | 6.75 MiB/page; 13.5 MiB for the active direction |
| Mobile close walk, one foreground actor/direction | 256 × 384 cells, 16 samples in 4 × 4 / 1024 × 1536 | 6 MiB |
| Close action endpoints, current interval only | Two 384 × 576 desktop images, or two 256 × 384 mobile images | 1.688 MiB desktop / 0.75 MiB mobile |

This reserve accommodates 64 walking samples plus up to 80 compact turn/work/
gesture samples; it does not require 144 cells or certify that one master can
supply all poses. Derive the real action count from the approved source plan.
If needed bridges exceed the ceiling, revise lazy packages/admission or the
far representation after rendered review; do not omit a required transition
or compress the anatomy merely to fill this table. A continuous paired-source
work/action can use approved sparse keys and the existing transport instead
of a resident high-resolution all-action sheet.

Target incremental JWD resident texture memory below 64 MiB desktop and
32 MiB mobile; report decoded image copies and GPU buffers separately. The
table's three compact textures plus active close walk/two endpoints cost about
55.69 MiB desktop or 29.53 MiB mobile before such extra copies. Aim for at most
2048 pixels per texture dimension and 16 MiB per texture as required by
[ASSET-POLICY.md](./ASSET-POLICY.md#asset-and-loader-contract). A high-DPR mobile
near view that exceeds its selected source must choose adequate prepared detail
or report no-fit; screen width alone does not justify enlargement.

Target compact encoded transfer at most 3 MiB total desktop / 1 MiB mobile;
near files are bounded, selected on approach and measured separately. Add zero
JWD art/audio/model transfer to title/startup before the player approaches the
neighbourhood. Reuse the existing two-job asset queue, shared renderer and
1.6 MP drawing-buffer cap. Keep only one close direction/foreground actor
resident, use the matching compact source at the same phase during preparation,
and release detail on departure/cancel. Do not request both resolutions or
all 37 recordings. Measure frame/input p95, cold approach readiness and memory
against the current accepted game in the existing browser harness; source
dimensions and compressed byte counts alone cannot pass playability.

### Checkpoints and smallest implementation route

1. **Freeze identity and script.** Keep ids/stations/collision/mission callbacks;
   migrate the couple's visible names, capture exact line/translation inventory
   and explicit voice selections. Approve three individual source designs at
   shared scale, then front/profile/rear, contact/passing, wash extremes and
   planted speech extremes. Fink additionally proves trim/tool handoff; Inga
   proves briefcase grip; Heiko proves sweater/stubble and no source-reference
   identity drift. No new sheet is accepted merely because a profile UUID exists.
2. **Prove one complete existing beat.** After designs pass, Inga's confirmed
   voice makes her wash→release→planted line→recover→return pilot a concrete
   first lifecycle. Reuse `jwdCharacter` as missing-art fallback and the existing
   atlas/player/paired-source tools for the painted representation. Add only
   exact JWD selectors and speech-owner data to the current game/renderer;
   preserve station contact, relative camera view, physics bounds and body phase.
3. **Expand the other two and all states.** Carry the validated method to each
   actor's own approved sources, mouth shapes and work/gesture keys. Test Fink's
   full wash→walk→trim→walk loop, all three blocked routes/turns, dialogue entry
   from a station or visitor route, every introductory/repeat line and the
   three receipt mission flow. A copied profile or a single standing clip does
   not establish another resident's source or changing-pose speech.
4. **Apply the existing final gate.** Inspect every affected encoded source,
   endpoint, view, interval substeps, outward/return arc and loop seam at native
   and game size on light/dark backgrounds. Render inactive, owned closed,
   opening/rounding/contact extremes and ordinary actual-media speech while
   body/head/props change. Validate desktop and Android portrait/landscape,
   reduced motion, audio-off/caption fallback, hidden pause, natural end,
   interruption, stale receipts, replay, missing/slow assets and renderer/scene
   disposal. Independent Physics verifies soles, path/collision/car contact;
   Camera/Scale verifies identity, framing, depth/occlusion and attached lips on
   the same frozen candidate, then the integrator applies the browser gate.

Bind observations to source/manifest/profile/cue/runtime/recording hashes in
the existing record. Silent timing versus perceptual listening, forced clips
versus natural mission traversal, estimated versus verified alignment, browser
emulation versus physical device and covered versus untested poses remain
explicit. Required failures or NOT RUN evidence stay outstanding. This section
is a complete production protocol; it is not a claim that these new painted
families, recordings or interactions have already been implemented or accepted.

## Accepted city walking atlases

For exact asset locations and examples using the existing game controllers, see [City character animation assets](../assets/characters/README.md). Reuse these manifests and approved PNG files for the six city actors.

The root game loads six reviewed painted character manifests: Merkel, Bayern,
Alice, and Merz under `assets/characters/`, plus the two Germans on vacation, carrying towels, under
`assets/tourists/`. Each has separate down/right/up/left eight-phase walks,
stop/whole-body-turn/start paths, an explicit grid and ground pivot, and a
SHA-256-bound static PNG file. The vacation pair also
have approved reaction/look rows. `tourist-animation.js` advances gait from
actual travel, queues the latest requested facing at the stride boundary, holds
position through the timed turn core, and resumes at phase zero. Merz's pouring
keys use action time while his feet use ground distance. `character-interactions.js`
plays only the towel pair's planted reactions. The original pre-rig atlases
remain missing-file fallbacks; articulated candidates are preview-only.

All six manifests and their exact-frame review records live with the assets.
Keep their approved pixels, character identity, props, actions, routes, voices,
and shared camera-facing pivot when changing the runtime. Verify the loaded PNG
hash and dimensions, all directed turns, desktop/mobile gameplay, and both
GitHub Pages views before publishing changes to this contract.

For speed calibration, follow the skill's [planted-foot assessment](../.agents/skills/animate-2d-characters/references/painted-walking.md#calibrate-ground-speed-to-planted-feet): mark exact-export sole contacts, fit ground distance per cycle at the character's actual billboard scale, compare residual slide in shoe lengths, and inspect the live gait. The current distance-driven controller prevents stepping while blocked, but that alone does not verify that a planted shoe stays fixed on the ground.

The accepted side-view cycle distances, in game units, are Merkel 24, Alice 27, Bayern 32, Merz 25, Herr Sandale 13.5, and Frau Sandale 14. `assets/characters/gait-calibration.json` records twelve SHA-256-bound right/left contact traces, prior settings, billboard scales, fitted distances and sole-edge measurement regions. The project skill's `scripts/assess_walk_speed.py` reproduces the fit and slip comparison. These are sole-edge contact proxies from the exact accepted pixels; inspect actual foot identity and normal-speed game playback when revising the atlas. The manifests own the runtime values and the character review sandbox reads them, so it shows the same cadence as the game. No approved art pixels or route speeds changed.

This is the authoring and preview contract for the experimental articulated
atlases in Germany Simulator. All six characters use one deterministic gait,
one fixed registration grid, and one signed verification gate. The browser
preview receives ordinary PNG atlases; the rig, ImageGen sources, SciPy, and
Pillow remain offline production tools. The canonical game uses the accepted city manifests above; the experimental
rig and ImageGen sources remain offline preview material.

The previous whole-pose hold lane (`authored-key-hold-v1`) is superseded by
`biomechanical-rig-v3`. Its assets remain recoverable under
`assets/sprite-archive/pre-identity-lock-20260922/`. The original generated
pose sheets remain under `assets/sprite-archive/pre-rig-20260921/` as immutable
identity references. The root game reads their built atlases only if an accepted manifest fails to
load; this does not create or maintain a second game tree.

## Authorities

- `assets/sprite-sources/rigs/registry.json` defines the 512/256/128 grid,
  rows, directions, props, and shared gait contract.
- `assets/sprite-sources/rigs/*/parts.png` are the accepted identity-matched
  layered source sheets.
- `tools/build-rigged-sprite-atlas.py` is the sole production builder.
- `assets/sprite-sources/*-keys.png` contain the eight reviewed biomechanical
  phases emitted by that builder.
- `assets/sprite-sources/rigs/pose-audit.json` records every root, hip, knee,
  ankle, stance/swing state, travel sign, and phase for every final cell.
- `tools/verify-sprite-animation.py` is the hard release gate and contact-sheet
  renderer.
- `assets/sprite-sources/verification.json` is the signed hash ledger.
- `assets/*.png` is the experimental preview output authority.
- `assets/sprite-archive/pre-rig-20260921/assets/*.png` is the temporary root-game
  runtime authority until the articulated set receives a new explicit visual acceptance.

## Fixed grid and phase clock

Every character is authored on a 512 × 512 working cell, reviewed through
eight 256 × 256 key cells, and shipped as 32 direct 128 × 128 RGBA cells per
row. The cell midpoint, pelvis root, ground line, render scale, head plate, and
torso plate are fixed. Directional source parts are normalized once per
character before frame evaluation so head, torso, and bone scale do not jump
between front, back, and side rows. Never crop, normalize, or recenter
individual frames.

The eight anchors are:

```text
0  contact A      4  loading A      8  passing A      12 push-off A
16 contact B      20 loading B      24 passing B      28 push-off B
```

Each four-cell interval is evaluated by bounded cyclic Catmull-Rom sampling of
anatomical coefficients. Whole character pixels are never blended. Frames
0/4/8/12/16/20/24/28 reproduce the eight source keys one-to-one; the other 24
cells are independent rig evaluations with the same identity layers.

## Shared biomechanical mechanism

The gait vector stores pelvis height and, for each leg, forward displacement,
toe lift, and discrete stance ownership.

1. Contact begins in double support with the new stance foot ahead of the
   pelvis and the previous foot behind it.
2. Loading lowers the pelvis slightly while the stance foot stays on the
   ground.
3. Passing places the swing ankle at the body midpoint with maximum toe
   clearance; this is the visible leg-crossing phase.
4. Push-off places the stance foot behind the pelvis while the swing foot moves
   ahead.
5. At the opposite contact, stance ownership swaps and the cycle repeats.
6. Arms counter-swing unless a prop contract fixes them to a carried object.

Side views use fixed-length two-bone IK. Front/back views solve the same gait
in a vertical/depth plane and project it orthographically. Depth is compressed
to keep limbs readable, and the projected knee must retain at least six
runtime pixels above/below its neighboring joints. That screen-space safeguard
does not stretch the spatial bone; it prevents a valid bone aimed at the camera
from disappearing in a small sprite.

The stance foot has zero lift and its forward coefficient moves monotonically
backward relative to the pelvis. The swing foot moves monotonically forward
and reaches positive toe clearance. Reversing the frame clock to change travel
direction is forbidden because it creates moonwalking.

## Walk review borrowed from Pets

The Pets sprite-sheet guidance contributes visual-production checks, not a
human gait model or its 8-column atlas format. Apply these checks to each
character's existing 32-frame walk rows alongside the joint/contact gate above:

1. Review a side walk early, before building every direction. Contact,
   loading, passing, and push-off must read as one alternating left/right
   cycle at the sprite's actual game size, with no reversed step or stationary
   shuffle. The joint audit, sole contacts, fixed bone lengths, and stance slip
   checks establish the anatomical evidence; attractive frames alone do not.
2. Keep one character-wide scale, pelvis registration, and ground reference
   across the full cycle. Never crop, stretch, or recenter individual frames
   to make a generated strip fit. If extraction creates popping while the
   source is stable, correct the shared extraction transform first.
3. Mirror individual approved side frames in place only when the registry
   permits it and clothing, markings, light, and carried props remain valid.
   Preserve temporal order. A mirrored whole strip that reverses the frame
   clock fails even if its stills look plausible.
4. Inspect the contact sheet and a continuously looping preview, including
   the final-to-first seam, at desktop and mobile sprite sizes. Check identity,
   limb attachment, foot planting, toe clearance, silhouette, alpha edges,
   prop anchors, and visible size or baseline jumps. A mechanical pass does
   not establish natural-looking motion.
5. Repair the smallest failing source row or rig parameter, then rebuild and
   recheck the whole affected cycle. Do not paste a one-off corrected runtime
   cell into an otherwise coherent row. Validate the exact atlas bytes that
   the preview or game will load after each revision.

These rules adapt the local Work Pets `create-pet` animation-row and
sprite-sheet review guidance. Pet-only states, look-direction rows, upload
tools, and timing values do not apply to Germany Simulator.

## Direction contract

- `front-*`: faces the viewer and moves down-screen.
- `back-*`: faces away and moves up-screen.
- `right-*`: faces and moves right.
- `left-*`: faces and moves left.
- `{ "mirror": "right-walk" }`: exposes the exact horizontal mirror for left
  travel when a character has only one side rig.

Front, back, and side use separately generated identity-matched parts. Never
blend a front bitmap into a back bitmap. Mirroring is allowed only where the
registry explicitly declares it.

## Runtime phase rule

Runtime animation advances from actual ground distance, not elapsed time.
`advanceSpriteGait` maps accumulated movement distance onto the 32-cell clock.
A blocked or paused character therefore stops its feet. Faster characters,
including Alice at 1.5× standard speed, complete the same physical stride in
less time without changing gait anatomy.

## Identity and composition rules

1. Head and torso are rigid plates from the same accepted part sheet in every
   frame. They may follow the bounded pelvis bob but may not morph.
2. The chin/head-bottom anchor meets the shoulder line within eight working-grid
   pixels in every frame. The shared fullness and compact-limb correction is
   part of the established caricature silhouette; do not reintroduce a tall
   neck or narrow, elongated body.
3. Limbs rotate from stable shoulder/hip sockets. Both legs render behind the
   torso/pelvis so registration sockets cannot cover clothing.
4. Rounded joint bridges and caps cover authoring sockets; exposed orange or
   silver registration marks are a failure.
5. Props use declared anchors. Flags, towels, food, bucket, watering can, and
   Merkel's diamond pose must not pull the root or head registration.
6. Every body part, hat, head, prop, foot, and antialiased edge stays inside
   the transparent cell safety margin. Transparent pixels contain zero RGB.
7. Source art from one character may never be reused to reconstruct another.
8. A shared gait normalization may use a deterministic character-wide identity
   calibration when the archived reference has deliberately non-generic
   caricature proportions. Measure it against corresponding directional cells,
   apply it to every frame in that view, and verify crown, shoulder, jacket,
   hip, and shoe bounds in the desktop and mobile preview. Per-frame fixes are
   still forbidden. Merkel's accepted front/side/back outer silhouettes match
   the archived reference within two pixels per axis at the reviewed anchors.

## Automated release gate

Run from the repository root:

```powershell
python tools/build-rigged-sprite-atlas.py --preview-dir output/sprite-biomechanical-preview
python tools/verify-sprite-animation.py --allow-unsigned `
  --report output/sprite-biomechanical-report.json `
  --overlay-dir output/sprite-biomechanical-overlays
```

The unsigned pass must succeed before review. It verifies:

- exact 8-key to 32-cell correspondence at the named anchors;
- 32 distinct final poses in every current walk row (hard minimum 28);
- fixed cell/root/head registration and complete transparent margins;
- chin-to-shoulder connection and direction-consistent compact proportions;
- discrete alternating stance ownership and double-support contacts;
- zero stance lift and positive passing toe clearance;
- monotonic stance/swing travel, correct forward direction, and no moonwalk;
- side stride separation and front/back near/far depth ordering;
- both passing-leg crossovers;
- bounded bone projection, joint-to-pixel coverage, and loop seam;
- every registered row/direction, including mirrored-left exposure.

The overlay contact sheets draw cyan/orange hip-knee-ankle graphs and a green
root directly over all final cells. A reviewer must inspect every row at full
resolution and reject cropped heads, disconnected limbs, joint flashes,
identity changes, backward steps, foot sliding, depth inversions, or uncanny
front/back collapse. The reviewer then updates all hashes/date/status in
`verification.json`; the ordinary signed command must pass afterward:

```powershell
python tools/verify-sprite-animation.py `
  --report output/sprite-biomechanical-report-signed.json `
  --overlay-dir output/sprite-biomechanical-overlays
node --test tests/sprite-pipeline.test.mjs
```

Any later part, key, runtime, identity reference, registry, or audit change
invalidates the signed gate.

## Adding a character

1. Create one identity reference sheet with front, back, and side views.
2. Use built-in ImageGen to create a transparent three-row, fourteen-part
   sheet in the exact order documented in `rigs/PROVENANCE.md`.
3. Inspect alpha, identity, clothing, props, anatomy, and all pieces before
   registration. Record prompt, date, tool, reference, and checksum.
4. Register parts/source/runtime/identity paths, semantic rows, prop mode,
   walk rows, and direction exposure once in `registry.json`.
5. Build all 32 samples. Never author runtime-only exceptions by hand.
6. Run the unsigned gate and inspect every overlay.
7. Correct the rig or source sheet until every mechanical and visual check
   passes; never lower a threshold merely to admit a visible defect.
8. Sign exact hashes, run the signed gate and full tests, then bump the runtime
   asset cache token.

The retained ImageGen gait proposal at
`assets/sprite-sources/reference/biomechanical-gait-proposal.png` is an
educational visual reference only. The coefficient model, rig audit, and final
overlay inspection are production authority.

## Merkel 21-point candidate lane

`assets/sprite-sources/candidates/merkel-21/` is a deliberately isolated
preview lane for testing a more targeted image-by-image walk. Its four raw
ImageGen sheets each contain eight keys in the fixed order contact A, loading
A, passing A, push-off A, contact B, loading B, passing B, push-off B. Left and
right are separately authored sources. `tools/build-merkel-21-candidate.py`
registers those keys, takes the head, hair, face, neck-to-shoulder join, and
central jacket pixels from the archived Merkel sheet, strips those regions
from the proposals, then smoothstep-interpolates centroid-aligned local motion
quadrants. It emits 20 unique playback cells per direction and adds frame 0 as
inspection point 21 only in the audit sheet.

The candidate outputs include normal, exact-closure, skeleton, onion-skin,
difference, invariant-mask, and JSON pose evidence. Rebuild and check them with:

```powershell
python tools/build-merkel-21-candidate.py
python tools/verify-merkel-21-candidate.py
node --test tests/merkel-21-candidate.test.mjs tests/sprite-preview.test.mjs
```

The verifier is fail-closed for source/artifact hashes, separate side sources,
frame count and uniqueness, exact closure, immutable identity pixels, fixed
ground, safe margins, connected silhouettes, opposite leg phase, passing
crossovers, and constant two-bone lengths. Passing it does not approve the
artwork. The manifest must remain `candidate-unapproved`, and neither the
builder nor preview may write or redirect the root game's stable loader.

## Browser preview sandbox

`sprite-preview.html` is the standalone comparison surface for the stable game
atlases in `assets/sprite-archive/pre-rig-20260921/assets/`, the experimental
walking atlases in `assets/`, and the isolated Merkel 21-point candidate. It
reads manifest metadata and loads only the selected asset set. Every authored
direction appears on a transparent checkerboard. The grid
synchronizes atlases by normalized walk cycle; focused animation mode exposes
the selected atlas's native frame count, including stable Merkel's 24 frames
and the 32-frame experimental version. Pause, single-frame stepping, scrubbing,
and speed selection support visual review on desktop and mobile. It is an
inspection view, not another renderer or derived asset.
It does not load `game.js`, `world3d.js`, audio, or the game world, and it does
not copy or redefine any sprite asset or direction mapping. The source selector
must not change the root game's stable loader decision.

## Merkel CMU left-walk pilot

The next validation lane is deliberately smaller than the four-direction
Merkel candidate: one character, one left-facing side view, one external gait
capture. `assets/sprite-sources/reference/cmu-walk-69-01/69_01.bvh` is pinned to
the documented SHA-256 and conversion commit. Subject 69, trial 01 is the CMU
“walk forward” capture at 120 fps. Converter frame zero is an inserted T-pose
and must be excluded. Fingers are never hard-gate joints. Toe-base positions,
which CMU identifies as potentially noisy, may drive only the foot axis after
periodic low-pass fitting; raw toe samples never drive a rendered frame.

Build and verify the reference plus pilot with:

```powershell
python tools/build-cmu-walk-reference.py
python tools/build-merkel-cmu-left-pilot.py
python tools/verify-merkel-cmu-left-pilot.py
node --test tests/merkel-cmu-left-pilot.test.mjs tests/sprite-preview.test.mjs
```

The reference extractor performs BVH forward kinematics, derives the capture's
actual horizontal travel axis, detects a same-left-foot gait interval, projects
the required pelvis/neck/head, shoulder/elbow/wrist, hip/knee/ankle, and
ankle/toe joints into the travel/up side plane, and fits three-harmonic periodic
curves before sampling. Equivalent left/right paths are averaged at a half-cycle
offset so the 20-frame clock is one complete left-forward → right-forward →
left-forward sequence with matched cyclic velocity. Point 21 remains an exact
closure copy for inspection.

The pilot preserves Merkel's identity-matched side pieces and fixed authored
bone lengths. Only the smoothed two-dimensional bone directions and captured
lateral depth ordering drive limbs. The body root, head, and torso are fixed
across the complete loop, eliminating whole-sprite recentering. Each foot has a
heel–ankle–toe chain. Its mocap pitch phase is compressed and capped at ±22° to
fit the caricature's oversized painted shoe without an implausible vertical flip.

The verifier must reject any source or artifact hash drift, direction expansion,
missing closure, duplicate playback frame, unsafe margin, rendered joint without
nearby opaque pixels, changing bone length, failure of both feet to own contact,
missing ankle crossover, body-root/head movement, excessive per-joint cyclic or
seam acceleration, or a rendered bone more than 0.2 degrees from its smoothed
movement authority. A mechanical pass is not visual approval. The manifest remains
`candidate-unapproved`; `game.js` and the stable archive remain untouched until
the user explicitly accepts this one cycle. Only after that review may the same
mapping strategy be extended to right, front/back, or another character.

## Preview-only skinned 3D motion study

The user-approved next experiment is a separate **grey 3D motion study**, not
promotion of the rejected 2D pilot. `assets/sprite-sources/candidates/merkel-3d/`
holds one weighted MakeHuman-derived figure and four fixed orthographic renders.
`tools/build-merkel-3d-pilot.py` is its offline authoring authority; the adjacent
provenance and source hashes bind the CC0 mesh/weights, CMU input and outputs.
Legs use contact-constrained, fixed-length 3D IK. CMU supplies filtered 3D arm
directions and cycle timing, not full-body retargeting. Preserve that distinction.

The bake has 32 unique playback poses plus an independently rendered closure
inspection point 33. This lane uses more temporal samples than the earlier
21-point pilot; it does not interpolate independently generated images. Heel,
ankle and toe coordinates, evaluated shoe soles and projected bones accompany
the rendered pixels. Cameras, topology, proportions and lighting stay fixed;
actual mesh depth resolves limb occlusion. Do not recenter individual frames.

Build with `python tools/build-merkel-3d-pilot.py`, verify with
`python tools/verify-merkel-3d-pilot.py`, and run
`node --test tests/merkel-3d-pilot.test.mjs tests/sprite-preview.test.mjs`.
The verifier checks actual evaluated mesh contacts/joints, bone lengths, knee
direction, lateral foot lanes, world-space stance slip, cyclic motion bounds,
alpha/margins and exact native pixel closure. A mechanical pass is **not** visual
approval. Keep `candidate-unapproved`; the face/hair are a plain proportion study,
not an identity-matched paint pass. Shoes roll rigidly, without toe flex.

`sprite-preview.html?source=3d` opens the four-view study; Focus view exposes the
bone/heel/toe overlay and closure sheet. Stable sprites, both older 2D candidates
and experimental atlases remain selectable. The runtime still loads the stable
archive. Never change that decision until the user accepts a finished visual loop.
The first paint experiment fitted identity to this fixed surface; the neutral
guide lane below supersedes that surface constraint after the user's head-shape
rejection. Independent frame generation must still not reintroduce wobble.

The preview alone uses locally pinned Pretext 0.0.9 and Roboto Condensed to check
bounded text after fonts load; native controls and text-spacing overrides also
require rendered 320px/desktop/mobile/200% checks. This does not migrate game UI.

### 3D-bound ImageGen paint pilot

The user's next step is the painted output, not the grey model itself.
`assets/sprite-sources/candidates/merkel-painted-left/` tests that step for one
left-facing cycle only. Built-in ImageGen paints a captured 3D pose using the
archived Merkel sheet as the appearance reference. Its original output, exact
prompt, guide, provenance and hashes remain alongside the derived assets.

`tools/build-merkel-painted-pilot.py` binds that painting once to the existing
weighted mesh with fixed UVs, then renders the same 32 poses and closure. This
is not separate AI generation of every frame. Fixed source-pose registration
and homologous far-limb texture reuse are permitted; frame-dependent UV fitting,
recentring, mesh changes and optical crossfades are not. Hidden texels use part
base colors. Only the left camera is qualified for this view-specific texture.

`python tools/verify-merkel-painted-pilot.py` checks source/output hashes, actual
bone equality to the 3D audit, identical alpha silhouettes, 32 unique frames,
ankle coverage and pixel-exact closure. Inspect every contact-sheet frame and
the browser loop as well: the visible hand geometry, clothing intersections,
and likeness remain review limitations. Keep `candidate-unapproved` and keep
the stable in-game sprites. `sprite-preview.html?source=painted` exposes normal,
bone/heel/toe and closure views beside all earlier versions. Rebuild and source
details are in the candidate's `PROVENANCE.md`.

### Shared neutral guide and independent appearance key

The latest user direction separates reusable motion from character design.
`tools/build-neutral-walk-guide.py` creates one plain mannequin under
`assets/sprite-sources/reference/neutral-walk/`. It uses uniformly scaled source
anatomical landmarks, not the Merkel rest-fitting function, hair, clothes or
paint. The 18-bone meanings, contact schedule, filtered arm swing and cycle
phase are shared across the cast. The source mesh silhouette is never an avatar
mask. Character-specific retargeting must preserve each avatar's own fixed rest
lengths and art, solve grounded contacts again, and handle props separately.

The guide keeps 32 unique frames in four views and an independently rendered
closure frame. `python tools/verify-merkel-3d-pilot.py --neutral` runs the same
real joint/shoe, stance slip, knee direction, cyclic continuity and pixel gates,
plus independent reconstruction of standard limb/head landmarks from the pinned
MakeHuman source. `node --test tests/neutral-walk-guide.test.mjs` also checks
source/output hashes and separation from the character-art lane. This proves
mechanical properties, not naturalness or finished retargeting to every avatar.

One ImageGen still under `candidates/merkel-neutral-appearance/` tests appearance
first: original sprite as dominant reference, neutral contact pose as gesture
only. Original head silhouette, short neck connection, compact/full build and
style outrank neutral proportions. Do not project the new face onto the neutral
head or clip the painting to its body. Keep the exact prompt, raw result and
source crop. The key is `appearance-key-unapproved`, not pixel-identical and
not a walking sheet; final all-frame consistency has not been established.

`sprite-preview.html?source=neutral` shows the two appearance stills separately
from the animated shared guide. Controls animate only the guide, and its title
must not call it Merkel. Focus mode provides the actual bone/heel/toe overlay
and closure inspection. Older sources remain selectable; no game sprite changes.
Only after this appearance direction is accepted should a character-specific,
fixed-appearance binding be built and evaluated through a whole walking cycle.
