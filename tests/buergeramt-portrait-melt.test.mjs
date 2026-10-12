import test from 'node:test';
import assert from 'node:assert/strict';
import '../buergeramt-goop.js';
import {createAmtPortraitMelt} from '../buergeramt-portrait-melt.js';

function fixture(){
  class Material{constructor(options={}){Object.assign(this,{depthTest:true,disposed:0},options);}onBeforeCompile(){}customProgramCacheKey(){return 'authored';}dispose(){this.disposed++;}}
  class Geometry{constructor(w,h){Object.assign(this,{w,h,disposed:0});}dispose(){this.disposed++;}}
  class Mesh{constructor(geometry,material){Object.assign(this,{geometry,material,position:{set(x,y,z){Object.assign(this,{x,y,z});}}});}}
  const frame={children:[],add(mesh){this.children.push(mesh);},remove(mesh){this.children=this.children.filter(item=>item!==mesh);}},bindings=[];
  const material=new Material({map:{fallback:true}}),floor={setPortrait(texture,info){bindings.push({texture,info});}};
  const effect=createAmtPortraitMelt({THREE:{MeshBasicMaterial:Material,PlaneGeometry:Geometry,Mesh,Vector4:class{}},material,frame,floor,position:{x:3.4,z:5.43},width:1.276});
  return{effect,material,frame,bindings};
}
test('loaded portrait, drips and floor share one source and the authoritative sigmoid; missing paint stays legible',()=>{
  const f=fixture();f.effect.update({time:600,visualTime:450});assert.equal(f.effect.inspect().melt,0);assert.equal(f.effect.inspect().dripsVisible,false);
  const texture={actualPaint:true};f.effect.setTexture(texture);assert.equal(f.bindings.length,1);assert.equal(f.bindings[0].texture,texture);
  assert.equal(f.bindings[0].info.x,3.4);assert.ok(Math.abs(f.bindings[0].info.z-5.2848)<1e-10);
  for(const time of [0,150,300,450,600,900]){f.effect.update({time,visualTime:BuergeramtGoop.motion(time)});assert.equal(f.effect.inspect().melt,BuergeramtGoop.goop(time));assert.equal(f.effect.inspect().dripsVisible,time>0);}
  f.effect.update({time:600,visualTime:450},true);assert.equal(f.effect.inspect().melt,1);assert.equal(f.effect.inspect().clock,0);
  f.effect.update(null);assert.equal(f.effect.inspect().melt,0);assert.equal(f.effect.inspect().dripsVisible,false);
  f.effect.update({time:0,visualTime:0});assert.equal(f.effect.inspect().melt,0,'next visit is an intact portrait');
});
test('drips meet the ground with real depth and transparent gaps; owned mesh disposal leaves the shared image alone',()=>{
  const f=fixture(),drips=f.frame.children[0];
  assert.ok(Math.abs(2.22+.88*(drips.position.y-drips.geometry.h/2)-.0024)<1e-10);
  assert.equal(drips.material.depthTest,true);assert.equal(drips.material.depthWrite,false);assert.equal(drips.material.transparent,true);
  const shader={uniforms:{},fragmentShader:'#include <map_fragment>'};f.material.onBeforeCompile(shader,{});
  assert.match(shader.fragmentShader,/wetPaint/);assert.match(shader.fragmentShader,/bare/);assert.equal(shader.uniforms.amtPortraitMelt.value,0);
  f.effect.dispose();assert.equal(f.frame.children.length,0);assert.equal(drips.geometry.disposed,1);assert.equal(drips.material.disposed,1);assert.equal(f.material.disposed,0);
});
