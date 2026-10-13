import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {harness,source} from './amt-harness.mjs';

// Production phone, catalogue and name manager; only DOM, time, transport,
// Worker delivery and acoustic playback are synthetic. No listening evidence.
function phone({local=true,greetingPlay='normal'}={}){
 const h=harness('phone',{candidatePhone:true,fakeAudio:true}),workers=[],leases=[],revoked=[],played=[];
 vm.runInContext(source('For-AI/AUDIO-TEXT-LIBRARY.js'),h.context);
 const binding=h.window.GermanySimulatorAudioText.productionVoices.kriminalpolizei;
 class BrowserURL extends URL{
  static createObjectURL(blob){const url=`blob:kripo/${leases.length}`;leases.push({url,blob});return url}
  static revokeObjectURL(url){revoked.push(url)}
 }
 class Worker{
  constructor(url){this.url=String(url);this.posts=[];workers.push(this)}
  postMessage(message){this.posts.push(structuredClone(message))}
  terminate(){this.terminated=true}
  ready(extra={}){
   const {id,text}=this.posts.at(-1),wav=new ArrayBuffer(64),part={text,wav,duration:2,sha256:'a'.repeat(64)};
   this.onmessage({data:{id,text,status:'ready',...part,variants:[part],profileId:binding.profileId,referenceSha256:binding.referenceSha256,...extra}});
  }
 }
 const OriginalAudio=h.window.Audio;
 class Audio extends OriginalAudio{
  constructor(src){super(src);this.createdAt=h.now()}
  load(){this.loads=(this.loads||0)+1;return super.load()}
  play(){played.push(this);this.paused=false;this.playCount=(this.playCount||0)+1;this.playedAt=h.now();if(this.src.startsWith('blob:')&&greetingPlay==='throw')throw Error('Media failed');
   if(this.src.startsWith('blob:')&&greetingPlay==='pending')return new Promise(()=>{});return super.play()}
 }
 h.window.Audio=h.context.Audio=Audio;
 h.document.currentScript={src:'https://example.test/knick-speech.js',dataset:{voice:'kriminalpolizei'}};
 Object.assign(h.context,{Worker,Blob,ArrayBuffer,URL:BrowserURL,location:{href:'https://example.test/'}});
 if(local)vm.runInContext(source('knick-speech.js'),h.context);
 const link=h.phoneReady(),speech=h.window.GermanyKripoSpeech;
 function submit(value='Erika Mustermann'){
  h.node('phone-name').value=value;h.node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));
  link.message({type:'ticket',number:'B-223',counter:3});link.message({type:'counter-start'});
 }
 function incoming(round=1,greeting=h.window.BuergeramtStory.call.greeting('Erika Mustermann')){
  link.message({type:'call-arm',id:'grass',round});
  link.message({type:'call',id:'grass',round,line:h.window.BuergeramtStory.call.body,greeting,ringAtPhoneMs:h.now(),ringAtUtcMs:null,leadMs:2200});
 }
 function ready(){h.tick(50);assert.equal(workers.length,1);workers[0].ready()}
 const sent=type=>link.sent.filter(message=>message.type===type);
 return{...h,link,speech,workers,leases,revoked,played,submit,incoming,ready,sent};
}
const staticNoise=h=>h.audio.nodes.find(node=>node.kind==='buffer-source'&&node.loop);
const bodyPath='./assets/voices/kriminalpolizei/kriminalpolizei-opening-body.mp3';
const backupPath='./assets/voices/kriminalpolizei/kriminalpolizei-phone-01.mp3';

test('first phone input debounces preparation, replacement discards old work, and change prepares immediately',()=>{
 const h=phone(),name=h.node('phone-name');h.tick(3000);assert.equal(h.workers.length,0);
 name.value='Anna Müller';name.dispatchEvent(new Event('input'));h.tick(1199);assert.equal(h.workers.length,0);
 h.tick(1);assert.equal(h.speech.initialName,'Anna Müller');h.tick(50);assert.equal(h.workers.length,1);
 name.value='Erika Mustermann';name.dispatchEvent(new Event('change'));assert.equal(h.workers[0].terminated,true);
 h.workers[0].ready();assert.equal(h.speech.peek('Anna Müller',1),null);h.tick(50);h.workers[1].ready();
 assert.equal(h.speech.peek('Erika Mustermann',1).text,h.window.BuergeramtStory.call.greeting('Erika Mustermann'));
 name.value='';name.dispatchEvent(new Event('change'));assert.equal(h.speech.initialName,'');
});

