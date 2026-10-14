import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {gzipSync} from 'node:zlib';

const productionVoices=JSON.parse(readFileSync('For-AI/VOICE-CAST.json')).productionVoices;
const binding=productionVoices['amt-brunhilde-knick'],policeBinding=productionVoices.kriminalpolizei;
const counterWords=['eins','zwei','drei','vier'];
function pcmWav(samples=4410,amplitude=4096){
 const bytes=new ArrayBuffer(44+samples*2),view=new DataView(bytes);
 const label=(at,text)=>{for(let i=0;i<text.length;i++)view.setUint8(at+i,text.charCodeAt(i))};
 label(0,'RIFF');view.setUint32(4,bytes.byteLength-8,true);label(8,'WAVE');label(12,'fmt ');
 view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,22050,true);
 view.setUint32(28,44100,true);view.setUint16(32,2,true);view.setUint16(34,16,true);label(36,'data');view.setUint32(40,samples*2,true);
 for(let i=0;i<samples;i++)view.setInt16(44+i*2,amplitude,true);return bytes;
}
function fixture({police=false}={}){
 const binding=productionVoices[police?'kriminalpolizei':'amt-brunhilde-knick'];
 const workers=[],timers=new Map(),document=new EventTarget(),window=new EventTarget(),urls=[],revoked=[];
 document.hidden=false;document.currentScript={src:'https://example.test/game/knick-speech.js',dataset:{voice:police?'kriminalpolizei':''}};
 let now=0,serial=0;
 class Worker{
  constructor(url){this.url=url.href;this.posts=[];workers.push(this)}
  postMessage(message){this.posts.push(structuredClone(message))}terminate(){this.terminated=true}
  model(bytes,extra={}){
   const receipt=structuredClone({kind:'model-buffer',bytes,profileId:binding.profileId,referenceSha256:binding.referenceSha256,...extra},
    {transfer:bytes instanceof ArrayBuffer?[bytes]:[]});this.onmessage({data:receipt});return receipt.bytes;
  }
  ready(extra={}){const {id,text}=this.posts.at(-1);this.onmessage({data:{id,text,status:'ready',wav:new ArrayBuffer(64),
    duration:4,profileId:binding.profileId,referenceSha256:binding.referenceSha256,...extra}})}
  batch(mutate=()=>{}){
   const {id,text}=this.posts.at(-1),counter=police?0:counterWords.findIndex(word=>text.endsWith(`, bitte zu Schalter ${word}!`));
   const name=police?'':text.slice(0,-(`, bitte zu Schalter ${counterWords[counter]}!`).length);
   const variants=(police?['']:counterWords).map((word,index)=>{const wav=pcmWav(4410,(index+1)*1024);return{
    text:police?text:`${name}, bitte zu Schalter ${word}!`,wav,duration:.2,sha256:createHash('sha256').update(new Uint8Array(wav)).digest('hex')
   }});
   const reply={id,text,status:'ready',...variants[counter],variants,profileId:binding.profileId,referenceSha256:binding.referenceSha256,generationMs:123};
   mutate(reply);this.onmessage({data:reply});return reply;
  }
 }
 class BrowserURL extends URL{
  static createObjectURL(blob){const url='blob:local/'+urls.length;urls.push({url,blob});return url}
  static revokeObjectURL(url){revoked.push(url)}
 }
 window.GermanySimulatorAudioText={productionVoices:{'amt-brunhilde-knick':police?{}:binding,kriminalpolizei:police?binding:{}}};
 const context=vm.createContext({document,window,Worker,URL:BrowserURL,Blob,ArrayBuffer,
  location:{href:'https://example.test/game/'},setTimeout(fn,ms){const id=++serial;timers.set(id,{at:now+ms,fn});return id},
  clearTimeout(id){timers.delete(id)}});
 vm.runInContext(readFileSync('knick-speech.js','utf8'),context);
 function tick(ms){const end=now+ms;while(true){const entry=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!entry)break;timers.delete(entry[0]);now=entry[1].at;entry[1].fn()}now=end}
 function visibility(hidden){document.hidden=hidden;document.dispatchEvent(new Event('visibilitychange'))}
 return{api:window[police?'GermanyKripoSpeech':'GermanyKnickSpeech'],workers,tick,visibility,window,document,context,urls,revoked};
}

test('boot, invalid input and a muted initial name download no model',async()=>{
 const h=fixture();h.tick(10000);assert.equal(h.workers.length,0);
 for(const [name,counter] of [['',1],['A',1],['A'.repeat(81),1],['Bad\nName',1],['Erika',0],['Erika',5]])assert.equal((await h.api.prepare(name,counter)).status,'failed');
 h.api.rememberName('Erika Mustermann',{warm:false});h.tick(1000);
 assert.equal(h.api.initialName,'Erika Mustermann');assert.equal(h.workers.length,0);
});

