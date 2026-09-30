import assert from "node:assert/strict";
import vm from "node:vm";
import {existsSync,readFileSync,readdirSync} from "node:fs";
import {join,relative,sep} from "node:path";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
const game=readFileSync(join(root,"game.js"),"utf8");
const html=readFileSync(join(root,"index.html"),"utf8");
const css=readFileSync(join(root,"styles.css"),"utf8");
const subtitleLayout=readFileSync(join(root,"subtitle-layout.js"),"utf8");
const librarySource=readFileSync(join(root,"For-AI/AUDIO-TEXT-LIBRARY.js"),"utf8");
const context=vm.createContext({window:{}});
vm.runInContext(librarySource,context,{filename:"AUDIO-TEXT-LIBRARY.js"});
const library=context.window.GermanySimulatorAudioText;

assert.equal(library.version,4);
assert.equal(Object.keys(library.clips).length,51,"all shipped foreground clips need stable IDs");
assert.equal(new Set(Object.values(library.clips).map(clip=>clip.path)).size,51,"clip paths must be unique");
for(const clip of Object.values(library.clips)){
 assert.ok(library.voices[clip.voiceId],`${clip.id} needs a registered voice ID`);
 if(clip.targetVoiceId)assert.ok(library.voices[clip.targetVoiceId]?.profileId,`${clip.id} needs a saved replacement profile`);
 assert.ok(clip.source?.trim(),`${clip.id} needs exact spoken text`);
 assert.ok(clip.english?.trim()||clip.cues?.length,`${clip.id} needs an English subtitle`);
 assert.ok(clip.trigger?.trim(),`${clip.id} needs a trigger family`);
 assert.ok(existsSync(join(root,clip.path.slice(2))),`${clip.id} points to a missing recording`);
}
const profileRoles=["player-inner","narrator","passerby-a","passerby-b","police-officer","quiz-officer","merz-character","merkel-character","soeder-character","weidel-character"];
assert.equal(new Set(profileRoles.map(id=>library.voices[id].profileId)).size,10,"character roles need distinct saved profiles");
assert.equal(new Set(profileRoles.map(id=>library.voices[id].referenceSha256)).size,10,"character roles need distinct source references");
for(const [family,id] of [["merz","merz-character"],["merkel","merkel-character"],["bayern","soeder-character"],["alice","weidel-character"]]){
 assert.equal(library.speechFamilies[family].profileVoiceId,id,`${family} needs its own generation profile`);
 assert.equal(library.voices[id].license,"CC BY 4.0");
}
assert.equal(library.clips["quiz-wrong-answer"].voiceId,"quiz-sting","existing quiz audio must not be labeled as a new clone");
assert.equal(library.clips["quiz-wrong-answer"].targetVoiceId,"quiz-officer");
assert.deepEqual([...library.exclusions],["background-music","sound-effect"]);
assert.equal(Object.keys(library.questions).length,73,"every spoken quiz question needs English text");
assert.deepEqual(Object.keys(library.quizContexts).sort(),["civic","grammar-b1","grammar-b2","grammar-c1","traffic"],"each quiz family needs an English factual context");
assert.equal(library.pools.quizApproaches.length,32,"every regional quiz approach needs one shared English rendering");
assert.equal(library.pools.lawPower.length,13,"every recorded law quotation needs English text");
assert.equal(library.pools.railLaw.length,3,"every synthesized rail warning needs English text");
assert.ok(Object.keys(library.lines).length>90,"fixed dialogue translation catalog is unexpectedly small");

const walk=directory=>readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(join(directory,entry.name)):[join(directory,entry.name)]);
const voiceFiles=walk(join(root,"assets/voices")).filter(path=>path.endsWith(".mp3")&&!path.includes(`${sep}laws${sep}`));
voiceFiles.push(join(root,"assets/merkel-wir-schaffen-das.mp3"));
for(const path of voiceFiles){
 const url="./"+relative(root,path).split(sep).join("/");
 assert.ok(library.recordings[url],`${url} is missing from the audio-text library`);
 assert.ok(library.recordings[url].source,`${url} needs an exact source transcript`);
 assert.ok(library.recordings[url].english,`${url} needs an English subtitle`);
}