test('known opening name starts preparation only for the current empty phone form',()=>{
 const h=phone(),id=h.sent('scan')[0].id;
 h.link.message({type:'known-name',id:'foreign',name:'Other Person'});assert.equal(h.node('phone-name').value,'');
 h.link.message({type:'known-name',id,name:'Erika Mustermann'});assert.equal(h.node('phone-name').value,'Erika Mustermann');
 assert.equal(h.speech.initialName,'Erika Mustermann');h.ready();
 h.link.message({type:'known-name',id,name:'Other Person'});assert.equal(h.speech.initialName,'Erika Mustermann');
 h.submit();h.link.message({type:'known-name',id,name:'Other Person'});assert.equal(h.sent('register').at(-1).name,'Erika Mustermann');
 assert.equal(h.workers[0].posts.length,1);
});

test('Answer starts the prepared greeting synchronously and one opening receipt spans greeting plus exact fixed body',()=>{
 const h=phone();h.submit();h.ready();h.incoming();assert.equal(h.played.length,0);
 const answeredAt=h.now();h.node('phone-answer').click();assert.equal(h.played.length,1);
 const greeting=h.played[0],noise=staticNoise(h),lateGreeting=greeting.onended;
 assert.equal(greeting.src,'blob:kripo/0');assert.equal(greeting.playedAt,answeredAt);assert.equal(h.synth.spoken.length,0);
 assert.equal(h.sent('answer').length,1);assert.equal(h.sent('police-start').length,0);h.tick(16);
 assert.deepEqual(h.sent('police-start').map(message=>[message.index,message.mode]),[[-1,'voice']]);
 h.tick(200);greeting.end();assert.equal(h.played.length,2);const body=h.played[1];assert.equal(body.src,bodyPath);
 assert.equal(body.playedAt,h.now());assert.equal(body.playCount,1);
 assert.equal(greeting.paused,true);assert.deepEqual(h.revoked,['blob:kripo/0']);assert.equal(h.sent('police-done').length,0);
 lateGreeting();assert.equal(h.played.length,2);h.tick(16);assert.equal(h.sent('police-start').length,1);
 h.tick(300);const lateBody=body.onended;body.end();lateBody();
 assert.equal(h.sent('police-done').length,1);assert.equal(h.sent('police-done')[0].index,-1);
 assert.equal(h.sent('police-done')[0].mode,'voice');assert.equal(h.sent('police-done')[0].durationMs,516);
 assert.equal(noise.stopped.length,0);assert.equal(h.revoked.length,1);
 h.link.message({type:'police-line',index:0,line:h.window.BuergeramtStory.police[0]});h.tick(0);
 assert.equal(h.played.length,3);assert.equal(h.leases.length,1);assert.equal(h.synth.spoken.length,0);
});

test('an unready greeting starts the full recorded backup in Answer and ignores late name readiness',()=>{
 const h=phone();h.submit();h.incoming();h.node('phone-answer').click();
 assert.equal(h.played[0].src,backupPath);assert.equal(h.played[0].playedAt,0);assert.equal(h.synth.spoken.length,0);
 h.ready();assert.equal(h.played.length,1);assert.equal(h.leases.length,0);
 h.tick(16);h.played[0].end();assert.equal(h.sent('police-start').length,1);assert.equal(h.sent('police-done').length,1);
});

test('wrong text or selected police binding falls through to the full recorded backup without playing leased media',()=>{
 for(const mismatch of ['text','voice','profile','reference']){
  const h=phone();h.submit();h.ready();h.incoming(1,mismatch==='text'?h.window.BuergeramtStory.call.greeting('Other Person'):undefined);
  if(mismatch!=='text'){const original=h.speech.lease;h.speech.lease=result=>{const lease=original(result);
   if(mismatch==='voice')lease.voiceId='amt-brunhilde-knick';if(mismatch==='profile')lease.profileId='other';if(mismatch==='reference')lease.referenceSha256='0'.repeat(64);return lease}}
  h.node('phone-answer').click();assert.equal(h.played[0].src,backupPath);assert.equal(h.synth.spoken.length,0);
  assert.equal(h.revoked.length,mismatch==='text'?0:1);h.tick(16);h.played[0].end();
  assert.equal(h.sent('police-start').length,1);assert.equal(h.sent('police-done').length,1);
 }
});

