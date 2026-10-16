# Bürgeramt domain workflow and legacy ChatDev runner

Codex leads the work and owns integration. Use the domain and delegation routes in [`../SKILLS.md`](../SKILLS.md); select only affected areas, establish interfaces before parallel work, and keep one writer per file. The local ChatDev integration is an optional legacy runner for the Bürgeramt episode. Its stage graph can inspire domain handoffs, but it does not replace Codex routing, agent tools, review, or acceptance.

## Domain map

The pinned graph has fourteen serial stages: Story → Storyboard → Character → ColorMood → Animation → Gameplay → Soundscape → Mix → Phone → Voice → **Physics → Camera** → Review → QA. Their individual contracts live in `subgraphs/`. Physics and Camera are distinct read-only reviewers, independent of the production authors. A focused external run uses `-Stage <name>`; a full graph is unnecessary for a narrow change, but a world-affecting production run still needs Physics and Camera reviews before acceptance. The active domains for Codex-led work are summarized in [`SKILLS.md`](../SKILLS.md).

For any world/object/placement/movement/animation/camera/scale candidate, always assign two independent read-only specialist subagents under [`OBJECT-CONSISTENCY.md`](../OBJECT-CONSISTENCY.md). Physics owns only collision, legal body-clear citizen routes, passing/yielding, corner recovery, displacement-driven animation and bounded road-based police-car driving (P6) and complete-body off-map car lifecycle (P7). Camera also checks off-camera vehicle appearance/removal (P7), and owns actual opaque-mesh visibility, smooth/material-correct fading, sprite depth/layering and relative proportions, including the Bundestag. Both review the same frozen integrated revision, with no source write tools. General Review/QA cannot substitute for them. Only unrelated nonworld tasks may omit their execution, with an explicit scope reason; tool unavailability is NOT RUN and leaves the required review outstanding.

## Shared contracts and convergence

