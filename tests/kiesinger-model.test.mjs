import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync,readFileSync} from "node:fs";

const modelUrl=new URL("../assets/models/kiesinger/kiesinger-statue.glb",import.meta.url);
const model=readFileSync(modelUrl);
assert.equal(model.readUInt32LE(0),0x46546c67,"the statue must be a binary glTF");
assert.equal(model.readUInt32LE(4),2,"the statue must use glTF 2.0");
assert.equal(model.readUInt32LE(8),model.length,"the GLB header must declare its exact size");
assert.ok(model.length>10_000&&model.length<4_000_000,"the statue must remain under the 4 MB file budget");

let gltf,binary;
for(let offset=12;offset<model.length;){
  const length=model.readUInt32LE(offset),type=model.readUInt32LE(offset+4),end=offset+8+length;
  assert.ok(end<=model.length&&length%4===0,"GLB chunks must be complete and aligned");
  if(type===0x4e4f534a){assert.equal(gltf,undefined,"the GLB must have one JSON chunk");gltf=JSON.parse(model.subarray(offset+8,end).toString("utf8").trim())}
  else if(type===0x004e4942){assert.equal(binary,undefined,"the GLB must have one binary chunk");binary=model.subarray(offset+8,end)}
  else assert.fail("unexpected GLB chunk");
  offset=end;
}
assert.ok(gltf&&binary,"the statue must embed its JSON and geometry");
assert.equal(gltf.asset.version,"2.0");
assert.equal(gltf.buffers.length,1,"geometry must share one embedded buffer");
assert.ok(!gltf.buffers[0].uri,"the statue must not request an external buffer");
assert.ok(gltf.buffers[0].byteLength<=binary.length&&binary.length-gltf.buffers[0].byteLength<=3,"the embedded buffer length must match its chunk");
assert.equal((gltf.images||[]).length,0,"the bronze statue must be texture-free");
assert.equal((gltf.textures||[]).length,0,"the bronze statue must not request textures");
assert.equal((gltf.animations||[]).length,0,"the statue must remain static");
assert.equal((gltf.skins||[]).length,0,"the statue must not ship a skeleton");
assert.equal((gltf.materials||[]).length,4,"the sculpt must reuse its four bronze materials");
assert.ok(!(gltf.extensionsRequired||[]).length,"the statue must load with the existing uncompressed GLTFLoader");

