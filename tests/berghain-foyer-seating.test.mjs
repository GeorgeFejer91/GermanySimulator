import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';

const seats=layout.fixtures.filter(f=>f.id.startsWith('foyer-channel-seat-'));
const bounds=p=>new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)).applyMatrix4(new THREE.Matrix4().fromArray(p.matrix));

test('Karhard foyer seats read as individual armchairs with one recessed seat and back pad',()=>{
  assert.equal(seats.length,2,'retain the existing estimated inventory');
  for(const f of seats){
    const parts=layout.parts.filter(p=>p.fixture===f.id),box=new THREE.Box3();
    parts.forEach(p=>box.union(bounds(p)));
    const size=box.getSize(new THREE.Vector3());
    assert.ok(size.x<1.4&&size.x>1&&size.z>1&&size.z<1.3,'compact single-seat shell, not a long sofa');
    assert.equal(parts.filter(p=>p.name.endsWith('seat cushion')).length,1);
    assert.equal(parts.filter(p=>p.name.endsWith('back cushion')).length,1);
    assert.ok(Math.abs(box.min.y-f.anchor[1])<1e-7,'concrete shell rests on its floor');
    const pad=bounds(parts.find(p=>p.name.endsWith('seat cushion')));
    assert.ok(pad.max.x<box.max.x-.1&&pad.min.x>box.min.x+.1,'seat recessed between thick concrete arms');
    assert.ok(pad.max.y-f.anchor[1]>.4&&pad.max.y-f.anchor[1]<.5,'seated human scale');
    assert.ok(box.max.y-pad.max.y>.35,'high concrete arms/back visible in G02/G03');
    assert.match(f.confidence,/placement.*inferred/i);
    assert.ok(f.sources.includes('I09'));
  }
});

test('chair shells stop a walking body on every side at ordinary and delayed frame sizes',()=>{
  for(const f of seats)for(const dt of [1/60,1/30,.1])for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){
    const [x,y,z]=f.anchor;
    let p={x:x+dx*1.8,y,z:z+dz*1.8};assert.ok(canStand(p,layout));
    for(let t=0;t<1;t+=dt){
      p=moveVisitor(p,{x:-dx*3*dt,z:-dz*3*dt},layout);
      assert.ok(canStand(p,layout),'every accepted step has body clearance');
      assert.ok((p.x-x)*dx+(p.z-z)*dz>.7,'cannot tunnel through the compact chair');
    }
  }
});

test('chair perimeter permits corner recovery and continuous circulation',()=>{
  for(const f of seats){
    const [x,y,z]=f.anchor;
    let p={x:x-1.35,y,z:z-1.35};
    for(const target of [[x+1.35,z-1.35],[x+1.35,z+1.35],[x-1.35,z+1.35],[x-1.35,z-1.35]]){
      for(let i=0;i<50;i++){
        const dx=target[0]-p.x,dz=target[1]-p.z,length=Math.hypot(dx,dz);if(length<.02)break;
        const step=Math.min(.12,length);p=moveVisitor(p,{x:dx/length*step,z:dz/length*step},layout);
        assert.ok(canStand(p,layout));
      }
      assert.ok(Math.hypot(p.x-target[0],p.z-target[1])<.03,'full visitor body can pass every corner');
    }
  }
});
