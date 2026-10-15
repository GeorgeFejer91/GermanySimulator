import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {ffmpeg,voiceFilter,cleanProcessing,dryProcessing,replaceVoiceFiles} from '../tools/neighbor-voice-processing.mjs';

test('both parent voices require the approved cleanup for future generation',()=>{
 const heiko=voiceFilter({processing:cleanProcessing},'jwd-heiko-maaslos');
 assert.notEqual(heiko,'');
 assert.equal(heiko,voiceFilter({processing:cleanProcessing},'jwd-inga-maaslos'));
 for(const voiceId of ['jwd-heiko-maaslos','jwd-inga-maaslos']){
  assert.throws(()=>voiceFilter({processing:dryProcessing},voiceId));
 }
 assert.equal(voiceFilter({processing:dryProcessing},'jwd-frau-schwabingen'),'');
});

test('replacement rejects stale inputs and backups before mutating any voice',()=>{
 const dir=mkdtempSync(resolve(tmpdir(),'neighbor-cleanup-'));
 try{
  const hash=text=>createHash('sha256').update(text).digest('hex');
  const target=resolve(dir,'current'),staged=resolve(dir,'staged'),backup=resolve(dir,'backup'),journal=resolve(dir,'journal');
  writeFileSync(target,'original');writeFileSync(staged,'clean');
  const file={target,staged,backup,beforeSha256:hash('original'),afterSha256:hash('clean')};
  for(const change of [{beforeSha256:hash('changed')},{afterSha256:hash('changed')}]){
   assert.throws(()=>replaceVoiceFiles([{...file,...change}],journal,()=>{}));
   assert.equal(readFileSync(target,'utf8'),'original');
  }
  writeFileSync(backup,'wrong');assert.throws(()=>replaceVoiceFiles([file],journal,()=>{}));
  assert.equal(readFileSync(target,'utf8'),'original');
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('failed final validation restores the complete voice batch from verified originals',()=>{
 const dir=mkdtempSync(resolve(tmpdir(),'neighbor-cleanup-'));
 try{
  const hash=text=>createHash('sha256').update(text).digest('hex');
  const files=['first','second'].map(name=>{
   const target=resolve(dir,name),staged=resolve(dir,name+'-clean'),backup=resolve(dir,name+'-backup');
   writeFileSync(target,name);writeFileSync(staged,name+' clean');
   return {target,staged,backup,beforeSha256:hash(name),afterSha256:hash(name+' clean')};
  });
  const journal=resolve(dir,'journal');
  assert.throws(()=>replaceVoiceFiles(files,journal,()=>{throw Error('Injected final admission failure')}),/original files restored/);
  assert.equal(readFileSync(files[0].target,'utf8'),'first');assert.equal(readFileSync(files[1].target,'utf8'),'second');
  assert.equal(JSON.parse(readFileSync(journal)).status,'rolled-back');
  replaceVoiceFiles(files,journal,()=>{});
  assert.equal(readFileSync(files[0].target,'utf8'),'first clean');assert.equal(readFileSync(files[1].target,'utf8'),'second clean');
  assert.equal(JSON.parse(readFileSync(journal)).status,'complete');
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('cleanup lowers background noise while retaining speech-band signal and sample count',t=>{
 const dir=mkdtempSync(resolve(tmpdir(),'neighbor-cleanup-'));
 try{
  const rate=24000,samples=new Float32Array(rate*3);let seed=71803;
  for(let i=0;i<samples.length;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   samples[i]=.006*(seed/2**32-.5)+(i>=rate?.2*Math.sin(2*Math.PI*700*i/rate):0);
  }
  const path=resolve(dir,'signal.f32');writeFileSync(path,Buffer.from(samples.buffer));
  const filter=voiceFilter({processing:cleanProcessing},'jwd-heiko-maaslos');
  const bytes=ffmpeg(['-hide_banner','-loglevel','error','-f','f32le','-ar',String(rate),'-ac','1','-i',path,'-af',filter,'-f','f32le','pipe:1'],true);
  const cleaned=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
  assert.equal(cleaned.length,samples.length);
  assert.deepEqual(cleaned.slice(0,rate/4),samples.slice(0,rate/4),'opening syllables must remain intact');
  const rms=(s,start,end)=>Math.sqrt(s.slice(start,end).reduce((sum,v)=>sum+v*v,0)/(end-start));
  const before=rms(samples,rate/2,rate),after=rms(cleaned,rate/2,rate);
  assert.ok(after<before*.6,`noise attenuation: ${20*Math.log10(after/before)} dB`);
  const speechRatio=rms(cleaned,rate*2,rate*3)/rms(samples,rate*2,rate*3);
  assert.ok(speechRatio>.95&&speechRatio<1.05,`speech-band amplitude ratio ${speechRatio}`);
  t.diagnostic(JSON.stringify({noiseAttenuationDb:20*Math.log10(after/before),speechAmplitudeRatio:speechRatio,samples:cleaned.length}));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
