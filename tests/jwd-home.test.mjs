import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {harness as officeHarness} from './amt-harness.mjs';
const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
function fn(name){
 const start=source.indexOf(`function ${name}(`),open=source.indexOf('{',start);assert.ok(start>=0);
 let depth=1,quote=null,escape=false;
 for(let i=open+1;i<source.length;i++){const c=source[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote=null;continue}if(c==='"'||c==="'"||c==='`'){quote=c;continue}if(c==='{')depth++;else if(c==='}'&&!--depth)return source.slice(start,i+1)}
 throw Error(name);
}
function harness(){
 const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',hidden:false});return nodes.get(id)};
 const h={WORLD:{w:10960,h:5360},RAIL_GUTTER:560,TREE_RADIUS:38,player:{x:2360,y:2320,r:16,energy:100},state:{started:true,mission:0,lang:'de',wanted:3},window:{},document:{getElementById:node},localStorage:{setItem(){}},anmeldungAwarded:false,
  goerlitzerPark:{x:10000,y:4000,w:100,h:100},wirtschaftswunderSite:{x:10000,y:4200,collisionRadius:142},kiesingerMemorial:{x:10000,y:4500},props:[],normObjects:[],trees:[],walkways:[],grassAreas:[],trains:[],trafficCars:[],policeVehicles:[],police:[],stationElevation:()=>0,
  policePath:{x1:4810,y1:4410},OFFENSE_TIMING:{policeContactCooldown:5.8},dist:(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by),clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),offsetWorldPoint:b=>({...b,x:b.x+560,y:b.y+560}),updateHud(){},clearInput(){},syncPoliceResponse(){},uiTone(){},toast(){},renderAnmeldungBadge(){}};
 h.openDialogue=(speaker,lines,portrait,done)=>{h.state.modal=h.state.dialogue=true;h.dialogue={speaker,lines,done}};
 h.finish=()=>{const done=h.dialogue?.done;h.dialogue=null;h.state.modal=h.state.dialogue=false;done?.()};
 vm.createContext(h);
 const between=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)+a.length));
 vm.runInContext(between('const buildings=','const grassAreas=')+between('const missions=','const rules=')+source.split('\n').find(l=>l.startsWith('const jwdLane=')).replace('walkways.push(jwdLane);','')+
  between('const jwdNeighborhood=','for(const b of buildings)')+between('const npcs=',' {x:520,y:720')+'].map(offsetWorldPoint);'+between('const jwd=','window.Germany3DBridge=')+
  ['groundCircleCandidates','propRadius','normObjectRadius','staticBlocked','groundContactBlocks','signedRectDistance','groundStaticMotionBlocked','pedestrianRouteContains','responderBlocked','moveGroundResponder','awardAnmeldung'].map(fn).join('\n')+';globalThis.jwdState=jwd;globalThis.actors=npcs;globalThis.homes=buildings;globalThis.lane=jwdLane;',h);
 for(const n of h.actors)n.routeBounds=h.lane;
 const treeCoordinates=JSON.parse('['+source.split('trees=Object.freeze([')[1].split('].map(')[0]+']');h.trees.push(...treeCoordinates.map(([x,y])=>h.offsetWorldPoint({x,y})));
 h.home=h.homes.find(b=>b.id==='jwd-home');
 return h;
}

test('registration is the allocation cause; a stored badge or premature visit grants no house',()=>{
 const h=harness();h.anmeldungAwarded=true;h.visitJwdHome();h.finish();assert.equal(h.jwdState.allocated,false);assert.equal(h.jwdState.visited,false);
 h.arrestPlayer();assert.equal(h.player.x,h.policePath.x1);
 h.awardAnmeldung();h.awardAnmeldung();assert.equal(h.jwdState.allocated,true);assert.equal(h.jwdState.visit,0);
 assert.equal(h.currentMission().target,'buergeramt','A38 handoff still comes first');h.state.mission=1;assert.equal(h.currentMission().target,'jwd-home');
});

test('real registration completion delivers allocation once, while withholding phone silence prevents it',()=>{
 const city=harness(),office=officeHarness();office.config.onRegistration=city.awardAnmeldung;
 office.counter();assert.equal(city.jwdState.allocated,false);
 office.links[0].message({type:'silence',id:'grass'});
 const settle=()=>{for(let i=0;i<600&&!office.node('amt-actions').children.some(b=>!b.disabled);i++)office.tick(100)};
 settle();for(let i=0;office.level.stage!=='success'&&i<60;i++){office.action(0);settle()}
 assert.equal(office.level.stage,'success');assert.equal(city.jwdState.allocated,true);assert.equal(city.jwdState.visited,false);
});

