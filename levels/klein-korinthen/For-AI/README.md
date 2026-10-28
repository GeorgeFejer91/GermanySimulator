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
