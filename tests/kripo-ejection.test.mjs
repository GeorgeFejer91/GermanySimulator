import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
function fn(name,code=source){
 const start=code.indexOf(`function ${name}(`);assert.ok(start>=0,name);
 const open=code.indexOf('{',start);let depth=1,quote=null,escape=false;
 for(let i=open+1;i<code.length;i++){
  const ch=code[i];if(quote){if(escape)escape=false;else if(ch==='\\')escape=true;else if(ch===quote)quote=null;continue}
  if(ch==='/'&&code[i+1]==='/'){i=code.indexOf('\n',i+2);continue}
  if(ch==='/'&&code[i+1]==='*'){i=code.indexOf('*/',i+2)+1;continue}
  if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}
  if(ch==='{')depth++;else if(ch==='}'&&!--depth)return code.slice(start,i+1);
 }
 throw new Error(`Unclosed ${name}`);
}
function harness(direct=false){
 const classes=new Set(direct?['amt-direct-mode']:[]),elements=new Map(),events=[],visits=[],keys={KeyW:true,KeyE:true};
 const element=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:''});return elements.get(id)};
 const h={console,Math,WORLD:{w:10960,h:5360},RAIL_GUTTER:560,WALKWAY_WIDTH:84,SIDEWALK_WIDTH:72,TREE_RADIUS:38,TRAIN_CAR_HALF_LENGTH:122,TRAIN_CAR_HALF_WIDTH:46,
  horizontalRoads:[{x:560,y:1380,w:9840,h:260},{x:560,y:2560,w:9840,h:240},{x:560,y:3560,w:9840,h:220}],
  offsetWorldPoint:p=>({...p,x:p.x+560,y:p.y+560}),props:[],normObjects:[],trees:[],trains:[],trafficCars:[],policeVehicles:[],police:[],npcs:[],grassAreas:[],walkways:[],
  goerlitzerPark:{x:10000,y:4000,w:100,h:100,plaqueX:10000,plaqueY:4000},wirtschaftswunderSite:{x:10000,y:4200,collisionRadius:142},kiesingerMemorial:{x:10000,y:4500},
  player:{x:1800,y:1700,r:16,energy:81,vx:30,vy:-20,facing:0},jwd:{tour:null},state:{started:true,modal:true,dialogue:false,mission:0,forms:0,wanted:2,germanness:7,pfand:3,day:2,voiceOn:false,subtitlesOn:true,region:'berlin'},
  OFFENSE_TIMING:{policeContactCooldown:5.8},keys,pendingOfficeEntry:null,stationElevation:()=>0,regionOf:y=>y>1680?'berlin':'germany',clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),dist:(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by),
  document:{body:{classList:{contains:k=>classes.has(k),remove:k=>classes.delete(k)}},getElementById:element},
  clearInput(){for(const code in keys)keys[code]=false},toast:text=>events.push(['toast',text]),updateHud:()=>events.push(['hud']),
  spawnPolice:(...args)=>events.push(['spawnPolice',...args]),syncPoliceResponse:()=>events.push(['response']),announcePoliceResponse:(...args)=>events.push(['announce',...args]),violationAlert:(...args)=>events.push(['violation',...args]),
  stopSpeech(){},stimulusBusy:()=>false,audioTextActive:()=>false,setAmtMusicMuted(){},awardAnmeldung(){events.push(['award'])},showForm(){events.push(['form'])},
  currentMission:()=>({target:'buergeramt',form:'a38'}),window:{Germany3D:{officeAssetsReady:true,leaveAmtDirectMode:()=>events.push(['city-ready']),enterBuergeramt:done=>done(),prepareOfficeAssets:()=>events.push(['prepare-office'])},BuergeramtLevel:{requestFullscreen(){},open:options=>visits.push(options)}}
 };
 vm.createContext(h);
 const buildings=source.slice(source.indexOf('const buildings='),source.indexOf('const grassAreas='));
 const paths=source.slice(source.indexOf('for(const b of buildings){'),source.indexOf('walkways.push({x:goerlitzerPark'));
 const names=['normObjectRadius','propRadius','staticBlocked','signedRectDistance','trainCarDistance','vehicleBodyDistance','responderBlocked','amtExitPosition','returnFromAmt','wanted','showAmtDirectResult','cancelAmtAppointment','bureaucrat','interactBuilding','interact'];
 vm.runInContext(`${buildings}\n${paths}\n${names.map(name=>fn(name)).join('\n')}\nglobalThis.office=buildings.find(b=>b.id==='buergeramt');`,h);
 if(direct){const start=source.indexOf(' const directConfig=');vm.runInContext(source.slice(start,source.indexOf('\n function restartAmt',start))+'\nglobalThis.directConfig=directConfig;',h)}
 return Object.assign(h,{events,visits,classes,elements});
}

