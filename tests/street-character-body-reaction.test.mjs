// Source-prepared while DE4/CPU2 is reserved; execute only after terminal GO.
import test from 'node:test';
import assert from 'node:assert/strict';
import {registerStreetCharacterManifest,requestStreetReaction,cancelStreetReaction,advanceStreetAnimation,hasStreetReaction} from '../street-character-sprites.js';
const names=['down','right','up','left','idle','talk','work','wait','review'];
function setup(){
  registerStreetCharacterManifest({schemaVersion:1,characters:{'quiz-owned':{id:'owned',cell:[128,160],pivot:[64,150],figureHeight:136,figureWorldHeight:1.6,grid:[8,8],strideDistance:20,
    clips:Object.fromEntries(names.map((name,i)=>[name,{offset:i*4,count:4,seconds:.8}])),speech:{clips:{talk:{offset:40,count:4}}},
    variants:Object.fromEntries(['desktop','mobile'].map(v=>[v,{file:`./assets/characters/street/owned-${v}.webp`,width:1024,height:1280,sha256:'a'.repeat(64)}]))}}});
  return {id:'physical-owned',voiceId:'quiz-owned',x:0,y:0};
}
const native=(status,extra={})=>({cueToken:'native-item',speechStatus:status,mediaTime:.3,mediaDuration:2,mouthOpen:.7,...extra});

test('hasStreetReaction only observes pending/current and modal wait leaves an owned work intent intact',()=>{
  const a=setup(),before={...a};for(let i=0;i<3;i++)assert.equal(hasStreetReaction(a),false);assert.deepEqual(a,before);assert.equal(hasStreetReaction(null),false);
  assert.equal(requestStreetReaction(a,['work','review'],{token:'body-attempt'}),true);assert.equal(hasStreetReaction(a),true);
  if(!hasStreetReaction(a))requestStreetReaction(a,'wait');
  let p=advanceStreetAnimation(a,0,0);assert.equal(p.clip,'work');assert.equal(hasStreetReaction(a),true);
  assert.equal(cancelStreetReaction(a,{bodyOnly:true,token:'stale-body'}),false);assert.equal(hasStreetReaction(a),true);
  assert.equal(cancelStreetReaction(a,{bodyOnly:true,token:'body-attempt'}),true);assert.equal(hasStreetReaction(a),false);
});

test('body-only cancellation clears paused gesture immediately while the same native cue survives and resumes',()=>{
  const a=setup();requestStreetReaction(a,'work',{token:'body'});let p=advanceStreetAnimation(a,0,0,native('playing'));
  assert.equal(p.clip,'work');assert.equal(p.mouthCue,.7);assert.equal(p.cueToken,'native-item');
  assert.equal(cancelStreetReaction(a,{bodyOnly:true,token:'body'}),true);assert.equal(hasStreetReaction(a),false);
  p=advanceStreetAnimation(a,0,5,native('paused',{paused:true}));assert.notEqual(p.clip,'work');assert.equal(p.holdPosition,false);assert.equal(p.cueToken,'native-item');assert.equal(p.mouthCue,0);
  p=advanceStreetAnimation(a,0,.1,native('playing',{mediaTime:.8}));assert.equal(p.cueToken,'native-item');assert.equal(p.mouthCue,.7);assert.equal(p.speaking,true);assert.equal(p.clip,'talk');
});

test('default cancellation still retires native cue and body-only does not disturb accepted gait',()=>{
  const a=setup();a.x=7;let p=advanceStreetAnimation(a,7,.1,native('playing',{dx:7,dy:0}));const frame=p.frame;
  requestStreetReaction(a,'review',{token:'body'});assert.equal(cancelStreetReaction(a,{bodyOnly:true}),true);
  p=advanceStreetAnimation(a,0,0,native('playing',{paused:true}));assert.equal(p.direction,'right');assert.equal(p.frame,frame);assert.equal(p.cueToken,'native-item');
  cancelStreetReaction(a);p=advanceStreetAnimation(a,0,.1,native('playing'));assert.equal(p.speaking,false);assert.equal(p.mouthCue,0);assert.equal(p.cueToken,null);
});

test('sparse, inherited, unknown and prototype clip names cannot create a pending action',()=>{
  const a=setup(),headHole=Array(2);headHole[1]='work';const tailHole=Array(2);tailHole[0]='work';
  const inherited=Array(1);Object.setPrototypeOf(inherited,{0:'work',__proto__:Array.prototype});
  for(const invalid of [Array(1),headHole,tailHole,inherited,['toString'],['constructor'],[undefined],['missing'],[]]){
    assert.equal(requestStreetReaction(a,invalid),false);assert.equal(hasStreetReaction(a),false);
  }
});