test('a prepared name reuses its clip, owns its blob lease and releases the idle worker',async()=>{
 const h=fixture(),first=h.api.prepare('Jürgen Müller',3),again=h.api.prepare('Jürgen Müller',3);
 assert.equal(first,again);h.tick(50);assert.equal(h.workers.length,1);
 assert.equal(h.workers[0].url,'https://example.test/game/knick-speech-worker.js?v=20261014-player-address');
 assert.equal(h.workers[0].posts.length,1);h.workers[0].ready();const ready=await first;
 assert.equal(ready.status,'ready');assert.equal(ready.text,'Jürgen Müller, bitte zu Schalter drei!');
 assert.equal(await h.api.prepare('Jürgen Müller',3),ready);assert.equal(h.workers[0].posts.length,1);
 const lease=h.api.lease(ready);assert.equal(lease.english,'Jürgen Müller, please go to counter 3!');
 lease.release();lease.release();assert.deepEqual(h.revoked,['blob:local/0']);
 h.tick(5000);assert.equal(h.workers[0].terminated,true);assert.equal(h.api.inspect().worker,false);
});

test('one warm worker post resolves all four exact counter variants without nested WAV retention',async()=>{
 const h=fixture();h.api.rememberName('Erika Mustermann');assert.equal(h.api.inspect().pending,4);
 const promises=counterWords.map((_,index)=>h.api.prepare('Erika Mustermann',index+1,false));let settled=0;
 for(const promise of promises)promise.then(()=>settled++);h.tick(50);h.workers[0].batch();await Promise.resolve();
 assert.equal(settled,4);assert.equal(h.api.inspect().pending,0);const completed=await Promise.all(promises);h.tick(50);
 assert.equal(h.workers.length,1);assert.equal(h.workers[0].posts.length,1);assert.equal(h.api.inspect().cached,4);
 for(let index=0;index<4;index++){
  const ready=completed[index];assert.equal(ready.status,'ready');assert.equal(ready.text,`Erika Mustermann, bitte zu Schalter ${counterWords[index]}!`);
  assert.equal(ready.english,`Erika Mustermann, please go to counter ${index+1}!`);
  assert.equal(ready.profileId,binding.profileId);assert.equal(ready.referenceSha256,binding.referenceSha256);
  assert.equal(ready.variants,undefined);assert.equal(ready.wav,undefined);assert(ready.blob instanceof Blob);
  assert.equal(new DataView(await ready.blob.arrayBuffer()).getInt16(44,true),(index+1)*1024);
  const lease=h.api.lease(ready);assert.equal(lease.voiceId,'amt-brunhilde-knick');assert.equal(lease.text,ready.text);lease.release();
 }
 assert.equal((await h.api.prepare('Erika Mustermann',2)).text,'Erika Mustermann, bitte zu Schalter zwei!');
 assert.equal(h.api.inspect().pending,0);
});

test('a prioritized same-name ticket selects its own counter from one batch',async()=>{
 const h=fixture();h.api.rememberName('Erika Mustermann');const ticket=h.api.prepare('Erika Mustermann',4);h.tick(50);
 assert.equal(h.workers[0].posts[0].text,'Erika Mustermann, bitte zu Schalter vier!');h.workers[0].batch();const ready=await ticket;
 assert.equal(new DataView(await ready.blob.arrayBuffer()).getInt16(44,true),4096);
 assert.equal(ready.english,'Erika Mustermann, please go to counter 4!');assert.equal(h.api.inspect().pending,0);
 h.tick(50);assert.equal(h.workers[0].posts.length,1);assert.equal(h.api.inspect().cached,4);
});

test('batch completion keeps a different visitor ticket ahead of more warming work',async()=>{
 const h=fixture();h.api.rememberName('Anna Müller');h.tick(50);const ticket=h.api.prepare('Hans Schmidt',2);
 h.workers[0].batch();assert.equal(h.api.inspect().pending,1);h.tick(50);
 assert.equal(h.workers[0].posts[1].text,'Hans Schmidt, bitte zu Schalter zwei!');h.workers[0].batch();
 assert.equal((await ticket).text,'Hans Schmidt, bitte zu Schalter zwei!');assert.equal(h.api.inspect().cached,8);
 assert.equal(h.workers[0].posts.length,2);assert.equal(h.api.inspect().pending,0);
});

test('batch caches stay bounded and never retain other counter WAV bundles',async()=>{
 const h=fixture();
 for(const name of ['Anna Müller','Hans Schmidt','Erika Mustermann']){
  const pending=h.api.prepare(name,1);h.tick(50);h.workers[0].batch();await pending;
  assert(h.api.inspect().cached<=8);
 }
 assert.equal(h.api.inspect().cached,8);assert.equal(h.api.peek('Anna Müller',1),null);assert.equal(h.workers[0].posts.length,3);
 for(const name of ['Hans Schmidt','Erika Mustermann'])for(let counter=1;counter<=4;counter++){
  const ready=h.api.peek(name,counter);assert.equal(ready.variants,undefined);assert.equal(ready.wav,undefined);assert(ready.blob instanceof Blob);
 }
});

