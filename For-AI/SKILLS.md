# Skill routing

Use only the skills relevant to the current task. Read each selected skill completely before acting.

Project-scoped game-development skills are installed in `.agents/skills/`. Their shared OpenAI Game Studio references are in `.agents/references/`. Codex should discover these skills automatically when working in this repository; if a newly installed skill is not visible, start a new Codex turn or restart Codex.

## Germany Simulator game-development skills

| Work | Skill | Requirement |
| --- | --- | --- |
| Custom gameplay simulation, the main loop, movement, collisions, NPCs, missions, wanted rules, keyboard/touch input, Web Audio, or runtime performance | `$game-engine` | Primary implementation skill for `game.js` and the custom browser-game runtime. Preserve the existing engine and game identity; do not replace it with a starter template or another framework. |
| Simulation/render/UI/input boundaries, state ownership, module shape, save/debug strategy, or a substantial refactor | `$web-game-foundations` | Use before implementation when the task changes architecture or crosses several runtime domains. Keep the accepted static-first architecture unless the user explicitly authorizes a migration. |
| HUD, menus, forms, dialogue overlays, responsive layout, touch controls, or other game-facing HTML/CSS | `$game-ui-frontend` and `$uncodixfy-pretext` | Use both. Protect the playfield, preserve the bureaucratic visual identity, and verify desktop and mobile layouts. |
| `world3d.js`, `3d.html`, Three.js scenes, cameras, lights, materials, loaders, rendering, WebGL diagnostics, or 3D runtime performance | `$three-webgl-game` | Use for the existing imperative vanilla-JavaScript Three.js path. Its TypeScript, Vite, Rapier, and module-layout recommendations are optional guidance, not permission to migrate this project. |
| Three.js movement, camera feel, encounters, objectives, collision/physics decisions, deterministic update order, difficulty, or game feel | `$threejs-gameplay-systems` | Use for playable 3D mechanics. Do not run its new-project scaffold or any `--force` operation inside this existing repository unless the user explicitly asks for a migration or new isolated prototype. |
| GLB/glTF cleanup, loading contracts, pivots, scale, materials, compression, LODs, collision proxies, or model performance | `$web-3d-asset-pipeline` | Use for files under `assets/models/` and their runtime asset contract. Also use `$ponytail` if the task expands into hosting, infrastructure, or economic asset-pipeline decisions and that skill is available. |
| Gameplay smoke testing, visual QA, HUD obstruction checks, responsive checks, WebGL regressions, or structured bug finding | `$game-playtest` | Use after user-visible game changes and for dedicated QA tasks. Exercise real controls and inspect screenshots; DOM assertions alone are insufficient for WebGL. |
| Real-browser navigation, keyboard/pointer/touch automation, screenshots, traces, console inspection, or reproducible browser flows | `$playwright` | Use as the browser-automation companion to `$game-playtest`. Resolve its project-local wrapper from `.agents/skills/playwright/scripts/playwright_cli.sh`; on Windows, use the equivalent `npx --package @playwright/cli playwright-cli` command when the shell wrapper is unsuitable. |

For work that spans domains, invoke every matching skill, normally in this order: architecture, runtime/gameplay, UI or assets, playtest, then browser automation. Do not invoke unrelated skills merely because they are installed.

