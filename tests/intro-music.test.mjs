import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync,readFileSync,statSync} from "node:fs";
import {dirname,join} from "node:path";
import {fileURLToPath} from "node:url";

const root=dirname(dirname(fileURLToPath(import.meta.url))),game=readFileSync(join(root,"game.js"),"utf8"),html=readFileSync(join(root,"index.html"),"utf8"),asset=join(root,"assets/intro-song.mp3");
assert.ok(existsSync(asset),"trimmed intro asset is missing");
assert.ok(statSync(asset).size>1_000_000,"trimmed intro asset is unexpectedly small");
assert.doesNotMatch(html,/rel="preload"[^>]+intro-song\.mp3/);
assert.match(game,/const INTRO_MUSIC_AUDIO="\.\/assets\/intro-song\.mp3"/);
assert.match(game,/new Audio\(INTRO_MUSIC_AUDIO\)/,"intro audio must preload at boot");
assert.match(game,/startMusic\(\);/,"intro playback must be attempted at page entry");
assert.match(game,/if\(event\)\{if\(!audio\)audio=new .*audio\.resume\(\)\}/,"first interaction must unlock the synthesized handoff");
assert.match(game,/if\(!introMusicFinished\)\{introMusicAudio\.play\(\)/,"finished intro must not replay");
assert.match(game,/MUSIC_UNLOCK_EVENTS=\["pointerdown","click","keydown"\]/,"music must retry across trusted user gestures");
assert.match(game,/introMusicAudio\.addEventListener\("playing",removeMusicUnlockListeners/,"music unlock retries must stop only after playback starts");
assert.doesNotMatch(game,/addEventListener\("(?:pointerdown|click|keydown)",startMusic,\{once:true/,"a rejected autoplay attempt must not consume the only retry");
assert.match(game,/introMusicAudio\.onplay=.*NOW PLAYING · INTRO SONG/,"UI must confirm actual intro playback");
assert.match(game,/introMusicAudio\.onerror=.*introMusicFinished=true/,"missing intro audio must not block the regular soundtrack");
assert.match(game,/introMusicAudio\.onended=.*startMusic\(\)/,"synthesized playlist must follow the intro");
assert.match(game,/eightBitTracksSinceSong>=3\)\{playSungMusic\(\)/,"one sung recording must follow every three 8-bit arrangements");
assert.match(game,/musicTimer=setTimeout\(schedulePlaylistItem,Math\.max\(100,\(t-audio\.currentTime\+\.03\)\*1000\)\)/,"the next track must be scheduled after the current theme ends");
assert.doesNotMatch(game,/t-audio\.currentTime-\.12/,"background themes must not overlap at handoff");
const songs=[
 ["badnerlied.mp3",2_552_876,"b4f14adce37dc7905a72d3510d7330875eab02cb92ffd92cff7cd9c629d01346"],
 ["erika.mp3",3_311_273,"af2d8b14a91c47fd71a3215380a188a4e14d543b8ac996614cc94957c66baeb1"],
 ["saargebiet.mp3",2_954_190,"51d3600948e39c3772b9453544b043ae33355d85bc3eefd095768e57e88d3e18"]
];
for(const [name,size,hash] of songs){
 const path=join(root,"assets","audio","music","sung",name),data=readFileSync(path);
 assert.equal(statSync(path).size,size,`${name} size drifted`);
 assert.equal(createHash("sha256").update(data).digest("hex"),hash,`${name} checksum drifted`);
}
console.log("Intro music handoff contract OK");
