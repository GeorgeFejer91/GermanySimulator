import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import {motionObserverSource,pedestrianAvoidanceSource} from './street-simulation-fixture-source.mjs';

const source=readFileSync('game.js','utf8').replaceAll('\r\n','\n');
const movement=source.match(/function moveGroundResponder\(entity,dx,dy,r\)\{[\s\S]*?\n\}/)[0];
const start=source.indexOf('   const lane=n.routeBounds?pedestrianLane(n):null,correction=');
const end=source.indexOf('\n }\n state.ruleTimer',start);
assert(start>=0&&end>start);
const route=source.slice(start,end);
function fixture({held=true,blocked=false}={}){
  const actor={x:50,y:50,vx:12,vy:0,min:0,max:100,blockedTimer:.3,avoid:1};
  const events=[];
  const scope=vm.createContext({actor,events,dt:.1,Math,
    responderBlocked:()=>blocked,clamp:(n,min,max)=>Math.max(min,Math.min(max,n)),
    pedestrianRouteStalled:()=>{events.push('stalled');return false},
    requestCharacterReaction:()=>events.push('failed'),
  });
  const contact=source.match(/^function groundContactBlocks\([^\n]+/m)[0];
  vm.runInContext(motionObserverSource(source)+'\n'+movement+'\n'+contact+'\n'+pedestrianAvoidanceSource(source)+`
    streetMotionObserver={accepts:n=>n===actor,requestMove:()=>${held},accepted:()=>events.push('accepted'),failed:()=>events.push('observer-failed')};
    globalThis.step=()=>{for(const n of [actor]){${route}}};`,scope);
  return {scope,actor,events};
}

test('a planted hold preserves the route and root without collision avoidance or stall accounting',()=>{
  const f=fixture(),before={...f.actor};
  for(let i=0;i<40;i++)f.scope.step();
  assert.deepEqual(f.actor,before);
  assert.deepEqual(f.events,[]);
});

test('releasing the hold resumes accepted movement, while a real obstruction still reverses',()=>{
  const free=fixture({held:false});free.scope.step();
  assert(free.actor.x>50);assert.equal(free.actor.vx,12);assert(free.events.includes('accepted'));
  const blocked=fixture({held:false,blocked:true});blocked.scope.step();
  assert.equal(blocked.actor.x,50);assert.equal(blocked.actor.vx,-12);assert.equal(blocked.actor.pause,.2);
  assert.deepEqual(blocked.events,['failed']);
});

function movementProbe(blocked,hold=true){
 const actor={x:0,y:0,avoid:1},requests=[],accepted=[];
 const scope=vm.createContext({actor,requests,accepted,Math,responderBlocked:blocked});
 vm.runInContext(motionObserverSource(source)+'\n'+movement+`
  streetMotionObserver={accepts:n=>n===actor,requestMove:(n,dx,dy)=>{requests.push([dx,dy,n.x,n.y]);return ${hold}},accepted:(n,x,y)=>accepted.push([x,y,n.x,n.y]),failed:()=>{throw Error('observer failed')}};
  globalThis.move=(dx,dy)=>moveGroundResponder(actor,dx,dy,13);`,scope);
 return {actor,requests,accepted,move:scope.move};
}

test('a fully blocked request never starts a held animation or reports accepted movement',()=>{
 const f=movementProbe(()=>true);
 for(let i=0;i<100;i++)assert.equal(f.move(1,0),false);
 assert.deepEqual(f.requests,[]);assert.deepEqual(f.accepted,[]);assert.deepEqual(f.actor,{x:0,y:0,avoid:1});
});

test('a legal avoidance path requests its actual heading before translating the root',()=>{
 const f=movementProbe(x=>x>0);
 assert.equal(f.move(2,0),null);
 assert.equal(f.requests.length,1);assert.deepEqual(Array.from(f.requests[0]),[0,1.44,0,0]);
 assert.deepEqual(f.actor,{x:0,y:0,avoid:1});assert.deepEqual(f.accepted,[]);
});

test('a lane correction requests the combined displacement and commits each accepted segment once',()=>{
 const held=movementProbe(()=>false);
 assert.equal(held.move(.4,.01),null);assert.equal(held.requests.length,1);
 assert.deepEqual(Array.from(held.requests[0]),[.4,.01,0,0]);
 const free=movementProbe(()=>false,false);assert.equal(free.move(.4,.01),true);
 assert.deepEqual(free.actor,{x:.4,y:.01,avoid:1});assert.equal(free.requests.length,1);
 assert.deepEqual(free.accepted.map(x=>Array.from(x)),[[0,0,.4,0],[.4,0,.4,.01]]);
});
