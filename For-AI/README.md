# For AI

## Common control-plane contract

- **Boundary:** Product source, shipped assets, user documentation, and final deliverables stay outside this folder. This folder owns agent routing, durable context, verification policy, and decision pointers.
- **Authority:** Direct instructions and the nearest `AGENTS.md` win. Existing project documents remain authoritative for their named subjects; link instead of copying.
- **Skills:** Use `$ponytail` for every implementation, fix, refactor, code review, and technical design when available. Load other skills only for matching tasks; do not create speculative skill infrastructure.
- **Workflow:** Define one bounded outcome and its checks, reuse what exists, and make the smallest coherent diff.
- **Verification:** A task is ready only after focused checks, applicable full checks, diff review, and instruction synchronization. Report unrun checks and never overclaim evidence.
- **Self-update:** Update durable goals, constraints, decisions, routes, and gates in the same change that alters them. Do not keep chat logs, daily diaries, duplicate ledgers, generated evidence, or speculative backlogs.
- **Git:** Inspect status before and after work; stage only intended paths; use coherent, itemized commits; push validated completed work when branch policy permits. Never force-push, bypass protection, publish secrets, or absorb unrelated changes.
- **YAGNI:** Add a file here only when it has a distinct current owner and consumer. Prefer one section or link over a new document, script, dependency, or abstraction.


This directory is the durable context and instruction surface for Germany Simulator. It contains product facts and engineering decisions that should survive across agents and sessions.

Required starting point: [`AGENT-START.md`](./AGENT-START.md)

- [`GAMEPLAY.md`](./GAMEPLAY.md): authoritative gameplay rules, mission flow, controls, and satire boundaries.
- [`ASSET-POLICY.md`](./ASSET-POLICY.md): desktop/mobile asset strategy and YAGNI rules.
- [`SPRITE-GENERATION-PROTOCOL.md`](./SPRITE-GENERATION-PROTOCOL.md): fixed anatomical grid, gait keys, transition build, and visual QA for moving bitmap characters.
- [`SKILLS.md`](./SKILLS.md): required skill routing for different kinds of work.
- [`DECISIONS.md`](./DECISIONS.md): durable project decisions and their rationale.
- [`VOICE-SYNTH-PROTOCOL.md`](./VOICE-SYNTH-PROTOCOL.md): local XTTS-v2 voice-clone workflow, reference bank, batch-driving, and validation.
- [`AUDIO-TEXT-LIBRARY.md`](./AUDIO-TEXT-LIBRARY.md) and [`AUDIO-TEXT-LIBRARY.js`](./AUDIO-TEXT-LIBRARY.js): spoken-source/English subtitle authority, timed train cues, exclusions, and maintenance contract.
- [`QUIZ-CHARACTER-DICTIONARY.md`](./QUIZ-CHARACTER-DICTIONARY.md) and [`QUIZ-CHARACTER-DICTIONARY.js`](./QUIZ-CHARACTER-DICTIONARY.js): fictional quiz-person identities, portrait bindings, archetype vocabulary, name bank, and question-category routing.

Keep these files concise and factual. They are project memory, not a backlog or a substitute for source code.
