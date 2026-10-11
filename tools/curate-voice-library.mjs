import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {copyFileSync,existsSync,lstatSync,mkdirSync,readdirSync,readFileSync,realpathSync,unlinkSync,writeFileSync} from 'node:fs';
import {dirname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

// One cast authority, one derived runtime table, one private archive. No daemon.
export const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const json=path=>JSON.parse(readFileSync(path,'utf8').replace(/^\uFEFF/,''));
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const requireMatch=(ok,why)=>{if(!ok)throw Error(why)};
const originalFile=path=>{const names=readdirSync(path).filter(name=>/^original\.[a-z0-9]+$/i.test(name));requireMatch(names.length===1,'Missing/ambiguous original audio');return resolve(path,names[0])};
export function matchesProduction(cast,clip,requireReceipt=true){
 const selected=cast.productionVoices[clip.voiceId];
 const exception=cast.productionExceptions.find(p=>p.voiceId===clip.voiceId&&p.clipId===(clip.clipId||clip.id));
 const binding=exception||selected;
 const reference=binding&&(clip.referenceHashKind==='uploaded-original'?binding.originalSha256:binding.referenceSha256);
 return !binding?!requireReceipt:clip.profileId===binding.profileId&&
  ((!requireReceipt&&!clip.renderer)||clip.renderer===binding.renderer)&&
  ((!requireReceipt&&!clip.modelRevision)||clip.modelRevision===binding.modelRevision)&&
  ((!requireReceipt&&!clip.referenceSha256)||clip.referenceSha256===reference)&&
  (!clip.referenceOriginalSha256||clip.referenceOriginalSha256===binding.originalSha256)&&
  ((!requireReceipt&&!clip.processing)||clip.processing===binding.processing);
}
export function writeArchiveMetadata(archive,relative,contents){
 const base=realpathSync(archive),target=resolve(base,relative);requireMatch(target.startsWith(base+sep),'Archive metadata escapes archive');
 mkdirSync(dirname(target),{recursive:true});requireMatch(realpathSync(dirname(target)).startsWith(base+sep)||realpathSync(dirname(target))===base,'Archive metadata directory is linked outside archive');
 if(existsSync(target)){const stat=lstatSync(target);requireMatch(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&realpathSync(target).startsWith(base+sep),'Archive metadata file is linked outside archive');}
 writeFileSync(target,contents);
}
function request(exe,operation,input={}){
 const result=spawnSync(exe,['--voice-cli'],{input:JSON.stringify({operation,input}),encoding:'utf8',windowsHide:true,timeout:60000,maxBuffer:8*1024*1024});
 requireMatch(!result.error&&result.status===0,`Voice Cloner ${operation} failed: ${result.error||result.stderr.slice(-300)}`);
 const response=JSON.parse(result.stdout);requireMatch(response.ok,`Voice Cloner ${operation}: ${JSON.stringify(response.error)}`);return response.result;
}
export function verifyProfiles(cast,profiles,data){
 const byId=new Map(profiles.map(p=>[p.id,p]));requireMatch(byId.size===profiles.length,'Duplicate live profile UUID');
 const bindings=[...Object.values(cast.productionVoices),...cast.productionExceptions];
 for(const binding of bindings){
  const profile=byId.get(binding.profileId);requireMatch(profile,`Missing production profile ${binding.profileId}`);
  for(const [key,value] of Object.entries({name:binding.profileName,original_sha256:binding.originalSha256,reference_sha256:binding.referenceSha256,saved:true}))requireMatch(profile[key]===value,`Profile drift ${binding.profileId}: ${key}`);
  if(data){const path=realpathSync(resolve(data,'profiles',binding.profileId));requireMatch(path.startsWith(realpathSync(data)+sep),`Profile escapes data root: ${binding.profileId}`);
   requireMatch(hash(originalFile(path))===binding.originalSha256&&hash(resolve(path,'reference.wav'))===binding.referenceSha256,`Reference audio drift ${binding.profileId}`);}
 }
 return bindings.length;
}
export function archiveFiles(source,destination){
 requireMatch(!existsSync(destination)||!lstatSync(destination).isSymbolicLink(),'Archive destination is linked');
 mkdirSync(destination,{recursive:true});
 const archiveBase=realpathSync(destination),liveBase=realpathSync(source);
 requireMatch(archiveBase!==liveBase&&!archiveBase.startsWith(liveBase+sep)&&!liveBase.startsWith(archiveBase+sep),'Archive aliases live profile data');
 const files=[];
 function walk(base,relative=''){
  for(const entry of readdirSync(base,{withFileTypes:true})){
   requireMatch(!entry.isSymbolicLink(),`Archive refuses linked file: ${entry.name}`);
   const name=relative?relative+'/'+entry.name:entry.name,path=resolve(base,entry.name);
   if(entry.isDirectory())walk(path,name);else{requireMatch(entry.isFile(),`Archive refuses non-file: ${name}`);files.push({path:name,sha256:hash(path)});}
  }
 }
 walk(source);
 for(const file of files){const from=resolve(source,file.path),to=resolve(destination,file.path);mkdirSync(dirname(to),{recursive:true});requireMatch(realpathSync(dirname(to)).startsWith(archiveBase+sep)||realpathSync(dirname(to))===archiveBase,'Linked archive directory');if(existsSync(to))requireMatch(!lstatSync(to).isSymbolicLink()&&realpathSync(to).startsWith(archiveBase+sep),'Linked archive file');else copyFileSync(from,to);requireMatch(hash(to)===file.sha256,`Archive mismatch: ${file.path}`);}
 return files;
}
export function runtimeBlock(cast){
 return '// Generated by tools/curate-voice-library.mjs --sync from VOICE-CAST.json.\n'+
  'const productionVoices=Object.freeze('+JSON.stringify(Object.fromEntries(Object.entries(cast.productionVoices).map(([id,p])=>[id,{profileId:p.profileId,profileName:p.profileName,originalSha256:p.originalSha256,referenceSha256:p.referenceSha256,renderer:p.renderer,modelRevision:p.modelRevision,...(p.fallback?{fallback:p.fallback}:{})}])))+');\n'+
  'const productionExceptions=Object.freeze('+JSON.stringify(Object.fromEntries(cast.productionExceptions.map(p=>[p.clipId,{voiceId:p.voiceId,profileId:p.profileId}])) )+');\n'+
  'function productionClip(clip){const exception=productionExceptions[clip.id];return !productionVoices[clip.voiceId]||clip.profileId===(exception?.voiceId===clip.voiceId?exception.profileId:productionVoices[clip.voiceId].profileId)}\n';
}
export function knickGenerationComplete(clip){
 if(clip.decode?.eosReached===true)return true;
 if(clip.decode!=null)return false;
 const legacy=json(resolve(root,'assets/voices/knick/legacy-receipts.json'));
 const prior=legacy.clips.find(take=>take.clipId===clip.clipId);
 return !!prior&&legacy.identityKeys.every(key=>prior[key]===clip[key]);
}
function knickBlock(cast,manifest){
 const entries={},seen=new Set();
 for(const clip of manifest.clips){
  requireMatch(clip.voiceId==='amt-brunhilde-knick'&&matchesProduction(cast,clip),'Knick profile/reference/renderer drift');
  const binding=cast.productionVoices[clip.voiceId];
  requireMatch(clip.renderer===binding.renderer&&clip.modelRevision===binding.modelRevision&&clip.referenceSha256===binding.referenceSha256&&clip.processing===binding.processing,`Incomplete Knick production receipt: ${clip.clipId}`);
  requireMatch(clip.asrWordExact&&Math.abs(clip.integratedLufs+18)<=.3&&clip.truePeakDbtp<=-1.5,`Unverified Knick take: ${clip.clipId}`);
  requireMatch(knickGenerationComplete(clip),`Incomplete Knick generation: ${clip.clipId}`);
  requireMatch(clip.english?.trim()&&clip.approval?.status==='user-approved',`Missing Knick subtitle/use approval: ${clip.clipId}`);
  requireMatch(clip.file.startsWith('assets/voices/knick/')&&resolve(root,clip.file).startsWith(resolve(root,'assets/voices/knick')+sep),`Invalid Knick asset path: ${clip.clipId}`);
  requireMatch(hash(resolve(root,clip.file))===clip.sha256,`Knick audio hash drift: ${clip.clipId}`);
  const key=clip.voiceId+'\0'+clip.text;requireMatch(!seen.has(key),`Duplicate Knick line: ${clip.clipId}`);seen.add(key);
  entries['./'+clip.file]={id:clip.clipId,voiceId:clip.voiceId,profileId:clip.profileId,source:clip.text,english:clip.english,trigger:'buergeramt-exact-dialogue',durationMs:Math.round(clip.durationSeconds*1000),wordCues:clip.wordCues,sha256:clip.sha256,approval:clip.approval,provenanceManifest:clip.provenanceManifest};
 }
 return 'const knickRecordings=Object.freeze('+JSON.stringify(entries)+');\n';
}
export function main(args=process.argv.slice(2)){
 const value=name=>{const i=args.indexOf(name);return i<0?null:args[i+1]};
 const cast=json(resolve(root,'For-AI/VOICE-CAST.json'));
 requireMatch(new Set(Object.values(cast.productionVoices).map(p=>p.profileId)).size===Object.keys(cast.productionVoices).length,'Production characters share a profile UUID');
 const manifest=json(resolve(root,'assets/voices/candidate-dialogue/manifest.json'));
 const catalogPath=resolve(root,'For-AI/AUDIO-TEXT-LIBRARY.js');let source=readFileSync(catalogPath,'utf8').replace(/\r\n/g,'\n');
 const marker=/\/\/ Generated by tools\/curate-voice-library\.mjs --sync from VOICE-CAST\.json\.\n[\s\S]*?function productionClip\(clip\)\{[^\n]+\}\n/;
 const expected=runtimeBlock(cast);
 if(args.includes('--sync')){source=source.replace(marker,'');source=source.replace('const legacyVoices=',()=>expected+'const legacyVoices=');writeFileSync(catalogPath,source);}
 else requireMatch(source.match(marker)?.[0]===expected,'Runtime voice bindings stale; run --sync');
 const knickPath=resolve(root,'assets/voices/knick/manifest.json');
 if(existsSync(knickPath)&&!args.includes('--archive-assets')&&!args.includes('--archive-profiles')){
  const clips=[];
  for(const path of ['assets/voices/knick/manifest.json','assets/voices/knick/ambient-manifest.json'].filter(path=>existsSync(resolve(root,path)))){
   const manifest=json(resolve(root,path));
   // Unrendered and rejected lines have explicit selected-profile fallbacks.
   requireMatch(Number.isInteger(manifest.generatedLineCount)&&manifest.generatedLineCount>=manifest.clips.length&&manifest.generatedLineCount<=manifest.requestedLineCount&&manifest.clips.length+manifest.heldPrivate.length===manifest.requestedLineCount,`Unaccounted Knick lines: ${path}`);
   clips.push(...manifest.clips.map(c=>({...c,provenanceManifest:path})));
  }
  const block=knickBlock(cast,{clips}),pattern=/const knickRecordings=Object\.freeze\(\{[^\n]*\}\);\n/;
  if(args.includes('--sync')){
   source=source.replace(pattern,'').replace('const recordings=Object.freeze({',()=>block+'const recordings=Object.freeze({');
   if(!source.includes(' ...knickRecordings,'))source=source.replace(' ...feverRecordings,',' ...feverRecordings,\n ...knickRecordings,');
   writeFileSync(catalogPath,source);
  }else requireMatch(source.match(pattern)?.[0]===block,'Knick recording lookup stale; run --sync');
 }
 const context={window:{},location:{search:'?voicePreview=1'},URLSearchParams};vm.runInNewContext(source,context);const catalog=context.window.GermanySimulatorAudioText;
 for(const [path,clip] of Object.entries(catalog.recordings)){
  if(clip.retiredReason)continue;
  // The compact playback projection omits generation receipt fields; manifests
  // and promotion validate complete receipts before this lookup is generated.
  requireMatch(matchesProduction(cast,clip,false),`Wrong default profile/renderer: ${clip.id}`);
  if(clip.sha256)requireMatch(hash(resolve(root,path))===clip.sha256,`Audio hash drift: ${clip.id}`);
 }
 const blocked=manifest.clips.filter(c=>!c.retiredReason&&!matchesProduction(cast,c));
 for(const clip of blocked){const path=catalog.candidateClip(clip.voiceId,clip.text);requireMatch(!path||path!==clip.path,`Old-profile candidate can play: ${clip.clipId}`);}
 const exe=value('--voice-exe'),data=value('--profile-data'),archiveArg=value('--archive-root');
 let archive;
 if(archiveArg){mkdirSync(resolve(archiveArg),{recursive:true});archive=realpathSync(archiveArg);const game=realpathSync(root);requireMatch(archive!==game&&!archive.startsWith(game+sep),'Private archive must stay outside game checkout');}
 requireMatch(!args.includes('--archive-assets')||archive,'Asset archive requires --archive-root');
 let profiles;
 if(exe){profiles=request(resolve(exe),'list').profiles;verifyProfiles(cast,profiles,data&&resolve(data));}
 if(args.includes('--rename-production')){
  requireMatch(exe,'Rename requires --voice-exe');
  const people=[...cast.characters,...cast.roleProfiles];
  for(const [voiceId,binding] of Object.entries(cast.productionVoices)){
   if(!binding.selection)continue;
   const person=people.find(p=>p.voiceId===voiceId),name=`GS ${person.fullName} (${voiceId})`;
   if(name===binding.profileName)continue;
   const renamed=request(resolve(exe),'rename',{voiceId:binding.profileId,name});requireMatch(renamed.id===binding.profileId&&renamed.name===name,'Rename not confirmed');
   binding.profileName=name;writeFileSync(resolve(root,'For-AI/VOICE-CAST.json'),JSON.stringify(cast,null,2)+'\n');
  }
  profiles=request(resolve(exe),'list').profiles;verifyProfiles(cast,profiles,data&&resolve(data));
 }
 if(args.includes('--archive-profiles')){
  requireMatch(exe&&data&&archive,'Archive requires --voice-exe, --profile-data and --archive-root');
  const base=realpathSync(data),privateArchive=resolve(archive);requireMatch(!privateArchive.startsWith(root+sep),'Private references must stay outside game checkout');
  const keep=new Set([...Object.values(cast.productionVoices).map(p=>p.profileId),...cast.productionExceptions.map(p=>p.profileId),...cast.preservedProfileIds]);
  const retiredIds=new Set(cast.retiredProfiles.map(p=>p.profileId));
  for(const id of retiredIds)requireMatch(!keep.has(id),`Cannot retire protected profile ${id}`);
  // Only explicitly curated IDs can be removed; discovery alone never authorizes deletion.
  const retired=profiles.filter(p=>retiredIds.has(p.id));
  const plans=retired.map(profile=>{
   requireMatch(/^[a-f0-9]{32}$/.test(profile.id),'Invalid profile UUID');
   const from=realpathSync(resolve(base,'profiles',profile.id));requireMatch(from.startsWith(base+sep),'Profile escapes data root');
   requireMatch(hash(originalFile(from))===profile.original_sha256&&hash(resolve(from,'reference.wav'))===profile.reference_sha256,'Retired reference hash mismatch');
   const destination=resolve(privateArchive,'profiles',profile.id),files=archiveFiles(from,destination);
   const receipt={profile,files,reason:'Unselected Germany Simulator legacy/duplicate profile; source identity and generated takes preserved.',castSha256:hash(resolve(root,'For-AI/VOICE-CAST.json'))};
   requireMatch(!existsSync(resolve(destination,'archive-receipt.json'))||!lstatSync(resolve(destination,'archive-receipt.json')).isSymbolicLink(),'Archive receipt is linked');
   writeArchiveMetadata(privateArchive,`profiles/${profile.id}/archive-receipt.json`,JSON.stringify(receipt,null,2)+'\n');
   return {profile,files};
  });
  // Every reference is copied and verified before the first native deletion.
  for(const {profile} of plans){requireMatch(request(resolve(exe),'delete',{voiceId:profile.id}).deleted,`Delete not confirmed: ${profile.id}`);}
  profiles=request(resolve(exe),'list').profiles;verifyProfiles(cast,profiles,base);
  console.log(JSON.stringify({archivedProfiles:plans.map(p=>({id:p.profile.id,name:p.profile.name})),remainingProfiles:profiles.length}));
 }
 if(archive){
  const privateArchive=resolve(archive);mkdirSync(privateArchive,{recursive:true});
  const snapshots=['For-AI/VOICE-CAST.json','For-AI/AUDIO-TEXT-LIBRARY.js','assets/voices/candidate-dialogue/manifest.json','assets/voices/amt-fever/manifest.json'];
  for(const path of snapshots)writeArchiveMetadata(privateArchive,'metadata/'+path,readFileSync(resolve(root,path)));
  const fever=json(resolve(root,'assets/voices/amt-fever/manifest.json'));
  const assets=[...manifest.clips.flatMap(c=>[c,...(c.previousCandidate?[c.previousCandidate]:[])]).filter(c=>c.retiredReason||!matchesProduction(cast,c)),...(manifest.retiredClips||[]),...fever.clips.filter(c=>c.retiredReason)];
  const receipts=[];
  for(const clip of assets){const from=resolve(root,clip.path),to=resolve(privateArchive,'assets',clip.path);requireMatch(from.startsWith(resolve(root,'assets/voices')+sep)&&to.startsWith(privateArchive+sep),'Invalid archive asset path');
   mkdirSync(dirname(to),{recursive:true});
   requireMatch(realpathSync(dirname(to)).startsWith(realpathSync(privateArchive)+sep)&&!realpathSync(dirname(to)).startsWith(realpathSync(root)+sep),'Archive directory escapes or aliases the game');
   if(existsSync(to))requireMatch(!lstatSync(to).isSymbolicLink()&&realpathSync(to).startsWith(realpathSync(privateArchive)+sep)&&!realpathSync(to).startsWith(realpathSync(root)+sep),'Archive audio is linked or aliases the game');
   if(existsSync(from)){requireMatch(lstatSync(from).isFile()&&!lstatSync(from).isSymbolicLink(),'Archive refuses linked audio');requireMatch(hash(from)===clip.sha256,`Archived asset hash mismatch: ${clip.clipId}`);if(!existsSync(to))copyFileSync(from,to);}
   requireMatch(hash(to)===clip.sha256,'Archived audio differs');receipts.push({...clip,archivePath:to});}
  writeArchiveMetadata(privateArchive,'asset-index.json',JSON.stringify({clips:receipts},null,2)+'\n');
  if(args.includes('--archive-assets')){
   for(const clip of assets){const from=resolve(root,clip.path);if(existsSync(from))unlinkSync(from);clip.archiveRelativePath='assets/'+clip.path;clip.retiredReason||='Superseded by the selected production profile on 2026-10-11; private archive retains exact audio and provenance.';}
   for(const [path,value] of [['assets/voices/candidate-dialogue/manifest.json',manifest],['assets/voices/amt-fever/manifest.json',fever]])writeFileSync(resolve(root,path),JSON.stringify(value,null,2)+'\n');
   const feverPattern=/const feverRecordings=Object\.freeze\((\{[^\n]+\})\);/;
   const entries=JSON.parse(source.match(feverPattern)[1]);for(const [path,clip] of Object.entries(entries))if(clip.retiredReason)delete entries[path];
   source=source.replace(feverPattern,()=>`const feverRecordings=Object.freeze(${JSON.stringify(entries)});`);writeFileSync(catalogPath,source);
   console.log(JSON.stringify({archivedAssets:assets.length}));
  }
 }
 console.log(JSON.stringify({productionCharacters:Object.keys(cast.productionVoices).length,sceneExceptions:cast.productionExceptions.length,blockedLegacyCandidates:blocked.length,archivedCandidates:manifest.clips.filter(c=>c.archiveRelativePath).length,liveProfilesVerified:profiles?true:false,liveProfileCount:profiles?.length}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
