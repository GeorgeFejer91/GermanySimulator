// One bounded Web Audio source for the Jobcenter encounter; the existing scene
// owns creation, media-time sampling, pause/resume and disposal.
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,Number.isFinite(value)?value:0));
const smooth=value=>{const x=clamp(value);return x*x*(3-2*x)};
const LOOP_SECONDS=4,SAMPLE_RATE=12000,MAX_SECONDS=60,MAX_GAIN=.18;

function loopSamples(){
 const count=LOOP_SECONDS*SAMPLE_RATE,samples=new Float32Array(count);
 let seed=0x4a4f4243;
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296};
 const tones=[[44,.35],[43.5,.16],[67,.26],[66.5,.12],[89,.13],[134,.07]];
 const partials=tones.map(([hz,weight])=>[hz,weight,random()*Math.PI*2]);
 // Low periodic spectral grain supplies cave texture without a second source.
 for(let i=0;i<18;i++)partials.push([Math.round((38+random()*118)*4)/4,.014,random()*Math.PI*2]);
 let peak=0;
 for(let i=0;i<count;i++){
  const t=i/SAMPLE_RATE,breath=.82+.12*Math.sin(2*Math.PI*.25*t)+.06*Math.sin(2*Math.PI*.5*t);
  let value=0;
  for(const [hz,weight,phase] of partials)value+=weight*Math.sin(2*Math.PI*hz*t+phase);
  samples[i]=value*breath;peak=Math.max(peak,Math.abs(samples[i]));
 }
 const scale=.68/peak;
 for(let i=0;i<count;i++)samples[i]*=scale;
 return samples;
}

export function sampleJobcenterRumble(data,time){
 const cues=data?.rumbleCues,duration=Number(data?.duration);
 if(!cues||!Number.isFinite(time)||!Number.isFinite(duration)||time<0||time>=duration)return {level:0,dismissal:0};
 let level=0;
 for(const cue of cues.pauses||[]){
  const start=Number(cue.start),end=Number(cue.end),peak=clamp(cue.peak);
  if(!(end>start)||time<start||time>=end)continue;
  const edge=Math.min(.18,(end-start)*.35);
  level=Math.max(level,peak*smooth((time-start)/edge)*smooth((end-time)/edge));
 }
 const final=cues.dismissal;
 let dismissal=0;
 if(final&&time>=final.start&&time<final.end){
  dismissal=smooth((time-final.start)/(final.speechEnd-final.start));
  if(time<final.speechEnd){
   // The words remain in front; this undercurrent rises only modestly.
   level=Math.max(level,clamp(final.underSpeechMax)*(.3+.7*dismissal));
  }else{
   const edge=(final.end-final.speechEnd)*.45;
   level=Math.max(level,clamp(final.postSpeechPeak)*smooth((time-final.speechEnd)/edge)*smooth((final.end-time)/edge));
  }
 }
 return {level:clamp(level),dismissal:clamp(dismissal)};
}

export function createJobcenterRumble(context,output){
 const samples=loopSamples(),buffer=context.createBuffer(1,samples.length,SAMPLE_RATE);
 buffer.getChannelData(0).set(samples);
 const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
 source.buffer=buffer;source.loop=true;source.loopStart=0;source.loopEnd=LOOP_SECONDS;
 filter.type='lowpass';filter.frequency.value=185;filter.Q.value=.45;
 gain.gain.value=0;
 source.connect(filter);filter.connect(gain);gain.connect(output);
 let active=true,previous=0;
 const clear=()=>{source.disconnect();filter.disconnect();gain.disconnect();active=false};
 source.onended=()=>{if(active)clear()};
 const now=context.currentTime;
 source.start(now);source.stop(now+MAX_SECONDS);
 return {
  get active(){return active},
  setLevel(value){
   if(!active)return;
   const level=clamp(value),at=context.currentTime,param=gain.gain,target=level*MAX_GAIN;
   const current=param.value;
   param.cancelScheduledValues(at);param.setValueAtTime(current,at);
   param.linearRampToValueAtTime(target,at+(level<previous?0.045:0.22));
   previous=level;
  },
  dispose(){
   if(!active)return;
   const at=context.currentTime;
   gain.gain.cancelScheduledValues(at);gain.gain.setValueAtTime(0,at);
   source.onended=null;
   try{source.stop(at)}catch{}
   clear();
  }
 };
}
