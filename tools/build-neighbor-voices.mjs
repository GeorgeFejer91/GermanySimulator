// Offline authoring through the installed voice runtime. No playback or downloads.
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync,renameSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import vm from 'node:vm';
import {matchesProduction,verifyProfiles,neighborRecordingsBlock,neighborSpokenWords as spokenWords} from './curate-voice-library.mjs';
import {encodeVoice,voiceFilter} from './neighbor-voice-processing.mjs';

const root=resolve(import.meta.dirname,'..'),args=process.argv.slice(2);
const option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const exe=option('--voice-exe')||(process.env.LOCALAPPDATA?resolve(process.env.LOCALAPPDATA,'Secret Tunnel 6/secret-tunnel-v6.exe'):null);
if(!exe)throw Error('Pass --voice-exe when LOCALAPPDATA is unavailable');
const data=readFileSync(resolve(dirname(exe),'voice-data-root.txt'),'utf8').trim();
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>JSON.parse(readFileSync(path,'utf8').replace(/^\uFEFF/,''));
function replaceFile(from,to){for(let attempt=0;;attempt++){try{renameSync(from,to);return}catch(error){if(!['EPERM','EACCES','EBUSY'].includes(error.code)||attempt>=19)throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,50)}}}
function commitClip(clips,clip,save){
 clips.push(clip);
 try{save()}catch(error){clips.pop();throw error}
}
function assertTimingTarget(controls,selected,retained){
 if(controls.length&&[...selected].some(clipId=>retained.has(clipId)))throw Error('Explicit native timing requires a held clip; accepted recordings are retained');
}
const contractionPolicy='finite-authored-apostrophe-contractions-v1';
function expandAuthoredContractions(text){
 return text.replace(/(?<!\p{L})(sie|du|er|haben|ich|man|meinen|sag|sehen|wir|gibt)[’']s(?!\p{L})/giu,(_,base)=>base+' es');
}
function contractionRenderInput(line){
 const actualInferenceText=expandAuthoredContractions(line.text);
 if(actualInferenceText===line.text)throw Error('Selected source has no approved contraction to expand');
 if(spokenWords(actualInferenceText)!==spokenWords(line.text))throw Error('Render input changes canonical spoken words');
 return{clipId:line.clipId,canonicalSourceText:line.text,canonicalSourceSha256:sha(line.text),actualInferenceText,actualInferenceSha256:sha(actualInferenceText),renderNormalizationPolicy:contractionPolicy};
}
function nativeSourceMatches(note,line,binding){
 if(!note||typeof note.text!=='string'||note.voice_id!==binding.profileId||note.reference_sha256!==binding.referenceSha256||note.engine!==binding.renderer||note.inference_revision!==binding.modelRevision)return false;
 if(note.renderNormalizationPolicy===undefined)return note.text===line.text&&['canonicalSourceText','canonicalSourceSha256','actualInferenceText','actualInferenceSha256'].every(key=>note[key]===undefined);
 return note.renderNormalizationPolicy===contractionPolicy&&note.canonicalSourceText===line.text&&note.canonicalSourceSha256===sha(line.text)&&note.actualInferenceText===note.text&&note.actualInferenceSha256===sha(note.text)&&note.text!==line.text&&expandAuthoredContractions(line.text)===note.text&&spokenWords(note.text)===spokenWords(line.text);
}
const cast=read(resolve(root,'For-AI/VOICE-CAST.json'));
const source=readFileSync(resolve(root,'game.js'),'utf8');
const copy=vm.runInNewContext(source.slice(source.indexOf('const jwdCopy=')).split('\n};')[0].replace('const jwdCopy=','(')+'\n})');
const families={heiko:{voiceId:'jwd-heiko-maaslos',actorId:'jwd-parent',topics:['parent','paint','concern','polish','parking','latin','smalltalk']},inga:{voiceId:'jwd-inga-maaslos',actorId:'jwd-watcher',topics:['watcher','electric','gardenRules','blinds','schedule']},schwabingen:{voiceId:'jwd-frau-schwabingen',actorId:'jwd-swabian',topics:['swabian','lawn','sweeping','hedge','letter']},theodore:{voiceId:'jwd-theodore-maaslos',actorId:'jwd-theodore',topics:[]},ede:{voiceId:'jwd-ede-einbruch',actorId:'jwd-burglar',topics:['burglar']}};
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
const numStep=Number(option('--steps','32'));if(![32,64].includes(numStep))throw Error('--steps must be 32 or 64');
const speed=Number(option('--speed','1'));if(![.9,1].includes(speed))throw Error('--speed must be 0.9 or 1');
const nativeControls=[],timingParameters={};
for(const [flag,key,max] of [['--duration','duration',120],['--audio-chunk-threshold','audioChunkThreshold',120],['--audio-chunk-duration','audioChunkDuration',30]])if(args.includes(flag)){
 const value=Number(option(flag,NaN));if(!Number.isFinite(value)||value<=0||value>max)throw Error(`${flag} must be a positive finite number up to ${max}`);
 timingParameters[key]=value;nativeControls.push(flag,String(value));
}
const inferenceParameters={numStep,device:'cuda',dtype:'f16',preprocessPrompt:true,speed,...timingParameters};
const identity=families[family],binding=cast.productionVoices[identity.voiceId];
const lines=identity.topics.flatMap(topic=>copy[topic].de.map((text,index)=>({clipId:`${family}-${topic}-${String(index+1).padStart(2,'0')}`,voiceId:identity.voiceId,actorId:identity.actorId,topic,index,text,english:copy[topic].en[index],sourceSha256:sha(text)})));
const person=cast.existingAssetProfiles.find(person=>person.voiceId===identity.voiceId);
if(!person||person.gameCharacterId!==identity.actorId)throw Error('Neighbor identity missing from cast');
for(const [index,line] of person.dialogue.entries()){
 if(lines.some(previous=>previous.text===line.text))continue;
 lines.push({clipId:`${family}-story-${String(index+1).padStart(2,'0')}`,voiceId:identity.voiceId,actorId:identity.actorId,topic:'story',index,text:line.text,english:line.english,sourceSha256:sha(line.text)});
}
if(lines.length!==person.dialogue.length||new Set(lines.map(line=>line.clipId)).size!==lines.length||!lines.every(line=>person.dialogue.some(source=>source.text===line.text&&source.english===line.english)))throw Error('Neighbor plan must cover every cast-owned bilingual source exactly once');
const dialectAdvisory=identity.voiceId==='jwd-frau-schwabingen'&&binding?.asrPolicy==='dialect-advisory';
const only=option('--only',null),selected=only?new Set(only.split(',').map(id=>id.trim())):null;
if(selected&&[...selected].some(id=>!lines.some(line=>line.clipId===id)))throw Error('Unknown --only clip ID');
if(nativeControls.length&&(!selected||selected.size!==1||args.includes('--reuse-only')))throw Error('Explicit native timing controls require one --only clip and new generation');
const expandContractionsRequested=args.includes('--expand-contractions');
if(expandContractionsRequested&&(family!=='heiko'||!selected||selected.size!==1||args.includes('--reuse-only')))throw Error('Contraction expansion requires one Heiko --only clip and new generation');
const renderInputs=expandContractionsRequested?lines.filter(line=>selected.has(line.clipId)).map(contractionRenderInput):[];
const renderInputById=new Map(renderInputs.map(input=>[input.clipId,input]));
const diagnosticControls=[...nativeControls,...(expandContractionsRequested?['--expand-contractions']:[])],forceNewNative=diagnosticControls.length>0;
// A completed private raw batch can be encoded without moving its original pointers.
// These hashes establish source identity; final encoded word/level checks still apply.
const takeReceiptsPath=option('--take-receipts',null),importedTakes=new Map();
const preservePrivateReceipts=Boolean(takeReceiptsPath||forceNewNative);
if(args.includes('--take-receipts')&&!takeReceiptsPath)throw Error('--take-receipts needs a completed private raw handoff');
if(takeReceiptsPath){
 const receipt=read(resolve(takeReceiptsPath));
 if(receipt.status!=='private raw batch terminal; no encoding or admission'||!Array.isArray(receipt.results))throw Error('Private raw batch must be terminal before admission');
 for(const candidate of receipt.results.filter(candidate=>candidate.family===family)){
  const line=lines.find(line=>line.clipId===candidate.clipId);
  if(!line||importedTakes.has(candidate.clipId)||candidate.text!==line.text||candidate.english!==line.english||candidate.sourceSha256!==sha(line.text)||candidate.englishSha256!==sha(line.english)||candidate.profileId!==binding.profileId||candidate.referenceSha256!==binding.referenceSha256||candidate.referenceOriginalSha256!==binding.originalSha256||candidate.renderer!==binding.renderer||candidate.modelRevision!==binding.modelRevision||candidate.nativeCompleted!==true)throw Error('Private raw source/profile receipt drift');
  for(const file of [candidate.nativeWav,candidate.nativeAnnotation,candidate.inference])if(!file?.path||!file.sha256||sha(readFileSync(file.path))!==file.sha256)throw Error('Private raw file hash drift');
  const note=read(candidate.nativeAnnotation.path),bench=read(candidate.inference.path);
  if(note.clip_id!==line.clipId||!nativeSourceMatches(note,line,binding)||note.nativeCompletion?.completed!==true||note.nativeCompletion.inferenceSha256!==candidate.inference.sha256||JSON.stringify(note.nativeCompletion.inferenceParameters)!==JSON.stringify(candidate.inferenceParameters)||bench.seed!==candidate.seed||bench.iterations?.length!==1||resolve(bench.iterations[0].output_wav)!==resolve(candidate.nativeWav.path)||!(bench.iterations[0].frames>0))throw Error('Private raw native completion receipt drift');
  if(candidate.renderNormalizationPolicy!==note.renderNormalizationPolicy||note.renderNormalizationPolicy&&(candidate.actualInferenceText!==note.actualInferenceText||candidate.actualInferenceSha256!==note.actualInferenceSha256||candidate.canonicalSourceSha256!==note.canonicalSourceSha256))throw Error('Private raw actual render input receipt drift');
  importedTakes.set(line.clipId,{path:candidate.nativeWav.path,metadata_path:candidate.nativeAnnotation.path,cached:true,imported:true});
 }
}
if(forceNewNative&&importedTakes.size)throw Error('Explicit native diagnostics cannot reuse pre-rendered imported takes');
if(args.includes('--plan')){console.log(JSON.stringify({family,binding:binding??null,inferenceParameters,lines,...(renderInputs.length?{renderInputs}:{})},null,2));process.exit(0)}
if(!binding)throw Error(`No selected profile for ${identity.voiceId}`);
if(family==='heiko'||family==='inga')voiceFilter(binding,identity.voiceId);
// Refuse timing changes to an accepted take before profile calls or private writes.
const dest=resolve(root,'assets/voices/neighbors'),privateDir=resolve(dirname(data),'GermanySimulator street character production 2026-10-14',family);
const path=resolve(dest,`${family}-manifest.json`),old=existsSync(path)?read(path):null;
if(old)neighborRecordingsBlock(cast,[old]);
const retained=new Map(lines.flatMap(line=>{const clip=old?.clips.find(c=>c.clipId===line.clipId&&c.text===line.text&&c.english===line.english&&matchesProduction(cast,c));return clip&&existsSync(resolve(root,clip.file))&&sha(readFileSync(resolve(root,clip.file)))===clip.sha256?[[line.clipId,clip]]:[]}));
assertTimingTarget(diagnosticControls,selected,retained);
const live=call('list');verifyProfiles({productionVoices:{[identity.voiceId]:binding},productionExceptions:[]},live.profiles,data);
const runtime=read(resolve(dirname(exe),'resources/voice/voice-runtime.json'));
if(binding.renderer!=='omnivoice-rs'||binding.modelRevision!=='wide-rank-v2-prompt-preprocess'||sha(readFileSync(resolve(dirname(exe),'resources/voice/omnivoice-cli.exe')))!==runtime.binarySha256||sha(readFileSync(resolve(dirname(exe),'resources/voice/secret-tunnel-asr.exe')))!==runtime.asrBinarySha256)throw Error('Installed native renderer/ASR revision drift');
for(const take of importedTakes.values())if(read(take.metadata_path).nativeCompletion.binarySha256!==runtime.binarySha256)throw Error('Imported native renderer binary drift');
mkdirSync(dest,{recursive:true});mkdirSync(privateDir,{recursive:true});
const frozenPath=resolve(privateDir,`frozen-requests-${seed}.json`),frozen={family,binding,inferenceParameters,castSha256:sha(readFileSync(resolve(root,'For-AI/VOICE-CAST.json'))),gameSha256:sha(source),lines,...(renderInputs.length?{renderInputs}:{})};
if(existsSync(frozenPath)){
 const previous=read(frozenPath);
 if(JSON.stringify(previous.binding)!==JSON.stringify(binding)||JSON.stringify(previous.lines)!==JSON.stringify(lines))throw Error('Frozen neighbor request drift; preserve receipts and choose a new seed');
 if(JSON.stringify(previous.renderInputs??null)!==JSON.stringify(frozen.renderInputs??null))throw Error('Frozen actual render input changed; choose a new seed');
 if(JSON.stringify({numStep:32,device:'cuda',dtype:'f16',preprocessPrompt:true,speed:1,...previous.inferenceParameters})!==JSON.stringify(inferenceParameters))throw Error('Frozen inference settings changed; choose a new seed');
}else writeFileSync(frozenPath,JSON.stringify(frozen,null,2)+'\n');
const modelRoot=resolve(process.env.LOCALAPPDATA,'VoiceCloner/models/OmniVoice'),asrBinary=resolve(dirname(exe),'resources/voice/secret-tunnel-asr.exe'),referenceTranscriptPath=resolve(privateDir,'reference-transcript.json');
let referenceTranscript=existsSync(referenceTranscriptPath)?read(referenceTranscriptPath):null;
if(referenceTranscript?.referenceSha256!==binding.referenceSha256){
 if(referenceTranscript?.referenceSha256){const previousReference=resolve(privateDir,`reference-transcript-${referenceTranscript.referenceSha256}.json`);if(!existsSync(previousReference))writeFileSync(previousReference,readFileSync(referenceTranscriptPath));}
 const result=spawnSync(asrBinary,[resolve(modelRoot,'whisper'),resolve(data,'profiles',binding.profileId,'reference.wav'),'de'],{encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:8*1024*1024});if(result.status!==0)throw Error('Reference transcription failed');
 referenceTranscript={referenceSha256:binding.referenceSha256,...JSON.parse(result.stdout)};writeFileSync(referenceTranscriptPath,JSON.stringify(referenceTranscript,null,2));
}
const referenceText=referenceTranscript.transcript??referenceTranscript.text;
if(typeof referenceText!=='string'||!referenceText.trim())throw Error('Reference transcript is empty');
function render(line){
 if(importedTakes.has(line.clipId))return importedTakes.get(line.clipId);
 const previousPath=resolve(privateDir,line.clipId+'-take.json'),previousAsr=resolve(privateDir,line.clipId+'-asr.json');
 const matchesRequest=note=>nativeSourceMatches(note,line,binding);
 const previousAudit=existsSync(previousAsr)?read(previousAsr):null;
 if(!forceNewNative&&existsSync(previousPath)&&(dialectAdvisory||!previousAudit||spokenWords(previousAudit.text??previousAudit.transcript??'')===spokenWords(line.text))){
  const previous=read(previousPath);if(existsSync(previous.path)&&existsSync(previous.metadata_path)&&matchesRequest(read(previous.metadata_path)))return previous;
 }
 const nativeDir=resolve(dirname(exe),'audio-assets',binding.profileName),annotations=resolve(nativeDir,'annotations');
 if(!forceNewNative&&existsSync(annotations))for(const name of readdirSync(annotations).filter(name=>name.endsWith('.speech.json'))){
  const note=read(resolve(annotations,name));
  if(matchesRequest(note)&&(dialectAdvisory||spokenWords(note.word_fidelity?.transcript??'')===spokenWords(line.text)))return{path:resolve(nativeDir,'mp3s',note.audio_file),metadata_path:resolve(annotations,name),cached:true};
 }
 if(args.includes('--reuse-only')){
  const transcript=existsSync(previousAsr)?read(previousAsr).transcript:null;
  throw Error(transcript?`Saved take words differ; reuse-only does not synthesize: ${transcript}`:'No compatible saved take; reuse-only does not synthesize');
 }
 // Native automatic retries cannot converge on proper-name/& orthography.
 // Use its same installed inference binary for a bounded take, then audit words.
 const output=resolve(privateDir,line.clipId+`-${seed}-native.wav`),bench=resolve(privateDir,line.clipId+`-${seed}-inference.json`);
 if(existsSync(output)||existsSync(bench))throw Error('Native take already exists; choose a new --seed to preserve its source');
 const model=resolve(process.env.LOCALAPPDATA,'VoiceCloner/models/OmniVoice');
 const renderInput=renderInputById.get(line.clipId),actualInferenceText=renderInput?.actualInferenceText??line.text;
 const timeoutMs=Math.min(600000,Math.max(300000,90000+line.text.trim().split(/\s+/).length*6000));
 const result=spawnSync(resolve(dirname(exe),'resources/voice/omnivoice-cli.exe'),['infer','--model',model,'--text',actualInferenceText,'--output',output,'--language','German','--ref-audio',resolve(data,'profiles',binding.profileId,'reference.wav'),'--ref-text',referenceText,'--num-step',String(numStep),...(dialectAdvisory?['--guidance-scale','2']:[]),'--speed',String(speed),...nativeControls,'--preprocess-prompt','true','--device','cuda','--dtype','f16','--seed',String(seed),'--bench-json',bench],{encoding:'utf8',windowsHide:true,timeout:timeoutMs,maxBuffer:8*1024*1024});
 if(result.error||result.status!==0)throw Error(`Native render: ${result.error||result.stderr.slice(-1200)}`);
 const metadata_path=resolve(privateDir,line.clipId+`-${seed}-native.speech.json`);writeFileSync(metadata_path,JSON.stringify({clip_id:line.clipId,text:actualInferenceText,...(renderInput??{}),voice_id:binding.profileId,reference_sha256:binding.referenceSha256,engine:binding.renderer,inference_revision:binding.modelRevision,nativeCompletion:{completed:true,inferenceParameters,inferenceSha256:sha(readFileSync(bench)),binarySha256:sha(readFileSync(resolve(dirname(exe),'resources/voice/omnivoice-cli.exe')))}}));
 return{path:output,metadata_path,cached:false};
}
const clips=[],failed=new Map();
const snapshot=resolve(privateDir,`accepted-before-${seed}.json`);if(old&&!existsSync(snapshot))writeFileSync(snapshot,readFileSync(path));
const save=()=>{
 // Previously accepted exact takes stay available while later lines render.
 const ready=new Map([...retained,...clips.map(clip=>[clip.clipId,clip])]),accepted=lines.map(line=>ready.get(line.clipId)).filter(Boolean);
 const temp=path+`.writing-${process.pid}`;
 writeFileSync(temp,JSON.stringify({schemaVersion:1,voiceId:identity.voiceId,requestedLineCount:lines.length,clips:accepted,heldPrivate:lines.filter(x=>!ready.has(x.clipId)).map(x=>({...x,reason:failed.get(x.clipId)??old?.heldPrivate.find(h=>h.clipId===x.clipId&&h.text===x.text)?.reason??'not yet generated'}))},null,2)+'\n');replaceFile(temp,path);
};
for(const line of lines){
 let committed=false;
 try{
 const found=retained.get(line.clipId);
 if(found&&existsSync(resolve(root,found.file))&&sha(readFileSync(resolve(root,found.file)))===found.sha256){clips.push(found);console.log(JSON.stringify({clipId:line.clipId,cached:true}));continue}
 if(selected&&!selected.has(line.clipId))continue;
 console.log(JSON.stringify({clipId:line.clipId,stage:'generate',characters:line.text.length}));
 const take=render(line);
 const receiptStem=line.clipId+(preservePrivateReceipts?`-admission-${seed}`:'');
 const takePath=resolve(privateDir,receiptStem+'-take.json'),takeBackup=resolve(privateDir,line.clipId+`-take-before-${seed}.json`);
 if(!preservePrivateReceipts&&existsSync(takePath)&&!existsSync(takeBackup))writeFileSync(takeBackup,readFileSync(takePath));
 writeFileSync(takePath,JSON.stringify(take,null,2)+'\n',preservePrivateReceipts?{flag:'wx'}:{});
 const note=read(take.metadata_path);
 if(!nativeSourceMatches(note,line,binding))throw Error('Native receipt drift');
 if(!dialectAdvisory&&note.word_fidelity&&spokenWords(note.word_fidelity.transcript)!==spokenWords(line.text))throw Error('Native word verification failed');
 const file=`assets/voices/neighbors/${line.clipId}.mp3`,final=resolve(root,file);let measured;
 if(family==='heiko'||family==='inga')measured=encodeVoice(take.path,final,binding,identity.voiceId);
 else{
 const stats=levels(take.path);let gain=0;
 for(let attempt=0;attempt<6;attempt++){
  ffmpeg(['-hide_banner','-loglevel','error','-y','-i',take.path,'-af',`loudnorm=I=-18:TP=-2.5:LRA=11:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true,aresample=24000,volume=${gain}dB,alimiter=limit=0.62:attack=5:release=60:level=false`,'-ar','24000','-ac','1','-c:a','libmp3lame','-b:a','64k','-map_metadata','-1',final]);
  measured=levels(final);if(Math.abs(Number(measured.input_i)+18)<=.3&&Number(measured.input_tp)<=-1.5)break;gain+=-18-Number(measured.input_i);
 }
 if(Math.abs(Number(measured.input_i)+18)>.3||Number(measured.input_tp)>-1.5)throw Error('Final encoded levels out of tolerance: '+JSON.stringify(measured));
 }
 // ASR audits the shipped encoding, independently of the generation request.
 const wav=resolve(privateDir,receiptStem+'-encoded.wav');ffmpeg(['-hide_banner','-loglevel','error','-y','-i',final,'-ar','16000','-ac','1',wav]);
 const model=resolve(process.env.LOCALAPPDATA,'VoiceCloner/models/OmniVoice/whisper'),asrExe=resolve(dirname(exe),'resources/voice/secret-tunnel-asr.exe');
 const result=spawnSync(asrExe,[model,wav,'de'],{encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:8*1024*1024});if(result.error||result.status!==0)throw Error(`Encoded ASR: ${result.error||result.stderr.slice(-500)}`);
 const audit=JSON.parse(result.stdout);
 const asrPath=resolve(privateDir,receiptStem+'-asr.json'),previousAsrPath=resolve(privateDir,line.clipId+`-asr-before-${seed}.json`);
 if(!preservePrivateReceipts&&existsSync(asrPath)&&!existsSync(previousAsrPath))writeFileSync(previousAsrPath,readFileSync(asrPath));
 writeFileSync(asrPath,JSON.stringify(audit,null,2)+'\n',preservePrivateReceipts?{flag:'wx'}:{});
 const transcript=audit.text??audit.transcript,asrWordExact=typeof transcript==='string'&&spokenWords(transcript)===spokenWords(line.text);
 if(typeof transcript!=='string'||!transcript.trim()||!dialectAdvisory&&!asrWordExact)throw Error(`Final words differ for ${line.clipId}: ${transcript}`);
 const motion=energy(final),words=line.text.split(/\s+/).length;
 if(!Number.isFinite(motion.durationSeconds)||motion.durationSeconds<Math.max(.6,words/9)||motion.durationSeconds>words*2.5+5||!motion.mouthEnergy.some(value=>value>0))throw Error('Empty or implausibly truncated/extended encoded speech');
 const clip={...line,...(note.renderNormalizationPolicy?{canonicalSourceSha256:note.canonicalSourceSha256,actualInferenceText:note.actualInferenceText,actualInferenceSha256:note.actualInferenceSha256,renderNormalizationPolicy:note.renderNormalizationPolicy}:{}),file,profileId:binding.profileId,referenceSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,renderer:binding.renderer,modelRevision:binding.modelRevision,processing:binding.processing,...motion,sha256:sha(readFileSync(final)),nativeClipId:note.clip_id,nativeAnnotationSha256:sha(readFileSync(take.metadata_path)),nativeAudioSha256:sha(readFileSync(take.path)),nativeWordFidelity:note.word_fidelity??null,nativeCompletion:note.nativeCompletion??{completed:true,basis:'Completed native voice-cloner generation; source MP3 and scored transcript preserved'},asr:transcript,asrWordExact,asrVerificationMode:dialectAdvisory?'dialect-advisory':'word-exact',asrNormalizationSha256:sha(spokenWords.toString()),asrNormalization:'NFKC/case/punctuation/hyphen spacing; digits below 100 = German number words; finite historical daß/dass, muß/muss, bißchen/bisschen; finite authored German apostrophe contractions = base + es; finite so was/sowas, noch mal/nochmal and kennen zu lernen/kennenzulernen spacing; People & Culture = People and Culture; Maslos/Maßlos = Maaslos (proper-name spelling); Nachbarschafts-Offside = Nachbarschafts-offsite (German final devoicing)',asrScriptPrompt:null,asrModelSha256:sha(readFileSync(resolve(model,'whisper-large-v3-turbo-q4_0.gguf'))),asrRenderer:'secret-tunnel-asr / whisper-large-v3-turbo GGUF q4_0',asrLanguageId:'de',integratedLufs:Number(measured.input_i),truePeakDbtp:Number(measured.input_tp),approval:{status:'user-approved',scope:dialectAdvisory?'User selected GS Frau Schwabingen (2) and explicitly authorized advisory Whisper transcription for exaggerated Swabian dialect':'User requested this saved profile for fictional neighbor interactions',listening:'NOT RUN'}};
 commitClip(clips,clip,save);committed=true;
 console.log(JSON.stringify({clipId:clip.clipId,duration:clip.durationSeconds,lufs:clip.integratedLufs,dbtp:clip.truePeakDbtp,stage:'complete'}));
 }catch(error){
  // A failed metadata write must not leave an accepted row for a quarantined file.
  // Retained or already committed recordings are never quarantined by this path.
  if(committed||retained.has(line.clipId))throw error;
  const final=resolve(dest,line.clipId+'.mp3'),rejected=resolve(privateDir,line.clipId+`-${seed}-rejected.mp3`);if(existsSync(final))renameSync(final,existsSync(rejected)?resolve(privateDir,line.clipId+`-${seed}-${Date.now()}-rejected.mp3`):rejected);
  failed.set(line.clipId,String(error));save();console.log(JSON.stringify({clipId:line.clipId,stage:'held-private',reason:String(error)}));
 }
}
save();console.log(JSON.stringify({accepted:clips.length,held:lines.length-clips.length}));
