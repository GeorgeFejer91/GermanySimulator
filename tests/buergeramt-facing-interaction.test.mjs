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
