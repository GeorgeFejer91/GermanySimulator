# Character voice production

`VOICE-CAST.json` owns character identities and **`productionVoices`**, the fixed generation bindings. `AUDIO-TEXT-LIBRARY.js` owns clip IDs, exact spoken text, English subtitles, asset paths and trigger families; its compact production table is generated from the cast. `game.js` owns trigger timing. The existing stimulus broker owns playback, textbox, and subtitle timing. Fixed character dialogue uses recordings. The scoped browser-local name exceptions are documented below.

Current fallback authority is each selected `productionVoices[voiceId].fallback` in `VOICE-CAST.json`, projected into the runtime catalog. `"captions"` keeps exact visible text when an owned recording is missing or fails; a selected profile alone does not enable this policy. Explicitly retained browser paths, including unbound/dynamic speech, traffic and politician exceptions, remain unchanged. Historical audition and cleanup descriptions below do not override the current table or caller.

## Personalized named city sources and admission

The nineteen named city actors own76 exact regional source/English rows in `VOICE-CAST.json`. `cityDialogueTable()` and the public `cityDialogue` export bind actor, selected voice, Germany/Berlin slot and stable clip ID. The existing E branch reads those owned pairs; source/body speech remains German or Berlin Denglisch, with English on the subtitle rail. The inventory derives a strings-only `pools.cityDialogue` projection; IDs and English metadata are not spoken inputs. Historical city auditions keep their original manifest, media and source receipt, independently of current selected recording coverage.

Use the bounded `city-dialogue` request family in the existing `build-knick-voice.py` producer, preserving its selected Chatterbox0.1.7 model, profile/reference, native EOS/conditioning and whole-take processing. Freeze actual source/helper hashes before genuine requests. The producer's direct public city export stays blocked; the existing curator provides `--prepare-city-manifest` and `--admit-city-manifest` with the actual private review root, reviewed authoring helper and clip/hash-scoped use authorization. Preparation prints an inspectable UTF8 proposal without copying files. Admission verifies genuine raw/encoded receipts and bytes, complete exact source cues and paired English, installs only selected verified takes, and anchors the public manifest for later private-free replay. Keep use authorization distinct from listening; fabricated hearing/identity claims are rejected. Missing takes remain captions.

Run `node tools/curate-voice-library.mjs --check` after admission/sync. Invoke `node tools/audit-fixed-voice-production-coverage.mjs` separately for current93 fixed-character rows; it exits nonzero and names missing/invalid selected recordings. Passing historical audition tests or source/fixture tests does not make this coverage complete. No city generation, genuine audio or perceptual listening is established by the integration tests.

City mouth opening uses the optional `city-mouth-energy.json` supplement, anchored by its hash in the catalog. `--admit-city-mouth-energy <measurement> --city-mouth-ffmpeg <binary>` independently re-derives all 43 admitted final MP3 envelopes with the existing 24 kHz mono, 40 Hz neighbor recipe before installing the supplement; run `--sync` and `--check` separately. The supplement preserves original take manifests and receipts, pins clip/profile/audio identity, and records both the measured Windows recipe hash and the exact admission recipe hash. Only the verified CRLF and LF forms of that complete recipe file are accepted. Missing envelopes retain closed-mouth paint; actual playback ownership and media time remain the timing authority. Measured envelopes alone do not establish native mouth-clock alignment or perceptual listening.

## Current Maaslos speech and cleanup (2026-10-15)

