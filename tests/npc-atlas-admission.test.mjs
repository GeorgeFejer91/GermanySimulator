import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const world=readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
const admission=game.slice(game.indexOf('function prepareNearbyNpcAssets()'),game.indexOf('\nconst npcSpriteAtlases='));
const ownership=world.slice(world.indexOf('  function registeredStreetPaint(actor){'),world.indexOf('  function readyStreetReactionView(actor){'));

function fixture(actors){
  const requests=[],entries=new Map(),meshes=new Map();
  const scope=vm.createContext({
    document:{hidden:false,body:{classList:{contains:()=>false}}},window:{},performance:{now:()=>scope.clock},clock:0,
    player:{x:0,y:0},npcs:actors,npcSpriteAtlases:{towelMan:{},towelWoman:{},bayern:{}},npcAssetLoads:entries,
    requestNpcSprite:kind=>{requests.push(kind);entries.set(kind,{settled:true})},npcMeshes:meshes,
    cityModelsEnabled:()=>scope.enabled,enabled:true,jobcenter:{active:false},buildingLevels:{office:null},
    resolveStreetCharacter:actor=>actor.voiceId,
  });
  scope.bridge={player:scope.player,getPolice:()=>[]};
  vm.runInContext('let streetPaintManifest=null,streetPaintManifestError=null;const startupNpcKinds=new Set();let startupNpcsCaptured=false,lastNpcAdmission=-Infinity,pendingNeighborEntry=false;'+ownership+admission+';globalThis.api={prepareNearbyNpcAssets,startupNpcAssetsReady,npcSpriteRequired};',scope);
  function renderer(){scope.window.Germany3D={npcSpriteRequired:scope.api.npcSpriteRequired,isWorldPointVisible:()=>false}}
  function manifest(){vm.runInContext('streetPaintManifest={own:{standing:{file:"own.webp"}}}',scope)}
  function paint(actor,status){meshes.set(actor,{userData:{streetPaintView:{paint:{inspect:()=>status}}}})}
  function scan(){scope.clock+=260;scope.api.prepareNearbyNpcAssets()}
  return {scope,requests,entries,meshes,renderer,manifest,paint,scan};
}

const own=()=>({x:100,y:0,voiceId:'own',spriteKind:'towelMan'});

test('early controller call and unresolved real renderer manifest cannot capture an empty ready set',()=>{
  const f=fixture([own()]);f.scan();assert.deepEqual(f.requests,[]);assert.equal(f.scope.api.startupNpcAssetsReady(),false);
  f.renderer();f.scan();assert.deepEqual(f.requests,[]);assert.equal(f.scope.api.startupNpcAssetsReady(),false);
});

test('own pending paint holds startup, loaded standing suppresses only its redundant atlas',()=>{
  const actor=own(),special={x:100,y:0,special:'bayern'};
  const f=fixture([actor,special]);f.renderer();f.manifest();const status={loaded:false,failed:false,retired:false};f.paint(actor,status);
  f.scan();assert.deepEqual(f.requests,['bayern']);assert.equal(f.scope.api.startupNpcAssetsReady(),false);
  status.loaded=true;f.scan();assert.deepEqual(f.requests,['bayern','bayern']);assert.equal(f.scope.api.startupNpcAssetsReady(),true);
  status.failed=true;assert.equal(f.scope.api.npcSpriteRequired(actor),false,'failed optional motion must retain already loaded standing');
});

test('own standing failure during direct-neighbor preparation still admits and waits for legacy fallback',()=>{
  const actor=own(),f=fixture([actor]);f.renderer();f.manifest();const status={loaded:false,failed:false};f.paint(actor,status);
  vm.runInContext('pendingNeighborEntry=true',f.scope);f.scan();assert.equal(f.scope.api.startupNpcAssetsReady(),false);
  status.failed=true;f.scan();assert.deepEqual(f.requests,['towelMan']);assert.equal(f.scope.api.startupNpcAssetsReady(),true);
  f.entries.get('towelMan').settled=false;assert.equal(f.scope.api.startupNpcAssetsReady(),false);
});

test('dedicated tourists, specials, unregistered actors and manifest failure preserve atlas admission',()=>{
  const actors=[{x:100,y:0,voiceId:'tourist-guenther-liegestuhl',spriteKind:'towelMan'},
    {x:100,y:0,voiceId:'touristin-walburga-handtuch',spriteKind:'towelWoman'},
    {x:100,y:0,special:'bayern'}, {x:100,y:0,voiceId:'unknown',spriteKind:'towelMan'}];
  const f=fixture(actors);f.renderer();f.manifest();f.scan();assert.deepEqual(f.requests,['towelMan','towelWoman','bayern','towelMan']);
  vm.runInContext('streetPaintManifest=null;streetPaintManifestError="network failure"',f.scope);
  assert.equal(f.scope.api.npcSpriteRequired(own()),true);
});

