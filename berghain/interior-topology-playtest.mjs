import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {layout} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
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
    let heading=0;const route=[];
    for(const [x,z]of [[-11,-6],[-11,1],[-15.5,1],[-15.5,-1.9],[-18.5,-1.9]]){
      const result=await travel(ctx,studyToSite({x,y:13.25,z}),heading);
      heading=result.yaw;route.push(result.position);
      assert.ok(canStand(result.position,layout));
      if(x===-15.5&&z===1)await artifacts.screenshot(page,'panorama-sanitary-aisle.png');
    }
    assert.ok(panoramaSanitaryAt(route.at(-1)));await assertFirstPersonView(page);
    await artifacts.screenshot(page,'panorama-sanitary-cubicle-source.png');
    const native=await renderNativeAsset(page,{position:route.at(-1),yaw:heading,fov:60,clubNight:true});
    assert.equal(native.fixtures,layout.fixtures.length);
    assert.equal(native.interiorTopology.panoramaToilets.floorHeight,13.25);
    assert.equal(native.lighting.room,'panoramaToilets');
    await artifacts.screenshot(page,'panorama-sanitary-cubicle-native.png');await disposeNativeAsset(page);
    for(const [x,z]of [[-15.5,-1.9],[-15.5,1],[-11,1],[-11,-6]]){
      const result=await travel(ctx,studyToSite({x,y:13.25,z}),heading);
      heading=result.yaw;route.push(result.position);
    }
    assert.ok(route.every(p=>p.y===13.25&&canStand(p,layout)));
    return {route,native,scope:'Room shortcut then actual input round trip; estimated footprint below existing lounge, not a surveyed plan'};
  }}]
};
