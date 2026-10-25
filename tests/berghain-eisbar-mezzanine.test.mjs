import test from 'node:test';
import assert from 'node:assert/strict';
import {layout} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand,moveVisitor,visitorRadius} from '../berghain/navigation.mjs';
const site=([x,y,z])=>studyToSite({x,y,z});
function walk(route){
 let p={...route[0]};assert.ok(canStand(p,layout),'supported start '+JSON.stringify(p));
 for(const target of [...route.slice(1),...route.toReversed().slice(1)]){
  const n=Math.ceil(Math.hypot(target.x-p.x,target.z-p.z)/.025),dx=(target.x-p.x)/n,dz=(target.z-p.z)/n;
  for(let i=0;i<n;i++){p=moveVisitor(p,{x:dx,z:dz},layout);assert.ok(canStand(p,layout),'supported body each step');}
  assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.09,'reach '+JSON.stringify({target,p}));
  assert.ok(Math.abs(p.y-target.y)<.14,'correct level');
 }
}
test('Eisbar counter and visitor platform occupy a distinct intermediate level',()=>{
 const e=layout.architecturalCirculation.eisbar;
 assert.ok(e.floorHeight>layout.mainBar.floorHeight+1.8,'mezzanine must be above main bar with a body-clear space below');
 assert.ok(e.floorHeight<12.05,'counter below the recorded upper continuation');
 assert.match(e.registration,/estimated/i);
 const lower=site([19.5,5.45,-19.5]),upper=site([19.5,e.floorHeight,-19.5]);
 assert.ok(canStand(lower,layout),'main-floor access beneath elevated platform');
 assert.ok(canStand(upper,layout),'actual supported mezzanine visitor area');
 const counters=layout.parts.filter(p=>/^Architecture Eisbar (front|return) counter plinth$/.test(p.name));
 assert.equal(counters.length,2);
 for(const c of counters)assert.ok(Math.abs(c.center[1]-c.size[1]/2-e.floorHeight)<.02,'counter rests on its platform');
});
test('main floor reaches the counter and upper continuation independently in both directions',()=>{
 const e=layout.architecturalCirculation.eisbar;
 assert.ok(e.siteGuestRoute?.length>5);
 walk(e.siteGuestRoute);walk(e.siteUpperRoute);
 assert.match(e.stairUpperConnection,/Unresolved|Closed/,'no unsupported Panorama destination');
});
test('narrow upper stair clears the retained glass screen beyond its centre line',()=>{
 const e=layout.architecturalCirculation.eisbar;
 for(const offset of [-.1,.1])walk(e.authorUpperRoute.map((p,i)=>site(i<2?p:[p[0]+offset,p[1],p[2]])));
 walk([[14.1,5.45,-14],[16.1,5.45,-14.3],[17.4,5.45,-14.3],
  [17.4,5.45,-19.4],[20.5,5.45,-19.4],[20.5,5.45,-17.8]].map(site));
});
test('mezzanine edge guards stop the full body before the drop',()=>{
 const floor=layout.architecturalCirculation.eisbar.floorHeight;
 for(const [name,a,b] of [
  ['front',[19,floor,-13.7],[19,floor,-12.5]],
  ['east',[20.8,floor,-14.8],[21.9,floor,-14.8]],
  ['west',[17.5,floor,-18.8],[16.2,floor,-18.8]]
 ]){
  const start=site(a),target=site(b),solids=layout.solids.filter(s=>s.name.startsWith('Architecture Eisbar mezzanine '+name));
  assert.ok(solids.length,name);
  const probe={floors:[{x:[-100,100],z:[-100,100],y:floor}],solids};
  assert.ok(canStand(start,probe),name+' clear start');
  const p=moveVisitor(start,{x:target.x-start.x,z:target.z-start.z},probe);
  assert.ok(Math.hypot(p.x-target.x,p.z-target.z)>visitorRadius,name+' continuous guard');
 }
});
