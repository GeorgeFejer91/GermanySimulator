// Frozen pre-reactive routing control, extracted verbatim from game.js SHA256
// b31e0dddc5709c284e0a2df94f71075aaa514c2740ec13703e86d62014c57b1f.
// Only five data declarations and five routing functions; never loaded by the game.

const jaywalkerBarks={
 berlin:["Think of the rules! Der Zebrastreifen ist literally right there!","Think of the Kinder! So überquert man keine Straße!","Schande! You ignored die amtlich weißen stripes!","Hast du Tomaten auf den Augen?! Use the official crossing!","Unfassbar! Erst schauen, then formgerecht queren!","Verkehrsrowdy! This crossing was not approved by anybody!"],
 germany:["Denken Sie an die Regeln! Der Zebrastreifen ist gleich dort!","Denken Sie an die Kinder! So überquert man keine Straße!","Schande! Sie haben die amtlich markierten Streifen missachtet!","Haben Sie Tomaten auf den Augen?! Benutzen Sie den offiziellen Überweg!","Unfassbar! Erst schauen, dann formgerecht queren!","Verkehrsrowdy! Diese Querung war von niemandem genehmigt!"]
};

const pedestrianBarks={
 berlin:{
  sidewalk:["HALT! You are standing im normierten Gehwegprofil!","Stop! Sie blockieren den Durchgang according to my interpretation!","Sie sind im way. I was hier first, administratively speaking!","Hast du schon Kehrwoche gemacht? Then respect die Gehordnung!","Das Leben ist kein Ponyhof. Move aus meiner Lauflinie!","Hast du tomatoes on den Augen? This is clearly mein Gehweg!"],
  grass:["HALT! Off the grass! Runter vom Rasen, immediately!","STOP! Der Rasen is for looking, not for walking!","Haben Sie eine Halmbetretungserlaubnis? Of course not!","Jetzt haben wir den Salat, and Sie stehen mitten im Grünbereich!"],
  road:["HALT! Off the street! Runter von der Fahrbahn!","STOP! The Zebrastreifen is literally right there!","Verkehrsrowdy! Your Querungswinkel is completely unapproved!","Hast du tomatoes on den Augen? Weg von der Straße!"]
 },
 germany:{
  sidewalk:["HALT! Sie stehen im normierten Gehwegprofil!","STOPP! Sie blockieren den Durchgang nach meiner Auslegung!","Sie sind im Weg. Ich war verwaltungsrechtlich zuerst hier!","Hast du schon Kehrwoche gemacht? Dann kennen Sie doch die Gehwegordnung!","Das Leben ist kein Ponyhof. Verlassen Sie meine Lauflinie!","Haben Sie Tomaten auf den Augen? Das ist eindeutig mein Gehweg!",speechClip("thorsten-angry-nicht-weg"),speechClip("thorsten-angry-duemmer"),speechClip("thorsten-angry-klappt-nicht"),{...speechClip("thorsten-sleepy-nichts-geschafft"),urgent:false}],
  grass:["HALT! Runter vom Rasen!","STOPP! Der Rasen ist anzusehen, nicht zu betreten!","Haben Sie eine Halmbetretungserlaubnis? Natürlich nicht!","Jetzt haben wir den Salat, und Sie stehen mitten in der Grünfläche!"],
  road:["HALT! Runter von der Fahrbahn!","STOPP! Der Zebrastreifen ist gleich dort!","Verkehrsrowdy! Ihr Querungswinkel ist vollständig ungenehmigt!","Haben Sie Tomaten auf den Augen? Weg von der Straße!"]
 }
};

const crowdArchetypes=Object.freeze([
 {id:"towel-man",fullName:"Günther Liegestuhl",voiceId:"tourist-guenther-liegestuhl",sprite:"towelMan",label:"LIEGENRESERVIERER",barks:{berlin:["Dieser Platz ist seit 07:04 durch textile Willenserklärung reserved.","Please Abstand halten: Das Handtuch befindet sich im Vorverfahren."],germany:["Dieser Platz ist seit 07:04 Uhr durch textile Willenserklärung reserviert.","Bitte Abstand halten: Das Handtuch befindet sich im Vorverfahren."]}},
 {id:"towel-woman",fullName:"Walburga Handtuch",voiceId:"touristin-walburga-handtuch",sprite:"towelWoman",label:"HANDTUCHHOHEIT",barks:{berlin:["Die Liege ist not frei; die Reservierung trocknet nur kurz.","Your Schatten fällt in meinen amtlich vorgemerkten Sonnenkorridor."],germany:["Die Liege ist nicht frei; die Reservierung trocknet nur kurz.","Ihr Schatten fällt in meinen amtlich vorgemerkten Sonnenkorridor."]}}
]);

