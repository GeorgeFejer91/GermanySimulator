import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createQuizHarness} from '../tests/quiz-harness.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const status='SOURCE_ONLY_NOT_GENERATION_OR_ADMISSION';
const sourcePaths=['game.js','For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js',
 'For-AI/QUIZ-CHARACTER-DICTIONARY.js','tests/quiz-harness.mjs','tools/build-quiz-voice-requests.mjs'];
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFileSync(resolve(root,path));
const sourceSha256=Object.fromEntries(sourcePaths.map(path=>[path,sha256(read(path))]));

function existingRecording(catalog,row){
 const path=catalog.recordedClip(row.voiceId,row.text)||catalog.candidateClip(row.voiceId,row.text);
 if(!path)return null;
 const clip=catalog.recordings[path];assert.ok(clip,'Default recording metadata: '+path);
 const expected={voiceId:row.voiceId,profileId:row.profileId,source:row.text,english:row.english,
  referenceSha256:row.referenceSha256,referenceOriginalSha256:row.referenceOriginalSha256,
  renderer:row.renderer,modelRevision:row.modelRevision,processing:row.processing};
 for(const [key,value] of Object.entries(expected))assert.equal(clip[key]??null,value,'Default recording '+key+': '+path);
 const hash=sha256(read(path));assert.equal(hash,clip.sha256,'Default recording bytes: '+path);
 const manifestHash=sha256(read(clip.provenanceManifest));
 assert.equal(manifestHash,clip.provenanceManifestSha256,'Default recording provenance: '+path);
 return{path,sha256:hash,profileId:clip.profileId,provenanceManifest:clip.provenanceManifest,
  provenanceManifestSha256:manifestHash,
  listeningConfirmed:clip.approval?.listeningConfirmed===true};
}

function voiceBinding(catalog,cast,person){
 const binding=catalog.productionVoices[person.voiceId],owner=cast.roleProfiles.find(role=>role.gameRole===person.voiceId);
 assert.ok(binding&&owner,'Selected quiz voice: '+person.voiceId);
 assert.equal(owner.secretTunnelProfileId,binding.profileId,'Selected profile owner');
 const selected={profileId:binding.profileId,referenceSha256:binding.referenceSha256,
  referenceOriginalSha256:binding.originalSha256,renderer:binding.renderer,
  modelRevision:binding.modelRevision,processing:binding.processing??null};
 for(const [key,value] of Object.entries(selected))assert.equal(cast.productionVoices[person.voiceId][key==='referenceOriginalSha256'?'originalSha256':key]??null,value,'Cast binding '+key);
 return selected;
}

export function quizVoiceInventory(){
 for(const path of sourcePaths)assert.equal(sha256(read(path)),sourceSha256[path],'Source changed; restart exporter: '+path);
 const h=createQuizHarness(),catalog=h.scope.speechCatalog,cast=JSON.parse(read('For-AI/VOICE-CAST.json'));
 const {quizApproaches,quizContexts,berlinCitizenshipQuestions}=vm.runInContext('({quizApproaches,quizContexts,berlinCitizenshipQuestions})',h.scope);
 const rows=[];
 for(const person of h.scope.people){
  const binding=voiceBinding(catalog,cast,person);
  for(const region of ['germany','berlin']){
   const append=(segment,slot,questionCategory,text,english,sourceLocator,englishSourceLocator)=>{
    assert.ok(typeof text==='string'&&text.length&&typeof english==='string'&&english.length,'Exact quiz text and English');
    const row={clipId:person.voiceId+'-'+segment+'-'+slot+'-'+region,voiceId:person.voiceId,
     actorId:person.id,quizCharacterId:person.id,region,segment,slot,questionId:segment==='question'?slot:null,
     questionCategory,text,english,sourceLocator,englishSourceLocator,sourceSha256:sha256(text),...binding};
    row.existingDefault=existingRecording(catalog,row);rows.push(row);
   };
   quizApproaches[region].forEach((text,index)=>append('approach',String(index),null,text,catalog.pools.quizApproaches[index],
    'game.js quizApproaches.'+region+'['+index+']','For-AI/AUDIO-TEXT-LIBRARY.js pools.quizApproaches['+index+']'));
   for(const category of person.categories)append('context',category,category,quizContexts[category][region],catalog.quizContexts[category],
    'game.js quizContexts['+JSON.stringify(category)+'].'+region,'For-AI/AUDIO-TEXT-LIBRARY.js quizContexts['+JSON.stringify(category)+']');
   h.scope.questions.forEach((question,index)=>{
    const category=h.scope.quizQuestionCategory(question),id=String(question.source);
    if(!person.categories.includes(category))return;
    const text=region==='berlin'?berlinCitizenshipQuestions[id].question:question.question;
    append('question',id,category,text,catalog.questions[id],region==='berlin'?
     'game.js berlinCitizenshipQuestions['+JSON.stringify(id)+'].question':'game.js citizenshipQuestions['+index+'].question',
     'For-AI/AUDIO-TEXT-LIBRARY.js questions['+JSON.stringify(id)+']');
   });
  }
 }
 return{status,generationCalls:0,listening:'NOT RUN',sourceSha256:{...sourceSha256},rows};
}

