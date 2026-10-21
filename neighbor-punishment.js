(function(){
'use strict';
const sources={
 trash:'https://www.reddit.com/r/germany/comments/1ae3cg2/',
 sunday:'https://www.reddit.com/r/germany/comments/1g2oabh/',
 laundry:'https://www.reddit.com/r/germany/comments/12id45u/',
 sweeping:'https://www.reddit.com/r/Ratschlag/comments/1ncr6mo/',
 watering:'https://www.reddit.com/r/wohnen/comments/vy5r6m/',
 windows:'https://www.reddit.com/r/wohnen/comments/1hrzgqr/',
 grill:'https://www.reddit.com/r/NachbarnAusDerHoelle/comments/1qbq6x8/',
 parking:'https://www.reddit.com/r/BinIchDasArschloch/comments/1pq5677/',
 packages:'https://www.reddit.com/r/germany/comments/1bguk4j/',
 greeting:'https://www.reddit.com/r/wohnen/comments/1df26ma/',
 hedge:'https://www.reddit.com/r/wohnen/comments/1od7h3y/',
 blinds:'https://www.reddit.com/r/wohnen/comments/1sqkdr9/',
 recycling:'https://www.reddit.com/r/germany/comments/tioalr/',
 flowers:'https://www.reddit.com/r/germany/comments/1bqmcgx/',
 cardboard:'https://www.reddit.com/r/germany/comments/1gyn9b7/',
 keyboard:'https://www.reddit.com/r/germany/comments/1vw2adz/',
 group:'https://www.reddit.com/r/NachbarnAusDerHoelle/comments/1tu2xz2/',
 shoes:'https://www.reddit.com/r/germany/comments/t13rjl/'
};
const people={
 heiko:{role:'parent',actorId:'jwd-parent',voiceId:'jwd-heiko-maaslos',speaker:'Heiko Maaslos',gesture:'lecture'},
 inga:{role:'watcher',actorId:'jwd-watcher',voiceId:'jwd-inga-maaslos',speaker:'Inga Maaslos',gesture:'clipboard'},
 schwabingen:{role:'swabian',actorId:'jwd-swabian',voiceId:'jwd-frau-schwabingen',speaker:'Frau Schwabingen',gesture:'sweep'}
};
const authored=[
 ['heiko','01','Heckenschnitt nach Mondkalender','Hedge trimming by the lunar calendar',['hedge'],
  'Schön, dass Sie da sind. Ihre Hecke, also, die machen Sie am Wochenende ein bisschen zurück. Aber nicht ganz weg, wir brauchen den Sichtschutz. Ich sage Ihnen das nur, damit Sie hinterher keinen Ärger haben. Den Mondkalender lege ich Ihnen nachher hin. Unter Nachbarn stimmt man sich ja ab.',
  'Lovely that you are here. Your hedge, well, you will trim it back a little at the weekend. But do not remove it completely; we need the privacy screen. I am only telling you so you will not have trouble afterwards. I will leave you the lunar calendar later. Neighbors coordinate these things, of course.'],
 ['heiko','02','Der öffentliche Privatparkplatz','The public private parking space',['parking'],
  'Ich wollte nur kurz wegen Ihrem Auto. Der Platz ist natürlich öffentlich, also, das weiß ich auch. Nur steht unseres normalerweise dort. Wenn Sie Ihres gelegentlich bewegen, finden Sie leichter wieder Anschluss hier. Ich sage das ja für Sie. Sonst denkt noch jemand, Sie würden hier einfach wohnen, ohne sich abzustimmen.',
  'I only wanted a quick word about your car. The space is public, of course; well, I know that too. Only ours normally stands there. If you move yours occasionally, you will find it easier to fit in here again. I am saying this for your sake. Otherwise someone might think you simply live here without coordinating.'],
 ['heiko','03','Einbruchprävention durch Aussicht','Burglary prevention through a clear view',[],
  'Ach, Ihre Rollläden sind noch unten. Machen Sie die bitte hoch. Dann sieht ein Einbrecher gleich, dass bei Ihnen nichts zu holen ist. Sonst geht der rein, ist enttäuscht und versucht es anschließend bei uns. Ich möchte Ihnen nur ersparen, dass Sie sich hinterher irgendwie verantwortlich fühlen. Sie verstehen das ja.',
  'Oh, your shutters are still down. Please raise them. Then a burglar can see immediately that there is nothing worth taking at your place. Otherwise he goes inside, gets disappointed and tries ours afterwards. I only want to spare you feeling somehow responsible later. You understand, of course.'],
 ['heiko','04','Das genehmigte Lüftungsfenster','The approved airing window',['windows'],
  'Ich wollte nur kurz, also, das Fenster im Flur. Offen ist schlecht wegen der Wärme, geschlossen natürlich auch wegen der Luft. Ich habe Ihnen deshalb zwei Zeiten aufgeschrieben. Dann müssen Sie nicht ständig selber überlegen. Wenn Sie die einhalten, haben wir alle weniger Diskussionen. Das ist doch eigentlich auch für Sie angenehmer.',
  'I only wanted a quick word, well, about the hallway window. Open is bad because of the heat, closed is obviously bad because of the air. So I have written down two times for you. Then you will not constantly have to think for yourself. If you stick to them, we will all have fewer discussions. That is surely more pleasant for you too.'],
 ['heiko','05','Der Gruß muss ankommen','The greeting must register',['greeting'],
  'Ach, ich hatte Sie gestern gegrüßt. Sie haben zwar genickt, aber ich konnte nicht erkennen, ob das mir galt oder Ihrem Telefon. Sagen Sie künftig einfach hörbar guten Morgen. Dann wissen wir beide, dass alles in Ordnung ist. Ich helfe Ihnen da nur ein bisschen rein. Man kennt das ja, am Anfang.',
  'Oh, I greeted you yesterday. You did nod, but I could not tell whether that was meant for me or your phone. In future just say good morning audibly. Then we both know everything is all right. I am only helping you settle in a little. You know how it is, at the beginning.'],
 ['heiko','06','Karton in Normgröße','Cardboard in standard sizes',['cardboard'],
  'Die Kartons unten, ich wollte nur helfen. Gefaltet ist natürlich schon gut, aber jeder faltet anders, und dann passt hinterher nichts zusammen. Schneiden Sie Ihre bitte auf die Größe von meinen. Ich habe Ihnen ein Muster neben die Tonne gelegt. Dann brauchen Sie nicht zu messen. Das versteht sich doch von selbst.',
  'The cardboard downstairs, I only wanted to help. Folded is a good start, of course, but everyone folds differently and then nothing fits together afterwards. Please cut yours to the same size as mine. I have left a template beside the bin for you. Then you will not need to measure. That goes without saying, surely.'],
 ['heiko','07','Die leise Tastatur','The quiet keyboard',['keyboard'],
  'Ach, Sie arbeiten abends noch am Rechner. Das verstehe ich ja, ich arbeite schließlich auch. Nur dieses Tippen, also, da hört man immer, dass Sie noch nicht fertig sind. Vielleicht schreiben Sie die längeren Wörter tagsüber. Ich sage Ihnen das lieber gleich, dann entsteht hier gar nicht erst eine unangenehme Stimmung zwischen uns.',
  'Oh, you are still working at your computer in the evenings. I understand, of course; after all, I work too. Only this typing, well, you can always hear that you are not finished yet. Perhaps write the longer words during the day. I would rather tell you now, so an unpleasant atmosphere never develops between us.'],
 ['heiko','08','Die Müllbeutelbeweisführung','The garbage bag evidence',['trash'],
  'Ich wollte Ihnen nur sagen, da war wieder etwas Falsches in der Papiertonne. Ich behaupte nicht, dass Sie das waren. Wenn Sie künftig durchsichtige Beutel nehmen, können wir das gleich ausschließen. Das wäre ja auch in Ihrem Interesse. Ich möchte wirklich nicht, dass hier jemand einen falschen Eindruck von Ihnen bekommt.',
  'I only wanted to tell you there was something wrong in the paper bin again. I am not claiming it was you. If you use transparent bags in future, we can rule that out immediately. That would be in your interest too, of course. I really do not want anyone here getting the wrong impression of you.'],
 ['inga','01','Willkommen im Paketdienst','Welcome to parcel duty',['packages'],
  'So schön, dass du wieder da bist! Wir haben dich gleich als Paketpatin eingeplant. Das ist eine tolle Chance, dich hier einzubringen. Heiko bestellt nur Kleinigkeiten, meistens mehrere. Deine freie Zeit am Vormittag habe ich schon als offene Zusage notiert. Falls du wegmusst, organisierst du einfach selbst eine Vertretung. Willkommen im Team!',
  'So lovely that you are back! We have already scheduled you as our parcel sponsor. It is a wonderful opportunity to contribute here. Heiko only orders little things, usually several. I have already recorded your free mornings as an open agreement. If you need to go out, simply arrange your own replacement. Welcome to the team!'],
 ['inga','02','Wäsche mit Außenwirkung','Laundry with external impact',['laundry'],
  'Ganz kurzes Feedback zu deinem Wäscheständer! Sonntags senden Unterhosen im Garten ein etwas schwieriges Signal. Niemand möchte dir etwas verbieten, wir wünschen uns nur ein stimmiges Gesamtbild. Für heute habe ich deine Wäsche deshalb als internes Thema eingeordnet. Du hängst sie einfach drinnen auf, und draußen können wir wieder gemeinsam entspannt sein.',
  'Just a very quick piece of feedback about your drying rack! Underpants in the garden on Sundays send a slightly difficult signal. Nobody wants to prohibit anything; we just want a coherent overall appearance. So for today I have classified your laundry as an internal matter. Simply hang it indoors, and outside we can all relax together again.'],
 ['inga','03','Rollladen als Straßenimage','Shutters as the street image',['blinds'],
  'Toll, dass wir dich erwischen! Deine geschlossenen Rollläden wirken tagsüber ein bisschen wie Rückzug aus der Gemeinschaft. Wir wollen hier ja Offenheit leben. Ich habe deshalb eine kleine Morgenroutine für dich vorbereitet: hochziehen, lächeln, sichtbar sein. Das macht sofort einen ganz anderen Eindruck. Ausschlafen kannst du ja auch mit einem positiven Mindset.',
  'Wonderful that we caught you! Your closed shutters look a little like withdrawing from the community during the day. We want to practice openness here. So I have prepared a little morning routine for you: raise them, smile, be visible. It immediately creates a very different impression. You can sleep in with a positive mindset too.'],
 ['inga','04','Grillen nach Geruchskalender','Grilling by the smell calendar',['grill'],
  'Wir müssen dein Grillthema einmal positiv aufsetzen. Elektrisch ist schon ein guter Anfang, aber der Geruch braucht einen gemeinsamen Rahmen. Ich habe dich dienstags zwischen zwei Gesprächen eingeplant. Bitte schick vorher kurz durch, was es gibt. Dann können wir unsere Fenster passend managen. Das ist keine Kontrolle, sondern gelebte Nachbarschaft auf Augenhöhe.',
  'We need to put your grilling topic on a positive footing. Electric is a good start, but the smell needs a shared framework. I have scheduled you on Tuesdays between two meetings. Please send a quick message beforehand saying what you are cooking. Then we can manage our windows accordingly. It is not control, but neighborliness practiced as equals.'],
 ['inga','05','Der gemeinsame Gießprozess','The shared watering process',['watering'],
  'Eine kleine Lernchance zu deinen Balkonpflanzen! Dein Gießwasser erreicht gelegentlich unsere Markise. Wir haben deshalb einen gemeinsamen Prozess entwickelt: Du fragst, ich bestätige, dann gießt du. Wenn ich nicht antworte, wartest du einfach. Die Pflanzen lernen dadurch auch Resilienz. Ich finde es schön, wie offen du dich gerade auf diese neue Verantwortung einlässt.',
  'A little learning opportunity about your balcony plants! Your watering water occasionally reaches our awning. So we have developed a shared process: you ask, I confirm, then you water. If I do not reply, simply wait. That teaches the plants resilience too. I love how openly you are embracing this new responsibility right now.'],
 ['inga','06','Schweigen als Anmeldung','Silence counts as signing up',['group'],
  'Schön, dass du wieder erreichbar bist! In unserer Nachbarschaftsgruppe fehlt noch dein aktives Hallo. Du hast nichts gegen den Gemeinschaftssamstag geschrieben, also habe ich dich für die Organisation eingetragen. Das ist wirklich eine schöne Sichtbarkeitschance. Deine Rückmeldung kannst du direkt mit dem fertigen Ablauf verbinden. Dann sparen wir uns eine unnötige Abstimmungsschleife.',
  'Lovely that you are reachable again! We are still missing your active hello in our neighborhood group. You did not write anything against Community Saturday, so I signed you up to organize it. It really is a wonderful visibility opportunity. You can combine your reply with the completed schedule. Then we save ourselves an unnecessary round of coordination.'],
 ['inga','07','Sonntagsblumen ohne Arbeit','Sunday flowers without work',['flowers'],
  'Dein Blumenbeet hat wirklich Potenzial! Nur sonntags darin zu arbeiten, das macht unsere gemeinsame Erholung ein bisschen unruhig. Wir schlagen vor, dass die Blumen sonntags einfach fertig sind. Ich habe dir dafür den Samstag als persönliche Entwicklungszeit freigehalten. Da kannst du dich ganz auf unser Straßenbild konzentrieren. Wie schön, dass du das mitträgst!',
  'Your flower bed really has potential! Only working in it on Sundays makes our shared relaxation a little unsettled. We suggest that the flowers simply be finished on Sundays. I have kept Saturday free for you as personal development time. Then you can concentrate entirely on our street scene. How lovely that you are supporting this!'],
 ['inga','08','Das freiwillige Gemeinschaftsfoto','The voluntary community photo',[],
  'Bevor du losgehst, noch ein kleines Gemeinschaftsthema! Auf dem Straßenfoto steht dein leerer Gartenstuhl. Das wirkt wie fehlendes Engagement, und das bist du doch gar nicht. Wir machen das Bild deshalb morgen noch einmal. Ich habe dich schon zwischen Heiko und die Tonne gesetzt. Natürlich freiwillig. Wir zählen einfach fest auf dich.',
  'Before you go, one little community topic! Your garden chair is empty in the street photograph. That looks like a lack of engagement, and that is not you at all. So we are taking the picture again tomorrow. I have already placed you between Heiko and the bin. Voluntarily, of course. We are simply firmly counting on you.'],
 ['schwabingen','01','Ein Fussel ist kein Abschluss','One speck of lint means unfinished',['sweeping'],
  'So, Sie bleibet jetzt erscht emol do. Auf der Trepp isch ein Fussel gwäsa. Ein ganzer! Sie könnet net einfach sagen, Sie hättet gkehrt, wenn der Beweis noch rumliegt. I hab den aufgehoba, falls Sie wieder diskutiere wollet. Jetzt zeig i Ihnen, wie mer sauber macht. Danach dürfet Sie gern wieder Freizeit habe.',
  'Right, you are staying here for a moment first. There was a speck of lint on the stairs. A whole one! You cannot simply say you swept when the evidence is still lying around. I picked it up in case you want to argue again. Now I will show you how to clean. Afterwards you may enjoy your leisure again.'],
 ['schwabingen','02','Zu früh ist auch nicht pünktlich','Too early is not punctual either',['sweeping'],
  'Sie hend am Donnerstag gkehrt. Des hab i gseha. Kehrwoche isch aber am Samstag, net irgendwann, wenn es Ihnen grad passt. Am Samstag war dann alles schon sauber, und keiner hat gseha, dass Sie was schaffet. So funktioniert des net. I schaff schließlich au sichtbar. Nächschte Woche machen Sie es zur richtigen Zeit.',
  'You swept on Thursday. I saw that. But sweeping week is on Saturday, not whenever it happens to suit you. By Saturday everything was already clean, and nobody saw you doing any work. That is not how it works. After all, I do my work visibly too. Next week you will do it at the proper time.'],
 ['schwabingen','03','Die Tonne hat einen Deckel','The bin has a lid',['trash'],
  'Die Papiertonne war net richtig zu. So ein Spalt war da. I hab meinen Finger reinghalte, nur zum Prüfen. Des muss bündig sei, sonscht sieht die ganze Straße aus wie nach einem Umzug. Sie drücket Ihre Kartons noch emol runter. I wart hier. Wenn i schon kontrollier, dann können Sie au ordentlich mitmache.',
  'The paper bin was not closed properly. There was a gap like this. I put my finger in, just to check. It has to sit flush, otherwise the whole street looks as though someone just moved. You will press your cardboard down again. I will wait here. If I am already inspecting, you can at least take part properly.'],
 ['schwabingen','04','Papier hat auch Sonntag','Paper has Sundays too',['recycling'],
  'Sie sind gestern mit Altpapier an mir vorbei. Am Sonntag! Des Papier selber mag leise sei, aber der Deckel macht klapp, und dann weiß jeder, dass hier jemand schafft. I will am Sonntag net ans Schaffe erinnert werde. Sie sammeln des bis Montag. I hab Ihnen extra Platz in Ihrem Keller vorgeschlage.',
  'You walked past me with waste paper yesterday. On a Sunday! The paper itself may be quiet, but the lid goes clack, and then everyone knows somebody is working here. I do not want to be reminded of work on Sundays. You will collect it until Monday. I specifically suggested space in your cellar for you.'],
 ['schwabingen','05','Der Sonntagsstaubsauger','The Sunday vacuum cleaner',['sunday'],
  'I hab den Staubsauger ghört. Ganz genau nach dem Kaffee. Sie könnet net am Sonntag sauber mache und damit allen andern den Sonntag schmutzig mache. Sauber muss es vorher sei. I sag des net zum Spaß. Mein Wohnzimmer isch seit Samstag fertig, und jetzt muss i Ihretwegen wieder an Hausarbeit denke. Des geht net.',
  'I heard the vacuum cleaner. Right after coffee. You cannot clean on Sunday and spoil everybody else’s Sunday by doing it. It has to be clean beforehand. I am not saying this for fun. My living room has been finished since Saturday, and now because of you I have to think about housework again. That will not do.'],
 ['schwabingen','06','Schuhe in Blickrichtung','Shoes facing the right way',['shoes'],
  'Ihre Schuhe stehet wieder kreuz und quer. Net im Weg, des sag i gar net. Aber wenn i vorbeilauf, seh i die Sohlen, und dann seh i den Dreck. Drehet die Spitzen zur Wand, wie bei mir. Ordnung kostet nix. Außer meine Zeit, weil i Ihnen des jetzt schon wieder erklären muss.',
  'Your shoes are all over the place again. Not in the way; I am not saying that. But when I walk past, I see the soles, and then I see the dirt. Turn the toes towards the wall, like mine. Order costs nothing. Except my time, because I have to explain this to you yet again.'],
 ['schwabingen','07','Die Fußmatte als Visitenkarte','The doormat as a calling card',[],
  'Die Fußmatte vor Ihrer Tür liegt schief. I hab es zuerst mit Augenmaß versucht, dann mit der Zeitungskante. Des sind zwei verschiedene Richtungen, und keine passt zum Flur. Sie richten die jetzt ordentlich aus. I hab meine eigene schon dreimal gemacht heut. Wenn mer hier wohnt, repräsentiert mer schließlich au ein bisschen mich.',
  'The doormat outside your door is crooked. I first tried judging it by eye, then with the edge of the newspaper. Those are two different directions, and neither fits the hallway. You will straighten it properly now. I have already done my own three times today. If you live here, after all, you represent me a little too.'],
 ['schwabingen','08','Der tote Baum bleibt lebendig','The dead tree stays alive',['blinds'],
  'An den Baumstumpf kommt kein Vogelhaus. Der war schon do, bevor Sie überhaupt Ihren Schlüssel ghabt hend. Bloß weil keine Äste mehr dran sind, isch des noch lang kein Anlass für neue Ideen. I hab den jahrelang angeguckt. Sie lassen den jetzt ordentlich leer. I gewöhn mich net in meinem Alter an Ihr Bastelprojekt.',
  'No birdhouse is going on that tree stump. It was here before you even had your key. Just because it has no branches left is certainly no reason for new ideas. I have looked at it for years. You will leave it properly empty now. At my age I am not getting used to your craft project.']
];
const stories=Object.freeze(authored.map(([person,number,deTitle,enTitle,topics,de,en])=>{
 const owner=people[person],id=`punishment-${person}-${number}`;
 return Object.freeze({id,...owner,title:Object.freeze({de:deTitle,en:enTitle}),sourceTopics:Object.freeze(topics),sources:Object.freeze(topics.map(topic=>sources[topic])),lines:Object.freeze([Object.freeze({id,voiceId:owner.voiceId,speaker:owner.speaker,de,en})])});
}));
function createSelector(random=Math.random){
 const roles=Object.keys(people).map(person=>people[person].role),bags=new Map();let roleBag=[],previousRole=null;
 function shuffle(rows){for(let i=rows.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[rows[i],rows[j]]=[rows[j],rows[i]];}return rows;}
 return Object.freeze({next(){
  if(!roleBag.length){roleBag=shuffle([...roles]);if(roleBag[roleBag.length-1]===previousRole)[roleBag[0],roleBag[roleBag.length-1]]=[roleBag[roleBag.length-1],roleBag[0]];}
  const role=roleBag.pop();previousRole=role;
  if(!bags.get(role)?.length)bags.set(role,shuffle(stories.filter(story=>story.role===role)));
  return bags.get(role).pop();
 }});
}
window.JwdPunishment=Object.freeze({stories,createSelector});
})();
