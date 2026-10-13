// Shared acoustic cue sampler. Native media time owns articulation and pause.
const shapes={X:[0,0,0,0],A:[0,0,0,0],B:[.32,.45,0,.15],C:[.85,.35,0,0],D:[1,.12,0,0],E:[.72,0,.55,0],F:[.70,0,1,0],G:[.16,.12,0,1],H:[.70,.2,0,.5]};
const energies=new WeakMap(),smooth=t=>t*t*(3-2*t);
export const neutralMouth=()=>({open:0,spread:0,round:0,bite:0,viseme:'X',time:0});
export function sampleTimedMouth(track,time){
 if(!Number.isFinite(time)||time<0||time>=track.duration)return neutralMouth();
 const cues=track.cues??track.mouthCues;
 const index=cues.findIndex(c=>time>=c[0]&&time<c[1]);if(index<0)return neutralMouth();
 const cue=cues[index];let values=shapes[cue[2]].slice();
 // At most 40 ms anticipation/release, without a delayed animation clock.
 for(const n of [index,index+1]){
  const left=cues[n-1],right=cues[n];if(!left||!right)continue;
  const radius=Math.min(.040,(left[1]-left[0])*.45,(right[1]-right[0])*.45);
  if(Math.abs(time-right[0])<=radius){
   const blend=smooth((time-right[0]+radius)/(2*radius));
   values=shapes[left[2]].map((v,i)=>v+(shapes[right[2]][i]-v)*blend);break;
  }
 }
 let energy=energies.get(track);
 if(!energy){energy=track.energy??Uint8Array.from(atob(track.energyBase64),c=>c.charCodeAt(0));energies.set(track,energy)}
 const sample=time*track.sampleHz,lower=Math.floor(sample),fraction=smooth(sample-lower);
 const level=((energy[lower]??0)*(1-fraction)+(energy[lower+1]??0)*fraction)/255;
 const audible=smooth(Math.min(1,level/.12));
 return{open:values[0]*(.35+.65*level)*audible,spread:values[1]*audible,round:values[2]*audible,bite:values[3]*audible,viseme:cue[2],time};
}
