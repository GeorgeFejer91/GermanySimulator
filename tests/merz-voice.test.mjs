import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const root=new URL("../",import.meta.url),game=readFileSync(new URL("game.js",root),"utf8");
const context=vm.createContext({window:{}});
vm.runInContext(readFileSync(new URL("For-AI/AUDIO-TEXT-LIBRARY.js",root),"utf8"),context);
const catalog=context.window.GermanySimulatorAudioText,manifest=JSON.parse(readFileSync(new URL("assets/voices/merz/manifest.json",root),"utf8"));
const lines=JSON.parse(game.match(/const merzLines=Object.freeze\((\[.*?\])\);/)[1]);
assert.deepEqual(manifest.clips.map(clip=>clip.text),lines,"all authored Merz lines need their own generated recording");
const quotations=manifest.clips.filter(clip=>clip.quotation);
assert.equal(quotations.length,9,"all added original quotations need source receipts");
for(const clip of quotations){
 assert.match(clip.quotation.date,/^\d{4}-\d{2}-\d{2}$/);
 assert.match(clip.quotation.source,/^https:\/\//);
 assert.ok(clip.quotation.event&&clip.quotation.context);
 if(clip.quotation.kind.includes("clause"))assert.ok(clip.text.startsWith("… "),"a shortened clause must visibly mark the omission");
}
for(const item of manifest.clips){
 const clip=catalog.clips[item.clipId],bytes=readFileSync(new URL(item.path,root));
 assert.equal(clip.voiceId,"merz");
 assert.equal(clip.source,item.text);
 assert.equal(clip.english,catalog.lines[item.text],"resynthesis must preserve the existing English subtitle");
 assert.equal(catalog.recordings[clip.recording].source,item.text);
 assert.ok(!Object.values(catalog.clips).some(other=>other.voiceId==="merkel"&&other.source===item.text),"Merkel must never inherit Merz's recordings");
 assert.equal(item.profileId,catalog.voices.merz.profileId);
 assert.equal(createHash("sha256").update(bytes).digest("hex"),item.sha256);
 assert.equal(item.asrWordExact,true);
 assert.ok(Math.abs(item.integratedLufs+18)<=.3);
 assert.ok(item.truePeakDbtp<=-1.5);
}

const calls=[],elements=new Map();
const sandbox=vm.createContext({speechClip:id=>catalog.clips[id],state:{voiceOn:true,dialogueData:{speaker:"FRIEDRICH MERZ · FIKTIONALE SATIRE"}},STIMULUS_PRIORITY:{CRITICAL:0,REACTIVE:2,AMBIENT:3},document:{getElementById:id=>{if(!elements.has(id))elements.set(id,{textContent:"",hidden:true,dataset:{},classList:{toggle(){},remove(){}}});return elements.get(id)}},setTimeout:()=>1,clearTimeout(){},uiTone(){},setDialogueVoiceBusy(){},queueStimulus:item=>calls.push({mode:"recording",...item}),speak:(text,options)=>calls.push({mode:"browser",text,...options}),speakMerkelLine:(text,options)=>calls.push({mode:"merkel",text,...options})});
vm.runInContext(`const merzLines=${JSON.stringify(lines)};${game.match(/^const MERZ_RECORDINGS=.*$/m)[0]}`,sandbox);
for(const name of ["speakRecorded","speakMerzLine","showWorldBark","speakDialogueLine"])vm.runInContext(game.slice(game.indexOf(`function ${name}(`),game.indexOf('\n}',game.indexOf(`function ${name}(`))+2).split('\nfunction ')[0],sandbox);
for(const text of lines){
 sandbox.showWorldBark("FRIEDRICH MERZ · FIKTIONALE SATIRE",text,false,"","",{family:"politician:merz"});
 let item=calls.pop();
 assert.equal(item.recording,Object.values(catalog.clips).find(clip=>clip.voiceId==="merz"&&clip.text===text).recording);
 assert.equal(item.masculine,true,"recording load failure must retain German masculine browser fallback");
 assert.equal(item.captionOnly,true,'the recorded and browser-fallback line must share the caption channel');
 assert.equal(item.captionSpeaker,'FRIEDRICH MERZ · FIKTIONALE SATIRE');
 item.start();
 assert.equal(elements.get("police-bark-text").textContent,text);
 assert.equal(elements.get("police-bark").hidden,false);
 item.done();
 assert.equal(elements.get("police-bark").hidden,true);
 sandbox.speakDialogueLine(text,()=>{});
 item=calls.pop();
 assert.equal(item.recording,Object.values(catalog.clips).find(clip=>clip.voiceId==="merz"&&clip.text===text).recording);
 assert.equal(item.family,"dialogue","direct interaction must retain its existing broker priority and family");
}
sandbox.speakMerzLine("Eine noch nicht aufgenommene Zeile.");
assert.equal(calls.pop().mode,"browser");
sandbox.showWorldBark("ANGELA MERKEL",lines[0],false);
assert.equal(calls.pop().mode,"merkel");
sandbox.state.voiceOn=false;
sandbox.speakDialogueLine(lines[0],()=>{});
assert.equal(calls.length,0,"voice off must keep recorded speech silent");
console.log("GS Merz: complete text coverage, hashes, subtitles, ownership, both triggers and browser fallback passed");
