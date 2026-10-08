import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const game=readFileSync('game.js','utf8');
const queueSource=game.slice(game.indexOf('const assetQueue='),game.indexOf('const assets=Object.fromEntries'));
const doc={hidden:false},queue=vm.createContext({document:doc});
vm.runInContext(queueSource+';globalThis.api={queueAssetLoad,pumpAssetLoads,status:()=>({active:assetLoadActive,pending:assetQueue.length})}',queue);
let running=0,peak=0;const releases=[];
const jobs=Array.from({length:6},(_,i)=>queue.api.queueAssetLoad(()=>{running++;peak=Math.max(peak,running);return new Promise((resolve,reject)=>releases.push(()=>{running--;i===1?reject(Error('missing asset')):resolve(i)}))}));
const results=Promise.allSettled(jobs);
await new Promise(setImmediate);assert.equal(running,2);assert.equal(queue.api.status().pending,4);
doc.hidden=true;releases.splice(0).forEach(release=>release());await new Promise(setImmediate);
assert.equal(running,0,'hidden pages must stop admitting optional work');assert.equal(queue.api.status().pending,4);
doc.hidden=false;queue.api.pumpAssetLoads();await new Promise(setImmediate);
while(releases.length){releases.splice(0).forEach(release=>release());await new Promise(setImmediate)}
assert.equal((await results).filter(r=>r.status==='rejected').length,1);assert.equal(peak,2);assert.equal(queue.api.status().active,0);

// Run actual spatial admission and readiness against a near/far actor fixture.
const selection=game.slice(game.indexOf('function prepareNearbyNpcAssets()'),game.indexOf('\nconst npcSpriteAtlases='));
const requests=[],entries=new Map(),selectionDoc={hidden:false,body:{classList:{contains:()=>false}}};let clock=0;
const scope=vm.createContext({document:selectionDoc,window:{},performance:{now:()=>clock},player:{x:0,y:0},npcs:[{x:100,y:0,spriteKind:'near'},{x:4000,y:0,special:'far'}],npcSpriteAtlases:{near:{},far:{}},requestNpcSprite:kind=>{requests.push(kind);if(!entries.has(kind))entries.set(kind,{settled:false})},npcAssetLoads:entries});
vm.runInContext('const startupNpcKinds=new Set();let startupNpcsCaptured=false,lastNpcAdmission=-Infinity;'+selection+';globalThis.api={prepareNearbyNpcAssets,startupNpcAssetsReady}',scope);
scope.api.prepareNearbyNpcAssets();assert.deepEqual(requests,['near']);assert.equal(scope.api.startupNpcAssetsReady(),false);
entries.get('near').settled=true;assert.equal(scope.api.startupNpcAssetsReady(),true);
scope.player.x=3500;clock=100;scope.api.prepareNearbyNpcAssets();assert.deepEqual(requests,['near'],'spatial scans must be bounded to 4 Hz');
clock=260;scope.api.prepareNearbyNpcAssets();assert.deepEqual(requests,['near','far'],'approaching an actor must request its accepted atlas');
scope.window.Germany3D={isWorldPointVisible:()=>false};scope.window.BuergeramtLevel={active:true};clock=600;scope.api.prepareNearbyNpcAssets();assert.equal(requests.length,2,'office play must not admit city character work');

// A Start shortcut during loading must not advance the game early.
const startup=game.slice(game.indexOf('let pendingStart=null,'),game.indexOf('\nlet faxFeedCue='));
let ready=false,started=0;const button={disabled:true,textContent:'LÄDT …',getAttribute(){return 'true'},setAttribute(){}},intro={classList:{contains:()=>false,add(){}}};
const gate=vm.createContext({window:{Germany3D:{get startupReady(){return ready},prepareNearbyAssets(){}}},state:{started:false},document:{getElementById:id=>id==='start'?button:intro},prepareNearbyNpcAssets(){},startupNpcAssetsReady:()=>ready,ensureAudio(){},startMusic(){},prepareRecording:async()=>{},FAX_FEED_AUDIO:'fax',regionOf:()=>'',player:{y:0},finishHumorCertification:()=>started++,humorModal:{hidden:true},renderHumorPage(){}});
vm.runInContext(startup+';globalThis.api={startGame,refreshStartup}',gate);
gate.api.startGame(true);assert.equal(started,0);assert.equal(button.disabled,true);
ready=true;gate.api.refreshStartup();assert.equal(started,1);assert.equal(button.disabled,false);assert.equal(button.textContent,'SPIEL STARTEN');
gate.api.refreshStartup();assert.equal(started,1,'loading completion must consume a pending Start exactly once');

