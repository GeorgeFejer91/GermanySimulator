import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
function between(start,end){
 const first=source.indexOf(start),last=source.indexOf(end,first+start.length);
 assert(first>=0&&last>first,`Production geometry boundaries: ${start}`);
 return source.slice(first,last);
}
// The production radius function has a stable next declaration; do not copy its formula.
const radiusSource=between('function propRadius(', '// Authored prop dimensions');
const context={};vm.createContext(context);
vm.runInContext(`
 const CITY={w:9840,h:4240},RAIL_GUTTER=560;
 const offsetWorldPoint=item=>({...item,x:item.x+RAIL_GUTTER,y:item.y+RAIL_GUTTER});
 const faxBillboardPool=[null,null];
 ${between('const horizontalRoads=','const VEHICLE_ENTRY_BUFFER=')}
 ${between('const buildings=','const grassAreas=')}
 ${between('const props=','const aliceDumpster=')}
 const SIDEWALK_WIDTH=72,WALKWAY_WIDTH=84,grassAreas=[],walkways=[];
 ${between('for(const b of buildings){\n if(b.residential)continue;','walkways.push({x:goerlitzerPark')}
 ${radiusSource}
 globalThis.geometry={buildings,props,grassAreas,walkways,horizontalRoads,propRadius};
`,context);
const {buildings,props,grassAreas,walkways,horizontalRoads,propRadius}=context.geometry;
const radius=16;
const waypoints=[[1035,1344],[1035,1158],[885,1158],[885,1060]];
function* approach(){
 for(let i=1;i<waypoints.length;i++){
  const [ax,ay]=waypoints[i-1],[bx,by]=waypoints[i],steps=Math.ceil(Math.hypot(bx-ax,by-ay)*2);
  for(let j=0;j<=steps;j++)yield [ax+(bx-ax)*j/steps,ay+(by-ay)*j/steps];
 }
}
const inside=(x,y,b)=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;
const grassAt=(x,y)=>grassAreas.some(b=>!b.privateGarden&&inside(x,y,b));
const circleRectDistance=(x,y,b)=>Math.hypot(Math.max(b.x-x,0,x-b.x-b.w),Math.max(b.y-y,0,y-b.y-b.h));
// Independent pavement expectations: the public north sidewalk joins authored walks.
const paved=(x,y)=>walkways.some(b=>inside(x,y,b))||horizontalRoads.some(b=>
 x>=b.x&&x<=b.x+b.w&&(y>=b.y-72&&y<=b.y||y>=b.y+b.h&&y<=b.y+b.h+72));

test('first office and Späti stay fixed, with original door and solid props',()=>{
 const office=buildings.find(b=>b.id==='buergeramt'),shop=buildings.find(b=>b.id==='spaeti');
 assert.deepEqual([office.x,office.y,office.w,office.h,office.doorX,office.doorY],[710,780,350,250,885,1060]);
 assert.deepEqual([shop.x,shop.y,shop.w,shop.h],[690,1180,250,145]);
 for(const [asset,x,y] of [['kaffee',1015,1105],['wartemarke',1090,1220],['bierkasten',985,1285]]){
  const prop=props.find(p=>p.asset===asset&&p.x===x&&p.y===y);
  assert(prop,`${asset} remains at (${x},${y})`);assert(!prop.decorative,`${asset} remains solid`);
 }
});

test('radius16 approach stays body-clear of every authored building and default prop',()=>{
 for(const [x,y] of approach()){
  // Production building collision uses expanded axis-aligned rectangles, including corners.
  for(const b of buildings)assert(!(x>b.x-radius&&x<b.x+b.w+radius&&y>b.y-radius&&y<b.y+b.h+radius),
   `Building ${b.id} obstructs approach at (${x},${y})`);
  for(const p of props)if(!p.decorative&&(!p.stationFixture||p.active))assert(
   Math.hypot(x-p.x,y-p.y)>=radius+propRadius(p),`${p.id||p.asset} obstructs approach at (${x},${y})`);
 }
});

test('radius16 approach is continuously paved including both bends and sidewalk/door joins',()=>{
 for(const [x,y] of approach()){
  assert(!grassAreas.some(g=>!g.privateGarden&&circleRectDistance(x,y,g)<radius),
   `Player body touches public grass at (${x},${y})`);
  assert(paved(x,y),`Unpaved approach center (${x},${y})`);
  // Native paving rectangles must cover the displayed body, not merely its center.
  for(let i=0;i<64;i++){
   const angle=i*Math.PI/32,px=x+radius*Math.cos(angle),py=y+radius*Math.sin(angle);
   assert(paved(px,py),`Pavement misses body edge near (${x},${y})`);
  }
 }
});

test('detour does not legalize the surrounding lawns or another office lawn',()=>{
 for(const [x,y] of [[800,1100],[980,1100],[970,1240],[1058,1240],[1170,1100]])
  assert(grassAt(x,y),`Public grass must remain enforceable at (${x},${y})`);
 assert(!grassAt(1035,1344),'The start remains the north sidewalk');
 assert(!grassAt(885,1060),'The destination remains the office approach');
});
