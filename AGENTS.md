# Germany Simulator agent instructions

Read [`For-AI/README.md`](./For-AI/README.md), then the applicable sections named by [`For-AI/AGENT-START.md`](./For-AI/AGENT-START.md). Read only the task-relevant sections; historical decision records are searchable background, not mandatory full reads.

The root game is the canonical standalone Germany Simulator. Preserve its “Grand Theft Amt” identity, mission chain, satire, controls, and desktop/mobile behavior unless the user changes them. Keep one runtime tree at the repository root and `assets/` as the single shipped asset authority.

Codex is the workflow lead. Use [`For-AI/SKILLS.md`](./For-AI/SKILLS.md) to choose applicable skills, domain owners, model tiers, and scoped delegation. A single integrator owns acceptance and any commit or publication; workers stay within assigned paths and do not commit, push, or absorb unrelated worktree changes.

Keep durable product and technical decisions in `For-AI/`, in their existing owning documents. Do not add a second game, framework, service, or asset pipeline without a demonstrated need. For infrastructure, backend efficiency, and asset-pipeline decisions, use `$ponytail` when available; otherwise follow the YAGNI rules in [`For-AI/ASSET-POLICY.md`](./For-AI/ASSET-POLICY.md).
