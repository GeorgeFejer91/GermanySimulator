import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {motionObserverSource} from './street-simulation-fixture-source.mjs';
const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const between=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));

function fixture(){
  const elements=new Map(),create=()=>({hidden:true,style:{},dataset:{},textContent:'',children:[],append(...children){this.children.push(...children)}}),element=id=>{if(!elements.has(id))elements.set(id,create());return elements.get(id)};
  const calls={entries:[],exits:[],dialogs:[],forms:[]},state={mission:3,forms:0,modal:false,region:'berlin',lang:'de'},player={x:1600,y:1610,r:16,vx:20,vy:10};
  const f={state,player,window:{Germany3D:{enterBuilding:(id,ready)=>(calls.entries.push({id,ready}),true),leaveBuilding:(id,config)=>{calls.exits.push({id,...config});config.onReturn();return true;}}},
    stopSpeech(){},clearInput(){},responderBlocked:()=>false,openDialogue:(...args)=>calls.dialogs.push(args),document:{getElementById:element,createElement:create,body:{classList:{contains:()=>false}}},
    uiTone(){},setTimeout(){},toast(){},updateHud(){},jwd:{allocated:false},endGame(){},anmeldungNeighborhoodMonologue(){},showAmtDirectResult(){}};
  const context=vm.createContext(f);
  vm.runInContext(motionObserverSource(source)+between('const missions=','const rules=')+between('const forms=','function resize(')+between('const formEnglish=','function localize(')+between('function showForm(','let anmeldungAwarded=')+between('let indoorVisit=null;','function cancelAmtAppointment(')+between('function bureaucrat(','function microInteract(')+between('function interactBuilding(','function cityInteractionTarget('),context);
  const showForm=context.showForm;context.showForm=type=>{calls.forms.push(type);showForm(type)};
  const submit=source.split('\n').find(line=>line.startsWith('document.getElementById("bureaucracy-form").onsubmit='));vm.runInContext(submit,context);
  return {...f,calls,context,element};
}

test('office mission dialogue waits for entry, form waits for dialogue, and submission returns before granting progress',()=>{
  const f=fixture(),building={id:'finanzamt',name:'FINANZAMT',doorX:1600,doorY:1555};
  f.context.bureaucrat(building,{title:'Steueranmeldung',form:'steuer'});
  assert.equal(f.state.modal,true);assert.equal(f.player.vx,0);assert.equal(f.calls.dialogs.length,0);assert.equal(f.state.mission,3);
  f.calls.entries[0].ready();assert.equal(f.calls.dialogs.length,1);assert.equal(f.calls.forms.length,0);
  f.calls.dialogs[0][3]();assert.deepEqual(f.calls.forms,['steuer']);assert.equal(f.calls.exits.length,0);assert.equal(f.state.forms,0);
  const form=f.element('bureaucracy-form');assert.equal(form.dataset.type,'steuer');form.reportValidity=()=>false;form.onsubmit({preventDefault(){},currentTarget:form});
  assert.equal(f.calls.exits.length,0);assert.equal(f.state.mission,3,'an invalid form cannot complete the indoor level');
  form.reportValidity=()=>true;form.onsubmit({preventDefault(){},currentTarget:form});
  assert.equal(f.calls.exits.length,1);assert.equal(f.calls.exits[0].mode,'voluntary');assert.equal(f.state.mission,4);assert.equal(f.state.forms,1);assert.equal(f.player.x,1600);assert.equal(f.player.y,1590);assert.equal(f.state.modal,false);
  f.calls.entries[0].ready();assert.equal(f.calls.dialogs.length,1,'a stale entry receipt cannot reopen a completed room');
});

test('ordinary dialogue completion is voluntary and an occupied return point preserves the valid approach',()=>{
  const f=fixture(),building={id:'spaeti',name:'SPÄTI',doorX:1600,doorY:1555};let consequences=0;
  f.context.buildingDialogue(building,['Pfand.','Bitte.'],'§',()=>consequences++);f.calls.entries[0].ready();f.context.responderBlocked=()=>true;
  f.calls.dialogs[0][3]();assert.equal(f.calls.exits[0].mode,'voluntary');assert.equal(consequences,1);assert.equal(f.player.x,1600);assert.equal(f.player.y,1610);assert.equal(f.state.mission,3);assert.equal(f.state.forms,0);
});

