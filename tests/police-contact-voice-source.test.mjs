import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {policeContactSources,policeContactRequest} from '../tools/police-contact-voice-source.mjs';
const cast=JSON.parse(readFileSync(new URL('../For-AI/VOICE-CAST.json',import.meta.url),'utf8'));

test('warning and fine speech retain exact bilingual runtime ownership and selected Heinrich profile',()=>{
 const rows=policeContactSources(cast),owner=cast.roleProfiles.find(row=>row.gameRole==='police');
 assert.deepEqual(rows.map(row=>row.clipId),['police-contact-warning','police-contact-fine']);
 assert.deepEqual(owner.dialogueSources,['game.js policeBarks[region]']);
 for(const row of rows){assert.equal(row.actorId,'police');assert.equal(row.voiceId,owner.voiceId);assert.equal(row.profileId,owner.secretTunnelProfileId);assert.ok(row.text.length>100&&row.english.length>100);}
 const plan=policeContactRequest();assert.equal(plan.status,'SOURCE_ONLY_NOT_A_GENERATION_GRANT');assert.equal(plan.publicAssetFamily,'assets/voices/police-contact');assert.equal(plan.jobs.length,2);
});

test('source-only encounter request rejects changed words, translations and speaker ownership',()=>{
 for(const mutate of [c=>c.roleProfiles.find(p=>p.gameRole==='police').encounterDialogue[0].text+=' nein',c=>c.roleProfiles.find(p=>p.gameRole==='police').encounterDialogue[1].english+=' no',c=>c.roleProfiles.find(p=>p.gameRole==='police').voiceId='jwd-heiko-maaslos']){
  const changed=structuredClone(cast);mutate(changed);assert.throws(()=>policeContactSources(changed));
 }
});
