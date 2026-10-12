import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {harness,source} from './amt-harness.mjs';

function fixture(){const h=harness('host',{voice:false,cinematics:false});h.enter();h.approachRegistration();turn(h,-.85);return h}
function selectionFixture(){const context=vm.createContext({Math,view:{x:-5.9,z:2.6,yaw:0},stage:'walk-sign',characters:[],story:{patrons:{}},counterXs:[-5.8,-1.6,3.9,6.2],counter:{z:-8.15}});const s=source('buergeramt.js');for(const name of ['facingInteractionScore','nearestCharacter','nearbyPerson','nearestCounter']){const start=s.indexOf('function '+name+'('),end=s.indexOf('\n',start);vm.runInContext(s.slice(start,end),context)}return {context}}

function turn(h,yaw){const delta=yaw-h.level.view.yaw,code=delta>=0?'ArrowRight':'ArrowLeft';h.key(code);h.advanceGame(Math.abs(delta)/1.8);h.key(code,'keyup');h.level.update(0)}
test('E and its hint follow facing for seated patrons; turning away does not start dialogue',()=>{
 const h=fixture();assert.match(h.node('amt-nearby').textContent,/KONRAD/);
 turn(h,Math.PI);assert.doesNotMatch(h.node('amt-nearby').textContent,/ANSPRECHEN/);
 h.key('KeyE');h.key('KeyE','keyup');assert.equal(h.level.stage,'walk-sign');
 turn(h,-.85);h.key('KeyE');assert.equal(h.level.stage,'character');assert.equal(h.node('amt-speaker').textContent,'KONRAD WOHNUNGSZETTEL');assert.equal(h.counts.form,0);
});
test('the forward cone rejects side and rear actors and selects the person closest to gaze',()=>{
 const h=selectionFixture();vm.runInContext('view.x=0;view.z=0;characters.push({id:"front",x:0,z:-1.5},{id:"side",x:.6,z:-.7},{id:"rear",x:0,z:.5})',h.context);
 assert.equal(vm.runInContext('nearestCharacter().id',h.context),'front');
 vm.runInContext('view.yaw=Math.PI',h.context);assert.equal(vm.runInContext('nearestCharacter().id',h.context),'rear');
 vm.runInContext('characters.length=0;characters.push({id:"side",x:1,z:0});view.yaw=0',h.context);assert.equal(vm.runInContext('nearestCharacter()',h.context),null);
});
test('nearby counters require facing and cannot steal a forward visitor interaction',()=>{
 const h=selectionFixture();vm.runInContext('view.x=counterXs[0];view.z=counter.z+1;view.yaw=Math.PI',h.context);
 assert.equal(vm.runInContext('nearestCounter()',h.context),0);
 vm.runInContext('view.yaw=0',h.context);assert.equal(vm.runInContext('nearbyPerson().desk',h.context),1);
 vm.runInContext('view.yaw=Math.PI;characters.push({id:"visitor",x:view.x,z:view.z+.9})',h.context);
 assert.equal(vm.runInContext('nearbyPerson().actor.id',h.context),'visitor');
});


// Seed only position/stage. Real captureKey, selector and dialogue own results.
function seededInteraction({stage='walk-sign',yaw=0,x=-5.9,z=3.65,walker=false}={}){
 const marker='window.BuergeramtLevel=';
 const hostSource=source('buergeramt.js').replace(marker,`window.seedFacing=()=>{for(const actor of characters){actor.x=100;actor.z=100}Object.assign(view,{x:${x},z:${z},yaw:${yaw}});setStage(${JSON.stringify(stage)});${walker?'const actor=characters.find(n=>n.id==="formularsammler");actor.x=view.x;actor.z=view.z-2.25;actor.returning={phase:.5,direction:1};update(0);':''}};`+marker);
 const h=harness('host',{voice:false,cinematics:false,hostSource});h.window.seedFacing();return h;
}

test('E reaches a seated person from 2.25 metres, including the active-counter walking stage',()=>{
 for(const stage of ['walk-sign','waiting','walk-counter']){
  const h=seededInteraction({stage});assert.match(h.node('amt-nearby').textContent,/KONRAD/);
  h.key('KeyE');h.key('KeyE','keyup');assert.equal(h.level.stage,'character');assert.equal(h.node('amt-speaker').textContent,'KONRAD WOHNUNGSZETTEL');
 }
});

test('the wider facing tolerance accepts a nearby person at 55 degrees, but excludes the rear',()=>{
 const h=seededInteraction({yaw:55*Math.PI/180});assert.match(h.node('amt-nearby').textContent,/KONRAD/);h.key('KeyE');assert.equal(h.level.stage,'character');
 const away=seededInteraction({yaw:Math.PI});away.key('KeyE');assert.notEqual(away.level.stage,'character');
});

test('returning walkers can immediately respond to another deliberate E press',()=>{
 const h=seededInteraction({x:0,z:0,walker:true});assert.match(h.node('amt-nearby').textContent,/FORMULARSAMMLER/);h.key('KeyE');assert.equal(h.level.stage,'character');assert.equal(h.level.characterMood.id,'formularsammler');
});

test('nearby portrait cannot steal E from a person in front, and touch uses the same selection',()=>{
 for(const touch of [false,true]){
  const h=seededInteraction({x:3.4,z:4.8,walker:true});assert.match(h.node('amt-nearby').textContent,/FORMULARSAMMLER/);
  if(touch)h.node('amt-touch-e').click();else h.key('KeyE');
  assert.equal(h.level.stage,'character');assert.equal(h.level.characterMood.id,'formularsammler');
 }
});

test('facing the portrait selects its monologue and repeated E cannot stack it',()=>{
 const h=seededInteraction({x:3.4,z:3,yaw:Math.PI});assert.match(h.node('amt-nearby').textContent,/BUNDESPRÄSIDENT/);h.key('KeyE');assert.equal(h.level.stage,'portrait');h.key('KeyE');assert.equal(h.level.stage,'portrait');
});

test('the counter responds from a normal speaking distance without widening ticket eligibility',()=>{
 const marker='window.BuergeramtLevel=';
 const h=harness('host',{hostSource:source('buergeramt.js').replace(marker,'window.seedDesk=()=>{for(const actor of characters){actor.x=100;actor.z=100}view.x=counterXs[2];view.z=counter.z+2.4;view.yaw=0;setStage("walk-sign")};'+marker)});
 h.window.seedDesk();assert.match(h.node('amt-nearby').textContent,/SCHALTER 3/);h.key('KeyE');assert.equal(h.level.stage,'early');assert.equal(h.level.registrationTicket,'');assert.equal(h.counts.form,0);
});


test('the Aktenkurier also responds to E, while an active omen keeps its scene ownership',()=>{
 const marker='window.BuergeramtLevel=';
 const h=harness('host',{hostSource:source('buergeramt.js').replace(marker,'window.seedCourier=(blocked=false)=>{for(const actor of characters){actor.x=100;actor.z=100}view.x=0;view.z=0;view.yaw=0;const actor=characters.find(n=>n.id==="aktenkurier");actor.x=0;actor.z=-2;setStage("walk-sign");if(blocked)omen.phase="approach"};'+marker)});
 h.window.seedCourier();assert.match(h.node('amt-nearby').textContent,/AKTENKURIER/);h.key('KeyE');assert.equal(h.level.characterMood.id,'aktenkurier');assert.equal(h.level.stage,'character');
 h.level.replay(h.config);h.window.seedCourier(true);h.key('KeyE');assert.equal(h.level.stage,'walk-sign');assert.equal(h.level.omen.phase,'approach');
});
