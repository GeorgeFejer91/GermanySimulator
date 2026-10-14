import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const between=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));

function fixture(){
  const elements=new Map(),element=id=>{if(!elements.has(id))elements.set(id,{hidden:true,style:{},dataset:{},textContent:''});return elements.get(id)};
  const calls={entries:[],exits:[],dialogs:[],forms:[]},state={mission:3,forms:0,modal:false,region:'berlin',lang:'de'},player={x:1600,y:1610,r:16,vx:20,vy:10};
  const f={state,player,window:{Germany3D:{enterBuilding:(id,ready)=>(calls.entries.push({id,ready}),true),leaveBuilding:(id,config)=>{calls.exits.push({id,...config});config.onReturn();return true;}}},forms:{tax:{code:'T-7'}},
    stopSpeech(){},clearInput(){},responderBlocked:()=>false,openDialogue:(...args)=>calls.dialogs.push(args),showForm:type=>calls.forms.push(type),document:{getElementById:element,body:{classList:{contains:()=>false}}},
    uiTone(){},setTimeout(){},toast(){},updateHud(){},jwd:{allocated:false},endGame(){},anmeldungNeighborhoodMonologue(){},showAmtDirectResult(){}};
  const context=vm.createContext(f);
  vm.runInContext(between('let indoorVisit=null;','function cancelAmtAppointment(')+between('function bureaucrat(','function microInteract('),context);
  const submit=source.split('\n').find(line=>line.startsWith('document.getElementById("bureaucracy-form").onsubmit='));vm.runInContext(submit,context);
  return {...f,calls,context,element};
}

test('office mission dialogue waits for entry, form waits for dialogue, and submission returns before granting progress',()=>{
  const f=fixture(),building={id:'finanzamt',name:'FINANZAMT',doorX:1600,doorY:1555};
  f.context.bureaucrat(building,{title:'Steueranmeldung',form:'tax'});
  assert.equal(f.state.modal,true);assert.equal(f.player.vx,0);assert.equal(f.calls.dialogs.length,0);assert.equal(f.state.mission,3);
  f.calls.entries[0].ready();assert.equal(f.calls.dialogs.length,1);assert.equal(f.calls.forms.length,0);
  f.calls.dialogs[0][3]();assert.deepEqual(f.calls.forms,['tax']);assert.equal(f.calls.exits.length,0);assert.equal(f.state.forms,0);
  const form=f.element('bureaucracy-form');form.dataset.type='tax';form.reportValidity=()=>false;form.onsubmit({preventDefault(){},currentTarget:form});
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
