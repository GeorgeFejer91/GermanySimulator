import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import vm from "node:vm";

const root=resolve(import.meta.dirname,"..");
const game=readFileSync(resolve(root,"game.js"),"utf8");
const cast=JSON.parse(readFileSync(resolve(root,"For-AI/VOICE-CAST.json"),"utf8"));
const catalogContext=vm.createContext({window:{}});
vm.runInContext(readFileSync(resolve(root,"For-AI/AUDIO-TEXT-LIBRARY.js"),"utf8"),catalogContext);
vm.runInContext(readFileSync(resolve(root,"buergeramt-story.js"),"utf8"),catalogContext);
const catalog=catalogContext.window.GermanySimulatorAudioText;
const office=catalogContext.window.BuergeramtStory;

function declaration(name){
 const marker=`const ${name}=`,start=game.indexOf(marker);
 if(start<0)throw new Error(`Missing game declaration ${name}`);
 let quote="",escaped=false,depth=0,expression="";
 for(let i=start+marker.length;i<game.length;i++){
  const c=game[i];
  if(quote){expression+=c;if(escaped)escaped=false;else if(c==="\\")escaped=true;else if(c===quote)quote="";continue}
  if(c==='"'||c==="'"||c==="`"){quote=c;expression+=c;continue}
  if("([{ ".includes(c)&&c!==" ")depth++;
  if(")]}".includes(c))depth--;
  if(c===";"&&depth===0)return vm.runInNewContext(`(${expression.trim()})`,{speechClip:id=>catalog.clips[id]});
  expression+=c;
 }
 throw new Error(`Unterminated game declaration ${name}`);
}

const questions=declaration("citizenshipQuestions");
const berlinQuestions=declaration("berlinCitizenshipQuestions");
const pools={
 npcLines:declaration("npcLines"),
 npcDenglisch:declaration("npcDenglisch"),
 policeBarks:declaration("policeBarks"),
 pedestrianBarks:declaration("pedestrianBarks"),
 crowdArchetypes:declaration("crowdArchetypes").map(({id,barks})=>({id,barks})),
 innerMonologues:declaration("innerMonologues"),
 quizApproaches:declaration("quizApproaches"),
 quizContexts:declaration("quizContexts"),
 quizQuestions:Object.fromEntries(questions.map(q=>[String(q.source),{germany:q.question,berlin:berlinQuestions[q.source]?.question??q.question,type:q.type??"civic",level:q.level??null}])),
 buergeramtPolicePhone:{voiceId:"polizei-heinrich-wachtmeister",call:office.call.line,replies:office.police},
 buergeramtClerk:{identity:office.clerkIdentity,counter:office.clerk.map(({line,choices})=>({line,replies:choices.map(({reply})=>reply)})),outburst:office.outburst.lines},
};
const inventory={
 schemaVersion:1,
 explanation:"Exact currently authored source pools. Quiz speech concatenates one regional approach, one category context and one regional question; the combinations are generated at runtime. Fixed NPC lines and their owners are in VOICE-CAST.json. Bürgeramt clerk and Heinrich Wachtmeister phone dialogue from buergeramt-story.js are inventoried separately; additional call-status sentences in buergeramt.js remain context-dependent.",
 source:["game.js","buergeramt-story.js"],
 fixedCharacterDialogueCount:cast.dialogueCount,
 dynamicIdentityVoiceIds:cast.roleProfiles.map(person=>({voiceId:person.voiceId,sourcePools:person.dialogueSources})),
 pools,
};
const target=resolve(root,"For-AI/VOICE-DIALOGUE-INVENTORY.json");
const rendered=JSON.stringify(inventory,null,2)+"\n";
if(process.argv.includes("--check")){
 if(readFileSync(target,"utf8")!==rendered)throw new Error("Voice dialogue inventory differs from current game and cast; regenerate it.");
 console.log(`Verified ${questions.length} quiz questions and ${cast.roleProfiles.length} dynamic identities`);
}else{
 writeFileSync(target,rendered);
 console.log(`Wrote ${target}: ${questions.length} quiz questions, ${cast.roleProfiles.length} dynamic identities`);
}
