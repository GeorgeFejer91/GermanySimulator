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
assert.match(game,/if\(near>release\)\{if\(n\.dialogueNearby\)n\.barkAt=0;n\.dialogueNearby=false;(?:n\.featuredAudioActive=false;)?return false\}/,"leaving the release radius must rearm the proximity loop");
assert.doesNotMatch(game,/near>=radius\|\|n\.dialogueNearby/,"remaining inside the radius must not suppress the next loop cycle");
assert.doesNotMatch(game,/near>=radius\|\|performance\.now\(\)<\(n\.barkAt\|\|0\)/,"a previous cooldown must not delay a re-entered featured-character loop");
assert.match(game,/function insetSpriteSheet\(source,atlas\)/);
assert.match(game,/const cell=Math\.round\(source\.width\/atlas\.cols\)/,"runtime preparation must preserve the built 128 px cell grid");
assert.match(game,/merkel:\{canvas:null,cols:32,rows:5,pad:0,drawSize:126\}/);
assert.match(game,/bayern:\{canvas:null,cols:32,rows:4,pad:0,drawSize:150\}/);
assert.match(game,/borderPourer:\{canvas:null,cols:32,rows:6,pad:0,drawSize:136\}/);
assert.match(game,/alice:\{canvas:null,cols:32,rows:2,pad:0,drawSize:126\}/);
assert.match(game,/imageSmoothingQuality="high"/);
assert.doesNotMatch(game,/prepareBorderPourerSprite/,"Merz must use the same clean source-alpha path as every other registered sprite");
assert.match(game,/function advanceSpriteGait\(n,distance,atlas,cycleDistance=FEATURED_GAIT_CYCLE_DISTANCE\)/);
assert.match(game,/advanceSpriteGait\(n,Math\.hypot\(n\.x-beforeX,n\.y-beforeY\),npcSpriteAtlases\.merkel\)/);
assert.match(game,/advanceSpriteGait\(n,Math\.hypot\(n\.x-beforeX,n\.y-beforeY\),npcSpriteAtlases\.bayern\)/);
assert.match(game,/advanceSpriteGait\(n,Math\.hypot\(n\.x-beforeX,n\.y-beforeY\),npcSpriteAtlases\.alice\)/);
assert.doesNotMatch(game,/spriteFrame=Math\.floor\(n\.animTime\*(?:32|40|60)/,"registered gait must advance from actual distance, not wall-clock time");
assert.match(game,/getNpcSpriteCanvas:key=>npcSpriteAtlases\[key\]/);
assert.match(world3d,/new T\.CanvasTexture\(source\)/,"Three.js must use the normalized runtime atlas");
assert.doesNotMatch(world3d,/TextureLoader\(\)\.load\("\.\/assets\/(?:merkel-sprite|bayern-walker-sprite)\.png"/);
console.log("Berlin quiz, looping proximity audio, and expanded sprite atlas contracts OK");
