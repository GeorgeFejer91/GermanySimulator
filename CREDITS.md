# Germany Simulator credits

## Walking-motion reference

The preview-only Merkel left-walk pilot uses subject 69, trial 01 (“walk
forward”) from the Carnegie Mellon University Graphics Lab Motion Capture
Database as an offline bone-direction reference. The game runtime does not load
the BVH or a skeleton. Source, conversion commit, caveats, and checksums are
recorded in `assets/sprite-sources/reference/cmu-walk-69-01/PROVENANCE.md`.

The data used in this project was obtained from mocap.cs.cmu.edu. The database
was created with funding from NSF EIA-0196217.

## 3D buildings

The active city building and street-prop kit is original geometry authored in Blender for this project. Four building families, Pfand machines and bottles, coffee/fax kiosks, gnomes, branching trees, timber sheds, lamps, benches, bins, bollards, and bicycle racks use texture-free materials. Editable source, generation instructions, geometry budgets, and checksums are in `assets/models/city-kit/`. The inventory and replacement priorities are in `assets/models/CITY-ASSET-INVENTORY.md`. Road surfaces and paving textures are deterministic project-authored code.

Six earlier building meshes from Kenney's **City Kit Commercial 2.1** remain archived locally with their CC0 1.0 source record; they are no longer loaded by the city renderer.

- Source: https://kenney.nl/assets/city-kit-commercial
- Creator: Kenney, https://kenney.nl/
- Local license copy: `assets/models/kenney-commercial/LICENSE.txt`

The Reichstagsgebäude/Bundestag landmark is an original, texture-free Blender model with a six-column west portico, layered masonry, four corner towers, and a ribbed transparent dome with its interior cone and ramps. No third-party mesh or photograph pixels are included. Public architecture material and photographs guided its recognizable proportions and features; it is a game-scale interpretation, not a measured architectural replica. Editable source, references, build provenance, and checksum are recorded in `assets/models/bundestag/LICENSES.md`.

## Kiesinger monument

