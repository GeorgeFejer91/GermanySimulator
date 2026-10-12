import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

test('every office answer and current Knick line has exact selected-profile audio',()=>{
 const context=vm.createContext({window:{},location:{search:''},URLSearchParams});
 for(const file of ['buergeramt-story.js','For-AI/AUDIO-TEXT-LIBRARY.js'])vm.runInContext(readFileSync(file,'utf8'),context);
 const story=context.window.BuergeramtStory,catalog=context.window.GermanySimulatorAudioText,runtime=readFileSync('buergeramt.js','utf8');
 const nodes=Object.values(story.registration.nodes);
 const answers=[...nodes.flatMap(node=>node.choices.map(choice=>choice.label)),...runtime.matchAll(/\{label:("(?:\\.|[^"\\])*")\s*,run:/g)].map(value=>typeof value==='string'?value:JSON.parse(value[1]));
 const knick=[...nodes.flatMap(node=>[node.line,...node.choices.map(choice=>choice.reply)]),...story.phoneWarnings,...story.outburst.lines,story.clerkRefusal,...[...runtime.matchAll(/content\(story\.(?:clerkIdentity|registration)\.speaker,("(?:\\.|[^"\\])*")/g)].map(match=>JSON.parse(match[1]))];
 assert.equal(answers.length,107);assert.equal(knick.length,168);
 for(const [voiceId,lines] of [[story.playerIdentity.voiceId,answers],[story.clerkIdentity.voiceId,knick]])for(const text of lines){
  const path=catalog.recordedClip(voiceId,text);assert(path,`${voiceId}: ${text}`);
  const clip=catalog.recordings[path];assert.equal(clip.source,text);assert.equal(clip.voiceId,voiceId);assert.equal(clip.profileId,catalog.productionVoices[voiceId].profileId);
  assert.equal(createHash('sha256').update(readFileSync(path.replace(/^\.\//,''))).digest('hex'),clip.sha256);
 }
});
