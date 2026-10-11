// Silent, real MP3 onset/pause/rate receipts for every existing office clip.
// Forced dialogue validates timing/ownership, not natural mission progression.
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {speechMouthTracks} from '../assets/buergeramt/speech/mouth-cues.js';
import {sampleTimedMouth} from '../buergeramt-lipsync.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=process.env.PLAYTEST_OUTPUT||'output/mouth-sync/recordings';mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio']});
try{
 const context=await browser.newContext({viewport:{width:1280,height:800}});
 await context.addInitScript(()=>{
  const NativeAudio=window.Audio;window.Audio=function(...args){const media=new NativeAudio(...args);media.muted=true;(window.mouthPlayers??=[]).push(media);return media};
  const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.muted=true;return play.apply(this,args)};
  const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(target,...args){if(target===this.context.destination){const mute=this.context.createGain();mute.gain.value=0;connect.call(mute,target);return connect.call(this,mute,...args)}return connect.call(this,target,...args)};
  speechSynthesis.speak=u=>{u.volume=0;u.onstart?.()};speechSynthesis.cancel=()=>{};
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/buergeramt.js?*',r=>r.fulfill({contentType:'text/javascript',body:readFileSync('buergeramt.js','utf8').replace(/\}\)\(\);\s*$/,'window.__mouthProbe={content,cancelSpeech,get options(){return options}};})();')}));
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8876/index.html?geheim=buergeramt',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.Germany3D?.officeAssetsReady&&window.BuergeramtLevel?.active,null,{timeout:90000});
 await page.evaluate(()=>{BuergeramtLevel.update=()=>{};__mouthProbe.options.voiceOn=()=>true;window.mouthCatalog=GermanySimulatorAudioText});
 const reports=[];
 for(const [path,track] of Object.entries(speechMouthTracks)){
  await page.evaluate(({path,text})=>{
   GermanySimulatorAudioText={...mouthCatalog,candidateClip:()=>path};
   __mouthProbe.content('FRAU KNICK',text);
  },{path,text:track.source});
  await page.waitForFunction(path=>{const media=mouthPlayers.findLast(media=>media.getAttribute('src')===path);if(BuergeramtLevel.lipSpeech.timing==='audio-cues'&&BuergeramtLevel.lipSpeech.recording===path&&media&&!media.paused){window.mouthMedia=media;return true}},path,{timeout:10000});
  const traces=[];
  for(let n=0;n<5;n++){
   const receipt=await page.evaluate(()=>{const pose=BuergeramtLevel.lipSpeech;return{pose,mediaTime:mouthMedia.currentTime,rate:mouthMedia.playbackRate}});
   const expected=sampleTimedMouth(track,receipt.pose.time);
   assert.deepEqual(receipt.pose.shape,[expected.open,expected.spread,expected.round,expected.bite]);
   assert(Math.abs(receipt.mediaTime-receipt.pose.time)<.04,`${track.clipId}: media ${receipt.mediaTime}, pose ${receipt.pose.time}`);traces.push(receipt);await page.waitForTimeout(90);
  }
  const held=await page.evaluate(()=>{mouthMedia.pause();return BuergeramtLevel.lipSpeech});await page.waitForTimeout(130);
  assert.deepEqual(await page.evaluate(()=>BuergeramtLevel.lipSpeech.shape),held.shape);
  await page.evaluate(()=>{mouthMedia.playbackRate=1.5;return mouthMedia.play()});await page.waitForTimeout(100);
  const resumed=await page.evaluate(()=>BuergeramtLevel.lipSpeech);assert(resumed.time>held.time);
  assert.deepEqual(resumed.shape,Object.values(sampleTimedMouth(track,resumed.time)).slice(0,4));
  await page.evaluate(()=>__mouthProbe.cancelSpeech());assert.equal(await page.evaluate(()=>BuergeramtLevel.lipSpeech.actor),null);
  reports.push({path,sha256:track.audioSha256,traces,held,resumed});console.log(track.clipId,'PASS');
 }
 assert.deepEqual(errors,[]);writeFileSync(output+'/results.json',JSON.stringify({silent:true,forcedDialogue:true,physicalAndroid:false,seeking:false,tracks:reports,errors},null,2));
 await context.close();
}finally{await browser.close()}
