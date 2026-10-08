// Real WebGL and Web Audio; every output path stays muted before navigation.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=process.env.PLAYTEST_OUTPUT||'output/omen-playtest';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--mute-audio','--use-gl=angle','--use-angle=swiftshader']});
const reports=[];
const controlledSpeech=process.env.PLAYTEST_SPEECH_RIG==='1';
try{
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['android-emulation',{width:390,height:844}],['narrow',{width:320,height:700}]].filter(([name])=>!process.env.PLAYTEST_VIEWPORT||process.env.PLAYTEST_VIEWPORT===name)){
  const page=await browser.newPage({viewport,isMobile:name!=='desktop',hasTouch:name!=='desktop'}),errors=[],loadFailures=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('requestfailed',request=>loadFailures.push({url:request.url(),error:request.failure()?.errorText}));
  await page.addInitScript(controlled=>{
   // Pace graphics in software-rendered tests; the audio clock remains native.
   const frame=requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>setTimeout(()=>frame(callback),50);
   const mediaPlay=HTMLMediaElement.prototype.play;
   HTMLMediaElement.prototype.play=function(...args){this.muted=true;this.volume=0;return mediaPlay.apply(this,args)};
   const speak=speechSynthesis.speak.bind(speechSynthesis);
   speechSynthesis.speak=utterance=>{
    utterance.volume=0;
    if(controlled){if(utterance.text==='Wer die Finsternis sieht, hat sie selbst gewählt!'){window.omenTestSpeech=utterance;utterance.onstart?.();utterance.onpause?.()}else{utterance.onstart?.();utterance.onend?.()}return}
    if(utterance.text==='Wer die Finsternis sieht, hat sie selbst gewählt!'){
     const receipts=window.omenPlatformEvents=[];
     for(const name of ['start','boundary','pause','resume','end','error']){const handler=utterance[`on${name}`];utterance[`on${name}`]=event=>{receipts.push({name,charIndex:event.charIndex,elapsedTime:event.elapsedTime,error:event.error});handler?.(event)}}
    }
    speak(utterance);
   };
   const connect=AudioNode.prototype.connect,mutes=new WeakMap(),edges=new WeakMap();
   AudioNode.prototype.connect=function(destination,...args){
    if(destination instanceof AudioDestinationNode){let mute=mutes.get(destination);if(!mute){mute=this.context.createGain();mute.gain.value=0;connect.call(mute,destination);mutes.set(destination,mute)}destination=mute}
    edges.set(this,destination);return connect.call(this,destination,...args);
   };
   window.omenAudioEvidence={sources:[],contexts:[],edges};
   const Native=window.AudioContext;
   window.AudioContext=class extends Native{
    constructor(...args){super(...args);window.omenAudioEvidence.contexts.push(this)}
    createBufferSource(){const source=super.createBufferSource(),record={source,start:null,stop:null};window.omenAudioEvidence.sources.push(record);const start=source.start.bind(source),stop=source.stop.bind(source);source.start=(...args)=>{record.start=this.currentTime;return start(...args)};source.stop=(at)=>{record.stop=at;return stop(at)};return source}
   };
  },controlledSpeech);
  await page.goto(`${process.env.GAME_URL||'http://127.0.0.1:8876/index.html'}?geheim=buergeramt`,{waitUntil:'commit',timeout:60000});
  await page.waitForFunction(()=>window.BuergeramtLevel?.active&&window.Germany3D?.ready&&Germany3D.amtOffice?.attached&&Germany3D.amtCharacters.length===14&&Germany3D.amtCharacters.every(actor=>actor.loaded),null,{timeout:180000}).catch(async error=>{console.error(JSON.stringify(await page.evaluate(()=>({ready:window.Germany3D?.ready,active:window.BuergeramtLevel?.active,office:window.Germany3D?.amtOffice,characters:window.Germany3D?.amtCharacters}))),errors,loadFailures);throw error});
  // Hold simulation at reviewable states while real browser audio keeps running.
  await page.evaluate(()=>{const update=BuergeramtLevel.update.bind(BuergeramtLevel);BuergeramtLevel.update=()=>{};window.omenStep=seconds=>{for(let t=0;t<seconds;t+=.05)update(Math.min(.05,seconds-t));Germany3D.sync()}});
  await page.locator('#amt-direct-reset').evaluate(element=>element.click());
  await page.keyboard.press('ArrowUp'); // Trusted gesture unlocks the existing audio path.
  await page.evaluate(()=>{dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));for(let i=0;i<100&&BuergeramtLevel.stage!=='omen';i++)omenStep(.05);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}));Germany3D.sync()});
  assert.equal(await page.evaluate(()=>BuergeramtLevel.omen.phase),'approach',JSON.stringify(await page.evaluate(()=>({view:BuergeramtLevel.view,stage:BuergeramtLevel.stage,omen:BuergeramtLevel.omen}))));
  await page.waitForFunction(()=>omenAudioEvidence.sources.filter(item=>item.source.loop&&item.start!==null).length===2,null,{timeout:10000});
  const state=()=>page.evaluate(()=>({stage:BuergeramtLevel.stage,...BuergeramtLevel.omen,view:BuergeramtLevel.view,line:document.getElementById('amt-line').textContent,queue:BuergeramtLevel.queueDisplay}));
  const approach=await state();
  await page.screenshot({path:`${output}/${name}-approach.png`});
  await page.evaluate(()=>omenStep(2.5));
  const middle=await state();assert(middle.strength>approach.strength&&middle.strength<1);assert.equal(middle.queue,approach.queue);assert.equal(middle.line,'');
  await page.screenshot({path:`${output}/${name}-buildup.png`});
  await page.evaluate(()=>omenStep(4));
  const peak=await state();assert.equal(peak.phase,'blackout');assert.equal(peak.strength,1);assert.equal(peak.line,'Wer die Finsternis sieht, hat sie selbst gewählt!');
  if(controlledSpeech){
   await page.waitForFunction(()=>window.omenTestSpeech?.text==='Wer die Finsternis sieht, hat sie selbst gewählt!',null,{timeout:2000});
   assert.equal(await page.evaluate(()=>BuergeramtLevel.omen.speech.mode),'voice');
  }else await page.waitForFunction(()=>Germany3D.amtCharacters.find(actor=>actor.name==='aktenkurier')?.detail,null,{timeout:10000});
  await page.screenshot({path:`${output}/${name}-peak.png`});
  let speechRig=null;
  if(controlledSpeech){
   await page.evaluate(()=>omenTestSpeech.onresume());
   const snapshot=()=>page.evaluate(()=>{
    const {sources,edges}=omenAudioEvidence,stems=sources.filter(item=>item.source.loop),gain=edges.get(stems[0].source),output=edges.get(gain),filter=edges.get(output);
    return{speech:BuergeramtLevel.omen.speech,output:output.gain.value,filter:filter.frequency.value,rate:stems[0].source.playbackRate.value,tensionLayer:edges.get(stems[1].source).gain.value,utterance:{rate:omenTestSpeech.rate,pitch:omenTestSpeech.pitch}};
   });
   const boundary=async word=>{await page.evaluate(word=>omenTestSpeech.onboundary({name:'word',charIndex:omenTestSpeech.text.indexOf(word),elapsedTime:1}),word);await page.waitForTimeout(250);return snapshot()};
   const darkness=await boundary('Finsternis'),choice=await boundary('selbst');
   assert.equal(darkness.speech.timing,'boundary');assert(choice.rate<darkness.rate);assert(choice.filter>darkness.filter);assert(choice.tensionLayer>darkness.tensionLayer);
   assert(Math.abs(choice.utterance.rate-.82)<1e-6);assert(Math.abs(choice.utterance.pitch-.72)<1e-6);
   await page.evaluate(()=>{omenTestSpeech.onpause();omenStep(1)});await page.waitForTimeout(250);
   const paused=await snapshot();assert.equal(paused.speech.progress,choice.speech.progress);assert(paused.output<choice.output);
   await page.evaluate(()=>omenTestSpeech.onresume());const cadence=await boundary('gewählt');assert(cadence.rate<choice.rate);assert.equal(cadence.speech.tension,1);
   await page.evaluate(()=>omenTestSpeech.onend());speechRig={controlledReceipts:true,darkness,choice,paused,cadence};
  }
  await page.waitForFunction(()=>BuergeramtLevel.omen.phase==='glare',null,{timeout:20000});
  await page.evaluate(()=>omenStep(.71));
  const release=await state();assert.equal(release.strength,0);assert.equal(release.stage,'walk-sign');
  await page.screenshot({path:`${output}/${name}-release.png`});
  const audio=await page.evaluate(()=>omenAudioEvidence.sources.filter(item=>item.source.loop).map(item=>({duration:item.source.buffer.duration,channels:item.source.buffer.numberOfChannels,start:item.start,stop:item.stop,now:item.source.context.currentTime,state:item.source.context.state})));
  assert.equal(audio.length,2);assert(audio.every(item=>Math.abs(item.duration-16)<.025&&item.channels===2&&item.stop<=item.now+.04),JSON.stringify(audio));
  await page.evaluate(()=>omenStep(.3));
  const beforeWalk=await state();await page.evaluate(()=>omenStep(.6));const walked=await state();assert.equal(walked.phase,'');assert(Math.hypot(walked.x-beforeWalk.x,walked.z-beforeWalk.z)>.05);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.locator('#amt-leave').evaluate(element=>element.click());
  assert.equal(await page.evaluate(()=>BuergeramtLevel.active),false);
  await page.waitForFunction(()=>omenAudioEvidence.contexts.every(context=>context.state==='closed'),null,{timeout:3000});
  assert.deepEqual(errors,[]);
  const platformSpeech=controlledSpeech?null:await page.evaluate(()=>window.omenPlatformEvents||[]);
  reports.push({name,approach,middle,peak,release,audio,speechRig,platformSpeech,errors});
  fs.writeFileSync(`${output}/results-${name}.json`,JSON.stringify({silent:true,physicalDevice:false,reports},null,2));
  console.log(JSON.stringify({name,result:'PASS',decodedLoops:audio.length,errors}));
  await page.close();
 }
 fs.writeFileSync(`${output}/results.json`,JSON.stringify({silent:true,physicalDevice:false,reports},null,2));
}finally{await browser.close()}
