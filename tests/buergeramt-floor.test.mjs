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
      if(this.fail)throw Error('GPU unavailable');const u=scene.mesh.material.uniforms;renders.push({target:this.target,seed:u.seed.value,clock:u.clock.value,flowClock:u.flowClock.value});}}
  class Vector2{constructor(x=0,y=0){this.set(x,y);}set(x,y){Object.assign(this,{x,y});return this;}}
  class Vector4{constructor(x=0,y=0,z=0,w=1){this.set(x,y,z,w);}set(x,y,z,w){Object.assign(this,{x,y,z,w});return this;}}
  const T={WebGLRenderTarget:Target,PlaneGeometry:Geometry,ShaderMaterial:Material,Scene,Mesh,OrthographicCamera:class{},Vector2,Vector4,FloatType:1,RGBAFormat:2,LinearFilter:3};
  const floor=createAmtFloor({THREE:T,renderer,material,mobile});
  return{floor,resources,renders,renderer,previous,listeners,material};
}
test('the room clock starts inside the doorway, continues in dialogue and freezes while hidden/closed',()=>{
  const h=harness();assert.equal(h.level.floorState.time,0);h.advanceGame(2);assert.ok(Math.abs(h.level.floorState.time-2)<1e-8);
  const d=harness();d.counter();const before=d.level.floorState.time;d.advanceGame(3);
  assert.equal(d.level.floorState.restoring,true);assert.equal(d.level.floorState.goop,0);assert.equal(d.level.timeScale,1);assert.ok(d.level.floorState.time<=before);
  h.hide();h.advanceGame(60);assert.ok(Math.abs(h.level.floorState.time-2)<1e-8);
  h.document.hidden=false;const visit=h.level.floorState.visit;h.level.replay(h.config);
  assert.equal(h.level.floorState.time,0);assert.ok(h.level.floorState.visit>visit);
  h.node('amt-exit').click();h.advanceGame(10);assert.equal(h.level.floorState.time,0);
});
test('liquidation and slowdown share an eight-minute downward wave, capped at 65% speed',()=>{
  for(const t of [-1,0,NaN,Infinity])assert.equal(amtFloorMelt(t),0);
  const api=globalThis.BuergeramtGoop;
  assert.equal(api.delay,90);assert.equal(api.duration,480);assert.equal(api.minSpeed,.65);assert.equal(api.speed(0),1);assert.equal(api.speed(570),.65);assert.equal(api.goop(570),1);assert.equal(api.goop(10000),1);
  assert.ok(api.goop(120)>.08&&api.goop(150)>.17,'melting progresses after the grace period');
  assert.ok(api.speed(210)>api.speed(150)&&api.speed(370)>api.speed(310)&&api.speed(510)>api.speed(450),'three slow waves briefly restore speed');
  assert.ok(api.speed(310)<api.speed(150)&&api.speed(470)<api.speed(310),'successive slow troughs descend');
  assert.ok(Math.abs(api.motion(570)-486)<1e-8);
  for(const t of [30,60,89,91,120,150,210,250,310,370,410,470,530,569,580]){const derivative=(api.motion(t+.001)-api.motion(t-.001))/.002;assert.ok(Math.abs(derivative-api.speed(t))<1e-7,'integrated scene time follows the shared speed');}
  let previous=0;for(let t=0;t<1000;t+=.1){const value=amtFloorMelt(t),motion=api.motion(t);assert.ok(value>=0&&value<=1);assert.ok(api.speed(t)>=.65&&api.speed(t)<=1);assert.ok(motion>=previous,'scene time never reverses');previous=motion;}
  for(const time of [0,1,21,60,300,160,600,900,999]){const f=fixture();f.floor.update({visit:1,time});assert.equal(f.floor.inspect().speed,1-.35*f.floor.inspect().melt);f.floor.update({visit:1,time},true);assert.equal(f.floor.inspect().speed,1-.35*f.floor.inspect().melt);}
});