test('malformed batches fail atomically without caching their earlier valid counter parts',async()=>{
 const malformed=[
  reply=>{reply.variants=null},reply=>{reply.variants.pop()},reply=>{reply.variants[2]=null},reply=>{delete reply.variants[2]},
  reply=>{reply.variants[1].text='Other Name, bitte zu Schalter zwei!'},
  reply=>{reply.variants[1].text=reply.variants[0].text},reply=>{reply.variants[1].wav=new Uint8Array(64)},
  reply=>{reply.variants[1].wav=new ArrayBuffer(0)},reply=>{reply.variants[1].wav=new ArrayBuffer(2*1024*1024+1)},
  reply=>{reply.variants[1].duration=NaN},reply=>{reply.variants[1].duration=0},reply=>{reply.variants[1].duration=21},
  reply=>{reply.variants[1].sha256='unverified'},reply=>{reply.profileId='other'},reply=>{reply.referenceSha256='0'.repeat(64)}
 ];
 for(const mutate of malformed){
  const h=fixture(),kept=h.api.prepare('Safe Name',1);h.tick(50);h.workers[0].ready();await kept;
  const pending=h.api.prepare('Erika Mustermann',1);h.tick(50);assert.doesNotThrow(()=>h.workers[0].batch(mutate));
  assert.equal((await pending).status,'failed');assert.equal(h.api.inspect().cached,1);assert.equal(h.urls.length,0);
  for(let counter=1;counter<=4;counter++)assert.equal(h.api.peek('Erika Mustermann',counter),null);
 }
});

test('the matching validated variant owns active audio even when top-level WAV metadata disagrees',async()=>{
 const h=fixture(),pending=h.api.prepare('Erika Mustermann',3);h.tick(50);
 const reply=h.workers[0].batch(result=>{result.wav=result.variants[0].wav;result.sha256=result.variants[0].sha256;result.duration=7});
 const ready=await pending;assert.equal(ready.text,'Erika Mustermann, bitte zu Schalter drei!');
 assert.equal(ready.sha256,reply.variants[2].sha256);assert.equal(ready.duration,.2);assert.equal(ready.generationMs,123);
 assert.equal(new DataView(await ready.blob.arrayBuffer()).getInt16(44,true),3072);assert.equal(ready.variants,undefined);
});

test('cancelled warm batches cannot return old-name variants after a replacement starts',async()=>{
 const h=fixture();h.api.rememberName('Anna Müller');h.tick(50);const old=h.workers[0];h.api.rememberName('Erika Mustermann');
 old.batch();assert.equal(h.api.inspect().cached,0);h.tick(50);old.batch();assert.equal(h.api.inspect().cached,0);
 h.workers[1].batch();h.tick(50);assert.equal(h.api.inspect().pending,0);assert.equal(h.api.inspect().cached,4);
 for(let counter=1;counter<=4;counter++)assert.equal(h.api.peek('Anna Müller',counter),null);
 assert.equal(h.workers[1].posts.length,1);
});

test('cancelled batch promises settle and late four-part receipts stay discarded',async()=>{
 for(const retire of [h=>h.api.cancelPreparation(),h=>h.window.dispatchEvent(new Event('pagehide'))]){
  const h=fixture();h.api.rememberName('Anna Müller');const promises=counterWords.map((_,index)=>h.api.prepare('Anna Müller',index+1,false));
  h.tick(50);const old=h.workers[0];retire(h);old.batch();
  assert((await Promise.all(promises)).every(result=>result.status==='disabled'));
  assert.equal(h.api.inspect().cached,0);assert.equal(h.api.inspect().pending,0);assert.equal(old.terminated,true);
 }
});

test('hidden pages stop inference and reject late results from the previous worker',async()=>{
 const h=fixture(),promise=h.api.prepare('Anna Müller',1);h.tick(50);const old=h.workers[0];
 h.visibility(true);assert.equal(old.terminated,true);old.ready();assert.equal(h.api.inspect().cached,0);
 h.tick(60000);assert.equal(h.workers.length,1);h.visibility(false);h.tick(50);
 const current=h.workers[1];old.ready();assert.equal(h.api.inspect().cached,0);
 current.ready();assert.equal((await promise).status,'ready');assert.equal(h.api.inspect().cached,1);
});

test('timeouts, wrong voices and invalid-size results fail without caching or allocating audio URLs',async()=>{
 for(const malformed of [{profileId:'other'},{referenceSha256:'0'.repeat(64)},{duration:21},{wav:new ArrayBuffer(0)},{wav:new ArrayBuffer(43)},{wav:new ArrayBuffer(2*1024*1024+1)}]){
  const h=fixture(),promise=h.api.prepare('Anna Müller',1);h.tick(50);h.workers[0].ready(malformed);
  assert.equal((await promise).status,'failed');assert.equal(h.api.inspect().cached,0);assert.equal(h.urls.length,0);
 }
 const h=fixture(),promise=h.api.prepare('Anna Müller',1);h.tick(180050);
 assert.equal((await promise).reason,'timeout');assert.equal(h.workers[0].terminated,true);assert.equal(h.api.inspect().pending,0);
});

test('page retirement resolves all pending work and removes cached clips',async()=>{
 const h=fixture(),promises=[h.api.prepare('Anna Müller',1),h.api.prepare('Hans Schmidt',2)];h.tick(50);
 h.window.dispatchEvent(new Event('pagehide'));assert.equal(h.workers[0].terminated,true);
 assert((await Promise.all(promises)).every(result=>result.reason==='cancelled'));
 assert.equal(h.api.inspect().pending,0);assert.equal(h.api.inspect().cached,0);
});

