import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)(process.env.SHARP_MODULE||'sharp');
for(const name of ['heiko','inga','schwabingen','theodore']){
 await sharp(`assets/characters/neighbors/${name}.webp`).extract({left:0,top:1536,width:128,height:192}).png().toFile(`assets/characters/neighbors/${name}-standing.png`);
}
