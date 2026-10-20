# For AI

This directory owns shared project rules and routes; `levels/<id>/For-AI/` owns scoped level context. Start with [`AGENT-START.md`](./AGENT-START.md), then load only the affected level and subject sections. The user's current request and applicable `AGENTS.md` instructions define authority. Link to owning documents instead of duplicating their rules.

[`SKILLS.md`](./SKILLS.md) owns Codex domain routing and delegation. [`AGENT-START.md`](./AGENT-START.md#validation-and-publication) owns validation and the standing publication policy. [`chatdev/README.md`](./chatdev/README.md) owns the optional legacy Bürgeramt runner.

Use the smallest coherent change. Update the owning document when a lasting rule changes. Keep chat logs, generated evidence and speculative backlogs out of instruction folders. New product source and shipped assets stay outside them. The existing `AUDIO-TEXT-LIBRARY.js` and `QUIZ-CHARACTER-DICTIONARY.js` are also runtime catalogs: preserve their entry-page/tool references until a separately validated relocation.

## Read by task

- [Architecture implementation record](../docs/engineering/ARCHITECTURE-IMPROVEMENTS.md): demand loading, bounded asset lifetimes, browser deployment checks, transition ownership, shared building data and keyboard/modal access; scoped evidence and device limits.
- [`PROJECT-HANDOFF.md`](./PROJECT-HANDOFF.md): user-requested pause/resume checkpoint, unpublished walking pilot, exact remaining passing failure and bounded next tasks.
- [`LEVEL-URLS.md`](./LEVEL-URLS.md): maintained public direct-level URL catalogue, production status, unique comical share previews, and mandatory checks for every new level.
- [`AGENT-START.md`](./AGENT-START.md): task-scoped reading routes, canonical-game invariants, and validation policy.
- [`LEVELS.md`](./LEVELS.md): level lookup, nested instructions, shared ownership, and when to extract level source or documentation.
- [`LEVEL-TRANSITIONS.md`](./LEVEL-TRANSITIONS.md): shared building doors, entry vortex, forced ejection and immediate voluntary leaving; indoor/outdoor boundaries and lifecycle.
- [`GAMEPLAY.md`](./GAMEPLAY.md): current gameplay, mission, dialogue, and in-world copy rules. Read only the sections relevant to the change.
- [`BUERGERAMT.md`](./BUERGERAMT.md): current episode beats, cast ownership, audio, and domain handoff.
- [`ASSET-POLICY.md`](./ASSET-POLICY.md): current asset, performance, hosting, and YAGNI policy, including [browser playability maintenance](./ASSET-POLICY.md#maintaining-browser-playability).
- [`SPRITE-GENERATION-PROTOCOL.md`](./SPRITE-GENERATION-PROTOCOL.md): accepted character-source and atlas workflow.
- [`CITY-CHARACTER-STYLE.md`](./CITY-CHARACTER-STYLE.md): painted city-citizen proportions, reference ownership and source/export review, with the retained 3D player/police exception.
- [`SKILLS.md`](./SKILLS.md): skill routes, Codex model tiers, delegation and review contract.
- [`game-event-logic`](../.agents/skills/game-event-logic/SKILL.md): causal proof of gameplay action/reaction chains and whether runtime mediators support intended story progression; acceptance routing lives in `SKILLS.md`.
- [`OBJECT-CONSISTENCY.md`](./OBJECT-CONSISTENCY.md): required independent physics and camera/scale reviewers, pedestrian/solid separation, visibility/depth and executable regression matrix.
- [`DECISIONS.md`](./DECISIONS.md): dated rationale and history. Search for a relevant entry when needed; do not read the whole log or treat an older entry as current authority.
- [`VOICE-SYNTH-PROTOCOL.md`](./VOICE-SYNTH-PROTOCOL.md): voice profile and recorded-speech production.
- [`VOICE-CAST.json`](./VOICE-CAST.json): named fictional cast, demeanor assessment, exact dialogue ownership, and verified Secret Tunnel profile bindings.
- [`VOICE-DIALOGUE-INVENTORY.json`](./VOICE-DIALOGUE-INVENTORY.json): exact authored German/Denglisch line pools and compositional quiz dialogue for dynamic speakers.
- [`MUSIC-SOUND-DESIGN.md`](./MUSIC-SOUND-DESIGN.md): music and nonverbal sound briefs, cue-to-state contracts, mix ownership, and audio evidence.
- [`AUDIO-TEXT-LIBRARY.md`](./AUDIO-TEXT-LIBRARY.md) and [`AUDIO-TEXT-LIBRARY.js`](./AUDIO-TEXT-LIBRARY.js): shipped speech IDs, source text, subtitles, triggers, and exclusions.
- [`QUIZ-CHARACTER-DICTIONARY.md`](./QUIZ-CHARACTER-DICTIONARY.md) and [`QUIZ-CHARACTER-DICTIONARY.js`](./QUIZ-CHARACTER-DICTIONARY.js): quiz identities, portraits, vocabulary, names, and category routing.
- [`chatdev/`](./chatdev/): shared production and review protocol, optional pinned Bürgeramt runner, and legacy Secret Tunnel handoff records.

Keep this index short. Add a document only when it has a distinct current owner and consumer.

<!-- rtk-workflow -->
## Shell output

Prefer supported RTK filters for human-read shell output; see the [RTK skill](skills/rtk/SKILL.md). Keep exact reads and parser input raw. Use bounded native commands when RTK is unavailable.
