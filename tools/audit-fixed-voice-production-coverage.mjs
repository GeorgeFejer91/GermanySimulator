import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import vm from 'node:vm';
import {matchesProduction,knickGenerationComplete} from './curate-voice-library.mjs';

// Strict readiness gate. A browser/caption fallback is not a recorded-coverage pass.
// This file reads only public checkout files and intentionally stays red until admission.
const root=resolve(import.meta.dirname,'..'),hash=b=>createHash('sha256').update(b).digest('hex');
const read=p=>readFileSync(resolve(root,p)),json=p=>JSON.parse(read(p));
const asset=p=>{const file=resolve(root,p.replace(/^\.\//,''));assert.ok(file.startsWith(resolve(root,'assets/voices')+sep),'public voice asset path');return file;};
const cast=json('For-AI/VOICE-CAST.json'),context=vm.createContext({window:{},location:{search:''},URLSearchParams});
vm.runInContext(read('For-AI/AUDIO-TEXT-LIBRARY.js').toString(),context);
const catalog=context.window.GermanySimulatorAudioText,approved=json('assets/voices/approved-dialogue/manifest.json');
assert.equal(catalog.candidatePreviewEnabled,false);assert.equal(catalog.feverPreviewEnabled,false);
const rows=cast.characters.flatMap(person=>person.dialogue.map((line,index)=>({person,line,index})));
assert.equal(rows.length,93,'The full current fixed cast is required, not just rows with recordings');
assert.equal(new Set(rows.map(({person,line})=>person.voiceId+'\0'+line.text)).size,93,'No duplicate row may replace a missing owned pair');
const cityRows=rows.filter(({person})=>person.gameCharacterId?.startsWith('city-'));
assert.equal(cityRows.length,76);assert.equal(new Set(cityRows.map(({person})=>person.gameCharacterId)).size,19);
const report={expected:93,missing:[],invalid:[],verified:[],qualification:'Default resolver and public metadata/file integrity only; no media decoding, native execution or listening'};

function publicReceipt(entry,path){
 if(entry?.provenanceManifest){
  const file=entry.provenanceManifest;asset(file);assert.ok(file.endsWith('.json'));
  const matches=json(file).clips.filter(c=>(c.file||c.path)?.replace(/^\.\//,'')===path.replace(/^\.\//,'')&&(c.clipId||c.id)===entry.id);
  assert.equal(matches.length,1,'exact public admission link');
  return{receipt:matches[0],mode:file};
 }
 const bulk=approved.clips.filter(c=>c.path?.replace(/^\.\//,'')===path.replace(/^\.\//,''));
 if(bulk.length){assert.equal(bulk.length,1);assert.match(bulk[0].humanReviewQueueSha256,/^[a-f0-9]{64}$/);return{receipt:bulk[0],mode:'assets/voices/approved-dialogue/manifest.json',bulk:true};}
 // The already authorized direct scene exception has a public prose receipt, not
 // a fabricated bulk seven-field or native generation receipt.
 const exception=cast.productionExceptions.find(e=>e.clipId===entry?.id&&e.voiceId===entry.voiceId&&e.profileId===entry.profileId);
 assert.ok(exception,'public admission/approval provenance absent');
 const licenses=read('assets/voices/LICENSES.md').toString();
 for(const value of [path.replace(/^\.\/assets\/voices\//,''),entry.source,entry.sha256,exception.profileId,exception.originalSha256,exception.referenceSha256,exception.modelRevision])assert.ok(licenses.includes(value),'existing scene exception public provenance '+value);
 assert.ok(exception.reason.trim());assert.equal(entry.approval?.status,'user-approved');
 return{receipt:{...entry,clipId:entry.id,...exception,text:entry.source,sha256:entry.sha256},mode:'explicit existing scene exception; assets/voices/LICENSES.md'};
}

for(const {person,line,index} of rows){
 const identity={actorId:person.gameCharacterId,voiceId:person.voiceId,index,region:line.region??null,slot:line.slot??null,text:line.text,english:line.english??catalog.lines?.[line.text]??Object.values(catalog.recordings).find(c=>c.source===line.text)?.english??null,sourceLocator:line.locator??null,
  castLocator:`For-AI/VOICE-CAST.json characters[voiceId=${person.voiceId}].dialogue[${index}]`};
 const path=catalog.candidateClip(person.voiceId,line.text);
 if(!path){report.missing.push({...identity,reason:'Actual default candidateClip returned null; preview/caption/browser fallback is not recording coverage'});continue;}
 try{
  const entry=catalog.recordings[path];
  const {receipt,mode,bulk}=publicReceipt(entry,path);
  assert.equal(receipt.voiceId,person.voiceId);assert.equal(receipt.text??receipt.source,line.text);
  assert.ok(!receipt.retiredReason,'retired take');assert.ok(matchesProduction(cast,receipt),'selected profile/reference/renderer/revision/processing');
  assert.equal(hash(readFileSync(asset(path))),receipt.sha256,'actual encoded MP3 hash');
  if(entry){assert.equal(entry.source,line.text);assert.equal(entry.voiceId,person.voiceId);assert.equal(entry.sha256,receipt.sha256);}
  if(!bulk)assert.equal(receipt.approval?.status,'user-approved','genuine public use approval');
  if(person.gameCharacterId?.startsWith('city-')){
   assert.ok(line.english?.trim());assert.equal(receipt.actorId,person.gameCharacterId);
   assert.equal(receipt.english,line.english,'owned city English');if(entry)assert.equal(entry.english,line.english);
   const owned=catalog.cityDialogue?.[person.gameCharacterId],exported=owned?.[line.region]?.[line.slot];
   assert.equal(owned?.voiceId,person.voiceId);assert.equal(exported?.text,line.text);assert.equal(exported?.english,line.english);
   for(const cues of [receipt.cues,entry?.cues].filter(Boolean))assert.equal(cues.map(c=>c[2].trim()).join(' ').replace(/\s+/g,' '),line.english.replace(/\s+/g,' '),'recorded English cue agreement');
   assert.ok(knickGenerationComplete(receipt),'existing complete-generation receipt gate for new takes');
  }
  report.verified.push({...identity,path,provenance:mode,sha256:receipt.sha256});
 }catch(error){report.invalid.push({...identity,path,reason:error.message});}
}
console.log('CURRENT_FIXED_PRODUCTION_COVERAGE '+JSON.stringify(report));
assert.equal(report.missing.length,0,`Missing current default recordings: ${report.missing.length}/${report.expected}`);
assert.equal(report.invalid.length,0,`Invalid current default receipts: ${report.invalid.length}/${report.expected}`);
assert.equal(report.verified.length,93,'Every current fixed source needs genuine selected default production');
