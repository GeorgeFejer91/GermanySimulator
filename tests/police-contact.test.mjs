import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
function fn(name){
 const start=source.indexOf(`function ${name}(`),end=source.indexOf('\nfunction ',start+1);
 assert.ok(start>=0,`${name} production handler exists`);
 return source.slice(start,end<0?source.length:end).split('document.getElementById("dialogue-next").onclick=')[0];
}
function fixture(wanted=1){
 const h={state:{wanted,lang:'de',started:true,policeContactCooldown:0,policeAccountCents:10000},player:{x:100,y:200,r:16,energy:90,vx:1,vy:1},jwd:{allocated:false,punishment:null,punishmentSequence:0},police:[],policePath:{x1:999,y1:999},OFFENSE_TIMING:{policeContactCooldown:5.8},buildings:[{id:'jwd-home',doorX:1100,doorY:4400}],window:{},npcs:[],
  cancelJwdTour(){},clearInput(){},clearPoliceActors(){h.police.length=0},syncPoliceResponse(){},toast(s){h.notice=s},uiTone(){},updateHud(){},notifyStreetDiscontinuity(){},responderBlocked:()=>false,dist:(a,b,c,d)=>Math.hypot(a-c,b-d),setNeighborLevelActive(){},beginJwdVisit(){},jwdLane:{x:1000,y:4400,w:500,h:200}};
 h.openDialogue=(speaker,lines,portrait,done,voiceId,subtitles,roaming,automatic,actor,options={})=>{h.state.dialogue=true;h.state.modal=!roaming;h.state.dialogueData={speaker,lines,done,voiceId,subtitles,automatic,...options};h.dialogue=h.state.dialogueData};
 vm.createContext(h);
 for(const name of ['clearPoliceEncounter','policeContact','arrestPlayer'])vm.runInContext(fn(name),h);
 return h;
}
test('one star produces a warning in place without energy loss or an arrest',()=>{
 const h=fixture(1);h.policeContact();assert.equal(h.player.x,100);assert.equal(h.player.y,200);assert.equal(h.player.energy,90);assert.equal(h.state.wanted,0);assert.match(h.dialogue.lines.join(' '),/Glückstag|lucky day/);assert.equal(h.jwd.punishment,null);
});
test('two stars require payment, charge once, retain location and show the balance',()=>{
 const h=fixture(2);h.policeContact();assert.equal(h.player.x,100);assert.equal(h.state.policeAccountCents,10000);assert.equal(h.dialogue.paymentCents,3500);h.dialogue.done();h.dialogue.done();assert.equal(h.state.policeAccountCents,6500);assert.equal(h.state.finesPaidCents,3500);assert.equal(h.jwd.punishment,null);
});
test('an overdrawn account can pay another fine without a mission softlock',()=>{
 const h=fixture(2);h.state.policeAccountCents=0;h.policeContact();h.dialogue.done();assert.equal(h.state.policeAccountCents,-3500);
});
test('three and five stars return home and queue one punishment without granting keys or credit',()=>{
 for(const tier of [3,5]){const h=fixture(tier);h.policeContact();assert.equal(h.player.x,1100);assert.equal(h.player.y,4430);assert.equal(h.jwd.allocated,false);assert.equal(h.state.wanted,0);assert.ok(h.jwd.punishment);assert.equal(h.jwd.punishment.phase,'waiting');assert.equal(h.jwd.punishmentSequence,1)}
});
test('zero wanted or an active contact cooldown cannot create another encounter',()=>{
 for(const tier of [0,1,2,5]){const h=fixture(tier);if(tier)h.state.policeContactCooldown=2;h.policeContact();assert.equal(h.dialogue,undefined);assert.equal(h.player.x,100);assert.equal(h.jwd.punishment,null)}
});
test('an occupied porch is searched for body clearance before waking',()=>{
 const h=fixture(3);h.responderBlocked=(x,y)=>x===1100;h.policeContact();assert.notEqual(h.player.x,1100);assert.equal(h.player.y,4430);
});

test('punishment waits for an exit attempt, approaches physically, and releases only its own completed dialogue',()=>{
 const h=fixture(3),actor={id:'jwd-parent',name:'HEIKO MAASLOS',jwdRole:'parent',x:1000,y:4500};h.npcs.push(actor);
 h.window.JwdPunishment={createSelector:()=>({next:()=>({id:'test-story',actorId:actor.id,gesture:'point',lines:[{de:'Nur noch ganz kurz.',en:'Just briefly.',voiceId:'jwd-heiko-maaslos'}]})})};
 h.window.JwdPunishment.stories=[{}];h.jwdPunishmentRoute=()=>[{x:1100,y:4490}];h.jwdGardens={crossY:4500,gate:{x:1100,y:4490}};h.jwdCrossRoute=()=>[];h.walkJwdRoute=n=>{n.x+=20};h.returnJwdNeighbor=()=>{h.returned=true};h.updateJwdNeighbors=()=>{};
 vm.runInContext(fn('updateJwdPunishment'),h);h.policeContact();
 h.updateJwdPunishment(.1,false);assert.equal(h.jwd.punishment.phase,'waiting');assert.equal(actor.x,1000);
 h.updateJwdPunishment(.1,true);assert.equal(h.jwd.punishment.phase,'approach');assert.equal(actor.x,1020);
 for(let i=0;i<20&&!h.dialogue;i++)h.updateJwdPunishment(.1,false);
 assert.ok(h.dialogue);assert.equal(h.dialogue.locked,true);assert.equal(h.dialogue.automatic,true);assert.ok(actor.x>1000);
 const old=h.dialogue;h.jwd.punishment={id:999};old.done();assert.equal(h.jwd.punishment.id,999,'stale completion cannot clear a later arrest');
});

test('locked lecture cannot be advanced by interaction or an early clock call',()=>{
 const h={state:{dialogue:true,dialogueData:{locked:true,automatic:true,lineComplete:false,lineAge:0,lines:['a full lecture'],i:0}},window:{},document:{getElementById:()=>({})}};
 vm.createContext(h);vm.runInContext(fn('dialogueReadingSeconds')+fn('nextDialogue'),h);
 h.nextDialogue();h.nextDialogue(true);assert.equal(h.state.dialogueData.i,0);
});
test('a movement press is an exit attempt even when released before the next frame',()=>{
 const h={jwd:{punishment:{phase:'waiting'}},state:{started:true,modal:false,dialogue:false,gameOver:false},window:{},updateJwdPunishment:(dt,attempt)=>{h.attempt=attempt}};
 vm.createContext(h);vm.runInContext(fn('punishmentExitInput'),h);
 assert.equal(h.punishmentExitInput('ArrowDown'),true);assert.equal(h.attempt,true);
 h.attempt=false;assert.equal(h.punishmentExitInput('KeyQ'),false);assert.equal(h.attempt,false);
});
