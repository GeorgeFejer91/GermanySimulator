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
 const h={WORLD:{w:10960,h:5360},RAIL_GUTTER:560,TREE_RADIUS:38,player:{x:2360,y:2320,r:16,energy:100},state:{started:true,mission:0,lang:'de',wanted:3,germanness:0},window:{},document:{getElementById:node},localStorage:{setItem(){}},anmeldungAwarded:false,
  goerlitzerPark:{x:10000,y:4000,w:100,h:100},wirtschaftswunderSite:{x:10000,y:4200,collisionRadius:142},kiesingerMemorial:{x:10000,y:4500},props:[],normObjects:[],trees:[],walkways:[],grassAreas:[],trains:[],trafficCars:[],policeVehicles:[],police:[],stationElevation:()=>0,
  policePath:{x1:4810,y1:4410},OFFENSE_TIMING:{policeContactCooldown:5.8},dist:(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by),clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),offsetWorldPoint:b=>({...b,x:b.x+560,y:b.y+560}),updateHud(){},clearInput(){},syncPoliceResponse(){},uiTone(){},toast(){},renderAnmeldungBadge(){}};
 h.addGermanness=amount=>{h.state.germanness=Math.min(15,h.state.germanness+amount)};
 h.openDialogue=(speaker,lines,portrait,done,voiceId,subtitles)=>{h.state.modal=h.state.dialogue=true;h.dialogue=h.state.dialogueData={speaker,lines,done,voiceId,subtitles}};
 h.finish=()=>{const done=h.dialogue?.done;h.dialogue=null;h.state.modal=h.state.dialogue=false;done?.()};
 vm.createContext(h);vm.runInContext(readFileSync(new URL('../jwd-gardens.js',import.meta.url),'utf8'),h);
 const between=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)+a.length));
 vm.runInContext(between('const buildings=','const grassAreas=')+between('const missions=','const rules=')+source.split('\n').find(l=>l.startsWith('const jwdGardens='))+source.split('\n').find(l=>l.startsWith('const jwdLane=')).replace('walkways.push(jwdLane);','')+
  between('const jwdNeighborhood=','for(const b of buildings)')+between('const npcs=',' {x:520,y:720')+'].map(offsetWorldPoint);'+between('const jwd=','window.Germany3DBridge=')+
  ['groundCircleCandidates','propRadius','normObjectRadius','staticBlocked','groundContactBlocks','signedRectDistance','groundStaticMotionBlocked','pedestrianRouteContains','responderBlocked','moveGroundResponder','awardAnmeldung','anmeldungNeighborhoodMonologue','microInteract'].map(fn).join('\n')+';globalThis.jwdState=jwd;globalThis.actors=npcs;globalThis.homes=buildings;globalThis.lane=jwdLane;globalThis.gardens=jwdGardens;',h);
 for(const n of h.actors){n.routeBounds=h.lane;n.gardenPaths=h.gardens.paths;Object.assign(n,h.gardens.stations[n.id],{jwdActivity:"wash",jwdWorking:true,activityPhase:0})}
 const treeCoordinates=JSON.parse('['+source.split('trees=Object.freeze([')[1].split('].map(')[0]+']');h.trees.push(...treeCoordinates.map(([x,y])=>h.offsetWorldPoint({x,y})));
 h.home=h.homes.find(b=>b.id==='jwd-home');
 return h;
}

test('registration is the allocation cause; a stored badge or premature visit grants no house',()=>{
 const h=harness();h.anmeldungAwarded=true;h.visitJwdHome();h.finish();assert.equal(h.jwdState.allocated,false);assert.equal(h.jwdState.visited,false);
 h.arrestPlayer();assert.equal(h.player.x,h.policePath.x1);
 h.awardAnmeldung();h.awardAnmeldung();assert.equal(h.jwdState.allocated,true);assert.equal(h.jwdState.visit,0);assert.equal(h.state.germanness,3,"duplicate registration cannot repeat the +3 reward, even with a stored badge");
 assert.equal(h.currentMission().target,'buergeramt','A38 handoff still comes first');h.state.mission=1;assert.equal(h.currentMission().target,'jwd-home');
});

