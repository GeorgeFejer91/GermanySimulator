import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const source=readFileSync(new URL('../game-hud.js',import.meta.url),'utf8').replace(/^import .*\n/,'');
function hud({reduced=true,audioRate=1}={}){
 let now=0,serial=0,feeds=0,cancellations=0,maskFrames=0;
 const tasks=new Map(),events=new Map(),nodes=new Map();
 const later=(fn,delay=0)=>{const id=++serial;tasks.set(id,{at:now+delay,fn});return id};
 function node(id){
  if(nodes.has(id))return nodes.get(id);
  const handlers=new Map(),classes=new Set(),el={id,hidden:true,open:false,textContent:'',dataset:{},clientHeight:600,rect:{bottom:140,top:700,height:40},style:{removeProperty(){},setProperty(){}},classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c),toggle(c,on){on?classes.add(c):classes.delete(c)}},before(other){other.parentElement=el.parentElement},after(other){other.parentElement=el.parentElement},append(other){other.parentElement=el},setAttribute(){},getClientRects:()=>[],getBoundingClientRect:()=>el.rect,querySelector:selector=>node(id+selector),querySelectorAll:()=>[],contains:other=>other?.parentElement===el,addEventListener:(name,fn)=>handlers.set(name,fn),showModal(){el.open=true},close(){el.open=false;handlers.get('close')?.()},focus(){document.activeElement=el}};
  nodes.set(id,el);return el;
 }
 const ctx={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},clearRect(){},drawImage(){},fillRect(){}};
 const state={started:true,busy:false,lang:'de',energy:100},document={hidden:false,activeElement:null,getElementById:node,createElement:()=>({getContext:()=>ctx,toDataURL(){maskFrames++;return'data:image/png;base64,mask'}}),createComment:()=>node('comment-'+ ++serial),querySelector:()=>node('dock'),querySelectorAll:()=>[],body:node('body'),documentElement:node('html'),fonts:{ready:{then(){}}},addEventListener:(name,fn)=>events.set(name,fn)};
 node('germanness-hud').parentElement=node('city-status');node('mission-title').textContent='ANMELDUNG I';node('mission-text').textContent='Zum Bürgeramt gehen.';
 const context=vm.createContext({document,window:{Germany3DBridge:{getHUDState:()=>state,clearInput(){},playFaxTransition(){feeds++;const start=now;return{duration:1.08,elapsed:()=>(now-start)/1000*audioRate,cancel(){cancellations++}}}}},performance:{now:()=>now},setTimeout:later,clearTimeout:id=>tasks.delete(id),requestAnimationFrame:fn=>later(()=>fn(now),16),cancelAnimationFrame:id=>tasks.delete(id),matchMedia:()=>({matches:reduced}),CSS:{supports:()=>true},MutationObserver:class{observe(){}},ResizeObserver:class{observe(){}},getComputedStyle:()=>({zoom:'1',getPropertyValue:()=>0}),innerWidth:1280,innerHeight:800,addEventListener:(name,fn)=>events.set(name,fn)});
 vm.runInContext(source,context);
 function advance(ms){const end=now+ms;for(let count=0;count<10000;count++){const next=[...tasks].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next){now=end;return}tasks.delete(next[0]);now=next[1].at;next[1].fn()}throw Error('unbounded timer work')}
 const refresh=()=>{context.window.GermanyHUD.refresh();advance(20)};
 advance(20);
 return{node,state,document,advance,refresh,events,get feeds(){return feeds},get cancellations(){return cancellations},get maskFrames(){return maskFrames}};
}

test('Gaussian frames follow audio elapsed time and leave no idle mask work',()=>{
 const h=hud({reduced:false,audioRate:.5});h.advance(1100);assert.equal(h.node('mission-fax').dataset.transition,'arriving','wall time must not complete a still-active audio feed');assert.equal(h.cancellations,0);assert(h.maskFrames>1&&h.maskFrames<35);
 h.advance(1200);assert.equal(h.node('mission-fax').dataset.transition,undefined);assert.equal(h.cancellations,1);const frames=h.maskFrames;h.advance(1000);assert.equal(h.maskFrames,frames,'idle paper must not keep encoding masks');
});

