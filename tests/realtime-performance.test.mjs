import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../assets/vendor/three/0.186.0/build/three.core.js';

const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const world=readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
const street=readFileSync(new URL('../street-character-sprites.js',import.meta.url),'utf8');
function take(source,name,optional=false){
 const start=source.indexOf(`function ${name}(`);if(start<0&&optional)return '';
 assert.ok(start>=0,`${name} must exist`);let depth=0,end=source.indexOf('{',start);
 for(;end<source.length;end++){if(source[end]==='{')depth++;if(source[end]==='}'&&!--depth)break}
 return source.slice(start,end+1);
}
test('office readiness includes one bounded native shader preparation after its images and profiles',async()=>{
 const jobs=[],compiled=[],scene={},camera={};let release;
 const gate=new Promise(resolve=>{release=resolve});
 const renderer={compileAsync:async(root,view)=>{compiled.push([root,view]);await gate}};
 const api=new Function('jobs','renderer','amtScene','amtCamera',`let officeAssetPending=3,officeAssetTotal=3,officeAssetFailures=0,officeShadersRequested=false,officePreparationBackground=true;const amtActorEnvironment={},compileAmtPaint=root=>renderer.compileAsync(root,amtCamera),bridge={queueAssetLoad:(task,options)=>{jobs.push({task,options});return Promise.resolve().then(task)}};${take(world,'officeAssetSettled')};return {settle:officeAssetSettled,status:()=>({pending:officeAssetPending,total:officeAssetTotal,failed:officeAssetFailures})}`)(jobs,renderer,scene,camera);
 api.settle();api.settle();assert.equal(jobs.length,0);api.settle();await Promise.resolve();
 assert.equal(jobs.length,1);assert.equal(jobs[0].options.background,true);assert.deepEqual(compiled,[[scene,camera]]);assert.equal(api.status().pending,1,'entry must keep waiting for the prepared scene');
 release();await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(api.status(),{pending:0,total:4,failed:0});
});
test('office paint prepares both outputs with the requested fog and rejects a retired second view',async()=>{
 const calls=[],root={parent:{},material:{fog:true}},amtScene={},amtCamera={layers:{mask:9}};let release;
 const renderer={compileAsync:()=>{calls.push(['main',root.material.fog,amtCamera.layers.mask]);return new Promise(resolve=>{release=resolve})}},amtPotatoMirror={prepare:()=>{calls.push(['mirror',root.material.fog,amtCamera.layers.mask]);return Promise.resolve()}};
 const compile=new Function('renderer','amtPotatoMirror','amtScene','amtCamera',`${take(world,'compileAmtPaint').replace('function compileAmtPaint','async function compileAmtPaint')};return compileAmtPaint`)(renderer,amtPotatoMirror,amtScene,amtCamera);
 const ready=compile(root,true);assert.deepEqual(calls,[['main',true,2]]);assert.equal(amtCamera.layers.mask,9,'restore camera before awaiting');root.material.fog=false;release();await ready;assert.deepEqual(calls,[['main',true,2],['mirror',true,6]]);assert.equal(amtCamera.layers.mask,9);assert.equal(root.material.fog,false,'each synchronous compile restores current source state');
 const retired=compile(root,false);root.parent=null;release();await assert.rejects(retired,{name:'AbortError'});assert.equal(calls.filter(c=>c[0]==='mirror').length,1,'retirement must not prepare a stale reflection');
});
test('fixed rail obstacles reuse exact sampled projections, while live bodies and moved scenery stay current',()=>{
 const nearest=new Function(`${take(game,'nearestRailLocation')};return nearestRailLocation`)();let reads=0;
 const points=Array.from({length:400},(_,i)=>({get x(){reads++;return Math.sin(i/400*Math.PI*2)*1000},y:Math.cos(i/400*Math.PI*2)*1000,progress:i*55})),loop={samples:points};
 const prop={x:17,y:980},first=nearest(loop,prop.x,prop.y,prop),coldReads=reads;
 for(let i=0;i<100;i++)assert.deepEqual(nearest(loop,prop.x,prop.y,prop),first);
 assert.equal(reads,coldReads,'unchanged authored scenery must not rescan rail samples each step');
 const oracle=(x,y)=>{const p=points.reduce((best,p)=>(p.x-x)**2+(p.y-y)**2<(best.x-x)**2+(best.y-y)**2?p:best);return{progress:p.progress,distance:Math.hypot(p.x-x,p.y-y)}};
 for(let n=0;n<200;n++){
  const x=Math.sin(n*9)*1700,y=Math.cos(n*11)*1700;Object.assign(prop,{x,y});const actual=nearest(loop,x,y,prop),expected=oracle(x,y);
  assert.equal(actual.progress,expected.progress);assert(Math.abs(actual.distance-expected.distance)<1e-9);
  assert.deepEqual(nearest(loop,x,y),actual,'moving bodies always use the same exact sample rule');
 }
 const other={samples:[{x:prop.x,y:prop.y,progress:12345}]};assert.equal(nearest(other,prop.x,prop.y,prop).progress,12345,'cache belongs to the particular rail loop');
});
test('mid-road traffic defers unused wrap probes but retains near-edge braking and complete wrap',()=>{
 const probes=[],car={x:500,y:100,dir:1,lane:0,roadIndex:0,vortexPhase:'road',speed:100,cruiseSpeed:100,acceleration:60,honkCooldown:0,honkFlash:0,hold:0,angle:0};let blocked=false;
 const scope={trafficCars:[car],player:{x:0,y:1000,r:16},TRAFFIC_CAR_RADIUS:42,TRAFFIC_BRAKE_DISTANCE:190,TRAFFIC_STOP_GAP:36,TRAFFIC_MIN_X:0,TRAFFIC_MAX_X:1000,TRAFFIC_LANE_LENGTH:1000,wirtschaftswunderSite:{roadIndex:5},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),trafficGroundGap:()=>Infinity,responderBlocked:()=>false,playTrafficHorn:()=>{},shoutTrafficDriver:()=>{},updateWirtschaftswunderCar:()=>{},enterWirtschaftswunder:()=>{},vehicleCameraVisible:()=>{probes.push('camera');return blocked},vehicleMotionBlocked:()=>{probes.push('contact');return false},vehicleFullyOffMap:()=>true};
 const update=new Function(...Object.keys(scope),`${take(game,'trafficForwardGap')};${take(game,'updateTraffic')};return updateTraffic`)(...Object.values(scope));
 update(.016);assert.equal(car.x,501.6);assert.equal(probes.length,0,'the car cannot reach a wrap consumer this step');
 car.x=999;car.speed=100;blocked=true;update(.016);assert.equal(car.x,1000);assert.equal(car.speed,0);assert(probes.length>0);
 car.x=999;car.speed=100;blocked=false;update(.016);assert(Math.abs(car.x-.6)<1e-9,'unobstructed fully off-camera bodies wrap continuously');
});

