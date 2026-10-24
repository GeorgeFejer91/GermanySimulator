import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {canStand} from './navigation.mjs';
import {layout} from '../assets/models/berghain/layout.mjs';
import {renderNativeAsset,disposeNativeAsset} from './native-asset-playtest.mjs';

export async function assertFirstPersonView(page){
 const view=await page.locator('#model').evaluate(canvas=>({perspective:canvas.dataset.perspective,avatar:canvas.dataset.avatar,
  position:JSON.parse(canvas.dataset.position),camera:JSON.parse(canvas.dataset.cameraPosition),
  direction:JSON.parse(canvas.dataset.cameraDirection),fov:Number(canvas.dataset.cameraFov)}));
 assert.equal(view.perspective,'first-person');assert.equal(view.avatar,'false');assert.equal(view.fov,60);
 assert.ok(Math.hypot(view.camera[0]-view.position.x,view.camera[1]-view.position.y-1.68,view.camera[2]-view.position.z)<.000001,'The eye stays inside the actual legal walking body');
 assert.ok(Math.abs(Math.hypot(...view.direction)-1)<.000001);
 return view;
}

export async function dragLook(page,context,profile,delta) {
  const box=await page.locator('#model').boundingBox();
  const touch=profile.hasTouch?await context.newCDPSession(page):null;
  for(let remaining=delta;Math.abs(remaining)>.01;) {
    const dx=Math.sign(remaining)*Math.min(Math.abs(remaining),120),x=box.x+box.width/2,y=box.y+box.height/2;
    if(touch) {
      await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y}]});
      await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }else {
      await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y,{steps:4});await page.mouse.up();
    }
    remaining-=dx;
  }
  if(touch)await touch.detach();
}
export async function forward(page,context,profile,ms) {
  const touch=profile.hasTouch?await context.newCDPSession(page):null;
  if(touch) {
    const b=await page.locator('[data-move="forward"]').boundingBox();
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});
  }else{await page.locator('#model').focus();await page.keyboard.down('w');}
  await page.waitForTimeout(ms);
  if(touch){await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();}
  else await page.keyboard.up('w');
  await page.waitForTimeout(80);
  return JSON.parse(await page.locator('#model').getAttribute('data-position'));
}
export default {
  name:'Berghain source-derived interior furniture',
  sourceFiles:()=>['assets/models/berghain/interior-fixtures.mjs','assets/models/berghain/layout.mjs','assets/models/berghain/model.mjs',
    'assets/models/berghain/speaker-geometries.mjs','assets/models/berghain/sound-system.mjs',
    'assets/models/berghain/berghain-study.glb','assets/models/berghain/manifest.json','berghain/viewer.mjs','berghain/navigation.mjs']
    .map(path=>({path,sha256:createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')})),
  scenarios:[{id:'furniture-rooms',modes:['quick','stress'],async run({page,context,profile,baseURL,artifacts}){
    const failures=[];page.on('response',r=>{if(r.status()>=400)failures.push([r.status(),r.url()]);});
    await page.goto(baseURL+'/berghain/model.html');
    await page.locator('#model[data-ready="true"]').waitFor();
    await page.locator('#enter').click();
    await dragLook(page,context,profile,-75);
    await forward(page,context,profile,3000);
    await dragLook(page,context,profile,437.5);
    const foyer=await forward(page,context,profile,2400);
    assert.ok(canStand(foyer,layout),'natural foyer approach stays legal');
    await artifacts.screenshot(page,'foyer-channel-seats.png');
    await page.locator('#room').selectOption('panorama');
    await dragLook(page,context,profile,-295);
    await artifacts.screenshot(page,'panorama-bar.png');
    const before=JSON.parse(await page.locator('#model').getAttribute('data-position'));
    const stopped=await forward(page,context,profile,3300);
    assert.ok(Math.hypot(stopped.x-before.x,stopped.z-before.z)>.5);
    assert.ok(canStand(stopped,layout),'body remains legal at visible furniture');
    const blocked=await forward(page,context,profile,700);
    assert.ok(Math.hypot(blocked.x-stopped.x,blocked.z-stopped.z)<.025,'physical furniture stops continued forward input');
    await artifacts.screenshot(page,'bar-body-clearance.png');
    const native=await renderNativeAsset(page,{position:before,yaw:1.18});
    await artifacts.screenshot(page,'portable-glb-panorama.png');
    await disposeNativeAsset(page);
    const manifest=JSON.parse(readFileSync(new URL('../assets/models/berghain/manifest.json',import.meta.url)));
    assert.equal(native.bytes,manifest.bytes);assert.equal(native.meshes,manifest.meshes);
    for(let axis=0;axis<3;axis++)assert.ok(Math.abs(native.max[axis]-manifest.bounds.max[axis])<.01);
    assert.deepEqual(failures,[]);
    artifacts.json('furniture-route.json',{before,stopped,blocked,native});
    return {input:profile.hasTouch?'CDP touch drag and hold':'real mouse drag and keyboard',before,stopped,blocked,native,failures};
  }},
  {id:'avatar-at-bar',modes:['quick','stress'],async run({page,context,profile,baseURL,artifacts}){
    await page.goto(baseURL+'/geheim/');
    await page.locator('#model[data-ready="true"]').waitFor();
    await page.locator('#room').selectOption('panorama');
    await dragLook(page,context,profile,-295);
    await artifacts.screenshot(page,'visitor-bar-approach.png');
    const position=await forward(page,context,profile,3300);
    assert.ok(canStand(position,layout));
    await assertFirstPersonView(page);
    await assertFirstPersonView(page);
    await artifacts.screenshot(page,'visitor-bar-clearance.png');
    return {position,entryEvidence:'Authored room selector for furniture camera only; natural exterior/door flow covered separately'};
  }}]
};
