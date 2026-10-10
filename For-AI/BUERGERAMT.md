# Bürgeramt interaction cast and cross-domain handoff

The secret Bürgeramt is an episode of the canonical root game. QR admission, the linked phone, the numbered queue, Frau Knick, the police interruption, A38, and the existing exit outcomes remain its required chain. Eight optional walking encounters add movement and atmosphere while the player waits; they never award a ticket or change a counter answer.

## Admission, queue and outcomes

Entering the first Bürgeramt opens a hidden first-person episode outside the building's door. WASD or touch controls lead through the open doorway without an extra interaction into a larger office with a waiting area, several visitors, and four service counters. The QR code lives on a physical sign under the number display; it never opens a game popup. Each phone scan connects to the game session and immediately issues a fresh private `B-###` ticket, which appears on that phone and activates a place in the host-controlled waiting list. A retry with the same scan ID returns the same ticket if the pairing was delayed. The player enters a name on the phone after receiving the ticket; that submission is required before Frau Knick starts the call and there is no separate Anmeldeschalter activation. Background lettered codes cycle continuously even before the player scans. After several calls while the ticket is active, the player's number is called on the red ceiling display and HUD. The phone page must remain visible and connected until the call; hiding it or losing the connection forfeits that ticket. Scanning again or leaving and rescanning issues a new ticket and a new counter opportunity. Schalter 3 looks idle. Approaching Frau Knick before the player's number earns a reprimand and returns the player to waiting. When the player's number appears, the player has a short window to reach her; being late forfeits the appointment without advancing mission 1. The ordinary waiting room has no continuous background music; occasional counter conversations and telephone rings make it busy. The Aktenkurier encounter below is a brief, scene-only musical exception.

The unlisted `?geheim=buergeramt` URL opens directly at the office entrance for repeated level testing. Its fixed restart link reloads only this episode; the normal city entry remains the canonical story route. Direct entry skips unrelated city GLB downloads; normal entry keeps the city asset path. The shortcut is a convenience link, not authentication or a separate game deployment.

The QR sign sits directly beneath the red ceiling number display and asks
visitors to scan it to receive a number. Submitting the phone's ordinary
"Name eintragen" form silently unlocks browser audio and requests fullscreen
and wake lock in that same browser gesture. There is no setup button, test tone,
or early vibration: the incoming police call is the first sound cue. The
browser cannot read or change device volume or Do Not Disturb settings, so an
audible ring cannot be guaranteed. The phone session persists through name
entry, illogical calls, and the later counter interruption. The four counters, entrance threshold, QR stand,
seats, registration kiosk, and desk have matching visible positions and
movement boundaries. The office's worn, painterly caricature style should
make the administrative fever dream vivid while preserving clear paths and
readable interaction cues. Archive cupboards, a copier/fax corner, and a file
trolley are solid furniture; counter tools and dense paperwork add visual
clutter without changing the registration, queue, or call rules.

At the correct counter, Frau Knick starts her existing line, the desktop arms the linked phone, and a brief 217 Hz style speaker-interference cue begins 900 ms before the planned ring. The office's synthesized sound bus ducks during that cue. The phone receives a future ring target in its measured monotonic clock domain when possible, with a public UTC cross-check and receipt-relative fallback; it reveals the call, sounds its first ring burst, and requests vibration at that target. The exact beat and limits are in [the timing evidence ledger](./PHONE-CALL-TIMING-RESEARCH.md). The caller is displayed as `Unbekannte Nummer` or `Unknown number`; the police identity is revealed only after answering. The call controls and status use English when the host game's English subtitles were on at QR creation, otherwise the phone browser's preferred English or German, with German as the fallback. This affects call chrome only: the ticket page, office choices, police speech, and Frau Knick dialogue remain German, an explicit local exception to Berlin's Denglisch rule. The staged incoming-call screen follows a documented phone family: separate tap controls for iPhone and unknown browsers, a centered left-decline/right-answer drag for Google Phone, and separate green-left/red-right drag controls for Samsung Phone. Google and Samsung controls retain tap fallback. Browser hints can identify an OS and sometimes a Samsung model, but not the installed dialer or its settings; [the visual evidence ledger](./PHONE-CALL-UI-RESEARCH.md) defines the fidelity boundary. Declining allows German dialogue choices and then the existing A38 form. Answering starts an automatic, choice-free argument between the officer on the phone and Frau Knick at the counter. Her first outburst overlaps the officer's opening question; later turns wait for each screen's speech to finish, with short pauses adjusted for measured link and speech-start delay. The later accusation interrupts just after she says "Er deckt Anträge!" A word-boundary cue sets that beat when available; a speech-rate timer preserves it in other browsers. The phone acknowledges each completed line so the two browsers keep the exchange in order, with a bounded fallback if speech or the connection fails. She cancels the appointment and the player returns to the street without A38. The mission chain is otherwise unchanged. Spoken text must exactly match the currently visible line on its own screen.

Optional actor conversations pause the queue and never change ticket ownership or either counter outcome.

## Playable storyboard

