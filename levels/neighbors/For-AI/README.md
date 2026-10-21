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
- [Schwabingen dialogue props](../../../docs/engineering/SCHWABINGEN-PROPS.md):
  authored cue IDs, held products, leaf and blackbird/nest ownership and acceptance.
- [Post-arrest story inventory](../../../neighbor-punishment.js): eight stable
  bilingual story IDs for each adult, with actor/voice ownership, gesture and
  source topics. [Research and fictional adaptations](../../../docs/engineering/POLICE-NEIGHBOR-RESEARCH.md)
  trace every story; [the implementation record](../../../docs/engineering/POLICE-ESCALATION.md)
  owns its city-arrest trigger and acceptance evidence. New recordings use each
  selected adult's separate `punishmentDialogue` cast supplement and punishment
  manifest, preserving ordinary dialogue IDs and takes. Extend the inventory,
  paired English, cast supplement and exact-take receipt together; never assign
  an adult punishment to Hartmut or the archived Ede.

The existing root `neighbor-story.js`, `neighbor-punishment.js`, `game.js`, `jwd-gardens.js`,
`neighbor-sprites.js` and `schwabingen-props.js` implement this level within the city runtime. Character
profiles guide authoring; saving a sample here does not install a runtime line
or replace an existing recording.

<!-- rtk-workflow -->
## Shell output

Prefer supported RTK filters for human-read shell output; see the [RTK skill](skills/rtk/SKILL.md). Keep exact reads and parser input raw. Use bounded native commands when RTK is unavailable.

The [JWD gameplay contract](../../../For-AI/GAMEPLAY.md#jwd-home-and-neighbors) owns the four-person active cast, quieter anthem-only score and disabled police policy. Archived Ede material must not be loaded or spawned.
