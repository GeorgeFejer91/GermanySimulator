# Klein-Korinthen · Verein zur Wahrung des rechten Winkels

Task owner: Codex integrator. User request 2026-10-28: design and release a complete new isolated satirical Brandenburg neighborhood level on an experimental branch at an unlisted URL. No integration into the main game yet.

## Design and implementation plan

An autumn afternoon in Klein-Korinthen, just beyond Berlin. Membership is the final frontier of belonging. Dietmar Kantenreiter offers probationary membership, a ruler and a task: document five distinct cars exceeding the club's 30 cm curb-distance rule. A measured legal car cannot count; duplicate reports cannot count. Return five reports to secretary Gisela Durchschlag for a stamped certificate. The chairman's SUV is an optional sixth scandal. All reports are fictional and remain in the browser.

The neighborhood has three connected residential blocks, a Vereinsheim courtyard, bus stop, mechanic's yard, allotments, hedges, street furniture, trees, parked cars and four original residents. Adult painterly figures live in a low-cost Three.js world. First-person walking keeps curb measurement readable. The map and numbered evidence sheet give navigational help without revealing violations before measurement. Keyboard, mouse drag, touch walking/looking and semantic buttons all operate the same state transitions.

Cast: Dietmar (pompous precision), Gisela (deadpan paperwork), Ronny Restbreite (mechanic with a perfectly reasonable excuse for everything), Dr. Ute Heckenmaß (hedge expert who mistakes hobbies for jurisdiction). Original German dialogue, paired English subtitles. Association standards are made-up club bylaws, not asserted traffic law.

Scope: new `labor/vereinigung-7f3c9d/` entry, `levels/klein-korinthen/*.mjs` controller/world/content, `assets/klein-korinthen/`, focused tests and tools. Existing vendor Three.js 0.186.0, Pretext 0.0.9 and local fonts are reused. No server: authoritative mission reducer and persistence validation are the gameplay backend. A real reporting service would contradict the fictional mission.

## Acceptance checklist

- [x] Complete neighborhood, original cast/art, readable world proportions and collision.
- [x] Natural invitation → measurement → five unique valid reports → return → membership; legal rejection and reload verified, duplicate rejection unit-tested.
- [x] Sixteen synthesized German recordings with exact subtitles, independent ASR, -18 LUFS levels and fixed profile receipts. Perceptual listening NOT RUN.
- [x] Desktop and Android-emulated portrait/landscape silent playtests; keyboard, real emulated touch walk/look/menu, resize, loading failure and bounded text checks PASS.
- [x] Independent Physics P1–P4 source/numeric and Camera C4/C5 rendered reviews PASS; source hashes and evidence modes recorded separately.
- [x] Experimental branch/tag published; live desktop/phone entry and all 26 new runtime/media hashes verified. Main remains 99a5f0c.

## State

