import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {layout} from '../assets/models/berghain/layout.mjs';
import {createSpeakerGeometries} from '../assets/models/berghain/speaker-geometries.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';

test('Panorama has a separate dated four-point PA rather than two hidden tower proxies',()=>{
  const pa=layout.soundSystem.panorama;
  assert.ok(pa,'Separate Panorama system metadata');
  assert.equal(pa.hangs.length,4);
  assert.equal(pa.components.filter(c=>c.type==='s26510l').length,16);
  assert.match(pa.confidence,/inferred|unverified/i);
  assert.ok(pa.sources.includes('S12')&&pa.sources.includes('S14'));
  assert.ok(!layout.parts.some(p=>p.name==='Panorama speaker'));
  assert.ok(!layout.solids.some(p=>p.name==='Panorama speaker'));
  assert.equal(layout.soundSystem.components.length,44,'Main PA remains separate');
});

test('Studt form studies retain product envelopes, wedge sides and actual perforated fronts',()=>{
  const gs=createSpeakerGeometries(),material=new THREE.MeshBasicMaterial();
  try{
    for(const [type,size]of [['s26510l',[.605,.195,.370]],['s218study',[1.18,.58,.74]]]){
      const box=new THREE.Box3(),group=new THREE.Group();
      for(const [name,g]of Object.entries(gs).filter(([n])=>n.startsWith('speaker-'+type+'-'))){
        box.union(g.boundingBox);const mesh=new THREE.Mesh(g,material);mesh.scale.set(...size);group.add(mesh);
        assert.ok(Array.from(g.attributes.position.array).every(Number.isFinite),name);
        for(let i=0;i<g.attributes.normal.count;i++)assert.ok(Math.abs(new THREE.Vector3().fromBufferAttribute(g.attributes.normal,i).length()-1)<1e-5);
      }
      group.updateMatrixWorld(true);
      const extent=box.getSize(new THREE.Vector3()).multiply(new THREE.Vector3(...size));
      for(let i=0;i<3;i++)assert.ok(Math.abs(extent.getComponent(i)-size[i])<.00002,'Independent manufacturer envelope');
      const ray=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,1),new THREE.Vector3(0,0,-1),0,2).intersectObject(group)[0];
      assert.ok(ray(0,0).distance>1-size[2]/2+.02,'Central perforation sees recessed backing');
      assert.ok(ray(size[0]/2-.005,0).distance<1-size[2]/2+.002,'Outer rim closes the cabinet');
      if(type==='s26510l'){
        const g=gs['speaker-s26510l-cabinet'],v=g.attributes.position,ys=[];
        for(let i=0;i<v.count;i++)if(v.getZ(i)<-.49)ys.push(v.getY(i)*.195);
        assert.ok(Math.max(...ys)-Math.min(...ys)<.105,'The rear is tapered rather than a tall rectangular box');
      }
    }
  }finally{material.dispose();for(const g of Object.values(gs))g.dispose();}
});

test('Panorama PA stays overhead and preserves legal dance-floor crossings',()=>{
  assert.ok(layout.soundSystem.panorama);
  for(const component of layout.soundSystem.panorama.components){
    const s=layout.solids.find(s=>s.equipment===component.id);assert.ok(s);
    assert.ok(s.y[0]>11.8,'No new low obstruction at standing eye height');
  }
  for(const z of [11,14.5,18])for(const direction of [-1,1]){
    let p={x:direction>0?-11:-3,y:9.05,z};assert.ok(canStand(p,layout));
    for(let i=0;i<80;i++){p=moveVisitor(p,{x:direction*.1,z:0},layout);assert.ok(canStand(p,layout));}
    assert.ok(Math.abs(p.x-(direction>0?-3:-11))<.02,'No ghost or added PA collider blocks the dance floor');
  }
});

test('all 22 Panorama cabinet surfaces fit their linked transformed collision envelopes',()=>{
  const gs=createSpeakerGeometries(),point=new THREE.Vector3();
  try{
    assert.equal(layout.soundSystem.panorama.components.length,22);
    for(const c of layout.soundSystem.panorama.components){
      const solid=layout.solids.find(s=>s.equipment===c.id);assert.ok(solid);
      for(const p of layout.parts.filter(p=>p.equipment===c.id)){
        const m=new THREE.Matrix4().fromArray(p.matrix),vertices=gs[p.shape].attributes.position;
        for(let i=0;i<vertices.count;i++){
          point.fromBufferAttribute(vertices,i).applyMatrix4(m);
          for(const axis of ['x','y','z'])assert.ok(point[axis]>=solid[axis][0]-.00002&&point[axis]<=solid[axis][1]+.00002,p.name+' '+axis);
        }
      }
    }
  }finally{for(const g of Object.values(gs))g.dispose();}
});

test('each flown bass cabinet contacts its lower rail and all support stages meet',()=>{
  const solids=layout.solids.filter(s=>s.equipment==='panorama-pa-support');
  const overlaps=(a,b)=>['x','y','z'].every(axis=>a[axis][0]<=b[axis][1]+1e-7&&a[axis][1]>=b[axis][0]-1e-7);
  const lower=solids.filter(s=>s.name.startsWith('panorama sub cabinet rail'));
  const upper=solids.filter(s=>s.name.startsWith('panorama sub cross rail'));
  const straps=solids.filter(s=>s.name.startsWith('panorama sub suspension strap'));
  const plates=solids.filter(s=>s.name.startsWith('panorama sub ceiling plate'));
  for(const c of layout.soundSystem.panorama.components.filter(c=>c.type==='s218study')){
    const solid=layout.solids.find(s=>s.equipment===c.id);assert.ok(lower.some(s=>overlaps(solid,s)),'No unsupported middle-column cabinet');
    const front=new THREE.Vector3(0,0,1).transformDirection(new THREE.Matrix4().fromArray(c.matrix));
    assert.ok(front.distanceTo(new THREE.Vector3(0,-1,0))<1e-8);
  }
  for(const a of lower)assert.ok(upper.some(b=>overlaps(a,b)));
  for(const a of upper)assert.ok(lower.some(b=>overlaps(a,b)));
  for(const a of straps){assert.ok(upper.some(b=>overlaps(a,b)));assert.ok(plates.some(b=>overlaps(a,b)));}
  for(const a of plates)assert.ok(Math.abs(a.y[1]-13.95)<1e-8);
});

test('the entire Panorama PA has a bounded geometry cost and retains real two-sided grille holes',()=>{
  const model=createBerghainModel(),counts=new Map();
  for(const p of layout.parts.filter(p=>p.equipment?.startsWith('panorama-'))){const key=[p.section,p.material,p.shape].join('/');counts.set(key,(counts.get(key)||0)+1);}
  let triangles=0,grilles=0,groups=0;
  try{
    model.traverse(mesh=>{
      if(!mesh.isMesh||!counts.has(mesh.name))return;
      groups++;
      const count=counts.get(mesh.name);assert.ok(count<=mesh.count);
      triangles+=(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3*count;
      if(/speaker-(s26510l|s218study)-grille$/.test(mesh.name)){
        assert.equal(mesh.material.side,THREE.DoubleSide);grilles+=count;
      }
    });
    assert.equal(grilles,22);
    assert.ok(groups<=12,'At most twelve PA material/geometry groups, including shared hardware batches');
    assert.ok(triangles>0&&triangles<=40000,'All cabinets, perforated sheets, frames, hinges, shackles and support rails share a 40000-triangle cap: '+triangles);
  }finally{disposeBerghainModel(model);}
});
