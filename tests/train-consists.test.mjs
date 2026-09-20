import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const game=readFileSync(new URL("../game.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
const diagnostic=readFileSync(new URL("../3d.html",import.meta.url),"utf8");

assert.match(game,/TRAIN_CAR_OFFSETS=\[390,260,130,0,-130,-260,-390\]/,"perimeter trains must remain single seven-car consists");
assert.match(game,/TRAIN_MIN_GAP=960,TRAIN_BRAKE_GAP=1450/,"long consists need a hard no-passing center gap and a braking envelope");
assert.match(game,/advance=Math\.min\(intended,allowed\)/,"train motion must clamp at the available same-lane gap");
assert.match(game,/train\.bump=train\.queued\?Math\.min\(1,train\.bump\+dt\*5\)/,"queued trains should expose their near-bumper compression state");
assert.match(game,/train\.incidentReason=communityTrainExcuses/,"unscheduled pauses must select a community-derived fictionalized cause");
assert.match(game,/train\?\.blockedByPlayer\?playerTrainExcuse:train\?\.queued\?queuedTrainExcuse/,"announcements must reflect player obstruction and queued traffic");
assert.match(game,/railHoldAnnouncementTimer>4\.5/,"holding up a train must trigger a dedicated long-form announcement");
assert.match(game,/COMMUNITY-ANEKDOTE · FIKTIONALISIERT/,"community reports must remain explicitly labeled as fictionalized anecdotes");
assert.match(game,/railVoice\?\.76/,"rail announcements must use the deliberately slow browser-voice delivery");
assert.match(css,/\.police-bark\.rail-announcement/,"long train announcements need a bounded readable HUD treatment");
assert.match(diagnostic,/carOffsets=\[390,260,130,0,-130,-260,-390\]/,"the direct 3D diagnostic must mirror the seven-car articulation contract");

console.log("train-consists.test.mjs passed");
