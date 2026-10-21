// ROOT-only finite policeContact2 collector/admission. Preparation never copies assets.
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {copyFileSync,existsSync,lstatSync,mkdirSync,readFileSync,readdirSync,realpathSync,renameSync,unlinkSync,writeFileSync,constants} from 'node:fs';
import {resolve,dirname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fixedTakeAuthority,matchesProduction,policeEosTraceAuthority,spokenWords} from './curate-voice-library.mjs';
import {policeContactRequest} from './police-contact-voice-source.mjs';
import {policeContactManifestAuthority} from './police-contact-recordings.mjs';
const root=resolve(import.meta.dirname,'..'),hash=bytes=>createHash('sha256').update(bytes).digest('hex'),fileHash=path=>hash(readFileSync(path));
const read=path=>JSON.parse(readFileSync(path,'utf8').replace(/^\uFEFF/,'')),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),need=(ok,why)=>{if(!ok)throw Error(why)};
const checks={fixedTakeAuthority,matchesProduction};
export function policeContactPhaseAuthority(terminal,{authoritySha256,adapterSha256,requestSha256,frozenSha256}){
 need(/^(plan|render|process|proposal)(-retake)?$/.test(terminal.phase)&&terminal.specificationSha256===authoritySha256&&terminal.producerSha256===adapterSha256&&terminal.authoredPlanSha256===requestSha256&&terminal.frozenRequestSha256===frozenSha256,'PoliceContact2 phase pins changed');
 need(terminal.exitCode===0&&terminal.rootRetired===true&&terminal.timedOut===false&&terminal.logsComplete===true&&['survivingOwnedChildren','ownedCleanupKills','postflightPinFailures','censusErrors'].every(key=>Array.isArray(terminal[key])&&terminal[key].length===0),'PoliceContact2 phase did not retire cleanly');
 return true;
}
function safeFile(privateRoot,relative){const path=resolve(privateRoot,relative);need(path.startsWith(resolve(privateRoot)+sep)&&!lstatSync(path).isSymbolicLink()&&realpathSync(path)===path,'PoliceContact2 private file alias/escape');return path;}
function run(binary,args,binaryOutput=false){const result=spawnSync(binary,args,{encoding:binaryOutput?null:'utf8',windowsHide:true,timeout:120000,maxBuffer:32*1024*1024});need(!result.error&&result.status===0,'PoliceContact2 measurement failed: '+(result.error||String(result.stderr).slice(-500)));return binaryOutput?result.stdout:result;}
export function measureContactMouth(audio,ffmpeg){
 const pcm=run(ffmpeg,['-hide_banner','-loglevel','error','-i',audio,'-f','f32le','-ac','1','-ar','24000','pipe:1'],true),samples=new Float32Array(pcm.buffer.slice(pcm.byteOffset,pcm.byteOffset+pcm.byteLength)),energy=[];
 for(let offset=0;offset<samples.length;offset+=600){let sum=0;const end=Math.min(offset+600,samples.length);for(let i=offset;i<end;i++)sum+=samples[i]**2;energy.push(Math.sqrt(sum/(end-offset)));}
 const scale=[...energy].sort((a,b)=>a-b)[Math.floor(energy.length*.95)]||1;
 return {durationSeconds:samples.length/24000,mouthHz:40,mouthEnergy:energy.map(value=>Math.min(255,Math.round(255*(value/scale)**.7))),mouthMeasurement:{encodedSha256:fileHash(audio),decodedPcmSha256:hash(pcm),decodedSamples:samples.length,decoderSha256:fileHash(ffmpeg),recipeSha256:hash(measureContactMouth.toString())}};
}
export function preparePoliceContactAdmission({authorityPath,requestPath,privateRoot,selectionPath,ffmpeg},sourceRoot=root){
 const authority=read(authorityPath),request=read(requestPath),cast=read(resolve(sourceRoot,'For-AI/VOICE-CAST.json'));
 need(authority.status==='ROOT_SEALED_FINITE_POLICE_CONTACT2'&&authority.executor==='ROOT_ONLY'&&authority.authorityTemplateOnly===false&&authority.maximumNativeCalls===4&&authority.maximumCallsPerClip===2&&authority.maximumAsrReadings===8,'PoliceContact2 finite ROOT grant missing');
 need(same(request,policeContactRequest(sourceRoot))&&authority.requestSha256===fileHash(requestPath)&&same(authority.sourcePins,request.sourceSha256),'PoliceContact2 source request changed');
 need(authority.adapterSha256===fileHash(resolve(sourceRoot,'tools/build-police-contact-voices.py'))&&authority.sharedHelperSha256===fileHash(resolve(sourceRoot,'tools/build-knick-voice.py')),'PoliceContact2 reviewed producer changed');
 need(resolve(privateRoot)===resolve(authority.musicRoot,request.privateReviewFamily,authority.voiceId),'PoliceContact2 private root changed');
 const frozenPath=safeFile(privateRoot,'requests.json'),frozen=read(frozenPath),frozenSha256=fileHash(frozenPath),authoritySha256=fileHash(authorityPath);
 need(frozen.authoritySha256===authoritySha256&&frozen.authoredPlanSha256===fileHash(requestPath)&&frozen.adapterSha256===authority.adapterSha256&&frozen.authoringHelperSha256===authority.sharedHelperSha256&&same(frozen.jobs,request.jobs),'PoliceContact2 frozen private request changed');
 const terminals={},phasePaths=readdirSync(resolve(privateRoot,'ROOT-phases')).filter(name=>name.endsWith('.json'));
 for(const name of phasePaths){
  const path=safeFile(privateRoot,'ROOT-phases/'+name),terminal=read(path),phase=terminal.phase;
  policeContactPhaseAuthority(terminal,{authoritySha256,adapterSha256:authority.adapterSha256,requestSha256:fileHash(requestPath),frozenSha256});
  for(const stream of ['stdout','stderr'])need(fileHash(safeFile(privateRoot,'ROOT-phases/'+phase+'.'+stream+'.log'))===terminal[stream+'Sha256'],'PoliceContact2 phase log changed');
  terminals[phase]={sha256:fileHash(path),exitCode:0,rootRetired:true,timedOut:false};
 }
 need(['plan','render','process','proposal'].every(phase=>terminals[phase]),'PoliceContact2 successful ROOT phases incomplete');
 const proposalPath=safeFile(privateRoot,'ROOT-phases/proposal.stdout.log'),proposal=read(proposalPath);
 need(proposal.status==='PRIVATE_INTEGRITY_PROPOSAL_NOT_ADMISSION'&&proposal.sourceScope==='police-contact-two-v1'&&proposal.frozenRequestSha256===frozenSha256&&proposal.adapterSha256===authority.adapterSha256&&proposal.sharedHelperSha256===authority.sharedHelperSha256,'PoliceContact2 proposal lineage changed');
 const nativePath=safeFile(privateRoot,'native-call-ledger.json'),asrPath=safeFile(privateRoot,'asr-call-ledger.json'),native=read(nativePath),asr=read(asrPath);
 need(proposal.nativeLedgerSha256===fileHash(nativePath)&&proposal.asrLedgerSha256===fileHash(asrPath)&&native.authoritySha256===authoritySha256&&asr.authoritySha256===authoritySha256&&native.calls.length<=4&&asr.calls.length<=8,'PoliceContact2 private call ledger changed');
 const selection=read(selectionPath),selected=new Map(selection.clips?.map(row=>[row.clipId,row.encodedSha256]));
 need(selection.status==='user-approved'&&selection.scope==='whole-game-fixed-voice-cloning'&&selection.instruction?.trim()&&selected.size===selection.clips?.length&&selected.size===2&&selection.listening==='NOT RUN','PoliceContact2 exact clip/hash use selection missing');
 need(proposal.clips.length===2&&proposal.heldPrivate.length===0,'PoliceContact2 requires both genuine admitted candidates; held speech remains captions');
 const clips=proposal.clips.map(encoded=>{
  const id=encoded.clipId,job=request.jobs.find(row=>row.clipId===id),proof=proposal.proofs[id],rawPath=safeFile(privateRoot,`raw/${id}.json`),raw=read(rawPath),audio=safeFile(privateRoot,`encoded/${id}.mp3`),encodedPath=safeFile(privateRoot,`encoded/${id}.json`),tracePath=safeFile(privateRoot,`raw/${id}-eos-trace.json`);
  need(job&&same(encoded,read(encodedPath))&&Object.entries(job).every(([key,value])=>same(raw[key],value)&&same(encoded[key],value)),'PoliceContact2 raw/encoded authored ownership changed');
  need(proof.rawReceiptSha256===fileHash(rawPath)&&proof.encodedReceiptSha256===fileHash(encodedPath)&&proof.rawSha256===fileHash(safeFile(privateRoot,`raw/${id}.wav`))&&proof.encodedSha256===fileHash(audio)&&proof.eosTraceSha256===fileHash(tracePath)&&raw.requestSha256===frozenSha256&&raw.authoringHelperSha256===authority.sharedHelperSha256&&raw.profileJsonSha256===authority.profileMetadataSha256,'PoliceContact2 actual private bytes changed');
  need(policeEosTraceAuthority(raw.decode,read(tracePath))&&raw.decode.eosReached===true&&same(raw.decode,encoded.decode)&&same(raw.synthesis,encoded.synthesis)&&encoded.rawSha256===raw.rawSha256,'PoliceContact2 actual native EOS/conditioning changed');
  const calls=native.calls.filter(row=>row.clipId===id),readings=asr.calls.filter(row=>row.clipId===id&&row.encodedSha256===encoded.sha256);
  need(calls.length>=1&&calls.length<=2&&calls.at(-1).status==='returned'&&raw.synthesisAttempt===calls.length&&readings.length>=1&&readings.length<=2&&readings.every(row=>row.status==='returned'&&row.scriptPrompt===null&&row.asrModelSha256===authority.asrModelSha256)&&same(readings.map(row=>row.transcript),encoded.asrReadings.map(row=>row.transcript)),'PoliceContact2 selected calls/readings changed');
  need(selected.get(id)===encoded.sha256&&encoded.asrLiteralWordExact===true&&spokenWords(encoded.text)===spokenWords(encoded.asr),'PoliceContact2 selected final words/hash changed');
  const measured=measureContactMouth(audio,ffmpeg),levelResult=run(ffmpeg,['-hide_banner','-nostats','-i',audio,'-af','loudnorm=I=-18:TP=-2:LRA=11:print_format=json','-f','null','NUL']),levels=JSON.parse(levelResult.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0]||'null');
  need(levels&&Math.abs(Number(levels.input_i)+18)<=.3&&Number(levels.input_tp)<=-1.5&&Math.abs(Number(levels.input_i)-encoded.integratedLufs)<=.03&&Math.abs(Number(levels.input_tp)-encoded.truePeakDbtp)<=.03,'PoliceContact2 actual encoded levels changed');
  const format=JSON.parse(run(resolve(dirname(ffmpeg),'ffprobe.exe'),['-v','error','-select_streams','a:0','-show_entries','stream=codec_name,sample_rate,channels,bit_rate','-of','json',audio]).stdout).streams?.[0];
  need(format?.codec_name==='mp3'&&Number(format.sample_rate)===48000&&format.channels===1&&Number(format.bit_rate)===128000,'PoliceContact2 actual encoded format changed');
  return {...encoded,...measured,file:`assets/voices/police-contact/${id}.mp3`,approval:{status:'user-approved',scope:selection.scope,date:selection.date,instruction:selection.instruction,clipId:id,encodedSha256:encoded.sha256,listening:'NOT RUN'}};
 });
 const manifest={schemaVersion:1,voiceId:authority.voiceId,requestedLineCount:2,lineCount:clips.length,clips,heldPrivate:[],policeContactAdmission:{status:'ROOT-verified-native-policeContact2',sourceScope:'police-contact-two-v1',authoritySha256,requestSha256:fileHash(requestPath),frozenRequestSha256:frozenSha256,adapterSha256:authority.adapterSha256,sharedHelperSha256:authority.sharedHelperSha256,profileMetadataSha256:authority.profileMetadataSha256,asrModelSha256:authority.asrModelSha256,nativeLedgerSha256:fileHash(nativePath),asrLedgerSha256:fileHash(asrPath),proposalSha256:fileHash(proposalPath),selectionSha256:fileHash(selectionPath),nativeCalls:native.calls.length,asrCalls:asr.calls.length,terminals,takes:proposal.proofs,listening:'NOT RUN'}};
 policeContactManifestAuthority(cast,manifest,checks,sourceRoot);return manifest;
}

