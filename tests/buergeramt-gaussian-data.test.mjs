import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=new URL('../',import.meta.url),folder=new URL('../assets/buergeramt/animation/',import.meta.url),hash=b=>createHash('sha256').update(b).digest('hex');
const read=file=>readFileSync(new URL(file,root));
function paint(buffer,count,segment,end){
 const points=[];
 for(let n=0;n<count;n++){
  const offset=(segment*count+n)*24,color=offset+(end?20:16);
  if(!buffer[color+3])continue;
  points.push(buffer.subarray(offset+(end?8:0),offset+(end?16:8)).toString('hex')+buffer.subarray(color,color+4).toString('hex'));
 }
 return points.sort();
}

test('newly visible Knick paper travels beside its hand instead of fading at the destination',()=>{
 const manifest=JSON.parse(readFileSync(new URL('clerk.json',folder)));
 const segment=manifest.segments.findIndex(pair=>pair.from==='raised'&&pair.to==='stamp-1');
 const state=id=>manifest.states.find(item=>item.id===id),hand=item=>Array.isArray(item.landmarks)?item.landmarks[11]:item.landmarks.hand_left;
 const a=hand(state('raised')),b=hand(state('stamp-1')),[w,h]=manifest.canvas_xy;
 for(const variant of Object.values(manifest.variants)){
  const data=gunzipSync(readFileSync(new URL(variant.file,folder)));let checked=0;
  for(let slot=0;slot<variant.sample_count;slot++){
   const offset=(segment*variant.sample_count+slot)*24;
   const end=[data.readFloatLE(offset+8)*h+w/2,h-data.readFloatLE(offset+12)*h];
   // Interior paper samples, well clear of polygon edges and the hand.
   if(data[offset+19]!==0||data[offset+23]===0||end[0]<850||end[0]>970||end[1]<342||end[1]>361)continue;
   const start=[data.readFloatLE(offset)*h+w/2,h-data.readFloatLE(offset+4)*h];
   assert(Math.hypot(start[0]-end[0]-(a[0]-b[0]),start[1]-end[1]-(a[1]-b[1]))<.001,
    'invisible paper endpoint must preserve its offset to the moving grip');
   checked++;
  }
  assert(checked>=30,'exercise substantial visible paper in both variants');
 }
});

for(const id of ['nachtschichtmelderin','kopiependler'])test(`${id} new leg paint begins on existing paint rather than in empty air`,()=>{
 const manifest=JSON.parse(readFileSync(new URL(`${id}.json`,folder)));
 for(const variant of Object.values(manifest.variants)){
  const data=gunzipSync(readFileSync(new URL(variant.file,folder))),count=variant.sample_count,segment=1;
  const support=[],births=[];
  for(let slot=0;slot<count;slot++){
   const offset=(segment*count+slot)*24;
   if(data[offset+19]>0)support.push([data.readFloatLE(offset),data.readFloatLE(offset+4)]);
   if(data[offset+19]===0&&data[offset+23]>0&&data.readFloatLE(offset+12)<.45)
    births.push([data.readFloatLE(offset),data.readFloatLE(offset+4)]);
  }
  assert(births.length>0,'exercise the observed unmatched lower-body paint');
  const radius=variant.stride_px/manifest.canvas_xy[1]+1e-6;
  for(const point of births)assert(support.some(q=>Math.hypot(point[0]-q[0],point[1]-q[1])<=radius),
    'an invisible starting point outside painted support creates a detached transition tail');
 }
});
for(const file of readdirSync(folder).filter(f=>f.endsWith('.json'))){
 const manifest=JSON.parse(readFileSync(new URL(file,folder)));
 test(`${manifest.id} sources, compressed data and exact endpoint seams remain bound`,()=>{
  for(const state of manifest.states)assert.equal(hash(read(state.file)),state.sha256,state.id);
  assert.equal(manifest.anchors.maximum_resident,3);
  for(const state of manifest.states){const frame=manifest.anchors.frames[state.id],bytes=readFileSync(new URL(frame.file,folder));assert.equal(hash(bytes),frame.sha256);assert.equal(bytes.length,frame.bytes);assert.deepEqual([frame.width,frame.height],manifest.canvas_xy)}
  assert(manifest.states.some(s=>s.role==='transition'),'action needs actual bridge paint');
  for(const variant of Object.values(manifest.variants)){
   const zipped=readFileSync(new URL(variant.file,folder)),data=gunzipSync(zipped);
   assert.equal(hash(zipped),variant.sha256);assert.equal(hash(data),variant.decoded_sha256);assert.equal(data.length,variant.decoded_bytes);assert.equal(zipped.length,variant.bytes);
   for(let a=0;a<manifest.segments.length;a++)for(let b=0;b<manifest.segments.length;b++)if(manifest.segments[a].to===manifest.segments[b].from){
    assert.deepEqual(paint(data,variant.sample_count,a,true),paint(data,variant.sample_count,b,false),`seam ${a} → ${b}`);
   }
  }
 });
}
