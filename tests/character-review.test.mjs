import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {resolve} from "node:path";
import vm from "node:vm";

const root=resolve(import.meta.dirname,"..");
const source=file=>readFileSync(resolve(root,file),"utf8");
const context=vm.createContext({window:{}});
for(const file of ["For-AI/AUDIO-TEXT-LIBRARY.js","For-AI/QUIZ-CHARACTER-DICTIONARY.js","character-review.js"])vm.runInContext(source(file),context,{filename:file});
const {profiles,atlases}=context.window.GermanySimulatorCharacterReview;
const {clips}=context.window.GermanySimulatorAudioText;
const game=source("game.js");
const namedBlock=game.slice(game.indexOf("const npcs=["),game.indexOf("].map(n=>n.special"));
const physicalNames=[...namedBlock.matchAll(/name:"([^"]+)"/g)].map(match=>match[1].split(" · ")[0]);
const listed=profiles.map(person=>person.name.toLocaleUpperCase());
for(const name of physicalNames)assert.ok(listed.some(label=>label.includes(name)),`missing physical NPC ${name}`);
for(const person of context.window.GermanySimulatorQuizCharacters.characters)assert.ok(listed.includes(person.name.toLocaleUpperCase()),`missing quiz identity ${person.name}`);
assert.equal(new Set(profiles.map(person=>person.id)).size,profiles.length,"each review link needs a unique id");
for(const person of profiles){
  assert.ok(person.lines("berlin").length>0,`${person.name} needs a Berlin review line`);
  assert.ok(person.lines("germany").length>0,`${person.name} needs a Germany review line`);
  if(atlases[person.body])assert.ok(existsSync(resolve(root,"assets/sprite-archive/pre-rig-20260921/assets",atlases[person.body].file)),`${person.name} atlas missing`);
  for(const region of ["berlin","germany"])for(const row of person.lines(region))if(row.clip){
    const clip=Object.values(clips).find(item=>item.path===row.clip);
    assert.ok(clip,`uncatalogued clip for ${person.name}`);
    assert.equal(row.text,clip.text,`spoken text drift for ${person.name}`);
    assert.ok(existsSync(resolve(root,row.clip.replace(/^\.\//,""))),`missing recording for ${person.name}`);
  }
}
const owner={merz:"merz",merkel:"merkel",bayern:"bayern",alice:"alice"};
for(const [id,voiceId] of Object.entries(owner))for(const row of profiles.find(person=>person.id===id).lines("germany"))if(row.clip)assert.equal(Object.values(clips).find(clip=>clip.path===row.clip).voiceId,voiceId,`${id} clip ownership`);
assert.match(source("character-review.html"),/name="robots" content="noindex,nofollow,noarchive"/);
assert.match(source("character-review.html"),/prepareWithSegments/);
console.log(`${profiles.length} individually linked character profiles and their recorded audio assets are valid`);
