import test from 'node:test';
import assert from 'node:assert/strict';
import {silenceBrowserAudio} from '../tools/browser-diagnostics.mjs';

test('browser silence mutes realtime destinations while preserving hardware-free offline PCM rendering',()=>{
 const names=['HTMLMediaElement','AudioNode','OfflineAudioContext'],saved=names.map(n=>Object.getOwnPropertyDescriptor(globalThis,n)),connections=[];
 class NodeFixture{constructor(context){this.context=context;}connect(target){connections.push([this,target]);return target;}}
 class ContextFixture{constructor(){this.destination=new NodeFixture(this);this.gains=[];}createGain(){const gain=new NodeFixture(this);gain.gain={value:1};this.gains.push(gain);return gain;}}
 class OfflineFixture extends ContextFixture{}
 class MediaFixture{play(){return Promise.resolve();}}
 try{
  Object.assign(globalThis,{HTMLMediaElement:MediaFixture,AudioNode:NodeFixture,OfflineAudioContext:OfflineFixture});
  silenceBrowserAudio();
  const realtime=new ContextFixture(),speaker=new NodeFixture(realtime);speaker.connect(realtime.destination);
  assert.equal(realtime.gains.length,1);assert.equal(realtime.gains[0].gain.value,0);
  assert.ok(connections.some(([source,target])=>source===speaker&&target===realtime.gains[0]));
  const offline=new OfflineFixture(),renderNode=new NodeFixture(offline);renderNode.connect(offline.destination);
  assert.equal(offline.gains.length,0);assert.ok(connections.some(([source,target])=>source===renderNode&&target===offline.destination));
  const media=new MediaFixture();media.play();assert.equal(media.muted,true);assert.equal(media.volume,0);
 }finally{names.forEach((n,i)=>saved[i]?Object.defineProperty(globalThis,n,saved[i]):delete globalThis[n]);}
});
