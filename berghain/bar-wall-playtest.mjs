import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import mainBar from './main-bar-playtest.mjs';
import {layout} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';

export const sourceFiles=()=>[...mainBar.sourceFiles(),...['berghain/bar-wall-playtest.mjs','tests/berghain-bar-wall.test.mjs'].map(path=>
 ({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))];
const array=p=>[p.x,p.y,p.z];
const natural=mainBar.scenarios.find(s=>s.id==='main-bar-natural-route');
export default {name:'Historic interior bar facade and eleven-metre room',sourceFiles,scenarios:[
 {id:'bar-wall-source-native',modes:['quick','stress'],timeoutMs:150000,async run(ctx){
  const parity=await compareMaterialRender(ctx,{position:array(studyToSite({x:16.1,y:11.5,z:12})),target:array(studyToSite({x:21.4,y:12.15,z:-5}))});
  const wall=layout.mainBar.interiorFacade;
  const windowRays=wall.bayCenters.flatMap(bay=>[bay[2],bay[2]+1.02].map(z=>({origin:[17.1,10.05,z],direction:[1,0,0]})));
  const rays=[...windowRays,{origin:[13.72,12.65,wall.bayCenters[2][2]],direction:[1,0,0]}];
  const position=studyToSite({x:16.1,y:9.5,z:7}),target=studyToSite({x:21.4,y:10.7,z:-7});
  const native=await renderNativeAsset(ctx.page,{position,yaw:Math.atan2(position.x-target.x,position.z-target.z),pitch:.04,fov:60,rays});
  assert.equal(native.mainBar.interiorFacade.clearHeight,11);assert.equal(native.mainBar.interiorFacade.medallionRows,2);
  assert.equal(native.equipment,44);assert.equal(native.artworks,2);
  for(const probe of Object.values(native.geometryProbes)){
   for(let i=0;i<windowRays.length;i+=2)assert.ok(probe[i]>probe[i+1]+.18,'The native/source window is geometrically recessed behind its masonry face');
   assert.ok(probe.at(-1)>4.25&&probe.at(-1)<4.5,'The upper relief row must stay visible after trimming the inferred mid-height beam');
  }
  native.geometryProbes.source.forEach((distance,i)=>assert.ok(Math.abs(distance-native.geometryProbes.native[i])<.002));
  await ctx.artifacts.screenshot(ctx.page,'historic-wall-native.png');await disposeNativeAsset(ctx.page);
  return {parity,native,scope:'Actual original wall profiles/reveals/ceiling in source and GLB; approximate dimensions/placement, architect-reported room height'};
 }},
 {...natural,id:'bar-wall-natural-route'}
]};
