import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {runSuite,isMain} from './browser-harness.mjs';

function take(source,name){const start=source.indexOf(`function ${name}(`);assert.ok(start>=0,name);let depth=0,end=source.indexOf('{',start);for(;end<source.length;end++){if(source[end]==='{')depth++;if(source[end]==='}'&&!--depth)break}return source.slice(start,end+1)}
const probe=`window.__musicProbe={tunes:MUSIC,synth(){stopIntroMusic();sungMusicAudio.pause();sungMusicActive=false;releaseMusicBus();schedulePlaylistItem()},short(){this.synth();releaseMusicBus();eightBitTracksSinceSong=0;const next=nextTune;nextTune=()=>({title:'Native paused-clock fixture',bpm:120,root:60,notes:[[72,.25]]});try{schedulePlaylistItem()}finally{nextTune=next}},wurst(cancel){wurstSongPending=true;wurstSongPlayed=false;playWurstSong();if(cancel==='office'){setAmtMusicMuted(true);setAmtMusicMuted(false)}else{document.getElementById('mute').onclick();document.getElementById('mute').onclick()}},inspect(){return {sources:musicSources.size,bus:!!musicBus,sung:sungMusicActive,context:audio?.state,clock:audio?.currentTime,tracks:eightBitTracksSinceSong}},pause(){audio.jwdLecturePaused=true;return audio.suspend()},resume(){audio.jwdLecturePaused=false;return audio.resume()},meter(){const a=audio.createAnalyser();a.fftSize=2048;masterOutput().connect(a);a.connect(audio.destination);window.__musicMeter=a},sample(){const data=new Float32Array(2048);__musicMeter.getFloatTimeDomainData(data);return Math.max(...data.map(Math.abs))}};`;

async function nativeMusic({page,baseURL,artifacts,profile}){
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const press=selector=>profile.isMobile?page.locator(selector).tap():page.locator(selector).click();
 await page.addInitScript(()=>{window.__wurstPlays=0;const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){if(this.src.includes('/wurst.mp3'))__wurstPlays++;return play.apply(this,args)}});
 await page.route('**/game.js*',async route=>{const response=await route.fetch();const source=await response.text();assert.ok(source.includes('const humorPages=['));await route.fulfill({response,body:source.replace('const humorPages=[',probe+'\nconst humorPages=[')})});
 await page.goto(baseURL,{waitUntil:'commit'});
 await page.waitForFunction(()=>document.getElementById('preload').hidden,null,{timeout:120000});
 await page.keyboard.press('s');await page.waitForFunction(()=>Germany3DBridge.getHUDState().started);
 await page.evaluate(()=>{for(let i=0;i<8;i++)document.getElementById('dialogue-next').click();__musicProbe.synth();__musicProbe.meter()});
 await page.waitForFunction(()=>__musicProbe.inspect().context==='running'&&__musicProbe.inspect().sources===3);
 let peak=0;for(let i=0;i<24;i++){await page.waitForTimeout(80);peak=Math.max(peak,await page.evaluate(()=>__musicProbe.sample()))}
 assert.ok(peak>.0001&&peak<.8,`silent pre-output music/FX peak ${peak}`);
 await press('#file-toggle');
 await page.evaluate(async()=>{await __musicProbe.pause();__musicProbe.short()});
 await page.waitForFunction(()=>__musicProbe.inspect().sources===3);
 const paused=await page.evaluate(()=>__musicProbe.inspect());await page.waitForTimeout(700);
 assert.deepEqual(await page.evaluate(()=>__musicProbe.inspect()),paused,'native suspension beyond the short score must not advance its playlist');
 await press('#file-close');await page.waitForFunction(()=>__musicProbe.inspect().tracks===2&&__musicProbe.inspect().sources===3);
 await page.screenshot({path:artifacts.path('active.png')});
 await press('#file-toggle');
 await press('[data-file-page="controls"]');
 for(let i=0;i<5;i++){
  await press('#mute');await page.waitForFunction(()=>__musicProbe.inspect().sources===0&& !__musicProbe.inspect().bus);
  await press('#mute');await page.waitForFunction(()=>__musicProbe.inspect().sources===3||__musicProbe.inspect().sung);
 }
 // Existing lifecycle fixture pattern; this is synthetic hiding, not native tab switching.
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
 await page.waitForFunction(()=>__musicProbe.inspect().sources===0);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});
 await page.waitForFunction(()=>__musicProbe.inspect().sources===3||__musicProbe.inspect().sung);
 await page.waitForTimeout(180);assert.ok(await page.evaluate(()=>__musicProbe.inspect().bus||__musicProbe.inspect().sung),'old release callbacks cannot disconnect resumed music');
 for(const cancel of ['toggle','office']){
  const before=await page.evaluate(()=>__wurstPlays);await page.evaluate(cancel=>__musicProbe.wurst(cancel),cancel);
  await page.waitForFunction(before=>__wurstPlays>before,before);await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>__wurstPlays),before+1,`${cancel}: a stale Wurst callback must not replay the song`);
 }
 await press('#file-toggle');await press('[data-file-page="controls"]');
 if(await page.evaluate(()=>__musicProbe.inspect().sources===3))await page.evaluate(()=>__musicProbe.pause());
 await press('#mute');await page.waitForFunction(()=>__musicProbe.inspect().sources===0);
 assert.deepEqual(errors,[]);
 return {checks:[{name:'native three-voice soundtrack, paused native clock, finite release, rapid toggles, hidden/resume and nonclipping pre-output signal',verdict:'PASS',peak,errors}],limits:['Audio is state/signal checked silently; no perceptual listening. Closure access, short-score placement and Wurst cancellation handlers are injected by this test only; ordinary music controls also use real pointer/touch actions.']};
}

