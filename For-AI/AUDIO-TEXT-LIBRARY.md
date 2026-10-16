# Speech catalog and subtitle authority

Heiko and Inga also own their personal replies before the home-visit prerequisite is fulfilled. The existing guard remains; these replies grant no introduction credit. Heiko now has 36 cast-owned pairs and Inga 34, with prior clip IDs unchanged. Their existing and future recordings use the one approved offline cleanup recipe in [the voice protocol](./VOICE-SYNTH-PROTOCOL.md#current-maaslos-speech-and-cleanup-2026-10-15); no runtime filter or second audio clock is added.

The guided neighborhood story in `neighbor-story.js` pairs every stop and travel
line with its exact English caption and stable speaker. `VOICE-CAST.json` also
indexes these authored lines. Hartmut Maaslos is `jwd-theodore-maaslos`, actor
`jwd-theodore`; his current recordings use the selected GS Hartmut profile
with caption fallback. His voice never borrows a parent's clone.
New Inga tour lines retain her selected voice's caption fallback when no exact
recording exists. A roaming line keeps player controls active, uses the existing
foreground broker, and ends before a stop's dialogue can begin. Cancellation,
pause and stale completion remain scoped to the current tour and cue.

The three neighborhood residents use stable IDs `jwd-heiko-maaslos`,
`jwd-inga-maaslos` and `jwd-frau-schwabingen`, paired with their exact `jwdCopy`
German sources and English subtitles. The cast derives their runtime identity
rows; `assets/voices/neighbors/*-manifest.json` derives eligible exact-text
recordings through the existing curator. Inga and Frau Schwabingen use their
selected saved profiles with caption-only failure fallback. Schwabingen's whole
dialogue is exaggerated written Swabian using the user's new `(2)` profile;
Whisper transcripts remain advisory under her explicit cast policy. Heiko
uses his selected recordings with caption fallback.
Recorded entries include per-take identity,
source/encoded hashes and 40 Hz final-MP3 energy. The energy estimates mouth
opening; media time and broker start/end receipts own playback. Letter-derived
round/spread shapes remain phonetic estimates. A queued, caption-only or stale
cue cannot make a neighbor talk. No recordings preload at city startup.

`jobcenter-overlord` is the Jobcenter encounter's one recorded speaker and
stable game voice ID. Its catalog `source` exactly matches the German text in
`assets/audio/jobcenter/overlord.json`; the paired English subtitle stays with
that one recording. `speechClip("jobcenter-overlord")` exposes `text`,
`recording`, `english` and `durationMs` (26,783). The 40 Hz energy and attack
arrays in the sidecar are measured from the final encoded MP3 and serve the
flame animation, not speech timing authority. The 214,892-byte MP3 is requested
on Jobcenter entry through one visit-owned media element, with no startup
preload or overlapping city speech. Its SHA-256, profile receipt, render recipe, source
attribution and encoded levels are pinned with the asset and cast. Use
authorization and automated word matching are recorded; listening is NOT RUN.

The first-person mirror monologue is `player-potato-mirror`, one continuous
Hans-Peter Mustermann take on `spieler-hans-peter-mustermann` and selected native
profile `b027d18a4fc748cabb133fbb14077500`. Its separate mirror manifest supplements
the unchanged 107 answer labels and continuous portrait recording through the
existing player-reply lookup. Player fallback is now exact captions, never a
different browser voice. Fixed recording entries carry and verify the selected
profile, engine/revision, both reference hashes and processing as well as exact
source text. The [allocation protocol](./VOICE-SYNTH-PROTOCOL.md#allocating-and-using-voice-ids-2026-10-13)
owns future voice-ID assignment and generation; the cast remains the sole registry.
The generated lookup encodes identical take receipts once and expands their full
fields into each entry at initialization. These receipts come from the reviewed
takes, independently of the current cast table, so compact delivery preserves
engine/reference/processing drift checks.
Fixed-caption word cues use compact delivery tuples that reconstruct the same
`at`, `end`, `charIndex` and `word` objects on initialization. Preserve the exact
authored numbers and text; do not round timing to reduce catalogue size.

For the staged Bürgeramt telephone, police transcripts appear only in the
desktop game's in-scene subtitle rail on phone start/done receipts. Neither the
paired phone nor a smartphone game browser displays telephone dialogue, even
when audio fails. The phone shows incoming controls and then elapsed call time,
with no pairing messages or silence-calls action on its appointment page.
Frau Knick's counter and argument share the selected `amt-brunhilde-knick`
profile. The speech lifecycle checks `recordedClip(voiceId,text)` before audition
lookup; all current Knick lines now have exact selected-profile recordings.
Unavailable assets retain her selected caption fallback. A
manifest accounts for every requested line as an eligible clip or held fallback;
it need not generate unrelated lines before admitting independently checked takes.

Current generation bindings are `VOICE-CAST.json`'s `productionVoices`; the catalog exposes their generated production table. Earlier primary entries remain source provenance; redundant Qwen generation bindings and renders are removed. Follow [the fixed-voice workflow](./VOICE-SYNTH-PROTOCOL.md#fixed-voices-and-the-agent-workflow-2026-10-11) before generating or promoting speech. Default and audition lookups reject replaced profiles; 85 retired/superseded recordings now live in the private Music archive, including 17 superseded first-pass Knick files. Five retired fever clips are removed from the foreground inventory. Knick uses the selected recordings with exact captions for dynamic, missing or failed audio; she never switches to browser speech. The three dedicated street advisers also use fixed recordings or captions. Other characters follow the current fallback authority in the [voice protocol](./VOICE-SYNTH-PROTOCOL.md); a selected binding alone does not imply captions.

The Aktenkurier's omen line “Wer die Finsternis sieht, hat sie selbst gewählt!” now defaults to the user-approved recording `aktenkurier-omen-candidate-02`, from Horst Stempelmann's second official candidate profile. His primary profile stays preserved. The exact `voiceId` and complete source text select this recording without the preview flag; a missing or stalled asset retains the same German caption under his selected voice policy. He now has only the automatic omen interaction; his other authored lines remain catalogued. Archivbotin and Formularsammler use the user-approved fever recordings, with exact-text caption fallback. Their exact German lines live in `buergeramt-story.js`, which also owns each line's mood tone and valence. Profile bindings are in [`VOICE-CAST.json`](./VOICE-CAST.json) and mirrored in `AUDIO-TEXT-LIBRARY.js`. [`VOICE-SYNTH-PROTOCOL.md`](./VOICE-SYNTH-PROTOCOL.md) owns the individual approval and provenance. `buergeramt.js` reveals the exact line in the in-scene caption on actual speech start or readable fallback and cancels it when the encounter closes. Native playback word cues and pause/end receipts drive the existing omen life/score controller. The office `STIMMEN` level controls new utterances and the recording's live gain; `RAUM` and `EFFEKTE` cover only nonverbal room sound. The phone's call level controls its ring and static immediately and later police utterances at their start.

[`AUDIO-TEXT-LIBRARY.js`](./AUDIO-TEXT-LIBRARY.js) loads before `game.js`. Its `voices` registry assigns stable speaker IDs and stores local Voice Cloner bindings; `castVoices` and `roleVoices` mirror the verified new Secret Tunnel profiles from `VOICE-CAST.json`, with selected UUIDs, reference hashes and renderer revisions. `speechFamilies` maps browser-speech and recorded trigger families to these IDs. Merz and Merkel use their selected native profiles for current delivery and future generation. Bayern and Alice now have their own saved source-reference profiles in the existing legacy voice registry, while their thirteen supplied recording objects remain unchanged and unprofiled. Together with 67 fixed production identities, this gives 69 saved game voice allocations; these two saves neither add productionVoices entries nor generate speech. Exact native names, original/reference hashes and source scope are audited in VOICE-CAST.json existingAssetProfiles and the current saved-cameo section of VOICE-SYNTH-PROTOCOL.md. Traffic’s four stable IDs retain exact paired text; three have fixed owned recordings and the held source follows its selected caption policy. `clips` indexes every shipped foreground speech asset by stable clip ID. Each clip keeps its German spoken source, English subtitle, current recording voice ID, trigger, and file path together. `targetVoiceId` marks the separate saved profile intended to replace a legacy recording; it does not claim that the current file was generated with that profile. The five long station clips also have timed subtitle cues. The path-keyed `recordings` view still serves the subtitle broker.

The catalog has 113 foreground clip entries before the new fixed-profile Knick batch, including the eleven stable rule IDs and four traffic IDs with exact text. The two Merkel source excerpts and five rewritten fever lines are retired; nine GS Merkel lines and 35 current fever lines remain. `assets/voices/knick/manifest.json` and `ambient-manifest.json` add only independently word-checked, level-checked takes with successful native EOS from Knick's selected profile. Street-adviser recordings reuse the existing rule IDs. Held takes remain private with exact visible captions. The catalog's `clips`, `recordings` and these manifests own the current counts. The law and rule entries are generated from ordered German/English decks in this file; `game.js` uses `speechClip(id)` for exact text and paths. The thirteen `law-*` entries now speak only a citation and heading (number 13 only the citation), with short matching English text; their full original paragraphs and source catalog remain at Git commit `3242218`. Original recordings and derivatives retain provenance in `assets/voices/LICENSES.md`, and train provenance remains in `assets/audio/trains/PROVENANCE.md`.

Authored dialogue sources remain in `game.js`: source-language pools, regional variants, dynamic lines, and trigger logic. Selected profiles use exact recordings and the fallback policy in `productionVoices`; scoped street identities retain captions when their own recording is missing or fails. This catalog's `pools`, `lines`, `quizContexts`, and `questions` provide English subtitles; `speechFamilies` records each family's delivery and any intended character profile. Subtitles stay enabled, with German selected by default. The broker starts subtitles with actual audio playback and clears them on completion or cancellation. Choice/document questions remain available; spoken dialogue and speaker names use only the subtitle rail; city barks use one caption stream with speaker identity, showing the source or its opted-in English translation. For unbound or explicitly retained dynamic speech families, browser speech prefers installed local voices and retries an unavailable local voice once with the browser default, and avoids cancelling an idle engine before a new line. Visible captions occupy a fixed two-line strip at the bottom edge on desktop and mobile; phone controls and dialogue rise by its rendered height. Pretext measures each caption against that strip and splits long translations into fitting parts. Authored train cue windows retain their start and end times; parts within each window advance by proportional text length against the Web Audio clock. Other recordings use their decoded audio duration with the same clock. Browser speech advances parts from utterance word-boundary positions, with a duration estimate if boundaries stop arriving. The toggle shares the top city rail with Germanness, and an impossible single-grapheme fit can scroll within it.

The single subtitle language button remains reachable on the title screen, in city overlays and forms, inside the native game-file dialog, and throughout the Bürgeramt. Subtitles are always enabled. German is the default when there is no saved preference; a saved English selection is restored without replaying the cue. Each German-to-English action queues the three authored `subtitle-approval` lines from `game.js`, with one source-or-English caption following playback. Repeated enabling while that family is pending does not stack another batch. Voice-off behavior still respects the player's voice setting. In the office, the city broker waits for the current desk speech to finish; subsequent desk speech waits for the pending approval batch and the broker's final 250 ms completion gap. Office cancellation must not cancel active city speech. These paths share the existing city queue and office admission callbacks.

Voice-off city barks keep a bounded timed reading in the same caption stream. Toggling English or changing typography/viewport repaginates at the current speech clock. The control and caption rail move into the native file dialog together; modal reading stays accessible.

Official documents, HUM-01 readings and reprimands, opening mission guidance, city office procedure prompts, laminated notices, fax/deposit-machine readouts and subtitle-authority announcements share the stable `narrator` voice ID. It retains the older machine-like female browser speech, with one deterministic voice choice per available language/voice list and fixed rate/pitch from `voices.narrator.browserSpeech`. Local German voices are preferred: Microsoft Katja (the former HUM-01 choice on the current Windows installation), then Hedda, Google Deutsch, Anna, Marlene and Vicki; an unrecognized system list uses its language default or a stable name order. English form readings retain their existing language choice and use the female English preferences in the same policy. Browser voice names/URIs depend on the device; the old runtime hashed office labels and did not save an exact historical OS voice URI. Missing language voices or a failed narrator take keep exact captions instead of switching to an arbitrary browser default. Future impersonal form, mission and process readouts must pass `candidateVoiceId:"narrator"` (or `voiceId:"narrator"` through `openDialogue`), keeping the displayed speaker/title separate. Named characters and recorded train announcements keep their own allocations. The `narrator` role has no Voice Cloner profile and must not be rendered into a separate clone clip set.

The first Bürgeramt episode keeps German desktop speech and exact-text phone recordings. Host `sync-ping` runs every 1.5 s; four monotonic stamps estimate peer offset, round-trip delay and uncertainty. Phone `police-start` carries the observed local onset and optional TimeAPI UTC stamp. A fresh peer offset maps it to the host; a qualified TimeAPI anchor maps UTC when peer timing is unavailable, with receipt-relative timing as the final fallback. `BuergeramtLevel.timing` records the chosen clock domain, local durations and receipt jitter. Character sequences reuse that same plain caption surface without a panel or return button, and finish automatically after speech and their gradual release. The Aktenkurier alone starts automatically; the other eleven speakers require E. The character-owned random ambient pool in `buergeramt-story.js` uses the shared speech lifecycle and exact speaker captions in `#amt-ambient`; it waits for foreground speech and stops when counter dialogue takes over. Its recordings and caption-only fallback are documented below. Telephone rings are nonverbal synthesized effects. The office retains its quiet room bed and E-triggered nonverbal fever beds. Thirty-five current exact cloned fever lines play by default following the user’s explicit “I approve, just implement it” instruction. Knick keeps exact captions for unavailable takes; other characters retain their documented browser fallback. Knick and the Kriminalpolizei use their selected production profiles. Counter captions belong to Knick; police dialogue appears only in the desktop game subtitle rail on the phone playback receipts.

The counter-clerk identity is **Brunhilde Knick**, `amt-brunhilde-knick`, with selected Secret Tunnel profile `b080c7d95ecd418fb428282461d7fbe7`. Her previous primary profile `1a28fb7903d344518617d755a7f5cbb0` is archived provenance. `productionVoices` pins her current reference, renderer and undertone. Her counter prompts, replies, registration graph, warnings and ambient remarks are inventoried in `VOICE-DIALOGUE-INVENTORY.json`. Reused fever recordings and new exact-text takes share the current profile. Dynamic or unavailable lines use captions, including when the catalog cannot load. Registration choices remain visible beside Knick; each exact player-label recording finishes before her matching reply begins. The final document-taking choice has its own player recording.

Three distinct stationary Bürgeramt patrons have name-bearing IDs and private EmoDB-based profile bindings in `VOICE-CAST.json` and `roleVoices`: **Konrad Wohnungszettel** (`amt-konrad-wohnungszettel`, renter), **Mechthild Elternbogen** (`amt-mechthild-elternbogen`, parent), and **Wolfram Rentenbescheid** (`amt-wolfram-rentenbescheid`, pensioner). `world3d.js` associates those identities with their visual figures. Their exact authored E interactions are in `buergeramt-story.js`; registered Gaussian anchor packs cover all three. Named saved fever profiles supply user-approved default Chatterbox speech. The exact approval and unverified perceptual listening status are documented in `VOICE-SYNTH-PROTOCOL.md`.

All four counter slots are **Brunhilde Knick** (`amt-brunhilde-knick`), one person with one selected voice. The user explicitly rejected the distinct Frau Frist/Erna, Durchschlag/Ottilie and Zuständig/Hedwig identities on 2026-10-12. Their active cast/profile bindings and three replacement ambient takes are retired; private originals and saved native profiles remain preserved. Staff background remarks restore the exact existing `knick-ambient-clerk-1`, `-2` and `-4` recordings. Every counter refusal uses Knick's exact approved fever take, and registration/police dialogue keeps her selected voice. Counter render slots remain distinct for animation, while source captions, displayed names and speech share Knick's identity.

Hans-Peter Mustermann's Bürgeramt answer labels use the separate user-selected Thorsten Nachschub player profile on the stable `spieler-hans-peter-mustermann` ID. The exact 104 graph labels, two phone-warning choices and final document-taking choice form the bounded `player-replies` family. Knick's new introduction and completion use fixed authored words; the unused dynamic-name and expiry notices cannot substitute for those recordings. The saved source/profile hashes, shared authoring workflow and independent encoded-word gates are documented in `VOICE-SYNTH-PROTOCOL.md`. The final pack covers all 107 distinct player labels and all 168 current Knick strings, including one approved fever reuse; only an unused historical main-manifest slot stays private. Three named Knick joins use explicitly reviewed complete-file contiguous encoded-ASR recognition while preserving conflicting whole-line readings. This is technical word verification, with no listening claim.

For catalog/locale changes, use `game-localization` to check stable IDs, missing translations and fallback coverage. Preserve exact display/speech/speaker pairing and region-specific spoken language. Presentation-language changes must preserve mission/session state, current cue ownership and focus; reuse these catalogs rather than adding a second translation database.

### Bürgeramt background remarks (2026-10-12)

`buergeramt-story.js` owns 21 ambient speaker/text entries with 17 distinct
German remarks. Twelve are new Kafkaesque snippets; both original waiting-room
complaints have separate Konrad, Mechthild and Wolfram recordings. The three
counter remarks restore Knick's original recordings and shared identity. Random selection
avoids consecutive identical speakers or text. `officeAmbientRecordings` is
generated from `assets/voices/office-ambient/*-manifest.json` by the existing
curator; exact actor/text/profile and encoded-word/level/completion gates apply.
Playback uses one requested recording at the existing quiet background gain;
visible captions and mouth cues belong to that speaker. Missing assets, an
absent catalogue and voices-off retain exact captions without machine speech.
Foreground speech, counter entry, replay and exit retain the existing guards.
This pool is the current background authority. Listening and physical-device checks remain
separate from technical generation and silent browser tests.

### Recorded office mouth timing

All eligible office MP3s share hash-bound phonetic mouth cues and
an acoustic envelope sampled every 10 ms. `assets/buergeramt/speech/mouth-cues.js`
is derived from the unchanged encoded recordings. The independent local
Whisper decode and existing approved catalogue word timestamps are diagnostics
and semantic receipts; the actual media playhead and sound envelope own visible
openings, silence, pause and completion. No voice profile or source text changes.

The cue binding is ready before `play()`, subject to the existing startup
watchdog and attempt/cue guard. A late import cannot start a cancelled line.
Native Gaussian paint, its atlas fallback and the approved omen use the same
sampler. Coarticulation is centred on a measured boundary, with at most 40 ms
anticipation/release and no second delayed filter. This is a sampling/blending
contract, not a claim of 10 ms phoneme accuracy or hardware acoustic latency.
German phonetic shapes remain estimates. Dynamic browser speech and optional
preview recordings without approved cue data retain approximate articulation;
voice-off and failed speech remain neutral. Reproduction and tool versions are
in `assets/buergeramt/speech/PROVENANCE.md`.

### Bürgeramt timekeeping contract

The wire envelope is version 3; the QR points to the versioned phone page and both HTML pages request versioned timing scripts so cached older peers cannot silently mix with this protocol. The host records monotonic `t0` before `sync-ping(id)`; the phone returns monotonic `t1` at receipt and `t2` when sending `sync-pong(id)`; the host records `t3` on receipt. All four values are in their own browser's `performance.now()` domain. Calculate network round trip as `t3 - t0 - (t2 - t1)` and phone-minus-host clock offset as `((t1 - t0) + (t2 - t3)) / 2`. Reject unknown IDs, malformed stamps, negative or over-12-second trips. Keep at most two pings outstanding and seven valid samples. Use the median trip for one-way pacing, the spread for jitter, and the median offset of the three lowest-trip samples for mapping phone events. An offset older than six seconds is stale. Half the slowest of those three selected trips is a diagnostic uncertainty estimate, not a guaranteed acoustic timing bound.

For the first ring, the desktop sends `call-arm` when Frau Knick's existing sentence starts, and the phone returns `call-ready` after it attempts to resume the AudioContext unlocked by name submission. After readiness or a one-second fallback, the desktop sends `call` with a future target in the measured phone clock domain and an optional TimeAPI UTC target. The phone selects the fresh peer target, otherwise a qualified UTC target, otherwise a receipt-relative lead. It returns `call-scheduled` with its actual target, timing mode and lateness. The host schedules a 217 Hz style office interference cue 900 ms before the target and ducks office Web Audio; it pauses browser speech where supported. The phone schedules its first audible burst on Web Audio ahead of the target and asks for vibration at target time. These are browser-event schedules, not measured acoustic or motor onsets. See [`PHONE-CALL-TIMING-RESEARCH.md`](./PHONE-CALL-TIMING-RESEARCH.md) for source evidence, API comparison, thresholds, and the exact cue script.

Each phone start schedules a host-owned `police-cutoff(index, stopAtPhoneMs, stopAtUtcMs)` ahead of the shared cut-in deadline. Phone playback stops locally at the exact index/deadline, clears static and emits one duration-bearing done receipt; late callbacks cannot advance the scene twice. The host starts the next desk cue from mapped onset plus its authored budget, compensating learned desk startup delay. A failed cutoff send retries twice after 100 ms; after that the host waits for natural completion or a 60 s bound and does not claim interruption. Her first three turns request a police reply before completion; its actual start stops her current voice. The last retort and dismissal finish fully, returning to the street without A38. Missing start receipts release after 18 s and disconnect releases the pending turn immediately. Replay/exit cancel all timers, media and stale callbacks. These clocks describe browser events and do not guarantee sample-accurate acoustic onset.

The train recordings use the station-idle, track-exception, distance-fade and neighbor-isolation contract in [GAMEPLAY: Systems](./GAMEPLAY.md#systems). Ordinary clips require five stationary seconds wholly inside one station. Only Buxtehude may start on actual track contact. Source-station distance gain feeds the shared foreground bus; leaving audible range or opening a conversation cancels playback. Exact recordings, text/cues and voice ownership remain unchanged.

The four traffic-driver lines are original short reactions informed by [German road-rage vocabulary](https://www.reddit.com/r/German/comments/129uvu5/road_rage_vocab/) and [reported street confrontations](https://www.reddit.com/r/AskAGerman/comments/1f1lfs3/a_man_got_angry_at_us_for_crossing_the_street_at/). They are not quotations attributed to Reddit users. The car that first brakes for the player selects a Berlin-Denglisch or Deutschland-German clip; the immediate horn is a separate nonverbal effect. All four exact owned recordings now resolve through Dieter Hupfer's selected fixed profile. Germany01 uses the finite compound-timing proof in its gap manifest, preserving the original literal-false receipt and raw empty cues. A failed recording retains the selected voice's caption fallback. The traffic gap manifest accounts for all four generated takes; no unrelated browser voice substitutes for a selected fixed voice.

For a new character, follow [`VOICE-SYNTH-PROTOCOL.md`](./VOICE-SYNTH-PROTOCOL.md): create one reusable Voice Cloner profile, add its voice ID, then add a clip ID per approved line. Reference that clip ID from the owning game trigger. Background music and nonverbal effects are excluded.

The quiz card's main paragraph contains the full spoken passerby remark, conversational context, and question. Browser-speech dialogue appears on the utterance start event; recorded lines reveal their text in the same task as source start. With `?voicePreview=1`, the broker may join three exact-text, same-`voiceId` recordings in that order; all three must exist before it selects recordings, and a load failure uses the selected speaker's fallback policy. The subtitle uses the total Web Audio duration, and cancellation stops every scheduled segment. The first narrow sample is Brigitte Neumann's Germany-side approach 8, traffic context, and FS-10 question, catalogued in `assets/voices/quiz-segments/manifest.json`. Other combinations follow the selected speaker's fallback policy; current selected quiz identities retain captions when their complete recording is unavailable. The three-part sample awaits listening review. Rule and subtitle-approval readings use the shared bark box, and each HUM-01 spoken chunk appears in its readout status while it plays. For unbound or explicitly retained dynamic speech families, browser speech prefers installed local voices and retries an unavailable local voice once with the browser default, and avoids cancelling an idle engine before a new line. A stalled browser voice releases a readable line and the queue after its startup watchdog.

Synchronous recording-preparation or native audio startup failures retire any partially allocated sources and gains, then apply the current owner's existing caption or unbound-speech fallback. Recovery checks generation and active ownership before changing shared state. Successful playback keeps its native scheduling, caption clock and completion policy; stale work cannot release a newer owner.

The four original `KL` Kugellager questions share the quiz speech path. Their Schweinfurt/Sweden context and English question subtitles are keyed by source ID in the runtime catalog; German-only and Berlin-Denglisch prompts remain authored in `game.js`.

The caption's two-line bottom slot remains measurable when its text is hidden. The dock, Germanness rail, subtitle toggle, footer, dialogue, and reading modals use that reserved height whether a caption is empty, short, or long. Dialogue keeps a fixed outer box; long source text scrolls inside it while its action buttons stay in place. Caption or textbox changes therefore do not move the surrounding controls. Viewport resizing updates the shared slot and repaginates active captions.


The Bürgeramt phone has its own `kriminalpolizei` institution voice, bound to the user-selected saved profile `GS Kriminalpolizei`. Four exact-text recordings under `assets/voices/kriminalpolizei/` play by default through `recordedClip(voiceId,text)`, independently of the audition flag, and retain the existing recording receipts and cancellation. Their encoded transcript, duration, hash and loudness checks are in the adjacent manifest; perceptual listening and physical-device validation remain unperformed. The incoming caller stays `Unbekannte Nummer` with either German or English call controls. Earlier Heinrich phone candidates are retired from preview lookup; his city barks retain their voice.

The user-selected `GS Merz` profile supplies all authored Friedrich Merz lines, including the two original game scripts and nine source-verified short quotations for proximity and direct interaction. Exact German source strings and English subtitles remain paired in the catalogue. Speech loads on request through the existing bounded cache; missing audio uses the same German text and masculine browser voice. Profile hashes, selected takes and encoded-word checks are in `assets/voices/merz/manifest.json`; listening and physical-device validation remain unperformed.

The added quotations cover the 2025 Munich campaign speech, the 2023 WELT TALK dentist remark, and the 2025 Stadtbild press-conference response. Each quotation has its event date, source, and context in the Merz manifest. The “Spinner” bark is a verbatim closing clause with an initial ellipsis; it is not presented as a complete historical sentence. These are synthetic renditions in the game’s existing fictional-satire frame, with paired English subtitles. Selection reflects documented controversy, without claiming a measured ranking of popularity.

Validation on 2026-10-10: all seven final MP3s passed encoded-word agreement and the −18 LUFS / −1.5 dBTP limits. The five affected catalog, owner, trigger, broker and fallback checks passed against the integrated release. Silent Chromium checks covered all seven recording starts, paired source/captions, direct interaction, voice off, and exact German missing-file fallback at 1280×800 and Android emulation at 390×844 and 844×390. These were forced actor approaches; desktop and portrait retained normal competing speech. Landscape used a focused Merz-only speech session after a long train announcement interrupted its natural run. This establishes speech lifecycle and integration, not natural mission, perceived sound quality, or physical-device performance. Private playback-start receipts, screenshots and runtime/catalog/manifest hashes are retained in the Music voice library’s GS Merz resynthesis archive.

## 2026-10-11 Merz quotation extension

Four additional GS Merz recordings extend the pool to eleven lines: the original 2025 Stadtbild clause, two statements refusing to retract and reaffirming that remark, and the 17 September 2026 Berlin campaign remark describing antisemitism as a form of xenophobia. Each exact excerpt has a source, date and context in the Merz manifest, with an English subtitle in the catalog. The Stadtbild excerpt marks both omitted boundaries with ellipses; its source sentence continues with large-scale returns. The refusal is specific to that dispute and does not claim he will never apologize for anything. The antisemitism wording is presented as his controversial quotation, not as a definition endorsed by the game. The unchanged saved GS Merz reference supplies every line.

Validation on 2026-10-11: the four new encoded MP3s matched every authored word in bundled German ASR and passed −18 LUFS ±0.3 / ≤−1.5 dBTP limits. The existing Merz ownership, catalog, broker, subtitle, fallback and asset-loading checks passed for the eleven-line pool. Silent Chromium covered all four new recording starts with paired source and English captions, direct interaction, voice off and a missing-file German fallback at 1280×800 and Android emulation at 390×844 and 844×390. The test selected the four additions and suppressed competing speech during forced actor approaches; it establishes speech integration, not natural mission coverage. No startup Merz preload or speech-cache budget violation was observed. Physics and Camera reviews are out of scope because only speech assets and text/catalog bindings change. Private start receipts, screenshots and revision hashes are archived in the Music voice library. Listening review and physical-device coverage remain unperformed.

All nine authored Merkel lines now use GS Merkel recordings under `assets/voices/merkel/`, including proximity and direct interaction. The manifest preserves exact German/English ownership and profile hashes; original excerpt delivery is retired.

The first-pass Knick history in `assets/voices/knick/legacy-receipts.json` pins source, profile, renderer, raw and encoded hashes, but lacks native end-of-generation evidence. It is historical provenance and cannot qualify a take for the current fixed-voice library. Every newly authored Knick, ambient and street-adviser recording requires explicit successful native EOS, independent encoded-word checks and verified levels; a missing or failed EOS leaves the line in captions. Public `--check` verifies shipped receipts without requiring mutable private request files. Bounded processing retains the full requested/held accounting. The separately documented exact approved fever recordings retain their original historical provenance.

Selected Knick recordings retain a four-second native startup budget, including
a fresh budget after visibility resumes. A slow valid decoder may start after
the former 1.8-second deadline. Cancellation still clears the media and rejects
stale events; a missing or unstarted recording retains her caption fallback.

Native recorded playback uses actual currentTime advances to renew a finite 20-second no-progress timeout. Repeated events with an unchanged playhead do not renew it; hidden or explicit pauses preserve the remaining interval, and cancellation keeps cue ownership. A slowly advancing recording can finish naturally instead of being cut off at its wall-clock duration.

### Always-on office subtitles and portrait continuity (2026-10-12)

Subtitles are always enabled. The shared language control defaults to German and preserves an explicitly saved English selection; switching to English queues the existing three-line subtitle approval audio. Bürgeramt speech uses that same rail, with recording-playhead pagination, immediate language refresh, and cancellation cleanup. Speaker names and source dialogue are not duplicated in the office overlay. Voices retain their authored German/Denglisch. Desktop police captions use the same rail on phone playback receipts; the paired phone keeps its call controls. The Steinmeier portrait retains every authored word in one newly synthesized full-text recording. The subtitle parts follow the native recording playhead; caption-only fallback uses the same bounded reading clock. One media completion returns to the current waiting state. The existing visit/cue owner handles hidden pause, cancellation and stale receipts. No movement, collision, camera, scale or painted animation behavior changes in this scope.


### Repeated calls and personalized Kripo opening (2026-10-13)

`phoneWarnings` owns four escalating selected-Knick reactions. Their supplement
is `assets/voices/knick/phone-reactions-manifest.json`, merged through the existing
curator and exact speaker/text lookup. The fourth arrival commits cancellation
before its complete dismissal. Receipt and attempt guards own all continuations.
The Kripo opening interpolates the registered name only in the short German greeting. It then plays the exact fixed body from `kriminalpolizei-opening-body.mp3`, derived at a verified sentence pause from the original selected Kripo take. One composite cue owns the complete desktop/English caption and completion; synthesis failure continues to the recording. Knick's local name model remains separate. `phone-dismissal-manifest.json` supplies the new last warning, short Reichsadler expulsion and post-Kripo dismissal, using her unchanged selected profile. These three clips plus the Kripo excerpt total 240,752 bytes / 19.02 seconds; largest mono 48 kHz Float32 decode 1,608,960 bytes. Exact encoded ASR, native EOS for new synthesis, levels and hashes pass. Listening remains NOT RUN.

The four accepted clips total 555,056 bytes / 34.44 seconds; the largest
single decoded mono 48 kHz Float32 clip is 2,618,880 bytes. They use the
existing lazy media owner and selected Knick profile. The fourth uses an
approved five-part contextual rescue with exact independent recognition of
the final joined MP3; failed takes remain private. Native EOS, encoded ASR,
levels and hashes pass; perceptual listening remains NOT RUN. The existing
curator now shares repeated approval, provenance and trigger metadata along
with production receipts, saving 128,252 bytes while preserving every complete
runtime recording entry. No new model, service or background polling is added.

## Personalized named city dialogue

The nineteen `city-` actors own four regional dialogue rows each in `VOICE-CAST.json`: Germany slots0/1 and Berlin slots0/1, with exact source, English and locator. The curator derives and checks `cityDialogue`, including its public export. `cityNpcDialogue()` requires the actor’s matching selected voice and two current-region pairs before the existing E route opens them. German/Denglisch remains the visible and spoken source for either UI locale; the existing sixth dialogue argument supplies paired English on the subtitle rail. Crowd and quiz pools remain separate.

These76 authored rows do not imply76 delivered recordings. A missing selected recording retains exact captions; old generic auditions cannot be renamed or reused for changed dialogue. Historical audition integrity and current selected-voice coverage require separate checks.

The current catalog supplies43 of those76 rows from their selected individual profiles: the three Klaus-Dieter recordings and40 recordings across the other18 city actors. The remaining33 rows retain their own caption fallback. All112 neighborhood recordings and prior public recording objects remain preserved. New synthesis follows the existing dry multilingual producer and native EOS/encoded-audio checks; human listening remains pending.

Wolfgang01 retains its original encoded receipt with `asrLiteralWordExact:false` and empty `wordCues`. Its admission carries a separate, hash-bound orthographic timing proof: the observed `viertel` and `Stunde` intervals become the authored `Viertelstunde` cue at0.80–1.34seconds. The curator consumes every observed and authored word exactly once, revalidates the exact original take and supplement, and projects only the derived playback cues. This finite spelling repair cannot authorize substituted words or another take.

The40 new files total4,238,048 encoded bytes/262.50seconds; the largest is129,068bytes, with at most1,536,000bytes for one mono48kHz Float32 decode by container duration. They use the existing lazy recorded-speech loader and16MiB decoded cache. No eager full-cast download or additional playback owner is introduced. Browser resource/playback evidence and perceptual listening are separate acceptance records.

## Personal ordinary crowd interaction

The nine ordinary crowd identities use the existing `game.js crowdCharacterBarks[voiceId][region]` pairs for both unsolicited personal barks and direct E conversations. `personalCrowdDialogue()` requires two current-region source strings and two English entries from the same voice’s `pools.crowdPersonalized` before the ordinary NPC branch opens them. It keeps the actor object and selected voice on the existing dialogue broker; accepted exact recordings and held-line captions follow current catalog policy. Generic fallback, ambient scheduling, quiz identities, advisers, neighbors and named city dialogue remain separate. This routes existing authored lines and creates no new recordings or profile bindings.