| Beat | Performance and interaction | Spoken line ownership | Image and sound tone |
| --- | --- | --- | --- |
| Entry | The player enters and approaches the QR. The Aktenkurier walks a short loop beside the left files, stops, and stamps a carried stack. | `buergeramt-story.js` owns his two rotating German lines. | File stamp is a brief low paper thud. Warning shifts his painted texture slightly toward old rose. |
| Queue | The Archivbotin patrols between the right shelves and counter, consults her ledger and keys, and can be addressed. | Her two lines describe the impossible archive procedure. | Key and paper rustle stays below the dialogue. Dread leans cool blue violet. |
| Wait | The Formularsammler shuffles an accordion application along the central aisle, pauses to sort pages, and can be addressed. | His second line offers a small, uneasy release. | Dry paper cue; dread eases to weak amber on relief. |
| Crowded office | Nummernflüsterer, Nachtschicht-Melderin, Pfandarchitektin, Kopiependler, and Warteschlangenpoetin circle short paths with documents, phone, receipt, copies, or numbered ticket. They look up at calls, flinch, read, gesture, and address the player. | Each owns two optional German lines in `buergeramt-story.js`; their speech cannot alter the appointment. | Painted Berlin street clothes, fatigue and uneasy colors distinguish them. Queue calls briefly draw their gaze; only the current speaker receives a subtle color-valence tint. |
| Omen (`omen`) | Before the first ticket, the Aktenkurier leaves his route and approaches the player. The camera turns to keep him in view while the room progressively darkens. At his arrival, the surroundings are nearly black around a bright, slightly iridescent spotlight; tension peaks as he says “Wer die Finsternis sieht, hat sie selbst gewählt!” He holds a longer threatening stare, gradually flattens back into paint, turns through front/side/rear views, and retreats slowly before the office returns. | The exact German verse lives in `buergeramt-story.js`. The in-scene subtitle rail remains the text surface if speech is unavailable. | A harsh, unresolved cinematic cue grows through the approach; its accelerating pulse also drives the frontal depth reveal, coat and tunnel. It peaks with the near-black arrival and line, then dwindles with the reverse depth reveal, without a resolving chord or attack. The queue clock pauses for the encounter, then resumes. The scene is once per visit and clears on exit or replay. |
| Call | Existing number board, QR ticket, phone, police, and Frau Knick take priority. | Existing counter and phone scripts keep their exact visible speech strings. | All optional actor tint returns smoothly to neutral after the encounter. Phone ring, static, and police voice follow the phone's own call level. |

`buergeramt.js` owns routes, interaction range, work pauses, queue-call reactions, dialogue state, the Aktenkurier beat, Frau Knick's speaking/action row, and the active `{id,tone,valence}`. Moving regulars leave a small walking gap around the player; their gait clock advances by distance walked, and a high-priority story action preempts a routine work loop. Speaking eases the first-person view toward the owning actor. `world3d.js` draws that state: four directional walk rows, work/gesture/look/flinch rows, body-facing billboards, a six-row desk performance for Frau Knick (including lip movement while she speaks), an eased material tint, and the in-world blackout spotlight. The tone target is bounded to a subtle fraction of the paint; it changes only for the actor who owns the currently visible line. Ending the line eases back to the original colors. The room's code geometry and existing stationary painted cast stay in place. The office presents all dialogue, choices, and direct-visit outcomes in a non-modal subtitle rail over the visible room. It has no popup screens; the small `TON` disclosure is an optional in-scene HUD control.

The `omen` visual beat unfolds the Aktenkurier's registered frontal gesture into a
small Gaussian sculpture while he approaches. He faces the player throughout;
local +Z expands toward the viewer without a sideways turn. Distance progress
drives the reveal: smoothstep over strength 0.05–1 for depth and 0.08–0.32 for
opacity. At the handoff the sprite holds the registered gesture; this deliberately
statuesque, supernatural approach is a translated relief, not an articulated walk.
The simulation retains its displacement clock; the staged turn is planted and the slow retreat advances gait only with actual travel.
A second, procedural 3,072-splat hollow tunnel curls around the sightline
to his torso: charcoal/violet Gaussian clouds widen toward the camera and narrow
toward him. The shared musical pulse contracts the tunnel and pushes his coat
toward the camera, protecting face detail and the planted foot baseline. Bruised
violet/charcoal replaces rainbow cycling. Both volumes share the same depth-tested
renderer. Distance fog darkens the office behind the readable figure, while the
existing screen vignette seals the outer darkness. The tunnel is an intentional
camera-attached hallucination, without collision or changes to the room geometry.
`buergeramt.js` owns the visit token and
continuous simulation `life` signal; `buergeramt-splat.js` projects that state through the
existing Three.js scene. The exact verse and speech-completion release remain
owned by the existing cue. Reduced motion keeps the crossfade/depth reveal but
removes pulsing, ripples and tunnel rotation. The figure flattens and crossfades back into its registered sprite over 1.8 seconds before turning. Missing or late assets keep the sprite for that encounter.
Exit, replay and cancellation retire the effect and reject stale preparation;
an in-flight GPU sort finishes before its buffers/worker are freed.

## Sound and mix

