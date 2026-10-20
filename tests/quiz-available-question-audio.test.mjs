import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuizHarness} from './quiz-harness.mjs';

function giselaQuestion(source=24){
 const h=createQuizHarness(),{actor}=h.knownActor('gisela-becker');
 const index=h.scope.questions.findIndex(q=>String(q.source)===String(source));assert(index>=0);
 h.state.quizBag=[index];return{h,actor,q:h.scope.questions[index]};
}

test('an approved own question recording remains usable when its introductory segments are unavailable',()=>{
 const {h,actor,q}=giselaQuestion(),catalog=h.scope.speechCatalog;
 const clip=catalog.candidateClip(actor.voiceId,q.question);assert.match(clip,/quiz-gisela-becker-question-24-germany/);
 assert.equal(h.scope.startCitizenshipQuiz(actor),true);
 const cue=h.effects.speech[0];
 assert.equal(cue.text,q.question);assert.equal(cue.candidateSegments,null);
 assert.equal(cue.subtitle,catalog.questions[q.source]);assert.equal(cue.candidateVoiceId,actor.voiceId);assert.equal(cue.actor,actor);
 const visible=h.node('quiz-prompt').textContent;assert(visible.endsWith(q.question));assert(visible.length>q.question.length,'full authored introduction remains visible');
 assert(h.node('quiz-choices').children.every(choice=>choice.disabled));cue.start();assert.equal(h.node('quiz-modal').hidden,false);
 cue.done();assert(h.node('quiz-choices').children.every(choice=>!choice.disabled));
});

test('missing own question audio keeps the complete caption path without borrowing another speaker',()=>{
 const {h,actor,q}=giselaQuestion(90);assert.equal(h.scope.speechCatalog.candidateClip(actor.voiceId,q.question),null);
 h.scope.startCitizenshipQuiz(actor);const cue=h.effects.speech[0];assert.equal(cue.text,h.node('quiz-prompt').textContent);
 assert.equal(cue.candidateVoiceId,actor.voiceId);assert.equal(cue.candidateSegments.length,3);assert.equal(cue.candidateSegments[2],q.question);
});

test('an available complete same-speaker sequence retains the complete spoken prompt',()=>{
 const {h,actor}=giselaQuestion();h.scope.speechCatalog={...h.scope.speechCatalog,candidateSequence:()=>['approach','context','question']};
 h.scope.startCitizenshipQuiz(actor);const cue=h.effects.speech[0];assert.equal(cue.text,h.node('quiz-prompt').textContent);assert.equal(cue.candidateSegments.length,3);
});

test('voice off retains the full caption even when an own question recording exists',()=>{
 const {h,actor}=giselaQuestion();h.state.voiceOn=false;h.scope.startCitizenshipQuiz(actor);
 assert.equal(h.effects.speech[0].text,h.node('quiz-prompt').textContent);assert.equal(h.effects.speech[0].candidateSegments.length,3);
});
