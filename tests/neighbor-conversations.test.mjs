import test from 'node:test';
import assert from 'node:assert/strict';
import * as animation from '../neighbor-sprites.js';

test('every visible speaking face has a pose-bound mouth including side walks and chores',()=>{
 assert.equal(typeof animation.neighborMouthProfile,'function');
 for(const role of ['parent','watcher','swabian','child']){
  const actor={jwdRole:role};
  for(const row of [0,1,3,4,6,7,8,9,10,11])for(const frame of [0,3,7]){
   const profile=animation.neighborMouthProfile(actor,{row,frame});
   assert.ok(profile,`${role} row ${row} frame ${frame}`);
   assert.ok(profile[1]>profile[0]&&profile[3]>0);
  }
  assert.equal(animation.neighborMouthProfile(actor,{row:2,frame:0}),null,'rear has no visible mouth');
 }
});

test('Heiko takes out, reads, writes and stows the notebook without borrowing another speaker',()=>{
 const actor={id:'heiko',jwdRole:'parent',x:0,y:0,jwdGesture:'notebook',jwdGestureAge:0,jwdGestureDuration:10},p={};
 const d={id:'heiko',active:true,speaking:true,cueToken:1,mediaTime:.3,mouthOpen:.8};
 assert.equal(animation.neighborFrame(actor,p,d,0,true).row,12);
 actor.jwdGestureAge=.7;
 assert.equal(animation.neighborFrame(actor,p,d,.1,true).row,13);
 actor.jwdGestureAge=8.5;
 const writing=animation.neighborFrame(actor,p,d,.1,true);
 assert.equal(writing.row,14);assert.ok(writing.mouthOpen>0);
 assert.deepEqual(animation.neighborFrame(actor,p,{...d,paused:true},2,true),writing);
 actor.jwdGestureAge=10;
 assert.equal(animation.neighborFrame(actor,p,d,.1,true).row,15);
 const ended=animation.neighborFrame(actor,p,null,.1,true);
 assert.equal(ended.mouthOpen,0);assert.ok(ended.row<12,'cancellation releases notebook');
 const other={...actor,jwdRole:'watcher'};
 assert.ok(animation.neighborFrame(other,{},d,.1,true).row<12,'only Heiko owns notebook paint');
});

test('moving and caption-only notebook performance preserve gait and closed lips',()=>{
 const actor={id:'heiko',jwdRole:'parent',x:0,y:0,jwdGesture:'notebook',jwdGestureAge:2,jwdGestureDuration:10},p={};
 const caption={id:'heiko',active:true,speaking:false,cueToken:1,mediaTime:2,mouthOpen:1};
 const reading=animation.neighborFrame(actor,p,caption,0,true);
 assert.equal(reading.row,13);assert.equal(reading.mouthOpen,0);
 actor.x=3;
 assert.equal(animation.neighborFrame(actor,p,caption,.1,true).row,1);
});

test('queued notebook speech waits to tick, and native completion stows it',()=>{
 const actor={id:'heiko',jwdRole:'parent',x:0,y:0,jwdGesture:'notebook',jwdGestureAge:12,jwdGestureDuration:10};
 const d={id:'heiko',active:true,speaking:false,awaitingSpeech:true,mediaTime:0};
 assert.equal(animation.neighborFrame(actor,{},d,0,true).row,13,'queued audio can only read, never mark completion');
 assert.equal(animation.neighborFrame(actor,{},{...d,awaitingSpeech:false,lineComplete:true},0,true).row,15);
 const p={};animation.neighborFrame(actor,p,d,0,true);actor.jwdGesture=null;
 const next=animation.neighborFrame(actor,p,{...d,awaitingSpeech:false},.1,true);
 assert.equal(next.state,'listen');assert.ok(next.row<12);
});