test('registration, certificate handoff and valid A38 submission lead straight to home and neighbors',()=>{
 const city=harness(),office=officeHarness();office.config.onRegistration=city.awardAnmeldung;
 let formOpened=false;office.config.onForm=()=>{formOpened=true};
 office.counter();assert.equal(city.jwdState.allocated,false);
 const settle=()=>{for(let i=0;i<600&&!office.node('amt-actions').children.some(b=>!b.disabled);i++)office.tick(100)};
 settle();for(let i=0;office.level.registration.node!=='final'&&i<60;i++){office.action(0);settle()}
 assert.equal(office.level.registration.node,'final');office.action(0);office.tick(10000);
 assert.equal(office.level.stage,'phone-warning');assert.equal(city.jwdState.allocated,false,'final approval requires actual phone-away evidence');
 office.links[0].message({type:'phone-hidden'});settle();
 assert.equal(office.level.stage,'success');assert.equal(city.jwdState.allocated,true);assert.equal(city.jwdState.visited,false);
 office.action(0);office.tick(10000);assert.ok(formOpened,'the certificate handoff opens A38');
 city.forms={a38:{code:'A38'}};city.state.forms=0;city.setTimeout=fn=>fn();city.document.body={classList:{contains:()=>false}};
 vm.runInContext(source.split('\n').find(line=>line.startsWith('document.getElementById("bureaucracy-form").onsubmit=')),city);
 const submit=valid=>city.document.getElementById('bureaucracy-form').onsubmit({preventDefault(){},currentTarget:{reportValidity:()=>valid,dataset:{type:'a38'}}});
 submit(false);assert.equal(city.currentMission().target,'buergeramt');
 submit(true);assert.equal(city.state.forms,1);assert.equal(city.currentMission().target,'jwd-home');assert.equal(city.getMissionWaypoint(),null,'monologue owns attention before guidance');assert.match(city.dialogue.lines[0],/officially gemeldet/);city.finish();assert.equal(city.getMissionWaypoint().id,'jwd-home');
 city.visitJwdHome();city.finish();assert.equal(city.currentMission().target,'jwd-neighbors');
 for(const neighbor of city.actors){city.talkJwdNeighbor(neighbor);city.finish()}
 assert.equal(city.currentMission().target,'hausverwaltung','the old chain resumes only after the introductions');
});

test('home visit and all three completed introductions gate the detour without shifting eight procedures',()=>{
 const h=harness();h.awardAnmeldung();h.state.mission=1;h.visitJwdHome();h.finish();assert.equal(h.currentMission().target,'jwd-neighbors');
 const expected=['jwd-swabian','jwd-parent','jwd-watcher'];
 for(const id of expected){assert.equal(h.getMissionWaypoint().id,id);const n=h.actors.find(n=>n.id===id);h.talkJwdNeighbor(n);assert.equal(h.jwdState.met.has(id),false,'speaking alone is not an introduction receipt');h.finish();h.talkJwdNeighbor(n);h.finish()}
 assert.equal(h.jwdState.met.size,3);assert.equal(h.currentMission().target,'hausverwaltung');assert.equal(h.state.mission,1);
});

test('arrest wakes at a clear porch; neighbors physically approach and release the player',()=>{
 for(const dt of [1/60,1/30,.1]){
  const h=harness();h.awardAnmeldung();h.state.mission=1;h.visitJwdHome();h.finish();h.actors.forEach(n=>h.jwdState.met.add(n.id));
  h.arrestPlayer();h.jwdState.burglarVisit=h.jwdState.visit;
  assert.equal(h.state.wanted,0);assert.equal(h.responderBlocked(h.player.x,h.player.y,16,h.player),false);
  Object.assign(h.player,{x:h.home.doorX,y:h.gardens.crossY+48});
  h.updateJwd(dt);assert.equal(h.state.dialogue,false,'no remote speech from a driveway');const visitor=h.jwdState.visitor,start={x:visitor.x,y:visitor.y};
  for(let t=0;t<20&&!h.state.dialogue;t+=dt){h.updateJwd(dt);assert.equal(h.pedestrianRouteContains(visitor,visitor.x,visitor.y),true);assert.equal(h.staticBlocked(visitor.x,visitor.y,13),false)}
  assert.ok(h.state.dialogue);assert.ok(h.dist(visitor.x,visitor.y,start.x,start.y)>100);assert.ok(h.dist(visitor.x,visitor.y,h.player.x,h.player.y)<90);
  h.finish();assert.equal(h.jwdState.exitPending,false);assert.equal(h.jwdState.visitor,null);
  for(let t=0;t<18;t+=dt)h.updateJwd(dt);assert.equal(h.state.dialogue,false);assert.ok(visitor.jwdWorking,'returns to washing');
 }
});

