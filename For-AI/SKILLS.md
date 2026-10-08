# Codex workflow and skill routing

Codex is the task lead and integrator. Select only affected production domains, read only matching skills and project sections, and do the work directly when it is small or sequential. World-affecting candidates always require the two independent specialist review subagents below. The existing game and documented project decisions remain authoritative over generic skill suggestions.

## Domain routing

| Domain | Route |
| --- | --- |
| Design validation | `$game-design-reality-check` for an uncertain mechanic/player effect: identify the consequential assumption and cheapest useful test. Keep accepted behavior in `GAMEPLAY.md` or `BUERGERAMT.md`. |
| Gameplay evaluation | `$eval-driven-game-development` for pacing, rewards or exploit questions. Model implemented mechanics, report omissions/seeds/policy sensitivity, and keep provisional targets separate from approved acceptance. |
| Level and mission flow | `$level-design` for new layouts, gates or mission routes. Check natural prerequisites, recovery, body clearance and newcomer wayfinding using the existing world. |
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

The selected additions are installed under `.agents/skills/`. Their immutable sources, licenses, file hashes and local adaptations are in [the source manifest](../.agents/skill-sources.json). Read only the triggered skill and needed references; do not load the whole audit or collection at startup. Installation establishes availability, not measured workflow improvement. Evaluate usefulness on representative work and remove routes that only add effort.

The [functional pilots](../docs/game-skill-functional-pilots-2026-10-08.md) support focused production-rule evaluation and seeded protocol invariants. The profiling worksheet chiefly adds interpretation discipline to the existing harness. Keep these routes conditional; recorded model/lab results do not establish a speedup, designer acceptance, current-device playability or causal productivity gains.

The [implementation follow-up](../docs/game-skill-implementation-followup-2026-10-08.md) closes the crossing exploit with production regression checks and measures actual benchmark windows. Use evaluation for the questioned rule, generated cases for meaningful state invariants, and profiling for a measured bottleneck; retain the existing harness and quality until evidence justifies a change.

Project rules override generic defaults: static JavaScript, installed Three.js r186, existing collision/audio/assets, Windows-compatible commands, silent isolated QA, one integrator and current permission boundaries. Keep the user's model/effort choice. Tool declarations, automatic deployment suggestions, paid services and optional dependencies do not grant capabilities or authorization. Reuse existing fixtures and harnesses; no new browser stack, engine, analytics or scheduled job solely to satisfy a skill.

Before updating a bundle, inspect its pinned upstream diff and reachable references/scripts, preserve its license/attribution and adaptations, then refresh file hashes and run `node tools/validate-game-skills.mjs`. It checks inventory, content integrity, basic discovery fields and local references; full frontmatter validation and behavioral usefulness remain separate. Do not execute unreviewed hooks or `@latest` installs. Supporting web-vitals references remain part of the loading skill, not a new default route.

## Delegation and review

Asset, runtime and UI briefs carry the [browser responsiveness contract](./ASSET-POLICY.md#responsiveness-and-selective-preparation-protocol): starting/approach requirements, decoded cost, readiness/fallback, shared admission, consumer/cadence/cleanup and comparable input/frame evidence. Each owner keeps it in their implementation; final QA cannot compensate for unbounded background work.

Delegate only separable work that benefits from parallel effort. Keep one integrator accountable for the whole outcome, acceptance, and publication. Use no more than three active subagents and never exceed the live host/tool slot limit. Assign one writer per file; establish file ownership and interface contracts before parallel edits. Do not give workers overlapping writable paths or ask them to absorb unrelated worktree changes.

For every world/object/placement/movement/animation/camera/scale candidate, dispatch the **Physics consistency reviewer** and **Camera and scale consistency reviewer** as two independent read-only subagents, even when implementation was small or integrator-owned. Their scopes and executable gates are in [`OBJECT-CONSISTENCY.md`](./OBJECT-CONSISTENCY.md). Reserve/reuse agent slots after writers finish if needed. Give both one frozen revision, root source/test/asset read paths, no writable source paths, and fresh-vs-supplied evidence requirements. The author is never the sole approver. Omit these reviewers only for unrelated nonworld work with an explicit reason; unavailable tools produce `NOT RUN` and outstanding acceptance.

Every delegated brief states: **base commit; working directory/worktree; one goal and expected result; exact read paths; exclusive write paths; dependencies/contracts; relevant skills; acceptance checks; and required return evidence**. Ask workers to return changed paths, concise decisions, checks actually run and results, screenshots/log references where applicable, unresolved issues, and any deviation from the brief. Workers do not commit, push, or publish.

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

## 2D character animation skill

For a moving bitmap character, sprite atlas, gait, reaction, or transition, use `$animate-2d-characters` with `SPRITE-GENERATION-PROTOCOL.md`; review exact encoded frames at desktop and mobile scale. At each completed animation milestone, check for a reusable general method. If one emerged, validate and publish that general guidance to the public skill, then synchronize the project copy; keep project-specific assets and acceptance details here.

For painted Gaussian depth reveals and volumetric tunnels, use the skill's [Gaussian transitions reference](../.agents/skills/animate-2d-characters/references/gaussian-transitions.md), synchronized from [public revision `0ba985c`](https://github.com/GeorgeFejer91/animate-2d-characters/tree/0ba985c6323765b2996ab59095f5714123cebd7d). It covers source registration, detail sampling, bounded turns, shared rendering, delayed readiness and safe asynchronous teardown. Full orbit or independent limb motion still needs suitable views or a rig; the current scene and asset budgets remain owned by `BUERGERAMT.md` and `ASSET-POLICY.md`.

## HTML text-fitting contract

For new or changed bounded HTML/CSS text, use `$uncodixfy-pretext` and measure the touched UI with actual `@chenglou/pretext`. Verify 320 CSS px reflow, 200% text/zoom, and long German and English strings; define an explicit layout or reveal path when text cannot fit. This route does not imply the existing game UI has already been migrated.

The pinned OpenBMB ChatDev workflow in `For-AI/chatdev/` is an optional legacy runner for its fourteen Bürgeramt stages, including read-only Physics and Camera specialists, not the default coordinator or a source of assumed Codex capabilities. Use it only when its external checkout/runtime is available and the task benefits from that runner. It requires its local API configuration, has limited stage-specific file tools, and its QA tool does not perform browser playtests. Static validation confirms graph/tool configuration only; it does not execute stages or establish browser acceptance. Follow [`chatdev/README.md`](./chatdev/README.md) for its exact limits. Do not create Codex chats unless the user explicitly requests them.
