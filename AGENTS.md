# Germany Simulator agent instructions

Before inspecting, planning, editing, or running this project, read [`For-AI/AGENT-START.md`](./For-AI/AGENT-START.md) completely. Then read every document it marks as required for the task.

The root game is the canonical standalone Germany Simulator. Do not replace it with another prototype or import a different game direction. Preserve the established “Grand Theft Amt” world, visual identity, mission chain, controls, satire framing, and desktop/mobile behavior unless the user explicitly changes them.

Keep durable project context in `For-AI/`. Update those documents whenever a change alters gameplay rules, asset policy, architecture, validation, or a lasting product decision.

Use the project skill routing in [`For-AI/SKILLS.md`](./For-AI/SKILLS.md). In particular, backend, infrastructure, and asset-pipeline decisions must use `$ponytail` when that skill is available. If it is unavailable, state that fact and apply the repository’s YAGNI fallback in [`For-AI/ASSET-POLICY.md`](./For-AI/ASSET-POLICY.md); never invent the missing skill’s instructions.

Do not maintain a second deployable copy under `public/` or another nested directory. One runtime tree and one asset authority are intentional constraints.
