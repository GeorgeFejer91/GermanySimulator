import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import panels,{sourceFiles as priorFiles} from './panorama-panel-forms-playtest.mjs';
export const sourceFiles=()=>[...priorFiles(),...[
 'berghain/panorama-hardware-playtest.mjs','tests/berghain-panorama-hardware.test.mjs','berghain/For-AI/PANORAMA-HARDWARE.md'
].map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
export default{name:'Panorama overhead hardware fit',sourceFiles,scenarios:panels.scenarios.map(s=>({...s,id:s.id.replace('panel','hardware')}))};
