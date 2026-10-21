import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {attachStreetCharacterMouth,validateStreetMouthRegistration} from '../street-character-mouth.js';

const profile=JSON.parse(readFileSync(new URL('../assets/buergeramt/animation/clerk.json',import.meta.url))).states[0].mouth_profile;
const registration=()=>({rect:[.41,.72,.02,.008],axes:[18,2,-1,7],profile:structuredClone(profile)});
function fixture(){
 const allocations={vectors:0,matrices:0};
 class Vector4{constructor(){allocations.vectors++}fromArray(a){[this.x,this.y,this.z,this.w]=a;return this}set(x,y,z,w){Object.assign(this,{x,y,z,w});return this}}
 class Vector3{constructor(){allocations.vectors++}fromArray(a){[this.x,this.y,this.z]=a;return this}}
 class Matrix4{constructor(){allocations.matrices++}fromArray(a){this.elements=a.slice();return this}}
 const map={},material={map,needsUpdate:false,onBeforeCompile(shader){shader.uniforms.authored={value:7}},customProgramCacheKey(){return 'existing-paint'}};
 const T={Vector3,Vector4,Matrix4,ShaderChunk:{map_fragment:'#ifdef USE_MAP\nvec4 sampledDiffuseColor = texture2D( map, vMapUv );\n#ifdef DECODE_VIDEO_TEXTURE\nsampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );\n#endif\ndiffuseColor *= sampledDiffuseColor;\n#endif'}};
 const shader=()=>({uniforms:{},fragmentShader:'#include <common>\nvoid main(){\n#include <map_fragment>\n}',vertexShader:'unchanged vertex'});
 return{T,material,map,shader,allocations};
}
const shape=shader=>['x','y','z','w'].map(key=>shader.uniforms.streetLipShape.value[key]);

