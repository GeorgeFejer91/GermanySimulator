import test from 'node:test';
import assert from 'node:assert/strict';
import {registerStreetCharacterManifest,advanceStreetAnimation,cancelStreetReaction} from '../street-character-sprites.js';
const names=['down','right','up','left','idle','talk'];
const person={id:'hartmut',cell:[128,160],pivot:[64,150],figureHeight:136,figureWorldHeight:1.6,grid:[8,8],strideDistance:20,
  clips:Object.fromEntries(names.map((name,i)=>[name,{offset:i*4,count:4,seconds:.8}])),
  speech:{clips:{talk:{offset:24,count:4}}},
  variants:Object.fromEntries(['desktop','mobile'].map(v=>[v,{file:`./assets/characters/street/test-${v}.webp`,width:1024,height:1280,sha256:'a'.repeat(64)}]))};
registerStreetCharacterManifest({schemaVersion:1,characters:{'quiz-hartmut':person}});
const actor=()=>({id:Math.random().toString(),voiceId:'quiz-hartmut',x:0,y:0});
const cue=(token,status,extra={})=>({cueToken:token,speechStatus:status,mediaTime:.3,mediaDuration:2,mouthOpen:1,...extra});
const advance=(a,options,distance=0)=>advanceStreetAnimation(a,distance,.1,options);

test('queued and paused do not articulate; the same attempt resumes from native time',()=>{
  const a=actor();
  let p=advance(a,cue('a','queued',{speaking:true}));assert.equal(p.speaking,false);assert.equal(p.mouthOpen,0);assert.equal(p.cueToken,'a');
  p=advance(a,cue('a','playing'));assert.equal(p.speaking,true);assert.equal(p.mouthOpen,1);assert.equal(p.mouthCue,1);
  p=advance(a,cue('a','paused'));assert.equal(p.speaking,false);assert.equal(p.mouthOpen,0);assert.equal(p.cueToken,'a');
  p=advance(a,cue('a','playing',{mediaTime:.8,mouthOpen:.4}));assert.equal(p.mouthCue,.4);assert.equal(p.speaking,true);
  p=advance(a,cue('a','playing',{paused:true}));assert.equal(p.speechStatus,'paused');assert.equal(p.mouthOpen,0);assert.equal(p.cueToken,'a');
  p=advance(a,cue('a','playing'));assert.equal(p.mouthCue,1);assert.equal(p.speaking,true);
});

for(const end of ['finished','cancelled'])test(`${end} retires exact attempt, queued replacement and stale receipts preserve newer owner`,()=>{
  const a=actor();advance(a,cue('old','playing'));let current=advance(a,cue('new','queued'));
  for(const status of ['queued','playing','paused',end]){const p=advance(a,cue('old',status));assert.equal(p.cueToken,'new');assert.equal(p.speechStatus,'queued');assert.equal(p.mouthCue,0)}
  current=advance(a,cue('new','playing'));assert.equal(current.speaking,true);
  let p=advance(a,cue('old',end));assert.equal(p.cueToken,'new');assert.equal(p.mouthCue,1);
  p=advance(a,cue('new',end));assert.equal(p.cueToken,null);assert.equal(p.speaking,false);assert.equal(p.mouthCue,0);
  p=advance(a,cue('new','playing'));assert.equal(p.speaking,false);assert.equal(p.cueToken,null);
});

test('same voice on two physical actors keeps independent cue identity',()=>{
  const a=actor(),b=actor();advance(a,cue('a','playing'));let p=advance(b,cue('b','queued'));assert.equal(p.mouthCue,0);
  advance(a,cue('a','cancelled'));p=advance(b,cue('b','playing'));assert.equal(p.cueToken,'b');assert.equal(p.mouthCue,1);
});

test('a moving body keeps displacement phase and exposes owned cue separately from flat-only mouth',()=>{
  const a=actor();a.x=7;
  let p=advance(a,cue('a','playing',{dx:7,dy:0}),7);assert.equal(p.direction,'right');assert.equal(p.frame,1);assert.equal(p.clip,'right');assert.equal(p.mouthOpen,0);assert.equal(p.mouthCue,1);assert.equal(p.holdPosition,false);
  p=advance(a,cue('a','paused',{dx:0,dy:0}),0);assert.equal(p.mouthCue,0);assert.equal(p.holdPosition,false);
});

test('native onset/end/missing energy and terminal-before-start fail closed',()=>{
  const a=actor();for(const extra of [{mediaTime:0},{mediaTime:.025},{mediaTime:2},{mouthOpen:undefined},{mouthOpen:NaN}])assert.equal(advance(a,cue('a','playing',extra)).mouthCue,0);
  advance(a,cue('a','finished'));assert.equal(advance(a,cue('a','playing')).speaking,false);
  const b=actor();advance(b,cue('cancel-before-decode','cancelled'));assert.equal(advance(b,cue('cancel-before-decode','playing')).speaking,false);
  const c=actor();advance(c,cue('own','playing'));cancelStreetReaction(c);assert.equal(advance(c,cue('own','playing')).speaking,false);
});

for(const staleStatus of ['queued','playing','paused','finished','cancelled'])test(`paused body suppresses retained current lips even when stale ${staleStatus} arrives`,()=>{
  const a=actor();advance(a,cue('old','playing'));advance(a,cue('current','playing',{mouthOpen:.7}));
  const p=advance(a,cue('old',staleStatus,{paused:true}));
  assert.equal(p.cueToken,'current');assert.equal(p.speechStatus,'paused');assert.equal(p.speaking,false);assert.equal(p.mouthCue,0);assert.equal(p.mouthOpen,0);
  const resumed=advance(a,cue('current','playing',{mediaTime:1,mouthOpen:.4}));assert.equal(resumed.cueToken,'current');assert.equal(resumed.speechStatus,'playing');assert.equal(resumed.mouthCue,.4);
});
