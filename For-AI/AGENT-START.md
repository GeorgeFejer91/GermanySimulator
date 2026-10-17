# Agent start

Read this routing page before repository work. Use [`README.md`](./README.md) only when you need its subject index. Read only sections relevant to the request; do not read whole historical logs by default. The user's current request has priority.

For resuming the paused centralized completion work, read the current
[project handoff](./PROJECT-HANDOFF.md) first. It identifies the unpublished
walking checkpoint, its failed passing gate, saved evidence and remaining work.
The user deferred 3D pose accuracy; do not automatically resume the broader goal.

## Authority and product

Root [`AGENTS.md`](../AGENTS.md) defines repository-wide rules. This directory owns shared context; [`LEVELS.md`](./LEVELS.md) routes scoped level context. Runtime authority remains the canonical root game: `index.html`, `game.js`, `styles.css`, `world3d.js`, and `assets/`. The public `3d.html` path is a compatibility entry to `index.html`, preserving query and hash; it has no separate game controller. Level directories belong to this same tree; their presence does not mean existing source has moved.

This is the standalone 3D “Grand Theft Amt” game, with keyboard and touch controls, a fictional three-day administration deadline, regional Berlin Denglisch, forms, wanted levels, and police. Extend it in place. Do not replace it with the retired flat Canvas prototype or a different game direction. `world3d.js` is the renderer; registered character sprites remain intentional 3D assets. Device-tilt control was removed.

## Task reading routes

