import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
import vm from "node:vm";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const diagnostic=readFileSync(new URL("../3d.html",import.meta.url),"utf8");
const renderer=readFileSync(new URL("../world3d.js",import.meta.url),"utf8");
const coachLicense=readFileSync(new URL("../assets/models/open-l-gauge-nwagen/LICENSES.md",import.meta.url),"utf8");
const coachStat=statSync(new URL("../assets/models/open-l-gauge-nwagen/n-wagen-coach.glb",import.meta.url));
const announcementFiles=["ice-0815-buxtehude-bahnhofshalle-subtle.mp3","ice-0815-marktversagen-bahnhofshalle-subtle.mp3","ice-0815-stalingrad-bahnhofshalle-subtle.mp3","ice-ardorf-hilter-bahnhofshalle-subtle.mp3","ice-96-oberkaka-bahnhofshalle-subtle.mp3"];

assert.match(game,/TRAIN_CAR_OFFSETS=\[780,520,260,0,-260,-520,-780\]/,"perimeter trains must remain single full-length seven-car consists");
assert.match(game,/CITY=\{w:9840,h:4240\},RAIL_GUTTER=560,WORLD=\{w:CITY\.w\+RAIL_GUTTER\*2,h:CITY\.h\+RAIL_GUTTER\*2\}/,"the playable world must add a full rail-clearance gutter around the city");
assert.match(game,/makeRailLoop\("aussenring",72,720,1\),makeRailLoop\("innenring",232,560,-1\)/,"full-length coaches need broad concentric corner radii");
assert.match(game,/TRAIN_CAR_HALF_LENGTH=112,TRAIN_CAR_HALF_WIDTH=46,TRAIN_MIN_GAP=1820,TRAIN_PLAYER_STOP_GAP=970/,"long consists need matching solid bodies, a hard no-passing center gap, and a sampled-rail clearance margin");
assert.match(game,/\[0,\.03,1,188,94\].*\[0,\.19,-1,252,132\].*\[1,\.87,1,214,112\]/s,"both tracks must start with six alternating, independently tuned trains");
assert.match(game,/orientation:seed\[2\].*acceleration:seed\[4\]/s,"physical consist orientation must be decoupled from reversible movement and every train must own its acceleration");
assert.match(game,/function signedRailSeparation\(/,"same-track collision must use circular signed separation");
assert.match(game,/factor=closure>0\?clamp\(available\/closure,0,1\):0;a\.motion\*=factor;b\.motion\*=factor/,"both trains must clamp to their shared no-overlap contact gap");
assert.match(game,/train\.bouncePause=TRAIN_BOUNCE_PAUSE;train\.reversePending=true/,"a contact must stop both trains for the bounce pause");
assert.match(game,/train\.dir\*=-1;train\.reversePending=false;train\.speed=0/,"a stopped collision pair must restart in the opposite direction");
assert.match(game,/rate=target<train\.speed\?train\.acceleration\*3\.2:train\.acceleration/,"each train must apply its own acceleration constant");
assert.match(game,/function trainCarDistance\(/,"long coaches need oriented body collision instead of point-radius collision");
assert.match(game,/function dynamicBlocker\(x,y,fromX,fromY\).*trainCarDistance\(x,y,item\).*next<player\.r&&next<previous/s,"the player must not be able to move through an oriented train body");
assert.match(game,/groundObstacles=\[\{item:player.*policeVehicles.*police.*npcs.*props.*normObjects/s,"trains must brake for the player, other people, response vehicles, and solid ground objects");
assert.match(game,/event<\.55.*train\.pause=1\.4\+Math\.random\(\)\*4\.8/,"trains must stop unpredictably often enough to disrupt both loops");
assert.match(game,/TRAIN_PLAYER_OBSTRUCTION_AUDIO=TRAIN_ANNOUNCEMENT_AUDIO\[0\]/,"the player-obstruction cue must always map to the supplied Buxtehude recording");
assert.match(game,/playerHolding&&!playerHoldingLast\)requestTrainAnnouncement\(0,TRAIN_PLAYER_OBSTRUCTION_AUDIO,STIMULUS_PRIORITY\.CRITICAL,"track"\)/,"every new player-caused train stop must reserve the critical Buxtehude cue");
assert.match(game,/direct=priority===STIMULUS_PRIORITY\.CRITICAL[\s\S]*activeStimulus\?\.family==="train"&&!direct/,"a critical obstruction cue must remain queueable behind an active train announcement");
assert.match(game,/TRAIN_ANNOUNCEMENT_AUDIO=\[/,"the supplied recordings must replace generated train speech");
const roadsDeclaration=game.match(/const horizontalRoads=[^\n]+\nconst verticalRoads=[^\n]+/);
const stationDeclaration=game.slice(game.indexOf("const STATION_RISE="),game.indexOf("const TRAIN_CAR_OFFSETS="));
assert.ok(roadsDeclaration&&stationDeclaration.includes("const stations=Object.freeze("),"roads and stations must have one simulation authority");
const stationWorld=vm.createContext({RAIL_GUTTER:560,CITY:{w:9840,h:4240}});
vm.runInContext(`${roadsDeclaration[0]}\n${stationDeclaration}\nglobalThis.layout={horizontalRoads,verticalRoads,stations,stationElevation,STATION_RISE}`,stationWorld);
const {horizontalRoads,verticalRoads,stations,stationElevation,STATION_RISE}=stationWorld.layout;
assert.equal(stations.length,2*(horizontalRoads.length+verticalRoads.length),"every road end needs its own station");
assert.deepEqual(Array.from(stations.filter(s=>s.side==="north"||s.side==="south"),s=>s.id).filter(id=>["nordwest","nordost","suedwest","suedost"].includes(id)).sort(),["nordost","nordwest","suedost","suedwest"]);
for(const road of verticalRoads)for(const side of ["north","south"]){const center=road.x+road.w/2,matches=stations.filter(s=>s.side===side&&s.accessX+s.accessW/2===center);assert.equal(matches.length,1,`${side} end of vertical road ${center} needs one station`);const s=matches[0];assert.ok(s.accessX>=s.x&&s.accessX+s.accessW<=s.x+s.w);assert.ok(side==="north"?s.accessY+s.accessH===560&&s.y-232>46:s.accessY===4800&&5128-s.y-s.h>46)}
for(const road of horizontalRoads)for(const side of ["west","east"]){const center=road.y+road.h/2,matches=stations.filter(s=>s.side===side&&s.accessY+s.accessH/2===center);assert.equal(matches.length,1,`${side} end of horizontal road ${center} needs one station`);const s=matches[0];assert.ok(s.accessY>=s.y&&s.accessY+s.accessH<=s.y+s.h);assert.ok(side==="west"?s.accessX+s.accessW===560&&s.x-232>46:s.accessX===10400&&10728-s.x-s.w>46)}
for(const s of stations){
 const px=s.x+s.w/2,py=s.y+s.h/2,cx=s.accessX+s.accessW/2,cy=s.accessY+s.accessH/2;
 assert.equal(stationElevation(px,py),STATION_RISE);
 for(const [approach,height] of [[0,0],[55,.1],[75,.2],[95,.3]]){
  const x=s.side==="west"?s.accessX+s.accessW-approach:s.side==="east"?s.accessX+approach:cx,y=s.side==="north"?s.accessY+s.accessH-approach:s.side==="south"?s.accessY+approach:cy;
  assert.ok(Math.abs(stationElevation(x,y)-height)<1e-8,`${s.id} must climb all three steps`);
 }
}
assert.match(game,/Math\.abs\(stationElevation\(x,y\)-stationElevation\(player\.x,player\.y\)\)>\.11/,"platform sides must route walking through the stairs");
assert.match(game,/TRAIN_PLATFORM_AUDIO=TRAIN_ANNOUNCEMENT_AUDIO\.slice\(1\)/,"general station clips must exclude the track-only children recording");
assert.match(game,/function updateTrainAnnouncement\(\).*playerOnRailTrack\(\).*"track".*platformDistance\(\).*"platform"/s,"track and platform triggers must use their own zones");
assert.match(renderer,/\(bridge\.stations\|\|\[\]\)\.map\(state=>\{[\s\S]*?stationPlatform\(state\)/,"the WebGL scene must render every station from simulation data");
const requested=[],player={x:stations[0].x+600,y:stations[0].y+70};
const audioZones=vm.createContext({stations,player,railLoops:[{y:232},{y:5128}],nearestRailLocation:(loop,x,y)=>({distance:Math.abs(y-loop.y)}),state:{started:true,modal:false,gameOver:false,voiceOn:true},performance:{now:()=>10000},trainAnnouncementNextAt:0,STIMULUS_PRIORITY:{NEARBY:3,AMBIENT:1},requestTrainAnnouncement:(...args)=>requested.push(args)});
for(const name of ["platformDistance","playerOnRailTrack","updateTrainAnnouncement"]){const line=game.match(new RegExp(`function ${name}\\([^\\n]*`))?.[0];assert.ok(line,`${name} must exist`);vm.runInContext(line,audioZones)}
vm.runInContext("updateTrainAnnouncement()",audioZones);assert.equal(requested.pop()?.[3],"platform","standing on a platform should request the general announcement pool");
player.y=232;vm.runInContext("updateTrainAnnouncement()",audioZones);assert.equal(requested.pop()?.[3],"track","standing on the track should request Buxtehude instead");
player.x=5500;player.y=2500;vm.runInContext("updateTrainAnnouncement()",audioZones);assert.equal(requested.length,0,"the city interior should not hear platform announcements");
assert.match(game,/AUDIO_CLASS=Object\.freeze\(\{TEXT:"audio-text",BACKGROUND:"background-music",EFFECT:"sound-effect"\}\)/,"runtime audio must declare text, background-music, and sound-effect classes");
assert.match(game,/function queueStimulus\(item\)/,"dialogue and train audio must share the stimulus broker");
assert.match(game,/function stopSpeech\(completeHumorScold=false,preserveTrain=false\)\{const keepActive=preserveTrain&&activeStimulus\?\.family==="train";stimulusQueue\.length=0/s,"modal takeover must preserve only an already active no-text train cue");
assert.match(game,/BACKGROUND:\.22/,"sound effects and music must share the normalized background multiplier");
assert.match(game,/function applyAudioDucking\(\).*musicDucked\|\|audioTextActive\(\).*soundEffectBus/s,"audio text must duck both background music and the sound-effect bus");
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
