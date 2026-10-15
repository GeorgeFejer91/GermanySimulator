import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import vm from "node:vm";

const root=resolve(import.meta.dirname,"..");
const game=readFileSync(resolve(root,"game.js"),"utf8");
const officeRuntime=readFileSync(resolve(root,"buergeramt.js"),"utf8");
const cast=JSON.parse(readFileSync(resolve(root,"For-AI/VOICE-CAST.json"),"utf8"));
const catalogContext=vm.createContext({window:{}});
vm.runInContext(readFileSync(resolve(root,"For-AI/AUDIO-TEXT-LIBRARY.js"),"utf8"),catalogContext);
vm.runInContext(readFileSync(resolve(root,"buergeramt-story.js"),"utf8"),catalogContext);
const catalog=catalogContext.window.GermanySimulatorAudioText;
const office=catalogContext.window.BuergeramtStory;

function declaration(name,source=game){
 const marker=`const ${name}=`,start=source.indexOf(marker);
 if(start<0)throw new Error(`Missing game declaration ${name}`);
 let quote="",escaped=false,depth=0,expression="";
 for(let i=start+marker.length;i<source.length;i++){
  const c=source[i];
  if(quote){expression+=c;if(escaped)escaped=false;else if(c==="\\")escaped=true;else if(c===quote)quote="";continue}
  if(c==='"'||c==="'"||c==="`"){quote=c;expression+=c;continue}
  if("([{ ".includes(c)&&c!==" ")depth++;
  if(")]}".includes(c))depth--;
  if(c===";"&&depth===0)return vm.runInNewContext(`(${expression.trim()})`,{speechClip:id=>catalog.clips[id]});
  expression+=c;
 }
 throw new Error(`Unterminated game declaration ${name}`);
}

function cityDialoguePool(){
 const people=cast.characters.filter(person=>person.gameCharacterId?.startsWith("city-")),table=catalog.cityDialogue;
 if(people.length!==19||new Set(people.map(person=>person.gameCharacterId)).size!==19||new Set(people.map(person=>person.voiceId)).size!==19||!table||Object.keys(table).length!==19)throw new Error("Expected nineteen distinct city dialogue owners and public exports");
 return Object.fromEntries(people.map(person=>{
  const actor=person.gameCharacterId,owned=table[actor];
  if(person.voiceId!=="stadt-"+actor.slice(5)||!cast.productionVoices[person.voiceId]||!Array.isArray(person.dialogue)||person.dialogue.length!==4||owned?.voiceId!==person.voiceId||Object.keys(owned).sort().join(",")!=="berlin,germany,voiceId")throw new Error("City inventory actor/voice mismatch: "+actor);
  const regions=Object.fromEntries(["germany","berlin"].map(region=>{
   const exported=owned[region];if(!Array.isArray(exported)||exported.length!==2)throw new Error("Incomplete city inventory region: "+actor+" "+region);
   return[region,[0,1].map(slot=>{
    const rows=person.dialogue.filter(row=>row.region===region&&row.slot===slot),clip=exported[slot];
    if(rows.length!==1)throw new Error("Missing/duplicate city inventory slot: "+actor+" "+region+" "+slot);
    const row=rows[0],id=person.voiceId+"-"+String((region==="berlin"?2:0)+slot+1).padStart(2,"0"),locator="For-AI/VOICE-CAST.json characters[gameCharacterId="+actor+"].dialogue[region="+region+",slot="+slot+"]";
    if(typeof row.text!=="string"||!row.text.trim()||typeof row.english!=="string"||!row.english.trim()||row.locator!==locator||!clip||Object.keys(clip).sort().join(",")!=="english,id,text"||clip.id!==id||clip.text!==row.text||clip.english!==row.english)throw new Error("City inventory source/export mismatch: "+locator);
    return row.text;
   })];
  }));
  return[person.voiceId,regions];
 }));
}

const questions=declaration("citizenshipQuestions");
const berlinQuestions=declaration("berlinCitizenshipQuestions");
const pools={
 cityDialogue:cityDialoguePool(),
 npcLines:declaration("npcLines"),
 npcDenglisch:declaration("npcDenglisch"),
 policeBarks:declaration("policeBarks"),
 pedestrianBarks:declaration("pedestrianBarks"),
 crowdArchetypes:declaration("crowdArchetypes").map(({id,barks})=>({id,barks})),
 crowdCharacterBarks:declaration("crowdCharacterBarks"),
 innerMonologues:declaration("innerMonologues"),
 quizApproaches:declaration("quizApproaches"),
 quizContexts:declaration("quizContexts"),
 quizQuestions:Object.fromEntries(questions.map(q=>[String(q.source),{germany:q.question,berlin:berlinQuestions[q.source]?.question??q.question,type:q.type??"civic",level:q.level??null}])),
 buergeramtPolicePhone:{voiceId:office.call.voiceId,call:office.call.line,replies:office.police},
 buergeramtQueueCall:office.queueCall,
 buergeramtClerk:{identity:office.clerkIdentity,counter:office.clerk.map(({line,choices})=>({line,replies:choices.map(({reply})=>reply)})),outburst:office.outburst.lines,phoneDismissal:office.phoneDismissal,phoneWarnings:office.phoneWarnings,registration:office.registration},
 buergeramtPatrons:office.patrons,
 buergeramtCounterClerks:{identities:office.clerks,refusal:office.clerkRefusal},
 buergeramtAmbient:office.ambient.map(row=>{const person=office.characters[row.actor]||office.patrons[{renter:"amt-konrad-wohnungszettel",parent:"amt-mechthild-elternbogen",pensioner:"amt-wolfram-rentenbescheid"}[row.actor]]||office.clerks[row.actor.replace("clerk-","")];return {...row,speaker:person.speaker,voiceId:person.voiceId}}),
};
const inventory={
 schemaVersion:1,
 explanation:"Exact currently authored source pools. Quiz speech concatenates one regional approach, one category context and one regional question; the combinations are generated at runtime. Fixed NPC lines and their owners are in VOICE-CAST.json. Bürgeramt clerk and Kriminalpolizei phone dialogue from buergeramt-story.js are inventoried separately; additional call-status sentences in buergeramt.js remain context-dependent.",
 source:["game.js","buergeramt-story.js","buergeramt.js","For-AI/VOICE-CAST.json","For-AI/AUDIO-TEXT-LIBRARY.js"],
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
