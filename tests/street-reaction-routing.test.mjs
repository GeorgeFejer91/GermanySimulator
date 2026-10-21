import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
function fixture(){
  const actor={spriteKind:'towelMan'},other={spriteKind:'towelMan'},events=[];
  const context={window:{Germany3D:{requestStreetReaction:(target,names,options)=>{events.push({kind:'paint',target,names:Array.from(names),options});return target===actor},hasStreetReaction:target=>target===actor},GermanyHUD:{}},
    CharacterInteractions:{request:(target,names)=>{events.push({kind:'legacy-request',target,names});return true},advance:()=>{events.push({kind:'legacy-advance'});return true}},
    npcSpriteAtlases:{towelMan:{tourist:{interactions:{}}}},requestNpcInteractions:kind=>events.push({kind:'legacy-load',sprite:kind}),
    state:{started:true,modal:true,quizNpc:actor},document:{hidden:false},player:{},npcs:[actor,other],police:[],console};
  vm.createContext(context);
  for(const name of ['requestCharacterReaction','updateCharacterReaction']){
    const start=game.indexOf('function '+name+'('),end=game.indexOf('\nfunction ',start+1);assert(start>=0&&end>start);vm.runInContext(game.slice(start,end),context);
  }
  const start=game.indexOf('let streetMotionObserver='),end=game.indexOf('const speechCatalog=',start);
  vm.runInContext(game.slice(start,end)+'\nglobalThis.setObserver=observer=>streetMotionObserver=observer;',context);
  return{context,actor,other,events};
}

test('quiz and proximity verbs reach the displayed painted actor with owned semantic actions',()=>{
  const f=fixture();assert(f.context.requestCharacterReaction(f.actor,['working','waiting']));
  assert.deepEqual(f.events.map(e=>e.kind),['paint']);assert.deepEqual(f.events[0].names,['work','wait']);assert.equal(f.events[0].target,f.actor);
  f.events.length=0;f.context.requestCharacterReaction(f.actor,['review','jumping']);assert.deepEqual(f.events[0].names,['review','success']);
  f.events.length=0;f.context.requestCharacterReaction(f.actor,['look','waving']);assert.deepEqual(f.events[0].names,['look','greet']);assert.equal(f.events[0].options.incidental,true);
});

test('a displayed painted reaction cannot also advance or request an invisible legacy performance',()=>{
  const f=fixture();assert.equal(f.context.updateCharacterReaction(f.actor,.1),true);assert.deepEqual(f.events,[]);
  f.context.window.Germany3D.requestStreetReaction=()=>false;assert.equal(f.context.requestCharacterReaction(f.actor,'waiting'),false);assert.deepEqual(f.events,[]);
  f.context.requestCharacterReaction(f.other,'waiting');assert.deepEqual(f.events.map(e=>e.kind),['legacy-request','legacy-load']);
});

test('modal quiz/dialogue performers advance planted actions while other actors and global pause remain frozen',()=>{
  const f=fixture(),calls=[];
  f.context.setObserver({accepts:()=>true,tick:(actor,dt,paused,speechPaused)=>calls.push({actor,dt,paused,speechPaused})});
  f.context.finishStreetSimulationTick(.1);
  assert.equal(calls.find(c=>c.actor===f.actor).paused,false);assert.equal(calls.find(c=>c.actor===f.other).paused,true);
  assert(calls.every(c=>c.speechPaused===false));
  calls.length=0;f.context.state.quizNpc=null;f.context.state.characterSpeaker=f.actor;f.context.finishStreetSimulationTick(.1);assert.equal(calls.find(c=>c.actor===f.actor).paused,false);
  calls.length=0;f.context.window.GermanyHUD.paused=true;f.context.finishStreetSimulationTick(.1);assert(calls.every(c=>c.paused&&c.speechPaused));
  calls.length=0;f.context.window.GermanyHUD.paused=false;f.context.document.hidden=true;f.context.finishStreetSimulationTick(.1);assert(calls.every(c=>c.paused&&c.speechPaused));
});