test('registered actors outside actual paint residency retain procedural body without broadening paint admission',()=>{
  const actor=own(),f=fixture([actor]);f.renderer();f.manifest();f.scan();assert.deepEqual(f.requests,[]);
  assert.equal(f.scope.api.startupNpcAssetsReady(),true);
  f.scope.enabled=false;assert.equal(f.scope.api.npcSpriteRequired(actor),true);
});

test('distance, bounded scans, hidden/office guards and direct-neighbor selected-kind restriction remain live',()=>{
  const actor={x:100,y:0,special:'bayern'},far={x:4000,y:0,spriteKind:'towelWoman'},f=fixture([actor,far]);f.renderer();f.manifest();
  vm.runInContext('pendingNeighborEntry=true',f.scope);f.scan();assert.deepEqual(f.requests,['bayern']);
  f.scope.player.x=3500;f.scan();assert.deepEqual(f.requests,['bayern'],'unselected direct-neighbor kind remains held');
  vm.runInContext('pendingNeighborEntry=false',f.scope);f.scan();assert.deepEqual(f.requests,['bayern','towelWoman']);
  f.scope.api.prepareNearbyNpcAssets();assert.equal(f.requests.length,2,'250 ms scan limit');
  f.scope.document.hidden=true;f.scan();assert.equal(f.requests.length,2);
  f.scope.document.hidden=false;f.scope.window.BuergeramtLevel={active:true};f.scan();assert.equal(f.requests.length,2);
});

test('late paint failure after frozen neighbor capture admits fallback when preparation ends',()=>{
 const actor=own(),f=fixture([actor]);f.renderer();f.manifest();
 vm.runInContext('pendingNeighborEntry=true',f.scope);f.scan();
 assert.equal(f.scope.api.startupNpcAssetsReady(),true);assert.deepEqual(f.requests,[]);
 f.paint(actor,{loaded:false,failed:true});f.scan();
 assert.deepEqual(f.requests,[],'captured neighbor kind set remains bounded');
 vm.runInContext('pendingNeighborEntry=false',f.scope);f.scan();
 assert.deepEqual(f.requests,['towelMan'],'normal scan restores the real failed-paint fallback path');
});

for(const initiallyFailed of [true,false])test(`legacy body replacement retains the same ${initiallyFailed?'failed':'pending'} standing view and releases it only when the actor retires`,()=>{
  const actor=own(),f=fixture([actor]);f.renderer();f.manifest();
  const status={loaded:false,failed:false,retired:false};f.paint(actor,status);
  f.scan();assert.equal(f.scope.api.startupNpcAssetsReady(),false);
  let disposed=0;
  const old=f.meshes.get(actor),view=old.userData.streetPaintView;
  Object.assign(view,{actor,id:'own',host:{},fallbackVisible:true,paint:{inspect:()=>status,dispose(){disposed++;status.retired=true}}});
  old.visible=true;old.traverse=()=>{};
  status.failed=initiallyFailed;
  const replacement={userData:{towelManSprite:true},visible:true,traverse(){}};
  Object.assign(f.scope,{scene:{add(){},remove(){}},npcSprite:()=>replacement,cancelPaintedStreetReaction(){},policeMeshes:new Map()});
  const release=world.slice(world.indexOf('  function releaseStreetPaint(root){'),world.indexOf('  function forEachStreetBody(visit){'));
  const retire=world.slice(world.indexOf('  function retireNpcMesh(q){'),world.indexOf('  addEventListener("pagehide"'));
  const body=world.slice(world.indexOf('      let q=npcMeshes.get(n),kind=n.special||n.spriteKind;'),world.indexOf('      if(syncStreetPaint(q,n,presentationDt))return;'));
  vm.runInContext(release+retire+';globalThis.replaceBody=n=>{'+body+'};globalThis.retireBody=retireNpcMesh;',f.scope);
  f.scope.replaceBody(actor);
  assert.equal(f.meshes.get(actor),replacement);
  assert.equal(replacement.userData.streetPaintView,view,'replacement must retain the existing terminal image result instead of creating a new pending job');
  assert.equal(old.userData.streetPaintView,undefined);
  assert.equal(disposed,0,'body replacement must not retire the same actor’s standing lease');
  assert.equal(f.scope.api.npcSpriteRequired(actor),initiallyFailed?true:null);
  if(!initiallyFailed)status.loaded=true;
  f.scan();assert.deepEqual(f.requests,initiallyFailed?['towelMan']:[]);assert.equal(f.scope.api.startupNpcAssetsReady(),true);
  f.scope.retireBody(replacement);
  assert.equal(disposed,1);assert.equal(replacement.userData.streetPaintView,undefined);
});
