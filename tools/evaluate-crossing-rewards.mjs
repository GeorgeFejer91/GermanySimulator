// Focused deterministic model; run from the checkout whose game.js is under test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const source = fs.readFileSync('game.js', 'utf8');
const cut = (start, end) => {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert(a >= 0 && b > a, 'Production seam changed: ' + start);
  return source.slice(a, b);
};
const constants = source.match(/const GERMANNESS_MAX=\d+,LAW_POWER_THRESHOLD=\d+;/)?.[0];
assert(constants, 'Missing production reward constants');
const functions = cut('function addGermanness(', 'function flashGermannessGain(')
  + cut(source.includes('function crossingBank(')?'function crossingBank(':'function updateGermannessEvents(', 'function useLawPower(');

function model(phaseOffset) {
  const state = {ampelClock:0, lawCooldown:0, wasOnRoad:false, crossingRun:null,
    crossRewardAt:-9, germanness:0, lawUnlocked:false, region:'berlin'};
  const player = {x:-24, y:20}, events = [];
  const sandbox = {state, player, events, particles:[],
    crossings:[{x:0,y:0,w:100,h:40}],
    trafficLights:[
      {crossingId:0,waitX:-24,waitY:20,phaseOffset,rewardCycle:-1,waitedCycle:-9,waitTime:0},
      {crossingId:0,waitX:124,waitY:20,phaseOffset,rewardCycle:-1,waitedCycle:-9,waitTime:0}],
    clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
    dist:(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by),
    inRect:(x,y,r)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h,
    onRoad:(x,y)=>x>=0&&x<=100&&y>=0&&y<=40,
    toast(){}, flashGermannessGain(){}, showWorldBark(){}, queueNationalAnthem(){},
    uiTone(){}, updateHud(){}, setTimeout(){},
    germannessVoice:{gain:{text:''},loss:{text:''}}, STIMULUS_PRIORITY:{CRITICAL:0},
    document:{getElementById:()=>({hidden:true})}};
  vm.runInNewContext(constants + functions + `
    const award=addGermanness;
    addGermanness=(amount,reason)=>{const before=state.germanness;award(amount,reason);events.push({at:state.ampelClock,x:player.x,requestedAmount:amount,appliedAmount:state.germanness-before,score:state.germanness})};
    let px=player.x,py=player.y;
    globalThis.step=(dt,mag)=>{updateGermannessEvents(dt,mag,px,py);px=player.x;py=player.y};
  `, sandbox);
  return sandbox;
}

// Minimal trace uses the same production event/reward functions as the trials.
const minimal = model(0);
minimal.state.ampelClock=6.1;
for (const x of [-1,1,-1]) {minimal.player.x=x;minimal.step(.025,1)}

const rows = [];
for (const policy of ['full-crossing','wait-red-then-cross','same-side-retreat']) {
  for (let seed=1; seed<=64; seed++) {
    // ponytail: seed only signal phase; expand world/policy coverage for a full balance question.
    const phase=(Math.imul(seed,2654435761)>>>0)/2**32*12;
    const m=model(phase), dt=.025;
    let target=null, side=-1, armed=false, unlockedAt=null, traversals=0;
    for (let i=0; i<2400; i++) {
      const green=Math.floor((m.state.ampelClock+dt+phase)/6)%2===1;
      let moving=false;
      if (target===null && green && (policy!=='wait-red-then-cross'||armed)) {
        target=policy==='same-side-retreat'?.25:(side<0?124:-24);
      }
      if (target!==null) {
        const dx=target-m.player.x;
        m.player.x+=Math.sign(dx)*Math.min(Math.abs(dx),110*dt);
        moving=true;
      } else if (!green) armed=true;
      m.step(dt,moving?1:0);
      if (target!==null && Math.abs(target-m.player.x)<1e-9) {
        if (policy==='same-side-retreat' && target===.25) target=-24;
        else {if(policy!=='same-side-retreat')traversals++;side*=-1;target=null;armed=false}
      }
      if (unlockedAt===null && m.state.lawUnlocked) unlockedAt=m.state.ampelClock;
    }
    rows.push({policy,seed,phase,score:m.state.germanness,unlockedAt,scriptedFullTraversals:traversals,
      awardAttempts:m.events.length,requestedRewardSum:m.events.reduce((n,e)=>n+e.requestedAmount,0),
      appliedRewardSum:m.events.reduce((n,e)=>n+e.appliedAmount,0)});
  }
}
const percentile=(xs,p)=>xs.toSorted((a,b)=>a-b)[Math.floor((xs.length-1)*p)]??null;
const summary=[...new Set(rows.map(r=>r.policy))].map(policy=>{
  const samples=rows.filter(r=>r.policy===policy),times=samples.map(r=>r.unlockedAt).filter(t=>t!==null);
  return {policy,n:samples.length,unlockCount:times.length,
    unlockSeconds:{p10:percentile(times,.1),p50:percentile(times,.5),p90:percentile(times,.9)},
    scoreRange:[Math.min(...samples.map(r=>r.score)),Math.max(...samples.map(r=>r.score))],
    scriptedTraversalsRange:[Math.min(...samples.map(r=>r.scriptedFullTraversals)),Math.max(...samples.map(r=>r.scriptedFullTraversals))]};
});
console.log(JSON.stringify({sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),
  conditions:{durationSeconds:60,dtSeconds:.025,seeds:'1..64',geometry:'existing test crossing fixture',speed:110},
  minimal:{x:[-1,1,-1],initialSignalClock:6.1,events:minimal.events},summary,rows,
  limits:['Production reward functions; synthetic movement and one test crossing',
    'No collision/traffic, energy, quiz, mission, dialogue, real input or physical device simulation',
    'Signal-phase trials are model scenarios, not sampled human players; no balance target or retuning']},null,2));
