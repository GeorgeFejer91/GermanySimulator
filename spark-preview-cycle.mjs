// Shared continuous clock; no holds at intermediate keys. Four original anchors plus ten
// authored bridge paintings. Crossing/regripping intervals never warp anatomy.
export const CYCLE_DURATION = 6.25;
export const ANCHOR_TIMES = [0,1.3,2.5,3.1,3.2,3.3,4,4.25,5.1,5.2,5.3,5.4,5.5,5.6];
export const ANCHORS = [
 {id:'ready',name:'Ready',file:'anchor-0.webp'},
 {id:'raise-1',name:'Lift to shoulder',file:'bridge-raise-1.webp'},
 {id:'raise-2',name:'Lift above forehead',file:'bridge-raise-2.webp'},
 {id:'raised',name:'Stamp raised',file:'anchor-1.webp'},
 {id:'stamp-1',name:'Take the paperwork',file:'bridge-stamp-1.webp'},
 {id:'stamp-2',name:'Support the document',file:'bridge-stamp-2.webp'},
 {id:'stamp-3',name:'Approach contact',file:'bridge-stamp-3.webp'},
 {id:'contact',name:'Stamp contact',file:'anchor-2.webp'},
 {id:'fold-1',name:'Lift off the paper',file:'bridge-fold-1.webp'},
 {id:'fold-2',name:'Put the document aside',file:'bridge-fold-2.webp'},
 {id:'fold-3',name:'Begin folding arms',file:'bridge-fold-3.webp'},
 {id:'refusal',name:'Refusal',file:'anchor-3.webp'},
 {id:'return-1',name:'Unfold arms',file:'bridge-return-1.webp'},
 {id:'return-2',name:'Lower the free hand',file:'bridge-return-2.webp'},
];
// Only these inspected same-side movements interpolate; the narrow stamp
// layer retains its source size rather than resizing to the next painting.
export const SPLAT_CANDIDATES = [0,1,2,5,6,7,13];
// One moving interval per key; no held inbetweens or per-key ease-to-zero.
export const BEATS = ANCHORS.map((anchor,pair)=>({
 start:ANCHOR_TIMES[pair],end:ANCHOR_TIMES[pair+1]??CYCLE_DURATION,
 pair,from:0,to:1,label:ANCHORS[(pair+1)%ANCHORS.length].name,
}));
export function cycleAt(time){
 const t=Math.max(0,Math.min(CYCLE_DURATION,Number(time)||0));
 const beat=BEATS.find(b=>t<b.end)||BEATS.at(-1);
 const phase=Math.max(0,Math.min(1,(t-beat.start)/(beat.end-beat.start)));
 return {pair:beat.pair,phase,label:beat.label};
}

export function advanceClock(time,delta,speed,loop,duration=CYCLE_DURATION){
 const next=time+Math.max(0,delta)*speed;
 return loop?next%duration:Math.min(duration,next);
}
export function transitionAt(time,policies){
 const state=cycleAt(time),guarded=policies[state.pair].mode!=='splat';
 const anchor=(state.pair+(state.phase>=.5?1:0))%ANCHORS.length;
 return {...state,guarded,anchor,paperInHand:anchor>=4&&anchor<=9};
}
