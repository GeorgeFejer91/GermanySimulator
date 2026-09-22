# Durable decisions

## 2026-09-22 — Stable whole-pose sprites in game; rigged sprites preview-only

The canonical root game temporarily loads all six complete-character atlases
from `assets/sprite-archive/pre-rig-20260921/assets/`. These are the last signed,
accepted pre-rig sprites and are preferred over the uncanny articulated set for
shipping reliability. Merkel's archived sheet uses its native 24-column clock;
the other five use 32 columns. No sprite generation was deleted or overwritten.

The current biomechanical atlases, part sheets, audit, verification ledger, and
builder remain the active experiment in `assets/`, `assets/sprite-sources/`,
the For-AI protocol, and `sprite-preview.html`. They must not be restored to the
root game until a new visual review explicitly accepts them. This supersedes
the same-day biomechanical runtime decision below only for the shipping loader.

Close-range audio now has a dedicated `NEARBY` broker tier below critical
modal/direct speech and above featured, reactive, and ambient speech. Merkel,
Merz, the Bayern-Beauftragter, and Alice continuously queue owner-locked lines
inside 176 units. DB recordings use the same tier and continuous queue inside
360 units; between 360 and 820 units they remain cooldown-governed ambient
audio. Active speech is never interrupted. Merkel reverses her route after
sustained obstruction, while Merz reverses and swaps lane; this complements
the existing shared sidestep/backoff and Bayern/Alice recovery behavior.

## 2026-09-22 — Shared biomechanical rig supersedes pose holds

All six atlas-backed characters now ship from `biomechanical-rig-v3`. This
decision supersedes the same-day original-pose identity hold below while
preserving that decision and both archives as recoverable history. Accepted
identity-matched three-view part sheets are the layered source authority;
archived original generated pose sheets remain signed identity references.
There is still only one runtime tree under root `assets/`.

One eight-phase coefficient lane defines contact, loading, passing, and
push-off for alternating legs. Side rows use fixed-length two-bone IK;
front/back rows solve the gait in depth and use a compressed, minimum-readable
orthographic projection. Heads and torsos are rigid layers on a fixed
512-pixel root/ground grid. Both legs render behind the pelvis plate, joint
sockets are cleaned/capped, and props use independent anchors. The builder
emits eight 256-pixel review phases and 32 distinct direct 128-pixel samples
per walking row without whole-image morphing or per-frame recentering.

Runtime phase is proportional to actual ground distance. Collisions and pauses
therefore stop the feet; Alice's 1.5× speed completes the same stride faster
rather than changing its anatomy. The signed release gate binds part, key,
runtime, identity-reference, and pose-audit hashes. It rejects incorrect
stance ownership, foot lift/sliding, backward stepping, missing passing
crossovers, collapsed projections, unstable roots/heads, unsafe alpha margins,
repeated walk cells, and discontinuous loop seams, then requires human review
of joint overlays on every final cell.

## 2026-09-22 — Runtime smoothness and shared sprite textures

The simulation still updates on every animation frame, but routine HUD projection
is capped at 10 Hz; explicit gameplay events continue to refresh the HUD
immediately. This removes repeated DOM reconstruction from the hot path without
making rounded energy, time, wanted, or cooldown values feel delayed.

Three.js uploads each biomechanically baked character atlas once per character kind.
The individual camera-facing planes share that texture and material, while their
small geometry UVs select the current row and frame. Procedural player and police
limbs advance from actual distance travelled and settle to neutral while idle,
instead of cycling from wall-clock time. Losing browser focus or hiding the page
clears held keyboard state so returning to the tab cannot continue an abandoned
movement input. No animation, physics, UI, or input dependency is added.

## 2026-09-22 — Original-pose identity lock supersedes cutout rigs

The original complete image-generated key atlases are again the production
identity authority for Merkel, Merz, the Bayern-Beauftragter, Alice, and both
towel pedestrians. This decision supersedes the 2026-09-21 direct cutout-rig,
motion-compensated transition, and direction-signed IK authorities below. Those
records remain as history and their assets remain recoverable, but neither the
part sheets nor `build-rigged-sprite-atlas.py` may produce shipping sprites.

`tools/build-identity-locked-sprite-atlas.py` exposes each original key on a
32-cell runtime clock using balanced whole-pose holds and premultiplied-alpha
downscaling. It does not cross-fade, optical-flow, reconstruct, individually
translate, or recenter characters. `identity-audit.json` maps and hashes every
final cell to one source key; the signed verification ledger binds the source,
runtime, mapping, direction contract, and contact-sheet review. The gate also
checks head/top, ground, horizontal-root, scale, and lower-limb/opposite-phase
thresholds. Merkel retains her original six columns; the other characters
retain eight. Merz's full authored head is present in every cell. The rejected
cutout-rig atlases are archived under
`assets/sprite-archive/pre-identity-lock-20260922/` and never loaded at runtime.

The implementation follows the established Einhornsammler runtime discipline:
fixed cells, a fixed ground offset, immutable visual endpoints, directionally
meaningful rows or whole-cell mirroring, and full contact-sheet inspection of
the exact delivered atlas. Germany Simulator adds per-cell cryptographic
identity proof. This favors stable eight-pose walking over synthetic high-frame
counts that change faces, clothes, props, or anatomy.

## 2026-09-22 — Limb interpolation uses anatomical coefficients

The Affect Tracker's matrix pattern may be reused for future walking rigs, but
only in parameter space. Direction-specific gait lanes select an ordered route
through contact, down, passing, and up anchors; interpolation operates on a
named vector of root, pelvis, joint, hand/prop, planted-foot, and depth-order
values. It never crossfades complete character bitmaps. Planted feet are solved
as positional constraints, joint rotations use eased shortest-angle paths, and
limb depth swaps remain discrete events at declared crossing phases.

