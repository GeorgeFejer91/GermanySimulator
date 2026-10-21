import {createHash} from 'node:crypto';

const voiceId='jwd-frau-schwabingen',profileId='e556ceff3dbb4091989d0f32da52d811';
const digest=value=>createHash('sha256').update(value).digest('hex');
const textWords=value=>value.toLocaleLowerCase('de').match(/[\p{L}\p{N}]+/gu)||[];
const negations=new Set(['nicht','net','ned','nit','nie','niemals','kein','keine','keinen','keinem','keiner','keines','kei','koi','koin','koine','koinen','koinem','koiner','koines','koim','koina','nix','nichts']);
const requireMatch=(condition,message)=>{if(!condition)throw Error(message)};
const validHash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/u.test(value);
const nonempty=value=>typeof value==='string'&&value.trim().length>0;
export const schwab08NegationCorroboration=Object.freeze({
 kind:'exact-final-take-dual-ASR-negation-corroboration',
 sourceToken:'net',cpuToken:'nett',cpuWordIndex:47,
 q4Clause:'Ich gewöhn mich nicht in meinem Alter an ihr Bastelprojekt.',
 q4ReceiptSha256:'58d2cc014b2995f0ef098fe564b6a74dfe108400207a67178ed6aca9150b6cdd',
 cpuReceiptSha256:'8a6fe985c1fcbb4a6a751296e40311bc62b810f51584436ef2e6ff4b5a4a8905'
});

function final08NegationSupported({parent,part},clause,source,recognized,words){
 const evidence=clause.negationCorroboration,expected=schwab08NegationCorroboration,alternative=part.asrAlternativeVerification;
 return parent.clipId==='punishment-schwabingen-08'&&part.clipId===parent.clipId&&
  digest(parent.text)==='d91d67087ebd4b0810c3e230d6a7386dad302f61bd87fadfe23c39cd3bb3661e'&&
  part.encodedSha256==='1140006e51eb9684d1c09396b842de2a957646063e97e5871f69890ffac8a2d3'&&
  clause.sourceStart===258&&clause.sourceEnd===314&&clause.wordStart===44&&clause.wordEnd===54&&
  evidence?.reviewer==='/root'&&nonempty(evidence.notes)&&Object.entries(expected).every(([key,value])=>evidence[key]===value)&&
  alternative.priorAsrReceiptSha256===expected.q4ReceiptSha256&&alternative.receiptSha256===expected.cpuReceiptSha256&&
  alternative.priorTranscript.endsWith(expected.q4Clause)&&words[47]?.word.trim().toLocaleLowerCase('de')==='nett'&&
  source.filter(word=>negations.has(word)).length===1&&source.includes('net')&&
  recognized.filter(word=>negations.has(word)).length===0&&recognized.filter(word=>word==='nett').length===1&&
  textWords(expected.q4Clause).filter(word=>negations.has(word)).length===1;
}

function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
 return value;
}

function bindings({parent,part}){
 requireMatch(parent&&part&&/^punishment-schwabingen-0[1-8]$/u.test(parent.clipId),'Only new Schwabingen punishment sources may use clause review');
 const fullParent=part.clipId===parent.clipId;
 requireMatch(fullParent||new RegExp('^'+parent.clipId+'-part-([1-9]|1[0-9]|20)$','u').test(part.clipId),'Exact numbered punishment part required');
 requireMatch(parent.voiceId===voiceId&&parent.profileId===profileId&&part.voiceId===voiceId&&part.profileId===profileId,'Selected Schwabingen identity required');
 requireMatch(nonempty(parent.text)&&nonempty(part.text)&&Number.isInteger(part.sourceStart)&&Number.isInteger(part.sourceEnd)&&part.sourceStart>=0&&part.sourceEnd>part.sourceStart&&part.sourceEnd<=parent.text.length&&parent.text.slice(part.sourceStart,part.sourceEnd)===part.text,'Exact source span required');
 const sourceWords=textWords(part.text);
 requireMatch(sourceWords.length>0&&sourceWords.length<=(fullParent?65:25),'Dialect review source exceeds the bounded part/parent word limit');
 requireMatch(!fullParent||part.sourceStart===0&&part.sourceEnd===parent.text.length&&part.encodedSha256===parent.sha256,'Final parent review must bind the full source and final MP3 hash');
 requireMatch(part.asrWordExact===false&&part.asrScriptPrompt===null&&part.asrLanguageId==='de'&&nonempty(part.asr),'Dialect review preserves the actual false word-exact result and unprompted German policy');
 const alternative=part.asrAlternativeVerification;
 requireMatch(alternative&&alternative.transcript===part.asr&&alternative.audioSha256===part.encodedSha256&&alternative.modelSha256===part.asrModelSha256,'CPU transcript/audio/model binding drift');
 requireMatch(alternative.renderer==='faster-whisper CPU int8 independent unprompted whole-file reading'&&alternative.device==='cpu'&&alternative.computeType==='int8'&&alternative.cpuThreads===1&&alternative.beamSize===5&&alternative.language==='de'&&alternative.scriptPrompt===null&&alternative.conditionOnPreviousText===false,'Independent unprompted CPU recognizer policy required');
 requireMatch(nonempty(alternative.priorTranscript),'Actual prior q4 transcript required');
 for(const value of [part.encodedSha256,part.nativeAudioSha256,part.asrModelSha256,alternative.receiptSha256,alternative.helperSha256,alternative.priorAsrReceiptSha256])requireMatch(validHash(value),'Native, encoded and recognizer receipt hashes required');
 requireMatch(part.asrReceiptSha256===alternative.priorAsrReceiptSha256,'Prior q4 receipt lineage drift');
 const words=alternative.words;
 requireMatch(Array.isArray(words)&&words.length>0&&words.every(word=>nonempty(word.word)&&Number.isFinite(word.start)&&Number.isFinite(word.end)&&word.start>=0&&word.end>=word.start)&&words.at(-1).end>words[0].start,'Complete finite recognizer word timestamps required');
 requireMatch(words.every((word,index)=>!index||word.start>=words[index-1].end),'Recognizer word timestamps must be ordered and nonoverlapping');
 requireMatch(JSON.stringify(textWords(words.map(word=>word.word).join(' ')))===JSON.stringify(textWords(alternative.transcript)),'Recognizer words must cover the actual complete CPU transcript');
 requireMatch(!fullParent||validHash(parent.sha256),'Invalid parent encoded hash');
 return {kind:fullParent?'parent':'clause',parentClipId:parent.clipId,parentSourceSha256:digest(parent.text),parentEncodedSha256:fullParent?parent.sha256:null,
  partClipId:part.clipId,voiceId,profileId,sourceStart:part.sourceStart,sourceEnd:part.sourceEnd,
  sourceSha256:digest(part.text),nativeAudioSha256:part.nativeAudioSha256,encodedSha256:part.encodedSha256,
  priorTranscriptSha256:digest(alternative.priorTranscript),priorAsrReceiptSha256:alternative.priorAsrReceiptSha256,
  transcriptSha256:digest(alternative.transcript),wordsSha256:digest(JSON.stringify(canonical(words))),
  asrModelSha256:alternative.modelSha256,asrReceiptSha256:alternative.receiptSha256,asrHelperSha256:alternative.helperSha256,
  recognizerSha256:digest(JSON.stringify(canonical(alternative)))};
}

