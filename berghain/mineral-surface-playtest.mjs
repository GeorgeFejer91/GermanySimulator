import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {travel} from './lounge-playtest.mjs';
import {dragLook,assertFirstPersonView} from './fixture-playtest.mjs';
import {sourceFiles as priorFiles} from './saule-playtest.mjs';
const extra=['berghain/mineral-surface-playtest.mjs','assets/models/berghain/baked-belt.mjs','assets/models/berghain/textures/saule-belt-bake.png',...['plaster','pier'].flatMap(f=>['baseColor','roughness','normal'].map(k=>'assets/models/berghain/textures/'+f+'-'+k+'.png'))];
export const sourceFiles=()=>[...priorFiles(),...extra.map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
const views=[{id:'bar',position:[3,7.13,-10.15],target:[-4,10.2,-14.8]},
 {id:'pier',position:[3,1.73,0],target:[0,2.35,-2.9]}];
for(const room of ['lab','lounge','klo','halle']){
 const {position:p,yaw}=viewpoints[room];
 views.push({id:room,position:[p.x,p.y+1.68,p.z],target:[p.x-3*Math.sin(yaw),p.y+1.5,p.z-3*Math.cos(yaw)]});
}
const climber=layout.artworks.find(a=>a.id==='uddenberg-climber').anchor;
views.push({id:'climber',position:[climber[0]+3.5,climber[1]+2.2,climber[2]+.3],target:[climber[0],climber[1]+1.7,climber[2]]});
const routes={berghain:[[4,5.45,-7],[3,5.45,-10.15]],saule:[[1.4,.05,0],[1.4,.05,-1]]};
async function walkMaterials(ctx,{fallback=false,restore=false}={}){
 const {page,baseURL,context,profile,artifacts}=ctx;
 if(fallback)await page.route('**/assets/models/berghain/textures/*.png',route=>route.abort());
 await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
 assert.equal(await page.locator('#model').getAttribute('data-materials'),fallback?'fallback':'ready');
 const result=[];
 for(const room of ['saule','berghain']){
  const arrival=viewpoints[room];await page.locator('#room').selectOption(room);
  await page.waitForFunction(p=>{const q=JSON.parse(document.querySelector('#model').dataset.position);return Math.hypot(q.x-p.x,q.y-p.y,q.z-p.z)<.001;},arrival.position);
  let heading=arrival.yaw;const steps=[];
  for(const [x,y,z]of routes[room]){const step=await travel(ctx,{x,y,z},heading);heading=step.yaw;steps.push(step);}
  if(restore&&room==='saule'){
   const before=await page.locator('#model').getAttribute('data-position');
   assert.ok(await page.evaluate(()=>{window.__mineralContext=document.querySelector('#model').getContext('webgl2').getExtension('WEBGL_lose_context');window.__mineralContext?.loseContext();return !!window.__mineralContext;}));
   await page.getByText('Graphics paused.',{exact:false}).waitFor();await page.evaluate(()=>window.__mineralContext.restoreContext());
   await page.locator('#model[data-ready="true"]').waitFor();assert.equal(await page.locator('#model').getAttribute('data-position'),before);
  }
  const looks=[];
  for(let i=0;i<4;i++){
   await dragLook(page,context,profile,-Math.PI/2/.004);heading+=Math.PI/2;
   await page.waitForFunction(()=>document.querySelector('#model').dataset.cameraTurning!=='true');
   looks.push(await assertFirstPersonView(page));if(i%2===0)await artifacts.screenshot(page,room+'-look-'+i+'.png');
  }
  for(const target of [...routes[room].slice(0,-1).reverse().map(([x,y,z])=>({x,y,z})),arrival.position]){
   const step=await travel(ctx,target,heading);heading=step.yaw;steps.push(step);
  }
  result.push({room,steps,looks});
 }
 return {fallback,restore,result,scope:'Room selectors followed by actual input approach, near-object turns and return in both affected rooms; source/native checks cover shading, physical Android not run.'};
}
export default {name:'Distinct bar plaster and Säule concrete; portable normal convention',sourceFiles,scenarios:[
 ...views.flatMap(view=>(['bar','pier'].includes(view.id)?[false,true]:[false]).map(clubNight=>({
  id:'mineral-'+view.id+(clubNight?'-night':'-inspection'),modes:['quick','stress'],profiles:['desktop'],timeoutMs:180000,
  async run(ctx){const result=await compareMaterialRender(ctx,{...view,clubNight});assert.equal(result.measured.expectedTextures,37);return {...result,view,clubNight};}}))),
 {id:'mineral-walk',modes:['quick','stress'],timeoutMs:180000,run:ctx=>walkMaterials(ctx,{restore:ctx.profile.id==='desktop'})},
 {id:'mineral-fallback',modes:['quick','stress'],timeoutMs:180000,run:ctx=>walkMaterials(ctx,{fallback:true})}
]};
