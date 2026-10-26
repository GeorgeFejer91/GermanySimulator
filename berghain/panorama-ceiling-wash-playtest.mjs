import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout} from '../assets/models/berghain/layout.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {sourceFiles as priorFiles} from './foyer-platforms-playtest.mjs';
import pa from './panorama-pa-playtest.mjs';
import {lookUp} from './suspended-subs-playtest.mjs';
import {assertFirstPersonView} from './fixture-playtest.mjs';
export const sourceFiles=()=>[...priorFiles(),...[
 'assets/models/berghain/baked-panorama-ceiling.mjs','assets/models/berghain/textures/panorama-ceiling-bake.png',
 'assets/models/berghain/textures/panorama-ceiling-bake-manifest.json','berghain/build-panorama-ceiling-lighting.mjs',
 'berghain/panorama-ceiling-wash-playtest.mjs','tests/berghain-panorama-ceiling-wash.test.mjs'
 ].map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
const clouds=layout.parts.filter(p=>p.name==='Panorama acoustic cloud');
const center=clouds.reduce((v,p)=>v.map((x,i)=>x+p.center[i]/clouds.length),[0,0,0]);
const view={position:[center[0],10.73,center[2]],target:[center[0]+.01,center[1]+.5,center[2]-.01]};
const walks=pa.scenarios.filter(s=>['panorama-pa-walk','panorama-pa-fallback'].includes(s.id)).map(s=>({...s,
 id:s.id.replace('panorama-pa','ceiling'),timeoutMs:240000,async run(ctx){
  const result=await s.run(ctx);await lookUp(ctx,.65);const view=await assertFirstPersonView(ctx.page);
  await ctx.artifacts.screenshot(ctx.page,'ceiling-return-look.png');
  if(ctx.profile.id==='desktop'&&s.id==='panorama-pa-walk'){
   const before=await ctx.page.locator('#model').getAttribute('data-position');
   assert.ok(await ctx.page.evaluate(()=>{window.__ceilingContext=document.querySelector('#model').getContext('webgl2').getExtension('WEBGL_lose_context');window.__ceilingContext?.loseContext();return !!window.__ceilingContext;}));
   await ctx.page.getByText('Graphics paused.',{exact:false}).waitFor();await ctx.page.evaluate(()=>window.__ceilingContext.restoreContext());
   await ctx.page.locator('#model[data-ready="true"][data-materials="ready"]').waitFor();assert.equal(await ctx.page.locator('#model').getAttribute('data-position'),before);
   await ctx.artifacts.screenshot(ctx.page,'ceiling-context-restored.png');
  }
  return {...result,returnLook:view,contextRestore:ctx.profile.id==='desktop'&&s.id==='panorama-pa-walk'};
 }}));
export default {name:'Panorama acoustic ceiling wash',sourceFiles,scenarios:[
 {id:'ceiling-neutral',modes:['quick'],profiles:['desktop'],timeoutMs:180000,run:ctx=>compareMaterialRender(ctx,view)},
 {id:'ceiling-night',modes:['quick'],profiles:['desktop'],timeoutMs:180000,async run(ctx){
  const result=await compareMaterialRender(ctx,{...view,clubNight:true,practicalLighting:true});
  assert.ok(result.measured.lighting.meanChange[0]>2,'Ceiling wash must visibly illuminate the ceiling');
  assert.ok(result.measured.lighting.warmFraction>.03,'Wash must occupy a ceiling region, not only emitter dots');return result;
 }},
 {id:'ceiling-oblique',modes:['quick'],profiles:['desktop'],timeoutMs:180000,run:ctx=>compareMaterialRender(ctx,{
  position:[center[0]+1,10.73,center[2]+1],target:[center[0]-4,13.5,center[2]-2],clubNight:true,practicalLighting:true})},
 ...walks
]};
