# Bürgeramt production workflow

The canonical game remains at repository root. OpenBMB ChatDev v2.2.0 is pinned at commit `3c72d860d2553f05129b7dff0fd4efdde5b01d2f` in the sibling `ChatDev` directory. Its sessions, research notes, reference audio, and trial renders stay outside this game checkout. Run `tools/chatdev.ps1 -ValidateOnly` before a session; run `tools/chatdev.ps1 -Prompt '...'` from a `codex/` work branch when the external ChatDev Python environment and local `API_KEY` are ready. Review and test its output in the game before committing. The `pre-chatdev-2026-10-05` tag and external snapshot preserve the pre-integration version.

| Stage | Owns | Check before handoff |
| --- | --- | --- |
| Story | Original German waiting-room, counter, police, and Frau Knick lines | Early, late, answer, and decline branches; visible text equals speech |
| Gameplay | First-person movement, one-code board, desk interactions, A38 handoff | Mission 1 and original eight-step chain still work |
| Phone | QR ticket, VDO.Ninja data events, fullscreen call look | Real paired-browser answer and decline sync; no camera or microphone |
| Voice | Licensed distinct references, profiles, exact-line renders | Source/license/hash, listening review, normalized and cataloged clips |
| Review | Read-only continuity, protocol, asset, and language audit | Concrete file/line findings |
| QA | Syntax, game tests, silent desktop/mobile playtest | Browser errors and both outcome branches reported |

`For-AI/chatdev/functions/game_tools.py` restricts agent reads and writes to named game files. It puts reports in ChatDev's external session directory. Its voice functions require a working local Voice Cloner installation; the game runs with German browser speech in the meantime. Never save an API key, private voice reference, or ChatDev session output under `assets/`.

Voice source shortlist: the saved `GS police-officer` profile already uses a cataloged CC0 reference. For Frau Knick, [Legamus's German Ramona Deininger-Schnabel recording](https://legamus.eu/blog/archives/670) explicitly labels the recording CC0; audition a clean short section before binding it to her character. A reusable, single-speaker YouTube upload with confirmed source rights was not verified, so the workflow also accepts a licensed local reference file. No new profile or game clip has been generated yet.

To play the episode without crossing the city, open `index.html?geheim=buergeramt` through the project's HTTP site. The page includes a restart link for another attempt.
