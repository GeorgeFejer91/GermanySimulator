# Germany Simulator credits

## 3D buildings

Six building meshes are selected from Kenney's **City Kit Commercial 2.1** and recolored at runtime into the game's gray municipal palette. The original models are released under CC0 1.0; attribution is appreciated but not required.

- Source: https://kenney.nl/assets/city-kit-commercial
- Creator: Kenney, https://kenney.nl/
- Local license copy: `assets/models/kenney-commercial/LICENSE.txt`

## Perimeter trains and station announcements

Eight fictional `AMT-BAHN` consists use three compact models from Kenney's
**Train Kit 1.1**. The models and their shared color map are released under
CC0 1.0. The game repeats this bounded subset across two continuous rounded
perimeter loops; the Canvas renderer keeps a procedural red-and-white fallback.

- Source: https://kenney.nl/assets/train-kit
- Creator: Kenney, https://kenney.nl/
- Local file and checksum record: `assets/models/kenney-trains/LICENSES.md`

No Deutsche Bahn or Märklin logo, branded texture, voice recording, or cloned
announcer voice is bundled. Nearby trains instead use the browser's installed
German speech voice to read an original fictional announcement whose exact text
is displayed simultaneously. No extra recording or voice model is needed. The
operational phrase pool was checked against public explanations of common rail
announcements; the game recombines those short generic terms with invented
destinations, platforms, and delay lengths.

- VCD explanation of announcement categories: https://www.vcd.org/artikel/was-bedeuten-die-durchsagen-und-stoermeldungen-der-bahn/
- Travelbook explanation with Deutsche Bahn spokesperson context: https://www.travelbook.de/reisen/zugreisen/verspaetungsdurchsagen-deutsche-bahn
- T-Online overview of common disruption wording: https://www.t-online.de/leben/reisen/reisetipps/id_92315944/bahnansagen-was-bedeuten-verzoegerungen-im-betriebsablauf-und-co-.html
- Deutsche Bahn explanation of connection-wait decisions: https://www.bahn.de/service/fahrplaene/anschlusszug-wartet-nicht

The deliberately excessive excuse library is made of newly written satirical
lines inspired by passenger reports in the following community threads. These
posts are anecdotes, not verified Deutsche Bahn records. The game therefore
labels every such line `COMMUNITY-ANEKDOTE · FIKTIONALISIERT` and does not quote
the posts verbatim.

- Reddit r/bahn, absurd or funny reported delay reasons: https://www.reddit.com/r/bahn/comments/1v5cavy/was_war_der_absurdeste_lustigste_grund_f%C3%BCr_eine/
- Reddit r/bahn, older collection including reported children, donkeys, horses, and a pony at railway facilities: https://www.reddit.com/r/bahn/comments/1c4toi4/kurioselustige_gr%C3%BCnde_warum_euer_zug_ausgefallen/
- Reddit r/deutschebahn, reported delay announcements: https://www.reddit.com/r/deutschebahn/comments/1rla2lw/was_sind_eure_besten_versp%C3%A4tungsaussagen/
- Reddit r/deutschebahn, newer collection including chicks, implausible snow, split-consist timing, and a broken driver's seat: https://www.reddit.com/r/deutschebahn/comments/1vqolmd/lustigste_bahn_versp%C3%A4tungs_erkl%C3%A4rungen/
- Reddit r/drehscheibe, discussion of an automatic delay forecast with no remaining reason: https://www.reddit.com/r/drehscheibe/comments/1u5wdr9/schreib_das_system_das_automatisch_wenn_eine/
- LEO forum, collected unusual rail announcements: https://dict.leo.org/forum/viewGeneraldiscussion.php?idForum=9&idThread=1226524&lang=de&lp=ende
- Vielfliegertreff forum, reported zero-minute delay and wrong-track announcements: https://www.vielfliegertreff.de/forum/threads/deutsche-bahn-frust-aber-auf-amuesante-art-und-weise.5668/

The `spielende Kinder im Gleis` rewrite preserves the safety closure as the
serious part and satirizes only its invented administrative follow-up. The
Federal Police warns that tracks are not play areas, that trains cannot evade
obstacles, and that entering railway facilities is life-threatening:
https://bundespolizei.de/aktuelles/meldungen/sicherheit-auf-bahnanlagen

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

The soundtrack opens with the user-supplied in-game recording at `assets/intro-song.mp3`. The shipped copy removes exactly the first 24.000 seconds, preloads and attempts playback immediately on page entry, plays once, and then hands off to the synthesized catalog. When a browser blocks audible autoplay, the preloaded intro retries from its beginning on the first click or key press. Its source SHA-256 is `a7e09bb04fbf6e53d6801573adf4c872276a8504e4ddb9831b2aaf15d6f4a1c1`; the trimmed 192 kbps shipped file SHA-256 is `3299445bd44efb0035e678cb9ae8d7d47480cf0af10c3cfac9631f40962d7f73`. External redistribution rights for the user-supplied recording should be confirmed before publishing outside this project.

After the intro, the continuously rotating background catalog is synthesized at runtime with the Web Audio API. It ducks beneath spoken form readout and continues without an intentional gap while music is enabled. Every next track is a weighted random choice with no immediate repeat. The national anthem, Erika, Badnerlied, Württembergerlied, and other ceremonial or hymn-like selections receive most of the weight while all 26 arrangements remain available. The softened synthesis uses a lower-octave triangle-wave lead, sine-wave bass, restrained synthetic percussion, and a low-pass filter. No lyrics, MIDI files, or sheet-music files are bundled for the synthesized catalog.

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
- SHA-256: `c5f2ffd2b9349960fc77dfd2db9f53ab2ed5ad59bcb82cca2fe3dfc45ca238b7`

