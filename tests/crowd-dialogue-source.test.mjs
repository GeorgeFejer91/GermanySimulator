import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {crowdCandidateBlock} from '../tools/curate-voice-library.mjs';

const root=new URL('../',import.meta.url);
const game=readFileSync(new URL('game.js',root),'utf8').replace(/\r\n/g,'\n');
const catalogSource=readFileSync(new URL('For-AI/AUDIO-TEXT-LIBRARY.js',root),'utf8');
const cast=JSON.parse(readFileSync(new URL('For-AI/VOICE-CAST.json',root),'utf8'));
const request=JSON.parse(readFileSync(new URL('./fixtures/crowd-dialogue-source-rows.json',import.meta.url),'utf8'));
const sourceMatch=game.match(/const crowdCharacterBarks=(Object\.freeze\([\s\S]*?\));\nconst crowdArchetypeById/);
assert.ok(sourceMatch,'actor-owned German source block must exist');
const german=vm.runInNewContext(sourceMatch[1]);
const window={};vm.runInNewContext(catalogSource,{window});
const english=window.GermanySimulatorAudioText.pools.crowdPersonalized;
const roleRows=cast.roleProfiles.filter(row=>Object.hasOwn(german,row.gameRole));
const byVoice=Object.fromEntries(roleRows.map(row=>[row.voiceId,row]));

function runtimeSelection(voiceId,region,surface='sidewalk'){
 const caller=game.split('\n').find(line=>line.includes('const region=state.region,archetype=crowdArchetypeById[n.archetype]'));
 assert.ok(caller,'pedestrianBark implementation must exist');
 const declaration=caller.match(/const region=state\.region,archetype=.*?;n\.barkAt/)?.[0].replace(/;n\.barkAt$/,'');
 assert.ok(declaration?.includes('variantPool=')&&declaration.includes('family='),'variant and arbitration pools must remain in the actual caller');
 const archetype={barks:{[region]:['fallback 0','fallback 1']}};
 const context={n:{voiceId,archetype:'fallback'},state:{region},surface,crowdCharacterBarks:german,crowdArchetypeById:{fallback:archetype},pedestrianBarks:{[region]:{sidewalk:['surface 0','surface 1'],grass:['surface 0','surface 1']}},nextVariant:(_pool,values)=>values[0]};
 return vm.runInNewContext(`(()=>{const n=ctx.n,state=ctx.state,surface=ctx.surface,crowdCharacterBarks=ctx.crowdCharacterBarks,crowdArchetypeById=ctx.crowdArchetypeById,pedestrianBarks=ctx.pedestrianBarks,nextVariant=ctx.nextVariant;${declaration};return {lines,family,variantPool}})()`,{ctx:context});
}

test('the 36 frozen jobs exactly match actor-owned German lines, English subtitles and selected profile bindings',()=>{
 assert.equal(request.family,'crowd-dialogue');assert.equal(request.jobs.length,36);
 assert.equal(roleRows.length,9);assert.equal(new Set(request.jobs.map(row=>row.clipId)).size,36);
 for(const [voiceId,regions] of Object.entries(german)){
  const owner=byVoice[voiceId],binding=cast.productionVoices[voiceId];assert.ok(owner);assert.equal(owner.voiceId,voiceId);
  assert.ok(owner.dialogueSources.some(value=>value.includes(`actor-owned crowdCharacterBarks[${voiceId}]`)));
  assert.ok(binding);
  for(const region of ['berlin','germany'])for(let slot=0;slot<2;slot++){
   const row=request.jobs.find(job=>job.clipId===`${voiceId}-${region}-${String(slot+1).padStart(2,'0')}`);
   assert.ok(row);assert.equal(row.actorId,voiceId);assert.equal(row.voiceId,voiceId);
   assert.equal(row.text,regions[region][slot]);assert.equal(row.english,english[voiceId][region][slot]);
   assert.equal(row.sourceLocator,`game.js crowdCharacterBarks[${voiceId}].${region}[${slot}]`);
   assert.equal(row.profileId,binding.profileId);assert.equal(row.referenceSha256,binding.referenceSha256);
   assert.equal(row.referenceOriginalSha256,binding.originalSha256);assert.equal(row.renderer,binding.renderer);
  }
 }
});

test('the actual sidewalk caller resolves both custom slots and preserves the old archetype fallback',()=>{
 for(const [voiceId,regions] of Object.entries(german))for(const region of ['berlin','germany']){
  assert.deepEqual(runtimeSelection(voiceId,region).lines,regions[region]);
 }
 assert.deepEqual(runtimeSelection('crowd-waltraud-wartemarke','berlin').lines,['fallback 0','fallback 1']);
 assert.deepEqual(runtimeSelection('crowd-baerbel-brezel','berlin','grass').lines,['surface 0','surface 1']);
});

