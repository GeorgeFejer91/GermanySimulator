# Gameplay authority

## Core loop

The player has three deliberately fictional administration days to complete eight linked procedures. Progress alternates between travelling through the city, locating the correct office, speaking to officials, completing absurd forms, collecting resources, and surviving petty rule enforcement.

Mission order:

1. Bürgeramt — permission to submit an application (`A38`).
2. Hausverwaltung — Wohnungsgeberbestätigung.
3. Bürgeramt — supplementary sheet.
4. Finanzamt — tax registration.
5. Krankenkasse — insurance evidence.
6. Amt für Stadtbild — align three nonconforming objects.
7. Ausländerbehörde — residence evidence.
8. Ausländerbehörde — fictional citizenship application.

## Controls

- Desktop: WASD or arrow keys move; Shift runs; E interacts; `§` or `Q` activates the law power after unlock.
- Phone: the on-screen directional dock moves and the E action interacts.
- The game does not request motion permission and has no device-tilt or recalibration controls.

## Systems

- Running for too long, jaywalking, lingering on roads, evading an active police approach, random petty audits, and entering protected lawn can raise the wanted level. A continuous three-second stay on ordinary forbidden grass or a road outside a marked zebra crossing adds a wanted star; the protected police garden remains deliberately harsher. Repeat violations escalate the wanted stars up to five and call progressively larger police responses.
- Schrebergarten and police-garden grass trigger deliberately disproportionate enforcement. The marked police-garden path is safe.
- Police pursue the player, issue localized barks, reduce energy on contact, and escort the player to the station garden.
- Zebra crossings are mapped onto the actual street intersections and marked with pedestrian-crossing signs. Crossing elsewhere provokes angry pedestrian dialogue before and during police escalation.
- A 0–15 Germanness social-currency meter rewards concrete rule-following: collecting Pfand, finding a previously uncollected regional sausage, completing a street crossing entirely on a marked zebra crossing, visibly waiting at a red pedestrian Ampel, and correctly answering a roaming citizenship-test question. A wrong test answer removes one point, never dropping the meter below zero. Its fill begins gray and progressively reveals saturated Schwarz-Rot-Gold; at 15/15 it is the undimmed German flag.
- Nine one-off regional sausage collectibles are scattered through the city: Nürnberger Rostbratwurst, Frankfurter Würstchen, Thüringer Rostbratwurst, Münchner Weißwurst, Bockwurst, Knackwurst, Mettwurst, Teewurst, and Berliner Currywurst. A first find adds its labeled badge to the 3×3 Wurstsammlerpass, announces `Extra Wurst! Unlocked …`, restores some energy, and awards one Germanness point. Canvas and WebGL render these variants procedurally from shared pickup data rather than adding a third-party image pack.
- At 9 Germanness, the player permanently unlocks the `§` / `Q` law power and is explicitly told which key to press. It quotes only real, current federal provisions verified against `gesetze-im-internet.de`, favoring obscure and syntactically dense material such as § 183a StGB, § 118 and § 127 OWiG, §§ 961–964 BGB, § 27 StVO, and the Lebensmittelbestrahlungsverordnung. The power clears the player's active wanted status and redirects police toward a nearby crowd NPC. Police catch that pedestrian, escort them visibly to the station garden, and remove them into the Spiel-Knast; the power has a short cooldown. Reaching the threshold also makes the existing locally synthesized national-anthem arrangement the next immediate soundtrack cue, without overriding the player's music mute.
- Designated ordinary pedestrians periodically approach the player, make one region-appropriate intrusive remark, and present one four-choice question adapted from the official BAMF `Gesamtfragenkatalog`, dated 7 May 2025. The in-game card keeps the official task number visible. The curated pool favors unusually specific civic trivia while excluding questions about rights, antisemitism, National Socialism, and historical responsibility from this joke mechanic.
- A wrong quiz answer triggers the visible-and-recorded `Nein! Nein! Nein!` sting credited in `assets/voices/LICENSES.md`, with the existing browser voice as its load-failure fallback. Both paths continue to respect the player's voice-off setting.
- Forbidden ground should visibly outweigh legal pedestrian space. Grass and landscaped ground are forbidden to walk on by default, roads and other vehicle surfaces are forbidden by default, and every traversable area must still provide a continuous but deliberately narrow sidewalk, marked crossing, or pedestrian path where walking is legal.
- The narrow legal route creates an intentional no-win social pressure system. Dense sidewalk crowds are solid to the player, automatically complain when the player enters their personal space, and pause or turn when bumped; if the player yields by stepping onto grass or a road, nearby pedestrians immediately complain about that new rule violation instead. Ambient NPCs therefore default to finding something to complain about even while the player is obeying the movement rules, without removing the player's legal route through the world.
- Ordinary Bratwurst, Currywurst, and Brezel restore energy. Extra-Wurst variants are unique badge collectibles. Pfand bottles increase the Pfand count.
- Forms pause world simulation and require every field before submission.
- Pressing Start first opens the three-page satirical `HUM-01/DE` humor-competence declaration. Each page remains visibly open while its complete definition text is read aloud, and progression stays locked until that page's reading, signatures, acknowledgments, and deliberately awkward stamp buttons are complete. Finishing the declaration starts the normal Berlin welcome and gameplay; it is satire, not a real contract or legal test.
- The title-screen language selector is a deliberate joke: choosing English turns it into Deutsch, and clicking any Deutsch choice again keeps spawning more equal-width Deutsch boxes while the existing choices shrink to fit.
- Berlin uses satirical Denglisch dialogue. This is a hard world rule: Berlin lies behind the Brandmauer; after crossing out into Deutschland, every character speaks German only. UI localization may remain English, but it must never translate Deutschland character dialogue or synthesized speech into English.
- The Brandmauer firefighter is the clearly labeled satirical Friedrich Merz character. His Merz-attributed quote pool remains pure German on both sides, and synthesized delivery should prefer an available German masculine voice. Merkel and Merz quote ownership is strict: only Merz may trigger Merz lines, only Merkel may trigger Merkel lines, and their speaker labels, textboxes, voice assignments, and quote pools must never be crossed or merged.
- The HUD exposes mission, progress, energy, forms, Pfand, Germanness, the nine-slot Wurstsammlerpass, law-power state, day, region, current rule, wanted status, and control mode.
- Optional synthesized music and speech are local browser features and must remain user-toggleable. Music rotates without immediate repeats through a 26-track catalog of locally synthesized 8-bit arrangements: every Bundesland has a public-domain or traditional regional melody, Baden and Württemberg are represented separately, Swabia has two additional songs, and Thüringen also has an original Kloß-themed game jingle. Do not bundle third-party music recordings or copy protected modern melodies. The local browser-generated dialogue voice is a valued part of the game; preserve it, distribute speakers across available installed German voices, and make it speak the exact authored regional line. A bounded set of provenance-recorded CC0 German emotional-speech clips may supplement exact matching pedestrian barks.
- All synthesized character speech is serialized: every voiced line plays once to completion, followed by a brief 250 ms pause before the next queued line. Spontaneous police, pedestrian, border, and ambient barks never overlap or interrupt one another. Modal dialogue still finishes before the player can advance.
- Spoken character audio and text are locked together. A bark textbox appears only when that exact queued line begins, stays visible until its speech ends, and cannot be replaced by another bark while the first line is audible. Opening a modal dialogue cancels active and queued bark speech before showing and voicing the modal's exact line. This invariant covers synthesized speech and recorded quotations; it does not apply to music or non-verbal effects.

