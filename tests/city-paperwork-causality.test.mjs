// Production form ownership and once-only mission consequences.
// Real production form data, rendering handler and submit handler; DOM/UI doubles
// do not establish browser reachability, rendering, or natural input repetition.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';

const source=readFileSync(process.env.CITY_PAPERWORK_SOURCE?resolve(process.env.CITY_PAPERWORK_SOURCE):new URL('../game.js',import.meta.url),'utf8');
const between=(start,end)=>{
  const a=source.indexOf(start),b=source.indexOf(end,a);
  assert.ok(a>=0&&b>a,`production source boundaries: ${start}`);
  return source.slice(a,b);
};

function fixture(){
  const nodes=new Map();
  const create=()=>({hidden:false,style:{},dataset:{},textContent:'',children:[],append(...items){this.children.push(...items)}});
  const node=id=>{if(!nodes.has(id))nodes.set(id,create());return nodes.get(id)};
  node('form-modal').hidden=true;
  const state={mission:3,forms:0,modal:false,dialogue:false,gameOver:false,lang:'de'};
  let wins=0;
  const scope=vm.createContext({state,directBuergeramt:false,document:{getElementById:node,createElement:create,body:{classList:{contains:()=>false}}},
    jwd:{allocated:false},leaveIndoorBuilding(){},uiTone(){},setTimeout(){},toast(){},updateHud(){},
    endGame(win){if(win)wins++},anmeldungNeighborhoodMonologue(){},showAmtDirectResult(){}});
  vm.runInContext(between('const missions=','const rules=')+between('const forms=','function resize(')+
    between('const formEnglish=','function localize(')+between('function showForm(','let anmeldungAwarded='),scope);
  const handler=source.split('\n').find(line=>line.startsWith('document.getElementById("bureaucracy-form").onsubmit='));
  assert.ok(handler,'production submit handler exists');vm.runInContext(handler,scope);
  node('bureaucracy-form').reportValidity=()=>true;
  return {state,node,scope,get wins(){return wins},submit(){const form=node('bureaucracy-form');form.onsubmit({preventDefault(){},currentTarget:form})}};
}

test('a presented current tax form grants exactly one procedure and closes',()=>{
  const f=fixture();f.scope.showForm('steuer');f.submit();
  assert.equal(f.state.mission,4);assert.equal(f.state.forms,1);assert.equal(f.node('form-modal').hidden,true);assert.equal(f.wins,0);
});

test('an invalid form preserves the active mission and can be retried',()=>{
  const f=fixture();f.scope.showForm('steuer');f.node('bureaucracy-form').reportValidity=()=>false;f.submit();
  assert.equal(f.state.mission,3);assert.equal(f.state.forms,0);assert.equal(f.node('form-modal').hidden,false);
  f.node('bureaucracy-form').reportValidity=()=>true;f.submit();assert.equal(f.state.mission,4);assert.equal(f.state.forms,1);
});

test('duplicate submission of an already consumed tax form cannot skip insurance',()=>{
  const f=fixture();f.scope.showForm('steuer');f.submit();f.submit();
  assert.equal(f.state.mission,4,'the consumed tax receipt must not advance insurance');assert.equal(f.state.forms,1);
});

test('a stale form presentation from a previous procedure cannot grant the current procedure',()=>{
  const f=fixture();f.scope.showForm('steuer');f.submit();
  // Model a delayed previous dialogue callback invoking the real form renderer.
  f.scope.showForm('steuer');f.submit();
  assert.equal(f.state.mission,4,'stale tax completion must not count as insurance');assert.equal(f.state.forms,1);
});

test('an out-of-order citizenship form cannot win while tax registration is current',()=>{
  const f=fixture();f.scope.showForm('citizenship');f.submit();
  assert.equal(f.wins,0,'the final form requires all earlier procedures');assert.equal(f.state.mission,3);assert.equal(f.state.forms,0);
});

test('a hidden form without an active presentation cannot grant a procedure',()=>{
  const f=fixture();f.node('bureaucracy-form').dataset.type='steuer';f.submit();
  assert.equal(f.state.mission,3);assert.equal(f.state.forms,0);
});

