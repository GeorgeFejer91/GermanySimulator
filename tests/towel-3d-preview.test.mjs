import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {test} from 'node:test';
import {strict as assert} from 'node:assert';

function inspect(kind){
  const file=readFileSync(join('assets','models','towel-pedestrians',`${kind}.glb`));
  assert.equal(file.readUInt32LE(0),0x46546c67);
  const jsonSize=file.readUInt32LE(12);
  const gltf=JSON.parse(file.subarray(20,20+jsonSize).toString());
  const binary=20+jsonSize+8;
  const values=index=>{
    const accessor=gltf.accessors[index],view=gltf.bufferViews[accessor.bufferView];
    assert.equal(accessor.componentType,5126);
    const count=accessor.count*({SCALAR:1,VEC3:3,VEC4:4}[accessor.type]);
    return Array.from({length:count},(_,i)=>file.readFloatLE(binary+(view.byteOffset||0)+(accessor.byteOffset||0)+4*i));
  };
  return {gltf,values};
}

for(const kind of ['man','woman'])test(`${kind} has one complete, closed walk with its defining clothes and props`,()=>{
  const {gltf,values}=inspect(kind);
  assert.ok(gltf.meshes.length>60);
  assert.equal(gltf.animations.length,1);
  const animation=gltf.animations[0];
  assert.equal(animation.name,'Walk');
  assert.ok(animation.channels.length>=50);
  const names=gltf.nodes.map(node=>node.name);
  for(const part of ['Foot.L','Foot.R','Rolled reservation towel','Polo torso','Calf sock L','Calf sock R','Sandal sole L','Sandal sole R'])assert.ok(names.includes(part),part);
  assert.ok(names.includes(kind==='man'?'Straw brim':'Sun cap crown'));
  for(const sampler of animation.samplers){
    const times=values(sampler.input),frames=values(sampler.output);
    assert.equal(times.length,33);
    assert.ok(Math.abs(times.at(-1)-32/26)<.001);
    const size=gltf.accessors[sampler.output].type==='VEC4'?4:3;
    const stride=sampler.interpolation==='CUBICSPLINE'?3:1;
    for(let axis=0;axis<size;axis++){
      const first=frames[(stride===3?size:0)+axis];
      const last=frames[(32*stride+(stride===3?1:0))*size+axis];
      assert.ok(Math.abs(first-last)<.001,`open ${kind} ${sampler.interpolation} channel`);
    }
  }
});
