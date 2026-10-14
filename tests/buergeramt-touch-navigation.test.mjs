import test from 'node:test';
import assert from 'node:assert/strict';
import {harness,source} from './amt-harness.mjs';

function office(){
 const h=harness('host',{hostSource:source('buergeramt.js').replace(/\}\)\(\);\s*$/,'window.__navigationProbe={view,setStage};})();')});
 h.window.innerWidth=390;h.window.innerHeight=844;
 const stick=h.node('amt-move-stick'),look=h.node('amt-look-zone');
 stick.clientWidth=128;stick.getBoundingClientRect=()=>({left:0,top:0,width:128,height:128});
 look.closest=()=>null;stick.closest=selector=>selector.includes('.amt-touch-controls')?stick:null;
 const captures=new Set();stick.setPointerCapture=id=>captures.add(id);stick.hasPointerCapture=id=>captures.has(id);stick.releasePointerCapture=id=>captures.delete(id);
 return{...h,stick,look,captures};
}
function pointer(target,type,id,x,y,eventTarget=target,pointerType='touch'){
 const e=new Event(type,{cancelable:true});
 Object.assign(e,{pointerId:id,clientX:x,clientY:y,buttons:type==='pointerup'?0:1,pointerType});
 Object.defineProperty(e,'target',{value:eventTarget});target.dispatchEvent(e);return e;
}
function walk(h,seconds=1){for(let i=0;i<Math.round(seconds*60);i++)h.level.update(1/60)}
function hold(h,dx,dy,id=1){pointer(h.stick,'pointerdown',id,64,64);pointer(h.stick,'pointermove',id,64+dx,64+dy)}

test('arrow movement matches WASD without changing view or stacking aliases',()=>{
 for(const hz of [30,60,120])for(const [arrow,letter] of [['ArrowUp','KeyW'],['ArrowDown','KeyS'],['ArrowLeft','KeyA'],['ArrowRight','KeyD']]){
  const a=office(),b=office(),c=office();a.key(arrow);b.key(letter);c.key(arrow);c.key(letter);
  for(let i=0;i<hz/10;i++){a.level.update(1/hz);b.level.update(1/hz);c.level.update(1/hz)}
  assert.deepEqual({...a.level.view},{...b.level.view});assert.deepEqual({...c.level.view},{...b.level.view});assert.equal(a.level.view.yaw,0);assert.equal(a.level.view.pitch,0);
  a.key(arrow,'keyup');const before=a.level.view;a.level.update(.1);assert.deepEqual(a.level.view,before);
 }
});

function hover(h,x,y,target=h.look){
 const e=new Event('pointermove');Object.assign(e,{pointerId:7,pointerType:'mouse',buttons:0,clientX:x,clientY:y});
 Object.defineProperty(e,'target',{value:target});h.document.dispatchEvent(e);
}
test('mouse hover looks both ways and resets across controls, focus, hidden and scripted scenes',()=>{
 const h=office();hover(h,200,300);hover(h,250,250);
 assert.equal(h.level.view.yaw,.2);assert.equal(h.level.view.pitch,.2);
 hover(h,200,300);assert.equal(h.level.view.yaw,0);assert.equal(h.level.view.pitch,0);
 for(const reset of ['control','blur','hidden','scene','paused','mixer','leave']){
  hover(h,250,250);const before=h.level.view;
  if(reset==='control'){const button=h.node('amt-leave');button.closest=()=>button;hover(h,500,600,button)}
  else if(reset==='blur')h.window.dispatchEvent(new Event('blur'));
  else if(reset==='hidden'){h.hide();hover(h,500,600);h.document.hidden=false}
  else if(reset==='scene'){h.window.__navigationProbe.setStage('character');hover(h,500,600);h.window.__navigationProbe.setStage('walk-sign')}
  else if(reset==='paused'){h.window.GermanyHUD={paused:true};hover(h,500,600);h.window.GermanyHUD.paused=false}
  else if(reset==='mixer'){h.node('amt-mix').open=true;hover(h,500,600);h.node('amt-mix').open=false}
  else h.document.dispatchEvent(new Event('pointerout'));
  hover(h,700,700);assert.equal(h.level.view.yaw,before.yaw,reset);assert.equal(h.level.view.pitch,before.pitch,reset);
  hover(h,720,680);assert.ok(h.level.view.yaw>before.yaw,reset);
 }
});

