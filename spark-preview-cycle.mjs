// Active time drives both renderers. Holds keep the exact painted endpoints.
export const CYCLE_DURATION = 10;
export const ANCHOR_TIMES = [0, 2.7, 4.1, 7];
export const BEATS = [
 {start:0,end:1.2,pair:0,from:0,to:0,label:'Ready'},
 {start:1.2,end:2.4,pair:0,from:0,to:1,label:'Raise the stamp'},
 {start:2.4,end:3.15,pair:0,from:1,to:1,label:'Take aim'},
 {start:3.15,end:3.47,pair:1,from:0,to:1,label:'Stamp the document',ease:'strike'},
 {start:3.47,end:4.8,pair:1,from:1,to:1,label:'Stamp contact'},
 {start:4.8,end:6,pair:2,from:0,to:1,label:'Fold arms'},
 {start:6,end:8,pair:2,from:1,to:1,label:'Refusal'},
 {start:8,end:9.25,pair:3,from:0,to:1,label:'Return to ready'},
 {start:9.25,end:10,pair:3,from:1,to:1,label:'Ready'},
];
export function cycleAt(time){
 const t=Math.max(0,Math.min(CYCLE_DURATION,Number(time)||0));
 const beat=BEATS.find(b=>t<b.end)||BEATS.at(-1);
 const u=Math.max(0,Math.min(1,(t-beat.start)/(beat.end-beat.start)));
 const ease=beat.ease==='strike'?u*u:u*u*(3-2*u);
 return {pair:beat.pair,phase:beat.from+(beat.to-beat.from)*ease,label:beat.label};
}
export function advanceClock(time,delta,speed,loop,duration=CYCLE_DURATION){
 const next=time+Math.max(0,delta)*speed;
 return loop?next%duration:Math.min(duration,next);
}
