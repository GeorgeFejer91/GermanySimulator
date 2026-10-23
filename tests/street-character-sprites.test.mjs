import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.core.js';
import {ShaderChunk} from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {sampleStreetCharacterRig,orderStreetCharacterRigPacket,projectStreetCharacterRigPacket,STREET_RIG_LIMITS} from '../street-character-rig.js';
import {registerStreetCharacterManifest,resolveStreetCharacter,requestStreetReaction,cancelStreetReaction,advanceStreetAnimation,createStreetCharacterSprite,createStreetCharacterCanvasSprite} from '../street-character-sprites.js';

function manifest(){
  const names=['down','right','up','left','idle','talk','greet','wait','work','review','success','failure','look'];
  return {schemaVersion:1,characters:{'quiz-test-person':{id:'test-person',actorId:'test-actor',aliases:['test-explicit'],name:'Test Person',cell:[128,160],pivot:[60,150],figureHeight:136,figureWorldHeight:1.6,grid:[8,8],strideDistance:20,
    clips:Object.fromEntries(names.map((name,index)=>[name,{offset:index*4,count:4,seconds:.8}])),
    variants:{desktop:{file:'./assets/characters/street/test.webp',width:1024,height:1280,sha256:'d'.repeat(64)},mobile:{file:'./assets/characters/street/test-mobile.webp',width:512,height:640,sha256:'a'.repeat(64)}}}}};
}
function actor(){return {id:'test-actor',voiceId:'quiz-test-person',x:0,y:0,vx:12,vy:0}}
function mouthRegistration(){
  return {rect:[.5,.6,.1,.05],axes:[12.8,0,0,8],profile:{corners:[-1,1],crease:[0,0,0,0,0],
    open_upper:[0,-.1,-.2,-.1,0],open_lower:[0,.3,.5,.3,0],source_upper:[0,0,0,0,0],source_lower:[0,0,0,0,0],width:[.1,.2],teeth:0}};
}
function setup(){registerStreetCharacterManifest(manifest());return actor()}
function standingSetup(){
  const candidate=manifest();
  candidate.characters['quiz-test-person'].standing={file:'./assets/characters/street/test-standing.webp',width:128,height:160,sha256:'b'.repeat(64)};
  registerStreetCharacterManifest(candidate);return actor();
}

function rendererFixture(){
  const requests=[],textures=[];
  const T={...THREE,ShaderChunk,TextureLoader:class{
    load(url,ok,progress,fail){requests.push({url,ok,fail})}
  }};
  const queue=[];
  function queueAsset(position,radius,task,owner){const job={position,radius,task,owner,state:'pending'};queue.push(job);return job}
  function finish(index=0,width=1024,height=1280){
    const texture=new THREE.Texture({width,height});texture.disposals=0;texture.addEventListener('dispose',()=>texture.disposals++);textures.push(texture);requests[index].ok(texture);return texture;
  }
  function host(){const group=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());group.add(body);return group}
  return {T,requests,textures,queue,queueAsset,finish,host,camera:new THREE.PerspectiveCamera()};
}

function canvasFixture(){
  const previous=globalThis.Image,requests=[],images=[],queue=[],draws=[];
  globalThis.Image=class{
    constructor(){this.naturalWidth=0;this.naturalHeight=0;this.clears=0;this.decodes=0;images.push(this)}
    set src(url){this.url=url;if(url)requests.push({url,image:this,ok:this.onload,fail:this.onerror});else this.clears++}
    decode(){this.decodes++;return this.decodePromise||Promise.resolve()}
  };
  return {requests,images,queue,draws,ctx:{drawImage(...args){draws.push(args)}},
    queueAsset(position,radius,task,owner){const job={position,radius,task,owner,state:'pending'};queue.push(job);return job},
    finish(index=0,width=128,height=160){const r=requests[index];r.image.naturalWidth=width;r.image.naturalHeight=height;r.ok();return r.image},
    restore(){if(previous===undefined)delete globalThis.Image;else globalThis.Image=previous}
  };
}

function rigManifest(){
  const candidate=manifest(),person=candidate.characters['quiz-test-person'];
  person.standing={file:'./assets/characters/street/test-standing.webp',width:128,height:160,sha256:'b'.repeat(64)};
  person.motionRig={file:'./assets/characters/street/test-rig.json',sha256:'c'.repeat(64),variants:{desktop:{file:'./assets/characters/street/test-parts.webp',width:256,height:256,sha256:'e'.repeat(64)},mobile:{file:'./assets/characters/street/test-parts-mobile.webp',width:128,height:128,sha256:'f'.repeat(64)}}};
  person.strideDistance=4/7/.02;delete person.variants;return candidate;
}
function rigDefinition(){
  const uvs=[[0,0],[.1,0],[0,.1],[.1,.1]],triangles=[[0,1,2],[1,3,2]],parts=[{type:'billboard',vertices:[[-.3,.8],[.3,.8],[-.3,-.15],[.3,-.15]],uvs,triangles}];
  for(let leg=0;leg<2;leg++){
    for(const bone of ['upper','lower'])parts.push({type:'bone-ribbon',leg,bone,vertices:[[-.1,-.05],[-.1,.05],[1.1,-.05],[1.1,.05]],uvs,triangles});
    parts.push({type:'sole-upright',leg,vertices:[[-.09,.24],[.09,.24],[-.09,0],[.09,0]],uvs,triangles});
  }
  return {schemaVersion:1,format:'gs-painted-parts',id:'test-person',figureWorldHeight:1.6,skeleton:{pelvisY:.6,legs:[-.2,.2].map(x=>({hip:[x,.6,0],soleX:x,ankleOffset:[0,.24,0],upperLength:.255,lowerLength:.11}))},gait:{excursionWorld:1/7,liftWorld:.032,baseHipDrop:.002,maxHipDrop:.07,strideDistance:4/7/.02},views:Object.fromEntries(['down','right','up','left'].map(direction=>[direction,{parts:structuredClone(parts),upperClips:direction==='down'?{success:{frames:[{uvs},{uvs:uvs.map(([u,v])=>[u+.2,v])},{uvs}]}}:{},mouth:'unregistered-closed'}]))};
}
function capacityRegressionDefinition(){
  const quad=[[0,1,2],[1,3,2]],bootTriangles=[...quad,[2,3,4],[3,5,4]];
  const part=(type,vertices,leg,bone)=>({type,vertices,uvs:vertices.map((_,i)=>[(i%2)*.1,Math.floor(i/2)*.1]),triangles:type==='sole-upright'?bootTriangles:quad,...(leg===undefined?{}:{leg}),...(bone?{bone}:{})});
  const parts=[
    part('billboard',[[-.49709699122018264,1.118468230245411],[.5251589181439026,1.118468230245411],[-.49709699122018264,-.20044233516942847],[.5251589181439026,-.20044233516942847]]),
    part('bone-ribbon',[[.66,-.12893158113449663],[.66,.205484707433104],[1.18,-.12944714620323555],[1.18,.20630638926140668]],0,'upper'),
    part('bone-ribbon',[[-.38095238095238093,-.11700555739568491],[-.38095238095238093,.2057683940406873],[.8571428571428571,-.11747408180871408],[.8571428571428571,.2065923507670489]],0,'lower'),
    part('sole-upright',[[-.2184756603484243,.2960606397693323],[.20633812366240073,.2960606397693323],[-.21884595619287558,.2393310878217179],[.2066878475154936,.2393310878217179],[-.22040816326530616,0],[.20816326530612247,0]],0),
    part('bone-ribbon',[[.66,-.21354293125401005],[.66,.1611644764181208],[1.18,-.21439683589910888],[1.18,.16180893275404445]],1,'upper'),
    part('bone-ribbon',[[-.38095238095238093,-.2138377428265966],[-.38095238095238093,.11700555739568491],[.8571428571428571,-.21469401158144297],[.8571428571428571,.11747408180871408]],1,'lower'),
    part('sole-upright',[[-.198246432538385,.2960606397693323],[.20229227810039285,.2960606397693323],[-.19858244173057227,.2393310878217179],[.20263514462303292,.2393310878217179],[-.2,0],[.20408163265306123,0]],1)
  ];
  return {schemaVersion:1,format:'gs-painted-parts',id:'test-person',figureWorldHeight:1.6,
    fixturePurpose:'Frozen numeric down-view geometry/skeleton/gait from unapproved painted-parts-pilot-v2; synthetic UVs and repeated views only for capacity regression, no painted asset or source approval.',
    skeleton:{pelvisY:.6021460306502662,legs:[{hip:[-.1964334884660399,.6021460306502662,0],soleX:-.2,ankleOffset:[.0014175582694277433,.2393310878217179,0],upperLength:.25468387414077964,lowerLength:.10813743275810672},{hip:[.20445118187281705,.6021460306502662,0],soleX:.20816326530612247,ankleOffset:[-.0014754177906288468,.2393310878217179,0],upperLength:.25468424625592345,lowerLength:.10813759075623862}]},
    gait:{excursionWorld:.14285714285714288,liftWorld:.0326530612244898,baseHipDrop:.0020408163265306124,maxHipDrop:.0816326530612245,strideDistance:28.571428571428577},
    views:Object.fromEntries(['down','right','up','left'].map(direction=>[direction,{parts:structuredClone(parts),upperClips:{}}]))};
}
function rigFetch(definition=rigDefinition()){
  const previous=globalThis.fetch,requests=[];
  globalThis.fetch=(url,options)=>new Promise((resolve,reject)=>{requests.push({url,options,resolve,reject});if(definition!==null)resolve({ok:true,text:async()=>JSON.stringify(definition)})});
  return {requests,restore(){globalThis.fetch=previous}};
}
async function until(condition){for(let i=0;i<100;i++){if(condition())return;await new Promise(setImmediate)}assert.fail('fixture did not reach expected asynchronous admission')}
function actualRigFrame(host,camera,direction='down'){
  host.updateWorldMatrix(true,false);camera.updateWorldMatrix(true,false);
  return {rootWorld:new THREE.Vector3().setFromMatrixPosition(host.matrixWorld).toArray(),forwardWorld:{down:[0,0,1],right:[1,0,0],up:[0,0,-1],left:[-1,0,0]}[direction],camera:{position:new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld).toArray(),right:new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0).normalize().toArray(),up:new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1).normalize().toArray(),forward:new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,2).normalize().negate().toArray()}};
}

test('identity resolution accepts explicit aliases and never conflates a similar suffix',()=>{
  setup();
  assert.equal(resolveStreetCharacter({quizCharacterId:'test-person'}),'quiz-test-person');
  assert.equal(resolveStreetCharacter({streetCharacterId:'test-explicit'}),'quiz-test-person');
  assert.equal(resolveStreetCharacter({id:'test-actor'}),'quiz-test-person');
  assert.equal(resolveStreetCharacter({voiceId:'crowd-test-person'}),null);
  assert.equal(createStreetCharacterSprite({}, {id:'unknown'}, {}, ()=>{}, {}),null);
});

test('source-bound mouth registrations reject invalid cell mappings before replacing the cast',()=>{
  for(const change of [p=>p.mouthPaint.standing.rect[0]=2,p=>p.mouthPaint.frames.length=65,p=>p.mouthPaint.frames[0].profile.open_lower[2]=-1]){
    const candidate=manifest(),p=candidate.characters['quiz-test-person'];
    p.mouthPaint={standing:mouthRegistration(),frames:[mouthRegistration()]};change(p);
    assert.throws(()=>registerStreetCharacterManifest(candidate),/mouth|lip|registration/i);
  }
});

test('displayed sprite cell and native speech share one mouth registration without freezing body motion',async()=>{
  const candidate=manifest(),person=candidate.characters['quiz-test-person'];
  person.mouthPaint={frames:Array.from({length:64},()=>mouthRegistration())};person.mouthPaint.frames[0]=null;
  registerStreetCharacterManifest(candidate);const n=actor(),f=rendererFixture(),host=f.host();
  const adapter=createStreetCharacterSprite(f.T,n,host,f.queueAsset,f.camera),pending=f.queue[0].task();
  await Promise.resolve();const texture=f.finish();await pending;
  const cue={},speech={speechStatus:'playing',cueToken:cue,mediaTime:.3,mediaDuration:2,mouthOpen:.8,dx:1,dy:0};
  const first=advanceStreetAnimation(n,5,.1,speech);adapter.sync();
  assert.equal(first.clip,'right');assert.equal(first.frame,1);assert.equal(adapter.inspect().mouth.active,true);
  assert.equal(adapter.inspect().mouth.opening[0],.8);assert.deepEqual(adapter.inspect().mouth.rect,[.6875,.95,.0125,.00625]);
  assert.deepEqual(adapter.inspect().mouth.axes,[12.8,0,0,8]);assert.equal('texture' in adapter.inspect().mouth,false);assert.equal('registration' in adapter.inspect().mouth,false);
  const positions=host.children[1].geometry.attributes.position.array,requests=f.requests.length;
  advanceStreetAnimation(n,5,.1,{...speech,mediaTime:.5});adapter.sync();
  assert.equal(adapter.inspect().pose.frame,2);assert.equal(adapter.inspect().mouth.active,true);
  assert.equal(host.children[1].geometry.attributes.position.array,positions);assert.equal(f.requests.length,requests);
  advanceStreetAnimation(n,10,.1,{...speech,dx:0,dy:1});adapter.sync();
  assert.equal(adapter.inspect().pose.slot,0);assert.equal(adapter.inspect().mouth.active,false,'rear/hidden/null cell has no paint');
  advanceStreetAnimation(n,5,.1,{...speech,speechStatus:'paused'});adapter.sync();assert.equal(adapter.inspect().mouth.active,false);
  adapter.dispose();assert.equal(texture.disposals,1);
  const priorWidth=globalThis.innerWidth;globalThis.innerWidth=390;
  let mobile;
  try{
    const m=actor(),fixture=rendererFixture();mobile=createStreetCharacterSprite(fixture.T,m,fixture.host(),fixture.queueAsset,fixture.camera);
    const load=fixture.queue[0].task();await Promise.resolve();fixture.finish(0,512,640);await load;
    advanceStreetAnimation(m,5,.1,speech);mobile.sync();assert.deepEqual(mobile.inspect().mouth.axes,[6.4,0,0,4]);assert.deepEqual(mobile.inspect().mouth.rect,[.6875,.95,.0125,.00625]);
  }finally{mobile?.dispose();if(priorWidth===undefined)delete globalThis.innerWidth;else globalThis.innerWidth=priorWidth}
});

