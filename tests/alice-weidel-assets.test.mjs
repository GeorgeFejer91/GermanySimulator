import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync,readFileSync,statSync} from "node:fs";
import vm from "node:vm";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const context=vm.createContext({window:{}});
vm.runInContext(readFileSync(new URL("../For-AI/AUDIO-TEXT-LIBRARY.js",import.meta.url),"utf8"),context);
const clips=context.window.GermanySimulatorAudioText.clips;
const expected=[
 ["Ich liebe Deutschland. Besonders aus der Schweiz.","deutschland-schweiz.mp3",50_198,"5d32bc26a4fdd9419690a1a496ac2263cbea1cf34fb8429c33d8b3b8334800ef"],
 ["Adolf Hitler war ein Linker. Die DDR hieß schließlich auch Demokratische Republik. Und Deutsche Leberkäse besteht selbstverständlich aus Leber und Käse.","hitler-ddr-leberkaese.mp3",197_319,"630c34d0f2f94871ad47bb404f479435055b012a9245f2e5848f9f33883afb7e"],
 ["Die Nationalsozialisten waren Sozialisten, sonst hätte man sie ja Nationalirgendwas genannt.","nationalsozialisten-sozialisten.mp3",96_173,"abff66a12a995645b25fe8fe48cb61f644bb2006ddd0702fc56113ff3c690345"],
 ["Wir müssen zurück zur traditionellen Familie. Wie genau die aussieht, klären wir dann außerhalb meines Privatlebens.","traditionelle-familie.mp3",102_443,"f9891eaba1cc5bad71dbca8acd79a10769bc721fd9c711ce00ee2196715f8f22"]
];
for(const [text,file,size,hash] of expected){
 const url=new URL(`../assets/voices/alice-weidel/${file}`,import.meta.url);
 const id=`alice-${file.slice(0,-4)}`;
 assert.equal(clips[id]?.text,text,`${file} must display its exact local transcript`);
 assert.equal(clips[id]?.recording,`./assets/voices/alice-weidel/${file}`);
 assert.ok(game.includes(`speechClip("${id}")`),`${file} must be selected by stable clip ID`);
 assert.ok(existsSync(url),`missing ${file}`);
 assert.equal(statSync(url).size,size,`${file} normalized size drifted`);
 assert.equal(createHash("sha256").update(readFileSync(url)).digest("hex"),hash,`${file} normalized checksum drifted`);
}
assert.match(game,/aliceDumpster=Object\.freeze\([\s\S]*orbitRadius:120/,"Alice's dumpster and orbit must share one placement");
assert.match(game,/x:aliceDumpster\.x\+aliceDumpster\.orbitRadius,y:aliceDumpster\.y,name:"ALICE WEIDEL/,"Alice must spawn on that same orbit");
assert.match(game,/asset:"dumpster-fire"/,"the fire must be part of the game world");
assert.match(game,/ALICE_WALK_SPEED=STANDARD_SPRITE_WALK_SPEED\*1\.5/,"Alice must move at exactly 1.5× the standard sprite walk speed");
assert.match(game,/function featuredSpriteEligible\(n\)[\s\S]*audioRadius\|\|SPRITE_AUDIO_RADIUS[\s\S]*showFeaturedSpriteBark\(n,"alice"/,"Alice recordings must remain small-radius gated");

const updateAlice=game.match(/function updateAlice\(n,dt\)\{[\s\S]*?\n\}/)?.[0];
const moveGroundResponder=game.match(/function moveGroundResponder\(entity,dx,dy,r\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(updateAlice,"Alice orbit update must exist");
assert.ok(moveGroundResponder,"Alice must use the collision-aware movement helper");
let blocked=false,distance=0;
const motion=vm.createContext({
 state:{region:"germany"},proximityAudioReady:()=>false,aliceBark:()=>{},
 ALICE_WALK_SPEED:78,FEATURED_GAIT_CYCLE_DISTANCE:96,aliceDumpster:{x:8860,y:680,orbitRadius:120},
 responderBlocked:()=>blocked,npcSpriteAtlases:{alice:{}},
 advanceSpriteGait:(_n,moved)=>{distance+=moved}
});
vm.runInContext(`${moveGroundResponder}\n${updateAlice}; this.stepAlice=updateAlice`,motion);
const alice={x:8980,y:680,orbitAngle:0,spriteRow:0},rows=new Set();
for(let i=0;i<500;i++){motion.stepAlice(alice,.02);rows.add(alice.spriteRow)}
assert.ok(Math.abs(Math.hypot(alice.x-8860,alice.y-680)-120)<.01,"Alice stays on the orbit");
assert.ok(distance>2*Math.PI*120,"Alice completes a full circuit");
assert.deepEqual([...rows].sort(),[0,1],"both authored front/back rows are used");
const previous={x:alice.x,y:alice.y,angle:alice.orbitAngle},previousDistance=distance;
blocked=true;motion.stepAlice(alice,.02);
assert.deepEqual({x:alice.x,y:alice.y,angle:alice.orbitAngle},previous,"a blocker pauses the orbit");
assert.equal(distance,previousDistance,"a blocker pauses the gait clock");

const sprite=readFileSync(new URL("../assets/alice-weidel-sprite.png",import.meta.url));
assert.equal(sprite.readUInt32BE(16),4096);
assert.equal(sprite.readUInt32BE(20),256);
assert.equal(sprite[25],6,"Alice sprite must retain full RGBA edges");

console.log("Alice dumpster orbit, full-RGBA sprite, and exact proximity recordings OK");