Released 2026-10-28 at experimental commit d22a74e63a92ffea46aceafe428451d79d97d9e2; tag experimental-klein-korinthen-v0.1.0. [Play the unlisted level](https://rawcdn.githack.com/GeorgeFejer91/GermanySimulator/experimental-klein-korinthen-v0.1.0/labor/vereinigung-7f3c9d/index.html). The preview provider shows a first-visit “Open the page” notice. Eight focused tests pass. Full natural keyboard mission and five-viewport UI matrix pass, including 200% text and iframe mount/pause/resume/dispose/remount. See `tools/check-klein-korinthen-edges.mjs` for touch and failure checks. The optional adapter and host ownership contract are in [INTEGRATION.md](INTEGRATION.md).

The existing primary checkout has damaged/synchronization-conflicted Git metadata; preserve it. Publication uses an isolated index based on GitHub main `99a5f0ce3a1fdf5ccf080b31a1d437fd8e6558a5`, with only this level and four new registry entries. Never absorb unrelated local changes or redeploy the main site from this experimental snapshot.

Evidence belongs under ignored `output/klein-korinthen/`. Physical Android and perceptual audio listening must be reported separately from emulation/silent checks.

## v0.2 surreal bureaucracy expansion — active

User request 2026-10-29: push the surreal German bureaucratic nightmare further, keep the buildings and styling easy to integrate later, and finish stress and UI tests. The v0.1 release remains available while this candidate is validated. Owner: the same Codex integrator.

The new causal chain is invitation → A0 permission to apply → E31 ruler oath → five unique measured violations → C5 review of the completeness review → Gisela's membership stamp. Three short choice interactions make paperwork consequential without real waiting or an endless rejection loop. Wrong answers increment a bounded rejection counter and allow retry; completed stamps are idempotent. Measurement is impossible before E31; C5 is impossible before five valid reports; membership is impossible without C5. Map markers, objectives and the visible three-stamp paper trail explain the next action. Existing version-one patrollers retain their ruler authorization; existing members retain their earned completion. Version-two saves are repaired against the complete prerequisite chain.

The archive consists of monumental ring binders that grow from an ordinary house; the demolition application is, according to Ute, load bearing. Ronny's garage supports a ruler cathedral. A six-metre inspection arch bridges the street. The courtyard gains a giant stamp, filing cabinet and inspecting garden gnomes. These landmark scales are deliberate surreal caricature. People, cars, ordinary doors and houses keep their established metre scale. Their blocking ground components still require fitted collisions and legal approaches.

`building-kit.mjs` emits ordinary houses, service stations and landmark geometry through renderer-owned sinks. It imports no renderer, DOM, mission state or audio. The same house recipes, muted plaster palette, shutters, planters, hedges and fitted solids can be used by the main renderer. See the integration contract for units, ownership and migration.

- [x] Expanded natural keyboard route with wrong answer, legal report rejection, C5 and save/reload.
- [x] Three new form stages and 22 exact voiced lines; all script/voice ownership checked.
- [x] Seeded reducer stress, collision/building translation properties, lifecycle/input/resize browser stress.
- [x] Desktop, narrow portrait, landscape, large display and enlarged-text UI checks.
- [x] Same frozen candidate: independent Physics P1–P4 and Camera C4/C5 plus applicable X1 evidence. C1–C3 third-person fading does not apply to this first-person camera; stationary cast P5 and non-driving parked cars P6/P7 are unchanged/out of scope.
- [ ] Experimental v0.2 tag and unlisted URL verified; main remains untouched.

### v0.2 executed evidence

2026-10-29: `node --test tests/klein-korinthen.test.mjs` passes 12/12, including 40,000 seeded actions, unsupported/prototype station IDs, prerequisite necessity, legacy/current save repair, duplicate rejection and translated building geometry. `curate-voice-library.mjs --check` passes; all 22 encoded recordings match the exact script and fixed binding, with independent ASR and measured levels. This does not claim perceptual listening.

`playtest-klein-korinthen.mjs` completes the natural route using actual keyboard movement: invitation, wrong A0 answer and retry, A0, E31, six measured cars including one legal rejection, five valid reports, C5, Gisela, certificate, and restored membership. No mission setters or teleportation are used. The final later app delta only adds long-caption focus/fit reconciliation and fresh read-only resource diagnostics; the seven-case edge run exercises actual conversation, touch, measurement cancellation/retry and kiosk corner sliding on the final controller.

`check-klein-korinthen-ui.mjs`: 72 states across 1440×900, 390×844 Android emulation, 844×390 Android emulation, 320×640 reflow and 1920×1080; plus 200% text and real iframe handshake/settings/pause/resume/dispose/remount. All have no horizontal overflow or unresolved no-fit. All three form questions/rejections/receipts and the longest bilingual dialogue are covered. Initial-position and long-caption fixtures are explicitly scripted UI evidence, separate from the natural route. The long-caption fit sometimes uses actual DOM line rectangles to reconcile Pretext's variable-font prediction; it is reported as `browser-verified`, not as a matching Pretext prediction. Short landscape forms keep every action visible. Enlarged text retains the existing readable dialog-scroll fallback.

`check-klein-korinthen-edges.mjs`: 7/7 PASS, including real CDP touch walk/look/menu, silent media end/skip, missing media/Pretext/world, interrupted measurement and a held-key collision/slide at the new kiosk support. `stress-klein-korinthen.mjs`: 15 complete iframe visits, 120 actual menu clicks, held-key pause/resume, resizing, double disposal, disposal before ready, corrupt storage recovery and no false completion callbacks. Matching-view resource counts remain stable (desktop spawn 21 geometries/10 textures/7 programs; compact spawn 14/9/7). Different view counts reflect Three.js's lazy upload of visible signs. Menu click-to-next-frame p95 is 32.2 ms; a separate 170-interval compact 390×844 hardware-Iris-Xe sample has p50 7.1 / p95 14 ms. These are local lab observations, not physical Android or field performance. Title renders 3 frames in 760 ms; host pause stops frame work. First-view geometry is 33 draw calls / 84,994 triangles.

### Causal acceptance

| Required consequence | Runtime authority | Executed evidence |
| --- | --- | --- |
| Invitation authorizes paperwork | Dialogue completion/skip commits `join` | Natural replay; edge voice/skip |
| A0 precedes E31; E31 precedes measurement | `stationStatus`, `transition`, measurement guard | Necessity/duplicate tests; wrong-answer retry; natural route |
| Five distinct measured violations are required | Reducer validates IDs, measurement, strict >30 cm and uniqueness | Seeded tests, legal rejection and five actual reports |
| C5 precedes membership | C5 requires five reports; Gisela/graduate requires C5 | Missing-mediator tests and natural C5-to-certificate route |
| Interrupted measurement produces no evidence | Modal/blur/visibility cancellation | Real-input cancel/retry case |
| Host owns persistent city rewards | Stable achievement ID; isolated adapter callbacks | State guard tests and host lifecycle; the main-city reward integration itself is not yet installed |

Perceptual listening and physical Android remain NOT RUN. Browser tests are headless and muted before navigation; game audio scheduling stays enabled where tested. Final review and live-release evidence will be recorded below.

Independent reviews on all 39 hashes in `candidate-v2.json` PASS. Physics freshly checked 274 solids, all 172 kit-emitted solid signatures, 3,378 movement probes, every solid-center recovery, and full 0.3 m-grid reachability to all car/resident/station approaches. The integrator supplied rendered collision and natural-route evidence. Camera freshly rendered six loaded/fallback desktop/portrait/landscape profiles plus three full-entry pause/resize profiles, verified C4 depth/grounding and C5 ordinary/monument proportions, and found no actionable issue. Both distinguish source/CPU, fresh rendered, supplied and unrun physical-device evidence. Reports: ignored `physics-v2-review.md` and `camera-v2-review.md` under `output/klein-korinthen/`.
