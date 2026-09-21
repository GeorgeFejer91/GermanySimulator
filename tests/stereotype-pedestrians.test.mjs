import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const game=readFileSync("game.js","utf8");
const world=readFileSync("world3d.js","utf8");
const dictionary=readFileSync("For-AI/SATIRE-DICTIONARY.md","utf8");
const kinds=["towelMan","towelWoman"];
const ids=["towel-man","towel-woman"];

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
assert.match(game,/Object\.freeze\(\["towel-man","towel-woman"\]/,"only the accepted towel characters must populate the ordinary crowd");
for(const removed of ["bioVegan","wasteMarshal","quietHours","cargoParent","dinInspector","potato"])assert.doesNotMatch(game,new RegExp(removed),`${removed} must not remain in the runtime`);
assert.match(game,/crowdNames\[\(j\*5\+3\)%crowdNames\.length\]/,"names must rotate independently from the visual stereotype");
assert.match(game,/surface===\"sidewalk\"&&archetype\?archetype\.barks\[state\.region\]/,"nearby pedestrians must use archetype-specific regional speech");
assert.match(game,/dist\(player\.x,player\.y,n\.x,n\.y\)<\(n\.audioRadius\|\|NPC_COMPLAINT_DISTANCE\)/,"personal speech must be radius-triggered");
assert.match(game,/n\.spriteFrame=Math\.floor\(n\.animTime\*Math\.max\(18,Math\.abs\(n\.vx\|\|n\.vy\|\|0\)\*1\.45\)\)%npcSpriteAtlases\[n\.spriteKind\]\.cols/,"walking frames must advance in proportion to pedestrian speed");
assert.match(game,/n\.spriteRow=horizontal\?0:\(dy>0\?1:2\)/,"ordinary pedestrians must select side, down and up atlas rows from their movement vector");
assert.match(game,/verticalSidewalkSegments/,"ordinary pedestrians must walk vertically as well as horizontally");
assert.match(world,/n\.spriteKind&&q\.userData\[n\.spriteKind\+\"Sprite\"\]/,"the WebGL renderer must keep ordinary crowd sprites synchronized");
assert.match(dictionary,/appearance is not the archetype/i,"the durable policy must separate identity from the satirical behavior");
assert.match(game,/if\(n\.arrested\|\|n\.crowd\)continue/,"ordinary towel walkers must not hard-block the player");
assert.match(game,/!\(self\?\.crowd&&n\.crowd\)/,"ordinary towel walkers must pass through one another rather than forming jams");
assert.match(game,/self&&!self\.crowd&&.*dist\(x,y,player\.x,player\.y\)/,"ordinary towel walkers must pass through the player while other responders remain solid");
assert.match(game,/QUIZ_FOLLOW_MAX_SECONDS=8,QUIZ_FOLLOW_BREAK_DISTANCE=650/,"quiz followers must have bounded time and distance interest");
assert.match(game,/n\.quizFollowTime>QUIZ_FOLLOW_MAX_SECONDS\|\|d>QUIZ_FOLLOW_BREAK_DISTANCE/,"quiz followers must abandon pursuit when interest expires");

console.log("Two personalized, pass-through towel pedestrians use bounded follow behavior and the registered sprite pipeline");