test('updated first-form input replaces queued warm work and keeps actual ticket requests',async()=>{
 const h=fixture();h.api.rememberName('Anna Müller');h.tick(50);const old=h.workers[0];
 const ticket=h.api.prepare('Hans Schmidt',2);h.api.rememberName('Erika Mustermann');
 assert.equal(old.terminated,true);assert.equal(h.api.initialName,'Erika Mustermann');
 assert.equal(h.api.inspect().pending,5);old.ready();assert.equal(h.api.inspect().cached,0);h.tick(50);
 const current=h.workers[1];assert.equal(current.posts.at(-1).text,'Hans Schmidt, bitte zu Schalter zwei!');
 current.ready();assert.equal((await ticket).status,'ready');h.tick(50);
 assert.equal(current.posts.at(-1).text,'Erika Mustermann, bitte zu Schalter eins!');
 h.api.dispose();
});

test('clearing the first name cancels warm capture while preserving an independent ticket request',async()=>{
 const h=fixture();h.api.rememberName('Anna Müller');h.tick(50);const old=h.workers[0];
 const ticket=h.api.prepare('Hans Schmidt',2);h.api.rememberName('');
 assert.equal(h.api.initialName,'');assert.equal(old.terminated,true);assert.equal(h.api.inspect().pending,1);
 old.ready();assert.equal(h.api.inspect().cached,0);h.tick(50);const current=h.workers[1];
 assert.equal(current.posts.at(-1).text,'Hans Schmidt, bitte zu Schalter zwei!');
 current.ready();assert.equal((await ticket).status,'ready');h.tick(10000);
 assert.equal(current.posts.length,1);assert.equal(h.api.initialName,'');
 assert.equal(h.api.peek('Anna Müller',1),null);assert.equal(h.api.inspect().pending,0);
});

test('clearing the first name preserves a same-name warm request already claimed by a ticket',async()=>{
 const h=fixture();h.api.rememberName('Anna Müller');h.tick(50);const current=h.workers[0];
 const ticket=h.api.prepare('Anna Müller',1);h.api.rememberName('');
 assert.equal(h.api.initialName,'');assert.notEqual(current.terminated,true);assert.equal(h.api.inspect().pending,1);
 current.ready();assert.equal((await ticket).status,'ready');h.tick(10000);
 assert.equal(h.workers.length,1);assert.equal(current.posts.length,1);assert.equal(h.api.inspect().pending,0);
});

test('a stale worker error cannot terminate or fail replacement work after visibility resumes',async()=>{
 const h=fixture(),promise=h.api.prepare('Anna Müller',1);h.tick(50);const old=h.workers[0];
 h.visibility(true);h.visibility(false);h.tick(50);const current=h.workers[1];old.onerror({});
 assert.notEqual(current.terminated,true);assert.equal(h.api.inspect().active,true);assert.equal(h.api.inspect().pending,1);
 current.ready();assert.equal((await promise).status,'ready');assert.equal(h.api.inspect().cached,1);
});

test('the production voice toggle cancels preparation, preserves cached audio and can resume warming',async()=>{
 const h=fixture(),cached=h.api.prepare('Jürgen Müller',3);h.tick(50);h.workers[0].ready();await cached;
 h.api.rememberName('Anna Müller');h.tick(50);const pending=h.api.prepare('Anna Müller',2),button={textContent:'VOICE ON'};
 h.document.getElementById=()=>button;
 Object.assign(h.context,{state:{voiceOn:true},stopSpeech(){},setDialogueVoiceBusy(){}});
 const assignment=readFileSync('game.js','utf8').split(/\r?\n/).find(line=>line.startsWith('document.getElementById("voice-toggle").onclick='));
 assert(assignment);vm.runInContext(assignment,h.context);button.onclick();
 assert.equal(h.context.state.voiceOn,false);
 assert.equal(h.workers[0].terminated,true);assert.equal(h.api.inspect().pending,0);assert.equal(h.api.inspect().worker,false);
 assert.equal((await pending).status,'disabled');
 assert.equal(h.api.peek('Jürgen Müller',3).status,'ready');assert.equal(h.api.inspect().cached,1);
 h.tick(10000);assert.equal(h.workers.length,1);button.onclick();h.tick(50);
 assert.equal(h.context.state.voiceOn,true);assert.equal(h.workers.length,2);assert.equal(h.api.inspect().pending,4);
 h.api.dispose();
});

test('the eight-clip LRU evicts an older name and re-prepares it on demand',async()=>{
 const h=fixture();
 for(let i=0;i<8;i++){const prepared=h.api.prepare('Visitor '+i,1);h.tick(50);h.workers[0].ready();await prepared}
 assert.equal(h.api.inspect().cached,8);await h.api.prepare('Visitor 0',1);
 const ninth=h.api.prepare('Visitor 8',1);h.tick(50);h.workers[0].ready();await ninth;
 assert.equal(h.api.inspect().cached,8);assert.equal(h.api.peek('Visitor 1',1),null);assert.equal(h.api.peek('Visitor 0',1).status,'ready');
 const replacement=h.api.prepare('Visitor 1',1);h.tick(50);
 assert.equal(h.workers[0].posts.at(-1).text,'Visitor 1, bitte zu Schalter eins!');
 assert.equal(h.api.inspect().pending,1);h.workers[0].ready();assert.equal((await replacement).status,'ready');
 assert.equal(h.api.inspect().cached,8);assert.equal(h.urls.length,0);
});