For a changed cue, use the shared beat card in [`MUSIC-SOUND-DESIGN.md`](./MUSIC-SOUND-DESIGN.md) so its story purpose, controller event, visual action, cue parameters, mix, receipts, fallback, and cancellation are reviewed at one candidate revision. This episode's sound policy below is the current playback authority; the general skill supplies production methods.

The room has a quiet 53 Hz fluorescent hum and short nonverbal file, key, paper, and copy cues at work stops. Effects attenuate with player distance. The red call-board ring and work cues use `EFFEKTE`; `RAUM` controls hum, and `STIMMEN` controls new office speech utterances. During the one-off Aktenkurier encounter, the existing effects bus carries a bounded aggressive cinematic buildup with distorted bass/brass, beating dissonance and abrasive metallic bands. It grows with approach and darkness, holds below the exact spoken line at the peak, then holds the threat and gradually drains with the reverse depth reveal before the turn and silent retreat. It obeys the existing effects mute and clears on exit/replay; it does not start a continuous office playlist or override city music preferences. The compact `TON` disclosure persists the three office levels locally. The phone automatically uses full browser output gain for ring and static, and maximum utterance volume for police speech, with no visible volume control or saved phone-volume preference. Cue envelopes keep their authored relative levels. Device volume remains controlled by the phone's operating system. A voice already in progress follows the level captured at its start because browser speech does not expose a live gain node. No media stream or server is added.

**`omen` beat contract (2026-10-09).** Before the first ticket, one encounter per visit commits only with a reachable, body-clear office path. A bounded 0.35 m grid search uses the existing QR, seats, furniture and paused-character footprints, then removes unnecessary waypoints along continuously clear segments. Exact segment/rectangle and segment/circle checks cover narrow corners between simulation samples. The first 0.9 seconds turn the camera toward him and fade all other office objects and characters to black; an environment parent hides them completely before he advances. Geometry and people retain collision. He follows the clear path at 0.78 m/s, with path-distance progress driving the rising cue and frontal depth. At a clear stop 1.68–1.82 m from the player he delivers the unchanged German line. Actual speech/fallback completion owns a 3.4-second threatening stare, then a 1.8-second reverse sequence: motion settles first, depth flattens over the first 1.17 seconds, and opacity crossfades to the registered painting during the final 0.63 seconds. Score pressure drains smoothly throughout. The same release drains sound without an attack or resolution; the existing 25 ms source cleanup follows its near-silent endpoint. A planted 2.4-second front→side→rear turn uses the accepted directional paint with bounded pivot motion, not an articulated full-orbit reconstruction. His first 2.8 seconds of retreat accelerate gently to 0.48 m/s along the approach path in reverse. The room and original view restore over 1.6 seconds, then control and the queue resume; any remaining return path completes before ordinary patrol, yielding at 1.05 m to the player and replanning around newly loaded props without teleporting. QR scans/name registration remain accepted in every phase and select the resumed waiting stage. A newly blocked route either replans or takes the bounded recovery; phone forfeiture, exit and replay cancel all ownership.

The two authored layers are `assets/audio/buergeramt-omen/bed.ogg` and `tension.ogg`, produced from [original core SuperCollider 3.14.1 source](../assets/audio/buergeramt-omen/render.scd); [provenance and rebuild commands](../assets/audio/buergeramt-omen/LICENSES.md) accompany them. Existing Web Audio on `EFFEKTE` owns playback; an oscillator fallback covers a missing, failed, or late fetch/decode. A newly ready layer cannot enter after 75% approach progress. Source playback has a finite 24-second cap; a hidden document mutes it, and exit or replay stops it and clears the beat. Silent timing checks do not establish perceptual acceptance.

The same story entry owns the omen's authored delivery: browser fallback rate `0.82`, pitch `0.72`, and a word-anchored score contour. Its default voice is the user-approved `aktenkurier-omen-candidate-02` recording from Horst's second official profile; candidate 1 remains preserved. `AUDIO-TEXT-LIBRARY.js` and `VOICE-SYNTH-PROTOCOL.md` own the exact source line, approval and provenance. Actual native playback start begins ducking; ASR-estimated word cues observed against the media playhead move the cue through “Finsternis,” the comma/“hat,” “selbst,” and the falling cadence of “gewählt.” The contour changes filter brightness, upper-layer density, Gaussian pressure and bounded score transposition while speech remains foreground. Browser pitch is a requested fallback setting, not measured fundamental frequency; the score mapping is artistic. With word receipts, the cue holds its last observed position rather than finishing on a separate timer. Pause/resume freezes that position and the shared Gaussian life/pulse clock, attenuates pulse motion and suspends the voice completion watchdog. Hidden-page media playback pauses and resumes with visibility. Engines without usable boundaries, voice-off and failed voice use a rate-scaled estimate, capped before completion; only native playback end, browser speech end or guarded fallback completion starts the 3.4-second stare and the ordered unwind, turn, retreat and recovery. `BuergeramtLevel.omen.speech` exposes receipt mode, recording path and progress for silent checks. Attempt/cue guards reject late events after cancellation.

