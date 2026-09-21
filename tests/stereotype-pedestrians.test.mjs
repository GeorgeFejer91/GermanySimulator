import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const game=readFileSync("game.js","utf8");
const world=readFileSync("world3d.js","utf8");
const dictionary=readFileSync("For-AI/SATIRE-DICTIONARY.md","utf8");
const kinds=["bioVegan","towelMan","towelWoman","wasteMarshal","quietHours","cargoParent","dinInspector","potato"];
const ids=["bio-vegan","towel-man","towel-woman","waste-marshal","quiet-hours","cargo-parent","din-inspector","potato"];

for(const kind of kinds){
 assert.match(game,new RegExp(`${kind}Sprite:\"\\./assets/crowd-`),`${kind} must load a runtime atlas`);
 assert.match(game,new RegExp(`${kind}:\\{canvas:null,cols:32,rows:3`),`${kind} must expose 32-frame side, down and up rows`);
 assert.match(world,new RegExp(`n\\.spriteKind.*atlasSprite\\(n\\.spriteKind`),"ordinary pedestrians must opt into registered atlases");
}
for(const id of ids){
 assert.match(game,new RegExp(`id:\"${id}\"`),`${id} must be a runtime archetype`);
 assert.match(dictionary,new RegExp("\\| `"+id+"` \\|"),`${id} must be documented in the satire dictionary`);
}

assert.match(game,/archetype=crowdArchetypeOrder\[j%crowdArchetypeOrder\.length\]/,"crowd distribution must use the deliberate weighted archetype order");
assert.match(game,/"quiet-hours","din-inspector","towel-man","waste-marshal","towel-woman","quiet-hours"/,"grumpy middle-class rule enforcers must dominate the production mix");
assert.match(game,/crowdNames\[\(j\*5\+3\)%crowdNames\.length\]/,"names must rotate independently from the visual stereotype");
assert.match(game,/surface===\"sidewalk\"&&archetype\?archetype\.barks\[state\.region\]/,"nearby pedestrians must use archetype-specific regional speech");
assert.match(game,/dist\(player\.x,player\.y,n\.x,n\.y\)<\(n\.audioRadius\|\|NPC_COMPLAINT_DISTANCE\)/,"personal speech must be radius-triggered");
assert.match(game,/n\.spriteFrame=Math\.floor\(n\.animTime\*Math\.max\(18,Math\.abs\(n\.vx\|\|n\.vy\|\|0\)\*1\.45\)\)%npcSpriteAtlases\[n\.spriteKind\]\.cols/,"walking frames must advance in proportion to pedestrian speed");
assert.match(game,/n\.spriteRow=horizontal\?0:\(dy>0\?1:2\)/,"ordinary pedestrians must select side, down and up atlas rows from their movement vector");
assert.match(game,/verticalSidewalkSegments/,"ordinary pedestrians must walk vertically as well as horizontally");
assert.match(world,/n\.spriteKind&&q\.userData\[n\.spriteKind\+\"Sprite\"\]/,"the WebGL renderer must keep ordinary crowd sprites synchronized");
assert.match(dictionary,/appearance is not the archetype/i,"the durable policy must separate identity from the satirical behavior");
assert.match(dictionary,/literal anthropomorphic vegetable/i,"potato satire must remain a literal visual gag");

console.log("Eight personalized, region-aware pedestrian archetypes are distributed through the registered sprite pipeline");
