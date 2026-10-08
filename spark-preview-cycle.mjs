// Ten-second clock shared by both renderers. Four original anchors plus ten
// authored bridge paintings. Crossing/regripping intervals never warp anatomy.
export const CYCLE_DURATION = 10;
export const ANCHOR_TIMES = [0,1.6,2,2.4,2.9,3.4,3.8,4.1,5.15,5.55,5.95,6.3,8.42,8.84];
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
// Only these same-side movements may interpolate. The builder may further
// protect a segment when measured stamp scale or part geometry is incompatible.
export const SPLAT_CANDIDATES = [0,1,2,5,13];
export const BEATS = [
 {start:0,end:1.2,pair:0,from:0,to:0,label:'Ready'},
 {start:1.2,end:1.6,pair:0,from:0,to:1,label:'Lift to shoulder'},
 {start:1.6,end:2,pair:1,from:0,to:1,label:'Lift above forehead'},
 {start:2,end:2.4,pair:2,from:0,to:1,label:'Raise the stamp'},
 {start:2.4,end:2.55,pair:3,from:0,to:0,label:'Take aim'},
 {start:2.55,end:2.9,pair:3,from:0,to:1,label:'Take the paperwork'},
 {start:2.9,end:3.4,pair:4,from:0,to:1,label:'Support the document'},
 {start:3.4,end:3.8,pair:5,from:0,to:1,label:'Lower the stamp'},
 {start:3.8,end:4.1,pair:6,from:0,to:1,label:'Stamp the document',ease:'strike'},
 {start:4.1,end:4.8,pair:7,from:0,to:0,label:'Stamp contact'},
 {start:4.8,end:5.15,pair:7,from:0,to:1,label:'Lift off the paper'},
 {start:5.15,end:5.55,pair:8,from:0,to:1,label:'Put the document aside'},
 {start:5.55,end:5.95,pair:9,from:0,to:1,label:'Release the document'},
 {start:5.95,end:6.3,pair:10,from:0,to:1,label:'Fold arms'},
 {start:6.3,end:8,pair:11,from:0,to:0,label:'Refusal'},
 {start:8,end:8.42,pair:11,from:0,to:1,label:'Unfold arms'},
 {start:8.42,end:8.84,pair:12,from:0,to:1,label:'Lower the free hand'},
 {start:8.84,end:9.25,pair:13,from:0,to:1,label:'Return to ready'},
 {start:9.25,end:10,pair:13,from:1,to:1,label:'Ready'},
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
export function transitionAt(time,policies){
 const state=cycleAt(time),guarded=policies[state.pair].mode!=='splat';
 const anchor=(state.pair+(state.phase>=.5?1:0))%ANCHORS.length;
 return {...state,guarded,anchor,paperInHand:anchor>=4&&anchor<=9};
}
