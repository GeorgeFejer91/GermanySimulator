import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuizHarness} from './quiz-harness.mjs';

function fixture(vx=13,vy=0){
 const f=createQuizHarness(),{actor}=f.knownActor();
 Object.assign(actor,{vx,vy});f.scope.player.x=200;f.state.quizApproach=actor;
 f.state.quizApproachQuestion=f.seedQuestion();return{...f,actor};
}
test('quiz approach walks briskly using actual distance instead of sprinting the short stride',()=>{
 for(const [vx,vy,speed]of [[13,0,18.2],[0,-10,14],[100,0,24],[0,0,14]]){
  const f=fixture(vx,vy);f.scope.advanceApproach(.1);
  assert.ok(Math.abs(f.actor.x-speed*.1)<1e-9,`expected ${speed} units/s`);
  assert.equal(f.actor.vx,vx);assert.equal(f.actor.vy,vy);
 }
});
test('walking approach still reaches a waiting player before losing interest',()=>{
 const f=fixture();
 for(let i=0;i<150&&!f.state.quizQuestion;i++)f.scope.advanceApproach(.1);
 assert.equal(f.state.quizNpc,f.actor);assert.ok(f.state.quizQuestion);
 assert.equal(f.state.quizApproach,null);assert.equal(f.effects.speech.length,1);
});
test('a departing player breaks pursuit without consuming the available question',()=>{
 const f=fixture(),bag=[...f.state.quizBag];
 f.scope.player.x=2000;f.scope.advanceApproach(.1);
 assert.equal(f.state.quizApproach,null);assert.equal(f.actor.quizAsked,true);
 assert.deepEqual([...f.state.quizBag],bag);assert.equal(f.effects.speech.length,0);
});
