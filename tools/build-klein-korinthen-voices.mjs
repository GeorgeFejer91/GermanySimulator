// Authoring only. Uses the installed native Voice Cloner and existing private CC0 reference library.
import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {CAST,LINES} from '../levels/klein-korinthen/content.mjs';
import {neighborSpokenWords} from './curate-voice-library.mjs';
const root=resolve(import.meta.dirname,'..'),exe=resolve(process.env.LOCALAPPDATA,'Secret Tunnel 6/secret-tunnel-v6.exe');
const data=readFileSync(resolve(dirname(exe),'voice-data-root.txt'),'utf8').trim();
const privateDir=resolve(data,'generation-work/klein-korinthen'),dest=resolve(root,'assets/klein-korinthen');mkdirSync(privateDir,{recursive:true});mkdirSync(resolve(dest,'voices'),{recursive:true});
const read=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,'')),sha=b=>createHash('sha256').update(b).digest('hex');
function run(ex,args,options={}){const r=spawnSync(ex,args,{encoding:'utf8',windowsHide:true,maxBuffer:24*1024*1024,timeout:600000,...options});if(r.error||r.status!==0)throw Error(String(r.error||r.stderr).slice(-1800));return r.stdout;}
function call(operation,input={}){const r=JSON.parse(run(exe,['--voice-cli'],{input:JSON.stringify({operation,input})}));if(!r.ok)throw Error(JSON.stringify(r.error));return r.result}
const sourceIds={dietmar:'0042c79859fd493bb623e734ee5264eb',gisela:'b8e442e72d8a495398d9c18e9d7f0a13',ronny:'85143d8946134380a66a1f4e004eb542',ute:'0eb3aa7605454f6eaa5612a4a9214085'};
const castPath=resolve(root,'For-AI/VOICE-CAST.json'),cast=read(castPath),profiles=call('list').profiles;
const bindingPath=resolve(privateDir,'bindings.json'),bindings=existsSync(bindingPath)?read(bindingPath):{};
for(const [id,actor]of Object.entries(CAST)){
  const source=profiles.find(p=>p.id===sourceIds[id]);if(!source)throw Error('Missing source profile '+id);
  const reference=readFileSync(resolve(data,'profiles',source.id,'reference.wav'));if(sha(reference)!==source.reference_sha256)throw Error('Reference mismatch '+id);
  if(!bindings[id]){
    const p=call('create',{name:`GS ${actor.name} (${actor.voiceId})`,extension:'wav',audioBase64:reference.toString('base64'),source:`Klein-Korinthen original fictional character; ${source.source}; source profile ${source.id}; reference SHA256 ${source.reference_sha256}; user requested creation 2026-10-28`,referenceText:source.reference_text});
    bindings[id]={profileId:p.id,profileName:p.name,originalSha256:p.original_sha256,referenceSha256:p.reference_sha256,referenceText:p.reference_text,sourceProfileId:source.id,source:source.source,renderer:'omnivoice-rs',modelRevision:'wide-rank-v2-prompt-preprocess',processing:'highpass 65Hz; EBU R128 -18 LUFS, -2.5dBTP; 24kHz mono MP3 64kbps',fallback:'captions',selectedOn:'2026-10-28',selection:'User-requested original experimental neighborhood cast; distinct source speakers 15/13/3/8; perceptual listening NOT RUN'};
    writeFileSync(bindingPath,JSON.stringify(bindings,null,2));console.log(JSON.stringify({profile:id,id:p.id}));
  }
  cast.productionVoices[actor.voiceId]={...bindings[id]};delete cast.productionVoices[actor.voiceId].referenceText;
}
writeFileSync(castPath,JSON.stringify(cast,null,2)+'\n');
if(process.argv.includes('--profiles-only'))process.exit(0);
const manifestPath=resolve(dest,'voices.json'),manifest=existsSync(manifestPath)?read(manifestPath):{schemaVersion:1,clips:[]};manifest.held??=[];
const wanted=process.argv.includes('--line')?process.argv[process.argv.indexOf('--line')+1]:null;
const seed=process.argv.includes('--seed')?Number(process.argv[process.argv.indexOf('--seed')+1]):83;
const steps=process.argv.includes('--steps')?process.argv[process.argv.indexOf('--steps')+1]:'32';
const speed=process.argv.includes('--speed')?process.argv[process.argv.indexOf('--speed')+1]:'1';
const model=resolve(process.env.LOCALAPPDATA,'VoiceCloner/models/OmniVoice'),native=resolve(dirname(exe),'resources/voice/omnivoice-cli.exe'),asrExe=resolve(dirname(exe),'resources/voice/secret-tunnel-asr.exe');
function ff(args,raw=false){return run('ffmpeg',args,{encoding:raw?null:'utf8'})}
function levels(file){const r=spawnSync('ffmpeg',['-hide_banner','-nostats','-i',file,'-af','loudnorm=I=-18:TP=-2.5:LRA=11:print_format=json','-f','null','-'],{encoding:'utf8',windowsHide:true});return JSON.parse(r.stderr.match(/\{[^{}]*"input_i"[^{}]*\}/s)?.[0]??'{}')}
const save=()=>writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
for(const [id,line]of Object.entries(LINES)){
  if(wanted&&wanted!==id)continue;
  if(manifest.clips.some(c=>c.id===id&&c.text===line.de&&Math.abs(c.integratedLufs+18)<=.3&&existsSync(resolve(dest,c.file))))continue;
  const b=bindings[line.speaker],stem=resolve(privateDir,`${id}-${seed}`),wav=stem+'.wav',bench=stem+'-inference.json',encoded=stem+'.mp3';
  try{
    if(!existsSync(wav))run(native,['infer','--model',model,'--text',line.de,'--output',wav,'--language','German','--ref-audio',resolve(data,'profiles',b.profileId,'reference.wav'),'--ref-text',b.referenceText,'--num-step',steps,'--speed',speed,'--preprocess-prompt','true','--device','cuda','--dtype','f16','--seed',String(seed),'--bench-json',bench]);
    let finalLevels,target=-18;
    for(let attempt=0;attempt<5;attempt++){
      ff(['-hide_banner','-loglevel','error','-y','-i',wav,'-af',`highpass=f=65,loudnorm=I=${target}:TP=-2.5:LRA=7`,'-ar','24000','-ac','1','-c:a','libmp3lame','-b:a','64k','-map_metadata','-1',encoded]);
      finalLevels=levels(encoded);if(Math.abs(Number(finalLevels.input_i)+18)<=.3&&Number(finalLevels.input_tp)<=-1.5)break;
      target+=-18-Number(finalLevels.input_i);
    }
    const asrWav=stem+'-encoded.wav';ff(['-hide_banner','-loglevel','error','-y','-i',encoded,'-ar','16000','-ac','1',asrWav]);
    const audit=JSON.parse(run(asrExe,[resolve(model,'whisper'),asrWav,'de']));writeFileSync(stem+'-asr.json',JSON.stringify(audit,null,2));const transcript=audit.text??audit.transcript;
    // Compound boundaries alone do not change spoken German; no words or negations are removed.
    const norm=t=>neighborSpokenWords(t.replace(/\bcm\b/gi,'Zentimeter').replace(/\bVereinsatzung\b/gi,'Vereinssatzung')).replaceAll(' ','').replaceAll('ß','ss');
    if(norm(transcript)!==norm(line.de))throw Error('Final MP3 transcript differs: '+transcript);
    const pcm=ff(['-v','error','-i',encoded,'-f','f32le','-ar','24000','-ac','1','-'],true),samples=new Float32Array(pcm.buffer,pcm.byteOffset,pcm.length/4),energy=[];
    for(let i=0;i<samples.length;i+=600){let e=0;for(let j=i;j<Math.min(samples.length,i+600);j++)e+=samples[j]*samples[j];energy.push(Math.round(Math.min(1,Math.sqrt(e/600)*8)*1000)/1000)}
    if(Math.abs(Number(finalLevels.input_i)+18)>.3||Number(finalLevels.input_tp)>-1.5)throw Error('Encoded levels outside tolerance '+JSON.stringify(finalLevels));
    const file=`voices/${id}.mp3`;copyFileSync(encoded,resolve(dest,file));
    const clip={id,text:line.de,english:line.en,voiceId:CAST[line.speaker].voiceId,file,...b,sha256:sha(readFileSync(encoded)),sourceSha256:sha(line.de),nativeAudioSha256:sha(readFileSync(wav)),nativeInferenceSha256:sha(readFileSync(bench)),asr:transcript,asrWordExact:true,asrNormalization:'existing neighborSpokenWords; German compound space equivalence; cm=Zentimeter; ASR spelling Vereinsatzung=Vereinssatzung',asrScriptPrompt:null,asrReceiptSha256:sha(readFileSync(stem+'-asr.json')),nativeCompletion:true,duration:samples.length/24000,integratedLufs:Number(finalLevels.input_i),truePeakDbtp:Number(finalLevels.input_tp),normalizationTarget:target,energy,listening:'NOT RUN'};
    delete clip.referenceText;manifest.clips=manifest.clips.filter(c=>c.id!==id);manifest.clips.push(clip);manifest.held=manifest.held.filter(c=>c.id!==id);save();console.log(JSON.stringify({id,status:'accepted',duration:clip.duration,lufs:clip.integratedLufs}));
  }catch(error){manifest.held=manifest.held.filter(c=>c.id!==id);manifest.held.push({id,text:line.de,reason:String(error)});save();console.log(JSON.stringify({id,status:'held',reason:String(error)}));}
}
