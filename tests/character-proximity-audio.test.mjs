import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,statSync} from "node:fs";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const neuland=new URL("../assets/voices/merkel/neuland-0-3s.mp3",import.meta.url),data=readFileSync(neuland);

assert.equal(statSync(neuland).size,73_394,"normalized Neuland clip size drifted");
assert.equal(createHash("sha256").update(data).digest("hex"),"6e6df76d99db89e462335ae6a8fb6d7909c0611015b58a98fd9c8a3e0a8cb336","normalized Neuland clip checksum drifted");
assert.match(game,/const MERKEL_NEULAND_LINE="Das Internet ist für uns alle Neuland\."/);
assert.match(game,/\[MERKEL_NEULAND_LINE\]:"\.\/assets\/voices\/merkel\/neuland-0-3s\.mp3"/);
assert.match(game,/function updateMerkel\(n,dt\)[\s\S]*if\(proximityAudioReady\(n\)[\s\S]*showFeaturedSpriteBark\(n,"politician:merkel"/,"Merkel must bark automatically on proximity");
assert.match(game,/function updateBorderPourer\(n,dt\)[\s\S]*proximityAudioReady\(n\)[\s\S]*showFeaturedSpriteBark\(n,"politician:merz"/,"Merz must bark automatically on proximity");
assert.match(game,/function updateBayern\(n,dt\)\{\s*if\(state\.region==="germany"&&proximityAudioReady\(n\)\)bayernBark\(n\)/,"Bayern must bark automatically on proximity");
assert.match(game,/function updateAlice\(n,dt\)\{\s*if\(state\.region==="germany"&&proximityAudioReady\(n\)\)aliceBark\(n\)/,"Alice must loop her own recordings automatically on proximity");
assert.match(game,/nextVariant\("politician:"\+n\.politician,lines\)/,"politician pools must remain owner-locked and no-repeat");
assert.match(game,/nextVariant\("bayern",bayernClips\)/,"Bayern recordings must use their no-repeat bag");
assert.match(game,/nextVariant\("alice",aliceClips\)/,"Alice recordings must use their own no-repeat bag");
assert.match(game,/function showFeaturedSpriteBark\([\s\S]*priority:STIMULUS_PRIORITY\.NEARBY[\s\S]*done:\(\)=>\{[^}]*if\(eligible\(\)\)showFeaturedSpriteBark/,"nearby named sprites must continuously queue their next owner-locked high-priority line");
assert.match(game,/if\(n\.featuredAudioActive\|\|!line\?\.text\|\|!featuredSpriteEligible\(n\)\)return false/,"each named sprite must hold one complete line before another frame can queue the next one");
assert.match(game,/function stopSpeech\([\s\S]*for\(const n of npcs\)if\(n\.special\)n\.featuredAudioActive=false/,"voice cancellation must release every named sprite's line lock");
assert.doesNotMatch(game,/allowFollowUp&&Math\.random\(\)<\.42/,"featured proximity dialogue must not stop at a random two-line burst");
assert.match(game,/function featuredSpriteEligible\(n\)[\s\S]*audioRadius\|\|SPRITE_AUDIO_RADIUS/,"the continuous loop must stop at the small audible radius, not the release hysteresis ring");
assert.match(game,/function innerMonologue\(context,chance=1\)[\s\S]*family:"inner-monologue",priority:STIMULUS_PRIORITY\.REACTIVE/,"contextual self-talk must stay below featured sprite dialogue");
assert.match(game,/innerMonologue\("train"\)/,"the delayed-train interaction must trigger contextual self-talk");
assert.match(game,/function openHumorWelcome\(\)[\s\S]*Your mission ist simple:[\s\S]*openDialogue\(/,"the opening mission briefing must remain an audible dialogue sequence");
assert.match(game,/function finishHumorCertification\(openWelcome=true\)[\s\S]*if\(openWelcome\)openHumorWelcome\(\)/,"finishing the opening form must still trigger the mission briefing");

console.log("Automatic Merkel, Merz, Bayern, and Alice proximity audio contracts OK");