**Shared `omen` life/score card (2026-10-09).** The existing visit/attempt and pre-ticket trigger own one isolated approach→line→glare→unwind→turn→retreat→ordinary-office event. With strength `p` and authored speech tension `t`, pressure is `p² × (0.72 + 0.28t)`, multiplied by the shared smooth reverse envelope during unwind. Simulation integrates pulse cycles at `0.65 + 2.1p + 0.35t` Hz and shapes each pulse as `((1 + cos(2πclock))/2)^8`; speech pause freezes phase/time. Audio follows the same pulse through gain, upper-layer density and filter resonance; splats use it for bounded forward coat expansion and tunnel contraction. The stationary stems contain distorted brass/bass and ring-modulated metallic bands, with no baked tempo, finite riser or payoff. Audio automation maps current controller values to Web Audio time with 18–60 ms smoothing. Voice remains foreground; `EFFEKTE` mute, hidden-page silence and the 24-second source cap remain authoritative. Glare lifts ducking and holds the threat; the shared 1.8-second reverse sequence settles deformation, flattens depth, then crossfades paint while pulse and score pressure drain. Keeping the Gaussian opaque until flat avoids doubled hands and file edges. The turn and silent slow retreat leave the expected catastrophe absent; room/view recovery follows. No accent advances the queue or mission. The figure's painted projection retains its ground pivot; room collision/scale and the 0.78 m/s approach remain unchanged. A missing preparation at the first opacity handoff preserves the frontal sprite for that visit. Source, silent-browser, emulated-device and listening evidence remain separate.


The name submission on the phone unlocks Web Audio in a user gesture and is required before the counter call. Frau Knick's first sentence arms the phone. Once it replies ready, the desktop commits a future ring target 2.2 seconds away. A filtered, gated 217 Hz cue starts 900 ms before that target, ducks the office audio bus, and briefly pauses browser speech where supported. The phone schedules its first ringtone burst on Web Audio before the target, reveals the call and requests vibration at the target, then repeats on a 2.8-second cadence. A keyless [TimeAPI.io](https://timeapi.io/) sample supplies an optional UTC fallback; the existing direct four-stamp phone link is the primary synchronization source. Call timing diagnostics and the limits of acoustic and haptic precision are documented in [`PHONE-CALL-TIMING-RESEARCH.md`](./PHONE-CALL-TIMING-RESEARCH.md).

## Production workflow

Codex coordinates affected domains under [`SKILLS.md`](./SKILLS.md) and the [production protocol](./chatdev/README.md). The external ChatDev graph is optional. Domain ownership and a shared beat contract precede parallel work; integration, independent review and Chromium desktop/mobile evidence establish acceptance.

The offline character builder is `tools/amt-character-motion.py`; `tools/build-amt-sprites.py --clerk-performance` bakes the desk performance. Source sheets and registered poses stay under `assets/sprite-sources/buergeramt/`; only desktop/mobile WebP atlases are loaded from `assets/buergeramt/characters/` on office entry. Review the exact encoded desktop and mobile cells, connected silhouettes, alpha edges, props, and scale together before accepting a new art pass. `output/amt-character-motion/interaction-build-report.json` and the clerk performance report record source/atlas hashes and frame hashes; they are local review artifacts, not runtime inputs.

Close characters use additional detail WebPs baked from the original paintings: four action poses and four directional walk sheets (16 frames for Aktenkurier/Archivbotin, eight for the other six walkers), a single pose for each waiting patron, and a compact performance sheet for Frau Knick with eight lip frames. The renderer requests only the nearby moving character's current walk direction and releases its detail textures after the character leaves the near field; compact atlases remain the distance and load-failure fallback. The two dense walkers also have half-resolution mobile close-up sheets; their normalized phase retains the existing gait cadence. See `SPRITE-GENERATION-PROTOCOL.md` for the reviewed field/matte repairs and exact export checks. Every figure has a staggered, slow saturation and lightness breath in linear color; the active speaker's dialogue tint still eases by emotional tone. The office shares the one-pixel-per-CSS-pixel and 1.6 MP drawing-buffer budget.

The reusable event-to-motion authoring procedure lives in `.agents/skills/animate-2d-characters/references/narrative-action-rigging.md`. Its ordered action verbs and source poses join the shared audio beat card before new sprites or cues are made. For the `omen` beat: Story owns the exact line; Storyboard owns isolated approach→build→arrival/line→stare→unwind→planted turn→slow retreat→normal walk; Character owns identity/prop hand; ColorMood owns restrained valence/return; Animation owns registered views and encoded QA; Gameplay owns path, state priority, committed event, and queue pause; Soundscape owns the bounded buildup and release; Mix owns the existing bus and speech clarity; Phone is unchanged; Voice uses browser speech plus the visible text fallback; Review and QA accept the same candidate revision. Static graph validation checks only the optional runner configuration; playable, visual, and listening evidence comes from the integrated game.

## Painted Gaussian action arcs

