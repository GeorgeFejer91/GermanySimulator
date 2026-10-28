# Integration contract

The experiment is deliberately unlinked. Source and runtime assets stay in the same root deployment tree as Germany Simulator. The current user request explicitly authorizes an isolated entry and controller while requiring easy later main-game integration.

The main game can lazily import `levels/klein-korinthen/adapter.mjs` at a future bus-stop or mission trigger. Its mount function owns one same-origin iframe, which contains the level's DOM, keyboard listeners, renderer, audio and save namespace. This prevents global IDs, styles and event handlers from colliding with the existing game. It is a scene boundary, not another service or framework. `content.mjs`, `state.mjs` and `world.mjs` are also independent modules if a later deliberate renderer-level merge is preferable.

```js
const {mountKleinKorinthen} = await import('./levels/klein-korinthen/adapter.mjs');
// The city controller pauses its own simulation, controls and audio here.
const visit = mountKleinKorinthen({
  container: levelHost,
  state: savedLevels['klein-korinthen'],
  settings: {audio: settings.voices, englishSubtitles: settings.language === 'en'},
  onState(state) { savedLevels['klein-korinthen'] = state; },
  onComplete({achievementId, state}) {
    // City mission/reward controller decides and persists the reward exactly once.
    // achievementId is always 'klein-korinthen-membership'.
  },
  onExit(state) {
    savedLevels['klein-korinthen'] = state;
    visit.dispose();
    // Restore the city at its saved entry position; resume its simulation/audio.
  }
});
await visit.ready;
// Host visibility/lifecycle hooks:
visit.pause();
visit.resume();
visit.setSettings({audio:false, englishSubtitles:true});
const checkpoint = visit.serialize();
visit.dispose(); // idempotent: stops audio/rendering and removes frame/listener
```

The sample refers to host-owned variables; it is an interface example, not a patch to `game.js`. No city reward or mission flag is changed by this release. The certificate's +30 is the level-local reward presentation; the future host decides its authoritative application. Host save data passes the same version/ID/measurement checks as the standalone save. Do not trust a completion packet to bypass the host's existing achievement guard.

All messages require the same origin, exact frame/parent window, namespace and per-mount random channel. The host may provide initial state and settings. The level sends ready/initialized/state/complete/exit. Open and close the scene only at an existing legal mission transition. Unload the old visit before creating another. A return action is present in Pause when embedded; standalone players keep the experimental playground.

## Evidence and limits

`node tools/check-klein-korinthen-ui.mjs` actually mounts the iframe, waits for initialization, passes audio/subtitle settings, pauses/resumes, removes it, and remounts with host-provided state. It does not claim the new mission is already linked to the city. The host must pause its own audio and controls before mounting; the adapter deliberately does not reach into undocumented main-game globals.

## Story event and sound ownership

Invitation dialogue completion/skip commits `join`. A nearby car measurement holds the player, shows the world-space ruler, and commits the measured car ID only after 1.8 active seconds. Blur/hidden/cancellation commits nothing. The report button reads that exact ID, rejects legal/duplicate/unmeasured cases, then updates the evidence ledger and count. Three reports trigger Gisela's progress line; five permit return. Gisela's return interaction commits membership and emits the host completion event once. The chairman's car grants only its ordinary valid report plus the bonus annotation.

The app owns one active voice element and an epoch guard; each line's exact German/English text, speaker and take remain paired. Actual media time drives the measured mouth envelope. New dialogue/skip/restart/dispose cancels the previous voice. Missing audio retains captions. Ambient wind, footfalls, ruler chirp and stamp are finite low-level Web Audio cues under the same input and lifecycle owners; no sound advances mission state. Paused poses hold their current time; reduced motion removes idle deformation. All automated checks mute their own browser session before navigation.
