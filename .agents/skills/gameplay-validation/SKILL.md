---
name: gameplay-validation
description: Use when systems work in isolation but nobody has proven a player can
  start, understand a goal, make a decision, observe consequences, fail/retry, and
  finish the intended slice with named evidence.
---

## Germany Simulator applicability

Project adaptation (2026-10-08); preserve the upstream license and see SOURCE.md for provenance. Follow [project routing and applicability](../../../For-AI/SKILLS.md). Use existing root assets and ASSET-POLICY for scenario fixtures; no open-asset-fixture sibling framework. Name driver, mode, cheats, natural-chain coverage and unrun device evidence. Secret admission and synthetic messages do not prove the natural two-device flow.

# Gameplay validation

## Trigger

The build has verbs, decisions or menus. Someone says it "works". You must say what that word proved.

## Mode (select relevant)

| Column | What it may prove | What it may not prove |
|---|---|---|
| logic-regression | formulas, flags, save schema | a human can finish |
| scripted-scene | one arena / one boss phase with cheats | a natural unlock path |
| real-input | pad/kb/touch/mouse on a real device | tomorrow's hardware |
| new-player-watch | first-hour confusion | endgame balance |

Teleport, wipe enemies, force boss phase, or unlock flags = scripted-scene.
Call it that in the log. Never file it as new-player-watch.

## Required inputs

Use the [shared review record](../../../For-AI/chatdev/README.md#shared-contracts-and-convergence): build/scenario, relevant starting state, driver/mode, browser/device/input, shortcuts, results and uncovered scope. Mark irrelevant difficulty/gear fields N/A. One focused check needs one evidence row.

## Procedure

Walk the chain. Skip a box only if you mark it untested.

```
boot → teach first verb/decision → core challenge → consequence → next goal
     → fail and retry → (optional) ending
```

For noncombat games, a puzzle solution, construction decision or narrative choice replaces an encounter. Record no-failure/no-reward loops explicitly; do not introduce enemies or loot to fill this chain.

Each box records: pass / fail / blocked / not-run, plus who was driving (human / auto).

## Attribute separately

Do not fold these into "the game is too hard":

| Bucket | Examples |
|---|---|
| game defect | wrong hitbox, lock-on flips target, music stacks |
| player strategy | they never blocked |
| setup failure | stale save, wrong language, low spec |
| harness failure | auto-pilot stuck, path blocked by a test wall, browser tab died |

Auto-play that loses lock-on, pathfinds into geometry or drops a session has unknown attribution until logs and a controlled reproduction distinguish game, environment and harness. Human input is useful corroboration, not a prerequisite for confirming a reproducible game defect.

## Capture vs evidence

A recording that used unlock flags or difficulty overrides is a **challenge clip with adjusted unlocks**. It is not proof of a natural clear.
Use the existing game-playtest route and shared project evidence format for capture.

## Outputs

- Chain × mode matrix only for end-to-end or multiple-mode claims
- Repro: steps, seed/save, input device
- Evidence pointer: clip / log / screenshot
- Untested range: named, not implied

## Accept

You can answer in one sentence: what was validated, by which mode, with which cheats off.
A green scripted-scene does not get written as "the game is completable".

## Cases

Optional project notes live in `docs/cases/`. Names, coords, and one-scene CPU numbers stay there. They do not become iron laws.

## Asset fixture preparation

Use the existing root assets and [asset policy](../../../For-AI/ASSET-POLICY.md), with the installed web-3d-asset-pipeline when applicable. Keep pure-state fixtures synthetic; unavailable assets leave the affected scenario NOT RUN. Do not execute donor projects or import another fixture catalog/lock framework. Byte-integrity checks do not prove decode, rendering or gameplay.
