import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,statSync} from "node:fs";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const diagnostic=readFileSync(new URL("../3d.html",import.meta.url),"utf8");
const renderer=readFileSync(new URL("../world3d.js",import.meta.url),"utf8");
const license=readFileSync(new URL("../assets/models/bundestag/LICENSES.md",import.meta.url),"utf8");
const modelUrl=new URL("../assets/models/bundestag/bundestag.glb",import.meta.url);
const model=readFileSync(modelUrl);

assert.match(game,/id:"bundestag".*x:7800,y:3370,w:920,h:420.*doorX:8260,doorY:3820/,"the Bundestag must occupy the vacant southeast Berlin parcel");
assert.match(diagnostic,/id:"bundestag".*x:7800,y:3370,w:920,h:420/,"the direct 3D diagnostic must mirror the landmark placement");
assert.match(renderer,/bundestag:"\.\/assets\/models\/bundestag\/bundestag\.glb"/,"the WebGL renderer must use the local landmark GLB");
const size=statSync(modelUrl).size;
assert.ok(size>10_000&&size<250_000,"the local model must be present and remain lightweight");
assert.match(license,new RegExp(createHash("sha256").update(model).digest("hex"),"i"),"the model checksum must match its provenance record");

console.log("bundestag-model.test.mjs passed");
