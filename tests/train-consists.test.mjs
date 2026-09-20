import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
const diagnostic=readFileSync(new URL("../3d.html",import.meta.url),"utf8");
const renderer=readFileSync(new URL("../world3d.js",import.meta.url),"utf8");
const coachLicense=readFileSync(new URL("../assets/models/open-l-gauge-nwagen/LICENSES.md",import.meta.url),"utf8");
const coachStat=statSync(new URL("../assets/models/open-l-gauge-nwagen/n-wagen-coach.glb",import.meta.url));

assert.match(game,/TRAIN_CAR_OFFSETS=\[780,520,260,0,-260,-520,-780\]/,"perimeter trains must remain single full-length seven-car consists");
assert.match(game,/WORLD=\{w:9840,h:4240\}/,"the rail perimeter should wrap a slightly expanded world");
assert.match(game,/makeRailLoop\("aussenring",64,600,1\),makeRailLoop\("innenring",184,480,-1\)/,"full-length coaches need broad concentric corner radii");
assert.match(game,/TRAIN_CAR_HALF_LENGTH=112,TRAIN_CAR_HALF_WIDTH=46,TRAIN_MIN_GAP=1820,TRAIN_PLAYER_STOP_GAP=910/,"long consists need matching solid bodies, a hard no-passing center gap, and a player-stop envelope");
assert.match(game,/\[0,\.04,1,184,94\].*\[0,\.29,-1,244,132\]/s,"trains on one loop must start with distinct speeds, acceleration constants, and opposing directions");
assert.match(game,/orientation:seed\[2\].*acceleration:seed\[4\]/s,"physical consist orientation must be decoupled from reversible movement and every train must own its acceleration");
assert.match(game,/function signedRailSeparation\(/,"same-track collision must use circular signed separation");
assert.match(game,/factor=closure>0\?clamp\(available\/closure,0,1\):0;a\.motion\*=factor;b\.motion\*=factor/,"both trains must clamp to their shared no-overlap contact gap");
assert.match(game,/train\.bouncePause=TRAIN_BOUNCE_PAUSE;train\.reversePending=true/,"a contact must stop both trains for the bounce pause");
assert.match(game,/train\.dir\*=-1;train\.reversePending=false;train\.speed=0/,"a stopped collision pair must restart in the opposite direction");
assert.match(game,/rate=target<train\.speed\?train\.acceleration\*3\.2:train\.acceleration/,"each train must apply its own acceleration constant");
assert.match(game,/function trainCarDistance\(/,"long coaches need oriented body collision instead of point-radius collision");
assert.match(game,/train\.incidentReason=communityTrainExcuses/,"unscheduled pauses must select a community-derived fictionalized cause");
assert.match(game,/train\?\.blockedByPlayer\?playerTrainExcuse:train\?\.incidentReason\|\|\(train\?\.queued\?queuedTrainExcuse:""\)/,"announcements must prefer player obstruction, collision, or unexplained-stop state");
assert.match(game,/collisionTrainExcuse=/,"train-on-train reversals need their own monotonous delay explanation");
assert.match(game,/railHoldAnnouncementTimer>4\.5/,"holding up a train must trigger a dedicated long-form announcement");
assert.match(game,/COMMUNITY-ANEKDOTE · FIKTIONALISIERT/,"community reports must remain explicitly labeled as fictionalized anecdotes");
assert.match(game,/railVoice\?\.76/,"rail announcements must use the deliberately slow browser-voice delivery");
assert.match(css,/\.police-bark\.rail-announcement/,"long train announcements need a bounded readable HUD treatment");
assert.match(diagnostic,/carOffsets=\[780,520,260,0,-260,-520,-780\]/,"the direct 3D diagnostic must mirror the full-length seven-car articulation contract");
assert.match(diagnostic,/function updateDiagnosticTrains\(dt\)/,"the direct 3D diagnostic must mirror the stop, bump, and reversal protocol");
assert.match(renderer,/open-l-gauge-nwagen\/n-wagen-coach\.glb/,"the five middle coaches must use the local German n-Wagen asset");
assert.match(renderer,/sourceIndex===1\?\{x:1\.12,y:1\.28,z:4\.82\}/,"the German passenger coaches must be fitted as full-length cars");
assert.ok(coachStat.size>100000,"the licensed n-Wagen GLB must be present locally");
assert.match(coachLicense,/DennisAkaTECHNO/);
assert.match(coachLicense,/CC BY-NC-SA 4\.0/);

console.log("train-consists.test.mjs passed");
