# Jobcenter context and source map

The optional Jobcenter interior is entered from the city's eastern Berlin building. Its controller/render module is [`jobcenter.js`](../../../jobcenter.js), using the existing Three.js renderer and frame clock. Read only the Jobcenter entries in [GAMEPLAY: Systems](../../../For-AI/GAMEPLAY.md#systems); locate them with `rg -n 'Jobcenter|jobcenter' For-AI/GAMEPLAY.md`. All commands below run from the repository root.

## Source and contract ownership

| Concern | Actual owner / route |
| --- | --- |
| Facade, first-person movement, flame and encounter lifetime | `createJobcenterBuilding`, `stepJobcenter`, `createJobcenterEncounter` in [`jobcenter.js`](../../../jobcenter.js) |
| Native-recording mouth/brightness timing | `sampleJobcenterEnvelope` and encounter playback in `jobcenter.js`; [`assets/audio/jobcenter/`](../../../assets/audio/jobcenter/) holds the supplied recording and envelope |
| City entry, pause and return placement | `enterJobcenter` and its return callback in [`game.js`](../../../game.js); read [city instructions](../../city/AGENTS.md) for changes |
| Shared rendering and update bridge | Jobcenter creation/entry/sync consumers in [`world3d.js`](../../../world3d.js) |
| Dialogue, captions, voice binding and budgets | The named entry in global [audio-text](../../../For-AI/AUDIO-TEXT-LIBRARY.md) / [cast](../../../For-AI/VOICE-CAST.json) authorities and matching [asset policy](../../../For-AI/ASSET-POLICY.md) section |

Trace entry, close, hidden/resume and media-ended handlers before changing the visit. A stale completion must not close a later visit. Keep current mission/inventory and city return behavior in their existing owners; do not make this optional encounter a new paperwork mission. Shared root sources/catalogs have one assigned writer. Level assets stay in the single `assets/` tree.

## Focused checks

```powershell
node --test tests/jobcenter.test.mjs
```

[`tools/playtest-jobcenter.mjs`](../../../tools/playtest-jobcenter.mjs) is the existing silent desktop/Android-emulation probe. It checks input, approach/media behavior, visibility and return through production handlers; its city placement is an explicit diagnostic shortcut. Inspect its requirements before execution, and distinguish that scope from a natural route or a physical-device run. Apply global input, event-causality, performance and independent world-review routes for the affected change; this focused test alone is not complete acceptance.

<!-- rtk-workflow -->
## Shell output

Prefer supported RTK filters for human-read shell output; see the [RTK skill](skills/rtk/SKILL.md). Keep exact reads and parser input raw. Use bounded native commands when RTK is unavailable.
