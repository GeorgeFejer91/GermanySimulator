import assert from 'node:assert/strict';
import lounge,{travel} from './lounge-playtest.mjs';
import {compareMaterialRender} from './material-playtest.mjs';
import {dragLook,assertFirstPersonView} from './fixture-playtest.mjs';
import {cross} from './lab-playtest.mjs';
import {layout,viewpoints} from '../assets/models/berghain/layout.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';
const point=(x,y,z)=>Object.values(studyToSite({x,y,z}));
const pos=async page=>JSON.parse(await page.locator('#model').getAttribute('data-position'));
export default {name:'Garderobe and complete admission route',sourceFiles:lounge.sourceFiles,scenarios:[
 ...[
  ['wardrobe-counter',[-11,1.73,13.8],[-16,1.35,17.1]],
  ['wardrobe-seating',[-10.7,1.73,14.2],[-16,.6,12.6]]
 ].map(([id,position,target])=>({id,modes:['quick','stress'],timeoutMs:150000,
  async run(ctx){return compareMaterialRender(ctx,{position:point(...position),target:point(...target),clubNight:true});}})),
 {id:'wardrobe-natural-route',modes:['quick','stress'],timeoutMs:300000,async run(ctx){
  const {page,baseURL,artifacts}=ctx;const records=[];
  await page.goto(baseURL+'/geheim/');await page.locator('#model[data-ready="true"]').waitFor();
  let heading=0;
  async function walk(targets){for(const target of targets){const step=await travel(ctx,target,heading);heading=step.yaw;records.push(step);}}
  async function look(yaw){const turn=Math.atan2(Math.sin(yaw-heading),Math.cos(yaw-heading));await dragLook(page,ctx.context,ctx.profile,-turn/.004);heading=yaw;await assertFirstPersonView(page);}
  await walk(layout.admission.route.slice(1,9));await cross(ctx);
  await walk(layout.admission.route.slice(10,13));await look(0);
  await artifacts.screenshot(page,'ticket-counter.png');
  await walk(layout.admission.route.slice(13));
  await walk(layout.wardrobe.serviceRoute.slice(2));await look(Math.PI);
  await artifacts.screenshot(page,'cloakroom-counter.png');
  await look(0);await artifacts.screenshot(page,'changing-couches.png');
  await walk([...layout.wardrobe.serviceRoute].reverse());
  await walk(layout.groundSanitary.route.slice(1));await artifacts.screenshot(page,'cloakroom-toilets.png');
  await walk([...layout.groundSanitary.route].reverse());
  await walk(layout.architecturalCirculation.wardrobeConnection.siteRoute);
  await artifacts.screenshot(page,'foyer-connection.png');
  await walk([...layout.architecturalCirculation.wardrobeConnection.siteRoute].reverse());
  await walk([...layout.admission.route.slice(9,-1)].reverse());
  await travel(ctx,{x:0,y:.05,z:20.25},heading);await cross(ctx);assert.ok((await pos(page)).z>24);
  // Same public fittings with unavailable textures; no alternate geometry.
  await page.route('**/assets/models/berghain/textures/**',route=>route.abort());
  await page.goto(baseURL+'/berghain/model.html');await page.locator('#model[data-ready="true"]').waitFor();
  await page.locator('#enter').click();await page.locator('#room').selectOption('admission');heading=viewpoints.admission.yaw;
  await walk(layout.admission.route.slice(11));await walk(layout.wardrobe.serviceRoute.slice(2));
  await look(Math.PI);await artifacts.screenshot(page,'fallback-counter.png');await look(0);await artifacts.screenshot(page,'fallback-couches.png');
  await page.locator('#exterior').click();assert.equal(JSON.parse(await page.locator('#model').getAttribute('data-lighting')).daylight,true);
  await artifacts.json('route.json',records);
  return {segments:records.length,scope:'Actual keyboard/touch queue, security, cashier, curtain, service aisle, WC and foyer, return outside; fallback walk and daylight restoration. One visitor, emulated devices; no measured-room claim.'};
 }}
]};
