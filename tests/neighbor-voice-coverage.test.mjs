import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {neighborVoiceCoverage} from '../tools/audit-neighbor-voice-coverage.mjs';

function fixture(){
 const cast=JSON.parse(readFileSync(new URL('../For-AI/VOICE-CAST.json',import.meta.url),'utf8')),context={window:{}};
 vm.createContext(context);
 for(const file of ['For-AI/AUDIO-TEXT-LIBRARY.js','neighbor-story.js'])vm.runInContext(readFileSync(new URL('../'+file,import.meta.url),'utf8'),context);
 return {cast,catalog:context.window.GermanySimulatorAudioText,story:context.window.JwdStory};
}
function productionFunction(name){
 const source=readFileSync(new URL('../game.js',import.meta.url),'utf8'),start=source.indexOf(`function ${name}(`),end=source.indexOf('\nfunction ',start+1);
 assert.ok(start>=0&&end>start,name);return source.slice(start,end);
}
test('all four active neighbor scripts bind exact owned bilingual sources and actual selected defaults',()=>{
 const {cast,catalog,story}=fixture(),report=neighborVoiceCoverage(cast,catalog,story);
 assert.equal(report.expected,110);assert.equal(report.invalid.length,0);
 assert.equal(new Set(report.rows.map(row=>row.voiceId)).size,4);
 assert.ok(report.storyLines.some(line=>line.voiceId==='jwd-theodore-maaslos'));
 assert.ok(report.rows.every(row=>row.voiceId!=='jwd-ede-einbruch'));
 assert.equal(report.resolved,110,'all authored active neighbor lines resolve to owned recordings');
 assert.equal(report.missing.length,0,'completed pack has no held caption-only lines');
 for(const row of report.missing){
  const name={parent:'heiko',watcher:'inga',swabian:'schwabingen',child:'theodore'}[row.role];
  const manifest=JSON.parse(readFileSync(new URL('../assets/voices/neighbors/'+name+'-manifest.json',import.meta.url),'utf8'));
  assert.ok(manifest.heldPrivate.some(line=>line.text===row.text&&line.english===row.english),'missing voice is explicitly held, never counted as complete');
 }
});
test('coverage rejects a wrong voice/profile, lost recording object and changed story translation',()=>{
 const {cast,catalog,story}=fixture(),original=catalog.candidateClip,report=neighborVoiceCoverage(cast,catalog,story),row=report.rows.find(row=>row.path);
 for(const change of [{profileId:'wrong'},{referenceOriginalSha256:'wrong'},{voiceId:'jwd-ede-einbruch'},null]){
  const recording=catalog.recordings[row.path];
  const modified={...catalog,recordings:{...catalog.recordings,[row.path]:change===null?undefined:{...recording,...change}}};
  assert.equal(neighborVoiceCoverage(cast,modified,story).invalid.length,1);
 }
 const first=story.tours.swabian[0].stops[0].lines[0];first.en+=' changed';
 assert.throws(()=>neighborVoiceCoverage(cast,catalog,story),/no exact owned bilingual source/);
 assert.equal(catalog.candidateClip,original,'audit never substitutes a preview resolver');
});

test('Heiko fuller spoken forms use the same exact German subtitles and owned recordings',()=>{
 const {cast,catalog,story}=fixture();
 const report=neighborVoiceCoverage(cast,catalog,story);
 for(const phrase of ['Ich sage es Ihnen jetzt schon','ich habe ihm gesagt']){
  const row=report.rows.find(row=>row.voiceId==='jwd-heiko-maaslos'&&row.text.includes(phrase));
  assert.ok(row,phrase);assert.ok(row.path,'fuller source has a selected recording');
  assert.equal(catalog.recordings[row.path].source,row.text);
  assert.ok(Object.values(story.tours).flatMap(scripts=>scripts.flatMap(script=>script.stops.flatMap(stop=>[...stop.lines||[],...stop.walkLines||[]]))).some(line=>line.de===row.text&&line.en===row.english),'story uses the same bilingual source');
  const oldSource=row.text.replace('Ich sage es','Ich sag’s').replace('ich habe','ich hab');
  assert.equal(catalog.candidateClip(row.voiceId,oldSource)||null,null,'old short form cannot borrow the changed full recording');
 }
});

test('every story-stop speech producer forwards its exact actor, German text, English subtitle and selected recording',()=>{
 const {cast,catalog,story}=fixture(),actors=Object.fromEntries([['parent','jwd-parent'],['watcher','jwd-watcher'],['swabian','jwd-swabian'],['child','jwd-theodore']].map(([jwdRole,id])=>[jwdRole,{jwdRole,id,name:cast.existingAssetProfiles.find(person=>person.gameCharacterId===id).fullName,x:0,y:0}]));
 const calls=[],queued=[],h={state:{dialogue:false,voiceOn:true},jwd:{child:actors.child},player:{x:0,y:0},dist:()=>0,atNeighborStandingSpot:()=>true,jwdGesture(){},clearInput(){},updateHud(){},advanceJwdTour(){assert.fail('a queued line must not advance its stop')},speechCatalog:catalog,STIMULUS_PRIORITY:{CRITICAL:5},queueStimulus:item=>queued.push(item),showWorldBark(){assert.fail('voice is enabled')},openDialogue(speaker,lines,icon,done,voiceId,english){calls.push({speaker,lines,voiceId,english,actor:h.state.characterSpeaker});h.state.dialogueData={};h.speak(lines[0],{candidateVoiceId:voiceId,subtitle:english[0]})}};
 vm.createContext(h);vm.runInContext(['jwdVoice','speakJwdTourLine','speak'].map(productionFunction).join('\n'),h);
 let count=0;
 for(const [role,scripts]of Object.entries(story.tours))for(const script of scripts)for(const [stop,record]of script.stops.entries())for(const [lineIndex,line]of record.lines.entries()){
  const actor=line.speaker==='child'?actors.child:actors[role],tour={id:++count,phase:'ready',actor:actors[role],script,stop,line:lineIndex};h.jwd.tour=tour;h.state.dialogue=false;
  h.speakJwdTourLine(tour);
  assert.equal(calls.length,count,line.id);const call=calls.at(-1),item=queued.at(-1),voiceId=h.jwdVoice(actor);
  assert.equal(call.actor,actor);assert.equal(call.speaker,actor.name);assert.equal(call.voiceId,voiceId);
  assert.deepEqual(Array.from(call.lines),[line.de]);assert.deepEqual(Array.from(call.english),[line.en]);
  assert.equal(item.actor,null,'neighbor ownership stays on the dedicated character-speaker bridge');assert.equal(item.candidateVoiceId,voiceId);assert.equal(item.text,line.de);assert.equal(item.subtitle,line.en);
  assert.equal(item.recording,catalog.candidateClip(voiceId,line.de));assert.equal(tour.phase,'dialogue');
 }
 assert.ok(count>40,'all authored adult and child stop lines use the real producer');
});
