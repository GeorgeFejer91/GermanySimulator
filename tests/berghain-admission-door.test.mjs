import test from 'node:test';
import assert from 'node:assert/strict';
import {createWalkthrough} from '../berghain/walkthrough.mjs';
import {canStand,walkingSpeed} from '../berghain/navigation.mjs';

test('a close hinge-side interaction clears the visitor before opening, without a recovery jump',()=>{
 for(const x of [-.35,.35])for(const dt of [1/60,1/30,.1]){
  const walk=createWalkthrough();let p={x,y:.05,z:22.8};
  try{
   assert.ok(canStand(p,walk.space));assert.ok(walk.interact(p));
   assert.ok(canStand(p,walk.space),'opening must not introduce a body overlap');
   for(let step=0;step<500&&walk.travelling;step++){
    const previous=p;p=walk.step(p,{x:0,z:0},dt);
    assert.ok(canStand(p,walk.space));
    assert.ok(Math.hypot(p.x-previous.x,p.z-previous.z)<=dt*walkingSpeed+1e-8,'no recovery displacement beyond walking pace');
   }
   assert.equal(walk.travelling,false);assert.ok(p.z<20.28);
   assert.ok(walk.interact(p));
   for(let step=0;step<500&&walk.travelling;step++)p=walk.step(p,{x:0,z:0},dt);
   assert.ok(p.z>24.8&&canStand(p,walk.space));
  }finally{walk.dispose();}
 }
 const walk=createWalkthrough();let p={x:-.35,y:.05,z:22.8};
 try{assert.ok(walk.interact(p));p=walk.step(p,{x:0,z:0},1/60);walk.stop();
  assert.deepEqual(walk.step(p,{x:0,z:0},1/60),p);assert.ok(canStand(p,walk.space));
 }finally{walk.dispose();}
});
