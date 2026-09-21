(function(){
"use strict";

// Runtime and durable authority for fictional roaming-quiz identities.
// Portrait identity is fixed: do not randomize a name independently from its image.
const characters=Object.freeze([
 Object.freeze({id:"gisela-becker",name:"Gisela Becker",title:"BESORGTE BÜRGERIN",office:"Referat für vorsorgliche Besorgnis",authority:"selbst bescheinigt",specialty:"laminierte Eingaben",categories:Object.freeze(["civic","grammar-b1"]),portrait:"./assets/quiz-characters/gisela-becker.webp",alt:"Fiktive Gisela Becker mit laminierter Eingabe und Aktenordner"}),
 Object.freeze({id:"ruediger-schmidt",name:"Rüdiger Schmidt",title:"GRAMMATIKPOLIZEI",office:"Kasuswacht Nord",authority:"durch Rotstift",specialty:"Artikel und Nebensätze",categories:Object.freeze(["grammar-b1","grammar-b2","grammar-c1"]),portrait:"./assets/quiz-characters/ruediger-schmidt.webp",alt:"Fiktiver Rüdiger Schmidt mit rotem Korrekturstift und Grammatikbuch"}),
 Object.freeze({id:"sabine-krueger",name:"Sabine Krüger",title:"SELBSTERNANNTE SPRACHLEHRERIN",office:"Mobile Korrekturstelle",authority:"mündlich behauptet",specialty:"ungefragte Verbesserungen",categories:Object.freeze(["grammar-b1","grammar-b2"]),portrait:"./assets/quiz-characters/sabine-krueger.webp",alt:"Fiktive Sabine Krüger mit Korrekturkarte und erhobenem Zeigefinger"}),
 Object.freeze({id:"uwe-moeller",name:"Uwe Möller",title:"VERTRETER DER BÜRGEREMPÖRUNG",office:"Sprecherrat der schweigenden Mehrheit",authority:"per Rundmail",specialty:"Sammelbeschwerden",categories:Object.freeze(["civic","traffic"]),portrait:"./assets/quiz-characters/uwe-moeller.webp",alt:"Fiktiver Uwe Möller mit Klemmbrett und entschlossener Beschwerdemiene"}),
 Object.freeze({id:"brigitte-neumann",name:"Brigitte Neumann",title:"SPRECHERIN DER STADTBILDWACHT",office:"Arbeitskreis Sichtachsen",authority:"durch Ortskenntnis",specialty:"Hecken, Kanten, Kästen",categories:Object.freeze(["civic","traffic"]),portrait:"./assets/quiz-characters/brigitte-neumann.webp",alt:"Fiktive Brigitte Neumann mit Fernglas und Zollstock"}),
 Object.freeze({id:"klaus-dieter-wagner",name:"Klaus-Dieter Wagner",title:"FREIWILLIGES ORDNUNGSAMT",office:"Außendienst ohne Auftrag",authority:"ausdrücklich keine",specialty:"Abstände unter 2 cm",categories:Object.freeze(["traffic","civic"]),portrait:"./assets/quiz-characters/klaus-dieter-wagner.webp",alt:"Fiktiver Klaus-Dieter Wagner in neutraler Warnweste mit Maßband und Notizblock"}),
 Object.freeze({id:"heike-hoffmann",name:"Heike Hoffmann",title:"NACHBARSCHAFTLICHE HINWEISPERSON",office:"Hausordnungsbeobachtung",authority:"durch Schlüsselbund",specialty:"Müll und Ruhezeiten",categories:Object.freeze(["civic","traffic"]),portrait:"./assets/quiz-characters/heike-hoffmann.webp",alt:"Fiktive Heike Hoffmann mit Schlüsselbund und farbigen Sortierkarten"}),
 Object.freeze({id:"dietmar-schulz",name:"Dr. Dietmar Schulz",title:"INOFFIZIELLER ZERTIFIKATSPRÜFER",office:"Prüfstelle für spontane Gespräche",authority:"akademisch vermutet",specialty:"B1 bis tatsächlich C1",categories:Object.freeze(["grammar-b1","grammar-b2","grammar-c1"]),portrait:"./assets/quiz-characters/dietmar-schulz.webp",alt:"Fiktiver Dietmar Schulz mit Stoppuhr und leeren Prüfungsblättern"}),
 Object.freeze({id:"hartmut-keller",name:"Hartmut Keller",title:"PARA-POLIZEILICHER NACHBAR",office:"Privatleitstelle Fensterbank",authority:"durch Dauerbeobachtung",specialty:"Hecken, Wege, Kennzeichen",categories:Object.freeze(["civic","traffic"]),portrait:"./assets/quiz-characters/hartmut-keller.webp",alt:"Fiktiver Hartmut Keller mit Funkgerät, Taschenlampe und leerem Vorfallsblock"})
]);

const archetypeLexicon=Object.freeze([
 "Gutbürger","besorgter Bürger","aufmerksame Mitbürgerin","Anwohner mit Regelinteresse","Ordnungsfreundin","Hausordnungsbeauftragter","Nachbarschaftswacht","Quartiersbeobachterin","Stadtbildpate","Gehwegaufsicht","Ruhestandskontrolleur","Mülltrennungsmentorin","Vorgartenkurator","Heckenhöhenbeobachterin","Parkplatzethiker","Laminierungsbeauftragte","Eingabefreund","Beschwerdebevollmächtigte","Vertreter der Bürgerempörung","Sprecherin der schweigenden Mehrheit","Freiwilliges Ordnungsamt","Schatten-Ordnungsamt","Hilfshausmeisterin","Formularpatriot","Regelbotschafterin","Normenfreund","DIN-Flüsterin","Grammatikpolizei","Kasuswacht","Artikeldienst","Nebensatzaufsicht","Kommakontrollrat","Dativschutzbund","Präpositionsprüfstelle","selbsternannte Sprachlehrerin","ehrenamtlicher Ausspracheprüfer","B1-Türsteherin","Zertifikatsorakel","Einbürgerungsquizwart","Integrationsindikatorin","Bürgerinitiative Saubere Grammatik","Verein für kontrollierte Umgangssprache","Sprachstandspate","Akzentbeobachterin","Redewendungsbeauftragter","Amtlichkeitsenthusiastin","Zuständigkeitsberater","Verfahrensbegleiterin ohne Auftrag","para-polizeilicher Nachbar","Fensterbankleitstelle","private Heckenstreife"
]);

const nameBank=Object.freeze({
 given:Object.freeze(["Gisela","Brigitte","Heike","Sabine","Monika","Ingrid","Renate","Petra","Anke","Karin","Ute","Ursula","Helga","Elke","Rüdiger","Uwe","Klaus-Dieter","Dietmar","Norbert","Wolfgang","Jürgen","Manfred","Bernd","Horst","Günter","Hartmut"]),
 family:Object.freeze(["Becker","Schmidt","Müller","Schneider","Fischer","Weber","Meyer","Wagner","Hoffmann","Schulz","Schäfer","Koch","Richter","Klein","Wolf","Neumann","Schwarz","Krüger","Werner","Hartmann","Vogel","Friedrich","Keller","Franke","Berger"])
});

window.GermanySimulatorQuizCharacters=Object.freeze({version:2,characters,archetypeLexicon,nameBank});
})();