test('required form checkboxes retain their visible authored label',()=>{
  const f=fixture();f.scope.showForm('steuer');
  const checkbox=f.node('form-fields').children.find(label=>label.className==='check');
  assert.ok(checkbox);assert.equal(checkbox.children[0].required,true);
  assert.equal(checkbox.children[1].textContent,'Ich bestätige, dass Nichtwissen kein Dateiformat ist.');
});

test('cancelled same-mission dialogue cannot open a form during a later office visit',()=>{
  const f=fixture(),dialogs=[];
  Object.assign(f.scope,{window:{},player:{x:1600,y:1610,r:16},stopSpeech(){},clearInput(){},responderBlocked:()=>false,openDialogue:(...args)=>dialogs.push(args)});
  vm.runInContext(between('let indoorVisit=null;','function cancelAmtAppointment(')+between('function bureaucrat(','function microInteract('),f.scope);
  const building={id:'finanzamt',name:'FINANZAMT',doorX:1600,doorY:1555},mission={title:'STEUERLICHE ERFASSUNG',form:'steuer'};
  f.scope.bureaucrat(building,mission);const stale=dialogs[0][3];f.scope.leaveIndoorBuilding();
  f.scope.bureaucrat(building,mission);stale();
  assert.equal(f.node('form-modal').hidden,true,'the old dialogue callback cannot present a form in the new visit');
  dialogs[1][3]();assert.equal(f.node('form-modal').hidden,false);f.submit();assert.equal(f.state.mission,4);assert.equal(f.state.forms,1);
});

test('cancelling an actual presentation permits a fresh same-mission retry',()=>{
  const f=fixture();f.scope.showForm('steuer');
  vm.runInContext(between('let indoorVisit=null;','function cancelAmtAppointment('),f.scope);
  // Escape hides the form before calling this production cancellation path.
  f.node('form-modal').hidden=true;f.scope.leaveIndoorBuilding();f.submit();
  assert.equal(f.state.mission,3);assert.equal(f.state.forms,0);
  f.scope.showForm('steuer');f.submit();assert.equal(f.state.mission,4);assert.equal(f.state.forms,1);
});

test('a consumed receipt cannot reenter submission from the exit callback',()=>{
  const f=fixture();let exits=0;
  f.scope.leaveIndoorBuilding=()=>{if(++exits===1)f.submit()};f.scope.showForm('steuer');f.submit();
  assert.equal(f.state.mission,4);assert.equal(f.state.forms,1);assert.equal(exits,1);
});

test('every legitimate paperwork procedure, including A38 and final citizenship, remains accepted once',()=>{
  const slots=[[0,'a38'],[1,'wohnung'],[2,'ergaenzung'],[3,'steuer'],[4,'versicherung'],[6,'aufenthalt'],[7,'citizenship']];
  for(const [mission,type] of slots){
    const f=fixture();f.state.mission=mission;f.scope.showForm(type);f.submit();f.submit();
    assert.equal(f.state.mission,mission+1,type);assert.equal(f.state.forms,1,type);assert.equal(f.wins,type==='citizenship'?1:0,type);
  }
});

test('invalid fields cause no leave or reward before a valid retry',()=>{
  const f=fixture();let exits=0;f.scope.leaveIndoorBuilding=()=>exits++;
  f.scope.showForm('steuer');f.node('bureaucracy-form').reportValidity=()=>false;f.submit();
  assert.equal(exits,0);assert.equal(f.state.forms,0);assert.equal(f.wins,0);
  f.node('bureaucracy-form').reportValidity=()=>true;f.submit();assert.equal(exits,1);assert.equal(f.state.forms,1);
});

test('direct A38 result occurs once without opening a competing city monologue',()=>{
  const f=fixture();let continuations=0,results=0;
  f.state.mission=0;f.scope.jwd.allocated=true;f.scope.directBuergeramt=true;f.scope.document.body.classList.contains=()=>false;
  f.scope.anmeldungNeighborhoodMonologue=()=>continuations++;f.scope.showAmtDirectResult=()=>results++;
  f.scope.showForm('a38');f.submit();f.submit();
  assert.equal(f.state.mission,1);assert.equal(f.state.forms,1);assert.equal(continuations,0);assert.equal(results,1);
});
