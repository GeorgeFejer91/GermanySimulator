import test from 'node:test';
import assert from 'node:assert/strict';
import {layout} from '../assets/models/berghain/layout.mjs';
import {surfaceFamilies} from '../assets/models/berghain/surface-data.mjs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createClimberGeometries} from '../assets/models/berghain/climber-geometry.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';

test('the sourced Uddenberg figure is modelled on the Panorama counter with explicit uncertainty',()=>{
  const artwork=layout.artworks?.find(item=>item.id==='uddenberg-climber');
  assert.ok(artwork,'Recreate the documented artwork, not a generic visitor or a named placeholder');
  assert.equal(artwork.artist,'Anna Uddenberg');
  assert.equal(artwork.title,'CLIMBER (Angel Kiss)');
  assert.equal(artwork.room,'panorama');
  assert.deepEqual(artwork.publishedDimensionsCm,[160,130,110]);
  assert.match(artwork.confidence,/inferred/i);
  assert.ok(artwork.sources.includes('ART02')&&artwork.sources.includes('ART03'));
  assert.ok(layout.parts.filter(part=>part.artwork===artwork.id).length>=6);
});

test('artwork geometry has smooth finite normals and stays within its actual transformed segment collision bounds',()=>{
  const geometries=createClimberGeometries(),bounds=new THREE.Box3(),point=new THREE.Vector3();
  const solids=layout.solids.filter(item=>item.artwork==='uddenberg-climber');
  const counter=layout.solids.filter(s=>s.name==='panorama-bar dark worktop'||s.name==='panorama-bar cabinet');
  try{
    for(const part of layout.parts.filter(item=>item.artwork==='uddenberg-climber')){
      const geometry=geometries[part.shape],position=geometry.attributes.position,normal=geometry.attributes.normal;
      assert.ok(geometry.index&&position.count<geometry.index.count,'Reuse indexed vertices in the portable model');
      assert.ok(Array.from(position.array).every(Number.isFinite));
      const matrix=new THREE.Matrix4().fromArray(part.matrix);
      for(let i=0;i<position.count;i++){
        assert.ok(Math.abs(new THREE.Vector3().fromBufferAttribute(normal,i).length()-1)<.0001);
        point.fromBufferAttribute(position,i).applyMatrix4(matrix);bounds.expandByPoint(point);
        assert.ok(solids.some(s=>point.x>=s.x[0]-.00002&&point.x<=s.x[1]+.00002&&point.y>=s.y[0]-.00002&&point.y<=s.y[1]+.00002&&point.z>=s.z[0]-.00002&&point.z<=s.z[1]+.00002));
        assert.ok(!counter.some(s=>point.x>s.x[0]+.002&&point.x<s.x[1]-.002&&point.y>s.y[0]+.002&&point.y<s.y[1]-.002&&point.z>s.z[0]+.002&&point.z<s.z[1]-.002),'Visible sculpture vertices must not penetrate its counter');
      }
    }
    const size=bounds.getSize(new THREE.Vector3());
    assert.ok(size.y>1.5&&size.y<1.7&&size.x<1.7&&size.z<1.3,'An adult-scale bent figure, not an enlarged visitor');
    assert.ok(Math.abs(bounds.min.y-layout.artworks[0].anchor[1])<.015,'The hanging boot rests on the floor');
  }finally{for(const geometry of Object.values(geometries))geometry.dispose();}
});

test('isolated hanging-boot collision stops the whole visitor and the actual outer bar aisle stays traversable',()=>{
  const boot=layout.solids.find(item=>item.name==='uddenberg-climber hanging-shoe');
  const isolated={...layout,solids:layout.solids.filter(item=>item.artwork==='uddenberg-climber')};
  const start={x:boot.x[1]+.7,y:layout.artworks[0].anchor[1],z:(boot.z[0]+boot.z[1])/2};
  assert.ok(canStand(start,isolated));
  const blocked=moveVisitor(start,{x:-1.5,z:0},isolated);
  assert.ok(canStand(blocked,isolated));assert.ok(blocked.x>=boot.x[1]+.279);
  const bar=layout.fixtures.find(item=>item.id==='panorama-bar');
  const side={x:bar.anchor[0]+2.8,y:bar.anchor[1],z:bar.anchor[2]+.75};
  assert.ok(canStand(side,layout));
  const advanced=moveVisitor(side,{x:0,z:1},layout);
  assert.ok(canStand(advanced,layout)&&advanced.z>side.z+.95,'The visitor can pass beside the sculpture');
});

test('garment microtexture is an original small-scale fabric family rather than a copied artwork photograph',()=>{
  assert.ok(surfaceFamilies.fabric,'Original cloth microstructure is required for the garment surfaces');
  assert.ok(surfaceFamilies.fabric.metresPerTile<=.1);
  for(const kind of ['baseColor','normal','roughness'])assert.match(surfaceFamilies.fabric[kind],/^textures\/fabric-/);
});

test('the artwork uses the actual authored counter and excludes unverified studio furniture',()=>{
  const artwork=layout.artworks?.find(item=>item.id==='uddenberg-climber');
  assert.ok(artwork,'A figure placement tied to the existing counter is required');
  assert.equal(artwork.support,'panorama-bar');
  assert.ok(layout.fixtures.some(item=>item.id===artwork.support));
  assert.ok(!layout.parts.some(part=>part.artwork===artwork.id&&/barrel|studio table|studio stool/i.test(part.name)));
  assert.ok(layout.solids.some(solid=>solid.artwork===artwork.id),'The hanging boot and figure need full-body collision');
});
