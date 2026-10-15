import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {neighborSpokenWords} from '../tools/curate-voice-library.mjs';

const root=resolve(import.meta.dirname,'..'),builder=resolve(root,'tools/build-neighbor-voices.mjs');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=(path,value)=>writeFileSync(path,JSON.stringify(value));
function fixture(t){
 const dir=mkdtempSync(resolve(tmpdir(),'germany-raw-receipts-'));
 t.after(()=>{assert.equal(dirname(dir),resolve(tmpdir()));assert.ok(basename(dir).startsWith('germany-raw-receipts-'));rmSync(dir,{recursive:true,force:true});});
 mkdirSync(resolve(dir,'data'));writeFileSync(resolve(dir,'voice-data-root.txt'),resolve(dir,'data'));
 const exe=resolve(dir,'voice-tool.exe');
 const args=[builder,'--voice-exe',exe,'--character','heiko','--plan'];
 const run=extra=>spawnSync(process.execPath,[...args,...extra],{cwd:root,encoding:'utf8'});
 const baseline=run([]);assert.equal(baseline.status,0,baseline.stderr);const plan=JSON.parse(baseline.stdout),line=plan.lines.find(l=>/[’']s\b/iu.test(l.text))??plan.lines[0],binding=plan.binding;
 const wav=resolve(dir,'native.wav'),benchPath=resolve(dir,'inference.json'),notePath=resolve(dir,'native.speech.json'),receiptPath=resolve(dir,'handoff.json');
 writeFileSync(wav,'Synthetic receipt fixture; no audio is rendered or admitted by --plan.');
 const parameters={numStep:64,speed:.9,device:'cuda',dtype:'f16',preprocessPrompt:true};
 json(benchPath,{seed:71520,iterations:[{output_wav:wav,frames:24000}]});
 const note={clip_id:line.clipId,text:line.text,voice_id:binding.profileId,reference_sha256:binding.referenceSha256,engine:binding.renderer,inference_revision:binding.modelRevision,nativeCompletion:{completed:true,inferenceParameters:parameters,inferenceSha256:sha(readFileSync(benchPath)),binarySha256:'f'.repeat(64)}};json(notePath,note);
 const candidate={family:'heiko',clipId:line.clipId,text:line.text,english:line.english,sourceSha256:sha(line.text),englishSha256:sha(line.english),profileId:binding.profileId,referenceSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,renderer:binding.renderer,modelRevision:binding.modelRevision,nativeCompleted:true,seed:71520,inferenceParameters:parameters,nativeWav:{path:wav,sha256:sha(readFileSync(wav))},nativeAnnotation:{path:notePath,sha256:sha(readFileSync(notePath))},inference:{path:benchPath,sha256:sha(readFileSync(benchPath))}};
 const receipt={status:'private raw batch terminal; no encoding or admission',results:[candidate]};
 return{receipt,candidate,note,notePath,wav,dir,sourcePlan:plan,execute:extra=>spawnSync(process.execPath,[...args.filter(arg=>arg!=='--plan'),...extra],{cwd:root,encoding:'utf8'}),plan:extra=>run(extra),run:()=>{json(receiptPath,receipt);return run(['--take-receipts',receiptPath]);}};
}

function renderFunctions(){
 const source=readFileSync(builder,'utf8'),names=['expandAuthoredContractions','contractionRenderInput','nativeSourceMatches'];
 const functions=names.map(name=>{const start=source.indexOf(`function ${name}(`),end=source.indexOf('\n}',start)+2;assert.ok(start>=0&&end>start);return source.slice(start,end);}).join('\n');
 const contractionPolicy=source.match(/const contractionPolicy='([^']+)'/)[1];
 return vm.runInNewContext(functions+'\n({expandAuthoredContractions,contractionRenderInput,nativeSourceMatches})',{sha,spokenWords:neighborSpokenWords,contractionPolicy});
}

function addRenderReceipt(f){
 const input=renderFunctions().contractionRenderInput({clipId:f.candidate.clipId,text:f.candidate.text});
 Object.assign(f.note,input,{text:input.actualInferenceText});
 Object.assign(f.candidate,{actualInferenceText:input.actualInferenceText,actualInferenceSha256:input.actualInferenceSha256,canonicalSourceSha256:input.canonicalSourceSha256,renderNormalizationPolicy:input.renderNormalizationPolicy});
 return()=>{json(f.notePath,f.note);f.candidate.nativeAnnotation.sha256=sha(readFileSync(f.notePath));};
}

test('raw receipt identity is checked in plan mode before any native job or asset write',t=>{
 const f=fixture(t),result=f.run();assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).family,'heiko');
});

