import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const source=path=>readFileSync(resolve(root,path));
const audition=JSON.parse(source('assets/voices/profile-auditions/manifest.json'));
const candidates=JSON.parse(source('assets/voices/candidate-dialogue/manifest.json'));
const cast=JSON.parse(source('For-AI/VOICE-CAST.json'));
const inventory=JSON.parse(source('For-AI/VOICE-DIALOGUE-INVENTORY.json'));
const owners=new Map([...cast.characters.map(person=>[person.voiceId,{profileId:person.secretTunnel.profileId,referenceSha256:person.reference.workingReferenceSha256}]),...cast.roleProfiles.map(person=>[person.voiceId,{profileId:person.secretTunnelProfileId,referenceSha256:person.reference.workingReferenceSha256}])]);
const authored=new Set(inventory.pools.quizApproaches.germany);
for(const archetype of inventory.pools.crowdArchetypes)for(const line of archetype.barks.germany)authored.add(line);

assert.equal(audition.clipCount,11);
assert.equal(audition.clips.filter(clip=>clip.voiceId.startsWith('quiz-')).length,9);
assert.equal(new Set(audition.clips.map(clip=>clip.voiceId)).size,11);
for(const clip of audition.clips){
 assert.ok(authored.has(clip.text),`authored text ${clip.clipId}`);
 const quizSource=clip.sourcePool.match(/^game\.js quizApproaches\.germany\[(\d+)\]$/);
 if(quizSource)assert.equal(clip.text,inventory.pools.quizApproaches.germany[Number(quizSource[1])],`quiz source ${clip.clipId}`);
 else{
  const towelSource=clip.sourcePool.match(/^game\.js crowdArchetypes\.(towel-man|towel-woman)\.germany\[(\d+)\]$/);
  assert.ok(towelSource,`unknown source ${clip.clipId}`);
  assert.equal(clip.text,inventory.pools.crowdArchetypes.find(item=>item.id===towelSource[1]).barks.germany[Number(towelSource[2])],`towel source ${clip.clipId}`);
 }
 assert.equal(clip.profileId,owners.get(clip.voiceId)?.profileId,`profile ${clip.clipId}`);
 assert.equal(clip.referenceSha256,owners.get(clip.voiceId)?.referenceSha256,`reference ${clip.clipId}`);
 assert.equal(createHash('sha256').update(source(clip.path)).digest('hex'),clip.sha256,`file ${clip.clipId}`);
}
const auditioned=new Set([...candidates.clips,...audition.clips].map(clip=>clip.voiceId));
for(const voiceId of owners.keys())assert.ok(auditioned.has(voiceId),`missing audition for ${voiceId}`);