The monumental bronze figure of Kurt Georg Kiesinger was authored in Blender
with an original civilian body and pose. Its face fits offline landmarks from
CDU / KAS-ACDP's 1967 portrait (CC BY-SA 3.0 DE), Anefo / Nationaal Archief
919-8404 (CC0), and the ThePhotoEnhancer crop of Anefo 919-8423 (CC BY-SA 4.0).
MediaPipe's canonical face connectivity and alignment reference are reused
under Apache 2.0; the adjacent `LICENSE-MEDIAPIPE.txt` retains that license.
The authored model adaptation is [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
No photograph pixels, textures, or ML runtime are bundled. HDG and Bundesarchiv
portraits were visual inspection references only. Full source links,
attributions, modifications, rebuild instructions, and checksums are in
`assets/models/kiesinger/PROVENANCE.md`.

## Civilian traffic

Berlin's WebGL traffic uses the compact local `classic-vw-beetle.glb`, derived
from the historic Sutherland Volkswagen STL hosted by Wikimedia Commons. The
source is licensed CC BY-SA 4.0 by Ivan Edward Sutherland and contributors. It
was converted from STL to GLB, changed from Z-up to Y-up, normalized to a
2.35-metre length, centered and grounded, and assigned a neutral material that
the game recolors per car. Game-authored wheels, hubs, glazing, bumpers, and
lamps complete the historic body scan at runtime. A missing model retains a
procedural 3D silhouette; Deutschland-side Trabants remain code-native. No
manufacturer logo or texture is included.

- Source: https://commons.wikimedia.org/wiki/File:Utah_VW_Bug.stl
- License: https://creativecommons.org/licenses/by-sa/4.0/
- Local modifications and checksums: `assets/models/traffic/LICENSES.md`

## Perimeter trains and station announcements

Twelve fictional `AMT-BAHN` consists use compact end cars from Kenney's
**Train Kit 1.1** and five full-length German n-Wagen passenger coaches per
consist from Open L-Gauge's **[6w] DB n-Wagen** by DennisAkaTECHNO. The Kenney
models are CC0 1.0. The converted n-Wagen is CC BY-NC-SA 4.0 and is therefore
limited to this noncommercial game; modifications and complete LDraw creator
attribution are recorded beside the GLB. The game clones these local assets
across two continuous rounded perimeter loops around the 10,960 × 5,360 world.
A 560-unit playable gutter separates the original city footprint from every
side of both tracks. Missing individual train models keep a procedural 3D
red-and-white stand-in with the same long-car dimensions.

- Source: https://kenney.nl/assets/train-kit
- Creator: Kenney, https://kenney.nl/
- Local file and checksum record: `assets/models/kenney-trains/LICENSES.md`
- n-Wagen source: https://open-l-gauge.eu/6wdb-n-wagen/
- n-Wagen creator: DennisAkaTECHNO
- n-Wagen license: https://creativecommons.org/licenses/by-nc-sa/4.0/
- n-Wagen modifications, LDraw attribution, and checksums:
  `assets/models/open-l-gauge-nwagen/LICENSES.md`

No Deutsche Bahn or Märklin logo, branded texture, or cloned real announcer
voice is bundled. The former generated announcement-text library has been
replaced by five user-supplied station-hall MP3s. They enter the foreground
broker only while the player is near either track, play at the fixed normalized
foreground level once admitted, and intentionally display no transcript or
announcement textbox. The voice toggle mutes them. An active recording finishes
before modal speech; leaving the rail vicinity only invalidates a pending cue.

The recordings were supplied directly for in-game use. No external source URL,
Deutsche-Bahn-authenticity claim, or redistribution license was provided. Their
source paths, durations, byte sizes, and SHA-256 checksums are recorded in
`assets/audio/trains/PROVENANCE.md`; separate permission is required before any
reuse outside this project.

When the player blocks a train, the game rotates short excerpts from the current
Eisenbahn-Bau- und Betriebsordnung. The excerpts are gameplay hints, not legal
advice or a claim that every fictional obstruction satisfies a real offence.

- Official EBO §§ 62–64 and § 64b, Federal Ministry of Justice / Federal Office of Justice: https://www.gesetze-im-internet.de/ebo/BJNR215630967.html
- Official StGB § 315, checked to avoid omitting its additional concrete-danger element: https://www.gesetze-im-internet.de/stgb/__315.html

## Power-plant scene

The adjacent closed nuclear plant and operating coal plant use a bounded local CC0 model subset. Kenney's **City Kit (Industrial) 2.0** supplies the industrial building and chimney meshes. The nuclear transformer and warning sign come from 3DAssets.dev's **Nuclear Power Station and Control Room** pack; the source identifies those two models as AI-generated with Claude Opus 5.

- Kenney source: https://kenney.nl/assets/city-kit-industrial
- Nuclear pack source: https://3dassets.dev/packs/nuclear-power-station-and-control-room
- Local file, license, rename, and checksum record: `assets/models/power-plants/LICENSES.md`

## Music

The soundtrack opens with the user-supplied in-game recording at `assets/intro-song.mp3`. The shipped copy removes exactly the first 24.000 seconds, preloads and attempts playback immediately on page entry, plays once, and then hands off to the background playlist. When a browser blocks audible autoplay, the preloaded intro retries from its beginning on the first click or key press. Its source SHA-256 is `a7e09bb04fbf6e53d6801573adf4c872276a8504e4ddb9831b2aaf15d6f4a1c1`; the normalized 192 kbps shipped file SHA-256 is `6D7DC5847E2CFC3A307C1AD6AF11AC3F5EF11049A796ABE07987FE75C54BF527`. External redistribution rights for the user-supplied recording should be confirmed before publishing outside this project.

The sausage-collection milestone uses the user-supplied in-game recording at `assets/audio/music/wurst.mp3`. Collecting the fifth of nine unique sausages plays the 172.069-second, 4,130,315-byte MP3 once in place of the current background cue, after which the normal playlist resumes. No external source URL or redistribution license was provided. The supplied source SHA-256 is `6FBA3EDB2FDE75D6EF57BC4ED2C5A973109CC3A22CB90778FFEC188552D5359F`; the normalized shipping copy is `34078BD5B197B460E88245B1DE7D952B49FE99909A1A8A74959B9A88258D7132`. Separate permission is required before reuse outside this project.

After the intro, one background scheduler alternates both music types without overlap: three shuffled no-repeat Web Audio 8-bit arrangements, then one shuffled no-repeat sung recording. Every synthesized variant is exhausted before reshuffling, and all three sung files are exhausted before their pool reshuffles. A queued national-anthem cue takes the next 8-bit slot without interrupting the current track. The entire playlist ducks beneath foreground speech and retains a short handoff gap between tracks. The softened synthesis uses a lower-octave triangle-wave lead, sine-wave bass, restrained synthetic percussion, and a low-pass filter. No MIDI or sheet-music files are bundled.

The sung pool contains the user-supplied `Badnerlied.mp3`, `Erika.mp3`, and
`Saargebiet.mp3`, normalized as local background music. No source URL or
external redistribution license was supplied. Their source paths, durations,
byte sizes, and shipped checksums are recorded in
`assets/audio/music/PROVENANCE.md`; separate permission is required before
reuse outside this project.

The 26-track catalog gives every Bundesland a melody:

- **Baden-Württemberg:** Badnerlied (including the “Frisch auf” refrain) and Württembergerlied. The catalog also keeps the distinct Swabian standards **Muss i denn** and **Auf de schwäbsche Eisebahne**.
- **Bayern:** Bayernhymne.
- **Berlin:** Berliner Luft.
- **Brandenburg:** Fritze Bollmann, the 19th-century Brandenburg an der Havel folk song.
- **Bremen:** An der Weser.
- **Hamburg:** Stadt Hamburg an der Elbe Auen (Hammonia).
- **Hessen:** Hessenlied.
- **Mecklenburg-Vorpommern:** Wo de Ostseewellen trecken an den Strand, the Vorpommern-rooted Ostseewellenlied.
- **Niedersachsen:** Auf der Lüneburger Heide.
- **Nordrhein-Westfalen:** Westfalenlied.
- **Rheinland-Pfalz:** Ein Jäger aus Kurpfalz.
- **Saarland:** Glück auf, der Steiger kommt, representing the state's mining tradition.
- **Sachsen:** Dar Vugelbärbaam, the Erzgebirge song.
- **Sachsen-Anhalt:** An der Saale hellem Strande, written at the Rudelsburg near Naumburg.
- **Schleswig-Holstein:** Schleswig-Holstein meerumschlungen.
- **Thüringen:** Thüringen, holdes Land, plus **Thüringer Kloß-Kantinenjingle**, an original game composition.

The wider national and folk selection is **Erika**, **Deutschlandlied / German national anthem melody**, **Die Gedanken sind frei**, **Kein schöner Land**, **Das Wandern ist des Müllers Lust**, and **Der Mond ist aufgegangen**. The present national anthem is the third stanza of the Deutschlandlied; the game uses only Joseph Haydn's instrumental melody.

Notation and history references used for the transcriptions:

- German national anthem (official federal history and attribution): https://www.bundesregierung.de/breg-de/schwerpunkte/nationalhymne-deutschland-461412
- Deutschlandlied notation: https://www.lieder-archiv.de/deutschlandlied-notenblatt_300514.html
- Regional-hymn overview and state associations: https://de.wikipedia.org/wiki/Regionalhymne
- Regional-hymn MIDI reference catalog used to check the state transcriptions: https://midi.polyna.eu/anthems/germany.html
- Badnerlied score in MusicXML and printable notation: https://www.franzdorfer.com/badnerlied
- Badnerlied historical context and refrain: https://de.wikipedia.org/wiki/Badnerlied
- Württembergerlied notation: https://www.lieder-archiv.de/preisend_mit_viel_schoenen_reden-notenblatt_700033.html
- Bayernhymne notation: https://www.lieder-archiv.de/bayernhymne-notenblatt_600909.html
- Berliner Luft notation: https://commons.wikimedia.org/wiki/File:Paul_Lincke_-_Berliner_Luft.mid
- Fritze Bollmann melody and history: https://ingeb.org/Lieder/zubrande.html
- An der Weser public-domain score: https://imslp.org/wiki/An_der_Weser_(Pressel,_Gustav)
- Hamburg-Hymne notation: https://commons.wikimedia.org/wiki/File:Stadt_Hamburg.mid
- Hessenlied official state history, authorship, and scores: https://hessen.de/wissen/das-hessenlied
- Ostseewellenlied history and authorship: https://de.wikipedia.org/wiki/Ostseewellenlied
- Ostseewellenlied notation: https://www.lieder-archiv.de/wo_die_ostseewellen_trecken_an_den_strand-notenblatt_320002.html
- Auf der Lüneburger Heide notation: https://www.lieder-archiv.de/auf_der_lueneburger_heide-notenblatt_710192.html
- Westfalenlied score history and MIDI references: https://de.wikipedia.org/wiki/Westfalenlied
- Ein Jäger aus Kurpfalz notation: https://www.lieder-archiv.de/ein_jaeger_aus_kurpfalz-notenblatt_300102.html
- Dar Vugelbärbaam notation: https://www.lieder-archiv.de/da_vugelbeerbaam-notenblatt_600038.html
- An der Saale hellem Strande notation and Rudelsburg history: https://www.lieder-archiv.de/an_der_saale_hellem_strande-notenblatt_300135.html
- Schleswig-Holstein meerumschlungen notation: https://www.lieder-archiv.de/schleswig_holstein_meerumschlungen-notenblatt_700038.html
- Thüringen, holdes Land score and history: https://de.wikipedia.org/wiki/Th%C3%BCringen,_holdes_Land
- Die Gedanken sind frei notation: https://www.lieder-archiv.de/die_gedanken_sind_frei-notenblatt_300470.html
- Kein schöner Land notation: https://www.lieder-archiv.de/kein_schoener_land-notenblatt_300139.html
- Muss i denn notation: https://www.lieder-archiv.de/muss_i_denn_muss_i_denn_zum_staedtele_naus-notenblatt_300352.html
- Auf de schwäbsche Eisebahne notation: https://www.lieder-archiv.de/auf_de_schwaebsche_eisebahne-notenblatt_400120.html
- Das Wandern ist des Müllers Lust notation: https://www.lieder-archiv.de/das_wandern_ist_des_muellers_lust-notenblatt_300146.html
- Der Mond ist aufgegangen notation: https://www.lieder-archiv.de/der_mond_ist_aufgegangen-notenblatt_300017.html
- Glück auf notation: https://www.lieder-archiv.de/glueck_auf_glueck_auf-notenblatt_300472.html
- “Erika” public-domain recording listing: https://commons.wikimedia.org/wiki/File:Erika-piano_instrumental.ogg
- “Erika” melody and historical context: https://en.wikipedia.org/wiki/Erika_(song)

The arrangements use old or traditional underlying compositions, not modern performances or protected arrangements. “Erika” was published during the Nazi period and used as a Wehrmacht soldiers' song. Its place in this broader catalog is an instrumental historical/parody reference inside a satirical game, not an ideological endorsement.

The requested 2012 song **Thüringer Klöße** by Fritz is not transcribed or bundled. Its official upload identifies Frank Kadanik as composer, Ilona Klein and Hans-Jürgen Gröschner as lyricists, Warner Music Germany production, and explicitly prohibits unauthorized use: https://www.youtube.com/watch?v=qJe3cdM7f1c. The similarly named in-game Kloß-Kantinenjingle is a new, independent composition and does not copy that protected melody.

## Thorsten-Voice character reactions and law readings

German browser speech remains the default for character dialogue, with the
available installed German voices assigned across speakers. Six short clips
from **Thorsten-Voice Dataset 2021.06 emotional**, version 2.0, by Thorsten
Müller and Dominik Kreutz supplement it: angry and sleepy delivery appears in
German-side pedestrian remarks, while amused and disgusted delivery represents
the player's first-person reaction to gaining or losing Germanness. The dataset
contains 2,400 German recordings (300 sentences across eight performed
emotions) and is released under CC0 1.0 Universal. The game treats angry and
disgusted delivery as negative-valence material and sleepy delivery as
low-arousal material; this is an editorial mapping of the dataset's categorical
styles, not a claim that it contains numeric valence or arousal annotations.
The same credited angry and disgusted references were used locally with
XTTS-v2 to synthesize exact-text readings for all 13 excerpts in the §-power
deck and complete-body readings for all 11 rotating `REGEL DES AUGENBLICKS`
cards. The game ships only the compact generated MP3 files, not the model or a
runtime cloning service, and falls back to browser speech if a reading is
unavailable.

- Dataset DOI: https://doi.org/10.5281/zenodo.5525023
- Project repository: https://github.com/thorstenMueller/Thorsten-Voice
- Local clip IDs, conversion details, license, and checksums: `assets/voices/LICENSES.md`

## Opening-form typeface

The two `HUM-01/DE` opening sheets use **Grenze** by Renata Polastri and the
Omnibus-Type team, a Roman/blackletter hybrid selected for its more readable
classical forms. It is loaded through Google Fonts and released under the SIL
Open Font License 1.1: https://github.com/Omnibus-Type/Grenze

## Humor-form fax sound

The 4.128-second `Fax Sound Effect` recording used when either opening sheet is
submitted was linked by the user for this integration. The source exposes no
license metadata, so the file is treated as an in-game-only user-supplied asset;
no broader redistribution license is claimed. The browser-generated fax sound
remains the missing-file fallback.

- Source: https://www.youtube.com/watch?v=vGy1NnHm-u8
- Uploader shown by YouTube: `#1 Sound FX!`
- Local file: `assets/fax-machine-paper-feed.mp3`
- SHA-256: `A92A303695CAA70545A5D3ADC3E80C9B6709A21A7450B75CF227461895F46098`

## Phone tilt

The same-device tilt controls adapt ECGaming's existing phone-tilt principles: screen-orientation-aware gravity projection, explicit permission where required, neutral calibration, deadzone, smoothing, stale-input release, and keyboard/touch fallback.

## Political satire

The stylized Friedrich Merz poster is a simple code-drawn satirical prop. It does not reproduce a press photograph and does not make a factual claim, endorsement, or recommendation about him.

The animated border-pourer sprite sheet was supplied by the user for this integration and is labeled **FIKTIONALE SATIRE** in-game. Its external redistribution provenance and license should be confirmed before publishing outside the user's project.

The roaming Angela Merkel sprite sheet was supplied by the user for this integration and is labeled **SATIRE** in-game. Its external redistribution provenance and license should be confirmed before publishing outside the user's project.

The fictional roaming Bayern-Beauftragter uses a user-supplied character sheet as its visual reference. Its production walk atlas was expanded from 5×4 to 8×4 and deterministically repacked into equal 256×256 transparent cells. Its eight proximity lines are coherent excerpts from the user's local Bayern recording, selected from a local Whisper transcript and cut with FFmpeg. Source and shipped-audio checksums, exact transcripts, and cut intervals are recorded in `assets/voices/LICENSES.md`; external redistribution rights for the user-supplied inputs should be confirmed before publishing outside this project.

On 20 September 2026, OpenAI's built-in image-generation tool produced three supplemental transparent transition sheets using the existing Merkel, Merz, and Bayern atlases as strict identity and style references. Each prompt requested exactly three sequential in-between walking poses per existing direction/action row, visible alternating leg positions, consistent baseline and padding, unchanged clothing and props, and no text, grid, background, cropping, or extra characters. The generated poses were interleaved with every original key pose, deterministically repacked into the final 6×5 Merkel, 8×6 Merz, and 8×4 Bayern atlases, then palette-optimized. Final SHA-256 checksums: `merkel-sprite.png` `DA7958640D759A297B126E09AFC0ADDB57A7DEE2DA62DCC8C2E5E138703791DF`; `border-pourer-sprite.png` `0AC1D55CDDA589BF6A33EEE2B1CECBF29473F5BF3755D5639FD2ADFD69D71876`; `bayern-walker-sprite.png` `9963C2AAFC605867A87C54807736521F4BDC7309B9502C0C3B259631706C16F2`.

On 21 September 2026, every cell was re-audited as a rapid cycle and as a color-coded silhouette overlay. OpenAI's built-in image editor received each atlas as an identity reference and was asked to preserve its character, direction/action layout, props, and cartoon rendering while enforcing one complete pose per cell, a stable head and torso, alternating planted/pass/opposite-leg gait phases, transparent clearance, and removal of cropped or duplicated body fragments. The editor's repetitive-stride Merkel/Bayern replacements were rejected; the established alternating walk poses remain authoritative. The repaired Merz render supplies only the previously corrupted front-pouring row, whose source contained clipped scalps and detached heads. A deterministic registration pass scales poses to their row's supplied-key-pose median, fixes every head center and body midpoint to the 128 px source-grid axes, keeps water inside its own cell, hard-clips cell ownership, and stores the accepted 256 px key sheets under `assets/sprite-sources/`. Key-sheet SHA-256 checksums: Merkel `7D5CDE706EA62A8E4A8BE4086AD0D595272DB76B4CC61277D95E081A861B69DF`; Merz `29C2E0257ED82F56848FF1035E9D3A95E720695418E118220E493138CAF3C333`; Bayern `45F7B831E8553AA9F5087166B8A62F852E6867936341836A531053CF60B1944A`.

The same date, `tools/build-sprite-transitions.py` became the reproducible runtime build. It inserts three bidirectional motion-compensated in-betweens across every adjacent key pair and the loop seam, restores each authored key at its interval boundary, and downsamples the derived cells to 128 px in premultiplied-alpha space. Delivery PNGs retain full RGBA with zero RGB behind fully transparent pixels, avoiding the dark fringes and hard alpha steps caused by palette reduction. The resulting atlases contain 24 frames per Merkel row and 32 frames per Merz, Bayern, and Alice row while staying within a 4096 px texture width. Current runtime SHA-256 checksums: `merkel-sprite.png` `99A6A88BB6265AE86D7201E64E234F64E095D2410A4439DFE09027D5AD34AC6F`; `border-pourer-sprite.png` `393757071BAEA6372C151616DD269433138D4E61BC8F317FB2050D56DA06EC0A`; `bayern-walker-sprite.png` `1E0D8AED591BC1867D556DDD3B867369A6FA7FFDF719A6AD45DC8A927ABECEDA`; `alice-weidel-sprite.png` `17E66A21C2643404DE05F653CA6DED649413EB6C940F5D88EABFF46ED3E2B9D7`.

On 21 September 2026, OpenAI's built-in image-generation tool created the Alice Weidel satire sprite as a new bitmap asset. The accepted 4×4 proposal shows one angry, shouting, blonde, navy-suited caricature carrying a black-red-gold flag in each hand across 16 discrete walking keys: eight front/down poses followed by eight back/up poses with alternating contact, passing/crossing, and opposite-step leg phases. A targeted identity-preserving edit kept the same face, expression, clothing, two flags, pose order, and gait while only shrinking and repositioning each complete body into safe transparent cells with a stable head, torso, scale, and foot baseline; the prompt explicitly prohibited extra anatomy, flags, grids, text, and cross-cell fragments. `tools/register-sprite-grid.py` reflowed that proposal to the canonical 8×2, 256 px key grid, SHA-256 `4C7E4E0E2FE6EBF2F2B4BD50EF156FCE29CE63195A65F9E317314791249A376D`, before the shared transition builder produced the runtime checksum above. The character is labeled **FIKTIONALE SATIRE**; the generated depiction is not a press photograph or endorsement.

Also on 21 September 2026, OpenAI's built-in image-generation tool created two original ordinary-pedestrian characters retained by the project: male and female towel reservers. The side-view prompts requested one complete transparent character in eight contact/down/passing/up gait phases for both legs, fixed scale and baseline, coherent counter-swinging limbs, one stable towel assignment, and no text, grid, background, clipping, detached anatomy, or cross-cell fragments. Directional identity-preserving prompts then requested eight front/down and eight back/up phases with the same costume, face, body proportions and towel. Raw proposals and six rejected crowd concepts are not shipped.

The two accepted proposals were component-isolated and registered into 8×3 source grids, normalized only before approval, then expanded to 32×3 runtime atlases (96 frames each). Both atlases are bound to the signed anatomy checklist and exact source/runtime hashes in `assets/sprite-sources/verification.json`. Final runtime SHA-256 checksums: `crowd-towel-man.png` `72FB7760C0DED863950989F9B961DA4199DFFDC8FF389C3E2940899E5EA2496`; `crowd-towel-woman.png` `43C41316A445E27E596A6772846879199E7F80BE463B5AE48FE6DDF98377BE6E`.

The same satirical character uses five user-supplied local MP3s from `D:\Downloads\alice\` and `D:\Downloads\alicespeech.mp3`. They were transcribed locally with Whisper `small`, mapped one-to-one to the exact displayed text, and normalized through the project's foreground-audio workflow. Source and shipping checksums, durations, byte sizes, and transcripts are recorded in `assets/voices/LICENSES.md`. No external source URL or redistribution license was supplied, and the recordings are not presented as verified quotations or facts.

Merkel's energy-district dialogue uses short historical quotations attributed to her rather than invented statements. The Atomausstieg/Fukushima lines are documented in the German Bundestag's reports on her 17 March and 9 June 2011 government statements and in the Federal Chancellor's 16 April 2011 video-podcast transcript:

- https://www.bundestag.de/webarchiv/textarchiv/2011/33753604_kw11_regierungserklaerung_japan-204868
- https://www.bundestag.de/webarchiv/textarchiv/2011/34716466_kw23_de_atomgesetz-205630
- https://www.bundesregierung.de/resource/blob/1982118/778888/19eaa23e0b9c94d6921a76e1c36cd108/2011-04-16-text-data.pdf?download=1

Her recurring line, "Wir schaffen das", is a documented historical quote from August 2015. Reference: https://www.bundesregierung.de/breg-de/aktuelles/-vor-allem-ein-satz-des-anpackens--353854

The game uses an approximately one-second excerpt of Merkel saying "Wir schaffen das" from phoenix's recording of the 31 August 2015 press conference. Source recording: https://www.youtube.com/watch?v=kDQki0MMFh4. The normalized shipped excerpt has SHA-256 `7C0C26F1C55D1ECF78FDB5A9D48E6C50A658972F36D42A7994511996A0B083C7`. It is included as a short attributed quotation for the game's satirical interaction; phoenix/rightsholder rights remain unaffected, and redistribution outside this project should be reviewed separately.

Merkel's spontaneous proximity pool also uses the user-supplied 3.030-second
`D:\Downloads\neuland-0-3s.mp3` clip for the displayed line “Das Internet ist
für uns alle Neuland.” No external source URL or redistribution license was
provided. The normalized mono shipping copy at
`assets/voices/merkel/neuland-0-3s.mp3` has SHA-256
`6E6DF76D99DB89E462335AE6A8FB6D7909C0611015B58A98FD9C8A3E0A8CB336`;
separate permission is required before reuse outside this project.

The FAX 3000 PRO advertising claim ("2.75× faster") is entirely fictional game copy.

## Fax billboard artwork

The desktop fax-ad pool uses the simplified **Die neue Faxkraft** and **Fortschritt per Fax** placards from the user-supplied *Germany Simulator — Fax Billboard Pack*. They were resized to 960 × 720 WebP files for the game; the original PNGs are not shipped. The remaining pack variants are not used. The placards are fictional commercial satire, not government advertising or political endorsement. Their external redistribution provenance and license should be confirmed before publishing outside the user's project.

## Title-screen fax-wurst artwork

The transparent title-screen illustration was generated for this project with OpenAI's built-in image-generation tool, then color-traced with VTracer 0.6.15 into `assets/fax-wurst.svg`. No external photograph, logo, or third-party artwork is incorporated, and the generated raster is not part of the runtime.

## Wurst badge photography and history

The nine Wurstsammlerpass badges and collection-card photographs are optimized
local derivatives of Creative Commons images from Wikimedia Commons. The exact
file pages, creators, licenses, conversion notes, and checksums are recorded in
`assets/wurst/LICENSES.md`; the photographers do not endorse this game.

The two-sentence collection histories were checked against the following
sources. Origin stories that the sources describe as legend or tradition are
identified that way in the game:

- Nürnberger Rostbratwurst regulation and geographical protection: https://nuernberger-bratwuerste.de/de/erfahren/nurnberger-bratwurst
- Frankfurter Würstchen history and protected name: https://de.wikipedia.org/wiki/Frankfurter_W%C3%BCrstchen
- First documented Thüringer Rostbratwurst reference: https://www.thueringer-geopark.de/geniessen/geo-und-genussweg
- Munich's qualified account of the Weißwurst legend: https://stadt.muenchen.de/infos/stadtgeschichte.html
- Bockwurst history and Berlin tradition: https://de.wikipedia.org/wiki/Bockwurst
- Knackwurst etymology and regional forms: https://de.wikipedia.org/wiki/Knackwurst
- Mettwurst name and regional forms: https://de.wikipedia.org/wiki/Mettwurst
- Teewurst roots, name, and 1874 production date: https://www.edeka.de/wissen/kuechenwissen/lebensmittellexikon/teewurst/
- Currywurst origin claims and Herta Heuwer: https://www.dpma.de/dpma/veroeffentlichungen/hintergrund/essentrinken/currywurst/index.html

## Einbürgerungstest question source

The roaming quiz encounters lightly adapt a small selection from the Bundesamt für Migration und Flüchtlinge's official **Gesamtfragenkatalog zum Test „Leben in Deutschland“ und zum „Einbürgerungstest“**, dated 7 May 2025. The source task number remains visible on every in-game question card.

- Official catalog: https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Einbuergerung/gesamtfragenkatalog-lebenindeutschland.pdf?__blob=publicationFile&v=22
- BAMF online test center: https://oet.bamf.de/ords/oetut/f?p=514:1

The pedestrians' remarks, Germanness points, police diversion, and all surrounding presentation are fictional satire; they are not part of the official test or BAMF guidance.

The additional 28 B1, B2, and C1 grammar questions are original game writing. They use familiar certificate-style task types but do not reproduce a Goethe, telc, TestDaF, or other real exam item. The contextual level notes were checked against these official sources on 21 September 2026:

- StAG § 10(4), general B1 naturalization language rule and exceptions: https://www.gesetze-im-internet.de/stag/__10.html
- Council of Europe CEFR overview, six levels A1 through C2 and plus levels but no B3: https://www.coe.int/en/web/common-european-framework-reference-languages/introduction-and-context
- Goethe-Zertifikat B1 model speaking module, communicative task and assessment structure: https://bfu.goethe.de/b1_mod/sprechen.php
- TestDaF university-admission guidance, TDN 4 in all sections and institution-specific differentiation: https://www.testdaf.de/de/hochschulen/der-testdaf-und-hochschulen/nachweis-der-deutschkenntnisse-fuer-das-studium/

## Quiz character portraits

OpenAI's built-in image-generation tool created nine original fictional dossier portraits for the roaming quiz: Gisela Becker, Rüdiger Schmidt, Sabine Krüger, Uwe Möller, Brigitte Neumann, Klaus-Dieter Wagner, Heike Hoffmann, Dr. Dietmar Schulz, and Hartmut Keller, the para-polizeiliche Nachbar. On 21 September 2026 the cast was restyled into a raw psychological-expressionist RPG treatment with broken paint planes, mature asymmetrical faces, restrained eyes, straighter noses, emotionally contained bureaucratic expressions, and one clear scenery-free dossier background. Every complete head retains deliberate top clearance. No real person, agency emblem, logo, official uniform, weapon, badge, or readable document was requested or incorporated. The generated PNGs were resized without cropping and encoded as a single 512 × 512 WebP per identity; prompt summaries, file sizes, and SHA-256 checksums are recorded in `assets/quiz-characters/PROVENANCE.md`.

The wrong-answer `Nein! Nein! Nein!` sting was supplied by the user for this integration. Its provenance notice and checksum are recorded in `assets/voices/LICENSES.md`. If the recording cannot load, the game falls back to the browser's installed German speech voice.

## §-power law text

The law-power pool quotes current German federal provisions from the Federal Ministry of Justice and Federal Office of Justice service **Gesetze im Internet**, checked on 20 September 2026. The pool uses the statutory section numbers and wording, including long or obscure provisions rather than popular Internet-law myths.

- Strafgesetzbuch § 183a, Erregung öffentlichen Ärgernisses: https://www.gesetze-im-internet.de/stgb/__183a.html
- Ordnungswidrigkeitengesetz §§ 118 and 127: https://www.gesetze-im-internet.de/owig_1968/__118.html and https://www.gesetze-im-internet.de/owig_1968/__127.html
- Straßenverkehrs-Ordnung §§ 27 and 30: https://www.gesetze-im-internet.de/stvo_2013/__27.html and https://www.gesetze-im-internet.de/stvo_2013/__30.html
- Bürgerliches Gesetzbuch §§ 911, 919, and 961–964: https://www.gesetze-im-internet.de/bgb/__911.html, https://www.gesetze-im-internet.de/bgb/__919.html, and https://www.gesetze-im-internet.de/bgb/__961.html through https://www.gesetze-im-internet.de/bgb/__964.html
- Lebensmittelbestrahlungsverordnung § 3: https://www.gesetze-im-internet.de/lmbestrv_2000/__3.html

## Cutout-rig character artwork

The high-resolution side/front/back parts sheets under
`assets/sprite-sources/rigs/` were created for this project with OpenAI's
built-in image-generation tool using the game's prior registered character
sheets only as identity and rendering-style references. No external photograph,
logo, agency emblem, or third-party sprite pack was requested or incorporated.
The accepted prompt contract, character-specific prop clauses, rejection notes,
and source locations are recorded in
`assets/sprite-sources/rigs/PROVENANCE.md`. The runtime atlases are deterministic
joint-driven renders made locally by `tools/build-rigged-sprite-atlas.py`.

## Görlitzer Park placard sources

The miniature park's cost placard refers to public spending by the CDU-led Berlin Senate (CDU/SPD), not CDU party funds. Sources checked on 26 September 2026:

- **Fence and gates: approximately €1.8 million reported construction cost.** [dpa, 25 February 2026](https://www.zeit.de/news/2026-02/25/warum-berlin-sich-um-einen-zaun-streitet). The earlier [Senate answer 19/22762, p. 2](https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-22762.pdf) put the project estimate at **€1.74 million gross**, including planning, construction, incidental costs and construction security. [Answer 19/24498, p. 3](https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-24498.pdf), dated 14 December 2025, stated that the original estimate was being met; these documents are not an audited final expenditure account.
- **Private security costs reported for 2025 through January 2026: €251,444 net.** This comprises **€192,227 net in 2025** and **€59,217 net in January 2026**. It includes fence/construction protection before the night closures began, so it is not solely patrol spending. [Senate answer 19/25369, p. 3, dated 18 March 2026](https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-25369.pdf).
- **Fence operation and security: €775,000 budgeted in each of 2026 and 2027.** The allocation includes fence operation, service-building rent and guards; it is a budget, not proof of expenditure or a patrol-only total. [Official budget table, p. 3](https://www.parlament-berlin.de/adosservice/19/Haupt/vorgang/h19-2646-v.pdf) and [CDU/SPD amendment explanation, PDF p. 85](https://www.parlament-berlin.de/adosservice/19/Haupt/vorgang/h19-2655.F-1-v.pdf).

These figures must not be added together: their periods, net/gross treatment and scopes differ, with possible overlap in construction security. The miniature's permanently sealed military-style compound and barbed wire are fictional exaggerations. The real policy concerned night closures; on 1 June 2026 the Administrative Court provisionally suspended the closure order because of a jurisdictional procedural defect. [Court press release 26/2026](https://www.berlin.de/gerichte/verwaltungsgericht/presse/pressemitteilungen/2026/pressemitteilung.1676274.php).

## Legal framing

All game rules, wanted levels, immigration deadlines, forms, and enforcement mechanics are fictional parody and do not represent German law, police practice, citizenship requirements, or immigration procedure.
