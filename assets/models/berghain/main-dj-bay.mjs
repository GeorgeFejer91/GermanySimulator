import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';

// G19/G24 constrain a recessed red curtain, a lower opening beside a white
// door and a thin counter behind an open guard. All dimensions are fitted.
// V11 reports a private WC behind this curtain, but supplies no cubicle plan.
export function fitMainDJBay(layout){
 const retired=new Set(layout.parts.filter(p=>/^Hall fit DJ /.test(p.name)||/^main DJ (platform|desk)$/.test(p.name)));
 layout.parts=layout.parts.filter(p=>!retired.has(p));
 layout.solids=layout.solids.filter(s=>!retired.has(s.renderPart));
 // Pin the retained batches before adding members to them.
 const batches=new Map();
 for(const p of layout.parts){const key=[p.section,p.material==='mainBarPlaster'?'pale':p.material,p.shape].join('/');if(!batches.has(key))batches.set(key,[]);batches.get(key).push(p);}
 for(const batch of batches.values())batch.forEach((p,i)=>{p.instanceTone??=.84+((i*193+batch.length*37)%101)/625;});
 const front=-18.45,back=-18.98,low=5.75,high=8.0,z0=-9.1,z1=7.4,r0=-5.75,r1=-2.25;
 const moved=new Set(),shift=.33;
 const satellite=p=>/^main-satellite-[01](?: |$)/.test(p.equipment??p.id??p.name??'');
 for(const p of layout.parts)if(/^main detail (circular wall frame|dark wall recess|closed wall service hatch|maintenance )/.test(p.name)||satellite(p)){
  if(p.matrix){p.matrix=[...p.matrix];p.matrix[12]+=shift;p.center=p.matrix.slice(12,15);}
  for(const key of ['start','end'])if(p[key])p[key]=[p[key][0]+shift,...p[key].slice(1)];
  p.djBayMount=true;moved.add(p);
 }
 for(const s of layout.solids)if(moved.has(s.renderPart)){
  s.x=s.x.map(v=>v+shift);if(s.polygon)s.polygon=s.polygon.map(([x,z])=>[x+shift,z]);
 }
 for(const component of layout.soundSystem.components)if(satellite(component)){
  component.matrix=[...component.matrix];component.matrix[12]+=shift;
  component.position=component.matrix.slice(12,15);
 }
 function box(name,center,size,material='concrete',solid=true){
  const p={name:'DJ bay '+name,section:'interior',shape:'box',material,center,size,
   matrix:new THREE.Matrix4().makeScale(...size).setPosition(...center).toArray(),instanceTone:.94,djBay:true};
  layout.parts.push(p);
  if(solid)layout.solids.push({name:p.name,renderPart:p,x:[center[0]-size[0]/2,center[0]+size[0]/2],
   y:[center[1]-size[1]/2,center[1]+size[1]/2],z:[center[2]-size[2]/2,center[2]+size[2]/2]});
  return p;
 }
 const depth=front-back,mid=(front+back)/2;
 box('wall left',[mid,12.575,(r1+z1)/2],[depth,14.25,z1-r1]);
 box('wall right',[mid,12.575,(z0+r0)/2],[depth,14.25,r0-z0]);
 box('opening head',[mid,(high+19.7)/2,(r0+r1)/2],[depth,19.7-high,r1-r0]);
 box('recess floor',[mid,(5.45+low)/2,(r0+r1)/2],[depth,low-5.45,r1-r0],'rubber');
 box('closed backing',[back+.018,(low+high)/2,(r0+r1)/2],[.035,high-low,r1-r0],'rubber');
 for(let i=0;i<35;i++)box('curtain fold',[back+.06+(i%2)*.025,(low+high)/2,r0+.05+i*.1],[.035,high-low-.08,.105],'kloRed',false);
 box('closed white door',[front+.03,6.55,-7],[.055,2.2,.95],'pale');
 // The deck meets the unchanged guard posts at 5.75; the old platform buried
 // their lower sections while the old counter floated above that platform.
 const platform=box('platform',[-16.44,5.60,-4],[4.02,.30,5.3],'rubber');platform.name='main DJ platform';
 const counter=box('counter',[-14.78,6.65,-4],[.80,.10,5.1],'rubber');counter.name='main DJ desk';
 for(const s of layout.solids)if(s.renderPart===platform||s.renderPart===counter)s.name=s.renderPart.name;
 for(const x of [-15.08,-14.48])for(const z of [-6.35,-1.65])
  box('counter leg',[x,6.175,z],[.07,.85,.07],'steel');
 for(const x of [-15.08,-14.48])box('counter lower stretcher',[x,5.95,-4],[.045,.045,4.7],'steel');
 // Small original equipment silhouettes: no claim about the current DJ rig.
 for(const z of [-5.1,-2.9]){
  box('deck body',[-14.85,6.75,z],[.50,.10,.68],'rubber');
  box('deck platter',[-14.85,6.81,z],[.36,.02,.36],'steel');
 }
 box('mixer',[-14.85,6.78,-4],[.46,.16,.55],'rubber');
 // Keep the intact furniture assembly behind, rather than through, the
 // retained guard posts. Its legs remain completely supported by the deck.
 const counterParts=new Set(layout.parts.filter(p=>p===counter||/^DJ bay (counter |deck |mixer$)/.test(p.name)));
 for(const p of counterParts){p.center[0]-=.18;p.matrix[12]-=.18;}
 for(const s of layout.solids)if(counterParts.has(s.renderPart))s.x=s.x.map(x=>x-.18);
 for(const z of [-5,-3]){
  box('curtain practical casing',[-18.58,7.975,z],[.18,.05,.22],'steel',false);
  box('curtain practical lens',[-18.58,7.947,z],[.12,.006,.16],'kloRed',false);
 }
 layout.mainHallRegistration.djBay={sources:['A01','I23','V11','V12'],gallery:[19,24],
  opening:{front,back,low,high,z:[r0,r1]},platformTop:low,counterTop:6.70,
  mountOffset:shift,movedMounts:moved.size,counterGuardSetback:.18,
  evidence:'G19/G24: red curtain in a recessed opening, adjacent white door, high maintenance hatch, open guard and thin counter',
  lighting:'G24 red curtain accent interpreted with two fixed washes and a subdued counter pool, reusing the three scene lights; output, count and current program unmeasured',
  privateWC:'V11 (2024 visitor): compact private space and toilet behind the main DJ curtain; V12 (2026 interview): a booth toilet without identifying which booth',
  limits:'Opening depth, full wall thickness, platform, equipment and all coordinates inferred; private cubicle location, hidden route and current arrangement unregistered',
  access:'Closed scenic boundary; no private room, walkable floor, public route or toilet cubicle added'};
 layout.mainHallRegistration.section.recess='G19/G24 visible recess and lower opening fitted inside the retained hull; closed curtain and adjacent door';
 layout.mainHallRegistration.backstage='V11 associates compact private space and a toilet with the main DJ curtain; exact private footprint unregistered. No inferred private room or connection; maintenance access is not a public backstage route.';
}
