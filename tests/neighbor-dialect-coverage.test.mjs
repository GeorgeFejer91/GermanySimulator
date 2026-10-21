import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDialectClauseReview,validateDialectClauseReview,schwab08NegationCorroboration} from '../tools/neighbor-dialect-coverage.mjs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {validPunishmentDialectReview} from '../tools/curate-voice-library.mjs';

const hash=letter=>letter.repeat(64);
const source='So, Sie bleibet jetzt erscht emol do.';
const transcript='So, Sie bleiben jetzt erst mal da.';
function fixture(text=source,heard=transcript){
 const parent={clipId:'punishment-schwabingen-01',text,voiceId:'jwd-frau-schwabingen',profileId:'e556ceff3dbb4091989d0f32da52d811'};
 const words=heard.split(/\s+/u).map((word,index)=>({word,start:index*.3,end:index*.3+.2}));
 const part={...parent,clipId:parent.clipId+'-part-1',sourceStart:0,sourceEnd:text.length,
  encodedSha256:hash('a'),nativeAudioSha256:hash('b'),asrModelSha256:hash('c'),asrReceiptSha256:hash('d'),
  asr:heard,asrWordExact:false,asrScriptPrompt:null,asrLanguageId:'de',
  asrAlternativeVerification:{transcript:heard,audioSha256:hash('a'),modelSha256:hash('c'),
   renderer:'faster-whisper CPU int8 independent unprompted whole-file reading',device:'cpu',computeType:'int8',cpuThreads:1,
   beamSize:5,language:'de',scriptPrompt:null,conditionOnPreviousText:false,words,
   priorTranscript:'So, Sie bleiben jetzt erst mal da.',priorAsrReceiptSha256:hash('d'),receiptSha256:hash('e'),helperSha256:hash('f')}};
 return {parent,part};
}
function declaration(candidate){
 return {...candidate,reviewer:'/root',completeSemanticCoverage:true,
  notes:'Explicit integrator text review: dialect spelling and morphology differ; the complete instruction to remain here is represented. Listening was not performed.',
  clauses:[{sourceStart:0,sourceEnd:candidate.part.text.length,wordStart:0,wordEnd:candidate.part.asrAlternativeVerification.words.length,
   sourceMeaning:'The addressee must remain here now.',recognizedMeaning:'The addressee must remain here now.',
   notes:'bleibet/bleiben, erscht/erst, emol/mal and do/da are the reviewed spelling or morphology differences.',
   status:'complete',completeSemanticCoverage:true}]};
}

test('explicit integrator review binds truthful dialect mismatch without changing ASR or source',()=>{
 const candidate=fixture(),before=structuredClone(candidate),review=buildDialectClauseReview(declaration(candidate));
 assert.equal(validateDialectClauseReview(candidate,review),true);
 assert.equal(review.status,'integrator-verified-complete-dialect-clause');
 assert.equal(review.listening,'NOT RUN');assert.equal(review.binding.parentEncodedSha256,null);
 assert.deepEqual(candidate,before);assert.equal(candidate.part.asrWordExact,false);
});

test('missing opening instruction cannot be approved by the clause receipt',()=>{
 const candidate=fixture(source,'Ach so');
 assert.throws(()=>buildDialectClauseReview(declaration(candidate)),/word-count sanity/u);
});

test('untrusted, partial, uncertain or absent explicit semantic assertions are rejected',()=>{
 for(const mutate of [row=>row.reviewer='worker',row=>row.reviewer='/root/neighbor_research',row=>row.completeSemanticCoverage=false,row=>delete row.completeSemanticCoverage,
  row=>row.notes='',row=>row.clauses[0].status='uncertain',row=>row.clauses[0].status='missing-content',
  row=>row.clauses[0].completeSemanticCoverage=false,row=>row.clauses[0].recognizedMeaning='']){
  const input=declaration(fixture());mutate(input);assert.throws(()=>buildDialectClauseReview(input));
 }
});

