import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import previous from './upper-sanitary-playtest.mjs';
import {travel} from './lounge-playtest.mjs';
import {assertFirstPersonView,dragLook} from './fixture-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';

export const sourceFiles=()=>[...previous.sourceFiles(),...['tests/berghain-sound-system.test.mjs','berghain/suspended-subs-playtest.mjs'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
export async function lookUp({page,context,profile},pitch){
 const box=await page.locator('#model').boundingBox(),touch=profile.hasTouch?await context.newCDPSession(page):null;
 try{for(let remaining=-pitch/.004;Math.abs(remaining)>.01;){
  const dy=Math.sign(remaining)*Math.min(Math.abs(remaining),70),x=box.x+box.width*.55,y=box.y+box.height*.45;
  if(touch){
   await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+dy}]});
   await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+dy,{steps:4});await page.mouse.up();}
  remaining-=dy;
 }}finally{if(touch)await touch.detach();}
}
export const route=[{x:0,y:5.45,z:-1.53576},{x:-5.1,y:5.45,z:-1.53576},
 {x:-5.1,y:5.45,z:2.5},{x:-5.1,y:5.45,z:5.7},{x:-5.1,y:5.45,z:2.5},
 {x:-1.1,y:5.45,z:2.5},{x:-1.1,y:5.45,z:-.6}];
const walk=fallback=>({id:fallback?'suspended-subs-fallback':'suspended-subs-walk',modes:['quick','stress'],profiles:['desktop','android-portrait','android-landscape'],timeoutMs:150000,async run(ctx){
 const {page,context,profile,artifacts}=ctx;
 if(fallback)await page.route('**/assets/models/berghain/textures/*.png',r=>r.abort());
 await page.goto(ctx.baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
 await page.locator('#room').selectOption('berghain');
 await page.waitForFunction(p=>{const q=JSON.parse(document.querySelector('#model').dataset.position);return Math.hypot(q.x-p.x,q.z-p.z)<.001;},viewpoints.berghain.position);
 assert.equal(await page.locator('#model').getAttribute('data-materials'),fallback?'fallback':'ready');
 let heading=viewpoints.berghain.yaw;const steps=[];
 for(const [i,p] of route.entries()){
  const r=await travel(ctx,p,heading);heading=r.yaw;steps.push(r);await assertFirstPersonView(page);
  if(i===3)await artifacts.screenshot(page,'reopened-floor-crossing.png');
 }
 await dragLook(page,context,profile,-Math.atan2(Math.sin(Math.PI/2-heading),Math.cos(Math.PI/2-heading))/.004);
 await lookUp(ctx,.973);
 const view=await assertFirstPersonView(page);
 assert.ok(view.direction[1]>.8,'Real vertical mouse/touch input looks up at the array');
 await artifacts.screenshot(page,'overhead-array.png');
 await lookUp(ctx,-.973);heading=Math.PI/2;
 for(const p of route.slice(0,-1).toReversed()){
  const r=await travel(ctx,p,heading);heading=r.yaw;steps.push(r);
 }
 const r=await travel(ctx,viewpoints.berghain.position,heading);steps.push(r);
 return{steps,view,fallback,scope:'Explicit main-room selector, actual mouse/touch and keyboard movement through the former subwall both ways, upward view and return. No claim of measured hanging geometry.'};
}});
const rendering={id:'suspended-subs-source-native',modes:['quick','stress'],profiles:['desktop'],timeoutMs:180000,async run(ctx){
 const comparisons=[];
 for(const view of [{position:[-1.1,7.13,-.6],target:[-5.1,13,-.6]},
  {position:[-5.1,7.13,2.5],target:[-5.1,7.13,5.7]}])comparisons.push(await compareMaterialRender(ctx,view));
 const rays=layout.soundSystem.components.filter(c=>c.type==='f124').map(c=>({origin:[c.position[0],11,c.position[2]-.15],direction:[0,1,0]}));
 const samples=[];
 for(const [name,position,yaw,pitch]of [['overhead',{x:-1.1,y:5.45,z:-.6},Math.PI/2,.973],
  ['floor-crossing',{x:-5.1,y:5.45,z:2.5},Math.PI,0]])for(const clubNight of [false,true]){
  const result=await renderNativeAsset(ctx.page,{position,yaw,pitch,fov:60,clubNight,rays});
  const g=result.geometryProbes;
  g.source.forEach((n,i)=>{assert.ok(Math.abs(n-g.native[i])<.002);assert.ok(n>1.592&&n<2.53,'Upward ray reaches a real recessed aperture');});
  await ctx.artifacts.screenshot(ctx.page,name+(clubNight?'-night':'-day')+'.png');await disposeNativeAsset(ctx.page);
  samples.push({name,clubNight,geometry:g,lighting:result.lighting});
 }
 return{comparisons,samples,scope:'Source/native camera and material pixels, all six upward aperture rays, old footprint sightline and day/night views from legal floor positions.'};
}};
export default{name:'Suspended main subwoofers and reopened floor',sourceFiles,scenarios:[walk(false),walk(true),rendering]};
