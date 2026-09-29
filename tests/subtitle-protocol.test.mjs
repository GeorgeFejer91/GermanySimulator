import assert from "node:assert/strict";
import {splitCaption,timedCaptions,captionAt,captionAtProgress} from "../subtitle-protocol.js";

const text="A long bureaucratic announcement that takes several breaths to finish.";
const parts=splitCaption(text,part=>part.length<=24);
assert.ok(parts.length>1,"long lines must be divided into short captions");
assert.ok(parts.every(part=>part.length<=24),"each part must fit its measured box");
assert.equal(parts.join(" "),text,"pagination must preserve the whole translation");
assert.deepEqual(splitCaption("Extraordinary",part=>part.length<=4),["Extr","aord","inar","y"],"a long unbroken word must still fit");
const balanced=splitCaption("The office has reviewed your application and will send the final count.",part=>part.length<=24);
assert.ok(balanced.at(-1).length>=balanced.at(-2).length*.4,"the final caption should not be an orphan word");

const cues=timedCaptions([[2,10,text],[11,13,"Final line."]],value=>splitCaption(value,part=>part.length<=24));
assert.equal(cues[0][0],2);
assert.equal(cues.at(-1)[1],13);
assert.ok(cues.every(([start,end])=>end>start));
assert.ok(cues.every(([start,end],index)=>index===0||start>=cues[index-1][1]),"parts must not overlap");
assert.equal(captionAt(cues,1),"","captions must wait for their authored cue");
assert.equal(captionAt(cues,10.5),"","authored silent gaps must stay silent");
assert.equal(captionAt(cues,12),"Final line.");
assert.equal(captionAtProgress(parts,0),parts[0]);
assert.equal(captionAtProgress(parts,1),parts.at(-1));

console.log("Subtitle pagination and audio-clock timing OK");
