import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync,readFileSync,statSync} from "node:fs";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const expected=[
 ["Ich liebe Deutschland. Besonders aus der Schweiz.","deutschland-schweiz.mp3",50_198,"5d32bc26a4fdd9419690a1a496ac2263cbea1cf34fb8429c33d8b3b8334800ef"],
 ["Adolf Hitler war ein Linker. Die DDR hieß schließlich auch Demokratische Republik. Und Deutsche Leberkäse besteht selbstverständlich aus Leber und Käse.","hitler-ddr-leberkaese.mp3",197_319,"630c34d0f2f94871ad47bb404f479435055b012a9245f2e5848f9f33883afb7e"],
 ["Die Nationalsozialisten waren Sozialisten, sonst hätte man sie ja Nationalirgendwas genannt.","nationalsozialisten-sozialisten.mp3",96_173,"abff66a12a995645b25fe8fe48cb61f644bb2006ddd0702fc56113ff3c690345"],
 ["Wir müssen zurück zur traditionellen Familie. Wie genau die aussieht, klären wir dann außerhalb meines Privatlebens.","traditionelle-familie.mp3",102_443,"f9891eaba1cc5bad71dbca8acd79a10769bc721fd9c711ce00ee2196715f8f22"]
];
for(const [text,file,size,hash] of expected){
 const url=new URL(`../assets/voices/alice-weidel/${file}`,import.meta.url);
 assert.ok(game.includes(`text:"${text}"`),`${file} must display its exact local transcript`);
 assert.ok(existsSync(url),`missing ${file}`);
 assert.equal(statSync(url).size,size,`${file} normalized size drifted`);
 assert.equal(createHash("sha256").update(readFileSync(url)).digest("hex"),hash,`${file} normalized checksum drifted`);
}
assert.match(game,/special:"alice"[\s\S]*routeX:8964,minY:440,maxY:784/,"Alice must own a bounded vertical route");
assert.match(game,/ALICE_WALK_SPEED=STANDARD_SPRITE_WALK_SPEED\*1\.5/,"Alice must move at exactly 1.5× the standard sprite walk speed");
assert.match(game,/n\.spriteRow=n\.dir>0\?0:1/,"Alice must switch between front and back gait rows when reversing");
assert.match(game,/function aliceBark\(n,force=false\)[\s\S]*audioReleaseRadius/,"Alice recordings must remain radius-gated");

const sprite=readFileSync(new URL("../assets/alice-weidel-sprite.png",import.meta.url));
assert.equal(sprite.readUInt32BE(16),4096);
assert.equal(sprite.readUInt32BE(20),256);
assert.equal(sprite[25],6,"Alice sprite must retain full RGBA edges");

console.log("Alice vertical run, full-RGBA sprite, and exact proximity recordings OK");