const trainDurations={
 "./assets/audio/trains/ice-0815-buxtehude-bahnhofshalle-subtle.mp3":50.678,
 "./assets/audio/trains/ice-0815-marktversagen-bahnhofshalle-subtle.mp3":89.940,
 "./assets/audio/trains/ice-0815-stalingrad-bahnhofshalle-subtle.mp3":40.124,
 "./assets/audio/trains/ice-ardorf-hilter-bahnhofshalle-subtle.mp3":46.942,
 "./assets/audio/trains/ice-96-oberkaka-bahnhofshalle-subtle.mp3":46.811
};
for(const [url,duration] of Object.entries(trainDurations)){
 const entry=library.recordings[url];
 assert.ok(entry?.source,"train recording needs a complete source transcript");
 assert.ok(entry.cues.length>=3,"long train recording needs segmented English cues");
 let previousEnd=0;
 for(const [start,end,text] of entry.cues){
  assert.ok(start>=previousEnd-.001,`${url} cue timings overlap`);
  assert.ok(end>start,`${url} cue duration must be positive`);
  assert.ok(text.trim(),`${url} cue text must not be empty`);
  previousEnd=end;
 }
 assert.ok(previousEnd<=duration+.01,`${url} cues exceed the audio duration`);
}

assert.ok(html.indexOf("AUDIO-TEXT-LIBRARY.js")<html.indexOf("game.js"),"subtitle library must load before the game runtime");
assert.match(html,/id="english-subtitle"[\s\S]*id="subtitle-toggle"/);
assert.match(css,/\.english-subtitle\{[^}]*background:#050505[^}]*color:#ffcc00[^}]*"Grenze"[^}]*text-shadow:[^}]*#b00018/);
assert.match(css,/\.english-subtitle\{[^}]*bottom:0/,'subtitles must meet the bottom edge');
assert.match(css,/\.control-dock\{bottom:calc\(30px \+ var\(--subtitle-height\)\);height:84px/,"touch controls need a stable slot above subtitles");
assert.match(css,/\.dialogue,\.dialogue\.memorial\{bottom:calc\(121px \+ var\(--subtitle-height\)\);height:/,"dialogue needs a stable slot above controls");
assert.match(css,/\.english-subtitle\[hidden\]\{[^}]*visibility:hidden/,"the empty subtitle field must retain its layout size");
assert.match(subtitleLayout,/const height=box\.getBoundingClientRect\(\)\.height/,"subtitle layout must reserve its height when empty");
assert.match(subtitleLayout,/prepareWithSegments[\s\S]*measureLineStats/,"subtitle layout must measure text with Pretext");
assert.match(game,/u\.onstart=\(\)=>\{[^\n]*startSubtitle\(item\)/,"browser-speech subtitles must start on the utterance start event");
assert.match(game,/item\.subtitleElapsed=\(\)=>a\.currentTime-t;source\.onended=[^;]+;source\.start\(\);item\.start\?\.\(\);startSubtitle\(item\)/,"recorded subtitles and audio must start in the same task");
assert.match(game,/const time=item\.subtitleElapsed\?\.\(\)\?\?elapsed[\s\S]*requestAnimationFrame\(update\)/,"long cues must continuously follow the audio clock instead of accumulating timer drift");
assert.match(game,/function finishStimulus\([^)]*\)\{[^}]*clearSubtitle\(\)/,"broker completion must clear subtitles");
assert.match(game,/function stopSpeech\([^)]*\)[\s\S]*clearSubtitle\(\)/,"broker cancellation must clear subtitles");
assert.match(game,/localStorage\.setItem\("germany-simulator-english-subtitles"/,"subtitle preference must persist locally");
assert.deepEqual(["Englische Untertitel sind äußerst wichtig, insbesondere wenn Sie Deutsch lernen möchten.","Aufgrund Ihres bemerkenswerten Lerneifers wird die Verwendung von Untertiteln hiermit genehmigt.","Wir gratulieren Ihnen zu dieser verwaltungstechnisch ausgezeichneten Entscheidung."].map(text=>library.lines[text]),["English subtitles are extremely important, especially when you want to learn German.","In recognition of your remarkable eagerness to learn, the use of subtitles is hereby approved.","We congratulate you on this administratively excellent decision."]);
assert.match(game,/if\(!hasStimulusFamily\("subtitle-approval"\)\)for\(const text of SUBTITLE_APPROVAL_LINES\)showWorldBark\("UNTERTITELSTELLE",text/ ,"subtitle approval must show the exact spoken line");
assert.match(game,/subtitleAuthority=\/\^SUBTITLE AUTHORITY\/[\s\S]*u\.rate=subtitleAuthority\?\.72[\s\S]*u\.pitch=subtitleAuthority\?\.55/,"subtitle approval needs a deterministic low, measured robotic delivery");
assert.match(game,/subtitle=\(audioTextLibrary\.pools\.quizApproaches[\s\S]*audioTextLibrary\.questions/,"quiz prompts must use authored English subtitles");
assert.match(game,/englishChunks[\s\S]*subtitle:\(englishChunks\[index\]/,"HUM-01 readings must use their authored English page copy");

console.log("English subtitle catalog, timing, styling, and broker lifecycle OK");