test('thumb stick has a quiet center, gradual speed and a bounded full-speed diagonal',()=>{
 const still=office();hold(still,2,-2);walk(still);assert.equal(still.level.view.z,4.8);assert.equal(still.level.view.x,0);
 const half=office();hold(half,0,-128*.32*.57);walk(half);assert.ok(Math.abs(half.level.view.z-3)<1e-8,'half stick should walk 1.8 m, rather than normalize to full speed');
 const full=office();hold(full,0,-100);walk(full);assert.ok(Math.abs(full.level.view.z-1.2)<1e-8);
 const diagonal=office();hold(diagonal,100,-100);walk(diagonal);assert.ok(Math.abs(Math.hypot(diagonal.level.view.x,diagonal.level.view.z-4.8)-3.6)<1e-8,'diagonal motion cannot outrun forward motion');
});

test('move and vertical/horizontal look coexist; cancellation releases only its finger',()=>{
 const h=office();hold(h,0,-100);
 pointer(h.document,'pointerdown',2,250,400,h.look);
 pointer(h.document,'pointermove',2,310,340,h.look);
 assert.ok(h.level.view.yaw>0);assert.ok(h.level.view.pitch>0);
 walk(h,.1);assert.ok(Math.hypot(h.level.view.x,h.level.view.z-4.8)>.35);
 const pitch=h.level.view.pitch;walk(h,.5);assert.equal(h.level.view.pitch,pitch,'walking must not continually level a manual view');
 pointer(h.document,'pointercancel',2,310,340,h.look);
 const before=h.level.view;walk(h,.1);assert.ok(Math.hypot(h.level.view.x-before.x,h.level.view.z-before.z)>.35,'looking cancellation preserves walking');
 pointer(h.document,'pointerdown',3,250,400,h.look);
 pointer(h.stick,'pointercancel',1,64,-36);assert.equal(h.captures.size,0);
 const stopped=h.level.view;walk(h,.1);assert.equal(h.level.view.x,stopped.x);assert.equal(h.level.view.z,stopped.z);
 pointer(h.document,'pointermove',3,280,430,h.look);assert.ok(h.level.view.yaw>stopped.yaw,'walking cancellation preserves looking');
});

test('blur, hidden, rotation, capture loss and scene changes reject stale stick input',()=>{
 for(const reset of ['blur','hidden','resize','capture','scene']){
  const h=office();hold(h,0,-100);walk(h,.1);
  if(reset==='hidden'){h.hide();h.document.hidden=false}
  else if(reset==='capture')pointer(h.stick,'lostpointercapture',1,64,-36);
  else if(reset==='scene'){h.window.__navigationProbe.setStage('character');h.window.__navigationProbe.setStage('walk-sign')}
  else h.window.dispatchEvent(new Event(reset));
  const before=h.level.view;pointer(h.stick,'pointermove',1,64,-36);walk(h,.1);
  assert.equal(h.level.view.x,before.x,reset);assert.equal(h.level.view.z,before.z,reset);
  hold(h,0,-100,4);walk(h,.1);assert.ok(h.level.view.z<before.z,'fresh input works after reset');
 }
});

test('look pitch stays bounded, joystick touches stay separate and keyboard still moves',()=>{
 const h=office();pointer(h.document,'pointerdown',1,200,300,h.look);pointer(h.document,'pointermove',1,200,-10000,h.look);assert.equal(h.level.view.pitch,.9);
 pointer(h.document,'pointermove',1,200,10000,h.look);assert.equal(h.level.view.pitch,-.9);
 pointer(h.document,'pointerup',1,200,10000,h.look);
 const before=h.level.view;pointer(h.document,'pointerdown',2,20,300,h.stick);pointer(h.document,'pointermove',2,120,300,h.stick);assert.equal(h.level.view.yaw,before.yaw);
 h.key('KeyW');walk(h,.1);assert.ok(h.level.view.z<before.z);
});

test('partial and full stick movement retain the shared slowdown and accepted-distance gait',()=>{
 for(const amount of [.5,1]){
  const h=office();h.advanceGame(570);assert.equal(h.level.timeScale,.65);
  hold(h,128*.32*(.14+.86*amount),0);const before=h.level.view;walk(h);
  assert.ok(Math.abs(h.level.view.x-before.x-2.34*amount)<1e-8);
  assert.ok(Math.abs(h.level.view.walkedDistance-before.walkedDistance-2.34*amount)<1e-8);
 }
});

test('keyboard pitch is bounded and opening the mixer releases navigation',()=>{
 const h=office();h.key('PageUp');walk(h);assert.equal(h.level.view.pitch,.9);h.key('PageUp','keyup');
 h.key('PageDown');walk(h,.5);assert.ok(Math.abs(h.level.view.pitch-.3)<1e-8);h.key('PageDown','keyup');
 hold(h,0,-100);const mixer=h.node('amt-mix');mixer.closest=selector=>selector==='#amt-mix'?mixer:null;
 pointer(h.document,'pointerdown',4,40,30,mixer);const before=h.level.view;walk(h,.1);assert.equal(h.level.view.z,before.z);assert.equal(h.captures.size,0);
});