test('compact portrait and landscape use compact paint at the actual one-pixel renderer density',async()=>{
  const oldWidth=globalThis.innerWidth,oldHeight=globalThis.innerHeight,oldDpr=globalThis.devicePixelRatio;
  try{
    for(const [width,height,dpr,variant]of [[390,844,1,'mobile'],[390,844,3,'mobile'],[844,390,2,'mobile'],[1280,800,2,'desktop']]){
      Object.assign(globalThis,{innerWidth:width,innerHeight:height,devicePixelRatio:dpr});
      const n=setup(),f=rendererFixture(),adapter=createStreetCharacterSprite(f.T,n,f.host(),f.queueAsset,f.camera),pending=f.queue[0].task();
      await Promise.resolve();assert.equal(adapter.inspect().variant,variant);
      assert.match(f.requests[0].url,variant==='mobile'?/\/test-mobile\.webp\?v=/:/\/test\.webp\?v=/);
      f.finish(0,...(variant==='mobile'?[512,640]:[1024,1280]));await pending;adapter.dispose();
    }
  }finally{
    for(const [key,value]of [['innerWidth',oldWidth],['innerHeight',oldHeight],['devicePixelRatio',oldDpr]])if(value===undefined)delete globalThis[key];else globalThis[key]=value;
  }
});

test('manifest validation rejects malformed clips, texture bounds, ambiguous identities and negative gait',()=>{
  for(const change of [
    person=>person.clips.greet.offset=64,
    person=>person.variants.mobile.width=8192,
    person=>person.variants.desktop.file='./assets/characters/street/../private.webp',
    person=>person.strideDistance=-1
  ]){
    const candidate=manifest();change(candidate.characters['quiz-test-person']);assert.throws(()=>registerStreetCharacterManifest(candidate));
  }
  const candidate=manifest();candidate.characters.other={...candidate.characters['quiz-test-person']};
  assert.throws(()=>registerStreetCharacterManifest(candidate),/Ambiguous/);
});

test('only accepted displacement advances gait; render time and requested velocity cannot walk in place',()=>{
  const n=setup();advanceStreetAnimation(n,0,0);
  n.x=7;const moved=advanceStreetAnimation(n,7,.016);
  assert.equal(moved.clip,'right');assert.equal(moved.frame,1);assert.equal(moved.moving,true);
  assert.equal(advanceStreetAnimation(n,0,10).clip,'idle');
  n.y=-10;const north=advanceStreetAnimation(n,10,.1);
  assert.equal(north.clip,'up');assert.equal(north.frame,3);
  const paused=advanceStreetAnimation(n,100,20,{paused:true});assert.deepEqual(paused,north);
  n.x-=3;const resumed=advanceStreetAnimation(n,3,.1);
  assert.equal(resumed.clip,'left');assert.equal(resumed.frame,0,'pause must not add the rejected 100-unit movement');
});

test('reaction local clocks begin at frame zero after travel and show terminal before the next step',()=>{
  const n=setup();advanceStreetAnimation(n,0,40);
  assert.equal(requestStreetReaction(n,['review','success'],{token:'answer'}),true);
  n.x=2;const travel=advanceStreetAnimation(n,2,.7);assert.equal(travel.clip,'right');assert.equal(travel.holdPosition,true);
  const start=advanceStreetAnimation(n,0,.7);assert.equal(start.clip,'review');assert.equal(start.frame,0);
  const last=advanceStreetAnimation(n,0,5);assert.equal(last.clip,'review');assert.equal(last.frame,3);
  assert.deepEqual(advanceStreetAnimation(n,0,5,{paused:true}),last);
  const next=advanceStreetAnimation(n,0,.1);assert.equal(next.clip,'success');assert.equal(next.frame,0);
  assert.equal(advanceStreetAnimation(n,0,1).frame,3);
  assert.equal(advanceStreetAnimation(n,0,.01).holdPosition,false);
});

test('a queued outcome survives incidental greetings and resets its own action clock',()=>{
  const n=setup();requestStreetReaction(n,'greet',{token:'greet'});
  advanceStreetAnimation(n,0,.1);advanceStreetAnimation(n,0,.4);
  assert.equal(requestStreetReaction(n,'greet',{token:'greet'}),false);
  requestStreetReaction(n,['review','failure'],{token:'result'});
  assert.equal(requestStreetReaction(n,'look',{incidental:true}),false);
  advanceStreetAnimation(n,0,.5);
  const next=advanceStreetAnimation(n,0,.3);assert.equal(next.clip,'review');assert.equal(next.frame,0);
  advanceStreetAnimation(n,0,.8);
  assert.equal(advanceStreetAnimation(n,0,.3).clip,'failure');
});

test('cancellation and preemption release the old reaction without stale-token cancellation',()=>{
  const n=setup();requestStreetReaction(n,'greet',{token:'old'});advanceStreetAnimation(n,0,.1);
  requestStreetReaction(n,'success',{token:'new',preempt:true});
  const next=advanceStreetAnimation(n,0,4);assert.equal(next.clip,'success');assert.equal(next.frame,0);
  assert.equal(cancelStreetReaction(n,{token:'old'}),false);
  assert.equal(cancelStreetReaction(n,{token:'new'}),true);
  assert.equal(advanceStreetAnimation(n,0,.1).holdPosition,false);
  assert.equal(advanceStreetAnimation(n,0,.1).clip,'idle');
});

test('unregistered talk paint stays closed and captions never impersonate audio',()=>{
  const n=setup();
  const audio={speaking:true,cueToken:'a',mediaTime:.3,mouthOpen:1};
  const talking=advanceStreetAnimation(n,0,.1,audio);assert.equal(talking.clip,'talk');assert.equal(talking.frame,0);assert.equal(talking.mouthOpen,0);
  const caption=advanceStreetAnimation(n,0,.1,{...audio,speaking:false,waiting:true});assert.equal(caption.clip,'wait');assert.equal(caption.mouthOpen,0);
});

test('registered speech follows media opening, freezes on pause, closes on cancel and rejects retired cues',()=>{
  const candidate=manifest();candidate.characters['quiz-test-person'].speech={clips:{talk:{offset:52,count:4}}};registerStreetCharacterManifest(candidate);
  const n=actor(),audio={speaking:true,cueToken:'a',mediaTime:.3,mouthOpen:1,mediaDuration:2};
  const open=advanceStreetAnimation(n,0,.1,audio);assert.equal(open.frame,3);assert.equal(open.slot,55);
  assert.deepEqual(advanceStreetAnimation(n,0,7,{...audio,paused:true,mouthOpen:0}),open);
  const closed=advanceStreetAnimation(n,0,7,{paused:true,speaking:false,cueToken:'a'});assert.equal(closed.frame,0);assert.equal(closed.slot,52);assert.equal(closed.mouthOpen,0);
  assert.equal(advanceStreetAnimation(n,0,.1,audio).speaking,false);
  const next=advanceStreetAnimation(n,0,.1,{...audio,cueToken:'b',mediaTime:0});assert.equal(next.frame,0);
  const end=advanceStreetAnimation(n,0,.1,{...audio,cueToken:'b',mediaTime:2});assert.equal(end.frame,0);
  cancelStreetReaction(n);
  assert.equal(advanceStreetAnimation(n,0,.1,{...audio,cueToken:'b'}).speaking,false);
});

test('speech does not replace moving body phase and reduced motion retains semantic states',()=>{
  const candidate=manifest();candidate.characters['quiz-test-person'].speech={clips:{right:{offset:52,count:4}}};registerStreetCharacterManifest(candidate);
  const n=actor();advanceStreetAnimation(n,0,0);n.x=7;
  const walk=advanceStreetAnimation(n,7,.1,{speaking:true,cueToken:'a',mediaTime:.3,mouthOpen:1});assert.equal(walk.frame,1);assert.equal(walk.slot,5);assert.equal(walk.mouthOpen,0);
  requestStreetReaction(n,'success');assert.equal(advanceStreetAnimation(n,0,.1,{reducedMotion:true}).clip,'success');
  assert.equal(advanceStreetAnimation(n,0,.4,{reducedMotion:true}).frame,0);
  assert.equal(advanceStreetAnimation(n,0,.5,{reducedMotion:true}).frame,3);
});

test('late completion of an old cue cannot close the current speaker mouth',()=>{
  const candidate=manifest();candidate.characters['quiz-test-person'].speech={clips:{talk:{offset:52,count:4}}};registerStreetCharacterManifest(candidate);
  const n=actor(),audio={speaking:true,mediaTime:.3,mouthOpen:1};
  advanceStreetAnimation(n,0,.1,{...audio,cueToken:'old'});
  const current=advanceStreetAnimation(n,0,.1,{...audio,cueToken:'new'});
  const stale=advanceStreetAnimation(n,0,.1,{speaking:false,cueToken:'old'});
  assert.equal(stale.cueToken,'new');assert.equal(stale.frame,current.frame);assert.equal(stale.speaking,true);
  assert.equal(advanceStreetAnimation(n,0,.1,{...audio,cueToken:'new'}).speaking,true);
});

test('adapter only samples simulation state and binds pivot and UVs with depth-preserving material',async()=>{
  const n=setup(),f=rendererFixture(),host=f.host(),body=host.children[0];
  const adapter=createStreetCharacterSprite(f.T,n,host,f.queueAsset,f.camera);
  assert.equal(f.requests.length,0);assert.equal(body.visible,true);
  const task=f.queue[0].task();await Promise.resolve();const texture=f.finish();await task;
  n.x=7;const pose=advanceStreetAnimation(n,7,.1,{dx:7,dy:0});adapter.sync(999);adapter.sync(1000);
  assert.equal(adapter.inspect().pose,pose);
  const mesh=host.children[1],scale=1.6/136;
  assert.equal(mesh.material.map,texture);assert.equal(mesh.material.depthWrite,true);assert.equal(mesh.material.alphaTest,.08);
  assert.ok(Math.abs(mesh.position.x-4*scale)<1e-8);assert.ok(Math.abs(mesh.position.y-70*scale)<1e-8);
  assert.ok(Math.abs(mesh.geometry.attributes.uv.getX(0)-5/8)<1e-8);assert.equal(body.visible,false);
  adapter.dispose();assert.equal(texture.disposals,1);assert.equal(host.children.length,1);assert.equal(body.visible,true);
});

test('street paint stays upright at its ground pivot through camera pitch, roll, yaw and host rotation',async()=>{
  for(const standing of [false,true])for(const yaw of [0,.73,-2.4])for(const hostYaw of [0,1.1]){
    const n=standing?standingSetup():setup(),f=rendererFixture(),host=f.host();
    host.position.set(2,.4,-3);host.rotation.y=hostYaw;
    f.camera.rotation.set(-.56,yaw,.22,'YXZ');
    const adapter=createStreetCharacterSprite(f.T,n,host,f.queueAsset,f.camera);
    const task=f.queue[0].task();await Promise.resolve();f.finish(0,...(standing?[128,160]:[1024,1280]));await task;
    const mesh=host.children[1],scale=1.6/136,root=host.position.clone();
    const geometry=mesh.geometry.parameters,uv=Array.from(mesh.geometry.attributes.uv.array);
    for(const pitch of [-.56,-.9,0]){
      f.camera.rotation.set(pitch,yaw,.22,'YXZ');adapter.sync();host.updateMatrixWorld(true);
      const worldUp=new THREE.Vector3(0,1,0).transformDirection(mesh.matrixWorld);
      assert.ok(worldUp.distanceTo(new THREE.Vector3(0,1,0))<1e-10,'paint must not lean into a facade above a clear root');
      const sourcePivot=new THREE.Vector3((60-64)*scale,(80-150)*scale,0).applyMatrix4(mesh.matrixWorld);
      assert.ok(sourcePivot.distanceTo(root)<1e-10,'orientation must preserve the painted ground pivot');
      const head=sourcePivot.clone().add(new THREE.Vector3(0,1.6,0));
      const renderedHead=new THREE.Vector3((60-64)*scale,(80-150+136)*scale,0).applyMatrix4(mesh.matrixWorld);
      assert.ok(renderedHead.distanceTo(head)<1e-10,'figure height stays physical and vertical');
      const normal=new THREE.Vector3(0,0,1).transformDirection(mesh.matrixWorld);
      assert.ok(normal.distanceTo(new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)))<1e-10);
      assert.equal(mesh.geometry.parameters,geometry);assert.deepEqual(Array.from(mesh.geometry.attributes.uv.array),uv);
      assert.equal(mesh.material.depthTest,true);assert.equal(mesh.material.depthWrite,true);
    }
    adapter.dispose();
  }
});

test('actors of one identity share a texture until the final owner retires',async()=>{
  setup();const f=rendererFixture();
  const first=createStreetCharacterSprite(f.T,actor(),f.host(),f.queueAsset,f.camera);
  const second=createStreetCharacterSprite(f.T,actor(),f.host(),f.queueAsset,f.camera);
  const tasks=f.queue.map(job=>job.task());await Promise.resolve();assert.equal(f.requests.length,1);
  const texture=f.finish();await Promise.all(tasks);
  first.dispose();first.dispose();assert.equal(texture.disposals,0);assert.equal(second.inspect().loaded,true);
  second.dispose();assert.equal(texture.disposals,1);
});

test('mobile requests only its selected variant and late success cannot resurrect a retired mesh',async()=>{
  const prior=globalThis.innerWidth;globalThis.innerWidth=390;
  try{
    const n=setup(),f=rendererFixture(),host=f.host();
    const adapter=createStreetCharacterSprite(f.T,n,host,f.queueAsset,f.camera);
    const task=f.queue[0].task();await Promise.resolve();assert.match(f.requests[0].url,/-mobile.webp\?v=a{64}$/);assert.equal(f.requests.length,1);
    adapter.dispose();const texture=f.finish(0,512,640);assert.equal(await task,false);
    assert.equal(texture.disposals,1);assert.equal(host.children.length,1);assert.equal(adapter.inspect().loaded,false);
  }finally{if(prior===undefined)delete globalThis.innerWidth;else globalThis.innerWidth=prior}
});

