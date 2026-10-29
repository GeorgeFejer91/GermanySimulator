# Current combined release candidate — 19 October 2026

## Painted sprite depth release — 29 October 2026

This scoped successor starts from published cursor main `5215712e` in
`C:/Users/cogpsy-vrlab/.codex/worktrees/sprite-depth-release-2026-10-29/GermanySimulator`.
It ports only the requested sprite-depth repair from the older primary candidate;
the primary checkout and its held feature work remain preserved. The current
published renderer, speech material cloning, native adult figures, cursor, static
architecture and query/hash-preserving `3d.html` redirect remain authoritative.

The maintained protocol is [Painted sprite depth](./OBJECT-CONSISTENCY.md#painted-sprite-depth-protocol).
Camera-facing city atlases, procedural fallback paint and neighbor handovers use
an upright depth plane through the simulation sole while retaining their visual
geometry, UVs, mouth shaders and feet. Refit geometry and private speech materials
receive the same policy. Native upright street/police paint and articulated bodies
keep their existing geometry. Solid office paint and props write alpha-rejected
depth inside the existing room/pass ownership; Spark ownership is unchanged.

Fresh evidence belongs in this worktree's ignored `output/sprite-depth-release/`.
Candidate 2 freezes 19 source/contract paths; both independent specialists rebind
to these hashes. The procedural fallback regression fails before repair and passes
after it, using the actual source paint and production transform. Isolated VM tests
now bind the real helper. The city fixture's stale police height changes from
1.56 to the already-published 2.33 m with its original tolerance; it also supplies
the missing empty city-asset fixture. Its original software-rendered fade timeout
is retained. The subsequent headless hardware-rendered city run passes all three
profiles, including 51 geometry/pixel checks per profile, loaded/fallback fades,
negative obstruction cases, and root/compatibility route consistency.

Actual office encounters pass desktop, Android portrait and landscape emulation:
eight fever/release states per profile, room depth, effect/alpha coverage, crossing
person order, action-clock pause and close/cleanup. Both browser fixtures use
controlled diagnostic placement; they do not establish the natural mission route.
Physical Android, perceptual audio and the complete timed movement matrix are
NOT RUN. No simulation, collision, gait, assets or audio sources change.

Acceptance: all 2,786 Node tests in 310 files pass (concurrency 2; no skips),
the rebuilt-site GPU suite passes six cases/111 pixel assertions, and the two
independent scoped Physics/Camera reviews pass on the same 19 hashes. Workflow
static validation and its ten Python unit tests pass. The site builder emits 31
direct routes plus aliases. One cold baseline/candidate performance pair per
desktop/portrait viewport passes existing startup/input gates: the candidate adds
3,598 bytes at startup, stays below 18 MB, accepts nine measured inputs per view
and logs no browser errors. Concurrent CPU work and asynchronous asset scheduling
prevent attributing timing differences to the shader; this is lab evidence.

Pages retains the published cursor gate and adds focused CPU and actual
Gaussian-body/sprite GPU depth gates. The integrator publishes this validated
successor to main under the standing release policy, then verifies deployment and
both root/compatibility entries; exact commit/deployment receipts stay with the
ignored task evidence and the release response.

## Prussian hand cursor release — 29 October 2026

This scoped successor starts from published `99a5f0ce` in the isolated
`C:/Users/cogpsy-vrlab/.codex/worktrees/prussian-cursor-release/GermanySimulator`
checkout. It reuses the original 23 October cursor artwork and native 48/56 px
exports, with prompt and hashes under `assets/cursors/`. Only the canonical
`index.html` needs a stylesheet link; `3d.html` remains its query/hash-preserving
compatibility redirect. No held primary runtime, game simulation, world geometry,
camera, audio, text layout or input owner is copied or changed. Physics/Camera
reviews are omitted for this unrelated screen-space native cursor scope.

The primary authoring checkout's missing config/HEAD and corrupt refs are preserved.
Clean, shallow upstream metadata and a separate release worktree recover source
authority for this candidate without repairing that shared checkout. The native
worktree tool could not use the recovered metadata outside the listed workspace,
so the Git fallback is used explicitly; app attachment is unavailable for it.
Fresh evidence is under this checkout's ignored `output/interaction-cursor-release/`:
19 focused Node checks pass; the site builder emits 31 direct pages plus aliases;
the built-site cursor suite passes all 33 checks across desktop, Android portrait/
landscape emulation, reduced motion and forced system colors. Real Start and
file-button actions, the compatibility redirect, transparent image decoding,
fingertip hotspot, failure fallback and no touch/system-color art downloads pass.
Source/export hashes match. Menu/city captures use a clearly documented QA-only
image because browser screenshots omit the OS cursor. Questionnaire/welcome skips
stage the city check and do not establish natural mission flow.

Three cold hardware benchmark runs per desktop/portrait profile pass the existing
startup, title cadence, drawing-buffer, input and console gates both before and
after the cursor link. All runs accept nine inputs and have no page errors.
Desktop startup is 16,502,472 -> 16,512,934 bytes; portrait is 16,126,694 ->
16,127,509 bytes. Chrome 156.0.8078.49 / Intel Iris Xe, DPR 2, seed 38, local HTTP.
Host timing is noisy: median desktop input p95 is 430.1/296.9 ms and portrait
129.4/170.1 ms; sync-interval p95 is 264.5/135.2 ms and 133.1/56.3 ms respectively.
These measurements establish neither a causal speedup nor physical-device frame
performance. Physical Android and GPU/displayed-frame timing remain NOT RUN.

The reviewed scoped candidate is ready for the normal fast-forward push to
origin/main. Refresh upstream before pushing so other validated successors are
preserved. Pages CI now runs the maintained cursor suite on the built artifact;
after deployment verify the live root, both PNG hashes and `3d.html` redirect.

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
