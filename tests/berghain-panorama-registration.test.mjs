import test from 'node:test';
import assert from 'node:assert/strict';
import {layout} from '../assets/models/berghain/layout.mjs';
import {panoramaStudyPoint} from '../assets/models/berghain/panorama-registration.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createViewerLighting} from '../berghain/night-lighting.mjs';
const front=p=>Object.fromEntries(panoramaStudyPoint(p).map((v,i)=>[['x','y','z'][i],v]));
function walk(route){
 let p={...route[0]};assert.ok(canStand(p,layout),'supported start '+JSON.stringify(p));
 for(const target of [...route.slice(1),...route.toReversed().slice(1)]){
  const n=Math.ceil(Math.hypot(target.x-p.x,target.z-p.z)/.025),dx=(target.x-p.x)/n,dz=(target.z-p.z)/n;
  for(let i=0;i<n;i++){p=moveVisitor(p,{x:dx,z:dz},layout);assert.ok(canStand(p,layout),'supported body');}
  assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.09,'reach '+JSON.stringify({target,p}));
  assert.ok(Math.abs(p.y-target.y)<.14,'correct level '+JSON.stringify({target,p}));
 }
}

test('Panorama faces the entrance frontage, with ordinary WC below its adjacent upper lounge',()=>{
 const floor=layout.floors.find(f=>f.name==='Panorama Bar');
 assert.ok(floor.polygon.every(p=>p[1]>7),'Panorama must occupy the entrance-facing part of the main block');
 const wc=layout.parts.filter(p=>p.name.startsWith('Panorama WC ')&&p.name.includes('enclosure'));
 assert.ok(wc.length>=4);assert.ok(wc.every(p=>p.center[2]>12),'upper WC follows the front-side lounge group');
 assert.equal(layout.interiorTopology.panoramaToilets.floorHeight,13.25);
 assert.ok(layout.upperLounge.floorHeight>13.25+2.7,'separate upper lounge over ordinary toilets');
});

test('main stair, toilet entrance and upper lounge are continuously reachable in both directions',()=>{
 walk(layout.panoramaRegistration.mainApproach);
 const approach=[front([-11,13.25,-7]),{x:-6.4,y:13.25,z:10.8},{x:-2.8,y:13.25,z:10.8},{x:-2.8,y:13.25,z:12.8}];
 walk([...approach,...[[-11.65,13.25,1],[-16,13.25,1]].map(front)]);
 walk(layout.panoramaRegistration.loungeRoute);
});

test('the bar faces across the window wall and stands opposite the DJ end',()=>{
 const top=layout.parts.find(p=>p.name==='panorama-bar dark worktop');
 const bar=layout.fixtures.find(f=>f.id==='panorama-bar');
 const dj=layout.fixtures.find(f=>f.id==='panorama-dj-table');
 assert.ok(bar.anchor[2]>10&&dj.anchor[2]>10,'both fixtures in front wing');
 assert.ok(dj.anchor[0]-bar.anchor[0]>7,'DJ and counter occupy opposing ends');
 assert.ok(Math.abs(top.matrix[8])<.02&&Math.abs(top.matrix[10])>8,'long bar perpendicular to entrance window wall');
 assert.match(layout.panoramaRegistration.confidence,/estimated/i);
});

test('Panorama reaches the smoking stair upper landing through a body-clear public doorway',()=>{
 walk([...layout.panoramaRegistration.loungeRoute.slice(0,-2),...layout.panoramaRegistration.smokingRoute]);
 walk(layout.panoramaRegistration.smokingRoute);
});

test('the upper smoking doorway is clear of every rendered facade box, including decorative sills',()=>{
 const portal=new THREE.Box3(new THREE.Vector3(18.7,13.3,7.1),new THREE.Vector3(19.4,15.03,8.35));
 const crossings=layout.parts.filter(p=>p.section==='shell'&&p.shape==='box'&&p.matrix&&
  new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5))
   .applyMatrix4(new THREE.Matrix4().fromArray(p.matrix)).intersectsBox(portal));
 assert.deepEqual(crossings.map(p=>p.name),[],'Visible details must not cross the legal body passage');
});

test('the main Panorama stair has clear lateral lanes and supported guarded landings',()=>{
 for(const dz of [-.7,.7])walk(layout.panoramaRegistration.stairRoute.slice(0,2).map(p=>({...p,z:p.z+dz})));
 for(const [name,start,delta] of [
  ['passage north',{x:12,y:13.25,z:9.2},{x:0,z:-1.4}],
  ['passage south',{x:12,y:13.25,z:9.8},{x:0,z:1.7}],
  ['lower lounge edge',{x:6.7,y:13.25,z:19},{x:1.4,z:0}]
 ]){
  const space={floors:[{x:[-100,100],z:[-100,100],y:13.25}],solids:layout.solids.filter(s=>s.name.startsWith('Panorama connection '+name))};
  assert.ok(space.solids.length&&canStand(start,space));
  const p=moveVisitor(start,delta,space);
  assert.ok(Math.hypot(p.x-start.x-delta.x,p.z-start.z-delta.z)>.3,name+' body containment independent of missing support');
 }
});

test('registered club cues illuminate their own room and stay within the existing light budget',()=>{
 const scene=new THREE.Scene(),rig=createViewerLighting(scene);
 try{
  for(const [room,p] of [['panorama',layout.panoramaRegistration.stairRoute.at(-1)],['panoramaToilets',layout.panoramaRegistration.toiletRoute.at(-1)],['lounge',layout.panoramaRegistration.loungeRoute.at(-1)],['panoramaPassage',{x:12,y:13.25,z:9.6}]]){
   rig.update('interior',p);assert.equal(rig.state.room,room);assert.equal(rig.state.daylight,false);
   assert.ok(rig.state.activeLights<=3&&rig.state.shadowMaps<=2);
   scene.traverse(light=>{if(light.isSpotLight&&light.visible){assert.ok(light.position.z>6&&light.target.position.z>6,'no abandoned rear-room cue');
    assert.ok(light.position.distanceTo(light.target.position)<light.distance,'target inside effective light range');}});
  }
 }finally{rig.dispose();}
});

test('main and lounge stairs select fixed circulation cues through their full height',()=>{
 const scene=new THREE.Scene(),rig=createViewerLighting(scene);
 try{
  for(const [room,route] of [['panoramaStair',layout.panoramaRegistration.stairRoute.slice(0,2)],['loungeStair',layout.panoramaRegistration.loungeRoute.slice(-3,-1)]]){
   for(const t of [0,.25,.5,.75,1]){
    const [a,b]=route,p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};
    rig.update('interior',p);assert.equal(rig.state.room,room);assert.equal(rig.state.daylight,false);
    assert.equal(rig.state.activeLights,3);assert.equal(rig.state.shadowMaps,2);
   }
  }
 }finally{rig.dispose();}
});
