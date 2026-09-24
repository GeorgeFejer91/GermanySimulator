import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync,readFileSync,statSync} from "node:fs";
import {dirname,join} from "node:path";
import {fileURLToPath} from "node:url";
import vm from "node:vm";

const root=dirname(dirname(fileURLToPath(import.meta.url))),game=readFileSync(join(root,"game.js"),"utf8"),asset=join(root,"assets/audio/music/wurst.mp3");
assert.ok(existsSync(asset),"sausage milestone song is missing");
assert.ok(statSync(asset).size>4_000_000,"sausage milestone song is unexpectedly small");
assert.equal(createHash("sha256").update(readFileSync(asset)).digest("hex"),"34078bd5b197b460e88245b1de7d952b49fe99909a1a8a74959b9a88258d7132","normalized sausage song checksum drifted");
assert.match(game,/WURST_MUSIC=.*\.\/assets\/audio\/music\/wurst\.mp3/);
assert.match(game,/state\.wurstBadges\.size===Math\.ceil\(WURST_IDS\.length\/2\)\)queueWurstSong\(\)/,"the fifth of nine unique sausages must trigger the song");
assert.match(game,/function queueWurstSong\(\)\{if\(wurstSongPlayed\|\|wurstSongPending\)return/,"the milestone song must queue only once");
assert.match(game,/if\(wurstSongPending\)\{playWurstSong\(\);return\}/,"a muted milestone song must wait for music to be enabled");
const sungSource=game.match(/function playSungMusic\([^\n]+/)?.[0];
assert.ok(sungSource,"sung playback must exist");
let confirmPlayback;
const playback=new Promise(resolve=>confirmPlayback=resolve);
const context=vm.createContext({document:{getElementById:()=>({})},Promise,rampSungVolume:()=>{},audioTextActive:()=>false,nextVariant:()=>0});
context.playback=playback;
vm.runInContext(`
 let musicPlaybackSerial=0,sungMusicActive=false,eightBitTracksSinceSong=0,musicDucked=false,wurstSongPending=true,wurstSongPlayed=false,wurstTransitioning=true;
 const WURST_MUSIC={title:"Wurst",src:"wurst.mp3"},SUNG_MUSIC=[WURST_MUSIC],SUNG_MUSIC_PLAYLIST=[0],AUDIO_MIX={BACKGROUND:.22},SUNG_MUSIC_LEVEL=.7;
 const sungMusicAudio={src:"",volume:0,play:()=>globalThis.playback};
 function finishSungMusic(){}
 ${sungSource}
 globalThis.check=()=>({pending:wurstSongPending,played:wurstSongPlayed});
 playSungMusic(WURST_MUSIC);
`,context);
assert.deepEqual({...context.check()},{pending:true,played:false},"the milestone must remain pending before playback starts");
confirmPlayback();
await playback;
await Promise.resolve();
assert.deepEqual({...context.check()},{pending:false,played:true},"the milestone must count only after playback starts");
console.log("Sausage milestone music contract OK");
