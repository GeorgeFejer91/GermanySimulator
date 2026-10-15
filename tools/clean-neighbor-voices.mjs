import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,copyFileSync,mkdirSync,existsSync,readdirSync,renameSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {cleanProcessing,dryProcessing,encodeVoice,energy,ffmpeg,replaceVoiceFiles} from './neighbor-voice-processing.mjs';
import {neighborRecordingsBlock,neighborSpokenWords} from './curate-voice-library.mjs';

const root=resolve(import.meta.dirname,'..'),args=process.argv.slice(2);
const runtime=resolve(process.env.LOCALAPPDATA,'Secret Tunnel 6');
const data=readFileSync(resolve(runtime,'voice-data-root.txt'),'utf8').trim();
const privateRoot=resolve(dirname(data),'GermanySimulator street character production 2026-10-14');
const stage=resolve(privateRoot,'speech-cleanup-v1');mkdirSync(stage,{recursive:true});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const asrBinary=resolve(runtime,'resources/voice/secret-tunnel-asr.exe');
const model=resolve(process.env.LOCALAPPDATA,'VoiceCloner/models/OmniVoice/whisper');
const asrModelSha256=sha(readFileSync(resolve(model,'whisper-large-v3-turbo-q4_0.gguf')));
if(sha(readFileSync(asrBinary))!==read(resolve(runtime,'resources/voice/voice-runtime.json')).asrBinarySha256)throw Error('ASR runtime revision drift');
const castPath=resolve(root,'For-AI/VOICE-CAST.json'),cast=read(castPath);
const candidateCast=structuredClone(cast),staged=[],failures=[];
for(const family of ['heiko','inga'])candidateCast.productionVoices[`jwd-${family}-maaslos`].processing=cleanProcessing;

function nativeSource(clip,family,binding){
 const originals=resolve(stage,family,'originals');mkdirSync(originals,{recursive:true});
 const preserve=(audio,annotation)=>{
  const source=resolve(originals,clip.clipId+extname(audio)),note=resolve(originals,clip.clipId+'.speech.json');
  for(const [from,to,hash] of [[audio,source,clip.nativeAudioSha256],[annotation,note,clip.nativeAnnotationSha256]]){
   if(!existsSync(to))copyFileSync(from,to);
   if(sha(readFileSync(to))!==hash)throw Error(`Private original archive drift: ${clip.clipId}`);
  }
  return source;
 };
 const takePaths=[resolve(privateRoot,family,clip.clipId+'-take.json'),resolve(root,'output/neighbors/voice-authoring',family,clip.clipId+'-take.json')];
 for(const takePath of takePaths.filter(existsSync)){
  const take=read(takePath);
  if(existsSync(take.path)&&existsSync(take.metadata_path)&&sha(readFileSync(take.path))===clip.nativeAudioSha256&&sha(readFileSync(take.metadata_path))===clip.nativeAnnotationSha256)return preserve(take.path,take.metadata_path);
 }
 const nativeDir=resolve(runtime,'audio-assets',binding.profileName),annotations=resolve(nativeDir,'annotations');
 for(const name of readdirSync(annotations).filter(name=>name.endsWith('.speech.json'))){
  const bytes=readFileSync(resolve(annotations,name));
  if(sha(bytes)!==clip.nativeAnnotationSha256)continue;
  const note=JSON.parse(bytes),path=resolve(nativeDir,'mp3s',note.audio_file);
  if(sha(readFileSync(path))===clip.nativeAudioSha256)return preserve(path,resolve(annotations,name));
 }
 throw Error(`Original native source missing for ${clip.clipId}`);
}