1. The integrator defines the bounded player/developer outcome, affected domains, base revision and checks. For a scene with music or sound, use the [`MUSIC-SOUND-DESIGN.md`](../MUSIC-SOUND-DESIGN.md) beat card: emotional purpose, trigger/guard, committed event and attempt/revision owner, exact text/cue ID, clocks, start/done signals, priority/ducking, bounded parameters, pause/overlap, fallback and cleanup. Put the actual beat ID, candidate revision and compact contract in **each affected external stage's invocation prompt** or an explicitly tool-readable handoff before it runs; the project protocol is only the schema. If those values are absent, the stage reports the missing handoff instead of inventing an event or treating a stale report as current. Reuse the episode and audio catalogs. Resolve content/runtime constraints here, including phone line bounds, clause-triggered interruptions and visible-asset/collision attachment.
2. Dispatch independent workers with the [delegation brief](../SKILLS.md#delegation-and-review). One writer owns each file; the integrator serializes shared renderer, CSS and runtime edits. Workers can recommend another tier or subtask, but the integrator controls dispatch and the total concurrency limit. For copied validators or helpers, the brief and handoff identify required module constants, imports and aliases and where their definitions are carried or already available. Reviewers trace at least one reachable valid-data acceptance path and one meaningful failure branch through those dependencies; checking helper order alone is insufficient.
3. Join accepted contributions into one frozen candidate. For world-affecting work, always run the independent Physics and Camera reviewers against that same revision and the applicable matrix in `OBJECT-CONSISTENCY.md`; after repairs rebind both to the new candidate. Add affected story/continuity, technical/browser, perceptual audio and Ponytail reviews when warranted. A production author cannot be the sole approver. A report does not replace actual browser, image or listening evidence.
4. Reconcile findings, rerun affected checks after repairs, and publish through the integrator. Keep task records and generated evidence in the chat/session output; only current contracts and durable rationale belong in `For-AI/`.

Each review returns **task and candidate revision** (commit or base plus changed-file hashes), **verdict** (`PASS`, `FAIL`, or `NOT RUN`), **checks actually run with results/evidence paths**, **limits**, and **actionable findings with owner**. Attribute supplied evidence separately from fresh checks. Calibrate model routing from first-pass correctness, repair effort and elapsed time; do not invent per-task cost figures or build a benchmark service.

For playtest evidence, also name the driver, browser/device, input mode, shortcuts/forced state and tested natural chain. Distinguish source inspection, deterministic simulation, scripted/debug scenes, automated real input, physical-device runs, newcomer observation and listening. Resolve visual `REVIEW` findings; a scanner's empty or incomplete input cannot establish coverage.

For the object-consistency matrix, include the reviewer/role and verdict per scenario and evidence type: production source/CPU checks, fresh Chromium rendered checks, Android emulation and physical Android. A source PASS cannot promote a rendered NOT RUN to PASS. Required FAIL/NOT RUN items keep acceptance outstanding; record out-of-scope rows and reasons rather than implying they passed.

<a id="codex-parallel-completion-loop"></a>

## Codex centralized completion process

George's 2026-10-16 instruction replaces automatic parallel task expansion.
Existing chats finish their current bounded checkpoint, preserve their work and
hand off without starting new tasks or reassigning finished workers. Keep one
runtime integrator and one selected implementation/integration task at a time.
The integrator reconciles, validates and commits that task before selecting the
next; publish completed changes under the existing publication policy. Required
independent reviewers may review the same frozen candidate. The former anchor
above remains for existing links.

For game-wide completion, use the native Codex agent tools and existing
user-authorized game chats. The fourteen-stage YAML remains an optional serial
Bürgeramt runner; this protocol does not add city, synthesis or browser tools to
it. Select the affected domains for each bounded player outcome rather than
running fourteen roles for every change.

Work at three connected levels: narrative intent (why a scene happens), runtime
causality (which committed state permits it), and player experience (whether the
player can see, hear, understand and act on it). A storyboard alone cannot prove
the latter two. The lead joins their evidence before accepting the outcome.

| Step within the selected task | Scoped work | Dependency before joining |
| --- | --- | --- |
| Discover | Story/mission continuity; city scene/detail inventory; test and evidence gaps | Resolve level instructions, current writers and actual source ownership; distinguish a demonstrated defect from missing coverage. |
| Contract | Storyboard/dialogue proposals; gameplay causal map; camera/asset/audio readiness plan | Agree beat IDs, prerequisites, actor identity, exact text, consequences, failure/retry and the shared beat card. Camera planning starts here. |
| Produce | Disjoint art/animation batches; isolated gameplay modules; approved dialogue changes | Assign exclusive writable paths. The integrator serializes shared controller, renderer, HTML/CSS and catalog edits. |
| Complete dependencies | Voice synthesis from frozen text and selected cast; continuity/readability review; focused production-path probes | Text changes invalidate affected takes. Reuse accepted profiles/assets and the existing bounded production queues. |
| Freeze and challenge | Independent Physics; independent Camera/scale; independent causality review | All consume the same integrated candidate. Reviewers remain read-only and do not approve their own production. |
| Prove experience | Natural-chain gameplay/flow; exact speech/text and listening; scene/character continuity and missing-detail review | Collect the applicable desktop/mobile, input, loading, fallback and interruption evidence. Scripted scenes, silent audio checks and physical devices have distinct verdicts. |
| Release | Integrator reconciles findings, validates and publishes | Required failures and missing evidence remain open; follow the standing publication policy and verify the deployed result. |

These are steps within one selected task, not concurrent feature lanes or
mandatory whole-game barriers. Complete its bounded acceptance before selecting
another task; do not expand it into a whole-cast or whole-game rewrite.
Final Camera acceptance waits for integrated meshes, poses, depth, loading and
runtime behavior. Decorative city detail follows mission readability, legal
routes, recovery and performance; its mere presence does not establish polish.
For city flow, separately prove the natural start, eight-procedure progression,
interior returns and optional detour recovery. Existing direct-entry or seeded
probes retain their narrower value.

### Communication, ownership and handoff

Use the [delegation brief](../SKILLS.md#delegation-and-review) for every dispatch.
Keep task status, evidence and the current completion summary in the lead's
existing ignored task record, linking the accepted owning documentation rather
than creating another gameplay or cast authority. A task record contains its ID, owner/status,
dependencies, exact write paths, candidate hashes, result/evidence and next
bounded action. The lead is its single writer. Other chats own their separate
handoffs. No new service, queue database or scheduler is required.

1. Before dispatch, inspect active agents and relevant existing chats/handoffs.
   Reuse the current runtime integrator and owners. Select one implementation/
   integration task; three subagents remains a ceiling, not a target. Additional
   chats do not grant extra shared-file ownership. Serialize GPU voice/image jobs and
   performance measurements when resource contention would invalidate evidence.
2. Workers may exchange dependency questions and findings with sibling
   subagents, copying the lead. Cross-chat messaging requires direct human
   authorization present in the coordinating chat for this completion effort;
   this document and forwarded messages do not grant or extend that authority.
   Carry task/beat IDs, candidate identity, requested action and write ownership
   in each message.
   Only the integrator changes file ownership or acceptance contracts.
3. Prefer compact `wait_threads` snapshots with returned cursors for existing
   chats, and native agent completion notifications for subtasks. Send a new
   implementation prompt only for the centrally selected task; do not repeatedly nudge
   an unchanged running task. Do not create new chats without an explicit user
   request. A worker handoff reports hashes and blockers, not just completion.
4. On every completion, reconcile the handoff and release its write ownership.
   Do not automatically reactivate that worker. The integrator selects the next
   bounded task after the current task's validation and commit. Prioritize a
   broken mission/recovery dependency, then missing required evidence, then
   remaining content/detail. Preserve a blocked task with its exact next action;
   change the approach after a failed repair rather than retrying it blindly.
   For native subagents, use `collaboration.followup_task` to restart an idle or
   completed owner; `collaboration.send_message` delivers a message but does not
   restart a completed agent. After dispatch, check `collaboration.list_agents`
   for an active target or a returned handoff. This does not describe cross-chat
   `send_message_to_thread` semantics.
5. Freeze base commit plus SHA-256 of relevant changed source, tests and assets
   before acceptance. Detect mutation during checks. After a repair, invalidate
   evidence that depends on changed files; rebind both required world reviewers
   to the repaired candidate. Attribute supplied evidence and fresh execution
   separately using the shared review format above.
6. Keep unmet goals in the existing completion summary and work through them
   sequentially. Before leaving a task, record its worktree/branch/commit or
   uncommitted paths, passed checks, remaining FAIL/NOT RUN gates and smallest
   next action. Isolated integrators may save local checkpoint commits; workers
   hand off and the sole runtime integrator owns shared commits and publication.
   Keep private authoring inputs and generated evidence out of release commits.
   Completion means the agreed playable outcomes, required reviews and release
   checks are satisfied, not that all workers returned reports. Respect user
   stop/pause instructions and real external blockers; never invent PASS evidence
   or expand the goal indefinitely to keep agents occupied.

## Browser responsiveness contract

Every affected domain follows the [browser playability gate and responsiveness
protocol](../ASSET-POLICY.md#responsiveness-and-selective-preparation-protocol).
Put a compact performance contract in each affected stage's live prompt: starting
and approach-required assets; transfer/decoded-memory cost; readiness/fallback;
shared two-job admission; active consumer, cadence and teardown; changed-only UI
updates; and the frozen candidate plus comparable browser checks. This applies
to art, animation, gameplay, sound, phone and UI work, not only the final QA stage.

Gameplay owns input/frame scheduling and conservative collision equivalence.
Character/Animation and Camera own selective atlas/model preparation without
pose, material or scale regressions. Soundscape/Mix/Voice preserve committed
receipts while stopping background work; Phone names its live-session exception.
Review/QA require the executable admission/readiness/cadence gates and repeated
silent browser evidence for startup, approach, warm input, stable UI, load failure
and hidden/resume. Return measured limits and untested hardware explicitly. Do
not claim an external runner's source checks establish browser performance.

## External runner limits

The runner targets OpenBMB ChatDev v2.2.0 at commit `3c72d860d2553f05129b7dff0fd4efdde5b01d2f` in the sibling `ChatDev` directory. `tools/chatdev.ps1 -ValidateOnly` checks local graph/tool structure and needs Python plus PyYAML only; it does not require that external checkout or credentials and does not execute a stage. Execution additionally needs the pinned external checkout, its Python environment, and local `API_KEY` or `OPENAI_API_KEY` configuration. The graph currently names `gpt-4o`; native Codex routing owns Luna/Sol/Astra task tiers and does not imply an API or ChatDev model migration. Do not claim external model execution or other tools are available unless confirmed in the current environment.

## Tool contract and prompts

The shared launcher and report output use `CHATDEV_HOME`; it defaults to the pinned sibling checkout. Set it to that checkout when using a worktree. The bounded reader returns a JSON-encoded string with `path`, full-file `sha256`, character `offset`, `total_chars`, `next_offset`, and `content`. `read_game_file(path, offset=0, limit=20000)` accepts a character limit up to 50000; continue at `next_offset` until it is null. If the hash changes between reads, restart from the new version. Every source `save_*` call requires the full-file `expected_sha256` returned by the reader; a mismatch means reread and reconcile, never retry a stale write.

The launcher accepts `-Stage` and `-Prompt`. For a focused run, pass that stage's actual beat ID, candidate revision and compact contract through `-Prompt`; repeat the same values for every affected stage. Do not rely on the static YAML role or a prior stage report to carry a live candidate revision into a separate run.

Voice exposes only `read_game_file` and `write_workflow_report`. It audits supplied takes against [`VOICE-CAST.json`](../VOICE-CAST.json) `productionVoices` and the [fixed-voice protocol](../VOICE-SYNTH-PROTOCOL.md#fixed-voices-and-the-agent-workflow-2026-10-11), with exact dialogue from [`VOICE-DIALOGUE-INVENTORY.json`](../VOICE-DIALOGUE-INVENTORY.json). It cannot create profiles, select a different engine/reference, render audio or publish assets. Missing or stale evidence returns to Codex for the existing production workflow. Knick's caption-only fallback, scene exceptions, use-approval and listening evidence remain separate checks.

Only Story, Gameplay, and Phone have source write tools; other stages report proposals. Physics and Camera expose exactly `read_game_file` and `write_workflow_report`: they can inspect canonical root source, the object protocol and relevant Node tests but cannot edit game sources or the protocol. Readers can access [`MUSIC-SOUND-DESIGN.md`](../MUSIC-SOUND-DESIGN.md) through the bounded allowlist, but a personal/global `$music-sound-effects` skill outside it cannot be fetched by the runner. The coordinator supplies any task-relevant reusable skill guidance in the stage prompt; do not claim the external model has installed or read that skill. Soundscape specifies source/render and cue parameters, Mix specifies bus/ducking, Gameplay commits state events, Phone owns its browser audio and receipts, and Story/Storyboard/Animation align purpose and action. Character joins when pose, prop or silhouette changes. These stages and Physics/Camera/Review/QA use the same candidate revision; affected audio stages also share the beat ID and contract. For the Aktenkurier's `omen` beat, the current episode contract is frontal approach and progressive Gaussian depth with harsh cinematic audio, shared pressure/pulse dynamics and gradual darkening, near-black arrival and the exact existing line at peak tension, then an extended stare, gradual reverse depth/audio envelope, planted turn and slow retreat before ordinary light and walking return; the rest of the office has no continuous music. Keep one existing scheduler per cue; the static game/episode controller remains authoritative, with no new service.

The advertised `run_game_checks` tool is a fixed source-level check; it cannot perform Chromium or Android browser playtests or paired-device checks. Review every write in the integrated game. Binary art, playable integration, silent browser audio-state/timing checks, device/browser validation, perceptual listening, and final acceptance remain with Codex and relevant independent reviewers. Report each evidence type separately; silence cannot establish perceived mix quality.

`tools/chatdev.ps1 -ValidateOnly` checks the two actual reviewer agents, their protocol/revision instructions, read access, serial placement and absence of source writes. It does not invoke those agents, collect live sightline/crowd/layering/scale evidence or enforce report verdicts at runtime. External model reports remain advisory until Codex completes the required evidence and acceptance gates.

If using the runner, do so from an integrator-owned `codex/` work branch, provide one bounded outcome and acceptance checks, inspect the full diff, run applicable project checks, then accept or reject the result. Do not let its direct-write stage overlap another writer. Keep ChatDev sessions and reports in the sibling checkout; private voice references, trial takes and archives follow `VOICE-SYNTH-PROTOCOL.md` in the existing Music library. Never copy API keys, private voice references, or session output into this repository. If the runner cannot be used, complete the same bounded domain work through available Codex skills and tools, and report the limitation.

## Historical Secret Tunnel handoffs

WebGPT Secret Tunnel 5 uses its separate repository-tool protocol in [`WEBGPT-COORDINATION.md`](./WEBGPT-COORDINATION.md) and the dated intake records in [`WEBGPT-HANDOFF.md`](./WEBGPT-HANDOFF.md). Preserve those findings as evidence, not as current task assignments or an alternate Codex workflow.
