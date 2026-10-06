# AMT-LAYOUT-AUDIT — WebGPT retry, 2026-10-06

Status: incoming, proposal only; no exclusive runtime paths assigned. Owner: this WebGPT retry chat. Do not automatically merge or execute this report.

Outcome: reconcile the secret Bürgeramt's visible room with its movement and interaction positions, preserve all registration/phone/A38 branches, and verify the resulting playable layout. The user requested completing this episode through the existing ChatDev protocol.

Base: local Git HEAD cannot currently be read through the exposed v5 tools. Reviewed worktree file hashes: `world3d.js` SHA-256 `473a21f9018573d0d2a13e6ab1f01693cc6b1ab88cec27325dddd2657a141c6a`; `buergeramt.js` SHA-256 `42c7aca25c369cc675b4bec707b3fd70f162239188488421c858cf414a46940a`; `index.html` SHA-256 `040b2a3aab825194de865460d882a3e5172d0461ccaec64a4873b82ac120cf0d`. These are source identities, not a verified commit or clean-worktree assertion.

Read scope: Bürgeramt sources, existing tests, and matching For-AI policy. Write scope: this uniquely named proposal only. Shared runtime and the handoff register remain integrator-owned.

Source review findings to reproduce:

1. The simulation's entry door is at z=5.55, but the visible door is at z=8.63 behind the player's z=8 spawn and there is no facade at z=5.55. Forward movement crosses a non-rendered threshold.
2. The service-desk loop renders Schalter 1–3 only, contrary to the accepted four-counter brief. Its desk slab ends at x=3.55 while Schalter 3 and Frau Knick are at x=3.9–4.
3. Movement has room-boundary checks but no chair/desk collision; the player can walk through office furniture and into the staff area.

Integration request: reserve a bounded layout/collision slice for one owner, or let the local integrator apply the reviewed candidate included in the completed report. No change to phone protocol, story, accepted character art, mission order, or voice ownership is proposed. No native PC commands or browser checks have run in this chat yet. The previous assistant's claim that the secret route was not located is superseded: it is `?geheim=buergeramt` in this worktree.

## Recheck against the integrator's newer source

The coordinator accepted this intake as a scoped review; this chat still owns no shared runtime path. The newer `buergeramt.js` read has SHA-256 `86f13f24d725e01e9eeceb9c5fe4501e043a0641b086f007c785b5bee6f075ff`. I reconstructed that exact text in an isolated sandbox and verified the same SHA-256 before executing it with the existing dependency-free Amt harness (routing helpers adapted to the new QR position at x=0,z=-2.6). Do not apply the older candidate's QR coordinates over this change.

Two remaining findings were reproduced by executing this newer controller:

1. **Counter camera teleports into blocked staff/desk space.** Complete registration, wait for the active call, walk to x=4,z=-8.15, then E. `showClerk()` returns view `{x:4,z:-8.75,yaw:0}` although `officeBlocked()` rejects all z<-8.32. The controller is in `counter` with no A38. Small fix: replace its `view.x=4;view.z=-8.75;view.yaw=0;` with `view.x=counter.x;view.z=counter.z;view.yaw=0;`. Recheck the actual first-person view after the change.
2. **The entrance can be crossed without E, leaving the stage outside.** From a fresh attempt, hold W for 1.5 simulation seconds, release, and do not press E. The actual controller reaches z=2.600000000000007 with `stage === 'outside'`; the threshold is z=5.55. The current door check only rejects crossing away from its opening. Preserve explicit door entry by clamping outside movement to the public side of the closed door (for example z>=door.z+.24) until E changes the stage. Keep a path to E from both sides; do not solve this by adding an invisible wall at a coordinate different from the rendered door.

These are executed controller findings, not a claim about native PC/WebGL appearance. The shared source was not changed by this chat.

## Isolated candidate evidence

A separate candidate anchored to the earlier source has 18 layout/path/collision tests and 12 actual-controller branch/input tests passing under Node v22.16.0 (30 total). It uses one frozen metre-space layout, .24 m player radius, axis sliding with movement substeps no larger than .08 m, an explicit entry gate, public counter landing, and four counter positions. Its host branch tests cover early reprimand, expiry, registration from outside the kiosk, phone-hidden forfeiture, decline-to-A38 callback exactly once, answer-to-cancellation with no choices/A38, and replay cleanup. The phone is a test double: this is not real VDO.Ninja pairing and the A38 callback is not full mission-chain validation.