test('a full pending queue defers another name until a real slot becomes available',async()=>{
 const h=fixture(),promises=Array.from({length:12},(_,i)=>h.api.prepare('Visitor '+i,1));h.tick(50);
 assert.equal(h.api.inspect().pending,12);assert.equal(h.workers.length,1);assert.equal(h.workers[0].posts.length,1);
 const deferred=h.api.prepare('Visitor 12',1);
 assert.equal(h.api.inspect().pending,12);assert.equal(h.workers[0].posts.length,1);
 assert.equal((await deferred).status,'deferred');
 h.workers[0].ready();await Promise.resolve();assert.equal(h.api.inspect().pending,11);
 const retried=h.api.prepare('Visitor 12',1);h.tick(50);
 assert.equal(h.workers[0].posts.at(-1).text,'Visitor 12, bitte zu Schalter eins!');
 h.workers[0].ready();assert.equal((await retried).status,'ready');
 h.api.dispose();await Promise.all(promises);assert.equal(h.api.inspect().pending,0);
});

test('the RAM model is cloned only on the first job of each fresh worker',async()=>{
 const h=fixture(),first=h.api.prepare('Visitor 0',1);h.tick(50);const old=h.workers[0];
 assert.equal(Object.hasOwn(old.posts[0],'modelBytes'),false);
 const retained=old.model(Uint8Array.from([11,23,37,41]).buffer);old.ready();await first;
 const second=h.api.prepare('Visitor 1',1);h.tick(50);
 assert.equal(Object.hasOwn(old.posts[1],'modelBytes'),false);old.ready();await second;h.tick(5000);
 assert.equal(old.terminated,true);
 const third=h.api.prepare('Visitor 2',1);h.tick(50);const current=h.workers[1],received=current.posts[0].modelBytes;
 assert.deepEqual(Array.from(new Uint8Array(received)),[11,23,37,41]);assert.notEqual(received,retained);
 assert.equal(retained.byteLength,4);current.ready();await third;
 const fourth=h.api.prepare('Visitor 3',1);h.tick(50);assert.equal(Object.hasOwn(current.posts[1],'modelBytes'),false);
 current.ready();await fourth;h.api.dispose();
});

test('malformed model receipts cannot replace the retained selected-voice buffer',async()=>{
 for(const malformed of [
  ()=>({bytes:new ArrayBuffer(4),profileId:'other'}),
  ()=>({bytes:new ArrayBuffer(4),referenceSha256:'0'.repeat(64)}),
  ()=>({bytes:new ArrayBuffer(20000001)}),
  ()=>({bytes:new Uint8Array(4)}),
  ()=>({bytes:new ArrayBuffer(0)})
 ]){
  const h=fixture(),first=h.api.prepare('Visitor 0',1);h.tick(50);const old=h.workers[0];
  old.model(Uint8Array.from([11,23,37,41]).buffer);const {bytes,...extra}=malformed();old.model(bytes,extra);
  old.ready();await first;h.tick(5000);const next=h.api.prepare('Visitor 1',1);h.tick(50);
  assert.equal(h.workers[1].posts[0].modelBytes.byteLength,4);
  assert.deepEqual(Array.from(new Uint8Array(h.workers[1].posts[0].modelBytes)),[11,23,37,41]);
  h.workers[1].ready();await next;h.api.dispose();
 }
});

test('a retired worker cannot overwrite RAM after a replacement worker starts',async()=>{
 const h=fixture(),first=h.api.prepare('Visitor 0',1);h.tick(50);const old=h.workers[0];
 old.model(Uint8Array.from([11,23,37,41]).buffer);old.ready();await first;h.visibility(true);h.visibility(false);
 const second=h.api.prepare('Visitor 1',1);h.tick(50);const current=h.workers[1];
 old.model(Uint8Array.from([99]).buffer);current.ready();await second;h.tick(5000);
 const third=h.api.prepare('Visitor 2',1);h.tick(50);
 assert.deepEqual(Array.from(new Uint8Array(h.workers[2].posts[0].modelBytes)),[11,23,37,41]);
 h.workers[2].ready();await third;h.api.dispose();
});

test('pagehide and disposal drop model RAM so another worker requests fresh bytes',async()=>{
 for(const retire of [h=>h.window.dispatchEvent(new Event('pagehide')),h=>h.api.dispose()]){
  const h=fixture(),first=h.api.prepare('Visitor 0',1);h.tick(50);const old=h.workers[0];
  old.model(Uint8Array.from([11,23,37,41]).buffer);old.ready();await first;retire(h);
  assert.equal(old.terminated,true);assert.equal(h.api.inspect().cached,0);old.model(Uint8Array.from([99]).buffer);
  const next=h.api.prepare('Visitor 0',1);h.tick(50);const current=h.workers[1];
  assert.equal(Object.hasOwn(current.posts[0],'modelBytes'),false);current.ready();assert.equal((await next).status,'ready');h.api.dispose();
 }
});

