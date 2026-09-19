# Durable decisions

## 2026-09-19 — Canonical game identity

The canonical game is the pseudo-3D “Grand Theft Amt” version originally deployed at `https://ec-games.space/games/germany-simulator/`. The later flat 2D prototype is not the product direction.

## 2026-09-19 — Standalone root URL

The standalone GitHub Pages deployment serves the game directly from repository root at `https://georgefejer91.github.io/GermanySimulator/`. The former nested `public/games/germany-simulator/` runtime copy was removed to keep the public URL short and avoid duplicate authority.

## 2026-09-19 — Static-first and YAGNI

The browser game remains static-first. Backend and asset-infrastructure additions require a concrete need. `$ponytail` is the preferred skill for those decisions when installed; the repository’s explicit YAGNI checklist is the fallback.

## 2026-09-19 — Asset fidelity split

Desktop may use high-resolution Weimar-era-inspired billboard art. Mobile uses minimalist lightweight fax signage. Gameplay placement, copy, and interactions stay shared; only representation varies.

## 2026-09-19 — Affectionate bureaucratic satire and dialogue voice

The game’s satire is rooted in love for German culture and German self-irony. Its comic target is the friction of everyday bureaucracy and social interaction, exaggerated into a world where characters cite rules instead of naming their real concern, insist that their interpretation is the only valid one, and reconsider only when confronted by a lawyer, supervisor, office, or other accepted authority. Fax machines, printed documents, stamps, signatures, appointments, circular procedures, and strange German sayings are core motifs. The marked in-game region controls delivery: Berlin uses deliberately awkward Denglisch versions of the sayings, while the Germany side uses fully German dialogue. This voice applies to all dialogue while remaining fictional and avoiding the claim that all German people or real institutions behave this way.

## 2026-09-19 — Progressive WebGL world with 2.5D fallback

`game.js` remains the sole owner of gameplay state, movement, collisions, missions, and interactions. It exposes a small read-only rendering bridge consumed by `world3d.js`. When Three.js is available, the root game projects that state into the WebGL world and loads a bounded set of local CC0 building meshes; if Three.js or the model loader fails, the existing canvas renderer and procedural buildings remain playable. The renderer fades only a building lying between the camera and player, keeping the character legible without flattening the whole city. The standalone `3d.html` route remains a renderer-focused diagnostic surface, not a second gameplay authority.

## 2026-09-19 — Crossable regional Brandmauer

Berlin lies behind the **Brandmauer**, and Berlin character dialogue is Denglisch. Deutschland character dialogue is German-only, regardless of the selected interface language. The fictional male Brandmauer patrolman is the exception: his two statements stay pure German everywhere and prefer a German masculine synthesized voice. Browser-generated speech speaks the exact authored line and remains a first-class, user-toggleable presentation feature. The Brandmauer is a salient, fully crossable wall of semi-transparent procedural flames rather than physical collision geometry. `game.js` owns deterministic semantic fire sources; Canvas and Three.js own their respective flame, ember, and smoke presentation. Player-facing copy must call it the Brandmauer, never the Flammengrenze.

## 2026-09-19 — Doubled world area and rule-enforcement density

The canonical world is 9,600 × 4,000 world units, twice the former playable area, with the established western mission district preserved and a populated eastern expansion added. Street intersections own explicit zebra-crossing geometry and signs. Repeated traffic, movement, grass, audit, and police-evasion violations can escalate wanted stars to five; pedestrian complaints reinforce crossing rules before police escalation.

## 2026-09-19 — Keyboard and touch only

Device-orientation movement, motion permission, calibration, and recenter controls are intentionally removed. Desktop uses keyboard input; phones use the persistent directional dock and E action. The single start button enters the game directly without requesting sensor access.

## 2026-09-19 — Adjacent power-plant landmark

The southern Berlin-side energy district deliberately contrasts a closed nuclear power plant with a fully operating coal plant immediately beside it. `game.js` owns the shared landmark footprint and collision; the canvas fallback draws deterministic procedural silhouettes, while `world3d.js` progressively adds a bounded local CC0 GLB subset and keeps procedural fallbacks for every imported component. The nuclear plant stays silent behind sealed red barriers and an unmistakable closure mark. The coal plant has an open gate, lit windows, a moving conveyor, and the district's only animated power-station smoke. A user-supplied satirical Merkel sprite follows a fixed safe loop around both sites and has a directional behind-the-character reaction. Asset provenance, AI-generation disclosure, and checksums live beside the models in `assets/models/power-plants/LICENSES.md`; the user-supplied sprite provenance note lives in `CREDITS.md`.

## 2026-09-20 — Scarce legal walking space and default NPC complaints

Level design makes forbidden surfaces more abundant than legal pedestrian space: grass and landscaped ground are off-limits by default, as are roads and other vehicle surfaces. Every traversable area must nevertheless retain a continuous, deliberately narrow sidewalk, marked crossing, or pedestrian path so the player is never forced to break a movement rule to make progress. The narrow route supports an intentional no-win social-pressure joke: nearby NPCs default to complaining that a legally walking player is in their way, then switch to complaining about walking on grass or in the street when the player moves aside. This contradiction is a fictional ambient-comedy rule, not permission to remove the legal route or make progression depend on unavoidable enforcement.

## 2026-09-20 — Immediate GitHub Pages publication

Completed repository changes are validated, committed, and pushed to `origin/main` immediately unless the user explicitly asks to hold them locally. The existing `.github/workflows/pages.yml` push trigger is the sole deployment path and publishes the repository root to GitHub Pages. Publication must remain a normal fast-forward push: never force-push, expose secrets or tool caches, or knowingly deploy a failing build.
