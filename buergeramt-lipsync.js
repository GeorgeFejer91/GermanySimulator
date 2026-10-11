import {omenMouthTrack as track} from './assets/buergeramt/omen/mouth-cues.js';
const shapes={X:[0,0,0,0],A:[0,-.12,0,0],B:[.28,.45,0,.15],C:[.64,.35,0,0],D:[1,.12,0,0],E:[.46,-.22,.55,0],F:[.30,-.52,1,0],G:[.16,.12,0,1],H:[.57,.2,0,.5]};
const neutral=()=>({open:0,spread:0,round:0,bite:0,viseme:'X',time:0});
// Media currentTime is authoritative. No animation clock advances during pause.
export function sampleOmenMouth(speech){
 if(speech?.mode!=='voice'||speech.recording!==track.recording||speech.recordingSha256!==track.audioSha256||!Number.isFinite(speech.mediaTime))return neutral();
 const time=Math.max(0,speech.mediaTime);if(time>=track.duration)return neutral();
 const index=track.cues.findIndex(c=>time>=c[0]&&time<c[1]);if(index<0)return neutral();
 const cue=track.cues[index],previous=track.cues[Math.max(0,index-1)],target=shapes[cue[2]],from=shapes[previous[2]];
 const u=Math.min(1,(time-cue[0])/.055),blend=u*u*(3-2*u),values=target.map((v,i)=>from[i]+(v-from[i])*blend);
 const sample=time*track.sampleHz,lower=Math.floor(sample),fraction=sample-lower;
 const energy=(track.energy[lower]??0)*(1-fraction)+(track.energy[lower+1]??0)*fraction;
 return {open:values[0]*(.32+.68*energy),spread:values[1],round:values[2],bite:values[3],viseme:cue[2],time};
}
