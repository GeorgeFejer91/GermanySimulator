import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const diagnostic=readFileSync(new URL("../3d.html",import.meta.url),"utf8");
const renderer=readFileSync(new URL("../world3d.js",import.meta.url),"utf8");
const coachLicense=readFileSync(new URL("../assets/models/open-l-gauge-nwagen/LICENSES.md",import.meta.url),"utf8");
const coachStat=statSync(new URL("../assets/models/open-l-gauge-nwagen/n-wagen-coach.glb",import.meta.url));
const announcementFiles=["ice-0815-buxtehude-bahnhofshalle-subtle.mp3","ice-0815-marktversagen-bahnhofshalle-subtle.mp3","ice-0815-stalingrad-bahnhofshalle-subtle.mp3","ice-ardorf-hilter-bahnhofshalle-subtle.mp3","ice-96-oberkaka-bahnhofshalle-subtle.mp3"];

assert.match(game,/TRAIN_CAR_OFFSETS=\[780,520,260,0,-260,-520,-780\]/,"perimeter trains must remain single full-length seven-car consists");
assert.match(game,/CITY=\{w:9840,h:4240\},RAIL_GUTTER=560,WORLD=\{w:CITY\.w\+RAIL_GUTTER\*2,h:CITY\.h\+RAIL_GUTTER\*2\}/,"the playable world must add a full rail-clearance gutter around the city");
assert.match(game,/makeRailLoop\("aussenring",72,720,1\),makeRailLoop\("innenring",232,560,-1\)/,"full-length coaches need broad concentric corner radii");
assert.match(game,/TRAIN_CAR_HALF_LENGTH=112,TRAIN_CAR_HALF_WIDTH=46,TRAIN_MIN_GAP=1820,TRAIN_PLAYER_STOP_GAP=910/,"long consists need matching solid bodies, a hard no-passing center gap, and a player-stop envelope");
assert.match(game,/\[0,\.03,1,188,94\].*\[0,\.19,-1,252,132\].*\[1,\.87,1,214,112\]/s,"both tracks must start with six alternating, independently tuned trains");
assert.match(game,/orientation:seed\[2\].*acceleration:seed\[4\]/s,"physical consist orientation must be decoupled from reversible movement and every train must own its acceleration");
assert.match(game,/function signedRailSeparation\(/,"same-track collision must use circular signed separation");
assert.match(game,/factor=closure>0\?clamp\(available\/closure,0,1\):0;a\.motion\*=factor;b\.motion\*=factor/,"both trains must clamp to their shared no-overlap contact gap");
assert.match(game,/train\.bouncePause=TRAIN_BOUNCE_PAUSE;train\.reversePending=true/,"a contact must stop both trains for the bounce pause");
assert.match(game,/train\.dir\*=-1;train\.reversePending=false;train\.speed=0/,"a stopped collision pair must restart in the opposite direction");
assert.match(game,/rate=target<train\.speed\?train\.acceleration\*3\.2:train\.acceleration/,"each train must apply its own acceleration constant");
assert.match(game,/function trainCarDistance\(/,"long coaches need oriented body collision instead of point-radius collision");
assert.match(game,/event<\.55.*train\.pause=1\.4\+Math\.random\(\)\*4\.8/,"trains must stop unpredictably often enough to disrupt both loops");
assert.match(game,/railHoldAnnouncementTimer>4\.5/,"holding up a train must trigger a dedicated long-form announcement");
assert.match(game,/TRAIN_ANNOUNCEMENT_AUDIO=\[/,"the supplied recordings must replace generated train speech");
assert.match(game,/function updateTrainAnnouncement\(\).*playTrainAnnouncement\(nearest\)/s,"nearby trains must trigger the local recordings");
assert.doesNotMatch(game,/nextTrainAnnouncement/,"recorded train announcements must not create or display generated announcement text");
assert.match(diagnostic,/carOffsets=\[780,520,260,0,-260,-520,-780\]/,"the direct 3D diagnostic must mirror the full-length seven-car articulation contract");
assert.match(diagnostic,/RAIL_GUTTER=560/,"the direct 3D diagnostic must mirror the perimeter clearance");
assert.match(diagnostic,/function updateDiagnosticTrains\(dt\)/,"the direct 3D diagnostic must mirror the stop, bump, and reversal protocol");
assert.match(renderer,/open-l-gauge-nwagen\/n-wagen-coach\.glb/,"the five middle coaches must use the local German n-Wagen asset");
assert.match(renderer,/sourceIndex===1\?\{x:1\.12,y:1\.28,z:4\.82\}/,"the German passenger coaches must be fitted as full-length cars");
assert.ok(coachStat.size>100000,"the licensed n-Wagen GLB must be present locally");
assert.match(coachLicense,/DennisAkaTECHNO/);
assert.match(coachLicense,/CC BY-NC-SA 4\.0/);
for(const file of announcementFiles)assert.ok(statSync(new URL(`../assets/audio/trains/${file}`,import.meta.url)).size>1_000_000,`${file} must be bundled as a complete local recording`);

console.log("train-consists.test.mjs passed");
