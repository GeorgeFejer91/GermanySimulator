import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {panoramaStudyPoint} from '../assets/models/berghain/panorama-registration.mjs';
import {adjacentPanoramaPoint} from '../assets/models/berghain/panorama-section.mjs';
const studyToSite=({x,y,z})=>Object.fromEntries(adjacentPanoramaPoint(panoramaStudyPoint([x,y,z])).map((v,i)=>[['x','y','z'][i],v]));
import {panoramaSanitaryAt} from '../assets/models/berghain/interior-topology.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import {createBerghainModel,disposeBerghainModel} from '../assets/models/berghain/model.mjs';

test('ordinary Panorama WC stays within its own bounded geometry budget',()=>{
  const model=createBerghainModel(),counts=new Map();
  try{
    for(const p of layout.parts.filter(p=>p.name.startsWith('Panorama WC ')||p.name.startsWith('panorama-wc-'))){
      const key=[p.section,p.material,p.shape].join('/');counts.set(key,(counts.get(key)||0)+1);
    }
    let triangles=0;for(const [key,count]of counts){
      const mesh=model.getObjectByName(key);assert.ok(mesh,key);
      triangles+=(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3*count;
    }
    assert.ok(triangles<=5000,'Ordinary WC exceeds its5,000-triangle budget: '+triangles);
    assert.ok(counts.size<=5,'Reuse existing shared shapes/materials');
  }finally{disposeBerghainModel(model);}
});

test('Panorama sanitary area is distinct from main-floor Klo and below upper lounge',()=>{
  const area=layout.interiorTopology.panoramaToilets;
  assert.equal(area.floorHeight,9.05);
  assert.equal(layout.kloBar.floorHeight,5.45);
  assert.ok(area.floorHeight+2.7<layout.upperLounge.floorHeight);
  assert.match(area.placement,/estimated/);
  assert.match(area.photoAssignment,/unresolved/);
  assert.equal(layout.fixtures.filter(f=>f.id.startsWith('panorama-wc-pan-')).length,8);
  assert.equal(panoramaSanitaryAt(studyToSite({x:-15,y:13.25,z:1})),true);
  assert.equal(panoramaSanitaryAt(studyToSite({x:-15,y:5.45,z:1})),false);
});

test('walk from Panorama through separate WC entrance into each cubicle and return',()=>{
  let position={...viewpoints.panorama.position};
  // Independent route through front/right, rear/right and left groups.
  // These are estimated metric samples; dated accounts establish topology.
  const cubicles=[[-15.5,1]];
  for(const x of [-13.85,-15.05,-16.25,-17.9,-19.1,-20.3])
    cubicles.push([x,1],[x,-1.6],[x,1]);
  for(const x of [-18.5,-20.1])cubicles.push([x,1],[x,2.75],[x,1]);
  cubicles.push([-15.5,1]);
  const approach=layout.panoramaRegistration.toiletRoute.slice(0,-1);
  const route=[...approach,...cubicles.map(([x,z])=>studyToSite({x,y:13.25,z})),...approach.toReversed()];
  for(const target of route){
    for(let i=0;i<160;i++){
      position=moveVisitor(position,{x:(target.x-position.x)/(160-i),z:(target.z-position.z)/(160-i)},layout);
      assert.ok(canStand(position,layout),'full body clearance');
      assert.equal(position.y,9.05,'same floor without teleport');
    }
    assert.ok(Math.hypot(position.x-target.x,position.z-target.z)<.05,JSON.stringify({target,position}));
  }
});

test('new enclosure is solid, exported and does not silently invent private routes',()=>{
  for(const p of layout.parts.filter(p=>p.name.startsWith('Panorama WC '))){
    assert.ok(p.matrix?.every(Number.isFinite),p.name);
    assert.ok(layout.solids.some(s=>s.renderPart===p),p.name);
  }
  for(const point of [{x:-13,y:13.25,z:-2},{x:-17,y:13.25,z:-3.5}])
    assert.equal(canStand(studyToSite(point),layout),false);
  assert.equal(layout.interiorTopology.backstage.status,'Unmodelled');
  assert.match(layout.interiorTopology.smoking.reason,/return stair/);
});

test('an invalid start inside the Panorama trough recovers past its complete rim',()=>{
  const start=studyToSite({x:-15.2,y:13.25,z:4.35});
  assert.equal(canStand(start,layout),false);
  const recovered=moveVisitor(start,{x:0,z:0},layout);
  assert.equal(canStand(recovered,layout),true);
  assert.equal(recovered.y,start.y);
  assert.ok(Math.hypot(recovered.x-start.x,recovered.z-start.z)<1,'local recovery');
});

test('the historical pre-ground sanitary additions preserve retained batch tones including Halle retirement',async()=>{
  const url=new URL('../assets/models/berghain/layout.mjs',import.meta.url);
  const preGround=readFileSync(url,'utf8').replace('registerGround(layout,viewpoints);','')
    .replace(/from '(\.[^']+)'/g,(_,path)=>`from '${new URL(path,url).href}'`);
  const {layout}=await import('data:text/javascript;base64,'+Buffer.from(preGround).toString('base64'));
  // Independent baseline: remove additions before the original Halle retirement
  // and let the renderer's previous group-count/index formula run unchanged.
  const source=readFileSync(url,'utf8')
    .replace('pinInteriorTopologyTones(layout);',`layout.parts=layout.parts.filter(p=>!p.interiorTopology);
      {const groups=new Map();for(const p of layout.parts){const k=[p.section,p.material==='mainBarPlaster'?'pale':p.material,p.shape].join('/');if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);}for(const parts of groups.values())parts.forEach((p,i)=>p.instanceTone??=.84+((i*193+parts.length*37)%101)/625);}`)
    .replace('registerMainHall(layout,viewpoints);','').replace('addArchitecturalCirculation(layout);','')
    .replace('addMainHallDetails(layout);','').replace('fitMainHallRoofFrame(layout);','')
    .replace('addGroundSanitary(layout);','').replace('registerGround(layout,viewpoints);','')
    .replace(/from '(\.[^']+)'/g,(_,path)=>`from '${new URL(path,url).href}'`);
  const baseline=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).layout;
  const groups=new Map(),expected=new Map();
  for(const p of baseline.parts){
    const key=[p.section,p.material==='mainBarPlaster'?'pale':p.material,p.shape].join('/');
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);
  }
  for(const parts of groups.values())parts.forEach((p,index)=>expected.set(p,
    p.instanceTone??(.84+((index*193+parts.length*37)%101)/625)));
  const key=p=>JSON.stringify([p.name,p.matrix,p.start,p.end,p.material,p.shape]);
  const originalByKey=new Map();
  for(const p of baseline.parts){const k=key(p);if(!originalByKey.has(k))originalByKey.set(k,[]);originalByKey.get(k).push(p);}
  const retained=layout.parts.filter(p=>!p.djBay&&!p.groundFit&&!p.hallRoofFrame&&!p.mainHallRegistered&&!p.hallSection&&!p.hallSectionChanged&&!p.interiorTopology&&!p.architecturalCirculation&&!p.mainHallDetail&&!p.groundSanitary&&!p.panoramaConnection&&!p.circulationDoorway&&!p.name.endsWith('smoking doorway trim'));
  assert.ok(retained.length>10000,'Retirement must leave the unrelated original model intact');
  retained.forEach(p=>{
    const original=originalByKey.get(key(p))?.shift();
    assert.ok(original,'Retained original geometry exists: '+p.name);
    assert.equal(p.instanceTone,expected.get(original),p.name+' / '+p.material);
  });
  for(const material of ['darkConcrete','rubber','steel'])
    assert.ok(retained.some(p=>p.material===material),material+' exercised');
  // The stainless fittings now belong to the registered Klo/hall assembly.
  // Compare their named tone inventory independently of the intentional move.
  const tones=parts=>parts.filter(p=>p.material==='stainless').map(p=>JSON.stringify([p.name,p.shape,p.instanceTone??expected.get(p)])).sort();
  const stainless=layout.parts.filter(p=>p.material==='stainless'&&!p.interiorTopology&&!p.architecturalCirculation&&!p.groundSanitary);
  assert.ok(stainless.length>0);assert.deepEqual(tones(stainless),tones(baseline.parts));
  const added=layout.parts.filter(p=>p.interiorTopology);
  assert.ok(added.length>0);
  assert.ok(added.every(p=>p.instanceTone===.94));
});
