import {speechMouthTracks} from './assets/buergeramt/speech/mouth-cues.js?v=20261013-kripo-ending';
import {sampleTimedMouth,neutralMouth as neutral} from './speech-mouth.js?v=20261013-mouth-audit';
export {sampleTimedMouth};
const omenTrack=Object.values(speechMouthTracks).find(t=>t.clipId==='aktenkurier-omen-candidate-02');
export function resolveMouthTrack(recording,sha256){
 const track=speechMouthTracks[recording];
 if(!track||track.audioSha256!==sha256)return null;
 return{track,sample:time=>sampleTimedMouth(track,time)};
}
// Media currentTime is authoritative. No animation clock advances during pause.
export function sampleOmenMouth(speech){
 const track=omenTrack;
 if(speech?.mode!=='voice'||speech.recording!==track.recording||speech.recordingSha256!==track.audioSha256||!Number.isFinite(speech.mediaTime))return neutral();
 return sampleTimedMouth(track,Math.max(0,speech.mediaTime));
}
