import assert from "node:assert/strict";
import {existsSync,readFileSync,statSync} from "node:fs";
import {dirname,join} from "node:path";
import {fileURLToPath} from "node:url";

const root=dirname(dirname(fileURLToPath(import.meta.url))),game=readFileSync(join(root,"game.js"),"utf8"),html=readFileSync(join(root,"index.html"),"utf8"),asset=join(root,"assets/intro-song.mp3");
assert.ok(existsSync(asset),"trimmed intro asset is missing");
assert.ok(statSync(asset).size>1_000_000,"trimmed intro asset is unexpectedly small");
assert.doesNotMatch(html,/rel="preload"[^>]+intro-song\.mp3/);
assert.match(game,/const INTRO_MUSIC_AUDIO="\.\/assets\/intro-song\.mp3"/);
assert.match(game,/const introMusicData=fetch\(INTRO_MUSIC_AUDIO\)/,"intro bytes must begin loading at boot");
assert.match(game,/if\(introMusicPlayed\)\{scheduleTheme\(\);return\}/,"intro must not replay");
assert.match(game,/source\.onended=.*scheduleTheme\(\)/,"synthesized playlist must follow the intro");
console.log("Intro music handoff contract OK");
