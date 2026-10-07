# Street-character candidate: remaining gates

`assets/models/street-characters/PROVENANCE.md` owns source, size, license, and validation evidence. The pack is opt-in with `?streetCharacters=1` and remains **candidate-unapproved**. The accepted sprites, dialogue, voices, simulation, and default game remain authoritative.

Local checks completed on 2026-10-07: 25/25 focused tests; 228/228 full Node tests; deterministic eight-model export; Khronos validation with zero errors/warnings; pinned Three.js GLTFLoader import of every skin and clip; muted, background Chrome smoke checks for desktop/mobile default game, opt-in desktop, Bürgeramt, and `3d.html`. The current browser pass saw no page errors or failed requests. Generated GLBs were not shipped because runtime builds from the same source geometry.

Before default activation:

- Review each of the eight identities at front, side and back, close and game distance, including prop intersections and foot contact through starts, stops and turns.
- Exercise mobile opt-in play, failure injection, long sessions, doors, crossings, stations, and many nearby pedestrians. Measure frame time, draw calls and memory against the default game.
- Bind `Talk` and `Gesture` only to identified speaker events through the existing simulation bridge; verify cancellation and exact text/voice ownership.
- Obtain the user's visual acceptance before replacing accepted artwork or removing the opt-in gate.
