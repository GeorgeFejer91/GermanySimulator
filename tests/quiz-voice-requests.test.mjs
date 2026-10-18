import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {quizVoiceInventory,buildQuizVoiceRequest,validateQuizVoiceRequest} from '../tools/build-quiz-voice-requests.mjs';
import {createQuizHarness} from './quiz-harness.mjs';

test('all eligible quiz segments keep exact voice/source identities and available recordings',()=>{
 const inventory=quizVoiceInventory();
 assert.equal(inventory.status,'SOURCE_ONLY_NOT_GENERATION_OR_ADMISSION');
 assert.equal(inventory.rows.length,1348);assert.equal(inventory.rows.filter(row=>row.segment==='question').length,724);
 assert.equal(new Set(inventory.rows.map(row=>row.voiceId)).size,9);
 assert.equal(new Set(inventory.rows.map(row=>row.clipId)).size,1348);
 assert.equal(new Set(inventory.rows.map(row=>row.voiceId+'\0'+row.text)).size,1348);
 const existing=inventory.rows.filter(row=>row.existingDefault);
 assert.equal(existing.length,4);assert(existing.every(row=>row.segment==='question'));
 assert(existing.every(row=>row.existingDefault.sha256.length===64&&row.existingDefault.profileId===row.profileId));
});

test('Gisela first complete prompt reuses its accepted question and requests only the two missing parts',()=>{
 const request=buildQuizVoiceRequest({voiceId:'quiz-gisela-becker',region:'germany',questionId:'24',approachIndex:0});
 assert.equal(request.segments.length,3);assert.deepEqual(request.segments.map(row=>row.segment),['approach','context','question']);
 assert.deepEqual(request.jobs.map(row=>row.segment),['approach','context']);
 assert.equal(request.segments[2].existingDefault.path,'./assets/voices/quiz-segments/quiz-gisela-becker-question-24-germany.mp3');
 assert(request.segments.every(row=>row.profileId==='d37d406544a546fb8e5d1839bf3af558'));
 assert.equal(request.segments[1].text,vm.runInContext('quizContexts.civic.germany',createQuizHarness().scope));
 assert.equal(request.generationCalls,0);assert.equal(request.listening,'NOT RUN');
 assert.doesNotThrow(()=>validateQuizVoiceRequest(JSON.parse(JSON.stringify(request))));
});

test('exported sequences match actual controller speech for every speaker, region and eligible category',()=>{
 const people=createQuizHarness().scope.people;
 for(const person of people)for(const region of ['germany','berlin'])for(const category of person.categories){
  const h=createQuizHarness(region),{actor}=h.knownActor(person.id),question=h.seedQuestion(category);
  h.scope.nextVariant=(_key,lines)=>lines[3];
  assert.equal(h.scope.startCitizenshipQuiz(actor),true);
  const cue=h.effects.speech[0],request=buildQuizVoiceRequest({voiceId:person.voiceId,region,questionId:String(question.source),approachIndex:3});
  assert.equal(request.text,cue.text);assert.equal(request.english,cue.subtitle);
  assert.deepEqual(request.segments.map(row=>row.text),[...cue.candidateSegments]);
  assert(request.segments.every(row=>row.voiceId===cue.candidateVoiceId&&row.quizCharacterId===actor.quizCharacterId));
 }
});

test('invalid selections and changed frozen requests are rejected before native work',()=>{
 const selection={voiceId:'quiz-gisela-becker',region:'germany',questionId:'24',approachIndex:0};
 for(const change of [{voiceId:'foreign'},{region:'elsewhere'},{questionId:'G-C1-01'},{approachIndex:-1},{approachIndex:32},{approachIndex:1.5}])assert.throws(()=>buildQuizVoiceRequest({...selection,...change}));
 const valid=buildQuizVoiceRequest(selection);
 for(const mutate of [r=>r.jobs.pop(),r=>r.jobs.push(r.jobs[0]),r=>r.jobs[0].text+=' changed',r=>r.jobs[0].english='Wrong caption',r=>r.jobs[0].profileId='another-profile',r=>r.segments[2].existingDefault.sha256='0'.repeat(64),r=>r.sourceSha256['game.js']='0'.repeat(64),r=>r.status='AUTHORIZED']){
  const wrong=structuredClone(valid);mutate(wrong);assert.throws(()=>validateQuizVoiceRequest(wrong));
 }
});

test('CLI writes a source request once and preserves its frozen bytes on a repeated output path',()=>{
 const directory=mkdtempSync(join(tmpdir(),'quiz-voice-request-'));
 try{
  const output=join(directory,'request.json'),args=['tools/build-quiz-voice-requests.mjs','--voice-id','quiz-gisela-becker','--region','germany','--question-id','24','--approach-index','0','--output',output];
  const first=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true,timeout:15000});
  assert.equal(first.status,0,first.stderr);const bytes=readFileSync(output);
  assert.equal(JSON.parse(bytes).jobs.length,2);
  const second=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true,timeout:15000});
  assert.notEqual(second.status,0);assert.match(second.stderr,/EEXIST/);assert.deepEqual(readFileSync(output),bytes);
  const unknown=spawnSync(process.execPath,['tools/build-quiz-voice-requests.mjs','--render'],{encoding:'utf8',windowsHide:true,timeout:15000});
  assert.notEqual(unknown.status,0);assert.match(unknown.stderr,/Unknown option/);
 }finally{rmSync(directory,{recursive:true,force:true})}
});
