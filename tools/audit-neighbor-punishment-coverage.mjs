// Completion audit, deliberately separate from tests that permit incremental authoring.
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {neighborRecordingsBlock} from './curate-voice-library.mjs';
import {policeContactSources} from './police-contact-voice-source.mjs';
const root=resolve(import.meta.dirname,'..'),read=path=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
const window={};for(const file of ['neighbor-punishment.js','For-AI/AUDIO-TEXT-LIBRARY.js'])vm.runInNewContext(readFileSync(resolve(root,file),'utf8'),{window});
const cast=read('For-AI/VOICE-CAST.json'),library=window.GermanySimulatorAudioText,missing=[],counts={};
for(const family of ['heiko','inga','schwabingen']){
 const path=`assets/voices/neighbors/punishment-${family}-manifest.json`,manifest=existsSync(resolve(root,path))?read(path):null;
 if(manifest)neighborRecordingsBlock(cast,[manifest]);counts[family]=0;
 for(const story of window.JwdPunishment.stories.filter(row=>row.id.startsWith(`punishment-${family}-`))){
  const line=story.lines[0],clip=manifest?.clips.find(row=>row.clipId===line.id),file=clip&&resolve(root,clip.file);
  if(!clip||!existsSync(file)||createHash('sha256').update(readFileSync(file)).digest('hex')!==clip.sha256||library.recordedClip(story.voiceId,line.de)!=='./'+clip.file||library.recordings['./'+clip.file]?.sha256!==clip.sha256){missing.push(line.id);continue}
  counts[family]++;
 }
}
const police=process.argv.includes('--with-police');if(police){
 counts.police=0;const path='assets/voices/police-contact/police-contact-manifest.json',manifest=existsSync(resolve(root,path))?read(path):null;
 for(const row of policeContactSources(cast)){const clip=manifest?.clips.find(clip=>clip.clipId===row.clipId),file=clip&&resolve(root,clip.file);if(!clip||!existsSync(file)||createHash('sha256').update(readFileSync(file)).digest('hex')!==clip.sha256||library.recordedClip(row.voiceId,row.text)!=='./'+clip.file||library.recordings['./'+clip.file]?.sha256!==clip.sha256){missing.push(row.clipId);continue}counts.police++;}
}
console.log(JSON.stringify({required:police?26:24,admitted:Object.values(counts).reduce((sum,count)=>sum+count,0),counts,missing,listening:'NOT RUN'}));
if(missing.length)process.exitCode=1;
