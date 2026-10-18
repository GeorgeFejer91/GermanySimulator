import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './amt-harness.mjs';

// Real question/answer and phone handlers, controlled DOM/clock/link boundaries.
// These checks do not establish physical phone delivery or rendered visibility.
function choicesReady(h){
 for(let i=0;i<1000&&!h.node('amt-actions').children.some(button=>!button.disabled);i++)h.tick(100);
 assert(h.node('amt-actions').children.some(button=>!button.disabled),'spoken/readable question must enable its choices');
}

function pendingFinalAnswer(){
 const h=harness();let awards=0;h.config.onRegistration=()=>awards++;
 h.counter();choicesReady(h);
 let answers=0;
 while(h.level.registration.node!=='final'){
  h.action(0);choicesReady(h);assert(++answers<=10,'direct registration route is finite');
 }
 assert.equal(answers,9);
 assert.equal(h.level.registration.points,9);
 h.action(0);
 for(let i=0;i<1000&&h.level.stage!=='phone-warning';i++)h.tick(100);
 assert.equal(h.level.stage,'phone-warning');
 return{h,awards:()=>awards};
}

function waitingNotice(h,unknown=false){
 const box=h.node('english-subtitle'),text=box.textContent;
 assert.equal(box.hidden,false,'the shared subtitle rail must expose the waiting instruction');
 assert.equal(h.level.subtitleBusy,true,'persistent status retains the subtitle owner');
 assert.equal(h.level.audioTextBusy,false,'waiting status must not claim speech playback');
 assert.equal(text,unknown?'Telefonverbindung prüfen, dann Handy sperren. Der Stempel wartet.':
  'Telefonseite ausblenden oder Handy sperren. Der Stempel wartet.');
 h.config.subtitlesOn=()=>true;h.level.refreshSubtitle();
 assert.equal(box.lang,'en');
 assert.match(box.textContent,/phone/i);
 assert.match(box.textContent,/lock/i);
 if(unknown)assert.match(box.textContent,/connection/i);
 else assert.match(box.textContent,/hide/i);
 h.config.subtitlesOn=()=>false;h.level.refreshSubtitle();
 assert.equal(box.lang,'de');assert.equal(box.textContent,text);
 assert.equal(h.node('amt-actions').children.length,0,'no button may pretend to supply phone-away evidence');
 assert.equal(h.level.registration.completed,false);
 assert.equal(h.level.registration.points,9,'the final answer point remains withheld');
 assert.equal(h.counts.form,0);
 return text;
}

function finishAfterActualHidden({h,awards}){
 h.links[0].message({type:'phone-hidden'});
 choicesReady(h);
 assert.equal(h.level.stage,'success');
 assert.equal(h.level.registration.points,10);
 assert.equal(h.level.registration.completed,true);
 assert.equal(awards(),1);
 assert.equal(h.node('english-subtitle').hidden,true,
  'completed success speech must release the temporary waiting caption owner');
 assert.equal(h.node('amt-actions').children.length,1);
 assert.equal(h.counts.form,0,'successful registration still requires taking the receipt');
 h.links[0].message({type:'phone-hidden'});
 h.action();h.tick(90000);
 assert.equal(h.counts.form,1);
 assert.equal(h.level.active,false);
 h.links[0].message({type:'phone-hidden'});h.tick(90000);
 assert.equal(awards(),1);
 assert.equal(h.counts.form,1,'late and duplicate hidden receipts cannot grant twice');
 assert.equal(h.counts.cancel,0);
}

test('visible phone leaves a persistent final-answer explanation and real hidden receipt resumes once',()=>{
 const state=pendingFinalAnswer(),{h}=state;
 assert.equal(h.level.registration.phoneVisible,true);
 const notice=waitingNotice(h);
 h.tick(60000);
 h.level.refreshSubtitle();
 assert.equal(h.node('english-subtitle').textContent,notice,'the waiting explanation must survive caption/timer completion');
 waitingNotice(h);
 finishAfterActualHidden(state);
});

for(const loss of ['disconnected','heartbeat']){
 test(`${loss}: pending final answer explains unknown connection and keeps the original gate`,()=>{
  const state=pendingFinalAnswer(),{h}=state,link=h.links[0];
  if(loss==='disconnected')link.emit('disconnected',{peer:''});
  else{link.emit('connected',{});h.tick(9001)}
  assert.equal(h.level.registration.phoneVisible,null);
  assert.equal(h.level.registration.phoneSilent,false);
  const notice=waitingNotice(h,true);
  h.tick(60000);
  h.level.refreshSubtitle();
  assert.equal(h.node('english-subtitle').textContent,notice);
  waitingNotice(h,true);
  link.message({type:'phone-visible'});
  assert.equal(h.level.registration.phoneVisible,true);
  waitingNotice(h);
  assert.doesNotMatch(h.node('english-subtitle').textContent,/Verbindung/);
  finishAfterActualHidden(state);
 });
}
