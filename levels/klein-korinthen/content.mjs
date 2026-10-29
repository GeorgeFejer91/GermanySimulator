export const LIMIT_CM = 30;
export const REQUIRED_REPORTS = 5;
export const SAVE_KEY = 'gta-klein-korinthen-v1';
export const SPAWN = {x: -8, z: 45, yaw: 0};
export const BOUNDS = {minX:-66,maxX:66,minZ:-62,maxZ:62};
export const STATIONS = {
  A0:{id:'A0',x:-26,z:33,support:.18,title:'Antrag auf Antragsberechtigung',short:'A0 · Existenzstelle',sign:'ANTRAGSANNAHME',subtitle:'Anwesenheit nur mit Anwesenheitsgrund.',question:'Warum sind Sie hier?',choices:[['wohnen','Weil ich hier wohne.'],['feststellung','Zur Feststellung meiner Anwesenheit.'],['hilfe','Ich brauche eigentlich nur Hilfe.']],answer:'feststellung',rejection:'Sachverhalte ersetzen keine Begründung. Bitte begründen Sie Ihre Existenz verwaltungstechnisch.',receipt:'A0 erteilt. Ihre Anwesenheit ist vorläufig nicht auszuschließen.',next:'Weiter zum Eichaltar E31, neben dem orangefarbenen Auto.'},
  E31:{id:'E31',x:-8,z:24,support:-.01,title:'Eidesstattliche Zentimetererklärung',short:'E31 · Eichaltar',sign:'EICHALTAR',subtitle:'Der Zollstock glaubt. Sie unterschreiben.',question:'Was ist ein Zentimeter?',choices:[['einheit','Eine Längeneinheit.'],['gefuehl','Ungefähr so viel.'],['genehmigung','Ein genehmigter Abstand zwischen zwei Strichen.']],answer:'genehmigung',rejection:'Messbare Wirklichkeit ist ohne Zuständigkeit nur eine Privatmeinung.',receipt:'E31 erteilt. Der Zollstock ist nun länger zuständig als Sie.',next:'Jetzt fünf verschiedene Überschreitungen messen und melden.'},
  C5:{id:'C5',x:12,z:38,support:-.01,title:'Prüfung der Vollständigkeitsprüfung',short:'C5 · Schlussprüfung',sign:'SCHLUSSPRÜFUNG',subtitle:'Geöffnet bis zum Beginn der Öffnungszeit.',question:'Sind Ihre fünf Meldungen vollständig?',choices:[['ja','Ja.'],['vollstaendig','Die Unvollständigkeit wurde vollständig ausgeschlossen.'],['nachsehen','Sie können doch einfach nachsehen.']],answer:'vollstaendig',rejection:'„Ja“ ist eine Meinung. Nachsehen wäre eine Dienstleistung. Wir benötigen eine Feststellung.',receipt:'C5 erteilt. Die Prüfung wurde ungeprüft geprüft.',next:'Gisela am Vereinsheim darf Sie jetzt abstempeln.'}
};
export const BUREAUCRACY_BULLETINS = [
  'Ruhezeit gilt auch für innere Unruhe.',
  'Der Antrag auf Abschaffung des Antrags ist nur auf Antrag erhältlich.',
  'Ab drei Meldungen ist Ihr Misstrauen gemeinnützig.',
  'Die Digitalisierung wurde ausgedruckt und zur Sicherheit abgeheftet.',
  'Der Dienstweg ist das Ziel. Das Ziel ist heute nicht im Haus.',
  'Fünf Fälle. Die Menschlichkeit kann jetzt geschlossen werden.'
];
export const CAST = {
  dietmar:{name:'Dietmar Kantenreiter',role:'Vorsitzender · DIN ist sein Vorname',x:-11,z:36,column:0,voiceId:'kk-dietmar-kantenreiter'},
  gisela:{name:'Gisela Durchschlag',role:'Schriftführung · dreifach hält besser',x:-20,z:34,column:1,voiceId:'kk-gisela-durchschlag'},
  ronny:{name:'Ronny Restbreite',role:'Kfz-Meister · steht nur ganz kurz',x:32.7,z:-37,column:2,voiceId:'kk-ronny-restbreite'},
  ute:{name:'Dr. Ute Heckenmaß',role:'Beisitz · Fachgebiet Grenzfälle',x:-32,z:-37,column:3,voiceId:'kk-ute-heckenmass'}
};
// x is derived from the road-side curb and the actual body width. One world unit = one metre.
export const CARS = [
  {id:'kk-01',plate:'BAR KL 101',owner:'Familie Blinker',road:0,side:-1,z:26,gap:46,color:0xb56d38,kind:'estate',excuse:'Der steht seit Dienstag nur ganz kurz.'},
  {id:'kk-02',plate:'BAR RU 204',owner:'Frau Pünktlich',road:0,side:1,z:15,gap:18,color:0x51797b,kind:'compact',excuse:'Ordnungsgemäß. Leider kein Anlass zur Freude.'},
  {id:'kk-03',plate:'BAR MM 303',owner:'Herr Nebenan',road:0,side:-1,z:1,gap:67,color:0xe0c695,kind:'van',excuse:'Der Gehweg braucht schließlich auch Privatsphäre.'},
  {id:'kk-04',plate:'BAR EX 404',owner:'Zuzug aus Prenzlauer Berg',road:0,side:1,z:-18,gap:54,color:0x9b4f45,kind:'estate',excuse:'In Berlin war das noch ein Parkplatz.'},
  {id:'kk-05',plate:'BAR DIN 30',owner:'Dr. Heckenmaß',road:-42,side:1,z:-9,gap:30,color:0x57684e,kind:'compact',excuse:'Dreißig ist nicht mehr als dreißig. Das tut weh.'},
  {id:'kk-06',plate:'BAR NA 606',owner:'Herr Auslegung',road:-42,side:-1,z:15,gap:82,color:0x8a87a1,kind:'van',excuse:'Er nennt es Sicherheitsabstand zum öffentlichen Raum.'},
  {id:'kk-07',plate:'BAR JA 707',owner:'Frau Wochenend',road:42,side:1,z:17,gap:39,color:0xc3a444,kind:'compact',excuse:'Neun Zentimeter. Endlich hat der Sonntag einen Sinn.'},
  {id:'kk-08',plate:'BAR OK 808',owner:'Pflegedienst Morgenrot',road:42,side:-1,z:0,gap:12,color:0xe1ddd0,kind:'compact',excuse:'Dieser Mensch hilft anderen. Wir messen trotzdem.'},
  {id:'kk-09',plate:'BAR RR 909',owner:'Ronny Restbreite',road:42,side:1,z:-20,gap:58,color:0x6d879a,kind:'estate',excuse:'Die Bordsteinkante wurde offensichtlich falsch verlegt.'},
  {id:'kk-10',plate:'BAR VK 1',owner:'Dietmar Kantenreiter',road:-42,side:-1,z:34,gap:73,color:0x343b3e,kind:'suv',chairman:true,excuse:'Funktionsbedingter Vorstandsabstand. Sagt der Vorstand.'}
].map(car=>({...car,width:car.kind==='suv'?2:1.8,length:car.kind==='van'?4.8:4.4,x:car.road+car.side*(4-car.gap/100-(car.kind==='suv'?1:.9))}));
export const LINES = {
  welcome:{speaker:'dietmar',de:'Willkommen in Klein-Korinthen. Berlin endet am Ortsschild. Unser Zuständigkeitsgefühl leider nicht.',en:'Welcome to Klein-Korinthen. Berlin ends at the village sign. Our sense of jurisdiction, unfortunately, does not.'},
  invitation:{speaker:'dietmar',de:'Sie wollen dazugehören? Schön. Freundlichkeit ist kein Aufnahmekriterium. Fünf ordentlich dokumentierte Parkverfehlungen hingegen schon.',en:'You want to belong? Lovely. Friendliness is not an admission criterion. Five properly documented parking offences, however, are.'},
  rule:{speaker:'dietmar',de:'Unsere Vereinssatzung erlaubt dreißig Zentimeter zur Bordsteinkante. Darüber beginnt die Verwahrlosung. Hier ist Ihr Zollstock. Gehen Sie dem Frieden auf den Grund.',en:'Our club rules allow thirty centimetres from the curb. Beyond that lies moral decay. Here is your ruler. Get to the bottom of the peace.'},
  first:{speaker:'dietmar',de:'Der orange Wagen gleich an der Straße. Messen, notieren, melden. Nicht schätzen. Wir sind ein Verein, keine freie Kunstschule.',en:'The orange car by the road. Measure, record, report. No guessing. We are an association, not an experimental art school.'},
  progress:{speaker:'dietmar',de:'Fünf verschiedene Fahrzeuge. Eine Beschwerde fünfmal ist keine Bürgerbeteiligung. Das ist mein Verfahren.',en:'Five different vehicles. One complaint five times is not civic participation. That is my procedure.'},
  giselaIntro:{speaker:'gisela',de:'Ich bin Gisela. Ich führe das Protokoll. Also eigentlich führe ich den Verein. Der Herr mit dem Zollstock ist nur die Außendarstellung.',en:'I am Gisela. I keep the minutes. So, really, I run the association. The man with the ruler is just the public face.'},
  giselaWait:{speaker:'gisela',de:'Fünf belegte Fälle, dann stempeln wir. Ein Verdacht ist keine Anlage. Auch nicht, wenn Sie ihn laminieren.',en:'Five documented cases, then we stamp. A suspicion is not an attachment. Not even laminated.'},
  ronny:{speaker:'ronny',de:'Ich stehe nicht zu weit weg. Die Straße ist zu schmal. Das ist ein kommunales Versagen, kein persönliches.',en:'I am not too far away. The road is too narrow. That is a municipal failure, not a personal one.'},
  ronnyAfter:{speaker:'ronny',de:'Sie haben mich gemeldet? Gut. Dann kann ich der Gemeinde endlich beweisen, dass hier jemand Zeit hat.',en:'You reported me? Good. Now I can finally prove to the council that somebody around here has time.'},
  ute:{speaker:'ute',de:'Meine Hecke ist eins achtzig. Auf beiden Seiten. Ihr Blick darüber ist folglich eine bauliche Veränderung.',en:'My hedge is one metre eighty. On both sides. Looking over it therefore constitutes a structural alteration.'},
  uteHint:{speaker:'ute',de:'Der schwarze Geländewagen gehört dem Vorsitzenden. Der parkt nicht falsch. Der testet unsere Unabhängigkeit. Seit Ostern.',en:'The black SUV belongs to the chairman. He is not parked badly. He is testing our independence. Since Easter.'},
  half:{speaker:'gisela',de:'Die ersten Fälle sind eingegangen. Endlich passiert hier nichts mehr unbeobachtet.',en:'The first cases are in. Finally, nothing happens here unobserved.'},
  five:{speaker:'gisela',de:'Fünf Fälle. Kommen Sie zum Vereinsheim. Ihre soziale Integration kann jetzt aktenkundig werden.',en:'Five cases. Return to the clubhouse. Your social integration can now become a matter of record.'},
  chair:{speaker:'dietmar',de:'Mein Wagen? Das ist kein Parkverstoß. Das ist ein vereinsinterner Belastungstest. Sie haben leider bestanden.',en:'My car? That is not a parking offence. It is an internal stress test. Unfortunately, you passed.'},
  certificate:{speaker:'gisela',de:'Fünf Meldungen, keine Freunde. Sie sind angekommen. Hiermit ernenne ich Sie zum ordentlichen Mitglied mit außerordentlichem Mitteilungsbedürfnis.',en:'Five reports, no friends. You have arrived. I hereby appoint you an ordinary member with an extraordinary urge to inform.'},
  epilogue:{speaker:'dietmar',de:'Nächsten Sonntag messen wir, ob die Gartenzwerge ausreichend Abstand voneinander halten. Gemeinschaft braucht Grenzen.',en:'Next Sunday we measure whether the garden gnomes maintain adequate distance from one another. Community needs boundaries.'}
};
Object.assign(LINES,{
  application:{speaker:'gisela',de:'Bevor Sie etwas beantragen, beantragen Sie bitte die Berechtigung, etwas zu beantragen. Automat links. Wenn er Sie ablehnt, haben Sie immerhin schon einen Vorgang.',en:'Before applying for anything, apply for permission to apply. Machine on the left. If it rejects you, at least you will already have a case.'},
  calibration:{speaker:'dietmar',de:'Ein ungeeichter Zollstock ist ein Lineal mit politischen Ansichten. Gehen Sie zum Eichaltar. Dort wird aus Länge endlich Zuständigkeit.',en:'An uncertified folding ruler is a ruler with political opinions. Go to the calibration altar. There, length finally becomes jurisdiction.'},
  reviewRequired:{speaker:'gisela',de:'Fünf Meldungen reichen selbstverständlich nicht. Es fehlt die Prüfung, ob fünf Meldungen reichen. Der Schlussprüfer steht drüben. Er ist ein Automat. Also praktisch unkündbar.',en:'Five reports are obviously not enough. We still need the review of whether five reports are enough. The final auditor is over there. It is a machine. Effectively impossible to dismiss.'},
  finalAudit:{speaker:'gisela',de:'Ihre Existenz ist erfasst. Ihr Zollstock ist vereidigt. Ihre Prüfung ist geprüft. Jetzt fehlt nur noch ein Mensch, der das alles für normal hält. Herzlichen Glückwunsch. Das sind Sie.',en:'Your existence is recorded. Your ruler has taken its oath. Your review has been reviewed. All we need now is someone who considers this normal. Congratulations. That is you.'},
  nightmare:{speaker:'ute',de:'Das Archiv wächst jede Nacht um eine Etage. Man hat einmal versucht, es abzureißen. Der Antrag auf Abriss trägt jetzt das Dach.',en:'The archive grows by one storey every night. Someone once tried to demolish it. The demolition application now supports the roof.'},
  machine:{speaker:'ronny',de:'Früher hatten wir hier einen Menschen am Schalter. Den haben wir durch einen Stempel ersetzt. Seitdem sind die Gespräche deutlich persönlicher.',en:'We used to have a person behind that counter. We replaced him with a stamp. The conversations have been much more personal ever since.'}
});
export const SIGN_TEXTS = [
  ['KLEIN-KORINTHEN','Hier kennt jeder Ihre Angelegenheiten.'],
  ['VEREINSHEIM','Verein zur Wahrung des rechten Winkels e. V.'],
  ['RUHEZEIT','13–15 Uhr · Auch innerlich.'],
  ['AM GUTEN GRUND','Privatweg für öffentliche Meinungen'],
  ['GARTENORDNUNG','Wildwuchs nur nach Anmeldung.'],
  ['RONNYS WERKSTATT','Das war vorher schon so.']
];
