import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import {createHash,webcrypto} from 'node:crypto';

const scope=vm.createContext({});
for(const file of ['tourist-animation.js','character-interactions.js'])vm.runInContext(readFileSync(file,'utf8'),scope);
const animation=scope.TouristAnimations,reactions=scope.CharacterInteractions;
const manifest=JSON.parse(readFileSync('assets/tourists/towelMan/manifest.json','utf8'));

test('dense walks use every source phase and keep their heading when blocked',()=>{
 const dense=structuredClone(manifest);
 for(const walk of Object.values(dense.walks))walk.frames=16;
 const actor={spriteFrame:0};
 animation.request(actor,0,-1,dense);
 const frames=[];
 for(let i=0;i<16;i++){
  animation.advance(actor,dense.cycle_distance/16,1/60,dense);
  frames.push(actor.spriteFrame);
 }
 assert.deepEqual([...new Set(frames)].sort((a,b)=>a-b),Array.from({length:16},(_,i)=>i));
 const held={phase:actor.gaitDistance,row:actor.spriteRow,frame:actor.spriteFrame};
 animation.request(actor,0,0,dense);
 animation.advance(actor,0,.1,dense);
 assert.equal(actor.touristRequested,'up');
 assert.deepEqual({phase:actor.gaitDistance,row:actor.spriteRow,frame:actor.spriteFrame},held);
});

test('a dense walk settles through its remaining phases before the planted reaction',()=>{
 const dense=structuredClone(manifest);
 dense.walks.down.frames=16;dense.walks.down.frame_ms=60;
 const actor={touristFacing:'down',spriteFrame:12};
 assert(reactions.request(actor,'idle',dense));
 const plan=reactions.plan(actor,dense,actor.interactionRequest);
 assert.deepEqual(Array.from(plan.frames.slice(0,3),frame=>[frame.row,frame.col,frame.ms]),[[0,13,60],[0,14,60],[0,15,60]]);
 const original={...actor};
 reactions.advance(actor,0,dense);
 const frame=actor.spriteFrame,age=actor.characterInteraction.elapsed;
 reactions.advance(actor,0,dense);
 assert.equal(actor.spriteFrame,frame);assert.equal(actor.characterInteraction.elapsed,age);
 assert.equal(actor.x,original.x);assert.equal(actor.y,original.y);
 let steps=0;
 while(actor.characterInteraction&&steps++<2000)reactions.advance(actor,.01,dense);
 assert(steps<2000,'one-shot settles, reacts and releases movement');
 assert.equal(actor.spriteFrame,0);assert.equal(actor.gaitDistance,0);assert.equal(actor.touristFacing,'down');
});

