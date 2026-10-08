import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";

const root=resolve(import.meta.dirname,"..");
const manifest=JSON.parse(readFileSync(resolve(root,"assets/voices/candidate-dialogue/manifest.json"),"utf8"));
if(manifest.lineCount!==manifest.clips.length)throw new Error("Candidate count differs from manifest");
const keys=new Set();
const rows=manifest.clips.map(clip=>{
 const key=clip.voiceId+"\0"+clip.text;
 if(keys.has(key))throw new Error(`Duplicate candidate ${clip.clipId}`);
 keys.add(key);
 return ` ${JSON.stringify([clip.voiceId,clip.text,clip.path])}`;
});
const block=`const candidateDialogue=Object.freeze(Object.fromEntries([\n${rows.join(",\n")}\n].map(([voiceId,text,path])=>[voiceId+"\\u0000"+text,path])));\n`;
const path=resolve(root,"For-AI/AUDIO-TEXT-LIBRARY.js");
const source=readFileSync(path,"utf8");
const pattern=/const candidateDialogue=Object\.freeze\(Object\.fromEntries\(\[[\s\S]*?\nfunction candidateClip/;
if(!pattern.test(source))throw new Error("Candidate preview block not found");
const updated=source.replace(pattern,block+"function candidateClip");
if(process.argv.includes("--check")){
 if(updated!==source)throw new Error("Candidate preview lookup differs from manifest; regenerate it.");
 console.log(`Verified ${rows.length} candidate preview lookups`);
}else{
 writeFileSync(path,updated);
 console.log(`Wrote ${rows.length} candidate preview lookups`);
}
