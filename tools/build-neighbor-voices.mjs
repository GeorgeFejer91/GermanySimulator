// Offline authoring through the installed voice runtime. No playback or downloads.
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync,renameSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import vm from 'node:vm';
import {matchesProduction,verifyProfiles,neighborSpokenWords as spokenWords} from './curate-voice-library.mjs';

const root=resolve(import.meta.dirname,'..'),args=process.argv.slice(2);
const option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const exe=option('--voice-exe',resolve(process.env.LOCALAPPDATA,'Secret Tunnel 6/secret-tunnel-v6.exe'));
const data=readFileSync(resolve(dirname(exe),'voice-data-root.txt'),'utf8').trim();
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>JSON.parse(readFileSync(path,'utf8').replace(/^\uFEFF/,''));
const cast=read(resolve(root,'For-AI/VOICE-CAST.json'));
const source=readFileSync(resolve(root,'game.js'),'utf8');
const copy=vm.runInNewContext(source.slice(source.indexOf('const jwdCopy=')).split('\n};')[0].replace('const jwdCopy=','(')+'\n})');
const families={heiko:{voiceId:'jwd-heiko-maaslos',actorId:'jwd-parent',topics:['parent','paint','concern','polish','parking','latin','smalltalk']},inga:{voiceId:'jwd-inga-maaslos',actorId:'jwd-watcher',topics:['watcher','electric','gardenRules','blinds','schedule']},schwabingen:{voiceId:'jwd-frau-schwabingen',actorId:'jwd-swabian',topics:['swabian','lawn','sweeping','hedge','letter']}};
function call(operation,input={}){
 const result=spawnSync(exe,['--voice-cli'],{input:JSON.stringify({operation,input}),encoding:'utf8',windowsHide:true,timeout:30*60*1000,maxBuffer:20*1024*1024});
 if(result.error||result.status!==0)throw Error(`Voice ${operation}: ${result.error||result.stderr.slice(-500)}`);
 const response=JSON.parse(result.stdout);if(!response.ok)throw Error(JSON.stringify(response.error));return response.result;
}
function ffmpeg(params,binary=false){const result=spawnSync('ffmpeg',params,{encoding:binary?null:'utf8',windowsHide:true,maxBuffer:30*1024*1024});if(result.status!==0)throw Error(String(result.stderr).slice(-500));return binary?result.stdout:result.stderr}
function levels(path){const report=ffmpeg(['-hide_banner','-nostats','-i',path,'-af','loudnorm=I=-18:TP=-2:LRA=11:print_format=json','-f','null','NUL']);return JSON.parse(report.match(/\{\s*"input_i"[\s\S]*?\}/)[0])}
function energy(path){const bytes=ffmpeg(['-hide_banner','-loglevel','error','-i',path,'-f','f32le','-ac','1','-ar','24000','pipe:1'],true),samples=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)),values=[];for(let i=0;i<samples.length;i+=600){let total=0;const end=Math.min(i+600,samples.length);for(let j=i;j<end;j++)total+=samples[j]**2;values.push(Math.sqrt(total/(end-i)))}const scale=[...values].sort((a,b)=>a-b)[Math.floor(values.length*.95)]||1;return{mouthHz:40,mouthEnergy:values.map(v=>Math.min(255,Math.round(255*(v/scale)**.7))),durationSeconds:samples.length/24000}}

