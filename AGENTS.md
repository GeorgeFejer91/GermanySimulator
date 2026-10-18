# Germany Simulator agent instructions

Start with [`For-AI/AGENT-START.md`](./For-AI/AGENT-START.md); use [`For-AI/README.md`](./For-AI/README.md) as the subject index when needed. Read only task-relevant sections; historical decisions are searchable background.

For a named level, interior, or city area, resolve [`For-AI/LEVELS.md`](./For-AI/LEVELS.md) and read the matching `levels/<id>/AGENTS.md` and `levels/<id>/For-AI/README.md` before touching its sources, including existing root modules. Do this explicitly when starting at the repository root; nested instructions are not automatically discovered by a level name in the prompt. For a handoff between levels, read both scopes.

The root game is the canonical standalone Germany Simulator. Preserve its “Grand Theft Amt” identity, mission chain, satire, controls, and desktop/mobile behavior unless the user changes them. Keep one runtime tree at the repository root and `assets/` as the single shipped asset authority.

Codex is the workflow lead. Use [`For-AI/SKILLS.md`](./For-AI/SKILLS.md) to choose applicable skills, domain owners, model tiers, and scoped delegation. A single integrator owns acceptance and any commit or publication; workers stay within assigned paths and do not commit, push, or absorb unrelated worktree changes.

Keep durable rules in their owning global `For-AI/` document or level's `For-AI/` directory, following [`LEVELS.md`](./For-AI/LEVELS.md). Link shared authorities instead of copying them. Do not add a second game, framework, service, or asset pipeline without a demonstrated need. For infrastructure, backend efficiency, and asset-pipeline decisions, use `$ponytail` when available; otherwise follow the YAGNI rules in [`For-AI/ASSET-POLICY.md`](./For-AI/ASSET-POLICY.md).

<!-- rtk-workflow -->
## Shell output

For shell work, prefer supported RTK filters; see [For-AI/README.md](For-AI/README.md) and its RTK skill. Keep exact reads and parser input raw.
