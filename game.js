(function(){
"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d"),keys=Object.create(null),WORLD={w:9600,h:4000};
const player={x:1800,y:1760,r:16,energy:100,facing:0};
const state={started:false,modal:false,dialogue:false,wanted:0,offence:"AKTENLAGE: UNAUFFÄLLIG",wantedCooldown:0,runTimer:0,runWarned:false,roadTimer:0,roadWarned:false,jayCooldown:0,grassTimer:0,grassWarned:false,gardenCooldown:0,evasionTimer:0,pettyAuditTimer:18,mission:0,forms:0,pfand:0,day:1,minutes:480,stadtbild:0,citizen:false,gameOver:false,rule:0,ruleTimer:0,lang:"de",voiceOn:true,region:"berlin",regionCooldown:0};
let police=[],particles=[],width=innerWidth,height=innerHeight,dpr=1,last=performance.now();
const horizontalRoads=[{x:0,y:820,w:WORLD.w,h:260},{x:0,y:2000,w:WORLD.w,h:240},{x:0,y:3000,w:WORLD.w,h:220}];
const verticalRoads=[{x:1050,y:0,w:260,h:WORLD.h},{x:2400,y:0,w:220,h:WORLD.h},{x:4400,y:0,w:180,h:WORLD.h},{x:5850,y:0,w:220,h:WORLD.h},{x:7350,y:0,w:220,h:WORLD.h},{x:9000,y:0,w:180,h:WORLD.h}];
const roads=[...horizontalRoads,...verticalRoads];
const crossings=[];
for(const h of horizontalRoads)for(const v of verticalRoads){
 crossings.push({x:v.x-40,y:h.y+Math.round((h.h-80)/2),w:v.w+80,h:80});
 crossings.push({x:v.x+Math.round((v.w-90)/2),y:h.y-60,w:90,h:h.h+120});
}
crossings.push({x:3590,y:2985,w:120,h:270},{x:6550,y:2985,w:120,h:270},{x:8200,y:2985,w:120,h:270});
const crossingSigns=[];
for(const c of crossings){
 if(c.w>c.h){crossingSigns.push({x:c.x+18,y:c.y-26,turn:0},{x:c.x+c.w-18,y:c.y+c.h+26,turn:2})}
 else{crossingSigns.push({x:c.x-28,y:c.y+22,turn:1},{x:c.x+c.w+28,y:c.y+c.h-22,turn:3})}
}
const schreber={x:90,y:1210,w:560,h:570};
const policeGarden={x:2850,y:3250,w:1500,h:650};
const BORDER_Y=1120;
const BORDER_BAND=72;
const borderGates=verticalRoads.map(r=>({x:r.x-55,w:r.w+110}));
const borderSegments=[];
for(let cursor=0,i=0;i<=borderGates.length;i++){
 const gate=borderGates[i],end=gate?gate.x:WORLD.w;
 if(end-cursor>24)borderSegments.push({x:cursor,w:end-cursor});
 if(gate)cursor=gate.x+gate.w;
}
const fireSources=[];
for(let x=36,i=0;x<WORLD.w;x+=72,i++)fireSources.push({x,y:BORDER_Y,active:true,intensity:.82+(i%5)*.035,seed:(i*47%101)/101});
const policePath={x1:4250,y1:3850,x2:3650,y2:3250,width:130};
const districtLots=[
 {x:2660,y:80,w:1650,h:620,fill:"#85827b"},
 {x:2660,y:1180,w:1650,h:650,fill:"#88857e"},
 {x:2660,y:2280,w:1650,h:520,fill:"#817f78"},
 {x:4660,y:80,w:1090,h:620,fill:"#817f79"},{x:6150,y:80,w:1100,h:620,fill:"#89857d"},{x:7650,y:80,w:1250,h:620,fill:"#827f78"},
 {x:4660,y:1180,w:1090,h:650,fill:"#88847c"},{x:6150,y:1180,w:1100,h:650,fill:"#817f79"},{x:7650,y:1180,w:1250,h:650,fill:"#89867f"},
 {x:4660,y:2280,w:1090,h:520,fill:"#85827b"},{x:6150,y:2280,w:1100,h:520,fill:"#89857d"},{x:7650,y:2280,w:1250,h:520,fill:"#817f78"},
 {x:4660,y:3260,w:1090,h:660,fill:"#79766f"},{x:6150,y:3260,w:1100,h:660,fill:"#74726c"}
];
const districtLabels=[
 {x:3000,y:120,text:"FAXVIERTEL"},
 {x:3000,y:1220,text:"SPARKASSEN- UND POSTBEZIRK"},
 {x:3000,y:2320,text:"RATHAUS- UND DIN-ZONE"},
 {x:3150,y:3280,text:"POLIZEILICHER SCHREBERKOMPLEX"},
 {x:4820,y:120,text:"ORDNUNGSAMT-KORRIDOR"},{x:6320,y:120,text:"BUNDESFORMULARARCHIV"},{x:7820,y:120,text:"TERMINVERGABEBEZIRK"},
 {x:4820,y:1220,text:"MIETPRÜFVIERTEL"},{x:6320,y:1220,text:"STRASSENQUERUNGSAMT"},{x:7820,y:1220,text:"FUNDBÜRO-ZONE"},
 {x:4820,y:2320,text:"LÄRMSCHUTZBEZIRK"},{x:6320,y:2320,text:"BEZIRKSFAXLAGER"},{x:7820,y:2320,text:"STADTREINIGUNGSKORRIDOR"},
 {x:4820,y:3290,text:"ENERGIEWENDE-SONDERBEZIRK"},{x:6320,y:3290,text:"KOHLE-BEREITSCHAFTSZONE"}
];

const props=[
 {x:130,y:1180,asset:"gartenzwerg",w:42,h:64},
 {x:360,y:1260,asset:"gartenzwerg",w:42,h:64},
 {x:590,y:1380,asset:"gartenzwerg",w:42,h:64},
 {x:720,y:1595,asset:"rasen",w:72,h:60},
 {x:1150,y:1900,asset:"rasen",w:72,h:60},
 {x:530,y:660,asset:"wartemarke",w:58,h:38},
 {x:1360,y:1180,asset:"muell",w:82,h:54},
 {x:560,y:505,asset:"ordner",w:36,h:48},
 {x:985,y:1160,asset:"db",w:100,h:66,id:"db",label:"DB-ANZEIGE"},
 {x:1010,y:720,asset:"baustelle",w:105,h:62,id:"baustelle",label:"BAUSTELLE"},
 {x:1320,y:1185,asset:"fahrrad",w:88,h:56,id:"fahrrad",label:"FAHRRAD"},
 {x:455,y:545,asset:"kaffee",w:48,h:66,id:"kaffee",label:"KAFFEEAUTOMAT",used:false},
 {x:575,y:1170,asset:"pfandautomat",w:54,h:70,id:"pfandautomat",label:"PFANDAUTOMAT"},
 {x:2860,y:760,asset:"faxbillboard",w:210,h:118,id:"faxbillboard-nord",label:"FAX 3000 PRO"},
 {x:3500,y:1880,asset:"faxbillboard",w:210,h:118,id:"faxbillboard-mitte",label:"FAX 3000 PRO"},
 {x:3980,y:2890,asset:"faxbillboard",w:210,h:118,id:"faxbillboard-sued",label:"FAX 3000 PRO"},
 {x:3050,y:700,asset:"faxgeraet",w:66,h:54,id:"faxgeraet",label:"FAX 3000"},
 {x:2650,y:1160,asset:"faxkiosk",w:54,h:86,id:"faxkiosk",label:"ÖFFENTLICHES FAX"},
 {x:2940,y:3340,asset:"polizeigarten",w:94,h:74,id:"polizei-garten-a",label:"RASENKOMPETENZ"},
 {x:4250,y:3340,asset:"polizeigarten",w:94,h:74,id:"polizei-garten-b",label:"RASENKOMPETENZ"},
 {x:3000,y:3600,asset:"gartenzwerg",w:44,h:66},
 {x:3300,y:3450,asset:"gartenzwerg",w:44,h:66},
 {x:4000,y:3700,asset:"gartenzwerg",w:44,h:66},
 {x:5200,y:700,asset:"faxgeraet",w:66,h:54,id:"faxgeraet-ost",label:"FAX-AUSSENSTELLE"},
 {x:6750,y:1880,asset:"faxbillboard",w:210,h:118,id:"faxbillboard-ost",label:"FAX 3000 PRO"},
 {x:8350,y:2890,asset:"faxkiosk",w:54,h:86,id:"faxkiosk-ost",label:"ÖFFENTLICHES FAX"},
 {x:5600,y:1885,asset:"fahrrad",w:88,h:56,id:"fahrrad-ost",label:"FAHRRAD"},
 {x:7180,y:2890,asset:"baustelle",w:105,h:62,id:"baustelle-ost",label:"DAUERBAUSTELLE"},
 {x:8750,y:1880,asset:"pfandautomat",w:54,h:70,id:"pfandautomat-ost",label:"PFANDAUTOMAT"},
 {x:7600,y:3500,asset:"gartenzwerg",w:44,h:66},{x:8750,y:3420,asset:"gartenzwerg",w:44,h:66},{x:9400,y:3650,asset:"gartenzwerg",w:44,h:66}
];
const assetSources={
 currywurst:"./assets/currywurst.svg",bratwurst:"./assets/bratwurst.svg",brezel:"./assets/brezel.svg",
 pfand:"./assets/pfandflasche.svg",gartenzwerg:"./assets/gartenzwerg.svg",ordner:"./assets/ordner.svg",
 wartemarke:"./assets/wartemarke.svg",rasen:"./assets/rasen-verboten.svg",muell:"./assets/muelltrennung.svg",
 db:"./assets/db-verspaetung.svg",baustelle:"./assets/baustelle.svg",fahrrad:"./assets/fahrrad.svg",kaffee:"./assets/kaffeeautomat.svg",pfandautomat:"./assets/pfandautomat.svg",
 faxbillboard:"./assets/fax-billboard.svg",faxgeraet:"./assets/faxgeraet.svg",faxkiosk:"./assets/telefon-fax-kiosk.svg",
 merkel:"./assets/merkel-cartoon.svg",merkelSprite:"./assets/merkel-sprite.png",polizeigarten:"./assets/polizei-garten-schild.svg",borderPourer:"./assets/border-pourer-sprite.png"
};
const assets={};for(const key in assetSources){const img=new Image();img.src=assetSources[key];assets[key]=img}
const borderPourerSprite={canvas:null,cols:5,rows:6};
function prepareBorderPourerSprite(){
 const img=assets.borderPourer;if(!img||!img.naturalWidth||borderPourerSprite.canvas)return;
 const fw=img.naturalWidth/borderPourerSprite.cols,fh=img.naturalHeight/borderPourerSprite.rows,c=document.createElement("canvas"),g=c.getContext("2d",{willReadFrequently:true});c.width=img.naturalWidth;c.height=img.naturalHeight;g.drawImage(img,0,0);
 const pixels=g.getImageData(0,0,c.width,c.height),data=pixels.data,count=c.width*c.height;let mask=new Uint8Array(count),next;
 for(let i=0,p=0;i<count;i++,p+=4)if(Math.max(data[p],data[p+1],data[p+2])>9)mask[i]=1;
 for(let pass=0;pass<2;pass++){
  next=mask.slice();
  for(let y=1;y<c.height-1;y++)for(let x=1;x<c.width-1;x++){const i=y*c.width+x;if(!mask[i]&&(mask[i-1]||mask[i+1]||mask[i-c.width]||mask[i+c.width]))next[i]=1}
  mask=next;
 }
 for(let i=0,p=3;i<count;i++,p+=4)data[p]=mask[i]?255:0;
 g.putImageData(pixels,0,0);
 g.clearRect(fw*3,fh*2,28,fh);g.clearRect(fw*4,fh*2,20,fh);
 for(let col=1;col<borderPourerSprite.cols;col++)g.clearRect(col*fw-2,0,4,c.height);
 for(let row=1;row<borderPourerSprite.rows;row++)g.clearRect(0,row*fh-2,c.width,4);
 const clean=document.createElement("canvas"),cg=clean.getContext("2d"),pad=5;clean.width=c.width;clean.height=c.height;
 for(let row=0;row<borderPourerSprite.rows;row++)for(let col=0;col<borderPourerSprite.cols;col++)cg.drawImage(c,col*fw,row*fh,fw,fh,col*fw+pad,row*fh+pad,fw-pad*2,fh-pad*2);
 borderPourerSprite.canvas=clean;
}
assets.borderPourer.addEventListener("load",prepareBorderPourerSprite,{once:true});if(assets.borderPourer.complete)prepareBorderPourerSprite();
const policeBarks={
 berlin:["HALT! Stop mal immediately!","Nicht auf ze grass, bitte!","Ausweis, ID, irgendwas Officiales!","Please leave den Grünbereich sofort!","Das ist so wirklich not vorgesehen!","Bleiben Sie hinter ze line!"],
 germany:["HALT! STEHENBLEIBEN!","NICHT ÜBER DEN RASEN!","AUSWEIS BITTE!","SIE VERLASSEN SOFORT DEN GRÜNBEREICH!","DAS IST SO NICHT VORGESEHEN!","BLEIBEN SIE HINTER DER LINIE!"]
};
const npcDenglisch=["Also this ist jetzt aber auch nicht so gedacht.","Kann man machen. Muss man aber really nicht.","Ich möchte mich nicht complainen, aber ich complain jetzt.","Dafür gibt es bestimmt ein Formular, probably online but not really.","Früher war hier weniger process.","Sie stehen minimal im way.","Das ist bestimmt wegen der Baustelle. Die ist since 2009 da.","Dafür bin ich not responsible.","Ordnung muss schon sein, you know.","Haben Sie dafür einen appointment?"];
const jaywalkerBarks={
 berlin:["Think of the rules! Der Zebrastreifen ist literally right there!","Think of the Kinder! So überquert man keine Straße!","Schande! You ignored die amtlich weißen stripes!","Hast du Tomaten auf den Augen?! Use the official crossing!","Unfassbar! Erst schauen, then formgerecht queren!","Verkehrsrowdy! This crossing was not approved by anybody!"],
 germany:["Denken Sie an die Regeln! Der Zebrastreifen ist gleich dort!","Denken Sie an die Kinder! So überquert man keine Straße!","Schande! Sie haben die amtlich markierten Streifen missachtet!","Haben Sie Tomaten auf den Augen?! Benutzen Sie den offiziellen Überweg!","Unfassbar! Erst schauen, dann formgerecht queren!","Verkehrsrowdy! Diese Querung war von niemandem genehmigt!"]
};
const violationPools={
 jaywalk:["FAHRBAHNÜBERQUERUNG AUSSERHALB MARKIERTER GEOMETRIE","MISSACHTUNG AMTLICH WEISSER QUERUNGSSTREIFEN","DIAGONALE QUERUNG OHNE WINKELBESCHEINIGUNG"],
 sprint:["VERDÄCHTIG ZÜGIGES FORTBEWEGEN OHNE SPORTBESCHEINIGUNG","UNNÖTIGE DYNAMIK IM ÖFFENTLICHEN RAUM","FORTBEWEGUNG OBERHALB DER VERWALTUNGSÜBLICHEN TAKTUNG"],
 grass:["RASENBETRETUNG IM SCHREBERGARTEN · SOFORTMASSNAHME","GRÜNFLÄCHENNUTZUNG OHNE HALMBERÜHRUNGSERLAUBNIS","VERLASSEN DES VORGESEHENEN FUSSBODENBELAGS"],
 audit:["SPAZIERGANG OHNE ERKENNBAREN VERWALTUNGSVORGANG","MITFÜHREN EINER UNGEPRÜFTEN GEHRICHTUNG","AUFENTHALT IM SICHTBEREICH EINER VORSCHRIFT","UNVOLLSTÄNDIG DOKUMENTIERTE ORTSVERÄNDERUNG","VERDACHT AUF SPONTANEITÄT OHNE TERMIN"]
};
const englishText=new Map([
 ["ANMELDUNG I","REGISTRATION I"],["ANMELDUNG II","REGISTRATION II"],["ANMELDUNG III","REGISTRATION III"],
 ["STEUERLICHE ERFASSUNG","TAX REGISTRATION"],["VERSICHERUNGSNACHWEIS","INSURANCE EVIDENCE"],["DAS STADTBILD","THE CITY IMAGE"],["AUFENTHALT","RESIDENCE"],["EINBÜRGERUNG","CITIZENSHIP"],
 ["Gehen Sie zum Bürgeramt. Beantragen Sie die Erlaubnis, einen Antrag zu stellen.","Go to the Bürgeramt. Apply for permission to submit an application."],
 ["Die Wohnungsgeberbestätigung fehlt natürlich. Holen Sie sie bei der Hausverwaltung.","Naturally, the landlord confirmation is missing. Collect it from the property management office."],
 ["Zurück zum Bürgeramt. Jetzt fehlt das Ergänzungsblatt zum Ergänzungsblatt.","Back to the Bürgeramt. You are now missing the supplementary sheet for the supplementary sheet."],
 ["Gehen Sie zum Finanzamt. Dort erhalten Sie eine Nummer, mit der Sie weitere Nummern beantragen.","Go to the Finanzamt. There you receive a number allowing you to apply for more numbers."],
 ["Die Krankenkasse benötigt einen Nachweis, dass der Nachweis beantragt wurde.","The health insurer requires evidence that the evidence has been requested."],
 ["Das Stadtbildamt verlangt drei dringende optische Normierungen.","The City Image Office requires three urgent visual standardisations."],
 ["Beweisen Sie der Ausländerbehörde, dass Sie bereits alles bewiesen haben.","Prove to the immigration office that you have already proved everything."],
 ["Letzter fiktiver Antrag: deutsche Staatsangehörigkeit durch administratives Durchhaltevermögen.","Final application: German citizenship through administrative endurance."],
 ["Also das ist jetzt aber auch nicht so gedacht.","Well, that is really not how this was intended."],
 ["Kann man machen. Muss man aber wirklich nicht.","You can do that. But you really do not have to."],
 ["Ich möchte mich nicht beschweren, aber ich beschwere mich.","I do not want to complain, but I am complaining."],
 ["Dafür gibt es bestimmt ein Formular.","There is certainly a form for that."],
 ["Früher war hier weniger Vorgang.","There used to be less procedure here."],
 ["Sie stehen minimal im Weg.","You are standing very slightly in the way."],
 ["Das ist bestimmt wegen der Baustelle. Die ist seit 2009 da.","That is probably because of the construction site. It has been there since 2009."],
 ["Dafür bin ich nicht zuständig.","I am not responsible for that."],
 ["Ordnung muss schon sein.","There does have to be order."],
 ["Haben Sie dafür einen Termin?","Do you have an appointment for that?"],
 ["Schrebergarten-Rasen ist anzuschauen, nicht zu betreten. Zuwiderhandlung löst sofortige Gefahrenabwehr aus.","Allotment-garden lawn is for viewing, not walking. Violations trigger immediate intervention."],
 ["Überdurchschnittlich zügiges Gehen kann als unnötige Dynamik gewertet werden.","Above-average walking speed may be treated as unnecessary dynamism."],
 ["Fahrbahnen sind ausschließlich an geometrisch vorgesehenen Stellen zu überqueren.","Roads may only be crossed at geometrically designated locations."],
 ["Mülltonnen müssen parallel zur gefühlten Bordsteinkante stehen.","Bins must remain parallel to the perceived kerb."],
 ["Spontaneität bedarf grundsätzlich der vorherigen Terminvereinbarung.","Spontaneity generally requires a prior appointment."],
 ["Leergut ist kein Müll, sondern temporär illiquides Vermögen.","Empty returnable bottles are not rubbish but temporarily illiquid assets."],
 ["Nach 22:00 Uhr ist sogar enthusiastisches Denken nur in Zimmerlautstärke zulässig.","After 22:00 even enthusiastic thinking is permitted only at room volume."],
 ["Wer wartet, hat durch sichtbares Warten seine Wartebereitschaft nachzuweisen.","Anyone waiting must demonstrate willingness to wait by visibly waiting."],
 ["Zebrastreifen sind sichtbar, amtlich und mit angemessener Dankbarkeit zu benutzen.","Zebra crossings are visible, official, and must be used with appropriate gratitude."],
 ["Unangekündigte Ortsveränderungen können als spontane Absicht gewertet werden.","Unannounced changes of location may be treated as spontaneous intent."],
 ["Berlin liegt hinter der Brandmauer und dort wird gedenglischt. Auf der Deutschlandseite wird ausschließlich Deutsch gesprochen.","Berlin is behind the Brandmauer and speaks Denglisch. On the Germany side, characters speak German only."]
]);
const formEnglish={a38:["Application Permit A38","Incomplete completeness is considered incomplete."],wohnung:["Landlord confirmation confirming a dwelling","Confirm that the dwelling in which you dwell is, in fact, a dwelling."],ergaenzung:["Supplementary sheet for the supplemented application","This form only became necessary because of the previous form."],steuer:["Tax registration questionnaire","The following numbers exist primarily to generate further numbers."],versicherung:["Application for evidence of evidence","Health is private. This form is not."],aufenthalt:["Application for continuation of presence","For your appointment you require evidence that your appointment occurred."],citizenship:["Application for German citizenship","Purely a game procedure. Not real law or a real requirement."]};
function localize(text){return state.lang==="en"?(englishText.get(text)||text):text}
function pointSegmentDistance(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy;if(!l2)return Math.hypot(px-x1,py-y1);const t=clamp(((px-x1)*dx+(py-y1)*dy)/l2,0,1),x=x1+t*dx,y=y1+t*dy;return Math.hypot(px-x,py-y)}
function onPoliceGardenPath(x,y){return pointSegmentDistance(x,y,policePath.x1,policePath.y1,policePath.x2,policePath.y2)<=policePath.width*.5}
function onPoliceGardenGrass(x,y){return inRect(x,y,policeGarden)&&!onPoliceGardenPath(x,y)}
function lawFor(msg){if(msg.includes("RASEN")||msg.includes("GRÜN")||msg.includes("FUSSBODEN"))return "SPIEL-§ 17.3b";if(msg.includes("FAHRBAHN")||msg.includes("QUERUNG")||msg.includes("STREIFEN"))return "SPIEL-§ 8a";if(msg.includes("ZÜGIG")||msg.includes("DYNAMIK")||msg.includes("FORTBEWEGUNG"))return "SPIEL-§ 4 Abs. 2";if(msg.includes("BRANDMAUER")||msg.includes("GRENZ"))return "SPIEL-§ B/DE 1";if(msg.includes("POLIZEI")||msg.includes("ENTZIEHUNG"))return "SPIEL-§ 23 FluchtV";return "SPIEL-§ 404"}
function regionOf(y){return y>BORDER_Y?"berlin":"germany"}
function showBorder(region){
 state.region=region;
 const box=document.getElementById("border-alert"),title=document.getElementById("border-title"),copy=document.getElementById("border-copy");
 if(region==="germany"){title.textContent="DEUTSCHLAND";copy.textContent="BERLIN LIEGT HINTER DER BRANDMAUER. AB HIER NUR NOCH DEUTSCH.";speak("Berlin liegt hinter der Brandmauer. Ab hier nur noch Deutsch.",{urgent:true})}
 else{title.textContent="BERLIN";copy.textContent="BERLIN LIEGT HINTER DER BRANDMAUER. DENG-LISCH IST WIEDER ZULÄSSIG.";speak("Berlin liegt hinter der Brandmauer. Welcome back. Denglisch ist wieder erlaubt.")}
 box.hidden=false;clearTimeout(showBorder.t);showBorder.t=setTimeout(()=>box.hidden=true,2100);
 uiTone(region==="germany"?330:440,.12,"square",.04);updateHud()
}
function updateRegion(){
 const next=regionOf(player.y);
 state.regionCooldown=Math.max(0,state.regionCooldown-.016);
 if(next!==state.region&&state.regionCooldown<=0){state.regionCooldown=1;showBorder(next)}
}
function worldNpcLine(index){return state.region==="berlin"?npcDenglisch[index]:npcLines[index]}


const buildings=[
{id:"buergeramt",name:"BÜRGERAMT",x:150,y:220,w:350,h:250,hgt:115,doorX:325,doorY:500,sign:"TERMIN NUR MIT TERMIN"},
{id:"hausverwaltung",name:"HAUSVERWALTUNG",x:590,y:210,w:330,h:255,hgt:95,doorX:755,doorY:495,sign:"WOHNUNGSGEBERBESTÄTIGUNG"},
{id:"stadtbild",name:"AMT FÜR STADTBILD",x:1390,y:220,w:360,h:245,hgt:105,doorX:1570,doorY:495,sign:"OPTISCHE ORDNUNG · DIN 0815"},
{id:"auslaender",name:"AUSLÄNDERBEHÖRDE",x:1840,y:190,w:430,h:280,hgt:130,doorX:2055,doorY:505,sign:"VORSPRACHE NUR NACH VORSPRACHE"},
{id:"finanzamt",name:"FINANZAMT",x:1420,y:1260,w:360,h:265,hgt:120,doorX:1600,doorY:1555,sign:"STEUERN · NUMMERN · RÜCKFRAGEN"},
{id:"krankenkasse",name:"KRANKENKASSE",x:1900,y:1260,w:340,h:260,hgt:90,doorX:2070,doorY:1550,sign:"BITTE BLEIBEN SIE GESUND"},
{id:"polizei",name:"POLIZEI",x:2900,y:3300,w:650,h:360,hgt:185,doorX:3225,doorY:3690,sign:"ABSCHNITT 08 · GARTENAUFSICHT · RASENKOMPETENZ"},
{id:"spaeti",name:"SPÄTI",x:130,y:620,w:250,h:145,hgt:55,doorX:255,doorY:795,sign:"PFAND · MATE · ALLES"},
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
{id:"akw",kind:"nuclear",name:"AKW · GESCHLOSSEN",x:4750,y:3370,w:850,h:420,hgt:155,doorX:5175,doorY:3820,sign:"STILLGELEGT · ZUGANG VERSIEGELT"},
{id:"kohlewerk",kind:"coal",name:"KOHLEKRAFTWERK · IN BETRIEB",x:6250,y:3370,w:850,h:420,hgt:170,doorX:6675,doorY:3820,sign:"OFFEN · 24/7 · RAUCHFANG AKTIV"}];
const missions=[
{title:"ANMELDUNG I",text:"Gehen Sie zum Bürgeramt. Beantragen Sie die Erlaubnis, einen Antrag zu stellen.",target:"buergeramt",form:"a38"},
{title:"ANMELDUNG II",text:"Die Wohnungsgeberbestätigung fehlt natürlich. Holen Sie sie bei der Hausverwaltung.",target:"hausverwaltung",form:"wohnung"},
{title:"ANMELDUNG III",text:"Zurück zum Bürgeramt. Jetzt fehlt das Ergänzungsblatt zum Ergänzungsblatt.",target:"buergeramt",form:"ergaenzung"},
{title:"STEUERLICHE ERFASSUNG",text:"Gehen Sie zum Finanzamt. Dort erhalten Sie eine Nummer, mit der Sie weitere Nummern beantragen.",target:"finanzamt",form:"steuer"},
{title:"VERSICHERUNGSNACHWEIS",text:"Die Krankenkasse benötigt einen Nachweis, dass der Nachweis beantragt wurde.",target:"krankenkasse",form:"versicherung"},
{title:"DAS STADTBILD",text:"Das Stadtbildamt verlangt drei dringende optische Normierungen.",target:"stadtbild",form:null},
{title:"AUFENTHALT",text:"Beweisen Sie der Ausländerbehörde, dass Sie bereits alles bewiesen haben.",target:"auslaender",form:"aufenthalt"},
{title:"EINBÜRGERUNG",text:"Letzter fiktiver Antrag: deutsche Staatsangehörigkeit durch administratives Durchhaltevermögen.",target:"auslaender",form:"citizenship"}];
const rules=[
["§17.3b","Schrebergarten-Rasen ist anzuschauen, nicht zu betreten. Zuwiderhandlung löst sofortige Gefahrenabwehr aus."],
["§4 Abs.2","Überdurchschnittlich zügiges Gehen kann als unnötige Dynamik gewertet werden."],
["§8a","Fahrbahnen sind ausschließlich an geometrisch vorgesehenen Stellen zu überqueren."],
["DIN 0815","Mülltonnen müssen parallel zur gefühlten Bordsteinkante stehen."],
["§23f","Spontaneität bedarf grundsätzlich der vorherigen Terminvereinbarung."],
["PfandO §1","Leergut ist kein Müll, sondern temporär illiquides Vermögen."],
["RuheV §2","Nach 22:00 Uhr ist sogar enthusiastisches Denken nur in Zimmerlautstärke zulässig."],
["§5.1","Wer wartet, hat durch sichtbares Warten seine Wartebereitschaft nachzuweisen."],
["QuerO §9","Zebrastreifen sind sichtbar, amtlich und mit angemessener Dankbarkeit zu benutzen."],
["SpontV §3","Unangekündigte Ortsveränderungen können als spontane Absicht gewertet werden."],
["Bln/DE §1","Berlin liegt hinter der Brandmauer und dort wird gedenglischt. Auf der Deutschlandseite wird ausschließlich Deutsch gesprochen."]];
const npcLines=["Also das ist jetzt aber auch nicht so gedacht.","Kann man machen. Muss man aber wirklich nicht.","Ich möchte mich nicht beschweren, aber ich beschwere mich.","Dafür gibt es bestimmt ein Formular.","Früher war hier weniger Vorgang.","Sie stehen minimal im Weg.","Das ist bestimmt wegen der Baustelle. Die ist seit 2009 da.","Dafür bin ich nicht zuständig.","Ordnung muss schon sein.","Haben Sie dafür einen Termin?"];
const merzLines=Object.freeze(["Das Rote Rathaus zu stürmen? Das muss ein Ende haben.","Mein Großvater war kein Nationalsozialist, sondern eine beeindruckende Persönlichkeit und ein erfolgreicher Bürgermeister."]);
const MERKEL_AUDIO_LINE="Wir schaffen das.";
const MERKEL_BEHIND_LINE="Sie stehen hinter mir.";
const merkelLines=Object.freeze([
 MERKEL_AUDIO_LINE,
 "Wir brauchen kein Abschaltgesetz, sondern einen Ausstieg mit Augenmaß.",
 "Ich habe eine neue Bewertung vorgenommen.",
 "Die Risiken der Kernenergie sind nicht beherrschbar.",
 "Wer das erkennt, muss eine neue Bewertung vornehmen.",
 "Wir müssen uns darauf einstellen, dass wir schneller aussteigen.",
 "Wir wollen das schaffen."
]);
const politicianLines=Object.freeze({merz:merzLines,merkel:merkelLines});
const npcs=[
 {x:520,y:720,name:"HERR KLEIN",line:0,vx:16,vy:0,min:470,max:900},
 {x:1470,y:670,name:"FRAU MÜLLER",line:3,vx:-13,vy:0,min:1360,max:1760},
 {x:720,y:1140,name:"HERR SCHULZ",line:6,vx:0,vy:12,min:1100,max:1280},
 {x:2150,y:1120,name:"FRAU NEUMANN",line:2,vx:0,vy:-10,min:1010,max:1240},
 {x:1500,y:1660,name:"HERR DIN",line:8,vx:14,vy:0,min:1360,max:1800},
 {x:2900,y:720,name:"FRAU AKTENSTAPEL",line:3,vx:14,vy:0,min:2700,max:3350},
 {x:4050,y:720,name:"HERR TÜV",line:8,vx:-12,vy:0,min:3820,max:4300},
 {x:2920,y:1880,name:"FRAU SPARKASSE",line:5,vx:13,vy:0,min:2700,max:3350},
 {x:4050,y:1880,name:"HERR POST",line:7,vx:-12,vy:0,min:3820,max:4300},
 {x:borderGates[1].x+borderGates[1].w/2,y:BORDER_Y+34,name:"FRIEDRICH MERZ · FIKTIONALE SATIRE",special:"borderPourer",politician:"merz",dir:1,lane:1,state:"sideWalk",stateTimer:1.35,animTime:0,spriteRow:1,spriteFrame:0,spriteFlip:false,barkAt:0,lineIndex:0,minX:80,maxX:WORLD.w-80},
 {x:4620,y:3270,name:"ANGELA MERKEL · SATIRE",special:"merkel",politician:"merkel",route:[[4620,3270],[5750,3270],[6150,3270],[7200,3270],[7200,3880],[6120,3880],[5750,3880],[4620,3880]],target:1,facingX:1,facingY:0,animTime:0,spriteRow:2,spriteFrame:1,barkAt:0,lineIndex:0},
 {x:4200,y:3450,name:"HERR RASENAUFSICHT",line:8,vx:0,vy:10,min:3330,max:3820},
 {x:5100,y:720,name:"FRAU ORDNUNG",line:8,vx:13,vy:0,min:4750,max:5600},
 {x:6650,y:720,name:"HERR ARCHIV",line:3,vx:-11,vy:0,min:6250,max:7100},
 {x:8200,y:720,name:"FRAU TERMIN",line:9,vx:14,vy:0,min:7800,max:8700},
 {x:5200,y:1880,name:"HERR MIETNACHWEIS",line:1,vx:-12,vy:0,min:4750,max:5600},
 {x:6750,y:1880,name:"FRAU ZEBRA",line:8,vx:13,vy:0,min:6250,max:7100},
 {x:8300,y:1880,name:"HERR FUNDSACHE",line:7,vx:-12,vy:0,min:7800,max:8700},
 {x:5200,y:2860,name:"FRAU RUHE",line:5,vx:12,vy:0,min:4750,max:5600},
 {x:6750,y:2860,name:"HERR FAXROLLE",line:4,vx:-13,vy:0,min:6250,max:7100},
 {x:8300,y:2860,name:"FRAU TRENNUNG",line:6,vx:12,vy:0,min:7800,max:8700}
];
const pickups=[
 {x:1980,y:870,type:"bratwurst",label:"BRATWURST",taken:false,value:35},
 {x:2110,y:880,type:"currywurst",label:"CURRYWURST",taken:false,value:50},
 {x:1870,y:880,type:"brezel",label:"BREZEL",taken:false,value:22},
 {x:420,y:930,type:"pfand",label:"PFAND",taken:false},
 {x:930,y:1120,type:"pfand",label:"PFAND",taken:false},
 {x:1360,y:940,type:"pfand",label:"PFAND",taken:false},
 {x:2260,y:1210,type:"pfand",label:"PFAND",taken:false},
 {x:2860,y:900,type:"pfand",label:"PFAND",taken:false},
 {x:4100,y:900,type:"brezel",label:"BREZEL",taken:false,value:22},
 {x:3000,y:1910,type:"pfand",label:"PFAND",taken:false},
 {x:3950,y:1910,type:"currywurst",label:"CURRYWURST",taken:false,value:50},
 {x:2850,y:2890,type:"bratwurst",label:"BRATWURST",taken:false,value:35},
 {x:4100,y:2890,type:"pfand",label:"PFAND",taken:false},
 {x:4550,y:2500,type:"pfand",label:"PFAND",taken:false},
 {x:5100,y:930,type:"pfand",label:"PFAND",taken:false},{x:6650,y:930,type:"brezel",label:"BREZEL",taken:false,value:22},{x:8200,y:930,type:"pfand",label:"PFAND",taken:false},
 {x:5350,y:1910,type:"currywurst",label:"CURRYWURST",taken:false,value:50},{x:6900,y:1910,type:"pfand",label:"PFAND",taken:false},{x:8450,y:1910,type:"bratwurst",label:"BRATWURST",taken:false,value:35},
 {x:5050,y:2890,type:"pfand",label:"PFAND",taken:false},{x:6800,y:2890,type:"brezel",label:"BREZEL",taken:false,value:22},{x:8500,y:2890,type:"pfand",label:"PFAND",taken:false},
 {x:5850,y:3500,type:"pfand",label:"PFAND",taken:false},{x:7350,y:3500,type:"currywurst",label:"CURRYWURST",taken:false,value:50},{x:9100,y:3500,type:"pfand",label:"PFAND",taken:false}
];
const normObjects=[{x:2210,y:1190,type:"bin",fixed:false,label:"MÜLLTONNE 4,6° SCHIEF"},{x:1650,y:650,type:"chairs",fixed:false,label:"STÜHLE NICHT FLUCHTGERECHT"},{x:570,y:1140,type:"hedge",fixed:false,label:"HECKE 3 CM ZU INDIVIDUELL"}];
window.Germany3DBridge={WORLD,player,roads,crossings,crossingSigns,buildings,schreber,policeGarden,policePath,BORDER_Y,BORDER_BAND,borderGates,borderSegments,fireSources,props,pickups,getNPCs:()=>npcs,getPolice:()=>police,getBorderPourerCanvas:()=>borderPourerSprite.canvas,borderPourerGrid:{cols:borderPourerSprite.cols,rows:borderPourerSprite.rows}};
const forms={
a38:{code:"A38/1",title:"Passierschein A38 zur Beantragung eines weiteren Antrags",subtitle:"Bitte vollständig ausfüllen. Unvollständige Vollständigkeit gilt als unvollständig.",fields:[["text","VOLLSTÄNDIGER NAME"],["text","GEBURTSORT IN HEUTIGEN GEMEINDEGRENZEN"],["select","MELDESTATUS",["gemeldet","noch nicht gemeldet","gefühltermaßen gemeldet"]],["text","AKTENZEICHEN, FALLS BEREITS VORHANDEN"],["check","Ich bestätige, dass ich dieses Formular freiwillig unfreiwillig ausfülle."]]},
wohnung:{code:"WGB-88",title:"Wohnungsgeberbestätigung zur Bestätigung einer Wohnung",subtitle:"Bestätigen Sie, dass Ihre Wohnung tatsächlich eine Wohnung ist.",fields:[["text","ANSCHRIFT"],["text","WOHNUNGSGEBENDER WOHNUNGSGEBER"],["select","ART DER ÜBERLASSUNG",["vermietet","untervermietet","mysteriös überlassen"]],["text","TATSÄCHLICHES DATUM DER TATSACHE DES EINZUGS"],["check","Ich bestätige das Vorhandensein von Wänden und mindestens einer Tür."]]},
ergaenzung:{code:"ANM-E17",title:"Ergänzungsblatt zur Ergänzung des ergänzten Antrags",subtitle:"Dieses Formular wurde erst durch das vorherige Formular erforderlich.",fields:[["text","VORHERIGES AKTENZEICHEN"],["text","WARUM DIESES AKTENZEICHEN NICHT SCHON VORHER VORLAG"],["select","BEILAGENFORMAT",["A4","A4 gefaltet","A4 aus Überzeugung"]],["check","Ich akzeptiere die Entstehung eines weiteren Verwaltungsvorgangs."]]},
steuer:{code:"F-A-19%",title:"Fragebogen zur steuerlichen Erfassung einer erfassten Person",subtitle:"Die nachfolgenden Zahlen dienen der Erzeugung weiterer Zahlen.",fields:[["text","STEUERLICH RELEVANTER LIEBLINGSBUCHSTABE"],["text","GESCHÄTZTE EINNAHMEN IN EURO, CENT UND GEFÜHL"],["select","ORDNUNGSMÄSSIGKEIT",["ordnungsgemäß","sehr ordnungsgemäß","noch zu prüfen"]],["text","IBAN ODER ERKLÄRUNG DER NICHT-IBAN"],["check","Ich bestätige, dass Nichtwissen kein Dateiformat ist."]]},
versicherung:{code:"KV-100",title:"Antrag auf Nachweis eines Nachweises",subtitle:"Gesundheit ist privat. Dieses Formular ist es nicht.",fields:[["text","VERSICHERTENNUMMER, FALLS VORHANDEN"],["text","ERSATZNUMMER, FALLS NICHT VORHANDEN"],["select","AKTUELLER ZUSTAND",["versichert","voraussichtlich versichert","formularbedingt erschöpft"]],["text","HAUSARZT ODER URLAUBSBEGRÜNDUNG"],["check","Ich akzeptiere, dass eine Karte separat versendet werden könnte."]]},
aufenthalt:{code:"ABH-404",title:"Antrag auf Fortsetzung der Anwesenheit",subtitle:"Für die Vorsprache benötigen Sie einen Nachweis über die erfolgreiche Vorsprache.",fields:[["text","AKTENZEICHEN"],["text","ZWEITES AKTENZEICHEN"],["select","GRUND DES AUFENTHALTS",["Formulare","weitere Formulare","vorübergehend dauerhaft"]],["text","NACHWEIS DES NACHWEISES"],["check","Ich bin für Rückfragen zu Rückfragen erreichbar."]]},
citizenship:{code:"DE-1A",title:"Fiktiver Antrag auf deutsche Staatsangehörigkeit",subtitle:"Reines Spielverfahren. Keine echte Rechtslage oder Voraussetzung.",fields:[["text","NAME"],["select","KENNTNIS DER HAUSORDNUNG",["ausreichend","übertrieben","laminiert"]],["select","VERHÄLTNIS ZUR MÜLLTRENNUNG",["ambitioniert","akademisch","existenziell"]],["text","WARUM IST DIESES FORMULAR NICHT GEHEFTET?"],["check","Ich erkenne an, dass alle dargestellten Fristen und Regeln frei erfunden sind."]]}}
function resize(){dpr=Math.min(devicePixelRatio||1,2);width=innerWidth;height=innerHeight;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}addEventListener("resize",resize);resize();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by),inRect=(x,y,r)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h,pick=list=>list[Math.floor(Math.random()*list.length)];
const onRoad=(x,y)=>roads.some(r=>inRect(x,y,r)),onCrossing=(x,y)=>crossings.some(r=>inRect(x,y,r)),onGardenGrass=(x,y)=>(x>schreber.x+20&&x<schreber.x+schreber.w-20&&y>schreber.y+20&&y<schreber.y+schreber.h-20)||onPoliceGardenGrass(x,y);
function blocked(x,y){if(x<25||y<25||x>WORLD.w-25||y>WORLD.h-25)return true;for(const b of buildings)if(x>b.x-player.r&&x<b.x+b.w+player.r&&y>b.y-player.r&&y<b.y+b.h+player.r)return true;return false}
function toast(msg){const e=document.getElementById("toast");e.textContent=msg;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),2300)}
function ensureAudio(){if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();audio.resume();return audio}
function uiTone(freq=440,dur=.08,type="square",gain=.04){const a=ensureAudio(),o=a.createOscillator(),g=a.createGain(),t=a.currentTime;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.02)}
function playSiren(){const a=ensureAudio(),t=a.currentTime;for(let i=0;i<6;i++){const o=a.createOscillator(),g=a.createGain(),st=t+i*.18;o.type="sawtooth";o.frequency.setValueAtTime(i%2?920:620,st);o.frequency.linearRampToValueAtTime(i%2?620:920,st+.17);g.gain.setValueAtTime(.0001,st);g.gain.linearRampToValueAtTime(.065,st+.015);g.gain.exponentialRampToValueAtTime(.0001,st+.18);o.connect(g).connect(a.destination);o.start(st);o.stop(st+.19)}}
const SPEECH_GAP_MS=250,speechQueue=[];let speechActive=false,speechPauseTimer=null,speechGeneration=0;
let merkelRecordingPromise=null,merkelRecordingSource=null;
function finishSpeechItem(done,generation){if(generation!==speechGeneration)return;if(done)done();speechPauseTimer=setTimeout(()=>{speechActive=false;playQueuedSpeech()},SPEECH_GAP_MS)}
function playSyntheticSpeech({text,urgent,masculine,start,done},generation){if(generation!==speechGeneration)return;if(start)start();if(!("speechSynthesis" in window)){finishSpeechItem(done,generation);return}const u=new SpeechSynthesisUtterance(text),voices=speechSynthesis.getVoices(),german=voices.filter(v=>/^de(-|_)/i.test(v.lang)||/german|deutsch/i.test(v.name));u.voice=(masculine?german.find(v=>/conrad|markus|martin|stefan|hans|klaus|thorsten|yannick|male|männlich/i.test(v.name)):null)||german[0]||null;u.lang="de-DE";u.rate=urgent?.98:.9;u.pitch=masculine?.68:urgent?.72:.88;u.volume=1;let finished=false;const finish=()=>{if(finished)return;finished=true;finishSpeechItem(done,generation)};u.onend=finish;u.onerror=finish;speechSynthesis.speak(u)}
function playQueuedSpeech(){if(speechActive||!speechQueue.length||!state.voiceOn)return;speechActive=true;const item=speechQueue.shift(),generation=speechGeneration;if(!item.recorded){playSyntheticSpeech(item,generation);return}prepareMerkelRecording().then(buffer=>{if(generation!==speechGeneration)return;if(item.start)item.start();const source=ensureAudio().createBufferSource();merkelRecordingSource=source;source.buffer=buffer;source.connect(ensureAudio().destination);source.onended=()=>{if(merkelRecordingSource===source)merkelRecordingSource=null;finishSpeechItem(item.done,generation)};source.start()}).catch(()=>playSyntheticSpeech(item,generation))}
function speak(text,{urgent=false,masculine=false,start,done}={}){if(!state.voiceOn||!("speechSynthesis" in window)){if(start)start();if(done)done();return}speechQueue.push({text,urgent,masculine,start,done});playQueuedSpeech()}
function prepareMerkelRecording(){const a=ensureAudio();return merkelRecordingPromise||=(fetch("./assets/merkel-wir-schaffen-das.mp3").then(r=>{if(!r.ok)throw new Error("Merkel recording unavailable");return r.arrayBuffer()}).then(data=>a.decodeAudioData(data)))}
function stopMerkelRecording(){if(!merkelRecordingSource)return;try{merkelRecordingSource.stop()}catch{}merkelRecordingSource=null}
function speakMerkelLine(text,{urgent=false,start,done}={}){if(text!==MERKEL_AUDIO_LINE){speak(text,{urgent,start,done});return}if(!state.voiceOn){if(start)start();if(done)done();return}speechQueue.push({text,urgent,start,done,recorded:true});playQueuedSpeech()}
function hideWorldBark(){clearTimeout(showWorldBark.t);document.getElementById("police-bark").hidden=true}
function stopSpeech(){speechGeneration++;speechQueue.length=0;speechActive=false;clearTimeout(speechPauseTimer);if("speechSynthesis" in window)speechSynthesis.cancel();stopMerkelRecording();hideWorldBark()}
function violationAlert(msg,level){const alert=document.getElementById("violation-alert"),app=document.getElementById("app");document.getElementById("violation-law").textContent=lawFor(msg);document.getElementById("violation-title").textContent=state.lang==="en"?"RULE VIOLATION":"ORDNUNGSWIDRIGKEIT";document.getElementById("violation-text").textContent=state.lang==="en"?localize(msg):msg;document.getElementById("violation-stars").textContent="★".repeat(level)+"☆".repeat(Math.max(0,5-level));alert.hidden=false;app.classList.remove("enforcement");void app.offsetWidth;app.classList.add("enforcement");clearTimeout(violationAlert.t);violationAlert.t=setTimeout(()=>{alert.hidden=true;app.classList.remove("enforcement")},2200);playSiren()}
function showWorldBark(speaker,msg,urgent=true){const box=document.getElementById("police-bark"),speakerEl=document.getElementById("bark-speaker"),textEl=document.getElementById("police-bark-text"),start=()=>{speakerEl.textContent=speaker;textEl.textContent=msg;box.hidden=false;uiTone(urgent?1280:880,.06,"square",.035)},done=()=>{if(speakerEl.textContent===speaker&&textEl.textContent===msg)box.hidden=true};if(!state.voiceOn){start();clearTimeout(showWorldBark.t);showWorldBark.t=setTimeout(done,3200);return}const options={urgent,start,done};if(speaker.startsWith("ANGELA MERKEL"))speakMerkelLine(msg,options);else speak(msg,{...options,masculine:speaker.startsWith("FRIEDRICH MERZ")})}
function policeBark(force=false){const now=performance.now();if(!force&&now-(policeBark.last||0)<2300)return;policeBark.last=now;showWorldBark("POLIZEI",pick(policeBarks[state.region]||policeBarks.germany),true)}
function jaywalkerBark(){const speaker=state.region==="berlin"?"EMPÖRTE PASSANTEN · BERLIN":"EMPÖRTE PASSANTEN · DEUTSCHLAND";showWorldBark(speaker,pick(jaywalkerBarks[state.region]||jaywalkerBarks.germany),true)}
function politicianDialogue(n){return politicianLines[n.politician]||[]}
function nextPoliticianLine(n){const lines=politicianDialogue(n);return lines.length?lines[n.lineIndex++%lines.length]:""}
function merkelBehind(n){return (player.x-n.x)*(n.facingX||1)+(player.y-n.y)*(n.facingY||0)<-24}
function updateMerkel(n,dt){
 const target=n.route[n.target],dx=target[0]-n.x,dy=target[1]-n.y,d=Math.hypot(dx,dy)||1,speed=38;n.facingX=dx/d;n.facingY=dy/d;n.x+=n.facingX*speed*dt;n.y+=n.facingY*speed*dt;n.animTime+=dt;
 if(Math.abs(dx)>Math.abs(dy))n.spriteRow=dx<0?1:2;else n.spriteRow=dy<0?3:4;n.spriteFrame=1+Math.floor(n.animTime*5)%2;
 if(d<10){n.x=target[0];n.y=target[1];n.target=(n.target+1)%n.route.length}
 const now=performance.now(),near=dist(player.x,player.y,n.x,n.y);if(near<165&&merkelBehind(n)&&now>(n.barkAt||0)){n.barkAt=now+6500;showWorldBark(n.name,MERKEL_BEHIND_LINE,false)}else if(near<360&&now>(n.barkAt||0)){const line=nextPoliticianLine(n);n.barkAt=now+8500;if(line)showWorldBark(n.name,line,false)}
}
function updateBorderPourer(n,dt){
 const pourFrames=[1,2,3,2];n.animTime+=dt;n.stateTimer-=dt;
 if(n.state==="sideWalk"){
  n.x+=n.dir*68*dt;n.y+=(BORDER_Y+n.lane*32-n.y)*Math.min(1,dt*7);n.spriteRow=n.dir>0?1:3;n.spriteFrame=Math.floor(n.animTime*7)%5;n.spriteFlip=false;
  if(n.stateTimer<=0){n.state="sidePour";n.stateTimer=1.05;n.animTime=0}
 }else if(n.state==="sidePour"){
  n.x+=n.dir*44*dt;n.y+=(BORDER_Y+n.lane*24-n.y)*Math.min(1,dt*8);n.spriteRow=2;n.spriteFrame=pourFrames[Math.floor(n.animTime*8)%pourFrames.length];n.spriteFlip=n.dir<0;
  if(n.stateTimer<=0){n.lane*=-1;n.state="cross";n.stateTimer=.72;n.animTime=0}
 }else if(n.state==="cross"){
  n.x+=n.dir*26*dt;n.y+=(BORDER_Y+n.lane*34-n.y)*Math.min(1,dt*6.5);n.spriteRow=n.lane>0?0:4;n.spriteFrame=Math.floor(n.animTime*7)%5;n.spriteFlip=false;
  if(n.stateTimer<=0){n.state=n.lane<0?"frontPour":"sideWalk";n.stateTimer=n.lane<0?.95:1.25;n.animTime=0}
 }else if(n.state==="frontPour"){
  n.x+=n.dir*18*dt;n.y+=(BORDER_Y-30-n.y)*Math.min(1,dt*8);n.spriteRow=5;n.spriteFrame=pourFrames[Math.floor(n.animTime*8)%pourFrames.length];n.spriteFlip=false;
  if(n.stateTimer<=0){n.state="sideWalk";n.stateTimer=1.25;n.animTime=0}
 }
 if(n.x<=n.minX||n.x>=n.maxX){n.x=clamp(n.x,n.minX,n.maxX);n.dir*=-1;n.state="sidePour";n.stateTimer=.9;n.animTime=0}
 const now=performance.now();
 if(dist(player.x,player.y,n.x,n.y)<310&&now>(n.barkAt||0)&&state.wanted<2){
  const line=nextPoliticianLine(n);n.barkAt=now+8500+Math.random()*4500;if(line)showWorldBark(n.name,line,false);
 }
}
function softWarn(msg){toast((state.lang==="en"?"WARNING · ":"VERWARNUNG · ")+msg);uiTone(520,.055,"square",.025)}
function wanted(level,msg,instant){const old=state.wanted;state.wanted=clamp(Math.max(state.wanted,level),0,5);state.offence=msg;state.wantedCooldown=14;const gained=state.wanted-old;if(instant||(gained>0&&state.wanted>=2))spawnPolice(instant?Math.max(3,state.wanted):Math.min(4,gained+(state.wanted>=3?1:0)));violationAlert(msg,state.wanted);toast(msg+" · "+state.wanted+" STERN"+(state.wanted===1?"":"E"));updateHud()}
function escalate(msg,amount=1,instant=false){wanted(Math.min(5,Math.max(1,state.wanted+amount)),msg,instant)}
function spawnPolice(n){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,d=180+Math.random()*120,x=clamp(player.x+Math.cos(a)*d,40,WORLD.w-40),rawY=player.y+Math.sin(a)*d,y=state.region==="berlin"?clamp(rawY,BORDER_Y+45,WORLD.h-40):clamp(rawY,40,BORDER_Y-45);police.push({x,y,speed:105+state.wanted*12,barkAt:0})}policeBark(true)}
function updateHud(){const stars=document.getElementById("stars"),wantedBox=document.querySelector(".wanted");stars.innerHTML="";wantedBox.classList.toggle("hot",state.wanted>0);for(let i=0;i<5;i++){const s=document.createElement("span");s.className="star"+(i<state.wanted?" active":"");s.textContent="★";stars.appendChild(s)}document.getElementById("offence").textContent=state.lang==="en"?(state.wanted?"ACTIVE VIOLATION FILE":"FILE STATUS: UNREMARKABLE"):state.offence;const m=missions[Math.min(state.mission,missions.length-1)];document.getElementById("mission-title").textContent=localize(m.title);document.getElementById("mission-text").textContent=localize(m.text);const frac=state.mission/missions.length+(state.mission===5?state.stadtbild/3/missions.length:0);document.getElementById("mission-progress").style.width=Math.min(100,frac*100)+"%";document.getElementById("energy").textContent=Math.round(player.energy);document.getElementById("forms").textContent=state.forms;document.getElementById("pfand").textContent=state.pfand;document.getElementById("day").textContent=state.day+"/3";const r=rules[state.rule%rules.length];document.getElementById("rule-id").textContent=r[0];document.getElementById("rule-text").textContent=localize(r[1]);document.getElementById("region-name").textContent=state.region==="berlin"?"BERLIN":"DEUTSCHLAND";document.getElementById("region-language").textContent=state.region==="berlin"?"Denglisch-Zone":"Nur Deutsch"}
function openDialogue(speaker,lines,portrait,done){stopSpeech();state.modal=true;state.dialogue=true;state.dialogueData={speaker,lines,portrait:portrait||"§",done,i:0};renderDialogue()}
function setDialogueVoiceBusy(busy){state.dialogueVoiceBusy=busy;document.getElementById("dialogue-next").disabled=busy;document.getElementById("dialogue-speak").disabled=busy}
function speakDialogueLine(line){const token=state.dialogueVoiceToken=(state.dialogueVoiceToken||0)+1,speaker=state.dialogueData?.speaker||"",masculine=speaker.startsWith("FRIEDRICH MERZ"),done=()=>{if(token===state.dialogueVoiceToken)setDialogueVoiceBusy(false)};setDialogueVoiceBusy(state.voiceOn);if(speaker.startsWith("ANGELA MERKEL"))speakMerkelLine(line,{done});else speak(line,{masculine,done})}
function renderDialogue(){const d=state.dialogueData,line=d.lines[d.i],borderMan=d.speaker.startsWith("FRIEDRICH MERZ");document.getElementById("dialogue").hidden=false;document.getElementById("speaker").textContent=d.speaker;document.getElementById("portrait").textContent=d.portrait;document.getElementById("dialogue-text").textContent=line;document.getElementById("dialogue-next").textContent=d.i===d.lines.length-1?(state.lang==="en"?"UNDERSTOOD":"VERSTANDEN"):(state.lang==="en"?"CONTINUE":"WEITER");document.getElementById("voice-state").textContent=state.voiceOn?(borderMan?"COMPUTERSTIMME · MÄNNLICH · NUR DEUTSCH":state.region==="berlin"?"COMPUTERSTIMME · DENG-LISCH":"COMPUTERSTIMME · NUR DEUTSCH"):(state.lang==="en"?"VOICE OFF":"STIMME AUS");speakDialogueLine(line)}
function nextDialogue(){if(!state.dialogue||state.dialogueVoiceBusy)return;const d=state.dialogueData;d.i++;if(d.i<d.lines.length){renderDialogue();return}document.getElementById("dialogue").hidden=true;state.dialogue=false;state.modal=false;if(d.done)d.done()}document.getElementById("dialogue-next").onclick=nextDialogue;
document.getElementById("dialogue-speak").onclick=()=>{if(state.dialogue&&!state.dialogueVoiceBusy)speakDialogueLine(state.dialogueData.lines[state.dialogueData.i])};
function showForm(type){const def=forms[type],en=formEnglish[type];state.modal=true;document.getElementById("form-modal").hidden=false;document.getElementById("form-code").textContent=def.code;document.getElementById("form-title").textContent=state.lang==="en"&&en?en[0]:def.title;document.getElementById("form-subtitle").textContent=state.lang==="en"&&en?en[1]+" Official field labels remain in German, naturally.":def.subtitle;document.getElementById("form-error").textContent="";const wrap=document.getElementById("form-fields");wrap.innerHTML="";for(const f of def.fields){if(f[0]==="check"){const lab=document.createElement("label");lab.className="check";const inp=document.createElement("input");inp.type="checkbox";inp.required=true;const span=document.createElement("span");span.textContent=f[1];lab.append(inp,span);wrap.append(lab);continue}const lab=document.createElement("label");lab.className="field";const title=document.createElement("span");title.textContent=f[1];lab.append(title);if(f[0]==="select"){const sel=document.createElement("select");sel.required=true;const empty=document.createElement("option");empty.value="";empty.textContent=state.lang==="en"?"PLEASE SELECT / BITTE AUSWÄHLEN":"BITTE AUSWÄHLEN";sel.append(empty);for(const o of f[2]){const op=document.createElement("option");op.value=o;op.textContent=o;sel.append(op)}lab.append(sel)}else{const inp=document.createElement("input");inp.required=true;inp.autocomplete="off";lab.append(inp)}wrap.append(lab)}document.getElementById("bureaucracy-form").dataset.type=type}
document.getElementById("bureaucracy-form").onsubmit=e=>{e.preventDefault();if(!e.currentTarget.reportValidity()){document.getElementById("form-error").textContent=state.lang==="en"?"PROCEDURE INCOMPLETE. NATURALLY.":"VORGANG UNVOLLSTÄNDIG. NATÜRLICH.";uiTone(130,.14,"square",.04);return}const type=e.currentTarget.dataset.type;document.getElementById("form-modal").hidden=true;state.modal=false;state.forms++;state.mission++;uiTone(95,.08,"square",.05);setTimeout(()=>uiTone(70,.1,"square",.045),70);toast(state.lang==="en"?"FORM "+forms[type].code+" SUCCESSFULLY MOVED TO ANOTHER PILE":"FORMULAR "+forms[type].code+" ERFOLGREICH IN EINEN ANDEREN STAPEL GELEGT");if(type==="citizenship"){state.citizen=true;endGame(true)}updateHud()};
function bureaucrat(b,m){const lines=state.region==="berlin"?["Guten Tag, hello. Bitte waiten Sie, bis Ihr Warten systemseitig confirmed wurde.","Für "+m.title+" brauchen Sie Formular "+forms[m.form].code+". Very important.","Bitte every field ausfüllen. Auch die Felder, die später erst relevant werden."]:[ "Guten Tag. Bitte warten Sie, bis Ihr Warten verwaltungsintern erfasst wurde.","Für "+m.title+" benötigen Sie Formular "+forms[m.form].code+".","Füllen Sie jedes Feld aus. Auch die Felder, deren Zweck sich erst nach der Abgabe ergibt."];openDialogue(b.name,lines,"§",()=>showForm(m.form))}
function microInteract(p){
 if(p.id==="db"){openDialogue("DEUTSCHE BAHN",state.region==="berlin"?["Your train nach Deutschland is currently thirty-five Minuten delayed.","Reason: ein previous Vorgang. Thank you for your understanding, maybe."]:["Der Regionalexpress verspätet sich heute um voraussichtlich 35 Minuten.","Grund: vorausgegangener Vorgang. Wir bitten um Verständnis."],"DB");return}
 if(p.id&&p.id.startsWith("baustelle")){openDialogue("BAUSTELLENLEITUNG",state.region==="berlin"?["This Baustelle is temporary permanent.","Completion is planned for Q4, year currently under review."]:["Diese Baustelle ist vorübergehend dauerhaft eingerichtet.","Die Fertigstellung ist für das vierte Quartal eines noch zu prüfenden Jahres vorgesehen."],"🚧");return}
 if(p.id&&p.id.startsWith("fahrrad")){uiTone(1450,.06,"square",.03);setTimeout(()=>uiTone(1620,.05,"square",.025),55);openDialogue("FAHRRAD",state.region==="berlin"?["Klingeling. You are standing maybe slightly in the Radweg.","Please optimize your body position immediately."]:["Klingeling. Sie stehen geringfügig im Radweg.","Bitte korrigieren Sie Ihre Körperposition unverzüglich."],"🚲");return}
 if(p.id==="kaffee"){if(!p.used){p.used=true;player.energy=clamp(player.energy+24,0,100);uiTone(720,.08,"triangle",.035);toast(state.lang==="en"?"BÜRGERAMT COFFEE +24 ENERGY":"BÜRGERAMT-KAFFEE +24 ENERGIE");updateHud()}else toast(state.lang==="en"?"MACHINE SAYS: CLEANING":"AUTOMAT: REINIGUNG LÄUFT");return}
 if(p.id&&p.id.startsWith("faxbillboard")){openDialogue("WERBUNG · FAX 3000 PRO",state.region==="berlin"?["NEW: FAX 3000 PRO, now officially more future-ready.","Printed documents arrive angeblich 2,75× faster.","Digitalisierung ist when das Papier schneller ankommt."]:["NEU: FAX 3000 PRO.","Im Spiel angeblich 2,75× schneller beim Versand ausgedruckter Dokumente.","Digitalisierung ist, wenn das Papier schneller ankommt."],"FAX");return}
 if(p.id&&p.id.startsWith("faxgeraet")){openDialogue("FAX 3000 PRO",state.region==="berlin"?["Ready. Papier inserted. Zukunft started.","Please first ausdrucken, unterschreiben, einscannen and then faxen."]:["Bereit. Papier eingelegt. Zukunft gestartet.","Bitte Dokument zuerst ausdrucken, unterschreiben, einscannen und anschließend faxen."],"FAX");return}
 if(p.id&&p.id.startsWith("faxkiosk")){openDialogue("ÖFFENTLICHES FAX / TELEFON",state.region==="berlin"?["Twenty Cent pro Minute. Faxing counts as Fernkommunikation mit Belegpflicht.","A digital upload is technically leider too modern."]:["20 Cent pro Minute. Faxen gilt als Fernkommunikation mit Belegpflicht.","Ein digitaler Upload ist leider aus technischen Gründen zu modern."],"☎");return}
 if(p.id&&p.id.startsWith("pfandautomat")){if(state.pfand>0){const n=state.pfand;state.pfand=0;player.energy=clamp(player.energy+n*4,0,100);uiTone(880,.05,"square",.03);setTimeout(()=>uiTone(1100,.06,"square",.03),70);toast((state.lang==="en"?"DEPOSIT RECEIPT ":"PFANDBON ")+(n*.25).toFixed(2).replace(".",",")+" € · +"+n*4+" ENERGIE");updateHud()}else openDialogue("PFANDAUTOMAT",state.region==="berlin"?["No bottle detected. Insert asset first.","Bitte nicht gegen den Automaten kick-en."]:["Keine Flasche erkannt.","Bitte führen Sie zuerst ein pfandpflichtiges Gebinde zu."],"♻");return}
}