function musicHarness(){
 const sources=[],gains=[],timers=[];
 const param=()=>({value:0,events:[],cancelScheduledValues(t){this.events.push(['cancel',t])},setValueAtTime(v,t){this.events.push(['set',v,t])},linearRampToValueAtTime(v,t){this.events.push(['linear',v,t])},exponentialRampToValueAtTime(v,t){this.events.push(['exponential',v,t])}});
 const audio={currentTime:0,createOscillator(){const o={frequency:param(),start(t){this.started=t},stop(t){this.stopped=t},connect(g){this.output=g;return g},disconnect(){this.disconnected=true}};sources.push(o);return o},createGain(){const g={gain:param(),connect(bus){this.bus=bus;return bus},disconnect(){this.disconnected=true}};gains.push(g);return g}};
 const bus={gain:param(),musicFilter:{disconnect(){this.disconnected=true}},disconnect(){this.disconnected=true}};
 const code=['createMusicVoice','chip','stamp','rampGain','releaseMusicBus','scheduleTheme','schedulePlaylistItem','finishSungMusic','queueNationalAnthem','startMusic'].map(n=>take(game,n,true)).join('\n');
 const api=new Function('audio','bus','timers','document',`let musicBus=bus,musicTimer=null,musicOn=true,eightBitTracksSinceSong=0,musicPlaybackSerial=0,amtMusicMuted=false,sungMusicActive=false,forcedTune=-1,introMusicFinished=true,wurstSongPending=false;const state={neighborLevel:true},AUDIO_MIX={REQUIRED_GAP_MS:120},musicSources=new Set(),midiFreq=n=>440*2**((n-69)/12),nextTune=()=>({title:'fixture',bpm:120,root:60,notes:Array.from({length:128},()=>[72,.5])}),setTimeout=(f,ms)=>{timers.push({f,ms});return timers.length},clearTimeout=id=>{if(timers[id-1])timers[id-1].cancelled=true},createMusicBus=()=>bus,stopIntroMusic=()=>{},removeMusicUnlockListeners=()=>{};audio.resume=()=>{};${code};return {scheduleTheme,queueNationalAnthem,sungGap(){musicBus=null;sungMusicActive=true;finishSungMusic()},release:typeof releaseMusicBus==='function'?releaseMusicBus:null,get sources(){return musicSources},get bus(){return musicBus}}`)(audio,bus,timers,{hidden:false,getElementById:()=>({})});
 return {api,audio,bus,sources,gains,timers};
}

