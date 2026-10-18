import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';

const owners={parent:'jwd-heiko-maaslos',watcher:'jwd-inga-maaslos',swabian:'jwd-frau-schwabingen',child:'jwd-theodore-maaslos'};
export function neighborVoiceCoverage(cast,catalog,story){
 const rows=[],invalid=[],storyLines=[];
 for(const [role,voiceId] of Object.entries(owners)){
  const person=cast.existingAssetProfiles.find(person=>person.voiceId===voiceId&&person.gameRole==='jwd-neighbor'&&person.runtimeStatus!=='archived');
  if(!person?.dialogue?.length)throw Error('Missing active neighbor source owner: '+voiceId);
  const binding=cast.productionVoices[voiceId];
  if(!binding)throw Error('Missing selected neighbor voice: '+voiceId);
  const seen=new Set();
  for(const source of person.dialogue){
   if(seen.has(source.text))throw Error('Duplicate neighbor source: '+voiceId);
   seen.add(source.text);
   const path=catalog.candidateClip(voiceId,source.text)||null,recording=path?catalog.recordings[path]:null;
   const row={role,actorId:person.gameCharacterId,voiceId,text:source.text,english:source.english,path};
   rows.push(row);
   if(path&&(!recording||recording.voiceId!==voiceId||recording.source!==source.text||recording.english!==source.english||recording.referenceOriginalSha256!==binding.originalSha256||
    !['profileId','referenceSha256','renderer','modelRevision','processing'].every(key=>recording[key]===binding[key])))invalid.push(row);
  }
 }
 for(const [role,scripts] of Object.entries(story.tours))for(const script of scripts)for(const stop of script.stops)for(const kind of ['walkLines','lines'])for(const line of stop[kind]||[]){
  const voiceId=owners[line.speaker==='child'?'child':role];
  const row=rows.find(row=>row.voiceId===voiceId&&row.text===line.de&&row.english===line.en);
  if(!row)throw Error('Story line has no exact owned bilingual source: '+line.id);
  storyLines.push({id:line.id,script:script.id,stop:stop.id,kind,voiceId,path:row.path});
 }
 return {expected:rows.length,resolved:rows.filter(row=>row.path).length,missing:rows.filter(row=>!row.path),invalid,storyLines,rows};
}

export function main(args=process.argv.slice(2)){
 const root=resolve(import.meta.dirname,'..'),context={window:{}};
 vm.createContext(context);
 for(const file of ['For-AI/AUDIO-TEXT-LIBRARY.js','neighbor-story.js'])vm.runInContext(readFileSync(resolve(root,file),'utf8'),context,{filename:file});
 const report=neighborVoiceCoverage(JSON.parse(readFileSync(resolve(root,'For-AI/VOICE-CAST.json'),'utf8')),context.window.GermanySimulatorAudioText,context.window.JwdStory);
 console.log(JSON.stringify(report,null,2));
 if(args.includes('--check')&&(report.missing.length||report.invalid.length))process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main();
