import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const root='.';
const scope={Uint8Array,DataView,Blob,URL,atob,crypto:crypto.webcrypto,location:{href:'http://localhost/'},fetch:async url=>{const data=fs.readFileSync(root+'/'+new URL(url,'http://localhost/').pathname.slice(1));return{ok:true,json:async()=>JSON.parse(data.toString('utf8')),arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)}}};
vm.runInNewContext(fs.readFileSync(root+'/tourist-animation.js','utf8'),scope);
const api=scope.TouristAnimations;
const vectors={down:[0,1],right:[1,0],up:[0,-1],left:[-1,0]};
let paths=0;
for(const [family,kind] of [['tourists','towelMan'],['tourists','towelWoman'],['characters','merkel'],['characters','bayern'],['characters','alice'],['characters','borderPourer']]) {
 const m=JSON.parse(fs.readFileSync(root+'/assets/'+family+'/'+kind+'/manifest.json'));
 const payload=await api.load('http://localhost/assets/'+family+'/'+kind+'/manifest.json');
 const bytes=Buffer.from(await (await fetch(payload.objectURL)).arrayBuffer());
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),m.sha256);
 URL.revokeObjectURL(payload.objectURL);
 const cycle=m.cycle_distance??24;
 const starting={spriteFrame:6};api.request(starting,...vectors.right,m);
 assert.equal(starting.gaitDistance,cycle*6/8);
 if(m.actions?.sidePour){const actor={touristFacing:'right',gaitDistance:cycle*3.5/8};assert.ok(api.action(actor,'sidePour',.5,1,m,41.6));assert.equal(actor.spriteFrame,m.actions.sidePour.keys[4].col_start+3)}
 for(const source of Object.keys(vectors)) for(const target of Object.keys(vectors)) {
  if(source===target)continue;
  const n={touristFacing:source,touristRequested:source,gaitDistance:cycle-4,spriteFrame:6,spriteRow:m.walks[source].row};
  api.request(n,...vectors[target],m);
  api.advance(n,1,.02,m);assert.equal(n.gaitDistance,cycle-3);assert.equal(n.spriteRow,m.walks[source].row);
  api.request(n,...vectors[target],m);assert.equal(n.gaitDistance,cycle-3);
  const held=n.spriteFrame;api.advance(n,0,.5,m);assert.equal(n.spriteFrame,held);assert.ok(!api.isTurning(n));
  api.advance(n,3,.02,m);assert.ok(api.isTurning(n));
  const wanted=m.transitions[source+'-to-'+target].frames;
  assert.equal(n.spriteRow,wanted[0].row);assert.equal(n.spriteFrame,wanted[0].col);
  let entered=[];
  while(api.isTurning(n)) {
   const active=n.touristTurn,index=active.index;
   entered.push([n.spriteRow,n.spriteFrame]);
   api.request(n,...vectors[source],m); // latest requests cannot restart an active core
   assert.equal(n.touristTurn.index,index);
   api.advance(n,0,active.frames[index].ms/1000,m);
  }
  assert.deepEqual(entered,wanted.map(p=>[p.row,p.col]));
  assert.equal(n.touristFacing,target);assert.equal(n.spriteFrame,0);assert.equal(n.gaitDistance,0);
  assert.equal(n.touristRequested,source); // reconsider only at the next completed stride
  api.request(n,...vectors[target],m);api.advance(n,3,.02,m);
  assert.equal(n.gaitDistance,3);assert.equal(n.spriteFrame,Math.floor(3/cycle*8));assert.equal(n.spriteFlip,false);
  paths++;
 }
}
assert.equal(paths,72);
console.log('PASS: 72 accepted manifest paths, stride queues/coalescing, frozen turns, blocked walks, same-direction gait and six exact PNG files');