## Phone tilt

The same-device tilt controls adapt ECGaming's existing phone-tilt principles: screen-orientation-aware gravity projection, explicit permission where required, neutral calibration, deadzone, smoothing, stale-input release, and keyboard/touch fallback.

## Political satire

The stylized Friedrich Merz poster is a simple code-drawn satirical prop. It does not reproduce a press photograph and does not make a factual claim, endorsement, or recommendation about him.

The animated border-pourer sprite sheet was supplied by the user for this integration and is labeled **FIKTIONALE SATIRE** in-game. Its external redistribution provenance and license should be confirmed before publishing outside the user's project.

The roaming Angela Merkel sprite sheet was supplied by the user for this integration and is labeled **SATIRE** in-game. Its external redistribution provenance and license should be confirmed before publishing outside the user's project.

The fictional roaming Bayern-Beauftragter uses a user-supplied character sheet as its visual reference. Its production walk atlas was expanded from 5×4 to 8×4 and deterministically repacked into equal 256×256 transparent cells. Its eight proximity lines are coherent excerpts from the user's local Bayern recording, selected from a local Whisper transcript and cut with FFmpeg. Source and shipped-audio checksums, exact transcripts, and cut intervals are recorded in `assets/voices/LICENSES.md`; external redistribution rights for the user-supplied inputs should be confirmed before publishing outside this project.

On 20 September 2026, OpenAI's built-in image-generation tool produced three supplemental transparent transition sheets using the existing Merkel, Merz, and Bayern atlases as strict identity and style references. Each prompt requested exactly three sequential in-between walking poses per existing direction/action row, visible alternating leg positions, consistent baseline and padding, unchanged clothing and props, and no text, grid, background, cropping, or extra characters. The generated poses were interleaved with every original key pose, deterministically repacked into the final 6×5 Merkel, 8×6 Merz, and 8×4 Bayern atlases, then palette-optimized. Final SHA-256 checksums: `merkel-sprite.png` `DA7958640D759A297B126E09AFC0ADDB57A7DEE2DA62DCC8C2E5E138703791DF`; `border-pourer-sprite.png` `0AC1D55CDDA589BF6A33EEE2B1CECBF29473F5BF3755D5639FD2ADFD69D71876`; `bayern-walker-sprite.png` `9963C2AAFC605867A87C54807736521F4BDC7309B9502C0C3B259631706C16F2`.

Merkel's energy-district dialogue uses short historical quotations attributed to her rather than invented statements. The Atomausstieg/Fukushima lines are documented in the German Bundestag's reports on her 17 March and 9 June 2011 government statements and in the Federal Chancellor's 16 April 2011 video-podcast transcript:

- https://www.bundestag.de/webarchiv/textarchiv/2011/33753604_kw11_regierungserklaerung_japan-204868
- https://www.bundestag.de/webarchiv/textarchiv/2011/34716466_kw23_de_atomgesetz-205630
- https://www.bundesregierung.de/resource/blob/1982118/778888/19eaa23e0b9c94d6921a76e1c36cd108/2011-04-16-text-data.pdf?download=1

Her recurring line, "Wir schaffen das", is a documented historical quote from August 2015. Reference: https://www.bundesregierung.de/breg-de/aktuelles/-vor-allem-ein-satz-des-anpackens--353854

The game uses an approximately one-second excerpt of Merkel saying "Wir schaffen das" from phoenix's recording of the 31 August 2015 press conference. Source recording: https://www.youtube.com/watch?v=kDQki0MMFh4. The excerpt is included as a short attributed quotation for the game's satirical interaction; phoenix/rightsholder rights remain unaffected, and redistribution outside this project should be reviewed separately.

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

The wrong-answer `Nein! Nein! Nein!` sting was supplied by the user for this integration. Its provenance notice and checksum are recorded in `assets/voices/LICENSES.md`. If the recording cannot load, the game falls back to the browser's installed German speech voice.

## §-power law text

The law-power pool quotes current German federal provisions from the Federal Ministry of Justice and Federal Office of Justice service **Gesetze im Internet**, checked on 20 September 2026. The pool uses the statutory section numbers and wording, including long or obscure provisions rather than popular Internet-law myths.

- Strafgesetzbuch § 183a, Erregung öffentlichen Ärgernisses: https://www.gesetze-im-internet.de/stgb/__183a.html
- Ordnungswidrigkeitengesetz §§ 118 and 127: https://www.gesetze-im-internet.de/owig_1968/__118.html and https://www.gesetze-im-internet.de/owig_1968/__127.html
- Straßenverkehrs-Ordnung §§ 27 and 30: https://www.gesetze-im-internet.de/stvo_2013/__27.html and https://www.gesetze-im-internet.de/stvo_2013/__30.html
- Bürgerliches Gesetzbuch §§ 911, 919, and 961–964: https://www.gesetze-im-internet.de/bgb/__911.html, https://www.gesetze-im-internet.de/bgb/__919.html, and https://www.gesetze-im-internet.de/bgb/__961.html through https://www.gesetze-im-internet.de/bgb/__964.html
- Lebensmittelbestrahlungsverordnung § 3: https://www.gesetze-im-internet.de/lmbestrv_2000/__3.html

## Legal framing

All game rules, wanted levels, immigration deadlines, forms, and enforcement mechanics are fictional parody and do not represent German law, police practice, citizenship requirements, or immigration procedure.
