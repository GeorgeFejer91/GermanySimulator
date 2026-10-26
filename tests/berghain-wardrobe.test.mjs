import test from 'node:test';
import assert from 'node:assert/strict';
import {layout} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
const site=(x,z)=>studyToSite({x,y:.05,z});
function follow(points,step){
 let p=points[0];assert.ok(canStand(p,layout));
 for(const target of points.slice(1)){
  const n=Math.ceil(Math.hypot(target.x-p.x,target.z-p.z)/step);
  const d={x:(target.x-p.x)/n,z:(target.z-p.z)/n};
  for(let i=0;i<n;i++){p=moveVisitor(p,d,layout);assert.ok(canStand(p,layout));}
  assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.025,JSON.stringify({p,target}));
 }
}
test('cloakroom service surface is reachable at standing height and supported on its floor',()=>{
 const c=layout.parts.find(p=>p.name==='cloakroom counter');
 const bottom=c.matrix[13]-c.size[1]/2,top=c.matrix[13]+c.size[1]/2;
 assert.ok(Math.abs(bottom-.05)<1e-8,`counter bottom ${bottom} floats above .05 floor`);
 assert.ok(top>=.95&&top<=1.2,`service height ${top}`);
 assert.equal(canStand(site(-15,15.7),layout),false);
});
test('cloakroom seats and rack are grounded, backed by actual collision and preserve public circulation',()=>{
 assert.ok(layout.wardrobe,'evidence and dimensions');
 for(const p of layout.parts.filter(p=>p.wardrobe&&p.grounded)){
  assert.ok(Math.abs(p.center[1]-p.size[1]/2-.05)<1e-8,p.name);
  assert.ok(layout.solids.some(s=>s.renderPart===p),p.name+' collision');
 }
 for(const x of [-17.6,-13.2])assert.equal(canStand(site(x,12.8),layout),false);
 assert.equal(canStand(site(-15,17.55),layout),false);
 const service=[site(-8.8,14.4),site(-11,14.4),site(-15,14.4),site(-19.3,14.4)];
 for(const step of [.04,.16,.65])for(const points of [service,layout.admission.route,layout.groundSanitary.route,layout.architecturalCirculation.wardrobeConnection.siteRoute]){
  follow(points,step);follow([...points].reverse(),step);
 }
});
