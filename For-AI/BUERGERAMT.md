# Bürgeramt interaction cast and cross-domain handoff

## Turning and view stability (2026-10-13)

While the office is active, its existing frame owner follows each display RAF;
the city retains 60 Hz and the title 4 Hz. Actual elapsed time, collision
substeps, the shared slowdown clock and hidden-tab suspension remain authoritative.
Arrow-key turning eases into the existing 1.8 rad/s speed over a 45 ms time
constant and releases over 25 ms; reversal brakes immediately. This is elapsed-time
integration, not a frame-count animation. Drag look follows one captured pointer
using CSS-pixel position deltas. Movement fingers have separate IDs; cancelled
gestures, focus loss, scene changes and replay release ownership and momentum.
Existing touch controls also appear on wide coarse-pointer screens.
Their labels use the existing pinned Pretext fitter, including the E/REDEN line
break; the nearby hint clears the measured control height at enlarged text sizes.

**Smartphone first-person navigation.** The left thumb stick walks and strafes
relative to the current view, with a 14% center deadzone and gradual speed up to
the existing 3.6 m/s walking limit. Normalize only inputs above unit magnitude;
partial stick input must remain slower and diagonals must not outrun forward
walking. Accepted collision substeps, gait, floor wakes and the shared slowdown
remain authoritative. The scene outside the joystick and toolbar accepts a
separate captured finger for horizontal and vertical look; walking retains its pitch, bounded to
±.9 radians. Touch sensitivity follows the viewport's shorter dimension, with
the same time-scale multiplier as desktop drag. Mouse drag also supports pitch;
Arrow Up/Down control pitch, with Page Up/Down retained as aliases. Left/right
arrows turn; WASD and the touch stick walk. Mouse and trackpad movement over the
scene also changes yaw/pitch without a held button, using the same sensitivity
and slowdown as drag look. Controls, the open mixer, scripted sequences and
paused/hidden scenes do not take mouse look. Focus loss and scene transitions
reset the mouse baseline. The centered reticle remains an invisible HUD object;
nearby facing interactions retain their existing selection.
Scripted speakers, the portrait and mirror retain their own
camera framing. Desktop E retains its nearby facing target. A single mouse click also selects a visible interactive target, while mouse drags retain camera control. Mobile double
taps select the closest visible person, counter, portrait or mirror within 64–112 CSS pixels
of the tap, ranked by screen distance and then visible depth. Selection uses
actual rendered bounds, per-hit atlas alpha and scene rays. Admitted Gaussian
people keep their owned backing paint as the interaction proxy; the private
mirror body layer cannot take scene taps. Selection uses one 1×1 alpha-sampling
canvas on demand, with no full-atlas duplicate or recurring measurement.
Off-screen, rear-facing and fully occluded objects stay ineligible. A visible optional encounter may be tapped
across the room. Counter ticket/name/call prerequisites still own admission.
The QR sign remains a physical phone scan and is not a double-tap shortcut.
Two taps must end within 360 ms and 48 CSS pixels; each lasts at most 280 ms
with no more than 12 CSS pixels of movement. Swipes and long holds do not
interact, and each completed pair triggers at most one action.

Each finger releases independently on cancellation/capture loss. Blur, hidden
pages, resize/orientation, scene transitions and replay clear both gestures and
held input; reopening a mixer gives its widgets input ownership. The left
stick stays above subtitles and respects safe-area insets. Mobile omits E/REDEN, the look hint and both QR HUD instruction boxes; queue/counter
information and spoken subtitles remain. The existing Pretext fitter measures
the remaining control text and rendered clearance, using logical
viewport dimensions at zoom; short viewports hide optional hints and shrink the
stick. No gesture timer, extra animation loop, dependency or new renderer.

Walking view selection retains its current painting within 0.10 radians past a
quadrant boundary, preserving the existing gait phase and registered foot pivot.
It adds no crossfade, pose or art. One spare walk sheet shared by the entire office
allows repeated A/B view changes to reuse decoded paint; distant retirement,
close, replay and pagehide release it. Existing smaller 16-frame walk sheets serve
compact screens regardless of DPR. Subtitle DOM changes are coalesced by value.
The deterministic gates are `tests/buergeramt-turning.test.mjs` and
`tests/runtime-smoothness.test.mjs`; silent real-input/render diagnostics live in
`tools/playtest-buergeramt-turning.mjs`. Route fixtures reset turn momentum when
setting a grid heading; they do not establish release-tail or swipe behavior.
Physical-phone smoothness and GPU/display timing require separate measurements.

The secret Bürgeramt is an episode of the canonical root game. QR admission, the linked phone, the numbered queue, Frau Knick, the police interruption, A38, and the existing exit outcomes remain its required chain. Eight optional walking encounters add movement and atmosphere while the player waits; they never award a ticket or change a counter answer. Desktop E chooses people and exhibits within 4 m and counters within 4.8 m, across a generous approximately 168-degree forward cone around the office camera heading. Gaze alignment and distance select the target across people and nearby exhibits; the portrait must also be faced. Visitors, including the courier and returning walkers, remain available while waiting or walking to the called counter. The interaction hint uses the same target; turning away makes that person ineligible.

