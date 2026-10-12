import test from 'node:test';
import assert from 'node:assert/strict';
import '../buergeramt-goop.js';
import {amtLampDeaths,amtLampLevel,createAmtLampWear} from '../buergeramt-lamps.js';

test('five lamps wear gradually and die in order by twenty minutes on the residence clock',()=>{
  assert.deepEqual(amtLampDeaths,[780,900,1020,1110,1200]);
  for(let i=0;i<5;i++){
    assert.equal(amtLampLevel(0,0,i),1);
    assert.ok(amtLampLevel(600,BuergeramtGoop.motion(600),i,true)>0);
    assert.ok(amtLampLevel(amtLampDeaths[i]-.01,BuergeramtGoop.motion(amtLampDeaths[i]-.01),i,true)>0);
    assert.equal(amtLampLevel(amtLampDeaths[i],BuergeramtGoop.motion(amtLampDeaths[i]),i),0);
    assert.equal(amtLampLevel(2400,1350,i),0);
    let previous=1;
    for(let age=0;age<=1200;age+=.25){const v=amtLampLevel(age,BuergeramtGoop.motion(age),i,true);assert.ok(v>=0&&v<=previous+1e-10,'reduced-motion wear never flickers');previous=v;}
  }
});
test('flicker uses slowed time, increases with wear, and has no frame-sized jumps',()=>{
  const range=(age,i)=>{const values=Array.from({length:600},(_,n)=>amtLampLevel(age,n*.05,i));return Math.max(...values)-Math.min(...values);};
  assert.ok(range(600,0)>range(60,0)*5);
  assert.ok(Array.from({length:300},(_,n)=>amtLampLevel(650,400+n*.05,0)).some(v=>Math.abs(v-amtLampLevel(650,400,0))>.1));
  for(let i=0;i<5;i++)for(let age=0;age<1200;age+=.1){
    const a=amtLampLevel(age,BuergeramtGoop.motion(age),i),b=amtLampLevel(age+.01,BuergeramtGoop.motion(age+.01),i);
    assert.ok(a>=0&&a<=1);assert.ok(Math.abs(b-a)<.05,'bounded changes at a delayed render');
  }
});
test('the room and floor share lamp levels; close/replay restores brightness and render state',()=>{
  class Color{constructor(v=1){this.v=v;}clone(){return new Color(this.v);}copy(c){this.v=c.v;return this;}multiplyScalar(v){this.v*=v;return this;}}
  class Material{constructor(options){Object.assign(this,options);}dispose(){this.disposed=true;}}
  class Geometry{dispose(){this.disposed=true;}}
  class Mesh{constructor(geometry,material){Object.assign(this,{geometry,material});}}
  class Scene{add(mesh){this.mesh=mesh;}}
  const T={MeshBasicMaterial:Material,PlaneGeometry:Geometry,Mesh,Scene,OrthographicCamera:class{}};
  const materials=Array.from({length:5},()=>({color:new Color()}));let binding;
  const lamp=createAmtLampWear({THREE:T,materials,floor:{setLights(levels){binding=levels;}}});
  lamp.update({time:600,visualTime:450});assert.equal(lamp.inspect().clock,450);assert.equal(lamp.inspect().dead,0);
  lamp.update({time:900,visualTime:600});assert.equal(lamp.inspect().dead,2);
  lamp.update({time:1200,visualTime:750});assert.equal(lamp.inspect().dead,5);assert.ok(lamp.inspect().illumination<.01);assert.deepEqual(Array.from(binding.value),[0,0,0,0,0]);
  for(const reduced of [false,true])for(const progress of [0,.5,1]){
    lamp.update({time:BuergeramtGoop.ageForMelt(1-progress),visualTime:750+90*progress,restoring:true,restoration:progress,restorationAge:1200,restorationClock:750},reduced);
    assert.deepEqual(lamp.inspect().levels,Array(5).fill(progress),'all exhausted lamps recover continuously from their arrival brightness');
    assert.deepEqual(Array.from(binding.value),Array(5).fill(progress));
    assert.ok(Math.abs(lamp.inspect().illumination-(.008+.992*progress))<1e-12);
  }
  lamp.update({time:1200,visualTime:750});
  const held=lamp.inspect();globalThis.document={hidden:true};try{lamp.update({time:1800,visualTime:1050});assert.deepEqual(lamp.inspect(),held);}finally{delete globalThis.document;}
  let rendered;const renderer={autoClear:true,render(scene){assert.equal(this.autoClear,false);rendered=scene.mesh;}};
  lamp.render(renderer);assert.equal(renderer.autoClear,true);assert.equal(rendered.material.depthTest,false);assert.equal(rendered.material.depthWrite,false);
  renderer.render=()=>{throw Error('test render failure');};assert.throws(()=>lamp.render(renderer));assert.equal(renderer.autoClear,true);
  lamp.update(null);assert.deepEqual(lamp.inspect().levels,[1,1,1,1,1]);assert.equal(lamp.inspect().illumination,1);assert.ok(materials.every(m=>m.color.v===1));
  lamp.dispose();assert.equal(rendered.geometry.disposed,true);assert.equal(rendered.material.disposed,true);
});
