(function(){"use strict";
window.BuergeramtStory=Object.freeze({
 characters:{
  aktenkurier:{speaker:"DER AKTENKURIER",lines:[
   {line:"Stopp. Sie haben den Aktenlauf ohne Laufzettel gekreuzt. Das gilt als Abkürzung und muss gestempelt werden.",tone:"warning",valence:-.55},
   {line:"Ihr Formular ist jetzt im Umlauf. Bitte bleiben Sie stehen, bis es Sie eingeholt hat.",tone:"procedural",valence:-.18}
  ]},
  archivbotin:{speaker:"DIE ARCHIVBOTIN",lines:[
   {line:"Sie stehen vor der Ablage, ohne abgelegt zu sein. Ich setze Ihren Vorgang vorsorglich auf Wiedervorlage.",tone:"dread",valence:-.48},
   {line:"Der Schlüssel passt. Das Schloss stellt noch einen Antrag auf Zuständigkeit.",tone:"procedural",valence:-.16}
  ]},
  formularsammler:{speaker:"DER FORMULARSAMMLER",lines:[
   {line:"Meine Seitenfolge ist nicht genehmigt. Wenn Blatt siebzehn wieder vorn steht, beginnt mein Termin von gestern noch einmal.",tone:"dread",valence:-.72},
   {line:"Die letzte Seite war leer. Frau Knick nennt das ein freies Zeitfenster. Ich nenne es Aussicht.",tone:"relief",valence:.32}
  ]},
  nummernfluesterer:{speaker:"DER NUMMERNFLÜSTERER",lines:[
   {line:"Die Anzeige hat meine Nummer geflüstert, bevor ich sie gezogen habe. Jetzt verlangt sie einen Nachweis, dass ich noch nicht dran bin.",tone:"dread",valence:-.78},
   {line:"Wenn die Zahl wieder rückwärts läuft, bleibe ich hier. Für Fluchtwege ist Schalter zwei zuständig.",tone:"warning",valence:-.51}
  ]},
  nachtschichtmelderin:{speaker:"DIE NACHTSCHICHT-MELDERIN",lines:[
   {line:"Mein Telefon ist tot. Die App bestätigt trotzdem, dass ich persönlich anwesend bin. Ich halte das Gerät hoch, damit es mich nicht vergisst.",tone:"dread",valence:-.62},
   {line:"Meine Akte ist lesbar. Das ist offenbar der Formfehler. Ich soll sie noch einmal ausdrucken, bis sie müde aussieht.",tone:"procedural",valence:-.3}
  ]},
  pfandarchitektin:{speaker:"DIE PFANDARCHITEKTIN",lines:[
   {line:"Dieser Bon ist länger als der Flur. Die Quittung für die Quittung fehlt noch; ohne sie darf ich den Anfang nicht abreißen.",tone:"procedural",valence:-.45},
   {line:"Vorhin war mein Ordner leichter. Vielleicht hat die Ablage eine Seite behalten. Vielleicht war es meine Hand.",tone:"dread",valence:-.64}
  ]},
  kopiependler:{speaker:"DER KOPIEPENDLER",lines:[
   {line:"Ich habe das Original kopiert, wie verlangt. Jetzt gilt die Kopie als Original und mein Original als verdächtige Zweitschrift.",tone:"warning",valence:-.54},
   {line:"Der Fahrradhelm ist keine Kopfbedeckung. Das hat Schalter vier schriftlich bestätigt; das Schreiben liegt unter dem Helm.",tone:"relief",valence:.15}
  ]},
  warteschlangenpoetin:{speaker:"DIE WARTESCHLANGENPOETIN",lines:[
   {line:"Die Nummer auf meinem Zettel hat sich verdoppelt. Ich soll beweisen, welche Hälfte zuerst gewartet hat.",tone:"dread",valence:-.7},
   {line:"Auf der Rückseite steht endlich ein Satz. Leider ist er nicht unterschrieben, also bleibt er vorläufig ein Geräusch.",tone:"relief",valence:.24}
  ]}
 },
 omen:{speaker:"DER AKTENKURIER",line:"Wer die Finsternis sieht, hat sie selbst gewählt!"},
 entrance:{speaker:"PFÖRTNERIN",line:"Halt. Sie haben das Bürgeramt betreten, ohne nachzuweisen, dass Sie vorher draußen waren. Ziehen Sie bitte eine Nummer für den Übergang."},
 call:{id:"grass",line:"Polizei, Ordnungskontrolle. Sie sind heute über eine Grünfläche gelaufen. Antworten Sie: linker Schuh, rechter Schuh, oder beide?",declined:"Sehr gut. In diesem Schalterbereich sind private Anrufe nicht zuständig."},
 police:[
  "Hallo? Sprechen Sie lauter! Wir können Sie nicht hören. Haben Sie etwa etwas Wichtigeres zu tun, oder was?!",
  "Wer redet da im Hintergrund? Die Frau am Schalter? Stellen Sie laut! Vielleicht deckt Ihr Schalter den Rasen!",
  "Frau Knick, behindern Sie nicht meine Befragung! Ein Grashalm fehlt, und hier schreit jemand über Stempel!"
 ],
 outburst:{speaker:"FRAU KNICK · SCHALTER 3",lines:[
  "Sie machen wohl Witze? Sie nehmen während eines Termins im Bürgeramt einen Anruf an? Ich habe den Stempel schon in der Hand!",
  "Ach, die Polizei? Herr Wachtmeister, ich höre Sie! Der Bürger steht an meinem Schalter und nicht auf Ihrem Rasen. Jetzt lassen Sie mich ausreden!",
  "Ich bin vierundsiebzig und seit fünfzig Jahren an diesem Schalter. Mein Schalter deckt keinen Rasen. Er deckt Anträge! Fragen Sie ihn nach seinen Schuhen, nicht mich nach meiner Tischplatte!",
  "Sie beschuldigen meinen Schalter? Dann schreiben Sie ihm eine Anzeige! Der Stempel war halb unten. Ein halber Stempel ist kein Stempel, und ohne Stempel ist Ihr Termin annulliert.",
  "Ihre Nummer wandert zurück in den Automaten. Gehen Sie bitte durch den Eingang hinaus. Für einen neuen Versuch ziehen Sie draußen eine neue Nummer — dort ist die Polizei für den Rasen zuständig."
 ]},
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
