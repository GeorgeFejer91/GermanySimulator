import {layout} from '../assets/models/berghain/layout.mjs';
import {kloRoomAt} from '../assets/models/berghain/klo-bar.mjs';
import {labRoomAt} from '../assets/models/berghain/lab-oratory.mjs';
import {groundRoomAt} from '../assets/models/berghain/ground-registration.mjs';
import {studyToSite} from '../assets/models/berghain/calibration.mjs';

export const acousticProfiles={
 outside:{decay:0,wet:0,cutoff:2200},foyer:{decay:1.3,wet:.24,cutoff:3700},
 berghain:{decay:2.8,wet:.36,cutoff:3100},halle:{decay:4,wet:.42,cutoff:2800},
 panorama:{decay:1.5,wet:.25,cutoff:4300},lounge:{decay:.7,wet:.16,cutoff:3500},
 saule:{decay:2,wet:.31,cutoff:3000},lab:{decay:1.2,wet:.29,cutoff:3400},klo:{decay:1.1,wet:.25,cutoff:3900},wc:{decay:.65,wet:.30,cutoff:5200}
};
const contains=(p,f)=>{
 if(p.x<f.x[0]||p.x>f.x[1]||p.z<f.z[0]||p.z>f.z[1])return false;
 if(!f.polygon)return true;
 let sign=0;
 for(let i=0;i<f.polygon.length;i++){
  const a=f.polygon[i],b=f.polygon[(i+1)%f.polygon.length],c=(b[0]-a[0])*(p.z-a[1])-(b[1]-a[1])*(p.x-a[0]);
  if(Math.abs(c)<1e-8)continue;if(sign&&Math.sign(c)!==sign)return false;sign=Math.sign(c);
 }
 return true;
};
const halleWC=layout.solids.find(s=>s.halle&&s.role==='WC ceiling');
const sauleFront=[-22,22].map(x=>studyToSite({x,y:0,z:9}));
export function footstepEnvironment(position){
 const floors=layout.floors.filter(f=>contains(position,f));
 const sanitary=kloRoomAt(position),ground=groundRoomAt(position);
 const front=sauleFront[0].z+(sauleFront[1].z-sauleFront[0].z)*(position.x-sauleFront[0].x)/(sauleFront[1].x-sauleFront[0].x);
 const room=position.y<.3&&contains(position,halleWC)?'wc':labRoomAt(position)?'lab':sanitary==='toilets'?'wc':sanitary==='klo'?'klo':
  ground==='sauleWC'?'wc':ground?'saule':floors.some(f=>f.name==='Halle ground')?'halle':
  floors.some(f=>/garden|forecourt/.test(f.name))&&!floors.some(f=>/foyer/.test(f.name))?'outside':
  position.y>11.6?'lounge':position.y>8.5?'panorama':position.y>3?'berghain':
  position.z<front?'saule':'foyer';
 const stair=floors.find(f=>f.endY!==undefined&&position.y>=Math.min(f.y,f.endY)-.1&&position.y<=Math.max(f.y,f.endY)+.1);
 return {room,surface:stair&&!stair.halle?'metal':room==='outside'?'grit':room==='wc'?'tile':'concrete'};
}
const random=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1;};
export function createStepBuffer(context,surface='concrete',seed=13){
 const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.24),context.sampleRate),data=buffer.getChannelData(0),noise=random(seed);
 const frequency=surface==='metal'?135:surface==='tile'?95:surface==='grit'?58:72;
 let smooth=0;
 for(let i=0;i<data.length;i++){
  const t=i/context.sampleRate;smooth=.72*smooth+.28*noise();
  const attack=Math.min(1,t/.003),thud=Math.sin(2*Math.PI*frequency*t)*Math.exp(-t*34);
  const scrape=smooth*Math.exp(-t*(surface==='grit'?20:48));
  data[i]=attack*(.38*thud+.55*scrape)*Math.min(1,(.24-t)/.012);
 }
 return buffer;
}
export function createRoomImpulse(context,decay,seed=29){
 const buffer=context.createBuffer(2,Math.max(1,Math.ceil(context.sampleRate*decay)),context.sampleRate);
 for(let channel=0;channel<2;channel++){
  const noise=random(seed+channel*977),data=buffer.getChannelData(channel);let damp=0;
  for(let i=0;i<data.length;i++){
   const t=i/context.sampleRate;damp=.62*damp+.38*noise();
   data[i]=i<context.sampleRate*.012?0:damp*Math.exp(-6.91*t/decay)*.11;
  }
 }
 return buffer;
}
export function connectFootstepGraph(context,profile){
 const input=context.createGain(),dry=context.createGain(),wet=context.createGain(),filter=context.createBiquadFilter(),convolver=context.createConvolver(),output=context.createGain();
 dry.gain.value=.65;wet.gain.value=profile.wet;output.gain.value=.24;
 filter.type='lowpass';filter.frequency.value=profile.cutoff;
 input.connect(dry);dry.connect(output);input.connect(filter);filter.connect(convolver);convolver.connect(wet);wet.connect(output);
 convolver.normalize=true;
 if(profile.decay)convolver.buffer=createRoomImpulse(context,profile.decay);
 output.connect(context.destination);
 return {input,output,convolver,nodes:[input,dry,wet,filter,convolver,output]};
}
export function createFootsteps({contextFactory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)(),onChange=()=>{}}={}){
 let context=null,graph=null,room=null,enabled=true,disposed=false,authorized=false,pendingResume=null,resumeAgain=false,distance=0,count=0,side=0,timer=null,generation=0,unavailable=false;
 const voices=new Set(),buffers=new Map();
 const state=()=>({enabled,steps:count,room,voices:voices.size,context:context?.state||'locked',unavailable,decay:room?acousticProfiles[room].decay:0,disposed});
 const publish=()=>onChange(state());
 const clearTimer=()=>{if(timer!==null)clearTimeout(timer);timer=null;};
 function armSuspend(){
  clearTimer();const revision=generation,decay=room?acousticProfiles[room].decay:0;
  timer=setTimeout(()=>{timer=null;if(revision===generation&&context?.state==='running')context.suspend().catch(()=>{});},(decay+.35)*1000);
 }
 function resume(){
  if(!authorized||!context||unavailable)return;
  if(pendingResume){resumeAgain=true;return pendingResume;}
  try{
   pendingResume=context.resume().then(()=>{
    if(disposed||!enabled||!authorized)context.suspend().catch(()=>{});
    else if(context.state==='running')armSuspend();
   }).catch(()=>{unavailable=true;publish();}).finally(()=>{
    pendingResume=null;
    const retry=resumeAgain;resumeAgain=false;
    if(retry&&authorized&&context.state!=='running')return resume();
   });
   return pendingResume;
  }catch{unavailable=true;publish();}
 }
 function reset(){
  generation++;authorized=false;resumeAgain=false;distance=0;clearTimer();
  for(const voice of [...voices]){voice.source.onended=null;try{voice.source.stop();}catch{}voice.nodes.forEach(n=>n.disconnect());voices.delete(voice);}
  graph?.nodes.forEach(n=>n.disconnect());graph=null;room=null;
  if(context?.state==='running')context.suspend().catch(()=>{});
  publish();
 }
 function unlock(){
  if(disposed||!enabled)return;authorized=true;unavailable=false;
  try{if(!context){context=contextFactory();context.onstatechange=publish;}
   return resume();
  }catch{unavailable=true;}
 }
 return {
  unlock,reset,
  setEnabled(value){enabled=Boolean(value);if(!enabled)reset();else unlock();publish();},
  advance(before,after){
   if(disposed||!enabled||!authorized||!context)return;
   const travelled=Math.hypot(after.x-before.x,after.y-before.y,after.z-before.z);
   if(travelled>.6){distance=0;return;}if(travelled<.00001)return;
   if(context.state!=='running'){resume();return;}
   armSuspend();
   distance+=travelled;if(distance<.66)return;distance%=.66;
   const environment=footstepEnvironment(after),profile=acousticProfiles[environment.room];
   if(room!==environment.room){graph?.nodes.forEach(n=>n.disconnect());graph=connectFootstepGraph(context,profile);room=environment.room;}
   if(voices.size>=4)return;
   if(!buffers.has(environment.surface))buffers.set(environment.surface,createStepBuffer(context,environment.surface));
   const source=context.createBufferSource(),gain=context.createGain(),pan=context.createStereoPanner?.()||context.createGain();
   source.buffer=buffers.get(environment.surface);source.playbackRate.value=.94+(count%5)*.025;
   gain.gain.value=.72+(count%3)*.045;if(pan.pan)pan.pan.value=(side++%2?1:-1)*.12;
   source.connect(gain);gain.connect(pan);pan.connect(graph.input);
   const voice={source,nodes:[source,gain,pan]};voices.add(voice);count++;
   source.onended=()=>{voice.nodes.forEach(n=>n.disconnect());voices.delete(voice);publish();};
   source.start(context.currentTime);source.stop(context.currentTime+.27);
   armSuspend();
   publish();
  },
  get state(){return state();},
  dispose(){if(disposed)return;reset();disposed=true;buffers.clear();if(context)context.onstatechange=null;context?.close().catch(()=>{});publish();}
 };
}