function workerFixture({police=false,capabilities={},badBinding=false,badDownload=false,wrongDecodedHash=false,badTailHash=false,badTailFormat=false}={}){
 const binding=productionVoices[police?'kriminalpolizei':'amt-brunhilde-knick'];
 const decoded=new Uint8Array(1000000).fill(17),encoded=gzipSync(decoded),digest=bytes=>createHash('sha256').update(bytes).digest('hex');
 const tailBytes=(police?['prefix','suffix']:counterWords).map((_,index)=>pcmWav(2205+index*1102,(index+1)*1000));
 if(badTailFormat)new DataView(tailBytes[1]).setUint16(22,2,true);
 const manifest={voiceId:police?'kriminalpolizei':'amt-brunhilde-knick',profileId:badBinding?'other':binding.profileId,referenceSha256:binding.referenceSha256,
  sampleRate:22050,compression:'gzip',model:(police?'kripo-':'knick-')+digest(decoded).slice(0,12)+'.onnx.bin',bytes:decoded.byteLength,
  downloadBytes:encoded.byteLength,sha256:wrongDecodedHash?'0'.repeat(64):digest(decoded),downloadSha256:digest(encoded),
  nameContextFrames:16,contextSuffix:police?', hier ist die Kriminalpolizei am Apparat!':', bitte zu Schalter eins!',
  [police?'speechParts':'counterTails']:tailBytes.map((bytes,index)=>({...(police?{role:['prefix','suffix'][index]}:{counter:index+1}),
   file:police?`${['prefix','suffix'][index]}.wav`:`counter-${index+1}.wav`,bytes:bytes.byteLength,sha256:digest(new Uint8Array(bytes)),sampleRate:22050,channels:1,
   profileId:badBinding?'other':binding.profileId,referenceSha256:binding.referenceSha256}))};
 const requests=[],imports=[],messages=[],inferences=[],contexts=[];let storageCalls=0;
 const storage=()=>{storageCalls++;throw Error('Persistent storage is forbidden')};
 const globals={URL,ArrayBuffer,Uint8Array,Float32Array,BigInt64Array,Blob,DecompressionStream,crypto:webcrypto,performance,
  get caches(){return storage()},get indexedDB(){return storage()},get localStorage(){return storage()},get sessionStorage(){return storage()},
  navigator:{storage:{getDirectory:storage}},showSaveFilePicker:storage,showDirectoryPicker:storage,
  self:{location:{href:'https://example.test/knick-speech-worker.js'+(police?'?voice=kriminalpolizei':'')},postMessage(message,transfer){messages.push(structuredClone(message,{transfer}))}},
  fetch:async(url,options)=>{requests.push({url:String(url),cache:options?.cache});return String(url).endsWith('manifest.json')?
   {ok:true,json:async()=>manifest}:{ok:true,arrayBuffer:async()=>{
    const tail=String(url).match(police?/(prefix|suffix)\.wav$/:/counter-([1-4])\.wav$/);
    if(tail){const index=police?['prefix','suffix'].indexOf(tail[1]):Number(tail[1])-1;
     const bytes=tailBytes[index].slice(0);if(badTailHash&&index===1)new Uint8Array(bytes)[44]^=1;return bytes}
    const bytes=Uint8Array.from(encoded);if(badDownload)bytes[4]^=1;return bytes.buffer;
   }}},
  importScripts(...urls){imports.push(...urls);globals.ort={env:{wasm:{}},Tensor:class{constructor(type,data,dims){Object.assign(this,{type,data,dims:Array.from(dims)})}},InferenceSession:{create:async bytes=>{
   assert.equal(digest(bytes),digest(decoded));return{run:async inputs=>{inferences.push(inputs);return{output:{data:new Float32Array(4410).fill(.1)}}}};
  }}};globals.createPiperPhonemize=async({print})=>({callMain(args){
   const context=JSON.parse(args[args.indexOf('--input')+1])[0].text;contexts.push(context);
   const name=context.slice(0,-manifest.contextSuffix.length);
   print(JSON.stringify({phoneme_ids:name.includes(',')?[1,6,8,9,5,8,10,2]:[1,6,9,8,10,2]}));
  }})}
 };
 Object.assign(globals,capabilities);
 vm.runInNewContext(readFileSync('knick-speech-worker.js','utf8'),globals);
 return{requests,imports,messages,encoded,inferences,contexts,get storageCalls(){return storageCalls},
  run:(id,modelBytes,text=police?'Spricht hier Erika Mustermann? Hier ist die Kriminalpolizei am Apparat!':'Erika Mustermann, bitte zu Schalter eins!')=>globals.self.onmessage({data:{id,text,...(modelBytes?{modelBytes}:{})}})};
}

test('unsupported workers fail terminally before HTTP, vendor loading or inference in either voice mode',async()=>{
 const missing=[{DecompressionStream:undefined},{BigInt64Array:undefined},{WebAssembly:undefined},
  {WebAssembly:{validate:()=>false}},{crypto:undefined},{crypto:{}}];
 for(const police of [false,true])for(const capabilities of missing){
  const h=workerFixture({police,capabilities});await h.run(1);await h.run(2);
  assert.deepEqual(h.requests,[]);assert.deepEqual(h.imports,[]);assert.equal(h.inferences.length,0);
  assert.deepEqual(h.messages.map(message=>[message.id,message.status]),[[1,'failed'],[2,'failed']]);
  assert.equal(h.messages.some(message=>message.kind==='model-buffer'),false);assert.equal(h.storageCalls,0);
 }
});

