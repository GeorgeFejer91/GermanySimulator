import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const window={};
vm.runInNewContext(readFileSync(new URL('../street-wisdom.js',import.meta.url),'utf8'),{window});
const {definitions,nearbySpeaker,createCharacter}=window.StreetWisdom;
const actor=(index,x=0,y=0,extra={})=>({...definitions[index],wisdomId:definitions[index].id,x,y,...extra});

test('each rule has one immutable adviser with a current production voice',()=>{
  const cast=JSON.parse(readFileSync(new URL('../For-AI/VOICE-CAST.json',import.meta.url),'utf8'));
  assert.equal(definitions.length,3);assert.ok(Object.isFrozen(window.StreetWisdom));assert.ok(Object.isFrozen(definitions));
  assert.equal(new Set(definitions.map(d=>d.id)).size,3);assert.equal(new Set(definitions.map(d=>d.voiceId)).size,3);
  assert.deepEqual(Array.from(definitions.flatMap(d=>d.ruleIndices)).sort((a,b)=>a-b),Array.from({length:11},(_,i)=>i));
  for(const d of definitions){
    assert.ok(Object.isFrozen(d)&&Object.isFrozen(d.ruleIndices));
    assert.equal(cast.roleProfiles.find(p=>p.voiceId===d.voiceId).fullName,d.fullName);
    assert.ok(cast.productionVoices[d.voiceId]?.profileId);assert.equal(d.profileId,undefined,'UUID authority stays in the cast');
  }
});

test('nearby selection is bounded, identity-bound and deterministic',()=>{
  const waltraud=actor(0,120),horst=actor(1,-120),dietmar=actor(2,181);
  assert.equal(nearbySpeaker([horst,dietmar,waltraud],{x:0,y:0},25),waltraud,'ties follow the fixed cast order');
  assert.equal(nearbySpeaker([actor(1,180)],{x:0,y:0},25)?.voiceId,definitions[1].voiceId,'boundary is included');
  assert.equal(nearbySpeaker([dietmar],{x:0,y:0},25),null);
  assert.equal(nearbySpeaker([actor(0,1,0,{voiceId:definitions[1].voiceId}),actor(1,1,0,{removed:true}),actor(2,1,0,{jailed:true})],{x:0,y:0},25),null);
  assert.equal(nearbySpeaker([actor(0,1,0,{arrested:true}),horst],{x:0,y:0},25),horst,'an arrested adviser cannot offer a rule');
  assert.equal(nearbySpeaker([waltraud],{x:NaN,y:0},25),null);assert.equal(nearbySpeaker([waltraud],{x:0,y:0},NaN),null);
});

test('cooldown belongs to an accepted encounter and selection does not mutate actors',()=>{
  const waltraud=actor(0,10,0,{wisdomSpokeAt:1}),horst=actor(1,20),before=JSON.stringify(waltraud);
  assert.equal(nearbySpeaker([waltraud,horst],{x:0,y:0},24.9),horst);
  assert.equal(nearbySpeaker([waltraud,horst],{x:0,y:0},25),waltraud);
  assert.equal(JSON.stringify(waltraud),before);assert.equal(horst.wisdomSpokeAt,undefined);
});

test('factory reuses city materials and supplies the existing gait contract without external assets',()=>{
  class Group{constructor(){this.children=[];this.userData={};this.position={set:(x,y,z)=>Object.assign(this.position,{x,y,z})};this.rotation={x:0,y:0,z:0}}add(child){this.children.push(child);child.parent=this}}
  class Mesh extends Group{constructor(geometry,material){super();this.geometry=geometry;this.material=material}}
  class Geometry{constructor(...parameters){this.parameters=parameters}}
  class Material{constructor(options){Object.assign(this,options)}}
  const T={Group,Mesh,BoxGeometry:Geometry,CylinderGeometry:Geometry,SphereGeometry:Geometry,TorusGeometry:Geometry,MeshStandardMaterial:Material};
  const skin={},dark={},metal={},shared={skin,dark,metal},models=definitions.map(d=>createCharacter(T,d,shared));
  for(const [i,model] of models.entries()){
    assert.equal(model.name,definitions[i].fullName);assert.equal(model.userData.voiceId,definitions[i].voiceId);
    assert.equal(model.userData.wisdomId,definitions[i].id);assert.equal(model.userData.streetWisdom,true);
    for(const key of ['ll','rl','la','ra'])assert.ok(model.userData[key] instanceof Group&&model.userData[key].children.length===2);
    assert.ok(model.children.some(part=>part.material===skin));assert.ok(model.children.length<35,'bounded procedural person');
    assert.equal(model.renderOrder,undefined,'normal world depth remains in force');
  }
  assert.equal(createCharacter(T,definitions[0],shared).children[0].material,models[0].children[0].material,'coat material is shared');
  assert.throws(()=>createCharacter(T,{id:'unbound'}),/Unknown street adviser/);
});
