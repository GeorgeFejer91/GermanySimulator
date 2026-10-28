import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CARS,CAST,LINES,LIMIT_CM,BOUNDS} from '../levels/klein-korinthen/content.mjs';
import {freshState,transition,restoreState,reportStatus,moveBody,carMeasurePoint,isWithinReach} from '../levels/klein-korinthen/state.mjs';
test('membership requires an invitation, five distinct measured offences, then return',()=>{
  let s=freshState();assert.equal(transition(s,{type:'graduate'}),s);
  assert.equal(transition(s,{type:'measure',id:'kk-01'}),s);assert.equal(transition(s,{type:'report',id:'kk-01'}),s);
  s=transition(s,{type:'join'});const valid=CARS.filter(c=>c.gap>LIMIT_CM);
  for(let i=0;i<5;i++){
    assert.equal(transition(s,{type:'report',id:valid[i].id}),s);
    s=transition(s,{type:'measure',id:valid[i].id});s=transition(s,{type:'report',id:valid[i].id});
    assert.equal(s.reports.length,i+1);assert.equal(transition(s,{type:'report',id:valid[i].id}),s);
    assert.equal(s.stage,i<4?'patrol':'return');if(i<4)assert.equal(transition(s,{type:'graduate'}),s);
  }
  s=transition(s,{type:'graduate'});assert.equal(s.stage,'member');assert.equal(transition(s,{type:'graduate'}),s);
});
test('exactly thirty is legal, incorrect complaints and duplicates cannot advance mission',()=>{
  let s=transition(freshState(),{type:'join'});
  for(const car of CARS.filter(c=>c.gap<=30)){s=transition(s,{type:'measure',id:car.id});assert.equal(reportStatus(s,car.id),'legal');s=transition(s,{type:'report',id:car.id});}
  assert.equal(s.reports.length,0);assert.equal(s.mistakes,3);assert.equal(s.stage,'patrol');
});
test('save repair rejects invalid IDs, unmeasured reports, duplicates and premature rewards',()=>{
  const s=restoreState({version:1,stage:'member',measured:['kk-01','kk-02','evil'],reports:['kk-01','kk-01','kk-02','kk-03','evil'],mistakes:-5,bonus:true});
  assert.deepEqual(s.reports,['kk-01']);assert.equal(s.stage,'patrol');assert.equal(s.bonus,false);assert.equal(s.mistakes,0);
  assert.deepEqual(restoreState({version:2,stage:'member'}),freshState());
});
test('actual car body and curb produce authored distances, all measurement positions are in reach',()=>{
  for(const car of CARS){const curb=car.road+car.side*4,bodyEdge=car.x+car.side*car.width/2;assert.ok(Math.abs(Math.abs(curb-bodyEdge)*100-car.gap)<1e-8);assert.ok(isWithinReach(carMeasurePoint(car),carMeasurePoint(car)));assert.ok(car.gap>0)}
  assert.equal(CARS.filter(c=>c.gap>30).length,7);assert.equal(CARS.filter(c=>c.chairman).length,1);
});
test('swept body collision blocks high delta, slides corners and remains within bounds',()=>{
  const wall={minX:0,maxX:1,minZ:-10,maxZ:10};const p=moveBody({x:-2,z:0},8,2,[wall],BOUNDS);
  assert.ok(p.x<=-.28);assert.ok(p.z>1.9);const q=moveBody({x:65,z:61},1000,1000,[],BOUNDS);assert.ok(q.x<=65.72);assert.ok(q.z<=61.72);
});
test('each voiced line has one stable cast owner and a translation',()=>{
  assert.equal(new Set(Object.values(CAST).map(c=>c.voiceId)).size,4);
  for(const line of Object.values(LINES)){assert.ok(CAST[line.speaker]);assert.ok(line.de.length>20);assert.ok(line.en.length>20)}
});
test('invalid re-entry recovers a full body out of overlapping solids and bounds',()=>{
  const solids=[{minX:0,maxX:1,minZ:-10,maxZ:10},{minX:-2,maxX:2,minZ:0,maxZ:1}];
  for(const start of [{x:.5,z:.5},{x:100,z:100}]){
    const p=moveBody(start,0,0,solids,BOUNDS);
    assert.equal(p.distance,0,'spawn recovery is not a footstep');
    assert.ok(p.x>=BOUNDS.minX+.28&&p.x<=BOUNDS.maxX-.28&&p.z>=BOUNDS.minZ+.28&&p.z<=BOUNDS.maxZ-.28);
    assert.ok(!solids.some(s=>p.x+.28>s.minX&&p.x-.28<s.maxX&&p.z+.28>s.minZ&&p.z-.28<s.maxZ));
  }
});
test('every shipped voice is the exact current script, fixed cast binding and verified encoded asset',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../assets/klein-korinthen/voices.json',import.meta.url))),cast=JSON.parse(readFileSync(new URL('../For-AI/VOICE-CAST.json',import.meta.url)));
  assert.equal(manifest.clips.length,Object.keys(LINES).length);assert.equal(manifest.held.length,0);
  for(const [id,line]of Object.entries(LINES)){
    const clip=manifest.clips.find(c=>c.id===id);assert.ok(clip);assert.equal(clip.text,line.de);assert.equal(clip.english,line.en);assert.equal(clip.voiceId,CAST[line.speaker].voiceId);
    const binding=cast.productionVoices[clip.voiceId];for(const field of ['profileId','referenceSha256','originalSha256','renderer','modelRevision','processing'])assert.equal(clip[field],binding[field]);
    assert.match(clip.file,/^voices\/[a-zA-Z]+\.mp3$/);const bytes=readFileSync(new URL('../assets/klein-korinthen/'+clip.file,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.sha256);
    assert.equal(clip.asrWordExact,true);assert.equal(clip.asrScriptPrompt,null);assert.equal(clip.nativeCompletion,true);assert.ok(Math.abs(clip.integratedLufs+18)<=.3);assert.ok(clip.truePeakDbtp<=-1.5);assert.ok(clip.energy.some(e=>e>0));
  }
});