export function buildQuizVoiceRequest({voiceId,region='germany',questionId,approachIndex=0}={}){
 assert.ok(typeof voiceId==='string'&&typeof questionId==='string','Select a quiz voice and question ID');
 assert.ok(region==='germany'||region==='berlin','Unknown quiz region');
 assert.ok(Number.isInteger(approachIndex)&&approachIndex>=0,'Invalid approach index');
 const inventory=quizVoiceInventory(),rows=inventory.rows.filter(row=>row.voiceId===voiceId&&row.region===region);
 const question=rows.find(row=>row.segment==='question'&&row.questionId===questionId);
 assert.ok(question,'Question is not eligible for this selected speaker');
 const approach=rows.find(row=>row.segment==='approach'&&row.slot===String(approachIndex));
 assert.ok(approach,'Invalid approach index');
 const context=rows.find(row=>row.segment==='context'&&row.questionCategory===question.questionCategory);
 assert.ok(context,'Missing quiz context');
 const segments=[approach,context,question];
 return{status,generationCalls:0,listening:'NOT RUN',sourceSha256:inventory.sourceSha256,
  selection:{voiceId,region,questionId,approachIndex},text:segments.map(row=>row.text).join(' '),
  english:segments.map(row=>row.english).join(' '),segments,jobs:segments.filter(row=>!row.existingDefault)};
}

export function validateQuizVoiceRequest(request){
 const current=buildQuizVoiceRequest(request.selection);
 assert.deepEqual(request,current,'Quiz source request changed or is stale');
 return current;
}

function main(args){
 const names={'--voice-id':'voiceId','--region':'region','--question-id':'questionId','--approach-index':'approachIndex','--output':'output'},options={};
 for(let i=0;i<args.length;i+=2){
  const key=names[args[i]];assert.ok(key,'Unknown option: '+args[i]);
  assert.ok(!Object.hasOwn(options,key),'Repeated option: '+args[i]);
  assert.ok(args[i+1]&&!args[i+1].startsWith('--'),'Missing value: '+args[i]);options[key]=args[i+1];
 }
 const {output,...selection}=options;
 if(Object.hasOwn(selection,'approachIndex')){
  assert.match(selection.approachIndex,/^\d+$/,'Invalid approach index');selection.approachIndex=Number(selection.approachIndex);
 }
 const request=Object.keys(selection).length?buildQuizVoiceRequest(selection):quizVoiceInventory();
 const json=JSON.stringify(request,null,2)+'\n';
 if(output){writeFileSync(output,json,{flag:'wx'});console.log(JSON.stringify({status,output,segments:request.segments?.length??request.rows.length,jobs:request.jobs?.length??null}));}
 else process.stdout.write(json);
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main(process.argv.slice(2));
