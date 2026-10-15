import test from 'node:test';
import assert from 'node:assert/strict';
import {registerStreetCharacterManifest,advanceStreetAnimation,cancelStreetReaction} from '../street-character-sprites.js';
const names=['down','right','up','left','idle','talk'];
registerStreetCharacterManifest({schemaVersion:1,characters:{'quiz-hartmut':{id:'hartmut',cell:[128,160],pivot:[64,150],figureHeight:136,figureWorldHeight:1.6,grid:[8,8],strideDistance:20,clips:Object.fromEntries(names.map((name,i)=>[name,{offset:i*4,count:4,seconds:.8}])),speech:{clips:{talk:{offset:24,count:4}}},variants:Object.fromEntries(['desktop','mobile'].map(v=>[v,{file:`./assets/characters/street/test-${v}.webp`,width:1024,height:1280,sha256:'a'.repeat(64)}]))}}});
let serial=0;
const actor=()=>({id:`physical-${++serial}`,voiceId:'quiz-hartmut',x:0,y:0});
const cue=(token,status,extra={})=>({cueToken:token,speechStatus:status,mediaTime:.3,mediaDuration:2,mouthOpen:1,...extra});
const advance=(a,options,distance=0)=>advanceStreetAnimation(a,distance,.1,options);

test('two actual objects with same profile: missing projection closes old physical actor only',()=>{
 const a=actor(),b=actor();advance(a,cue('attempt-A','playing'));advance(b,cue('attempt-B','queued'));
 let p=advance(a,{});assert.equal(p.mouthOpen,0);assert.equal(p.speaking,false);assert.equal(p.cueToken,null);
 p=advance(b,cue('attempt-B','playing'));assert.equal(p.mouthCue,1);assert.equal(p.cueToken,'attempt-B');
 p=advance(a,cue('attempt-A','playing'));assert.equal(p.mouthCue??p.mouthOpen,0);assert.equal(p.cueToken,null);
});

test('cancellation before decode/start rejects both queued and late playing, then allows replacement',()=>{
 const a=actor();advance(a,cue('cancel-before-decode','cancelled'));
 for(const status of ['queued','playing','paused','finished']){const p=advance(a,cue('cancel-before-decode',status));assert.equal(p.speaking,false);assert.equal(p.cueToken,null)}
 const p=advance(a,cue('new','playing'));assert.equal(p.cueToken,'new');assert.equal(p.mouthCue,1);
});

test('native segment gap closes without retiring current attempt and resumes from supplied native clock',()=>{
 const a=actor();advance(a,cue('sequence','playing'));
 let p=advance(a,cue('sequence','playing',{mediaTime:.7,mouthOpen:undefined}));assert.equal(p.mouthCue,0);assert.equal(p.cueToken,'sequence');
 p=advance(a,cue('sequence','playing',{mediaTime:.95,mouthOpen:.6}));assert.equal(p.mouthCue,.6);assert.equal(p.cueToken,'sequence');
 p=advance(a,cue('sequence','playing',{mediaTime:2}));assert.equal(p.mouthCue,0);
});

for(const staleStatus of ['queued','playing','paused','finished','cancelled'])test(`owner pause closes mouth even when rejecting retired ${staleStatus} metadata`,()=>{
 const a=actor();advance(a,cue('old','playing'));advance(a,cue('current','playing',{mouthOpen:.7}));
 const p=advance(a,cue('old',staleStatus,{paused:true}));
 assert.equal(p.cueToken,'current');assert.equal(p.speaking,false);assert.equal(p.mouthCue,0);assert.equal(p.mouthOpen,0);
});

test('queued pause retains identity; terminal cancellation while body owner paused prevents later start',()=>{
 const a=actor();advance(a,cue('waiting','queued',{paused:true}));let p=advance(a,cue('waiting','paused',{paused:true}));assert.equal(p.cueToken,'waiting');assert.equal(p.mouthCue,0);
 p=advance(a,cue('waiting','cancelled',{paused:true}));assert.equal(p.cueToken,null);assert.equal(p.mouthCue,0);
 p=advance(a,cue('waiting','playing'));assert.equal(p.speaking,false);assert.equal(p.cueToken,null);
});

test('reaction cancellation retires current native attempt without affecting another physical object',()=>{
 const a=actor(),b=actor();advance(a,cue('a','playing'));advance(b,cue('b','playing'));cancelStreetReaction(a);
 assert.equal(advance(a,cue('a','playing')).speaking,false);assert.equal(advance(b,cue('b','playing')).mouthCue,1);
});
