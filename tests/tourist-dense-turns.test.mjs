import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

const scope=vm.createContext({});
vm.runInContext(readFileSync((process.env.STREET_ATLAS_MODULE_ROOT?process.env.STREET_ATLAS_MODULE_ROOT+'/':'')+'tourist-animation.js','utf8'),scope);
const animation=scope.TouristAnimations;
const original=JSON.parse(readFileSync('assets/tourists/towelMan/manifest.json','utf8'));
const vectors={down:[0,1],right:[1,0],up:[0,-1],left:[-1,0]};
function denseManifest(){
  const manifest=structuredClone(original);
  manifest.cols=16;
  for(const walk of Object.values(manifest.walks)){walk.frames=16;walk.frame_ms=60}
  return manifest;
}

test('dense walking visits all16 phases and blocked zero input retains heading and phase',()=>{
  const manifest=denseManifest(),actor={spriteFrame:0};
  animation.request(actor,0,-1,manifest);
  const visited=[];
  for(let i=0;i<16;i++){
    animation.advance(actor,manifest.cycle_distance/16,1/60,manifest);
    visited.push(actor.spriteFrame);
  }
  assert.deepEqual([...new Set(visited)].sort((a,b)=>a-b),Array.from({length:16},(_,i)=>i));
  const held={row:actor.spriteRow,col:actor.spriteFrame,distance:actor.gaitDistance};
  animation.request(actor,0,0,manifest);
  animation.advance(actor,0,.5,manifest);
  assert.equal(actor.touristRequested,'up');
  assert.deepEqual({row:actor.spriteRow,col:actor.spriteFrame,distance:actor.gaitDistance},held);
});

test('opt-in dense direction changes hold immediately and complete every authored turn without restarting',()=>{
  const manifest=denseManifest();
  for(const from of Object.keys(vectors))for(const to of Object.keys(vectors)){
    if(from===to)continue;
    const actor={x:31,y:47,touristFacing:from,touristRequested:from,spriteFrame:12,gaitDistance:manifest.cycle_distance*12/16};
    animation.request(actor,...vectors[to],manifest,{planted:true});
    assert(animation.isTurning(actor),`${from}→${to} holds before translation`);
    const turn=actor.touristTurn;
    assert.deepEqual(Array.from(turn.frames,p=>[p.row,p.col]),Array.from(manifest.transitions[from+'-to-'+to].frames,p=>[p.row,p.col]));
    assert(turn.frames.every(p=>!Object.values(manifest.walks).some(w=>w.row===p.row)),'held turn never displays ordinary walk rows');
    const expected=Array.from(turn.frames,frame=>[frame.row,frame.col]);
    const visited=[];
    while(animation.isTurning(actor)){
      const active=actor.touristTurn,phase=active.index,elapsed=active.elapsed;
      visited.push([actor.spriteRow,actor.spriteFrame]);
      animation.request(actor,...vectors[from],manifest,{planted:true});
      assert.equal(actor.touristTurn,turn);
      animation.advance(actor,0,0,manifest);
      assert.equal(active.index,phase);assert.equal(active.elapsed,elapsed);
      animation.advance(actor,0,active.frames[phase].ms/1000,manifest);
      assert(visited.length<=expected.length,'turn has a finite authored endpoint');
      assert.equal(actor.x,31);assert.equal(actor.y,47);
    }
    assert.deepEqual(visited,expected);
    assert.equal(actor.touristFacing,to);assert.equal(actor.spriteFrame,0);assert.equal(actor.gaitDistance,0);
    assert.equal(actor.touristRequested,from,'latest direction remains queued');
  }
});


test('explicit bridge start and stop keep authored neutral endpoints without changing the root',()=>{
  const m=denseManifest(),n={x:5,y:6,touristFacing:'down',spriteRow:m.bridges.down.row,spriteFrame:m.bridges.down.stop_cols.at(-1)};
  animation.start(n,0,1,m);
  assert.equal(n.spriteRow,m.bridges.down.row);assert.equal(n.spriteFrame,m.bridges.down.start_cols[0]);
  while(n.touristTurn)animation.advance(n,0,.07,m);
  assert.equal(n.spriteRow,m.walks.down.row);assert.equal(n.spriteFrame,0);
  animation.advance(n,m.cycle_distance*12/16,0,m);animation.stop(n,m);
  assert.deepEqual(Array.from(n.touristTurn.frames,p=>[p.row,p.col]),Array.from(m.bridges.down.stop_cols,col=>[m.bridges.down.row,col]));
  assert(n.touristTurn.frames.every(p=>!Object.values(m.walks).some(w=>w.row===p.row)),'held stop never displays ordinary walk rows');
  while(n.touristTurn)animation.advance(n,0,.07,m);
  assert.equal(n.spriteRow,m.bridges.down.row);assert.equal(n.spriteFrame,m.bridges.down.stop_cols.at(-1));
  assert.equal(n.x,5);assert.equal(n.y,6);
  animation.start(n,-1,0,m);
  assert.deepEqual(Array.from(n.touristTurn.frames,p=>[p.row,p.col]),Array.from(m.transitions['down-to-left'].frames.slice(m.bridges.down.stop_cols.length),p=>[p.row,p.col]));
});


