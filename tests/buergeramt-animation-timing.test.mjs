import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {harness,source} from './amt-harness.mjs';

function reactions(dt){
 const h=harness();h.enter();
 const active=new Map(),completed=[];
 for(let i=0;i<Math.ceil(15/dt);i++){
  h.level.update(dt);
  for(const actor of h.level.characters){
   let clip=active.get(actor.id);
   if(!clip||clip.mode!==actor.mode){
    if(clip?.mode==='flinch')completed.push(clip);
    clip={id:actor.id,mode:actor.mode,frames:[],time:0,x:actor.x,z:actor.z};
    active.set(actor.id,clip);
   }
   if(actor.mode==='flinch'){
    clip.time+=dt;clip.frames.push(actor.frame);
    assert.ok(Math.hypot(actor.x-clip.x,actor.z-clip.z)<1e-9,'reaction remains planted');
    assert.ok(actor.phase>=0&&actor.phase<1,'one-shot phase stays in its clip');
   }
  }
 }
 return completed;
}

for(const dt of [1/60,1/30,.1])test(`queue reactions play once from their own start at dt=${dt}`,()=>{
 const clips=reactions(dt);
 assert.ok(clips.length>=6,'exercise different actors and differently timed calls');
 for(const clip of clips){
  assert.ok(Math.abs(clip.time-.5)<dt+1e-8,'retain authored half-second duration');
  assert.ok(clip.frames[0]<=Math.floor(dt/.5*8),'begin at entry, with only update overshoot');
  assert.ok(clip.frames.every((frame,i)=>!i||frame>=clip.frames[i-1]),'never wrap mid-reaction');
  if(dt<.1)assert.deepEqual([...new Set(clip.frames)],[0,1,2,3,4,5,6,7],'display all eight cells at normal update rates');
 }
});

test('dialogue freezes other actor clips and replay clears action phase',()=>{
 const h=harness();h.enter();h.moveTo(3.4,1.2);h.level.interact();
 assert.equal(h.level.stage,'character');
 const speaker=h.level.characterMood.id;
 const before=h.level.characters.filter(actor=>actor.id!==speaker);
 h.advanceGame(2);
 assert.deepEqual(h.level.characters.filter(actor=>actor.id!==speaker),before);
 h.action();h.advanceGame(.2);
 assert.ok(h.level.characters.some(actor=>actor.mode==='walk'||actor.phase>0));
 h.level.replay(h.config);
 assert.ok(h.level.characters.every(actor=>actor.mode==='work'&&actor.phase===0&&actor.frame===0));
});

for(const dt of [1/60,1/30,.1])test(`a blocked walker keeps its queued reaction at dt=${dt}`,()=>{
 const h=harness();
 // Expose fixture state only inside the VM; all action/collision functions are
 // the production implementation and no debug API is shipped to the browser.
 const code=source('buergeramt.js').replace(/\}\)\(\);\s*$/,
  'window.__reactionProbe={characters,view,reactToCall,setStage,setQueueIndex:n=>queueIndex=n};})();');
 assert.ok(code.includes('window.__reactionProbe='));
 vm.runInContext(code,h.context);
 const probe=h.window.__reactionProbe,level=h.window.BuergeramtLevel;
 level.open(h.config);probe.setStage('waiting');probe.setQueueIndex(2);
 const actor=probe.characters[2];
 actor.mode='walk';actor.sequence=[];actor.priority=0;actor.pending=false;actor.stride=3.7;
 const [tx,tz]=actor.route.points[actor.target],distance=Math.hypot(tx-actor.x,tz-actor.z);
 probe.view.x=actor.x+(tx-actor.x)/distance*.3;probe.view.z=actor.z+(tz-actor.z)/distance*.3;
 const origin=[actor.x,actor.z];probe.reactToCall();
 assert.equal(actor.pending,true);
 level.update(dt);
 assert.equal(actor.pending,false);
 assert.equal(actor.mode,'look','blocked motion must start the queued planted action');
 const modes=new Set(),flinchFrames=new Set();
 for(let elapsed=0;elapsed<1.7-1e-9;elapsed+=dt){
  const state=level.characters.find(item=>item.id===actor.id);modes.add(state.mode);
  if(state.mode==='flinch')flinchFrames.add(state.frame);
  assert.deepEqual([state.x,state.z],origin,'the blocked reaction never advances its root');
  level.update(dt);
 }
 assert.deepEqual([...modes],['look','flinch','work']);
 if(dt<.1)assert.deepEqual([...flinchFrames],[0,1,2,3,4,5,6,7]);
});