test('opening the native mixer disclosure without a pointer releases both gestures and keys',()=>{
 const h=office();hold(h,0,-100);h.key('KeyD');
 pointer(h.document,'pointerdown',2,250,400,h.look);
 const mixer=h.node('amt-mix');mixer.open=true;mixer.dispatchEvent(new Event('toggle'));
 const before=h.level.view;walk(h,.1);assert.equal(h.level.view.x,before.x);assert.equal(h.level.view.z,before.z);assert.equal(h.captures.size,0);
 pointer(h.document,'pointermove',2,310,340,h.look);assert.equal(h.level.view.yaw,before.yaw);assert.equal(h.level.view.pitch,before.pitch);
});

function tap(h,x=250,y=400,id=9){pointer(h.document,'pointerdown',id,x,y,h.look);h.tick(50);pointer(h.document,'pointerup',id,x,y,h.look)}
function pickedOffice(selection={actorId:'amt-konrad-wohnungszettel'}){
 const h=office();h.picks=[];h.window.Germany3D={pickAmtInteraction:(x,y)=>{h.picks.push([x,y]);return selection}};return h;
}

test('one mouse click starts a visible target, while a camera drag does not',()=>{
 const h=pickedOffice();pointer(h.document,'pointerdown',1,250,400,h.look,'mouse');h.tick(50);pointer(h.document,'pointerup',1,250,400,h.look,'mouse');
 assert.equal(h.level.stage,'character');assert.deepEqual(h.picks,[[250,400]]);
 const drag=pickedOffice();pointer(drag.document,'pointerdown',1,250,400,drag.look,'mouse');pointer(drag.document,'pointermove',1,300,400,drag.look,'mouse');pointer(drag.document,'pointerup',1,300,400,drag.look,'mouse');assert.equal(drag.picks.length,0);
});
test('double tap selects the tapped visible person beyond desktop reach, once per pair',()=>{
 const h=pickedOffice();tap(h);assert.equal(h.level.stage,'walk-sign');tap(h,258,405,10);
 assert.equal(h.level.stage,'character');assert.equal(h.node('amt-speaker').textContent,'KONRAD WOHNUNGSZETTEL');assert.deepEqual(h.picks,[[258,405]]);
 tap(h);tap(h);assert.equal(h.picks.length,1,'scripted speech does not accept new gestures');
});
test('swipes, long holds, distant taps, cancellation and input resets do not activate objects',()=>{
 for(const invalid of ['swipe','hold','distant','cancel','blur','hidden','resize','menu','scene']){
  const h=pickedOffice();tap(h);
  if(invalid==='swipe'){pointer(h.document,'pointerdown',11,250,400,h.look);pointer(h.document,'pointermove',11,300,400,h.look);pointer(h.document,'pointerup',11,250,400,h.look)}
  else if(invalid==='hold'){pointer(h.document,'pointerdown',11,250,400,h.look);h.tick(300);pointer(h.document,'pointerup',11,250,400,h.look)}
  else if(invalid==='distant')tap(h,100,300,11);
  else if(invalid==='cancel'){pointer(h.document,'pointerdown',11,250,400,h.look);pointer(h.document,'pointercancel',11,250,400,h.look);tap(h)}
  else if(invalid==='hidden'){h.hide();h.document.hidden=false;tap(h)}
  else if(invalid==='menu'){const button=h.node('amt-mix');button.closest=()=>button;pointer(h.document,'pointerdown',11,50,30,button);tap(h)}
  else if(invalid==='scene'){h.window.__navigationProbe.setStage('character');h.window.__navigationProbe.setStage('walk-sign');tap(h)}
  else {h.window.dispatchEvent(new Event(invalid));tap(h)}
  assert.equal(h.level.stage,'walk-sign',invalid);assert.equal(h.picks.length,0,invalid);
 }
});
test('double taps use screen selection only and retain counter ticket prerequisites',()=>{
 const empty=pickedOffice(null);tap(empty);tap(empty);assert.equal(empty.level.stage,'walk-sign');
 const desk=pickedOffice({desk:3});tap(desk);tap(desk);assert.equal(desk.level.stage,'early');assert.equal(desk.level.activated,false);
 const h=pickedOffice();tap(h);h.tick(400);tap(h);assert.equal(h.picks.length,0,'expired first tap cannot pair');
});