`buergeramt-animation-clock.js` owns Frau Knick's main poses (`ready`, `raised`,
`contact`, `refusal`) and the authored routes between them. The preview cycle
lasts 9.1 seconds: raise 3.1, stamp 2.25, refusal 2.2, return 1.55. Repeated
intent does not restart a route. A changed target waits for a safe main pose;
speech is a localized overlay. The eight moving regulars use a four-second
work→gesture→work action for dialogue. On dismissal, a regular completes the
shortest remaining route to work before its existing look/work pause and walk.
Walking remains displacement-driven. Hidden play freezes simulation time.

Main poses can hold for an interaction; transition keys have no scheduled
pauses or repeated ease to zero. Registered painted bridge keys supply missing
limb/grip/occlusion changes. `tools/build-amt-gaussian-animation.py` pairs paint
within owned regions into one Gaussian cloud. Paint blends in premultiplied
linear light; tracked prop polygons and stable object pivots can follow curved paths
without flattening a rotating sheet. Alpha-zero border births/deaths stay near
their own painted region, preventing detached fade trails while leaving visible
anchor paint exact. Correspondence and texture smoothing
cannot invent an occluded hand or replace a missing action painting.

The current full-frame morph uses the paired records as the movement authority
for the entire painting. `buergeramt-painted-anchor.js` draws one instanced
Gaussian texture patch per paired slot, sampling both original native WebPs
inside each moving support. Unlike a point-colour Gaussian, its image patch
retains source detail. Each patch follows the same position and owned prop
rotation as the Spark cloud; source/target UV offsets rotate with the part.
The two paints blend in premultiplied linear light across the entire interval.
The patch material stays at opacity one. There is no sharp-paint/cloud/sharp
swap, midpoint image switch, bounded MLS plane, or extra animation clock.

The material's explicit program cache key binds canvas aspect, record rows,
sampling stride and owned trajectory code. Three's default key saw only the
shared `onBeforeCompile` closure text and could reuse one actor's embedded
constants for another. In a mixed clerk/regular draw this incorrectly widened
the old painted plane and cropped the new texture patches; multi-actor checks
must compare the true native image and isolated actor at the same height, not
preserve that old width error. The shader cache regression is tested directly.

Patch sigma is one selected sampling stride; support is 2.7 strides. The shader
partitions log transmittance with kernel mass 6.20, adjusted for the small phase
expansion, so overlapping supports do not turn a half-transparent painted edge
opaque. This approximates native alpha on a regular grid; it is not an exact
general overlap resolve. Endpoint occupancy gates prevent alpha-zero births
and deaths from sampling visible paint at unrelated predicted coordinates.
Main and bridge keys recover the original image coordinates and detail; inspect
coverage and antialiased edges on both backgrounds before accepting new art.

The older clerk cloud replaced its head with one source head silhouette. That
left up to 9.192% of sampled native pixels outside patch support when used as a
full texture renderer. The existing builder now retains her complete original
image grid, with named anatomical ownership and the same curved paper paths.
The 55 runtime anchor WebPs are unchanged. Clerk has 7,680 desktop and 3,072
mobile slots; its new compressed records are 1,333,481 and 523,530 bytes, with
2,949,120 and 1,179,648 decoded bytes. The other eight packs are unchanged.
The legacy `paint_warp_gain` table is retained for older consumers; it does not
attenuate the current paired texture transport.

Knick's paper is absent in the raised pose. Holding its invisible birth
coordinates at the target location made a nearly opaque sheet appear beyond
her reaching fingers. The builder now translates a wholly absent paper part's
alpha-zero endpoint by the corresponding `hand_left` displacement. The same
rule handles its disappearance. It preserves the paper's extent and all visible
XY/RGBA; 245/186 desktop and 94/72 mobile invisible birth/death endpoints changed
in segments 3/11. Named attachment is an explicit ownership instruction, not
an inferred skeleton or a replacement for handoff keys. Unbound parts and
ordinary border projection keep their existing behavior.

Liquid motion comes from the native-image Gaussian patches transporting the
whole painting along paired paths. A bounded spatial phase delay
`0.085 × sin(9 × midpoint.y + 6 × midpoint.x) × sin²(πu)` lets different regions
flow into their anchors at slightly different rates. Its derivative stays
between 0.733 and 1.267, with exact endpoints and unit slope at keys. An owned
prop shares one delay from its pivot midpoint, preserving its corners. Native
paint blending follows that phase in premultiplied linear colour.

The user's correction on 2026-10-10 removes positional waves, body breathing
stretch, changing Gaussian support size and the duplicate Spark halo. Native
texture Gaussians alone carry the complete transition at opacity one, with a
fixed support and optical mass. The fallback Spark cloud remains available for
cloud-only manifests or unavailable native paint, but is invisible whenever the
native painting is displayed. There is no trail or ghost overlay, random jitter,
extra clock or global opacity pulse. Colour breath and the existing local speech
cue remain; the authored action and displacement-driven gait are unchanged.
Keep two or three approved inbetweens between ordinary main poses and Knick's
denser stamp/fold keys. Transition keys have no scheduled holds. Correspondence
cannot invent an occluded hand; review crossing parts, turning props and loop
closure in natural playback.

