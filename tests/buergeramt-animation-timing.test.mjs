import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './amt-harness.mjs';

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
