import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {motionObserverSource} from './street-simulation-fixture-source.mjs';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const between=(start,end)=>{
  const a=source.indexOf(start),b=source.indexOf(end,a);
  assert.ok(a>=0&&b>a,'Production source boundaries: '+start);
  return source.slice(a,b);
};

function fixture(route='page'){
  const nodes=new Map(),classes=new Set(route==='city'?[]:['amt-direct-mode']);
  const create=()=>({hidden:false,style:{},dataset:{},textContent:'',children:[],classList:{add(){},remove(){}},append(...items){this.children.push(...items)}});
  const node=id=>{if(!nodes.has(id))nodes.set(id,create());return nodes.get(id)};
  node('form-modal').hidden=true;node('amt-direct-result').hidden=true;
  const state={mission:0,forms:0,modal:true,dialogue:false,gameOver:false,lang:'de',region:'berlin'},player={x:0,y:0,vx:3,vy:4,r:16};
  const calls={clears:0,cityReady:0,continuations:0,replays:0,wanted:0};
  const scope=vm.createContext({state,player,URLSearchParams,location:{search:route==='query'?'?geheim=buergeramt':''},
    document:{getElementById:node,createElement:create,documentElement:{dataset:{directLevel:route==='page'?'buergeramt':undefined}},body:{classList:{contains:k=>classes.has(k),remove:k=>classes.delete(k),add:k=>classes.add(k)}}},
    window:{Germany3D:{officeAssetsReady:true,leaveAmtDirectMode(){calls.cityReady++},enterBuergeramt:enter=>enter()},BuergeramtLevel:{requestFullscreen(){},open:config=>{calls.cityConfig=config},replay:config=>{calls.replays++;calls.replayConfig=config}}},
    jwd:{allocated:true},clearInput(){calls.clears++},stopSpeech(){},responderBlocked:()=>false,
    amtExitPosition:()=>({x:30,y:40}),uiTone(){},setTimeout(){},toast(){},updateHud(){},endGame(){},
    renderDialogue(){calls.continuations++},stimulusBusy(){},audioTextActive(){},setAmtMusicMuted(){},awardAnmeldung(){},
    wanted(){calls.wanted++},regionOf:()=> 'berlin',OFFENSE_TIMING:{policeContactCooldown:5.8}});
  vm.runInContext(motionObserverSource(source)+between('const missions=','const rules=')+between('const forms=','function resize(')+between('const formEnglish=','function localize(')+between('function showForm(','let anmeldungAwarded='),scope);
  vm.runInContext(between('function openDialogue(','function setDialogueVoiceBusy(')+between('function anmeldungNeighborhoodMonologue(','function amtExitPosition(')+between('function returnFromAmt(','let indoorVisit=null;')+between('let indoorVisit=null;','document.getElementById("bureaucracy-form").onsubmit=')+between('function bureaucrat(','function microInteract('),scope);
  const lines=source.split('\n');
  vm.runInContext(lines.find(line=>line.startsWith('const requestedDirectLevel=')),scope);
  const flag=lines.find(line=>line.startsWith('const directBuergeramt='));if(flag)vm.runInContext(flag,scope);
  vm.runInContext(lines.find(line=>line.startsWith('document.getElementById("bureaucracy-form").onsubmit=')),scope);
  const start=source.indexOf(' const directConfig=');
  vm.runInContext(source.slice(start,source.indexOf('\n function restartAmt',start))+'\nglobalThis.directConfig=directConfig;',scope);
  vm.runInContext(lines.find(line=>line.trimStart().startsWith('function restartAmt('))+'\nglobalThis.restartAmt=restartAmt;',scope);
  node('bureaucracy-form').reportValidity=()=>true;
  return {scope,state,player,node,calls,classes,submit(){const form=node('bureaucracy-form');form.onsubmit({preventDefault(){},currentTarget:form})}};
}

