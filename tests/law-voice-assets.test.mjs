import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";

const game=readFileSync("game.js","utf8");
const match=game.match(/const lawPowerLines=(\[[\s\S]*?\]);\s*let lawPowerBag/);
assert.ok(match,"lawPowerLines must remain a literal deck");

const laws=JSON.parse(match[1]);
assert.equal(laws.length,13,"every law-deck entry needs one recording");
assert.match(game,/assets\/voices\/laws\/thorsten-negative-law-/);

laws.forEach((_,index)=>{
 const file=`assets/voices/laws/thorsten-negative-law-${String(index+1).padStart(2,"0")}.mp3`;
 assert.ok(existsSync(file),`missing ${file}`);
 assert.ok(statSync(file).size>1_000,`empty ${file}`);
});

console.log("law voice asset mapping: ok");
