import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// These finite input bytes are review evidence, not a native-call authorization.
export const punishmentReferenceInputs=Object.freeze({
 'jwd-inga-maaslos':Object.freeze({voiceId:'jwd-inga-maaslos',profileId:'04e241f5e0734684ba3626aa669a70c1',
  profileReferenceSha256:'18d6bde7a384e6c58a383155664aee9be36516d48e4bc1eb4c5087b38935dd53',
  profileOriginalSha256:'83d49bbef3995346b6ba352d92c6535b9c97e2d73928ab4c50f592eb0cbb36b7',
  clipIds:Object.freeze(['01','02','03','06','07','08'].map(n=>'punishment-inga-'+n)),
  pilotAuthoritySha256:'5b4b0ed57f99084030527e56df2334f6c44e86e7cc4562f0894befeac3dbec07',
  authoritySha256ByClipId:Object.freeze({
   'punishment-inga-02':'9d8b7714d09106afe0adf83e33157c6d2241269ed2445f4c1ece4fae798b1b2f',
   'punishment-inga-03':'e00d6aacb2098c86514c12eb236149fc56b57a86e77ee2f3b373e955dc298709',
   'punishment-inga-06':'e4e6e0d4a16a8eb8f936c221bfab7722df78d7a9a6e85546406e5545576777b8',
   'punishment-inga-07':'df2263e7b0c2c631f37414589d5d5120ff734dded91f819d45bf546225b9ab33',
   'punishment-inga-08':'7ef003211a0b61b8d74df3ae741d08f6a7e03eec0f2e4e9ae673e9ee64e59ffd'}),
  conditioning:Object.freeze({policy:'literal-reference-pcm-excerpt-v1',profileId:'04e241f5e0734684ba3626aa669a70c1',
   profileReferenceSha256:'18d6bde7a384e6c58a383155664aee9be36516d48e4bc1eb4c5087b38935dd53',
   sourceStartSample:0,sourceEndSampleExclusive:176640,sourceSampleRateHz:24000,sourceChannels:1,sourceBitsPerSample:16,
   referenceSha256:'79b1ae567ce0c184abd99c5d6d2db5db9b612221eb142f66a3cdaf1b1d11d71f',
   referencePcmSha256:'29cfbb85348a85cd7219f45c86e8e8489fed6e525104e0d8938c1e00050bdf61',
   referenceText:'Natürlich. Es ist tatsächlich ein Modebegriff und ein Buzzword. Und was Buzzwords leider immer beinhalten, ist, dass sie verschiedenartig interpretiert werden.',
   referenceTextSha256:'3849023f984c6450b863b3decd202388399e99a88ff86bcb94feaaa0e25b3b02',
   inputProofSha256:'c596a396be2e649431e484dec93ecc33238500abcb050456eb307792cdd9966f',
   boundaryEvidenceSha256:'6237ff468e8784de215ac281342860a0fd0b1447cb2d6f31444a0086dee2353d'})}),
 'jwd-frau-schwabingen':Object.freeze({voiceId:'jwd-frau-schwabingen',profileId:'e556ceff3dbb4091989d0f32da52d811',
  profileReferenceSha256:'b144379b6d90019208c98b1310933c6d76b9102635061c133aafbd40d0ad39ad',
  profileOriginalSha256:'8fe924c46dba6ca112c582742c0dd9938ba927ebe43e95e7273a24a6cd7fe82a',
  clipIds:Object.freeze(Array.from({length:8},(_,i)=>'punishment-schwabingen-0'+(i+1))),
  pilotAuthoritySha256:'9ff724aa04b145e3158b63386412d1bd34831d46af47d0197345039d6f1344ce',
  authoritySha256ByClipId:Object.freeze({
   'punishment-schwabingen-02':'4134397e9feb7ef01349cc50f2b0caeb2e6e981ade52cf69d557f3accd5dcebf',
   'punishment-schwabingen-03':'42e0d089d0a30bc9e6a510d8ceacdd676b6e366f49eb9eaaeb4b97c29f856d04',
   'punishment-schwabingen-04':'6a31fb6ee28b586b9c7deda136e7639e076d86d3ade4f3a2863ae97414390967',
   'punishment-schwabingen-05':'e97401ede679aef5031c0976dda78397c6fc91c791215e25ea0c7053a7b4282a',
   'punishment-schwabingen-06':'9e5459e79847523373fe218fc48d4927d137bcf121303e6730710738506b51f6',
   'punishment-schwabingen-07':'d1d695954f766f90b51ca2109729e51eb23833306f8678156fa4eb5168f3bd0b',
   'punishment-schwabingen-08':'e48381a895f4e020901f7bc49cf2222f10b9ada04d550ceb614f5dbb6eba1342'}),
  conditioning:Object.freeze({policy:'literal-reference-pcm-excerpt-v1',profileId:'e556ceff3dbb4091989d0f32da52d811',
   profileReferenceSha256:'b144379b6d90019208c98b1310933c6d76b9102635061c133aafbd40d0ad39ad',
   sourceStartSample:0,sourceEndSampleExclusive:146400,sourceSampleRateHz:24000,sourceChannels:1,sourceBitsPerSample:16,
   referenceSha256:'76deb64130279f5f9b229752d42be2069178f68ef3fe704753186fd556ecba74',
   referencePcmSha256:'13a0d4631fd3b46a837145362470ba4aac6fb804b855b3ea3b8f781cc48d5993',
   referenceText:'Ja, hi Madeleine, da ist ja gar niemand da. Freilein!',
   referenceTextSha256:'8dea5d80a44446be96a7f26be745e78334b7c4bf93a467e2a675f58a8594aae3',
   inputProofSha256:'6582424b1de1e7353a0690d1fea822ff4ff6991c54b3ef11ab895f160bda0cd5',
   boundaryEvidenceSha256:'953b29f170d028774fcf3e3238c871c31eaec932a8947b30bfb6453b67bde957'})})
});
export function validPunishmentReferenceConditioning(clip){
 const approved=punishmentReferenceInputs[clip.voiceId],reference=clip.referenceConditioning,parameters=clip.nativeCompletion?.inferenceParameters;
 if(!approved||!reference||clip.nativeParts!==undefined||clip.nativeCompletion?.kind!==undefined||clip.profileId!==approved.profileId||clip.referenceSha256!==approved.profileReferenceSha256||clip.referenceOriginalSha256!==approved.profileOriginalSha256)return false;
 const id=clip.clipId?.replace(/-part-([1-9]|1[0-9]|20)$/u,'');
 return approved.clipIds.includes(id)&&Object.keys(reference).length===Object.keys(approved.conditioning).length&&Object.entries(approved.conditioning).every(([key,value])=>reference[key]===value)&&parameters?.numStep===32&&parameters?.speed===1&&parameters?.device==='cuda'&&parameters?.dtype==='f16'&&parameters?.preprocessPrompt===true&&(clip.voiceId!=='jwd-frau-schwabingen'||parameters.guidanceScale===2);
}
export function literalPunishmentReference(bytes,approved){
 if(!approved||sha(bytes)!==approved.profileReferenceSha256)throw Error('Full selected reference bytes differ');
 if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE'||bytes.readUInt32LE(4)+8!==bytes.length)throw Error('Invalid selected WAV');
 let pcm,format;
 for(let offset=12;offset+8<=bytes.length;){const size=bytes.readUInt32LE(offset+4),begin=offset+8;if(begin+size>bytes.length)throw Error('Truncated selected WAV');const type=bytes.toString('ascii',offset,offset+4);if(type==='fmt ')format={codec:bytes.readUInt16LE(begin),channels:bytes.readUInt16LE(begin+2),rate:bytes.readUInt32LE(begin+4),bits:bytes.readUInt16LE(begin+14)};if(type==='data'){if(pcm)throw Error('Duplicate selected PCM');pcm=bytes.subarray(begin,begin+size)}offset=begin+size+size%2}
 const r=approved.conditioning;
 if(format?.codec!==1||format.channels!==1||format.rate!==24000||format.bits!==16||!pcm||r.sourceEndSampleExclusive*2>pcm.length)throw Error('Selected reference format/range differs');
 pcm=pcm.subarray(r.sourceStartSample*2,r.sourceEndSampleExclusive*2);if(sha(pcm)!==r.referencePcmSha256)throw Error('Literal reference PCM differs');
 const head=Buffer.alloc(44);head.write('RIFF');head.writeUInt32LE(36+pcm.length,4);head.write('WAVEfmt ',8);head.writeUInt32LE(16,16);head.writeUInt16LE(1,20);head.writeUInt16LE(1,22);head.writeUInt32LE(24000,24);head.writeUInt32LE(48000,28);head.writeUInt16LE(2,32);head.writeUInt16LE(16,34);head.write('data',36);head.writeUInt32LE(pcm.length,40);
 const wav=Buffer.concat([head,pcm]);if(sha(wav)!==r.referenceSha256)throw Error('Literal reference WAV differs');return wav;
}
export function punishmentSwabianRenderInput(line){
 if(line.voiceId!=='jwd-frau-schwabingen'||!/^punishment-schwabingen-0[1-8](?:-part-(?:[1-9]|1[0-9]|20))?$/u.test(line.clipId)||typeof line.text!=='string')throw Error('Only new selected Swabian punishment inputs are eligible');
 const actualInferenceText=line.text.replace(/(?<!\p{L})gkehrt(?!\p{L})/gu,'gekehrt');
 if(actualInferenceText===line.text)throw Error('Source has no finite gkehrt elision');
 return {clipId:line.clipId,canonicalSourceText:line.text,canonicalSourceSha256:sha(line.text),actualInferenceText,actualInferenceSha256:sha(actualInferenceText),renderNormalizationPolicy:'finite-new-punishment-swabian-gekehrt-v1'};
}
export function validPunishmentSwabianRenderInput(clip){
 try{if(clip.nativeParts!==undefined||clip.nativeCompletion?.kind!==undefined)return false;const expected=punishmentSwabianRenderInput(clip);return Object.entries(expected).filter(([key])=>key!=='canonicalSourceText').every(([key,value])=>clip[key]===value)}catch{return false}
}