The current identity-locked sprite set stays on complete authored poses until
each character has an identity-matched layered rig whose key-phase renders
match the approved source poses one-to-one. A future 32-cell coefficient cache
must pass the same grid, alpha, scale, head, ground, direction, anatomy, and
visual-contact-sheet gates before replacing any current atlas.

## 2026-09-22 — Continuous close-radius featured speech (superseded priority)

Merkel, Merz, the Bayern-Beauftragter, and Alice use a 176-unit audible radius
and originally used the featured broker priority. The current `NEARBY` tier is
defined by the later rollback decision above. Once admitted, each completed line
queues the next item from that same owner's shuffled no-repeat pool after the
broker's 250 ms required gap for as long as the player remains inside the
audible radius. The former cooldowns, 42-percent follow-up chance, and two-line
burst limit no longer apply. The 224-unit release ring only resets entry state;
it is not audible eligibility. Critical modal/direct speech still ranks above
nearby speech and active audio is never interrupted. The post-form Berlin
welcome/mission briefing remains a critical spoken dialogue and is also used by
the secret Start skip path.

## 2026-09-21 — Direction-signed gait and final-atlas visual gate

Every directional rig row uses screen-space travel semantics: right is positive
x, left is negative x, front/down is positive y, and back/up is negative y.
During stance the planted ankle travels opposite that sign as the torso passes
over it; during swing the lifted ankle advances with it. Front/back rows add a
signed depth arc and cross only the airborne leg through the midpoint. The
contact lead swaps at frame 16. The shared rig root and ground registration stay
fixed for all 32 frames; silhouette-based per-frame centering or scaling is
forbidden because moving limbs and props would shake the character.

The builder emits `assets/sprite-sources/rigs/pose-audit.json` with one root,
hip, knee, ankle, stance/swing, view, axis, and sign record for every final
atlas cell. The release gate independently checks direction and phase rules,
confirms every audited joint lands on opaque final-atlas pixels, preserves each
authored key exactly, and can render all-frame skeleton overlays for visual
review. Vertical arcs additionally reject inverted joint order, collapsed knees,
excessive knee bow, and ankle-side inversion; lift is bounded by each rig's calf
length. A right-facing row mirrored by the runtime is checked and rendered as a
separate left arc. The signed ledger binds the parts, keys, runtime atlases, and
pose audit by hash. No runtime rigging dependency or second asset path is
introduced.

## 2026-09-21 — Category-bound quiz dossiers and original language drills

Roaming quiz encounters use one static data authority, `For-AI/QUIZ-CHARACTER-DICTIONARY.js`, to bind nine fictional names and satirical roles to nine local 512 × 512 WebP dossier portraits and eligible question categories. The ninth identity is Hartmut Keller, a para-polizeilicher Nachbar whose alleged authority is explicitly private and invented. Portrait identity never randomizes independently from its name. The cast shares one raw psychological-expressionist RPG treatment with broken paint planes, mature asymmetrical faces, restrained eyes, straighter noses, and emotionally contained bureaucratic expressions. A shared clear gray-beige dossier field replaces scenic city backgrounds; every complete head keeps generous top clearance, and glossy 3D-animation rendering remains excluded. The modal keeps the dossier in a fixed left column on desktop and stacks it above the question on mobile; a missing portrait falls back to a § placeholder without blocking the encounter. The generated portrait set totals about 0.23 MB and is shared across viewport sizes, so no loader service, separate mobile variant, or generalized asset registry is introduced.

The mixed deck retains 35 sourced BAMF civic tasks and 10 conspicuously fictional driving tasks, then adds 28 original multiple-choice grammar drills: 10 at B1, 10 at B2, and 8 at C1. These are certificate-style game exercises rather than copied Goethe, telc, TestDaF, or other real exam items. Each grammar card is labeled accordingly. Category context is visible and spoken through the existing serialized audio-text path, follows the Berlin-Denglisch/Germany-only rule, and has an authored English subtitle. Real information is deliberately narrow: StAG § 10(4) generally points to B1 for naturalization; B2 requirements are context-specific; TestDaF TDN 4 in all sections generally establishes unrestricted university admission; CEFR has A1, A2, B1, B2, C1, and C2, not B3. The game remains satire and not legal, immigration, education, or admissions advice.

## 2026-09-21 — Broker-owned optional English subtitles

English subtitles remain off by default and are controlled by one unobtrusive persistent toggle. The existing stimulus broker owns their lifecycle: a recorded cue starts with its `AudioBufferSourceNode`, long cues continuously select against the Web Audio clock, a synthesized cue starts only from `SpeechSynthesisUtterance.onstart`, and broker completion or cancellation clears it. `For-AI/AUDIO-TEXT-LIBRARY.js` is both the runtime and durable transcript/translation authority. Its train entries retain Whisper-derived segment timings; shorter recorded and synthesized lines use the exact audio-text event duration. Background music and non-verbal effects are excluded. The bottom strip uses the established legible `Grenze` face with a black, red, and gold treatment, and moves above the touch dock on phones so input remains unobstructed.

## 2026-09-21 — Two towel pedestrians and bounded attention

Ordinary pedestrians use only the two accepted towel-reservation figures in `SATIRE-DICTIONARY.md`; the other six experimental archetypes and their assets are removed. Personal names rotate independently, so the gag targets textile territorialism rather than identity. Both towel figures retain the registered eight-key side/down/up contract with 32 runtime frames per direction and radius-triggered regional speech, preserving Berlin Denglisch and German-only dialogue outside the Brandmauer. They are pass-through relative to the player and one another, keeping crowded sidewalks conversational without forming hard navigation traps. A quiz pedestrian follows for at most eight seconds or until the player is more than 650 world units away, then loses interest and resumes its route.

## Decision: sprite commits require signed visual anatomy approval