for(const direct of [false,true])for(const reason of ['kripo','ringing'])test(`${reason} ejection ${direct?'from direct office':'from city mission'} returns to clear frontage with five stars`,()=>{
 const h=harness(direct),before={germanness:h.state.germanness,pfand:h.state.pfand,day:h.state.day,energy:h.player.energy};
 if(direct)h.directConfig.onCancel({reason});else{h.bureaucrat(h.office,h.currentMission());h.visits[0].onCancel({reason})}
 assert.equal(h.state.wanted,5);assert.equal(h.state.modal,false);assert.equal(h.state.dialogue,false);assert.equal(h.classes.has('amt-direct-mode'),false);
 assert.equal(h.state.region,'germany');assert.equal(h.state.mission,0);assert.equal(h.state.forms,0);
 assert.deepEqual({germanness:h.state.germanness,pfand:h.state.pfand,day:h.state.day,energy:h.player.energy},before);
 assert.ok(h.player.y>h.office.y+h.office.h+h.player.r);assert.ok(h.dist(h.player.x,h.player.y,h.office.doorX,h.office.doorY)<112,'arrival remains within the natural doorway interaction range');
 assert.equal(h.responderBlocked(h.player.x,h.player.y,h.player.r,h.player,null,null),false);
 assert.equal(h.player.vx,0);assert.equal(h.player.vy,0);assert.equal(Object.values(h.keys).some(Boolean),false);
 assert.ok(h.state.policeContactCooldown>0,'existing contact grace avoids removing a star on the arrival frame');
 for(const id of ['amt-direct-result','amt-direct-reset','amt-compact-reset','form-modal'])assert.equal(h.elements.get(id).hidden,true);
 assert.equal(h.events.filter(e=>e[0]==='city-ready').length,1);
 assert.equal(h.events.some(e=>e[0]==='award'||e[0]==='form'),false);
 const count=h.visits.length;assert.equal(count,direct?0:1,'ejection does not reopen the office');
 h.interact();assert.equal(h.visits.length,count+1,'actual city interaction re-enters through the existing open path');
 assert.equal(h.state.modal,true);assert.equal(h.state.wanted,5,'re-entry does not erase the city response');
});

test('ordinary cancellations preserve their existing normal and direct-route outcomes',()=>{
 for(const direct of [false,true]){
  const h=harness(direct),position={x:h.player.x,y:h.player.y};
  if(direct)h.directConfig.onCancel();else{h.bureaucrat(h.office,h.currentMission());h.visits[0].onCancel()}
  assert.equal(h.state.wanted,2);assert.deepEqual({x:h.player.x,y:h.player.y},position);assert.equal(h.classes.has('amt-direct-mode'),direct);
  assert.equal(h.state.modal,direct);assert.equal(h.events.some(e=>e[0]==='city-ready'||e[0]==='spawnPolice'),false);
  if(direct)assert.equal(h.elements.get('amt-direct-result-title').textContent,'TERMIN ANNULLIERT');
 }
});

for(const kind of ['prop','tree','citizen','officer','car','train'])test(`ejection placement clears a ${kind} blocking the preferred doorway point`,()=>{
 const h=harness(),preferred=h.amtExitPosition(),body={...preferred,angle:0};
 if(kind==='prop')h.props.push({...body,collisionRadius:22});
 if(kind==='tree')h.trees.push(body);
 if(kind==='citizen')h.npcs.push(body);
 if(kind==='officer')h.police.push(body);
 if(kind==='car')h.trafficCars.push(body);
 if(kind==='train')h.trains.push({cars:[body]});
 const exit=h.amtExitPosition();assert.ok(exit,'another bounded legal arrival exists');assert.notDeepEqual(exit,preferred);
 assert.equal(h.responderBlocked(exit.x,exit.y,h.player.r+2,h.player,null,null),false);
 assert.ok(h.walkways.some(p=>exit.x-h.player.r>=p.x&&exit.x+h.player.r<=p.x+p.w&&exit.y-h.player.r>=p.y&&exit.y+h.player.r<=p.y+p.h),'the entire player body stays on the existing path');
});

