import test from 'node:test';
import assert from 'node:assert/strict';
import {entryVortexFrame} from '../buergeramt-entry.js';

test('door vortex has a bounded, monotonic clock and a short reduced-motion fade',()=>{
  for(const reduced of [false,true]){
    let previous=0;
    for(let t=0;t<=5;t+=.025){
      const frame=entryVortexFrame(t,reduced);
      assert.ok(frame.progress>=previous&&frame.progress<=1);
      assert.equal(frame.done,t>=frame.duration);previous=frame.progress;
    }
    assert.equal(entryVortexFrame(-1,reduced).progress,0);
    assert.equal(entryVortexFrame(Infinity,reduced).progress,0);
    assert.equal(entryVortexFrame(NaN,reduced).progress,0);
  }
  assert.equal(entryVortexFrame(.24,true).done,true);
  assert.equal(entryVortexFrame(3.39).done,false);
  assert.equal(entryVortexFrame(3.4).done,true);
});
