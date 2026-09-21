import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const game=readFileSync("game.js","utf8");
const questionBlock=game.match(/const citizenshipQuestions=(\[[\s\S]*?\n\]);\s*const berlinCitizenshipQuestions/);
const approachBlock=game.match(/const quizApproaches=(\{[\s\S]*?\n\});\s*const violationPools/);
assert.ok(questionBlock&&approachBlock,"quiz pools must remain literal data");

const questions=Function(`return ${questionBlock[1]}`)(),approaches=Function(`return ${approachBlock[1]}`)();
assert.equal(questions.length,45);
assert.equal(questions.filter(question=>!question.type).length,35);
assert.equal(questions.filter(question=>question.type==="fahrschule").length,10);
assert.equal(new Set(questions.map(question=>question.source)).size,questions.length);
for(const question of questions){
 assert.equal(question.choices.length,4,`${question.source} needs four choices`);
 assert.ok(question.answer>=0&&question.answer<4,`${question.source} needs a valid answer`);
}
assert.equal(approaches.berlin.length,32);
assert.equal(approaches.germany.length,32);
assert.match(game,/isDriving\?"FIKTIVE SPIELFRAGE · "/);
assert.match(game,/isDriving\?"SPONTANE FAHRSCHUL-QUERPRÜFUNG"/);
assert.match(game,/if\(n===state\.quizApproach\).*?if\(d<78&&!stimulusBusy\(\)\).*?else if\(d>=78\)moveGroundResponder/s,"a quiz NPC must follow the moving player and wait for queued dialogue to clear before opening its modal");
console.log("Mixed civic/driving quiz and intrusive remark pools OK");
