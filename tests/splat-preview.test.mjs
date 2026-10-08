import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {cycleAt,transitionAt,advanceClock,ANCHORS,ANCHOR_TIMES,BEATS,CYCLE_DURATION} from '../spark-preview-cycle.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const hash=data=>createHash('sha256').update(data).digest('hex');
const manifest=JSON.parse(read('assets/previews/knick-splats/manifest.json'));
const bytes=read('assets/previews/knick-splats/correspondence.bin');
const stride=manifest.record_bytes,slots=manifest.slots_per_anchor,count=manifest.sample_count;
function sample(pair,group,index){
 const offset=((pair*count)+(group*slots)+index)*stride;
 return {xy:Array.from({length:4},(_,i)=>bytes.readFloatLE(offset+i*4)),rgba:[...bytes.subarray(offset+16,offset+20)]};
}
test('fourteen-key correspondence stays bound to source art and bounded data',()=>{
 assert.equal(hash(read(manifest.source)),manifest.source_sha256);
 assert.equal(hash(bytes),manifest.correspondence_sha256);
 const parts=read('assets/previews/knick-splats/parts.bin');assert.equal(hash(parts),manifest.parts_sha256);assert.equal(parts.length,count*14);assert(parts.every(v=>v<=2));
 assert.equal(bytes.length,count*14*20);
 assert.equal(manifest.record_bytes,20);assert.equal(manifest.segment_count,14);
 for(let pair=0;pair<14;pair++)for(let group=0;group<2;group++){
  let visible=0;
  for(let index=0;index<slots;index++){
   const s=sample(pair,group,index);
   assert(s.xy.every(v=>Number.isFinite(v)&&Math.abs(v)<4),'invalid registered position');
   if(s.rgba[3])visible++;
  }
  assert.equal(visible,manifest.anchor_sample_counts[(pair+group)%14]);
 }
 assert.match(manifest.status,/preview-only/);
});
test('every segment boundary and the loop seam preserve exactly the same painted sample',()=>{
 for(let anchor=0;anchor<14;anchor++)for(let index=0;index<manifest.anchor_sample_counts[anchor];index++){
  const incoming=sample((anchor+13)%14,1,index),outgoing=sample(anchor,0,index);
  assert.deepEqual(incoming.xy.slice(2),outgoing.xy.slice(0,2));
  assert.deepEqual(incoming.rgba,outgoing.rgba);
 }
});
test('transport never drifts lower-leg and shoe samples',()=>{
 for(let pair=0;pair<14;pair++)for(let group=0;group<2;group++)for(let index=0;index<slots;index++){
  const {xy,rgba}=sample(pair,group,index);
  if(rgba[3]&&xy[group*2+1]<-1.37)assert.deepEqual(xy.slice(0,2),xy.slice(2));
 }
});
test('performance visits all anchors and has continuous, ordered segment timing',()=>{
 assert.equal(CYCLE_DURATION,6.25);
 assert.deepEqual(ANCHOR_TIMES.map(t=>{const s=cycleAt(t);return(s.pair+s.phase)%14}),Array.from({length:14},(_,i)=>i));
 for(let i=0;i<BEATS.length;i++){
  const b=BEATS[i];assert.equal(b.start,i?BEATS[i-1].end:0);assert(b.end>b.start);
  if(i){const left=cycleAt(b.start-1e-7),right=cycleAt(b.start);assert(Math.abs(left.pair+left.phase-right.pair-right.phase)<1e-5)}
 }
 assert.equal(cycleAt(CYCLE_DURATION).pair+cycleAt(CYCLE_DURATION).phase,14);
 assert(Math.abs(advanceClock(6.15,.3,1,true)-.2)<1e-12);
 assert.equal(advanceClock(6.15,.3,1,false),6.25);
 assert.equal(advanceClock(2,2,.25,false),2.5);
 assert.equal(advanceClock(2,0,1,true),2);
});
test('Spark is pinned and the experiment is outside canonical game imports',()=>{
 assert.equal(hash(read('assets/vendor/spark/2.3.1/spark.module.js')),'2de375d5e489692f976abe3199c8435ecc00f97fabaf35e489eb7d368e1f6f60');
 for(const file of ['index.html','3d.html','game.js','world3d.js'])assert(!read(file).includes(Buffer.from('spark-preview')));
 const html=read('spark-preview.html').toString();assert.match(html,/three@0\.186\.0/);assert(!html.includes('output/'));
});

