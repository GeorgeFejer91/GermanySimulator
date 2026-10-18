# Neighbor level context

This folder owns the JWD neighbor level's character context.

- [Storyboard](./STORYBOARD.md): scene order, movement, dialogue receipts,
  interruption and completion for the four active neighbors.

- [Character profiles](./CHARACTERS.md): Heiko Maaslos, Inga Maaslos,
  Frau Schwabingen and Hartmut Maaslos. Ede is [archived](../archive/ede.md). Heiko's approved voice and sample
  are the reference for future dialogue.
- [City source map](../../city/For-AI/README.md): shared runtime ownership,
  JWD paths, focused checks and city boundaries.
- [JWD gameplay](../../../For-AI/GAMEPLAY.md#jwd-home-and-neighbors):
  home, visits, guided tours and Hartmut's play route.
- [Rule source notes](../../../docs/neighborhood-rules.md): factual background
  for neighborhood topics, separate from each character's speaking style.
- [Speech authority](../../../For-AI/AUDIO-TEXT-LIBRARY.md): exact text,
  subtitles and speaker ownership when implementing or recording dialogue.

The existing root `neighbor-story.js`, `game.js`, `jwd-gardens.js` and
`neighbor-sprites.js` implement this level within the city runtime. Character
profiles guide authoring; saving a sample here does not install a runtime line
or replace an existing recording.

<!-- rtk-workflow -->
## Shell output

Prefer supported RTK filters for human-read shell output; see the [RTK skill](skills/rtk/SKILL.md). Keep exact reads and parser input raw. Use bounded native commands when RTK is unavailable.

The [JWD gameplay contract](../../../For-AI/GAMEPLAY.md#jwd-home-and-neighbors) owns the four-person active cast, quieter anthem-only score and disabled police policy. Archived Ede material must not be loaded or spawned.