test('scope excludes other voices, profiles, ordinary sources and malformed part IDs',()=>{
 for(const mutate of [c=>c.part.voiceId='jwd-inga-maaslos',c=>c.part.profileId='other',c=>c.parent.profileId='other',
  c=>c.parent.clipId='schwabingen-ordinary-01',c=>c.part.clipId='punishment-schwabingen-09-part-1',
  c=>c.part.clipId='punishment-schwabingen-01-part-junk']){
  const candidate=fixture();mutate(candidate);assert.throws(()=>buildDialectClauseReview(declaration(candidate)));
 }
});

test('source text, spans, native bytes and encoded bytes are bound to the reviewed candidate',()=>{
 for(const mutate of [c=>{c.parent.text+=' Nein.'},c=>c.part.sourceEnd--,c=>c.part.nativeAudioSha256=hash('1'),
  c=>{c.part.encodedSha256=hash('2');c.part.asrAlternativeVerification.audioSha256=hash('2')},
  c=>{c.parent.text=c.parent.text.replace('jetzt','heute');c.part.text=c.parent.text}]){
  const candidate=fixture(),review=buildDialectClauseReview(declaration(candidate));mutate(candidate);
  assert.throws(()=>validateDialectClauseReview(candidate,review));
 }
});

test('q4 transcript, both ASR receipts, CPU transcript, model and helper hashes remain immutable',()=>{
 for(const key of ['priorTranscript','priorAsrReceiptSha256','receiptSha256','helperSha256','modelSha256']){
  const candidate=fixture(),review=buildDialectClauseReview(declaration(candidate));
  candidate.part.asrAlternativeVerification[key]=key==='priorTranscript'?'Changed q4 words.':hash('1');
  assert.throws(()=>validateDialectClauseReview(candidate,review));
 }
 const candidate=fixture(),review=buildDialectClauseReview(declaration(candidate));candidate.part.asr='Changed words.';
 assert.throws(()=>validateDialectClauseReview(candidate,review));
});

test('prompt, language, device, beam and conditioning policy cannot change',()=>{
 for(const [key,value]of Object.entries({scriptPrompt:'expected words',conditionOnPreviousText:true,device:'cuda',computeType:'float16',cpuThreads:2,beamSize:1,language:'en',renderer:'other'})){
  const candidate=fixture();candidate.part.asrAlternativeVerification[key]=value;
  assert.throws(()=>buildDialectClauseReview(declaration(candidate)));
 }
 const candidate=fixture();candidate.part.asrWordExact=true;
 assert.throws(()=>buildDialectClauseReview(declaration(candidate)),/false word-exact/u);
});

test('timestamps must describe every actual recognizer word in ordered finite ranges',()=>{
 for(const mutate of [words=>words[0].start=NaN,words=>words[0].start=-1,words=>words[0].end=-.1,
  words=>words[1].start=0,words=>words.pop(),words=>words[0].word='Different']){
  const candidate=fixture();mutate(candidate.part.asrAlternativeVerification.words);
  assert.throws(()=>buildDialectClauseReview(declaration(candidate)));
 }
 const candidate=fixture(),review=buildDialectClauseReview(declaration(candidate));candidate.part.asrAlternativeVerification.words[0].end=.21;
 assert.throws(()=>validateDialectClauseReview(candidate,review),/binding drift/u);
});

test('actual zero-duration recognizer words remain truthful while negation additions fail',()=>{
 const candidate=fixture();candidate.part.asrAlternativeVerification.words[0].end=0;
 assert.doesNotThrow(()=>buildDialectClauseReview(declaration(candidate)));
 const added=fixture('Sie gehen heute über den Rasen.','Sie gehen nicht über den Rasen.');
 assert.throws(()=>buildDialectClauseReview(declaration(added)),/negation/u);
});

test('source and recognizer omissions, gaps, overlap, tails and reordering fail',()=>{
 for(const mutate of [rows=>rows[0].sourceStart=1,rows=>rows[0].sourceEnd--,rows=>rows[0].wordStart=1,
  rows=>rows[0].wordEnd--,rows=>rows.push({...rows[0]}),rows=>rows.splice(0)]){
  const input=declaration(fixture());mutate(input.clauses);assert.throws(()=>buildDialectClauseReview(input));
 }
});