test('the first 90 seconds keep melt, movement and audio tempo unchanged',()=>{
 const api=globalThis.BuergeramtGoop,f=fixture(),player={x:0,z:0,walkedDistance:0};
 for(const time of [0,1,30,60,89.999,90]){
  assert.equal(api.goop(time),0);assert.equal(api.speed(time),1);assert.equal(api.motion(time),time);
  player.x+=.5;player.walkedDistance+=.5;
  f.floor.update({visit:1,time,visualTime:time},false,player);
  assert.equal(f.floor.inspect().melt,0);assert.equal(f.floor.inspect().speed,1);
  assert.equal(f.floor.inspect().targets,0);assert.equal(f.floor.inspect().footsteps,0);
 }
 assert.equal(f.resources.length,0);
 f.floor.update({visit:1,time:90.1,visualTime:api.motion(90.1)},false,player);
 assert.ok(f.floor.inspect().melt>0);assert.ok(f.floor.inspect().speed<1);
 assert.equal(f.floor.inspect().targets,2);assert.equal(f.floor.inspect().allocations,1);
 assert.equal(f.floor.inspect().footsteps,0,'walking during the grace period is not replayed at onset');
 assert.ok(f.floor.inspect().steps<=2,'onset does not catch up 90 seconds of transport');
 assert.equal(f.renders[0].clock,90);assert.equal(f.renders[0].flowClock,0,'eddies start at their liquid phase origin');
 for(const render of f.renders){assert.ok(render.clock>=90,'ripple and portrait sampling retain absolute scene time');assert.equal(render.flowClock,render.clock-90);}
});

