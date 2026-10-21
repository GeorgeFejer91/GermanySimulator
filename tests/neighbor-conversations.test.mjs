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

test('profile and chore openings stay inside independently marked encoded lip corners',()=>{
 // Bounds marked on the original 128×192 cells, not inferred from the shader.
 const lips={parent:[[91,100,69,71],[79,88,61,63]],watcher:[[92,102,67,69],[57,71,58.5,60.5]],swabian:[[81,92,53,55],[71,85,56,58]],child:[[78,86,60,62],[54,71,60.5,62]]};
 for(const [role,bounds]of Object.entries(lips))for(const [i,row]of [1,11].entries()){
  const [left,right,low,high]=bounds[i],p=animation.neighborMouthProfile({jwdRole:role},{row,frame:0});
  assert.ok(p[0]>=left&&p[1]<=right&&p[2]>=low&&p[2]<=high,`${role} row ${row} stays on its painted lip crease: ${p}`);
  if(row===1){const mirror=animation.neighborMouthProfile({jwdRole:role},{row:3,frame:0});assert.deepEqual(mirror,[128-p[1],128-p[0],p[2],p[3]])}
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

test('Heiko keeps writing while Hartmut owns the spoken cue, with closed listening lips',()=>{
 const actor={id:'heiko',jwdRole:'parent',x:0,y:0,jwdGesture:'notebook-write',jwdGestureAge:3,jwdNotebookSpeaker:'hartmut'};
 const d={id:'hartmut',active:true,speaking:true,cueToken:8,mediaTime:2,mediaDuration:12,mouthOpen:1};
 const p={},first=animation.neighborFrame(actor,p,d,.1,true);
 assert.equal(first.row,14);assert.equal(first.mouthOpen,0);assert.equal(first.cueToken,null);
 d.mediaTime+=.5;const next=animation.neighborFrame(actor,p,d,.1,true);assert.equal(next.row,14);assert.notEqual(next.frame,first.frame);
 assert.deepEqual(animation.neighborFrame(actor,p,{...d,paused:true,mediaTime:4},1,true),next);
 assert.ok(animation.neighborFrame(actor,p,null,.1,true).row<12,'lost dialogue owner releases writing');
});

test('quiet owned speech has a salient aperture without opening silence or moving the head source',()=>{
 const actor={id:'parent',jwdRole:'parent',x:0,y:0},d={id:'parent',active:true,speaking:true,cueToken:1,mediaTime:1,mediaDuration:5,mouthOpen:.16};
 const pose=animation.neighborFrame(actor,{},d,.1,true);assert.ok(pose.mouthOpen>.3);
 const profile=animation.neighborMouthProfile(actor,pose);assert.ok(profile&&profile[3]>=3.5);
 assert.equal(animation.neighborFrame(actor,{},{...d,mouthOpen:0},.1,true).mouthOpen,0);
});

test('Heiko keeps the already held notebook when speech returns from Hartmut',()=>{
 const actor={id:'heiko',jwdRole:'parent',x:0,y:0,jwdGesture:'notebook-write',jwdGestureAge:2,jwdNotebookSpeaker:'hartmut'},p={};
 animation.neighborFrame(actor,p,{id:'hartmut',active:true,speaking:true,mediaTime:2,mediaDuration:12},.1,true);
 actor.jwdGesture='notebook';actor.jwdGestureAge=0;actor.jwdGestureDuration=12;
 const pose=animation.neighborFrame(actor,p,{id:'heiko',active:true,speaking:false,awaitingSpeech:true,mediaTime:0},.1,true);
 assert.equal(pose.row,13,'the notebook stays out instead of jumping back into his pocket');
});
