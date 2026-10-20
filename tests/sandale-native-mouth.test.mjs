import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import * as T from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {createAtlasCharacterMouth} from '../atlas-character-mouth.js';

test('both accepted Sandale atlases have complete source-bound mouth coverage',()=>{
 for(const[kind,visible,sha]of [['towelMan',106,'e63653a5ecca3b683114e440b2632586a6396af1d41dbcaffbbc58570d94e4a3'],['towelWoman',105,'7d8613902f1dc4c15479a2acd83247247918f30dc60946b6d1b898746e769c50']]){
  const manifest=JSON.parse(readFileSync(`assets/tourists/${kind}/manifest.json`));
  assert(manifest.mouthPaint,kind+' mouth metadata');assert.equal(manifest.mouthPaint.sourceSha256,manifest.sha256);
  assert.equal(manifest.sha256,createHash('sha256').update(readFileSync(`assets/tourists/${kind}/character-atlas.png`)).digest('hex'));
  assert.equal(manifest.sha256,sha);
  const texture=new T.Texture({width:manifest.cols*manifest.frame_size[0],height:manifest.rows*manifest.frame_size[1]}),mesh=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:texture})),actor={id:kind,voiceId:kind};
  const mouth=createAtlasCharacterMouth(T,mesh,actor),grid={cols:manifest.cols,rows:manifest.rows,frameWidth:manifest.frame_size[0],frameHeight:manifest.frame_size[1],sourceSha256:manifest.sha256,mouthPaint:manifest.mouthPaint};
  const speech={actorId:kind,voiceId:kind,cueToken:{},speechStatus:'playing',mouthOpen:1};let count=0;
  for(let slot=0;slot<152;slot++){
   const result=mouth.sync(grid,{spriteRow:Math.floor(slot/8),spriteFrame:slot%8},speech);
   assert.equal(mouth.inspect().definitionError,null,kind);assert.equal(result,manifest.mouthPaint.frames[slot]!==null,kind+' slot '+slot);count+=Number(result);
  }
  assert.equal(count,visible);mouth.dispose();
 }
});

test('actual world atlas functions scope material ownership and media sync to Sandales',()=>{
 const source=readFileSync('world3d.js','utf8'),start=source.indexOf('  function atlasSprite('),end=source.indexOf('  function npcAppearance(',start);
 const syncStart=source.indexOf('  function syncAtlasSprite('),syncEnd=source.indexOf('  function syncMerkel(',syncStart);
 const actor={id:'sandale',voiceId:'tourist-guenther-liegestuhl',sandale:true,spriteKind:'towelMan',x:2,y:3,spriteFrame:0,spriteRow:0};
 const grid={cols:2,rows:2,frameWidth:128,frameHeight:160,pivot:[64,150],sourceSha256:'a'.repeat(64),mouthPaint:{schemaVersion:1,sourceSha256:'a'.repeat(64),cell:[128,160],grid:[2,2],frames:Array(4).fill(null)}};
 grid.mouthPaint.frames[0]={rect:[.5,.7,.1,.03],axes:[8,0,0,3],profile:{corners:[-1,1],crease:[0,0,0,0,0],open_upper:[0,-.1,-.2,-.1,0],open_lower:[0,.2,.4,.2,0],source_upper:[0,0,0,0,0],source_lower:[0,0,0,0,0],width:[0,0],teeth:0}};
 const camera=new T.PerspectiveCamera();camera.position.set(0,10,15);camera.lookAt(0,0,0);
 let paused=false;const speech={actorId:actor.id,voiceId:actor.voiceId,cueToken:{},speechStatus:'playing',mouthOpen:.8};
 const bridge={getNpcSpriteCanvas:()=>({width:256,height:320}),npcSpriteGrids:{towelMan:grid,merkel:grid},stationElevation:()=>0,getStreetSpeech:n=>n===actor?speech:null,getHUDState:()=>({paused})};
 const scope=vm.createContext({T,bridge,camera,createAtlasCharacterMouth,X:x=>x,Z:y=>y,atlasTextureCache:new Map(),atlasMaterialCache:new Map()});
 vm.runInContext(source.slice(start,end)+source.slice(syncStart,syncEnd)+';globalThis.api={npcSprite,syncAtlasSprite};',scope);
 const q=scope.api.npcSprite(actor),mission=scope.api.npcSprite({special:'merkel'});
 assert(q.userData.atlasMouth);assert.equal(mission.userData.atlasMouth,undefined);
 scope.api.syncAtlasSprite(q,actor,1.21);assert.equal(q.userData.atlasMouth.inspect().active,true);
 const before=q.position.clone(),quaternion=q.quaternion.clone();paused=true;scope.api.syncAtlasSprite(q,actor,1.21);
 assert.equal(q.userData.atlasMouth.inspect().active,false);assert(q.position.equals(before));assert(q.quaternion.equals(quaternion));
 paused=false;actor.spriteFrame=1;scope.api.syncAtlasSprite(q,actor,1.21);assert.equal(q.userData.atlasMouth.inspect().active,false);
});