for(const family of ['heiko','inga']){
 const path=resolve(root,`assets/voices/neighbors/${family}-manifest.json`),baseline=readFileSync(path),manifest=JSON.parse(baseline);
 const selected=cast.productionVoices[manifest.voiceId];
 if(selected.processing===cleanProcessing&&manifest.clips.every(clip=>clip.processing===cleanProcessing)){neighborRecordingsBlock(cast,[manifest]);continue;}
 if(![dryProcessing,cleanProcessing].includes(selected.processing))throw Error('Unexpected previous recipe');
 const beforeCast=structuredClone(cast);beforeCast.productionVoices[manifest.voiceId].processing=dryProcessing;
 neighborRecordingsBlock(beforeCast,[manifest]);
 const dest=resolve(stage,family);mkdirSync(dest,{recursive:true});
 const backupPath=resolve(dest,`before-${sha(baseline)}.json`);if(!existsSync(backupPath))writeFileSync(backupPath,baseline);
 if(sha(readFileSync(backupPath))!==sha(baseline))throw Error('Manifest backup hash mismatch');
 const binding=candidateCast.productionVoices[manifest.voiceId],clips=[];
 for(const clip of manifest.clips){
  try{
  if(clip.asrModelSha256!==asrModelSha256)throw Error(`ASR model changed: ${clip.clipId}`);
  const receipt=resolve(dest,clip.clipId+'.json'),output=resolve(dest,clip.clipId+'.mp3');
  if(existsSync(receipt)&&existsSync(output)){
   const saved=read(receipt);
   if(saved.beforeSha256===clip.sha256&&saved.clip.processing===cleanProcessing&&sha(readFileSync(output))===saved.clip.sha256){clips.push(saved.clip);continue;}
  }
  const original=nativeSource(clip,family,selected),measured=encodeVoice(original,output,binding,clip.voiceId),cues=energy(output);
  if(Math.abs(cues.durationSeconds-clip.durationSeconds)>.05)throw Error(`Duration changed: ${clip.clipId}`);
  const wav=resolve(dest,clip.clipId+'.wav');ffmpeg(['-hide_banner','-loglevel','error','-y','-i',output,'-ar','16000','-ac','1',wav]);
  const result=spawnSync(asrBinary,[model,wav,'de'],{encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:8*1024*1024});
  if(result.error||result.status!==0)throw Error(`ASR failed: ${clip.clipId}: ${result.error||result.stderr.slice(-500)}`);
  const audit=JSON.parse(result.stdout),transcript=audit.text??audit.transcript;
  writeFileSync(resolve(dest,clip.clipId+'-asr.json'),JSON.stringify(audit,null,2)+'\n');
  if(typeof transcript!=='string'||neighborSpokenWords(transcript)!==neighborSpokenWords(clip.text))throw Error(`Cleaned words differ: ${clip.clipId}: ${transcript}`);
  const cleaned={...clip,processing:cleanProcessing,...cues,sha256:sha(readFileSync(output)),asr:transcript,asrWordExact:true,integratedLufs:Number(measured.input_i),truePeakDbtp:Number(measured.input_tp),cleanup:{version:1,previousEncodedSha256:clip.sha256,sourceAudioSha256:sha(readFileSync(original)),asrSha256:sha(readFileSync(resolve(dest,clip.clipId+'-asr.json')))},approval:{...clip.approval,listening:'NOT RUN'}};
  writeFileSync(receipt,JSON.stringify({beforeSha256:clip.sha256,clip:cleaned},null,2)+'\n');clips.push(cleaned);
  console.log(JSON.stringify({clipId:clip.clipId,stage:'verified',lufs:cleaned.integratedLufs,peak:cleaned.truePeakDbtp}));
  }catch(error){
   failures.push({clipId:clip.clipId,error:String(error)});console.log(JSON.stringify({clipId:clip.clipId,stage:'rejected',error:String(error)}));
  }
 }
 const candidate={...manifest,clips},candidateBytes=JSON.stringify(candidate,null,2)+'\n';
 writeFileSync(resolve(dest,'manifest.json'),candidateBytes);
 staged.push({family,path,baseline,candidate,dest,selected,manifestSha256:sha(candidateBytes)});
}
if(failures.length)throw Error('Private staging rejected clips; shared assets unchanged: '+JSON.stringify(failures));
function checkCandidate(clip,previous,output){
 const changed=new Set(['processing','mouthEnergy','mouthHz','durationSeconds','sha256','asr','asrWordExact','integratedLufs','truePeakDbtp','cleanup','approval']);
 for(const [key,value] of Object.entries(previous))if(!changed.has(key)&&JSON.stringify(clip[key])!==JSON.stringify(value))throw Error(`Candidate receipt drift: ${clip.clipId}: ${key}`);
 if(clip.processing!==cleanProcessing||clip.asrWordExact!==true||neighborSpokenWords(clip.asr)!==neighborSpokenWords(clip.text)||clip.sourceSha256!==sha(clip.text))throw Error('Candidate source/words/processing drift');
 if(Math.abs(clip.integratedLufs+18)>.3||clip.truePeakDbtp>-1.5||Math.abs(clip.durationSeconds-previous.durationSeconds)>.05)throw Error('Candidate levels/duration drift');
 if(clip.approval.status!==previous.approval.status||clip.approval.scope!==previous.approval.scope||clip.approval.listening!=='NOT RUN')throw Error('Candidate use/listening approval drift');
 const auditPath=resolve(dirname(output),clip.clipId+'-asr.json'),audit=read(auditPath);
 if(sha(readFileSync(auditPath))!==clip.cleanup.asrSha256||(audit.text??audit.transcript)!==clip.asr||clip.cleanup.previousEncodedSha256!==previous.sha256||clip.cleanup.sourceAudioSha256!==previous.nativeAudioSha256)throw Error('Candidate ASR/source receipt drift');
 const actual=energy(output);
 if(actual.mouthHz!==clip.mouthHz||actual.durationSeconds!==clip.durationSeconds||JSON.stringify(actual.mouthEnergy)!==JSON.stringify(clip.mouthEnergy))throw Error('Candidate encoded mouth cue drift');
}
if(args.includes('--apply')){
 const current=read(castPath),files=[],preflightRoot=resolve(stage,'preflight');
 mkdirSync(resolve(preflightRoot,'assets/voices/neighbors'),{recursive:true});
 for(const entry of staged){
  if(!readFileSync(entry.path).equals(entry.baseline))throw Error('Manifest changed during staging; rerun to include latest takes');
  const expected={...entry.selected,processing:cleanProcessing};
  if(JSON.stringify(current.productionVoices[entry.candidate.voiceId])!==JSON.stringify(expected))throw Error('Integrator must first select the approved clean processing binding');
  const originals=JSON.parse(entry.baseline),oldClips=new Map(originals.clips.map(clip=>[clip.clipId,clip]));
  for(const clip of entry.candidate.clips){
   const previous=oldClips.get(clip.clipId),output=resolve(entry.dest,clip.clipId+'.mp3');
   nativeSource(clip,entry.family,entry.selected);checkCandidate(clip,previous,output);
   copyFileSync(output,resolve(preflightRoot,clip.file));
   files.push({target:resolve(root,clip.file),staged:output,backup:resolve(entry.dest,clip.clipId+`-before-${previous.sha256}.mp3`),beforeSha256:previous.sha256,afterSha256:clip.sha256});
  }
  neighborRecordingsBlock(current,[entry.candidate],preflightRoot);
  files.push({target:entry.path,staged:resolve(entry.dest,'manifest.json'),backup:resolve(entry.dest,`before-${sha(entry.baseline)}.json`),beforeSha256:sha(entry.baseline),afterSha256:entry.manifestSha256});
 }
 if(files.length)replaceVoiceFiles(files,resolve(stage,'apply-journal.json'),()=>{for(const entry of staged)neighborRecordingsBlock(current,[read(entry.path)]);});
}
console.log(JSON.stringify({mode:args.includes('--apply')?'applied':'staged',families:staged.map(e=>({family:e.family,clips:e.candidate.clips.length,held:e.candidate.heldPrivate.length})),listening:'NOT RUN'}));
