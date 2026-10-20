# Gisela walking, speech and paper gesture implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. The integrator implements it in the existing managed worktree; independent reviewers remain read-only.

**Goal:** Enable Gisela's four-direction walking, planted paper-presentation gesture and owned recorded speech through the existing street-character runtime.

**Architecture:** Preserve the published standing source, geometry and simulation/media owners. Assemble a source-bound atlas from inspected motion cells and the accepted full16 paper gesture, then use existing lossless movement/reaction delivery and mouth definitions. Add no independent renderer, clock, loader or per-texture pivot feature.

**Tech stack:** Existing static JavaScript/Three.js; existing Python/Pillow source tooling.

**Spec:** `docs/engineering/GAME-COMPLETION.md` active ambient goal; `For-AI/SPRITE-GENERATION-PROTOCOL.md`; Gisela source and mouth reports under `output/ambient-city-animation/gisela-greet-full16{,-mouths}`. This is one bounded cast increment; it does not complete the42-character goal.

## Constraints and review focus

- Preserve published Gisela standing bytes, cell128x160, pivot64,150, figure136 and world height1.6. Candidate motion pivot64,148 needs an exact downshift2desktop/1mobile pixels, with no resampling or clipping, before sharing the published pivot.
- Preserve all other characters, mission/quiz source, controls, routes and real media clock. Never promote the old generic idle/look/success/failure head-motion rows9–12 as gesture art.
- Successor V2 ruling, 21 October: independent Physics and Camera both rejected the actual88-unit/s approach with the source9.5-unit stride (~9.26cycles/s). The earlier preserve-speed constraint was an implementation assumption, not a user requirement. Use an actual brisk walking approach, 1.4× ordinary cruise bounded14–24units/s, retaining accepted-distance animation, route guards, pursuit limits and player controls. Gisela cruise13 yields18.2units/s (~1.92cycles/s). V3 also restricts initial selection to78+pace×(8−2), reserving two seconds for planted stops/turns within the existing eight-second pursuit. Distant people defer without being marked asked or spending their question;650 remains the departing-player escape bound. This intentionally changes approach pace; do not cap or fabricate the gait clock.
- Camera also rejected the static quiz portrait because the modal hides the live world performer. Reuse the existing renderer, current sprite geometry/material/UV/mouth uniforms and game-owned quiz actor to draw a small live canvas inside the existing portrait box. No independent animation/audio clock, HTML/text layout, or second WebGL renderer. Release its small render target and restore the static image on close, pause, failure and owner changes. V2 same-GPU review confirmed premultiplied readback darkened translucent edges. V3 naive byte-space division overbrightened edges because the target is SRGB8_ALPHA8; retained GPU color-encoding/oracle evidence requires V4 sRGB decoding, unassociation in linear light, then straight sRGB encoding before ImageData. Recheck GPU colors, current pose, visibility, resource cost and cadence on the explicit successor freeze.
- Missing movement/reaction/mouth definitions must retain standing or neutral, release ownership and keep gameplay responsive. Prove the selected packed-cell rectangle and both lip axes at both delivery sizes.
- Rear/occluded cells stay null; paused/cancelled/wrong-owner/segment-gap cues close. A changing paper/head pose must use that cell's own transported profile.
- The accepted gesture raises the actual paper with its connected arm, then returns to neutral. It can serve greeting and document presentation during the question/review. Explicit neutral holds are not additional authored gestures; do not claim distinct emotional outcome art.

## Task 1: Assemble and inspect the source-bound candidate

**21 October execution ruling:** The first16x14 assembly is a retained source-only draft. Inspection found that it has no phase-specific stops, and the reaction planner ignored existing owned phase settles and replayed walk cells while holding the actor root. A new production-planner regression failed on the exact entry cell; the minimal planner repair passes33 motion/reaction checks. Before activation, extend the existing painted-limb authoring path with an optional explicit displacement field, preserving default exports. Author four stop poses per phase: move and plant the already swinging foot, then lift and recenter the other foot; retain the loaded sole position until its release. Each sequence ends at the existing facing neutral. Reuse the same source limbs, upper paint, exporter and packed delivery compiler. The revised candidate adds256 dedicated stop cells; its grid and mouth coverage supersede the draft numbers below. Review the exact endpoints, ordered stops and resulting resource cost before enabling it. Historical draft evidence remains under `gisela-integration-v2`.

**Files:** create `assets/sprite-sources/street-speaker-motion/gisela-becker/build-integration-candidate.py`; retain existing family sources, `walk-contact-measurements-v1.json`, `greet-gesture-v2/build-full16.py` and `build-greet-mouths.py`. Write proposed full atlases, definition and review receipts under `output/ambient-city-animation/gisela-integration-v2/` before activation.

**Consumes:** original desktop/mobile atlases cf62820e…/18d18a93…; accepted `gisela-greet-full16/{desktop,mobile}-greet16.webp`; `gisela-greet-full16-mouths/greet16-mouth-fragment.json`; current shipped Gisela standing mouth definition. Preserve exact complete SHA256 bindings in the recipe.

