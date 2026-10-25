import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {upperLoungeStudyPoint} from '../assets/models/berghain/panorama-registration.mjs';
const studyToSite=({x,y,z})=>Object.fromEntries(upperLoungeStudyPoint([x,y,z]).map((v,i)=>[['x','y','z'][i],v]));
import {canStand,moveVisitor} from '../berghain/navigation.mjs';
import {surfaceFamilies} from '../assets/models/berghain/surface-data.mjs';

test('the added upper lounge retains primary references and estimated dimensions',()=>{
  assert.ok(layout.upperLounge,'The architect documents an additional lounge level');
  assert.deepEqual(layout.upperLounge.sources,['A13','I16','I18','I19','I20']);
  assert.match(layout.upperLounge.confidence,/estimated/);
  assert.ok(layout.upperLounge.floorHeight>13.25+2.7);
  assert.ok(layout.upperLounge.ceilingHeight-layout.upperLounge.floorHeight>=2.5);
  assert.ok(viewpoints.lounge&&canStand(viewpoints.lounge.position,layout));
  for(const path of ['berghain/model.html','geheim/index.html'])
    assert.match(readFileSync(new URL('../'+path,import.meta.url),'utf8'),/value="lounge"/);
});

test('the lounge stair supports continuous full-body travel up, into the room and back',()=>{
  assert.ok(layout.upperLounge,'Upper lounge and stair required');
  let position={...viewpoints.panorama.position};
  for(const target of layout.panoramaRegistration.loungeRoute.slice(1,-2)){
    for(let i=0;i<300;i++)position=moveVisitor(position,{x:(target.x-position.x)/(300-i),z:(target.z-position.z)/(300-i)},layout);
    assert.ok(Math.hypot(position.x-target.x,position.z-target.z)<.1,'continuous lower corridor route');
  }
  assert.ok(canStand(position,layout),'lower approach');
  const high=studyToSite({x:-7.9,y:16.35,z:.8});
  for(let i=0;i<110;i++){
    position=moveVisitor(position,{x:(high.x-position.x)/Math.max(1,110-i),z:(high.z-position.z)/Math.max(1,110-i)},layout);
    assert.ok(canStand(position,layout),'continuous ascent');
  }
  assert.ok(Math.hypot(position.x-high.x,position.z-high.z)<.15,'upper landing reached');
  assert.ok(Math.abs(position.y-16.35)<.01,'additional level reached');
  const room=studyToSite({x:-11.4,y:16.35,z:.8});
  for(let i=0;i<50;i++)position=moveVisitor(position,{x:(room.x-position.x)/(50-i),z:(room.z-position.z)/(50-i)},layout);
  assert.ok(Math.hypot(position.x-room.x,position.z-room.z)<.15,'room connects to stair');
  for(const target of [high,studyToSite({x:-7.9,y:13.25,z:8.9})])
    for(let i=0;i<110;i++)position=moveVisitor(position,{x:(target.x-position.x)/(110-i),z:(target.z-position.z)/(110-i)},layout);
  assert.ok(Math.abs(position.y-13.25)<.01,'returns continuously to Panorama level');
});

test('the mezzanine slab, stair underside, rails and seating remain real body barriers',()=>{
  assert.ok(layout.upperLounge,'Upper lounge required');
  assert.equal(canStand(studyToSite({x:-7.9,y:13.25,z:7.5}),layout),false,'low stair underside');
  assert.equal(canStand(studyToSite({x:-14,y:13.25,z:1}),layout),true,'clear-height lower passage');
  assert.equal(canStand(studyToSite({x:-15.5,y:16.35,z:3}),layout),false,'sculptural seating');
  assert.equal(canStand(studyToSite({x:-14,y:16.35,z:-4.45}),layout),false,'overlook rail');
  const blocked=moveVisitor(studyToSite({x:-11.4,y:16.35,z:.8}),{x:0,z:-10},layout);
  assert.ok(canStand(blocked,layout)&&blocked.y===16.35,'no unsupported walk off gallery');
});

test('Felsenland is original padded geometry with its designer and observed form recorded',async()=>{
  assert.ok(layout.upperLounge?.furniture,'Sculptural lounge seating required');
  assert.equal(layout.upperLounge.furniture.designer,'Hermann August Weizenegger');
  assert.equal(layout.upperLounge.furniture.title,'Felsenland');
  const {createLoungeGeometries}=await import('../assets/models/berghain/upper-lounge.mjs');
  const geometries=createLoungeGeometries();
  assert.ok(Object.keys(geometries).length>0);
  for(const geometry of Object.values(geometries)){
    assert.ok(geometry.attributes.position.count>24,'padded edge detail');
    assert.ok([...geometry.attributes.position.array,...geometry.attributes.normal.array].every(Number.isFinite));
    geometry.dispose();
  }
  assert.ok(layout.parts.some(p=>p.fixture==='felsenland'&&p.shape==='lounge-pad'));
  assert.ok(layout.parts.some(p=>p.fixture==='felsenland'&&p.material==='loungePlum'));
});

test('lounge leather uses original small-scale PBR grain rather than cloth or source photographs',()=>{
  assert.ok(surfaceFamilies.leather,'Leather upholstery needs its own surface response');
  assert.equal(surfaceFamilies.leather.metresPerTile,.04);
  const manifest=JSON.parse(readFileSync(new URL('../assets/models/berghain/textures/manifest.json',import.meta.url)));
  assert.match(manifest.origin,/no image inputs/);
  assert.equal(Object.keys(manifest.families.leather.maps).length,3);
});

test('visible lounge radiators block the body and the lower landing supports the full stair approach',()=>{
  for(const z of [-3.5,8.8])assert.equal(canStand(studyToSite({x:-19,y:16.35,z}),layout),false,'radiator metal is solid');
  for(const dx of [-.65,0,.65]){
    let position=studyToSite({x:-7.9+dx,y:13.25,z:8.9});
    assert.ok(canStand(position,layout),'full-width lower landing '+dx);
    const top=studyToSite({x:-7.9+dx,y:16.35,z:.8});
    for(let i=0;i<160;i++)position=moveVisitor(position,{x:(top.x-position.x)/(160-i),z:(top.z-position.z)/(160-i)},layout);
    assert.ok(Math.hypot(position.x-top.x,position.z-top.z)<.15,'full-width stair lane '+dx);
  }
});
