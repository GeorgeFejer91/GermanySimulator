import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
function sourceOf(name){
 const start=game.indexOf(`function ${name}(`);assert.notEqual(start,-1);
 let depth=0;
 for(let i=game.indexOf('{',start);i<game.length;i++){
  if(game[i]==='{')depth++;
  if(game[i]==='}'&&--depth===0)return game.slice(start,i+1);
 }
 throw Error(`Unclosed ${name}`);
}

test('city paperwork and building procedure prompts share narrator without changing completion',()=>{
 const spoken=[],state={region:'germany',mission:3},b={id:'finanzamt',name:'FINANZAMT'};
 let formsShown=0,returned=0,completed=0;
 const context=vm.createContext({state,window:{},forms:{tax:{code:'ESt 1 A'}},
  indoorVisit:null,enterIndoorBuilding(building,ready){context.indoorVisit={building};ready()},
  leaveIndoorBuilding(){returned++},showForm(type){assert.equal(type,'tax');formsShown++},
  openDialogue:(...args)=>spoken.push(args)});
 vm.runInContext([sourceOf('bureaucrat'),sourceOf('buildingDialogue')].join('\n'),context);
 context.bureaucrat(b,{title:'Steuererklärung',form:'tax'});
 assert.equal(spoken[0][4],'narrator');assert.match(spoken[0][1][1],/Steuererklärung.*ESt 1 A/);
 assert.equal(formsShown,0);spoken[0][3]();assert.equal(formsShown,1);
 context.buildingDialogue(b,['Vorgang wird geprüft.'],'§',()=>completed++);
 assert.equal(spoken[1][4],'narrator');assert.equal(completed,0);spoken[1][3]();
 assert.equal(returned,1);assert.equal(completed,1);assert.equal(state.mission,3);
});

test('fax and deposit machines and written notices use narrator; ordinary people retain their identity',()=>{
 const spoken=[],state={region:'germany',pfand:0},context=vm.createContext({state,
  jwdCopy:{carNote:{de:['Laminierter Hinweis.']}},openDialogue:(...args)=>spoken.push(args),
  innerMonologue(){}});
 vm.runInContext(sourceOf('microInteract'),context);
 for(const p of [{asset:'jwd-car',owner:'Probe'},{id:'faxgeraet-1'},{id:'faxkiosk-1'},{id:'faxbillboard-1'},{id:'pfandautomat-1'}]){
  context.microInteract(p);assert.equal(spoken.at(-1)[4],'narrator');
 }
 context.microInteract({id:'baustelle-1'});assert.equal(spoken.at(-1)[4],undefined,'construction management keeps its existing voice route');
 assert.equal(state.pfand,0);
});
