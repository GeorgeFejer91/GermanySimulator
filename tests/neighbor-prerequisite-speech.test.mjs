import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const cast=JSON.parse(readFileSync(new URL('../For-AI/VOICE-CAST.json',import.meta.url),'utf8'));
const copy=vm.runInNewContext(source.slice(source.indexOf('const jwdCopy=')).split('\n};')[0].replace('const jwdCopy=','(')+'\n})');
const start=source.indexOf('function talkJwdNeighbor('),end=source.indexOf('\nfunction ',start+1);
const handler=source.slice(start,end),voiceHandler=source.split('\n').find(line=>line.startsWith('function jwdVoice('));
const identities=[['parent','jwd-heiko-maaslos','parentPremature',40],['watcher','jwd-inga-maaslos','watcherPremature',34],['swabian','jwd-frau-schwabingen','swabianPremature',33]];

for(const [role,voiceId,key,count] of identities)test(role+' owns early speech without bypassing move-in prerequisites',()=>{
 const person=cast.existingAssetProfiles.find(row=>row.voiceId===voiceId);
 const entry=person.dialogue.find(row=>row.locator===`game.js jwdCopy.${key}.de[0]`);
 assert.equal(person.dialogue.length,count);assert.ok(entry);
 assert.equal(entry.text,copy[key].de[0]);assert.equal(entry.english,copy[key].en[0]);
 for(const [allocated,visited] of [[false,false],[true,false],[false,true]]){
  const actor={id:person.gameCharacterId,name:person.fullName,jwdRole:role},calls=[],jwd={allocated,visited,met:new Set(),tour:null},state={mission:0,forms:0};
  const context=vm.createContext({jwd,state,jwdCopy:copy,window:{},openDialogue:(...args)=>calls.push(args),toast(){assert.fail('early speech must remain readable')},startJwdTour(){assert.fail('prerequisites must still block tours')}});
  vm.runInContext(voiceHandler+handler,context);context.talkJwdNeighbor(actor);
  assert.equal(calls.length,1);assert.equal(calls[0][0],actor.name);assert.deepEqual([...calls[0][1]],[entry.text]);assert.equal(calls[0][3],null);
  assert.equal(calls[0][4],voiceId);assert.deepEqual([...calls[0][5]],[entry.english]);assert.equal(state.characterSpeaker,actor);
  assert.equal(jwd.tour,null);assert.equal(jwd.met.size,0);assert.equal(state.mission,0);assert.equal(state.forms,0);
 }
 const actor={id:person.gameCharacterId,name:person.fullName,jwdRole:role},calls=[],jwd={allocated:true,visited:true,met:new Set(),tour:null};
 const context=vm.createContext({jwd,state:{},window:{JwdStory:{tours:{[role]:[{}]}}},startJwdTour:(...args)=>calls.push(args),openDialogue(){assert.fail('fulfilled prerequisites must use the existing tour')}});
 vm.runInContext(voiceHandler+handler,context);context.talkJwdNeighbor(actor,true);assert.deepEqual(calls,[[actor,true]]);
});
