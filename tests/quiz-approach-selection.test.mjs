import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuizHarness} from './quiz-harness.mjs';

test('unreachable walkers defer their question without being marked asked',()=>{
 const f=createQuizHarness(),{actor}=f.knownActor();actor.vx=13;
 const question=f.seedQuestion(),bag=[...f.state.quizBag];f.scope.player.x=300;
 f.scope.updateQuizEncounters(.1);
 assert.equal(f.state.quizApproach,null);assert.equal(f.state.quizQuestion??null,null);
 assert.equal(!!actor.quizAsked,false);assert.deepEqual([...f.state.quizBag],bag);
 Object.assign(f.scope.player,{x:actor.x+150,y:actor.y});f.state.quizTimer=0;
 f.scope.updateQuizEncounters(.1);assert.equal(f.state.quizApproach,actor);
 assert.equal(f.state.quizApproachQuestion,question);
 for(let i=0;i<80&&!f.state.quizQuestion;i++)f.scope.advanceApproach(.1);
 assert.equal(f.state.quizQuestion,question);assert.equal(f.state.quizBag.length,0);
});

test('unreachable eligible peers cannot starve a reachable same-category encounter',()=>{
 const f=createQuizHarness(),far=f.knownActor('gisela-becker').actor,near=f.knownActor('heike-hoffmann').actor;
 Object.assign(far,{x:400,vx:13});Object.assign(near,{x:150,vx:-10});
 const question=f.seedQuestion(),bag=[...f.state.quizBag];
 f.scope.updateQuizEncounters(.1);
 assert.equal(f.state.quizApproach,near);assert.equal(f.state.quizApproachQuestion,question);
 assert.equal(!!far.quizAsked,false);assert.deepEqual([...f.state.quizBag],bag);
});

test('initial selection reserves two seconds of the shared pace budget for stopping and turning',()=>{
 for(const [vx,pace]of [[0,14],[13,18.2],[100,24]])for(const outside of [false,true]){
  const f=createQuizHarness(),{actor}=f.knownActor();actor.vx=vx;
  f.seedQuestion();f.scope.player.x=78+pace*6+(outside?.001:0);
  f.scope.updateQuizEncounters(.1);
  assert.equal(f.state.quizApproach,outside?null:actor);
 }
});