const dimensions={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
const components={5121:[1,"readUInt8"],5123:[2,"readUInt16LE"],5125:[4,"readUInt32LE"],5126:[4,"readFloatLE"]};
function accessor(index){
  const a=gltf.accessors[index];assert.ok(a,"geometry accessors must exist");
  const view=gltf.bufferViews[a.bufferView],lanes=dimensions[a.type],component=components[a.componentType];
  assert.ok(view&&component&&lanes,"accessors must reference supported geometry data");
  assert.ok(!a.sparse,"the bounded sculpt export must contain ordinary dense accessors");
  assert.equal(view.buffer,0,"all geometry must use the embedded buffer");
  const [bytes,read]=component,start=(view.byteOffset||0)+(a.byteOffset||0),stride=view.byteStride||bytes*lanes;
  assert.ok(Number.isInteger(a.count)&&a.count>0&&stride>=bytes*lanes,"accessor counts and stride must be valid");
  assert.ok((a.byteOffset||0)+(a.count-1)*stride+bytes*lanes<=view.byteLength&&start+(a.count-1)*stride+bytes*lanes<=binary.length,"accessors must stay inside their buffer view");
  return {a,read:i=>Array.from({length:lanes},(_,lane)=>binary[read](start+i*stride+lane*bytes))};
}
const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const multiply=(a,b)=>Array.from({length:16},(_,i)=>{const row=i%4,column=Math.floor(i/4);return a[row]*b[column*4]+a[4+row]*b[column*4+1]+a[8+row]*b[column*4+2]+a[12+row]*b[column*4+3]});
function transform(node){
  if(node.matrix){assert.equal(node.matrix.length,16);assert.ok(node.matrix.every(Number.isFinite));return node.matrix}
  const [x,y,z,w]=node.rotation||[0,0,0,1],[sx,sy,sz]=node.scale||[1,1,1],[tx,ty,tz]=node.translation||[0,0,0];
  const m=[(1-2*(y*y+z*z))*sx,2*(x*y+z*w)*sx,2*(x*z-y*w)*sx,0,2*(x*y-z*w)*sy,(1-2*(x*x+z*z))*sy,2*(y*z+x*w)*sy,0,2*(x*z+y*w)*sz,2*(y*z-x*w)*sz,(1-2*(x*x+y*y))*sz,0,tx,ty,tz,1];
  assert.ok(m.every(Number.isFinite),"node transforms must be finite");return m;
}
const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],active=new Set(),usedMeshes=new Set();
let triangles=0,vertices=0,primitives=0;
function visit(index,parent){
  assert.ok(!active.has(index),"the scene hierarchy must not contain cycles");
  const node=gltf.nodes[index];assert.ok(node,"scene nodes must exist");active.add(index);
  const matrix=multiply(parent,transform(node));
  if(node.mesh!==undefined){usedMeshes.add(node.mesh);for(const primitive of gltf.meshes[node.mesh].primitives){
    assert.equal(primitive.mode??4,4,"the statue must use triangle meshes");
    const position=accessor(primitive.attributes.POSITION);
    assert.equal(position.a.componentType,5126,"positions must be ordinary float32 vectors");assert.equal(position.a.type,"VEC3");
    assert.ok(Number.isInteger(primitive.material)&&gltf.materials[primitive.material],"every primitive must use a shared bronze material");
    let count=position.a.count;
    if(primitive.indices!==undefined){const indices=accessor(primitive.indices);assert.equal(indices.a.type,"SCALAR");assert.ok([5121,5123,5125].includes(indices.a.componentType));count=indices.a.count;for(let i=0;i<count;i++)assert.ok(indices.read(i)[0]<position.a.count,"indices must refer to existing vertices")}
    assert.equal(count%3,0,"triangle data must contain whole triangles");triangles+=count/3;primitives++;vertices+=position.a.count;
    for(let i=0;i<position.a.count;i++){
      const [x,y,z]=position.read(i);assert.ok([x,y,z].every(Number.isFinite),"vertex positions must be finite");
      const world=[matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14]];
      assert.ok(world.every(Number.isFinite),"transformed vertex positions must be finite");
      for(let axis=0;axis<3;axis++){min[axis]=Math.min(min[axis],world[axis]);max[axis]=Math.max(max[axis],world[axis])}
    }
  }}
  for(const child of node.children||[])visit(child,matrix);
  active.delete(index);
}
const scene=gltf.scenes[gltf.scene??0];assert.ok(scene?.nodes?.length,"the GLB must expose its sculpture scene");
for(const node of scene.nodes)visit(node,identity);
assert.equal(usedMeshes.size,gltf.meshes.length,"the sculpture scene must account for every shipped mesh");
assert.ok(vertices>0&&triangles>1_000&&triangles<85_000,"the sculpt must stay under 85,000 triangles");
assert.ok(primitives<=4,"the four joined materials must require at most four draw calls");
const size=max.map((v,i)=>v-min[i]);
assert.ok(Math.abs(min[1])<.05,"the shoes must be grounded at y=0");
assert.ok(Math.abs(size[1]-6)<.05&&Math.abs(max[1]-6)<.05,"the Y-up statue must be six units tall");
assert.ok(size[0]>.8&&size[0]<3.2&&size[2]>.5&&size[2]<2.2,"the export must retain human sculpture proportions");
assert.ok(min[0]<0&&max[0]>0&&min[2]<0&&max[2]>0,"the horizontal pivot must stay within the figure");

const provenanceUrl=new URL("../assets/models/kiesinger/PROVENANCE.md",import.meta.url);
const licenseUrl=new URL("../assets/models/kiesinger/LICENSES.md",import.meta.url);
const provenance=[provenanceUrl,licenseUrl].filter(existsSync).map(url=>readFileSync(url,"utf8")).join("\n");
assert.ok(provenance,"the original sculpt must have an adjacent provenance record");
assert.match(provenance,new RegExp(createHash("sha256").update(model).digest("hex"),"i"),"the shipped GLB checksum must match its provenance record");
console.log(`kiesinger-model.test.mjs passed (${triangles.toLocaleString()} triangles, ${model.length.toLocaleString()} bytes, bounds ${size.map(v=>v.toFixed(3)).join(" × ")})`);
