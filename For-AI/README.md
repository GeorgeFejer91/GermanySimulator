# For AI

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
