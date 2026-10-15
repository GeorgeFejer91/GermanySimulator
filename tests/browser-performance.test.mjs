import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

let deliveryBytes=0,masterPixels=0;
const families={characters:['merkel','bayern','alice','borderPourer'],tourists:['towelMan','towelWoman']};
for(const [family,kinds] of Object.entries(families))for(const kind of kinds){
 const dir=`assets/${family}/${kind}/`,manifest=JSON.parse(readFileSync(dir+'manifest.json')),delivery=manifest.delivery;
 assert.ok(delivery,kind+' has a bounded delivery record');
 const bytes=readFileSync(dir+delivery.image);
 assert.equal(bytes.length,delivery.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),delivery.sha256);
 assert.equal(delivery.source_sha256,manifest.sha256);assert.ok(bytes.length<statSync(dir+manifest.image).size);
 assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,16),'WEBPVP8L');
 const bits=bytes.readUInt32LE(21);assert.deepEqual([(bits&0x3fff)+1,((bits>>>14)&0x3fff)+1],manifest.image_size);
 deliveryBytes+=bytes.length;masterPixels+=manifest.image_size[0]*manifest.image_size[1];
}
assert.ok(deliveryBytes<=10_100_000,'accepted character delivery cannot grow above 10.1 MB');
const compatibility=readFileSync('3d.html','utf8');
assert.doesNotMatch(compatibility,/requestAnimationFrame\(|function loop\(|addEventListener\(/,"compatibility entry must not add simulation, rendering or input work");
const game=readFileSync('game.js','utf8'),world=readFileSync('world3d.js','utf8');
const placardFontSource=world.slice(world.indexOf('  const placardFontLoad='),world.indexOf('  function buildingPlacard('));
async function preparePlacardFont(existingFaces,{failed=false,cssFailed=false}={}){
 const downloads=[],added=[],jobs=[];
 const ready=vm.runInNewContext(placardFontSource+';placardFontReady',{
  document:{fonts:{load:async()=>{if(cssFailed)throw new Error('CSS font unavailable');return existingFaces},add:font=>added.push(font)}},
  FontFace:class{constructor(family,url,descriptors){Object.assign(this,{family,url,descriptors})}load(){downloads.push(this.url);return failed?Promise.reject(new Error('font unavailable')):Promise.resolve(this)}},
  bridge:{queueAssetLoad:task=>new Promise((resolve,reject)=>jobs.push(()=>Promise.resolve().then(task).then(resolve,reject)))}
 });
 assert.equal(jobs.length,1,'font preparation retains shared admission');
 assert.equal(downloads.length,0,'preparation cannot start outside the queue');
 await jobs[0]();return {ready:await ready,downloads,added};
}
const sharedFont=await preparePlacardFont([{family:'Grenze',weight:'100 900'}]);
assert.equal(sharedFont.ready,true);assert.equal(sharedFont.downloads.length,0,'reuse the CSS face without another font download');assert.equal(sharedFont.added.length,0);
const standaloneFont=await preparePlacardFont([]);
assert.equal(standaloneFont.ready,true);assert.equal(standaloneFont.downloads.length,1,'standalone diagnostic prepares its missing face once');assert.equal(standaloneFont.added.length,1);assert.equal(standaloneFont.added[0].family,'Grenze');assert.equal(standaloneFont.added[0].descriptors.weight,'100 900');
const failedCssFont=await preparePlacardFont([],{cssFailed:true});
assert.equal(failedCssFont.ready,true);assert.equal(failedCssFont.downloads.length,1);assert.equal(failedCssFont.added.length,1,'unavailable CSS face still permits the original local face');
const failedFont=await preparePlacardFont([],{failed:true});
assert.equal(failedFont.ready,false);assert.equal(failedFont.downloads.length,1);assert.equal(failedFont.added.length,0,'failed face keeps the existing fallback');
assert.match(game,/if\(atlas\.tourist\)\{atlas\.canvas=img\}/,'accepted images must not be copied into a second full RGBA atlas');
assert.match(world,/antialias:false/,'default renderer must avoid multisample buffer cost');
const resize=world.match(/function resize\(\)\{[^\n]+?\}/)?.[0];
assert.ok(resize);
for(const [width,height,dpr] of [[390,844,3],[844,390,2],[1280,800,2],[3840,2160,2]]){
 let ratio,size,hudLayouts=0;
 new Function('renderer','camera','amtCamera','innerWidth','innerHeight','devicePixelRatio','layoutMissionPointer',resize+';resize()')({setPixelRatio:v=>ratio=v,setSize:(w,h)=>size=[Math.floor(w*ratio),Math.floor(h*ratio)]},{updateProjectionMatrix(){}},{updateProjectionMatrix(){}},width,height,dpr,()=>hudLayouts++);
 assert.ok(size[0]*size[1]<=1600000);assert.ok(ratio<=1);
 assert.equal(hudLayouts,1,'resize also refreshes the separately tested mission HUD layout');
}

// Execute the production cache against a controlled decoder, not a copy of it.
const prepare=game.match(/function prepareRecording\(url\)\{[^\n]+\}/)?.[0];assert.ok(prepare);
const cache=new Map(),requests=[],api=new Function('recordingPromises','ensureAudio','fetch','queueAssetLoad',prepare+';return prepareRecording')(cache,()=>({decodeAudioData:async()=>({length:2*1024*1024,numberOfChannels:1})}),async url=>{requests.push(url);return{ok:url!=='fail',arrayBuffer:async()=>new ArrayBuffer(1)}},task=>Promise.resolve().then(task));
const first=await api('a');await api('b');assert.equal(await api('a'),first);await api('c');
assert.deepEqual([...cache.keys()],['a','c'],'evict least recently used decoded audio at 16 MiB');
await api('b');assert.equal(requests.filter(url=>url==='b').length,2,'evicted audio remains replayable');
await assert.rejects(api('fail'));assert.ok(!cache.has('fail'),'failed downloads must be retryable');

// Missing/corrupt delivery falls back to the accepted PNG, preserving the cast.
const png=readFileSync('assets/characters/merkel/character-atlas.png'),manifest=JSON.parse(readFileSync('assets/characters/merkel/manifest.json'));
const fallbackRequests=[],scope={Uint8Array,DataView,Blob,URL,crypto:globalThis.crypto,location:{href:'http://localhost/'},console:{warn(){}},fetch:async url=>{fallbackRequests.push(String(url));if(String(url).endsWith('manifest.json'))return{ok:true,json:async()=>manifest};if(String(url).endsWith('.webp'))return{ok:false,status:404};return{ok:true,arrayBuffer:async()=>png.buffer.slice(png.byteOffset,png.byteOffset+png.byteLength)}}};
vm.runInNewContext(readFileSync('tourist-animation.js','utf8'),scope);
const payload=await scope.TouristAnimations.load('http://localhost/manifest.json');
const result=Buffer.from(await(await fetch(payload.objectURL)).arrayBuffer());URL.revokeObjectURL(payload.objectURL);
assert.deepEqual(result,png);assert.equal(fallbackRequests.length,3);
console.log(`PASS: ${(deliveryBytes/1e6).toFixed(2)} MB exact delivery; ${(masterPixels*4/1048576).toFixed(1)} MiB of redundant RGBA canvas copies avoided; bounded renderer/audio and PNG fallback`);
