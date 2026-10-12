---
name: game-event-logic
description: Prove and audit gameplay event causality by tracing player actions through runtime mediators to reactions and story progression. Use for mission gates, action/reaction sequences, asynchronous scene events, or mismatches between implemented state and intended narrative consequences.
---

# Game Event Logic

Verify that the implemented causes, intermediate processes and consequences support the intended gameplay sequence. Review one action/reaction link or a bounded sequence. This skill owns causal correctness, including how state changes become information and opportunities for the player; it does not evaluate general fun, art quality or performance.

“Backend” means the authoritative gameplay logic wherever it runs: a client controller, simulation, server, event broker or device protocol. Do not introduce a server to create a backend to review. Use existing source, tests and traces. An audit produces findings; implement repairs only within the user's authorized task.

## Establish the claim

Read the user's intended behavior and applicable gameplay/story contract before interpreting the implementation. Keep intended requirements separate from inferred design and current behavior. Select the natural entry state, completion condition and consequential failure/retry branches. Record the candidate commit or changed-file hashes and the evidence available.

State each consequential claim as:

`Given [state and player knowledge], [action/event] causes [mediator changes], which permit or produce [reaction], yielding [story/gameplay consequence].`

Name what must not happen when the prerequisite is absent. Identify concurrent events that could produce the same outcome. Do not derive the expected outcome from the implementation under review.

## Map content to execution

Trace forward from the real input/event handler and backward from the resulting gate, dialogue, reward or scene transition. Include branches, joins and loops when they affect the claim. For each consequential edge, record:

| Story beat / player action | Runtime cause and guard | Mediator and committed state | Observable reaction / next opportunity | Source and evidence |
| --- | --- | --- | --- | --- |
| The intended occurrence and why it follows | Actual producer, prerequisites and eligible target | State owner, transition, message/receipt, timer or animation lifecycle | What the player can perceive and what becomes possible | Exact symbol/location, trace/test and evidence mode |

Keep an edge's explanation concrete: which changed value or accepted receipt causes the next consumer to act? A label, filename, emitted message or scheduled callback alone does not establish that the intended consumer accepted it.

Track the identity of the player, actor, object, ticket/quest and current attempt across the chain. Distinguish domain identity from render slots or transport IDs. Name the source of authority for every committed transition; projections should follow that authority. Check shared callers, alternate paths and resets for ways to bypass the prerequisite.

## Prove the mediation

Use the smallest relevant production-path experiment or source argument for each claim. Read [mediation probes](references/mediation-probes.md) for asynchronous/multiple-owner sequences or when designing counterexamples.

- **Positive path:** start from declared prerequisites, perform the cause, observe each required intermediate transition and its eventual consequence. Give waiting/recovery a bound justified by the contract.
- **Necessity:** withhold or invalidate the claimed prerequisite. The dependent reaction must remain unavailable unless a documented alternate cause applies.
- **Mediation:** hold the cause constant while delaying, suppressing or changing the intermediate process. The reaction should follow the accepted mediator and its identity. Account for common causes and alternate paths before claiming this proves necessity.
- **Ordering and ownership:** try a relevant duplicate, stale callback, reordered receipt, target change or attempt restart. Check that consequences belong to the correct current cause and occur the intended number of times.
- **Failure and recovery:** test the relevant missing result, cancellation, expiration or fallback. Determine which state remains committed, what the player sees and whether retry can proceed without stale progress.

A successful final state does not prove the intermediate causal chain. If a harness directly sets a gate or skips a mediator, it proves only behavior after that intervention. Drive production handlers and consumers when testing that edge; identify mocks and their unproved boundaries. Simulated transport cannot prove physical delivery or rendering. Reuse existing harnesses; do not build permanent telemetry or another event system for this review.

For timing-sensitive chains, identify clock domains, pause policy, deadlines and real start/done receipts. An elapsed estimate supports only the contracted fallback; it cannot silently stand for arrival, delivery, player observation or completed playback. Probe relevant boundaries and asynchronous races, rather than relying on one lucky frame order.

## Challenge story support

Compare the execution map with the intended progression. Check whether:

- The triggering action has the claimed consequence, and the consequence follows the intended target and attempt.
- A choice, challenge or discovered clue changes the gate that is supposed to depend on it; required steps cannot be bypassed through unrelated timers or UI updates.
- Dialogue, animation, sound and visible objects reflect committed state, with their documented fallback and interruption rules.
- Rewards, failure and next objectives occur at the claimed milestone, including branches that rejoin or retry.
- The player has the information and opportunity required for the next action. Preserve authored discovery, satire and deliberate ambiguity; causal clarity does not require explicit directions or a HUD marker.
- Autonomous world developments are distinguished from player-caused changes. Narrative assertions have an actual state/event basis, or are documented intentional unreliable narration.

Separate a broken runtime chain from a contradictory content contract, a presentation gap, a test/setup defect and unavailable evidence. Do not rewrite the story to make an accidental implementation appear correct.

## Return a bounded verdict

Report the candidate, scoped claims, causal map and per-claim **PASS**, **FAIL** or **NOT RUN**. For each result, name whether its basis is source reasoning, deterministic production-path execution, supplied evidence or fresh observed gameplay. A source-only PASS is limited to that source claim; it cannot certify natural traversal, visibility, physical devices or perceived audio. Reserve formal proof language for an explicit model and stated assumptions.

Each finding names the expected versus actual consequence, broken edge/mediator, reproducible counterexample, source owner and smallest coherent repair. Include unmet proof obligations and a next check when evidence is missing. If a requested claim has a required gap, leave its overall verdict outstanding; narrower proved claims may still pass. Keep output proportional to the sequence, and reuse the project's review format when available.
