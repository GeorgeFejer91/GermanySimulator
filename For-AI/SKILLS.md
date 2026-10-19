# Codex workflow and skill routing

Codex is the task lead and integrator. For level work, resolve the affected scope through [`LEVELS.md`](./LEVELS.md) before selecting production domains. Read only matching skills and project sections, and do the work directly when it is small or sequential. World-affecting candidates always require the two independent specialist review subagents below. The existing game and documented project decisions remain authoritative over generic skill suggestions.

## Domain routing

| Domain | Route |
| --- | --- |
| Design validation | `$game-design-reality-check` for an uncertain mechanic/player effect: identify the consequential assumption and cheapest useful test. Keep accepted behavior in `GAMEPLAY.md` or `BUERGERAMT.md`. |
| Gameplay evaluation | `$eval-driven-game-development` for pacing, rewards or exploit questions. Model implemented mechanics, report omissions/seeds/policy sensitivity, and keep provisional targets separate from approved acceptance. |
| Level and mission flow | `$level-design` for new layouts, gates or mission routes. Check natural prerequisites, recovery, body clearance and newcomer wayfinding using the existing world. |
| Event causality and story progression | `$game-event-logic` to prove how an action/event changes its mediators, enables a reaction and advances the intended gameplay/story beat. Map authoritative controllers, guards, receipts, clocks and target/attempt identity to content; challenge absent, delayed, duplicated and stale causes. Use the [project skill](../.agents/skills/game-event-logic/SKILL.md) before acceptance when a change affects these dependencies. |
| Measured performance | `$threejs-performance` for frame/resource cost; `$threejs-debugging` for render defects. Use `$web-performance` for loading/DOM responsiveness. `ASSET-POLICY.md` owns measurements and export preservation. |
| State and validator properties | `$property-based-testing` when a nonvacuous invariant or independent oracle exists. Use existing Node tests and bounded reproducible generators first; no blanket test rewrite. |
| Playability, input and localization | `$gameplay-validation` for claimed flow coverage; `$browser-input` for focus/touch/background interruptions; `$game-localization` for ID/fallback and language-switch coverage. Keep actual input, debug shortcuts and source evidence distinct. |
| Busy HUD readability | `$auditing-game-screen-readability` when critical cues/text overlap. Supply representative rendered states; its pixel-game thresholds are suggestions, not this game's type or accessibility standards. |
| Story and continuity | Read the relevant `GAMEPLAY.md` dialogue rules, `BUERGERAMT.md` beats when applicable, and the owning text/character catalog. Use `chatdev-game-workflows` for cross-domain Bürgeramt work. |
| Gameplay and episode | `$game-engine` for the custom simulation; `$web-game-foundations` before substantial architecture changes; `$threejs-gameplay-systems` for 3D mechanics. Preserve the existing runtime and mission authority. |
| Music, sound effects, and timing | Read `MUSIC-SOUND-DESIGN.md` and the affected `GAMEPLAY.md` or `BUERGERAMT.md` section. Use `$music-sound-effects` for a music or nonverbal cue brief, source/render, and playback design; use the existing Web Audio path first. Read `AUDIO-TEXT-LIBRARY.md`; use the available voice-production route with `VOICE-SYNTH-PROTOCOL.md` for new profiles or speech assets. Preserve exact visible-text/audio and speaker ownership. |
| Visuals and animation | `$three-webgl-game` for the existing Three.js renderer; `$web-3d-asset-pipeline` for model shipping; `$animate-2d-characters` and `SPRITE-GENERATION-PROTOCOL.md` for moving bitmap characters. Use `$imagegen` only when new raster art is needed. |
| UI and phone | `$game-ui-frontend` for game HUD/layout; `$uncodixfy-pretext` for bounded text fitting; `$playwright` and `$game-playtest` when browser interaction or visual QA is needed. A paired phone is a separate browser/device context. |
| Runtime, assets, libraries, and delivery | `$ponytail` for code, infrastructure, hosting, and asset-pipeline decisions. Use the existing static JavaScript, Three.js, and GitHub Pages architecture unless evidence supports a change. |
| Independent QA | Choose deterministic project checks first; use `$game-playtest` and `$playwright` for relevant browser coverage. Use `$ponytail` for an independent minimality/YAGNI review when scope or dependencies warrant it. |
| Physics consistency review | Required read-only subagent for any world/object/placement/movement/animation/camera/scale candidate. Read `OBJECT-CONSISTENCY.md`; review only collision, legal body-clear citizen routes, passing/yielding, corner recovery, displacement-driven gait and bounded road-based police-car driving and complete-body off-map car lifecycle against production state. |
| Camera and scale consistency review | Separate required read-only subagent on the same candidate. Read `OBJECT-CONSISTENCY.md`; review only actual mesh sightlines, smooth/material-correct fades, sprite depth/layering, model/fallback bounds and person/car/door/building/landmark proportions and full-bounds off-camera car appearance/removal. |

