import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const game=readFileSync("game.js","utf8"),world3d=readFileSync("world3d.js","utf8");
const sourceIds=[...game.matchAll(/\{source:(?:"([^"]+)"|(\d+)),(?:type:"[^"]+",)?(?:level:"[^"]+",)?question:/g)].map(([,named,numeric])=>named||numeric);
const berlinMatch=game.match(/const berlinCitizenshipQuestions=(\{[\s\S]*?\});\s*const quizContexts/);
assert.ok(berlinMatch,"Berlin quiz copy must remain a literal object");
const berlin=JSON.parse(berlinMatch[1]);
assert.deepEqual(Object.keys(berlin),sourceIds,"every citizenship question needs Berlin Denglisch copy");
for(const [source,copy] of Object.entries(berlin)){
 assert.equal(copy.choices.length,4,`task ${source} needs four Denglisch choices`);
 assert.match(copy.question,/\b(?:who|what|when|where|which|why|how|from|has|can|one|is|at|on|not|first|complete|elected|celebrated|works|regular|remembered|economic|cultural|social)\b/i,`task ${source} question is not visibly Denglisch`);
}
assert.match(game,/state\.region==="berlin"\?"Choice ":""/,"every Berlin answer button needs a visible Denglisch marker");
assert.match(game,/SPRITE_AUDIO_RADIUS=176,SPRITE_AUDIO_RELEASE_RADIUS=224/);
assert.match(game,/function proximityAudioReady\(n\)/);
assert.match(game,/if\(near>release\)\{n\.dialogueNearby=false;return false\}/,"leaving the release radius must rearm entry without bypassing the repeat gap");
assert.doesNotMatch(game,/near>=radius\|\|n\.dialogueNearby/,"remaining inside the radius must not suppress the next loop cycle");
assert.match(game,/performance\.now\(\)>?=\(n\.barkAt\|\|0\)/,"re-entered featured characters must still respect their repeat gap");
assert.match(game,/function insetSpriteSheet\(source,atlas\)/);
assert.match(game,/const cell=Math\.round\(source\.width\/atlas\.cols\)/,"runtime preparation must preserve the built 128 px cell grid");
for(const [kind,family] of [["merkel","characters"],["bayern","characters"],["alice","characters"],["borderPourer","characters"],["towelMan","tourists"],["towelWoman","tourists"]]){
 assert.match(game,new RegExp(`${kind}Sprite:"\\./assets/${family}/${kind}/manifest\\.json`),`${kind} must load its accepted painted atlas`);
 assert.match(game,new RegExp(`${kind}:\\{canvas:null,cols:(?:8|16),rows:`),`${kind} must expose the accepted grid`);
}
assert.match(game,/const stableSpriteRoot="\.\/assets\/sprite-archive\/pre-rig-20260921\/assets\/"/,"the archived originals remain missing-file fallbacks");
assert.match(game,/TouristAnimations\.advance\(n,distance,dt,atlas\.tourist,cycleDistance\)/);
assert.match(game,/function holdFeaturedTurn\(n,dx,dy,atlas,dt\)/);
assert.match(game,/getNpcSpriteCanvas:key=>npcSpriteAtlases\[key\]/);
assert.match(world3d,/new T\.CanvasTexture\(source\)/,"Three.js must upload each accepted atlas once");
assert.doesNotMatch(game,/spriteFrame=Math\.floor\(n\.animTime\*(?:32|40|60)/,"registered gait must advance from actual distance, not wall-clock time");
assert.match(game,/getNpcSpriteCanvas:key=>npcSpriteAtlases\[key\]/);
assert.match(world3d,/new T\.CanvasTexture\(source\)/,"Three.js must use the normalized runtime atlas");
assert.doesNotMatch(world3d,/TextureLoader\(\)\.load\("\.\/assets\/(?:merkel-sprite|bayern-walker-sprite)\.png"/);
console.log("Berlin quiz, looping proximity audio, and expanded sprite atlas contracts OK");
