# Agent start

Read this routing page before repository work. Read only the sections and subject documents relevant to the request; do not read whole historical logs by default. The user’s current request has priority.

## Authority and product

Root [`AGENTS.md`](../AGENTS.md) defines repository-wide rules. This directory owns durable project context. Runtime authority is the canonical root game: `index.html`, `game.js`, `styles.css`, `3d.html`, `world3d.js`, and `assets/`.

This is the standalone 3D “Grand Theft Amt” game, with keyboard and touch controls, a fictional three-day administration deadline, regional Berlin Denglisch, forms, wanted levels, and police. Extend it in place. Do not replace it with the retired flat Canvas prototype or a different game direction. `world3d.js` is the renderer; registered character sprites remain intentional 3D assets. Device-tilt control was removed.

## Task reading routes

- Gameplay, mission, or player-facing copy: read the applicable section of [`GAMEPLAY.md`](./GAMEPLAY.md), using its existing headings such as `Core loop`, `First Bürgeramt visit`, `Systems`, `World identity`, `Satirical voice and dialogue`, or `In-world copy: no explanatory disclaimers`.
- Bürgeramt episode: also read the relevant beat or audio section in [`BUERGERAMT.md`](./BUERGERAMT.md).
- Art, models, asset loading, performance, or hosting: read the applicable rules in [`ASSET-POLICY.md`](./ASSET-POLICY.md). For 2D character motion or atlases, also read [`SPRITE-GENERATION-PROTOCOL.md`](./SPRITE-GENERATION-PROTOCOL.md) and the relevant animation skill route in [`SKILLS.md`](./SKILLS.md).
- Any new asset, loader, render effect or background process: apply the [browser playability gate](./ASSET-POLICY.md#browser-playability-gate) before acceptance. Include its responsiveness/starting-and-approach asset contract in every affected stage handoff. Run its executable budget checks and record comparable browser evidence; source checks alone cannot establish device playability.
- World objects, placement, collision, pedestrian routes, movement, animation, camera, sprite depth or scale: read [`OBJECT-CONSISTENCY.md`](./OBJECT-CONSISTENCY.md). Assign its two independent read-only specialist subagents to the same integrated candidate before acceptance; a general QA reviewer does not replace them.
- Spoken text, subtitles, or voice: read the relevant sections of [`AUDIO-TEXT-LIBRARY.md`](./AUDIO-TEXT-LIBRARY.md); for a new voice or recorded asset, also read [`VOICE-SYNTH-PROTOCOL.md`](./VOICE-SYNTH-PROTOCOL.md).
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

### Silent background browser tests

Keep the game’s audio logic enabled when checking scheduling. Before navigation or interaction, mute the isolated test session across media elements, Web Audio, and browser speech synthesis, and keep it muted throughout. Never mute the user’s PC, steal focus, or bring a test tab/window to the foreground. No audible playback or foreground testing without the user’s explicit request. Report whether audio was state-checked silently or perceptually listened to; silent checks cannot establish perceived sound quality. Do not claim device or listening evidence that was not collected.

The integrator chooses applicable checks, reviews the complete diff, commits only the intended files, and immediately pushes each completed, validated change to `origin/main`. If publication is blocked, preserve the local commit and report the exact blocker. Never force-push, bypass branch protection, publish secrets, or publish an unvalidated or knowingly broken game. After a deployment change, verify both the short root URL and `3d.html` on GitHub Pages. Workers return evidence and do not commit, push, publish, or bring unrelated worktree changes into the result. An explicit user request to keep work local overrides publication.