test('20 Hz transport is frame-rate independent, allocates only on melting, and preserves renderer state',()=>{
  for(const fps of [30,60]){
    const f=fixture();f.floor.update({visit:1,time:0,visualTime:0});
    assert.equal(f.resources.length,0);assert.equal(f.floor.inspect().portraitSource,false,'missing source is inactive with real Three.js vector defaults');
    f.floor.update({visit:1,time:90,visualTime:90});assert.equal(f.resources.length,0);
    for(let i=1;i<=fps*4;i++)f.floor.update({visit:1,time:90+i/fps,visualTime:90+i/fps});
    const s=f.floor.inspect();assert.equal(s.steps,80);assert.equal(s.allocations,1);assert.equal(s.textureBytes,2621440);
    assert.equal(f.renders.length,81);assert.equal(f.renders[0].seed,1);
    assert.equal(f.renderer.target,f.previous);assert.equal(f.renderer.autoClear,false);assert.equal(f.renderer.xr.enabled,true);
    for(let i=0;i<100;i++)f.floor.update({visit:1,time:94,visualTime:94});assert.equal(f.renders.length,81);
    f.floor.update({visit:1,time:1000,visualTime:1000});assert.equal(f.floor.inspect().steps,82,'never catch up an arbitrary clock jump');
    for(const target of f.resources.filter(r=>r instanceof Object&&r.options)){
      assert.equal(target.options.depthBuffer,false);assert.equal(target.options.stencilBuffer,false);assert.equal(target.options.generateMipmaps,false);
    }
  }
});
test('hidden time does no transport; reduced motion, replay and close release all owned surfaces',()=>{
  const f=fixture(true),old=globalThis.document;globalThis.document={hidden:false};
  try{
    f.floor.update({visit:1,time:110});f.floor.update({visit:1,time:110.1});assert.equal(f.floor.inspect().textureBytes,655360);
    const count=f.renders.length;globalThis.document.hidden=true;f.floor.update({visit:1,time:140});assert.equal(f.renders.length,count);
    globalThis.document.hidden=false;f.floor.update({visit:1,time:110.1},true);
    assert.equal(f.floor.inspect().targets,0);assert.equal(f.floor.inspect().melt,amtFloorMelt(110.1));assert.ok(f.resources.every(r=>r.disposed===1));
    for(let visit=2;visit<=6;visit++){
      f.floor.update({visit,time:0});f.floor.update({visit,time:111});assert.equal(f.floor.inspect().targets,2);
      f.floor.update(null);assert.equal(f.floor.inspect().targets,0);assert.ok(f.resources.every(r=>r.disposed===1));
    }
    assert.ok(f.listeners.has('webglcontextlost'));f.floor.dispose();assert.equal(f.listeners.size,0);
  }finally{globalThis.document=old;}
});
test('a failed render restores the renderer and leaves a static checkerboard without repeated GPU retries',()=>{
  const f=fixture();f.floor.update({visit:1,time:110});f.renderer.fail=true;f.floor.update({visit:1,time:111});
  assert.match(f.floor.inspect().failure,/GPU unavailable/);assert.equal(f.floor.inspect().targets,0);
  assert.equal(f.renderer.target,f.previous);assert.equal(f.renderer.autoClear,false);assert.equal(f.renderer.xr.enabled,true);
  const count=f.resources.length;f.floor.update({visit:1,time:140});assert.equal(f.resources.length,count);assert.equal(f.floor.inspect().melt,amtFloorMelt(140));
  f.renderer.fail=false;f.floor.update({visit:2,time:111});assert.equal(f.floor.inspect().failure,null);assert.equal(f.floor.inspect().targets,2);
});
test('only accepted displacement makes bounded footsteps; standing, blocked roots and repositioning do not',()=>{
  const f=fixture(),player={x:0,z:0,walkedDistance:0},actor={id:'walker',x:1,z:0,walkedDistance:0};
  const update=time=>f.floor.update({visit:1,time:90+time,visualTime:90+time},false,player,[actor]);
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
test('90 seconds of grace precede eight minutes of real residence on the shared drag curve',()=>{
  const h=harness();h.advanceGame(90);assert.equal(h.level.floorState.goop,0);assert.equal(h.level.timeScale,1);
  h.advanceGame(480);assert.ok(Math.abs(h.level.floorState.time-570)<1e-8);assert.ok(Math.abs(h.level.timeScale-.65)<1e-10);
  assert.ok(Math.abs(h.level.floorState.goop-1)<1e-10);assert.ok(Math.abs(h.level.floorState.visualTime-BuergeramtGoop.motion(570))<1);
});


test('restoring the room retains its pigment targets while reversing and releases them at zero',()=>{
 const f=fixture();f.floor.update({visit:1,time:780,visualTime:722});const allocations=f.floor.inspect().allocations;
 for(let n=1;n<=10;n++)f.floor.update({visit:1,time:BuergeramtGoop.ageForMelt(1-n/20),visualTime:722+n*.1,restoring:true,restoration:n/20});
 assert.equal(f.floor.inspect().allocations,allocations);assert.equal(f.floor.inspect().targets,2);assert.equal(f.floor.inspect().restoration,.5);assert.ok(Math.abs(f.floor.inspect().speed-.825)<1e-10);
 f.floor.update({visit:1,time:0,visualTime:800,restoring:true,restoration:1});assert.equal(f.floor.inspect().targets,0);assert.equal(f.floor.inspect().melt,0);assert.equal(f.floor.inspect().speed,1);
 f.floor.update(null);assert.equal(f.floor.inspect().restoration,0);
});

test('temporary speed recoveries keep the same forward-moving pigment field',()=>{
 const f=fixture();let previous=0;
 for(const time of [90,150,210,290,370,450,510,570]){
  const motion=BuergeramtGoop.motion(time);assert.ok(motion>=previous);previous=motion;
  f.floor.update({visit:1,time,visualTime:motion});
  assert.equal(f.floor.inspect().melt,BuergeramtGoop.goop(time));
  if(time>90)assert.equal(f.floor.inspect().allocations,1,'a receding wave does not reseed the oils');
 }
 assert.equal(f.renders.filter(render=>render.seed).length,1);
});

test('inverse melt age preserves the single curve across restoration boundaries',()=>{
 for(const amount of [0,.00001,...Array.from({length:201},(_,i)=>i/200),1])assert.ok(Math.abs(BuergeramtGoop.goop(BuergeramtGoop.ageForMelt(amount))-amount)<1e-12);
});