test('failed or dimension-mismatched texture keeps the previous host and reports a real failure',async()=>{
  const prior=console.warn;console.warn=()=>{};
  try{
    for(const mode of ['network','dimension']){
      setup();const f=rendererFixture(),host=f.host(),adapter=createStreetCharacterSprite(f.T,actor(),host,f.queueAsset,f.camera);
      const task=f.queue[0].task();await Promise.resolve();
      if(mode==='network')f.requests[0].fail(new Error('offline'));else f.finish(0,1,1);
      assert.equal(await task,false);assert.equal(adapter.inspect().failed,true);assert.equal(host.children.length,1);assert.equal(host.children[0].visible,true);
      adapter.dispose();if(mode==='dimension')assert.equal(f.textures[0].disposals,1);
    }
  }finally{console.warn=prior}
});

test('disposing before queued admission makes no texture request',async()=>{
  setup();const f=rendererFixture(),adapter=createStreetCharacterSprite(f.T,actor(),f.host(),f.queueAsset,f.camera);
  adapter.dispose();assert.equal(f.queue[0].owner.retired,true);assert.equal(await f.queue[0].task(),false);assert.equal(f.requests.length,0);
});

test('manifest is lazy and deduplicated across admitted actors',async()=>{
  const priorFetch=globalThis.fetch,priorCast=globalThis.GermanySimulatorQuizCharacters;
  let calls=0;
  globalThis.GermanySimulatorQuizCharacters={characters:[{id:'test-person',voiceId:'quiz-test-person'}]};
  globalThis.fetch=async url=>{calls++;assert.equal(url,'./assets/characters/street/manifest.json?v=20261023-brigitte-adult');return {ok:true,text:async()=>JSON.stringify(manifest())}};
  try{
    registerStreetCharacterManifest({schemaVersion:1,characters:{}});
    const f=rendererFixture(),first=createStreetCharacterSprite(f.T,actor(),f.host(),f.queueAsset,f.camera),second=createStreetCharacterSprite(f.T,actor(),f.host(),f.queueAsset,f.camera);
    assert.equal(calls,0,'constructing distant actors must not fetch');
    const tasks=f.queue.map(job=>job.task());
    for(let i=0;i<8;i++)await Promise.resolve();
    assert.equal(calls,1);assert.equal(f.requests.length,1);
    f.finish();await Promise.all(tasks);first.dispose();second.dispose();
  }finally{
    globalThis.fetch=priorFetch;
    if(priorCast===undefined)delete globalThis.GermanySimulatorQuizCharacters;else globalThis.GermanySimulatorQuizCharacters=priorCast;
  }
});

test('oversized and HTTP-failed manifests cannot allocate textures or replace the visible host',async()=>{
  const priorFetch=globalThis.fetch,priorCast=globalThis.GermanySimulatorQuizCharacters,priorWarn=console.warn;
  globalThis.GermanySimulatorQuizCharacters={characters:[{id:'test-person',voiceId:'quiz-test-person'}]};console.warn=()=>{};
  try{
    for(const mode of ['oversized','http']){
      const module=await import(`../street-character-sprites.js?manifest-failure=${mode}`);
      globalThis.fetch=async()=>({ok:mode!=='http',status:503,text:async()=>' '.repeat(262145)});
      const f=rendererFixture(),host=f.host(),adapter=module.createStreetCharacterSprite(f.T,actor(),host,f.queueAsset,f.camera);
      assert.equal(await f.queue[0].task(),false);assert.equal(adapter.inspect().failed,true);assert.equal(f.requests.length,0);assert.equal(host.children[0].visible,true);
      assert.match(adapter.inspect().error,mode==='http'?/503/:/256 KiB/);adapter.dispose();
    }
  }finally{
    globalThis.fetch=priorFetch;console.warn=priorWarn;
    if(priorCast===undefined)delete globalThis.GermanySimulatorQuizCharacters;else globalThis.GermanySimulatorQuizCharacters=priorCast;
  }
});

test('standing admission stays small until explicit motion preparation, using immutable image URLs',async()=>{
  const n=standingSetup(),f=rendererFixture(),host=f.host(),body=host.children[0];
  const adapter=createStreetCharacterSprite(f.T,n,host,f.queueAsset,f.camera);
  const initial=f.queue[0].task();await Promise.resolve();
  assert.equal(f.requests[0].url,'./assets/characters/street/test-standing.webp?v='+'b'.repeat(64));
  const standing=f.finish(0,128,160);await initial;
  const mesh=host.children[1];assert.equal(mesh.material.map,standing);assert.equal(body.visible,false);
  assert.deepEqual(Array.from(mesh.geometry.attributes.uv.array),[0,1,1,1,0,0,1,0]);
  for(let i=0;i<12;i++){n.x++;advanceStreetAnimation(n,1,.1);adapter.sync()}
  assert.equal(f.requests.length,1);assert.equal(f.queue.length,1);assert.equal(adapter.inspect().stage,'standing');
  const job=adapter.prepareMotion();assert.equal(adapter.prepareMotion(),job);assert.equal(f.queue.length,2);
  assert.equal(job.owner,f.queue[0].owner);assert.equal(job.radius,2);
  host.position.set(12,0,34);assert.deepEqual(job.position(),{x:12,z:34});
  assert.equal(f.requests.length,1,'preparation goes through the admission queue');
  const motion=job.task();assert.equal(f.requests[1].url,'./assets/characters/street/test.webp?v='+'d'.repeat(64));
  const full=f.finish(1);assert.equal(await motion,true);
  assert.equal(mesh.material.map,full);assert.equal(standing.disposals,1);assert.equal(adapter.inspect().motionLoaded,true);
  adapter.prepareMotion();assert.equal(f.queue.length,2);adapter.dispose();assert.equal(full.disposals,1);
});

test('two consumers share standing and full textures, releasing standing only after both swap',async()=>{
  standingSetup();const f=rendererFixture(),hosts=[f.host(),f.host()];
  const adapters=hosts.map(host=>createStreetCharacterSprite(f.T,actor(),host,f.queueAsset,f.camera));
  const initial=f.queue.map(job=>job.task());await Promise.resolve();assert.equal(f.requests.length,1);
  const standing=f.finish(0,128,160);await Promise.all(initial);
  const first=adapters[0].prepareMotion().task();const full=f.finish(1);await first;
  assert.equal(standing.disposals,0);assert.equal(hosts[1].children[1].material.map,standing);
  const second=adapters[1].prepareMotion().task();await second;
  assert.equal(f.requests.length,2);assert.equal(standing.disposals,1);
  assert.equal(hosts[0].children[1].material.map,hosts[1].children[1].material.map);
  adapters[0].dispose();assert.equal(full.disposals,0);adapters[1].dispose();assert.equal(full.disposals,1);
});

test('motion handover samples the current walking and reaction phase without replacing geometry or pivot',async()=>{
  for(const state of ['walk','reaction']){
    const n=standingSetup(),f=rendererFixture(),host=f.host();
    const adapter=createStreetCharacterSprite(f.T,n,host,f.queueAsset,f.camera);
    const initial=f.queue[0].task();await Promise.resolve();f.finish(0,128,160);await initial;
    const mesh=host.children[1],geometry=mesh.geometry,material=mesh.material;
    advanceStreetAnimation(n,0,0);
    const pending=adapter.prepareMotion().task();
    let pose;
    if(state==='walk'){n.x=13;pose=advanceStreetAnimation(n,13,.1,{dx:13,dy:0})}
    else{requestStreetReaction(n,'success',{token:'answer'});advanceStreetAnimation(n,0,0);pose=advanceStreetAnimation(n,0,.41)}
    adapter.sync();const pivot=mesh.position.clone(),size={...geometry.parameters};
    f.finish(1);await pending;
    assert.equal(host.children[1],mesh);assert.equal(mesh.geometry,geometry);assert.equal(mesh.material,material);
    assert.deepEqual(geometry.parameters,size);assert.deepEqual(mesh.position,pivot);assert.equal(adapter.inspect().pose,pose);
    assert.ok(Math.abs(geometry.attributes.uv.getX(0)-(pose.slot%8)/8)<1e-8);
    assert.equal(pose.frame,2);
    if(state==='walk'){n.x++;assert.equal(advanceStreetAnimation(n,1,.01,{dx:1,dy:0}).frame,2)}
    else assert.equal(advanceStreetAnimation(n,0,.01).frame,2);
    adapter.dispose();
  }
});

test('early motion preparation is held behind standing readiness and remains idempotent',async()=>{
  const n=standingSetup(),f=rendererFixture(),adapter=createStreetCharacterSprite(f.T,n,f.host(),f.queueAsset,f.camera);
  const initialJob=adapter.prepareMotion();assert.equal(adapter.prepareMotion(),initialJob);assert.equal(f.queue.length,1);
  const initial=f.queue[0].task();await Promise.resolve();assert.equal(f.requests.length,1);
  assert.equal(f.queue.length,1);f.finish(0,128,160);await initial;
  assert.equal(f.queue.length,2);assert.equal(f.requests.length,1);
  const pending=f.queue[1].task();f.finish(1);await pending;adapter.dispose();
});

test('mobile standing is shared but motion selects only the captured mobile variant',async()=>{
  const prior=globalThis.innerWidth;globalThis.innerWidth=390;
  try{
    const n=standingSetup(),f=rendererFixture(),adapter=createStreetCharacterSprite(f.T,n,f.host(),f.queueAsset,f.camera);
    const initial=f.queue[0].task();await Promise.resolve();f.finish(0,128,160);await initial;
    globalThis.innerWidth=1200;
    const pending=adapter.prepareMotion().task();assert.equal(f.requests[1].url,'./assets/characters/street/test-mobile.webp?v='+'a'.repeat(64));
    f.finish(1,512,640);await pending;assert.equal(f.requests.length,2);assert.equal(adapter.inspect().variant,'mobile');adapter.dispose();
  }finally{if(prior===undefined)delete globalThis.innerWidth;else globalThis.innerWidth=prior}
});

test('one renderer shares standing across variants while each actor admits only its selected full atlas',async()=>{
  const prior=globalThis.innerWidth;
  try{
    standingSetup();const f=rendererFixture(),hosts=[f.host(),f.host()];
    globalThis.innerWidth=1200;const desktop=createStreetCharacterSprite(f.T,actor(),hosts[0],f.queueAsset,f.camera);
    globalThis.innerWidth=390;const mobile=createStreetCharacterSprite(f.T,actor(),hosts[1],f.queueAsset,f.camera);
    const initial=f.queue.map(job=>job.task());await Promise.resolve();assert.equal(f.requests.length,1);
    const standing=f.finish(0,128,160);await Promise.all(initial);
    const tasks=[desktop.prepareMotion().task(),mobile.prepareMotion().task()];
    assert.equal(f.requests.length,3);assert.match(f.requests[1].url,/\/test\.webp\?v=d{64}$/);assert.match(f.requests[2].url,/\/test-mobile\.webp\?v=a{64}$/);
    const desktopTexture=f.finish(1),mobileTexture=f.finish(2,512,640);await Promise.all(tasks);
    assert.equal(hosts[0].children[1].material.map,desktopTexture);assert.equal(hosts[1].children[1].material.map,mobileTexture);
    assert.equal(standing.disposals,1);desktop.dispose();assert.equal(desktopTexture.disposals,1);assert.equal(mobileTexture.disposals,0);mobile.dispose();assert.equal(mobileTexture.disposals,1);
  }finally{if(prior===undefined)delete globalThis.innerWidth;else globalThis.innerWidth=prior}
});

test('failed motion keeps standing paint visible and reports failure without automatic retries',async()=>{
  const prior=console.warn;console.warn=()=>{};
  try{
    for(const mode of ['network','dimension']){
      const n=standingSetup(),f=rendererFixture(),host=f.host(),adapter=createStreetCharacterSprite(f.T,n,host,f.queueAsset,f.camera);
      const initial=f.queue[0].task();await Promise.resolve();const standing=f.finish(0,128,160);await initial;
      const mesh=host.children[1],pending=adapter.prepareMotion().task();
      if(mode==='network')f.requests[1].fail(new Error('motion offline'));else f.finish(1,1,1);
      assert.equal(await pending,false);adapter.sync();adapter.restore();
      assert.equal(mesh.material.map,standing);assert.equal(mesh.visible,true);assert.equal(host.children[0].visible,false);
      assert.equal(adapter.inspect().failed,true);assert.equal(adapter.inspect().motionFailed,true);assert.equal(adapter.inspect().motionSettled,true);
      assert.match(adapter.inspect().motionError,mode==='network'?/offline/:/dimensions/);
      assert.equal(adapter.inspect().stage,'standing');assert.equal(adapter.inspect().textureReferences,1);
      adapter.prepareMotion();adapter.sync();assert.equal(f.queue.length,2);assert.equal(f.requests.length,2);
      assert.equal(standing.disposals,0);adapter.dispose();assert.equal(standing.disposals,1);
      if(mode==='dimension')assert.equal(f.textures[1].disposals,1);
    }
  }finally{console.warn=prior}
});

test('standing load failure settles visibly and cannot launch motion in a retry loop',async()=>{
  const prior=console.warn;console.warn=()=>{};
  try{
    const n=standingSetup(),f=rendererFixture(),host=f.host(),adapter=createStreetCharacterSprite(f.T,n,host,f.queueAsset,f.camera);
    adapter.prepareMotion();const initial=f.queue[0].task();await Promise.resolve();const broken=f.finish(0,1,1);
    assert.equal(await initial,false);assert.equal(adapter.inspect().settled,true);assert.equal(adapter.inspect().failed,true);
    assert.equal(adapter.inspect().textureReferences,0);assert.equal(host.children.length,1);assert.equal(host.children[0].visible,true);
    adapter.prepareMotion();assert.equal(f.queue.length,1);assert.equal(broken.disposals,1);adapter.dispose();
  }finally{console.warn=prior}
});

