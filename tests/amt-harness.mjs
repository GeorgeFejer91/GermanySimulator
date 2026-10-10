// Dependency-free DOM/clock harness. These are runtime contract tests, not a
// substitute for a headless WebGL playtest or a real VDO.Ninja connection.
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const source=name=>readFileSync(path.join(root,name),'utf8');

export function harness(kind='host',{voice=false,synthesis=true,phoneLanguage='de-DE',phoneCaptions=false,phoneAgent='test',phonePlatform='',phoneMobile,phoneClock,cinematics=false,cityAudioBusy,fakeAudio=false,candidatePhone=false,officeFx=null,speechAutoStart=true}={}){
 const nodes=new Map(),window=new EventTarget(),document=new EventTarget();
 let now=0,nextTimer=0;const timers=new Map();
 const later=(fn,delay=0,repeat=false)=>{const id=++nextTimer;timers.set(id,{fn,due:now+Math.max(0,delay),repeat,delay});return id};
 const clear=id=>timers.delete(id);
 function tick(ms){const end=now+ms;let guard=0;while(true){const entries=[...timers].filter(([,t])=>t.due<=end).sort((a,b)=>a[1].due-b[1].due||a[0]-b[0]);if(!entries.length)break;if(++guard>20000)throw new Error('Unbounded timer loop');const [id,t]=entries[0];now=t.due;if(t.repeat)t.due+=Math.max(1,t.delay);else timers.delete(id);t.fn()}now=end}
 class Element extends EventTarget{
  constructor(id=''){super();this.id=id;this.textContent='';this.children=[];this.hidden=false;this.disabled=false;this.value='';this.href='';this.dataset={};this.style={setProperty(){},removeProperty(){}};const classes=new Set();this.classList={add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle(x,on){if(on===undefined)on=!classes.has(x);on?classes.add(x):classes.delete(x);return on}}}
  querySelector(selector){return node(selector.slice(1))}
  querySelectorAll(){return []}
  replaceChildren(...children){this.children=children}
  append(child){this.children.push(child)}
  closest(selector){return selector==='button'&&this.tagName==='BUTTON'?this:null}
  setPointerCapture(){}
  click(){if(this.disabled)return;this.onclick?.();this.dispatchEvent(new Event('click'))}
 }
 function node(id){if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id)}
 document.getElementById=node;document.querySelector=selector=>node(selector.slice(1));document.querySelectorAll=()=>[];document.createElement=tag=>Object.assign(new Element(),{tagName:tag.toUpperCase()});document.hidden=false;
 const fullscreenRequests=[];document.body=new Element('body');document.documentElement=new Element('html');document.documentElement.requestFullscreen=()=>{fullscreenRequests.push(true);return Promise.resolve()};
 for(const id of ['amt-level','amt-ticket','amt-walk-hud','phone-ticket','phone-call','phone-call-line'])node(id).hidden=true;
 node('phone-submit').disabled=true;
 node('phone-answer-track').clientWidth=280;node('phone-answer').offsetWidth=64;
 class Link extends EventTarget{
  static instances=[];
  static invitation(){return{room:'amt-test',stream:'amt-ticket-test'}}
  static phoneUrl(){return'https://example.test/buergeramt-phone.html#test'}
  static fromHash(){return Link.invitation()}
  constructor(role){super();this.role=role;this.channel={readyState:'open'};this.sent=[];this.closed=false;this.fail=false;Link.instances.push(this)}
  async start(){}
  send(type,data={}){if(this.fail||this.closed)return false;this.sent.push({type,...data});return true}
  close(){this.closed=true;this.channel=null}
  emit(type,detail){this.dispatchEvent(new CustomEvent(type,{detail}))}
  message(detail){this.emit('message',detail)}
 }
 const synth={speaking:false,pending:false,paused:false,spoken:[],cancelCount:0,current:null,
  getVoices:()=>[{name:'German Test',lang:'de-DE'}],
  cancel(){this.cancelCount++;this.speaking=false;this.pending=false;this.paused=false;this.current=null},
  speak(utterance){this.current=utterance;this.spoken.push(utterance);this.pending=true;if(speechAutoStart)this.start()},
  start(){if(!this.current||this.speaking)return;this.speaking=true;this.pending=false;this.current.onstart?.()},
  boundary(charIndex,elapsedTime=0){this.current?.onboundary?.({charIndex,elapsedTime})},
  pause(){if(!this.current||this.paused)return;this.paused=true;this.current.onpause?.()},
  resume(){if(!this.current||!this.paused)return;this.paused=false;this.current.onresume?.()},
  end(){const utterance=this.current;this.current=null;this.speaking=false;this.pending=false;this.paused=false;utterance?.onend?.()}
 };
 const vibrations=[];
 const saved=new Map(),localStorage={getItem:key=>saved.has(key)?saved.get(key):null,setItem:(key,value)=>saved.set(key,String(value))};
 if(officeFx!==null)saved.set('amt-mix-v1',JSON.stringify({ambience:.35,voice:.8,fx:officeFx}));
 const globals={console,Event,EventTarget,CustomEvent,TextEncoder,URL,URLSearchParams,Intl,Date,Math,Number,Set,Promise,performance:{now:()=>now},localStorage,
  window,document,navigator:{userAgent:phoneAgent,userAgentData:phonePlatform?{platform:phonePlatform,mobile:phoneMobile??true}:undefined,language:phoneLanguage,languages:[phoneLanguage],userActivation:{hasBeenActive:fakeAudio},vibrate(pattern){vibrations.push(pattern)}},
  crypto:{getRandomValues(a){a.fill(123);return a}},BuergeramtLink:Link,
  qrcode:()=>({addData(){},make(){},createSvgTag:()=>'<svg></svg>'}),
  setTimeout:(fn,ms)=>later(fn,ms),clearTimeout:clear,setInterval:(fn,ms)=>later(fn,ms,true),clearInterval:clear,
  requestAnimationFrame:fn=>later(fn,16)
 };
 if(synthesis){globals.speechSynthesis=synth;globals.SpeechSynthesisUtterance=class{constructor(text){this.text=text}}}
 const audio={contexts:[],nodes:[],fetches:[],recordings:[],pendingDecodes:[],resolveDecodes(){for(const item of this.pendingDecodes.splice(0))item.resolve({duration:2,numberOfChannels:1})},flushEnded(){for(const node of this.nodes)if(!node.ended&&node.stopped.some(time=>time<=now/1000)){node.ended=true;node.onended?.()}}};
 if(candidatePhone){
  class RecordedAudio{
   constructor(src){this.src=src;this.paused=false;audio.recordings.push(this)}
   play(){later(()=>this.onplaying?.(),16);return Promise.resolve()}
   pause(){this.paused=true}
   end(){this.onended?.()}
   fail(){this.onerror?.()}
  }
  globals.Audio=RecordedAudio;
  window.GermanySimulatorAudioText={candidateClip:(voiceId,text)=>voiceId==='polizei-heinrich-wachtmeister'&&text?`./assets/voices/candidate-dialogue/${voiceId}-phone-01.mp3`:null};
 }
 if(fakeAudio){
  class Param{
   constructor(value=0){this.value=value;this.events=[]}
   setValueAtTime(value,time){this.value=value;this.events.push(['set',value,time]);return this}
   linearRampToValueAtTime(value,time){this.value=value;this.events.push(['linear',value,time]);return this}
   exponentialRampToValueAtTime(value,time){this.value=value;this.events.push(['exponential',value,time]);return this}
   setTargetAtTime(value,time,constant){this.value=value;this.events.push(['target',value,time,constant]);return this}
   cancelScheduledValues(time){this.events.push(['cancel',time]);return this}
  }
  class Node{
   constructor(type){this.kind=type;this.type=type;this.started=[];this.stopped=[];this.connections=[];this.gain=new Param(1);this.frequency=new Param(0);this.playbackRate=new Param(1);this.Q=new Param(1);audio.nodes.push(this)}
   connect(other){this.connections.push(other);return other}
   disconnect(){this.disconnected=true}
   start(time){this.started.push(time)}
   stop(time){this.stopped.push(time??now/1000)}
  }
  class AudioContext{
   constructor(){this.sampleRate=48000;this.state='running';this.destination=new Node('destination');this.gains=[];audio.contexts.push(this)}
   get currentTime(){return now/1000}
   createGain(){const gain=new Node('gain');this.gains.push(gain);return gain}
   createOscillator(){return new Node('oscillator')}
   createBiquadFilter(){return new Node('filter')}
   createBufferSource(){return new Node('buffer-source')}
   createBuffer(channels,frames,rate){return{numberOfChannels:channels,length:frames,sampleRate:rate,getChannelData:()=>new Float32Array(frames)}}
   decodeAudioData(){return new Promise((resolve,reject)=>audio.pendingDecodes.push({resolve,reject}))}
   resume(){this.state='running';return Promise.resolve()}
   close(){this.state='closed';return Promise.resolve()}
  }
  globals.AudioContext=AudioContext;
  globals.fetch=async url=>{audio.fetches.push(String(url));return{ok:true,arrayBuffer:async()=>new ArrayBuffer(16)}};
 }
 Object.assign(window,globals);window.location={hash:phoneCaptions?'#captions=en':''};window.Germany3D={ready:true,setAmtQr(){}};
 if(phoneClock)window.BuergeramtClock=phoneClock;
 const context=vm.createContext(globals);
 vm.runInContext(source('buergeramt-story.js'),context,{filename:'buergeramt-story.js'});
 if(kind==='host')for(const file of ['buergeramt-animation-clock.js','buergeramt-voice-profiles.js','buergeramt-fever.js'])vm.runInContext(source(file),context,{filename:file});
 vm.runInContext(source(kind==='host'?'buergeramt.js':'buergeramt-phone.js'),context,{filename:kind});
 const counts={form:0,cancel:0,close:0},music=[];
 const config={voiceOn:()=>voice,subtitlesOn:()=>phoneCaptions,onForm:()=>counts.form++,onCancel:()=>counts.cancel++,onClose:()=>counts.close++,music:x=>music.push(x),cinematics,cityAudioBusy};
 const level=window.BuergeramtLevel;
 if(kind==='host')level.open(config);
 function key(code,type='keydown'){const event=new Event(type,{cancelable:true});Object.assign(event,{code,repeat:false});window.dispatchEvent(event)}
 function moveTo(x,z){for(const [axis,target,pos,neg] of [['x',x,'KeyD','KeyA'],['z',z,'KeyS','KeyW']]){let steps=0;while(Math.abs(level.view[axis]-target)>.07){if(++steps>300)throw new Error(`Cannot reach ${axis}=${target} from ${JSON.stringify(level.view)}`);const code=level.view[axis]<target?pos:neg;key(code);level.update(Math.min(.05,Math.abs(level.view[axis]-target)/3.6));key(code,'keyup')}}}
 function action(index=0){const button=node('amt-actions').children[index];if(!button)throw new Error(`No action ${index} at ${level.stage}`);button.click();return button}
 function advanceGame(seconds){for(let t=0;t<seconds;t+=.05)level.update(Math.min(.05,seconds-t))}
 function enter(){moveTo(0,-2.6)}
 function enterUntilOmen(){enter();key('KeyE');key('KeyE','keyup');if(level.stage!=='omen')throw new Error(`E encounter did not begin; ${JSON.stringify(level.view)}`)}
 function approachRegistration(){moveTo(-3.3,-2.6);moveTo(-3.3,2.5);moveTo(-4.65,2.5)}
 function register(){enter();Link.instances.at(-1).message({type:'scan',id:'a'.repeat(24)})}
 function wait(){register()}
 function counter(){wait();const link=Link.instances.at(-1);link.message({type:'register',name:'Erika Mustermann'});moveTo(4,-8.15);advanceGame(16);if(level.stage!=='walk-counter')throw new Error(`Expected active call, got ${level.stage}`);level.interact();tick(16);if(!link.sent.some(message=>message.type==='call-arm'))tick(1800);if(link.sent.some(message=>message.type==='call-arm'))link.message({type:'call-ready',id:'grass',atMs:now})}
 function phoneReady(){const link=Link.instances.at(-1);link.emit('connected',{});link.message({type:'ticket',number:'B-223'});return link}
 function incoming(){const link=phoneReady();node('phone-name').value='Erika Mustermann';node('phone-form').dispatchEvent(new Event('submit',{cancelable:true}));link.message({type:'call-arm',id:'grass'});link.message({type:'call',id:'grass',line:window.BuergeramtStory.call.line,ringAtPhoneMs:now,ringAtUtcMs:null,leadMs:2200});return link}
 function hide(){document.hidden=true;document.dispatchEvent(new Event('visibilitychange'))}
 return{window,document,node,tick,now:()=>now,timers,key,moveTo,action,advanceGame,enter,enterUntilOmen,approachRegistration,register,wait,counter,phoneReady,incoming,hide,synth,audio,vibrations,fullscreenRequests,counts,music,config,level,links:Link.instances,context};
}
