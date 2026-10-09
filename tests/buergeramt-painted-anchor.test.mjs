import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {anchorBlend,createPaintedAnchor,gaussianFlowPhase} from '../buergeramt-painted-anchor.js';
const manifest=JSON.parse(readFileSync(new URL('../assets/buergeramt/animation/clerk.json',import.meta.url)));
test('liquid phase lag stays monotonic, recovers keys and does not stop at inbetweens',()=>{
 // The closed-form derivative is bounded by 1 ± .085π; numerical sampling
 // checks arbitrary parts and both playback directions without trusting GLSL.
 for(let k=0;k<60;k++){
  const point=[Math.sin(k)*.6,k/60],epsilon=1e-6;
  assert.equal(gaussianFlowPhase(0,point),0);assert.equal(gaussianFlowPhase(1,point),1);
  let previous=-1;
  for(let n=0;n<=1000;n++){
   const phase=n/1000,u=gaussianFlowPhase(phase,point);
   assert(u>=0&&u<=1);assert(u>previous);previous=u;
   if(n>0&&n<1000){const slope=(gaussianFlowPhase(phase+epsilon,point)-gaussianFlowPhase(phase-epsilon,point))/(2*epsilon);assert(slope>.73&&slope<1.27)}
  }
  for(const edge of [0,1])assert(Math.abs((gaussianFlowPhase(edge+epsilon,point)-gaussianFlowPhase(edge-epsilon,point))/(2*epsilon)-1)<1e-7);
  assert.equal(gaussianFlowPhase(.4,point,0),.4);
 }
});
test('main and bridge keys recover original paint without adding a clock or held interval',()=>{
 for(let n=0;n<manifest.segments.length;n++){
  const pair=manifest.segments[n],start=anchorBlend(manifest,{segment:n,u:0,arc:'raise'}),end=anchorBlend(manifest,{segment:n,u:1,arc:'raise'});
  assert.equal(start.state,pair.from);assert.equal(end.state,pair.to);assert.equal(start.mix,0);assert.equal(end.mix,1);assert.equal(start.effect,0);assert(end.effect<1e-12);
  assert.equal(anchorBlend(manifest,{segment:n,u:.5,arc:'raise'}).opacity,1);
  assert.equal(anchorBlend(manifest,{segment:n,u:1,arc:null}).opacity,1);
 }
 let previous=-1;for(let n=0;n<=100;n++){const blend=anchorBlend(manifest,{segment:0,u:n/100,arc:'raise'});assert.equal(blend.opacity,1);assert(blend.mix>=previous);assert(blend.effect>=0&&blend.effect<=1);previous=blend.mix}
 assert.equal(anchorBlend(manifest,{segment:0,u:.5,arc:null}).effect,0);
});
function rig(){
 const disposed=[],closed=[],members=new Set();
 class Vector2{set(x,y){this.x=x;this.y=y}}
 class Vector3{constructor(){this.x=this.y=this.z=0}copy(other){Object.assign(this,other);return this}}
 class Color{copy(other){Object.assign(this,other);return this}}
 class Texture{constructor(bitmap){this.image=bitmap}dispose(){disposed.push(this)}}
 class Attribute{constructor(array,itemSize){this.array=array;this.itemSize=itemSize}}
 class PlaneGeometry{constructor(width,height,widthSegments,heightSegments){this.parameters={width,height,widthSegments,heightSegments};this.attributes={position:new Attribute(new Float32Array(12),3)};this.index={}}setAttribute(key,value){this.attributes[key]=value}dispose(){}}
 class InstancedBufferGeometry extends PlaneGeometry{constructor(){super();this.isInstancedBufferGeometry=true}}
 class MeshBasicMaterial{constructor(options){Object.assign(this,options);this.userData={};this.color=new Color()}dispose(){}}
 class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;this.position=new Vector3();this.quaternion={copy(){}};this.scale={setScalar:x=>{this.size=x}};this.userData={}}}
 const THREE={Vector2,Vector3,Color,Texture,PlaneGeometry,InstancedBufferGeometry,Float32BufferAttribute:Attribute,InstancedBufferAttribute:Attribute,MeshBasicMaterial,Mesh,ShaderChunk:{map_fragment:'texture2D(map,vMapUv)'},SRGBColorSpace:'srgb',LinearFilter:'linear',DoubleSide:'both'};
 const owner={attachPaint:mesh=>members.add(mesh),retirePaint:mesh=>members.delete(mesh)};
 const source={geometry:{parameters:{height:1.9}},scale:{y:1.2},position:{x:3,y:1.14,z:-7},quaternion:{},material:{color:{r:.8,g:.7,b:.6},userData:{breath:{value:.2}}}};
 return{THREE,owner,source,disposed,closed,members};
}
test('paint keeps registered canvas aspect/floor, bounds residency and cancels late decode',async()=>{
 const oldFetch=globalThis.fetch,oldBitmap=globalThis.createImageBitmap,r=rig();let bitmapGate=null,decodes=0,jobs=0;
 globalThis.fetch=async url=>({ok:true,arrayBuffer:async()=>{const bytes=readFileSync(new URL(url));return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}});
 globalThis.createImageBitmap=async()=>{decodes++;if(bitmapGate)await bitmapGate;return{width:1024,height:832,close(){r.closed.push(this)}}};
 try{
  const paired={count:256,rows:1,stride:5,textures:[{},{},{}]},signal=new AbortController(),paint=await createPaintedAnchor({...r,manifest,paired,manifestUrl:new URL('../assets/buergeramt/animation/clerk.json',import.meta.url),signal:signal.signal,queueLoad:job=>{jobs++;return Promise.resolve().then(job)}});
  const mesh=[...r.members][0];assert.equal(mesh.geometry.parameters.width,1024/832);
  paint.update({segment:0,u:0,arc:'raise'},r.source,true);assert.equal(paint.inspect().opacity,1);assert.equal(mesh.position.y,r.source.position.y);assert.equal(mesh.size,1.9*1.2);assert.equal(mesh.material.depthWrite,false);
  const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <map_fragment>'};mesh.material.onBeforeCompile(shader);
  assert.equal(mesh.geometry.instanceCount,256);assert.equal(mesh.geometry.attributes.anchorSlot.array.length,256);
  assert.equal(shader.uniforms.anchorXY.value,paired.textures[0]);assert.equal(paint.inspect().technique,'native-texture-gaussians');
  paint.update({segment:0,u:.25,arc:'raise'},r.source,true,{speaking:true,mouthFrame:2});
  assert.equal(paint.inspect().opacity,1);assert.equal(shader.uniforms.anchorMouth.value,.9);
  assert.equal(shader.uniforms.anchorPhase.value,.25);assert.equal(shader.uniforms.anchorMix.value,.15625);assert.equal(paint.inspect().resident,2);
  assert.equal(shader.uniforms.anchorMode.value,1);assert.equal(mesh.material.opacity,1);
  paint.update({segment:0,u:.25,arc:'raise'},r.source,true,{speaking:true,mouthFrame:2,reducedMotion:true});assert.equal(shader.uniforms.anchorMouth.value,0);
  for(let segment=0;segment<6;segment++){
   paint.update({segment,u:1,arc:'raise'},r.source,true);await paint.settle();paint.update({segment,u:1,arc:'raise'},r.source,true);
   assert.equal(paint.inspect().opacity,1);assert(paint.inspect().resident<=3);assert.equal(Object.keys(paint.inspect().failures).length,0);
  }
  let release;bitmapGate=new Promise(resolve=>{release=resolve});paint.update({segment:12,u:1,arc:'return'},r.source,true);await new Promise(resolve=>setTimeout(resolve,10));signal.abort();release();await paint.settle();
  assert.equal(paint.inspect().visible,false);assert.equal(paint.inspect().resident,0);assert.equal(r.members.size,0);assert(jobs>2);assert.equal(r.closed.length,decodes);assert(r.disposed.length>0);
 }finally{globalThis.fetch=oldFetch;globalThis.createImageBitmap=oldBitmap}
});

