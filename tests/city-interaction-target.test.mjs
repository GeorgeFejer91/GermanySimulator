import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
function extract(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a);
 assert.ok(a>=0&&b>a,`Missing production extraction boundary: ${start}`);
 return source.slice(a,b);
}
const target=source.includes('function cityInteractionTarget(){')
 ?extract('function cityInteractionTarget(){','\nfunction interact(){'):'';
const interaction=extract('function interact(){','\nfunction collect(){');
const hint=extract('function nearestInteract(){','\nfunction draw(){');
const keydown=extract('function keydown(e){','function keyup(e){');
const neighborActivity=extract('function neighborActivityActive(){','\nfunction citySpeechAllowed(');
const neighborVoice=source.split('\n').find(line=>line.startsWith('function jwdVoice('));
assert.ok(neighborVoice,'production neighbor voice whitelist is included');
const exitInput=extract('function punishmentExitInput(','\nfunction updateJwdPunishment(');
const functions=[neighborVoice,neighborActivity,target,interaction,hint,exitInput,keydown].join('\n');
const building=(id,d)=>({id,name:id.toUpperCase(),doorX:d,doorY:0});
const person=(name,d,extra={})=>({id:name,name,x:d,y:0,line:0,voiceId:'fixture-voice',...extra});
const prop=(id,d,extra={})=>({id,label:id.toUpperCase(),x:d,y:0,...extra});
const noTarget=['toast:HIER IST NIEMAND ZUSTÄNDIG','monologue:lost'];
function observe(options={}){
 const events=[],node={hidden:true,textContent:''};
 const state={started:true,gameOver:false,dialogue:false,modal:false,lang:'de',region:'berlin',mission:0,stadtbild:0,...options.state};
 const context={
  window:{Germany3D:{levelTransition:{active:!!options.transition}},GermanyHUD:{paused:!!options.paused}},
  state,jwd:{tour:options.tour||null,allocated:!!options.allocated,met:new Set(options.met||[])},
  jwdLane:options.jwdLane||{x:0,y:0,w:300,h:300},player:{x:0,y:0},keys:{},
  buildings:options.buildings||[],npcs:options.npcs||[],props:options.props||[],normObjects:options.normObjects||[],
  goerlitzerPark:{plaqueX:options.park??10000,plaqueY:0,lines:['fixture plaque']},
  kiesingerMemorial:{x:options.memorial??10000,y:-195},KIESINGER_PLAQUE_LINES:['fixture memorial'],
  document:{getElementById:()=>node},
  getNeighborStandingSpot:()=>options.halo?{}:null,
  dist:(x,y,a,b)=>Math.hypot(x-a,y-b),
  currentMission:()=>({target:'buergeramt',form:'a38'}),
  interactBuilding:b=>events.push('building:'+b.id),
  talkJwdNeighbor:n=>events.push('neighbor:'+n.id),
  visitJwdHome:()=>events.push('visit-home'),
  speakJwdTourLine:()=>events.push('tour-line'),
  microInteract:p=>events.push('prop:'+p.id),
  openDialogue:name=>events.push('dialogue:'+name),
  nextDialogue:()=>events.push('next-dialogue'),
  requestCharacterReaction:()=>false,
  worldNpcLine:i=>'fixture line '+i,npcLines:Array(10).fill('fixture line'),
  toast:text=>events.push('toast:'+text),innerMonologue:key=>events.push('monologue:'+key),
  updateHud:()=>events.push('update-hud'),
 };
 runInNewContext(functions+'\nnearestInteract();keydown({code:"KeyE",key:"e",repeat:false,preventDefault(){}});',context,{timeout:1000});
 return{hint:node.textContent,hidden:node.hidden,events,stadtbild:state.stadtbild};
}
function check(name,options,expected){
 const actual=observe(options);
 assert.deepEqual(actual,expected,name);
}
const result=(hint,events,stadtbild=0)=>({hint,hidden:!hint,events,stadtbild});

const checks=[
 ['saved building100/NPC40 priority',()=>check('building100/NPC40',{buildings:[{...building('buergeramt',100),name:'BÜRGERAMT'}],npcs:[person('TEST NPC',40)]},result('E · BÜRGERAMT',['building:buergeramt']))],
 ['saved building117 unavailable',()=>check('building117',{buildings:[{...building('buergeramt',117),name:'BÜRGERAMT'}]},result('',noTarget))],
 ['strict building112 boundary',()=>check('building@112',{buildings:[building('office',112)]},result('',noTarget))],
 ['strict NPC92 boundary',()=>check('NPC@92',{npcs:[person('PERSON',92)]},result('',noTarget))],
 ['joint strict plaque/prop96 and norm92 boundary',()=>check('all candidates exactly at their excluded boundary',{park:96,memorial:96,props:[prop('fax',96)],normObjects:[{x:92,y:0,label:'BIN',fixed:false}],state:{mission:5}},result('',noTarget))],
 ['first building array order',()=>check('first80 before second20 and NPC10',{buildings:[building('first',80),building('second',20)],npcs:[person('PERSON',10)]},result('E · FIRST',['building:first']))],
 ['stable nearest-neighbor tie and category precedence',()=>check('two neighbors80 before park10 and office5',{npcs:[person('FIRST',80,{jwdRole:'parent'}),person('SECOND',80,{jwdRole:'watcher'})],park:10,buildings:[building('office',5)]},result('E · FIRST',['neighbor:FIRST']))],
 ['archived neighbor roles cannot steal an interactive prop target',()=>check('arrested, pending and archived actors yield to the valid prop',{npcs:[person('ARRESTED',10,{arrested:true}),person('PENDING',20,{lawPending:true}),person('EDE',80,{jwdRole:'burglar'})],props:[prop('disabled',1,{interactive:false}),prop('',2),prop('fax',3)],normObjects:[{x:1,y:0,fixed:true}]},result('E · FAX',['prop:fax']))],
 ['manual modal advances without world hint',()=>check('manual dialogue before office',{buildings:[building('office',20)],state:{dialogue:true,modal:true,dialogueData:{automatic:false}}},result('',['next-dialogue']))],
 ['roaming automatic tour guidance survives modal',()=>check('automatic guide before office',{tour:{actor:person('HEIKO',50),phase:'ready'},buildings:[building('office',10)],state:{dialogue:true,modal:true,dialogueData:{automatic:true,roaming:true}}},result('IN DEN LEUCHTKREIS STELLEN · ZUHÖREN',[]))],
];
assert.equal(checks.length,10);
for(const[name,run]of checks)test(name,run);

test('unfinished local neighbor introductions suppress unrelated target hints and E actions',()=>{
 check('protected introductions',{allocated:true,state:{mission:1},buildings:[building('office',20)],npcs:[person('PERSON',10)],props:[prop('fax',5)]},result('',[]));
});

test('protected neighbor introductions preserve home and neighbor access',()=>{
 const options={allocated:true,state:{mission:1},buildings:[building('office',5),{...building('jwd-home',80),residential:true}]};
 check('home remains reachable',options,result('E · JWD-HOME',['visit-home']));
 check('neighbor retains precedence',{...options,npcs:[person('HEIKO',40,{jwdRole:'parent'})]},result('E · HEIKO',['neighbor:HEIKO']));
});

test('finished introductions or leaving the local area restore ordinary targets',()=>{
 const options={allocated:true,state:{mission:1},buildings:[building('office',20)]};
 check('all neighbors introduced',{...options,met:['parent','watcher','swabian']},result('E · OFFICE',['building:office']));
 check('outside local introduction area',{...options,jwdLane:{x:500,y:500,w:300,h:300}},result('E · OFFICE',['building:office']));
});
