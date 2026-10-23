import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {pickupHarness} from './law-pickup.test.mjs';

const source=readFileSync(process.env.NEIGHBOR_SOURCE||new URL('../game.js',import.meta.url),'utf8');
function fn(name){
 const start=source.indexOf(`function ${name}(`),next=source.indexOf('\nfunction ',start+1);
 assert.ok(start>=0,name);return source.slice(start,next<0?source.length:next);
}
function fixture(){
 const h=pickupHarness(),nodes=new Map(),events=[],scheduled=[],voices=[];
 const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,title:'',classList:{remove:value=>events.push(['remove',id,value])}});return nodes.get(id)};
 Object.assign(h,{window:{},AUDIO_CLASS:{BACKGROUND:"background-music"},document:{hidden:false,getElementById:node},musicOn:true,musicTimer:0,musicPlaybackSerial:0,sungMusicActive:true,wurstTransitioning:true,musicBus:{gain:{},disconnect:()=>events.push('disconnect')},musicSources:new Set([{stop:()=>events.push('stop-source')}]),
  clearTimeout:()=>{},setTimeout:(callback,delay)=>{scheduled.push({callback,delay});return scheduled.length},stopIntroMusic:()=>events.push('stop-intro'),sungMusicAudio:{pause:()=>events.push('pause-sung')},startMusic:()=>events.push('start-music'),updateHud:()=>events.push('hud'),stopPoliceChaseLoop:()=>events.push('stop-siren'),violationAlert:{},toast:Object.assign(()=>events.push('toast'),{t:0}),
  audio:{currentTime:0,createGain:()=>({gain:{value:0},connect:target=>target}),createBiquadFilter:()=>({frequency:{value:0},Q:{value:0},connect(){}})},masterOutput:()=>({}),audioTextActive:()=>false,musicDucked:false,amtMusicMuted:false,MUSIC_LEVEL:.4,INTRO_MUSIC_LEVEL:.7,SUNG_MUSIC_LEVEL:.7,SOUND_EFFECT_LEVEL:.8,AUDIO_MIX:{BACKGROUND:.22,ATTACK_SECONDS:.12,RELEASE_SECONDS:.4},
  rampIntroVolume:()=>{},rampSungVolume:()=>{},rampGain:(param,value)=>{param.value=value},soundEffectBus:{gain:{}},forcedTune:-1,currentTune:-1,eightBitTracksSinceSong:12,MUSIC_PLAYLIST:[0,1],nextVariant:()=>0,rememberVariant:()=>{},createMusicVoice(type,start,end,finished){const voice={type,start,end,finished};voices.push(voice);return voice},chip:()=>{},stamp:()=>{},midiFreq:note=>note,playSungMusic:()=>events.push('sung'),jwd:{allocated:true,tour:null,met:new Set()},jwdLane:{x:0,y:0,w:100,h:100}});
 vm.runInContext(source.slice(source.indexOf('const erikaA=['),source.indexOf('state.neighborLevel=document.'))+['releaseMusicBus','setNeighborLevelActive','updateLawRelease','currentMusicLevel','applyAudioDucking','createMusicBus','nextTune','scheduleTheme','schedulePlaylistItem','neighborActivityActive','citySpeechAllowed','wanted','spawnPolice','arrestPlayer','softWarn','violationAlert','useLawPower','policeSirenCars'].map(fn).join('\n'),h);
 return {h,nodes,events,scheduled,voices};
}

test('neighbor entry clears enforcement, cancels old music and leaves notices reusable',()=>{
 const {h,events,nodes}=fixture();h.state.wanted=4;h.state.runTimer=6;h.state.roadWarned=true;
 const car={x:800,y:420,angle:0};h.policeVehicles.push(car);h.police.push({x:100,y:100});
 h.setNeighborLevelActive(true);
 assert.equal(h.state.wanted,0);assert.equal(h.police.length,0);assert.equal(h.state.runTimer,0);assert.equal(h.state.roadWarned,false);
 assert.equal(car.retiring,true);assert.equal(h.policeVehicles.includes(car),true,'cars remain solid and physically drive out');
 assert.equal(nodes.get('violation-alert').hidden,true);assert.equal(nodes.get('toast').hidden,false);
 assert.ok(events.includes('stop-source'));assert.ok(events.includes('pause-sung'));assert.ok(events.includes('start-music'));
 const count=events.length;h.setNeighborLevelActive(true);assert.equal(events.length,count,'frames do not restart music');
 h.setNeighborLevelActive(false);assert.equal(h.currentMusicLevel(),.14,'unfinished chapter stays protected');h.jwd.met=new Set(['one','two','three']);h.setNeighborLevelActive(false);assert.equal(h.currentMusicLevel(),.4);
});