Heiko owns 36 exact German/English pairs: the approved 35-line hesitant, falsely friendly rewrite plus one personal pre-move-in reply. Inga owns 34 pairs, including her own pre-move-in onboarding reply. Those early interactions retain the allocation/home-visit guard, stable voice and speaker, and award neither a tour nor introduction credit. Appending the two sources preserves all earlier clip IDs. The cast and manifests own exact coverage; missing takes remain captions. The finite ASR spelling normalization also recognizes the documented [noch mal / nochmal alternatives](https://www.duden.de/rechtschreibung/noch_mal); it does not accept synonyms such as nochmals or remove negation. The exact [kennenzulernen / kennen zu lernen spelling pair](https://www.duden.de/rechtschreibung/kennenlernen) is likewise normalized without accepting reordered words or missing particles.

Heiko's authoring helper permits a bounded render-only contraction expansion for one held source: for example, `du’s` becomes `du es`. Authored German/English text and clip IDs remain unchanged. Freeze and retain the actual inference text and SHA-256, canonical source SHA-256, and `finite-authored-apostrophe-contractions-v1` policy in the request, native annotation and manifest. The CLI must receive that actual input; the curator rejects missing, altered or semantically different render-input fields. Final unprompted encoded-audio word checks remain mandatory. This does not authorize synonyms, missing words or transcript edits.

Heiko story21 and story33, and Hartmut story01, each have a separately verified recognition-input transform for a native ASR window-boundary failure. The delivered MP3 stays unchanged. Only the recognizer's lossless 16 kHz mono/16-bit PCM input receives exactly 16,000 leading zero samples; every original speech sample must remain byte-for-byte intact. Preserve the original failed transcript and receipt, the new full unprompted transcript, both PCM/input/receipt hashes, the model/binary hashes and exact sample counts in `asrInputTransform`. The curator permits only these three reviewed source/owner pairs; another clip needs its own sample/hash proof and admission review. Playback duration, captions and 40 Hz mouth cues use the original delivered audio, never the diagnostic silence. This verification does not establish perceptual listening.

The finite normalizer also equates only the singular compound `Feedback-Gespräch` with `Feedbackgespräch`, consistent with the optional clarifying compound hyphen in [German orthography §45](https://grammis.ids-mannheim.de/rechtschreibung/6159). It does not merge plain-space words, accept other spellings or erase missing words.

The final neighborhood checkpoint contains112 accepted takes: Heiko36, Inga34, Hartmut7, Ede2 and Schwabingen33, with no held neighbor sources. Inga’s gnome and prerequisite endings were authored in German and paired English together before their new takes. Her story30 and story34 retain truthful same-profile native sentence components at verified quiet boundaries, exact original PCM/source mappings and final whole-MP3 word/level/40Hz checks. Story20 and30 retain their original failed readings plus independent unprompted second-decoder results on unchanged encoded speech. Neither use authorization nor signal/word checks establish perceptual listening.

Both parents use the same offline cleanup authority, `tools/neighbor-voice-processing.mjs` (`cleanProcessing` / `encodeVoice`), for existing and future recordings. Its smoothed downward expander reduces quiet-passage noise, with a 2 ms attack and 150 ms release; the first 300 ms remain unfiltered to protect quiet opening syllables. The selected cast processing string records the exact filter. Encode from hash-verified original native takes once, then normalize and verify the final 24 kHz mono / 64 kbps MP3, independent unprompted words, duration, levels and 40 Hz mouth cues. Do not process an already-cleaned MP3 again. Preserve original and rejected takes privately. Automated signal/word checks do not establish perceived quality or speaker identity.

The cleanup command stages privately and validates the actual candidate receipts against their staged asset tree through the same curator used for canonical assets. Before replacing files it checks current, staged and backup hashes; failed application restores verified originals and records recovery state. Catalog sync and publication remain the integrator's responsibility. A new unused request seed preserves frozen requests when processing or source coverage changes; compatible native sources can still be reused without new inference.

Hartmut retains stable voice/actor IDs `jwd-theodore-maaslos` / `jwd-theodore` and all seven authored lines. His selected `GS Hartmut Maaslos (CC0 child character)` profile uses the CC0 performed child-character source and verified reference hashes recorded in the cast. The source's biological speaker age is unverified. The former adult-actor profile remains archived. CC0 requires no attribution credit; source/license provenance stays in technical metadata. Perceptual listening remains a separate check.

## Current personalized crowd recordings (2026-10-15)

The nine ordinary crowd identities now own 18 checked exact-text recordings out of their 36 authored regional slots. Eleven additional recordings join the first seven through separate `remaining27-first-takes` manifests, preserving the earlier assets, approvals and measured mouth cues. The existing exact `(voiceId, text)` lookup owns playback; failed or unverified slots remain captions. Selected profiles and translations are unchanged. The new catalog contains 585 recordings, with all 574 earlier expanded recording objects preserved.

Generation completed for all 27 remaining first takes. Processing was interrupted after 21 encodings when the Windows supervisor mistook a recycled historical child PID for an identity conflict. A separately bounded processing-only recovery checked the five untouched files, preserved the 21 completed files, and held the one interrupted file without another call. Public admission retains the original failed phase and explicit recovery proof. The interrupted ASR count remains unknown within its recorded bound; it must not be rewritten as a successful original phase or a precise historical count. Eleven new takes passed native completion, literal final-audio word checks, levels, captions and ownership; the other sixteen stay private. Perceptual listening remains unverified. Only the original seven currently have measured 40 Hz mouth envelopes.

## Fixed voices and the agent workflow (2026-10-11)

### JWD neighbor speech production (2026-10-13)

**Historical study baseline and proposed integration, not current delivery status.** The legacy Fink, Dr. Dr. and diplomat labels below belong to the 13 October authoring brief. Current identities are Frau Schwabingen, Systemtechnik professor Heiko Maaslos and fictional HR/People & Culture professional Inga Maaslos. Stable IDs, accepted takes and actual playback ownership are defined in [Implemented neighborhood speech](#implemented-neighborhood-speech-2026-10-14); this study creates no second cast registry.


The historical brief identified the married neighbors as Professor Dr. Dr. Heiko Maaslos and
Botschafterin Dr. Inga Maaslos; Frau Fink is the third neighbor. Keep actor IDs
`jwd-parent`, `jwd-watcher` and `jwd-swabian`: these own movement and the mission's
three introduction receipts. They are residents encountered during “Nachbarn
kennen lernen”, not members of a following party. Character names, actor IDs,
game voice IDs, native profile UUIDs and clip IDs have separate meanings.
The study proposed game voice IDs `jwd-fink`, `jwd-heiko-maaslos` and
`jwd-inga-maaslos`. Allocate them only through the existing cast authority;
the obsolete proposed `jwd-fink` ID was not allocated. The current cast uses `jwd-frau-schwabingen`; see the implemented section below.

Inga uses the existing saved **GS Inga Maaslos** profile,
`04e241f5e0734684ba3626aa669a70c1`. Native listing and both live files were
verified: original SHA-256
`83d49bbef3995346b6ba352d92c6535b9c97e2d73928ab4c50f592eb0cbb36b7`,
normalized-reference SHA-256
`18d6bde7a384e6c58a383155664aee9be36516d48e4bc1eb4c5087b38935dd53`.
Reuse that UUID without renaming or replacing the profile; keep its original
audio private. Allocate `jwd-inga-maaslos` through the cast's existing
`productionVoices` before generation. Heiko and Fink require explicit production
selections in that same authority; an unrelated similar name is not a binding.
This study predates the completed recordings; its initial checkpoint accepted eleven Inga takes. Current coverage is owned by the implemented manifests. It still does not establish perceptual listening.

Use the exact authored `jwdCopy` introductory and repeat-topic pools selected by
`talkJwdNeighbor`, retaining Berlin Denglisch and each line's existing English
translation. Inga owns watcher/electric/gardenRules/blinds/schedule; Heiko owns
parent/paint/concern/polish/parking/latin/smalltalk; Fink owns
swabian/lawn/sweeping/hedge/letter. A premature greeting belongs to the actual
addressed resident. Home narration and the burglar are outside these three voice
allocations. Freeze the final names and exact source text before rendering.

The production addition carries the stable visual actor ID, selected game
voice ID, exact line/recording identity and current attempt through the
existing dialogue and stimulus broker, including premature greetings.
These actor-bound playback fields and renderer getter were absent from the
inspected study baseline. Current cue-token ownership and playback getters are implemented; the following text preserves the original integration proposal, not an outstanding absence claim. Bind `activeStimulus` to the concrete resident plus its
existing stimulus generation and `dialogueVoiceToken`, and expose the current
owner, playback state and native playhead through the existing renderer bridge.
The renderer samples that current snapshot in its existing pass; a display
label, `state.characterSpeaker` alone or a queued request is not proof that
this actor's audio has started. Resolve exact `(voiceId, source)` recordings;
bind mouth cues to the final encoded identity/hash and its actual buffer/media
time. Pause holds the sampled cue, while completion, cancellation or replacement
releases oral ownership. Caption-only/missing media retains exact text and
inactive source paint. Body release, settle and recovery use the finite
resident phase specified in the sprite protocol, without another timer or
media clock.

Validate each final recording's whole text, numbers/negation, native generation
completion, encoded duration/levels, profile and reference identity. Then exercise
all three introductions, every repeat-topic pool, pause/resume, cancellation,
replay, hidden-page and missing-media paths. An introduction receipt still comes
from completed production dialogue, never from a mouth animation or elapsed cue
estimate. Silent browser timing, independent ASR, estimated acoustic articulation
and perceptual listening are different evidence. The fixed-voice workflow below,
sprite protocol and existing project acceptance gates apply before publication.

### Allocating and using voice IDs (2026-10-13)

Allocate a stable game `voiceId` to a speaking identity once. Resolve that ID
through `VOICE-CAST.json.productionVoices` before writing a new speech request.
The game ID, native profile UUID, actor/render-slot ID and clip ID have different
owners; a new encounter or counter position does not create a new speaker.
Reuse the selected library binding and existing exact-text recordings. A name,
similar-sounding candidate or old provenance UUID cannot replace the allocation.

For a genuinely new identity, search the cast and saved profiles first. Register
one selected UUID, original/reference hashes, renderer/revision, processing and
fallback policy in the cast before generation. Verify the live reference bytes;
profile discovery alone does not authorize creating, deleting or replacing a
profile. Changing renderer or processing with the same UUID is still a voice
change. Refresh the derived runtime table with the existing curator; never
maintain a second voice-ID registry in a scene or authoring script.

**ICH is Hans-Peter Mustermann**, `spieler-hans-peter-mustermann`, selected UUID
`b027d18a4fc748cabb133fbb14077500`. Every first-person reply and monologue uses
that allocation. Missing, held or failed player recordings retain exact captions;
they must not substitute a browser or another character's voice. Existing
recordings continue to play before this caption fallback is considered.

New recordings bind exact `(voiceId, source)` and English translation to their
clip ID, encoded hash and production receipt. The curator checks ownership,
profile/reference hashes, engine/revision, processing, native completion, final
encoded words and levels. Fixed runtime entries carry those same identity fields
and reject missing or changed fields during lookup, even when the UUID matches.
Compact export may share identical reviewed take receipts in its encoding, but
must expand complete fields into each entry and never alias the current cast
binding as the recording's receipt.
Run curator, voice-consistency and affected speech-lifecycle checks before
publication. Record use authorization separately from perceptual listening.

The Jobcenter overlord uses stable game `voiceId` `jobcenter-overlord` and the
user-supplied `GS Evil` native profile `1ea9044d630b43c9928956a501b90ded`.
The selected Secret Tunnel OmniVoice Rust take is the exact text in
`assets/audio/jobcenter/overlord.json`; `tools/build-jobcenter-audio.py` renders
its four-semitone-lowered, lightly reinforced MP3 offline. The source profile
receipt pins original/reference hashes and the source URL in `VOICE-CAST.json`.
The final encoded take is 26.783 s, −18.01 LUFS, −2.88 dBTP, with independent
German ASR matching every authored word under compound-word normalization.
The user authorized this processed game recording; perceptual listening remains
NOT RUN. The encounter loads the asset on demand through its one media owner.

### Implemented neighborhood speech (2026-10-14)

Frau Schwabingen's current user selection is the new saved `GS Frau Schwabingen`
UUID `e556ceff3dbb4091989d0f32da52d811`, identified by the native audio-assets
folder `GS Frau Schwabingen (2)`. The older identically named profile remains
preserved. All her owned source lines, including early greeting, invitations,
chore complaints and guided tours, use exaggerated written Swabian and paired
English translations. Exact profile/reference hashes remain the authority.
On 2026-10-14 the user explicitly made Whisper feedback advisory for dialect:
`productionVoices.jwd-frau-schwabingen.asrPolicy` is `dialect-advisory`.
Record the real final-MP3 transcript and real `asrWordExact` value; a mismatch
may be accepted only for this selected character with an explicit advisory
receipt. It is not evidence of exact lexical fidelity or perceptual listening.
Native completion, request/speaker ownership, encoded hashes, duration, levels,
finite media-derived mouth cues and caption-only failure still apply. Other
characters keep their existing word-verification rules.

The neighborhood identities are `jwd-heiko-maaslos`, `jwd-inga-maaslos` and
`jwd-frau-schwabingen`; their actor IDs remain `jwd-parent`, `jwd-watcher` and
`jwd-swabian`. Their exact introductions and complaint pools live in `game.js`
`jwdCopy`, with source/translation ownership in the cast. Inga uses the
user-selected saved `GS Inga Maaslos` UUID `04e241f5e0734684ba3626aa669a70c1`.
Heiko uses the selected dedicated `GS Heiko Maaslos` UUID
`36a68103506a4417987cfd9a1ab71905`, with exact captions for unavailable takes. Frau Schwabingen uses the explicit
new selection above. Missing or rejected selected-neighbor takes use captions,
without changing their voice.

`tools/build-neighbor-voices.mjs --plan --character inga` freezes the exact
requests; rendering verifies the live reference bytes and reuses compatible
saved takes. The installed native OmniVoice/Whisper binaries and cached models
perform bounded offline takes and independent final-MP3 transcription. Preserve
raw and rejected takes privately; only word-checked normalized encodings enter
`assets/voices/neighbors/`. The manifest accounts for every line as accepted or
held, keeps source hashes and original ASR results, and separates user-directed
use from unperformed listening. Explicit German/English orthographic equivalents
are limited to punctuation/hyphen spacing, People & Culture/People and Culture,
the long-vowel spelling Maslos/Maaslos, and German final devoicing in the fixed
Nachbarschafts-offsite phrase. They must never erase extra words or negation.
The curator derives the existing catalog's strict exact-text entries and 40 Hz
final-encoded RMS mouth cues from this manifest. No runtime synthesis service,
source reference audio or authoring model ships.
The initial 14 October checkpoint accepted eleven Inga lines: 615,460 encoded bytes / 75.96 seconds,
−18.28 to −18.11 LUFS and a maximum −3.95 dBTP. Both reference hashes and all
63 production bindings were verified against the live native profile catalog.
Perceptual listening remains NOT RUN.

The mirror uses `office-mirror` in the existing authoring helper: one whole-text
synthesis call and one `player-potato-mirror.mp3`, never sentence joins. Its
surprised delivery uses exaggeration 0.65 with the unchanged selected player
reference, pinned renderer and dry processing. The dedicated mirror manifest
joins the existing player answer and portrait supplements through the same
exact lookup. The accepted take is 8.56 seconds, independently word-checked at
−18.18 LUFS / −2.22 dBTP. Perceptual listening remains unperformed.

Read this section before using the older production history below. A character keeps one stable game `voiceId` and one selected Secret Tunnel UUID, original-audio hash, normalized-reference hash, renderer, model revision, and processing recipe in `productionVoices`. Names help people browse; UUIDs and hashes establish identity. Never generate by a loosely matched name. Historical `secretTunnel`/`secretTunnelProfileId` records in the cast preserve earlier source provenance; runtime `voices`, `castVoices` and `roleVoices` all expose the current production binding. Historical IDs are not permission to select an older voice. `productionExceptions` permits only the explicitly approved Horst omen clip to use his second official profile. His preserved first candidate remains available for review.

Brunhilde Knick's selected voice is the existing approved fever profile `b080c7d95ecd418fb428282461d7fbe7`, now named `GS Brunhilde Knick (amt-brunhilde-knick)`. Reuse her approved exact lines. New questions, replies, phone warnings and arguments must use that reference, the pinned Chatterbox Multilingual V2 renderer and the same quiet undertone. Switching engine with the same UUID is a voice change requiring a deliberate whole-character review. Default, preview and fever-preview lookup must all reject her earlier primary takes. Knick uses `fallback: "captions"`: unavailable, rejected or failed recordings and dynamic ticket/name strings remain exact visible text without a different browser voice. Other characters follow the current fallback authority above; a production profile binding alone does not prove complete recorded coverage. All four desk slots are the same Knick identity and use this voice. Their render-slot IDs are placement/animation ownership, not separate people.

Named pedestrian barks pass a direct MP3 only when its recorded `voiceId`
matches the actual person's `voiceId`. Other authored pool bodies resolve
through that person's selected lookup and documented fallback. A legacy
Thorsten recording cannot borrow a named passerby's identity.

The initial 2026-10-12 counter audit introduced three separate clerk identities.
The user subsequently clarified that Frau Knick and Frau Frist are the same
person and all counter positions must share one ID and her original angry
voice. Erna, Ottilie and Hedwig are therefore removed from active cast,
production and browser-delivery lookup. Their native UUIDs remain in
`preservedProfileIds`; no saved native profile is deleted. The three replacement
ambient MP3s and complete identity/manifest metadata are hash-verified in
Music's `GermanySimulator voice archive/counter-identity-restoration-2026-10-12/`.
The three exact earlier Knick ambient recordings and her approved refusal are
reused unchanged. `tests/buergeramt-clerk-voices.test.mjs` protects the shared
identity across all four desks and caption-only failure behavior.

The unlisted `character-review.html` uses the same eleven rule IDs for its
three adviser profiles, retaining their existing `crowd-*` deep links. It
shows nine ordinary crowd profiles with matching gender/sprite identities;
held or unavailable fixed takes retain captions there too. Its adviser
motion preview is schematic; the root city owns their actual appearance.

The workflow lead performs these steps; delegate synthesis or subtitle work only when it is separable, with one writer per path and one integrator:

1. Read the character's production binding and current dialogue. Run `node tools/curate-voice-library.mjs --check`; use `--voice-exe <installed Secret Tunnel executable> --profile-data <shared voice data>` to verify live names, UUIDs and both source/reference hashes. Use `voice_list` first when the connector works; the installed `--voice-cli` is the local fallback. No profile creation or deletion on discovery alone.
2. Freeze exact sources and their hashes before generation. Synthesis owns only its requested assets/manifest and authoring script. For Knick, `tools/build-knick-voice.py --plan`, `--render`, `--process`, and `--check` reuse the cached model and selected binding. Inspect independent final-encoding ASR, numbers/negation and levels; failed takes stay private. Source or binding drift stops reuse. Subtitles keep the authored speaker and words.
3. Integrate eligible recordings by exact `(voiceId, source)` with profile and audio hashes, English text and the original trigger. Preserve user use-approval separately from listening evidence. Refresh the runtime table with `node tools/curate-voice-library.mjs --sync` and the preview lookup with `node tools/build-voice-candidate-preview.mjs`. The existing primary promotion tool rejects retired profiles/renderers even if an old review row says yes.
4. Run consistency, catalog and affected speech lifecycle checks and silent desktop/Android-emulation browser checks: voice off, preview on/off, source/caption ownership, cancellation and missing-file fallback. The integrator reviews the actual combined candidate and publishes under `AGENT-START.md`. Generation/ASR does not establish listening acceptance or physical-device performance.
5. Archive only curated retirements. `--archive-root <private Music archive>` preserves unselected recordings and metadata; `--archive-assets` removes verified copies from active asset folders. `--archive-profiles` additionally needs the live executable/data root and only removes explicit `retiredProfiles` UUIDs after every profile file is copied and hash-verified. Keep selected profiles, scene exceptions, `preservedProfileIds` and unrelated personal profiles. Generated Secret Tunnel clips survive native profile deletion. Archive receipts retain original IDs, source/reference audio, hashes and reasons for restoration; do not create replacement UUIDs to pretend an old binding survived.

Reuse one cached independent ASR model for the encoded-file audit. `build-knick-voice.py --asr-device cpu|cuda` defaults to CPU; use CUDA only with already installed compatible libraries exposed to the authoring process. Benchmark the same immutable recording before changing devices, keep the transcript and failed diagnostic receipts, and never alter the system PATH or install another runtime merely to accelerate this audit. Record actual device, requested and effective precision, model hash, language, thread count and beam readings; the expected-script prompt must remain null. CPU/GPU selection changes the audit execution, not the selected speaker or generation recipe. Finish and unload generation before loading GPU ASR; run browser/performance checks after the model is unloaded.

The private archive is `GermanySimulator voice archive` in the existing Music library, outside the shipped game. The 2026-10-11 cleanup archives 68 retired/superseded recordings and 16 explicitly identified game profiles, including two duplicate Thorsten profiles. The redundant Qwen bindings, four traffic renders and optional runner adapters were removed at the user’s request. The eleven earlier Qwen UUIDs were absent from both the local VoiceCloner and current shared profile stores; their metadata is retained only for archive restoration. Traffic keeps its exact authored text and existing browser-speech fallback, with the selected Dieter Hupfer profile reserved for approved replacements. Asset manifests retain `archiveRelativePath` and provenance; archived files have no playback lookup. Earlier 236-entry audition reports remain historical snapshots. Use the live production check for current bindings; a count or name from an older report is not an active profile. `tools/sync-music-cast-index.py` refreshes the Music index’s `productionVoices` projection while retaining its historical corpus rows. Original-source and normalized-reference hashes are distinct; historical candidates explicitly label their original-source hash with `referenceHashKind: "uploaded-original"`.

The completed fixed-voice audit adds 17 superseded first-pass Knick files to
the 68-recording cleanup above: 85 archived recordings in total.
`fixed-voice-retirements-index.json` retains each old path/hash, its immutable
private copy and the exact snapshotted manifest row; it is separate from
`asset-index.json` because an eligible new take can reuse an old public path.
The 2026-10-11 bounded request accounted for 182 slots: 150 playable recordings
and 32 caption holds (30 independent word mismatches and two failed native EOS).
At that point main Knick was 141/27, her ambient supplement 3/0, and the three advisers 6/5.
Guarded date normalization equates `am 5.` with `am Fünften`; it cannot equate
a different day, a cardinal number or a decimal. This changes no audio or
independent transcript. Historical crowd auditions remain private provenance
after the three advisers acquire exact rule decks; they do not become new
playable rules. The private-take audit permits only these explicit ownership
changes and retired future-profile targets, retaining script/hash checks.

## Bürgeramt background character speech (2026-10-12)

The user requested random existing level voices for the two waiting-room
complaints and a richer pool of short Kafkaesque German background snippets.
`buergeramt-story.js` owns 21 exact speaker/text requests across 11 selected
profiles: both original waiting-room lines for each of the three patrons,
three counter remarks now restored to Knick, and 12 new remarks. The `office-ambient` request family
in `build-knick-voice.py` reuses the fixed Chatterbox/native-EOS/final-encoding
ASR and level gates. Private requests and raw/encoded audit receipts stay in
Music's `GermanySimulator office ambient review 2026-10-12/`; only eligible
MP3s and per-voice manifests enter `assets/voices/office-ambient/`. The curator
checks each exact story actor, voice/profile/reference, text and translation.
Use approval comes from the current request; perceptual listening remains
unperformed. The ambient delivery explicitly retains captions on failed or
unavailable audio, regardless of the character's ordinary E-dialogue fallback.

## Bürgeramt player replies and complete Knick dialogue (2026-10-12)

The portrait's four authored passages form one continuous player monologue,
rendered in one synthesis call with the same selected player profile and dry
processing. The existing builder's `office-monologue` request route freezes
`presidentPortrait.lines` joined in authored order and checks exact player ownership;
its separate `spieler-hans-peter-mustermann-portrait-manifest.json` supplement
shares `assets/voices/player-replies/` and the curator's exact lookup. It leaves
the 107 answer-label recordings unchanged. Native EOS, independent encoded ASR,
levels, hashes and the original user's voice-use request govern eligibility.
Failed takes remain private; perceptual listening is a separate unperformed check.
The four former separate recordings and their manifest are hash-preserved in
the private portrait review's `revisions/four-part-before-continuous-2026-10-12/`.
Only `player-president-portrait-1` contains the complete current monologue;
the former parts 2–4 are excluded from shipped playback.

The queue call “Nächste bitte!” is a separate selected-Knick supplement in
`assets/voices/knick/queue-call-manifest.json`. It retains her profile, pinned
renderer, native EOS guards and undertone. The user requested a shouted call;
only this cue changes generation exaggeration from 0.5 to 0.8. Its first take
passed independent final-MP3 word and level gates (2.2 s, −18.14 LUFS,
−2.48 dBTP). Use approval is the queue-sound request; perceptual listening remains
unperformed. The existing curator merges the supplement with Knick's other
exact recordings, and failed/disabled playback retains the exact caption.

The user selected the actual shipped `thorsten-amused-nachschub.mp3` recording
as the player's voice: “the one that sed to say, endlich wieder nachschub, just
clone this voice as our own”. The distinct saved player profile is
`b027d18a4fc748cabb133fbb14077500`, named `GS Hans-Peter Mustermann (Nachschub player)`.
The stable game ID remains `spieler-hans-peter-mustermann`. Its original WAV
hash is `4f4b181750c65430c68d20d742b02529f5e5db6650cb57171fe2e52ea8ee2dbf`;
its normalized reference hash is
`6b6ff2c747ef11fb883fc1c9804d270c6ba34cc5614db4d132f8e6172b9f60ad`.
The selected clip is 1.44 seconds; the installed native profile API requires
three seconds of clear speech. The reference therefore starts with that clip
and appends the same speaker's shipped CC0 “Nein, ich gehe hier nicht weg!”
recording, producing 3.570 seconds. Exact source hashes and transcript are in
`productionVoices` and the private office-reply provenance receipt. The former
EmoDB player profile remains preserved historical provenance, and its candidate
takes are excluded from selected-profile lookup.

Use the existing `build-knick-voice.py --request-file` pipeline with family
`office-replies`, an exact frozen story/runtime request and explicit player
voice ID. The authored family has 104 registration choices, two phone-warning
choices and the final document-taking choice. Each recording reads the exact
visible label. Player takes use the pinned Chatterbox renderer without Knick's
undertone; Knick keeps her selected profile and processing. Profile hashes,
explicit native EOS, independent final-MP3 ASR without a script prompt, levels
and encoded hashes remain required. There is no synthesis model in the browser.

The integrator authorized a bounded rescue for held reachable Knick lines:
`--sentence-rescue --plan`, `--render` and `--process` reuse the same authoring
pipeline. Freeze exact sentence/phrase boundaries, retain failed whole-line
receipts, allow at most one retake per part, and concatenate the dry parts.
Apply the selected undertone and normalization once to the joined full line.
Every part records its text, voice/profile/reference, raw and encoded hashes,
native EOS and independent ASR. The joined encoded MP3 must independently match
the complete authored text before promotion. Word mismatches or mixed profiles
remain private. Use authorization and technical checks establish no perceptual
listening result.

The bounded office audit also supports `--device cpu --precision fp32` in the
same cached renderer; CUDA remains the default. Device enters the renderer
cache key and receipts. Conditioning stays FP32 on either device. Never load
the renderer and independent ASR concurrently on this laptop. The two initial
CUDA player samples reached EOS but added words and remain rejected privately.
One first-answer delivery edit preserves the full rejected source and records
its sample-exact endpoint inside a measured silent interval; this limited
experiment is not permission for automatic speech cropping. The second answer's
single CPU retake passed whole-file independent ASR without editing.

`--observe-eos` records native EOS suppression and analyzer-forced stops.
`--eos-after-alignment` is an explicit bounded diagnostic, off by default: it may
restore only the original model EOS logit when completion was already true and
the native analyzer would suppress EOS after attention regresses. Every other
native guard remains active, and the installed package is unchanged. Record the
native analyzer source hash, per-step private trace, exact policy and restoration
count. Distinguish `model-sampled`, `analyzer-forced` and `budget-exhausted` in
receipts. The accepted second-answer diagnostic restored zero logits; this does
not establish that the experimental policy caused its success. Final encoded
words and levels remain decisive before any production batch.

The authoring helper releases only native attention hooks added during the
completed T3 call, using each module's prior hook keys as its baseline. Cleanup
runs after inference and preserves existing hooks and decoder guards. The
private `hook-cleanup-benchmark.json` compares one selected Knick line at seed
71019 in CUDA FP16: cleanup off/on produced the identical raw-array SHA
`ad21dec2e7681eabac142c1357c50ea9ccce73fb2205c145cd84bfcecd16bab0`.
The preserved benchmark receipt hash is
`4682093a82d299765d0c0c87b845f59e0b0230f2ad5e6f2916b2dadc911144d2`.
Current production receipts record zero hooks before and after the completed
call. This comparison verifies that lifecycle repair for the tested take; it
does not establish a cause for later word errors or CPU allocator growth.
The current unchanged native T3 source hash is
`6d8be2af8fa203e755d5316d817b73ca8e2a385204b8e4efe92c6446595c71b1`;
the analyzer hash is
`d8430efa92aedb8e59b782c1d299fe7238570eecea9d293c0981a5ee2e82c8c7`.

Long failed-part archive filenames use native extended absolute paths on
Windows, preserving names and hashes without a system-setting change. The
archive move refuses overwrite and checks bytes after moving. The authoring
regression exercises an actual destination longer than 260 characters inside
the verified workspace output directory and checks rejection of an overwrite.

A private fixed-input CPU benchmark compared two and four threads at seed
71000 for the selected player's “Den Fünften eintragen.” reference and pinned
renderer. Both independent encoded-file audits matched every word, with native
model-sampled EOS, 57 speech tokens, restoration off, -18.15 LUFS and about
-2.6 dBTP. Raw hashes differed and both benchmark takes remain private. Render
time was 14.25 versus 12.24 seconds; T3 inference was 6.14 versus 5.75 seconds.
The four-thread take reused the loaded model, so this single result does not
establish a general 14% speedup. The minimum reported available RAM was 3.347
GiB. Subsequent bounded CPU cohorts may use four threads under the integrator's
authorization; `--cpu-threads` defaults to two and receipts record the actual
count. FP32 conditioning, the native decoder guards, profile and word gates
remain the same. The private `cpu-thread-benchmark` folder retains both full
raw/encoded recordings, per-step EOS traces and render/audit comparisons.

Named exceptions permit actual synthesis attempt 3 only for player phrases
`player-registration-provider-2-part-01`, “Nur die Eigentümerin”,
`player-registration-dossierfix-2-part-02`, “getrennt vorlegen.”, and
`player-registration-printer-2-part-02`, “wenn er sich beruhigt.”. Each pair of
failed whole-phrase takes and their traces remains archived. The private driver supplies
the integrator's exact receipt SHA
`3d6b24b172b12df48d8c014233643c392e194f8d3f4634fdb529b6fa31fc29eb`,
`78d4964b64adfced9d7dd9e909e50505562877367b4d1625eb39d5febee6a212`, or
`8271c9687f68ff55039ff4708efe77f2502e3cd9d4a99d6a81a878a05216412e`, respectively;
the helper verifies the named text/profile, previous actual attempt and raw/MP3
hashes before archiving attempt 2 and recording attempt 3 with that authority.
The default cap remains two, with no implicit retry after a crashed third call.
The reference, renderer, punctuation, dry recipe and native guards stay fixed;
fresh native EOS, complete encoded independent exact ASR and levels still decide
eligibility. These named exceptions permit no delivery edit or bulk retry.

A fourth narrowly reviewed exception permits actual take 3 only for
`knick-registration-residencefix-segment-01`, the unchanged word “Hauptwohnung”,
under authority SHA
`38d5b2f9852ca3727dc292bca86ccf4c2d147790a6f3b44315f5a807c3ea6733`.
Both failed native takes and all four no-prompt source recognition readings
remain preserved. The extra call changes no words, reference, model, processing,
precision or decoder guards; it records its actual call count and fresh seed.
The isolated encoded word and complete joined line still need exact ASR and
levels. This exception grants no crop or general third-take allowance.

Phone warning 1's first dry join failed four independent full-file ASR readings
despite all five part recordings matching their scripts. A separate named
authority, SHA `1bbd6efbfb5a6d0c630e256101ba9203de775e44bc7c8567d1f982b1835a30c4`,
permits only ordinary actual take 2 of `knick-phone-warning-1-part-04`.
The successful first part audit stays truthful. The helper checks that part's
raw/MP3 hashes, the failed complete join and its independent localization
receipts, then bypasses only the named successful-part skip. The ordinary cap
stays two. A rebuilt join must retain every other part byte-identically and
archive the failed join before applying the selected undertone once and auditing
the whole new encoded MP3. ASR timestamps selected a section to repair; they do
not establish listening or prove an extra spoken word.

Some separately reviewed office deliveries retain an exact complete opening
utterance from a failed full take. Each named review binds the original raw,
encoded file, full native EOS trace and a sample-exact endpoint within at least
0.2 seconds of measured silence at -38 dB. Originals and conflicting readings
remain immutable. The native EOS belongs to the complete source generation;
there is no EOS claim at the delivery cut. Final encoded parts and complete
joined answers need fresh independent exact-word and level checks.
`complete-prefix-extra-tail` requires the original ASR to contain the complete
exact prefix followed by unwanted words. The distinct
`post-speech-silence-boundary` kind requires an exact isolated source reading,
a 50 ms word-end margin and measured quiet before unclassified later activity.
It does not reinterpret that activity as speech or invent a next-word bound.
The reviewed dossier boundary additionally requires both independent beams 1
and 5 to match its final encoded phrase. Unknown proof kinds fail in both the
Python builder and JavaScript curator; these named edits do not authorize
general speech cropping or editing a source without native EOS.

Only `knick-registration-identityfix`, `knick-registration-movein` and
`knick-registration-residencefix` have
explicit complete-file segmented recognition authorities. Their unchanged
final MP3s use `asrVerificationMode: "full-encoded-contiguous-chunks"` rather
than a fabricated successful continuous reading. FFmpeg 8.0.1 decodes mono
16 kHz IEEE754 little-endian float32 with no filters; every positive sample
interval covers `[0,N)` exactly once, including the final decoded padding.
The builder and curator pin each authority, original failed receipt,
diagnostic, current MP3, complete PCM, every chunk PCM, selected owner/reference,
source-part ID/text/raw/encoded hash and the reviewed matching reading.
Null prompts, exact chronological combined words and complete contiguous
coverage are mandatory. Original continuous readings and all chunk conflicts
remain available; movein's final chunk selects matching beam 5 while retaining
the differing beam 1. This changes recognition context, not audio, processing
or native EOS, and grants no automatic override for another clip. Regression
cases reject unknown modes, hash/owner/text/prompt drift, gaps, overlap,
truncation, missing preserved failures and wrong chunk words or source order.
Residencefix's exact real source IDs are `part-01`, `context-01`, `segment-03`
and `part-03` in that order; the registry binds them without renaming parts.
Its accepted context phrase reads “Hauptwohnung bestimmen wir anhand der
maßgeblichen tatsächlichen Nutzung”; all four continuous full-line readings
instead recognize the plural “Hauptwohnungen” and remain preserved. Named
authority SHA
`106ecd1bf77ca16865610edf4f21c4e89fe153b2d1105256c4f4939e5147a86f`
binds its unchanged final MP3 and complete contiguous PCM evidence.
Word-exact metadata here means the complete encoded file passed this documented
recognition mode; it does not claim consensus, single-pass agreement or listening.

The final 2026-10-12 public pack covers all **107 player labels** and all
**168 current Knick strings**. `player-replies/spieler-hans-peter-mustermann-manifest.json`
has 107 eligible takes and no holds. `knick/manifest.json` has 167 eligible
takes and one held unused historical `knick-counter-3` slot; the current refusal
reuses approved `amt-fever/amt-brunhilde-knick-fever-22.mp3` under the same selected
Knick profile. The three eligible ambient takes remain in the separate unchanged
manifest. Current target coverage has no missing recording. The 107 labels have
107 distinct exact texts. Player audio is 6,036,580 bytes / 370.899 seconds;
main Knick audio is 21,739,060 bytes / 1348.966 seconds. All new shipping MP3s are
mono 48 kHz / 128 kbit/s and pass -18 LUFS ±0.3 with true peak at most -1.5 dBTP.
Failed raw/encoded takes, source snapshots, native traces and removed expiry/name
recordings remain privately hash-verifiable. Models and reference WAVs never
enter the shipped game. The catalogue admits only the chosen exact text on the
existing speech lifecycle; answer audio finishes before Knick continues.
Use authorization remains separate from perceptual listening, which was not performed.

## Nearby street-rule speakers (2026-10-11)

`street-wisdom.js` owns the three appearances and exact rule decks; `GAMEPLAY.md` owns encounter timing. Waltraud Wartemarke, Horst Hausordnung and Dietmar DIN-Norm reuse their existing selected `crowd-*` production profiles, with new distinct street models and no extra profile UUIDs. Their names/voices are reserved for those actors. Do not let a generic crowd member borrow them.

Freeze the eleven existing German rule bodies, paired English subtitles, actor/deck ownership and source hashes in the private street-wisdom request. Use the same `build-knick-voice.py` authoring helper with `--voice-id all --request-file <authored-requests.json>` for this bounded family. Reuse one cached model session and prepare each verified reference separately; these dry voices do not inherit Knick's undertone. At most one retake follows a failed completed take. Every shipped receipt needs explicit native EOS, independent final-MP3 ASR, selected profile/reference/model/recipe, encoded levels and hash. Number/compound normalization may equate `22:00 Uhr` with spoken `zweiundzwanzig Uhr`; a changed hour, minute, case or negation fails. Never infer complete generation from a missing EOS field.

`assets/voices/street-wisdom/*-manifest.json` owns the resulting receipts. The curator checks exact actor, voice, rule index, text and English against the deck, and projects each eligible path onto its original `rule-NN` ID. Unrendered/rejected rules retain the exact same stable ID and captions. The eleven former Thorsten rule recordings are archived; they cannot serve as a fallback for these people. Their three production bindings declare `fallback: "captions"`. Listening evidence remains separate from the user's request to implement these recorded speakers.

## Bürgeramt fever-dream voice alternatives (2026-10-10)

Of the 40 approved fever recordings below, 35 still match the current script. Five former clerk outburst recordings (`fever-17` through `fever-21`) retain approval and provenance as archived history with `retiredReason`. Default and preview lookups exclude them. The newer argument uses exact-text takes from the selected Knick profile or captions. Earlier primary-profile escalation candidates are archived too.

The subsequent E-interaction pass renders actual speech from these twelve
alternate references with the cached Chatterbox Multilingual V2 0.1.7 model,
MIT revision `5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18`. The separate
`assets/voices/amt-fever/manifest.json` binds each final MP3 to its exact authored
speaker/text, alternate UUID, transformed CC0 EmoDB reference hash, seed, raw
hash, processing, normalization and independent final-encoding ASR. The game
uses this family in ordinary gameplay following the user's explicit instruction
“I approve, just implement it” on 2026-10-10. That use approval is recorded in
each clip and catalogue entry; it is not evidence of perceptual listening and
does not fabricate the seven-field queue. Horst's approved omen recording
remains unchanged. Each speaker
has a playable alternate: 40 clips (4,107,104 bytes) from 42 scripted lines,
39 with spoken-word-exact ASR and one explicit homophone flag. The two semantic ASR failures (Rüdiger's second line
and Knick's A38 reply) remain private and use the same-text browser fallback.
Bärbel's Bon/Bohn transcription is an explicit homophone listening flag, not
a literal ASR pass. Script correctness and pleasant or frightening delivery
still require human listening; ASR does not approve either.

Clean speech retains a quiet, fixed pitch-shifted undertone (16%, low-pass
1,450 Hz, per-speaker ratio 0.78–0.96), without repeated delays or trails.
Final mono 48 kHz / 128 kbit/s MP3s are measured at -18 LUFS ±0.3 and at most
-1.5 dBTP. Independent CPU int8 faster-whisper reads the encoded MP3 without
an expected-script prompt; number spellings are compared by spoken-word
equivalence. Estimated word onsets are bound to the real media playhead.
The private family queue and all normalized review takes are in Music's
`GermanySimulator amt fever listening review 2026-10-10/`. All seven human
decision fields remain blank. The existing 236-clip primary queue and its
promotion tool are unchanged. These 40 alternate recordings use direct
catalogue entries with the actual user approval, as the individually approved
omen does. Do not pass their queue to the primary promoter as though alternate
profile bindings or seven listening decisions had been verified.

`buergeramt-voice-profiles.js` defines distinct, intelligible Kafkaesque fever-dream delivery for the eight moving regulars, Brunhilde Knick across four counters, and three named patrons. Its `window.BuergeramtVoiceProfiles.byVoiceId` entries hold demeanor, rhythm, texture, an exact existing sample line, a **non-spoken** synthesis brief, the saved `candidateProfileId` with `candidateStatus: "private-unlistened"`, and immutable browser `rate`/`pitch` hints; `deliveryFor(voiceId)` returns those two browser hints or `null`. Horst's omen fallback remains `0.82`/`0.72`, and its user-approved candidate-2 recording remains the default at that exact cue. All desk slots share Knick's canonical identity and selected profile under the 2026-10-12 restoration above.

The installed Secret Tunnel v6 native CLI saved the following **private alternate profile candidates** from lightly pitch-shifted and band-limited copies of each speaker's existing EmoDB reference. These are additional profile UUIDs, not replacements for the primary UUIDs in `VOICE-CAST.json` or for Horst's official candidate 2:

| Voice ID | Saved private alternate UUID |
| --- | --- |
| `amt-horst-stempelmann` | `833480652ccf455f8184cbe752861420` |
| `amt-gisela-aktenberg` | `44d0f901322e403fa5ad8140c68ae426` |
| `amt-dieter-papiermann` | `eb4aab1842eb450eacbdd5d4ccc38ab6` |
| `amt-ruediger-nummermann` | `e2b59f89c1a84259aaa8f7006741fae2` |
| `amt-ingrid-feierabend` | `b456ded2b16d4bc38f6751bfe52266e8` |
| `amt-baerbel-pfennig` | `fd76c3fc053c4932b910fa504f376edc` |
| `amt-uwe-kopitz` | `e7a5a74103884c308730d7effa496ce2` |
| `amt-hilde-wartenscheidt` | `f55b40ca02e84ae696c396f211f880d6` |
| `amt-brunhilde-knick` | `b080c7d95ecd418fb428282461d7fbe7` |
| `amt-konrad-wohnungszettel` | `a1fd2081df674fba90118c4e6be303da` |
| `amt-mechthild-elternbogen` | `2946f9d627084b68933cb72f64bc32b7` |
| `amt-wolfram-rentenbescheid` | `65ebfa45e9394ccb9b4f4f5075ab672c` |

Full per-speaker source UUID, original and transformed reference SHA-256, exact FFmpeg filter, saved profile name/reference SHA-256, and CC0-1.0 source declaration are in the private `output/amt-fever-voices/private-profiles.json` receipt; transformed WAVs are under the Music library's `AMT-FEVER-VOICE-REFERENCES/`, outside the shipped game. The reference source is the Berlin Database of Emotional Speech original release already documented in `VOICE-CAST.json`; Horst's new *private* alternate uses his primary EmoDB reference, not the user-selected YouTube source of official candidate 2. The initial profile-saving pass rendered no utterance; the later default speech pass and explicit user use approval are recorded above. The native CLI `list` operation and on-disk SHA-256 comparison verified all twelve saved names, UUIDs, uploaded originals, and normalized references. Perceptual listening to these transformed references and new speech has not been verified. The user explicitly approved default use of the forty eligible recordings; no listening outcome is inferred from that instruction.

The current per-profile release audit is `GERMANY-SIMULATOR-VOICE-RELEASE-READINESS.json` in Music. Refresh it with `node tools/audit-voice-release-readiness.mjs --music-root "<German emotional voice databases>"`; add `--check` to detect stale inputs. Its rows use all 61 selected production bindings and the exact approved scene exception. Default recordings, current previews, historical takes and human decisions remain distinct; archived takes do not count as current coverage. The existing 56-row source corpus and 236-row audition queue remain historical evidence. After the cleanup, 194 primary candidates across 44 profiles remain active and no bulk row has all seven human fields marked yes. Legacy `targetVoiceId` is an editorial destination, not the voice actually heard.

**Horst Stempelmann / Aktenkurier, official candidate 2 (2026-10-09).** The user listened to the requested audition and explicitly instructed: “very good, I like this profile, save it as a second official voice profile candidate and make this the official audio of the aktenkurier scene”. Preserve primary candidate 1 (`c4c533edd860444e9e02ce0d22a78e8d`, EmoDB CC0). The additional saved Secret Tunnel profile is `09b19a96ec8848138ab0a0910af09ece`, named `GS Horst Stempelmann (Aktenkurier) · official candidate 2 · ominous`, using the first 30 seconds of the user-selected YouTube source. `VOICE-CAST.json` and the Music cast projection retain both identities. Only “Wer die Finsternis sieht, hat sie selbst gewählt!” is official scene audio: `assets/voices/horst-stempelmann/omen-candidate-02.mp3`, clip `aktenkurier-omen-candidate-02`. The other two auditions remain private and unapproved for gameplay. This individually approved clip is a direct `recordings` entry with the exact human instruction, not a fabricated seven-field approval of the separate 236-clip queue. Source/license/hash and renderer records are in [`assets/voices/LICENSES.md`](../assets/voices/LICENSES.md); source rights were not independently verified and no CC0 source claim is made. The saved reference was rendered with Chatterbox Multilingual V2 0.1.7 (MIT model revision `5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18`) after the native renderer failed. The approved normalized MP3 is unchanged: 77,612 bytes, 4.760 s, mono 24 kHz, -18.19 LUFS and -2.34 dBTP. Independent German ASR matched all authored words; the user's listening acceptance is separate evidence.

This scene clip loads only at its exact voice/text cue, without `voicePreview=1`. Native media start, playhead word cues, pause/resume and end drive the existing shared speech/score/Gaussian life controller. The word onsets are independent ASR estimates, not measured acoustic events on the user's speakers. Hidden-page pause suspends its watchdog and life clock; playback failure stops/unloads the source before the same-text browser fallback. Startup is bounded at 1.8 s and active playback at at least 20 s, with paused time excluded. Exit, replay and phone forfeiture invalidate old callbacks. `STIMMEN` changes the recording's live gain, and voice-off creates no media element. Run `node --test tests/aktenkurier-official-voice.test.mjs` for exact ownership, hashes and lifecycle checks; browser media receipts and rendered evidence remain distinct from listening and physical-device testing.

`python tools/catalog-existing-auditions.py --check` verifies that 13 already-rendered Chatterbox takes from `profile-auditions/` and `quiz-segments/` are included in the 236-entry candidate manifest with the exact current cast identity, reference hash, authored dialogue, and MP3 hash. These add nine quiz approaches, two Brigitte quiz follow-up segments, and the two named towel-character lines to the same private normalized listening and seven-field review queue as the original 223 clips. The game still needs all three same-speaker quiz segments before choosing a recorded prompt; only Brigitte's approach 8 / traffic / FS-10 set is complete in opt-in preview. `node tools/test-audition-preview.mjs` checks that the thirteen exact clips are opt-in, unavailable in default playback, and that an incomplete quiz still uses browser speech. The normalized FS-10 question's German-pinned transcript scored 92% on both original and normalized audio, so inspect that wording by ear.

For Chatterbox candidate dialogue, mark each of `heardWords`, `speakerIdentityFits`, `demeanorFits`, `intonationFits`, `artifactsAbsent`, `sourceRightsCleared`, and `approveForGame` as `yes` in the Music library's `VOICE-CANDIDATE-REVIEW-QUEUE.csv` only after listening to the **normalized** file and checking its intended use. `node tools/promote-reviewed-voice-dialogue.mjs --music-root "<German emotional voice databases>" --dry-run` validates the approved rows without publishing. Run it without `--dry-run` to hash-check the original and level-matched MP3s, copy approved files into `assets/voices/approved-dialogue/`, write their manifest and exact-text lookup, and enable those lines in normal gameplay; `--check` verifies the result later. It rejects incomplete approval, stale scripts/profiles/hashes, and delivery outside -18 LUFS ±0.3 / -1.5 dBTP. An approved line takes precedence over opt-in preview; unapproved lines retain their previous browser-speech or legacy-recording fallback. If approval of a published line is revoked, resolve that game use explicitly rather than silently removing or replacing its asset. Refresh the release audit after promotion.

Before the first real promotion or after changing that script, run `python tools/test_voice_promotion.py --music-root "<German emotional voice databases>"`. It creates disposable game/Music copies, simulates approval of one already generated take, and verifies rejection of an incomplete gate, dry-run without writes, the published MP3 hash, manifest/lookup update, idempotency, and explicit revocation failure. It does not mark any live queue row approved or alter the current game assets.

For line-by-line human review, start `python tools/voice-review-server.py --music-root "<German emotional voice databases>"` in the game checkout and open the printed local URL. Its one-clip page plays the hash-verified original and level-matched copy, shows the exact script, Whisper readings, word percentage, source/model licenses, and all seven decision fields. `Save this review` writes only that row back to the Music CSV; it does not generate audio or publish to the game. Game approval stays disabled until the other six checks are explicitly `yes`. The server binds only to loopback with a per-run token, rejects stale saves, and stops with Ctrl+C. Run `python tools/test_voice_review_server.py --music-root "<German emotional voice databases>"` to check the queue parser, local audio, atomic save, and rejection paths without editing the real review queue.

The review page starts with **One per speaker**, derived from current selected-profile candidates. `VOICE-FIRST-REVIEW-53.csv` retains its compatibility filename but now selects 44 speakers from 194 active takes. `python tools/build-voice-first-review.py --music-root "<German emotional voice databases>" --check` verifies exact identity, normalized hashes and the shortlist. The server exposes only current takes; retired, superseded and same-UUID renderer/reference changes cannot receive game approval. All 236 historical decision rows remain unchanged. `python tools/test_voice_review_server.py --music-root "<German emotional voice databases>"` verifies the current HTTP flow and rejection fixtures. `node tools/playtest-voice-first-review.mjs <local review URL>` checks the existing rendered filter without approving or playing clips.

For a newly generated **Secret Tunnel** take, run `python tools/audit-private-voice-takes.py --music-root "<German emotional voice databases>"` before any candidate-catalog work. The audit checks its native `take.json` receipt against the current game cast and request CSV row, exact text/profile request hash, uploaded and normalized reference hashes, saved MP3 bytes, original speech metadata, and Whisper word-fidelity fields. The MP3's `__wfNN` suffix is feedback only. A receipt remains a private candidate until its renderer's model terms, voice-source rights, normalized delivery copy, and human listening decision are recorded. This audit never publishes audio or grants approval; a changed request row must be reconciled instead of silently reused. Run `python tools/test_audit_private_voice_takes.py --music-root "<German emotional voice databases>"` to verify that altered MP3 bytes and request provenance are rejected using disposable copies. The current 46 saved private receipts pass this integrity audit; they do not count as default game voices.

For subsequent generation, start with the Music library's `GERMANY-SIMULATOR-REMAINING-VOICE-REQUESTS/README.md` and `INDEX.csv`. `python tools/reconcile-voice-generation-queues.py --music-root "<German emotional voice databases>" --check` verifies this derived set against the current cast, dialogue inventory, the 18 original quiz queues, two crowd queues, and all 46 private take receipts. It excludes 16 already-saved quiz starter segments, leaving 1,321 quiz segments and 432 crowd lines. The original request CSVs remain unchanged. Use the `profileId`, exact `script`, reference and source-inventory hashes in each remaining row; a saved private take still needs listening, license review, normalization, and catalog integration. For a WebGPT take made with another renderer, keep the MP3 and a truthful record of the request row, `voiceId`, `profileId`, exact script, reference and MP3 SHA-256 hashes, renderer/model revision and license, source rights, transcript, and word score or unavailable status. Verify those against the current cast, queue, and encoded file before adding a candidate to the existing manifest; then run normalization, independent Whisper review, technical audit, and the seven-field listening review. Do not fabricate Secret Tunnel `speech.json`, `take.json`, or `__wfNN` metadata to satisfy the Secret Tunnel-only receipt audit.

The three static Bürgeramt patrons (Konrad Wohnungszettel, Mechthild Elternbogen, Wolfram Rentenbescheid) now have named, proximity-triggered lines in `buergeramt-story.js` and `buergeramt.js`. Their exact scripts are also in the dialogue inventory. Until a matching recording clears review, those interactions use browser speech. They have saved Secret Tunnel profiles and private noncommercial auditions, but no playable cloned candidate. `python tools/build-static-patron-render-queue.py --music-root "<German emotional voice databases>" --check` verifies their separate `GERMANY-SIMULATOR-STATIC-PATRON-RENDER-QUEUE.csv` against the current cast, audition scripts, and saved reference WAV bytes. The Music root also contains `GERMANY-SIMULATOR-STATIC-PATRON-WEBGPT-HANDOFF.zip` with that exact queue, all three hash-verified reference WAVs, the corpus license declaration, and delivery instructions. Those exact lines are a WebGPT handoff for a renderer whose terms permit the intended game use; the private OmniVoice MP3s are not publication assets. A new take still needs truthful model provenance, Whisper feedback, normalization, and human listening before promotion through the existing exact voice/text lookup. `node tools/playtest-static-patron-dialogue.mjs` walks to all three figures and checks their names, scripts, and return to the office flow.

The 18 quiz and two crowd source queues retain the prior dialogue-inventory SHA-256 in their immutable request rows and private receipts. `For-AI/VOICE-DIALOGUE-INVENTORY-QUEUE-BASELINE.json` preserves those exact source bytes. `tools/audit-private-voice-takes.py` and `tools/reconcile-voice-generation-queues.py` accept that archived hash only after checking that the current inventory differs solely by the three patron entries and that all pre-existing dialogue pools are identical. This keeps the 46 saved take receipts verifiable without rewriting their provenance; any later change to quiz or crowd text requires new source queues. Run `python tools/sync-music-cast-index.py --music-root "<German emotional voice databases>" --check` to verify the 56-profile Music handoff after a cast edit.

Runtime lookup now gives a reviewed exact voice/text recording precedence even where a legacy recording already exists, including Hans-Peter's gain/loss and law quotes and Dieter Hupfer's traffic shouts. The fallback stays in place until a replacement with that speaker's ID and exact visible words is approved. Heinrich Wachtmeister's grass warning and other police lines use the same gate; a matching angry candidate currently requires `?voicePreview=1` because its human review is still blank.

After changing the release lookup, run `node tools/playtest-reviewed-voice-route.mjs` with Playwright available (`PLAYWRIGHT_MODULE` can name the installed package path). It serves a temporary approved police grass line only inside the test browser and checks default, opt-in preview, and approved precedence over a legacy recording. `node tools/playtest-amt-audio-handoff.mjs` separately checks city/Bürgeramt speech handoff on desktop and mobile with a stubbed 3D renderer; neither browser test approves the sound of a candidate.

Run `node tools/audit-modeled-voice-coverage.mjs --check` when changing modeled characters or speaker bindings. [`VOICE-MODEL-COVERAGE-AUDIT.json`](./VOICE-MODEL-COVERAGE-AUDIT.json) checks 56 new nonpolitical profile UUIDs, the named city and crowd speaker IDs, player/police/towel bindings, and the seven static Bürgeramt render slots and four unique speaking identities against the current cast and model source. All four desk slots represent Knick, with independent animation slots and one shared character/voice ID under the 2026-10-12 restoration. The optional eight-model street pack is a set of visual templates applied to existing NPC state: its asset titles are not separate displayed game identities and do not justify eight duplicate voice profiles. [`persona-map.js`](../assets/models/street-characters/persona-map.js) now assigns the 19 city and twelve crowd speaker IDs to explicit meshes with matching declared gender presentation and a documented demeanor rationale; an unknown named speaker keeps the existing sprite. A forced visual-debug URL can override the mesh only for inspection. Rendered persona fit still needs review before accepting this opt-in pack. If a template becomes a distinct speaking character, give it a stable named `voiceId`, a cast entry, and its own Secret Tunnel profile before authoring audio. This source audit does not replace rendered or audible review.

To verify the installed Secret Tunnel against the game cast, run `python tools/audit-live-secret-tunnel-profiles.py --music-root "<German emotional voice databases>" --secret-tunnel-exe "<installed secret-tunnel-v6.exe>" --voice-resources "<installed resources/voice>"`; add `--check` to compare with the saved Music report. It checks the configured shared root and all 61 selected character UUIDs and the exact scene exception, names, uploaded-original hashes, normalized-reference hashes and saved audio bytes. The exact Horst scene exception and preserved first candidate are protected; unrelated profiles stay outside game cleanup. Live profile integrity establishes identity binding, not audible performance or game release approval.

For the first Bürgeramt episode, keep two separate speaker pipelines: the user-selected `GS Kriminalpolizei` profile (`kriminalpolizei`) on the phone and Brunhilde Knick (`amt-brunhilde-knick`) at Schalter 3. Heinrich Wachtmeister (`polizei-heinrich-wachtmeister`) retains the city police role. The phone replacement was explicitly requested on 2026-10-10; its exact saved UUID, original/reference hashes, newly authored text, selected takes, final MP3 hashes and encoded-word checks are in `assets/voices/kriminalpolizei/manifest.json`. It plays by default for this family, with exact-text browser speech on failure. Full listening review remains unperformed and must not be claimed. Brunhilde uses her selected fever reference and processing for all newly recorded lines; her old primary profile is archived. A YouTube URL alone does not grant reuse or cloning permission. Render each exact visible line, inspect a short sample, then verify the entire recording by listening and transcription before general catalog approval. A quiet radio layer on the phone must stop with its speech.

The current Knick target covers 156 registration graph lines and twelve fixed refusal/outburst/warning/status lines, all recorded, plus three eligible separate ambient remarks. Her introduction and completion now have fixed authored words. The only held main-manifest slot is an unused historical A38 exchange outside the current target. Future dynamic or unavailable speech retains her caption fallback; the expired appointment is a companion-page stamp followed by a manual fresh QR scan. Never substitute a generic browser voice for Knick.

Heinrich also speaks four exact region-specific lines while his visible police model arrests and escorts a crowd character. [`VOICE-POLICE-ESCORT-QUEUE.csv`](./VOICE-POLICE-ESCORT-QUEUE.csv) binds those lines to Heinrich's existing profile and records their triggers. All four now have private native MP3s with `take.json` receipts under the Music library's `GermanySimulator Whisper-scored private candidates 2026-10-08/`; row-order Whisper scores are 100%, 100%, 67%, and 78%. The two lower scores include `Spiel-Knast`/`Spielknast` orthography, and the Berlin completion transcript also hears `ist` for scripted English `is`. Preserve those raw scores and inspect the audible words; none of the four has passed human listening review or entered the game catalogue. The runtime passes the speaking officer's `voiceId` to candidate lookup, so an accepted clip can replace browser speech without changing the character identity. The police car and helicopter announcements are institution/vehicle speech without a modeled human speaker; keep them separately attributed.

The Music library's `GERMANY-SIMULATOR-PLAYER-LEGACY-REVOICE-15.csv` tracks 15 legacy clip IDs to recast. The first two gain/loss reactions now have private Hans-Peter Mustermann native takes with exact-word Whisper scores of 100% each and verified `take.json`/MP3 hashes. Thirteen statute citations remain unrendered. The third queue row was intentionally interrupted before producing a take; its `failure.json` preserves that aborted attempt so a routine rerun cannot advance into the long citation. Use `run_scored_voice_queue.py --verify-only --max-rows 2` to check only the completed rows without starting generation. None of these private clips has passed listening, identity, number, or license review, so the existing game recordings remain in place.

Secret Tunnel word scores ignore delivery punctuation and compare Whisper's decoded words. The current staged scorer checks both joined and separated hyphens and records the better match as `word-v3-hyphen-best-match` with `hyphen_mode`, so written `Spiel-Knast` can match `Spielknast` and `Dativ, Akkusativ` can match `Dativ-Akkusativ`. Earlier saved v1/v2 scores and their `__wfNN` filenames remain unchanged provenance; do not rewrite a receipt just because a later normalizer would score its transcript differently. Inspect the actual words by listening, especially for legal terms, negation, and code switches.

The current prepared Secret Tunnel resource manifest `voice-runtime.json` records `features: "cuda"` for OmniVoice speech synthesis and `asrFeatures: "cuda"` for Whisper. A German synthesis smoke resolved to `Cuda(0)` and its independent transcript matched the scripted sentence. An older isolated word-scoring build under `verify-word-v3/resources/voice/` still has `features: ""` for CPU synthesis, although its Whisper uses CUDA; do not mistake that older test bundle for the current prepared app resources. Check the specific take's inference record before claiming its device, and inspect the resource manifest after any replacement build. The shared profile root has one generation lock across Secret Tunnel builds. The Music queue runner checks it before each new request and exits busy without creating a failure receipt if another generation is active; a request already waiting inside Secret Tunnel can still exhaust its timeout without rendering.

The pinned [OmniVoice model card](https://huggingface.co/k2-fsa/OmniVoice/blob/c5fdb5ccb189668d56333f77ba2629f4cd7535f4/README.md) licenses its pre-trained weights as CC BY-NC, separate from its Apache-licensed code; the [model maintainer confirms the weights cannot be used commercially](https://huggingface.co/k2-fsa/OmniVoice/discussions/37). Treat Secret Tunnel OmniVoice takes as private evaluation for any commercial game release unless separate model rights are documented. The existing opt-in Chatterbox candidates use a [model repository marked MIT](https://huggingface.co/ResembleAI/chatterbox/tree/5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18), but their CC0 input provenance, exact words, identity, performance, and final use still need review. Keep renderer/model/license fields attached to every take; a Whisper score never clears either rights or audible quality.

All three fixed Brunhilde Knick lines in `VOICE-BUERGERAMT-RUNTIME-QUEUE.csv` now have private native MP3s and `take.json` receipts under the Music library's `GermanySimulator Whisper-scored private candidates 2026-10-08/amt-brunhilde-knick/`. The expired-ticket, early-counter, and declined-phone transcripts each match their exact source words at 100% under the new word-normalization version. `run_scored_voice_queue.py --verify-only --max-rows 3` checks the frozen request queue against the saved hashes without starting inference; `GERMANY-SIMULATOR-PRIVATE-WORD-REVIEW.csv` lists their audio paths and transcripts. These are not yet in the opt-in game catalogue and still require listening for delivery, identity, clipping, and reference echo. The variable `B-100`–`B-899` ticket line remains a separate gap.

All nine rows of the Music library's frozen `GERMANY-SIMULATOR-QUIZ-FEEDBACK-MISSING-9.csv` now have private `take.json`/MP3 receipts from their own named profiles. In row order, saved Whisper word scores are 0%, 100%, 67%, 67%, 100%, 100%, 67%, 67%, and 100%. The first three were scored by the older auto-language helper; German-pinned retranscription of the same Brigitte take finds all three “Nein” words, while Gisela's original still yields two. The six newer takes record `asr_language_hint: de`; Hartmut, Rüdiger, and Sabine each yield two recognized “Nein” words, while Heike, Klaus-Dieter, and Uwe yield three. These are word checks, not approval of the intended three-beat delivery, emotion, pronunciation, or speaker identity. `run_scored_voice_queue.py --verify-only --max-rows 9` checks the exact frozen requests, MP3s, metadata hashes, and profile bindings without inference; `GERMANY-SIMULATOR-PRIVATE-WORD-REVIEW.csv` links the transcripts and audio. Keep all nine out of the game catalogue until human listening and rights review.

Short repeated German words can make the older Whisper helper auto-detect English or numerals. The Music library's `GERMANY-SIMULATOR-QUIZ-LANGUAGE-HINT-REVIEW.json` retranscribes the same five encoded quiz MP3s with an explicit German hint, retaining their SHA-256 hashes and original `__wfNN` names. It finds all three “Nein” words in Brigitte's original take and Gisela's pause-prompt retake (100% diagnostic scores), while their other variants retain only two; Dietmar stays at 100%. The adjacent private word-review CSV keeps original and German-pinned columns separate and identifies punctuation-only prompt variants against the unchanged visible game line. Use the German-pinned score to triage, then listen: neither ASR mode establishes pronunciation, three-beat delivery, emotion, or character identity. New German Secret Tunnel takes request the German hint directly and record `asr_language_hint: de` in `word_fidelity`; older saved scores are left intact.

## Saved profiles

For a cross-application identity check, match each game `voiceId`, fictional full name, Secret Tunnel profile UUID, and saved profile name before generating. Record two different audio hashes: the uploaded `original.wav` hash and Secret Tunnel's normalized `reference.wav` hash. The cast's historical `workingReferenceSha256` is mixed: it identifies the upload for 53 profiles and the normalized reference for the three newest patrons. Do not compare that field blindly with `speech.json.reference_sha256`; use the normalized `profileReferenceSha256` from the Music library's `GERMANY-SIMULATOR-CAST-INDEX.json`. Its adjacent `GERMANY-SIMULATOR-PROFILE-ROOT-AUDIT.json` verifies all 56 IDs, names, and both hashes against the shared Music profile root. The installed Secret Tunnel now uses that root through `voice-data-root.txt`; a fresh `voice_status` reported `runtimeReady` and `asrReady`, and `voice_list` matched all 56 cast UUIDs, exact names, uploaded hashes, and normalized reference hashes, including the three static patrons. Repeat the live check after an app update or profile change.

For per-character asset status, use `GERMANY-SIMULATOR-VOICE-ASSET-COVERAGE.csv` and `.json` in the approved Music library. `refresh_voice_coverage.py --game-root <checkout>` verifies cast ownership, source-reference hashes, and every listed MP3 before refreshing those files. It also writes `GERMANY-SIMULATOR-PRIVATE-WORD-REVIEW.csv`, with each new private take's exact script, Whisper transcript and score, profile role, MP3 hash, and human-review status. Refresh it after a generation batch. The current coverage snapshot accounts for all 56 cast profiles having at least one saved audio sample across game candidates, profile auditions, quiz previews, and private scored auditions. It does not establish complete dialogue coverage, perceptual approval, or default game playback; the CSV keeps those asset classes separate.

For the 236 opt-in Chatterbox preview lines, `tools/audit-voice-candidate-audio.py --game-root <checkout> --ffmpeg <absolute ffmpeg.exe> --output-dir <Music library>` checks each encoded MP3 against the manifest hash and duration, decodes it, and writes `VOICE-CANDIDATE-TECHNICAL-AUDIT.csv` and `.json` beside this handoff in the Music library. It also writes `VOICE-CANDIDATE-REVIEW-QUEUE.csv`, joining verified cast UUID/reference hashes, name, gender, demeanor, valence/arousal targets, source emotion, exact script, independent ASR, technical levels, and a hash-checked Music listening copy. All human-decision fields start blank; rerunning the audit preserves decisions only when the MP3 hash, voice ID, profile UUID, and script are unchanged. The current technical pass finds no hash, duration, near-full-scale sample-peak, low-average-level, or long-silence problem. It flags 132 clips outside a broad -20 to -16 LUFS review band (125 quieter, seven louder) and 232 above the foreground delivery limit of -1.5 dBTP; 235 have at least one flag. These are level/normalization priorities, not evidence of audible clipping or a failed spoken line. Preserve the original MP3s and their manifest hashes while auditioning. For any accepted line, use the repository's two-pass `tools/normalize-audio.ps1 -Apply` delivery procedure, then recheck encoded loudness, true peak, duration, words, and updated output hash before changing the catalogue. Technical measurements never replace listening for identity, demeanor, artifacts, or rights.

`tools/review-candidate-asr.py --game-root <checkout> --asr <absolute secret-tunnel-asr.exe> --ffmpeg <absolute ffmpeg.exe> --model <Whisper model directory> --output-dir <Music library>` independently retranscribes only the manifest's nonliteral clips with a German language hint. It saves resumable `VOICE-CANDIDATE-GERMAN-ASR-REVIEW.json` and `.csv` with the original and new transcripts, encoded MP3 hashes, ASR binary/model hashes, and a diagnostic word percentage. The scorer equates written German numbers through 99, common clock-time notation, and exact split/joined compounds; it does not infer what was audible. All 65 flagged clips have been checked with the installed Whisper large-v3-turbo q4_0 helper: 17 reach diagnostic 100% under those orthography rules, and 48 still differ. The current model/speaker audit still verifies all 56 nonpolitical profile bindings, with no newly unassigned modeled speaker. The technical audit joins the ASR results into `VOICE-CANDIDATE-REVIEW-QUEUE.csv` and orders the 48 word checks first, then the 17 orthography-resolved-but-unheard cases, 157 other delivery-level cases, and one technically unflagged case. The original manifest ASR, encoded MP3s, and human-decision fields remain intact; check code-switched words, numbers, and accent by listening before any approval.

For level-matched auditioning, `tools/prepare-voice-listening-copies.py --game-root <checkout> --ffmpeg <absolute ffmpeg.exe> --output-dir <private Music folder>` creates separate MP3s and a source/output hash manifest without editing game assets. Its `--verify-only` pass independently measures the encoded outputs, hashes, duration, loudness, and true peak. The current `GermanySimulator normalized voice review 2026-10-09/` folder has 236 verified copies between -18.29 and -17.77 LUFS and no true peak above -1.58 dBTP. One high-crest Brunhilde copy needed the recorded compressor fallback; compare it with its original before judging emotion or texture. `tools/review-normalized-listening-words.py` independently transcribes these re-encoded MP3s with the German-pinned Secret Tunnel Whisper helper and saves a resumable `word-review.json`/`.csv` in that folder. Of 236 encoded copies, 168 reach diagnostic 100% and 68 need word listening. The tool also compared the 18 normalized nonliteral clips whose original manifest had been literal using the same Whisper helper on the original MP3s; three scored 100% only on the original. The queue puts those three first for side-by-side listening, then the other 65 encoded word checks, one original-word comparison, one compressed-delivery check, and 166 full listening checks. A changed ASR transcript does not prove changed audible words. These are private listening aids; passing levels or ASR does not promote an MP3 to gameplay. If a take is accepted, recheck the actual chosen output and update its provenance/hash in the game catalogue.

Read `castVoices`, `roleVoices`, `voices`, and `speechFamilies` in the catalog before making a new profile. The 56 name-bearing v6 cast and role profiles in `VOICE-CAST.json` include 45 nonpolitical modeled speaking identities (three are static Bürgeramt patrons with authored browser-speech interactions), nine separately displayed quiz-portrait speakers, and two towel-archetype review voices. The current restoration retains 61 fixed production bindings and the exact Horst scene exception; the three superseded counter profiles are privately preserved without active bindings. A previously saved `GS narrator` profile is retired and has no game binding; official documents and mission guidance use browser speech.

The modeled speaking 45 are the 19 named city pedestrians, eight Bürgeramt walkers, twelve named moving crowd identities, Hans-Peter Mustermann, Heinrich Wachtmeister, Brunhilde Knick, and three static Bürgeramt patrons: Konrad Wohnungszettel (`renter`), Mechthild Elternbogen (`parent`), and Wolfram Rentenbescheid (`pensioner`). The patrons now have exact named interactions; browser speech remains their fallback until reviewed cloned takes are available. Their demeanor directions are supported by artwork and those short authored lines, with perceptual casting review still pending. Erna Frist, Ottilie Durchschlag and Hedwig Zuständig are retired identities; all four counters share Brunhilde Knick's character ID and voice. Günther Liegestuhl and Walburga Handtuch label the towel sprite archetypes used by the moving crowd; they have separate audition profiles but are not additional spawned NPC identities. The nine quiz people have their own portraits and spoken quiz identities, while a moving crowd NPC supplies the encounter's world sprite. Thus 56 saved profiles must not be reported as 56 separately modeled actors. The four special city sprites (`borderPourer`, `merkel`, `bayern`, `alice`) depict political figures outside this nonpolitical casting goal; vehicle and helicopter announcements and the unmodeled `PFÖRTNERIN` text are not new modeled human identities.

Brunhilde’s current UUID is `b080c7d95ecd418fb428282461d7fbe7`. Her EmoDB source provenance remains in the cast, while `productionVoices` records the selected original/reference hashes, renderer and undertone.

Existing Thorsten, quiz-sting, train, Söder/Bayern, and Alice recordings retain their own voice IDs and provenance. Legacy clips carry `targetVoiceId` where a new character profile should eventually take over. This field is an editorial assignment only; changing it does not change the audio. Merz and Merkel use their selected generation profiles. Söder/Bayern and Alice retain their source recordings without an unverified future profile binding. Merz now uses the user-selected `GS Merz` profile (`cb7f3cee85f648c186355329316c6b3b`) for all authored German lines, following the explicit replacement and additional original-quotation requests on 2026-10-10 and 2026-10-11. The exact profile/reference hashes, selected takes, rejected Großvater take, encoded transcripts and normalized MP3 hashes are in `assets/voices/merz/manifest.json`. Both proximity and direct interaction play these recordings by default and retain exact-text German masculine browser speech on load failure. Listening review remains unperformed. Merkel now uses the user-selected `GS Merkel` profile (`25916e5981064e09a2c42350d5fe5f04`) for all nine authored lines, including the behind-player response, following the explicit resynthesis request completed on 2026-10-11. Her profile/reference hashes, selected takes, encoded transcripts and normalized MP3 hashes are in `assets/voices/merkel/manifest.json`. Both proximity and direct interaction play these recordings by default and retain exact-text browser speech on load failure. Her original excerpts are retired from runtime delivery. Listening review remains unperformed. The unrelated, preexisting `Friedrich Merz - Satire (Stadtbild)` profile in Voice Cloner is not bound to the game catalog. Do not use a recognizable public figure's recording as a new cloning reference; use a separately sourced character voice for future lines. Preserve recorded-asset limits in `assets/voices/LICENSES.md` and `assets/audio/trains/PROVENANCE.md`.

## Choose an emotional reference for every new character

For every new character Voice Cloner profile, use the downloaded German emotional voice library as the default reference source. Choose a source speaker and emotion label that fit the character's role, demeanor, and intended delivery: an angry Amt worker should start from angry speech; a chill person should start from neutral or suitably low-arousal speech. This rule applies to future profiles; reuse existing character profiles unless a replacement is requested.

### Assess demeanor before choosing audio

Complete this assessment before filtering samples or creating the profile:

1. Read the character's owning story/character entry and representative authored dialogue. Describe the general demeanor in one sentence, supported by behavior, word choice, attitude toward the player, and typical scenes. Distinguish this usual baseline from a temporary scene emotion; a job title alone does not establish demeanor.
2. Set intended **valence** (`negative`, `neutral`, or `positive`): the unpleasant/hostile, matter-of-fact, or pleasant/welcoming emotional tone. Separately set intended **arousal** (`low`, `medium`, or `high`): subdued/relaxed, conversational, or activated/urgent delivery. Loudness, speaking speed, age, pitch, and authority are useful performance details, not substitutes for either dimension. State ambiguity and the reason for the chosen baseline when the characterization is sparse.
3. Record `voiceId`, the demeanor sentence, evidence, `targetValence`, `targetArousal`, intended emotion label, and relevant delivery constraints in the existing profile source/provenance note. These targets are authored character directions, not measured stimulus norms. For example, an explicitly angry Amt worker normally suggests negative valence and medium/high arousal; a chill person suggests neutral/positive valence and low arousal. A cheerful but mellow person differs from an excited one, and cold anger can need less activation than shouting.
4. Match both targets when selecting the reference: use actual LANG valence/arousal ratings where applicable; otherwise use the corpus's emotion label as a qualitative starting point and assess the recording's performance. Compare numeric ratings only on their documented scale. Do not invent Emo-DB valence/arousal scores or assume every recording with one emotion label has the same arousal. Keep scene variants tied to the same speaker identity, and confirm the intended baseline in the generated smoke render before accepting the profile.

The local library is `C:\Users\cogpsy-vrlab\Music\German emotional voice databases`. On another Windows account, resolve its Music folder and look for `German emotional voice databases`. Read its `README.md`, `audio_index.csv`, and the selected corpus's speaker and rating metadata before choosing clips. If the library is missing or no suitable, licensed reference meets the engine's requirements, record that limitation and the reason for using another licensed source rather than silently choosing an unrelated voice.

For Secret Tunnel access, resolve the approved root named `German emotional voice databases` with `repo_list_roots`; use its returned `repo_id`, since folder IDs and approved roots depend on the PC and connection profile. This PC's active v6 profile exposes the collection; `repo_tree` verified the new audition folder and its MP3s on 2026-10-08. Folder write permissions follow the profile's access mode, so preserve the corpus originals. Use `repo_tree` to locate recordings and `repo_fetch_file`/`repo_read_many` for text metadata, with forward-slash paths relative to that root. WAV files are binary: pass the selected local recording to Voice Cloner's file import, or use an available approved binary/audio transfer; do not treat a text-file read as audio playback or import. Verify that the connected profile actually lists the collection before relying on remote access. A connection error or a Smart folder scope that excludes it is a transport/scope limitation to report, not evidence that samples are missing.

- Prefer `EmoDB_original/data/emodb/wav/`, or the `gold_standard` subset of `EmoDB_2.0/data/emodb_2.0/wav/`, for clearly identifiable emotional German sentences. These downloaded releases declare CC0 in their preserved `db.yaml` files. The original 535 recordings are included in the expanded 816-recording release; the other 281 are marked `ambiguous` in the index. Use the selected subset by default, and use only speech from `wav/`, never physiological waveforms from `laryngo/`.
- `LANG_audition/data/` contains negative words spoken angrily, neutral words, and positive words spoken happily. Its `LANG-audition.xls` supplies actual valence/arousal norms. Consult the preserved source terms for cloning and game use, and retain required attribution. These very short words need enough same-speaker material to meet the selected engine's reference requirements. Ratings concern word meaning and prosody together; do not describe the corpus as independently controlling both.
- GAUDIE's public documentation is present, but its audio and validation data require a signed, study-specific nonprofit research agreement. It is not an available source for game voice profiles under that agreement.

| Character demeanor | Starting source label | Selection guidance |
| --- | --- | --- |
| Angry, confrontational Amt worker or frustrated driver | Emo-DB `anger`; LANG negative/angry | Pick forceful delivery appropriate to the character, rather than any negative-valence clip. |
| Chill, composed, matter-of-fact person | `neutral`; low-arousal neutral LANG recordings | Neutral is the starting label; listen for relaxed delivery. Do not equate boredom or sadness with being chill. |
| Cheerful, warm, enthusiastic person | Emo-DB `happiness`; LANG positive/happy | Match the desired degree of enthusiasm. |
| Anxious or nervous person | Emo-DB `fear` | Keep anxiety distinct from anger. |
| Weary, disengaged or bored bureaucrat | Emo-DB `boredom` | Select subdued, disengaged delivery. |
| Sad or dejected person | Emo-DB `sadness` | Select downcast delivery. |
| Disgusted or contemptuous reaction | Emo-DB `disgust` | Treat contempt as a character direction to review, not a separate validated corpus label. |

Filter the index by the desired label and validation subset, then select clean clips from one source speaker whose timbre and performance fit the character. If several clips must be joined, keep the same speaker and compatible emotional delivery throughout; prepare the working reference outside game assets and preserve the originals. Different characters should have deliberately chosen identities. For later emotional variants of one character, keep the same source speaker rather than substituting another actor.

Before treating a new profile as a distinct character voice, compare its `workingReferenceSha256` and source speaker with the existing cast, then listen to its audition beside any shared-reference profiles, especially speakers in the same scene. The Music library's `GERMANY-SIMULATOR-SHARED-VOICE-REVIEW.csv` lists the current exact-reference groups and matching audition paths; its adjacent `.md` is the listening guide. An exact reference collision is a review priority, not proof that generated takes sound identical. A different edit from the same corpus actor may still sound like that actor. Record the listening decision before clearing either identity for default speech; if a recast is needed, preserve the old take for comparison and update the cast, Secret Tunnel UUID, and game binding together after verifying the replacement.

Record the character/voice ID, intended demeanor, corpus and version, source speaker ID, selected filenames and original SHA-256 hashes, emotion label, and available rating/recognition evidence in the profile's source note or existing provenance record. Preserve the catalog's existing source URL, license, reference hash, and `profileId` requirements. Numeric valence/arousal norms belong to LANG-audition; Emo-DB's emotion confidence and naturalness scores are not valence/arousal measurements. Keep corpora, private reference edits and saved profiles outside the repository's shipped `assets/`; only accepted generated game lines enter the existing speech catalog.

The source emotion guides selection; it does not guarantee that cloning preserves that emotion or makes generated speech scientifically validated. Render the character's exact authored smoke line and use the existing listening/transcription acceptance gate to check identity, demeanor, pronunciation and reference echo before producing game assets.

## Script the delivery before rendering

Give every new dialogue take a short delivery card **before** sending text to Voice Cloner. Start with the character's assessed baseline valence and arousal in `VOICE-CAST.json`, then state the emotion of this particular scene. Identify the words to stress, where the thought turns, and whether the sentence should rise, fall, hesitate, or land sharply. The same actor keeps the same saved profile when a scene changes their mood. Listen to a short trial: the source recording's emotion label is a casting clue, not proof that a generated take has the intended intonation.

Use German punctuation as part of the authored, visible line: commas for short breath groups, a full stop for a settled break, an em dash for an interruption or pivot, an ellipsis for an actual hesitation, and a question or exclamation mark for the intended ending. Avoid adding punctuation mechanically to every sentence. When a take needs a reliable silence beyond what punctuation produces, render exact word-preserving segments from the **same** character profile and join them with an explicitly timed pause. Keep the complete displayed sentence and the assembled spoken words identical, in the same order. Check the join for a timbre or room-tone jump. A pause is a timing direction, not a new word. For an existing line, change its authored source and visible text together before adopting a punctuation variant; otherwise retain the exact line and direct its delivery with a segment plan.

Keep nonverbal directions such as `[breath]`, `[sigh]`, `[laugh]`, `[swallow]`, or `[whispers]` in the private delivery card, never in the string sent to a plain-text speech model or displayed as if spoken. Such tags can be read aloud. A desired audible breath, sigh, or laugh needs its own permission-cleared recording or separately verified generated sound, with an explicit placement and level in the assembled clip. If it is absent, do not claim it was performed. Vocal interjections such as “Puh” count as words: author them in both the visible line and recording text, and translate them in subtitles. Do not use a nonverbal cue to hide a changed, omitted, or added word.

For example, Horst Stempelmann's existing omen line can be directed as: **low, controlled warning; slight lift on “Finsternis”; 300 ms hold after “sieht,”; fall and firm stress on “selbst gewählt”; no added vocal sound.** Its displayed/spoken line remains “Wer die Finsternis sieht, hat sie selbst gewählt!” A second, more hesitant take may use an ellipsis only if `buergeramt-story.js`, the cast inventory, the clip source, and the visible text all adopt that exact punctuation. Record the chosen pause duration, segment texts, cue asset if any, rendered profile UUID/model, and listening decision with the candidate. ASR checks the words; a person must judge timing, intonation, nonverbal realism, and whether the line still fits the character.

Requested Horst Stempelmann replacement (2026-10-09): the user-selected [YouTube reference](https://www.youtube.com/watch?v=MtGyTnkvNKk) is saved privately as Secret Tunnel profile `09b19a96ec8848138ab0a0910af09ece`, named `GS Horst Stempelmann · ominous YouTube reference 2026-10-09`. Voice Cloner imported the first 30 seconds, not the complete video. Its original M4A SHA-256 is `7de4a343ef08a06189c6d1cecdbab6c134a2192bd98425875e4c440a8685c317`; its normalized mono 24 kHz reference WAV SHA-256 is `177545215cfeccbbe758ab24e62011dcfc37c43aaca1c0ae15c75b24824b53ff`. The connected native generation failed with `Voice data path escapes its directory.`; a prepared native CLI recognized the same verified profile but its shared generation lock was busy. The documented Chatterbox Multilingual V2 fallback, revision `5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18` (MIT), rendered the exact three existing Horst lines from that reference. Private WAVs, final MP3s, delivery card, receipts, source transcript, and loudness measurements live under the Music library's `GermanySimulator requested Aktenkurier YouTube voice 2026-10-09/`. In file order, the omen, Aktenlauf warning, and Formular warning each passed independent German ASR on the final encoded MP3. They measure -18.19/-18.17/-18.09 LUFS and -2.34/-2.24/-2.29 dBTP after the private adaptation of the existing two-pass normalization procedure. These are pending listening and source cloning/game-use permission review; the canonical `amt-horst-stempelmann` binding and shipped recordings remain unchanged. Do not treat the saved profile, exact-word result, or requested reference as release approval.

## Secret Tunnel cast and audio catalogue

Use `For-AI/VOICE-CAST.json` as the working cast audit for named characters: each entry identifies the game character, a fictional full name, gender evidence, general demeanor, target valence and arousal, source speaker and file hashes, exact dialogue or dynamic dialogue sources, and the saved Secret Tunnel profile binding. `For-AI/VOICE-DIALOGUE-INVENTORY.json` snapshots the current regional line pools and 77 quiz questions; regenerate it with `node tools/build-voice-dialogue-inventory.mjs` whenever those game sources change. The short `gameCharacterId` can keep an existing animation/story key; the stable `voiceId` must include the full name in an ASCII slug (for example `amt-horst-stempelmann`). Give every fixed fictional speaker a distinct name. A Secret Tunnel profile is named `GS <full name> (<role>)`; its generated UUID is the `profileId`, not a substitute for the readable `voiceId`.

Before generating or binding a line, call Secret Tunnel Voice Cloner `voice_list` (or its native typed `list` operation) on the production profile. Confirm that the catalogue's `profileId` exists there with the exact profile name and original/reference hashes recorded in the cast audit. Never silently route one character's text through another character's UUID because a name happens to look similar.

To create a Secret Tunnel v6 profile, prepare 3–30 seconds of clear, single-speaker speech from one approved actor, retaining the exact component filenames, SHA-256 hashes, label, speaker ID, gender, corpus version, license, and reference transcript. Use the Voice Cloner tab's local recording import or its native `create` operation with the audio and source note. The native `generate` operation takes that returned `voiceId`/UUID, the exact authored text, and `language: "German"`. In the cast audit, distinguish the authored character valence/arousal targets from corpus measurements; EmoDB supplies categorical recognition, while LANG-audition has the numeric valence/arousal norms. A low-arousal character can still have a high-arousal line without changing speaker identity.

Existing game speech assets can also seed new profiles when their own provenance permits cloning and the proposed use. `assets/voices/LICENSES.md` identifies the six Thorsten-Voice excerpts as CC0 sources; their exact hashes and transcripts must match before import. User-supplied Söder, Alice, Merkel, quiz, and station recordings have narrower or unverified external provenance in that ledger. Record them as candidates, then establish cloning and reuse rights before using them as new reference material. Do not infer those rights from the fact that an MP3 is already shipped in the game.

Two saved Secret Tunnel v6 profiles demonstrate this source path. `verkehr-dieter-hupfer` (`093079ce208a4f7e8f0d50bb5170ea1f`) uses the three shipped angry Thorsten clips for the traffic driver. `sprecher-theodor-amtsstimme-thorsten` (`f24e025a49484ea7a23a59e1693dc740`) uses all six shipped Thorsten clips as a reusable alternate source; its original WAV SHA-256 is `85c25d5ce8ce6e05890510a3ccccaccc9ee7bfcc236d90af9036383d568cf42a`. It was imported through Secret Tunnel's own profile connector and verified in the native `voice_list`. A new German review line, “Willkommen im Bürgeramt. Bitte ziehen Sie eine Nummer.”, was rendered with Chatterbox from that same reference and transcribed word-for-word by independent ASR. The combined source has angry, amused, disgusted, and sleepy takes, so do not assign it a single valence/arousal label. For a new character, assess baseline valence/arousal first and use matching source segments or make a focused same-speaker reference. The profile's fictional label does not rename the original speaker Thorsten Müller; every component hash and exact word is in `VOICE-CAST.json` and `assets/voices/LICENSES.md`. A saved profile and ASR-matched candidate still require full listening review before game release.

For each accepted profile, maintain the dialogue inventory in `VOICE-CAST.json`; `AUDIO-TEXT-LIBRARY.js` owns the runtime `voiceId`, `profileId`, exact spoken text, subtitle, clip ID, and path; and `assets/voices/LICENSES.md` owns shipped audio provenance. Generate each exact German or authored Denglisch line from the owning profile's verified reference. If the native Secret Tunnel renderer cannot finish on the available hardware, a separately documented renderer may use that same reference and profile ID as its identity link; record its actual model, version, revision, and license, never label its output as OmniVoice. [Chatterbox Multilingual](https://github.com/resemble-ai/chatterbox) is the local fallback tested on 2026-10-08, with [MIT model terms](https://huggingface.co/ResembleAI/chatterbox) and German support. Listen to the complete result for voice identity, emotional fit, pronunciation, clipping, and reference echo; transcribe it against the visible text. Normalize reviewed clips with `tools/normalize-audio.ps1`, then add the MP3 and its duration/hash/model/source record to the runtime catalogue and license ledger. Keep browser speech for lines awaiting review. Secret Tunnel v6's OmniVoice weights have noncommercial terms and additional tokenizer conditions; review intended distribution before shipping output from that native renderer.

### Use Secret Tunnel Whisper feedback when generating new takes

The installed Secret Tunnel v6 transcribes each newly encoded MP3 with its bundled Whisper model. **Check the connected installation first:** `voice_status` must report both `runtimeReady` and `asrReady`; a different or older installation may omit `asrReady` and does not provide this feedback. For long text, call `voice_start_job`, poll `voice_job_status` until `completed`, and read `result.clip`; for short text, `voice_generate` returns the same clip metadata. `voice_list` shows recent clips and `voice_read_clip` returns the MP3 plus its `speech.json`. Record `clip_id`, `voice_id`, original `text`, `audio_file`, `word_fidelity`, output SHA-256, and the exact Secret Tunnel build/model with the candidate. A new scored MP3 has `__wfNN.mp3` in its saved name; a missing score is **not** zero and `__wf-unavailable.mp3` is **not** a quality judgment. An older cached clip may gain feedback without its original filename changing. The shipped game asset may use its stable catalogue filename, but its source filename and score belong in the candidate manifest.

`word_fidelity.transcript` is what Whisper decoded from the saved MP3. Its `percent` is a rounded word-edit score against the authored spoken words after punctuation and bracketed/parenthesized/asterisk delivery cues are ignored; substitutions, omissions, and extra words lower it. It is a triage signal, not a probability that the words are correct and not a measure of the character's valence, arousal, identity, or performance. Read the transcript and listen to the entire MP3 before deciding. Inspect names, negation, form IDs such as `A38`, and first/last words even at 100%. Treat number formatting (`siebzehn`/`17`), compounds, contractions, and German-English switches as review cases; compare the actual audible words and the intended visible text rather than editing either to fit the score. If `status` is `unavailable`, preserve the MP3 as a candidate and run a separate transcription check or mark the words unverified. A low score or changed word calls for an explicitly requested new take from the **same** character profile and a fresh review; Secret Tunnel does not regenerate automatically. Never promote a clip solely because its score is high.

For the current 236 Chatterbox preview MP3s, use their independent-ASR fields in `assets/voices/candidate-dialogue/manifest.json`; they were not produced by Secret Tunnel's new verifier and must not be assigned a fabricated `word_fidelity`. The current 65 non-literal whole-line results need targeted listening using `WORD-REVIEW-65.csv` in `GermanySimulator-all-voice-auditions-236-handoff.zip` under the Music library's `German emotional voice databases/` root; `REVIEW-SHEET.csv` covers all 236 distinct audition MP3s. Treat the repository manifest as the authority if an exported sheet differs. All 236 game candidates need full identity, emotion, clipping, join, and reference-echo review before default playback. If WebGPT or another agent makes a replacement, keep the original candidate until the new encoded MP3, exact source text, profile UUID, reference hash, renderer/license, transcript, listening decision, and output hash are recorded together. A score alone never changes `?voicePreview=1` eligibility or the current selected fallback policy.

## Create one reusable character voice

Initial 53-profile production checkpoint (2026-10-08): the cast audit contained 27 fixed fictional speakers and 93 authored lines, plus 26 role or dynamic-identity profiles for the default player voice, police, Brunhilde Knick, two towel tourists, nine quiz identities, and twelve named crowd identities. All 53 cast UUIDs, exact saved Secret Tunnel names, and imported source hashes were checked against the live v6 profile list on this PC. Name-bearing IDs are present in game/story source, review and quiz identities, and runtime `castVoices`/`roleVoices`. The 27 fixed profiles use 23 distinct reference edits from ten original EmoDB actors; the 53 new profiles together use 28 reference edits, so distinct UUIDs do not imply 53 acoustically distinct people. Two additional v6 profiles use provenance-checked CC0 Thorsten assets already shipped by the game: angry driver Dieter Hupfer and alternate source Theodor Amtsstimme. Early native Secret Tunnel v6 OmniVoice tests stalled and a GPU-enabled build ran out of this laptop's 6 GiB VRAM. A later queued German generation for Heinrich Wachtmeister completed from his verified saved profile. A fresh native v6 run then completed one private German audition for each of the 27 fixed profiles; those files and timed Horst Stempelmann and Ursula Neumann pause variants are under the Music voice library's `GermanySimulator native voice auditions 2026-10-08/`. Independent German ASR matched 24 of the 27 whole-line samples literally after case and punctuation normalization. Dieter's `siebzehn/17`, Bärbel's `Bon/Bonn`, and Irmgard's `gibt es/gibt's` require listening review; both assembled pause variants matched their complete displayed words. These native MP3s remain private comparison takes because the [publisher says OmniVoice model weights are noncommercial](https://huggingface.co/k2-fsa/OmniVoice/discussions/37) and full listening acceptance has not occurred. Chatterbox Multilingual V2 candidates from the same verified references cover all 93 fixed lines, 21 authored Bürgeramt clerk lines, twelve Heinrich Wachtmeister city police barks, four Bürgeramt phone lines, all 48 barks for all twelve separately named moving crowd identities, and all 45 inner-monologue lines for Hans-Peter Mustermann. Targeted retakes repaired several transcription errors; all authored player and named-crowd lines now have opt-in candidates; non-literal whole-line ASR still needs listening review. The 114 fixed/clerk lines are packaged in the original listening-review ZIP, and all 223 selected MP3s are available in an opt-in game preview. Independent German ASR matched 158 of 223 selected takes word-for-word after case and punctuation normalization. Seven Hans-Peter lines were rendered as German and English fragments from the same saved reference. Their fragments passed language-matched ASR or the documented Leergut compound-spacing check, and four joined lines also passed whole-line German ASR. Keep both checks in the manifest because German-only ASR can substitute an English phrase. Four crowd candidates pronounce written `07:04` as German clock time. Their manifest marks clock/compound-spacing equivalence separately from literal ASR agreement; verify by listening before release. Eight other crowd barks were assembled from same-profile German fragments and word-timestamped English `Your` or `reserved` extracted from a longer generated phrase. The phrase and German continuation have separate ASR checks; the short cut, join, and whole-line words still require human listening. Brunhilde Knick's `A38` candidate was replaced with a documented same-profile splice: a new form-number take and the original exact final question; independent ASR matched all intended words on the encoded MP3. The join and full performance still need human listening. Dieter Papiermann's changed `das/es` line likewise has an encoded, word-exact same-profile splice of its original first/last sentences and a new middle-sentence take; its joins and demeanor remain unapproved. Remaining mismatches include code-switching, spoken clock times, and possible changed words. Human listening and emotional/identity review remain pending; a profile or candidate line alone is not release-cleared game audio.

The three later static-patron references are private files under the Music library's `GermanySimulator additional visual cast references 2026-10-08/`, with exact source WAV hashes, EmoDB emotion-confidence values, gender evidence, authored valence/arousal targets, and Secret Tunnel creation IDs in its manifest. The installed app now lists Konrad, Mechthild, and Wolfram from the shared Music voice root, with their exact cast UUIDs, names, and reference hashes; `voice_status` reports `asrReady`. An isolated packaged CLI generated Konrad's audition-only German `__wf100.mp3`; its metadata and hash are in that folder's `AUDITIONS-MANIFEST.json`. Mechthild and Wolfram also have private `__wf100.mp3` takes, with exact transcripts and hashes in `GermanySimulator Whisper-scored private candidates 2026-10-08/`. `run_scored_voice_queue.py` validates the 56-profile cast binding, reference hash, exact script and saved score before copying a candidate; reruns skip verified takes and do not regenerate failures. All three now have authored, named proximity lines in the game and the dialogue inventory. The private takes match those scripts but remain unapproved; no cloned MP3 plays for them in normal gameplay.

Heinrich Wachtmeister's canonical profile uses four EmoDB speaker-03 clips categorized as anger; the corpus's emotion recognition confidence does **not** rank anger intensity. The Music library's `GermanySimulator police anger audition 2026-10-08/` holds a separate high-energy same-speaker reference and two grass-warning takes. Its four source clips are the highest-RMS clips among seven speaker-03 anger recordings with 1.0 recognition confidence in EmoDB 2.0. RMS is an energy proxy, not a validated anger-intensity score; the manifest records each file's rating, duration, RMS and hash. Whisper decoded the German "NICHT ÜBER DEN RASEN!" as the exact four words (100%); the Berlin Denglisch "Nicht auf ze grass, bitte!" scored 60%, decoding "ze grass" as "zu Gras". This may be a spelling/accent issue, but the audible words still need checking. Keep both takes private until a person listens for an actual yell, identity, clipping and reference echo. The game still maps Heinrich's stable voice ID to his original UUID, and the grass offense now selects the matching regional police line rather than a random general bark. The existing opt-in German grass candidate has an exact-word independent-ASR result; it is not the new audition or default approved playback.

The opt-in preview is `?voicePreview=1` on the game URL with voice enabled. Its 236-entry hash manifest and 223 original MP3s live under `assets/voices/candidate-dialogue/`, with a review-only lookup in `AUDIO-TEXT-LIBRARY.js`. City NPC dialogue, Bürgeramt character/clerk scenes, police barks, named moving towel pedestrians, and Hans-Peter's inner monologue use a candidate only when the stable name-bearing `voiceId` and the entire visible line match. The Bürgeramt QR invitation carries the preview flag to the phone; four exact Heinrich Wachtmeister phone lines then play there with synchronized `recording` start/finish receipts. Missing files and unlisted lines use browser speech. Without the query flag, all these scenes retain normal playback. This preview is an audition tool, not approval to use the candidates as default game speech. Review every line's words, identity, emotion, clipping, and reference echo before promoting it to the ordinary `recordings` catalogue and license ledger.

For dynamic game speech, pass the actor's stable `voiceId` as `candidateVoiceId` while retaining the existing `voiceKey` for browser-speech fallback. Heinrich Wachtmeister owns police barks. A moving towel-sprite pedestrian now uses one of nine ordinary crowd identities: `crowdArchetypes` chooses its text and sprite, while `n.voiceId` owns the voice. The other three named identities are reserved for the street advisers above. Günther Liegestuhl and Walburga Handtuch are separate character-review archetype profiles, not substitutes for those moving actors. The cast audit records each crowd actor's runtime archetype so an agent cannot accidentally clone the sprite's sample for every distinct character.

The inventory names the four current Bürgeramt phone utterances under `kriminalpolizei`. Its user-selected default recordings send `recording` timing receipts and stop on call termination; browser speech remains the load-error fallback. The four earlier Heinrich phone takes remain historical comparisons with `retiredReason` and are excluded from preview lookup. For quiz prompts, `game.js` concatenates a regional approach, category context, and one of 77 regional questions. The nine quiz profiles are saved and identity-bound. The preview broker accepts a three-segment sequence only when all parts exactly match authored text and share that character's `voiceId`; otherwise it speaks the complete prompt through the browser. `assets/voices/quiz-segments/manifest.json` documents the first complete sequence: Brigitte Neumann, Germany approach 8, traffic context, and FS-10. It is a narrow opt-in candidate, not coverage of every quiz prompt or approval for default use. Expand by rendering and independently checking each actor's exact segments, and listen to the complete join, subtitles, identity, and emotional fit before accepting a combination.

The eight existing non-Brigitte approach previews were rendered with Chatterbox. A new Secret Tunnel context or question uses OmniVoice; sharing a UUID and reference WAV does not prove the two engines sound like one speaker. The Music library's `GERMANY-SIMULATOR-QUIZ-APPROACH-REVOICE-8.csv` requests the exact eight approaches from their saved profiles with the current inventory hash, source locator, and old preview hash. For each starter quiz prompt, make a same-renderer approach, context, and question, then listen to the assembled sequence for one coherent character voice before connecting it to the opt-in catalogue. The old previews remain independently attributed review assets.

For source-derived generation queues, run the Music library's `run_scored_voice_queue.py` with `--game-root` set to the current checkout. It checks the frozen request's inventory SHA-256 and the audited cast SHA-256 before starting inference; a changed source requires regenerating and reviewing the queue. Its `--verify-only` mode checks saved MP3 and metadata hashes without starting another take.

Gisela Becker's first Germany/civic/question-24 sequence has three private same-profile OmniVoice takes in the Music library and a joined listening copy under `GermanySimulator Whisper-scored private candidates 2026-10-08/quiz-gisela-becker/private-prompt-review/germany-civic-24/`. Saved per-segment Whisper scores are 100% approach, 95% context, and 100% question; the re-encoded joined copy scores 97% diagnostically. Both context and joined transcripts omit the written legal abbreviation `StAG`. Check its audible presence and pronunciation, speaker continuity, and joins before considering these review files for the game catalogue. The current runtime still uses its previous fallback.

Rüdiger Schmidt's Germany/grammar-B2/G-B2-01 sequence likewise has three private OmniVoice takes and a joined listening copy under `GermanySimulator Whisper-scored private candidates 2026-10-08/quiz-ruediger-schmidt/private-prompt-review/germany-grammar-b2-G-B2-01/`. His context and question scored 100% each. The saved approach scored 83% under the previous hyphen normalizer because Whisper wrote `Dativ-Akkusativ` for scripted `Dativ, Akkusativ`; independent split-word review of the joined copy scored 100%. Preserve the original `wf83` receipt, then listen for all words, the intended angry delivery, and a continuous speaker before catalogue use. `assemble_private_quiz_prompt.py` reproduces private three-segment joins from verified receipts without installing them in the game.

Sabine Krüger's Germany/grammar-B1/G-B1-01 sequence now has three private same-profile OmniVoice takes and a joined listening copy under `GermanySimulator Whisper-scored private candidates 2026-10-08/quiz-sabine-krueger/private-prompt-review/germany-grammar-b1-G-B1-01/`. Her approach and question scored 100% each; context scored 71%, and the joined diagnostic scored 86%. Whisper rendered scripted `StAG` and `B1` as `S.T.G.` and `B.1.`. Listen for the actual legal abbreviation, number, intended demeanor, and speaker continuity before catalogue use.

Uwe Möller's first Germany/civic/question-25 sequence now has three private same-profile takes and a joined listening copy under `GermanySimulator Whisper-scored private candidates 2026-10-08/quiz-uwe-moeller/private-prompt-review/germany-civic-25/`. His approach and question scored 100% each; context scored 89%, and the joined diagnostic scored 94%. Whisper hears `star G` or `St.G` for scripted `StAG`, so listen for the actual legal abbreviation, identity continuity, delivery, and joins. Earlier interrupted attempts remain archived as failure receipts; the verified question MP3 is the current candidate.

Klaus-Dieter Wagner's Germany/traffic/FS-10 sequence also has three private same-profile takes and a joined listening copy under `GermanySimulator Whisper-scored private candidates 2026-10-08/quiz-klaus-dieter-wagner/private-prompt-review/germany-traffic-FS-10/`. Each segment scored 100%; the joined diagnostic scored 95% and transcribed the last question as `Welche Reaktion? Die Reaktion ist angemessen.` Listen for a possible repeated phrase or ASR join error before catalogue use.

Heike Hoffmann's Germany/civic/question-29 sequence has private same-profile approach/context/question takes at 100%/74%/100%, plus a joined listening copy at 89%. The context's Whisper transcript renders scripted `Absatz 4 StAG` as `Abs. 4 S.G.` and `B1` as `B. 1.`; check the actual legal abbreviation and number. Dietmar Schulz's Germany/grammar-C1/G-C1-01 sequence scored 100%/91%/88% per segment and 90% joined. The individual question transcript ends after `korrekt?`, but the joined diagnostic adds `Vielen Dank.`; check whether that phrase is audible, and verify `TestDaF TDN 4` and `Konjunktiv I`. Hartmut Keller's Germany/technik/KL-01 sequence scored 100% on every segment and the joined MP3. Their three private `review.mp3`/`review.json` pairs sit under each speaker's `private-prompt-review/` folder and still require complete listening for speaker continuity, demeanor, joins, and artifacts.

The Music root's `GERMANY-SIMULATOR-PRIVATE-QUIZ-PROMPT-REVIEW.csv` lists all eight joined starter review copies with the exact assembled script beside the encoded-prompt Whisper transcript, segment scores, hashes, current-inventory checks, and pending listening statuses. The frozen `GERMANY-SIMULATOR-QUIZ-NEXT-16-TAKES.csv` and eight-row approach-revoice queue now verify fully without generation. `refresh_voice_coverage.py --game-root <checkout>` verifies and refreshes the review index. A joined review MP3 is a listening aid made from existing private takes, not a new runtime catalogue entry.

The wrong-answer response displays the selected quiz character's name but currently falls back to a shared, user-supplied “Nein! Nein! Nein!” recording. [`VOICE-QUIZ-FEEDBACK-QUEUE.csv`](./VOICE-QUIZ-FEEDBACK-QUEUE.csv) requests that exact text from each of the nine saved quiz profiles. The game checks for a matching character-owned candidate in opt-in preview before using the legacy recording. Review the Whisper words and the actual three-beat delivery, then add accepted takes to the catalog under each character's own `voiceId`; the legacy `quiz-officer` target is historical provenance, not the current quiz speaker identity. Do not label the shared MP3 as any of the nine new voices.

`assets/voices/profile-auditions/` holds one German approach for each of the nine named quiz profiles and one archetype line each for Günther Liegestuhl and Walburga Handtuch. Along with the 223 original exact-line preview candidates, this gives the original 53 nonpolitical profiles at least one catalogued audio sample. The three later static-patron profiles have private audition takes: Konrad's separate audition manifest and Mechthild's and Wolfram's scored `take.json` receipts are in the Music library. Their newly authored game lines match those audition scripts, but the private takes still need rights-cleared replacements and listening review before the game can play a cloned recording. Brigitte Neumann's approach is reused as the first segment of one opt-in quiz prompt; the other eight quiz approaches await matching context and question segments, and the two towel lines are separate exact-text candidates. None of those auditions or candidate takes is approved for default playback without full listening review. The manifest keeps each profile UUID, reference hash, source emotion label, intended valence/arousal, model identity, transcript, and output hash together so new dialogue can reuse the same person rather than borrowing another actor's voice.

1. Assign a stable `voiceId` containing the fixed character's fictional full name, such as `amt-horst-stempelmann`. Keep the existing animation/story key separately. Reuse one profile for that character's lines. Keep the player's inner voice separate from passersby and officers.
2. First complete [the character's valence/arousal assessment](#assess-demeanor-before-choosing-audio), then select clean, single-speaker reference audio from the local library using [the emotion-label rule above](#choose-an-emotional-reference-for-every-new-character), with permission for cloning and the intended game use. Voice Cloner keeps the original and normalized copy privately. Record the exact source URL, license, intended use, and original SHA-256 in `voices`; do not commit another WAV just to duplicate its private copy.
3. In Secret Tunnel Voice Cloner, import the prepared WAV and save a profile named `GS <full name> (<role>)`. Its typed native `create` input includes `name`, base64 WAV `audioBase64`, `extension: "wav"`, the exact `referenceText`, and a `source` note with corpus and component files. Save the returned UUID as `profileId`; verify the saved name and original audio hash with `list`. On another PC, recreate the profile from the same verified source and update the local UUID binding. Only update the verified production binding after the recreated reference hashes match; old installation UUIDs cannot be reused.
4. Render one short German sample with the selected production renderer, exact profile/reference hashes and exact text. Use native `generate` with `voiceId: <profileId>` and `language: "German"` only when the production binding selects that native renderer and its revision can be verified. A Chatterbox binding uses the cached Chatterbox authoring helper; the native app's OmniVoice output cannot substitute for it. Inspect and listen to the whole output for accent, pronunciation, character fit and echoed reference words. A distinct reference establishes a source identity; it does not prove the rendered line sounds right. Record failures without changing the engine, reference or fallback policy. A successful `create` is not a successful `generate`.

## Add a line and connect its trigger

1. Decide speaker owner, trigger family, region, and broker priority first. Berlin character speech follows the Denglisch rule; across the Brandmauer characters speak German regardless of interface language. The visible textbox and spoken source must match exactly. Never cross-select another character's pool.
2. Add one stable clip ID in `AUDIO-TEXT-LIBRARY.js` with `id`, `voiceId` (the voice in the actual file), `trigger`, `source` (exact spoken German or authored Denglisch), `english` (subtitle), and file path. Long recordings need timed `cues` and, where available, `sourceCues`. Use `targetVoiceId` only for a legacy clip awaiting replacement. The derived `clips` index exposes the entry by ID. Do not publish a catalog entry pointing at a missing file.
3. Generate the catalog's exact `source` using its verified production profile, reference, renderer/revision and processing recipe. Cache reuse requires all those fields and the exact text; native output cannot substitute for another selected renderer. Preserve a live inference process while it is making progress; diagnose failures before the one bounded retake. Export privately first and review the whole clip. Check form identifiers, numbers, negation and German-English switches word by word: independent ASR can flag a take, but listening decides what it actually says. A take that changes `A38` to `28` or adds speech after the last scripted word remains private. Require explicit native end-of-generation evidence before trimming; cropping cannot repair a missing or failed EOS. A verified silence trim needs its boundary recorded and independent ASR of the final encoded file. Never change visible text to conceal a misread.
4. Normalize approved MP3s with `tools/normalize-audio.ps1 -Apply`, then verify `-18 LUFS ±0.3 LU` and no peak above `-1.5 dBTP` without `-Apply`. Check duration and a German transcript against `source`. Put approved clips under `assets/voices/`. Set `voiceId` to the generating profile and remove `targetVoiceId` when replacing a legacy file. Record model, engine, date, reference source/hash, duration/hash, and license in `assets/voices/LICENSES.md`. Keep private originals, caches, scratch WAVs, and smoke renders out of Git.
5. In `game.js`, resolve by stable ID with `speechClip("clip-id")`, then pass its `text`, `recording` and actual speaker's `candidateVoiceId` through `speakRecorded` or `showWorldBark`. Use the existing broker's family, priority, eligibility and textbox callbacks. On load failure, follow that production voice's explicit fallback policy: fixed Knick/street speakers keep exact captions; documented browser fallbacks read the same text. English subtitles begin with the admitted delivery and clear on completion or cancellation.
6. Verify the actual trigger in a silent background browser: voice off, subtitles on/off, regional variants, missing-file fallback, textbox lockstep, and owner-specific selection. Run catalog and affected game tests before pushing.

## Boundary

The catalog covers every shipped foreground speech file. Browser speech source lines remain in `game.js`, with English translations and family-to-voice mappings in the catalog; move a line into the clip catalog when it becomes a recorded asset. Background music, songs, sirens, fax sounds, and other nonverbal effects are outside this inventory.


The four current Bürgeramt phone utterances belong to `kriminalpolizei` and play by default from the user-selected `GS Kriminalpolizei` profile. The earlier four Heinrich phone candidates and five former clerk escalation candidates retain archived provenance and are excluded from preview lookup. The historical 236-entry candidate manifest now has 194 active primary lookups; new encoded numeric/compound equivalence is separate from literal ASR. Approved fever speech continues for other exact available lines.


## Browser-local Knick appointment names (2026-10-13)

The user-authorized local model is a scoped exception to the fixed-recording rule for personal appointment calls. On 2026-10-13 the user listened to Erika Mustermann and George Fejer, accepted the derivative as an intercom voice, and explicitly said it does not resemble Frau Knick. This acceptance applies to intercom calls only; it does not replace her character voice. Existing Knick dialogue, profile selection and recorded-clip lookup retain their current authority. The selected voice remains `amt-brunhilde-knick`, profile `b080c7d95ecd418fb428282461d7fbe7`, normalized reference SHA-256 `901e9ad60eda5cbb36337b12864b6a2b0d133570acb90941b9eabd9888c16351`. A matching label/hash establishes training provenance, not perceptual identity.

Capture the name at its first available source. The opening humor form has an optional typed name; valid input begins deferred preparation and clearing it cancels obsolete warm work. Skipping that field/form leaves the companion's name entry as the source. Prefill only the first companion, preserve text already entered there, and retain its Submit gesture for audio/wake-lock admission. Independent visitors keep independent names and tickets.

`knick-speech.js` owns one serial worker, at most twelve pending jobs and eight completed WAVs. An opening name warms four counter variants; an actual reservation takes priority. Tickets retain status metadata, with at most one committed announcement retaining another clip. Hidden pages stop the worker, voice-off cancels preparation, five idle seconds release inference memory, and episode exit/replay clears transient audio. Names and generated WAVs stay in browser memory. The page retains one compressed public model in RAM across idle worker restarts, validating encoded and decoded hashes before inference. Model fetch uses no-store; no Cache Storage, IndexedDB, download/save action or File System API is used for speech. Exit/replay/pagehide releases this buffer. Ordinary browser-managed caches for existing web assets remain browser-owned.

The CPU/WASM graph is single-speaker Piper VITS with per-channel INT8 *stored* weights, expanded to floating-point inference. This is neither Chatterbox running in the browser nor generic browser speech. Training uses verified selected-profile dry Chatterbox deliveries; original/reference, source audio, pretrained checkpoint, actual training checkpoint, phonemizer and export hashes belong in the model manifest/receipt. The phonemizer used for training must be the exact shipped WASM version: native eSpeak versions differ in German phonemes. Each WASM CLI invocation gets a fresh module because its parser retains state. Training inputs, caches and large checkpoints stay outside the repository; only the accepted graph, small runtime and provenance ship under `assets/`.

Reproduction uses `tools/train-knick-browser-voice.py prepare`, `tools/prepare-knick-browser-ids.cjs`, the pinned Piper 1.8.0 training environment, Piper's ONNX exporter, then `tools/export-knick-browser-voice.py`. The public tools do not install runtimes or download weights automatically. Native waveform probes use the shipped phonemizer through `tools/check-knick-browser-model.py`. Record actual optimizer rates: the pinned wheel's manual optimization does not advance its scheduler. Fresh-optimizer experiments and frozen/restored pronunciation layers must be identified separately from whole-network fine-tuning; validation reconstruction loss alone cannot establish intelligible text-driven inference.

Generate each name once, using the full sentence priors and flow for pronunciation but limiting the vocoder to the name plus sixteen right-context frames. Crop that context from the final waveform. Four fixed counter tails are prepared offline from the same derivative, bound by PCM format, sample rate, counter, profile/reference and file hashes. The worker constructs four complete WAVs from that one name, and the manager resolves same-name jobs together. It retains eight complete calls without retaining nested variant bundles. Seven native prefix comparisons, including a short name, internal comma and long input, differed from complete-sentence decoding by at most 1.85e-6 per sample. The 277,168-byte tail bundle keeps the fixed words out of runtime synthesis.

Acceptance requires independent, unprompted transcription of held-out names and the complete spoken call, actual browser inference/playback/caption ownership, bounded cache/failure/replay tests, and comparable browser responsiveness evidence. Keep perceptual listening and physical Android status explicit; silent state checks and provenance hashes cannot establish either. Do not publish a candidate that fails intelligibility. The fixed-voice curator remains required.

Held-out proper names still produce some native ASR mismatches. Keep exact visible names and expose no claim of universal pronunciation. When a named lease is unavailable with voices enabled, the intercom plays its accepted recorded “Nächste bitte!” with matching text at the allocated counter. Voice-off retains the personalized caption. The user’s intercom acceptance does not establish physical-phone performance. Kripo name synthesis uses a separate selected-profile derivative; neither an intercom model nor a generic browser voice establishes its caller identity.

## Browser-local Kripo greeting names (2026-10-13)

The user accepted both native OpenVoice teacher samples, then listened to the actual browser-generated compact George Fejer greeting and approved it as “good enough”. This scoped caller-name derivative retains selected kriminalpolizei UUID f700170f840543bca7413d3ccf6ac028 and its original/reference hashes; it does not change the fixed conversation recordings or their production renderer. The manifest and MODEL_CARD under assets/voices/kriminalpolizei/browser own the binding, teacher, frozen-state, checkpoint, encoded/decoded and listening-sample hashes. Proper-name ASR limitations remain explicit.

The final player-directed demand now begins with the accepted appointment name,
reusing the same name-only PCM produced for the opening greeting. One inference
returns the complete greeting and a separately hashed name WAV under its same
name/profile/reference receipt; both belong to one existing cache entry and
remain in RAM. The brief final prefix admits at most five native seconds, so the
unchanged 14.36-second demand fits the existing final-turn deadline even at
0.5 office tempo. Longer, missing, mismatched or failed prefixes use the complete
fixed demand. One cue owns name plus demand; only natural completion of both
permits the call ending. A failed prefix after onset can update the existing
caption receipt from `voice` to `recording` once, preserving its original clock.
No additional model, download, voice profile, inference pass or saved name file
is introduced. This extension is user-requested; listening remains unperformed.

The same lazy RAM-only manager/worker has two explicit voice modes. The host uses the intercom; the companion selects `kriminalpolizei` with its script data attribute. Cross-mode profile/reference receipts are rejected. The companion prepares at the first usable name: supplied opening-form prefill, deferred typing/change, or submission. It keeps one complete greeting per name and runs one name-only neural pass. Two fixed greeting parts total 139,864 bytes. The 16.03 MB student is distilled from 187 OpenVoice-converted German base examples; 507 pronunciation/flow tensors remain byte-identical to the base. The larger teacher/converter stays in private authoring and is never loaded on clients. Unsupported WASM SIMD or missing required APIs fail before any model/runtime transfer.

The first valid name also warms the six selected fixed call recordings in native media buffers, capped at eight and without playback. Answer starts a ready, exact-text/profile-bound Blob recording synchronously. Its completion releases the lease and begins the accepted fixed opening body; one index-1 cue owns the composite and its completion. An unavailable or unready greeting immediately selects the complete original introduction and question. A pre-onset named failure selects that backup too; a failed cropped body gets one bounded full-opening retry. The host caption follows `voice` receipts for the named opening and `recording` receipts for the complete original opening. If the backup starts after a named onset, one bounded `voice`→`recording` start update refreshes the caption and English translation; it preserves the original cue clock, deadline and single completion. Both paths finish before Knick's first interruption. Answer never waits for model work or uses generic browser speech for this greeting. Call-owned static spans clip transitions; office tempo, cutoff, clunk/tone, warning and ending receipts retain their authority. Slot completion/pagehide releases media, caches and model buffers; visibility suspends preparation. A missing recording retains the bounded readable fallback and continuous static. Network loss, muted output or OS suspension cannot guarantee audible speech.
