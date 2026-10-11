import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {knickGenerationComplete} from '../tools/curate-voice-library.mjs';
const manifest=JSON.parse(readFileSync(new URL('../assets/voices/knick/legacy-receipts.json',import.meta.url)));
test('only the immutable audited first pass may lack native EOS receipts',()=>{
 for(const take of manifest.clips){
  assert.equal(knickGenerationComplete(take),true);
  assert.equal(knickGenerationComplete({...take,sha256:'changed'}),false);
  assert.equal(knickGenerationComplete({...take,rawSha256:'changed'}),false);
  assert.equal(knickGenerationComplete({...take,text:take.text+' changed'}),false);
  assert.equal(knickGenerationComplete({...take,profileId:'changed'}),false);
  assert.equal(knickGenerationComplete({...take,decode:{eosReached:false}}),false);
  assert.equal(knickGenerationComplete({...take,decode:{}}),false);
 }
 assert.equal(knickGenerationComplete({clipId:'new',sha256:'new'}),false);
 assert.equal(knickGenerationComplete({clipId:'new',sha256:'new',decode:{eosReached:true}}),true);
});
