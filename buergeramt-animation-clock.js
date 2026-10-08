(function(){
"use strict";
// Main poses are the only safe points for changing a requested action.
const poses=["ready","raised","contact","refusal"];
const forward=[
 {arc:"raise",fromPose:"ready",toPose:"raised",duration:3.1},
 {arc:"stamp",fromPose:"raised",toPose:"contact",duration:2.25},
 {arc:"refuse",fromPose:"contact",toPose:"refusal",duration:2.2},
 {arc:"return",fromPose:"refusal",toPose:"ready",duration:1.55}
];
const reverse=forward.map(step=>({arc:step.arc+"-back",fromPose:step.toPose,toPose:step.fromPose,duration:step.duration}));
const edges=[...forward,...reverse];
function nextEdge(from,target){
 if(target===null)return forward[poses.indexOf(from)];
 // The graph is small; choosing the least-time authored path keeps responses prompt.
 const distance=new Map([[target,0]]);
 for(let n=0;n<poses.length-1;n++)for(const edge of edges){
  const tail=distance.get(edge.toPose);
  if(tail!==undefined&&tail+edge.duration<(distance.get(edge.fromPose)??Infinity))distance.set(edge.fromPose,tail+edge.duration);
 }
 return edges.filter(edge=>edge.fromPose===from).sort((a,b)=>(a.duration+(distance.get(a.toPose)??Infinity))-(b.duration+(distance.get(b.toPose)??Infinity)))[0];
}
function createClerk(){
 let generation=0,actionId=0,pose="ready",target=null,step=null,elapsed=0,speaking=false,mouthFrame=0;
 function start(){
  if(target===pose)return;
  step=nextEdge(pose,target);elapsed=0;actionId++;
 }
 return{
  reset(value){generation=value??generation+1;actionId=0;pose="ready";target=null;step=null;elapsed=0;speaking=false;mouthFrame=0},
  request(value){if(value!==null&&!poses.includes(value))throw new RangeError("Unknown Bürgeramt clerk pose: "+value);if(target===value)return;target=value;if(!step)start()},
  setSpeech(value,frame=mouthFrame){speaking=!!value;mouthFrame=speaking&&Number.isFinite(frame)?Math.max(0,Math.floor(frame))%8:0},
  advance(dt){
   let remaining=Number.isFinite(dt)?Math.max(0,dt):0;
   if(remaining===0)return;
   if(!step)start();
   while(step&&remaining>0){
    const increment=Math.min(remaining,step.duration-elapsed);
    elapsed+=increment;remaining-=increment;
    if(elapsed+1e-9<step.duration)break;
    pose=step.toPose;step=null;elapsed=0;
    if(target===pose)break;
    start();
   }
  },
  get state(){return{
   generation,actionId,arc:step?.arc??null,phase:step?Math.min(1,elapsed/step.duration):1,
   pose:step?.fromPose??pose,fromPose:step?.fromPose??pose,toPose:step?.toPose??pose,
   speaking,mouthFrame
  }}
 };
}
window.BuergeramtAnimationClock={createClerk};
})();
