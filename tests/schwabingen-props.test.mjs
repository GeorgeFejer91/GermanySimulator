import test from 'node:test';
import assert from 'node:assert/strict';
import {schwabingenPropCue,schwabingenPropFrame,schwabingenHand,createSchwabingenProps} from '../schwabingen-props.js';
import {neighborFrame} from '../neighbor-sprites.js';
import * as T from '../assets/vendor/three/0.186.0/build/three.module.min.js';

const actor={id:'jwd-swabian',jwdRole:'swabian',x:780,y:4590};
const line=(cueId,extra={})=>({id:actor.id,active:true,cueId,cueToken:1,mediaTime:2,mediaDuration:12,speaking:true,...extra});

test('authored products and bird scenes follow cue identity, never translated text',()=>{
  for(const [id,kind] of [['schwabingen-weeds-law','bottle'],['schwabingen-weeds-method','scraper'],['schwabingen-broom-rota','rota'],['schwabingen-bird-calendar-note','calendar'],['schwabingen-hedge-release','blackbird'],['schwabingen-attendance-leaf','leaf']]){
    assert.equal(schwabingenPropCue(actor,line(id)).kind,kind);
    assert.equal(schwabingenPropCue(actor,line(id,{line:'unrelated English subtitle'})).kind,kind);
  }
  assert.equal(schwabingenPropCue(actor,line('heiko-paint-welcome')),null);
  assert.equal(schwabingenPropCue(actor,line('schwabingen-weeds-law',{id:'other'})),null);
  assert.equal(schwabingenPropCue({...actor,jwdRole:'parent'},line('schwabingen-weeds-law')),null);
  assert.equal(schwabingenPropCue(actor,line('schwabingen-weeds-law',{active:false})),null);
});

test('presentation follows real media or caption time, holds during pause, resets on replay',()=>{
  const state={};
  const waiting=schwabingenPropFrame(actor,state,line('schwabingen-weeds-law',{awaitingSpeech:true,mediaTime:0}));
  assert.equal(waiting.visible,false);
  const held=schwabingenPropFrame(actor,state,line('schwabingen-weeds-law'));
  assert.equal(held.kind,'bottle');assert.equal(held.row,9);assert.equal(held.frame,12);assert.equal(held.visible,true);
  assert.deepEqual(schwabingenPropFrame(actor,state,line('schwabingen-weeds-law',{paused:true,mediaTime:9})),held);
  const replay=schwabingenPropFrame(actor,state,line('schwabingen-weeds-law',{cueToken:2,mediaTime:0}));
  assert.equal(replay.frame,0);assert.equal(replay.visible,false);
  const caption=schwabingenPropFrame(actor,state,line('schwabingen-weeds-method',{speaking:false,mediaTime:0,captionTime:2}));
  assert.equal(caption.kind,'scraper');assert.equal(caption.frame,12);assert.equal(caption.visible,true);
  assert.equal(schwabingenPropFrame(actor,state,null),null);
  assert.equal(state.pose,null);
});

test('registered hand follows the actual painted shoulder arc without changing feet',()=>{
  const down=schwabingenHand(0),up=schwabingenHand(12),end=schwabingenHand(23);
  assert.deepEqual(down,end);assert.ok(up.x<down.x);assert.ok(up.y<down.y);
  assert.ok(Math.abs(Math.hypot(down.x-104,down.y-91)-Math.hypot(up.x-104,up.y-91))<1e-8);
});

test('blackbird enters, settles by its nest and reduced motion holds a stable bird',()=>{
  const state={},start=schwabingenPropFrame(actor,state,line('schwabingen-bird-listen',{mediaTime:.1}));
  const perched=schwabingenPropFrame(actor,state,line('schwabingen-bird-listen',{mediaTime:4}));
  assert.equal(start.kind,'blackbird');assert.ok(start.flight<perched.flight);assert.equal(perched.flight,1);
  const reduced=schwabingenPropFrame(actor,{},line('schwabingen-bird-listen',{mediaTime:.1}),true);
  assert.equal(reduced.flight,1);assert.equal(reduced.flap,0);
});

