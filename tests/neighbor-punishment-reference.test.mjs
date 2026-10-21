import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {resolve,dirname,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {punishmentReferenceInputs,validPunishmentReferenceConditioning,literalPunishmentReference,punishmentSwabianRenderInput,validPunishmentSwabianRenderInput} from '../tools/neighbor-punishment-reference.mjs';
import {validNeighborReferenceConditioning} from '../tools/curate-voice-library.mjs';

function clip(){const r=punishmentReferenceInputs['jwd-inga-maaslos'];return {clipId:'punishment-inga-01',voiceId:r.voiceId,profileId:r.profileId,referenceSha256:r.profileReferenceSha256,referenceOriginalSha256:r.profileOriginalSha256,referenceConditioning:{...r.conditioning},nativeCompletion:{inferenceParameters:{numStep:32,speed:1,device:'cuda',dtype:'f16',preprocessPrompt:true}}}}
test('finite literal input preserves selected Inga identity and applies only to missing new sources',()=>{
 const c=clip();assert.equal(validPunishmentReferenceConditioning(c),true);assert.equal(validNeighborReferenceConditioning(c),true);
 c.clipId+='-part-1';assert.equal(validPunishmentReferenceConditioning(c),true);
 for(const change of [{clipId:'punishment-inga-04'},{clipId:'punishment-inga-05'},{clipId:'inga-story-01'},{voiceId:'jwd-heiko-maaslos'},{profileId:'other'},{referenceOriginalSha256:'0'.repeat(64)},{nativeParts:[{}]}])assert.equal(validPunishmentReferenceConditioning({...clip(),...change}),false);
});
test('finite new Swabian inference spelling expands only swept without changing the canonical caption',()=>{
 const line={clipId:'punishment-schwabingen-01',voiceId:'jwd-frau-schwabingen',text:'Sie hättet gkehrt.'},input=punishmentSwabianRenderInput(line);
 assert.equal(input.actualInferenceText,'Sie hättet gekehrt.');assert.equal(input.canonicalSourceText,line.text);
 assert.equal(validPunishmentSwabianRenderInput({...line,...input}),true);
 for(const change of [{actualInferenceText:'Sie hättet gehört.'},{text:'Sie hättet gehört.'},{voiceId:'jwd-inga-maaslos'},{clipId:'schwabingen-story-11'},{nativeParts:[]},{renderNormalizationPolicy:'other'}])assert.equal(validPunishmentSwabianRenderInput({...line,...input,...change}),false);
 assert.throws(()=>punishmentSwabianRenderInput({...line,text:'Sie haben gehört.'}),/elision/u);
});
test('exact input range/text/PCM/receipt and default controls cannot drift',()=>{
 for(const key of ['referenceText','sourceStartSample','sourceEndSampleExclusive','referenceSha256','referencePcmSha256','inputProofSha256']){
  const c=clip();c.referenceConditioning[key]=typeof c.referenceConditioning[key]==='number'?c.referenceConditioning[key]+1:'changed';assert.equal(validPunishmentReferenceConditioning(c),false);
 }
 for(const [key,value]of Object.entries({numStep:64,speed:.9,device:'cpu',dtype:'f32',preprocessPrompt:false})){const c=clip();c.nativeCompletion.inferenceParameters[key]=value;assert.equal(validPunishmentReferenceConditioning(c),false)}
});
test('literal extraction verifies the complete selected bytes before returning exact finite WAV',()=>{
 const r=punishmentReferenceInputs['jwd-inga-maaslos'];
 assert.throws(()=>literalPunishmentReference(Buffer.from('not the selected WAV'),r),/selected|WAV/u);
});
test('cold read-only Swabian plan declares the actual native guidance without launching a model',t=>{
 const dir=mkdtempSync(resolve(tmpdir(),'punishment-reference-plan-'));t.after(()=>{assert.equal(dirname(dir),resolve(tmpdir()));assert.ok(basename(dir).startsWith('punishment-reference-plan-'));rmSync(dir,{recursive:true,force:true})});
 mkdirSync(resolve(dir,'data'));writeFileSync(resolve(dir,'voice-data-root.txt'),resolve(dir,'data'));
 const result=spawnSync(process.execPath,[resolve('tools/build-neighbor-voices.mjs'),'--plan','--punishment','--character','schwabingen','--voice-exe',resolve(dir,'not-a-real-voice.exe')],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);const plan=JSON.parse(result.stdout);assert.equal(plan.inferenceParameters.guidanceScale,2);assert.equal(plan.inferenceParameters.numStep,32);assert.equal(plan.inferenceParameters.speed,1);
});