export function installPoliceContactAdmission(manifest,privateRoot,destination=root){
 const directory=resolve(destination,'assets/voices/police-contact'),relative='assets/voices/police-contact/police-contact-manifest.json',path=resolve(destination,relative),catalogPath=resolve(destination,'For-AI/AUDIO-TEXT-LIBRARY.js'),catalog=readFileSync(catalogPath,'utf8'),bytes=JSON.stringify(manifest,null,2)+'\n',pattern=/const policeContactAdmissionReceipts=Object\.freeze\((\{[^\n]*\})\);\n/;
 const anchors=JSON.parse(catalog.match(pattern)?.[1]||'{}');anchors[relative]=hash(bytes);const anchor='const policeContactAdmissionReceipts=Object.freeze('+JSON.stringify(anchors)+');\n',next=catalog.match(pattern)?catalog.replace(pattern,()=>anchor):catalog.replace('const recordings=Object.freeze({',()=>anchor+'const recordings=Object.freeze({');
 need(next.includes(anchor)&&!existsSync(path),'PoliceContact2 admission refuses an existing manifest');
 mkdirSync(directory,{recursive:true});const created=[];
 try{
  for(const clip of manifest.clips){const target=resolve(destination,clip.file),source=safeFile(privateRoot,`encoded/${clip.clipId}.mp3`);need(!existsSync(target)&&fileHash(source)===clip.sha256&&target.startsWith(directory+sep),'PoliceContact2 asset destination occupied/changed');copyFileSync(source,target,constants.COPYFILE_EXCL);created.push(target);}
  writeFileSync(path,bytes,{flag:'wx'});created.push(path);const temp=catalogPath+'.police-contact-admit.tmp';need(!existsSync(temp)&&!lstatSync(catalogPath).isSymbolicLink()&&lstatSync(catalogPath).nlink===1,'PoliceContact2 catalog target unsafe');writeFileSync(temp,next,{flag:'wx'});created.push(temp);renameSync(temp,catalogPath);
 }catch(error){for(const file of created.reverse())if(existsSync(file))unlinkSync(file);throw error;}
 return {manifest:relative,accepted:manifest.clips.length,listening:'NOT RUN',next:'Run curator --sync and --check'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2),value=flag=>args[args.indexOf(flag)+1],settings={authorityPath:value('--authority'),requestPath:value('--request'),privateRoot:value('--private-root'),selectionPath:value('--selection'),ffmpeg:value('--ffmpeg')};
 need(args.includes('--prepare')!==args.includes('--admit'),'Choose ROOT --prepare or --admit');
 const manifest=preparePoliceContactAdmission(settings);console.log(JSON.stringify(args.includes('--admit')?installPoliceContactAdmission(manifest,settings.privateRoot):manifest,null,2));
}