function interact(){if(state.dialogue){nextDialogue();return}if(state.modal)return;const m=missions[Math.min(state.mission,missions.length-1)];for(const b of buildings){if(dist(player.x,player.y,b.doorX,b.doorY)<112){if(b.id===m.target){if(state.mission===5){if(state.stadtbild>=3)openDialogue("AMT FÜR STADTBILD",["Ausgezeichnet. Die Mülltonne steht wieder parallel zur gefühlten Bordsteinkante.","Die Stadt ist nun statistisch 14 Prozent weniger individuell.","Stempel B: optische Unbedenklichkeit."],"✓",()=>{state.mission++;updateHud()});else openDialogue("AMT FÜR STADTBILD",["Gemäß der rein fiktiven Gestaltungsvorschrift ist das Stadtbild zu normieren.","Richten Sie die Mülltonne, die Stühle und die Hecke aus.","Der politische Aushang ist eine satirische Requisite und keine Tatsachenbehauptung."],"FM",()=>toast("3 STADTBILD-ABWEICHUNGEN MARKIERT"))}else bureaucrat(b,m)}else if(b.id==="imbiss")openDialogue("WURST-INSEL",["Bratwurst +35 Energie. Currywurst +50 Verwaltungsmut.","Senf ist kein gültiges Aktenzeichen."],"🌭");else openDialogue(b.name,state.region==="berlin"?["Sie sind hier basically richtig, aber für einen anderen process.","Try Zuständigkeit. Oder Tuesday. Tuesday ist beliebt."]:["Sie sind hier grundsätzlich richtig, aber für einen anderen Vorgang.","Versuchen Sie es mit Zuständigkeit. Oder Dienstag."],"§");return}}for(const n of npcs)if(dist(player.x,player.y,n.x,n.y)<92){
 if(n.special==="borderPourer"){
   openDialogue(n.name,politicianDialogue(n),"FM");
 }else if(n.special==="merkel"){
   openDialogue(n.name,[merkelBehind(n)?MERKEL_BEHIND_LINE:nextPoliticianLine(n)],"AM");
 }else openDialogue(n.name,[worldNpcLine(n.line),worldNpcLine((n.line+3)%npcLines.length)],"!");
 return
}for(const p of props)if(p.id&&dist(player.x,player.y,p.x,p.y)<96){microInteract(p);return}for(const o of normObjects)if(!o.fixed&&dist(player.x,player.y,o.x,o.y)<92){if(state.mission===5){o.fixed=true;state.stadtbild++;toast("STADTBILD NORMIERT · "+o.label);updateHud()}else toast("DAS IST NOCH NICHT IHR VORGANG");return}toast("HIER IST NIEMAND ZUSTÄNDIG")}
function collect(){for(const p of pickups){if(p.taken||dist(player.x,player.y,p.x,p.y)>34)continue;p.taken=true;uiTone(p.type==="pfand"?660:880,.1,"square",.04);if(p.type==="pfand"){state.pfand++;toast(state.lang==="en"?"DEPOSIT +1 · ASSET LIQUID AGAIN":"PFAND +1 · VERMÖGEN WIEDER LIQUID")}else{player.energy=clamp(player.energy+p.value,0,100);toast(p.label+" +"+p.value+" ENERGIE");particles.push({x:p.x,y:p.y,t:1,text:"+ "+p.label})}updateHud()}}
function endGame(win){state.gameOver=true;state.modal=true;document.getElementById("end-modal").hidden=false;document.getElementById("end-kicker").textContent=win?"VERWALTUNGSVORGANG ABGESCHLOSSEN":"FIKTIVE SPIELFRIST ABGELAUFEN";document.getElementById("end-title").textContent=win?"EINBÜRGERUNG: VORLÄUFIG ERFOLGREICH":"AUSWEISUNG AUS DEM SPIEL";document.getElementById("end-copy").textContent=win?"Sie haben genügend Formulare ausgefüllt, Regeln überlebt und verdächtig viel Geduld nachgewiesen. Dieses Spiel bildet keine echte Einbürgerung ab.":"Die absichtlich absurde Drei-Tage-Frist ist abgelaufen. Reale Gesetze, Verfahren und Rechte sind anders. Hier müssen Sie leider noch einmal von vorne anfangen."}document.getElementById("restart").onclick=()=>location.reload();
function update(dt){
 if(!state.started||state.modal)return;
 state.minutes+=dt*2;
 if(state.minutes>=1440){state.minutes-=1440;state.day++;if(state.day>3&&!state.citizen){endGame(false);return}}

 let sx=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0),fy=(keys.ArrowUp||keys.KeyW?1:0)-(keys.ArrowDown||keys.KeyS?1:0);
 const mag=Math.hypot(sx,fy);if(mag>1){sx/=mag;fy/=mag}
 const sprint=!!(keys.ShiftLeft||keys.ShiftRight);
 const speed=146*(sprint?1.58:1)*(player.energy<25?.84:1),px=player.x,py=player.y,nx=px+sx*speed*dt,ny=py-fy*speed*dt;
 if(!blocked(nx,player.y))player.x=nx;
 if(!blocked(player.x,ny))player.y=ny;
 if(player.x!==px||player.y!==py)player.facing=Math.atan2(player.x-px,player.y-py);
 updateRegion();

 if(mag>.05){
   player.energy=clamp(player.energy-dt*(sprint?1.25:.12),0,100);
   if(sprint)state.runTimer+=dt;
   else{state.runTimer=Math.max(0,state.runTimer-dt*2.5);if(state.runTimer<.25)state.runWarned=false}
 }else{
   player.energy=clamp(player.energy+dt*.72,0,100);
   state.runTimer=Math.max(0,state.runTimer-dt*3);if(state.runTimer<.25)state.runWarned=false
 }
 if(state.runTimer>2.8&&!state.runWarned){softWarn(state.lang==="en"?"SPEED IS BECOMING ADMINISTRATIVELY NOTICEABLE":"IHRE GESCHWINDIGKEIT WIRD VERWALTUNGSSEITIG AUFFÄLLIG");state.runWarned=true}
 if(state.runTimer>5.5){escalate(pick(violationPools.sprint),1,false);state.runTimer=0;state.runWarned=false}

 state.jayCooldown=Math.max(0,state.jayCooldown-dt);
 const roadViolation=onRoad(player.x,player.y)&&!onCrossing(player.x,player.y);
 if(roadViolation){
   state.roadTimer+=dt*(sprint?1.45:1);
   if(state.roadTimer>.45&&!state.roadWarned){softWarn(state.lang==="en"?"PLEASE USE THE GEOMETRICALLY APPROVED CROSSING":"BITTE BENUTZEN SIE DIE GEOMETRISCH VORGESEHENE QUERUNGSSTELLE");jaywalkerBark();state.roadWarned=true}
   if(state.roadTimer>1.55&&state.jayCooldown===0){state.jayCooldown=6;escalate(pick(violationPools.jaywalk),1,false);jaywalkerBark();state.roadTimer=0;state.roadWarned=false}
 }else{
   state.roadTimer=Math.max(0,state.roadTimer-dt*3);if(state.roadTimer<.2)state.roadWarned=false
 }

 state.gardenCooldown=Math.max(0,state.gardenCooldown-dt);
 const grass=onGardenGrass(player.x,player.y),stationGrass=onPoliceGardenGrass(player.x,player.y);
 if(grass){
   state.grassTimer+=dt;
   if(state.grassTimer>.45&&!state.grassWarned){softWarn(state.lang==="en"?"YOU ARE TOUCHING ADMINISTRATIVELY SENSITIVE GRASS":"SIE BERÜHREN VERWALTUNGSRELEVANTEN RASEN");state.grassWarned=true}
   const triggerAt=stationGrass?2.4:3.0;
   if(state.grassTimer>triggerAt&&state.gardenCooldown===0){state.gardenCooldown=8;escalate(pick(violationPools.grass),stationGrass?2:1,stationGrass);state.grassTimer=0;state.grassWarned=false}
 }else{
   state.grassTimer=Math.max(0,state.grassTimer-dt*4);if(state.grassTimer<.15)state.grassWarned=false
 }

 state.pettyAuditTimer-=dt;
 if(state.pettyAuditTimer<=0){
   state.pettyAuditTimer=20+Math.random()*16;
   const nearBorder=Math.abs(player.y-BORDER_Y)<260,auditChance=(sprint||nearBorder||onCrossing(player.x,player.y))?0.62:0.32;
   if(mag>.08&&!roadViolation&&!grass&&Math.random()<auditChance){escalate(pick(violationPools.audit),1,false);if(state.wanted>=2)policeBark(true)}
 }

 const policeClose=police.some(p=>dist(player.x,player.y,p.x,p.y)<360);
 if(state.wanted>=2&&policeClose&&sprint&&mag>.2){
   state.evasionTimer+=dt;
   if(state.evasionTimer>4.2){state.evasionTimer=0;escalate("ENTZIEHUNG VON EINER LAUFENDEN POLIZEILICHEN ANSPRACHE",1,true)}
 }else state.evasionTimer=Math.max(0,state.evasionTimer-dt*2);

 state.wantedCooldown=Math.max(0,state.wantedCooldown-dt);
 if(state.wanted>0&&state.wantedCooldown===0){state.wanted--;state.wantedCooldown=10;if(state.wanted===0)state.offence="AKTENLAGE: VORLÄUFIG UNAUFFÄLLIG"}

 for(let i=police.length-1;i>=0;i--){
   const p=police[i],rdx=player.x-p.x,rdy=player.y-p.y,routeD=Math.hypot(rdx,rdy)||1,dx=player.x-p.x,dy=player.y-p.y,d=Math.hypot(dx,dy)||1;
   p.x+=rdx/routeD*p.speed*dt;p.y+=rdy/routeD*p.speed*dt;
   if(d<260&&performance.now()>(p.barkAt||0)){p.barkAt=performance.now()+2200+Math.random()*1800;policeBark()}
   if(d<30){police.splice(i,1);player.energy=Math.max(36,player.energy-12);player.x=policePath.x1;player.y=policePath.y1;state.wanted=Math.max(0,state.wanted-1);state.offence="PERSONALIEN FESTGESTELLT · HINWEIS ERTEILT";uiTone(180,.18,"sawtooth",.05);toast(state.lang==="en"?"POLICE ACTION · ESCORTED TO THE STATION GARDEN":"POLIZEILICHE MASSNAHME · IN DEN WACHEN-SCHREBERGARTEN BEGLEITET")}
   else if(state.wanted<2&&d>520)police.splice(i,1)
 }

 for(const n of npcs){
   if(n.special==="borderPourer"){updateBorderPourer(n,dt);continue}
   if(n.special==="merkel"){updateMerkel(n,dt);continue}
   if(n.vx){n.x+=n.vx*dt;if(n.x<n.min||n.x>n.max)n.vx*=-1}else{n.y+=n.vy*dt;if(n.y<n.min||n.y>n.max)n.vy*=-1}
 }
 state.ruleTimer+=dt;if(state.ruleTimer>8){state.ruleTimer=0;state.rule=(state.rule+1)%rules.length}
 for(const p of particles){p.t-=dt;p.y-=12*dt}particles=particles.filter(p=>p.t>0);
 collect();updateHud()
}
function project(x,y,z=0){
 const dx=x-player.x,dy=y-player.y;
 const baseZoom=clamp(width/630,.62,.96);
 const depthScale=clamp(1+dy*.00018,.72,1.12);
 const scale=baseZoom*depthScale;
 return{
   x:width*.5+dx*scale,
   y:height*.58+dy*.46*scale-z*.72*scale,
   s:scale,
   d:-dy
 };
}
function poly(points,fill,stroke){
 const pp=points.map(p=>project(p[0],p[1],p[2]||0));
 ctx.beginPath();ctx.moveTo(pp[0].x,pp[0].y);
 for(let i=1;i<pp.length;i++)ctx.lineTo(pp[i].x,pp[i].y);
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}
}
function groundRect(r,fill,stroke){poly([[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]],fill,stroke)}
function drawPoliceDiagonalPath(){const dx=policePath.x2-policePath.x1,dy=policePath.y2-policePath.y1,len=Math.hypot(dx,dy)||1,nx=-dy/len*policePath.width*.5,ny=dx/len*policePath.width*.5;poly([[policePath.x1+nx,policePath.y1+ny],[policePath.x2+nx,policePath.y2+ny],[policePath.x2-nx,policePath.y2-ny],[policePath.x1-nx,policePath.y1-ny]],"#a9a59b","#858177")}
function drawCrossing(c){const wide=c.w>c.h,count=8;groundRect(c,"#4f4e4a");for(let i=0;i<count;i+=2){const f=i/count;if(wide)groundRect({x:c.x+c.w*f,y:c.y,w:c.w/count*.72,h:c.h},"#e5e0d3");else groundRect({x:c.x,y:c.y+c.h*f,w:c.w,h:c.h/count*.72},"#e5e0d3")}}
function drawFireBoundaryGround(){
 groundRect({x:0,y:BORDER_Y-18,w:WORLD.w,h:36},"rgba(55,48,43,.72)","rgba(42,38,34,.8)");
 groundRect({x:0,y:BORDER_Y-4,w:WORLD.w,h:8},"rgba(164,83,50,.5)");
}
function drawFireSource(f){
 if(!f.active)return;const p=project(f.x,f.y,0),s=clamp(p.s,.42,1.12);if(p.x<-100||p.x>width+100||p.y<-180||p.y>height+100)return;
 const t=performance.now()*.001+f.seed*17,base=46*f.intensity*s;ctx.save();ctx.translate(p.x,p.y);ctx.globalCompositeOperation="source-over";
 for(let i=0;i<4;i++){
  const phase=t*(2.2+i*.27)+i*1.9,w=base*(.54+i*.08),h=base*(1.35+i*.16),ox=Math.sin(phase)*base*.18,lean=Math.sin(phase*.73+i)*w*.18;
  ctx.beginPath();ctx.moveTo(ox-w*.5,2);ctx.quadraticCurveTo(ox-w*.18,-h*.38,ox+lean,-h);ctx.quadraticCurveTo(ox+w*.2,-h*.4,ox+w*.5,2);ctx.closePath();
  ctx.fillStyle=i<2?"rgba(161,67,39,.58)":i===2?"rgba(213,123,56,.62)":"rgba(242,201,126,.68)";ctx.fill();
 }
 for(let i=0;i<2;i++){const rise=(t*.23+f.seed+i*.43)%1,x=Math.sin(t*2.1+i*4+f.seed*9)*base*.55,y=-base*(.6+rise*2.2);ctx.fillStyle="rgba(219,143,71,"+(.65-rise*.45)+")";ctx.fillRect(x,y,Math.max(1,2*s),Math.max(1,3*s))}
 const smokeRise=(t*.11+f.seed)%1;ctx.fillStyle="rgba(55,54,51,"+(.2*(1-smokeRise))+")";ctx.beginPath();ctx.arc(Math.sin(t+f.seed*8)*base*.26,-base*(1.35+smokeRise*1.5),base*(.28+smokeRise*.32),0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawGround(){
 ctx.fillStyle="#77756f";ctx.fillRect(0,0,width,height);
 poly([[0,0],[WORLD.w,0],[WORLD.w,WORLD.h],[0,WORLD.h]],"#89867f","#67655f");
 districtLots.forEach(l=>groundRect(l,l.fill,"#77746d"));

 ctx.strokeStyle="rgba(45,45,42,.10)";ctx.lineWidth=1;
 for(let gx=0;gx<=WORLD.w;gx+=180){
   const a=project(gx,0),b=project(gx,WORLD.h);
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
 }
 for(let gy=0;gy<=WORLD.h;gy+=180){
   const a=project(0,gy),b=project(WORLD.w,gy);
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
 }

 roads.forEach(r=>groundRect({x:r.x-26,y:r.y-26,w:r.w+52,h:r.h+52},"#aaa69d"));
 roads.forEach(r=>groundRect(r,"#5c5b57","#4b4a47"));
 crossings.forEach(drawCrossing);
 groundRect(schreber,"#68705e","#4d5149");
 groundRect(policeGarden,"#68705e","#4d5149");
 drawPoliceDiagonalPath();
 drawFireBoundaryGround();
}
function buildingObscuresPlayer(b){return b.y<player.y+700&&b.y+b.h>player.y&&player.x>b.x-35&&player.x<b.x+b.w+35}
function drawBuildingLayer(b){ctx.save();if(buildingObscuresPlayer(b))ctx.globalAlpha=.3;drawBuilding(b);ctx.restore()}
function drawPlantSmoke(x,y,z){
 const now=performance.now()/1300;
 for(let i=0;i<6;i++){
   const age=(now+i/6)%1,p=project(x+Math.sin(now*2+i)*18*age,y+age*36,z+age*150),r=(10+age*26)*p.s;
   ctx.fillStyle=`rgba(61,60,57,${.42*(1-age)})`;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
 }
}
function drawPlantTower(x,y,h,baseR,neckR,topR,active=false){
 poly([[x-baseR,y,0],[x-neckR,y,h*.64],[x-topR,y,h],[x+topR,y,h],[x+neckR,y,h*.64],[x+baseR,y,0]],active?"#68645e":"#8f8d86","#44433f");
 const top=project(x,y,h),ground=project(x,y,0);ctx.fillStyle=active?"#403d39":"#6d6c67";ctx.beginPath();ctx.ellipse(top.x,top.y,topR*top.s,topR*.28*top.s,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=active?"#b9a16f":"#bbb7ad";ctx.lineWidth=Math.max(2,9*top.s);for(const f of [.56,.78]){const p=project(x,y,h*f);ctx.beginPath();ctx.moveTo(p.x-neckR*p.s,p.y);ctx.lineTo(p.x+neckR*p.s,p.y);ctx.stroke()}
 if(active)drawPlantSmoke(x,y,h);else{ctx.strokeStyle="#4e4c47";ctx.lineWidth=Math.max(1,2*ground.s);ctx.strokeRect(ground.x-baseR*.7*ground.s,ground.y-8*ground.s,baseR*1.4*ground.s,8*ground.s)}
}
function drawPowerPlant(b){
 const hall={...b,kind:null,sign:"",x:b.x+(b.kind==="nuclear"?390:70),y:b.y+155,w:b.kind==="nuclear"?390:520,h:210,hgt:b.kind==="nuclear"?82:105,doorX:b.doorX,doorY:b.y+375};
 if(b.kind==="nuclear"){
   drawPlantTower(b.x+125,b.y+135,225,76,43,62);drawPlantTower(b.x+285,b.y+155,205,68,39,55);drawBuilding(hall);
   const tl=project(hall.x+45,hall.y+hall.h+7,hall.hgt*1.5-20),tr=project(hall.x+hall.w-45,hall.y+hall.h+7,hall.hgt*1.5-20),bl=project(hall.x+45,hall.y+hall.h+7,18),br=project(hall.x+hall.w-45,hall.y+hall.h+7,18);ctx.strokeStyle="#762f29";ctx.lineWidth=Math.max(4,13*tl.s);ctx.beginPath();ctx.moveTo(tl.x,tl.y);ctx.lineTo(br.x,br.y);ctx.moveTo(tr.x,tr.y);ctx.lineTo(bl.x,bl.y);ctx.stroke();
   const left=project(b.x+45,b.y+b.h+7,18),right=project(b.x+b.w-45,b.y+b.h+7,18);ctx.strokeStyle="#762f29";ctx.lineWidth=Math.max(3,9*left.s);ctx.setLineDash([14*left.s,10*left.s]);ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(right.x,right.y);ctx.stroke();ctx.setLineDash([]);
 }else{
   drawBuilding(hall);drawPlantTower(b.x+690,b.y+150,275,27,21,24,true);
   const conveyor=project(b.x+560,b.y+230,70),feed=project(b.x+690,b.y+170,145);ctx.strokeStyle="#45433f";ctx.lineWidth=Math.max(5,13*conveyor.s);ctx.beginPath();ctx.moveTo(conveyor.x,conveyor.y);ctx.lineTo(feed.x,feed.y);ctx.stroke();
   const now=performance.now()/1400;for(let i=0;i<6;i++){const f=(now+i/6)%1,x=conveyor.x+(feed.x-conveyor.x)*f,y=conveyor.y+(feed.y-conveyor.y)*f,r=Math.max(2,6*conveyor.s);ctx.fillStyle="#232220";ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
   for(let i=0;i<5;i++){const q=project(hall.x+65+i*86,hall.y+hall.h+7,74);ctx.fillStyle="rgba(238,177,72,.88)";ctx.fillRect(q.x-13*q.s,q.y-7*q.s,26*q.s,14*q.s)}
   const beacon=project(hall.x+hall.w*.5,hall.y+hall.h*.5,hall.hgt*1.5+26);ctx.fillStyle=Math.sin(performance.now()/180)>0?"#f1b334":"#7b4d1a";ctx.beginPath();ctx.arc(beacon.x,beacon.y,Math.max(2,7*beacon.s),0,Math.PI*2);ctx.fill();
 }
 const sign=project(b.x+b.w*.5,b.y+b.h+15,72);ctx.fillStyle=b.kind==="nuclear"?"#762f29":"#31553a";ctx.fillRect(sign.x-170*sign.s,sign.y-27*sign.s,340*sign.s,34*sign.s);ctx.fillStyle="#f0eadc";ctx.font="900 "+Math.max(9,13*sign.s)+"px Arial";ctx.textAlign="center";ctx.fillText(b.kind==="nuclear"?"GESCHLOSSEN · KEIN ZUTRITT":"IN BETRIEB · OFFEN",sign.x,sign.y-9*sign.s);ctx.textAlign="left";
}
function drawBuilding(b){
 if(b.kind){drawPowerPlant(b);return}
 const H=b.hgt*1.5;
 const corners=[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]],
       base=corners.map(p=>project(p[0],p[1],0)),
       top=corners.map(p=>project(p[0],p[1],H));
 ctx.fillStyle="#585652";
 ctx.beginPath();ctx.moveTo(base[2].x,base[2].y);ctx.lineTo(base[3].x,base[3].y);ctx.lineTo(top[3].x,top[3].y);ctx.lineTo(top[2].x,top[2].y);ctx.closePath();ctx.fill();
 ctx.fillStyle="#706d67";
 ctx.beginPath();ctx.moveTo(base[1].x,base[1].y);ctx.lineTo(base[2].x,base[2].y);ctx.lineTo(top[2].x,top[2].y);ctx.lineTo(top[1].x,top[1].y);ctx.closePath();ctx.fill();
 ctx.fillStyle="#98958d";
 ctx.beginPath();ctx.moveTo(top[0].x,top[0].y);for(let i=1;i<4;i++)ctx.lineTo(top[i].x,top[i].y);ctx.closePath();ctx.fill();ctx.strokeStyle="#484743";ctx.stroke();

 // rows of front windows make the institutions read as actual multi-storey buildings.
 for(let wx=b.x+55;wx<b.x+b.w-35;wx+=82){
   for(let z=42;z<H-28;z+=50){
     const q=project(wx,b.y+b.h+4,z);
     const ws=Math.max(5,22*q.s),hs=Math.max(4,14*q.s);
     ctx.fillStyle="#444541";ctx.fillRect(q.x-ws/2,q.y-hs/2,ws,hs);
     ctx.fillStyle="rgba(225,220,207,.16)";ctx.fillRect(q.x-ws*.35,q.y-hs*.35,ws*.25,hs*.7);
   }
 }

 // entrance, canopy and bureaucratic plaque.
 const door=project(b.doorX,b.doorY+2,0),canopy=project(b.doorX,b.doorY+1,26);
 ctx.fillStyle="#292a28";ctx.fillRect(door.x-16*door.s,door.y-32*door.s,32*door.s,32*door.s);
 ctx.fillStyle="#b8b3a7";ctx.fillRect(canopy.x-25*canopy.s,canopy.y-4*canopy.s,50*canopy.s,5*canopy.s);
 const plaque=project(b.doorX+36,b.doorY+1,35);
 ctx.fillStyle="#ddd8cb";ctx.fillRect(plaque.x-18*plaque.s,plaque.y-9*plaque.s,36*plaque.s,16*plaque.s);

 // roof vent / antenna.
 const roof=project(b.x+b.w*.5,b.y+b.h*.5,H+16);
 ctx.strokeStyle="#454440";ctx.lineWidth=Math.max(1,2*roof.s);
 ctx.beginPath();ctx.moveTo(roof.x,roof.y);ctx.lineTo(roof.x,roof.y-28*roof.s);ctx.stroke();
 ctx.fillStyle="#64615b";ctx.fillRect(roof.x-12*roof.s,roof.y-6*roof.s,24*roof.s,7*roof.s);

 const sign=project(b.x+b.w*.5,b.y+b.h+8,H*.58);
 if(sign.s>.2){
   ctx.fillStyle="#eee9dd";ctx.font="900 "+Math.max(9,16*sign.s)+"px Arial";ctx.textAlign="center";ctx.fillText(b.name,sign.x,sign.y);
   ctx.font="700 "+Math.max(6,8*sign.s)+"px Arial";ctx.fillText(b.sign,sign.x,sign.y+13*sign.s);ctx.textAlign="left";
 }
}
function drawGarden(){
 for(let i=0;i<4;i++){
   const x=schreber.x+45+i*125,y=schreber.y+110,p=project(x,y,0);
   ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.s,p.s);
   ctx.fillStyle="#8e887c";ctx.fillRect(-26,-42,52,42);
   ctx.fillStyle="#4d4c48";ctx.beginPath();ctx.moveTo(-32,-42);ctx.lineTo(0,-65);ctx.lineTo(32,-42);ctx.fill();ctx.restore()
 }
 const sign=project(schreber.x+schreber.w*.5,schreber.y+schreber.h-30,0);
 ctx.fillStyle="#e5dfd2";ctx.fillRect(sign.x-92*sign.s,sign.y-28*sign.s,184*sign.s,25*sign.s);
 ctx.fillStyle="#171717";ctx.font="900 "+Math.max(7,10*sign.s)+"px Arial";ctx.textAlign="center";
 ctx.fillText("SCHREBERGÄRTEN · RASEN VERBOTEN",sign.x,sign.y-11*sign.s);ctx.textAlign="left";

 // police allotment perimeter fencing.
 const r=policeGarden,posts=[];
 for(let x=r.x;x<=r.x+r.w;x+=120){posts.push([x,r.y],[x,r.y+r.h])}
 for(let y=r.y;y<=r.y+r.h;y+=120){posts.push([r.x,y],[r.x+r.w,y])}
 for(const [x,y] of posts){const p=project(x,y,25);ctx.fillStyle="#4f4e49";ctx.fillRect(p.x-2*p.s,p.y-24*p.s,4*p.s,24*p.s)}

 const maze=project(policeGarden.x+policeGarden.w*.5,policeGarden.y+policeGarden.h-20,0);
 ctx.fillStyle="#e5dfd2";ctx.fillRect(maze.x-115*maze.s,maze.y-30*maze.s,230*maze.s,27*maze.s);
 ctx.fillStyle="#171717";ctx.font="900 "+Math.max(7,10*maze.s)+"px Arial";ctx.textAlign="center";
 ctx.fillText("WACHEN-SCHREBERGARTEN · NUR AUF DEM WEG",maze.x,maze.y-12*maze.s);ctx.textAlign="left";
}
function drawBorderSign(){
 for(const gate of borderGates){
   const p=project(gate.x+gate.w/2,BORDER_Y,104);if(p.x<-260||p.x>width+260||p.y<-210||p.y>height+210)continue;const s=p.s;
   ctx.save();ctx.translate(p.x,p.y);ctx.scale(s,s);
   ctx.fillStyle="#d8d0bd";ctx.strokeStyle="#171717";ctx.lineWidth=5;ctx.fillRect(-154,-92,308,88);ctx.strokeRect(-154,-92,308,88);
   ctx.fillStyle="#762f29";ctx.fillRect(-146,-84,292,18);ctx.fillStyle="#f2ede2";ctx.textAlign="center";ctx.font="900 10px Arial";ctx.fillText("AMTLICHE BRANDMAUER",0,-71);
   ctx.fillStyle="#171717";ctx.font="900 22px Arial";ctx.fillText("DEUTSCHLAND  ⇄  BERLIN",0,-42);
   ctx.font="800 11px Arial";ctx.fillText("NUR DEUTSCH          DENG-LISCH",0,-18);
   ctx.strokeStyle="#252525";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-132,-3);ctx.lineTo(-132,105);ctx.moveTo(132,-3);ctx.lineTo(132,105);ctx.stroke();ctx.restore()
 }
}

function drawCrossingSign(sign){
 const ground=project(sign.x,sign.y,0),p=project(sign.x,sign.y,68);if(p.x<-80||p.x>width+80||p.y<-100||p.y>height+100)return;const s=p.s;
 ctx.strokeStyle="#3a3b39";ctx.lineWidth=Math.max(2,4*s);ctx.beginPath();ctx.moveTo(ground.x,ground.y);ctx.lineTo(p.x,p.y);ctx.stroke();
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(s,s);ctx.fillStyle="#1f4d79";ctx.strokeStyle="#e6e1d5";ctx.lineWidth=3;ctx.fillRect(-18,-18,36,36);ctx.strokeRect(-18,-18,36,36);ctx.fillStyle="#f1ede2";ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(13,12);ctx.lineTo(-13,12);ctx.closePath();ctx.fill();ctx.strokeStyle="#1e1e1d";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-5,3,0,Math.PI*2);ctx.moveTo(0,-2);ctx.lineTo(-2,6);ctx.moveTo(-2,2);ctx.lineTo(6,5);ctx.moveTo(-2,6);ctx.lineTo(-7,11);ctx.moveTo(-2,6);ctx.lineTo(4,12);ctx.stroke();ctx.restore()
}

