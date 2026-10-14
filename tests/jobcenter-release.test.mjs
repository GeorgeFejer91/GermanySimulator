import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createLevelVortex,buildingTransitionFrame} from '../level-transition-effects.js';

function fixture({mobile=false,reducedMotion=false,THREE=T,make=true}={}){
 const source=new T.Scene(),camera=new T.PerspectiveCamera(48,16/9,.1,150);
 camera.position.set(0,8,14);camera.lookAt(0,2,0);camera.updateMatrixWorld(true);
 const door=new T.Vector3(0,1,3),bounds=new T.Box3(new T.Vector3(-3,0,-2),new T.Vector3(3,7,3));
 const draws=[],renderer={autoClear:true,target:null,
  getDrawingBufferSize:value=>value.set(1920,1080),getRenderTarget(){return this.target},setRenderTarget(target){this.target=target},
  render(scene){draws.push({scene,target:this.target,autoClear:this.autoClear})}};
 const config={THREE,renderer,scene:source,camera,door,bounds,mobile,reducedMotion};
 return {source,camera,door,bounds,renderer,draws,config,vortex:make?createLevelVortex(config):null};
}

test('shared release captures exterior colour and depth once within its desktop budget',()=>{
 const f=fixture(),capture=f.draws[0];
 assert.equal(f.draws.length,1);assert.equal(capture.scene,f.source);
 assert.equal(capture.target.depthBuffer,true);assert.ok(capture.target.depthTexture);
 assert.equal(f.renderer.target,null);assert.equal(f.renderer.autoClear,true);
 assert.deepEqual(f.vortex.inspect().capture,[960,540]);assert.equal(f.vortex.inspect().captureBytes,960*540*8);
 assert.ok(f.vortex.inspect().splats>0&&f.vortex.inspect().splats<=18500);
 assert.equal(f.vortex.inspect().drawCalls,2);
 f.vortex.render(.8);const scene=f.draws.at(-1).scene;
 assert.notEqual(scene,f.source);assert.equal(scene.children.length,2);assert.ok(scene.background.isColor);
 const uniforms=scene.children[0].material.uniforms;
 assert.equal(uniforms.uImage.value,capture.target.texture);assert.equal(uniforms.uDepth.value,capture.target.depthTexture);
 assert.deepEqual(uniforms.uBoundsMin.value.toArray(),f.bounds.min.toArray());
 f.bounds.min.x=-99;assert.equal(uniforms.uBoundsMin.value.x,-3,'the captured destination remains registered to its original bounds');
 for(const mesh of scene.children){assert.equal(mesh.material.depthTest,false);assert.equal(mesh.material.depthWrite,false)}
 assert.equal(f.draws.filter(draw=>draw.scene===f.source).length,1);
 let disposed=0;capture.target.addEventListener('dispose',()=>disposed++);
 f.vortex.dispose();f.vortex.dispose();const before=f.draws.length;f.vortex.render(.2);
 assert.equal(disposed,1);assert.equal(f.vortex.inspect().disposed,true);assert.equal(f.draws.length,before);
});

test('forced release uses the same captured field backwards after crossing the indoor doorway',()=>{
 const f=fixture();let previous=1;
 for(const elapsed of [1.05,1.5,2.5,3.5,4.44]){
  const frame=buildingTransitionFrame('eject',elapsed);assert.equal(frame.stage,'rebuild');
  f.vortex.render(frame.collapse);assert.ok(f.vortex.inspect().progress<=previous);previous=f.vortex.inspect().progress;
 }
 assert.equal(f.draws.filter(draw=>draw.scene===f.source).length,1,'reverse reconstruction reuses its single capture');
 assert.equal(buildingTransitionFrame('eject',4.45).stage,'close');assert.equal(buildingTransitionFrame('eject',4.73).done,true);
 f.vortex.dispose();
});

test('mobile reduced motion is a bounded colour-only fade with no particle or depth allocation',()=>{
 const f=fixture({mobile:true,reducedMotion:true});
 assert.deepEqual(f.vortex.inspect().capture,[640,360]);assert.equal(f.vortex.inspect().captureBytes,640*360*4);
 assert.equal(f.draws[0].target.depthBuffer,false);assert.equal(f.draws[0].target.depthTexture,null);
 assert.equal(f.vortex.inspect().splats,0);assert.equal(f.vortex.inspect().drawCalls,1);
 const middle=buildingTransitionFrame('eject',.12,true);assert.equal(middle.stage,'fade');assert.equal(middle.fire,0);
 f.vortex.render(middle.collapse,true);assert.equal(f.draws.at(-1).scene.children.length,1);
 assert.equal(f.draws.at(-1).scene.children[0].material.uniforms.uReduced.value,1);
 assert.equal(buildingTransitionFrame('eject',.24,true).done,true);f.vortex.dispose();
});

test('switching an existing field to reduced motion reuses its capture and disables particle alpha',()=>{
 const f=fixture();f.vortex.render(.5);f.vortex.render(.5,true);
 assert.equal(f.vortex.inspect().progress,.5);assert.equal(f.draws.filter(draw=>draw.scene===f.source).length,1);
 for(const mesh of f.draws.at(-1).scene.children)assert.equal(mesh.material.uniforms.uReduced.value,1);
 f.vortex.dispose();
});

test('capture failure releases its target and restores the renderer even when already rendering elsewhere',()=>{
 let disposed=0;class Target extends T.WebGLRenderTarget{dispose(){disposed++;super.dispose()}}
 const f=fixture({THREE:{...T,WebGLRenderTarget:Target},make:false}),outside={outside:true};
 f.renderer.target=outside;f.renderer.autoClear=false;f.renderer.render=()=>{throw Error('capture failed')};
 assert.throws(()=>createLevelVortex(f.config),/capture failed/);assert.equal(disposed,1);
 assert.equal(f.renderer.target,outside);assert.equal(f.renderer.autoClear,false);
});
