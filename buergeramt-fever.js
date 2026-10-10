(function(){
"use strict";
// Themes own authored atmosphere; the existing office update owns their time.
const entries=[
 ["aktenkurier",1,"The sealed sentence",[.40,.12,.56],.20,"ink-vault"],
 ["archivbotin",2,"The archive reads you",[.18,.36,.62],.16,"archive-drawers"],
 ["formularsammler",3,"Page seventeen folds the room",[.57,.40,.22],.18,"folded-forms"],
 ["nummernfluesterer",4,"Your number has already died",[.56,.12,.18],.14,"number-liturgy"],
 ["nachtschichtmelderin",5,"The dead telephone remembers",[.16,.50,.43],.12,"dead-signal"],
 ["pfandarchitektin",6,"The receipt has no beginning",[.58,.39,.17],.15,"endless-receipt"],
 ["kopiependler",7,"The copy prosecutes the original",[.24,.40,.55],.14,"mirror-office"],
 ["warteschlangenpoetin",8,"A funeral for the waiting number",[.37,.20,.53],.10,"queue-tombstones"],
 ["clerk",9,"The tribunal of the half stamp",[.63,.10,.14],.12,"stamp-tribunal"],
 ["amt-konrad-wohnungszettel",10,"A home with no inside",[.33,.46,.22],.13,"impossible-floorplan"],
 ["amt-mechthild-elternbogen",11,"The register erases its children",[.50,.24,.41],.11,"erasure-registry"],
 ["amt-wolfram-rentenbescheid",12,"Three weeks before time began",[.40,.39,.62],.09,"clock-court"]
];
const themes=Object.freeze(Object.fromEntries(entries.map(([id,index,title,color,speed,motif])=>[id,Object.freeze({id,index,title,color:Object.freeze(color),speed,motif})])));
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{const t=clamp(x);return t*t*(3-2*t)};
function create(){
 let state=null;
 const release=()=>{if(state&&state.phase!=="release"){state.phase="release";state.releaseFrom=state.strength;state.releaseTime=0;state.paused=false}};
 return{
  begin({id,text,cue,generation,durationMs}){const theme=themes[id];if(!theme)return null;state={id,theme,text,cue,generation,phase:"waiting",strength:state?.strength||0,enterFrom:state?.strength||0,time:state?.time||0,elapsed:0,speechTime:0,duration:Math.max(1,(durationMs||6000)/1000),progress:0,charIndex:-1,paused:false,timing:"estimated",mode:"waiting"};return state},
  start(mode,recording){if(!state)return;state.mode=mode;state.phase="speaking";if(recording?.durationMs>0)state.duration=recording.durationMs/1000},
  boundary(index,event){if(!state||state.paused||index<=state.charIndex||index<0||index>state.text.length)return;state.charIndex=index;state.progress=Math.max(state.progress,index/state.text.length);state.timing=event?.type==="recording-cue"?"recording-cues":"boundary"},
  pause(){if(state)state.paused=true},resume(){if(state)state.paused=false},
  fallback(){if(state){state.mode="fallback";state.charIndex=-1;state.timing="estimated";state.paused=false}},
  done(){if(state&&state.phase!=="release"){state.phase="hold";state.hold=.65;state.progress=1;state.paused=false}},
  release,clear(){state=null},
  advance(dt){if(!state)return;const elapsed=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));if(state.paused)return;state.time+=elapsed;state.elapsed+=elapsed;
   if(state.phase==="release"){state.releaseTime+=elapsed;state.strength=state.releaseFrom*(1-ease(state.releaseTime/1.5));if(state.releaseTime>=1.5)state=null;return}
   state.strength=state.enterFrom+(1-state.enterFrom)*ease(state.elapsed/1.2);
   if(state.phase==="speaking"){state.speechTime+=elapsed;if(state.charIndex<0)state.progress=Math.max(state.progress,Math.min(.94,state.speechTime/state.duration))}
   if(state.phase==="hold"){state.hold-=elapsed;if(state.hold<=0)release()}
  },
  inspect(){return state?{active:true,id:state.id,theme:state.theme,cue:state.cue,generation:state.generation,phase:state.phase,strength:state.strength,time:state.time,progress:state.progress,paused:state.paused,timing:state.timing,mode:state.mode,pressure:state.strength*(.45+.35*state.progress)}:{active:false,strength:0,time:0,pressure:0}}
 };
}
window.BuergeramtFever=Object.freeze({themes,create});
})();
