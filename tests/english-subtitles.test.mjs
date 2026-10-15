import assert from "node:assert/strict";
import vm from "node:vm";
import {existsSync,readFileSync,readdirSync} from "node:fs";
import {join,relative,sep} from "node:path";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
const game=readFileSync(join(root,"game.js"),"utf8");
const html=readFileSync(join(root,"index.html"),"utf8");
const css=readFileSync(join(root,"styles.css"),"utf8");
const subtitleLayout=readFileSync(join(root,"subtitle-layout.js"),"utf8");
const librarySource=readFileSync(join(root,"For-AI/AUDIO-TEXT-LIBRARY.js"),"utf8");
const context=vm.createContext({window:{}});
vm.runInContext(librarySource,context,{filename:"AUDIO-TEXT-LIBRARY.js"});
const library=context.window.GermanySimulatorAudioText;

assert.equal(library.version,8);
const knickCount=['manifest.json','ambient-manifest.json','queue-call-manifest.json','phone-reactions-manifest.json','phone-dismissal-manifest.json'].reduce((n,file)=>n+(existsSync(join(root,'assets/voices/knick',file))?JSON.parse(readFileSync(join(root,'assets/voices/knick',file),'utf8')).clips.length:0),0);
const streetDirectory=join(root,'assets/voices/street-wisdom'),streetCount=existsSync(streetDirectory)?readdirSync(streetDirectory).filter(file=>file.endsWith('-manifest.json')).reduce((n,file)=>n+JSON.parse(readFileSync(join(streetDirectory,file),'utf8')).clips.length,0):0;
const playerDirectory=join(root,'assets/voices/player-replies'),playerCount=existsSync(playerDirectory)?readdirSync(playerDirectory).filter(file=>file.endsWith('-manifest.json')).reduce((n,file)=>n+JSON.parse(readFileSync(join(playerDirectory,file),'utf8')).clips.length,0):0;
const ambientDirectory=join(root,'assets/voices/office-ambient'),ambientCount=existsSync(ambientDirectory)?readdirSync(ambientDirectory).filter(file=>file.endsWith('-manifest.json')).reduce((n,file)=>n+JSON.parse(readFileSync(join(ambientDirectory,file),'utf8')).clips.length,0):0;
const neighborDirectory=join(root,'assets/voices/neighbors'),neighborCount=existsSync(neighborDirectory)?readdirSync(neighborDirectory).filter(file=>file.endsWith('-manifest.json')).reduce((n,file)=>n+JSON.parse(readFileSync(join(neighborDirectory,file),'utf8')).clips.length,0):0;
const cityDirectory=join(root,'assets/voices/city-dialogue'),cityCount=existsSync(cityDirectory)?readdirSync(cityDirectory).filter(file=>file.endsWith('-manifest.json')).reduce((n,file)=>n+JSON.parse(readFileSync(join(cityDirectory,file),'utf8')).clips.length,0):0;
// Two retired phone-button replies remain archived on disk; the fifth police line is new.
assert.equal(Object.keys(library.clips).length,114+knickCount+playerCount+ambientCount+neighborCount+cityCount,"recorded and text-only dialogue need stable IDs, including the Jobcenter overlord and neighbors");
const recordedClips=Object.values(library.clips).filter(clip=>clip.recording);
assert.equal(recordedClips.length,99+knickCount+streetCount+playerCount+ambientCount+neighborCount+cityCount,"retired clerk, traffic and phone-button takes must not enter the runtime catalog");
assert.equal(new Set(recordedClips.map(clip=>clip.path)).size,99+knickCount+streetCount+playerCount+ambientCount+neighborCount+cityCount,"recorded clip paths must be unique");
for(const clip of Object.values(library.clips)){
 assert.ok(library.voices[clip.voiceId],`${clip.id} needs a registered voice ID`);
 if(clip.targetVoiceId)assert.ok(library.voices[clip.targetVoiceId]?.profileId,`${clip.id} needs a saved replacement profile`);
 assert.ok(clip.source?.trim(),`${clip.id} needs exact spoken text`);
 assert.ok(clip.english?.trim()||clip.cues?.length,`${clip.id} needs an English subtitle`);
 assert.ok(clip.trigger?.trim(),`${clip.id} needs a trigger family`);
 if(clip.recording)assert.ok(existsSync(join(root,clip.path.slice(2))),`${clip.id} points to a missing recording`);
}
const cast=JSON.parse(readFileSync(join(root,'For-AI/VOICE-CAST.json'),'utf8'));
assert.equal(new Set(Object.values(cast.productionVoices).map(voice=>voice.profileId)).size,Object.keys(cast.productionVoices).length,"selected production roles need distinct saved profiles");
assert.equal(library.voices.narrator.profileId,undefined,"the official computer voice uses browser speech");
assert.equal(library.clips["rule-01"].targetVoiceId,undefined,"recorded rules must not target a retired narrator clone");
for(const family of ['bayern','alice'])assert.equal(library.speechFamilies[family].profileVoiceId,undefined,"source recordings must not retain removed generation profiles");
assert.equal(library.speechFamilies.merz.profileVoiceId,"merz");
assert.equal(library.voices.merz.profileName,"GS Merz");
assert.equal(library.voices.merz.profileId,"cb7f3cee85f648c186355329316c6b3b");
assert.equal(library.speechFamilies.merkel.profileVoiceId,"merkel");
assert.equal(library.voices.merkel.profileName,"GS Merkel");
assert.equal(library.voices.merkel.profileId,"25916e5981064e09a2c42350d5fe5f04");
assert.equal(library.clips["quiz-wrong-answer"].voiceId,"quiz-sting","existing quiz audio must not be labeled as a new clone");
assert.equal(library.clips["quiz-wrong-answer"].targetVoiceId,undefined,"the generic sting has no selected named replacement speaker");
assert.deepEqual([...library.exclusions],["background-music","sound-effect"]);
assert.equal(Object.keys(library.questions).length,77,"every spoken quiz question needs English text");
assert.deepEqual(Object.keys(library.quizContexts).sort(),["civic","grammar-b1","grammar-b2","grammar-c1","technik","traffic"],"each quiz family needs an English factual context");
assert.equal(library.pools.quizApproaches.length,32,"every regional quiz approach needs one shared English rendering");
assert.equal(library.pools.lawPower.length,13,"every recorded law quotation needs English text");
assert.equal(library.pools.railLaw.length,3,"every synthesized rail warning needs English text");
assert.ok(Object.keys(library.lines).length>90,"fixed dialogue translation catalog is unexpectedly small");

