# Bürgeramt context and source map

This scope is the first Bürgeramt interior and its QR/phone companion, reached through the city mission. `?geheim=buergeramt` enters the same episode directly for repeat testing; it does not prove the natural mission prerequisites. The current episode contract remains [`For-AI/BUERGERAMT.md`](../../../For-AI/BUERGERAMT.md). Read the relevant section, not the entire contract. All commands below run from the repository root.

## Read by task

| Task | Episode section | Source to inspect first |
| --- | --- | --- |
| Entry, QR, ticket, queue or counter admission | [Admission, queue and outcomes](../../../For-AI/BUERGERAMT.md#admission-queue-and-outcomes) | [`buergeramt.js`](../../../buergeramt.js), [`buergeramt-link.js`](../../../buergeramt-link.js), affected [`buergeramt-phone.js`](../../../buergeramt-phone.js) handlers |
| Registration, scoring, phone interruption or completion | [Anmeldung interrogation and completion](../../../For-AI/BUERGERAMT.md#anmeldung-interrogation-and-completion), affected phone subsection | [`buergeramt-story.js`](../../../buergeramt-story.js), `buergeramt.js`, `buergeramt-phone.js`; city reward consumer in [`game.js`](../../../game.js) |
| Movement, turning, touch, room or props | [Turning and view stability](../../../For-AI/BUERGERAMT.md#turning-and-view-stability-2026-10-13), [Waiting-room floor](../../../For-AI/BUERGERAMT.md#waiting-room-floor) | `buergeramt.js`, [`buergeramt-walk-view.js`](../../../buergeramt-walk-view.js), [`buergeramt-touch-target.js`](../../../buergeramt-touch-target.js), affected office code in [`world3d.js`](../../../world3d.js) |
| Story beats or fever encounters | [Playable storyboard](../../../For-AI/BUERGERAMT.md#playable-storyboard), [In-scene fever encounters](../../../For-AI/BUERGERAMT.md#in-scene-fever-encounters) | `buergeramt.js`, [`buergeramt-fever.js`](../../../buergeramt-fever.js) and the affected renderer consumer |
| Painted/Gaussian animation, speech mouths or sound | [Painted Gaussian action arcs](../../../For-AI/BUERGERAMT.md#painted-gaussian-action-arcs), [Full mouth opening and recorded timing](../../../For-AI/BUERGERAMT.md#full-mouth-opening-and-recorded-timing-2026-10-11), [Sound and mix](../../../For-AI/BUERGERAMT.md#sound-and-mix), as applicable | Named `buergeramt-*` module and its `world3d.js` consumer; shared [sprite](../../../For-AI/SPRITE-GENERATION-PROTOCOL.md), [voice](../../../For-AI/VOICE-SYNTH-PROTOCOL.md) or [music/sound](../../../For-AI/MUSIC-SOUND-DESIGN.md) protocol only for the affected medium |
| Scene/phone CSS and bounded labels | Affected beat and the [SKILLS UI/text-fitting route](../../../For-AI/SKILLS.md#html-text-fitting-contract) | [`buergeramt.css`](../../../buergeramt.css), [`buergeramt-fit.js`](../../../buergeramt-fit.js), [`buergeramt-phone.html`](../../../buergeramt-phone.html), affected root entry DOM |

Read the [episode boundary and clock ownership](../../../For-AI/BUERGERAMT.md#episode-boundary-and-clock-ownership) for interface/timing changes. Speech uses the exact line/cast records in the global audio-text and voice catalogs. Assets remain under [`assets/buergeramt/`](../../../assets/buergeramt/) and the existing `assets/voices/` families; the [asset policy](../../../For-AI/ASSET-POLICY.md) owns budgets/admission. No local copies of those catalogs or policies.

## Boundaries and ownership

`buergeramt.js` owns the episode simulation, queue, movement, dialogue and visit lifetime. The phone/link/time modules own the existing companion protocol; the host commits ticket/outcome state. `world3d.js` is shared presentation; `game.js` remains city mission/reward authority. For entry/return/reward work read [city instructions](../../city/AGENTS.md) and [GAMEPLAY: First Bürgeramt visit](../../../For-AI/GAMEPLAY.md#first-bürgeramt-visit).

Root HTML/CSS, `world3d.js`, `game.js`, shared catalogs and common speech workers need one assigned writer. A wildcard `buergeramt*` search is discovery, not blanket permission to edit every episode path. The optional legacy runner retains its existing [tool limits](../../../For-AI/chatdev/README.md#tool-contract-and-prompts); use it only when the task calls for it.

## Focused checks

Select checks for the changed beat and its consumers; these examples do not replace global acceptance gates:

```powershell
node --test tests/buergeramt-causality.test.mjs tests/buergeramt-queue.test.mjs tests/buergeramt-registration.test.mjs
node --test tests/buergeramt-link.test.mjs tests/buergeramt-phone-lifecycle.test.mjs tests/kriminalpolizei-phone.test.mjs
node --test tests/buergeramt-movement.test.mjs tests/buergeramt-turning.test.mjs tests/buergeramt-touch-navigation.test.mjs
node --test tests/buergeramt-entry.test.mjs tests/buergeramt-session.test.mjs tests/buergeramt-restoration.test.mjs
```

Existing browser probes include [`playtest-buergeramt-navigation`](../../../tools/playtest-buergeramt-navigation.mjs), [`playtest-anmeldung`](../../../tools/playtest-anmeldung.mjs) and [`playtest-amt-audio-handoff`](../../../tools/playtest-amt-audio-handoff.mjs). Inspect the selected probe's environment/output requirements first. Follow [silent background testing](../../../For-AI/AGENT-START.md#silent-background-browser-tests); report direct/forced entry, simulated signaling, emulation and silent audio-state checks accurately. Apply the global event-causality and independent world-review routes when affected.
