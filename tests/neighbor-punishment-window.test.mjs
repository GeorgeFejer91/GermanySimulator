import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {neighborWindowRecognition} from '../tools/curate-voice-library.mjs';
function fixture(){const m=JSON.parse(readFileSync(new URL('../assets/voices/neighbors/punishment-inga-manifest.json',import.meta.url)));const c=m.clips.find(c=>c.clipId==='punishment-inga-02');assert.ok(c,'ROOT-reviewed Inga02 final-window recording must be admitted');return c}
test('finite Inga02 proof covers every source word and all final encoded samples',()=>{
 const c=fixture();assert.equal(neighborWindowRecognition(c),true);assert.equal(c.asrVerificationMode,'exhaustive-final-encoding-windows-v1');assert.equal(c.asrWholeFileWordExact,false);assert.equal(c.asrLiteralWordExact,false);
 const p=c.asrWindowProof;assert.equal(p.windows[0].startSample,0);assert.equal(p.windows[0].endSampleExclusive,p.windows[1].startSample);assert.equal(p.windows[1].endSampleExclusive,p.totalSamples);assert.match(p.windows[0].transcript,/Sonntags/u);assert.equal(p.wholeReadings.length,2);
});
test('source/take/proof/recognizer drift and disguising the known window-only media are rejected',()=>{
 for(const mutate of [c=>c.text+=' Nein.',c=>c.sha256='0'.repeat(64),c=>c.asrWindowProof.windows[0].transcript=c.asrWindowProof.windows[0].transcript.replace('Sonntags','Sonntag'),c=>c.asrWindowProof.windows[1].startSample++,c=>c.asrWindowProof.windows.reverse(),c=>c.asrWindowProof.windows[0].windowPcmSha256='0'.repeat(64),c=>c.asrWindowProof.wholeReadings.pop(),c=>{delete c.asrWindowProof;c.asrVerificationMode='word-exact'},c=>c.asrWholeFileWordExact=true,c=>c.asrScriptPrompt=c.text]){const c=structuredClone(fixture());mutate(c);assert.equal(neighborWindowRecognition(c),false)}
});
