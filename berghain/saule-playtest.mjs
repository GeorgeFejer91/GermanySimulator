import {assertFirstPersonView} from './fixture-playtest.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {sourceFiles as previousFiles} from './bar-wall-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';
import {enterNaturally,cross} from './lab-playtest.mjs';
import {travel} from './lounge-playtest.mjs';
import {dragLook} from './fixture-playtest.mjs';

export const sourceFiles=()=>[...previousFiles(),...['berghain/saule-playtest.mjs','tests/berghain-saule.test.mjs'].map(path=>
 ({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
const position=async page=>JSON.parse(await page.locator('#model').getAttribute('data-position'));

export default {name:'Säule photographed concrete installations and continuous human circulation',sourceFiles,scenarios:[
 {id:'saule-source-native',modes:['quick','stress'],profiles:['desktop'],timeoutMs:180000,async run(ctx){
   const {groundParity}=await import('./ground-layout-playtest.mjs');return groundParity.run(ctx);
 }},{id:'saule-natural-route',modes:['quick','stress'],timeoutMs:300000,async run(ctx){
   const {groundRoute}=await import('./ground-layout-playtest.mjs');return groundRoute.run(ctx);
 }},{id:'saule-human-camera',modes:['stress'],timeoutMs:120000,async run(ctx){
   const {page,baseURL,artifacts}=ctx;
   await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
   await page.locator('#room').selectOption('saule');
   await page.waitForFunction(expected=>{
     const p=JSON.parse(document.querySelector('#model').dataset.position);
     return Math.hypot(p.x-expected.x,p.y-expected.y,p.z-expected.z)<.01;
   },viewpoints.saule.position);
   const pier=layout.fixtures.find(f=>f.id==='saule-pier-4');
   const end=await travel(ctx,{x:pier.anchor[0]-2,y:.05,z:pier.anchor[2]+1.65},viewpoints.saule.yaw);
   const samples=[];
   for(let i=0;i<8;i++){
     await dragLook(page,ctx.context,ctx.profile,-Math.PI/4/.004);
     await page.waitForFunction(()=>document.querySelector('#model').dataset.cameraTurning!=='true');
     const sample=await assertFirstPersonView(page);samples.push(sample);
     if(i%2===0)await artifacts.screenshot(page,'human-beside-pier-turn-'+i+'.png');
   }
   return {position:end.position,samples,scope:'Room shortcut then real movement and drag beside concrete/corbel/seat; first-person eye-height and opaque pier views, no natural-entry claim'};
 }}]};