test('production neighbor animation keeps the prop hand and speech together through hold and cancellation',()=>{
  const playback={},cue=line('schwabingen-weeds-law',{mouthOpen:.8});
  const pose=neighborFrame(actor,playback,cue,.1,true);
  const speech=neighborFrame(actor,{}, {...cue,cueId:null},.1,true);
  assert.equal(pose.row,9);assert.equal(pose.frame,12);assert.equal(pose.prop.kind,'bottle');assert.ok(pose.mouthOpen>0);assert.equal(pose.mouthOpen,speech.mouthOpen);
  assert.deepEqual(neighborFrame(actor,playback,{...cue,mediaTime:7},5,false),pose);
  const cancelled=neighborFrame(actor,playback,null,.1,true);
  assert.equal(cancelled.prop,null);assert.notEqual(cancelled.row,9);assert.equal(cancelled.mouthOpen,0);
  const caption=neighborFrame(actor,playback,line('schwabingen-weeds-method',{speaking:false,captionTime:2}),.1,true);
  assert.equal(caption.prop.kind,'scraper');assert.equal(caption.row,9);
});

test('real Three objects are lazy, bounded, depth-tested and disposed exactly once',()=>{
  const host=new T.Group(),camera=new T.PerspectiveCamera(),props=createSchwabingenProps(T,actor,host,camera);
  props.sync(null,false);assert.equal(host.children.length,0);
  for(const id of ['schwabingen-weeds-law','schwabingen-weeds-method','schwabingen-broom-rota','schwabingen-bird-calendar-note','schwabingen-hedge-release','schwabingen-attendance-leaf'])props.sync(schwabingenPropFrame(actor,{},line(id)),true);
  const resources=new Set();host.traverse(o=>{if(o.isMesh){assert.equal(o.material.depthTest,true);assert.equal(o.material.depthWrite,true);resources.add(o.geometry);resources.add(o.material)}});
  const counts=new Map();for(const r of resources)r.addEventListener('dispose',()=>counts.set(r,(counts.get(r)||0)+1));
  const size=props.inspect().meshes;
  for(let i=0;i<10;i++)props.sync(schwabingenPropFrame(actor,{},line('schwabingen-weeds-law',{cueToken:i})),true);
  assert.equal(props.inspect().meshes,size);
  props.sync(null,true);assert.equal(props.inspect().visible,false);
  props.dispose();props.dispose();assert.equal(host.children.length,0);assert.equal(counts.size,resources.size);
  assert.ok([...counts.values()].every(n=>n===1));
  props.sync(schwabingenPropFrame(actor,{},line('schwabingen-weeds-law')),true);assert.equal(host.children.length,0);
});

test('blackbird nest meets the actual target hedge top instead of floating above it',()=>{
  const host=new T.Group(),props=createSchwabingenProps(T,actor,host,new T.PerspectiveCamera());
  props.sync(schwabingenPropFrame(actor,{},line('schwabingen-hedge-release',{mediaTime:4,cueTarget:{x:910,y:4700,height:.76}})),true);
  const nest=host.getObjectByName('Blackbird nest'),bounds=new T.Box3().setFromObject(nest);
  assert.ok(bounds.min.y<.76&&bounds.max.y>.76,JSON.stringify(bounds));
  props.dispose();
});

test('complete paint failure uses the actual procedural hand rather than the standing-paint registration',()=>{
  const host=new T.Group(),fallback=new T.Mesh(new T.PlaneGeometry(.9,1.8));host.userData.personFallback=fallback;
  const props=createSchwabingenProps(T,actor,host,new T.PerspectiveCamera());
  props.sync(schwabingenPropFrame(actor,{},line('schwabingen-weeds-law')),false);
  const object=host.getObjectByName('Schwabingen bottle');
  assert.ok(Math.abs(object.position.x-(79/96-.5)*.9)<1e-8);
  assert.ok(Math.abs(object.position.y-47/192*1.8)<1e-8);
  assert.equal(props.inspect().hand.source,'procedural');props.dispose();fallback.geometry.dispose();fallback.material.dispose();
});