test('greeting failure before onset releases its lease and synchronously starts the full recorded backup once',()=>{
 for(const failure of ['event','throw','pending']){
  const h=phone({greetingPlay:failure});h.submit();h.ready();h.incoming();h.node('phone-answer').click();
  const greeting=h.played[0],late=[greeting.onplaying,greeting.onended,greeting.onerror];
  if(failure==='event')greeting.fail();else if(failure==='pending')h.tick(3000);
  assert.equal(h.played.length,2);assert.equal(h.played[1].src,backupPath);assert.equal(h.revoked.length,1);
  assert.equal(h.played[1].playedAt,h.now());assert.equal(staticNoise(h).stopped.length,0);
  for(const callback of late)callback?.();assert.equal(h.played.length,2);h.tick(16);h.played[1].end();
  assert.equal(h.sent('police-start').length,1);assert.equal(h.sent('police-done').length,1);
  assert.equal(h.sent('police-start')[0].mode,'recording');assert.equal(h.synth.spoken.length,0);
 }
});

test('unavailable media falls back without throwing or retaining the prepared greeting lease',()=>{
 for(const missing of [true,false]){
  const h=phone();h.submit();h.ready();h.incoming();const Audio=h.window.Audio;
  h.window.Audio=missing?undefined:function(src){if(src.startsWith('blob:'))throw Error('Constructor failed');return new Audio(src)};
  assert.doesNotThrow(()=>h.node('phone-answer').click());assert.equal(h.leases.length,missing?0:1);assert.equal(h.leases.length,h.revoked.length);
  assert.equal(h.synth.spoken.length,0);h.tick(16);
  assert.equal(h.sent('police-start')[0].mode,missing?'fallback':'recording');
  if(!missing)h.played[0].end();else h.tick(20000);
  assert.equal(h.sent('police-done').length,1);
 }
});

test('office tempo applies to prepared greeting, static and fixed body while opening receipts stay single',()=>{
 const h=phone();h.submit();h.ready();h.incoming();h.link.message({type:'office-tempo',rate:.75});h.node('phone-answer').click();
 const greeting=h.played[0];assert.equal(greeting.playbackRate,.75);assert.equal(greeting.preservesPitch,false);h.tick(16);
 h.link.message({type:'office-tempo',rate:.5});assert.equal(greeting.playbackRate,.5);assert.equal(staticNoise(h).playbackRate.value,.5);
 greeting.end();const body=h.played[1];assert.equal(body.playbackRate,.5);assert.equal(body.preservesPitch,false);
 h.tick(16);body.end();assert.equal(h.sent('police-start').length,1);assert.equal(h.sent('police-done').length,1);
});

test('hide, pagehide, hangup and slot retirement release greeting media and reject saved callbacks',()=>{
 for(const stop of ['hidden','pagehide','hangup','forfeit','done','disconnect']){
  const h=phone();h.submit();h.ready();h.incoming();h.node('phone-answer').click();h.tick(16);
  const greeting=h.played[0],late=[greeting.onplaying,greeting.onended,greeting.onerror],noise=staticNoise(h);
  if(stop==='hidden')h.hide();else if(stop==='pagehide')h.window.dispatchEvent(new Event('pagehide'));
  else if(stop==='hangup')h.node('phone-hangup').click();else if(stop==='disconnect')h.link.emit('status','Telefon getrennt');else h.link.message({type:stop});
  for(const callback of late)callback?.();h.tick(10000);
  assert.equal(greeting.paused,true);assert.equal(h.revoked.length,1);assert.equal(h.played.length,1);
  assert.equal(h.sent('police-done').length,0);assert.equal(h.node('phone-call').hidden,true);assert(noise.stopped.length);
  if(['pagehide','forfeit','done'].includes(stop))assert.equal(h.speech.inspect().cached,0);
  if(stop==='hangup'){assert.equal(h.sent('hangup').length,1);h.audio.flushEnded();assert.equal(h.sent('call-ended').length,1)}
 }
});

test('visibility recovery reuses prepared audio for a new call while old opening callbacks remain inert',()=>{
 const h=phone();h.submit();h.ready();h.incoming();h.node('phone-answer').click();h.tick(16);
 const old=h.played[0],late=old.onended;h.hide();h.document.hidden=false;h.document.dispatchEvent(new Event('visibilitychange'));
 h.incoming(2);h.node('phone-answer').click();assert.equal(h.played[1].src,'blob:kripo/1');late();
 assert.equal(h.played.length,2);assert.equal(h.played[1].paused,false);assert.equal(h.revoked.length,1);
 h.tick(16);h.played[1].end();h.tick(16);h.played[2].end();
 assert.equal(h.sent('police-start').length,2);assert.equal(h.sent('police-done').length,1);assert.equal(h.workers[0].posts.length,1);
});

