import test from 'node:test';
import assert from 'node:assert/strict';
import {harness,source} from './amt-harness.mjs';

// Seed only eligibility and residence. Recovery, timing and rendering state
// remain production code; no interaction action is dispatched by this fixture.
const marker='window.BuergeramtLevel=';
const seam=`window.amtRecoverySeed=(opts={})=>{
 floorClock=opts.age??780;visualClock=100;
 assignedCounter=opts.assigned??3;counter.x=counterXs[2];
 registeredName=opts.name??'Erika Mustermann';activated=opts.receipt??true;
 number='B-223';deadline=opts.deadline??200;
 counterCalls[2]=opts.called??number;
 view.x=opts.x??counter.x;view.z=opts.z??counter.z+1;
};window.amtRecoveryMove=(x,z)=>{view.x=x;view.z=z;};`;
assert.ok(source('buergeramt.js').includes(marker),'host seam anchor exists');
function fixture(opts){
 const h=harness('host',{hostSource:source('buergeramt.js').replace(marker,seam+marker)});
 h.window.amtRecoverySeed(opts);return h;
}
function advance(h,seconds){for(let n=0;n<Math.round(seconds*10);n++)h.level.update(.1);}
function closeEnough(actual,expected){assert.ok(Math.abs(actual-expected)<1e-7,`${actual} != ${expected}`);}

test('recovery rejects wrong, unassigned, early and unacknowledged arrivals',()=>{
 for(const opts of [{x:0,z:0},{assigned:0},{deadline:0},{called:'A-101'},{receipt:false},{name:''}]){
  const h=fixture(opts);h.level.update(0);assert.equal(h.level.floorState.restoring,false,JSON.stringify(opts));
 }
});

test('assigned-counter arrival automatically restores melt and speed in 90 real seconds',()=>{
 const h=fixture();h.level.update(0);
 assert.equal(h.level.floorState.restoring,true,'arrival triggers without E');
 closeEnough(h.level.timeScale,.65);closeEnough(h.level.floorState.goop,1);
 const visualStart=h.level.floorState.visualTime;
 advance(h,45);
 closeEnough(h.level.timeScale,.825);closeEnough(h.level.floorState.goop,.5);
 closeEnough(h.level.floorState.restoration,.5);
 assert.ok(h.level.floorState.visualTime>visualStart);
 const visualHalf=h.level.floorState.visualTime;
 advance(h,45);
 closeEnough(h.level.timeScale,1);closeEnough(h.level.floorState.goop,0);
 closeEnough(h.level.floorState.restoration,1);
 assert.ok(h.level.floorState.visualTime>visualHalf);
 const visualDone=h.level.floorState.visualTime;
 advance(h,5);
 closeEnough(h.level.timeScale,1);closeEnough(h.level.floorState.goop,0);
 assert.ok(h.level.floorState.visualTime>visualDone,'scene clock never rewinds with residence age');
});

test('partial melt recovery starts at current speed and continues after leaving the counter',()=>{
 const h=fixture({age:600});const initial=h.level.floorState.goop,speed=h.level.timeScale;
 h.level.update(0);closeEnough(h.level.timeScale,speed);
 // Move within the office after valid arrival; eligibility can disappear
 // without cancelling the restoration that now belongs to the visit.
 h.window.amtRecoveryMove(0,0);
 advance(h,45);
 closeEnough(h.level.floorState.goop,initial*.5);closeEnough(h.level.timeScale,(speed+1)*.5);
 advance(h,45);closeEnough(h.level.floorState.goop,0);closeEnough(h.level.timeScale,1);
});

test('hidden time pauses recovery and replay removes completed recovery ownership',()=>{
 const h=fixture();h.level.update(0);advance(h,30);
 const before=h.level.floorState;
 h.hide();advance(h,30);
 closeEnough(h.level.floorState.goop,before.goop);closeEnough(h.level.floorState.visualTime,before.visualTime);
 h.document.hidden=false;advance(h,60);closeEnough(h.level.floorState.goop,0);
 h.level.replay(h.config);
 assert.equal(h.level.floorState.restoring,false);closeEnough(h.level.floorState.time,0);closeEnough(h.level.floorState.visualTime,0);
 h.window.amtRecoverySeed({receipt:false,x:0,z:0});h.level.update(.1);
 assert.ok(h.level.floorState.goop>.99,'new attempt has no completed recovery latch');
 h.node('amt-exit').click();closeEnough(h.level.floorState.time,0);closeEnough(h.level.floorState.visualTime,0);
});