function drawAsset(name,x,y,w,h,angle=0){
 const p=project(x,y,0),img=assets[name];
 if(!img||!img.complete||!img.naturalWidth)return false;
 const margin=Math.max(w,h)*p.s+120;
 if(p.x<-margin||p.x>width+margin||p.y<-margin||p.y>height+margin)return false;
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);
 ctx.drawImage(img,-w*p.s/2,-h*p.s,w*p.s,h*p.s);
 ctx.restore();return true
}
function sprite(x,y,label,type,accent){
 const p=project(x,y,0);
 if(p.x<-140||p.x>width+140||p.y<-180||p.y>height+180)return;
 const s=clamp(p.s,.42,1.12),phase=performance.now()/145+(x+y)*.01,swing=Math.sin(phase)*8;
 if(["currywurst","bratwurst","brezel","pfand"].includes(type)&&drawAsset(type,x,y,type==="pfand"?30:54,type==="pfand"?48:40))return;
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(s,s);
 if(type==="person"||type==="police"){const body=type==="police"?"#303943":(accent||"#45443f");ctx.strokeStyle=body;ctx.lineWidth=5;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-4,-8);ctx.lineTo(-8+swing*.22,13);ctx.moveTo(4,-8);ctx.lineTo(8-swing*.22,13);ctx.moveTo(-7,-23);ctx.lineTo(-13-swing*.35,-5);ctx.moveTo(7,-23);ctx.lineTo(13+swing*.35,-5);ctx.stroke();ctx.fillStyle=body;ctx.fillRect(-9,-30,18,25);ctx.fillStyle="#d0c8b8";ctx.beginPath();ctx.arc(0,-39,8,0,Math.PI*2);ctx.fill();if(type==="police"){ctx.fillStyle="#222b34";ctx.fillRect(-10,-48,20,5);ctx.fillStyle="#eee";ctx.font="900 7px Arial";ctx.fillText("POL",-7,-13)}}
 if(type==="bin"){ctx.fillStyle="#555b54";ctx.fillRect(-15,-34,30,34)}if(type==="chairs"){ctx.strokeStyle="#4f4e49";ctx.lineWidth=3;ctx.strokeRect(-26,-22,20,22);ctx.strokeRect(7,-22,20,22)}if(type==="hedge"){ctx.fillStyle="#4e594a";ctx.fillRect(-36,-28,72,28)}
 if(label&&s>.28){ctx.fillStyle="#171717";ctx.font="800 8px Arial";ctx.textAlign="center";ctx.fillText(label,0,18);ctx.textAlign="left"}ctx.restore()}