`tools/verify-sprite-animation.py` is the release and pre-commit authority for moving bitmap characters. It combines deterministic grid, alpha, top/head, ground, horizontal-root, scale, lower-limb, opposite-phase, direction, and exact source-frame identity checks with `assets/sprite-sources/verification.json`, whose source/runtime/audit hashes bind a full-resolution visual review to exact pixels. A checksum mismatch is a rejection, not an automatic re-sign. The reviewer must inspect the authored keys and every final contact sheet, repair the source rather than the renderer, rebuild, and only then record new hashes. Production animation schedules complete approved poses; layered experiments and generated or motion-compensated in-betweens do not ship.

## 2026-09-19 — Canonical game identity

The canonical game is the pseudo-3D “Grand Theft Amt” version originally deployed at `https://ec-games.space/games/germany-simulator/`. The later flat 2D prototype is not the product direction.

## 2026-09-19 — Standalone root URL

The standalone GitHub Pages deployment serves the game directly from repository root at `https://georgefejer91.github.io/GermanySimulator/`. The former nested `public/games/germany-simulator/` runtime copy was removed to keep the public URL short and avoid duplicate authority.

## 2026-09-19 — Static-first and YAGNI

The browser game remains static-first. Backend and asset-infrastructure additions require a concrete need. `$ponytail` is the preferred skill for those decisions when installed; the repository’s explicit YAGNI checklist is the fallback.

## 2026-09-19 — Asset fidelity split

Desktop may use high-resolution Weimar-era-inspired billboard art. Mobile uses minimalist lightweight fax signage. Gameplay placement, copy, and interactions stay shared; only representation varies.

## 2026-09-19 — Affectionate bureaucratic satire and dialogue voice

The game’s satire is rooted in love for German culture and German self-irony. Its comic target is the friction of everyday bureaucracy and social interaction, exaggerated into a world where characters cite rules instead of naming their real concern, insist that their interpretation is the only valid one, and reconsider only when confronted by a lawyer, supervisor, office, or other accepted authority. Fax machines, printed documents, stamps, signatures, appointments, circular procedures, and strange German sayings are core motifs. The marked in-game region controls delivery: Berlin uses deliberately awkward Denglisch versions of the sayings, while the Germany side uses fully German dialogue. This voice applies to all dialogue while remaining fictional and avoiding the claim that all German people or real institutions behave this way.

## 2026-09-19 — Progressive WebGL world with 2.5D fallback (superseded 2026-09-21)

`game.js` remains the sole owner of gameplay state, movement, collisions, missions, and interactions. It exposes a small read-only rendering bridge consumed by `world3d.js`. When Three.js is available, the root game projects that state into the WebGL world and loads a bounded set of local CC0 building meshes; if Three.js or the model loader fails, the existing canvas renderer and procedural buildings remain playable. The renderer fades only a building lying between the camera and player, keeping the character legible without flattening the whole city. The standalone `3d.html` route remains a renderer-focused diagnostic surface, not a second gameplay authority.

## 2026-09-21 — Required 3D renderer and road-safe tree authority

The canonical root game now has one presentation path: `game.js` owns simulation state and `world3d.js` renders it through required Three.js/WebGL. The former Canvas world is retired, is never called as a loader or WebGL fallback, and its SVG world-art pool is no longer preloaded. A renderer failure produces a blocking retry notice. Local GLBs remain first choice; failure of one individual model may use a code-native 3D stand-in without changing gameplay. Registered PNG character atlases remain the deliberate bitmap exception and are mapped onto Three.js sprites from one staging canvas.

Tree placement moved out of renderer-local coordinates into canonical world data. Every tree receives the same 560-unit rail-gutter offset as the city, maintains a 48-unit minimum road clearance, is exposed to both the root renderer and `3d.html`, and participates in ground collision. The layout test evaluates every tree against every expanded road rectangle so a future road or placement edit cannot silently put foliage back into traffic.

## 2026-09-19 — Crossable regional Brandmauer

Berlin lies behind the **Brandmauer**, and Berlin character dialogue is Denglisch. Deutschland character dialogue is German-only, regardless of the selected interface language. The fictional male Brandmauer patrolman is the exception: his two statements stay pure German everywhere and prefer a German masculine synthesized voice. Browser-generated speech speaks the exact authored line and remains a first-class, user-toggleable presentation feature. The Brandmauer is a salient, fully crossable wall of semi-transparent procedural flames rather than physical collision geometry. `game.js` owns deterministic semantic fire sources; Canvas and Three.js own their respective flame, ember, and smoke presentation. Player-facing copy must call it the Brandmauer, never the Flammengrenze.

## 2026-09-19 — Doubled world area and rule-enforcement density

The canonical world is 9,600 × 4,000 world units, twice the former playable area, with the established western mission district preserved and a populated eastern expansion added. Street intersections own explicit zebra-crossing geometry and signs. Repeated traffic, movement, grass, audit, and police-evasion violations can escalate wanted stars to five; pedestrian complaints reinforce crossing rules before police escalation.

## 2026-09-19 — Keyboard and touch only

Device-orientation movement, motion permission, calibration, and recenter controls are intentionally removed. Desktop uses keyboard input; phones use the persistent directional dock and E action. The single start button enters the game directly without requesting sensor access.

## 2026-09-19 — Adjacent power-plant landmark

The southern Berlin-side energy district deliberately contrasts a closed nuclear power plant with a fully operating coal plant immediately beside it. `game.js` owns the shared landmark footprint and collision; the canvas fallback draws deterministic procedural silhouettes, while `world3d.js` progressively adds a bounded local CC0 GLB subset and keeps procedural fallbacks for every imported component. The nuclear plant stays silent behind sealed red barriers and an unmistakable closure mark. The coal plant has an open gate, lit windows, a moving conveyor, and the district's only animated power-station smoke. A user-supplied satirical Merkel sprite follows a fixed safe loop around both sites, cycles short sourced quotations about Fukushima and the 2011 Atomausstieg (plus “Wir schaffen das”), and has a directional behind-the-character reaction. Asset provenance, AI-generation disclosure, and checksums live beside the models in `assets/models/power-plants/LICENSES.md`; the user-supplied sprite provenance note and dialogue sources live in `CREDITS.md`.