test('fax is readable for 12 seconds, disappears and returns only after a 150-second gap',()=>{
 const h=hud();assert.equal(h.node('mission-fax').hidden,false);assert.equal(h.feeds,1);
 h.advance(12000);assert.equal(h.node('mission-fax').hidden,false);
 h.advance(2200);assert.equal(h.node('mission-fax').hidden,true);assert.equal(h.feeds,2);
 // Reduced motion hides immediately; its short sound completes before the gap.
 h.advance(149000);assert.equal(h.node('mission-fax').hidden,true);
 h.advance(1000);assert.equal(h.node('mission-fax').hidden,false);assert.equal(h.feeds,3);
});

test('warnings retract once, quiet does not immediately replay, changed objectives do',()=>{
 const h=hud();h.advance(2000);h.node('police-bark').hidden=false;h.refresh();assert.equal(h.node('mission-fax').hidden,true);
 h.node('police-bark').hidden=true;h.refresh();h.advance(10000);assert.equal(h.node('mission-fax').hidden,true);assert.equal(h.feeds,1);
 h.node('mission-text').textContent='Wohnungsgeberbestätigung abholen.';h.refresh();assert.equal(h.node('mission-fax').hidden,false);assert.equal(h.node('fax-text').textContent,'Wohnungsgeberbestätigung abholen.');assert.equal(h.feeds,2);
 assert.equal(h.node('mission-announcement').textContent,'ANMELDUNG I · Wohnungsgeberbestätigung abholen.');
});

test('backgrounding cancels the current feed and keeps the reminder gap on resume',()=>{
 const h=hud();h.document.hidden=true;h.events.get('visibilitychange')();assert.equal(h.node('mission-fax').hidden,true);assert.equal(h.cancellations,1);
 h.advance(1000);h.document.hidden=false;h.events.get('visibilitychange')();h.advance(20);assert.equal(h.node('mission-fax').hidden,true);assert.equal(h.feeds,1);
});

test('Germanness stays visible in city play and file pages, hides in the office, and returns on exit',()=>{
 const h=hud();h.state.busy=true;h.refresh();assert.equal(h.node('city-status').hidden,false);
 h.state.busy=false;h.refresh();h.node('file-toggle').onclick();assert.equal(h.node('germanness-hud').parentElement.id,'case-file.file-header');
 h.node('file-close').onclick();assert.equal(h.node('germanness-hud').parentElement.id,'city-status');
 h.document.body.classList.add('amt-inside');h.refresh();assert.equal(h.node('city-status').hidden,true,'office play uses its own HUD');
 h.state.started=false;h.refresh();assert.equal(h.node('city-status').hidden,true,'direct office entry must also hide Germanness');
 h.state.started=true;h.document.body.classList.remove('amt-inside');h.refresh();assert.equal(h.node('city-status').hidden,false,'leaving the office restores Germanness');
});

test('enlarged file anchors trigger whole-document reading and recover when space returns',()=>{
 const h=hud();h.node('file-toggle').onclick();assert.equal(h.node('case-file').dataset.layout,'bounded');
 h.node('case-file.file-header').rect.height=330;h.node('case-file.file-tabs').rect.height=210;h.refresh();assert.equal(h.node('case-file').dataset.layout,'scroll');
 h.node('case-file').clientHeight=900;h.refresh();assert.equal(h.node('case-file').dataset.layout,'bounded');
});

test('fax sound supplies its audio clock, effects bus and cancellation for all scheduled sources',()=>{
 const game=readFileSync(new URL('../game.js',import.meta.url),'utf8'),fn=game.slice(game.indexOf('function playSynthFaxFeed(){'),game.indexOf('\nfunction playFaxFeed('));
 const sources=[],outputs=[],param={setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},bus={},a={currentTime:5,state:'running',sampleRate:100,createGain(){return{gain:param,connect(target){outputs.push(target);return target},disconnect(){}}},createOscillator(){const n={frequency:param,connect(target){return target},start(t){n.startAt=t},stop(t){n.stopAt=t}};sources.push(n);return n},createBufferSource(){return a.createOscillator()},createBuffer:(_,size)=>({getChannelData:()=>new Float32Array(size)}),createBiquadFilter:()=>({frequency:{},Q:{},connect:target=>target})};
 const context=vm.createContext({ensureAudio:()=>a,soundEffectOutput:()=>bus,performance:{now:()=>0}});vm.runInContext(fn+';globalThis.feed=playSynthFaxFeed()',context);
 assert.equal(sources.length,11);assert.equal(context.feed.duration,1.08);assert(outputs.includes(bus));a.currentTime=5.5;assert.equal(context.feed.elapsed(),.5);context.feed.cancel();assert(sources.every(n=>n.stopAt===undefined));
});
