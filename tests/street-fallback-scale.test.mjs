import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as T from '../assets/vendor/three/0.186.0/build/three.module.min.js';
import {installSpriteDepth} from '../sprite-depth.js';

const source=readFileSync('world3d.js','utf8');
function declaration(name,next){
  const begin=source.indexOf('  function '+name+'('),end=source.indexOf('  function '+next+'(',begin);
  assert(begin>=0&&end>begin);return source.slice(begin,end);
}
function fixture(height=2.33){
  const actor={id:'city-brigitte-mueller',voiceId:'stadt-brigitte-mueller',x:0,y:0};
  const material=new T.MeshBasicMaterial(),adultMaterial=new T.MeshBasicMaterial();
  const person={figureWorldHeight:height,standingOnly:true,standing:{}};
  let root;const status={loaded:false,failed:false};
  const camera=new T.PerspectiveCamera();camera.rotation.set(-.65,.8,.1,'YXZ');
  const scope=vm.createContext({T,installSpriteDepth,camera,streetPaintOwner:{retired:false},streetPaintManifest:{adult:person},
    cityModelsEnabled:()=>true,jobcenter:{active:false},buildingLevels:{office:null},startupModelsReady:()=>true,
    bridge:{preparingStart:false,getHUDState:()=>({started:true}),stationElevation:()=>0},
    forEachStreetBody:visit=>visit(actor,root),registeredStreetPaint:()=> 'adult',
    cityModelDistance:()=>0,isCityAssetVisible:()=>true,X:x=>x*.02,Z:y=>y*.02,scene:new T.Scene(),
    queueCityAsset:()=>{},createStreetCharacterSprite:()=>({inspect:()=>status}),
    personFallbackMaterial:kind=>kind==='adult'?adultMaterial:material});
  vm.runInContext(declaration('character','jwdCharacter')+declaration('prepareStreetPaint','syncStreetPaint'),scope);
  root=scope.character('npc');root.rotation.y=.4;
  return {scope,root,person,status,material,adultMaterial,camera};
}

test('registered adult fallback matches the selected body before its asset is admitted',()=>{
  const f=fixture();f.scope.prepareStreetPaint();
  const body=f.root.userData.personFallback;
  assert(Math.abs(body.geometry.parameters.height*176/192-f.person.figureWorldHeight)<1e-12);
  assert.equal(body.material,f.adultMaterial);
  assert.equal(f.root.visible,true);
  assert.equal(f.root.userData.streetPaintView.paint.inspect().loaded,false);
});

test('failed paint and repeated preparation retain one fitted fallback geometry',()=>{
  const f=fixture(),original=f.root.userData.personFallback.geometry;let disposals=0;
  original.addEventListener('dispose',()=>disposals++);f.scope.prepareStreetPaint();
  const fitted=f.root.userData.personFallback.geometry;
  assert.notEqual(fitted,original);assert.equal(disposals,1);
  f.status.failed=true;
  for(let i=0;i<40;i++)f.scope.prepareStreetPaint();
  assert.equal(f.root.userData.personFallback.geometry,fitted);assert.equal(disposals,1);
  assert.equal(f.root.visible,true);
});

test('redesign admission preserves the fallback of an older unmodified character',()=>{
  const f=fixture(1.6),body=f.root.userData.personFallback,geometry=body.geometry;
  f.scope.prepareStreetPaint();
  assert.equal(body.geometry,geometry);
  assert.equal(body.material,f.material);
  assert.equal(body.userData.streetFallbackHeight,undefined);
});

test('fitted fallback stays upright and anchored at its feet through camera pitch and host yaw',()=>{
  const f=fixture();f.scope.prepareStreetPaint();
  const begin=source.indexOf('  function updateGroupVisibility(){'),end=source.indexOf('    for(const root of jwdScenery)',begin);
  assert(begin>=0&&end>begin);
  f.scope.renderFrustum=new T.Frustum();f.scope.renderViewMatrix=new T.Matrix4();
  f.scope.cityAssetSlots=[];
  vm.runInContext(source.slice(begin,end)+'  }',f.scope);
  for(const pitch of [-.8,0,.6])for(const yaw of [-1.2,0,.7]){
    f.camera.rotation.set(pitch,.8,.12,'YXZ');f.root.rotation.y=yaw;f.scope.updateGroupVisibility();f.root.updateMatrixWorld(true);
    const body=f.root.userData.personFallback,height=body.geometry.parameters.height;
    const foot=body.localToWorld(new T.Vector3(0,height*(.5-184/192),0));
    const crown=body.localToWorld(new T.Vector3(0,height*(.5-8/192),0));
    assert(foot.length()<1e-6,'source sole remains on the actor root');
    assert(Math.abs(crown.y-f.person.figureWorldHeight)<1e-6,'registered body retains its actual upright stature');
  }
});
