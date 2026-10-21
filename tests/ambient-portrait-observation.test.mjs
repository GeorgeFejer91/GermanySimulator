import test from 'node:test';
import assert from 'node:assert/strict';
import {assertLivePortraitSamples} from '../tools/playtest-ambient-encounters.mjs';

const sample=(frames,hash=5)=>({actor:{id:'heike'},portrait:{active:true,actorId:'heike',frames,failed:false},portraitPixels:{actorId:'heike',alpha:200,hash}});

test('a live portrait may hold identical pixels while its performer waits',()=>{
 assert.doesNotThrow(()=>assertLivePortraitSamples([sample(36),sample(44),sample(52)]));
});

test('a changing performance also requires actual portrait updates',()=>{
 assert.doesNotThrow(()=>assertLivePortraitSamples([sample(2,10),sample(4,20)]));
 assert.throws(()=>assertLivePortraitSamples([sample(2,10),sample(2,20)]),/render/i);
});

test('inactive, failed, transparent and foreign portraits cannot pass',()=>{
 for(const change of [s=>s.portrait.active=false,s=>s.portrait.failed=true,s=>s.portraitPixels.alpha=0,s=>s.portrait.actorId='other',s=>s.portraitPixels.actorId='other']){
  const samples=[sample(2),sample(4)];change(samples[1]);
  assert.throws(()=>assertLivePortraitSamples(samples));
 }
 assert.throws(()=>assertLivePortraitSamples([sample(2)]));
});