The clear wall beside the waiting-room entrance carries a gilded state portrait of the current
Bundespräsident, Frank-Walter Steinmeier (verified 2026-10-12). Approaching it
offers `E · BUNDESPRÄSIDENT BETRACHTEN`; E or the existing touch interaction
starts one continuous monologue spoken by **ICH**, using the selected
`spieler-hans-peter-mustermann` Nachschub voice. The monologue briefly explains
his head-of-state role: representing Germany, signing laws and appointing the
elected chancellor; day-to-day policy belongs to the government. Its factual
outline follows the [Bundestag's role description](https://www.bundestag.de/parlament/grundgesetz/gg-serie-07-bundespraesident-634572).
The ceremonial-importance joke
ends with “Also ehrlich: Diesen Job hätte ich wirklich gern.” The portrait
never speaks and no visible actor mouth is assigned. This optional sequence
keeps the room visible, plays one complete newly synthesized MP3 through the existing speech lifecycle,
pauses office queue progression like other encounters, and returns automatically
to the current waiting/QR/counter state. Missing or disabled player audio keeps
the exact readable captions. Phone ticket receipts retain their authority
throughout; the portrait awards neither a ticket nor A38.

Initiating this interaction before melting starts ends the remaining shared
90-second grace period immediately, before speech starts or completes. Advance
the shared residence and integrated scene clocks to the liquid onset together,
so the first following frame begins portrait/floor melting, flow and their
coupled slowdown. Already-running melt waves and active or completed counter
recovery retain their progress. Approach alone does not end the grace period;
close/replay resets it. The portrait has no independent melting clock.

The opposite, left entrance-wall corner has a tall silver-framed mirror at
`(-5.65, 5.36)`. Its live planar reflection uses the actual room, including
furniture, signs, floor, people and current effects, through the existing office
render owner. Its private 3D player double has textured, indented potato skin,
natural tuber eyes and root limbs. Shoulders and hips follow accepted ground
travel; blocked or stationary feet stay planted. There is no distance cutoff.
The proxy stays at the player's actual ground position in the reflected-camera
pass; its virtual image has equal distance behind the glass. The finite pane,
view frustum and real room depth determine visibility. Sideways movement can
crop or remove the self-image even while the room remains visible in the mirror;
partial views never move the potato into the visible sliver. It has no distance
cutoff and shares the reflection actor pass with ordinary depth and order, so
opaque furniture can block it. The private proxy never renders in the main room
and is not a real actor or collider. The glass/frame stays solid
and the oblique reflection camera clips the exterior and back of the installation.
Native Gaussian paint faces the reflected camera temporarily. Packed clouds and
the camera-local tunnel remain in the main view; the mirror shows those same
actors through their existing painted fallback and keeps the current effect
overlay. This avoids an edge-on courier without a second GPU generation/sort.
Facing, visibility, opacity and packed-batch visibility restore after capture,
including a failed draw. Ordinary main-camera representation stays unchanged.
Temporary mirror poses preserve the exact Euler rotation, including its order,
and both main and reflected billboards set the full pure-yaw rotation. Do not
restore these sprites through `quaternion.copy`: Three's equivalent Euler form
can introduce x/z half-turns beyond 90 degrees, which a later y-only update
turns into alternating sideways facings. Native paint inherits its source
quaternion, so its temporary reflected pose must also clear x/z and restore
the original Euler form. Repeated large-yaw frames and draw failure are covered
with pinned Three rotations; silent rendered sequences exercise the shared path.

Facing it nearby offers `E · SPIEGEL BETRACHTEN` through keyboard or the existing
touch interaction. **ICH** remarks “Hä, sehe ich wirklich so aus? Eine deutsche
Kartoffel? Wow, die ganze Integration auf dem Weg hierher hat sich echt gelohnt!”
as one continuous selected-player recording. It uses Hans-Peter Mustermann's
allocated `spieler-hans-peter-mustermann` binding, with the matching English
subtitle and exact captions on missing/disabled/failed audio. It never substitutes
browser speech. The optional encounter resumes the current QR/wait/counter stage
automatically, retains phone ticket authority, and awards nothing. The mirror
adds no independent animation clock; `ASSET-POLICY.md` owns its bounded target,
texture, visibility/cadence and teardown costs.

Character voices follow [`VOICE-SYNTH-PROTOCOL.md`](./VOICE-SYNTH-PROTOCOL.md#fixed-voices-and-the-agent-workflow-2026-10-11). The four Schalter positions all represent **Brunhilde Knick**, with the single character/voice ID `amt-brunhilde-knick` and selected profile `b080c7d95ecd418fb428282461d7fbe7`. They are one person, as explicitly clarified by the user on 2026-10-12. The names Frau Frist, Frau Durchschlag and Frau Zuständig are retired. Counter refusals, registration, warnings, the police argument and all three staff background remarks use Knick's established recordings and tone. Render slots `clerk-desk-1` through `clerk-desk-4` remain separate so only the speaking counter animates. Eight walkers and three waiting patrons retain their own identities; they are not additional counter clerks. Missing, failed or dynamic Knick speech retains exact captions without a machine voice. The three superseded clerk profiles and ambient takes remain privately preserved, outside active game lookup. Ambient speech waits for foreground speech.

Recorded office MP3 requests include the current encoded SHA-256 in their URL,
so a replacement at the same asset path gets a new browser cache entry. Mouth
cues retain their canonical path and exact hash ownership.

Background speech uses the `buergeramt-story.js` ambient pool: 12 new short
Kafkaesque remarks, the three existing counter remarks, and both original
waiting-room complaints recorded separately for Konrad, Mechthild and Wolfram.
The room chooses among its existing character voices in a bounded random bag,
avoiding consecutive identical text or speakers. Speaker captions and the mouth
track belong to the selected person. These remarks use fixed exact-text recordings
or silent readable captions; they never use browser speech, even without the
catalogue. The existing 8.5-second opportunity and 22% voice gain remain, with
foreground office/city speech taking priority and counter entry/exit cancelling
the background cue. Assets load only when selected, one native media element
at a time; cancellation removes its source. No full-library preload or new
scheduler is introduced. `tests/buergeramt-ambient.test.mjs` owns this contract.

The initial ambient build had 21 checked MP3s, 1,509,660 encoded bytes in total;
one selected file is at most 91,052 bytes and 5.64 seconds. All native completion,
selected-profile, independent encoded-word and level gates pass. Delivery is
−18.24 to −17.83 LUFS, with maximum −1.98 dBTP. The revised number-prefix snippet
replaces two privately held word-mismatch takes; neither enters playback.
Silent Chromium checked every recording on desktop and Android portrait and
landscape emulation, including absent/failed audio, catalogue failure, voice-off,
foreground cancellation and simulated visibility. Active captions passed actual
Pretext/DOM and screenshot checks at 320 px, 200% zoom and increased text spacing.
All 546 Node checks and nine authoring-gate checks pass. Independent Physics and
Camera reviews passed the affected ownership/animation integration scope;
unchanged geometry, scale and vehicle rules were outside this change. Three cold
office runs per profile before/after passed the existing browser gates on Intel
Iris Xe Chromium; median sampled frame p95 stayed about 21 ms. Startup and input
results varied, so this is regression evidence, not a speedup claim. No ambient
MP3 preloads were observed. Direct `3d.html` passed silent startup smoke at all
three viewports. Physical Android, perceptual listening and natural mission
traversal were not exercised for this speech-only change. Private receipts and
the ignored `output/amt-ambient/` reports retain the exact frozen candidate.

The current ambient pool keeps all 21 entries and 17 distinct remarks. Its
three counter entries reuse `knick-ambient-clerk-1`, `-2` and `-4` unchanged;
18 newer visitor recordings remain in `office-ambient/`. Every counter has the
same name and selected voice, while visible mouth ownership stays local to its
desk. The original refusal also reuses Knick's approved fever recording.
No new synthesis or voice profile is needed for this restoration.

## Waiting-room floor

The room begins with .82 m black-and-white checkerboard tiles and painted grout.
The first **90 seconds of visible, unscaled residence inside the actual doorway**
are a grace period unless the player initiates the Steinmeier interaction early:
intact floor and portrait, full-speed movement and audio, no
liquid targets or walking ripples. Then, over **480 seconds (8 minutes)**, their
pigment gradually stretches into curling veins and merging oily
pools, with progressively finer nested black-and-white ribbons along the mixed
boundaries. Grout disappears and the surface develops shallow specular ridges and
distorted analytic reflections of the five existing fluorescent ceiling strips.
These are authored fixture reflections, not mirrors of people or the whole room.
No floor height, furniture, body clearance or collision changes; gait remains
tied to accepted displacement.

**Liquidation and deceleration must map one to one.** `buergeramt-goop.js` is the
single immutable authority: `p = clamp((age − 90) / 480, 0, 1)`,
`goop = p + .18 × sin(πp) × sin(6πp)`, and `speed = 1 − .35 × goop`.
Three slow waves (160 seconds each) temporarily ease the drag while the overall
speed trend descends. Their amplitude tapers at both ends; goop stays in [0, 1]
and speed in [.65, 1]. After the shared grace period, melting reaches about 9.5%
at 30 seconds and 17.4% at one minute into the ramp. Speed falls to 93.9% at one minute, recovers to 95.7% at two,
falls to 79.3% at 3:20, recovers to 85.7% at 4:40, falls to 69.3% at six and
recovers to 71.1% at seven before settling at **65% eight minutes into the ramp
(9½ minutes of total residence)**. Floor and
portrait melt recede on those same recoveries; deposited pigment keeps flowing
forward without reseeding. Do not restore the previous late sigmoid or give the
portrait a separate early-start clock.

The eddy potential starts at zero phase when liquid begins, using integrated
scene time minus the 90-second grace period. Footstep ages, portrait sampling
and paint contact keep absolute scene time; shifting those clocks would delay
walking wakes and desynchronize the wall paint. The grace candidate passes 455
release regressions, four accelerated GPU profiles, a lit movement sequence and
nine muted native-media rate samples. These are desktop/Android-emulated,
accelerated checks, not natural-duration, physical-device or listening evidence.
Reaching the assigned Schalter within the existing 1.9 m interaction range while
its row shows the player's called number automatically starts **90 seconds of
recovery**, without requiring E. A reserved ticket, wrong desk, premature approach
or expired call cannot start it. Recovery runs through the counter conversation,
phone interruptions and other active office states, and pauses when hidden.
Melt decreases linearly from its value at arrival to zero, so speed rises linearly
from its arrival value to 100%. A bounded bisection finds an age with the requested
melt on the shared wave. The wave has multiple matching ages, so this is a value
inverse rather than recovered residence history; visible consumers use the melt
amount and continuously advancing scene time. Recovery remains smooth through
every wave reversal, and integrated scene time continues forward.
Lamp strengths interpolate from their arrival values to full brightness on the
same recovery progress, so even a fully dark twenty-minute room restores smoothly.
Floor pigment blends back into the original tiles without reallocating each
reverse frame; deposited paint, portrait drips and lamp wear restore together.
At 90 seconds, the initial room and speed stay restored for the rest of that visit.
Closing or replaying resets recovery; recovery awards no ticket, stamp or A38.

Keep the final floor and time scale capped there before recovery. Never add a separate melting
delay, independent easing, second time-scale ramp, or feed slowed time back into
the 480-second age; that would break the user's explicit coupling requirement.

`buergeramt.js` owns unscaled `floorState.time`, integrated `visualTime`, and
attempt generation. Count age only while the player's position is inside the
door; continue through conversations and fever/omen beats, pause age in the
vestibule and when hidden/closed, and reset both clocks on close/replay. Its exact
trigonometric integral of speed (90 full-speed seconds, then 396 scene seconds
over the 480-second ramp; 486 scene seconds after 570 real residence seconds)
drives player/NPC movement, queue and deadlines, action/fever/
omen clocks, atlas/breath/mouth animation and liquid transport. Render and input
dispatch stay responsive. `buergeramt-floor.js` carries one
RGBA paint field forward with prescribed curl flow at several scales, mild
diffusion and an artistic contrast retention term. The surface reconstructs fine
alternating lamellae from the transported concentration contours, preserving
pure black/white endpoints and filtering unresolved ribbons with screen
derivatives. This is an authored oil-marbling effect, not a Navier–Stokes or physical
two-fluid solver. It never replaces the evolving pigment with unrelated noise.
Without renderable, linearly sampled floating targets, a bounded procedural
flow approximation retains the checkerboard, goop mapping and foot ripples.
Actual accepted displacement emits faint radial surface ripples, directional
pigment wakes and local diffusion near walking feet; stationary/blocked roots
and teleport/re-entry do not. Use the controller’s monotonic accepted-walk
distance plus position generation; root displacement alone includes collision
recovery and must never trigger a pulse. Reserve two ripple slots for the player, with eight
total on desktop and four on compact screens; nearby NPCs share the remainder.
The existing room isolation/fade owns opacity and depth-write restoration.
Reduced motion and GPU failure retain a static spatial melting approximation
with the same goop/speed value, without ripple animation or pigment targets.

The existing Steinmeier oil portrait uses this same wave and residence clock,
with paint progress `min(1, 2.20 × goop)`. This faster progression applies together to
the framed image, wall drips and floor deposition; the floor's own melt and
slowdown retain their shared value. `buergeramt-portrait-melt.js` softens the real
oil paint in place. Unequal local sag, vertical color smearing and patchwise loss
expose the backing throughout the image; upper paint remains near its original
position while lower regions liquefy. Never translate the whole recognizable
portrait down the wall as a falling poster. Thick, merging runs have curved
edges, unequal rounded fronts and wet highlights; below the frame they carry
mixed pigment sampled from the image, rather than a readable second portrait.
The whole image eventually drains, and the runs thin out as their paint supply
ends. One masked paint mesh spans image and wall without a panel seam. Its bend
starts below the gold frame, and its extra width allows the oil contours to curve.
Deformation and pigment motion use the integrated scene clock. A transparent,
depth-tested, statically curved surface continues the paint from the frame onto
the wall, ending at y=.0024 m and z=5.4696 (the inner wall face is z=5.47); its
front reaches the ground before it can feed the floor. The existing floor pass
samples the same viscous runs at their ground contact, so the painting's pigment
begins mixing sooner without depositing before the visible paint arrives. The pass
injects the same image colors at that contact, then transports and diffuses them
with the black/white oils and walking wakes. RGBA stores mixed RGB plus deposited
paint coverage. The gilded frame, nameplate, original photo, collision envelope
and optional ICH monologue retain their existing ownership. No picture speaks.
Missing portrait paint keeps the labeled fallback intact without fictional
colored spill; reduced motion uses a static spatial melt/spill approximation.
Close/replay restores the picture and clears the paint field; the shared source
texture remains in the existing office asset cache. Do not create a second
portrait clock, floor decal disconnected from deposition, or particle timer.

**Twenty-minute lamp exhaustion.** `buergeramt-lamps.js` uses the same unscaled
visible residence age for wear and the same integrated scene time for flicker.
Early flicker is faint and rare; wear increases its depth and occurrence as the
scene slows. The five existing ceiling strips fail permanently for the visit at
13, 15, 17, 18.5 and 20 minutes, with a 50-second final fade per strip. Their
individual film/reflection strengths feed the floor material; dead lamps cannot
leave lit reflections. After all five fail, residual scene illumination is 0.8%.
A shared two-triangle black illumination pass dims room surfaces, native paint,
Gaussian people and signs together after composition, without hiding geometry or
changing actor depth. Captions and controls remain readable. Reduced motion
removes flicker while retaining gradual wear and failure. Hidden time freezes;
close/replay restores all five. There are no lamp timers, new shadow/light sources,
or second slowdown ramp. Lamp wear continues to twenty minutes while the common
eight-minute goop/time value remains capped.

Recorded host and phone voices use this same playback rate with pitch preservation
disabled; their media clocks still own word/mouth cues. Office hum, score, FX,
ring cadence and newly started browser-speech fallbacks also take the shared
tempo. Web Speech can sample rate/pitch at onset but cannot reliably retime an
utterance already speaking. Caption-only duration uses the onset rate. Host
`office-tempo` updates are bounded to 4 Hz under existing link/session guards.
Authored first-ring and interruption spans are scaled before committing absolute
peer/UTC deadlines; receipt, network/startup and true-stall watchdog timestamps
remain monotonic wall time. Close/replay cancels the owning cues and leaves city
time/audio at ordinary speed. Beat ID: `amt-goop-time`; no new text or recordings.

The method combines backward texture transport from [GPU Gems chapter 38](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu)
with a procedural stream-function field informed by [Bridson et al.'s curl-noise method](https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf).
The resource contract belongs to `ASSET-POLICY.md`. Clock, cadence, replay and
failure checks live in `tests/buergeramt-floor.test.mjs`; the silent GPU evolution,
both-color retention, Android-emulated views and material restoration probe is
`tools/playtest-buergeramt-floor.mjs`. Accelerated shader captures do not prove
natural mission flow or physical-device performance.

The earlier eight-minute wave update has bounded CPU and accelerated rendered evidence
under ignored `output/wavy-goop/` in the task's isolated worktree. Four desktop,
Android-emulated portrait/landscape and procedural-fallback profiles pass 13
wave stages and 25 portrait frames, retaining one pigment field through reversals.
Shared-checkout native media follows all eight sampled wave rates with pitch
preservation disabled; this is silent state evidence, not listening. Fixtures
measure authored queue/expiry budgets in scene time and face their intended
counter instead of relying on near-full speed or a marginal interaction angle.
The omen life/pulse clock advances once per shared simulation step, including
unwind; a production regression covers 60/30 fps and a .1 s delayed frame.
Combined publication checks and current bindings belong to the final integrator's
task receipt. Natural eight/twenty-minute residence and physical Android remain
unexercised; the earlier measurements below belong to their earlier candidates.

The earlier fifteen-minute late-decay/flowing-paint/lamp candidate passed 420 workflow
and affected checks, then 12 focused checks after Camera corrected contact
alignment and the procedural contact clock. Independent Physics and Camera
reviews pass. Four desktop/Android-emulated/fallback profiles show the shared
goop, RGB deposition, accepted walking, reduced motion, restoration and five
lamp failures; repaired desktop contact and procedural fallback were captured
again, followed by four fresh profiles after the final static wall bend.
A 31-frame accelerated sequence samples the complete fifteen-minute
portrait progression. Isolated native media follows .5/.75/1 without pitch
preservation; this is silent playback-state evidence. Three cold capped-scene
runs per desktop/portrait profile compare the previous portrait/floor shaders
with the same current controller/loader and no lamp dim pass: median sampled
frame p95 stays about 7.1 ms before/after on Intel Iris Xe on both profiles.
This is a scoped regression check, not a speedup or GPU
timer. Receipts, hashes and the causal map belong under ignored
`output/flowing-paint-lamps/`. Natural fifteen/twenty-minute residence, physical
Android and perceptual listening are not exercised.

The earlier ten-minute, 50%-cap portrait/floor update passed 403 workflow
checks, plus focused tests and independent Physics/Camera review after fixing
an absent-image source flag. Desktop and Android portrait/landscape emulation
passed RGB transport, native .5/.75/1 rates, accepted walking, fade/reduced-motion
and replay checks. An independently aborted portrait image retains zero paint
and colored pixels through 900 seconds. Clear side views show continuous frame
to-ground threads; desktop colored floor coverage grows from 3.36% at 600 seconds
to 9.04% at 900 seconds. Three cold full-goop runs per desktop/mobile profile
before/after passed the existing browser gates, with median sampled frame p95
about 21 ms on Intel Iris Xe. These use controlled scenes and different authored
end tempos; they establish scoped regression evidence, not a speedup. Root and
`3d.html` passed all three startup viewports. That earlier task's evidence and causal
map are under ignored `output/ten-minute-paint/`. Physical Android, perceptual
listening, actual paired-phone delivery and natural ten-minute rendered residence
remain untested.

The earlier 3.5-minute, 40%-cap floor candidate passed 396 workflow-selected Node checks, separate
Physics and Camera reviews, and silent desktop/Android portrait/landscape GPU
checks. Six-minute accelerated captures retain both pigments; native host media
playheads follow .4/.7/1 rates. Collision recovery, including recovery plus a
walk in one frame, produces no false pulse. Three cold runs per desktop/mobile
profile passed the browser budgets before/after and at forced full goop; median
sampled frame p95 stayed about 21 ms on Intel Iris Xe Chromium. Startup and input
timings varied; this is scoped regression evidence, not a speedup claim. Root
and `3d.html` passed startup smoke at all three viewports. Task evidence and the
causal map remain under ignored `output/oil-floor/`. Actual paired-phone delivery,
physical Android, perceptual listening and natural full mission traversal were
not exercised. Minor bright-edge specular stippling is cosmetic; sampled stills
do not establish continuous flicker-free presentation.

## Admission, queue and outcomes

The office HUD allocates a top toolbar for sound, restart in direct mode, and
the subtitle control. The companion shows only the ticket code; the host
assignment notice and duplicate called-code HUD are removed. The physical
Anzeige alone maps codes to desks. Measure the toolbar's actual bottom
before placing the remaining walking cues. Pretext measures the
bounded labels; CSS owns their placement. Keep these controls and instructions
from covering one another at phone widths and zoom.
`tools/playtest-anmeldung.mjs` checks their rendered bounds and the
assigned-counter path; `tools/playtest-amt-inline.mjs` checks reply placement,
captions and manual return to a fresh QR invitation.

On the first city-to-office entry, the visible city dissolves into source-colored
Gaussian particles and spirals into the fitted Bürgeramt door over 3.4 seconds.
The existing city renderer captures color and depth once, projects sampled
surfaces toward that doorway, and opens the waiting-room stage only after
the collapse completes. City simulation and held input pause during the effect;
the office queue, phone and omen begin through their normal owners afterward.
Reduced motion uses a 0.24-second fade. A missing effect module or renderer
failure enters directly. Hidden time does not advance the effect; completion
and page exit dispose its capture and particle buffers. Returning through the
browser's page cache completes the preserved handoff directly. Direct office testing
has no city snapshot and starts at the same interior arrival point. `buergeramt-entry.js`
owns the GPU projection, with `world3d.js` owning its clock and handoff.

Entering the first Bürgeramt opens the existing first-person episode inside the waiting room at `(0, 4.8)`, with the QR route immediately active. A permanently closed double door fills the entrance at `z = 5.55`; its frame, leaves and handles remain solid. The hallway behind it remains scenery and cannot be entered or opened with E. Replay and the direct-office route use the same interior arrival. WASD and touch controls reach the QR sign and four service counters from there. Connecting through the physical QR sign only opens the phone name form; it allocates no number. Every browser opening the shared invitation can enter and submit a name immediately, including while its connection is being prepared. Each transport peer owns its scan, name, reserved code and receipt independently. Valid name submission normally leaves two or three earlier calls before its reservation; conflicts receive a different code and later free slot. Queue slots receive unique random codes with one or two letters (including combinations such as ZA and XB) and random three-digit numbers, with no alphabetical or numeric call order. Codes are drawn only when needed, stay attached to their reservation, and reset on each visit/replay. Each prefix-length pool extends into fresh numeric ranges if exhausted, without a fixed ticket-count cap. The phone must receive and display its code before sending the bounded `ticket-received` receipt with the scan ID and exact code. Only that receipt activates the host's appointment gate; missing delivery, stale receipts and repeated submissions cannot activate another ticket. Retries resend the same reservation. A late receipt receives only the remaining call window or forfeits an already replaced call.

The physical Anzeige retains a separate called code for Schalter 1–4, all populated from room entry; a new call is attempted every 3.2 scene seconds. A reserved call stays valid for 30 scene seconds, and its row cannot be replaced during that window. Busy rows skip the attempted replacement without a beep; a conflicting reservation waits for its next free slot. Calls at the other counters do not invalidate it. The phone shows only the code, and neither a host assignment banner nor a duplicate called-code HUD reveals the desk. The player must match the phone code to the Anzeige and the numbered desk signs, then reach the right clerk during that window.

E near any counter starts its existing refusal encounter unless the player has that counter's active call and a submitted name. The speaking/refusing clerk is selected independently of the assigned counter. Refusal does not pause the appointment deadline; optional walking conversations and the omen retain their queue pause. The room keeps its quiet bed, occasional remarks and telephone rings. The four-row board is 3 × 1 metres with a 768 × 256 texture; it reuses the existing model/material and adds 262,144 decoded RGBA bytes, with no new download.

Each committed board call keeps its short 1480/1960 Hz double beep, now with a
quiet 0.012 peak envelope so frequent board changes do not dominate the room.
The beep occurs only after a new code is committed to a free Schalter. It does not run for entry, registration, receipts, occupied-row retries or rendering. The 30-second call window uses the existing paused/slow office scene clock. Any received, currently called ticket can initiate the main interaction at its matching desk; selecting it switches all interview and telephone messages to its owning peer. One interview runs at a time.

The existing ambient update loop owns one background turn every 8.5 seconds
when speech is free. A randomized bag gives two turns to character dialogue and
one each to paper handling, stamping, a telephone ring and the copier. The bag
exhausts before refilling, discourages adjacent identical types, and the dialogue
bag retains its distinct-speaker/text rule. Walker waypoint arrivals no longer
start independent competing foley; these short textures use the existing
`officeCue` and `ring` synthesis and effects bus. The quiet hum stays underneath.

Frau Knick's exact recorded “Nächste bitte!” uses the same 0.22 background voice
scale as the other remarks. Entry and each delivered call draw a fresh uniform
**35–75 second quiet cooldown**. Its current board announcement consumes one
shared ambient turn only after that cooldown and at least 360 ms after the
board beep; an occupied speech slot can postpone it. It never cuts off a remark,
foreground interaction, phone exchange or cinematic, and it never replays a
backlog. The cooldown pauses during encounters, outside the office or while hidden; replay
resets it and both bags. Counter interaction/exit still discard pending calls.

`buergeramt-story.js.queueCall` owns the exact words, Knick identity and Schalter
3 mouth track. Media start/end receipts own captions and the quiet cooldown;
a rejected/missing/disabled voice keeps its exact 1.2-second caption. EFFEKTE
and STIMMEN retain separate mute behavior. No new audio asset, context, timer
loop or scheduler is introduced. The existing 2.2-second MP3 is unchanged.

Missing the queue summons or hiding/disconnecting a companion before reaching the counter forfeits only that peer’s ticket. At the counter, a confirmed hidden page retains the silence route even if its connection subsequently suspends; disconnection alone leaves visibility unknown. The expired companion shows “Termin Verfallen” and a measured “NEUE NUMMER ZIEHEN” action reloads the same invitation with a fresh scan/name form. The shared URL and other browsers’ reservations stay live. Closing/replaying the office retires every remaining channel; successful A38 completion sends done only to the selected phone and forfeits other pending tickets as the shared game leaves this episode.

The unlisted `?geheim=buergeramt` URL opens directly at the office entrance for repeated level testing. Its fixed restart link reloads only this episode; the normal city entry remains the canonical story route. Direct entry skips unrelated city GLB downloads; normal entry keeps the city asset path. The shortcut is a convenience link, not authentication or a separate game deployment.

Every fresh visit resets ticket admission, board/deadline state, registration
choices and stamps, phone warnings and repeat calls, actor encounters, omen,
gaze, floor clocks and both ambient bags. Old links, media callbacks and timers
cannot act on the new visit. Saved sound preferences and an earned Anmeldung
badge remain persistent. Rescanning within a visit cancels the previous call's
arming and interference; optional encounters resume from current admission,
without restoring an obsolete ticket or waiting state. The production-path
regressions are in `tests/buergeramt-causality.test.mjs`.

The QR sign sits directly beneath the red ceiling number display and asks
visitors to scan it to receive a number. Submitting the phone's ordinary
"Name eintragen" form silently unlocks browser audio and requests wake lock
in that same browser gesture. The QR page shares the game's load/first-interaction
fullscreen behavior documented in `GAMEPLAY.md`. The incoming-call overlay has
only answer/decline controls; the appointment page has no call-management action,
pairing status, connection message or call transcript. There is no setup button, test tone,
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

At the correct counter, Frau Knick starts the first registration question, the desktop arms the linked phone, and a brief 217 Hz style speaker-interference cue begins 900 ms before the planned ring. The office's synthesized sound bus ducks during that cue. The phone receives a future ring target in its measured monotonic clock domain when possible, with a public UTC cross-check and receipt-relative fallback; it reveals the call, sounds its first ring burst, and requests vibration at that target. The exact beat and limits are in [the timing evidence ledger](./PHONE-CALL-TIMING-RESEARCH.md). The caller is always displayed as `Unbekannte Nummer`, including with English call controls; the Kriminalpolizei identity is revealed only after answering. The five phone recordings use the user-selected Secret Tunnel profile `GS Kriminalpolizei` (`f700170f840543bca7413d3ccf6ac028`) and load one exact line at a time, with German browser speech on failure. Heinrich Wachtmeister remains the city police voice. The call controls and status use English when the host game's English subtitles were on at QR creation, otherwise the phone browser's preferred English or German, with German as the fallback. This affects call chrome only: the ticket page, office captions, police speech, and Frau Knick dialogue remain German, an explicit local exception to Berlin's Denglisch rule. The staged incoming-call screen follows a documented phone family: separate tap controls for iPhone and unknown browsers, a centered left-decline/right-answer drag for Google Phone, and separate green-left/red-right drag controls for Samsung Phone. Google and Samsung controls retain tap fallback. Browser hints can identify an OS and sometimes a Samsung model, but not the installed dialer or its settings; [the visual evidence ledger](./PHONE-CALL-UI-RESEARCH.md) defines the fidelity boundary. Declining and missing preserve the page and repeat the call after 24 office-tempo seconds. Each confirmed visible arrival triggers the next of four escalating Knick recordings; the fourth cancels the appointment. Putting the phone browser away supplies silence evidence; no in-game telephone choice can do so. The ordinary two-choice registration graph continues between calls. Player replies play before Knick answers. There is no separate continue window. Answering starts an automatic, choice-free argument that escalates from passive aggression to shouting. The complete personalized investigator line begins first. After the complete personalized opening, each interruptible phone start arms the next clerk interruption from its mapped timestamp and sends an indexed cutoff deadline ahead of time. The phone stops locally at that deadline, while the host compensates for learned clerk startup delay. Each of her first three lines requests the officer’s reply before she finishes; its start receipt cancels her active speech. Both sides leave unfinished clauses, cut each other off repeatedly and reject stale completion events. Natural completion may advance an early-ending line; missing starts, disconnects and failed speech retain a bounded continuation. After Knick’s shouting retort, the officer delivers his final demand in full: police are waiting outside for a detailed report of every grass trespass, otherwise more paperwork awaits at the station. This final recording has no authored interruption. Its observed start and natural completion permit Knick’s dismissal; bounded missing-media/disconnection fallbacks remain. She cancels the appointment and the player returns to the street without A38. This is the officer’s spoken threat, not an added city report quest. The mission chain is otherwise unchanged. Counter captions keep their exact spoken source; police captions follow playback receipts on the desktop game, with no telephone transcript on the phone.

Optional actor conversations pause the queue and never change ticket ownership or either counter outcome.

Repeat-call reactions have four distinct exact Knick recordings. Confirmed
`call-ringing` arrivals count once per current round: a first request for quiet,
a second reprimand, a third and final warning, then the fourth-call cancellation.
The fourth arrival closes the phone call and removes all choices immediately;
Knick finishes her dismissal before returning the player to the street without
A38. Declining, missing and returning to the visible phone page retain the
visit's count. A new appointment resets it. Duplicate and stale arrivals do not
count; no timer alone establishes a call arrival.

At the counter, only the companion's actual `phone-hidden` event permits
put-away progression. `phone-visible` revokes it and permits another call.
Unconfirmed disconnect/heartbeat loss is unknown, not hidden; a previously
confirmed hidden page remains put away if the OS then suspends its connection.
The desktop exposes visible/hidden/unknown through the current status and
`registration.phoneVisible`. There is no “lautlos” dialogue choice. This is
browser-page visibility, not detection of the physical ringer switch, device
volume, or the person looking at the display.

The named opening uses the accepted ticket name in one German utterance:
“Spricht hier [Name]? Hier ist die Kriminalpolizei am Apparat!” followed by the
existing grass allegation. It finishes naturally before Knick's argument;
its exact source and English translation supply the desktop caption on playback
receipts. `GermanyKripoSpeech` prepares one name with the user-approved compact
caller derivative and prerecorded surrounding words; it retains the selected
`kriminalpolizei` profile. The intercom has its own model/profile and leases.
The first valid name warms the six fixed call recordings without playing them.
An unsupported browser or unfinished greeting immediately plays the complete
original Kripo introduction and question, with matching captions. A pre-onset
greeting failure also selects that backup, and a failed cropped body retries
the full opening once. Both paths finish before Knick's first interruption.
Continuous phone static covers transitions; Answer never waits for synthesis.
If the intercom model is unavailable, its recorded “Nächste bitte!” still calls
the allocated counter. Names, model data and generated clips stay in browser
buffers; slot/episode completion and pagehide release them. There is no remote
synthesis request or file save. Voice provenance and pronunciation limitations
are owned by [the voice protocol](./VOICE-SYNTH-PROTOCOL.md).

The telephone is a staged incoming-call screen, with decorative SVG cellular,
Wi-Fi and battery indicators beside the measured clock. These do not query
device battery/network APIs or add polling. The appointment page reveals no
phone pairing or connection state and has no silence-calls button. After answer,
the incoming controls disappear and an elapsed call timer replaces the incoming
label. Police speech never enters the phone DOM, including failed-audio fallback.
The phone still emits start/done receipts and obeys indexed cutoffs. On those
receipts, the desktop game shows the exact police line with `KRIMINALPOLIZEI` in
the existing in-scene subtitle rail and clears it at completion, interruption or
exit. A smartphone game browser also omits telephone subtitles. Clerk speech
keeps its own captions and selected `amt-brunhilde-knick` profile throughout the
argument. The runtime selects checked exact-text recordings from that profile;
rejected and unrendered takes retain her caption fallback.

This change affects phone HTML, captions and speech lookup only. It changes no
world geometry, physics, routes, camera, sprite scale or movement, so the two
world consistency reviewers are out of scope. Rendered phone checks use silent
Chromium and Android emulation with simulated signaling; physical Android,
audible listening and natural QR/WebRTC coverage remain separate checks.

## Playable storyboard

| Beat | Performance and interaction | Spoken line ownership | Image and sound tone |
| --- | --- | --- | --- |
| Entry | The player enters and approaches the QR. The Aktenkurier walks a short loop beside the left files, stops, and stamps a carried stack. | `buergeramt-story.js` owns his automatic omen verse; his two optional lines remain catalogued without an E trigger. | File stamp is a brief low paper thud. Warning shifts his painted texture slightly toward old rose. |
| Queue | The Archivbotin patrols between the right shelves and counter, consults her ledger and keys, and can be addressed. | Her two lines describe the impossible archive procedure. | Key and paper rustle stays below the dialogue. Dread leans cool blue violet. |
| Wait | The Formularsammler shuffles an accordion application along the central aisle, pauses to sort pages, and can be addressed. | His second line offers a small, uneasy release. | Dry paper cue; dread eases to weak amber on relief. |
| Crowded office | Nummernflüsterer, Nachtschicht-Melderin, Pfandarchitektin, Kopiependler, and Warteschlangenpoetin circle short paths with documents, phone, receipt, copies, or numbered ticket. They look up at calls, flinch, read, gesture, and address the player. | Each owns two optional German lines in `buergeramt-story.js`; their speech cannot alter the appointment. | Painted Berlin street clothes, fatigue and uneasy colors distinguish them. Queue calls briefly draw their gaze; only the current speaker receives a subtle color-valence tint. |
| Omen (`omen`) | The Aktenkurier leaves his route and automatically approaches the player (before a ticket or while waiting). He alone needs no E press. The camera turns to keep him in view while the room progressively darkens. At his arrival, the surroundings are nearly black around a bright, slightly iridescent spotlight; tension peaks as he says “Wer die Finsternis sieht, hat sie selbst gewählt!” He holds a longer threatening stare, gradually flattens back into paint, then performs a planted 1.8-second turn through nine distinct painted views. He retreats at an eased 0.30–0.60 units/s for 2.2 seconds before the existing room recovery. | The exact German verse lives in `buergeramt-story.js`. The in-scene subtitle rail remains the text surface if speech is unavailable. | A harsh, unresolved cinematic cue grows through the approach; its accelerating pulse also drives the frontal depth reveal, coat and tunnel. It peaks with the near-black arrival and line, then dwindles with the reverse depth reveal, without a resolving chord or attack. The queue clock pauses for the encounter, then resumes. The scene is once per visit and clears on exit or replay. |
| Call | Existing number board, QR ticket, phone, police, and Frau Knick take priority. | Existing counter and phone scripts keep their exact visible speech strings. | All optional actor tint returns smoothly to neutral after the encounter. Phone ring, static, and police voice follow the phone's own call level. |

`buergeramt.js` owns routes, interaction range, work pauses, queue-call reactions, dialogue state, the Aktenkurier beat, Frau Knick's speaking/action row, and the active `{id,tone,valence}`. Moving regulars leave a small walking gap around the player; their gait clock advances by distance walked, and a high-priority story action preempts a routine work loop. Speaking eases the first-person view toward the owning actor. `world3d.js` draws that state: four directional walk rows, work/gesture/look/flinch rows, body-facing billboards, a six-row desk performance for Frau Knick (including lip movement while she speaks), an eased material tint, and the in-world blackout spotlight. The tone target is bounded to a subtle fraction of the paint; it changes only for the actor who owns the currently visible line. Ending the line eases back to the original colors. The room's code geometry and existing stationary painted cast stay in place. The office presents exact speech as plain in-scene captions over the visible room, beginning on actual speech start or its guarded readable fallback. The hidden legacy sheet retains cue ownership only; no dialogue panel is displayed. Reply boxes belong to the scene HUD, to the left and right of the centered Frau Knick, with black-red-gold borders. They stay visible but disabled while a registration prompt is read. Choosing an answer reads the exact label in the player’s recorded voice, then plays Knick’s reply and advances automatically to the next question. Exact captions stay in the shared in-scene rail. Below 420 effective CSS pixels the replies occupy bounded lower left and right regions, with captions above the central face region. Extremely enlarged long labels and captions retain their full text in explicit scroll regions, marked with ↕ and operable by wheel, touch and keyboard Home/End, arrows or Page keys. The shared subtitle rail displays German/Denglisch by default or the selected English translation during office speech; the language control remains available. The former source-text/name overlay stays hidden. Below 260 effective CSS pixels the sound and subtitle controls occupy separate rows. Captions use the short “FRAU KNICK” name while preserving the exact spoken line. Walking controls and the direct restart link hide during a sequence and return afterward. The small `TON` disclosure and shared subtitle language control remain available.

The `omen` visual beat unfolds the Aktenkurier's registered frontal gesture into a
pronounced Gaussian sculpture while he approaches. He faces the player throughout;
local +Z expands toward the viewer without a sideways turn. Distance progress
drives the reveal: smoothstep over strength 0.05–1 for depth. The legacy
opacity window selects representation ownership; the body itself stays opaque.
The upper-body relief expands up to 3.4 times its authored depth, with 12% coherent
width expansion: the face, stamping hand and carried files visibly project toward
the player. The lip rig receives the same deformation after articulation. A
directional light field emphasizes the cheek and coat curvature without hiding
the painting. A broad coat billow and a small forward surge follow the existing
score pulse; face and rigid files retain their registered relationships. The
foot baseline and actor/camera transforms do not change. Reduced motion retains
the strong static volume and lighting while disabling the decorative billow/surge.
The view's horizontal field limits the gain on narrow screens (about 2.45 at
390×844), preserving room around both sleeves and the files without moving the camera.
The Gaussian body takes ownership only after its own visible-body sort completes.
At the handoff the sprite holds the registered gesture; this deliberately
statuesque, supernatural approach is a translated relief, not an articulated walk.
The simulation retains its displacement clock; the staged turn is planted and the slow retreat advances gait only with actual travel.
A second, procedural 3,072-splat hollow tunnel curls around the sightline
to his torso: charcoal/violet Gaussian clouds widen toward the camera and narrow
toward him. The shared musical pulse contracts the tunnel and pushes his coat
toward the camera, protecting face detail and the planted foot baseline. Bruised
violet/charcoal replaces rainbow cycling. Both volumes share the existing
renderer, with the speaker's temporary foreground depth policy during the omen.
Distance fog darkens the office behind the readable figure, while the
existing screen vignette seals the outer darkness. The tunnel is an intentional
camera-attached hallucination, without collision or changes to the room geometry.
`buergeramt.js` owns the visit token and
continuous simulation `life` signal; `buergeramt-splat.js` projects that state through the
existing Three.js scene. The exact verse and speech-completion release remain
owned by the existing cue. Reduced motion keeps the opaque depth morph but
removes pulsing, ripples and tunnel rotation. The figure flattens over 1.8 seconds
before handing ownership back to its registered sprite and turning. Missing or
late assets keep the sprite for that encounter.
Exit, replay and cancellation retire the effect and reject stale preparation;
an in-flight GPU sort finishes before its buffers/worker are freed.

## In-scene fever encounters

The user's 2026-10-10 foreground requirement keeps the encounter's painted
speaker solid throughout entry, hold and room restoration. Office characters
draw in a final actor pass after the room and visual effects throughout the
office scene, including walking, waiting and encounter release. The user's
follow-up preserves room depth: keep its depth buffer and depth-test every
person against solid walls and furniture. Use equal actor order and camera-depth
sorting between people. Native Gaussian patches inherit this layer/depth policy,
and the shared Spark fallback follows it too. Only the
selected speaker prepares an action cloud during isolation; other actors retain
their ordinary sprites on the final actor layer. On encounter release,
full painted opacity returns while the actor layer remains; an early scene
close restores the ordinary layer. Source and Gaussian ownership stays binary;
the Aktenkurier's body remains opaque while its depth morphs and flattens.
Intrinsic painted transparency is preserved. City sprites retain their normal
opaque-wall occlusion. The shared action clock, paired paint paths, official
voices, scene isolation and slow turn/retreat are unchanged.

The room-depth follow-up passes seven silent Chromium renderer fixtures:
desktop, Android portrait/landscape emulation, reduced motion, missing native
anchors and room models, Konrad and the clerk. Controlled production-pass pixel
checks verify solid occlusion, paint above the visual motif, clear alpha edges
and crossing person depth. Entry/hold/release, resize, planted feet, paused action
clocks and early-close sprite restoration also pass. Physics and Camera specialists
independently reviewed the frozen renderer; evidence is under ignored
`output/office-top-layer/accepted/` and `objects/`. The final desktop fixture
under `final-assertion/` also passes the ordinary layer mask after an explicit
render on early close; the seven-profile run predates that stricter assertion and a
report-limit wording correction. Runtime renderer hashes are unchanged by
those harness edits. These are forced scenes and geometry probes; physical
Android and a natural mission playthrough are NOT RUN for this rendering change.
After integration with `1e0a657`'s background-slot retirement, fresh portrait,
landscape and desktop handoff fixtures also pass. The prior background native
painting is retired before speaker admission, its ordinary sprite opacity
returns to one, and selected paint keeps the final actor layer and room depth.
Seven fixed action phases, reduced-motion fallback and return to background
animation are captured under `output/office-top-layer/handoff-final/`. The
first additional assertion used the sprite's display name instead of its
character ID and failed; that probe and report remain separately in
`handoff-rebased/`. The corrected fixture changes no production behavior.
Fresh focused lifecycle tests pass 13/13. Comparable office measurements and
the six-run root release guards pass as recorded in `ASSET-POLICY.md`.
Independent Physics source and Camera source/rendered rebase reviews pass.
The added handoff assertion checks the selected sprite's layer/depth/order;
native patch policy is covered by the unchanged owner source and unit checks,
with actual native-paint visibility checked in the captured frames.
The later `839c43a` Merz city-dialogue/cache integration leaves all three office
renderer files byte-identical; both specialist source addenda carry this
rendered coverage. Fresh release selections and root cache smoke also pass.

After the `bc647de` stronger courier relief was integrated, an actual-body
overlap probe found Spark sorting at the world origin once all native paint
anchors retired. Keep the shared owner's transparent comparator until its
synchronous disposal. Its depth comes from active native anchors, or visible
body splats when those anchors are gone; the camera-attached tunnel is excluded.
The corrected desktop, portrait/landscape and reduced-motion GPU pixels verify
opaque room occlusion, a nearer person in front, a farther person behind, and
the courier above the visual motif. Production framing, missing-splat fallback
and restoration pass under `output/office-top-layer/relief-final-all/` (five
completed profiles). The separate `relief-final-fullbody-diagnostic/` PASS run
checks feet and flattening with explicit diagnostic FOV/pitch. The first
full-body run's speech timer advanced past a sampled checkpoint; its failure
is retained, and the corrected fixture pauses mocked speech during its held
dispatch samples. Those samples establish neither GPU time nor audio playback.
The ordering repair changes no relief geometry, movement or action clock.
Fresh `native-final/` and `relief-final-early-close-root/` fixtures preserve the
game's actual direct-visit callbacks and assert its closed-visit response after
mid-effect exit. All fourteen sprite layer/depth/opacity states restore, effects
dispose and no page errors occur. The direct route keeps its last canvas frame
behind that response; this is evidence of the closed-visit UI and ownership
cleanup, not visible city restoration. The earlier noop-callback cleanup run and
the first missing-callback test failure are retained separately. Ordinary room
restoration is verified by the completed-encounter production captures above.
The final `objects-final/` renderer report passes desktop and portrait/landscape
emulation on both root and direct-3D entry points, including loaded/fallback
and nonblocking city geometry. Current actual-body, native-paint, grounding and
root-close evidence is separately reviewed by the Physics and Camera specialists;
the unchanged source hashes are frozen in `candidate.json`. Device and natural
mission coverage retains the limits above.

Foreground verification (2026-10-10): the reported floor leak was reproduced
before the repair. Seven silent renderer fixtures cover desktop, Android
portrait/landscape emulation, reduced motion, missing anchor art, a seated
visitor and the clerk; all retain solid speaker coverage and restore normal
layers on release and early close. Adjacent full-body omen frames verify its
own sorted-body handover and flat return without a visible contour/foot jump
at the captured scale. Actual candidate-02 playback separately passes its
native-media mouth/pause/end checks. Evidence lives under ignored
`output/character-morph/{final-layers,omen-boundaries-final,native-omen,direct-smoke}/`.
These are forced renderer fixtures, not a full natural mission playthrough.
Physical Android and perceptual listening are NOT RUN; intrinsic painted
alpha and the existing paired texture transport remain part of the artwork.

Every distinct Bürgeramt speaker has an authored dark surreal space. Eleven
begin by pressing E (the existing touch interaction button is equivalent), with
nearby regulars/patrons within 1.65 m taking precedence. Walking nearby, queue
reactions, ambient lines and phone messages do not begin those spaces.
The Aktenkurier alone approaches automatically once per visit: after 1.2 s in
the office, within 6.2 m and with a body-clear route. Active speech, city audio
or another fever sequence defers his approach; it may happen before scanning or
while waiting. He has no ordinary E interaction. Decorative desk copies share
Brunhilde's painting; they are not additional speakers.

These are short self-ending animation sequences, with no popup or return
button. Actual speech completion owns the 0.65 s hold and 1.5 s fade, followed
by a 0.25 s settle before walking resumes. A moving regular finishes the nearest
work anchor before returning to patrol. Early/expired counter outcomes also
return automatically to waiting or the QR. Consecutive clerk lines continue
without a full release between them, retaining one continuous space. The final
reply releases before the existing A38 form. Phone scans during a regular or
patron conversation issue the ticket immediately, preserve the current speech
and release, and resume in waiting when that sequence ends.
Pending continuations carry the attempt and speech cue; hidden time, paused
speech, exit and replay cannot advance a stale scene. The existing office update
is the only scheduler.
Audio/subtitle controls occupy the top edge during a sequence. The existing
Pretext fitter measures their actual bottom edge and reserves a caption region
below them and above the English subtitle rail. Long source text retains a
scrollable fallback there, with a soft dark text backing for bright room geometry.

| Identity | Distortion theme |
| --- | --- |
| Horst Stempelmann, Aktenkurier | Sealed sentence; the automatic accepted Gaussian tunnel and frontal relief |
| Gisela Aktenberg, Archivbotin | Repeating archive drawers close around the person being filed |
| Dieter Papiermann, Formularsammler | Forms fold the room along an impossible continuous crease |
| Rüdiger Nummermann, Nummernflüsterer | A descending litany of numbered tickets |
| Ingrid Feierabend, Nachtschicht-Melderin | Dead telephone windows drift through an empty signal |
| Bärbel Pfennig, Pfandarchitektin | A receipt with no beginning unspools around her |
| Uwe Kopitz, Kopiependler | Empty mirrored office frames prosecute their original |
| Hilde Wartenscheidt, Warteschlangenpoetin | Numbered waiting places become a funeral queue |
| Brunhilde Knick | A rotating half-stamp tribunal surrounds the counter exchange |
| Konrad Wohnungszettel | A floor plan with rooms but no inside |
| Mechthild Elternbogen | Registry rows continuously erase their entries |
| Wolfram Rentenbescheid | A clock court counts backwards around the unresolved notice |

`buergeramt-fever.js` owns the theme map and a clock advanced only by the existing
office update. Entry takes 1.2 s; actual recording/browser start and word receipts
own speech progress. Completion holds 0.65 s and releases over 1.5 s. Returning
to walking releases from the current strength without a cut. Hidden pages and
speech pause freeze the clock. Cue/generation ownership rejects old callbacks;
exit/replay clears the clock and bounded sound graph. Consecutive counter lines
carry the current strength and space time instead of flashing back to the room.

The registered character action remains the native Gaussian texture transport
between sharp painted anchors. The surrounding motifs are a single existing
fullscreen shader pass, not reconstructed 3D character volumes. A clear window
projects the four actual painted plane corners, clips their bounds to the
viewport and protects the complete visible face/body, including very close E
interactions; no extra bodies, trails, camera shake or FOV
oscillation are introduced. Structural materials fade through their own original
opacity, with temporary transparency/depth-write settings restored exactly on
release/exit. Actors are kept in a separate group so a desk cannot become an
opaque black rectangle across the selected patron. Gaussian background paintings
receive the same isolation strength, preserving safe anchor admission and the
2 desktop / 1 mobile residency limit. Reduced motion freezes motif movement and
retains the readable painted fallback. The document's existing Gaussian effect
still applies only to the ABGELEHNT stamp.

The 40 new voice recordings across all twelve speakers are default dialogue,
approved by the user's “I approve, just implement it” instruction. Their exact
scripts, English annotations, source rights and listening status are owned by
`VOICE-SYNTH-PROTOCOL.md`; use approval is separate from listening verification.

Validation is retained under `output/amt-fever-interactions/`. Independent P5
and C4 reviewers checked the same frozen source and their later source-delta
addenda preserve upstream mission-compass, official omen lip-sync and entrance
radiance changes.
The first controlled 12-theme × desktop/Android portrait/landscape sweep proves
motif variety on that candidate; after its close-E face-mask repair, fresh natural
Nummernflüsterer captures prove readable painted faces in all three profiles.
Fresh final Konrad checks use real muted native MP3 playback, manual pause/resume,
actual media end and complete room restoration on desktop and Android emulation;
`3d.html` also starts without page errors. These are distinct from ASR and listening.
Affected controller/Gaussian/voice/lip-sync and root regression checks pass.
Peak performance scope and numbers belong in `ASSET-POLICY.md`. Physical Android
and perceptual listening are outstanding; the explicit use approval was recorded
without inventing listening results.

The subsequent self-ending sequence revision retains the same art and Gaussian
transport. Controller checks cover automatic courier entry, E-only other
characters, speech/fade completion, hidden/replay cleanup, and automatic A38
progression: 228 office tests and 16 voice/subtitle checks pass, as do the 42
root deployment regressions. Silent natural automatic-omen and Konrad E cycles
on desktop and Android portrait/landscape emulation prove panel-free playback,
native pause/end handling and room restoration. A controlled longest-caption
check at 320 px and 200% zoom separately verifies control clearance and native
scroll to the final text; it does not prove a natural counter story trigger.
The original overlapping caption failed rendered review and was repaired before
acceptance. Frozen source and independent P5/C4 reports are retained in that
same evidence directory. These checks add neither physical-device nor listening
evidence.

## Sound and mix

For a changed cue, use the shared beat card in [`MUSIC-SOUND-DESIGN.md`](./MUSIC-SOUND-DESIGN.md) so its story purpose, controller event, visual action, cue parameters, mix, receipts, fallback, and cancellation are reviewed at one candidate revision. This episode's sound policy below is the current playback authority; the general skill supplies production methods.

The room has a quiet 53 Hz fluorescent hum and short nonverbal file, key, paper, and copy cues at work stops. Effects attenuate with player distance. The red call-board ring and work cues use `EFFEKTE`; `RAUM` controls hum, and `STIMMEN` controls new office speech utterances. During the one-off Aktenkurier encounter, the existing effects bus carries a bounded aggressive cinematic buildup with distorted bass/brass, beating dissonance and abrasive metallic bands. It grows with approach and darkness, holds below the exact spoken line at the peak, then holds the threat and gradually drains with the reverse depth reveal before the turn and silent retreat. It obeys the existing effects mute and clears on exit/replay; it does not start a continuous office playlist or override city music preferences. The compact `TON` disclosure persists the three office levels locally. The phone automatically uses full browser output gain for ring and static, and maximum utterance volume for police speech, with no visible volume control or saved phone-volume preference. Cue envelopes keep their authored relative levels. Device volume remains controlled by the phone's operating system. A voice already in progress follows the level captured at its start because browser speech does not expose a live gain node. No media stream or server is added.

**`omen` beat contract (2026-10-09).** Before a ticket or while waiting, one automatic encounter per visit commits only with a reachable, body-clear office path. A bounded 0.35 m grid search uses the existing QR, seats, furniture and paused-character footprints, then removes unnecessary waypoints along continuously clear segments. Exact segment/rectangle and segment/circle checks cover narrow corners between simulation samples. The first 0.9 seconds turn the camera toward him and fade all other office objects and characters to black; an environment parent hides them completely before he advances. Geometry and people retain collision. He follows the clear path at 0.78 m/s, with path-distance progress driving the rising cue and frontal depth. At a clear stop 1.68–1.82 m from the player he delivers the unchanged German line. Actual speech/fallback completion owns a 3.4-second threatening stare, then a 1.8-second reverse sequence: motion settles first, depth flattens over the first 1.17 seconds, and the body stays opaque through the final 0.63-second flat hold before the registered painting takes ownership. Score pressure drains smoothly throughout. The same release drains sound without an attack or resolution; the existing 25 ms source cleanup follows its near-silent endpoint. A planted 2.4-second front→side→rear turn uses the accepted directional paint with bounded pivot motion, not an articulated full-orbit reconstruction. His first 2.8 seconds of retreat accelerate gently to 0.48 m/s along the approach path in reverse. The room and original view restore over 1.6 seconds, then control and the queue resume; any remaining return path completes before ordinary patrol, yielding at 1.05 m to the player and replanning around newly loaded props without teleporting. QR scans/name registration remain accepted in every phase and select the resumed waiting stage. A newly blocked route either replans or takes the bounded recovery; phone forfeiture, exit and replay cancel all ownership.

The two authored layers are `assets/audio/buergeramt-omen/bed.ogg` and `tension.ogg`, produced from [original core SuperCollider 3.14.1 source](../assets/audio/buergeramt-omen/render.scd); [provenance and rebuild commands](../assets/audio/buergeramt-omen/LICENSES.md) accompany them. Existing Web Audio on `EFFEKTE` owns playback; an oscillator fallback covers a missing, failed, or late fetch/decode. A newly ready layer cannot enter after 75% approach progress. Source playback has a finite 24-second cap; a hidden document mutes it, and exit or replay stops it and clears the beat. Silent timing checks do not establish perceptual acceptance.

The same story entry owns the omen's authored delivery: browser fallback rate `0.82`, pitch `0.72`, and a word-anchored score contour. Its default voice is the user-approved `aktenkurier-omen-candidate-02` recording from Horst's second official profile; candidate 1 remains preserved. `AUDIO-TEXT-LIBRARY.js` and `VOICE-SYNTH-PROTOCOL.md` own the exact source line, approval and provenance. Actual native playback start begins ducking; ASR-estimated word cues observed against the media playhead move the cue through “Finsternis,” the comma/“hat,” “selbst,” and the falling cadence of “gewählt.” The contour changes filter brightness, upper-layer density, Gaussian pressure and bounded score transposition while speech remains foreground. Browser pitch is a requested fallback setting, not measured fundamental frequency; the score mapping is artistic. With word receipts, the cue holds its last observed position rather than finishing on a separate timer. Pause/resume freezes that position and the shared Gaussian life/pulse clock, attenuates pulse motion and suspends the voice completion watchdog. Hidden-page media playback pauses and resumes with visibility. Engines without usable boundaries, voice-off and failed voice use a rate-scaled estimate, capped before completion; only native playback end, browser speech end or guarded fallback completion starts the 3.4-second stare and the ordered unwind, turn, retreat and recovery. `BuergeramtLevel.omen.speech` exposes receipt mode, recording path and progress for silent checks. Attempt/cue guards reject late events after cancellation.

**Historical omen-only articulation (2026-10-10; superseded by the shared speech pipeline below).** The official candidate-02 MP3 also owns the mouth clock. `buergeramt-lipsync.js` samples 24 offline phonetic viseme intervals and a 50 Hz energy envelope from `assets/buergeramt/omen/mouth-cues.js`, bound to the recording's exact SHA-256. These are estimated mouth shapes, not verified German phoneme alignment. Each existing frame reads native `currentTime`; the rig blends shapes over 55 ms, moves only front lip/lower-jaw samples, and adds 96 depth-sorted oral-cavity kernels in the same Gaussian body. Closure, vowel opening, rounding and lower-lip biting preserve the painted face, eyes, actor root and feet. The sculpted lip centre is registered to detail pixel `(346.5,134)`; the cavity follows its curved relief and has zero opacity at rest. It articulates only during the owned recorded line. Pause holds its exact pose, completion closes it before the glare, and cancellation/replay clears the owner. Reduced motion retains semantic articulation while disabling decorative ripples. Voice-off, browser speech and failed audio keep a closed mouth rather than advancing an estimated lip clock. Real word receipts are selected at recorded start, before any time estimate can outrun the first boundary. The offline builder, analyzer provenance, immutable audio and reproduction commands are documented beside the omen asset.

**Shared `omen` life/score card (2026-10-09).** The existing visit/attempt and pre-ticket trigger own one isolated approach→line→glare→unwind→turn→retreat→ordinary-office event. With strength `p` and authored speech tension `t`, pressure is `p² × (0.72 + 0.28t)`, multiplied by the shared smooth reverse envelope during unwind. Simulation integrates pulse cycles at `0.65 + 2.1p + 0.35t` Hz and shapes each pulse as `((1 + cos(2πclock))/2)^8`; speech pause freezes phase/time. Audio follows the same pulse through gain, upper-layer density and filter resonance; splats use it for bounded forward coat expansion and tunnel contraction. The stationary stems contain distorted brass/bass and ring-modulated metallic bands, with no baked tempo, finite riser or payoff. Audio automation maps current controller values to Web Audio time with 18–60 ms smoothing. Voice remains foreground; `EFFEKTE` mute, hidden-page silence and the 24-second source cap remain authoritative. Glare lifts ducking and holds the threat; the shared 1.8-second reverse sequence settles deformation, flattens depth, then holds the opaque flat representation until the registered painting takes ownership while pulse and score pressure drain. Keeping the Gaussian opaque until flat avoids doubled hands and file edges. The turn and silent slow retreat leave the expected catastrophe absent; room/view recovery follows. No accent advances the queue or mission. The figure's painted projection retains its ground pivot; room collision/scale and the 0.78 m/s approach remain unchanged. A missing preparation at the first opacity handoff preserves the frontal sprite for that visit. Source, silent-browser, emulated-device and listening evidence remain separate.


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
work→gesture→work action for dialogue. After the sequence releases, a regular completes the
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
the three other clerks share Knick's painted pack through separate animation
slot IDs, with their own dialogue identities and selected voice profiles.
All fifteen rendered office figures are eligible for the same
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

An isolated conversation retires background Gaussian slots immediately. Those
background action clocks may freeze between main paintings, so waiting for a
safe anchor would prevent the selected speaker from acquiring the single mobile
slot. The existing isolation already hides those replacements; retirement
restores their ordinary sprites and leaves the speaker's safe admission rule,
simulation clock, floor, depth and two/one actor limits intact. The focused
`tools/playtest-mobile-gaussian-handoff.mjs` fixture uses the actual office
renderer and assets with deliberately frozen state. Its mobile scenarios are
browser emulation; they do not establish behavior on a physical Brave device.

`buergeramt-voice-profiles.js` gives the twelve named speakers distinct infernal,
Kafkaesque performance briefs and browser rate/pitch hints. Explicit story
delivery and approved exact-speaker recordings retain priority. Twelve actual
alternate profiles were saved in Secret Tunnel's local Voice Cloner from the
documented CC0 emotional references, with private transformed WAVs. These are
unlistened alternatives, not accepted cloned game recordings. The 2026-10-12 restoration keeps one Knick identity and selected profile
across all four counter slots. IDs, provenance and the separate listening gate are
owned by `VOICE-SYNTH-PROTOCOL.md`.

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


The 2026-10-10 phone recast changes caller copy, authored speech, reciprocal voice cutoffs and recordings only. Physics and Camera specialist reviews are omitted because world placement, movement, art, collision, camera and scale are unchanged. Encoded transcripts and silent phone scheduling checks do not establish listening quality or physical-device coverage.

TimeAPI UTC stamps now also anchor the escalating argument when a fresh peer offset is unavailable. Each observed phone onset produces an advance cutoff deadline in phone-monotonic and UTC time; the phone stops locally instead of waiting for a last-moment network message. Host desk timing uses the mapped onset and measured startup lag. Two 100 ms retries cover a failed cutoff send, followed by natural completion or a 60 s bound. This records browser timing and does not establish physical acoustic precision.

## Anmeldung interrogation and completion

`buergeramt-story.js` owns a ten-question direct route through a 52-node interrogation. Correct answers cover presence, original identity document, actual move-in date, Wohnungsgeber, confirmation, address, the applicant’s signature, residence, checking the recorded details and collecting the receipt. Every question has two authored answers; foolish replies lead through finite corrective detours. Choosing every second answer takes 52 questions, while every first answer takes ten. All nodes remain reachable and can finish. Correct core answers earn one point each, once per question, for a maximum of ten; legitimate withheld-confirmation and multiple-residence answers also earn their point. The existing scene status displays points and avoidable follow-up questions. Points never replace a required answer or block completion. Stamps remain progress remarks rather than hidden inventory prerequisites. The longer branches cover the two-week period, landlord vs subletting main tenant, address/owner fields, civil-status evidence where applicable and the final receipt. A five-node withheld-confirmation branch reports the refusal and returns to a fictional resolved dossier; reporting alone is not an automatic real-world substitute for the confirmation. Knick’s extra counters, fax demands, copy disputes and procedural permissions are authored exaggeration.

The host owns the registration node, pending reply, points, remarks, silence evidence, call round, warnings and single completion. A call warning preserves the current node/reply. No player button or phone-origin `silence` packet can set silence. After counter admission, the companion’s hidden `visibilitychange` or `pagehide` event provides accepted browser-away evidence. Offline/disconnection or eight seconds without inbound traffic leave visibility unknown unless the page was already confirmed hidden; host-background time does not count toward that watchdog. No event claims to detect the OS mute switch. The existing heartbeat retries hidden/visible metadata; a visible return revokes silence and arms another round. Before counter admission the same loss still forfeits the ticket. Retired links, exit, ticket replacement and replay cancel attempt-owned calls and callbacks. No new transport, service or polling loop is introduced.

Completion requires the terminal graph choice and accepted browser-away evidence. A pending final answer waits before Knick’s spoken approval and before awarding its point while the companion remains reachable. It immediately displays **ANMELDUNG ABGESCHLOSSEN** and invokes `onRegistration` once. The city stores `germany-anmeldung-v1=1` locally and displays the text badge in the file’s Collection page, including after a reload. Taking the receipt retains the A38 form and eight-mission progression. Direct mode’s final form receipt also announces Anmeldung completion. The full-screen request is automatic at office entry and the existing E interaction, without a new fullscreen control; browsers still own activation, permission and escape behavior.

**Beat card — `registration-phone-pressure`, updated 2026-10-13.** Counter admission permits a numbered round. The current visible phone's first `call-ringing` receipt schedules Knick's first reaction after 600 office-tempo milliseconds. Continuing unanswered ringing advances the next reaction every twelve office-tempo seconds; it never sends an automatic missed-call timeout. Scheduling acknowledgments and duplicate/stale reveals cannot add warnings. Decline stops ongoing pressure and retries after twenty-four office-tempo seconds. The first three distinct reactions preserve and resume the interrupted question. Reaction four commits cancellation, stops the phone, and ends the visit immediately after the short “Jetzt Reichsadler! Raus!” completes. Ejection sets five stars and gives no A38. No silent-mode response button exists; actual browser-hidden metadata supplies away evidence, while disconnect remains unknown. Failure, success, replacement, exit and replay cancel attempt-owned sources, haptics and timers.

**Schalter validation, 2026-10-13.** The isolated phone/story/status patch preserves the published world sources. The full Node suite passed 652 checks; focused regressions subsequently cover host-background recovery and withholding the final spoken approval/point (10 registration tests). Silent Chromium with two contexts and simulated signaling completed the ten-question route on desktop, Android portrait/landscape emulation and 200% zoom, and the 52-question detour at 320 px. Incoming receipts, missed/repeated calls, metadata-driven silence and visible score fitting were checked through production handlers; the counter approach and visibility event were seeded, and caption reading was accelerated. A separate forced two-context call observed the native final MP3 play all 14.36 seconds and end before dismissal. Physical QR/WebRTC pairing, physical Android and perceptual listening remain untested. No world geometry, movement or camera behavior is changed by this patch; earlier shared-root world reviews belong to those separate candidates.

### Research basis

Reddit material is unverified self-report inspiration, not established fact or legal authority. Original game dialogue exaggerates these mechanisms; no post is copied and no claim is made that these are objectively the worst experiences:

- [Appointment scarcity and refresh failures (2021)](https://www.reddit.com/r/berlin/comments/op7itp/why_is_it_so_hard_to_get_an_anmeldung/).
- [A January sublet with confirmation withheld until a March contract (2022)](https://www.reddit.com/r/germany/comments/s9f46t/place_am_staying_at_refuses_to_give_me/).
- [Months of unanswered confirmation requests (2023)](https://www.reddit.com/r/wohnen/comments/153c9w1/vermieter_stellt_mir_keine/).
- [A failing appointment website (2024)](https://www.reddit.com/r/berlin/comments/1fu9n5f/the_anmeldung_appointment_booking_website_keeps/).
- [A reluctant Wunderflats landlord (2026)](https://www.reddit.com/r/germany/comments/1qa49gh/i_rented_a_flat_on_wunderflats_and_landlord/).

Fresh source check on 2026-10-13 preserves the factual spine and places the anecdotal absurdities in the longer branches. The [twenty-to-thirty refreshes for a ten-minute visit](https://www.reddit.com/r/berlin/comments/pz7d2r/b%C3%BCrgeramt_experience/) maps to `appointment`; [being told in person to send another email after unanswered emails](https://www.reddit.com/r/germany/comments/dcqq26/landlord_is_avoiding_my_requests_to_sign_the/) maps to `landlord` and the refusal/follow-up chain; the January/March sublet story above maps to `provider` and `withheld`. [A flat number transcribed as a house number](https://www.reddit.com/r/berlin/comments/2fn1vh/b%C3%BCrgeramt_helpadvice_error_on_certificate/) supports keeping address and final-record checking in the short route. These are self-reports, not verified events or rules. Existing original recordings are reused rather than attributing fictional Knick lines to Reddit authors. Berlin’s current service page also offers online registration for eligible applicants; the counter/fax ordeal is this episode’s setting, not a claim that everyone must attend in person.

Legal/document anchors: [BMG §17](https://www.gesetze-im-internet.de/bmg/__17.html), [§19](https://www.gesetze-im-internet.de/bmg/__19.html), [§21](https://www.gesetze-im-internet.de/bmg/__21.html), [§22](https://www.gesetze-im-internet.de/bmg/__22.html), [Berlin’s registration service](https://service.berlin.de/dienstleistung/120686/) and [municipal Wohnungsgeber guidance](https://www.neuenhagen-bei-berlin.de/startseite-de/buergerservice-einwohnermeldeamt/informationen-fuer-wohnungsgeber/?sds=1). Verified 2026-10-10. These support document/date distinctions and the duty to report a withheld confirmation; the game’s fictional detours are not added legal requirements.


**Local validation, 2026-10-10.** Targeted registration/session/protocol checks pass (111 tests), with separate object, city-model and mission-fax checks. The silent scripted browser matrix completes the 24-question main route at desktop, Android portrait and landscape sizes, and the 52-question detour at 320 px. Rendered text has no horizontal overflow in the sampled question/success views; 200% text sizing was also inspected. Supplied screenshots and exact candidate hashes are in `output/playwright/anmeldung/report.json` and `report-hud-fullscreen.json`. The latter uses separate host/phone contexts and observes native fullscreen allowed from the existing E interaction, plus the repaired dynamic HUD label. Independent Physics checks pass all four approaches at 60/30/10 updates per second with actual office-detail obstacles; independent camera review prompted clear-face desk supplies at all four stations, now recaptured. The main matrix used direct entry, accelerated keys/queue, simulated signaling and DOM-handler graph traversal; natural city progression, QR/WebRTC pairing, physical Android and perceptual audio remain unverified. The 2026-10-11 integrated release combines this registration work with the pending renderer and voice changes under the standing publication policy.

The integrated 2026-10-11 release retains automatic in-scene encounters and opaque whole-body Gaussian transitions. The Anmeldung questions and telephone warnings retain explicit answer controls. One cue-owned speech track drives atlas mouth patches and continuous native-paint mouth deformation on admitted whole-body Gaussian actors. The Aktenkurier volume consumes the same owned shape. No second mouth cloud is drawn over a whole-body Gaussian replacement. Native recorded playback uses audio-derived cues; browser speech receipts and synthetic grapheme articulation remain estimates. The current full-opening contract is below.

**Initial integrated release validation, 2026-10-11.** The complete deterministic suite passed 459/459, followed by 25/25 checks for the final speech and caption repairs. Independent read-only Physics and Camera reviews passed the affected office scope (143 and 98 focused checks). The registration matrix passed desktop, Android portrait/landscape emulation and 320 px reflow, including four counter assignments, the 24-question route, the 52-question detour, fullscreen, badge and A38 handoff. Interactive speech now renders one caption with a compact header. Native Gaussian articulation passed all 15 actors on desktop and portrait Android emulation; that fixture holds stationary work anchors. Atlas articulation passed all 15 actors in desktop, portrait, landscape, reduced-motion and missing-asset cases, including full patron IDs, native recorded time, opaque occlusion and disposal. Grapheme shapes estimate articulation; these silent fixtures do not establish phoneme accuracy or perceptual quality.

Silent hardware-ANGLE benchmarks passed three cold contexts per desktop/mobile viewport for both city startup and direct office entry (12 runs). City startup transfer stayed at or below 16.86 MB against the 18 MB local-transfer gate; title rendering stayed within the 4 Hz allowance and drawing buffers within 1.6 MP. Every run accepted at least eight movement inputs, with no page errors. Worst sampled input-to-render p95 was 377.9 ms. These are local uncompressed HTTP lab measurements, without network/CPU throttling or GPU timing.

Worst sampled warm game-sync frame p95 was 47.6 ms in the city and 23.2 ms in the office. Cold input samples include latency spikes; passing functional/transfer gates does not establish uniformly fast input. The fallback mouth adds one draw and 850 triangles with no additional texture; paired active/baseline CPU submissions are recorded in the lip fixture (GPU timing unavailable).

Input probes hold until a real rendered response or a 650 ms timeout and try alternative headings when collision blocks one direction. A fixed initialization seed (42 plus run index) makes cold contexts repeatable. Frame and latency measurements remain lab observations, not a field-playability claim. Evidence remains in ignored `output/publish-all/` (frozen hash manifests, release test log and native/fallback lip matrices), `output/publish-all/benchmark-root-final/report.json`, `output/publish-all/benchmark-office-final/report.json` and `output/playwright/anmeldung/report.json`. The earlier benchmark report records the short-pulse fixture failure. Physical Android, natural city mission progression, QR/WebRTC pairing, listening, and perceptual temporal cadence remain NOT RUN. The frozen candidate preserves the existing automatic encounters, approved recording-bound omen lips, scene geometry and desktop/mobile control contracts.

**Final room-depth integration, 2026-10-11.** The release incorporates `dc5e8b2` before publication: all office people draw in actor layer 1 after effects, retaining the room's opaque depth and shared near/far sorting. A mouth child copies its actor's layer mask each update. The frozen integration tree `e4155f7f4185c3bb07cb910eb9b3d153636e2aa8` passed the complete 460/460 suite; independent Physics and Camera rechecks passed 19/19 and 42/42, with no geometry, movement or scale delta. Fresh native articulation passed all 15 actors on desktop and Android portrait emulation; fresh atlas articulation passed the five desktop/mobile/reduced-motion/missing-asset cases. The Camera reviewer inspected native actor and opaque-blocker captures and accepted affected C4/C5 and scripted X1 scope. Evidence: `output/publish-all/merged-depth-tests.log`, `depth-native-lips/`, `depth-fallback-lips/` and `candidate.json`. The fixture freezes stationary work anchors and injects controlled speech shapes; it does not establish natural admission or phoneme accuracy.

Six fresh hardware-ANGLE office benchmark runs passed after depth integration, accepting nine inputs per run with no page errors. Maximum office transfer was 30.33 MB, sampled input p95 137.6 ms and warm frame p95 21.8 ms (`output/publish-all/benchmark-office-depth/report.json`). Earlier root measurements are carried forward because the city runtime path is unchanged; root transfer stays within its 18 MB gate, while the office loads additional assets. The final diagnostic-only repair directs `3d.html` to the current exact Merkel clip; its asset-retirement assertion and the three affected voice checks pass. Physical Android, natural mission progression, QR/WebRTC pairing, listening and perceptual lip cadence remain NOT RUN.

## Full mouth opening and recorded timing (2026-10-11)

**Connected lip surface, 2026-10-13.** The shared native/atlas mouth painter uses
a compact paint field with monotone skin transport, attached corners, bounded lower-jaw
support and a distinct contact shape. All 67 native keys own `mouth_angle`,
`mouth_gap` and `mouth_profile` beside `mouth_xywh`; their source specifications
and builder preserve these fields. Each profile traces its own painted corners,
five-point crease, upper/lower source cavity and maximum opening contours,
rounding response and tooth exposure. Shape-preserving Hermite interpolation
keeps the surfaces ordered and corners connected. The same normalized speech
cues drive each pose within its own anatomical limits. The 41 atlas source poses
have separate fitted profiles in `assets/buergeramt/characters/mouth-profiles.json`;
load failure preserves original paint and does not cut a mouth hole.
Each paired endpoint articulates before the existing body transport. Atlas
mouths carry centre and both axes through the actual baked field and texture
crop, including local scale/shear. The 15 office actors share this implementation;
unregistered rear/turn cells retain their original paint. Inactive speech returns
exactly to the source; an owned closed cue also closes a pre-open painting.
Original alpha remains exact, upper-face paint is protected, and pre-open
paintings map their existing interior into one target cavity. Recorded bytes,
cue data, media clocks, body phases, pivots and draw/texture ownership stay with
the existing controllers. The speaking desk receives the existing bounded mobile
paint slot before background clerks. This changes lip contour/attachment; the
existing broader Gaussian midpoint ghosting remains a separate art limitation.

**Individual lip validation, 2026-10-13.** Integrated published `2406224` and
passed all 861 Node checks. The exact GPU matrix covers all 67 native keys and
804 source/inactive/articulated/comparison PNGs; inactive pixels and active alpha
are exact. Production captures cover all 15 instances: 326 desktop native
key/interval/return samples, 103 samples in each mobile orientation, five atlas
scenarios plus failed metadata, and owned closure of all 41 distinct atlas
source poses. Four normal-speed native-recording captures cover Knick and the
Aktenkurier on desktop and portrait emulation, with changing body poses, held
media/cues during pause and cue/owner release on cancellation. These are silent
forced scenes, not natural mission, heard synchronization or verified phonemes.
Source boundaries include the complete painted teeth/corner cavity; the skin
sampling map reaches identity continuously at its protected guards. The existing
whole-face/body blend can still soften or double between anchors.

Independent Physics and Camera reviewers accept the affected mouth/attachment
and scripted C4/X1 scope on the same frozen runtime hashes. They freshly inspect
source, pixels and traces; browser execution is supplied. No remaining mouth-fit
finding is reported. Physical Android, listening, natural mission progression,
full-video watching and perceptual phoneme accuracy remain outside this evidence.

Twenty-four quiet hardware-ANGLE cold contexts compare six root and six office
runs on each side against `2406224`, using the same final asset tree, DPR 2 and
seed 424242. All transfer/title/drawing-buffer/input/error gates pass. Candidate
root transfer is at most 17,933,420 bytes (18 MB gate), office transfer 33,832,114.
Worst sampled input p95 is 28.9 ms root and 46.3 ms office, against baseline 22.5
and 103.3 ms; warm sync CPU p95 is at most 26.5 and 7.5 ms. These local uncompressed
HTTP samples do not establish a speedup, GPU time, listening or physical Android
performance. The source byte additions are in `ASSET-POLICY.md`. Current evidence
is in ignored `output/connected-lips/guard-*` and the independent review folders;
the portable new-character protocol and its instruction-only review are in the
animation skill route in `SKILLS.md`.


The earlier texture-shift mouth caused visible lip vibration without an oral
opening. `buergeramt-mouth-paint.js` now separates the original painted lips
and lower jaw around a bounded, recessed mouth cavity. Native whole-body
Gaussian paint and the 425-kernel atlas fallback use the same shader function.
Mouth centres/radii are registered to each encoded painting, including native
bridge keys. Eyes, props, actor
roots, body bounds, movement, floor pivots and depth ownership stay authored.
Inactive speech returns the original painting. The existing 96-kernel omen
mouth consumes the Aktenkurier's owned shape, including browser fallback.

All eligible office MP3s share the exact-hash cue data in
`assets/buergeramt/speech/mouth-cues.js`. The local analyzer samples sound every
10 ms and records phonetic mouth intervals. The unchanged audio playhead owns
openings, pauses, rate changes and seeking; coarticulation is centred on each
boundary with at most 40 ms anticipation/release. The extra 35 ms visual filter
and text-length timing are removed for analyzed recordings. Cue preparation is
lazy and ready before playback, guarded by the existing watchdog and attempt.
Late preparation cannot start a cancelled speaker. Completion, replay and exit
clear ownership. Reduced motion retains semantic mouth movement.

This sampling resolution does not prove 10 ms German phoneme alignment or
hardware acoustic latency. Phonetic shapes remain estimates. Installed Whisper
independently decoded all existing recordings without prompting; its diagnostic
errors do not rewrite approved catalogue word marks, dialogue or voices. Dynamic
browser speech and optional unanalyzed preview clips retain estimated timing.
**Mouth/render consistency repair (2026-10-11).** `loadAmtSplatModule` supplies
one current, versioned module identity to ordinary office actions and the
Aktenkurier encounter. The nested mouth sampler, cue data and relief asset have
current cache keys as well. Preparation has priority within the existing two-job
queue and survives earlier character conversations, registration and waiting.
The optional automatic encounter waits for preparation to settle before taking
control; genuine failure releases it to the articulated painting. The same
visit/generation cancellation and sorted-body handover remain authoritative.
Recorded cue preparation has a separate 20-second bounded deadline; the
native playback-start watchdog (four seconds for Knick, 1.8 for other voices)
begins when the recording can play.
Slow cue import therefore cannot prematurely select browser speech.

The low-resolution fallback cloud's tiny lip displacement and guessed frame
cycle are retired. During speech, absent native mouth paint retains the original
sprite with its full-opening Gaussian paint rig. Ready native frames use the
shared oral-cavity shader and recorded playhead shapes. The omen relief smooths
depth over 1.6 detail pixels inside the source silhouette and slightly increases
XY Gaussian overlap (face .65, body .68 times spacing). Exact source XY/RGBA,
38,938 body records, 96 oral kernels, transfer size, pivots, scene timing and
collision remain unchanged. This is a small authored relief repair, not a new
model or asset pipeline. Source/CPU, supplied/fresh rendered, emulated-device
and listening evidence remain separate.

**Mouth registration through changing poses (2026-10-11).** Speech no longer
pins sprites to a talk cell while native Gaussian bodies advance. The speaking
clerk's fallback row follows the same requested ready/raised/contact/refusal
action; moving patrons retain their displayed action row/sample. The oral patch
selects the exact work/gesture/look/flinch or clerk detail registration alongside
that crop, and transports it through the existing baked idle field on atlas
cells. Its parent supplies camera-facing rotation, position, scale, layers and
breath. Native mouths articulate both source paintings before their shared
paired transport. All 67 native keys own `mouth_xywh` oral-crease coordinates in
their existing source specifications and compiled animation manifests; the clerk
builder carries them from its anchor/handoff specifications. Nose/chin and
filename guesses are retired. Authored key times still own transport timing.
Here x/y are the oral-crease centre in top-left source pixels and w/h are the
oral patch's half extents, matching `amtMouthPaint`'s normalized source UVs.
Native paint and clouds also retain host nonuniform
scale without restarting their action or media clocks.

E dialogue parks a moving actor in gesture, and its completion schedules return
after `lips.finish`. Spontaneous speech is different: nine ambient lines across
seven roaming actors continue their existing walking routes. The 2026-10-13
audit found that the former blanket walking suppression missed those mouths.
The additive `walking` table now fits 24 individual down/right/left source
profiles and all 240 visible displayed samples; its 80 rear/up samples remain
explicitly null. Exact detail and actual atlas cells have their own measured
centres and full tangent/normal bases in canonical 640 × 832 pixels. Dense
mobile detail uses the corresponding normalized registration. The selected
distance phase and camera-relative view remain authoritative; walking never
uses the unrelated action-idle transport. The omen departure turn follows actual
speech completion, glare and unwind, and keeps its unowned source paint.
This is office coverage, not a general reconstructed face rig. The project and
installed `animate-2d-characters` skill now describe pose registration, shared
ownership, capture-time accuracy and native/fallback transformation checks; its
portable synthetic speech cue is explicitly distinguished from full lip sync.

**Connected surface and exhaustive audit (2026-10-13).** Each of the 67 native
source states and 41 action/idle atlas registrations owns fitted lip corners,
crease, existing cavity, maximum opening, width/rounding and tooth limits.
Five-point shape-preserving interpolation and the cheek guard retain attached
contours. Native endpoints articulate before body transport; atlas mouths use
the source cell's transported basis. Owned closed cues compress pre-open source
cavities. Inactive speech restores the actual painting, including an authored
open expression; that is not a promise of a visually closed rest pose.

The legacy clerk TALK row's baked fill is misplaced beside the real crease.
`clerkPaintFrame` selects the matching unbaked READY breath column before
connected articulation, for all eight talk samples in detail and atlas views.
Its requested frame/cadence and source images remain unchanged. Missing or
partially invalid metadata keeps original paint without a mouth hole. Explicit
inactive/replaced relief ownership suppresses stale legacy omen speech; only
clients that omit authoritative ownership may use the legacy recording fallback.

The audit inventories both directions of every native arc, generated atlas
samples, normal native-media completion and replay/replacement separately.
Former held-Ah/forward-only captures and recordings cancelled before their end
cannot establish those missing cases. Current evidence stays under
`output/connected-lips/audit-all-sequences/`; its inventory also distinguishes
unrigged city/quiz/procedural faces from the office and separate relief/flame
mouth systems. Mouth attachment acceptance does not certify the retained
whole-face/body correspondence softness between some authored paintings.

**Audit follow-up validation (2026-10-14).** The candidate integrates published
`432c240` without changing office art/audio or body, route and media clocks.
The three-view source matrices cover every walking sample, actual action/idle
atlas cell and all native arcs in both directions. Native intervals have 470
sampled positions per viewport, each with opening, closed, wide, round and
contact cues. All 15 instances complete their own normal-speed recording in
native and actual-atlas modes on desktop and portrait emulation; all eight
moving families also complete in walking detail and actual-atlas modes. These
92 cases pass natural end, idle cleanup, held pause, replay and replacement.
Their body lanes are forced fixtures, not natural mission traversal.

Six complete omen cases pass desktop, both mobile orientations, reduced motion,
missing audio and missing splat, including all nine departure-turn samples and
return to idle. Its existing browser-speech failure path remains estimated.
Missing profiles retain original paint; mobile actual clerk requests and
native/atlas admission handoff also pass. The Jobcenter's unchanged recording
now supplies hash-bound closed/open/round/contact cues through the same sampler;
matched current furnace-style captures verify closure without altering its
paired eyes or faster forward pinch. All 878 deterministic tests and 24 quiet
cold browser contexts pass. Camera and Physics receipts and exact resource
comparisons remain in the ignored audit output. These checks cover existing
mouth systems; new JWD painted rigs, unrigged city/quiz faces, retained whole-face
ghosting, physical Android, perceptual listening and exact phoneme accuracy are
outside this acceptance.

**Consistency acceptance.** Independent Physics and Camera reviews accept the
affected office runtime on tree `bfa5efa2d94a9e1d6ea9f0ad19a7b92426648be1`
(base `95f17de`, retaining the published R running shortcut). Physics passes
34/34 final movement/lip/input checks; Camera passes 22/22 focused checks.
The source matrix validates all 67 native mouth registrations and preserves the
other state, arc and source-hash data in all 12 compiled manifests. The complete
native clerk browser receipt covers 36 key/midpoint frames through raise, stamp,
refuse and return, with planted feet, visible native mouths and zero page errors
or console errors. Both reviewers inspect those supplied rendered frames.
Native moving-cast batches supply additional reviewed images, but their later
wait timeouts mean they are not completed all-cast receipts.

The atlas fixture completes all 15 actors on desktop and portrait Android
emulation, with zero page or console errors, including full-opening, rounded,
closed and transformed action poses. Its first desktop capture precedes the
final three stationary default registrations; their corrected pose-only rerun
completes desktop and portrait (three actors each, zero page/console errors),
with rendered faces separately accepted by Camera. The actual Aktenkurier MP3 desktop receipt
passes delayed preparation, earlier-conversation lifetime, pause/playhead
ownership and single-module identity with zero page errors; its 19 browser
warnings include fullscreen gesture, unused preload, shader compiler and
optional WebSocket notices, so this is not a clean-console claim.

The unchanged atlas mouth costs one draw and 850 triangles with no added
texture in the paired frozen-scene probe. The relief retains its record count
and transfer size, and its builder reproduces the shipped binary. Fresh broad
browser batches and the first benchmark attempt also record startup timeouts;
partial runs are retained as such, not counted as passing cases. Evidence is in
ignored `output/consistency/`, including `native-clerk-final/`,
`registered-transforms-fallback/`, `stationary-pose-final/`,
`recorded-current/` and source/test logs. These are silent local Chrome checks;
physical Android, natural mission traversal, listening, hardware audio latency
and measured German phoneme accuracy remain NOT RUN. Brief source-paint
midpoints retain the existing paired Gaussian morph's face softening.

The publication candidate integrates the already published voice/phone update
`8e2570c`: its 53 exact-hash mouth tracks retain 36 prior recordings and add
17 selected-profile Knick recordings after five retired files are removed.
The selected voice and captions-only missing-recording policy stay authoritative.
Cue preparation keeps its separate 20-second deadline; playback uses the
character's native-start deadline and renews a stall deadline only on real
media progress. The mouth/body renderer, registrations, pivots and relief
remain the independently accepted bytes. Synthetic shape probes override the
missing-recording policy only inside the test fixture, then restore the actual
production catalogue for native-media checks. The final office script cache
identity is `20261011-mouth-transforms`; both Gaussian consumers retain the
single current `loadAmtSplatModule` identity.
The complete merged local suite passes 495/495. Independent speech integration
checks pass 106/106 (Physics) and 101/101 (Camera); both confirm unchanged
mouth/body renderer and registered-paint assets. The merged desktop clerk
fixture completes transformed synthetic shapes, retained selected-profile
native playback, opaque occlusion and live Spark handover with zero page or
console errors (`merged-clerk-final/`).
The targeted new `knick-registration-presence.mp3` receipt also completes with
15 actual-playhead samples, exact catalogue selection and zero page/console
errors (`merged-new-knick/`). Portrait Android emulation completes the actual
Aktenkurier MP3, delayed-loading walk, prior-conversation lifetime and pause
checks with zero page errors (`merged-recorded-mobile/`). These remain scripted
silent media checks; they do not establish perceptual or physical-device claims.

The shared builder replaces the earlier omen-only 50 Hz/55 ms implementation
described in the historical articulation record. Reproduction, pinned tool
versions and limits are in `assets/buergeramt/speech/PROVENANCE.md`.

**Rendered acceptance.** Independent Physics and Camera reviews accepted the
office scope on runtime tree `45295804906240f285e7b99a1a6c6b66f9214be5`; both
carried it forward to `2d8058092c04d24c5fb3009e21186011a3eb2d55` after the
published city HUD pointer integration. Physics passed 63/63 integrated checks,
37/37 final speech checks and 17/17 pointer/turn checks; Camera passed 36/36
focused checks and inspected registered faces, feet and opaque occlusion.
The native gallery covers all 15 actors on desktop and portrait emulation;
the corrected clerk registration was recaptured for all four counters. Final
atlas captures pass desktop, portrait and landscape with the same speaking
body key. Earlier reduced-motion and missing-asset coverage carries forward
for the unchanged ownership/shader paths. A silent 25 fps MP3 motion capture
shows closed, partial, rounded and full apertures. Brief phonetic intervals
can still change within one captured frame. The original 41 unchanged recordings passed
real playback, pause, rate-change and cancellation receipts without seeking;
the shared builder reproduces their shipped analysis exactly.
The final integrated deterministic release suite passes 473/473; the deploy
workflow includes the shared eligible-recording cue regression test. The obsolete
omen audio fixture's samples were shortened to remain inside the newly published
1.8-second turn and 2.2-second departure; its planted-turn/retreat assertions
remain enforced.

### Fixed-voice integration verification (2026-10-11)

The final office pack contains 180 exact-path/hash tracks: 36 retained
recordings and 144 selected-profile Knick recordings. The isolated silent
browser fixture passes actual native playback, shape/playhead agreement within
40 ms, pause, 1.5× playback rate and cancellation for all 180, with no page
errors. The fixture now selects the media element belonging to the current
recording rather than whichever unrelated audio element was created last.
It forces the shared dialogue owner to exercise each recording; this is timing
and lifecycle evidence, not natural mission, seeking, listening or physical
Android evidence. Receipts are in `output/mouth-sync/final-recordings/`.

**Office budget.** Six cold hardware-ANGLE runs before and six after the mouth
change compare against published `008b017`. Median warm sync-interval p95 is
21.1 → 21.2 ms desktop and 20.9 → 20.9 ms portrait emulation. Median input p95
is 19.4 → 20.2 ms desktop and 58.4 → 72.4 ms portrait; the worst new cold input
sample is 223.6 ms. All runs accept nine movement inputs without page errors.
Maximum office transfer is 30.47 MB desktop and 17.24 MB portrait, including
the lazy analysis module. The paired active/hidden atlas mouth fixture adds
one draw and 850 triangles with the same 37 resident textures; CPU submission
p50 is 1.9/1.7 ms. This is not GPU/displayed-frame timing or a causal speedup
claim. The later city HUD change leaves the measured office paths unchanged.

Six fresh cold root runs after that integration also pass: at most 16.77 MB
against the 18 MB startup gate, title dispatch within 4 Hz and draw buffers
within 1.6 MP. Every run accepts nine inputs with zero page errors; worst warm
sync-interval p95 is 40.6 ms and input p95 is 44.1 ms. Default startup requests
no authoring files or deferred intro song. See `bench-root-final/report.json`.

Evidence stays under ignored `output/mouth-sync/`: `native-frozen/`, corrected
clerk captures, `smooth-final/`, `recordings-final/`, builder/ASR diagnostics,
reviewer logs and benchmark reports. Tests remain silent, local HTTP lab checks
on Chrome/Intel Iris Xe at DPR 2. Physical Android, natural mission progression,
perceptual listening and measured German phoneme/hardware latency accuracy
remain NOT RUN. Cue interpolation and actual media receipts establish timing
ownership; they do not establish those perceptual/device claims.

### Smartphone call spoof and salient interference

The smartphone call overlay imitates ordinary incoming/active-call behavior only: unknown caller, local status clock, platform-style Answer/Decline, elapsed time from Answer, and a red Hang Up control. It contains no police transcript, subtitle rail, pairing/connection status, tutorial or game explanation. Police captions belong only to the desktop game and remain receipt-owned. Call chrome uses the existing German/English phone language. The bounded viewport layout reflows its caller and measures labels with the locked Pretext runtime; it has no internal scrollbar at the supported desktop/Android, 320-pixel and 200% zoom sizes.

The host commits the existing 900 ms pre-ring interference once for the current call. Its six 217 Hz bursts use a 0.16 envelope peak (formerly 0.052, about +9.8 dB) plus a 2400 Hz bandpass crackle at 0.28 source amplitude through the same envelope. It uses the existing signal/effects level and room ducking, begins before the scheduled phone ring and stops at ring, answer/decline, exit or replay. There is one oscillator and one 320 ms looping noise buffer, stopped/disconnected together; no downloaded audio or new scheduler. Phone speech/static retain their existing foreground mix. Hanging up immediately stops speech, ring, static and the elapsed timer, then plays a handset clunk and empty-line tone before reporting completion to the host. Knick delivers the final dismissal, and the cancelled appointment ejects the player without A38. Silent state/render checks establish behavior, not perceived loudness or a physical-phone listening result. Physics/Camera reviews are outside this change because world, movement, animation and camera seams are unchanged.

### In-scene dialogue integration verification (2026-10-12)

All 107 authored player answers use the saved Nachschub player profile. All
168 current Knick utterances have exact selected-profile recordings, including
the approved fever refusal. The public main manifest retains one unused
historical request as held; it is outside the current dialogue target. The
voice protocol and manifests own source, native EOS, edited delivery and the
three explicit complete-file segmented recognition receipts. Media URLs carry
the current encoded SHA; caption and mouth ownership retain canonical paths.

The shared mouth pack contains 206 exact-path/hash tracks and 476,626 LF
bytes. The build reused 178 matching tracks and analyzed 28 final MP3s; full
reuse verification passes. A silent native-media fixture passes onset,
shape/playhead agreement, pause, 1.5× rate and cancellation for all 206 with
zero page errors. Fresh desktop and Android portrait emulation pass the real
button → player answer → Knick reply → next question sequence, including
native ends, no overlap, exact captions and current bytes. The player has no
clerk mouth; Knick uses the recording-bound cues. Seven previously verified
readability cases, zoom/text-spacing probes and manual fresh-QR navigation
carry forward because layout and world sources remain frozen.

The complete Node suite passes 535/535; Python/JS authoring gates pass 9/9.
Six cold root runs (three desktop and three Android emulation) pass the
18 MB startup, 4 Hz title dispatch and 1.6 MP buffer gates. Maximum local
uncompressed startup transfer is 17,276,196 bytes; each run accepts nine
inputs with zero page errors. Worst warm sync-interval p95 is 22.1 ms and
input p95 is 39.7 ms on hardware ANGLE/Intel Iris Xe at DPR 2. These are
lab observations, not displayed-frame or physical-device guarantees.

Evidence stays under ignored `output/amt-inline-final-*`,
`output/playwright/amt-inline/`, `output/mouth-sync/amt-inline-final-recordings/`
and the independent Physics/Camera carry-forward receipts in
`output/amt-inline-final-carry-forward/`. Browser entry, movement and queue
are scripted; signaling is simulated. Physical Android, natural QR/WebRTC,
natural mission traversal and perceptual listening remain NOT RUN.

### Four-call release validation (2026-10-13)

The integrated four-call candidate passes 713 Node tests, exact catalog and
inventory checks, and the independent causal review. All four new recordings
pass silent native-media onset, playhead/shape, pause, 1.5x resume and cancellation
checks on desktop and Android portrait emulation. The mouth pack adds four
hash-bound tracks; all 225 previous tracks are unchanged (229 total, 513,368
bytes). Independent Physics and Camera reviews cover this narrow mouth
lifecycle scope; geometry, movement, camera, depth and scale are unchanged.

Phone chrome passes desktop, portrait/landscape Android emulation, 320 CSS px,
200% zoom and increased text spacing; both root and diagnostic entries pass
desktop/mobile smoke checks. Six final cold browser benchmark runs pass the
existing gates: maximum local uncompressed startup transfer 17,876,838 bytes,
input p95 at most 46 ms, sync-interval p95 at most 38.1 ms. The paired source
baseline and candidate use the same silent headless focus emulation; these
measurements do not establish a causal speedup or physical-device performance.
Evidence lives under ignored `output/four-calls/` and
`output/playwright/phone-illusion/`. Phone signaling and dialogue entry are
scripted. Physical Android, natural QR/WebRTC pairing, natural mission traversal
and perceptual listening remain NOT RUN.

### Persistent ringing and Kripo ending (2026-10-13)

The phone synthesizes only `Spricht hier [name]? Hier ist die Kriminalpolizei am Apparat!` directly inside Answer, retaining its utterance until completion and allowing six seconds for native startup. The exact prerecorded `call.body` follows even if synthesis fails. Both parts share police cue -1, one first-onset receipt, one final completion and one full desktop caption. Fixed police dialogue uses recordings with bounded caption fallback; no Knick name model supplies the Kripo voice. Static starts at Answer and stays through all turns and gaps.

Natural final police completion and user Hang Up both stop speech/static and play a 120 ms filtered handset clunk followed by a 425 Hz empty-line tone, ending at 1.86 seconds. Role-validated current-call `call-end`/`call-ended` messages carry the ending; four-second phone and six-second host bounds release missing/suspended audio without claiming it played. Knick then says exactly “Was stehen Sie so tadellos da?! Raus!!”. Her native completion or caption fallback ejects to a body-clear point on the existing Bürgeramt entrance path/front pavement, sets five stars, and gives no form. Closing/replay invalidates all ending callbacks and sources.

A current visible unanswered call never expires by itself. Its accepted reveal schedules the first reaction; continuing ringing schedules later warnings every twelve office-tempo seconds. Decline, answer, confirmed hiding or connection loss cancels continuing pressure; stale/repeated reveal receipts cannot add warnings. The first three resume the existing question. The fourth commits cancellation, stops the phone and speaks “Jetzt Reichsadler! Raus!” before immediate ejection. Physical E/touch re-entry opens a fresh office attempt and pairing invitation; city progress and wanted level persist. The direct office shortcut now resumes the actual city with its existing procedural building/traffic stand-ins, whose GLTF loader was intentionally omitted at shortcut startup.

**Validation of the ending revision.** The full deterministic run covered 753 checks; three obsolete expectations were corrected and the final 177 affected checks pass, including returned-page pressure and synchronous ending receipts. Independent Physics and Camera reviews pass the frozen world/cue candidate. Silent paired browser checks pass a full native Kripo conversation, mobile Hang Up, and four native warnings from one unattended ringing call on desktop and Android portrait emulation. All three new Knick tracks pass native onset, playhead/mouth, pause, rate and cancellation probes on both viewports. The real renderer returns to the street and accepts E re-entry in desktop, portrait, landscape and loaded-city cases; that fixture seeds the completed office callback. The existing landscape city HUD can obscure the arriving player and also reproduces on baseline a8529205; it is not changed here.

Six release cold-start lab runs pass the 18 MB transfer, 4 Hz title dispatch, 1.6 MP drawing buffer and eight-input gates: maximum 17,889,605 bytes, nine accepted inputs per run, zero page errors, worst input-to-render p95 25.5 ms. Baseline input had an outlier during concurrent checks, so no performance-improvement claim is made. Evidence remains in ignored `output/kripo-ending/`, `output/kripo-ejection/` and `output/playwright/phone-illusion/`. Signaling/counter admission are fixtures; physical Android, real QR/WebRTC pairing and perceptual listening remain NOT RUN.

### Personal appointment announcement

A valid name captured in the opening form is prepared before arrival; if absent, preparation starts at the companion registration. The local inference contract, intercom-only listening acceptance and training identity are owned by `VOICE-SYNTH-PROTOCOL.md`'s browser-local appointment-name section. Reservation code, assigned counter, exact ticket receipt and independent visitor ownership stay authoritative.

A reservation whose audio is still preparing moves to a later turn at the same counter. Its board call and ordinary call-window deadline begin only after preparation succeeds or reaches a terminal fallback. A received personal call gets its own allocated clerk, exact visible name/counter and English translation; it bypasses only the ordinary rare anonymous-call cooldown and shares the existing foreground speech owner. A valid late ticket receipt can still announce within the remaining call window. Retirement, replay and superseding cues stop/release their exact media; stale synthesis cannot attach to a replacement ticket. Muting retains the personalized caption and board call. Unavailable synthesis plays the existing recorded “Nächste bitte!” with matching text at the allocated counter.

