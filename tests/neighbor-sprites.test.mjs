import test from 'node:test';
import assert from 'node:assert/strict';
import {neighborFrame,createNeighborSprite} from '../neighbor-sprites.js';

test('neighbor gait follows accepted displacement and plants when blocked',()=>{
  const actor={id:'jwd-parent',x:100,y:100,jwdWorking:false},playback={};
  neighborFrame(actor,playback,null,0,true);
  actor.x+=7;
  const moved=neighborFrame(actor,playback,null,1/60,true);
  assert.equal(moved.row,1);assert.equal(moved.moving,true);
  const distance=playback.distance;
  const held=neighborFrame(actor,playback,null,1/60,true);
  assert.equal(held.moving,false);assert.equal(held.row,4);
  assert.equal(playback.distance,distance);
});

test('only actual owned speech uses the talk row; cancellation returns to painted idle',()=>{
  const actor={id:'jwd-watcher',x:100,y:100,jwdWorking:true},playback={};
  const idle=neighborFrame(actor,playback,{id:'other'},.1,true);assert.equal(idle.visible,true);assert.equal(idle.row,4);assert.equal(idle.mouthOpen,0);
  const owned=neighborFrame(actor,playback,{id:actor.id,active:true,speaking:true,cueToken:'one',mediaTime:.2,mouthOpen:.8},.1,true);
  assert.equal(owned.row,5);assert.equal(owned.visible,true);
  assert.equal(neighborFrame(actor,playback,null,.1,true).state,'release');
  assert.equal(neighborFrame(actor,playback,null,.3,true).frame,0);
  const returned=neighborFrame(actor,playback,null,.01,true);assert.equal(returned.visible,true);assert.equal(returned.state,'idle');assert.equal(returned.mouthOpen,0);
});

test('all three working residents retain animated painted idle without phantom walking',()=>{
 for(const [id,jwdRole] of [['jwd-parent','parent'],['jwd-watcher','watcher'],['jwd-swabian','swabian']]){
  const actor={id,jwdRole,x:0,y:0,jwdWorking:true},playback={};
  const first=neighborFrame(actor,playback,null,0,true),next=neighborFrame(actor,playback,null,.25,true);
  assert.equal(next.visible,true);assert.equal(next.row,4);assert.notEqual(next.frame,first.frame);assert.equal(next.moving,false);assert.equal(playback.distance,0);
 }
});

test('queued speech performs entry then listens; actual start preempts greeting',()=>{
  const actor={id:'neighbor',x:0,y:0},playback={},dialogue={id:'neighbor',active:true,speaking:false};
  assert.equal(neighborFrame(actor,playback,dialogue,0,true).state,'settle');
  assert.equal(neighborFrame(actor,playback,dialogue,.15,true).state,'look');
  assert.equal(neighborFrame(actor,playback,dialogue,.21,true).frame,15);
  assert.equal(neighborFrame(actor,playback,dialogue,.01,true).state,'greet');
  assert.equal(neighborFrame(actor,playback,dialogue,.36,true).frame,15);
  assert.equal(neighborFrame(actor,playback,dialogue,.01,true).state,'listen');
  dialogue.speaking=true;dialogue.cueToken='owned';dialogue.mediaTime=.2;dialogue.mouthOpen=1;
  assert.equal(neighborFrame(actor,playback,dialogue,.01,true).state,'talk');
});

test('recorded silence closes lips; pause holds media pose; next cue cannot inherit opening',()=>{
  const actor={id:'neighbor',x:0,y:0},playback={};
  const dialogue={id:'neighbor',active:true,speaking:true,cueToken:'a',mediaTime:.5,mouthOpen:1};
  const open=neighborFrame(actor,playback,dialogue,.1,true);assert.ok(open.frame>0);
  dialogue.paused=true;dialogue.mediaTime=2;dialogue.mouthOpen=0;
  assert.equal(neighborFrame(actor,playback,dialogue,1,true).frame,open.frame);
  dialogue.paused=false;assert.equal(neighborFrame(actor,playback,dialogue,.1,true).frame,0);
  dialogue.cueToken='b';dialogue.mediaTime=0;dialogue.mouthOpen=1;
  assert.equal(neighborFrame(actor,playback,dialogue,.1,true).frame,0);
  dialogue.speaking=false;assert.equal(neighborFrame(actor,playback,dialogue,.1,true).row,6);
});