**Produces:** a complete16x14 logical family, two exact decoded masters and one canonical mouth definition. Referenced cells are92 movement cells plus16 gesture cells; clear the unapproved diagnostic rows9–12. The gesture occupies row13.

Ruling: materialize the three already-reviewed greeting exports as exact immutable authoring inputs in `assets/sprite-sources/street-speaker-motion/gisela-becker/greet-gesture-v2/approved/{greet16-desktop.webp,greet16-mobile.webp,mouth-fragment.json}`. Ignored review output must not be the durable build authority. Hashes and pixels are unchanged; these are source inputs, with no new runtime adoption.

- [ ] Add an artifact check that fails on the current unassembled family: published standing/pivot preserved; all108 selected cells equal their own source after the declared integer translation; unused diagnostic cells are empty; no source alpha is clipped. Bind both encoded hashes.
- [ ] Implement `build_candidate(output: Path) -> dict` in the one source helper. Copy decoded native cells, shift by the declared integer amount and encode losslessly; keep the original held source assets unchanged.
- [ ] Preserve the **published** standing registration, not the different standing-candidate registration in the old208-frame mouth file. Translate retained92 motion registrations and16 gesture registrations by the same cell offset (`rect[1] -= 2/160`; axes unchanged); null the remaining140 of224 logical slots. The gesture mobile profiles equal desktop profiles after axes×2, already measured exactly.
- [ ] Inspect the exact new encoded cells, alpha/gutters, light/dark bodies and mouths, source comparisons and ordered starts/stops/turns/wraparound. Retain source/contact uncertainty; current9.5 cycle is supported by marked9.4 source fit, not yet native planting acceptance.

## Task 2: Wire one existing runtime capability

**Files:** modify only Gisela's record in `assets/characters/street/manifest.json`; add reviewed delivery files under `assets/characters/street-speakers/quiz-gisela-becker/delivery/` and `mouths-v2.json`. Add `tests/gisela-ambient-animation.test.mjs`; reuse `tools/build-street-motion-delivery.py`, `street-character-sprites.js` and the current mouth loader.

**Interface:** canonical person retains standing fields and gains four walk clips, source-bound variants, atlasMotion, external mouthPaint and motionDelivery. Existing `requestStreetReaction(actor, names, options)` and `getStreetSpeech(actor)` remain owners.

- [ ] Write a meaningful failing production-path test: Gisela loads motion, walks by accepted distance, settles before a paper gesture, keeps root/gait fixed while gesturing and resumes the prior heading. Wrong-owner speech, cancelled cues, rear cells and pause close; no renderer-driven phase advancement.
- [ ] Build a candidate canonical record in ignored storage. Keep the existing walks/bridges/eight-view turns and neutral4:2. Use row13 for `greet`, `work` and `review` as the same explicit paper-presentation action; use source-neutral holds for `look`, `wait`, `success` and `failure` so existing request sequences remain supported without invented art. Document shared gesture versus holds.
- [ ] Reuse the existing lossless delivery compiler to pack92 movement and16 reaction cells, preserving canonical source-slot identities. Apply its existing definition fingerprint after the complete person and mouth reference are set.
- [ ] Run the actual current source/packed-grid/atlas-reaction/playback/avoidance tests plus the new test. Verify missing bank/definition, stale load completion, disposal and source readmission with the current loader; add a regression only for an uncovered consequential failure.
- [ ] After source and current-renderer checks pass, activate only the reviewed Gisela record and assets. Keep all unrelated candidates held.

## Task 3: Prove the native encounter and integrate

**Files:** reuse/extend `tools/playtest-ambient-encounters.mjs` for an explicit selected voice parameter if needed; ignored evidence under `output/ambient-city-animation/gisela-integration-v2/`; existing SESSION and GAME-COMPLETION owners.

- [ ] Run isolated silent actual default Gisela quiz approach, recorded composite question, paper gesture, answer/review, completion and return to roaming on desktop and both Android-emulated aspects. Separate player/debug placement and direct source cues from natural flow. Compare actual segment-local energy and actor/shader ownership; preserve exact spoken/visible text.
- [ ] Observe multiple ordinary and approach-speed gait cycles, starts/stops, blocked recovery, turns, pause/resume, both delivery sizes, selected-variant texture/definition identity and bounded resource disposal. A source contact fit cannot replace this observation.
- [ ] Freeze one complete candidate. Obtain separate required Physics and Camera/Scale reviews and one fresh general review; repair findings under explicit successor freezes. Retain inherited full-world and physical/listening gaps with their original scope.
- [ ] Run affected checks, curator and required full regression checks, then verify staged payload/source hashes and scoped diff. Commit the coherent reviewed increment. Publish with the combined release only after the existing required world/release gaps are closed; preserve other work.

Execution is already authorized by George's active full-cast goal. Continue with the existing integrator; no additional permission or implementation delegation is needed.