test('a long synthesized tune uses at most three native sources and retains every melody note',()=>{
 const h=musicHarness();h.api.scheduleTheme();
 assert.ok(h.sources.length<=3,`whole-track scheduling allocated ${h.sources.length} native sources`);
 const melody=h.sources.find(s=>s.type==='triangle'&&s.frequency.events.some(e=>e[1]>200));
 assert.ok(melody,'the melody remains scheduled');
 assert.equal(melody.frequency.events.filter(e=>e[0]==='set'&&Math.abs(e[1]-261.6255653005986)<1e-6).length,128);
 assert.ok(h.sources.every(s=>s.started>=.05&&s.stopped>31&&s.stopped<33));
});

test('music cancellation releases its envelope and native sources without cutting the bus immediately',()=>{
 const h=musicHarness();h.api.scheduleTheme();assert.equal(typeof h.api.release,'function');
 h.audio.currentTime=.31;h.api.release();
 assert.equal(h.api.bus,null,'a successor may start immediately');
 assert.ok(h.bus.gain.events.some(e=>e[0]==='linear'&&e[1]===0&&e[2]>.31&&e[2]<=.36));
 assert.ok(!h.bus.disconnected,'the bus remains connected through the release');
 assert.ok(h.sources.every(s=>s.stopped>.31&&s.stopped<=.37));
 for(const source of h.sources)source.onended();
 assert.equal(h.api.sources.size,0);assert.ok(h.sources.every(s=>s.disconnected));assert.ok(h.gains.every(g=>g.disconnected));
 const filter=h.bus.musicFilter;for(const timer of h.timers.filter(t=>t.ms<100))timer.f();assert.ok(h.bus.disconnected);assert.ok(filter.disconnected,'the owned filter also leaves the master graph');
});

test('a suspended audio clock cannot retain cancelled music sources',()=>{
 const h=musicHarness();h.api.scheduleTheme();h.api.release();
 // A suspended native context does not dispatch ended; the existing release timer must retire its graph.
 for(const timer of h.timers.filter(t=>t.ms<100))timer.f();
 assert.equal(h.api.sources.size,0);assert.ok(h.sources.every(s=>s.disconnected));assert.ok(h.gains.every(g=>g.disconnected));
});

test('a long audio-clock pause cannot stack themes and native completion advances exactly once',()=>{
 const h=musicHarness();h.api.scheduleTheme();
 // Run every wall timer without advancing native audio time, as during a locked lecture.
 for(let pass=0;pass<5;pass++)for(const timer of h.timers.splice(0))if(!timer.cancelled)timer.f();
 assert.equal(h.sources.length,3,'a frozen audio clock still owns one theme');
 assert.equal(h.api.sources.size,3);
 h.audio.currentTime=32.12;
 for(const source of h.sources.slice())source.onended();
 for(const timer of h.timers.splice(0))if(!timer.cancelled)timer.f();
 assert.equal(h.sources.length,6,'one completed score queues one successor');
 assert.equal(h.api.sources.size,3);
});

test('forced native cleanup cannot advance a cancelled playlist',()=>{
 const h=musicHarness();h.api.scheduleTheme();h.api.release();
 for(const timer of h.timers.splice(0))if(!timer.cancelled)timer.f();
 assert.equal(h.sources.length,3);assert.equal(h.api.sources.size,0);
});

