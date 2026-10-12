(function(){"use strict";
const clerkIdentity=Object.freeze({speaker:"SACHBEARBEITERIN FRAU KNICK",fullName:"Brunhilde Knick",voiceId:"amt-brunhilde-knick"});
const clerks=Object.freeze({
 1:Object.freeze({speaker:"FRAU FRIST",fullName:"Erna Frist",voiceId:"amt-erna-frist"}),
 2:Object.freeze({speaker:"FRAU DURCHSCHLAG",fullName:"Ottilie Durchschlag",voiceId:"amt-ottilie-durchschlag"}),
 3:clerkIdentity,
 4:Object.freeze({speaker:"FRAU ZUSTÄNDIG",fullName:"Hedwig Zuständig",voiceId:"amt-hedwig-zustaendig"})
});
window.BuergeramtStory=Object.freeze({
 playerIdentity:{speaker:"ICH",fullName:"Hans-Peter Mustermann",voiceId:"spieler-hans-peter-mustermann"},
 characters:{
  aktenkurier:{speaker:"DER AKTENKURIER",fullName:"Horst Stempelmann",voiceId:"amt-horst-stempelmann",lines:[
   {line:"Stopp. Sie haben den Aktenlauf ohne Laufzettel gekreuzt. Das gilt als Abkürzung und muss gestempelt werden.",tone:"warning",valence:-.55},
   {line:"Ihr Formular ist jetzt im Umlauf. Bitte bleiben Sie stehen, bis es Sie eingeholt hat.",tone:"procedural",valence:-.18}
  ]},
  archivbotin:{speaker:"DIE ARCHIVBOTIN",fullName:"Gisela Aktenberg",voiceId:"amt-gisela-aktenberg",lines:[
   {line:"Sie stehen vor der Ablage, ohne abgelegt zu sein. Ich setze Ihren Vorgang vorsorglich auf Wiedervorlage.",tone:"dread",valence:-.48},
   {line:"Der Schlüssel passt. Das Schloss stellt noch einen Antrag auf Zuständigkeit.",tone:"procedural",valence:-.16}
  ]},
  formularsammler:{speaker:"DER FORMULARSAMMLER",fullName:"Dieter Papiermann",voiceId:"amt-dieter-papiermann",lines:[
   {line:"Meine Seitenfolge ist nicht genehmigt. Wenn Blatt siebzehn wieder vorn steht, beginnt mein Termin von gestern noch einmal.",tone:"dread",valence:-.72},
   {line:"Die letzte Seite war leer. Frau Knick nennt das ein freies Zeitfenster. Ich nenne es Aussicht.",tone:"relief",valence:.32}
  ]},
  nummernfluesterer:{speaker:"DER NUMMERNFLÜSTERER",fullName:"Rüdiger Nummermann",voiceId:"amt-ruediger-nummermann",lines:[
   {line:"Die Anzeige hat meine Nummer geflüstert, bevor ich sie gezogen habe. Jetzt verlangt sie einen Nachweis, dass ich noch nicht dran bin.",tone:"dread",valence:-.78},
   {line:"Wenn die Zahl wieder rückwärts läuft, bleibe ich hier. Für Fluchtwege ist Schalter zwei zuständig.",tone:"warning",valence:-.51}
  ]},
  nachtschichtmelderin:{speaker:"DIE NACHTSCHICHT-MELDERIN",fullName:"Ingrid Feierabend",voiceId:"amt-ingrid-feierabend",lines:[
   {line:"Mein Telefon ist tot. Die App bestätigt trotzdem, dass ich persönlich anwesend bin. Ich halte das Gerät hoch, damit es mich nicht vergisst.",tone:"dread",valence:-.62},
   {line:"Meine Akte ist lesbar. Das ist offenbar der Formfehler. Ich soll sie noch einmal ausdrucken, bis sie müde aussieht.",tone:"procedural",valence:-.3}
  ]},
  pfandarchitektin:{speaker:"DIE PFANDARCHITEKTIN",fullName:"Bärbel Pfennig",voiceId:"amt-baerbel-pfennig",lines:[
   {line:"Dieser Bon ist länger als der Flur. Die Quittung für die Quittung fehlt noch; ohne sie darf ich den Anfang nicht abreißen.",tone:"procedural",valence:-.45},
   {line:"Vorhin war mein Ordner leichter. Vielleicht hat die Ablage eine Seite behalten. Vielleicht war es meine Hand.",tone:"dread",valence:-.64}
  ]},
  kopiependler:{speaker:"DER KOPIEPENDLER",fullName:"Uwe Kopitz",voiceId:"amt-uwe-kopitz",lines:[
   {line:"Ich habe das Original kopiert, wie verlangt. Jetzt gilt die Kopie als Original und mein Original als verdächtige Zweitschrift.",tone:"warning",valence:-.54},
   {line:"Der Fahrradhelm ist keine Kopfbedeckung. Das hat Schalter vier schriftlich bestätigt; das Schreiben liegt unter dem Helm.",tone:"relief",valence:.15}
  ]},
  warteschlangenpoetin:{speaker:"DIE WARTESCHLANGENPOETIN",fullName:"Hilde Wartenscheidt",voiceId:"amt-hilde-wartenscheidt",lines:[
   {line:"Die Nummer auf meinem Zettel hat sich verdoppelt. Ich soll beweisen, welche Hälfte zuerst gewartet hat.",tone:"dread",valence:-.7},
   {line:"Auf der Rückseite steht endlich ein Satz. Leider ist er nicht unterschrieben, also bleibt er vorläufig ein Geräusch.",tone:"relief",valence:.24}
  ]}
 },
 patrons:{
  "amt-konrad-wohnungszettel":{speaker:"KONRAD WOHNUNGSZETTEL",fullName:"Konrad Wohnungszettel",voiceId:"amt-konrad-wohnungszettel",x:-5.9,z:1.39,lines:[{line:"Ich habe alle Unterlagen dabei. Hoffentlich reicht das.",tone:"dread",valence:-.45}]},
  "amt-mechthild-elternbogen":{speaker:"MECHTHILD ELTERNBOGEN",fullName:"Mechthild Elternbogen",voiceId:"amt-mechthild-elternbogen",x:5.5,z:1.39,lines:[{line:"Ich warte auf die Bestätigung für mein Kind.",tone:"procedural",valence:0}]},
  "amt-wolfram-rentenbescheid":{speaker:"WOLFRAM RENTENBESCHEID",fullName:"Wolfram Rentenbescheid",voiceId:"amt-wolfram-rentenbescheid",x:1.7,z:-1.39,lines:[{line:"Mein Bescheid ist seit drei Wochen unterwegs.",tone:"warning",valence:-.45}]}
 },
 clerkIdentity,clerks,
 ambient:[
  ...["renter","parent","pensioner"].flatMap(actor=>[
   {id:"amt-ambient-termin-"+actor,actor,text:"Mein Termin war gestern. Ich war heute pünktlich.",english:"My appointment was yesterday. I was on time today."},
   {id:"amt-ambient-nummer-"+actor,actor,text:"Mein Buchstabe wurde aufgerufen, aber die Zahl gehört jemand anderem.",english:"My letter was called, but the number belongs to someone else."}
  ]),
  {id:"amt-ambient-original",actor:"clerk-1",text:"Für die Kopie des Originals benötigen Sie das Original der Kopie.",english:"For a copy of the original, you need the original of the copy."},
  {id:"amt-ambient-warteschleife",actor:"clerk-2",text:"Nein, die Warteschleife ist persönlich zu nehmen.",english:"No, the hold queue must be taken personally."},
  {id:"amt-ambient-moment",actor:"clerk-4",text:"Einen Moment. Ich verbinde Sie mit Ihrem Moment.",english:"One moment. I will connect you to your moment."},
  {id:"amt-ambient-abwesenheit",actor:"archivbotin",text:"Ihre Akte ist verschwunden. Bitte bestätigen Sie den Eingang Ihrer Abwesenheit.",english:"Your file has disappeared. Please acknowledge receipt of your absence."},
  {id:"amt-ambient-leerblatt",actor:"formularsammler",text:"Das leere Blatt ist unvollständig. Es fehlt der Nachweis, dass nichts fehlt.",english:"The blank page is incomplete. Proof that nothing is missing is missing."},
  {id:"amt-ambient-nullzettel",actor:"nummernfluesterer",text:"Die Null auf meinem Zettel wartet schon länger als ich.",english:"The zero on my ticket has been waiting longer than I have."},
  {id:"amt-ambient-feierabend",actor:"nachtschichtmelderin",text:"Der Feierabend wurde verlängert. Die Öffnungszeiten bleiben geschlossen.",english:"Closing time has been extended. Opening hours remain closed."},
  {id:"amt-ambient-quittung",actor:"pfandarchitektin",text:"Die Quittung bestätigt nur, dass ich eine Bestätigung beantragt habe.",english:"The receipt only confirms that I applied for a confirmation."},
  {id:"amt-ambient-schatten",actor:"kopiependler",text:"Mein Schatten gilt als Zweitschrift. Jetzt muss er beglaubigt werden.",english:"My shadow counts as a duplicate. Now it has to be certified."},
  {id:"amt-ambient-ende",actor:"warteschlangenpoetin",text:"Das Ende der Warteschlange ist heute nur nach Termin erreichbar.",english:"Today the end of the queue is accessible by appointment only."},
  {id:"amt-ambient-wohnung",actor:"renter",text:"Meine Wohnung ist angemeldet. Ich selbst stehe noch im Flur.",english:"My apartment is registered. I myself am still in the corridor."},
  {id:"amt-ambient-zukunft",actor:"parent",text:"Für die Zukunft meines Kindes fehlt eine Kopie der Vergangenheit.",english:"My child's future is missing a copy of the past."},
  {id:"amt-ambient-lebenszeichen",actor:"pensioner",text:"Mein Lebenszeichen wurde abgelehnt. Es war nicht mehr aktuell.",english:"My sign of life was rejected. It was no longer up to date."},
  {id:"amt-ambient-stempel",actor:"archivbotin",text:"Der Stempel ist ungültig. Seine Gültigkeit wurde noch nicht gestempelt.",english:"The stamp is invalid. Its validity has not been stamped yet."},
  {id:"amt-ambient-weiterwarten",actor:"warteschlangenpoetin",text:"Ich warte auf die Erlaubnis, weiter warten zu dürfen.",english:"I am waiting for permission to keep waiting."}
 ],
 clerkRefusal:"Steht Ihre Nummer auf der Tafel? Nein? Dann treten Sie zurück! Dass ich hier gerade nichts tue, ist eine dienstliche Tätigkeit.",
 omen:{speaker:"DER AKTENKURIER",line:"Wer die Finsternis sieht, hat sie selbst gewählt!",delivery:{rate:.82,pitch:.72,contour:[
  {word:"Wer",tension:.12,semitones:1},{word:"Finsternis",tension:.55,semitones:.5},
  {word:"sieht",tension:.4,semitones:-.3},{word:"hat",tension:.58,semitones:-1},
  {word:"selbst",tension:.85,semitones:-2},{word:"gewählt",tension:1,semitones:-3.2}
 ]}},
 entrance:{speaker:"PFÖRTNERIN",line:"Halt. Sie haben das Bürgeramt betreten, ohne nachzuweisen, dass Sie vorher draußen waren. Ziehen Sie bitte eine Nummer für den Übergang."},
 call:{id:"grass",voiceId:"kriminalpolizei",line:"Hier ist die Kriminalpolizei. Gegen Sie wird wegen unerlaubten Betretens einer Grünfläche ermittelt. Welcher Schuh hat den Rasen zuerst berührt: der linke, der rechte oder beide?",declined:"Sehr gut. In diesem Schalterbereich sind private Anrufe nicht zuständig."},
 police:[
  "Hallo? Das ist kein Kaffeekränzchen. Die Dame am Schalter hält sich bitte heraus. Ich brauche jetzt Ihre Aussage, und zwar...",
  "Frau Knick, wie reizend. Vielleicht bearbeiten Sie gleich Ihre eigene Anzeige. Wer einen Beschuldigten deckt, der...",
  "NEIN, SIE HÖREN JETZT ZU! Ein Grashalm fehlt, und Sie behindern meine Befragung! Noch ein Wort, und ich lasse Ihren ganzen Schalter..."
 ],
 outburst:{speaker:"FRAU KNICK · SCHALTER 3",lines:[
  "Ach, wie schön. Für private Telefonate haben Sie Zeit. Für Ihr Formular offenbar nicht. Ich sitze hier ja nur...",
  "Die Dame hat einen Namen. Frau Knick. Und die Dame bearbeitet hier einen Antrag, während Sie einem Grashalm hinterhertelefonieren. Wenn Sie jetzt bitte...",
  "Sie zeigen meinen Schalter an? Ich bin vierundsiebzig und seit fünfzig Jahren hier! Mein Schalter deckt keinen Rasen. Er deckt Anträge! Jetzt halten Sie doch endlich...",
  "SIE DROHEN MEINEM SCHALTER? DANN VERHAFTEN SIE DOCH DEN LOCHER! Ich lasse mich von Ihnen nicht anschreien!",
  "UND SIE STEHEN HIER NICHT SO UNSCHULDIG! Der Stempel bleibt oben! Ihr Termin ist ANNULLIERT! Raus! Für einen neuen Versuch ziehen Sie draußen eine neue Nummer."
 ],cutAfterMs:[3900,5200,6100],phoneCutAfterMs:[7200,4500,4700,5000],delivery:[{rate:.94,pitch:1},{rate:1.02,pitch:1.04},{rate:1.08,pitch:1.08},{rate:1.15,pitch:1.1},{rate:1.1,pitch:1.08}]},
 phoneWarnings:[
  "Nicht rangehen reicht Ihnen, ja? MIR REICHT ES NICHT! Ihr Telefon klingelt an meinem Schalter! Stellen Sie es LAUTLOS oder schalten Sie es AUS, wenn Sie eine Anmeldung wollen! Wegstecken ist keine Einstellung!",
  "SCHON WIEDER! Habe ich mich undeutlich ausgedrückt? Sie stecken das Telefon weg und lassen es weiterklingeln! LAUTLOS. ODER AUS. Ich bearbeite Ihren Wohnsitz, keine Klingeltonsammlung!",
  "JETZT IST SCHLUSS MIT DEM GEKLINGEL! Solange dieses Ding an meinem Schalter Lärm macht, bleibt mein Stempel oben! Schalten Sie das Telefon aus oder stellen Sie es lautlos. DANN sprechen wir weiter!"
 ],
 registration:{speaker:"SACHBEARBEITERIN FRAU KNICK",first:"presence",totalSteps:24,nodes:{
  presence:{step:1,line:"So. Sie wollen eine Anmeldung. Dann bleiben Sie geistig hier, körperlich hier und telefonisch STILL. Ihre Nummer liegt links, Sie stehen rechts. Was soll ich Ihrer Akte als Beweis der Anwesenheit glauben?",choices:[
   {label:"Die aufgerufene Nummer vorlegen.",reply:"Endlich etwas mit Rand und Ziffern. Ihre Nummer kommt oben auf die Akte. Sie bleiben darunter.",next:"identity",stamp:"Nummer zugeordnet"},
   {label:"Ich stehe doch direkt vor Ihnen.",reply:"Und morgen stehen Sie irgendwo anders. Ihr Gesicht ist kein Ordnungsmerkmal. Legen Sie die Nummer hin!",next:"presenceFix"}]},
  presenceFix:{step:1,line:"Ich habe Ihre Anwesenheit gesehen. Jetzt fehlt der Nachweis, dass ich sie zuordnen darf. Die Nummer liegt in Ihrer Hand. Sie müssen sie nicht philosophisch verteidigen. Was legen Sie hin?",choices:[
   {label:"Die Nummer, mit der Ziffer nach oben.",reply:"Gut. Ihre Anwesenheit hat jetzt eine Ablagekante.",next:"identity",stamp:"Nummer zugeordnet"},
   {label:"Nummer und Terminbestätigung zusammen.",reply:"Zu viel Papier, aber wenigstens das richtige. Die Nummer oben. Der Termin wartet darunter.",next:"identity",stamp:"Nummer zugeordnet"}]},
  identity:{step:2,line:"Identitätsnachweis. Gültiger Pass oder Ausweis, im Original. Nicht Ihr Profilbild, nicht die Erinnerung an einen Pass. Ich will feststellen, wer hier wohnt, bevor ich feststelle, wo dieser Jemand wohnt. Was haben Sie?",choices:[
   {label:"Den gültigen Reisepass im Original.",reply:"Der Pass wird geprüft. Sie sind vorläufig dieselbe Person wie auf der letzten Seite.",next:"name",stamp:"Identität geprüft"},
   {label:"Ein Foto vom Pass auf dem Telefon.",reply:"Ein Foto vom Pass! Soll ich Ihre Anmeldung dann an ein Foto von einer Wohnung schicken? Original her!",next:"identityFix"}]},
  identityFix:{step:2,line:"Der Originalpass steckt in Ihrer Dokumentenmappe. Holen Sie ihn heraus. Ihr Telefon bleibt lautlos. Ich werde die Identität Ihres Ladekabels heute nicht mitprüfen. Wie reichen Sie den Pass?",choices:[
   {label:"Aufgeschlagen zur Datenseite.",reply:"Lesbar. Das ist noch kein Lob. Ihre Identität ist geprüft.",next:"name",stamp:"Identität geprüft"},
   {label:"Zusammen mit dem vorhandenen Ausweis.",reply:"Beide Originale, eine Person. Ich habe Sie gezählt. Einmal reicht.",next:"name",stamp:"Identität geprüft"}]},
  name:{step:3,line:"Auf der Nummer steht Ihr eingetragener Name. Im Pass stehen Ihre amtlichen Namen. Der Schalter ist keine Bühne für einen Künstlernamen. Welche Schreibweise kommt aufs Anmeldeformular?",choices:[
   {label:"Meine Namen genau wie im Pass.",reply:"Auch der Vorname, den Sie angeblich nie benutzen. Das Register benutzt ihn. Es hat Sie nicht gefragt.",next:"movein",stamp:"Namensabgleich"},
   {label:"Nur den Namen, auf den ich höre.",reply:"Das Register ruft Sie nicht zum Abendessen. Übernehmen Sie die amtlichen Namen vollständig!",next:"nameFix"}]},
  nameFix:{step:3,line:"Das Feld heißt Vornamen, mit einem N am Ende. Das hat jemand absichtlich gedruckt. Sie können die Namen aus dem Pass abschreiben oder sie mir zur Übernahme zeigen. Was tun Sie?",choices:[
   {label:"Alle Namen aus dem Pass abschreiben.",reply:"Jetzt passt die Person in das Feld. Den Rest Ihrer Persönlichkeit lassen wir draußen.",next:"movein",stamp:"Namensabgleich"},
   {label:"Die Passdaten gemeinsam abgleichen.",reply:"Ich lese, Sie bestätigen. Ein kooperativer Moment. Bitte gewöhnen Sie sich nicht daran.",next:"movein",stamp:"Namensabgleich"}]},
  movein:{step:4,line:"Einzugsdatum. Ihr Mietvertrag begann am Ersten. Den Schlüssel bekamen Sie am Dritten. Eingezogen sind Sie am Fünften. Drei Daten, aber nur eins wohnt in diesem Feld. Welches?",choices:[
   {label:"Der Fünfte: mein tatsächlicher Einzug.",reply:"Richtig. Gemeldet wird der Einzug. Der Mietvertrag darf sein Datum behalten, aber nicht dieses Feld besetzen.",next:"deadline",stamp:"Einzug festgestellt"},
   {label:"Der Erste: das Datum im Mietvertrag.",reply:"Ihr Vertrag hat am Ersten gewohnt? Mit eigenem Bett? Nein! Wir brauchen den tatsächlichen Einzug!",next:"moveinFix"}]},
  moveinFix:{step:4,line:"Der Schlüssel beweist eine Tür. Der Vertrag beweist eine Vereinbarung. Sie sind am Fünften eingezogen. Welches Datum tragen Sie ein, ohne Ihrer Wohnung zwei Geburtstage zu geben?",choices:[
   {label:"Den Fünften eintragen.",reply:"Gut. Die Tür bleibt älter als Ihr Einzug. Das ist ausnahmsweise zulässig.",next:"deadline",stamp:"Einzug festgestellt"},
   {label:"Den Fünften mit den Unterlagen abgleichen.",reply:"Vertrag und Einzug dürfen verschieden datiert sein. Jetzt ist das ausdrücklich vermerkt.",next:"deadline",stamp:"Einzug festgestellt"}]},
  deadline:{step:5,line:"Sie sind dauerhaft eingezogen. § 17 Bundesmeldegesetz: zwei Wochen ab Einzug. Keine zwei Wochen ab Mut, WLAN oder einem freundlichen Gedanken der Hausverwaltung. Wann beginnt Ihre Meldefrist?",choices:[
   {label:"Mit dem tatsächlichen Einzug.",reply:"Das Datum bleibt. Ich streiche nur Ihren Versuch, daneben ein zweites zu erfinden.",next:"appointment",stamp:"Frist vermerkt"},
   {label:"Sobald der Vermieter das Papier schickt.",reply:"NEIN. Der Vermieter verwaltet keine Zeit! Seine Verzögerung müssen Sie melden, nicht in einen neuen Einzug umbenennen!",next:"deadlineFix"}]},
  deadlineFix:{step:5,line:"Die fehlende Bestätigung verschiebt Ihren Einzug nicht. Halten Sie die Verzögerung und Ihre Anfragen fest. Sagen Sie mir jetzt, was in der Akte als Beginn stehen bleibt!",choices:[
   {label:"Der tatsächliche Einzug bleibt stehen.",reply:"Dann sind wir wieder in derselben Kalenderwoche. Ich notiere die Verzögerung gesondert.",next:"appointment",stamp:"Frist vermerkt"},
   {label:"Einzug und Verzögerung getrennt notieren.",reply:"Zwei Tatsachen, zwei Vermerke. Das hätte Ihr Vermieter ebenfalls begreifen können.",next:"appointment",stamp:"Frist vermerkt"}]},
  appointment:{step:6,line:"Sie haben tagelang die Terminseite neu geladen. Erst keine Termine, dann ein Termin am anderen Ende der Stadt. Jetzt wollen Sie aus einer Fehlermeldung ein Einzugsdatum machen? Was lege ich zur Fristakte?",choices:[
   {label:"Terminbestätigung und Buchungsversuche.",reply:"Ich vermerke die Bemühungen. Der Einzug bleibt der Einzug. Ein Browserfehler ist keine Wohnungsart.",next:"landlord",stamp:"Terminbemühungen erfasst"},
   {label:"Den Einzug auf heute verschieben.",reply:"Sie sind bereits eingezogen! Wenn Sie Ihr Datum ändern, damit es hübscher aussieht, mache ich es Ihnen SOFORT wieder hässlich!",next:"appointmentFix"}]},
  appointmentFix:{step:6,line:"Sie brauchen keinen erfundenen Einzug. Legen Sie Ihren gebuchten Termin und die dokumentierten Versuche vor. Ich kann Gründe prüfen. Gedankenlesen ist trotz Personalmangel noch nicht eingeführt. Was geben Sie mir?",choices:[
   {label:"Die Terminbestätigung aus meiner Mappe.",reply:"Die kommt hinter den Einzugsvermerk. Ja, hinter. Der Termin ist später passiert.",next:"landlord",stamp:"Terminbemühungen erfasst"},
   {label:"Die Bestätigung samt Fehlermeldungen.",reply:"Ich notiere die Versuche. Die Fehlermeldung unterschreibt trotzdem nicht Ihren Antrag.",next:"landlord",stamp:"Terminbemühungen erfasst"}]},
  landlord:{step:7,line:"Haben Sie Ihren Vermieter oder Wohnungsgeber um die Einzugsbestätigung gebeten? Ich frage nach einer Anfrage, nicht nach Ihrer Hoffnung, dass Menschen von selbst Formulare ausfüllen. Was liegt vor?",choices:[
   {label:"Meine schriftliche Anfrage mit Einzugsdatum.",reply:"Eine Anfrage mit Datum! Da müsste sogar eine Hausverwaltung erkennen, worauf sie nicht antwortet.",next:"provider",stamp:"Wohnungsgeber angefragt"},
   {label:"Er sagte, Anmeldung sei hier nicht möglich.",reply:"Ach. Und die Wohnung ist zufällig möglich? Eine Anzeige ohne Anmeldung hebt keine Meldepflicht auf! Wir klären, wer Ihnen den Raum gibt.",next:"landlordFix"}]},
  landlordFix:{step:7,line:"Sie wohnen dort tatsächlich und auf Dauer. Notieren Sie, wen Sie gefragt haben und was die Person ablehnt. Die Aussage ohne Anmeldung wird nicht durch häufiges Wiederholen zum Formular. Welche Angaben halten Sie fest?",choices:[
   {label:"Name, Anfrage, Einzug und Ablehnung.",reply:"Die Ablehnung bekommt einen Vermerk. Ihr Wohnungsgeber bekommt gleich eine Zuständigkeit.",next:"provider",stamp:"Wohnungsgeber angefragt"},
   {label:"Die Anfrage mit den Einzugsdaten ergänzen.",reply:"Gut. Jetzt fehlt dem Schreiben nicht mehr das, was es verlangt. Weiter.",next:"provider",stamp:"Wohnungsgeber angefragt"}]},
  provider:{step:8,line:"Untermiete. Sie zahlen an den Hauptmieter, der Ihnen das Zimmer überlassen hat. Die Eigentümerin besitzt das Haus und erklärt sich für alles unzuständig. Wer ist hier Ihr Wohnungsgeber?",choices:[
   {label:"Der Hauptmieter, der mir das Zimmer gibt.",reply:"Richtig. Wohnungsgeber und Eigentümer können verschieden sein. Das ist kein Fehler. Das sind zwei Felder.",next:"confirmation",stamp:"Wohnungsgeber geklärt"},
   {label:"Nur die Eigentümerin darf das bestätigen.",reply:"Sie haben das Wort Eigentümerin gefunden und den Rest der Wohnsituation verloren! Bei Ihrer Untermiete ist der Hauptmieter der Wohnungsgeber!",next:"providerFix"}]},
  providerFix:{step:8,line:"Der Hauptmieter bestätigt Ihren tatsächlichen Einzug als Wohnungsgeber. Die Eigentümerin wird zusätzlich benannt. Mietrechtliche Erlaubnisse sind ein anderes Thema. Welche Person schreiben Sie ins Wohnungsgeberfeld?",choices:[
   {label:"Den Hauptmieter mit seiner Anschrift.",reply:"Jetzt ist das richtige Feld zuständig. Ich werde dem Haus das Eigentum deshalb nicht entziehen.",next:"confirmation",stamp:"Wohnungsgeber geklärt"},
   {label:"Hauptmieter und Eigentümerin getrennt.",reply:"Zwei Namen in zwei Feldern. Keine Fusion im Unterschriftenbereich.",next:"confirmation",stamp:"Wohnungsgeber geklärt"}]},
  confirmation:{step:9,line:"Wohnungsgeberbestätigung, § 19. Haben Sie die Bestätigung des tatsächlichen Einzugs? Oder schickt Ihr Wohnungsgeber Sie seit Wochen zwischen Hauptmieter, Verwaltung und dem Begriff nächste Woche im Kreis?",choices:[
   {label:"Die unterschriebene Bestätigung vorlegen.",reply:"Dann endet der Kreis hier. Ich werde prüfen, ob das Blatt innen ebenfalls eine Bestätigung enthält.",next:"dossier",stamp:"Einzugsbestätigung vorgelegt"},
   {label:"Sie wird verweigert oder kommt nicht.",reply:"Dann MELDEN Sie mir das! § 19 Absatz 2: Die fehlende oder verweigerte Bestätigung ist unverzüglich der Meldebehörde mitzuteilen. Sie stehen gerade vor einer!",next:"withheldReport"}]},
  withheldReport:{step:9,line:"Ich erfasse die fehlende Bestätigung. Was berichten Sie: die konkreten Anfragen samt Antwort, oder eine neue Ausrede, warum Sie vorsichtshalber weder hier noch dort existieren?",choices:[
   {label:"Anfragen, Antwort und Einzug dokumentieren.",reply:"Die Mitteilung ist aufgenommen. Ihr Einzug verschwindet dadurch nicht. Wir klären die Bestätigung jetzt mit dem Wohnungsgeber.",next:"withheldRecord",stamp:"Verweigerung gemeldet"},
   {label:"Ich warte lieber, bis er Zeit hat.",reply:"NEIN! Nicht warten und heimlich verschwinden. Fehlende Bestätigung melden. Namen, Anschrift, Einzug und bisherige Anfragen. Jetzt!",next:"withheldReportFix"}]},
  withheldReportFix:{step:9,line:"Sein Schweigen ersetzt Ihre Mitteilung nicht. Ich nehme sie hier auf. Sie können mir den bisherigen Schriftwechsel geben oder die Verweigerung mit Datum schildern. Welche Form der Auskunft gelingt Ihnen?",choices:[
   {label:"Den Schriftwechsel zur Akte geben.",reply:"Aufgenommen. Ich loche die Nachrichten, nicht Sie.",next:"withheldRecord",stamp:"Verweigerung gemeldet"},
   {label:"Die Verweigerung mit Datum erklären.",reply:"Ich protokolliere das und gleiche die Daten ab. Endlich gibt es eine Mitteilung über das Ausbleiben einer Mitteilung.",next:"withheldRecord",stamp:"Verweigerung gemeldet"}]},
  withheldRecord:{step:9,line:"Für die Rückfrage brauche ich Name und Anschrift des Hauptmieters, Ihre Wohnanschrift und das Einzugsdatum. Sein Kontaktformular antwortet nur automatisch. Welche Unterlagen helfen uns trotzdem weiter?",choices:[
   {label:"Kontaktdaten und Einzugsunterlagen vorlegen.",reply:"Damit kann ich die Rückfrage zuordnen. Der Mietvertrag ist dabei ein Beleg, kein Ersatz für die Bestätigung.",next:"withheldLookup"},
   {label:"Der Mietvertrag muss als Bestätigung reichen.",reply:"Er ersetzt sie NICHT! Er hilft bei der Klärung. Sie müssen nicht jedes Papier zum selben Papier erklären!",next:"withheldLookup"}]},
  withheldLookup:{step:9,line:"Ich verlange vom Wohnungsgeber Auskunft zum Einzug. Die Verwaltung faxt zurück: nicht Eigentümer. Das wussten wir. Wie beantworten Sie die Rückfrage, ohne die Akte wieder an den Anfang zu katapultieren?",choices:[
   {label:"Hauptmieter als Wohnungsgeber benennen.",reply:"Ich ergänze den Vermerk. Der Hauptmieter findet plötzlich einen Stift. Die bestätigten Einzugsdaten kommen zurück.",next:"withheldReturn"},
   {label:"Eigentümerin und Wohnungsgeber unterscheiden.",reply:"Ich halte beide Zuständigkeiten getrennt fest. Der Hauptmieter liefert endlich die unterschriebene Bestätigung nach.",next:"withheldReturn"}]},
  withheldReturn:{step:9,line:"Die nachgereichte Bestätigung liegt hier. Der Hauptmieter entschuldigt sich mit einem Druckerproblem. Der Drucker besitzt weder das Haus noch eine Meldefrist. Was prüfen wir zuerst auf dem neuen Blatt?",choices:[
   {label:"Einzugsdatum, Anschrift, Namen und Unterschrift.",reply:"Genau. Die Verzögerung ist vermerkt. Das Blatt wird jetzt mit Ihrem Dossier abgeglichen.",next:"dossier",stamp:"Einzugsbestätigung vorgelegt"},
   {label:"Ob der Briefumschlag amtlich aussieht.",reply:"Der Umschlag wohnt draußen in der Postablage. Wir prüfen den INHALT. Datum, Anschrift, Namen, Unterschrift!",next:"dossier",stamp:"Einzugsbestätigung vorgelegt"}]},
  dossier:{step:10,line:"Ihr Dossier enthält Mietvertrag, Wohnungsgeberbestätigung und Anmeldeformular. Drei Blätter. Sie legen sie so übereinander, als könnten sie gegenseitig ihre Arbeit erledigen. Welches bestätigt den tatsächlichen Einzug?",choices:[
   {label:"Die Wohnungsgeberbestätigung.",reply:"Die kommt zuerst. Der Mietvertrag hat daneben genug Platz, um weiter kein Ersatz zu sein.",next:"address",stamp:"Dossier geordnet"},
   {label:"Der Mietvertrag, weil er dicker ist.",reply:"Dicke ist keine Rechtsgrundlage! Einen Telefonkatalog würde ich Ihnen auch nicht als Reisepass stempeln!",next:"dossierFix"}]},
  dossierFix:{step:10,line:"Der Vertrag vereinbart die Miete. Die Bestätigung bestätigt den Einzug. Ihr Anmeldeformular meldet Sie an. Ordnen Sie die drei Blätter so, dass jedes seinen einzigen Beruf ausüben darf!",choices:[
   {label:"Bestätigung und Anmeldeformular nach vorne.",reply:"Ordnung hergestellt. Der Vertrag bleibt als ergänzende Unterlage dahinter.",next:"address",stamp:"Dossier geordnet"},
   {label:"Die Einzugsbestätigung getrennt vorlegen.",reply:"Gut. Ihre Blätter haben ihre Zuständigkeiten wiedergefunden.",next:"address",stamp:"Dossier geordnet"}]},
  address:{step:11,line:"Wohnanschrift. Straße, Hausnummer, Postleitzahl, Ort. Sie haben Hinterhof, die kaputte Klingel geschrieben. Der Hinterhof hat heute leider keine eigene Meldestelle. Welche Anschrift wird eingetragen?",choices:[
   {label:"Die vollständige Anschrift meiner Wohnung.",reply:"Und die Wohnlage nur ergänzend, damit wir die Wohnung zuordnen können. Die kaputte Klingel bleibt Bauzustand.",next:"owner",stamp:"Wohnanschrift geprüft"},
   {label:"Die Postadresse eines hilfsbereiten Freundes.",reply:"Sie wohnen nicht beim Briefkasten Ihres Freundes! Eine freundliche Adresse ersetzt keinen tatsächlichen Einzug!",next:"addressFix"}]},
  addressFix:{step:11,line:"Sie melden die Wohnung an, die Sie tatsächlich bezogen haben. Nicht die schönste Zustellmöglichkeit. Gleichen Sie Straße, Nummer, Postleitzahl und Ort mit der Einzugsbestätigung ab. Was tragen Sie ein?",choices:[
   {label:"Die tatsächliche Wohnanschrift vollständig.",reply:"So. Die Post darf Sie dann ebenfalls finden. Das ist eine Folge, keine zweite Wohnung.",next:"owner",stamp:"Wohnanschrift geprüft"},
   {label:"Wohnanschrift und Wohnlage genau abgleichen.",reply:"Beide Blätter zeigen dieselbe Wohnung. Ich muss das Haus nicht mehr in der Akte suchen.",next:"owner",stamp:"Wohnanschrift geprüft"}]},
  owner:{step:12,line:"Ihr Hauptmieter ist Wohnungsgeber, aber kein Eigentümer. Auf der Bestätigung stehen sein Name und seine Anschrift. Welcher zusätzliche Name fehlt noch? Nein, nicht meiner. Ich wohne NICHT in Ihrer Akte!",choices:[
   {label:"Der Name der Eigentümerin.",reply:"Jetzt kann ich Eigentum und Überlassung auseinanderhalten, ohne einen Stammbaum des Hauses anzulegen.",next:"residents",stamp:"Geber und Eigentümer erfasst"},
   {label:"Nur der Spitzname des Hauptmieters.",reply:"Ein Spitzname ersetzt weder Namen noch Eigentümerin! Das Eigentümerfeld ist leer. Lassen Sie es vervollständigen!",next:"ownerFix"}]},
  ownerFix:{step:12,line:"Die Hausunterlagen nennen die Eigentümerin. Der Hauptmieter ergänzt ihren Namen auf der Bestätigung. Seinen eigenen Namen und seine Anschrift behalten wir. Welche Angabe prüfen Sie danach?",choices:[
   {label:"Eigentümername zusätzlich zum Wohnungsgeber.",reply:"Vollständig. Das Haus gehört weiter der Eigentümerin, auch wenn sie nun in einem zweiten Formular vorkommt.",next:"residents",stamp:"Geber und Eigentümer erfasst"},
   {label:"Beide Personen in den passenden Feldern.",reply:"Keine Partei wurde durch Weglassen entlastet. Weiter zur Liste der Eingezogenen.",next:"residents",stamp:"Geber und Eigentümer erfasst"}]},
  residents:{step:13,line:"Namen der einziehenden meldepflichtigen Personen. Der Wohnungsgeber hat neue Leute geschrieben. Wie aufmerksam. Soll ich neue Leute jetzt als Familiennamen eintragen? Welche Fassung legen Sie vor?",choices:[
   {label:"Alle eingezogenen Personen namentlich.",reply:"Vollständige Namen der tatsächlich Eingezogenen. Der Wohnungsgeber korrigiert den Sammelbegriff.",next:"providerSignature",stamp:"Einziehende benannt"},
   {label:"Nur mich, die anderen sind Nebensache.",reply:"NEBENWOHNUNG ist ein Begriff. Nebenmensch ist keiner! Auf die Bestätigung gehören die meldepflichtigen Eingezogenen!",next:"residentsFix"}]},
  residentsFix:{step:13,line:"Wir ergänzen die fehlenden Namen der tatsächlich Eingezogenen. Sie müssen keine Nachbarn miterfinden. Wer auf dieser Bestätigung steht, muss zu diesem Einzug gehören. Wie korrigieren wir die Liste?",choices:[
   {label:"Die Eingezogenen mit vollständigen Namen.",reply:"Die Liste ist berichtigt. Die Bewohner der Nachbarwohnung bleiben bei ihrem eigenen Papier.",next:"providerSignature",stamp:"Einziehende benannt"},
   {label:"Namen mit den vorhandenen Pässen abgleichen.",reply:"Jetzt stimmen die Namen mit den Personen überein. Ein seltenes, aber zulässiges Ergebnis.",next:"providerSignature",stamp:"Einziehende benannt"}]},
  providerSignature:{step:14,line:"Die Wohnungsgeberbestätigung ist schriftlich da. Unten steht gesendet von meinem Smartphone. Hat das Smartphone Ihnen das Zimmer überlassen? Wer muss diesen Einzug bestätigen?",choices:[
   {label:"Der Wohnungsgeber oder seine beauftragte Person.",reply:"Dann prüfen wir dessen Unterschrift auf der Bestätigung. Ihr Telefon wird nicht zum Vermieter befördert.",next:"dates",stamp:"Bestätigung unterschrieben"},
   {label:"Ich unterschreibe für ihn, das geht schneller.",reply:"SIE UNTERSCHREIBEN NICHT FÜR IHN! Das Blatt darf nur der Wohnungsgeber oder seine beauftragte Person ausstellen!",next:"providerSignatureFix"}]},
  providerSignatureFix:{step:14,line:"Der Wohnungsgeber hat die korrigierte Fassung unterschrieben nachgereicht. Ihr eigener Stift bleibt liegen. Vergleichen Sie die Unterschrift mit der angegebenen ausstellenden Person. Was prüfen Sie?",choices:[
   {label:"Unterschrift des angegebenen Wohnungsgebers.",reply:"Die Bestätigung ist unterschrieben. Keine Stellvertretung durch Ihre Ungeduld.",next:"dates",stamp:"Bestätigung unterschrieben"},
   {label:"Bei Vertretung auch die Beauftragung klären.",reply:"Die Person ist beauftragt, die Bestätigung ist zugeordnet. Das können wir so prüfen.",next:"dates",stamp:"Bestätigung unterschrieben"}]},
  dates:{step:15,line:"Auf dem Anmeldeformular steht der Fünfte. In der Bestätigung stand zuerst der Erste, das Vertragsdatum. Der Wohnungsgeber hat es korrigiert. Welche Fassung geht in die Akte?",choices:[
   {label:"Die korrigierte Bestätigung des Einzugs am Fünften.",reply:"Beide Blätter nennen jetzt den tatsächlichen Einzug. Ich hefte die alte Fassung hinter den Korrekturvermerk.",next:"registrationSignature",stamp:"Einzugsdaten abgeglichen"},
   {label:"Die alte, sie hat schon einen schönen Knick.",reply:"MEIN NAME IST KNICK, NICHT MEIN PRÜFKRITERIUM! Das falsche Datum wird nicht durch Falten richtig!",next:"datesFix"}]},
  datesFix:{step:15,line:"Die berichtigte Bestätigung liegt direkt vor Ihnen. Der Einzug war am Fünften. Nehmen Sie die richtige Fassung. Oder markieren Sie die alte ausdrücklich als ersetzt. Wie verhindern Sie ein zweites falsches Datum?",choices:[
   {label:"Die berichtigte Fassung nach vorne legen.",reply:"So kommt sie ins Dossier. Der schöne Knick darf in der Altunterlage wohnen.",next:"registrationSignature",stamp:"Einzugsdaten abgeglichen"},
   {label:"Die alte Fassung als ersetzt kennzeichnen.",reply:"Jetzt ist die Korrektur nachvollziehbar. Weiter, bevor der Kalender in Rente geht.",next:"registrationSignature",stamp:"Einzugsdaten abgeglichen"}]},
  registrationSignature:{step:16,line:"Nun IHRE Unterschrift auf IHREM Anmeldeformular. Der Vermieter unterschreibt seine Bestätigung, Sie Ihre Anmeldung. Ich habe zwei Linien vorgedruckt, damit niemand dafür ein Gutachten bestellen muss. Was unterschreiben Sie?",choices:[
   {label:"Mein ausgefülltes Anmeldeformular.",reply:"In Ihrem Namen, auf Ihrem Antrag. Der Kugelschreiber hat seine Zuständigkeit verstanden.",next:"residence",stamp:"Anmeldeformular unterschrieben"},
   {label:"Der Vermieter soll alles unterschreiben.",reply:"Er ist nicht Sie! Es sei denn, Ihr Pass hat mir gerade einen vollständigen Identitätswechsel verschwiegen!",next:"registrationSignatureFix"}]},
  registrationSignatureFix:{step:16,line:"Ihre Angaben stehen auf dem Formular. Prüfen Sie sie und unterschreiben Sie selbst die Anmeldung. Die Wohnungsgeberbestätigung ist bereits vom richtigen Aussteller unterschrieben. Welche Linie gehört Ihnen?",choices:[
   {label:"Die Unterschriftslinie auf meiner Anmeldung.",reply:"Unterschrieben. Zwei Blätter, zwei Unterschriften, kein Personentausch.",next:"residence",stamp:"Anmeldeformular unterschrieben"},
   {label:"Angaben prüfen, dann die Anmeldung unterschreiben.",reply:"Sie bestätigen Ihre Angaben. Ich bestätige später, dass ich sie registriert habe. Die Reihenfolge hat einen Sinn.",next:"residence",stamp:"Anmeldeformular unterschrieben"}]},
  residence:{step:17,line:"Alleinige Wohnung oder mehrere Wohnungen in Deutschland? Antworten Sie nach Ihrer Wohnsituation, nicht nach der Anzahl der Schlüssel an Ihrem Bund. Ein Fahrradschlüssel zählt mir hier nicht als Nebenwohnung!",choices:[
   {label:"Das ist meine einzige Wohnung in Deutschland.",reply:"Dann erfasse ich sie als alleinige Wohnung. Ein Feld weniger. Ich sehe Ihre unangebrachte Erleichterung.",next:"previous",stamp:"Wohnungsart bestimmt"},
   {label:"Ich habe weitere Wohnungen in Deutschland.",reply:"Dann benennen Sie alle und bestimmen die Hauptwohnung. Dafür gibt es das Beiblatt, das Sie gerade wegschieben wollten.",next:"residenceDetails"}]},
  residenceDetails:{step:17,line:"Weitere Wohnungen kommen aufs Beiblatt. Hauptwohnung ist grundsätzlich die vorwiegend benutzte Wohnung; auch Ihre familiäre Wohnsituation kann maßgeblich sein. Wie verhindern Sie, dass zwei Hauptwohnungen gegeneinander regieren?",choices:[
   {label:"Alle Wohnungen und ihre Nutzung angeben.",reply:"Wir prüfen die Einordnung und vermerken diese als Hauptwohnung. Die übrigen bleiben als Nebenwohnungen erfasst.",next:"previous",stamp:"Wohnungsart bestimmt"},
   {label:"Die anderen Wohnungen einfach verschweigen.",reply:"NEIN! § 21 verlangt die Angaben zu weiteren Wohnungen im Inland. Eine weggelassene Wohnung wird nicht abgerissen!",next:"residenceFix"}]},
  residenceFix:{step:17,line:"Geben Sie die weiteren Wohnungen vollständig an. Hauptwohnung bestimmen wir anhand der maßgeblichen tatsächlichen Nutzung und der Angaben zu Ihrer Wohnsituation. Was reichen Sie nach?",choices:[
   {label:"Das Beiblatt mit allen weiteren Wohnungen.",reply:"Beiblatt geprüft. Die Einordnung wird eingetragen. Ihre Schlüssel dürfen Sie behalten.",next:"previous",stamp:"Wohnungsart bestimmt"},
   {label:"Die Wohnungsdaten gemeinsam vervollständigen.",reply:"Die Wohnsituationen sind erfasst. Wir legen die Hauptwohnung fest und gehen weiter.",next:"previous",stamp:"Wohnungsart bestimmt"}]},
  previous:{step:18,line:"Sie haben Ihre bisherige Wohnung in Deutschland aufgegeben und sind hierhergezogen. Haben Sie sich dort extra abgemeldet, oder bringen Sie mir jetzt den Antrag auf einen Antrag für einen Abschiedsstempel?",choices:[
   {label:"Den Umzug mit der Anmeldung hier erfassen.",reply:"Bei diesem Umzug innerhalb Deutschlands brauchen Sie keine gesonderte Abmeldung dort. Ich schicke die Meldedaten weiter, nicht Sie.",next:"civilStatus",stamp:"Bisherige Wohnung geklärt"},
   {label:"Erst zur alten Meldestelle zurückfahren.",reply:"Sie können gern spazieren fahren. Für diesen Umzug ist eine gesonderte Abmeldung dort aber nicht nötig! Bleiben Sie bei Ihrer Anmeldung hier!",next:"previousFix"}]},
  previousFix:{step:18,line:"Sie beziehen eine neue Wohnung im Inland. Die bisherige ist aufgegeben. Ich brauche deren Anschrift für den Umzug, keinen besonderen Abschiedsstempel. Welche Angaben vervollständigen Sie?",choices:[
   {label:"Die bisherige Anschrift und den Umzug.",reply:"Die bisherige Wohnung ist zugeordnet. Kein Rückfahrtauftrag.",next:"civilStatus",stamp:"Bisherige Wohnung geklärt"},
   {label:"Aufgabe der alten Wohnung richtig angeben.",reply:"Vermerkt. Das Register darf den Umzug jetzt ebenfalls mitbekommen.",next:"civilStatus",stamp:"Bisherige Wohnung geklärt"}]},
  civilStatus:{step:19,line:"Erste Anmeldung in Berlin. Zur Klärung Ihrer Daten kann ich vorhandene Personenstandsurkunden brauchen. Sie haben die Mappe sorgsam sortiert und die Geburtsurkunde unter unwichtig gelegt. Was geben Sie mir?",choices:[
   {label:"Die vorhandenen benötigten Urkunden.",reply:"Ich gleiche die erforderlichen Angaben ab. Die Urkunden bleiben Urkunden; sie werden keine zusätzlichen Wohnungsgeber.",next:"originals",stamp:"Personendaten abgeglichen"},
   {label:"Der Pass müsste doch alle Fragen erledigen.",reply:"Der Pass erledigt Identität. Wenn Personendaten geklärt werden müssen, klären wir sie. Ihre Mappe hat die Urkunde bereits dabei!",next:"civilStatusFix"}]},
  civilStatusFix:{step:19,line:"Wir klären, welche vorhandene Urkunde für Ihren konkreten Vorgang gebraucht wird. Nicht jede Person braucht jede Urkunde. Ich bestelle hier keine komplette Familienchronik. Wie gehen Sie vor?",choices:[
   {label:"Die benötigte vorhandene Urkunde vorlegen.",reply:"Abgleich erledigt. Sie dürfen unwichtig jetzt in hätte fast gefehlt umbenennen.",next:"originals",stamp:"Personendaten abgeglichen"},
   {label:"Den konkreten Bedarf mit mir abgleichen.",reply:"Die erforderlichen Daten sind geklärt. Ich verlange keine Heiratsurkunde für eine Ehe, die Sie nicht haben.",next:"originals",stamp:"Personendaten abgeglichen"}]},
  originals:{step:20,line:"Sie haben Originale UND Kopien. Der Kopierer hat aus allem eine blasse Familie gemacht. Welche Unterlagen lassen Sie mich zum Nachweis prüfen? Achtung: eine Kopie wird durch dreimaliges Kopieren nicht wieder zum Original!",choices:[
   {label:"Die erforderlichen Originaldokumente.",reply:"Originale geprüft. Die Kopien dürfen als Kopien bei der Akte bleiben, wo sie gebraucht werden.",next:"chronology",stamp:"Originale geprüft"},
   {label:"Nur die Kopien, die Originale sind kostbar.",reply:"Kostbar ist hier auch meine Zeit! Bringen Sie die vorhandenen Originale nach vorne, ich prüfe sie und gebe sie zurück!",next:"originalsFix"}]},
  originalsFix:{step:20,line:"Ihre Originale stecken hinter den Kopien. Legen Sie sie zum Abgleich daneben. Kein neuer Kopierauftrag, kein weiterer Raum, kein Pilgerweg zum Drucker. Wie machen Sie den Abgleich möglich?",choices:[
   {label:"Originale und passende Kopien nebeneinander.",reply:"Abgeglichen. Die Originale gehen wieder an Sie. Die Kopien wissen nun, zu wem sie gehören.",next:"chronology",stamp:"Originale geprüft"},
   {label:"Die Originale einzeln vorlegen.",reply:"Eines nach dem anderen geprüft. Der Kopierer hat heute keine weitere Zuständigkeit.",next:"chronology",stamp:"Originale geprüft"}]},
  chronology:{step:21,line:"Sie haben jetzt einen Termin, einen tatsächlichen Einzug und die nachgereichten Unterlagen. Die Verwaltung schlägt vor, alles auf heute zu datieren, dann sehe es ordentlicher aus. Welche Chronologie bestätige ich?",choices:[
   {label:"Die tatsächlichen Daten samt Korrekturvermerken.",reply:"Richtig. Die Akte darf zeigen, dass etwas zu spät kam. Sie muss deshalb nicht behaupten, Sie seien zu spät geboren.",next:"printer",stamp:"Chronologie geschlossen"},
   {label:"Alles auf heute, dann sind die Daten gleich.",reply:"Ordentlich FALSCH bleibt falsch! Einzug, Anfrage, Termin und Nachreichung haben ihre tatsächlichen Daten!",next:"chronologyFix"}]},
  chronologyFix:{step:21,line:"Die Daten stimmen, wenn sie die Ereignisse wiedergeben. Ich brauche keinen Kalender, der auf Wunsch zusammengefaltet wurde. Wie lassen Sie die unterschiedlichen Daten nachvollziehbar?",choices:[
   {label:"Einzug, Termin und Nachreichung getrennt.",reply:"Chronologie geschlossen. Die Verzögerung hat ihren Vermerk und keinen neuen Wohnsitz.",next:"printer",stamp:"Chronologie geschlossen"},
   {label:"Korrekturen mit der richtigen Fassung zuordnen.",reply:"Die Fassungen sind zugeordnet. Ich kann die Geschichte des Blattes lesen, ohne sie zu erraten.",next:"printer",stamp:"Chronologie geschlossen"}]},
  printer:{step:22,line:"Der Drucker blinkt Papier fehlt. Im Fach liegt Papier. Er meint vermutlich Papier, das seine Abwesenheit bestätigt. Ihre Unterlagen sind geprüft. Wie retten wir den Ausdruck Ihrer Meldebestätigung?",choices:[
   {label:"Das Ersatzfach mit dem freigegebenen Papier.",reply:"Ich ziehe das gelbe Blatt aus dem weißen Fach und das weiße aus dem gelben. Der Drucker akzeptiert den Zuständigkeitswechsel.",next:"review",stamp:"Ausdruck freigegeben"},
   {label:"Morgen wiederkommen, wenn er sich beruhigt.",reply:"DER DRUCKER HAT KEINEN TERMIN! Sie bleiben hier. Ich öffne das Ersatzfach. Ihre Anmeldung wartet nicht auf seine Gemütslage!",next:"printerFix"}]},
  printerFix:{step:22,line:"Das Ersatzfach ist gefüllt. Der Druckauftrag darf nicht doppelt laufen, sonst druckt er zwei Bestätigungen und verlangt eine Trennungsurkunde. Welchen Auftrag lassen wir laufen?",choices:[
   {label:"Den vorhandenen Auftrag aus dem Ersatzfach.",reply:"Ein Vorgang, ein Ausdruck. Der Drucker hat sich einer Mehrheit von einem Blatt gebeugt.",next:"review",stamp:"Ausdruck freigegeben"},
   {label:"Den doppelten Auftrag stoppen, dann drucken.",reply:"Doppelter Auftrag entfernt. Der richtige Ausdruck läuft. Wir brauchen keine Scheidung zweier Seiten.",next:"review",stamp:"Ausdruck freigegeben"}]},
  review:{step:23,line:"Letzte Prüfung: Name, tatsächliches Einzugsdatum, Anschrift und Wohnungsart. Prüfen Sie die Angaben, bevor ich den Vorgang abschließe. Wenn Sie jetzt nur auf den Stempel starren, starrt er zurück. Was tun Sie?",choices:[
   {label:"Alle Angaben mit den Unterlagen abgleichen.",reply:"Angaben stimmen. Die Identität ist geprüft, der Einzug bestätigt und das Formular unterschrieben. Mein Stempel hat keine offene Ausrede mehr.",next:"final",stamp:"Schlussprüfung bestanden"},
   {label:"Einfach stempeln, ich halte es nicht mehr aus.",reply:"ICH HALTE ES AUCH NICHT MEHR AUS! Trotzdem prüfen Sie die Angaben. Ein falsches Register wird nicht durch Eile richtig!",next:"reviewFix"}]},
  reviewFix:{step:23,line:"Hier steht Ihr Name. Dort Ihre Wohnung. Das Datum ist der Fünfte. Die Wohnungsart ist geklärt. Nehmen Sie diese vier Angaben zur Kenntnis, bevor Sie das Amt mit einer schönen neuen falschen Adresse verlassen!",choices:[
   {label:"Die vier Angaben sorgfältig bestätigen.",reply:"Bestätigt. Ich schließe den Prüfvorgang. Ihre Akte hat endlich keine lose Frage mehr.",next:"final",stamp:"Schlussprüfung bestanden"},
   {label:"Noch einmal mit dem vollständigen Dossier prüfen.",reply:"Abgeglichen und richtig. Der Stempel darf nun das tun, was Sie ihm seit zwanzig Minuten unterstellen.",next:"final",stamp:"Schlussprüfung bestanden"}]},
  final:{step:24,line:"So. Die Anmeldung wird jetzt abgeschlossen. Gleich bekommen Sie Ihre Meldebestätigung. Nicht noch einen Antrag, keinen Rückweg, keine neue Nummer. Sind die geprüften Angaben richtig und nehmen Sie die Bestätigung entgegen?",choices:[
   {label:"Ja. Anmeldung abschließen und entgegennehmen.",reply:"ANGEMELDET. Hier ist Ihre Meldebestätigung. Anmeldung abgeschlossen, Abzeichen auf Ihrer Akte. Sie existieren jetzt auch schriftlich. Gehen Sie, bevor der Drucker eine Rückfrage hat!",next:"complete",stamp:"Anmeldung abgeschlossen"},
   {label:"Ja, und den vollständigen Ausdruck mitnehmen.",reply:"VOLLSTÄNDIG ANGEMELDET. Die Meldebestätigung gehört Ihnen. Ihr Abzeichen lautet Anmeldung abgeschlossen. Ich unterschreibe nichts über Ihre Begeisterung. Die fehlt hier auch nicht!",next:"complete",stamp:"Anmeldung abgeschlossen"}]}
 }},
 clerk:[
  {speaker:"SACHBEARBEITERIN FRAU KNICK",line:"Ihre Wartenummer bestätigt, dass Sie hier sind. Ihr Gesicht lässt vermuten, dass Sie wieder gehen könnten. Welcher Nachweis hat Vorrang?",choices:[
   {label:"Das Ticket.",reply:"Richtig. Ein Gesicht lässt sich verlegen; ein Ticket hat eine Perforation."},
   {label:"Mein Gesicht.",reply:"Dann heften Sie es bitte an das Ticket, ohne das nicht vorhandene Passfoto zu beschädigen."},
   {label:"Mein Telefon.",reply:"Ein Telefon bezeugt eine Stimme. Über Schuhe in einem Warteraum hat es keine Zuständigkeit."}]},
  {speaker:"SACHBEARBEITERIN FRAU KNICK",line:"Für die Anmeldung brauche ich eine Wohnungsgeberbestätigung. Um sie anzufordern, brauchen Sie die Erlaubnis zur Anforderung. Welche Anschrift melden Sie an?",choices:[
   {label:"Die Anschrift meiner Wohnung.",reply:"Eine Anschrift ohne Bestätigung ist lediglich eine Richtungsangabe."},
   {label:"Die Anschrift auf dem Formular.",reply:"Das Formular ist leer. Das ist die neutralste Anschrift, die ich heute gesehen habe."},
   {label:"Vorübergehend diesen Warteraum.",reply:"Dieser Raum kann nicht angemeldet werden. Er wartet seit Dienstag auf seine eigene Wohnungsgeberbestätigung."}]},
  {speaker:"SACHBEARBEITERIN FRAU KNICK",line:"Ich darf Ihnen das Formular A38 ausgeben: die Erlaubnis, eine Erlaubnis zu beantragen. Der Drucker behauptet, er habe morgen schon gedruckt. Wie erfassen wir heute?",choices:[
   {label:"Mit einem Stempel.",reply:"Ein Stempel ist die älteste Form der Zeitreise. Ich datiere ihn auf heute."},
   {label:"Per E-Mail.",reply:"E-Mails nehmen wir nur nach Zustellung per Fax an. Das Faxgerät verlangt einen Ausdruck der E-Mail."},
   {label:"Dann warten wir bis morgen.",reply:"Morgen wurde bereits gedruckt. Das Warten würde ein doppeltes Datum erzeugen."}]},
  {speaker:"SACHBEARBEITERIN FRAU KNICK",line:"Wir haben Ihre Nummer, den Nachweis Ihrer Anwesenheit und ein Datum, das noch nicht zweimal stattgefunden hat. Was ist nun Ihr Anliegen?",choices:[
   {label:"Die Anmeldung beantragen.",reply:"Gut. Zuerst dürfen Sie die Antragstellung beantragen."},
   {label:"Die Erlaubnis zur Anmeldung.",reply:"Genau. Die Erlaubnis ist die Warteschlange vor der Warteschlange."},
   {label:"Ich wollte nur eine Nummer.",reply:"Dann haben Sie die erste Hälfte jedes Verwaltungsvorgangs abgeschlossen."}]}
 ]
});
})();
