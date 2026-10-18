import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as T from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createBillboardGroundProjector} from '../billboard-ground.js';

test('painted feet project to pavement without changing their camera silhouette',()=>{
 const project=createBillboardGroundProjector(T),camera=new T.PerspectiveCamera(48,1.6,.1,150);
 camera.position.set(0,11.5,14);camera.lookAt(0,1,-2.7);camera.updateMatrixWorld();
 const geometry=new T.PlaneGeometry(1.47,2.35,1,32),mesh=new T.Mesh(geometry);
 mesh.quaternion.copy(camera.quaternion);mesh.position.set(0,0,0).add(new T.Vector3(0,.97,0).applyQuaternion(mesh.quaternion));mesh.updateMatrixWorld(true);
 const source=Float32Array.from(geometry.attributes.position.array),before=[];
 for(let i=0;i<geometry.attributes.position.count;i++)before.push(new T.Vector3().fromArray(source,i*3).applyMatrix4(mesh.matrixWorld));
 assert(before.some(point=>point.y<0),'fixture contains painted depth below the old flat pivot');
 project(mesh,camera,.012);
 for(let i=0;i<geometry.attributes.position.count;i++){
  const actual=new T.Vector3().fromBufferAttribute(geometry.attributes.position,i).applyMatrix4(mesh.matrixWorld);
  assert(actual.y>=.012-1e-6,'no projected geometry lies beneath pavement');
  const expected=before[i].clone().project(camera),screen=actual.clone().project(camera);
  assert(Math.hypot(screen.x-expected.x,screen.y-expected.y)<1e-6,'projection follows the same camera ray');
 }
 const once=Float32Array.from(geometry.attributes.position.array);project(mesh,camera,.012);
 assert.deepEqual(geometry.attributes.position.array,once,'successive frames do not accumulate deformation');
 mesh.position.y+=3;project(mesh,camera,.012);
 assert.deepEqual(geometry.attributes.position.array,source,'clear elevated geometry restores exact source vertices');
 geometry.dispose();mesh.material.dispose();
});
