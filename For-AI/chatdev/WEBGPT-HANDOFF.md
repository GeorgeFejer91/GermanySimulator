# WebGPT handoff register — historical intake snapshot

This file preserves Secret Tunnel 5 findings and task candidates recorded on
2026-10-06. They are historical records, not live assignments or current runtime
authority; verify status and source before reuse. Codex owns current task routing
and integration under [`SKILLS.md`](../SKILLS.md). The WebGPT-specific tool
protocol is in [`WEBGPT-COORDINATION.md`](./WEBGPT-COORDINATION.md).

## Accepted and partial historical findings

`AMT-LAYOUT-AUDIT` from the WebGPT retry chat is **closed as a scoped
review**. Its proposal is
`webgpt-inbox/amt-layout-audit-webgpt-retry-20261006.md`. The integrator
aligned the visible doorway with the simulation threshold, built four
counters with Schalter 3 inside the desk span, and added furniture collision.
The entrance now allows walking through its visible opening, and the clerk encounter
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

`VOICE-01` now has a coordinator-prepared starting point: the external ChatDev
`WareHouse/germany-voice-reference/manifest.md` records a CC0 German Frau
Knick reference, her saved Qwen profile, the existing separate police profile,
and exact-story smoke previews. No clip has entered game assets. An incoming
voice contributor should review those files and propose precise fixes or
alternatives; a human listening decision is still pending before line batches.

## Task record

```text
ID:
Base commit:
Working directory / worktree:
Owner / originating agent:
Model / reasoning effort (or integrator-owned):
Goal and expected result:
Dependencies:
Relevant skills:
Exact read paths:
Exclusive write paths:
Acceptance checks:
Required return evidence:
Handoff path:
Status: assigned | submitted | accepted | needs revision | closed
Integrator decision / evidence:
```

For Codex model tiers, active subagent limits, and review ownership, follow
[`../SKILLS.md`](../SKILLS.md); do not copy those changing rules into individual
task records.

## Historical task candidates

The following candidates were listed in the 2026-10-06 snapshot. Their status
is not live. Before reactivating one, the integrator must confirm the current
source, base commit, owner, exact paths, and checks in a fresh task record.

| ID | Priority / ChatDev stage | Concrete deliverable | Check for acceptance |
| --- | --- | --- | --- |
| ART-01 | High / Gameplay + Review | Design connected stamp, scold, and paper-shuffle action keys for Frau Knick. Propose art under `assets/sprite-sources/buergeramt/`; leave current idle atlas intact until reviewed. | Stable identity and baseline, enough distinct inbetweens at 24 fps, cell gutters, no hand/face snap, ordered desktop/mobile motion. |
| ENV-01 | Closed / Gameplay + QA | Accepted scoped office dressing and collision integration. | Future area edits require their own visual and performance review. |
| STORY-01 | Medium / Story + Review | Polish the German-only Frau Knick/police exchange, especially the counter-phone overlap and cancelled appointment, in a proposed dialogue diff. | Answer has no player choices; decline retains choices and A38; visible words equal spoken words on each screen. |
| PHONE-01 | High / Phone + QA | Exercise real phone-to-desktop VDO.Ninja pairing, immediate and repeated QR ticket scans, foreground requirement, call answer/decline, reconnect and late/early branches; submit a compact issue report or focused fix. | Two real browsers sync without camera/microphone; no choice on answer branch; pairing failures and privacy behavior are documented. |
| VOICE-01 | Medium / Voice + Review | Review the external CC0 Frau Knick and police smoke previews; propose precise voice or telephone-effect changes before line batches. | Source license, segment, hashes, whole-line wording, and listening notes; no unverified YouTube voice is cloned. |
| QA-01 | High / QA | Run silent desktop/mobile/320px/200% playthroughs of the direct Bürgeramt route and main-city entry; report reproducible issues with screenshots. | No focus stealing or audible test output; record console, asset loads, frame progression, ticket/queue/counter outcomes, and restart. |
| VIS-01 | Medium / Gameplay + Review | Survey the existing city and office place assets for their fit with the new grimy, painted caricature cast. Propose an area-by-area style pass for facades, signs, clutter, light, and props; implement one bounded accepted area at a time. | Keep every place recognizable and every interaction legible, preserve existing source/asset authority, give before/after screenshots and mobile performance evidence. |

The candidates were marked **unassigned in the 2026-10-06 snapshot**; that is
not a current assignment state. The integrator owns final decisions, the root
game, and publication. Accepted reports may be distilled for a corresponding
ChatDev stage; rejected or superseded proposals do not enter a stage prompt.