function withPhaseSettle(){
  const m=denseManifest(),b=m.bridges.left;
  m.settles={left:{'4':{frames:[5,6,7,8,b.stop_cols.at(-1)].map(col=>({row:b.row,col,ms:70}))}}};
  return m;
}
function phaseFourLeft(m){return {x:9,y:11,touristFacing:'left',touristRequested:'left',spriteRow:m.walks.left.row,spriteFrame:4,gaitDistance:m.cycle_distance*4/16}}

test('matching phase turn repeats exact entry then dedicated settle, neutral and remaining authored turn',()=>{
  const m=withPhaseSettle(),n=phaseFourLeft(m),before=[n.spriteRow,n.spriteFrame],distance=n.gaitDistance;
  animation.request(n,1,0,m,{planted:true});
  const plan=n.touristTurn,entry=plan.frames[0],settle=m.settles.left['4'].frames;
  assert.deepEqual([n.spriteRow,n.spriteFrame],before);
  assert.equal(entry.role,'settle-entry');assert.equal(entry.ms,m.walks.left.frame_ms);
  assert.deepEqual(Array.from(plan.frames.slice(1,1+settle.length),p=>[p.row,p.col,p.ms]),settle.map(p=>[p.row,p.col,p.ms]));
  assert.deepEqual(Array.from(plan.frames.slice(1+settle.length),p=>[p.row,p.col]),Array.from(m.transitions['left-to-right'].frames.slice(m.bridges.left.stop_cols.length),p=>[p.row,p.col]));
  assert(plan.frames.slice(1).every(p=>!Object.values(m.walks).some(w=>w.row===p.row)));
  let seen=0;
  while(n.touristTurn){
    assert(++seen<=32);assert.equal(n.gaitDistance,distance);assert.equal(n.x,9);assert.equal(n.y,11);
    const index=plan.index,elapsed=plan.elapsed;
    animation.request(n,0,-1,m,{planted:true});animation.advance(n,0,0,m);
    assert.equal(n.touristTurn,plan);assert.equal(plan.index,index);assert.equal(plan.elapsed,elapsed);
    animation.advance(n,0,plan.frames[index].ms/1000,m);
  }
  assert.equal(n.touristFacing,'right');assert.equal(n.touristRequested,'up');assert.equal(n.spriteFrame,0);
});

test('matching phase stop ends at source neutral; uncovered phase retains bridge fallback',()=>{
 const m=withPhaseSettle(),n=phaseFourLeft(m);animation.stop(n,m);
 assert.deepEqual([n.spriteRow,n.spriteFrame],[m.walks.left.row,4]);
 assert.equal(n.touristTurn.frames.length,1+m.settles.left['4'].frames.length);
 assert.equal(n.touristTurn.frames[0].role,'settle-entry');
 while(n.touristTurn)animation.advance(n,0,.07,m);
 assert.deepEqual([n.spriteRow,n.spriteFrame],[m.bridges.left.row,m.bridges.left.stop_cols.at(-1)]);
 for(const turn of [false,true]){
  const a=phaseFourLeft(m);a.spriteFrame=3;
  if(turn)animation.request(a,1,0,m,{planted:true});else animation.stop(a,m);
  assert(a.touristTurn.frames.every(p=>!Object.values(m.walks).some(w=>w.row===p.row)));
  const expected=turn?m.transitions['left-to-right'].frames:m.bridges.left.stop_cols.map(col=>({row:m.bridges.left.row,col}));
  assert.deepEqual(Array.from(a.touristTurn.frames,p=>[p.row,p.col]),Array.from(expected,p=>[p.row,p.col]));
 }
});