test('whole-word negation loss fails even when word count still matches',()=>{
 const candidate=fixture('Sie dürfet net über den Rasen laufen.','Sie dürfen jetzt über den Rasen laufen.');
 assert.throws(()=>buildDialectClauseReview(declaration(candidate)),/negation/u);
 for(const negative of ['nicht','nie','net','ned','nit','kein','keinen','koi','koine']){
  const row=fixture(`Sie sagen ${negative} heute.`,`Sie sagen richtig heute.`);
  assert.throws(()=>buildDialectClauseReview(declaration(row)),/negation/u);
 }
 const ordinary=fixture('Sie zahlen netto drei Euro.','Sie zahlen netto drei Euro.');
 assert.doesNotThrow(()=>buildDialectClauseReview(declaration(ordinary)));
});

test('leaf reviews survive later parent encoding while parent review binds the final MP3',()=>{
 const candidate=fixture(),review=buildDialectClauseReview(declaration(candidate));
 candidate.parent.sha256=hash('3');assert.equal(validateDialectClauseReview(candidate,review),true);
 const full=fixture();full.parent.sha256=full.part.encodedSha256;full.part.clipId=full.parent.clipId;
 const parentReview=buildDialectClauseReview(declaration(full));
 assert.equal(parentReview.status,'integrator-verified-complete-dialect-parent');
 assert.equal(parentReview.binding.parentEncodedSha256,full.parent.sha256);
 full.parent.sha256=hash('4');assert.throws(()=>validateDialectClauseReview(full,parentReview));
});

test('parent review requires separate complete clauses each within the 25-word bound',()=>{
 const first='So, Sie bleibet jetzt erscht emol do. ',second='Sie dürfen heute auf dem Weg bleiben.';
 const candidate=fixture(first+second,transcript+' '+second);
 candidate.parent.sha256=candidate.part.encodedSha256;candidate.part.clipId=candidate.parent.clipId;
 const input=declaration(candidate),wordEnd=transcript.split(/\s+/u).length;
 input.clauses=[{...input.clauses[0],sourceEnd:first.length,wordEnd},{...input.clauses[0],sourceStart:first.length,wordStart:wordEnd}];
 assert.doesNotThrow(()=>buildDialectClauseReview(input));
 const long=fixture('Wort '.repeat(26).trim(),'Wort '.repeat(26).trim());
 assert.throws(()=>buildDialectClauseReview(declaration(long)),/word limit/u);
 long.parent.sha256=long.part.encodedSha256;long.part.clipId=long.parent.clipId;
 assert.throws(()=>buildDialectClauseReview(declaration(long)),/word-count sanity/u);
});

test('curator requires ROOT-bound review for the complete new dialect encoding',()=>{
 const full=fixture();full.parent.sha256=full.part.encodedSha256;full.part.clipId=full.parent.clipId;
 const clip={...full.parent,...full.part,sha256:full.parent.sha256};
 clip.dialectParentReview=buildDialectClauseReview(declaration({parent:clip,part:clip}));
 assert.equal(validPunishmentDialectReview(clip),true);
 const changedTranscript={...clip,asr:clip.asr+' irgendwas'};
 assert.equal(validPunishmentDialectReview(changedTranscript),false);
 clip.sha256=hash('5');assert.equal(validPunishmentDialectReview(clip),false);
});

