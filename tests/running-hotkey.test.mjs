import test from 'node:test';
import assert from 'node:assert/strict';
import {harness,source} from './amt-harness.mjs';

const game=source('game.js');
const start=game.indexOf(' let sx=',game.indexOf('function update(dt)'));
const end=game.indexOf('\n if(bumped)',start);
assert.ok(start>=0&&end>start);
const cityStep=new Function('keys','player','dt','movePlayerGround',game.slice(start,end));
function cityDistance(keys,energy=100){
 let distance=0;
 cityStep(keys,{x:0,y:0,energy},.1,(dx,dy)=>{distance=Math.hypot(dx,dy)});
 return distance;
}

test('R doubles city walking speed, including diagonals and low energy, without stacking Shift',()=>{
 for(const movement of [{KeyW:true},{ArrowRight:true},{KeyW:true,KeyD:true}])for(const energy of [100,10]){
  const walk=cityDistance(movement,energy);
  assert.ok(walk>0);
  assert.equal(cityDistance({...movement,KeyR:true},energy),walk*2);
  assert.equal(cityDistance({...movement,KeyR:true,ShiftLeft:true},energy),walk*2);
  assert.ok(Math.abs(cityDistance({...movement,ShiftRight:true},energy)-walk*1.58)<1e-10);
 }
 assert.equal(cityDistance({KeyR:true}),0);
});

test('R doubles diagnostic movement and still stops at a building',()=>{
 const diagnostic=source('3d.html'),start=diagnostic.indexOf('function update(dt){')+'function update(dt){'.length;
 const step=new Function('keys','player','dt','blocked',diagnostic.slice(start,diagnostic.indexOf('const signalClock=',start)));
 for(const movement of [{ArrowUp:true},{ArrowUp:true,ArrowRight:true}]){
  const walk={x:0,y:0},run={x:0,y:0};step(movement,walk,.05,()=>false);step({...movement,KeyR:true},run,.05,()=>false);
  assert.equal(Math.hypot(run.x,run.y),Math.hypot(walk.x,walk.y)*2);
 }
 const player={x:0,y:0};step({ArrowRight:true,KeyR:true},player,.05,x=>x>=10&&x<=400);assert.equal(player.x,0);
});

test('R doubles office movement and releases on keyup, blur, and hidden tab',()=>{
 const h=harness();
 const step=()=>{const before=h.level.view,clock=h.level.floorState.visualTime;h.level.update(.05);const after=h.level.view;return Math.hypot(after.x-before.x,after.z-before.z)/(h.level.floorState.visualTime-clock)};
 // Interior arrival starts the shared drag clock; compare speed per scene second.
 h.key('KeyW');const walk=step();assert.ok(walk>0);
 h.key('KeyR');assert.ok(Math.abs(step()-walk*2)<1e-10);
 h.key('ShiftLeft');assert.ok(Math.abs(step()-walk*2)<1e-10);h.key('ShiftLeft','keyup');
 h.key('KeyR','keyup');assert.ok(Math.abs(step()-walk)<1e-10);
 h.key('KeyR');h.window.dispatchEvent(new Event('blur'));assert.equal(step(),0);
 h.key('KeyW');assert.ok(Math.abs(step()-walk)<1e-10);
 h.key('KeyR');h.hide();h.document.hidden=false;h.document.dispatchEvent(new Event('visibilitychange'));
 assert.equal(step(),0);h.key('KeyW');assert.ok(Math.abs(step()-walk)<1e-10);
});