test('return displacement preempts planted release and continues accepted distance phase',()=>{
  const actor={id:'neighbor',x:0,y:0},playback={};
  neighborFrame(actor,playback,{id:actor.id,active:true,speaking:false},0,true);
  actor.x=3;
  const pose=neighborFrame(actor,playback,null,.1,true);assert.equal(pose.state,'walk');assert.equal(pose.row,1);
  assert.equal(playback.distance,3);
});

test('caption ownership alone never animates speech; reduced motion retains meaningful lip cues',()=>{
  const actor={id:'neighbor',x:0,y:0},playback={};
  const caption={id:actor.id,active:true,speaking:false,cueToken:'caption',mediaTime:1,mouthOpen:1};
  assert.notEqual(neighborFrame(actor,playback,caption,.1,true).row,5);
  const spoken={...caption,speaking:true,cueToken:'heard',line:'Hallo',mediaTime:.3};
  const pose=neighborFrame(actor,playback,spoken,.1,true,true);
  assert.equal(pose.row,5);assert.ok(pose.frame>0);
  assert.equal(neighborFrame(actor,playback,{...spoken,speaking:false},.1,true).cueToken,null);
});

test('paused walkers hold their actual facing and gait cell while cancellation can still close speech',()=>{
  const actor={id:'neighbor',x:0,y:0},playback={};
  neighborFrame(actor,playback,null,0,true);actor.x=3;
  const walking=neighborFrame(actor,playback,null,.1,true);
  assert.deepEqual(neighborFrame(actor,playback,null,5,false),walking);
  const dialogue={id:actor.id,active:true,speaking:true,cueToken:'a',mediaTime:.2,mouthOpen:1};
  neighborFrame(actor,playback,dialogue,.1,true);
  const ended=neighborFrame(actor,playback,{...dialogue,speaking:false},5,false);
  assert.equal(ended.talking,false);assert.equal(ended.mouthOpen,0);assert.equal(ended.row,6);
});

test('paused and hidden animation clocks do not advance; reduced idle remains planted',()=>{
  const actor={id:'jwd-swabian',x:100,y:100,jwdWorking:false},playback={};
  neighborFrame(actor,playback,null,.1,true);
  const time=playback.time;
  neighborFrame(actor,playback,null,10,false);
  assert.equal(playback.time,time);
  assert.equal(neighborFrame(actor,playback,null,.1,true,true).frame,0);
});

test('actual sprite sync respects case-file pause across idle, walk, entry and release',()=>{
  const previousDocument=globalThis.document;
  globalThis.document={hidden:false};
  try{
    const actor={id:'neighbor',jwdRole:'parent',x:0,y:0,jwdWorking:false};
    const host={children:[],position:{x:0,z:0}};
    const sprite=createNeighborSprite({},actor,host,()=>{},{});
    const hud={started:true,busy:false,paused:false};
    sprite.sync(0,hud,null,false);sprite.sync(.2,hud,null,false);
    hud.paused=true;const idle=sprite.inspect();
    sprite.sync(.4,hud,null,false);sprite.sync(.6,hud,null,false);
    assert.deepEqual(sprite.inspect(),idle);
    hud.paused=false;actor.x=3;sprite.sync(.7,hud,null,false);
    hud.paused=true;const walk=sprite.inspect();sprite.sync(.9,hud,null,false);
    assert.deepEqual(sprite.inspect(),walk);
    hud.paused=false;
    const dialogue={id:actor.id,active:true,speaking:false};
    sprite.sync(1,hud,dialogue,false);hud.paused=true;const entry=sprite.inspect();
    sprite.sync(1.4,hud,dialogue,false);assert.deepEqual(sprite.inspect(),entry);
    const speech={...dialogue,speaking:true,cueToken:'owned',mediaTime:.2,mouthOpen:1};
    hud.paused=false;sprite.sync(1.5,hud,speech,false);hud.paused=true;
    sprite.sync(1.7,hud,{...speech,speaking:false},false);
    assert.equal(sprite.inspect().state,'listen');assert.equal(sprite.inspect().mouthOpen,0);
    sprite.sync(1.8,hud,null,false);const release=sprite.inspect();
    assert.equal(release.state,'release');sprite.sync(2.2,hud,null,false);
    assert.deepEqual(sprite.inspect(),release);
    sprite.dispose();
  }finally{
    if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
  }
});
