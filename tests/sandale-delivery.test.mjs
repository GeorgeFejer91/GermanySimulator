import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const game=readFileSync('game.js','utf8');
function declaration(name){const start=game.indexOf('function '+name+'('),end=game.indexOf('\n}',start);return game.slice(start,end+2)}

test('Sandale movement delivery is verified separately and each consumer gets a fresh image lease',async()=>{
 const requests=[],scope={Uint8Array,DataView,Blob,URL,crypto:crypto.webcrypto,location:{href:'http://localhost/'},fetch:async url=>{
  const path=new URL(url,'http://localhost/').pathname.slice(1);requests.push(path);const data=readFileSync(path);
  return {ok:true,json:async()=>JSON.parse(data),arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)};
 }};
 vm.runInNewContext(readFileSync('tourist-animation.js','utf8'),scope);
 for(const name of ['towelMan','towelWoman']){
  const url=`http://localhost/assets/tourists/${name}/manifest.json`,m=JSON.parse(readFileSync(`assets/tourists/${name}/manifest.json`));
  const first=await scope.TouristAnimations.load(url,{movementOnly:true});assert.equal(first.manifest.movementOnly,true);
  assert.equal(crypto.createHash('sha256').update(Buffer.from(await (await fetch(first.objectURL)).arrayBuffer())).digest('hex'),m.movement_delivery.sha256);
  URL.revokeObjectURL(first.objectURL);
  const second=await scope.TouristAnimations.load(url,{movementOnly:true});assert.notEqual(first.objectURL,second.objectURL);assert((await fetch(second.objectURL)).ok);URL.revokeObjectURL(second.objectURL);
  assert(!requests.includes(`assets/tourists/${name}/character-atlas.webp`),'initial movement must not download the full reaction atlas');
  const full=await scope.TouristAnimations.load(url);assert(!full.manifest.movementOnly);assert(requests.includes(`assets/tourists/${name}/character-atlas.webp`));URL.revokeObjectURL(full.objectURL);
  assert.equal(requests.filter(path=>path===`assets/tourists/${name}/movement-atlas.webp`).length,1);
 }
});

test('requested reactions wait for one queued full atlas and retain walking until its image is ready',async()=>{
 const requests=[],pending=[],oldImage={},full={interactions:{states:{waiting:{}}}},actor={spriteKind:'towelMan'};
 const entry={},atlas={tourist:{movementOnly:true,interactions:full.interactions},canvas:oldImage},assets={towelManSprite:oldImage};
 const scope=vm.createContext({npcAssetLoads:new Map([['towelMan',entry]]),npcSpriteAtlases:{towelMan:atlas},assets,assetSources:{towelManSprite:'manifest'},Image:class {},URL:{revokeObjectURL(){}},console,
  queueAssetLoad:task=>{requests.push(task);return Promise.resolve().then(task)},TouristAnimations:{load:async()=>({manifest:full,objectURL:'full'})},loadSpriteImage:()=>new Promise(resolve=>pending.push(resolve)),
  prepareTransparentSprite:kind=>{atlas.canvas=assets[kind+'Sprite']},CharacterInteractions:{request:n=>{n.interactionRequest='waiting';return true},advance:n=>{n.characterInteraction='waiting';return true}}});
 vm.runInContext(declaration('requestNpcInteractions')+game.slice(game.indexOf('function requestCharacterReaction('),game.indexOf('\n',game.indexOf('function updateCharacterReaction('))),scope);
 assert.equal(scope.requestCharacterReaction(actor,'waiting'),true);scope.requestCharacterReaction(actor,'waiting');await new Promise(setImmediate);
 assert.equal(requests.length,1);assert.equal(atlas.canvas,oldImage);assert.equal(scope.updateCharacterReaction(actor,.1),false);assert(!actor.characterInteraction);
 pending[0]();await entry.interactionsPromise;
 assert.notEqual(atlas.canvas,oldImage);assert.equal(atlas.tourist,full);assert.equal(scope.updateCharacterReaction(actor,.1),true);assert.equal(actor.characterInteraction,'waiting');
});