test('unsafe anatomy uses only intact paint with no position transport',()=>{
 assert.equal(manifest.transitions.length,14);
 assert.deepEqual(manifest.transitions.flatMap((p,i)=>p.mode==='splat'?[i]:[]),[0,1,2,5,6,7,13]);
 for(let pair=0;pair<14;pair++)if(manifest.transitions[pair].mode==='pose'){
  for(let group=0;group<2;group++)for(let index=0;index<slots;index++){
   const {xy,rgba}=sample(pair,group,index);
   if(rgba[3])assert.deepEqual(xy.slice(0,2),xy.slice(2),'protected pose must never warp');
  }
 }
});
test('fourteen registered key files and generated source hashes match',()=>{
 assert.equal(ANCHORS.length,14);
 const registration=JSON.parse(read('assets/previews/knick-splats/bridge-registration.json'));
 assert.equal(hash(read('assets/previews/knick-splats/bridge-registration.json')),manifest.registration_sha256);
 assert.equal(registration.bridges.length,10);
 for(const anchor of manifest.anchors){
  assert.equal(hash(read('assets/previews/knick-splats/'+anchor.file)),anchor.sha256);
  assert.equal(hash(read('assets/previews/knick-splats/'+anchor.preview)),anchor.preview_sha256);
 }
 for(const bridge of registration.bridges)assert.equal(hash(read(bridge.source_file)),bridge.source_sha256);
});
test('paper belongs to the hand exactly between pickup and release keys',()=>{
 const at=t=>transitionAt(t,manifest.transitions);
 assert.deepEqual(ANCHOR_TIMES.map(t=>at(t).paperInHand),[false,false,false,false,true,true,true,true,true,true,false,false,false,false]);
 for(const beat of BEATS)if(beat.to!==beat.from){
  for(const f of [.01,.49,.51,.99]){
   const state=at(beat.start+(beat.end-beat.start)*f);
   assert.equal(state.guarded,manifest.transitions[state.pair].mode==='pose');
   if(state.guarded)assert.equal(state.anchor,(state.pair+(state.phase>=.5?1:0))%14);
  }
 }
 assert.equal(at(0).anchor,at(CYCLE_DURATION).anchor);assert.equal(at(0).paperInHand,at(CYCLE_DURATION).paperInHand);
});

test('moving clock passes through all keys without easing stops or held intervals',()=>{
 for(const beat of BEATS){
  assert.equal(beat.from,0);assert.equal(beat.to,1);
  const a=cycleAt(beat.start+(beat.end-beat.start)*.2),b=cycleAt(beat.start+(beat.end-beat.start)*.8);
  assert(Math.abs(a.phase-.2)<1e-10);assert(Math.abs(b.phase-.8)<1e-10);
  if(manifest.transitions[beat.pair].mode==='pose')assert(beat.end-beat.start<=.100001,'protected handoffs cannot create long holds');
 }
});
test('rigid part curves join continuously without overshooting anchor bounds',()=>{
 for(const name of ['head_curve','stamp_curve'])for(let i=0;i<14;i++){
  const [a,b,va,vb]=manifest.transitions[i][name],next=manifest.transitions[(i+1)%14][name];
  assert.deepEqual(b,next[0]);
  const dt=BEATS[i].end-BEATS[i].start,nt=BEATS[(i+1)%14].end-BEATS[(i+1)%14].start;
  for(let c=0;c<2;c++)assert(Math.abs(vb[c]/dt-next[2][c]/nt)<1e-10,'part center velocity must join');
  for(let j=0;j<=20;j++){
   const t=j/20,t2=t*t,t3=t2*t;
   for(let c=0;c<2;c++){
    const v=(2*t3-3*t2+1)*a[c]+(t3-2*t2+t)*va[c]+(-2*t3+3*t2)*b[c]+(t3-t2)*vb[c];
    assert(v>=Math.min(a[c],b[c])-1e-9&&v<=Math.max(a[c],b[c])+1e-9);
   }
  }
 }
});
