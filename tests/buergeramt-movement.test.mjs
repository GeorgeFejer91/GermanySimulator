import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {harness,source} from './amt-harness.mjs';

function fixture(){
 const h=harness(),steps=[];
 h.window.__acceptedOfficeStep=(id,x,z)=>steps.push({id,x,z});
 const code=source('buergeramt.js')
  .replaceAll('actor.x=x;actor.z=z;actor.heading=', 'window.__acceptedOfficeStep(actor.id,x,z);actor.x=x;actor.z=z;actor.heading=')
  .replace(/\}\)\(\);\s*$/, 'window.__officeProbe={characters,view,setStage,moveOfficeCharacter,officePath};})();');
 vm.runInContext(code,h.context);
 const level=h.window.BuergeramtLevel;level.open(h.config);
 vm.runInContext(source('assets/buergeramt/office-detail.js'),h.context);
 const detail=Array.from(vm.runInContext('GermanyAmtOfficeDetail.obstacles',h.context));
 level.setOfficeObstacles(detail);
 const probe=h.window.__officeProbe;
 probe.view.x=0;probe.view.z=8;probe.setStage('waiting');
 return {...h,level,probe,steps,detail};
}

// Independent footprints taken from the visible hall primitives (world3d.js),
// rather than calling the movement code's own collision predicate as an oracle.
const furniture=[
 {x:0,z:-9.03,w:14.7,d:1.21},{x:0,z:-4.22,w:2.8,d:.16},
 {x:-4.65,z:.8,w:1.5,d:.58},
 ...[-6.8,6.8].map(x=>({x,z:-4.65,w:.48,d:.4})),
 ...[-4.2,4.3].map(x=>({x,z:3.6,w:.86,d:.24})),
 ...[-4.525,4.525].map(x=>({x,z:5.55,w:6.35,d:.16})),
 ...[-5.9,-2.1,1.7,5.5].flatMap(x=>[1.7,-1.1].map(z=>({x,z,w:.9,d:.76})))
];
function legal(x,z,solids,r=.34){
 assert.ok(Math.abs(x)+r<=7.62+1e-8&&z-r>=-10.37-1e-8&&z+r<=8.65+1e-8,'complete body stays inside the hall');
 for(const o of solids)assert.ok(Math.abs(x-o.x)>=o.w/2+r-1e-8||Math.abs(z-o.z)>=o.d/2+r-1e-8,`body overlaps ${JSON.stringify(o)} at ${x},${z}`);
}

for(const dt of [1/60,1/30,.1])test(`all eight office patrols keep body clearance and resume at dt=${dt}`,()=>{
 const h=fixture(),solids=[...furniture,...h.detail],origins=h.level.characters,travel=new Map();
 for(let t=0;t<60;t+=dt){
  const before=h.level.characters;h.level.update(dt);
  for(const a of h.level.characters){
   legal(a.x,a.z,solids);
   const prior=before.find(b=>b.id===a.id),distance=Math.hypot(a.x-prior.x,a.z-prior.z);
   assert.ok(distance<=.82*dt+1e-8,'movement stays within authored speed');
   travel.set(a.id,(travel.get(a.id)||0)+distance);
   for(const b of h.level.characters)if(a.id!==b.id)assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=.65-1e-8,'people remain separated');
  }
 }
 for(const a of origins)assert.ok(travel.get(a.id)>2,`${a.id} must recover and keep patrolling`);
 for(const step of h.steps)legal(step.x,step.z,solids);
});

for(const dt of [1/60,1/30,.1])test(`a thin route obstacle causes a legal detour with displacement-driven gait at dt=${dt}`,()=>{
 const h=fixture(),actor=h.probe.characters[0],prop={x:-4.8,z:-6.3,w:.09,d:.09};
 h.level.setOfficeObstacles([...h.detail,prop]);actor.mode='walk';actor.sequence=[];actor.pending=false;
 const origin={x:actor.x,z:actor.z,stride:actor.stride};let distance=0;
 for(let t=0;t<5;t+=dt){
  const x=actor.x,z=actor.z;h.level.update(dt);distance+=Math.hypot(actor.x-x,actor.z-z);
  legal(actor.x,actor.z,[...furniture,...h.detail,prop]);
 }
 assert.ok(Math.hypot(actor.x-origin.x,actor.z-origin.z)>.64,'clear exit makes one body diameter of progress within five seconds');
 assert.ok(actor.z>-6,'walker gets around the thin prop');
 let accepted=0,last=origin;
 for(const step of h.steps.filter(step=>step.id===actor.id)){accepted+=Math.hypot(step.x-last.x,step.z-last.z);last=step}
 assert.ok(Math.abs(actor.stride-origin.stride-accepted*8.5)<1e-8,'gait follows accepted substeps, including corner turns');
 for(const step of h.steps)legal(step.x,step.z,[...furniture,...h.detail,prop]);
});

