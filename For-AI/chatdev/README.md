# Bürgeramt domain workflow and legacy ChatDev runner

Codex leads the work and owns integration. Use the domain and delegation routes in [`../SKILLS.md`](../SKILLS.md); select only affected areas, establish interfaces before parallel work, and keep one writer per file. The local ChatDev integration is an optional legacy runner for the Bürgeramt episode. Its stage graph can inspire domain handoffs, but it does not replace Codex routing, agent tools, review, or acceptance.

## Domain map

The pinned graph currently has twelve serial stages: Story → Storyboard → Character → ColorMood → Animation → Gameplay → Soundscape → Mix → Phone → Voice → Review → QA. Their individual contracts live in `subgraphs/`. A focused external run uses `-Stage <name>`; a full graph is unnecessary for a narrow change. The active domains for Codex-led work are summarized in [`SKILLS.md`](../SKILLS.md).

## Shared contracts and convergence

1. The integrator defines the bounded player/developer outcome, affected domains, base revision and checks. For cross-domain scenes, agree a beat card: trigger/guard, owner, exact text/cue ID, clock, start/done signals, pause/overlap, fallback and cleanup. Reuse the episode and audio catalogs. Resolve content/runtime constraints here, including phone line bounds, clause-triggered interruptions and visible-asset/collision attachment.
2. Dispatch independent workers with the [delegation brief](../SKILLS.md#delegation-and-review). One writer owns each file; the integrator serializes shared renderer, CSS and runtime edits. Workers can recommend another tier or subtask, but the integrator controls dispatch and the total concurrency limit.
3. Join accepted contributions into one candidate. Run affected independent reviews in parallel against that same revision: story/continuity, technical/browser evidence, and Ponytail scope/dependency review. Small changes use only applicable checks. A report does not replace actual browser, image or listening evidence.
4. Reconcile findings, rerun affected checks after repairs, and publish through the integrator. Keep task records and generated evidence in the chat/session output; only current contracts and durable rationale belong in `For-AI/`.

Each review returns **task and candidate revision** (commit or base plus changed-file hashes), **verdict** (`PASS`, `FAIL`, or `NOT RUN`), **checks actually run with results/evidence paths**, **limits**, and **actionable findings with owner**. Attribute supplied evidence separately from fresh checks. Calibrate model routing from first-pass correctness, repair effort and elapsed time; do not invent per-task cost figures or build a benchmark service.

## External runner limits

The runner targets OpenBMB ChatDev v2.2.0 at commit `3c72d860d2553f05129b7dff0fd4efdde5b01d2f` in the sibling `ChatDev` directory. `tools/chatdev.ps1 -ValidateOnly` checks local graph/tool structure and needs Python plus PyYAML only; it does not require that external checkout or credentials and does not execute a stage. Execution additionally needs the pinned external checkout, its Python environment, and local `API_KEY` or `OPENAI_API_KEY` configuration. The graph currently names `gpt-4o`; native Codex routing owns Luna/Sol/Astra task tiers and does not imply an API or ChatDev model migration. Do not claim external model execution or other tools are available unless confirmed in the current environment.

## Tool contract and prompts

The shared launcher, report output, and Voice Cloner sibling path use `CHATDEV_HOME`; it defaults to the pinned sibling checkout. Set it to that checkout when using a worktree. The bounded reader returns a JSON-encoded string with `path`, full-file `sha256`, character `offset`, `total_chars`, `next_offset`, and `content`. `read_game_file(path, offset=0, limit=20000)` accepts a character limit up to 50000; continue at `next_offset` until it is null. If the hash changes between reads, restart from the new version. Every source `save_*` call requires the full-file `expected_sha256` returned by the reader; a mismatch means reread and reconcile, never retry a stale write.

Only Story, Gameplay, and Phone have source write tools; other stages report proposals. Readers can access the project protocols in their allowlist, but a personal/global skill outside that allowlist cannot be fetched by the runner. The coordinator must include the concise relevant skill requirements in the task prompt. For a timing-sensitive beat, specify trigger, owner, exact displayed/spoken text, clock domain, start/done signals, required pauses and overlaps, fallback/timeout, and cancellation/cleanup. Use existing cue and audio-text catalogs; do not invent a separate timing engine.

The advertised `run_game_checks` tool is a fixed source-level check; it cannot perform Chromium or Android browser playtests or paired-device checks. Review every write in the integrated game. Binary art, playable integration, device/browser validation, listening review, and final acceptance remain with Codex and relevant independent reviewers.

If using the runner, do so from an integrator-owned `codex/` work branch, provide one bounded outcome and acceptance checks, inspect the full diff, run applicable project checks, then accept or reject the result. Do not let its direct-write stage overlap another writer. Keep ChatDev sessions, reports, voice references, and trial renders in the sibling checkout, never under shipped assets. Never copy API keys, private voice references, or session output into this repository. If the runner cannot be used, complete the same bounded domain work through available Codex skills and tools, and report the limitation.

## Historical Secret Tunnel handoffs

WebGPT Secret Tunnel 5 uses its separate repository-tool protocol in [`WEBGPT-COORDINATION.md`](./WEBGPT-COORDINATION.md) and the dated intake records in [`WEBGPT-HANDOFF.md`](./WEBGPT-HANDOFF.md). Preserve those findings as evidence, not as current task assignments or an alternate Codex workflow.