test('starting music during the Wurst completion gap consumes its pending handoff',()=>{
 const h=musicHarness();h.api.sungGap();assert.equal(h.timers.length,1);
 h.api.queueNationalAnthem();assert.equal(h.sources.length,3);
 for(const timer of h.timers.splice(0))if(!timer.cancelled)timer.f();
 assert.equal(h.sources.length,3,'the consumed sung-song timer must not stack another theme');
});

test('a stale Wurst handoff cannot restart its successor after mute or background cancellation',()=>{
 for(const cancel of ['mute','background']){
  const timers=[],played=[],document={hidden:false};
  const api=new Function('timers','played','document',`let musicPlaybackSerial=0,wurstTransitioning=false,amtMusicMuted=false,musicOn=true,musicTimer=null,introMusicFinished=true,sungMusicActive=false,wurstSongPending=true;const state={neighborLevel:false},WURST_MUSIC={},clearTimeout=()=>{},setTimeout=f=>timers.push(f),releaseMusicBus=()=>{},stopIntroMusic=()=>{},sungMusicAudio={pause(){}},playSungMusic=song=>{played.push(song);musicPlaybackSerial++};${take(game,'playWurstSong')};return {playWurstSong,cancel(){musicPlaybackSerial++;wurstTransitioning=false},office:typeof setAmtMusicMuted==='function'?setAmtMusicMuted:null}`)(timers,played,document);
  api.playWurstSong();api.cancel();api.playWurstSong();assert.equal(timers.length,2,cancel);
  timers[0]();assert.equal(played.length,0,`${cancel}: cancelled callback must leave successor alone`);
  timers[1]();assert.equal(played.length,1,`${cancel}: current handoff starts exactly once`);
 }
});

test('distant building contacts skip exact rectangle tests, while edge contact and overlap escape remain exact',()=>{
 const buildings=Array.from({length:50},(_,i)=>({x:1000+i*50,y:1000,w:40,h:80}));let exactCalls=0;
 const signed=(x,y,b)=>{exactCalls++;return Math.max(b.x-x,x-b.x-b.w,b.y-y,y-b.y-b.h)};
 const check=new Function('buildings','signedRectDistance',`const WORLD={w:10000,h:10000},goerlitzerPark={x:8000,y:8000,w:20,h:20},wirtschaftswunderSite={x:9000,y:9000,collisionRadius:20},kiesingerMemorial={x:9500,y:9500},dist=(a,b,c,d)=>Math.hypot(a-c,b-d),groundCircleCandidates=()=>[];${take(game,'groundContactBlocks')} ${take(game,'groundStaticMotionBlocked')};return groundStaticMotionBlocked`)(buildings,signed);
 assert.equal(check(200,200,13,199,200),false);assert.equal(exactCalls,0,'distant rectangles do no narrow-phase work');
 const b=buildings[0];
 const oracle=(x,y,r,fx,fy)=>{const d=(x,y)=>Math.max(b.x-x,x-b.x-b.w,b.y-y,y-b.y-b.h),n=d(x,y),p=d(fx,fy);return n<r-1e-6&&(p>=r-1e-6||n<=p+1e-6)};
 for(const [x,y,fx,fy] of [[987,1020,986,1020],[987.001,1020,986,1020],[988,1020,989,1020],[989,1020,988,1020],[999,999,998,998],[1052.999,1080,1054,1080],[1053,1093,1052,1092]])assert.equal(check(x,y,13,fx,fy),oracle(x,y,13,fx,fy));
});

