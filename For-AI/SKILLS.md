# Codex workflow and skill routing

Codex is the task lead and integrator. Select only affected production domains, read only matching skills and project sections, and do the work directly when it is small or sequential. World-affecting candidates always require the two independent specialist review subagents below. The existing game and documented project decisions remain authoritative over generic skill suggestions.

## Domain routing

| Domain | Route |
| --- | --- |
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

## Delegation and review

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

## HTML text-fitting contract

For new or changed bounded HTML/CSS text, use `$uncodixfy-pretext` and measure the touched UI with actual `@chenglou/pretext`. Verify 320 CSS px reflow, 200% text/zoom, and long German and English strings; define an explicit layout or reveal path when text cannot fit. This route does not imply the existing game UI has already been migrated.

The pinned OpenBMB ChatDev workflow in `For-AI/chatdev/` is an optional legacy runner for its fourteen Bürgeramt stages, including read-only Physics and Camera specialists, not the default coordinator or a source of assumed Codex capabilities. Use it only when its external checkout/runtime is available and the task benefits from that runner. It requires its local API configuration, has limited stage-specific file tools, and its QA tool does not perform browser playtests. Static validation confirms graph/tool configuration only; it does not execute stages or establish browser acceptance. Follow [`chatdev/README.md`](./chatdev/README.md) for its exact limits. Do not create Codex chats unless the user explicitly requests them.
