import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {layout,materials} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {groundSanitaryAt} from '../assets/models/berghain/ground-sanitary.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
const site=(x,z,y=.05)=>studyToSite({x,y,z});

test('ground quiet WC is a distinct provisional level without a guessed FLINTA assignment',()=>{
  const room=layout.groundSanitary;
  assert.equal(room.floorHeight,.05);assert.equal(layout.kloBar.floorHeight,5.45);
  assert.equal(layout.interiorTopology.panoramaToilets.floorHeight,9.05);
  assert.match(room.confidence,/estimated/);assert.match(room.flintaLocation,/Unassigned/);
  assert.equal(room.stalls.length,3);assert.equal(groundSanitaryAt(room.arrival.position),true);
  assert.equal(groundSanitaryAt({...room.arrival.position,y:5.45}),false);
  assert.equal(groundSanitaryAt(site(-9.5,19.6)),false);
});
test('public cloakroom-end corridor, east doorway, all three stalls and wash return fit the full body',()=>{
  const room=layout.groundSanitary,route=[...room.route];
  for(const stall of room.stalls){
    const [x,,z]=stall.authorCenter;route.push(site(x,20.6),site(x,z),site(x,20.6));
  }
  route.push(site(-13.2,20.6),site(-13.2,19.6),site(-11.8,19.95),site(-13.2,19.6),site(-13.2,20.6),...room.route.toReversed());
  let p={...route[0]};assert.ok(canStand(p,layout));
  for(const t of route.slice(1)){
    const steps=Math.ceil(Math.hypot(t.x-p.x,t.z-p.z)/.045),dx=(t.x-p.x)/steps,dz=(t.z-p.z)/steps;
    for(let i=0;i<steps;i++){p=moveVisitor(p,{x:dx,z:dz},layout);assert.ok(canStand(p,layout));}
    assert.ok(Math.hypot(p.x-t.x,p.z-t.z)<.025,JSON.stringify({p,t}));
    assert.ok(Math.abs(p.y-.05)<1e-7);
  }
});
test('room envelope is supported by the existing slab, blocks its walls and fits beneath its ceiling',()=>{
  assert.equal(canStand(site(-15,18.3),layout),false);
  assert.equal(canStand(site(-15,21.3),layout),false);
  assert.equal(canStand(site(-21.3,20.6),layout),false);
  assert.equal(canStand(site(-10.3,20.95),layout),false);
  assert.ok(layout.groundSanitary.ceilingUnderside-.05>1.8);
  assert.ok(canStand(layout.groundSanitary.arrival.position,layout));
  for(const p of layout.parts.filter(p=>p.groundSanitary)){
    assert.ok(p.matrix.every(Number.isFinite));assert.ok(materials[p.material]);assert.equal(p.instanceTone,.94);
    const s=layout.solids.find(s=>s.renderPart===p);if(!s)continue;
    assert.ok(Math.abs(s.y[0]-(p.center[1]-p.size[1]/2))<1e-8);assert.ok(Math.abs(s.y[1]-(p.center[1]+p.size[1]/2))<1e-8);
  }
});
test('adding the wing changes no existing admission, cloakroom, Lab or other original parts and floors',async()=>{
  const url=new URL('../assets/models/berghain/layout.mjs',import.meta.url);
  const source=readFileSync(url,'utf8').replace('addGroundSanitary(layout);','')
    .replace(/from '(\.[^']+)'/g,(_,path)=>`from '${new URL(path,url).href}'`);
  const baseline=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).layout;
  assert.deepEqual(layout.parts.filter(p=>!p.groundSanitary),baseline.parts);
  assert.deepEqual(layout.floors,baseline.floors);
  assert.deepEqual(layout.admission,baseline.admission);assert.deepEqual(layout.labOratory,baseline.labOratory);
});
