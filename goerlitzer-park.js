(function(){
"use strict";
// Shared by the game and renderer diagnostic; the 560-unit city offset is applied once.
window.GoerlitzerPark=Object.freeze({
 x:1450+560,y:2380+560,w:800,h:480,plaqueX:2026+560,plaqueY:2902+560,
 trees:Object.freeze([[1555,2490],[1660,2680],[2040,2480],[2130,2670]].map(([x,y])=>Object.freeze({x:x+560,y:y+560}))),
 signLines:Object.freeze([
  "CDU-geführter Berliner Senat · CDU/SPD",
  "ZAUN + TORE: rund 1,8 Mio. €",
  "Berichtete Baukosten · Februar 2026",
  "WACHSCHUTZ: 251.444 € netto",
  "Gemeldet: 2025 + Januar 2026",
  "BETRIEB + WACHEN: 775.000 €/Jahr",
  "Haushalt 2026 / 2027 · je Jahr",
  "Öffentliche Mittel · Details / Quellen: E"
 ]),
 lines:Object.freeze([
  "GÖRLITZER PARK · MINIATUR. Please enjoy die Grünanlage from outside. Doppelzaun, Stacheldraht, Wachtürme und die permanente Sperre sind übertriebene Spielsatire.",
  "REAL COSTS · CDU-geführter Berliner Senat (CDU/SPD). Zaun und Tore kosteten laut dpa vom 25. Februar 2026 knapp 1,8 Millionen Euro. Öffentliche Berliner Mittel, keine Ausgaben der CDU-Parteikasse.",
  "WACHSCHUTZ · Laut Senatsantwort vom 18. März 2026: 192.227 Euro netto für 2025 und 59.217 Euro netto für Januar 2026. Together: 251.444 Euro netto, einschließlich Bau- und Zaunbewachung. Kein reiner Nachtpatrouillen-Betrag.",
  "ANNUAL BUDGET · Je 775.000 Euro für 2026 und 2027 sind für Zaunbetrieb, Dienstgebäudemiete und private Wachkräfte eingeplant. Das ist ein Haushaltsansatz, keine belegte Jahresausgabe. Please do not add: Kostenarten und Zeiträume überschneiden sich.",
  "QUELLEN · Berliner Abgeordnetenhaus: Drucksachen 19/22762 und 19/25369; Haushalt Hauptausschuss 2655 F-1, Seite 85. Der frühere Baukostenrahmen von 1,74 Millionen Euro brutto enthielt bereits Baubewachung. Bau und Wachen daher nicht doppelt zählen.",
  "REALITY CHECK · In Wirklichkeit ging es um nächtliche Schließungen. Das Verwaltungsgericht setzte die Schließungsanordnung am 1. Juni 2026 vorläufig außer Vollzug. Unsere militärische Dauersperre ist ausdrücklich fiktiv. Park enjoyment: administrativ outsourced."
 ])
});
})();
