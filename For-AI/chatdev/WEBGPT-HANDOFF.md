# WebGPT handoff register

Coordinator-owned intake for Secret Tunnel 5 contributors. The current
integrator updates this file after assigning or accepting work. Incoming chats
read it; each writes only its own uniquely named proposal in
`webgpt-inbox/` unless granted an exclusive source path. See
[WEBGPT-COORDINATION.md](./WEBGPT-COORDINATION.md).

## Active intake

`AMT-LAYOUT-AUDIT` from the WebGPT retry chat is **closed as a scoped
review**. Its proposal is
`webgpt-inbox/amt-layout-audit-webgpt-retry-20261006.md`. The integrator
aligned the visible doorway with the simulation threshold, built four
counters with Schalter 3 inside the desk span, and added furniture collision.
The entrance now requires its door interaction, and the clerk encounter
stays on the public side of the desk. The silent first-person desktop,
mobile, and narrow viewport playtest reported no browser errors or layout
overflow; the focused boundary tests pass. The WebGPT chat did not own
a runtime source path. Its file hashes were review context, not a Git base.

`QA-01` runtime repair from `webgpt-v5-runtime-20261006` is **accepted** after
native syntax checks, 52 focused host/phone/transport tests, a silent
desktop/mobile room playtest, and live paired-browser answer/decline checks.
The integrator retained the source already on disk and added entrance,
counter, and invalid-frame regressions. The navigation proposal from
`webgpt-navigation-20261006-07521a` is **accepted in part**: its public-side
camera, entrance guard, finite frame delta, and furniture collision findings
were reconciled against newer source. Its older full-file candidate was not
applied. `QA-01-webgpt-20261006-7c92` is **accepted in part**: the browser
runners now fail on missing pairings, HTTP errors, invalid room checkpoints,
and incomplete outcomes, and they check narrow/200% zoom. Its older
whole-file patch was not applied. `ENV-01-webgpt-office-20261006` is
**accepted in part**: the coordinator copied only its code-authored detail
group, shifted Schalter 3's CRT clear of Frau Knick's face, preserved the
existing room patina, and connected its eight furniture footprints to
collision after successful attachment. The older office renderer and
candidate test double were not copied. The real browser desktop/mobile/narrow
playtest verified QR visibility, moving sprites, and clear room navigation;
2,135 primitives are grouped into 24 static draws. Keep the proposal file as
an intake record, not runtime authority.

## Task record

```text
ID:
Owner / originating chat:
Outcome:
Base commit:
Dependencies:
Read paths:
Exclusive write paths (or proposal only):
Acceptance checks:
Proposal path:
Status: assigned | submitted | accepted | needs revision | closed
Integrator decision / evidence:
```

## Work available to incoming chats

Agents can choose an unassigned ID below and create only
`webgpt-inbox/<id>-<agent>-claim.md` with their chat label, intended
deliverable, and the current base commit. Use `expected_missing` for that
unique file. The integrator checks scope and records the owner above before
any shared source edit. Until assigned, the agent may research and prepare a
proposal but may not rewrite game files. The integrator can split a task or
assign a separate worktree if two chats need the same path.

| ID | Priority / ChatDev stage | Concrete deliverable | Check for acceptance |
| --- | --- | --- | --- |
| ART-01 | High / Gameplay + Review | Design connected stamp, scold, and paper-shuffle action keys for Frau Knick. Propose art under `assets/sprite-sources/buergeramt/`; leave current idle atlas intact until reviewed. | Stable identity and baseline, enough distinct inbetweens at 24 fps, cell gutters, no hand/face snap, ordered desktop/mobile motion. |
| ENV-01 | Closed / Gameplay + QA | Accepted scoped office dressing and collision integration. | Future area edits require their own visual and performance review. |
| STORY-01 | Medium / Story + Review | Polish the German-only Frau Knick/police exchange, especially the counter-phone overlap and cancelled appointment, in a proposed dialogue diff. | Answer has no player choices; decline retains choices and A38; visible words equal spoken words on each screen. |
| PHONE-01 | High / Phone + QA | Exercise real phone-to-desktop VDO.Ninja pairing, registration, foreground requirement, call answer/decline, reconnect and late/early branches; submit a compact issue report or focused fix. | Two real browsers sync without camera/microphone; no choice on answer branch; pairing failures and privacy behavior are documented. |
| VOICE-01 | Medium / Voice + Review | Find reusable German reference audio with verifiable rights for Frau Knick and officer, audition source segments, and prepare Voice Cloner profile briefs outside game assets. | License, speaker, source, exact segment, hash, listening notes, and clean static/telephone effect proposal; no unverified YouTube voice is cloned. |
| QA-01 | High / QA | Run silent desktop/mobile/320px/200% playthroughs of the direct Bürgeramt route and main-city entry; report reproducible issues with screenshots. | No focus stealing or audible test output; record console, asset loads, frame progression, ticket/queue/counter outcomes, and restart. |
| VIS-01 | Medium / Gameplay + Review | Survey the existing city and office place assets for their fit with the new grimy, painted caricature cast. Propose an area-by-area style pass for facades, signs, clutter, light, and props; implement one bounded accepted area at a time. | Keep every place recognizable and every interaction legible, preserve existing source/asset authority, give before/after screenshots and mobile performance evidence. |

The listed tasks are currently **unassigned**. The integrator owns final decisions,
the root game, and publication. Accepted reports are distilled here for the
corresponding ChatDev stage; rejected or superseded proposals do not enter
the stage prompt.
