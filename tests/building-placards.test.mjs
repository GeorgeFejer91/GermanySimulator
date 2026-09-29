import assert from "node:assert/strict";
import {readFileSync,readdirSync,statSync} from "node:fs";

const root=new URL("../",import.meta.url),game=readFileSync(new URL("game.js",root),"utf8");
const buildingSection=game.split("const buildings=[")[1].split("].map(building=>")[0];
const ids=[...buildingSection.matchAll(/^\{id:"([^"]+)"/gm)].map(match=>match[1]);
const directory=new URL("assets/building-placards/",root);
const files=readdirSync(directory).filter(name=>name.endsWith(".webp"));
for(const id of ids)assert.ok(files.includes(`${id}.webp`),`${id} has no placard`);
assert.equal(files.length,new Set(files).size,"placard filenames must be unique");
let bytes=0;
for(const file of files){
  const path=new URL(file,directory),image=readFileSync(path);
  assert.equal(image.toString("ascii",0,4),"RIFF",file);
  assert.equal(image.toString("ascii",8,12),"WEBP",file);
  assert.ok(image.length<60_000,`${file} exceeds the mobile transfer budget`);
  bytes+=image.length;
}
assert.ok(bytes<1_000_000,"placard set exceeds the shared desktop/mobile transfer budget");
assert.ok(statSync(new URL("assets/fonts/grenze/Grenze.ttf",root)).size<200_000);
console.log(`${ids.length} building placards, ${(bytes/1024).toFixed(1)} KiB total`);
