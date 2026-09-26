import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import {zstdDecompressSync} from "node:zlib";

const directory=new URL("../assets/models/city-kit/",import.meta.url);
const manifest=JSON.parse(readFileSync(new URL("manifest.json",directory),"utf8"));
const expected="municipal-office berlin-block brick-utility neighborhood-shop pfand-machine coffee-machine fax-kiosk garden-gnome deciduous-tree garden-shed bench streetlamp litter-bin bollard bicycle-rack pfand-bottle".split(" ");
assert.deepEqual(Object.keys(manifest.models).sort(),expected.sort(),"the complete original city kit must ship");
const blend=readFileSync(new URL(manifest.source,directory));
const blendHeader=blend.readUInt32LE(0)===0xfd2fb528?zstdDecompressSync(blend):blend;
assert.equal(blendHeader.subarray(0,7).toString(),"BLENDER","editable Blender source must ship");
assert.match(readFileSync(new URL(manifest.script,directory),"utf8"),/^import bpy$/m,"the recorded authoring script must use Blender");

const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const multiply=(a,b)=>Array.from({length:16},(_,i)=>{const r=i%4,c=Math.floor(i/4)*4;return a[r]*b[c]+a[r+4]*b[c+1]+a[r+8]*b[c+2]+a[r+12]*b[c+3]});
function transform(node){
  if(node.matrix){assert.equal(node.matrix.length,16);return node.matrix}
  const [x,y,z,w]=node.rotation||[0,0,0,1],[sx,sy,sz]=node.scale||[1,1,1],[tx,ty,tz]=node.translation||[0,0,0];
  return [(1-2*(y*y+z*z))*sx,2*(x*y+z*w)*sx,2*(x*z-y*w)*sx,0,2*(x*y-z*w)*sy,(1-2*(x*x+z*z))*sy,2*(y*z+x*w)*sy,0,2*(x*z+y*w)*sz,2*(y*z-x*w)*sz,(1-2*(x*x+y*y))*sz,0,tx,ty,tz,1];
}
let totalBytes=0,totalTriangles=0;
for(const [name,record] of Object.entries(manifest.models)){
  assert.equal(record.file,name+".glb");
  const file=readFileSync(new URL(record.file,directory));
  assert.equal(file.length,record.bytes,name+" manifest byte count");
  assert.equal(createHash("sha256").update(file).digest("hex"),record.sha256,name+" manifest checksum");
  assert.ok(file.length>1_000&&file.length<400_000,name+" per-model transfer budget");
  assert.equal(file.readUInt32LE(0),0x46546c67);assert.equal(file.readUInt32LE(4),2);assert.equal(file.readUInt32LE(8),file.length);
  const chunks=new Map();
  for(let offset=12;offset<file.length;){
    assert.ok(offset+8<=file.length,name+" complete chunk header");
    const length=file.readUInt32LE(offset),type=file.readUInt32LE(offset+4),end=offset+8+length;
    assert.ok(length%4===0&&end<=file.length&&!chunks.has(type),name+" aligned unique chunks");
    chunks.set(type,file.subarray(offset+8,end));offset=end;
  }
  assert.deepEqual([...chunks.keys()],[0x4e4f534a,0x004e4942],name+" embedded JSON and geometry");
  const gltf=JSON.parse(chunks.get(0x4e4f534a).toString().trim()),binary=chunks.get(0x004e4942);
  assert.equal(gltf.asset.version,"2.0");assert.equal(gltf.buffers.length,1);assert.ok(!gltf.buffers[0].uri);
  assert.ok(gltf.buffers[0].byteLength<=binary.length&&binary.length-gltf.buffers[0].byteLength<=3);
  for(const key of ["textures","images","animations","skins","extensionsRequired"])assert.equal((gltf[key]||[]).length,0,name+" must remain static, texture-free and decoder-free");
  assert.equal(gltf.materials.length,record.materials);assert.ok(gltf.materials.length<=10,name+" material budget");
  assert.ok(gltf.meshes.length>=1&&gltf.meshes.length<=4,name+" joined mesh budget");
  for(const view of gltf.bufferViews){assert.equal(view.buffer,0);assert.ok((view.byteOffset||0)+view.byteLength<=gltf.buffers[0].byteLength)}
  function accessor(index){
    const a=gltf.accessors[index],view=gltf.bufferViews[a?.bufferView],lanes={SCALAR:1,VEC3:3}[a?.type],component={5121:[1,"readUInt8"],5123:[2,"readUInt16LE"],5125:[4,"readUInt32LE"],5126:[4,"readFloatLE"]}[a?.componentType];
    assert.ok(a&&view&&lanes&&component&&!a.sparse&&Number.isInteger(a.count)&&a.count>0,name+" supported dense accessor");
    const [bytes,read]=component,stride=view.byteStride||bytes*lanes,start=(view.byteOffset||0)+(a.byteOffset||0);
    assert.ok(stride>=bytes*lanes&&(a.byteOffset||0)+(a.count-1)*stride+bytes*lanes<=view.byteLength,name+" accessor remains inside buffer view");
    return {a,read:i=>Array.from({length:lanes},(_,lane)=>binary[read](start+i*stride+lane*bytes))};
  }
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],visited=new Set(),meshes=new Set();let triangles=0,primitives=0;
  function visit(index,parent){
    const node=gltf.nodes[index];assert.ok(node&&!visited.has(index),name+" nonduplicated acyclic scene");visited.add(index);
    const matrix=multiply(parent,transform(node));assert.ok(matrix.every(Number.isFinite));
    if(node.mesh!==undefined){
      assert.ok(gltf.meshes[node.mesh]);meshes.add(node.mesh);
      for(const primitive of gltf.meshes[node.mesh].primitives){
        assert.equal(primitive.mode??4,4);assert.ok(gltf.materials[primitive.material]);
        const positions=accessor(primitive.attributes.POSITION);assert.equal(positions.a.type,"VEC3");assert.equal(positions.a.componentType,5126);
        let count=positions.a.count;
        if(primitive.indices!==undefined){const indices=accessor(primitive.indices);assert.equal(indices.a.type,"SCALAR");assert.ok([5121,5123,5125].includes(indices.a.componentType));count=indices.a.count;for(let i=0;i<count;i++)assert.ok(indices.read(i)[0]<positions.a.count,name+" valid vertex indices")}
        assert.equal(count%3,0);triangles+=count/3;primitives++;
        for(let i=0;i<positions.a.count;i++){
          const [x,y,z]=positions.read(i);assert.ok([x,y,z].every(Number.isFinite));
          for(let axis=0;axis<3;axis++){const value=matrix[axis]*x+matrix[axis+4]*y+matrix[axis+8]*z+matrix[axis+12];assert.ok(Number.isFinite(value));min[axis]=Math.min(min[axis],value);max[axis]=Math.max(max[axis],value)}
        }
      }
    }
    for(const child of node.children||[])visit(child,matrix);
  }
  const scene=gltf.scenes[gltf.scene??0];assert.ok(scene?.nodes?.length);for(const index of scene.nodes)visit(index,identity);
  assert.equal(meshes.size,gltf.meshes.length,name+" all shipped meshes must be reachable");
  assert.equal(triangles,record.triangles);assert.equal(primitives,record.primitives);
  assert.ok(triangles>100&&triangles<=8_000&&primitives<=10,name+" triangle/draw-call budget");
  assert.ok(Math.abs(min[1])<.002,name+" grounded Y-up geometry");
  assert.ok(Math.abs(min[0]+max[0])<.002&&Math.abs(min[2]+max[2])<.002,name+" centered horizontal pivot");
  const dimensions=max.map((value,axis)=>value-min[axis]);
  dimensions.forEach((value,axis)=>assert.ok(value>.05&&value<20&&Math.abs(value-record.dimensions_xyz[axis])<.002,name+" transformed dimensions match manifest"));
  if(["streetlamp","bollard","pfand-bottle","deciduous-tree"].includes(name))assert.ok(dimensions[1]>Math.max(dimensions[0],dimensions[2]),name+" upright proportions");
  totalBytes+=file.length;totalTriangles+=triangles;
}
assert.equal(totalBytes,manifest.total_glb_bytes);assert.ok(totalBytes<2_000_000&&totalTriangles<32_000,"bounded complete kit");