test('the player stays 3D, officers own their painted fallback host, and Sandales cannot enter the mesh study',()=>{
 const world=readFileSync('world3d.js','utf8');
 assert.match(world,/const playerMesh=character\("player"\)/);
 assert.match(world,/const root=character\("police"\)/,'officers retain a procedural host until paint is decoded');
 assert.match(world,/policePaint\.attach\(actor,root,/,'the dedicated police owner attaches the requested tier');
 assert.match(world,/policePaint\.detach\(p\);retireNpcMesh\(q\)/,'retiring an officer also releases its painted owner');
 assert.match(world,/if\(actor===bridge\.player\|\|bridge\.getPolice\(\)\.includes\(actor\)\|\|actor\.sandale\)return null/);
 assert.match(world,/if\(actor\.special\|\|actor\.jwdRole\|\|\['tourist-guenther-liegestuhl','touristin-walburga-handtuch'\]\.includes\(actor\.voiceId\)\)return null/);
 assert.match(world,/else if\(q\.userData\.grid\)syncAtlasSprite\(q,\{\.\.\.n,spriteFrame:q\.userData\.spriteFrame/,'an existing billboard stays on its own source cell while replacement artwork loads');
});

test('packed reactions use their registered neutral and source-column offsets',()=>{
 const packed=structuredClone(manifest);
 packed.interactions.neutral={row:4,col:2};
 delete packed.interactions.look;
 packed.interactions.states.look={row:9,col:7,durations_ms:[120]};
 const actor={touristFacing:'down',spriteFrame:7};
 assert(reactions.request(actor,'look',packed));
 const plan=reactions.plan(actor,packed,actor.interactionRequest);
 const reaction=Array.from(plan.frames.filter(frame=>frame.role==='reaction'),frame=>[frame.row,frame.col]);
 assert.deepEqual(reaction,[[4,2],[9,7],[4,2]]);
});

test('a route reversal plants immediately and completes one bounded settle/turn/start',()=>{
 const actor={x:10,y:20,touristFacing:'right',touristRequested:'right',spriteFrame:2,gaitDistance:manifest.cycle_distance*2/8};
 animation.request(actor,-1,0,manifest,{planted:true});
 assert(animation.isTurning(actor),'route owner must hold translation before opposite-heading travel');
 assert.deepEqual(Array.from(actor.touristTurn.frames,frame=>[frame.row,frame.col]),Array.from(manifest.transitions['right-to-left'].frames,frame=>[frame.row,frame.col]));
 assert(actor.touristTurn.frames.every(frame=>!Object.values(manifest.walks).some(walk=>walk.row===frame.row)),'a planted turn never advances ordinary walking cells');
 const phase=actor.gaitDistance;
 animation.advance(actor,0,0,manifest);
 assert.equal(actor.gaitDistance,phase);
 const turn=actor.touristTurn;
 animation.request(actor,-1,0,manifest,{planted:true});
 assert.equal(actor.touristTurn,turn,'repeated route requests cannot restart settling');
 let elapsed=0;
 while(animation.isTurning(actor)&&elapsed<5){animation.advance(actor,0,1/60,manifest);elapsed+=1/60}
 assert(elapsed<5);assert.equal(actor.touristFacing,'left');assert.equal(actor.spriteFrame,0);
 assert.equal(actor.x,10);assert.equal(actor.y,20);assert.equal(actor.gaitDistance,0);
});

test('selected mobile artwork avoids the desktop download and reloads with a fresh Blob URL',async()=>{
 const variants={},payloads={},requests=[];
 for(const [name,path] of [['desktop','assets/characters/neighbors/heiko.webp'],['mobile','assets/characters/neighbors/heiko-mobile.webp']]){
  const bytes=readFileSync(path),bits=bytes.readUInt32LE(21),width=(bits&0x3fff)+1,height=((bits>>>14)&0x3fff)+1;
  variants[name]={image:name+'.webp',sha256:createHash('sha256').update(bytes).digest('hex'),frame_size:[width,height],pivot:[width/2,height],image_size:[width,height]};
  payloads[name+'.webp']=bytes;
 }
 const variantManifest={cols:1,rows:1,variants,delivery:variants.desktop};
 const runtime=vm.createContext({Uint8Array,DataView,Blob,URL,crypto:webcrypto,innerWidth:390,location:{href:'http://localhost/'},fetch:async url=>{
  const name=new URL(url).pathname.slice(1);requests.push(name);
  return name==='manifest.json'?{ok:true,json:async()=>variantManifest}:{ok:true,arrayBuffer:async()=>{const bytes=payloads[name];assert(bytes,'only requested variant exists');return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}};
 }});
 vm.runInContext(readFileSync('tourist-animation.js','utf8'),runtime);
 const first=await runtime.TouristAnimations.load('http://localhost/manifest.json');
 assert.deepEqual(requests,['manifest.json','mobile.webp']);
 assert.deepEqual(first.manifest.pivot,variants.mobile.pivot);
 assert.deepEqual(first.manifest.frame_size,variants.mobile.frame_size);
 URL.revokeObjectURL(first.objectURL);
 const second=await runtime.TouristAnimations.load('http://localhost/manifest.json');
 assert.notEqual(first.objectURL,second.objectURL);
 assert.deepEqual(Buffer.from(await (await fetch(second.objectURL)).arrayBuffer()),payloads['mobile.webp']);
 URL.revokeObjectURL(second.objectURL);
 assert.deepEqual(requests,['manifest.json','mobile.webp'],'repeat leases reuse validated bytes without selecting desktop');
});
