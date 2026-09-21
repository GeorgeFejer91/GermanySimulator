import assert from "node:assert/strict";
import vm from "node:vm";
import {existsSync,readFileSync,statSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
const source=readFileSync(join(root,"For-AI/QUIZ-CHARACTER-DICTIONARY.js"),"utf8"),context=vm.createContext({window:{}});
vm.runInContext(source,context,{filename:"QUIZ-CHARACTER-DICTIONARY.js"});
const library=context.window.GermanySimulatorQuizCharacters,game=readFileSync(join(root,"game.js"),"utf8"),html=readFileSync(join(root,"index.html"),"utf8"),css=readFileSync(join(root,"styles.css"),"utf8");

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
for(const id of ["quiz-portrait","quiz-person-name","quiz-person-title","quiz-person-office","quiz-person-authority","quiz-person-specialty","quiz-context"])assert.match(html,new RegExp(`id="${id}"`));
assert.match(css,/\.quiz-card\{[^}]*grid-template-columns:220px minmax\(0,1fr\)/,"desktop quiz needs a left dossier column");
assert.match(css,/@media\(max-width:760px\)\{[\s\S]*\.quiz-card\{grid-template-columns:1fr/,"mobile quiz must stack the dossier above the question");
assert.match(game,/function nextQuizCharacter\(category\)/);
assert.match(game,/showQuizPerson\(character\)/);
assert.match(game,/voiceKey:character\.name/);
console.log("Quiz character dictionary, local portraits, and responsive dossier UI OK");
