import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const render=readFileSync(new URL('../world3d.js',import.meta.url),'utf8');

test('mission compass follows every office entrance and nearest unfinished Stadtbild object',()=>{
 const missions=vm.runInNewContext(game.slice(game.indexOf('const missions='),game.indexOf('const rules=speechCatalog.rules;'))+';missions');
 const state={started:true,mission:0},player={x:0,y:0},window={};
 const buildings=[...new Set(missions.map(m=>m.target))].map((id,i)=>({id,x:-999,y:-999,doorX:i*100+30,doorY:900-i*80}));
 const normObjects=[{type:'bin',x:80,y:0,fixed:false},{type:'chairs',x:20,y:0,fixed:false},{type:'hedge',x:200,y:0,fixed:false}];
 const scope=vm.createContext({state,player,window,missions,buildings,normObjects});
 vm.runInContext(game.slice(game.indexOf('function getMissionWaypoint(){'),game.indexOf('window.Germany3DBridge=')),scope);
 for(let i=0;i<missions.length;i++){state.mission=i;if(i===5)continue;const target=scope.getMissionWaypoint(),office=buildings.find(b=>b.id===missions[i].target);assert.equal(target.id,office.id);assert.equal(target.x,office.doorX);assert.equal(target.y,office.doorY)}
 state.mission=5;assert.equal(scope.getMissionWaypoint().id,'stadtbild-chairs');normObjects[1].fixed=true;assert.equal(scope.getMissionWaypoint().id,'stadtbild-bin');
 player.x=190;assert.equal(scope.getMissionWaypoint().id,'stadtbild-hedge');normObjects.forEach(o=>o.fixed=true);assert.equal(scope.getMissionWaypoint().id,'stadtbild');
 for(const flag of ['modal','dialogue','gameOver']){state[flag]=true;assert.equal(scope.getMissionWaypoint(),null);state[flag]=false}
 window.GermanyHUD={paused:true};assert.equal(scope.getMissionWaypoint(),null);window.GermanyHUD.paused=false;
 window.BuergeramtLevel={active:true};assert.equal(scope.getMissionWaypoint(),null);window.BuergeramtLevel.active=false;
 state.started=false;assert.equal(scope.getMissionWaypoint(),null);state.started=true;state.mission=8;assert.equal(scope.getMissionWaypoint(),null);
});

test('HUD sausage stays at the upper edge and points along the camera-projected bearing',()=>{
 const extract=name=>{const a=render.indexOf('  function '+name+'(){'),b=render.indexOf('\n  }',a);return render.slice(a,b+4)};
 let target=null;const player={x:560,y:560,facing:2.5},position={set(x,y,z){Object.assign(this,{x,y,z})}},pointer={rotation:{set(x,y,z,order){Object.assign(this,{x,y,z,order})}},position,scale:{setScalar(x){this.value=x}},userData:{}};
 const direction={set(x,y,z){Object.assign(this,{x,y,z});return this},transformDirection(){this.y=-this.z*.6;return this}};
 let rect={left:576,right:704,top:60,width:128,height:128};
 const scope=vm.createContext({bridge:{player,getMissionWaypoint:()=>target},missionGuide:{dataset:{}},wurstPrintFlip:{value:0},showMissionPointer:visible=>{pointer.visible=visible},pointerSpace:{getBoundingClientRect:()=>rect},missionPointer:pointer,missionDirection:direction,camera:{updateMatrixWorld(){},matrixWorldInverse:{}},missionHudCamera:{updateProjectionMatrix(){}},innerWidth:1280,innerHeight:800,document:{querySelector:()=>null}});
 vm.runInContext(extract('layoutMissionPointer')+extract('updateMissionPointer'),scope);scope.layoutMissionPointer();
 for(const [dx,dz] of [[0,500],[500,0],[0,-500],[-500,0],[350,-280]]){target={id:'entrance',x:player.x+dx,y:player.y+dz};scope.updateMissionPointer();assert.equal(pointer.visible,true);const length=Math.hypot(dx,dz);assert.ok(Math.abs(Math.sin(pointer.userData.heading)-dx/length)<1e-9);const screenLength=Math.hypot(dx,dz*.6);assert.ok(Math.abs(-Math.sin(pointer.rotation.z)-dx/screenLength)<1e-9);assert.ok(Math.abs(Math.cos(pointer.rotation.z)+dz*.6/screenLength)<1e-9);assert.equal(pointer.rotation.order,'ZXY');assert.equal(position.z,0)}
 for(const [width,height] of [[1280,800],[390,844],[844,390],[320,568]]){scope.innerWidth=width;scope.innerHeight=height;const size=width<=1000?88:128;rect={left:width<=1000?36:(width-size)/2,right:width<=1000?36+size:(width+size)/2,top:44,width:size,height:size};scope.layoutMissionPointer();const {x,y}=pointer.userData.screen;assert.equal(y-size/2,44);assert(x-size/2>=8);assert(x+size/2<=width-8);assert.equal(position.x,x-width/2);assert.equal(position.y,height/2-y)}
 target={id:'entrance',x:player.x+35,y:player.y};scope.updateMissionPointer();assert.equal(pointer.visible,false);
 target=null;scope.updateMissionPointer();assert.equal(pointer.visible,false);assert.equal(pointer.userData.target,null);
 pointer.visible=true;scope.missionGuide.dataset.pointerFit='file';scope.layoutMissionPointer();assert.equal(pointer.visible,false);assert.equal(pointer.userData.screen.fit,'file');
});

