import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';
import {canStand} from '../berghain/navigation.mjs';
import {readFileSync} from 'node:fs';

test('the anatomical cast basis is a closed consistently wound surface, with explicit generic-data provenance',async()=>{
  const {anatomyIndices,anatomyPoses}=await import('../assets/models/berghain/together-anatomy.mjs');
  const edges=new Map();
  for(let i=0;i<anatomyIndices.length;i+=3){
    const triangle=Array.from(anatomyIndices.subarray(i,i+3));
    for(let j=0;j<3;j++){
      const a=triangle[j],b=triangle[(j+1)%3],key=[Math.min(a,b),Math.max(a,b)].join('/');
      const edge=edges.get(key)||{count:0,balance:0};edge.count++;edge.balance+=a<b?1:-1;edges.set(key,edge);
    }
  }
  assert.ok([...edges.values()].every(e=>e.count===2&&e.balance===0),'Transmission casts cannot have open anatomical cuts or reversed closure caps');
  for(const pose of anatomyPoses){
    assert.ok(pose.every(Number.isFinite));assert.ok(Math.max(...anatomyIndices)<pose.length/3);
  }
  const art=layout.artworks.find(a=>a.id==='marr-together');
  assert.equal(art.anatomicalBase.license,'CC0-1.0');assert.match(art.anatomicalBase.reconstruction,/not scans/);
});

test('Together is a sourced nine-metre relief reconstruction within the actual Klo cases',()=>{
  const art=layout.artworks.find(a=>a.id==='marr-together');
  assert.ok(art,'The empty Klo cases still lack Joseph Marr’s figurative frieze');
  assert.equal(art.artist,'Joseph Marr');assert.equal(art.title,'Together');assert.equal(art.year,2013);
  assert.equal(art.publishedLengthMetres,9);assert.ok(art.sources.includes('ART04')&&art.sources.includes('ART14'));
  assert.match(art.confidence,/inferred/);
  assert.ok(Math.abs(art.segments.reduce((sum,s)=>sum+s.length,0)-9)<.001);
  assert.ok(art.features.heads>=6&&art.features.hands>=12&&art.features.fingerChains>=60,'Actual anatomical features, not visitor surrogates');
});

test('all actual sculpture vertices remain below the glass lids and within protected case interiors',async()=>{
  const art=layout.artworks.find(a=>a.id==='marr-together');assert.ok(art);
  const {createTogetherGeometries}=await import('../assets/models/berghain/together-geometry.mjs');
  const geometries=createTogetherGeometries(),point=new THREE.Vector3();
  try{
    for(const part of layout.parts.filter(p=>p.artwork===art.id)){
      const geometry=geometries[part.shape],position=geometry.attributes.position,normal=geometry.attributes.normal;
      assert.ok(geometry.index&&position.count>1000,'Detailed indexed figure surface');
      const matrix=new THREE.Matrix4().fromArray(part.matrix),box=part.displayBounds;
      for(let i=0;i<position.count;i++){
        point.fromBufferAttribute(position,i).applyMatrix4(matrix);
        assert.ok(point.toArray().every(Number.isFinite));
        assert.ok(Math.abs(new THREE.Vector3().fromBufferAttribute(normal,i).length()-1)<.001);
        assert.ok(point.x>=box.min[0]-.00002&&point.x<=box.max[0]+.00002&&point.y>=box.min[1]-.00002&&point.y<=box.max[1]+.00002&&point.z>=box.min[2]-.00002&&point.z<=box.max[2]+.00002,'Sculpture must not penetrate its glass');
      }
    }
  }finally{for(const g of Object.values(geometries))g.dispose();}
});

test('the amber surface uses physical transmission and the complete sculpture remains behind the bar body barrier',()=>{
  const model=createBerghainModel();
  try{
    const meshes=[];model.traverse(m=>{if(m.isMesh&&m.name.includes('together-'))meshes.push(m);});
    assert.ok(meshes.length,'Actual sculpture meshes exist');
    for(const mesh of meshes){assert.ok(mesh.material.isMeshPhysicalMaterial&&mesh.material.transmission>.3);assert.ok(mesh.material.thickness>0&&mesh.material.attenuationDistance>0);}
    const bar=layout.fixtures.find(f=>f.id==='klo-switchgear-bar');
    assert.equal(canStand({x:bar.anchor[0],y:bar.anchor[1],z:bar.anchor[2]},layout),false);
  }finally{disposeBerghainModel(model);}
});

test('portable GLB preserves the sugar optical material using supported glTF extensions',()=>{
  const bytes=readFileSync(new URL('../assets/models/berghain/berghain-study.glb',import.meta.url));
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString().trim());
  for(const name of ['KHR_materials_transmission','KHR_materials_volume','KHR_materials_ior'])
    assert.ok(gltf.extensionsUsed?.includes(name),name+' is needed for actual amber, not opaque fallback');
  const amber=gltf.materials.filter(m=>m.name.includes('together-'));
  const displayGlass=gltf.materials.filter(m=>m.name.includes('/kloDisplayGlass/'));
  assert.ok(displayGlass.length>0);assert.ok(displayGlass.every(m=>!m.doubleSided),'Portable glass must preserve authored front-face rendering rather than adding a second tint');
  assert.equal(amber.length,4);
  for(const m of amber){
    assert.ok(m.extensions.KHR_materials_transmission.transmissionFactor>.3);
    assert.ok(m.extensions.KHR_materials_volume.thicknessFactor>0);
    assert.ok(m.extensions.KHR_materials_volume.attenuationColor.every(Number.isFinite));
    assert.ok(m.extensions.KHR_materials_ior.ior>1);
    assert.equal(m.extensions.KHR_materials_volume.thicknessTexture.texCoord,1);
    assert.ok(m.extensions.KHR_materials_clearcoat.clearcoatNormalTexture);
  }
  for(const mesh of gltf.meshes.filter(m=>m.name.includes('together-'))){
    const p=mesh.primitives[0],uv=gltf.accessors[p.attributes.TEXCOORD_1];
    assert.equal(uv.type,'VEC2');assert.equal(uv.count,gltf.accessors[p.attributes.POSITION].count);
  }
});
