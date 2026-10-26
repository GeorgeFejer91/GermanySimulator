import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {compareMaterialRender} from './material-playtest.mjs';
import ceiling,{sourceFiles as priorFiles} from './panorama-ceiling-wash-playtest.mjs';
export const sourceFiles=()=>[...priorFiles(),...[
 'berghain/panorama-panel-forms-playtest.mjs','tests/berghain-panorama-panel-forms.test.mjs','berghain/For-AI/PANORAMA-PANEL-FORMS.md'
].map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
export default {name:'Panorama acoustic panel forms',sourceFiles,scenarios:[
 {id:'panel-front',modes:['quick'],profiles:['desktop'],timeoutMs:180000,
  run:ctx=>compareMaterialRender(ctx,{position:[-5.5,10.73,14.4],target:[-15.6,11.5,14.4],practicalLighting:true})},
 {id:'panel-oblique',modes:['quick'],profiles:['desktop'],timeoutMs:180000,
  run:ctx=>compareMaterialRender(ctx,{position:[-8.2,10.73,10.6],target:[-16,11.7,17],practicalLighting:true})},
 {id:'panel-night',modes:['quick'],profiles:['desktop'],timeoutMs:180000,
  run:ctx=>compareMaterialRender(ctx,{position:[-8.2,10.73,10.6],target:[-13.5,13.6,16.8],clubNight:true,practicalLighting:true})},
 ...ceiling.scenarios.filter(s=>['ceiling-walk','ceiling-fallback'].includes(s.id)).map(s=>({...s,id:s.id.replace('ceiling','panel')}))
]};