## World identity

The world is a gray-beige bureaucratic city with civic offices, a Faxviertel, Sparkasse/Post district, Rathaus/DIN zone, eastern Ordnungsamt/Formulararchiv/Termin districts, allotment gardens, a police garden, fax infrastructure, minor props, and NPC complaints. The southern energy district places a visibly closed nuclear plant—silent cooling towers, sealed red barriers, and decommissioning signage—directly beside a visibly operating coal plant with an open gate, warm windows, moving conveyor, and active smokestack. A user-supplied satirical Angela Merkel sprite meanders around both plants, cycles through short sourced quotations about Fukushima and the 2011 Atomausstieg (plus “Wir schaffen das”), and says “Sie stehen hinter mir.” when the player approaches from behind. The first nearby bark uses a short attributed recording of “Wir schaffen das”; the other lines use the browser's German voice when voice is enabled. The playable land area is 9,600 × 4,000 world units—twice the original area. The **Brandmauer**, a highly visible but fully crossable wall of flames, spans the map with Berlin behind it. It changes regional speech without acting as collision geometry. The satirical Friedrich Merz character patrols the full line, alternating directional walk and pour animations while trying to extinguish it. His normalized atlas keeps a transparent inset around every cell so no directional frame clips his head or bleeds into its neighbor. The canonical root game progressively enables the Three.js world when available and otherwise retains the pseudo-3D canvas renderer. `3d.html` remains a direct renderer diagnostic. Both views preserve the same concrete-gray, repetitive-window, municipal-office visual direction rather than a colorful or cozy European look.

