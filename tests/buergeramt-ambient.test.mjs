import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {harness} from './amt-harness.mjs';
const window={};
vm.runInNewContext(readFileSync('buergeramt-story.js','utf8'),{window});
vm.runInNewContext(readFileSync('For-AI/AUDIO-TEXT-LIBRARY.js','utf8'),{window});
const story=window.BuergeramtStory,catalog=window.GermanySimulatorAudioText;
const people={...story.characters,...Object.fromEntries(['renter','parent','pensioner'].map((actor,i)=>[actor,Object.values(story.patrons)[i]])),...Object.fromEntries(Object.entries(story.clerks).map(([desk,person])=>['clerk-'+desk,person]))};

test('every ambient remark has exact recorded words from its actual selected character',()=>{
 assert.equal(story.ambient.length,21);assert.equal(new Set(story.ambient.map(row=>row.id)).size,21);
 for(const row of story.ambient){const person=people[row.actor],path=catalog.recordedClip(person.voiceId,row.text),clip=catalog.recordings[path];assert(path,row.id);assert.equal(clip.profileId,catalog.productionVoices[person.voiceId].profileId);assert.equal(clip.source,row.text);assert.equal(clip.english,row.english);if(row.actor.startsWith('clerk-')){assert.equal(person,story.clerkIdentity);assert(path.startsWith('./assets/voices/knick/'),'restore the exact original angry counter take')}else assert.equal(clip.actorId,row.actor);}
});

test('ambient selection varies voices and text while a failed or absent catalogue stays silent',()=>{
 for(const mode of ['absent','unrecorded']){
  let seed=17;const h=harness('host',{voice:true,random:()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32}}),seen=[];
  h.register();
  if(mode==='unrecorded')h.window.GermanySimulatorAudioText={recordedClip:(voiceId,text)=>{if(text!==story.queueCall.line)seen.push({voiceId,text});return null}};
  else delete h.window.GermanySimulatorAudioText;
  const captions=[];let previous='';
  for(let i=0;i<8600;i++){h.elapse(.05);const caption=h.node('amt-ambient').textContent;if(caption&&caption!==previous&&caption!=='FRAU KNICK: '+story.queueCall.line)captions.push(caption);previous=caption;}
  assert.equal(h.synth.spoken.length,0);assert(new Set(captions).size>=17);
  for(const caption of captions){const row=story.ambient.find(row=>caption===people[row.actor].speaker+': '+row.text);assert(row,caption);}
  for(let i=1;i<seen.length;i++){assert.notEqual(seen[i].voiceId,seen[i-1].voiceId);assert.notEqual(seen[i].text,seen[i-1].text);}
 }
});

test('background lines keep caption and mouth ownership, honor voices off, and cancel on counter entry',()=>{
 const h=harness('host',{voice:false});h.register();h.advanceGame(8.6);
 const caption=h.node('amt-ambient').textContent,row=story.ambient.find(row=>caption===people[row.actor].speaker+': '+row.text);
 assert(row);assert.equal(h.level.lipSpeech.actor,row.actor);assert.equal(h.level.lipSpeech.active,false);assert.equal(h.synth.spoken.length,0);
 h.approachCounter();h.level.interact();h.tick(20);assert(!h.node('amt-ambient').textContent.includes(row.text));
});
