# Bürgeramt production workflow

The canonical game remains at repository root. OpenBMB ChatDev v2.2.0 is pinned at commit `3c72d860d2553f05129b7dff0fd4efdde5b01d2f` in the sibling `ChatDev` directory. Its sessions, research notes, reference audio, and trial renders stay outside this game checkout. Run `tools/chatdev.ps1 -ValidateOnly` before a session; run `tools/chatdev.ps1 -Prompt '...'` from a `codex/` work branch when the external ChatDev Python environment and local `API_KEY` are ready. Review and test its output in the game before committing. The `pre-chatdev-2026-10-05` tag and external snapshot preserve the pre-integration version.

For fast iterations, give ChatDev one outcome, relevant paths, current game
state, and acceptance checks. Reuse the Story → Gameplay → Phone → Voice →
Review → QA graph when those domains change together; route a sprite-only
change through its builder and focused playtest. Read stage reports from the
external session directory, accept verified diffs, and keep one integrator
responsible for the root game. Incoming WebGPT chats using Secret Tunnel 5
follow [WEBGPT-COORDINATION.md](./WEBGPT-COORDINATION.md); their accepted
brief is summarized in [WEBGPT-HANDOFF.md](./WEBGPT-HANDOFF.md).

For a single changed domain, pass `-Stage Story`, `Gameplay`, `Phone`,
`Voice`, `Review`, or `QA` to `tools/chatdev.ps1` along with a short
`-Prompt`; omit `-Stage` for the full graph. A focused stage still needs
local review and the relevant tests before its output is accepted.

| Stage | Owns | Check before handoff |
| --- | --- | --- |
| Story | Original German waiting-room, counter, police, and Frau Knick lines | Early, late, answer, and decline branches; visible text equals speech |
| Gameplay | First-person movement, one-code board, desk interactions, A38 handoff | Mission 1 and original eight-step chain still work |
| Phone | QR ticket, VDO.Ninja data events, fullscreen call look | Real paired-browser answer and decline sync; no camera or microphone |
| Voice | Licensed distinct references, profiles, exact-line renders | Source/license/hash, listening review, normalized and cataloged clips |
| Review | Read-only continuity, protocol, asset, and language audit | Concrete file/line findings |
| QA | Syntax, game tests, silent desktop/mobile playtest | Browser errors and both outcome branches reported |

`For-AI/chatdev/functions/game_tools.py` restricts agent reads and writes to named game files. It puts reports in ChatDev's external session directory. Its voice functions require a working local Voice Cloner installation; the game runs with German browser speech in the meantime. Never save an API key, private voice reference, or ChatDev session output under `assets/`.

Voice source status: the saved `GS police-officer` profile uses a cataloged CC0 reference. `GS Frau Knick` was created from a 22-second section of [Legamus's German Ramona Deininger-Schnabel CC0 recording](https://legamus.eu/blog/archives/670), with both profile ID and source hash in the audio catalog. Exact-story smoke lines for both speakers and a telephone-filtered police preview live only in ChatDev's external `WareHouse/germany-voice-reference/`. A whole-file automated German transcript is recorded there, but listening and line-by-line approval remain before any recorded game clip ships. A reusable, single-speaker YouTube upload with confirmed source rights was not verified, so the licensed local reference remains the source.

To play the episode without crossing the city, open `index.html?geheim=buergeramt` through the project's HTTP site. The page includes a restart link for another attempt.