test('worker verification returns transferable model RAM and never invokes persistent storage',async()=>{
 const first=workerFixture();await first.run(1);await first.run(2);
 assert.equal(first.messages.filter(message=>message.kind==='model-buffer').length,1);
 assert.equal(first.messages.filter(message=>message.status==='ready').length,2);
 assert.equal(first.requests.filter(request=>request.url.endsWith('.onnx.bin')).length,1);
 assert.equal(first.requests.filter(request=>request.url.endsWith('.wav')).length,4);
 assert(first.requests.filter(request=>request.url.endsWith('.wav')).every(request=>request.cache==='no-store'));
 assert.equal(first.requests.find(request=>request.url.endsWith('.onnx.bin')).cache,'no-store');assert.equal(first.storageCalls,0);
 const retained=first.messages.find(message=>message.kind==='model-buffer').bytes,second=workerFixture();
 await second.run(3,structuredClone(retained));
 assert.equal(second.messages.find(message=>message.status)?.status,'ready');
 assert.equal(second.requests.filter(request=>request.url.endsWith('.onnx.bin')).length,0);assert.equal(second.storageCalls,0);
});

test('one name-only inference uses the final comma boundary and returns four bound counter WAVs',async()=>{
 const h=workerFixture(),name='Müller, Anna';await h.run(1,undefined,`${name}, bitte zu Schalter drei!`);
 assert.equal(h.inferences.length,1);assert.deepEqual(h.contexts,[`${name}, bitte zu Schalter eins!`]);
 const boundary=h.inferences[0].name_end;assert.equal(boundary.type,'int64');assert.deepEqual(boundary.dims,[1]);
 assert.deepEqual(Array.from(boundary.data),[5n]);
 const result=h.messages.find(message=>message.status);assert.equal(result.status,'ready');assert.equal(result.variants.length,4);
 assert.equal(result.profileId,binding.profileId);assert.equal(result.referenceSha256,binding.referenceSha256);
 assert.equal(result.text,`${name}, bitte zu Schalter drei!`);assert.equal(result.wav,result.variants[2].wav);
 for(let index=0;index<4;index++){
  const part=result.variants[index];assert.equal(part.text,`${name}, bitte zu Schalter ${counterWords[index]}!`);
  assert.equal(part.sha256,createHash('sha256').update(new Uint8Array(part.wav)).digest('hex'));
  assert.equal(part.duration,(4410+2205+index*1102)/22050);assert.equal(new DataView(part.wav).getUint32(40,true),part.wav.byteLength-44);
 }
 assert.equal(h.storageCalls,0);
});

test('a corrupt or incorrectly formatted fixed tail cannot reach name inference or a model receipt',async()=>{
 for(const options of [{badTailHash:true},{badTailFormat:true}]){
  const h=workerFixture(options);await h.run(1);
  assert.equal(h.messages.find(message=>message.status)?.status,'failed');assert.equal(h.inferences.length,0);
  assert.equal(h.messages.some(message=>message.kind==='model-buffer'),false);assert.equal(h.storageCalls,0);
 }
});

test('invalid RAM is refetched and failed hash verification cannot return a model buffer',async()=>{
 const first=workerFixture(),changed=Uint8Array.from(first.encoded);changed[4]^=1;
 for(const [replacement,bytes] of [[first,new ArrayBuffer(4)],[workerFixture(),changed.buffer]]){
  await replacement.run(1,bytes);assert.equal(replacement.messages.find(message=>message.status)?.status,'ready');
  assert.equal(replacement.requests.filter(request=>request.url.endsWith('.onnx.bin')).length,1);
 }
 for(const options of [{badDownload:true},{wrongDecodedHash:true}]){
  const rejected=workerFixture(options);await rejected.run(1);
  assert.equal(rejected.messages.some(message=>message.kind==='model-buffer'),false);
  assert.equal(rejected.messages.find(message=>message.status)?.status,'failed');assert.equal(rejected.storageCalls,0);
 }
});

test('police mode warms exactly one complete greeting and leases the selected police identity',async()=>{
 const h=fixture({police:true});h.api.rememberName('Ju\u0308rgen Müller');h.tick(50);
 assert.equal(h.window.GermanyKnickSpeech,undefined);assert.equal(h.api.initialName,'Jürgen Müller');
 assert.equal(h.workers[0].url,'https://example.test/game/knick-speech-worker.js?v=20261014-player-address&voice=kriminalpolizei');
 assert.equal(h.workers[0].posts.length,1);assert.equal(h.api.inspect().pending,1);
 const promise=h.api.prepare('Jürgen Müller',1);h.workers[0].batch();const ready=await promise;h.tick(50);
 assert.equal(ready.text,'Spricht hier Jürgen Müller? Hier ist die Kriminalpolizei am Apparat!');
 assert.equal(ready.english,'Is this Jürgen Müller? This is the criminal police speaking!');
 assert.equal(ready.profileId,policeBinding.profileId);assert.equal(ready.referenceSha256,policeBinding.referenceSha256);
 assert.equal(ready.variants,undefined);assert.equal(ready.wav,undefined);assert.equal(h.api.inspect().cached,1);
 assert.equal((await h.api.prepare('Jürgen Müller',2)).status,'failed');assert.equal(h.workers[0].posts.length,1);
 const lease=h.api.lease(ready);assert.equal(lease.voiceId,'kriminalpolizei');assert.equal(lease.text,ready.text);
 lease.release();lease.release();assert.equal(h.revoked.length,1);
});