## 2026-09-20 — Scarce legal walking space and default NPC complaints

Level design makes forbidden surfaces more abundant than legal pedestrian space: grass and landscaped ground are off-limits by default, as are roads and other vehicle surfaces. Every traversable area must nevertheless retain a continuous, deliberately narrow sidewalk, marked crossing, or pedestrian path so the player is never forced to break a movement rule to make progress. The narrow route supports an intentional no-win social-pressure joke: nearby NPCs default to complaining that a legally walking player is in their way, then switch to complaining about walking on grass or in the street when the player moves aside. This contradiction is a fictional ambient-comedy rule, not permission to remove the legal route or make progression depend on unavoidable enforcement.

## 2026-09-20 — Immediate GitHub Pages publication

Completed repository changes are validated, committed, and pushed to `origin/main` immediately unless the user explicitly asks to hold them locally. The existing `.github/workflows/pages.yml` push trigger is the sole deployment path and publishes the repository root to GitHub Pages. Publication must remain a normal fast-forward push: never force-push, expose secrets or tool caches, or knowingly deploy a failing build.

## 2026-09-20 — Spoken audio and textbox lockstep

Every recorded or synthesized character line is one presentation event with its textbox. The speech queue reveals the exact matching text only when playback begins and keeps it visible through the end of that audio; later queued lines cannot replace it early. Opening a modal dialogue cancels any active or queued bark speech before the modal displays and voices its own exact line. Music and non-verbal effects remain independent.

## 2026-09-20 — Dense obstructive pedestrians and timed surface enforcement

Ordinary pedestrians densely occupy the narrow sidewalk network and automatically complain when the player enters an 82-unit personal-space radius. The later towel-only decision supersedes solid crowd collision: ordinary crowd sprites are pass-through relative to the player and one another, while featured characters and response actors remain solid. Building setbacks are visibly divided into forbidden grass with narrow legal door paths. Staying continuously on ordinary grass or a roadway outside a zebra crossing for more than 2.6 seconds adds one wanted star; leaving the surface resets that timer. The protected police garden retains its faster, stronger response.

Pedestrian speech primarily uses the browser's installed German voices, assigned consistently across speakers and pitch/rate variants. A tiny on-demand subset of exact-text angry and sleepy clips from the CC0 Thorsten-Voice 2021.06 Emotional dataset supplements German-side sidewalk complaints with randomly selected negative or weary remarks. The same bounded source supplies player-owned point reactions: amused `Endlich wieder Nachschub!` for a Germanness gain and disgusted `Mist, wieder nichts geschafft.` for a loss. `assets/voices/LICENSES.md` is the durable provenance and checksum record. The game interprets the source's categorical angry and disgusted styles as negative-valence material and sleepy as low-arousal material, but does not claim that the source contains continuous valence/arousal scores. Berlin-side pedestrians remain Denglisch and therefore use exact authored browser speech rather than the German-only recordings.

## 2026-09-20 — Germanness, Extra Wurst, and § diversion

`game.js` owns one 0–15 Germanness value. Explicit lawful actions—Pfand collection, a first-time regional-sausage find, a complete zebra-crossing traversal, and waiting at a red pedestrian Ampel—raise it by one. Correct roaming citizenship-test answers also add one, while wrong answers subtract one without crossing below zero. Renderers only project traffic-light, pickup, badge, and meter state.

Nine unique procedural sausage pickups share one data table across Canvas and WebGL. A first find permanently fills the corresponding 3×3 Wurstsammlerpass slot with an actual sausage photograph, announces `Extra Wurst! Unlocked …`, restores energy, and grants one Germanness point. The same table supplies a brief non-blocking collection card with that photograph, visible creator/license credit, and a researched two-sentence history. Nine optimized local Creative Commons WebPs form a deliberately bounded 0.31 MB UI-only set with attribution and checksums in `assets/wurst/LICENSES.md`; no generalized asset registry is needed, and world rendering remains procedural.

At 9 points, Germanness permanently unlocks a cooldown-bound physical `§` key, `Q` fallback, and touch button. The player receives an explicit activation prompt. Every power quotation is real, current federal statutory wording verified against the Federal Ministry of Justice's `gesetze-im-internet.de`; the pool deliberately favors obscure or linguistically dense provisions. The power consumes a shuffled non-repeating law deck so consecutive uses always expose a new quotation until the deck has rotated. The quote occupies a shallow top-of-screen strip rather than covering the arrest. Activation clears the player's wanted state and redirects police toward a disposable crowd NPC rather than a mission character. The police first catch the NPC, then visibly escort them to the station garden before removing them into the Spiel-Knast.

All 13 §-power excerpts have exact-text local recordings voice-cloned with XTTS-v2 from only the credited CC0 Thorsten angry and disgusted clips. The fixed law-deck index is also the recording index, keeping text and audio ownership deterministic. Playback uses the shared serialized speech queue, holds the quote strip visible for the recording, respects the voice toggle, and falls back to the exact same text through the browser's German voice if an MP3 cannot load. The generation model remains an offline tool and is not shipped with the static game.

The 11 rotating `REGEL DES AUGENBLICKS` cards use a second deterministic index-to-recording mapping from the same negative-valence references. Each card's complete body is read when it first becomes active and on every rotation; fictional shorthand such as `QuerO` stays visual because it is not stable voice-model input. The rotation interval is 14 seconds so the longest local reading can finish while its matching card remains visible. These readings share the serialized queue, voice toggle, and body-text browser-speech fallback.

