import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createLevelDoor} from '../level-transitions.js';
import * as effects from '../level-transition-effects.js';
import {createBuildingLevels} from '../building-levels.js';
import {harness} from './amt-harness.mjs';

async function fixture(run,loadEffects=()=>effects){
  const names=['window','document','innerWidth','innerHeight'],saved=Object.fromEntries(names.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  const classes=new Set(),document={hidden:false,body:{classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)}}},window={};
  for(const [name,value] of Object.entries({window,document,innerWidth:1280,innerHeight:800}))Object.defineProperty(globalThis,name,{value,configurable:true});
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(48,1.6,.1,150),door=createLevelDoor(T),insideDoor=createLevelDoor(T),reducedMotion={matches:false};
  camera.position.set(0,11.5,14);camera.lookAt(0,1,-2.7);scene.add(door.group);
  const source=new T.PerspectiveCamera(69,1.6,.06,35);source.position.set(3,1.68,-8);source.rotation.y=1.2;insideDoor.group.position.z=5.55;
  let target=null,disposed=0,preparations=0,failCapture=false,failRender=false;const pulls=[],pullAspects=[];
  const renderer={getDrawingBufferSize:v=>v.set(1280,800),getRenderTarget:()=>target,setRenderTarget(value){target=value;if(value)value.addEventListener('dispose',()=>disposed++);},render(){if(failRender)throw Error('pending import render failure');if(target&&failCapture)throw Error('injected capture failure')}};
  const levels=createBuildingLevels({THREE:T,renderer,scene,camera,bridge:{clearInput(){}},mobile:false,reducedMotion,loadEffects,getDoor:()=>door,getBounds:()=>new T.Box3(new T.Vector3(-2,0,-2),new T.Vector3(2,5,2)),prepareExterior:()=>preparations++,getInterior:()=>({camera:source,door:insideDoor,render:view=>{pulls.push(view.position.toArray());pullAspects.push(view.aspect)}})});
  const advance=seconds=>{for(let i=0;i<Math.ceil(seconds*60);i++)levels.render(1/60)};
  try{await run({levels,camera,door,insideDoor,reducedMotion,classes,document,window,advance,pulls,pullAspects,get disposed(){return disposed},get preparations(){return preparations},failCapture(){failCapture=true},failRender(){failRender=true}})}
  finally{levels.dispose();door.dispose();insideDoor.dispose();for(const key of names){if(saved[key])Object.defineProperty(globalThis,key,saved[key]);else delete globalThis[key]}}
}

test('one entry owns the input gate and commits once after the complete building collapse',()=>fixture(f=>{
  let entered=0;
  assert.equal(f.levels.enter('buergeramt',()=>entered++),true);
  assert.equal(f.levels.enter('jobcenter',()=>entered++),false);
  f.advance(.3);assert.equal(entered,0);assert.equal(f.levels.inspect().stage,'door');assert.ok(f.classes.has('level-transitioning'));
  f.advance(2.4);assert.equal(entered,0);assert.equal(f.levels.inspect().stage,'collapse');assert.ok(f.levels.inspect().vortex.splats<18500);
  f.advance(1.2);assert.equal(entered,1);assert.equal(f.levels.active,false);assert.equal(f.door.inspect().open,0);assert.equal(f.disposed,1);assert.equal(f.classes.has('level-transitioning'),false);
  f.advance(3);assert.equal(entered,1);
}));

test('a forced exit crosses the actual indoor doorway before committing and rebuilding the exterior',()=>fixture(f=>{
  let returned=0;f.levels.leave('jobcenter',{mode:'eject',fire:true,onReturn:()=>returned++});
  f.advance(.8);assert.equal(returned,0);assert.ok(f.pulls.length>40);assert.equal(f.levels.inspect().stage,'pull');assert.ok(f.insideDoor.inspect().open>.9);
  f.advance(.4);assert.equal(returned,1);assert.equal(f.levels.inspect().stage,'rebuild');assert.equal(f.preparations,1);
  f.advance(4);assert.equal(f.levels.active,false);assert.equal(returned,1);assert.equal(f.insideDoor.inspect().open,0);assert.equal(f.disposed,1);
}));

