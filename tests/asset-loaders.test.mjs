import assert from 'node:assert/strict';
import test from 'node:test';
import {modelLoaderWithSignal,loadTextureImage,leaseWithSignal} from '../asset-loaders.js';

test('model source cancellation reaches fetch and prevents parsing',async()=>{
  const original=globalThis.fetch,controller=new AbortController();let fetchSignal,parses=0;
  try{
    globalThis.fetch=(_url,{signal})=>{fetchSignal=signal;return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}))};
    const loader=modelLoaderWithSignal({parse(){parses++}},controller.signal);
    const load=loader.loadAsync('http://localhost/model.glb'),rejected=assert.rejects(load,{name:'AbortError'});
    controller.abort();await rejected;
    assert.equal(fetchSignal,controller.signal);assert.equal(parses,0);
  }finally{globalThis.fetch=original}
});

for(const reason of [undefined,null])test('texture cancellation ('+(reason===null?'null':'default')+') stops outstanding decode and releases its object URL',async()=>{
  const original={fetch:globalThis.fetch,Image:globalThis.Image,create:URL.createObjectURL,revoke:URL.revokeObjectURL};
  const controller=new AbortController(),images=[],revoked=[];let fetchSignal;
  try{
    globalThis.fetch=async(_url,{signal})=>{fetchSignal=signal;return{ok:true,blob:async()=>new Blob(['image'])}};
    globalThis.Image=class{constructor(){images.push(this)}};
    URL.createObjectURL=()=> 'blob:asset-test';URL.revokeObjectURL=url=>revoked.push(url);
    const load=loadTextureImage('/texture.webp',controller.signal),rejected=assert.rejects(load,error=>error===controller.signal.reason);
    await new Promise(setImmediate);assert.equal(images[0].src,'blob:asset-test');
    controller.abort(reason);await rejected;
    assert.equal(fetchSignal,controller.signal);assert.equal(images[0].src,'');
    assert.equal(images[0].onload,null);assert.equal(images[0].onerror,null);assert.deepEqual(revoked,['blob:asset-test']);
  }finally{Object.assign(globalThis,{fetch:original.fetch,Image:original.Image});URL.createObjectURL=original.create;URL.revokeObjectURL=original.revoke}
});

test('model loading supports AbortSignal implementations without throwIfAborted',async()=>{
 const original=globalThis.fetch,controller=new AbortController(),model={scene:{traverse(){}}};
 Object.defineProperty(controller.signal,'throwIfAborted',{value:undefined});
 try{
  globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
  const loader=modelLoaderWithSignal({parse(_bytes,_base,done){done(model)}},controller.signal);
  assert.equal(await loader.loadAsync('http://localhost/model.glb'),model);
 }finally{globalThis.fetch=original}
});

test('a parse finishing after cancellation releases its unique resources instead of returning a model',async()=>{
  const original=globalThis.fetch,controller=new AbortController();let complete,geometryDisposals=0,textureDisposals=0,materialDisposals=0;
  try{
    globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
    const loader=modelLoaderWithSignal({parse(_bytes,base,done){assert.equal(base,'http://localhost/assets/');complete=done}},controller.signal);
    const load=loader.loadAsync('http://localhost/assets/model.glb'),rejected=assert.rejects(load,{name:'AbortError'});
    await new Promise(setImmediate);controller.abort();
    const texture={isTexture:true,dispose(){textureDisposals++}},material={map:texture,normalMap:texture,dispose(){materialDisposals++}},geometry={dispose(){geometryDisposals++}};
    complete({scene:{traverse:visit=>{visit({geometry,material});visit({geometry,material})}}});await rejected;
    assert.deepEqual([geometryDisposals,textureDisposals,materialDisposals],[1,1,1]);
  }finally{globalThis.fetch=original}
});


test('cancelling one shared-resource waiter releases only its own lease',async()=>{
 const first=new AbortController(),second=new AbortController();let complete,releases=0;
 const promise=new Promise(resolve=>complete=resolve);
 const leases=[first,second].map(controller=>leaseWithSignal({promise,release(){releases++}},controller.signal));
 const cancelled=assert.rejects(leases[0].promise,{name:'AbortError'});first.abort();await cancelled;
 assert.equal(releases,1);complete('shared texture');assert.equal(await leases[1].promise,'shared texture');
 second.abort();assert.equal(releases,1,'settled waiter removes its request listener');leases[1].release();assert.equal(releases,2);
});


test('an already-aborted shared waiter observes a rejection caused by releasing its underlying lease',async()=>{
 const controller=new AbortController();controller.abort();let rejectUnderlying,releases=0;
 const promise=new Promise((_resolve,reject)=>rejectUnderlying=reject);
 const cancelled=leaseWithSignal({promise,release(){releases++;rejectUnderlying(new Error('Underlying resource released'))}},controller.signal);
 await assert.rejects(cancelled.promise,error=>error===controller.signal.reason);
 await new Promise(setImmediate);cancelled.release();assert.equal(releases,1);
});
