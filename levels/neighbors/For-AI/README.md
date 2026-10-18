# Neighbor level context

This folder owns the JWD neighbor level's character context.

- [Character profiles](./CHARACTERS.md): Heiko Maaslos, Inga Maaslos,
  Frau Schwabingen, Hartmut Maaslos with Ede archived. Heiko's approved voice and sample
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

- [Storyboard](./STORYBOARD.md): movement, dialogue ownership, interruption and completion for the four active neighbors.
