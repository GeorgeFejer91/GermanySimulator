import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const game=readFileSync("game.js","utf8"),html=readFileSync("index.html","utf8"),styles=readFileSync("styles.css","utf8");
assert.match(game,/function startGame\(skipHumor=false\)/);
assert.match(game,/if\(skipHumor\)\{finishHumorCertification\(\);return\}/);
assert.match(game,/e\.code==="KeyS"&&!state\.started&&!document\.getElementById\("intro"\)\.classList\.contains\("hidden"\)/);
assert.match(html,/<b><span id="simulator-s">S<\/span>IMULATOR<\/b>/);
assert.match(game,/document\.getElementById\("simulator-s"\)\.onclick=\(\)=>startGame\(true\)/);
assert.match(styles,/#simulator-s\{text-shadow:4px 3px 0 #a4222b\}/,"the title-screen S needs its offset red duplicate");
assert.doesNotMatch(html,/skip/i,"the title screen must not reveal the questionnaire shortcut");
console.log("Secret title-screen questionnaire skip contract OK");
