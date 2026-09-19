# Agent start

Read this file before doing anything else in the repository.

## Authority

1. The user’s current request is the task authority.
2. Root [`AGENTS.md`](../AGENTS.md) defines repository-wide operating rules.
3. This directory holds durable product context.
4. Root game files are runtime authority: `index.html`, `game.js`, `styles.css`, `3d.html`, `world3d.js`, and `assets/`.

## Canonical product

This repository contains the canonical standalone version of the Germany Simulator game originally available at `https://ec-games.space/games/germany-simulator/`. It is the pseudo-3D “Grand Theft Amt” build with keyboard and touch controls; a three-day fictional administration deadline; bilingual framing; regional Denglisch behavior; forms; wanted levels; police; and the optional 3D prototype. Device-tilt control has been intentionally removed.

Do not substitute the later flat 2D prototype or rebuild the game from a different design. Extend this game in place.

## Required reading by task

- Any gameplay or copy change: read [`GAMEPLAY.md`](./GAMEPLAY.md).
- Any art, image, billboard, model, performance, hosting, or asset-loader change: read [`ASSET-POLICY.md`](./ASSET-POLICY.md).
- Any code or documentation change: read [`SKILLS.md`](./SKILLS.md).
- Any architectural or directional change: read [`DECISIONS.md`](./DECISIONS.md) and update it if the decision is durable.

## Working rules

- Preserve unrelated user changes and the established game identity.
- Prefer the smallest coherent change that can be tested in the real browser game.
- Keep one deployable runtime tree at repository root; do not copy the game into a second folder.
- Treat `assets/` as the single asset authority shared by the pseudo-3D game and the optional 3D mode.
- Do not add servers, databases, frameworks, build systems, or asset services unless a demonstrated requirement cannot be met by the static game.
- Route all character writing through the affectionate bureaucratic-satire and dialogue rules in [`GAMEPLAY.md`](./GAMEPLAY.md#satirical-voice-and-dialogue). NPCs should lead with alleged rule violations and procedural authority instead of plainly stating their underlying complaint, and their strange German sayings must follow the player’s current Berlin-Denglisch or German-only region.
- Enforce that regional speech rule in both authored text and generated speech: Berlin characters speak Denglisch; after crossing the animated fire boundary into Deutschland, characters speak German only even when the interface is English. Preserve the browser-generated dialogue voice unless the user explicitly removes it.
- Keep the satire clearly fictional. Do not present game procedures as real German law, policing, citizenship, or immigration guidance.

## Minimum validation

After relevant changes:

1. Run JavaScript syntax checks for `game.js` and `world3d.js`.
2. Serve the repository root over HTTP.
3. Verify the title screen and core game in a desktop viewport.
4. Verify touch controls and layout at a mobile viewport.
5. Check the browser console for errors and confirm every referenced asset loads.
6. If deployment changed, verify the short root URL and `3d.html` on GitHub Pages.
