import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../tools/benchmark-browser.mjs',import.meta.url),'utf8');
const budgetSource=source.match(/function openingRenderWithinBudget\([^\n]+/)?.[0];
assert.ok(budgetSource);
const within=vm.runInNewContext(`(${budgetSource})`);
assert.ok(within({elapsedMs:3000,syncCalls:12}));
assert.ok(within({elapsedMs:3000,syncCalls:13}),'phase and deadline tolerance allow a boundary call');
assert.ok(within({elapsedMs:4250,syncCalls:17}),'a delayed host receipt does not turn 4 Hz into a false failure');
assert.equal(within({elapsedMs:3000,syncCalls:17}),false,'the original excess count still fails in an actual three-second window');
assert.equal(within({elapsedMs:4250,syncCalls:26}),false,'a longer receipt window cannot excuse 6 Hz');
for(const elapsedMs of [0,-1,NaN,Infinity])assert.equal(within({elapsedMs,syncCalls:12}),false);
for(const syncCalls of [0,-1,12.5,NaN,Infinity])assert.equal(within({elapsedMs:3000,syncCalls}),false);
assert.match(source,/!openingRenderWithinBudget\(intro\)/,'the release gate must use the tested guard');

// Execute the production sampler with delayed browser/host scheduling. The
// browser clock, rather than the requested wait, defines the captured window.
const a=source.indexOf('async function sample()'),b=source.indexOf('\n  const intro=',a);
assert.ok(a>=0&&b>a);
let now=1000;
const scope={performance:{now:()=>now},__frames:[],__mutations:{},Germany3D:{inspectAssets:()=>({render:{},memory:{}})},document:{getElementById:()=>({width:390,height:844})}};
scope.window=scope;
scope.page={evaluate:callback=>vm.runInNewContext(`(${callback.toString()})()`,scope),waitForTimeout:async ms=>{assert.equal(ms,3000);scope.__frames=[1250,1500,1750,2000];now+=4250}};
const sample=vm.runInNewContext(`${source.slice(a,b)};sample`,scope);
const result=await sample();
assert.equal(result.elapsedMs,4250);assert.equal(result.syncCalls,4);
assert.equal(result.frameMs.p50,250);assert.ok(within(result));
console.log('Measured opening-screen duration, delayed receipts and real excess cadence checks OK');