test('retiring while standing is pending or motion is pending releases every texture and cannot reinstall',async()=>{
  for(const phase of ['standing','motion-queued','motion-loading']){
    const n=standingSetup(),f=rendererFixture(),host=f.host(),adapter=createStreetCharacterSprite(f.T,n,host,f.queueAsset,f.camera);
    const initial=f.queue[0].task();await Promise.resolve();
    if(phase==='standing'){
      adapter.prepareMotion();adapter.dispose();const late=f.finish(0,128,160);assert.equal(await initial,false);assert.equal(late.disposals,1);assert.equal(f.queue.length,1);
    }else{
      const standing=f.finish(0,128,160);await initial;
      const job=adapter.prepareMotion();
      if(phase==='motion-queued'){adapter.dispose();assert.equal(await job.task(),false);assert.equal(f.requests.length,1)}
      else{const pending=job.task();adapter.dispose();const late=f.finish(1);assert.equal(await pending,false);assert.equal(late.disposals,1)}
      assert.equal(standing.disposals,1);
    }
    assert.equal(adapter.prepareMotion(),null);assert.equal(adapter.inspect().textureReferences,0);
    assert.equal(adapter.inspect().loaded,false);assert.equal(host.children.length,1);assert.equal(host.children[0].visible,true);
    assert(f.textures.every(texture=>texture.disposals===1));
  }
});

test('a retired consumer cannot install a shared late motion result owned by another actor',async()=>{
  standingSetup();const f=rendererFixture(),hosts=[f.host(),f.host()];
  const adapters=hosts.map(host=>createStreetCharacterSprite(f.T,actor(),host,f.queueAsset,f.camera));
  const initial=f.queue.map(job=>job.task());await Promise.resolve();const standing=f.finish(0,128,160);await Promise.all(initial);
  const tasks=adapters.map(adapter=>adapter.prepareMotion().task());assert.equal(f.requests.length,2);
  adapters[0].dispose();const full=f.finish(1);assert.deepEqual(await Promise.all(tasks),[false,true]);
  assert.equal(hosts[0].children.length,1);assert.equal(hosts[1].children[1].material.map,full);
  assert.equal(standing.disposals,1);assert.equal(full.disposals,0);adapters[1].dispose();assert.equal(full.disposals,1);
});

test('standing metadata rejects unsafe paths, malformed hashes and non-original cell dimensions',()=>{
  for(const change of [
    person=>person.standing.file='./assets/characters/street/../escape.webp',
    person=>person.standing.sha256='not-a-sha',
    person=>person.standing.sha256=['b'.repeat(64)],
    person=>person.variants.desktop.sha256=undefined,
    person=>person.variants.mobile.sha256='a'.repeat(65),
    person=>person.standing.width=64,
    person=>person.standing.height=320,
    person=>person.standing.width=NaN
  ]){
    const candidate=manifest(),person=candidate.characters['quiz-test-person'];
    person.standing={file:'./assets/characters/street/test-standing.webp',width:128,height:160,sha256:'b'.repeat(64)};
    change(person);assert.throws(()=>registerStreetCharacterManifest(candidate));
  }
});

test('legacy manifests need no second admission when motion is explicitly prepared',async()=>{
  const n=setup(),f=rendererFixture(),adapter=createStreetCharacterSprite(f.T,n,f.host(),f.queueAsset,f.camera);
  adapter.prepareMotion();const initial=f.queue[0].task();await Promise.resolve();const texture=f.finish();await initial;
  adapter.prepareMotion();assert.equal(f.requests.length,1);assert.equal(f.queue.length,1);assert.equal(adapter.inspect().motionLoaded,true);
  adapter.dispose();assert.equal(texture.disposals,1);
});

test('public cold startup loads actual city metadata once before either factory, without admitting paint',async()=>{
  const priorFetch=globalThis.fetch,priorCast=globalThis.GermanySimulatorQuizCharacters,priorWisdom=globalThis.StreetWisdom;
  const f=canvasFixture(),three=rendererFixture();
  try{
    delete globalThis.GermanySimulatorQuizCharacters;delete globalThis.StreetWisdom;
    const cold=await import('../street-character-sprites.js?public-cold-city');
    const body=await readFile(new URL('./fixtures/street-legacy-candidate-manifest.json',import.meta.url),'utf8');
    let requests=0,respond;
    globalThis.fetch=(url,options)=>{requests++;assert.equal(url,'./assets/characters/street/manifest.json?v=20261023-brigitte-adult');assert(options.signal);return new Promise(resolve=>respond=resolve)};
    const cityActor={id:'crowd-0',quizCharacterId:'hartmut-keller',voiceId:'quiz-hartmut-keller',x:885,y:1060};
    assert.equal(cold.resolveStreetCharacter(cityActor),null,'fresh ordinary city identity has no global alias bootstrap');
    const gate=cold.loadStreetCharacterManifest();assert.equal(cold.loadStreetCharacterManifest(),gate);assert.equal(requests,1);
    assert.equal(f.images.length,0);assert.equal(three.requests.length,0);
    respond({ok:true,text:async()=>body});const loaded=await gate;
    assert.equal(loaded['quiz-hartmut-keller'].id,'hartmut-keller');
    assert.equal(cold.resolveStreetCharacter(cityActor),'quiz-hartmut-keller');
    const canvas=cold.createStreetCharacterCanvasSprite(cityActor,f.queueAsset);
    const paint=cold.createStreetCharacterSprite(three.T,{...cityActor},three.host(),three.queueAsset,three.camera);
    assert(canvas);assert(paint);assert.equal(requests,1);assert.equal(f.images.length,0);assert.equal(three.requests.length,0);
    assert.equal(cold.createStreetCharacterCanvasSprite({id:'unknown'},f.queueAsset),null);
    assert.equal(cold.createStreetCharacterSprite(three.T,{id:'unknown'},three.host(),three.queueAsset,three.camera),null);
    const admitted=f.queue[0].task();await Promise.resolve();
    assert.equal(f.requests.length,1);assert.match(f.requests[0].url,/hartmut-keller-standing\.webp\?v=[a-f0-9]{64}$/);
    f.finish();assert.equal(await admitted,true);
    const threeAdmitted=three.queue[0].task();await Promise.resolve();assert.equal(three.requests.length,1);
    assert.match(three.requests[0].url,/hartmut-keller-standing\.webp\?v=[a-f0-9]{64}$/);
    three.finish(0,128,160);assert.equal(await threeAdmitted,true);assert.equal(paint.inspect().loaded,true);
    canvas.dispose();paint.dispose();
  }finally{
    globalThis.fetch=priorFetch;f.restore();
    if(priorCast===undefined)delete globalThis.GermanySimulatorQuizCharacters;else globalThis.GermanySimulatorQuizCharacters=priorCast;
    if(priorWisdom===undefined)delete globalThis.StreetWisdom;else globalThis.StreetWisdom=priorWisdom;
  }
});

test('public manifest failures are coalesced, bounded and leave cold identities unknown',async()=>{
  const priorFetch=globalThis.fetch;
  try{
    for(const mode of ['http','oversized','json','network']){
      const cold=await import(`../street-character-sprites.js?public-failure=${mode}`);let calls=0;
      globalThis.fetch=async()=>{calls++;if(mode==='network')throw new Error('offline');return {ok:mode!=='http',status:503,text:async()=>mode==='oversized'?' '.repeat(262145):'{bad'}};
      const promise=cold.loadStreetCharacterManifest();assert.equal(cold.loadStreetCharacterManifest(),promise);
      await assert.rejects(promise,mode==='http'?/503/:mode==='oversized'?/256 KiB/:mode==='network'?/offline/:/JSON/);
      assert.equal(cold.loadStreetCharacterManifest(),promise,'failure stays observable without automatic retry');
      await assert.rejects(cold.loadStreetCharacterManifest());assert.equal(calls,1);
      assert.equal(cold.resolveStreetCharacter({id:'unregistered'}),null);
      assert.equal(cold.createStreetCharacterCanvasSprite({id:'unregistered'},()=>assert.fail('unknown must not queue')),null);
    }
  }finally{globalThis.fetch=priorFetch}
});

test('ordinary city-key cold bootstrap needs only fetched test metadata, with no quiz/adviser catalog or pre-registration',async()=>{
  const priorFetch=globalThis.fetch,catalogs=new Map(['GermanySimulatorQuizCharacters','StreetWisdom','window'].map(key=>[key,globalThis[key]]));
  const f=canvasFixture(),three=rendererFixture();
  try{
    for(const key of catalogs.keys())delete globalThis[key];
    const cold=await import('../street-character-sprites.js?ordinary-city-key-cold');
    const metadata=manifest(),person=metadata.characters['quiz-test-person'];
    metadata.characters={'stadt-klaus-dieter-klein':{...person,id:'klaus-dieter-klein',actorId:'stadt-klaus-dieter-klein',aliases:[],name:'Test-only city identity metadata'}};
    metadata.fixturePurpose='Synthetic parser/registration fixture only; test.webp supplies no actual Klein artwork or live cast binding.';
    let requests=0;
    globalThis.fetch=async url=>{requests++;assert.equal(url,'./assets/characters/street/manifest.json?v=20261023-brigitte-adult');return {ok:true,text:async()=>JSON.stringify(metadata)}};
    const cityActor={id:'stadt-klaus-dieter-klein',voiceId:'stadt-klaus-dieter-klein',x:100,y:200};
    assert.equal(cold.resolveStreetCharacter(cityActor),null);
    assert.equal(cold.createStreetCharacterCanvasSprite(cityActor,f.queueAsset),null);
    assert.equal(cold.createStreetCharacterSprite(three.T,cityActor,three.host(),three.queueAsset,three.camera),null);
    assert.equal(requests,0);assert.equal(f.queue.length,0);assert.equal(three.queue.length,0);
    const gate=cold.loadStreetCharacterManifest();assert.equal(cold.loadStreetCharacterManifest(),gate);await gate;assert.equal(requests,1);
    assert.equal(cold.resolveStreetCharacter({id:cityActor.id}),'stadt-klaus-dieter-klein');
    assert.equal(cold.resolveStreetCharacter({voiceId:cityActor.voiceId}),'stadt-klaus-dieter-klein');
    const canvas=cold.createStreetCharacterCanvasSprite(cityActor,f.queueAsset);
    const paint=cold.createStreetCharacterSprite(three.T,cityActor,three.host(),three.queueAsset,three.camera);
    assert(canvas);assert(paint);assert.equal(f.queue.length,1);assert.equal(three.queue.length,1);
    assert.equal(f.requests.length,0);assert.equal(three.requests.length,0);assert.equal(requests,1);
    const unknown={id:'stadt-unregistered-person',voiceId:'stadt-unregistered-person'};
    assert.equal(cold.resolveStreetCharacter(unknown),null);
    assert.equal(cold.createStreetCharacterCanvasSprite(unknown,f.queueAsset),null);
    assert.equal(cold.createStreetCharacterSprite(three.T,unknown,three.host(),three.queueAsset,three.camera),null);
    assert.equal(f.queue.length,1);assert.equal(three.queue.length,1);canvas.dispose();paint.dispose();
  }finally{
    globalThis.fetch=priorFetch;f.restore();
    for(const [key,value] of catalogs)if(value===undefined)delete globalThis[key];else globalThis[key]=value;
  }
});

for(const [oldKind,newKind] of [['Three','Canvas'],['Canvas','Three'],['Canvas','Canvas']])test(`${oldKind} to ${newKind} visual retirement preserves the same actor's newer reaction and owned speech`,async()=>{
  const candidate=manifest();candidate.characters['quiz-test-person'].speech={clips:{talk:{offset:52,count:4}}};registerStreetCharacterManifest(candidate);
  const n=actor(),f=canvasFixture(),three=rendererFixture(),adapters=[];
  async function loadedAdapter(kind){
    const fixture=kind==='Three'?three:f,before=fixture.requests.length;
    const adapter=kind==='Three'?createStreetCharacterSprite(three.T,n,three.host(),three.queueAsset,three.camera):createStreetCharacterCanvasSprite(n,f.queueAsset);
    adapters.push(adapter);const pending=fixture.queue.at(-1).task();await Promise.resolve();
    if(fixture.requests.length>before)fixture.finish(before,1024,1280);
    assert.equal(await pending,true);return adapter;
  }
  try{
    const old=await loadedAdapter(oldKind);
    requestStreetReaction(n,'talk',{token:'old-attempt'});
    advanceStreetAnimation(n,0,0,{speaking:true,cueToken:'old-cue',mediaTime:.3,mouthOpen:1});
    const current=await loadedAdapter(newKind),speech={speaking:true,cueToken:'new-cue',mediaTime:.3,mouthOpen:1};
    assert.equal(requestStreetReaction(n,['talk','success'],{token:'new-attempt',preempt:true}),true);
    const pose=advanceStreetAnimation(n,0,0,speech);assert.equal(pose.cueToken,'new-cue');assert.equal(pose.mouthOpen,1);assert.equal(pose.holdPosition,true);
    old.dispose();old.dispose();assert.equal(current.inspect().pose,pose,'view teardown cannot clear simulation pose, reaction or speech cue');
    if(newKind==='Three')current.sync();else assert.equal(current.draw(f.ctx,60,150,136),true);
    assert.equal(current.inspect().pose,pose);
    const continued=advanceStreetAnimation(n,0,.1,speech);assert.equal(continued.clip,'talk');assert.equal(continued.slot,55);assert.equal(continued.holdPosition,true);assert.equal(continued.cueToken,'new-cue');assert.equal(continued.mouthOpen,1);
    assert.equal(cancelStreetReaction(n,{token:'old-attempt'}),false);assert.equal(current.inspect().pose,continued);
    assert.equal(cancelStreetReaction(n,{token:'new-attempt'}),true,'simulation still explicitly owns attempt cancellation');
    const cancelled=advanceStreetAnimation(n,0,.1,speech);assert.equal(cancelled.holdPosition,false);assert.equal(cancelled.speaking,false);assert.equal(cancelled.mouthOpen,0);assert.equal(cancelled.clip,'idle');
  }finally{for(const adapter of adapters)adapter.dispose();f.restore()}
});