function drawMerkelNpc(n){
 const p=project(n.x,n.y,0),img=assets.merkelSprite;
 if(img&&img.complete&&img.naturalWidth){const fw=img.naturalWidth/3,fh=img.naturalHeight/5,s=clamp(p.s,.42,1.12),size=104;ctx.save();ctx.translate(p.x,p.y);ctx.scale(s,s);ctx.drawImage(img,(n.spriteFrame||0)*fw,(n.spriteRow||0)*fh,fw,fh,-size/2,-size+8,size,size);ctx.restore()}else drawAsset("merkel",n.x,n.y,46,74);
 if(p.x>-120&&p.x<width+120&&p.y>-140&&p.y<height+140){
   ctx.fillStyle="#171717";ctx.font="800 "+Math.max(7,8*p.s)+"px Arial";ctx.textAlign="center";
   ctx.fillText("ANGELA MERKEL · SATIRE",p.x,p.y+16*p.s);ctx.textAlign="left";
 }
}
function drawBorderPourer(n){
 const sheet=borderPourerSprite.canvas;if(!sheet){sprite(n.x,n.y,n.name,"person","#263b59");return}
 const p=project(n.x,n.y,0);if(p.x<-180||p.x>width+180||p.y<-210||p.y>height+210)return;
 const fw=sheet.width/borderPourerSprite.cols,fh=sheet.height/borderPourerSprite.rows,s=clamp(p.s,.42,1.12),size=132;
 ctx.save();ctx.translate(p.x,p.y);ctx.scale((n.spriteFlip?-1:1)*s,s);
 ctx.drawImage(sheet,n.spriteFrame*fw,n.spriteRow*fh,fw,fh,-size/2,-size+8,size,size);ctx.restore();
 ctx.fillStyle="#171717";ctx.font="800 "+Math.max(7,8*p.s)+"px Arial";ctx.textAlign="center";ctx.fillText("FRIEDRICH MERZ · FIKTIONALE SATIRE",p.x,p.y+18*p.s);ctx.textAlign="left";
}
function drawDistrictLabels(){
 for(const d of districtLabels){
   const p=project(d.x,d.y,4);
   if(p.x<-220||p.x>width+220||p.y<-120||p.y>height+120)continue;
   ctx.fillStyle="rgba(226,221,210,.78)";
   const w=Math.max(110,ctx.measureText(d.text).width+22);
   ctx.fillRect(p.x-w/2,p.y-14,w,21);
   ctx.fillStyle="#34332f";ctx.font="900 9px Arial";ctx.textAlign="center";ctx.fillText(d.text,p.x,p.y);ctx.textAlign="left";
 }
}