test('repeated Stadtbild dialogue completion grants progress and leaves its office only once',()=>{
  const f=fixture(),office={id:'stadtbild',name:'STADTBILD',doorX:1600,doorY:1555};
  f.state.mission=5;f.state.stadtbild=3;
  f.context.interactBuilding(office,{target:'stadtbild'});
  f.calls.entries[0].ready();
  const complete=f.calls.dialogs[0][3];
  assert.equal(f.state.mission,5,'the stamp waits for the completed dialogue');
  complete();
  assert.equal(f.state.mission,6);assert.equal(f.calls.exits.length,1);
  complete();
  assert.equal(f.state.mission,6,'a repeated completion must not skip residence evidence');
  assert.equal(f.calls.exits.length,1);
});

test('a completed office dialogue cannot close a later visit or advance its mission',()=>{
  const f=fixture(),office={id:'stadtbild',name:'STADTBILD',doorX:1600,doorY:1555};
  f.state.mission=5;f.state.stadtbild=3;
  f.context.interactBuilding(office,{target:'stadtbild'});f.calls.entries[0].ready();
  const obsolete=f.calls.dialogs[0][3];obsolete();
  f.context.bureaucrat({id:'auslaender',name:'AUSLÄNDERBEHÖRDE',doorX:1750,doorY:1555},{title:'Aufenthalt',form:'aufenthalt'});
  f.calls.entries[1].ready();
  obsolete();
  assert.equal(f.state.mission,6,'the old stamp cannot award another mission');
  assert.equal(f.calls.exits.length,1,'the current residence office stays open');
  assert.equal(f.state.modal,true);
  f.calls.dialogs[1][3]();
  assert.deepEqual(f.calls.forms,['aufenthalt'],'the current office can still proceed');
});

test('a cancelled Stadtbild visit cannot grant its old reward after a fresh visit opens',()=>{
  const f=fixture(),office={id:'stadtbild',name:'STADTBILD',doorX:1600,doorY:1555};
  f.state.mission=5;f.state.stadtbild=3;
  f.context.interactBuilding(office,{target:'stadtbild'});f.calls.entries[0].ready();
  const cancelled=f.calls.dialogs[0][3];
  f.context.leaveIndoorBuilding();
  f.context.interactBuilding(office,{target:'stadtbild'});f.calls.entries[1].ready();
  cancelled();
  assert.equal(f.state.mission,5,'a cancelled visit cannot award the stamp');
  assert.equal(f.calls.exits.length,1,'the retried visit is still current');
  f.calls.dialogs[1][3]();
  assert.equal(f.state.mission,6,'the fresh visit remains completable');
  assert.equal(f.calls.exits.length,2);
});

test('the Stadtbild dialogue cannot advance before all three street corrections',()=>{
  const f=fixture(),office={id:'stadtbild',name:'STADTBILD',doorX:1600,doorY:1555};
  f.state.mission=5;f.state.stadtbild=2;
  f.context.interactBuilding(office,{target:'stadtbild'});f.calls.entries[0].ready();
  f.calls.dialogs[0][3]();
  assert.equal(f.state.mission,5);assert.equal(f.calls.exits.length,1);
});

test('a retained office dialogue cannot change progress or leave after game over',()=>{
  const f=fixture(),office={id:'stadtbild',name:'STADTBILD',doorX:1600,doorY:1555};
  f.state.mission=5;f.state.stadtbild=3;
  f.context.interactBuilding(office,{target:'stadtbild'});f.calls.entries[0].ready();
  f.state.gameOver=true;f.state.modal=true;
  const position={x:f.player.x,y:f.player.y};
  f.calls.dialogs[0][3]();
  assert.equal(f.state.mission,5,'terminal playthrough cannot receive an old stamp');
  assert.equal(f.calls.exits.length,0);assert.equal(f.state.modal,true);
  assert.deepEqual({x:f.player.x,y:f.player.y},position);
});
