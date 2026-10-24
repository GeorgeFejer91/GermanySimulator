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
 {id:'bar-roof-source-native',modes:['quick','stress'],timeoutMs:150000,async run(ctx){
  const roof=layout.mainBar.interiorFacade.roof,floor=layout.mainBar.floorHeight;
  const eye={x:roof.center[0]-.4,y:floor+7.9,z:roof.coffers.at(-1).z[1]+2};
  const target={x:eye.x,y:floor+10.5,z:roof.coffers[0].z[0]+1.2};
  const parity=await compareMaterialRender(ctx,{position:array(eye),target:array(target)});
  const pane=layout.parts.find(p=>p.role==='roof appearance pane'&&p.center[0]<roof.center[0]&&p.center[2]<roof.center[2]);
  const beam=layout.parts.find(p=>p.role==='roof beam'&&p.name.endsWith('roof cross-beam'));
  const rays=[pane.center[2],beam.center[2]].map(z=>({origin:[pane.center[0],floor+10.5,z],direction:[0,1,0]}));
  const native=await renderNativeAsset(ctx.page,{position:{...eye,y:eye.y-1.68},
   yaw:Math.atan2(eye.x-target.x,eye.z-target.z),pitch:Math.atan2(target.y-eye.y,Math.hypot(target.x-eye.x,target.z-eye.z)),rays});
  assert.equal(native.mainBar.interiorFacade.roof.bayCount,4);
  for(const probe of Object.values(native.geometryProbes))assert.ok(probe[0]>probe[1]+.3,'Source and GLB retain the actual coffer recess above the beam');
  native.geometryProbes.source.forEach((distance,i)=>assert.ok(Math.abs(distance-native.geometryProbes.native[i])<.002));
  await ctx.artifacts.screenshot(ctx.page,'bar-roof-native.png');await disposeNativeAsset(ctx.page);
  return {parity,native,scope:'Controlled source/native camera beneath the roof; original beam/lattice/pane geometry, inferred counts/finish, no natural walking claim'};
 }},
 {...natural,id:'bar-wall-natural-route'}
]};