// Execute the renderer's actual cache, installation and fading paths without a GPU.
const renderer=readFileSync(new URL("../world3d.js",import.meta.url),"utf8");
function rendererFunction(name){
  const start=renderer.search(new RegExp("(?:async )?function "+name+"\\(")),end=renderer.indexOf("\n  }",start);
  assert.ok(start>=0&&end>start,"renderer function "+name+" exists");return renderer.slice(start,end+4);
}
function material(opacity=1,transparent=false,depthWrite=true){return {opacity,transparent,depthWrite,userData:{},clone(){return material(this.opacity,this.transparent,this.depthWrite)}}}
const stone=material(),glass=material(.42,true,false),sources=[{material:[stone,glass]},{material:stone}];let clones=0,requests=0;
const vector=()=>({set(x,y,z){Object.assign(this,{x,y,z})}});
const source={traverse(fn){sources.forEach(fn)},clone(deep){assert.equal(deep,true);clones++;const nodes=sources.map(node=>({material:Array.isArray(node.material)?[...node.material]:node.material}));return {nodes,scale:vector(),position:vector(),traverse(fn){nodes.forEach(fn)}}}};
const warnings=[],buildingSlots=[],context={
  S:.02,bridge:{player:{x:9999,y:9999}},buildingSlots,localModels:new Map(),console:{warn:(...args)=>warnings.push(args)},
  modelLoader:{loadAsync(url){requests++;return url==="missing.glb"?Promise.reject(new Error("missing")):Promise.resolve({scene:source})}},
  T:{Vector3:class{},Box3:class{min={y:0};setFromObject(){return this}getSize(){return{x:12,y:6,z:8}}getCenter(){return{x:0,y:3,z:0}}}}
};
vm.createContext(context);vm.runInContext(["loadLocalModel","registerMaterials","installBuildingModel","updateBuildingOcclusion"].map(rendererFunction).join("\n"),context);
const first=context.loadLocalModel("office.glb"),second=context.loadLocalModel("office.glb");assert.equal(first,second,"concurrent requests must share one source promise");await first;assert.equal(requests,1);
function slot(id,x){return {building:{id,x,y:100,w:100,h:100},group:{children:[],add(model){this.children.push(model)}},fallback:{visible:true},model:null,materials:new Set(),opacity:1}}
const a=slot("office-a",0),b=slot("office-b",2000);buildingSlots.push(a,b);
await Promise.all([a,b].map(item=>context.installBuildingModel(item,"office.glb",12,6,8)));
assert.equal(requests,1);assert.equal(clones,2);assert.ok(a.model&&b.model&&a.model!==b.model);assert.equal(a.fallback.visible,false);assert.equal(b.fallback.visible,false);
const [aStone,aGlass]=a.model.nodes[0].material,[bStone,bGlass]=b.model.nodes[0].material;
assert.equal(a.materials.size,2);assert.equal(a.model.nodes[1].material,aStone,"one instance shares its repeated material");
assert.notEqual(aStone,bStone);assert.notEqual(aGlass,bGlass);assert.notEqual(aGlass,glass);assert.equal(glass.userData.baseOpacity,undefined,"source material must remain untouched");
context.updateBuildingOcclusion();assert.equal(aGlass.opacity,.42);assert.equal(aGlass.transparent,true);assert.equal(aGlass.depthWrite,false);
Object.assign(context.bridge.player,{x:50,y:50});for(let i=0;i<30;i++)context.updateBuildingOcclusion();
assert.ok(a.opacity<.3);assert.equal(aGlass.opacity,a.opacity*.42);assert.equal(aStone.opacity,a.opacity);assert.equal(aStone.transparent,true);assert.equal(aStone.depthWrite,false);assert.equal(bGlass.opacity,.42,"fading one building must not fade its sibling");
Object.assign(context.bridge.player,{x:9999,y:9999});for(let i=0;i<180;i++)context.updateBuildingOcclusion();
assert.ok(Math.abs(aGlass.opacity-.42)<1e-10);assert.equal(aGlass.transparent,true);assert.equal(aGlass.depthWrite,false);assert.equal(aStone.transparent,false);assert.equal(aStone.depthWrite,true);assert.equal(glass.opacity,.42);
const missing=slot("missing",0);await context.installBuildingModel(missing,"missing.glb",12,6,8);await context.installBuildingModel(missing,"missing.glb",12,6,8);
assert.equal(missing.model,null);assert.equal(missing.fallback.visible,true);assert.equal(requests,2,"failed source requests must also be bounded");assert.equal(warnings.length,1);
console.log(`City kit: ${expected.length} valid local models, ${totalTriangles.toLocaleString()} triangles, ${totalBytes.toLocaleString()} bytes; cached instance loading, fallback and glass fading pass`);