test('same-host Three handover preserves the original fallback until the final paint owner retires',async()=>{
  for(const retirementOrder of [[0,1],[1,0]]){
    const n=setup(),f=rendererFixture(),host=f.host(),body=host.children[0];
    const initiallyHidden=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());initiallyHidden.visible=false;host.add(initiallyHidden);
    const first=createStreetCharacterSprite(f.T,n,host,f.queueAsset,f.camera),a=f.queue[0].task();await Promise.resolve();f.finish();await a;
    const second=createStreetCharacterSprite(f.T,n,host,f.queueAsset,f.camera);await f.queue[1].task();
    assert.equal(f.requests.length,1);assert.equal(body.visible,false);assert.equal(initiallyHidden.visible,false);
    const paint=host.children.filter(mesh=>mesh.userData.streetPaint);assert.equal(paint.length,2);assert.equal(paint[0].visible,false);assert.equal(paint[1].visible,true);
    const owners=[first,second];owners[retirementOrder[0]].dispose();
    assert.equal(body.visible,false,'retiring one view must not expose the generic body behind its replacement');
    owners[retirementOrder[1]].sync();owners[retirementOrder[1]].restore();assert.equal(body.visible,false);
    owners[retirementOrder[1]].dispose();assert.equal(body.visible,true,'final retirement restores the pre-handover visibility');
    assert.equal(initiallyHidden.visible,false);assert.equal(f.textures[0].disposals,1);
  }
});

test('Canvas waits for queue and decode, draws the exact standing cell/pivot, and draw has no admission or clock effects',async()=>{
  const n=standingSetup(),f=canvasFixture();let finishDecode;
  try{
    const adapter=createStreetCharacterCanvasSprite(n,f.queueAsset);
    assert.equal(adapter.draw(f.ctx,500,700,272),false);assert.equal(f.images.length,0);assert.equal(f.queue.length,1);
    const initial=f.queue[0].task();await Promise.resolve();assert.equal(f.images.length,1);
    assert.equal(f.requests[0].url,'./assets/characters/street/test-standing.webp?v='+'b'.repeat(64));
    f.images[0].decodePromise=new Promise(resolve=>finishDecode=resolve);
    const standing=f.finish();assert.equal(adapter.inspect().loaded,false);assert.equal(adapter.draw(f.ctx,500,700,272),false);
    finishDecode();assert.equal(await initial,true);assert.equal(standing.decoding,'async');assert.equal(standing.decodes,1);
    const pose=advanceStreetAnimation(n,7,.1,{dx:7,dy:0});
    for(let i=0;i<20;i++)assert.equal(adapter.draw(f.ctx,500,700,272),true);
    assert.deepEqual(f.draws[0],[standing,0,0,128,160,380,400,256,320]);
    assert.equal(adapter.inspect().pose,pose);assert.equal(f.images.length,1);assert.equal(f.queue.length,1);assert.equal(f.requests.length,1);
    n.x=12;n.y=34;assert.deepEqual(f.queue[0].position(),{x:12,z:34});assert.equal(f.queue[0].radius,2);
    for(const args of [[NaN,0,136],[0,Infinity,136],[0,0,0],[0,0,-1],[0,0,Infinity]])assert.equal(adapter.draw(f.ctx,...args),false);
    assert.equal(f.draws.length,20);adapter.dispose();assert.equal(standing.clears,1);assert.equal(adapter.inspect().imageReferences,0);
    assert.equal(adapter.draw(f.ctx,0,0,136),false);
  }finally{f.restore()}
});

test('Canvas motion admission selects captured mobile atlas and samples current phase with fixed geometry',async()=>{
  const previousWidth=globalThis.innerWidth;globalThis.innerWidth=390;
  const n=standingSetup(),f=canvasFixture();
  try{
    const adapter=createStreetCharacterCanvasSprite(n,f.queueAsset);
    const initial=f.queue[0].task();await Promise.resolve();const standing=f.finish();await initial;
    const job=adapter.prepareMotion();assert.equal(adapter.prepareMotion(),job);assert.equal(f.queue.length,2);assert.equal(f.requests.length,1);
    assert.equal(job.owner,f.queue[0].owner);globalThis.innerWidth=1200;
    const pending=job.task();assert.match(f.requests[1].url,/-mobile\.webp\?v=a{64}$/);
    const pose=advanceStreetAnimation(n,13,.1,{dx:13,dy:0});adapter.draw(f.ctx,500,700,272);
    const mobile=f.finish(1,512,640);assert.equal(await pending,true);assert.equal(standing.clears,1);
    adapter.draw(f.ctx,500,700,272);
    assert.deepEqual(f.draws.at(-1),[mobile,(pose.slot%8)*64,Math.floor(pose.slot/8)*80,64,80,380,400,256,320]);
    assert.equal(adapter.inspect().pose,pose);assert.equal(advanceStreetAnimation(n,1,.01,{dx:1,dy:0}).frame,2);
    adapter.prepareMotion();assert.equal(f.requests.length,2);assert.equal(f.queue.length,2);
    adapter.dispose();assert.equal(mobile.clears,1);
  }finally{f.restore();if(previousWidth===undefined)delete globalThis.innerWidth;else globalThis.innerWidth=previousWidth}
});

test('Canvas consumers share decoded standing/full images, releasing only after the final consumer swaps or retires',async()=>{
  standingSetup();const f=canvasFixture();
  try{
    const adapters=[actor(),actor()].map(n=>createStreetCharacterCanvasSprite(n,f.queueAsset));
    const initial=f.queue.map(job=>job.task());await Promise.resolve();assert.equal(f.requests.length,1);
    const standing=f.finish();await Promise.all(initial);assert.equal(standing.decodes,1);
    const first=adapters[0].prepareMotion().task();const full=f.finish(1,1024,1280);await first;
    assert.equal(standing.clears,0);adapters[1].draw(f.ctx,0,0,136);assert.equal(f.draws.at(-1)[0],standing);
    await adapters[1].prepareMotion().task();assert.equal(f.requests.length,2);assert.equal(full.decodes,1);assert.equal(standing.clears,1);
    for(const a of adapters){a.draw(f.ctx,0,0,136);assert.equal(f.draws.at(-1)[0],full)}
    adapters[0].dispose();adapters[0].dispose();assert.equal(full.clears,0);adapters[1].dispose();assert.equal(full.clears,1);
    const fresh=createStreetCharacterCanvasSprite(actor(),f.queueAsset),again=f.queue.at(-1).task();await Promise.resolve();
    assert.equal(f.requests.length,3,'zero-reference images are evicted, not kept resident');f.finish(2);await again;fresh.dispose();
  }finally{f.restore()}
});

test('Canvas shares standing across desktop/mobile but loads one selected atlas per consumer',async()=>{
  const previousWidth=globalThis.innerWidth;standingSetup();const f=canvasFixture();
  try{
    globalThis.innerWidth=1200;const desktop=createStreetCharacterCanvasSprite(actor(),f.queueAsset);
    globalThis.innerWidth=390;const mobile=createStreetCharacterCanvasSprite(actor(),f.queueAsset);
    const initial=f.queue.map(job=>job.task());await Promise.resolve();const standing=f.finish();await Promise.all(initial);
    const pending=[desktop.prepareMotion().task(),mobile.prepareMotion().task()];assert.equal(f.requests.length,3);
    assert.match(f.requests[1].url,/\/test\.webp\?v=d{64}$/);assert.match(f.requests[2].url,/-mobile\.webp\?v=a{64}$/);
    const full=f.finish(1,1024,1280),small=f.finish(2,512,640);await Promise.all(pending);assert.equal(standing.clears,1);
    desktop.dispose();assert.equal(full.clears,1);assert.equal(small.clears,0);mobile.dispose();assert.equal(small.clears,1);
  }finally{f.restore();if(previousWidth===undefined)delete globalThis.innerWidth;else globalThis.innerWidth=previousWidth}
});

test('Canvas early motion demand waits for standing and preserves reaction phase at handover',async()=>{
  const n=standingSetup(),f=canvasFixture();
  try{
    const adapter=createStreetCharacterCanvasSprite(n,f.queueAsset),first=adapter.prepareMotion();assert.equal(adapter.prepareMotion(),first);assert.equal(f.queue.length,1);
    const initial=first.task();await Promise.resolve();f.finish();await initial;assert.equal(f.queue.length,2);assert.equal(f.requests.length,1);
    const pending=f.queue[1].task();requestStreetReaction(n,'success',{token:'answer'});advanceStreetAnimation(n,0,0);const pose=advanceStreetAnimation(n,0,.41);
    const full=f.finish(1,1024,1280);await pending;adapter.draw(f.ctx,60,150,136);
    assert.equal(adapter.inspect().pose,pose);assert.equal(pose.frame,2);
    assert.deepEqual(f.draws.at(-1),[full,(pose.slot%8)*128,Math.floor(pose.slot/8)*160,128,160,0,0,128,160]);
    assert.equal(advanceStreetAnimation(n,0,.01).frame,2);adapter.dispose();
  }finally{f.restore()}
});

test('Canvas motion network, decode and size failures retain standing and never create retry jobs',async()=>{
  const previousWarn=console.warn;console.warn=()=>{};
  try{
    for(const mode of ['network','decode','dimensions']){
      const n=standingSetup(),f=canvasFixture();
      try{
        const adapter=createStreetCharacterCanvasSprite(n,f.queueAsset),initial=f.queue[0].task();await Promise.resolve();const standing=f.finish();await initial;
        const pending=adapter.prepareMotion().task();
        if(mode==='network')f.requests[1].fail();
        else{if(mode==='decode')f.requests[1].image.decodePromise=Promise.reject(new Error('decode failed'));f.finish(1,mode==='dimensions'?1:1024,1280)}
        assert.equal(await pending,false);assert.equal(adapter.inspect().failed,true);assert.equal(adapter.inspect().motionFailed,true);assert.equal(adapter.inspect().motionSettled,true);
        adapter.draw(f.ctx,0,0,136);assert.equal(f.draws.at(-1)[0],standing);assert.equal(standing.clears,0);assert.equal(f.images[1].clears,1);assert.equal(adapter.inspect().imageReferences,1);
        adapter.prepareMotion();adapter.draw(f.ctx,0,0,136);assert.equal(f.queue.length,2);assert.equal(f.requests.length,2);adapter.dispose();assert.equal(standing.clears,1);
      }finally{f.restore()}
    }
  }finally{console.warn=previousWarn}
});

test('Canvas initial failure exposes no drawable paint and cannot start a retry loop',async()=>{
  const previousWarn=console.warn;console.warn=()=>{};
  try{
    for(const mode of ['network','dimensions','decode']){
      const n=standingSetup(),f=canvasFixture();
      try{
        const adapter=createStreetCharacterCanvasSprite(n,f.queueAsset);adapter.prepareMotion();const initial=f.queue[0].task();await Promise.resolve();
        if(mode==='network')f.requests[0].fail();
        else{if(mode==='decode')f.images[0].decodePromise=Promise.reject(new Error('bad decode'));f.finish(0,mode==='dimensions'?1:128,160)}
        assert.equal(await initial,false);assert.equal(adapter.inspect().settled,true);assert.equal(adapter.inspect().failed,true);assert.equal(adapter.inspect().loaded,false);
        assert.equal(adapter.draw(f.ctx,0,0,136),false);assert.equal(adapter.inspect().imageReferences,0);assert.equal(f.images[0].clears,1);
        adapter.prepareMotion();assert.equal(f.queue.length,1);adapter.dispose();
      }finally{f.restore()}
    }
  }finally{console.warn=previousWarn}
});

test('Canvas disposal before admission, during load/decode, or before motion prevents every stale install',async()=>{
  for(const phase of ['queued','standing-load','standing-decode','motion-queued','motion-load','motion-decode']){
    const n=standingSetup(),f=canvasFixture();
    try{
      const adapter=createStreetCharacterCanvasSprite(n,f.queueAsset);
      if(phase==='queued'){adapter.dispose();assert.equal(await f.queue[0].task(),false);assert.equal(f.images.length,0)}
      else{
        let pending=f.queue[0].task();await Promise.resolve();let request=f.requests[0],finishDecode;
        if(phase.startsWith('motion')){
          f.finish();await pending;const job=adapter.prepareMotion();
          if(phase==='motion-queued'){
            adapter.dispose();assert.equal(await job.task(),false);assert.equal(f.requests.length,1);
            assert.equal(adapter.inspect().imageReferences,0);assert.equal(adapter.prepareMotion(),null);assert.equal(adapter.draw(f.ctx,0,0,136),false);
            assert(f.images.every(image=>image.clears===1));continue;
          }
          pending=job.task();request=f.requests[1];
        }
        if(phase.endsWith('decode')){
          request.image.decodePromise=new Promise(resolve=>finishDecode=resolve);
          f.finish(f.requests.indexOf(request),phase.startsWith('motion')?1024:128,phase.startsWith('motion')?1280:160);
        }
        adapter.dispose();assert.equal(await pending,false,'last-reference cancellation settles an admitted task even before a network callback');
        if(finishDecode)finishDecode();else request.ok();
        await Promise.resolve();assert.equal(adapter.inspect().loaded,false);assert.equal(adapter.inspect().failed,false);
      }
      assert.equal(adapter.prepareMotion(),null);assert.equal(adapter.inspect().imageReferences,0);assert.equal(adapter.draw(f.ctx,0,0,136),false);
      assert(f.images.every(image=>image.clears===1));assert.equal(f.draws.length,0);
    }finally{f.restore()}
  }
});

test('Canvas retiring one consumer of a pending shared image leaves the other consumer intact',async()=>{
  for(const phase of ['standing','motion']){
    standingSetup();const f=canvasFixture();
    try{
      const adapters=[actor(),actor()].map(n=>createStreetCharacterCanvasSprite(n,f.queueAsset));
      let tasks=f.queue.map(job=>job.task());await Promise.resolve();
      if(phase==='motion'){f.finish();await Promise.all(tasks);tasks=adapters.map(a=>a.prepareMotion().task())}
      const index=phase==='standing'?0:1;assert.equal(f.requests.length,index+1);
      adapters[0].dispose();assert.equal(f.images[index].clears,0);
      const image=f.finish(index,phase==='standing'?128:1024,phase==='standing'?160:1280);
      assert.deepEqual(await Promise.all(tasks),[false,true]);assert.equal(adapters[0].inspect().loaded,false);
      adapters[1].draw(f.ctx,0,0,136);assert.equal(f.draws.at(-1)[0],image);assert.equal(image.clears,0);adapters[1].dispose();assert.equal(image.clears,1);
    }finally{f.restore()}
  }
});