test('Gaussian optical-depth weights preserve native partial alpha on a uniform lattice',()=>{
 // Independent lattice integration: ordinary alpha multiplication overstates a
 // half-transparent pixel; a partition of log transmittance preserves it.
 for(const x of [0,.2,.5,.8])for(const y of [0,.35,.75])for(const alpha of [.1,.5,.9,1]){
  let transmission=1;
  for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){
   const dx=i-x,dy=j-y;if(Math.abs(dx)>2.7||Math.abs(dy)>2.7)continue;
   const weight=Math.exp(-.5*(dx*dx+dy*dy));
   transmission*=Math.max(1-alpha,1e-5)**(weight/6.20);
  }
  assert(Math.abs(1-transmission-alpha)<.009,`alpha ${alpha} at (${x},${y}) drifted`);
 }
});

test('shared renderer keeps actor-specific aspect and record layout in separate shader programs',async()=>{
 const oldFetch=globalThis.fetch,oldBitmap=globalThis.createImageBitmap,paints=[];
 const regular=JSON.parse(readFileSync(new URL('../assets/buergeramt/animation/archivbotin.json',import.meta.url)));let dimensions;
 globalThis.fetch=async url=>({ok:true,arrayBuffer:async()=>{const bytes=readFileSync(new URL(url));return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}});
 globalThis.createImageBitmap=async()=>({width:dimensions[0],height:dimensions[1],close(){}});
 try{
  const materials=[];
  for(const [data,rows] of [[manifest,30],[regular,26],[regular,27]]){
   dimensions=data.canvas_xy;const r=rig(),paired={count:rows*256,rows,stride:5,textures:[{},{},{}]};
   paints.push(await createPaintedAnchor({...r,manifest:data,paired,manifestUrl:new URL(`../assets/buergeramt/animation/${data.id}.json`,import.meta.url)}));materials.push([...r.members][0].material);
  }
  // The closures have identical text, which used to collide under Three's
  // default key even though their generated vertex shaders differ.
  assert.equal(materials[0].onBeforeCompile.toString(),materials[1].onBeforeCompile.toString());
  assert.notEqual(materials[0].customProgramCacheKey(),materials[1].customProgramCacheKey());
  assert.notEqual(materials[1].customProgramCacheKey(),materials[2].customProgramCacheKey());
 }finally{for(const paint of paints)paint.dispose();globalThis.fetch=oldFetch;globalThis.createImageBitmap=oldBitmap}
});

test('an invalid warp gain fails before allocating or loading paintings',async()=>{
 for(const gain of [-.1,1.01,Infinity,NaN]){const r=rig(),bad=structuredClone(manifest);bad.segments[0].paint_warp_gain=gain;
  await assert.rejects(createPaintedAnchor({...r,manifest:bad,manifestUrl:new URL('../assets/buergeramt/animation/clerk.json',import.meta.url)}),/warp gain/);assert.equal(r.members.size,0)}
});
