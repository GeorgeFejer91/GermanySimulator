import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMouthProfile,mouthProfileValues} from '../buergeramt-mouth-paint.js';

const profile=()=>({
 crease:[0,0,0,0,0],
 open_upper:[0,-.2,-.3,-.2,0],
 open_lower:[0,.5,1,.5,0],
 source_upper:[0,0,0,0,0],
 source_lower:[0,0,0,0,0],
 corners:[-1,1],width:[.1,.2],teeth:.2
});

test('lower lip opening stays below the shader identity guard without changing packed controls',()=>{
 const p=profile();p.open_lower[2]=2.9;
 assert.equal(validateMouthProfile(p,'street-lower-boundary'),p);
 assert.equal(mouthProfileValues(p).curves[10],2.9);
 for(const value of [2.900001,3,Infinity,NaN]){
  const invalid=profile();invalid.open_lower[2]=value;
  assert.throws(()=>validateMouthProfile(invalid,'street-lower-boundary'),/native lip profile/);
 }
});

test('the other curves, attached corners and crossed surfaces retain their limits',()=>{
 for(const name of ['crease','open_upper','source_upper','source_lower']){
  for(const value of [-1.500001,1.500001]){
   const p=profile();p[name][2]=value;
   assert.throws(()=>validateMouthProfile(p,name),/native lip profile/);
  }
 }
 for(const change of [p=>p.open_lower[2]=-1.500001,p=>p.open_lower[0]=.1,p=>p.open_lower[2]=-.1]){
  const p=profile();change(p);
  assert.throws(()=>validateMouthProfile(p,'street-invalid'),/native lip/);
 }
});
