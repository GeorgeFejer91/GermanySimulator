import {studyToSite} from './calibration.mjs';

// ENT04/ENT06 support the service/changing function and facing couches, not a
// measured furniture inventory. Retain U02's provisional ground-room footprint.
export function addWardrobe(layout,{box,beam}){
 // Retire the old fittings after the established batch tones and room
 // registrations are fixed, so unrelated instances keep their exact colours.
 const retired=new Set(layout.parts.filter(p=>p.name==='cloakroom counter'||p.name==='cloakroom hanger'));
 layout.parts=layout.parts.filter(p=>!retired.has(p));
 layout.solids=layout.solids.filter(s=>!retired.has(s.renderPart));
 const first=layout.parts.length;
 function body(name,c,s,material='rubber',grounded=false){
  box(name,c,s,material,'interior',true);
  Object.assign(layout.parts.at(-1),{wardrobe:true,grounded});
 }
 function detail(name,c,s,material='steel'){
  box('Garderobe '+name,c,s,material,'interior');layout.parts.at(-1).wardrobe=true;
 }
 function bar(name,a,b,w=.035){
  beam('Garderobe '+name,a,b,w,'steel','interior');layout.parts.at(-1).wardrobe=true;
 }
 body('cloakroom counter',[-15,.56,15.7],[10,1.02,1.1],'rubber',true);
 body('Garderobe counter top',[-15,1.11,15.7],[10,.08,1.1],'timber');
 // The low storage base blocks the complete rack footprint; all upper members
 // stay inside it. The public WC approach remains beyond the east counter end.
 body('Garderobe rack base',[-15.2,.24,17.55],[9.1,.38,.68],'steel',true);
 for(const x of [-19.6,-16.65,-13.7,-10.8])
  body('Garderobe rack upright',[x,1.34,17.55],[.06,1.82,.06],'steel');
 bar('hanging rail',[-19.63,2.25,17.55],[-10.77,2.25,17.55],.05);
 for(let i=0;i<20;i++){
  const x=-19.3+i*.43;
  // Closed hook around the rail, neck and triangular hanger in the Y/Z plane.
  const points=[[x,2.15,17.55],[x,2.2,17.49],[x,2.281,17.49],
   [x,2.281,17.61],[x,2.24,17.61]];
  for(let j=1;j<points.length;j++)bar('hanger hook',points[j-1],points[j],.012);
  bar('hanger shoulder',[x,2.15,17.55],[x,1.94,17.28],.014);
  bar('hanger shoulder',[x,2.15,17.55],[x,1.94,17.82],.014);
  bar('hanger crossbar',[x,1.94,17.28],[x,1.94,17.82],.014);
 }
 for(const x of [-17.6,-13.2]){
  body('Garderobe couch plinth',[x,.18,12.77],[3.5,.26,.98],'steel',true);
  body('Garderobe couch seat',[x,.4,12.85],[3.5,.18,.82]);
  body('Garderobe couch back',[x,.635,12.37],[3.5,.65,.18]);
  for(const dx of [-1.66,1.66])body('Garderobe couch arm',[x+dx,.59,12.85],[.18,.2,.82]);
 }
 for(const x of [-18,-15,-12])detail('metal claim token',[x,1.153,15.45],[.055,.006,.075],'stainless');
 const site=([x,y,z])=>studyToSite({x,y,z});
 for(const p of layout.parts.slice(first)){
  p.instanceTone=.94;
  if(p.shape==='beam'){p.start=Object.values(site(p.start));p.end=Object.values(site(p.end));continue;}
  const c=p.center,s=p.size,origin=Object.values(site(c));
  const axes=s.map((v,i)=>Object.values(site(c.map((n,j)=>n+(i===j?v:0)))).map((n,j)=>n-origin[j]));
  p.center=origin;p.size=axes.map(a=>Math.hypot(...a));p.matrix=[...axes[0],0,...axes[1],0,...axes[2],0,...origin,1];
  const solid=layout.solids.find(s=>s.renderPart===p);if(!solid)continue;
  solid.polygon=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,z])=>[origin[0]+axes[0][0]*x+axes[2][0]*z,origin[2]+axes[0][2]*x+axes[2][2]*z]);
  solid.x=[Math.min(...solid.polygon.map(p=>p[0])),Math.max(...solid.polygon.map(p=>p[0]))];
  solid.z=[Math.min(...solid.polygon.map(p=>p[1])),Math.max(...solid.polygon.map(p=>p[1]))];
 }
 layout.wardrobe={sources:['U02','ENT03','ENT04','ENT06'],floorHeight:.05,
  confidence:'Ground-floor function and facing seating reported; footprint, counts, materials and all furniture dimensions estimated',
  currentness:'2024/2025 visitor accounts; no measured plan of the 2016 enlargement or claim of exact 2026 inventory',
  counterTop:1.15,seatTop:.49,rackHeight:2.275,
  authorCounter:{x:[-20,-10],z:[15.15,16.25]},
  access:'Security check, cashier/wristband, strip curtain, cloakroom; east-end public WC corridor and north/east foyer connection retained',
  serviceRoute:[[-8.8,.05,14.4],[-11,.05,14.4],[-15,.05,14.4],[-19.3,.05,14.4]].map(site),
  partCount:layout.parts.length-first};
}