async function offlineMusic({page,context,artifacts,baseURL}){
 const source=await (await page.request.get(baseURL+'/game.js')).text();
 const melodyStart=source.indexOf('const erikaA='),musicStart=source.indexOf('const MUSIC=',melodyStart),melodyEnd=source.indexOf('];',musicStart)+2;
 assert.ok(melodyStart>=0&&melodyEnd>melodyStart);
 const code=source.slice(melodyStart,melodyEnd)+'\n'+['createMusicVoice','chip','stamp','masterOutput','currentMusicLevel','createMusicBus','rampGain','releaseMusicBus','scheduleTheme'].map(n=>take(source,n)).join('\n');
 // OfflineAudioContext renders into memory and cannot send sound to hardware.
 // This blank context has no game/media and prohibits real-time audio creation.
 await page.goto('about:blank');
 const offline=await context.browser().newContext();
 try{
  await offline.addInitScript(()=>{window.AudioContext=window.webkitAudioContext=window.Audio=function(){throw Error('Only offline rendering is allowed')};speechSynthesis.speak=()=>{throw Error('No speech in offline checks')}});
  const tab=await offline.newPage();await tab.goto('about:blank');
  const results=await tab.evaluate(async code=>{
   const make=new Function('audio','index',`const state={neighborLevel:false},MUSIC_LEVEL=.4,AUDIO_CLASS={BACKGROUND:'background'},AUDIO_MIX={BACKGROUND:.22},audioTextActive=()=>false,ensureAudio=()=>audio,document={hidden:false,getElementById:()=>({})},setTimeout=()=>0,clearTimeout=()=>{},musicOn=true,musicDucked=false,musicPlaybackSerial=0;let masterBus=null,musicBus=null,musicTimer=null,eightBitTracksSinceSong=0;const musicSources=new Set(),midiFreq=n=>440*2**((n-69)/12),nextTune=()=>MUSIC[index],schedulePlaylistItem=()=>{};${code};musicBus=createMusicBus();scheduleTheme();return {sources:musicSources,release:releaseMusicBus}`);
   const tunes=new Function(code+';return MUSIC')(),rows=[];
   for(let index=0;index<tunes.length;index++){
    const tune=tunes[index],seconds=tune.notes.reduce((n,[,beats])=>n+beats*60/tune.bpm,0)+.3;
    const audio=new OfflineAudioContext(1,Math.ceil(seconds*44100),44100),graph=make(audio,index);
    const sources=graph.sources.size;const buffer=await audio.startRendering(),data=buffer.getChannelData(0);let peak=0,step=0,clipped=0;
    for(let i=0;i<data.length;i++){peak=Math.max(peak,Math.abs(data[i]));if(i)step=Math.max(step,Math.abs(data[i]-data[i-1]));if(Math.abs(data[i])>=1)clipped++}
    rows.push({title:tune.title,seconds,sources,peak,maxStep:step,clipped});
   }
   const audio=new OfflineAudioContext(1,44100,44100),graph=make(audio,0),hold=audio.suspend(.3),rendering=audio.startRendering();await hold;graph.release();await audio.resume();const data=(await rendering).getChannelData(0);let tail=0;for(let i=22050;i<data.length;i++)tail=Math.max(tail,Math.abs(data[i]));
   return {rows,releaseTailPeak:tail};
  },code);
  assert.ok(results.rows.length>=5);for(const row of results.rows){assert.equal(row.sources,3);assert.ok(row.peak>.0001&&row.peak<.8);assert.equal(row.clipped,0);assert.ok(row.maxStep<.005,JSON.stringify(row))}assert.ok(results.releaseTailPeak<.00001);
  artifacts.json('offline-signal.json',results);
  return {checks:[{name:'complete production score renders with three native voices, headroom and silent cancellation tail',verdict:'PASS',...results}],limits:['Native OfflineAudioContext PCM, no output device or perceptual listening.']};
 }finally{await offline.close()}
}

export default {name:'Real-time music and performance acceptance',scenarios:[
 {id:'realtime-music',modes:['quick','stress'],timeoutMs:180000,run:nativeMusic},
 {id:'offline-music',modes:['stress'],profiles:['desktop'],timeoutMs:180000,run:offlineMusic}
],sourceFiles(root){return Object.fromEntries(['game.js','world3d.js','tests/realtime-performance.test.mjs','tools/playtest-realtime-performance.mjs'].map(file=>[file,createHash('sha256').update(readFileSync(resolve(root,file))).digest('hex')]))},limits:['Silent isolated lab evidence; Android is emulated. No physical-device or perceptual listening claim.']};
if(isMain(import.meta.url)){const suite=(await import(import.meta.url)).default;const report=await runSuite(suite,{mode:'stress',suitePath:'./tools/playtest-realtime-performance.mjs',iterations:1,output:process.env.PLAYTEST_OUTPUT||'output/realtime-performance/audio'});process.exitCode=report.verdict==='PASS'?0:1}
