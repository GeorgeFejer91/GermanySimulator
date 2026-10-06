# Bürgeramt interaction cast and cross-domain handoff

The secret Bürgeramt is an episode of the canonical root game. QR admission, the linked phone, the numbered queue, Frau Knick, the police interruption, A38, and the existing exit outcomes remain its required chain. Three optional encounters add movement and atmosphere while the player waits; they never award a ticket or change a counter answer.

## Playable storyboard

| Beat | Performance and interaction | Spoken line ownership | Image and sound tone |
| --- | --- | --- | --- |
| Entry | The player enters and approaches the QR. The Aktenkurier walks a short loop beside the left files, stops, and stamps a carried stack. | `buergeramt-story.js` owns his two rotating German lines. | File stamp is a brief low paper thud. Warning shifts his painted texture slightly toward old rose. |
| Queue | The Archivbotin patrols between the right shelves and counter, consults her ledger and keys, and can be addressed. | Her two lines describe the impossible archive procedure. | Key and paper rustle stays below the dialogue. Dread leans cool blue violet. |
| Wait | The Formularsammler shuffles an accordion application along the central aisle, pauses to sort pages, and can be addressed. | His second line offers a small, uneasy release. | Dry paper cue; dread eases to weak amber on relief. |
| Call | Existing number board, QR ticket, phone, police, and Frau Knick take priority. | Existing counter and phone scripts keep their exact visible speech strings. | All optional actor tint returns smoothly to neutral after the encounter. Phone ring, static, and police voice follow the phone's own call level. |

`buergeramt.js` owns routes, interaction range, work pauses, dialogue state, and the active `{id,tone,valence}`. `world3d.js` only draws that state: four directional walk rows, paperwork and gesture rows, body-facing billboards, and an eased material tint. The tone target is bounded to a subtle fraction of the paint; it changes only for the actor who owns the currently visible line. Ending the line eases back to the original colors. The room's code geometry and existing stationary painted cast stay in place. The office presents all dialogue, choices, and direct-visit outcomes in a non-modal subtitle rail over the visible room. It has no popup screens; the small `TON` disclosure is an optional in-scene HUD control.

## Sound and mix

The room has a quiet 53 Hz fluorescent hum and short nonverbal file, key, and paper cues at work stops. Effects attenuate with player distance. The red call-board ring and these cues share the `EFFEKTE` bus. `RAUM` controls hum, and `STIMMEN` controls new office speech utterances. The compact `TON` disclosure persists these three levels locally. The phone's call screen has its own `ANRUFLAUTSTÄRKE` control for ring, static, and subsequent police utterances. A voice already in progress follows the level captured at its start because browser speech does not expose a live gain node. No media stream or server is added.

## Production workflow

The local ChatDev graph runs Story → Storyboard → Character → ColorMood → Animation → Gameplay → Soundscape → Mix → Phone → Voice → Review → QA. Each stage reads the game contract and reports only its own domain. Story, Gameplay, and Phone have separate narrow write tools; art, color, audio, review, and QA remain read/report stages until a human or implementation pass makes a reviewed change. `tools/chatdev.ps1 -ValidateOnly` checks the graph and scoped tools. An actual ChatDev stage also requires an API key in the external pinned ChatDev environment; validation alone does not run the agents.

The offline character builder is `tools/amt-character-motion.py`. Source sheets and registered poses stay under `assets/sprite-sources/buergeramt/`; only desktop/mobile WebP atlases are loaded from `assets/buergeramt/characters/` on office entry. Review the exact encoded desktop and mobile cells, connected silhouettes, alpha edges, props, and scale together before accepting a new art pass. `output/amt-character-motion/interaction-build-report.json` records source/atlas hashes and frame hashes; it is a local review artifact, not a runtime input.
