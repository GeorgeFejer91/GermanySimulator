# City context and source map

The open world is the city scope, including Berlin/Bayern and JWD. Entry pages remain [`index.html`](../../../index.html) and [`3d.html`](../../../3d.html). The canonical mission controller and renderer remain shared root files. All commands below run from the repository root.

## Read by task

| Task | Owning context to read | Source to inspect first |
| --- | --- | --- |
| Mission order, rewards, forms or a city detour | [GAMEPLAY: Core loop](../../../For-AI/GAMEPLAY.md#core-loop), then the affected subsection | [`game.js`](../../../game.js), then [`game-hud.js`](../../../game-hud.js) for presentation |
| JWD home, neighbors, tours or gardens | [GAMEPLAY: JWD home and neighbors](../../../For-AI/GAMEPLAY.md#jwd-home-and-neighbors) | [`jwd-gardens.js`](../../../jwd-gardens.js), [`neighbor-sprites.js`](../../../neighbor-sprites.js), the story module loaded by the entry page, and the JWD producers/consumers in `game.js` and `world3d.js` |
| Streets, traffic, collision, visibility or scale | Affected [GAMEPLAY: Systems](../../../For-AI/GAMEPLAY.md#systems) / [World identity](../../../For-AI/GAMEPLAY.md#world-identity); [OBJECT-CONSISTENCY](../../../For-AI/OBJECT-CONSISTENCY.md) | [`game.js`](../../../game.js) simulation and [`world3d.js`](../../../world3d.js) projection; search for the named object before reading both whole files |
| City speech, quizzes or copy | [GAMEPLAY: Satirical voice and dialogue](../../../For-AI/GAMEPLAY.md#satirical-voice-and-dialogue), [in-world copy](../../../For-AI/GAMEPLAY.md#in-world-copy-no-explanatory-disclaimers), then the affected [audio-text](../../../For-AI/AUDIO-TEXT-LIBRARY.md) or [quiz dictionary](../../../For-AI/QUIZ-CHARACTER-DICTIONARY.md) entry | The named interaction/broker in `game.js`; [`street-wisdom.js`](../../../street-wisdom.js) for street advisers |
| HUD, captions or controls | [GAMEPLAY: Gameplay paperwork](../../../For-AI/GAMEPLAY.md#gameplay-paperwork), [HUD placement and attention](../../../For-AI/GAMEPLAY.md#hud-placement-and-attention), [Controls](../../../For-AI/GAMEPLAY.md#controls); matching [SKILLS](../../../For-AI/SKILLS.md) UI/input route | [`game-hud.js`](../../../game-hud.js), [`game-hud.css`](../../../game-hud.css), [`styles.css`](../../../styles.css) and the affected entry page |

World/asset work also reads the matching [asset policy](../../../For-AI/ASSET-POLICY.md) section and its [browser playability gate](../../../For-AI/ASSET-POLICY.md#browser-playability-gate). Painted citizens follow [the city character style](../../../For-AI/CITY-CHARACTER-STYLE.md), including its retained 3D player/police exception. Character families remain under [`assets/characters/`](../../../assets/characters/); voice and quiz catalogs remain global. Read selected records rather than entire JSON/JS catalogs.

## Boundaries and ownership

The city owns global mission state, forms/rewards, the main frame/update bridge and return placement. Interior controllers own their visit state; the shared renderer presents it. For first-office changes read [Bürgeramt instructions](../../buergeramt/AGENTS.md) and [episode boundary](../../../For-AI/BUERGERAMT.md#episode-boundary-and-clock-ownership). For Jobcenter changes read [Jobcenter instructions](../../jobcenter/AGENTS.md) and trace `enterJobcenter` through `game.js` and `world3d.js`.

JWD is a subsection of this world, so its tasks use this guide and the JWD subsection. Add nested area instructions only if distinct ownership/rules need them. A specific city-area module does not give a worker write ownership of `game.js`, `world3d.js`, root CSS/HTML or shared catalogs. See the [structure policy](../../../For-AI/LEVELS.md#ownership-and-minimal-structure).

## Focused checks

Select the affected group; these examples do not replace global acceptance gates:

```powershell
node --test tests/jwd-home.test.mjs tests/neighbor-sprites.test.mjs
node --test tests/mission-pointer.test.mjs tests/mission-fax.test.mjs
node --test tests/collision-dynamics.test.mjs tests/police-driving.test.mjs tests/vehicle-lifecycle.test.mjs
node --test tests/quiz-variety.test.mjs tests/quiz-character-portraits.test.mjs
```

For browser coverage, inspect the relevant existing fixture before running it: [`playtest-jwd-home`](../../../tools/playtest-jwd-home.mjs), [`playtest-neighbor-sprites`](../../../tools/playtest-neighbor-sprites.mjs), [`playtest-mission-pointer`](../../../tools/playtest-mission-pointer.mjs) or [`playtest-object-consistency`](../../../tools/playtest-object-consistency.mjs). Follow [silent background testing](../../../For-AI/AGENT-START.md#silent-background-browser-tests); report shortcuts and emulation separately from natural flow and physical-device evidence. World-affecting changes still need both independent specialist reviewers.

<!-- rtk-workflow -->
## Shell output

Prefer supported RTK filters for human-read shell output; see the [RTK skill](skills/rtk/SKILL.md). Keep exact reads and parser input raw. Use bounded native commands when RTK is unavailable.
