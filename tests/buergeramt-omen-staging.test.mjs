import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {harness,source} from './amt-harness.mjs';

function retreatFixture(dt){
 const h=harness('host',{cinematics:true,voice:true});h.node('amt-exit').click();
 // Test-only access to the real controller, rather than a second movement model.
 vm.runInContext(source('buergeramt.js').replace(/\}\)\(\);\s*$/,
  'window.retreatProbe={characters,view,officeBlocked};})();'),h.context);
 const level=h.window.BuergeramtLevel,probe=h.window.retreatProbe,actor=probe.characters[0];
 level.open(h.config);h.key('KeyW');
 for(let i=0;i<300&&level.stage!=='omen';i++)level.update(.05);
 h.key('KeyW','keyup');
 for(let i=0;i<40/dt&&level.omen.phase==='approach';i++)level.update(dt);
 assert.equal(level.omen.phase,'blackout');h.tick(16);h.synth.start();h.synth.end();
 function until(phase){for(let i=0;i<40/dt&&level.omen.phase!==phase;i++)level.update(dt);assert.equal(level.omen.phase,phase)}
 return{level,probe,actor,until};
}

for(const dt of [1/60,1/30,.1]){
 test(`remaining return yields to a legal stationary player at dt=${dt}`,()=>{
  const {level,probe,actor,until}=retreatFixture(dt);until('');
  const target=actor.omenReturn?.[0];assert(target,'fixture still has a return path when controls resume');
  const dx=target[0]-actor.x,dz=target[1]-actor.z,length=Math.hypot(dx,dz);
  probe.view.x=actor.x+dx/length*1.2;probe.view.z=actor.z+dz/length*1.2;
  assert.equal(probe.officeBlocked(probe.view.x,probe.view.z),false,'stationary player is at a legal position');
  for(let i=0;i<8/dt;i++){
   const before=[actor.x,actor.z];level.update(dt);
   assert(Math.hypot(actor.x-probe.view.x,actor.z-probe.view.z)>=1.05-1e-8,'return respects player clearance');
   assert(Math.hypot(actor.x-before[0],actor.z-before[1])<=.75*dt+1e-8,'rerouting cannot teleport');
  }
 });
 test(`a small late prop cannot strand the courier on his retreat at dt=${dt}`,()=>{
  const {level,actor,until}=retreatFixture(dt);until('depart');
  const target=actor.omenReturn.at(-1),dx=target[0]-actor.x,dz=target[1]-actor.z,distance=Math.hypot(dx,dz);
  const prop={x:actor.x+dx/distance,z:actor.z+dz/distance,w:.3,d:.3};level.setOfficeObstacles([prop]);
  let elapsed=0,lastMove=0;
  for(let i=0;i<30/dt;i++){
   const before=[actor.x,actor.z],returning=!!actor.omenReturn;level.update(dt);elapsed+=dt;
   const move=Math.hypot(actor.x-before[0],actor.z-before[1]);if(move>1e-9)lastMove=elapsed;
   if(returning)assert(move<=.75*dt+1e-8,'return speed remains bounded');
   assert(Math.hypot(Math.max(0,Math.abs(actor.x-prop.x)-prop.w/2),Math.max(0,Math.abs(actor.z-prop.z)-prop.d/2))>=.22-1e-8,'body stays outside the late prop');
  }
  assert.equal(level.omen.phase,'');
  assert(!actor.omenReturn||elapsed-lastMove<5,'a clear alternate route is used instead of waiting forever at a corner');
 });
}

for(const dt of [1/60,1/30,.1])test(`the staged route clears a blocking prop and paused people at dt=${dt}`,()=>{
 const h=harness('host',{cinematics:true,voice:true});
 const prop={x:-2.7,z:-3.8,w:1.5,d:1.2};h.level.setOfficeObstacles([prop]);h.enterUntilOmen();
 const initial=h.level.omen,player=h.level.view,board=h.level.queueDisplay;
 let prior=initial,travel=0,minPlayer=Infinity,minOther=Infinity;
 for(let i=0;i<2000&&h.level.omen.phase==='approach';i++){
  h.level.update(dt);const current=h.level.omen,distance=Math.hypot(current.x-prior.x,current.z-prior.z);
  assert(distance<=.78*dt+1e-8);travel+=distance;
  assert(!(Math.abs(current.x-prop.x)<prop.w/2+.34&&Math.abs(current.z-prop.z)<prop.d/2+.34),'courier body clears prop');
  assert(!(Math.abs(current.x)<1.74&&Math.abs(current.z+4.22)<.42),'courier body clears the visible QR stand');
  minPlayer=Math.min(minPlayer,Math.hypot(current.x-player.x,current.z-player.z));
  for(const other of h.level.characters.slice(1))minOther=Math.min(minOther,Math.hypot(current.x-other.x,current.z-other.z));
  assert.equal(h.level.queueDisplay,board);assert.equal(h.level.view.x,player.x);assert.equal(h.level.view.z,player.z);
  if(h.level.omen.life.isolation===1)assert(h.level.omen.strength>=prior.strength);
  prior=current;
 }
 assert.equal(h.level.omen.phase,'blackout');assert(minPlayer>=1.68-1e-8);assert(minOther>=.84-1e-8);
 assert(travel>Math.hypot(prior.x-initial.x,prior.z-initial.z)+.1,'route bends around the blocking furniture');
 h.tick(16);h.synth.start();h.synth.end();
 for(let i=0;i<2000&&h.level.omen.phase;i++){
  const before=h.level.omen;h.level.update(dt);const current=h.level.omen;
  if(current.phase==='turn'){assert.equal(current.x,before.x);assert.equal(current.z,before.z)}
  assert(!(Math.abs(current.x-prop.x)<prop.w/2+.34&&Math.abs(current.z-prop.z)<prop.d/2+.34));
 }
 assert.equal(h.level.stage,'walk-sign');
});

test('a late blocking prop cancels to a bounded recovery when no route exists',()=>{
 const h=harness('host',{cinematics:true});h.enterUntilOmen();h.advanceGame(1);
 h.level.setOfficeObstacles([{x:0,z:-2,w:16,d:20}]);h.advanceGame(.2);
 assert.equal(h.level.omen.phase,'recover');h.advanceGame(2);
 assert.equal(h.level.omen.phase,'');assert.equal(h.level.stage,'walk-sign');
});

test('hidden-page pause and replay preserve and then clear the isolation and turn',()=>{
 const h=harness('host',{cinematics:true,voice:true});h.enterUntilOmen();h.advanceGame(12);h.tick(16);h.synth.start();h.synth.end();h.advanceGame(5.3);
 assert.equal(h.level.omen.phase,'turn');const before=h.level.omen;h.hide();h.advanceGame(10);
 assert.equal(h.level.omen.turnProgress,before.turnProgress);assert.equal(h.level.omen.life.isolation,1);
 h.document.hidden=false;h.level.replay(h.config);
 assert.equal(h.level.omen.phase,'');assert.equal(h.level.omen.life.isolation,0);
});