for(const route of ['page','query'])test('actual '+route+' direct onForm returns to city then valid A38 shows one result',()=>{
  const f=fixture(route);f.scope.directConfig.onForm();
  assert.equal(f.classes.has('amt-direct-mode'),false,'return cleanup is retained');
  assert.deepEqual({x:f.player.x,y:f.player.y},{x:30,y:40});assert.equal(f.player.vx,0);assert.equal(f.player.vy,0);
  assert.equal(f.calls.cityReady,1);assert.equal(f.node('form-modal').hidden,false);assert.equal(f.state.mission,0);
  f.submit();assert.equal(f.state.mission,1);assert.equal(f.state.forms,1);assert.equal(f.node('form-modal').hidden,true);
  assert.equal(f.node('amt-direct-result').hidden,false);assert.equal(f.node('amt-direct-result-title').textContent,'ANMELDUNG ABGESCHLOSSEN');
  assert.match(f.node('amt-direct-result-copy').textContent,/Formular A38/);assert.equal(f.state.modal,true);
  assert.equal(f.state.dialogue,false,'direct result must not compete with the city welcome monologue');assert.equal(f.calls.continuations,0);
  f.submit();assert.equal(f.state.mission,1);assert.equal(f.state.forms,1);assert.equal(f.calls.continuations,0);
});

test('ordinary city office onForm keeps city return and never shows direct result',()=>{
  const f=fixture('city');f.scope.bureaucrat({id:'buergeramt'}, {form:'a38'});assert.ok(f.calls.cityConfig);
  f.calls.cityConfig.onForm();f.submit();assert.equal(f.state.mission,1);assert.equal(f.state.forms,1);
  assert.equal(f.node('amt-direct-result').hidden,true);assert.equal(f.classes.has('amt-direct-mode'),false);
  assert.equal(f.state.dialogue,true);assert.equal(f.state.modal,true);assert.equal(f.state.dialogueData.speaker,'INNERER MONOLOG');assert.equal(f.state.dialogueData.portrait,'DE');assert.equal(f.calls.continuations,1);
});

test('invalid, hidden and cancelled direct forms cannot show a successful result',()=>{
  const f=fixture();f.scope.directConfig.onForm();f.node('bureaucracy-form').reportValidity=()=>false;f.submit();
  assert.equal(f.state.mission,0);assert.equal(f.state.forms,0);assert.equal(f.node('amt-direct-result').hidden,true);assert.equal(f.node('form-modal').hidden,false);
  f.node('bureaucracy-form').reportValidity=()=>true;f.node('form-modal').hidden=true;f.scope.leaveIndoorBuilding();f.submit();
  assert.equal(f.state.mission,0);assert.equal(f.state.forms,0);assert.equal(f.node('amt-direct-result').hidden,true);
  f.scope.directConfig.onForm();f.submit();assert.equal(f.state.mission,1);assert.equal(f.node('amt-direct-result').hidden,false);assert.equal(f.state.dialogue,false);
});

test('direct replay retires the old form/result and a fresh accepted form can finish',()=>{
  const f=fixture();f.scope.directConfig.onForm();f.scope.restartAmt();f.submit();
  assert.equal(f.state.mission,0);assert.equal(f.state.forms,0);assert.equal(f.node('amt-direct-result').hidden,true);assert.equal(f.node('form-modal').hidden,true);
  assert.equal(f.calls.replays,1);assert.equal(f.classes.has('amt-direct-mode'),true);
  f.calls.replayConfig.onForm();f.submit();assert.equal(f.state.forms,1);assert.equal(f.node('amt-direct-result').hidden,false);assert.equal(f.state.dialogue,false);
  f.scope.restartAmt();assert.equal(f.node('amt-direct-result').hidden,true);assert.equal(f.state.forms,0);assert.equal(f.state.mission,0);assert.equal(f.state.dialogue,false,'direct replay cannot carry a city welcome dialogue');
});

test('ringing cancellation still returns to city without a success result',()=>{
  const f=fixture();f.scope.directConfig.onCancel({reason:'ringing'});f.submit();
  assert.equal(f.classes.has('amt-direct-mode'),false);assert.equal(f.calls.wanted,1);assert.equal(f.node('amt-direct-result').hidden,true);
  assert.equal(f.state.mission,0);assert.equal(f.state.forms,0);assert.equal(f.state.modal,false);
});