test('shipped Weisswurst is local, compact, centered, +Z aligned, with the recorded hash',()=>{
 const bytes=readFileSync(new URL('../assets/models/mission-sausage/sausage.glb',import.meta.url));
 assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(8),bytes.length);assert.ok(bytes.length<100000);
 const doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 assert.equal(doc.nodes.length,1);assert.equal(doc.meshes.length,1);assert.equal(doc.materials.length,1);assert.equal(doc.images?.length||0,0);
 const primitive=doc.meshes[0].primitives[0],position=doc.accessors[primitive.attributes.POSITION];
 assert.ok(doc.accessors[primitive.indices].count/3<6000);assert.equal(position.max[2]-position.min[2],1.75);
 assert.ok(position.max[0]-position.min[0]>.33,'full pale casing has a plump silhouette');
 for(let k=0;k<3;k++)assert.ok(Math.abs(position.max[k]+position.min[k])<1e-9);
 const binaryOffset=28+bytes.readUInt32LE(12),normal=doc.accessors[primitive.attributes.NORMAL];
 const vectors=accessor=>Array.from({length:accessor.count},(_,i)=>Array.from({length:3},(_,k)=>bytes.readFloatLE(binaryOffset+(doc.bufferViews[accessor.bufferView].byteOffset||0)+(accessor.byteOffset||0)+i*12+k*4)));
 const points=vectors(position),normals=vectors(normal);assert.equal(normals.length,points.length);
 const ring=z=>points.filter(p=>Math.abs(p[2]-z)<1e-6).map(p=>Math.hypot(p[0]+.028*p[2]*p[2],p[1]));
 const widest=z=>Math.max(...ring(z));
 assert.ok(widest(0)>widest(.59)*1.1,'the meat bulges and tapers rather than forming a straight cylinder');
 for(const sign of [-1,1]){assert.ok(widest(sign*.755)<.04,'wrapper has a pinched neck');assert.ok(widest(sign*.845)>.08&&widest(sign*.845)>widest(sign*.755)*2,'wrapper flares visibly beyond its neck');const end=ring(sign*.845);assert.ok(Math.max(...end)-Math.min(...end)>.02,'wrapper end has real folded geometry')}
 for(let i=0;i<points.length;i++){assert.ok(normals[i].every(Number.isFinite));assert.ok(Math.abs(Math.hypot(...normals[i])-1)<1e-5);for(let k=0;k<3;k++)assert.ok(points[i][k]>=position.min[k]-1e-6&&points[i][k]<=position.max[k]+1e-6)}
 const indices=doc.accessors[primitive.indices],indexOffset=binaryOffset+(doc.bufferViews[indices.bufferView].byteOffset||0)+(indices.byteOffset||0);
 for(let i=0;i<indices.count;i++)assert.ok(bytes.readUInt16LE(indexOffset+i*2)<points.length);
 for(let i=0;i<indices.count;i+=3){const [a,b,c]=[0,1,2].map(k=>points[bytes.readUInt16LE(indexOffset+(i+k)*2)]),u=b.map((v,k)=>v-a[k]),v=c.map((n,k)=>n-a[k]);assert.ok(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])>1e-10,'every triangle has a real surface area')}
 assert.ok(readFileSync(new URL('../assets/models/mission-sausage/LICENSES.md',import.meta.url),'utf8').includes(createHash('sha256').update(bytes).digest('hex')));
});
