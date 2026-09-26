(function(){
"use strict";

// Runtime and durable transcript authority for spoken foreground audio.
// Background music and non-verbal effects are deliberately excluded.
const pools=Object.freeze({
 police:Object.freeze([
  "Stop! Stop immediately!",
  "Stay off the grass, please!",
  "ID card, identification, anything official!",
  "Please leave the green area immediately!",
  "This is really not how this is supposed to work!",
  "Stay behind the line!"
 ]),
 jaywalker:Object.freeze([
  "Think of the rules! The zebra crossing is right there!",
  "Think of the children! That is no way to cross a street!",
  "Disgraceful! You ignored the officially marked white stripes!",
  "Are you blind?! Use the official crossing!",
  "Unbelievable! First look, then cross according to procedure!",
  "Road hooligan! Nobody approved this crossing!"
 ]),
 sidewalk:Object.freeze([
  "Stop! You are standing in the standardized sidewalk profile!",
  "Stop! You are blocking the passage according to my interpretation!",
  "You are in the way. Administratively speaking, I was here first!",
  "Have you already done your sweeping duty? Then respect the sidewalk rules!",
  "Life is not a pony farm. Get out of my walking line!",
  "Are you blind? This is clearly my sidewalk!"
 ]),
 grass:Object.freeze([
  "Stop! Get off the grass immediately!",
  "Stop! The lawn is for looking at, not walking on!",
  "Do you have a permit to step on the blades of grass? Of course not!",
  "Now we have a fine mess, and you are standing in the middle of the green area!"
 ]),
 road:Object.freeze([
  "Stop! Get off the roadway!",
  "Stop! The zebra crossing is right there!",
  "Road hooligan! Your crossing angle is completely unauthorized!",
  "Are you blind? Get off the street!"
 ]),
 towelMan:Object.freeze([
  "This place has been reserved since 7:04 a.m. by a textile declaration of intent.",
  "Please keep your distance: the towel is currently in preliminary proceedings."
 ]),
 towelWoman:Object.freeze([
  "The lounger is not free; the reservation is only drying briefly.",
  "Your shadow falls within my officially pre-booked sun corridor."
 ]),
 npc:Object.freeze([
  "Well, that is really not how this was intended.",
  "You can do that. But you really do not have to.",
  "I do not want to complain, but I am complaining.",
  "There is certainly a form for that.",
  "There used to be less procedure here.",
  "You are standing very slightly in the way.",
  "That is probably because of the construction site. It has been there since 2009.",
  "I am not responsible for that.",
  "There does have to be order.",
  "Do you have an appointment for that?"
 ]),
 innerMonologues:Object.freeze({
  train:Object.freeze([
   "Of course I miss the train. Even my failure is delayed.",
   "I cannot even catch a train that is itself late.",
   "The train finds its way. I cannot even find the platform."
  ]),
  wrongOffice:Object.freeze([
   "Great. Wrong office. I cannot even get my own jurisdiction right.",
   "Another door, another proof that I cannot get anything done administratively.",
   "Maybe I am not lost. Maybe I have simply been filed incorrectly."
  ]),
  bicycle:Object.freeze([
   "Of course I am standing in the cycle lane. I cannot even fail in the correct lane.",
   "Even a bicycle has more direction in life than I do."
  ]),
  fax:Object.freeze([
   "I will never amount to anything, except perhaps a neatly filed error.",
   "The fax machine has a clearer purpose than I do.",
   "Paper in, dignity out. At least the procedure works."
  ]),
  coffee:Object.freeze([
   "Not even the coffee machine wants to be responsible for me.",
   "Great. Even the machine deserves more of a break than I do."
  ]),
  pfand:Object.freeze([
   "Not even an empty returnable bottle. I bring literally nothing of value.",
   "The machine recognizes no value. A fair assessment, honestly."
  ]),
  wrongTask:Object.freeze([
   "Of course this is not my procedure yet. Nothing is ever my procedure except failure.",
   "I cannot even be under the wrong jurisdiction at the correct time."
  ]),
  lost:Object.freeze([
   "Nobody here is responsible. I am probably not responsible for anything either.",
   "At this rate I will never amount to anything—except an open procedure.",
   "Not even getting lost follows an approved procedure for me."
  ]),
  exhaustion:Object.freeze([
   "Of course I am exhausted. Other people achieve things; I merely administer my failure.",
   "My energy is gone. The disappointment remains fully operational."
  ]),
  deadline:Object.freeze([
   "Another day lost. I am even late for my own failure.",
   "One fewer day of administration, still no discernible development."
  ])
 }),
 quizApproaches:Object.freeze([
  "Ah, you are not from here, are you? Then one completely ordinary test question.",
  "No, but where are you originally really from? Never mind. Citizenship test!",
  "Your gait looks conspicuously international. One random test question, please.",
  "Oh, what a lovely name! How do you pronounce it? Really like that? Am I doing it correctly, or is the name broken? Anyway.",
  "You have a very pleasant pronunciation. Almost official. One small question.",
  "Your German already sounds rather convincing. Let us verify that quite casually.",
  "What a lovely name. Is the pronunciation correct, or does it need a DIN standard? Never mind.",
  "You look exceptionally naturalized today. Just one random check.",
  "Your jacket is very orderly. Even the buttons look responsible. Speaking of which.",
  "You have lived here so long and still do not know whether Flanschdichtungsprüfprotokoll takes der, die, or das? Really?",
  "So many years in Germany and still unsure of the article for Zwischenfeststellungsverfügung? Interesting.",
  "You have such a trustworthy form-face. One small test question cannot hurt.",
  "How lovely that you are trying it in German. With enough practice it may eventually sound intentional.",
  "Your German is really brave. The grammar has clearly not discouraged you.",
  "People can usually understand what you mean. That is already something.",
  "You have such a charming international speech rhythm. Proper German is only a few decades away.",
  "You use der, die, and das so wonderfully creatively. Language thrives on surprises, after all.",
  "Very sweet how you attempt subordinate clauses. The verb will surely find its way home eventually.",
  "Your pronunciation is truly adorable. One can immediately hear how much effort occurred.",
  "You speak remarkably well for someone who learned it later. Not yet official, but touching.",
  "In short sentences you sound almost local. Compliments.",
  "Your vocabulary is impressive; sometimes even the words fit.",
  "It is lovely how hard you try. Proper German may arrive with the next registration.",
  "Your accent gives every form personality. We still need German for the approval.",
  "You say ‘Eichhörnchen’ with so much confidence. Accuracy would only make it less charming.",
  "Your cases are wonderfully flexible. Dative, accusative—why decide so early?",
  "Your German has improved greatly. One can now roughly identify what you want.",
  "How international! You put foreign words exactly where German proficiency would normally go.",
  "You have a beautiful relationship with the German language: very distant, but respectful.",
  "Do not worry about the mistakes; everybody else notices them for you.",
  "Your integration is visible in every carefully guessed article.",
  "You speak enough German to know that you should learn more. That is practically B2."
 ]),
 railLaw:Object.freeze([
  "Railway Construction and Operating Regulations, Section 62(2): ‘Remaining within the tracks is not permitted.’ Game notice: Please clear the route.",
  "Railway Construction and Operating Regulations, Section 63(2): ‘A sufficient distance must be kept from the tracks.’ Game notice: Your personal distance currently amounts to a train jam.",
  "Railway Construction and Operating Regulations, Section 64 prohibits ‘creating obstacles to railway traffic or undertaking other actions that disrupt or endanger operations.’ This is a game notice, not legal advice."
 ]),
 lawPower:Object.freeze([
  "Section 183a of the German Criminal Code · Causing a public nuisance: Anyone who publicly performs sexual acts and thereby intentionally or knowingly causes a nuisance is punishable by imprisonment for up to one year or a fine, unless the act is punishable under Section 183.",
  "Section 118(1) of the Administrative Offences Act · Public nuisance: An administrative offence is committed by anyone who performs a grossly improper act capable of annoying or endangering the public and impairing public order.",
  "Section 127(1) of the Administrative Offences Act · Making or using items capable of being used to counterfeit money or documents: An administrative offence is committed by anyone who, without written permission from the competent authority or another authorized party, produces, obtains for themselves or another, offers for sale, stores, supplies to another, imports, or exports forms for public documents or authentication marks.",
  "Section 27(4) of the Road Traffic Regulations · Organized groups: The lateral boundary of closed groups riding or marching on foot must, where necessary under Section 17(1), be marked at least at the front by non-dazzling lamps with white light and at the rear by lamps with red light or yellow flashing light.",
  "Section 27(6) of the Road Traffic Regulations · Organized groups: Marching in step is not permitted on bridges.",
  "Section 30(1) of the Road Traffic Regulations · Environmental protection and Sunday and public-holiday driving ban: Needless driving back and forth within built-up areas is prohibited if it annoys others.",
  "Section 911 of the German Civil Code · Fallen fruit: Fruit that falls from a tree or shrub onto neighboring land is deemed to be fruit of that land.",
  "Section 919(3) of the German Civil Code · Boundary marking: The costs of marking the boundary must be borne equally by the parties unless their legal relationship provides otherwise.",
  "Section 961 of the German Civil Code · Loss of ownership of bee swarms: If a swarm of bees flies away, it becomes ownerless unless the owner pursues it without delay or abandons the pursuit.",
  "Section 962 of the German Civil Code · Owner's right of pursuit: The owner of the bee swarm may enter another person's land while pursuing it. If the swarm enters an unoccupied hive belonging to another, the swarm's owner may open the hive and remove or break out the combs in order to capture it. The owner must compensate for the resulting damage.",
  "Section 963 of the German Civil Code · Merger of bee swarms: If escaped swarms belonging to several owners merge, the owners who pursued their swarms become co-owners of the captured combined swarm; their shares are determined by the number of pursued swarms.",
  "Section 964 of the German Civil Code · Mixing of bee swarms: If a swarm enters an occupied hive belonging to another, ownership and other rights in the bees already occupying the hive extend to the incoming swarm. Ownership and other rights in the incoming swarm expire.",
  "Section 3(2) of the Food Irradiation Ordinance · Ordinance on treating food with electron, gamma and X-rays, neutrons, or ultraviolet rays: The information required under paragraph 1 must be clearly visible, readily legible, and indelibly displayed."
 ])
});

const quizContexts=Object.freeze({
 civic:"For naturalization, Section 10(4) StAG generally names B1; this civics question is still not a language test, and this is not legal advice.",
 traffic:"Real study helps with a driving licence; this hedgehog-and-lamination question is explicitly not a real exam item.",
 "grammar-b1":"You want German citizenship? Section 10(4) StAG generally names B1. Now prove it with an original game exercise.",
 "grammar-b2":"You want vocational training or a job? B2 may be required, but not across the board. The specific provider adores specific evidence.",
 "grammar-c1":"You want to attend university? The specific university certificate matters; TestDaF TDN 4 in every section generally qualifies for unrestricted admission."
});

const questions=Object.freeze({
 "24":"How many federal states does the Federal Republic of Germany have?",
 "25":"Which of these is not a federal state of the Federal Republic of Germany?",
 "29":"Which animal is the heraldic animal of the Federal Republic of Germany?",
 "40":"With which words does the German national anthem begin?",
 "57":"Who is usually elected President of the German Bundestag?",
 "58":"Who appoints the ministers of the Federal Government in Germany?",
 "69":"The Federal Republic of Germany has a three-tier administrative structure. What is the lowest political tier called?",
 "74":"What is the name of the parliament for all of Germany?",
 "80":"Which court in Germany is responsible for interpreting the Basic Law?",
 "86":"Who elects the Federal President in Germany?",
 "90":"Through which body do the German federal states participate in federal legislation?",
 "102":"What honor can someone receive in the Federal Republic of Germany for special achievement in the political, economic, cultural, intellectual, or social sphere?",
 "103":"What is referred to as a ‘traffic-light coalition’ in Germany?",
 "105":"What is one task of election workers in Germany?",
 "126":"What do eligible voters in Germany receive before an election?",
 "132":"Many people in Germany volunteer in their free time. What does that mean?",
 "140":"What does a lay judge do in Germany?",
 "150":"A court lay judge in Germany is …",
 "183":"When did the ‘economic miracle’ take place in the Federal Republic of Germany?",
 "186":"In 1953 there was an uprising in East Germany that was commemorated by a public holiday for many years. On what date did it occur?",
 "211":"Which politician is associated with the ‘Eastern Treaties’?",
 "230":"The European Parliament is regularly elected every …",
 "234":"Where is one of the seats of the European Parliament?",
 "237":"In 2007, the fiftieth anniversary of the ‘Treaties of Rome’ was celebrated. What did they establish?",
 "238":"In which places does the European Parliament work?",
 "264":"At which festival do people in Germany wear colorful costumes and masks?",
 "266":"When does the statutory quiet period at night begin in Germany?",
 "271":"What is a Christmas custom in Germany?",
 "282":"Which honorary public duty must German citizens perform if requested?",
 "285":"Ms. Frost is permanently employed in an office. Which of these does she not have to pay from her salary?",
 "291":"Why must a tax return state whether a person belongs to a church?",
 "293":"What is an Easter custom in Germany?",
 "294":"Pentecost is a …",
 "296":"What are the last four weeks before Christmas called in Germany?",
 "300":"From which country did the first guest workers come to the Federal Republic of Germany?",
 "FS-01":"A driving-school car ahead of you has driven at exactly 29 km/h in a 30 zone for twelve minutes. What do you do?",
 "FS-02":"You arrive at 2:37 p.m. in a parking space that requires a parking disc. What time do you set on the disc?",
 "FS-03":"At an intersection, a person in a high-visibility vest holds a laminated sign reading ‘I AM IN CHARGE.’ What authority does the sign give them?",
 "FS-04":"One tractor overtakes another with a speed advantage of about one kilometer per hour. How do you react?",
 "FS-05":"A car in a no-stopping zone has a handwritten note saying ‘ONLY VERY BRIEFLY.’ What legal effect does the note have?",
 "FS-06":"The light has been red for 0.8 seconds. Someone behind you is already honking in a very German manner. What must you do?",
 "FS-07":"A cow on a country road looks onto the roadway from the right. Does ‘right before left’ apply to the cow?",
 "FS-08":"While parking, your passenger says, ‘There is still room.’ Who remains responsible for the distance?",
 "FS-09":"A railway-crossing barrier remains closed for an unusually long time. A driver behind you recommends a reverse slalom. What do you do?",
 "FS-10":"A hedgehog in a high-visibility vest slowly crosses the road. What is the appropriate response?",
 "G-B1-01":"Which version is grammatically correct?",
 "G-B1-02":"Complete the sentence: I have lived in Berlin for three years.",
 "G-B1-03":"Which request is polite and correct?",
 "G-B1-04":"Which sentence uses the accusative correctly?",
 "G-B1-05":"Which relative clause is correct?",
 "G-B1-06":"Which sentence uses the perfect tense correctly?",
 "G-B1-07":"Which indirect question is correct?",
 "G-B1-08":"Complete the adjective ending: I need the completed application.",
 "G-B1-09":"Which sentence with ‘although’ is correct?",
 "G-B1-10":"Complete the sentence: Please come with a valid passport.",
 "G-B2-01":"Which sequence of tenses is correct?",
 "G-B2-02":"Which unreal conditional in the past is correct?",
 "G-B2-03":"Which passive construction is correct?",
 "G-B2-04":"Which relative clause with a preposition is correct?",
 "G-B2-05":"Which ‘the more … the more’ construction is correct?",
 "G-B2-06":"Which weak-noun declension is correct?",
 "G-B2-07":"Which nominalization is correct?",
 "G-B2-08":"Which connector fits? The application was complete; nevertheless, it was returned.",
 "G-B2-09":"Which sentence with a pronominal adverb is correct?",
 "G-B2-10":"Which level is not part of the Common European Framework of Reference?",
 "G-C1-01":"Which reported-speech sentence correctly uses Konjunktiv I?",
 "G-C1-02":"Which alternative to the passive voice is correct?",
 "G-C1-03":"Which nominal formulation is correct?",
 "G-C1-04":"Which participial group is correct?",
 "G-C1-05":"Which sentence with ‘without’ is correct?",
 "G-C1-06":"Which sentence with ‘provided that’ is correct?",
 "G-C1-07":"Which multipart conjunction is used correctly?",
 "G-C1-08":"Which formulation with a genitive preposition is correct?"
});

const lines=Object.freeze({
 "GÖRLITZER PARK · MINIATUR. Please enjoy die Grünanlage from outside. Doppelzaun, Stacheldraht, Wachtürme und die permanente Sperre sind übertriebene Spielsatire.":"GÖRLITZER PARK · MINIATURE. Please enjoy the park from outside. The double fence, barbed wire, watchtowers and permanent closure are exaggerated game satire.",
 "REAL COSTS · CDU-geführter Berliner Senat (CDU/SPD). Zaun und Tore kosteten laut dpa vom 25. Februar 2026 knapp 1,8 Millionen Euro. Öffentliche Berliner Mittel, keine Ausgaben der CDU-Parteikasse.":"REAL COSTS · CDU-led Berlin Senate (CDU/SPD). According to dpa on 25 February 2026, the fence and gates cost just under €1.8 million. Berlin public funds, not CDU party funds.",
 "WACHSCHUTZ · Laut Senatsantwort vom 18. März 2026: 192.227 Euro netto für 2025 und 59.217 Euro netto für Januar 2026. Together: 251.444 Euro netto, einschließlich Bau- und Zaunbewachung. Kein reiner Nachtpatrouillen-Betrag.":"SECURITY · The Senate's reply of 18 March 2026 reports €192,227 net for 2025 and €59,217 net for January 2026: €251,444 net together, including construction and fence guards. This is not solely night-patrol spending.",
 "ANNUAL BUDGET · Je 775.000 Euro für 2026 und 2027 sind für Zaunbetrieb, Dienstgebäudemiete und private Wachkräfte eingeplant. Das ist ein Haushaltsansatz, keine belegte Jahresausgabe. Please do not add: Kostenarten und Zeiträume überschneiden sich.":"ANNUAL BUDGET · €775,000 in each of 2026 and 2027 is budgeted for fence operation, service-building rent and private guards. This is a budget, not verified annual expenditure. Do not add these figures: categories and periods overlap.",
 "QUELLEN · Berliner Abgeordnetenhaus: Drucksachen 19/22762 und 19/25369; Haushalt Hauptausschuss 2655 F-1, Seite 85. Der frühere Baukostenrahmen von 1,74 Millionen Euro brutto enthielt bereits Baubewachung. Bau und Wachen daher nicht doppelt zählen.":"SOURCES · Berlin House of Representatives: papers 19/22762 and 19/25369; Main Committee budget report 2655 F-1, page 85. The earlier €1.74 million gross construction estimate already included construction guards. Avoid double-counting construction and security.",
 "REALITY CHECK · In Wirklichkeit ging es um nächtliche Schließungen. Das Verwaltungsgericht setzte die Schließungsanordnung am 1. Juni 2026 vorläufig außer Vollzug. Unsere militärische Dauersperre ist ausdrücklich fiktiv. Park enjoyment: administrativ outsourced.":"REALITY CHECK · The real policy concerned night closures. On 1 June 2026 the Administrative Court provisionally suspended the closure order. Our permanent military compound is explicitly fictional. Park enjoyment: administratively outsourced.",
 "Kurt Georg Kiesinger (1904–1988) trat 1933 in die NSDAP ein. Im Krieg wirkte er an der NS-Auslandspropaganda mit. Nach seinem Aufstieg in der CDU wählte ihn der Bundestag 1966 zum Bundeskanzler.":"Kurt Georg Kiesinger (1904–1988) joined the Nazi Party in 1933. During the war he contributed to Nazi propaganda abroad. After his rise in the CDU, the Bundestag elected him chancellor in 1966.",
 "Im Auswärtigen Amt stieg er zum stellvertretenden Leiter der Rundfunkpolitischen Abteilung auf. Seine Arbeit trug zur Verbreitung der Propaganda des NS-Regimes im Ausland bei.":"In the Foreign Office, he rose to deputy head of the radio policy department. His work helped spread Nazi regime propaganda abroad.",
 "1948 trat er der CDU bei. Von 1949 bis 1958 war er Bundestagsabgeordneter, von 1958 bis 1966 Ministerpräsident von Baden-Württemberg.":"He joined the CDU in 1948. He was a Bundestag member from 1949 to 1958, then minister-president of Baden-Württemberg from 1958 to 1966.",
 "Am 1. Dezember 1966 wählte ihn der Bundestag zum Kanzler der Großen Koalition aus CDU/CSU und SPD. Er amtierte bis 1969. Das Denkmal fragt nach dem Umgang mit personellen Kontinuitäten aus der NS-Zeit.":"On 1 December 1966, the Bundestag elected him chancellor of the CDU/CSU–SPD grand coalition. He served until 1969. This monument asks how postwar Germany dealt with the continuation of careers from the Nazi era.",
 "Berlin liegt hinter der Brandmauer. Ab hier nur noch Deutsch.":"Berlin is behind the Brandmauer. From here onward, German only.",
 "Berlin liegt hinter der Brandmauer. Welcome back. Denglisch ist wieder erlaubt.":"Berlin is behind the Brandmauer. Welcome back. Denglisch is allowed again.",
 "Nein, ich gehe hier nicht weg!":"No, I am not leaving!",
 "Dümmer geht's nicht mehr.":"It cannot get any stupider than this.",
 "Das klappt einfach nicht!":"This simply does not work!",
 "Mist, wieder nichts geschafft.":"Damn, failed to achieve anything again.",
 "Endlich wieder Nachschub!":"Finally, more supplies!",
 "Nein! Nein! Nein!":"No! No! No!",
 "Das Rote Rathaus zu stürmen? Das muss ein Ende haben.":"Storming the Red City Hall? This must come to an end.",
 "Mein Großvater war kein Nationalsozialist, sondern eine beeindruckende Persönlichkeit und ein erfolgreicher Bürgermeister.":"My grandfather was not a National Socialist, but an impressive personality and a successful mayor.",
 "Wir schaffen das.":"We can do this.",
 "Das Internet ist für uns alle Neuland.":"The internet is uncharted territory for all of us.",
 "Sie stehen hinter mir.":"You are standing behind me.",
 "Wir brauchen kein Abschaltgesetz, sondern einen Ausstieg mit Augenmaß.":"We do not need a shutdown law, but a measured phase-out.",
 "Ich habe eine neue Bewertung vorgenommen.":"I have made a new assessment.",
 "Die Risiken der Kernenergie sind nicht beherrschbar.":"The risks of nuclear power cannot be controlled.",
 "Wer das erkennt, muss eine neue Bewertung vornehmen.":"Anyone who recognizes that must make a new assessment.",
 "Wir müssen uns darauf einstellen, dass wir schneller aussteigen.":"We must prepare ourselves to phase out faster.",
 "Wir wollen das schaffen.":"We intend to achieve that.",
 "Und als letzten Punkt: Baden-Württemberg. Ah, nicht Bayern.":"And as the final point: Baden-Württemberg. Ah, not Bavaria.",
 "Wie schön Bayern ist. Geh nach Bayern. In Bayern gibt's Bayern. Nur in Bayern gibt's Bayern.":"How beautiful Bavaria is. Go to Bavaria. Bavaria has Bavaria. Only Bavaria has Bavaria.",
 "Für Bayern ist das wichtig. Stichwort Bayern.":"That is important for Bavaria. Keyword: Bavaria.",
 "Oh ja, man muss Bayern nicht mögen, man muss Bayern leben.":"Oh yes, you do not have to like Bavaria; you have to live Bavaria.",
 "Warum? Weil Bayern.":"Why? Because Bavaria.",
 "Ich will nur eins sagen: Bayern, Bayern, Bayern, Bayern.":"I only want to say one thing: Bavaria, Bavaria, Bavaria, Bavaria.",
 "Ein Bayern kam aus Bayern. Das war die Rettung Bayerns.":"A Bavarian came from Bavaria. That was Bavaria's salvation.",
 "Gott schütze Bayern.":"God protect Bavaria.",
 "Ich liebe Deutschland. Besonders aus der Schweiz.":"I love Germany. Especially from Switzerland.",
 "Adolf Hitler war ein Linker. Die DDR hieß schließlich auch Demokratische Republik. Und Deutsche Leberkäse besteht selbstverständlich aus Leber und Käse.":"Adolf Hitler was a leftist. After all, East Germany was also called a Democratic Republic. And German Leberkäse obviously consists of liver and cheese.",
 "Die Nationalsozialisten waren Sozialisten, sonst hätte man sie ja Nationalirgendwas genannt.":"The National Socialists were socialists; otherwise they would have been called national-something-or-other.",
 "Wir müssen zurück zur traditionellen Familie. Wie genau die aussieht, klären wir dann außerhalb meines Privatlebens.":"We must return to the traditional family. We can clarify exactly what that looks like outside my private life.",
 "Eliten sind das Problem. Aber zum Glück habe ich Wirtschaft studiert, bei Goldman Sachs gearbeitet und wohne in der Schweiz.":"Elites are the problem. But luckily I studied economics, worked at Goldman Sachs, and live in Switzerland.",
 "§-MACHT unlocked. Press § oder Q to quote ein Gesetz!":"Section-sign power unlocked. Press § or Q to quote a law!",
 "§-MACHT freigeschaltet. Drücken Sie § oder Q, um ein Gesetz zu zitieren!":"Section-sign power unlocked. Press § or Q to quote a law!",
 "Black helicopter approved. Der Rasenfall is now airborne!":"Black helicopter approved. The lawn case is now airborne!",
 "Schwarzer Hubschrauber genehmigt. Der Rasenfall wird nun aus der Luft bearbeitet!":"Black helicopter approved. The lawn case will now be handled from the air!",
 "Police car assigned. Please remain exactly where the lawn violation happened!":"Police car assigned. Please remain exactly where the lawn violation occurred!",
 "Streifenwagen zugeteilt. Bitte verbleiben Sie exakt am Ort des Rasenverstoßes!":"Police car assigned. Please remain exactly where the lawn violation occurred!",
 "Administrative contact! Bitte resist the Motorhaube less!":"Administrative contact! Please resist the hood less!",
 "Verwaltungskontakt! Bitte leisten Sie der Motorhaube weniger Widerstand!":"Administrative contact! Please offer less resistance to the hood!",
 "Guten Tag, hello. Bitte waiten Sie, bis Ihr Warten systemseitig confirmed wurde.":"Good day, hello. Please wait until your waiting has been confirmed by the system.",
 "Guten Tag. Bitte warten Sie, bis Ihr Warten verwaltungsintern erfasst wurde.":"Good day. Please wait until your waiting has been recorded internally by the administration.",
 "Bitte every field ausfüllen. Auch die Felder, die später erst relevant werden.":"Please complete every field, including those that will only become relevant later.",
 "Füllen Sie jedes Feld aus. Auch die Felder, deren Zweck sich erst nach der Abgabe ergibt.":"Complete every field, including those whose purpose only becomes apparent after submission.",
 "Your train nach Deutschland is currently thirty-five Minuten delayed.":"Your train to Germany is currently thirty-five minutes late.",
 "Reason: ein previous Vorgang. Thank you for your understanding, maybe.":"Reason: a previous procedure. Thank you for your understanding, maybe.",
 "Der Regionalexpress verspätet sich heute um voraussichtlich 35 Minuten.":"The regional express is expected to be delayed by 35 minutes today.",
 "Grund: vorausgegangener Vorgang. Wir bitten um Verständnis.":"Reason: a preceding procedure. Thank you for your understanding.",
 "This Baustelle is temporary permanent.":"This construction site is temporarily permanent.",
 "Completion is planned for Q4, year currently under review.":"Completion is planned for the fourth quarter of a year currently under review.",
 "Diese Baustelle ist vorübergehend dauerhaft eingerichtet.":"This construction site is temporarily permanent.",
 "Die Fertigstellung ist für das vierte Quartal eines noch zu prüfenden Jahres vorgesehen.":"Completion is planned for the fourth quarter of a year still to be reviewed.",
 "Klingeling. You are standing maybe slightly in the Radweg.":"Ring-ring. You may be standing slightly in the cycle lane.",
 "Please optimize your body position immediately.":"Please optimize your body position immediately.",
 "Klingeling. Sie stehen geringfügig im Radweg.":"Ring-ring. You are standing slightly in the cycle lane.",
 "Bitte korrigieren Sie Ihre Körperposition unverzüglich.":"Please correct your body position immediately.",
 "NEW: FAX 3000 PRO, now officially more future-ready.":"NEW: FAX 3000 PRO, now officially more future-ready.",
 "Printed documents arrive angeblich 2,75× faster.":"Printed documents allegedly arrive 2.75 times faster.",
 "Digitalisierung ist when das Papier schneller ankommt.":"Digitalization is when the paper arrives faster.",
 "NEU: FAX 3000 PRO.":"NEW: FAX 3000 PRO.",
 "Im Spiel angeblich 2,75× schneller beim Versand ausgedruckter Dokumente.":"In the game, allegedly 2.75 times faster at sending printed documents.",
 "Digitalisierung ist, wenn das Papier schneller ankommt.":"Digitalization is when the paper arrives faster.",
 "Ready. Papier inserted. Zukunft started.":"Ready. Paper inserted. Future started.",
 "Please first ausdrucken, unterschreiben, einscannen and then faxen.":"Please first print, sign, scan, and then fax.",
 "Bereit. Papier eingelegt. Zukunft gestartet.":"Ready. Paper inserted. Future started.",
 "Bitte Dokument zuerst ausdrucken, unterschreiben, einscannen und anschließend faxen.":"Please first print, sign, scan, and then fax the document.",
 "Twenty Cent pro Minute. Faxing counts as Fernkommunikation mit Belegpflicht.":"Twenty cents per minute. Faxing counts as documented long-distance communication.",
 "A digital upload is technically leider too modern.":"A digital upload is unfortunately too modern for technical reasons.",
 "20 Cent pro Minute. Faxen gilt als Fernkommunikation mit Belegpflicht.":"Twenty cents per minute. Faxing counts as documented long-distance communication.",
 "Ein digitaler Upload ist leider aus technischen Gründen zu modern.":"A digital upload is unfortunately too modern for technical reasons.",
 "No bottle detected. Insert asset first.":"No bottle detected. Insert asset first.",
 "Bitte nicht gegen den Automaten kick-en.":"Please do not kick the machine.",
 "Keine Flasche erkannt.":"No bottle detected.",
 "Bitte führen Sie zuerst ein pfandpflichtiges Gebinde zu.":"Please insert a container subject to a deposit first.",
 "Ausgezeichnet. Die Mülltonne steht wieder parallel zur gefühlten Bordsteinkante.":"Excellent. The bin is once again parallel to the perceived curb.",
 "Die Stadt ist nun statistisch 14 Prozent weniger individuell.":"The city is now statistically 14 percent less individual.",
 "Stempel B: optische Unbedenklichkeit.":"Stamp B: visual harmlessness.",
 "Gemäß der rein fiktiven Gestaltungsvorschrift ist das Stadtbild zu normieren.":"Under the entirely fictional design regulation, the cityscape must be standardized.",
 "Richten Sie die Mülltonne, die Stühle und die Hecke aus.":"Align the bin, the chairs, and the hedge.",
 "Der politische Aushang ist eine satirische Requisite und keine Tatsachenbehauptung.":"The political poster is a satirical prop, not a factual claim.",
 "Bratwurst +35 Energie. Currywurst +50 Verwaltungsmut.":"Bratwurst grants 35 energy. Currywurst grants 50 administrative courage.",
 "Senf ist kein gültiges Aktenzeichen.":"Mustard is not a valid file reference.",
 "Sie sind hier basically richtig, aber für einen anderen process.":"You are basically in the right place, but for a different procedure.",
 "Try Zuständigkeit. Oder Tuesday. Tuesday ist beliebt.":"Try jurisdiction. Or Tuesday. Tuesday is popular.",
 "Sie sind hier grundsätzlich richtig, aber für einen anderen Vorgang.":"You are basically in the right place, but for a different procedure.",
 "Versuchen Sie es mit Zuständigkeit. Oder Dienstag.":"Try jurisdiction. Or Tuesday.",
 "Spiel-Knast reached. Der Vorgang is now officially abgeschlossen!":"Game jail reached. The procedure is now officially complete!",
 "Spiel-Knast erreicht. Der Vorgang ist nun amtlich abgeschlossen!":"Game jail reached. The procedure is now officially complete!",
 "Der andere Vorgang has priority. Bitte kommen Sie amtlich mit!":"The other procedure has priority. Please come along officially!",
 "Der andere Vorgang hat Vorrang. Bitte kommen Sie amtlich mit!":"The other procedure has priority. Please come along officially!",
 "Welcome in Berlin. Hier reden wir erstmal practical Denglisch.":"Welcome to Berlin. Here we start by speaking practical Denglisch.",
 "Your mission ist simple: become German citizen in drei Behördentagen.":"Your mission is simple: become a German citizen in three days of administration.",
 "Aber careful: more than zweieinhalb Sekunden auf grass or street gibt einen Polizeistern. Use the Zebrastreifen.":"But be careful: more than two and a half seconds on grass or street earns a police star. Use the zebra crossing.",
 "Berlin liegt hinter der Brandmauer. You can cross sie freely.":"Berlin is behind the Brandmauer. You can cross it freely.",
 "Willkommen in Deutschland.":"Welcome to Germany.",
 "Ihr Ziel: Werden Sie innerhalb von drei völlig fiktiven Behördentagen deutscher Staatsbürger.":"Your objective: become a German citizen within three entirely fictional days of administration.",
 "Dazu benötigen Sie vor allem Formulare. Sehr viele Formulare.":"For that, you primarily need forms. A great many forms.",
 "Wer länger als zweieinhalb Sekunden auf Rasen oder Straße bleibt, erhält einen Polizeistern. Benutzen Sie den Zebrastreifen.":"Anyone who remains on grass or roadway for more than two and a half seconds receives a police star. Use the zebra crossing.",
 "Berlin liegt hinter der Brandmauer. Sie ist frei überquerbar.":"Berlin is behind the Brandmauer. It can be crossed freely.",
 "Ey, haben Sie überhaupt das Kleingedruckte gelesen, Dummkopf?":"Hey, did you even read the fine print, dummy?",
 "Englische Untertitel sind äußerst wichtig, insbesondere wenn Sie Deutsch lernen möchten.":"English subtitles are extremely important, especially when you want to learn German.",
 "Aufgrund Ihres bemerkenswerten Lerneifers wird die Verwendung von Untertiteln hiermit genehmigt.":"In recognition of your remarkable eagerness to learn, the use of subtitles is hereby approved.",
 "Wir gratulieren Ihnen zu dieser verwaltungstechnisch ausgezeichneten Entscheidung.":"We congratulate you on this administratively excellent decision."
});

const recordings=Object.freeze({
 "./assets/voices/thorsten-angry-nicht-weg.mp3":Object.freeze({source:"Nein, ich gehe hier nicht weg!",english:"No, I am not leaving!"}),
 "./assets/voices/thorsten-angry-duemmer.mp3":Object.freeze({source:"Dümmer geht's nicht mehr.",english:"It cannot get any stupider than this."}),
 "./assets/voices/thorsten-angry-klappt-nicht.mp3":Object.freeze({source:"Das klappt einfach nicht!",english:"This simply does not work!"}),
 "./assets/voices/thorsten-amused-nachschub.mp3":Object.freeze({source:"Endlich wieder Nachschub!",english:"Finally, more supplies!"}),
 "./assets/voices/thorsten-disgusted-nichts-geschafft.mp3":Object.freeze({source:"Mist, wieder nichts geschafft.",english:"Damn, failed to achieve anything again."}),
 "./assets/voices/thorsten-sleepy-nichts-geschafft.mp3":Object.freeze({source:"Mist, wieder nichts geschafft.",english:"Damn, failed to achieve anything again."}),
 "./assets/voices/quiz-wrong-answer.mp3":Object.freeze({source:"Nein! Nein! Nein!",english:"No! No! No!"}),
 "./assets/merkel-wir-schaffen-das.mp3":Object.freeze({source:"Wir schaffen das.",english:"We can do this."}),
 "./assets/voices/merkel/neuland-0-3s.mp3":Object.freeze({source:"Das Internet ist für uns alle Neuland.",english:"The internet is uncharted territory for all of us."}),
 "./assets/voices/bayern/baden-wuerttemberg-not-bayern.mp3":Object.freeze({source:"Und als letzten Punkt: Baden-Württemberg. Ah, nicht Bayern.",english:"And as the final point: Baden-Württemberg. Ah, not Bavaria."}),
 "./assets/voices/bayern/wie-schoen-bayern-ist.mp3":Object.freeze({source:"Wie schön Bayern ist. Geh nach Bayern. In Bayern gibt's Bayern. Nur in Bayern gibt's Bayern.",english:"How beautiful Bavaria is. Go to Bavaria. Bavaria has Bavaria. Only Bavaria has Bavaria."}),
 "./assets/voices/bayern/stichwort-bayern.mp3":Object.freeze({source:"Für Bayern ist das wichtig. Stichwort Bayern.",english:"That is important for Bavaria. Keyword: Bavaria."}),
 "./assets/voices/bayern/bayern-leben.mp3":Object.freeze({source:"Oh ja, man muss Bayern nicht mögen, man muss Bayern leben.",english:"Oh yes, you do not have to like Bavaria; you have to live Bavaria."}),
 "./assets/voices/bayern/warum-weil-bayern.mp3":Object.freeze({source:"Warum? Weil Bayern.",english:"Why? Because Bavaria."}),
 "./assets/voices/bayern/ich-will-nur-eins-sagen.mp3":Object.freeze({source:"Ich will nur eins sagen: Bayern, Bayern, Bayern, Bayern.",english:"I only want to say one thing: Bavaria, Bavaria, Bavaria, Bavaria."}),
 "./assets/voices/bayern/rettung-bayerns.mp3":Object.freeze({source:"Ein Bayern kam aus Bayern. Das war die Rettung Bayerns.",english:"A Bavarian came from Bavaria. That was Bavaria's salvation."}),
 "./assets/voices/bayern/gott-schuetze-bayern.mp3":Object.freeze({source:"Gott schütze Bayern.",english:"God protect Bavaria."}),
 "./assets/voices/alice-weidel/deutschland-schweiz.mp3":Object.freeze({source:"Ich liebe Deutschland. Besonders aus der Schweiz.",english:"I love Germany. Especially from Switzerland."}),
 "./assets/voices/alice-weidel/hitler-ddr-leberkaese.mp3":Object.freeze({source:"Adolf Hitler war ein Linker. Die DDR hieß schließlich auch Demokratische Republik. Und Deutsche Leberkäse besteht selbstverständlich aus Leber und Käse.",english:"Adolf Hitler was a leftist. After all, East Germany was also called a Democratic Republic. And German Leberkäse obviously consists of liver and cheese."}),
 "./assets/voices/alice-weidel/nationalsozialisten-sozialisten.mp3":Object.freeze({source:"Die Nationalsozialisten waren Sozialisten, sonst hätte man sie ja Nationalirgendwas genannt.",english:"The National Socialists were socialists; otherwise they would have been called national-something-or-other."}),
 "./assets/voices/alice-weidel/traditionelle-familie.mp3":Object.freeze({source:"Wir müssen zurück zur traditionellen Familie. Wie genau die aussieht, klären wir dann außerhalb meines Privatlebens.",english:"We must return to the traditional family. We can clarify exactly what that looks like outside my private life."}),
 "./assets/voices/alice-weidel/eliten-sind-das-problem.mp3":Object.freeze({source:"Eliten sind das Problem. Aber zum Glück habe ich Wirtschaft studiert, bei Goldman Sachs gearbeitet und wohne in der Schweiz.",english:"Elites are the problem. But luckily I studied economics, worked at Goldman Sachs, and live in Switzerland."}),
 "./assets/audio/trains/ice-0815-buxtehude-bahnhofshalle-subtle.mp3":Object.freeze({
  source:"Information zu ICE 0815 nach Buxtehude. Abfahrt ursprünglich um 18.32 Uhr. Heute etwa 45 Minuten später. Grund dafür sind spielende Kinder an den Bahngleisen. Schon wieder spielende Kinder an den Bahngleisen. Oh Mann! Warum wollen Kinder eigentlich immer ausgerechnet an den Bahngleisen spielen? Es gibt doch Spielplätze, Wiesen, Parks, aber nein, Bahngleise, immer Bahngleise. ICE 0815 nach Buxtehude fährt heute voraussichtlich irgendwann, vielleicht weiter.",
  sourceCues:Object.freeze([[0,16,"Information zu ICE 0815 nach Buxtehude. Abfahrt ursprünglich um 18.32 Uhr. Heute etwa 45 Minuten später."],[16,25,"Grund dafür sind spielende Kinder an den Bahngleisen. Schon wieder spielende Kinder an den Bahngleisen. Oh Mann!"],[25,31,"Warum wollen Kinder eigentlich immer ausgerechnet an den Bahngleisen spielen?"],[31,39,"Es gibt doch Spielplätze, Wiesen, Parks, aber nein, Bahngleise, immer Bahngleise."],[39,48,"ICE 0815 nach Buxtehude fährt heute voraussichtlich irgendwann, vielleicht weiter."]]),
  cues:Object.freeze([[0,7.6,"Information about ICE 0815 to Buxtehude."],[7.6,16,"Originally scheduled to depart at 6:32 p.m. Today, about 45 minutes later."],[16,20.4,"The reason is children playing by the railway tracks."],[20.4,25,"Children playing by the tracks again. Oh man!"],[25,31,"Why do children always want to play right by the railway tracks?"],[31,39,"There are playgrounds, meadows, and parks, but no: railway tracks, always railway tracks."],[39,48,"ICE 0815 to Buxtehude is expected to depart at some point today. Perhaps it will continue onward."]])
 }),
 "./assets/audio/trains/ice-0815-marktversagen-bahnhofshalle-subtle.mp3":Object.freeze({
  source:"Information zu ICE 0815 nach Marktversagen Hauptbahnhof, Abfahrt ursprünglich um 18.32 Uhr, heute etwa 64 Minuten später. Grund dafür ist das besondere Geschäftsmodell der Deutschen Bahn. Die Deutsche Bahn ist ein staatseigener Konzern. Das bedeutet, Sie erhalten die legendäre Zuverlässigkeit eines Staatsbetriebs, bei der man sich zuverlässig darauf verlassen kann, dass irgendetwas nicht funktioniert. Und dazu die Preise eines privaten Unternehmens. Das Beste aus zwei Welten. Der Zug ist nicht zuverlässig, aber dafür auch nicht günstig. Ist das nicht wunderbar? Zugausfälle sind Eigenverantwortung. Preiserhöhungen freier Markt. Und für Erneuerungen ist leider niemand zuständig. Aber was wollen Sie machen? Mit dem Auto fahren, fliegen? Das wäre moralisch fragwürdig. Oder vielleicht zu FlixTrain wechseln? Ha, machen Sie das doch. Viel Glück dabei. ICE 0815 nach Marktversagen Hauptbahnhof fährt weiter, sobald geklärt ist, wer für Sie zuständig ist. Nach aktuellem Stand niemand.",
  cues:Object.freeze([[0,16,"Information about ICE 0815 to Marktversagen Central Station. Originally scheduled for 6:32 p.m.; today it is about 64 minutes late."],[16,21,"The reason is Deutsche Bahn's special business model."],[21,25,"Deutsche Bahn is a state-owned corporation."],[25,38,"That means you receive the legendary reliability of a state enterprise, where you can reliably count on something not working."],[38,42,"Along with the prices of a private company."],[42,44,"The best of both worlds."],[44,49,"The train is not reliable, but it is not cheap either."],[49,51,"Is that not wonderful?"],[51,54,"Train cancellations are your own responsibility."],[54,57,"Price increases are the free market."],[57,61,"And unfortunately nobody is responsible for renewals."],[61,63,"But what are you going to do?"],[63,68,"Drive or fly? That would be morally questionable."],[68,71,"Or perhaps switch to FlixTrain?"],[71,74,"Go on, do that. Good luck with it."],[74,84,"ICE 0815 to Marktversagen Central Station will continue once it has been clarified who is responsible for you."],[84,87,"At present: nobody."]])
 }),
 "./assets/audio/trains/ice-0815-stalingrad-bahnhofshalle-subtle.mp3":Object.freeze({
  source:"Information zu ICE 0815 nach Stalingrad. Abfahrt ursprünglich um 18.32 Uhr. Heute etwa 83 Jahre später. Grund dafür ist eine kurzfristige Änderung des Fahrplans. Bitte beachten Sie, der Zielbahnhof heißt inzwischen anders. Die Fahrgastinformation wurde noch nicht aktualisiert. Wir arbeiten daran. Seit geraumer Zeit.",
  cues:Object.freeze([[0,13,"Information about ICE 0815 to Stalingrad. Originally scheduled to depart at 6:32 p.m."],[13,28,"Today, about 83 years later. The reason is a short-notice timetable change. Please note: the destination station now has a different name."],[28,37,"The passenger information has not yet been updated. We are working on it. We have been for some time."]])
 }),
 "./assets/audio/trains/ice-96-oberkaka-bahnhofshalle-subtle.mp3":Object.freeze({
  source:"Die Information zu ICE 96 nach Oberkaka. Dieser Zug fällt heute ab Köln aus. Grund dafür ist die Verbesserung unserer Pünktlichkeitsstatistik. Der Zug hat inzwischen so viel Verspätung, dass es statistisch günstiger ist, ihn einfach nicht mehr fahren zu lassen. Ein ausgefallener Zug kann schließlich nicht zu spät ankommen. Aber Sie schon, bitte verlassen Sie daher den Zug. Der Zug selbst fährt anschließend ohne Sie weiter. Das ist betrieblich sinnvoller für uns. Wir wünschen Ihnen aber noch eine angenehme Weiterreise, wie auch immer Sie das jetzt machen.",
  cues:Object.freeze([[0,7,"Information about ICE 96 to Oberkaka."],[7,10,"This train will terminate at Cologne today."],[10,15,"The reason is an improvement to our punctuality statistics."],[15,23,"The train is now so delayed that, statistically, it is more favorable simply not to run it anymore."],[23,28,"After all, a cancelled train cannot arrive late."],[28,32,"But you can. Please leave the train."],[32,36,"The train itself will then continue without you."],[36,39,"That makes more operational sense for us."],[39,45,"We nevertheless wish you a pleasant onward journey, however you are going to manage that now."]])
 }),
 "./assets/audio/trains/ice-ardorf-hilter-bahnhofshalle-subtle.mp3":Object.freeze({
  source:"Information zum ICE von Ardorf nach Hilter. Abfahrt ursprünglich um 19.45 Uhr. Heute etwa 88 Minuten später. Grund dafür ist eine verspätete Bereitstellung des Zuges. Der Zug beginnt in Ardorf. Er fährt nach Hilter um 19.45 Uhr. Niemand hier hat weitere Fragen gestellt. Das ist vermutlich besser so. Der ICE von Ardorf nach Hilter wird bereitgestellt, sobald jemand herausgefunden hat, wo Ardorf eigentlich ist.",
  cues:Object.freeze([[0,14.5,"Information about the ICE from Ardorf to Hilter. Originally scheduled for 7:45 p.m.; today it is about 88 minutes late."],[14.5,26.8,"The reason is the delayed provision of the train. The train begins in Ardorf. It travels to Hilter at 7:45 p.m."],[26.8,43.8,"Nobody here has asked any further questions. That is probably for the best. The ICE from Ardorf to Hilter will be provided as soon as somebody discovers where Ardorf actually is."]])
 })
});

window.GermanySimulatorAudioText=Object.freeze({
 version:3,
 method:"Known clips use authored/source transcripts; the five station recordings were transcribed and English-segmented locally with OpenAI Whisper small on 2026-09-21, then manually corrected against filenames and audible context.",
 exclusions:Object.freeze(["background-music","sound-effect"]),
 pools,
 quizContexts,
 questions,
 lines,
 recordings,
 series:Object.freeze({
  lawPower:"./assets/voices/laws/thorsten-negative-law-{01..13}.mp3 follows pools.lawPower and game.js lawPowerLines by index.",
  currentRules:"./assets/voices/laws/thorsten-negative-rule-{01..11}.mp3 follows game.js rules and englishText by index."
 })
});
})();