test('home visit and all three completed introductions gate the detour without shifting eight procedures',()=>{
 const h=harness();h.awardAnmeldung();h.state.mission=1;h.visitJwdHome();h.finish();assert.equal(h.currentMission().target,'jwd-neighbors');
 const expected=['jwd-swabian','jwd-parent','jwd-watcher'];
 for(const id of expected){assert.equal(h.getMissionWaypoint().id,id);const n=h.actors.find(n=>n.id===id);h.talkJwdNeighbor(n);assert.equal(h.jwdState.met.has(id),false,'speaking alone is not an introduction receipt');h.finish();h.talkJwdNeighbor(n);h.finish()}
 assert.equal(h.jwdState.met.size,3);assert.equal(h.currentMission().target,'hausverwaltung');assert.equal(h.state.mission,1);
});

test('each arrest wakes at a body-clear porch and buys exactly one finite departure interruption',()=>{
 const h=harness();h.awardAnmeldung();h.state.mission=1;h.visitJwdHome();h.finish();h.actors.forEach(n=>h.jwdState.met.add(n.id));
 for(let visit=0;visit<5;visit++){
  h.arrestPlayer();assert.equal(h.state.wanted,0);assert.ok(h.dist(h.player.x,h.player.y,h.home.doorX,h.home.doorY)<150);assert.equal(h.responderBlocked(h.player.x,h.player.y,16,h.player),false);
  h.player.x=h.home.doorX+160;h.player.y=h.home.doorY+70;assert.equal(h.updateJwd(1/60),true);assert.equal(h.state.dialogue,true);assert.equal(h.dialogue.lines.length,2);h.finish();assert.equal(h.jwdState.exitPending,false);
  h.updateJwd(1/60);assert.equal(h.state.dialogue,false,'no repeating trap once the interruption is acknowledged');
 }
 assert.ok(h.jwdState.complaint>=5);
});

test('burglar checks the poor home, then actually walks to the richer house with collision and pause ownership',()=>{
 const h=harness();h.awardAnmeldung();h.visitJwdHome();h.finish();h.jwdState.exitPending=false;h.jwdState.visit=2;
 Object.assign(h.player,{x:h.home.doorX,y:h.home.doorY+90});let sawInspection=false,retreatX=null,minClearance=Infinity;
 for(let step=0;step<1800;step++){
  h.updateJwd(step%3===0?.1:1/60);const n=h.jwdState.burglar;
  if(n){assert.equal(h.staticBlocked(n.x,n.y,13),false);assert.equal(h.pedestrianRouteContains(n,n.x,n.y),true);for(const other of [...h.actors.filter(x=>x!==n),h.player])minClearance=Math.min(minClearance,h.dist(n.x,n.y,other.x,other.y)-(other.r||13)-13)}
  if(h.state.dialogue){assert.match(h.dialogue.lines.join(' '),/Matratze/);sawInspection=true;retreatX=n.x;h.finish()}
  if(sawInspection&&!n)break;
 }
 assert.ok(sawInspection);assert.equal(h.jwdState.burglar,null);assert.ok(retreatX<h.homes.find(b=>b.id==='jwd-kranz').doorX);assert.ok(minClearance>=-.01);assert.equal(h.jwdState.burglarVisit,2);
 h.updateJwd(.1);assert.equal(h.jwdState.burglar,null,'one burglar per eligible home visit');
});

test('occupied porch recovers to the adjacent paved lane instead of overlapping a visitor',()=>{
 const h=harness();h.awardAnmeldung();for(const dy of [30,65,100])for(const dx of [0,-40,40,-80,80])h.actors.push({x:h.home.doorX+dx,y:h.home.doorY+dy});
 h.arrestPlayer();assert.ok(h.player.x>=h.lane.x&&h.player.x<=h.lane.x+h.lane.w);assert.ok(h.player.y>=h.lane.y&&h.player.y<=h.lane.y+h.lane.h);assert.equal(h.responderBlocked(h.player.x,h.player.y,16,h.player),false);
});

