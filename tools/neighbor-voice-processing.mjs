import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,copyFileSync,renameSync,existsSync} from 'node:fs';

export const dryProcessing='dry mono 24 kHz / 64 kbps MP3; two-pass EBU R128 -18 LUFS, -2.5 dBTP target; metadata removed';
export const cleanupFilter="agate=threshold=0.006:ratio=1.5:range=0.1:attack=2:release=150:enable='gte(t,0.3)'";
export const cleanProcessing=`${dryProcessing}; speech cleanup v1: ${cleanupFilter}`;
const cleanVoices=new Set(['jwd-heiko-maaslos','jwd-inga-maaslos']);

export function voiceFilter(binding,voiceId){
 if(cleanVoices.has(voiceId)){
  if(binding.processing!==cleanProcessing)throw Error(`Missing approved speech cleanup for ${voiceId}`);
  return cleanupFilter;
 }
 if(binding.processing!==dryProcessing)throw Error(`Unknown neighbor processing for ${voiceId}`);
 return '';
}

export function ffmpeg(params,binary=false){
 const result=spawnSync('ffmpeg',params,{encoding:binary?null:'utf8',windowsHide:true,timeout:120000,maxBuffer:30*1024*1024});
 if(result.error||result.status!==0)throw Error(String(result.error||result.stderr).slice(-1000));
 return binary?result.stdout:result.stderr;
}

export function levels(path,filter=''){
 const report=ffmpeg(['-hide_banner','-nostats','-i',path,'-af',[filter,'loudnorm=I=-18:TP=-2:LRA=11:print_format=json'].filter(Boolean).join(','),'-f','null','NUL']);
 return JSON.parse(report.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
}

export function encodeVoice(source,destination,binding,voiceId){
 const filter=voiceFilter(binding,voiceId),stats=levels(source,filter);
 let measured,gain=0;
 for(let attempt=0;attempt<6;attempt++){
  const normalize=`loudnorm=I=-18:TP=-2.5:LRA=11:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true`;
  ffmpeg(['-hide_banner','-loglevel','error','-y','-i',source,'-af',[filter,normalize,'aresample=24000',`volume=${gain}dB`,'alimiter=limit=0.62:attack=5:release=60:level=false'].filter(Boolean).join(','),'-ar','24000','-ac','1','-c:a','libmp3lame','-b:a','64k','-map_metadata','-1',destination]);
  measured=levels(destination);
  if(Math.abs(Number(measured.input_i)+18)<=.3&&Number(measured.input_tp)<=-1.5)return measured;
  gain+=-18-Number(measured.input_i);
 }
 throw Error('Final encoded levels out of tolerance: '+JSON.stringify(measured));
}

export function energy(path){
 const bytes=ffmpeg(['-hide_banner','-loglevel','error','-i',path,'-f','f32le','-ac','1','-ar','24000','pipe:1'],true);
 const samples=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)),values=[];
 for(let i=0;i<samples.length;i+=600){
  let total=0;const end=Math.min(i+600,samples.length);
  for(let j=i;j<end;j++)total+=samples[j]**2;
  values.push(Math.sqrt(total/(end-i)));
 }
 const scale=[...values].sort((a,b)=>a-b)[Math.floor(values.length*.95)]||1;
 return {mouthHz:40,mouthEnergy:values.map(v=>Math.min(255,Math.round(255*(v/scale)**.7))),durationSeconds:samples.length/24000};
}

export function replaceVoiceFiles(files,journalPath,validate){
 const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
 if(new Set(files.map(file=>file.target)).size!==files.length)throw Error('Duplicate voice replacement target');
 for(const file of files){
  if(hash(file.target)!==file.beforeSha256)throw Error(`Current voice file changed: ${file.target}`);
  if(hash(file.staged)!==file.afterSha256)throw Error(`Staged voice file changed: ${file.staged}`);
  if(!existsSync(file.backup))copyFileSync(file.target,file.backup);
  if(hash(file.backup)!==file.beforeSha256)throw Error(`Voice backup changed: ${file.backup}`);
 }
 for(const file of files){
  if(hash(file.target)!==file.beforeSha256||hash(file.staged)!==file.afterSha256)throw Error('Voice files changed during preflight');
 }
 const record=status=>writeFileSync(journalPath,JSON.stringify({status,files},null,2)+'\n');
 const replace=(from,target,suffix)=>{copyFileSync(from,target+suffix);renameSync(target+suffix,target)};
 record('prepared');
 try{
  for(const file of files)replace(file.staged,file.target,'.voice-cleaning');
  for(const file of files)if(hash(file.target)!==file.afterSha256)throw Error(`Replacement hash mismatch: ${file.target}`);
  validate();record('complete');
 }catch(error){
  const failed=[];
  for(const file of files){
   try{
    if(hash(file.backup)!==file.beforeSha256)throw Error('Backup hash mismatch');
    replace(file.backup,file.target,'.voice-restoring');
   }catch(restoreError){failed.push({target:file.target,error:String(restoreError)});}
  }
  writeFileSync(journalPath,JSON.stringify({status:failed.length?'recovery-required':'rolled-back',files,error:String(error),failed},null,2)+'\n');
  throw Error(failed.length?'Voice cleanup failed; recovery required: '+JSON.stringify(failed):'Voice cleanup failed; original files restored',{cause:error});
 }
}