test('police address audio shares one cache entry and the selected name/profile receipt',async()=>{
 const h=fixture({police:true}),pending=h.api.prepare('Jürgen Müller',1);h.tick(50);
 h.workers[0].batch(reply=>{const wav=pcmWav();reply.address={text:'Jürgen Müller',wav,duration:.2,sha256:createHash('sha256').update(new Uint8Array(wav)).digest('hex')}});
 const ready=await pending,address=ready.address;assert.equal(address.text,'Jürgen Müller');assert.equal(address.profileId,policeBinding.profileId);assert.equal(address.referenceSha256,policeBinding.referenceSha256);
 assert.equal(address.wav,undefined);assert.equal(address.status,'ready');assert.equal(h.api.peek('Jürgen Müller',1).address,address);assert.equal(h.api.inspect().cached,1);assert.equal(h.workers[0].posts.length,1);
 const lease=h.api.lease(address);assert.equal(lease.voiceId,'kriminalpolizei');assert.equal(lease.text,'Jürgen Müller');lease.release();lease.release();assert.equal(h.revoked.length,1);
});

test('police address audio rejects foreign names, invalid buffers and unbounded durations',async()=>{
 for(const bad of [{text:'Other Person'},{wav:new ArrayBuffer(43)},{duration:21},{sha256:'invalid'}]){
  const h=fixture({police:true}),pending=h.api.prepare('Jürgen Müller',1);h.tick(50);
  h.workers[0].batch(reply=>{reply.address={text:'Jürgen Müller',wav:pcmWav(),duration:.2,sha256:'a'.repeat(64),...bad}});
  assert.equal((await pending).status,'failed');assert.equal(h.api.inspect().cached,0);
 }
});

test('police mode rejects Knick model receipts and greeting variants without cross-caching',async()=>{
 for(const mutate of [reply=>{reply.profileId=binding.profileId;reply.referenceSha256=binding.referenceSha256},
  reply=>{reply.variants[0].text='Erika Mustermann, bitte zu Schalter eins!'},reply=>{reply.variants.push(reply.variants[0])}]){
  const h=fixture({police:true}),promise=h.api.prepare('Erika Mustermann',1);h.tick(50);
  h.workers[0].model(Uint8Array.of(1,2,3).buffer,{profileId:binding.profileId,referenceSha256:binding.referenceSha256});
  h.workers[0].batch(mutate);assert.equal((await promise).status,'failed');assert.equal(h.api.inspect().cached,0);
  h.tick(5000);h.api.prepare('Anna Müller',1);h.tick(50);assert.equal(h.workers[1].posts[0].modelBytes,undefined);
  assert.equal(h.urls.length,0);h.api.dispose();
 }
});

test('police worker joins one prefix, one name inference and one suffix with selected binding and no storage',async()=>{
 const h=workerFixture({police:true}),name='Müller, Anna',text=`Spricht hier ${name}? Hier ist die Kriminalpolizei am Apparat!`;
 await h.run(1,undefined,text);assert.equal(h.inferences.length,1);
 assert.deepEqual(h.contexts,[`${name}, hier ist die Kriminalpolizei am Apparat!`]);
 assert.deepEqual(Array.from(h.inferences[0].name_end.data),[5n]);
 const result=h.messages.find(message=>message.status);assert.equal(result.status,'ready');assert.equal(result.variants.length,1);
 assert.equal(result.text,text);assert.equal(result.variants[0].text,text);assert.equal(result.wav,result.variants[0].wav);
 assert.equal(result.profileId,policeBinding.profileId);assert.equal(result.referenceSha256,policeBinding.referenceSha256);
 assert.equal(result.duration,(2205+4410+3307)/22050);
 assert.equal(result.address.text,name);assert.equal(result.address.duration,4410/22050);
 assert.equal(result.address.wav.byteLength,44+4410*2);assert.equal(result.address.sha256,createHash('sha256').update(new Uint8Array(result.address.wav)).digest('hex'));
 assert.equal(result.sha256,createHash('sha256').update(new Uint8Array(result.wav)).digest('hex'));
 const view=new DataView(result.wav);assert.equal(view.getUint32(40,true),result.wav.byteLength-44);
 assert(view.getInt16(44+200*2,true)>0);assert(view.getInt16(44+(2205+200)*2,true)>0);assert(view.getInt16(44+(2205+4410+200)*2,true)>0);
 assert(h.requests.every(request=>!request.url.includes('/knick/')));
 assert.deepEqual(h.requests.filter(request=>request.url.endsWith('.wav')).map(request=>request.url.split('/').at(-1)),['prefix.wav','suffix.wav']);
 assert(h.requests.every(request=>request.cache==='no-store'));assert.equal(h.storageCalls,0);
 const retained=h.messages.find(message=>message.kind==='model-buffer').bytes,restarted=workerFixture({police:true});
 await restarted.run(2,structuredClone(retained));assert.equal(restarted.requests.some(request=>request.url.endsWith('.onnx.bin')),false);
 assert.equal(restarted.inferences.length,1);assert.equal(restarted.storageCalls,0);
});

test('police worker rejects foreign bindings and corrupt fixed greeting parts before inference',async()=>{
 for(const options of [{badBinding:true},{badTailHash:true},{badTailFormat:true}]){
  const h=workerFixture({police:true,...options});await h.run(1);
  assert.equal(h.messages.find(message=>message.status)?.status,'failed');assert.equal(h.inferences.length,0);
  assert.equal(h.messages.some(message=>message.kind==='model-buffer'),false);assert.equal(h.storageCalls,0);
 }
});
