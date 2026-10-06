# Bürgeramt production workflow

The canonical game remains at repository root. OpenBMB ChatDev v2.2.0 is pinned at commit `3c72d860d2553f05129b7dff0fd4efdde5b01d2f` in the sibling `ChatDev` directory. Its sessions, research notes, reference audio, and trial renders stay outside this game checkout. Run `tools/chatdev.ps1 -ValidateOnly` before a session; run `tools/chatdev.ps1 -Prompt '...'` from a `codex/` work branch when the external ChatDev Python environment and local `API_KEY` are ready. Review and test its output in the game before committing. The `pre-chatdev-2026-10-05` tag and external snapshot preserve the pre-integration version.

For fast iterations, give ChatDev one outcome, relevant paths, current game
state, and acceptance checks. The complete graph runs Story → Storyboard →
Character → ColorMood → Animation → Gameplay → Soundscape → Mix → Phone → Voice →
Review → QA. Run only changed stages for a focused request, then integrate
their accepted handoffs before Review and QA. A sprite-only change still
needs its actual atlas builder, image-frame gate and browser playtest. Read stage reports from the
external session directory, accept verified diffs, and keep one integrator
responsible for the root game. Incoming WebGPT chats using Secret Tunnel 5
follow [WEBGPT-COORDINATION.md](./WEBGPT-COORDINATION.md); their accepted
brief is summarized in [WEBGPT-HANDOFF.md](./WEBGPT-HANDOFF.md).

For a single changed domain, pass `-Stage <name>` to `tools/chatdev.ps1`
with a short `-Prompt`; omit `-Stage` for the full graph. Validation
checks YAML and tool scopes; it does not execute any stage. A focused stage
still needs local integration review and relevant tests.

| Stage | Owns | Check before handoff |
| --- | --- | --- |
| Story | German dialogue, speaker identity, tone and emotional valence | Early, late, answer, decline and optional encounters; visible text equals speech |
| Storyboard | Visible office beats, actor actions, camera and exit conditions | Every dialogue cue has an owner and a stage transition |
| Character | Painted identity, four views, prop hand and source provenance | Source views and planted work poses match one body |
| ColorMood | Dialogue valence, tone palette, tint strength and easing | Only the visible speaker changes; paint and legibility survive |
| Animation | Distance-driven walks, planted actions, turns and encoded-frame review | Native desktop/mobile motion, pivots and triggers pass |
| Gameplay | First-person movement, NPC routes, proximity, queue and A38 state | Mission 1 and original eight-step chain still work |
| Soundscape | Sparse office cues and ambience without music | Effects stay below dialogue and stop on close/replay |
| Mix | Separate room, effects, office voice and phone call levels | Controls work on desktop and phone; speech remains intelligible |
| Phone | QR ticket, VDO.Ninja data events, incoming call controls | Real paired-browser answer and decline sync, bounded ping/pong and speech receipts; no camera or microphone |
| Voice | Licensed distinct references, profiles, exact-line renders | Source/license/hash, listening review, normalized and cataloged clips |
| Review | Read-only continuity, protocol, asset, language and mix audit | Concrete file/line findings |
| QA | Syntax, game tests, silent desktop/mobile playtest | Browser errors, optional actor routes, both phone outcomes, timing diagnostics and lost-cue fallback reported |

Only Story, Gameplay and Phone have write tools in the external graph, each
restricted to its own file set. Visual assets, renderer changes, sound engine
and volume UI remain integrator changes after their stage reports. Browser
speech cannot pass through a Web Audio gain node; mix controls must set each
utterance's volume. The game and phone are separate devices and keep separate
audio settings. If the local API key is absent, perform the same bounded
domain review manually and report that ChatDev itself did not execute.

`For-AI/chatdev/functions/game_tools.py` restricts agent reads and writes to named game files. It puts reports in ChatDev's external session directory. Its voice functions require a working local Voice Cloner installation; the game runs with German browser speech in the meantime. Never save an API key, private voice reference, or ChatDev session output under `assets/`.

The voice functions use local Voice Cloner port `18765` because `8765` is
already occupied on this PC. `VOICE_CLONER_PORT` overrides it for another
machine or an existing worker. The port selects only the local Voice Cloner
worker; no phone or game traffic uses it.

Voice source status: the saved `GS police-officer` profile uses a cataloged CC0 reference. `GS Frau Knick` was created from a 22-second section of [Legamus's German Ramona Deininger-Schnabel CC0 recording](https://legamus.eu/blog/archives/670), with both profile ID and source hash in the audio catalog. Exact-story smoke lines for both speakers and a telephone-filtered police preview live only in ChatDev's external `WareHouse/germany-voice-reference/`. A whole-file automated German transcript is recorded there, but listening and line-by-line approval remain before any recorded game clip ships. A reusable, single-speaker YouTube upload with confirmed source rights was not verified, so the licensed local reference remains the source.

To play the episode without crossing the city, open `index.html?geheim=buergeramt` through the project's HTTP site. The page includes a restart link for another attempt.
