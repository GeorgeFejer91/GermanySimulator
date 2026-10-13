import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createJobcenterRelease,entryVortexFrame} from '../buergeramt-entry.js';

function fixture({mobile=false,reducedMotion=false,failCapture=false}={}){
  const source=new T.Scene(),camera=new T.PerspectiveCamera();
  const draws=[];
  const renderer={autoClear:true,target:null,
    getDrawingBufferSize(value){return value.set(1920,1080)},
    getRenderTarget(){return this.target},
    setRenderTarget(target){this.target=target},
    render(scene){
      draws.push({scene,target:this.target,autoClear:this.autoClear});
      if(scene===source&&failCapture)throw Error('capture failed');
    }};
  const release=failCapture?null:createJobcenterRelease({THREE:T,renderer,scene:source,camera,mobile,reducedMotion});
  return {source,renderer,draws,release,camera};
}

test('release captures once at the bounded size and composites over the live street',()=>{
  const {source,renderer,draws,release}=fixture();
  assert.equal(draws.length,1);
  assert.equal(draws[0].scene,source);
  assert.equal(draws[0].autoClear,true);
  assert.equal(draws[0].target.depthBuffer,false);
  assert.equal(renderer.target,null);
  assert.equal(renderer.autoClear,true);
  assert.deepEqual(release.inspect().capture,[960,540]);
  assert.equal(release.inspect().captureBytes,960*540*4);
  assert.ok(release.inspect().splats>0&&release.inspect().splats<=18500);
  assert.equal(release.inspect().drawCalls,2);

  release.render(.016,false,new T.Vector2(.73,.29));
  assert.equal(draws.length,2);
  assert.equal(draws[1].autoClear,false);
  assert.equal(draws[1].target,null);
  assert.equal(draws[1].scene.background,null);
  assert.equal(draws[1].scene.children.length,2);
  for(const mesh of draws[1].scene.children){
    assert.equal(mesh.material.transparent,true);
    assert.equal(mesh.material.depthTest,false);
    assert.equal(mesh.material.depthWrite,false);
    assert.equal(mesh.material.blending,T.NormalBlending);
  }
  const splat=draws[1].scene.children[1];
  assert.match(splat.material.vertexShader,/sourceNdc=sourceUv\*2\.-1\./);
  assert.doesNotMatch(splat.material.vertexShader,/uDepth|uInverse|readPixels/);
  assert.deepEqual(release.inspect().doorUv,[.73,.29]);
  assert.equal(renderer.autoClear,true);
  assert.equal(renderer.target,null);

  let finished=false;
  for(let i=0;i<80;i++)finished=release.render(.05,false,new T.Vector2(.73,.29));
  assert.equal(finished,true);
  assert.equal(release.inspect().progress,1);
  assert.equal(release.inspect().duration,1.15);
  const before=draws.length;
  release.dispose();release.dispose();
  assert.equal(release.inspect().disposed,true);
  assert.equal(release.render(.016),true);
  assert.equal(draws.length,before);
});

test('mobile reduced motion uses one fade draw and finishes in 240 ms',()=>{
  const {release,draws}=fixture({mobile:true,reducedMotion:true});
  assert.deepEqual(release.inspect().capture,[640,360]);
  assert.equal(release.inspect().splats,0);
  assert.equal(release.inspect().drawCalls,1);
  assert.equal(release.render(.08,true,new T.Vector2(2,-1)),false);
  assert.equal(draws[1].scene.children.length,1);
  assert.deepEqual(release.inspect().doorUv,[1,0]);
  assert.equal(release.render(.08,true),false);
  assert.equal(release.render(.08,true),true);
  release.dispose();
});

test('changing to reduced motion removes splats and keeps the progress fraction',()=>{
  const {release,draws}=fixture();
  release.render(.1);
  const before=release.inspect().progress;
  release.render(0,true);
  assert.equal(release.inspect().reducedMotion,true);
  assert.equal(release.inspect().duration,.24);
  assert.ok(Math.abs(release.inspect().progress-before)<1e-9);
  assert.equal(draws.at(-1).scene.children[1].material.uniforms.uReduced.value,1);
  release.dispose();
  assert.equal(entryVortexFrame(3.4).done,true);
});

test('failed capture disposes its target and restores renderer state',()=>{
  let disposed=0;
  class Target extends T.WebGLRenderTarget{dispose(){disposed++;super.dispose()}}
  const THREE={...T,WebGLRenderTarget:Target};
  const {source,camera,renderer}=fixture();
  renderer.target={outside:true};renderer.autoClear=false;
  renderer.render=()=>{throw Error('capture failed')};
  assert.throws(()=>createJobcenterRelease({THREE,renderer,scene:source,camera}),/capture failed/);
  assert.equal(disposed,1);
  assert.deepEqual(renderer.target,{outside:true});
  assert.equal(renderer.autoClear,false);
});

test('overlay render restores autoClear even when the renderer throws',()=>{
  const {release,renderer}=fixture();
  renderer.render=()=>{throw Error('overlay failed')};
  assert.throws(()=>release.render(.016),/overlay failed/);
  assert.equal(renderer.autoClear,true);
  release.dispose();
});