The candidate also ran in an isolated, launch-muted, headless Chromium **diagnostic fixture** at 1280x1000, 390x844, 320x844, and 640x1000 with 200% CSS zoom. Real browser keyboard/click events plus a deterministic simulation clock reached the decline/A38 callback in all four configurations without page errors or horizontal overflow. Screenshots show a clearly labelled 2D collision map plus controller text, NOT the production Three.js scene, accepted character sprites, production HUD/CSS, or a full game. An attempted localhost navigation was blocked by sandbox browser administration; the successful fixture used Playwright set_content with the same local scripts inlined, without changing browser policy. No user PC was accessed for execution or audio playback.

The candidate must be reconciled, not merged wholesale: the integrator has since moved the QR and added `officeBlocked()`. Prefer the two focused fixes above and port only useful test cases to the current layout. Full headless native desktop/mobile/320px/200% **production WebGL**, live phone pairing, asset checks, main-city entry, full A38 form, and publication remain unverified by this chat. ChatDev itself has not run here; its execution tools are not exposed in this v5 session.

## Civic-office references (design context, not copied artwork)

- Berlin Lichtenberg's official ServicePortal entry describes waiting-room calls by transaction number with both an optical display and a signal tone: https://service.berlin.de/dienstleistung/121701/standort/122252/ (read 2026-10-06). Preserve the episode's red single-code display and an audible cue; do not copy this office's real service procedures into satire.
- Friedrichshain-Kreuzberg's official 22 August 2023 project announcement discusses furniture, visitor guidance, and wayfinding for its Bürgeramt der Zukunft: https://www.berlin.de/ba-friedrichshain-kreuzberg/aktuelles/pressemitteilungen/2023/pressemitteilung.1358468.php (read 2026-10-06). Use legible entrance/registration/counter hierarchy and clear waiting routes as references. This historical announcement does not establish completion or current appearance in 2026.

No new image, texture, voice reference, binary asset, private name data, or third-party artwork was imported. Existing character/voice ownership stays unchanged.

## Proposed regression tests for the integrator

These cases intentionally fail on the newer reviewed controller and should pass after the two focused fixes. They use the repository's existing `tests/amt-harness.mjs`. The explicit path uses the newer QR at (0,-2.6); reconcile it if the room changes again. This is proposed source, not an automatically installed test or a claim that the integrator's current source passes.

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './amt-harness.mjs';

test('the closed entrance cannot be crossed before E',()=>{
 const h=harness();
 h.key('KeyW');h.advanceGame(1.5);h.key('KeyW','keyup');
 assert.equal(h.level.stage,'outside');
 assert.ok(h.level.view.z>=5.55,'Player crossed the closed entrance without E');
});

test('the Schalter 3 camera remains on the public side',()=>{
 const h=harness();
 h.moveTo(0,6.4);h.level.interact();
 h.moveTo(0,-2.6);h.level.interact();
 assert.equal(h.level.stage,'qr');
 h.links.at(-1).message({type:'register',name:'Erika Mustermann'});
 h.action();
 h.moveTo(-3.1,-2.6);h.moveTo(-3.1,1.8);h.moveTo(-4.65,1.8);
 h.level.interact();assert.equal(h.level.stage,'registration-done');h.action();
 h.moveTo(-3.1,1.8);h.moveTo(-3.1,-3);h.moveTo(4,-3);h.moveTo(4,-8.15);
 h.advanceGame(16);assert.equal(h.level.stage,'walk-counter');h.level.interact();
 assert.equal(h.level.stage,'counter');
 assert.ok(h.level.view.z>=-8.32,'Counter camera is inside blocked staff/desk space');
 assert.equal(h.counts.form,0);
});
```

Sandbox delivery to the user: `Buergeramt_ENV01_candidate_and_tests.zip`, including the earlier hash-bound candidate, 30 passing focused tests, exact newer controller reproduction, fixture screenshots, and a SHA-256 manifest. This archive is not a file on the PC and has not been merged or published. The coordinator's production WebGL check remains necessary before closing this accepted review.
