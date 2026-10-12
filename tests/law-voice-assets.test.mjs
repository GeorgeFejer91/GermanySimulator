import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync,readFileSync,statSync} from "node:fs";
import vm from "node:vm";

const game=readFileSync("game.js","utf8");
const context=vm.createContext({window:{}});
vm.runInContext(readFileSync("For-AI/AUDIO-TEXT-LIBRARY.js","utf8"),context);
const catalog=context.window.GermanySimulatorAudioText;
const shortLawHashes=[
 "962a9b3087a088f1e4a75dc91a6aadbc5a64a07e40960b3a864bb7b0995888fc",
 "82efa5baccdafe48aee18bc16c3605012f7ac4d0cd50edb1bda46cba6febc170",
 "db4697d1a60ce3a2e2e519034b7954836cec15cfb18f61710b8516e65b4cd27e",
 "d2ad7fec3c61410fc4363b9da2559672dd230f459cc836aa52bc97b875d99c48",
 "119eed7314f1c7ce6fe7aa84f744fdcc93dbb73e170a2c807af4d1a3c6c3ba0c",
 "93a3e213ca7b0f55b27e969f6fac0caae598de8f5175a6964451c5ea62545188",
 "1a17a67092c78f220234793f49c4dd68b7c7d3c79217ec7e990de6fc0904ae4f",
 "2f4fe30624bf199939d422729f401a25936f4e5fd84a0918a185642d8ba085ff",
 "72f28cb393324904e1419cda854564d1c9facf8aa3a00c11ebb1a91cc87836a1",
 "22c21bfebb2ad0e10a927f7d8798b276e87a5eca18547c343913eda49144e4c4",
 "e7731cc24135ecaa5c42f09ef5d64e42b05ea70c1e6ef978519d84165eab55fb",
 "84660214cfd4e40c524b52865dbe5de1352f3f2fec15b5198e9958c5ecd6dd1c",
 "326eeda0019ec94c5418adf99f299be0c6d2fec24ab27e5d3ec336eb3f2097f0"
];

assert.equal(catalog.lawPowerLines.length,13,"every law quotation needs one recording");
assert.equal(shortLawHashes.length,catalog.lawPowerLines.length);
assert.equal(catalog.rules.length,11,"all authored rules retain stable encounter IDs");
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
  if(family==='rule'){
   assert.match(clip.voiceId,/^crowd-(waltraud-wartemarke|horst-hausordnung|dietmar-din-norm)$/);
   assert.equal(clip.trigger,'nearby-street-rule');
   assert.ok(!clip.path||clip.path.startsWith('./assets/voices/street-wisdom/'));
   if(!clip.recording){assert.equal(clip.path,undefined);return}
  }
  const path=clip.path.slice(2);
  assert.ok(existsSync(path),`missing ${path}`);
  assert.ok(statSync(path).size>1_000,`empty ${path}`);
  if(family==='law'){
   assert.equal(clip.source,text,`${id} must use the short spoken source`);
   assert.ok(!text.includes(':'),`${id} must stop before the paragraph body`);
   assert.ok(!clip.english.includes(':'),`${id} subtitle must stop with the audio`);
   assert.ok(statSync(path).size<90_000,`${id} must remain a short recording`);
   assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),shortLawHashes[index],`${id} must match the verified short cut`);
  }
 });
}

console.log("Law recordings and fixed street-rule IDs, owners, source text and subtitles OK");
