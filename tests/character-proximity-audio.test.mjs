import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,statSync} from "node:fs";
import vm from "node:vm";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const context=vm.createContext({window:{}});
vm.runInContext(readFileSync(new URL("../For-AI/AUDIO-TEXT-LIBRARY.js",import.meta.url),"utf8"),context);
const neulandClip=context.window.GermanySimulatorAudioText.clips["merkel-neuland"];
const neuland=new URL("../assets/voices/merkel/neuland-0-3s.mp3",import.meta.url),data=readFileSync(neuland);

assert.equal(statSync(neuland).size,73_394,"normalized Neuland clip size drifted");
assert.equal(createHash("sha256").update(data).digest("hex"),"6e6df76d99db89e462335ae6a8fb6d7909c0611015b58a98fd9c8a3e0a8cb336","normalized Neuland clip checksum drifted");
assert.equal(neulandClip.text,"Das Internet ist für uns alle Neuland.");
assert.equal(neulandClip.recording,"./assets/voices/merkel/neuland-0-3s.mp3");
assert.match(game,/const MERKEL_NEULAND_LINE=speechClip\("merkel-neuland"\)\.text/);
assert.match(game,/\[MERKEL_NEULAND_LINE\]:speechClip\("merkel-neuland"\)\.recording/);
assert.match(game,/function updateMerkel\(n,dt\)[\s\S]*if\(proximityAudioReady\(n\)[\s\S]*showFeaturedSpriteBark\(n,"politician:merkel"/,"Merkel must bark automatically on proximity");
assert.match(game,/function updateBorderPourer\(n,dt\)[\s\S]*proximityAudioReady\(n\)[\s\S]*showFeaturedSpriteBark\(n,"politician:merz"/,"Merz must bark automatically on proximity");
assert.match(game,/function updateBayern\(n,dt\)\{\s*if\(state\.region==="germany"&&proximityAudioReady\(n\)\)bayernBark\(n\)/,"Bayern must bark automatically on proximity");
assert.match(game,/function updateAlice\(n,dt\)\{\s*if\(state\.region==="germany"&&proximityAudioReady\(n\)\)aliceBark\(n\)/,"Alice must loop her own recordings automatically on proximity");
assert.match(game,/nextVariant\("politician:"\+n\.politician,lines\)/,"politician pools must remain owner-locked and no-repeat");
assert.match(game,/nextVariant\("bayern",bayernClips\)/,"Bayern recordings must use their no-repeat bag");
assert.match(game,/nextVariant\("alice",aliceClips\)/,"Alice recordings must use their own no-repeat bag");
assert.match(game,/function showFeaturedSpriteBark\([\s\S]*priority:STIMULUS_PRIORITY\.FEATURED[\s\S]*done:\(\)=>\{n\.barkAt=performance\.now\(\)\+AUDIO_MIX\.FEATURED_GAP_MS/,"nearby named sprites must have their own priority and a repeat gap");
assert.match(game,/if\(hasStimulusFamily\(family\)\|\|now<\(n\.barkAt\|\|0\)\|\|!line\?\.text\|\|!featuredSpriteEligible\(n\)\)return false/,"one owner may have only one active or pending line");
assert.doesNotMatch(game,/featuredAudioActive/,"discarded or expired requests must not leave an NPC line lock behind");
assert.doesNotMatch(game,/allowFollowUp&&Math\.random\(\)<\.42/,"featured proximity dialogue must not stop at a random two-line burst");
assert.match(game,/function featuredSpriteEligible\(n\)[\s\S]*audioRadius\|\|SPRITE_AUDIO_RADIUS/,"the continuous loop must stop at the small audible radius, not the release hysteresis ring");
assert.match(game,/function innerMonologue\(context,chance=1\)[\s\S]*family:"inner-monologue",candidateVoiceId:player\.voiceId,priority:STIMULUS_PRIORITY\.REACTIVE/,"contextual self-talk must stay below featured sprite dialogue and retain the player's voice identity");
assert.match(game,/innerMonologue\("train"\)/,"the delayed-train interaction must trigger contextual self-talk");
assert.match(game,/function openHumorWelcome\(\)[\s\S]*Your mission ist simple:[\s\S]*openDialogue\(/,"the opening mission briefing must remain an audible dialogue sequence");
assert.match(game,/function finishHumorCertification\(openWelcome=true\)[\s\S]*if\(openWelcome\)openHumorWelcome\(\)/,"finishing the opening form must still trigger the mission briefing");

let now=1000,delivered;
const featured=vm.createContext({performance:{now:()=>now},hasStimulusFamily:()=>false,featuredSpriteEligible:()=>true,showWorldBark:(...args)=>delivered=args,STIMULUS_PRIORITY:{FEATURED:4},AUDIO_MIX:{FEATURED_GAP_MS:3500}});
vm.runInContext(`const state={voiceOn:true};${game.match(/function showFeaturedSpriteBark\([\s\S]*?\n\}/)[0]};globalThis.api={showFeaturedSpriteBark,state}`,featured);
const npc={name:"MERZ",barkAt:0};
assert.equal(featured.api.showFeaturedSpriteBark(npc,"politician:merz","Erste Zeile"),true);
delivered[5].done();
assert.equal(npc.barkAt,4500);
assert.equal(featured.api.showFeaturedSpriteBark(npc,"politician:merz","Zweite Zeile"),false,"a completed line must leave space for other event families");
now=4500;
assert.equal(featured.api.showFeaturedSpriteBark(npc,"politician:merz","Zweite Zeile"),true);
featured.api.state.voiceOn=false;
now=9000;
npc.barkAt=0;
assert.equal(featured.api.showFeaturedSpriteBark(npc,"politician:merz","Ohne Stimme"),true);
assert.equal(featured.api.showFeaturedSpriteBark(npc,"politician:merz","Ohne Stimme"),false,"voice-off mode must not create per-frame repeat barks");

const radius=vm.createContext({player:{x:0,y:0},dist:(x,y,nx,ny)=>Math.hypot(x-nx,y-ny),SPRITE_AUDIO_RADIUS:176,SPRITE_AUDIO_RELEASE_RADIUS:224});
vm.runInContext(`${game.match(/function proximityAudioReady\(n\)\{[\s\S]*?\n\}/)[0]};globalThis.proximityAudioReady=proximityAudioReady`,radius);
const departing={x:230,y:0,barkAt:4500,dialogueNearby:true};
assert.equal(radius.proximityAudioReady(departing),false);
assert.equal(departing.barkAt,4500,"leaving the radius must not erase the character repeat gap");

console.log("Automatic Merkel, Merz, Bayern, and Alice proximity audio contracts OK");
