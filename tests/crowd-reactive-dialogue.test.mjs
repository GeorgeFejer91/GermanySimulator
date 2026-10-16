import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const base=readFileSync(new URL('./fixtures/crowd-reactive-baseline.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const candidate=readFileSync(new URL('../game.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const cast=JSON.parse(readFileSync(new URL('../For-AI/VOICE-CAST.json',import.meta.url),'utf8').replace(/^\uFEFF/,''));
const inventory=JSON.parse(readFileSync(new URL('../For-AI/VOICE-DIALOGUE-INVENTORY.json',import.meta.url),'utf8'));
assert.equal(createHash('sha256').update(base).digest('hex'),'ab701e659cae8a7fc0a20a639eb35fc59f5a0c327bf0e3a62991d015efb71452','the frozen pre-reactive control must not drift');
const genderByVoice=new Map(cast.roleProfiles.map(role=>[role.voiceId,role.gender]));
const regions=['germany','berlin'];
const causes=['grass','road','jaywalker'];
const counts={grass:4,road:4,jaywalker:6};

function sourceOf(source,name){
 const start=source.indexOf(`function ${name}(`);
 assert.notEqual(start,-1,`${name} is missing`);
 let depth=0,opened=false,quote='',escaped=false,lineComment=false,blockComment=false;
 for(let i=source.indexOf('{',start);i<source.length;i++){
  const c=source[i],n=source[i+1];
  if(lineComment){if(c==='\n')lineComment=false;continue}
  if(blockComment){if(c==='*'&&n==='/'){blockComment=false;i++}continue}
  if(quote){if(escaped){escaped=false;continue}if(c==='\\'){escaped=true;continue}if(c===quote)quote='';continue}
  if(c==='/'&&n==='/'){lineComment=true;i++;continue}
  if(c==='/'&&n==='*'){blockComment=true;i++;continue}
  if(c==='"'||c==="'"||c==='`'){quote=c;continue}
  if(c==='{'){depth++;opened=true}
  else if(c==='}'&&opened&&--depth===0)return source.slice(start,i+1);
 }
 throw new Error(`${name} has no closing brace`);
}

function declarationOf(source,name){
 const start=source.indexOf(`const ${name}=`);
 assert.notEqual(start,-1,`${name} is missing`);
 let depth=0,quote='',escaped=false,lineComment=false,blockComment=false;
 for(let i=source.indexOf('=',start)+1;i<source.length;i++){
  const c=source[i],n=source[i+1];
  if(lineComment){if(c==='\n')lineComment=false;continue}
  if(blockComment){if(c==='*'&&n==='/'){blockComment=false;i++}continue}
  if(quote){if(escaped){escaped=false;continue}if(c==='\\'){escaped=true;continue}if(c===quote)quote='';continue}
  if(c==='/'&&n==='/'){lineComment=true;i++;continue}
  if(c==='/'&&n==='*'){blockComment=true;i++;continue}
  if(c==='"'||c==="'"||c==='`'){quote=c;continue}
  if(c==='{')depth++;
  else if(c==='}')depth--;
  else if(c===';'&&depth===0)return source.slice(start,i+1);
 }
 throw new Error(`const ${name} has no terminating semicolon`);
}

const dataNames=['pedestrianBarks','jaywalkerBarks','crowdArchetypes','crowdArchetypeById','crowdCharacterBarks'];
function loadData(source,{reactive=true}={}){
 const names=reactive?['crowdReactiveBarks',...dataNames]:dataNames;
 const declarations=names.map(name=>declarationOf(source,name)).sort((a,b)=>source.indexOf(a)-source.indexOf(b));
 const math=Object.create(Math);math.random=()=>0;
 const context=vm.createContext({Object,Map,Math:math,speechClip:id=>({text:id,recording:`${id}.mp3`,english:''})});
 vm.runInContext(`${declarations.join('\n')}\nglobalThis.data={${names.map(name=>`${name}:${name}`).join(',')}}`,context);
 return {context,data:JSON.parse(vm.runInContext('JSON.stringify(data)',context))};
}

function makeRuntime(source,{region='germany',actors:runtimeActors=[],surface='road',familyActive=false,reactive=true}={}){
 let now=10000;
 const deliveries=[];
 const {context}=loadData(source,{reactive});
 Object.assign(context,{
  performance:{now:()=>now},
  state:{region,started:true,modal:false,gameOver:false},
  player:{x:0,y:0},npcs:runtimeActors,
  dist:(x,y,nx,ny)=>Math.hypot(x-nx,y-ny),
  NPC_COMPLAINT_DISTANCE:180,
  STIMULUS_PRIORITY:{REACTIVE:2},
  stimulusBags:new Map(),deliveries,
  showWorldBark:(...args)=>deliveries.push(args),
  hasStimulusFamily:family=>familyActive&&family==='jaywalker',
  announceCurrentRule:()=>false,
  playerSurface:()=>surface,
 });
 const functions=['nextVariant','pedestrianBark','jaywalkerBark','nearestPedestrian','surfaceComplaint'];
 vm.runInContext(`${functions.map(name=>sourceOf(source,name)).join('\n')}\nglobalThis.api={state,player,npcs,deliveries,get now(){return performance.now()},set now(v){performance.now=()=>v},pedestrianBark,jaywalkerBark,nearestPedestrian,surfaceComplaint}`,context);
 return {context,api:context.api,deliveries,setNow:value=>{now=value},data:context.data};
}

function actorFor(actor){return {name:actor.fullName,voiceId:actor.voiceId,archetype:genderByVoice.get(actor.voiceId)==='male'?'towel-man':'towel-woman',x:20,y:0,barkAt:0,audioRadius:180}}
function rowsFor(actorId,region,cause){return routeRows.filter(row=>row.actorId===actorId&&row.region===region&&row.cause===cause)}
function normalizedDelivery(args){
 const opts=args[5]||{};
 return {speaker:args[0],text:args[1],urgent:args[2],recording:args[3],family:opts.family,candidateVoiceId:opts.candidateVoiceId,
  actorVoiceId:opts.actor?.voiceId,actorName:opts.actor?.name,subtitle:opts.subtitle,priority:opts.priority,ambient:opts.ambient,eligible:opts.isEligible};
}

const baselineVoices=Object.keys(loadData(base,{reactive:false}).data.crowdCharacterBarks);
const actors=baselineVoices.map(voiceId=>{
 const owners=cast.roleProfiles.filter(role=>role.gameRole===voiceId);
 assert.equal(owners.length,1,`${voiceId} must have one public cast owner`);
 const owner=owners[0],binding=cast.productionVoices[voiceId];
 assert.equal(owner.voiceId,voiceId);
 assert.equal(owner.secretTunnelProfileId,binding?.profileId,`${voiceId} must retain its selected production binding`);
 assert.ok(typeof owner.fullName==='string'&&owner.fullName.trim());
 assert.ok(['male','female'].includes(owner.gender));
 return {actorId:owner.gameRole,voiceId:owner.voiceId,fullName:owner.fullName};
});
const reactiveSource=loadData(candidate).data.crowdReactiveBarks;
const routeRows=actors.flatMap(actor=>regions.flatMap(region=>causes.flatMap(cause=>
 (reactiveSource?.[actor.voiceId]?.[region]?.[cause]||[]).map((row,slot)=>({
  actorId:actor.actorId,voiceId:actor.voiceId,region,cause,slot,lineId:row.id,text:row.text,english:row.english
 }))
)));

test('nine cast-owned actors carry the 252-row route/caption matrix; original sidewalk/fallback data remain unchanged',()=>{
 assert.equal(actors.length,9);
 assert.equal(new Set(actors.map(actor=>actor.voiceId)).size,9);
 assert.deepEqual(Object.keys(reactiveSource).sort(),baselineVoices.slice().sort(),'reactive owners must be exactly the frozen nine sidewalk owners');
 assert.equal(routeRows.length,252);
 assert.equal(new Set(routeRows.map(row=>row.lineId)).size,252);
 assert.equal(new Set(routeRows.map(row=>row.text)).size,252);
 assert.deepEqual(inventory.pools.crowdReactiveBarks,reactiveSource,'the generated authoring inventory retains every owned source ID, text and caption');
 for(const actor of actors){
  assert.equal(actor.voiceId,actor.actorId,actor.actorId);
  assert.ok(cast.roleProfiles.find(person=>person.voiceId===actor.voiceId)?.dialogueSources.some(source=>source.includes(`crowdReactiveBarks[${actor.voiceId}]`)),'the saved voice owner indexes its own reactive source');
  assert.equal(routeRows.filter(row=>row.actorId===actor.actorId).length,28);
  assert.deepEqual(Object.keys(reactiveSource[actor.voiceId]).sort(),regions.slice().sort());
  for(const region of regions){
   assert.deepEqual(Object.keys(reactiveSource[actor.voiceId][region]).sort(),causes.slice().sort());
   for(const cause of causes){
    const rows=reactiveSource[actor.voiceId][region][cause];
    assert.ok(Array.isArray(rows));
    assert.equal(rows.length,counts[cause],`${actor.actorId}/${region}/${cause} count`);
    for(const [slot,row] of rows.entries()){
     assert.deepEqual(Object.keys(row).sort(),['english','id','text']);
     assert.equal(row.id,`${actor.voiceId}-reactive-${region}-${cause}-${String(slot+1).padStart(2,'0')}`);
     assert.ok(typeof row.text==='string'&&row.text.trim()&&typeof row.english==='string'&&row.english.trim());
     assert.notEqual(row.text,row.english,'source speech and its English caption must stay distinct');
     const paired=reactiveSource[actor.voiceId][region==='berlin'?'germany':'berlin'][cause][slot];
     assert.equal(row.english,paired.english,`${actor.actorId}/${cause}/${slot} regional variants must retain their common meaning-pair caption`);
     assert.notEqual(row.text,paired.text,'Berlin and Germany retain distinct authored speech');
    }
   }
  }
 }
 assert.equal(declarationOf(base,'crowdCharacterBarks'),declarationOf(candidate,'crowdCharacterBarks'),'the existing full36 sidewalk source must remain byte-for-byte unchanged');
 assert.equal(declarationOf(base,'pedestrianBarks'),declarationOf(candidate,'pedestrianBarks'),'unowned generic fallback text must remain unchanged');
 assert.equal(declarationOf(base,'jaywalkerBarks'),declarationOf(candidate,'jaywalkerBarks'),'unowned jaywalker fallback text must remain unchanged');
 const old=loadData(base,{reactive:false}).data.crowdCharacterBarks;
 const oldLines=Object.values(old).flatMap(byRegion=>Object.values(byRegion).flat());
 assert.equal(oldLines.length,36,'the frozen sidewalk source contains the original 36 lines');
});

test('every owned reactive row is actually selected with its paired caption and the same broker owner fields',()=>{
 for(const actor of actors)for(const region of regions)for(const cause of causes){
  const owner=actorFor(actor),runtime=makeRuntime(candidate,{region,actors:[owner],surface:'road'});
  const expected=rowsFor(actor.actorId,region,cause),selected=[];
  if(cause==='jaywalker'){
   for(let i=0;i<expected.length;i++){
    runtime.api.npcs=[owner];runtime.api.player.x=0;runtime.setNow(10000+i*3400);
    runtime.api.jaywalkerBark();
    const args=runtime.deliveries.at(-1);assert.ok(args,`${actor.actorId}/${region}/${cause} should route`);
    selected.push(args[1]);assert.equal(args[5].subtitle,expected.find(row=>row.text===args[1])?.english);
    assert.equal(args[0],owner.name);assert.equal(args[5].candidateVoiceId,owner.voiceId);assert.equal(args[5].actor,owner);
   }
  }else{
   for(let i=0;i<expected.length;i++){
    owner.barkAt=0;runtime.setNow(10000+i*3400);
    assert.equal(runtime.api.pedestrianBark(owner,cause),true,`${actor.actorId}/${region}/${cause} should route`);
    const args=runtime.deliveries.at(-1);selected.push(args[1]);
    assert.equal(args[5].subtitle,expected.find(row=>row.text===args[1])?.english);
    assert.equal(args[0],owner.name);assert.equal(args[5].candidateVoiceId,owner.voiceId);assert.equal(args[5].actor,owner);
   }
  }
  assert.equal(new Set(selected).size,counts[cause],`${actor.actorId}/${region}/${cause} must visit each bag entry before repeating`);
  assert.deepEqual([...selected].sort(),expected.map(row=>row.text).sort(),`${actor.actorId}/${region}/${cause} must not leak another actor or cause pool`);
  const beforeActor=actorFor(actor),afterActor=actorFor(actor),before=makeRuntime(base,{region,actors:[beforeActor],reactive:false}),after=makeRuntime(candidate,{region,actors:[afterActor]});
  if(cause==='jaywalker'){before.api.jaywalkerBark();after.api.jaywalkerBark()}else{before.api.pedestrianBark(beforeActor,cause);after.api.pedestrianBark(afterActor,cause)}
  const beforeMeta=normalizedDelivery(before.deliveries[0]),afterMeta=normalizedDelivery(after.deliveries[0]);
  for(const field of ['speaker','urgent','family','candidateVoiceId','actorVoiceId','actorName','priority','ambient'])assert.equal(afterMeta[field],beforeMeta[field],`${actor.actorId}/${region}/${cause} must retain existing broker routing field ${field}`);
  assert.equal(afterMeta.eligible(),beforeMeta.eligible(),`${actor.actorId}/${region}/${cause} must retain initial eligibility`);
 }
});

test('reactive no-repeat bags stay isolated when actors alternate A/B/A',()=>{
 const a=actors[0],b=actors[1],actorA=actorFor(a),actorB=actorFor(b),runtime=makeRuntime(candidate,{region:'germany',actors:[actorA,actorB]});
 const chosenA=[];
 for(const [owner,collect] of [[actorA,chosenA],[actorB,[]],[actorA,chosenA],[actorB,[]],[actorA,chosenA],[actorB,[]],[actorA,chosenA]]){
  owner.barkAt=0;runtime.setNow(runtime.api.now+3400);runtime.api.pedestrianBark(owner,'grass');
  if(collect)collect.push(runtime.deliveries.at(-1)[1]);
 }
 assert.equal(new Set(chosenA).size,4,'A must keep its own four-item grass bag across B calls');
});

test('generic actors keep the old fallback and all existing speech eligibility metadata',()=>{
 const generic={name:'UNOWNED FIXTURE',voiceId:'fixture-unowned',x:20,y:0,barkAt:0,audioRadius:180};
 for(const region of regions)for(const cause of ['grass','road']){
  const old=makeRuntime(base,{region,actors:[{...generic}],reactive:false});
  const next=makeRuntime(candidate,{region,actors:[{...generic}]});
  old.api.pedestrianBark(old.api.npcs[0],cause);next.api.pedestrianBark(next.api.npcs[0],cause);
  const before=normalizedDelivery(old.deliveries[0]),after=normalizedDelivery(next.deliveries[0]);
  for(const field of ['speaker','family','candidateVoiceId','actorVoiceId','actorName','priority','ambient','urgent'])assert.equal(after[field],before[field],`${region}/${cause} ${field} changed for an unowned actor`);
  assert.equal(next.deliveries[0][5].subtitle,undefined,'generic string fallback does not acquire a fabricated English caption');
  assert.equal(next.deliveries[0][1],before.text,'generic fallback keeps its original text pool');
  assert.equal(after.eligible(),before.eligible(),'eligible requests retain the same initial admission result');
  const transitions=[];
  for(const mutate of [state=>state.started=false,state=>state.modal=true,state=>state.gameOver=true,state=>state.region=region==='berlin'?'germany':'berlin',(_state,_player,n)=>{n.x=500}]){
   const oldCase=makeRuntime(base,{region,actors:[{...generic}],reactive:false}),newCase=makeRuntime(candidate,{region,actors:[{...generic}]});
   oldCase.api.pedestrianBark(oldCase.api.npcs[0],cause);newCase.api.pedestrianBark(newCase.api.npcs[0],cause);
   mutate(oldCase.api.state,oldCase.api.player,oldCase.api.npcs[0]);mutate(newCase.api.state,newCase.api.player,newCase.api.npcs[0]);
   transitions.push([newCase.deliveries[0][5].isEligible(),oldCase.deliveries[0][5].isEligible()]);
  }
  assert.ok(transitions.every(([after,before])=>after===before),'region/state/distance invalidation must remain the baseline behavior');
 }
});

test('the real nearest-pedestrian road fallback speaks for that nearest actor and retains shared jaywalker cancellation guards',()=>{
 for(const region of regions){
  const near=actorFor(actors[0]),far=actorFor(actors[1]),special={...actorFor(actors[2]),special:true};near.x=60;far.x=220;special.x=5;near.barkAt=20000;
  const runtime=makeRuntime(candidate,{region,actors:[far,special,near],surface:'road'});
  runtime.api.surfaceComplaint('road');
  const args=runtime.deliveries.at(-1);assert.ok(args,'road complaint must use the existing jaywalker fallback when the nearest pedestrian is cooling down');
  const owned=rowsFor(actors[0].actorId,region,'jaywalker');
  assert.ok(owned.some(row=>row.text===args[1]));assert.equal(args[0],near.name);assert.equal(args[5].candidateVoiceId,near.voiceId);assert.equal(args[5].actor,near);
  assert.equal(args[5].family,'jaywalker');assert.equal(args[5].subtitle,owned.find(row=>row.text===args[1]).english);
  assert.equal(args[5].isEligible(),true);
  runtime.api.state.modal=true;assert.equal(args[5].isEligible(),false,'queued jaywalker speech cancels under the unchanged modal guard');
  runtime.api.state.modal=false;runtime.context.playerSurface=()=> 'sidewalk';assert.equal(args[5].isEligible(),false,'queued jaywalker speech cancels after leaving the road');
  runtime.context.playerSurface=()=> 'road';runtime.api.npcs.splice(runtime.api.npcs.indexOf(near),1);assert.equal(args[5].isEligible(),false,'queued speech cancels when its exact actor leaves the live NPC set');
 }
 const blocked=makeRuntime(candidate,{region:'germany',actors:[actorFor(actors[0])],familyActive:true,surface:'road'});
 const oldBlocked=makeRuntime(base,{region:'germany',actors:[actorFor(actors[0])],familyActive:true,surface:'road',reactive:false});
 blocked.api.jaywalkerBark();oldBlocked.api.jaywalkerBark();assert.equal(blocked.deliveries.length,0,'the shared active jaywalker family must still suppress overlap');assert.equal(oldBlocked.deliveries.length,0);
 for(const flags of [{arrested:true},{wisdomId:'reserved-adviser'}]){
  const npc={...actorFor(actors[0]),...flags},next=makeRuntime(candidate,{region:'germany',actors:[npc]}),old=makeRuntime(base,{region:'germany',actors:[{...npc}],reactive:false});
  next.api.jaywalkerBark();old.api.jaywalkerBark();assert.equal(next.deliveries.length,0,'arrested/adviser exclusions must remain ahead of owned selection');assert.equal(old.deliveries.length,0);
 }
});

test('the sidewalk route remains the original actor-owned selection in both regions',()=>{
 for(const actor of actors)for(const region of regions){
  const npc=actorFor(actor),old=makeRuntime(base,{region,actors:[{...npc}],reactive:false}),next=makeRuntime(candidate,{region,actors:[{...npc}]});
  old.api.pedestrianBark(old.api.npcs[0],'sidewalk');next.api.pedestrianBark(next.api.npcs[0],'sidewalk');
  const before=normalizedDelivery(old.deliveries[0]),after=normalizedDelivery(next.deliveries[0]);
  assert.equal(after.text,before.text,`${actor.actorId}/${region} sidewalk wording must stay unchanged`);
  for(const field of ['speaker','urgent','recording','family','candidateVoiceId','actorVoiceId','actorName','priority','ambient'])assert.equal(after[field],before[field],`${actor.actorId}/${region} sidewalk ${field} must stay unchanged`);
  assert.equal(after.eligible(),before.eligible());
 }
});

test('adviser delegation and both pedestrian cooldown guards still preempt reactive selection',()=>{
 for(const actor of actors)for(const region of regions){
  for(const flags of [{jwdRole:true},{wisdomId:'reserved-adviser'}]){
   const npc={...actorFor(actor),...flags},old=makeRuntime(base,{region,actors:[{...npc}],reactive:false}),next=makeRuntime(candidate,{region,actors:[{...npc}]});
   old.api.pedestrianBark(old.api.npcs[0],'grass');next.api.pedestrianBark(next.api.npcs[0],'grass');
   assert.equal(old.deliveries.length,next.deliveries.length,`${actor.actorId}/${region} delegation guard`);assert.equal(next.deliveries.length,0);
  }
  for(const mode of ['actor','global']){
   const old=makeRuntime(base,{region,actors:[actorFor(actor)],reactive:false}),next=makeRuntime(candidate,{region,actors:[actorFor(actor)]});
   if(mode==='actor'){old.api.npcs[0].barkAt=20000;next.api.npcs[0].barkAt=20000}
   else {old.api.pedestrianBark.last=9000;next.api.pedestrianBark.last=9000}
   old.api.pedestrianBark(old.api.npcs[0],'road');next.api.pedestrianBark(next.api.npcs[0],'road');
   assert.equal(old.deliveries.length,next.deliveries.length,`${actor.actorId}/${region} ${mode} cooldown`);assert.equal(next.deliveries.length,0);
  }
 }
});