The patch mesh shares the three packed-record textures already owned by its
actor. It adds one instanced slot attribute (four bytes per slot), no new image
asset, framebuffer, dependency, worker, or render loop. The first adjacent
image pair decodes sequentially inside the existing actor preparation job; only
the third neighboring key uses the shared prefetch queue. Explicit arc direction
handles reverse actions and loop wrap. At most three bitmaps/textures and one
pending image job reside per actor. A delayed neighbor keeps the available
painting intact as a readiness fallback. Runtime manifest cache tags and the
record content hash bind newly rebuilt data without a stale length mismatch.

The 2026-10-10 liquid-only correction passes 182 shipping regression checks
and fresh production desktop, Android-emulated and reduced-motion profiles.
Those traces verify constant authored height, grounded registration, full
four-second action/return continuity, displacement-driven gait, replay/close
and the two/one actor limits. Independent P5 and C4/X1 bind the same frozen
31-file candidate. C4 recorded all nine actual autoplay wraps (1,436 displayed
frames), plus Knick/Aktenkurier desktop and mobile-emulated ±45° key/midpoint
views: crisp keys, no separate positional wave or duplicate cloud trail,
and retained paper contact. The portable method passes twenty Node tests and
an eighteen-sample native Spark 2.3.1/Three r186 smoke, including cloud-hidden
and paint-opacity-one assertions. Evidence is under `liquid-only-dynamic/`,
`liquid-only-camera-review/`, `liquid-only-physics-review/` and
`portable-native-liquid-only-result.json` in `output/amt-gaussian-arcs/`.
Physical Android and fresh forced overlapping depth pixels were not tested;
the compositor/data are unchanged and earlier depth checks are carried.
These are local browser and source checks, not a new performance benchmark.

The previous wave/halo candidate’s liquid full-morph natural autoplay covered all nine loop seams: 913 displayed
frames and 2,354 sampled states across the unchanged eight actors and repaired
Knick loop. Fresh Knick coverage includes 193 frames through the actual 9.1 s
wrap and 136 dense desktop/mobile-angle captures around paper birth and
disappearance. Native texture Gaussian mode, opacity one and actor visibility
remain continuous, with no page/HTTP/compile errors or observed whole-image
flash. One benign Three signed/unsigned warning remains. Opacity alone does
not prove perceptual continuity: independent C4/X1 reviewed the motion and
grip, and P5 compared exact binary changes and authoritative timing.
Evidence is retained under `output/amt-gaussian-arcs/dissociated-camera-review/`
and `dissociated-paper-camera-review/`. The final upstream voice integration
changes only speech recording/overlay callbacks, entry cache tags and a subtitle
test; renderer, clock, data, builder and geometry bytes are unchanged. Final
review bindings are under `liquid-final-camera-review/` and
`liquid-final-physics-review/`. Production desk/wall and mixed paint/cloud depth
use the unchanged compositor with supplied office frames and carried earlier
independent depth checks; exact final-candidate forced overlapping pixels and
physical Android were not freshly tested. The former continuity
repair's continuous bounded paint/local-fringe renderer removed the opacity
pulse but was rejected because its full-body movement looked like a crossfade.
The current renderer transports original image detail on the actual splat paths.

Three cold contexts per profile compare the liquid renderer to `7a161e5` on
Chrome 154 / Intel Iris Xe D3D11, local uncompressed HTTP, seed 12345, DPR2;
no physical Android or GPU timing. Median active-dialogue frame p95 is
21.0→21.7 ms desktop 1280×800 and 21.0→21.8 ms at 390×844 emulation. All nine
inputs were accepted in every run, with zero page errors; median input p95 is
14.3→19.7 ms desktop and 17.1→22.0 ms emulation, whose final runs span
12.9–63.9 ms. Median measured cold transfer is roughly 30.08 MB / 17.02 MB
before and after; settled-byte totals vary with asynchronous asset completion.
Median dialogue transfer is 6.10 MB / 3.73 MB in both versions. Actor limits
2/1, three resident native images per actor and the 1.6 MP buffer cap hold.
This measures the small renderer cost, not a speedup or field playability.
Evidence: `liquid-benchmark-before/`, `liquid-benchmark-after/` and
`liquid-benchmark-summary.json` under `output/amt-gaussian-arcs/`. The subsequent
`6b06989` voice integration leaves these render inputs unchanged; its fresh
production smoke is recorded separately in `liquid-final-dynamic/`.

For the earlier native-anchor release, three cold-context runs per viewport on Chrome 154 /
Intel Iris Xe D3D11 measured median active-dialogue frame p95 of 20.9 ms both
before and after on desktop 1280×800, and 21.0→20.9 ms at 390×844 browser
emulation. All nine test inputs were accepted per run; median input p95 was
15.0→20.7 ms desktop and 19.1→42.9 ms emulation, with individual runs spanning
11.9–59.9 ms and 12.9–57.7 ms after the repair. This is local lab evidence,
not a field performance result. Median cold office transfer was 28.05→28.82 MB
desktop and 15.60→16.13 MB emulation; the sampled conversation's animation
transfer rose from 1.24→4.56 MB and 0.26→2.56 MB respectively to retain native
paint. The existing two/one actor and 1.6 MP drawing-buffer limits held, with
zero page errors. Physical Android was not tested. Separate Physics and Camera
reviews checked the frozen repair after upstream omen staging was integrated:
continuous gesture phases, floor registration, return through the existing
look/work beats to displacement-driven walking, replay/close, and native mixed
paint/cloud ordering. All nine preview loops were sampled at their original
keys and handoffs. Reciprocal overlapping paint/cloud and simultaneous partial
fades were also checked in an isolated two-character production-renderer
fixture; those forced samples are not natural mission playthroughs.
Those earlier paused/forced samples did not detect the autoplay opacity pulse;
the continuity repair adds consecutive natural-motion review for that defect.

