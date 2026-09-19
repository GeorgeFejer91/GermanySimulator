# Skill routing

Use only the skills relevant to the current task. Read each selected skill completely before acting.

| Work | Skill | Requirement |
| --- | --- | --- |
| Backend efficiency, infrastructure, hosting architecture, asset pipelines, and economic asset usage | `$ponytail` | Preferred and required when installed. It is not currently present in the local skill catalog; use the explicit YAGNI fallback in `ASSET-POLICY.md` until it is installed. |
| New raster billboards, textures, period artwork, or bitmap variants | `$imagegen` | Use for generated raster art; keep final project-bound files inside this repository. Do not use it for simple SVG or code-native geometry. |
| HTML, CSS, HUD, menus, responsive behavior, or other frontend UI work | `$uncodixfy` | Preserve the existing game-specific identity and avoid generic generated UI patterns. |
| Architecture, authority boundaries, durable project memory, manifests, and handoff surfaces | `$system-engineering` | Use for lasting structural decisions and update `DECISIONS.md`. |
| Current public facts, external references, historical research, or documentation lookup | `$multi-source-web-search` | Prefer primary sources, open sources before citing, and run a blind-spot pass for nontrivial research. |
| Large repository mapping, dependency pressure, or diff-impact analysis | `$rust-work-graph` | Use only when the repository becomes complex enough to justify graph analysis. |

Do not use website generators or replace the existing static game architecture merely because a skill is available.