The unlock forces the already-authored locally synthesized national-anthem arrangement to the front of the music queue while preserving the music-off preference. The soundtrack starts with the opening forms and schedules the next weighted-random German melody just before the current arrangement ends, excluding an immediate repeat. Ceremonial, anthem, hymn, and march-like catalog entries receive most of the selection weight while every track remains eligible. Music is lowered an octave and softened with triangle/sine oscillators, restrained percussion, a 1.6 kHz low-pass stage, and a reduced master bus that ducks further during the official spoken form readout. The HUD remains a compact edge gauge whose fill changes from gray toward saturated Schwarz-Rot-Gold as Germanness rises and reaches the undimmed flag at 15/15. Every real increase retriggers a sub-second black-red-gold viewport-edge flash; reduced-motion mode uses the same short-lived edge state without flashing.

Phone HUD composition favors the visible playfield over persistent paperwork. Germanness is a thin horizontal rail beneath the touch dock rather than a separate playfield card; it retains the value, law-power state, and collapsed Wurst count while the badge thumbnails stay hidden. The title, wanted stars, mission, stats, and transient bark keep reduced footprints. Region still controls language and border events but no longer owns a persistent card, and the previous minimap is removed on every viewport.

Randomly timed encounters use ordinary crowd NPCs and pause the simulation only once the selected pedestrian reaches the player. Each encounter displays a region-appropriate intrusive remark followed by one shuffled four-choice question. The expanded remark pool centers passive-aggressive mock compliments about the player's supposedly inadequate German, accent, grammar, or integration. The question deck mixes lightly adapted items from the official BAMF `Gesamtfragenkatalog`, dated 7 May 2025, with original fictional Fahrschule-style questions. Official task numbers remain visible on BAMF items; the driving questions are explicitly labeled `FIKTIVE SPIELFRAGE` so they cannot be mistaken for real test or road-safety guidance. The civic pool excludes questions about rights, antisemitism, National Socialism, and historical responsibility so those topics do not become the target of the joke.

Wrong answers trigger a three-beat `Nein! Nein! Nein!` through the existing browser speech system, with matching on-screen text and the user's voice preference respected. No film audio is bundled: the requested *Der Untergang* extract has no verified reusable license and would conflict with the repository's local, attributable asset policy.

## 2026-09-20 — Political-character quote ownership

The satirical figure trying to extinguish the Brandmauer is Friedrich Merz; the energy-district figure is Angela Merkel. Each NPC declares its political identity and all ambient and interaction dialogue resolves through that identity's dedicated quote pool. Merz and Merkel lines must never be pooled, shared, or selected for the other figure, and speaker labels, textboxes, and synthesized or recorded voices must retain the same owner.

## 2026-09-20 — Pre-play humor certification

The Start button leads into a two-page satirical `HUM-01/DE` humor-competence declaration before the simulation begins. The form condenses the user-supplied conceptual material into a definition of humor on sheet one and satire, non-literal devices, context, and the final declaration on sheet two. Its visual language is an aged German-office printout from an invented humor authority, without imitating a real agency seal, and all form copy uses the readable Roman/blackletter hybrid `Grenze` family in either language, with a plain serif fallback instead of Old English or Gothic lettering. Neither automatic browser-generated reading gates submission: completed fields, stamp steps, and the page's drawn signature are sufficient. An early submit cancels the readout and immediately starts both the fax feed and a non-blocking visible/spoken `Ey, haben Sie überhaupt das Kleingedruckte gelesen, Dummkopf?` reprimand (or its exact English-session counterpart). The next sheet or playable world appears when the fax animation ends even if the reprimand is still speaking; the next sheet's own reading waits in the speech queue without preventing any form interaction. A fully completed reading skips the reprimand. The form exposes no replay control. Every valid sheet submission plays the locally bundled user-linked fax-machine recording, with the synthesized fax/printer noise retained only as a load-failure fallback, and feeds the visible paper downward through a mechanical slot; reduced-motion users receive a short feed-and-fade instead of the full judder. Exactly two signatures are required across the sequence, entered with mouse, trackpad, stylus, or touch and retained only in the live canvas until that sheet is submitted. German copy uses native circumscriptions rather than imported labels such as “Deadpan.” Clicking the title screen's original English button is the sole session-memory gate for English form text and English speech; clicking any Deutsch button has no effect on that gate. The visible joke still converts the English choice into another `Deutsch` button and gives no confirmation that the preference was registered. This is an intentionally impractical satirical gate, explicitly not a real contract, legal test, or legal advice, and it must not create a separate runtime or gameplay authority.

## 2026-09-20 — One-time recorded intro before synthesized music

The soundtrack preloads and attempts to start the user-supplied `assets/intro-song.mp3` immediately on page entry, with the first 24 seconds removed in the shipped file. If browser autoplay policy blocks it, native audio retries from the beginning on the first click or key press. That recording plays once only, mirrors the music duck and mute state, and then hands off to the weighted Web Audio German-song catalog. A missing or undecodable intro skips directly to that catalog. The local source and shipped checksums remain recorded in `CREDITS.md`, without an unsupported redistribution-license claim.

## 2026-09-20 — Rounded perimeter rail loops, queues, and sourced rail satire

The eight trains share two continuous rounded-rectangle tracks around a slightly expanded 9,840 × 4,240 world rather than eight intersecting edge segments. `game.js` is the sole authority for loop geometry, every train center and car transform, bidirectional movement, distinct speed and acceleration constants, unexplained pauses, train contact, player obstruction, hard same-lane spacing, proximity hysteresis, and announcement cooldown. Four trains on one loop begin in alternating directions. On contact the pair clamps to the minimum bumper gap, performs a short visible bump, stops for 0.72 seconds, and then reverses. A fixed visual orientation decoupled from movement direction preserves the physical car order during reversal, while a brief collision cooldown prevents immediate retriggering. The consists therefore redistribute continuously but never overlap, pass, split, or teleport. Each logical train is a full-length seven-car consist whose 260-unit fixed offsets and short visible gangways keep the cars connected; all seven car transforms still sample the loop independently so the consist articulates through a corner. Oriented coach-body collision makes the new long cars solid without adding a physics dependency. Canvas and Three.js only render that shared semantic state; `3d.html` mirrors the same car/curve and bump protocol for diagnostics and remains non-canonical. This deliberately small one-dimensional traffic model remains the movement authority.

