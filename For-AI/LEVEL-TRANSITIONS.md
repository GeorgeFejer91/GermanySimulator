# Building level intros and outros

This document owns the shared building transition protocol. `GAMEPLAY.md` owns
missions, `BUERGERAMT.md` owns its story, and `ASSET-POLICY.md` owns performance.
The canonical runtime stays at the repository root. Every event inside a building
belongs to that building's level, including dialogue and paperwork.

## Three transitions

| Cause | Required arc | Completion |
| --- | --- | --- |
| Enter a building | Its real hinged door opens. The surrounding city breaks into source-coloured Gaussian particles and spirals through that aperture. The destination stays intact until the surroundings have disappeared, then decomposes into its own doorway last. | Activate the interior only after the complete collapse. |
| Forced ejection | Begin at the actual current first-person position, yaw and pitch. Open the interior entrance and rapidly pull the view on one continuous arc back through the scene and that original doorway. Rebuild the exterior by playing the same vortex backwards: destination first, surroundings afterward. Close the exterior door and release control. | Commit the existing dismissal/cancellation consequence once on crossing the portal; keep city input and simulation gated until reconstruction ends. |
| Voluntary leave | E at an accessible interior exit, its touch target, an existing Leave action, Escape where supported, or ordinary successful completion. | Immediately return to a body-clear point in front of the same building. No vortex, camera flight or flames. |

The angry flame's ejection engulfs the view in fire during the pull. This variant
uses the same arc and reverse vortex as every forced exit; it never becomes a
separate outro. The Bürgeramt's punitive phone dismissals also use this fiery
ejection. Preserve their authored speech/phone ending before starting the pull,
their five-star consequence and refusal of A38. Jobcenter native media completion
or its bounded readable failure completion starts the same fiery ejection.

Normal completion, a cancelled form or the player's Leave action must never be
classified as a punitive ejection merely because the scene is closing.

## Update and presentation ownership

The root simulation loop calls `Germany3D.update(dt)` once per accepted frame.
`building-levels.update(dt)` advances owned transitions and commits consequences
once; `render()` projects that state. Draw failures record recovery for the next
update. Hidden/paused frames do not advance these clocks. Jobcenter likewise
owns movement, media fallback and completion in `update(dt)`; its `exitView()`
projects the latest accepted pose before an exit capture, even without a draw.
The renderer's separate presentation delta remains available for current street
paint. Pass only held-input/clear-input commands into encounters and the existing
clear-input command into the transition owner.

## Doors and level registration

Every building/structure owns a visible door, including loaded models, procedural
fallbacks, houses and industrial structures. `world3d.js` mounts `createLevelDoor`
on the real facade; loaded Bürgeramt fitting updates the same entrance. Keep the
physical entrance, interaction target, vortex focus and return path registered.
Do not draw an unrelated centre-screen portal. Door leaves rotate about their
hinges and reveal a black aperture. Interior doors share this geometry, including
the black Jobcenter's original entrance. A sealed structure's door does not grant
access to a new level.

- `level-transitions.js` owns hinged doors, available at boot.
- `level-transition-effects.js` owns staged clocks, the ejection camera curve, common GPU vortex,
  flame variant and shared room. Load these indoor-only factories on the first
  transition, keeping the title transfer bounded; a pending import holds the
  owned clock and input gate. A cancelled request cannot reopen a prior visit.
- `building-levels.js` owns one transition attempt, input/visibility gating,
  interior-to-city handoff, cancellation, reduced motion and cleanup. Its small
  shared office room provides the background for existing dialogue/form levels.
- `world3d.js` supplies the existing renderer, city/indoor scenes, fitted building
  bounds and entrance, and runs the owner from the existing frame loop.
- `game.js`, `buergeramt.js` and `jobcenter.js` remain authorities for input,
  natural prerequisites, speech/media receipts, dismissal, rewards and safe
  exterior placement. Rendering must never grant a form or change a mission.
- `buergeramt-entry.js` is a compatibility adapter to the same vortex. Do not add
  another episode-specific transition renderer.

For a new indoor level, supply its stable building ID, actual interior view,
interior entrance door and render callback. Use `Germany3D.enterBuilding` for
ordinary office rooms, or the same shared entry owner with the episode's existing
scene. Route every exit through `Germany3D.leaveBuilding(id, {mode, onReturn,
fire})`; the only modes are `voluntary` and `eject`. The caller freezes its own
controller and invalidates old speech/media/phone callbacks before an outro,
then performs its existing teardown and consequence in the owned `onReturn`.
Never animate from the initial spawn view when the player has since moved or
looked elsewhere. Ordinary locomotion retains collision; the forced camera
flight through scenery is an explicit cinematic exception and never moves the
grounded city body through solids.

Outdoor scenes, the JWD porch and neighbor tours, Stadtbild's street work,
monuments and street conversations remain part of the exterior level. They do
not receive artificial building intros/outros. Entering the Stadtbild office
uses the common indoor rule. Houses have doors even when their current gameplay
is entirely on their porch or lawn.

## Lifecycle and motion

One attempt owns the completion receipt, including while its scene module loads.
Reject duplicate entries/exits; an old
completion cannot close a replayed level or grant another reward. Clear held
keyboard/touch input at acquisition and release. Hide ordinary HUD, subtitles
and controls during the transition; restore their existing owners afterward.
Freeze city and interior simulation for the arc. Hidden pages and pause stop its
active clock without wall-clock catch-up. BFCache/context suspension releases
GPU surfaces; restoration completes the already committed travel once. Replay
cancels the old attempt before opening a new one.

Full entry opens the door for 0.42 seconds, followed by the 3.4-second shared
vortex. Surroundings finish before normalized collapse 0.70; destination particles
start at 0.74 and finish by 0.985. Forced exit uses a 1.05-second camera pull,
the same 3.4-second vortex in reverse and a 0.28-second door close. These are
shared values, not per-level tuning knobs. Reduced motion uses a 0.24-second
fade with no flight, swirl or fire. Enabling reduced motion during an arc ends
its motion immediately and completes the owned travel. Rendering failure keeps
direct travel and exactly-once game consequences.

## Acceptance

Run `node --test tests/level-transitions.test.mjs tests/building-levels.test.mjs`
and the affected episode/mission/return-position suites. Run
`node tools/playtest-building-levels.mjs` in an isolated silent browser. Capture
door opening, surroundings peeling away, the intact destination, its final
collapse, a forced exit from a changed view, flames, reverse reconstruction,
ordinary leaving and re-entry. Cover desktop and Android portrait/landscape
emulation, reduced motion, resize, hidden/resume, failure and repeated visits.
Label forced scene fixtures, real production input, native-media receipts and
physical-device evidence separately. Numerical/source checks cannot certify
the rendered particle illusion. Apply both independent world reviewers from
`OBJECT-CONSISTENCY.md`; keep any required missing device evidence outstanding.

The vortex uses the current visible colour/depth surfaces. It transports those
surface samples in 3D with Gaussian alpha kernels and preserves the target's
actual bounds for the final stage. It is a visible-world decomposition illusion,
not a trained reconstruction of hidden sides. Do not add Spark, another renderer,
precomputed splat assets or CPU pixel readback for this transition.
