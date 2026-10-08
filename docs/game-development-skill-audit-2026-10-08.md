# Germany Simulator: game-development skill audit

Research snapshot: 8 October 2026. Repository base: `70e2dec60feb8226cec67c1e1f358e03ea211987`, with substantial pre-existing uncommitted changes. Findings describe the working files inspected, rather than claiming that the base commit contains all of them.

## Recommendation

Keep the existing game, its skill router, its asset pipeline, and its domain reviewers. Add a few narrowly triggered capabilities for gameplay evaluation, performance investigation, property-based testing, and design validation. Supplement asset export and real-input playtests with selected procedures. Use primary accessibility guidance to close a gap that generic UI skills do not cover.

The first three skills I would pilot are:

1. **`eval-driven-game-development` from edhahn/agent-skills:** makes pacing and tuning questions reproducible while separating simulation results from player experience.
2. **`threejs-performance` from cesartevisual/threejs-skills**, with its debugging sibling when needed: turns broad optimization advice into repeatable CPU/GPU/memory investigation.
3. **`property-based-testing` from Trail of Bits:** provides stronger ways to test validators, state transitions, geometry, and temporal invariants without simply restating implementation code.

These are recommendations from source inspection and project fit, not experimentally established productivity gains. Each needs a small comparison task before becoming a default. The detailed shortlist and adoption plan below include useful alternatives and reasons to decline bulk installation.

## Scope and evidence

The audit combines local source inspection, broad web discovery, original GitHub repositories and skill files, selected references and scripts, and professional/platform documentation. The inventory contains **77 repository-level entries at explicitly different inspection depths**; this includes discovery leads and identified mirrors, not 77 independently validated skill packages. Three read-only research workers covered rendering/assets, design/experience, and the skill ecosystem; Codex integrated the results. No candidate skill scripts were executed, no external skill was installed, and no game behavior was changed by this audit.

