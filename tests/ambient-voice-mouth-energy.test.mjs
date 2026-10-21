import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {energy} from '../tools/neighbor-voice-processing.mjs';
import {validateAmbientMouthEnergy,ambientMouthRecordingsBlock} from '../tools/curate-voice-library.mjs';

const ids=['street-dietmar-din-norm-rule-03','street-dietmar-din-norm-rule-06','street-horst-hausordnung-rule-02','street-horst-hausordnung-rule-05','street-horst-hausordnung-rule-08','street-waltraud-wartemarke-rule-04','street-waltraud-wartemarke-rule-10','crowd-ruediger-rasenkante-berlin-01','quiz-gisela-becker-question-24-germany','quiz-ruediger-schmidt-question-g-b2-01-germany','quiz-sabine-krueger-question-g-b1-01-germany','quiz-heike-hoffmann-question-24-germany'];
const source=readFileSync(new URL('../For-AI/AUDIO-TEXT-LIBRARY.js',import.meta.url),'utf8');
function catalog(text=source){const context={window:{},location:{search:''},URLSearchParams};vm.runInNewContext(text,context);return context.window.GermanySimulatorAudioText;}
const current=catalog(),hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('All twelve owned existing ambient recordings project final-MP3 measured mouth energy',()=>{
 const clips=Object.entries(current.recordings).filter(([,clip])=>ids.includes(clip.clipId));
 assert.equal(clips.length,12);
 for(const [path,clip] of clips){
  assert.equal(clip.mouthHz,40,clip.clipId+' has a measured envelope');
  assert.ok(clip.mouthEnergy.length>0);
  assert.equal(current.candidateClip(clip.voiceId,clip.source),path,'existing default eligibility is preserved');
  const measured=energy(path);
  assert.deepEqual(Array.from(clip.mouthEnergy),measured.mouthEnergy,clip.clipId+' follows the existing final-MP3 recipe');
 }
});

test('Production mouth reader opens from each measured clip and closes outside its decoded envelope',()=>{
 const game=readFileSync(new URL('../game.js',import.meta.url),'utf8'),context={};
 vm.runInNewContext(game.slice(game.indexOf('function recordedMouthOpening('),game.indexOf('function getNeighborDialogue('))+'\nglobalThis.open=recordedMouthOpening;',context);
 for(const clip of Object.values(current.recordings).filter(clip=>ids.includes(clip.clipId))){
  const index=Array.from(clip.mouthEnergy).findIndex(value=>value>0);assert.ok(index>=0);
  assert.equal(context.open(clip,(index+.5)/40),clip.mouthEnergy[index]/255,clip.clipId);
  assert.equal(context.open(clip,-.1),0);assert.equal(context.open(clip,clip.mouthEnergy.length/40),0);
 }
});

test('Ambient supplement preserves all old identities, admission receipts and unrelated runtime entries',()=>{
 const base=catalog(source.replace(/^const ambientMouthRecordings=.*\r?\n/m,'').replace(/^ \.\.\.ambientMouthRecordings\([^\n]*\r?\n/m,''));
 const strip=clip=>JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(clip).filter(([key])=>!['mouthHz','mouthEnergy'].includes(key)))));
 assert.deepEqual(Object.keys(current.recordings),Object.keys(base.recordings));
 for(const [path,clip] of Object.entries(current.recordings)){
  assert.deepEqual(ids.includes(clip.clipId)?strip(clip):JSON.parse(JSON.stringify(clip)),ids.includes(clip.clipId)?strip(base.recordings[path]):JSON.parse(JSON.stringify(base.recordings[path])));
 }
 const supplement=JSON.parse(readFileSync(new URL('../assets/voices/ambient-mouth-energy.json',import.meta.url),'utf8'));
 assert.deepEqual(Object.keys(supplement.clips).sort(),[...ids].sort());
 for(const row of Object.values(supplement.clips)){
  const result=spawnSync('ffmpeg',['-nostdin','-threads','1','-hide_banner','-loglevel','error','-i',row.file,'-f','f32le','-ac','1','-ar','24000','pipe:1'],{encoding:null,windowsHide:true,timeout:10000,maxBuffer:4*1024*1024});
  assert.equal(result.status,0);assert.equal(hash(result.stdout),row.pcmSha256);
  assert.equal(result.stdout.length/4,row.sampleCount);assert.equal(row.durationSeconds,row.sampleCount/24000);
  assert.equal(row.mouthEnergy.length,Math.ceil(row.sampleCount/600));assert.equal(row.energySha256,hash(Buffer.from(row.mouthEnergy)));
  assert.equal(hash(readFileSync(row.file)),row.sha256);assert.equal(readFileSync(row.file).length,row.encodedBytes);
 }
});

test('Mouth supplementation cannot resurrect an absent recording when an owned projection is replaced',()=>{
 const reduced=source.replace(/const crowdRecordings=Object\.freeze\([^\n]*\);\r?\n/,'const crowdRecordings=Object.freeze({});\n');
 const reducedCatalog=catalog(reduced);
 const original=Object.entries(current.recordings).find(([,clip])=>clip.clipId==='crowd-ruediger-rasenkante-berlin-01')[0];
 assert.equal(Object.hasOwn(reducedCatalog.recordings,original),false,'energy annotates an existing recording; it does not create one');
 assert.equal(reducedCatalog.recordedClip('crowd-ruediger-rasenkante',current.recordings[original].source),null);
});

test('Ambient mouth admission rejects changed owner, decoded bins, recipe and source bytes',()=>{
 const original=JSON.parse(readFileSync(new URL('../assets/voices/ambient-mouth-energy.json',import.meta.url),'utf8'));
 for(const mutate of [row=>row.profileId='foreign',row=>row.source+=' extra',row=>row.sha256='0'.repeat(64),row=>row.sampleCount++,row=>row.mouthEnergy.pop(),row=>row.mouthEnergy[0]=256,row=>row.energySha256='0'.repeat(64)]){
  const changed=structuredClone(original);mutate(changed.clips[ids[0]]);assert.throws(()=>validateAmbientMouthEnergy(changed,current));
 }
 const extra=structuredClone(original);extra.clips.unowned=extra.clips[ids[0]];assert.throws(()=>validateAmbientMouthEnergy(extra,current),/scope/);
 const recipe=structuredClone(original);recipe.decodeRecipe[2]='8';assert.throws(()=>validateAmbientMouthEnergy(recipe,current),/recipe/);
 assert.throws(()=>ambientMouthRecordingsBlock(source.replace(/const ambientMouthEnergyReceipt=Object\.freeze\([^\n]*\);/,'const ambientMouthEnergyReceipt=Object.freeze({"assets/voices/ambient-mouth-energy.json":"'+'0'.repeat(64)+'"});')),/hash drift/);
});