test('raw imports reject unfinished batches, drifted words, translations, profiles and duplicate IDs',async t=>{
 for(const [name,change] of [
  ['unfinished batch',f=>{f.receipt.status='generating private raw';}],
  ['source words',f=>{f.candidate.text+=' nicht';}],
  ['translation',f=>{f.candidate.english+=' changed';}],
  ['profile',f=>{f.candidate.profileId='wrong-profile';}],
  ['reference',f=>{f.candidate.referenceSha256='0'.repeat(64);}],
  ['duplicate',f=>{f.receipt.results.push(structuredClone(f.candidate));}]
 ])await t.test(name,t=>{const f=fixture(t);change(f);const result=f.run();assert.notEqual(result.status,0);assert.match(result.stderr,/Private raw/);});
});

test('raw imports reject changed source bytes and incomplete native provenance',async t=>{
 await t.test('audio hash drift',t=>{const f=fixture(t);writeFileSync(f.wav,'changed');const result=f.run();assert.notEqual(result.status,0);assert.match(result.stderr,/file hash drift/);});
 await t.test('incomplete native job with otherwise matching file hashes',t=>{const f=fixture(t);f.note.nativeCompletion.completed=false;json(f.notePath,f.note);f.candidate.nativeAnnotation.sha256=sha(readFileSync(f.notePath));const result=f.run();assert.notEqual(result.status,0);assert.match(result.stderr,/native completion receipt drift/);});
});

test('failed manifest publication rolls back only the uncommitted new clip',()=>{
 const source=readFileSync(builder,'utf8'),start=source.indexOf('function commitClip('),end=source.indexOf('\n}',start)+2;
 assert.ok(start>=0&&end>start);const commitClip=vm.runInNewContext('('+source.slice(start,end)+')');
 const existing={clipId:'accepted-before'},candidate={clipId:'new-uncommitted'},clips=[existing];
 assert.throws(()=>commitClip(clips,candidate,()=>{throw Error('EPERM: locked manifest');}),/locked manifest/);
 assert.deepEqual(clips,[existing]);assert.equal(clips[0],existing);
 let published;commitClip(clips,candidate,()=>{published=clips.slice();});
 assert.deepEqual(published,[existing,candidate]);assert.deepEqual(clips,published);
});

test('bounded native timing is explicit in the frozen plan and limited to one fresh clip',async t=>{
 const f=fixture(t),only=['--only',f.candidate.clipId];
 const result=f.plan([...only,'--duration','40','--audio-chunk-threshold','15','--audio-chunk-duration','12']);
 assert.equal(result.status,0,result.stderr);const settings=JSON.parse(result.stdout).inferenceParameters;
 assert.equal(settings.duration,40);assert.equal(settings.audioChunkThreshold,15);assert.equal(settings.audioChunkDuration,12);
 for(const args of [['--duration','40'],[...only,'--duration','40','--reuse-only'],[...only,'--duration','0'],[...only,'--duration','NaN'],[...only,'--duration','121'],[...only,'--audio-chunk-duration','31']]){
  const rejected=f.plan(args);assert.notEqual(rejected.status,0);assert.match(rejected.stderr,/native timing|positive finite/);
 }
});

test('native timing rejects an accepted target instead of silently reusing it',()=>{
 const source=readFileSync(builder,'utf8'),start=source.indexOf('function assertTimingTarget('),end=source.indexOf('\n}',start)+2;
 assert.ok(start>=0&&end>start);const assertTimingTarget=vm.runInNewContext('('+source.slice(start,end)+')');
 const clip={clipId:'accepted-before'},retained=new Map([[clip.clipId,clip]]);
 assert.throws(()=>assertTimingTarget(['--duration','7'],new Set([clip.clipId]),retained),/requires a held clip/);
 assert.equal(retained.get(clip.clipId),clip);
 assert.doesNotThrow(()=>assertTimingTarget(['--duration','7'],new Set(['still-held']),retained));
 assert.doesNotThrow(()=>assertTimingTarget([],null,retained));
});

test('accepted timing fails before profile calls or private receipt writes',t=>{
 const manifestPath=resolve(root,'assets/voices/neighbors/heiko-manifest.json');
 if(!existsSync(manifestPath)){t.skip('No accepted Heiko fixture in this checkout');return;}
 const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
 if(!manifest.clips.length){t.skip('No accepted Heiko fixture in this checkout');return;}
 const f=fixture(t),result=f.execute(['--only',manifest.clips[0].clipId,'--duration','7']);
 assert.notEqual(result.status,0);assert.match(result.stderr,/requires a held clip/);assert.doesNotMatch(result.stderr,/Voice list|ENOENT/);
 assert.equal(existsSync(resolve(f.dir,'GermanySimulator street character production 2026-10-14')),false);
});