test('neighbor enforcement cannot raise stars, arrest, warn, spawn or dispatch after introductions',()=>{
 const {h,events}=fixture();h.state.neighborLevel=true;h.state.lawUnlocked=true;h.jwd.met=new Set(['one','two','three']);
 const before={x:h.player.x,y:h.player.y,energy:h.player.energy};
 h.wanted(5,'RASEN',true);h.spawnPolice(4);h.arrestPlayer();h.softWarn('SPRINT');h.violationAlert('RASEN',5);h.useLawPower();
 assert.equal(h.state.wanted,0);assert.equal(h.police.length,0);assert.equal(h.policeVehicles.length,0);
 assert.deepEqual({x:h.player.x,y:h.player.y,energy:h.player.energy},before);
 assert.equal(h.citySpeechAllowed('police'),false);assert.equal(h.citySpeechAllowed('dialogue'),true);
 assert.deepEqual(Array.from(h.policeSirenCars()),[]);assert.deepEqual(events,[]);
});

test('anthem alone repeats beyond the sung-song threshold and keeps quieter dialogue ducking',()=>{
 const {h,scheduled,events,nodes,voices}=fixture();h.state.neighborLevel=true;h.sungMusicActive=false;h.musicBus=null;
 for(let i=0;i<6;i++){h.schedulePlaylistItem();assert.equal(scheduled.length,i,'wall time alone cannot end the anthem');assert.equal(voices.length,(i+1)*3);voices.at(-1).finished()}
 assert.equal(scheduled.length,6);assert.ok(scheduled.every(item=>item.delay===10));
 assert.ok(nodes.get('mute').title.includes('Deutschlandlied'));assert.equal(events.includes('sung'),false);
 assert.equal(h.currentTune,1);assert.equal(h.musicBus.gain.value,.14);
 h.musicDucked=true;h.applyAudioDucking();assert.equal(h.musicBus.gain.value,.14*.22);
 h.musicDucked=false;h.applyAudioDucking();assert.equal(h.musicBus.gain.value,.14);
 h.state.neighborLevel=false;assert.equal(h.nextTune().title,'Erika');
});

test('music off survives both policy transitions without starting playback',()=>{
 const {h,events}=fixture();h.musicOn=false;h.setNeighborLevelActive(true);h.setNeighborLevelActive(false);
 assert.equal(events.includes('start-music'),false);assert.equal(h.musicOn,false);
});

test('cancelled escort returns on its actual path before restoring a curb-edge citizen route',()=>{
 for(const dt of [1/60,1/30,.1]){
  const {h}=fixture(),bounds={x:800,y:600,w:220,h:80},original={x:900,y:613};
  h.player.x=1500;h.player.y=1000;
  const n={x:900,y:570,arrested:true,lawPending:true,routeBounds:null,vx:0,vy:-85};h.npcs.push(n);
  const car={x:900,y:420,angle:0,lawPickup:{target:n,routeBounds:bounds,vx:12,vy:0,returnPath:[original,{x:900,y:600}]}};h.policeVehicles.push(car);
  h.setNeighborLevelActive(true);
  assert.equal(n.arrested,false);assert.equal(car.lawPickup,null);assert.equal(n.routeBounds,null);
  const blocker={x:900,y:610};h.npcs.push(blocker);
  for(let i=0;i<20;i++)h.updateLawRelease(n,dt);
  assert.ok(n.lawRelease,'occupied return path waits');assert.ok(h.dist(n.x,n.y,blocker.x,blocker.y)>=26);
  h.npcs.splice(h.npcs.indexOf(blocker),1);
  for(let t=0;t<3&&n.lawRelease;t+=dt)h.updateLawRelease(n,dt);
  assert.equal(n.lawRelease,null);assert.equal(n.lawPending,false);assert.equal(n.routeBounds,bounds);
  assert.equal(h.pedestrianRouteContains(n,n.x,n.y,13),true);assert.equal(n.vx,12);assert.equal(n.vy,0);
 }
});
