import test from 'node:test';
import assert from 'node:assert/strict';
import {copyFileSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {dirname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {checkQuizGerman9AdmittedCatalog,quizGerman9DurationEvidence} from '../tools/curate-voice-library.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const relative='assets/voices/quiz-segments/quiz-german9-manifest.json';
const catalogFile='For-AI/AUDIO-TEXT-LIBRARY.js',castFile='For-AI/VOICE-CAST.json';
const read=(base,file)=>readFileSync(resolve(base,file),'utf8');
const json=(base,file)=>JSON.parse(read(base,file));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest=json(root,relative);
const accepted=[['gisela-becker','24','civic'],['ruediger-schmidt','G-B2-01','grammar-b2'],['sabine-krueger','G-B1-01','grammar-b1'],['heike-hoffmann','24','civic']];
const held=[['uwe-moeller','24','civic'],['brigitte-neumann','KL-01','technik'],['klaus-dieter-wagner','FS-01','traffic'],['dietmar-schulz','G-C1-01','grammar-c1'],['hartmut-keller','FS-01','traffic']];
const clipId=([actor,question])=>`quiz-${actor}-question-${question.toLowerCase()}-germany`;
function runtime(source){const context={window:{}};vm.runInNewContext(source,context,{timeout:3000});return context.window.GermanySimulatorAudioText;}
function fixture(t){
 const directory=mkdtempSync(resolve(tmpdir(),'gs-quiz-public-'));
 t.after(()=>{assert.ok(resolve(directory).startsWith(resolve(tmpdir())+sep));rmSync(directory,{recursive:true,force:true})});
 for(const file of ['game.js',castFile,catalogFile,'For-AI/QUIZ-CHARACTER-DICTIONARY.js',relative,...manifest.clips.map(row=>row.file)]){
  const target=resolve(directory,file);mkdirSync(dirname(target),{recursive:true});copyFileSync(resolve(root,file),target);
 }
 return {directory,check(){return checkQuizGerman9AdmittedCatalog(json(directory,castFile),read(directory,catalogFile),directory,directory)},save(file,value){writeFileSync(resolve(directory,file),typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value,null,2)+'\n')}};
}

test('shipped German9 accounts for four exact question takes and five held owners with their selected profiles',()=>{
 const cast=json(root,castFile),source=read(root,catalogFile),catalog=runtime(source);
 assert.equal(manifest.requestedLineCount,9);assert.equal(manifest.generatedLineCount,9);assert.equal(manifest.lineCount,4);
 assert.deepEqual(manifest.clips.map(row=>row.clipId),accepted.map(clipId));
 assert.deepEqual(manifest.heldPrivate.map(row=>row.clipId),held.map(clipId));
 const all=[...manifest.clips,...manifest.heldPrivate];assert.equal(new Set(all.map(row=>row.voiceId)).size,9);
 for(const [rows,expected] of [[manifest.clips,accepted],[manifest.heldPrivate,held]])for(const [index,row] of rows.entries()){
  const [actor,question,category]=expected[index],binding=cast.productionVoices['quiz-'+actor];
  assert.equal(row.actorId,actor);assert.equal(row.quizCharacterId,actor);assert.equal(row.voiceId,'quiz-'+actor);
  assert.equal(String(row.questionId),question);assert.equal(row.questionCategory,category);assert.equal(row.region,'germany');assert.equal(row.segment,'question');
  assert.equal(row.profileId,binding.profileId);assert.equal(row.referenceSha256,binding.referenceSha256);assert.equal(row.referenceOriginalSha256,binding.originalSha256);
 }
 for(const row of manifest.clips){
  assert.equal(row.decode.eosReached,true);assert.equal(row.asrLiteralWordExact,true);assert.equal(row.asrDevice,'cpu');assert.equal(row.asrCpuThreads,1);
  assert.equal(catalog.candidateClip(row.voiceId,row.text),'./'+row.file);
  const entry=catalog.recordings['./'+row.file];assert.equal(entry.profileId,row.profileId);assert.equal(entry.source,row.text);assert.equal(entry.english,row.english);
  assert.equal(entry.sha256,digest(readFileSync(resolve(root,row.file))));
 }
 for(const row of manifest.heldPrivate){assert.match(row.reason,/literal exact German ASR/);assert.equal(Object.values(catalog.recordings).some(clip=>clip.clipId===row.clipId&&clip.approval?.grantId===manifest.quizAdmission.grantId),false,'held row must not be published by this finite grant');}
 const anchor=source.match(/const quizGerman9AdmissionReceipts=Object\.freeze\((\{[^\n]*\})\);/);assert.ok(anchor);
 assert.equal(JSON.parse(anchor[1])[relative],digest(readFileSync(resolve(root,relative))));
 assert.equal(checkQuizGerman9AdmittedCatalog(cast,source,root,root),true);
});

test('offline quiz integrity accepts unrelated game and cast metadata edits',t=>{
 const f=fixture(t);f.save('game.js',read(f.directory,'game.js')+'\n// Unrelated public regression metadata.\n');
 const cast=json(f.directory,castFile);cast.publicRegressionNote='unrelated cast metadata';f.save(castFile,cast);
 assert.equal(f.check(),true);
});

test('normal sequence lookup requires every segment to be approved for that exact voice',()=>{
 const catalog=runtime(read(root,catalogFile)),own=manifest.clips[0],foreign=manifest.clips.find(row=>row.voiceId!==own.voiceId&&row.text!==own.text);assert.ok(foreign);
 // A lookup contract, not a claim that a complete approach/context/question prompt exists.
 const exact=[own.text,own.text,own.text],paths=[own.file,own.file,own.file].map(file=>'./'+file);
 assert.deepEqual(Array.from(catalog.candidateSequence(own.voiceId,exact)||[]),paths);
 assert.equal(catalog.candidateSequence(own.voiceId,[own.text,'UNGRANTED PUBLIC REGRESSION SEGMENT',own.text]),null);
 assert.equal(catalog.candidateClip(own.voiceId,foreign.text),null);
 assert.equal(catalog.candidateSequence(own.voiceId,[own.text,foreign.text,own.text]),null);
 assert.equal(catalog.candidateSequence(foreign.voiceId,exact),null);
});

test('offline quiz integrity rejects changed public MP3 bytes',t=>{
 const f=fixture(t),file=manifest.clips[0].file;f.save(file,Buffer.concat([readFileSync(resolve(f.directory,file)),Buffer.from([0])]));
 assert.throws(()=>f.check(),/public MP3 bytes changed/);
});

test('offline quiz integrity rejects manifest edits and reanchored incomplete accounting',t=>{
 const f=fixture(t),changed=json(f.directory,relative);changed.status+=' altered';f.save(relative,changed);
 assert.throws(()=>f.check(),/manifest anchor\/hash changed/);
 changed.heldPrivate.pop();f.save(relative,changed);
 const source=read(f.directory,catalogFile),anchor=source.match(/const quizGerman9AdmissionReceipts=Object\.freeze\((\{[^\n]*\})\);/);assert.ok(anchor);
 const map=JSON.parse(anchor[1]);map[relative]=digest(readFileSync(resolve(f.directory,relative)));
 f.save(catalogFile,source.replace(anchor[0],'const quizGerman9AdmissionReceipts=Object.freeze('+JSON.stringify(map)+');'));
 assert.throws(()=>f.check(),/finite inventory\/accounting|exactly the granted nine/);
});

test('offline quiz integrity rejects a changed selected profile',t=>{
 const f=fixture(t),cast=json(f.directory,castFile);cast.productionVoices[manifest.clips[0].voiceId].profileId='00000000000000000000000000000000';f.save(castFile,cast);
 assert.throws(()=>f.check(),/selected profile\/reference\/renderer binding changed/);
});

test('offline quiz integrity rejects owned English and German source drift',t=>{
 const f=fixture(t),clip=manifest.clips[0],source=read(f.directory,catalogFile),literal=JSON.stringify(clip.english);assert.ok(source.includes(literal));
 f.save(catalogFile,source.replaceAll(literal,JSON.stringify(clip.english+' changed')));
 assert.throws(()=>f.check(),/German source\/English subtitle locator changed/);
 f.save(catalogFile,source);
 const game=read(f.directory,'game.js'),match=game.match(/const citizenshipQuestions=(\[[\s\S]*?\]);\nconst berlinCitizenshipQuestions=/);assert.ok(match);
 const questionLiteral=JSON.stringify(clip.text);assert.ok(match[1].includes(questionLiteral));
 const changed=match[0].replace(questionLiteral,JSON.stringify(clip.text+' geändert'));
 f.save('game.js',game.replace(match[0],()=>changed));assert.throws(()=>f.check(),/authored character\/question\/category/);
});

test('offline quiz integrity rejects a changed generated recording block',t=>{
 const f=fixture(t),source=read(f.directory,catalogFile),marker='const quizGerman9Recordings=Object.freeze(';assert.ok(source.includes(marker));
 f.save(catalogFile,source.replace(marker,marker+'/* changed projection */'));
 assert.throws(()=>f.check(),/admitted recording block is stale/);
});

test('raw and encoded durations bind their own public receipt domains independently',()=>{
 const rawHash='a'.repeat(64),encodedHash='b'.repeat(64),raw={durationSeconds:2.4},encoded={durationSeconds:2.424};
 const render={durationSeconds:2.4,rawSha256:rawHash},processed={durationSeconds:2.424,encodedSha256:encodedHash};
 assert.equal(quizGerman9DurationEvidence(raw,encoded,render,processed,rawHash,encodedHash),true);
 assert.equal(quizGerman9DurationEvidence(raw,encoded,{...render,durationSeconds:2.424},processed,rawHash,encodedHash),false);
 assert.equal(quizGerman9DurationEvidence(raw,encoded,render,{...processed,durationSeconds:2.4},rawHash,encodedHash),false);
 assert.equal(quizGerman9DurationEvidence(raw,encoded,render,{...processed,encodedSha256:'c'.repeat(64)},rawHash,encodedHash),false);
 for(const invalid of [0,-.1,Number.NaN]){
  assert.equal(quizGerman9DurationEvidence({durationSeconds:invalid},encoded,{...render,durationSeconds:invalid},processed,rawHash,encodedHash),false,'invalid raw duration must fail even when its render summary agrees');
  assert.equal(quizGerman9DurationEvidence(raw,{durationSeconds:invalid},render,{...processed,durationSeconds:invalid},rawHash,encodedHash),false,'invalid encoded duration must fail even when its process summary agrees');
 }
});
