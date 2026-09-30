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
test('original four study exports remain byte-identical',()=>{const hashes={"beer-crate":"90c40bbb81bd30c66606a1f9097d508fda0d1ca39b2d04ee9cde801f4b2473a1","recycling-containers":"d4b669acfee932a6e9fc9bf0faf4632f1d087ebf87ae7ca1c8f70e531b9716b6","allotment-wheelbarrow":"e2370efce7933860ead313d49f1dd1e71a420c724947a4ec61868ed06282cc28","fax-kiosk":"96840b52bc06b5cc2ca5e7e25036cf3b2c3dc5d8e303d445f2174daa41434dc1"};for(const id of DETAIL_IDS)assert.equal(createHash('sha256').update(Buffer.from(createDetailGLB(id))).digest('hex'),hashes[id]);});
test('shared GLB parse is cached per loader and ID',async()=>{let calls=0;const loader={parse(bytes,path,ok){calls++;ok({scene:'shared'});}};const [a,b]=await Promise.all([loadSatireModel('station-clock',loader),loadSatireModel('station-clock',loader)]);assert.equal(a,b);assert.equal(calls,1);});
test('candidate parse failure loads original and can retry',async()=>{let attempts=0,originals=0,warnings=0;const loader={parse(bytes,path,ok,fail){attempts++;fail(new Error('test'));},async loadAsync(url){originals++;return url;}};const url=Object.keys(REPLACEMENTS)[0]+'?v=old';for(let i=0;i<2;i++)assert.equal(await loadWithDetailFallback(url,loader,()=>warnings++),url);assert.equal(attempts,2);assert.equal(originals,2);assert.equal(warnings,2);});
test('unrelated paths and red towel identity are never replaced',async()=>{const loader={parse(){assert.fail('unexpected parse');},loadAsync:async url=>url};for(const url of ['./elsewhere/beer-crate.glb','./assets/models/german-props/reserved-lounger-red.glb'])assert.equal(await loadWithDetailFallback(url,loader),url);});
test('station placements are deterministic, bounded and never mutate simulation data',()=>{for(const id of ['nordwest','suedwest']){const station=Object.freeze({id,w:1200,h:180,x:123,y:456});const parts=stationLayout(station);assert.ok(parts.length>0);assert.deepEqual(parts,stationLayout(station));for(const p of parts){assert.ok(Math.abs(p.x)+2.2*p.scale<=station.w*.01);assert.ok(Math.abs(p.z)+1.16*p.scale<=station.h*.01);}}assert.equal(stationLayout({id:'north',w:50,h:20}).length,0);});
