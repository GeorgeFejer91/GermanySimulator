import test from 'node:test';
import assert from 'node:assert/strict';
import {createAmtFloor,amtFloorMelt} from '../buergeramt-floor.js';
import {harness} from './amt-harness.mjs';

function fixture(mobile=false){
  const resources=[],renders=[],listeners=new Map();
  class Resource{constructor(){resources.push(this);this.disposed=0;}dispose(){this.disposed++;}}
  class Target extends Resource{constructor(w,h,options){super();this.width=w;this.height=h;this.options=options;this.texture={target:this};}}
  class Geometry extends Resource{}
  class Material extends Resource{constructor(options){super();Object.assign(this,options);}}
  class Scene{add(mesh){this.mesh=mesh;}}
  class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;}}
  const material={color:{set(){}},onBeforeCompile(){},customProgramCacheKey:()=>''};
  const previous={name:'existing-target'};
  const renderer={target:previous,autoClear:false,xr:{enabled:true},fail:false,extensions:{has:()=>true},
    domElement:{addEventListener(type,fn){listeners.set(type,fn);},removeEventListener(type){listeners.delete(type);}},
    getRenderTarget(){return this.target;},setRenderTarget(target){this.target=target;},
    render(scene){assert.equal(this.autoClear,true);assert.equal(this.xr.enabled,false);
      assert.notEqual(scene.mesh.material.uniforms.previousOil.value,this.target.texture,'never read the write target');
      if(this.fail)throw Error('GPU unavailable');renders.push({target:this.target,seed:scene.mesh.material.uniforms.seed.value});}}
  class Vector2{constructor(x=0,y=0){this.set(x,y);}set(x,y){Object.assign(this,{x,y});return this;}}
  class Vector4{constructor(x=0,y=0,z=0,w=0){this.set(x,y,z,w);}set(x,y,z,w){Object.assign(this,{x,y,z,w});return this;}}
  const T={WebGLRenderTarget:Target,PlaneGeometry:Geometry,ShaderMaterial:Material,Scene,Mesh,OrthographicCamera:class{},Vector2,Vector4,FloatType:1,RedFormat:2,LinearFilter:3};
  const floor=createAmtFloor({THREE:T,renderer,material,mobile});
  return{floor,resources,renders,renderer,previous,listeners,material};
}
test('the room clock starts inside the doorway, continues in dialogue and freezes while hidden/closed',()=>{
  const h=harness();h.advanceGame(30);assert.equal(h.level.floorState.time,0);
  h.moveTo(0,6.6);h.level.interact();h.advanceGame(2);assert.ok(Math.abs(h.level.floorState.time-2)<1e-8);
  const d=harness();d.counter();const before=d.level.floorState.time;d.advanceGame(3);
  assert.ok(Math.abs(d.level.floorState.time-before-3)<1e-8);
  h.hide();h.advanceGame(60);assert.ok(Math.abs(h.level.floorState.time-2)<1e-8);
  h.document.hidden=false;const visit=h.level.floorState.visit;h.level.replay(h.config);
  assert.equal(h.level.floorState.time,0);assert.ok(h.level.floorState.visit>visit);
  h.node('amt-exit').click();h.advanceGame(10);assert.equal(h.level.floorState.time,0);
});
test('liquidation and slowdown share one smooth 210-second ramp, capped at 40% speed',()=>{
  for(const t of [-1,0,NaN,Infinity])assert.equal(amtFloorMelt(t),0);
  assert.equal(amtFloorMelt(105),.5);assert.equal(amtFloorMelt(210),1);assert.equal(amtFloorMelt(10000),1);
  const api=globalThis.BuergeramtGoop;assert.equal(api.speed(0),1);assert.equal(api.speed(105),.7);assert.equal(api.speed(210),.4);assert.equal(api.motion(210),147);
  let previous=0;for(let t=0;t<300;t+=.1){const value=amtFloorMelt(t);assert.ok(value>=previous&&value<=1);previous=value;}
  for(const time of [0,1,21,60,105,160,210,999]){const f=fixture();f.floor.update({visit:1,time});assert.equal(f.floor.inspect().speed,1-.6*f.floor.inspect().melt);f.floor.update({visit:1,time},true);assert.equal(f.floor.inspect().speed,1-.6*f.floor.inspect().melt);}
});
test('20 Hz transport is frame-rate independent, allocates only on melting, and preserves renderer state',()=>{
  for(const fps of [30,60]){
    const f=fixture();f.floor.update({visit:1,time:0,visualTime:0});
    assert.equal(f.resources.length,0);
    for(let i=1;i<=fps*4;i++)f.floor.update({visit:1,time:i/fps,visualTime:i/fps});
    const s=f.floor.inspect();assert.equal(s.steps,80);assert.equal(s.allocations,1);assert.equal(s.textureBytes,655360);
    assert.equal(f.renders.length,81);assert.equal(f.renders[0].seed,1);
    assert.equal(f.renderer.target,f.previous);assert.equal(f.renderer.autoClear,false);assert.equal(f.renderer.xr.enabled,true);
    for(let i=0;i<100;i++)f.floor.update({visit:1,time:4,visualTime:4});assert.equal(f.renders.length,81);
    f.floor.update({visit:1,time:1000,visualTime:1000});assert.equal(f.floor.inspect().steps,82,'never catch up an arbitrary clock jump');
    for(const target of f.resources.filter(r=>r instanceof Object&&r.options)){
      assert.equal(target.options.depthBuffer,false);assert.equal(target.options.stencilBuffer,false);assert.equal(target.options.generateMipmaps,false);
    }
  }
});
test('hidden time does no transport; reduced motion, replay and close release all owned surfaces',()=>{
  const f=fixture(true),old=globalThis.document;globalThis.document={hidden:false};
  try{
    f.floor.update({visit:1,time:20});f.floor.update({visit:1,time:20.1});assert.equal(f.floor.inspect().textureBytes,163840);
    const count=f.renders.length;globalThis.document.hidden=true;f.floor.update({visit:1,time:50});assert.equal(f.renders.length,count);
    globalThis.document.hidden=false;f.floor.update({visit:1,time:20.1},true);
    assert.equal(f.floor.inspect().targets,0);assert.equal(f.floor.inspect().melt,amtFloorMelt(20.1));assert.ok(f.resources.every(r=>r.disposed===1));
    for(let visit=2;visit<=6;visit++){
      f.floor.update({visit,time:0});f.floor.update({visit,time:21});assert.equal(f.floor.inspect().targets,2);
      f.floor.update(null);assert.equal(f.floor.inspect().targets,0);assert.ok(f.resources.every(r=>r.disposed===1));
    }
    assert.ok(f.listeners.has('webglcontextlost'));f.floor.dispose();assert.equal(f.listeners.size,0);
  }finally{globalThis.document=old;}
});
test('a failed render restores the renderer and leaves a static checkerboard without repeated GPU retries',()=>{
  const f=fixture();f.floor.update({visit:1,time:20});f.renderer.fail=true;f.floor.update({visit:1,time:21});
  assert.match(f.floor.inspect().failure,/GPU unavailable/);assert.equal(f.floor.inspect().targets,0);
  assert.equal(f.renderer.target,f.previous);assert.equal(f.renderer.autoClear,false);assert.equal(f.renderer.xr.enabled,true);
  const count=f.resources.length;f.floor.update({visit:1,time:50});assert.equal(f.resources.length,count);assert.equal(f.floor.inspect().melt,amtFloorMelt(50));
  f.renderer.fail=false;f.floor.update({visit:2,time:21});assert.equal(f.floor.inspect().failure,null);assert.equal(f.floor.inspect().targets,2);
});
test('only accepted displacement makes bounded footsteps; standing, blocked roots and repositioning do not',()=>{
  const f=fixture(),player={x:0,z:0,walkedDistance:0},actor={id:'walker',x:1,z:0,walkedDistance:0};
  const update=time=>f.floor.update({visit:1,time,visualTime:time},false,player,[actor]);
  update(0);for(let n=1;n<=80;n++)update(n*.05);assert.equal(f.floor.inspect().footsteps,0);
  for(let n=81;n<=140;n++){player.x+=.035;player.walkedDistance+=.035;actor.x+=.02;actor.walkedDistance+=.02;update(n*.05);}
  assert.ok(f.floor.inspect().footsteps>=4);assert.ok(f.floor.inspect().activeRipples<=8);
  const count=f.floor.inspect().footsteps;player.x+=10;actor.x+=10;update(7.05);assert.equal(f.floor.inspect().footsteps,count);
  player.x+=.495;actor.x+=.495;update(7.1);assert.equal(f.floor.inspect().footsteps,count,'short collision recovery is not accepted walking');
  player.x+=.6;player.walkedDistance+=.4;player.positionGeneration=1;actor.x+=.6;actor.walkedDistance+=.4;actor.positionGeneration=1;
  update(7.15);assert.equal(f.floor.inspect().footsteps,count,'recovery plus walking within one rendered frame cannot stir');
  for(let n=142;n<=330;n++)update(n*.05);assert.equal(f.floor.inspect().activeRipples,0);
  update(16.5);f.floor.update(null);assert.equal(f.floor.inspect().footsteps,0);
});
test('three-and-a-half minutes remain real residence time while motion integrates the shared drag',()=>{
  const h=harness();h.moveTo(0,6.6);h.level.interact();h.advanceGame(210);
  assert.ok(Math.abs(h.level.floorState.time-210)<1e-8);assert.equal(h.level.timeScale,.4);
  assert.equal(h.level.floorState.goop,1);assert.ok(h.level.floorState.visualTime>=147&&h.level.floorState.visualTime<148);
});
