import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';

const {createAssetQueue}=createRequire(import.meta.url)('../asset-queue.js');
const flush=()=>new Promise(setImmediate);

test('two stalled background jobs expire and release foreground work with aborted task signals', {timeout:2000}, async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const queue=createAssetQueue({timeoutMs:20}),signals=[];
  const stalled=()=>queue.enqueue(({signal})=>{signals.push(signal);return new Promise(()=>{})},{background:true});
  const first=stalled(),second=stalled();
  const outcomes=Promise.allSettled([first,second]);
  await flush();assert.equal(queue.inspect().active,2);
  const foreground=queue.enqueue(()=>42,{foreground:true});t.mock.timers.tick(20);
  assert.equal(await foreground,42);
  assert.ok((await outcomes).every(result=>result.status==='rejected'&&result.reason.name==='TimeoutError'));
  assert.ok(signals.every(signal=>signal.aborted));
  assert.deepEqual(queue.inspect(),{active:0,pending:0});
});

test('queued and active cancellation release ownership exactly once and reject late settlements',async()=>{
  const queue=createAssetQueue({concurrency:1}),active=new AbortController(),pending=new AbortController();
  let release,started=0,observedSignal;
  const first=queue.enqueue(({signal})=>{observedSignal=signal;return new Promise(resolve=>release=resolve)},{signal:active.signal});
  const firstOutcome=assert.rejects(first,{name:'AbortError'});
  const second=queue.enqueue(()=>{started++},{signal:pending.signal});
  const secondOutcome=assert.rejects(second,{name:'AbortError'});
  pending.abort();await secondOutcome;assert.equal(started,0);
  await flush();active.abort();await firstOutcome;assert.equal(observedSignal.aborted,true);
  assert.equal(await queue.enqueue(()=>++started),1);
  release('stale');await flush();
  assert.deepEqual(queue.inspect(),{active:0,pending:0});
});

test('hidden optional work waits, foreground stays admissible and ordinary work precedes background',async()=>{
  let hidden=true;const queue=createAssetQueue({isHidden:()=>hidden}),order=[];
  const promises=[queue.enqueue(()=>order.push('background'),{background:true}),queue.enqueue(()=>order.push('ordinary'))];
  await queue.enqueue(()=>order.push('foreground'),{foreground:true});
  assert.deepEqual(order,['foreground']);assert.equal(queue.inspect().pending,2);
  hidden=false;queue.pump();await Promise.all(promises);
  assert.deepEqual(order,['foreground','ordinary','background']);
});

test('hidden queued work has a bounded lifetime and never starts after expiry', {timeout:2000}, async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  let started=false;const queue=createAssetQueue({isHidden:()=>true,waitTimeoutMs:15});
  const expired=assert.rejects(queue.enqueue(()=>{started=true}),{name:'TimeoutError'});t.mock.timers.tick(15);await expired;
  assert.equal(started,false);assert.deepEqual(queue.inspect(),{active:0,pending:0});
});

test('already aborted work never starts; thrown errors and late rejection do not poison the queue',async()=>{
  const queue=createAssetQueue(),controller=new AbortController();controller.abort();
  await assert.rejects(queue.enqueue(()=>assert.fail('aborted task started'),{signal:controller.signal}),{name:'AbortError'});
  await assert.rejects(queue.enqueue(()=>{throw Error('broken')}),/broken/);
  assert.deepEqual(await Promise.allSettled([queue.enqueue(()=>Promise.reject(null))]),[{status:'rejected',reason:null}]);
  const cancellation=new AbortController();let reject;
  const delayed=queue.enqueue(()=>new Promise((_,fail)=>reject=fail),{signal:cancellation.signal});
  const rejected=assert.rejects(delayed,{name:'AbortError'});await flush();cancellation.abort();await rejected;
  reject(Error('late failure'));await flush();
  assert.equal(await queue.enqueue(()=>7),7);assert.equal(queue.inspect().active,0);
});