test('the material paints through its existing map chunk and shares persistent uniforms',()=>{
 const f=fixture(),priorCompile=f.material.onBeforeCompile,priorKey=f.material.customProgramCacheKey;
 const mouth=attachStreetCharacterMouth(f.T,f.material),source=registration(),shader=f.shader();
 mouth.sync({texture:f.map,registration:source,opening:[.8,.2,.3,.1],speaking:true});
 f.material.onBeforeCompile(shader);
 assert.equal(shader.uniforms.authored.value,7);assert.match(f.material.customProgramCacheKey(),/^existing-paint:street-mouth-/);
 assert.equal(shader.vertexShader,'unchanged vertex');assert.match(shader.fragmentShader,/amtMouthPaintFrame\(map,vMapUv,streetLipRect,streetLipShape,streetLipAxes,/);
 assert.match(shader.fragmentShader,/if\(speaking<\.5\)return original;/);
 assert.match(shader.fragmentShader,/sRGBTransferEOTF\( sampledDiffuseColor \)/);assert.match(shader.fragmentShader,/diffuseColor \*= sampledDiffuseColor/);
 assert.equal(shader.uniforms.streetSpeaking.value,1);assert.deepEqual(shape(shader),[.8,.2,.3,.1]);
 assert.deepEqual(shader.uniforms.streetLipAxes.value,new f.T.Vector4().fromArray(source.axes));
 const compiledAgain=f.shader();f.material.onBeforeCompile(compiledAgain);
 assert.equal(compiledAgain.uniforms.streetLipShape,shader.uniforms.streetLipShape);
 mouth.dispose();assert.equal(f.material.onBeforeCompile,priorCompile);assert.equal(f.material.customProgramCacheKey,priorKey);
});

test('owned zero cues close pre-open paint while absent, paused and stale sources retain exact paint',()=>{
 const f=fixture(),mouth=attachStreetCharacterMouth(f.T,f.material),source=registration(),shader=f.shader();f.material.onBeforeCompile(shader);
 const sync=(extra={})=>mouth.sync({texture:f.map,registration:source,opening:0,speaking:true,...extra});
 sync();assert.equal(shader.uniforms.streetSpeaking.value,1);assert.deepEqual(shape(shader),[0,0,0,0]);
 for(const extra of [{speaking:false},{paused:true},{registration:null},{opening:undefined},{texture:{}},{texture:null}]){
  sync(extra);assert.equal(shader.uniforms.streetSpeaking.value,0);assert.deepEqual(shape(shader),[0,0,0,0]);
 }
 sync();f.material.map={};mouth.sync({texture:f.map,registration:source,opening:.5,speaking:true});assert.equal(shader.uniforms.streetSpeaking.value,0);
 f.material.map=f.map;sync({opening:[2,-1,.5,0]});assert.deepEqual(shape(shader),[1,0,.5,0]);
});

test('registrations reject unsafe frames and disconnected profiles without retaining a prior cue',()=>{
 assert.equal(validateStreetMouthRegistration(null,'rear'),null);
 const f=fixture(),mouth=attachStreetCharacterMouth(f.T,f.material),shader=f.shader();f.material.onBeforeCompile(shader);
 for(const mutate of [r=>r.rect[0]=NaN,r=>r.rect[2]=0,r=>delete r.rect[1],r=>r.axes=[1,1,2,2],r=>r.axes[1]=Infinity,r=>r.profile.open_lower[4]+=.1,r=>delete r.profile]){
  const bad=registration();mutate(bad);assert.throws(()=>validateStreetMouthRegistration(bad,'bad-frame'),/mouth|lip/);
  mouth.sync({texture:f.map,registration:registration(),opening:1,speaking:true});
  assert.throws(()=>mouth.sync({texture:f.map,registration:bad,opening:1,speaking:true}),/mouth|lip/);
  assert.equal(shader.uniforms.streetSpeaking.value,0);
 }
 for(const opening of [NaN,[0,0,0],[0,1,Infinity,0],'0'])assert.throws(()=>mouth.sync({texture:f.map,registration:registration(),opening,speaking:true}),/cue/);
});

test('repeated frame sync caches immutable profiles and never allocates new GPU values',()=>{
 const f=fixture(),mouth=attachStreetCharacterMouth(f.T,f.material),source=registration();let reads=0;
 const crease=source.profile.crease;Object.defineProperty(source.profile,'crease',{get(){reads++;return crease}});
 mouth.sync({texture:f.map,registration:source,opening:.6,speaking:true});const initialReads=reads,initialAllocations={...f.allocations};
 for(let i=0;i<100;i++){source.rect[0]=.4+i*.00001;mouth.sync({texture:f.map,registration:source,opening:.2,speaking:true})}
 assert.equal(reads,initialReads);assert.deepEqual(f.allocations,initialAllocations);
 const shader=f.shader();f.material.onBeforeCompile(shader);assert.equal(shader.uniforms.streetLipRect.value.x,source.rect[0]);
 assert.equal(mouth.inspect().registration,source);assert.equal(mouth.inspect().texture,f.map);
});

test('disposal is idempotent and does not remove a newer material owner',()=>{
 const f=fixture(),mouth=attachStreetCharacterMouth(f.T,f.material),shader=f.shader();f.material.onBeforeCompile(shader);
 mouth.sync({texture:f.map,registration:registration(),opening:1,speaking:true});
 const ownedCompile=f.material.onBeforeCompile,laterCompile=function(shader){ownedCompile.call(this,shader)},laterKey=()=> 'new-owner';
 f.material.onBeforeCompile=laterCompile;f.material.customProgramCacheKey=laterKey;mouth.dispose();mouth.dispose();
 assert.equal(f.material.onBeforeCompile,laterCompile);assert.equal(f.material.customProgramCacheKey,laterKey);assert.equal(shader.uniforms.streetSpeaking.value,0);
 assert.equal(mouth.sync({opening:1}),false);assert.equal(mouth.inspect().disposed,true);
});

test('attachment rejects unsupported shaders and duplicate ownership explicitly',()=>{
 const f=fixture(),compile=f.material.onBeforeCompile;f.T.ShaderChunk.map_fragment='unsupported';
 assert.throws(()=>attachStreetCharacterMouth(f.T,f.material),/Unsupported/);assert.equal(f.material.onBeforeCompile,compile);
 f.T.ShaderChunk.map_fragment='vec4 sampledDiffuseColor=texture2D(map,vMapUv);';
 const mouth=attachStreetCharacterMouth(f.T,f.material);
 assert.throws(()=>attachStreetCharacterMouth(f.T,f.material),/already owned/);
 assert.throws(()=>f.material.onBeforeCompile({uniforms:{},fragmentShader:'no map chunk'}),/map fragment/);
 mouth.dispose();assert.doesNotThrow(()=>attachStreetCharacterMouth(f.T,f.material).dispose());
});

test('the actual vendored Three map chunk retains all color and video operations around connected paint',()=>{
 const texture=new THREE.Texture(),material=new THREE.MeshBasicMaterial({map:texture}),mouth=attachStreetCharacterMouth(THREE,material),source=registration();
 mouth.sync({texture,registration:source,opening:[.7,.1,.2,0],speaking:true});
 const shader={uniforms:{},vertexShader:THREE.ShaderLib.basic.vertexShader,fragmentShader:THREE.ShaderLib.basic.fragmentShader};
 material.onBeforeCompile(shader);
 const original=THREE.ShaderChunk.map_fragment;
 const sample=/texture2D\(\s*map\s*,\s*vMapUv\s*\)/;
 const oldSample=original.match(sample)[0],replacement=shader.fragmentShader.match(/amtMouthPaintFrame\(map,vMapUv,[^;]+/)[0];
 assert(shader.fragmentShader.includes(original.replace(oldSample,replacement)),'the actual chunk changes only its texture sample');
 assert.equal(shader.uniforms.streetSpeaking.value,1);assert.deepEqual(mouth.inspect().axes,source.axes);
 assert.deepEqual(shader.uniforms.streetLipCurves.value.elements,source.profile.crease.slice(0,4).concat(source.profile.open_upper.slice(0,4),source.profile.open_lower.slice(0,4),source.profile.source_upper.slice(0,4)));
 mouth.dispose();material.dispose();texture.dispose();
});