Five middle cars now use DennisAkaTECHNO's German n-Wagen coach from Open L-Gauge under CC BY-NC-SA 4.0, with complete LDraw attribution and conversion provenance beside the local GLB. Kenney end cars and a dimension-matched procedural fallback preserve the existing fictional consist silhouette. This noncommercial asset decision adds no runtime dependency: all three sources load once and clone locally. Any future commercial distribution must replace or separately relicense the n-Wagen asset.

The rolling stock remains branded only as fictional `AMT-BAHN`. No Deutsche Bahn or Märklin logo, protected livery detail, station recording, or clone of a real employee or announcer voice is shipped. Nearby passes use a deliberately slow, flat installed German browser voice to read the exact visible text. Each multi-sentence announcement prefers the nearest train's live condition—unexplained stop, train-on-train bump and reversal, stopped traffic, or player obstruction. The delay library combines generic operational wording with original satirical rewrites of passenger anecdotes from Reddit and rail forums. Those stories are unverified user reports, always labeled `COMMUNITY-ANEKDOTE · FIKTIONALISIERT`, and never asserted as DB fact. Reports involving children in the track are treated as genuine safety hazards; the satire is confined to officious apology wording rather than the closure itself.

Standing on a loop ahead of an approaching train is now an intentional interaction: the train brakes independently of the contact-and-reversal protocol, and a sustained obstruction rotates through short exact excerpts from current EBO § 62(2), § 63(2), and § 64 before a long state-aware service announcement blames the resulting stop in elaborate administrative language. The speaker says `AMTLICHER SPIELHINWEIS`, and the copy avoids declaring that the player committed a crime. § 315 StGB is intentionally excluded from the interaction because its dangerous-interference offence also requires a concrete danger to life or significant property. The legal snippets are gameplay warnings and not legal advice.

## 2026-09-20 — Expanded sprite walks and radius-looped character audio

The three atlas-backed roaming characters retain one final PNG atlas each and share it between Canvas and Three.js. Merkel's 3-frame source rows become 6-frame rows; the five-frame Merz and Bayern rows become eight-frame rows. Every row preserves its supplied key poses and adds exactly three generated transition poses with visible alternating leg positions. The existing runtime atlas clock owns frame selection; no animation dependency or duplicate renderer-specific asset set is introduced.

Merkel, Merz, and the Bayern-Beauftragter replay only their own line or recording pools while the player remains inside a circular audio radius. Per-character cooldowns prevent chatter, a wider release radius prevents boundary jitter and rearms the next entry, and their ambient requests coalesce and expire through the shared broker instead of storing stale lines. The spoken-audio/textbox lockstep and strict Merkel/Merz ownership rules remain authoritative.

## 2026-09-21 — Authored anatomical sprite grid

Sprite stability is authored into the three final atlases rather than corrected with renderer-specific offsets. Every pose owns one hard 256×256 cell, places the detected head center on x=128 and the body midpoint on y=128, uses a row-consistent scale derived from supplied key poses, and retains transparent edge clearance. Color-coded silhouette overlays and rapid row cycles are the visual acceptance check: the torso must remain registered while legs and arms cross through planted, passing, and opposite-stride phases. Merz's corrupted front-pouring source row was regenerated under an identity-preserving prompt because its missing scalp pixels and detached lower heads could not be recovered by translation; every other walking row keeps the established alternating pose sequence. Canvas and Three.js continue to share the same atlas and frame clock.

The registered 256 px sheets are now explicit production sources under `assets/sprite-sources/`. A single Pillow/FFmpeg tool inserts three motion-compensated frames across every key interval and loop seam, producing 24-frame Merkel rows and 32-frame rows for every eight-key character, including all three directional crowd rows. Derived runtime cells are 128 px so the widest atlas remains 4096 px and mobile/WebGL memory stays bounded; animation clocks are multiplied by the same four-times expansion factor, preserving stride duration. `For-AI/SPRITE-GENERATION-PROTOCOL.md` and its checksum-bound critical gate are the required contract for new moving characters.

## 2026-09-21 — Bundestag landmark on the vacant southeast parcel

The southeast Berlin block at city coordinates `x=7800, y=3370` now holds the Deutscher Bundestag landmark. The original texture-free GLB is a bounded 140,764-byte model with a ground-centered pivot and four reusable materials; it is loaded through the existing building-model map, recolored into the municipal palette, and keeps transparency only for its identifying glass dome. `game.js` remains the placement and collision authority, while `world3d.js` remains a renderer. Canvas, a missing GLB, or a failed WebGL loader still exposes the same labeled solid procedural-building footprint, so no gameplay rule depends on the enhancement.

## 2026-09-20 — Faster offenses and vehicle/air escalation

Ordinary grass and off-crossing road violations now warn after 0.3 seconds and add a star after 2.6 continuous seconds; the police garden responds after two seconds. Running, repeated-surface cooldowns, petty audits, and active evasion are modestly faster so wanted stars accumulate more readily without becoming instantaneous.

Wanted response is a fixed readable curve: one star calls a foot officer; stars two through five add one, two, three, and four fictional German-style police cars; stars four and five add one and two black helicopters. Cars pursue and physically displace the player on contact. Helicopter searchlights pressure a player who remains on forbidden grass and add bounded foot reinforcements. Response state remains in `game.js`; Canvas and Three.js are adapters over the same arrays. Two small local CC0 GLBs are progressive enhancement only, with procedural fallbacks and provenance in `assets/models/police-response/LICENSES.md`.

Foot-officer contact is gated for 5.8 seconds. Extra officers that overlap during that window are cleared without repeatedly removing stars, so deliberate repeat offenses can reach the car and helicopter tiers instead of being cancelled by a same-frame police pile-on.

