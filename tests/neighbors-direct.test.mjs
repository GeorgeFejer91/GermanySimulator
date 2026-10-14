import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const startup=game.slice(game.indexOf('let pendingStart=null'),game.indexOf('function startGame(',game.indexOf('let pendingStart=null')));
function fixture(query='?geheim=nachbarn'){
 const classes=new Set(['preloading']),introClasses=new Set(),attributes=new Map(),progress=[];
 let hudUpdates=0,badge=false,npcReady=false;
 const h={URLSearchParams,location:{search:query},state:{started:false,mission:0,forms:0,germanness:0,modal:false},player:{x:2360,y:2320,vx:1,vy:1},jwd:{allocated:false,visited:false,met:new Set(),visit:0},anmeldungAwarded:false,
  jwdGardens:{gateAside:{x:1175,y:4540}},regionOf:()=> 'berlin',allocateJwdHome(){h.jwd.allocated=true},renderAnmeldungBadge(){badge=h.anmeldungAwarded},updateHud(){hudUpdates++},
  queueAssetLoad(){},prepareNearbyNpcAssets(){},startupNpcAssetsReady:()=>npcReady,localStorage:{setItem(){assert.fail('checkpoint must not write earned registration')}},
  document:{hidden:false,body:{classList:{contains:value=>classes.has(value)}},getElementById:id=>id==='intro'?{classList:{add:value=>introClasses.add(value),contains:value=>introClasses.has(value)}}:{setAttribute:(key,value)=>attributes.set(key,value),getAttribute:key=>attributes.get(key)}},
  window:{Germany3D:{ready:true,startupReady:false,prepareNearbyAssets(){},get startupStatus(){return {total:3,pending:3-this.neighborAssetStatus.settled}},neighborAssetStatus:{total:3,settled:0,failed:0}},Germany3DBridge:{characterAssetStatus:{required:[],settled:[]}},GermanyPreload:{prepareMenu(){},update(status){progress.push(status);if(status.ready)classes.delete('preloading')}}}};
 vm.createContext(h);vm.runInContext(startup+';if(pendingNeighborEntry)prepareNeighborsDirect();this.pending=()=>pendingNeighborEntry;',h);
 return {h,classes,introClasses,progress,get badge(){return badge},get updates(){return hudUpdates},npcReady:()=>npcReady=true};
}

test('neighbor URL prepares only this chapter and waits for three settled sprites plus city readiness',()=>{
 const f=fixture(),h=f.h;
 assert.deepEqual([h.player.x,h.player.y],[1175,4540]);assert.equal(h.state.started,false);assert.equal(h.state.modal,true);assert.equal(h.state.germanness,3);assert.equal(h.state.forms,1);assert.equal(h.state.mission,1);
 assert.equal(h.jwd.allocated,true);assert.equal(h.jwd.visited,true);assert.equal(h.jwd.met.size,0);assert.equal(f.badge,true);assert.ok(f.introClasses.has('hidden'));
 h.refreshStartup();assert.equal(f.progress.at(-1).total,3);assert.equal(h.pending(),true);
 h.window.Germany3D.startupReady=true;h.window.Germany3D.neighborAssetStatus.settled=2;f.npcReady();h.refreshStartup();assert.equal(h.state.started,false);
 h.window.Germany3D.neighborAssetStatus.settled=3;h.document.hidden=true;h.refreshStartup();assert.equal(h.state.started,false);
 h.document.hidden=false;h.refreshStartup();assert.equal(h.state.started,true);assert.equal(h.state.modal,false);assert.equal(h.pending(),false);
 const updates=f.updates;h.state.mission=4;for(let i=0;i<5;i++)h.refreshStartup();assert.equal(h.state.mission,4);assert.equal(f.updates,updates);
});

test('failed neighbor images settle to the existing fallback instead of trapping the direct entry',()=>{
 const f=fixture(),h=f.h;f.npcReady();h.window.Germany3D.startupReady=true;
 h.window.Germany3D.neighborAssetStatus={total:3,settled:3,failed:3};h.refreshStartup();assert.equal(h.state.started,true);assert.equal(f.classes.has('preloading'),false);
});

test('ordinary, office and unmatched URLs never allocate a neighbor checkpoint',()=>{
 for(const query of ['', '?geheim=buergeramt','?geheim=jobcenter','?geheim=nachbarn-extra']){
  const f=fixture(query),h=f.h;assert.equal(h.pending(),false);assert.equal(h.jwd.allocated,false);assert.equal(h.state.germanness,0);assert.deepEqual([h.player.x,h.player.y],[2360,2320]);assert.equal(f.badge,false);
 }
});

test('direct checkpoint holds unselected city character art until play starts',()=>{
 const requested=[],scope={document:{hidden:false,body:{classList:{contains:()=>false}}},window:{},performance:{now:()=>0},player:{x:0,y:0},npcs:[{x:100,y:0,spriteKind:'near'},{x:4000,y:0,spriteKind:'far'}],npcSpriteAtlases:{near:{},far:{}},npcAssetLoads:new Map(),requestNpcSprite:kind=>requested.push(kind)};
 const selection=game.slice(game.indexOf('function prepareNearbyNpcAssets()'),game.indexOf('\nconst npcSpriteAtlases='));
 vm.createContext(scope);vm.runInContext('const startupNpcKinds=new Set();let startupNpcsCaptured=false,lastNpcAdmission=-Infinity,pendingNeighborEntry=true;'+selection,scope);
 scope.prepareNearbyNpcAssets();assert.deepEqual(requested,['near']);
 scope.window.Germany3D={isWorldPointVisible:()=>true};scope.performance.now=()=>300;scope.prepareNearbyNpcAssets();assert.deepEqual(requested,['near','near']);
 vm.runInContext('pendingNeighborEntry=false',scope);scope.performance.now=()=>600;scope.prepareNearbyNpcAssets();assert.deepEqual(requested,['near','near','near','far']);
});
