# Police escalation and neighbor punishment

Goal: replace automatic police transfers with a warning at one star, a payable
fine at two, and arrest at three to five; produce animated male/female police
equipment tiers and 24 researched, character-specific voiced neighbor lectures.

Task owner: this document; integrator owns game.js, world3d.js and acceptance.
Worktree: police-neighbor-escalation, based on published 21ebceb8. The former
canonical-game-entry directory no longer exists. Architecture release 4362d88
is an ancestor of the current published main. Primary dirty art/runtime work
is preserved. Checkout encountered a corrupt unrelated Codex capture ref after
updating its new worktree/index; the integrator completed only this new
worktree's HEAD update to the exact selected published revision. No old work
was discarded. A later fetch was blocked by a malformed cloud-sync name-clash
capture-ref path. Its exact base file and tree hash were preserved outside
`refs/` in `.git/codex-ref-quarantine/police-2026-10-21/`; fetch then succeeded.
No primary working files or valid refs were changed by that metadata repair.

## Design and decisions

- One star: officer stops/chastises the player, lucky-day warning, no relocation
  or energy penalty. Two: €35 Verwarnungsgeld, explicitly paid through the
  dialogue action once. Three or more: arrest, clear wanted state, wake outside
  the existing home. Stars are satirical game thresholds, not legal doctrine.
- Reuse the existing speech broker, modal, collision, neighbor routes and
  renderer. Payment uses a fictional €100 account with an overdraft so repeated
  fines cannot softlock the mission; receipt shows balance. No new money grind.
- Arrest does not grant registration, keys, visits, introductions, forms or
  mission rewards. Porch placement searches body-clear ground. Upon trying
  to leave, one selected neighbor approaches along the existing paved routes;
  player movement waits, then their complete monologue owns attention.
- Each of Heiko, Inga and Frau Schwabingen owns eight German/English paired
  stories and their existing selected voice. Shuffle role and story bags,
  avoid immediate repeats. Exactly one lecture per arrest, independent of
  existing tours. Completion returns the neighbor and releases movement.
- Locked lectures use actual media completion; failed/disabled voice uses
  a full-length reading fallback. Hidden/paused sessions stop the clock.
  Duplicate/stale callbacks cannot release another arrest's punishment.
- Police use patrol (1–2), protective (3), riot (4), heavy (5) painted variants,
  male and female, with displacement-driven movement, shared textures,
  transparent gutters, stable feet and demand loading. Existing 3D fallback
  remains until ready or on failure. No firearm combat is introduced.

## Plan and acceptance

- [x] Research official warning/payment/arrest distinctions and uniform sources;
  open Reddit anecdotes; preserve source ledger and fictional embellishments.
- [x] Add regression cases for 0/1/2/3/5 contacts, exactly-once payment, cooldown,
  body-clear home return, unregistered return, lecture gating and cancellation.
  Implement smallest controller change; rerun affected police/neighbor tests.
- [ ] Author 24 original paired monologues, cast ownership and fixed-voice
  generation with encoded word/hash/level/mouth checks. Run curator --check.
- [x] Generate equipment-tier source art, inspect sources and exact animated
  exports, integrate demand-loaded sprite consumer and failure fallback.
- [ ] Silent actual game browser checks: desktop and Android portrait/landscape,
  warning/payment/arrest, attempted early skip, voice fallback, pause/resume,
  repeated arrest, selected artwork, memory/loading and rendered label fit.
- [ ] Freeze candidate hashes; independent Physics and Camera/Scale reviews
  on the same candidate; repair findings and rerun affected rows.
- [ ] Run complete required release checks, review combined diff, commit/push
  according to standing publication policy, verify Pages root/3d.html.

Physical Android and perceptual listening must be reported separately from
emulation and silent media state checks. Never mark missing evidence PASS.

## Causal map

Officer contact + wanted tier + contact cooldown -> one encounter owner ->
warning acknowledgement / payment acknowledgement / arrest -> response clears.
Arrest -> body-clear porch -> pending story identity -> exit attempt -> paved
neighbor approach -> owned locked speech -> actual done or readable fallback ->
same attempt completes -> return neighbor -> controls resume, no mission credit.

Research owner: [source ledger](POLICE-NEIGHBOR-RESEARCH.md).
Artwork owner: [art record](POLICE-ART.md).

## Current evidence and remaining work

Core technical review found and reproduced two P1 defects: silent broker expiry
was mistaken for recorded completion, and a crowded-porch fallback could leave
the fixed gate out of reach. Both are repaired with broker delivery metadata and
existing-path admission to the actual waking point. Fresh delivery regressions
4/4, contact/ticket/audio checks20/20, and named arrest/occupied-porch cases2/2
pass. Technical reviewer also drove all three adults from the ordinary porch.
The old police-escalation response/asset tests are preserved byte-for-byte; new
contact cases live in `tests/police-contact.test.mjs`.

The Physics reviewer found one additional late-blocker trap during approach.
The existing detour now accepts a collision-checked prefix that reaches the
listener's lecture standoff; it no longer rejects that usable prefix because
an unused final route segment would touch the listener. Six blocker/dt/side
regressions pass. Candidate P3 pins 35 runtime/art files in local evidence.

Fresh P3 core browser checks pass desktop, Android portrait and landscape
(`physics/core-P3/report.json`). The integrated police paint suite passes all
four profiles, including reduced motion (`art-browser-final/report.json`):
eight variants, four tiers, real pursuit frames, planted warning gesture,
held displacement and final texture release. Independent GPU tests cover alpha
depth, camera-facing orientation and decode/failure lifecycle. Physics P1–P5
and affected browser X1 pass in `physics/REVIEW-P3.md`; the camera review is
finishing. Screenshots with a hidden touch dock are labeled diagnostics.

The broad Node regression run passed 2,232/2,237. Three isolated fixtures/old
police-rendering expectations have been corrected and pass their focused
rerun; two catalog count tests are being updated for separately admitted
punishment recordings. Voice generation remains in progress, with exact source,
reference conditioning, encoded words, loudness and mouth cues checked per take.
The first two corrected-reference Heiko takes are admitted. No full completion
or publication is claimed until the full voice inventory and release checks pass.
