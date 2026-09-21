import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync,readFileSync,statSync} from "node:fs";
import {dirname,join} from "node:path";
import {fileURLToPath} from "node:url";

const root=dirname(dirname(fileURLToPath(import.meta.url))),game=readFileSync(join(root,"game.js"),"utf8"),asset=join(root,"assets/audio/music/wurst.mp3");
assert.ok(existsSync(asset),"sausage milestone song is missing");
assert.ok(statSync(asset).size>4_000_000,"sausage milestone song is unexpectedly small");
assert.equal(createHash("sha256").update(readFileSync(asset)).digest("hex"),"34078bd5b197b460e88245b1de7d952b49fe99909a1a8a74959b9a88258d7132","normalized sausage song checksum drifted");
assert.match(game,/WURST_MUSIC=.*\.\/assets\/audio\/music\/wurst\.mp3/);
assert.match(game,/state\.wurstBadges\.size===Math\.ceil\(WURST_IDS\.length\/2\)\)queueWurstSong\(\)/,"the fifth of nine unique sausages must trigger the song");
assert.match(game,/function queueWurstSong\(\)\{if\(wurstSongPlayed\|\|wurstSongPending\)return/,"the milestone song must queue only once");
assert.match(game,/if\(wurstSongPending\)\{playWurstSong\(\);return\}/,"a muted milestone song must wait for music to be enabled");
console.log("Sausage milestone music contract OK");