`buergeramt-gaussian-scene.js` admits nearby actions through the existing
two-job asset queue, with at most two desktop actors or one mobile actor. It
prepares inside six world units, displays inside five, and retires outside
seven. `buergeramt-gaussian-animation.js` takes its floor, height, orientation
and tint from the existing sprite. Action clouds and the omen share one Spark
owner and the ordinary office render pass. The source sprite stays visible
until the native painting is ready or the new cloud completes its first visible sort. Walk/look/flinch,
reduced motion, unavailable assets and preparation failures retain sprites.
Exit/replay detach actors immediately and settle pending sorts before freeing
their resources. There is no extra scene animation loop.

Registered sources, landmarks, polygons and provenance live under
`assets/sprite-sources/buergeramt/gaussian-arcs/`; runtime manifests and selected
desktop/mobile records and lossless runtime anchor frames live under `assets/buergeramt/animation/`. The three
stationary waiting patrons now have their own registered action packs, while
the two decorative clerk copies share Knick's pack through separate animation
slot IDs. All fourteen rendered office figures are eligible for the same
bounded Gaussian action renderer. The opt-in `spark-preview.html?scene=knick&workflow=arcs` preview
uses the same actor implementation; other cast IDs select their action packs.
Native rendered anatomy/props/loop review, integrated depth/floor review and
browser costs remain acceptance gates. Binary checks do not certify the art;
Android emulation does not establish physical-device performance.

The 2026-10-10 cast extension adds two main paintings and two stable transition
paintings for each of Konrad, Mechthild and Wolfram. Their outward gesture takes
six seconds and reverses over six seconds with no intermediate holds. The
original native work painting remains the first key. Generated bridges use one
uniform scale for the whole sequence and the original floor; raised hands do
not shrink the body. Konrad opens his free hand, Mechthild brings her free hand
toward the papers, and Wolfram raises his notice while keeping the cane planted.
The existing builder consumes registered landmarks and owned paper/cane masks.
`tools/prepare-amt-patron-arcs.py` performs crop/alpha cleanup/registration only;
the stored imagegen bridge sheets own the new poses.

Independent C4 review rejected an initial Mechthild reaching interval and a
Wolfram receipt interval because the paired paint showed two hand/prop positions.
The repair authors a real halfway reach, registers horizontal shoe centroids,
and measures each key's face/shoulder/elbow/grip, receipt corners and cane
controls on its native painting. Estimates copied across poses had missed the
receipt and left the reaching elbow stationary. The final encoded packs must
pass midpoint and normal-speed review; smooth frame timing alone cannot certify
anatomical correspondence. The final pensioner mask also includes the pale
antialiased receipt edge that otherwise appeared as a detached head-area fleck.
Final independent C4 and P5 verdicts are PASS, bound to all 58 candidate path
hashes in `full-cast-candidate.json` (manifest SHA-256
`2525081666145bbcd8bae7662913346f8715099e94cc7d1a521b4faf38a05702`).
The final fresh C4 pensioner loop observed 409 frames and 616 timed states
without visibility/opacity loss or browser errors; P5 reran 15 data checks for
the narrow mask repair and carried only unchanged clock/floor/manager evidence.

Five additional stationary clocks advance from office simulation time, staggered
by actor. Hidden time freezes them; dialogue freezes background figures while
the selected patron continues. Replay resets phases and generation. Admission
and visible slot retirement wait for the stationary figure's original work or
ready key, avoiding a raised-pose-to-rest snap. An actor whose complete billboard
is outside the camera may release a frozen slot for a new visible speaker.
Preparation skips off-camera or unavailable actions. The caps stay two desktop
and one mobile; extending the cast does not mean fourteen simultaneous clouds.

`buergeramt-voice-profiles.js` gives the twelve named speakers distinct infernal,
Kafkaesque performance briefs and browser rate/pitch hints. Explicit story
delivery and approved exact-speaker recordings retain priority. Twelve actual
alternate profiles were saved in Secret Tunnel's local Voice Cloner from the
documented CC0 emotional references, with private transformed WAVs. These are
unlistened alternatives, not accepted cloned game recordings. The two decorative
clerks reuse Brunhilde's identity. IDs, provenance and the separate listening
gate are owned by `VOICE-SYNTH-PROTOCOL.md`.

Author checks passed 235 affected Node regressions and normal-speed full cycles
for all five added figures in desktop and Android browser emulation, with
ground pivots, full-opacity native paint, residency limits, reduced-motion
fallback and replay cleanup. Evidence is retained under
`output/amt-gaussian-arcs/full-cast*`. Forced office camera samples are separate
from natural dialogue selection, physical Android and perceived voice quality.