test('burglar gets around a blocked lane at 60/30/10 Hz and can inspect an occupied doorstep',()=>{
 for(const dt of [1/60,1/30,.1])for(const avoid of [-1,1])for(const obstacle of ['prop','player']){
  const h=harness();h.awardAnmeldung();h.visitJwdHome();h.finish();h.jwdState.exitPending=false;h.jwdState.visit=2;
  Object.assign(h.player,{x:h.home.doorX,y:h.home.doorY+(obstacle==='player'?35:95)});
  if(obstacle==='prop')h.props.push({x:1245,y:4575,collisionRadius:35});let inspected=false;
  for(let elapsed=0;elapsed<25;elapsed+=dt){h.updateJwd(dt);const thief=h.jwdState.burglar;
   if(thief){thief.avoid=avoid;assert.equal(h.staticBlocked(thief.x,thief.y,13),false);assert.equal(h.pedestrianRouteContains(thief,thief.x,thief.y),true)}
   if(h.state.dialogue){inspected=true;h.finish()}if(inspected&&!thief)break;
  }
  assert.ok(inspected,`${dt}/${avoid}/${obstacle}: inspection`);assert.equal(h.jwdState.burglar,null,`${dt}/${avoid}/${obstacle}: returns to rich house`);
 }
});

test('diagnostic renderer retains the same residential plots, residents and paved lane',()=>{
 const diagnostic=readFileSync(new URL('../3d.html',import.meta.url),'utf8');
 for(const line of source.split('\n').filter(l=>l.includes('residential:true')||/jwdRole:"(swabian|parent|watcher)"/.test(l)))assert.ok(diagnostic.includes(line.trim()));
 assert.ok(diagnostic.includes('offsetWorldPoint({x:40,y:3970,w:1010,h:150})'));
});

test('burglar plants his feet at an occupied retreat doorway and leaves when it clears',()=>{
 for(const dt of [1/60,1/30,.1]){
  const h=harness();h.awardAnmeldung();h.visitJwdHome();h.finish();h.jwdState.exitPending=false;h.jwdState.visit=2;Object.assign(h.player,{x:h.home.doorX,y:h.home.doorY+95});
  for(let i=0;i<20/dt&&!h.state.dialogue;i++)h.updateJwd(dt);assert.ok(h.state.dialogue);h.finish();
  const rich=h.homes.find(b=>b.id==='jwd-kranz');Object.assign(h.player,{x:rich.doorX,y:rich.doorY+35});
  for(let i=0;i<15/dt;i++)h.updateJwd(dt);const thief=h.jwdState.burglar;assert.ok(thief);const position=[thief.x,thief.y];
  for(let i=0;i<3/dt;i++)h.updateJwd(dt);assert.deepEqual([thief.x,thief.y],position);assert.equal(thief.jwdMoving,0);
  h.player.y+=90;for(let i=0;i<10/dt&&h.jwdState.burglar;i++)h.updateJwd(dt);assert.equal(h.jwdState.burglar,null);
 }
});

test('paved home lane connects with full body clearance to the existing north/south pavement',()=>{
 const h=harness(),r=h.player.r;
 for(const b of h.homes.filter(b=>b.residential))assert.equal(h.staticBlocked(b.doorX,b.doorY+35,r),false);
 for(let x=h.home.doorX;x<=1574;x+=4)assert.equal(h.staticBlocked(x,4600,r),false);
 assert.ok(1574-r>=h.lane.x&&1574+r<=h.lane.x+h.lane.w);assert.ok(h.lane.y+13<4600&&4600<h.lane.y+h.lane.h-13);
 assert.ok(h.home.x<1200&&h.home.y>4200,'home lies at the southwest city edge');
});

test('six garden-suburb plots connect around the block without crossing lawns or solids',()=>{
 const h=harness(),lanes=[h.lane,...h.walkways],homes=h.homes.filter(b=>b.residential);assert.equal(homes.length,6);
 for(const b of homes.filter(b=>b.variant)){
  const route=[{x:b.doorX,y:b.doorY},{x:b.doorX,y:4220},{x:630,y:4220},{x:630,y:4660},{x:h.home.doorX,y:4660},{x:h.home.doorX,y:h.home.doorY+30}];
  for(let segment=1;segment<route.length;segment++){const a=route[segment-1],z=route[segment],steps=Math.ceil(h.dist(a.x,a.y,z.x,z.y)/2);
   for(let i=0;i<=steps;i++){const x=a.x+(z.x-a.x)*i/steps,y=a.y+(z.y-a.y)*i/steps;assert.ok(lanes.some(r=>x-16>=r.x&&x+16<=r.x+r.w&&y-16>=r.y&&y+16<=r.y+r.h),'body-clear connected paving');assert.equal(h.responderBlocked(x,y,16,h.player,x,y),false,b.id+' approach');assert.ok(!h.grassAreas.some(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h),'walking route never needs a lawn offence')}
  }
 }
});
