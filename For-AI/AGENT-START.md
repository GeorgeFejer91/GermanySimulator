# Agent start

Read this file before doing anything else in the repository.

## Authority

1. The user’s current request is the task authority.
2. Root [`AGENTS.md`](../AGENTS.md) defines repository-wide operating rules.
3. This directory holds durable product context.
4. Root game files are runtime authority: `index.html`, `game.js`, `styles.css`, `3d.html`, `world3d.js`, and `assets/`.

## Canonical product

This repository contains the canonical standalone version of the Germany Simulator game originally available at `https://ec-games.space/games/germany-simulator/`. It is the 3D “Grand Theft Amt” build with keyboard and touch controls; a three-day fictional administration deadline; bilingual framing; regional Denglisch behavior; forms; wanted levels; and police. The former Canvas world is retired; `world3d.js` is the required renderer, while registered bitmap character sprites remain intentional 3D scene assets. Device-tilt control has been intentionally removed.

Do not substitute the later flat 2D prototype or rebuild the game from a different design. Extend this game in place.

## Required reading by task

- Any gameplay or copy change: read [`GAMEPLAY.md`](./GAMEPLAY.md).
- Any art, image, billboard, model, performance, hosting, or asset-loader change: read [`ASSET-POLICY.md`](./ASSET-POLICY.md).
- Any moving bitmap character, sprite atlas, gait, or animation-frame change: also read [`SPRITE-GENERATION-PROTOCOL.md`](./SPRITE-GENERATION-PROTOCOL.md).
- Any code or documentation change: read [`SKILLS.md`](./SKILLS.md).
- Any spoken-audio or subtitle change: read [`AUDIO-TEXT-LIBRARY.md`](./AUDIO-TEXT-LIBRARY.md) and keep its runtime library synchronized.
- Any architectural or directional change: read [`DECISIONS.md`](./DECISIONS.md) and update it if the decision is durable.

## Working rules

- Preserve unrelated user changes and the established game identity.
- Prefer the smallest coherent change that can be tested in the real browser game.
- Keep one deployable runtime tree at repository root; do not copy the game into a second folder.
- Treat `assets/` as the single asset authority shared by the canonical 3D game and the `3d.html` renderer diagnostic.
- Do not add servers, databases, frameworks, build systems, or asset services unless a demonstrated requirement cannot be met by the static game.
- Route all character writing through the affectionate bureaucratic-satire and dialogue rules in [`GAMEPLAY.md`](./GAMEPLAY.md#satirical-voice-and-dialogue). NPCs should lead with alleged rule violations and procedural authority instead of plainly stating their underlying complaint, and their strange German sayings must follow the player’s current Berlin-Denglisch or German-only region.
- Enforce that regional speech rule in both authored text and generated speech: Berlin lies behind the animated **Brandmauer** and its characters speak Denglisch; after crossing out into Deutschland, characters speak German only even when the interface is English. The in-world boundary is always called the Brandmauer, never the Flammengrenze. Preserve the browser-generated dialogue voice unless the user explicitly removes it.
- Treat spoken character audio and its textbox as one strict, inseparable event. Recorded and synthesized speech must use the exact string visible in the active textbox; ensure that matching textbox is visible when its audio starts and throughout playback, never let queued speech play beneath a different line, and cancel pending or active speech when another modal replaces it. Music and non-verbal sound effects are excluded from this rule.
- Treat political-character identity and quote ownership as a strict invariant. The figure trying to extinguish the Brandmauer is the satirical Friedrich Merz character and may trigger only Merz-attributed lines; the energy-district Angela Merkel character may trigger only Merkel-attributed lines, including her directional “Sie stehen hinter mir.” reaction. Never merge, share, or randomly cross-select their quote pools, and keep the displayed speaker name, textbox, and voice assignment bound to the same owner.
- Keep the satire clearly fictional. Do not present game procedures as real German law, policing, citizenship, or immigration guidance.

## Minimum validation

After relevant changes:

1. Run JavaScript syntax checks for `game.js` and `world3d.js`.
2. Serve the repository root over HTTP.
3. Verify the title screen and core game in a desktop viewport.
4. Verify touch controls and layout at a mobile viewport.
5. Check the browser console for errors and confirm every referenced asset loads.
6. If deployment changed, verify the short root URL and `3d.html` on GitHub Pages.

## Immediate publication

After completing and validating repository changes, commit the intended project files and push `main` to `origin` immediately so the existing GitHub Pages workflow publishes them. Do not leave finished work only in the local worktree. Never force-push or publish secrets, tool caches, or a knowingly broken build; if publication fails, report the exact blocker and keep the validated local commit intact. An explicit user request to hold or keep work local overrides this rule.
