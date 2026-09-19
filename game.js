(function(){
"use strict";

var canvas=document.getElementById("game");
var ctx=canvas.getContext("2d");
var keys=Object.create(null);
var W={w:2500,h:1600};
var SAVE_KEY="germany-simulator-save-v1";
var COLORS={road:"#5d5c58",roadEdge:"#8c8982",walk:"#aaa69e",building:"#77746f",dark:"#55534f",grass:"#777b70",garden:"#666b60",water:"#6d7474"};

var state={
  time:8*60,day:1,wanted:0,offence:"AKTENLAGE: UNAUFFÄLLIG",wantedCooldown:0,
  runningTimer:0,jayCooldown:0,gardenCooldown:0,modal:true,dialogue:false,
  mission:0,forms:0,pfand:0,energy:100,stadtbild:0,citizen:false,gameOver:false,
  activeRule:0,ruleTimer:0,nearest:null,started:false,paused:false,saveTimer:0
};

var player={x:770,y:1315,r:13,dirX:1,dirY:0,baseSpeed:155};
var police=[];
var particles=[];

var billboardAssetPaths=[
  "./assets/billboards/die-neue-faxkraft.svg",
  "./assets/billboards/faxen-im-takt.svg",
  "./assets/billboards/fortschritt-per-fax.svg",
  "./assets/billboards/aktenfluss-ohne-verzug.svg"
];
var billboardAssets=billboardAssetPaths.map(function(src){
  var img=new Image();
  img.decoding="async";
  img.src=src;
  return img;
});

var merkelAsset=new Image();
merkelAsset.decoding="async";
merkelAsset.src="./assets/characters/angela-merkel-sprite.svg";
var merkel={x:1180,y:940,r:12,speed:34,dirX:0,dirY:1,targetX:1180,targetY:940,retarget:0,anim:0,meetingCount:0};

var roads=[
  {x:0,y:655,w:W.w,h:220},
  {x:1035,y:0,w:220,h:W.h}
];
var crosswalks=[
  {x:990,y:700,w:310,h:72},
  {x:1105,y:600,w:80,h:330}
];

var schreber={x:70,y:990,w:500,h:430};
var spree={x:0,y:1460,w:W.w,h:140};

var buildings=[
  {id:"buergeramt",name:"BÜRGERAMT",x:115,y:150,w:330,h:220,doorX:280,doorY:395,sign:"TERMIN NUR MIT TERMIN"},
  {id:"hausverwaltung",name:"HAUSVERWALTUNG",x:560,y:145,w:330,h:225,doorX:720,doorY:395,sign:"WOHNUNGSGEBERBESTÄTIGUNGEN"},
  {id:"auslaender",name:"AUSLÄNDERBEHÖRDE",x:1780,y:135,w:430,h:235,doorX:1985,doorY:398,sign:"VORSPRACHE NUR NACH VORSPRACHE"},
  {id:"finanzamt",name:"FINANZAMT",x:1315,y:1015,w:355,h:250,doorX:1490,doorY:1290,sign:"STEUERN · NUMMERN · RÜCKFRAGEN"},
  {id:"krankenkasse",name:"KRANKENKASSE",x:1880,y:1005,w:340,h:250,doorX:2050,doorY:1285,sign:"BITTE BLEIBEN SIE GESUND"},
  {id:"stadtbild",name:"AMT FÜR STADTBILD",x:1330,y:150,w:350,h:220,doorX:1505,doorY:395,sign:"OPTISCHE ORDNUNG · DIN 0815"},
  {id:"polizei",name:"POLIZEI",x:620,y:1010,w:300,h:220,doorX:770,doorY:1255,sign:"POLIZEIABSCHNITT 08"},
  {id:"spaeti",name:"SPÄTI",x:100,y:470,w:265,h:145,doorX:230,doorY:635,sign:"PFAND · MATE · ALLES"},
  {id:"imbiss",name:"WURST-INSEL",x:1840,y:500,w:300,h:145,doorX:1990,doorY:665,sign:"BRATWURST · CURRYWURST · SENF"}
];

var faxBillboards=[
  // Civic façades: the administration has apparently monetised every spare wall.
  {x:280,y:255,w:118,h:88,asset:0,angle:-.018,skew:-.035,mount:"wall"},
  {x:720,y:252,w:118,h:88,asset:1,angle:.016,skew:.03,mount:"wall"},
  {x:1505,y:252,w:120,h:90,asset:2,angle:-.014,skew:-.028,mount:"wall"},
  {x:1985,y:250,w:126,h:94,asset:3,angle:.014,skew:.032,mount:"wall"},
  {x:1490,y:1110,w:120,h:90,asset:0,angle:-.012,skew:-.03,mount:"wall"},
  {x:2050,y:1100,w:120,h:90,asset:1,angle:.014,skew:.028,mount:"wall"},

  // Freestanding boards ring the roads and public-space corridors.
  {x:500,y:445,w:150,h:112,asset:2,angle:-.035,skew:-.045,mount:"street"},
  {x:955,y:350,w:154,h:116,asset:3,angle:.028,skew:.04,mount:"street"},
  {x:1275,y:445,w:148,h:111,asset:0,angle:-.02,skew:-.035,mount:"street"},
  {x:1715,y:440,w:166,h:124,asset:1,angle:.03,skew:.042,mount:"street"},
  {x:2250,y:440,w:158,h:118,asset:2,angle:-.032,skew:-.042,mount:"street"},
  {x:430,y:915,w:146,h:110,asset:1,angle:.028,skew:.035,mount:"street"},
  {x:940,y:920,w:160,h:120,asset:0,angle:-.032,skew:-.04,mount:"street"},
  {x:1290,y:920,w:150,h:112,asset:3,angle:.024,skew:.038,mount:"street"},
  {x:1755,y:915,w:168,h:126,asset:2,angle:-.026,skew:-.04,mount:"street"},
  {x:2260,y:915,w:158,h:118,asset:0,angle:.03,skew:.04,mount:"street"},
  {x:520,y:1360,w:170,h:128,asset:3,angle:.022,skew:.035,mount:"street"},
  {x:970,y:1360,w:154,h:116,asset:1,angle:-.028,skew:-.036,mount:"street"},
  {x:1305,y:1360,w:162,h:122,asset:2,angle:.026,skew:.038,mount:"street"},
  {x:1750,y:1360,w:170,h:128,asset:0,angle:-.022,skew:-.038,mount:"street"},
  {x:2250,y:1360,w:164,h:123,asset:3,angle:.026,skew:.036,mount:"street"}
];

var faxAdCopy=[
  ["DIE NEUE FAXKRAFT","2,75× SCHNELLER. ENDLICH KANN DER ANTRAG NOCH AM SELBEN TAG AUSGEDRUCKT WERDEN.","MODERN. PRÄZISE. AMTLICH."],
  ["FAXEN IM TAKT DER ZUKUNFT","2,75× SCHNELLER, DAMIT DIE WARTESCHLANGE ELEKTRONISCH FRÜHER BEGINNEN KANN.","SCHNELLER. ORDENTLICHER. DEUTSCHER."],
  ["FORTSCHRITT PER FAX","FÜR AMT, HANDEL UND HAUSHALT. JETZT MIT ERHÖHTER PAPIERGESCHWINDIGKEIT.","DIE DIGITALISIERUNG ENDET AM PAPIERAUSGANG."],
  ["AKTENFLUSS OHNE VERZUG","2,75× SCHNELLER BEIM VERSAND GEDRUCKTER DOKUMENTE.","DIE MASCHINE FÜR DAS NEUE BÜRO."]
];

var missions=[
  {title:"ANMELDUNG I",text:"Gehen Sie zum Bürgeramt und beantragen Sie eine Meldebescheinigung.",target:"buergeramt",form:"anmeldung"},
  {title:"ANMELDUNG II",text:"Natürlich fehlt die Wohnungsgeberbestätigung. Holen Sie sie bei der Hausverwaltung.",target:"hausverwaltung",form:"wohnungsgeber"},
  {title:"ANMELDUNG III",text:"Bringen Sie die Bestätigung zurück zum Bürgeramt und füllen Sie das Ergänzungsblatt aus.",target:"buergeramt",form:"ergaenzung"},
  {title:"STEUERLICHE ERFASSUNG",text:"Das Finanzamt braucht eine Nummer, damit weitere Nummern beantragt werden können.",target:"finanzamt",form:"steuer"},
  {title:"VERSICHERUNGSNACHWEIS",text:"Die Krankenkasse verlangt einen Nachweis, dass ein Nachweis beantragt werden kann.",target:"krankenkasse",form:"versicherung"},
  {title:"AUFENTHALT / NACHWEISE",text:"Gehen Sie zur Ausländerbehörde. Beweisen Sie, dass Sie bereits alles bewiesen haben.",target:"auslaender",form:"aufenthalt"},
  {title:"DAS STADTBILD",text:"Das Amt verlangt optische Normtreue. Richten Sie drei verdächtig individuelle Gegenstände in der Stadt aus.",target:"stadtbild",form:null},
  {title:"EINBÜRGERUNG",text:"Kehren Sie zur Ausländerbehörde zurück und stellen Sie den letzten fiktiven Antrag.",target:"auslaender",form:"citizenship"}
];

var rules=[
  ["§ 17.3b","Schrebergarten-Rasenflächen sind optisch zu würdigen, nicht praktisch zu benutzen."],
  ["§ 4 Abs. 2","Überdurchschnittlich zügiges Gehen kann als unnötige Dynamik gewertet werden."],
  ["§ 8a","Die Straße ist ausschließlich an geometrisch vorgesehenen Stellen zu überqueren."],
  ["§ 11.7","Ein Vorgang ohne Aktenzeichen gilt verwaltungsintern als Stimmung."],
  ["DIN 0815","Mülltonnen haben sich parallel zur gefühlten Bordsteinkante zu verhalten."],
  ["§ 23f","Spontaneität bedarf grundsätzlich der vorherigen Terminvereinbarung."],
  ["§ 5.1","Wer wartet, hat durch sichtbares Warten seine Wartebereitschaft nachzuweisen."],
  ["RuheV §2","Nach 22:00 Uhr ist sogar enthusiastisches Denken nur in Zimmerlautstärke zulässig."],
  ["PfandO §1","Leergut ist kein Müll, sondern temporär illiquides Vermögen."]
];

var npcLines=[
  "Also das ist jetzt aber auch nicht so gedacht.",
  "Kann man machen. Muss man aber nicht.",
  "Hier fehlt eindeutig eine Zuständigkeit.",
  "Ich sage ja nur: früher war das irgendwie geregelter.",
  "Das steht bestimmt irgendwo.",
  "Da würde ich an Ihrer Stelle erst einmal ein Formular holen.",
  "Sie blockieren den Gehweg minimal.",
  "Das ist hier kein Wunschkonzert.",
  "Ordnung muss schon sein.",
  "Ich möchte mich nicht beschweren, aber ich beschwere mich.",
  "Das ist bestimmt wegen der Baustelle. Die ist seit 2009 da.",
  "Für so etwas gibt es Öffnungszeiten."
];

var npcs=[
  {x:520,y:540,name:"HERR KLEIN",line:0,axis:"x",v:18,min:470,max:890},
  {x:1370,y:470,name:"FRAU MÜLLER",line:4,axis:"x",v:-12,min:1290,max:1690},
  {x:585,y:915,name:"HERR SCHULZ",line:7,axis:"y",v:11,min:890,max:1200},
  {x:2070,y:560,name:"FRAU NEUMANN",line:2,axis:"y",v:-13,min:470,max:885},
  {x:1460,y:1350,name:"HERR BECKER",line:9,axis:"x",v:13,min:1310,max:1720},
  {x:2220,y:920,name:"FRAU GRAU",line:8,axis:"y",v:9,min:890,max:1320},
  {x:960,y:470,name:"HERR DIN",line:10,axis:"y",v:8,min:430,max:610}
];

var pickups=[
  {x:1995,y:720,type:"bratwurst",label:"BRATWURST",taken:false},
  {x:1880,y:745,type:"currywurst",label:"CURRYWURST",taken:false},
  {x:2170,y:720,type:"brezel",label:"BREZEL",taken:false},
  {x:420,y:780,type:"pfand",label:"PFANDFLASCHE",taken:false},
  {x:920,y:900,type:"pfand",label:"PFANDFLASCHE",taken:false},
  {x:1320,y:760,type:"pfand",label:"PFANDFLASCHE",taken:false},
  {x:2290,y:520,type:"pfand",label:"PFANDFLASCHE",taken:false}
];

var stadtbildObjects=[
  {x:2260,y:1050,type:"bin",fixed:false,label:"MÜLLTONNE 4,6° SCHIEF"},
  {x:1570,y:500,type:"chairs",fixed:false,label:"STÜHLE NICHT FLUCHTGERECHT"},
  {x:450,y:900,type:"hedge",fixed:false,label:"HECKE 3 CM ZU INDIVIDUELL"}
];

var forms={
anmeldung:{code:"ANM-42b",title:"Anmeldung einer möglicherweise bereits angemeldeten Person",subtitle:"Bitte vollständig ausfüllen. Unvollständige Vollständigkeit gilt als unvollständig.",fields:[
  ["text","VOLLSTÄNDIGER NAME","name"],["text","GEBURTSORT INKL. HEUTIGER GEMEINDEGRENZE","birth"],
  ["text","WOHNUNG, IN DER SIE NACHWEISLICH WOHNEN","address"],["select","WOHNUNGSSTATUS","status",["gemeldet","noch nicht gemeldet","gemeldet, aber anders"]],
  ["check","Ich bestätige, dass diese Angaben nach bestem bürokratischem Gewissen redundant sind.","confirm"]
]},
wohnungsgeber:{code:"WGB-88",title:"Wohnungsgeberbestätigung zur Bestätigung einer Wohnung",subtitle:"Bitte bestätigen Sie, dass die Wohnung, in der Sie wohnen, tatsächlich eine Wohnung ist.",fields:[
  ["text","ANSCHRIFT DER WOHNUNG","address"],["text","NAME DES WOHNUNGSGEBENDEN WOHNUNGSGEBERS","landlord"],
  ["select","ART DER ÜBERLASSUNG","kind",["vermietet","untervermietet","mysteriös überlassen"]],
  ["text","DATUM DER TATSÄCHLICHEN TATSACHE DES EINZUGS","date"],
  ["check","Ich bestätige die Existenz von Wänden, mindestens einer Tür und einer Meldeadresse.","confirm"]
]},
ergaenzung:{code:"ANM-E17",title:"Ergänzungsblatt zur Ergänzung des bereits ergänzten Antrags",subtitle:"Dieses Formular wurde erst durch das vorherige Formular erforderlich.",fields:[
  ["text","AKTENZEICHEN DES FORMULARS, DAS SIE GERADE ABGEGEBEN HABEN","case"],
  ["text","GRUND, WARUM DAS AKTENZEICHEN NICHT VORHER EINGETRAGEN WURDE","why"],
  ["select","PAPIERFORMAT DER BEILAGE","paper",["A4","A4, aber gefaltet","A4 aus Überzeugung"]],
  ["check","Ich erkläre mich mit der Entstehung eines weiteren Verwaltungsvorgangs einverstanden.","confirm"]
]},
steuer:{code:"F-A-19%",title:"Fragebogen zur steuerlichen Erfassung einer erfassten Person",subtitle:"Die nachfolgenden Zahlen dienen ausschließlich der Erzeugung weiterer Zahlen.",fields:[
  ["text","STEUERLICH RELEVANTER LIEBLINGSBUCHSTABE","letter"],["text","GESCHÄTZTE JAHRESEINNAHMEN IN EURO, CENT UND GEFÜHL","income"],
  ["select","BEABSICHTIGTE FORM DER ORDNUNGSMÄSSIGKEIT","order",["ordnungsgemäß","sehr ordnungsgemäß","noch zu prüfen"]],
  ["text","IBAN ODER ERKLÄRUNG, WARUM KEINE IBAN","iban"],
  ["check","Ich bin darüber informiert, dass Nichtwissen steuerlich kein Dateiformat ist.","confirm"]
]},
versicherung:{code:"KV-100",title:"Antrag auf Nachweis eines Nachweises",subtitle:"Gesundheit ist privat. Das Formular ist es nicht.",fields:[
  ["text","VERSICHERTENNUMMER, FALLS BEREITS VERSICHERT","number"],["text","NUMMER, FALLS NUMMER NOCH NICHT VORHANDEN","other"],
  ["select","AKTUELLER ZUSTAND","state",["versichert","voraussichtlich versichert","formularbedingt erschöpft"]],
  ["text","HAUSARZT ODER BEGRÜNDUNG, WARUM DIESER GERADE URLAUB HAT","doctor"],
  ["check","Ich bestätige, dass eine Karte später separat zugesandt werden darf.","confirm"]
]},
aufenthalt:{code:"ABH-404",title:"Antrag auf Fortsetzung der Anwesenheit",subtitle:"Für die Vorsprache benötigen Sie einen Nachweis über die erfolgreiche Vorsprache.",fields:[
  ["text","AKTENZEICHEN","case"],["text","ZWEITES AKTENZEICHEN, FALLS ERSTES VORHANDEN","case2"],
  ["select","GRUND DES AUFENTHALTS","reason",["Formulare","weitere Formulare","vorübergehend dauerhaft"]],
  ["text","NACHWEIS DES NACHWEISES","proof"],
  ["check","Ich versichere, dass ich bei Rückfragen für Rückfragen erreichbar bin.","confirm"]
]},
citizenship:{code:"DE-1A",title:"Antrag auf deutsche Staatsangehörigkeit im Spiel",subtitle:"Fiktives Spielverfahren. Dies bildet keine echten Voraussetzungen oder Rechtslage ab.",fields:[
  ["text","NAME","name"],["select","KENNTNIS DER HAUSORDNUNG","rules",["ausreichend","übertrieben","laminiert"]],
  ["select","VERHÄLTNIS ZUR MÜLLTRENNUNG","trash",["ambitioniert","akademisch","existenziell"]],
  ["text","BEGRÜNDUNG, WARUM DIESES FORMULAR NICHT GEHEFTET WURDE","staple"],
  ["check","Ich erkenne an, dass sämtliche hier dargestellten Regeln und Fristen frei erfunden sind.","confirm"]
]}
};

function readSave(){
  try{
    var raw=localStorage.getItem(SAVE_KEY);
    if(!raw)return null;
    var data=JSON.parse(raw);
    return data&&data.version===1?data:null;
  }catch(err){return null}
}
function saveGame(){
  if(!state.started||state.gameOver)return;
  try{
    localStorage.setItem(SAVE_KEY,JSON.stringify({
      version:1,savedAt:Date.now(),
      state:{time:state.time,day:state.day,mission:state.mission,forms:state.forms,pfand:state.pfand,energy:state.energy,stadtbild:state.stadtbild,citizen:state.citizen},
      player:{x:player.x,y:player.y},
      pickups:pickups.map(function(p){return !!p.taken}),
      stadtbildObjects:stadtbildObjects.map(function(o){return !!o.fixed})
    }));
  }catch(err){}
}
function clearSave(){
  try{localStorage.removeItem(SAVE_KEY)}catch(err){}
}
function savedNumber(value,fallback){var n=Number(value);return Number.isFinite(n)?n:fallback}
function applySave(data){
  if(!data||!data.state)return false;
  var s=data.state,p=data.player||{};
  state.time=clamp(savedNumber(s.time,8*60),0,24*60-1);
  state.day=clamp(Math.floor(savedNumber(s.day,1)),1,3);
  state.mission=clamp(Math.floor(savedNumber(s.mission,0)),0,missions.length);
  state.forms=clamp(Math.floor(savedNumber(s.forms,0)),0,99);
  state.pfand=clamp(Math.floor(savedNumber(s.pfand,0)),0,99);
  state.energy=clamp(savedNumber(s.energy,100),0,100);
  state.stadtbild=clamp(Math.floor(savedNumber(s.stadtbild,0)),0,3);
  state.citizen=!!s.citizen;
  player.x=clamp(savedNumber(p.x,770),22,W.w-22);player.y=clamp(savedNumber(p.y,1315),22,W.h-22);
  (data.pickups||[]).forEach(function(taken,i){if(pickups[i])pickups[i].taken=!!taken});
  (data.stadtbildObjects||[]).forEach(function(fixed,i){if(stadtbildObjects[i])stadtbildObjects[i].fixed=!!fixed});
  return true;
}

function resize(){
  var dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.floor(innerWidth*dpr);canvas.height=Math.floor(innerHeight*dpr);
  canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener("resize",resize);resize();

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function distance(ax,ay,bx,by){return Math.hypot(ax-bx,ay-by)}
function inRect(x,y,r){return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h}
function roadAt(x,y){return roads.some(function(r){return inRect(x,y,r)})}
function crosswalkAt(x,y){return crosswalks.some(function(r){return inRect(x,y,r)})}
function onSchreberGrass(x,y){return x>schreber.x+18&&x<schreber.x+schreber.w-18&&y>schreber.y+18&&y<schreber.y+schreber.h-18}

function billboardBaseY(b){
  return b.y+b.h*.5+Math.max(26,b.h*.27);
}
function billboardBlocksPoint(x,y,b){
  if(b.mount!=="street")return false;
  var halfW=b.w*.34+player.r;
  var top=b.y+b.h*.38-player.r;
  var bottom=billboardBaseY(b)+player.r+8;
  return x>b.x-halfW&&x<b.x+halfW&&y>top&&y<bottom;
}

function blocked(x,y){
  if(x<22||y<22||x>W.w-22||y>W.h-22||inRect(x,y,spree))return true;
  for(var i=0;i<buildings.length;i++){
    var b=buildings[i];
    if(x>b.x-player.r&&x<b.x+b.w+player.r&&y>b.y-player.r&&y<b.y+b.h+player.r)return true;
  }
  for(var j=0;j<faxBillboards.length;j++){
    if(billboardBlocksPoint(x,y,faxBillboards[j]))return true;
  }
  return false;
}

function toast(msg){
  var e=document.getElementById("toast");e.textContent=msg;e.classList.add("show");
  clearTimeout(toast.t);toast.t=setTimeout(function(){e.classList.remove("show")},2300);
}
function updateHUD(){
  var s=document.getElementById("stars");s.innerHTML="";
  for(var i=0;i<5;i++){var n=document.createElement("span");n.className="star"+(i<state.wanted?" active":"");n.textContent="★";s.appendChild(n)}
  document.getElementById("offence").textContent=state.offence;
  document.getElementById("energy").textContent=Math.round(state.energy);
  document.getElementById("forms-count").textContent=state.forms;
  document.getElementById("pfand-count").textContent=state.pfand;
  var m=missions[Math.min(state.mission,missions.length-1)];
  document.getElementById("mission-title").textContent=state.citizen?"VORGANG ABGESCHLOSSEN":m.title;
  document.getElementById("mission-text").textContent=state.citizen?"Freies Spiel: Sammeln Sie Pfand, lesen Sie Faxwerbung oder sprechen Sie mit Angela Merkel.":m.text;
  var frac=state.citizen?1:state.mission/missions.length+(state.mission===6?state.stadtbild/3/missions.length:0);
  document.getElementById("mission-progress").style.width=Math.min(100,frac*100)+"%";
  var r=rules[state.activeRule%rules.length];
  document.getElementById("rule-id").textContent=r[0];
  document.getElementById("rule-text").textContent=r[1];
  var hour=Math.floor(state.time/60)%24,min=Math.floor(state.time%60);
  document.getElementById("clock").textContent=String(hour).padStart(2,"0")+":"+String(min).padStart(2,"0");
  document.getElementById("deadline").textContent=state.citizen?"VORGANG ABGESCHLOSSEN · TAG "+state.day:"EINBÜRGERUNGSFRIST: "+Math.max(0,4-state.day)+" FIKTIVE BEHÖRDENTAGE";
}
function spawnPolice(n){
  for(var i=0;i<n;i++){
    var a=Math.random()*Math.PI*2,d=190+Math.random()*100;
    police.push({x:clamp(player.x+Math.cos(a)*d,30,W.w-30),y:clamp(player.y+Math.sin(a)*d,30,W.h-30),r:12,speed:115+state.wanted*16})
  }
}
function wanted(level,msg,instant){
  var before=state.wanted;state.wanted=Math.max(state.wanted,level);state.offence=msg;state.wantedCooldown=12;
  if(instant||state.wanted>before)spawnPolice(instant?4:Math.max(1,state.wanted-before));
  toast(msg+" · "+state.wanted+" STERN"+(state.wanted===1?"":"E"));updateHUD();
}
function openDialogue(speaker,lines,portrait,done){
  state.modal=true;state.dialogue=true;state.dialogueData={mode:"linear",speaker:speaker,lines:lines,portrait:portrait||"§",i:0,done:done||null};
  renderDialogue();
}
function faceMerkelToPlayer(){
  var dx=player.x-merkel.x,dy=player.y-merkel.y;
  if(Math.abs(dx)>Math.abs(dy)){merkel.dirX=dx<0?-1:1;merkel.dirY=0}
  else{merkel.dirX=0;merkel.dirY=dy<0?-1:1}
}
function setMerkelPose(pose){
  if(pose==="back"){merkel.dirX=0;merkel.dirY=-1}
  if(pose==="front"){merkel.dirX=0;merkel.dirY=1}
}
function openMerkelDialogue(nodeId){
  merkel.meetingCount++;
  faceMerkelToPlayer();
  var starts=["start","start2","start3"];
  state.modal=true;state.dialogue=true;
  state.dialogueData={mode:"merkel",node:nodeId||starts[(merkel.meetingCount-1)%starts.length]};
  renderDialogue();
}
function closeDialogue(){
  var box=document.getElementById("dialogue");
  box.hidden=true;box.classList.remove("merkel-dialogue");
  document.getElementById("dialogue-choices").hidden=true;
  document.getElementById("dialogue-reply").hidden=true;
  state.dialogue=false;state.modal=false;
}
function renderDialogue(){
  var d=state.dialogueData;
  var box=document.getElementById("dialogue");
  var choices=document.getElementById("dialogue-choices");
  var reply=document.getElementById("dialogue-reply");
  var next=document.getElementById("dialogue-next");
  box.hidden=false;
  if(d.mode==="merkel"){
    var data=window.MERKEL_DIALOGUE||{};
    var node=data[d.node]||data.start;
    if(!node){closeDialogue();return}
    if(node.pose)setMerkelPose(node.pose);
    box.classList.add("merkel-dialogue");
    document.getElementById("speaker").textContent="ANGELA MERKEL";
    document.getElementById("portrait").textContent="";
    document.getElementById("dialogue-text").textContent=node.text;
    next.hidden=true;choices.innerHTML="";choices.hidden=false;
    node.choices.forEach(function(c){
      var b=document.createElement("button");b.type="button";b.textContent=c[0];
      b.addEventListener("click",function(){
        if(c[1]==="__close"){closeDialogue();return}
        state.dialogueData.node=c[1];renderDialogue();
      });
      choices.appendChild(b);
    });
    reply.hidden=!node.free;
    if(node.free)document.getElementById("dialogue-reply-input").value="";
    return;
  }
  box.classList.remove("merkel-dialogue");
  choices.hidden=true;reply.hidden=true;next.hidden=false;
  document.getElementById("speaker").textContent=d.speaker;
  document.getElementById("portrait").textContent=d.portrait;
  document.getElementById("dialogue-text").textContent=d.lines[d.i];
  next.textContent=d.i===d.lines.length-1?"VERSTANDEN [E]":"WEITER [E]";
}
function nextDialogue(){
  if(!state.dialogue)return;
  var d=state.dialogueData;
  if(d.mode==="merkel")return;
  d.i++;
  if(d.i<d.lines.length){renderDialogue();return}
  closeDialogue();
  if(d.done)d.done();
}
document.getElementById("dialogue-next").addEventListener("click",nextDialogue);
document.getElementById("dialogue-reply").addEventListener("submit",function(ev){
  ev.preventDefault();
  var raw=document.getElementById("dialogue-reply-input").value.trim();
  if(!raw)return;
  var t=raw.toLowerCase(),node="free_generic";
  if(/atom|kern|energie|kohle|strom|fukushima|wind|netz/.test(t))node="energie";
  else if(/internet|digital|neuland|email|e-mail|wlan|fax/.test(t))node="neuland";
  else if(/euro|europa|währung/.test(t))node="euro";
  else if(/schaffen|flücht|migration|2015/.test(t))node="schaffen";
  else if(/nsa|ausspäh|freunde|handy|datenschutz/.test(t))node="freunde";
  else if(/alternativ/.test(t))node="alternativlos";
  else if(/durchwurst/.test(t))node="durchwursteln";
  else if(/hinter|umdrehen|drehen|rückansicht/.test(t))node="hintermir";
  else if(/raute|hände|haende/.test(t))node="raute";
  else if(/pfand|flasche/.test(t))node="pfand";
  else if(/curry|bratwurst|wurst/.test(t))node="curry";
  else if(/amt|büro|buero|formular|termin|verwaltung/.test(t))node="amt";
  state.dialogueData.node=node;renderDialogue();
});

function showForm(type){
  var def=forms[type];if(!def)return;
  state.modal=true;
  document.getElementById("form-modal").hidden=false;
  document.getElementById("form-code").textContent=def.code;
  document.getElementById("form-title").textContent=def.title;
  document.getElementById("form-subtitle").textContent=def.subtitle;
  document.getElementById("form-error").textContent="";
  var wrap=document.getElementById("form-fields");wrap.innerHTML="";
  def.fields.forEach(function(f){
    if(f[0]==="check"){
      var c=document.createElement("label");c.className="check";
      var input=document.createElement("input");input.type="checkbox";input.name=f[2];input.required=true;
      var span=document.createElement("span");span.textContent=f[1];c.appendChild(input);c.appendChild(span);wrap.appendChild(c);return;
    }
    var lab=document.createElement("label");lab.className="field";
    var title=document.createElement("span");title.textContent=f[1];lab.appendChild(title);
    if(f[0]==="select"){
      var sel=document.createElement("select");sel.name=f[2];sel.required=true;
      var empty=document.createElement("option");empty.value="";empty.textContent="BITTE AUSWÄHLEN";sel.appendChild(empty);
      f[3].forEach(function(o){var op=document.createElement("option");op.value=o;op.textContent=o;sel.appendChild(op)});
      lab.appendChild(sel);
    }else{
      var inp=document.createElement("input");inp.type="text";inp.name=f[2];inp.required=true;inp.autocomplete="off";lab.appendChild(inp);
    }
    wrap.appendChild(lab);
  });
  document.getElementById("bureaucracy-form").dataset.formType=type;
}
document.getElementById("bureaucracy-form").addEventListener("submit",function(ev){
  ev.preventDefault();
  var form=ev.currentTarget;
  if(!form.reportValidity()){document.getElementById("form-error").textContent="VORGANG UNVOLLSTÄNDIG. NATÜRLICH.";return}
  var type=form.dataset.formType;
  document.getElementById("form-modal").hidden=true;state.modal=false;state.forms++;
  toast("FORMULAR "+forms[type].code+" ERFOLGREICH IN EINEN ANDEREN STAPEL GELEGT");
  state.mission++;
  if(type==="citizenship"){
    state.citizen=true;
    showOverlay("EINBÜRGERUNG: VORLÄUFIG ERFOLGREICH","Sie haben "+state.forms+" Formulare ausgefüllt, "+state.pfand+" Pfandflaschen gesichert und verdächtig viel Geduld nachgewiesen. Diese Spielmission ist frei erfunden und bildet keine echte Einbürgerung ab.","VERWALTUNGSVORGANG ABGESCHLOSSEN","FREIES SPIEL",true);
  }
  saveGame();updateHUD();
});

function showOverlay(title,copy,kicker,buttonLabel,showRestart){
  state.modal=true;
  document.getElementById("overlay-title").textContent=title;
  document.getElementById("overlay-copy").textContent=copy;
  document.getElementById("overlay-kicker").textContent=kicker||"VERWALTUNGSVORGANG";
  document.getElementById("overlay-button").textContent=buttonLabel||"WEITERSPIELEN";
  document.getElementById("overlay-restart").hidden=!showRestart;
  document.getElementById("overlay").hidden=false;
}
document.getElementById("overlay-button").addEventListener("click",function(){
  if(state.gameOver){clearSave();location.reload();return}
  document.getElementById("overlay").hidden=true;state.modal=false;saveGame();
});
document.getElementById("overlay-restart").addEventListener("click",function(){clearSave();location.reload()});

function interact(){
  if(state.dialogue){nextDialogue();return}
  if(state.modal)return;
  var m=missions[Math.min(state.mission,missions.length-1)];
  if(distance(player.x,player.y,merkel.x,merkel.y)<72){openMerkelDialogue();return}
  for(var i=0;i<buildings.length;i++){
    var b=buildings[i];
    if(distance(player.x,player.y,b.doorX,b.doorY)<75){
      if(state.citizen&&b.id==="auslaender"){
        openDialogue("AUSLÄNDERBEHÖRDE",["Ihr fiktiver Vorgang ist bereits abgeschlossen.","Eine Bescheinigung über die Bescheinigung wird Ihnen in sechs bis acht Spielwochen zugestellt."],"✓");
      }else if(b.id===m.target){
        if(state.mission===6){
          if(state.stadtbild===0){
            openDialogue("AMT FÜR STADTBILD",[
              "Gemäß der rein fiktiven Gestaltungsvorschrift ist die Stadt in einen hinreichend normierten Zustand zurückzuführen.",
              "Auf diesem satirischen Aushang sehen Sie Friedrich Merz als stilisierte politische Karikatur. Daraus folgt hier keine reale politische Behauptung.",
              "Richten Sie die Mülltonne, die Stühle und die Hecke aus. Danach sprechen wir über Deutschland in Graustufe 7."
            ],"FM",function(){toast("3 STADTBILD-ABWEICHUNGEN MARKIERT")});
          }else if(state.stadtbild>=3){
            openDialogue("AMT FÜR STADTBILD",[
              "Ausgezeichnet. Die Mülltonne steht wieder parallel zur gefühlten Bordsteinkante.",
              "Die Stadt ist nun statistisch 14 Prozent weniger individuell.",
              "Sie erhalten Stempel B: optische Unbedenklichkeit."
            ],"✓",function(){state.mission++;saveGame();updateHUD()});
          }else{
            toast("NOCH "+(3-state.stadtbild)+" OPTISCHE ABWEICHUNG(EN) ZU NORMIEREN");
          }
        }else{
          bureaucratIntro(b,m);
        }
      }else if(b.id==="imbiss"){
        openDialogue("WURST-INSEL",["Eine Bratwurst? Gibt +35 Energie. Currywurst gibt +50 und kurzfristig Verwaltungsmut.","Bitte Senf nicht mit dem Aktenzeichen verwechseln."],"🌭");
      }else{
        openDialogue(b.name,["Sie sind hier grundsätzlich richtig, aber für einen anderen Vorgang.","Versuchen Sie es mit Zuständigkeit. Oder Dienstag. Dienstag ist beliebt."],"§");
      }
      return;
    }
  }
  for(var n=0;n<npcs.length;n++){
    var npc=npcs[n];
    if(distance(player.x,player.y,npc.x,npc.y)<55){
      openDialogue(npc.name,[npcLines[npc.line],npcLines[(npc.line+3)%npcLines.length]],"!");
      return;
    }
  }
  for(var j=0;j<stadtbildObjects.length;j++){
    var o=stadtbildObjects[j];
    if(!o.fixed&&distance(player.x,player.y,o.x,o.y)<55){
      if(state.mission===6){
        o.fixed=true;state.stadtbild++;toast("STADTBILD NORMIERT: "+o.label);saveGame();updateHUD();
      }else toast("DAS IST NOCH NICHT IHR VORGANG");
      return;
    }
  }
  for(var k=0;k<faxBillboards.length;k++){
    var ad=faxBillboards[k];
    if(ad.mount!=="street")continue;
    var ay=billboardBaseY(ad);
    if(distance(player.x,player.y,ad.x,ay)<78){
      var copy=faxAdCopy[ad.asset%faxAdCopy.length];
      openDialogue(copy[0],[copy[1],copy[2],"HINWEIS: DIE ANGEGEBENE GESCHWINDIGKEIT IST EINE SPIELWERBUNG UND KEINE PRODUKTBEHAUPTUNG."],"FAX");
      return;
    }
  }
  toast("HIER IST NIEMAND ZUSTÄNDIG");
}

function bureaucratIntro(b,m){
  var lines=[
    "Guten Tag. Bitte nennen Sie nicht Ihren Namen, bevor Ihr Vorgang aufgerufen wurde.",
    "Für "+m.title+" benötige ich zunächst Formular "+forms[m.form].code+".",
    "Füllen Sie bitte jedes Feld aus. Auch die Felder, deren Zweck sich erst nach Abgabe ergibt."
  ];
  openDialogue(b.name+" · SCHALTER "+(2+state.mission),lines,"§",function(){showForm(m.form)});
}

function badIdea(){
  if(state.modal)return;
  if(onSchreberGrass(player.x,player.y)){wanted(4,"VORSÄTZLICHE RASENMISSACHTUNG IM SCHREBERGARTEN",true);return}
  if(roadAt(player.x,player.y)){wanted(Math.max(2,state.wanted),"UNNÖTIGES VERWEILEN AUF VERKEHRSFLÄCHE",false);return}
  wanted(Math.max(1,state.wanted),"X-TASTE OHNE GENEHMIGTEN VERWENDUNGSZWECK",false);
}

function collect(){
  pickups.forEach(function(p){
    if(p.taken||distance(player.x,player.y,p.x,p.y)>28)return;
    p.taken=true;
    if(p.type==="pfand"){state.pfand++;toast("PFAND +1 · VERMÖGEN WIEDER LIQUID")}
    else{
      var add=p.type==="currywurst"?50:p.type==="bratwurst"?35:22;
      state.energy=clamp(state.energy+add,0,100);
      toast(p.label+" +"+add+" ENERGIE");
      particles.push({x:p.x,y:p.y,t:1,text:"+ "+p.label});
    }
    saveGame();updateHUD();
  });
}

function update(dt){
  if(state.modal)return;
  state.time+=dt*1.65;
  if(state.time>=24*60){state.time-=24*60;state.day++}
  if(state.day>=4&&!state.citizen&&!state.gameOver){
    state.gameOver=true;
    showOverlay("FIKTIVE AUSWEISUNG","Die absichtlich absurde Spiel-Frist ist abgelaufen. In der Realität gelten andere Gesetze, Verfahren und Rechte. Im Spiel müssen Sie leider von vorn anfangen.","GAME OVER · NICHT RECHTLICH REALISTISCH","NEUER VORGANG",false);
    return;
  }

  var dx=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0);
  var dy=(keys.ArrowDown||keys.KeyS?1:0)-(keys.ArrowUp||keys.KeyW?1:0);
  var len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;
  var running=!!(keys.ShiftLeft||keys.ShiftRight);
  var speed=player.baseSpeed*(running?1.72:1)*(state.energy<25?.82:1);
  if(dx||dy){player.dirX=dx;player.dirY=dy}
  var nx=player.x+dx*speed*dt,ny=player.y+dy*speed*dt;
  if(!blocked(nx,player.y))player.x=nx;
  if(!blocked(player.x,ny))player.y=ny;

  if(dx||dy){
    state.energy=clamp(state.energy-dt*(running?1.8:.18),0,100);
    if(running)state.runningTimer+=dt;else state.runningTimer=Math.max(0,state.runningTimer-dt*2);
  }else state.energy=clamp(state.energy+dt*.7,0,100);

  if(state.runningTimer>1.4&&state.wanted<1){
    wanted(1,"VERDÄCHTIG ZÜGIGES FORTBEWEGEN OHNE SPORTBESCHEINIGUNG",false);state.runningTimer=0;
  }

  state.jayCooldown=Math.max(0,state.jayCooldown-dt);
  if(roadAt(player.x,player.y)&&!crosswalkAt(player.x,player.y)&&state.jayCooldown===0){
    state.jayCooldown=5;wanted(Math.max(1,state.wanted),"FAHRBAHNÜBERQUERUNG AUSSERHALB MARKIERTER GEOMETRIE",false);
  }

  state.gardenCooldown=Math.max(0,state.gardenCooldown-dt);
  if(onSchreberGrass(player.x,player.y)&&state.gardenCooldown===0){
    state.gardenCooldown=8;
    wanted(Math.max(2,state.wanted),"RASENBETRETUNG IM SCHREBERGARTEN · SOFORTMASSNAHME",true);
  }

  state.wantedCooldown=Math.max(0,state.wantedCooldown-dt);
  if(state.wanted>0&&state.wantedCooldown===0){
    state.wanted--;state.wantedCooldown=9;
    if(state.wanted===0)state.offence="AKTENLAGE: VORLÄUFIG UNAUFFÄLLIG";
  }

  for(var i=police.length-1;i>=0;i--){
    var p=police[i],vx=player.x-p.x,vy=player.y-p.y,d=Math.hypot(vx,vy)||1;
    p.x+=vx/d*p.speed*dt;p.y+=vy/d*p.speed*dt;
    if(d<player.r+p.r+4){
      police.splice(i,1);
      state.energy=Math.max(30,state.energy-20);
      player.x=770;player.y=1315;
      state.wanted=Math.max(0,state.wanted-1);
      state.offence="PERSONALIEN FESTGESTELLT · HINWEIS ERTEILT";
      toast("POLIZEILICHE MASSNAHME: SIE WURDEN ZUR WACHE BEGLEITET");
    }else if(state.wanted===0&&d>500)police.splice(i,1);
  }

  npcs.forEach(function(n){
    if(n.axis==="x"){n.x+=n.v*dt;if(n.x<n.min||n.x>n.max)n.v*=-1}
    else{n.y+=n.v*dt;if(n.y<n.min||n.y>n.max)n.v*=-1}
  });

  merkel.retarget-=dt;
  if(merkel.retarget<=0||distance(merkel.x,merkel.y,merkel.targetX,merkel.targetY)<24){
    merkel.retarget=2.5+Math.random()*5.5;
    merkel.targetX=clamp(merkel.x+(Math.random()-.5)*620,70,W.w-70);
    merkel.targetY=clamp(merkel.y+(Math.random()-.5)*420,420,W.h-170);
  }
  var mvx=merkel.targetX-merkel.x,mvy=merkel.targetY-merkel.y,md=Math.hypot(mvx,mvy)||1;
  if(md>18){
    mvx/=md;mvy/=md;merkel.dirX=mvx;merkel.dirY=mvy;
    var mx=merkel.x+mvx*merkel.speed*dt,my=merkel.y+mvy*merkel.speed*dt;
    if(!blocked(mx,merkel.y))merkel.x=mx;else merkel.retarget=0;
    if(!blocked(merkel.x,my))merkel.y=my;else merkel.retarget=0;
    merkel.anim+=dt*6;
  }

  particles.forEach(function(p){p.t-=dt;p.y-=20*dt});
  particles=particles.filter(function(p){return p.t>0});
  state.ruleTimer+=dt;if(state.ruleTimer>8){state.ruleTimer=0;state.activeRule=(state.activeRule+1)%rules.length}
  state.saveTimer+=dt;if(state.saveTimer>5){state.saveTimer=0;saveGame()}
  collect();updateHUD();
}

function drawWorld(){
  ctx.fillStyle="#8b8881";ctx.fillRect(0,0,W.w,W.h);

  ctx.fillStyle="#9b9891";
  for(var x=0;x<W.w;x+=120)ctx.fillRect(x,0,2,W.h);
  for(var y=0;y<W.h;y+=120)ctx.fillRect(0,y,W.w,2);

  ctx.fillStyle=COLORS.walk;
  roads.forEach(function(r){ctx.fillRect(r.x-28,r.y-28,r.w+56,r.h+56)});
  ctx.fillStyle=COLORS.road;
  roads.forEach(function(r){ctx.fillRect(r.x,r.y,r.w,r.h)});
  ctx.strokeStyle="#c8c4b8";ctx.lineWidth=3;ctx.setLineDash([20,22]);
  ctx.beginPath();ctx.moveTo(0,765);ctx.lineTo(W.w,765);ctx.moveTo(1145,0);ctx.lineTo(1145,W.h);ctx.stroke();ctx.setLineDash([]);

  ctx.fillStyle="#d7d3c8";
  crosswalks.forEach(function(r){
    if(r.w>r.h){for(var xx=r.x;xx<r.x+r.w;xx+=28)ctx.fillRect(xx,r.y,13,r.h)}
    else{for(var yy=r.y;yy<r.y+r.h;yy+=28)ctx.fillRect(r.x,yy,r.w,13)}
  });

  drawSchreber();
  drawConstruction();
  drawSpree();
  buildings.forEach(drawBuilding);
  drawFaxBillboards(false);
  drawStadtbildObjects();
  drawPickups();
  npcs.forEach(drawNPC);
  drawMerkel();
  police.forEach(drawPolice);
  drawPlayer();
  drawFaxBillboards(true);
  drawPrompts();
  particles.forEach(function(p){ctx.fillStyle="#111";ctx.font="700 11px Arial";ctx.fillText(p.text,p.x,p.y)});
}

function drawSchreber(){
  ctx.fillStyle="#4f534b";ctx.fillRect(schreber.x-8,schreber.y-8,schreber.w+16,schreber.h+16);
  ctx.fillStyle=COLORS.garden;ctx.fillRect(schreber.x,schreber.y,schreber.w,schreber.h);
  ctx.strokeStyle="#484b43";ctx.lineWidth=3;
  for(var i=1;i<4;i++){ctx.beginPath();ctx.moveTo(schreber.x+i*125,schreber.y);ctx.lineTo(schreber.x+i*125,schreber.y+schreber.h);ctx.stroke()}
  for(var j=0;j<4;j++){
    var gx=schreber.x+j*125+22,gy=schreber.y+55;
    ctx.fillStyle="#8c8980";ctx.fillRect(gx,gy,58,42);
    ctx.fillStyle="#55534e";ctx.fillRect(gx+10,gy-14,38,16);
    ctx.fillStyle="#b7b0a0";ctx.fillRect(gx+28,gy+22,7,20);
    ctx.fillStyle="#3f433b";ctx.beginPath();ctx.arc(gx+92,gy+60,18,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle="#e4dfd3";ctx.fillRect(schreber.x+8,schreber.y+8,205,27);
  ctx.fillStyle="#171717";ctx.font="900 12px Arial";ctx.fillText("SCHREBERGÄRTEN · RASEN VERBOTEN",schreber.x+16,schreber.y+26);
}

function drawConstruction(){
  ctx.fillStyle="#686660";ctx.fillRect(915,420,230,135);
  ctx.fillStyle="#c5c1b4";ctx.font="900 14px Arial";ctx.fillText("BAUSTELLE",970,458);
  ctx.font="10px Arial";ctx.fillText("FERTIGSTELLUNG: DEMNÄCHST",940,478);
  for(var i=0;i<8;i++){ctx.fillStyle=i%2?"#dad4c4":"#56534f";ctx.fillRect(930+i*23,510,23,15)}
}

function drawSpree(){
  ctx.fillStyle=COLORS.water;ctx.fillRect(spree.x,spree.y,spree.w,spree.h);
  ctx.strokeStyle="#858c8b";ctx.lineWidth=3;
  for(var i=0;i<9;i++){ctx.beginPath();ctx.moveTo(i*320,1490);ctx.quadraticCurveTo(i*320+80,1474,i*320+160,1490);ctx.stroke()}
  ctx.fillStyle="#d4d0c4";ctx.font="900 12px Arial";ctx.fillText("SPREE · BETRETEN DES WASSERS NUR MIT ZUSTÄNDIGKEIT",40,1510);
}

function drawBuilding(b){
  ctx.fillStyle="#4a4945";ctx.fillRect(b.x+8,b.y+9,b.w,b.h);
  ctx.fillStyle=COLORS.building;ctx.fillRect(b.x,b.y,b.w,b.h);
  ctx.fillStyle="#67645f";ctx.fillRect(b.x,b.y,b.w,34);
  ctx.fillStyle="#ded9cd";ctx.font="900 16px Arial";ctx.fillText(b.name,b.x+15,b.y+23);
  ctx.fillStyle="#4c4a46";
  for(var y=b.y+58;y<b.y+b.h-40;y+=58)for(var x=b.x+22;x<b.x+b.w-25;x+=72)ctx.fillRect(x,y,42,28);
  ctx.fillStyle="#2f2e2b";ctx.fillRect(b.doorX-22,b.y+b.h-45,44,45);
  ctx.fillStyle="#e4dfd4";ctx.fillRect(b.x+13,b.y+b.h-28,b.w-26,18);
  ctx.fillStyle="#222";ctx.font="700 9px Arial";ctx.fillText(b.sign,b.x+20,b.y+b.h-15);
  ctx.fillStyle="#222";ctx.beginPath();ctx.moveTo(b.doorX,b.y+b.h+4);ctx.lineTo(b.doorX-8,b.y+b.h+18);ctx.lineTo(b.doorX+8,b.y+b.h+18);ctx.closePath();ctx.fill();
}

function drawFaxBillboards(foreground){
  faxBillboards.forEach(function(b){
    var postH=Math.max(26,b.h*.27);
    var depthY=b.mount==="wall"?-Infinity:b.y+b.h*.5+postH;
    if((depthY>player.y)===foreground)drawFaxBillboard(b);
  });
}

function drawFaxBillboard(b){
  var img=billboardAssets[b.asset%billboardAssets.length];
  var w=b.w,h=b.h,depth=Math.max(5,w*.045);
  var wall=b.mount==="wall";
  var postH=Math.max(26,h*.27);

  ctx.save();
  ctx.translate(b.x,b.y);
  ctx.rotate(b.angle||0);
  ctx.transform(1,0,b.skew||0,1,0,0);

  if(wall){
    ctx.fillStyle="rgba(20,20,18,.24)";
    ctx.fillRect(-w/2+depth,-h/2+depth,w+7,h+7);
    ctx.fillStyle="#3c3a36";
    ctx.fillRect(-w/2-9,-h*.28,6,h*.56);
    ctx.fillRect(w/2+3,-h*.28,6,h*.56);
  }else{
    ctx.fillStyle="rgba(25,24,22,.22)";
    ctx.beginPath();ctx.ellipse(depth,h*.56+postH,w*.43,9,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#3d3c39";
    ctx.fillRect(-w*.31,h*.5-2,8,postH+8);
    ctx.fillRect(w*.31-8,h*.5-2,8,postH+8);
    ctx.fillStyle="#77736b";
    ctx.fillRect(-w*.31+2,h*.5,2,postH+4);
    ctx.fillRect(w*.31-6,h*.5,2,postH+4);
  }

  // Offset side/bottom faces make the flat texture read as a chunky street object.
  ctx.fillStyle="#2b2a28";
  ctx.beginPath();
  ctx.moveTo(w/2,-h/2);ctx.lineTo(w/2+depth,-h/2+depth);
  ctx.lineTo(w/2+depth,h/2+depth);ctx.lineTo(w/2,h/2);ctx.closePath();ctx.fill();
  ctx.fillStyle="#363431";
  ctx.beginPath();
  ctx.moveTo(-w/2,h/2);ctx.lineTo(w/2,h/2);
  ctx.lineTo(w/2+depth,h/2+depth);ctx.lineTo(-w/2+depth,h/2+depth);ctx.closePath();ctx.fill();

  ctx.fillStyle="#171716";
  ctx.fillRect(-w/2-4,-h/2-4,w+8,h+8);
  if(img&&img.complete&&img.naturalWidth){
    ctx.imageSmoothingEnabled=true;
    ctx.drawImage(img,-w/2,-h/2,w,h);
  }else{
    // Keeps billboards identifiable during the first frame while textures decode.
    ctx.fillStyle="#d8cfbb";ctx.fillRect(-w/2,-h/2,w,h);
    ctx.fillStyle="#b63e2f";ctx.fillRect(-w/2,-h/2,w,h*.43);
    ctx.fillStyle="#171716";ctx.font="900 "+Math.max(13,Math.floor(w*.12))+"px Arial";
    ctx.textAlign="center";ctx.fillText("FAX",0,5);
    ctx.font="800 "+Math.max(7,Math.floor(w*.055))+"px Arial";ctx.fillText("2,75× SCHNELLER",0,22);
    ctx.textAlign="left";
  }
  ctx.strokeStyle="#c9c0ad";ctx.lineWidth=1.5;ctx.strokeRect(-w/2,-h/2,w,h);
  ctx.fillStyle="rgba(244,235,214,.7)";ctx.fillRect(-w*.2,-h/2-7,w*.4,3);

  if(wall){
    ctx.fillStyle="#bdb6a8";
    ctx.beginPath();ctx.arc(-w/2+7,-h/2+7,2,0,Math.PI*2);ctx.arc(w/2-7,-h/2+7,2,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

function drawMerkel(){
  var row=0;
  if(Math.abs(merkel.dirX)>Math.abs(merkel.dirY))row=merkel.dirX<0?1:2;
  else if(merkel.dirY<-.15)row=3;
  else if(merkel.dirY>.15)row=4;
  var frame=Math.floor(merkel.anim)%3;
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(merkelAsset.complete&&merkelAsset.naturalWidth){
    ctx.drawImage(merkelAsset,frame*128,row*128,128,128,merkel.x-22,merkel.y-42,44,56);
  }else{
    ctx.fillStyle="#356a9d";ctx.fillRect(merkel.x-9,merkel.y-13,18,28);
    ctx.fillStyle="#d0a567";ctx.beginPath();ctx.arc(merkel.x,merkel.y-22,10,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle="#1f1f1f";ctx.font="800 8px Arial";ctx.textAlign="center";
  ctx.fillText("ANGELA MERKEL",merkel.x,merkel.y+22);ctx.textAlign="left";ctx.restore();
}

function drawNPC(n){
  ctx.fillStyle="#55524d";ctx.fillRect(n.x-7,n.y-6,14,23);
  ctx.fillStyle="#c9c3b6";ctx.beginPath();ctx.arc(n.x,n.y-11,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#232323";ctx.font="700 8px Arial";ctx.fillText(n.name,n.x-25,n.y+32);
}

function drawPolice(p){
  ctx.fillStyle="#343b44";ctx.fillRect(p.x-8,p.y-7,16,25);
  ctx.fillStyle="#d5d0c4";ctx.beginPath();ctx.arc(p.x,p.y-12,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#262d37";ctx.fillRect(p.x-9,p.y-19,18,4);
  ctx.fillStyle="#eee";ctx.font="900 7px Arial";ctx.fillText("POL",p.x-7,p.y+8);
}

function drawPlayer(){
  ctx.save();ctx.translate(player.x,player.y);
  ctx.fillStyle="#252525";ctx.fillRect(-9,-8,18,27);
  ctx.fillStyle="#d4cbbb";ctx.beginPath();ctx.arc(0,-14,8,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#111";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(player.dirX*14,5+player.dirY*14);ctx.stroke();
  ctx.fillStyle="#e2ded2";ctx.font="900 8px Arial";ctx.fillText("SIE",-9,31);ctx.restore();
}

function drawPickups(){
  pickups.forEach(function(p){
    if(p.taken)return;
    if(p.type==="pfand"){
      ctx.fillStyle="#566153";ctx.fillRect(p.x-4,p.y-13,8,22);ctx.fillStyle="#ddd8ca";ctx.fillRect(p.x-2,p.y-16,4,4);
    }else{
      ctx.fillStyle=p.type==="currywurst"?"#7b5142":"#9a7653";
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-.35);ctx.fillRect(-15,-4,30,8);ctx.restore();
      if(p.type==="currywurst"){ctx.strokeStyle="#4f3028";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x-11,p.y-5);ctx.lineTo(p.x+10,p.y+4);ctx.stroke()}
    }
    ctx.fillStyle="#222";ctx.font="700 8px Arial";ctx.fillText(p.label,p.x-26,p.y+22);
  });
}

function drawStadtbildObjects(){
  stadtbildObjects.forEach(function(o){
    ctx.save();ctx.translate(o.x,o.y);
    ctx.strokeStyle=o.fixed?"#2e4b32":"#733d36";ctx.lineWidth=3;
    if(o.type==="bin"){ctx.fillStyle="#555a54";ctx.fillRect(-14,-18,28,36);ctx.strokeRect(-14,-18,28,36)}
    if(o.type==="chairs"){ctx.strokeRect(-22,-10,18,20);ctx.strokeRect(6,-10,18,20);ctx.beginPath();ctx.moveTo(-22,10);ctx.lineTo(-25,25);ctx.moveTo(-4,10);ctx.lineTo(0,25);ctx.moveTo(6,10);ctx.lineTo(3,25);ctx.moveTo(24,10);ctx.lineTo(28,25);ctx.stroke()}
    if(o.type==="hedge"){ctx.fillStyle="#50594b";ctx.fillRect(-32,-15,64,30);ctx.strokeRect(-32,-15,64,30)}
    ctx.fillStyle=o.fixed?"#2e4b32":"#5e2924";ctx.font="800 8px Arial";ctx.fillText(o.fixed?"NORMIERT":"! "+o.label,-42,42);ctx.restore();
  });
}

function drawPoliticalPoster(camX,camY){
  var x=1510,y=420,w=120,h=92;
  ctx.fillStyle="#ded9cd";ctx.fillRect(x,y,w,h);ctx.strokeStyle="#222";ctx.strokeRect(x,y,w,h);
  ctx.fillStyle="#777";ctx.beginPath();ctx.ellipse(x+60,y+34,21,26,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#4b4b4b";ctx.beginPath();ctx.moveTo(x+39,y+27);ctx.quadraticCurveTo(x+60,y+6,x+82,y+27);ctx.lineTo(x+75,y+19);ctx.lineTo(x+46,y+19);ctx.closePath();ctx.fill();
  ctx.fillStyle="#222";ctx.font="900 8px Arial";ctx.fillText("FRIEDRICH MERZ",x+28,y+70);ctx.font="7px Arial";ctx.fillText("SATIRISCHER AUSHANG",x+20,y+82);
}

function drawPrompts(){
  var near=null,nearD=1e9;
  buildings.forEach(function(b){var d=distance(player.x,player.y,b.doorX,b.doorY);if(d<nearD){nearD=d;near={x:b.doorX,y:b.doorY,text:"E · "+b.name}}});
  npcs.forEach(function(n){var d=distance(player.x,player.y,n.x,n.y);if(d<nearD){nearD=d;near={x:n.x,y:n.y,text:"E · BESCHWERDE ANHÖREN"}}});
  var md=distance(player.x,player.y,merkel.x,merkel.y);
  if(md<nearD){nearD=md;near={x:merkel.x,y:merkel.y,text:"E · MIT MERKEL SPRECHEN"}}
  stadtbildObjects.forEach(function(o){if(o.fixed)return;var d=distance(player.x,player.y,o.x,o.y);if(d<nearD){nearD=d;near={x:o.x,y:o.y,text:"E · AUSRICHTEN"}}});
  faxBillboards.forEach(function(b){
    if(b.mount!=="street")return;
    var by=billboardBaseY(b),d=distance(player.x,player.y,b.x,by);
    if(d<nearD){nearD=d;near={x:b.x,y:by,text:"E · FAXWERBUNG LESEN"}}
  });
  if(near&&nearD<80){
    ctx.fillStyle="rgba(235,231,220,.94)";ctx.fillRect(near.x-70,near.y-58,140,24);
    ctx.fillStyle="#111";ctx.font="800 9px Arial";ctx.textAlign="center";ctx.fillText(near.text,near.x,near.y-42);ctx.textAlign="left";
  }
}

function drawMinimap(){
  var mw=165,mh=105,x=innerWidth-mw-16,y=innerHeight-mh-42,sx=mw/W.w,sy=mh/W.h;
  ctx.save();ctx.globalAlpha=.92;ctx.fillStyle="#d7d3c7";ctx.fillRect(x,y,mw,mh);ctx.strokeStyle="#222";ctx.strokeRect(x,y,mw,mh);
  ctx.fillStyle="#5f5d59";roads.forEach(function(r){ctx.fillRect(x+r.x*sx,y+r.y*sy,r.w*sx,r.h*sy)});
  ctx.fillStyle="#666b60";ctx.fillRect(x+schreber.x*sx,y+schreber.y*sy,schreber.w*sx,schreber.h*sy);
  var m=missions[Math.min(state.mission,missions.length-1)],b=state.citizen?null:buildings.find(function(q){return q.id===m.target});
  if(b){ctx.fillStyle="#6f2924";ctx.fillRect(x+b.doorX*sx-3,y+b.doorY*sy-3,6,6)}
  ctx.fillStyle="#111";ctx.beginPath();ctx.arc(x+player.x*sx,y+player.y*sy,3,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function draw(){
  var viewW=innerWidth,viewH=innerHeight;
  var camX=clamp(player.x-viewW/2,0,Math.max(0,W.w-viewW));
  var camY=clamp(player.y-viewH/2,0,Math.max(0,W.h-viewH));
  ctx.clearRect(0,0,viewW,viewH);
  ctx.save();ctx.translate(-camX,-camY);drawWorld();drawPoliticalPoster();ctx.restore();
  drawMinimap();
}

var last=performance.now();
function loop(now){
  var dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function keyDown(e){
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();
  if((e.code==="KeyP"||e.code==="Escape")&&!e.repeat){togglePause();return}
  keys[e.code]=true;
  if(e.repeat)return;
  if(e.code==="KeyE")interact();
  if(e.code==="KeyX")badIdea();
}
function keyUp(e){keys[e.code]=false}
addEventListener("keydown",keyDown);addEventListener("keyup",keyUp);

document.querySelectorAll(".touch button").forEach(function(btn){
  var code=btn.dataset.key;
  function down(ev){ev.preventDefault();keys[code]=true;if(code==="KeyE")interact();if(code==="KeyX")badIdea()}
  function up(ev){ev.preventDefault();keys[code]=false}
  btn.addEventListener("pointerdown",down);btn.addEventListener("pointerup",up);btn.addEventListener("pointercancel",up);btn.addEventListener("pointerleave",up);
});

function beginGame(saved){
  document.getElementById("start-screen").hidden=true;
  state.started=true;state.modal=false;state.paused=false;
  if(saved&&applySave(saved)){
    updateHUD();toast(state.citizen?"ABGESCHLOSSENER VORGANG WIEDERHERGESTELLT":"AKTE WIEDERHERGESTELLT · VORGANG "+(state.mission+1));
  }else{
    clearSave();
    openDialogue("WILLKOMMEN IN DEUTSCHLAND",[
      "Ihr Ziel: Werden Sie innerhalb von drei völlig fiktiven Behördentagen deutscher Staatsbürger.",
      "Dazu benötigen Sie vor allem Formulare. Sehr viele Formulare.",
      "Hinweis: Wenn Sie im Schrebergarten den Rasen betreten, kommt die Polizei sofort. Das ist eine Spielregel, kein Rechtsrat.",
      "Bratwurst, Currywurst und Brezeln stellen Energie wieder her. Pfandflaschen sind die verlässlichste Währung im Spiel."
    ],"DE",function(){saveGame();toast("ERSTER VORGANG: BÜRGERAMT")});
  }
}
function pauseGame(){
  if(!state.started||state.modal||state.paused)return;
  keys=Object.create(null);state.paused=true;state.modal=true;saveGame();
  document.getElementById("pause-screen").hidden=false;
  document.getElementById("resume-button").focus();
}
function resumeGame(){
  if(!state.paused)return;
  document.getElementById("pause-screen").hidden=true;state.paused=false;state.modal=false;last=performance.now();
}
function togglePause(){if(state.paused)resumeGame();else pauseGame()}
function restartGame(){clearSave();location.reload()}

var pendingSave=readSave();
var continueButton=document.getElementById("start-continue");
continueButton.hidden=!pendingSave;
document.getElementById("start-new").addEventListener("click",function(){beginGame(null)});
continueButton.addEventListener("click",function(){beginGame(pendingSave)});
document.getElementById("pause-button").addEventListener("click",pauseGame);
document.getElementById("resume-button").addEventListener("click",resumeGame);
document.getElementById("restart-button").addEventListener("click",restartGame);
document.addEventListener("visibilitychange",function(){if(document.hidden)pauseGame()});
addEventListener("pagehide",saveGame);
updateHUD();
document.getElementById(pendingSave?"start-continue":"start-new").focus();
})();
