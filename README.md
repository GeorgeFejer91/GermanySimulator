# Germany Simulator

A finished, self-contained 2D browser game: an open-world crime-game parody where the main threat is bureaucracy.

**Play live:** https://georgefejer91.github.io/GermanySimulator/

## Play

Open `index.html` in a modern browser. For local development, any static HTTP server also works.

Controls:

- WASD / arrow keys: move
- Shift: run suspiciously fast
- E: interact
- X: intentionally do something inadvisable
- P / Escape: pause

The game autosaves progress in the browser. The title screen offers a continue option when a local save exists, and completed games remain available as free-roam sessions.

## Core joke

The player has three **fictional** administration days to complete an absurd citizenship quest. Progress means filling in forms, being sent to another office for another form, collecting the missing form, and returning to fill in an additional form.

The open world is gray, flat, and deliberately administrative. Cultural parody systems include:

- a GTA-like wanted-star system driven by petty fictional rule violations;
- immediate police response if the player walks on the lawn inside the Schrebergärten;
- jaywalking and prolonged running as wanted-level triggers;
- Bratwurst, Currywurst, and Brezel power-ups;
- Pfand bottles as collectible value;
- permanent Baustelle jokes;
- omnipresent retro fax-machine advertisements rendered as reusable pseudo-3D wall and street billboards;
- Mülltrennung / DIN / Ruhezeit / appointment satire;
- NPCs who mostly complain;
- officials who speak in exaggerated bureaucratic German;
- a long chain of Bürgeramt, housing, tax, insurance, immigration and citizenship forms;
- a fictional “Stadtbild” mission about aligning bins, chairs and hedges to absurd visual standards;
- a clearly labeled, stylized Friedrich Merz satirical poster, without attaching factual claims to it.

## Fax billboard assets

Four optimized generated poster textures live in `assets/billboards/`. `game.js` reuses them across wall-mounted and freestanding billboard objects with varied scale, tilt, faux depth, posts and shadows, so the advertising can be distributed densely without duplicating image files.

## Important framing

This is satire. The rules, deadlines, immigration process and enforcement mechanics are intentionally fictional and are **not** descriptions of German law, policing, citizenship requirements or immigration procedure. The political poster is a neutral satirical prop and does not state a factual or persuasive political claim.

No GTA artwork, logos, characters, code or assets are used. The prototype only borrows the general open-world/wanted-system genre convention.

## Development

No install or build step is required. Run `npm test` to validate JavaScript syntax, DOM bindings, local assets, and the dialogue graph. Run `npm run serve` for a local static server on port 8765.

Pushes to `main` deploy automatically to GitHub Pages through `.github/workflows/pages.yml`.


## Angela Merkel NPC

Angela Merkel wanders the city as a directional animated NPC. Her sprite lives in `assets/characters/angela-merkel-sprite.svg`, with front, left, right and back movement rows. Interacting with her opens a branching conversation driven by `merkel-dialogue.js`; the player can use authored response choices or type a reply, which is routed into topics including the Energiewende, "Wir schaffen das", "Neuland", the euro, fax culture, Pfand, bureaucracy and assorted Germany-simulator detours.
