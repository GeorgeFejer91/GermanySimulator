# Level scopes and agent routing

This document owns level lookup and compartmentalization. Root `For-AI/` owns shared policy; each real level has `levels/<id>/AGENTS.md` and a short `For-AI/README.md` for its context, source map and checks. Existing runtime paths and central contracts remain authoritative until deliberately extracted.

## Find the scope

| Level ID | Task names and boundary | Instructions | Context and source map |
| --- | --- | --- | --- |
| `city` | Open world, Berlin/Bayern, JWD home/neighbors/gardens, streets, landmarks, traffic, quizzes and city paperwork. Excludes the two interiors below. | [City AGENTS](../levels/city/AGENTS.md) | [City guide](../levels/city/For-AI/README.md) |
| `buergeramt` | First Bürgeramt interior, queue, Schalter, Anmeldung interview, fever cast and QR/phone companion. Later city paperwork is not a separate level. | [Bürgeramt AGENTS](../levels/buergeramt/AGENTS.md) | [Bürgeramt guide](../levels/buergeramt/For-AI/README.md) |
| `jobcenter` | Optional Jobcenter interior/flame encounter and its entry/return boundary. | [Jobcenter AGENTS](../levels/jobcenter/AGENTS.md) | [Jobcenter guide](../levels/jobcenter/For-AI/README.md) |

Resolve specific interiors before the broad city scope. Entry, exit, rewards or scene switching cross a boundary: read both affected guides and trace their callbacks. JWD and named landmarks are city areas, not independent runtimes. The eight paperwork procedures are mission steps, not eight level directories. For an unknown name, search existing sources/contracts before inventing a scope.

The shared [building transition protocol](./LEVEL-TRANSITIONS.md) treats activities
inside each building as that building's indoor level. Ordinary office dialogue and
paperwork use a shared room and remain owned by the city mission controller; this
does not require another directory for every form or office. All indoor entry,
forced ejection and voluntary return paths use that same protocol.

## Instruction discovery

Codex constructs its instruction chain at startup along the path from repository root to its working directory. Starting at root does not automatically load `levels/<id>/AGENTS.md`, and `For-AI/README.md` is an explicitly read document. See the [official AGENTS.md discovery rules](https://learn.chatgpt.com/docs/agent-configuration/agents-md). Our root instructions therefore require explicit lookup for a named level, even when its implementation still lives in root files.

Read in this order: root `AGENTS.md` and `For-AI/AGENT-START.md`; the matching row above; that level's `AGENTS.md` and `For-AI/README.md`; only the required subject sections and source paths. Do not load sibling levels or the full skill collection for a single-level task. A task brief names the resolved level IDs, actual instruction paths and exact writable files. Directory nesting is context scoping, not a sandbox or permission grant.

For a future area with distinct instructions, place `AGENTS.md` at its actual directory boundary and a local `For-AI/README.md` beside it; link it from the parent guide. Read ancestors from root to that area. Add this depth only when the area has its own consequential rules or owner. Global policy still applies; local context must not silently relax shared acceptance or publication requirements.

## Ownership and minimal structure

Every new playable level and requested named-area entry also follows the permanent direct URL and unique comical share-preview requirement in [`LEVEL-URLS.md`](./LEVEL-URLS.md). Update that maintained catalogue and verify public entry/metadata/images before release; a scope-guide entry alone does not complete a level.

```text
AGENTS.md                          repository entry instructions
For-AI/
  AGENT-START.md                   global task and validation routes
  LEVELS.md                       level lookup and structure policy
  ...                             existing shared/central authorities
levels/
  city/
    AGENTS.md                     city instruction pointer and boundary
    For-AI/README.md              city sections, source map and checks
  buergeramt/
    AGENTS.md
    For-AI/README.md
  jobcenter/
    AGENTS.md
    For-AI/README.md
assets/                           single shipped asset authority
tests/                            existing regression checks
tools/                            existing authoring and QA tools
```

Level guides own routing and source maps. Keep each durable gameplay rule in one owning document: `GAMEPLAY.md`, `BUERGERAMT.md` and the shared catalogs retain their current ownership. New level-specific contracts can live in the corresponding local `For-AI/README.md`; add another local document only for a distinct subject that needs one. Link shared asset, voice, input, performance and review policies rather than copying them into every level.

`game.js`, `world3d.js`, root entry HTML/CSS, shared catalogs and common controls serve multiple levels. They need one assigned writer or serialized integrator edits, even when workers have different level IDs. Preserve root mission/reward ownership and each episode's local state; trace existing clocks, receipts, asset admission and cleanup before changing an interface. Follow [`SKILLS.md`](./SKILLS.md#delegation-and-review) for delegation and required independent reviews.

Assets stay under existing `assets/` families; level guides link them. Tests and authoring tools retain their current homes. Instruction folders contain current context, not copied runtime assets, build output, session logs or duplicate histories. Keep generated evidence in task output; search `DECISIONS.md` only when the rationale matters.

## When to extract files

A level folder can also hold that level's plain JavaScript modules in the same deployable tree. Extract an existing module or central document when a real task benefits from narrower ownership or bounded reading. Do not move the active runtime merely to make the tree symmetrical, and do not create a separate entry page, renderer, asset pipeline, level manager or dependency for every folder.

Before an extraction, find all static/dynamic imports, script URLs, asset-relative URLs, globals, tool allowlists, tests and document links. Move one owner at a time, update consumers and the level source map together, and remove the old authoritative copy. An old document may become a short routing link after its consumers/anchors are accounted for; do not maintain parallel contracts. A runtime move preserves entry URLs, release tokens, state/callbacks, loading/fallback and teardown, and needs the affected deterministic and browser checks. Follow the global validation/publication policy.

## Ponytail assessment

| Structural cost | Smallest useful remedy |
| --- | --- |
| A level name has no reliable path to its instructions from a root-started session. | Explicit root lookup plus three short scoped guides. |
| Large episode, asset and voice documents tempt agents to read unrelated context. | Route to headings and bounded searches; split a subject only when section routing still fails a real task. |
| Moving root files would break imports, relative media URLs, source-based tests and the legacy runner's allowlist. | Keep the current source map accurate; extract deliberately with all consumers. |
| Separate level names suggest safe parallel writes, while controller/renderer files remain shared. | Assign exact files and serialize shared edits; folders alone do not remove conflicts. |
| Repeated global rules and copied local contracts drift. | One owning rule, linked routers; `AGENT-START.md` is the startup page and `README.md` the optional subject index. |
| Some `For-AI/*.js` catalogs are loaded by the game despite the folder's documentation role. | Name that exception; preserve their references until a validated relocation, without cloning them per level. |

Check usefulness with an actual level task: the guide should reveal the owner, affected boundary and smallest relevant check without reading unrelated chapters. Broken routes or missing ownership are actionable; folder count alone does not establish improved agent productivity.
