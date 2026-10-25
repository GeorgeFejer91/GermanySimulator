import * as THREE from '../../vendor/three/0.186.0/build/three.module.min.js';

// A15 / I24 show the forms, not a dimensioned ceiling plan. The fit below
// preserves the occupied slab above; circular recesses are capped by it.
const pairs=[-12,-6,0,5],side=2.9,halfWidth=1.175,top=5.05,bottom=4.70;

function pocketGeometry(length){
 const outline=new THREE.Shape();
 outline.moveTo(-.5,-.5);outline.lineTo(.5,-.5);outline.lineTo(.5,.5);outline.lineTo(-.5,.5);outline.closePath();
 const hole=new THREE.Path();hole.absellipse(0,0,.425/length,.425/(halfWidth*2),0,Math.PI*2,true);
 outline.holes.push(hole);
 return new THREE.ExtrudeGeometry(outline,{depth:1,steps:1,curveSegments:24,bevelEnabled:false})
  .rotateX(Math.PI/2).translate(0,.5,0);
}

export function createSauleCeilingGeometries(){
 const profile=new THREE.Shape(),mid=(4.65-4.625)/.85;
 profile.moveTo(-.5,-.5);profile.lineTo(-1.5/4.2,mid);profile.lineTo(1.5/4.2,mid);
 profile.lineTo(.5,-.5);profile.lineTo(.5,.5);profile.lineTo(-.5,.5);profile.closePath();
 const haunch=new THREE.ExtrudeGeometry(profile,{depth:1,steps:1,bevelEnabled:false})
  .translate(0,0,-.5).rotateY(Math.PI/2);
 return {'saule-ceiling-pocket-wide':pocketGeometry(2.9),'saule-ceiling-pocket-narrow':pocketGeometry(1.9),
  'saule-ceiling-haunch':haunch};
}

function partAPI(layout){
 function part(name,center,size,material='sauleConcrete',shape='box',quaternion=new THREE.Quaternion()){
  const p={name:'Säule ceiling '+name,groundFit:true,sauleCeiling:true,section:'interior',material,shape,center,size,
   matrix:new THREE.Matrix4().compose(new THREE.Vector3(...center),quaternion,new THREE.Vector3(...size)).toArray(),instanceTone:.94};
  layout.parts.push(p);return p;
 }
 function pipe(name,a,b,width,material='sauleSteel'){
  const v=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),length=v.length();
  return part(name,a.map((n,i)=>(n+b[i])/2),[width,length,width],material,'cylinder',
   new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));
 }
 return {part,pipe};
}

function trimGenericAisleBeams(layout){
 // Only the middle two inherited generic members cross the fitted pier bays.
 // Their side-room portions retain the same affine transform and end faces.
 const selected=layout.parts.filter(p=>p.name==='structural beam'&&p.center[1]<6&&p.center[0]>-10&&p.center[0]<1);
 const retained=[];
 for(const p of selected){
  const m=p.matrix,z0=m[14]-m[10]/2,z1=m[14]+m[10]/2;
  for(const [a,b]of [[z0,-4.075],[4.075,z1]]){
   const t0=(a-z0)/(z1-z0),t1=(b-z0)/(z1-z0),fraction=t1-t0,q=structuredClone(p);
   q.groundFit=true;q.sauleCeiling=true;q.name='Säule ceiling retained side beam';q.matrix=[...m];
   for(const axis of [0,1,2]){q.matrix[12+axis]+=m[8+axis]*((t0+t1)/2-.5);q.matrix[8+axis]*=fraction;}
   q.center=q.matrix.slice(12,15);q.size[2]*=fraction;retained.push(q);
  }
 }
 layout.parts=layout.parts.filter(p=>!selected.includes(p));layout.parts.push(...retained);
 return selected.map(p=>({name:p.name,center:p.center,matrix:p.matrix}));
}

