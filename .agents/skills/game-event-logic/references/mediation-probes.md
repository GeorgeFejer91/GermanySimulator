# Mediation probes

Use these probes only where the chain needs them. Their purpose is to separate an actual dependency from events that merely occur together.

## Cause, mediator and consequence

Represent a questioned edge as `A → M → R`: cause A changes mediator M, whose accepted state permits reaction R. Add a competing cause C, or an alternate mediator, if production code admits one. An A/R timestamp correlation is not enough.

For example, submitting a name requests a ticket. The phone's accepted current-ticket receipt commits eligibility; an active board call and interaction at the matching desk then permit dialogue. Requesting or transmitting the ticket, rendering a number locally, receiving an obsolete receipt and approaching another desk are distinct events. The story contract decides which of them is required; the reviewer must not invent a receipt requirement for every game.

For each important transition distinguish:

`requested → produced → sent → accepted → committed → projected → actionable`

Include only stages that exist. Name the acceptance predicate and the consumer that enables the next action. A transport acknowledgement need not mean the content was displayed, and a display need not mean a person noticed it. Claims about those later stages require their own evidence.

## Select a distinguishing probe

| Questioned dependency | Intervention | Evidence to seek |
| --- | --- | --- |
| Does A actually cause M? | Compare valid A with absent or rejected A, holding other eligible causes constant | M changes only through the documented producer/guard |
| Does M mediate R? | Deliver A but hold M pending; then release the accepted result | R waits for M and advances at its committed milestone |
| Is M necessary on this path? | Suppress or invalidate M and inspect alternate routes | No unexplained R; report legitimate alternate paths |
| Is an accepted M sufficient? | Supply valid M under the stated other prerequisites | R occurs within the contract's bound, or another prerequisite is identified |
| Is the reaction assigned correctly? | Change target, receipt identity or attempt after A | Only the eligible current target/attempt receives R |
| Is progression committed once? | Duplicate delivery/completion; replay an obsolete event | Reward, expiry or transition follows the documented repeat policy |
| Does timing represent the story milestone? | Vary producer/transport/media/animation delay independently of the simulation timer | R tracks actual milestone receipts or an explicitly contracted fallback |
| Can failure recover? | Cancel or expire between commit and reaction; start a fresh attempt | Partial state has defined cleanup, and obsolete work cannot complete the new attempt |

Treat these as counterexample searches, not a quota. Choose probes that distinguish plausible implementations of the claimed rule. A simple synchronous link may need only a positive case and an absent-prerequisite case.

## Temporal and multi-owner chains

Record the smallest relevant event trace: candidate, attempt/event/target IDs, producer and consumer, prior state, accepted/rejected cause, committed state, clock domain and observed consequence. Correlate existing receipts before adding instrumentation; any temporary hooks belong to the fixture, and their effect on execution must be disclosed.

Inspect joins as well as arrows. `ticket received AND active call AND matching desk` is a conjunction; one green flag must not stand for the whole guard. Inspect competing transitions such as `arrival OR timeout`, including simultaneous boundary events and the documented winner. Inspect loops: an iteration's pending callback must not act on the next iteration's state by accident.

Use separate runs to expose relevant schedule sensitivity: pause/resume, delayed readiness, zero or partial elapsed time, crossing a deadline and late completion after cancellation. Preserve the production clock contract. Accelerated simulated time cannot establish real-media completion or network latency.

Trace promises and callbacks through cleanup. Test cancellation after scheduling and before acceptance, including a new attempt that happens to reach the same named stage. Stage equality alone may not identify the correct operation. Check timer/source disposal and pending work only insofar as it can cause an unwanted later reaction.

## Findings and evidence

For a broken chain, give a minimal trace such as:

```text
Contract: arrival enables the exchange.
Observed: move requested → timer fires → exchange enabled → arrival still pending.
Broken mediation: the timer commits eligibility independently of the arrival result.
Evidence: production handler/consumer locations and the delayed-arrival reproduction.
Repair: commit eligibility from accepted current-arrival completion; retain only the
contracted timeout/failure behavior, then check cancellation and late completion.
```

Mark forced states and mocked boundaries. A trace ending at “sent” leaves “accepted” unproved. A debug scene beginning after eligibility cannot validate its unlock. Source inspection can identify a bypass without a human playtest; it still does not establish what a player saw or understood.

Keep intentionally misleading fiction separate from implementation inconsistency. A lying NPC can be correct content while the underlying quest gate remains deterministic. Report whether the contradiction is authored, inferred or accidentally produced by runtime state.
