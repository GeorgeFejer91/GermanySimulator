import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {neighborRecordingsBlock} from '../tools/curate-voice-library.mjs';

function load(){const window={};vm.runInNewContext(readFileSync(new URL('../neighbor-punishment.js',import.meta.url),'utf8'),{window});return window.JwdPunishment;}

test('punishment inventory retains 24 original bilingual monologues owned by the three selected neighbors',()=>{
 const {stories}=load();assert.equal(stories.length,24);assert.equal(new Set(stories.map(s=>s.id)).size,24);
 const cast=JSON.parse(readFileSync(new URL('../For-AI/VOICE-CAST.json',import.meta.url),'utf8'));
 for(const role of ['parent','watcher','swabian'])assert.equal(stories.filter(s=>s.role===role).length,8);
 for(const story of stories){
  assert.equal(story.lines.length,1);const line=story.lines[0],words=line.de.trim().split(/\s+/).length;
  assert.ok(words>=40&&words<=65,`${story.id}: ${words} words`);assert.ok(line.en.length>80);
  assert.equal(line.voiceId,story.voiceId);assert.equal(cast.productionVoices[line.voiceId].fallback,'captions');
  const person=cast.existingAssetProfiles.find(p=>p.voiceId===line.voiceId);
  assert.equal(story.actorId,person.gameCharacterId);
  assert.ok(person.punishmentDialogue.some(s=>s.id===line.id&&s.text===line.de&&s.english===line.en));
 }
});

test('selection alternates neighbors and exhausts each owned bag before repeating a story',()=>{
 const api=load(),pick=api.createSelector(()=>.37);const history=Array.from({length:96},()=>pick.next());
 for(let i=1;i<history.length;i++){assert.notEqual(history[i].role,history[i-1].role);assert.notEqual(history[i].id,history[i-1].id);}
 for(const role of ['parent','watcher','swabian']){
  const owned=history.filter(s=>s.role===role);for(let i=0;i<owned.length;i+=8)assert.equal(new Set(owned.slice(i,i+8).map(s=>s.id)).size,8);
 }
});

test('native punishment plan binds only the eight exact new sources and preserves original story IDs',()=>{
 const root=new URL('..',import.meta.url);
 for(const family of ['heiko','inga','schwabingen']){
  const result=spawnSync(process.execPath,['tools/build-neighbor-voices.mjs','--punishment','--character',family,'--plan'],{cwd:root,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);const plan=JSON.parse(result.stdout);
  assert.equal(plan.lines.length,8);assert.ok(plan.lines.every(line=>line.clipId.startsWith(`punishment-${family}-`)&&line.topic==='punishment'));
  const expected=load().stories.filter(story=>story.voiceId===plan.lines[0].voiceId).flatMap(story=>story.lines);
  for(const line of plan.lines)assert.ok(expected.some(row=>row.id===line.clipId&&row.de===line.text&&row.en===line.english));
 }
 const original=spawnSync(process.execPath,['tools/build-neighbor-voices.mjs','--character','heiko','--plan'],{cwd:root,encoding:'utf8'});
 assert.equal(original.status,0,original.stderr);const plan=JSON.parse(original.stdout);
 assert.equal(plan.lines.length,40);assert.ok(plan.lines.some(line=>line.clipId==='heiko-story-40'));
 assert.ok(plan.lines.every(line=>!line.clipId.startsWith('punishment-')));
});

test('the English professor reference uses saved English conditioning rather than forced German ASR',()=>{
 const source=readFileSync(new URL('../tools/build-neighbor-voices.mjs',import.meta.url),'utf8');
 const start=source.indexOf('function neighborReferenceText('),end=source.indexOf('\n}',start)+2;
 assert.ok(start>=0,'reference text selection must be explicit');
 const choose=vm.runInNewContext('('+source.slice(start,end)+')');
 const identity={voiceId:'jwd-heiko-maaslos',profileId:'professor'},profiles=[{id:'professor',reference_text:'Hello everybody, my name is Heiko Schmidt.'}];
 assert.equal(choose(identity,profiles,'Hallo, alle, mein Name ist Heiko Schmidt.'),profiles[0].reference_text);
 assert.throws(()=>choose(identity,[],'A German guess'),/reference text/);
 assert.equal(choose({voiceId:'jwd-inga-maaslos',profileId:'inga'},[],'Ja, natürlich.'),'Ja, natürlich.');
});

test('new punishment recordings reject missing or different reference-text conditioning receipts',()=>{
 const cast=JSON.parse(readFileSync(new URL('../For-AI/VOICE-CAST.json',import.meta.url),'utf8'));
 const manifest=JSON.parse(readFileSync(new URL('../assets/voices/neighbors/punishment-heiko-manifest.json',import.meta.url),'utf8'));
 assert.ok(manifest.clips.some(clip=>clip.clipId==='punishment-heiko-01'));
 assert.match(neighborRecordingsBlock(cast,[manifest]),/punishment-heiko-01/);
 for(const invalid of [undefined,'0'.repeat(64)]){
  const changed=structuredClone(manifest);changed.clips[0].referenceTextSha256=invalid;
  assert.throws(()=>neighborRecordingsBlock(cast,[changed]),/reference text conditioning/);
 }
});
