import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DETAIL_IDS,DETAIL_FITS,buildDetailMesh,createDetailGLB} from '../assets/models/prop-details/models.js';
function unpack(id){const bytes=createDetailGLB(id),v=new DataView(bytes),n=v.getUint32(12,true);return{bytes,v,json:JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,n))),bin:28+n};}
for(const id of DETAIL_IDS){
 test(`${id}: finite, grounded, centred and inside existing size envelope`,()=>{
  const m=buildDetailMesh(id),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  assert.ok(m.triangles>100&&m.triangles<5000);assert.ok(m.parts.length<=9);
  for(const p of m.parts){assert.equal(p.positions.length,p.normals.length);assert.equal(p.positions.length%9,0);for(let i=0;i<p.positions.length;i++){const k=i%3,v=p.positions[i];assert.ok(Number.isFinite(v));min[k]=Math.min(min[k],v);max[k]=Math.max(max[k],v);}for(let i=0;i<p.normals.length;i+=3)assert.ok(Math.abs(Math.hypot(...p.normals.slice(i,i+3))-1)<1e-6);}
  assert.ok(Math.abs(min[1])<1e-6);assert.ok(Math.abs(min[0]+max[0])<1e-6);assert.ok(Math.abs(min[2]+max[2])<1e-6);
  for(let k=0;k<3;k++)assert.ok(max[k]-min[k]<=DETAIL_FITS[id][k]+1e-6);
 });
 test(`${id}: deterministic decoder-free material-batched GLB`,()=>{
  const{bytes,v,json,bin}=unpack(id);assert.equal(v.getUint32(0,true),0x46546c67);assert.equal(v.getUint32(4,true),2);assert.equal(v.getUint32(8,true),bytes.byteLength);assert.equal(v.getUint32(bin-4,true),0x004e4942);assert.equal(v.getUint32(bin-8,true),json.buffers[0].byteLength);assert.equal(bin+json.buffers[0].byteLength,bytes.byteLength);assert.ok(bytes.byteLength<400000);
  assert.deepEqual(new Uint8Array(bytes),new Uint8Array(createDetailGLB(id)));
  assert.equal(json.asset.version,'2.0');assert.equal(json.images,undefined);assert.equal(json.textures,undefined);assert.equal(json.extensionsRequired,undefined);assert.equal(json.buffers[0].uri,undefined);
  assert.equal(json.nodes[0].name,id);assert.ok(json.nodes[0].extras.features.length>=2);
  for(const primitive of json.meshes[0].primitives){assert.equal(primitive.mode,4);assert.ok(primitive.material<json.materials.length);const p=json.accessors[primitive.attributes.POSITION],n=json.accessors[primitive.attributes.NORMAL];assert.equal(p.count,n.count);assert.equal(p.count%3,0);for(const a of[p,n]){const b=json.bufferViews[a.bufferView];assert.equal(a.type,'VEC3');assert.equal(a.componentType,5126);assert.equal(b.byteOffset%4,0);assert.equal(b.byteLength,a.count*12);assert.ok(b.byteOffset+b.byteLength<=json.buffers[0].byteLength);for(let i=0;i<a.count*3;i++)assert.ok(Number.isFinite(v.getFloat32(bin+b.byteOffset+i*4,true)));}}
 });
}
test('unknown prop IDs fail instead of substituting another asset',()=>assert.throws(()=>createDetailGLB('not-a-prop'),RangeError));
test('exactly four scoped models and immutable fit contracts',()=>{assert.equal(DETAIL_IDS.length,4);assert.ok(Object.isFrozen(DETAIL_IDS));for(const id of DETAIL_IDS)assert.ok(Object.isFrozen(DETAIL_FITS[id]));});

test('prototype property names are not model IDs',()=>{for(const id of ['constructor','toString','__proto__'])assert.throws(()=>createDetailGLB(id),RangeError);});
const {loadWithDetailFallback}=await import('../assets/models/prop-details/loader.js');
test('eligible model is parsed once as GLB without downloading original',async()=>{
 let parsed=0,downloads=0;const loader={parse(bytes,path,resolve){parsed++;assert.equal(new DataView(bytes).getUint32(0,true),0x46546c67);assert.equal(path,'');resolve({scene:'candidate'});},loadAsync(){downloads++;}};
 const result=await loadWithDetailFallback('./assets/models/german-props/beer-crate.glb?v=original',loader);assert.equal(result.scene,'candidate');assert.equal(parsed,1);assert.equal(downloads,0);
});
test('parse rejection retains original model, URL and a visible warning',async()=>{
 const urls=[],warnings=[];const loader={parse(bytes,path,resolve,reject){reject(new Error('simulated parser failure'));},async loadAsync(url){urls.push(url);return {scene:'original'};}};
 const url='./assets/models/city-kit/fax-kiosk.glb?v=original',result=await loadWithDetailFallback(url,loader,(...args)=>warnings.push(args));assert.equal(result.scene,'original');assert.deepEqual(urls,[url]);assert.equal(warnings.length,1);
});
test('unrelated and lookalike paths never enter the candidate lane',async()=>{
 const paths=['./assets/models/city-kit/pfand-bottle.glb','./elsewhere/beer-crate.glb','./assets/models/german-props/not-beer-crate.glb'];let downloads=0;
 const loader={parse(){assert.fail('unexpected replacement');},async loadAsync(url){downloads++;return url;}};
 for(const url of paths)assert.equal(await loadWithDetailFallback(url,loader),url);assert.equal(downloads,3);
});