Police-car pursuit uses bounded predictive interception rather than navigation middleware. Player velocity supplies a lead point; active cars take laterally separated formation slots ahead of it, orbit at a fixed-radius neighborhood when the player is still, brake once positioned, and revert to direct contact only at close range. This keeps the response readable and lets several cars cut off the projected escape route without creating a pathfinding subsystem.

Ground collisions deliberately use bounded circle and rectangle tests rather than a physics dependency. Player movement treats props, normable objects, response units, and train cars as solid when moving toward them; all moving NPCs, police officers, and pursuit cars use axis-separated sliding against the same world and against one another; trains retain hard same-track spacing and stop for any person or ground response unit on the rail. Route-walking sprites must change route direction after sustained blocked progress; the Bayern-Beauftragter excludes the blocked branch at his last graph junction when an alternative exists and reverses when it does not. Helicopters are excluded as airborne actors.

The police-car livery is an embedded body texture, not extra stripe geometry. Because the selected CC0 source had neither UV coordinates nor textures, its body is UV-unwrapped once with xatlas; an OpenAI ImageGen edit of that exact template supplies a fictional German-style segmented livery. The optimized GLB remains the runtime authority, while the adjacent 512×512 PNG and the small production script preserve editability.

## 2026-09-20 — Local German police chase recordings

The two-star police-car tier now owns the continuous chase-audio threshold. A real circa-2010 Polizei Essen Martinshorn recording from Work With Sounds (CC BY 4.0) loops at a restrained distance-scaled level, while Breviceps's German police-car pass-by (CC0) fires once per close approach behind a global cooldown. Higher wanted tiers raise urgency only slightly through bounded gain and playback-rate changes. Both MP3 files are local, total about 371 KB after normalization, and are decoded after the Start gesture; modal screens and a cleared response fade the loop. The original synthesized siren remains the alert and asset-failure fallback, so the static game adds no remote audio service or sound library.

## 2026-09-21 — Rail-clearance gutter, denser traffic, and recorded announcements

The canonical world is now 10,960 × 5,360 units. The established 9,840 × 4,240 city layout is translated intact into the center of a 560-unit playable perimeter gutter, and the two rail loops use broader 720- and 560-unit corner radii. This keeps the articulated train bodies clear of every building without changing mission-relative city layout or introducing a second coordinate authority.

Each loop now begins with six seven-car trains in alternating directions. Distinct speed and acceleration constants, more frequent bounded speed changes, and more frequent unexplained stops drive repeated same-track contact. Existing hard separation still prevents passing or overlap; contact stops both consists for 0.82 seconds and reverses them without reordering their cars.

Five user-supplied station-hall MP3s replace the generated train-announcement text and browser voice. Proximity makes one shuffled no-repeat train-family request eligible through the shared broker; once admitted, it plays at fixed foreground gain through the common bus and never opens a textbox. Leaving the rail vicinity invalidates a pending cue, while an active cue finishes before modal speech. Voice-off still cancels it. The files are in-game-only pending separate redistribution permission; `assets/audio/trains/PROVENANCE.md` is their checksum and source-path authority. EBO obstruction hints remain separate exact visible-and-spoken gameplay warnings.

## 2026-09-21 — Exclusive audio-text priority and obstruction cue

Recorded and synthesized speech now shares one exclusive `audio-text` authority. A current event completes before the next begins; train announcements reserve the next slot ahead of ordinary dialogue, while a newly player-blocked train reserves the supplied Buxtehude recording ahead of ordinary train proximity cues. Active train audio is not abandoned merely because the player leaves its radius or opens a dialogue. Background music and every Web Audio sound effect route through separately classified, smoothly ducked outputs while audio text is active. The existing oriented coach collision remains the player barrier, and trains additionally scan the player, pedestrians, police, response vehicles, props, and normable objects as solid rail obstructions.

## 2026-09-21 — Normalized mixer, fair stimulus broker, and one music playlist

The earlier train-priority implementation is superseded by one small session-local broker inside `game.js`. Requests carry family, critical/reactive/ambient priority, eligibility, expiry, source type, owner, and optional textbox lifecycle callbacks. Active audio is never priority-preempted. Critical modal/direct interactions and player-caused obstruction go next before reactive enforcement/complaints, then ambient trains, rules, pedestrians, politicians, and Bayern. Ambient families coalesce, expire after four seconds, observe a 2.5-second gap, and rotate by least-recently-served family before request age. Repeat-prone pools use shuffled exhaustion bags with boundary-repeat protection; Merkel and Merz remain strictly owner-locked. Voice-off/reset cancels all requests, modal takeover cancels textbox barks, and an active no-text train recording finishes before modal speech.

A roaming quiz pedestrian does not enter modal state while that broker is busy. The pedestrian remains the active approach target for at most eight seconds and abandons pursuit sooner if the player exceeds 650 world units; only proximity within that interest window can open the quiz and pause the world after speech clears. Player movement is never locked merely because the quiz dialogue is waiting for its turn.

Every recorded foreground source routes through one `audio-text` gain bus at multiplier 1.0. Background music and the shared effect bus ramp to 0.28 over 120 ms and recover over 400 ms after the foreground queue empties; browser speech gets the same duck lead-in but retains its native fixed utterance volume. Train distance now controls admission only, not accepted playback gain. Offline two-pass FFmpeg normalization establishes `−18 LUFS`/`−1.5 dBTP` for foreground voices and trains, `−20 LUFS`/`−1.5 dBTP` for intro and sung music, and `−20 LUFS`/`−2 dBTP` for fax/police effects. `tools/normalize-audio.ps1` checks by default and rewrites only with `-Apply`.

The intro remains the single opening recording. After it completes, one scheduler owns both music types: three shuffled no-repeat synthesized 8-bit arrangements followed by one shuffled no-repeat user-supplied sung recording from Badnerlied, Erika, and Saargebiet. A forced national anthem takes the next 8-bit slot without interrupting or starting another scheduler. Track handoffs occur only after the current track ends, so neither synthesized nor recorded background music overlaps.

