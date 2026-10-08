import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,statSync} from "node:fs";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const diagnostic=readFileSync(new URL("../3d.html",import.meta.url),"utf8");
const renderer=readFileSync(new URL("../world3d.js",import.meta.url),"utf8");
const license=readFileSync(new URL("../assets/models/bundestag/LICENSES.md",import.meta.url),"utf8");
const modelUrl=new URL("../assets/models/bundestag/bundestag.glb",import.meta.url);
const model=readFileSync(modelUrl);

assert.match(game,/id:"bundestag".*x:7680,y:3320,w:1200,h:876.*doorX:8280,doorY:4226/,"the Bundestag must occupy the enlarged, clear southeast Berlin parcel");
assert.match(diagnostic,/id:"bundestag".*x:7680,y:3320,w:1200,h:876/,"the direct 3D diagnostic must mirror the landmark placement");
assert.match(renderer,/bundestag:"\.\/assets\/models\/bundestag\/bundestag\.glb"/,"the WebGL renderer must use the local landmark GLB");
const size=statSync(modelUrl).size;
assert.ok(size>100_000&&size<2_500_000,"the detailed landmark must remain within its 2.5 MB budget");
assert.match(license,new RegExp(createHash("sha256").update(model).digest("hex"),"i"),"the model checksum must match its provenance record");
assert.equal(model.readUInt32LE(0),0x46546c67);assert.equal(model.readUInt32LE(4),2);assert.equal(model.readUInt32LE(8),size);
const gltf=JSON.parse(model.subarray(20,20+model.readUInt32LE(12)).toString("utf8"));
assert.equal(gltf.buffers.length,1);assert.ok(!gltf.buffers[0].uri);assert.equal((gltf.textures||[]).length,0);
assert.ok(gltf.meshes.length<=8&&gltf.materials.length<=8,"joined materials keep landmark draw calls bounded");
assert.ok((gltf.extensionsRequired||[]).every(name=>name==="KHR_mesh_quantization"),"the landmark must not need a separate decoder");
const glass=gltf.materials.find(m=>/DomeGlass/i.test(m.name));
assert.ok(glass&&glass.alphaMode==="BLEND"&&glass.pbrMetallicRoughness.baseColorFactor[3]<.8,"the authored dome must remain visibly transparent");
const triangles=gltf.meshes.reduce((sum,mesh)=>sum+mesh.primitives.reduce((n,p)=>n+gltf.accessors[p.indices??p.attributes.POSITION].count/3,0),0);
assert.ok(triangles>10_000&&triangles<70_000,"facade detail stays within the landmark geometry budget");
const info=JSON.parse(readFileSync(new URL("../assets/models/bundestag/model-info.json",import.meta.url),"utf8"));
assert.equal(info.bytes,size);assert.equal(info.triangles,triangles);assert.equal(info.sha256,createHash("sha256").update(model).digest("hex"));
const dimensions=info.bounds.max.map((value,i)=>value-info.bounds.min[i]),fit=Math.min(1200*.02/dimensions[0],220*.038/dimensions[1],876*.02/dimensions[2]);
assert.ok(dimensions[1]*fit>8&&dimensions[1]*fit>7.951364,"the uniformly fitted landmark must exceed the Rathaus height");
assert.ok(dimensions[0]*fit<=24&&dimensions[2]*fit<=17.52,"the complete landmark stays inside its solid parcel");
assert.ok(readFileSync(new URL("../assets/models/bundestag/bundestag.blend",import.meta.url)).length>100_000,"editable Blender source must accompany the GLB");

console.log(`bundestag-model.test.mjs passed (${triangles.toLocaleString()} triangles; ${size.toLocaleString()} bytes)`);