test('finite render expansion preserves canonical words and leaves unknown forms alone',()=>{
 const {expandAuthoredContractions,contractionRenderInput}=renderFunctions();
 for(const [source,expected] of [["du’s",'du es'],["Sie's",'Sie es'],["Ich’s und wir’s",'Ich es und wir es'],["Oma's D’Kehrwoch", "Oma's D’Kehrwoch"]]){
  assert.equal(expandAuthoredContractions(source),expected);assert.equal(neighborSpokenWords(expected),neighborSpokenWords(source));
 }
 const result=contractionRenderInput({clipId:'same-source',text:'Dann brauchst du’s nicht noch mal erklären.'});
 assert.equal(result.canonicalSourceText,'Dann brauchst du’s nicht noch mal erklären.');
 assert.equal(result.actualInferenceText,'Dann brauchst du es nicht noch mal erklären.');
 assert.equal(result.canonicalSourceSha256,sha(result.canonicalSourceText));assert.equal(result.actualInferenceSha256,sha(result.actualInferenceText));
 assert.throws(()=>contractionRenderInput({clipId:'none',text:'Unchanged source.'}),/no approved contraction/);
});

test('actual builder preview records both canonical and actual render bytes without changing source',t=>{
 const f=fixture(t),result=f.plan(['--only',f.candidate.clipId,'--expand-contractions']);assert.equal(result.status,0,result.stderr);
 const plan=JSON.parse(result.stdout),input=plan.renderInputs[0];assert.equal(plan.renderInputs.length,1);
 assert.equal(plan.lines.find(l=>l.clipId===input.clipId).text,f.candidate.text);assert.equal(input.canonicalSourceText,f.candidate.text);
 assert.notEqual(input.actualInferenceText,input.canonicalSourceText);assert.equal(neighborSpokenWords(input.actualInferenceText),neighborSpokenWords(input.canonicalSourceText));
 assert.equal(input.actualInferenceSha256,sha(input.actualInferenceText));assert.equal(input.canonicalSourceSha256,sha(f.candidate.text));
 assert.notEqual(f.plan(['--expand-contractions']).status,0);assert.notEqual(f.plan(['--only',f.candidate.clipId,'--expand-contractions','--reuse-only']).status,0);
});

test('raw admission accepts only truthful approved render normalization',async t=>{
 await t.test('truthful changed inference input',t=>{const f=fixture(t),save=addRenderReceipt(f);save();const result=f.run();assert.equal(result.status,0,result.stderr);});
 for(const [name,change] of [
  ['missing es',f=>{f.note.text=f.note.actualInferenceText=f.note.actualInferenceText.replace(/\bes\b/u,'');f.note.actualInferenceSha256=sha(f.note.text);f.candidate.actualInferenceText=f.note.text;f.candidate.actualInferenceSha256=sha(f.note.text);}],
  ['extra negation',f=>{f.note.text=f.note.actualInferenceText+=' nicht';f.note.actualInferenceSha256=sha(f.note.text);f.candidate.actualInferenceText=f.note.text;f.candidate.actualInferenceSha256=sha(f.note.text);}],
  ['falsely unchanged request label',f=>{f.note.text=f.candidate.text;}],
  ['actual input hash drift',f=>{f.note.actualInferenceSha256=f.candidate.actualInferenceSha256='0'.repeat(64);}],
  ['canonical source hash drift',f=>{f.note.canonicalSourceSha256=f.candidate.canonicalSourceSha256='0'.repeat(64);}],
  ['unreviewed normalization policy',f=>{f.note.renderNormalizationPolicy=f.candidate.renderNormalizationPolicy='arbitrary-rewrite';}],
  ['unlabelled changed input',f=>{delete f.note.renderNormalizationPolicy;delete f.candidate.renderNormalizationPolicy;}]
  ,['unlabelled falsely unchanged request',f=>{delete f.note.renderNormalizationPolicy;delete f.candidate.renderNormalizationPolicy;f.note.text=f.candidate.text;}]
 ])await t.test(name,t=>{const f=fixture(t),save=addRenderReceipt(f);change(f);save();const result=f.run();assert.notEqual(result.status,0);assert.match(result.stderr,/native completion receipt drift|actual render input receipt drift/);});
});


test('explicit voice executable works without Windows environment and missing defaults fail clearly',t=>{
 const f=fixture(t),env={...process.env};delete env.LOCALAPPDATA;
 const explicit=spawnSync(process.execPath,[builder,'--voice-exe',resolve(f.dir,'voice-tool.exe'),'--character','heiko','--plan'],{cwd:root,encoding:'utf8',env});
 assert.equal(explicit.status,0,explicit.stderr);assert.equal(JSON.parse(explicit.stdout).family,'heiko');
 const absent=spawnSync(process.execPath,[builder,'--plan'],{cwd:root,encoding:'utf8',env});
 assert.notEqual(absent.status,0);assert.match(absent.stderr,/Pass --voice-exe when LOCALAPPDATA is unavailable/);
});
