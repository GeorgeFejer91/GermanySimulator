import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {zstdDecompressSync} from "node:zlib";

const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root));
const manifest = JSON.parse(read("assets/models/german-props/manifest.json"));
const expected = ["reserved-lounger-blue", "reserved-lounger-red", "garden-gnome-watering",
  "garden-gnome-placard", "sandal-shop", "sock-shop", "krugers-kugellager", "beer-crate",
  "allotment-wheelbarrow", "recycling-containers", "allotment-picnic-table"];
assert.deepEqual(Object.keys(manifest.models).sort(), expected.sort());
const blend = read("assets/models/german-props/german-props.blend");
assert.equal((blend.readUInt32LE(0) === 0xfd2fb528 ? zstdDecompressSync(blend) : blend).subarray(0, 7).toString(), "BLENDER");
let total = 0;
for (const [name, item] of Object.entries(manifest.models)) {
  const bytes = read(`assets/models/german-props/${name}.glb`);
  assert.equal(bytes.readUInt32LE(0), 0x46546c67, name);
  assert.equal(bytes.readUInt32LE(8), bytes.length, name);
  assert.equal(bytes.length, item.bytes, name);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), item.sha256, name);
  assert.ok(bytes.length < 800_000, `${name} transfer budget`);
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString().trim());
  assert.equal(gltf.asset.version, "2.0");
  assert.ok(!gltf.buffers?.[0]?.uri && !gltf.images?.length && !gltf.textures?.length,
    `${name} must be local and texture-free`);
  assert.ok(!gltf.extensionsRequired?.length, `${name} must load without a decoder`);
  assert.ok(gltf.meshes?.length > 0 && gltf.meshes.length <= 14, `${name} draw-call budget`);
  assert.ok(item.dimensions_xyz.every(n => Number.isFinite(n) && n > .05 && n < 10));
  total += bytes.length;
}
assert.equal(total, manifest.total_glb_bytes);
assert.ok(total < 1_300_000, "complete addition stays below 1.3 MB");

const game = read("game.js").toString(), renderer = read("world3d.js").toString();
for (const name of expected) assert.ok(renderer.includes(`germanPropUrl("${name}")`) || renderer.includes(`german-props/${name}.glb`), `${name} referenced by game renderer`);
const aliases = {"liege-blau": 3, "liege-rot": 3, "zwerg-giesskanne": 3,
  "zwerg-schild": 3, bierkasten: 2, schubkarre: 1, wertstoffcontainer: 2, picknicktisch: 1};
const placed = [...game.matchAll(/\{x:(\d+),y:(\d+),asset:"([^"]+)",w:(\d+),h:(\d+)(?:,turn:-?(?:\d+)?(?:\.\d+)?)?\}/g)]
  .map(([,x,y,asset,w,h]) => ({x:+x,y:+y,asset,w:+w,h:+h}))
  .filter(p => Object.hasOwn(aliases, p.asset));
for (const [alias, count] of Object.entries(aliases))
  assert.equal(placed.filter(p => p.asset === alias).length, count, `${alias} placement count`);
const buildingSection = game.split("const buildings=[")[1].split("].map(building=>")[0];
const buildings = [...buildingSection.matchAll(/\{id:"([^"]+)"[^\n]*?x:(\d+),y:(\d+),w:(\d+),h:(\d+)/g)]
  .map(([,id,x,y,w,h]) => ({id,x:+x,y:+y,w:+w,h:+h}));
assert.ok(buildings.some(b => b.id === "sandalenladen") && buildings.some(b => b.id === "sockenladen"));
const roads = [{x:0,y:820,w:9840,h:260},{x:0,y:2000,w:9840,h:240},{x:0,y:3000,w:9840,h:220},
  ...[[1050,260],[2400,220],[4400,180],[5850,220],[7350,220],[9000,180]]
    .map(([x,w]) => ({x,y:0,w,h:4240}))];
const rectDistance = (x,y,r) => Math.hypot(Math.max(r.x-x,0,x-r.x-r.w), Math.max(r.y-y,0,y-r.y-r.h));
const [,parkX,parkY,parkW,parkH] = read("goerlitzer-park.js").toString()
  .match(/x:(\d+)\+560,y:(\d+)\+560,w:(\d+),h:(\d+)/);
const park = {x:+parkX,y:+parkY,w:+parkW,h:+parkH};
for (const p of placed) {
  const radius = Math.min(p.w,p.h)*.38;
  for (const b of buildings) assert.ok(rectDistance(p.x,p.y,b) > radius,
    `${p.asset} at ${p.x},${p.y} must stay clear of ${b.id}`);
  for (const road of roads) assert.ok(rectDistance(p.x,p.y,road) > radius,
    `${p.asset} at ${p.x},${p.y} must stay off the road`);
  assert.ok(rectDistance(p.x,p.y,park) > radius, `${p.asset} must stay outside fenced Görlitzer Park`);
}
for (const shop of buildings.filter(b => ["sandalenladen", "sockenladen"].includes(b.id)))
  { for (const road of roads) assert.ok(rectDistance(shop.x + shop.w/2, shop.y + shop.h/2, road) > 0);
    assert.ok(rectDistance(shop.x + shop.w/2, shop.y + shop.h/2, park) > shop.w/2);
  }
console.log(`German props: ${expected.length} valid GLBs, ${placed.length} clear placements, adjacent retail pair`);