// Execute the production HUD function: unchanged displayed values cause no writes.
const hudSource=game.slice(game.indexOf('function updateHud(){'),game.indexOf('\nfunction openDialogue'));
let writes=0;const node=()=>new Proxy({classList:{toggle(){writes++}},style:new Proxy({setProperty(){writes++}},{set(o,k,v){writes++;o[k]=v;return true}}),parentElement:{setAttribute(){writes++}},setAttribute(){writes++},appendChild(){writes++}}, {set(o,k,v){writes++;o[k]=v;return true}});
const nodes=new Map(),hud=vm.createContext({state:{wanted:0,offence:'clear',lang:'de',mission:0,stadtbild:0,forms:0,pfand:0,day:1,rule:0,germanness:0,lawUnlocked:false,lawCooldown:0,wurstBadges:new Set()},player:{energy:100},missions:[{title:'task',text:'text'}],rules:[['id','rule']],GERMANNESS_MAX:100,LAW_POWER_THRESHOLD:50,localize:s=>s,renderWurstBadges(){writes++},document:{getElementById:id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},querySelector:()=>node(),createElement:()=>node()}});
vm.runInContext(hudSource+';globalThis.updateHud=updateHud',hud);hud.updateHud();const initial=writes;assert.ok(initial>0);
for(let i=0;i<100;i++)hud.updateHud();assert.equal(writes,initial);
hud.player.energy=99.8;hud.updateHud();assert.equal(writes,initial,'fractional energy that displays identically must not rebuild HUD');
hud.state.wanted=2;hud.updateHud();assert.ok(writes>initial,'a displayed change must still update immediately');

// Hidden-tab cleanup stops all scheduled background music without changing user preference.
const musicHandler=game.slice(game.indexOf('document.addEventListener("visibilitychange",()=>{\n if(document.hidden){backgroundWasPlaying'),game.indexOf('\nconst humorModal='));
assert.ok(musicHandler.startsWith('document.addEventListener'));
let handler,stops=0,pauses=0,resumes=0;const musicDoc={hidden:true,addEventListener:(_,fn)=>handler=fn};
const music=vm.createContext({document:musicDoc,backgroundWasPlaying:false,musicBus:{disconnect(){}},sungMusicActive:false,introMusicAudio:{paused:false,pause(){pauses++}},sungMusicAudio:{pause(){pauses++}},musicPlaybackSerial:0,wurstTransitioning:false,musicTimer:1,introRampFrame:1,sungRampFrame:2,musicSources:new Set([{stop(){stops++}},{stop(){stops++}}]),clearTimeout(){},cancelAnimationFrame(){},startMusic(){resumes++}});
vm.runInContext(musicHandler,music);handler();assert.equal(stops,2);assert.equal(pauses,2);assert.equal(music.musicSources.size,0);assert.equal(music.musicBus,null);
musicDoc.hidden=false;handler();assert.equal(resumes,1);handler();assert.equal(resumes,1);

// A decode completed after the tab is hidden cannot start a siren.
const siren=game.match(/function startPoliceChaseLoop\(\)\{[^\n]+/)[0];let complete,sourceCreates=0;
const sirenDoc={hidden:false},sirenScope=vm.createContext({document:sirenDoc,policeChaseSource:null,policeChaseLoading:false,audio:{},prepareRecording:()=>new Promise(resolve=>complete=resolve),POLICE_CHASE_SIREN_AUDIO:'siren',state:{started:true,modal:false,gameOver:false,wanted:2},policeVehicles:[{}],ensureAudio:()=>({createBufferSource(){sourceCreates++}})});
vm.runInContext(siren+';startPoliceChaseLoop()',sirenScope);sirenDoc.hidden=true;complete({});await new Promise(setImmediate);assert.equal(sourceCreates,0);assert.equal(sirenScope.policeChaseLoading,false);

console.log('PASS: two-job admission, selective preloading, Start readiness, unchanged HUD and hidden background cleanup');