test('opening cutoff releases a playing greeting and cannot start its fixed body afterward',()=>{
 const h=phone();h.submit();h.ready();h.incoming();h.node('phone-answer').click();h.tick(16);
 const greeting=h.played[0],late=greeting.onended;
 h.link.message({type:'police-cutoff',index:-1,stopAtPhoneMs:h.now()+100,stopAtUtcMs:null});h.tick(99);
 assert.equal(h.sent('police-done').length,0);h.tick(1);late();assert.equal(h.sent('police-done').length,1);
 assert.equal(h.played.length,1);assert.equal(h.revoked.length,1);
});

test('a completed local opening keeps static until the exact call end and one actual line-tone receipt',()=>{
 const h=phone();h.submit();h.ready();h.incoming();h.node('phone-answer').click();h.node('phone-answer').click();
 assert.equal(h.played.length,1);assert.equal(h.sent('answer').length,1);h.tick(16);
 h.played[0].end();h.tick(16);h.played[1].end();assert.equal(h.sent('police-done').length,1);
 const noise=staticNoise(h);assert.equal(noise.stopped.length,0);
 h.link.message({type:'call-end',id:'grass',round:2});assert.equal(noise.stopped.length,0);
 h.link.message({type:'call-end',id:'grass',round:1});assert(noise.stopped.length);
 const tone=h.audio.nodes.find(node=>node.kind==='oscillator'&&node.frequency.value===425);assert(tone);
 const soundMs=Math.ceil(tone.stopped[0]*1000-h.now());
 h.tick(soundMs-1);h.audio.flushEnded();assert.equal(h.sent('call-ended').length,0);
 h.tick(1);h.audio.flushEnded();assert.equal(h.sent('call-ended').length,1);assert.equal(h.sent('call-ended')[0].mode,'sound');
 assert.equal(h.sent('call-ended')[0].round,1);assert.equal(h.revoked.length,1);
});

test('page retirement cancels debounced preparation and a fresh companion manager retains no prior WAV or model',()=>{
 const h=phone(),name=h.node('phone-name');name.value='Anna Müller';name.dispatchEvent(new Event('input'));
 h.window.dispatchEvent(new Event('pagehide'));h.tick(2000);assert.equal(h.workers.length,0);
 const fresh=phone();fresh.submit();fresh.ready();fresh.incoming();fresh.node('phone-answer').click();
 assert.equal(fresh.workers[0].posts[0].modelBytes,undefined);assert.equal(fresh.leases.length,1);
});

test('a companion without the local API starts the accepted full recorded opening inside Answer',()=>{
 const h=phone({local:false});h.submit();h.incoming();h.node('phone-answer').click();
 assert.equal(h.synth.spoken.length,0);assert.equal(h.workers.length,0);assert.equal(h.played.length,1);
 assert.equal(h.played[0].src,backupPath);assert.equal(h.played[0].playedAt,0);
 h.tick(16);h.played[0].end();assert.equal(h.sent('police-start').length,1);assert.equal(h.sent('police-done').length,1);
});

test('first valid phone input silently warms six selected-profile recordings with the full original first',()=>{
 const h=phone(),name=h.node('phone-name');h.tick(1000);assert.equal(h.audio.recordings.length,0);
 name.value='A';name.dispatchEvent(new Event('change'));assert.equal(h.audio.recordings.length,0);
 name.value='Bad\u0085Name';name.dispatchEvent(new Event('change'));assert.equal(h.audio.recordings.length,0);
 name.value='Erika Mustermann';name.dispatchEvent(new Event('change'));
 const buffered=h.audio.recordings;assert.equal(buffered.length,6);assert.equal(buffered[0].src,backupPath);
 const catalog=h.window.GermanySimulatorAudioText;
 for(const clip of buffered){assert.equal(clip.preload,'auto');assert.equal(clip.loads,1);assert.equal(clip.playCount,undefined);
  const entry=Object.values(catalog.clips).find(entry=>catalog.recordedClip('kriminalpolizei',entry.source)===clip.src);
  assert.equal(entry.voiceId,'kriminalpolizei');assert.equal(entry.profileId,catalog.productionVoices.kriminalpolizei.profileId)}
 assert.equal(h.played.length,0);name.dispatchEvent(new Event('change'));assert.equal(buffered.length,6);
 h.submit();h.incoming();buffered[0].currentTime=4;h.node('phone-answer').click();
 assert.equal(h.played[0],buffered[0]);assert.equal(h.played[0].currentTime,0);assert.equal(h.played[0].playedAt,h.now());
});