test('a wholly obstructed path does not invent a colliding spawn position',()=>{
 const h=harness();h.props.push({x:h.office.doorX,y:h.office.doorY,collisionRadius:1000});
 assert.equal(h.amtExitPosition(),null);
});

test('a crowded entrance path falls back to the body-clear pavement directly in front of the office',()=>{
 const h=harness();h.props.push({x:h.office.doorX,y:h.office.doorY+100,collisionRadius:150});
 const exit=h.amtExitPosition(),road=h.horizontalRoads[0],r=h.player.r;
 assert.ok(exit);assert.equal(h.responderBlocked(exit.x,exit.y,r,h.player,null,null),false);
 assert.ok(exit.y-r>=road.y-h.SIDEWALK_WIDTH&&exit.y+r<=road.y,'fallback stays wholly on pavement');
 assert.ok(exit.x-r>=h.office.x&&exit.x+r<=h.office.x+h.office.w,'fallback stays on this office frontage');
});

test('repeated ejection and natural doorway entry retain the city response and create fresh office opens',()=>{
 const h=harness();h.bureaucrat(h.office,h.currentMission());
 for(let i=0;i<12;i++){
  const previous=h.visits.at(-1);h.keys.KeyW=true;previous.onCancel({reason:i%2?'kripo':'ringing'});
  assert.equal(h.visits.length,i+1);assert.equal(h.state.wanted,5);assert.equal(h.keys.KeyW,false);
  h.interact();assert.equal(h.visits.length,i+2);assert.notEqual(h.visits.at(-1),previous);
  assert.equal(h.state.mission,0);assert.equal(h.state.forms,0);assert.equal(h.state.germanness,7);
 }
});

test('re-entry keeps the existing office readiness gate',()=>{
 const h=harness(true);h.directConfig.onCancel({reason:'kripo'});h.window.Germany3D.officeAssetsReady=false;
 h.interact();assert.equal(h.visits.length,0);assert.equal(h.state.modal,true);assert.equal(typeof h.pendingOfficeEntry,'function');
 h.window.Germany3D.officeAssetsReady=true;const ready=h.pendingOfficeEntry;h.pendingOfficeEntry=null;ready();
 assert.equal(h.visits.length,1);assert.equal(h.state.wanted,5);
});

test('direct renderer exit creates the skipped city buildings exactly once and enables the normal sync path',()=>{
 const renderer=readFileSync(new URL('../world3d.js',import.meta.url),'utf8'),built=[],mounted=[],buildingSlots=[],buildings=[{id:'buergeramt'},{id:'spaeti'}];
 const h=vm.createContext({amtDirectRoute:true,bridge:{buildings},buildingSlots,building:b=>{built.push(b.id);buildingSlots.push({building:b})},mountBuildingDoor:slot=>mounted.push(slot.building.id)});
 vm.runInContext(fn('leaveAmtDirectMode',renderer),h);h.leaveAmtDirectMode();
 assert.equal(h.amtDirectRoute,false);assert.deepEqual(built,['buergeramt','spaeti']);
 assert.deepEqual(mounted,built,'direct-route fallback buildings receive their common doors');
 h.leaveAmtDirectMode();assert.equal(built.length,2,'repeated ejections cannot duplicate city geometry');
 assert.match(renderer.slice(renderer.indexOf('window.Germany3D={')),/\bleaveAmtDirectMode\s*,/,'the renderer exports its direct-route exit seam');
 assert.match(renderer,/get amtEntry\(\)/,'office entry inspection remains available alongside other renderer APIs');
 assert.equal(mounted.length,2,'repeated ejections cannot duplicate doors');
 assert.match(renderer,/if\(amtDirectRoute&&!window\.BuergeramtLevel\?\.active\)/,'disabling direct-only state releases the existing city sync path');
});