test('voluntary exits are synchronous and allocate no vortex or camera pull',()=>fixture(f=>{
  let returned=0;f.levels.leave('buergeramt',{mode:'voluntary',onReturn:()=>returned++});
  assert.equal(returned,1);assert.equal(f.levels.active,false);assert.equal(f.disposed,0);assert.equal(f.pulls.length,0);
}));

test('a forced pull follows viewport changes after cloning the current indoor view',()=>fixture(f=>{
  f.levels.leave('jobcenter',{mode:'eject'});f.advance(.2);
  assert.equal(f.pullAspects.at(-1),1.6);
  f.camera.aspect=390/844;f.camera.updateProjectionMatrix();f.advance(.2);
  assert.equal(f.pullAspects.at(-1),390/844);
  f.camera.aspect=844/390;f.camera.updateProjectionMatrix();f.advance(.2);
  assert.equal(f.pullAspects.at(-1),844/390);
}));

test('hidden/pause clocks do not catch up; reduced motion omits camera travel and flames',()=>fixture(f=>{
  let returned=0;f.levels.leave('jobcenter',{mode:'eject',fire:true,onReturn:()=>returned++});f.advance(.2);
  const elapsed=f.levels.inspect().elapsed;f.document.hidden=true;f.advance(4);assert.equal(f.levels.inspect().elapsed,elapsed);
  f.document.hidden=false;f.window.GermanyHUD={paused:true};f.advance(4);assert.equal(f.levels.inspect().elapsed,elapsed);
  f.window.GermanyHUD.paused=false;f.reducedMotion.matches=true;f.advance(.1);assert.equal(returned,1);assert.equal(f.levels.active,false);
  const pulls=f.pulls.length;f.levels.leave('jobcenter',{mode:'eject',fire:true,onReturn:()=>returned++});f.advance(.1);
  assert.equal(f.levels.inspect().stage,'fade');assert.equal(f.levels.inspect().vortex.splats,0);assert.equal(f.pulls.length,pulls);
  f.advance(.2);assert.equal(returned,2);assert.equal(f.levels.active,false);
}));

test('BFCache, cancellation and capture failure release ownership without duplicate consequences',()=>fixture(f=>{
  let count=0;f.levels.enter('buergeramt',()=>count++);f.advance(.8);f.levels.suspend();assert.equal(f.levels.active,false);assert.equal(f.disposed,1);
  f.levels.resume();f.levels.resume();assert.equal(count,1);
  f.levels.enter('buergeramt',()=>count++);f.advance(.2);f.levels.cancel('buergeramt');f.levels.resume();f.advance(5);assert.equal(count,1);
  f.failCapture();f.levels.enter('finanzamt',()=>count++);f.advance(.7);assert.equal(f.levels.active,false);assert.equal(count,2);assert.match(f.levels.inspect().failure,/injected capture failure/);
}));

test('ordinary office paperwork owns an indoor room and returns immediately on voluntary completion',()=>fixture(f=>{
  let opened=0;f.levels.enter('finanzamt',()=>opened++,true);f.advance(4);
  assert.equal(opened,1);assert.equal(f.levels.office,'finanzamt');assert.equal(f.levels.render(.05),true);
  assert.equal(f.levels.enter('hausverwaltung',()=>opened++,true),false);
  f.levels.leave('finanzamt',{mode:'voluntary'});assert.equal(f.levels.office,'');assert.equal(f.levels.render(.05),false);
}));

test('a delayed scene import holds the owned clock; cancellation cannot reopen the old visit',async()=>{
  let resolveModule,loads=0;
  await fixture(async f=>{
    let entered=0;f.levels.enter('finanzamt',()=>entered++,true);f.advance(8);
    assert.equal(f.levels.active,true);assert.equal(f.levels.inspect().elapsed,0);assert.equal(entered,0);assert.equal(loads,1);
    assert.equal(f.levels.enter('hausverwaltung',()=>entered++),false);
    f.levels.cancel('finanzamt');resolveModule(effects);await Promise.resolve();await Promise.resolve();f.advance(8);
    assert.equal(entered,0);assert.equal(f.levels.active,false);
    f.levels.enter('hausverwaltung',()=>entered++,true);f.advance(4);
    assert.equal(entered,1);assert.equal(f.levels.office,'hausverwaltung');assert.equal(loads,1);
  },()=>{loads++;return new Promise(done=>resolveModule=done)});
});