test('warming rejects foreign profiles, stays capped at eight buffers and releases them on slot or page retirement',()=>{
 for(const stop of ['forfeit','done','pagehide']){
  const h=phone({local:false}),original=h.window.GermanySimulatorAudioText,binding=original.productionVoices.kriminalpolizei;
  const extras=Object.fromEntries(Array.from({length:12},(_,index)=>['extra-'+index,{id:'extra-'+index,voiceId:'kriminalpolizei',profileId:binding.profileId,source:'Extra '+index}]));
  const foreign={id:'foreign',voiceId:'kriminalpolizei',profileId:'other',source:'Foreign original'};
  h.window.GermanySimulatorAudioText={...original,clips:{foreign,...original.clips,...extras},recordedClip:(voiceId,text)=>{
   if(text===foreign.source)return './foreign.mp3';if(text.startsWith('Extra '))return './extra-'+text.slice(6)+'.mp3';return original.recordedClip(voiceId,text)
  }};
  h.submit();assert.equal(h.audio.recordings.length,8);assert.equal(h.audio.recordings[0].src,backupPath);
  assert.equal(h.audio.recordings.some(clip=>clip.src==='./foreign.mp3'),false);assert.equal(h.played.length,0);
  if(stop==='pagehide')h.window.dispatchEvent(new Event('pagehide'));else h.link.message({type:stop});
  assert(h.audio.recordings.every(clip=>clip.src===''&&clip.paused&&clip.loads===2));assert.equal(h.played.length,0);
 }
});

test('an unavailable local worker uses a warmed full opening without any model request or browser speech',()=>{
 const h=phone();h.context.Worker=undefined;const fetched=[];h.context.fetch=async url=>{fetched.push(String(url));throw Error('No model request expected')};
 h.submit();h.tick(2000);assert.equal(h.workers.length,0);assert.equal(h.speech.inspect().pending,0);assert.equal(h.audio.recordings.length,6);
 h.incoming();h.node('phone-answer').click();assert.equal(h.played[0].src,backupPath);assert.equal(h.played[0].playedAt,h.now());
 assert.deepEqual(fetched,[]);assert.equal(h.synth.spoken.length,0);h.tick(16);
 assert.equal(h.sent('police-start')[0].mode,'recording');h.played[0].end();assert.equal(h.sent('police-done').length,1);
 const source=h.window.GermanySimulatorAudioText.clips['kriminalpolizei-phone-01'].source;
 assert.match(source,/^Hier ist die Kriminalpolizei\./);assert.match(source,/Welcher Schuh.*der linke, der rechte oder beide\?/);
});

test('a failed named body retries the full recorded original once while call static remains continuous',()=>{
 const h=phone();h.submit();h.ready();h.incoming();h.node('phone-answer').click();h.tick(16);h.played[0].end();h.tick(16);
 const body=h.played[1],late=body.onerror,noise=staticNoise(h);assert.equal(body.src,bodyPath);body.fail();
 assert.equal(h.played.length,3);const backup=h.played[2];assert.equal(backup.src,backupPath);assert.equal(backup.playedAt,h.now());
 assert.equal(noise.stopped.length,0);assert.equal(h.revoked.length,1);late();assert.equal(h.played.length,3);
 h.tick(16);backup.fail();h.tick(20000);assert.equal(h.played.length,3);
 assert.deepEqual(h.sent('police-start').map(message=>message.mode),['voice','recording']);
 assert.equal(h.sent('police-done').length,1);assert.equal(h.sent('police-done')[0].mode,'recording');assert.equal(noise.stopped.length,0);assert.equal(h.synth.spoken.length,0);
});