const walk=directory=>readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(join(directory,entry.name)):[join(directory,entry.name)]);
// Merz now ships generated exact-text speech; only the short Neuland excerpt
// from the Merkel source folder is shipped by the runtime.
const voiceFiles=walk(join(root,"assets/voices")).filter(path=>path.endsWith(".mp3")&&!path.includes(`${sep}candidate-dialogue${sep}`)&&!path.includes(`${sep}profile-auditions${sep}`)&&!path.includes(`${sep}quiz-segments${sep}`)&&!path.includes(`${sep}laws${sep}`));

for(const path of voiceFiles){
 const url="./"+relative(root,path).split(sep).join("/");
 if(/\/player-phone-(silent|ignore)\.mp3$/.test(url)){assert.equal(library.recordings[url],undefined);continue}
 assert.ok(library.recordings[url],`${url} is missing from the audio-text library`);
 assert.ok(library.recordings[url].source,`${url} needs an exact source transcript`);
 assert.ok(library.recordings[url].english,`${url} needs an English subtitle`);
}

const trainDurations={
 "./assets/audio/trains/ice-0815-buxtehude-bahnhofshalle-subtle.mp3":50.678,
 "./assets/audio/trains/ice-0815-marktversagen-bahnhofshalle-subtle.mp3":89.940,
 "./assets/audio/trains/ice-0815-stalingrad-bahnhofshalle-subtle.mp3":40.124,
 "./assets/audio/trains/ice-ardorf-hilter-bahnhofshalle-subtle.mp3":46.942,
 "./assets/audio/trains/ice-96-oberkaka-bahnhofshalle-subtle.mp3":46.811
};
for(const [url,duration] of Object.entries(trainDurations)){
 const entry=library.recordings[url];
 assert.ok(entry?.source,"train recording needs a complete source transcript");
 assert.ok(entry.cues.length>=3,"long train recording needs segmented English cues");
 let previousEnd=0;
 for(const [start,end,text] of entry.cues){
  assert.ok(start>=previousEnd-.001,`${url} cue timings overlap`);
  assert.ok(end>start,`${url} cue duration must be positive`);
  assert.ok(text.trim(),`${url} cue text must not be empty`);
  previousEnd=end;
 }
 assert.ok(previousEnd<=duration+.01,`${url} cues exceed the audio duration`);
}

