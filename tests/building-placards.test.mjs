import assert from "node:assert/strict";
import {readFileSync,readdirSync,statSync} from "node:fs";
import buildingData from '../building-catalogue.js';

const root=new URL("../",import.meta.url);
const ids=buildingData.catalogue.filter(building=>!building.residential).map(building=>building.id);
assert.match(readFileSync(new URL("world3d.js",root),"utf8"),/if\(b\.residential\)\{residentialBuilding\(b\);return\}/,"residential houses own procedural signs rather than municipal image requests");
const directory=new URL("assets/building-placards/",root);
const files=readdirSync(directory).filter(name=>name.endsWith(".webp"));
const world=readFileSync(new URL("world3d.js",root),"utf8");
assert.match(world,/if\(b.id==="jobcenter"\)\{\s*const built=createJobcenterBuilding/,"Jobcenter owns its reference-specific procedural sign");
assert.match(readFileSync(new URL("jobcenter.js",root),"utf8"),/ctx\.fillText\('jobcenter'/,"Jobcenter sign is painted locally");
for(const id of ids.filter(id=>id!=="jobcenter"))assert.ok(files.includes(`${id}.webp`),`${id} has no placard`);
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