test('Canvas legacy full atlas needs only initial admission and samples idle without creating simulation state',async()=>{
  const n=setup(),f=canvasFixture();
  try{
    const adapter=createStreetCharacterCanvasSprite(n,f.queueAsset);adapter.prepareMotion();const initial=f.queue[0].task();await Promise.resolve();
    assert.match(f.requests[0].url,/\/test\.webp\?v=d{64}$/);const image=f.finish(0,1024,1280);await initial;
    for(let i=0;i<10;i++)adapter.draw(f.ctx,60,150,136);
    assert.deepEqual(f.draws[0],[image,0,320,128,160,0,0,128,160]);assert.equal(adapter.inspect().pose,null);
    adapter.prepareMotion();assert.equal(f.queue.length,1);assert.equal(f.images.length,1);assert.equal(adapter.inspect().motionLoaded,true);adapter.dispose();
  }finally{f.restore()}
});

test('rig metadata needs bounded identity JSON, standing, stride and one bounded variant pair without a flat atlas',()=>{
  const valid=rigManifest();assert.doesNotThrow(()=>registerStreetCharacterManifest(valid));
  for(const change of [p=>p.motionRig=null,p=>p.motionRig.file='./assets/characters/street/../escape.json',p=>p.motionRig.file='https://example.test/rig.json',p=>p.motionRig.sha256='bad',p=>delete p.standing,p=>delete p.strideDistance,p=>p.motionRig.variants.desktop.width=2049,p=>p.motionRig.variants.mobile.height=4096,p=>p.motionRig.variants.desktop.sha256=null,p=>delete p.motionRig.variants.mobile,p=>delete p.clips.right,p=>delete p.grid]){
    const candidate=rigManifest();change(candidate.characters['quiz-test-person']);assert.throws(()=>registerStreetCharacterManifest(candidate));
  }
});

test('rig simulation phase uses accepted distance while bounded stop and restart change only free-foot landing',()=>{
  const candidate=rigManifest();registerStreetCharacterManifest(candidate);const n=actor(),stride=candidate.characters['quiz-test-person'].strideDistance;
  const initial=advanceStreetAnimation(n,0,0);assert.deepEqual(initial.rigPose,{direction:'down',forwardWorld:[0,0,1],phase:0,mode:'hold',settle:1});
  const walk=advanceStreetAnimation(n,stride*.25,1,{dx:1,dy:0});assert.deepEqual(walk.rigPose,{direction:'right',forwardWorld:[1,0,0],phase:.25,mode:'walk',settle:0});
  const def=rigDefinition(),frame={rootWorld:[0,0,0],forwardWorld:[1,0,0],camera:{position:[0,5,10],right:[1,0,0],up:[0,1,0],forward:[0,0,-1]}};
  const before=sampleStreetCharacterRig(def,walk.rigPose,frame),feet=before.feetWorld.slice(),support=before.supportFoot;
  for(let i=1;i<=4;i++){
    const stopped=advanceStreetAnimation(n,0,.03);assert.equal(stopped.rigPose.direction,'right');assert.equal(stopped.rigPose.phase,.25);assert.equal(stopped.rigPose.settle,i*.25);assert.equal(stopped.moving,false);assert.equal(stopped.holdPosition,false);
    const packet=sampleStreetCharacterRig(def,stopped.rigPose,frame);
    for(let leg=0;leg<2;leg++)for(const axis of [0,2])assert.equal(packet.feetWorld[leg*3+axis],feet[leg*3+axis]);
    for(let axis=0;axis<3;axis++)assert.equal(packet.feetWorld[support*3+axis],feet[support*3+axis]);
    assert.ok(packet.feetWorld[(1-support)*3+1]<=feet[(1-support)*3+1]);
  }
  const held=advanceStreetAnimation(n,0,8);assert.equal(held.rigPose.mode,'hold');assert.equal(held.rigPose.phase,.25);
  const paused=advanceStreetAnimation(n,100,8,{paused:true});assert.deepEqual(paused,held);
  const restart=advanceStreetAnimation(n,1,.03,{dx:1,dy:0});assert.equal(restart.rigPose.settle,.75);assert.ok(Math.abs(restart.rigPose.phase-(.25+1/stride))<1e-12);assert.equal(restart.moving,true);assert.equal(restart.holdPosition,false);
  const movingRoot={...frame,rootWorld:[.02,0,0]},packet=sampleStreetCharacterRig(def,restart.rigPose,movingRoot);
  for(let axis=0;axis<3;axis++)assert.ok(Math.abs(packet.feetWorld[support*3+axis]-feet[support*3+axis])<1e-12,'accepted restart phase keeps support planted while root proceeds');
  requestStreetReaction(n,'success',{token:'attempt'});assert.equal(cancelStreetReaction(n,{token:'attempt'}),true);
  const cancelled=advanceStreetAnimation(n,0,0);assert.equal(cancelled.rigPose.phase,restart.rigPose.phase);assert.equal(cancelled.rigPose.settle,.75,'story cancellation cannot reset physical landing');
  const reduced=advanceStreetAnimation(n,0,.01,{reducedMotion:true});assert.equal(reduced.rigPose.settle,1);assert.equal(reduced.rigPose.phase,restart.rigPose.phase);
});

test('Three rig is lazy, keeps one bounded geometry, and maps canonical world packet through actual host/camera transforms',async()=>{
  registerStreetCharacterManifest(rigManifest());const n=actor(),f=rendererFixture(),network=rigFetch(),host=f.host(),parent=new THREE.Group();
  parent.position.set(3,.6,-2);parent.rotation.y=.4;parent.scale.set(1.2,1.5,.8);parent.add(host);host.position.set(1,.2,2);host.rotation.y=.6;host.scale.set(.7,1,1.1);
  f.camera.position.set(0,11.5,14);f.camera.lookAt(0,1,-2.7);
  try{
    const adapter=createStreetCharacterSprite(f.T,n,host,f.queueAsset,f.camera),initial=f.queue[0].task();await Promise.resolve();const standing=f.finish(0,128,160);await initial;
    assert.equal(network.requests.length,0);const mesh=host.children[1],geometry=mesh.geometry,material=mesh.material;
    assert.equal(geometry.attributes.position.count,256);assert.equal(geometry.attributes.uv.count,256);assert.equal(geometry.index.count,384);assert.equal(geometry.drawRange.count,6);
    const pose=advanceStreetAnimation(n,8,.2,{dx:8,dy:0});adapter.sync();assert.equal(network.requests.length,0);
    const job=adapter.prepareMotion();assert.equal(adapter.prepareMotion(),job);assert.equal(network.requests.length,0);
    const pending=job.task();await until(()=>f.requests.length===2);assert.equal(network.requests.length,1);assert.match(network.requests[0].url,/test-rig\.json\?v=c{64}$/);assert.match(f.requests[1].url,/test-parts\.webp\?v=e{64}$/);
    const parts=f.finish(1,256,256);assert.equal(await pending,true);assert.equal(adapter.inspect().stage,'rig');
    assert.equal(host.children[1],mesh);assert.equal(mesh.geometry,geometry);assert.equal(mesh.material,material);assert.equal(mesh.material.map,parts);assert.equal(standing.disposals,0,'standing is retained for a rig failure');assert.equal(adapter.inspect().textureReferences,2);
    const packet=adapter.inspect().rigPacket;assert(packet);assert.equal(mesh.position.length(),0);assert.equal(mesh.quaternion.w,1);
    for(let i=0;i<packet.vertexCount;i++){
      const world=new THREE.Vector3().fromBufferAttribute(geometry.attributes.position,i).applyMatrix4(host.matrixWorld);
      for(let axis=0;axis<3;axis++)assert.ok(Math.abs(world.getComponent(axis)-packet.positionsWorld[i*3+axis])<2e-6);
      assert.ok(Math.abs(geometry.attributes.uv.getX(i)-packet.uvs[i*2])<1e-7);assert.ok(Math.abs(geometry.attributes.uv.getY(i)-(1-packet.uvs[i*2+1]))<1e-7);
    }
    assert.equal(geometry.drawRange.count,packet.triangleCount*3);assert.ok(packet.triangleCount<=64);
    const buffer=packet.positionsWorld;for(let i=0;i<10;i++)adapter.sync();assert.equal(adapter.inspect().rigPacket.positionsWorld,buffer);assert.equal(adapter.inspect().pose,pose);assert.equal(network.requests.length,1);assert.equal(f.requests.length,2);assert.equal(f.queue.length,2);
    adapter.dispose();assert.equal(standing.disposals,1);assert.equal(parts.disposals,1);assert.equal(adapter.inspect().rigDefinitionReferences,0);assert.equal(host.children.length,1);
  }finally{network.restore()}
});

test('Canvas rig shares definition with Three, projects the same packet and maps every clipped UV triangle without new jobs',async()=>{
  registerStreetCharacterManifest(rigManifest());const n=actor(),f=canvasFixture(),three=rendererFixture(),network=rigFetch(),host=three.host();
  host.position.set(2,.4,-1);three.camera.position.set(0,11.5,14);three.camera.lookAt(0,1,-2.7);
  const operations=[],transforms=[];let path=[];
  Object.assign(f.ctx,{save(){operations.push('save')},restore(){operations.push('restore')},beginPath(){path=[]},moveTo(x,y){path.push([x,y])},lineTo(x,y){path.push([x,y])},closePath(){},clip(){},transform(...matrix){transforms.push({matrix,path:path.map(p=>p.slice())})}});
  try{
    const canvas=createStreetCharacterCanvasSprite(n,f.queueAsset),paint=createStreetCharacterSprite(three.T,n,host,three.queueAsset,three.camera);
    const a=f.queue[0].task(),b=three.queue[0].task();await Promise.resolve();const standing=f.finish();three.finish(0,128,160);await Promise.all([a,b]);
    assert.equal(canvas.drawRig(f.ctx,{}),false);const pending=[canvas.prepareMotion().task(),paint.prepareMotion().task()];await until(()=>f.requests.length===2&&three.requests.length===2);
    assert.equal(network.requests.length,1,'JSON and pure-module resources are shared across Canvas and Three consumers');
    f.finish(1,256,256);three.finish(1,256,256);assert.deepEqual(await Promise.all(pending),[true,true]);
    const pose=advanceStreetAnimation(n,5,.2,{dx:5,dy:0});paint.sync();const frame=actualRigFrame(host,three.camera,'right');
    const viewProjection=new THREE.Matrix4().multiplyMatrices(three.camera.projectionMatrix,three.camera.matrixWorldInverse).elements,viewport={x:13,y:29,width:960,height:540};
    assert.equal(canvas.drawRig(f.ctx,{frame,viewProjection,viewport}),true);
    const packet=canvas.inspect().rigPacket,other=paint.inspect().rigPacket;
    assert.equal(packet.vertexCount,other.vertexCount);for(let i=0;i<packet.vertexCount*3;i++)assert.ok(Math.abs(packet.positionsWorld[i]-other.positionsWorld[i])<1e-6);
    const projected=projectStreetCharacterRigPacket(packet,viewProjection,viewport);assert.equal(transforms.length,projected.triangleCount);assert.equal(operations.filter(x=>x==='save').length,transforms.length);assert.equal(operations.filter(x=>x==='restore').length,transforms.length);
    for(let triangle=0;triangle<projected.triangleCount;triangle++){
      const {matrix:[a,b,c,d,e,g],path}=transforms[triangle];
      for(let corner=0;corner<3;corner++){
        const index=packet.indices[triangle*3+corner],u=packet.uvs[index*2]*256,v=packet.uvs[index*2+1]*256;
        assert.ok(Math.abs(a*u+c*v+e-path[corner][0])<1e-4);assert.ok(Math.abs(b*u+d*v+g-path[corner][1])<1e-4);
      }
    }
    const positions=packet.positionsWorld;canvas.drawRig(f.ctx,{frame,viewProjection,viewport});assert.equal(canvas.inspect().rigPacket.positionsWorld,positions);assert.equal(canvas.inspect().pose,pose);assert.equal(f.requests.length,2);assert.equal(f.queue.length,2);assert.equal(network.requests.length,1);
    canvas.draw(f.ctx,60,150,136);assert.equal(f.draws.at(-1)[0],standing,'old Canvas draw remains a standing fallback, never flattens a parts atlas');
    paint.dispose();assert.equal(canvas.inspect().rigDefinitionReferences,1);canvas.dispose();assert(f.images.every(image=>image.clears===1));
  }finally{f.restore();network.restore()}
});

test('rig upper actions bind only the actual facing and unregistered mouths remain closed',async()=>{
  const candidate=rigManifest();candidate.characters['quiz-test-person'].speech={clips:{talk:{offset:52,count:4}}};registerStreetCharacterManifest(candidate);
  const n=actor(),f=rendererFixture(),network=rigFetch(),host=f.host();
  try{
    const adapter=createStreetCharacterSprite(f.T,n,host,f.queueAsset,f.camera),initial=f.queue[0].task();await Promise.resolve();f.finish(0,128,160);await initial;
    const pending=adapter.prepareMotion().task();await until(()=>f.requests.length===2);f.finish(1,256,256);await pending;
    requestStreetReaction(n,'success',{token:'down'});advanceStreetAnimation(n,0,0);advanceStreetAnimation(n,0,.4);adapter.sync();assert.equal(adapter.inspect().rigUpperStatus,'success');
    const packet=adapter.inspect().rigPacket,upperTriangle=packet.trianglePartIds.subarray(0,packet.triangleCount).indexOf(0);assert.ok(upperTriangle>=0);
    for(let corner=0;corner<3;corner++){const u=packet.uvs[packet.indices[upperTriangle*3+corner]*2];assert.ok(u>=.2-1e-6&&u<=.3+1e-6,'registered upper UV survives painter ordering')}
    assert.equal(advanceStreetAnimation(n,0,.4).frame,3);adapter.sync();
    const terminal=adapter.inspect().rigPacket,terminalUpper=terminal.trianglePartIds.subarray(0,terminal.triangleCount).indexOf(0);
    for(let corner=0;corner<3;corner++)assert.ok(terminal.uvs[terminal.indices[terminalUpper*3+corner]*2]<=.1+1e-6,'metadata terminal maps to actual source terminal despite different sample counts');
    cancelStreetReaction(n,{token:'down'});advanceStreetAnimation(n,5,.2,{dx:5,dy:0});requestStreetReaction(n,'success',{token:'right'});const right=advanceStreetAnimation(n,0,.12);adapter.sync();assert.equal(right.rigPose.direction,'right');assert.match(adapter.inspect().rigUpperStatus,/unregistered/);assert.equal(adapter.inspect().rigPacket.pose.direction,'right');
    cancelStreetReaction(n,{token:'right'});const speech=advanceStreetAnimation(n,0,.1,{speaking:true,cueToken:'recorded',mediaTime:.3,mouthOpen:1});adapter.sync();assert.equal(speech.speaking,true);assert.equal(speech.mouthOpen,0);assert.match(adapter.inspect().rigUpperStatus,/closed neutral/);assert.equal(adapter.inspect().rigPacket.pose.direction,'right');
    adapter.dispose();
  }finally{network.restore()}
});

