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
  ((!requireReceipt&&!clip.processing)||(clip.processing??'')===(binding.processing??''));
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
  'const productionVoices=Object.freeze('+JSON.stringify(Object.fromEntries(Object.entries(cast.productionVoices).map(([id,p])=>[id,{profileId:p.profileId,profileName:p.profileName,originalSha256:p.originalSha256,referenceSha256:p.referenceSha256,renderer:p.renderer,modelRevision:p.modelRevision,processing:p.processing??null,...(p.fallback?{fallback:p.fallback}:{})}])))+');\n'+
  'const productionExceptions=Object.freeze('+JSON.stringify(Object.fromEntries(cast.productionExceptions.map(p=>[p.clipId,{voiceId:p.voiceId,profileId:p.profileId,originalSha256:p.originalSha256,referenceSha256:p.referenceSha256,renderer:p.renderer,modelRevision:p.modelRevision,processing:p.processing??null}])) )+');\n'+
  'const neighborVoices=Object.freeze('+JSON.stringify(Object.fromEntries(cast.existingAssetProfiles.filter(p=>p.gameRole==='jwd-neighbor').map(p=>[p.voiceId,{name:p.fullName,gameCharacterId:p.gameCharacterId,gender:p.gender,fallback:p.fallback,status:p.status}])))+');\n'+
  'function productionClip(clip){const exception=productionExceptions[clip.id],binding=exception?.voiceId===clip.voiceId?exception:productionVoices[clip.voiceId];if(!binding)return !clip.fixedProduction;if(clip.profileId!==binding.profileId)return false;const expected={renderer:binding.renderer,modelRevision:binding.modelRevision,referenceSha256:clip.referenceHashKind==="uploaded-original"?binding.originalSha256:binding.referenceSha256,referenceOriginalSha256:binding.originalSha256,processing:binding.processing??null};return Object.entries(expected).every(([key,value])=>(!clip.fixedProduction&&clip[key]===undefined)||clip[key]===value)}\n';
}
export const neighborSpokenWords=text=>text.normalize('NFKC').toLocaleLowerCase('de').replace(/people\s*(?:&|and)\s*culture/g,'people and culture').replace(/\bmaslos\b/g,'maaslos').replace(/[-‐‑–—]/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ').replace(/nachbarschafts offside\b/g,'nachbarschafts offsite');
export function neighborRecordingsBlock(cast,manifests){
 const entries={},seen=new Set();
 for(const manifest of manifests){
  const person=cast.existingAssetProfiles.find(p=>p.voiceId===manifest.voiceId&&p.gameRole==='jwd-neighbor');
  requireMatch(person&&manifest.clips.length+manifest.heldPrivate.length===manifest.requestedLineCount,'Unaccounted neighbor lines');
  for(const clip of manifest.clips){
   requireMatch(matchesProduction(cast,clip)&&clip.renderer==='omnivoice-rs','Wrong fixed neighbor production receipt');
   requireMatch(person.gameCharacterId===clip.actorId&&person.dialogue.some(line=>line.text===clip.text&&line.english===clip.english),`Wrong neighbor source/speaker: ${clip.clipId}`);
   requireMatch(clip.nativeCompletion?.completed===true&&clip.asrWordExact&&clip.asrScriptPrompt===null&&/^[a-f0-9]{64}$/.test(clip.asrModelSha256)&&typeof clip.asr==='string'&&neighborSpokenWords(clip.asr)===neighborSpokenWords(clip.text),'Missing independent final-encoding neighbor ASR');
   requireMatch(Math.abs(clip.integratedLufs+18)<=.3&&clip.truePeakDbtp<=-1.5&&clip.approval?.status==='user-approved','Unverified neighbor take');
   requireMatch(clip.file===`assets/voices/neighbors/${clip.clipId}.mp3`&&hash(resolve(root,clip.file))===clip.sha256,'Neighbor audio hash/path drift');
   requireMatch(clip.mouthHz===40&&clip.mouthEnergy.length===Math.ceil(clip.durationSeconds*40)&&clip.mouthEnergy.every(value=>Number.isInteger(value)&&value>=0&&value<=255),'Invalid encoded-media mouth cue');
   const key=clip.voiceId+'\0'+clip.text;requireMatch(!seen.has(key),'Duplicate neighbor recording');seen.add(key);
   const {clipId,voiceId,actorId,profileId,renderer,modelRevision,referenceSha256,referenceOriginalSha256,processing,sha256,mouthHz,mouthEnergy}=clip;
   entries['./'+clip.file]={id:clipId,voiceId,actorId,profileId,renderer,modelRevision,referenceSha256,referenceOriginalSha256,processing,sha256,mouthHz,mouthEnergy,fixedProduction:true,source:clip.text,english:clip.english,durationMs:Math.round(clip.durationSeconds*1000),trigger:'jwd-neighbor-exact-dialogue',approval:clip.approval,provenanceManifest:manifest.provenanceManifest};
  }
 }
 return 'const neighborRecordings=Object.freeze('+JSON.stringify(entries)+');\n';
}
export function editedDeliveryComplete(clip){
 const e=clip.deliveryEditing;if(e===undefined||e===null)return true;
 const kind=e.kind??'complete-prefix-extra-tail';
 if(!['complete-prefix-extra-tail','post-speech-silence-boundary'].includes(kind))return false;
 const quietTail=kind==='post-speech-silence-boundary',interval=e.verifiedSilentIntervalSeconds,stop=e.endSeconds;
 const following=quietTail?e.nextUnclassifiedActivityStartSeconds:e.nextUnwantedWordStartSeconds;
 const exactSource=spokenWords(e.sourceFullAsr)===spokenWords(clip.text);
 const wordProof=quietTail?(e.sourceFullAsrWordExact===true&&exactSource&&Array.isArray(interval)&&Math.abs(following-interval[1])<1e-7&&stop>=e.lastScriptedWordEndSeconds+.05):(spokenWords(e.sourceFullAsr).startsWith(spokenWords(clip.text))&&!exactSource);
 return Array.isArray(interval)&&interval.length===2&&[...interval,stop,e.lastScriptedWordEndSeconds,following,e.sourceFullGenerationDurationSeconds].every(Number.isFinite)&&
  e.sourceNativeEos===true&&['model-sampled','analyzer-forced'].includes(e.sourceEosKind)&&
  ['sourceFullRawSha256','sourceFullEncodedSha256','sourceEosTraceSha256'].every(key=>/^[a-f0-9]{64}$/.test(e[key]))&&
  e.sourceFullText===clip.text&&typeof e.authorization==='string'&&e.authorization.length>0&&
  wordProof&&
  e.startSample===0&&Number.isInteger(e.endSampleExclusive)&&e.sourceSampleRateHz===24000&&Math.abs(stop-e.endSampleExclusive/24000)<1e-7&&
  e.silenceThresholdDb===-38&&e.minimumSilenceSeconds===.2&&interval[1]-interval[0]>=.2&&interval[0]<stop&&stop<interval[1]&&
  e.lastScriptedWordEndSeconds<stop&&stop<following&&stop<e.sourceFullGenerationDurationSeconds&&
  typeof e.preservedFullTakeArchiveRelative==='string'&&e.preservedFullTakeArchiveRelative.length>0;
}
export function knickGenerationComplete(clip){
 return clip.decode?.eosReached===true&&editedDeliveryComplete(clip)&&recognitionComplete(clip)&&(!clip.rescueParts||(clip.rescueParts.length>0&&clip.rescueParts.every(part=>part.eosReached===true&&part.asrWordExact===true&&editedDeliveryComplete(part)&&spokenWords(part.text)===spokenWords(part.asr)&&['voiceId','profileId','referenceSha256','renderer','modelRevision'].every(key=>part[key]===clip[key])&&/^[a-f0-9]{64}$/.test(part.rawSha256)&&/^[a-f0-9]{64}$/.test(part.encodedSha256))&&spokenWords(clip.text)===spokenWords(clip.rescueParts.map(part=>part.text).join(' '))));
}
const segmentedAsrAuthorities={"knick-registration-identityfix":{"diagnosticSha256":"78d0ce846c42ff915ea6c58c283a836f05a417d379905d1fa1eeb28548b0d407","encodedSha256":"a68ed7c036b0b4ba79c19c5e6a5bbccc35022348b5fff77026713e1f7b9be2c9","originalEncodedReceiptSha256":"80711c3e6775807880f4b218b3201312a9713cd19903c7eba6451c479913c3c3","fullDecodedPcmSha256":"a8f2148f84e6e4ac9e26529060559a72aec87e3066f46a5bed428607553aaca2","boundaries":[0,56960,86400,129280,203520,234880],"authoritySha256":"be3bb20e33dd5f29e94e06a027ee8b324c420fa035b2ea6bf878281a54351ce4","voiceId":"amt-brunhilde-knick","profileId":"b080c7d95ecd418fb428282461d7fbe7","referenceSha256":"901e9ad60eda5cbb36337b12864b6a2b0d133570acb90941b9eabd9888c16351","text":"Der Originalpass steckt in Ihrer Dokumentenmappe. Holen Sie ihn heraus. Ihr Telefon bleibt lautlos. Ich werde die Identität Ihres Ladekabels heute nicht mitprüfen. Wie reichen Sie den Pass?","modelSha256":"e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da","chunkPcmSha256":["52bfcd53bf36a3490786b7c50b9404d2294abe163130df81e2152360358d4404","87ad6b24f47daed0308ea5952fbfcf8131442418de935fbcd6c7d015e42a5cca","7b02650b1f4d7019f4f8bded8da241d7166e73dd89d0500be1091aadc33ad65f","b8c5a1beafd9ef06efd1a64afcf1f74eab34946bb35f23c3f488c207cad3bf11","81c8cc1471a4ab9f1bc9149fa5840db5eb9f31411c0313ef8bfa87a3b8f3d70c"],"parts":[{"clipId":"knick-registration-identityfix-part-01","text":"Der Originalpass steckt in Ihrer Dokumentenmappe.","rawSha256":"ac65e3235221119f24286ab3bbfddc328dcbe6d4bf3743bd9b2a33252e0b6762","encodedSha256":"b8f3ab849b1a217a4593bb75faf3a46373aa41f89b88f379ab830e5f0cd734f2"},{"clipId":"knick-registration-identityfix-part-02","text":"Holen Sie ihn heraus.","rawSha256":"4d48c17a6e246797ef261f1a8aa8d02d98ed8d9c9a3d6bf84ea70d6ec26e9d32","encodedSha256":"e0178ef6d6e37fdff287d026aa8829b679d1254a5ed5f3be3c4660e762fe0665"},{"clipId":"knick-registration-identityfix-part-03","text":"Ihr Telefon bleibt lautlos.","rawSha256":"93bac22c667fdb66f596de6ef83523d24cb11fadef1f0240d65b9fc9c2787e55","encodedSha256":"43351690ce5753940b21f6ca377355aa0386822a70c82cb38ec59f368b46c2c1"},{"clipId":"knick-registration-identityfix-part-04","text":"Ich werde die Identität Ihres Ladekabels heute nicht mitprüfen.","rawSha256":"b8be1b69835c5a635e4f582ff9c4b2e8fa3f810c29bf44f7cc236fed144cb057","encodedSha256":"9af94c56be7a6fb974deb51fe83f0a73c3d55aa6bd762cd0e9d8d8df79a25690"},{"clipId":"knick-registration-identityfix-part-05","text":"Wie reichen Sie den Pass?","rawSha256":"6143c752faebabf3f3e33692a9db0b7e4cac277c63f9c8beaac49c7e05908fe1","encodedSha256":"9e1c5c83349b9bf07e68042734a9ade8e8404066c26f185f31ffcf95eb8a830e"}],"selectedReadings":[{"beamSize":1,"transcript":"Der Originalpass steckt in Ihrer Dokumentenmappe."},{"beamSize":1,"transcript":"Holen Sie ihn heraus!"},{"beamSize":1,"transcript":"Ihr Telefon bleibt lautlos."},{"beamSize":1,"transcript":"Ich werde die Identität Ihres Ladekabels heute nicht mitprüfen."},{"beamSize":1,"transcript":"Wie reichen Sie den Pass?"}]},"knick-registration-movein":{"diagnosticSha256":"f3e5dda674c0913fa972c2a6937e3d9db55eb953014efec50db687016570eb37","encodedSha256":"03d534b7db8e485e87aeccdc142096b35976f8beadb3457c90da5a419ee934da","originalEncodedReceiptSha256":"d2e71d9616ff840799cf8290e61cff1074a7430d43f2623aadf82db69f291ebc","fullDecodedPcmSha256":"75892a6c021180e335d25d8e29e09b832fc66b3e5bdc3e129a9cb81fca4a001a","boundaries":[0,19200,64000,115200,161280,222080,238080],"authoritySha256":"49bf27d8a4b9f76452ef16ddf65e7a8e6ef0e7b13f94b6819d2becf6c7998f0b","voiceId":"amt-brunhilde-knick","profileId":"b080c7d95ecd418fb428282461d7fbe7","referenceSha256":"901e9ad60eda5cbb36337b12864b6a2b0d133570acb90941b9eabd9888c16351","text":"Einzugsdatum. Ihr Mietvertrag begann am Ersten. Den Schlüssel bekamen Sie am Dritten. Eingezogen sind Sie am Fünften. Drei Daten, aber nur eins wohnt in diesem Feld. Welches?","modelSha256":"e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da","chunkPcmSha256":["8b8650025fc808372954107a6cf8ab1bd7e542d883074e24603a8fa47d6fdfcb","faca89829beabb3b702fb536e3076134442098900afb4c464ee5233e2597fd17","e6d27776f831eb101dd662f3b52de0100bfc8def1bfb33a432566adc8447d40a","9d0e75b3c50722de26a8aa784269007427179838f0c3edd7ee99293653e091e6","ca679d3dac5c7d863e1191c0dd8a95c842b557c34925e949e411c1c13a0885b0","4847056ba26cf87f0785f176dc40be65098cad1d7e31c7394a5e1a7023bc3be5"],"parts":[{"clipId":"knick-registration-movein-part-01","text":"Einzugsdatum.","rawSha256":"57e738ef6fae55cfdb3661639027acccac82be38d6b0a2fc69ee6cb7e792250e","encodedSha256":"b0dfffc7a2371dc9fbd5418d501fc33aa4967b59129dc0f0beb49d01c39dabe0"},{"clipId":"knick-registration-movein-part-02","text":"Ihr Mietvertrag begann am Ersten.","rawSha256":"a928801556cbdb9ed5fdc7912213a63217210e775212672dc9faea81a679a999","encodedSha256":"4b74099e8072b5edf9f13f8146f6f934d1f807b2edd2c5b0c4bf7a1f309957ed"},{"clipId":"knick-registration-movein-part-03","text":"Den Schlüssel bekamen Sie am Dritten.","rawSha256":"378b0c832f0f61489e4b4ada92559011a5d1f428bcfd4a2baa0409e77c8cd037","encodedSha256":"5666e0ecd370a350ed6df8483eb698972cdff7f2cfe6f4ab63f141a81738ff5b"},{"clipId":"knick-registration-movein-part-04","text":"Eingezogen sind Sie am Fünften.","rawSha256":"0114257c9b8324542d8a7d0cf0fff4ac6af96eeadb95cf23444e1e34b13c0300","encodedSha256":"de1d31597d32dbfdc9af6f398a202175d34e6718cad2837e3566bfc81b8372b6"},{"clipId":"knick-registration-movein-part-05","text":"Drei Daten, aber nur eins wohnt in diesem Feld.","rawSha256":"ba34c6a3ba0fbbc9f7a71f008203076553e8b2f82b7fee116b8bb84d5897450b","encodedSha256":"d54b692b113039c89ef4a4d6295c7929897b683e999e6fb01986e63c11140f0b"},{"clipId":"knick-registration-movein-part-06","text":"Welches?","rawSha256":"3ebbbfa5a150006937041ce38f58e593d986106520f2878de1fd422daf33fe18","encodedSha256":"8c3253bb2dc8c1c6b3acb04076f6697212c4718b1b193f7cc58f3505293e381d"}],"selectedReadings":[{"beamSize":1,"transcript":"Einzugsdatum."},{"beamSize":1,"transcript":"Ihr Mietvertrag begann am 1."},{"beamSize":1,"transcript":"Den Schlüssel bekamen sie am dritten."},{"beamSize":1,"transcript":"Eingezogen sind sie am fünften."},{"beamSize":1,"transcript":"Drei Daten, aber nur eins wohnt in diesem Feld."},{"beamSize":5,"transcript":"Welches?"}]},"knick-registration-residencefix":{"diagnosticSha256":"d1a0a3d9f3c443aab416ccb73a7aba456e3a8143e6ad6eb101c0f4dddd685939","encodedSha256":"5f3320cb4462361bc0cbc127d8650cd8a77ba130517f115c7b1c6c8a17e519fd","originalEncodedReceiptSha256":"7d9d901d3a2987cbede1ed050e10a4a47b91a79be5116f37655f188297856c1b","fullDecodedPcmSha256":"c86ad26e8dcfb1dcffe7f624e155c20d16d988c0fc4ca48ef7e47f07482ca50f","boundaries":[0,56960,133760,169600,199680],"authoritySha256":"106ecd1bf77ca16865610edf4f21c4e89fe153b2d1105256c4f4939e5147a86f","voiceId":"amt-brunhilde-knick","profileId":"b080c7d95ecd418fb428282461d7fbe7","referenceSha256":"901e9ad60eda5cbb36337b12864b6a2b0d133570acb90941b9eabd9888c16351","text":"Geben Sie die weiteren Wohnungen vollständig an. Hauptwohnung bestimmen wir anhand der maßgeblichen tatsächlichen Nutzung und der Angaben zu Ihrer Wohnsituation. Was reichen Sie nach?","modelSha256":"e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da","chunkPcmSha256":["179426d7f779d9d32af7065b6c6ab67cbdfb749de91be613d482632d18b83095","e9d6a81951d85d375af8e107c7788dd6fb58ef3601fa0e43a1b2750d008044e1","49a2028815eaac2c81da023846c73f847da6567f6ffc9266aed14fa331ed9bcd","fec2c0b1e2344e03a1d34598a9ee7126001a025289460c8c2cf548e4be014d26"],"parts":[{"clipId":"knick-registration-residencefix-part-01","text":"Geben Sie die weiteren Wohnungen vollständig an.","rawSha256":"e3b3b8b7480ddc315cb1a4c5cee961ded34a457de7aa3bf22d558808c622f3b8","encodedSha256":"43321da20eb1965454a8add1a42d8e267675905daf05ef6520bddc297ffc46fc"},{"clipId":"knick-registration-residencefix-context-01","text":"Hauptwohnung bestimmen wir anhand der maßgeblichen tatsächlichen Nutzung","rawSha256":"b49bb6eb661a6c0c3e87a0110b665d07d3528ba6a91a5776913348559f49e151","encodedSha256":"93ade980cffcfc6c435de5c30b3b9ffdc408f1dcd5807f67a34d9c76e76db4fc"},{"clipId":"knick-registration-residencefix-segment-03","text":"und der Angaben zu Ihrer Wohnsituation.","rawSha256":"c7a124406f93c778ef3d720e8c10c9c0a5621884f53a0f1041539e8d93da68b5","encodedSha256":"86a3b8f7edb78bf11d2e6020e406c9ef3f6c91e33f1edfc96911d701dbe22f82"},{"clipId":"knick-registration-residencefix-part-03","text":"Was reichen Sie nach?","rawSha256":"e8ec4cc90b06cd25bf4f753b5b0ba9ec406fed23031ad3a80b60ac77fd8a20eb","encodedSha256":"36a7017214d7c8205aaba3e1cc8fc8cc1132afe07d9a1976642c9923515afa68"}],"selectedReadings":[{"beamSize":1,"transcript":"Geben Sie die weiteren Wohnungen vollständig an."},{"beamSize":1,"transcript":"Hauptwohnung bestimmen wir anhand der maßgeblichen tatsächlichen Nutzung."},{"beamSize":1,"transcript":"und der Angaben zu ihrer Wohnsituation."},{"beamSize":1,"transcript":"Was reichen sie nach?"}]}};
export function recognitionComplete(clip){
 const mode=clip.asrVerificationMode===undefined?'full-file-continuous':clip.asrVerificationMode;if(mode==='full-file-continuous'){const a=segmentedAsrAuthorities[clip.clipId];return !(a&&clip.sha256===a.encodedSha256&&clip.asrWordExact===true);}
 if(mode!=='full-encoded-contiguous-chunks')return false;
 const a=segmentedAsrAuthorities[clip.clipId],p=clip.segmentedAsrProof;if(!a||!p)return false;
 if(!['authoritySha256','diagnosticSha256','encodedSha256','fullDecodedPcmSha256','modelSha256','originalEncodedReceiptSha256'].every(key=>p[key]===a[key])||clip.sha256!==a.encodedSha256||!['voiceId','profileId','referenceSha256','text'].every(key=>clip[key]===a[key])||p.sampleRateHz!==16000||p.decodedPcmDtype!=='IEEE754 little-endian float32'||p.scriptPrompt!==null||clip.asrScriptPrompt!==null||p.modelSha256!==clip.asrModelSha256||typeof p.preservedOriginalEncodedReceiptRelative!=='string'||!p.preservedOriginalEncodedReceiptRelative||!Array.isArray(p.continuousFullLineReadings)||!p.continuousFullLineReadings.length||!Array.isArray(p.boundaries)||p.boundaries.length!==a.boundaries.length||!p.boundaries.every((value,index)=>Number.isInteger(value)&&value===a.boundaries[index])||p.totalDecodedSamples!==a.boundaries.at(-1))return false;
 const chunks=p.chunks,parts=clip.rescueParts;if(!Array.isArray(chunks)||!Array.isArray(parts)||chunks.length!==parts.length||chunks.length!==a.chunkPcmSha256.length)return false;
 let cursor=0;const transcripts=[];
 for(let index=0;index<chunks.length;index++){
  const c=chunks[index],part=parts[index];
  if(!Object.entries(a.parts[index]).every(([key,value])=>part[key]===value)||c.sourcePartClipId!==part.clipId||part.clipId!==a.parts[index].clipId||c.expectedText!==part.text||c.sourcePartRawSha256!==part.rawSha256||c.sourcePartEncodedSha256!==part.encodedSha256||!Number.isInteger(c.startSample)||!Number.isInteger(c.endSampleExclusive)||c.startSample!==cursor||cursor!==a.boundaries[index]||c.endSampleExclusive<=cursor||c.endSampleExclusive!==a.boundaries[index+1]||c.decodedPcmSha256!==a.chunkPcmSha256[index]||c.scriptPrompt!==null||!Array.isArray(c.readings)||!c.readings.length)return false;
  const transcript=c.readings.at(-1).transcript;if(typeof transcript!=='string'||spokenWords(part.text)!==spokenWords(transcript)||!Object.entries(a.selectedReadings[index]).every(([key,value])=>c.readings.at(-1)[key]===value))return false;
  cursor=c.endSampleExclusive;transcripts.push(transcript);
 }
 const combined=transcripts.join(' ');return cursor===p.totalDecodedSamples&&p.combinedAsr===combined&&clip.asr===combined&&spokenWords(clip.text)===spokenWords(combined);
}
function fixedAssetInventory(family,clips){
 const listed=clips.map(clip=>clip.file.slice(`assets/voices/${family}/`.length)).sort();
 const shipped=readdirSync(resolve(root,`assets/voices/${family}`)).filter(name=>name.endsWith('.mp3')).sort();
 requireMatch(JSON.stringify(listed)===JSON.stringify(shipped),`Unlisted or missing fixed recordings: ${family}`);
}
export function spokenWords(text){
 const units=['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun'],small=[...units,'zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn'],tens=['','','zwanzig','dreißig','vierzig','fünfzig','sechzig','siebzig','achtzig','neunzig'];
 const numbers=Array.from({length:100},(_,n)=>n<20?small[n]:((n%10?(n%10===1?'ein':units[n%10])+'und':'')+tens[Math.floor(n/10)]));
 const ordinals=['','ersten','zweiten','dritten','vierten','fünften','sechsten','siebten','achten'];
 return text.toLowerCase().replaceAll('ß','ss').replace(/\bam\s+([1-9]|[12]\d|3[01])\.(?=\s|$)/g,(_,day)=>'am '+(ordinals[Number(day)]||numbers[Number(day)]+(Number(day)<20?'ten':'sten'))).replaceAll('§',' paragraph ').replace(/\b([01]?\d|2[0-3]):00(?=\s*uhr\b)/g,'$1').replace(/\bparagraf\b/g,'paragraph').replace(/\ba\s*38\b/g,'a achtunddreißig').match(/[\p{L}\p{N}_]+/gu)?.map(word=>(/^\d+$/.test(word)&&Number(word)<100?numbers[Number(word)]:word).replaceAll('ß','ss')).join('')||'';
}
function streetAuthority(source=readFileSync(resolve(root,'For-AI/AUDIO-TEXT-LIBRARY.js'),'utf8')){
 const window={};vm.runInNewContext(source,{window});vm.runInNewContext(readFileSync(resolve(root,'street-wisdom.js'),'utf8'),{window});
 const catalog=window.GermanySimulatorAudioText,definitions=window.StreetWisdom.definitions;
 requireMatch(definitions.flatMap(person=>person.ruleIndices).sort((a,b)=>a-b).join(',')===catalog.rules.map((_,i)=>i).join(','),'Street rule decks must own every rule exactly once');
 return {catalog,definitions};
}
export function streetRulesBlock(source){
 const {catalog,definitions}=streetAuthority(source),entries=Object.fromEntries(catalog.rules.map((row,index)=>{
  const person=definitions.find(person=>person.ruleIndices.includes(index)),id=`rule-${String(index+1).padStart(2,'0')}`;
  return [id,{id,voiceId:person.voiceId,actorId:person.id,trigger:'nearby-street-rule',source:row[1],text:row[1],english:catalog.ruleEnglish[index],recording:null}];
 }));
 return 'const streetRuleClips=Object.freeze('+JSON.stringify(entries)+');\n';
}
export function fixedRecordingsBlock(cast,manifest,family='knick'){
 requireMatch(['knick','street-wisdom','player-replies','office-ambient'].includes(family),'Unknown fixed recording family');
 const entries={},seen=new Set(),street=family==='street-wisdom'?streetAuthority():null,ambient=family==='office-ambient';
 let ambientRows=null,ambientPeople=null;
 if(ambient){const window={};vm.runInNewContext(readFileSync(resolve(root,'buergeramt-story.js'),'utf8'),{window});const story=window.BuergeramtStory;ambientRows=story.ambient;ambientPeople={...story.characters,...Object.fromEntries(['renter','parent','pensioner'].map((actor,i)=>[actor,Object.values(story.patrons)[i]])),...Object.fromEntries(Object.entries(story.clerks).map(([desk,person])=>['clerk-'+desk,person]))};}
 let replies=null;
 if(family==='player-replies'){
  const window={};vm.runInNewContext(readFileSync(resolve(root,'buergeramt-story.js'),'utf8'),{window});
  replies=Object.fromEntries(Object.entries(window.BuergeramtStory.registration.nodes).flatMap(([key,node])=>node.choices.map((choice,index)=>[`player-registration-${key.toLowerCase()}-${index+1}`,choice.label])));
  replies['player-president-portrait-1']=window.BuergeramtStory.presidentPortrait.lines.map(row=>row.line).join(' ');
  replies['player-potato-mirror']=window.BuergeramtStory.potatoMirror.line;
  const runtime=readFileSync(resolve(root,'buergeramt.js'),'utf8');
  for(const [key,text] of [['complete','Meldebestätigung und A38 mitnehmen.']]){requireMatch(runtime.includes('label:'+JSON.stringify(text)),'Player runtime choice changed');replies['player-'+key]=text;}
  // Preserve validated historical takes, but never expose the retired phone buttons.
  replies['player-phone-silent']='Telefon auf lautlos schalten.';
  replies['player-phone-ignore']='Nicht rangehen. Telefon weglegen.';
 }
 for(const clip of manifest.clips){
  requireMatch((family!=='knick'||clip.voiceId==='amt-brunhilde-knick')&&matchesProduction(cast,clip),'Fixed profile/reference/renderer drift');
  const binding=cast.productionVoices[clip.voiceId];
  requireMatch(clip.renderer===binding.renderer&&clip.modelRevision===binding.modelRevision&&clip.referenceSha256===binding.referenceSha256&&clip.referenceOriginalSha256===binding.originalSha256&&(clip.processing??'')===(binding.processing??''),`Incomplete fixed production receipt: ${clip.clipId}`);
  requireMatch(clip.asrWordExact&&typeof clip.asr==='string'&&spokenWords(clip.text)===spokenWords(clip.asr)&&Math.abs(clip.integratedLufs+18)<=.3&&clip.truePeakDbtp<=-1.5,`Unverified fixed take: ${clip.clipId}`);
  requireMatch(knickGenerationComplete(clip),`Missing or incomplete Knick generation receipt: ${clip.clipId}`);
  requireMatch(clip.asrScriptPrompt===null&&clip.asrLanguageId==='de'&&clip.asrComputeType==='int8'&&/^[a-f0-9]{64}$/.test(clip.asrModelSha256)&&[1,2,4].includes(clip.asrCpuThreads),`Missing independent final-encoding ASR receipt: ${clip.clipId}`);
  requireMatch(clip.english?.trim()&&clip.approval?.status==='user-approved',`Missing Knick subtitle/use approval: ${clip.clipId}`);
  requireMatch(clip.file.startsWith(`assets/voices/${family}/`)&&resolve(root,clip.file).startsWith(resolve(root,`assets/voices/${family}`)+sep),`Invalid fixed asset path: ${clip.clipId}`);
  requireMatch(hash(resolve(root,clip.file))===clip.sha256,`Knick audio hash drift: ${clip.clipId}`);
  const key=clip.voiceId+'\0'+clip.text;requireMatch(!seen.has(key),`Duplicate Knick line: ${clip.clipId}`);seen.add(key);
  let id=clip.clipId;
  if(ambient){const row=ambientRows.find(row=>row.id===id);requireMatch(row&&row.actor===clip.actorId&&row.text===clip.text&&row.english===clip.english&&ambientPeople[row.actor].voiceId===clip.voiceId,`Wrong ambient speaker/text: ${id}`);}
  if(replies)requireMatch(clip.voiceId==='spieler-hans-peter-mustermann'&&clip.actorId==='player'&&replies[clip.clipId]===clip.text,`Wrong player choice ownership/text: ${clip.clipId}`);
  if(clip.clipId==='player-potato-mirror'){
   const window={};vm.runInNewContext(readFileSync(resolve(root,'buergeramt-story.js'),'utf8'),{window});
   requireMatch(clip.english===window.BuergeramtStory.potatoMirror.english&&!clip.rescueParts&&clip.rendererInputText===clip.text,'Mirror requires exact source/translation in one continuous selected-player take');
  }
  if(replies&&['player-phone-silent','player-phone-ignore'].includes(clip.clipId))continue;
  if(street){
   const index=clip.ruleIndex,person=street.definitions.find(person=>person.ruleIndices.includes(index));
   requireMatch(Number.isInteger(index)&&person&&clip.actorId===person.id&&clip.voiceId===person.voiceId&&clip.clipId===`${person.id}-rule-${String(index+1).padStart(2,'0')}`&&clip.text===street.catalog.rules[index][1]&&clip.english===street.catalog.ruleEnglish[index],`Wrong street rule ownership/text: ${clip.clipId}`);
   id=`rule-${String(index+1).padStart(2,'0')}`;
  }
  entries['./'+clip.file]={id,...(street||replies||ambient?{clipId:clip.clipId,actorId:clip.actorId}:{}),voiceId:clip.voiceId,profileId:clip.profileId,fixedProduction:true,renderer:clip.renderer,modelRevision:clip.modelRevision,referenceSha256:clip.referenceSha256,referenceOriginalSha256:clip.referenceOriginalSha256,processing:clip.processing??null,source:clip.text,english:clip.english,trigger:family==='knick'?'buergeramt-exact-dialogue':replies?'buergeramt-player-reply':ambient?'buergeramt-ambient':'nearby-street-rule',durationMs:Math.round(clip.durationSeconds*1000),wordCues:clip.wordCues,sha256:clip.sha256,approval:clip.approval,provenanceManifest:clip.provenanceManifest};
 }
 // Encode repeated receipts once, then expand the same complete fields into
 // every runtime entry. Receipts come from takes, never the current cast alias.
 const receipts=[],receiptKeys=new Map(),rows=[];
 for(const [path,entry] of Object.entries(entries)){
  const {voiceId,profileId,fixedProduction,renderer,modelRevision,referenceSha256,referenceOriginalSha256,processing,approval,provenanceManifest,trigger,...payload}=entry;
  const receipt={voiceId,profileId,fixedProduction,renderer,modelRevision,referenceSha256,referenceOriginalSha256,processing,approval,provenanceManifest,trigger},key=JSON.stringify(receipt);
  if(!receiptKeys.has(key)){receiptKeys.set(key,receipts.length);receipts.push(receipt)}
  rows.push(JSON.stringify(path)+':{...r['+receiptKeys.get(key)+'],'+JSON.stringify(payload).slice(1));
 }
 return `const ${family==='knick'?'knick':replies?'playerReply':ambient?'officeAmbient':'streetWisdom'}Recordings=Object.freeze((()=>{const r=`+JSON.stringify(receipts)+';return{'+rows.join(',')+'}})());\n';
}
export function main(args=process.argv.slice(2)){
 requireMatch(!(args.includes('--sync')&&args.includes('--rename-production')),'Rename production profiles first, then sync their verified bindings');
 const value=name=>{const i=args.indexOf(name);return i<0?null:args[i+1]};
 const cast=json(resolve(root,'For-AI/VOICE-CAST.json'));
 requireMatch(new Set(Object.values(cast.productionVoices).map(p=>p.profileId)).size===Object.keys(cast.productionVoices).length,'Production characters share a profile UUID');
 const manifest=json(resolve(root,'assets/voices/candidate-dialogue/manifest.json'));
 const catalogPath=resolve(root,'For-AI/AUDIO-TEXT-LIBRARY.js');let source=readFileSync(catalogPath,'utf8').replace(/\r\n/g,'\n');
 const marker=/\/\/ Generated by tools\/curate-voice-library\.mjs --sync from VOICE-CAST\.json\.\n[\s\S]*?function productionClip\(clip\)\{[^\n]+\}\n/;
 const expected=runtimeBlock(cast);
 if(args.includes('--sync')){source=source.replace(marker,'');source=source.replace('const legacyVoices=',()=>expected+'const legacyVoices=');}
 else requireMatch(source.match(marker)?.[0]===expected,'Runtime voice bindings stale; run --sync');
 const neighborDir=resolve(root,'assets/voices/neighbors');
 const neighborManifests=existsSync(neighborDir)?readdirSync(neighborDir).filter(name=>name.endsWith('-manifest.json')).sort().map(name=>({...json(resolve(neighborDir,name)),provenanceManifest:`assets/voices/neighbors/${name}`})):[];
 const neighborBlock=neighborRecordingsBlock(cast,neighborManifests),neighborPattern=/const neighborRecordings=Object\.freeze\([^\n]*\);\n/;
 if(args.includes('--sync')){
  source=source.replace(neighborPattern,'').replace('const recordings=Object.freeze({',()=>neighborBlock+'const recordings=Object.freeze({');
  if(!source.includes(' ...neighborRecordings,'))source=source.replace('const recordings=Object.freeze({','const recordings=Object.freeze({\n ...neighborRecordings,');
  source=source.replace('Object.entries(legacyVoices)','Object.entries({...legacyVoices,...neighborVoices})');
 }else requireMatch(source.match(neighborPattern)?.[0]===neighborBlock,'Neighbor recording lookup stale; run --sync');
 const rulesBlock=streetRulesBlock(source),rulesPattern=/const streetRuleClips=Object\.freeze\(\{[^\n]*\}\);\n/;
 if(args.includes('--sync')){source=source.replace(rulesPattern,'').replace('const trafficDialogue=',()=>rulesBlock+'const trafficDialogue=');source=source.replace('const clips=Object.freeze({...trafficDialogue,','const clips=Object.freeze({...streetRuleClips,...trafficDialogue,');}
 else requireMatch(source.match(rulesPattern)?.[0]===rulesBlock,'Street rule bindings stale; run --sync');
 const knickPath=resolve(root,'assets/voices/knick/manifest.json');
 if(existsSync(knickPath)&&!args.includes('--archive-assets')&&!args.includes('--archive-profiles')){
  const clips=[];
  for(const path of ['assets/voices/knick/manifest.json','assets/voices/knick/ambient-manifest.json','assets/voices/knick/queue-call-manifest.json','assets/voices/knick/phone-reactions-manifest.json','assets/voices/knick/phone-dismissal-manifest.json'].filter(path=>existsSync(resolve(root,path)))){
   const manifest=json(resolve(root,path));
   // Unrendered and rejected lines have explicit selected-profile fallbacks.
   requireMatch(Number.isInteger(manifest.generatedLineCount)&&manifest.generatedLineCount>=manifest.clips.length&&manifest.generatedLineCount<=manifest.requestedLineCount&&manifest.clips.length+manifest.heldPrivate.length===manifest.requestedLineCount,`Unaccounted Knick lines: ${path}`);
   clips.push(...manifest.clips.map(c=>({...c,provenanceManifest:path})));
  }
  const block=fixedRecordingsBlock(cast,{clips}),pattern=/const knickRecordings=Object\.freeze\([^\n]*\);\n/;
  fixedAssetInventory('knick',clips);
  if(args.includes('--sync')){
   source=source.replace(pattern,'').replace('const recordings=Object.freeze({',()=>block+'const recordings=Object.freeze({');
   if(!source.includes(' ...knickRecordings,'))source=source.replace(' ...feverRecordings,',' ...feverRecordings,\n ...knickRecordings,');
  }else requireMatch(source.match(pattern)?.[0]===block,'Knick recording lookup stale; run --sync');
 }
 const streetDir=resolve(root,'assets/voices/street-wisdom');
 if(existsSync(streetDir)&&!args.includes('--archive-assets')&&!args.includes('--archive-profiles')){
  const clips=[];
  for(const filename of readdirSync(streetDir).filter(name=>name.endsWith('-manifest.json')).sort()){
   const path=`assets/voices/street-wisdom/${filename}`,manifest=json(resolve(root,path));
   requireMatch(Number.isInteger(manifest.generatedLineCount)&&manifest.generatedLineCount>=manifest.clips.length&&manifest.generatedLineCount<=manifest.requestedLineCount&&manifest.clips.length+manifest.heldPrivate.length===manifest.requestedLineCount,`Unaccounted street rules: ${path}`);
   clips.push(...manifest.clips.map(clip=>({...clip,provenanceManifest:path})));
  }
  const block=fixedRecordingsBlock(cast,{clips},'street-wisdom'),pattern=/const streetWisdomRecordings=Object\.freeze\([^\n]*\);\n/;
  fixedAssetInventory('street-wisdom',clips);
  if(args.includes('--sync')){
   source=source.replace(pattern,'').replace('const recordings=Object.freeze({',()=>block+'const recordings=Object.freeze({');
   if(!source.includes(' ...streetWisdomRecordings,'))source=source.replace(' ...feverRecordings,',' ...feverRecordings,\n ...streetWisdomRecordings,');
  }else requireMatch(source.match(pattern)?.[0]===block,'Street rule recording lookup stale; run --sync');
 }
 const ambientDir=resolve(root,'assets/voices/office-ambient');
 if(existsSync(ambientDir)){
  const clips=[];
  for(const filename of readdirSync(ambientDir).filter(name=>name.endsWith('-manifest.json')).sort()){
   const path=`assets/voices/office-ambient/${filename}`,manifest=json(resolve(root,path));
   requireMatch(manifest.clips.length+manifest.heldPrivate.length===manifest.requestedLineCount,`Unaccounted ambient lines: ${path}`);
   clips.push(...manifest.clips.map(clip=>({...clip,provenanceManifest:path})));
  }
  const block=fixedRecordingsBlock(cast,{clips},'office-ambient'),pattern=/const officeAmbientRecordings=Object\.freeze\([^\n]*\);\n/;
  fixedAssetInventory('office-ambient',clips);
  if(args.includes('--sync')){
   source=source.replace(pattern,'').replace('const recordings=Object.freeze({',()=>block+'const recordings=Object.freeze({');
   if(!source.includes(' ...officeAmbientRecordings,'))source=source.replace(' ...feverRecordings,',' ...feverRecordings,\n ...officeAmbientRecordings,');
  }else requireMatch(source.match(pattern)?.[0]===block,'Office ambient recording lookup stale; run --sync');
 }
 const repliesPath=resolve(root,'assets/voices/player-replies/spieler-hans-peter-mustermann-manifest.json');
 if(existsSync(repliesPath)&&!args.includes('--archive-assets')&&!args.includes('--archive-profiles')){
  const manifest=json(repliesPath),clips=manifest.clips.map(clip=>({...clip,provenanceManifest:'assets/voices/player-replies/spieler-hans-peter-mustermann-manifest.json'}));
  requireMatch(Number.isInteger(manifest.generatedLineCount)&&manifest.generatedLineCount>=clips.length&&manifest.generatedLineCount<=manifest.requestedLineCount&&clips.length+manifest.heldPrivate.length===manifest.requestedLineCount,'Unaccounted player choices');
  const portraitPath='assets/voices/player-replies/spieler-hans-peter-mustermann-portrait-manifest.json';
  if(existsSync(resolve(root,portraitPath))){const portrait=json(resolve(root,portraitPath));requireMatch(portrait.clips.length===1&&portrait.requestedLineCount===1&&portrait.heldPrivate.length===0,'Incomplete continuous president monologue');clips.push(...portrait.clips.map(clip=>({...clip,provenanceManifest:portraitPath})));}
  const mirrorPath='assets/voices/player-replies/spieler-hans-peter-mustermann-mirror-manifest.json';
  if(existsSync(resolve(root,mirrorPath))){const mirror=json(resolve(root,mirrorPath));requireMatch(mirror.clips.length===1&&mirror.requestedLineCount===1&&mirror.heldPrivate.length===0,'Incomplete continuous mirror monologue');clips.push(...mirror.clips.map(clip=>({...clip,provenanceManifest:mirrorPath})));}
  const block=fixedRecordingsBlock(cast,{clips},'player-replies'),pattern=/const playerReplyRecordings=Object\.freeze\([^\n]*\);\n/;
  fixedAssetInventory('player-replies',clips);
  if(args.includes('--sync')){
   source=source.replace(pattern,'').replace('const recordings=Object.freeze({',()=>block+'const recordings=Object.freeze({');
   if(!source.includes(' ...playerReplyRecordings,'))source=source.replace(' ...feverRecordings,',' ...feverRecordings,\n ...playerReplyRecordings,');
  }else requireMatch(source.match(pattern)?.[0]===block,'Player reply recording lookup stale; run --sync');
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
 // A failed receipt or live binding check must leave the playable catalogue intact.
 if(args.includes('--sync'))writeFileSync(catalogPath,source);
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
