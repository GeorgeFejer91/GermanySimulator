import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';

const source=readFileSync('preload.js','utf8');
function fixture(images=[]){
  const nodes=new Map();
  const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,inert:true,style:{},attrs:{},textContent:'',setAttribute(k,v){this.attrs[k]=v}});return nodes.get(id)};
  const removed=[],events={};let reloaded=0;
  const context={document:{getElementById:node,querySelectorAll:()=>images,body:{classList:{remove:c=>removed.push(c)}}},addEventListener:(name,fn)=>events[name]=fn,location:{reload:()=>reloaded++}};
  vm.runInNewContext(source,context);
  context.GermanyPreload.prepareMenu(task=>Promise.resolve().then(task));
  return {api:context.GermanyPreload,node,removed,events,reloads:()=>reloaded};
}
test('menu remains inert through partial preparation; progress never regresses or completes early',()=>{
  const f=fixture();f.api.update({renderer:true,total:10,settled:5});
  const before=Number(f.node('preload-meter').attrs['aria-valuenow']);assert.ok(before>0&&before<100);
  f.api.update({renderer:true,total:30,settled:5});assert.equal(Number(f.node('preload-meter').attrs['aria-valuenow']),before);
  f.api.update({renderer:true,total:30,settled:30});assert.equal(f.node('preload-meter').attrs['aria-valuenow'],'95');
  assert.equal(f.node('app').inert,true);assert.equal(f.node('preload').hidden,false);
  f.api.update({ready:true});assert.equal(f.node('preload-meter').attrs['aria-valuenow'],'100');
  assert.equal(f.node('app').inert,false);assert.equal(f.node('preload').hidden,true);assert.deepEqual(f.removed,['preloading']);
  f.api.update({ready:false});f.api.fail();assert.equal(f.node('preload').hidden,true);
});
test('fatal boot failures keep menu guarded and provide working retry',()=>{
  const f=fixture();f.node('preload-retry').hidden=true;f.events.error({error:Error('WebGL unavailable')});
  assert.equal(f.node('preload-retry').hidden,false);assert.equal(f.node('app').inert,true);
  f.node('preload-retry').onclick();assert.equal(f.reloads(),1);
});
test('menu image decoding also holds readiness, and a missing image settles without blocking forever',async()=>{
  let finish;const f=fixture([{decode:()=>new Promise(resolve=>finish=resolve)},{decode:()=>Promise.reject(Error('missing image'))}]);
  await new Promise(setImmediate);f.api.update({ready:true});assert.equal(f.node('app').inert,true);
  finish();await new Promise(setImmediate);f.api.update({ready:true});assert.equal(f.node('app').inert,false);
});
test('canonical game and engine dependencies resolve locally while compatibility entry loads no engine',()=>{
  for(const file of JSON.parse(readFileSync('assets/vendor/three/0.186.0/manifest.json')).files){
    const bytes=readFileSync('assets/vendor/three/0.186.0/'+file.file);assert.equal(bytes.length,file.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
  }
  for(const page of ['index.html']){
    const html=readFileSync(page,'utf8');assert.ok(!html.includes('cdn.jsdelivr.net/npm/three@'));
    const map=JSON.parse(html.match(/<script type="importmap">(.*?)<\/script>/)[1]);assert.ok(existsSync(map.imports.three));
    for(const imported of readFileSync('assets/vendor/spark/2.3.1/spark.module.js','utf8').matchAll(/from ["'](three\/addons\/[^"']+)["']/g))assert.ok(existsSync(map.imports['three/addons/']+imported[1].slice('three/addons/'.length)),imported[1]+' remains available for office cinematics');
  }
  const compatibility=readFileSync("3d.html","utf8");assert.doesNotMatch(compatibility,/type="importmap"|<script[^>]+src=/,"compatibility entry cannot start a second engine/dependency load");
  for(const path of ['build/three.core.js','examples/jsm/loaders/GLTFLoader.js','examples/jsm/utils/BufferGeometryUtils.js','examples/jsm/utils/SkeletonUtils.js','LICENSE'])assert.ok(existsSync('assets/vendor/three/0.186.0/'+path));
  const html=readFileSync('index.html','utf8');assert.match(html,/<main id="app" inert>/);assert.match(html,/<body class="preloading">/);
  assert.ok(!readFileSync('styles.css','utf8').includes('@import'));
});