test('two Three rig consumers share JSON, standing and selected mobile parts until final retirement',async()=>{
  const previousWidth=globalThis.innerWidth;globalThis.innerWidth=390;registerStreetCharacterManifest(rigManifest());const f=rendererFixture(),network=rigFetch();
  try{
    const adapters=[actor(),actor()].map(n=>createStreetCharacterSprite(f.T,n,f.host(),f.queueAsset,f.camera));
    const initial=f.queue.map(job=>job.task());await Promise.resolve();const standing=f.finish(0,128,160);await Promise.all(initial);
    const tasks=adapters.map(a=>a.prepareMotion().task());await until(()=>f.requests.length===2);assert.equal(network.requests.length,1);assert.match(f.requests[1].url,/test-parts-mobile\.webp\?v=f{64}$/);
    const parts=f.finish(1,128,128);assert.deepEqual(await Promise.all(tasks),[true,true]);assert.equal(standing.disposals,0);
    adapters[0].dispose();assert.equal(standing.disposals,0);assert.equal(parts.disposals,0);assert.equal(adapters[1].inspect().rigDefinitionReferences,1);
    adapters[1].dispose();assert.equal(standing.disposals,1);assert.equal(parts.disposals,1);
    const fresh=createStreetCharacterSprite(f.T,actor(),f.host(),f.queueAsset,f.camera),initialFresh=f.queue.at(-1).task();await Promise.resolve();f.finish(2,128,160);await initialFresh;
    const more=fresh.prepareMotion().task();await until(()=>f.requests.length===4);assert.equal(network.requests.length,2,'last definition lease evicts metadata');f.finish(3,128,128);await more;fresh.dispose();
  }finally{network.restore();if(previousWidth===undefined)delete globalThis.innerWidth;else globalThis.innerWidth=previousWidth}
});

test('rig JSON HTTP, UTF8-size, parse, identity, scale, stride and schema failures keep standing without a parts request',async()=>{
  const previousWarn=console.warn;console.warn=()=>{};
  try{
    for(const mode of ['http','oversized','utf8-size','parse','identity','world-height','stride','schema']){
      registerStreetCharacterManifest(rigManifest());const f=rendererFixture(),network=rigFetch(null),host=f.host();
      try{
        const adapter=createStreetCharacterSprite(f.T,actor(),host,f.queueAsset,f.camera),initial=f.queue[0].task();await Promise.resolve();const standing=f.finish(0,128,160);await initial;
        const pending=adapter.prepareMotion().task();await until(()=>network.requests.length===1);
        const def=rigDefinition();if(mode==='identity')def.id='other';if(mode==='world-height')def.figureWorldHeight=1.5;if(mode==='stride')def.gait.strideDistance=20;if(mode==='schema')def.skeleton.legs[0].upperLength=-1;
        const body=mode==='oversized'?' '.repeat(65537):mode==='utf8-size'?JSON.stringify({padding:'ö'.repeat(33000)}):mode==='parse'?'{bad':JSON.stringify(def);
        network.requests[0].resolve({ok:mode!=='http',status:503,text:async()=>body});assert.equal(await pending,false);
        assert.equal(adapter.inspect().stage,'standing');assert.equal(adapter.inspect().motionFailed,true);assert.equal(adapter.inspect().textureReferences,1);assert.equal(adapter.inspect().rigDefinitionReferences,0);assert.equal(f.requests.length,1);assert.equal(host.children[1].material.map,standing);assert.equal(standing.disposals,0);assert.equal(host.children[1].geometry.drawRange.count,6);
        assert.match(adapter.inspect().motionError,mode==='http'?/503/:['oversized','utf8-size'].includes(mode)?/64 KiB/:mode==='identity'?/identity/:mode==='world-height'?/height/:mode==='stride'?/stride/:mode==='schema'?/physical bones/:/JSON/);
        adapter.prepareMotion();assert.equal(f.queue.length,2);adapter.dispose();assert.equal(standing.disposals,1);
      }finally{network.restore()}
    }
  }finally{console.warn=previousWarn}
});

test('streamed rig metadata stops at the byte bound before texture admission',async()=>{
  registerStreetCharacterManifest(rigManifest());const f=canvasFixture(),network=rigFetch(null),previousWarn=console.warn;console.warn=()=>{};let cancelled=0;
  try{
    const adapter=createStreetCharacterCanvasSprite(actor(),f.queueAsset),initial=f.queue[0].task();await Promise.resolve();const standing=f.finish();await initial;
    const pending=adapter.prepareMotion().task();await until(()=>network.requests.length===1);
    const body=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(32768));controller.enqueue(new Uint8Array(32769))},cancel(){cancelled++}});
    network.requests[0].resolve({ok:true,body});assert.equal(await pending,false);assert.equal(cancelled,1);assert.match(adapter.inspect().motionError,/64 KiB/);assert.equal(f.requests.length,1);adapter.draw(f.ctx,0,0,136);assert.equal(f.draws.at(-1)[0],standing);adapter.dispose();
  }finally{f.restore();network.restore();console.warn=previousWarn}
});

test('rig part-atlas failures and later invalid camera restore standing using the same Three geometry',async()=>{
  const previousWarn=console.warn;console.warn=()=>{};
  try{
    for(const mode of ['network','dimensions','camera']){
      registerStreetCharacterManifest(rigManifest());const n=actor(),f=rendererFixture(),network=rigFetch(),host=f.host();
      try{
        const adapter=createStreetCharacterSprite(f.T,n,host,f.queueAsset,f.camera),initial=f.queue[0].task();await Promise.resolve();const standing=f.finish(0,128,160);await initial;const mesh=host.children[1],geometry=mesh.geometry;
        const pending=adapter.prepareMotion().task();await until(()=>f.requests.length===2);
        if(mode==='network')f.requests[1].fail(new Error('parts offline'));else f.finish(1,mode==='dimensions'?1:256,256);
        const loaded=await pending;
        if(mode==='camera'){assert.equal(loaded,true);advanceStreetAnimation(n,5,.2,{dx:5,dy:0});f.camera.rotation.z=.3;adapter.sync()}else assert.equal(loaded,false);
        assert.equal(adapter.inspect().stage,'standing');assert.equal(adapter.inspect().motionFailed,true);assert.equal(mesh.material.map,standing);assert.equal(mesh.geometry,geometry);assert.equal(geometry.drawRange.count,6);assert.equal(standing.disposals,0);assert.equal(adapter.inspect().textureReferences,1);assert.equal(adapter.inspect().rigDefinitionReferences,0);
        adapter.prepareMotion();assert.equal(f.queue.length,2);adapter.dispose();assert(f.textures.every(texture=>texture.disposals===1));
      }finally{network.restore()}
    }
  }finally{console.warn=previousWarn}
});

test('Canvas rig decode/draw failures retain exact standing and release only their rig resources',async()=>{
  const previousWarn=console.warn;console.warn=()=>{};
  try{
    for(const mode of ['decode','frame']){
      registerStreetCharacterManifest(rigManifest());const f=canvasFixture(),network=rigFetch();
      try{
        const adapter=createStreetCharacterCanvasSprite(actor(),f.queueAsset),initial=f.queue[0].task();await Promise.resolve();const standing=f.finish();await initial;
        const pending=adapter.prepareMotion().task();await until(()=>f.requests.length===2);
        if(mode==='decode')f.images[1].decodePromise=Promise.reject(new Error('parts decode'));
        f.finish(1,256,256);assert.equal(await pending,mode==='frame');
        if(mode==='frame')assert.equal(adapter.drawRig(f.ctx,{frame:{},viewProjection:[],viewport:{}}),false);
        assert.equal(adapter.inspect().stage,'standing');assert.equal(adapter.inspect().motionFailed,true);assert.equal(adapter.inspect().imageReferences,1);assert.equal(adapter.inspect().rigDefinitionReferences,0);assert.equal(f.images[1].clears,1);assert.equal(standing.clears,0);
        adapter.draw(f.ctx,60,150,136);assert.deepEqual(f.draws.at(-1),[standing,0,0,128,160,0,0,128,160]);adapter.prepareMotion();assert.equal(f.queue.length,2);adapter.dispose();assert.equal(standing.clears,1);
      }finally{f.restore();network.restore()}
    }
  }finally{console.warn=previousWarn}
});

test('retiring while rig JSON is pending aborts the last lease and late metadata cannot request parts',async()=>{
  for(const kind of ['Three','Canvas']){
    registerStreetCharacterManifest(rigManifest());const f=kind==='Three'?rendererFixture():canvasFixture(),network=rigFetch(null);
    try{
      const adapter=kind==='Three'?createStreetCharacterSprite(f.T,actor(),f.host(),f.queueAsset,f.camera):createStreetCharacterCanvasSprite(actor(),f.queueAsset);
      const initial=f.queue[0].task();await Promise.resolve();f.finish(0,128,160);await initial;
      const pending=adapter.prepareMotion().task();await until(()=>network.requests.length===1);adapter.dispose();assert.equal(await pending,false);assert.equal(network.requests[0].options.signal.aborted,true);assert.equal(adapter.inspect().rigDefinitionReferences,0);assert.equal(adapter.inspect().textureReferences??adapter.inspect().imageReferences,0);
      network.requests[0].resolve({ok:true,text:async()=>JSON.stringify(rigDefinition())});await new Promise(setImmediate);assert.equal(f.requests.length,1);assert.equal(adapter.inspect().loaded,false);assert.equal(adapter.inspect().failed,false);
    }finally{f.restore?.();network.restore()}
  }
});

test('a retired shared rig consumer cannot install late parts while the surviving consumer remains ready',async()=>{
  for(const phase of ['definition','atlas']){
    registerStreetCharacterManifest(rigManifest());const f=rendererFixture(),network=rigFetch(null),hosts=[f.host(),f.host()];
    try{
      const adapters=hosts.map(host=>createStreetCharacterSprite(f.T,actor(),host,f.queueAsset,f.camera));
      const initial=f.queue.map(job=>job.task());await Promise.resolve();const standing=f.finish(0,128,160);await Promise.all(initial);
      const tasks=adapters.map(a=>a.prepareMotion().task());await until(()=>network.requests.length===1);
      if(phase==='definition')adapters[0].dispose();network.requests[0].resolve({ok:true,text:async()=>JSON.stringify(rigDefinition())});await until(()=>f.requests.length===2);
      if(phase==='atlas')adapters[0].dispose();assert.equal(network.requests[0].options.signal.aborted,false);
      const parts=f.finish(1,256,256);assert.deepEqual(await Promise.all(tasks),[false,true]);assert.equal(hosts[0].children.length,1);assert.equal(adapters[1].inspect().stage,'rig');assert.equal(parts.disposals,0);assert.equal(standing.disposals,0);adapters[1].dispose();assert.equal(parts.disposals,1);assert.equal(standing.disposals,1);
    }finally{network.restore()}
  }
});

test('last rig consumer retirement before motion admission or during parts load/decode cannot resurrect paint',async()=>{
  for(const kind of ['Three','Canvas'])for(const phase of kind==='Canvas'?['queued','parts-load','parts-decode']:['queued','parts-load']){
    registerStreetCharacterManifest(rigManifest());const f=kind==='Three'?rendererFixture():canvasFixture(),network=rigFetch();
    try{
      const adapter=kind==='Three'?createStreetCharacterSprite(f.T,actor(),f.host(),f.queueAsset,f.camera):createStreetCharacterCanvasSprite(actor(),f.queueAsset);
      const initial=f.queue[0].task();await Promise.resolve();f.finish(0,128,160);await initial;const job=adapter.prepareMotion();
      if(phase==='queued'){adapter.dispose();assert.equal(await job.task(),false);assert.equal(network.requests.length,0);assert.equal(f.requests.length,1)}
      else{
        const pending=job.task();await until(()=>f.requests.length===2);let finishDecode;
        if(phase==='parts-decode'){f.images[1].decodePromise=new Promise(resolve=>finishDecode=resolve);f.finish(1,256,256)}
        adapter.dispose();assert.equal(network.requests[0].options.signal.aborted,true);
        if(kind==='Three'){const late=f.finish(1,256,256);assert.equal(late.disposals,1)}
        assert.equal(await pending,false);
        if(kind==='Canvas'){if(finishDecode)finishDecode();else f.finish(1,256,256);await Promise.resolve()}
      }
      assert.equal(adapter.inspect().loaded,false);assert.equal(adapter.inspect().failed,false);assert.equal(adapter.inspect().rigDefinitionReferences,0);assert.equal(adapter.inspect().textureReferences??adapter.inspect().imageReferences,0);assert.equal(adapter.prepareMotion(),null);
      if(kind==='Three')assert(f.textures.every(texture=>texture.disposals===1));else assert(f.images.every(image=>image.clears===1));
    }finally{f.restore?.();network.restore()}
  }
});