test('static prop bounds include loaded and fallback bodies and restore across camera changes',()=>{
 const group=new THREE.Group(),fallback=new THREE.Mesh(new THREE.BoxGeometry(2,4,2)),model=new THREE.Mesh(new THREE.BoxGeometry(3,6,1));group.position.set(10,0,0);group.add(fallback);fallback.position.y=2;
 const slot={file:'deciduous-tree',group,fallback,model:null};
 const prepare=new Function('T',`${take(world,'staticCityMatrixUpdate',true)} ${take(world,'prepareStaticCitySlot')};return prepareStaticCitySlot`)(THREE);
 prepare(slot);assert.ok(slot.viewBounds.containsPoint(new THREE.Vector3(9,4,1)));
 group.add(model);model.position.set(1,3,0);slot.model=model;fallback.visible=false;prepare(slot);
 assert.ok(slot.viewBounds.containsPoint(new THREE.Vector3(12.5,6,.5)),'a later loaded model refreshes the complete envelope');
 const camera=new THREE.PerspectiveCamera(48,1,.1,100),renderFrustum=new THREE.Frustum(),renderViewMatrix=new THREE.Matrix4();
 const update=new Function('T','camera','renderFrustum','renderViewMatrix','cityAssetSlots',`const forEachStreetBody=()=>{},jwdScenery=[],buildingSlots=[],trainSlots=[];${take(world,'visibleGroupMatrixUpdate')} ${take(world,'updateGroupVisibility')};return updateGroupVisibility`)(THREE,camera,renderFrustum,renderViewMatrix,[slot]);
 camera.position.set(10,3,12);camera.lookAt(10,3,0);update();assert.ok(group.visible);
 camera.lookAt(10,3,24);update();assert.equal(group.visible,false,'the complete offscreen subtree is culled');
 camera.lookAt(10,3,0);update();assert.ok(group.visible,'returning to the prop restores it');
 const dynamic={file:'other',group:new THREE.Group()};prepare(dynamic);assert.equal(dynamic.viewBounds,undefined,'unowned animated props remain on their existing path');
 group.traverse(n=>n.geometry?.dispose());
});

test('idle reaction checks do not resolve character catalogues',()=>{
 const actor={},states=new WeakMap();let lookups=0;
 const check=new Function('playbackByActor','characters','resolveStreetCharacter',`${take(street,'hasStreetReaction')};return hasStreetReaction`)(states,{moving:{},standing:{standingOnly:true}},()=>{lookups++;return actor.standing?'standing':'moving'});
 assert.equal(check(actor),false);assert.equal(lookups,0,'an idle actor has no reaction to validate');
 states.set(actor,{pending:['look']});assert.equal(check(actor),true);assert.equal(lookups,1);
 actor.standing=true;assert.equal(check(actor),false,'standing-only figures still reject body reactions');
 states.set(actor,{current:null,pending:null});lookups=0;assert.equal(check(actor),false);assert.equal(lookups,0);
});

test('station structure batches repeated opaque boxes without changing tactile-strip placement or glass',()=>{
 const world=new THREE.Group(),M={cross:new THREE.MeshStandardMaterial(),dark:new THREE.MeshStandardMaterial(),metal:new THREE.MeshStandardMaterial()};
 const box=(w,h,d,m,x,y,z,p=world)=>{const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);q.position.set(x,y,z);p.add(q);return q};
 const run=new Function('T','world','M','box','bridge','mat','label',`const S=.02,X=x=>x*S,Z=y=>y*S;${take(worldSource(),'staticBoxes')} ${take(worldSource(),'stationPlatform')};return stationPlatform`)(THREE,world,M,box,{vehicleApproaches:[],props:[]},color=>new THREE.MeshStandardMaterial({color}),()=>new THREE.Group());
 run({id:'fixture',name:'Fixture',side:'north',x:0,y:0,w:1000,h:200});world.updateMatrixWorld(true);
 const batches=[],glass=[];world.traverse(n=>{if(n.isInstancedMesh)batches.push(n);if(n.isMesh&&n.material.transparent)glass.push(n)});
 assert.equal(batches.length,5,'stone, yellow, cross, dark and metal each use one native batch');
 assert.equal(glass.length,3);assert.ok(glass.every(n=>!n.isInstancedMesh),'glass keeps ordinary per-surface sorting');
 const strips=batches.find(n=>n.material===M.dark),matrix=new THREE.Matrix4(),position=new THREE.Vector3(),scale=new THREE.Vector3(),rotation=new THREE.Quaternion(),centres=[];
 for(let i=0;i<strips.count;i++){strips.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);if(Math.abs(scale.x-.035)<1e-6&&Math.abs(scale.y-.027)<1e-6){assert.ok(Math.abs(position.y-.41)<1e-6&&Math.abs(position.z+1.71)<1e-6);centres.push(position.x)}}
 assert.deepEqual(centres,Array.from({length:21},(_,i)=>i-10));
 world.traverse(n=>n.geometry?.dispose());for(const m of Object.values(M))m.dispose();
});
function worldSource(){return world}
