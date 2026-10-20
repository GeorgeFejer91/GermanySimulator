(function(root){
  'use strict';
  const catalogue=Object.freeze([
{id:"jobcenter",name:"JOBCENTER BERLIN MITTE",x:9290,y:1260,w:510,h:430,hgt:180,doorX:9545,doorY:1720,sign:"MÜLLERSTRASSE 16 · KUNDEN-EINGANG"},
{id:"jwd-villa-linde",residential:true,variant:"villa",name:"VILLA LINDENHOF",x:110,y:3380,w:200,h:190,hgt:170,doorX:210,doorY:3600,sign:"PRIVATWEG · BITTE GRÜSSEN"},
{id:"jwd-villa-wald",residential:true,variant:"villa",name:"HAUS WALDFRIEDEN",x:430,y:3380,w:240,h:190,hgt:150,doorX:550,doorY:3600,sign:"SEIT 1928 IN GUTER NACHBARSCHAFT"},
{id:"jwd-landhaus",residential:true,variant:"landhaus",name:"LANDHAUS NR. 34",x:790,y:3400,w:170,h:170,hgt:115,doorX:875,doorY:3600,sign:"KEINE WERBUNG · AUCH KEINE IDEEN"},
{id:"jwd-fink",residential:true,storeys:2,name:"FAMILIE SCHWABINGEN",x:100,y:3730,w:240,h:140,hgt:195,doorX:220,doorY:3900,sign:"KEHRWOCHE IST IMMER"},
{id:"jwd-home",residential:true,storeys:1,name:"DEIN ZUHAUSE · JWD",x:410,y:3730,w:240,h:140,hgt:95,doorX:530,doorY:3900,sign:"JANZ WEIT DRAUSSEN · NR. 38"},
{id:"jwd-kranz",residential:true,storeys:3,name:"FAMILIE MAASLOS",x:720,y:3730,w:240,h:140,hgt:265,doorX:840,doorY:3900,sign:"EIGENHEIM · FREMDE SORGEN"},
{id:"buergeramt",name:"BÜRGERAMT",x:150,y:220,w:350,h:250,hgt:115,doorX:325,doorY:500,sign:"TERMIN NUR MIT TERMIN"},
{id:"hausverwaltung",name:"HAUSVERWALTUNG",x:590,y:210,w:330,h:255,hgt:95,doorX:755,doorY:495,sign:"WOHNUNGSGEBERBESTÄTIGUNG"},
{id:"stadtbild",name:"AMT FÜR STADTBILD",x:1390,y:220,w:360,h:245,hgt:105,doorX:1570,doorY:495,sign:"OPTISCHE ORDNUNG · DIN 0815"},
{id:"auslaender",name:"AUSLÄNDERBEHÖRDE",x:1840,y:190,w:430,h:280,hgt:130,doorX:2055,doorY:505,sign:"VORSPRACHE NUR NACH VORSPRACHE"},
{id:"finanzamt",name:"FINANZAMT",x:1420,y:1260,w:360,h:265,hgt:120,doorX:1600,doorY:1555,sign:"STEUERN · NUMMERN · RÜCKFRAGEN"},
{id:"krankenkasse",name:"KRANKENKASSE",x:1900,y:1260,w:340,h:260,hgt:90,doorX:2070,doorY:1550,sign:"BITTE BLEIBEN SIE GESUND"},
{id:"polizei",name:"POLIZEI",x:2900,y:3300,w:650,h:360,hgt:185,doorX:3225,doorY:3690,sign:"ABSCHNITT 08 · GARTENAUFSICHT · RASENKOMPETENZ"},
{id:"spaeti",name:"SPÄTI",x:130,y:620,w:250,h:145,hgt:55,doorX:255,doorY:795,sign:"PFAND · MATE · ALLES"},
{id:"krugers-kugellager",name:"KRÜGERS KUGELLAGER",x:600,y:545,w:300,h:140,hgt:74,doorX:750,doorY:720,sign:"KUGELLAGER ZUM MITNEHMEN"},
{id:"imbiss",name:"WURST-INSEL",x:1900,y:630,w:280,h:150,hgt:55,doorX:2040,doorY:810,sign:"BRATWURST · CURRYWURST"},
{id:"faxamt",name:"BUNDESFAXAMT",x:2700,y:250,w:620,h:380,hgt:180,doorX:3010,doorY:660,sign:"DIGITALISIERUNG DURCH PAPIER"},
{id:"tuev",name:"TÜV-ZENTRUM",x:3700,y:250,w:650,h:390,hgt:175,doorX:4025,doorY:670,sign:"BITTE BLEIBEN SIE PRÜFBAR"},
{id:"sparkasse",name:"SPARKASSE",x:2750,y:1260,w:600,h:400,hgt:165,doorX:3050,doorY:1690,sign:"BERATUNG NUR MIT TERMIN"},
{id:"post",name:"DEUTSCHE POST",x:3700,y:1260,w:650,h:400,hgt:170,doorX:4025,doorY:1690,sign:"BRIEF · FAX · WARTEMARKE"},
{id:"rathaus",name:"RATHAUS",x:2750,y:2320,w:700,h:430,hgt:205,doorX:3100,doorY:2780,sign:"BÜRGERNÄHE NACH TERMINVEREINBARUNG"},
{id:"baumarkt",name:"DIN-BAUMARKT",x:3700,y:2320,w:650,h:430,hgt:160,doorX:4025,doorY:2780,sign:"NORMGERECHTE SCHRAUBEN · ABTEILUNG 7"},
{id:"ordnungsamt",name:"ORDNUNGSAMT",x:4750,y:230,w:850,h:410,hgt:175,doorX:5175,doorY:670,sign:"REGELBEOBACHTUNG · AUCH RÜCKWIRKEND"},
{id:"formulararchiv",name:"BUNDESFORMULARARCHIV",x:6250,y:220,w:850,h:420,hgt:190,doorX:6675,doorY:670,sign:"ABLAGE NUR MIT ABLAGEBESCHEID"},
{id:"terminamt",name:"TERMINVERGABESTELLE",x:7800,y:230,w:920,h:410,hgt:180,doorX:8260,doorY:670,sign:"TERMINE FÜR TERMINANFRAGEN"},
{id:"mietpruefung",name:"MIETPRÜFSTELLE",x:4750,y:1260,w:850,h:400,hgt:150,doorX:5175,doorY:1690,sign:"WOHNRAUM · NACHWEIS · GEGENNACHWEIS"},
{id:"querungsamt",name:"STRASSENQUERUNGSAMT",x:6250,y:1260,w:850,h:400,hgt:185,doorX:6675,doorY:1690,sign:"ZEBRASTREIFEN · WINKEL · AUFSICHT"},
{id:"fundbuero",name:"FUNDBÜRO",x:7800,y:1260,w:920,h:400,hgt:145,doorX:8260,doorY:1690,sign:"VERLORENES BITTE VORHER ANMELDEN"},
{id:"laermamt",name:"AMT FÜR ZIMMERLAUTSTÄRKE",x:4750,y:2320,w:850,h:430,hgt:165,doorX:5175,doorY:2780,sign:"FLÜSTERN NUR NACH ANTRAG"},
{id:"faxlager",name:"BEZIRKSFAXLAGER",x:6250,y:2320,w:850,h:430,hgt:175,doorX:6675,doorY:2780,sign:"PAPIERWEG BESCHLEUNIGT"},
{id:"reinigung",name:"STADTREINIGUNG",x:7800,y:2320,w:920,h:430,hgt:170,doorX:8260,doorY:2780,sign:"TRENNUNG VOR REINIGUNG"},
{id:"sandalenladen",name:"SANDALENHAUS",x:150,y:2380,w:320,h:220,hgt:73,doorX:310,doorY:2630,sign:"SANDALEN · AUCH MIT SOCKEN"},
{id:"sockenladen",name:"SOCKENFACHGESCHÄFT",x:510,y:2380,w:320,h:220,hgt:73,doorX:670,doorY:2630,sign:"SOCKEN · PASSEND ZUR SANDALE"},
{id:"akw",kind:"nuclear",name:"AKW · GESCHLOSSEN",x:4750,y:3370,w:850,h:420,hgt:155,doorX:5175,doorY:3820,sign:"STILLGELEGT · ZUGANG VERSIEGELT"},
{id:"kohlewerk",kind:"coal",name:"KOHLEKRAFTWERK · IN BETRIEB",x:6250,y:3370,w:850,h:420,hgt:170,doorX:6675,doorY:3820,sign:"OFFEN · 24/7 · RAUCHFANG AKTIV"},
{id:"bundestag",name:"DEUTSCHER BUNDESTAG",x:7680,y:3320,w:1200,h:876,hgt:220,doorX:8280,doorY:4226,sign:"REICHSTAGSGEBÄUDE · PLENARBEREICH"}
].map(Object.freeze));

  function createBuildings(offset=0,ids){
    const selected=ids?ids.map(id=>{
      const building=catalogue.find(record=>record.id===id);
      if(!building)throw new RangeError('Unknown building: '+id);
      return building;
    }):catalogue;
    return selected.map(building=>({...building,x:building.x+offset,y:building.y+offset,doorX:building.doorX+offset,doorY:building.doorY+offset}));
  }

  const api=Object.freeze({catalogue,createBuildings});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.GermanyBuildings=api;
})(globalThis);