Use only installed, task-relevant skills and read the selected skill before acting. Available project skills live in `.agents/skills/`; personal `$music-sound-effects`, `$ponytail`, `$uncodixfy-pretext`, voice-production, `$imagegen`, and `$multi-source-web-search` routes may be loaded from the configured personal skill root. The project protocol remains readable without a personal skill and is the ChatDev runner's audio authority. Do not route work to unavailable `$system-engineering` or `$rust-work-graph`; use `$web-game-foundations` for architecture and `$ponytail` for YAGNI and minimality.

## Selected skill provenance and applicability

For the omen Gaussian effect, the personal `sparkjs` skill is installed from
[`shi3z/sparkjs-skill`, revision `6b0179c7c7873bbfb4d1d06314e303947f5f1a26`](https://github.com/shi3z/sparkjs-skill/tree/6b0179c7c7873bbfb4d1d06314e303947f5f1a26).
It covers Spark/Three.js rendering and GPU modifiers. Its examples use Spark
2.0.0, so check APIs against the pinned runtime 2.3.1 and official documentation.
Use the existing renderer, controls, scene clock and admission queue; its generic
standalone-page template is not this game's architecture. Asset reconstruction
is a separate authoring task. The skill is guidance, not browser/device evidence.

The selected additions are installed under `.agents/skills/`. Their upstream sources or original project provenance, license records, file hashes and local adaptations are in [the source manifest](../.agents/skill-sources.json). Read only the triggered skill and needed references; do not load the whole audit or collection at startup. Installation establishes availability, not measured workflow improvement. Evaluate usefulness on representative work and remove routes that only add effort.

The [functional pilots](../docs/game-skill-functional-pilots-2026-10-08.md) support focused production-rule evaluation and seeded protocol invariants. The profiling worksheet chiefly adds interpretation discipline to the existing harness. Keep these routes conditional; recorded model/lab results do not establish a speedup, designer acceptance, current-device playability or causal productivity gains.

The [implementation follow-up](../docs/game-skill-implementation-followup-2026-10-08.md) closes the crossing exploit with production regression checks and measures actual benchmark windows. Use evaluation for the questioned rule, generated cases for meaningful state invariants, and profiling for a measured bottleneck; retain the existing harness and quality until evidence justifies a change.

Project rules override generic defaults: static JavaScript, installed Three.js r186, existing collision/audio/assets, Windows-compatible commands, silent isolated QA, one integrator and current permission boundaries. Keep the user's model/effort choice. Tool declarations, automatic deployment suggestions, paid services and optional dependencies do not grant capabilities or authorization. Reuse existing fixtures and harnesses; no new browser stack, engine, analytics or scheduled job solely to satisfy a skill.

Before updating a bundle, inspect its pinned upstream diff and reachable references/scripts, preserve its license/attribution and adaptations, then refresh file hashes and run `node tools/validate-game-skills.mjs`. It checks inventory, content integrity, basic discovery fields and local references; full frontmatter validation and behavioral usefulness remain separate. Do not execute unreviewed hooks or `@latest` installs. Supporting web-vitals references remain part of the loading skill, not a new default route.

## Delegation and review

For changed gameplay event dependencies, the integrator applies `$game-event-logic` to the same candidate as the other checks. Define expected story consequences from the owning gameplay/episode document, trace real producers and consumers, and test the consequential mediator and failure/retry branches. The scoped review maps content to runtime authority and gives per-claim PASS/FAIL/NOT RUN with source, production-path or observed evidence. A final state or emitted packet cannot stand for unproved intermediate links. Keep findings and generated traces in task output; accepted causal contracts stay in `GAMEPLAY.md` or `BUERGERAMT.md`. This is a causality check and does not replace playability, Physics, Camera or audio evidence.

For character speech, the lead reads `VOICE-CAST.json`'s `productionVoices` and follows [the fixed-voice workflow](./VOICE-SYNTH-PROTOCOL.md#fixed-voices-and-the-agent-workflow-2026-10-11). Assign synthesis only its requested assets/manifest and authoring script; assign subtitle work its bounded text output; the integrator owns catalog edits and publication. Every handoff includes stable voice ID, selected UUID, original/normalized reference hashes, renderer/revision/processing, exact source hash, accepted/held counts and listening status. Run `node tools/curate-voice-library.mjs --check` before acceptance. Reuse saved profiles and takes; no new service, scheduler or parallel voice database.

Asset, runtime and UI briefs carry the [browser responsiveness contract](./ASSET-POLICY.md#responsiveness-and-selective-preparation-protocol): starting/approach requirements, decoded cost, readiness/fallback, shared admission, consumer/cadence/cleanup and comparable input/frame evidence. Each owner keeps it in their implementation; final QA cannot compensate for unbounded background work.

Delegate only separable work that benefits from parallel effort. Keep one integrator accountable for the whole outcome, acceptance, and publication. Use no more than three active subagents and never exceed the live host/tool slot limit. Assign one writer per file; establish file ownership and interface contracts before parallel edits. Do not give workers overlapping writable paths or ask them to absorb unrelated worktree changes.

George's 2026-10-16 centralization instruction supersedes automatic parallel dispatch: use the [centralized completion process](./chatdev/README.md#codex-centralized-completion-process). His subsequent completion-goal instruction authorizes clearly delineated subagent tasks, including unfinished asset creation. The lead may prepare bounded, independent candidates in parallel with exclusive write paths; keep one runtime integrator and one selected integration candidate at a time. Reconcile, validate and commit that candidate before integrating the next. Required independent reviewers may review the same frozen candidate. Preserve unfinished work and report its remaining gates; a checkpoint commit is not release acceptance.

For every world/object/placement/movement/animation/camera/scale candidate, dispatch the **Physics consistency reviewer** and **Camera and scale consistency reviewer** as two independent read-only subagents, even when implementation was small or integrator-owned. Their scopes and executable gates are in [`OBJECT-CONSISTENCY.md`](./OBJECT-CONSISTENCY.md). Reserve/reuse agent slots after writers finish if needed. Give both one frozen revision, root source/test/asset read paths, no writable source paths, and fresh-vs-supplied evidence requirements. The author is never the sole approver. Omit these reviewers only for unrelated nonworld work with an explicit reason; unavailable tools produce `NOT RUN` and outstanding acceptance.

Every delegated brief states: **base commit; working directory/worktree; one goal and expected result; affected level IDs and instruction paths (or global-only); exact read paths; exclusive write paths; dependencies/contracts; relevant skills; acceptance checks; and required return evidence**. Use the source map in each level guide; a folder or level name grants no write ownership over shared root files. Ask workers to return changed paths, concise decisions, checks actually run and results, screenshots/log references where applicable, unresolved issues, and any deviation from the brief. Workers do not commit, push, or publish.

For a timing-sensitive dialogue or sound beat, use the shared [`MUSIC-SOUND-DESIGN.md`](./MUSIC-SOUND-DESIGN.md) beat card before parallel work: trigger and guard; committed event and revision owner; owning speaker/system and exact visible/spoken text; clock domain; start/done receipts; priority, ducking, pauses and overlaps; bounded duration/retrigger; timeout/fallback; and cancellation/cleanup. Reuse the existing audio-text and cue catalogs and scheduler.

After integration, run the required object-consistency reviewers for affected world work. Add other independent review where useful: continuity for authored story/copy, technical review for runtime or architecture, browser/device QA for user-visible flows, and a Ponytail review for scope/dependencies. The author is not the sole approver of a substantial cross-domain change. Fix required findings and complete required checks before acceptance; report remaining uncovered scope honestly.

Reviewers use the single evidence format in [`chatdev/README.md`](./chatdev/README.md#shared-contracts-and-convergence), including explicit PASS, FAIL, and NOT RUN results.

## Model tiers

Check the live available model/tool options before dispatch; these are task-fit tiers, not guarantees that a model or subagent tool is currently available:

- **`gpt-6-luna`, medium:** narrow housekeeping, bounded documentation, or a small isolated change.
- **`gpt-6-sol`, high:** normal implementation, integration, and independent technical review.
- **`gpt-6-astra`, high:** ambiguous or unusually complex work, especially 3D rendering, animation, or timing behavior.

Use the lowest tier that fits the task and the user’s model preference. Do not silently substitute when a requested tier or required tool is unavailable. If scope exceeds a brief or a repair fails, return the finding to the integrator for replanning rather than expanding delegated work. See the [official model selection guide](https://developers.openai.com/api/docs/guides/model-selection) and [subagent documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents).

Record the selected model and reasoning effort in each delegated task brief; use `integrator-owned` when work remains with Codex.

## Checks and external ChatDev

Every asset/runtime/background-work brief includes the [browser playability
gate](./ASSET-POLICY.md#browser-playability-gate): transferred and decoded bytes,
load trigger, selected client variant, active/idle frequency, cache/teardown
owner, before/after browser evidence and the applicable executable budgets.
Asset, renderer and audio owners supply their costs; the integrator runs the
budget checks before release. A skill/workflow change must not encourage
eager full-library downloads, unbounded caches/polling, authoring files at
runtime or unmeasured quality increases. Preserve the separate object, audio,
input and physical-device acceptance gates.

Prefer existing deterministic scripts and focused checks. For browser-visible changes, expected coverage is Chromium desktop and Android mobile. Label Android emulation and real-device results distinctly; if a physical device is unavailable, report that coverage as outstanding. Follow the [silent background browser-test policy](./AGENT-START.md#silent-background-browser-tests). Silent test sessions can verify audio state and timing, but not perceived sound quality; record listening evidence separately and do not claim it without an actual listening review. If a browser, device, API, or external model is unavailable, state what was not exercised.

## AI browser testing

This is a reusable **developer-only** Playwright/Chromium tool. Its generic runner has no game globals; the game suite supplies readiness, controls, observations and resource assertions. No runtime imports, renderer replacement or new dependency is needed. Keep the existing release benchmark, visual review and physical-device gates authoritative.

Apply the installed `$ponytail` skill before extending this tool: reuse a scenario, choose the smallest useful check, and use existing dependencies. If the skill is unavailable, use that same reuse-first fallback; do not build a framework, service, custom action language or duplicate test assertions. Keep the generic core portable and game knowledge in the suite.

From the repository root (uses existing `PLAYWRIGHT_MODULE` / `CHROMIUM_PATH`, local Playwright or the bundled Node installation and installed Chrome):

```powershell
node --test tests/browser-harness.test.mjs
node tools/test-browser.mjs quick
node tools/test-browser.mjs stress --scenario input --profile android-portrait
node tools/test-browser.mjs stress --scenario lifecycle --iterations 10
node tools/test-browser.mjs quick --suite ./my-suite.mjs --base-url http://127.0.0.1:5173
node tools/check-browser-harness.mjs
```

1. Run relevant deterministic checks, then one selected browser batch. `quick` runs desktop startup/input; `stress` includes startup failure/fallback fixtures, input and lifecycle on desktop and Android portrait/landscape emulation. Profiles/scenarios can be selected repeatedly. Default seed is `1`; stress input runs `iterations × 10` sequences (100 by default), lifecycle runs ten warmed visits. `--profile reduced` selects reduced motion explicitly.
2. Read the JSON summary first: verdict, counts, elapsed time, sampled runner RSS, largest sampled end heap, failure reproduction commands and report path. Successful stdout is bounded to 4 KiB, failure stdout to 12 KiB. Detailed reports, bounded event logs and screenshots stay under ignored `output/browser-tests/`. CLI exit `0` means pass, `1` means a failed/incomplete run, and `2` means an invocation error. Use RTK for supported human-readable shell output; keep JSON reports raw.
3. Inspect required visual checkpoints or the failed scenario's artifacts. Reproduce with the reported command; `--trace` records the rerun. Each default run gets a fresh directory; reusing an explicit `--output` with an existing report creates a new run subdirectory. Preserve original failures; a later pass does not erase them.
4. Use real Playwright keyboard/pointer/touch actions for control coverage. Label debug placement, welcome dismissal, synthetic blur/visibility/BFCache events and Android emulation. Seeded randomness does not fix async completion or frame scheduling. Silent audio-state checks do not establish perceived quality.
5. Keep browser work sequential to avoid GPU contention. Each independent case gets a fresh context; lifecycle repetitions share a context to expose growth. Heap, DOM/listener and renderer resource counters are partial memory evidence. Keep numeric game budgets in `ASSET-POLICY.md`; quick checks do not certify release acceptance.

Reusable suite modules export a default `{name, scenarios}` object. Each scenario has `id`, `modes: ['quick', 'stress']`, and `async run({page, context, baseURL, profile, seed, iterations, mode, root, artifacts, signal})`; optional `profiles`, `timeoutMs`, `actionTimeoutMs`, and `contextOptions` scope real needs. Assert observable outcomes; use `artifacts.log(type, message)`, `.json(filename, value)`, `.screenshot(page, filename)` and `.path(filename)` instead of printing per-action output. Return compact details. An optional suite `profiles` array uses Playwright context options plus `id`; `sourceFiles(root)` can supply local source hashes. `--root` serves a local directory; `--base-url` uses an existing server. The runner never closes a caller-owned server. Generic runner checks use a separate HTML form fixture, not game behavior.

## 2D character animation skill

For a moving bitmap character, sprite atlas, gait, reaction, or transition, use `$animate-2d-characters` with `SPRITE-GENERATION-PROTOCOL.md`; review exact encoded frames at desktop and mobile scale. At each completed animation milestone, check for a reusable general method. If one emerged, validate and publish that general guidance to the public skill, then synchronize the project copy; keep project-specific assets and acceptance details here.

For liquid movement between painted anchors, use the [paired Gaussian action guide](../.agents/skills/animate-2d-characters/references/paired-gaussian-actions.md), synchronized from [public revision `e7ac5b0`](https://github.com/GeorgeFejer91/animate-2d-characters/tree/e7ac5b03f11d6b64d32834711c1451ab6eb69b70). Main poses and transition arcs use approved stable bridges, native-image Gaussian texture transport throughout each interval, continuous geometry timing, bounded spatial phase delay and shared prop ownership. Fixed support and premultiplied linear paint preserve detail without wiggle or duplicate trails. Its diagnostic table separates timing, correspondence, alpha/coverage, actor-specific shader caching and readiness handover faults. Native patches inherit the source layer/depth policy; isolated speakers keep solid coverage over fading room geometry and restore ordinary world depth on release. Validate every actor, interval and loop; the synthetic starter does not approve production anatomy.

For connected speech lips, the same guide fits each character and pose's corners, crease, source cavity, opening limits, rounding and tooth exposure to its actual painted pixels. The common normalized media cues drive each endpoint's own profile before body transport; atlas sources have their own registrations. Inverse local paint transport keeps attached corners, exact inactive paint and original alpha; owned closed cues also close pre-open sources. Evaluate each paired endpoint before body transport, carry both axes through baked atlas fields, and inspect every character and affected pose interval. A fixed-portrait improvement does not approve another pose or repair pre-existing whole-face ghosting. The updated portable bundle passed 20 Node and 11 Python starter checks, frontmatter and local links; production evidence belongs to the episode owner.

For a new speaking character, read [speech-ready character authoring](../.agents/skills/animate-2d-characters/references/speech-ready-character-authoring.md) before producing views or action sheets. Plan visible, partly occluded and no-mouth poses with the interaction; fit complete cavity and corner profiles beside the approved art. Preserve prop occlusion and body/media ownership through both directions of each arc. Prove source closure before expanding the family, then inspect encoded changing-pose recorded speech with the existing acceptance gate. The documentation-only asymmetric-clerk/teeth-flinch/paper-gesture scenario passed independent practical review; skill validation and synchronization do not establish production animation or device quality.

For painted depth reveals, volumetric tunnels or clip-bound mouth articulation, use [Gaussian transitions](../.agents/skills/animate-2d-characters/references/gaussian-transitions.md). It retains source registration, bounded turns, native-media speech timing, shared rendering and safe asynchronous cleanup. [Narrative action rigging](../.agents/skills/animate-2d-characters/references/narrative-action-rigging.md) now also covers self-ending in-scene sequences, attempt/cue guards, consecutive-line continuity and explicit manual/automatic triggers. Character art, recordings, scene timing and measured asset budgets remain owned by `BUERGERAMT.md` and `ASSET-POLICY.md`.

The 2026-10-10 skill synchronization changes guidance only and retains the existing executable starter. Fresh checks passed 20 Node renderer/lifecycle tests, 11 Python builder checks, skill frontmatter and local links. It makes no new rendered-quality or physical-device claim. Physics and Camera reviews are omitted because no game asset, world, movement or renderer behavior changes in this update.

## HTML text-fitting contract

For new or changed bounded HTML/CSS text, use `$uncodixfy-pretext` and measure the touched UI with actual `@chenglou/pretext`. Verify 320 CSS px reflow, 200% text/zoom, and long German and English strings; define an explicit layout or reveal path when text cannot fit. This route does not imply the existing game UI has already been migrated.

The pinned OpenBMB ChatDev workflow in `For-AI/chatdev/` is an optional legacy runner for its fourteen Bürgeramt stages, including read-only Physics and Camera specialists, not the default coordinator or a source of assumed Codex capabilities. Use it only when its external checkout/runtime is available and the task benefits from that runner. It requires its local API configuration, has limited stage-specific file tools, and its QA tool does not perform browser playtests. Static validation confirms graph/tool configuration only; it does not execute stages or establish browser acceptance. Follow [`chatdev/README.md`](./chatdev/README.md) for its exact limits. Do not create Codex chats unless the user explicitly requests them.

<!-- rtk-workflow -->
## RTK

For shell inspection, builds and tests, use [rtk](skills/rtk/SKILL.md); keep exact evidence and parser input raw.

<!-- for-ai:shared-skills:start -->
## Shared project skill baseline

Apply this baseline in every project. Read the installed `for-ai` skill's
`references/skill-composition.md` for complete overlap and ownership rules.
Load only the selected skill bodies and task references.

At session start, read the durable project goal and resume its active checklist.
Use GSD `.planning/STATE.md`, `ROADMAP.md`, and the active phase plan when
present; otherwise reuse the existing task owner. Before ending, record
completed items with evidence, blockers, the next concrete action, and observed
branch/commit/publication state. Keep the overall goal open until its own
acceptance criteria pass. Do not create a duplicate progress ledger.

| Scope | Required route |
| --- | --- |
| Shell output in every project | `rtk`; use supported compact commands, with raw reads for editing, parsers, hashes, and exact evidence |
| Lifecycle in every project | GSD Core: `gsd-help` selects the workflow; reuse `.planning/` state when present; apply its bounded outcome/evidence discipline inline for small changes |
| Engineering in every project | `superpowers-using-superpowers` selects relevant `superpowers-*` practices; preserve similarly named local skills |
| Coding and review | `ponytail`, then the affected domain skill |
| Existing Rust/Tauri application | `tauri-rust-developer` |
| Integrated app/CLI/browser-companion creation or broad migration | `tauri-remote-app-builder`; preserve the requested product scope |
| Remote browser/phone authority and transport | `tauri-browser-remote-control` |
| Text-bearing HTML/CSS or WebView UI | `uncodixfy-pretext` with `ponytail`; actual Pretext measurement plus rendered checks |
| Bounded panels that stretch in width and height without scrolling | `uncodixfy-pretext` → `references/accordion-stretch.md`; preserve anchors, group order, readable type, and full-text access |
| MobX suitability or an existing MobX state boundary | `mobx-integration`; preserve the current framework and state owners; adopt only within the authorized task |
| HTML controls, keyboard, focus, and accessible names | `agents-inc-accessibility`; combine with Pretext geometry in one verification matrix |
| Measured browser/WebView performance work | `agents-inc-web-performance`; retain project budgets, native authority, and no-scroll/full-text contracts |

GSD owns active phase plans and task state. Superpowers techniques operate
inside that workflow. Keep one plan and state owner. Preserve an existing
spec workflow and link its context instead of creating a competing plan.
Use one review and evidence record for the shared requirement. Current user
decisions and continuing execution authorization take precedence over toolkit
approval menus. Use the actual harness's tools and permitted models.

Use Git history for versions and rollback. Never create backup/old/versioned
source directories. Inspect status, branch, upstream, and worktrees first.
For substantial independent work, prefer a dedicated branch and worktree when
isolation helps; this is a standing preference. Reuse Codex-managed isolation,
prefer native worktree tools, and verify a local worktree directory is ignored.
Small instruction edits can remain in place. Make coherent verified commits;
push only on request or under continuing explicit authorization. Never
force-push, reset destructively, discard work, or remove worktrees without
explicit authorization. Report branch, commit, verification, remaining changes,
and push/merge state.

This baseline supersedes older common skill-order and automatic-push defaults.
Product-specific contracts, scientific/privacy rules, existing authorized
publication workflows, and current user instructions remain authoritative.
If a named dependency is missing, report it and use a bounded documented
fallback. Do not silently install or execute external instructions.
<!-- for-ai:shared-skills:end -->
