import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.core.js';
import {validateStreetCharacterRigDefinition,sampleStreetCharacterRig,orderStreetCharacterRigPacket,projectStreetCharacterRigPacket} from '../street-character-rig.js';

const camera={position:[0,11.5,14],right:[1,0,0],up:[0,.8465712857591025,-.5322753593096153],forward:[0,-.5322753593096153,-.8465712857591025]};
const forwards={down:[0,0,1],right:[1,0,0],up:[0,0,-1],left:[-1,0,0]};
function definition(){
  const quad=[[0,1,2],[1,3,2]],uvs=[[0,0],[.1,0],[0,.1],[.1,.1]];
  const upper={id:'upper',type:'billboard',vertices:[[-.3,.8],[.3,.8],[-.3,-.15],[.3,-.15]],uvs,triangles:quad};
  const parts=[upper];
  for(let leg=0;leg<2;leg++){
    for(const bone of ['upper','lower'])parts.push({type:'bone-ribbon',leg,bone,vertices:[[-.1,-.05],[-.1,.05],[1.1,-.05],[1.1,.05]],uvs,triangles:quad});
    parts.push({type:'sole-upright',leg,vertices:[[-.09,.24],[.09,.24],[-.09,0],[.09,0]],uvs,triangles:quad});
  }
  return {schemaVersion:1,format:'gs-painted-parts',id:'source-fixture',skeleton:{pelvisY:.6,legs:[-.2,.2].map(x=>({hip:[x,.6,0],soleX:x,ankleOffset:[0,.24,0],upperLength:.255,lowerLength:.11}))},
    gait:{excursionWorld:1/7,liftWorld:.032,baseHipDrop:.002,maxHipDrop:.07,strideDistance:4/7/.02},
    views:Object.fromEntries(Object.keys(forwards).map((direction,index)=>[direction,{parts:structuredClone(parts).map(part=>({...part,uvs:part.uvs.map(([u,v])=>[u+index*.2,v])})),upperClips:{success:{frames:[{uvs,jumpWorld:0},{uvs,jumpWorld:.1},{uvs,jumpWorld:0}]}}}]))};
}
function frame(direction='down',root=[0,0,0]){return {rootWorld:root,forwardWorld:forwards[direction],camera}}
function pose(direction='down',phase=0,mode='walk',settle=0){return {direction,phase,mode,settle}}
function distance(a,b){return Math.hypot(...a.map((v,i)=>v-b[i]))}
function near(actual,expected,tolerance=1e-10){assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} differs from ${expected}`)}

test('fixed physical bones and finite connected packets across four directions and 128 phases',()=>{
  const def=definition();let out;
  for(const direction of Object.keys(forwards))for(let i=0;i<128;i++){
    out=sampleStreetCharacterRig(def,pose(direction,i/128),frame(direction,[3,.7,-4]),out);
    assert.equal(out.vertexCount,28);assert.equal(out.triangleCount,14);
    assert.ok(out.positionsWorld.subarray(0,out.vertexCount*3).every(Number.isFinite));
    for(let leg=0;leg<2;leg++){
      const j=Array.from(out.jointsWorld.subarray(leg*9,leg*9+9));
      near(distance(j.slice(0,3),j.slice(3,6)),def.skeleton.legs[leg].upperLength);
      near(distance(j.slice(3,6),j.slice(6,9)),def.skeleton.legs[leg].lowerLength);
      assert.ok(out.feetWorld[leg*3+1]>=.7);near(out.feetWorld[out.supportFoot*3+1],.7);
    }
    const bootStart=12;
    near(out.positionsWorld[bootStart*3+1]-out.positionsWorld[(bootStart+2)*3+1],.24,2e-7);
  }
});

test('accepted distance cancels stance-foot displacement at unchanged route speed in every direction',()=>{
  const def=definition();
  for(const direction of Object.keys(forwards)){
    const forward=forwards[direction],initial=sampleStreetCharacterRig(def,pose(direction,0),frame(direction));
    const expected=Array.from(initial.feetWorld.subarray(0,3));
    for(let i=1;i<32;i++){
      const phase=i/64,distance=phase*def.gait.strideDistance*.02,root=forward.map(v=>v*distance);
      const out=sampleStreetCharacterRig(def,pose(direction,phase),frame(direction,root));
      for(let axis=0;axis<3;axis++)near(out.feetWorld[axis],expected[axis]);
    }
  }
});

test('phase-specific settle preserves supporting XYZ and both horizontal feet, lands free sole without neutral snap',()=>{
  const def=definition();
  for(const direction of Object.keys(forwards))for(let i=0;i<64;i++){
    const phase=i/64,initial=sampleStreetCharacterRig(def,pose(direction,phase),frame(direction));
    for(const amount of [0,.25,.5,.75,1]){
      const out=sampleStreetCharacterRig(def,pose(direction,phase,'settle',amount),frame(direction));
      for(let leg=0;leg<2;leg++)for(const axis of [0,2])near(out.feetWorld[leg*3+axis],initial.feetWorld[leg*3+axis]);
      for(let axis=0;axis<3;axis++)near(out.feetWorld[out.supportFoot*3+axis],initial.feetWorld[out.supportFoot*3+axis]);
      near(out.feetWorld[(1-out.supportFoot)*3+1],initial.feetWorld[(1-out.supportFoot)*3+1]*(1-amount));
      if(amount===0)assert.deepEqual(out.positionsWorld,initial.positionsWorld);
      if(amount===1){const hold=sampleStreetCharacterRig(def,pose(direction,phase,'hold',0),frame(direction));assert.deepEqual(out.positionsWorld,hold.positionsWorld)}
    }
  }
});

test('repeat sampling is clock-free and reuses caller-owned geometry buffers without modifying inputs',()=>{
  const def=definition(),p=pose('right',.3125,'settle',.5),f=frame('right'),before=JSON.stringify({def,p,f});
  const out=sampleStreetCharacterRig(def,p,f),positions=out.positionsWorld,first=positions.slice();
  const same=sampleStreetCharacterRig(def,p,f,out);assert.equal(same,out);assert.equal(same.positionsWorld,positions);assert.deepEqual(positions,first);assert.equal(JSON.stringify({def,p,f}),before);
  const ordered=orderStreetCharacterRigPacket(out,camera.position);assert.equal(orderStreetCharacterRigPacket(out,camera.position),ordered);
});

test('jump moves all body and whole boots together and recovers exact same terminal',()=>{
  const def=definition(),start=sampleStreetCharacterRig(def,{...pose('down',.2,'hold'),upper:{clip:'success',frame:0}},frame());
  const jump=sampleStreetCharacterRig(def,{...pose('down',.2,'hold'),upper:{clip:'success',frame:1}},frame());
  const end=sampleStreetCharacterRig(def,{...pose('down',.2,'hold'),upper:{clip:'success',frame:2}},frame());
  for(let i=0;i<start.vertexCount;i++){near(jump.positionsWorld[i*3],start.positionsWorld[i*3]);near(jump.positionsWorld[i*3+1]-start.positionsWorld[i*3+1],.1,2e-7);near(jump.positionsWorld[i*3+2],start.positionsWorld[i*3+2])}
  near(jump.feetWorld[1],.1);near(jump.feetWorld[4],.1);assert.deepEqual(start.positionsWorld,end.positionsWorld);
});

test('source facing UV and complete rigid boot dimensions survive every pose; no head flip or boot scaling',()=>{
  const def=definition();
  for(const [index,direction] of Object.keys(forwards).entries()){
    const out=sampleStreetCharacterRig(def,pose(direction,.25),frame(direction));near(out.uvs[0],index*.2,3e-8);
    for(const start of [12,24]){near(distance(Array.from(out.positionsWorld.subarray(start*3,start*3+3)),Array.from(out.positionsWorld.subarray((start+1)*3,(start+1)*3+3))),.18,1e-7)}
  }
});

test('crossing-polygon order splits geometry while preserving source UV and remains bounded',()=>{
  const source=sampleStreetCharacterRig(definition(),pose(),frame());source.vertexCount=6;source.triangleCount=2;
  source.positionsWorld.set([-1,-1,-1,1,-1,1,0,1,0, -1,-1,1,1,-1,-1,0,1,0]);
  source.uvs.set([0,0,1,0,.5,1,0,0,1,0,.5,1]);source.indices.set([0,1,2,3,4,5]);source.trianglePartIds.set([0,1]);
  const out=orderStreetCharacterRigPacket(source,[0,0,10]);assert.ok(out.triangleCount>2);assert.ok(out.vertexCount<=128&&out.triangleCount<=64);
  let centre=0;
  for(let i=0;i<out.vertexCount;i++){
    const x=out.positionsWorld[i*3],y=out.positionsWorld[i*3+1];near(out.uvs[i*2],(x+1)/2);near(out.uvs[i*2+1],(y+1)/2);if(Math.abs(x)<1e-8&&Math.abs(y+1)<1e-8)centre++;
  }
  assert.ok(centre>=2,'both crossing source surfaces retain their interpolated midpoint');
});

test('real cuff crossing with collinear clipped leading vertices preserves finite paint area',()=>{
  const source=sampleStreetCharacterRig(definition(),pose(),frame());source.vertexCount=6;source.triangleCount=2;
  source.positionsWorld.set([.32283636927604675,.3704351782798767,-.056269507855176926,.32407328486442566,.25503721833229065,-.12415038049221039,-.00809482205659151,.25503721833229065,-.12415038049221039,.00991683267056942,.29845160245895386,-.13198278844356537,.4104555547237396,.29845160245895386,-.13198278844356537,.009580823592841625,.24172204732894897,-.13198278844356537]);
  source.uvs.set([0,0,1,0,0,1,0,0,1,0,0,1]);source.indices.set([0,1,2,3,4,5]);source.trianglePartIds.set([0,1]);
  function area(packet){let total=0;for(let i=0;i<packet.triangleCount;i++){
    const a=new THREE.Vector3().fromArray(packet.positionsWorld,packet.indices[i*3]*3),b=new THREE.Vector3().fromArray(packet.positionsWorld,packet.indices[i*3+1]*3),c=new THREE.Vector3().fromArray(packet.positionsWorld,packet.indices[i*3+2]*3);
    total+=b.sub(a).cross(c.sub(a)).length()/2;
  }return total}
  const expected=area(source),out=orderStreetCharacterRigPacket(source,camera.position);
  assert.ok(out.triangleCount>=2);assert.ok(out.positionsWorld.subarray(0,out.vertexCount*3).every(Number.isFinite));near(area(out),expected,expected*2**-22);
});

test('canonical packet projection agrees with independent Three.js perspective projection',()=>{
  const physical=new THREE.PerspectiveCamera(48,16/9,.1,100);physical.position.set(...camera.position);physical.lookAt(0,1,-2.7);physical.updateMatrixWorld();
  const matrix=new THREE.Matrix4().multiplyMatrices(physical.projectionMatrix,physical.matrixWorldInverse),source=sampleStreetCharacterRig(definition(),pose('down',.25),frame());
  const out=projectStreetCharacterRigPacket(source,matrix.elements,{x:13,y:29,width:960,height:540});assert.equal(out.visible,true);
  for(let i=0;i<source.vertexCount;i++){
    const v=new THREE.Vector3().fromArray(source.positionsWorld,i*3).project(physical);
    near(out.screenXY[i*2],13+(v.x+1)*480,4e-5);near(out.screenXY[i*2+1],29+(1-v.y)*270,4e-5);near(out.ndcDepth[i],v.z,1e-7);
  }
  assert.equal(projectStreetCharacterRigPacket(source,matrix.elements,{x:0,y:0,width:640,height:480}),out);
  const behind=matrix.elements.slice();behind[15]=-100;assert.equal(projectStreetCharacterRigPacket(source,behind,{x:0,y:0,width:640,height:480}).visible,false);
});

test('malformed definitions, unregistered upper paint, nonphysical reach and undersized reuse buffers fail explicitly',()=>{
  for(const change of [d=>d.skeleton.pelvisY=NaN,d=>d.views.left.parts[0].type='sole-upright',d=>d.views.up.parts[1].vertices[0][0]=100,d=>d.views.right.parts[0].uvs[0][0]=2,d=>d.skeleton.legs[0].upperLength=-1]){
    const def=definition();change(def);assert.throws(()=>validateStreetCharacterRigDefinition(def),/Street rig/);
  }
  const def=definition();assert.throws(()=>sampleStreetCharacterRig(def,{...pose(),upper:{clip:'unregistered',frame:0}},frame()),/unregistered/);
  assert.throws(()=>sampleStreetCharacterRig(def,pose(),frame(),{positionsWorld:new Float32Array(1)}),/buffers/);
  const impossible=definition();impossible.gait.excursionWorld=10;assert.throws(()=>sampleStreetCharacterRig(impossible,pose(),frame()),/reach/);
  assert.throws(()=>sampleStreetCharacterRig(def,pose(),{...frame(),forwardWorld:[0,1,0]}),/horizontal/);
});