export function fitSauleCeiling(layout){
 const removed=trimGenericAisleBeams(layout),{part,pipe}=partAPI(layout),pockets=[];
 for(const x of pairs){
  part('chamfered transverse member',[x,4.625,0],[2.5,.85,4.2],'sauleConcrete','saule-ceiling-haunch');
  for(const sign of [-1,1])part('solid pier soffit',[x,(top+bottom)/2,sign*side],[3.1,top-bottom,halfWidth*2]);
 }
 for(let i=0;i<pairs.length-1;i++){
  const a=pairs[i]+1.55,b=pairs[i+1]-1.55,x=(a+b)/2,length=b-a;
  for(const sign of [-1,1]){
   const z=sign*side;
   part('circular recessed soffit',[x,(top+bottom)/2,z],[length,top-bottom,halfWidth*2],'sauleConcrete',
    length>2?'saule-ceiling-pocket-wide':'saule-ceiling-pocket-narrow');
   pockets.push({center:[x,top,z],radius:.425,lipY:bottom,capY:top});
  }
  const left=pairs[i]+1.25,right=pairs[i+1]-1.25,span=right-left,cx=(left+right)/2;
  part('central service casing',[cx,4.92,.98],[span,.18,.35],'sauleSteel');
  for(const z of [-.98,-.82])pipe('exposed conduit',[left,4.91,z],[right,4.91,z],.065);
  for(const sx of [left+.2,right-.2])for(const z of [-.98,-.82]){
   part('conduit saddle',[sx,4.965,z],[.12,.17,.025],'sauleSteel');
  }
  for(const z of [-.65,.65]){
   part('fixture support rail',[cx,4.78,z],[span,.05,.045],'sauleSteel');
   for(const sx of [left+.16,right-.16])part('rail hanger',[sx,4.93,z],[.035,.24,.035],'sauleSteel');
   part('fixture mounting plate',[cx,4.765,z],[.34,.04,.20],'sauleSteel');
   for(const dx of [-.19,.19])part('fixture yoke',[cx+dx,4.57,z],[.04,.36,.15],'sauleSteel');
   part('suspended fixture body',[cx,4.50,z],[.32,.29,.36],'sauleSteel');
   part('recessed fixture lens',[cx,4.345,z],[.17,.02,.17],'sauleLens','cylinder');
   pipe('fixture cable',[cx+.21,4.77,z],[cx+.21,4.61,z],.018,'rubber');
  }
 }
 // Ceiling-only conservative envelopes never create a new walking surface.
 // Bodies remain below the 4.20 m lowest haunch, or above the intact 5.45 m slab.
 for(const p of layout.parts.filter(p=>p.sauleCeiling&&!p.name.includes('retained side beam'))){
  const box=new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(...p.center),new THREE.Vector3(...p.size));
  if(p.shape==='cylinder'){
   box.makeEmpty();for(const x of [-.5,.5])for(const y of [-.5,.5])for(const z of [-.5,.5])
    box.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(new THREE.Matrix4().fromArray(p.matrix)));
  }
  layout.solids.push({name:p.name,groundFit:true,sauleCeiling:true,renderPart:p,
   x:[box.min.x,box.max.x],y:[box.min.y,box.max.y],z:[box.min.z,box.max.z]});
 }
 layout.saule.ceiling={sources:['A15','I24'],confidence:'Observed form families; fitted bay registration, recess depth, service routing and fixture inventory',
  pierPairs:pairs,extent:{x:[pairs[0]-1.55,pairs.at(-1)+1.55],z:[-side-halfWidth,side+halfWidth]},
  slabTop:5.45,slabUnderside:top,soffitUnderside:bottom,minimumHaunch:4.2,pockets,removedGenericMembers:removed,
  serviceBays:3,fixtureStudyCount:6,lighting:'Unchanged three-cue interpretation; visible housing count is not a surveyed active rig',
  remaining:'Full measured grid, bore depth and original function, hidden continuity, exact service and current fixture inventory'};
 layout.saule.remaining='Measured footprint/grid, exact contemporary toilet inventory, outside entry, full ceiling plan and service/lighting inventory';
}