The distinction between **human development disciplines** and **agent skills** matters. Game design, technical art, animation, sound design, production, programming and QA are real disciplines; a `SKILL.md` is a procedure that may help an agent perform part of one. The industry breadth is corroborated by [ScreenSkills' games career map](https://www.screenskills.com/job-profiles/browse/games/). A file claiming a professional persona does not establish professional experience.

Inspection grades used in the inventory:

- **F — full selected source:** the selected `SKILL.md` was read, sometimes with linked references/scripts. This never means every skill in its repository was audited.
- **C — catalog/README:** repository scope, structure or provenance was inspected; individual skill efficacy remains unassessed.
- **D — discovery:** a search result or indexed excerpt identified a lead. It is not approved for adoption.
- **P — primary reference/tool:** authoritative documentation or tooling, rather than an installable agent skill.

Recommendations prioritize incremental value, compatibility with this game, concrete procedures and tools, explicit limitations, verifiable provenance/licensing, and modest context/dependency cost. Stars, repository size, promises of “production grade,” and claimed role biographies are not quality scores. Copies and mirrors are grouped with their upstream source rather than counted as independent corroboration.

This is a broad audit, not an exhaustive census of GitHub. Search indexes omit repositories, some pages were unavailable, and skill collections change rapidly. Catalog discovery, source review, package validation, execution on a sample task, and measured workflow improvement are different levels of evidence. This audit performed discovery and source review and inspected selected published validation artifacts; it did not execute package checks or representative tasks.

## What this game actually needs

The canonical game is the static JavaScript/vanilla Three.js **Grand Theft Amt**, served from the root through GitHub Pages. `index.html`, `3d.html`, and `world3d.js` currently select Three.js **0.186.0**. `game.js` owns the city simulation; the renderer adapts semantic game state. The main loop bounds elapsed time and subdivides updates into steps of at most 25 ms. The presence of legacy Canvas drawing functions is not permission to restore the retired Canvas runtime.

The player completes eight linked administrative procedures within a fictional three-day deadline. City travel, energy, forms, collectibles, Germanness, law power and wanted escalation interact with pedestrians, trains and civilian/police traffic. The first Bürgeramt visit adds a first-person episode, an independently running phone, a QR invitation, queue ownership and timing-sensitive call outcomes. The phone connection is a bounded event channel through the locally pinned VDO.Ninja SDK; it is not a conventional multiplayer game server.

The art combines accepted Blender/GLB environment assets, code-authored stand-ins and props, and intentional painted bitmap characters in the 3D world. Sprite identity, ground pivots, encoded frames, close/detail variants and desktop/mobile costs are already governed carefully. Audio includes recordings, Web Audio synthesis and browser speech fallback, with exact visible/spoken text, ownership, timing and loudness contracts.

Consequently, the useful skills are those that help maintain **interacting systems and a distinctive authored experience**. New-engine scaffolds, generic combat templates, React Three Fiber migration, WebGPU conversion, a heavyweight physics engine, paid asset services or a new orchestration layer are poor default recommendations.

Local evidence: [gameplay authority](../For-AI/GAMEPLAY.md), [agent entry route](../For-AI/AGENT-START.md), [asset policy](../For-AI/ASSET-POLICY.md), [runtime](../game.js), [renderer](../world3d.js), [phone link](../buergeramt-link.js), and [runtime pacing test](../tests/runtime-smoothness.test.mjs). This was source/workflow analysis; it did not establish fresh browser, physical-device or perceptual audio acceptance of the current dirty game.

## Skills currently present and routed

Ten project-local skills were found. Shared package references also exist under `.agents/references/`; their absence from an ordinary `rg` listing was checked against the filesystem before drawing conclusions.

| Installed project skill | Existing contribution | Audit judgment |
| --- | --- | --- |
| `game-engine` | Browser APIs, loops, controls, collision, audio and broad reference material | Retain as a reference library. Its introductory templates add little to this established runtime. |
| `web-game-foundations` | Simulation/render ownership, input, asset and debug boundaries | Retain for substantial architecture changes; avoid re-reading it for every local fix. |
| `three-webgl-game` | Imperative renderer, loaders, camera, DOM overlays and WebGL checks | Retain with explicit project overrides for static JS and custom bounded collision. |
| `threejs-gameplay-systems` | Core-loop contracts, encounter planning, update order, game feel and physics selection | Retain its design/feel procedures. Its Vite/TypeScript starter is not this project's runtime. |
| `web-3d-asset-pipeline` | GLB authoring/export, transforms, optimization and runtime asset checks | Retain; add semantic before/after checks rather than another asset pipeline. |
| `animate-2d-characters` | Locked identity, approved source poses, planted movement, encoded-frame analysis and authoring scripts | Retain. It is much more tailored to the actual painted actors than most public sprite-generation skills. |
| `game-ui-frontend` | Game-world visual language, HUD readability, playfield protection and responsive overlays | Retain alongside the personal measured-text route. |
| `game-playtest` | Boot, real verbs, representative screenshots, UI/render checks and concrete issue reporting | Retain; supplement with evidence modes and complete mission-flow tests. |
| `playwright` | Browser navigation, interaction, screenshots and trace workflow | Retain the available repo tooling. Adapt Bash/CLI examples to this Windows environment and silent-background policy. |
| `chatdev-game-workflows` | Project domain handoffs and independent physics/camera review; optional legacy runner | Retain as project coordination guidance, with Codex remaining the integrator. |

Personal routes in [SKILLS.md](../For-AI/SKILLS.md) add `music-sound-effects`, `ponytail`, `uncodixfy-pretext`, `imagegen`, and `multi-source-web-search`, plus the existing voice-production protocol/tools. These should remain available on demand. The local copies and personal routes are not all simultaneously invoked on every task.

**For this audit**, `multi-source-web-search` was the applied research procedure. Other skills were inspected as audit subjects. The report identifies documented routing and available packages; it does not reconstruct an execution history proving every listed skill was used in previous conversations.

Three alignment issues deserve attention before installing anything:

1. Generic `three-webgl-game` guidance recommends Rapier and TypeScript/Vite. The repository already explicitly preserves static JS and lightweight collision. Add a short project applicability note, rather than letting generic defaults reopen settled architecture.
2. Generic Playwright examples use headed sessions and unpinned `npx` tooling. The project requires isolated silent background tests, and its existing `.mjs` playtest tools are usually the useful starting point. Loaded tool capability, shell compatibility and version selection must be checked.
3. Some generic skills refer to companions that are not installed, such as `threejs-audio-generator`, or alternative runtime tracks. Existing `MUSIC-SOUND-DESIGN.md` and `music-sound-effects` provide the relevant audio route. Record that mapping instead of pretending an unavailable tool ran.

## Domain coverage and opportunity map

Professional game development spans the following domains. “Relevant” does not mean “add a permanent agent or skill for it.” The priority column describes this project's current fit.

| Domain | Concrete Germany Simulator concern | Existing authority | Useful increment | Priority |
| --- | --- | --- | --- | --- |
| Creative direction | Satirical bureaucratic city and Grand Theft Amt identity | `GAMEPLAY.md`, user direction | Falsifiable design review that preserves intentional frustration | High |
| Core/system design | Energy, deadline, enforcement and rewards interact | Gameplay skills and `GAMEPLAY.md` | Small reproducible scenarios and explicit tuning rationale | High |
| Progression/economy | Germanness, nine sausages, law-power unlock and penalties | `game.js`, gameplay authority | Distribution/pacing analysis, with no competitive-balance assumptions | High |
| Mission/quest design | Eight procedures; phone-dependent first mission | `GAMEPLAY.md`, `BUERGERAMT.md` | Reachability, cancellation/retry and soft-lock audit | High |
| Narrative/dialogue | Regional Denglisch/German, character voice, exact subtitles | Text/character catalogs | Flag/branch tests and player-comprehension observations | High |
| Level design | Office finding, travel distances, rail boundaries, landmarks | Authored world data | Critical-path and pacing measurements using existing map | High |
| NPC AI/navigation | Body-clear corridors, yielding and blocked-route recovery | `OBJECT-CONSISTENCY.md` | Intent/motion separation when a concrete AI problem warrants it | Medium |
| Physics/movement | Player, trains and complete car bodies remain separated | Physics reviewer and tests | Generated invariant cases; preserve deliberate gameplay exceptions | High |
| Camera/visibility/scale | Mesh sightlines, material fades, sprite depth and proportions | Camera/scale reviewer | Rendered regression evidence and calibrated comparisons | High |
| Rendering/technical art | Materials, translucency, lights and procedural effects | `world3d.js`, Three.js routes | Capture-led diagnosis and revision-specific checks | High |
| Asset authoring/export | Blender assets, stable names, pivots and fallback bounds | `ASSET-POLICY.md`, local exporters | Semantic preservation report before accepting optimization | High |
| Painted animation | Foot planting, anatomy, seams and encoded atlases | Animation skill and sprite protocol | Keep existing specialized checks; no replacement pack needed | High |
| UI/interaction/text | Touch dock, quizzes, call controls, long German text | UI skills and Pretext route | Focus/input-release and no-fit tests across actual states | High |
| Accessibility | Time limits, flash effects, color signals, hearing and motor access | Partial UI/reduced-motion/subtitle coverage | A project-specific XAG-informed review and supported-mode matrix | High |
| Localization | UI language differs from region/character speech language | Existing catalogs and subtitle protocol | Stable IDs, fallback coverage and live-switch state preservation | Medium |
| Audio/music/voice | Shared scheduler, ducking, subtitle ownership and cue lifecycle | Audio protocols and local sound skill | Keep state tests separate from listening; no new default service | High |
| Performance/memory/loading | City startup, texture variants, scene entry/exit, mobile GPU | Asset policy and generic profiling reference | Repeatable frame-time, decode, draw-call and leak worksheet | High |
| Browser/device lifecycle | Blur, hidden tabs, resizing, GPU loss and audio unlock | Browser tests and runtime guards | Failure-injection and physical Android coverage | High |
| Companion networking | Host authority, message replay, skew, disconnect and stale phone | `BUERGERAMT.md`, link/time modules | Adversarial event sequences and real two-device checks | High, scoped |
| QA/player research | Can a newcomer finish and understand the intended joke? | Tests and browser QA | Separate logic proof, scripted demos, real inputs and new-player evidence | High |
| Production/integration | Parallel domains, ownership, evidence and acceptance | `SKILLS.md`, two specialists | Add only missing routes; preserve one integrator | High |
| Build/release/operations | Static hosting, caches, root/diagnostic URLs | Pages workflow and agent-start policy | Focused required checks before publication; no new service | Medium |
| Provenance/dependencies | Asset rights, credits, upstream skill licenses and scripts | Credits, provenance and asset policy | Pin skill dependency closure and review updates deliberately | High |
| Saves/replay/debugging | Reproducibility and possible future persistence | Existing runtime/debug tools | Seeded diagnostic scenarios first; saves only when requested | Conditional |
| Multiplayer/live services | Full synchronized multiplayer, accounts or matchmaking | No current requirement | Do not import MMO/netcode architecture for the paired phone | Defer |
| Native/VR/console/store | Tauri, Quest, Unity/Unreal, Steam certification | No current game-target requirement | Keep as future-target research; no migration | Defer |
| Marketing/monetization/community | Store capsules, trailers and monetization | Current public browser game | Task-specific only; not part of every feature cycle | Defer |

This map is a project-specific synthesis. [XAG](https://learn.microsoft.com/en-us/xbox/accessibility/guidelines), [MDN WebGL guidance](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices), and [MDN Web Audio guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) substantiate the specialized platform concerns; they do not certify this game.

## Why more skills are not automatically an improvement

The current custom protocols already handle several hard problems that broad libraries gloss over: exact encoded sprite quality, speaker/text ownership, cross-device event clocks, complete-body vehicle lifecycle, and actual mesh occlusion. A generic “animation,” “audio,” “camera,” or “game orchestrator” file can dilute those requirements if installed as a competing authority.

Useful additions supply a missing **decision procedure, executable checker, diagnostic worksheet, or clearly scoped evidence standard**. Repeating “use delta time,” “profile first,” “test on mobile,” or “make it fun” does little. A large role catalog may be informative without reducing the effort needed to implement and verify an actual change.

Primary tools sometimes add more than another skill. [SpectorJS](https://github.com/BabylonJS/Spector.js/blob/master/documentation/apis.md) can capture WebGL frames programmatically; [glTF Validator](https://github.com/KhronosGroup/glTF-Validator/blob/main/README.md) validates the format and reports asset statistics. Neither replaces semantic preservation, runtime rendering, or perceptual review. [Three.js' object-optimization manual](https://threejs.org/manual/pages/optimize-lots-of-objects.html) is useful when draw submission is the bottleneck; it does not make every mesh a candidate for merging.

## Ranked additions and selective references

### 1. Quantitative gameplay evaluation — pilot

[edhahn: eval-driven-game-development](https://github.com/edhahn/agent-skills/blob/main/eval-driven-game-development/SKILL.md) checks that a simulator represents the disputed mechanic, scales effort to the question, separates provisional targets from approved gates, and reports sample size, policy and model omissions. The full entry and selected metrics/harness references were inspected; the repository's MIT license was inspected.

**Use here:** wanted pressure, Germanness reward farming, law-power pacing, quiz frequency, energy costs and mission completion time. Start with one question and existing Node tests. The custom DOM/clock harness already states that it is not a real WebGL or VDO.Ninja test.

**Increment:** reproducible tuning evidence, beyond broad “test balance” guidance. Keep existing accepted targets; new design ideals must remain proposals until the user chooses them. A bot cannot establish humor, confusion or enjoyable waiting. No new runner or permanent telemetry service is justified by this skill.

### 2. Measured Three.js performance and debugging — pilot

[cesartevisual: threejs-performance](https://github.com/cesartevisual/threejs-skills/blob/main/skills/threejs-performance/SKILL.md) and [threejs-debugging](https://github.com/cesartevisual/threejs-skills/blob/main/skills/threejs-debugging/SKILL.md) provide a profiling worksheet and symptom-led investigation. They preserve installed architecture and distinguish CPU, submission, fill/shading, transfer and memory issues. Resource counters are explicitly partial evidence. MIT and [validation limits](https://github.com/cesartevisual/threejs-skills/blob/main/docs/validation.md) were inspected; installation/metadata checks are not task or GPU certification.

**Use here:** busy city views, office entry/exit, close sprite variants, repeated asset replacement and Android slowdown. Record r186, viewport, DPR, scene state, device and frame-time distributions; separate startup/decode/compile from steady-state cost.

**Increment:** the current profiling reference lists useful tools and suspects; this adds a repeatable comparison record. Accept changes only with measured benefit and preserved interaction/appearance. It does not authorize an R3F, WebGPU or framework migration.

### 3. Meaningful property-based tests — pilot

[Trail of Bits: property-based-testing](https://github.com/trailofbits/skills/blob/82fe8226252622fa807643bdca1710901198553a/plugins/property-based-testing/skills/property-based-testing/SKILL.md) teaches invariants, independent oracles, roundtrips and input-domain generation; it identifies tautological and vacuous tests. The full entry and selected references were read. It explicitly excludes UI end-to-end testing and benchmarking. The inspected root [license is CC BY-SA 4.0](https://github.com/trailofbits/skills/blob/82fe8226252622fa807643bdca1710901198553a/LICENSE); preserve attribution and applicable share-alike terms if adapting its content.

**Use here:** malformed/replayed phone events, mission side-effect idempotence, clock mappings, bounded reward accounting, legal citizen-route geometry and complete vehicle-body lifecycle. Properties must follow the authored rules: purposeful jaywalking, police displacement and vortex ingestion are not generic collision violations.

**Increment:** generated counterexamples can reveal sequence/geometry combinations that hand-picked cases miss. Preserve the existing deterministic harness. A new PBT library is a separate dependency decision, not an automatic prerequisite. Exact library/tool licensing must be checked before reuse; a skill license does not license every referenced testing tool.

### 4. Design reality checking — pilot

[qiuaoru-coder: game-design-reality-check](https://github.com/qiuaoru-coder/game-design-agent-skills/blob/main/game-design-reality-check/SKILL.md) turns a feature promise into a falsifiable player-behavior hypothesis, labels evidence, and chooses the cheapest test that could change a decision. The entry, selected framework/report references and MIT license were inspected.

**Use here:** proposed mission expansion, onboarding, police pressure, environmental satire or collection mechanics. For example, distinguish “the office delay communicates institutional indifference” from the observable question of what players try, notice and misunderstand while waiting.

**Increment:** protects against self-confirming design prose and content expansion without evidence. Preserve unconventional goals and intentional frustration. Do not convert it into a large approval ceremony for each edit, or claim that document coherence proves fun.

### 5. Explicit playtest evidence modes — integrate a checklist

[jammyfu: gameplay-validation](https://github.com/jammyfu/open-game-skills/blob/main/skills/disciplines/gameplay-validation/SKILL.md) separates logic regression, debug-assisted scenes, actual input and newcomer observation. The complete entry was read; the repository declares MIT. Its linked fixture/capture dependencies still need closure review before package adoption.

**Use here:** any claim that a mission is completable, phone controls work, or newcomers understand a goal. Walk boot → first action → challenge/choice → consequence → next goal → failure/retry. Record build, driver, device, configuration and shortcuts.

**Increment:** a secret Bürgeramt route, teleport or forced A38 state becomes accurately labeled evidence rather than proof of natural admission/completion. Fold this into the existing PASS/FAIL/NOT RUN format. Infer the required mode from the task when clear; no need to ask the user to select a testing mode every time.

### 6. Technical-art and calibrated visual-regression references — selective pilot

[chrislaupama/threejs-game-studio](https://github.com/chrislaupama/threejs-game-studio) has technical-art, debugging/performance and visual-regression references, plus inspection/test tooling. Selected source files, package/test structure and MIT license were inspected. Its verified baseline is r185, so recheck examples on this game's r186. Source inspection also found that a backend label can be inferred from renderer type; fallback must be reported from actual backend evidence instead.

**Use here:** consistent material treatment, depth/readability, occlusion regressions, assets and camera states with repeatable screenshots.

**Increment:** more concrete visual recipes and calibrated noise/mutation rules than a generic screenshot checklist. Reuse the relevant references, not its coordinator or starter. Visual similarity alone cannot accept gameplay, foot planting or correct object scale. Test capture behavior before borrowing scripts.

### 7. Before/after GLB semantic audit — method recommendation; reuse blocked on provenance

[pascalorg: glb-web-export](https://github.com/pascalorg/skills/blob/main/glb-web-export/SKILL.md) contains a concrete [audit implementation](https://github.com/pascalorg/skills/blob/main/glb-web-export/scripts/glb-audit.mjs) for comparing exported/optimized GLBs: stable node/animation names, bounds, material/extension information and estimated costs. The selected entry and audit were inspected. Its frontmatter says MIT, but no root/per-skill license file was established in the inspected tree.

**Use here:** optimization of cars, civic buildings and landmarks whose hierarchy names and fitted bounds matter. Pair format validation with semantic comparison and the existing runtime fallback/interaction checks.

**Increment:** catches technically valid assets that broke a game assumption. Do not copy or install this package until licensing is established. Its Bash wrapper installs caret-version dependencies, and its VRAM/draw counts are estimates. Alternatively implement a minimal project-owned check from documented glTF semantics using existing tools.

### 8. Level and mission-flow design — selective reference

[gamedev-skills: level-design](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/disciplines/level-design/SKILL.md) covers player dimensions, critical paths, pacing, gate reachability and teach-before-test blockouts. The entry was read; the repository identifies Apache-2.0 licensing and a validation process.

**Use here:** new regions, office layouts, mission gates and encounter placement. Adapt examples to the walking body's clearance, camera visibility, interactions and established satirical pressure.

**Increment:** makes spatial mission flow explicit alongside strong technical collision reviews. A clearance check does not prove wayfinding, and deliberately inconvenient bureaucracy should not be automatically redesigned into comfortable pacing. Existing Physics and Camera/Scale reviewers remain required for affected world changes.

### 9. Localization and browser-input edge cases — integrate targeted checks

[jammyfu: game-localization](https://github.com/jammyfu/open-game-skills/blob/main/skills/disciplines/game-localization/SKILL.md) adds stable string identity, glossary/fallback coverage and state-preserving language switches. [browser-input](https://github.com/jammyfu/open-game-skills/blob/main/skills/disciplines/browser-input/SKILL.md) adds concrete focus, pointer cancellation, touch identity and capability-loss cases. Both full entries were inspected; MIT is declared by the repository.

**Use here:** new speech/subtitle strings, locale changes, phone controls and touched input code. UI language, subtitle language and regional spoken language are separate product rules. Test IDs/coverage independently of screenshots; test only supported devices/features.

**Increment:** small coverage additions without a new runtime dispatcher, localization service, gamepad system or indiscriminate string rewrite. Existing Pretext, catalogs, input clearing and exact audio/text contracts remain authoritative.

### 10. Busy-moment readability — conditional pilot

[abagames: auditing-game-screen-readability](https://github.com/abagames/agentic-gamedev-skills/blob/main/.agents/skills/auditing-game-screen-readability/SKILL.md) focuses on transient and simultaneous events rather than isolated screens. The full entry and MIT license were inspected; referenced checker files were not successfully retrieved, so executable quality remains unknown.

**Use here:** law quotes, subtitles, quiz prompts, reward notices and wanted feedback appearing together. Select one deliberately busy scene and capture the exact rendered state.

**Increment:** tests temporal overlap and information loss beyond individual bounded labels. Keep it as a checklist pilot until its required captures/checker are reviewed. An isolated reader's interpretation is limited evidence, not certification of human understanding or accessibility.

### 11. Broad design reference — optional alternative

[JupiterTheWarlock: game-design-skill](https://github.com/JupiterTheWarlock/game-design-skill/blob/main/plugins/game-design-skill/skills/game-design-skill/SKILL.md) adapts a studio workflow while explicitly discarding incompatible Claude-specific wrappers, respecting project artifacts and separating facts, methods, proposals and unknowns. The canonical entry, provenance and README were read; README declares MIT. The adaptation names pinned Donchitos source commit `984023ddac0d5e27624f2baacde6105e45de375f`; one authoritative-source reference could not be retrieved.

**Use here:** substantial multi-system design reviews when the focused reality-check/evaluation pair does not provide enough structure.

**Increment:** a carefully adapted reference is preferable to many fictional studio personas. Do not introduce a second GDD tree, runtime AI companion, or mandatory director role. Missing source verification remains outstanding before vendoring.

### 12. Accessibility — project-specific checklist from primary guidance

No inspected public game-accessibility persona was strong enough to recommend unchanged as the default authority. Add a short **Game accessibility** subsection to the existing gameplay/validation owners, linked from `SKILLS.md`, based on [XAG 104](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/104), [107](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/107), [116](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/116) and the [XAG index](https://learn.microsoft.com/en-us/xbox/accessibility/guidelines).

Check critical cue alternatives, speech captions versus English translations, speaker identity, focus order, touch alternatives to path gestures, transient text, reduced motion and photosensitive effects. UI time limits and authored game pressure are separate design concerns; do not automatically remove the three-day deadline or appointment mechanic. Automated DOM scans are only part of testing. Human and device evidence must be named separately.

### 13. Browser loading and responsiveness measurement — complementary reference

[Addy Osmani: performance](https://github.com/addyosmani/web-quality-skills/blob/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/performance/SKILL.md) and its [measurement reference](https://github.com/addyosmani/web-quality-skills/blob/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/performance/references/MEASUREMENT.md) distinguish static hypotheses, controlled lab measurements and field evidence. Comparable repeated runs, reported variation and preserved budgets are more useful than treating a single Lighthouse score as proof. Full selected entries/references and the MIT license were inspected.

Use this selectively for initial playable time, loading, long tasks and DOM responsiveness. The cesarte route remains the better first choice for Three.js frame cost and GPU/resource investigation. General website budgets do not automatically apply to the game; do not introduce analytics, a new browser stack or a monitoring service merely to satisfy a checklist. Its separate accessibility entry contains an error described below and should not be adopted unchanged.

## Itemized proposal for For-AI

These are concrete proposed edits, not applied policy changes. They keep current ownership instead of installing another router.

1. **`SKILLS.md`: add conditional Design validation and Gameplay evaluation rows.** Route design uncertainty to the reality-check and tuning questions to the eval skill. Name their triggers and link to selected, pinned sources after pilots. Accepted behavior stays in `GAMEPLAY.md` or `BUERGERAMT.md`.
2. **`SKILLS.md`: add a Level / mission-flow row.** Use the level-design reference before spatial expansion. Review natural prerequisite order, legal route, recovery and newcomer wayfinding. This complements the two existing world reviewers.
3. **`SKILLS.md` and `ASSET-POLICY.md`: add a measured-performance route.** Use cesarte performance/debugging for unexplained costs. The asset policy owns representative scene/device records, measurement limits and accepted budgets. Do not invent a universal FPS/VRAM target.
4. **`SKILLS.md`: add optional invariant-test guidance under QA.** Use PBT only when a meaningful property exists. Reuse Node tests; generated failures retain seeds and minimal reproductions. No blanket test rewrite or second runner.
5. **`ASSET-POLICY.md`: require relevant semantic comparisons for risky GLB optimization.** Check preserved names, bounds, scale, clips, extension/decoder support and game behavior before replacing accepted assets. Link Khronos/glTF Transform primary guidance; pascal reuse waits for license clarification.
6. **`AGENT-START.md` and the shared QA format: label evidence mode.** Record source check, deterministic simulation, scripted/debug scene, automated real input, physical-device run, new-player observation and listening review. Keep the current PASS/FAIL/NOT RUN vocabulary. A required gate remains outstanding if its evidence is missing.
7. **`GAMEPLAY.md` / `BUERGERAMT.md`: add only accepted flow and tuning decisions.** Record critical path, deliberate waiting/pressure, recovery outcomes and target rationale in the affected existing sections. Store generated runs/screenshots outside `For-AI/`.
8. **`GAMEPLAY.md` and `AGENT-START.md`: add scoped accessibility questions.** Cover critical cues, captions, focus, gestures, transient timing and motion. Link to primary XAG guidance; preserve authored satire. Create a separate durable document only if a distinct owner and sustained consumer emerge.
9. **`AUDIO-TEXT-LIBRARY.md` and owning language rules: add string/fallback coverage checks.** Stable IDs survive text edits; display and speech remain paired; switching presentation language must not reset mission or focus state. Use existing catalogs rather than a duplicate translation database.
10. **`OBJECT-CONSISTENCY.md`: retain specialist gates and add a scenario pointer when useful.** Use independent generated geometry/sequence cases and calibrated rendered states. Do not let a generic QA or screenshot skill replace either Physics or Camera/Scale review.
11. **`BUERGERAMT.md`: make the companion failure matrix easy to locate.** Host and phone are separate clocks, sessions and audio outputs. Check malformed/replayed/out-of-role events, delayed receipts, backgrounding, disconnect/reconnect and cleanup. The existing SDK/protocol owns implementation; a generic multiplayer skill adds little.
12. **`SKILLS.md`: add a short applicability and provenance rule.** Before adoption, inspect the selected skill plus its reachable references/scripts, pin a revision, preserve licenses, verify Windows/tool support, and record project overrides. Project facts defeat generic engine/tool/default workflow assumptions.
13. **`README.md` and `AGENT-START.md`: keep entry routing short.** Link only to accepted owner sections. Do not make this full audit or every candidate library mandatory startup reading.
14. **Publication route: verify required checks actually run before deployment.** The inspected Pages workflow deploys the root and contains no test step. Propose the existing focused checks appropriate to a change; no alternative CI provider or permanent nightly simulation is warranted without need. Skill advice does not itself authorize publication or update acceptance targets.

### Proposed compact routing table

| Task trigger | Selective skill/reference | Owning project section | Acceptance evidence |
| --- | --- | --- | --- |
| New mechanic/mission proposal or uncertain player effect | `game-design-reality-check` | Relevant `GAMEPLAY.md` / `BUERGERAMT.md` section | One hypothesis and a decision-changing observation/prototype |
| Tuning, pacing, reward exploit or pressure question | `eval-driven-game-development` | Owning gameplay rule | Scenario/model coverage, seed/trial count, policy sensitivity and limits |
| New region, gate or office layout | `level-design` reference | Gameplay/episode/world authority | Natural path, prerequisites, body clearance and player wayfinding |
| Unexplained slowness, memory growth or render defect | `threejs-performance`; debugging as needed | `ASSET-POLICY.md` | Same-scene before/after measurements and preserved rendered behavior |
| Validator, state-machine or geometry invariant | `property-based-testing` | Existing test/contract owner | Nonvacuous property, counterexample/seed and independent oracle where appropriate |
| Claim of complete/playable/mobile-ready flow | `gameplay-validation` checklist | Existing QA format | Mode, driver, shortcuts, build/device and named uncovered chain |
| GLB optimization/re-export | Existing asset skill plus semantic audit procedure | `ASSET-POLICY.md` | Format, semantic, runtime/fallback and visual checks |
| New overlapping HUD events | Readability checklist; existing UI and Pretext routes | Existing UI/QA owners | Busy rendered moments and long text/reflow tests |
| New locale/subtitle/input behavior | Localization/browser-input checks | Existing catalogs/gameplay/episode | ID/fallback coverage, preserved state and relevant device interruption tests |

### Keep the actual workflow short

For a normal feature: identify the affected owner → select only needed skills → define behavior and interfaces → implement the smallest playable change → run focused deterministic checks → gather the relevant browser/device evidence → dispatch the existing required independent reviewers → update accepted owning rules → publish only after applicable acceptance passes.

Design uncertainty, measurement, accessibility, companion reliability and asset preservation enter where the task needs them. They do not create permanent serial stages for every edit. New public skill content is subordinate to the user's intent and current project authority, and cannot grant permission to spend, publish, message, install unrelated tooling or expose data.

## Pilot plan: establish whether these actually make work easier

Use the same frozen game revision, task prompt, tools, model and reasoning effort for a baseline and a skill-assisted attempt. Fix acceptance criteria before comparing outputs; randomize order or repeat on a second task to reduce familiarity effects. Keep the current working changes intact and evaluate candidates in isolated task outputs. This is a proposed evaluation, not a completed benchmark.

| Pilot | Baseline task | Skill contribution under test | Evidence of useful improvement |
| --- | --- | --- | --- |
| Evaluation | Investigate possible Germanness farming or wanted/energy pacing | Models only implemented mechanics and identifies valid measures | Reproducible results with fewer unsupported conclusions or unnecessary harness changes |
| Profiling | Investigate office entry/exit or a busy city view on a representative device | Uses structured CPU/GPU/memory triage | Locates the actual bottleneck, preserves appearance, and reduces diagnostic/review effort |
| Property testing | Review phone validator/replay behavior or a bounded geometry invariant | Produces meaningful domain generators and properties | Finds a nontrivial missed case with a reproducible minimal failure; avoids tautologies |
| Design review | Assess one proposed administrative/satire beat | Turns promises into behavior hypotheses and cheapest tests | Identifies a consequential assumption and an actionable decision instead of more prose |
| Playtest evidence | Verify the natural first Bürgeramt chain and failure/retry | Separates shortcuts, harness behavior, real input and newcomer evidence | Reports coverage correctly and catches a flow gap that a forced-scene run misses |
| Asset export | Re-export one existing model into a candidate path | Compares semantics and rendering, not bytes alone | Detects changed hierarchy/bounds/clip/decoder behavior without replacing accepted art |

Track elapsed work and review time, meaningful defects found/missed, correctness, changed lines/files, new dependencies, context consumed, tool failures and unsupported acceptance claims. Do not equate longer reports or more assertions with improvement. Keep a skill only if it adds repeatable value without inducing unrelated changes. A good source-audit score is a reason to run a pilot, not a substitute for one.

## Adoption and update contract

1. Select individual skill folders. Do not bulk-install a thousand-skill collection or a second coordinator.
2. Resolve each folder's reachable references, scripts, examples and shared parent files. The portable unit can be larger than one `SKILL.md`; preserve the dependency closure.
3. Record source URL, exact upstream revision, local path, license/notice, selected capability, required tools and project overrides. Unverified licensing blocks copying; linking for research remains possible.
4. Inspect scripts and external calls before execution. Do not treat declared `allowed-tools`, hook files, “safe” metadata or generated personas as permission/capability evidence.
5. Match r186, static JS, Windows shell, existing authoring tools and background QA behavior. Samples pinned to r160/r185 or Bash are references until verified here.
6. Run one representative pilot and promote only the useful route. Keep generated evidence outside `For-AI/`; store concise accepted rules in their existing owners.
7. Review upstream diffs deliberately. Update pin and applicability together; no automatic replacement from `main` and no unreviewed `@latest` execution in a validation gate.

[Agent Skills' specification](https://github.com/agentskills/agentskills/blob/main/docs/specification.mdx) is a packaging/interoperability reference. A portable Markdown entry does not establish that its tools, hooks, permissions, engine APIs or external services work in Codex. Preserve that distinction in adoption records.

## Repository inventory and disposition

The following is the deduplicated repository-level discovery inventory. **F means selected complete skill entry points were read, not that the entire repository was audited. C means a catalog/README/tree was inspected. D means a search lead only.** Where scripts or references affected a recommendation, the additional inspection is named. Mirrors, directories and catalog entries are not independent endorsements. A discovery-only row cannot establish technical correctness, license suitability or effectiveness.

### Agent ecosystems, QA and workflow collections

| Source | Depth | What it adds or why it is not a default addition |
| --- | --- | --- |
| [openai/plugins — game-studio](https://github.com/openai/plugins/tree/main/plugins/game-studio) | F/C | Current official source; selected game entries/manifest and catalog inspected. Substantial overlap with installed project skills. Prefer synchronizing selected originals over another framework. |
| [openai/skills](https://github.com/openai/skills) | C | Its current README redirects to plugins. Old develop-web-game discovery links are not evidence of the current recommended package. |
| [anthropics/skills](https://github.com/anthropics/skills) | F/C | Full webapp-testing entry and license inspected. Its Python Playwright helper overlaps the existing JS QA route; generic page readiness is not proof of a playable game. |
| [agentskills/agentskills](https://github.com/agentskills/agentskills) | C/P | Packaging specification and reference-library source. Useful adoption contract, no additional game-development expertise. |
| [obra/superpowers](https://github.com/obra/superpowers) | F/C | Complete debugging/verification entries and pressure-test artifacts. Borrow investigative phases selectively; blanket test/approval rules and an unsafe diagnostic example prevent unchanged adoption. |
| [trailofbits/skills](https://github.com/trailofbits/skills) | F/C | Full selected testing entries, generation/evaluation references and license. PBT is a top candidate; a large dimensional-analysis multiagent workflow is unnecessary here. |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | F/C | Full short web-design-guidelines router and fetched rules. Optional DOM cross-check; pin the external guideline source separately. React/Next routes have no present stack fit. |
| [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | F/C | Full accessibility/Playwright entries and scanner source inspected. Rich documentation, but scanner coverage claims and several workflow defaults fail closer review. |
| [sickn33/agentic-awesome-skills](https://github.com/sickn33/agentic-awesome-skills) | F/C | Full selected game-development/web-games entries, narrowed game subtree and provenance material. A broad discovery index with copied sources; do not count mirrors as independent expertise. |
| [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) | C | Discovery index, not a bundled execution package. Follow original sources and check for superseded links. |
| [wshobson/agents](https://github.com/wshobson/agents) | F/C | Full debugging/WCAG entries, partial JS testing and manifests. Useful general references but largely overlap current checks; no need for another orchestrator. |
| [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | F/C | Catalog plus complete Epic Games automation entry. That entry automates a hosted service; its name does not make it a gameplay-development skill. |
| [myshenoy/skills-open-source](https://github.com/myshenoy/skills-open-source) | F/C | Full game-patterns, narrative and optimization content. Architecture concepts are useful; C++ examples, heuristic thresholds and upstream prose licensing need care. |
| [lackeyjb/playwright-skill](https://github.com/lackeyjb/playwright-skill) | F/C | Full entry/manifest/license. Existing QA already serves the purpose; visible-browser and installation defaults conflict with project practice. |
| [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) | F/C | Complete selected performance/accessibility/audit entries and measurement reference. Performance is useful; correct its accessibility error before considering that separate route. |
| [trailofbits/skills-curated](https://github.com/trailofbits/skills-curated) | F/C | Full archived OpenAI develop-web-game entry and provenance. Vendor collection, substantially duplicate; not a second independent validation. |
| [microsoft/skills](https://github.com/microsoft/skills) | C | Predominantly Azure/Foundry/SDK routes. No demonstrated service requirement for this static game. |
| [github/awesome-copilot](https://github.com/github/awesome-copilot) | F/C | Full skill-stack/supply-chain entries and selected examples. Provenance ideas help; sample hash logic is not sufficient authentication or complete change detection. |
| [muratcankoylan/Agent-Skills-for-Context-Engineering](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) | C | Context-routing catalog. Existing For-AI ownership and selective startup reading already address the useful problem. |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | F/C | Full browser-testing-with-devtools entry and evaluator documentation. Strong validation transparency, but Chrome DevTools dependence duplicates current tooling. |

### Three.js, rendering and asset skills

| Source | Depth | What it adds or why it is not a default addition |
| --- | --- | --- |
| [cesartevisual/threejs-skills](https://github.com/cesartevisual/threejs-skills) | F/C | Performance/debugging plus selected references and validation limits. Best rendering addition; preserves the installed architecture and uses a practical worksheet. |
| [pascalorg/skills](https://github.com/pascalorg/skills) | F | GLB export entry, audit scripts and package manifest. Concrete semantic comparisons; license clarity and Windows/dependency adaptation needed before copying or execution. |
| [chrislaupama/threejs-game-studio](https://github.com/chrislaupama/threejs-game-studio) | F/C | Root entry, technical-art/performance/visual-regression references, inspector and tests. Selective methods are useful; do not import the studio router or blindly trust its backend fallback. |
| [linegel/threejs-complete-set-of-skill](https://github.com/linegel/threejs-complete-set-of-skill) | F/C | Full visual-validation/debugging entries and repository QA/license. Good evidence practices; canonical WebGPU/TSL assumptions conflict with current WebGL rendering. |
| [CloudAI-X/threejs-skills](https://github.com/CloudAI-X/threejs-skills) | F/C | Full loader/animation entries. Mostly API reference overlap, with older r160 examples and incomplete cloning/cleanup coverage. |
| [OpenAEC-Foundation/Three.js-Claude-Skill-Package](https://github.com/OpenAEC-Foundation/Three.js-Claude-Skill-Package) / [Impertio-Studio source](https://github.com/Impertio-Studio/Three.js-Claude-Skill-Package) | F/C | Redirect/original treated as one family. Full performance-error/model-optimizer entries. Technical errors in compression units, batching and WebGL-era assumptions prevent unchanged adoption. |
| [MiniMax-AI/skills](https://github.com/MiniMax-AI/skills) | F/C | Full shader-dev and pitfalls reference. Useful shader debugging ideas, but incorrect macro/optimization advice and raw-WebGL defaults require correction. |
| [Yuki001/game-dev-skills](https://github.com/Yuki001/game-dev-skills) | F | Full Three.js model generator/helper contract and animation-shader entry. Concrete build contract, but r185.1/export overlap; Unity/VRChat route is irrelevant. |
| [itsjavi/skills](https://github.com/itsjavi/skills) | F/C | Full Blender game-assets entry and license. Conditional bpy/DCC assistance; adapt Godot import assumptions and include reference dependencies. |
| [ellmos-ai/skills](https://github.com/ellmos-ai/skills) | F | Full using-blender entry. Private Roblox/OneDrive assumptions make it poorly portable. |
| [LevyBytes/AI-SKILL-blender](https://github.com/LevyBytes/AI-SKILL-blender) | F/C | Full documentation router and AGPL license. Official Blender references are simpler than adopting its external drafting dependency. |
| [alton47/threejs-skills](https://github.com/alton47/threejs-skills) | F | Full performance entry. Unsupported official-status claims, placeholders and batching errors; prefer the vetted performance candidate. |
| [full-stack-skills/threejs-skills](https://github.com/full-stack-skills/threejs-skills) | F/C | Full loaders entry. Basic API capsule with little marginal value. |
| [secondsky/claude-skills](https://github.com/secondsky/claude-skills) | F/C | Full Three.js entry with declared CloudAI-X derivation and older examples. Duplicate family, not new evidence. |
| [sqwu/skills-threejs-](https://github.com/sqwu/skills-threejs-) | F | Full optimize-web-animations entry. Website scrolling/React/Vite/Next emphasis is weaker fit than game profiling. |
| [pixijs/pixijs-skills](https://github.com/pixijs/pixijs-skills) | D | Engine-specific official-looking search lead. Reconsider only for an actual Pixi.js task; no engine migration proposed. |
| [adevra/unity-shader-agent-skills](https://github.com/adevra/unity-shader-agent-skills) | D | Unity shader lead; target mismatch. |
| [robot0971-art/unity-performance-audit-skill](https://github.com/robot0971-art/unity-performance-audit-skill) | D | Unity profiling lead; target mismatch. |
| [deveshpunjabi/3d-website-skill](https://github.com/deveshpunjabi/3d-website-skill) | D | 3D website lead, not established game-specific value. |
| [liuchiawei/agent-skills](https://github.com/liuchiawei/agent-skills) | D | Rendering-related discovery; no implementation or license conclusion. |
| [benchflow-ai/skillsbench](https://github.com/benchflow-ai/skillsbench) | D | Scene-parser/benchmark discovery. A benchmark listing does not establish fit for this authored runtime. |
| [nexu-io/open-design](https://github.com/nexu-io/open-design) | D | Design/graphics discovery with overlapping sources; original provenance matters. |

### Design, narrative, playability, audio and player experience

| Source | Depth | What it adds or why it is not a default addition |
| --- | --- | --- |
| [edhahn/agent-skills](https://github.com/edhahn/agent-skills) | F/C | Full eval-driven-game-development and selected harness/metric references. Top gameplay-evaluation pilot; no claim that the simulator predicts human experience. |
| [qiuaoru-coder/game-design-agent-skills](https://github.com/qiuaoru-coder/game-design-agent-skills) | F/C | Full reality-check plus framework/report references and MIT license. Best concise design-assumption route. |
| [jammyfu/open-game-skills](https://github.com/jammyfu/open-game-skills) | F/C | Full gameplay-validation, localization, browser-input, audio-feel and shared contract. Small checklists complement current workflow; dialogue-flags body retrieval failed and is not evaluated. |
| [gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) | F/C | Full level-design, dialogue, audio, game-UI entries. Level-flow ideas add value; do not impose Ink/Yarn or a new music system. |
| [JupiterTheWarlock/game-design-skill](https://github.com/JupiterTheWarlock/game-design-skill) | F/C | Full game-design entry and provenance. Broad reference alternative; adapt Claude metadata and paths. An authoritative-sources reference was unavailable. |
| [abagames/agentic-gamedev-skills](https://github.com/abagames/agentic-gamedev-skills) | F/C | Full stress-testing, balance/readability entries, partial intent-legibility and MIT license. Busy-event readability is useful; mini-game balance ratios need task-specific justification. Referenced checker/self-test not reviewed. |
| [fcsouza/agent-skills](https://github.com/fcsouza/agent-skills) | F/C | Full quest/mission and paid audio entries, partial design fundamentals. Mandatory multiple solutions/new registries conflict with the existing mission chain; paid synthesis adds no present need. |
| [morbeo/ai-skills](https://github.com/morbeo/ai-skills) | F | Full game-design entry. Broad primer with unfinished references; weaker operational detail than shortlisted candidates. |
| [AlterLab-IEU/AlterLab_GameForge](https://github.com/AlterLab-IEU/AlterLab_GameForge) | Partial/C | Substantial accessibility/audio/narrative content. Invented professional personas and unsupported universal claims reduce confidence. |
| [roohe/agentic-super-skills](https://github.com/roohe/agentic-super-skills) | C | Distribution overlap with the preceding persona collection; not independent corroboration. |
| [sirruf/music-gen-skill](https://github.com/sirruf/music-gen-skill) | F/C | Full local MIDI skill/README. Windows/Bash/system-dependency and SoundFont rights considerations; the existing sound route is more relevant and complete. |
| [PlayableIntelligence/game-creator](https://github.com/PlayableIntelligence/game-creator) | C | Formerly opusgamelabs. Templates/QA are discovery material; automatic deployment, monetization and new runtime/audio dependencies conflict with scope. |
| [ncdlek/game-dev-agent-skills](https://github.com/ncdlek/game-dev-agent-skills) | C | Broad GDD/production suite catalog. Not enough body evidence to rank above selected candidates. |
| [Hanjo92/roguelike-game-designer-skill](https://github.com/Hanjo92/roguelike-game-designer-skill) | C | README/target mismatch; roguelike specificity offers little for the bureaucracy mission chain. |
| [kjaylee/awesome-game-design](https://github.com/kjaylee/awesome-game-design) | C/D | Design discovery list; no validated execution method established. |
| [revfactory/harness-100](https://github.com/revfactory/harness-100) | D | Quest-pattern lead. Not enough inspected evidence for adoption. |
| [notque/vexjoy-agent](https://github.com/notque/vexjoy-agent) | D | Game-pipeline coordinator lead; current Codex/For-AI coordination already owns the role. |
| [nitzangames/procedural-game-art](https://github.com/nitzangames/procedural-game-art) | F/C | Full deterministic art/grammar entry and README. Useful separation of decorative randomness from gameplay state; overlaps current prop pipeline. No new art system or bulk reskin warranted. |
| [SylphxAI/skills](https://github.com/SylphxAI/skills) | F | Complete short produce-game-2d-sprites router only. Its referenced scripts were not inspected; current encoded-frame/identity workflow is stronger evidence. |
| [0x0funky/agent-sprite-forge](https://github.com/0x0funky/agent-sprite-forge) | D | Sprite/chroma-key lead. Does not establish painted identity, encoded-frame quality or moving-character correctness. |
| [claude-dev-suite/claude-dev-suite](https://github.com/claude-dev-suite/claude-dev-suite) | C/D | Large suite and pixel-art discovery. Pixel assumptions do not fit the intentional painted bitmap style. |
| [rbergman/dark-matter-marketplace](https://github.com/rbergman/dark-matter-marketplace) | D | Balance/cost-curve lead. Search excerpts are insufficient to trust dominance heuristics or recommend its method. |
| [baxatron-git/claude-game-design-suite](https://github.com/baxatron-git/claude-game-design-suite) | D | Player-model/theory discovery; execution and task utility unestablished. |
| [oleg-riazantsev/skills-saschb](https://github.com/oleg-riazantsev/skills-saschb) | D | Design-pattern discovery, insufficient original body/provenance evidence. |
| [pluginagentmarketplace/custom-plugin-game-developer](https://github.com/pluginagentmarketplace/custom-plugin-game-developer) | D | Effects/game-development snippets only; not a vetted candidate. |

### Security, other engines, generated assets and hosted services

| Source | Depth | What it adds or why it is not a default addition |
| --- | --- | --- |
| [OWASP/secure-agent-playbook](https://github.com/OWASP/secure-agent-playbook) | F/C | Full large security-guidance entry and README. Useful primary-security pointer for the invitation/protocol boundary; a mandatory whole-project ASVS/compliance workflow is disproportionate. |
| [Unity-Technologies/skills](https://github.com/Unity-Technologies/skills) | D | Localization/tooling discovery in another engine. Official affiliation does not resolve platform mismatch. |
| [Roblox/libmp](https://github.com/Roblox/libmp) | D | Luau profiling-tool skill lead. Wrong runtime. |
| [facebook/immersive-web-sdk](https://github.com/facebook/immersive-web-sdk) | D | XR/SDK skill lead. No current immersive-web requirement. |
| [VAST-AI-Research/Tripo3D-Plugin-dsh](https://github.com/VAST-AI-Research/Tripo3D-Plugin-dsh) | D | Hosted generated-asset lead. Cost, rights and integration need a demonstrated task first. |
| [htdt/godogen](https://github.com/htdt/godogen) | D | Native-game/generated-asset pipeline lead. Additional engine and paid APIs are outside current need. |
| [awesome-genmedia/skills](https://github.com/awesome-genmedia/skills) | D | Hosted sound-effects synthesis lead. Existing audio route first; credentials/cost do not create a capability requirement. |
| [solanabr/solana-game-skill](https://github.com/solanabr/solana-game-skill) | D | Blockchain game lead. No relevance to the existing game. |
| [Zulfurix/universal-modder-opencode](https://github.com/Zulfurix/universal-modder-opencode) | D | Modding/generated-asset discovery; another target and service pipeline. |
| [Sunwood-ai-labs/pixal3d-docker-solarpunk-town-skill](https://github.com/Sunwood-ai-labs/pixal3d-docker-solarpunk-town-skill) | D | Docker/image-to-3D town pipeline. Heavy new pipeline with no demonstrated advantage for accepted assets. |

Unavailable leads such as antonpup/agent-skills and mgechev/skills were not ranked. Retrieval failures are not negative quality evidence; they mean the necessary body was unavailable in this audit.

## Professional quality: what survived inspection

The strongest candidates state a narrow trigger, describe executable steps, distinguish partial evidence from acceptance, expose their referenced artifacts, preserve existing architecture, and acknowledge their limits. Length, stars, publisher affiliation, fictional years of experience, an “official” label, a giant catalog, or a package-install test do not establish professional usefulness.

Several concrete findings explain why whole libraries should not be installed:

1. **Technical depth can coexist with wrong graphics advice.** The inspected OpenAEC/Impertio performance material gives incorrect UASTC storage units and overstates single-draw batching across materials. [Basis Universal's source](https://github.com/BinomialLLC/basis_universal) describes UASTC LDR 4×4 as 8 bits per pixel, not 8–16 bytes per texel. These errors would distort texture estimates and optimization choices.
2. **Shader “rules” can be overgeneralizations.** MiniMax's inspected pitfalls forbid function expressions in macros and suggest multiplying by zero keeps a uniform active. GLSL macros expand tokens; legal expressions can occur in the replacement text. Unused values can be optimized away. Check the actual compiler and the [GLSL ES specification](https://registry.khronos.org/OpenGL/specs/es/3.2/GLSL_ES_Specification_3.20.html) instead of importing those assertions.
3. **A scanner is not a conformance audit.** Alireza's [accessibility scanner](https://github.com/alirezarezvani/claude-skills/blob/19392f7a08264ed00486a251f5b2098321771f94/engineering-team/a11y-audit/scripts/a11y_scanner.py) implements regex checks rather than the breadth implied by its entry. An input ID is not sufficient labeling; role=button does not establish keyboard handling. False positives/negatives make it unsuitable as an automatic acceptance or fix gate.
4. **Basic accessibility thresholds still need verification.** Addy's inspected [accessibility entry](https://github.com/addyosmani/web-quality-skills/blob/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/accessibility/SKILL.md) uses 18px/14px bold for large text. [W3C's contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) uses 18 point or 14 point bold, approximately 24 CSS px or 18.7 CSS px. The performance sibling can remain useful while this entry needs correction.
5. **Scripts need independent review even in respected frameworks.** The inspected [Superpowers debugging entry](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/systematic-debugging/SKILL.md) includes a diagnostic that can print a populated identity secret. Do not execute it unchanged. Its root-cause method and pressure-test artifacts are separate quality signals.
6. **Licensing needs the original source, not just a collection label.** myshenoy declares MIT and attributes game-patterns to Nystrom. The upstream [Game Programming Patterns license](https://github.com/munificent/game-programming-patterns/blob/master/LICENSE) separates MIT code from CC BY-NC-ND book prose. Prefer linking original concepts; avoid vendoring potentially derived prose until provenance is resolved. Pascal's frontmatter license is likewise insufficiently corroborated for copying.
7. **Tests need their scope stated.** Chris's canvas inspector implementation and accompanying tests were inspected, not executed. The implementation has a backend fallback that can infer WebGPU from renderer type when explicit data is absent; correct or independently verify backend identification here. Its [visual-regression method](https://github.com/chrislaupama/threejs-game-studio/blob/main/references/visual-regression.md) is useful because it calibrates unchanged-scene noise and requires a known visual mutation to fail. Package tests do not prove every diagnostic conclusion.
8. **Evaluators can be more professional than expansive promises.** [Addy's evaluator documentation](https://github.com/addyosmani/agent-skills/blob/1401c8b8030e023baeebb31781a6653fe8e93026/evals/README.md) separates structural checks and lexical routing from paid behavioral tests, acknowledges stochastic invocation, and records model/CLI pinning. Adopt this honesty in local pilots without adding its duplicate browser stack.

## Primary references and practical tools

Skills should route agents to maintained primary material where details change. These are narrower, often more useful additions than another general game persona:

| Reference/tool | Intended use | Limit |
| --- | --- | --- |
| [Three.js optimization manual](https://threejs.org/manual/pages/optimize-lots-of-objects.html) | Explain scene/draw overhead and available geometry tradeoffs | Check installed r186 APIs and actual scene costs; examples are not acceptance budgets |
| [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) | Resource lifetime, texture/bandwidth, memory and API performance context | GPU/resource counters are partial; still measure representative hardware |
| [Spector.js capture API](https://github.com/BabylonJS/Spector.js/blob/master/documentation/apis.md) | Conditional frame/draw inspection when a rendering question needs it | Do not install another extension or permanent runtime dependency merely for a routine check |
| [Khronos glTF Validator](https://github.com/KhronosGroup/glTF-Validator) | Validate asset structure and report errors/warnings | Does not prove correct scale, identity, animation, materials or gameplay behavior |
| [KTX validation tools](https://github.khronos.org/KTX-Software/ktxtools/ktx_validate.html) | Check KTX2/extension format requirements for an actual compressed-texture task | Format validity does not establish loader support or visual parity |
| [Basis Universal](https://github.com/BinomialLLC/basis_universal) | Verify compression format properties and costs | Codec properties are not measured game VRAM or runtime performance |
| [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) | Browser audio activation, lifetime and timing constraints | Program state cannot substitute for listening evidence |
| [MDN Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API) | Focus/permission/lock-loss behavior for first-person input | Verify the actual target browser/device and alternative input flow |
| [Xbox Accessibility Guidelines](https://learn.microsoft.com/en-us/xbox/accessibility/guidelines) | Critical cues, captioning, inputs, UI timing and player access questions | Apply relevant guidance; do not claim certification or erase intended game mechanics |
| [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | Correct HTML text contrast and large-text units | Does not cover complete game accessibility |
| [ScreenSkills games roles](https://www.screenskills.com/job-profiles/browse/games/) | Cross-check breadth of production disciplines | Career taxonomy, not an agent tool or required staffing plan |

Existing loaders must be checked before shipping compressed assets. No current Draco, Meshopt or KTX2 decoder hookup was found in the inspected renderer. Smaller exports requiring those extensions entail loader changes, fallback verification and rendered tests; a compression recommendation alone is insufficient.

## Search method and limits

Research ran in three parallel read-only workstreams—rendering/assets; design/player experience; ecosystems/testing—with integrator searches on the actual runtime and uncovered domains. Searches combined general internet discovery, GitHub repositories/catalogs, full selected entries, primary specifications/documentation, licenses, references, script implementations and evaluator artifacts. Official publishers, independent maintainers, vendor mirrors and specialist sources were compared.

Query families included Codex/Agent Skills and game development, Three.js profiling/debugging/WebGL/WebGPU/shaders, GLB export/validation/Blender, animation/sprites, level/quest/dialogue/narrative design, balance/gameplay evaluation, property/state-machine testing, browser playtests/input/mobile QA, localization, accessibility, audio/music, provenance/security and skill evaluation. Follow-up GitHub searches targeted each gap rather than relying on one “awesome” list.

Full reads were selective; catalogs containing hundreds or thousands of entries were not exhaustively audited. Some tool outputs or reference retrievals were unavailable. Search results and repository contents are changing snapshots. Links to main branches are discovery/reference citations, not adoption pins; promotion must lock the actual source and dependency closure.

No candidate skill was installed, no candidate script was executed, no game browser/device session was run for this audit, and no comparative productivity trial was performed. Runtime and test files were inspected as source; this is not a new gameplay acceptance result. Existing required Physics/Camera reviews were not dispatched because this work changes no world, object, animation, camera or runtime behavior. The research workers are source-audit reviewers.

The actionable conclusion is therefore **which methods merit controlled adoption and where they belong**, with evidence-based reasons for selection and rejection. There is no substantiated claim of hours saved, improved frame rate or better game balance until the proposed pilots run.