All browser-testing skill workflows must follow the [silent background browser-test policy](./AGENT-START.md#silent-background-browser-tests): isolated background sessions, muted before navigation and interaction, with no focus stealing or audible output.

The project stack is already chosen: custom JavaScript simulation plus required vanilla Three.js rendering, static files, and GitHub Pages. Registered PNG character sprites remain supported through Three.js sprites. Do not reintroduce a Canvas world, or add Phaser, React Three Fiber, Vite, TypeScript, Rapier, a backend, or a second runtime tree solely because an installed skill recommends that stack for new projects.

For the first Bürgeramt episode, run `tools/chatdev.ps1 -ValidateOnly` before proposing a ChatDev graph change. The external pinned ChatDev checkout has twelve scoped stages for story, storyboard, character, color mood, animation, gameplay, soundscape, mix, phone sync, voice, review, and QA; `For-AI/chatdev/` owns the graph and file permissions. The voice stage also uses `$voice-cloning`, and gameplay changes still use the applicable game skills and silent browser playtests. ChatDev output is a proposal to validate in this root game, not another deployable game tree.

Installed source snapshots (2026-09-19):

- `$game-playtest`, `$game-ui-frontend`, `$three-webgl-game`, `$web-3d-asset-pipeline`, and `$web-game-foundations`: `openai/plugins` at `1dc195897af4161d039b80d8471ec0a10c9bbc89`.
- `$playwright`: `openai/skills` at `49f948faa9258a0c61caceaf225e179651397431`.
- `$game-engine`: `github/awesome-copilot` at `4f4796f0bf30e105700f97ed8408c12b6aa95e06`.
- `$threejs-gameplay-systems`: `majidmanzarpour/threejs-game-skills` at `e5f301d548bb18c530afbece78cd25082f4cda9c`.

Incoming WebGPT Secret Tunnel 5 contributors use
[`chatdev/WEBGPT-COORDINATION.md`](./chatdev/WEBGPT-COORDINATION.md) and the
[coordinator-owned handoff](./chatdev/WEBGPT-HANDOFF.md). Assign distinct path
ownership before parallel edits and accept only verified material into a
ChatDev stage.

## Other project skills

For cross-domain Bürgeramt work or changes to its ChatDev production process, use
[`chatdev-game-workflows`](../.agents/skills/chatdev-game-workflows/SKILL.md).
It routes the scoped domain stages; it does not replace the art, game, audio,
UI or browser skills required by the actual change.

| Work | Skill | Requirement |
| --- | --- | --- |
| Any code change, plus backend efficiency, infrastructure, hosting architecture, asset pipelines, and economic asset usage | `$ponytail` | Required. Apply its smallest-working-change ladder and keep the static GitHub Pages deployment simple. |
| New character voice profiles, reference recordings, synthesized speech clips, or voice-asset validation | `$voice-cloning` | Use with `VOICE-SYNTH-PROTOCOL.md` and the local Voice Cloner `AI-GUIDE.md`; keep game voice IDs, profile bindings, source transcripts, subtitles, and trigger ownership in the existing audio-text catalog. |
| New raster billboards, textures, period artwork, or bitmap variants | `$imagegen` | Use for generated raster art; keep final project-bound files inside this repository. Do not use it for simple SVG or code-native geometry. |
| Moving bitmap characters, sprite atlases, gait keys, or transition frames | `$animate-2d-characters`, `$imagegen`, `$game-engine`, and `$game-playtest` | Follow `SPRITE-GENERATION-PROTOCOL.md`: generated frames are proposals, the registered key sheet is source authority, the derived atlas is runtime authority, and desktop/mobile rapid-cycle QA is mandatory. Count distinct visual frames and verify transparent cell gutters after encoding; a fast renderer cannot cure held-pose movement. Its Pets-derived walk review is included there; the Work Pets creation skill and pet-specific atlas tooling are not dependencies of this game. |
| HTML, CSS, HUD, menus, responsive behavior, or other frontend UI work | `$uncodixfy-pretext` | Preserve the existing game-specific identity and avoid generic generated UI patterns. |
| Architecture, authority boundaries, durable project memory, manifests, and handoff surfaces | `$system-engineering` | Use for lasting structural decisions and update `DECISIONS.md`. |
| Current public facts, external references, historical research, or documentation lookup | `$multi-source-web-search` | Prefer primary sources, open sources before citing, and run a blind-spot pass for nontrivial research. |
| Large repository mapping, dependency pressure, or diff-impact analysis | `$rust-work-graph` | Use only when the repository becomes complex enough to justify graph analysis. |

## 2D character animation skill

The project copy is [`.agents/skills/animate-2d-characters/SKILL.md`](../.agents/skills/animate-2d-characters/SKILL.md); its public upstream is [GeorgeFejer91/animate-2d-characters](https://github.com/GeorgeFejer91/animate-2d-characters). Use it when authoring or repairing a painted character's walk, turn, action, reaction, atlas, or movement export. For changes only to dialogue, audio, or character identity metadata, use the relevant catalogs instead.

1. Lock the character's approved source identity, prop ownership, canvas, baseline, and directions. Follow the skill's painted-walk or interaction-state reference as appropriate; keep Germany Simulator's accepted asset and runtime rules in [`SPRITE-GENERATION-PROTOCOL.md`](./SPRITE-GENERATION-PROTOCOL.md).
2. Review the exact exported frames and transitions, then check the character in the game at desktop and mobile sizes. For walking changes, run the skill's planted-foot speed assessment at the actual billboard scale and compare visible shoe slide before accepting the manifest's cycle distance.
3. At each completed 2D animation milestone, check whether a proven, reusable fix or useful method emerged. If so, put its generic steps, limits, and helper tests in the public skill; keep game-specific values, art, and acceptance records here. Validate the skill, commit and push its repository, then synchronize the project copy. Do not publish unreviewed experiments or project-only assets as general guidance.

Do not use website generators or replace the existing static game architecture merely because a skill is available.
## HTML text-fitting contract

For any new or changed bounded HTML/CSS text in the HUD, menus, forms, dialogue, or touch controls, load [`uncodixfy-pretext`](https://github.com/GeorgeFejer91/uncodixfy-pretext/blob/main/SKILL.md) and its Pretext reference. It incorporates original Uncodixfy aesthetics and Ponytail; keep the game-specific visual identity and existing static architecture. Use actual `@chenglou/pretext` measurement on the touched UI, then verify rendered desktop/mobile layout, 320 CSS px reflow, 200% text/zoom, and long German/English strings. Give unreadable or impossible fits an explicit layout/reveal outcome. This route does not claim the existing game has already been migrated.
