import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {panoramaStudyPoint} from '../assets/models/berghain/panorama-registration.mjs';
import {adjacentPanoramaPoint} from '../assets/models/berghain/panorama-section.mjs';
const front=([x,z])=>Object.fromEntries(adjacentPanoramaPoint(panoramaStudyPoint([x,13.25,z])).map((v,i)=>[['x','y','z'][i],v]));
import {panoramaSanitaryAt} from '../assets/models/berghain/interior-topology.mjs';
import {canStand} from './navigation.mjs';
import {travel} from './lounge-playtest.mjs';
import {assertFirstPersonView,dragLook} from './fixture-playtest.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';
import lounge from './lounge-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {lookUp} from './suspended-subs-playtest.mjs';

const targetsFromEntry=()=>[...layout.panoramaRegistration.toiletRoute.slice(0,-1),
  ...[[-15.5,1],[-13.85,1],[-13.85,-1.6],[-13.85,1],[-20.3,1],[-20.3,-1.6],[-20.3,1],
    {x:4.5,y:9.05,z:20.5},[-18.5,1],[-18.5,2.75],[-18.5,1],[-15.5,1]].map(p=>Array.isArray(p)?front(p):p)];
const walk=fallback=>({id:fallback?'panorama-sanitary-fallback':'panorama-sanitary-route',
  modes:['quick','stress'],profiles:fallback?['android-portrait']:['desktop','android-portrait','android-landscape'],timeoutMs:240000,async run(ctx){
    const {page,baseURL,artifacts}=ctx;
    if(fallback)await page.route('**/assets/models/berghain/textures/*.png',r=>r.abort());
    await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
    await page.locator('#room').selectOption('panorama');
    assert.equal(await page.locator('#model').getAttribute('data-materials'),fallback?'fallback':'ready');
    let heading=viewpoints.panorama.yaw;const route=[];
    const targets=targetsFromEntry();
    for(const [i,target] of targets.entries()){
      const result=await travel(ctx,target,heading);
      heading=result.yaw;route.push(result.position);
      assert.ok(canStand(result.position,layout));
      if([[-13.85,-1.6],[-20.3,-1.6],[-18.5,2.75]].map(front).some(p=>Math.hypot(p.x-target.x,p.z-target.z)<.01)){
        await lookUp(ctx,-.88);
        await artifacts.screenshot(page,'panorama-sanitary-group-'+i+'.png');
        await lookUp(ctx,.88);
      }
      if(target.x===4.5&&target.z===20.5){
        const rear={x:4.5,z:22},yaw=Math.atan2(-(rear.x-result.position.x),-(rear.z-result.position.z));
        const turn=Math.atan2(Math.sin(yaw-heading),Math.cos(yaw-heading));
        await dragLook(page,ctx.context,ctx.profile,-turn/.004);heading=yaw;
        await assertFirstPersonView(page);await artifacts.screenshot(page,'panorama-sanitary-rear-window.png');
      }
    }
    assert.ok(panoramaSanitaryAt(route.at(-1)));await assertFirstPersonView(page);
    for(const target of targets.toReversed().slice(1)){
      const result=await travel(ctx,target,heading);
      heading=result.yaw;route.push(result.position);
    }
    assert.ok(route.every(p=>p.y===9.05&&canStand(p,layout)));
    return {route,fallback,scope:'Room shortcut then actual input into front, rear and left cubicles and return; relative topology supported, metric footprint/counts qualified'};
  }});
const rendering={id:'panorama-sanitary-native',modes:['quick','stress'],profiles:['desktop'],timeoutMs:180000,async run(ctx){
  const comparisons=[],samples=[];
  for(const [name,body,look] of [['rear',[-16.7,1],[-20.3,-2.5]],['front',[-17.5,1],[-14,-2.5]],['left',[-19.3,1],[-18.5,4]],['window',{x:4.5,y:9.05,z:20.5},{x:4.5,y:9.05,z:22}]]){
    const position=Array.isArray(body)?front(body):body,target=Array.isArray(look)?front(look):look;assert.ok(canStand(position,layout));
    const eye=[position.x,position.y+1.68,position.z],aim=[target.x,target.y+(name==='window'?1.68:1.1),target.z];
    comparisons.push(await compareMaterialRender(ctx,{position:eye,target:aim}));
    const yaw=Math.atan2(-(aim[0]-eye[0]),-(aim[2]-eye[2])),pitch=Math.atan2(aim[1]-eye[1],Math.hypot(aim[0]-eye[0],aim[2]-eye[2]));
    for(const clubNight of [false,true]){
      const native=await renderNativeAsset(ctx.page,{position,yaw,pitch,fov:60,clubNight});
      assert.equal(native.fixtures,layout.fixtures.length);assert.equal(native.interiorTopology.panoramaToilets.floorHeight,9.05);
      if(clubNight)assert.equal(native.lighting.room,'panoramaToilets');
      await ctx.artifacts.screenshot(ctx.page,name+'-'+(clubNight?'night':'day')+'.png');
      await disposeNativeAsset(ctx.page);samples.push({name,clubNight,lighting:native.lighting});
    }
  }
  return{comparisons,samples,scope:'Legal standing-eye geometry and source/native render comparison, all three groups in inspection and night lighting.'};
}};

export default {name:'Separate Panorama sanitary area beneath upper lounge',
  sourceFiles:()=>[...lounge.sourceFiles(),...['assets/models/berghain/interior-topology.mjs',
    'assets/models/berghain/klo-bar.mjs','berghain/interior-topology-playtest.mjs'].map(path=>({path,
      sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')}))],
  scenarios:[walk(false),walk(true),rendering]
};
