# Neighbor conversations implementation plan

Goal: every visible speaking neighbor mouth follows its own current speech; Heiko welcomes the player using a notepad checklist, with take-out, reading, writing/ticking and put-away frames.

The user's scene description is the design authority. Preserve the existing four residents, hesitant Heiko voice, routes, dialogue broker, exact German/English pairing, original walking frames and world scale. Work starts from published `0ee6427` in the isolated neighbors-checklist checkout; the dirty primary and older canonical handoff are preserved. Implementation is integrator-owned.

- [x] Add failing production playback/registration tests for notebook phases, all four speakers, pause, ownership, cancellation and direction changes.
- [x] Extend the existing sprite bake with Heiko's reference-derived notebook keys and explicit readable holds. Retain 128×192 cells, original 256 cells, 16 columns; add 64 notebook cells only to Heiko (20 rows, under 4096px). Register actual mouth pixels per visible pose; rear-facing paint has no visible mouth.
- [x] Extend `neighbor-sprites.js` to select notebook phases and apply current speech cues through every registered pose. Reuse accepted displacement, simulation gesture age, media time, bounded loader and disposal.
- [x] Revise `neighbor-story.js` Heiko introduction into welcome/checklist topics; attach notebook intent to individual lines. Pass that intent through `game.js`; completion/cancellation cannot check off the next line. Update the cast's exact source pairs and curator output; obsolete recordings must never play against new text. Missing new takes use the existing exact-caption fallback.
- [x] Inspect exact encoded desktop/mobile frames, ordered motion, light/dark composites and native shader output. Exercise the actual dialogue path and pause/end/reentry. Run focused Node, export, voice, asset and browser checks.
- [x] Freeze candidate; obtain independent read-only Physics and Camera/scale reviews required by `For-AI/OBJECT-CONSISTENCY.md`. Both reviewers passed candidate 4 with all 27 pins matching. Fresh native desktop/Android-emulated portrait/landscape flows passed after repairing a helper-only halo staging race. Physical-device/listening coverage remains NOT RUN.
- [ ] Publish under the standing policy and verify live root/compatibility/neighbor URLs.

Beat contract: `speakJwdTourLine` owns the planted line; its actor and dialogue instance own notebook intent. The simulation clock drives caption-only taking out/reading/checking; actual recording time drives voiced notebook phases; only the actual current media owner drives lips. Queued/missing audio remains closed. Body pause freezes action; completion permits the next line, and stale completion does nothing. Moving resumes the original directional gait. The book stays in Heiko's left hand and pencil in his right. Ending/cancelling releases the prop with the actor; no extra loop, loader service, UI or collision geometry.

Review focus: queued audio and caption fallback; notebook interruption and restart; child lines never borrowing Dad's clock; mirrored side/work mouths; mobile/desktop UV parity and alpha/depth; original feet and atlas cells preserved.

Rejected candidate: registered interpolation ghosted hands and was discarded. The accepted source uses twelve explicit painted keys; original head, legs and the first 256 atlas cells remain exact. Initial winter recording 38 attempts were held after word-check failures. A clearer in-character sentence was newly recorded and passed the unchanged exact-word gate. All 114 active neighbor sources now resolve to owned recordings.

Evidence is retained under ignored `output/neighbors-checklist/`, including the causal acceptance map, four frozen manifests, old failed runs and successful successor receipts. Final startup budget checks passed for both current and base-source desktop/mobile runs (one cold run per viewport, seed 31); current transfers were 16,045,994 / 15,659,576 bytes with nine accepted inputs and zero browser errors. This is bounded silent SwiftShader laboratory evidence, not physical Android or perceptual audio coverage.
