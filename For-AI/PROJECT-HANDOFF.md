# Current combined release candidate — 19 October 2026

## Merz audio update — 20 October 2026

Integrator-owned scoped successor from published `4362d88`: six supplied MP3s
integrated in `codex/merz-audio-clips`, five new lines plus the stable Spinner
replacement, 16 Merz lines total. Exact German/English catalogue ownership,
normalized encoded hashes/ASR and eight monologue cue intervals are pinned in
`assets/voices/merz/manifest.json`. German source cues now follow the same audio
clock as English cues. Script query versions invalidate the changed catalogue
and runtime; the existing hash query also invalidates the replaced MP3.

Full Node suite, curator and post-version focused checks PASS. Isolated silent
desktop/Android-emulated Chromium played all six files to native completion;
desktop's 40.2-second monologue ran at normal speed, with mid-line caption and
live language checks. Short cases used accelerated native playback. Both profiles
passed direct dialogue, voice-off, missing-file exact-caption fallback and zero
startup Merz requests; inspected desktop/mobile DE/EN captions remain readable.
Evidence is under the attached `merz-audio-clips` worktree's ignored
`output/merz-audio/` (`browser-report.json`, `fallback-report.json`, normalized
source/ASR receipts and screenshots). Early fixture failures retain their scope:
the route initially missed the game's query string, then expected an actor field
absent from featured barks; production code was unaffected by those fixture fixes.
Physics/Camera reviews are omitted because this change affects speech assets,
catalogue data and caption timing only, without world/geometry/animation changes.
Perceptual listening and physical-device checks remain NOT RUN. The wider game's
deferred scope remains unchanged. Publication: validated scoped successor ready
for normal push to `origin/main`, followed by Pages and root/compatibility checks.

## Prior combined release context

George requested integration and publication of all completed pending development,
with actual browser verification. The integration checkout is
`C:/Users/cogpsy-vrlab/.codex/worktrees/neighbor-dialogue-release/GermanySimulator`.
The integrator owns acceptance and publication through origin/main; workers do not publish.

The combined candidate includes the pending pedestrian/paving/mouth work,
station access and optional painted ground projection, office/quiz authoring support,
neighbor focus and dialogue tickets, and the completed selected-profile neighbor
voice pack. All **110 active-neighbor lines** resolve to owned recordings:
Heiko 36, Inga 34, Frau Schwabingen 33 and Hartmut 7. Ede remains archived.
Heiko retains the approved professor profile; the final two German sources and
subtitles use “Ich sage es” and “ich habe”. Prior rejected takes remain private.

Current evidence under the primary checkout's ignored `output/`:

- `publication-all-2026-10-19/all-node-tests.json`: **2161/2161** Node checks
  pass across 206 files, with no failures or skipped checks.
- `publication-all-2026-10-19/browser-110-decode.json`: an actual isolated,
  silent browser fetched and decoded all 110 neighbor MP3s with matching hashes,
  selected profiles and durations; zero recorded errors, police and wanted level.
- The same browser run started all four speakers. Heiko redraw/language changes
  retained one ticket and media clock; natural audio completion cleared his
  caption. Inga and Schwabingen ended once; Hartmut was intentionally cancelled.
- `voice-completion-2026-10-18/integrity/fuller-form-final36-byte-review.json`:
  independent final voice byte review passes. The curator and 110-source default
  coverage check also pass; no model processes remain.

The rendered Irmgard sample covers 17 seconds, 67 observations and all 16 painted
frames. Camera acceptance is limited to the inspected frames. Responsive caption frames pass at 390x844, 844x390 and 320x640 CSS viewports.
The forced final-counter diagnostic resumes on a simulated hidden-phone receipt,
awards 10/10, enables A38 collection and reaches the completed result after form submission. This does not establish the
full natural mission/restart matrix, physical Android behavior, perceptual audio
quality or whole-game animation/performance acceptance. 3D pose accuracy remains
user-deferred. Keep these limits in the release report.

Publication procedure: review the coherent combined diff, commit and push through
the single integrator, then verify the deployed root,
`3d.html` and affected direct routes. Keep private references, model files,
rejected takes and generated evidence outside the published tree. The current
catalog and owning manifests define asset identity; older counts below describe
their original checkpoints.

## Historical handoff — 18 October 2026

Read the opening of the standalone [detailed TXT](./PROJECT-HANDOFF-DETAILED.txt).
It supplies current source pins, remaining tasks, exact script/tool paths,
verification criteria, nested skills, ownership and the complete mission/cast
manual. Historical cards remain clearly subordinate to that opening.

The handoff is complete; the game remains unfinished. Canonical integration is
`C:/Users/cogpsy-vrlab/.codex/worktrees/canonical-game-entry/GermanySimulator`.
Preserve local game `f653775e` and newer neighbor/paving/mouth work. Never copy
runtime from the dirty primary or older street worktree over canonical files.

The neighbor owner finished its local checkpoint. Street/voice source **V6** is
also handed off separately. Both need remaining integrated acceptance. The latest
P3 attempt stopped on a welcome-button browser-control error before staging or
movement; minus was not run. V2/V3 admissions are consumed and cannot be replayed.
Owned tab/server are retired and viewport reset. Chrome remains untouched.

The native accessibility control proposal passes **17 unit checks**, but is
uninstalled and untested in a native browser. The next bounded implementation is
its independent UI-fixture check and new successor integration/source review,
before any fresh, properly admitted game capture. No replacement game renderer
or browser framework is needed.

Remaining: actual walking/crowd/painted-art acceptance; natural mission and all
33 restart routes; missing character assets and recordings; desktop/mobile,
physical-device, audio and performance coverage; reconciliation and validated
publication. **3D pose accuracy remains deferred. Runtime publication HOLD.**

This documentation-only closeout does not accept or release held runtime.
Private ignored evidence under `output/` needs separate authorized recovery on
another PC; Git does not contain it. See the TXT for every exact resume route.
