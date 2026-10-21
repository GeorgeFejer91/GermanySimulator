# Neighbor level storyboard

This is the sequence contract for the four active neighbors. Exact German speech,
English subtitles, stop coordinates and gestures remain in
[`neighbor-story.js`](../../../neighbor-story.js); shared police, music and speech
rules remain in [JWD gameplay](../../../For-AI/GAMEPLAY.md#jwd-home-and-neighbors).
Ede is [archived](../archive/ede.md) and has no active scene.

## Scene order

| Beat | Movement and staging | Dialogue and consequence |
| --- | --- | --- |
| Arrival | The allocated home and paved neighborhood become the active chapter. | Police actors, offenses, arrests, stars, alerts and law controls are disabled. Only the quieter 8-bit anthem plays. |
| Invitation | Any of the three adults can start the chapter. Halo, waypoint, automatic dwell and interaction select the nearest unmet adult; changing that actor resets dwell. The selected adult faces the player before moving. | Heiko gives his recorded self-introduction immediately, then skips that same line at the car. The other adults retain their follow invitation. Speech or its readable caption fallback finishes before departure. |
| Walk | The guide follows the authored paved route. A distant follower makes the guide wait. Actual displacement drives gait; a blocked guide plants their feet. | An authored travel line can start once on its walking leg. The next stop cannot speak over unfinished travel speech. |
| Arrival at a stop | Guide and any following adult reach their targets, settle, and show the body-clear standing position. | Stop speech requires the player nearby and in that position. The speaker owns the gesture, exact text, subtitle and voice. |
| Conversation | The speaking actor holds their position and looks toward the authored subject. | Only completion of the current line, or its bounded readable caption fallback, permits the next line. Stale callbacks cannot advance another line or tour. |
| Next stop | The last line releases the next authored route. | No dialogue redraw, repeated interaction or interrupted take can replay an already claimed actor/voice/source ticket. |
| Hartmut handoff | Heiko finishes calling, yields the doorway, and Hartmut physically walks out. Hartmut then leads the play route while Heiko follows. | Hartmut's reply waits for his arrival. Heiko cannot speak Hartmut's lines or receive his media clock. If Hartmut went home during interruption, resumption restores this doorway handoff before his leading leg. |
| Finish | The adult returns to their work station; Hartmut waves and follows his route home. | Only the last stop grants an introduction receipt. All three adult introductions finish the chapter objective. Police remain disabled throughout an active tour and while the player stays in the neighborhood. |

## Character paths

| Character | Introduction beats | Later authored scenes |
| --- | --- | --- |
| Frau Schwabingen | Broom → street → weeds in paving joints → hedge | Broom attendance; wild garden; blackbird appointment |
| Heiko Maaslos | Car paint → winter path → overhanging hedge → call Hartmut at the door → child-led play path | Snow inspection; boundary review; Hartmut's unplanned break |
| Inga Maaslos | Electric car and appearances → shutters and availability → garden volunteering → family doorway and exemplary commitment | Sustainable visibility; responsiveness and volunteering; family workload as a model for the player's contribution |
| Hartmut Maaslos | Appears through Heiko's doorway handoff, replies, then leads the play route | Reappears through the later authored call; no independent adult tour |

Heiko's welcome is a private checklist disguised as help. After introducing
himself before departure, he takes a pocket notepad from his left side at the car, reads the
welcome/path/hedge/Hartmut list and ticks the greeting. At the winter path and
hedge he reads and writes while explaining what the player will supposedly do.
He ticks those topics and writes throughout his play-path supervision and
Hartmut's entire reply, including “Papa, nicht mitschreiben”. He then marks
Hartmut's introduction and puts the notebook away. His pencil stays in his right hand. These are performed
line gestures, not extra objectives or an agreement by the player. Only the
existing final-stop receipt grants introduction credit.

Each `notebook` line uses the current recording's duration/playhead after native
start; queued speech can take out/read but cannot tick early. Caption fallback
uses the existing readable simulation duration with closed lips. Pause holds
the pose; native completion stows it. Cancellation releases the prop and lips,
and the next speaker owns their own lip cue. An explicit listener-writing intent
keeps Heiko's hand moving on Hartmut's media clock with Heiko's lips closed;
the following closing line retains the held notebook. Visible front/profile/chore mouths
are registered to their own painting; a rear-facing actor has no visible mouth.
Automatic speech keeps its subtitles and hides the actionless dialogue frame,
preventing an empty cream HUD box. Manual and welcome controls remain available.

## Interruption and repetition

Tickets belong to the actor, voice and exact spoken source for the current game
session. Claim happens before queueing. Start and completion receipts are accepted
only for the owning dialogue line. Cancellation retires the ticket; an interrupted
line remains available as a readable caption, without restarting its audio.

An interrupted tour resumes at its first unfinished stop. A child still outside is reclaimed by the tour at his current position; his home-return updater yields to that single movement owner. Completed stops do not
restart, and a finished script cannot start another empty walking tour. After an
adult's introduction, their three distinct later scripts run once each. When all
scripts are finished, that neighbor stops initiating new visits. A fresh game
session resets the chapter and tickets.

## Runtime owners and evidence

`talkJwdNeighbor` / `startJwdTour` select the current script; `advanceJwdTour`
commits stop progress; `updateJwdTour` gates walking, settlement and arrival;
`speakJwdTourLine` owns line and child-handoff receipts; `speakDialogueLine` owns
speech tickets; `setNeighborLevelActive` owns the police latch. These remain in
the single root `game.js` runtime.

Focused regression coverage lives in `tests/jwd-home.test.mjs`,
`tests/neighbor-dialogue-tickets.test.mjs` and `tests/neighbor-focus.test.mjs`.
Harness movement and speech-boundary mocks establish only their stated scope;
they do not establish natural player traversal, listening quality or device QA.

Subtitles start with native recorded playback and use that recording’s media clock, including a language change during the line. Superseded speakers cannot refresh or clear the current caption. Native end/cancellation releases it. Pagination without authored phrase cues divides the line over its recorded duration; this is not word-level forced alignment.
