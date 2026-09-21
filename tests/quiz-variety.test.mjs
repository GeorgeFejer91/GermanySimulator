import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const game=readFileSync("game.js","utf8");
const questionBlock=game.match(/const citizenshipQuestions=(\[[\s\S]*?\n\]);\s*const berlinCitizenshipQuestions/);
const approachBlock=game.match(/const quizApproaches=(\{[\s\S]*?\n\});\s*const violationPools/);
assert.ok(questionBlock&&approachBlock,"quiz pools must remain literal data");

const questions=Function(`return ${questionBlock[1]}`)(),approaches=Function(`return ${approachBlock[1]}`)();
assert.equal(questions.length,73);
assert.equal(questions.filter(question=>!question.type).length,35);
assert.equal(questions.filter(question=>question.type==="fahrschule").length,10);
assert.equal(questions.filter(question=>question.type==="grammar"&&question.level==="B1").length,10);
assert.equal(questions.filter(question=>question.type==="grammar"&&question.level==="B2").length,10);
assert.equal(questions.filter(question=>question.type==="grammar"&&question.level==="C1").length,8);
assert.equal(new Set(questions.map(question=>question.source)).size,questions.length);
for(const question of questions){
 assert.equal(question.choices.length,4,`${question.source} needs four choices`);
 assert.ok(question.answer>=0&&question.answer<4,`${question.source} needs a valid answer`);
}
assert.equal(approaches.berlin.length,32);
assert.equal(approaches.germany.length,32);
assert.ok(questions.some(question=>question.source==="G-B2-10"&&question.choices[question.answer]==="B3"),"the fictional B3 trap must clarify that GER has no B3 level");
assert.match(game,/isDriving\?"FIKTIVE SPIELFRAGE · "/);
assert.match(game,/isDriving\?"SPONTANE FAHRSCHUL-QUERPRÜFUNG":isGrammar\?"SPONTANE "/);
assert.match(game,/ZERTIFIKATSNAHE SPIELÜBUNG · KEIN ECHTER PRÜFUNGSSATZ/);
assert.match(game,/§ 10 Absatz 4 StAG nennt grundsätzlich B1/);
assert.match(game,/if\(n===state\.quizApproach\).*?n\.quizFollowTime>QUIZ_FOLLOW_MAX_SECONDS\|\|d>QUIZ_FOLLOW_BREAK_DISTANCE.*?if\(d<78&&!stimulusBusy\(\)\).*?else if\(d>=78\)moveGroundResponder/s,"a quiz NPC must briefly follow, lose interest by time or distance, and wait for queued dialogue before opening its modal");
console.log("Mixed civic/driving quiz and intrusive remark pools OK");