Merkel's owner-locked ambient pool additionally maps “Das Internet ist für uns alle Neuland” to the normalized user-supplied `assets/voices/merkel/neuland-0-3s.mp3` excerpt. Merkel, Merz, and the Bayern-Beauftragter all enqueue their own pools automatically from their per-frame proximity checks; pressing the interaction button is not part of this trigger path.

## 2026-09-21 — Full-alpha registered sprites and Alice vertical runner

Every moving bitmap character now follows the same registered-source pipeline. The transition builder clears hidden RGB, downsamples in premultiplied-alpha space, preserves full RGBA, and emits the established three motion-compensated in-betweens per key interval. Canvas and Three.js use smooth sampling and one bottom-center cell anchor, with small per-atlas whole-character scales chosen from visible body height. The previous Merz-only alpha-mask dilation was removed because it promoted interpolation residue into opaque black geometry, producing the observed face/arm blob and apparent vibration. No renderer owns per-frame correction offsets.

Alice Weidel is a visibly fictional satirical Germany-side character with a registered 8×2 key sheet and 32×2 runtime atlas. Eight front and eight back keys carry two German flags through alternating contact, passing/crossing, and opposite-step phases. She remains on one exact vertical route, moves and cycles at 1.5× the standard 52-unit/40-frame character rates, and flips between front/down and back/up rows at each bound. Her user-supplied local recordings form an owner-locked shuffled proximity loop through the existing broker; exact local Whisper transcripts accompany playback, and the material is not asserted to be authentic quotation or fact.

## 2026-09-21 — Featured sprite dialogue and contextual inner monologues

The existing stimulus broker remains the only audio-text authority. It now has one featured-character tier between critical direct/modal speech and reactive barks. Automatic proximity dialogue for Merkel, Merz, the Bayern-Beauftragter, and Alice uses this tier, bypasses the ordinary ambient-family gap, and may enqueue exactly one immediate follow-up from the same owner with a 42-percent chance while eligibility remains true. Active audio is still never interrupted, direct interaction remains critical, and all owner, textbox, regional-language, and voice bindings remain unchanged.

Player self-talk reuses the same bark and broker path rather than introducing a second dialogue system. Context-specific shuffled pools cover train delay, wrong-office, bicycle, fax, empty-machine, wrong-task, low-energy, deadline, and no-authority interactions. They use Berlin Denglisch or Germany-only German, run below the featured tier, coalesce behind one cooldown, and cause a nearby named sprite to become immediately eligible before the self-line is queued.

## 2026-09-21 — Wirtschaftswunder construction-site vortex

The free strip beside the western Schrebergarten now contains a permanent fenced construction site centered on an aggressively spinning black traffic vortex. Four physical signs identify it in bold as `WIRTSCHAFTSWUNDER!`. The visual depth effect remains a bounded code-native Three.js treatment: three subdivided polar spiral surfaces rotate at different rates, visibly displace into continuous radial ripples, shift subtly against the camera for parallax, and cover a dark funnel. Each ingestion adds one brief shader shockwave, pooled blue-white line lightning, and a local point flash without textures, models, post-processing, or another asset family.

`game.js` remains authoritative. Every civilian vehicle on the adjacent middle street turns off at the first junction, follows one cubic access route, spirals and tumbles inward, visibly crushes, shrinks below the ground plane, disappears, then respawns after a short delay at the far edge of its original lane when that entry is clear. The transition to swallowed state emits one monotonic impact serial and one deterministic synthesized thunder-crunch through the existing ducked sound-effect bus. `world3d.js` renders the exposed phase, sink, crush, position, orientation, and impact serial. Other streets keep their normal traffic, and the construction mouth is solid to ground actors so this satirical set piece does not become a second player hazard or remove a legal route.

## 2026-09-21 — Direct cutout-rig sprite authority

The earlier complete-character motion-compensated transition pipeline is superseded for every atlas-backed character. Each character now owns one high-resolution three-view/fourteen-part source sheet under `assets/sprite-sources/rigs/`. One production-only Pillow/NumPy/SciPy renderer rotates isolated pieces around registered pivots, uses analytic two-bone leg IK, pins stance feet, lifts swing feet, crosses front/back legs through the midpoint, counter-swings arms, preserves rigid heads/torsos and directly renders all 32 runtime phases. Small generated joint openings may be stitched only within a bounded 64-pixel working-grid radius; more distant pieces are rejected. The root game still loads ordinary full-RGBA PNG atlases through its existing shared staging canvas, so the new pipeline adds no runtime library or loader.

All six replaced runtime atlases and their former key sheets are recoverable under `assets/sprite-archive/pre-rig-20260921/`, bound by a checksum manifest and excluded from runtime lookup. The active review keys are uniformly 8 columns at 256 px; runtime rows are uniformly 32 columns at 128 px, including Merkel. `assets/sprite-sources/verification.json` version 2 binds exact hashes for the part source, derived key atlas and runtime atlas. Full-resolution source/key inspection, rapid-loop anatomy review, deterministic gait/alpha/centering/seam metrics, and real desktop/mobile browser playtests are mandatory before sign-off. `For-AI/SPRITE-GENERATION-PROTOCOL.md` is the durable onboarding contract.

## 2026-09-22 — Merkel identity silhouette calibration

The shared cutout gait remains authoritative, but generic normalization no longer determines Merkel's proportions. One deterministic Merkel-only calibration preserves the archived sprite's broad face and hair, full blazer and trouser mass, compact legs, restrained arm swing, and view-specific ground registration across every generated frame. It uses the accepted part-sheet pixels and applies no frame-local correction or whole-image morph. At the reviewed front, side, and back anchors, the generated outer silhouettes are within two pixels per axis of the archived reference; the 32-cell joint overlay plus desktop and 390-pixel mobile preview remain the visual acceptance authority. This supersedes the narrow, long-legged Merkel assembly without changing another character's atlas or any runtime gait rule.