## Satirical voice and dialogue

The game is an affectionate satire of life in Germany, made with love for German culture and its capacity for self-irony. It exaggerates recognizable everyday interactions with people and institutions; the joke targets bureaucratic habits, social friction, and inflexible systems rather than expressing contempt for Germans.

The creative shorthand “cultural autism” means an intentionally extreme caricature of rigid, indirect communication. It is not a diagnosis or a claim about autistic people. Apply it to all character dialogue through these rules:

- A character usually avoids stating their actual concern directly. They instead announce the rule, paragraph, norm, process, quiet-hours clause, queue convention, or technicality the player has allegedly violated.
- Characters treat their own interpretation as the only possible interpretation, even when it is incomplete, contradictory, or plainly wrong. Common sense and alternative readings do not persuade them.
- The delivery stays serious, precise, and stubborn while the situation becomes increasingly specific, circular, and absurd. Characters should believe they are being helpful and correct.
- Resolution normally requires the player to produce a stamped form, printed document, fax, written confirmation, lawyer, supervisor, or other recognized authority. A sensible explanation by itself is rarely enough.
- Institutions default to fax machines, paper copies, signatures, stamps, appointments, and in-person handoffs even when a simple digital exchange would solve the problem.
- Ambient characters default to complaining at the player. On a legal sidewalk they allege obstruction, queue, spacing, or right-of-way violations; after the player moves aside onto forbidden grass or roadway, they switch to the corresponding lawn or traffic complaint. The contradiction is the joke and should not be resolved into a socially approved position.
- Berlin’s Denglisch and the German-only regional boundary remain delivery variants of this same voice; they do not replace the voice.

Strange German idioms are a recurring part of the voice. Prefer recognizable sayings such as “Hast du Tomaten auf den Augen?”, “Jetzt haben wir den Salat”, “Das ist nicht mein Bier”, “Da wird der Hund in der Pfanne verrückt”, “Ich glaub, mein Schwein pfeift”, “Das Leben ist kein Ponyhof”, “Da liegt der Hase im Pfeffer”, and “Alles hat ein Ende, nur die Wurst hat zwei.” Characters may bureaucratically over-explain, misapply, or combine them, but the saying should connect to the current complaint, mission, or alleged rule rather than appear at random.

Regional delivery follows the player’s in-game side of the marked boundary:

- Behind the Brandmauer on the Berlin side, dialogue uses deliberately awkward Denglisch. German sayings may be partially translated or spliced into English bureaucracy, for example: “Hast du tomatoes on den Augen? The Gehwegordnung is very clearly marked.”
- On the Germany side outside the Brandmauer, dialogue is fully German, for example: “Hast du Tomaten auf den Augen? Die Gehwegordnung ist eindeutig ausgeschildert.”
- The interface can be English, but character text and browser-generated speech still follow the region rule. Deutschland dialogue must not be translated into English; Berlin dialogue must retain its authored Denglisch mixture.
- Use the game’s current region state, not assumptions about real Berlin geography, to choose the language variant. The underlying joke, rule fixation, and character intent should remain equivalent on both sides.

Dialogue should vary the alleged rule and bureaucratic mechanism so the joke does not collapse into one repeated catchphrase. The escalation may be surreal, but it must remain clearly fictional and internally consistent with the current mission.

## Satire boundary

All deadlines, rules, procedures, penalties, immigration mechanics, and enforcement are fictional game satire. The exaggerated communication style is a comic lens, not a factual claim that every German person or institution behaves this way. Political figures and posters are stylized satirical props and must not be used to imply unsupported factual claims or political endorsements.
