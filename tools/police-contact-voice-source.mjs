// Source-only request for the two new encounters. It never renders or admits audio.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';

const root=resolve(import.meta.dirname,'..'),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function policeContactSources(cast,sourceRoot=root){
 const source=readFileSync(resolve(sourceRoot,'game.js'),'utf8'),start=source.indexOf('function policeContact(');
 if(start<0)throw Error('Missing policeContact owner');
 const body=source.slice(start,source.indexOf('\n}',start)),pairs={};
 for(const key of ['de','english']){
  const row=body.match(new RegExp("const "+key+"=fine\\?('(?:\\\\.|[^'\\\\])*'):('(?:\\\\.|[^'\\\\])*');"));
  if(!row)throw Error('Police encounter must retain exact literal paired source');
  pairs[key]={fine:vm.runInNewContext(row[1]),warning:vm.runInNewContext(row[2])};
 }
 const owner=cast.roleProfiles.find(person=>person.gameRole==='police'),voiceId='polizei-heinrich-wachtmeister',binding=cast.productionVoices[voiceId];
 if(owner?.voiceId!==voiceId||owner.secretTunnelProfileId!==binding?.profileId||binding.renderer!=='ResembleAI/Chatterbox Multilingual V2 0.1.7')throw Error('Wrong selected police identity');
 return ['warning','fine'].map((kind,index)=>{
  const clipId=`police-contact-${kind}`,text=pairs.de[kind],english=pairs.english[kind],sourceLocator=`game.js policeContact.${kind}`;
  if(!owner.encounterDialogue?.some(row=>row.id===clipId&&row.locator===sourceLocator&&row.text===text&&row.english===english))throw Error('Police encounter cast/source drift');
  return {clipId,voiceId,actorId:'police',region:'shared',slot:index,sourceLocator,text,english,profileId:binding.profileId,referenceSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,renderer:binding.renderer,modelRevision:binding.modelRevision,processing:binding.processing??null};
 });
}
export function policeContactRequest(sourceRoot=root){
 const cast=JSON.parse(readFileSync(resolve(sourceRoot,'For-AI/VOICE-CAST.json'),'utf8'));
 return {schemaVersion:1,family:'police-contact',sourceScope:'police-contact-two-v1',status:'SOURCE_ONLY_NOT_A_GENERATION_GRANT',publicAssetFamily:'assets/voices/police-contact',privateReviewFamily:'GermanySimulator police contact review 2026-10-21',sourceSha256:Object.fromEntries(['game.js','For-AI/VOICE-CAST.json','tools/police-contact-voice-source.mjs'].map(path=>[path,hash(readFileSync(resolve(sourceRoot,path)))])),jobs:policeContactSources(cast,sourceRoot)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(JSON.stringify(policeContactRequest(),null,2));
