import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {buildSatireMesh} from '../assets/models/satire-kit/models.js';

const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const roads=game.match(/const horizontalRoads=[^\n]+\nconst verticalRoads=[^\n]+/)[0];
const stations=game.slice(game.indexOf('const STATION_RISE='),game.indexOf('const TRAIN_CAR_OFFSETS='));
const start=game.indexOf(' for(const station of stations){',game.indexOf('const smallDecoration=')),fixtures=game.slice(start,game.indexOf(' const northwest=stations[0];',start));
const world=vm.createContext({RAIL_GUTTER:560,CITY:{w:9840,h:4240},crossings:[],props:[],smallDecoration:new Set()});
vm.runInContext(`${roads}\n${stations}\n${fixtures}\nglobalThis.layout={stations,stationElevation,props}`,world);

test('all 18 station frontages connect to their platform without an unwalkable height jump',()=>{
 const {stations,stationElevation}=world.layout;assert.equal(stations.length,18);
 for(const s of stations){
  const vertical=s.side==='north'||s.side==='south',span=vertical?s.w:s.h;
  assert.equal(vertical?s.accessW:s.accessH,span);
  for(let lateral=16;lateral<span-16;lateral+=20){
   let previous=0;
   for(let approach=0;approach<=120;approach++){
    const x=vertical?s.x+lateral:s.side==='west'?s.accessX+s.accessW-approach:s.accessX+approach;
    const y=vertical?(s.side==='north'?s.accessY+s.accessH-approach:s.accessY+approach):s.y+lateral;
    const height=stationElevation(x,y);assert.ok(Math.abs(height-previous)<=.100001,s.id);previous=height;
   }
   assert.equal(previous,.3,s.id);
  }
 }
});
test('loaded station colliders enclose their actual models and preserve a complete-body central entrance',()=>{
 const fixtures=world.layout.props.filter(p=>p.stationFixture);assert.equal(fixtures.length,24);
 for(const fixture of fixtures){
  const rect=fixture.collisionRect;assert.ok(rect,fixture.satireId);
  const mesh=buildSatireMesh(fixture.satireId),scale=fixture.scale/.02;
  for(const part of mesh.parts)for(let i=0;i<part.positions.length;i+=3){
   const x=fixture.x+part.positions[i]*scale,y=fixture.y+part.positions[i+2]*scale;
   assert.ok(x>=rect.x-.0001&&x<=rect.x+rect.w+.0001&&y>=rect.y-.0001&&y<=rect.y+rect.h+.0001,fixture.satireId);
  }
 }
 for(const station of world.layout.stations){
  const shelters=fixtures.filter(p=>p.stationId===station.id&&p.satireId==='platform-shelter').sort((a,b)=>a.x-b.x);
  if(!shelters.length)continue;
  const gap=shelters[1].collisionRect.x-shelters[0].collisionRect.x-shelters[0].collisionRect.w;
  assert.ok(gap>32,station.id+' must clear the player diameter');
 }
});

test('default station steps visibly cover the full walkable frontage',()=>{
 const source=readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
 const start=source.indexOf('  function stationPlatform(s){'),end=source.indexOf('  const stationSlots=',start);
 const boxes=[];
 class Group {constructor(){this.position={set(){}};this.rotation={};} add(){}}
 class Mesh {constructor(){this.position={set(){},copy(){},x:0,z:0};}}
 const context=vm.createContext({T:{Group,Mesh,MeshStandardMaterial:class{},CircleGeometry:class{},TorusGeometry:class{},DoubleSide:2},S:.02,X:x=>x*.02,Z:y=>y*.02,
  bridge:{vehicleApproaches:[],props:[]},world:{add(){}},mat:()=>({}),M:{cross:{},dark:{},metal:{}},box:(width,height,depth,material,x,y,z)=>boxes.push({width,height,depth,x,y,z}),
  label:()=>({scale:{set(){}},position:{set(){}}})});
 vm.runInContext(source.slice(start,end)+'\nglobalThis.build=stationPlatform',context);
 for(const station of world.layout.stations){
  boxes.length=0;context.build(station);
  const steps=boxes.filter(box=>box.depth===.4&&box.height<=.3);
  assert.equal(steps.length,3,station.id);
  for(const step of steps)assert.equal(step.width,Math.max(station.w,station.h)*.02,station.id+' visible steps must cover accessible width');
 }
});
