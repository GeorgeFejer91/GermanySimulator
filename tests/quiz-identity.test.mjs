import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createQuizHarness as fixture,spawnCityCrowd} from './quiz-harness.mjs';
const reference=readFileSync(new URL('./fixtures/legacy-crowd-spawn.js',import.meta.url),'utf8');
const identity=n=>[n.quizCharacterId,n.voiceId,n.name,n.fullName];
const physical=n=>Object.fromEntries(['id','x','y','vx','vy','min','max','line','crowd','pause','barkAt','archetype','spriteKind','spriteFrame','spriteRow','spriteFlip','animTime','audioRadius'].map(key=>[key,n[key]]));
const category=q=>q.type==='fahrschule'?'traffic':q.type==='grammar'?'grammar-'+q.level.toLowerCase():q.type==='technik'?'technik':'civic';

// Existing public VM harness; DOM, broker, movement, reaction and reward sinks are doubles.
// No street renderer import or art-admission claim is needed for these controller cases.
test('spawn identity uses fixed9 personas while physical fields/density remain original',()=>{
 const before=fixture(),after=fixture();
 vm.runInContext(reference,before.scope);
 for(let index=0;index<81;index++)for(const f of [before,after])f.scope.addCrowdPedestrian(index*21,70,(index%2?1:-1)*15,0,-20,2000);
 for(let index=0;index<81;index++){
  const actor=after.npcs[index];assert.deepEqual(physical(actor),physical(before.npcs[index]));
  assert.equal(actor.quizzer,before.npcs[index].quizzer);
  if(actor.quizzer){const person=after.scope.people[Math.floor(index/3)%9];assert.equal(actor.quizCharacterId,person.id);assert.equal(actor.voiceId,person.voiceId);assert.equal(actor.name,person.name);assert.equal(actor.fullName,person.name)}
  else assert.deepEqual(identity(actor),identity(before.npcs[index]));
 }
 const city=fixture();spawnCityCrowd(city);assert.equal(city.npcs.length,110);assert.equal(city.npcs.filter(n=>n.quizzer).length,22);assert.equal(new Set(city.npcs.filter(n=>n.quizzer).map(n=>n.quizCharacterId)).size,9);
});
test('actual spawned approach/card/source/voice and stale feedback keep one owner',()=>{
 for(const region of ['germany','berlin'])for(const correct of [true,false]){
  const f=fixture(region);f.scope.addCrowdPedestrian(0,0,10,0,-20,20);const actor=f.npcs[0],before=identity(actor),q=f.seedQuestion();f.scope.updateQuizEncounters(.1);f.scope.advanceApproach(.1);
  assert.equal(f.state.quizNpc,actor);assert.equal(f.state.quizCharacter.voiceId,actor.voiceId);assert.equal(f.state.quizCharacter.id,actor.quizCharacterId);assert.equal(f.effects.speech[0].candidateVoiceId,actor.voiceId);assert.equal(f.node('quiz-person-name').textContent,actor.name);
  const cue=f.effects.speech[0],answer=correct?q.answer:(q.answer+1)%4;f.scope.answerCitizenshipQuiz(answer);f.scope.answerCitizenshipQuiz(answer);cue.start();cue.done();
  assert.equal(f.effects.points.length,1);assert.equal(f.effects.points[0].delta,correct?1:-1);assert.equal(f.state.quizQuestion,null);assert.equal(f.node('quiz-modal').hidden,true);assert.deepEqual(identity(actor),before);
  if(!correct)assert.equal(f.effects.feedback[0][0],actor.name+' · '+f.scope.people.find(p=>p.id===actor.quizCharacterId).title);
 }
});
test('cancellation by time/distance/busy preserves pending card and permits same-owner retry',()=>{
 for(const reason of ['time','distance','busy']){
  const f=fixture(),{actor}=f.knownActor(),q=f.seedQuestion();f.scope.updateQuizEncounters(.1);assert.equal(f.state.quizApproach,actor);
  if(reason==='distance')actor.x=651;else actor.quizFollowTime=8;if(reason==='busy')f.scope.stimulusBusy=()=>true;
  f.scope.advanceApproach(.1);assert.equal(f.state.quizApproach,null);assert.equal(f.state.quizApproachQuestion,null);assert.equal(f.state.quizBag.length,1);assert.equal(f.effects.points.length,0);assert.equal(f.effects.speech.length,0);
  f.state.quizTimer=0;actor.x=0;f.scope.stimulusBusy=()=>false;f.scope.updateQuizEncounters(.1);assert.equal(f.state.quizApproach,actor);assert.equal(f.state.quizApproachQuestion,q);
 }
});
test('arrested/reserved/removed/voice-mismatched actors and reentrant starts cannot spend extra cards',()=>{
 for(const reason of ['arrested','lawPending','removed','voice']){
  const f=fixture(),{actor}=f.knownActor();f.seedQuestion();if(reason==='removed')f.npcs.length=0;else if(reason==='voice')actor.voiceId='foreign';else actor[reason]=true;
  f.scope.startCitizenshipQuiz(actor);assert.equal(f.state.quizBag.length,1);assert.equal(f.effects.speech.length,0);assert.equal(f.effects.points.length,0);
 }
 const f=fixture(),{actor}=f.knownActor();f.seedQuestion();let reactions=0;
 f.scope.requestCharacterReaction=()=>{reactions++;assert.equal(f.scope.startCitizenshipQuiz(actor),false)};
 assert.equal(f.scope.startCitizenshipQuiz(actor),true);assert.equal(reactions,1);assert.equal(f.state.quizBag.length,0);assert.equal(f.effects.speech.length,1);
});
test('all77 retained cards follow earliest eligible unasked pair without deletion before refill',()=>{
 const f=fixture();for(const person of f.scope.people)f.knownActor(person.id);const seen=[],counts={};
 for(let index=0;index<77;index++){
  const deck=f.state.quizBag.length?[...f.state.quizBag].reverse():[...f.scope.questions.keys()].reverse();
  const available=allowAsked=>deck.find(i=>f.npcs.some(n=>(allowAsked||!n.quizAsked)&&f.scope.people.find(p=>p.id===n.quizCharacterId).categories.includes(category(f.scope.questions[i]))));
  const expected=available(false)??available(true);f.state.quizTimer=0;f.scope.updateQuizEncounters(.1);f.scope.advanceApproach(.1);const q=f.state.quizQuestion;
  assert.equal(q?.source,f.scope.questions[expected].source);seen.push(q.source);counts[category(q)]=(counts[category(q)]||0)+1;f.scope.answerCitizenshipQuiz(q.answer);
 }
 assert.equal(new Set(seen).size,77);assert.equal(f.state.quizBag.length,0);assert.deepEqual(counts,{'grammar-c1':8,'grammar-b2':10,'grammar-b1':10,technik:4,traffic:10,civic:35});
 f.state.quizTimer=0;f.scope.updateQuizEncounters(.1);f.scope.advanceApproach(.1);assert(f.state.quizQuestion);assert.equal(f.state.quizBag.length,76);
});
test('actual home/office layouts defer distantC1 without losing it or relabelling local people',()=>{
 for(const point of [{x:885,y:1060},{x:1090,y:4460}]){
  const f=fixture();spawnCityCrowd(f);Object.assign(f.scope.player,point);const civic=f.scope.questions.findIndex(q=>category(q)==='civic'),c1=f.scope.questions.findIndex(q=>category(q)==='grammar-c1');
  f.state.quizBag=[civic,c1];f.scope.updateQuizEncounters(.1);const actor=f.state.quizApproach;assert(actor);assert.equal(f.state.quizApproachQuestion.source,f.scope.questions[civic].source);assert(Math.hypot(actor.x-point.x,actor.y-point.y)<=650);assert.deepEqual([...f.state.quizBag],[civic,c1]);
 }
});
