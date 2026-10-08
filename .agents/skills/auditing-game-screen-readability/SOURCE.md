# Source and project adaptations

Source: https://github.com/abagames/agentic-gamedev-skills/tree/72309959e3422acdcb95d30e3b0ffd9ed2bd149d/.agents/skills/auditing-game-screen-readability

Retrieved: 2026-10-08. Attribution: abagames. License: MIT; the original license is preserved in LICENSE, with any supplied notices beside it. Applicable adaptation terms continue to apply to this bundle.

Changes:

- Add project applicability and explicit adaptation notice

Installation/package checks do not establish task effectiveness. Project routing and permissions remain authoritative.

Ponytail / implementation audit adaptations (2026-10-08):

- SKILL.md: Ponytail: reference the shared project contract instead of repeating global rules
- SKILL.md: Ponytail: scope enumeration/instrumentation to affected states and label incomplete checker results
- scripts/check-screen-frames.mjs: Correctness: reject nonfinite/empty input; exit 2 for incomplete evidence; extend existing stdlib self-test
- references/frame-manifest.md: Document required inputs, coverage and incomplete exit semantics
