import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {cityDialogueTable} from '../tools/curate-voice-library.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const cast=read('../For-AI/VOICE-CAST.json');
const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const catalogScope={window:{}};vm.runInNewContext(readFileSync(new URL('../For-AI/AUDIO-TEXT-LIBRARY.js',import.meta.url),'utf8'),catalogScope);
const catalog=catalogScope.window.GermanySimulatorAudioText;
const plain=value=>JSON.parse(JSON.stringify(value));
const city=cast.characters.filter(person=>person.gameCharacterId.startsWith('city-'));
function selector(table=catalog.cityDialogue){
 const scope={speechCatalog:{cityDialogue:table},state:{region:'germany',lang:'de'}};
 const fn=game.match(/^function cityNpcDialogue\(n\)\{[^\n]+\}/m)?.[0];assert.ok(fn,'use the actual runtime selector');
 vm.runInNewContext(fn+';this.select=cityNpcDialogue',scope);return scope;
}

test('public city dialogue and inventory preserve all76 owned source/English slots',()=>{
 assert.equal(city.length,19);assert.deepEqual(plain(catalog.cityDialogue),cityDialogueTable(cast));
 const inventory=read('../For-AI/VOICE-DIALOGUE-INVENTORY.json');let count=0;
 for(const person of city)for(const region of ['germany','berlin'])for(const slot of [0,1]){
  const authored=person.dialogue.find(row=>row.region===region&&row.slot===slot);
  const exported=catalog.cityDialogue[person.gameCharacterId][region][slot];
  assert.equal(exported.text,authored.text);assert.equal(exported.english,authored.english);
  assert.equal(inventory.pools.cityDialogue[person.voiceId][region][slot],authored.text);count++;
 }
 assert.equal(count,76);
});

test('city selector preserves regional German source independently of UI locale',()=>{
 const h=selector();
 for(const person of city)for(const region of ['germany','berlin'])for(const lang of ['de','en']){
  Object.assign(h.state,{region,lang});
  assert.deepEqual(plain(h.select({id:person.gameCharacterId,voiceId:person.voiceId})),person.dialogue.filter(row=>row.region===region).sort((a,b)=>a.slot-b.slot).map(row=>({id:person.voiceId+'-'+String((region==='berlin'?2:0)+row.slot+1).padStart(2,'0'),text:row.text,english:row.english})));
 }
});

test('runtime missing or misbound city data fails closed instead of borrowing a generic voice',()=>{
 const person=city[0],actor={id:person.gameCharacterId,voiceId:person.voiceId};
 assert.equal(selector().select({...actor,voiceId:city[1].voiceId}),null);
 assert.equal(selector().select({id:'crowd-1',voiceId:person.voiceId}),null);
 for(const mutate of [t=>delete t[actor.id],t=>t[actor.id].germany.pop(),t=>t[actor.id].germany[0].english='',t=>t[actor.id].germany[0].text=' ']){
  const table=plain(catalog.cityDialogue);mutate(table);assert.equal(selector(table).select(actor),null);
 }
});

test('curation rejects selected-voice swaps and incomplete or stale owned slots',()=>{
 for(const mutate of [
  c=>{const a=c.characters.filter(p=>p.gameCharacterId.startsWith('city-'));[a[0].voiceId,a[1].voiceId]=[a[1].voiceId,a[0].voiceId]},
  c=>delete c.productionVoices[city[0].voiceId],
  c=>c.characters.find(p=>p.voiceId===city[0].voiceId).dialogue.pop(),
  c=>{const p=c.characters.find(p=>p.voiceId===city[0].voiceId);p.dialogue[1].slot=p.dialogue[0].slot},
  c=>c.characters.find(p=>p.voiceId===city[0].voiceId).dialogue[0].english='',
  c=>c.characters.find(p=>p.voiceId===city[0].voiceId).dialogue[0].locator='another actor'
 ]){const c=structuredClone(cast);mutate(c);assert.throws(()=>cityDialogueTable(c));}
});

test('caption ownership rejects conflicting same-voice source while allowing separate people',()=>{
 const c=structuredClone(cast),a=c.characters.find(p=>p.voiceId===city[0].voiceId),b=c.characters.find(p=>p.voiceId===city[1].voiceId);
 b.dialogue[0].text=a.dialogue[0].text;b.dialogue[0].english='A distinct person may mean something else.';assert.doesNotThrow(()=>cityDialogueTable(c));
 a.dialogue[2].text=a.dialogue[0].text;a.dialogue[2].english='A conflicting caption for the same voice and source.';assert.throws(()=>cityDialogueTable(c),/Conflicting city English/);
});
