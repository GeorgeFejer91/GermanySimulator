# City character animation assets

These six approved painted sprite sheets are part of the root Germany Simulator game. Each directory contains `character-atlas.png`, `manifest.json` and its exact-frame `visual-report.json`. The game uses these direct PNG files; old transfer parts are historical transport data.

| Character | Manifest and PNG directory | Accepted cells | Extra actions |
| --- | --- | ---: | --- |
| Angela Merkel | [merkel](./merkel/manifest.json) | 68 | Four-direction walks and planted turns |
| Alice Weidel | [alice](./alice/manifest.json) | 60 | Four-direction walks and planted turns |
| Markus Söder | [bayern](./bayern/manifest.json) | 60 | Four-direction walks and planted turns |
| Friedrich Merz | [borderPourer](./borderPourer/manifest.json) | 188 | Front and side bucket pouring while walking |
| Herr Sandale, German on vacation | [towelMan](../tourists/towelMan/manifest.json) | 125 | Idle, look, wave, jump, failure, waiting, working and review |
| Frau Sandale, German on vacation | [towelWoman](../tourists/towelWoman/manifest.json) | 125 | The same reaction family |

The legacy `tourists`, `bayern` and `borderPourer` identifiers are existing game keys. Preserve the characters' own identity, routes, prop hand and speaker/voice ownership.

## Reuse in the game

Reuse the existing `npcSpriteAtlases` binding in `game.js` and the Three.js sprite consumer in `world3d.js`. One loaded texture is shared by actors of the same kind. The manifest owns `walks`, `transitions`, `frame_size`, `pivot`, `cols`, `rows`, `sha256`, and the measured `cycle_distance`; retain its current calibration. A frame is selected with `spriteRow`, `spriteFrame` and `spriteFlip`. Cell dimensions and pivot are not interchangeable between characters: Merz uses 224×224 cells and [112,203], while the others use 192×208 and [96,203].

`tourist-animation.js` already provides the source loader and movement player:

```js
const { manifest, objectURL } = await TouristAnimations.load(
  "./assets/characters/merkel/manifest.json"
);
// Assign objectURL to the image/texture source; revoke it after decoding.
TouristAnimations.request(actor, dx, dy, manifest);
// Use actual travel distance, and dt in seconds:
TouristAnimations.advance(actor, travelledDistance, dt, manifest);
```

The host finishes the source stride, holds ground position while `TouristAnimations.isTurning(actor)` is true, advances that timed stop→whole-body turn→start sequence with zero travel, and then resumes walking. Use only `transitions[from+"-to-"+to].frames` for runtime cores; `demo_frames` includes comparison context. Same-direction requests do not restart a stride.

Merz's existing controller uses `TouristAnimations.action(actor, "sidePour" or "frontPour", elapsed, duration, manifest)`. Upper-body action keys use time; feet use actual ground distance. Keep these clocks separate and retain complete bucket/water and walking endpoints.

For the vacation pair, request a reaction through the existing host `requestCharacterReaction` so game events retain their ownership. The portable player also supports:

```js
CharacterInteractions.request(actor, ["review", "jumping"], manifest);
const holdPosition = CharacterInteractions.advance(actor, dt, manifest);
```

Finish any active planted turn before starting the reaction; freeze translation while `holdPosition` is true. Preserve pending conversation/answer outcomes against incidental greetings, the shared ground pivot, uninterrupted airborne motion and the landing baseline. These states currently belong to the vacation pair only.

## Reuse for a new character

Read [animate-2d-characters](../../.agents/skills/animate-2d-characters/SKILL.md) and [the project protocol](../../For-AI/SPRITE-GENERATION-PROTOCOL.md#accepted-city-walking-atlases). Reuse the manifest/player contract and movement method; build approved artwork for the new character's own proportions, clothing, shoes and props. New pixel exports must pass source comparison, native/enlarged light/dark review, ordered motion and the existing hash-bound gate before entering the game. Do not copy another character's limbs or replace connected anatomy with a crossfade.

All 626 cells retain the approved export pixels. Their manifest SHA-256 values identify those exports; the corresponding published PNG Git blob hashes were checked against the original local exports. This confirms saved artwork identity, not a new native Tower gameplay or visual-quality claim. Desktop companions are not a game dependency.
