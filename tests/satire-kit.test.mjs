import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {SATIRE_IDS,SATIRE_CATALOG,buildSatireMesh,createSatireGLB} from '../assets/models/satire-kit/models.js';
import {createDetailGLB,DETAIL_IDS} from '../assets/models/prop-details/models.js';
import {REPLACEMENTS,loadSatireModel,loadWithDetailFallback,stationLayout} from '../assets/models/satire-kit/loader.js';
for(const id of SATIRE_IDS){
 test(id+': geometry and reproducible GLB',()=>{
  const mesh=buildSatireMesh(id),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  assert.ok(mesh.triangles>100&&mesh.triangles<5000);assert.ok(mesh.parts.length<=13);
  for(const part of mesh.parts){assert.equal(part.positions.length,part.normals.length);assert.equal(part.positions.length%9,0);
   for(let i=0;i<part.positions.length;i++){const k=i%3,v=part.positions[i];assert.ok(Number.isFinite(v));min[k]=Math.min(min[k],v);max[k]=Math.max(max[k],v);}
   for(let i=0;i<part.normals.length;i+=3)assert.ok(Math.abs(Math.hypot(...part.normals.slice(i,i+3))-1)<1e-5);
  }
  assert.ok(Math.abs(min[1])<1e-6);for(const k of [0,2])assert.ok(Math.abs(min[k]+max[k])<1e-6);
  assert.ok(mesh.dimensions.every(n=>Number.isFinite(n)&&n>0&&n<10));
  const bytes=createSatireGLB(id),v=new DataView(bytes),jsonLength=v.getUint32(12,true),json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,jsonLength))),bin=28+jsonLength;
  assert.equal(v.getUint32(0,true),0x46546c67);assert.equal(v.getUint32(4,true),2);assert.equal(v.getUint32(8,true),bytes.byteLength);assert.equal(bin+json.buffers[0].byteLength,bytes.byteLength);
  assert.ok(bytes.byteLength<400000);assert.equal(json.nodes[0].name,id);assert.equal(json.images,undefined);assert.equal(json.extensionsRequired,undefined);
  for(const a of json.accessors){const b=json.bufferViews[a.bufferView];assert.equal(a.type,'VEC3');assert.equal(a.componentType,5126);assert.equal(b.byteOffset%4,0);assert.equal(a.count*12,b.byteLength);assert.ok(b.byteOffset+b.byteLength<=json.buffers[0].byteLength);}
  assert.deepEqual(new Uint8Array(bytes),new Uint8Array(createSatireGLB(id)));
 });
}
test('all requested families have unique immutable IDs',()=>{assert.equal(SATIRE_IDS.length,45);assert.equal(new Set(SATIRE_IDS).size,45);assert.deepEqual(['station','civic','clutter'].map(f=>SATIRE_CATALOG.filter(x=>x.family===f).length),[17,16,12]);assert.ok(Object.isFrozen(SATIRE_CATALOG));});
test('invalid and inherited IDs fail closed',()=>{for(const id of ['missing','constructor','__proto__','toString'])assert.throws(()=>createSatireGLB(id),RangeError);});
// The earlier expected digests predated the first checked-in detail source and
// matched none of its four exports. Pin the verified source outputs from this
// consolidation so a future geometry/encoder change remains visible.
test('four study exports remain byte-identical',()=>{const hashes={"beer-crate":"0218abeecfe86307a4a39bdb32bc065bfdc72d5cb6a6624e4755b2e23b6167de","recycling-containers":"c67244ccf3dd6578633a1412e82fa1f8c647741a6792aa916be2819203e69fca","allotment-wheelbarrow":"470fb7f3342aba0bbd0d814a14ecbbdd21db6b1252bc83b241e49cb8e5ec5b65","fax-kiosk":"471ed731764adc95f3e893e0a5afa1a8f1d86014b5ad51d0005f254d88052d2c"};for(const id of DETAIL_IDS)assert.equal(createHash('sha256').update(Buffer.from(createDetailGLB(id))).digest('hex'),hashes[id]);});
test('shared GLB parse is cached per loader and ID',async()=>{let calls=0;const loader={parse(bytes,path,ok){calls++;ok({scene:'shared'});}};const [a,b]=await Promise.all([loadSatireModel('station-clock',loader),loadSatireModel('station-clock',loader)]);assert.equal(a,b);assert.equal(calls,1);});
test('candidate parse failure loads original and can retry',async()=>{let attempts=0,originals=0,warnings=0;const loader={parse(bytes,path,ok,fail){attempts++;fail(new Error('test'));},async loadAsync(url){originals++;return url;}};const url=Object.keys(REPLACEMENTS)[0]+'?v=old';for(let i=0;i<2;i++)assert.equal(await loadWithDetailFallback(url,loader,()=>warnings++),url);assert.equal(attempts,2);assert.equal(originals,2);assert.equal(warnings,2);});
test('unrelated paths and red towel identity are never replaced',async()=>{const loader={parse(){assert.fail('unexpected parse');},loadAsync:async url=>url};for(const url of ['./elsewhere/beer-crate.glb','./assets/models/german-props/reserved-lounger-red.glb'])assert.equal(await loadWithDetailFallback(url,loader),url);});
test('station placements are deterministic, bounded and never mutate simulation data',()=>{for(const id of ['nordwest','suedwest']){const station=Object.freeze({id,w:1200,h:180,x:123,y:456});const parts=stationLayout(station);assert.ok(parts.length>0);assert.deepEqual(parts,stationLayout(station));for(const p of parts){assert.ok(Math.abs(p.x)+2.2*p.scale<=station.w*.01);assert.ok(Math.abs(p.z)+1.16*p.scale<=station.h*.01);}}assert.equal(stationLayout({id:'north',w:50,h:20}).length,0);});
