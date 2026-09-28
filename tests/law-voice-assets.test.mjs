import assert from "node:assert/strict";
import {existsSync,readFileSync,statSync} from "node:fs";
import vm from "node:vm";

const game=readFileSync("game.js","utf8");
const context=vm.createContext({window:{}});
vm.runInContext(readFileSync("For-AI/AUDIO-TEXT-LIBRARY.js","utf8"),context);
const catalog=context.window.GermanySimulatorAudioText;

assert.equal(catalog.lawPowerLines.length,13,"every law quotation needs one recording");
assert.equal(catalog.rules.length,11,"every rotating rule needs one recording");
assert.equal(catalog.ruleEnglish.length,11,"every rule needs an English subtitle");
assert.match(game,/const lawPowerLines=speechCatalog\.lawPowerLines/);
assert.match(game,/const rules=speechCatalog\.rules/);
assert.match(game,/speechClip\(`law-\$\{/);
assert.match(game,/speechClip\(`rule-\$\{/);

for(const [family,lines] of [["law",catalog.lawPowerLines],["rule",catalog.rules.map(row=>row[1])]]){
 lines.forEach((text,index)=>{
  const id=`${family}-${String(index+1).padStart(2,"0")}`,clip=catalog.clips[id];
  assert.ok(clip,`missing catalog entry ${id}`);
  assert.equal(clip.text,text,`${id} must speak its displayed source`);
  assert.ok(clip.english?.trim(),`${id} needs an English subtitle`);
  const path=clip.path.slice(2);
  assert.ok(existsSync(path),`missing ${path}`);
  assert.ok(statSync(path).size>1_000,`empty ${path}`);
 });
}

console.log("Law and rotating-rule catalog IDs, source text, subtitles, and assets OK");
