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

## Acceptance evidence

Runtime and art were checkpointed at 11d2ab6, then integrated with published
2c48edd at c87e21e. The final release must also integrate newer published main
99cd9ef, including ordinary Inga coaching and ambient character animation.
The dirty primary checkout remains untouched.

The implemented causal chain passes focused contact, exactly-once payment,
body-clear home return, unregistered return, all three adult routes, late-blocker
standoff, stale callbacks and early-input regressions. Review found and repaired
silent-broker expiry being mistaken for recorded completion, a crowded-porch
route trap, a late-blocker route-prefix rejection, a retired shared-texture host,
and hidden-tab playback consuming the punishment. P7 retains actual-media
completion and an owned AudioContext suspension that other resume callers honor.

Silent staged core checks pass desktop, Android portrait/landscape and reduced
motion in core-P5; integrated painted pursuit/contact checks pass four profiles
in art-combined-final. Art checks cover eight male/female variants, four equipment
tiers, shared textures, actual displacement, warning/ticket holds and final
resource release. All 448 exported cells were inspected at desktop/mobile size;
the art record owns encoded bytes, source paint and animation details.

Independent Physics and Camera reviews pass the affected P7 scope. Unchanged
geometry, scale, alpha/depth and route proofs are explicitly transferred;
physical Android and unrelated camera rows remain NOT RUN. Incoming main changes
require narrow fresh checks of shared speech clocks, modal animation, pedestrian
recovery, portrait renderer restoration and integrated police/home behavior.

Actual admitted Heiko playback and failed-file reading fallback pass all three
layouts in speech-focus-final. Fresh recorded-pause checks pass in
speech-pause-verified. Both new warning/payment recordings pass natural-media
completion and exactly-once payment on desktop and both Android-emulated layouts
in speech-browser/run-1792553252551-40392 and police-contact-speech-mobile.
Actual new Inga01 and Schwabingen01 pass desktop recorded delivery, mouth energy,
hidden/HUD pause, early-input lock and release in new-neighbor-speech (2/2).
These are state-checked silent sessions, not perceptual listening.

All 24 current authored texts remain fully reachable in the actual locked panel
at 320px width, 200% CSS zoom with enlarged type, and landscape with expanded
spacing: 72 source-bound rows in reading-source-bound. This uses diagnostic
corpus replacement; it does not represent 24 natural dialogue deliveries.

Voice supplements retain eight owned German/English monologues per neighbor and
two separate Heinrich encounter lines. The exact selected profiles remain
unchanged; actual complete literal reference excerpts are declared per native
leaf. Heiko and Inga require encoded-word qualification, including the exact
same-MP3 complete-window proof for Inga02. New exaggerated Swabian recordings
require explicit ROOT source/dual-recognizer clause review, preserving actual
transcripts, nonliteral flags and recognition uncertainty. The sole final08
net/nett homophone is bound to its exact source/take/span and the other actual
recognizer's explicit negative clause; it cannot waive another lost negation.
Failed takes and private authoring inputs remain archived, and unused new parts
production is excluded from the shipped workflow. See the voice protocol and
NEIGHBOR-DIALECT-COVERAGE.md for the finite proof contracts.

The earlier six-run startup budget check passed with zero browser errors and
no police atlas loaded at boot. Software-rendered timing was slow under host
contention; it establishes asset/input budgets rather than physical-device
smoothness. Final catalog and main integration need fresh bounded budget checks.

## Release validation

Pending: freeze the complete 26-file voice catalog, integrate current main,
repin the combined candidate, finish narrow independent integration review,
run complete deterministic checks and built-site browser checks, then publish
and verify both public entry URLs. The goal remains active until those pass.