function final08Declaration(){
 const window={};vm.runInNewContext(readFileSync(new URL('../neighbor-punishment.js',import.meta.url),'utf8'),{window});
 const text=window.JwdPunishment.stories.find(row=>row.id==='punishment-schwabingen-08').lines[0].de;
 const heard='An den Baumstumpf kommt kein Vogelhaus. Der war schon da, bevor sie überhaupt ihren Schlüssel gehabt hätten. Bloß weil keine Äste mehr dran sind, ist das noch lang kein Anlass für neue Ideen. Ich hab den jahrelang angeguckt. Sie lassen den jetzt ordentlich leer. Ich gewöhn mich nett in meinem Alter an ihr Bastelprojekt.';
 const candidate=fixture(text,heard),encoded='1140006e51eb9684d1c09396b842de2a957646063e97e5871f69890ffac8a2d3';
 Object.assign(candidate.parent,{clipId:'punishment-schwabingen-08',sha256:encoded});
 Object.assign(candidate.part,{clipId:candidate.parent.clipId,encodedSha256:encoded,asrReceiptSha256:schwab08NegationCorroboration.q4ReceiptSha256});
 Object.assign(candidate.part.asrAlternativeVerification,{audioSha256:encoded,priorAsrReceiptSha256:schwab08NegationCorroboration.q4ReceiptSha256,receiptSha256:schwab08NegationCorroboration.cpuReceiptSha256,priorTranscript:'an den baumstumpf kommt kein vogelhaus der war schon do bevor sie überhaupt ihren schlüssel gabt hendt bloß weil keine äste mehr dran sind isch des noch lang kein anlass für neue ideen Ich hab den jahrelang angeguckt. Sie lassen den jetzt ordentlich leer. '+schwab08NegationCorroboration.q4Clause});
 const input=declaration(candidate),spans=[[0,39,0,6],[39,105,6,17],[105,189,17,33],[189,220,33,38],[220,258,38,44],[258,314,44,54]];
 input.clauses=spans.map(([sourceStart,sourceEnd,wordStart,wordEnd])=>({...input.clauses[0],sourceStart,sourceEnd,wordStart,wordEnd}));
 input.clauses.at(-1).negationCorroboration={...schwab08NegationCorroboration,reviewer:'/root',notes:'Fixture ROOT declaration: the exact q4 negative clause corroborates source net; actual CPU nett remains unchanged and nonliteral.'};
 return input;
}
test('only the exact final08 take can use explicit ROOT dual-ASR negation corroboration',()=>{
 const input=final08Declaration(),before=structuredClone(input),review=buildDialectClauseReview(input);
 assert.equal(validateDialectClauseReview(input,review),true);assert.equal(input.part.asrWordExact,false);assert.deepEqual(input,before);
 assert.match(input.part.asr,/nett in meinem Alter/u);assert.match(input.part.asrAlternativeVerification.priorTranscript,/nicht in meinem Alter/u);
});
test('final08 corroboration rejects other takes/sources, lost q4 negation, extra nett and wrong slots',()=>{
 const synchronize=c=>{c.part.asr=c.part.asrAlternativeVerification.words.map(w=>w.word.trim()).join(' ');c.part.asrAlternativeVerification.transcript=c.part.asr};
 for(const mutate of [
  c=>delete c.clauses.at(-1).negationCorroboration,
  c=>c.clauses.at(-1).negationCorroboration.notes='',
  c=>c.clauses.at(-1).negationCorroboration.reviewer='/root/neighbor_research',
  c=>{c.parent.clipId='punishment-schwabingen-07';c.part.clipId=c.parent.clipId},
  c=>{c.parent.sha256=hash('1');c.part.encodedSha256=hash('1');c.part.asrAlternativeVerification.audioSha256=hash('1')},
  c=>{c.parent.text=c.parent.text.replace('Baumstumpf','Bäumstumpf');c.part.text=c.parent.text},
  c=>c.part.asrAlternativeVerification.priorTranscript=c.part.asrAlternativeVerification.priorTranscript.replace('nicht in meinem','heute in meinem'),
  c=>{c.part.asrAlternativeVerification.words[4].word='ein';synchronize(c)},
  c=>{c.part.asrAlternativeVerification.words[48].word='nett';synchronize(c)},
  c=>c.clauses.at(-1).negationCorroboration.cpuWordIndex=46,
  c=>{c.clauses.at(-2).sourceEnd++;c.clauses.at(-1).sourceStart++},
  c=>c.part.asrAlternativeVerification.receiptSha256=hash('2'),
  c=>{c.part.asrReceiptSha256=hash('3');c.part.asrAlternativeVerification.priorAsrReceiptSha256=hash('3')}
 ]){const input=final08Declaration();mutate(input);assert.throws(()=>buildDialectClauseReview(input))}
});
