import assert from "node:assert/strict";
import vm from "node:vm";
import {existsSync,readFileSync,statSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
const source=readFileSync(join(root,"For-AI/QUIZ-CHARACTER-DICTIONARY.js"),"utf8"),context=vm.createContext({window:{}});
vm.runInContext(source,context,{filename:"QUIZ-CHARACTER-DICTIONARY.js"});
const library=context.window.GermanySimulatorQuizCharacters,game=readFileSync(join(root,"game.js"),"utf8"),html=readFileSync(join(root,"index.html"),"utf8"),css=readFileSync(join(root,"styles.css"),"utf8"),layout=readFileSync(join(root,"quiz-layout.js"),"utf8");

assert.equal(library.version,2);
assert.equal(library.characters.length,9);
assert.ok(library.archetypeLexicon.length>=40,"the affectionate Gutbürger vocabulary is too small");
assert.ok(library.nameBank.given.length>=20&&library.nameBank.family.length>=20,"the authoring name bank is too small");
assert.equal(new Set(library.characters.map(person=>person.id)).size,library.characters.length);
assert.equal(library.characters.find(person=>person.id==="hartmut-keller")?.title,"PARA-POLIZEILICHER NACHBAR");
for(const person of library.characters){
 assert.ok(person.name&&person.title&&person.office&&person.authority&&person.specialty,`${person.id} needs a complete dossier`);
 assert.ok(person.categories.length,`${person.id} needs at least one quiz category`);
 const portrait=join(root,person.portrait.replace(/^\.\//,""));
 assert.ok(existsSync(portrait),`${person.id} portrait is missing`);
 assert.ok(statSync(portrait).size<60000,`${person.id} portrait is too heavy for the shared mobile asset set`);
}
for(const category of ["civic","traffic","grammar-b1","grammar-b2","grammar-c1"])assert.ok(library.characters.some(person=>person.categories.includes(category)),`${category} has no eligible character`);
assert.ok(html.indexOf("QUIZ-CHARACTER-DICTIONARY.js")<html.indexOf("game.js"),"the character dictionary must load before the runtime");
for(const id of ["quiz-portrait","quiz-person-name","quiz-person-title","quiz-prompt","quiz-source"])assert.match(html,new RegExp(`id="${id}"`));
assert.doesNotMatch(html,/quiz-person-office|quiz-person-authority|quiz-person-specialty|quiz-context/,"the speaker's line should lead the quiz card");
assert.match(css,/\.quiz-card\{[^}]*grid-template-columns:160px minmax\(0,1fr\)/,"desktop quiz needs a compact portrait column");
assert.match(css,/@media\(max-width:760px\)\{[\s\S]*\.quiz-card\{grid-template-columns:1fr/,"mobile quiz must stack the portrait above the question");
// The visible dossier belongs to the physical actor, rather than a random person
// selected for the question category. Execute the actual selector and renderer.
const nodes=new Map(),node=id=>{
 if(!nodes.has(id))nodes.set(id,{textContent:"",classList:{remove(){},add(){}},removeAttribute(name){delete this[name]}});
 return nodes.get(id);
};
context.document={getElementById:node,querySelector:()=>node("portrait-frame")};
const productionFunction=(start,end)=>{
 const first=game.indexOf(start),last=game.indexOf(end,first);
 assert.ok(first>=0&&last>first,"production function boundaries: "+start);
 return game.slice(first,last);
};
vm.runInContext("const quizCharacterLibrary=window.GermanySimulatorQuizCharacters;"+
 productionFunction("function quizCharacterForActor(","const quizApproaches=")+
 productionFunction("function showQuizPerson(","function startCitizenshipQuiz("),context);
for(const person of library.characters){
 const actor={quizCharacterId:person.id,voiceId:person.voiceId,name:"the actor's label cannot select another dossier"};
 assert.equal(context.quizCharacterForActor(actor),person,person.id+" keeps its fixed identity");
 context.showQuizPerson(context.quizCharacterForActor(actor));
 assert.equal(node("quiz-portrait").src,person.portrait);
 assert.equal(node("quiz-portrait").alt,person.alt||person.name);
 assert.equal(node("quiz-person-name").textContent,person.name);
 assert.equal(node("quiz-person-title").textContent,person.title);
 assert.equal(context.quizCharacterForActor({...actor,voiceId:library.characters.find(other=>other.id!==person.id).voiceId}),null,"a foreign voice cannot borrow "+person.id+"'s portrait");
}
assert.equal(context.quizCharacterForActor({quizCharacterId:"unknown",voiceId:library.characters[0].voiceId}),null);
assert.equal(context.quizCharacterForActor(null),null);
assert.match(game,/showQuizPerson\(character\)/);
assert.match(game,/voiceKey:character\.name/);
assert.match(layout,/prepareWithSegments[\s\S]*measureLineStats/,"quiz dialogue and choices need measured text geometry");
console.log("Quiz character dictionary, local portraits, and dialogue-first UI OK");
