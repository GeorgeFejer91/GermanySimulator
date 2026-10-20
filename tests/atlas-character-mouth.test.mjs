import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createAtlasCharacterMouth} from '../atlas-character-mouth.js';

const profile={corners:[-1,1],crease:[0,0,0,0,0],open_upper:[0,-.1,-.2,-.1,0],open_lower:[0,.2,.4,.2,0],source_upper:[0,0,0,0,0],source_lower:[0,0,0,0,0],width:[0,0],teeth:0};
const registration=()=>({rect:[.6,.7,.1,.03],axes:[8,1,-.3,3],profile});
function fixture(){
 const texture=new T.Texture({width:256,height:320}),base=new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.08,depthWrite:true});
 const actor={id:'sandale-1',voiceId:'tourist-guenther-liegestuhl'},other={id:'sandale-2',voiceId:actor.voiceId};
 const grid={cols:2,rows:2,frameWidth:128,frameHeight:160,sourceSha256:'a'.repeat(64)};
 grid.mouthPaint={schemaVersion:1,sourceSha256:grid.sourceSha256,cell:[128,160],grid:[2,2],frames:[registration(),null,registration(),registration()]};
 const mesh=new T.Mesh(new T.PlaneGeometry(1,1),base),mouth=createAtlasCharacterMouth(T,mesh,actor);
 const speech={actorId:actor.id,voiceId:actor.voiceId,cueToken:{},speechStatus:'playing',mouthOpen:.8,paused:false};
 return{texture,base,actor,other,grid,mesh,mouth,speech};
}

test('native atlas mouth owns one material while keeping the shared texture and geometry',()=>{
 const f=fixture(),second=new T.Mesh(f.mesh.geometry,f.base),other=createAtlasCharacterMouth(T,second,f.other);
 assert.notEqual(f.mesh.material,f.base);assert.notEqual(f.mesh.material,second.material);
 assert.equal(f.mesh.material.map,f.texture);assert.equal(second.material.map,f.texture);
 assert.equal(f.mesh.material.depthWrite,true);assert.equal(f.mesh.material.alphaTest,.08);
 assert.equal(f.mouth.sync(f.grid,{spriteRow:1,spriteFrame:0},f.speech),true);
 assert.equal(other.sync(f.grid,{spriteRow:1,spriteFrame:0},f.speech),false,'same voice does not confer actor ownership');
 assert.equal(f.mouth.inspect().active,true);assert.equal(other.inspect().active,false);
});

test('registration follows the selected final texture cell, including mirrored geometry UVs',()=>{
 const f=fixture();f.mouth.sync(f.grid,{spriteRow:1,spriteFrame:0,spriteFlip:true},f.speech);
 const state=f.mouth.inspect();assert.deepEqual(state.rect,[.3,.35,.05,.015]);
 assert.deepEqual(state.axes,[8,1,-.3,3]);assert.equal(state.texture,f.texture);
 f.mouth.sync(f.grid,{spriteRow:0,spriteFrame:0},f.speech);
 assert.deepEqual(f.mouth.inspect().rect,[.3,.85,.05,.015]);
});

test('rear, missing, paused, cancelled, wrong-voice and stale cues close immediately',()=>{
 const f=fixture(),pose={spriteRow:1,spriteFrame:0};
 for(const [p,s,paused]of [[{spriteRow:0,spriteFrame:1},f.speech,false],[pose,null,false],[pose,{...f.speech,paused:true},false],[pose,{...f.speech,speechStatus:'finished'},false],[pose,{...f.speech,voiceId:'other'},false],[pose,{...f.speech,cueToken:null},false],[pose,f.speech,true],[{spriteRow:50,spriteFrame:0},f.speech,false]]){
  assert.equal(f.mouth.sync(f.grid,pose,f.speech),true);
  assert.equal(f.mouth.sync(f.grid,p,s,paused),false);assert.equal(f.mouth.inspect().active,false);assert.deepEqual(f.mouth.inspect().opening,[0,0,0,0]);
 }
});

test('source mismatch and malformed optional definitions retain a closed ordinary body',()=>{
 for(const change of [g=>g.sourceSha256='b'.repeat(64),g=>g.mouthPaint.frames.pop(),g=>delete g.mouthPaint.frames[0],g=>g.mouthPaint.frames[0].axes=[0,0,0,0],g=>g.mouthPaint.cell=[64,80]]){
  const f=fixture();change(f.grid);assert.equal(f.mouth.sync(f.grid,{spriteRow:0,spriteFrame:0},f.speech),false);
  assert.equal(f.mesh.material.map,f.texture);assert.equal(f.mouth.inspect().active,false);assert(f.mouth.inspect().definitionError);
 }
});

test('full-atlas replacement updates the existing owner and retirement never disposes shared paint',()=>{
 const f=fixture();let owned=0,shared=0;const material=f.mesh.material;
 material.addEventListener('dispose',()=>owned++);f.base.addEventListener('dispose',()=>shared++);f.texture.addEventListener('dispose',()=>shared++);
 f.mouth.sync(f.grid,{spriteRow:1,spriteFrame:0},f.speech);f.mesh.material.map.image={width:256,height:320};
 assert.equal(f.mouth.sync(f.grid,{spriteRow:1,spriteFrame:1},f.speech),true);assert.equal(f.mesh.material,material);
 f.mouth.dispose();f.mouth.dispose();assert.equal(owned,1);assert.equal(shared,0);assert.equal(f.mesh.material,f.base);
 assert.equal(f.mouth.sync(f.grid,{spriteRow:1,spriteFrame:0},f.speech),false);
});
