# Music and sound design for the canonical game

This protocol defines the shared beat interface and evidence for music and nonverbal sound in the static game. Use `$music-sound-effects` for reusable FOSS production methods. [`GAMEPLAY.md`](./GAMEPLAY.md) and [`BUERGERAMT.md`](./BUERGERAMT.md) own the current cue, state, mix, and numeric policies; their controllers commit game events. Sound never creates a second mission state, backend service, or scheduler.

The reusable skill is pinned to [`GeorgeFejer91/music-sound-effects-skill`, commit `e6afde61c713aa0524f4a344ef289e1fc0c2159e`](https://github.com/GeorgeFejer91/music-sound-effects-skill/tree/e6afde61c713aa0524f4a344ef289e1fc0c2159e/skills/music-sound-effects) (private). Install that package directory as `$CODEX_HOME/skills/music-sound-effects` and read its `SKILL.md` plus only the relevant reference before use. The current personal installation is `C:\Users\cogpsy-vrlab\.codex\skills\music-sound-effects`. To update it, validate a new source revision first, then update the installation and this pin together. External ChatDev cannot read the personal installation; use the compact project contract and stage prompt described below.

## Start with the beat

State the player action, story purpose, emotional turn, and desired silence before choosing a timbre or tool. Keep four decisions distinct: **brief** (intent and constraints), **source** (licensed recording, synthesis patch, or score sketch), **render** (reviewed asset or browser synthesis), and **playback** (the runtime event that starts and stops it). Prefer the game's existing Web Audio paths. Strudel can sketch a pattern and SuperCollider can render an offline source when useful; neither is a runtime dependency. No paid API, model, or DAW is required. Only accepted, licensed and attributed renders enter `assets/`; existing source/provenance rules remain in [`ASSET-POLICY.md`](./ASSET-POLICY.md).

For each changed beat, the integrator records one compact beat card shared by content, storyboard/animation, gameplay, soundscape/mix, phone/voice and QA. It identifies:

- Stable beat and cue IDs, candidate revision, purpose, trigger and guard; the controller event or state transition that commits it, with attempt/episode ID or revision owner so stale and duplicate events are rejected.
- Exact spoken and visible text owner where applicable, and whether the cue is nonverbal; actor action, emotional arc, player control and mission outcome.
- Simulation clock for movement/queue state, monotonic peer clock for phone targets and receipts, Web Audio clock for scheduled sound, and observed Web Speech events for voice. State which clock can pause and how timestamps cross domains; never infer sample-accurate speech from a browser event.
- Priority, bus, ducking and overlap relative to dialogue, music and phone; bounded level, pitch/rate, distance, duration and cooldown/retrigger parameters. A pause or dramatic silence is an explicit outcome.
- Start/done receipts where another actor waits, maximum wait and fallback, interruption/cancellation on exit, replay, lost connection or changed attempt, and the single existing scheduler or broker that owns playback.

The card is an interface for the current change, not a second catalog or required new runtime schema. The integrator supplies its **actual beat ID, candidate revision, and compact contract** to every affected external ChatDev stage in that stage's invocation prompt or a tool-readable handoff. A reference to this protocol alone does not supply those values. Keep exact dialogue and recorded-speech bindings in [`AUDIO-TEXT-LIBRARY.md`](./AUDIO-TEXT-LIBRARY.md) and its JS authority; preserve visible-text lockstep. Integrate cue parameters into the owning code and document lasting behavior in its current subject document. Do not ship draft recordings, sketches, source models, or session reports.

When speech drives the score, hand off its authored rate/pitch, semantic word or phrase anchors, and stress/cadence contour with the exact line. Use observed speech start, boundaries, pauses and end for timing; distinguish those receipts from an estimated readable fallback. Browser voice pitch/rate requests do not expose a live pitch trace or a guaranteed acoustic contour. For accepted recorded speech, use its playback clock and measured phrase/prosody metadata instead. Keep dialogue intelligible, define what the music holds during a pause or missing receipt, and let the existing speech completion and cancellation guards own the payoff. Document the actual rig in the episode's beat card.

When a visual transformation and a score are one dramatic process, define their shared control signal before rendering audio. The existing controller owns proximity/progress, pressure, pulse phase, semantic accents and release. Both sound and animation project those values; avoid a baked riser or an unrelated animation beat that can reach its climax early. Author stationary compatible layers, then let committed motion and speech shape their density, spectral aggression and envelopes. Reduced motion removes visual cycling without disabling the score. A withheld payoff is explicit: build expectation, hold for the owning event, and cut to the ordinary scene without an impact or resolving chord.

## Bürgeramt example and boundary

The ordinary office has no continuous background music. The Aktenkurier's approach is a bounded, encounter-only exception: distorted low brass, beating bass and abrasive inharmonic metal build a Kafka-like threat that never pays off. `BuergeramtLevel.omen.life` supplies the shared distance/depth, pressure and accelerating pulse for audio, the frontal Gaussian relief and the contracting dark tunnel. Speech receipts contour their peak; completion owns the final glare, then light restores and the sound cuts without a resolving chord or attack. Keep the queue pause and exit/replay cancellation. The office and phone retain separate audio contexts; the desk owns the committed pre-ring cue while the phone owns its ring and speech receipts. [`BUERGERAMT.md`](./BUERGERAMT.md) owns the cue sequence, buses, mix and numeric settings, and [`PHONE-CALL-TIMING-RESEARCH.md`](./PHONE-CALL-TIMING-RESEARCH.md) owns the measured phone timing limits.

The existing city soundtrack remains governed by its music toggle, foreground audio broker, and `GAMEPLAY.md`; an office cue must not silently change city music policy or voice priority. The static controller owns state and committed events; renderer and audio projection follow that state. A new audio requirement does not justify a service, asset pipeline, or parallel scheduler.

## Review evidence

### Mission fax beat (`mission-fax-feed`, 2026-10-08)

`game-hud.js` commits one arrival or departure for the current visible mission
sheet. Quiet city state guards arrivals; objective changes invalidate the old
sheet, and warnings, dialogue, office entry, file opening or page hiding cancel
its active effect. This nonverbal cue reuses `game.js`'s synthesized fax-feed
motor, roller clicks and paper noise on the existing ducked sound-effect bus.
No new recording, download, speech or mission state is introduced. Each motion
has one 1.08-second cue; the Gaussian alpha-mask renderer samples its Web Audio
elapsed clock with a bounded monotonic fallback when audio cannot advance.
Completion starts 12 readable seconds or the following 150-second reminder gap.
Cancellation stops every scheduled source and detaches its output. Reduced
motion shows/hides immediately while retaining the bounded sound cue. Silent
state/timing checks and rendered screenshots establish synchronization behavior;
listening and physical Android evidence remain separate.

At one candidate revision, report separate results for (1) source/license and render inspection, (2) deterministic cue/state and clock/receipt checks, (3) muted isolated Chromium desktop and Android mobile browser timing checks, (4) physical device and paired-phone behavior when actually tested, and (5) perceptual listening on the intended output. Mark unrun checks `NOT RUN`; silent browser checks establish scheduling, not perceived loudness, balance, or timbre. Review cancellation, duplicate/stale events, mute/ducking, missing asset or speech fallback, and the whole story-to-gameplay beat. Use the shared [`chatdev/README.md`](./chatdev/README.md#shared-contracts-and-convergence) verdict and candidate-revision format.
