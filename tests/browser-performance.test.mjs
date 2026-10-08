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
const diagnostic=readFileSync('3d.html','utf8');
const diagnosticLoop=diagnostic.match(/function loop\(t\)\{[^\n]+?\}requestAnimationFrame/)?.[0].replace(/requestAnimationFrame$/,'');
assert.ok(diagnosticLoop);
let diagnosticUpdates=0,diagnosticRenders=0;
const diagnosticDocument={hidden:true};
const runDiagnostic=new Function('document','window','requestAnimationFrame','update',`let last=0;${diagnosticLoop};return loop`)(diagnosticDocument,{Germany3D:{sync:()=>diagnosticRenders++}},()=>{},()=>diagnosticUpdates++);
runDiagnostic(1000);assert.equal(diagnosticUpdates,0);assert.equal(diagnosticRenders,0);
diagnosticDocument.hidden=false;runDiagnostic(1017);runDiagnostic(1018);
assert.equal(diagnosticUpdates,1);assert.equal(diagnosticRenders,1,'diagnostic obeys the same hidden/refresh work contract');
assert.match(diagnostic,/addEventListener\("blur",clearInput\)/);
const game=readFileSync('game.js','utf8'),world=readFileSync('world3d.js','utf8');
assert.match(game,/if\(atlas\.tourist\)\{atlas\.canvas=img\}/,'accepted images must not be copied into a second full RGBA atlas');
assert.match(world,/antialias:false/,'default renderer must avoid multisample buffer cost');
const resize=world.match(/function resize\(\)\{[^\n]+?\}/)?.[0];
assert.ok(resize);
for(const [width,height,dpr] of [[390,844,3],[844,390,2],[1280,800,2],[3840,2160,2]]){
 let ratio,size;
 new Function('renderer','camera','amtCamera','innerWidth','innerHeight','devicePixelRatio',resize+';resize()')({setPixelRatio:v=>ratio=v,setSize:(w,h)=>size=[Math.floor(w*ratio),Math.floor(h*ratio)]},{updateProjectionMatrix(){}},{updateProjectionMatrix(){}},width,height,dpr);
 assert.ok(size[0]*size[1]<=1600000);assert.ok(ratio<=1);
}

// Execute the production cache against a controlled decoder, not a copy of it.
const prepare=game.match(/function prepareRecording\(url\)\{[^\n]+\}/)?.[0];assert.ok(prepare);
const cache=new Map(),requests=[],api=new Function('recordingPromises','ensureAudio','fetch',prepare+';return prepareRecording')(cache,()=>({decodeAudioData:async()=>({length:2*1024*1024,numberOfChannels:1})}),async url=>{requests.push(url);return{ok:url!=='fail',arrayBuffer:async()=>new ArrayBuffer(1)}});
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