test('diagonal accepted displacement retains the true physical forward vector through stop and restart',()=>{
  for(const [dx,dy] of [[5,5],[-5,5],[5,-5],[-5,-5]]){
    const candidate=rigManifest();registerStreetCharacterManifest(candidate);const n=actor(),stride=candidate.characters['quiz-test-person'].strideDistance,def=rigDefinition();
    const length=Math.hypot(dx,dy),forward=[dx/length,0,dy/length];
    const established=advanceStreetAnimation(n,stride,.2,{dx,dy});assert.deepEqual(established.rigPose.forwardWorld,forward);assert.equal(established.rigPose.phase,0);
    const frame={rootWorld:[0,0,0],forwardWorld:established.rigPose.forwardWorld,camera:{position:[0,5,10],right:[1,0,0],up:[0,1,0],forward:[0,0,-1]}};
    const before=sampleStreetCharacterRig(def,established.rigPose,frame),support=before.supportFoot,feet=before.feetWorld.slice();
    const diagonal=advanceStreetAnimation(n,length,.2,{dx,dy});assert.equal(diagonal.rigPose.direction,dy>0?'down':'up');assert.ok(Math.abs(diagonal.rigPose.phase-length/stride)<1e-12);
    const movedFrame={...frame,rootWorld:[dx*.02,0,dy*.02],forwardWorld:diagonal.rigPose.forwardWorld};
    const packet=sampleStreetCharacterRig(def,diagonal.rigPose,movedFrame);
    for(let axis=0;axis<3;axis++)assert.ok(Math.abs(packet.feetWorld[support*3+axis]-feet[support*3+axis])<1e-12,'support foot must stay planted on an established straight diagonal');
    const stopped=advanceStreetAnimation(n,0,.12,{dx:-dx,dy:0});assert.deepEqual(stopped.rigPose.forwardWorld,forward);assert.equal(stopped.rigPose.phase,diagonal.rigPose.phase);assert.equal(stopped.rigPose.mode,'hold');
    const paused=advanceStreetAnimation(n,100,10,{paused:true,dx:-dy,dy:dx});assert.deepEqual(paused.rigPose.forwardWorld,forward);assert.equal(paused.rigPose.phase,stopped.rigPose.phase);
    const restart=advanceStreetAnimation(n,length*.1,.03,{dx:dx*.1,dy:dy*.1});assert.deepEqual(restart.rigPose.forwardWorld,forward);assert.equal(restart.rigPose.settle,.75);assert.equal(restart.holdPosition,false);
    const restartedFrame={...movedFrame,rootWorld:[dx*.022,0,dy*.022],forwardWorld:restart.rigPose.forwardWorld};
    const restarted=sampleStreetCharacterRig(def,restart.rigPose,restartedFrame);
    for(let axis=0;axis<3;axis++)assert.ok(Math.abs(restarted.feetWorld[support*3+axis]-feet[support*3+axis])<1e-12);
    const changed=advanceStreetAnimation(n,2,.03,{dx:2,dy:0});assert.deepEqual(changed.rigPose.forwardWorld,[1,0,0]);assert.equal(changed.rigPose.direction,'right');
    assert.deepEqual(stopped.rigPose.forwardWorld,forward,'a changed accepted vector cannot mutate an older physical pose');
  }
});

test('Three and Canvas canonical rig packets use actual diagonal pose forward; Canvas honors explicit frame only without a simulation pose',async()=>{
  const candidate=rigManifest();registerStreetCharacterManifest(candidate);const n=actor(),f=canvasFixture(),three=rendererFixture(),network=rigFetch(),host=three.host();
  three.camera.position.set(0,11.5,14);three.camera.lookAt(0,1,-2.7);
  Object.assign(f.ctx,{save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){},transform(){}});
  try{
    const canvas=createStreetCharacterCanvasSprite(n,f.queueAsset),paint=createStreetCharacterSprite(three.T,n,host,three.queueAsset,three.camera);
    const initial=[f.queue[0].task(),three.queue[0].task()];await Promise.resolve();f.finish();three.finish(0,128,160);await Promise.all(initial);
    const pending=[canvas.prepareMotion().task(),paint.prepareMotion().task()];await until(()=>f.requests.length===2&&three.requests.length===2);f.finish(1,256,256);three.finish(1,256,256);await Promise.all(pending);
    const viewport={x:0,y:0,width:960,height:540},viewProjection=new THREE.Matrix4().multiplyMatrices(three.camera.projectionMatrix,three.camera.matrixWorldInverse).elements;
    const explicit=actualRigFrame(host,three.camera);explicit.forwardWorld=[Math.SQRT1_2,0,Math.SQRT1_2];const explicitCopy=JSON.stringify(explicit);
    assert.equal(canvas.inspect().pose,null);assert.equal(canvas.drawRig(f.ctx,{frame:explicit,viewProjection,viewport}),true);
    const reference=sampleStreetCharacterRig(rigDefinition(),{direction:'down',phase:0,mode:'hold',settle:1},explicit);
    for(let axis=0;axis<6;axis++)assert.ok(Math.abs(canvas.inspect().rigPacket.feetWorld[axis]-reference.feetWorld[axis])<1e-12,'explicit no-simulation frame remains compatible');assert.equal(JSON.stringify(explicit),explicitCopy);
    const stride=candidate.characters['quiz-test-person'].strideDistance;
    advanceStreetAnimation(n,stride,.2,{dx:5,dy:5});paint.sync();const origin=paint.inspect().rigPacket.feetWorld.slice(),support=paint.inspect().rigPacket.supportFoot;
    host.position.set(.1,0,.1);const pose=advanceStreetAnimation(n,Math.hypot(5,5),.2,{dx:5,dy:5});paint.sync();
    const misleading=actualRigFrame(host,three.camera,'down'),callerCopy=JSON.stringify(misleading);
    assert.equal(canvas.drawRig(f.ctx,{frame:misleading,viewProjection,viewport}),true);assert.equal(JSON.stringify(misleading),callerCopy,'renderer must not mutate caller frame');
    const canvasFeet=canvas.inspect().rigPacket.feetWorld,threeFeet=paint.inspect().rigPacket.feetWorld;
    for(let axis=0;axis<6;axis++)assert.ok(Math.abs(canvasFeet[axis]-threeFeet[axis])<1e-12);
    for(let axis=0;axis<3;axis++)assert.ok(Math.abs(threeFeet[support*3+axis]-origin[support*3+axis])<1e-12);
    assert.equal(pose.rigPose.direction,'down');assert.ok(Math.abs(pose.rigPose.forwardWorld[0]-Math.SQRT1_2)<1e-12);
    const stopped=advanceStreetAnimation(n,0,.12);paint.sync();canvas.drawRig(f.ctx,{frame:misleading,viewProjection,viewport});assert.deepEqual(stopped.rigPose.forwardWorld,pose.rigPose.forwardWorld);
    for(let axis=0;axis<3;axis++)assert.ok(Math.abs(canvas.inspect().rigPacket.feetWorld[support*3+axis]-origin[support*3+axis])<1e-12);
    assert.equal(f.requests.length,2);assert.equal(three.requests.length,2);assert.equal(network.requests.length,1);canvas.dispose();paint.dispose();
  }finally{f.restore();network.restore()}
});

test('reported oblique phase with frozen 32-vertex/18-triangle source geometry fits fixed 256/128 renderer buffers without truncation',async()=>{
  const def=capacityRegressionDefinition(),candidate=rigManifest();candidate.characters['quiz-test-person'].strideDistance=def.gait.strideDistance;registerStreetCharacterManifest(candidate);
  const angle=5*Math.PI/16,forward=[Math.cos(angle),0,Math.sin(angle)],frame={rootWorld:[0,0,0],forwardWorld:forward,camera:{position:[0,11.5,14],right:[1,0,0],up:[0,.8465712857591025,-.5322753593096153],forward:[0,-.5322753593096153,-.8465712857591025]}};
  const source=sampleStreetCharacterRig(def,{direction:'down',phase:.5,mode:'walk',settle:0},frame),ordered=orderStreetCharacterRigPacket(source,frame.camera.position);
  assert.equal(source.vertexCount,32);assert.equal(source.triangleCount,18);assert.ok(ordered.vertexCount>128,'frozen actual geometry must reproduce old capacity overflow');assert.ok(ordered.vertexCount<=256);assert.ok(ordered.triangleCount<=128);
  assert.deepEqual(STREET_RIG_LIMITS,{vertices:256,triangles:128});
  const n=actor(),f=rendererFixture(),network=rigFetch(def),host=f.host();f.camera.position.set(0,11.5,14);f.camera.lookAt(0,1,-2.7);
  try{
    const adapter=createStreetCharacterSprite(f.T,n,host,f.queueAsset,f.camera),initial=f.queue[0].task();await Promise.resolve();const standing=f.finish(0,128,160);await initial;
    const geometry=host.children[1].geometry,positions=geometry.attributes.position.array,uvs=geometry.attributes.uv.array,indices=geometry.index.array;
    advanceStreetAnimation(n,def.gait.strideDistance*.5,.2,{dx:forward[0],dy:forward[2]});
    const pending=adapter.prepareMotion().task();await until(()=>f.requests.length===2);f.finish(1,256,256);assert.equal(await pending,true);assert.equal(adapter.inspect().stage,'rig');
    const packet=adapter.inspect().rigPacket;assert.ok(packet.vertexCount>128);assert.ok(packet.vertexCount<=STREET_RIG_LIMITS.vertices);assert.ok(packet.triangleCount<=STREET_RIG_LIMITS.triangles);assert.equal(geometry.drawRange.count,packet.triangleCount*3);
    for(let i=0;i<packet.vertexCount;i++){
      const actual=new THREE.Vector3().fromBufferAttribute(geometry.attributes.position,i).applyMatrix4(host.matrixWorld);
      for(let axis=0;axis<3;axis++)assert.ok(Math.abs(actual.getComponent(axis)-packet.positionsWorld[i*3+axis])<1e-7,'all ordered vertices, including past128, must be uploaded');
    }
    for(let i=0;i<packet.triangleCount*3;i++){assert.equal(indices[i],packet.indices[i]);assert.ok(indices[i]<packet.vertexCount)}
    adapter.sync();assert.equal(geometry.attributes.position.array,positions);assert.equal(geometry.attributes.uv.array,uvs);assert.equal(geometry.index.array,indices);assert.equal(standing.disposals,0);adapter.dispose();
  }finally{network.restore()}
});

test('lazy rig admission rejects a module limit larger than any allocated Three attribute before requesting parts',async()=>{
  const previousWarn=console.warn;console.warn=()=>{};
  try{
    for(const shortened of ['position','uv','index']){
      registerStreetCharacterManifest(rigManifest());const f=rendererFixture(),network=rigFetch(),host=f.host();
      const T={...f.T,BufferAttribute:class extends THREE.BufferAttribute{
        constructor(array,itemSize){
          const match=shortened==='position'?itemSize===3:shortened==='uv'?itemSize===2:array instanceof Uint16Array;
          super(match?array.slice(0,shortened==='index'?64*3:128*itemSize):array,itemSize);
        }
      }};
      try{
        const adapter=createStreetCharacterSprite(T,actor(),host,f.queueAsset,f.camera),initial=f.queue[0].task();await Promise.resolve();const standing=f.finish(0,128,160);await initial;const geometry=host.children[1].geometry;
        const pending=adapter.prepareMotion().task();await until(()=>adapter.inspect().motionSettled||f.requests.length>1);if(f.requests.length>1)f.finish(1,256,256);
        assert.equal(await pending,false);assert.equal(f.requests.length,1);assert.match(adapter.inspect().motionError,/module\/packet exceeds allocated renderer buffers/);assert.equal(adapter.inspect().stage,'standing');assert.equal(geometry.drawRange.count,6);assert.equal(host.children[1].material.map,standing);assert.equal(adapter.inspect().rigDefinitionReferences,0);adapter.dispose();assert.equal(standing.disposals,1);
      }finally{network.restore()}
    }
  }finally{console.warn=previousWarn}
});


test('queued street paint cancellation keeps another live texture consumer and cannot install late paint',async()=>{
 registerStreetCharacterManifest(manifest());const f=rendererFixture(),controllers=[new AbortController(),new AbortController()];
 const saved={fetch:globalThis.fetch,Image:globalThis.Image};let network,fetches=0;const images=[];
 try{
  globalThis.fetch=(_url,{signal})=>{fetches++;return new Promise((resolve,reject)=>{network={resolve,signal};signal.addEventListener('abort',()=>reject(signal.reason),{once:true})})};
  globalThis.Image=class{constructor(){images.push(this);this.width=1024;this.height=1280}};
  const hosts=[f.host(),f.host()],adapters=hosts.map(host=>createStreetCharacterSprite(f.T,actor(),host,f.queueAsset,f.camera));
  const tasks=f.queue.map((job,i)=>job.task({signal:controllers[i].signal}));await until(()=>fetches===1);
  controllers[0].abort();assert.equal(await tasks[0],false);assert.equal(network.signal.aborted,false);
  assert.equal(adapters[0].inspect().failed,true);assert.equal(hosts[0].children.length,1);
  network.resolve({ok:true,blob:async()=>new Blob(['paint'])});await until(()=>images.length===1);images[0].onload();
  assert.equal(await tasks[1],true);assert.equal(adapters[1].inspect().loaded,true);assert.equal(fetches,1);
  adapters.forEach(adapter=>adapter.dispose());
 }finally{Object.assign(globalThis,saved)}
});

test('last street paint waiter cancellation aborts its outstanding texture fetch',async()=>{
 registerStreetCharacterManifest(manifest());const f=rendererFixture(),controller=new AbortController(),saved=globalThis.fetch;let request;
 try{
  globalThis.fetch=(_url,{signal})=>new Promise((_resolve,reject)=>{request=signal;signal.addEventListener('abort',()=>reject(signal.reason),{once:true})});
  const host=f.host(),adapter=createStreetCharacterSprite(f.T,actor(),host,f.queueAsset,f.camera);
  const pending=f.queue[0].task({signal:controller.signal});await until(()=>!!request);controller.abort();
  assert.equal(await pending,false);assert.equal(request.aborted,true);assert.equal(host.children.length,1);assert.equal(adapter.inspect().textureReferences,0);adapter.dispose();
 }finally{globalThis.fetch=saved}
});