test('scene import failure keeps direct travel once and permits a later retry',async()=>{
  let rejectModule,loads=0;
  await fixture(async f=>{
    let returned=0;f.levels.leave('jobcenter',{mode:'eject',onReturn:()=>returned++});f.advance(2);
    assert.equal(returned,0);rejectModule(Error('missing scene module'));await Promise.resolve();await Promise.resolve();f.advance(.1);
    assert.equal(returned,1);assert.equal(f.levels.active,false);assert.match(f.levels.inspect().failure,/missing scene module/);
    f.advance(2);assert.equal(returned,1);
    f.levels.enter('finanzamt',()=>returned++,true);f.advance(4);assert.equal(returned,2);assert.equal(f.levels.office,'finanzamt');
  },()=>++loads===1?new Promise((_resolve,reject)=>rejectModule=reject):effects);
});

test('BFCache resume waits for a delayed room module, then commits that indoor visit once',async()=>{
  let resolveModule;
  await fixture(async f=>{
    let entered=0;f.levels.enter('finanzamt',()=>entered++,true);f.advance(.2);f.levels.suspend();f.levels.resume();f.levels.resume();
    assert.equal(entered,0);assert.equal(f.levels.active,true);assert.ok(f.classes.has('level-transitioning'));
    resolveModule(effects);await Promise.resolve();await Promise.resolve();f.advance(.1);
    assert.equal(entered,1);assert.equal(f.levels.office,'finanzamt');assert.equal(f.levels.active,false);f.advance(4);assert.equal(entered,1);
  },()=>new Promise(done=>resolveModule=done));
});

test('a render failure during import waiting releases the input gate and commits direct travel once',()=>fixture(f=>{
  let entered=0;f.levels.enter('finanzamt',()=>entered++,true);f.failRender();f.advance(.1);
  assert.equal(entered,1);assert.equal(f.levels.active,false);assert.equal(f.classes.has('level-transitioning'),false);
  assert.match(f.levels.inspect().failure,/pending import render failure/);f.advance(.1);assert.equal(entered,1);
},()=>new Promise(()=>{})));

test('the waiting current view tracks a resized viewport without starting the camera pull',()=>fixture(f=>{
  f.levels.leave('jobcenter',{mode:'eject'});f.advance(.1);const before=f.pulls.at(-1);
  f.camera.aspect=390/844;f.camera.updateProjectionMatrix();f.advance(.1);
  assert.equal(f.pullAspects.at(-1),390/844);assert.deepEqual(f.pulls.at(-1),before);assert.equal(f.levels.inspect().elapsed,0);
},()=>new Promise(()=>{})));

test('Bürgeramt ejection waits for the current transition receipt and rejects stale completion after replay',()=>{
  const h=harness();let exit;
  h.window.Germany3D.leaveBuilding=(id,config)=>{assert.equal(id,'buergeramt');exit=config;return true;};
  h.counter();h.links[0].message({type:'answer',id:'grass'});
  h.tick(150000);
  assert.ok(exit);assert.equal(exit.mode,'eject');assert.equal(exit.fire,true);assert.equal(h.counts.cancel,0);assert.equal(h.level.leaving,true);
  const before=h.level.view;h.key('KeyW');h.elapse(1);h.key('KeyW','keyup');assert.deepEqual(h.level.view,before);
  exit.onReturn();exit.onReturn();assert.equal(h.counts.cancel,1);assert.equal(h.level.active,false);
  h.level.open(h.config);h.node('amt-leave').click();const old=exit.onReturn;
  h.level.replay(h.config);old();assert.equal(h.level.active,true);assert.equal(h.counts.close,0);
});