- New levels, named-area direct links, entry URLs, share previews or hosting changes: read [`LEVEL-URLS.md`](./LEVEL-URLS.md). Every level requires a maintained permanent direct URL and unique comical share image; update and verify the catalogue before release.
- Building intros/outros or indoor scene handoffs: read [`LEVEL-TRANSITIONS.md`](./LEVEL-TRANSITIONS.md), both affected level guides and the applicable performance/object gates. Every indoor level uses its three shared transition types; outdoor scenes keep their existing flow.
- Named level, interior or area, including work in root modules: resolve [`LEVELS.md`](./LEVELS.md), read the selected level's `AGENTS.md` and `For-AI/README.md`, then only their matching subject sections. City-to-interior changes read both scopes. Global-only tooling/documentation work can skip level context.
- Gameplay, mission, or player-facing copy: read the applicable section of [`GAMEPLAY.md`](./GAMEPLAY.md), using its existing headings such as `Core loop`, `First Bürgeramt visit`, `Systems`, `World identity`, `Satirical voice and dialogue`, or `In-world copy: no explanatory disclaimers`.
- Bürgeramt episode: its [level guide](../levels/buergeramt/For-AI/README.md) selects the relevant `BUERGERAMT.md` beat, source owners and focused checks.
- Gameplay event chains, mission gates or story progression: use [`game-event-logic`](../.agents/skills/game-event-logic/SKILL.md) and the causal review route in [`SKILLS.md`](./SKILLS.md). Map intended content to actual triggers, mediators, guards and consequences; verify consequential dependencies before acceptance.
- Art, models, asset loading, performance, or hosting: read the applicable rules in [`ASSET-POLICY.md`](./ASSET-POLICY.md). Painted open-city characters also follow [`CITY-CHARACTER-STYLE.md`](./CITY-CHARACTER-STYLE.md), preserving the 3D player/police exception. For 2D character motion or atlases, also read [`SPRITE-GENERATION-PROTOCOL.md`](./SPRITE-GENERATION-PROTOCOL.md) and the relevant animation skill route in [`SKILLS.md`](./SKILLS.md).
- Asset, loader, rendering, input, UI or background-work changes: apply the [browser playability gate](./ASSET-POLICY.md#browser-playability-gate) and its [maintenance procedure](./ASSET-POLICY.md#maintaining-browser-playability) before acceptance. Include the applicable responsiveness/starting-and-approach contract in affected handoffs. Run the relevant executable checks and record comparable browser evidence; source checks alone cannot establish device playability.
- World objects, placement, collision, pedestrian routes, movement, animation, camera, sprite depth or scale: read [`OBJECT-CONSISTENCY.md`](./OBJECT-CONSISTENCY.md). Assign its two independent read-only specialist subagents to the same integrated candidate before acceptance; a general QA reviewer does not replace them.
- Spoken text, subtitles, or voice: read the relevant sections of [`AUDIO-TEXT-LIBRARY.md`](./AUDIO-TEXT-LIBRARY.md); for a new voice or recorded asset, also read [`VOICE-SYNTH-PROTOCOL.md`](./VOICE-SYNTH-PROTOCOL.md). Its fixed-voice workflow and `VOICE-CAST.json` production bindings govern profile selection. Run `node tools/curate-voice-library.mjs --check` before voice acceptance.
- Music, sound effects, soundscape, mix, or a timing-sensitive sound beat: read [`MUSIC-SOUND-DESIGN.md`](./MUSIC-SOUND-DESIGN.md), then the affected `GAMEPLAY.md` or `BUERGERAMT.md` section. For spoken text, also use the audio-text route above.
- Any code or instruction change: use the relevant routes in [`SKILLS.md`](./SKILLS.md).
- Uncertain design, mission reachability, tuning, state properties or playtest claims: use the matching selective routes in [`SKILLS.md`](./SKILLS.md) and the affected gameplay/episode owner. Read only needed skill references.
- Durable architecture or product-direction change: search [`DECISIONS.md`](./DECISIONS.md) for directly relevant history. Read only matching entries; update the owning current document and add a concise decision only when rationale needs to persist.

## Invariants

- Preserve unrelated user changes. Keep one deployable runtime tree at repository root and one asset authority under `assets/`.
- Keep the accepted static JavaScript and vanilla Three.js architecture. Add infrastructure only for a demonstrated need.
- Follow [`GAMEPLAY.md`](./GAMEPLAY.md#satirical-voice-and-dialogue) for regional dialogue, character voice, and satire. Berlin is behind the Brandmauer and speaks Denglisch; characters outside it speak German, even when the UI is English. Preserve browser-generated dialogue unless the user changes that feature.
- Keep speech paired with its exact visible text. Preserve speaker, quote, textbox, and voice ownership. The current rules are in [`GAMEPLAY.md`](./GAMEPLAY.md#systems) and [`BUERGERAMT.md`](./BUERGERAMT.md); do not copy their detailed timing values into this router.
- Follow [`GAMEPLAY.md`](./GAMEPLAY.md#in-world-copy-no-explanatory-disclaimers) for player-facing copy. Keep production provenance and source notes in project documentation and `CREDITS.md`.

## Validation and publication

Prefer standard deterministic checks first. For browser-visible changes, the expected browser scope is Chromium desktop and Android mobile, in isolated, silent sessions. Use a physical Android device when available; if only emulation is available, label that evidence and report device coverage as outstanding. If browser tooling or a device is unavailable, report the uncovered scope.

World-affecting candidates also need the physics and camera/scale gates in [`OBJECT-CONSISTENCY.md`](./OBJECT-CONSISTENCY.md), with source checks and actual rendered evidence reported separately. Keep any required `FAIL` or `NOT RUN` check outstanding. A task unrelated to world behavior may omit those reviewers only with a recorded scope reason.

Use the [shared review format and evidence modes](./chatdev/README.md#shared-contracts-and-convergence). A forced scene does not prove the natural mission chain; packaging checks establish neither game performance nor skill effectiveness.

For changed action/reaction dependencies, include the scoped causal map and verdict from `$game-event-logic`. Distinguish intended story requirements, source reasoning and executed gameplay evidence; leave required unproved links outstanding. Keep this evidence with the task, rather than adding a second event ledger to `For-AI/`.

### Silent background browser tests

Keep the game’s audio logic enabled when checking scheduling. Before navigation or interaction, mute the isolated test session across media elements, Web Audio, and browser speech synthesis, and keep it muted throughout. Never mute the user’s PC, steal focus, or bring a test tab/window to the foreground. No audible playback or foreground testing without the user’s explicit request. Report whether audio was state-checked silently or perceptually listened to; silent checks cannot establish perceived sound quality. Do not claim device or listening evidence that was not collected.

George's standing publication policy, confirmed on 2026-10-11: **always publish all completed new features and fixes**. Publication is part of completing the work; no additional permission request is needed. When pending features share files, the integrator integrates and validates the combined candidate, then commits and pushes the complete coherent feature set to `origin/main`. Overlapping pending changes alone are not a reason to leave completed features unpublished. Preserve all feature work and include its required assets, tests and owning documentation; exclude secrets, private authoring inputs, scratch files and generated local evidence.

The integrator chooses applicable checks and reviews the complete combined diff before publication. Resolve validation failures and integration conflicts, then immediately push the validated changes. Never force-push, bypass branch protection, publish secrets, or publish an unvalidated or knowingly broken game. If a real external blocker prevents publication, preserve the coherent local commit, report the exact blocker, and continue publication when it is resolved. After deployment, verify both the short root URL and `3d.html` on GitHub Pages. Workers return evidence and do not commit or push; one integrator owns the combined publication. A later explicit request to keep particular work local overrides this default.
