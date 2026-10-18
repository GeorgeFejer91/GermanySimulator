import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(process.env.NEIGHBOR_DIALOGUE_SOURCE||new URL('../game.js',import.meta.url),'utf8');
function fn(name){
 const start=source.indexOf(`function ${name}(`),next=source.indexOf('\nfunction ',start+1);
 assert.ok(start>=0,name);return source.slice(start,next<0?source.length:next);
}
function fixture(){
 const nodes=new Map(),calls=[];
 const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,textContent:'',classList:{toggle(){},remove(){}},dataset:{}});return nodes.get(id)};
 const actors=[['swabian','FRAU SCHWABINGEN'],['parent','HEIKO MAASLOS'],['watcher','INGA MAASLOS'],['child','HARTMUT MAASLOS']].map(([jwdRole,name])=>({id:jwdRole,name,jwdRole}));
 const h={state:{dialogue:false,modal:false,voiceOn:true,region:'berlin',lang:'de'},jwd:{dialogueTickets:new Map(),dialogueTicketSequence:0,tour:null},npcs:actors,document:{getElementById:node,querySelector:()=>node('copy')},window:{},speechCatalog:{voices:{}},STIMULUS_PRIORITY:{CRITICAL:5},stimulusQueue:[],stimulusGeneration:0,activeStimulus:null,stimulusTimer:0,textOnlyBark:null,
  clearTimeout(){},stopRecordedSpeech(){},setAudioText(){},clearSubtitle(){},hideWorldBark(){},cancelHumorScold(){},requestCharacterReaction(){},cancelJwdTour(){assert.fail('no tour replacement in fixture')},
  speak(text,options){const call={text,...options};calls.push(call);h.activeStimulus=call},speakMerkelLine(){assert.fail('wrong actor route')},speakMerzLine(){assert.fail('wrong actor route')}};
 vm.createContext(h);vm.runInContext(['jwdVoice','neighborDialogueTicket','openDialogue','setDialogueVoiceBusy','speakDialogueLine','renderDialogue','nextDialogue','stopSpeech'].map(fn).join('\n'),h);
 const open=(actor,lines=['First line.','Next line.'])=>{h.state.characterSpeaker=actor;h.openDialogue(actor.name,lines,'!',null,h.jwdVoice(actor),lines.map(line=>'EN '+line),false,true)};
 return {h,actors,calls,open,nodes};
}

test('each of the four neighbors queues and starts a line only once despite redraws and repeated input',()=>{
 for(let i=0;i<4;i++){
  const {h,actors,calls,open}=fixture();open(actors[i]);const first=calls[0];
  h.renderDialogue();h.renderDialogue();h.speakDialogueLine('First line.');assert.equal(calls.length,1);
  assert.equal(h.state.dialogueData.neighborTicket.status,'queued');assert.equal(first.isEligible(),true);
  first.start();first.start();assert.equal(h.state.dialogueData.neighborTicket.status,'started');assert.equal(h.document.getElementById('dialogue').hidden,false);
  h.renderDialogue();assert.equal(h.document.getElementById('dialogue').hidden,false,'redraw preserves the visible current caption');assert.equal(calls.length,1);first.done();first.done();
  assert.equal(h.state.dialogueData.neighborTicket.status,'finished');assert.equal(h.state.dialogueData.lineComplete,true);
  h.renderDialogue();assert.equal(h.state.dialogueData.lineComplete,true);assert.equal(calls.length,1);
  h.nextDialogue();assert.equal(calls.length,2);assert.equal(first.isEligible(),false);
  first.done();assert.equal(h.state.dialogueVoiceBusy,true,'late receipt cannot finish next line');
 }
});

test('heard text cannot be spoken again by the same actor in another interaction',()=>{
 const {h,actors,calls,open}=fixture();open(actors[0],['Same words.']);calls[0].start();calls[0].done();h.nextDialogue();
 open(actors[0],['Same words.']);assert.equal(calls.length,1);assert.equal(h.state.dialogueData.lineComplete,true);
 assert.equal(h.state.dialogueData.lineAge,Infinity);assert.equal(h.state.dialogueVoiceBusy,false);
 h.nextDialogue();open(actors[1],['Same words.']);assert.equal(calls.length,2,'ticket belongs to a specific actor and voice');
});

test('cancelled audio cannot restart; a later interaction retains readable text without another recording',()=>{
 const {h,actors,calls,open,nodes}=fixture();open(actors[2],['Cancelled words.']);const first=calls[0];first.start();h.stopSpeech();
 assert.equal(h.state.dialogueData.neighborTicket.status,'cancelled');assert.equal(first.isEligible(),false);
 first.done();assert.equal(h.state.dialogueData.lineComplete,false);
 open(actors[2],['Cancelled words.']);assert.equal(calls.length,1);assert.equal(h.state.dialogueData.captionFallback,true);
 assert.equal(nodes.get('dialogue').hidden,false);assert.equal(h.state.dialogueData.lineComplete,true);
});

test('ordinary city dialogue keeps its intentional repeat action',()=>{
 const {h,calls}=fixture();h.openDialogue('OFFICE',['City words.'],'!',null,'narrator');h.speakDialogueLine('City words.');assert.equal(calls.length,2);
 assert.equal(h.jwd.dialogueTickets.size,0);
});

test('the active renderer and controller contain no robber role or appearance',()=>{
 const renderer=readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/jwd-burglar|jwd-ede-einbruch|["']burglar["']/);
 assert.doesNotMatch(renderer,/["']burglar["']/);
});