export function validateDialectClauseReview(candidate,review){
 const expected=bindings(candidate),{part}=candidate,words=part.asrAlternativeVerification.words;
 requireMatch(review?.schemaVersion===1&&review.status==='integrator-verified-complete-dialect-'+expected.kind&&review.reviewer==='/root','Explicit ROOT integrator clause review required');
 requireMatch(review.listening==='NOT RUN'&&review.completeSemanticCoverage===true&&nonempty(review.notes),'Complete semantic assertion and factual integrator notes required; listening remains NOT RUN');
 requireMatch(JSON.stringify(canonical(review.binding))===JSON.stringify(canonical(expected)),'Clause review source/take/recognizer binding drift');
 requireMatch(Array.isArray(review.clauses)&&review.clauses.length>0,'Explicit source clause coverage required');
 let sourceEnd=0,wordEnd=0;
 for(const clause of review.clauses){
  requireMatch(clause.status==='complete'&&clause.completeSemanticCoverage===true&&nonempty(clause.sourceMeaning)&&nonempty(clause.recognizedMeaning)&&nonempty(clause.notes),'Each clause needs an explicit complete integrator semantic review');
  requireMatch(Number.isInteger(clause.sourceStart)&&Number.isInteger(clause.sourceEnd)&&clause.sourceStart===sourceEnd&&clause.sourceEnd>sourceEnd&&clause.sourceEnd<=part.text.length,'Source clauses must cover the part without gaps, overlap or reordering');
  requireMatch(Number.isInteger(clause.wordStart)&&Number.isInteger(clause.wordEnd)&&clause.wordStart===wordEnd&&clause.wordEnd>wordEnd&&clause.wordEnd<=words.length,'Recognized ranges must cover all words without gaps, overlap or reordering');
  const source=textWords(part.text.slice(clause.sourceStart,clause.sourceEnd));
  const recognized=textWords(words.slice(clause.wordStart,clause.wordEnd).map(word=>word.word).join(' '));
  requireMatch(source.length>0&&source.length<=25&&recognized.length/source.length>=.6&&recognized.length/source.length<=1.7,'Clause word-count sanity rejects obviously incomplete or excessive content');
  requireMatch(recognized.filter(word=>negations.has(word)).length===source.filter(word=>negations.has(word)).length||final08NegationSupported(candidate,clause,source,recognized,words),'Source negation count differs without exact-take ROOT-reviewed dual-ASR corroboration');
  sourceEnd=clause.sourceEnd;wordEnd=clause.wordEnd;
 }
 requireMatch(sourceEnd===part.text.length&&wordEnd===words.length,'Uncovered source or recognizer tail');
 return true;
}

export function buildDialectClauseReview({parent,part,reviewer,notes,completeSemanticCoverage,clauses}){
 const candidate={parent,part};
 const binding=bindings(candidate);
 const review={schemaVersion:1,status:'integrator-verified-complete-dialect-'+binding.kind,reviewer,listening:'NOT RUN',completeSemanticCoverage,notes,
  binding,clauses:structuredClone(clauses)};
 validateDialectClauseReview(candidate,review);
 return review;
}
