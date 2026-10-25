import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {panoramaStudyPoint} from '../assets/models/berghain/panorama-registration.mjs';
const front=([x,z])=>Object.fromEntries(panoramaStudyPoint([x,13.25,z]).map((v,i)=>[['x','y','z'][i],v]));
import {panoramaSanitaryAt} from '../assets/models/berghain/interior-topology.mjs';
import {canStand} from './navigation.mjs';
import {travel} from './lounge-playtest.mjs';
import {assertFirstPersonView} from './fixture-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';
import lounge from './lounge-playtest.mjs';

export default {name:'Separate Panorama sanitary area beneath upper lounge',
  sourceFiles:()=>[...lounge.sourceFiles(),...['assets/models/berghain/interior-topology.mjs',
    'assets/models/berghain/klo-bar.mjs','berghain/interior-topology-playtest.mjs'].map(path=>({path,
      sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))],
  scenarios:[{id:'panorama-sanitary-route',modes:['quick','stress'],timeoutMs:240000,async run(ctx){
    const {page,baseURL,artifacts}=ctx;
    await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
    await page.locator('#room').selectOption('panorama');
    let heading=viewpoints.panorama.yaw;const route=[];
    const targets=[...layout.panoramaRegistration.toiletRoute.slice(0,-1),...[[-15.5,1],[-15.5,-1.9],[-18.5,-1.9]].map(front)];
    for(const [i,target] of targets.entries()){
      const result=await travel(ctx,target,heading);
      heading=result.yaw;route.push(result.position);
      assert.ok(canStand(result.position,layout));
      if(i===targets.length-3)await artifacts.screenshot(page,'panorama-sanitary-aisle.png');
    }
    assert.ok(panoramaSanitaryAt(route.at(-1)));await assertFirstPersonView(page);
    await artifacts.screenshot(page,'panorama-sanitary-cubicle-source.png');
    const native=await renderNativeAsset(page,{position:route.at(-1),yaw:heading,fov:60,clubNight:true});
    assert.equal(native.fixtures,layout.fixtures.length);
    assert.equal(native.interiorTopology.panoramaToilets.floorHeight,13.25);
    assert.equal(native.lighting.room,'panoramaToilets');
    await artifacts.screenshot(page,'panorama-sanitary-cubicle-native.png');await disposeNativeAsset(page);
    for(const target of targets.toReversed().slice(1)){
      const result=await travel(ctx,target,heading);
      heading=result.yaw;route.push(result.position);
    }
    assert.ok(route.every(p=>p.y===13.25&&canStand(p,layout)));
    return {route,native,scope:'Room shortcut then actual input round trip; estimated footprint below existing lounge, not a surveyed plan'};
  }}]
};