test('burglar checks the poor home, then actually walks to the richer house with collision and pause ownership',()=>{
 const h=harness();h.awardAnmeldung();h.visitJwdHome();h.finish();h.jwdState.exitPending=false;h.jwdState.gardenCooldown=10000;h.jwdState.visit=2;
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
  const h=harness();h.awardAnmeldung();h.visitJwdHome();h.finish();h.jwdState.exitPending=false;h.jwdState.gardenCooldown=10000;h.jwdState.visit=2;
  Object.assign(h.player,{x:h.home.doorX,y:h.home.doorY+(obstacle==='player'?35:95)});
  if(obstacle==='prop')h.props.push({x:1245,y:4540,collisionRadius:10});let inspected=false;
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
 assert.ok(diagnostic.includes('offsetWorldPoint({x:40,y:3890,w:1010,h:340})'));
});

test('burglar plants his feet at an occupied retreat doorway and leaves when it clears',()=>{
 for(const dt of [1/60,1/30,.1]){
  const h=harness();h.awardAnmeldung();h.visitJwdHome();h.finish();h.jwdState.exitPending=false;h.jwdState.gardenCooldown=10000;h.jwdState.visit=2;Object.assign(h.player,{x:h.home.doorX,y:h.home.doorY+95});
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
 for(let x=h.home.doorX;x<=1574;x+=4)assert.equal(h.staticBlocked(x,h.gardens.crossY,r),false);
 assert.ok(1574-r>=h.lane.x&&1574+r<=h.lane.x+h.lane.w);assert.ok(h.lane.y+13<h.gardens.crossY&&h.gardens.crossY<h.lane.y+h.lane.h-13);
 assert.ok(h.home.x<1200&&h.home.y>4200,'home lies at the southwest city edge');
});

test('six garden-suburb plots connect around the block without crossing lawns or solids',()=>{
 const h=harness(),lanes=h.walkways,homes=h.homes.filter(b=>b.residential);assert.equal(homes.length,6);
 for(const b of homes.filter(b=>b.variant)){
  const route=[{x:b.doorX,y:b.doorY},{x:b.doorX,y:4220},{x:630,y:4220},{x:630,y:h.gardens.crossY},{x:h.home.doorX,y:h.gardens.crossY},{x:h.home.doorX,y:h.home.doorY+30}];
  for(let segment=1;segment<route.length;segment++){const a=route[segment-1],z=route[segment],steps=Math.ceil(h.dist(a.x,a.y,z.x,z.y)/2);
   for(let i=0;i<=steps;i++){const x=a.x+(z.x-a.x)*i/steps,y=a.y+(z.y-a.y)*i/steps;assert.ok(lanes.some(r=>x-16>=r.x&&x+16<=r.x+r.w&&y-16>=r.y&&y+16<=r.y+r.h),'body-clear connected paving');assert.equal(h.responderBlocked(x,y,16,h.player,x,y),false,b.id+' approach');assert.ok(!h.grassAreas.some(r=>!r.privateGarden&&x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h),'walking route never needs a lawn offence')}
  }
 }
});

test('working neighbors alternate washing and trimming, with solid cars and private lawns',()=>{
 const h=harness();Object.assign(h.player,{x:h.home.doorX,y:h.home.doorY+30});
 for(let t=0;t<28;t+=1/30)h.updateJwd(1/30);
 const fink=h.actors.find(n=>n.id==='jwd-swabian');assert.equal(fink.jwdActivity,'trim');assert.ok(fink.jwdWorking);assert.ok(h.pedestrianRouteContains(fink,fink.x,fink.y));
 for(const p of h.gardens.props){assert.equal(h.staticBlocked(p.x,p.y,13),true,p.id);assert.ok(p.collisionRect)}
 assert.equal(h.gardens.lots.filter(l=>!l.kept).length,1);assert.ok(h.gardens.lots.every(l=>l.privateGarden));
 assert.match(source,/!r.privateGarden&&inRect/);
});

test('far-away departure cancels lawn interception, and another home visit rearms it',()=>{
 const h=harness();h.awardAnmeldung();h.visitJwdHome();h.finish();Object.assign(h.player,{x:h.home.doorX,y:h.gardens.crossY});h.updateJwd(.1);assert.ok(h.jwdState.visitor);
 h.player.x+=1500;h.updateJwd(.1);assert.equal(h.jwdState.visitor,null);assert.equal(h.jwdState.atHome,false);assert.equal(h.state.dialogue,false);
 Object.assign(h.player,{x:h.home.doorX,y:h.home.doorY+30});h.updateJwd(.1);assert.equal(h.jwdState.exitPending,true);
});

test('lingering invites a different complaint after a respite, never a continuous conversation trap',()=>{
 const h=harness();h.awardAnmeldung();h.visitJwdHome();h.finish();h.actors.forEach(n=>h.jwdState.met.add(n.id));Object.assign(h.player,{x:h.home.doorX,y:h.gardens.crossY+48});
 for(let i=0;i<600&&!h.state.dialogue;i++)h.updateJwd(1/30);assert.ok(h.state.dialogue);const first=h.dialogue.speaker;h.finish();
 for(let i=0;i<30*30;i++)h.updateJwd(1/30);assert.equal(h.state.dialogue,false);
 for(let i=0;i<30*30&&!h.state.dialogue;i++)h.updateJwd(1/30);assert.ok(h.state.dialogue);assert.notEqual(h.dialogue.speaker,first);h.finish();assert.equal(h.jwdState.visitor,null);
});

test('a neighbor blocked on a driveway plants their feet and resumes when it clears',()=>{
 for(const dt of [1/60,1/30,.1])for(const avoid of [-1,1]){
  const h=harness(),n=h.actors.find(n=>n.id==='jwd-swabian');n.avoid=avoid;n.jwdRoute=[{x:n.x,y:h.gardens.crossY}];Object.assign(h.player,{x:n.x,y:n.y-60});
  for(let t=0;t<5;t+=dt)h.updateJwd(dt);const stopped=[n.x,n.y];
  for(let t=0;t<3;t+=dt)h.updateJwd(dt);assert.deepEqual([n.x,n.y],stopped);assert.equal(n.jwdMoving,0);assert.equal(n.jwdWorking,false);
  h.player.x=h.home.doorX;for(let t=0;t<8;t+=dt)h.updateJwd(dt);assert.ok(n.jwdWorking);assert.ok(h.dist(n.x,n.y,...stopped)>20);
 }
});

test('neighbors use the free passing side of the shared garden path',()=>{
 for(const dt of [1/60,1/30,.1])for(const avoid of [-1,1]){
  const h=harness(),n=h.actors.find(n=>n.id==='jwd-swabian');Object.assign(n,{x:850,y:h.gardens.crossY,avoid,jwdRoute:[{x:1120,y:h.gardens.crossY}]});Object.assign(h.player,{x:980,y:h.gardens.crossY});
  for(let t=0;t<20&&n.jwdRoute.length;t+=dt){h.updateJwd(dt);assert.ok(h.pedestrianRouteContains(n,n.x,n.y));assert.equal(h.staticBlocked(n.x,n.y,13),false);assert.ok(h.dist(n.x,n.y,h.player.x,h.player.y)>=29-.001)}
  assert.equal(n.jwdRoute.length,0,`${dt}/${avoid}: uses clear side`);
 }
});

test('parked-car prompts read the laminated note without a remote neighbor or mission reward',()=>{
 const h=harness();for(const car of h.gardens.props.filter(p=>p.asset==='jwd-car')){h.microInteract(car);assert.match(h.dialogue.speaker,/LAMINIERTER HINWEIS/);assert.match(h.dialogue.lines[0],/Reißverschlüsse/);assert.equal(h.state.characterSpeaker,undefined);h.finish();assert.equal(h.jwdState.allocated,false)}
 assert.ok(h.gardens.props.filter(p=>p.asset!=='jwd-car').every(p=>p.interactive===false));
});


test('neighbor speech waits for actual start, owns each cue, pauses, and credits only a completed introduction',()=>{
 const h=harness();h.awardAnmeldung();h.jwdState.visited=true;h.state.voiceOn=true;h.state.lang='en';h.activeStimulus=null;h.audio={state:'running'};h.document.hidden=false;h.speechCatalog={productionVoices:{},voices:{"jwd-heiko-maaslos":{gender:"male"}}};h.stimulusGeneration=1;h.STIMULUS_PRIORITY={CRITICAL:5};h.voiceHash=()=>0;h.stimulusEligible=()=>true;
 let now=1000,utterance;h.performance={now:()=>now};h.setTimeout=h.setInterval=()=>1;h.clearTimeout=h.clearInterval=()=>{};h.startSubtitle=()=>{};h.SpeechSynthesisUtterance=class {constructor(text){this.text=text}};
 h.speechSynthesis={paused:false,getVoices:()=>[],speak:u=>utterance=u,cancel(){},resume(){}};h.window.speechSynthesis=h.speechSynthesis;
 h.setDialogueVoiceBusy=busy=>h.state.dialogueVoiceBusy=busy;h.stopSpeech=()=>h.activeStimulus=null;h.requestCharacterReaction=()=>{};
 h.speak=(text,options)=>{h.activeStimulus={...options,text}};h.finishStimulus=(item,generation)=>{if(h.activeStimulus!==item||generation!==h.stimulusGeneration)return;item.done?.();h.activeStimulus=null};
 vm.runInContext(['speakDialogueLine','playSyntheticStimulus','nextDialogue'].map(fn).join('\n'),h);
 h.renderDialogue=()=>h.speakDialogueLine(h.state.dialogueData.lines[h.state.dialogueData.i]);
 const neighbor=h.actors.find(n=>n.id==='jwd-parent');h.talkJwdNeighbor(neighbor);h.state.dialogueData.i=0;
 assert.equal(h.getNeighborDialogue().line,h.dialogue.lines[0],'mouth-shape estimates receive the actual spoken words');assert.equal(h.getNeighborDialogue().lineIndex,0);
 assert.equal(h.dialogue.voiceId,'jwd-heiko-maaslos');assert.equal(h.dialogue.subtitles[0].startsWith('Dear neighbor'),true);
 h.speakMerzLine=()=>assert.fail("Heiko must not use Merz speech routing");h.renderDialogue();const first=h.activeStimulus;assert.equal(first.masculine,true,"Heiko fallback respects catalog male gender");h.playSyntheticStimulus(first,1);assert.equal(h.getNeighborDialogue().speaking,false,'queued synthesis cannot move the mouth');
 utterance.onstart();assert.equal(h.getNeighborDialogue().speaking,true);now+=500;assert.equal(h.getNeighborDialogue().mediaTime,.5);
 h.speechSynthesis.paused=true;const frozen=h.getNeighborDialogue().mediaTime;now+=500;assert.equal(h.getNeighborDialogue().mediaTime,frozen);assert.equal(h.getNeighborDialogue().paused,true);h.speechSynthesis.paused=false;
 h.nextDialogue();assert.equal(h.jwdState.met.size,0);assert.notEqual(h.getNeighborDialogue().cueToken,first.cueToken);first.done();assert.equal(h.state.dialogueVoiceBusy,true,'stale done cannot clear the next utterance');
 h.activeStimulus.subtitleMode='silent';h.activeStimulus.speechStarted=true;assert.equal(h.getNeighborDialogue().speaking,false,'caption-only fallback has a closed mouth');h.activeStimulus.subtitleMode='recorded';h.activeStimulus.subtitleElapsed=()=>.25;h.activeStimulus.subtitleDuration=2;h.activeStimulus.clip={mouthHz:4,mouthEnergy:[0,255,0]};assert.equal(h.getNeighborDialogue().mouthOpen,1);
 h.state.voiceOn=false;assert.equal(h.getNeighborDialogue().speaking,false);assert.equal(h.getNeighborDialogue().mouthOpen,0);h.state.voiceOn=true;h.stopSpeech();assert.equal(h.getNeighborDialogue().speaking,false);
 while(h.state.dialogue)h.nextDialogue();assert.equal(h.jwdState.met.has(neighbor.id),true);
});

test('replaced neighbor introduction cannot grant stale completion credit',()=>{
 const h=harness();h.awardAnmeldung();h.jwdState.visited=true;const neighbor=h.actors.find(n=>n.id==='jwd-watcher');h.talkJwdNeighbor(neighbor);const stale=h.dialogue.done;assert.equal(h.dialogue.voiceId,'jwd-inga-maaslos');h.openDialogue('OTHER',['Replacement']);stale();assert.equal(h.jwdState.met.size,0);
 h.talkJwdNeighbor(neighbor);h.finish();assert.equal(h.jwdState.met.size,1);h.talkJwdNeighbor(neighbor);h.finish();assert.equal(h.jwdState.met.size,1);
 const swabian=h.actors.find(n=>n.id==='jwd-swabian');h.talkJwdNeighbor(swabian);assert.equal(h.dialogue.voiceId,'jwd-frau-schwabingen');
});


test('recorded neighbor cue starts after decoding and its real audio clock owns mouth energy',async()=>{
 const h=harness();h.awardAnmeldung();h.jwdState.visited=true;h.state.voiceOn=true;h.state.dialogueVoiceToken=7;h.activeStimulus=null;h.stimulusGeneration=1;h.document.hidden=false;h.AUDIO_CLASS={TEXT:'text'};h.AUDIO_MIX={ATTACK_SECONDS:.02,FOREGROUND:1};h.stimulusEligible=()=>true;h.startSubtitle=()=>{};h.foregroundOutput=()=>({});
 let decode,sourceNode;h.prepareRecording=()=>new Promise(resolve=>decode=resolve);const gain={gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){return this}};
 h.audio={state:'running',currentTime:3,createGain:()=>gain,createBufferSource:()=>sourceNode={connect(){return gain},start(){this.started=true}}};h.ensureAudio=()=>h.audio;
 h.finishStimulus=(item,generation)=>{if(h.activeStimulus===item&&generation===h.stimulusGeneration)h.activeStimulus=null};vm.runInContext(fn('playRecordedStimulus'),h);
 const neighbor=h.actors.find(n=>n.id==='jwd-watcher');h.talkJwdNeighbor(neighbor);h.state.dialogueData.i=0;const item=h.activeStimulus={cueToken:7,family:'dialogue',recording:'test.mp3',clip:{mouthHz:4,mouthEnergy:[0,255,0,0]},start:()=>{}};
 h.playRecordedStimulus(item,1);assert.equal(h.getNeighborDialogue().speaking,false,'decode wait is not an audible start');decode({duration:2});await new Promise(resolve=>setImmediate(resolve));assert.equal(sourceNode.started,true);assert.equal(h.getNeighborDialogue().speaking,true);h.audio.currentTime=3.25;assert.equal(h.getNeighborDialogue().mediaTime,.25);assert.equal(h.getNeighborDialogue().mediaDuration,2);assert.equal(h.getNeighborDialogue().mouthOpen,1);
 h.audio.state='suspended';h.audio.currentTime=4;assert.equal(h.getNeighborDialogue().mediaTime,.25);assert.equal(h.getNeighborDialogue().paused,true);h.activeStimulus=null;sourceNode.onended();assert.equal(h.getNeighborDialogue().speaking,false,'cancelled old source cannot recover ownership');assert.equal(h.jwdState.met.size,0);
});