assert.ok(html.indexOf("AUDIO-TEXT-LIBRARY.js")<html.indexOf("game.js"),"subtitle library must load before the game runtime");
assert.equal((html.match(/id="english-subtitle"/g)||[]).length,1,'one shared subtitle rail');
assert.equal((html.match(/id="subtitle-toggle"/g)||[]).length,1,'one shared subtitle control');
assert.doesNotMatch(html.match(/<dialog id="case-file"[\s\S]*?<\/dialog>/)[0],/id="subtitle-toggle"/,'subtitle preference must be reachable before opening the game file');
assert.match(css,/\.english-subtitle\{[^}]*background:#050505[^}]*color:#ffcc00[^}]*"Grenze"[^}]*text-shadow:[^}]*#b00018/);
assert.match(css,/\.english-subtitle\{[^}]*bottom:0/,'subtitles must meet the bottom edge');
assert.match(css,/\.control-dock\{bottom:calc\(30px \+ var\(--subtitle-height\)\);height:auto;min-height:84px/,"touch controls reserve their slot above subtitles and can grow for enlarged labels");
assert.match(css,/\.dialogue,\.dialogue\.memorial\{bottom:calc\(121px \+ var\(--subtitle-height\)\);height:/,"dialogue needs a stable slot above controls");
assert.match(css,/\.english-subtitle\[hidden\]\{[^}]*visibility:hidden/,"the empty subtitle field must retain its layout size");
assert.match(subtitleLayout,/const height=box\.getBoundingClientRect\(\)\.height/,"subtitle layout must reserve its height when empty");
assert.match(subtitleLayout,/prepareWithSegments[\s\S]*measureLineStats/,"subtitle layout must measure text with Pretext");
assert.match(game,/u\.onstart=\(\)=>\{[^\n]*startSubtitle\(item\)/,"browser-speech subtitles must start on the utterance start event");
assert.match(game,/item\.subtitleElapsed=\(\)=>a\.currentTime-t;sources\.at\(-1\)\.onended=\(\)=>finishStimulus/,"recorded subtitles must use the audio clock and complete after the final segment");
assert.match(game,/buffers\.forEach\(\(buffer,index\)=>\{sources\[index\]\.start\(t\+offset\);offset\+=buffer\.duration\+gap\}\);item\.start\?\.\(item\);startSubtitle\(item\)/,"recorded dialogue and subtitles must reveal when the scheduled sources start");
assert.match(game,/const time=item\.subtitleElapsed\?\.\(\)\?\?elapsed[\s\S]*requestAnimationFrame\(update\)/,"long cues must continuously follow the audio clock instead of accumulating timer drift");
assert.match(game,/function finishStimulus\([^)]*\)\{[^}]*clearSubtitle\(\)/,"broker completion must clear subtitles");
assert.match(game,/function stopSpeech\([^)]*\)[\s\S]*clearSubtitle\(\)/,"broker cancellation must clear subtitles");
assert.match(game,/localStorage\.setItem\("germany-simulator-english-subtitles"/,"subtitle preference must persist locally");
// The preference switches German -> English, with subtitles always enabled.
function subtitlePreference(saved){
 const button={textContent:'',attributes:{},setAttribute(name,value){this.attributes[name]=value}},requests=[],storage=new Map(saved===undefined?[]:[['germany-simulator-english-subtitles',saved]]);
 let clears=0,pending=false;
 const scope={window:{},state:{subtitlesOn:false},document:{getElementById:()=>button},localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},activeStimulus:null,textOnlyBark:null,hasStimulusFamily:()=>pending,clearSubtitle:()=>clears++,startSubtitle(){},STIMULUS_PRIORITY:{CRITICAL:3},showWorldBark:(speaker,text,urgent,recording,placement,options)=>requests.push({speaker,text,options})};
 const start=game.indexOf('const SUBTITLE_APPROVAL_LINES='),end=game.indexOf('\nwindow.addEventListener("resize"',start);
 vm.runInNewContext(game.slice(start,end),scope);
 return {button,requests,storage,set pending(value){pending=value},get clears(){return clears}};
}
const preference=subtitlePreference();
assert.equal(preference.button.attributes['aria-pressed'],'false','fresh preferences default to German');
assert.equal(preference.button.textContent,'UNTERTITEL: DEUTSCH');
assert.equal(preference.requests.length,0,'loading the game must not chastise the player');
preference.button.onclick();
assert.equal(preference.button.attributes['aria-pressed'],'true');
assert.equal(preference.button.textContent,'SUBTITLES: ENGLISH');
assert.equal(preference.storage.get('germany-simulator-english-subtitles'),'on');
assert.equal(preference.requests.length,3,'enabling queues all three authored chastising lines');
assert.ok(preference.requests.every(request=>request.speaker==='UNTERTITELSTELLE'&&request.options.voiceKey==='SUBTITLE AUTHORITY'&&request.options.family==='subtitle-approval'&&request.options.isEligible()));
preference.button.onclick();
assert.equal(preference.clears,0,'returning to German must not disable captions');assert.equal(preference.requests.length,3);
assert.ok(preference.requests.every(request=>!request.options.isEligible()),'German mode removes queued English approval eligibility');
preference.button.onclick();assert.equal(preference.requests.length,6,'a later enable triggers the cue again');
preference.pending=true;preference.button.onclick();preference.button.onclick();assert.equal(preference.requests.length,6,'an in-flight approval must not stack duplicate speech');
const restored=subtitlePreference('on');assert.equal(restored.button.attributes['aria-pressed'],'true');assert.equal(restored.requests.length,0,'restoring an opt-in is not a new enable action');
// Exercise the production caption path for ordinary speech and recording-only
// events, so German mode cannot silently fall back to hidden source dialogue.
const captionBox={hidden:true,textContent:'',lang:''},captionApp={classList:{remove(){},toggle(){}}};
const captions={state:{subtitlesOn:false},document:{getElementById:id=>id==='app'?captionApp:captionBox},window:{},audioTextLibrary:library,subtitleFrame:0,cancelAnimationFrame(){},requestAnimationFrame:()=>1,englishSubtitle:item=>item.subtitle||library.recordings[item.recording]?.english||'',activeStimulus:null,textOnlyBark:null};
for(const name of ['clearSubtitle','setSubtitle'])vm.runInNewContext(game.match(new RegExp(`function ${name}\\([^\\n]+`))[0],captions);
vm.runInNewContext(game.slice(game.indexOf('function startSubtitle('),game.indexOf('function ensureAudio(')),captions);
const normal={text:'Nächste bitte!',subtitle:'Next, please!'};captions.activeStimulus=normal;captions.startSubtitle(normal);
assert.equal(captionBox.hidden,false);assert.equal(captionBox.lang,'de');assert.equal(captionBox.textContent,normal.text);
captions.state.subtitlesOn=true;captions.startSubtitle(normal);assert.equal(captionBox.lang,'en');assert.equal(captionBox.textContent,normal.subtitle);
captions.state.subtitlesOn=false;captions.startSubtitle(normal);assert.equal(captionBox.hidden,false);assert.equal(captionBox.textContent,normal.text);
const recording=Object.keys(library.recordings).find(path=>library.recordings[path].cues?.length),recorded={recording,subtitleMode:'recorded',subtitleDuration:60,subtitleElapsed:()=>0};captions.activeStimulus=recorded;captions.startSubtitle(recorded);
assert.equal(captionBox.textContent,library.recordings[recording].source,'German recording-only events use their exact catalogue transcript');
captions.state.subtitlesOn=true;captions.startSubtitle(recorded);assert.equal(captionBox.textContent,library.recordings[recording].cues[0][2]);
captions.startSubtitle({...normal,hideCaption:true});assert.equal(captionBox.hidden,true,'explicit audio-only law quotations retain their exemption');
let silentCompletion=null;
Object.assign(captions,{speechCatalog:{productionVoices:{}},stimulusGeneration:1,performance:{now:()=>0},stimulusEligible:()=>true,setTimeout:callback=>{silentCompletion=callback;return 1},finishStimulus:()=>captions.clearSubtitle()});
vm.runInNewContext(game.slice(game.indexOf('function playCaptionStimulus('),game.indexOf('function playRecordedStimulus(')),captions);
captions.state.subtitlesOn=false;captions.activeStimulus=normal;captions.playSyntheticStimulus(normal,1);
assert.equal(captionBox.hidden,false,'unavailable browser speech retains readable captions');assert.equal(captionBox.textContent,normal.text);assert.equal(typeof silentCompletion,'function');
silentCompletion();assert.equal(captionBox.hidden,true,'the silent reading has bounded completion');
let failedUtterance;
captions.window.speechSynthesis=captions.speechSynthesis={getVoices:()=>[],speak:utterance=>failedUtterance=utterance,cancel(){}};
Object.assign(captions,{SpeechSynthesisUtterance:class{constructor(text){this.text=text}},clearTimeout(){},clearInterval(){},voiceHash:()=>0});
captions.playSyntheticStimulus(normal,1);failedUtterance.onerror({error:'synthesis-failed'});
assert.equal(captionBox.hidden,false,'failed speech retains captions instead of losing the line');assert.equal(captionBox.textContent,normal.text);silentCompletion();
// The final line releases its item before the broker releases foreground ownership.
// Office admission must wait through that required completion gap as well.
const finalLine={family:'subtitle-approval'},timers=[];
const admission={activeStimulus:finalLine,stimulusQueue:[],activeAudioText:{owner:'subtitle-approval'},stimulusGeneration:1,stimulusTimer:0,recordedSpeechSource:null,recordedSpeechGain:null,clearSubtitle(){},clearTimeout(){},setTimeout(callback,delay){timers.push({callback,delay});return 1},AUDIO_MIX:{REQUIRED_GAP_MS:250},setAudioText(){admission.activeAudioText=null},stimulusEligible:()=>true};
for(const name of ['audioTextActive','stimulusBusy','finishStimulus'])vm.runInNewContext(game.match(new RegExp(`function ${name}\\([^\\n]+`))[0],admission);
assert.equal(admission.stimulusBusy(),true);
admission.finishStimulus(finalLine,1);
assert.equal(admission.activeStimulus,null);assert.equal(admission.stimulusQueue.length,0);
assert.equal(timers[0].delay,250);assert.equal(admission.stimulusBusy(),true,'city retains admission during the final gap');
timers[0].callback();assert.equal(admission.stimulusBusy(),false,'office admission resumes after the gap');
// A caption-only office fallback owns the rail until its bounded reading ends.
const officeAdmission={state:{voiceOn:true},activeStimulus:null,stimulusQueue:[{family:'subtitle-approval',priority:3}],stimulusTimer:0,stimulusGeneration:1,stimulusSequence:0,stimulusLastServed:new Map(),window:{BuergeramtLevel:{active:true,audioTextBusy:false,subtitleBusy:true}},clearTimeout(){},setTimeout(callback,delay){officeAdmission.resume=callback;officeAdmission.delay=delay;return 1},stimulusEligible:()=>true,chooseStimulusIndex:()=>0,setAudioText(){},playSyntheticStimulus:()=>officeAdmission.started=true};
vm.runInNewContext(game.match(/function pumpStimuli\([^\n]+/)[0],officeAdmission);officeAdmission.pumpStimuli();
assert.equal(officeAdmission.started,undefined,'approval cannot overwrite a silent office reading');assert.equal(officeAdmission.delay,40);
officeAdmission.window.BuergeramtLevel.subtitleBusy=false;officeAdmission.resume();assert.equal(officeAdmission.started,true,'caption completion releases the queued announcement');
assert.deepEqual(["Englische Untertitel sind äußerst wichtig, insbesondere wenn Sie Deutsch lernen möchten.","Aufgrund Ihres bemerkenswerten Lerneifers wird die Verwendung von Untertiteln hiermit genehmigt.","Wir gratulieren Ihnen zu dieser verwaltungstechnisch ausgezeichneten Entscheidung."].map(text=>library.lines[text]),["English subtitles are extremely important, especially when you want to learn German.","In recognition of your remarkable eagerness to learn, the use of subtitles is hereby approved.","We congratulate you on this administratively excellent decision."]);
assert.match(game,/if\(state\.subtitlesOn&&!hasStimulusFamily\("subtitle-approval"\)\)for\(const text of SUBTITLE_APPROVAL_LINES\)showWorldBark\("UNTERTITELSTELLE",text/ ,"subtitle approval must show the exact spoken line");
assert.ok(preference.requests.every(request=>request.options.candidateVoiceId==="narrator"),"automated subtitle approval must share the official computer voice");
assert.match(game,/subtitle=\(audioTextLibrary\.pools\.quizApproaches[\s\S]*audioTextLibrary\.questions/,"quiz prompts must use authored English subtitles");
assert.match(game,/englishChunks[\s\S]*subtitle:\(englishChunks\[index\]/,"HUM-01 readings must use their authored English page copy");

console.log("English subtitle catalog, timing, styling, and broker lifecycle OK");
