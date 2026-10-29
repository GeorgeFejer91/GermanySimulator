import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as T from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {installSpriteDepth} from '../sprite-depth.js';

const source=readFileSync('world3d.js','utf8');
function declaration(name,next){return source.slice(source.indexOf('  function '+name+'('),source.indexOf('  function '+next+'('))}
function fixture(){
 const player={x:0,y:0,voiceId:'player'},officer={x:20,y:20,voiceId:'police'},material=new T.MeshStandardMaterial();
 const scope=vm.createContext({T,installSpriteDepth,M:{player:material,police:material,skin:material,dark:material},X:x=>x*.02,Z:y=>y*.02,
  bridge:{player,getPolice:()=>[officer],stationElevation:()=>0},personFallbackMaterial:()=>material,streetPaintManifest:{player:{standing:{}},police:{standing:{}},citizen:{standing:{}}},resolveStreetCharacter:actor=>actor.voiceId,
  box:(w,h,d,m,x,y,z,parent)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);parent.add(mesh);return mesh}});
 vm.runInContext(declaration('character','jwdCharacter')+declaration('registeredStreetPaint','npcSpriteRequired'),scope);
 return {scope,player,officer};
}

test('player and police use articulated 3D bodies with displacement-driven limbs',()=>{
 const {scope,player,officer}=fixture();
 for(const [kind,actor] of [['player',player],['police',officer]]){
  const mesh=scope.character(kind),parts=[];mesh.traverse(node=>{if(node.isMesh)parts.push(node)});
  assert(parts.every(part=>part.geometry.type!=='PlaneGeometry'),'the displayed body has volumetric geometry');
  assert(mesh.userData.ll&&mesh.userData.rl&&mesh.userData.la&&mesh.userData.ra,'both leg and arm pairs are articulated');
  scope.syncChar(mesh,actor);actor.x+=6;scope.syncChar(mesh,actor);
  assert(Math.abs(mesh.userData.ll.rotation.x)>.01,'actual running displacement moves the legs');
  assert.equal(mesh.userData.rl.rotation.x,-mesh.userData.ll.rotation.x);
  assert.equal(mesh.userData.la.rotation.x,-mesh.userData.ra.rotation.x);
  assert(Math.abs(mesh.rotation.y-Math.PI/2)<1e-8,'3D body follows actual travel heading');
  const phase=mesh.userData.walkPhase;
  for(let frame=0;frame<30;frame++)scope.syncChar(mesh,actor);
  assert.equal(mesh.userData.walkPhase,phase,'blocked and standing roots do not advance gait');
  assert(Math.abs(mesh.userData.ll.rotation.x)<.0001,'the limbs settle when the root stops');
 }
});

test('street paint cannot take over the player, an officer or an original Sandale',()=>{
 const {scope,player,officer}=fixture();
 for(const actor of [player,officer,{voiceId:'citizen',sandale:true}])assert.equal(scope.registeredStreetPaint(actor),null);
 assert.equal(scope.registeredStreetPaint({voiceId:'citizen'}),'citizen','other named citizens keep their existing painted owner');
});