The 2026-10-08 release review covers all nine exact encoded native loops,
390px mobile emulation at ±45°, planted roots, shortest return before walking,
replay/close, reduced-motion fallback, opaque counter/wall depth and a supported
two-cloud camera sweep. Knick's counter hides the stamp contact itself; the
standalone preview shows the whole action. Office blockers are opaque; city
fading, car/door/landmark geometry and scale are unchanged. Physical Android
and perceived audio quality were not tested.

Three cold-context runs per viewport on Chrome 154 / Intel Iris Xe D3D11 gave
median active-dialogue frame p95 of 21.0 ms before/after on desktop 1280×800,
and 21.8→21.0 ms on 390×844 Android browser emulation. Desktop retained two
visible clouds; mobile retained one. Nine keyboard inputs were accepted per
run; median entry input p95 was 15.5→19.3 ms desktop and 22.3→13.5 ms emulation.
These local scheduling measurements are not GPU timings or a causal speedup.
Entry transfer varied 22.35–27.44→26.73–28.05 MB desktop and
15.46→15.32–15.60 MB emulation; the approach/dialogue route downloaded 1.24 MB
and 0.26 MB of Gaussian action data respectively, including retired preparations.
Baseline overrides the same seven runtime entry files at `734e203`; existing
painted atlases remain unchanged. The retained local evidence is under
`output/amt-gaussian-arcs/` (`benchmark-active-*`, `camera-final*`, `physics-final`).
The release suite passed 177 checks; the portable skill passed ten functional
tests, four adversarial builder cases and a fresh native Spark smoke. The preview
also passed 320px, 200% typography and German-label fitting with actual Pretext.

## Flow and companion failure coverage

For admission/call changes, use `gameplay-validation` and meaningful state properties from `property-based-testing`. Check natural admission through an outcome, failure/retry, hidden/closed phone, stale session, malformed/out-of-role/replayed events, delayed receipts, reconnect and cancellation cleanup. Host and phone remain separate browser contexts, clocks and audio outputs. Existing protocol/SDK ownership governs fixes; debug admission or simulated messages do not prove a real two-device flow. Record actual drivers and missing device evidence.

## Episode boundary and clock ownership

The city owns mission progress, A38, its main update loop and entry/exit callbacks. The episode owns its queue, movement, dialogue and attempt/cue cancellation; the existing renderer projects that state. Office-detail collision footprints become active only after their visible assembly attaches. Phone messages remain bounded and ordered under the existing host-authoritative protocol. Shared CSS and renderer changes have one assigned writer.

Simulation `dt` owns movement and queue progression. Monotonic peer timestamps own call scheduling and receipt deadlines; Web Audio time owns scheduled audio. Web Speech start/boundary/end events provide observed speech timing, with existing bounded fallbacks. Document which of these a changed beat uses, what pauses, what continues, and what is cancelled on close/replay. Do not replace one clock with another or assume browser speech is sample-accurate.

Queue-call `look` and `flinch` steps sample their eight compact cells once over each authored step duration, starting when the planted action actually begins. Their phase comes from the step's remaining time, independently of the ambient work clock and distance-driven walking. Step changes preserve update overshoot; dialogue freezes background action phases, and replay or a replacement performance clears the old phase. A blocked walker starts its pending planted reaction without discarding the queued steps or moving its root. The omen's owned approach still advances while the room is paused. Close-up actions retain the existing single painted detail pose with a subtle renderer breath; this timing change does not add articulated poses or change the art. `tests/buergeramt-animation-timing.test.mjs` exercises different actors at 60/30 fps and a delayed update, blocked queued reactions, planted roots, dialogue pause and replay. The focused browser probe is `tools/playtest-buergeramt-animation.mjs`; it checks sampled controller-to-atlas mapping, placement and pause/replay in desktop and mobile emulation. Those samples do not establish normal-speed artistic smoothness or physical-device performance.

An already active city train announcement finishes before office speech. The optional `cityAudioBusy()` entry callback covers that recording and the existing broker gap. Office lines wait before starting speech watchdogs; ambient chatter is skipped while the city owns foreground audio. Attempt/cue changes invalidate deferred lines. The isolated episode defaults to ready when the callback is absent. Train recordings intentionally have no invented transcript; character speech retains its exact visible-text contract.

Office patrols and the authored Aktenkurier approach/retreat share body-clear routing and swept collision against the visible hall, furniture and attached detail props. People use circular separation in both planning and movement; gait advances only with accepted displacement. Obstructed actors hold a planted action and retry a legal detour. The entrance-side patrols stay clear of the facade wings and rope supports.

All fourteen office figures face the actual viewer with a planted floor pivot. Ordinary walking views follow travel relative to that viewer; the authored omen front/turn/retreat views keep their story ownership. The existing staggered colour breath applies at every detail level, during dialogue and to painted/Gaussian replacements. Body height remains fixed; only authored poses and accepted movement change its shape. Hidden simulation retains its existing pause policy.