const family=option('--character','inga');if(!families[family])throw Error('Unknown neighbor');
const seed=Number(option('--seed','71407'));
const identity=families[family],binding=cast.productionVoices[identity.voiceId];
const lines=identity.topics.flatMap(topic=>copy[topic].de.map((text,index)=>({clipId:`${family}-${topic}-${String(index+1).padStart(2,'0')}`,voiceId:identity.voiceId,actorId:identity.actorId,topic,index,text,english:copy[topic].en[index],sourceSha256:sha(text)})));
if(args.includes('--plan')){console.log(JSON.stringify({family,binding:binding??null,lines},null,2));process.exit(0)}
if(!binding)throw Error(`No selected profile for ${identity.voiceId}`);
const live=call('list');verifyProfiles({productionVoices:{[identity.voiceId]:binding},productionExceptions:[]},live.profiles,data);
const runtime=read(resolve(dirname(exe),'resources/voice/voice-runtime.json'));
if(binding.renderer!=='omnivoice-rs'||binding.modelRevision!=='wide-rank-v2-prompt-preprocess'||sha(readFileSync(resolve(dirname(exe),'resources/voice/omnivoice-cli.exe')))!==runtime.binarySha256||sha(readFileSync(resolve(dirname(exe),'resources/voice/secret-tunnel-asr.exe')))!==runtime.asrBinarySha256)throw Error('Installed native renderer/ASR revision drift');
const dest=resolve(root,'assets/voices/neighbors'),privateDir=resolve(root,'output/neighbors/voice-authoring',family);mkdirSync(dest,{recursive:true});mkdirSync(privateDir,{recursive:true});
const modelRoot=resolve(process.env.LOCALAPPDATA,'VoiceCloner/models/OmniVoice'),asrBinary=resolve(dirname(exe),'resources/voice/secret-tunnel-asr.exe'),referenceTranscriptPath=resolve(privateDir,'reference-transcript.json');
let referenceTranscript=existsSync(referenceTranscriptPath)?read(referenceTranscriptPath):null;
if(referenceTranscript?.referenceSha256!==binding.referenceSha256){
 const result=spawnSync(asrBinary,[resolve(modelRoot,'whisper'),resolve(data,'profiles',binding.profileId,'reference.wav'),'de'],{encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:8*1024*1024});if(result.status!==0)throw Error('Reference transcription failed');
 referenceTranscript={referenceSha256:binding.referenceSha256,...JSON.parse(result.stdout)};writeFileSync(referenceTranscriptPath,JSON.stringify(referenceTranscript,null,2));
}
function render(line){
 const previousPath=resolve(privateDir,line.clipId+'-take.json'),previousAsr=resolve(privateDir,line.clipId+'-asr.json');
 if(existsSync(previousPath)&&(!existsSync(previousAsr)||spokenWords(read(previousAsr).transcript??'')===spokenWords(line.text))){
  const previous=read(previousPath);if(existsSync(previous.path)&&existsSync(previous.metadata_path)&&read(previous.metadata_path).text===line.text)return previous;
 }
 const nativeDir=resolve(dirname(exe),'audio-assets',binding.profileName),annotations=resolve(nativeDir,'annotations');
 if(existsSync(annotations))for(const name of readdirSync(annotations).filter(name=>name.endsWith('.speech.json'))){
  const note=read(resolve(annotations,name));
  if(note.voice_id===binding.profileId&&note.text===line.text&&spokenWords(note.word_fidelity?.transcript??'')===spokenWords(line.text))return{path:resolve(nativeDir,'mp3s',note.audio_file),metadata_path:resolve(annotations,name),cached:true};
 }
 // Native automatic retries cannot converge on proper-name/& orthography.
 // Use its same installed inference binary for a bounded take, then audit words.
 const output=resolve(privateDir,line.clipId+`-${seed}-native.wav`),bench=resolve(privateDir,line.clipId+`-${seed}-inference.json`);
 const model=resolve(process.env.LOCALAPPDATA,'VoiceCloner/models/OmniVoice');
 const result=spawnSync(resolve(dirname(exe),'resources/voice/omnivoice-cli.exe'),['infer','--model',model,'--text',line.text,'--output',output,'--language','German','--ref-audio',resolve(data,'profiles',binding.profileId,'reference.wav'),'--ref-text',referenceTranscript.transcript,'--num-step','32','--preprocess-prompt','true','--device','cuda','--dtype','f16','--seed',String(seed),'--bench-json',bench],{encoding:'utf8',windowsHide:true,timeout:180000,maxBuffer:8*1024*1024});
 if(result.error||result.status!==0)throw Error(`Native render: ${result.error||result.stderr.slice(-1200)}`);
 const metadata_path=resolve(privateDir,line.clipId+`-${seed}-native.speech.json`);writeFileSync(metadata_path,JSON.stringify({clip_id:line.clipId,text:line.text,voice_id:binding.profileId,reference_sha256:binding.referenceSha256,engine:binding.renderer,inference_revision:binding.modelRevision,nativeCompletion:{completed:true,inferenceSha256:sha(readFileSync(bench)),binarySha256:sha(readFileSync(resolve(dirname(exe),'resources/voice/omnivoice-cli.exe')))}}));
 return{path:output,metadata_path,cached:false};
}
const path=resolve(dest,`${family}-manifest.json`),old=existsSync(path)?read(path):null,clips=[],failed=new Map();
const save=()=>writeFileSync(path,JSON.stringify({schemaVersion:1,voiceId:identity.voiceId,requestedLineCount:lines.length,clips,heldPrivate:lines.filter(x=>!clips.some(c=>c.clipId===x.clipId)).map(x=>({...x,reason:failed.get(x.clipId)??'not yet generated'}))},null,2)+'\n');
for(const line of lines){
 try{
 const found=old?.clips.find(c=>c.clipId===line.clipId&&c.text===line.text&&matchesProduction(cast,c));
 if(found&&existsSync(resolve(root,found.file))&&sha(readFileSync(resolve(root,found.file)))===found.sha256){clips.push(found);console.log(JSON.stringify({clipId:line.clipId,cached:true}));continue}
 console.log(JSON.stringify({clipId:line.clipId,stage:'generate',characters:line.text.length}));
 const take=render(line);
 writeFileSync(resolve(privateDir,line.clipId+'-take.json'),JSON.stringify(take,null,2)+'\n');
 const note=read(take.metadata_path);
 if(note.voice_id!==binding.profileId||note.reference_sha256!==binding.referenceSha256||note.engine!==binding.renderer||note.inference_revision!==binding.modelRevision||note.text!==line.text)throw Error('Native receipt drift');
 if(note.word_fidelity&&spokenWords(note.word_fidelity.transcript)!==spokenWords(line.text))throw Error('Native word verification failed');
 const stats=levels(take.path),file=`assets/voices/neighbors/${line.clipId}.mp3`,final=resolve(root,file);let measured,gain=0;
 for(let attempt=0;attempt<6;attempt++){
  ffmpeg(['-hide_banner','-loglevel','error','-y','-i',take.path,'-af',`loudnorm=I=-18:TP=-2.5:LRA=11:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true,aresample=24000,volume=${gain}dB,alimiter=limit=0.62:attack=5:release=60:level=false`,'-ar','24000','-ac','1','-c:a','libmp3lame','-b:a','64k','-map_metadata','-1',final]);
  measured=levels(final);if(Math.abs(Number(measured.input_i)+18)<=.3&&Number(measured.input_tp)<=-1.5)break;gain+=-18-Number(measured.input_i);
 }
 if(Math.abs(Number(measured.input_i)+18)>.3||Number(measured.input_tp)>-1.5)throw Error('Final encoded levels out of tolerance: '+JSON.stringify(measured));
 // ASR audits the shipped encoding, independently of the generation request.
 const wav=resolve(privateDir,line.clipId+'-encoded.wav');ffmpeg(['-hide_banner','-loglevel','error','-y','-i',final,'-ar','16000','-ac','1',wav]);
 const model=resolve(process.env.LOCALAPPDATA,'VoiceCloner/models/OmniVoice/whisper'),asrExe=resolve(dirname(exe),'resources/voice/secret-tunnel-asr.exe');
 const result=spawnSync(asrExe,[model,wav,'de'],{encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:8*1024*1024});if(result.error||result.status!==0)throw Error(`Encoded ASR: ${result.error||result.stderr.slice(-500)}`);
 const audit=JSON.parse(result.stdout);
 writeFileSync(resolve(privateDir,line.clipId+'-asr.json'),JSON.stringify(audit,null,2)+'\n');
 const transcript=audit.text??audit.transcript;if(typeof transcript!=='string'||spokenWords(transcript)!==spokenWords(line.text))throw Error(`Final words differ for ${line.clipId}: ${transcript}`);
 const clip={...line,file,profileId:binding.profileId,referenceSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,renderer:binding.renderer,modelRevision:binding.modelRevision,processing:binding.processing,...energy(final),sha256:sha(readFileSync(final)),nativeClipId:note.clip_id,nativeAnnotationSha256:sha(readFileSync(take.metadata_path)),nativeAudioSha256:sha(readFileSync(take.path)),nativeWordFidelity:note.word_fidelity??null,nativeCompletion:note.nativeCompletion??{completed:true,basis:'Completed native voice-cloner generation; source MP3 and scored transcript preserved'},asr:transcript,asrWordExact:true,asrNormalization:'NFKC/case/punctuation/hyphen spacing; People & Culture = People and Culture; Maslos = Maaslos (proper-name vowel spelling); Nachbarschafts-Offside = Nachbarschafts-offsite (German final devoicing)',asrScriptPrompt:null,asrModelSha256:sha(readFileSync(resolve(model,'whisper-large-v3-turbo-q4_0.gguf'))),asrRenderer:'secret-tunnel-asr / whisper-large-v3-turbo GGUF q4_0',asrLanguageId:'de',integratedLufs:Number(measured.input_i),truePeakDbtp:Number(measured.input_tp),approval:{status:'user-approved',scope:'User requested this saved profile for fictional neighbor interactions',listening:'NOT RUN'}};
 clips.push(clip);save();
 console.log(JSON.stringify({clipId:clip.clipId,duration:clip.durationSeconds,lufs:clip.integratedLufs,dbtp:clip.truePeakDbtp,stage:'complete'}));
 }catch(error){
  const final=resolve(dest,line.clipId+'.mp3'),rejected=resolve(privateDir,line.clipId+`-${seed}-rejected.mp3`);if(existsSync(final))renameSync(final,existsSync(rejected)?resolve(privateDir,line.clipId+`-${seed}-${Date.now()}-rejected.mp3`):rejected);
  failed.set(line.clipId,String(error));save();console.log(JSON.stringify({clipId:line.clipId,stage:'held-private',reason:String(error)}));
 }
}
save();console.log(JSON.stringify({accepted:clips.length,held:lines.length-clips.length}));
