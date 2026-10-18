import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8'),prepare=source.match(/function prepareRecording\(url\)\{[^\n]+\}/)?.[0];
assert.ok(prepare);
function page(recordings,httpCache){
 const requests=[],cache=new Map();
 const factory=new Function('recordingPromises','ensureAudio','fetch','queueAssetLoad','speechCatalog',prepare+';return prepareRecording');
 const api=factory(cache,()=>({decodeAudioData:async data=>({length:1,numberOfChannels:1,body:new Uint8Array(data)[0]})}),async url=>{
  requests.push(url);
  if(!httpCache.has(url))httpCache.set(url,recordings.currentByte);
  return {ok:true,arrayBuffer:async()=>Uint8Array.of(httpCache.get(url)).buffer};
 },task=>Promise.resolve().then(task),{recordings});
 return {api,requests,cache};
}
test('a replaced voice file receives a new HTTP cache identity after page reload',async()=>{
 const path='./assets/voices/neighbors/heiko-parent-02.mp3',http=new Map();
 const oldPage=page({[path]:{sha256:'a'.repeat(64)},currentByte:1},http);
 assert.equal((await oldPage.api(path)).body,1);
 const newPage=page({[path]:{sha256:'b'.repeat(64)},currentByte:2},http);
 assert.equal((await newPage.api(path)).body,2,'the new selected take must not reuse the old profile bytes');
 assert.notEqual(newPage.requests[0],oldPage.requests[0]);
 assert.equal(newPage.requests[0],path+'?voice='+'b'.repeat(64));
 assert.equal(await newPage.api(path),await newPage.api(path));assert.equal(newPage.requests.length,1,'same-page decoded caching stays intact');
 assert.deepEqual([...newPage.cache.keys()],[path],'stimulus and cache ownership retain the canonical catalog path');
});
test('versioning preserves query/fragment and leaves unpinned or noncatalog audio alone',async()=>{
 const pinned='./voice.mp3?language=de#part',unversioned='./ambient.wav',hash='c'.repeat(64),p=page({[pinned]:{sha256:hash},'./invalid.mp3':{sha256:'invalid'},currentByte:3},new Map());
 await p.api(pinned);await p.api(unversioned);await p.api('./invalid.mp3');
 assert.deepEqual(p.requests,['./voice.mp3?language=de&voice='+hash+'#part',unversioned,'./invalid.mp3']);
});