const crowdCharacterBarks=Object.freeze({
 "crowd-baerbel-brezel":Object.freeze({berlin:Object.freeze(["Die Brezel ist rund; your Anspruch braucht trotzdem ein Formular mit Ecken.","Salz ist nur nach Antrag zuständig; please reichen Sie die Krümel geordnet ein."]),germany:Object.freeze(["Die Brezel ist rund; Ihr Anspruch braucht trotzdem ein Formular mit Ecken.","Salz ist nur nach Antrag zuständig; bitte reichen Sie die Krümel geordnet ein."])}),
 "crowd-brigitte-bueroklammer":Object.freeze({berlin:Object.freeze(["Die Büroklammer hält den Vorgang, not Ihre Schlange; bitte ziehen Sie eine Nummer.","Ich habe Ihre Unterlagen geheftet; the loose page needs einen eigenen Antrag."]),germany:Object.freeze(["Die Büroklammer hält den Vorgang, nicht Ihre Schlange; bitte ziehen Sie eine Nummer.","Ich habe Ihre Unterlagen geheftet; das lose Blatt braucht einen eigenen Antrag."])}),
 "crowd-elfriede-eingabe":Object.freeze({berlin:Object.freeze(["Ihre Eingabe ist gespeichert, but the button says noch nicht wirksam.","Bitte bestätigen Sie den Klick schriftlich; the Screenshot braucht einen Eingangsstempel."]),germany:Object.freeze(["Ihre Eingabe ist gespeichert, aber die Schaltfläche erklärt sie noch nicht für wirksam.","Bitte bestätigen Sie den Klick schriftlich; der Screenshot braucht einen Eingangsstempel."])}),
 "crowd-guenther-gartenzaun":Object.freeze({berlin:Object.freeze(["Der Zaun endet hier; your Schuhwerk needs eine schriftliche Grenzübertrittserlaubnis.","Ich habe den Grenzverlauf notiert. Your Schatten wartet bitte auf Genehmigung."]),germany:Object.freeze(["Der Zaun endet hier; für Ihren Schuh gibt es keine schriftliche Grenzübertrittserlaubnis.","Ich habe den Grenzverlauf notiert. Ihr Schatten wartet bitte auf Genehmigung."])}),
 "crowd-hildegard-brotzeit":Object.freeze({berlin:Object.freeze(["Die Brotzeit beginnt erst nach der Pausenmarke; the Brezel is zur Aktenlage.","Der Senf ist beantragt, not bewilligt; bitte warten Sie neben der Serviette."]),germany:Object.freeze(["Die Brotzeit beginnt erst nach der Pausenmarke; die Brezel liegt hier nur zur Aktenlage.","Der Senf ist beantragt, nicht bewilligt; bitte warten Sie neben der Serviette."])}),
 "crowd-irmgard-aktenordner":Object.freeze({berlin:Object.freeze(["Der Aktenordner ist alphabetisch; your Anliegen kommt erst nach Register Z.","Bitte legen Sie den Nachweis in dreifacher Ausfertigung vor; the Rücken ist not a mailbox."]),germany:Object.freeze(["Der Aktenordner ist alphabetisch; Ihr Anliegen kommt erst nach Register Z.","Bitte legen Sie den Nachweis in dreifacher Ausfertigung vor; der Rücken ist kein Briefkasten."])}),
 "crowd-klaus-dieter-knoedel":Object.freeze({berlin:Object.freeze(["Der Knödel steht auf Formblatt K 7; even die Soße braucht einen Stempel.","Bitte reichen Sie den Teller as Nachweis ein; ohne Antrag bleibt der Knödel im Vorverfahren."]),germany:Object.freeze(["Der Knödel darf erst nach Formular K 7 auf den Teller; die Soße braucht einen Eingangsstempel.","Bitte reichen Sie den Teller als Nachweis ein; ohne Antrag bleibt der Knödel im Vorverfahren."])}),
 "crowd-manfred-mittagsruhe":Object.freeze({berlin:Object.freeze(["Die Mittagsruhe läuft bis drei; even Ihr Flüstern needs einen Termin.","Bitte stellen Sie die Bohrmaschine auf lautlos; the Formular war lauter als Sie."]),germany:Object.freeze(["Die Mittagsruhe dauert bis drei; auch Ihr Flüstern braucht einen Termin.","Bitte stellen Sie die Bohrmaschine auf lautlos; das Formular war lauter als Sie."])}),
 "crowd-ruediger-rasenkante":Object.freeze({berlin:Object.freeze(["Die Rasenkante ist not an invitation; your Schuh steht im Zuständigkeitsbereich.","Ein Halm liegt quer. Bitte melden Sie den Vorfall with Lageplan und Maßstab."]),germany:Object.freeze(["Die Rasenkante ist keine Einladung; Ihr Schuh steht im Zuständigkeitsbereich.","Ein Halm liegt quer. Bitte melden Sie den Vorfall mit Lageplan und Maßstab."])})
});

