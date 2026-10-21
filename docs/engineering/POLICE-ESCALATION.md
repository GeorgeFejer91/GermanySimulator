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
- [x] Author 24 original paired monologues, cast ownership and fixed-voice
  generation with encoded word/hash/level/mouth checks. Run curator --check.
- [x] Generate equipment-tier source art, inspect sources and exact animated
  exports, integrate demand-loaded sprite consumer and failure fallback.
- [x] Silent actual game browser checks: desktop and Android portrait/landscape,
  warning/payment/arrest, attempted early skip, voice fallback, pause/resume,
  repeated arrest, selected artwork, memory/loading and rendered label fit.
- [x] Freeze candidate hashes; independent Physics and Camera/Scale reviews
  on the same candidate; repair findings and rerun affected rows.
- [x] Run complete required release checks, review the combined diff and commit
  the coherent candidate. Publication and deployed-URL checks follow below.

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

Runtime and art were checkpointed at 11d2ab6, integrated with published
2c48edd at c87e21e, then with published 99cd9ef at 1ca2453. This preserves
ordinary Inga coaching and ambient character animation. Isolated regression
fixture repairs are committed at 6f5ca46.
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
physical Android and unrelated camera rows remain NOT RUN. The final P8 integration checks pass shared speech clocks, modal animation,
pedestrian recovery, portrait renderer restoration and integrated police/home
behavior. All 75 frozen source/asset/catalog hashes match both specialist reports.

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
smoothness. Fresh final measurements pass at 16,513,941 desktop and 16,127,523 mobile
startup bytes, nine accepted inputs per run and zero browser errors. Police
atlases remain deferred at boot. These two software-rendered runs make no
physical-device smoothness claim.

## Release validation

The clean full Node run passes 2,379/2,379 checks; Python discovery passes
102/102, with the separate office/quiz authoring suites passing 12/12 and 7/7.
The subsequently published Heike mouth-axis fix b34b4ce is also preserved; its
two focused regressions pass. Camera independently verifies that it changes
only mouth-axis metadata/hash bindings, while all 75 P8 pins, geometry, footprint
and shared renderer logic remain unchanged.
The initial failures exposed missing copied curator imports and a test's assumed
ignored output folder. The fixtures are self-contained now; full clean reruns
pass. Curator consistency, ordinary neighbor coverage (114/114) and the new
supplement audit (26/26) all pass. The site builds 31 direct level pages.

Exact P8 silent browser receipts pass core2, art2, recorded/fallback4, all72
reading-layout rows, and built-site startup/input/lifecycle9 across desktop,
Android portrait and landscape emulation. The Camera specialist's separate
live portrait/renderer restoration/shared-police-load proof passes2/2.
Physics verifies 100 legal/crowded waiting cases, 8,915 legal route substeps
and six late-blocker probes. Both final scoped specialist reports are PASS.
Earlier layout/device proofs transfer only where the reported sources remain
unchanged. Physical Android and perceptual listening remain NOT RUN.

Reports and source pins are retained in the task's private
output/police-escalation evidence; selected-reference authoring proofs and held
experiments are archived separately in the private Music production library.
No reference audio, model weights, private native inputs or local test output
are part of the published package.

The integrator publishes this coherent candidate to origin/main under the
standing policy, watches the Pages deployment, then verifies the unmodified
public root and 3d.html compatibility entry against the built runtime and new
assets before closing the active goal. The observed deployed commit, workflow
and public-entry result are recorded in that goal's completion response; local
checks alone do not establish publication.
