import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {source} from './amt-harness.mjs';

test('TimeAPI UTC sample maps monotonic cue times with a bounded uncertainty',async()=>{
 const window={},calls=[],ticks=[1000,1100];
 const fetch=async(url,options)=>{calls.push({url,options});return{ok:true,json:async()=>({year:2026,month:10,day:7,hour:12,minute:0,seconds:0,milliSeconds:500,timeZone:'UTC'})}};
 vm.runInNewContext(source('buergeramt-time.js'),{window,fetch,AbortController,performance:{now:()=>ticks.shift()},setTimeout:()=>1,clearTimeout(){},Date,Math,Number});
 const service=window.BuergeramtClock,anchor=await service.sample({count:1});
 assert.equal(calls[0].url,'https://timeapi.io/api/Time/current/zone?timeZone=UTC');assert.equal(calls[0].options.cache,'no-store');assert.equal(calls[0].options.mode,'cors');
 assert.equal(anchor.rttMs,100);assert.equal(anchor.uncertaintyMs,100);assert.equal(service.utcAt(anchor,1050),Date.UTC(2026,9,7,12,0,0,500));assert.equal(service.monoAt(anchor,service.utcAt(anchor,1450)),1450);assert.equal(service.usable(anchor,1100),true);assert.equal(service.usable(anchor,301101),false);
});
test('an unavailable external clock leaves direct peer timing available',async()=>{
 const window={};vm.runInNewContext(source('buergeramt-time.js'),{window,fetch:async()=>{throw new Error('offline')},AbortController,performance:{now:()=>0},setTimeout:()=>1,clearTimeout(){},Date,Math,Number});
 assert.equal(await window.BuergeramtClock.sample({count:2}),null);
});