const crowdArchetypeById=Object.fromEntries(crowdArchetypes.map(archetype=>[archetype.id,archetype]));

function nextVariant(pool,values){let state=stimulusBags.get(pool);if(!state||state.values!==values||!state.bag.length){const bag=values.slice();for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}if(state?.last!==undefined&&bag.length>1&&bag.at(-1)===state.last)[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];state={values,bag,last:state?.last};stimulusBags.set(pool,state)}state.last=state.bag.pop();return state.last}

function jaywalkerBark(){if(hasStimulusFamily("jaywalker"))return;const person=nearestPedestrian();if(!person||person.arrested||person.wisdomId)return;const region=state.region,lines=jaywalkerBarks[region]||jaywalkerBarks.germany;showWorldBark(person.name,nextVariant("jaywalker:"+region,lines),true,"","",{family:"jaywalker",candidateVoiceId:person.voiceId,actor:person,priority:STIMULUS_PRIORITY.REACTIVE,ambient:true,isEligible:()=>state.started&&!state.modal&&!state.gameOver&&state.region===region&&playerSurface()==="road"&&!person.arrested&&!person.lawPending&&npcs.includes(person)&&dist(player.x,player.y,person.x,person.y)<360})}

function pedestrianBark(n,surface="sidewalk"){
 if(n?.jwdRole)return false;
 if(n?.wisdomId)return announceCurrentRule(n);
 const now=performance.now();if(!n||now<(n.barkAt||0)||(pedestrianBark.last&&now-pedestrianBark.last<3200))return false;
 const region=state.region,archetype=crowdArchetypeById[n.archetype],personalizedLines=surface==="sidewalk"&&archetype?crowdCharacterBarks[n.voiceId]?.[region]:null,lines=personalizedLines|| (surface==="sidewalk"&&archetype?archetype.barks[region]:pedestrianBarks[region][surface]),family=archetype?`pedestrian:${archetype.id}:${region}:${surface}`:`pedestrian:${region}:${surface}`,variantPool=personalizedLines?`pedestrian-personalized:${n.voiceId}:${region}:${surface}`:family,line=nextVariant(variantPool,lines),item=typeof line==="string"?{text:line}:line;n.barkAt=now+5600+Math.random()*2600;pedestrianBark.last=now;showWorldBark(n.name,item.text,item.urgent!==false,item.voiceId===n.voiceId?item.recording||"":"","",{family,candidateVoiceId:n.voiceId,actor:n,priority:STIMULUS_PRIORITY.REACTIVE,ambient:true,isEligible:()=>state.started&&!state.modal&&!state.gameOver&&state.region===region&&dist(player.x,player.y,n.x,n.y)<Math.max(140,(n.audioRadius||NPC_COMPLAINT_DISTANCE)+48)});return true
}

function nearestPedestrian(maxDistance=360){let nearest=null,best=maxDistance;for(const n of npcs){if(n.special)continue;const d=dist(player.x,player.y,n.x,n.y);if(d<best){nearest=n;best=d}}return nearest}

function surfaceComplaint(surface){const n=nearestPedestrian();if(!pedestrianBark(n,surface)&&surface==="road")jaywalkerBark()}
