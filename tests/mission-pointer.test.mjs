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
 const scope=vm.createContext({bridge:{player,getMissionWaypoint:()=>target},missionPointer:pointer,missionDirection:direction,camera:{updateMatrixWorld(){},matrixWorldInverse:{}},missionHudCamera:{updateProjectionMatrix(){}},innerWidth:1280,innerHeight:800,document:{getElementById:()=>true}});
 vm.runInContext(extract('layoutMissionPointer')+extract('updateMissionPointer'),scope);scope.layoutMissionPointer();
 for(const [dx,dz] of [[0,500],[500,0],[0,-500],[-500,0],[350,-280]]){target={id:'entrance',x:player.x+dx,y:player.y+dz};scope.updateMissionPointer();assert.equal(pointer.visible,true);const length=Math.hypot(dx,dz);assert.ok(Math.abs(Math.sin(pointer.userData.heading)-dx/length)<1e-9);const screenLength=Math.hypot(dx,dz*.6);assert.ok(Math.abs(-Math.sin(pointer.rotation.z)-dx/screenLength)<1e-9);assert.ok(Math.abs(Math.cos(pointer.rotation.z)+dz*.6/screenLength)<1e-9);assert.equal(pointer.rotation.order,'ZXY');assert.equal(position.z,0)}
 for(const [width,height] of [[1280,800],[390,844],[844,390],[320,568]]){scope.innerWidth=width;scope.innerHeight=height;scope.layoutMissionPointer();const {x,y,size}=pointer.userData.screen;assert.equal(x,width<=1000?32:width/2);assert.equal(y-size/2,8);assert(x-size/2>=8);assert(x+size/2<=width-8);assert.equal(position.x,x-width/2);assert.equal(position.y,height/2-y)}
 target={id:'entrance',x:player.x+35,y:player.y};scope.updateMissionPointer();assert.equal(pointer.visible,false);
 target=null;scope.updateMissionPointer();assert.equal(pointer.visible,false);assert.equal(pointer.userData.target,null);
});

test('shipped model is local, compact, centered, +Z aligned, with the attributed hash',()=>{
 const bytes=readFileSync(new URL('../assets/models/mission-sausage/sausage.glb',import.meta.url));
 assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(8),bytes.length);assert.ok(bytes.length<300000);
 const doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 assert.equal(doc.nodes.length,1);assert.equal(doc.meshes.length,1);assert.equal(doc.images.length,3);assert.ok(doc.images.every(i=>i.bufferView!==undefined&&!i.uri));
 const primitive=doc.meshes[0].primitives[0],position=doc.accessors[primitive.attributes.POSITION];
 assert.equal(doc.accessors[primitive.indices].count/3,3640);assert.equal(position.max[2]-position.min[2],1.75);
 for(let k=0;k<3;k++)assert.ok(Math.abs(position.max[k]+position.min[k])<1e-9);
 assert.ok(readFileSync(new URL('../assets/models/mission-sausage/LICENSES.md',import.meta.url),'utf8').includes(createHash('sha256').update(bytes).digest('hex')));
});
