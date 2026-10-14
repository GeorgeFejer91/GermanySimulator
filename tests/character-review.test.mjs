import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync,readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import vm from "node:vm";

const root=resolve(import.meta.dirname,"..");
const source=file=>readFileSync(resolve(root,file),"utf8");
const context=vm.createContext({window:{}});
for(const file of ["For-AI/AUDIO-TEXT-LIBRARY.js","For-AI/QUIZ-CHARACTER-DICTIONARY.js","neighbor-story.js","character-review.js"])vm.runInContext(source(file),context,{filename:file});
const {profiles,atlases,previewCell}=context.window.GermanySimulatorCharacterReview;
const {clips}=context.window.GermanySimulatorAudioText;
const cast=JSON.parse(source('For-AI/VOICE-CAST.json'));
const game=source("game.js");
const namedBlock=game.slice(game.indexOf("const npcs=["),game.indexOf("].map(n=>n.special"));
const physicalNames=[...namedBlock.matchAll(/name:"([^"]+)"/g)].map(match=>match[1].split(" · ")[0]);
vm.runInContext(game.slice(game.indexOf('const jwdCopy='),game.indexOf('function currentMission('))+';globalThis.neighborCopy=jwdCopy;',context);
const neighborRoles=cast.existingAssetProfiles.filter(person=>person.gameRole==='jwd-neighbor');
assert.equal(neighborRoles.length,4,'the neighborhood sprite/dialogue cast includes Theodore');
for(const person of neighborRoles){
 const entry=profiles.find(profile=>profile.id===person.gameCharacterId);assert.ok(entry,`missing neighbor gallery ${person.voiceId}`);assert.equal(entry.voiceId,person.voiceId);const name=person.gameCharacterId==='jwd-theodore'?game.match(/id:'jwd-theodore',name:'([^']+)'/)[1]:namedBlock.match(new RegExp(`id:"${person.gameCharacterId}",name:"([^\"]+)"`))[1];assert.equal(entry.name,name);assert.equal(context.window.GermanySimulatorAudioText.voices[person.voiceId].name,person.fullName);
 const introduction=person.dialogue[0],topic=introduction.locator.match(/jwdCopy\.([a-zA-Z]+)\.de/);if(topic)assert.equal(introduction.text,context.neighborCopy[topic[1]].de[0]);for(const region of ['berlin','germany'])assert.equal(entry.lines(region)[0].text,introduction.text,'gallery intro matches exact current authored text');assert.match(entry.movement,/procedural silhouette, not the runtime painted atlas/);
 const tourText=person.dialogue.filter(item=>item.locator.startsWith('neighbor-story.js ')).map(item=>item.text);for(const text of tourText)assert.ok(entry.lines('germany').some(row=>row.text===text),'every owned tour utterance has a review entry');
 if(person.voiceId==='jwd-inga-maaslos'){assert.equal(entry.lines('berlin').filter(row=>row.clip).length,11);assert.match(entry.voice,/Eleven exact authored German takes/)}else{assert.equal(entry.lines('berlin')[0].clip,'');assert.match(entry.voice,/Browser-generated speech/)}
}
const listed=profiles.map(person=>person.name.toLocaleUpperCase());
for(const name of physicalNames)assert.ok(listed.some(label=>label.includes(name)),`missing physical NPC ${name}`);
for(const person of context.window.GermanySimulatorQuizCharacters.characters)assert.ok(listed.includes(person.name.toLocaleUpperCase()),`missing quiz identity ${person.name}`);
assert.equal(new Set(profiles.map(person=>person.id)).size,profiles.length,"each review link needs a unique id");
for(const person of profiles){
  assert.ok(person.lines("berlin").length>0,`${person.name} needs a Berlin review line`);
  assert.ok(person.lines("germany").length>0,`${person.name} needs a Germany review line`);
  for(const region of ["berlin","germany"])for(const row of person.lines(region))if(row.clip){
    const clip=Object.values(clips).find(item=>item.path===row.clip);
    assert.ok(clip,`uncatalogued clip for ${person.name}`);
    assert.equal(row.text,clip.text,`spoken text drift for ${person.name}`);
    assert.ok(existsSync(resolve(root,row.clip.replace(/^\.\//,""))),`missing recording for ${person.name}`);
  }
}
for(const [kind,atlas] of Object.entries(atlases)){
  const path=resolve(root,atlas.manifest),m=JSON.parse(readFileSync(path,"utf8"));
  const png=Buffer.from(m.png_parts.map(part=>JSON.parse(readFileSync(resolve(dirname(path),part),"utf8")).base64).join(""),"base64");
  assert.equal(createHash("sha256").update(png).digest("hex"),m.sha256,`${kind} current artwork hash`);
  assert.equal(png.readUInt32BE(16),m.image_size[0]);assert.equal(png.readUInt32BE(20),m.image_size[1]);
  assert.ok(m.cycle_distance>0,`${kind} needs a measured cycle distance`);
  for(const from of ["right","left","down","up"]){
    const walk=previewCell(m,"walk",from,"up",.2,40);
    assert.equal(walk.row,m.walks[from].row,`${kind} ${from} walk`);
    for(const to of ["right","left","down","up"]){if(from===to)continue;
      assert.ok(m.transitions[from+"-to-"+to],`${kind} ${from}→${to} arc`);
      const turn=previewCell(m,"turn",from,to,m.cycle_distance/40+.01,40);
      assert.ok(m.transitions[from+"-to-"+to].frames.some(frame=>frame.row===turn.row&&frame.col===turn.col),`${kind} ${from}→${to} uses reviewed turn pixels`);
    }
  }
  if(Object.keys(m.actions||{}).length)assert.ok(previewCell(m,"pour","right","up",.3,40).row>=m.walks.up.row,`${kind} pouring cells`);
  if(m.interactions)assert.equal(previewCell(m,"waving","right","up",.2,40).row,m.interactions.states.waving.row,`${kind} reaction cells`);
}
for(const id of ["herr-sandale","frau-sandale"])assert.ok(profiles.some(person=>person.id===id),`${id} needs a direct link`);
assert(!profiles.some(person=>person.id==='rule-announcer'),'anonymous rule narration is retired');
const advisers=profiles.filter(person=>person.group==='Street advisers');
assert.equal(advisers.length,3);
assert.equal(advisers.flatMap(person=>person.lines('germany')).length,11);
for(const person of advisers){
 assert.equal(person.id,person.voiceId,'existing character links remain stable');
 assert.equal(person.actorId,cast.roleProfiles.find(role=>role.voiceId===person.voiceId).gameCharacterId);
 for(const row of person.lines('germany')){
  const clip=Object.values(clips).find(item=>item.voiceId===person.voiceId&&item.text===row.text);
  assert.equal(clip.trigger,'nearby-street-rule');assert.equal(row.clip,clip.path||'');
 }
}
const ordinary=profiles.filter(person=>person.group==='Crowd');assert.equal(ordinary.length,9);
for(const person of ordinary)assert.equal(cast.roleProfiles.find(role=>role.voiceId===person.voiceId).gender,person.body==='towel-man'?'male':'female');
for(const person of profiles.filter(person=>person.group==='Named passersby'))for(const row of person.lines('germany'))if(row.clip)assert.equal(Object.values(clips).find(clip=>clip.path===row.clip).voiceId,person.voiceId);
const owner={merz:"merz",merkel:"merkel",bayern:"bayern",alice:"alice"};
for(const [id,voiceId] of Object.entries(owner))for(const row of profiles.find(person=>person.id===id).lines("germany"))if(row.clip)assert.equal(Object.values(clips).find(clip=>clip.path===row.clip).voiceId,voiceId,`${id} clip ownership`);
assert.match(source("character-review.html"),/name="robots" content="noindex,nofollow,noarchive"/);
assert.match(source("character-review.html"),/prepareWithSegments/);
assert.doesNotMatch(source("character-review.js"),/sprite-archive\/pre-rig/);
console.log(`${profiles.length} individually linked character profiles and their recorded audio assets are valid`);