test('interleaved callers keep independent two-slot bags without changing arbitration family',()=>{
 const [voiceA,voiceB]=Object.keys(german),region='germany',bags=new Map();
 const nextVariantSource=game.split('\n').find(line=>line.startsWith('function nextVariant('));
 assert.ok(nextVariantSource,'actual nextVariant implementation must remain available');
 const nextVariant=vm.runInNewContext(`(${nextVariantSource})`,{stimulusBags:bags,Math:{random:()=>0,floor:Math.floor}});
 const a=runtimeSelection(voiceA,region),b=runtimeSelection(voiceB,region);
 const firstA=nextVariant(a.variantPool,a.lines),firstB=nextVariant(b.variantPool,b.lines),secondA=nextVariant(a.variantPool,a.lines);
 assert.equal(firstA,german[voiceA][region][0]);
 assert.equal(firstB,german[voiceB][region][0]);
 assert.equal(secondA,german[voiceA][region][1]);
 assert.equal(a.family,b.family,'audio arbitration remains shared by archetype/region/surface');
 assert.notEqual(a.variantPool,b.variantPool,'personalized line bags are isolated by voice');
});

test('candidate voice lookup remains opt-in and returns no public default for a crowd take',()=>{
 const row=request.jobs[0],projection=`const crowdCandidateDialogue=Object.freeze({[${JSON.stringify(row.voiceId+'\u0000'+row.text)}]:${JSON.stringify('assets/voices/candidate-dialogue/'+row.clipId+'.mp3')}});`;
 const projected=catalogSource.replace('const crowdCandidateDialogue=Object.freeze({});',projection);
 const preview={window:{},location:{search:'?voicePreview=1'},URLSearchParams};vm.runInNewContext(projected,preview);
 assert.equal(preview.window.GermanySimulatorAudioText.candidateClip(row.voiceId,row.text),`assets/voices/candidate-dialogue/${row.clipId}.mp3`);
 const normal={window:{},location:{search:''},URLSearchParams};vm.runInNewContext(projected,normal);
 assert.equal(normal.window.GermanySimulatorAudioText.candidateClip(row.voiceId,row.text),null);
});

function heldManifest(voiceId='crowd-baerbel-brezel'){
 const jobs=request.jobs.filter(row=>row.voiceId===voiceId);
 return {voiceId,profileId:cast.productionVoices[voiceId].profileId,requestedLineCount:4,generatedLineCount:0,lineCount:0,clips:[],heldPrivate:jobs.map(row=>({...row,reason:'held privately'}))};
}

test('curator accepts an exactly accounted owned hold and rejects empty, duplicate or misowned held rows',()=>{
 const sourceRoot=fileURLToPath(new URL('../',import.meta.url));
 const manifest=heldManifest();
 assert.equal(crowdCandidateBlock(cast,[manifest],sourceRoot),'const crowdCandidateDialogue=Object.freeze({});\n');
 assert.throws(()=>crowdCandidateBlock(cast,[{...manifest,heldPrivate:[{},{},{},{}]}],sourceRoot),/exactly four unique owned region slots/);
 assert.throws(()=>crowdCandidateBlock(cast,[{...manifest,heldPrivate:[manifest.heldPrivate[0],manifest.heldPrivate[0],manifest.heldPrivate[0],manifest.heldPrivate[0]]}],sourceRoot),/exactly four unique owned region slots/);
 const wrongSlot=heldManifest();wrongSlot.heldPrivate[0]={...wrongSlot.heldPrivate[0],slot:1};
 assert.throws(()=>crowdCandidateBlock(cast,[wrongSlot],sourceRoot),/ownership, profile, text, subtitle or slot differs/);
 const wrongProfile=heldManifest();wrongProfile.heldPrivate[0]={...wrongProfile.heldPrivate[0],profileId:'foreign-profile'};
 assert.throws(()=>crowdCandidateBlock(cast,[wrongProfile],sourceRoot),/ownership, profile, text, subtitle or slot differs/);
 assert.throws(()=>crowdCandidateBlock(cast,[heldManifest('crowd-waltraud-wartemarke')],sourceRoot),/actor-owned source\/profile/);
 const accepted=heldManifest();accepted.clips=accepted.heldPrivate;accepted.heldPrivate=[];accepted.lineCount=4;accepted.generatedLineCount=4;
 accepted.clips[0]={...accepted.clips[0],actorId:'foreign-actor'};
 assert.throws(()=>crowdCandidateBlock(cast,[accepted],sourceRoot),/ownership, profile, text, subtitle or slot differs/);
});