function drawPoster(){const p=project(1570,530,90);if(p.x<-160||p.x>width+160||p.y<-180||p.y>height+180)return;const s=p.s;ctx.save();ctx.translate(p.x,p.y);ctx.scale(s,s);ctx.fillStyle="#ded8cb";ctx.fillRect(-58,-72,116,84);ctx.strokeStyle="#222";ctx.strokeRect(-58,-72,116,84);ctx.fillStyle="#777";ctx.beginPath();ctx.ellipse(0,-43,20,25,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#494949";ctx.beginPath();ctx.moveTo(-22,-50);ctx.quadraticCurveTo(0,-72,24,-50);ctx.lineTo(17,-59);ctx.lineTo(-16,-59);ctx.closePath();ctx.fill();ctx.fillStyle="#222";ctx.font="900 8px Arial";ctx.textAlign="center";ctx.fillText("FRIEDRICH MERZ",0,-8);ctx.font="7px Arial";ctx.fillText("SATIRISCHER AUSHANG",0,3);ctx.restore()}
function drawWorld(){
 drawGround();drawGarden();drawDistrictLabels();
 const drawables=[{d:0,fn:drawPlayer},{d:player.y-530,fn:drawPoster}];
 for(const b of buildings)drawables.push({d:player.y-(b.y+b.h),fn:()=>drawBuildingLayer(b)});
 for(const f of fireSources)drawables.push({d:player.y-f.y,fn:()=>drawFireSource(f)});
 for(const n of npcs)drawables.push({d:player.y-n.y,fn:()=>n.special==="merkel"?drawMerkelNpc(n):n.special==="borderPourer"?drawBorderPourer(n):sprite(n.x,n.y,n.name,"person","#4f4d48")});
 for(const p of police)drawables.push({d:player.y-p.y,fn:()=>sprite(p.x,p.y,"POLIZEI","police")});
 for(const p of pickups)if(!p.taken)drawables.push({d:player.y-p.y,fn:()=>sprite(p.x,p.y,p.label,p.type==="pfand"?"pfand":p.type)});
 for(const o of normObjects)drawables.push({d:player.y-o.y,fn:()=>sprite(o.x,o.y,o.fixed?"NORMIERT":"! "+o.label,o.type,o.fixed?"#3f5b43":"#6c3d37")});
 for(const prop of props)drawables.push({d:player.y-prop.y,fn:()=>drawAsset(prop.asset,prop.x,prop.y,prop.w,prop.h)});
 for(const sign of crossingSigns)drawables.push({d:player.y-sign.y,fn:()=>drawCrossingSign(sign)});
 drawables.sort((a,b)=>b.d-a.d);for(const d of drawables)d.fn();
 for(const p of particles){const q=project(p.x,p.y,40);if(q){ctx.fillStyle="#111";ctx.font="800 10px Arial";ctx.textAlign="center";ctx.fillText(p.text,q.x,q.y);ctx.textAlign="left"}}
}
function drawPlayer(){
 const center=project(player.x,player.y,0),s=clamp(center.s,.42,1.12),x=width*.5,y=height*.58,swing=Math.sin(performance.now()/145)*8;
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 ctx.strokeStyle="#252525";ctx.lineWidth=5;ctx.lineCap="round";
 ctx.beginPath();ctx.moveTo(-4,-8);ctx.lineTo(-8+swing*.22,13);ctx.moveTo(4,-8);ctx.lineTo(8-swing*.22,13);
 ctx.moveTo(-7,-23);ctx.lineTo(-13-swing*.35,-5);ctx.moveTo(7,-23);ctx.lineTo(13+swing*.35,-5);ctx.stroke();
 ctx.fillStyle="#252525";ctx.fillRect(-9,-30,18,25);
 ctx.fillStyle="#d3cbbb";ctx.beginPath();ctx.arc(0,-39,8,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#eee9dd";ctx.font="900 8px Arial";ctx.textAlign="center";ctx.fillText(state.lang==="en"?"YOU":"SIE",0,18);ctx.restore();
}
function drawMinimap(){
 const mw=Math.min(210,width-32),mh=Math.max(78,Math.round(mw*WORLD.h/WORLD.w)),x=width-mw-16,bottomGap=width<=760?200:44,y=height-mh-bottomGap,sx=mw/WORLD.w,sy=mh/WORLD.h;
 ctx.save();ctx.globalAlpha=.94;ctx.fillStyle="#d7d2c5";ctx.fillRect(x,y,mw,mh);ctx.strokeStyle="#222";ctx.lineWidth=2;ctx.strokeRect(x,y,mw,mh);
 ctx.fillStyle="#5d5b57";roads.forEach(r=>ctx.fillRect(x+r.x*sx,y+r.y*sy,Math.max(1,r.w*sx),Math.max(1,r.h*sy)));
 ctx.fillStyle="#eee9dc";crossings.forEach(c=>ctx.fillRect(x+c.x*sx,y+c.y*sy,Math.max(1,c.w*sx),Math.max(1,c.h*sy)));
 ctx.fillStyle="#6c7166";ctx.fillRect(x+schreber.x*sx,y+schreber.y*sy,schreber.w*sx,schreber.h*sy);ctx.fillRect(x+policeGarden.x*sx,y+policeGarden.y*sy,policeGarden.w*sx,policeGarden.h*sy);
 ctx.fillStyle="#a45131";ctx.fillRect(x,y+BORDER_Y*sy,mw,Math.max(2,4*sy));
 ctx.fillStyle="#222";ctx.font="900 7px Arial";ctx.fillText("DEUTSCHLAND · NUR DEUTSCH",x+5,y+9);ctx.fillText("BERLIN · DENG-LISCH",x+5,y+BORDER_Y*sy+11);
 const m=missions[Math.min(state.mission,missions.length-1)],b=buildings.find(q=>q.id===m.target);if(b){ctx.fillStyle="#762f29";ctx.fillRect(x+b.doorX*sx-3,y+b.doorY*sy-3,6,6)}
 ctx.fillStyle="#111";ctx.beginPath();ctx.arc(x+player.x*sx,y+player.y*sy,3,0,Math.PI*2);ctx.fill();ctx.restore()
}
function nearestInteract(){let label="",best=122;for(const b of buildings){const d=dist(player.x,player.y,b.doorX,b.doorY);if(d<best){best=d;label=b.name}}for(const n of npcs){const d=dist(player.x,player.y,n.x,n.y);if(d<best){best=d;label=n.special==="borderPourer"?(state.region==="berlin"?"SATIRE STATEMENT LISTENING":"SATIRISCHE ERKLÄRUNG ANHÖREN"):(state.region==="berlin"?"COMPLAINT LISTENING":"BESCHWERDE ANHÖREN")}}for(const p of props){if(!p.id)continue;const d=dist(player.x,player.y,p.x,p.y);if(d<best){best=d;label=p.label}}for(const o of normObjects){if(o.fixed)continue;const d=dist(player.x,player.y,o.x,o.y);if(d<best){best=d;label="AUSRICHTEN"}}const e=document.getElementById("interact-hint");e.hidden=!label;e.textContent=label?"E · "+label:""}
function draw(){ctx.clearRect(0,0,width,height);if(!window.Germany3D?.ready)drawWorld();drawMinimap();nearestInteract()}
// Public-domain and traditional melodies arranged as local WebAudio chiptunes.
// Notes are MIDI numbers, durations are quarter-note units, and null is a rest.
const erikaA=[
 [71,1.5],[72,.5],[74,1],[74,1],[74,1],[79,1],[79,1],[83,1],
 [83,1.5],[81,.5],[79,1],[null,3],
 [78,1],[79,1],[81,1],[null,3],
 [83,1.5],[81,.5],[79,1],[null,3]
];
const erikaB=[
 [74,1.5],[79,.5],[78,1],[78,1],[78,1],[78,1],[76,1],[78,1],
 [79,1],[null,3],
 [78,1.5],[79,.5],[81,1],[81,1],[81,1],[81,1],
 [74,1.5],[72,.5],[71,1],[null,3]
];
const MUSIC=[
 {title:"Erika",bpm:120,root:55,notes:[...erikaA,...erikaA,...erikaB,...erikaA]},
 {title:"Deutschlandlied · Nationalhymne",bpm:100,root:53,notes:[
  [65,1.5],[67,.5],[69,1],[67,1],[70,1],[69,1],[67,.5],[64,.5],
  [65,1],[74,1],[72,1],[70,1],[69,1],[67,1],[69,.5],[65,.5],
  [72,2],[65,1.5],[67,.5],[69,1],[67,1],[70,1],[69,1],[67,.5],
  [64,.5],[65,1],[74,1],[72,1],[70,1],[69,1],[67,1],[69,.5],
  [65,.5],[72,2],[67,1],[69,1],[67,.5],[64,.5],[60,1],[70,1],
  [69,1],[67,.5],[64,.5],[60,1],[72,1],[70,1],[69,1.5],[69,.5],
  [71,1],[71,.5],[72,.5],[72,2],[77,1.5],[76,.5],[76,.5],[74,.5],
  [72,1],[74,1.5],[72,.5],[72,.5],[70,.5],[69,1],[67,1.5],[69,.25],
  [70,.25],[72,.5],[74,.5],[70,.5],[67,.5],[65,1],[69,.5],[67,.5],
  [65,2],[77,1.5],[76,.5],[76,.5],[74,.5],[72,1],[74,1.5],[72,.5],
  [72,.5],[70,.5],[69,1],[67,1.5],[69,.25],[70,.25],[72,.5],[74,.5],
  [70,.5],[67,.5],[65,1],[69,.5],[67,.5],[65,2]
 ]},
 {title:"Badnerlied · Baden-Württemberg",state:"Baden-Württemberg",bpm:112,root:55,notes:[
  [62,1],[67,1],[67,1],[62,1],[62,1],[59,1],[62,.5],[59,.5],
  [55,1],[67,1],[69,1.5],[69,.5],[69,1],[69,1],[71,2],[null,1],
  [71,1],[64,1.5],[64,.5],[69,1.5],[67,.5],[66,1],[67,1],[69,1],
  [71,1],[69,1.5],[66,.5],[69,.5],[67,.5],[66,.5],[64,.5],[62,2],
  [null,1],[62,1],[69,1.5],[67,.5],[66,.5],[67,.5],[69,.5],[71,.5],
  [72,2],[null,1],[74,1],[71,1.5],[69,.5],[67,.5],[66,.5],[67,.5],
  [71,.5],[69,1],[74,.75],[74,.25],[74,.5],[72,.5],[71,.5],[69,.5],
  [67,2],[null,.5],[66,.5],[67,.75],[71,.25],[74,2],[null,.5],[68,.5],
  [69,.75],[71,.25],[74,1],[71,.5],[67,.5],[69,1],[71,.5],[69,.5],
  [67,2],[null,1],[62,1],[67,1],[67,.75],[67,.25],[67,1],[null,1]
 ]},
 {title:"Württembergerlied · Württemberg",region:"Württemberg",bpm:114,root:55,notes:[
  [62,.5],[62,.5],[67,1],[67,1],[66,1],[66,1],[59,1],[62,.5],
  [59,.5],[55,1],[67,.5],[67,.5],[69,1],[71,1],[69,1],[71,1],
  [69,.5],[74,.5],[73,.5],[71,.5],[69,1],[67,.5],[67,.5],[66,1.5],
  [66,.5],[69,1.5],[69,.5],[62,2],[null,1],[62,.5],[62,.5],[72,1.5],
  [69,.5],[71,1.5],[67,.5],[71,.5],[69,.5],[69,1],[null,1],[62,.5],
  [62,.5],[72,1.5],[69,.5],[71,1.5],[67,.5],[71,.5],[69,.5],[69,1],
  [null,1],[62,.5],[62,.5],[67,1],[67,1],[69,1],[69,1],[74,1.5],
  [71,.5],[67,1],[69,.5],[66,.5],[64,.5],[72,.5],[71,.5],[69,.5],
  [71,1],[69,1],[67,2]
 ]},
 {title:"Die Gedanken sind frei",bpm:120,root:57,notes:[
  [64,.5],[64,.5],[69,1],[69,1],[73,.5],[69,.5],[64,2],[64,1],
  [62,1],[59,1],[64,1],[61,1],[57,1],[64,.5],[64,.5],[69,1],
  [69,1],[73,.5],[69,.5],[64,2],[64,1],[62,1],[59,1],[64,1],
  [61,1],[57,1],[69,1],[68,1],[71,1.5],[68,.5],[69,1],[73,1],
  [69,1],[68,1],[71,1.5],[68,.5],[69,1],[73,1],[69,1],[66,1],
  [66,1],[69,.5],[66,.5],[64,2],[64,.5],[73,.5],[73,.5],[71,.5],
  [69,1],[68,1],[69,2]
 ]},
 {title:"Kein schöner Land",bpm:102,root:55,notes:[
  [62,.5],[62,.5],[62,.5],[67,1],[71,1],[69,.5],[67,.5],[69,1.5],
  [62,.5],[62,.5],[62,.5],[67,1],[71,1],[69,.5],[67,.5],[69,1.5],
  [71,.5],[67,.5],[69,.5],[71,.5],[74,.5],[72,.5],[71,.5],[69,.5],
  [67,.5],[69,.5],[72,.5],[71,.5],[69,.5],[67,1],[69,1],[71,1],
  [null,.5],[71,.5],[67,.5],[69,.5],[71,.5],[74,.5],[72,.5],[71,.5],
  [69,.5],[67,.5],[69,.5],[72,.5],[71,.5],[69,.5],[67,1],[66,1],[67,1]
 ]},
 {title:"Muss i denn · Schwaben",region:"Schwaben",bpm:84,root:50,notes:[
  [62,.25],[64,.25],[66,.5],[66,.25],[69,.25],[67,.5],[67,.25],[71,.25],
  [69,.5],[69,.25],[67,.25],[66,1],[69,.5],[69,.25],[67,.25],[66,.5],
  [66,.25],[69,.25],[67,.5],[67,.5],[64,.5],[69,.5],[66,1],[null,.5],
  [62,.25],[64,.25],[66,.5],[66,.25],[69,.25],[67,.5],[67,.25],[71,.25],
  [69,.5],[69,.25],[67,.25],[66,1],[69,.5],[69,.25],[67,.25],[66,.5],
  [66,.25],[69,.25],[67,.5],[67,.5],[64,.5],[69,.5],[66,1],[null,.5],
  [62,.25],[66,.25],[64,.75],[66,.25],[67,.5],[64,.5],[66,.75],[67,.25],
  [69,.5],[69,.25],[69,.25],[71,.5],[71,.5],[74,.5],[73,.25],[71,.25],
  [69,1],[null,.5],[62,.25],[66,.25],[69,.5],[69,.25],[71,.25],[69,.5],
  [69,.25],[74,.25],[69,.5],[69,.25],[67,.25],[66,1],[69,.5],[69,.25],
  [67,.25],[66,.5],[66,.25],[69,.25],[67,.5],[67,.5],[64,.5],[69,.5],[66,1]
 ]},
 {title:"Auf de schwäbsche Eisebahne · Schwaben",region:"Schwaben",bpm:116,root:48,notes:[
  [67,.75],[67,.25],[67,.5],[67,.5],[67,.5],[67,.5],[72,.5],[72,.5],
  [69,.5],[69,.5],[69,.5],[69,.5],[69,.5],[69,.5],[74,.5],[74,.5],
  [76,.75],[74,.25],[76,.5],[74,.5],[74,.5],[72,.5],[67,1],[67,.5],
  [67,.5],[69,.5],[71,.5],[72,.5],[72,.5],[72,.5],[null,.5],[67,.5],
  [67,.5],[67,.5],[67,.5],[67,.5],[67,.5],[72,1],[69,.5],[69,.5],
  [69,.5],[69,.5],[69,.5],[69,.5],[74,1],[76,.75],[74,.25],[76,.5],
  [74,.5],[74,.5],[72,.5],[67,1],[67,.5],[67,.5],[69,.5],[71,.5],
  [72,.5],[72,.5],[72,1]
 ]},
 {title:"Das Wandern ist des Müllers Lust",bpm:112,root:55,notes:[
  [62,.5],[67,.75],[62,.25],[59,.5],[60,.5],[62,.75],[64,.25],[62,.5],
  [67,.5],[71,.75],[69,.25],[67,.5],[69,.5],[71,.75],[72,.25],[71,.5],
  [67,.5],[71,1],[69,1],[67,1],[null,.5],[62,.5],[69,.5],[69,.5],
  [71,.25],[69,.25],[68,.25],[69,.25],[66,.5],[69,.5],[62,.5],[62,.5],
  [69,.5],[69,.5],[71,.25],[69,.25],[68,.25],[69,.25],[66,.5],[69,.5],
  [62,.5],[62,.5],[64,.5],[66,.5],[67,.5],[69,.5],[71,.75],[69,.25],
  [67,.5],[71,.5],[74,1],[66,1],[67,1]
 ]},
 {title:"Der Mond ist aufgegangen",bpm:96,root:53,notes:[
  [65,1],[67,1],[65,1],[70,1],[69,1],[67,2],[65,1],[69,1],
  [69,1],[69,1],[74,1],[72,1],[70,2],[69,1],[69,1],[69,1],
  [69,1],[70,1],[69,1],[67,2],[null,1],[65,1],[67,1],[65,1],
  [70,1],[69,1],[67,2],[65,1],[69,1],[69,1],[69,1],[74,1],
  [72,1],[70,2],[69,1],[69,1],[69,1],[69,1],[70,1],[69,1],
  [67,1],[67,1],[65,1]
 ]},
 {title:"Glück auf, der Steiger kommt · Saarland",state:"Saarland",bpm:120,root:53,notes:[
  [65,2],[64,1],[67,1],[65,2.75],[null,1.25],[69,2],[67,1],[70,1],
  [69,2],[null,1],[65,.5],[67,.5],[69,1],[69,1],[69,1],[67,.5],
  [69,.5],[70,1],[67,.75],[67,.25],[67,1],[67,.5],[69,.5],[70,1],
  [74,1],[74,1],[72,.5],[70,.5],[72,1],[69,.75],[69,.25],[69,1],
  [60,1],[65,2],[67,2],[69,1],[74,1],[72,1],[70,1],[72,2],
  [70,1],[72,1],[69,2]
 ]},
 {title:"Bayernhymne · Bayern",state:"Bayern",bpm:94,root:54,notes:[
  [66,.75],[70,.75],[73,1.83],[71,.75],[70,.75],[68,.75],[66,.75],[70,1],
  [66,1],[61,1.83],[63,.75],[61,.5],[59,.5],[58,1.75],[null,.25],[61,.75],
  [66,2.08],[65,.5],[68,1],[71,1.75],[70,.75],[68,.75],[66,.75],[65,1.83],
  [66,.75],[63,.75],[61,1.75],[null,.25],[68,.75],[70,.75],[71,1.33],[70,.5],
  [68,.75],[66,1.5],[65,.75],[68,.75],[70,.75],[71,1.33],[70,.5],[68,.75],
  [66,.75],[73,1.75]
 ]},
 {title:"Berliner Luft · Berlin",state:"Berlin",bpm:122,root:51,notes:[
  [67,.25],[70,.5],[67,.5],[65,.75],[63,.25],[67,.5],[63,.5],[58,.5],[null,.25],
  [67,.25],[70,.75],[67,.25],[72,.75],[67,.25],[74,1],[null,.75],[68,.25],
  [72,.5],[68,.5],[67,.75],[65,.25],[68,.5],[65,.5],[58,.5],[null,.25],[68,.25],
  [72,.75],[68,.25],[74,.75],[68,.25],[72,1],[null,.75],[67,.25],[70,.5],
  [67,.5],[65,.75],[63,.25],[67,.5],[63,.5],[58,.5],[null,.25],[67,.25],
  [70,.75],[67,.25],[72,.75],[67,.25],[74,1],[null,.75],[74,.25],[77,.5],
  [74,.5],[72,.75],[70,.25],[74,.5],[70,.5],[65,.5],[66,.5],[67,1],[69,1],
  [70,1],[null,1.5],[70,1],[null,1],[70,1],[null,1],[70,3.5],[67,1.5],
  [66,.5],[67,.5],[75,.5],[67,.5],[74,.5],[72,.5],[null,.5],[72,.5],
  [null,.5],[72,.5],[null,1.5],[67,1.5],[66,.5],[67,.5],[75,.5],[67,.5],
  [74,.5],[72,.5],[null,.5],[72,.5],[null,.5],[72,.5],[null,1.5],[72,1.5],
  [70,.5],[68,.5],[67,.5],[65,.5],[64,.5],[67,.5],[null,.5],[67,.5],
  [null,.5],[67,.5],[null,.5],[65,.75],[64,.25]
 ]},
 {title:"Fritze Bollmann · Brandenburg",state:"Brandenburg",bpm:118,root:52,notes:[
  [64,1],[69,.92],[64,.75],[null,.25],[64,1],[66,.75],[null,.25],[66,1.25],
  [null,.25],[69,.33],[68,1.25],[null,.25],[62,.33],[66,.66],[64,1.67],[null,.33],
  [64,.66],[73,1],[71,.75],[null,.25],[69,.66],[71,.75],[null,.25],[66,.75],
  [null,.25],[71,.66],[69,1.25],[null,.25],[69,.33],[71,.66],[73,1.67],[null,.33],
  [64,.66],[73,.75],[null,.25],[71,.75],[null,.25],[69,.66],[71,.75],[null,.25],
  [66,.75],[null,.25],[71,1],[69,1.25],[null,.25],[69,.33],[68,.66],[69,1.67],
  [null,.33],[64,1],[69,.92],[64,.75],[null,.25],[64,1],[66,.75],[null,.25],
  [66,1.25],[null,.25],[69,.33],[68,1.25],[null,.25],[62,.33],[66,.66],[64,1.67],
  [null,.33],[64,.66],[73,1],[71,.75],[null,.25],[69,.66],[71,.75],[null,.25],
  [66,.75],[null,.25],[71,.66],[69,1.25],[null,.25],[69,.33],[71,.66],[73,1.67],
  [null,.33],[64,.66],[73,.75],[null,.25],[71,.75],[null,.25],[69,.66]
 ]},
 {title:"An der Weser · Bremen",state:"Bremen",bpm:96,root:50,notes:[
  [62,1.5],[67,1],[62,.5],[71,1],[67,.5],[76,.5],[74,1],[71,.5],[67,.75],[66,.25],
  [67,.5],[71,.75],[69,.25],[67,2],[66,.5],[null,.5],[66,.5],[64,1.5],[62,1.25],
  [null,.33],[72,.5],[62,.5],[71,1],[null,1],[74,.5],[71,.5],[76,.5],[74,1],
  [71,.5],[69,1],[67,.5],[null,.5],[71,.5],[null,.5],[71,3],[76,.75],[74,.25],
  [72,.5],[71,1.5],[74,3.75],[71,.25],[67,.25],[71,.25],[74,.5],[null,.5],
  [71,.5],[79,2.08],[78,.25],[76,.5],[78,2.5],[71,.5],[76,2.25],[74,.25],
  [72,.5],[71,1.5],[63,1.33],[64,1.33],[null,1.67],[71,.75],[69,.25],[67,.5],
  [76,.5],[74,.75],[72,.25],[71,1],[69,.25],[67,.25],[69,.25],[71,.5],[null,.5],
  [71,.5],[67,.75],[66,.25],[67,.5],[72,.5],[71,.75],[69,.25],[71,.5],
  [63,.25],[75,.25],[71,.25],[75,.25],[71,1],[null,.5],[71,.5]
 ]},
 {title:"Stadt Hamburg an der Elbe Auen · Hamburg",state:"Hamburg",bpm:100,root:48,notes:[
  [48,1],[53,5],[55,.5],[57,1],[55,.5],[53,.5],[52,.5],[53,2],[48,1],[53,.5],
  [57,.5],[60,1.5],[58,.5],[57,1],[55,1],[57,2],[53,1],[57,1],[60,2],[55,2],
  [57,2],[null,.67],[57,.5],[55,.5],[53,.5],[52,.5],[55,1],[60,.5],[64,1],
  [62,1],[60,3.5],[null,.5],[65,1],[60,.75],[65,.25],[69,2],[67,1],[64,.75],
  [67,.25],[72,1],[70,1],[69,1.5],[65,2.5],[74,1.5],[70,3.5],[69,.75],
  [67,.25],[72,1],[65,.5],[67,.5],[69,2],[67,2],[65,2.75]
 ]},
 {title:"Hessenlied · Hessen",state:"Hessen",bpm:96,root:53,notes:[
  [60,.5],[65,1.5],[69,.25],[72,1.83],[74,.75],[69,.75],[74,.25],[72,.75],[null,.67],
  [77,.5],[76,.75],[74,1],[72,.75],[70,.5],[74,.5],[72,1.75],[null,.25],[69,.75],
  [null,.67],[60,.5],[65,1.5],[69,.25],[72,1.75],[74,.75],[69,.75],[74,.25],
  [72,.75],[null,.67],[74,.5],[76,.75],[74,.5],[72,.5],[77,.75],[76,.5],
  [74,2.25],[null,.25],[72,.75],[null,2.67],[72,4.83],[null,.67],[70,.5],
  [74,.75],[72,.5],[74,.5],[72,.5],[70,.5],[69,.5],[70,.5],[69,.75],[67,.75],
  [null,1.25],[72,.75],[77,1.75],[null,.25],[72,.75],[69,.75],[74,1.75],
  [null,.25],[74,1.5],[79,1.75],[null,.25],[74,.75],[77,.75],[76,2.75],
  [null,.25],[72,.75]
 ]},
 {title:"Wo de Ostseewellen trecken · Mecklenburg-Vorpommern",state:"Mecklenburg-Vorpommern",bpm:94,root:54,notes:[
  [66,2],[64,1],[62,2],[61,1],[62,2],[61,1],[62,2],[66,1],[71,2],[69,1],
  [64,7.75],[66,1],[67,2],[66,1],[67,2],[66,1],[67,2],[69,1],[73,2],
  [71,1],[66,7.75],[69,1],[74,2],[73,1],[76,2.75],[74,2.75],[73,2],
  [71,1],[74,3],[73,5.75],[71,2],[69,1],[73,1]
 ]},
 {title:"Auf der Lüneburger Heide · Niedersachsen",state:"Niedersachsen",bpm:114,root:48,notes:[
  [60,.5],[64,.5],[69,.5],[67,.5],[66,.5],[67,.5],[69,.5],[67,.5],[66,.5],[67,.5],
  [72,.75],[71,.25],[69,.5],[67,.5],[65,1],[62,.75],[65,.25],[71,.5],[69,.5],
  [68,.5],[69,.5],[71,.5],[69,.5],[68,.5],[69,.5],[74,.75],[72,.25],[71,.5],
  [69,.5],[67,1],[71,.75],[69,.25],[67,.5],[65,.5],[64,.5],[69,.5],[67,2],
  [69,1],[68,.5],[69,.5],[71,1],[72,.75],[69,.25],[67,1],[72,.75],[69,.25],
  [67,1],[72,1],[74,1],[67,1],[76,2.5],[74,.5],[72,.5],[69,.5],[67,1],
  [72,.5],[76,.5],[77,1],[71,1],[72,1]
 ]},
 {title:"Westfalenlied · Nordrhein-Westfalen",state:"Nordrhein-Westfalen",bpm:104,root:53,notes:[
  [62,.5],[63,.5],[64,.5],[65,1.5],[67,.5],[69,.5],[70,.5],[67,1.5],[69,.5],
  [70,.5],[72,.5],[74,.5],[70,.5],[65,1],[63,.5],[57,.5],[58,1],[null,.5],
  [62,.5],[63,.75],[64,.25],[65,1.5],[67,.5],[69,.75],[70,.25],[69,1],[67,1],
  [69,.75],[70,.25],[72,1.5],[69,.75],[67,.5],[65,1.25],[null,.5],[65,.5],
  [67,.75],[69,.25],[70,1.5],[69,.5],[67,.75],[65,1.25],[64,.5],[67,.5],
  [69,.75],[67,.25],[72,1.5],[65,.5],[67,.75],[69,.25],[65,1],[null,.5],
  [65,1],[67,.5],[69,2],[72,.75],[70,.25],[69,1],[null,.5],[65,.5],
  [67,.5],[69,.5],[70,.75],[72,.25],[73,1.5],[64,.5],[65,1],[null,.5],
  [62,.5],[63,.5],[64,.5],[65,1.5],[67,.5],[69,.75],[70,.25],[67,1.5],
  [63,.5],[65,.75],[66,.25],[67,1.5],[69,.5],[70,.75],[72,.25],[69,1],
  [null,.5],[65,.5],[70,.75],[72,.25],[74,2],[75,.5],[74,.5],[67,1],
  [null,.5],[67,.5],[69,.75],[70,1.75],[69,.75],[67,.5],[65,.25],[74,1],
  [null,.5],[65,.5],[70,.75],[72,.25],[74,2],[77,.5],[75,.5],[67,1],
  [null,.5],[67,.5],[69,.75],[70,1.75],[69,.5],[67,.75],[69,.25],[70,1]
 ]},
 {title:"Ein Jäger aus Kurpfalz · Rheinland-Pfalz",state:"Rheinland-Pfalz",bpm:118,root:53,notes:[
  [60,.5],[65,.5],[69,3],[72,1],[70,1],[69,1],[67,1],[65,.5],[64,.5],[67,3],
  [72,.5],[69,1],[67,1],[65,1],[null,.5],[69,.5],[72,1.5],[70,.5],[69,1.5],
  [72,.5],[77,.5],[72,1],[69,1],[67,1],[65,.5],[64,.5],[67,3],[72,.5],
  [69,1],[67,1],[65,1],[null,.5],[69,.5],[72,1.5],[70,.5],[69,1.5],
  [72,.5],[77,.5],[72,1],[69,1],[67,1],[65,.5],[64,.5],[67,3],
  [72,.5],[69,1],[67,1],[65,1]
 ]},
 {title:"Dar Vugelbärbaam · Sachsen",state:"Sachsen",bpm:116,root:55,notes:[
  [62,1],[67,1.5],[66,.5],[67,1],[59,1],[64,1.5],[62,.5],[60,1.5],
  [66,.5],[64,1],[62,2],[null,1],[60,1.5],[66,.5],[64,1],[62,2],
  [64,1],[62,1.5],[71,.5],[67,1],[62,3],[67,1.5],[66,.5],[67,1],
  [59,1],[64,1.5],[62,2],[66,.5],[64,1],[62,2],[null,1],[60,1.5],
  [66,.5],[64,1],[72,2],[66,1],[67,4]
 ]},
 {title:"An der Saale hellem Strande · Sachsen-Anhalt",state:"Sachsen-Anhalt",bpm:94,root:50,notes:[
  [62,.5],[64,.5],[66,2],[64,.5],[62,.5],[64,2],[62,.5],[64,.5],[66,.5],
  [67,.5],[69,1],[67,.5],[66,.5],[64,1],[null,1],[69,.5],[71,.5],[69,.5],
  [67,.5],[64,2],[66,1],[69,1.5],[71,.5],[69,.5],[67,.5],[64,2],[66,1],
  [69,1],[71,.5],[67,.5],[66,.5],[69,.5],[66,1],[64,1],[62,1]
 ]},
 {title:"Schleswig-Holstein meerumschlungen",state:"Schleswig-Holstein",bpm:96,root:51,notes:[
  [63,.75],[67,.25],[68,2],[72,.5],[70,.5],[68,.5],[70,.5],[72,1.5],[70,.5],
  [68,1],[70,.5],[72,.5],[73,1],[72,.5],[70,.5],[68,1],[70,1],[72,2],
  [70,1.5],[68,1],[67,1.5],[72,1.5],[70,1],[68,1.5],[72,2],[70,1],
  [68,1],[67,1],[65,1],[63,2],[68,1],[63,1],[70,1],[63,1],[72,1],
  [73,.5],[72,.5],[70,2],[72,2],[73,3],[72,.5],[70,.5],[68,2],
  [70,2],[72,2],[68,1],[63,1],[70,1],[63,1],[72,1],[73,.5],[72,.5],
  [70,2],[72,2],[77,3],[73,.5],[70,.5],[75,2],[67,2],[68,2]
 ]},
 {title:"Thüringen, holdes Land",state:"Thüringen",bpm:104,root:52,notes:[
  [71,1],[64,1],[66,1],[68,1.5],[69,.5],[66,1],[73,1],[71,1],[66,1],
  [69,1.5],[68,1.5],[66,1],[68,1],[70,1],[71,1.5],[66,1.5],[75,.5],
  [73,.5],[71,1],[70,1],[71,2],[null,1],[69,1],[68,.5],[66,.5],[64,.5],
  [63,.5],[71,1.5],[69,.5],[68,1],[71,1],[69,.5],[68,.5],[66,.5],
  [65,.5],[73,1.5],[71,.5],[69,1],[75,1],[73,1],[71,1],[76,1],
  [75,.5],[73,.5],[71,1.5],[69,.5],[68,1],[66,.5],[68,.5],[69,4],
  [76,1],[75,.5],[73,.5],[71,1.5],[69,.5],[68,2],[66,.5],[68,.5],
  [69,1],[68,2]
 ]},
 {title:"Thüringer Kloß-Kantinenjingle · Original",region:"Thüringen",bpm:132,root:50,notes:[
  [62,.25],[66,.25],[69,.5],[74,.5],[71,.5],[69,.25],[67,.25],[66,.5],
  [64,.5],[62,.5],[57,.25],[61,.25],[64,.5],[69,.5],[67,.5],[66,.25],
  [64,.25],[62,1],[null,.5],[69,.25],[71,.25],[74,.5],[78,.5],[76,.5],
  [74,.25],[71,.25],[69,.5],[67,.5],[66,.5],[62,.25],[64,.25],[66,.5],
  [69,.5],[71,.5],[74,1],[null,.5],[74,.25],[73,.25],[71,.5],[69,.5],
  [67,.5],[66,.25],[64,.25],[62,.5],[57,.5],[61,.5],[64,.25],[66,.25],
  [69,.5],[67,.5],[66,.5],[64,.5],[62,1.5]
 ]}
];
let audio=null,musicTimer=null,musicBus=null,musicOn=true,musicBag=[],currentTune=-1;
const midiFreq=note=>440*2**((note-69)/12);
function nextTune(){
 if(!musicBag.length){
   musicBag=MUSIC.map((_,i)=>i);
   for(let i=musicBag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[musicBag[i],musicBag[j]]=[musicBag[j],musicBag[i]]}
   if(musicBag.at(-1)===currentTune&&musicBag.length>1)[musicBag[0],musicBag[musicBag.length-1]]=[musicBag[musicBag.length-1],musicBag[0]];
 }
 currentTune=musicBag.pop();return MUSIC[currentTune]
}
function chip(a,freq,when,dur,type="square",gain=.045){const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.0001,when);g.gain.linearRampToValueAtTime(gain,when+.01);g.gain.setValueAtTime(gain,when+dur*.75);g.gain.exponentialRampToValueAtTime(.0001,when+dur);o.connect(g).connect(musicBus);o.start(when);o.stop(when+dur+.02)}
function stamp(a,when,gain=.025){const o=a.createOscillator(),g=a.createGain();o.type="square";o.frequency.setValueAtTime(95,when);o.frequency.exponentialRampToValueAtTime(55,when+.055);g.gain.setValueAtTime(gain,when);g.gain.exponentialRampToValueAtTime(.0001,when+.07);o.connect(g).connect(musicBus);o.start(when);o.stop(when+.08)}
function scheduleTheme(){
 if(!audio||!musicOn)return;
 const tune=nextTune(),quarter=60/tune.bpm,start=audio.currentTime+.05,bassCycle=[tune.root,tune.root+7,tune.root+12,tune.root+7];let t=start,beatIndex=0;
 document.getElementById("mute").title=`NOW PLAYING · ${tune.title}`;
 for(const [note,quarters] of tune.notes){
   const dur=quarters*quarter;
   if(note!==null){
     chip(audio,midiFreq(note),t,Math.max(.07,dur*.88),"square",.031);
     const bass=bassCycle[Math.floor(beatIndex/2)%bassCycle.length];
     chip(audio,midiFreq(bass),t,Math.max(.06,dur*.92),"triangle",.017);
   }else{
     for(let beat=0;beat<quarters;beat++)stamp(audio,t+beat*quarter,beat%2?.018:.021);
   }
   if(note!==null&&Math.floor(beatIndex)%2===0)stamp(audio,t,.006);
   t+=dur;beatIndex+=quarters;
 }
 clearTimeout(musicTimer);
 musicTimer=setTimeout(scheduleTheme,Math.max(100,(t-audio.currentTime+quarter*.5)*1000));
}
function startMusic(){if(!musicOn)return;if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();audio.resume();musicBus=audio.createGain();musicBus.connect(audio.destination);scheduleTheme()}
document.getElementById("mute").onclick=()=>{musicOn=!musicOn;document.getElementById("mute").textContent=musicOn?"MUSIC 8-BIT ON":"MUSIC 8-BIT OFF";if(musicOn)startMusic();else{clearTimeout(musicTimer);musicBus?.disconnect();musicBus=null}};
function startGame(){startMusic();state.started=true;state.region=regionOf(player.y);document.getElementById("intro").classList.add("hidden");const lines=state.region==="berlin"?["Welcome in Berlin. Hier reden wir erstmal practical Denglisch.","Your mission ist simple: become German citizen in drei Behördentagen.","Aber careful: auf Schrebergarten grass kommt sofort die Polizei. No discussion.","Berlin liegt hinter der Brandmauer. You can cross sie freely."]:[ "Willkommen in Deutschland.","Ihr Ziel: Werden Sie innerhalb von drei völlig fiktiven Behördentagen deutscher Staatsbürger.","Dazu benötigen Sie vor allem Formulare. Sehr viele Formulare.","Wenn Sie den Rasen im Schrebergarten betreten, kommt die Polizei sofort.","Berlin liegt hinter der Brandmauer. Sie ist frei überquerbar."];openDialogue(state.region==="berlin"?"WELCOME TO BERLIN":"WILLKOMMEN IN DEUTSCHLAND",lines,"DE",()=>toast("ERSTER VORGANG · BÜRGERAMT"));updateHud()}
document.querySelectorAll(".lang").forEach(btn=>btn.onclick=()=>{const choseEnglish=btn.dataset.lang==="en";state.lang="de";document.documentElement.lang="de";document.querySelectorAll(".lang").forEach(b=>{b.classList.toggle("active",b===btn);b.setAttribute("aria-pressed",String(b===btn))});if(choseEnglish){btn.textContent="Deutsch";btn.dataset.lang="de";const praise=document.getElementById("language-praise");praise.hidden=false;clearTimeout(praise.t);praise.t=setTimeout(()=>praise.hidden=true,2200)}updateHud()});
document.getElementById("start").onclick=startGame;
document.getElementById("voice-toggle").onclick=()=>{state.voiceOn=!state.voiceOn;document.getElementById("voice-toggle").textContent=state.voiceOn?"VOICE ON":"VOICE OFF";if(!state.voiceOn){stopSpeech();state.dialogueVoiceToken=(state.dialogueVoiceToken||0)+1;setDialogueVoiceBusy(false)}};
function keydown(e){if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.repeat)return;if(e.code==="KeyE")interact()}function keyup(e){keys[e.code]=false}addEventListener("keydown",keydown);addEventListener("keyup",keyup);
document.querySelectorAll(".control-dock [data-key]").forEach(btn=>{const code=btn.dataset.key,down=e=>{e.preventDefault();keys[code]=true;if(code==="KeyE")interact()},up=e=>{e.preventDefault();keys[code]=false};btn.addEventListener("pointerdown",down);btn.addEventListener("pointerup",up);btn.addEventListener("pointercancel",up);btn.addEventListener("pointerleave",up)});

const appSurface=document.getElementById("app");
function editableTarget(target){return !!(target&&target.closest&&target.closest('input, textarea, select, [contenteditable="true"]'))}
appSurface.addEventListener("contextmenu",event=>{if(!editableTarget(event.target))event.preventDefault()});
appSurface.addEventListener("selectstart",event=>{if(!editableTarget(event.target))event.preventDefault()});
appSurface.addEventListener("dragstart",event=>{if(!editableTarget(event.target))event.preventDefault()});

function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();window.Germany3D?.sync();requestAnimationFrame(loop)}updateHud();requestAnimationFrame(loop);
})();

/* Kiosk-style browser behavior: suppress all text selection/copy UI. */
(()=>{
  for(const type of ["contextmenu","selectstart","dragstart","copy","cut"]){
    document.addEventListener(type,event=>event.preventDefault(),{capture:true});
  }
  document.addEventListener("selectionchange",()=>{
    const selection=window.getSelection&&window.getSelection();
    if(selection&&!selection.isCollapsed)selection.removeAllRanges();
  });
})();