test('a recovered backup call reuses and resets its buffered original without accepting callbacks from the prior round',()=>{
 const h=phone({local:false});h.submit();h.incoming();h.node('phone-answer').click();h.tick(16);
 const original=h.played[0],late=[original.onplaying,original.onended,original.onerror];original.currentTime=7;
 h.hide();h.document.hidden=false;h.document.dispatchEvent(new Event('visibilitychange'));h.incoming(2);h.node('phone-answer').click();
 assert.equal(h.played.length,2);assert.equal(h.played[1],original);assert.equal(original.currentTime,0);assert.equal(original.playCount,2);
 for(const callback of late)callback?.();assert.equal(original.paused,false);assert.equal(h.sent('police-done').length,0);
 h.tick(16);assert.equal(h.sent('police-start').length,2);original.end();assert.equal(h.sent('police-done').length,1);
 assert.equal(h.sent('police-done')[0].mode,'recording');assert.equal(h.synth.spoken.length,0);assert.equal(h.leases.length,0);
});

for(const failure of ['greeting','body'])test(`after-onset ${failure} failure updates the host to actual backup captions once without restarting its cue clock`,()=>{
 const host=harness('host',{voice:true,phoneCaptions:true});host.counter();vm.runInContext(source('For-AI/AUDIO-TEXT-LIBRARY.js'),host.context);
 const link=host.links[0],h=phone();h.submit();h.ready();h.incoming();h.node('phone-answer').click();
 link.message(h.sent('answer')[0]);h.tick(16);link.message(h.sent('police-start')[0]);
 const cue=()=>host.level.timing.cues[-1],clockKeys=['sentAt','startedAt','phoneStartedAtMs','estimatedStartAt','clockDomain','clockOffsetMs','phoneStartedAtUtcMs','readyDelayMs','startTransportMs'];
 const clock=()=>Object.fromEntries(clockKeys.map(key=>[key,cue()[key]]));const original=clock();
 const deadlines=()=>[...host.timers].map(([id,timer])=>[id,timer.due,timer.repeat]);
 const timers=deadlines(),story=host.window.BuergeramtStory,catalog=host.window.GermanySimulatorAudioText;
 assert.equal(host.node('english-subtitle').textContent,story.call.openingEnglish('Erika Mustermann'));
 h.tick(200);host.tick(200);
 if(failure==='body'){h.played[0].end();h.tick(16);host.tick(16)}
 const failed=h.played.at(-1),late=[failed.onplaying,failed.onended,failed.onerror];failed.fail();
 const backup=h.played.at(-1);assert.equal(backup.src,backupPath);assert.equal(backup.playedAt,h.now());assert.equal(staticNoise(h).stopped.length,0);
 assert.equal(h.sent('police-start').length,1);assert.equal(cue().startMode,'voice');
 h.tick(16);host.tick(16);assert.deepEqual(h.sent('police-start').map(message=>message.mode),['voice','recording']);
 const update=h.sent('police-start')[1];link.message({...update,atMs:original.phoneStartedAtMs-1});
 assert.equal(cue().startMode,'voice');assert.equal(cue().openingBackupAtMs,undefined);
 link.message(update);assert.equal(cue().startMode,'recording');assert.equal(cue().openingBackupAtMs,update.atMs);
 assert.deepEqual(clock(),original);assert.deepEqual(deadlines(),timers);
 assert.equal(host.node('amt-ambient').textContent,'KRIMINALPOLIZEI · '+story.call.line);
 assert.equal(host.node('english-subtitle').textContent,catalog.clips['kriminalpolizei-phone-01'].english);
 for(const callback of late)callback?.();backup.onplaying();assert.equal(h.sent('police-start').length,2);
 for(const receipt of [update,{...update,mode:'voice'},{...update,index:0},{...update,atMs:original.phoneStartedAtMs-1}])link.message(receipt);
 assert.equal(cue().openingBackupAtMs,update.atMs);assert.deepEqual(clock(),original);assert.deepEqual(deadlines(),timers);
 assert.equal(host.node('english-subtitle').textContent,catalog.clips['kriminalpolizei-phone-01'].english);
 h.tick(300);host.tick(300);backup.end();const done=h.sent('police-done')[0];assert.equal(done.mode,'recording');
 assert.equal(done.durationMs,done.atMs-original.phoneStartedAtMs);link.message(done);assert.equal(cue().localErrorMs,0);
 assert.equal(cue().doneAt!==null,true);const clerk=host.node('amt-ambient').textContent;assert.match(clerk,/^FRAU KNICK · /);
 link.message(update);assert.equal(host.node('amt-ambient').textContent,clerk);assert.equal(h.sent('police-done').length,1);assert.equal(h.revoked.length,1);
});