for(const dt of [1/60,1/30,.1])test(`opposing walkers pass without overlap or deadlock at dt=${dt}`,()=>{
 const h=fixture(),[a,b]=h.probe.characters;
 // A roomy clear aisle, exercising production movement without queue reactions.
 Object.assign(a,{x:-2.5,z:-6.8,path:[],pathGoal:'',blockedTime:0,stride:0});
 Object.assign(b,{x:2.5,z:-6.8,path:[],pathGoal:'',blockedTime:0,stride:0});
 for(let t=0;t<20;t+=dt){
  h.probe.moveOfficeCharacter(a,2.5,-6.8,.75*dt,dt);
  h.probe.moveOfficeCharacter(b,-2.5,-6.8,.75*dt,dt);
  assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=.65-1e-8);
  legal(a.x,a.z,[...furniture,...h.detail]);legal(b.x,b.z,[...furniture,...h.detail]);
  if(t>=5&&t<5+dt){assert.ok(a.x>b.x,'head-on walkers pass within five seconds')}
 }
 assert.ok(a.x>2.4&&b.x< -2.4,'both reach their original goals');
});

test('blocked movement holds gait, then recovers when the player leaves',()=>{
 const h=fixture(),a=h.probe.characters[0];
 h.probe.view.x=a.x;h.probe.view.z=a.z+.8;
 const stride=a.stride;
 assert.equal(h.probe.moveOfficeCharacter(a,a.x,a.z+2,.075,.1),false);
 assert.equal(a.mode,'work');assert.equal(a.stride,stride);
 h.probe.view.x=0;h.probe.view.z=8;
 for(let i=0;i<60;i++)h.probe.moveOfficeCharacter(a,-4.8,-5.2,.075,.1);
 assert.ok(a.z> -5.3);
});

test('a late attached prop resolves an invalid body placement and replay stays legal',()=>{
 const h=fixture(),a=h.probe.characters[0],prop={x:a.x,z:a.z,w:.3,d:.3};
 h.level.setOfficeObstacles([...h.detail,prop]);
 legal(a.x,a.z,[...furniture,...h.detail,prop]);
 h.level.replay(h.config);
 for(const actor of h.level.characters)legal(actor.x,actor.z,[...furniture,...h.detail,prop]);
});

function isolate(h,a,b){h.probe.characters.forEach((actor,i)=>{if(actor!==a&&actor!==b)Object.assign(actor,{x:-5+(i-2)*1.1,z:7,path:[],pathGoal:''})})}
function place(actor,x,z){Object.assign(actor,{x,z,path:[],pathGoal:'',blockedTime:0,stride:0})}
for(const dt of [1/60,1/30,.1]){
 for(const side of [-1,1])test(`offset opposing walkers pass and reach both goals at dt=${dt}, side=${side}`,()=>{
  const h=fixture(),[a,b]=h.probe.characters;isolate(h,a,b);place(a,-2.5,-6.8+side*.15);place(b,2.5,-6.8-side*.15);let passAt=null;
  for(let t=0;t<20;t+=dt){
   h.probe.moveOfficeCharacter(a,2.5,-6.8+side*.15,.75*dt,dt);h.probe.moveOfficeCharacter(b,-2.5,-6.8-side*.15,.75*dt,dt);
   assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=.68-1e-8);legal(a.x,a.z,[...furniture,...h.detail]);legal(b.x,b.z,[...furniture,...h.detail]);
   if(a.x>b.x&&passAt===null)passAt=t+dt;
  }
  assert.ok(passAt!==null&&passAt<=5,'both sides pass within five seconds');assert.ok(a.x>2.4&&b.x< -2.4,'both original goals remain reachable');
 });
 test(`overtaking keeps both destinations reachable at dt=${dt}`,()=>{
  const h=fixture(),[a,b]=h.probe.characters;isolate(h,a,b);place(a,-2.5,-6.8);place(b,-1.25,-6.8);let passAt=null;
  for(let t=0;t<20;t+=dt){h.probe.moveOfficeCharacter(a,3.6,-6.8,.82*dt,dt);h.probe.moveOfficeCharacter(b,2.4,-6.8,.4*dt,dt);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=.68-1e-8);if(a.x>b.x&&passAt===null)passAt=t+dt}
  assert.ok(passAt!==null&&passAt<=5);assert.ok(a.x>3.5&&b.x>2.3,'passing leaves a clear route to both goals');
 });
 test(`inside L corner recovers with the favored side occupied at dt=${dt}`,()=>{
  const h=fixture(),[a,b]=h.probe.characters,props=[{x:0,z:-6.8,w:1.4,d:.14},{x:.63,z:-6.2,w:.14,d:1.4}];
  h.level.setOfficeObstacles([...h.detail,...props]);isolate(h,a,b);place(a,0,-6.15);place(b,-.98,-6.05);
  for(let t=0;t<5;t+=dt){h.probe.moveOfficeCharacter(a,-1.5,-7.7,.75*dt,dt);legal(a.x,a.z,[...furniture,...h.detail,...props]);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=.68-1e-8)}
  assert.ok(Math.hypot(a.x,a.z+6.15)>=.68,'legal exit makes one body diameter of progress within five seconds');
 });
}
