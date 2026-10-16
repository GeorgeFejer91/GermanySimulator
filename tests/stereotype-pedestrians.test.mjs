import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const game=readFileSync("game.js","utf8");
const world=readFileSync("world3d.js","utf8");
const dictionary=readFileSync("For-AI/SATIRE-DICTIONARY.md","utf8");
const kinds=["towelMan","towelWoman"];
const ids=["towel-man","towel-woman"];

for(const kind of kinds){
 assert.match(game,new RegExp(`${kind}Sprite:"\\./assets/tourists/${kind}/manifest\\.json`),`${kind} must load its accepted painted atlas`);
 assert.match(game,new RegExp(`${kind}:\\{canvas:null,cols:8,rows:10`),`${kind} must expose four painted eight-phase walks`);
 assert.match(world,new RegExp(`n\\.spriteKind.*atlasSprite\\(n\\.spriteKind`),"ordinary pedestrians must opt into registered atlases");
}
for(const id of ids){
 assert.match(game,new RegExp(`id:\"${id}\"`),`${id} must be a runtime archetype`);
 assert.match(dictionary,new RegExp("\\| `"+id+"` \\|"),`${id} must be documented in the satire dictionary`);
}

assert.match(game,/archetype=crowdArchetypeOrder\[j%crowdArchetypeOrder\.length\]/,"crowd distribution must use the deliberate weighted archetype order");
assert.match(game,/Object\.freeze\(\["towel-man","towel-woman"\]/,"only the accepted towel characters must populate the ordinary crowd");
for(const removed of ["bioVegan","wasteMarshal","quietHours","cargoParent","dinInspector","potato"])assert.doesNotMatch(game,new RegExp(removed),`${removed} must not remain in the runtime`);
const context=vm.createContext({window:{},npcs:[],crowdIndex:0,npcLines:['fixture']});
vm.runInContext(readFileSync('street-wisdom.js','utf8'),context);context.StreetWisdom=context.window.StreetWisdom;
vm.runInContext(readFileSync('For-AI/QUIZ-CHARACTER-DICTIONARY.js','utf8'),context);
vm.runInContext(game.split(/\r?\n/).find(line=>line.startsWith('const quizCharacterLibrary=')),context);
vm.runInContext(game.match(/function quizCharacterForActor\([\s\S]*?\n\}/)[0],context);
for(const name of ['crowdNames','crowdVoiceIds'])vm.runInContext(game.match(new RegExp(`const ${name}=[^\\n]+;`))[0],context);
const archetypeStart=game.indexOf('const crowdArchetypes='),archetypeEnd=game.indexOf('\n',game.indexOf('const crowdArchetypeOrder='));
vm.runInContext(game.slice(archetypeStart,archetypeEnd)+game.match(/function addCrowdPedestrian\([\s\S]*?\n\}/)[0],context);
for(let i=0;i<24;i++)vm.runInContext('addCrowdPedestrian(100,100,12,0,0,200)',context);
// Quiz identity overlays preserve physical spawns while adding the fixed quiz voices.
const ordinary=context.npcs.filter(n=>!n.quizzer),quiz=context.npcs.filter(n=>n.quizzer);
assert.equal(context.npcs.length,24,'retain all requested physical crowd spawns');
assert.equal(ordinary.length,16);assert.equal(quiz.length,8);
const sandales=ordinary.filter(n=>n.sandale);
assert.equal(sandales.filter(n=>n.spriteKind==='towelMan').length,4,'Herr Sandale remains abundant');
assert.equal(sandales.filter(n=>n.spriteKind==='towelWoman').length,4,'Frau Sandale remains equally abundant');
assert(sandales.every(n=>n.name.includes('SANDALE')&&!n.quizzer),'Sandales retain their own displayed identities');
for(let i=24;i<120;i++)vm.runInContext('addCrowdPedestrian(100,100,12,0,0,200)',context);
assert.equal(new Set(context.npcs.filter(n=>!n.quizzer&&!n.sandale).map(n=>n.voiceId)).size,9,'all nine other ordinary names retain population coverage');
assert.equal(new Set(quiz.map(n=>n.voiceId)).size,8,'every sampled quiz actor owns its fixed persona voice');
const cast=JSON.parse(readFileSync('For-AI/VOICE-CAST.json')),profiles=[...cast.roleProfiles,...cast.existingAssetProfiles];
for(const person of ordinary){
 assert(!context.StreetWisdom.definitions.some(d=>d.voiceId===person.voiceId),'adviser identities are reserved');
 assert.equal(profiles.find(p=>p.voiceId===person.voiceId).gender,person.spriteKind==='towelMan'?'male':'female');
 assert.equal(profiles.find(p=>p.voiceId===person.voiceId).fullName.toUpperCase(),person.fullName);
}
vm.runInContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),context);
const painted=JSON.parse(readFileSync('assets/characters/street/manifest.json')).characters;
for(const person of quiz){
 const identity=context.window.GermanySimulatorQuizCharacters.characters[Math.floor(context.npcs.indexOf(person)/3)%9],profile=profiles.find(p=>p.voiceId===person.voiceId),binding=cast.productionVoices[person.voiceId],catalogBinding=context.window.GermanySimulatorAudioText.productionVoices[person.voiceId];
 assert.equal(person.quizCharacterId,identity.id);assert.equal(person.voiceId,identity.voiceId);assert.equal(person.name,identity.name);assert.equal(person.fullName,identity.name);
 assert.equal(context.quizCharacterForActor(person),identity,'controller resolves the same dictionary record, including categories');
 assert(identity.categories.length>0&&identity.categories.every(category=>['civic','traffic','technik','grammar-b1','grammar-b2','grammar-c1'].includes(category)));
 assert(!context.StreetWisdom.definitions.some(d=>d.voiceId===person.voiceId),'quiz identities cannot borrow reserved advisers');
 assert(profile&&binding&&catalogBinding,'quiz actor requires its selected public profile');
 assert.equal(profile.fullName,identity.name.replace(/^Dr\. /,''));assert.equal(binding.profileId,profile.secretTunnelProfileId);
 for(const key of ['profileId','referenceSha256','renderer','modelRevision']){assert(binding[key],key);assert.equal(catalogBinding[key],binding[key],key)}
 assert(painted[person.voiceId]?.aliases.includes(identity.id),'quiz persona owns its admitted painted standing body');
}
assert.match(game,/region=state\.region,archetype=[^;]*surface===\"sidewalk\"&&archetype\?archetype\.barks\[region\]/,"nearby pedestrians must use archetype-specific speech captured in the trigger region");
assert.match(game,/dist\(player\.x,player\.y,n\.x,n\.y\)<\(n\.audioRadius\|\|NPC_COMPLAINT_DISTANCE\)/,"personal speech must be radius-triggered");
assert.match(game,/advanceSpriteGait\(n,Math\.hypot\(n\.x-beforeX,n\.y-beforeY\),npcSpriteAtlases\[n\.spriteKind\],CROWD_GAIT_CYCLE_DISTANCE,dt\)/,"walking frames must advance from actual pedestrian distance");

// Execute the real shared bark producer: a named pedestrian cannot borrow
// an anonymous recording even when that body remains in a legacy text pool.
for(const matching of [false,true]){
 let delivery;
 const voiceId='crowd-hildegard-brotzeit',item={text:'Nein, ich gehe hier nicht weg!',voiceId:matching?voiceId:'thorsten',recording:'./fixture.mp3'};
 const bark=vm.createContext({performance:{now:()=>10000},state:{region:'germany'},crowdArchetypeById:{},pedestrianBarks:{germany:{sidewalk:[item]}},nextVariant:(_,lines)=>lines[0],STIMULUS_PRIORITY:{REACTIVE:1},showWorldBark:(...args)=>delivery=args});
 vm.runInContext(game.match(/function pedestrianBark\([\s\S]*?\n\}/)[0],bark);
 bark.person={name:'HILDEGARD BROTZEIT',voiceId};
 vm.runInContext('pedestrianBark(person,"sidewalk")',bark);
 assert.equal(delivery[0],bark.person.name);assert.equal(delivery[1],item.text);
 assert.equal(delivery[3],matching?item.recording:'');assert.equal(delivery[5].candidateVoiceId,voiceId);
}
assert.match(game,/TouristAnimations\.request\(n,dx,dy,atlas\.tourist\)/,"ordinary pedestrians must request all four painted directions from movement");
assert.match(game,/verticalSidewalkSegments/,"ordinary pedestrians must walk vertically as well as horizontally");
assert.match(world,/n\.spriteKind&&q\.userData\[n\.spriteKind\+\"Sprite\"\]/,"the WebGL renderer must keep ordinary crowd sprites synchronized");
assert.match(dictionary,/appearance is not the archetype/i,"the durable policy must separate identity from the satirical behavior");
assert.match(game,/function blockingPedestrian\(x,y\)[^\n]*for\(const n of npcs\)[^\n]*dist\(x,y,n\.x,n\.y\)/,"all towel walkers must block player movement");
assert.doesNotMatch(game,/!\(self\?\.crowd&&n\.crowd\)/,"ordinary towel walkers must not pass through each other");
assert.match(game,/self!==player&&circle\(player,player\.r\)/,"ordinary towel walkers and responders must respect the player's physical body");
assert.match(game,/QUIZ_FOLLOW_MAX_SECONDS=8,QUIZ_FOLLOW_BREAK_DISTANCE=650/,"quiz followers must have bounded time and distance interest");
assert.match(game,/n\.quizFollowTime>QUIZ_FOLLOW_MAX_SECONDS\|\|d>QUIZ_FOLLOW_BREAK_DISTANCE/,"quiz followers must abandon pursuit when interest expires");

console.log("Two personalized, solid towel pedestrians use bounded pavement routes, follow behavior and the registered sprite pipeline");
